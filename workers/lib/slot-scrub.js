// Shared horizontal slot-scrub runtime across the visual worker set:
// attention.productions (commit: "on-lift"), texture.website (commit: "live"),
// and tealstripesvibes.com (commit: "prime-then-keep").
//
// Measures and commit vocabularies are held in lockstep with
// public/js/kernel/gesture-measure.js by scripts/build-peer-kit.mjs (--check).
// Each host keeps its own DOM markup and visual voice while sharing the 28px
// scrub cadence, 6px dead-zone lock, keyboard arrow parity, and ghost-click
// suppression (swallowsTap) after pointer release.

export const SCRUB_MEASURE = Object.freeze({
  holdMs: 420,
  swipeMinPx: 48,
  swipeDominance: 1.45,
  stepPx: 28,
  deadZonePx: 6,
  tapSwallowMs: 360,
});

export const SLOT_SCRUB_COMMIT_MODES = Object.freeze([
  "live",
  "on-lift",
  "prime-then-keep",
]);

/** Step an index along an ordered ladder or wrapping ring. */
export function stepLadderIndex(index, length, delta = 1, { wrap = false, clamp = false } = {}) {
  if (!Number.isFinite(length) || length <= 0 || !Number.isFinite(delta)) return -1;
  const from = index >= 0 && index < length ? index : 0;
  const next = from + delta;
  if (wrap) return ((next % length) + length) % length;
  if (clamp) return Math.max(0, Math.min(length - 1, next));
  return next >= 0 && next < length ? next : -1;
}

/** Convert horizontal or vertical scrub travel (px) into whole ladder steps. */
export function scrubStepDelta(distancePx, stepPx = SCRUB_MEASURE.stepPx) {
  if (!Number.isFinite(distancePx) || !Number.isFinite(stepPx) || stepPx <= 0) return 0;
  return Math.trunc(distancePx / stepPx);
}

/**
 * Suppress the ghost click that follows a horizontal slot scrub or swipe release.
 * Installs a one-shot capture-phase click blocker on `host` for `windowMs`. The
 * returned predicate answers true once, for a click that reaches a host's own
 * handler inside the window before the blocker has taken one (a host without
 * EventTarget methods relies on it alone); after the blocker swallows the ghost
 * click, or the window closes, it answers false, so the next real tap lands.
 */
export function swallowsTap(host = globalThis, windowMs = SCRUB_MEASURE.tapSwallowMs) {
  const duration = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : SCRUB_MEASURE.tapSwallowMs;
  const now = () => (typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now());
  const until = now() + duration;
  let spent = false;
  let timer = 0;

  const detach = () => {
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
    if (host && typeof host.removeEventListener === "function") {
      host.removeEventListener("click", onClick, true);
    }
  };

  function onClick(event) {
    detach();
    if (spent || now() > until) return;
    spent = true;
    event?.preventDefault?.();
    event?.stopPropagation?.();
  }

  if (host && typeof host.addEventListener === "function") {
    host.addEventListener("click", onClick, true);
    timer = setTimeout(detach, duration);
  }

  return () => {
    if (spent || now() > until) return false;
    spent = true;
    detach();
    return true;
  };
}

/**
 * Bind horizontal slot scrubbing, tap stepping, and arrow-key stepping on `root`
 * (either a container using event delegation or a single slot button/link).
 *
 * `commit` names the host's commit policy on `root[data-scrub-commit]`:
 *   - "live"            steps write immediately during pointermove (texture.website)
 *   - "on-lift"         previews during pointermove, commits URL/take on lift (attention.productions)
 *   - "prime-then-keep" holds/primes the slot for explicit Enter/Keep commit (tealstripesvibes.com)
 *
 * The window hears pointermove/up/cancel only while a press is live, so a host
 * that rebuilds its slots on every step leaves no listeners behind.
 */
