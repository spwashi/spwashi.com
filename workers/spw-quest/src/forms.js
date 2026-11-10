// Forms, side by side: an appendix of lines that differ in one thing, each
// with one sentence on what the difference does. Written by hand (the
// creator, 2026-11-07: less copy, more use around scripts and editing, with
// well-written appendices and samples that show the nuance between forms).
// Every line opens in the editor and on the pivot; the samples are the
// example scripts the guide opens. Written static by carry-shelf.mjs.
import { physicsHref } from "./physics.js";
import { readSpecimen } from "./specimen-reading.js";
import { breakable } from "./specimens.js";
import { EXAMPLES } from "./examples.js";
import { escapeHtml } from "../../lib/shell.js";

/** Sections of lines that differ in one thing. Each row: the line, and what that one difference does. */
export const FORMS = Object.freeze([
  {
    id: "joins",
    title: "How a body holds its parts",
    rows: [
      ["garden{seed.water}", "One name. The dot keeps seed.water whole, as a path names one thing."],
      ["garden{seed, water}", "Held together. Both are there at once, and their order says nothing."],
      ["garden{seed; water}", "In order. Seed comes first, and the order is part of what it says."],
      ["garden{seed ~> water}", "A path. Seed is carried on to water, and the two stay two."],
    ],
  },
  {
    id: "walls",
    title: "Which wall a word sits in",
    rows: [
      ["garden[care]", "The lens: the garden, read through care."],
      ["garden{care}", "What it holds: care is inside the garden."],
      ["garden(care)", "The scene: the garden where care is."],
      ["garden<care>", "Where it goes: the garden, toward care."],
      ["garden[care]{seed}(spring)<harvest>", "All four read as one sentence: the garden, through care, holding seed, in spring, toward harvest."],
    ],
  },
  {
    id: "marks",
    title: "A mark in front",
    rows: [
      ["?garden", "A question about the garden, one you can close again."],
      ["!garden", "A move made on the garden, so its consequence can be seen."],
      ["~garden", "A way toward the garden, kept open and not taken."],
      ["*garden", "The garden as what carries weight here."],
      [".garden", "The garden as it stands by default."],
    ],
  },
  {
    id: "position",
    title: "Where a mark sits",
    rows: [
      ["?garden{seed}", "In front of the word, the question takes in the whole line."],
      ["garden{?seed}", "Inside the braces, it asks about the seed alone."],
    ],
  },
  {
    id: "between",
    title: "Two lines joined",
    rows: [
      ["garden ~ harvest", "From the garden, the harvest follows."],
      ["garden & harvest", "The harvest is what the garden is about."],
      ["garden ^ harvest", "Both lifted into one relation you can look at."],
      ["gardener @ garden", "The garden, as the gardener sees it."],
    ],
  },
]);

const ONE_LINE = "garden[care]{seed; water; harvest}";
const CHOPPED = "garden[care]{\n  seed;\n  water;\n  harvest\n}";

const editHref = (text) => `/build?script=${encodeURIComponent(text)}#reading`;
const pivotHref = (line) => `/pivot?line=${encodeURIComponent(line)}`;
/** A form with a body can be felt at rest; a join or a bare word cannot, and gets no link. */
const restLink = (line) => (physicsHref(line) ? ` <a href="${escapeHtml(physicsHref(line))}">rest</a>` : "");

function row([line, says]) {
  return `<li><code class="form-line">${breakable(readSpecimen(line).paint)}</code><span class="form-says">${escapeHtml(says)}</span><span class="form-go"><a href="${escapeHtml(editHref(line))}">edit</a> <a href="${escapeHtml(pivotHref(line))}">pivot</a>${restLink(line)}</span></li>`;
}

export const FORMS_CSS = `.forms-page { display: grid; gap: 1.6rem; }
    .forms-page > header h1 { margin: 0 0 .3rem; }
    .forms-page > header p { margin: 0; color: var(--muted); }
    .forms-index { margin: 0; font: .9rem/1.6 var(--mono); }
    .form-set > h2 { margin: 0 0 .5rem; font: 600 1rem/1.3 var(--mono); }
    .form-set ol { display: grid; gap: .35rem; margin: 0; padding: 0; list-style: none; }
    .form-set li { display: grid; grid-template-columns: minmax(0, 16ch) minmax(0, 1fr) auto; gap: .2rem .9rem; align-items: baseline; padding: .45rem 0; border-top: 1px solid var(--line); }
    .form-line { font: 600 .95rem/1.4 var(--mono); font-variant-ligatures: none; overflow-wrap: anywhere; }
    .form-says { color: var(--fg); }
    .form-go { font: .82rem/1.4 var(--mono); white-space: nowrap; }
    .form-go a + a { margin-left: .5rem; }
    @media (pointer: coarse) { .form-go a { display: inline-flex; align-items: center; min-height: 36px; } }
    .form-file { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: .6rem; }
    .form-file pre { margin: 0; padding: .6rem .75rem; border: 1px solid var(--line); border-radius: var(--radius); font: .9rem/1.5 var(--mono); font-variant-ligatures: none; white-space: pre-wrap; }
    .samples { display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: .3rem .9rem; margin: 0; padding: 0; list-style: none; font: .88rem/1.5 var(--mono); }
    .samples .tab { color: var(--muted); }
    @media (max-width: 40rem) {
      .form-set li { grid-template-columns: minmax(0, 1fr) auto; }
      .form-says { grid-column: 1 / -1; grid-row: 2; }
    }`;

/** The appendix's body, inside the shelf's page frame. */
export function formsBody() {
  const sets = FORMS.map(({ id, title, rows }) => `<section class="form-set" id="${escapeHtml(id)}" aria-labelledby="${escapeHtml(id)}-title">
  <h2 id="${escapeHtml(id)}-title">${escapeHtml(title)}</h2>
  <ol>
    ${rows.map(row).join("\n    ")}
  </ol>
</section>`).join("\n");
  const samples = EXAMPLES.map((example) => `<li><a href="/?example=${escapeHtml(example.id)}#try">${escapeHtml(example.file)}</a> <span class="tab">${escapeHtml(example.tab)}</span></li>`).join("\n    ");
  return `
<header>
  <h1>Forms, side by side</h1>
  <p>Lines that differ in one thing, and what that thing does. Each opens in the editor or on the pivot.</p>
</header>
<p class="forms-index">${[...FORMS.map(({ id, title }) => `<a href="#${escapeHtml(id)}">${escapeHtml(title.toLowerCase())}</a>`), '<a href="#file">a line or a file</a>', '<a href="#samples">samples</a>'].join('<span aria-hidden="true"> · </span>')}</p>
${sets}
<section class="form-set" id="file" aria-labelledby="file-title">
  <h2 id="file-title">A line, or a file</h2>
  <div class="form-file">
    <pre><code>${breakable(readSpecimen(ONE_LINE).paint)}</code></pre>
    <pre><code>${escapeHtml(CHOPPED)}</code></pre>
  </div>
  <p>The same line, chopped down. It reads the same; a file earns its lines once a part grows braces of its own. <a href="${escapeHtml(editHref(CHOPPED))}">Edit the file</a></p>
</section>
<section class="form-set" id="samples" aria-labelledby="samples-title">
  <h2 id="samples-title">Samples</h2>
  <ul class="samples">
    ${samples}
  </ul>
</section>`;
}
