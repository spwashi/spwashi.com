// spw.quest's shell: PR 3 of .agents/plans/spw-quest/note-shell-design.md.
// A classic script (no import, no export), served by the worker at /sw.js with
// no Content-Security-Policy, because a policy on a worker script becomes the
// worker's own and default-src 'none' would refuse every fetch in here.
//
// What it keeps:
// - The shell, at install: /offline, the two faces, the manifest and its
//   icons, and the reader the guide pins, stored only after its SHA-256
//   matches the pin.
// - The guide, network first: a navigation to /, /?note or exactly one
//   ?example= is stored under its own key after a good response, and served
//   from there only when the network fails.
// Everything else goes to the network untouched and is never stored. A failed
// navigation to /learn, /build, /install or /parser/ gets /offline. The note
// lives in localStorage, which a service worker cannot read.
//
// The pin is repeated from src/shell-pin.js; a test fails if they drift.
// Changing it increments SHELL_VERSION in both files.

const SHELL_VERSION = "1";
const PINNED_RELEASE = "2026.10.13";
const PINNED_READER = "/parser/2026.10.13/reader.min.js";
const PINNED_READER_SHA256 = "9928ec7f51a0416ee39857dc3a3b236d071051f484e4da5a3460a8f62c5d4de7";
const PINNED_READER_BYTES = 87605;

const SHELL_CACHE = `spw-quest-shell-v${SHELL_VERSION}`;
const PAGES_CACHE = `spw-quest-pages-v${SHELL_VERSION}`;
const OFFLINE = "/offline";
const SHELL_FILES = [
  "/fonts/newsreader-latin.01817351be.woff2",
  "/fonts/jetbrains-mono-latin.2c32b9b3ee.woff2",
  "/manifest.webmanifest",
  "/icons/quest-180.png",
  "/icons/quest-192.png",
  "/icons/quest-512.png",
  "/icons/quest-mask-512.png",
];
const SHELL_PATHS = new Set([OFFLINE, ...SHELL_FILES]);
const PAGE_PATHS = new Set(["/learn", "/build", "/install", "/parser/"]);
const HTML = { Accept: "text/html" };

const hexOf = async (buffer) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)), (b) => b.toString(16).padStart(2, "0")).join("");

/** Store only what a cache can hold honestly: ok, a body, and not the end of a redirect. */
const storable = (response) => Boolean(response && response.ok && response.body && !response.redirected);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    const reader = await fetch(PINNED_READER, { cache: "no-store" });
    if (!reader.ok) throw new Error("spw.quest shell: the pinned reader did not load");
    const bytes = await reader.clone().arrayBuffer();
    if (bytes.byteLength !== PINNED_READER_BYTES || (await hexOf(bytes)) !== PINNED_READER_SHA256) {
      throw new Error("spw.quest shell: the file at the pinned address does not match the pin");
    }
    await shell.put(PINNED_READER, reader);
    await shell.put(new Request(OFFLINE, { headers: HTML }), await fetch(new Request(OFFLINE, { headers: HTML })));
    await shell.addAll(SHELL_FILES);
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith("spw-quest-") && name !== SHELL_CACHE && name !== PAGES_CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "skip-waiting") self.skipWaiting();
});

/** The guide's key: "/" for no query or exactly ?note, "/?example=<id>" for exactly one example, else null. */
function guideKey(url) {
  if (!url.search) return "/";
  const keys = [...url.searchParams.keys()];
  if (keys.length !== 1) return null;
  if (keys[0] === "note") return "/";
  if (keys[0] === "example") {
    const id = url.searchParams.get("example") || "";
    return /^[a-z0-9_-]{1,40}$/.test(id) ? `/?example=${id}` : null;
  }
  return null;
}

async function offlinePage() {
  const shell = await caches.open(SHELL_CACHE);
  return (await shell.match(new Request(OFFLINE, { headers: HTML })))
    || new Response("spw.quest is offline, and this page was not saved.", { status: 503, headers: { "Content-Type": "text/plain; charset=UTF-8" } });
}

async function guide(key) {
  const keyRequest = new Request(key, { headers: HTML });
  try {
    // A navigate-mode request cannot take options, so the guide is fetched by its address.
    const response = await fetch(key === "/" ? self.location.origin + "/" : self.location.origin + key, { cache: "no-cache", headers: HTML, credentials: "same-origin" });
    if (storable(response) && response.type === "basic" && (response.headers.get("content-type") || "").startsWith("text/html")) {
      const copy = response.clone();
      caches.open(PAGES_CACHE).then((pages) => pages.put(keyRequest, copy)).catch(() => {});
    }
    return response;
  } catch {
    const pages = await caches.open(PAGES_CACHE);
    return (await pages.match(keyRequest)) || offlinePage();
  }
}

async function page(request) {
  try {
    return await fetch(request);
  } catch {
    return offlinePage();
  }
}

async function shellFile(request, path) {
  const shell = await caches.open(SHELL_CACHE);
  const key = path === OFFLINE ? new Request(OFFLINE, { headers: HTML }) : path;
  const hit = await shell.match(key);
  if (hit) return hit;
  const response = await fetch(request);
  if (storable(response)) shell.put(key, response.clone()).catch(() => {});
  return response;
}

async function pinnedReader() {
  const shell = await caches.open(SHELL_CACHE);
  const hit = await shell.match(PINNED_READER);
  if (hit) return hit;
  const response = await fetch(PINNED_READER, { cache: "no-store" });
  if (!storable(response)) return response;
  const bytes = await response.clone().arrayBuffer();
  const sha256 = await hexOf(bytes);
  if (bytes.byteLength === PINNED_READER_BYTES && sha256 === PINNED_READER_SHA256) {
    shell.put(PINNED_READER, response.clone()).catch(() => {});
    return response;
  }
  self.clients.matchAll().then((clients) => {
    for (const client of clients) client.postMessage({ type: "pin-mismatch", release: PINNED_RELEASE, sha256 });
  });
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  // Fail open: anything this worker does not name goes to the network untouched.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === PINNED_READER && !url.search) {
    event.respondWith(pinnedReader());
    return;
  }
  if (SHELL_PATHS.has(url.pathname) && !url.search) {
    event.respondWith(shellFile(request, url.pathname));
    return;
  }
  if (request.mode !== "navigate") return;
  if (url.pathname === "/") {
    const key = guideKey(url);
    if (key) event.respondWith(guide(key));
    return;
  }
  if (PAGE_PATHS.has(url.pathname) && !url.search) event.respondWith(page(request));
});
