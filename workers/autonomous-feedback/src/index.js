import { BASE_SECURITY, JSON_CORS, escapeHtml, htmlResponse, jsonResponse, layout, wantsJson } from "../../lib/shell.js";

/**
 * autonomous.feedback — meter and a form for one site.
 * A queue can drain filings later. This script does not serve spw.quest.
 */

const PEERS = Object.freeze([
  { role: "primary", url: "https://spwashi.com/" },
  { role: "atlas", url: "https://lore.land/" },
  { role: "table", url: "https://rpgwednesday.shop/" },
  { role: "grain", url: "https://texture.website/" },
  { role: "guide", url: "https://spwashi.com/tools/spw-parser/" },
]);

const VERSION = "0.1.0";

// A reference selects a namespace, never permission or an origin to fetch.
function validSubject(value) {
  return value.length <= 253 && value.includes(".") && value.split(".").every(
    (label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
  );
}

function isPublicSite(value) {
  if (!validSubject(value)) return false;
  const labels = value.split(".");
  if (labels.every((label) => /^\d+$/.test(label))) return false;
  const last = labels[labels.length - 1];
  return !["local", "localhost", "internal", "intranet"].includes(last);
}

function orgFromHostname(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  if (host === "autonomous.feedback" || host === "www.autonomous.feedback") return null;
  const suffix = ".autonomous.feedback";
  if (!host.endsWith(suffix)) return null;
  const label = host.slice(0, -suffix.length);
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) return null;
  return label;
}

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

