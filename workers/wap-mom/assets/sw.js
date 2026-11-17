// Printed by wap.mom's worker (src/app.js). Each printing lists its issues here, so a new one reaches an installed reader.
const CACHE = "wapmom-pages";
const KEPT = ["/","/contents/","/room","/colophon/","/corrections/","/figures.js","/app.js","/favicon.svg","/manifest.webmanifest","/icons/icon-192.png","/pi/","/22-7/","/pie/","/355-113/","/crust/","/needles/","/slice/","/square/","/patience/","/interest/","/rise/"];
const LIVE = /^\/cabinet|\/draw$/;

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
