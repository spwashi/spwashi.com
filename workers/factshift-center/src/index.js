/**
 * factshift.center — snapshot of app.factshift.com 0.0.2-alpha.
 * Assets are workers/factshift-center/assets. www redirects to the apex.
 * The document stays fresh for a minute. Hashed files keep their own cache.
 */

const DOCUMENT = /\/$|\.html$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.factshift.center") {
      url.hostname = "factshift.center";
      return Response.redirect(url.toString(), 301);
    }
    const asset = await env.ASSETS.fetch(request);
    if (DOCUMENT.test(url.pathname) || !url.pathname.includes(".")) {
      const headers = new Headers(asset.headers);
      headers.set("Cache-Control", "public, max-age=60");
      return new Response(asset.body, { status: asset.status, headers });
    }
    return asset;
  },
};
