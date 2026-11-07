// /pivot: one line, and the lines one change away from it. Each pivot names
// the slot it turns, shows the line it lands on before you go, says whether
// that line is already on the shelf, and keeps the way back. /build pivots the
// line it assembles; this pivots any line, and draws its alternatives from the
// shelf, so a turn tends to land somewhere a page already stands.
import { escapeHtml, layout } from "../../lib/shell.js";
import { scriptAddress } from "./build.js";
import { CARD_CSS, cardFacts, cardLink, questCard } from "./cards.js";
import { COMPOUND_JOIN_OPERATORS, readBodyJoins, readSlotOrder } from "../../../public/js/semantic/expression-query.js";
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
/** A body's parts, held four ways; each says what the separator does. */
const BODY_TURNS = Object.freeze([
  ["ident", ".", "hold it as one name", "dots inside one brace make one name the parser keeps whole"],
  ["common", ",", "hold the parts together", "commas keep parts apart and present at once"],
  ["ordinal", ";", "hold the parts in order", "semicolons put the parts in a sequence"],
  ["project", " ~> ", "make the parts a path", "~> carries each part on to the next without collapsing them"],
]);
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

/** Where a line keeps its slots: its scene before the word or among the braces, and the braces in the order its author wrote. */
function layoutOf(line) {
  const left = String(line).split(/\s+[~&^@]\s+/)[0];
  return readSlotOrder(left);
}

/* Each brace pair names its slot wherever it sits (the creator, 2026-11-05). A
   pivot writes the line back in its author's order; a new slot takes its place
   in the atlas order or the guide order the line already follows. */
const ATLAS = Object.freeze(["mode", "body", "scope", "projection"]);
const GUIDE = Object.freeze(["projection", "scope", "mode", "body"]);
const WRAP = Object.freeze({ mode: ["[", "]"], body: ["{", "}"], scope: ["(", ")"], projection: ["<", ">"] });
const isSubsequence = (part, whole) => { let at = 0; for (const item of whole) if (item === part[at]) at += 1; return at === part.length; };
const orderFor = (written = []) => (isSubsequence(written, ATLAS) ? ATLAS : isSubsequence(written, GUIDE) ? GUIDE : [...written, ...ATLAS.filter((slot) => !written.includes(slot))]);

