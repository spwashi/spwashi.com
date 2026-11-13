// Carries texture.website's vocabulary (src/vocabulary.js) into assets/: the
// vocabulary as vocabulary.json, each listed material's prompt starter (/terrazzo.txt)
// and line (/terrazzo.spw), the page every path falls back to, llms.txt and
// _headers. The page (assets/texture.js) builds prompts from the address and
// sketches them in the reader's browser; nothing runs on a server.
// --check fails when a carried file differs from what this would write.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
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
With no material in the path, the day composes a pair: day=2026-12-01 fixes a date, d=2 moves from today by days. r rolls every ladder from a seed; say and as put words in a speech bubble.

Views: a first path word ending in @ is whose eyes the page is seen through: ${Object.entries(VIEWS).map(([key, v]) => `/${key}@/ (${v.name}, ${v.says})`).join("; ")}.

Pivots, as query keys, each teaching a technique: perm (a ladder written as a permutation), weigh (materials as weighted multi-prompts), chaos, weird, stylize (numbers), raw, sref (random), seed (a number), invert (reverse the layers by reversing the path). Techniques with their sources are in /vocabulary.json.

The page writes a Midjourney prompt (with --tile or an aspect ratio by format), the same prompt with its materials' images in front, a plain prompt for any model, a Spw line and the address, and sketches the words with drawn bases lit, worn and printed by an SVG filter. Its card takes the composition as .txt, .spw, .json, .md, or a square .svg that marks the day.

Readings: /vocabulary.json (classes, materials, ladders, phrases, techniques, pivots, views), /{material}.png (a seamless 384px tile, open to any origin, to hand an image model as an image prompt or style reference), /{material}.txt (prompt starters with that image's address), /{material}.spw (the material as a line), /images.json (each image's hash).

Classes: ${Object.keys(CLASSES).join(", ")}
`;

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>texture.website</title>
  <meta name="description" content="A studio for building material prompts: words in the address become materials, ladders of words tune scale, light, wear, process, scene and format.">
  <link rel="stylesheet" href="/texture.css">
  <script type="module" src="/texture.js"></script>
</head>
<body>
  <svg class="defs" aria-hidden="true" focusable="false"><filter id="material" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"></filter></svg>
  <main id="texture">
    <figure class="slide">
      <nav class="views" aria-label="Views"><a href="/">texture.website</a>${Object.entries(VIEWS).map(([key, v]) => `<a href="/${key}@/">${escapeHtml(v.name)}</a>`).join("")}</nav>
      <header class="slide-head"><span class="fig">Fig.</span> <span class="title">texture.website</span> <span class="when"></span></header>
      <div class="stage" aria-label="A sketch of the prompt"><div class="layers"></div><p class="bubble" hidden></p></div>
      <figcaption class="caption">A studio for building material prompts. Each word in the address is a material; each ladder is a word in the sentence.</figcaption>
    </figure>
    <section class="ladders" aria-label="Ladders" hidden></section>
    <section class="pivots" aria-label="Pivots" hidden></section>
    <article class="card" aria-label="The composition, to share and take"></article>
    <section class="catalog" aria-labelledby="catalog-head">
      <h2 id="catalog-head">Materials by class</h2>
${Object.entries(CLASSES).map(([cls, c]) => `      <article class="class"><h3>${escapeHtml(cls)}</h3><p>${escapeHtml(c.science)}</p><p class="words">${c.materials.map((word) => { const m = MATERIALS.find((each) => each.word === word); return `<a href="/${m.slug}">${escapeHtml(word)}</a> <a class="png" href="/${m.slug}.png" title="the image of ${escapeHtml(word)}, for Midjourney">png</a>`; }).join(" · ")}</p></article>`).join("\n")}
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
  return rules.join("\n");
}

export async function carried() {
  const vocabulary = { site: "texture.website", note: "the science notes are drafts; parameters change between Midjourney versions, so each technique says where to check", classes: CLASSES, materials: MATERIALS.map((m) => ({ ...m, image: `/${m.slug}.png` })), tile: TILE, ladders: LADDERS, phrases: PHRASES, formats: FORMATS, relations: RELATIONS, techniques: TECHNIQUES, pivots: PIVOTS, views: VIEWS };
  return [
    ...MATERIALS.flatMap((m) => [[`${m.slug}.txt`, starter(m)], [`${m.slug}.spw`, line(m)]]),
    ["vocabulary.json", `${JSON.stringify(vocabulary, null, 2)}\n`],
    ["index.html", PAGE],
    ["llms.txt", LLMS],
    ["robots.txt", "User-agent: *\nAllow: /\n"],
    ["_headers", headersFile()],
  ];
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
  const drift = (await writeOrCheck(ASSETS, await carried(), { check, label: "texture-carry", hint: "run node workers/texture-website/carry.mjs" })) + (await images(check));
  if (check && drift) process.exit(1);
  if (!check) console.log(`[texture-carry] wrote ${MATERIALS.length} materials in ${Object.keys(CLASSES).length} classes into workers/texture-website/assets`);
}
