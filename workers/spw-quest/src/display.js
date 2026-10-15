// How a reader sets spw.quest's text and code on their device: text size
// (also by a two-finger pinch, the site's own gesture carried in the peer
// build), whether long lines wrap, whether marks wear their colors, and how
// open the lines are. Kept in localStorage under its own key, apart from the
// note, and applied in <head> before the body paints, so a page opens at the
// reader's size and nothing moves when the rest arrives.
import { PEER_SCRIPT_BASE } from "../../lib/peer-assets.js";
import { peerScriptPath } from "../../lib/peer-kit.js";

export const DISPLAY_KEY = "spw.quest.display/1";

/** The site's text-size ladder (runtime/attention/shared.js FONT_SCALE_STEPS), so a pinch steps the same way on both. */
export const DISPLAY_CHOICES = Object.freeze({
  size: Object.freeze(["70", "80", "90", "100", "110", "120"]),
  wrap: Object.freeze(["on", "off"]),
  colors: Object.freeze(["marks", "plain"]),
  spacing: Object.freeze(["compact", "regular", "roomy"]),
});
const DEFAULTS = Object.freeze({ size: "100", wrap: "on", colors: "marks", spacing: "regular" });

/** Runs in <head>: the stored choices, as attributes on <html>, before anything paints. */
function applyStoredDisplay(key, choices, defaults) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "{}") || {};
    for (const [name, values] of Object.entries(choices)) {
      const value = stored[name];
      if (values.includes(value) && value !== defaults[name]) document.documentElement.setAttribute(`data-display-${name}`, value);
    }
  } catch {
    // Storage refused or unreadable: the page opens at the defaults.
  }
}

export const DISPLAY_HEAD = `<script>(${applyStoredDisplay.toString()})(${JSON.stringify(DISPLAY_KEY)}, ${JSON.stringify(DISPLAY_CHOICES)}, ${JSON.stringify(DEFAULTS)});</script>`;

/** The Display button (for the file head) and its panel. Both hidden until the module binds them. */
export function displayMenu() {
  const choice = (name, value, label) => `<button type="button" data-display-set="${name}" data-value="${value}" aria-pressed="${DEFAULTS[name] === value}">${label}</button>`;
  return {
    toggle: `<button type="button" data-display-toggle aria-expanded="false" aria-controls="display-menu" hidden>Display</button>`,
    panel: `<div class="display-menu" id="display-menu" data-display-menu role="group" aria-label="Display" hidden>
        <div class="display-row"><span class="display-label">Text</span><button type="button" data-display-step="-1" aria-label="Smaller text">A−</button><output data-display-size>100%</output><button type="button" data-display-step="1" aria-label="Larger text">A+</button></div>
        <div class="display-row"><span class="display-label">Lines</span>${choice("wrap", "on", "Wrap")}${choice("wrap", "off", "Scroll")}</div>
        <div class="display-row"><span class="display-label">Marks</span>${choice("colors", "marks", "In color")}${choice("colors", "plain", "Plain")}</div>
        <div class="display-row"><span class="display-label">Spacing</span>${choice("spacing", "compact", "Compact")}${choice("spacing", "regular", "Regular")}${choice("spacing", "roomy", "Roomy")}</div>
        <p class="display-hint" data-display-pinch hidden>Pinch with two fingers over the page or the code to resize text.</p>
      </div>`,
  };
}

/**
 * Runs in the page (it travels by toString): binds the menu, a tap on the file
 * name, and the pinch. Every change sets one attribute on <html>, keeps it on
 * the device, and says what it did.
 */
