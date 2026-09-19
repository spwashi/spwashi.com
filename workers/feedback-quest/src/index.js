/**
 * feedback-quest — autonomous.feedback (HTTP climate) and spw.quest (guide).
 * Probes public origins only. JSON is meant to be fetched by other hosts.
 */

const PEERS = Object.freeze([
  { role: "primary", url: "https://spwashi.com/" },
  { role: "atlas", url: "https://lore.land/" },
  { role: "table", url: "https://rpgwednesday.shop/" },
  { role: "grain", url: "https://texture.website/" },
  { role: "guide", url: "https://spwashi.com/tools/spw-parser/" },
]);

const QUEST = Object.freeze({
  designer: "Spwashi",
  source: "https://spwashi.com/",
  contract: "https://spwashi.com/about/domains/spw.quest/",
  parser: "https://spwashi.com/tools/spw-parser/",
  atlas: "https://spwashi.com/topics/software/spw/",
  neighbor: "https://texture.website/",
  constructs: [
    { token: "copy-unit + expression", href: "https://spwashi.com/about/domains/spw.quest/" },
    { token: "operator chips", href: "https://spwashi.com/topics/software/spw/" },
    { token: "cache | audit | align | prime | contract | archive", href: "https://spwashi.com/topics/software/spw/" },
    { token: "Sense first", href: "https://spwashi.com/tools/spw-parser/" },
  ],
  sensors: [
    "npm run sense",
    "npm run wonder",
    "npm run spw:lattice",
    "npm run check:agents",
  ],
});

const VERSION = "0.0.1";

/** Subjects that may have a /for/{host} drawer. Pages origins plus cluster.json hosts. */
const FOR_HOSTS = Object.freeze([
  "spwashi.com",
  "resume.spwashi.com",
  "lore.land",
  "texture.website",
  "attention.productions",
  "bane.land",
  "bone.land",
  "boon.land",
  "brainstorm.monster",
  "factshift.center",
  "mutex.buzz",
  "newyear.life",
  "rpgwednesday.shop",
  "spw.rest",
  "spwashi.biz",
  "spwashi.click",
  "spwashi.ink",
  "tealstripesvibes.com",
  "trope.wiki",
  "smut.today",
  "autonomous.feedback",
  "spw.quest",
  "wap.mom",
]);

const CONTEXTS = Object.freeze([
  {
    slug: "wonder",
    title: "Wonder",
    operator: "wonder",
    prompt: "The thing that would not round.",
    copy_unit: "feedback.wonder.lede",
    expression: "feedback[wonder]{gift}",
  },
  {
    slug: "review",
    title: "Review",
    operator: "action",
    prompt: "What is off. What to keep. No stars.",
    copy_unit: "feedback.review.lede",
    expression: "feedback[review]{claim}",
  },
  {
    slug: "practice",
    title: "Practice",
    operator: "concept-edge",
    prompt: "A brief about the work — the lane, not a ticket.",
    copy_unit: "feedback.practice.lede",
    expression: "feedback[practice]{brief}",
  },
  {
    slug: "brief",
    title: "Brief",
    operator: "frame",
    prompt: "One claim. Address a named handle.",
    copy_unit: "feedback.brief.lede",
    expression: "feedback[brief]{address}",
  },
]);

function contextBySlug(slug) {
  return CONTEXTS.find((c) => c.slug === slug) || null;
}

function inboxContract(host, context = null) {
  const ctx = context ? context.slug : null;
  const path = ctx ? `/for/${host}/${ctx}` : `/for/${host}`;
  return {
    version: VERSION,
    schema: "inbox.v0",
    status: "prime",
    culture: "mind",
    host,
    context: ctx,
    ingest: {
      method: "POST",
      path,
      auth: "none",
      accepting: false,
      note: "A public gift about this host. Size-capped. No token required to speak.",
    },
    process: {
      method: "GET",
      path: `/for/${host}/inbox`,
      auth: "Authorization: Bearer (ownership of a contract or key for this host)",
      accepting: false,
      budget: "rate-limit is a drain hint (tok/s of processing), not ingest QPS",
    },
    contexts: CONTEXTS.map(({ slug, title, copy_unit, expression }) => ({
      slug,
      title,
      path: `/for/${host}/${slug}`,
      copy_unit,
      expression,
    })),
    refuse: [
      "bearer in the query string",
      "mixing this inbox with climate.v1",
      "on-chain NFT verification in v0",
    ],
  };
}

