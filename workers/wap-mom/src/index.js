/**
 * wap.mom — Wondering About Pi.
 *
 * A periodical of record, set like print. It plays everything straight; the
 * domain is the only thing that winks. What it says lives in room.js, where
 * the writers' room edits it. This file sets it in type and routes requests.
 *
 * The old ministry, kinds of mom, and wish form are gone. The cabinet stays
 * behind its key so filings received before the form closed can be read
 * and discarded.
 */

import { HOUSE_STYLE, ISSUES, OPEN_QUESTIONS, ROOM, USES } from "./room.js";

const VERSION = "0.1.0";
const NAME = "Wondering About Pi";
const PI = "3.14159265358979323846264338327950288419716939937510";

/* Issue n (from 0) is π to n + 1 decimal places: 3.1, 3.14, 3.141, … */
const numbered = ISSUES.map((issue, index) => ({ ...issue, no: PI.slice(0, index + 3) }));
const printed = numbered.filter((i) => i.status !== "open");
const forthcoming = numbered.filter((i) => i.status === "open");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const BASE_SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
};

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#f4efe4"/>
  <text x="16" y="23" text-anchor="middle" font-size="19" fill="#1c1916" font-family="Georgia, serif">π</text>
</svg>`;

const STYLE = `
  :root {
    color-scheme: light dark;
    --paper: #f4efe4; --ink: #1c1916; --muted: #625a4f; --rule: #1c1916;
    --faint: rgba(28, 25, 22, .16); --crust: #8a4f17; --card: #fbf8f1;
    --serif: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --paper: #15120e; --ink: #ede5d6; --muted: #b0a591; --rule: #ede5d6;
      --faint: rgba(237, 229, 214, .16); --crust: #e0a262; --card: #1d1914;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--paper); color: var(--ink);
    font: 1.1rem/1.62 var(--serif); font-variant-numeric: oldstyle-nums proportional-nums;
  }
  main { width: min(36rem, calc(100% - 2rem)); margin: 0 auto; padding: 1.6rem 0 3rem; }
  a { color: inherit; text-decoration-color: var(--crust); text-underline-offset: .18em; }
  a:focus-visible { outline: 2px solid var(--crust); outline-offset: 3px; }
  .caps { font-variant-caps: all-small-caps; letter-spacing: .07em; }
  .muted { color: var(--muted); }
  .skip { position: absolute; left: -9999px; top: 0; padding: .5rem .8rem; background: var(--ink); color: var(--paper); }
  .skip:focus { left: 0; z-index: 2; }
  .vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

  /* Masthead: ears, title, the expansion so far. */
  .masthead { text-align: center; border-bottom: 3px double var(--rule); padding-bottom: .7rem; margin-bottom: 1.6rem; }
  .ears { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0 1rem; margin: 0 0 .3rem; color: var(--muted); font-size: .95rem; }
  .title { margin: 0; font-size: clamp(2.1rem, 9vw, 3.4rem); line-height: 1.05; letter-spacing: -.02em; font-weight: 400; }
  .title a { text-decoration: none; }
  .masthead.compact .title { font-size: clamp(1.5rem, 6vw, 2rem); }
  .expansion {
    margin: .45rem 0 0; font-size: 1.05rem; letter-spacing: .12em;
    font-variant-numeric: lining-nums tabular-nums;
  }
  .expansion .here { color: var(--crust); text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: .25em; }
  .expansion .ahead { color: var(--muted); opacity: .55; }

  h1, h2 { font-weight: 400; line-height: 1.12; letter-spacing: -.01em; }
  h1 { font-size: clamp(2rem, 7vw, 2.8rem); margin: .1rem 0 .2rem; }
  h2 { font-size: 1.45rem; margin: .1rem 0 .3rem; }
  .kicker { margin: 0; color: var(--muted); font-size: .98rem; }
  .dek { margin: 0 0 1.2rem; font-style: italic; color: var(--muted); font-size: 1.2rem; }
  .galley { color: var(--crust); }

  .body p { margin: 0 0 1rem; hyphens: auto; }
  .body:not(.rest) p:first-child::first-letter {
    float: left; font-size: 3.3em; line-height: .82; padding: .06em .09em 0 0; color: var(--crust);
  }
  .pull { margin: 1.6rem 0; padding: .9rem 0; border-block: 1px solid var(--rule); text-align: center; }
  .pull blockquote { margin: 0; font-size: 1.35rem; line-height: 1.35; font-style: italic; }

  /* Uses: one line per dimension, the same four in every issue. */
  .uses { margin: 1.6rem 0 0; padding: .9rem 1rem .4rem; background: var(--card); border: 1px solid var(--faint); border-top: 3px double var(--rule); }
  .uses .head { margin: 0 0 .5rem; color: var(--muted); }
  .uses dl { margin: 0; }
  .uses dt { color: var(--crust); font-size: .92rem; font-variant-caps: all-small-caps; letter-spacing: .07em; }
  .uses dd { margin: 0 0 .7rem; }
  .cite { font-size: .95rem; color: var(--muted); border-top: 1px solid var(--faint); padding-top: .8rem; margin: 1.4rem 0 .4rem; }
  .links { display: flex; flex-wrap: wrap; gap: 0 1.2rem; margin: 0; padding: 0; list-style: none; }
  .links a { display: inline-flex; align-items: center; min-block-size: 44px; }
  .pager { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; border-top: 1px solid var(--rule); margin-top: 1.4rem; }
  .pager a { display: inline-flex; align-items: center; min-block-size: 44px; }

  section { margin: 2rem 0 0; }
  section > .caps.head { margin: 0 0 .6rem; padding-bottom: .3rem; border-bottom: 1px solid var(--rule); color: var(--muted); }
  .lead h2 { font-size: clamp(1.8rem, 6vw, 2.3rem); }
  .back { list-style: none; padding: 0; margin: 0; }
  .back li { padding: .55rem 0; border-bottom: 1px solid var(--faint); }
  .back .no { display: block; color: var(--muted); font-size: .92rem; font-variant-caps: all-small-caps; letter-spacing: .07em; }

  /* An open slot is an unwritten column: ruled, not greeked. */
  .slot { padding: .7rem 0 .2rem; border-bottom: 1px solid var(--faint); }
  .slot .question { margin: .25rem 0 .6rem; font-style: italic; }
  .slot .lines {
    block-size: 3.9rem; margin-bottom: .6rem;
    background: repeating-linear-gradient(to bottom, transparent 0 1.25rem, var(--faint) 1.25rem 1.3rem);
  }

  ol.style, ul.questions { padding-left: 1.3rem; }
  ol.style li, ul.questions li { margin: .35rem 0; }

  .colophon { margin-top: 3rem; padding-top: .8rem; border-top: 3px double var(--rule); position: relative; font-size: .95rem; color: var(--muted); }
  .colophon p { margin: 0 0 .3rem; max-width: 30rem; }
  .door {
    position: absolute; right: 0; bottom: 0; min-inline-size: 44px; min-block-size: 44px;
    display: inline-flex; align-items: center; justify-content: center;
    opacity: .12; text-decoration: none;
  }
  .door:hover, .door:focus-visible { opacity: 1; color: var(--crust); }

  /* Offprint and clipping: chrome-free, meant to be sent. */
  .offprint-line { text-align: center; margin: 0 0 1.4rem; padding-bottom: .5rem; border-bottom: 1px solid var(--rule); color: var(--muted); }
  body.clipping { min-block-size: 100svh; display: grid; place-items: center; }
  .clip {
    width: min(28rem, calc(100% - 3rem)); margin: 2rem auto; padding: 1.5rem 1.4rem 1.2rem;
    background: var(--card); outline: 1px dashed var(--muted); outline-offset: .7rem;
  }
  .clip .source { margin: 0 0 1rem; padding-bottom: .45rem; border-bottom: 3px double var(--rule); color: var(--muted); font-size: .92rem; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0 .6rem; }
  .clip .source span, .ears span { white-space: nowrap; }
  .clip blockquote { margin: 0; font-size: clamp(1.45rem, 6vw, 1.85rem); line-height: 1.3; font-style: italic; }
  .clip .from { margin: 1rem 0 0; color: var(--muted); font-size: .95rem; }

  input { font: inherit; padding: .5rem .6rem; border: 1px solid var(--rule); background: var(--card); color: var(--ink); width: 100%; }
  button { font: inherit; min-block-size: 44px; padding: .4rem 1rem; margin: .8rem .4rem 0 0; border: 1px solid var(--rule); background: transparent; color: var(--ink); cursor: pointer; }
  label { display: block; margin: .8rem 0 .3rem; color: var(--muted); }
