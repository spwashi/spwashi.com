// Carries texture.website's materials (src/materials.js) into assets/: each
// material's images under its own name (/paper.webp), its recipe (/paper.txt)
// and line (/paper.spw); catalog.json with provenance read from the sidecars
// (generator, Midjourney prompt words and job, tracked raw renders) and each
// image's git history, for students; the page every path falls back to; llms.txt;
// and _headers. The composing happens in the reader's page (assets/texture.js).
// --check fails when a carried file differs from what this would write.
import { execFileSync } from "node:child_process";
import { copyFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { securityHeaders, escapeHtml } from "../lib/http.js";
import { writeOrCheck } from "../lib/carry.js";
import { ALL, BUBBLES, CATEGORIES, LAWS, MATERIALS } from "./src/materials.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const ASSETS = path.join(HERE, "assets");
const ORIGIN = "https://texture.website";

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
const tracked = (file) => { try { git("ls-files", "--error-unmatch", file); return true; } catch { return false; } };

/** Generator and the source for one family, read from the sidecar. */
async function provenance(material) {
  if (material.procedural) return { generator: "texture.website, drawn in CSS and SVG" };
  const text = await readFile(path.join(ROOT, material.sidecar), "utf8");
  const generator = /generator:\s*"([^"]+)"/.exec(text)?.[1] ?? "";
  const sources = [...(/source_masters:\s*#\[([\s\S]*?)\]/.exec(text)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const source = sources[material.family] ?? "";
  const job = /_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_\d+\.\w+$/.exec(source);
  const out = { generator };
  if (job) {
    out.promptWords = source.slice(0, job.index).replaceAll("_", " ") + "…";
    out.job = `https://www.midjourney.com/jobs/${job[1]}`;
  }
  if (source.startsWith("public/") && tracked(source)) out.raw = { file: source, name: path.basename(source) };
  return out;
}

/** The image's history in this repository, oldest first: a catalog a student can walk. */
const history = (file) => git("log", "--follow", "--format=%h\t%cs\t%s", "--", file)
  .split("\n").filter(Boolean).reverse()
  .map((line) => { const [commit, date, subject] = line.split("\t"); return { commit, date, subject: subject.slice(0, 140) }; });

/** Another material to pair with: the next one in a different category. */
const partner = (m) => { const i = ALL.indexOf(m); return [...ALL.slice(i + 1), ...ALL.slice(0, i)].find((other) => other.category !== m.category && !other.procedural) ?? m; };
/** A material's image reading: a photograph as .webp, a drawn pattern as an .svg tile. */
const imageOf = (m) => (m.procedural ? `${m.id}.svg` : `${m.id}.webp`);

/** Each drawn pattern as a 32px tile, ink on nothing. */
const INK = "#1d1d1b";
const TILES = {
  grid: `<path d="M0 .5H32M.5 0V32" stroke="${INK}" fill="none"/>`,
  dots: `<circle cx="16" cy="16" r="5" fill="${INK}"/>`,
  hatch: `<path d="M-8 8L8-8M0 32L32 0M24 40L40 24" stroke="${INK}" stroke-width="1.5"/>`,
  stripes: `<rect width="16" height="32" fill="${INK}"/>`,
  checker: `<rect width="16" height="16" fill="${INK}"/><rect x="16" y="16" width="16" height="16" fill="${INK}"/>`,
  ramp: `<defs><linearGradient id="r"><stop offset="0" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}"/></linearGradient></defs><rect width="32" height="32" fill="url(#r)"/>`,
};
const tile = (m) => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${TILES[m.procedural]}</svg>\n`;

const recipe = (m, p) => m.procedural ? `${m.name} (texture.website/${m.id})
${m.meaning}

Pattern: ${m.science}
Made with: ${p.generator}

As a tile: ${ORIGIN}/${m.id}.svg
Composed over a material, with its dimensions:
  ${ORIGIN}/${partner(m).id}/*${m.id}?s=1.5&a=30&g=0.2
` : `${m.name} (texture.website/${m.id})
${m.meaning}

Material: ${m.science}
Made with: ${p.generator}${p.promptWords ? `, from a prompt that began "${p.promptWords}"` : ""}${p.job ? `\nJob: ${p.job}` : ""}

As a style reference in Midjourney:
  your subject --sref ${ORIGIN}/${m.id}.webp --sw 250
As an image prompt:
  ${ORIGIN}/${m.id}.webp your subject, made of ${m.name.toLowerCase()}
Paired with another material:
  your subject --sref ${ORIGIN}/${m.id}.webp ${ORIGIN}/${partner(m).id}.webp

Composed on the page:
  ${ORIGIN}/${m.id}/~${partner(m).id}
`;

const line = (m, p) => `#>texture_${m.id}
#:material #!${m.category}

~${m.id}[${m.category}]{${m.name.toLowerCase().split(" ").join(", ")}}

meaning: "${m.meaning}"
science: "${m.science}"
generator: "${p.generator}"${p.job ? `\njob: "${p.job}"` : ""}
image: "${ORIGIN}/${imageOf(m)}"
`;

const LLMS = `# texture.website

Materials to make images and interfaces with, and a slide that composes them. Every material answers at its own name in several readings:
- /{material}.webp and .avif (a photographed material) or /{material}.svg (a drawn pattern): a stable address to use as a style reference, an image prompt or a tile
- /{material}.txt: what it is, how it was made, and lines to try
- /{material}.spw: the material as a line of Spw
- /catalog.json: every material, its category, its provenance and its history

The slide reads its address as a recipe. Each word in the path is a layer, bottom first; a mark before a word is that layer's law: . settles, ^ lifts, * is heavy, ~ drifts, = holds still, @ leans in, ? opens out, ! makes room, % levels. A word that names no material is spoken in a speech bubble. In a path, the ? mark is written %3F, since a bare ? begins the query.

Dimensions, as query keys: d (days from today, signed: d=+3, d=-1), day (a date, YYYY-MM-DD), s (scale), a (angle in degrees), g (grain, 0 to 1), w (warp, 0 to 1), say (bubble text), as (bubble shape: ~ thought, ? question, ! burst, . statement), for (whom or what the materials are gathered for).

/ is the day's composition, drawn from whichever materials exist; /catalog lists every material for study.

Materials: ${ALL.map((m) => m.id).join(", ")}
`;

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>texture.website</title>
  <meta name="description" content="Materials to make images and interfaces with, composed on a slide by the words in the address and tuned by its dimensions.">
  <link rel="stylesheet" href="/texture.css">
  <script type="module" src="/texture.js"></script>
</head>
<body>
  <svg class="defs" aria-hidden="true" focusable="false">
    <filter id="warp"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  </svg>
  <main id="texture">
    <figure class="slide">
      <header class="slide-head"><span class="fig">Fig.</span> <span class="title">texture.website</span> <span class="when"></span></header>
      <div class="stage" aria-label="Composition"><div class="layers"></div><div class="grain" hidden></div><p class="bubble" hidden></p></div>
      <figcaption class="caption">Materials to make images and interfaces with. Each word in the address is a layer; each dimension is a key.</figcaption>
      <ol class="rulers" aria-label="Dimensions"></ol>
    </figure>
    <form class="panel" aria-label="Dimensions" hidden></form>
    <section class="reading" aria-live="polite"></section>
    <section class="catalog" aria-labelledby="catalog-head">
      <h2 id="catalog-head">Materials</h2>
      <ul>
${ALL.map((m) => `        <li><a href="/${m.id}"><img src="/${imageOf(m)}" alt="" width="192" height="108" loading="lazy"><span class="name">${escapeHtml(m.name)}</span></a> <span class="category">${escapeHtml(m.category)}</span><p>${escapeHtml(m.science)}</p><p class="readings"><a href="/${imageOf(m)}">image</a> · <a href="/${m.id}.txt">recipe</a> · <a href="/${m.id}.spw">line</a></p></li>`).join("\n")}
      </ul>
    </section>
  </main>
</body>
</html>
`;

const CSP = "default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";

function headersFile() {
  const rules = [`# Written by workers/texture-website/carry.mjs.`, `/*`, ...Object.entries(securityHeaders({ csp: CSP })).map(([n, v]) => `  ${n}: ${v}`), ""];
  const cache = (pattern, value, extra = []) => rules.push(pattern, `  Cache-Control: ${value}`, ...extra, "");
  const shared = ["  Cross-Origin-Resource-Policy: cross-origin", "  Access-Control-Allow-Origin: *"];
  for (const m of ALL) {
    if (m.procedural) cache(`/${m.id}.svg`, "public, max-age=86400", shared);
    else for (const ext of ["webp", "avif"]) cache(`/${m.id}.${ext}`, "public, max-age=86400", shared);
    cache(`/${m.id}.txt`, "public, max-age=300", ["  Content-Type: text/plain; charset=UTF-8", "  Access-Control-Allow-Origin: *"]);
    cache(`/${m.id}.spw`, "public, max-age=300", ["  Content-Type: text/plain; charset=UTF-8", "  Access-Control-Allow-Origin: *"]);
  }
  cache("/catalog.json", "public, max-age=300", ["  Access-Control-Allow-Origin: *"]);
  cache("/llms.txt", "public, max-age=300");
  return rules.join("\n");
}

export async function carried() {
  const materials = [];
  const text = [];
  for (const m of ALL) {
    const p = await provenance(m);
    const readings = m.procedural
      ? { image: `/${m.id}.svg`, recipe: `/${m.id}.txt`, line: `/${m.id}.spw` }
      : { image: `/${m.id}.webp`, avif: `/${m.id}.avif`, recipe: `/${m.id}.txt`, line: `/${m.id}.spw` };
    materials.push({ id: m.id, name: m.name, category: m.category, meaning: m.meaning, science: m.science, draft: true, procedural: m.procedural ?? null,
      readings, provenance: p.raw ? { ...p, raw: { name: p.raw.name } } : p,
      history: history(m.procedural ? "workers/texture-website/src/materials.js" : `${m.image}.webp`) });
    text.push([`${m.id}.txt`, recipe(m, p)], [`${m.id}.spw`, line(m, p)]);
    if (m.procedural) text.push([`${m.id}.svg`, tile(m)]);
  }
  const catalog = { site: "texture.website", note: "science notes are drafts", categories: CATEGORIES, laws: LAWS, bubbles: BUBBLES, materials };
  return [
    ...text,
    ["catalog.json", `${JSON.stringify(catalog, null, 2)}\n`],
    ["index.html", PAGE],
    ["llms.txt", LLMS],
    ["robots.txt", "User-agent: *\nAllow: /\n"],
    ["_headers", headersFile()],
  ];
}

/** The images and tracked raw renders, copied byte for byte. */
async function copyImages(check) {
  let drift = 0;
  for (const m of MATERIALS) {
    const p = await provenance(m);
    const pairs = ["webp", "avif"].map((ext) => [path.join(ROOT, `${m.image}.${ext}`), path.join(ASSETS, `${m.id}.${ext}`)]);
    if (p.raw) pairs.push([path.join(ROOT, p.raw.file), path.join(ASSETS, "raw", p.raw.name)]);
    for (const [from, to] of pairs) {
      if (check) {
        const [a, b] = await Promise.all([readFile(from), readFile(to).catch(() => Buffer.alloc(0))]);
        if (!a.equals(b)) { drift += 1; console.error(`[texture-carry] ${path.relative(ROOT, to)} differs from ${path.relative(ROOT, from)}`); }
      } else {
        await import("node:fs/promises").then(({ mkdir }) => mkdir(path.dirname(to), { recursive: true }));
        await copyFile(from, to);
      }
    }
  }
  return drift;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  const drift = (await writeOrCheck(ASSETS, await carried(), { check, label: "texture-carry", hint: "run node workers/texture-website/carry.mjs" })) + (await copyImages(check));
  if (check && drift) process.exit(1);
  if (!check) console.log(`[texture-carry] wrote ${ALL.length} materials into workers/texture-website/assets`);
}