function wantsJson(request) {
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) return false;
  return accept.includes("application/json");
}

async function handleFor(request, url, host, rest, climate) {
  const subject = String(host || "").toLowerCase();
  if (!FOR_HOSTS.includes(subject)) {
    return new Response("Not a cluster subject", {
      status: 404,
      headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "no-store" },
    });
  }
  if (url.searchParams.has("bearer")) {
    return jsonResponse(
      { error: "bearer_in_query", hint: "Use Authorization: Bearer. Query strings leak." },
      "no-store",
      400
    );
  }
  if (rest === "inbox") {
    const contract = inboxContract(subject);
    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "no-store" },
      });
    }
    const header = request.headers.get("authorization") || "";
    if (!header.toLowerCase().startsWith("bearer ")) {
      return jsonResponse({ error: "locked", process: contract.process }, "no-store", 401);
    }
    return jsonResponse({ ...contract, error: "not_draining", filings: [] }, "no-store", 501);
  }
  const context = rest ? contextBySlug(rest) : null;
  if (rest && !context) {
    return new Response("Not found", {
      status: 404,
      headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "no-store" },
    });
  }
  const contract = inboxContract(subject, context);
  if (request.method === "POST") {
    if (!request.bodyUsed && (request.headers.get("content-type") || "").includes("form")) {
      const form = await request.formData();
      if (String(form.get("company") || "").trim()) {
        return Response.redirect("https://autonomous.feedback/now", 303);
      }
    }
    if (url.searchParams.has("rate-limit")) {
      return jsonResponse(
        { error: "rate_limit_on_ingest", hint: "rate-limit=tok/s is a drain budget on GET /inbox, not POST." },
        "no-store",
        400
      );
    }
    if (wantsJson(request)) return jsonResponse({ ...contract, error: "not_accepting" }, "no-store", 501);
    return htmlResponse(renderNotOpen(climate, contract), { cache: "no-store", status: 501 });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "no-store" },
    });
  }
  if (!context) return jsonResponse(contract, "public, max-age=120");
  if (url.pathname.endsWith(".json") || wantsJson(request)) return jsonResponse(contract, "public, max-age=120");
  return htmlResponse(renderContext(climate, context, subject, { lockHost: true }), { cache: "public, max-age=120" });
}

const PROMPTS = Object.freeze([
  {
    id: "init-repo",
    title: "Initialize a Spw repo",
    hint: "Paste into a new empty repository.",
    body: `You are initializing a Spw-shaped project (version 0.0.1).

Public goal: a small hand-authored site that stays inspectable.

Create only:
- AGENTS.md — always-on gate. Name public nouns (.spw-frame, .spw-chip). Declare operations: cache | audit | align | prime | contract | archive. One named slice per patch. Explore/plan do not write.
- .spw/site.spw — one contract that points at conventions you actually have.
- README — how a person runs the site locally.

Working rules:
- Open first: name the file you will read before inventing a parallel rule.
- Sense first: run an instrument when the task is copy, catalog nouns, or ink. Guides without sensors are suggestions.
- Dual path: consume a pinned parser/workbench XOR experiment through HTML/CSS semantics — one path per patch.
- Creator-first copy if this is a person-site: "I build software and make art."

Do not add a framework. Do not invent a fourth copy-accessor. Do not add data-spw-wonder-type.

When you finish, report: operation, named slice, files created, sensor you would run next.`,
  },
  {
    id: "first-patch",
    title: "First patch",
    hint: "After the repo exists.",
    body: `Declare one Spw operation before editing: cache | audit | align | prime | contract | archive.

If the idea is broad, write a .spw cache and stop.
If it is an implementation, edit the smallest honest surface (route HTML, then shared CSS, then JS).

One named slice. Stop.

Open first the matching contract. Sense first if copy/nouns/ink. Do not implement from a long plan.

Report: operation, slice, files touched, how you would verify.`,
  },
  {
    id: "crawl",
    title: "Crawl spwashi.com",
    hint: "When the model is visiting the proving ground.",
    body: `#>crawl_spwashi
?[what is this site doing that I could reuse]{
  open_first = #[AGENTS.md, .spw/conventions/copy-accessor.spw, https://spw.quest/, /topics/software/spw/]
  operation = declare cache|audit|align|prime|contract|archive before editing
  sense = npm run sense
  person = I'm Spwashi. I build software and make art.
  dual_path = consume pinned workbench XOR experiment through web semantics — one path per patch
  write_deny = Explore/plan do not write. Patch is one named slice.
  braces = [mode] keeps alternatives; (scene) stages midprocess
  synthesis = If you can read X, cite a construct here. Mood is not a receipt.
}`,
  },
]);

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
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
};