`;

function page({ title, description, canonical, body, robots = "", bodyClass = "" }) {
  const robotsTag = robots ? `\n  <meta name="robots" content="${escapeHtml(robots)}">` : "";
  const cls = bodyClass ? ` class="${escapeHtml(bodyClass)}"` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">${robotsTag}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta name="theme-color" content="#f4efe4" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#15120e" media="(prefers-color-scheme: dark)">
  <style>${STYLE}</style>
</head>
<body${cls}>
${body}
</body>
</html>`;
}

function framed(options) {
  return page({
    ...options,
    body: `<a class="skip" href="#main">Skip to content</a>
<main id="main">
${options.body}
${colophon()}
</main>`,
  });
}

/* The expansion so far. Each decimal place belongs to one issue: this
   issue's place is marked, and places whose issue is still open are faint. */
function expansion(current) {
  const last = numbered[numbered.length - 1].no;
  let out = escapeHtml(last.slice(0, 2));
  for (let i = 2; i < last.length; i += 1) {
    const digit = escapeHtml(last[i]);
    const owner = numbered[i - 2];
    if (current && owner === current) out += `<span class="here">${digit}</span>`;
    else if (owner.status === "open") out += `<span class="ahead">${digit}</span>`;
    else out += digit;
  }
  const label = current
    ? `This is number ${current.no}.`
    : `Printed to ${printed.length ? printed[printed.length - 1].no : "3"}; ${forthcoming.length} forthcoming.`;
  return `<p class="expansion"><span aria-hidden="true">${out}…</span><span class="vh">${escapeHtml(label)}</span></p>`;
}

