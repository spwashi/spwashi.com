// What spw.quest tells crawlers, and which of its files skip the worker.
//
// The creator, 2026-11-08: the free tier's daily request limit was reached by
// both workers, and "I'm not very opposed to crawlers if there's a significant
// payload benefit" from serving static files without the worker. So:
// - Static files (faces, peer scripts, icons, the shell script, the parser's
//   dated files and its index) are served by the assets layer, which does not
//   run the worker; wrangler.jsonc routes them there with negative patterns,
//   and assets/_headers gives them the headers the worker used to.
// - Crawlers are welcome on every page. Only the two addresses that are not
//   pages stay closed: /script.spw (a download) and /canvas (a redirect).
// - A sitemap names the stable rooms, so a crawler can find them without
//   walking the query space a pivot opens.
// assets/robots.txt and assets/sitemap.xml are these strings, and a test holds
// them equal; the worker's own /robots.txt answers the same if it is ever asked.
// - A page asks to be indexed only when it is a stable room or a dated parser
//   release, asked without a query (robotsFor). Every other page is followed
//   but not indexed, so the query space a pivot or a build opens is walked for
//   its links and never fills an index; a missing page is neither.
//   The shared layout says "noindex, nofollow" for every worker (autonomous.feedback
//   keeps it); withRobots restates the chosen value on spw.quest's pages.

export const ORIGIN = "https://spw.quest";

/** The rooms that stand without a query, in reading order. */
export const STABLE_ROOMS = Object.freeze([
  "/", "/learn", "/build", "/specimens", "/constructs", "/pivot", "/physics", "/forms/", "/shelf/", "/shelf/plans/",
  "/parser/", "/bench/", "/arcs/", "/install", "/init", "/llms.txt", "/llms-full.txt",
]);

export const ROBOTS = `User-agent: *
Allow: /
Disallow: /script.spw
Disallow: /canvas
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
 * and crawler. carry-answers.mjs writes each one out of the worker into assets/,
 * so the addresses models fetch most (2026-11-11, when the account's daily
 * script allowance ran out and every page answered Error 1027) cost nothing and
 * stay up. "/" stays with the worker: it answers text, JSON or a page by Accept.
 */
export const CONSTANT_ANSWERS = Object.freeze([
  "/llms.txt", "/llms-full.txt", "/init", "/init.md", "/git.txt", "/git.md", "/quest.json", "/prompts.json", "/parser.js",
]);

/** The paths wrangler.jsonc sends to the assets layer instead of the worker. */
export const STATIC_PATTERNS = Object.freeze([
  "/fonts/*", "/peer/*", "/icons/*", "/sw.js", "/robots.txt", "/sitemap.xml",
  "/parser/index.json", "/parser/*/*.js", "/parser/*/*.map", "/parser/*/manifest.json", "/arcs/index.json",
  ...CONSTANT_ANSWERS,
]);

/** A dated parser release page, /parser/2026.10.13/ and the like. */
const RELEASE_PAGE = /^\/parser\/\d{4}\.\d{2}\.\d{2}[^/]*\/$/;

const INDEXED = new Set(STABLE_ROOMS);

/** The robots value for a page at this address and status. */
export function robotsFor(url, status = 200) {
  if (status >= 400) return "noindex";
  if (status >= 300) return null;
  if (url.search) return "noindex, follow";
  return INDEXED.has(url.pathname) || RELEASE_PAGE.test(url.pathname) ? "index, follow" : "noindex, follow";
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
export async function withRobots(response, url) {
  if (!(response.headers.get("Content-Type") || "").startsWith("text/html")) return response;
  const value = robotsFor(url, response.status);
  if (!value) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", value);
  const body = response.body ? (await response.text()).replace(ROBOTS_META, `<meta name="robots" content="${value}">`) : null;
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}
