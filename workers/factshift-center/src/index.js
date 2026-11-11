/**
 * factshift.center — snapshot of app.factshift.com 0.0.2-alpha.
 * Assets are workers/factshift-center/assets, served as static files: the
 * site's layer (head lines, the shell's registration, /sw.js, the manifest's
 * site fields, their headers, the canvas's one-minute cache) is written into
 * the snapshot by carry-shell.mjs. Since 2026-11-11 a file answers every
 * address first, "/" included, so the canvas spends none of the account's
 * daily script allowance. This worker runs only when no file answers: there it
 * still sends www to the apex. www.factshift.center/ itself is a file now, so
 * its redirect belongs to a Cloudflare Redirect Rule.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.factshift.center") {
      url.hostname = "factshift.center";
      return Response.redirect(url.toString(), 301);
    }
    const asset = await env.ASSETS.fetch(request);
    // The canvas stays fresh for a minute, as it did when the worker served every document.
    const headers = new Headers(asset.headers);
    headers.set("Cache-Control", "public, max-age=60");
    return new Response(asset.body, { status: asset.status, headers });
  },
};
