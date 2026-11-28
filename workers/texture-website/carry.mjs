// Carries texture.website's vocabulary (src/vocabulary.js) into assets/: the
// vocabulary as vocabulary.json, each listed material's prompt starter (/terrazzo.txt)
// and line (/terrazzo.spw), the page every path falls back to, llms.txt and
// _headers. The page (assets/texture.js) builds prompts from the address and
// sketches them in the reader's browser; nothing runs on a server.
// --check fails when a carried file differs from what this would write.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";
import { securityHeaders, escapeHtml } from "../lib/http.js";
import { writeOrCheck } from "../lib/carry.js";
import { peerScriptPath } from "../lib/peer-kit.js";
import { CLASSES, FORMATS, LADDERS, LIGHT_FROM, MATERIALS, NEAR, PALETTES, PHRASES, PIVOTS, RELATIONS, TECHNIQUES, VIEWS } from "./src/vocabulary.js";
import { TILE, materialPng } from "./src/raster.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "assets");
const ORIGIN = "https://texture.website";
const NO = "--no text, letters, logo, watermark";

/** Another material from a different class, to suggest a pairing. */
const partner = (m) => { const i = MATERIALS.indexOf(m); return [...MATERIALS.slice(i + 1), ...MATERIALS.slice(0, i)].find((other) => other.cls !== m.cls); };

const starter = (m) => {
  const q = CLASSES[m.cls].qualities.slice(0, 2).join(", ");
  const p = partner(m);
  return `${m.word} (texture.website/${m.slug}), ${m.cls}
${CLASSES[m.cls].science}
Qualities to try: ${CLASSES[m.cls].qualities.join(", ")}
Image, to hand Midjourney as a style reference or an image prompt: ${ORIGIN}/${m.slug}.png

As a style reference:
  your subject --sref ${ORIGIN}/${m.slug}.png --sw 250

As a tile:
  ${FORMATS.tile.lead} ${m.word}, close view, soft overcast light, ${q} ${FORMATS.tile.params} ${NO}
As a backdrop:
  ${FORMATS.plate.lead} ${m.word}, across a room, raking dawn light, weathered ${FORMATS.plate.params} ${NO}
With another material:
  ${FORMATS.tile.lead} ${m.word} drifting through ${p.word}, close view, warm lamplight ${FORMATS.tile.params} ${NO}

Composed and tuned on the page:
  ${ORIGIN}/${m.slug}/~${p.slug}?light=lamplight&wear=worn&process=riso
`;
};

const line = (m) => `#>texture_${m.slug.replaceAll("-", "_")}
#:material #!${m.cls}

~${m.slug}[${m.cls}]{${CLASSES[m.cls].qualities.slice(0, 3).join(", ")}}

word: "${m.word}"
science: "${CLASSES[m.cls].science}"
`;

const LLMS = `# texture.website

A studio for building material prompts. The address is the prompt: each word in the path is a material, bottom first, written into the sentence as it stands; a hyphen is a space. A mark before a word is how it meets the material before it: ${Object.entries(RELATIONS).filter(([mark]) => mark).map(([mark, r]) => `${mark} ${r.says}`).join(", ")}. In a path the ? mark is written %3F. Any word works; listed words carry a class with tactile qualities and a science note.

Ladders, as query keys whose values are words (hyphens for spaces):
${Object.entries(LADDERS).map(([key, words]) => `- ${key}: ${words.join(", ")}`).join("\n")}
With no material in the path, the day composes a pair and a look (scale, light, wear, process, scene, format), so each morning is a different picture. A cycle of the catalog visits each material once, and the next morning is not today's material or today's word on any of those six ladders. day=2026-12-01 fixes a date, d=2 moves from today by days. A ladder in the query keeps the reader's word. r rolls every ladder from a seed; say and as put words in a speech bubble. On a phone the picture, that sentence, the line and six steppers are the whole panel; studio opens the rungs, pivots and catalog. The page installs. After one visit the shell stays on the device, and a picture opened once stays for the next time there is no network.

Views: a first path word ending in @ is whose eyes the page is seen through: ${Object.entries(VIEWS).map(([key, v]) => `/${key}@/ (${v.name}, ${v.says})`).join("; ")}.

Pivots, as query keys, each teaching one of ${Object.keys(TECHNIQUES).length} documented techniques: tile (format=tile seamless repeat), exclude (drop one quality via --no at -0.5 weight), perm (a ladder written as a permutation), weigh (materials as weighted multi-prompts), chaos, weird, stylize (numbers), raw, sref (random), seed (a number), invert (reverse the layers by reversing the path), and lens (aesthetic genre). Techniques with their sources are in /vocabulary.json.

The page includes an inline material-layer composer, a 2×2 seamless tile preview, visual catalog swatches with class filters, steppers for the six look ladders (tap the word to step), and the line beside the picture. Scale, light, wear and process sit in the mode, so a sideways drag on a slot scrubs the look without leaving the line. Tap steps; the drag paints the picture while the finger is down:
  ~terrazzo[close, lamplight, worn, riso]{~sea-glass}(wall)<tile>

It writes a Midjourney prompt (with --tile or an aspect ratio by format), the same prompt with its materials' images in front (--sref), a plain prompt for any model, a CSS background snippet, a Spw line, and direct links to frame the surface on attention.productions (the material and the light), arrange that same line on factshift.center (?spw=), or open it on spw.quest (/build?script=, which still reads the query). Its card takes the composition as .txt, .spw, .json, .md, or a square .svg that marks the day.

Readings: /vocabulary.json (classes, materials, ladders, phrases, techniques, pivots, views), /{material}.png (a seamless 384px tile, open to any origin, to hand an image model as an image prompt or style reference), /{material}.txt (prompt starters with that image's address), /{material}.spw (the material as a line), /images.json (each image's hash).

Classes: ${Object.keys(CLASSES).join(", ")}
`;

