// factshift.center's shell: the canvas, kept on the device so it opens without a
// connection (the creator, 2026-11-08: "improve offline behavior for
// factshift.center").
//
// The snapshot's own service worker registers at /v0.0.2-alpha/service-worker.js
// with no scope, so it controls only that folder, never the canvas at /. This
// shell is the site's: the worker serves it at /sw.js and adds one registration
// line to the canvas's HTML as it serves it. The app repository is untouched.
//
// What it does:
// - Install keeps every file the snapshot ships (SNAPSHOT_FILES, written by
//   carry-shell.mjs from assets/), under a cache named for the snapshot.
// - A navigation goes to the network first. If the network fails, or has not
//   answered within a few seconds while a kept canvas exists, the kept canvas
//   opens; the app reads ?spw= and #spw64= on the page, so a line still lands.
// - The kept canvas is the one install stored, never a later network copy, so
//   its chunks are always the ones in the same cache.
// - A kept file is served from the cache; anything else, any other origin, and
//   anything but GET go to the network untouched.
// - A new snapshot's shell waits for the old one's pages to close: a page that
//   loaded the old chunks keeps finding them.
import { SNAPSHOT, SNAPSHOT_FILES } from "./snapshot-files.js";

/** The service worker, as a function its own script calls with its settings. */
export function factshiftShell({ version, files, waitMs }) {
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
}

/** How long a navigation waits for the network before a kept canvas opens. */
export const NAVIGATION_WAIT_MS = 3500;

/** The script served at /sw.js. */
export const SHELL_SCRIPT = `// factshift.center shell, snapshot ${SNAPSHOT.revision} (${SNAPSHOT.snapshot}); source: workers/factshift-center/src/shell.js
(${factshiftShell.toString()})(${JSON.stringify({ version: `${SNAPSHOT.revision}-${SNAPSHOT.snapshot}`, files: SNAPSHOT_FILES, waitMs: NAVIGATION_WAIT_MS })});
`;

/** Runs on the canvas after load: register the shell at the root, so it controls /. */
export function registerFactshiftShell() {
  if (!("serviceWorker" in navigator)) return;
  const start = () => navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  if (document.readyState === "complete") start();
  else addEventListener("load", start, { once: true });
}

export const REGISTER_TAG = `<script data-factshift-shell>(${registerFactshiftShell.toString()})();</script>`;

/** The canvas's HTML with the registration line before </body>, once. */
export function withShell(html) {
  if (html.includes("data-factshift-shell") || !html.includes("</body>")) return html;
  const at = html.lastIndexOf("</body>");
  return `${html.slice(0, at)}${REGISTER_TAG}\n${html.slice(at)}`;
}
