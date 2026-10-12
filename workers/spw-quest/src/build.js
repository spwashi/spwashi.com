// Put one expression together: a mark, a word, and the four ways to hold
// things, read as one line. Each slot can be changed while the rest hold, and
// every change is a link, so the whole surface works with scripts off.
import { escapeHtml } from "../../lib/shell.js";
import { CONTAINERS, OPERATORS } from "./guide.js";
import { readLine, renderReading } from "./reader.js";

const MAX = 60;
const MARKS = new Set(OPERATORS.map((op) => op.sigil));
const BRACES = Object.fromEntries(CONTAINERS.map((c) => [c.name, c]));

/** The slots in the order the line is written, each with the alternatives a reader can swap in. */
export const SLOTS = Object.freeze([
  { name: "mark", alts: ["", "~", "?", "!", "@", "*"] },
  { name: "word", alts: ["door", "key", "morning"] },
  { name: "concept", alts: ["", "entry", "home"] },
  { name: "scene", alts: ["", "morning", "threshold", "kitchen"] },
  { name: "mode", alts: ["", "closed", "open", "ajar"] },
  { name: "definition", alts: ["", "hinge, frame, key", "hinge.frame.key", "key"] },
]);

export const BUILD_DEFAULTS = Object.freeze({ mark: "~", word: "door", concept: "", scene: "morning", mode: "closed", definition: "hinge, frame, key" });

/** Slots from a query string; anything missing keeps its default, and no slot can break another's braces. */
export function slotsFrom(params) {
  const slots = { ...BUILD_DEFAULTS };
  for (const { name } of SLOTS) {
    if (!params.has(name)) continue;
    const raw = String(params.get(name) || "").slice(0, MAX);
    slots[name] = name === "mark"
      ? (MARKS.has(raw) ? raw : "")
      : raw.replace(/[<>()[\]{}]/g, "").replace(/\s+/g, " ").trim();
  }
  return slots;
}
const name = (word) => word.replace(/\s+/g, "_");

/** The line the slots make, in the order the guide teaches: <concept>(scene)[mode]{definition} after the word. */
export function assemble(slots) {
  return `${slots.mark}${name(slots.word)}${slots.concept ? `<${slots.concept}>` : ""}${slots.scene ? `(${slots.scene})` : ""}${slots.mode ? `[${slots.mode}]` : ""}${slots.definition ? `{${slots.definition}}` : ""}`;
}

/** The same line with each slot wrapped, so a slot can be pointed at. */
function segments(slots) {
  const seg = (slot, text) => (text ? `<span data-slot="${slot}">${escapeHtml(text)}</span>` : "");
  const c = (slot, value) => (value ? `${BRACES[slot].open}${value}${BRACES[slot].close}` : "");
  return seg("mark", slots.mark) + seg("word", name(slots.word)) + seg("concept", c("concept", slots.concept))
    + seg("scene", c("scene", slots.scene)) + seg("mode", c("mode", slots.mode)) + seg("definition", c("definition", slots.definition));
}

const query = (slots) => SLOTS.map(({ name: slot }) => `${slot}=${encodeURIComponent(slots[slot])}`).join("&amp;");

/** How an alternative looks in its row: the slot as it would be written, with the mark shown on the word. */
function altLabel(slot, value, slots) {
  if (slot === "mark") return `<mark>${escapeHtml(value)}</mark>${escapeHtml(name(slots.word) || "door")}`;
  if (slot === "word") return escapeHtml(name(value));
  if (!value) return `<span aria-hidden="true">—</span><span class="sr-only">without ${slot}</span>`;
  return escapeHtml(`${BRACES[slot].open}${value}${BRACES[slot].close}`);
}

function pivots(slots) {
  return SLOTS.map(({ name: slot, alts }) => {
    const options = alts.includes(slots[slot]) ? alts : [slots[slot], ...alts];
    const links = options.map((value) => {
      const next = { ...slots, [slot]: value };
      const current = value === slots[slot] ? ' aria-current="true"' : "";
      return `<a href="/build?${query(next)}#build"${current}>${altLabel(slot, value, slots)}</a>`;
    }).join("");
    const pair = slot === "mark" || slot === "word" ? "" : `<span class="pair" aria-hidden="true">${escapeHtml(BRACES[slot].open)} ${escapeHtml(BRACES[slot].close)}</span> `;
    return `<div class="pivot" data-slot="${slot}"><span class="slot">${pair}${slot}</span><span class="alts">${links}</span></div>`;
  }).join("\n      ");
}

function fields(slots) {
  const markOptions = ["", ...MARKS].map((m) => `<option value="${escapeHtml(m)}"${m === slots.mark ? " selected" : ""}>${m ? escapeHtml(m) : "—"}</option>`).join("");
  const text = (slot) => `<label data-slot="${slot}"><span>${slot === "word" ? "word" : `${escapeHtml(BRACES[slot].open)} ${escapeHtml(BRACES[slot].close)} ${slot}`}</span><input name="${slot}" value="${escapeHtml(slots[slot])}" maxlength="${MAX}" spellcheck="false" autocomplete="off" autocapitalize="none"></label>`;
  return `<label data-slot="mark"><span>mark</span><select name="mark">${markOptions}</select></label>
        ${["word", "concept", "scene", "mode", "definition"].map(text).join("\n        ")}`;
}

