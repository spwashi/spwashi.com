/**
 * wap.mom — Wondering About Pi.
 * Public periodical. The ministry is the subscribed circle.
 * The domain does the wink. The copy does not.
 */

const VERSION = "0.0.1";

const ISSUES = [
  {
    slug: "pi",
    title: "Issue π",
    kicker: "it does not close",
    summary: "A number that keeps offering another digit. Public hours for a standard that refuses to round.",
    body: [
      "Circumference is the first public office. They measure what goes around a table, a pan, a practice, a mouth that has not decided if it is speaking.",
      "π is not a punchline here. It is the work: an infinite courtesy. You can sit with it. You can bake beside it. You can wonder why a circle knows more than a line.",
      "This issue is for readers who like proofs that stay warm, and who already keep more than one kind of books.",
    ],
  },
  {
    slug: "22-7",
    title: "Issue 22/7",
    kicker: "close enough to share",
    summary: "A fraction you can actually serve. Not exact. Exact enough for a Tuesday that still has a brand in it.",
    body: [
      "22/7 is public hours. It is how you explain π to someone who has to leave for the train, or for the call that pays the kitchen.",
      "Close is not cheap. Close is hospitality. A pie that waits for the knife is a theorem with a crust.",
      "This issue is for the reader who will pass it to a collaborator without a synopsis.",
    ],
  },
  {
    slug: "pie",
    title: "Issue pie",
    kicker: "the crust is a proof",
    summary: "Bake as a method of thinking. Filling as a claim. Steam as a remainder.",
    body: [
      "The kitchen is a department of the public hours. Mise is the lemma. The oven is the only argument that convinces a room.",
      "Wonder about π, then about pie: same letters, different offices. One never ends. One ends when you share it.",
      "This issue is the one a camera can hold. The caption is theirs. The ministry keeps the longer notes.",
    ],
  },
];

const MINISTRY_ISSUES = [
  {
    slug: "remainder",
    title: "Issue remainder",
    kicker: "after public hours",
    summary: "The work that does not belong on the shop window: longer briefs, after-hours notes, the wish that would actually change a week.",
  },
  {
    slug: "vertical",
    title: "Issue vertical",
    kicker: "a practice with a body in it",
    summary: "For people who own a lane and still want the household, the brand, and the inner life to remain one piece.",
  },
];

const MOMS = [
  { slug: "circumference", title: "Circumference Mom", brief: "Holds the whole practice, not only the product." },
  { slug: "crust", title: "Crust Mom", brief: "Structure that lets the filling stay itself." },
  { slug: "irrational", title: "Irrational Mom", brief: "Will not round you, or the work, off." },
  { slug: "proof", title: "Proof Mom", brief: "Makes you show your work without making a spectacle of it." },
  { slug: "pie", title: "Pie Mom", brief: "Steam, a knife, a claim you can serve." },
  { slug: "steam", title: "Steam Mom", brief: "The remainder you can see. Heat with a purpose." },
  { slug: "table", title: "Table Mom", brief: "Sets a place. Keeps a seat. Edits the room." },
  { slug: "care", title: "Care Mom", brief: "Domestic encouragement as method, not as leftover time." },
];

const SERVES = [
  { slug: "me", title: "Me", brief: "the person filing" },
  { slug: "family", title: "Family", brief: "people I keep" },
  { slug: "practice", title: "Practice", brief: "the work, the brand, the lane" },
  { slug: "civic", title: "Civic", brief: "the wider room" },
];

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
  <rect width="32" height="32" rx="6" fill="#1a1408"/>
  <text x="16" y="22" text-anchor="middle" font-size="16" fill="#e8c36a" font-family="Georgia, serif">π</text>
