// factshift.center shell, snapshot 5de5349 (2026-11-16); source: workers/factshift-center/src/shell.js
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
      const answer = await Promise.race([network, slow]);
      if (answer && answer.ok) return answer;
      return home || answer;
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
})({"version":"5de5349-2026-11-16-site5","files":["/","/_spwashi@/","/assets/edges-xF62hSy1.js","/assets/index-jD-F6W-0.js","/assets/index-w8x7Odlt.css","/assets/keystrokes-2UeshZJ3.js","/assets/main-_qtzgt2L.css","/assets/main--lvc4rGh.js","/assets/mode-mapfilter-WHKSzjZZ.js","/assets/mutex-feed-H20yfKij.js","/assets/nodes-qGzOjl9_.js","/assets/pipeline-NrHcWdEV.js","/assets/rects-jqUOT9M5.js","/assets/reinit-QcH4fk1q.js","/assets/sounds/bonk.mp3","/assets/spwashi@-EWRAl5w6.js","/assets/spwashi@-g0YoMZaz.css","/assets/workbench-adapter-Nmz_NuRb.js","/manifest.json","/v0.0.1/favicon/16.png","/v0.0.1/favicon/192.png","/v0.0.1/favicon/32.png","/v0.0.1/favicon/512.png","/v0.0.1/favicon/96.png","/v0.0.2-alpha/favicon/16.png","/v0.0.2-alpha/favicon/192.png","/v0.0.2-alpha/favicon/32.png","/v0.0.2-alpha/favicon/512.png","/v0.0.2-alpha/favicon/96.png"],"waitMs":3500});
