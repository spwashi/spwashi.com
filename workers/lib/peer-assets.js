/**
 * Serving the peer kit's carried files from a worker's own static assets.
 *
 * scripts/build-peer-kit.mjs carries each face into workers/<unit>/assets/fonts/
 * and each site script module into workers/<unit>/assets/peer/, under
 * content-hashed names, so a file can be cached for a year: a new file is a new
 * name. Only names the kit lists are served.
 */
import { PEER_FONTS, PEER_SCRIPTS } from "./peer-kit.js";

export const PEER_FONT_BASE = "/fonts/";
export const PEER_SCRIPT_BASE = "/peer/";

const FONTS = new Set(PEER_FONTS.map((face) => face.file));
const SCRIPTS = new Set(PEER_SCRIPTS.map((script) => script.file));

const kindOf = (pathname) => {
  if (pathname.startsWith(PEER_FONT_BASE) && FONTS.has(pathname.slice(PEER_FONT_BASE.length))) return "font/woff2";
  if (pathname.startsWith(PEER_SCRIPT_BASE) && SCRIPTS.has(pathname.slice(PEER_SCRIPT_BASE.length))) return "text/javascript; charset=UTF-8";
  return null;
};

export const isPeerFontPath = (pathname) => kindOf(pathname) === "font/woff2";
export const isPeerAssetPath = (pathname) => kindOf(pathname) !== null;

/** A carried file from env.ASSETS, with its type and a year of cache; 404 for anything the kit does not list. */
export async function servePeerAsset(request, url, env) {
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
  if (!["GET", "HEAD"].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  const type = kindOf(url.pathname);
  if (!type || !env?.ASSETS) return new Response("Not found", { status: 404, headers });
  const asset = await env.ASSETS.fetch(new Request(new URL(url.pathname, url.origin), { method: "GET" }));
  if (!asset.ok) return new Response("Not found", { status: 404, headers });
  return new Response(request.method === "HEAD" ? null : asset.body, {
    headers: { ...headers, "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}

/** Kept for callers that serve faces only. */
export const servePeerFont = servePeerAsset;
