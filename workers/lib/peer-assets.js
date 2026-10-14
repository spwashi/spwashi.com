/**
 * Serving the peer kit's faces from a worker's own static assets.
 *
 * scripts/build-peer-kit.mjs carries each face into workers/<unit>/assets/fonts/
 * under a content-hashed name, so a face can be cached for a year: a new face
 * is a new name. Only names the kit lists are served.
 */
import { PEER_FONTS } from "./peer-kit.js";

const FILES = new Set(PEER_FONTS.map((face) => face.file));

export const PEER_FONT_BASE = "/fonts/";

export const isPeerFontPath = (pathname) => pathname.startsWith(PEER_FONT_BASE) && FILES.has(pathname.slice(PEER_FONT_BASE.length));

/** A face from env.ASSETS, with its type and a year of cache; 404 for anything the kit does not list. */
export async function servePeerFont(request, url, env) {
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
  if (!["GET", "HEAD"].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  if (!isPeerFontPath(url.pathname) || !env?.ASSETS) return new Response("Not found", { status: 404, headers });
  const asset = await env.ASSETS.fetch(new Request(new URL(url.pathname, url.origin), { method: "GET" }));
  if (!asset.ok) return new Response("Not found", { status: 404, headers });
  return new Response(request.method === "HEAD" ? null : asset.body, {
    headers: { ...headers, "Content-Type": "font/woff2", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
