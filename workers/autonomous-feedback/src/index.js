import { BASE_SECURITY, htmlResponse, jsonResponse } from "../../lib/shell.js";
import { CONTEXTS, LEGACY_SLUGS, NOTE, VERSION, cleanPath, contextBySlug, isOwnSite, normalizeHost, refererPath, validSubject } from "./model.js";
import { loadConfig, siteKinds, subjectFor } from "./config.js";
import { aboutAddress, renderCard, renderElsewhere, renderHome, renderNotFound, renderPrivacy, renderWrite } from "./pages.js";

/**
 * autonomous.feedback — a note about a page on one person's sites. A note
 * becomes a card its writer keeps: saved, copied, messaged, or posted by
 * hand. Nothing is stored, counted, or sent from here. Each site can shape
 * its form and theme with /.well-known/autonomous-feedback.json (config.js).
 */

// Every kind slug, current and legacy, for path matching.
const KIND_SLUGS = [NOTE.slug, ...CONTEXTS.map((c) => c.slug), ...Object.keys(LEGACY_SLUGS)].join("|");
const KIND_PAGE = new RegExp(`^/(${KIND_SLUGS})/?$`);

const TEXT_HEADERS = { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "no-store" };

function methodNotAllowed(allow) {
  return new Response("Method not allowed", { status: 405, headers: { ...TEXT_HEADERS, Allow: allow } });
}

function headOr(request, response) {
  return request.method === "HEAD" ? new Response(null, { status: response.status, headers: response.headers }) : response;
}

const readable = (request) => ["GET", "HEAD"].includes(request.method);

function cleanFrom(value) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/**
 * The fields of a submission as the writer left them, before anything is judged.
 * Returns { body, values } or { status, errors, values } when the body cannot be read.
 */
async function readValues(request, { host, slug }) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16_000) return { status: 413, errors: { note: "That is too long to make into a card." }, values: { host, kind: slug } };
  let body = {};
  try {
    body = Object.fromEntries((await request.formData()).entries());
  } catch {
    return { status: 400, errors: { note: "The form could not be read." }, values: { host, kind: slug } };
  }
  // The form sends one choice as "what": kind:{slug}, thread:{subject}:{id}, or thanks.
  const what = String(body.what || "").trim().toLowerCase();
  const values = {
    host,
    kind: what.startsWith("kind:") ? what.slice(5) : String(body.kind || slug),
    note: String(body.note || ""),
    from: cleanFrom(body.from),
    path: cleanPath(body.path || body.at || ""),
    subject: String(body.subject || "").trim().toLowerCase(),
    thread: what.startsWith("thread:") ? what.slice(7) : what === "thanks" ? "thanks" : String(body.thread || "").trim().toLowerCase(),
    asks: [0, 1, 2].map((i) => String(body[`ask-${i}`] || "").trim().slice(0, 2000)),
  };
  if (!values.path) values.path = refererPath(request.headers.get("referer"), host);
  return { body, values };
}

/** Read a submission. Returns { filing, config } or { errors, values, status, config, context }. */
async function readFiling(request, { host, slug }) {
  const read = await readValues(request, { host, slug });
  if (!read.body) return read;
  const { values } = read;
  const config = await loadConfig(host);
  const errors = {};
  // The subject is the site's map; the thread is one thing it hears often. Both are optional and must exist in the file.
  const subject = (config.subjects || []).find((s) => s.id === values.subject) || (values.subject ? null : subjectFor(config, values.path));
  if (values.subject && !subject) errors.subject = "Choose one of the parts of the site listed, or leave it blank.";
  const thanked = values.thread === "thanks";
  const thread = !thanked && subject && values.thread ? subject.threads.find((t) => `${subject.id}:${t.id}` === values.thread || t.id === values.thread) || null : null;
  // A common note that belongs to another part of the site was hidden when the writer changed the subject; it is dropped, not an error.
  const namespaced = values.thread.includes(":") ? values.thread.split(":")[0] : "";
  if (values.thread && !thanked && !thread && !(namespaced && subject && namespaced !== subject.id)) errors.subject = "That common note is not one this site lists.";
  if (!thread && !thanked) values.thread = "";
  // Thanks is its own type. A kind the writer names wins over a common note's kind. A kind the site does not take is an error, not a silent note.
  const allowed = siteKinds(config);
  const chosen = contextBySlug(values.kind);
  const picked = chosen && chosen.slug !== NOTE.slug ? allowed.find((c) => c.slug === chosen.slug) : null;
  const context = thanked
    ? contextBySlug("appreciation")
    : chosen && chosen.slug !== NOTE.slug
      ? picked || null
      : (thread?.kind ? contextBySlug(thread.kind) : null) || NOTE;
  if (!context) {
    errors.kind = chosen ? `${config.name || host} does not take ${chosen.title.toLowerCase()} notes. Choose another, or none.` : "That is not a kind of note.";
  }
  const asks = subject ? subject.asks.map((question, i) => ({ question, answer: values.asks[i] || "" })).filter((a) => a.answer) : [];
  let text = values.note.trim();
  const worded = Boolean(text || asks.length);
  const typed = Boolean(context && context.slug !== NOTE.slug);
  // A tap makes the line the card showed: what you saw is what the card says.
  if (!text && thanked) text = "Thanks.";
  else if (!text && thread && !asks.length) text = "Count me too.";
  else if (!text && asks.length) text = asks[0].answer;
  else if (!text && typed) text = context.tap || context.title;
  const hasType = typed || thanked || Boolean(thread) || asks.length;
  if (text.length > config.note.max) errors.note = `Keep it under ${config.note.max.toLocaleString("en-US")} characters. This note has ${text.length.toLocaleString("en-US")}.`;
  else if (!hasType && text.length < config.note.min) errors.note = text.length ? `Tap one of the choices above, or write a few more words (at least ${config.note.min} characters).` : "Tap one of the choices above, or write what happened.";
  if (config.from === "required" && !values.from) errors.from = "Add your name or handle; this site asks for one.";
  if (Object.keys(errors).length) {
    return { status: errors.kind && !contextBySlug(values.kind) ? 404 : 400, errors, values, config, context: context || NOTE };
  }
  const issued = new Date().toISOString();
  const from = config.from === "off" ? "" : values.from;
  const named = (config.routes || []).find((route) => route.path === values.path);
  const route = named?.name || "";
  const detail = asks.map((a) => `## ${a.question}\n${a.answer}`).join("\n\n");
  const markdown = [
    `# ${context.title} for ${config.name || host}`,
    `written: ${issued}`,
    "",
    text,
    detail ? `\n${detail}` : "",
    "",
    subject ? `subject: ${subject.name}` : "",
    thread ? `thread: ${thread.name}` : "",
    values.path ? `page: ${route ? `${route} ` : ""}${values.path}` : "",
    from ? `from: ${from}` : "",
    `about: https://${aboutAddress(host, values.path) || host}`,
  ].filter(Boolean).join("\n");
  const filing = {
    host, context, note: text, from, path: values.path, route, issued, markdown,
    subject: subject ? { id: subject.id, name: subject.name } : null,
    thread: thread ? { id: thread.id, name: thread.name, stance: thread.stance, link: thread.link } : null,
    thanked,
    worded,
    asks,
  };
  return { filing, config };
}

