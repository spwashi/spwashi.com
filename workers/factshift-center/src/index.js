/**
 * factshift.center — snapshot of app.factshift.com 0.0.2-alpha.
 * Assets are workers/factshift-center/assets, served as static files: the
 * site's layer (head lines, the shell's registration, /sw.js, the manifest's
 * site fields, their headers) is written into the snapshot by carry-shell.mjs.
 * wrangler.jsonc runs this worker for "/" only, so www.factshift.center/
 * redirects to the apex; every other request skips it, and does not count
 * against the daily request limit.
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
