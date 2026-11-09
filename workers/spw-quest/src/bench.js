// The bench: lines that press each feature of Spw against factshift.center's
// canvas, one feature a line, from the plainest form to the edges a reader
// has to hold. Each case says what it presses and what the canvas should
// show, and opens there by its line (?spw=).
//
// `expect` is what the canvas's reader (the workbench's slot reader the app
// vendors, release 2026.11.07-pre.1) makes of the line:
//   slots   the rooms read, in the order written (subject, mode, body, scope, projection)
//   parts   how many parts the body holds
//   whole   false when the reader leaves a tail unread
//   join    the mark between two expressions, for a line that joins two
// `gap` says where spw.quest's own reader (src/specimen-reading.js, which the
// shelf and /arcs/ read with) reads it otherwise. test/bench.test.mjs holds
// spw.quest's reader to every case: matching where no gap is named, differing
// where one is, so a gap that opens or closes fails until the bench says so.
// With the app checked out beside the site, it also holds the canvas's
// reader to every `expect`.
import { escapeHtml } from "../../lib/shell.js";
import { readSpecimen } from "./specimen-reading.js";
import { factshiftHref } from "./specimens.js";
import { OPERATORS } from "./guide.js";

const rooms = (...slots) => slots;

export const BENCH = Object.freeze([
  {
    id: "rooms",
    title: "One room at a time",
    say: "The word, then each pair alone, then all of them. The canvas draws a region per room and keeps them in written order.",
    cases: [
      { line: "garden", presses: "a word alone", look: "one node, no regions", expect: { slots: rooms("subject") } },
      { line: "garden[care]", presses: "a mode, [ ]", look: "the word with its lens framed above it", expect: { slots: rooms("subject", "mode") } },
      { line: "garden{seed}", presses: "a body, { }", look: "one part inside a body region", expect: { slots: rooms("subject", "body"), parts: 1 } },
      { line: "garden(spring)", presses: "a scene, ( )", look: "the scene as its own region", expect: { slots: rooms("subject", "scope") } },
      { line: "garden<harvest>", presses: "a concept, < >", look: "a concept node the line points to", expect: { slots: rooms("subject", "projection") } },
      { line: "garden[care]{seed, water}<harvest>(spring)", presses: "all five rooms", look: "word, lens, body, concept and scene, each in its place", expect: { slots: rooms("subject", "mode", "body", "projection", "scope"), parts: 2 } },
      { line: "(spring)garden{seed}", presses: "a scene written first", look: "the scene leads the word, as written", expect: { slots: rooms("scope", "subject", "body"), parts: 1 }, gap: "spw.quest reads the scene after the word" },
      { line: "<harvest>garden{seed}", presses: "a concept written first", look: "the concept leads the word", expect: { slots: rooms("projection", "subject", "body"), parts: 1 }, gap: "spw.quest reads only the concept, and drops the word and its body" },
    ],
  },
  {
    id: "joins",
    title: "How a body holds its parts",
    say: "The separator is the body's join, and each join has a figure on the canvas: in common a ring, in order a row, one name a chain, a path rising.",
    cases: [
      { line: "bread{flour, water, salt}", presses: "in common, ( , )", look: "a ring of three", expect: { slots: rooms("subject", "body"), parts: 3 } },
      { line: "bread{mix; rest; bake}", presses: "in order, ( ; )", look: "a row, read left to right", expect: { slots: rooms("subject", "body"), parts: 3 } },
      { line: "bread{crust.crumb.steam}", presses: "one name, ( . )", look: "a tight chain", expect: { slots: rooms("subject", "body"), parts: 3 } },
      { line: "bread{dough ~> loaf ~> toast}", presses: "a path, ( ~> )", look: "a path rising across the body", expect: { slots: rooms("subject", "body"), parts: 3 } },
      { line: "bread{}", presses: "an empty body", look: "an open region waiting for a part", expect: { slots: rooms("subject", "body"), parts: 0 }, gap: "spw.quest drops an empty body" },
      { line: "pantry{rice, oats, salt, oil, beans, tea, honey, flour, yeast, cocoa}", presses: "ten parts", look: "every part placed without overlap on a phone", expect: { slots: rooms("subject", "body"), parts: 10 } },
    ],
  },
  {
    id: "nesting",
    title: "Inside inside",
    say: "A part can be a line of its own. The canvas nests its regions inside the part, in the part's place.",
    cases: [
      { line: "kitchen{bread{flour, water}, soup{stock}}", presses: "two nested bodies side by side", look: "two regions inside the body, bread before soup", expect: { slots: rooms("subject", "body"), parts: 2 }, gap: "spw.quest stops at the nested brace and reads no body" },
      { line: "house{kitchen{shelf{jar{salt}}}}", presses: "four deep", look: "regions within regions, each inside its part", expect: { slots: rooms("subject", "body"), parts: 1 }, gap: "spw.quest stops at the nested brace and reads no body" },
      { line: "garden[care]{seed[slow]{root}<shoot>, water}", presses: "a part with rooms of its own", look: "the seed's lens, body and concept drawn inside the garden's body", expect: { slots: rooms("subject", "mode", "body"), parts: 2 }, gap: "spw.quest stops at the nested brace and reads no body" },
      { line: "garden{seed, water.{deep}}", presses: "a nested body after a plain part", look: "seed first, then water with its body", expect: { slots: rooms("subject", "body"), parts: 2 }, gap: "spw.quest stops at the nested brace and reads no body" },
    ],
  },
  {
    id: "marks",
    title: "Marks before the word",
    say: "Each operator, alone in front of the same line, so the only difference on the canvas is the mark's own reading.",
    cases: [
      ...OPERATORS.filter((operator) => operator.sigil).map((operator) => ({
        line: `${operator.sigil}garden{seed}`,
        presses: `${operator.sigil} ${operator.name}`,
        look: `the word marked ${operator.name}`,
        expect: { slots: rooms("subject", "body"), parts: 1 },
      })),
      { line: "~?garden{seed}", presses: "two marks stacked", look: "both marks read on the one word", expect: { slots: rooms("subject", "body"), parts: 1 } },
      { line: "#>garden{seed, water}", presses: "a frame, #>", look: "a frame to enter, titled by its head", expect: { slots: rooms("subject", "body"), parts: 2 } },
    ],
  },
  {
    id: "regard",
    title: "Two lines that regard each other",
    say: "A join between two expressions, by each of its four marks. The canvas draws the edge between the two forms.",
    cases: [
      { line: "seed{water} ~ sprout{light}", presses: "~ potential", look: "two forms, a loose edge between them", expect: { join: "~" } },
      { line: "seed{water} ^ sprout{light}", presses: "^ ascension", look: "the second form above the first", expect: { join: "^" } },
      { line: "seed{water} & sprout{light}", presses: "& subject", look: "two forms held as one subject", expect: { join: "&" } },
      { line: "you@guide", presses: "@ perspective, unspaced: context @ subject", look: "the guide seen from you", expect: { join: "@" }, gap: "spw.quest reads an unspaced @ as part of the word" },
      { line: "seed ~ sprout ~ bloom", presses: "three in a chain", look: "each form joined to the next", expect: { join: "~" } },
    ],
  },
  {
    id: "edges",
    title: "Edges the reader must hold",
    say: "Lines a hand writes half-way, or in its own alphabet. The canvas should keep what it read and show what it did not.",
    cases: [
      { line: "garden{seed, water", presses: "a brace left open", look: "the word, with the open body shown as not read", expect: { whole: false } },
      { line: "garden}seed", presses: "a stray closer", look: "both readers take the closer into the word; a reader could refuse it", expect: { slots: rooms("subject"), whole: true } },
      { line: "garden{seed]", presses: "pairs that do not match", look: "the word, the rest shown as not read", expect: { slots: rooms("subject"), whole: false } },
      { line: "garden[care][rest]{seed}", presses: "a room written twice", look: "the first lens kept, the rest shown as not read", expect: { slots: rooms("subject", "mode"), whole: false } },
      { line: "jardín[cuidado]{semilla, agua}<cosecha>", presses: "letters beyond ASCII", look: "the same anatomy as garden", expect: { slots: rooms("subject", "mode", "body", "projection"), parts: 2 } },
      { line: "🌱{seed, water}", presses: "an emoji for the word", look: "the emoji as the word's node", expect: { slots: rooms("subject", "body"), parts: 2 } },
      { line: "2026[season]{10, 11, 12}", presses: "numbers as words", look: "a year with three months", expect: { slots: rooms("subject", "mode", "body"), parts: 3 } },
      { line: "a-very-long-hyphenated-subject-that-will-not-fit[mode]{part}", presses: "a word longer than the screen", look: "the label shortened, the whole word on focus", expect: { slots: rooms("subject", "mode", "body"), parts: 1 } },
      { line: "garden [ care ] { seed , water }", presses: "spaces inside and between rooms", look: "the same anatomy as without them", expect: { slots: rooms("subject", "mode", "body"), parts: 2, whole: true } },
    ],
  },
]);