</svg>`;

function issueBySlug(slug) {
  return ISSUES.find((i) => i.slug === slug) || null;
}

/* The issue on the counter today. One a day, in order, so a return visit
   meets a different issue first without the archive moving. */
function todayIssue(now = Date.now()) {
  return ISSUES[Math.floor(now / 86400000) % ISSUES.length];
}

function momBySlug(slug) {
  return MOMS.find((m) => m.slug === slug) || null;
}

function servesBySlug(slug) {
  return SERVES.find((s) => s.slug === slug) || null;
}

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

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function filingExcerpt(filing) {
  return String(filing.helpful || filing.sexy || filing.wonder || "").slice(0, 140);
}

function emptyDraft() {
  return { office: "", from: "", reach: "", serves: "", sexy: "", helpful: "", notice: "" };
}

function layout({ title, description, canonical, body, robots = "", bare = false }) {
  const robotsTag = robots ? `\n  <meta name="robots" content="${escapeHtml(robots)}">` : "";
  const footer = bare
    ? `<footer><p>Wondering About Pi · <a href="${escapeHtml(canonical)}">read this on wap.mom</a></p></footer>`
    : `<footer>
      <p>Wondering About Pi. A periodical. A ministry you subscribe to. ${escapeHtml(VERSION)}.</p>
      <nav aria-label="wap.mom"><a href="/">wap.mom</a> · <a href="/moms/">moms</a> · <a href="/ministry">ministry</a> · <a href="/file">file a wish</a> · <a href="/now.json">now.json</a></nav>
      <a class="after-hours" href="https://smut.today/" rel="nofollow" aria-label="after hours">π</a>
    </footer>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">${robotsTag}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta name="theme-color" content="#1a1408">
  <style>
    :root { color-scheme: dark; --bg:#1a1408; --fg:#f4ead6; --muted:#c4b08a; --line:rgba(232,195,106,.28); --gold:#e8c36a; }
    * { box-sizing: border-box; }
    body { margin: 0; font: 1.05rem/1.6 Palatino, Palatino Linotype, ui-serif, Georgia, serif; background:
      radial-gradient(circle at 80% -10%, rgba(232,195,106,.12), transparent 40%), var(--bg); color: var(--fg); }
    main { width: min(40rem, calc(100% - 2rem)); margin: 0 auto; padding: 2.4rem 0 4rem; }
    h1 { font-size: clamp(1.8rem, 5vw, 2.6rem); letter-spacing: -.03em; line-height: 1.08; color: var(--gold); }
    h2 { font-size: 1.2rem; }
    a { color: var(--gold); }
    .kicker, footer, .note, label, .hint { font: .9rem/1.5 ui-sans-serif, system-ui, sans-serif; color: var(--muted); }
    .hint { margin: .15rem 0 .5rem; }
    article { border: 1px solid var(--line); border-radius: 1.1rem; padding: 1.15rem 1.2rem; background: #221a0c; margin: 1.1rem 0; }
    ul { padding-left: 1.1rem; }
    label { display: block; margin: .7rem 0 .3rem; }
    input, select, textarea {
      width: 100%; padding: .55rem .65rem; border: 1px solid var(--line); border-radius: .5rem;
      background: #1a1408; color: var(--fg); font: inherit;
    }
    textarea { min-height: 6.5rem; }
    .hp { position: absolute; left: -9999px; }
    button, .actions button {
      appearance: none; margin-top: 1rem; margin-right: .4rem; min-height: 44px; padding: .55rem 1.1rem;
      border-radius: 999px; border: 1px solid var(--gold); background: transparent; color: var(--gold); font: inherit; cursor: pointer;
    }
    button:focus-visible, a:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
    footer { margin-top: 2.6rem; padding-top: 1rem; border-top: 1px solid var(--line); position: relative; }
    .after-hours {
      position: absolute; right: 0; bottom: 0; min-width: 44px; min-height: 44px;
      display: inline-flex; align-items: center; justify-content: center;
      opacity: .12; color: inherit; text-decoration: none; font-size: 1.05rem;
    }
    .after-hours:hover, .after-hours:focus-visible { opacity: 1; color: var(--gold); }
    .wonder { white-space: pre-wrap; }
    .skip { position: absolute; left: -9999px; top: 0; padding: .5rem .8rem; background: var(--gold); color: var(--bg); border-radius: 0 0 .5rem 0; }
    .skip:focus { left: 0; z-index: 2; }
    .issue-card h2 { margin: .2rem 0 .3rem; font-size: 1.35rem; }
    .issue-card .kicker { margin: 0 0 .25rem; }
    .issues { padding-left: 1.1rem; margin: .3rem 0 0; }
    .issues li { margin: .2rem 0; }
    .issues a { display: inline-block; padding: .45rem 0; }
    .offices { list-style: none; padding: 0; margin: .4rem 0 0; display: flex; flex-wrap: wrap; gap: .45rem; }
    .offices a, .chip { display: inline-flex; align-items: center; min-height: 44px; padding: .35rem .85rem; border: 1px solid var(--line); border-radius: 999px; text-decoration: none; }
    .offices a:hover, .offices a:focus-visible, .chip:hover, .chip:focus-visible { border-color: var(--gold); }
    .pager { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin: 1rem 0 0; }
    .pager a { display: inline-flex; align-items: center; min-height: 44px; }
    .cta { border-color: var(--gold); }
    fieldset { border: 0; padding: 0; margin: .8rem 0 0; }
    legend { padding: 0; font: .9rem/1.5 ui-sans-serif, system-ui, sans-serif; color: var(--muted); }
    @media (max-width: 30rem) { .pager { flex-direction: column; align-items: flex-start; } }
  </style>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <main id="main">${body}
    ${footer}
  </main>
</body>
</html>`;
}

function renderHome(now = Date.now()) {
  const today = todayIssue(now);
  const issues = ISSUES.map(
    (i) =>
      `<li><a href="/${escapeHtml(i.slug)}/">${escapeHtml(i.title)}</a> — ${escapeHtml(i.kicker)}</li>`
  ).join("");
  const moms = MOMS.map(
    (m) => `<li><a href="/moms/${escapeHtml(m.slug)}/">${escapeHtml(m.title)}</a></li>`
  ).join("");
  return layout({
    title: "wap.mom — Wondering About Pi",
    description: "A periodical of wonder about π. Public hours for anyone. The ministry is the subscribed circle.",
    canonical: "https://wap.mom/",
    body: `<p class="kicker">Public hours</p>
<h1>Wondering About Pi.</h1>
<p>A math-themed periodical from a domestic office that still has a practice in it. For people who can hold a proof, a brand, and a household without rounding any of them.</p>
<article class="issue-card" aria-labelledby="today-issue">
  <p class="kicker">on the counter today · ${escapeHtml(today.kicker)}</p>
  <h2 id="today-issue"><a href="/${escapeHtml(today.slug)}/">${escapeHtml(today.title)}</a></h2>
  <p>${escapeHtml(today.summary)}</p>
  <p><a href="/${escapeHtml(today.slug)}/">Read it</a> · <a href="/${escapeHtml(today.slug)}/?pass=1">Pass it along</a></p>
</article>
<article>
  <h2>All public issues</h2>
  <ol class="issues">${issues}</ol>
</article>
<article>
  <h2>Kinds of mom</h2>
  <ul class="offices" aria-label="Offices">${moms}</ul>
  <p class="note"><a href="/moms/">What each office holds</a>, and how to file with one.</p>
</article>
<p>The issues above are public. <a href="/ministry">The ministry</a> is the subscribed circle — exclusive issues, longer briefs, the work that does not belong on the shop window.</p>
<article class="cta">
  <h2>File a wish</h2>
  <p>Sexy, helpful, or both. Leave a way to reach you if you want a seat.</p>
  <p><a class="chip" href="/file">File with the ministry</a></p>
</article>`,
  });
}

function renderMinistry() {
  const exclusive = MINISTRY_ISSUES.map(
    (i) =>
      `<article>
  <h2>${escapeHtml(i.title)}</h2>
  <p class="note">${escapeHtml(i.kicker)}</p>
  <p>${escapeHtml(i.summary)}</p>
  <p class="note">For the ministry. Not on public hours.</p>
</article>`
  ).join("");
  return layout({
    title: "The ministry — wap.mom",
    description: "The subscribed circle. Exclusive issues and longer briefs for people who keep a practice and a household.",
    canonical: "https://wap.mom/ministry",
    body: `<p class="kicker"><a href="/">wap.mom</a> · subscribed circle</p>
<h1>The ministry.</h1>
<p>The periodical is public. The ministry is who it is for when the work gets exclusive: longer issues, after-hours notes, a correspondence that is not a comment wall.</p>
<p>It is a small magic — a circle, not a crowd. If you keep a lane, a household, and a standard, this is the seat.</p>
${exclusive}
<p><a href="/file">File a wish</a> and leave an email if you want in. The cabinet reads. It does not publish you.</p>`,
  });
}

function renderMoms() {
  const list = MOMS.map(
    (m) =>
      `<article>
  <h2><a href="/moms/${escapeHtml(m.slug)}/">${escapeHtml(m.title)}</a></h2>
  <p>${escapeHtml(m.brief)}</p>
</article>`
  ).join("");
  return layout({
    title: "Kinds of mom — wap.mom",
    description: "Offices of the periodical. Each mom is a method.",
    canonical: "https://wap.mom/moms/",
    body: `<p class="kicker"><a href="/">wap.mom</a></p>
<h1>Several kinds of mom.</h1>
<p>Pick an office. File a wish from there if you like. The ministry still reads the ones that are not for the shop window.</p>
${list}`,
  });
}

function renderMom(mom) {
  return layout({
    title: `${mom.title} — wap.mom`,
    description: mom.brief,
    canonical: `https://wap.mom/moms/${mom.slug}/`,
    body: `<p class="kicker"><a href="/">wap.mom</a> · <a href="/moms/">moms</a></p>
<article>
  <h1>${escapeHtml(mom.title)}</h1>
  <p>${escapeHtml(mom.brief)}</p>
  <p><a href="/file?office=${escapeHtml(mom.slug)}">File a wish with this office</a></p>
</article>`,
  });
}

