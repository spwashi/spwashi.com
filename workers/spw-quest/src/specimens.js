// The specimens: lines of Spw carried from spwashi.com by carry-specimens.mjs,
// read when they were carried (src/specimen-reading.js) and served with scripts
// off. Two lines compare the way `npm run spw:routes -- --diff` reads two
// routes: the slots they share, then the slot where they part. The slots come
// from the site's one slot reader, public/js/semantic/expression-query.js; when
// a form holds more than that reader takes, the page says so instead of guessing.
import { parseExpressionQuery } from "../../../public/js/semantic/expression-query.js";
import { escapeHtml } from "../../lib/shell.js";
import { scriptAddress } from "./build.js";
import { SPECIMENS } from "./specimens-data.js";

export { SPECIMENS };
export const readingOfSpecimen = (specimen) => specimen.reading;

/** The slots in the order a line is read, as spw:routes --diff names them; a joined line adds how and to what. */
export const SLOT_ORDER = Object.freeze(["subject", "mode", "body", "projection", "scope", "charge", "join", "with"]);
const SLOT_WORDS = Object.freeze({
  subject: "the word",
  mode: "[the lens]",
  body: "{what it holds}",
  projection: "<where it goes>",
  scope: "(the scene)",
  charge: "the charge in front",
  join: "how it joins",
  with: "what it joins",
});

/** How many matches a search shows; the count says how many more there are. */
export const FOUND_LIMIT = 60;

const BY_ID = new Map(SPECIMENS.map((specimen) => [specimen.id, specimen]));
export const specimenById = (id) => BY_ID.get(String(id || "")) || null;

const flat = (value) => String(value || "").replace(/\s+/g, "");
const readingOf = (specimen) => specimen.reading;

/** What a name looks like on a card and in a comparison. */
export function nameOf(specimen) {
  if (specimen.source === "routes") return `${specimen.route}#${specimen.section}`;
  return specimen.name;
}

/** Where a specimen lives on spwashi.com: the section that carries it, or the parser with it open. */
export function whereOf(specimen) {
  if (specimen.source === "routes") {
    return { href: `https://spwashi.com${specimen.route}#${encodeURIComponent(specimen.section)}`, label: `spwashi.com${specimen.route}#${specimen.section}` };
  }
  const url = new URL("https://spwashi.com/tools/spw-parser/");
  if (specimen.source === "gallery") url.searchParams.set("spw_sample", specimen.key);
  else {
    url.searchParams.set("spw_source", specimen.line);
    url.searchParams.set("spw_source_name", `${specimen.file.split("/").pop()}#${specimen.name}`);
  }
  url.hash = "literal-parser";
  return { href: url.href, label: specimen.source === "gallery" ? "Open in spwashi.com's parser" : "Read in spwashi.com's parser" };
}

/* ---------- Finding by slot ---------- */

