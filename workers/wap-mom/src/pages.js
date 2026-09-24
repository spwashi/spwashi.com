/**
 * Pages. Each takes the room's words and sets them.
 */
import { CORRECTIONS, DEPARTMENTS, HOUSE_STYLE, OPEN_QUESTIONS, ROOM, SERIES, USES } from "./room.js";
import { bySlug, dateline, forthcomingIn, numbered, printed, printedIn } from "./catalog.js";
import { figureHtml, hasFigure } from "./figures.js";
import { NAME, ORIGIN, escapeHtml, expansion, fleuron, framed, masthead, page } from "./layout.js";

const SCRIPTS = ["/figures.js"];
const seriesClass = (issue) => (issue.series === "e" ? "series-e" : "");
const label = (issue) => `${SERIES[issue.series].label} ${issue.no}`;

function kicker(issue) {
  const dept = DEPARTMENTS[issue.department]?.name;
  const galley = issue.status === "draft" ? ` · <span class="galley">galley proof</span>` : "";
  return `<p class="kicker caps">${escapeHtml(label(issue))}${dept ? ` · ${escapeHtml(dept)}` : ""}${galley}</p>`;
}

export function citation(issue) {
  return `“${escapeHtml(issue.title)}.” <i>${escapeHtml(SERIES[issue.series].name)}</i>, ${escapeHtml(label(issue).toLowerCase())}${
    issue.date ? ` (${escapeHtml(dateline(issue.date))})` : ""
  }. wap.mom/${escapeHtml(issue.slug)}/`;
}

function paragraphs(list) {
  return list.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n    ");
}

function usesPanel(issue) {
  const rows = USES.filter(([key]) => issue.uses?.[key])
    .map(([key, name]) => `<dt>${escapeHtml(name)}</dt><dd>${escapeHtml(issue.uses[key])}</dd>`)
    .join("\n    ");
  if (!rows) return "";
  return `<aside class="uses" aria-labelledby="uses-${escapeHtml(issue.slug)}">
  <p class="caps head" id="uses-${escapeHtml(issue.slug)}">Uses</p>
  <dl>
    ${rows}
  </dl>
</aside>`;
}

function corrections(issue) {
  return CORRECTIONS.filter((c) => c.issue === issue.slug)
    .map((c) => `<p class="correction"><span class="caps">Correction, ${escapeHtml(dateline(c.date))}</span> ${escapeHtml(c.text)}</p>`)
    .join("");
}

function entry(issue) {
  return `<li><span class="no">${escapeHtml(label(issue))}</span><a href="/${escapeHtml(issue.slug)}/">${escapeHtml(issue.title)}</a> — <i>${escapeHtml(issue.dek)}</i></li>`;
}

function slot(issue) {
  return `<div class="slot">
    <p class="kicker caps">${escapeHtml(label(issue))} · working title</p>
    <h2>${escapeHtml(issue.title)}</h2>
    <p class="question">${escapeHtml(issue.question)}</p>
    <div class="lines" aria-hidden="true"></div>
  </div>`;
}

export function renderFront() {
  const pi = printedIn("pi");
  const lead = pi[pi.length - 1];
  const back = pi.slice(0, -1).reverse();
  const e = printedIn("e");
  const ahead = [...forthcomingIn("pi"), ...forthcomingIn("e")];
  return framed({
    title: `${NAME} — wap.mom`,
    description: "A periodical of wonder about π and pie, with a supplement on e. Numbered by the constants themselves.",
    canonical: `${ORIGIN}/`,
    body: `${masthead({ heading: true })}
<article class="lead" aria-labelledby="lead-title">
  ${kicker(lead)}
  <h2 id="lead-title"><a href="/${escapeHtml(lead.slug)}/">${escapeHtml(lead.title)}</a></h2>
  <p class="dek">${escapeHtml(lead.dek)}</p>
  <div class="body"><p>${escapeHtml(lead.body[0])}</p></div>
  <ul class="links"><li><a href="/${escapeHtml(lead.slug)}/">Read ${escapeHtml(label(lead))}</a></li></ul>
</article>
${e.length ? `<aside class="supplement" aria-labelledby="supp-head">
  <p class="caps head" id="supp-head">Bound in · ${escapeHtml(SERIES.e.name)}</p>
  ${expansion("e")}
  <p class="muted">${escapeHtml(SERIES.e.about)}</p>
  <ol class="back">${e.map(entry).join("")}</ol>
</aside>` : ""}
<section aria-labelledby="back-head">
  <p class="caps head" id="back-head">Back issues</p>
  <ol class="back">
    ${back.map(entry).join("\n    ")}
  </ol>
  <ul class="links"><li><a href="/contents/">Contents, by department</a></li></ul>
</section>
${ahead.length ? `<section aria-labelledby="ahead-head">
  <p class="caps head" id="ahead-head">Forthcoming</p>
  ${ahead.map(slot).join("\n  ")}
</section>` : ""}`,
  });
}