function questDisplay(bindPinchTextScale, supportsPinchTextScaleInput, key, choices, defaults) {
  const html = document.documentElement;
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch {
      return {};
    }
  };
  const current = (name) => {
    const value = html.getAttribute(`data-display-${name}`);
    return choices[name].includes(value) ? value : defaults[name];
  };
  let badgeNode = null;
  let badgeTimer = 0;
  const badge = (text) => {
    if (!badgeNode) {
      badgeNode = document.createElement("p");
      badgeNode.className = "display-badge";
      badgeNode.setAttribute("role", "status");
      document.body.append(badgeNode);
    }
    badgeNode.textContent = text;
    badgeNode.hidden = false;
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => { badgeNode.hidden = true; }, 1400);
  };
  const menu = document.querySelector("[data-display-menu]");
  const toggle = document.querySelector("[data-display-toggle]");
  const sync = () => {
    if (!menu) return;
    for (const button of menu.querySelectorAll("[data-display-set]")) {
      button.setAttribute("aria-pressed", String(current(button.dataset.displaySet) === button.dataset.value));
    }
    const size = menu.querySelector("[data-display-size]");
    if (size) size.textContent = `${current("size")}%`;
    const index = choices.size.indexOf(current("size"));
    const [smaller, larger] = [...menu.querySelectorAll("[data-display-step]")];
    if (smaller) smaller.disabled = index <= 0;
    if (larger) larger.disabled = index >= choices.size.length - 1;
  };
  const set = (name, value) => {
    if (!choices[name].includes(value)) return;
    if (value === defaults[name]) html.removeAttribute(`data-display-${name}`);
    else html.setAttribute(`data-display-${name}`, value);
    const stored = read();
    stored[name] = value;
    try {
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {
      // Not kept on this device; the page still changes.
    }
    sync();
  };
  const stepSize = (by) => {
    const index = choices.size.indexOf(current("size"));
    const next = choices.size[Math.max(0, Math.min(choices.size.length - 1, index + by))];
    if (next !== current("size")) set("size", next);
    badge(`Text ${next}%`);
  };

  if (menu && toggle) {
    toggle.hidden = false;
    const open = (yes) => {
      menu.hidden = !yes;
      toggle.setAttribute("aria-expanded", String(yes));
    };
    toggle.addEventListener("click", () => open(menu.hidden));
    // The file's name is its handle: a tap opens the same panel.
    const name = document.querySelector("[data-file-name]");
    if (name) {
      name.classList.add("display-handle");
      name.title = "Display";
      name.addEventListener("click", () => open(menu.hidden));
    }
    menu.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.displayStep) stepSize(Number(button.dataset.displayStep));
      else if (button.dataset.displaySet) set(button.dataset.displaySet, button.dataset.value);
    });
    menu.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      open(false);
      toggle.focus();
    });
    if (supportsPinchTextScaleInput()) {
      const hint = menu.querySelector("[data-display-pinch]");
      if (hint) hint.hidden = false;
    }
  }
  sync();

  // The pinch reaches the code too: textareas are not left out here, as the site's default leaves them.
  const main = document.querySelector("main");
  if (main && supportsPinchTextScaleInput()) {
    bindPinchTextScale({
      main,
      steps: choices.size,
      getScale: () => current("size"),
      setScale: (next) => {
        set("size", next);
        badge(`Text ${next}%`);
      },
      ignore: "a, button, input, select, label, summary, details, video, audio, iframe",
    });
  }
}

/** The module script for a page that reads as you type: the carried pinch, then questDisplay. */
export function displayScript() {
  const pinch = peerScriptPath("pinch-text-scale", PEER_SCRIPT_BASE);
  return `<script type="module">
import { bindPinchTextScale, supportsPinchTextScaleInput } from ${JSON.stringify(pinch)};
(${questDisplay.toString()})(bindPinchTextScale, supportsPinchTextScaleInput, ${JSON.stringify(DISPLAY_KEY)}, ${JSON.stringify(DISPLAY_CHOICES)}, ${JSON.stringify(DEFAULTS)});
</script>`;
}

/** Text size for every page; wrap, colors and spacing for the editor; the menu and the badge. */
export const DISPLAY_CSS = `${DISPLAY_CHOICES.size.filter((step) => step !== DEFAULTS.size).map((step) => `html[data-display-size="${step}"] { font-size: ${step}%; }`).join("\n    ")}
    html[data-display-wrap="off"] .editor { overflow-x: auto; grid-template-columns: minmax(max-content, 1fr); }
    html[data-display-wrap="off"] .editor > :is(.paint, textarea) { width: auto; min-width: 100%; white-space: pre; overflow-wrap: normal; }
    html[data-display-colors="plain"] .editor .paint [data-t] { color: inherit; }
    html[data-display-spacing="compact"] .editor > :is(.paint, textarea) { line-height: 1.4; }
    html[data-display-spacing="roomy"] .editor > :is(.paint, textarea) { line-height: 1.95; }
    .display-handle { cursor: pointer; }
    .display-menu { display: grid; gap: .35rem; padding: .6rem 1rem .7rem; border-bottom: 1px solid var(--line); background: var(--surface); font-size: .88rem; }
    .display-row { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem; }
    .display-label { min-width: 4.6rem; color: var(--muted); font: 600 .72rem/1.2 var(--font); letter-spacing: .06em; text-transform: uppercase; }
    .display-row button { min-height: 36px; margin: 0; padding: .15rem .65rem; border: 1px solid var(--line); border-radius: var(--pill); background: var(--field); color: var(--fg); font: 500 .85rem/1 var(--font); cursor: pointer; }
    .display-row button[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
    .display-row button:disabled { opacity: .45; cursor: default; }
    .display-row output { min-width: 3.4rem; color: var(--fg); font: 600 .85rem/1 var(--mono); font-variant-numeric: tabular-nums; text-align: center; }
    @media (pointer: coarse) { .display-row button { min-height: 44px; } }
    .display-hint { margin: .1rem 0 0; color: var(--muted); font-size: .82rem; }
    .display-badge { position: fixed; inset-block-end: max(1rem, env(safe-area-inset-bottom)); inset-inline-start: 50%; z-index: 10; margin: 0; padding: .35rem .8rem; border: 1px solid var(--line); border-radius: var(--pill); background: var(--field); box-shadow: var(--shadow); color: var(--fg); font: 600 .85rem/1.2 var(--mono); transform: translateX(-50%); pointer-events: none; }`;
