// Written by workers/mutex-buzz/carry.mjs. The lock works out "now" in the page, so with these kept it keeps time offline.
const CACHE = "mutex-5e81b2ef0437";
const SHELL = ["/","/now/","/mutex.css","/mutex.js","/lock.js","/lock.spw","/set-ring.js","/set-ring.css","/pinch.js","/pinch.css","/now.json","/favicon.svg","/manifest.webmanifest","/folios/lined-stage-facade.webp","/folios/teal-stripes-vibes-wash.webp","/folios/factshift-cabinet.webp","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("mutex-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then((hit) => hit ?? caches.match(url.pathname.startsWith("/now") ? "/now/" : "/"))));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => {
    const fresh = fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); }
      return response;
    });
    return hit ?? fresh;
  }));
});
