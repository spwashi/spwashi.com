// /pivot: one line, and the lines one change away from it. Each pivot names
// the slot it turns, shows the line it lands on before you go, says whether
// that line is already on the shelf, and keeps the way back. /build pivots the
// line it assembles; this pivots any line, and draws its alternatives from the
// shelf, so a turn tends to land somewhere a page already stands.
import { escapeHtml, layout } from "../../lib/shell.js";
import { scriptAddress } from "./build.js";
import { CARD_CSS, cardFacts, cardLink, questCard } from "./cards.js";
import { COMPOUND_JOIN_OPERATORS } from "../../../public/js/semantic/expression-query.js";
import { OPERATORS } from "./guide.js";
import { PAGE_CSS, QUEST_HEAD, masthead } from "./page.js";
import { PAPER_CSS } from "./paper.js";
import { readSpecimen } from "./specimen-reading.js";
import { SPECIMENS, findSpecimens, nameOf, readQuery, specimenById } from "./specimens.js";

/** The longest line the page takes; a pivot is one line, not a file. */
export const PIVOT_LIMIT = 200;
const PER_SLOT = 4;
// Workbench relation: extension. The five valence words, as expression-query.js reads them.
const VALENCE = Object.freeze(["boon", "bane", "bone", "bonk", "honk"]);
const FRONT_MARKS = Object.freeze(["?", "~", "^", "&", "$"]);
const MARK_NAME = new Map(OPERATORS.map((operator) => [operator.sigil, operator.name]));
const SLOT_SAYS = Object.freeze({ subject: "the word", mode: "the lens", body: "what it holds", projection: "where it goes", scope: "the scene", charge: "the charge in front", join: "the join" });

const flat = (value) => String(value || "").replace(/\s+/g, "");
const LINES = SPECIMENS.filter((specimen) => !specimen.reading.file);
const BY_LINE = new Map(LINES.map((specimen) => [flat(specimen.line), specimen]));

/** The values each slot takes on the shelf, commonest first, and which lines hold each. */
const SHELF = (() => {
  const index = {};
  for (const specimen of LINES) {
    for (const [slot, value] of Object.entries(specimen.reading.slots || {})) {
      index[slot] ||= new Map();
      if (!index[slot].has(value)) index[slot].set(value, []);
      index[slot].get(value).push(specimen);
    }
  }
  const ranked = Object.fromEntries(Object.entries(index).map(([slot, map]) => [slot, [...map.entries()].sort((a, b) => b[1].length - a[1].length).map(([value]) => value)]));
  return { index, ranked };
})();

const holding = (slot, value) => SHELF.index[slot]?.get(value) || [];

/** Values a slot takes on lines that share another slot with this one, commonest first; then the shelf's commonest. */
function kinValues(slot, own, anchors) {
  const seen = new Map();
  for (const [anchorSlot, anchorValue] of anchors) {
    if (!anchorValue) continue;
    for (const specimen of holding(anchorSlot, anchorValue)) {
      const value = specimen.reading.slots?.[slot];
      if (value && value !== own) seen.set(value, (seen.get(value) || 0) + 1);
    }
    if (seen.size >= PER_SLOT) break;
  }
  const kin = [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([value]) => value);
  const common = (SHELF.ranked[slot] || []).filter((value) => value !== own && !kin.includes(value));
  return { kin: kin.slice(0, PER_SLOT), common: common.slice(0, Math.max(0, PER_SLOT - kin.length)) };
}

/* ---------- A line, and the line one slot away ---------- */

/** Where a line keeps its scene: before the word, or after what it holds. */
function layoutOf(line, slots) {
  const after = String(line).replace(/^(?:(?:bone|boon|bane|bonk|honk)(?:\.(?:bone|boon|bane|bonk|honk))*\s*)/, "");
  return { sceneFirst: Boolean(slots.scope) && after.trimStart().startsWith("(") };
}

/** A line written back from its slots, keeping where its scene sat. */
export function lineFrom(slots, { sceneFirst = false } = {}) {
  const scene = slots.scope ? `(${slots.scope})` : "";
  const left = `${slots.charge ? `${slots.charge}${slots.subject ? " " : ""}` : ""}${sceneFirst ? scene : ""}${slots.subject || ""}`
    + `${slots.mode ? `[${slots.mode}]` : ""}${slots.body ? `{${slots.body}}` : ""}${sceneFirst ? "" : scene}${slots.projection ? `<${slots.projection}>` : ""}`;
  return slots.join && slots.with ? `${left} ${slots.join.split(" ")[0]} ${slots.with}` : left;
}

