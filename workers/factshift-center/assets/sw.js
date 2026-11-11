// factshift.center shell, snapshot 517c036 (2026-11-10); source: workers/factshift-center/src/shell.js
(function factshiftShell({ version, files, waitMs }) {
  const CACHE = `factshift-center-${version}`;
  const kept = new Set(files);
  const homeOf = (path) => (path.startsWith("/_spwashi@") ? "/_spwashi@/" : "/");
  // A line that arrived by link is still in the address, so the page says so and shows it.
  const offline = (url) => {
    const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const line = url.searchParams.get("spw");
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>factshift.center, offline</title><body style="margin:0;min-height:100vh;display:grid;place-content:center;gap:.75rem;padding:1.5rem;box-sizing:border-box;background:#4c1d1d;color:#f5deb3;font:1rem/1.5 system-ui,sans-serif"><h1 style="margin:0;font-size:1.25rem">factshift.center is offline, and the canvas has not been kept on this device yet.</h1>${line ? `<p style="margin:0">Your line is still in this address. It opens here once you are connected:</p><p style="margin:0;font-family:ui-monospace,monospace;overflow-wrap:anywhere">${esc(line)}</p>` : `<p style="margin:0">Open it once with a connection, and it stays on this device.</p>`}</body></html>`, {
      status: 503,
      headers: { "Content-Type": "text/html; charset=UTF-8" },
    });
  };

  self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(files)));
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("factshift-center-") && name !== CACHE) await caches.delete(name);
      }
      await self.clients.claim();
    })());
  });

  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "skip-waiting") self.skipWaiting();
  });

  async function canvas(url) {
    const cache = await caches.open(CACHE);
    const home = await cache.match(homeOf(url.pathname));
    // A navigate-mode request cannot take options, so the page is fetched by its address.
    const network = fetch(url.href, { cache: "no-cache", credentials: "same-origin" });
    network.catch(() => {}); // a late failure after the kept canvas opened is not an error
    if (!home) return network.catch(() => offline(url));
    const slow = new Promise((resolve) => setTimeout(() => resolve(null), waitMs));
    try {
      return (await Promise.race([network, slow])) || home;
    } catch {
      return home;
    }
  }

  async function keptFile(request, path) {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(path);
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok && response.body && !response.redirected) cache.put(path, response.clone()).catch(() => {});
    return response;
  }

  self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (request.mode === "navigate") {
      event.respondWith(canvas(url));
      return;
    }
    if (kept.has(url.pathname) && !url.search) event.respondWith(keptFile(request, url.pathname));
  });
})({"version":"517c036-2026-11-10-site4","files":["/","/_spwashi@/","/assets/edges-5w_9qJDJ.js","/assets/index-6HUflsnv.css","/assets/index-xLQuUA34.js","/assets/keystrokes-mfdTDtra.js","/assets/main-_qtzgt2L.css","/assets/main-u1dDnLnp.js","/assets/mode-mapfilter--adSI-8M.js","/assets/nodes-BCMEVx1x.js","/assets/pipeline-TfEXQABR.js","/assets/rects-jqUOT9M5.js","/assets/reinit-SZcVeHSZ.js","/assets/sounds/bonk.mp3","/assets/spwashi@-DGYw-PzW.js","/assets/spwashi@-g0YoMZaz.css","/assets/workbench-adapter-NEdvIDq-.js","/manifest.json","/v0.0.1/favicon/16.png","/v0.0.1/favicon/192.png","/v0.0.1/favicon/32.png","/v0.0.1/favicon/512.png","/v0.0.1/favicon/96.png","/v0.0.2-alpha/favicon/16.png","/v0.0.2-alpha/favicon/192.png","/v0.0.2-alpha/favicon/32.png","/v0.0.2-alpha/favicon/512.png","/v0.0.2-alpha/favicon/96.png"],"waitMs":3500});