const PIVOT_FALLBACK_HREF = {
  invert: "/sea-glass/~terrazzo",
  tile: "/?format=tile",
  permute: "/?perm=light",
  weigh: "/?weigh=1",
  exclude: "/?exclude=foxing",
  chaos: "/?chaos=25",
  weird: "/?weird=250",
  stylize: "/?stylize=250",
  raw: "/?raw=1",
  sref: "/?sref=random",
  seed: "/?seed=42",
  lens: "/?lens=risograph-botanica",
};

/** spwashi.com's pinch for text, carried by scripts/build-peer-kit.mjs (workers/lib/text-scale.js binds it). */
const PINCH_TEXT = peerScriptPath("pinch-text-scale");
/** The set's files texture.website carries from workers/lib: the ring, the still bar, the scrub, the text size. */
const SET_FILES = ["set-ring.js", "set-ring.css", "text-scale.js", "text-scale.css", "text-scale-head.js", "clean-still.js", "clean-still.css", "slot-scrub.js", "slot-scrub.css"];

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>texture.website</title>
  <meta name="description" content="A studio for building material prompts: words in the address become materials, ladders of words tune scale, light, wear, process, scene and format.">
  <meta name="theme-color" content="#1d1d1b">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icon-512.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/texture.css">
  <link rel="stylesheet" href="/set-ring.css">
  <link rel="stylesheet" href="/text-scale.css">
  <link rel="stylesheet" href="/clean-still.css">
  <link rel="stylesheet" href="/slot-scrub.css">
  <script src="/text-scale-head.js"></script>
  <link rel="modulepreload" id="text-pinch" href="${PINCH_TEXT}">
  <!-- The studio's module graph and its vocabulary, asked for with the page instead of one after another (the picture waits on both). -->
  ${["/texture.js", "/daily.js", "/lib/near-word.js", "/clean-still.js", "/slot-scrub.js", "/set-ring.js", "/text-scale.js"].map((href) => `<link rel="modulepreload" href="${href}">`).join("\n  ")}
  <link rel="preload" href="/vocabulary.json" as="fetch" crossorigin>
  <script type="module" src="/texture.js"></script>
