/**
 * engagement.js — when an event is a reader's intent, not a passing touch.
 *
 * A module that only answers a reader should arrive when a reader engages
 * what it answers, not on every page load. This decides that one thing —
 * whether a host was engaged — and hands the resolved engagement to the
 * caller. It does not interpret verbs (tap:prime, hold:inspect); the module
 * that mounts does that, with the engagement that woke it in hand.
 *
 *   focus   focusin inside a host              immediately
 *   key     keydown with focus inside a host   immediately
 *   menu    contextmenu on a host              immediately
 *   press   pointerdown on a host              mouse and pen immediately; a touch
 *                                              on lift (tap) or at a hold, and not
 *                                              at all when the browser takes it for
 *                                              a scroll (pointercancel) or it slides
 *   hover   pointerover by mouse or pen        after a dwell; a pointer passing
 *                                              through is not an engagement
 *
 * Each entry fires at most once per host. onEngage returns 'done' to retire
 * the entry; the listeners go when every entry is retired or disarm() runs.
 *
 * Approach comes before engagement: a touch landing, a pointer arriving, a
 * focus. onApproach (optional) hears it once per host, before intent resolves,
 * so a caller can prime what an engagement would need — warm an import — and
 * lose nothing but that work if the touch turns into a scroll.
 * Listeners are capture and passive, so arming never delays a scroll.
 */

export const ENGAGE_KINDS = Object.freeze(['press', 'hover', 'focus', 'key', 'menu']);

const EVENTS_BY_KIND = Object.freeze({
  press: ['pointerdown', 'pointerup', 'pointercancel', 'pointermove'],
  hover: ['pointerover', 'pointerout'],
  focus: ['focusin'],
  key: ['keydown'],
  menu: ['contextmenu'],
});

const TOUCH_SLOP_PX = 10;
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

function elementOf(value) {
  return value && typeof value.closest === 'function' ? value : null;
}

