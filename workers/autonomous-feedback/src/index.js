import { BASE_SECURITY, JSON_CORS, htmlResponse, jsonResponse, wantsJson } from "../../lib/shell.js";
import { CONTEXTS, LEGACY_SLUGS, NOTE, VERSION, cleanPath, refererPath, contextBySlug, isPublicSite, normalizeHost, orgFromHostname, validSubject } from "./model.js";
import { loadConfig, siteKinds, subjectFor } from "./config.js";
import { compact, deleteNotes, deskHosts, deskState, deskSummary, digest, keepNote, listNotes, listTallies, previewCompaction, saveLimit, setSaved } from "./desk.js";
import { METER_LIMIT, SLOW_NOTE, bearerOf, cookieOf, deskAccess, intakeOpen } from "./intake.js";
import { renderCard, renderDesk, renderDeskLock, renderHome, renderInbox, renderInboxLock, renderMeter, renderNotFound, renderStart, renderWrite } from "./pages.js";

/**
 * autonomous.feedback — a feedback form for any website. A note becomes a card
 * the writer sends by hand; nothing is stored. A site can shape its form and
 * theme with /.well-known/autonomous-feedback.json (config.js). This script
 * does not serve spw.quest.
 */

const PEERS = Object.freeze([
  { role: "primary", url: "https://spwashi.com/" },
  { role: "atlas", url: "https://lore.land/" },
  { role: "table", url: "https://rpgwednesday.shop/" },
  { role: "grain", url: "https://texture.website/" },
  { role: "guide", url: "https://spwashi.com/tools/spw-parser/" },
]);

// Every kind slug, current and legacy, for path matching.
const KIND_SLUGS = [NOTE.slug, ...CONTEXTS.map((c) => c.slug), ...Object.keys(LEGACY_SLUGS)].join("|");
const KIND_JSON = new RegExp(`^/(${KIND_SLUGS})\\.json$`);
const KIND_PAGE = new RegExp(`^/(${KIND_SLUGS})/?$`);

const TEXT_HEADERS = { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "no-store" };

function methodNotAllowed(allow) {
  return new Response("Method not allowed", { status: 405, headers: { ...TEXT_HEADERS, Allow: allow } });
}

function notFound(request, message) {
  if (wantsJson(request)) return jsonResponse({ error: "not_found" }, "no-store", 404);
  return htmlResponse(renderNotFound(message), { status: 404, cache: "no-store" });
}

function headOr(request, response) {
  return request.method === "HEAD" ? new Response(null, { status: response.status, headers: response.headers }) : response;
}