function masthead({ current = null, compact = false, heading = false } = {}) {
  const tag = heading ? "h1" : "p";
  const right = current ? `No. ${escapeHtml(current.no)}` : `${printed.length} issues`;
  return `<header class="masthead${compact ? " compact" : ""}">
  <p class="ears caps"><span>Vol. 3</span><span>wap.mom</span><span>${right}</span></p>
  <${tag} class="title"><a href="/">${NAME}</a></${tag}>
  ${expansion(current)}
</header>`;
}

function colophon() {
  return `<footer class="colophon">
  <p>${NAME} is numbered by the decimal expansion of π. Each issue adds a place.</p>
  <p>It is written in <a href="/room">a room</a>, in conversation. ${escapeHtml(VERSION)}.</p>
  <ul class="links" aria-label="${NAME}">
    <li><a href="/">Front page</a></li>
    <li><a href="/room">The room</a></li>
    <li><a href="/now.json">now.json</a></li>
  </ul>
  <a class="door" href="https://smut.today/" rel="nofollow" aria-label="smut.today">π</a>
</footer>`;
}

function kicker(issue) {
  const galley = issue.status === "draft" ? ` · <span class="galley">galley proof</span>` : "";
  return `<p class="kicker caps">No. ${escapeHtml(issue.no)}${galley}</p>`;
}

function citation(issue) {
  return `“${escapeHtml(issue.title)}.” <i>${NAME}</i>, no. ${escapeHtml(issue.no)}. wap.mom/${escapeHtml(issue.slug)}/`;
}

