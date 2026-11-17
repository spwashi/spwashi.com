// spwashi.com's pinch for text, on the set's pages. Two fingers on the words
// step the text along the site's ladder (70% to 120%) as they move, and the
// step is kept on the device. The gesture is spwashi.com's own
// (public/js/kernel/pinch-text-scale.js), carried into each unit's /peer/ by
// scripts/build-peer-kit.mjs and named by the page's
// <link rel="modulepreload" id="text-pinch">. text-scale-head.js puts the kept
// step on <html> before the page paints, and text-scale.css turns it into a
// size: rem-based pages scale with <html>'s font size, as spwashi.com does, and
// a px-built surface takes --text-scale as its zoom. The picture keeps its own
// pinch (pinch.js): pinch the words to size them, pinch the picture to step it.
// Each unit's carry copies this file, text-scale-head.js and text-scale.css
// into its assets.

/** spwashi.com's text-size ladder (public/js/runtime/attention/shared.js FONT_SCALE_STEPS). */
export const TEXT_STEPS = Object.freeze(["70", "80", "90", "100", "110", "120"]);
/** Where a device keeps its step: each site's own storage, under the same name. */
export const TEXT_KEY = "set.text-scale/1";

const current = () => {
  const step = document.documentElement.getAttribute("data-text-scale");
  return TEXT_STEPS.includes(step) ? step : "100";
};

let badge = null;
let badgeTimer = 0;

/** Say the size for a moment, as spw.quest's badge does. */
function say(text) {
  if (!badge) {
    badge = document.createElement("p");
    badge.className = "text-scale-badge";
    badge.setAttribute("role", "status");
    badge.setAttribute("aria-live", "polite");
    document.body.append(badge);
  }
  badge.textContent = text;
  badge.classList.add("on");
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => badge.classList.remove("on"), 1100);
}

/** Set a step: on <html>, kept on the device, and said. */
export function setTextScale(step) {
  if (!TEXT_STEPS.includes(step)) return;
  if (step === "100") document.documentElement.removeAttribute("data-text-scale");
  else document.documentElement.setAttribute("data-text-scale", step);
  try {
    if (step === "100") localStorage.removeItem(TEXT_KEY);
    else localStorage.setItem(TEXT_KEY, step);
  } catch {
    // Storage refused: the step holds for this visit.
  }
  say(`Text ${step}%`);
}

/**
 * Bind spwashi.com's pinch over `main`, the page's words. `ignore` names what
 * keeps its own two fingers (the picture). Where there is no touch, or no
 * carried gesture, nothing binds and the browser's zoom is as it was.
 */
export async function mountTextScale(main, { ignore = "" } = {}) {
  const href = document.getElementById("text-pinch")?.getAttribute("href");
  if (!main || !href) return;
  try {
    const { bindPinchTextScale, supportsPinchTextScaleInput, PINCH_IGNORE } = await import(href);
    if (!supportsPinchTextScaleInput()) return;
    bindPinchTextScale({
      main,
      steps: TEXT_STEPS,
      getScale: current,
      setScale: setTextScale,
      ignore: [PINCH_IGNORE, ignore].filter(Boolean).join(", "),
    });
  } catch {
    // Without the carried gesture, the browser's own zoom stands.
  }
}
