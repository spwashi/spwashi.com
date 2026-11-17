// wap.mom as an app: its manifest, the small script every page loads to keep
// it on a device, and the service worker that keeps the periodical readable
// offline. The worker prints all three, and carry-pages.mjs carries them with
// the pages; the icons are drawn by src/icon.js at carry time.
import { printed } from "./catalog.js";

export const MANIFEST = Object.freeze({
  name: "wap.mom",
  short_name: "wap.mom",
  description: "A periodical numbered by the decimal expansion of π, with a supplement numbered by e. Each issue adds a place.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#f4efe4",
  theme_color: "#f4efe4",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ],
  shortcuts: [{ name: "Contents", url: "/contents/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] }],
});

/** Every page a reader keeps: the front page, the contents, the room, the colophon, the corrections, and each printed issue. */
export const KEPT = Object.freeze(["/", "/contents/", "/room", "/colophon/", "/corrections/", "/figures.js", "/app.js", "/favicon.svg", "/manifest.webmanifest", "/icons/icon-192.png", ...printed.map((issue) => `/${issue.slug}/`)]);

/** The service worker: the network first, so a reader online always reads the latest printing, and the kept copy when there is none. */
export const SW_JS = `// Printed by wap.mom's worker (src/app.js). Each printing lists its issues here, so a new one reaches an installed reader.
const CACHE = "wapmom-pages";
const KEPT = ${JSON.stringify(KEPT)};
const LIVE = /^\\/cabinet|\\/draw$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(KEPT)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || LIVE.test(url.pathname)) return;
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); }
    return response;
  }).catch(() => caches.match(request).then((hit) => hit ?? (request.mode === "navigate" ? caches.match("/contents/") : Response.error()))));
});
`;

/** The script every page loads: keep wap.mom on a device when the browser offers to. */
export const APP_JS = `(() => {
  if ("serviceWorker" in navigator && window.top === window) navigator.serviceWorker.register("/sw.js").catch(() => {});
  const keep = document.getElementById("keep-app");
  if (!keep) return;
  let offer = null;
  addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); offer = event; keep.hidden = false; });
  keep.addEventListener("click", async () => {
    if (!offer) return;
    offer.prompt();
    await offer.userChoice.catch(() => null);
    offer = null;
    keep.hidden = true;
  });
  addEventListener("appinstalled", () => { keep.hidden = true; });
})();
`;
