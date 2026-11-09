// The shelf's landing and its indexes, written as static pages by
// carry-shelf.mjs and served from assets/shelf/ (the creator chose static
// landing and index pages, 2026-11-06). One place to start (the search), one row
// of handles (the twelve operators), plans by operation, and tiles that each
// open a page of their own: depth one tap away, never on the first screen. The
// cards and lines are the same ones /specimens draws, so the static pages and
// the live search cannot drift.
import { OPERATORS } from "./guide.js";
import { PAPER_CSS } from "./paper.js";
import { PAGE_CSS, QUEST_HEAD, masthead } from "./page.js";
import { SPECIMENS, SPECIMENS_CSS, breakable, planGroups } from "./specimens.js";
import { FORMS_CSS, formsBody } from "./forms.js";
import { BENCH_CSS, benchBody } from "./bench.js";
import { escapeHtml, layout } from "../../lib/shell.js";

const count = (source) => SPECIMENS.filter((specimen) => specimen.source === source).length;

/** Monospace held to a grid: every handle and tile aligns on the same columns. */
export const SHELF_CSS = `.shelf-page { display: grid; gap: 1.8rem; }
    .shelf-page > header h1 { margin: 0 0 .3rem; }
    .shelf-page > header p { margin: 0; color: var(--muted); }
    .shelf-section > h2 { margin: 0 0 .55rem; font: 600 .78rem/1.2 var(--mono); letter-spacing: .04em; color: var(--muted); text-transform: lowercase; }
    .shelf-search-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .4rem; }
    .shelf-search input { box-sizing: border-box; width: 100%; min-height: 44px; padding: .55rem .7rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--field); color: var(--fg); font: 1rem/1.4 var(--mono); }
    .shelf-search button { min-height: 44px; padding: 0 1rem; }
    .shelf-search .hint { margin: .4rem 0 0; color: var(--muted); font: .82rem/1.4 var(--mono); }
    .handles, .tiles { display: grid; gap: .4rem; margin: 0; padding: 0; list-style: none; }
    .handles { grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr)); }
    .handle { display: grid; grid-template-columns: 2.5ch minmax(0, 1fr); align-items: baseline; min-height: 44px; box-sizing: border-box; padding: .5rem .65rem; border: 1px solid var(--line); border-radius: var(--radius); color: inherit; font: .88rem/1.3 var(--mono); text-decoration: none; }
    .handle .sigil { color: var(--accent); font-weight: 700; }
    .handle:hover, .handle:focus-visible, .tiles a:hover, .tiles a:focus-visible { border-color: var(--accent); }
    .tiles { grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); }
    .tiles a { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .2rem .6rem; min-height: 44px; box-sizing: border-box; padding: .7rem .8rem; border: 1px solid var(--line); border-radius: var(--radius); color: inherit; text-decoration: none; }
    .tiles .name { font-weight: 600; }
    .tiles .count { color: var(--muted); font: .82rem/1.4 var(--mono); }
    .tiles .shape { grid-column: 1 / -1; color: var(--muted); font: .82rem/1.45 var(--mono); }
    .op-index { margin: 0; font: .9rem/1.6 var(--mono); }
    .op-index a { white-space: nowrap; }
    .op-group { padding-top: .8rem; border-top: 1px solid var(--line); }
    .op-group > h2 { margin: 0 0 .5rem; font: 600 1rem/1.3 var(--mono); }
    .op-group > h2 .count { color: var(--muted); font-weight: 500; }`;

