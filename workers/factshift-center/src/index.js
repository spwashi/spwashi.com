/**
 * factshift.center — snapshot of app.factshift.com 0.0.2-alpha.
 * Assets are workers/factshift-center/assets. www redirects to the apex.
 * The document stays fresh for a minute and carries one line that registers
 * the shell (src/shell.js, served at /sw.js), so the canvas opens offline, and
 * the head lines a home screen and a link preview read (src/manifest.js), which
 * also layers the site's fields over the snapshot's manifest at /manifest.json.
 * Hashed files keep their own cache.
 */
import { SHELL_SCRIPT, withShell, withSiteHead } from "./shell.js";
import { headLines, siteManifest } from "./manifest.js";

/** The snapshot's manifest, read from assets; the site layers its fields on it. */
async function snapshotManifest(env, origin) {
  try {
    const response = await env.ASSETS.fetch(new Request(new URL("/manifest.json", origin)));
    return response.ok ? await response.json() : {};
  } catch {
    return {};
  }
}

const DOCUMENT = /\/$|\.html$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.factshift.center") {
      url.hostname = "factshift.center";
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === "/sw.js") {
      return new Response(request.method === "HEAD" ? null : SHELL_SCRIPT, {
        headers: {
          "Content-Type": "text/javascript; charset=UTF-8",
          "Cache-Control": "public, max-age=60",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (url.pathname === "/manifest.json") {
      return new Response(request.method === "HEAD" ? null : JSON.stringify(siteManifest(await snapshotManifest(env, url.origin)), null, 2), {
        headers: {
          "Content-Type": "application/manifest+json; charset=UTF-8",
          "Cache-Control": "public, max-age=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const asset = await env.ASSETS.fetch(request);
    if (DOCUMENT.test(url.pathname) || !url.pathname.includes(".")) {
      const headers = new Headers(asset.headers);
      headers.set("Cache-Control", "public, max-age=60");
      if (asset.ok && request.method === "GET" && (headers.get("content-type") || "").startsWith("text/html")) {
        headers.delete("Content-Length");
        headers.delete("ETag");
        const lines = headLines(await snapshotManifest(env, url.origin));
        return new Response(withShell(withSiteHead(await asset.text(), lines)), { status: asset.status, headers });
      }
      return new Response(asset.body, { status: asset.status, headers });
    }
    return asset;
  },
};
