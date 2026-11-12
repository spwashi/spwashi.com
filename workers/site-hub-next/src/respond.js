// How this script answers. Every host it serves shares one security stance, and
// an answer takes one of a few shapes; a host module says what to answer, and
// these say how, so a host that leaves takes only its words with it.
import { securityHeaders } from "../../lib/http.js";

const BASE_SECURITY = securityHeaders({ referrer: "strict-origin-when-cross-origin", corp: "same-origin" });

export const HTML_CSP =
  "default-src 'none'; img-src https://spwashi.com; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";

export function jsonResponse(body, cache) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": cache,
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

export function htmlResponse(body, { cache, robots, csp = HTML_CSP }) {
  return new Response(body, {
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": cache,
      "Content-Security-Policy": csp,
      "X-Robots-Tag": robots,
    },
  });
}

/** Plain text: a robots.txt, and the 404 every host gives for a path it does not know. */
export function textResponse(body, cache, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "text/plain; charset=UTF-8",
      "Cache-Control": cache,
    },
  });
}

export const notFound = () => textResponse("Not found", "no-store", 404);

/** A favicon never changes between requests, so it keeps for a day even where pages do not. */
export function iconResponse(icon) {
  return new Response(icon, {
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "image/svg+xml; charset=UTF-8",
      "Cache-Control": "public, max-age=86400",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
    },
  });
}