</head>
<body>
  <svg class="defs" aria-hidden="true" focusable="false"><filter id="material" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"></filter></svg>
  <main id="texture">
    <figure class="slide">
      <nav class="views" aria-label="Views"><a href="/">texture.website</a>${Object.entries(VIEWS).map(([key, v]) => `<a href="/${key}@/">${escapeHtml(v.name)}</a>`).join("")}</nav>
      <header class="slide-head"><span class="fig">Fig.</span> <span class="title">texture.website</span> <span class="when"></span> <span class="view-tools" role="group" aria-label="How the picture is shown"><button type="button" class="tile-toggle" aria-pressed="false" title="Inspect 2×2 tile repeat and seam lines">2×2 tile</button><button type="button" class="split-toggle" aria-pressed="false" title="Compare the drawn materials with the tuned picture; drag across the picture to move the line">split</button></span></header>
      <div class="stage" aria-label="A sketch of the prompt"><div class="layers"></div><div class="layers-drawn" aria-hidden="true"></div><div class="seam-grid" aria-hidden="true"></div><button type="button" class="split-handle" role="slider" aria-label="Where the drawn materials meet the tuned picture" aria-valuemin="4" aria-valuemax="96" aria-valuenow="50" hidden></button><p class="bubble" hidden></p></div>
      <div class="still-context" aria-label="Active composition context"></div>
      <figcaption class="caption">A studio for building material prompts. Each word in the address is a material; each ladder is a word in the sentence.</figcaption>
      <p class="read-note" role="status" hidden></p>
      <div class="layer-bar" aria-label="Material layers" hidden></div>
      <p class="day-prompt" hidden></p>
      <div class="panel-line" aria-label="The line" hidden></div>
      <div class="tune" aria-label="Tune" hidden></div>
      <div class="panel-actions" hidden></div>
    </figure>
    <datalist id="material-list">${MATERIALS.map((m) => `<option value="${escapeHtml(m.word)}"></option>`).join("")}</datalist>
    <section class="ladders" aria-label="Ladders" hidden></section>
    <section class="pivots" aria-label="Pivots">
      <h2 class="band-name">pivot</h2>
      <div class="pivot-row">${PIVOTS.map((p) => `<div class="pivot"><a class="pivot-link" href="${escapeHtml(PIVOT_FALLBACK_HREF[p.id] ?? "/")}">${escapeHtml(p.label)}</a><span class="says">${escapeHtml(p.says)}</span></div>`).join("")}</div>
    </section>
    <article class="card" aria-label="The composition, to share and take"></article>
    <section class="catalog" aria-labelledby="catalog-head">
      <h2 id="catalog-head">Materials by class</h2>
      <p class="catalog-kept" role="status" hidden></p>
      <nav class="catalog-filters" aria-label="Filter materials by class"><button type="button" data-class="all" aria-pressed="true">all (${MATERIALS.length})</button>${Object.entries(CLASSES).map(([cls, c]) => `<button type="button" data-class="${escapeHtml(cls)}" aria-pressed="false">${escapeHtml(cls)} (${c.materials.length})</button>`).join("")}</nav>
${Object.entries(CLASSES).map(([cls, c]) => `      <article class="class" data-class="${escapeHtml(cls)}"><h3>${escapeHtml(cls)}</h3><p>${escapeHtml(c.science)}</p><div class="swatches">${c.materials.map((word) => { const m = MATERIALS.find((each) => each.word === word); return `<span class="swatch-item"><a class="swatch" href="/${m.slug}"><img src="/${m.slug}.png" alt="" width="36" height="36" loading="lazy"><span>${escapeHtml(word)}</span></a> <a class="png" href="/${m.slug}.png" title="the image of ${escapeHtml(word)}, for Midjourney">png</a></span>`; }).join("")}</div></article>`).join("\n")}
    </section>
  </main>
</body>
</html>
`;

// manifest-src and worker-src are named: with default-src 'none' a browser will not fetch the manifest, and the page never installs.
const CSP = "default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";

function headersFile() {
  const rules = [`# Written by workers/texture-website/carry.mjs.`, `/*`, ...Object.entries(securityHeaders({ csp: CSP })).map(([n, v]) => `  ${n}: ${v}`), ""];
  const cache = (pattern, value, extra = []) => rules.push(pattern, `  Cache-Control: ${value}`, ...extra, "");
  // One rule per extension: Cloudflare allows 100 rules, and every reading of a kind shares its headers (llms.txt among the .txt).
  const text = ["  Content-Type: text/plain; charset=UTF-8", "  Access-Control-Allow-Origin: *"];
  cache("/*.txt", "public, max-age=300", text);
  cache("/*.spw", "public, max-age=300", text);
  // Images other sites and image models fetch by address.
  cache("/*.png", "public, max-age=86400", ["  Cross-Origin-Resource-Policy: cross-origin", "  Access-Control-Allow-Origin: *"]);
  cache("/vocabulary.json", "public, max-age=300", ["  Access-Control-Allow-Origin: *"]);
  cache("/sw.js", "no-cache");
  cache("/manifest.webmanifest", "public, max-age=300", ["  Content-Type: application/manifest+json; charset=UTF-8"]);
  cache("/favicon.svg", "public, max-age=86400", ["  Content-Type: image/svg+xml"]);
  return rules.join("\n");
}

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#f2f0eb"/><path d="M0 8h32M0 16h32M0 24h32M8 0v32M16 0v32M24 0v32" stroke="#1d1d1b" stroke-width="1"/><rect x="0" y="26" width="32" height="6" fill="#c8402a"/></svg>\n`;