/** What spw.quest's reader makes of a line, in the fields `expect` uses. */
export function readHere(line) {
  const { slots, shape, part } = readSpecimen(line);
  const join = slots.join ? String(slots.join).trim().match(/^[~^&@]+/)?.[0] : undefined;
  return { slots: Object.keys(slots).filter((key) => key !== "join" && key !== "with"), parts: shape.parts?.length ?? 0, whole: !part, join };
}

/** The fields where a reading differs from what a case expects. */
export function differences(expect, reading) {
  return Object.keys(expect).filter((field) => JSON.stringify(expect[field]) !== JSON.stringify(reading[field]));
}

/** Every case, with its group. */
export const benchCases = () => BENCH.flatMap((group) => group.cases.map((entry) => ({ ...entry, group: group.id })));

/** What spw.quest's reader made of a line, in a few words. */
export function readingWords(line) {
  const { slots, shape } = readSpecimen(line);
  const keys = Object.keys(slots);
  if (!keys.length) return "not read";
  const words = keys.map((key) => (key === "body" ? `{ ${shape.parts?.length ?? 0} part${shape.parts?.length === 1 ? "" : "s"} }` : { subject: "word", mode: "[ ]", scope: "( )", projection: "< >", join: `${String(slots.join).trim().slice(0, 2)}`, with: "word…" }[key] || key));
  return words.join(" ");
}

