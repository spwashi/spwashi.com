// Carries tealstripesvibes.com into assets/ as files, so a page never runs a
// script (it answered 429, error 1027, under site-hub-next when the account's
// daily Worker requests ran out). Every page is the same shell, painted in the
// reader's browser from src/vibe.js; the three seeds are also written whole
// (harbor.html, served at /harbor) so they read with scripts off. The signed
// and machine routes (/m/, /stamp/, /tuple, /og/, .json) stay the worker's
// (src/index.js, src/server.js). It writes:
// - assets/vibe.js: the pure part, byte for byte, for assets/tealstripes.js;
// - assets/index.html (every other address) and assets/<seed>.html;
// - favicon.svg, robots.txt, ecosystem.json, registry.json, llms.txt;
// - manifest.webmanifest, sw.js and icons/*.png, so it installs and keeps the
//   vibes offline;
// - _headers.
// --check fails when a carried file differs from what this would write.
import { createHash } from "node:crypto";
import { peerScriptPath } from "../lib/peer-kit.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { escapeHtml } from "../lib/http.js";
import { writeOrCheck } from "../lib/carry.js";
import { assertIconPng } from "../lib/png.js";
import { ecosystemJson } from "../site-hub-next/src/hosts/ecosystem.js";
import { ALL, FACETS, FILTERS, GROUND, HOST, SEEDS, TUNING, canonicalPath, expressionOf, facetChips, maskLabel, moodOf, vibe, vibeCss } from "./src/vibe.js";

/** spwashi.com's pinch for text, carried by scripts/build-peer-kit.mjs (workers/lib/text-scale.js binds it). */
const PINCH_TEXT = peerScriptPath("pinch-text-scale");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "assets");
const ORIGIN = `https://${HOST}`;

export const CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://mutex.buzz; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'self' https://attention.productions https://mutex.buzz; upgrade-insecure-requests";