const JSON_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Cross-Origin-Resource-Policy": "cross-origin",
};

function bucketMs(ms) {
  if (ms < 300) return "fast";
  if (ms < 1200) return "ok";
  return "slow";
}

function weatherFor(probes) {
  if (probes.some((p) => p.class === "hard")) return "storm";
  if (probes.some((p) => p.class === "soft" || p.ms_bucket === "slow")) return "haze";
  return "clear";
}

function climateToRpg(weather) {
  if (weather === "storm") return { climate: "analytic", omen: "pressure", clock: "tight" };
  if (weather === "haze") return { climate: "studio", omen: "fog", clock: "delay" };
  return { climate: "garden", omen: "open road", clock: "fair" };
}

async function probePeer(peer) {
  const started = Date.now();
  try {
    let response = await fetch(peer.url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(peer.url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(4000),
      });
    }
    const ms = Date.now() - started;
    const status = response.status;
    const hard = status >= 500 || status === 0;
    const ok = status >= 200 && status < 400;
    return {
      role: peer.role,
      class: hard ? "hard" : ok ? "ok" : "soft",
      ms_bucket: bucketMs(ms),
      status,
    };
  } catch {
    return { role: peer.role, class: "hard", ms_bucket: "slow", status: 0 };
  }
}

async function snapshotClimate() {
  const probes = [];
  for (const peer of PEERS) probes.push(await probePeer(peer));
  const weather = weatherFor(probes);
  return {
    version: VERSION,
    schema: "climate.v1",
    site: "autonomous.feedback",
    issued: new Date().toISOString(),
    weather,
    atmosphere: climateToRpg(weather),
    probes,
  };
}

function jsonResponse(body, cache, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...BASE_SECURITY,
      ...JSON_CORS,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": cache,
      "X-Robots-Tag": "noindex",
    },
  });
}

async function cachedClimate() {
  const cache = caches.default;
  const key = new Request("https://autonomous.feedback/climate.json", { method: "GET" });
  const hit = await cache.match(key);
  if (hit) return hit;
  const response = jsonResponse(await snapshotClimate(), "public, max-age=60");
  await cache.put(key, response.clone());
  return response;
}

function htmlResponse(body, extra = {}) {
  return new Response(body, {
    status: extra.status || 200,
    headers: {
      ...BASE_SECURITY,
      "Cross-Origin-Resource-Policy": "same-origin",
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": extra.cache || "public, max-age=120",
      "X-Robots-Tag": "noindex, nofollow",
      ...(extra.timing ? { "Server-Timing": extra.timing } : {}),
    },
  });
}