const startsWith = (hay, needle) => String(hay || "").toLowerCase().startsWith(String(needle || "").toLowerCase());
const bare = (word) => String(word || "").replace(/^[~?!@*^#&=%$.>:]+/, "");
const wordsOf = (shape) => [shape.subject, bare(shape.subject), shape.mode, shape.projection, shape.scope, ...(shape.parts || []), ...(shape.charge || [])].filter(Boolean);

/** A query names some slots and leaves the rest out; `*` asks only that a slot be there. Every slot it names must hold. */
export function readQuery(raw) {
  const text = String(raw || "").trim().slice(0, 120);
  return text ? parseExpressionQuery(text) : null;
}

function sideMatches(shape, query) {
  const slot = (value, wanted) => (wanted && wanted !== "*" ? startsWith(value, wanted) || startsWith(bare(value), wanted) : Boolean(value));
  if (query.charge.length && !query.charge.every((charge) => (shape.charge || []).includes(charge))) return false;
  if (!query.wrapped) return query.freeTokens.every((token) => wordsOf(shape).some((word) => startsWith(word, token)));
  if (query.subject && !slot(shape.subject, query.subject)) return false;
  if (query.hasModeSlot && !slot(shape.mode, query.mode)) return false;
  if (query.hasBodySlot) {
    const wanted = query.parts.filter((part) => part && part !== "*");
    const parts = shape.parts || [];
    if (wanted.length ? !wanted.every((part) => parts.some((own) => slot(own, part))) : !parts.length) return false;
  }
  if (query.hasProjectionSlot && !slot(shape.projection, query.projection)) return false;
  return true;
}

/** Whether a line holds what the query names, on either side of a join. */
export function matchesQuery(specimen, query) {
  const reading = readingOf(specimen);
  if (reading.file || !query) return false;
  return sideMatches(reading.shape, query) || Boolean(reading.right && sideMatches(reading.right, query));
}

export const findSpecimens = (query) => SPECIMENS.filter((specimen) => matchesQuery(specimen, query));

/* ---------- Two lines, side by side ---------- */

/** The ground two lines share, then the slots that moved, in reading order; the first of them is where they part. */
export function compareSpecimens(a, b) {
  const sa = readingOf(a).slots || {};
  const sb = readingOf(b).slots || {};
  const ground = SLOT_ORDER.filter((key) => sa[key] && sa[key] === sb[key]);
  const moved = SLOT_ORDER.filter((key) => (sa[key] || "") !== (sb[key] || ""));
  return { ground, moved, first: moved[0] || null, same: flat(a.line) === flat(b.line) };
}

/* ---------- The page ---------- */

/** The page's state lives in its address: a search, and the lines being compared. */
function address({ q = "", a = "", b = "" } = {}, hash = "") {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (a) params.set("a", a);
  if (b) params.set("b", b);
  const search = params.toString();
  return `/specimens${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}

function slotList(slots, keys = SLOT_ORDER) {
  const rows = keys.filter((key) => slots[key]).map((key) => `<div><dt>${escapeHtml(key)}</dt><dd><code>${escapeHtml(slots[key])}</code></dd></div>`);
  return rows.length ? `<dl class="slots">${rows.join("")}</dl>` : "";
}

const FACES = new Map();

/** What a card always shows: its name, its line in paint, its slots and its note. Built once per specimen. */
function face(specimen) {
  if (FACES.has(specimen.id)) return FACES.get(specimen.id);
  const reading = readingOf(specimen);
  const title = specimen.source === "routes"
    ? `<p class="name">${escapeHtml(specimen.route)}${specimen.also ? ` <span class="also-on">and ${specimen.also} more</span>` : ""}</p>`
    : `<p class="name">${escapeHtml(specimen.name)}</p>`;
  const line = reading.file ? `<pre class="line"><code>${reading.paint}</code></pre>` : `<p class="line"><code>${reading.paint}</code></p>`;
  const html = `
      ${title}
      ${line}
      ${reading.file ? "" : slotList(reading.slots)}${reading.part ? `
      <p class="part">The slot reader takes part of this line; what it leaves out is not compared.</p>` : ""}${specimen.note ? `
      <p class="note">${escapeHtml(specimen.note)}</p>` : ""}`;
  FACES.set(specimen.id, html);
  return html;
}

/** What a card offers: where it lives, the editor, and a comparison that keeps the page's state. */
function moves(specimen, state) {
  const reading = readingOf(specimen);
  const where = whereOf(specimen);
  const edit = scriptAddress(specimen.line);
  const compare = reading.file ? "" : !state.a
    ? `<a href="${escapeHtml(address({ q: state.q, a: specimen.id }, "compare"))}">Compare</a>`
    : state.a === specimen.id ? `<span class="held">Held to compare</span>`
      : `<a href="${escapeHtml(address({ q: state.q, a: state.a, b: specimen.id }, "compare"))}">Compare with this</a>`;
  const origin = specimen.from && specimenById(specimen.from);
  const links = [
    `<a href="${escapeHtml(where.href)}">${escapeHtml(where.label)}</a>`,
    edit ? `<a href="${escapeHtml(edit)}">Edit</a>` : "",
    reading.file ? "" : `<a href="/pivot?s=${escapeHtml(specimen.id)}">Pivot</a>`,
    compare,
    origin ? `<a href="${escapeHtml(address({ q: state.q, a: specimen.id, b: origin.id }, "compare"))}">Against ${escapeHtml(origin.name)}, where it departs from</a>` : "",
  ].filter(Boolean).join('<span aria-hidden="true"> · </span>');
  return `
      <p class="moves">${links}</p>`;
}

/** One card on the shelf, in the results, or in the pair. */
function card(specimen, state, { tag = "li", withMoves = true } = {}) {
  return `<${tag} class="specimen" id="s-${escapeHtml(specimen.id)}">${face(specimen)}${withMoves ? moves(specimen, state) : ""}
    </${tag}>`;
}

function compareSection(state) {
  const a = specimenById(state.a);
  if (!a || readingOf(a).file) return "";
  const b = specimenById(state.b);
  if (!b || readingOf(b).file || b === a) {
    return `<section id="compare" class="compare" aria-labelledby="compare-title">
  <h2 id="compare-title">Two lines, side by side</h2>
  <div class="pair">${card(a, state, { tag: "div", withMoves: false })}</div>
  <p>Held: <code>${escapeHtml(nameOf(a))}</code>. Choose a second line below; each now says <em>Compare with this</em>.</p>
  <p class="moves"><a href="${escapeHtml(address({ q: state.q }, `s-${a.id}`))}">Let it go</a></p>
</section>`;
  }
  const { ground, moved, first, same } = compareSpecimens(a, b);
  const sa = readingOf(a).slots;
  const sb = readingOf(b).slots;
  const part = [a, b].filter((specimen) => readingOf(specimen).part).map((specimen) => `<code>${escapeHtml(nameOf(specimen))}</code>`);
  const edge = same
    ? `<p>The same line, in two places.</p>`
    : `<p>They part first at <strong>${escapeHtml(first)}</strong>, ${escapeHtml(SLOT_WORDS[first])}.</p>
  <table class="edge">
    <thead><tr><th scope="col">slot</th><th scope="col">a</th><th scope="col">b</th></tr></thead>
    <tbody>
      ${moved.map((key) => `<tr${key === first ? ' class="first"' : ""}><th scope="row">${escapeHtml(key)}</th><td>${sa[key] ? `<code>${escapeHtml(sa[key])}</code>` : '<span class="none">none</span>'}</td><td>${sb[key] ? `<code>${escapeHtml(sb[key])}</code>` : '<span class="none">none</span>'}</td></tr>`).join("\n      ")}
    </tbody>
  </table>`;
  return `<section id="compare" class="compare" aria-labelledby="compare-title">
  <h2 id="compare-title">Two lines, side by side</h2>
  <div class="pair">
    <div class="side"><p class="label">a</p>${card(a, state, { tag: "div", withMoves: false })}</div>
    <div class="side"><p class="label">b</p>${card(b, state, { tag: "div", withMoves: false })}</div>
  </div>
  <h3>The ground they share</h3>
  ${ground.length ? slotList(sa, ground) : "<p>No slot holds the same thing in both.</p>"}
  <h3>Where they part</h3>
  ${edge}${part.length ? `
  <p class="part">The slot reader takes part of ${part.join(" and ")}; the rest of the line is not compared.</p>` : ""}
  <p class="moves"><a href="${escapeHtml(address({ q: state.q, a: b.id, b: a.id }, "compare"))}">Swap a and b</a><span aria-hidden="true"> · </span><a href="${escapeHtml(address({ q: state.q, a: a.id }, "compare"))}">Keep a, choose another b</a><span aria-hidden="true"> · </span><a href="${escapeHtml(address({ q: state.q }, `s-${a.id}`))}">Let both go</a></p>
</section>`;
}

/** Searches the corpus holds, each with what it asks; only the ones that find something are offered. */
const QUERY_EXAMPLES = Object.freeze([
  ["medium[*]", "medium, through any lens"],
  ["[pi]", "a lens that starts with pi"],
  ["{seed}", "something that holds seed"],
  ["<receipt>", "lines that go to a receipt"],
  ["garden", "garden, in any slot"],
]);

let offered = null;
const offeredExamples = () => (offered ||= QUERY_EXAMPLES.filter(([q]) => findSpecimens(readQuery(q)).length));

function findSection(state, query) {
  const examples = offeredExamples()
    .map(([q, says]) => `<li><a href="${escapeHtml(address({ q, a: state.a, b: state.b }, "found"))}"><code>${escapeHtml(q)}</code></a> ${escapeHtml(says)}</li>`).join("\n      ");
  const form = `<form class="find" method="get" action="/specimens#found" role="search">
    <label for="q">Find a line by its slots</label>
    <div class="find-row"><input id="q" name="q" type="search" value="${escapeHtml(state.q)}" maxlength="120" autocomplete="off" spellcheck="false" placeholder="medium[*]" aria-describedby="find-says"><button type="submit">Find</button></div>
    ${state.a ? `<input type="hidden" name="a" value="${escapeHtml(state.a)}">` : ""}${state.b ? `<input type="hidden" name="b" value="${escapeHtml(state.b)}">` : ""}
    <p id="find-says" class="note">Write the slots you know and leave the rest out. <code>*</code> asks only that a slot be there; a word with no braces may sit in any slot.</p>
    <ul class="examples">
      ${examples}
    </ul>
  </form>`;
  if (!query) return form;
  const found = findSpecimens(query);
  const shown = found.slice(0, FOUND_LIMIT);
  return `${form}
<section id="found" class="found" aria-labelledby="found-title">
  <h2 id="found-title">${found.length ? `${found.length} ${found.length === 1 ? "line holds" : "lines hold"} <code>${escapeHtml(query.raw)}</code>` : `No line here holds <code>${escapeHtml(query.raw)}</code>`}</h2>${found.length > shown.length ? `
  <p class="note">The first ${shown.length}, in shelf order. Name another slot to narrow it.</p>` : ""}
  ${shown.length ? `<ol class="shelf">
    ${shown.map((specimen) => card(specimen, state)).join("\n    ")}
  </ol>` : "<p>Leave a slot out, or try one of the searches above.</p>"}
</section>`;
}

/** The pages' rarer lines, by what makes them rare. A line may sit in more than one. */
const ROUTE_KINDS = Object.freeze([
  { id: "charged", title: "With a charge in front", test: ({ shape }) => (shape.charge || []).length > 0 },
  { id: "joined", title: "Joined to another line", test: ({ right }) => Boolean(right) },
  { id: "marked", title: "With a mark in front", test: ({ shape }) => /^[~?!@*^#&=%$]/.test(shape.subject || "") },
  { id: "scened", title: "Held in a scene", test: ({ shape }) => Boolean(shape.scope) },
]);

/** The shelf's rows, sorted once: the herbarium by its blocks, the pages' rarer lines by kind, and the gallery. */
const SHELF = (() => {
  const herbarium = SPECIMENS.filter((specimen) => specimen.source === "herbarium");
  const pages = SPECIMENS.filter((specimen) => specimen.source === "routes");
  return {
    groups: [...new Set(herbarium.map((specimen) => specimen.group))].map((group) => ({ group, members: herbarium.filter((specimen) => specimen.group === group) })),
    pages: pages.length,
    kinds: ROUTE_KINDS.map((kind) => ({ ...kind, members: pages.filter((specimen) => kind.test(readingOf(specimen))) })),
    files: SPECIMENS.filter((specimen) => specimen.source === "gallery"),
  };
})();

function shelf(state) {
  const { groups, pages, kinds: sorted, files } = SHELF;
  const pressed = groups.map(({ group, members }) => {
    return `<section class="group" aria-labelledby="group-${escapeHtml(group)}">
    <h3 id="group-${escapeHtml(group)}">${escapeHtml(group)} <span class="from-file">${escapeHtml(members[0].file.split("/").pop())}</span></h3>
    <ol class="shelf">
      ${members.map((specimen) => card(specimen, state)).join("\n      ")}
    </ol>
  </section>`;
  }).join("\n  ");
  const kinds = sorted.map(({ members, ...kind }, index) => {
    return `<details class="kind" id="pages-${kind.id}"${index === 0 ? " open" : ""}>
    <summary>${escapeHtml(kind.title)} <span class="count">${members.length}</span></summary>
    <ol class="shelf">
      ${members.map((specimen) => card(specimen, state)).join("\n      ")}
    </ol>
  </details>`;
  }).join("\n  ");
  return `<section id="pressed" class="band" aria-labelledby="pressed-title">
  <h2 id="pressed-title">Pressed forms</h2>
  <p>From the herbarium in spwashi.com's language notes, <code>.spw/language/expressions/</code>. The notes are the herbarium's own. A form that departs from another links to it.</p>
  ${pressed}
</section>

<section id="pages" class="band" aria-labelledby="pages-title">
  <h2 id="pages-title">Lines the pages carry</h2>
  <p>spwashi.com's pages carry ${pages} of these, each on the section it names. Most are a word, a lens and what it holds. These are the rarer ones; the search above reads all ${pages}.</p>
  ${kinds}
</section>

<section id="gallery" class="band" aria-labelledby="gallery-title">
  <h2 id="gallery-title">Files from the parser's gallery</h2>
  <p>The samples spwashi.com's parser opens with. Each is a small file: open it here in the editor, or in the parser where it came from.</p>
  <ol class="shelf files">
    ${files.map((specimen) => card(specimen, state)).join("\n    ")}
  </ol>
</section>`;
}

/** The state a request asks for: unknown lines are dropped rather than reflected. */
export function specimenState(params) {
  const known = (id) => (specimenById(id) && !readingOf(specimenById(id)).file ? id : "");
  const a = known(params.get("a"));
  return { q: String(params.get("q") || "").trim().slice(0, 120), a, b: a ? known(params.get("b")) : "" };
}

export function specimensBody(state) {
  const query = readQuery(state.q);
  return `<section class="opening" aria-labelledby="specimens-title">
  <h1 id="specimens-title">Specimens</h1>
  <p class="lede">Lines of Spw, kept where they were found: forms pressed in a herbarium, lines spwashi.com's pages carry, and files from the parser's gallery. Each is read here with scripts off. Hold two side by side to see the slots they share and the slot where they part.</p>
</section>
${compareSection(state)}
${findSection(state, query)}
${shelf(state)}`;
}

export const SPECIMENS_CSS = `.opening { margin: 0 0 1.2rem; }
    .opening h1 { margin: 0 0 .5rem; font-size: clamp(1.8rem, 5vw, 2.4rem); }
    .opening .lede { max-width: 44rem; margin: 0; color: var(--ink-soft); }
    [id] { scroll-margin-top: 1.25rem; }
    section.band { margin: 2.6rem 0 0; padding: 1.8rem 0 0; border-top: 1px solid var(--line); }
    section.band > p { max-width: 46rem; }
    .find { display: grid; gap: .4rem; max-width: 46rem; margin: 0 0 1rem; }
    .find label { font-weight: 650; }
    .find-row { display: flex; gap: .5rem; }
    .find input { flex: 1; min-width: 0; min-height: 44px; padding: .35rem .7rem; border: 1px solid var(--edge); border-radius: var(--radius); color: var(--fg); font: 1rem/1.3 var(--mono); }
    .find button { min-height: 44px; margin: 0; padding: 0 1rem; border: 1px solid var(--edge); border-radius: var(--pill); background: var(--surface); color: var(--accent); font: 600 .95rem/1 var(--font); cursor: pointer; }
    .find button:hover, .find button:focus-visible { background: var(--accent-soft); }
    .find .note { margin: 0; color: var(--muted); font-size: .9rem; }
    .examples { display: flex; flex-wrap: wrap; gap: .1rem 1.1rem; margin: 0; padding: 0; list-style: none; color: var(--muted); font-size: .88rem; }
    .examples a { display: inline-flex; align-items: center; min-height: 32px; }
    .shelf { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 21rem), 1fr)); gap: .6rem; margin: .8rem 0 0; padding: 0; list-style: none; }
    .shelf.files { grid-template-columns: repeat(auto-fill, minmax(min(100%, 28rem), 1fr)); }
    .specimen { display: grid; align-content: start; gap: .35rem; min-width: 0; margin: 0; padding: .75rem .85rem .8rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .specimen:target { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .specimen p { margin: 0; }
    .specimen .name { color: var(--muted); font: .78rem/1.3 var(--mono); overflow-wrap: anywhere; }
    .specimen .also-on { opacity: .8; }
    .specimen .line { font: 600 .98rem/1.45 var(--mono); overflow-wrap: anywhere; }
    .specimen pre.line { margin: 0; overflow-x: auto; font-weight: 500; font-size: .84rem; line-height: 1.5; white-space: pre; }
    .specimen .note { color: var(--ink-soft); font-size: .88rem; line-height: 1.45; }
    .specimen .part, .compare .part { color: var(--storm); font-size: .84rem; }
    .slots { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: .05rem .7rem; margin: 0; font-size: .86rem; }
    .slots div { display: contents; }
    .slots dt { color: var(--muted); font: .78rem/1.6 var(--mono); }
    .slots dd { margin: 0; overflow-wrap: anywhere; }
    .moves { display: flex; flex-wrap: wrap; align-items: center; gap: 0 .2rem; font-size: .86rem; }
    .moves a { display: inline-flex; align-items: center; min-height: 32px; }
    .moves .held { color: var(--accent); font-weight: 600; }
    @media (pointer: coarse) { .moves a, .examples a { min-height: 44px; } }
    .group { margin: 1.4rem 0 0; }
    .group h3 { display: flex; flex-wrap: wrap; align-items: baseline; gap: .2rem .6rem; }
    .from-file { color: var(--muted); font: 400 .78rem/1 var(--mono); }
    .kind { margin: 1rem 0 0; border-top: 1px solid var(--line); }
    .kind summary { display: flex; align-items: center; gap: .6rem; min-height: 44px; font-family: var(--manuscript); font-size: 1.12rem; font-weight: 600; cursor: pointer; }
    .kind .count { color: var(--muted); font: 500 .85rem/1 var(--mono); font-variant-numeric: tabular-nums; }
    .compare { margin: 0 0 1.6rem; padding: 1rem 1rem 1.1rem; border: 1px solid var(--accent); border-radius: var(--radius); background: var(--field); }
    .compare h3 { margin: 1.1rem 0 .4rem; }
    .compare .pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: .6rem; }
    .compare .side { display: grid; gap: .25rem; align-content: start; }
    .compare .label { margin: 0; color: var(--accent); font: 600 .8rem/1 var(--mono); }
    .edge { width: 100%; max-width: 46rem; border-collapse: collapse; font-size: .9rem; }
    .edge th, .edge td { padding: .35rem .5rem; border-top: 1px solid var(--line); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    .edge thead th { border-top: 0; color: var(--muted); font: 500 .78rem/1 var(--mono); }
    .edge tbody th { color: var(--muted); font: 500 .8rem/1.5 var(--mono); }
    .edge tr.first th, .edge tr.first td { background: var(--accent-soft); }
    .edge .none { color: var(--muted); font-style: italic; }
    .found { margin: 0 0 1.6rem; }
    .found h2 code { font-size: .85em; }`;
