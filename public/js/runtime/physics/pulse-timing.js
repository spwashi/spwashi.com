/**
 * pulse-timing.js
 * ---------------------------------------------------------------------------
 * The two timing tokens the site keeps rhythm by, read once and cached:
 * --spw-beat-interval-ms and --spw-microinteraction-pulse-duration.
 *
 * A leaf on purpose. Search, key events, progression and variant selection
 * only need the pulse duration; importing it from the tuner made each of them
 * carry the tuner, and in a built site the whole idle pack the tuner rides in.
 */

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

export function invalidateTimingCache() {
  cachedBeatInterval = 0;
  cachedPulseDuration = 0;
}

function bindTimingInvalidation() {
  if (invalidationBound || typeof document === 'undefined') return;
  invalidationBound = true;
  ['spw:settings-change', 'spw:settings:changed', 'spw:settings-momentum', 'spw:runtime-tokens-updated']
    .forEach((type) => document.addEventListener(type, invalidateTimingCache));
}

/* The settings engine projects both timing tokens inline on <html>, and the
   cache is invalidated by the same settings change that rewrote root style, so
   the first read after a change used to force a full-page style recalculation
   in script. The inline projection is read first; computed style remains the
   fallback before the engine has applied. */
const inlineRootToken = (html, name) => html?.style?.getPropertyValue?.(name).trim() || '';

export function readBeatIntervalMs(html) {
  if (cachedBeatInterval) return cachedBeatInterval;
  const inline = inlineRootToken(html, '--spw-beat-interval-ms');
  if (!inline && typeof getComputedStyle !== 'function') return 1300;
  bindTimingInvalidation();
  const ms = inline
    ? (Number.isFinite(Number.parseFloat(inline)) ? Number.parseFloat(inline) : 1300)
    : readNumber(getComputedStyle(html), '--spw-beat-interval-ms', 1300);
  cachedBeatInterval = Math.max(520, Math.min(2800, Math.round(ms)));
  return cachedBeatInterval;
}

export function readPulseDurationMs(html) {
  if (cachedPulseDuration) return cachedPulseDuration;
  const inline = inlineRootToken(html, '--spw-microinteraction-pulse-duration');
  if (!inline && typeof getComputedStyle !== 'function') return 280;
  bindTimingInvalidation();
  const raw = inline || getComputedStyle(html).getPropertyValue('--spw-microinteraction-pulse-duration').trim();
  const parsed = Number.parseInt(raw, 10);
  cachedPulseDuration = Number.isFinite(parsed) && parsed > 80 ? parsed : 280;
  return cachedPulseDuration;
}

export function readMicrointeractionPulseMs(root = document) {
  return readPulseDurationMs(root.documentElement);
}
