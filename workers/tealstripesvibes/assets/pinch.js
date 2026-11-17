// One pinch for the set, as factshift.center pinches (its
// src/js/simulation/pinch.ts and src/js/ui/scale-cue.ts). What is pinched
// scales with the fingers. Spread past ×1.16 and the cue says what is in
// (#>keep · close-up); past ×1.35 it goes (#>enter · close-up). Close past
// ×0.82 and the cue says what is out (^near · wide); past ×0.65 it goes
// (^up · wide). Let go short of a step and it settles back. A trackpad's pinch
// over it (a wheel with ctrl, or Safari's gesture) scales the same way, and
// + and −, with nothing being typed, take one step. Each page says what in and
// out are on it; past a page's widest step, out is the set (its ring).
//
// It listens only on the artwork it is given; the page's words keep
// spwashi.com's pinch, which sizes them (text-scale.js). Each unit's carry copies this file
// and pinch.css into its assets; workers/attention-productions/test/pinch.test.mjs
// holds the thresholds to factshift's.

/** factshift.center's thresholds: a spread to `enter` goes in and a close to `up` goes out; `keep` and `near` only say so. A wheel's deltaY scales by e^(−deltaY / wheel). */
export const PINCH = Object.freeze({ enter: 1.35, keep: 1.16, near: 0.82, up: 0.65, wheel: 200 });

/** What a pinch at a scale says, and whether it goes, given the words for in and out (null where there is no step that way). */
export function thresholdOf(scale, inward, outward) {
  if (inward && scale >= PINCH.enter) return { direction: "in", action: `#>enter · ${inward}`, armed: true };
  if (inward && scale >= PINCH.keep) return { direction: "in", action: `#>keep · ${inward}`, armed: false };
  if (outward && scale <= PINCH.up) return { direction: "out", action: `^up · ${outward}`, armed: true };
  if (outward && scale <= PINCH.near) return { direction: "out", action: `^near · ${outward}`, armed: false };
  return { direction: null, action: "", armed: false };
}

/** The cue's words, in factshift's form: @shot · ×1.24 → #>keep · close-up. */
export const cueOf = (plane, scale, action) => `@${plane} · ×${scale.toFixed(2)}${action ? ` → ${action}` : ""}`;

const SHOWN = [0.55, 1.5];
const QUIET = 260;
let cue = null;
let cueTimer = 0;
let lastPinch = 0;

/** Whether a pinch just ended: a tap or a swipe its release brings is not one. */
export const wasPinch = () => performance.now() - lastPinch < 400;

function say(text, at, armed) {
  if (!cue) {
    cue = document.createElement("p");
    cue.className = "pinch-cue";
    cue.setAttribute("role", "status");
    cue.setAttribute("aria-live", "polite");
    document.body.append(cue);
  }
  cue.textContent = text;
  cue.style.setProperty("--at-x", `${Math.round(at?.x ?? innerWidth / 2)}px`);
  cue.style.setProperty("--at-y", `${Math.round(at?.y ?? innerHeight / 2)}px`);
  cue.toggleAttribute("data-armed", Boolean(armed));
  cue.classList.add("on");
  clearTimeout(cueTimer);
}

function quiet(after = 900) {
  clearTimeout(cueTimer);
  cueTimer = setTimeout(() => cue?.classList.remove("on"), after);
}

/**
 * Pinch the artwork. `surfaces` is an element or a list of them (they scale
 * together); `plane` names it in the cue (shot, lock, vibe); `toward(direction)`
 * returns the words for where "in" or "out" lands, or null when there is no
 * step that way; `go(direction)` takes the step.
 */
export function attachPinch(surfaces, { plane, toward, go }) {
  const els = [surfaces].flat().filter(Boolean);
  if (!els.length) return;
  for (const el of els) el.classList.add("pinchable");
  let words = null;
  let gone = false;

  const begin = () => {
    words = { in: toward("in"), out: toward("out") };
    gone = false;
    for (const el of els) el.setAttribute("data-pinching", "");
  };
  const scaleTo = (scale, at) => {
    if (!words || gone) return;
    const shown = Math.min(SHOWN[1], Math.max(SHOWN[0], scale));
    for (const el of els) {
      const box = el.getBoundingClientRect();
      el.style.setProperty("--pinch-scale", shown.toFixed(3));
      el.style.setProperty("--pinch-x", `${Math.round(at.x - box.left)}px`);
      el.style.setProperty("--pinch-y", `${Math.round(at.y - box.top)}px`);
    }
    const step = thresholdOf(scale, words.in, words.out);
    if (step.armed) {
      gone = true;
      settle();
      say(step.action, at, true);
      quiet();
      go(step.direction);
      return;
    }
    say(cueOf(plane, scale, step.action), at, false);
  };
  const settle = () => {
    lastPinch = performance.now();
    for (const el of els) {
      el.removeAttribute("data-pinching");
      el.style.setProperty("--pinch-scale", "1");
    }
    if (!gone) quiet(300);
  };
  const end = () => {
    if (!words) return;
    settle();
    words = null;
  };

  // Two fingers on the artwork. One finger still scrolls the page.
  let startGap = 0;
  const pair = (event) => [...event.touches].slice(0, 2).map((t) => ({ x: t.clientX, y: t.clientY }));
  const gap = ([a, b]) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = ([a, b]) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  for (const el of els) {
    el.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 2) return;
      startGap = Math.max(gap(pair(event)), 1);
      begin();
    }, { passive: true });
    el.addEventListener("touchmove", (event) => {
      if (event.touches.length !== 2 || !words) return;
      event.preventDefault();
      const fingers = pair(event);
      scaleTo(gap(fingers) / startGap, mid(fingers));
    }, { passive: false });
    const lift = (event) => { if (event.touches.length < 2) end(); };
    el.addEventListener("touchend", lift);
    el.addEventListener("touchcancel", lift);

    // A trackpad's pinch: Chrome and Firefox send a wheel with ctrl, so over the artwork it scales it instead of the page.
    let wheeled = 1;
    let wheelTimer = 0;
    el.addEventListener("wheel", (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      if (!words) { begin(); wheeled = 1; }
      wheeled *= Math.exp(-event.deltaY / PINCH.wheel);
      scaleTo(wheeled, { x: event.clientX, y: event.clientY });
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(end, QUIET);
    }, { passive: false });

    // Safari's trackpad pinch is a gesture with its own scale.
    el.addEventListener("gesturestart", (event) => { event.preventDefault(); begin(); });
    el.addEventListener("gesturechange", (event) => { event.preventDefault(); scaleTo(event.scale, { x: event.clientX, y: event.clientY }); });
    el.addEventListener("gestureend", (event) => { event.preventDefault(); end(); });
  }

  // + and −, with nothing being typed: one step.
  addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target?.isContentEditable || /input|textarea|select/i.test(event.target?.tagName ?? "")) return;
    const direction = event.key === "+" || event.key === "=" ? "in" : event.key === "-" || event.key === "_" ? "out" : null;
    if (!direction) return;
    const where = toward(direction);
    if (!where) return;
    say(direction === "in" ? `#>enter · ${where}` : `^up · ${where}`, null, true);
    quiet();
    go(direction);
  });
}