function renderIssue(issue, { pass = false } = {}) {
  const paras = issue.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  const canonical = `https://wap.mom/${issue.slug}/`;
  if (pass) {
    // The chrome-free copy: what you send to someone without a synopsis.
    return layout({
      title: `${issue.title} — wap.mom`,
      description: issue.summary,
      canonical,
      robots: "noindex",
      bare: true,
      body: `<p class="kicker">Wondering About Pi · public hours · ${escapeHtml(issue.kicker)}</p>
<article>
  <h1>${escapeHtml(issue.title)}</h1>
  ${paras}
</article>`,
    });
  }
  const index = ISSUES.indexOf(issue);
  const prev = index > 0 ? ISSUES[index - 1] : null;
  const next = index >= 0 && index < ISSUES.length - 1 ? ISSUES[index + 1] : null;
  const pager = `<nav class="pager" aria-label="Issues">
  ${prev ? `<a href="/${escapeHtml(prev.slug)}/" rel="prev">← ${escapeHtml(prev.title)}</a>` : "<span></span>"}
  <a href="/${escapeHtml(issue.slug)}/?pass=1">Pass this issue</a>
  ${next ? `<a href="/${escapeHtml(next.slug)}/" rel="next">${escapeHtml(next.title)} →</a>` : "<span></span>"}
</nav>`;
  return layout({
    title: `${issue.title} — wap.mom`,
    description: issue.summary,
    canonical,
    body: `<p class="kicker"><a href="/">wap.mom</a> · public hours · ${escapeHtml(issue.kicker)}</p>
<article>
  <h1>${escapeHtml(issue.title)}</h1>
  ${paras}
</article>
${pager}
<p class="note">Longer notes go to <a href="/ministry">the ministry</a>. <a href="/file">File a wish</a> if this issue raised one.</p>`,
  });
}

