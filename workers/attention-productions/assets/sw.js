// Written by workers/attention-productions/carry.mjs.
const ROOT = "attention-productions-";
const CACHE = ROOT + "dd9e522f50ce";
const SHELL = new Set(["/vocabulary.js","/compose.js","/materials.js","/set-ring.js","/set-ring.css","/pinch.js","/pinch.css","/text-scale.js","/text-scale.css","/text-scale-head.js","/clean-still.js","/clean-still.css","/slot-scrub.js","/slot-scrub.css","/lib/near-word.js","/","/favicon.svg","/manifest.webmanifest","/lights.css","/attention.js","/attention.css","/peer/pinch-text-scale.1c2ad61442.js","/icon-180.png","/icon-192.png","/icon-512.png","/icon-maskable-512.png"]);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => {
    return cache.addAll([...SHELL].map((path) => new Request(new URL(path, self.location.origin), { cache: "reload" })));
  }));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith(ROOT) && key !== CACHE).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // The same composer reads the original shot path and query after an offline fallback.
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match("/")) ?? Response.error();
    }));
  } else if (!url.search && SHELL.has(url.pathname)) {
    const isMutableCode = /\.(?:js|css|json)$/.test(url.pathname) && !url.pathname.startsWith("/peer/");
    if (isMutableCode) {
      event.respondWith(fetch(request).then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      }).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(request)) ?? Response.error();
      }));
      return;
    }
    event.respondWith(caches.open(CACHE).then(async (cache) => {
      return (await cache.match(request)) ?? fetch(request);
    }));
  }
});
