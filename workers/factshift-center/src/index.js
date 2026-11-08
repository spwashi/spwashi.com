/**
 * factshift.center — snapshot of app.factshift.com 0.0.2-alpha.
 * Assets are workers/factshift-center/assets. www redirects to the apex.
 * The document stays fresh for a minute and carries one line that registers
 * the shell (src/shell.js, served at /sw.js), so the canvas opens offline.
 * Hashed files keep their own cache.
 */
import { SHELL_SCRIPT, withShell } from "./shell.js";

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
    const asset = await env.ASSETS.fetch(request);
    if (DOCUMENT.test(url.pathname) || !url.pathname.includes(".")) {
      const headers = new Headers(asset.headers);
      headers.set("Cache-Control", "public, max-age=60");
      if (asset.ok && request.method === "GET" && (headers.get("content-type") || "").startsWith("text/html")) {
        headers.delete("Content-Length");
        headers.delete("ETag");
        return new Response(withShell(await asset.text()), { status: asset.status, headers });
      }
      return new Response(asset.body, { status: asset.status, headers });
    }
    return asset;
  },
};
