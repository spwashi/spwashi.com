// Written by workers/tealstripesvibes/carry.mjs. Pages from the network when there is one, else the kept shell, which paints any address.
const CACHE = "tealstripes-5718050422f0";
const SHELL = ["/","/index.html","/harbor","/ledger","/lantern","/tealstripes.js","/vibe.js","/lib/hold.js","/tealstripes.css","/set-ring.js","/set-ring.css","/pinch.js","/pinch.css","/text-scale.js","/text-scale.css","/text-scale-head.js","/clean-still.js","/clean-still.css","/peer/pinch-text-scale.c898b03dd8.js","/favicon.svg","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/icons/apple-touch-icon.png"];
const SCRIPTED = /^\/(m|stamp|og)\/|^\/tuple$|\.json$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("tealstripes-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || SCRIPTED.test(url.pathname)) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(request).then((hit) => hit ?? caches.match("/index.html"))));
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
