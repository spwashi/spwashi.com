import { createHash } from "node:crypto";

export const THEME = "#120c16";
export const APPLE_ICON = "/icon-180.png";

export function appManifest(description) {
  return JSON.stringify({
    id: "/",
    name: "Attention Productions",
    short_name: "Attention",
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: THEME,
    background_color: THEME,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }, null, 2) + "\n";
}

export function serviceWorker(files) {
  const paths = files.map(([name]) => name === "index.html" ? "/" : `/${name}`);
  const worker = `// Written by workers/attention-productions/carry.mjs.
const ROOT = "attention-productions-";
const CACHE = ROOT + "__VERSION__";
const SHELL = new Set(${JSON.stringify(paths)});

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
    const isMutableCode = /\\.(?:js|css|json)$/.test(url.pathname) && !url.pathname.startsWith("/peer/");
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
`;
  const hash = createHash("sha256").update(worker);
  for (const [name, body] of files) hash.update(name).update(body);
  return worker.replace("__VERSION__", hash.digest("hex").slice(0, 12));
}