function renderFile(draft = emptyDraft()) {
  const office = draft.office || "";
  const serves = draft.serves || "";
  const options = MOMS.map(
    (m) =>
      `<option value="${escapeHtml(m.slug)}"${m.slug === office ? " selected" : ""}>${escapeHtml(m.title)}</option>`
  ).join("");
  const serveOptions = SERVES.map(
    (s) =>
      `<option value="${escapeHtml(s.slug)}"${s.slug === serves ? " selected" : ""}>${escapeHtml(s.title)} — ${escapeHtml(s.brief)}</option>`
  ).join("");
  const banner = draft.notice ? `<p class="note">${escapeHtml(draft.notice)}</p>` : "";
  return layout({
    title: "File a wish — wap.mom",
    description: "Describe what would be sexy or helpful. Optional email if you want a seat in the ministry.",
    canonical: "https://wap.mom/file",
    body: `<p class="kicker"><a href="/">wap.mom</a> · <a href="/ministry">ministry</a></p>
<h1>File a wish.</h1>
<p>Write it as you would brief a collaborator you trust. It can be sexy. It can be helpful. Often it is both: a body that is wanted, a household other people help carry, a practice that does not eat the people in it, a town that treats care as infrastructure.</p>
<p>Wish-fulfillment here is not a slogan. It is what would actually support holistic wellbeing — yours, the people you keep, and the wider room.</p>
${banner}
<article>
  <form method="post" action="/file">
    <label for="office">Office</label>
    <select id="office" name="office" required>
      <option value="">Choose a mom</option>
      ${options}
    </select>
    <label for="serves">Who this is for</label>
    <select id="serves" name="serves" required>
      <option value="">Choose a circle</option>
      ${serveOptions}
    </select>
    <fieldset>
      <legend>Two kinds of wish. Fill one or both.</legend>
      <label for="sexy">What would be sexy</label>
      <p class="hint" id="sexy-hint">Desire, heat, being wanted — the inner life a public hours page will not hold. Leave blank if this filing is only helpful.</p>
      <textarea id="sexy" name="sexy" maxlength="2000" aria-describedby="sexy-hint">${escapeHtml(draft.sexy || "")}</textarea>
      <label for="helpful">What would be helpful</label>
      <p class="hint" id="helpful-hint">Rest that arrives. Help that is real. A system around care, family, practice, health. Leave blank if this filing is only sexy.</p>
      <textarea id="helpful" name="helpful" maxlength="2000" aria-describedby="helpful-hint">${escapeHtml(draft.helpful || "")}</textarea>
    </fieldset>
    <label for="from">Name, if you want one on the file</label>
    <input id="from" name="from" maxlength="80" autocomplete="name" value="${escapeHtml(draft.from || "")}">
    <label for="reach">Email, if you want a seat in the ministry</label>
    <p class="hint" id="reach-hint">Optional. This is how exclusive issues find you. It is not a public list.</p>
    <input id="reach" name="reach" type="email" maxlength="120" autocomplete="email" aria-describedby="reach-hint" value="${escapeHtml(draft.reach || "")}">
    <label class="hp" for="company">Company</label>
    <input class="hp" id="company" name="company" tabindex="-1" autocomplete="off">
    <button type="submit">File with the ministry</button>
  </form>
</article>`,
  });
}