export function renderIssue(issue, searchParams) {
  const siblings = printedIn(issue.series);
  const index = siblings.indexOf(issue);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const pull = issue.clip ? `<figure class="pull"><blockquote>${escapeHtml(issue.clip)}</blockquote></figure>` : "";
  return framed({
    title: `${issue.title} — ${SERIES[issue.series].name}, ${label(issue).toLowerCase()}`,
    description: `${issue.dek} ${SERIES[issue.series].name}, ${label(issue).toLowerCase()}.`,
    canonical: `${ORIGIN}/${issue.slug}/`,
    type: "article",
    bodyClass: seriesClass(issue),
    scripts: hasFigure(issue) ? SCRIPTS : [],
    body: `${masthead({ series: issue.series, current: issue, compact: true })}
<article aria-labelledby="issue-title">
  ${kicker(issue)}
  <h1 id="issue-title">${escapeHtml(issue.title)}</h1>
  <p class="dek">${escapeHtml(issue.dek)}</p>
  <div class="body">
    <p>${escapeHtml(issue.body[0])}</p>
  </div>
  ${pull}
  <div class="body rest">
    ${paragraphs(issue.body.slice(1))}
  </div>
  ${figureHtml(issue, searchParams)}
  ${fleuron(issue.series)}
  ${usesPanel(issue)}
  ${corrections(issue)}
  <p class="cite"><span class="caps">Cite</span> ${citation(issue)}</p>
  <ul class="links" aria-label="Pass it on">
    <li><a href="/${escapeHtml(issue.slug)}/offprint/">Offprint</a></li>
    ${issue.clip ? `<li><a href="/${escapeHtml(issue.slug)}/clip/">Clipping</a></li>` : ""}
  </ul>
</article>
<nav class="pager" aria-label="Issues">
  ${prev ? `<a href="/${escapeHtml(prev.slug)}/" rel="prev">← ${escapeHtml(label(prev))}</a>` : "<span></span>"}
  ${next ? `<a href="/${escapeHtml(next.slug)}/" rel="next">${escapeHtml(label(next))} →</a>` : "<span></span>"}
</nav>`,
  });
}

/* The whole issue with no chrome: what you send when you pass it on. */
export function renderOffprint(issue) {
  return page({
    title: `${issue.title} — offprint from ${SERIES[issue.series].name}`,
    description: `${issue.dek} Offprint from ${SERIES[issue.series].name}, ${label(issue).toLowerCase()}.`,
    canonical: `${ORIGIN}/${issue.slug}/`,
    type: "article",
    robots: "noindex",
    bodyClass: seriesClass(issue),
    body: `<main>
<p class="offprint-line caps">Offprint · ${escapeHtml(SERIES[issue.series].name)} · ${escapeHtml(label(issue))}</p>
<article>
  <h1>${escapeHtml(issue.title)}</h1>
  <p class="dek">${escapeHtml(issue.dek)}</p>
  <div class="body">
    ${paragraphs(issue.body)}
  </div>
  ${figureHtml(issue, null, { still: true })}
  ${usesPanel(issue)}
  <p class="cite">${citation(issue)}</p>
</article>
</main>`,
  });
}

/* One passage, cut out with its source. Sized to survive a screenshot. */
export function renderClip(issue) {
  return page({
    title: `“${issue.clip}” — ${SERIES[issue.series].name}`,
    description: `A clipping from ${SERIES[issue.series].name}, ${label(issue).toLowerCase()}.`,
    canonical: `${ORIGIN}/${issue.slug}/`,
    robots: "noindex",
    bodyClass: `clipping ${seriesClass(issue)}`.trim(),
    body: `<main>
<figure class="clip">
  <p class="source caps"><span>${escapeHtml(SERIES[issue.series].name)}</span><span>${escapeHtml(label(issue))}</span></p>
  <blockquote>${escapeHtml(issue.clip)}</blockquote>
  <figcaption class="from">From “${escapeHtml(issue.title)}” · <a href="/${escapeHtml(issue.slug)}/">wap.mom/${escapeHtml(issue.slug)}/</a></figcaption>
</figure>
</main>`,
  });
}

export function renderContents() {
  const sections = Object.entries(DEPARTMENTS)
    .map(([key, dept]) => {
      const issues = printed.filter((i) => i.department === key);
      if (!issues.length) return "";
      return `<section aria-labelledby="dept-${key}">
  <p class="caps head" id="dept-${key}">${escapeHtml(dept.name)}</p>
  <p class="muted">${escapeHtml(dept.about)}</p>
  <ol class="back">${issues.map(entry).join("")}</ol>
</section>`;
    })
    .join("\n");
  const open = numbered.filter((i) => i.status === "open");
  return framed({
    title: `Contents — ${NAME}`,
    description: `Every issue of ${NAME} and ${SERIES.e.name}, by department.`,
    canonical: `${ORIGIN}/contents/`,
    body: `${masthead({ compact: true })}
<h1>Contents.</h1>
<p>${printed.length} issues in print across two series. ${SERIES.pi.about} ${SERIES.e.name}: ${SERIES.e.about.toLowerCase()}</p>
${sections}
${open.length ? `<section aria-labelledby="open-head">
  <p class="caps head" id="open-head">Forthcoming</p>
  <ol class="back">${open.map((i) => `<li><span class="no">${escapeHtml(label(i))}</span>${escapeHtml(i.title)} — <i>${escapeHtml(i.question)}</i></li>`).join("")}</ol>
</section>` : ""}`,
  });
}

