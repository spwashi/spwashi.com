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
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { escapeHtml } from "../lib/http.js";
import { writeOrCheck } from "../lib/carry.js";
import { rgbOf, squarePng } from "../lib/png.js";
import { ecosystemJson } from "../site-hub-next/src/hosts/ecosystem.js";
import { ALL, FACETS, FILTERS, GROUND, HOST, SEEDS, canonicalPath, expressionOf, maskLabel, vibe, vibeCss } from "./src/vibe.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "assets");
const ORIGIN = `https://${HOST}`;

export const CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'self' https://attention.productions https://mutex.buzz; upgrade-insecure-requests";

/** The routes the worker answers; everything else is a file. */
export const SCRIPT_ROUTES = Object.freeze(["/m/*", "/stamp/*", "/tuple", "/og/*", "/*.json"]);

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${GROUND.palette[0]}"/><path d="M6 26 26 6M-2 18 18-2M14 34 34 14" stroke="${GROUND.palette[1]}" stroke-width="5"/></svg>
`;

/** The page: one shell for every vibe, written here for a seed or for the ground the script repaints. */
function shell({ seed, mask, filters, title, mood, canonical, ground = false }) {
  const v = vibe(seed, mask, filters);
  const expression = ground ? "" : expressionOf(seed, mask, filters, v);
  const facets = FACETS.map((f) => `<li class="${mask.includes(f.letter) ? "on" : "off"}"><code>${escapeHtml(f.sigil)}</code><code>${f.letter}</code> ${f.name}</li>`).join("");
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
    <dt>mask</dt><dd id="mask">${escapeHtml(maskLabel(mask))}${filters.length ? ` · ${escapeHtml(filters.join(", "))}` : ""}</dd>
    <dt>hour</dt><dd id="hour">this hour</dd>
    <dt>stamp</dt><dd id="stamp">unsigned</dd>
  </dl>
  <p class="expr" id="expr">${escapeHtml(expression || Object.keys(SEEDS).map((s) => `/${s}`).join(" · "))}</p>
  <nav aria-label="This vibe">
    <a id="tuple-link" href="${escapeHtml(tuple)}">tuple</a>
    <a id="self-link" href="${escapeHtml(canonical)}">link</a>
    <a id="og-link" href="${escapeHtml(og)}">preview</a>
  </nav>
  <details id="grammar">
    <summary>Read the address <kbd>?</kbd></summary>
    <ul id="facets">${facets}</ul>
    <p>/seed/mask/filters · mask letters or sigils · filters: ${Object.keys(FILTERS).join(", ")} · <kbd>s</kbd> stamp · <kbd>c</kbd> copy</p>
  </details>
  <p class="status" id="status" role="status" aria-live="polite"></p>
  <p class="keep"><button type="button" id="keep-app" hidden>Keep it on this device</button></p>
</main>
</body>
</html>
`;
}

const seedPage = (seed) => shell({ seed, mask: ALL, filters: [], title: `${seed} · ${ALL} — Teal Stripes Vibes`, mood: SEEDS[seed].mood, canonical: `${ORIGIN}${canonicalPath({ seed, mask: ALL, filters: [] })}` });

/** The icons: the ground's stripes at forty-five degrees, edge to edge, so a launcher's mask can take any shape from them. */
export const ICONS = Object.freeze({
  "icon-192.png": { size: 192 },
  "icon-512.png": { size: 512 },
  "icon-maskable-512.png": { size: 512, purpose: "maskable" },
  "apple-touch-icon.png": { size: 180 },
});
const stripes = (size) => {
  const colours = GROUND.palette.map(rgbOf);
  const band = size / 5.5;
  return squarePng(size, (x, y) => colours[[0, 1, 0, 2][Math.floor((x + y) / band) % 4]]);
};

function manifest() {
  return `${JSON.stringify({
    name: "Teal Stripes Vibes",
    short_name: "Teal Stripes",
    description: "A proof card you can link to: a named look of stripes, masked and filtered by its address.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: GROUND.palette[0],
    theme_color: GROUND.palette[0],
    icons: [
      ...Object.entries(ICONS).filter(([name]) => name.startsWith("icon-")).map(([name, icon]) => ({ src: `/icons/${name}`, sizes: `${icon.size}x${icon.size}`, type: "image/png", purpose: icon.purpose ?? "any" })),
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: Object.entries(SEEDS).map(([seed, s]) => ({ name: seed, description: s.mood, url: `/${seed}` })),
  }, null, 2)}\n`;
}

/** Every file a vibe needs; with these kept, any address paints offline, since the shell reads it in the page. */
const SHELL = ["/", "/index.html", ...Object.keys(SEEDS).map((s) => `/${s}`), "/tealstripes.js", "/vibe.js", "/tealstripes.css", "/favicon.svg", "/manifest.webmanifest", ...Object.keys(ICONS).map((n) => `/icons/${n}`)];

function serviceWorker(version) {
  return `// Written by workers/tealstripes-vibes/carry.mjs. Pages from the network when there is one, else the kept shell, which paints any address.
const CACHE = "tealstripes-${version}";
const SHELL = ${JSON.stringify(SHELL)};
const SCRIPTED = /^\\/(m|stamp|og)\\/|^\\/tuple$|\\.json$/;

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
`;
}

function headersFile() {
  const rule = (pattern, lines) => [pattern, ...lines.map((line) => `  ${line}`), ""].join("\n");
  return [
    "# Written by workers/tealstripes-vibes/carry.mjs. These cover files; the worker's routes send their own.",
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

Seeds: ${Object.entries(SEEDS).map(([s, x]) => `${s} (${x.mood})`).join(", ")}. Mask letters: ${FACETS.map((f) => `${f.letter} ${f.name} (${f.sigil})`).join(", ")}. Filters: ${Object.entries(FILTERS).map(([f, says]) => `${f} (${says})`).join(", ")}.
`;

export async function carried() {
  return [
    ["vibe.js", await readFile(path.join(HERE, "src/vibe.js"), "utf8")],
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
  for (const [name, icon] of Object.entries(ICONS)) hash.update(name).update(stripes(icon.size));
  return [...files, ["sw.js", serviceWorker(hash.digest("hex").slice(0, 12))]];
}

async function icons(check) {
  let drift = 0;
  for (const [name, icon] of Object.entries(ICONS)) {
    const want = stripes(icon.size);
    const target = path.join(ASSETS, "icons", name);
    if (check) {
      const have = await readFile(target).catch(() => null);
      if (!have || sha(have) !== sha(want)) { drift += 1; console.error(`[tealstripes-carry] assets/icons/${name} differs from what carry.mjs draws`); }
      continue;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, want);
  }
  return drift;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  const drift = (await writeOrCheck(ASSETS, await carriedWithWorker(), { check, label: "tealstripes-carry", hint: "run node workers/tealstripes-vibes/carry.mjs" })) + (await icons(check));
  if (check && drift) process.exit(1);
  if (!check) console.log("[tealstripes-carry] wrote the shell, the seeds, the host's files and the app into workers/tealstripes-vibes/assets");
}