function renderFiled(id, seated) {
  const seat = seated
    ? `<p>If you left a way to reach you, that is a request for a seat. Exclusive issues go to the ministry first.</p>`
    : `<p>The periodical has it. <a href="/ministry">The ministry</a> is the subscribed circle if you want exclusive issues later.</p>`;
  return layout({
    title: "Filed — wap.mom",
    description: "The ministry has the wish.",
    canonical: "https://wap.mom/filed",
    body: `<p class="kicker"><a href="/">wap.mom</a></p>
<h1>Filed.</h1>
<p>It is in the cabinet. Reference <code>${escapeHtml(id)}</code> if you need to ask after it.</p>
${seat}
<p><a href="/${escapeHtml(todayIssue().slug)}/">Read today’s issue</a> · <a href="/file">File another</a></p>`,
  });
}

function renderCabinetLogin(notice = "") {
  const banner = notice ? `<p class="note">${escapeHtml(notice)}</p>` : "";
  return layout({
    title: "Cabinet — wap.mom",
    description: "Ministry cabinet.",
    canonical: "https://wap.mom/cabinet",
    robots: "noindex, nofollow",
    body: `<p class="kicker"><a href="/">wap.mom</a></p>
<h1>Cabinet.</h1>
<p>Wishes and ministry seats wait here. Not a public wall.</p>
${banner}
<article>
  <form method="post" action="/cabinet">
    <label for="key">Key</label>
    <input id="key" name="key" type="password" autocomplete="current-password" required>
    <button type="submit">Open</button>
  </form>
</article>`,
  });
}