export function armEngagement({
  entries = [],
  onEngage,
  onApproach,
  root = globalThis.document,
  dwellMs = 140,
  holdMs = 450,
  now = () => globalThis.performance?.now?.() ?? Date.now(),
  setTimer = (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimer = (id) => globalThis.clearTimeout(id),
} = {}) {
  const live = new Map();
  for (const entry of entries) {
    const kinds = (entry?.kinds || []).filter((kind) => ENGAGE_KINDS.includes(kind));
    if (entry?.key && entry.selector && kinds.length) live.set(entry.key, { ...entry, kinds, engaged: new WeakSet(), approached: new WeakSet() });
  }
  const types = [...new Set([...live.values()].flatMap((entry) => entry.kinds.flatMap((kind) => EVENTS_BY_KIND[kind])))];
  const options = { capture: true, passive: true };
  const touches = new Map();
  let hover = null;
  let armed = Boolean(root && types.length);

  const matches = (kind, target) => {
    const found = [];
    const el = elementOf(target);
    if (!el) return found;
    // Typing into a field is not engaging the region around it: focus and keys
    // in an editable element count only for a host that is that element.
    const editable = (kind === 'focus' || kind === 'key') && Boolean(el.matches?.(EDITABLE_SELECTOR));
    for (const entry of live.values()) {
      if (!entry.kinds.includes(kind)) continue;
      const host = el.closest(entry.selector);
      if (!host || entry.engaged.has(host) || (editable && host !== el)) continue;
      found.push({ entry, host });
    }
    return found;
  };

  const approach = (kind, event, found) => {
    if (typeof onApproach !== 'function') return;
    for (const { entry, host } of found) {
      if (!live.has(entry.key) || entry.approached.has(host)) continue;
      entry.approached.add(host);
      onApproach(entry, { kind, type: event?.type || '', host, event, at: now() });
    }
  };

  const engage = (kind, resolution, event, found) => {
    approach(kind, event, found);
    for (const { entry, host } of found) {
      if (!live.has(entry.key) || entry.engaged.has(host)) continue;
      entry.engaged.add(host);
      const verdict = onEngage?.(entry, { kind, resolution, type: event?.type || '', host, event, at: now() });
      if (verdict === 'done') live.delete(entry.key);
    }
    if (!live.size) disarm();
  };

  const clearTouch = (id) => {
    const pending = touches.get(id);
    if (!pending) return;
    clearTimer(pending.timer);
    touches.delete(id);
  };

  const clearHover = () => {
    if (!hover) return;
    clearTimer(hover.timer);
    hover = null;
  };

  const handle = (event) => {
    switch (event.type) {
      case 'focusin':
        engage('focus', 'focus', event, matches('focus', event.target));
        break;
      case 'keydown':
        engage('key', 'key', event, matches('key', event.target));
        break;
      case 'contextmenu':
        engage('menu', 'menu', event, matches('menu', event.target));
        break;
      case 'pointerdown': {
        const found = matches('press', event.target);
        if (!found.length) break;
        if (event.pointerType !== 'touch') {
          engage('press', 'press', event, found);
          break;
        }
        clearTouch(event.pointerId);
        approach('press', event, found);
        const pending = { found, event, x: event.clientX, y: event.clientY, timer: 0 };
        pending.timer = setTimer(() => {
          touches.delete(event.pointerId);
          engage('press', 'hold', event, pending.found);
        }, holdMs);
        touches.set(event.pointerId, pending);
        break;
      }
      case 'pointermove': {
        const pending = touches.get(event.pointerId);
        if (pending && Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > TOUCH_SLOP_PX) clearTouch(event.pointerId);
        break;
      }
      case 'pointerup': {
        const pending = touches.get(event.pointerId);
        if (!pending) break;
        clearTouch(event.pointerId);
        engage('press', 'tap', pending.event, pending.found);
        break;
      }
      case 'pointercancel':
        // The browser took the touch for a scroll; that is not an engagement.
        clearTouch(event.pointerId);
        break;
      case 'pointerover': {
        if (event.pointerType === 'touch') break;
        const found = matches('hover', event.target);
        if (!found.length || (hover && found.every(({ host }) => hover.found.some((f) => f.host === host)))) break;
        clearHover();
        approach('hover', event, found);
        const pending = { found, event, timer: 0 };
        pending.timer = setTimer(() => {
          if (hover === pending) hover = null;
          engage('hover', 'dwell', event, pending.found);
        }, dwellMs);
        hover = pending;
        break;
      }
      case 'pointerout': {
        if (!hover) break;
        const next = elementOf(event.relatedTarget);
        if (!next || !hover.found.some(({ host }) => host.contains?.(next))) clearHover();
        break;
      }
      default:
        break;
    }
  };

  function disarm() {
    if (!armed) return;
    armed = false;
    for (const type of types) root.removeEventListener(type, handle, options);
    for (const id of [...touches.keys()]) clearTouch(id);
    clearHover();
  }

  if (armed) {
    for (const type of types) root.addEventListener(type, handle, options);
    // Focus already inside a host when arming (autofocus, restored focus) will
    // send no focusin; it is an engagement all the same.
    const active = elementOf(root.activeElement);
    if (active && active !== root.body) engage('focus', 'focus', { type: 'arm', target: active }, matches('focus', active));
  }

  return {
    disarm,
    get armed() { return armed; },
    pending: () => [...live.keys()],
  };
}

export const SPW_ENGAGEMENT_CONTRACT = Object.freeze({
  kinds: ENGAGE_KINDS,
  portableUse: 'armEngagement({ entries: [{ key, selector, kinds }], onEngage, onApproach }) hears an approach (a touch landing, a pointer arriving) before intent resolves, and calls back once per host when a reader focuses, keys, opens a menu on, presses (a touch that lifts or holds, never one that scrolls), or dwells on it; the engagement is handed over so the woken code can finish the gesture.',
  notAGestureFramework: 'It resolves whether a host was engaged. Verbs, holds as inspection, and double taps stay with the module that mounts.',
});
