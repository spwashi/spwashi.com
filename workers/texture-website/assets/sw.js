// Written by workers/texture-website/carry.mjs. The day's picture is chosen in the page, so this shell opens it with no network.
const CACHE = "texture-11387c3cdf02";
// The materials' pictures, named for their hashes (images.json): a deploy that leaves them alone keeps them.
const PICTURES = "texture-pictures-e9070412fff6";
const SHELL = ["/","/texture.css","/texture.js","/daily.js","/lib/near-word.js","/clean-still.js","/clean-still.css","/slot-scrub.js","/slot-scrub.css","/vocabulary.json","/favicon.svg","/manifest.webmanifest","/icon-192.png","/icon-512.png","/icon-maskable-512.png"];
const CODE = /\.(?:js|css|json)$/;
const PICTURE = /^\/[a-z0-9-]+\.png$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL.map((path) => new Request(path, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("texture-") && key !== CACHE && key !== PICTURES).map((key) => caches.delete(key)))),
    self.registration.navigationPreload?.enable(),
  ]).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = (await event.preloadResponse) ?? (await fetch(request));
        // Only a page is the shell: a picture or a reading opened in its own tab is not kept as "/".
        if (response.ok && (response.headers.get("content-type") ?? "").includes("text/html")) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put("/", copy)));
        }
        return response;
      } catch {
        return (await caches.match(request)) ?? (await caches.match("/")) ?? Response.error();
      }
    })());
    return;
  }
  if (CODE.test(url.pathname)) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); }
      return response;
    }).catch(() => caches.match(request)));
    return;
  }
  if (PICTURE.test(url.pathname) && !url.pathname.startsWith("/icon-")) {
    event.respondWith(caches.open(PICTURES).then(async (cache) => {
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok) event.waitUntil(cache.put(request, response.clone()));
      return response;
    }));
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

/** Keep every material's picture, six at a time, and say how many are kept. The page asks once it is idle. */
async function keepPictures(client) {
  const cache = await caches.open(PICTURES);
  const vocabulary = await ((await caches.match("/vocabulary.json")) ?? (await fetch("/vocabulary.json"))).json();
  const wanted = vocabulary.materials.map((material) => material.image);
  let kept = 0;
  for (let i = 0; i < wanted.length; i += 6) {
    await Promise.all(wanted.slice(i, i + 6).map(async (src) => {
      if (await cache.match(src)) { kept += 1; return; }
      try {
        const response = await fetch(src);
        if (response.ok) { await cache.put(src, response); kept += 1; }
      } catch {
        // Offline partway: what is kept stays kept, and the next visit finishes.
      }
    }));
  }
  client?.postMessage({ type: "pictures-kept", kept, of: wanted.length });
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "keep-pictures") event.waitUntil(keepPictures(event.source));
});