export function shelfPage({ title, description, canonical, body, here = "/shelf/", main = "shelf-page", css = "" }) {
  return layout({
    title,
    description,
    canonical,
    head: QUEST_HEAD,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}
    ${SPECIMENS_CSS}
    ${SHELF_CSS}${css ? `
    ${css}` : ""}`,
    body: `${masthead(here)}
<main class="${main}">${body}
</main>
<p class="also"><a href="/specimens">The whole shelf on one page</a> · <a href="/">Back to the guide</a></p>`,
  });
}

/** The landing: search first, then the handles, then the ways in. */
export function renderShelfLanding() {
  const groups = planGroups();
  const plans = groups.reduce((sum, group) => sum + group.plans.length, 0);
  const handles = OPERATORS.map((op) => `<li><a class="handle" href="/#op-${escapeHtml(op.name)}" title="${escapeHtml(op.reads)}"><span class="sigil">${escapeHtml(op.sigil)}</span><span>${escapeHtml(op.name)}</span></a></li>`).join("\n      ");
  const tile = (href, name, n, shape) => `<li><a href="${href}"><span class="name">${name}</span><span class="count">${n}</span><span class="shape"><code>${escapeHtml(shape)}</code></span></a></li>`;
  return shelfPage({
    title: "spw.quest — the shelf",
    description: "Lines of Spw from spwashi.com: find one by any slot, or browse by operator, by operation, or by where it was found.",
    canonical: "https://spw.quest/shelf/",
    body: `
<header>
  <h1>The shelf</h1>
  <p>Lines of Spw found on spwashi.com. Find one by any slot, or browse.</p>
</header>
<section class="shelf-section shelf-search" aria-labelledby="find-title">
  <h2 id="find-title">find</h2>
  <form action="/specimens" method="get" role="search">
    <div class="shelf-search-row"><input id="shelf-q" name="q" type="search" autocomplete="off" spellcheck="false" aria-labelledby="find-title" placeholder="garden"><button type="submit">Find</button></div>
  </form>
  <p class="hint">a word, or a slot: [lens] {holds} (scene) &lt;goes to&gt;</p>
</section>
<section class="shelf-section" aria-labelledby="ops-title">
  <h2 id="ops-title">operators</h2>
  <ul class="handles">
      ${handles}
  </ul>
</section>
<section class="shelf-section" aria-labelledby="plan-ops-title">
  <h2 id="plan-ops-title">plans by operation</h2>
  <p class="op-index">${groups.map(({ mode, plans: members }) => `<a href="/shelf/plans/#op-${escapeHtml(mode)}"><code>[${escapeHtml(mode)}]</code> <span class="count">${members.length}</span></a>`).join('<span aria-hidden="true"> · </span>')}</p>
</section>
<section class="shelf-section" aria-labelledby="browse-title">
  <h2 id="browse-title">browse</h2>
  <ul class="tiles">
    ${tile("/shelf/plans/", "Plans", plans, "#>plan[operation]{concepts}(scene)<lands as>")}
    ${tile("/specimens#pressed", "Pressed forms", count("herbarium"), "a form, and the one it departs from")}
    ${tile("/specimens#pages", "Lines the pages carry", count("routes"), "word[lens]{holds}")}
    ${tile("/specimens#gallery", "Files from the gallery", count("gallery"), "a whole .spw file")}
    ${tile("/constructs", "Constructs", "", "the shapes a line takes")}
    ${tile("/pivot", "Pivot", "", "one slot changed, the rest kept")}
  </ul>
</section>`,
  });
}

/** The plans, grouped by operation, each line hanging from its frame. */
export function renderShelfPlans() {
  const groups = planGroups();
  const lines = (members) => members.map((plan) => `<li id="s-${escapeHtml(plan.id)}"><a href="/pivot?s=${escapeHtml(plan.id)}"><code>${breakable(plan.reading.paint)}</code></a> <a class="canvas" href="/canvas?s=${escapeHtml(plan.id)}">canvas</a></li>`).join("\n    ");
  return shelfPage({
    title: "spw.quest — plans, each in one line",
    description: "spwashi.com's plans, each stated as one line of Spw, grouped by operation.",
    canonical: "https://spw.quest/shelf/plans/",
    body: `
<header>
  <h1>Plans, each in one line</h1>
  <p>Each plan states itself as a frame, its operation, what it holds, where it acts, and what it lands as. A line opens on the pivot; a canvas opens it on factshift.center.</p>
</header>
<p class="op-index">${groups.map(({ mode, plans: members }) => `<a href="#op-${escapeHtml(mode)}"><code>[${escapeHtml(mode)}]</code> <span class="count">${members.length}</span></a>`).join('<span aria-hidden="true"> · </span>')}</p>
${groups.map(({ mode, plans: members }) => `<section class="op-group" id="op-${escapeHtml(mode)}" aria-labelledby="op-${escapeHtml(mode)}-title">
  <h2 id="op-${escapeHtml(mode)}-title"><code>[${escapeHtml(mode)}]</code> <span class="count">${members.length}</span></h2>
  <ol class="plan-lines">
    ${lines(members)}
  </ol>
</section>`).join("\n")}`,
  });
}

/** The appendix of forms side by side (forms.js). */
export function renderForms() {
  return shelfPage({
    title: "spw.quest — forms, side by side",
    description: "Lines of Spw that differ in one thing, and what that thing does: joins, walls, marks, and a line beside its file.",
    canonical: "https://spw.quest/forms/",
    here: "/forms/",
    main: "forms-page",
    css: FORMS_CSS,
    body: formsBody(),
  });
}

/** Every static shelf page: its path under assets/ and its html. */
/** The bench: lines that press each feature of Spw against the canvas (src/bench.js). */
export function renderBench() {
  return shelfPage({
    title: "spw.quest — the bench",
    description: "Lines that press each feature of Spw against the canvas at factshift.center: rooms, joins, nesting, marks, regard and the edges a reader must hold.",
    canonical: "https://spw.quest/bench/",
    here: "/bench/",
    main: "bench-page",
    css: BENCH_CSS,
    body: benchBody(),
  });
}

export function shelfPages() {
  return [
    ["bench/index.html", renderBench()],
    ["shelf/index.html", renderShelfLanding()],
    ["shelf/plans/index.html", renderShelfPlans()],
    ["forms/index.html", renderForms()],
  ];
}
