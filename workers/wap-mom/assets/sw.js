// Printed by wap.mom's worker (src/app.js). Each printing lists its issues here, so a new one reaches an installed reader.
const CACHE = "wapmom-pages-0.3.0";
const KEPT = ["/","/contents/","/room","/colophon/","/corrections/","/figures.js","/app.js","/text-scale.js","/text-scale.css","/text-scale-head.js","/peer/pinch-text-scale.c898b03dd8.js","/favicon.svg","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/icons/apple-touch-icon.png","/pi/","/pi/offprint/","/pi/clip/","/22-7/","/22-7/offprint/","/22-7/clip/","/pie/","/pie/offprint/","/pie/clip/","/355-113/","/355-113/offprint/","/355-113/clip/","/crust/","/crust/offprint/","/crust/clip/","/needles/","/needles/offprint/","/needles/clip/","/slice/","/slice/offprint/","/slice/clip/","/square/","/square/offprint/","/square/clip/","/patience/","/patience/offprint/","/patience/clip/","/interest/","/interest/offprint/","/interest/clip/","/rise/","/rise/offprint/","/rise/clip/"];
const LIVE = /^\/cabinet|\/draw$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(KEPT)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("wapmom-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || LIVE.test(url.pathname)) return;
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); }
    return response;
  }).catch(() => caches.match(request).then((hit) => hit ?? (request.mode === "navigate" ? caches.match("/contents/") : Response.error()))));
});
