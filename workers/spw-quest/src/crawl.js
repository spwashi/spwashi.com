// What spw.quest tells crawlers, and which of its files skip the worker.
//
// A file answers what never changes per request: it is served at the edge
// without running code, so it is faster, caches cleanly, and keeps answering
// when a script cannot. The creator, 2026-11-08: "I'm not very opposed to
// crawlers if there's a significant payload benefit". So:
// - Static files (faces, peer scripts, icons, the shell script, the parser's
//   dated files and its index) are served by the assets layer, which does not
//   run the worker; wrangler.jsonc routes them there with negative patterns,
//   and assets/_headers gives them the headers the worker used to.
// - Crawlers keep to the rooms (2026-11-17). Each room is in the sitemap and
//   asks to be indexed. The views a query or a line opens are endless (one
//   /specimens offers 572 links into /specimens?, /build?, /pivot? and
//   /canvas?, and each of those offers more), and every one ran the worker:
//   about 143k invocations against 881 file requests in a day, against the
//   account's daily Worker requests, which every host shares. So robots.txt
//   disallows any address with a query, the line-card paths, /read, /card,
//   /canvas and /script.spw; every page that is not a room or a dated release
//   says "noindex, nofollow". A crawler that keeps robots.txt never fetches
//   a derived view, which is stronger than rel="nofollow" on each link, and
//   one that ignores it ignores both; the account's WAF rule stays the
//   backstop. People and their links work as before.
// - The corpus is one file for a crawler: /specimens.json, every specimen's
//   line and note, carried like the other constant answers.
// assets/robots.txt and assets/sitemap.xml are these strings, and a test holds
// them equal; the worker's own /robots.txt answers the same if it is ever asked.
//   The shared layout says "noindex, nofollow" for every worker (autonomous.feedback
//   keeps it); withRobots restates the chosen value on spw.quest's pages.

export const ORIGIN = "https://spw.quest";

/** The rooms that stand without a query, in reading order. */
export const STABLE_ROOMS = Object.freeze([
  "/", "/learn", "/build", "/specimens", "/constructs", "/pivot", "/physics", "/forms/", "/shelf/", "/shelf/plans/",
  "/parser/", "/bench/", "/arcs/", "/install", "/init", "/llms.txt", "/llms-full.txt",
]);

export const ROBOTS = `# The rooms are in the sitemap. A query or a line opens endless views of them; read /specimens.json for the whole corpus in one request.
User-agent: *
Allow: /
Disallow: /*?
Disallow: /script.spw
Disallow: /canvas
Disallow: /read
Disallow: /card
Disallow: /*%3C
Disallow: /*%5B
Disallow: /*%7B
Disallow: /*(
Crawl-delay: 5
Sitemap: ${ORIGIN}/sitemap.xml
`;

export function sitemap(rooms = STABLE_ROOMS) {
  const urls = rooms.map((room) => `  <url><loc>${ORIGIN}${room}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/**
 * Answers that never read the request: the same text for every reader, model
 * and crawler. carry-answers.mjs writes each one out of the worker into assets/
 * (2026-11-11), so the addresses models fetch most are files served at the edge.
 * "/" stays with the worker: it answers text, JSON or a page by Accept.
 */
export const CONSTANT_ANSWERS = Object.freeze([
  "/llms.txt", "/llms-full.txt", "/init", "/init.md", "/git.txt", "/git.md", "/quest.json", "/prompts.json", "/specimens.json",
]);

/** The paths wrangler.jsonc sends to the assets layer instead of the worker. */
export const STATIC_PATTERNS = Object.freeze([
  "/fonts/*", "/peer/*", "/icons/*", "/sw.js", "/robots.txt", "/sitemap.xml",
  "/parser/index.json", "/parser/*/*.js", "/parser/*/*.map", "/parser/*/manifest.json", "/arcs/index.json",
  ...CONSTANT_ANSWERS,
  // The browser's parser: the site bundle, copied byte for byte by carry-answers.mjs. The worker
  // no longer holds it (2026-11-16), so its script stays about 140 KiB smaller.
  "/parser.js",
  // The guide's front page, carried as the worker renders it with no query (carry-guide.mjs).
  "/",
  // The shelf's pages, carried as the worker serves them (shelf.js shelfPages, carry-arcs.mjs).
  "/shelf/", "/shelf/plans/", "/forms/", "/arcs/", "/bench/",
]);

/** A dated parser release page, /parser/2026.10.13/ and the like. */
const RELEASE_PAGE = /^\/parser\/\d{4}\.\d{2}\.\d{2}[^/]*\/$/;

const INDEXED = new Set(STABLE_ROOMS);

/** The robots value for a page at this address and status: a room or a dated release is indexed and followed; any other view is neither. */
export function robotsFor(url, status = 200) {
  if (status >= 400) return "noindex";
  if (status >= 300) return null;
  if (url.search) return "noindex, nofollow";
  return INDEXED.has(url.pathname) || RELEASE_PAGE.test(url.pathname) ? "index, follow" : "noindex, nofollow";
}

// The agents that fetch for a model. Each is told apart from a person's browser
// and from a search index, which keep the page; a model reading / gets the same
// facts as text, ahead of 200 KB of markup. Grok's fetcher does not publish one
// name, so the pattern is a guess at it.
const MODEL_AGENTS = /GPTBot|ChatGPT-User|ClaudeBot|Claude-User|anthropic-ai|Perplexity-User|\bGrok|\bxAI\b|meta-externalagent|cohere-ai|MistralAI-User/i;

/** Whether this request is better answered as text: it asks for text, or a model is fetching. */
export const wantsText = (request) => /text\/(plain|markdown)/.test(request.headers.get("accept") || "") || MODEL_AGENTS.test(request.headers.get("user-agent") || "");

const ROBOTS_META = /<meta name="robots" content="[^"]*">/;

/** The response with its page's robots value in X-Robots-Tag and in the head's robots line; anything that is not HTML passes. */
/** A page's HTML as the worker would serve it at this address: its head's robots line set (for pages carried as files). */
export const asServed = (html, url) => html.replace(ROBOTS_META, `<meta name="robots" content="${robotsFor(url)}">`);

export async function withRobots(response, url) {
  if (!(response.headers.get("Content-Type") || "").startsWith("text/html")) return response;
  const value = robotsFor(url, response.status);
  if (!value) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", value);
  const body = response.body ? (await response.text()).replace(ROBOTS_META, `<meta name="robots" content="${value}">`) : null;
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}
