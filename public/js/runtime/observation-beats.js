/**
 * Observation Beats
 *
 * A small, debug-gated primitive for "reasonable batch measurements" and
 * cyclical rule application windows. Generalizes the 5s fixed window from
 * layout-shift-audit into a reusable, event-aware, cauldron-compatible beat.
 *
 * Philosophy alignment:
 * - Beats are short, intentional observation cycles (not constant observers).
 * - They produce coherent, flushable artifacts (semantic + visual + context).
 * - They can be triggered by user gesture, interaction loop phases, cauldron state,
 *   or explicit QA mode.
 * - Lifecycle-aware: beats can inherit or emit cauldron-like phases (gathering, resonant, mature).
 *
 * Gating: Everything is a no-op or extremely cheap unless a debug/QA flag is active
 * (following the exact pattern of layout-shift-audit).
 */

import { bus } from '/public/js/kernel/bus.js';
import { readCauldronState } from '/public/js/interface/cauldron/contract.js';
import {
  createSpwLogger,
  snapshotInstrumentationTarget,
  SPW_LOG_RELATIONSHIPS,
} from '/public/js/kernel/instrumentation.js';
import { snapshotCompositionBox } from '/public/js/runtime/composition-box-model.js';
import {
  writeDatasetValue,
  writeDatasetValues,
} from '/public/js/kernel/dom-contracts.js';

const logger = createSpwLogger('observation-beats', {
  namespace: 'observation-beats',
  role: 'qa',
  metaphor: 'rhythm',
});

export const BEAT_STATES = Object.freeze({
  IDLE: 'idle',
  GATHERING: 'gathering',
  RESONANT: 'resonant',
  MATURE: 'mature',
  FLUSHED: 'flushed',
});

export const BEAT_REASONS = Object.freeze({
  MANUAL: 'manual',
  QA_MODE: 'qa-mode',
  INTERACTION_LOOP: 'interaction-loop',
  CAULDRON_PHASE: 'cauldron-phase',
  FRAME_CHANGE: 'frame-change',
  TIMEOUT: 'timeout',
});

const DEFAULT_WINDOW_MS = 5000; // Matches the successful precedent in layout-shift-audit

let activeBeats = new Set();
let initialized = false;
let lastFlushPayload = null;

function isDebugQAEnabled() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const debug = (params.get('debug') || params.get('spw-debug') || '').toLowerCase();
  const qa = (params.get('qa') || params.get('spw-qa') || '').toLowerCase();
  const mode = (params.get('mode') || params.get('spw-mode') || '').toLowerCase();

  return debug.includes('qa') || debug.includes('beat') || debug.includes('agent') ||
         qa.includes('screenshot') || qa.includes('beat') ||
         mode.includes('qa') || mode.includes('screenshot-qa');
}

function getWindowMs() {
  if (typeof window === 'undefined') return DEFAULT_WINDOW_MS;
  const params = new URLSearchParams(window.location.search);
  const explicit = parseInt(params.get('beat-window') || params.get('spw-beat-window') || '', 10);
  if (Number.isFinite(explicit) && explicit > 200 && explicit < 30000) return explicit;

  const root = document.documentElement;
  const cssVal = root?.style?.getPropertyValue?.('--spw-qa-beat-window-ms') || getComputedStyle(root).getPropertyValue('--spw-qa-beat-window-ms');
  const parsed = parseInt(cssVal, 10);
  return Number.isFinite(parsed) && parsed > 200 ? parsed : DEFAULT_WINDOW_MS;
}