function usesPanel(issue) {
  const rows = USES.filter(([key]) => issue.uses?.[key])
    .map(([key, label]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(issue.uses[key])}</dd>`)
    .join("\n    ");
  if (!rows) return "";
  return `<aside class="uses" aria-labelledby="uses-${escapeHtml(issue.slug)}">
  <p class="caps head" id="uses-${escapeHtml(issue.slug)}">Uses</p>
  <dl>
    ${rows}
  </dl>
</aside>`;
}

function issueBody(issue) {
  return issue.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n    ");
}

function renderFront() {
  const lead = printed[printed.length - 1];
  const back = printed.slice(0, -1).reverse();
  const backList = back.length
    ? `<section aria-labelledby="back-head">
  <p class="caps head" id="back-head">Back issues</p>
  <ol class="back">
    ${back
      .map(
        (i) => `<li><span class="no">No. ${escapeHtml(i.no)}</span><span><a href="/${escapeHtml(i.slug)}/">${escapeHtml(i.title)}</a> — <i>${escapeHtml(i.dek)}</i></span></li>`
      )
      .join("\n    ")}
  </ol>
</section>`
    : "";
  const slots = forthcoming.length
    ? `<section aria-labelledby="ahead-head">
  <p class="caps head" id="ahead-head">Forthcoming</p>
  ${forthcoming.map(renderSlot).join("\n  ")}
</section>`
    : "";
  return framed({
    title: `${NAME} — wap.mom`,
    description: "A periodical of wonder about π, and about pie. Numbered by the decimal expansion of π.",
    canonical: "https://wap.mom/",
    body: `${masthead({ heading: true })}
<article class="lead" aria-labelledby="lead-title">
  ${kicker(lead)}
  <h2 id="lead-title"><a href="/${escapeHtml(lead.slug)}/">${escapeHtml(lead.title)}</a></h2>
  <p class="dek">${escapeHtml(lead.dek)}</p>
  <div class="body"><p>${escapeHtml(lead.body[0])}</p></div>
  <ul class="links"><li><a href="/${escapeHtml(lead.slug)}/">Read No. ${escapeHtml(lead.no)}</a></li></ul>
</article>
${backList}
${slots}`,
  });
}

function renderSlot(issue) {
  return `<div class="slot">
    <p class="kicker caps">No. ${escapeHtml(issue.no)} · working title</p>
    <h2>${escapeHtml(issue.title)}</h2>
    <p class="question">${escapeHtml(issue.question)}</p>
    <div class="lines" aria-hidden="true"></div>
  </div>`;
}

function renderIssue(issue) {
  const index = printed.indexOf(issue);
  const prev = printed[index - 1];
  const next = printed[index + 1];
  const pull = issue.clip
    ? `<figure class="pull"><blockquote>${escapeHtml(issue.clip)}</blockquote></figure>`
    : "";
  return framed({
    title: `${issue.title} — ${NAME}, no. ${issue.no}`,
    description: `${issue.dek} ${NAME}, no. ${issue.no}.`,
    canonical: `https://wap.mom/${issue.slug}/`,
    body: `${masthead({ current: issue, compact: true })}
<article aria-labelledby="issue-title">
  ${kicker(issue)}
  <h1 id="issue-title">${escapeHtml(issue.title)}</h1>
  <p class="dek">${escapeHtml(issue.dek)}</p>
  <div class="body">
    <p>${escapeHtml(issue.body[0])}</p>
  </div>
  ${pull}
  <div class="body rest">
    ${issue.body.slice(1).map((p) => `<p>${escapeHtml(p)}</p>`).join("\n    ")}
  </div>
  ${usesPanel(issue)}
  <p class="cite"><span class="caps">Cite</span> ${citation(issue)}</p>
  <ul class="links" aria-label="Pass it on">
    <li><a href="/${escapeHtml(issue.slug)}/offprint/">Offprint</a></li>
    ${issue.clip ? `<li><a href="/${escapeHtml(issue.slug)}/clip/">Clipping</a></li>` : ""}
  </ul>
</article>
<nav class="pager" aria-label="Issues">
  ${prev ? `<a href="/${escapeHtml(prev.slug)}/" rel="prev">← No. ${escapeHtml(prev.no)}</a>` : "<span></span>"}
  ${next ? `<a href="/${escapeHtml(next.slug)}/" rel="next">No. ${escapeHtml(next.no)} →</a>` : "<span></span>"}
</nav>`,
  });
}

/* The whole issue with no chrome: what you send when you pass it on. */
function renderOffprint(issue) {
  return page({
    title: `${issue.title} — offprint from ${NAME}`,
    description: `${issue.dek} Offprint from ${NAME}, no. ${issue.no}.`,
    canonical: `https://wap.mom/${issue.slug}/`,
    robots: "noindex",
    body: `<main>
<p class="offprint-line caps">Offprint · ${NAME} · No. ${escapeHtml(issue.no)}</p>
<article>
  <h1>${escapeHtml(issue.title)}</h1>
  <p class="dek">${escapeHtml(issue.dek)}</p>
  <div class="body">
    ${issueBody(issue)}
  </div>
  ${usesPanel(issue)}
  <p class="cite">${citation(issue)}</p>
</article>
</main>`,
  });
}