function inboxContract(host, context = null, org = null, desk = "none") {
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
      stores: desk === "open",
      note: desk === "open"
        ? "POST returns a filing slip and keeps the note in this site's desk."
        : "POST returns a filing slip. The note is not stored.",
    },
    queue: {
      attached: desk === "open",
      requested: desk !== "none",
      path: `/${host}/inbox`,
      note: desk === "open"
        ? "A desk is open for this site. Reading it takes the desk token."
        : desk === "requested"
          ? "The site's client file asks for a desk. None is open yet, so nothing is kept."
          : "No desk is open. Routing names the site and does not grant a read.",
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

function embedHtml(body, subject, config, cache = "no-store", status = 200) {
  const headers = { ...BASE_SECURITY };
  delete headers["X-Frame-Options"];
  const ancestors = [frameAncestors(subject), ...(config?.frame?.ancestors || []), "'self'"].join(" ");
  headers["Content-Security-Policy"] = BASE_SECURITY["Content-Security-Policy"]
    .replace("frame-ancestors 'none'", `frame-ancestors ${ancestors}`);
  headers["Content-Type"] = "text/html; charset=UTF-8";
  headers["Cache-Control"] = cache;
  headers["Cross-Origin-Resource-Policy"] = "cross-origin";
  headers["X-Robots-Tag"] = "noindex, nofollow";
  return new Response(body, { status, headers });
}

function cleanFrom(value) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/**
 * Read a submission. Returns { filing } or { errors, values, status, code }.
 * The host and kind can come from the path (fallbacks) or the body; the body wins,
 * so one form can switch kinds without changing its action.
 */
async function readFiling(request, { host: fallbackHost = "", slug: fallbackSlug = NOTE.slug, org = null } = {}) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16_000) return { code: "too_large", status: 413, errors: { note: "That is too long to send." }, values: {} };
  const type = request.headers.get("content-type") || "";
  let body = {};
  if (type.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      return { code: "invalid_json", status: 400, errors: { note: "The request was not valid JSON." }, values: {} };
    }
    if (!body || typeof body !== "object") return { code: "invalid_json", status: 400, errors: { note: "The request was not valid JSON." }, values: {} };
  } else {
    try {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } catch {
      return { code: "invalid_form", status: 400, errors: { note: "The form could not be read." }, values: {} };
    }
  }
  const values = {
    host: normalizeHost(body.host || fallbackHost),
    kind: String(body.kind || body.context || fallbackSlug),
    note: String(body.note || ""),
    from: cleanFrom(body.from),
    path: cleanPath(body.path || body.at || ""),
    subject: String(body.subject || "").trim().toLowerCase(),
    thread: String(body.thread || "").trim().toLowerCase(),
    asks: [0, 1, 2].map((i) => String(body[`ask-${i}`] || "").trim().slice(0, 2000)),
  };
  if (!values.path) values.path = refererPath(request.headers.get("referer"), values.host);
  if (String(body.company || "").trim()) return { code: "rejected", status: 400, errors: { note: "The form could not be sent." }, values };
  if (!validSubject(values.host)) {
    return { code: "invalid_site_reference", status: 400, errors: { host: values.host ? `"${values.host}" is not a domain. Enter one like example.com.` : "Enter the site the note is about." }, values };
  }
  const config = await loadConfig(values.host);
  const errors = {};
  // The subject is the creator's map; the thread is one thing they hear often. Both are optional and must exist in the file.
  const subject = (config.subjects || []).find((s) => s.id === values.subject) || (values.subject ? null : subjectFor(config, values.path));
  if (values.subject && !subject) errors.subject = "Choose one of the parts of the site listed, or leave it blank.";
  const thanked = values.thread === "thanks";
  const thread = !thanked && subject && values.thread ? subject.threads.find((t) => `${subject.id}:${t.id}` === values.thread || t.id === values.thread) || null : null;
  if (values.thread && !thanked && !thread) errors.subject = "That common note is not one this site lists.";
  // Kind: a chip the writer chose wins; else the thread's kind; a thanks is appreciation; else the note stays unsorted.
  const allowed = siteKinds(config);
  const chosen = contextBySlug(values.kind);
  const context = chosen && chosen.slug !== NOTE.slug
    ? allowed.find((c) => c.slug === chosen.slug)
    : (thanked ? contextBySlug("appreciation") : thread?.kind ? contextBySlug(thread.kind) : null) || NOTE;
  if (!context) {
    errors.kind = chosen ? `${config.name || values.host} does not take ${chosen.title.toLowerCase()} notes. Choose another, or none.` : "That is not a kind of note.";
  }
  const asks = subject ? subject.asks.map((question, i) => ({ question, answer: values.asks[i] || "" })).filter((a) => a.answer) : [];
  let text = values.note.trim();
  // Words are optional once a common note or a thanks says enough; the count is the note.
  const worded = Boolean(text || asks.length);
  if (!text && thanked) text = "Thanks.";
  if (!text && thread && !asks.length) text = "Count me too.";
  if (!text && asks.length) text = asks[0].answer;
  const tapped = !worded && (thanked || thread);
  if (!tapped && text.length < config.note.min) errors.note = text.length ? `A few more words, please: at least ${config.note.min} characters. This note has ${text.length}.` : "Write a few words, or tap one of the common notes.";
  else if (text.length > config.note.max) errors.note = `Keep it under ${config.note.max.toLocaleString("en-US")} characters. This note has ${text.length.toLocaleString("en-US")}.`;
  if (config.from === "required" && !values.from) errors.from = "Add your name or handle; this site asks for one.";
  if (Object.keys(errors).length) {
    const code = errors.kind ? "invalid_context" : errors.subject ? "invalid_subject" : errors.note ? "note_bounds" : "from_required";
    return { code, status: errors.kind && !contextBySlug(values.kind) ? 404 : 400, errors, values, config, context: context || NOTE };
  }
  const issued = new Date().toISOString();
  const from = config.from === "off" ? "" : values.from;
  const named = (config.routes || []).find((route) => route.path === values.path);
  const route = named?.name || "";
  const detail = asks.map((a) => `## ${a.question}\n${a.answer}`).join("\n\n");
  const markdown = [
    `# ${context.title} for ${config.name || values.host}`,
    `filed: ${issued}`,
    "",
    text,
    detail ? `\n${detail}` : "",
    "",
    subject ? `subject: ${subject.name}` : "",
    thread ? `thread: ${thread.name}` : "",
    values.path ? `page: ${route ? `${route} ` : ""}${values.path}` : "",
    from ? `from: ${from}` : "",
    `about: https://${values.host}/`,
    `via: https://autonomous.feedback/${values.host}`,
    org ? `account: ${org}` : "",
  ].filter(Boolean).join("\n");
  const filing = {
    host: values.host, context, note: text, from, path: values.path, route, issued, markdown, org: org || null,
    subject: subject ? { id: subject.id, name: subject.name } : null,
    thread: thread ? { id: thread.id, name: thread.name, stance: thread.stance, link: thread.link } : null,
    thanked,
    worded,
    asks,
    // What the desk keeps: the note and the answered asks as one text.
    record: detail ? `${text}\n\n${detail}` : text,
  };
  return { filing, config };
}

