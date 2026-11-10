// factshift.center shell, snapshot 253b949 (2026-11-10); source: workers/factshift-center/src/shell.js
(function factshiftShell({ version, files, waitMs }) {
  const CACHE = `factshift-center-${version}`;
  const kept = new Set(files);
  const homeOf = (path) => (path.startsWith("/_spwashi@") ? "/_spwashi@/" : "/");
  const offline = () => new Response("factshift.center is offline, and the canvas has not been kept on this device yet.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=UTF-8" },
  });

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
    if (!home) return network.catch(offline);
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
})({"version":"253b949-2026-11-10-site3","files":["/","/_spwashi@/","/assets/edges-GYoOyvn3.js","/assets/index-qyiNLrxy.js","/assets/index-rFqe6wtS.css","/assets/keystrokes-T_uJPi5W.js","/assets/main-_qtzgt2L.css","/assets/main-HeAs9uUV.js","/assets/mode-mapfilter--CtiITNe.js","/assets/nodes-UVjd2je_.js","/assets/pipeline-yukFBvla.js","/assets/rects-jqUOT9M5.js","/assets/reinit-85kYXUMe.js","/assets/sounds/bonk.mp3","/assets/spwashi@-g0YoMZaz.css","/assets/spwashi@-n5lYqDBf.js","/assets/workbench-adapter-xU7aCZI7.js","/manifest.json","/v0.0.1/favicon/16.png","/v0.0.1/favicon/192.png","/v0.0.1/favicon/32.png","/v0.0.1/favicon/512.png","/v0.0.1/favicon/96.png","/v0.0.2-alpha/favicon/16.png","/v0.0.2-alpha/favicon/192.png","/v0.0.2-alpha/favicon/32.png","/v0.0.2-alpha/favicon/512.png","/v0.0.2-alpha/favicon/96.png"],"waitMs":3500});