function inboxContract(host, context = null, org = null) {
  const ctx = context ? context.slug : null;
  const path = ctx ? `/${host}/${ctx}` : `/${host}`;
  return {
    version: VERSION,
    schema: "inbox.v0",
    status: "prime",
    routing: "The site reference selects a namespace; it does not grant access.",
    identity: { verified: false, permissions: [], status: "not_configured" },
    host,
    org: org || null,
    context: ctx,
    ingest: {
      method: "POST",
      path,
      auth: "none",
      accepting: true,
      stores: false,
      note: "POST returns a filing slip. The note is not stored. A queue can drain later filings for this site.",
    },
    queue: {
      attached: false,
      path: `/${host}/inbox`,
      note: "No drain is attached. Routing names the site and does not grant a read.",
    },
    process: {
      method: "GET",
      path: `/${host}/inbox`,
      auth: "Authorization: Bearer (ownership of a contract or key for this host)",
      accepting: false,
      budget: "rate-limit is a drain hint (tok/s of processing), not ingest QPS",
    },
    contexts: CONTEXTS.map(({ slug, title, copy_unit, expression }) => ({
      slug,
      title,
      path: `/${host}/${slug}`,
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

async function handleFor(request, url, host, rest, org = null, embed = false) {
  const subject = String(host || "").toLowerCase();
  if (!validSubject(subject)) {
    return new Response("Invalid site reference", {
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
  const contract = inboxContract(subject, context, org);
  if (request.method === "POST") {
    if (url.searchParams.has("rate-limit")) {
      return jsonResponse(
        { error: "rate_limit_on_ingest", hint: "rate-limit=tok/s is a drain budget on GET /inbox, not POST." },
        "no-store",
        400
      );
    }
    const filing = await readFiling(request, subject, context ? context.slug : "review", org);
    return filingResponse(request, filing);
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "no-store" },
    });
  }
  if (!context) {
    if (wantsJson(request)) return jsonResponse(contract, "public, max-age=120");
    const html = renderContext(null, contextBySlug("review"), subject, { lockHost: true, embed });
    return embed ? embedHtml(html, subject) : htmlResponse(html, { cache: "no-store" });
  }
  if (url.pathname.endsWith(".json") || wantsJson(request)) return jsonResponse(contract, "public, max-age=120");
  const html = renderContext(null, context, subject, { lockHost: true, embed });
  return embed ? embedHtml(html, subject, "public, max-age=120") : htmlResponse(html, { cache: "public, max-age=120" });
}

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

async function probeSite(host) {
  const started = Date.now();
  try {
    const response = await fetch(`https://${host}/`, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
    });
    const ms = Date.now() - started;
    const status = response.status;
    const hard = status >= 500 || status === 0;
    const ok = (status >= 200 && status < 400) || (status >= 300 && status < 400);
    return { host, class: hard ? "down" : ok ? "up" : "up", ms_bucket: bucketMs(ms), status };
  } catch {
    return { host, class: "down", ms_bucket: "slow", status: 0 };
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

async function cachedClimate() {
  const cache = caches.default;
  const key = new Request("https://autonomous.feedback/climate.json", { method: "GET" });
  const hit = await cache.match(key);
  if (hit) return hit;
  const response = jsonResponse(await snapshotClimate(), "public, max-age=60");
  await cache.put(key, response.clone());
  return response;
}

const OWN_SITES = Object.freeze([
  "spwashi.com", "resume.spwashi.com", "lore.land", "texture.website", "attention.productions",
  "bane.land", "bone.land", "boon.land", "brainstorm.monster", "factshift.center", "mutex.buzz",
  "newyear.life", "rpgwednesday.shop", "spw.rest", "spwashi.biz", "spwashi.click", "spwashi.ink",
  "tealstripesvibes.com", "trope.wiki", "smut.today", "wap.mom", "spw.quest",
]);

function frameAncestors(subject) {
  const origins = new Set([`https://${subject}`, `https://www.${subject}`]);
  for (const site of OWN_SITES) origins.add(`https://${site}`);
  return [...origins].join(" ");
}

function embedHtml(body, subject, cache = "no-store") {
  const headers = { ...BASE_SECURITY };
  delete headers["X-Frame-Options"];
  headers["Content-Security-Policy"] = BASE_SECURITY["Content-Security-Policy"]
    .replace("frame-ancestors 'none'", `frame-ancestors ${frameAncestors(subject)}`);
  headers["Content-Type"] = "text/html; charset=UTF-8";
  headers["Cache-Control"] = cache;
  headers["Cross-Origin-Resource-Policy"] = "cross-origin";
  headers["X-Robots-Tag"] = "noindex, nofollow";
  return new Response(body, { headers });
}

function formSnippet(host = "example.com") {
  return `<form method="post" action="https://autonomous.feedback/${host}/review">
  <textarea name="note" minlength="8" maxlength="2000" required></textarea>
  <button>Send</button>
</form>`;
}

function frameSnippet(host = "example.com") {
  return `<iframe title="Feedback" src="https://autonomous.feedback/embed/${host}" width="100%" height="520" style="border:0"></iframe>`;
}

function renderFeedback() {
  return layout({
    title: "autonomous.feedback",
    description: "A health check and a feedback form for one site.",
    canonical: "https://autonomous.feedback/",
    quiet: true,
    body: `<p class="kicker">autonomous.feedback</p>
<h1>A form for one site.</h1>
<p>Check whether it answers. Put a form on the site so notes come here. A queue can drain them later.</p>
<form method="get" action="/meter">
  <label for="host">Site</label>
  <input id="host" name="host" type="text" inputmode="url" placeholder="example.com" required maxlength="253" autocapitalize="none" spellcheck="false" enterkeyhint="go">
  <p class="actions">
    <button type="submit">Check</button>
    <button type="submit" formaction="/review">Write a note</button>
  </p>
</form>
<figure class="codeblock">
  <figcaption><span>iframe</span><button type="button" data-copy="frame-snippet">Copy</button></figcaption>
  <pre id="frame-snippet">${escapeHtml(frameSnippet())}</pre>
</figure>
<figure class="codeblock">
  <figcaption><span>form</span><button type="button" data-copy="form-snippet">Copy</button></figcaption>
  <pre id="form-snippet">${escapeHtml(formSnippet())}</pre>
</figure>`,
  });
}

function contextNav(host = "", embed = false) {
  return CONTEXTS.map((c) => {
    const href = host
      ? `${embed ? "/embed" : ""}/${encodeURIComponent(host)}/${escapeHtml(c.slug)}`
      : `/${escapeHtml(c.slug)}`;
    return `<a class="chip" data-spw-operator="${escapeHtml(c.operator)}" href="${href}">${escapeHtml(c.slug)}</a>`;
  }).join(" ");
}

function renderMeter(host = "", probe = null) {
  const reading = !probe
    ? ""
    : probe.class === "down"
      ? "Down"
      : probe.ms_bucket === "slow"
        ? "Slow"
        : "Answers";
  return layout({
    title: host ? `${host} — meter` : "Meter — autonomous.feedback",
    description: "Whether one site answers.",
    canonical: "https://autonomous.feedback/meter",
    quiet: true,
    body: `<p class="kicker"><a href="/">autonomous.feedback</a></p>
<h1>${host ? escapeHtml(host) : "Meter"}</h1>
${reading ? `<p class="weather">${escapeHtml(reading)}</p><p class="note">${escapeHtml(probe.ms_bucket)} · HTTP ${escapeHtml(String(probe.status))}</p>` : "<p>Name a public site. The meter asks it once and reports whether it answers.</p>"}
<form method="get" action="/meter">
  <label for="host">Site</label>
  <input id="host" name="host" value="${escapeHtml(host)}" placeholder="example.com" required maxlength="253" autocapitalize="none" spellcheck="false">
  <button type="submit">Check</button>
  <button type="submit" formaction="/review">Write a note</button>
</form>`,
  });
}

function renderContext(climate, context, host = "", { lockHost = false, embed = false } = {}) {
  const root = embed ? "/embed" : "";
  const action = lockHost
    ? `${root}/${encodeURIComponent(host)}/${encodeURIComponent(context.slug)}`
    : `/${encodeURIComponent(context.slug)}`;
  const about = lockHost
    ? `<p class="note">${escapeHtml(host)}</p><input type="hidden" name="host" value="${escapeHtml(host)}">`
    : `<label for="host">Site</label><input id="host" name="host" value="${escapeHtml(host)}" placeholder="example.com" required maxlength="253" autocapitalize="none" spellcheck="false" inputmode="url">`;
  const canonical = lockHost
    ? `https://autonomous.feedback${root}/${encodeURIComponent(host)}/${encodeURIComponent(context.slug)}`
    : `https://autonomous.feedback/${context.slug}`;
  return layout({
    title: `${context.title} — autonomous.feedback`,
    description: context.prompt,
    canonical,
    climate,
    quiet: true,
    embed,
    body: `${embed ? "" : `<p class="kicker"><a href="/">autonomous.feedback</a></p>`}
<h1 data-spw-copy-unit="${escapeHtml(context.copy_unit)}" data-spw-semantic-expression="${escapeHtml(context.expression)}">${escapeHtml(context.title)}</h1>
${embed ? "" : `<p>${escapeHtml(context.prompt)}</p>`}
<article data-spw-kind="frame">
  <form method="post" action="${escapeHtml(action)}">
    ${about}
    <label for="note">${escapeHtml(context.title)}</label>
    <textarea class="note" id="note" name="note" required minlength="8" maxlength="2000" enterkeyhint="send"></textarea>
    <label class="hp" for="company">Company</label>
    <input class="hp" id="company" name="company" tabindex="-1" autocomplete="off">
    <button type="submit">Send</button>
  </form>
</article>
<p>${contextNav(host, embed)}</p>`,
  });
}

function renderSlip(filing, embed = false) {
  const root = embed ? "/embed" : "";
  const back = `${root}/${encodeURIComponent(filing.host)}/${encodeURIComponent(filing.context.slug)}`;
  return layout({
    title: `${filing.context.title} slip — autonomous.feedback`,
    description: `A filing slip about ${filing.host}.`,
    canonical: `https://autonomous.feedback${back}`,
    quiet: true,
    embed,
    body: `${embed ? "" : `<p class="kicker"><a href="${escapeHtml(back)}">another note</a></p>`}
<h1>Slip</h1>
<p class="note">${escapeHtml(filing.host)}</p>
<figure class="codeblock">
  <figcaption><span>${escapeHtml(filing.issued)}</span><button type="button" data-copy="slip">Copy</button></figcaption>
  <pre id="slip">${escapeHtml(filing.markdown)}</pre>
</figure>`,
  });
}

const NOTE_MIN = 8;
const NOTE_MAX = 2000;

async function readFiling(request, fallbackHost = "", fallbackSlug = "", org = null) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16_000) return { error: "too_large", status: 413 };
  const type = request.headers.get("content-type") || "";
  let host = fallbackHost;
  let slug = fallbackSlug;
  let note = "";
  let company = "";
  if (type.includes("application/json")) {
    let body;
    try {
      body = await request.json();
    } catch {
      return { error: "invalid_json", status: 400 };
    }
    if (!body || typeof body !== "object") return { error: "invalid_json", status: 400 };
    if (body.host) host = String(body.host);
    if (body.context) slug = String(body.context);
    note = String(body.note || "");
    company = String(body.company || "");
  } else {
    const form = await request.formData();
    host = String(form.get("host") || host);
    note = String(form.get("note") || "");
    company = String(form.get("company") || "");
  }
  if (company.trim()) return { error: "rejected", status: 400 };
  host = host.toLowerCase().trim();
  if (!validSubject(host)) return { error: "invalid_site_reference", status: 400 };
  const context = contextBySlug(slug);
  if (!context) return { error: "invalid_context", status: 404 };
  const text = note.trim();
  if (text.length < NOTE_MIN || text.length > NOTE_MAX) return { error: "note_bounds", status: 400 };
  const issued = new Date().toISOString();
  const markdown = [
    `# ${context.title} · ${host}`,
    `filed: ${issued}`,
    "",
    text,
    "",
    `expression: ${context.expression}`,
    `about: https://${host}/`,
    org ? `account: ${org}` : "",
  ].filter(Boolean).join("\n");
  return { host, context, note: text, issued, markdown, org: org || null, status: 200 };
}

function filingResponse(request, filing) {
  if (filing.error) {
    return jsonResponse({ error: filing.error }, "no-store", filing.status);
  }
  const payload = {
    schema: "slip.v0",
    stored: false,
    queue: "unattached",
    org: filing.org,
    host: filing.host,
    context: filing.context.slug,
    expression: filing.context.expression,
    issued: filing.issued,
    markdown: filing.markdown,
  };
  if (wantsJson(request)) return jsonResponse(payload, "no-store");
  const embed = new URL(request.url).pathname.startsWith("/embed/");
  if (embed) return embedHtml(renderSlip(filing, true), filing.host);
  return htmlResponse(renderSlip(filing), { cache: "no-store" });
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

    if (url.hostname === "www.autonomous.feedback") {
      return Response.redirect(`https://autonomous.feedback${url.pathname}${url.search}`, 302);
    }

    const org = orgFromHostname(url.hostname);
    if (url.pathname === "/" && ["GET", "HEAD"].includes(request.method)) {
      const response = htmlResponse(renderFeedback(), { cache: "no-store" });
      return request.method === "HEAD" ? new Response(null, { headers: response.headers }) : response;
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
        { version: VERSION, ok: true, worker: "autonomous-feedback", schema: "health.v1", issued: new Date().toISOString() },
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

    if (url.pathname === "/meter" || url.pathname === "/now" || url.pathname === "/now/") {
      if (!["GET", "HEAD"].includes(request.method)) {
        return new Response("Method not allowed", { status: 405, headers: { ...BASE_SECURITY, Allow: "GET, HEAD" } });
      }
      const subject = (url.searchParams.get("host") || "").toLowerCase().trim();
      if (!subject) {
        const response = htmlResponse(renderMeter(), { cache: "no-store" });
        return request.method === "HEAD" ? new Response(null, { headers: response.headers }) : response;
      }
      if (!isPublicSite(subject)) return jsonResponse({ error: "invalid_site_reference" }, "no-store", 400);
      const probe = await probeSite(subject);
      const response = htmlResponse(renderMeter(subject, probe), { cache: "no-store" });
      return request.method === "HEAD" ? new Response(null, { headers: response.headers }) : response;
    }

    const contextJson = url.pathname.match(/^\/(wonder|review|practice|brief)\.json$/);
    if (contextJson) {
      const context = contextBySlug(contextJson[1]);
      const named = url.searchParams.get("host") || "";
      return jsonResponse(inboxContract(validSubject(named) ? named : "{host}", context, org), "public, max-age=120");
    }

    const contextPage = url.pathname.match(/^\/(wonder|review|practice|brief)\/?$/);
    if (contextPage) {
      const context = contextBySlug(contextPage[1]);
      const host = (url.searchParams.get("host") || "").toLowerCase();
      if (request.method === "POST") {
        const filing = await readFiling(request, host, context.slug, org);
        return filingResponse(request, filing);
      }
      if (!["GET", "HEAD"].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { ...BASE_SECURITY, Allow: "GET, HEAD, POST" } });
      if (host && !validSubject(host)) return jsonResponse({ error: "invalid_site_reference" }, "no-store", 400);
      return htmlResponse(renderContext({}, context, host));
    }

    const legacy = url.pathname.match(/^\/for\/([^/]+)(?:\/([^/]+))?\/?$/);
    if (legacy) {
      const dest = `/${legacy[1]}${legacy[2] ? `/${legacy[2]}` : ""}`;
      return Response.redirect(`${url.origin}${dest}${url.search}`, 302);
    }

    const embedMatch = url.pathname.match(/^\/embed\/([^/]+)(?:\/([^/]+))?\/?$/);
    if (embedMatch) {
      return handleFor(request, url, decodeURIComponent(embedMatch[1]), embedMatch[2] || "", org, true);
    }

    const siteMatch = url.pathname.match(/^\/([^/]+)(?:\/([^/]+))?\/?$/);
    if (siteMatch && validSubject(decodeURIComponent(siteMatch[1]).toLowerCase())) {
      return handleFor(request, url, decodeURIComponent(siteMatch[1]), siteMatch[2] || "", org, false);
    }

    if (url.pathname === "/alerts.json") {
      return jsonResponse({ version: VERSION, schema: "alerts.v1", events: [] }, "public, max-age=60");
    }

    return new Response("Not found", { status: 404, headers: { ...BASE_SECURITY, "Cache-Control": "no-store" } });
  },
};