const MANIFEST = `${JSON.stringify({
  name: "texture.website",
  short_name: "texture",
  description: "A studio for building material prompts. The address is the picture, and the line is the look.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#f2f0eb",
  theme_color: "#1d1d1b",
  categories: ["design", "productivity"],
  icons: [
    { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
  // Long-press the home-screen mark: the day's picture, the catalog, or a view.
  shortcuts: [
    { name: "Today's picture", short_name: "Today", url: "/", description: "The day's two materials and their look." },
    { name: "Materials by class", short_name: "Catalog", url: "/catalog", description: "Every material, kept for offline once opened." },
    ...Object.entries(VIEWS).map(([key, view]) => ({ name: view.name, short_name: view.name.replace(/@$/, ""), url: `/${key}@/`, description: view.says })),
  ].map((shortcut) => ({ ...shortcut, icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] })),
  // Words shared from another app open as materials (texture.js reads /share).
  share_target: { action: "/share", method: "GET", enctype: "application/x-www-form-urlencoded", params: { title: "title", text: "text", url: "url" } },
}, null, 2)}\n`;

/**
 * The shell the service worker keeps at install. Pictures are kept apart, in a
 * cache named for their own hashes, so a deploy that leaves the images alone
 * leaves the kept copies alone; the page asks for all of them once it is idle.
 */
const SHELL = ["/", "/texture.css", "/texture.js", "/daily.js", "/lib/near-word.js", ...SET_FILES.map((file) => `/${file}`), PINCH_TEXT, "/vocabulary.json", "/favicon.svg", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"];

function serviceWorker(version, picturesVersion) {
  return `// Written by workers/texture-website/carry.mjs. The day's picture is chosen in the page, so this shell opens it with no network.
const CACHE = "texture-${version}";
// The materials' pictures, named for their hashes (images.json): a deploy that leaves them alone keeps them.
const PICTURES = "texture-pictures-${picturesVersion}";
const SHELL = ${JSON.stringify(SHELL)};
const CODE = /\\.(?:js|css|json)$/;
const PICTURE = /^\\/[a-z0-9-]+\\.png$/;

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
`;
}

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/**
 * An interlaced textile and red band, scaled for the home screen. Same bytes every run. Maskable,
 * the weave runs to every edge and the red band sits inside the circle a
 * launcher may cut to (the middle 80%), so no mask clips the mark.
 */
export function iconPng(size = 192, { maskable = false } = {}) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const band = maskable ? y >= Math.round(size * 0.6) && y < Math.round(size * 0.72) : y >= Math.round(size * 26 / 32);
      const u = (x + 0.5) / size, v = (y + 0.5) / size;
      const warp = (u * 4 % 1) - 0.5, weft = (v * 4 % 1) - 0.5;
      const vertical = Math.abs(warp) < 0.27, horizontal = Math.abs(weft) < 0.27;
      const over = (Math.floor(u * 4) + Math.floor(v * 4)) % 2 === 0;
      const warpOnTop = vertical && (!horizontal || over);
      const thread = warpOnTop ? warp : horizontal ? weft : null;
      const lamp = 14 * (1 - u - v);
      const rib = thread === null ? 0 : 3 * Math.cos(thread * Math.PI * 42);
      const curve = thread === null ? 0 : 24 * Math.cos((thread + 0.09) * Math.PI / 0.68);
      const shade = Math.round(lamp + rib + curve);
      const color = thread === null ? [0xc5, 0xba, 0xa8] : warpOnTop ? [0x3c, 0x49, 0x40] : [0xa9, 0x8f, 0x70];
      const o = row + 1 + x * 4;
      raw[o] = band ? 0xc8 : color[0] + shade;
      raw[o + 1] = band ? 0x40 : color[1] + shade;
      raw[o + 2] = band ? 0x2a : color[2] + shade;
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk("IHDR", ihdr), pngChunk("IDAT", deflateSync(raw, { level: 9 })), pngChunk("IEND", Buffer.alloc(0))]);
}

