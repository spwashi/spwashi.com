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
}

/** How long a navigation waits for the network before a kept canvas opens. */
export const NAVIGATION_WAIT_MS = 3500;

/**
 * The site's own revision of what it serves around the snapshot (the shell, the
 * manifest's site fields, the head lines). A change there increments it, so an
 * installed app fetches a fresh shell and keeps the new manifest.
 * 2: the site-served manifest and head lines (src/manifest.js), 2026-11-08.
 * 4: the offer of a new shell, the offline page, and the share target, 2026-11-10.
 * 5: file handling via launchQueue, window-controls-overlay, iOS status bar,
 *    visibility updates, and server error fallback, 2026-11-11.
 */
export const SITE_REVISION = 5;
export const SHELL_VERSION = `${SNAPSHOT.revision}-${SNAPSHOT.snapshot}-site${SITE_REVISION}`;

/** The script at /sw.js, for a snapshot and the files it keeps; carry-shell.mjs writes it into assets/. */
export function shellScript(snapshot = SNAPSHOT, files = SNAPSHOT_FILES) {
  const version = `${snapshot.revision}-${snapshot.snapshot}-site${SITE_REVISION}`;
  return `// factshift.center shell, snapshot ${snapshot.revision} (${snapshot.snapshot}); source: workers/factshift-center/src/shell.js
(${factshiftShell.toString()})(${JSON.stringify({ version, files, waitMs: NAVIGATION_WAIT_MS })});
`;
}

export const SHELL_SCRIPT = shellScript();

/**
 * Runs on the canvas after load: register the shell at the root, so it controls
 * /, and offer a new shell once it is saved. A new shell waits until the reader
 * asks for it, so a canvas in hand is never reloaded from under them; the first
 * install claims the page without an offer.
 */
export function registerFactshiftShell() {
  if (!("serviceWorker" in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) location.reload();
  });
  const offer = (registration) => {
    if (!registration.waiting || !navigator.serviceWorker.controller || document.getElementById("factshift-shell-line")) return;
    const line = document.createElement("p");
    line.id = "factshift-shell-line";
    line.setAttribute("role", "status");
    line.style.cssText = "position:fixed;left:50%;bottom:calc(.75rem + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:.5rem;margin:0;padding:.15rem .25rem .15rem .85rem;border-radius:.4rem;background:#f5deb3;color:#4c1d1d;font:500 .85rem/1.2 system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,.35)";
    line.append("A new canvas is saved.");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Reload to use it";
    button.style.cssText = "min-height:44px;padding:0 .75rem;border:0;border-radius:.3rem;background:#4c1d1d;color:#f5deb3;font:inherit;cursor:pointer";
    button.addEventListener("click", () => {
      reloading = true;
      registration.waiting?.postMessage({ type: "skip-waiting" });
    });
    line.append(button);
    document.body.append(line);
  };
  const start = () => navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((registration) => {
    registration.update().catch(() => {});
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") registration.update().catch(() => {});
    });
    offer(registration);
    const watch = (worker) => worker?.addEventListener("statechange", () => {
      if (worker.state === "installed") offer(registration);
    });
    // An install can already be under way by the time this runs, and then updatefound has passed.
    watch(registration.installing);
    registration.addEventListener("updatefound", () => watch(registration.installing));
  }).catch(() => {});
  if (document.readyState === "complete") start();
  else addEventListener("load", start, { once: true });

  // PWA File Handling: files opened via OS association (.spw, .txt) dispatch to the canvas drop handler
  if ("launchQueue" in window && "files" in window.LaunchParams.prototype) {
    window.launchQueue.setConsumer(async (params) => {
      if (!params || !params.files || !params.files.length) return;
      for (const handle of params.files) {
        try {
          const file = await handle.getFile();
          if (file && typeof DataTransfer !== "undefined") {
            const dt = new DataTransfer();
            dt.items.add(file);
            document.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
          }
        } catch {}
      }
    });
  }
}

export const REGISTER_TAG = `<script data-factshift-shell>(${registerFactshiftShell.toString()})();</script>`;

/**
 * The canvas's HTML with the registration line before </body>, once. A line
 * carried before is replaced whole, so a change to it reaches a carried
 * snapshot, and carrying the same line again changes nothing.
 */
export function withShell(html) {
  if (!html.includes("</body>")) return html;
  const bare = html.replace(/<script data-factshift-shell>[\s\S]*?<\/script>\n?/, "");
  const at = bare.lastIndexOf("</body>");
  return `${bare.slice(0, at)}${REGISTER_TAG}\n${bare.slice(at)}`;
}

/**
 * The canvas's HTML with the site's head lines before </head>, once. A block
 * carried before is replaced whole, so changed lines reach a carried snapshot
 * and carrying the same lines again changes nothing.
 */
export function withSiteHead(html, lines) {
  if (!lines || !html.includes("</head>")) return html;
  const carried = html.indexOf('    <meta name="factshift-site-head"');
  if (carried !== -1 && carried < html.indexOf("</head>")) html = `${html.slice(0, carried)}${html.slice(html.indexOf("</head>"))}`;
  const at = html.indexOf("</head>");
  return `${html.slice(0, at)}    <meta name="factshift-site-head" content="${SITE_REVISION}" data-factshift-site-head>\n    ${lines}\n${html.slice(at)}`;
}