async function maybeKeep(env, result) {
  // A rejected note is shown the form again, which says whether notes are kept.
  const host = result.filing?.host || result.values?.host || "";
  result.desk = result.config ? deskState(env, host, result.config) : "none";
  if (!result.filing) return result;
  if (result.desk !== "open") {
    result.filing.stored = false;
    result.filing.queue = result.desk === "requested" ? "requested" : "unattached";
    return result;
  }
  const kept = await keepNote(env.DB, result.filing);
  result.filing.stored = kept.stored;
  result.filing.queue = kept.queue;
  result.filing.id = kept.id || null;
  return result;
}

/** Answer a submission as JSON, a card page, or the form again with its errors. */
async function answerFiling(request, result, { lockHost = true, embed = false } = {}) {
  if (!result.filing) {
    if (wantsJson(request)) return jsonResponse({ error: result.code, errors: result.errors }, "no-store", result.status);
    const context = result.context || contextBySlug(result.values.kind) || NOTE;
    const html = renderWrite({
      context,
      host: result.values.host,
      lockHost: lockHost && validSubject(result.values.host || ""),
      embed,
      values: result.values,
      errors: result.errors,
      config: result.config || null,
      desk: result.desk || "none",
    });
    return embed ? embedHtml(html, result.values.host, result.config, "no-store", result.status) : htmlResponse(html, { status: result.status, cache: "no-store" });
  }
  const { filing, config } = result;
  if (wantsJson(request)) {
    return jsonResponse({
      schema: "slip.v0",
      stored: Boolean(filing.stored),
      queue: filing.queue || "unattached",
      id: filing.id || null,
      org: filing.org,
      host: filing.host,
      context: filing.context.slug,
      title: filing.context.title,
      from: filing.from || null,
      route: filing.route || null,
      path: filing.path || null,
      subject: filing.subject?.id || null,
      thread: filing.thread?.id || (filing.thanked ? "thanks" : null),
      worded: filing.worded,
      asks: filing.asks,
      expression: filing.context.expression,
      issued: filing.issued,
      markdown: filing.markdown,
    }, "no-store");
  }
  if (embed) return embedHtml(renderCard(filing, true, config), filing.host, config);
  return htmlResponse(renderCard(filing, false, config), { cache: "no-store" });
}

/** The page a note is about: ?at= when the link names it, else the Referer when it is this site. */
function pageFrom(request, url, subject) {
  const at = cleanPath(url.searchParams.get("at") || "");
  if (at) return { path: at, pathFrom: "link" };
  const referred = refererPath(request.headers.get("referer"), subject);
  return referred ? { path: referred, pathFrom: "referer" } : { path: "" };
}

/*
 * Desks. A browser opens one with a key typed into a form; the key rides in an
 * HttpOnly, SameSite=Strict cookie scoped to that inbox (or, for the operator,
 * to the whole host) and every action is a same-origin POST, because the page
 * CSP allows no fetch. Scripts and agents use Authorization: Bearer instead.
 */
const INBOX_COOKIE = "af_inbox";
const DESK_COOKIE = "af_desk";
const SEEN_COOKIE = "af_seen";
const KEY_SECONDS = 12 * 60 * 60;

function keyCookie(name, value, path) {
  const age = value ? KEY_SECONDS : 0;
  return `${name}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`;
}