export async function carried() {
  const vocabulary = { site: "texture.website", note: "the science notes are drafts; parameters change between Midjourney versions, so each technique says where to check", classes: CLASSES, materials: MATERIALS.map((m) => ({ ...m, image: `/${m.slug}.png` })), tile: TILE, ladders: LADDERS, near: NEAR, palettes: PALETTES, lightFrom: LIGHT_FROM, phrases: PHRASES, formats: FORMATS, relations: RELATIONS, techniques: TECHNIQUES, pivots: PIVOTS, views: VIEWS };
  const shared = await Promise.all([...SET_FILES, "near-word.js"].map(async (file) => [file === "near-word.js" ? `lib/${file}` : file, await readFile(path.join(HERE, "../lib", file), "utf8")]));
  return [
    ...MATERIALS.flatMap((m) => [[`${m.slug}.txt`, starter(m)], [`${m.slug}.spw`, line(m)]]),
    ...shared,
    ["vocabulary.json", `${JSON.stringify(vocabulary, null, 2)}\n`],
    ["index.html", PAGE],
    ["llms.txt", LLMS],
    ["robots.txt", "User-agent: *\nAllow: /\n"],
    ["_headers", headersFile()],
    ["favicon.svg", FAVICON],
    ["manifest.webmanifest", MANIFEST],
  ];
}

/** The carried text plus the service worker named for it and for the hand-written page. */
export async function carriedShell() {
  const files = await carried();
  const pictures = createHash("sha256").update(await readFile(path.join(ASSETS, "images.json"))).digest("hex").slice(0, 12);
  const hash = createHash("sha256");
  for (const [name, body] of files) hash.update(name).update(typeof body === "string" ? body : body);
  for (const size of [192, 512]) hash.update(iconPng(size));
  for (const name of ["texture.css", "texture.js", "daily.js"]) hash.update(await readFile(path.join(ASSETS, name)));
  hash.update(iconPng(512, { maskable: true }));
  return [...files, ["sw.js", serviceWorker(hash.digest("hex").slice(0, 12), pictures)]];
}

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

/**
 * Each material's image, drawn by src/raster.js. Drawing all of them takes most
 * of a minute, so --check reads a manifest instead: the renderer's own hash and
 * each file's hash. A change to the renderer or the vocabulary, or to any image,
 * shows as drift without drawing anything.
 */
async function images(check) {
  const renderer = sha(await readFile(path.join(HERE, "src/raster.js")));
  const file = path.join(ASSETS, "images.json");
  if (check) {
    const manifest = JSON.parse(await readFile(file, "utf8").catch(() => "{}"));
    const want = MATERIALS.map((m) => m.slug);
    let drift = manifest.renderer === renderer && JSON.stringify(Object.keys(manifest.files ?? {})) === JSON.stringify(want) ? 0 : 1;
    if (drift) console.error("[texture-carry] the images were drawn by another renderer or vocabulary; run node workers/texture-website/carry.mjs");
    for (const slug of want) {
      const bytes = await readFile(path.join(ASSETS, `${slug}.png`)).catch(() => null);
      if (!bytes || sha(bytes) !== manifest.files?.[slug]) { drift += 1; console.error(`[texture-carry] assets/${slug}.png differs from its manifest`); }
    }
    return drift;
  }
  if (!check && !process.argv.includes("--force-images") && (await images(true)) === 0) return 0;
  const files = {};
  for (const m of MATERIALS) {
    const bytes = materialPng(m);
    await writeFile(path.join(ASSETS, `${m.slug}.png`), bytes);
    files[m.slug] = sha(bytes);
  }
  await mkdir(ASSETS, { recursive: true });
  await writeFile(file, `${JSON.stringify({ renderer, tile: TILE, files }, null, 2)}\n`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  const icons = [["192", iconPng(192)], ["512", iconPng(512)], ["maskable-512", iconPng(512, { maskable: true })]];
  // The images first: the service worker names its picture cache for images.json.
  let drift = await images(check);
  drift += await writeOrCheck(ASSETS, await carriedShell(), { check, label: "texture-carry", hint: "run node workers/texture-website/carry.mjs" });
  for (const [size, icon] of icons) {
    const iconFile = path.join(ASSETS, `icon-${size}.png`);
    if (check) {
      const current = await readFile(iconFile).catch(() => Buffer.alloc(0));
      if (!current.equals(icon)) { drift += 1; console.error(`[texture-carry] assets/icon-${size}.png differs; run node workers/texture-website/carry.mjs`); }
    } else {
      await mkdir(ASSETS, { recursive: true });
      await writeFile(iconFile, icon);
    }
  }
  if (check && drift) process.exit(1);
  if (!check) console.log(`[texture-carry] wrote ${MATERIALS.length} materials in ${Object.keys(CLASSES).length} classes into workers/texture-website/assets`);
}