/* One passage, cut out with its source. Sized to survive a screenshot. */
function renderClip(issue) {
  return page({
    title: `“${issue.clip}” — ${NAME}`,
    description: `A clipping from ${NAME}, no. ${issue.no}.`,
    canonical: `https://wap.mom/${issue.slug}/`,
    robots: "noindex",
    bodyClass: "clipping",
    body: `<main>
<figure class="clip">
  <p class="source caps"><span>${NAME}</span><span>No. ${escapeHtml(issue.no)}</span></p>
  <blockquote>${escapeHtml(issue.clip)}</blockquote>
  <figcaption class="from">From “${escapeHtml(issue.title)}” · <a href="/${escapeHtml(issue.slug)}/">wap.mom/${escapeHtml(issue.slug)}/</a></figcaption>
</figure>
</main>`,
  });
}

function renderRoom() {
  const galleys = printed.filter((i) => i.status === "draft");
  const people = ROOM.length
    ? `<ul class="questions">${ROOM.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`
    : `<p class="muted">No names yet. Names appear here only with the person's say-so.</p>`;
  return framed({
    title: `The room — ${NAME}`,
    description: `How ${NAME} is written: house style, open questions, and the issues in progress.`,
    canonical: "https://wap.mom/room",
    robots: "noindex",
    body: `${masthead({ compact: true })}
<h1>The room.</h1>
<p>${NAME} is written in conversation. This page is what the room is holding.</p>
<section aria-labelledby="style-head">
  <p class="caps head" id="style-head">House style</p>
  <ol class="style">${HOUSE_STYLE.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
</section>
<section aria-labelledby="q-head">
  <p class="caps head" id="q-head">Open questions</p>
  <ul class="questions">${OPEN_QUESTIONS.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ul>
</section>
<section aria-labelledby="galley-head">
  <p class="caps head" id="galley-head">In galley</p>
  <ol class="back">${galleys
    .map((i) => `<li><span class="no">No. ${escapeHtml(i.no)}</span><span><a href="/${escapeHtml(i.slug)}/">${escapeHtml(i.title)}</a></span></li>`)
    .join("")}</ol>
</section>
<section aria-labelledby="slot-head">
  <p class="caps head" id="slot-head">Forthcoming</p>
  ${forthcoming.map(renderSlot).join("\n  ")}
</section>
<section aria-labelledby="people-head">
  <p class="caps head" id="people-head">In the room</p>
  ${people}
</section>`,
  });
}

/* ---- Cabinet: filings received before the form closed. Behind a key. ---- */

function cookiesOf(request) {
  const raw = request.headers.get("cookie") || "";
  const out = {};
  for (const part of raw.split(";")) {
    const cut = part.indexOf("=");
    if (cut === -1) continue;
    out[part.slice(0, cut).trim()] = decodeURIComponent(part.slice(cut + 1).trim());
  }
  return out;
}

async function secretsEqual(provided, expected) {
  if (!expected) return false;
  const enc = new TextEncoder();
  const a = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(String(provided))));
  const b = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(String(expected))));
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a[i] || 0) ^ (b[i] || 0);
  return diff === 0;
}

async function cabinetUnlocked(request, env) {
  const expected = env?.CABINET_KEY;
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const cookie = cookiesOf(request).wap_cabinet || "";
  const provided = bearer || cookie;
  if (!provided) return false;
  return secretsEqual(provided, expected);
}

function clipField(value, max) {
  return String(value || "").trim().slice(0, max);
}

function filingExcerpt(filing) {
  return String(filing.helpful || filing.sexy || filing.wonder || "").slice(0, 140);
}

function cabinetPage(body, title = "Cabinet") {
  return framed({
    title: `${title} — wap.mom`,
    description: "Cabinet.",
    canonical: "https://wap.mom/cabinet",
    robots: "noindex, nofollow",
    body: `${masthead({ compact: true })}
<h1>Cabinet.</h1>
<p class="muted">Filings received before the form closed. Nothing new arrives here. Read, keep, or discard.</p>
${body}`,
  });
}

function renderCabinetLogin(notice = "") {
  const banner = notice ? `<p class="muted">${escapeHtml(notice)}</p>` : "";
  return cabinetPage(`${banner}
<form method="post" action="/cabinet">
  <label for="key">Key</label>
  <input id="key" name="key" type="password" autocomplete="current-password" required>
  <button type="submit">Open</button>
</form>`);
}