/** Answer a submission with its card, or with the form again and its errors. */
function answerFiling(result) {
  if (result.filing) return htmlResponse(renderCard(result.filing, result.config), { cache: "no-store" });
  const context = result.context || contextBySlug(result.values.kind) || NOTE;
  const html = renderWrite({ context, host: result.values.host, values: result.values, errors: result.errors, config: result.config || null });
  return htmlResponse(html, { status: result.status, cache: "no-store" });
}

/** The page a note is about: ?at= when the link names it, else the Referer when it is this site. */
function pageFrom(request, url, host) {
  const at = cleanPath(url.searchParams.get("at") || "");
  return { path: at || refererPath(request.headers.get("referer"), host) };
}

async function handleSite(request, url, host, rest) {
  const slug = rest;
  const context = slug ? contextBySlug(slug) : null;
  if (slug && !context) return htmlResponse(renderNotFound("Choose broken, confusing, missing, wrong, question, or appreciation."), { status: 404, cache: "no-store" });
  // The path names the kind by its label; old slugs move to the matching address.
  if (context && context.slug !== slug && readable(request)) {
    return Response.redirect(`${url.origin}/${host}/${context.slug}${url.search}`, 301);
  }
  if (request.method === "POST") return answerFiling(await readFiling(request, { host, slug: context ? context.slug : NOTE.slug }));
  if (!readable(request)) return methodNotAllowed("GET, HEAD, POST");
  // Words never ride in an address: a ?note= is not read.
  const config = await loadConfig(host);
  const html = renderWrite({ context: context || NOTE, host, config, values: pageFrom(request, url, host) });
  return headOr(request, htmlResponse(html, { cache: "public, max-age=120" }));
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.hostname === "www.autonomous.feedback") {
      return Response.redirect(`https://autonomous.feedback${url.pathname}${url.search}`, 302);
    }

    if (url.pathname === "/") {
      if (!readable(request)) return methodNotAllowed("GET, HEAD");
      return headOr(request, htmlResponse(renderHome(), { cache: "public, max-age=300" }));
    }

    if (url.pathname === "/privacy" || url.pathname === "/privacy/") {
      if (!readable(request)) return methodNotAllowed("GET, HEAD");
      return headOr(request, htmlResponse(renderPrivacy(), { cache: "public, max-age=300" }));
    }

    if (url.pathname === "/favicon.ico") return new Response(null, { status: 404, headers: TEXT_HEADERS });

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", { headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8" } });
    }

    if (url.pathname === "/health") {
      if (request.method === "HEAD") return new Response(null, { headers: { ...BASE_SECURITY, "Cache-Control": "no-store" } });
      return jsonResponse({ version: VERSION, ok: true, worker: "autonomous-feedback", schema: "health.v1" }, "no-store");
    }

    // An old link to a kind with ?host= goes to that site's form for the kind.
    const kindPage = url.pathname.match(KIND_PAGE);
    if (kindPage && readable(request)) {
      const host = normalizeHost(url.searchParams.get("host") || "");
      const context = contextBySlug(kindPage[1]);
      const tail = context.slug === NOTE.slug ? "" : `/${context.slug}`;
      return Response.redirect(isOwnSite(host) ? `${url.origin}/${host}${tail}` : `${url.origin}/`, 302);
    }

    const siteMatch = url.pathname.match(/^\/([^/]+)(?:\/([^/]+))?\/?$/);
    if (siteMatch) {
      const typed = decodeURIComponent(siteMatch[1]);
      const host = normalizeHost(typed);
      if (validSubject(host)) {
        if (!isOwnSite(host)) return headOr(request, htmlResponse(renderElsewhere(host), { status: 404, cache: "public, max-age=300" }));
        // One address per site: /WWW.Spwashi.com/broken → /spwashi.com/broken.
        if (host !== typed && readable(request)) {
          return Response.redirect(`${url.origin}/${host}${siteMatch[2] ? `/${siteMatch[2]}` : ""}${url.search}`, 301);
        }
        return handleSite(request, url, host, siteMatch[2] || "");
      }
    }

    return headOr(request, htmlResponse(renderNotFound(), { status: 404, cache: "no-store" }));
  },
};