export function renderColophon() {
  return framed({
    title: `Colophon — ${NAME}`,
    description: `How ${NAME} is numbered, set, and made.`,
    canonical: `${ORIGIN}/colophon/`,
    body: `${masthead({ compact: true })}
<h1>Colophon.</h1>
<section aria-labelledby="numbering-head">
  <p class="caps head" id="numbering-head">Numbering</p>
  <p>${NAME} is numbered by the decimal expansion of π. The first issue is No. 3.1, the next 3.14, then 3.141. ${SERIES.e.name} is numbered the same way by e: 2.7, 2.71, 2.718. Neither series can run out, and no two issues share a number.</p>
</section>
<section aria-labelledby="mark-head">
  <p class="caps head" id="mark-head">Printer’s mark</p>
  <div class="mark"><p class="equation">e<sup>iπ</sup> + 1 = 0</p></div>
  <p>Both constants on one line, with one, zero, and i. It is printed at the foot of every page.</p>
</section>
<section aria-labelledby="type-head">
  <p class="caps head" id="type-head">Type</p>
  <p>Set in the reader’s own serif: Iowan Old Style, Palatino, or Georgia, whichever the device carries. Old-style figures in the text; lining figures in the numbers. π prints in crust, e in rise.</p>
</section>
<section aria-labelledby="fig-head">
  <p class="caps head" id="fig-head">Figures</p>
  <p>Every figure is drawn on the page and works without any script: its controls redraw it when submitted. With script, the same drawing code follows the hand as a control moves. Nothing a reader does with a figure is recorded.</p>
</section>
<section aria-labelledby="made-head">
  <p class="caps head" id="made-head">Making</p>
  <p>Issues are written in <a href="/room">the room</a>, in conversation, under a <a href="/room">house style</a>. Errors are fixed in <a href="/corrections/">Corrections</a>, never silently. Issues are also available as a <a href="/feed.xml">feed</a>.</p>
</section>`,
  });
}

export function renderCorrections() {
  const list = CORRECTIONS.length
    ? `<ol class="back">${CORRECTIONS.map((c) => {
        const issue = bySlug(c.issue);
        return `<li><span class="no">${escapeHtml(dateline(c.date))}${issue ? ` · ${escapeHtml(label(issue))}` : ""}</span>${
          issue ? `<a href="/${escapeHtml(issue.slug)}/">${escapeHtml(issue.title)}</a>: ` : ""
        }${escapeHtml(c.text)}</li>`;
      }).join("")}</ol>`
    : `<p>No corrections have been necessary.</p>`;
  return framed({
    title: `Corrections — ${NAME}`,
    description: `Corrections to ${NAME}, newest first.`,
    canonical: `${ORIGIN}/corrections/`,
    body: `${masthead({ compact: true })}
<h1>Corrections.</h1>
<p class="muted">When the periodical is wrong, it says so here and on the issue.</p>
${list}`,
  });
}

export function renderRoom() {
  const galleys = printed.filter((i) => i.status === "draft");
  const people = ROOM.length
    ? `<ul class="questions">${ROOM.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`
    : `<p class="muted">No names yet. Names appear here only with the person's say-so.</p>`;
  const open = numbered.filter((i) => i.status === "open");
  return framed({
    title: `The room — ${NAME}`,
    description: `How ${NAME} is written: house style, open questions, and the issues in progress.`,
    canonical: `${ORIGIN}/room`,
    robots: "noindex",
    body: `${masthead({ compact: true })}
<h1>The room.</h1>
<p>${NAME} is written in conversation. This page is what the room is holding.</p>
<section aria-labelledby="style-head">
  <p class="caps head" id="style-head">House style</p>
  <ol class="style">${HOUSE_STYLE.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
</section>
<section aria-labelledby="uses-head">
  <p class="caps head" id="uses-head">Uses, in every issue</p>
  <ul class="questions">${USES.map(([, name]) => `<li>${escapeHtml(name)}</li>`).join("")}</ul>
</section>
<section aria-labelledby="q-head">
  <p class="caps head" id="q-head">Open questions</p>
  <ul class="questions">${OPEN_QUESTIONS.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ul>
</section>
<section aria-labelledby="galley-head">
  <p class="caps head" id="galley-head">In galley</p>
  <ol class="back">${galleys.map((i) => `<li><span class="no">${escapeHtml(label(i))}</span><a href="/${escapeHtml(i.slug)}/">${escapeHtml(i.title)}</a></li>`).join("")}</ol>
</section>
<section aria-labelledby="slot-head">
  <p class="caps head" id="slot-head">Forthcoming</p>
  ${open.map(slot).join("\n  ")}
</section>
<section aria-labelledby="people-head">
  <p class="caps head" id="people-head">In the room</p>
  ${people}
</section>`,
  });
}