function renderCabinetList(filings, status, notice = "") {
  const banner = notice ? `<p class="note">${escapeHtml(notice)}</p>` : "";
  const filters = ["open", "kept", "shelved", "all"]
    .map((s) =>
      s === status
        ? `<strong>${escapeHtml(s)}</strong>`
        : `<a href="/cabinet?status=${encodeURIComponent(s)}">${escapeHtml(s)}</a>`
    )
    .join(" · ");
  const items = filings.length
    ? filings
        .map((f) => {
          const office = momBySlug(f.office)?.title || f.office;
          const who = servesBySlug(f.serves)?.title || f.serves || "";
          const seat = f.reach ? " · seat" : "";
          return `<article>
  <h2><a href="/cabinet/${escapeHtml(f.id)}">${escapeHtml(office)}</a></h2>
  <p class="note">${escapeHtml(f.status || "open")} · ${escapeHtml(f.received || "")}${who ? ` · ${escapeHtml(who)}` : ""}${f.from ? ` · ${escapeHtml(f.from)}` : ""}${seat}</p>
  <p>${escapeHtml(filingExcerpt(f))}</p>
</article>`;
        })
        .join("")
    : `<p class="note">No filings in this drawer.</p>`;
  return layout({
    title: "Cabinet — wap.mom",
    description: "Ministry cabinet.",
    canonical: "https://wap.mom/cabinet",
    robots: "noindex, nofollow",
    body: `<p class="kicker"><a href="/">wap.mom</a></p>
<h1>Cabinet.</h1>
<p>${filters}</p>
${banner}
${items}`,
  });
}