export const BENCH_CSS = `.bench-page > header { display: grid; gap: .5rem; max-width: 46rem; margin: 0 0 1.4rem; }
    .bench-page > header p { margin: 0; color: var(--muted); }
    .bench-group { margin: 0 0 1.8rem; }
    .bench-group > h2 { margin: 0 0 .25rem; font: 600 1rem/1.3 var(--mono); }
    .bench-group > p { max-width: 46rem; margin: 0 0 .7rem; color: var(--muted); font-size: .92rem; }
    .bench-cases { display: grid; gap: .45rem; margin: 0; padding: 0; list-style: none; max-width: 46rem; }
    .bench-cases li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .25rem .8rem; align-items: start; padding: .6rem .75rem; border: 1px solid var(--line); border-radius: var(--radius); }
    .bench-cases .line { grid-column: 1 / -1; font: .95rem/1.4 var(--mono); overflow-wrap: anywhere; }
    .bench-cases .presses { font: 600 .84rem/1.35 var(--mono); }
    .bench-cases .look, .bench-cases .read { grid-column: 1; color: var(--muted); font-size: .85rem; }
    .bench-cases .read code { font-size: .8rem; }
    .bench-cases .gap { color: var(--warn, var(--accent)); }
    .bench-cases .open { grid-column: 2; grid-row: 2 / span 3; align-self: center; display: inline-flex; align-items: center; min-height: 44px; padding: 0 .8rem; border: 1px solid var(--line); border-radius: var(--pill, 999px); font: .82rem/1 var(--mono); white-space: nowrap; text-decoration: none; }
    .bench-cases .open:hover, .bench-cases .open:focus-visible { border-color: var(--accent); }`;

function caseHtml(entry) {
  const { paint } = readSpecimen(entry.line);
  return `<li>
      <code class="line">${paint}</code>
      <span class="presses">${escapeHtml(entry.presses)}</span>
      <a class="open" href="${escapeHtml(factshiftHref(entry.line))}">on the canvas</a>
      <span class="look">${escapeHtml(entry.look)}</span>
      <span class="read">read here as <code>${escapeHtml(readingWords(entry.line))}</code>${entry.gap ? ` · <span class="gap">${escapeHtml(entry.gap)}; the canvas reads it whole</span>` : ""}</span>
    </li>`;
}

export function benchBody() {
  return `
<header>
  <h1>The bench</h1>
  <p class="lede">Lines that press each feature of Spw against the canvas at factshift.center, one feature a line, from the plainest form to the edges a reader has to hold.</p>
  <p>Each says what it presses and what the canvas should show. Open one, look, and come back for the next: where the canvas and the line disagree, the bench has found something.</p>
</header>
${BENCH.map((group) => `<section class="bench-group" aria-labelledby="bench-${group.id}">
  <h2 id="bench-${group.id}">${escapeHtml(group.title)}</h2>
  <p>${escapeHtml(group.say)}</p>
  <ul class="bench-cases">
    ${group.cases.map(caseHtml).join("\n    ")}
  </ul>
</section>`).join("\n")}`;
}