/** The routes the worker answers; everything else is a file. */
export const SCRIPT_ROUTES = Object.freeze(["/m/*", "/stamp/*", "/tuple", "/og/*", "/*.json"]);

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${GROUND.palette[0]}"/><path d="M6 26 26 6M-2 18 18-2M14 34 34 14" stroke="${GROUND.palette[1]}" stroke-width="5"/></svg>
`;

/** The page: one shell for every vibe, written here for a seed or for the ground the script repaints. */
function shell({ seed, mask, filters, title, mood, canonical, ground = false }) {
  const v = vibe(seed, mask, filters);
  const expression = ground ? "" : expressionOf(seed, mask, filters, v);
  const facets = FACETS.map((f) => `<li class="${mask.includes(f.letter) ? "on" : "off"}"><code>${escapeHtml(f.sigil)}</code><code>${f.letter}</code> ${f.name}</li>`).join("");
  // The mask, as six chips a hand can switch: each one is a link to the address with that facet switched.
  const chips = facetChips(seed, mask, filters).map((c) => `<a class="facet${c.on ? " on" : ""}" href="${escapeHtml(c.href)}" data-mask="${c.mask}" title="${escapeHtml(c.title)}"><span class="facet-letter">${c.letter}</span>${c.name}</a>`).join("");
  const tuple = `/tuple?seed=${seed}&mask=${maskLabel(mask)}${filters.length ? `&filter=${filters.join(",")}` : ""}`;
  const og = `/og/${seed}/${maskLabel(mask)}.svg`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(ground ? "A proof card you can link to: a named look of stripes, masked and filtered by its address, the same picture every time." : `${mood}. ${expression}`)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:title" content="${escapeHtml(ground ? "Teal Stripes Vibes" : `Teal Stripes Vibes — ${seed}`)}">
<meta property="og:description" content="${escapeHtml(mood)}">
<meta property="og:image" content="${escapeHtml(`${ORIGIN}${og}`)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="theme-color" content="${v.palette[0]}">
<link rel="stylesheet" href="/tealstripes.css">
<link rel="stylesheet" href="/set-ring.css">
<link rel="stylesheet" href="/pinch.css">
<link rel="stylesheet" href="/text-scale.css">
<link rel="stylesheet" href="/clean-still.css">
<link rel="stylesheet" href="/slot-scrub.css">
<script src="/text-scale-head.js"></script>
<link rel="modulepreload" id="text-pinch" href="${PINCH_TEXT}">
<style id="vibe-style">${vibeCss(v)}</style>
<script type="module" src="/tealstripes.js"></script>
</head>
<body>
<div class="field" id="field" role="img" aria-label="${escapeHtml(`${mood}: stripes of ${v.palette.join(", ")} at ${v.angle} degrees`)}"></div>
<canvas id="gl" aria-hidden="true"></canvas>
<main class="card" id="card" data-href="${escapeHtml(canonical)}" aria-label="Proof card">
  <h1 id="seed-name">${escapeHtml(ground ? "teal stripes" : seed)}</h1>
  <p class="mood" id="mood">${escapeHtml(mood)}</p>
  <dl>
    <dt id="mask-from">from ${escapeHtml(seed)}</dt><dd class="facet-row" id="mask">${chips}</dd>
    <dt id="filters-name"${filters.length ? "" : " hidden"}>filters</dt><dd id="filters"${filters.length ? "" : " hidden"}>${escapeHtml(filters.join(", "))}</dd>
    <dt>hour</dt><dd id="hour">this hour</dd>
    <dt>stamp</dt><dd id="stamp">unsigned</dd>
  </dl>
  <p class="expr" id="expr">${escapeHtml(expression || Object.keys(SEEDS).map((s) => `/${s}`).join(" · "))}</p>
  <nav aria-label="This vibe">
    <a id="tuple-link" href="${escapeHtml(tuple)}">tuple</a>
    <a id="self-link" href="${escapeHtml(canonical)}">link</a>
    <a id="og-link" href="${escapeHtml(og)}">preview</a>
    <a id="lock-link" href="/@lock" title="The vibe mutex.buzz's lock holds, filling in as the hold runs">the lock</a>
  </nav>
  <p class="lock" id="lock" hidden></p>
  <details id="grammar">
    <summary>Read the address <kbd>?</kbd></summary>
    <ul id="facets">${facets}</ul>
    <p>/seed/mask/filters · mask letters or sigils · filters: ${Object.keys(FILTERS).join(", ")} · ?angle= drift= breath= grain= turn= beats= steps= say= · tap a part of the expression to hold it: <kbd>←</kbd><kbd>→</kbd> scan, <kbd>r</kbd> reroll, <kbd>Enter</kbd> keep, <kbd>Esc</kbd> let go; <kbd>R</kbd> rerolls them all · <kbd>t</kbd> tune · <kbd>h</kbd> hide · <kbd>s</kbd> stamp · <kbd>c</kbd> copy</p>
  </details>
  <p class="held" id="held" hidden><span class="held-name" id="held-name"></span> <button type="button" id="held-prev" aria-label="The choice before">‹</button> <output id="held-value"></output> <button type="button" id="held-next" aria-label="The choice after">›</button> <span class="held-count" id="held-count"></span> <button type="button" id="held-reroll">reroll <kbd>r</kbd></button> <button type="button" id="held-keep">keep</button> <button type="button" id="held-go">let go</button></p>
  <p class="caption" id="caption" hidden></p>
  <details class="tune" id="tune" hidden>
    <summary>Tune it <kbd>t</kbd></summary>
    <div class="tune-grid">
${["angle", "drift", "breath", "grain", "beats", "steps"].map((key) => `      <label><span>${key}</span><input type="range" id="t-${key}" data-tune="${key}" min="${TUNING[key].min}" max="${TUNING[key].max}" step="${TUNING[key].step}"><output id="o-${key}"></output></label>`).join("\n")}
    </div>
    <p class="tune-ways"><button type="button" id="t-turn">turn the palette</button> <button type="button" data-filter="moire" aria-pressed="false">moiré</button> <button type="button" data-filter="golden" aria-pressed="false">golden</button> <button type="button" data-filter="euclid" aria-pressed="false">euclid</button> <button type="button" id="t-reset">as written</button></p>
    <label class="say"><span>say</span><input type="text" id="t-say" maxlength="60" placeholder="a caption, for the card and the share"></label>
  </details>
  <p class="share" id="share" hidden><span>share as</span> <button type="button" data-share="post">post</button> <button type="button" data-share="story">story</button> <button type="button" data-share="card">card</button> <button type="button" id="hide">hide <kbd>h</kbd></button></p>
  <p class="status" id="status" role="status" aria-live="polite"></p>
  <p class="keep"><button type="button" id="keep-app" hidden>Keep it on this device</button></p>
</main>
</body>
</html>
`;
}