function renderCabinetList(filings, status, notice = "") {
  const banner = notice ? `<p class="muted">${escapeHtml(notice)}</p>` : "";
  const filters = ["open", "kept", "shelved", "all"]
    .map((s) =>
      s === status
        ? `<li><strong>${escapeHtml(s)}</strong></li>`
        : `<li><a href="/cabinet?status=${encodeURIComponent(s)}">${escapeHtml(s)}</a></li>`
    )
    .join("");
  const items = filings.length
    ? filings
        .map(
          (f) => `<div class="slot">
  <p class="kicker caps">${escapeHtml(f.status || "open")} · ${escapeHtml(f.received || "")}${f.reach ? " · email on file" : ""}</p>
  <h2><a href="/cabinet/${escapeHtml(f.id)}">${escapeHtml(f.office || f.id)}</a></h2>
  <p>${escapeHtml(filingExcerpt(f))}</p>
</div>`
        )
        .join("")
    : `<p class="muted">No filings in this drawer.</p>`;
  return cabinetPage(`<ul class="links">${filters}</ul>
${banner}
<p class="muted">${filings.length} shown.</p>
${items}`);
}

function renderCabinetItem(filing, notice = "") {
  const banner = notice ? `<p class="muted">${escapeHtml(notice)}</p>` : "";
  const processed = filing.processed
    ? `<p class="muted">Last: ${escapeHtml(filing.processed.action)} · ${escapeHtml(filing.processed.at)}${filing.processed.note ? ` · ${escapeHtml(filing.processed.note)}` : ""}</p>`
    : "";
  const field = (label, value) => (value ? `<p class="kicker caps">${label}</p><p>${escapeHtml(value)}</p>` : "");
  return cabinetPage(
    `${banner}
<article>
  <p class="kicker caps">${escapeHtml(filing.status || "open")} · ${escapeHtml(filing.received || "")}</p>
  ${field("Office", filing.office)}
  ${field("Serves", filing.serves)}
  ${field("Name", filing.from)}
  ${field("Email", filing.reach)}
  ${field("Wish", filing.sexy)}
  ${field("Wish", filing.helpful)}
  ${field("Wish", !filing.sexy && !filing.helpful ? filing.wonder : "")}
  ${processed}
  <form method="post" action="/cabinet/${escapeHtml(filing.id)}">
    <label for="note">Note</label>
    <input id="note" name="note" maxlength="500" value="${escapeHtml(filing.processed?.note || "")}">
    <button type="submit" name="action" value="keep">Keep</button>
    <button type="submit" name="action" value="shelve">Shelve</button>
    <button type="submit" name="action" value="open">Reopen</button>
    <button type="submit" name="action" value="discard">Discard</button>
  </form>
</article>`,
    `Filing ${filing.id}`
  );
}

async function listFilings(env, status) {
  if (!env?.FILINGS) return [];
  const keys = [];
  let cursor;
  do {
    const listed = await env.FILINGS.list({ prefix: "filing:", cursor });
    keys.push(...listed.keys);
    cursor = listed.list_complete ? undefined : listed.cursor;
  } while (cursor);
  const rows = await Promise.all(keys.map((k) => env.FILINGS.get(k.name)));
  return rows
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((f) => (status === "all" ? true : (f.status || "open") === status))
    .sort((a, b) => String(b.received || "").localeCompare(String(a.received || "")));
}

function cabinetSetCookie(key) {
  return `wap_cabinet=${encodeURIComponent(key)}; Path=/cabinet; HttpOnly; Secure; SameSite=Strict; Max-Age=1209600`;
}

async function handleCabinetEnter(request, env) {
  if (!env?.CABINET_KEY) return htmlPrivate(renderCabinetLogin("The lock is not cut."), 503);
  const form = await request.formData();
  const key = String(form.get("key") || "");
  if (!(await secretsEqual(key, env.CABINET_KEY))) {
    return htmlPrivate(renderCabinetLogin("That key does not open the cabinet."), 401);
  }
  return new Response(null, {
    status: 303,
    headers: { ...BASE_SECURITY, Location: "https://wap.mom/cabinet", "Set-Cookie": cabinetSetCookie(key) },
  });
}

async function handleCabinetAction(request, env, id) {
  const form = await request.formData();
  const action = String(form.get("action") || "");
  const note = clipField(form.get("note"), 500);
  const key = `filing:${id}`;
  const raw = await env.FILINGS.get(key);
  if (!raw) return htmlPrivate(renderCabinetLogin("That filing is gone."), 404);
  const filing = JSON.parse(raw);
  if (action === "discard") {
    await env.FILINGS.delete(key);
    return Response.redirect("https://wap.mom/cabinet", 303);
  }
  const next = { keep: "kept", shelve: "shelved", open: "open" }[action];
  if (!next) return htmlPrivate(renderCabinetItem(filing, "Keep, shelve, reopen, or discard."), 400);
  filing.status = next;
  filing.processed = { at: new Date().toISOString(), action, note: note || null };
  await env.FILINGS.put(key, JSON.stringify(filing));
  return Response.redirect(`https://wap.mom/cabinet/${encodeURIComponent(id)}`, 303);
}

