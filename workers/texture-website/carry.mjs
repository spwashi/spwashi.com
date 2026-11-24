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
import { CLASSES, FORMATS, LADDERS, MATERIALS, PHRASES, PIVOTS, RELATIONS, TECHNIQUES, VIEWS } from "./src/vocabulary.js";
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

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>texture.website</title>
  <meta name="description" content="A studio for building material prompts: words in the address become materials, ladders of words tune scale, light, wear, process, scene and format.">
  <meta name="theme-color" content="#1d1d1b">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/texture.css">
  <link rel="stylesheet" href="/clean-still.css">
  <script type="module" src="/texture.js"></script>
</head>
<body>
  <svg class="defs" aria-hidden="true" focusable="false"><filter id="material" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"></filter></svg>
  <main id="texture">
    <figure class="slide">
      <nav class="views" aria-label="Views"><a href="/">texture.website</a>${Object.entries(VIEWS).map(([key, v]) => `<a href="/${key}@/">${escapeHtml(v.name)}</a>`).join("")}</nav>
      <header class="slide-head"><span class="fig">Fig.</span> <span class="title">texture.website</span> <span class="when"></span> <button type="button" class="tile-toggle" aria-pressed="false" title="Inspect 2×2 tile repeat and seam lines">2×2 tile</button></header>
      <div class="stage" aria-label="A sketch of the prompt"><div class="layers"></div><div class="seam-grid" aria-hidden="true"></div><p class="bubble" hidden></p></div>
      <div class="still-context" aria-label="Active composition context"></div>
      <figcaption class="caption">A studio for building material prompts. Each word in the address is a material; each ladder is a word in the sentence.</figcaption>
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
      <nav class="catalog-filters" aria-label="Filter materials by class"><button type="button" data-class="all" aria-pressed="true">all (${MATERIALS.length})</button>${Object.entries(CLASSES).map(([cls, c]) => `<button type="button" data-class="${escapeHtml(cls)}" aria-pressed="false">${escapeHtml(cls)} (${c.materials.length})</button>`).join("")}</nav>
${Object.entries(CLASSES).map(([cls, c]) => `      <article class="class" data-class="${escapeHtml(cls)}"><h3>${escapeHtml(cls)}</h3><p>${escapeHtml(c.science)}</p><div class="swatches">${c.materials.map((word) => { const m = MATERIALS.find((each) => each.word === word); return `<span class="swatch-item"><a class="swatch" href="/${m.slug}"><img src="/${m.slug}.png" alt="" width="36" height="36" loading="lazy"><span>${escapeHtml(word)}</span></a> <a class="png" href="/${m.slug}.png" title="the image of ${escapeHtml(word)}, for Midjourney">png</a></span>`; }).join("")}</div></article>`).join("\n")}
    </section>
  </main>
</body>
</html>
`;

const CSP = "default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";

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
  icons: [
    { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  ],
}, null, 2)}\n`;

/** The shell the service worker keeps. Pictures are cached when a reader opens them, not all at once. */
const SHELL = ["/", "/texture.css", "/texture.js", "/daily.js", "/clean-still.js", "/clean-still.css", "/vocabulary.json", "/favicon.svg", "/manifest.webmanifest", "/icon-192.png"];

function serviceWorker(version) {
  return `// Written by workers/texture-website/carry.mjs. The day's picture is chosen in the page, so this shell opens it with no network.
const CACHE = "texture-${version}";
const SHELL = ${JSON.stringify(SHELL)};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
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
  event.respondWith(caches.match(request).then((hit) => {
    const fresh = fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); }
      return response;
    }).catch(() => hit);
    return hit ?? fresh;
  }));
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

/** A 192px weave, the mark on the home screen. Same bytes every run. */
export function iconPng(size = 192) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const edge = x < 10 || y < 10 || x >= size - 10 || y >= size - 10;
      const band = y >= size - 36;
      const weave = (Math.floor(x / 12) + Math.floor(y / 12)) % 2 === 0;
      const o = row + 1 + x * 4;
      raw[o] = edge ? 0x1d : band ? 0xc8 : weave ? 0xe7 : 0xf2;
      raw[o + 1] = edge ? 0x1d : band ? 0x40 : weave ? 0xe2 : 0xf0;
      raw[o + 2] = edge ? 0x1b : band ? 0x2a : weave ? 0xd8 : 0xeb;
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk("IHDR", ihdr), pngChunk("IDAT", deflateSync(raw, { level: 9 })), pngChunk("IEND", Buffer.alloc(0))]);
}

export async function carried() {
  const vocabulary = { site: "texture.website", note: "the science notes are drafts; parameters change between Midjourney versions, so each technique says where to check", classes: CLASSES, materials: MATERIALS.map((m) => ({ ...m, image: `/${m.slug}.png` })), tile: TILE, ladders: LADDERS, phrases: PHRASES, formats: FORMATS, relations: RELATIONS, techniques: TECHNIQUES, pivots: PIVOTS, views: VIEWS };
  const shared = await Promise.all(["clean-still.js", "clean-still.css"].map(async (file) => [file, await readFile(path.join(HERE, "../lib", file), "utf8")]));
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
  const hash = createHash("sha256");
  for (const [name, body] of files) hash.update(name).update(typeof body === "string" ? body : body);
  hash.update(iconPng());
  for (const name of ["texture.css", "texture.js", "daily.js"]) hash.update(await readFile(path.join(ASSETS, name)));
  return [...files, ["sw.js", serviceWorker(hash.digest("hex").slice(0, 12))]];
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
  const icon = iconPng();
  const iconFile = path.join(ASSETS, "icon-192.png");
  let drift = await writeOrCheck(ASSETS, await carriedShell(), { check, label: "texture-carry", hint: "run node workers/texture-website/carry.mjs" });
  if (check) {
    const current = await readFile(iconFile).catch(() => Buffer.alloc(0));
    if (!current.equals(icon)) { drift += 1; console.error("[texture-carry] assets/icon-192.png differs; run node workers/texture-website/carry.mjs"); }
  } else {
    await mkdir(ASSETS, { recursive: true });
    await writeFile(iconFile, icon);
  }
  drift += await images(check);
  if (check && drift) process.exit(1);
  if (!check) console.log(`[texture-carry] wrote ${MATERIALS.length} materials in ${Object.keys(CLASSES).length} classes into workers/texture-website/assets`);
}
