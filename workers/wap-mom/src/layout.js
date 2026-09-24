/**
 * Type, chrome, and responses. The periodical is set like print: ears,
 * double rules, small caps, a drop cap. Each series prints in its own ink:
 * π in crust, e in rise.
 */
import { SERIES } from "./room.js";
import { inSeries, printedIn } from "./catalog.js";

export const NAME = SERIES.pi.name;
export const VERSION = "0.2.0";
export const ORIGIN = "https://wap.mom";

export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const BASE_SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
};

export const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#f4efe4"/>
  <text x="16" y="23" text-anchor="middle" font-size="19" fill="#1c1916" font-family="Georgia, serif">π</text>
</svg>`;

const STYLE = `
  :root {
    color-scheme: light dark;
    --paper: #f4efe4; --ink: #1c1916; --muted: #625a4f; --rule: #1c1916;
    --faint: rgba(28, 25, 22, .16); --card: #fbf8f1;
    --crust: #8a4f17; --rise: #1f6a66; --accent: var(--crust);
    --serif: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --paper: #15120e; --ink: #ede5d6; --muted: #b0a591; --rule: #ede5d6;
      --faint: rgba(237, 229, 214, .16); --card: #1d1914;
      --crust: #e0a262; --rise: #6cc5bd;
    }
  }
  body.series-e { --accent: var(--rise); }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--paper); color: var(--ink);
    font: 1.1rem/1.62 var(--serif); font-variant-numeric: oldstyle-nums proportional-nums;
  }
  main { width: min(36rem, calc(100% - 2rem)); margin: 0 auto; padding: 1.6rem 0 3rem; }
  a { color: inherit; text-decoration-color: var(--accent); text-underline-offset: .18em; }
  a:focus-visible, button:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .caps { font-variant-caps: all-small-caps; letter-spacing: .07em; }
  .muted { color: var(--muted); }
  .skip { position: absolute; left: -9999px; top: 0; padding: .5rem .8rem; background: var(--ink); color: var(--paper); }
  .skip:focus { left: 0; z-index: 2; }
  .vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

  /* Masthead: ears, title, the expansion so far. */
  .masthead { text-align: center; border-bottom: 3px double var(--rule); padding-bottom: .7rem; margin-bottom: 1.6rem; }
  .ears { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0 1rem; margin: 0 0 .3rem; color: var(--muted); font-size: .95rem; }
  .ears span, .clip .source span { white-space: nowrap; }
  .title { margin: 0; font-size: clamp(2.1rem, 9vw, 3.4rem); line-height: 1.05; letter-spacing: -.02em; font-weight: 400; }
  .title a { text-decoration: none; }
  .masthead.compact .title { font-size: clamp(1.5rem, 6vw, 2rem); }
  .subtitle { margin: .1rem 0 0; color: var(--accent); font-style: italic; }
  .expansion { margin: .45rem 0 0; font-size: 1.05rem; letter-spacing: .12em; font-variant-numeric: lining-nums tabular-nums; }
  .expansion .here { color: var(--accent); text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: .25em; }
  .expansion .ahead { color: var(--muted); opacity: .55; }

  h1, h2 { font-weight: 400; line-height: 1.12; letter-spacing: -.01em; }
  h1 { font-size: clamp(2rem, 7vw, 2.8rem); margin: .1rem 0 .2rem; }
  h2 { font-size: 1.45rem; margin: .1rem 0 .3rem; }
  .kicker { margin: 0; color: var(--muted); font-size: .98rem; }
  .dek { margin: 0 0 1.2rem; font-style: italic; color: var(--muted); font-size: 1.2rem; }
  .galley { color: var(--accent); }
  .dateline { margin: .1rem 0 0; color: var(--muted); font-size: .92rem; }

  .body p { margin: 0 0 1rem; hyphens: auto; }
  .body:not(.rest) p:first-child::first-letter { float: left; font-size: 3.3em; line-height: .82; padding: .06em .09em 0 0; color: var(--accent); }
  .pull { margin: 1.6rem 0; padding: .9rem 0; border-block: 1px solid var(--rule); text-align: center; }
  .pull blockquote { margin: 0; font-size: 1.35rem; line-height: 1.35; font-style: italic; }

  /* A printer's ornament: the series' constant between rules. */
  .fleuron { display: flex; align-items: center; gap: .8rem; margin: 1.8rem 0 0; color: var(--accent); font-style: italic; }
  .fleuron::before, .fleuron::after { content: ""; flex: 1; border-top: 1px solid var(--faint); }

  /* Figures: instruments. They work without script; with it, they follow the hand. */
  .fig { margin: 1.8rem 0 0; padding: 1rem 0 .4rem; border-top: 1px solid var(--rule); }
  .fig-stage svg { display: block; width: 100%; height: auto; }
  .fig-svg { font: 11px var(--serif); }
  .fig-svg text { fill: var(--muted); }
  .fig-svg .ink { stroke: var(--ink); fill: none; stroke-width: 1.2; }
  .fig-svg .accent { stroke: var(--accent); fill: none; stroke-width: 1.6; }
  .fig-svg .thick { stroke-width: 3; }
  .fig-svg .dashed { stroke-dasharray: 4 3; }
  .fig-svg .faint { stroke: var(--faint); fill: none; stroke-width: 1; }
  .fig-svg .guide { stroke: var(--muted); stroke-dasharray: 3 3; fill: none; opacity: .6; }
  .fig-svg .soft.accent { fill: var(--accent); fill-opacity: .14; }
  .fig-svg .soft.ink { fill: var(--ink); fill-opacity: .06; }
  .fig-svg .fill-accent { fill: var(--accent); fill-opacity: .3; stroke: none; }
  .fig-svg .fill-accent.solid { fill-opacity: .55; }
  .fig-svg .needle { stroke: var(--muted); stroke-width: 1; opacity: .7; }
  .fig-svg .dot { fill: var(--muted); }
  .fig-svg .dot-accent { fill: var(--accent); }
  .fig-svg .slice-a { fill: var(--accent); fill-opacity: .38; stroke: var(--ink); stroke-width: .6; }
  .fig-svg .slice-b { fill: var(--accent); fill-opacity: .14; stroke: var(--ink); stroke-width: .6; }
  .fig-readout { margin: .5rem 0; font-size: 1rem; }
  .fig-controls { margin: .6rem 0; }
  .fig-control { display: grid; grid-template-columns: 1fr auto; gap: 0 .8rem; align-items: center; margin: .2rem 0; }
  .fig-control label { color: var(--muted); font-size: .95rem; }
  .fig-control output { grid-row: 1; grid-column: 2; font-variant-numeric: lining-nums tabular-nums; }
  .fig-control input[type="range"] { grid-column: 1 / -1; width: 100%; min-block-size: 44px; accent-color: var(--accent); margin: 0; }
  .fig-buttons { display: flex; flex-wrap: wrap; gap: .5rem; }
  .fig.is-live .fig-draw { display: none; }
  .fig figcaption { color: var(--muted); font-size: .95rem; font-style: italic; }
  .fig figcaption .caps { font-style: normal; color: var(--accent); }

  /* Uses: one line per dimension, the same four in every issue. */
  .uses { margin: 1rem 0 0; padding: .9rem 1rem .4rem; background: var(--card); border: 1px solid var(--faint); border-top: 3px double var(--rule); }
  .uses .head { margin: 0 0 .5rem; color: var(--muted); }
  .uses dl { margin: 0; }
  .uses dt { color: var(--accent); font-size: .92rem; font-variant-caps: all-small-caps; letter-spacing: .07em; }
  .uses dd { margin: 0 0 .7rem; }

  .cite { font-size: .95rem; color: var(--muted); border-top: 1px solid var(--faint); padding-top: .8rem; margin: 1.4rem 0 .4rem; }
  .links { display: flex; flex-wrap: wrap; gap: 0 1.2rem; margin: 0; padding: 0; list-style: none; }
  .links a { display: inline-flex; align-items: center; min-block-size: 44px; }
  .pager { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; border-top: 1px solid var(--rule); margin-top: 1.4rem; }
  .pager a { display: inline-flex; align-items: center; min-block-size: 44px; }
  .correction { margin: 1rem 0 0; padding: .6rem .8rem; border-left: 3px solid var(--accent); background: var(--card); font-size: .98rem; }

  button { font: inherit; min-block-size: 44px; padding: .35rem 1rem; border: 1px solid var(--rule); border-radius: 999px; background: transparent; color: var(--ink); cursor: pointer; }
  button:hover { border-color: var(--accent); color: var(--accent); }
  label { color: var(--muted); }
  input[type="password"], input[type="text"], input:not([type]) { font: inherit; padding: .5rem .6rem; border: 1px solid var(--rule); background: var(--card); color: var(--ink); width: 100%; }

  section { margin: 2rem 0 0; }
  section > .caps.head { margin: 0 0 .6rem; padding-bottom: .3rem; border-bottom: 1px solid var(--rule); color: var(--muted); }
  .lead h2 { font-size: clamp(1.8rem, 6vw, 2.3rem); }
  .back { list-style: none; padding: 0; margin: 0; }
  .back li { padding: .55rem 0; border-bottom: 1px solid var(--faint); }
  .back .no { display: block; color: var(--muted); font-size: .92rem; font-variant-caps: all-small-caps; letter-spacing: .07em; }
  .supplement { margin: 2rem 0 0; padding: .9rem 1rem; border: 1px solid var(--faint); border-top: 3px double var(--rule); background: var(--card); --accent: var(--rise); }
  .supplement .expansion { text-align: left; font-size: .95rem; }

  /* An open slot is an unwritten column: ruled, not greeked. */
  .slot { padding: .7rem 0 .2rem; border-bottom: 1px solid var(--faint); }
  .slot .question { margin: .25rem 0 .6rem; font-style: italic; }
  .slot .lines { block-size: 3.9rem; margin-bottom: .6rem; background: repeating-linear-gradient(to bottom, transparent 0 1.25rem, var(--faint) 1.25rem 1.3rem); }

  ol.style, ul.questions { padding-left: 1.3rem; }
  ol.style li, ul.questions li { margin: .35rem 0; }

  .mark { text-align: center; margin: 1.6rem 0; }
  .mark .equation { font-size: 1.9rem; font-style: italic; letter-spacing: .02em; }
  .mark .equation sup { font-size: .6em; }

  .colophon { margin-top: 3rem; padding-top: .8rem; border-top: 3px double var(--rule); position: relative; font-size: .95rem; color: var(--muted); }
  .colophon p { margin: 0 0 .3rem; max-width: 30rem; }
  .colophon .printers-mark { font-style: italic; }
  .door { position: absolute; right: 0; bottom: 0; min-inline-size: 44px; min-block-size: 44px; display: inline-flex; align-items: center; justify-content: center; opacity: .12; text-decoration: none; }
  .door:hover, .door:focus-visible { opacity: 1; color: var(--accent); }

  /* Offprint and clipping: chrome-free, meant to be sent. */
  .offprint-line { text-align: center; margin: 0 0 1.4rem; padding-bottom: .5rem; border-bottom: 1px solid var(--rule); color: var(--muted); }
  body.clipping { min-block-size: 100svh; display: grid; place-items: center; }
  .clip { width: min(28rem, calc(100% - 3rem)); margin: 2rem auto; padding: 1.5rem 1.4rem 1.2rem; background: var(--card); outline: 1px dashed var(--muted); outline-offset: .7rem; }
  .clip .source { margin: 0 0 1rem; padding-bottom: .45rem; border-bottom: 3px double var(--rule); color: var(--muted); font-size: .92rem; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0 .6rem; }
  .clip blockquote { margin: 0; font-size: clamp(1.45rem, 6vw, 1.85rem); line-height: 1.3; font-style: italic; }
  .clip .from { margin: 1rem 0 0; color: var(--muted); font-size: .95rem; }

  @media print {
    :root { --paper: #fff; --ink: #000; --card: #fff; }
    .skip, .door, .links, .pager, .fig-controls, .colophon ul { display: none; }
    main { width: auto; padding: 0; }
    .fig, .uses, .pull { break-inside: avoid; }
    a { text-decoration: none; }
  }
`;

export function page({ title, description, canonical, body, robots = "", bodyClass = "", type = "website", scripts = [] }) {
  const robotsTag = robots ? `\n  <meta name="robots" content="${escapeHtml(robots)}">` : "";
  const cls = bodyClass ? ` class="${escapeHtml(bodyClass)}"` : "";
  const scriptTags = scripts.map((src) => `\n  <script src="${escapeHtml(src)}" defer></script>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">${robotsTag}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate" type="application/atom+xml" title="${NAME}" href="/feed.xml">
  <meta property="og:site_name" content="${NAME}">
  <meta property="og:type" content="${escapeHtml(type)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#f4efe4" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#15120e" media="(prefers-color-scheme: dark)">
  <style>${STYLE}</style>${scriptTags}
</head>
<body${cls}>
${body}
</body>
</html>`;
}

export function framed(options) {
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
export function expansion(series, current = null) {
  const issues = inSeries(series);
  const last = issues[issues.length - 1].no;
  let out = escapeHtml(last.slice(0, 2));
  for (let i = 2; i < last.length; i += 1) {
    const digit = escapeHtml(last[i]);
    const owner = issues[i - 2];
    if (current && owner.slug === current.slug) out += `<span class="here">${digit}</span>`;
    else if (owner.status === "open") out += `<span class="ahead">${digit}</span>`;
    else out += digit;
  }
  const printed = printedIn(series);
  const label = current
    ? `This is number ${current.no}.`
    : `Printed to ${printed.length ? printed[printed.length - 1].no : last.slice(0, 1)}.`;
  return `<p class="expansion"><span aria-hidden="true">${out}…</span><span class="vh">${escapeHtml(label)}</span></p>`;
}

export function masthead({ series = "pi", current = null, compact = false, heading = false } = {}) {
  const S = SERIES[series];
  const tag = heading ? "h1" : "p";
  const right = current ? `${S.label} ${escapeHtml(current.no)}` : `${printedIn(series).length} issues`;
  const subtitle = series === "pi" ? "" : `\n  <p class="subtitle">${escapeHtml(S.name)}</p>`;
  return `<header class="masthead${compact ? " compact" : ""}">
  <p class="ears caps"><span>${S.volume}</span><span>wap.mom</span><span>${right}</span></p>
  <${tag} class="title"><a href="/">${NAME}</a></${tag}>${subtitle}
  ${expansion(series, current)}
</header>`;
}

export function fleuron(series) {
  return `<p class="fleuron" aria-hidden="true">${escapeHtml(SERIES[series].short)}</p>`;
}

function colophon() {
  return `<footer class="colophon">
  <p>${NAME} is numbered by the decimal expansion of π; its supplement, by e. Each issue adds a place.</p>
  <p>It is written in <a href="/room">a room</a>, in conversation. <span class="printers-mark">e<sup>iπ</sup> + 1 = 0</span>. ${VERSION}.</p>
  <ul class="links" aria-label="${NAME}">
    <li><a href="/">Front page</a></li>
    <li><a href="/contents/">Contents</a></li>
    <li><a href="/room">The room</a></li>
    <li><a href="/colophon/">Colophon</a></li>
    <li><a href="/corrections/">Corrections</a></li>
    <li><a href="/feed.xml">Feed</a></li>
  </ul>
  <a class="door" href="https://smut.today/" rel="nofollow" aria-label="smut.today">π</a>
</footer>`;
}

export function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": status === 200 ? "public, max-age=120" : "no-store",
    },
  });
}

export function htmlPrivate(body, status = 200) {
  return new Response(body, {
    status,
    headers: { ...BASE_SECURITY, "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}

export function textResponse(body, type, cache = "public, max-age=300") {
  return new Response(body, { headers: { ...BASE_SECURITY, "Content-Type": `${type}; charset=UTF-8`, "Cache-Control": cache } });
}

export function jsonResponse(body, extra = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": extra.cache || "public, max-age=300",
      ...(extra.robots ? { "X-Robots-Tag": extra.robots } : {}),
    },
  });
}