export function bindSlotScrub(root, {
  selector = ".slot, .spw-slot",
  commit = "live",
  stepPx = SCRUB_MEASURE.stepPx,
  deadZonePx = SCRUB_MEASURE.deadZonePx,
  keyOf = (el) => el?.dataset?.key || el?.dataset?.slot || "",
  findSlot = (key) => root?.querySelector?.(`[data-key="${key}"], [data-slot="${key}"]`) || root,
  onStart = null,
  onStep = null,
  onRelease = null,
  onTap = null,
  onKey = null,
} = {}) {
  if (!root || typeof root.addEventListener !== "function") return () => {};
  const commitMode = SLOT_SCRUB_COMMIT_MODES.includes(commit) ? commit : "live";
  root.setAttribute?.("data-scrub-commit", commitMode);

  const view = root.ownerDocument?.defaultView || globalThis;
  let active = null;
  let checkSwallowed = () => false;

  const resolveSlot = (target) => {
    if (!target) return null;
    if (root.matches?.(selector)) return root;
    const found = target.closest?.(selector);
    return found && (root === found || root.contains?.(found)) ? found : null;
  };

  const markSlot = (slotEl, scrubbing) => {
    if (!slotEl) return;
    slotEl.classList?.toggle("scrubbing", scrubbing);
    if (scrubbing) slotEl.setAttribute?.("data-scrubbing", "true");
    else slotEl.removeAttribute?.("data-scrubbing");
  };

  const track = (on) => {
    const method = on ? "addEventListener" : "removeEventListener";
    view[method]?.("pointermove", onPointerMove);
    view[method]?.("pointerup", finish);
    view[method]?.("pointercancel", finish);
  };

  const onPointerDown = (event) => {
    if (event.button && event.button !== 0) return;
    const slot = resolveSlot(event.target);
    if (!slot) return;
    const key = keyOf(slot);
    if (!key) return;
    if (slot.tagName === "A" || event.pointerType === "mouse") event.preventDefault();
    const base = onStart ? onStart(key, slot, event) : null;
    active = {
      key,
      slot,
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      acc: 0,
      delta: 0,
      moved: false,
      base,
    };
    markSlot(slot, true);
    track(true);
    try { slot.setPointerCapture?.(event.pointerId); } catch { /* synthetic or uncapturable pointer */ }
  };

  const onPointerMove = (event) => {
    if (!active) return;
    if (active.pointerId != null && event.pointerId != null && event.pointerId !== active.pointerId) return;
    const totalDx = event.clientX - active.startX;
    if (!active.moved && Math.abs(totalDx) < deadZonePx) return;
    const dx = event.clientX - active.lastX;
    active.lastX = event.clientX;
    active.acc += dx;
    while (Math.abs(active.acc) >= stepPx) {
      const dir = active.acc > 0 ? 1 : -1;
      active.acc -= dir * stepPx;
      active.delta += dir;
      active.moved = true;
      onStep?.(active.key, dir, { delta: active.delta, base: active.base, live: true, slot: active.slot });
      const liveSlot = findSlot(active.key) || active.slot;
      markSlot(liveSlot, true);
    }
  };

  const finish = (event) => {
    if (!active) return;
    if (active.pointerId != null && event?.pointerId != null && event.pointerId !== active.pointerId) return;
    const done = active;
    active = null;
    track(false);
    const liveSlot = findSlot(done.key) || done.slot;
    markSlot(liveSlot, false);
    try {
      if (event?.pointerId != null) liveSlot?.releasePointerCapture?.(event.pointerId);
    } catch { /* ignore if not captured */ }
    if (!done.moved) return;
    checkSwallowed = swallowsTap(view);
    onRelease?.(done.key, { delta: done.delta, base: done.base, slot: liveSlot, commit: commitMode });
  };

  const onClick = (event) => {
    const slot = resolveSlot(event.target);
    // A modified click on a link opens it elsewhere; on a button, shift steps back (texture.website).
    if (!slot || event.metaKey || event.ctrlKey || (event.shiftKey && slot.tagName === "A") || (event.button && event.button !== 0)) return;
    if (checkSwallowed()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!onTap) return;
    event.preventDefault();
    onTap(keyOf(slot), event, slot);
  };

  const onKeyDown = (event) => {
    const slot = resolveSlot(event.target);
    if (!slot) return;
    const by = event.key === "ArrowRight" || event.key === "ArrowUp"
      ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowDown"
        ? -1
        : 0;
    if (!by) return;
    event.preventDefault();
    event.stopPropagation();
    const key = keyOf(slot);
    if (onKey) onKey(key, by, event, slot);
    else onStep?.(key, by, { delta: by, base: null, live: false, slot });
  };

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeyDown);

  return () => {
    root.removeEventListener("pointerdown", onPointerDown);
    track(false);
    active = null;
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKeyDown);
  };
}