const SHELL = `
    :root { color-scheme: dark; --bg:#0a1012; --fg:#e8eef1; --muted:#8aa0a8; --line:rgba(94,234,212,.2); --accent:#5eead4; --warn:#e7c27a; --storm:#ff8a7a; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--fg); font: 1.02rem/1.55 ui-sans-serif, system-ui, sans-serif; }
    main { width: min(40rem, calc(100% - 2rem)); margin: 0 auto; padding: 2.2rem 0 4rem; }
    h1 { font-size: clamp(1.7rem, 5vw, 2.5rem); letter-spacing: -.04em; line-height: 1.05; margin: .15rem 0 .7rem; }
    h2 { font-size: 1.05rem; margin: 0 0 .6rem; }
    a { color: var(--accent); }
    .kicker, footer, .note { color: var(--muted); font-size: .9rem; }
    .weather { font-size: clamp(2.4rem, 8vw, 4rem); letter-spacing: -.05em; line-height: .95; margin: .2rem 0 .4rem; }
    .weather[data-weather="haze"] { color: var(--warn); }
    .weather[data-weather="storm"] { color: var(--storm); }
    .score { list-style: none; padding: 0; margin: 1rem 0 0; }
    .score li { display: flex; justify-content: space-between; gap: 1rem; border-top: 1px solid var(--line); padding: .55rem 0; font-variant-numeric: tabular-nums; }
    .chip { display: inline-block; margin: .15rem .35rem .15rem 0; padding: .35rem .7rem; border: 1px solid var(--line); border-radius: 999px; text-decoration: none; min-height: 44px; line-height: 1.7; }
    article { border: 1px solid var(--line); border-radius: 1.1rem; padding: 1.1rem 1.15rem; background: #10181b; margin: 1.2rem 0; }
    code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: .86em; }
    label { display: block; color: var(--muted); font-size: .88rem; margin: 0 0 .35rem; }
    textarea.prompt, textarea.note, select {
      width: 100%;
      padding: .75rem .8rem;
      border: 1px solid var(--line);
      border-radius: .8rem;
      background: #0d1416;
      color: var(--fg);
      font: inherit;
    }
    textarea.prompt {
      min-height: 14rem;
      font: .82rem/1.45 ui-monospace, SFMono-Regular, monospace;
      resize: vertical;
    }
    textarea.note { min-height: 8rem; resize: vertical; }
    .hp { position: absolute; left: -9999px; }
    button {
      appearance: none; margin-top: 1rem; min-height: 44px; padding: .55rem 1.1rem;
      border-radius: 999px; border: 1px solid var(--accent); background: transparent; color: var(--accent);
      font: inherit; cursor: pointer;
    }
    button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
    footer { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--line); }
`;

function layout({ title, description, canonical, climate, body }) {
  const weather = climate?.weather || "clear";
  const spwClimate = climate?.atmosphere?.climate || "garden";
  return `<!DOCTYPE html>
<html lang="en" data-spw-climate="${escapeHtml(spwClimate)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <style>${SHELL}</style>
</head>
<body data-spw-climate="${escapeHtml(spwClimate)}" data-weather="${escapeHtml(weather)}">
  <main>${body}
    <footer>
      <p>Spwashi. Public origins only. <a href="https://spwashi.com/">spwashi.com</a></p>
    </footer>
  </main>
</body>
</html>`;
}