/* ---- Responses ---- */

function jsonResponse(body, extra = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": extra.cache || "public, max-age=300",
      ...(extra.robots ? { "X-Robots-Tag": extra.robots } : {}),
    },
  });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": status === 200 ? "public, max-age=120" : "no-store",
    },
  });
}

function htmlPrivate(body, status = 200) {
  return new Response(body, {
    status,
    headers: { ...BASE_SECURITY, "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}

function nowJson() {
  return {
    version: VERSION,
    name: NAME,
    numbering: "Issue n is π to n decimal places.",
    issues: printed.map(({ no, slug, title, dek, status, clip, uses }) => ({
      no, slug, title, dek, status, clip: clip || null, uses: uses || null, url: `https://wap.mom/${slug}/`,
    })),
    forthcoming: forthcoming.map(({ no, slug, title, question }) => ({ no, slug, title, question })),
    room: { houseStyle: HOUSE_STYLE, openQuestions: OPEN_QUESTIONS, uses: Object.fromEntries(USES) },
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (url.hostname.startsWith("www.")) {
      return Response.redirect(`https://wap.mom${path}${url.search}`, 302);
    }
    if (path === "/favicon.svg") {
      return new Response(FAVICON, {
        headers: { ...BASE_SECURITY, "Content-Type": "image/svg+xml; charset=UTF-8", "Cache-Control": "public, max-age=86400" },
      });
    }
    if (path === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\nDisallow: /cabinet\n", {
        headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8" },
      });
    }
    if (path === "/now.json") return jsonResponse(nowJson());
    if (path === "/" || path === "") return html(renderFront());
    if (path === "/room" || path === "/room/") return html(renderRoom());

    if (path === "/cabinet" && request.method === "POST") return handleCabinetEnter(request, env);
    if (path === "/cabinet" || path === "/cabinet/") {
      if (!(await cabinetUnlocked(request, env))) return htmlPrivate(renderCabinetLogin());
      const status = url.searchParams.get("status") || "open";
      const wanted = ["open", "kept", "shelved", "all"].includes(status) ? status : "open";
      return htmlPrivate(renderCabinetList(await listFilings(env, wanted), wanted));
    }
    const cabinetItem = path.match(/^\/cabinet\/([^/]+)\/?$/);
    if (cabinetItem) {
      if (!(await cabinetUnlocked(request, env))) return htmlPrivate(renderCabinetLogin());
      const id = decodeURIComponent(cabinetItem[1]);
      if (request.method === "POST") return handleCabinetAction(request, env, id);
      const raw = await env.FILINGS?.get(`filing:${id}`);
      if (!raw) return htmlPrivate(renderCabinetList([], "open", "That filing is gone."), 404);
      return htmlPrivate(renderCabinetItem(JSON.parse(raw)));
    }
    if (path === "/cabinet.json") {
      if (!(await cabinetUnlocked(request, env))) {
        return new Response(JSON.stringify({ error: "locked" }), {
          status: 401,
          headers: { ...BASE_SECURITY, "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
        });
      }
      const status = url.searchParams.get("status") || "open";
      const wanted = ["open", "kept", "shelved", "all"].includes(status) ? status : "open";
      return jsonResponse({ version: VERSION, status: wanted, filings: await listFilings(env, wanted) }, { cache: "no-store", robots: "noindex" });
    }

    const match = path.match(/^\/([a-z0-9-]+)\/(?:(offprint|clip)\/?)?$/) || path.match(/^\/([a-z0-9-]+)$/);
    const issue = match ? printed.find((i) => i.slug === match[1]) : null;
    if (issue) {
      if (match[2] === "offprint") return html(renderOffprint(issue));
      if (match[2] === "clip" && issue.clip) return html(renderClip(issue));
      if (!match[2]) return html(renderIssue(issue));
    }
    return new Response("Not found", {
      status: 404,
      headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8" },
    });
  },
};
