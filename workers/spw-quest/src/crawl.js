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

export const ORIGIN = "https://spw.quest";

/** The rooms that stand without a query, in reading order. */
export const STABLE_ROOMS = Object.freeze([
  "/", "/learn", "/build", "/specimens", "/constructs", "/pivot", "/forms/", "/shelf/", "/shelf/plans/",
  "/parser/", "/install", "/init", "/llms.txt",
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

/** The paths wrangler.jsonc sends to the assets layer instead of the worker. */
export const STATIC_PATTERNS = Object.freeze([
  "/fonts/*", "/peer/*", "/icons/*", "/sw.js", "/robots.txt", "/sitemap.xml",
  "/parser/index.json", "/parser/*/*.js", "/parser/*/*.map", "/parser/*/manifest.json",
]);