function renderCabinetItem(filing, notice = "") {
  const office = momBySlug(filing.office)?.title || filing.office;
  const who = servesBySlug(filing.serves)?.title || filing.serves || "";
  const banner = notice ? `<p class="note">${escapeHtml(notice)}</p>` : "";
  const processed = filing.processed
    ? `<p class="note">Last: ${escapeHtml(filing.processed.action)} · ${escapeHtml(filing.processed.at)}${filing.processed.note ? ` · ${escapeHtml(filing.processed.note)}` : ""}</p>`
    : "";
  const sexy = filing.sexy
    ? `<h2>Sexy</h2><p class="wonder">${escapeHtml(filing.sexy)}</p>`
    : "";
  const helpful = filing.helpful
    ? `<h2>Helpful</h2><p class="wonder">${escapeHtml(filing.helpful)}</p>`
    : "";
  const legacy = !filing.sexy && !filing.helpful && filing.wonder
    ? `<p class="wonder">${escapeHtml(filing.wonder)}</p>`
    : "";
  const reach = filing.reach ? `<p class="note">Seat request: ${escapeHtml(filing.reach)}</p>` : "";
  return layout({
    title: `Filing ${filing.id} — wap.mom`,
    description: "A ministry filing.",
    canonical: `https://wap.mom/cabinet/${filing.id}`,
    robots: "noindex, nofollow",
    body: `<p class="kicker"><a href="/cabinet">cabinet</a></p>
${banner}
<article>
  <h1>${escapeHtml(office)}</h1>
  <p class="note">${escapeHtml(filing.status || "open")} · ${escapeHtml(filing.received || "")}${who ? ` · ${escapeHtml(who)}` : ""}${filing.from ? ` · ${escapeHtml(filing.from)}` : ""}</p>
  ${reach}
  ${sexy}
  ${helpful}
  ${legacy}
  ${processed}
  <form method="post" action="/cabinet/${escapeHtml(filing.id)}" class="actions">
    <label for="note">Note</label>
    <input id="note" name="note" maxlength="500" value="${escapeHtml(filing.processed?.note || "")}">
    <button type="submit" name="action" value="keep">Keep</button>
    <button type="submit" name="action" value="shelve">Shelve</button>
    <button type="submit" name="action" value="open">Reopen</button>
    <button type="submit" name="action" value="discard">Discard</button>
  </form>
</article>`,
  });
}

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
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function cabinetSetCookie(key) {
  return `wap_cabinet=${encodeURIComponent(key)}; Path=/cabinet; HttpOnly; Secure; SameSite=Strict; Max-Age=1209600`;
}

function fileError(draft, notice, status = 400) {
  return html(renderFile({ ...draft, notice }), status);
}

async function handleFiling(request, env) {
  const form = await request.formData();
  const draft = {
    office: clipField(form.get("office"), 40),
    from: clipField(form.get("from"), 80),
    reach: clipField(form.get("reach"), 120).toLowerCase(),
    serves: clipField(form.get("serves"), 40),
    sexy: clipField(form.get("sexy"), 2000),
    helpful: clipField(form.get("helpful"), 2000),
  };
  if (String(form.get("company") || "").trim()) {
    return Response.redirect("https://wap.mom/filed", 303);
  }
  if (!momBySlug(draft.office)) return fileError(draft, "Pick an office the periodical actually has.");
  if (!servesBySlug(draft.serves)) return fileError(draft, "Say who the wish is for.");
  if (draft.sexy && draft.sexy.length < 8) return fileError(draft, "A sexy wish has to be more than a glance.");
  if (draft.helpful && draft.helpful.length < 8) return fileError(draft, "A helpful wish has to be more than a glance.");
  if (!draft.sexy && !draft.helpful) return fileError(draft, "Write what would be sexy, or helpful, or both.");
  if (draft.reach && !looksLikeEmail(draft.reach)) return fileError(draft, "That email will not find you.");
  if (!env?.FILINGS) return fileError(draft, "The filing cabinet is closed. Try again later.", 503);
  const id = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  await env.FILINGS.put(
    `filing:${id}`,
    JSON.stringify({
      version: VERSION,
      id,
      office: draft.office,
      serves: draft.serves,
      from: draft.from || null,
      reach: draft.reach || null,
      sexy: draft.sexy || null,
      helpful: draft.helpful || null,
      ministrySeat: Boolean(draft.reach),
      status: "open",
      received: new Date().toISOString(),
    })
  );
  return Response.redirect(`https://wap.mom/filed?id=${encodeURIComponent(id)}${draft.reach ? "&seat=1" : ""}`, 303);
}

