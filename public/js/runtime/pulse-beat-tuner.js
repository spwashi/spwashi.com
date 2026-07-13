/**
 * pulse-beat-tuner.js
 * ---------------------------------------------------------------------------
 * Tunable site rhythm: baker's-dozen beat cycle + freshness pulses driven by
 * settings tokens (--spw-beat-interval-ms, --spw-freshness-weight) and live
 * interaction/component lifecycle events.
 */

const BEAT_CADENCE = 13;
const PRIME_BEATS = new Set([1, 5, 9, 13]);
const FRESHNESS_EVENT = 'spw:freshness-pulse';

let initialized = false;
let beatTimer = null;
let freshnessTimer = null;
let currentBeat = 0;

function readNumber(style, name, fallback) {
  const raw = style.getPropertyValue(name).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/* Timing tokens are read on hot event paths (every interaction-phase,
   component-lifecycle, and ecology emit). Each getComputedStyle call forces a
   style recalculation against the full stylesheet, so cache until a settings
   or runtime-token change invalidates. */
let cachedBeatInterval = 0;
let cachedPulseDuration = 0;
let invalidationBound = false;

function invalidateTimingCache() {
  cachedBeatInterval = 0;
  cachedPulseDuration = 0;
}

function bindTimingInvalidation() {
  if (invalidationBound || typeof document === 'undefined') return;
  invalidationBound = true;
  ['spw:settings-change', 'spw:settings:changed', 'spw:settings-momentum', 'spw:runtime-tokens-updated']
    .forEach((type) => document.addEventListener(type, invalidateTimingCache));
}

function readBeatIntervalMs(html) {
  if (typeof getComputedStyle !== 'function') return 1300;
  if (cachedBeatInterval) return cachedBeatInterval;
  bindTimingInvalidation();
  const style = getComputedStyle(html);
  const ms = readNumber(style, '--spw-beat-interval-ms', 1300);
  cachedBeatInterval = Math.max(520, Math.min(2800, Math.round(ms)));
  return cachedBeatInterval;
}

function readPulseDurationMs(html) {
  if (typeof getComputedStyle !== 'function') return 280;
  if (cachedPulseDuration) return cachedPulseDuration;
  bindTimingInvalidation();
  const style = getComputedStyle(html);
  const raw = style.getPropertyValue('--spw-microinteraction-pulse-duration').trim();
  const parsed = Number.parseInt(raw, 10);
  cachedPulseDuration = Number.isFinite(parsed) && parsed > 80 ? parsed : 280;
  return cachedPulseDuration;
}

function isRhythmEnabled(html) {
  if (html.dataset.spwReduceMotion === 'on') return false;
  if (html.dataset.spwAnimationThrottling === 'heavy') return false;
  const freshness = Number.parseFloat(html.dataset.spwFreshnessWeight || '');
  if (Number.isFinite(freshness) && freshness < 0.2) return false;
  return true;
}

function writeBeat(html, beat) {
  currentBeat = beat;
  html.dataset.spwBeat = String(beat);
  html.dataset.spwPlaying = beat > 0 ? 'on' : 'off';
  if (PRIME_BEATS.has(beat)) {
    pulseFreshness(html, 'beat-prime', { beat });
  }
}

function pulseFreshness(html, source = 'interaction', detail = {}) {
  if (!html) return;
  const duration = readPulseDurationMs(html);
  html.dataset.spwFreshnessPulse = source;
  document.dispatchEvent(new CustomEvent(FRESHNESS_EVENT, {
    detail: { source, beat: currentBeat, ...detail },
    bubbles: true,
  }));

  if (freshnessTimer) window.clearTimeout(freshnessTimer);
  freshnessTimer = window.setTimeout(() => {
    delete html.dataset.spwFreshnessPulse;
  }, duration);
}

function scheduleBeatCycle(html) {
  if (beatTimer) {
    window.clearInterval(beatTimer);
    beatTimer = null;
  }
  if (!isRhythmEnabled(html)) {
    delete html.dataset.spwBeat;
    delete html.dataset.spwPlaying;
    currentBeat = 0;
    return;
  }

  const interval = readBeatIntervalMs(html);
  let beat = currentBeat || 0;

  beatTimer = window.setInterval(() => {
    beat = beat >= BEAT_CADENCE ? 1 : beat + 1;
    writeBeat(html, beat);
  }, interval);

  if (!currentBeat) writeBeat(html, 1);
}

export function readMicrointeractionPulseMs(root = document) {
  return readPulseDurationMs(root.documentElement);
}

export function initPulseBeatTuner(root = document) {
  if (initialized) return () => {};
  initialized = true;

  const html = root.documentElement;
  const controller = new AbortController();
  const { signal } = controller;

  const refreshRhythm = () => {
    invalidateTimingCache();
    scheduleBeatCycle(html);
  };

  const onInteractionPhase = (event) => {
    const phase = event.detail?.phase;
    if (!phase || phase === 'idle') return;
    if (!isRhythmEnabled(html)) return;
    pulseFreshness(html, `phase-${phase}`, { phase });
  };

  const onComponentLifecycle = (event) => {
    const beat = event.detail?.beat;
    if (!beat || !isRhythmEnabled(html)) return;
    pulseFreshness(html, 'component-lifecycle', event.detail || {});
  };

  const onSettingsMomentum = () => {
    if (!isRhythmEnabled(html)) return;
    pulseFreshness(html, 'settings-tuning');
    refreshRhythm();
  };

  const onRuntimeTokens = () => {
    if (html.dataset.spwSiteRhythm === 'active') refreshRhythm();
  };

  document.addEventListener('spw:interaction-phase', onInteractionPhase, { signal });
  document.addEventListener('spw:component-lifecycle', onComponentLifecycle, { signal });
  document.addEventListener('spw:settings-momentum', onSettingsMomentum, { signal });
  document.addEventListener('spell:momentum', onSettingsMomentum, { signal });
  document.addEventListener('spw:settings-change', refreshRhythm, { signal });
  document.addEventListener('spw:settings:changed', refreshRhythm, { signal });
  document.addEventListener('spw:runtime-tokens-updated', onRuntimeTokens, { signal });

  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver((records) => {
      const relevant = records.some((record) => (
        record.type === 'attributes'
        && ['data-spw-reduce-motion', 'data-spw-freshness-weight', 'data-spw-animation-throttling'].includes(record.attributeName)
      ));
      if (relevant) refreshRhythm();
    });
    observer.observe(html, {
      attributes: true,
      attributeFilter: ['data-spw-reduce-motion', 'data-spw-freshness-weight', 'data-spw-animation-throttling'],
    });
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  }

  refreshRhythm();

  controller.signal.addEventListener('abort', () => {
    if (beatTimer) window.clearInterval(beatTimer);
    if (freshnessTimer) window.clearTimeout(freshnessTimer);
    beatTimer = null;
    freshnessTimer = null;
    currentBeat = 0;
    delete html.dataset.spwBeat;
    delete html.dataset.spwPlaying;
    delete html.dataset.spwFreshnessPulse;
    initialized = false;
  }, { once: true });

  return () => controller.abort();
}

export { FRESHNESS_EVENT, BEAT_CADENCE };