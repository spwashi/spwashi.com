// Written by workers/texture-website/carry.mjs. The day's picture is chosen in the page, so this shell opens it with no network.
const CACHE = "texture-073e3060d8df";
const SHELL = ["/","/texture.css","/texture.js","/daily.js","/lib/near-word.js","/clean-still.js","/clean-still.css","/slot-scrub.js","/slot-scrub.css","/vocabulary.json","/favicon.svg","/manifest.webmanifest","/icon-192.png","/icon-512.png"];
const CODE = /\.(?:js|css|json)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL.map((path) => new Request(path, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("texture-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      if (response.ok) caches.open(CACHE).then((cache) => cache.put("/", copy));
      return response;
    }).catch(() => caches.match("/")));
    return;
  }
  if (CODE.test(url.pathname)) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); }
      return response;
    }).catch(() => caches.match(request)));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => {
    const fresh = fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); }
      return response;
    }).catch(() => hit);
    return hit ?? fresh;
  }));
});