function renderFeedback(climate) {
  const rows = (climate.probes || [])
    .map(
      (p) =>
        `<li><span>${escapeHtml(p.role)}</span><span>${escapeHtml(p.class)} · ${escapeHtml(p.ms_bucket)}</span></li>`
    )
    .join("");
  const issued = climate.issued ? climate.issued.replace("T", " ").replace("Z", " UTC") : "";
  return layout({
    title: "autonomous.feedback",
    description: "Public HTTP climate. A pulse other surfaces can read.",
    canonical: "https://autonomous.feedback/",
    climate,
    body: `<p class="kicker" data-spw-copy-unit="feedback.hook.kicker">autonomous.feedback · ${escapeHtml(VERSION)}</p>
<h1 data-spw-copy-unit="feedback.hook.lede" data-spw-semantic-expression="feedback[http]{climate.probe}">The pulse of the published surfaces.</h1>
<p>HEAD the origins we already show the world. No people in the log. Lore and the Wednesday table can subscribe to the weather.</p>
<article data-spw-kind="frame" data-spw-climate="${escapeHtml(climate.atmosphere?.climate || "garden")}">
  <p class="kicker">now · ${escapeHtml(issued)}</p>
  <p class="weather" data-weather="${escapeHtml(climate.weather)}">${escapeHtml(climate.weather)}</p>
  <p>${escapeHtml(climate.atmosphere?.omen || "")} · clock ${escapeHtml(climate.atmosphere?.clock || "")}</p>
  <ul class="score">${rows}</ul>
</article>
<p>
  <a class="chip" data-spw-operator="wonder" href="/now">now</a>
  <a class="chip" data-spw-operator="wonder" href="/wonder">wonder</a>
  <a class="chip" data-spw-operator="action" href="/review">review</a>
  <a class="chip" data-spw-operator="concept-edge" href="/practice">practice</a>
  <a class="chip" data-spw-operator="frame" href="/brief">brief</a>
  <a class="chip" data-spw-operator="potential" href="/for/spwashi.com">for/spwashi.com</a>
  <a class="chip" data-spw-operator="potential" href="/climate.json">climate.v1</a>
  <a class="chip" data-spw-operator="probe" href="/ready">ready</a>
  <a class="chip" data-spw-operator="probe" href="/health">health</a>
  <a class="chip" data-spw-operator="potential" href="/alerts.json">alerts</a>
</p>`,
  });
}

function hostOptions(selected) {
  return FOR_HOSTS.map(
    (h) =>
      `<option value="${escapeHtml(h)}"${h === selected ? " selected" : ""}>${escapeHtml(h)}</option>`
  ).join("");
}

function contextNav() {
  return CONTEXTS.map(
    (c) =>
      `<a class="chip" data-spw-operator="${escapeHtml(c.operator)}" href="/${escapeHtml(c.slug)}">${escapeHtml(c.slug)}</a>`
  ).join(" ");
}

function renderNow(climate) {
  const issued = climate.issued ? climate.issued.replace("T", " ").replace("Z", " UTC") : "";
  return layout({
    title: "now — autonomous.feedback",
    description: "What the cluster feels like. Climate, then a door into a note.",
    canonical: "https://autonomous.feedback/now",
    climate,
    body: `<p class="kicker"><a href="/">autonomous.feedback</a> · now</p>
<h1 data-spw-copy-unit="feedback.now.lede" data-spw-semantic-expression="feedback[now]{climate}">What the cluster feels like.</h1>
<article data-spw-kind="frame">
  <p class="kicker">${escapeHtml(issued)}</p>
  <p class="weather" data-weather="${escapeHtml(climate.weather || "clear")}">${escapeHtml(climate.weather || "clear")}</p>
  <p>${escapeHtml(climate.atmosphere?.omen || "")} · ${escapeHtml(climate.atmosphere?.clock || "")}</p>
</article>
<p>Leave a note in a mind-culture register.</p>
<p>${contextNav()}</p>`,
  });
}

function renderContext(climate, context, host = "spwashi.com", { lockHost = false } = {}) {
  const action = lockHost
    ? `/for/${encodeURIComponent(host)}/${encodeURIComponent(context.slug)}`
    : `/${encodeURIComponent(context.slug)}`;
  const about = lockHost
    ? `<p class="note">About <code>${escapeHtml(host)}</code></p><input type="hidden" name="host" value="${escapeHtml(host)}">`
    : `<label for="host">About</label><select id="host" name="host">${hostOptions(host)}</select>`;
  const canonical = lockHost
    ? `https://autonomous.feedback/for/${encodeURIComponent(host)}/${encodeURIComponent(context.slug)}`
    : `https://autonomous.feedback/${context.slug}`;
  return layout({
    title: `${context.title} — autonomous.feedback`,
    description: context.prompt,
    canonical,
    climate,
    body: `<p class="kicker"><a href="/">autonomous.feedback</a> · <a href="/now">now</a></p>
<h1 data-spw-copy-unit="${escapeHtml(context.copy_unit)}" data-spw-semantic-expression="${escapeHtml(context.expression)}">${escapeHtml(context.title)}.</h1>
<p>${escapeHtml(context.prompt)}</p>
<article data-spw-kind="frame">
  <form method="post" action="${escapeHtml(action)}">
    ${about}
    <label for="note">${escapeHtml(context.title)}</label>
    <textarea class="note" id="note" name="note" required minlength="8" maxlength="2000"></textarea>
    <label class="hp" for="company">Company</label>
    <input class="hp" id="company" name="company" tabindex="-1" autocomplete="off">
    <button type="submit">File the note</button>
  </form>
  <p class="note">The drawer is still priming. The form is the path; storage opens next.</p>
</article>
<p>${contextNav()}</p>`,
  });
}