/** A line written back from its slots, keeping where its scene sat. */
export function lineFrom(slots, { sceneFirst = false, order = [] } = {}) {
  const containers = orderFor(order)
    .filter((slot) => slots[slot] && !(slot === "scope" && sceneFirst))
    .map((slot) => `${WRAP[slot][0]}${slots[slot]}${WRAP[slot][1]}`).join("");
  const left = `${slots.charge ? `${slots.charge}${slots.subject ? " " : ""}` : ""}${sceneFirst && slots.scope ? `(${slots.scope})` : ""}${slots.subject || ""}${containers}`;
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
  // How the body holds its parts: the four joins spwashi.com's direction cards teach (one name, held together, in order, a path).
  const held = readBodyJoins(slots.body || "");
  if (held.parts.length > 1) {
    for (const [kind, separator, label, why] of BODY_TURNS) {
      if (kind !== held.kind) add("body", "turn", label, { body: held.parts.join(separator) }, why);
    }
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

const JOIN_BY_KIND = new Map(BODY_TURNS.map(([kind, separator, label]) => [kind, { separator, label }]));
const OP_BY_NAME = new Map(OPERATORS.map((operator) => [operator.name, operator]));
/** How many lines the trail keeps behind the one in hand. */
const TRAIL_LIMIT = 5;

/** The line with one more part in its body, every part joined by the link chosen; null when it would not read back. */
export function withBodyPart(line, part, kind) {
  const reading = readSpecimen(line);
  const joining = JOIN_BY_KIND.get(kind);
  if (reading.file || !joining || !reading.slots.subject) return null;
  const held = readBodyJoins(reading.slots.body || "");
  const parts = [...held.parts.filter(Boolean), part];
  const next = lineFrom({ ...reading.slots, body: parts.join(joining.separator) }, layoutOf(line));
  return readSpecimen(next).slots.body ? next : null;
}

/** The line with an operator in front of its word, replacing a mark already there; null when the reader would not keep it. */
export function withFrontMark(line, operator) {
  const reading = readSpecimen(line);
  const subject = reading.slots.subject || "";
  if (reading.file || !subject || subject.startsWith("#>")) return null;
  const bare = subject.replace(/^[~?!*.^#@&=%$]+/, "");
  if (!bare) return null;
  const next = lineFrom({ ...reading.slots, subject: `${operator.sigil}${bare}` }, layoutOf(line));
  return readSpecimen(next).slots.subject === `${operator.sigil}${bare}` ? next : null;
}

/** The state a request asks for: a line on the shelf by id, or a typed line; one line only. */
export function pivotState(params) {
  const specimen = specimenById(params.get("s"));
  const typed = String(params.get("line") || "").trim();
  const from = String(params.get("from") || "").trim().slice(0, PIVOT_LIMIT);
  const trail = params.getAll("t").map((step) => String(step).trim().slice(0, PIVOT_LIMIT)).filter(Boolean).slice(-TRAIL_LIMIT);
  const op = OP_BY_NAME.get(String(params.get("op") || "")) || null;
  let base;
  if (specimen && !specimen.reading.file) base = { line: specimen.line, id: specimen.id, from, cut: false, refused: "" };
  else if (!typed) return { line: "", id: "", from: "", cut: false, refused: "", trail: [], op: null, added: null };
  else if (typed.includes("\n")) return { line: "", id: "", from: "", cut: false, refused: "one line at a time; a file opens in Build", trail: [], op: null, added: null };
  else {
    const line = typed.slice(0, PIVOT_LIMIT);
    const known = BY_LINE.get(flat(line));
    base = { line, id: known?.id || "", from: from && flat(from) !== flat(line) ? from : "", cut: typed.length > PIVOT_LIMIT, refused: "" };
  }
  // Adding to the body: the new part joins the others by the link chosen, and the line it came from is kept behind it.
  const part = String(params.get("add") || "").replace(/[\s{}[\]()<>;,]/g, "").slice(0, 40);
  if (part) {
    const kind = JOIN_BY_KIND.has(String(params.get("join"))) ? String(params.get("join")) : "common";
    const next = withBodyPart(base.line, part, kind);
    if (next && flat(next) !== flat(base.line)) {
      return { line: next, id: BY_LINE.get(flat(next))?.id || "", from: base.line, cut: false, refused: "", trail: [...trail, base.line].slice(-TRAIL_LIMIT), op: null, added: { part, kind } };
    }
  }
  return { ...base, trail, op, added: null };
}

/** An address for a line, carrying the trail that leads to it. */
function pivotHref(line, from, trail = []) {
  const params = new URLSearchParams({ line });
  if (from) params.set("from", from);
  for (const step of [...trail, from].filter(Boolean).slice(-TRAIL_LIMIT)) params.append("t", step);
  return `/pivot?${params}`;
}

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
    links: [cardLink(pivotHref(pivot.line, state.line, state.trail), "Pivot from here"), edit ? cardLink(edit, "Take it apart") : "", ...lands.links],
  });
}

/** This page's own address: the same line, the same way back, plus what is asked. */
function selfHref(state, extra = {}) {
  const params = new URLSearchParams({ line: state.line });
  if (state.from) params.set("from", state.from);
  for (const step of state.trail) params.append("t", step);
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  return `/pivot?${params}`;
}

/** The address of a step on the trail: that line, with the steps before it. */
const stepHref = (trail, index) => pivotHref(trail[index], trail[index - 1] || "", trail.slice(0, Math.max(0, index - 1)));

/** The way here, written the way Spw writes a path: origin ~> step ~> now. */
function trailNav(state) {
  if (!state.trail.length) return "";
  const join = '<li class="sep" aria-hidden="true"><code>~&gt;</code></li>';
  const steps = state.trail.map((step, index) => `<li><a href="${escapeHtml(stepHref(state.trail, index))}"><code>${readSpecimen(step).paint}</code></a></li>`);
  return `<nav class="trail" aria-label="The way here"><ol>${steps.join(join)}${join}<li aria-current="step"><code>${readSpecimen(state.line).paint}</code></li></ol></nav>`;
}

const DELIMITED = Object.freeze({ charge: (v) => v, subject: (v) => v, mode: (v) => `[${v}]`, body: (v) => `{${v}}`, scope: (v) => `(${v})`, projection: (v) => `<${v}>`, join: (v) => v });

/** Into the line: each of its parts as a handle to the turns of that slot. */
function slotHandles(reading, pivots) {
  const turned = new Set(pivots.map((pivot) => pivot.slot));
  const items = GROUP_ORDER.filter((slot) => reading.slots[slot]).map((slot) => {
    const face = `<code>${escapeHtml(DELIMITED[slot](reading.slots[slot]))}</code><span class="says">${escapeHtml(SLOT_SAYS[slot] || slot)}</span>`;
    return turned.has(slot) ? `<li><a href="#turn-${escapeHtml(slot)}">${face}</a></li>` : `<li><span>${face}</span></li>`;
  });
  return items.length ? `<nav class="slot-handles" aria-label="Its parts"><ul>${items.join("")}</ul></nav>` : "";
}

/** The operators as handles: activating one primes the line it would make; actualizing goes there. */
function operatorBand(state) {
  const handles = OPERATORS.map((operator) => {
    if (!withFrontMark(state.line, operator)) return "";
    const active = state.op?.name === operator.name;
    return `<li><a href="${escapeHtml(active ? selfHref(state) : selfHref(state, { op: operator.name }))}#operators"${active ? ' aria-current="true"' : ""} title="${escapeHtml(operator.reads)}"><span class="sigil">${escapeHtml(operator.sigil)}</span><span>${escapeHtml(operator.name)}</span></a></li>`;
  }).filter(Boolean);
  if (!handles.length) return "";
  const next = state.op ? withFrontMark(state.line, state.op) : null;
  const primed = next ? `
  <div class="primed" role="status">
    <p class="primed-head"><span class="sigil">${escapeHtml(state.op.sigil)}</span> ${escapeHtml(state.op.name)}: ${escapeHtml(state.op.reads)}</p>
    <p class="primed-line"><code>${readSpecimen(next).paint}</code></p>
    <p class="primed-acts"><a class="actualize" href="${escapeHtml(pivotHref(next, state.line, state.trail))}">Actualize: go to this line</a><span aria-hidden="true"> · </span><a href="${escapeHtml(selfHref(state))}#operators">Let it go</a></p>
  </div>` : "";
  return `<section class="operators" id="operators" aria-labelledby="operators-title">
  <h3 id="operators-title">An operator in front</h3>
  <p class="note">Activate one to see the line it makes; actualize it to go there.</p>
  <ul>${handles.join("")}</ul>${primed}
</section>`;
}

/** Adding to the body: a part, and the link that joins it to the rest. */
function addForm(state, reading) {
  if (!reading.slots.subject) return "";
  const held = readBodyJoins(reading.slots.body || "");
  const current = JOIN_BY_KIND.has(held.kind) ? held.kind : "common";
  const choices = BODY_TURNS.map(([kind, separator, label]) => `<label class="join-choice"><input type="radio" name="join" value="${kind}"${kind === current ? " checked" : ""}><code>${escapeHtml(separator.trim())}</code> <span>${escapeHtml(label)}</span></label>`).join("");
  const hidden = [["line", state.line], ["from", state.from], ...state.trail.map((step) => ["t", step])].filter(([, value]) => value)
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`).join("");
  return `<form class="add-part" method="get" action="/pivot">
  <fieldset>
    <legend>Add to what it holds</legend>
    <div class="find-row"><input name="add" type="text" maxlength="40" autocomplete="off" spellcheck="false" aria-label="A part to add" placeholder="a word"><button type="submit">Add</button></div>
    <div class="join-choices">${choices}</div>
  </fieldset>${hidden}
</form>`;
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
  const backHref = state.trail.length && flat(state.trail[state.trail.length - 1]) === flat(state.from) ? stepHref(state.trail, state.trail.length - 1) : pivotHref(state.from);
  const back = state.from ? `<p class="back"><a href="${escapeHtml(backHref)}">Back to <code>${readSpecimen(state.from).paint}</code></a></p>` : "";
  const added = state.added ? `<p class="note added" role="status">Added <code>${escapeHtml(state.added.part)}</code>, ${escapeHtml(JOIN_BY_KIND.get(state.added.kind).label)}.</p>` : "";
  const familyList = families.map(({ slot, query, n }) => `<li><a href="/specimens?q=${escapeHtml(encodeURIComponent(query))}#found"><code>${escapeHtml(query)}</code></a> ${n} lines, with ${escapeHtml(SLOT_SAYS[slot])} open</li>`).join("\n      ");
  const kin = (reading.slots.subject ? holding("subject", reading.slots.subject) : []).filter((specimen) => specimen.id !== state.id).slice(0, 6);
  return `${opening}
<section class="band here" aria-labelledby="here-title">
  <h2 id="here-title">The line</h2>
  ${trailNav(state)}
  ${questCard({
    tag: "div",
    glyph: reading.paint,
    name: here ? nameOf(here) : "a line you wrote",
    badges: [here ? "on the shelf" : "new", reading.part ? "read in part" : ""],
    body: cardFacts(Object.entries(reading.slots).map(([slot, value]) => [slot, `<code>${escapeHtml(value)}</code>`])),
    links: [scriptAddress(state.line) ? cardLink(scriptAddress(state.line), "Take it apart") : "", cardLink("/constructs#c-expression", "What each slot is")],
  })}
  ${added}${slotHandles(reading, pivots)}
  ${operatorBand(state)}
  ${addForm(state, reading)}
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
    .trail ol { display: flex; flex-wrap: wrap; align-items: center; gap: .2rem .45rem; margin: .3rem 0 .8rem; padding: 0; list-style: none; font: .85rem/1.4 var(--mono); font-variant-ligatures: none; }
    .trail a { display: inline-flex; align-items: center; min-height: 36px; }
    .trail .sep { color: var(--muted); }
    .slot-handles ul, .operators ul { display: flex; flex-wrap: wrap; gap: .35rem; margin: .7rem 0 0; padding: 0; list-style: none; }
    .slot-handles a, .slot-handles span:not(.says) { display: inline-grid; gap: .1rem; min-height: 44px; box-sizing: border-box; padding: .35rem .6rem; border: 1px solid var(--line); border-radius: var(--radius); color: inherit; text-decoration: none; }
    .slot-handles code { font: 600 .9rem/1.3 var(--mono); font-variant-ligatures: none; }
    .slot-handles .says { color: var(--muted); font: .74rem/1.2 var(--mono); }
    .operators { margin: 1.1rem 0 0; }
    .operators h3 { margin: 0; }
    .operators ul a { display: inline-grid; grid-template-columns: 2ch auto; align-items: baseline; min-height: 44px; box-sizing: border-box; padding: .45rem .6rem; border: 1px solid var(--line); border-radius: var(--radius); color: inherit; font: .85rem/1.3 var(--mono); text-decoration: none; }
    .operators .sigil, .primed .sigil { color: var(--accent); font-weight: 700; }
    .operators ul a[aria-current] { border-color: var(--accent); background: var(--accent-soft); }
    .slot-handles a:hover, .slot-handles a:focus-visible, .operators ul a:hover, .operators ul a:focus-visible { border-color: var(--accent); }
    /* Precise monospace: ~> and the rest show as typed, never as a ligature. */
    .here code, .add-part code, .slot-group code { font-variant-ligatures: none; }
    .primed { margin: .7rem 0 0; padding: .7rem .85rem; border: 1px dashed var(--accent); border-radius: var(--radius); }
    .primed p { margin: 0 0 .35rem; }
    .primed-line code { font: 600 1rem/1.5 var(--mono); font-variant-ligatures: none; overflow-wrap: anywhere; }
    .primed-acts a { display: inline-flex; align-items: center; min-height: 44px; }
    .add-part fieldset { margin: 1.1rem 0 0; padding: .6rem .85rem .8rem; border: 1px solid var(--line); border-radius: var(--radius); }
    .add-part legend { padding: 0 .3rem; font-weight: 650; }
    .join-choices { display: grid; gap: .1rem; margin: .5rem 0 0; }
    .join-choice { display: flex; align-items: center; gap: .55rem; min-height: 44px; }
    .join-choice code { min-width: 2.5ch; font: 700 1rem/1 var(--mono); font-variant-ligatures: none; color: var(--accent); }
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
