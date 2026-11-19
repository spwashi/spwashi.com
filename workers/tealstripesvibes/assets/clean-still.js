// Shared prompt-ready capture mode ("clean still") across the visual host set:
// attention.productions, texture.website, and tealstripesvibes.com.
//
// Screenshotting an instrument to hand to an image or vision model is spoiled
// when unselected option buttons stay on screen. This module keeps three states
// on <html data-still="...">:
//   ""      studio: full controls visible for editing
//   "plate" prompt-ready still: hides all unselected controls/ladders, leaving
//           only the visual stage and the active chosen context
//   "pure"  visual-only still: hides all text and chrome, leaving only the art
//
// In "plate" or "pure", the floating toggle bar itself fades away after a brief
// pause (data-still-chrome="asleep") so screenshots stay completely clean, and
// wakes on pointer, touch, or keyboard. An optional Auto toggle settles into
// "plate" after idleMs of stillness and wakes back to studio on activity.

export const STILL_MODES = Object.freeze(["", "plate", "pure"]);
export const STILL_AUTO_KEY = "set.clean-still-auto/1";

/** Step to the next capture state in the ring: studio -> plate -> pure -> studio. */
export function nextStillMode(current) {
  const idx = STILL_MODES.indexOf(current);
  return STILL_MODES[(idx + 1) % STILL_MODES.length];
}

/** Label shown on the capture toggle for the active state. */
export function stillLabel(mode) {
  if (mode === "plate") return "Still: plate";
  if (mode === "pure") return "Still: pure";
  return "Still";
}

function isEditingTarget(target) {
  if (!target || typeof target !== "object") return false;
  const tag = String(target.tagName ?? "").toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(target.isContentEditable);
}

/**
 * Mount the shared clean-still toggle bar and keyboard shortcut (`p` by default,
 * `Escape` to exit) on a host page.
 */
export function mountCleanStill({
  key = "p",
  idleMs = 4000,
  fadeChromeMs = 2000,
  autoDefault = false,
  onChange = null,
} = {}) {
  if (typeof document === "undefined") return null;
  const root = document.documentElement;
  let mode = "";
  let autoArmed = autoDefault;
  let autoSlept = false;
  let idleTimer = 0;
  let chromeTimer = 0;

  try {
    const saved = localStorage.getItem(STILL_AUTO_KEY);
    if (saved === "1") autoArmed = true;
    else if (saved === "0") autoArmed = false;
  } catch {
    // Private window keeps the default for this visit.
  }

  const bar = document.createElement("div");
  bar.className = "still-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Clean still capture");

  const modeBtn = document.createElement("button");
  modeBtn.type = "button";
  modeBtn.className = "still-btn";
  modeBtn.setAttribute("aria-keyshortcuts", key);
  modeBtn.title = `Cycle clean still capture (${key}): studio -> plate -> pure`;

  const autoBtn = document.createElement("button");
  autoBtn.type = "button";
  autoBtn.className = "still-auto";
  autoBtn.textContent = "Auto";
  autoBtn.title = "Auto-hide controls into clean plate after a pause";

  bar.append(modeBtn, autoBtn);
  document.body.append(bar);

  function syncUi() {
    if (mode) root.setAttribute("data-still", mode);
    else root.removeAttribute("data-still");
    modeBtn.textContent = stillLabel(mode);
    modeBtn.setAttribute("aria-pressed", String(Boolean(mode)));
    autoBtn.setAttribute("aria-pressed", String(autoArmed));
    onChange?.(mode);
  }

  function scheduleChromeFade() {
    clearTimeout(chromeTimer);
    if (!mode) {
      root.removeAttribute("data-still-chrome");
      return;
    }
    root.setAttribute("data-still-chrome", "awake");
    chromeTimer = setTimeout(() => {
      if (mode && !bar.contains(document.activeElement)) {
        root.setAttribute("data-still-chrome", "asleep");
      }
    }, fadeChromeMs);
  }

  function scheduleIdle() {
    clearTimeout(idleTimer);
    if (!autoArmed || mode) return;
    idleTimer = setTimeout(() => {
      if (isEditingTarget(document.activeElement)) return scheduleIdle();
      autoSlept = true;
      mode = "plate";
      syncUi();
      root.setAttribute("data-still-chrome", "asleep");
    }, idleMs);
  }

  function setMode(next, { fromAuto = false } = {}) {
    mode = STILL_MODES.includes(next) ? next : "";
    autoSlept = fromAuto;
    clearTimeout(idleTimer);
    syncUi();
    if (mode) scheduleChromeFade();
    else {
      clearTimeout(chromeTimer);
      root.removeAttribute("data-still-chrome");
      scheduleIdle();
    }
  }

  function setAuto(next) {
    autoArmed = Boolean(next);
    try {
      localStorage.setItem(STILL_AUTO_KEY, autoArmed ? "1" : "0");
    } catch {
      // Storage refused; hold for this visit.
    }
    syncUi();
    if (autoArmed) scheduleIdle();
    else clearTimeout(idleTimer);
  }

  function onActivity(event) {
    if (autoSlept && mode === "plate") {
      setMode("");
      return;
    }
    if (mode) {
      if (event?.type === "pointerdown" && bar.contains(event.target)) return;
      scheduleChromeFade();
      return;
    }
    scheduleIdle();
  }

  modeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setMode(nextStillMode(mode));
  });

  autoBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setAuto(!autoArmed);
  });

  for (const type of ["pointermove", "pointerdown", "touchstart", "wheel", "focusin"]) {
    window.addEventListener(type, onActivity, { passive: true });
  }

  window.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isEditingTarget(event.target)) {
      if (event.key === "Escape" && mode) setMode("");
      return;
    }
    if (event.key === "Escape" && mode) {
      event.preventDefault();
      setMode("");
      return;
    }
    if (event.key.toLowerCase() === key.toLowerCase()) {
      event.preventDefault();
      setMode(nextStillMode(mode));
      return;
    }
    onActivity(event);
  });

  syncUi();
  scheduleIdle();

  return {
    getMode: () => mode,
    setMode: (next) => setMode(next),
    cycle: () => setMode(nextStillMode(mode)),
    isAuto: () => autoArmed,
    setAuto,
  };
}