const seedPage = (seed) => shell({ seed, mask: ALL, filters: [], title: `${seed} · ${moodOf(seed)} — Teal Stripes Vibes`, mood: SEEDS[seed].mood, canonical: `${ORIGIN}${canonicalPath({ seed, mask: ALL, filters: [] })}` });

/** Full-bleed bitmap exports for the installed app. */
export const ICONS = Object.freeze({
  "icon-192.png": { size: 192 },
  "icon-512.png": { size: 512 },
  "icon-maskable-512.png": { size: 512, purpose: "maskable" },
  "apple-touch-icon.png": { size: 180 },
});
function manifest() {
  return `${JSON.stringify({
    name: "Teal Stripes Vibes",
    short_name: "tsv",
    description: "A proof card you can link to: a named look of stripes, masked and filtered by its address.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: GROUND.palette[0],
    theme_color: GROUND.palette[0],
    icons: [
      ...Object.entries(ICONS).filter(([name]) => name.startsWith("icon-")).map(([name, icon]) => ({ src: `/icons/${name}`, sizes: `${icon.size}x${icon.size}`, type: "image/png", purpose: icon.purpose ?? "any" })),
    ],
    shortcuts: Object.entries(SEEDS).map(([seed, s]) => ({ name: seed, description: s.mood, url: `/${seed}` })),
  }, null, 2)}\n`;
}

/** Every file a vibe needs; with these kept, any address paints offline, since the shell reads it in the page. */
const SHELL = ["/", "/index.html", ...Object.keys(SEEDS).map((s) => `/${s}`), "/tealstripes.js", "/vibe.js", "/lib/hold.js", "/tealstripes.css", "/set-ring.js", "/set-ring.css", "/pinch.js", "/pinch.css", "/text-scale.js", "/text-scale.css", "/text-scale-head.js", "/clean-still.js", "/clean-still.css", "/slot-scrub.js", "/slot-scrub.css", PINCH_TEXT, "/favicon.svg", "/manifest.webmanifest", ...Object.keys(ICONS).map((n) => `/icons/${n}`)];

function serviceWorker(version) {
  return `// Written by workers/tealstripesvibes/carry.mjs. Pages from the network when there is one, else the kept shell, which paints any address.
const CACHE = "tealstripes-${version}";
const SHELL = ${JSON.stringify(SHELL)};
const SCRIPTED = /^\\/(m|stamp|og)\\/|^\\/tuple$|\\.json$/;
const CODE = /\\.(?:js|css)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL.map((path) => new Request(path, { cache: "reload" })))).then(() => self.skipWaiting()));
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
  if (CODE.test(url.pathname) && !url.pathname.startsWith("/peer/")) {
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
    });
    return hit ?? fresh;
  }));
});
`;
}

function headersFile() {
  const rule = (pattern, lines) => [pattern, ...lines.map((line) => `  ${line}`), ""].join("\n");
  return [
    "# Written by workers/tealstripesvibes/carry.mjs. These cover files; the worker's routes send their own.",
    rule("/*", ["X-Content-Type-Options: nosniff", "Referrer-Policy: strict-origin-when-cross-origin", "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()", `Content-Security-Policy: ${CSP}`]),
    rule("/*.js", ["Cache-Control: public, max-age=300", "Content-Type: text/javascript; charset=UTF-8"]),
    rule("/*.css", ["Cache-Control: public, max-age=300"]),
    rule("/icons/*", ["Cache-Control: public, max-age=86400"]),
    rule("/manifest.webmanifest", ["Cache-Control: public, max-age=300", "Content-Type: application/manifest+json"]),
    rule("/sw.js", ["Cache-Control: no-cache"]),
    rule("/*.txt", ["Cache-Control: public, max-age=300", "Content-Type: text/plain; charset=UTF-8"]),
  ].join("\n");
}