async function listFilings(env, status) {
  if (!env?.FILINGS) return [];
  const listed = await env.FILINGS.list({ prefix: "filing:", limit: 100 });
  const rows = await Promise.all(listed.keys.map((k) => env.FILINGS.get(k.name)));
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

async function handleCabinetEnter(request, env) {
  if (!env?.CABINET_KEY) return htmlPrivate(renderCabinetLogin("The lock is not cut."), 503);
  const form = await request.formData();
  const key = String(form.get("key") || "");
  if (!(await secretsEqual(key, env.CABINET_KEY))) {
    return htmlPrivate(renderCabinetLogin("That key does not open the cabinet."), 401);
  }
  return new Response(null, {
    status: 303,
    headers: {
      ...BASE_SECURITY,
      Location: "https://wap.mom/cabinet",
      "Set-Cookie": cabinetSetCookie(key),
    },
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.startsWith("www.")) {
      return Response.redirect(`https://wap.mom${url.pathname}${url.search}`, 302);
    }
    if (url.pathname === "/favicon.svg") {
      return new Response(FAVICON, {
        headers: { ...BASE_SECURITY, "Content-Type": "image/svg+xml; charset=UTF-8", "Cache-Control": "public, max-age=86400" },
      });
    }
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\nDisallow: /cabinet\n", {
        headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8" },
      });
    }
    if (url.pathname === "/now.json") {
      return jsonResponse({
        version: VERSION,
        name: "Wondering About Pi",
        periodical: "public hours",
        ministry: "subscribed circle",
        issues: ISSUES.map(({ slug, title, kicker, summary }) => ({ slug, title, kicker, summary })),
        ministryIssues: MINISTRY_ISSUES,
        moms: MOMS,
        serves: SERVES,
      });
    }
    if (url.pathname === "/file" && request.method === "POST") {
      return handleFiling(request, env);
    }
    if (url.pathname === "/file") {
      return html(renderFile({ ...emptyDraft(), office: url.searchParams.get("office") || "" }));
    }
    if (url.pathname === "/filed") {
      return html(renderFiled(url.searchParams.get("id") || "pending", url.searchParams.get("seat") === "1"));
    }
    if (url.pathname === "/ministry" || url.pathname === "/ministry/") {
      return html(renderMinistry());
    }
    if (url.pathname === "/cabinet" && request.method === "POST") {
      return handleCabinetEnter(request, env);
    }
    if (url.pathname === "/cabinet" || url.pathname === "/cabinet/") {
      if (!(await cabinetUnlocked(request, env))) return htmlPrivate(renderCabinetLogin());
      const status = url.searchParams.get("status") || "open";
      const wanted = ["open", "kept", "shelved", "all"].includes(status) ? status : "open";
      const filings = await listFilings(env, wanted);
      return htmlPrivate(renderCabinetList(filings, wanted));
    }
    const cabinetItem = url.pathname.match(/^\/cabinet\/([^/]+)\/?$/);
    if (cabinetItem) {
      if (!(await cabinetUnlocked(request, env))) return htmlPrivate(renderCabinetLogin());
      const id = decodeURIComponent(cabinetItem[1]);
      if (request.method === "POST") return handleCabinetAction(request, env, id);
      const raw = await env.FILINGS?.get(`filing:${id}`);
      if (!raw) return htmlPrivate(renderCabinetList([], "open", "That filing is gone."), 404);
      return htmlPrivate(renderCabinetItem(JSON.parse(raw)));
    }
    if (url.pathname === "/cabinet.json") {
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
    if (url.pathname === "/" || url.pathname === "") return html(renderHome());
    if (url.pathname === "/moms" || url.pathname === "/moms/") return html(renderMoms());
    const momMatch = url.pathname.match(/^\/moms\/([^/]+)\/?$/);
    if (momMatch) {
      const mom = momBySlug(momMatch[1]);
      if (mom) return html(renderMom(mom));
    }
    const slug = url.pathname.replace(/^\/+|\/+$/g, "");
    const issue = issueBySlug(slug);
    if (issue) return html(renderIssue(issue, { pass: url.searchParams.get("pass") === "1" }));
    return new Response("Not found", {
      status: 404,
      headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8" },
    });
  },
};
