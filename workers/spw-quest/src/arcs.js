// /arcs/: which arcs of Spw are in season. The site's history says when each
// semantic expression first appeared on a page (carry-arcs.mjs reads it into
// src/arcs-data.js); this page counts them over the last week, month and
// season, read into the shelf's shapes (src/specimen-reading.js): the lenses
// reached for, where lines point, the marks in front, the subjects, and the
// shapes whole. Each row opens the shelf on that query, so a crawler and a
// reader both walk from what is in season to every line that answers it.
// carry-arcs.mjs writes the page into assets/arcs/ (and its data as JSON
// beside it); the worker serves it as it serves the shelf's pages.
import { ARCS } from "./arcs-data.js";
import { readSpecimen } from "./specimen-reading.js";
import { shelfPage } from "./shelf.js";
import { escapeHtml } from "../../lib/shell.js";

const SPANS = ["week", "month", "season"];

export const ARCS_CSS = `.arcs-page > header { display: grid; gap: .5rem; max-width: 46rem; margin: 0 0 1.4rem; }
    .arcs-page > header p { margin: 0; color: var(--muted); }
    .arcs-section { margin: 0 0 1.6rem; }
    .arcs-section > h2 { margin: 0 0 .25rem; font: 600 1rem/1.3 var(--mono); }
    .arcs-section > p { margin: 0 0 .6rem; color: var(--muted); font-size: .92rem; }
    .arcs { width: 100%; max-width: 46rem; border-collapse: collapse; font: .88rem/1.35 var(--mono); }
    .arcs th { padding: .35rem .5rem; color: var(--muted); font-weight: 500; text-align: end; border-bottom: 1px solid var(--line); }
    .arcs th:first-child, .arcs td:first-child { text-align: start; padding-left: 0; }
    .arcs td { padding: .45rem .5rem; text-align: end; vertical-align: top; border-bottom: 1px solid color-mix(in srgb, var(--line) 55%, transparent); font-variant-numeric: tabular-nums; }
    .arcs td:first-child { min-width: 0; overflow-wrap: anywhere; }
    .arcs td:first-child a { display: inline-block; min-height: 24px; font-weight: 600; }
    .arcs .rising { margin-left: .4rem; color: var(--accent); font-size: .78rem; font-weight: 500; }
    .arcs .example { display: block; margin-top: .2rem; color: var(--muted); font-size: .8rem; font-weight: 400; }
    .arcs .quiet { color: var(--muted); }
    .arcs-page time { white-space: nowrap; }`;

/** What each section counts, how a row opens the shelf, and how its key is shown. */
const SECTIONS = [
  { key: "lenses", title: "Lenses", say: "The mode a line is read through, in [ ].", show: (key) => `[${key}]`, href: (key) => `/specimens?q=${encodeURIComponent(`[${key}]`)}#found` },
  { key: "projections", title: "Where lines point", say: "What a line projects toward, in < >.", show: (key) => `<${key}>`, href: (key) => `/specimens?q=${encodeURIComponent(`<${key}>`)}#found` },
  { key: "marks", title: "Marks", say: "The operator in front of the word. Most lines on the site's pages carry none: the ground.", show: (key) => key, href: () => "/constructs" },
  { key: "subjects", title: "Subjects", say: "The word a line is about.", show: (key) => key, href: (key) => `/specimens?q=${encodeURIComponent(`${key}[*]`)}#found` },
  { key: "shapes", title: "Shapes", say: "Which rooms a line opens, in the order it writes them.", show: (key) => key, href: () => "/constructs" },
];

const count = (value) => (value ? String(value) : `<span class="quiet">·</span>`);

function row(section, arc) {
  const rising = arc.rising ? `<span class="rising">rising</span>` : "";
  return `<tr>
      <td><a href="${escapeHtml(section.href(arc.key))}"><code>${escapeHtml(section.show(arc.key))}</code></a>${rising}<span class="example">${readSpecimen(arc.example).paint}</span></td>
      ${arc.counts.map((value) => `<td>${count(value)}</td>`).join("")}
    </tr>`;
}

function sectionHtml(section, arcs) {
  if (!arcs.length) return "";
  return `<section class="arcs-section" aria-labelledby="arcs-${section.key}">
  <h2 id="arcs-${section.key}">${section.title}</h2>
  <p>${escapeHtml(section.say)}</p>
  <table class="arcs">
    <thead><tr><th scope="col">${section.key === "shapes" ? "shape" : "arc"}</th>${SPANS.map((span, index) => `<th scope="col" title="the last ${ARCS.windows[index]} days">${span}</th>`).join("")}</tr></thead>
    <tbody>
    ${arcs.map((arc) => row(section, arc)).join("\n    ")}
    </tbody>
  </table>
</section>`;
}

export function renderArcs(arcs = ARCS) {
  const [week, month, season] = arcs.total;
  return shelfPage({
    title: "spw.quest — arcs in season",
    description: "Which shapes of Spw the site has been writing lately: lenses, projections, marks, subjects and shapes, counted over the last week, month and season.",
    canonical: "https://spw.quest/arcs/",
    here: "/arcs/",
    main: "arcs-page",
    css: ARCS_CSS,
    body: `
<header>
  <h1>Arcs in season</h1>
  <p class="lede">Which shapes of Spw the site has been writing lately. Each line is counted once, on the day it first appeared on a page, over the last ${arcs.windows.join(", ").replace(/, (\d+)$/, " and $1")} days. A count says how often a hand reached for it, not how good it is.</p>
  <p>Read from the site's history up to <time datetime="${escapeHtml(arcs.asOf)}">${escapeHtml(arcs.asOf)}</time>: ${week} new lines this week, ${month} this month, ${season} this season. <em>Rising</em> marks an arc whose share of this week is well above its share of the month. Each arc opens the lines that answer it.</p>
</header>
${SECTIONS.map((section) => sectionHtml(section, arcs[section.key] || [])).filter(Boolean).join("\n")}`,
  });
}

/** The carried data as JSON, for a tool or an agent preparing for what is in season. */
export function arcsJson(arcs = ARCS) {
  return `${JSON.stringify({ about: "https://spw.quest/arcs/", ...arcs }, null, 2)}\n`;
}
