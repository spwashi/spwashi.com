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

/* CSS reads only prime beats, through data-spw-beat-prime. Any change to an
   attribute that a descendant selector names schedules invalidation for every
   element that selector could match, so the every-tick count stays in
   data-spw-beat, which no stylesheet names, for inspection and JS readers. */
function writeBeat(html, beat) {
  currentBeat = beat;
  html.dataset.spwBeat = String(beat);
  const playing = beat > 0 ? 'on' : 'off';
  if (html.dataset.spwPlaying !== playing) html.dataset.spwPlaying = playing;
  const prime = PRIME_BEATS.has(beat) ? String(beat) : null;
  if (prime) {
    if (html.dataset.spwBeatPrime !== prime) html.dataset.spwBeatPrime = prime;
  } else if ('spwBeatPrime' in html.dataset) {
    delete html.dataset.spwBeatPrime;
  }
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

/* A running cycle keeps its phase when a refresh leaves the interval unchanged:
   settings tuning emits several events per gesture, and restarting the interval
   on each one stalled the beat for as long as the gesture lasted. */
let scheduledInterval = 0;

function stopBeatTimer() {
  if (beatTimer) window.clearInterval(beatTimer);
  beatTimer = null;
  scheduledInterval = 0;
}

function scheduleBeatCycle(html) {
  if (!isRhythmEnabled(html)) {
    stopBeatTimer();
    delete html.dataset.spwBeat;
    delete html.dataset.spwBeatPrime;
    delete html.dataset.spwPlaying;
    currentBeat = 0;
    return;
  }
  /* Hidden documents keep their beat attributes but stop advancing them. */
  if (typeof document !== 'undefined' && document.hidden) {
    stopBeatTimer();
    return;
  }

  const interval = readBeatIntervalMs(html);
  if (beatTimer && interval === scheduledInterval) return;
  stopBeatTimer();
  scheduledInterval = interval;

  beatTimer = window.setInterval(() => {
    writeBeat(html, currentBeat >= BEAT_CADENCE ? 1 : currentBeat + 1);
  }, interval);

  if (!currentBeat) writeBeat(html, 1);
}

export function readMicrointeractionPulseMs(root = document) {
  return readPulseDurationMs(root.documentElement);
}

export function initPulseBeatTuner(root = document) {
  if (initialized) return () => {};
  initialized = true;

  const html = root?.documentElement || (root?.nodeType === 1 ? root : typeof document !== 'undefined' ? document.documentElement : null);
  if (!html) return () => {};

  const controller = new AbortController();
  const { signal } = controller;

  /* One settings gesture arrives as settings-change, settings:changed, and two
     momentum events in the same task; they share one reschedule. */
  let refreshQueued = false;
  const refreshRhythm = () => {
    invalidateTimingCache();
    if (refreshQueued) return;
    refreshQueued = true;
    queueMicrotask(() => {
      refreshQueued = false;
      if (!signal.aborted) scheduleBeatCycle(html);
    });
  };

  let momentumPulseQueued = false;

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
    refreshRhythm();
    if (momentumPulseQueued) return;
    momentumPulseQueued = true;
    queueMicrotask(() => { momentumPulseQueued = false; });
    pulseFreshness(html, 'settings-tuning');
  };

  const onRuntimeTokens = () => {
    if (html?.dataset?.spwSiteRhythm === 'active') refreshRhythm();
  };

  document.addEventListener('spw:interaction-phase', onInteractionPhase, { signal });
  document.addEventListener('spw:component-lifecycle', onComponentLifecycle, { signal });
  document.addEventListener('spw:settings-momentum', onSettingsMomentum, { signal });
  document.addEventListener('spell:momentum', onSettingsMomentum, { signal });
  document.addEventListener('spw:settings-change', refreshRhythm, { signal });
  document.addEventListener('spw:settings:changed', refreshRhythm, { signal });
  document.addEventListener('spw:runtime-tokens-updated', onRuntimeTokens, { signal });
  document.addEventListener('visibilitychange', () => scheduleBeatCycle(html), { signal });

  if (typeof MutationObserver === 'function' && html && html.nodeType === 1) {
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
    stopBeatTimer();
    if (freshnessTimer) window.clearTimeout(freshnessTimer);
    freshnessTimer = null;
    currentBeat = 0;
    delete html.dataset.spwBeat;
    delete html.dataset.spwBeatPrime;
    delete html.dataset.spwPlaying;
    delete html.dataset.spwFreshnessPulse;
    initialized = false;
  }, { once: true });

  return () => controller.abort();
}

export const SPW_PULSE_BEAT_TUNER_CONTRACT = Object.freeze({
  cadence: BEAT_CADENCE,
  primeBeats: Object.freeze([...PRIME_BEATS]),
  freshnessEvent: FRESHNESS_EVENT,
  attributes: Object.freeze({
    beat: 'data-spw-beat',
    playing: 'data-spw-playing',
    freshnessPulse: 'data-spw-freshness-pulse',
    freshnessWeight: 'data-spw-freshness-weight',
    reduceMotion: 'data-spw-reduce-motion',
  }),
  customProperties: Object.freeze([
    '--spw-beat-interval-ms',
    '--spw-microinteraction-pulse-duration',
  ]),
  portableUse:
    'Tunable site cadence and freshness pulse driver matching the 13-beat rhythm and microinteraction duration.',
});

export function describePulseBeatTunerState(root = document) {
  const html = root?.documentElement
    || (typeof document !== 'undefined' ? document.documentElement : null)
    || (root?.nodeType === 1 ? root : null);
  return {
    initialized,
    currentBeat,
    isPrime: PRIME_BEATS.has(currentBeat),
    isPlaying: html?.dataset?.spwPlaying === 'on',
    rhythmEnabled: html ? isRhythmEnabled(html) : false,
    beatIntervalMs: html ? readBeatIntervalMs(html) : 1300,
    pulseDurationMs: html ? readPulseDurationMs(html) : 280,
  };
}

export { FRESHNESS_EVENT, BEAT_CADENCE, PRIME_BEATS };

export const spwModule = {
  updates: ['attr:data-spw-beat-cadence', 'attr:data-spw-pulse-freshness'],
  mount: (mod, ctx, root) => initPulseBeatTuner(root),
};