/** Every pivot of a line, grouped by the slot it turns. */
export function pivotsOf(line) {
  const reading = readSpecimen(line);
  if (reading.file) return [];
  const slots = { ...reading.slots };
  const shape = layoutOf(line, slots);
  const turn = (changes) => lineFrom({ ...slots, ...changes }, shape);
  const out = [];
  /** One pivot: the slot it turns, how, the line it makes, and where its value came from (near: a line sharing a slot uses it). */
  const add = (slot, kind, label, changes, why = "", source = "") => {
    const next = turn(changes);
    if (flat(next) !== flat(line) && next.trim()) out.push({ slot, kind, label, line: next, why, source });
  };
  const anchors = (slot) => [["subject", slots.subject], ["charge", slots.charge], ["mode", slots.mode], ["projection", slots.projection]].filter(([key]) => key !== slot);

  for (const slot of ["mode", "projection", "subject", "body"]) {
    if (!slots[slot] && slot !== "projection" && slot !== "mode") continue;
    const { kin, common } = kinValues(slot, slots[slot], anchors(slot));
    const kind = slots[slot] ? "swap" : "add";
    for (const value of kin) add(slot, kind, `${slots[slot] ? "swap to" : "add"} ${value}`, { [slot]: value }, "", "near");
    for (const value of common.slice(0, slots[slot] ? PER_SLOT : 2)) add(slot, kind, `${slots[slot] ? "swap to" : "add"} ${value}`, { [slot]: value }, "", "common");
  }
  if (!slots.subject && slots.charge) {
    const { kin, common } = kinValues("subject", "", anchors("subject"));
    for (const value of [...kin, ...common]) add("subject", "add", `give it the word ${value}`, { subject: value }, "a charge rides a word; this line has none");
  }
  if (slots.scope) for (const value of (SHELF.ranked.scope || []).filter((value) => value !== slots.scope).slice(0, 2)) add("scope", "swap", `swap to ${value}`, { scope: value }, "", "common");
  if (slots.charge) {
    for (const value of VALENCE.filter((value) => value !== slots.charge)) add("charge", "swap", `swap to ${value}`, { charge: value });
  } else if (slots.subject) {
    add("charge", "add", "add boon", { charge: "boon" }, "a valence word rides the word");
  }
  for (const slot of ["charge", "scope", "projection", "body", "mode"]) {
    if (slots[slot] && (slots.subject || slot !== "charge")) add(slot, "drop", `drop ${SLOT_SAYS[slot]}`, { [slot]: "" });
  }
  if (slots.subject && !/^[~?!*^#@&=%$]/.test(slots.subject)) {
    for (const mark of FRONT_MARKS) add("subject", "mark", `${mark} ${MARK_NAME.get(mark)} in front`, { subject: `${mark}${slots.subject}` });
  }
  if (slots.join) {
    const [operator] = slots.join.split(" ");
    for (const [other, bond] of Object.entries(COMPOUND_JOIN_OPERATORS).filter(([other]) => other !== operator)) {
      add("join", "turn", `${other} ${bond}`, { join: `${other} ${bond}` }, `${MARK_NAME.get(other)} between the two`);
    }
    add("join", "split", "keep the first line", { join: "", with: "" });
    if (slots.with) out.push({ slot: "join", kind: "split", label: "keep the second line", line: slots.with, why: "" });
  }
  return out;
}

/** A family: keep one slot, open another, and the shelf's lines that fill it. */
export function familiesOf(line) {
  const reading = readSpecimen(line);
  if (reading.file) return [];
  const s = reading.slots;
  const families = [
    s.subject && ["mode", `${s.subject}[*]`],
    s.subject && ["body", `${s.subject}{*}`],
    s.subject && ["projection", `${s.subject}<*>`],
    s.mode && ["subject", `[${s.mode}]`],
  ].filter(Boolean);
  return families.map(([slot, query]) => ({ slot, query, n: findSpecimens(readQuery(query)).length })).filter(({ n }) => n > 1);
}

/* ---------- The page ---------- */

/** The state a request asks for: a line on the shelf by id, or a typed line; one line only. */
export function pivotState(params) {
  const specimen = specimenById(params.get("s"));
  const typed = String(params.get("line") || "").trim();
  const from = String(params.get("from") || "").trim().slice(0, PIVOT_LIMIT);
  if (specimen && !specimen.reading.file) return { line: specimen.line, id: specimen.id, from, cut: false, refused: "" };
  if (!typed) return { line: "", id: "", from: "", cut: false, refused: "" };
  if (typed.includes("\n")) return { line: "", id: "", from: "", cut: false, refused: "one line at a time; a file opens in Build" };
  const line = typed.slice(0, PIVOT_LIMIT);
  const known = BY_LINE.get(flat(line));
  return { line, id: known?.id || "", from: from && flat(from) !== flat(line) ? from : "", cut: typed.length > PIVOT_LIMIT, refused: "" };
}

const pivotHref = (line, from) => {
  const params = new URLSearchParams({ line });
  if (from) params.set("from", from);
  return `/pivot?${params}`;
};

function landing(pivot, state) {
  const there = BY_LINE.get(flat(pivot.line));
  if (!there) return { says: "Not on the shelf yet.", links: [] };
  const where = there.source === "routes" ? `spwashi.com${there.route}#${there.section}` : nameOf(there);
  return {
    says: `On the shelf: <code>${escapeHtml(where)}</code>.`,
    links: [state.id && state.id !== there.id ? cardLink(`/specimens?a=${state.id}&b=${there.id}#compare`, "Compare with this line") : ""],
  };
}

function pivotCard(pivot, state) {
  const lands = landing(pivot, state);
  const edit = scriptAddress(pivot.line);
  return questCard({
    tag: "li",
    level: 4,
    glyph: readSpecimen(pivot.line).paint,
    name: pivot.label,
    badges: [pivot.kind, pivot.source],
    body: cardFacts([
      ["lands", lands.says],
      ["why", pivot.why ? escapeHtml(pivot.why) : ""],
    ]),
    links: [cardLink(pivotHref(pivot.line, state.line), "Pivot from here"), edit ? cardLink(edit, "Take it apart") : "", ...lands.links],
  });
}

/** Pivot groups in the order a line is read: the charge, the word, the lens, what it holds, the scene, where it goes, the join. */
const GROUP_ORDER = Object.freeze(["charge", "subject", "mode", "body", "scope", "projection", "join"]);

const STARTS = Object.freeze(["r-e6f488e3", "h-capsule", "h-induct_join", "r-e9dc9b1e", "h-probe", "r-755c824b"]);

function form(state) {
  return `<form class="find" method="get" action="/pivot">
    <label for="line">A line to pivot</label>
    <div class="find-row"><input id="line" name="line" type="text" value="${escapeHtml(state.line)}" maxlength="${PIVOT_LIMIT}" autocomplete="off" spellcheck="false" placeholder="home[hook]{software.art.practice}&lt;person&gt;"><button type="submit">Pivot</button></div>
  </form>`;
}

export function pivotBody(state) {
  const opening = `<section class="opening" aria-labelledby="pivot-title">
  <h1 id="pivot-title">Pivot a line</h1>
  <p class="lede">Change one slot and keep the rest. Each pivot shows the line it lands on before you go, says whether that line is already on the shelf, and leaves the way back.</p>
  ${form(state)}${state.refused ? `
  <p class="note">${escapeHtml(state.refused)}.</p>` : ""}${state.cut ? `
  <p class="note">Only the first ${PIVOT_LIMIT} characters are read.</p>` : ""}
</section>`;
  if (!state.line) {
    const starts = STARTS.map(specimenById).filter(Boolean).map((specimen) => `<li><a href="/pivot?s=${escapeHtml(specimen.id)}"><code>${specimen.reading.paint}</code></a></li>`).join("\n    ");
    return `${opening}
<section class="band" aria-labelledby="starts-title">
  <h2 id="starts-title">Start from one of these</h2>
  <ul class="starts">
    ${starts}
  </ul>
</section>`;
  }
  const reading = readSpecimen(state.line);
  const here = state.id ? specimenById(state.id) : null;
  const pivots = pivotsOf(state.line);
  const families = familiesOf(state.line);
  const groups = GROUP_ORDER.filter((slot) => pivots.some((pivot) => pivot.slot === slot)).map((slot) => {
    const members = pivots.filter((pivot) => pivot.slot === slot);
    return `<section class="slot-group" id="turn-${escapeHtml(slot)}" aria-labelledby="turn-${escapeHtml(slot)}-title">
    <h3 id="turn-${escapeHtml(slot)}-title">${escapeHtml(slot)} <span class="says">${escapeHtml(SLOT_SAYS[slot] || "")}</span></h3>
    <ol class="qc-grid">
      ${members.map((pivot) => pivotCard(pivot, state)).join("\n      ")}
    </ol>
  </section>`;
  }).join("\n  ");
  const drops = pivots.filter((pivot) => pivot.kind === "drop");
  const back = state.from ? `<p class="back"><a href="${escapeHtml(pivotHref(state.from))}">Back to <code>${readSpecimen(state.from).paint}</code></a></p>` : "";
  const familyList = families.map(({ slot, query, n }) => `<li><a href="/specimens?q=${escapeHtml(encodeURIComponent(query))}#found"><code>${escapeHtml(query)}</code></a> ${n} lines, with ${escapeHtml(SLOT_SAYS[slot])} open</li>`).join("\n      ");
  const kin = (reading.slots.subject ? holding("subject", reading.slots.subject) : []).filter((specimen) => specimen.id !== state.id).slice(0, 6);
  return `${opening}
<section class="band here" aria-labelledby="here-title">
  <h2 id="here-title">The line</h2>
  ${questCard({
    tag: "div",
    glyph: reading.paint,
    name: here ? nameOf(here) : "a line you wrote",
    badges: [here ? "on the shelf" : "new", reading.part ? "read in part" : ""],
    body: cardFacts(Object.entries(reading.slots).map(([slot, value]) => [slot, `<code>${escapeHtml(value)}</code>`])),
    links: [scriptAddress(state.line) ? cardLink(scriptAddress(state.line), "Take it apart") : "", cardLink("/constructs#c-expression", "What each slot is")],
  })}
  ${back}${families.length ? `
  <h3>Families it belongs to</h3>
  <ul class="families-list">
      ${familyList}
  </ul>` : ""}${kin.length ? `
  <h3>Other lines about <code>${escapeHtml(reading.slots.subject)}</code></h3>
  <ul class="starts">
    ${kin.map((specimen) => `<li><a href="${escapeHtml(pivotHref(specimen.line, state.line))}"><code>${specimen.reading.paint}</code></a></li>`).join("\n    ")}
  </ul>` : ""}
</section>
<section class="band" aria-labelledby="pivots-title">
  <h2 id="pivots-title">${pivots.length} lines one change away</h2>${drops.length ? `
  <p id="drop">Dropping a slot leaves the residue: what the line still says without it.</p>` : ""}
  <p class="note">A value marked <em>near</em> is used by a line that shares a slot with this one; <em>common</em> is common on the shelf.</p>
  ${groups}
</section>`;
}

export const PIVOT_CSS = `${CARD_CSS}
    .opening { margin: 0 0 1.2rem; }
    .opening h1 { margin: 0 0 .5rem; font-size: clamp(1.8rem, 5vw, 2.4rem); }
    .opening .lede { max-width: 44rem; margin: 0 0 .8rem; color: var(--ink-soft); }
    [id] { scroll-margin-top: 1.25rem; }
    section.band { margin: 2.2rem 0 0; padding: 1.5rem 0 0; border-top: 1px solid var(--line); }
    .find { display: grid; gap: .4rem; max-width: 46rem; }
    .find label { font-weight: 650; }
    .find-row { display: flex; gap: .5rem; }
    .find input { flex: 1; min-width: 0; min-height: 44px; padding: .35rem .7rem; border: 1px solid var(--edge); border-radius: var(--radius); color: var(--fg); font: 1rem/1.3 var(--mono); }
    .find button { min-height: 44px; margin: 0; padding: 0 1rem; border: 1px solid var(--edge); border-radius: var(--pill); background: var(--surface); color: var(--accent); font: 600 .95rem/1 var(--font); cursor: pointer; }
    .find button:hover, .find button:focus-visible { background: var(--accent-soft); }
    .note { color: var(--muted); font-size: .9rem; }
    .here .qc { max-width: 46rem; border-color: var(--accent); }
    .back { margin: .8rem 0 0; }
    .back a { display: inline-flex; align-items: center; gap: .4rem; min-height: 44px; }
    .starts, .families-list { display: grid; gap: .2rem; margin: .5rem 0 0; padding: 0; list-style: none; }
    .starts a, .families-list a { display: inline-flex; align-items: center; min-height: 36px; overflow-wrap: anywhere; }
    .families-list li { color: var(--muted); font-size: .9rem; }
    .slot-group { margin: 1.4rem 0 0; }
    .slot-group h3 { display: flex; flex-wrap: wrap; align-items: baseline; gap: .2rem .6rem; margin: 0; }
    .slot-group .says { color: var(--muted); font: 400 .82rem/1 var(--mono); }
    @media (pointer: coarse) { .starts a, .families-list a { min-height: 44px; } }`;

export function renderPivot(state) {
  return layout({
    title: state.line ? `spw.quest — pivot ${state.line.slice(0, 60)}` : "spw.quest — pivot a line",
    description: "One line of Spw and the lines one change away from it, each shown before you go, with the way back kept.",
    canonical: "https://spw.quest/pivot",
    head: QUEST_HEAD,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}
    ${PIVOT_CSS}`,
    body: `${masthead("/pivot")}
${pivotBody(state)}
<p class="also"><a href="/constructs">Constructs</a> · <a href="/specimens">Specimens</a> · <a href="/build">Take one line apart</a> · <a href="/learn">Learn it a mark at a time</a></p>`,
  });
}