const LLMS = `# tealstripesvibes.com

A proof card you can link to. A seed is a named look (palette, stripe rhythm, angle, motion, grain, an optional plate). A mask lets some of its facets through and the canonical teal stripes stand in for the rest; filters then change what passed, in order. The same address always paints the same picture.

- /                            this hour's vibe (it becomes /@2026-11-16T21)
- /@2026-11-16T21              the hour's vibe, a seed picked by the hour
- /harbor                      a seed, every facet
- /harbor/pr                   palette and rhythm through; the rest is the ground
- /harbor/pr/night,hush        then filters, in order
- /tuple?seed=harbor&mask=pr   the filtered seed as data (JSON, or Spw lines with Accept: text/plain)
- /og/harbor/pr.svg            a preview image
- /@lock                       the vibe mutex.buzz's lock holds: one seed for the whole hold, chosen by its holder, that fills in facet by facet as the hold runs, from the ground's teal on its first hour to the whole seed on its last (read from https://mutex.buzz/now.json)
- /harbor/-/moire,euclid       new filters: moire (a second stripe a hair off the first, interfering), euclid (a Euclidean rhythm, Bjorklund's algorithm), golden (Fibonacci widths at the golden angle)
- /harbor?angle=40&drift=1.2&beats=3&steps=8&turn=1&say=hello   tuned by hand: angle, drift, breath, grain, a palette turn, a Euclidean rhythm of beats in steps, and a caption; the page writes the address as it is tuned, so the link is still the picture

Seeds: ${Object.entries(SEEDS).map(([s, x]) => `${s} (${x.mood})`).join(", ")}. Mask letters: ${FACETS.map((f) => `${f.letter} ${f.name} (${f.sigil})`).join(", ")}. Filters: ${Object.entries(FILTERS).map(([f, says]) => `${f} (${says})`).join(", ")}.
`;

export async function carried() {
  return [
    ["vibe.js", await readFile(path.join(HERE, "src/vibe.js"), "utf8")],
    ["lib/hold.js", await readFile(path.join(HERE, "../lib/hold.js"), "utf8")],
    // The set's ring, shared by the set's pages (workers/lib/set-ring.js).
    ["set-ring.js", await readFile(path.join(HERE, "../lib/set-ring.js"), "utf8")],
    ["set-ring.css", await readFile(path.join(HERE, "../lib/set-ring.css"), "utf8")],
    ["pinch.js", await readFile(path.join(HERE, "../lib/pinch.js"), "utf8")],
    ["pinch.css", await readFile(path.join(HERE, "../lib/pinch.css"), "utf8")],
    ["text-scale.js", await readFile(path.join(HERE, "../lib/text-scale.js"), "utf8")],
    ["text-scale.css", await readFile(path.join(HERE, "../lib/text-scale.css"), "utf8")],
    ["text-scale-head.js", await readFile(path.join(HERE, "../lib/text-scale-head.js"), "utf8")],
    ["clean-still.js", await readFile(path.join(HERE, "../lib/clean-still.js"), "utf8")],
    ["clean-still.css", await readFile(path.join(HERE, "../lib/clean-still.css"), "utf8")],
    ["slot-scrub.js", await readFile(path.join(HERE, "../lib/slot-scrub.js"), "utf8")],
    ["slot-scrub.css", await readFile(path.join(HERE, "../lib/slot-scrub.css"), "utf8")],
    ["index.html", shell({ seed: Object.keys(SEEDS)[0], mask: "", filters: [], title: "Teal Stripes Vibes", mood: "teal stripes", canonical: `${ORIGIN}/`, ground: true })],
    ...Object.keys(SEEDS).map((seed) => [`${seed}.html`, seedPage(seed)]),
    ["favicon.svg", FAVICON],
    ["robots.txt", "User-agent: *\nAllow: /\n"],
    ["ecosystem.json", JSON.stringify(ecosystemJson, null, 2)],
    ["registry.json", JSON.stringify(ecosystemJson, null, 2)],
    ["llms.txt", LLMS],
    ["manifest.webmanifest", manifest()],
    ["_headers", headersFile()],
  ];
}

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** The carried files and the service worker named for them, with the hand-written page files and the icons in its hash. */
export async function carriedWithWorker() {
  const files = await carried();
  const hash = createHash("sha256");
  for (const [name, body] of files) hash.update(name).update(body);
  for (const name of ["tealstripes.js", "tealstripes.css"]) hash.update(name).update(await readFile(path.join(ASSETS, name)));
  for (const [name, { size }] of Object.entries(ICONS)) {
    const bytes = await readFile(path.join(ASSETS, "icons", name));
    hash.update(name).update(assertIconPng(bytes, size, name));
  }
  return [...files, ["sw.js", serviceWorker(hash.digest("hex").slice(0, 12))]];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  const drift = (await writeOrCheck(ASSETS, await carriedWithWorker(), { check, label: "tealstripes-carry", hint: "run node workers/tealstripesvibes/carry.mjs" }));
  if (check && drift) process.exit(1);
  if (!check) console.log("[tealstripes-carry] wrote the shell, the seeds, the host's files and the app into workers/tealstripesvibes/assets");
}
