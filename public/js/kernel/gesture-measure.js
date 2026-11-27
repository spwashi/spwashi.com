/**
 * Portable gesture measures and pure stepping primitives.
 *
 * Zero DOM and zero site imports: sits in kernel/ so semantic, runtime,
 * interface, and peer domains (attention.productions, spw.quest,
 * factshift.center, wap.mom, mutex.buzz, tealstripesvibes.com) can share one
 * tactile feel for hold, swipe, horizontal slot scrubbing, ladder/ring
 * stepping, and two-stage pinch arming.
 */

export const GESTURE_MEASURE = /* @__PURE__ */ Object.freeze({
  holdMs: 420,
  swipeMinPx: 48,
  swipeDominance: 1.45,
  scrubStepPx: 28,
  scrubDeadZonePx: 6,
  tapSwallowMs: 360,
});

/**
 * When a horizontal slot scrub commits: each step as it lands (texture.website,
 * <spw-expression>), on lift (attention.productions), or primed for an explicit
 * keep (tealstripesvibes.com). workers/lib/slot-scrub.js carries the same list.
 * Pure annotations let a bundle that reads one measure leave the others behind.
 */
export const SLOT_SCRUB_COMMIT_MODES = /* @__PURE__ */ Object.freeze([
  'live',
  'on-lift',
  'prime-then-keep',
]);

/**
 * Shared pinch thresholds across reading text scale (pinch-text-scale.js) and
 * spatial/optical depth planes (factshift.center, workers/lib/pinch.js).
 */
export const PINCH_MEASURE = /* @__PURE__ */ Object.freeze({
  enter: 1.35,
  keep: 1.16,
  near: 0.82,
  up: 0.65,
  wheel: 200,
  textStepLog2: 0.12,
});

/**
 * Step an index along an ordered ladder or wrapping ring.
 * Returns -1 when empty or when stepping past a non-wrapping, non-clamping edge.
 */
export function stepLadderIndex(index, length, delta = 1, { wrap = false, clamp = false } = {}) {
  if (!Number.isFinite(length) || length <= 0 || !Number.isFinite(delta)) return -1;
  const from = index >= 0 && index < length ? index : 0;
  const next = from + delta;
  if (wrap) return ((next % length) + length) % length;
  if (clamp) return Math.max(0, Math.min(length - 1, next));
  return next >= 0 && next < length ? next : -1;
}

/** Convert horizontal or vertical scrub travel (px) into whole ladder steps. */
export function scrubStepDelta(distancePx, stepPx = GESTURE_MEASURE.scrubStepPx) {
  if (!Number.isFinite(distancePx) || !Number.isFinite(stepPx) || stepPx <= 0) return 0;
  return Math.trunc(distancePx / stepPx);
}

/**
 * Two-stage depth-pinch evaluator matching factshift.center and workers/lib/pinch.js.
 * `keep` / `near` preview the step without committing; `enter` / `up` arm it.
 */
export function pinchThresholdOf(scale, inward = null, outward = null) {
  if (!Number.isFinite(scale)) return { direction: null, action: '', armed: false };
  if (inward && scale >= PINCH_MEASURE.enter) return { direction: 'in', action: `#>enter · ${inward}`, armed: true };
  if (inward && scale >= PINCH_MEASURE.keep) return { direction: 'in', action: `#>keep · ${inward}`, armed: false };
  if (outward && scale <= PINCH_MEASURE.up) return { direction: 'out', action: `^up · ${outward}`, armed: true };
  if (outward && scale <= PINCH_MEASURE.near) return { direction: 'out', action: `^near · ${outward}`, armed: false };
  return { direction: null, action: '', armed: false };
}

/** Format the Spw depth-pinch status line: `@plane · ×1.24 → #>keep · close-up`. */
export function pinchCueOf(plane, scale, action = '') {
  const safeScale = Number.isFinite(scale) ? scale : 1;
  return `@${plane} · ×${safeScale.toFixed(2)}${action ? ` → ${action}` : ''}`;
}

/**
 * Suppress the ghost click that follows a horizontal slot scrub, hold, or swipe release.
 * Installs a one-shot capture-phase click blocker on `host` for `windowMs`. The
 * returned predicate answers true once, for a click that reaches a host's own
 * handler inside the window before the blocker has taken one (a host without
 * EventTarget methods relies on it alone); after the blocker swallows the ghost
 * click, or the window closes, it answers false, so the next real tap lands.
 */
export function swallowsTap(host = globalThis, windowMs = GESTURE_MEASURE.tapSwallowMs) {
  const duration = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : GESTURE_MEASURE.tapSwallowMs;
  const now = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());
  const until = now() + duration;
  let spent = false;
  let timer = 0;

  const detach = () => {
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
    if (host && typeof host.removeEventListener === 'function') {
      host.removeEventListener('click', onClick, true);
    }
  };

  function onClick(event) {
    detach();
    if (spent || now() > until) return;
    spent = true;
    event?.preventDefault?.();
    event?.stopPropagation?.();
  }

  if (host && typeof host.addEventListener === 'function') {
    host.addEventListener('click', onClick, true);
    timer = setTimeout(detach, duration);
  }

  return () => {
    if (spent || now() > until) return false;
    spent = true;
    detach();
    return true;
  };
}
