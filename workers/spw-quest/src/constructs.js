// /constructs: the shapes a line of Spw takes, one card each. A card says what
// the construct reads as, what holds it and what it holds (each a link to that
// card, so the page is a map you can walk), how the shelf uses it and where,
// and a pressed line to pivot from. Marks and braces come from the guide's
// tables (guide.js), so their names stay the workbench's; forms and patterns
// are written here. Usage is counted from the carried specimens once. Where the
// slot reader and the workbench name one thing two ways, the page says so and
// leaves the call open.
import { COMPOUND_JOIN_OPERATORS, readBodyJoins } from "../../../public/js/semantic/expression-query.js";
import { escapeHtml, layout } from "../../lib/shell.js";
import { CARD_CSS, cardFacts, cardLink, questCard } from "./cards.js";
import { paintFile, readFile } from "./file-reader.js";
import { CONTAINERS, OPERATORS } from "./guide.js";
import { PAGE_CSS, QUEST_HEAD, masthead } from "./page.js";
import { PAPER_CSS } from "./paper.js";
import { SPECIMENS, findSpecimens, readQuery, specimenById } from "./specimens.js";

const paint = (text) => paintFile(readFile(text));
const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);
const LINES = SPECIMENS.filter((specimen) => !specimen.reading.file);
const FILES = SPECIMENS.filter((specimen) => specimen.reading.file);
const MARK = /^([~?!*.^#@&=%$])/;

/** How the shelf's lines use marks, braces and joins, by position, counted once from the carried readings. */
export const USAGE = (() => {
  const position = { front: new Map(), after: new Map(), within: new Map(), between: new Map(), part: new Map() };
  const slots = new Map();
  const bodies = new Map();
  let nested = 0;
  let wordless = 0;
  for (const { reading } of LINES) {
    const s = reading.slots || {};
    for (const key of Object.keys(s)) bump(slots, key);
    const word = s.subject || "";
    const lead = MARK.exec(word);
    if (lead) bump(position.front, lead[1]);
    if (/\w\.$/.test(word)) bump(position.after, ".");
    for (const sigil of word.slice(1).match(/[~?!*^#@&=%$]/g) || []) bump(position.within, sigil);
    if (s.join) bump(position.between, s.join.split(" ")[0]);
    if (s.body) {
      const joins = readBodyJoins(s.body);
      bump(bodies, joins.kind);
      if (/[[{]/.test(s.body)) nested += 1;
      for (const part of joins.parts || []) {
        const mark = MARK.exec(part);
        if (mark) bump(position.part, mark[1]);
      }
    }
    if (s.charge && !s.subject) wordless += 1;
  }
  return { position, slots, bodies, nested, wordless, lines: LINES.length };
})();

const count = (map, key) => map.get(key) || 0;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* ---------- The catalog ---------- */

/** A herbarium form or a page's line for each mark, where the shelf holds one. */
// Workbench relation: harmony. Marks and braces take the guide's names; forms, patterns and the join table extend them and say where they part.
const MARK_PRESSED = Object.freeze({ "?": "h-probe", "~": "h-induct", "^": "h-project", "&": "h-subject", "$": "h-substrate", "#": "h-ground", ".": "h-settle", "@": "h-lens_bare" });
const BRACE_PRESSED = Object.freeze({ concept: "h-projected", scene: "r-755c824b", mode: "h-capsule", definition: "h-capsule" });
const BRACE_SLOT = Object.freeze({ concept: "projection", scene: "scope", mode: "mode", definition: "body" });

const cardId = (key) => `c-${key}`;
const MARK_NAME = new Map(OPERATORS.map((operator) => [operator.sigil, operator.name]));

/**
 * Forms a line is built from. `holds` and `heldBy` are card keys: marks by
 * name, braces by name, forms and patterns by key. `n` counts the shelf.
 */
const LINE_FORMS = Object.freeze([
  { key: "word", name: "the word", shape: "home", reads: "What the line is about. Everything else in the line says how to read it.", holds: ["potential", "wonder", "ascension", "subject", "substrate", "vibration"], heldBy: ["expression"], n: () => count(USAGE.slots, "subject"), query: "home" },
  { key: "expression", name: "an expression", shape: "home[hook]{software.art.practice}(atlas)<person>", reads: "A word, the lens it is read through, what it holds, the scene, and where it goes. Any slot may be left out, and nearly every line keeps the word.", holds: ["word", "mode", "definition", "scene", "concept", "charge"], heldBy: ["compound", "nesting", "wonder-block"], n: () => USAGE.lines, pressed: "r-e6f488e3" },
  { key: "charge", name: "a charge in front", shape: "boon.honk home[hook]", reads: "One of five valence words before the word (boon, bane, bone, bonk, honk), saying how the material changes. They ride the word; they are not the word.", holds: [], heldBy: ["expression"], n: () => count(USAGE.slots, "charge"), pressed: "r-1468ec72" },
  { key: "tight", name: "a tight body", shape: "{software.art.practice}", reads: "Parts joined by dots. The search reads three parts; the parser reads one word.", holds: [], heldBy: ["definition"], n: () => count(USAGE.bodies, "ident"), pressed: "h-capsule" },
  { key: "sequence", name: "a sequence", shape: "{sow; tend; harvest}", reads: "Parts in order, each a step after the last.", holds: [], heldBy: ["definition"], n: () => count(USAGE.bodies, "ordinal") },
  { key: "list", name: "a list", shape: "{voice, scene, turn}", reads: "Parts side by side, with no order between them.", holds: [], heldBy: ["definition"], n: () => count(USAGE.bodies, "common") },
  { key: "project-join", name: "a movement", shape: "{scrap ~> mill}", reads: "One part carried to the next: movement between distinct places, not a list.", holds: ["potential"], heldBy: ["definition"], n: () => count(USAGE.bodies, "project") },
  { key: "nesting", name: "a body inside a body", shape: "outer[mode]{inner[deep]{leaf}}", reads: "An expression held inside another's definition. What holds what is the shape itself.", holds: ["expression"], heldBy: ["definition"], n: () => USAGE.nested, pressed: "h-one_deep" },
  { key: "compound", name: "two lines joined", shape: "a[x]{p} ~ b[y]{q}", reads: "Two whole expressions with a mark between them that names the bond. How Lines Join, below, lays the bonds side by side.", holds: ["expression", "potential", "ascension", "subject", "perspective"], heldBy: [], n: () => count(USAGE.slots, "join"), pressed: "h-induct_join" },
]);

/** Forms a .spw file is built from, around its lines. Shown as shapes; the gallery's files hold a few. */
const FILE_FORMS = Object.freeze([
  { key: "frame-address", name: "a frame address", shape: "#>wonder_sample", reads: "The name a block answers to, so another file can point at it.", holds: ["vibration"], heldBy: [], test: /^\s*#>\w/m },
  { key: "layer", name: "a layer", shape: "#:layer #!pragmatics", reads: "What kind of writing this is, as a tag the tools can read. The ! there is the # mark's aim, a tag.", holds: ["vibration"], heldBy: [], test: /^\s*#:\w+\s+#!/m },
  { key: "wonder-block", name: "a wonder", shape: '?["Does the line part at the name?"]{\n  ~#expect: "At the name."\n  !probe{ "compare the two" }\n  $%[part.name, part.body]\n}', reads: "A question that carries its guess, its probe and the answers it chooses among. A wonder may hold smaller wonders.", holds: ["reading", "measure-list", "wonder-block", "expression"], heldBy: ["frame-address", "wonder-block"], test: /\?\["/ },
  { key: "facet", name: "a facet", shape: ".{ status = #proposed }[reg=facet]", reads: "A small record of named values, read together.", holds: ["configuration"], heldBy: [], test: /\.\{/ },
  { key: "set", name: "a set", shape: "#[a, b, c][reg=set]", reads: "Members with no order to keep.", holds: [], heldBy: [], test: /#\[/ },
  { key: "citation", name: "a citation", shape: '~"./roadmap.spw#lifecycle"', reads: "A path to another file, and the anchor inside it.", holds: ["potential"], heldBy: ["handle"], test: /~"[^"]+"/ },
  { key: "handle", name: "a handle", shape: '@roadmap: ~"./roadmap.spw"', reads: "A short name declared once for a citation, so prose can say @roadmap.", holds: ["perspective", "citation"], heldBy: [], test: /^\s*@\w+:/m },
  { key: "stream", name: "a stream entry", shape: ">>[2026-10-27 13:32] probe — what the run showed.", reads: "A dated line saying what happened: observed, decided, probed.", holds: [], heldBy: [], test: />>\[/ },
  { key: "reading", name: "a reading beside", shape: "~#lens(comparison)", reads: "A reading set beside its subject, by name, so tools can count it.", holds: ["potential", "vibration"], heldBy: ["wonder-block"], test: /~#\w+\(/ },
  { key: "measure-list", name: "a measure list", shape: "$%[part.name, part.body]", reads: "What a question would measure, or the answers it chooses among. The form does not say which.", holds: ["substrate", "measure"], heldBy: ["wonder-block"], test: /\$%\[/ },
]);

/** Moving between lines: what the shelf and the pivot page do with two lines, or one. */
const PATTERNS = Object.freeze([
  { key: "ground-edge", name: "ground, then edge", reads: "Read two lines side by side: the slots they share, then the slot where they part.", href: "/specimens?a=h-prefixed_compound&b=h-induct_join#compare", label: "Compare two" },
  { key: "template", name: "a template with a slot", reads: "Keep one slot and open another; the lines that fill the open slot are a family.", href: "/specimens?q=theory%5B*%5D#found", label: "theory[*]", n: () => findSpecimens(readQuery("theory[*]")).length },
  { key: "departs", name: "departs from", reads: "A form written against another. Read the pair to see what it changed.", href: "/specimens?a=h-lens_over_compound&b=h-induct_join#compare", label: "Read a pair", n: () => SPECIMENS.filter((specimen) => specimen.from).length },
  { key: "pivot", name: "a pivot", reads: "Change one slot and keep the rest. See where the line lands before you go there.", href: "/pivot?s=r-e6f488e3", label: "Pivot a line" },
  { key: "residue", name: "residue", reads: "Drop a slot and read what the line still says.", href: "/pivot?s=r-e6f488e3#drop", label: "Drop a slot" },
]);

/** Every card key and the name it is linked by. */
const NAMES = new Map([
  ...OPERATORS.map((operator) => [operator.name, `${operator.sigil} ${operator.name}`]),
  ...CONTAINERS.map((brace) => [brace.name, `${brace.open} ${brace.close} ${brace.name}`]),
  ...[...LINE_FORMS, ...FILE_FORMS, ...PATTERNS].map((form) => [form.key, form.name]),
]);
export const CONSTRUCT_KEYS = Object.freeze([...NAMES.keys()]);

const chips = (keys) => (keys.length
  ? `<span class="qc-chips">${keys.map((key) => `<a href="#${cardId(key)}">${escapeHtml(NAMES.get(key) || key)}</a>`).join("")}</span>`
  : "");

/** The edges of the map, both ways: a card's holds and held-by, filled in from every card that names it. */
export const EDGES = (() => {
  const holds = new Map(CONSTRUCT_KEYS.map((key) => [key, new Set()]));
  const heldBy = new Map(CONSTRUCT_KEYS.map((key) => [key, new Set()]));
  const MARK_FRONT = ["potential", "wonder", "ascension", "subject", "substrate", "vibration"];
  for (const form of [...LINE_FORMS, ...FILE_FORMS]) {
    for (const key of form.holds) { holds.get(form.key).add(key); heldBy.get(key)?.add(form.key); }
    for (const key of form.heldBy) { heldBy.get(form.key).add(key); holds.get(key)?.add(form.key); }
  }
  for (const brace of CONTAINERS) { heldBy.get(brace.name).add("expression"); holds.get("expression").add(brace.name); }
  holds.get("definition").add("tight").add("sequence").add("list").add("project-join").add("nesting");
  for (const key of ["tight", "sequence", "list", "project-join", "nesting"]) heldBy.get(key).add("definition");
  for (const key of MARK_FRONT) heldBy.get(key).add("word");
  return { holds, heldBy };
})();

const edgeFacts = (key) => [
  ["held by", chips([...EDGES.heldBy.get(key)])],
  ["holds", chips([...EDGES.holds.get(key)])],
];

function pressedLine(id) {
  const specimen = specimenById(id);
  if (!specimen || specimen.reading.file) return "";
  return `<code>${specimen.reading.paint}</code>`;
}

const pivotLink = (id) => (specimenById(id) ? cardLink(`/pivot?s=${id}`, "Pivot it") : "");
const findLink = (query) => (query && findSpecimens(readQuery(query)).length ? cardLink(`/specimens?q=${encodeURIComponent(query)}#found`, `Find ${query}`) : "");

/* ---------- Cards ---------- */

function markCard(operator) {
  const { sigil, name } = operator;
  const where = [
    ["in front of a word", count(USAGE.position.front, sigil)],
    ["after a word", count(USAGE.position.after, sigil)],
    ["inside a word", count(USAGE.position.within, sigil)],
    ["between two lines", count(USAGE.position.between, sigil)],
    ["in front of a part", count(USAGE.position.part, sigil)],
  ].filter(([, n]) => n);
  const used = where.length
    ? where.map(([place, n]) => `${escapeHtml(place)} ${n}`).join("; ")
    : "No line on the shelf uses it yet.";
  const bond = COMPOUND_JOIN_OPERATORS[sigil];
  return questCard({
    id: cardId(name),
    glyph: paint(sigil),
    name,
    badges: ["mark"],
    body: cardFacts([
      ["reads", escapeHtml(operator.reads)],
      ["on the shelf", used],
      ["between lines", bond ? `the slot reader calls the bond <em>${escapeHtml(bond)}</em>` : ""],
      ["pressed", pressedLine(MARK_PRESSED[sigil])],
      ...edgeFacts(name),
    ]),
    links: [pivotLink(MARK_PRESSED[sigil])],
  });
}

function braceCard(brace) {
  const slot = BRACE_SLOT[brace.name];
  const n = count(USAGE.slots, slot);
  return questCard({
    id: cardId(brace.name),
    glyph: paint(`${brace.open} ${brace.close}`),
    name: brace.name,
    badges: ["brace", `slot: ${slot}`],
    body: cardFacts([
      ["reads", escapeHtml(brace.reads)],
      ["on the shelf", `${plural(n, "line")} of ${USAGE.lines}`],
      ["pressed", pressedLine(BRACE_PRESSED[brace.name])],
      ...edgeFacts(brace.name),
    ]),
    links: [pivotLink(BRACE_PRESSED[brace.name])],
  });
}

function lineFormCard(form) {
  const n = form.n();
  return questCard({
    id: cardId(form.key),
    glyph: paint(form.shape),
    name: form.name,
    badges: ["line"],
    body: cardFacts([
      ["reads", escapeHtml(form.reads)],
      ["on the shelf", n ? `${plural(n, "line")} of ${USAGE.lines}` : "No line on the shelf yet."],
      ["pressed", form.pressed ? pressedLine(form.pressed) : ""],
      ...edgeFacts(form.key),
    ]),
    links: [form.pressed ? pivotLink(form.pressed) : "", findLink(form.query)],
  });
}

function fileFormCard(form) {
  const files = FILES.filter((specimen) => form.test.test(specimen.line)).length;
  return questCard({
    id: cardId(form.key),
    glyph: paint(form.shape),
    name: form.name,
    badges: ["file"],
    body: cardFacts([
      ["reads", escapeHtml(form.reads)],
      ["in the gallery", files ? `${plural(files, "file")} of ${FILES.length}` : ""],
      ...edgeFacts(form.key),
    ]),
    links: [files ? cardLink("/specimens#gallery", "Open the gallery") : ""],
  });
}

function patternCard(pattern) {
  const n = pattern.n ? pattern.n() : 0;
  return questCard({
    id: cardId(pattern.key),
    name: pattern.name,
    badges: ["between lines"],
    body: cardFacts([
      ["reads", escapeHtml(pattern.reads)],
      ["on the shelf", n ? plural(n, "line") : ""],
    ]),
    links: [cardLink(pattern.href, pattern.label)],
  });
}

/* ---------- How lines join ---------- */

/** Every way the shelf joins two things, with the word the slot reader gives it and the mark's own name. */
export function joinRows() {
  const between = (sigil) => ({ form: `a ${sigil} b`, where: "between two lines", reader: COMPOUND_JOIN_OPERATORS[sigil], mark: MARK_NAME.get(sigil), n: count(USAGE.position.between, sigil) });
  return [
    between("~"), between("^"), between("&"), between("@"),
    { form: "{a ~> b}", where: "inside a body", reader: "project", mark: MARK_NAME.get("~"), n: count(USAGE.bodies, "project") },
    { form: "{a; b}", where: "inside a body", reader: "ordinal", mark: "", n: count(USAGE.bodies, "ordinal") },
    { form: "{a, b}", where: "inside a body", reader: "common", mark: "", n: count(USAGE.bodies, "common") },
    { form: "{a.b}", where: "inside a body", reader: "ident", mark: MARK_NAME.get("."), n: count(USAGE.bodies, "ident") },
  ];
}

/** Where one name covers two forms, or one form reads two ways. Each is a question, not a ruling. */
export function namingQuestions() {
  const rows = joinRows();
  const n = (form) => rows.find((row) => row.form === form).n;
  return [
    `<em>project</em> names two forms: <code>a ^ b</code> between two lines (${n("a ^ b")} on the shelf) and <code>{a ~&gt; b}</code> inside a body (${n("{a ~> b}")}). The mark <code>^</code> is called ascension, and <code>~</code> potential.`,
    `<strong>Settled.</strong> <em>lens</em> used to name two things. <code>@</code> is an operation of perspective regarding its operand, so <code>viewer@subject</code> (${count(USAGE.position.within, "@") + n("a @ b")} on the shelf) reads the subject from the viewer's position, and the slot reader calls an <code>@</code> join perspective; the <code>[ ]</code> brace keeps the lens you are using (${count(USAGE.slots, "mode")}).`,
    `<code>~</code> reads three ways by where it sits: potential in front of a word (${count(USAGE.position.front, "~")}), induct between two lines (${n("a ~ b")}), and the start of a movement inside a body (${n("{a ~> b}")}).`,
    `The dot: to the parser <code>software.art.practice</code> is one word; the search reads three parts. ${n("{a.b}")} bodies on the shelf are written this way, and <code>.</code> on its own is called ground.`,
    `A charge with nothing to ride: ${USAGE.wordless} lines open with a valence word and no other word, as <code>bane[bone]{limit}</code> does, so the reader takes the valence word as the charge and finds no word. The workbench reads the five as modifiers on a word.`,
  ];
}

function joinSection() {
  const rows = joinRows().map((row) => `<tr><td><code>${paint(row.form)}</code><span class="where">${escapeHtml(row.where)}</span></td><td>${escapeHtml(row.reader || "")}</td><td>${escapeHtml(row.mark || "")}</td><td class="n">${row.n}</td></tr>`).join("\n      ");
  return `<section id="joins" class="band" aria-labelledby="joins-title">
  <h2 id="joins-title">How lines join</h2>
  <p>Every way the shelf joins two things, with the word spwashi.com's slot reader gives each and the name the workbench gives its mark.</p>
  <div class="table-scroll"><table class="joins">
    <thead><tr><th scope="col">form, and where</th><th scope="col">reader says</th><th scope="col">mark is called</th><th scope="col" class="n">lines</th></tr></thead>
    <tbody>
      ${rows}
    </tbody>
  </table></div>
  <h3 id="names">Where the names part</h3>
  <p>Each is open unless it says it is settled. Position may be the whole answer: a mark in front, between, and inside a body need not read alike.</p>
  <ol class="questions">
    ${namingQuestions().map((question) => `<li>${question}</li>`).join("\n    ")}
  </ol>
</section>`;
}

/* ---------- The anatomy, and the page ---------- */

const ANATOMY = Object.freeze([
  ["home", "word", "the word"],
  ["[hook]", "mode", "the lens"],
  ["{software.art.practice}", "definition", "what it holds"],
  ["(atlas)", "scene", "the scene"],
  ["<person>", "concept", "where it goes"],
]);

function anatomy() {
  const line = ANATOMY.map(([text, key]) => `<a class="seg" href="#${cardId(key)}">${paint(text)}</a>`).join("");
  const keys = ANATOMY.map(([text, key, says]) => `<li><a href="#${cardId(key)}"><code>${escapeHtml(text)}</code></a> ${escapeHtml(says)}</li>`).join("");
  return `<figure class="anatomy" aria-labelledby="anatomy-title">
  <figcaption id="anatomy-title">One line from spwashi.com's home page, taken apart. Each part opens its card.</figcaption>
  <p class="anatomy-line"><code>${line}</code></p>
  <ol class="anatomy-keys">${keys}</ol>
</figure>`;
}

const FAMILIES = Object.freeze([
  { id: "braces", title: "Braces", says: "Four pairs. Each holds one slot of a line.", cards: () => CONTAINERS.map(braceCard) },
  { id: "marks", title: "Marks", says: "Twelve single sigils, named as the workbench names them. A mark reads by where it sits.", cards: () => OPERATORS.map(markCard) },
  { id: "line-forms", title: "Forms in a line", says: "What a line is built from, around its braces.", cards: () => LINE_FORMS.map(lineFormCard) },
  { id: "file-forms", title: "Forms in a file", says: "What a .spw file holds around its lines.", cards: () => FILE_FORMS.map(fileFormCard) },
  { id: "patterns", title: "Between lines", says: "What you can do with two lines, or with one and a change.", cards: () => PATTERNS.map(patternCard) },
]);

export function constructsBody() {
  const families = FAMILIES.map((family) => `<section id="${family.id}" class="band" aria-labelledby="${family.id}-title">
  <h2 id="${family.id}-title">${escapeHtml(family.title)}</h2>
  <p>${escapeHtml(family.says)}</p>
  <div class="qc-grid">
    ${family.cards().join("\n    ")}
  </div>
</section>`);
  const index = FAMILIES.map((family) => `<li><a href="#${family.id}">${escapeHtml(family.title)}</a></li>`).join("");
  return `<section class="opening" aria-labelledby="constructs-title">
  <h1 id="constructs-title">Constructs</h1>
  <p class="lede">The shapes a line of Spw takes, one card each: what it reads as, what holds it, what it holds, and how often the ${USAGE.lines} lines on the shelf use it. Every name on a card is a door to that card.</p>
  ${anatomy()}
  <nav class="families" aria-label="Families"><ul>${index}<li><a href="#joins">How lines join</a></li></ul></nav>
</section>
${families.slice(0, 3).join("\n")}
${joinSection()}
${families.slice(3).join("\n")}`;
}

export const CONSTRUCTS_CSS = `${CARD_CSS}
    .opening { margin: 0 0 1.2rem; }
    .opening h1 { margin: 0 0 .5rem; font-size: clamp(1.8rem, 5vw, 2.4rem); }
    .opening .lede { max-width: 44rem; margin: 0; color: var(--ink-soft); }
    [id] { scroll-margin-top: 1.25rem; }
    section.band { margin: 2.4rem 0 0; padding: 1.6rem 0 0; border-top: 1px solid var(--line); }
    section.band > p { max-width: 46rem; }
    .anatomy { margin: 1.2rem 0 0; padding: .9rem 1rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--field); }
    .anatomy figcaption { color: var(--muted); font-size: .88rem; }
    .anatomy-line { margin: .5rem 0; font: 600 clamp(1rem, 3.6vw, 1.35rem)/1.5 var(--mono); overflow-wrap: anywhere; }
    .anatomy .seg { color: inherit; text-decoration: none; border-radius: .2rem; box-shadow: inset 0 -1px 0 var(--line); }
    .anatomy .seg:hover, .anatomy .seg:focus-visible { background: var(--accent-soft); box-shadow: inset 0 -2px 0 var(--accent); }
    .anatomy-keys { display: flex; flex-wrap: wrap; gap: .1rem 1rem; margin: 0; padding: 0; list-style: none; color: var(--muted); font-size: .88rem; }
    .anatomy-keys a { display: inline-flex; align-items: center; min-height: 32px; }
    ${ANATOMY.map(([, key]) => `.anatomy:has(.anatomy-keys a[href="#${cardId(key)}"]:is(:hover, :focus-visible)) .seg[href="#${cardId(key)}"]`).join(",\n    ")} { background: var(--accent-soft); box-shadow: inset 0 -2px 0 var(--accent); }
    .families ul { display: flex; flex-wrap: wrap; gap: .1rem 1.1rem; margin: 1rem 0 0; padding: 0; list-style: none; }
    .families a { display: inline-flex; align-items: center; min-height: 44px; }
    .table-scroll { max-width: 100%; overflow-x: auto; }
    .joins { width: 100%; max-width: 52rem; border-collapse: collapse; font-size: .9rem; }
    .joins th, .joins td { padding: .4rem .55rem; border-top: 1px solid var(--line); text-align: left; vertical-align: top; }
    .joins thead th { border-top: 0; color: var(--muted); font: 500 .76rem/1.2 var(--mono); }
    .joins td code { white-space: nowrap; }
    .joins .where { display: block; color: var(--muted); font-size: .8rem; }
    .joins .n { text-align: right; font-variant-numeric: tabular-nums; }
    .questions { display: grid; gap: .5rem; max-width: 46rem; margin: .4rem 0 0; padding-left: 1.3rem; }
    @media (pointer: coarse) { .anatomy-keys a { min-height: 44px; } }`;

/** The whole page, under the shared head, masthead and paper. */
export function renderConstructs() {
  return layout({
    title: "spw.quest — constructs",
    description: "The shapes a line of Spw takes, one card each, with what holds it, what it holds, and how the shelf uses it.",
    canonical: "https://spw.quest/constructs",
    head: QUEST_HEAD,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}
    ${CONSTRUCTS_CSS}`,
    body: `${masthead("/constructs")}
${constructsBody()}
<p class="also"><a href="/specimens">Specimens</a> · <a href="/pivot">Pivot a line</a> · <a href="/build">Take one line apart</a> · <a href="/learn">Learn it a mark at a time</a></p>`,
  });
}