function seeOther(location, cookie = "") {
  const headers = { ...BASE_SECURITY, Location: location, "Cache-Control": "no-store" };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status: 303, headers });
}

/** The strongest access any presented key grants: a bearer header, then the inbox and desk cookies. */
async function strongestAccess(request, options) {
  const presented = [bearerOf(request.headers.get("authorization")), cookieOf(request, INBOX_COOKIE), cookieOf(request, DESK_COOKIE)].filter(Boolean);
  if (!presented.length) return deskAccess("", options);
  let fallback = "wrong";
  for (const key of presented) {
    const access = await deskAccess(key, options);
    if (access === "operator" || access === "owner") return access;
    if (access === "unset") fallback = "unset";
  }
  return fallback;
}

const opened = (access) => access === "operator" || access === "owner";

async function handleInbox(request, url, subject, env) {
  const config = await loadConfig(subject);
  const desk = deskState(env, subject, config);
  const options = { operator: env.INBOX_READ_TOKEN || "", ownerHash: config.inbox?.key || "" };
  const path = `/${subject}/inbox`;
  const api = Boolean(request.headers.get("authorization")) || wantsJson(request);

  if (request.method === "POST" && !api) {
    let form;
    try {
      form = await request.formData();
    } catch {
      return htmlResponse(renderInboxLock({ host: subject, desk, error: "The form could not be read." }), { status: 400, cache: "no-store" });
    }
    const action = String(form.get("action") || "");
    if (action === "open") {
      const key = String(form.get("key") || "").trim();
      if (opened(await deskAccess(key, options))) return seeOther(`${url.origin}${path}`, keyCookie(INBOX_COOKIE, key, path));
      return htmlResponse(renderInboxLock({ host: subject, desk, error: "That key does not open this inbox." }), { status: 401, cache: "no-store" });
    }
    if (action === "close") return seeOther(`${url.origin}${path}`, keyCookie(INBOX_COOKIE, "", path));
    if (!opened(await strongestAccess(request, options))) return htmlResponse(renderInboxLock({ host: subject, desk }), { status: 401, cache: "no-store" });
    if (desk !== "open") return seeOther(`${url.origin}${path}`);
    const id = String(form.get("id") || "");
    let done = "";
    if (action === "save" || action === "release") {
      const result = await setSaved(env.DB, subject, id, action === "save", saveLimit(env));
      done = result.ok ? (action === "save" ? "saved" : "released") : result.error;
    } else if (action === "delete" && id) {
      done = (await deleteNotes(env.DB, subject, id)) ? "deleted" : "missing";
    }
    return seeOther(`${url.origin}${path}${done ? `?done=${done}` : ""}`);
  }

  if (!["GET", "HEAD", "DELETE", "POST"].includes(request.method)) return methodNotAllowed("GET, POST, DELETE");
  const access = await strongestAccess(request, options);

  if (!api && request.method !== "DELETE" && request.method !== "POST") {
    if (!opened(access)) return headOr(request, htmlResponse(renderInboxLock({ host: subject, desk }), { status: 401, cache: "no-store" }));
    if (desk !== "open") return headOr(request, htmlResponse(renderInboxLock({ host: subject, desk }), { cache: "no-store" }));
    const [notes, tallies] = await Promise.all([listNotes(env.DB, subject), listTallies(env.DB, subject)]);
    // "New since your last visit" lives in the owner's browser, not on the server.
    const seen = cookieOf(request, SEEN_COOKIE);
    const html = renderInbox({ host: subject, config, notes, summary: digest(tallies, notes), seen, limit: saveLimit(env), done: url.searchParams.get("done") || "", role: access });
    const response = htmlResponse(html, { cache: "no-store" });
    response.headers.append("Set-Cookie", `${SEEN_COOKIE}=${encodeURIComponent(new Date().toISOString())}; Path=${path}; Max-Age=${60 * 60 * 24 * 90}; HttpOnly; Secure; SameSite=Strict`);
    return headOr(request, response);
  }

  const contract = inboxContract(subject, null, null, desk);
  if (access === "locked" || access === "wrong") return jsonResponse({ error: "locked", process: contract.process }, "no-store", 401);
  // No key configured means no reader: a bound queue stays shut.
  if (access === "unset" || desk !== "open") return jsonResponse({ ...contract, error: "not_draining", filings: [] }, "no-store", 501);
  if (request.method === "DELETE") {
    const cleared = await deleteNotes(env.DB, subject, url.searchParams.get("id") || "");
    return jsonResponse({ cleared, queue: "desk" }, "no-store");
  }
  if (request.method === "POST") {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "invalid_json" }, "no-store", 400);
    }
    const result = await setSaved(env.DB, subject, String(body.id || ""), body.saved === true, saveLimit(env));
    return jsonResponse(result, "no-store", result.ok ? 200 : result.error === "limit" ? 409 : 404);
  }
  const [filings, tallies] = await Promise.all([listNotes(env.DB, subject), listTallies(env.DB, subject)]);
  return jsonResponse({ ...contract, saved_limit: saveLimit(env), filings, tallies, digest: digest(tallies, filings) }, "no-store");
}