function renderNotOpen(climate, contract) {
  return layout({
    title: "Drawer not open — autonomous.feedback",
    description: "The path is real. The cabinet is not receiving yet.",
    canonical: `https://autonomous.feedback${contract.ingest.path}`,
    climate,
    body: `<p class="kicker"><a href="/">autonomous.feedback</a></p>
<h1>The drawer is not open yet.</h1>
<p>This path will take a note about <code>${escapeHtml(contract.host)}</code>${contract.context ? ` in <code>${escapeHtml(contract.context)}</code>` : ""}. It is not storing yet. Climate is still the pulse.</p>
<p>${contextNav()}</p>`,
  });
}

function renderPrompt(prompt) {
  return `<article>
  <h2>${escapeHtml(prompt.title)}</h2>
  <p class="note">${escapeHtml(prompt.hint)}</p>
  <label for="prompt-${escapeHtml(prompt.id)}">Select all, copy, paste into a model.</label>
  <textarea class="prompt" id="prompt-${escapeHtml(prompt.id)}" readonly spellcheck="false">${escapeHtml(prompt.body.trim())}</textarea>
</article>`;
}

function renderQuest(climate) {
  const constructs = QUEST.constructs
    .map(
      (c) =>
        `<li><a href="${escapeHtml(c.href)}"><code>${escapeHtml(c.token)}</code></a></li>`
    )
    .join("");
  const prompts = PROMPTS.map(renderPrompt).join("");
  return layout({
    title: "spw.quest",
    description: "Initialize a Spw repo. Copy a prompt, paste it into a language model.",
    canonical: "https://spw.quest/",
    climate,
    body: `<p class="kicker" data-spw-copy-unit="quest.hook.kicker">spw.quest · ${escapeHtml(VERSION)}</p>
<h1 data-spw-copy-unit="quest.hook.lede" data-spw-semantic-expression="quest[spw]{pace.guide}">Hand a model a door, not a dump.</h1>
<p>Live specimens stay on <a href="${escapeHtml(QUEST.source)}">spwashi.com</a>. Copy a prompt below to start a Spw-shaped repo.</p>
<article>
  <p class="kicker">path weather</p>
  <p class="weather" data-weather="${escapeHtml(climate.weather || "clear")}">${escapeHtml(climate.weather || "clear")}</p>
  <p>${escapeHtml(climate.atmosphere?.omen || "open road")}</p>
</article>
${prompts}
<article>
  <h2>Constructs</h2>
  <ul>${constructs}</ul>
</article>
<p>
  <a class="chip" data-spw-operator="integration" href="${escapeHtml(QUEST.parser)}">parser</a>
  <a class="chip" data-spw-operator="address" href="${escapeHtml(QUEST.atlas)}">atlas</a>
  <a class="chip" data-spw-operator="potential" href="/prompts.json">prompts.json</a>
  <a class="chip" data-spw-operator="potential" href="/quest.json">quest.json</a>
</p>`,
  });
}