function readRoutePosition() {
  if (typeof window === 'undefined') return {};
  const now = new Date();
  const activeFrame = document.querySelector('.site-frame[data-state~="active"], .site-frame:target, #home-frame');
  const activeRect = activeFrame?.getBoundingClientRect?.();

  return {
    route: window.location.pathname || '/',
    hash: window.location.hash || '',
    timestamp: now.toISOString(),
    localHour: now.getHours(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    scroll: {
      x: Math.round(window.scrollX || 0),
      y: Math.round(window.scrollY || 0),
      progress: Math.round(((window.scrollY || 0) / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)) * 1000) / 1000,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    activeFrame: activeFrame ? {
      selector: activeFrame.id ? `#${activeFrame.id}` : activeFrame.dataset.spwFeature || activeFrame.tagName.toLowerCase(),
      rect: activeRect ? {
        x: Math.round(activeRect.x),
        y: Math.round(activeRect.y),
        width: Math.round(activeRect.width),
        height: Math.round(activeRect.height),
      } : null,
      semantic: snapshotInstrumentationTarget(activeFrame, { includeText: false }),
      box: snapshotCompositionBox(activeFrame),
    } : null,
  };
}

function readAmbientContext() {
  const root = document.documentElement;
  const body = document.body;
  return {
    position: readRoutePosition(),
    surface: body?.dataset?.spwSurface || '',
    context: body?.dataset?.spwContext || '',
    wonder: body?.dataset?.spwWonder || '',
    pageModes: body?.dataset?.spwPageModes || '',
    developmentalClimate: root?.dataset?.spwDevelopmentalClimate || body?.dataset?.spwDevelopmentalClimate || '',
    colorMode: root?.dataset?.spwColorMode || '',
    applicationMode: root?.dataset?.spwApplicationMode || root?.dataset?.spwDebugMode || '',
  };
}

/**
 * Creates and starts a new observation beat window.
 * Returns a handle with .flush(), .cancel(), and metadata.
 */
export function createBeatWindow(durationMs = getWindowMs(), options = {}) {
  if (!isDebugQAEnabled()) {
    return { id: null, state: BEAT_STATES.IDLE, flush: () => {}, cancel: () => {} };
  }

  const id = `beat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startTime = performance.now();
  const windowMs = durationMs || getWindowMs();
  const reason = options.reason || BEAT_REASONS.MANUAL;

  const beat = {
    id,
    state: BEAT_STATES.GATHERING,
    startTime,
    windowMs,
    reason,
    reasonDetail: options.reasonDetail || '',
    measurements: [],
    snapshots: [],
    contextAtStart: readAmbientContext(),
    cauldronPhaseAtStart: readCauldronState(document.documentElement).phase || '',
  };

  activeBeats.add(beat);

  const root = document.documentElement;
  writeDatasetValues(root, {
    spwActiveBeat: id,
    spwActiveBeatReason: reason,
    spwActiveBeatState: BEAT_STATES.GATHERING,
    spwBeatWindowMs: String(windowMs),
  });

  bus.emit('spw:beat:start', {
    id,
    reason,
    windowMs,
    startTime,
    cauldronPhase: beat.cauldronPhaseAtStart,
    lifecycle: { tiedTo: 'qa-observation', state: 'gathering' },
  });

  logger.debug('observation beat started', { id, reason, windowMs });

  // Auto-flush timer (the "cyclical" part)
  const timer = setTimeout(() => {
    if (beat.state === BEAT_STATES.GATHERING || beat.state === BEAT_STATES.RESONANT) {
      flushBeat(beat, BEAT_REASONS.TIMEOUT);
    }
  }, windowMs + 50);

  beat._timer = timer;

  // Simple state progression based on time (mimics cauldron lifecycle)
  const progressTimer = setInterval(() => {
    if (beat.state === BEAT_STATES.FLUSHED) {
      clearInterval(progressTimer);
      return;
    }
    const elapsed = performance.now() - startTime;
    const progress = elapsed / windowMs;

    if (progress > 0.75 && beat.state !== BEAT_STATES.MATURE) {
      beat.state = BEAT_STATES.MATURE;
      writeDatasetValue(root, 'spwActiveBeatState', BEAT_STATES.MATURE);
    } else if (progress > 0.35 && beat.state === BEAT_STATES.GATHERING) {
      beat.state = BEAT_STATES.RESONANT;
      writeDatasetValue(root, 'spwActiveBeatState', BEAT_STATES.RESONANT);
    }
  }, 120);

  beat._progressTimer = progressTimer;

  return {
    id,
    state: () => beat.state,
    flush: (flushReason) => flushBeat(beat, flushReason || BEAT_REASONS.MANUAL),
    cancel: () => cancelBeat(beat),
    addMeasurement: (m) => beat.measurements.push({ t: performance.now() - startTime, ...m }),
    addSnapshot: (s) => beat.snapshots.push({ t: performance.now() - startTime, ...s }),
  };
}

function flushBeat(beat, reason) {
  if (!beat || beat.state === BEAT_STATES.FLUSHED) return null;

  clearTimeout(beat._timer);
  clearInterval(beat._progressTimer);

  beat.state = BEAT_STATES.FLUSHED;
  const endTime = performance.now();
  const duration = Math.round(endTime - beat.startTime);

  const payload = {
    id: beat.id,
    reason: beat.reason,
    flushReason: reason,
    duration,
    windowMs: beat.windowMs,
    measurementCount: beat.measurements.length,
    snapshotCount: beat.snapshots.length,
    cauldronPhaseStart: beat.cauldronPhaseAtStart,
    cauldronPhaseEnd: readCauldronState(document.documentElement).phase || '',
    contextStart: beat.contextAtStart,
    contextEnd: readAmbientContext(),
    measurements: beat.measurements.slice(0, 50),
    snapshots: beat.snapshots.slice(0, 20),
    timestamp: Date.now(),
  };
  lastFlushPayload = payload;

  bus.emit('spw:beat:flush', {
    ...payload,
    lifecycle: { tiedTo: 'qa-observation', state: 'flushed', normalized: 'mature → artifact produced' },
  });
  logger.info('observation beat flushed', payload, SPW_LOG_RELATIONSHIPS.MEASURE);

  const root = document.documentElement;
  writeDatasetValues(root, {
    spwLastBeatId: beat.id,
    spwLastBeatDuration: String(duration),
    spwLastBeatFlushReason: reason,
  });
  delete root.dataset.spwActiveBeat;
  delete root.dataset.spwActiveBeatState;
  delete root.dataset.spwActiveBeatReason;
  delete root.dataset.spwBeatWindowMs;

  activeBeats.delete(beat);

  return payload;
}

function cancelBeat(beat) {
  if (!beat) return;
  clearTimeout(beat._timer);
  clearInterval(beat._progressTimer);
  beat.state = BEAT_STATES.IDLE;
  activeBeats.delete(beat);

  if (document.documentElement?.dataset?.spwActiveBeat === beat.id) {
    delete document.documentElement.dataset.spwActiveBeat;
    delete document.documentElement.dataset.spwActiveBeatState;
    delete document.documentElement.dataset.spwActiveBeatReason;
    delete document.documentElement.dataset.spwBeatWindowMs;
  }
}

export function getActiveBeats() {
  return Array.from(activeBeats);
}

/**
 * Convenience: start a beat tuned for screenshot/QA capture.
 * Often paired with "Screenshot QA Mode".
 */
export function startQABeat(options = {}) {
  return createBeatWindow(options.windowMs, {
    reason: BEAT_REASONS.QA_MODE,
    ...options,
  });
}

/**
 * One-shot artifact capture helper.
 * Collects current semantic context + any active beat data.
 * Designed to be the payload for "artifact export".
 */
export function captureCurrentBeatArtifact(extra = {}) {
  const now = performance.now();
  const root = document.documentElement;

  const artifact = {
    type: 'spw-qa-artifact',
    version: '0.1',
    capturedAt: Date.now(),
    mode: root.dataset.spwPageModes || root.dataset.spwDebugMode || 'normal',
    cauldronPhase: readCauldronState(root).phase || '',
    sizeContext: root.dataset.spwSizeContext || '',
    contentTone: root.dataset.spwContentTone || '',
    context: readAmbientContext(),
    activeBeats: getActiveBeats().map(b => ({
      id: b.id,
      state: b.state,
      reason: b.reason,
      durationSoFar: Math.round(now - b.startTime),
      contextAtStart: b.contextAtStart,
    })),
    ...extra,
  };

  bus.emit('spw:qa:artifact-captured', artifact);
  return artifact;
}

export function initObservationBeats(ctx = {}) {
  if (initialized) return;
  initialized = true;

  // Allow external triggers (e.g. from gestures or QA UI)
  bus.on('spw:beat:request', (detail) => {
    if (!isDebugQAEnabled()) return;
    createBeatWindow(detail?.windowMs, detail);
  });

  bus.on('spw:qa:enter-screenshot', () => {
    if (isDebugQAEnabled()) {
      startQABeat({ reasonDetail: 'screenshot-qa-entry' });
    }
  });

  // Auto-start a short beat when entering strong debug/QA contexts (guarded)
  if (isDebugQAEnabled()) {
    // Don't auto-start on every load — only on explicit signals or first user action in QA flow.
    // This keeps it respectful.
  }

  return {
    createBeatWindow,
    startQABeat,
    captureCurrentBeatArtifact,
    getActiveBeats,
  };
}

export { readRoutePosition, readAmbientContext };

export const OBSERVATION_BEATS_CONTRACT = Object.freeze({
  states: BEAT_STATES,
  reasons: BEAT_REASONS,
  defaultWindowMs: DEFAULT_WINDOW_MS,
  dataAttributes: [
    'data-spw-active-beat',
    'data-spw-active-beat-reason',
    'data-spw-active-beat-state',
    'data-spw-last-beat-id',
    'data-spw-last-beat-duration',
  ],
  lifecycle: {
    tiesTo: ['page', 'region', 'component', 'cauldron', 'interaction-loop'],
    normalizedStates: {
      gathering: 'active collection / measurement window open',
      resonant: 'multiple signals or ingredients present',
      mature: 'ready for flush / crystallization',
      flushed: 'artifact produced; state archived in last-beat attrs',
    },
  },
});

/** Snapshot for inspectors, __SPW_SITE__, and agent surfaces */
export function snapshotObservationBeats() {
  return {
    active: getActiveBeats().map(b => ({
      id: b.id,
      state: b.state,
      reason: b.reason,
      durationSoFar: Math.round(performance.now() - b.startTime),
      windowMs: b.windowMs,
    })),
    contract: OBSERVATION_BEATS_CONTRACT,
    lastFlush: lastFlushPayload,
  };
}