/** The operator's view of every open desk: counts, what compaction would do next, and Compact now. */
async function handleDesk(request, url, env) {
  const options = { operator: env.INBOX_READ_TOKEN || "" };
  const api = Boolean(request.headers.get("authorization")) || wantsJson(request);
  if (request.method === "POST" && !api) {
    let form;
    try {
      form = await request.formData();
    } catch {
      return htmlResponse(renderDeskLock({ error: "The form could not be read." }), { status: 400, cache: "no-store" });
    }
    const action = String(form.get("action") || "");
    if (action === "open") {
      const key = String(form.get("key") || "").trim();
      if (await deskAccess(key, options) === "operator") return seeOther(`${url.origin}/desk`, keyCookie(DESK_COOKIE, key, "/"));
      return htmlResponse(renderDeskLock({ error: "That key does not open the desk." }), { status: 401, cache: "no-store" });
    }
    if (action === "close") return seeOther(`${url.origin}/desk`, keyCookie(DESK_COOKIE, "", "/"));
    if (await strongestAccess(request, options) !== "operator") return htmlResponse(renderDeskLock({}), { status: 401, cache: "no-store" });
    if (action === "compact") {
      const host = String(form.get("host") || "").toLowerCase();
      if (!deskHosts(env).has(host) || !env.DB) return seeOther(`${url.origin}/desk`);
      const { compacted } = await compact(env.DB, host);
      return seeOther(`${url.origin}/desk?compacted=${compacted}&host=${encodeURIComponent(host)}`);
    }
    return seeOther(`${url.origin}/desk`);
  }
  if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed("GET, HEAD, POST");
  const access = await strongestAccess(request, options);
  if (access !== "operator") {
    if (api) return jsonResponse({ error: access === "unset" ? "not_configured" : "locked" }, "no-store", access === "unset" ? 501 : 401);
    return headOr(request, htmlResponse(renderDeskLock({}), { status: 401, cache: "no-store" }));
  }
  const sites = await Promise.all([...deskHosts(env)].sort().map(async (host) => {
    const config = await loadConfig(host);
    const state = deskState(env, host, config);
    if (state !== "open") return { host, state };
    const [summary, due] = await Promise.all([deskSummary(env.DB, host), previewCompaction(env.DB, host)]);
    return { ...summary, state, due, config };
  }));
  if (api) return jsonResponse({ sites, saved_limit: saveLimit(env) }, "no-store");
  const compacted = url.searchParams.has("compacted") ? { host: url.searchParams.get("host") || "", count: Number(url.searchParams.get("compacted")) || 0 } : null;
  return headOr(request, htmlResponse(renderDesk({ sites, limit: saveLimit(env), compacted }), { cache: "no-store" }));
}