export default {
  async scheduled() {
    const cache = caches.default;
    const key = new Request("https://autonomous.feedback/climate.json", { method: "GET" });
    await cache.put(key, jsonResponse(await snapshotClimate(), "public, max-age=60"));
  },

  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname.replace(/^www\./, "");
    const started = Date.now();

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...BASE_SECURITY, ...JSON_CORS } });
    }

    if (url.hostname.startsWith("www.")) {
      const apex = host === "spw.quest" ? "https://spw.quest" : "https://autonomous.feedback";
      return Response.redirect(`${apex}${url.pathname}${url.search}`, 302);
    }

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8" },
      });
    }

    if (url.pathname === "/health") {
      if (request.method === "HEAD") {
        return new Response(null, {
          headers: {
            ...BASE_SECURITY,
            ...JSON_CORS,
            "Cache-Control": "no-store",
            "Server-Timing": `health;dur=${Date.now() - started}`,
          },
        });
      }
      return jsonResponse(
        { version: VERSION, ok: true, worker: "feedback-quest", schema: "health.v1", issued: new Date().toISOString() },
        "no-store"
      );
    }

    if (url.pathname === "/ready") {
      const climate = await snapshotClimate();
      return jsonResponse(
        { version: VERSION, ok: climate.probes.every((p) => p.class !== "hard"), schema: "ready.v1", weather: climate.weather, probes: climate.probes },
        "no-store"
      );
    }

    if (url.pathname === "/climate.json") return cachedClimate();

    const climateForPages = async () => (await cachedClimate()).clone().json();

    if (url.pathname === "/now" || url.pathname === "/now/") {
      return htmlResponse(renderNow(await climateForPages()), { cache: "no-store" });
    }

    const contextJson = url.pathname.match(/^\/(wonder|review|practice|brief)\.json$/);
    if (contextJson) {
      const context = contextBySlug(contextJson[1]);
      return jsonResponse(inboxContract("spwashi.com", context), "public, max-age=120");
    }

    const contextPage = url.pathname.match(/^\/(wonder|review|practice|brief)\/?$/);
    if (contextPage) {
      const context = contextBySlug(contextPage[1]);
      let host = url.searchParams.get("host") || "spwashi.com";
      if (request.method === "POST") {
        const form = await request.formData();
        if (String(form.get("company") || "").trim()) {
          return Response.redirect("https://autonomous.feedback/now", 303);
        }
        host = String(form.get("host") || host).toLowerCase();
      }
      if (!FOR_HOSTS.includes(host)) host = "spwashi.com";
      if (request.method === "POST") {
        return handleFor(request, url, host, context.slug, await climateForPages());
      }
      return htmlResponse(renderContext(await climateForPages(), context, host));
    }

    const forMatch = url.pathname.match(/^\/for\/([^/]+)(?:\/([^/]+))?\/?$/);
    if (forMatch) {
      return handleFor(request, url, forMatch[1], forMatch[2] || "", await climateForPages());
    }

    if (url.pathname === "/alerts.json") {
      return jsonResponse({ version: VERSION, schema: "alerts.v1", events: [] }, "public, max-age=60");
    }

    if (url.pathname === "/prompts.json") {
      return jsonResponse({ version: VERSION, schema: "prompts.v1", prompts: PROMPTS }, "public, max-age=300");
    }

    if (url.pathname === "/quest.json") {
      const climate = await (await cachedClimate()).clone().json();
      return jsonResponse({
        version: VERSION,
        schema: "quest.v1",
        ...QUEST,
        prompts: PROMPTS,
        weather: climate.weather,
        atmosphere: climate.atmosphere,
      }, "public, max-age=120");
    }

    if (url.pathname !== "/" && url.pathname !== "") {
      return new Response("Not found", {
        status: 404,
        headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "no-store" },
      });
    }

    const climate = await (await cachedClimate()).clone().json();
    const timing = `app;dur=${Date.now() - started}`;
    if (host === "spw.quest") return htmlResponse(renderQuest(climate), { timing });
    if (request.method === "HEAD") {
      return new Response(null, {
        headers: { ...BASE_SECURITY, "Cache-Control": "no-store", "Server-Timing": timing },
      });
    }
    return htmlResponse(renderFeedback(climate), { cache: "no-store", timing });
  },
};