/** The surface: the line, what Spw reads in it, one row per slot to change, and the slots as a form. */
export function buildSurface(slots) {
  const line = assemble(slots);
  // With a mode and a definition, the hold panel's words count what { } holds, so
  // {hinge, frame, key} and {hinge.frame.key} read differently; neither is wrong here.
  const base = readLine("write", line);
  // The count belongs to the braces, so it is read on the word with only its [ ] and { }.
  const held = slots.mode && slots.definition && base.state === "pass" ? readLine("hold", assemble({ ...slots, mark: "", concept: "", scene: "" })) : null;
  let says = held && (held.state === "pass" || /^The braces hold one part/.test(held.says)) ? held.says : base.says;
  if (!slots.definition.includes(".")) says = says.replace(/ Words joined by dots read as one name;.*$/, "");
  const reading = renderReading({ ...base, says }).replace('id="check-write"', 'id="check-build"');
  return `<div class="build">
    <p class="built-line"><code class="built" aria-label="${escapeHtml(line)}">${segments(slots) || "&nbsp;"}</code></p>
    <div class="reading" id="reading-build">${reading}</div>
    <div class="pivots" aria-label="Change one slot, keep the rest">
      ${pivots(slots)}
    </div>
    <form class="slots" method="get" action="/build#build">
      <fieldset>
        <legend class="sr-only">Slots</legend>
        ${fields(slots)}
      </fieldset>
      <button type="submit">Put together</button>
    </form>
  </div>`;
}

const SLOT_NAMES = SLOTS.map((s) => s.name);
/** Pointing at a row or a field lights its part of the line, and pointing at a part lights its row. */
export const BUILD_CSS = `.build { padding: .9rem 1rem 1rem; border: 1px solid var(--edge); border-radius: 4px; background: var(--surface); box-shadow: var(--shadow); }
    .built-line { margin: 0 0 .7rem; }
    .built { display: block; padding: .75rem .9rem; border-radius: var(--radius); background: var(--field); color: var(--fg); font: 600 1.15rem/1.5 var(--mono); overflow-wrap: anywhere; }
    .built [data-slot] { border-radius: 3px; box-shadow: inset 0 -2px 0 var(--line); transition: background-color 140ms ease, box-shadow 140ms ease; }
    .built [data-slot="mark"] { color: var(--accent); }
    .pivots { display: grid; margin: .9rem 0 0; border-top: 1px solid var(--line); }
    .pivot { display: grid; grid-template-columns: 7.2rem minmax(0, 1fr); gap: .2rem .7rem; align-items: center; padding: .3rem .2rem; border-bottom: 1px solid var(--line); }
    .pivot .slot { color: var(--muted); font: .82rem/1.2 var(--mono); }
    .pivot .pair { color: var(--accent); }
    .alts { display: flex; flex-wrap: wrap; gap: .3rem .4rem; }
    .alts a { display: inline-flex; align-items: center; min-height: 40px; padding: 0 .6rem; border: 1px solid var(--line); border-radius: 999px; color: var(--fg); font: .92rem/1 var(--mono); text-decoration: none; }
    .alts a:hover, .alts a:focus-visible { border-color: var(--accent); background: var(--accent-soft); }
    .alts a[aria-current] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
    .alts mark { background: none; color: var(--accent); font-weight: 700; }
    @media (pointer: coarse) { .alts a { min-height: 44px; } }
    @media (max-width: 30rem) { .pivot { grid-template-columns: 1fr; } }
    form.slots { margin: 1rem 0 0; }
    form.slots fieldset { display: grid; grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr)); gap: .55rem .8rem; margin: 0; padding: 0; border: 0; }
    form.slots label { display: grid; gap: .25rem; color: var(--muted); font: .8rem/1.2 var(--mono); }
    form.slots :is(input, select) { min-height: 44px; margin: 0; padding: .35rem .55rem; color: var(--fg); font: 1rem/1.2 var(--mono); }
    form.slots button { margin-top: .8rem; }
    ${SLOT_NAMES.map((s) => `.build:has(.pivot[data-slot="${s}"]:is(:hover, :focus-within)) .built [data-slot="${s}"], .build:has(label[data-slot="${s}"]:focus-within) .built [data-slot="${s}"]`).join(",\n    ")} { background: var(--accent-soft); box-shadow: inset 0 -2px 0 var(--accent); }
    ${SLOT_NAMES.map((s) => `.build:has(.built [data-slot="${s}"]:hover) .pivot[data-slot="${s}"]`).join(",\n    ")} { background: var(--accent-soft); }
    @media (prefers-reduced-motion: reduce) { .built [data-slot] { transition: none; } }`;