async function handleSite(request, url, host, rest, org = null, embed = false, env = {}) {
  const subject = String(host || "").toLowerCase();
  if (!validSubject(subject)) return notFound(request, "That is not a site address.");
  if (url.searchParams.has("bearer")) {
    return jsonResponse({ error: "bearer_in_query", hint: "Use Authorization: Bearer. Query strings leak." }, "no-store", 400);
  }
  if (rest === "inbox") return handleInbox(request, url, subject, env);
  if (rest === "config.json") {
    if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed("GET, HEAD");
    const config = await loadConfig(subject);
    return headOr(request, jsonResponse({ ...config, desk: deskState(env, subject, config) }, "no-store"));
  }
  const slug = rest.replace(/\.json$/, "");
  const context = slug ? contextBySlug(slug) : null;
  if (slug && !context) return notFound(request, "Choose broken, confusing, missing, wrong, question, or appreciation.");
  // The path names the kind by its label; old slugs move to the matching address.
  if (context && context.slug !== slug && ["GET", "HEAD"].includes(request.method)) {
    const suffix = rest.endsWith(".json") ? ".json" : "";
    return Response.redirect(`${url.origin}${embed ? "/embed" : ""}/${subject}/${context.slug}${suffix}${url.search}`, 301);
  }

  if (request.method === "POST") {
    if (url.searchParams.has("rate-limit")) {
      return jsonResponse({ error: "rate_limit_on_ingest", hint: "rate-limit=tok/s is a drain budget on GET /inbox, not POST." }, "no-store", 400);
    }
    if (!(await intakeOpen(request, `post:${subject}`))) {
      return answerFiling(request, {
        code: "slow_down",
        status: 429,
        errors: { note: SLOW_NOTE },
        values: { host: subject, kind: context ? context.slug : NOTE.slug, note: "", from: "" },
      }, { lockHost: true, embed });
    }
    const result = await maybeKeep(env, await readFiling(request, { host: subject, slug: context ? context.slug : NOTE.slug, org }));
    return answerFiling(request, result, { lockHost: true, embed });
  }
  if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed("GET, HEAD, POST");
  if (rest.endsWith(".json") || wantsJson(request)) {
    const config = await loadConfig(subject);
    return headOr(request, jsonResponse(inboxContract(subject, context, org, deskState(env, subject, config)), "public, max-age=120"));
  }
  const config = await loadConfig(subject);
  const html = renderWrite({
    context: context || NOTE,
    host: subject,
    lockHost: true,
    embed,
    config,
    desk: deskState(env, subject, config),
    values: pageFrom(request, url, subject),
  });
  return headOr(request, embed ? embedHtml(html, subject, config, "public, max-age=120") : htmlResponse(html, { cache: "public, max-age=120" }));
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

export default {
  async scheduled(event, env = {}, ctx = null) {
    // Unsaved cards older than three days become tallies on every tick.
    if (env.DB) {
      const work = compact(env.DB).catch(() => {});
      if (ctx?.waitUntil) ctx.waitUntil(work);
      else await work;
    }
    const cache = caches.default;
    const key = new Request("https://autonomous.feedback/climate.json", { method: "GET" });
    await cache.put(key, jsonResponse(await snapshotClimate(), "public, max-age=60"));
  },

  async fetch(request, env = {}) {
    const url = new URL(request.url);
    const started = Date.now();

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...BASE_SECURITY, ...JSON_CORS } });
    }

    if (url.hostname === "www.autonomous.feedback") {
      return Response.redirect(`https://autonomous.feedback${url.pathname}${url.search}`, 302);
    }

    const org = orgFromHostname(url.hostname);
    const queryHost = normalizeHost(url.searchParams.get("host") || "");

    if (url.pathname === "/") {
      if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed("GET, HEAD");
      return headOr(request, htmlResponse(renderHome(validSubject(queryHost) ? queryHost : ""), { cache: "no-store" }));
    }

    if (url.pathname === "/desk" || url.pathname === "/desk/") return handleDesk(request, url, env);

    if (url.pathname === "/start" || url.pathname === "/start/") {
      if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed("GET, HEAD");
      const raw = url.searchParams.get("host") || "";
      const how = url.searchParams.get("how") || "link";
      const kind = url.searchParams.get("kind") || NOTE.slug;
      if (raw && !isPublicSite(queryHost)) {
        return headOr(request, htmlResponse(renderStart({ host: raw.trim(), how, kind, error: `"${raw.trim()}" is not a public domain. Enter one like example.com.` }), { status: 400, cache: "no-store" }));
      }
      const config = queryHost ? await loadConfig(queryHost) : null;
      const desk = config ? deskState(env, queryHost, config) : "none";
      return headOr(request, htmlResponse(renderStart({ host: queryHost, how, kind, config, desk }), { cache: "no-store" }));
    }

    if (url.pathname === "/favicon.ico") return new Response(null, { status: 404, headers: TEXT_HEADERS });

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8" },
      });
    }

    if (url.pathname === "/health") {
      if (request.method === "HEAD") {
        return new Response(null, {
          headers: { ...BASE_SECURITY, ...JSON_CORS, "Cache-Control": "no-store", "Server-Timing": `health;dur=${Date.now() - started}` },
        });
      }
      return jsonResponse({ version: VERSION, ok: true, worker: "autonomous-feedback", schema: "health.v1", issued: new Date().toISOString() }, "no-store");
    }

    if (url.pathname === "/ready") {
      const climate = await snapshotClimate();
      return jsonResponse(
        { version: VERSION, ok: climate.probes.every((p) => p.class !== "hard"), schema: "ready.v1", weather: climate.weather, probes: climate.probes },
        "no-store"
      );
    }

    if (url.pathname === "/climate.json") return cachedClimate();
    if (url.pathname === "/alerts.json") return jsonResponse({ version: VERSION, schema: "alerts.v1", events: [] }, "public, max-age=60");

    if (url.pathname === "/meter" || url.pathname === "/now" || url.pathname === "/now/") {
      if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed("GET, HEAD");
      const raw = (url.searchParams.get("host") || "").trim();
      if (!raw) return headOr(request, htmlResponse(renderMeter(), { cache: "no-store" }));
      if (!isPublicSite(queryHost)) {
        if (wantsJson(request)) return jsonResponse({ error: "invalid_site_reference" }, "no-store", 400);
        return headOr(request, htmlResponse(renderMeter({ host: raw, error: `"${raw}" is not a public domain. Enter one like example.com.` }), { status: 400, cache: "no-store" }));
      }
      if (!(await intakeOpen(request, "meter", METER_LIMIT))) {
        if (wantsJson(request)) return jsonResponse({ error: "slow_down" }, "no-store", 429);
        return headOr(request, htmlResponse(renderMeter({ host: queryHost, error: "Too many checks from this network. Wait a few minutes." }), { status: 429, cache: "no-store" }));
      }
      const probe = await probeSite(queryHost);
      return headOr(request, htmlResponse(renderMeter({ host: queryHost, probe }), { cache: "no-store" }));
    }

    const kindJson = url.pathname.match(KIND_JSON);
    if (kindJson) {
      const context = contextBySlug(kindJson[1]);
      return jsonResponse(inboxContract(validSubject(queryHost) ? queryHost : "{host}", context, org), "public, max-age=120");
    }

    const kindPage = url.pathname.match(KIND_PAGE);
    if (kindPage) {
      const context = contextBySlug(kindPage[1]);
      if (context.slug !== kindPage[1] && ["GET", "HEAD"].includes(request.method)) {
        return Response.redirect(`${url.origin}/${context.slug}${url.search}`, 301);
      }
      if (request.method === "POST") {
        if (!(await intakeOpen(request, `post:${queryHost || "open"}`))) {
          return answerFiling(request, {
            code: "slow_down",
            status: 429,
            errors: { note: SLOW_NOTE },
            values: { host: queryHost, kind: context.slug, note: "", from: "" },
          }, { lockHost: false });
        }
        const result = await maybeKeep(env, await readFiling(request, { host: queryHost, slug: context.slug, org }));
        return answerFiling(request, result, { lockHost: false });
      }
      if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed("GET, HEAD, POST");
      const raw = (url.searchParams.get("host") || "").trim();
      if (raw && !validSubject(queryHost)) {
        if (wantsJson(request)) return jsonResponse({ error: "invalid_site_reference" }, "no-store", 400);
        return headOr(request, htmlResponse(renderWrite({ context, values: { host: raw }, errors: { host: `"${raw}" is not a domain. Enter one like example.com.` } }), { status: 400, cache: "no-store" }));
      }
      return headOr(request, htmlResponse(renderWrite({ context, host: queryHost }), { cache: "no-store" }));
    }

    const embedMatch = url.pathname.match(/^\/embed\/([^/]+)(?:\/([^/]+))?\/?$/);
    if (embedMatch) {
      return handleSite(request, url, decodeURIComponent(embedMatch[1]), embedMatch[2] || "", org, true, env);
    }

    const siteMatch = url.pathname.match(/^\/([^/]+)(?:\/([^/]+))?\/?$/);
    if (siteMatch) {
      const typed = decodeURIComponent(siteMatch[1]);
      const clean = normalizeHost(typed);
      if (validSubject(clean)) {
        // One address per site: /WWW.Example.com/problem → /example.com/problem.
        if (clean !== typed && ["GET", "HEAD"].includes(request.method)) {
          return Response.redirect(`${url.origin}/${clean}${siteMatch[2] ? `/${siteMatch[2]}` : ""}${url.search}`, 301);
        }
        return handleSite(request, url, clean, siteMatch[2] || "", org, false, env);
      }
    }

    return notFound(request);
  },
};
