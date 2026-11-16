// Carries attention.productions into assets/ as files, so no request runs a
// script (the 2026-11-16 1027: the account's daily Worker requests ran out and
// the host answered 429 while file-only hosts kept answering). It writes:
// - src/materials.js: texture.website's listed materials (slug, word, class),
//   so a material= in an address is one texture.website has an image for;
// - assets/vocabulary.js, compose.js, materials.js: the composer, byte for byte,
//   for the page's script (assets/attention.js, written by hand) to import;
// - assets/index.html: the page every path falls back to, its first frame drawn
//   and its first prompt written, so it reads with scripts off;
// - the files the host answered under site-hub-next: favicon.svg, robots.txt,
//   ecosystem.json, registry.json; and llms.txt, vocabulary.json, _headers.
// --check fails when a carried file differs from what this would write.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { escapeHtml, securityHeaders } from "../lib/http.js";
import { writeOrCheck } from "../lib/carry.js";
import { MATERIALS as TEXTURE_MATERIALS } from "../texture-website/src/vocabulary.js";
import { ATTENTION_FAVICON } from "../site-hub-next/src/hosts/attention.js";
import { ecosystemJson } from "../site-hub-next/src/hosts/ecosystem.js";
import { neighborLine } from "../site-hub-next/src/set.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "assets");
const ORIGIN = "https://attention.productions";
const SHARED = ["vocabulary.js", "compose.js", "materials.js"];

const MATERIALS_MODULE = `// Written by workers/attention-productions/carry.mjs from texture.website's vocabulary; do not edit.
// A material= in an address is one of these, so its --sref is an image texture.website serves.
export const MATERIALS = Object.freeze(${JSON.stringify(TEXTURE_MATERIALS.map(({ slug, word, cls }) => ({ slug, word, cls })))});
`;

const CSP = "default-src 'none'; img-src 'self' https://texture.website; style-src 'self'; script-src 'self'; connect-src 'self'; frame-src https://mutex.buzz; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";

function headersFile() {
  const rules = ["# Written by workers/attention-productions/carry.mjs.", "/*", ...Object.entries(securityHeaders({ csp: CSP })).map(([n, v]) => `  ${n}: ${v}`), ""];
  const rule = (pattern, ...lines) => rules.push(pattern, ...lines.map((line) => `  ${line}`), "");
  rule("/*.txt", "Cache-Control: public, max-age=300", "Content-Type: text/plain; charset=UTF-8", "Access-Control-Allow-Origin: *");
  rule("/*.json", "Cache-Control: public, max-age=300", "Access-Control-Allow-Origin: *");
  rule("/*.js", "Cache-Control: public, max-age=300", "Content-Type: text/javascript; charset=UTF-8");
  rule("/*.css", "Cache-Control: public, max-age=300");
  rule("/favicon.svg", "Cache-Control: public, max-age=86400");
  return rules.join("\n");
}

const attr = (n) => String(n);

/** The viewfinder, drawn at a shot's geometry; the page redraws it by changing these attributes. */
function viewfinder(c, shot) {
  const g = c.geometryOf(shot);
  const { frame, focus, light } = g;
  const sheet = (s) => `<g class="sheet b${s.blur}${s.depth === c.SUBJECT_DEPTH ? " subject" : ""}" data-depth="${s.depth}" transform="rotate(${s.rot} ${attr(s.x + s.w / 2)} ${attr(s.y + s.h / 2)})"><rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="6"/>${s.depth === c.SUBJECT_DEPTH ? `<rect class="surface" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="6"/>${g.points.map((p) => `<circle class="point" cx="${p.x}" cy="${p.y}" r="${p.r}"/>`).join("")}` : ""}</g>`;
  return `<svg class="viewfinder" id="viewfinder" viewBox="0 0 ${c.VIEW.w} ${c.VIEW.h}" role="img" aria-labelledby="vf-title vf-desc" data-move="${g.move}" data-light="${c.slug(shot.light)}">
        <title id="vf-title">The shot, drawn</title>
        <desc id="vf-desc">${escapeHtml(c.promptOf(shot).plain)}</desc>
        <defs>
          <radialGradient id="key-light" gradientUnits="userSpaceOnUse" cx="${light.cx}" cy="${light.cy}" r="${light.r}"><stop class="key" offset="0"/><stop class="key-mid" offset=".45"/><stop class="fill" offset="1"/></radialGradient>
          <filter id="b1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
          <filter id="b2" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="6"/></filter>
          <filter id="b3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="11"/></filter>
          <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
          <clipPath id="gate"><rect id="gate-rect" x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}"/></clipPath>
          <pattern id="surface" patternUnits="userSpaceOnUse" width="192" height="192"><image id="surface-image" width="192" height="192"/></pattern>
        </defs>
        <rect class="ground" width="${c.VIEW.w}" height="${c.VIEW.h}"/>
        <g clip-path="url(#gate)">
          <rect id="wash" class="wash" x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}"/>
          <g id="bokeh" class="bokeh b3">${g.bokeh.map((b) => `<ellipse cx="${b.x}" cy="${b.y}" rx="${b.rx}" ry="${b.ry}"${b.on ? "" : ' class="off"'}/>`).join("")}</g>
          <g id="sheets" class="sheets">${[...g.sheets].reverse().map(sheet).join("")}</g>
          <line id="flare" class="flare${g.flare.on ? "" : " off"}" x1="${frame.x}" y1="${g.flare.y}" x2="${frame.x + frame.w}" y2="${g.flare.y}"/>
          <g id="streaks" class="streaks">${g.streaks.map((s) => `<line x1="${s.x1}" y1="${s.y}" x2="${s.x2}" y2="${s.y}"/>`).join("")}</g>
          <rect class="grain" x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}"/>
        </g>
        <g id="thirds" class="thirds">${g.thirds.map((t) => `<line x1="${t.x1}" y1="${t.y1}" x2="${t.x2}" y2="${t.y2}"/>`).join("")}</g>
        <rect id="frame" class="frame" x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}"/>
        <path id="corners" class="corners" d="${c.cornersOf(frame)}"/>
        <circle id="ring" class="ring" cx="${focus.x}" cy="${focus.y}" r="${focus.r}"/>
        <circle id="hand" class="hand" cx="${focus.x}" cy="${focus.y}" r="14"/>
        <line id="bar" class="bar" x1="${g.bar.x1}" y1="${g.bar.y}" x2="${g.bar.x2}" y2="${g.bar.y}"/>
      </svg>`;
}

/** Each ladder as a row of links; each link is the address of the shot with that word. */
function ladders(c, v, shot) {
  const row = (key, words, label = key, note = "") => `<div class="ladder" data-key="${key}"><span class="key">${escapeHtml(label)}</span>${words.map(([word, value, href]) => `<a href="${escapeHtml(href)}" data-word="${escapeHtml(value)}"${value === (key === "material" ? shot.material?.slug ?? "" : shot[key]) ? ' aria-current="true"' : ""}>${escapeHtml(word)}</a>`).join("")}${note}</div>`;
  const rows = Object.entries(v.LADDERS).map(([key, words]) => row(key, words.map((word) => [word, word, c.addressOf({ ...shot, [key]: word })])));
  const offer = v.MATERIAL_OFFER.map((s) => c.MATERIAL_BY_SLUG_FOR_CARRY(s));
  rows.push(row("material", [["none", "", c.addressOf({ ...shot, material: null })], ...offer.map((m) => [m.word, m.slug, c.addressOf({ ...shot, material: m })])], "surface", `<a class="out" href="https://texture.website/">from texture.website ↗</a>`));
  return rows.join("\n        ");
}

async function page(c, v) {
  const shot = c.FIRST_SHOT;
  const { midjourney, plain } = c.promptOf(shot);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Attention Productions</title>
  <meta name="description" content="Attention Productions is the name for the pictures: a feature in 2027, and a season of daily promo from October 1 through New Year. Each address here is a shot, written as an image prompt.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${ORIGIN}/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta property="og:title" content="Attention Productions">
  <meta property="og:description" content="Attention Productions is the name for the pictures: a feature in 2027, and a season of daily promo from October 1 through New Year. Each address here is a shot, written as an image prompt.">
  <link rel="stylesheet" href="/attention.css">
  <link rel="stylesheet" href="/lights.css">
  <script type="module" src="/attention.js"></script>
</head>
<body>
  <main id="attention">
    <header class="head">
      <p class="kicker">attention.productions</p>
      <h1>Attention Productions</h1>
      <p class="lede">Attention Productions is the name for the pictures. A feature-length film is due in 2027.</p>
    </header>
    <section class="shot" aria-labelledby="shot-title">
      <h2 id="shot-title" class="label"><span id="shot-label">A shot</span> <span id="shot-day" class="day"></span></h2>
      <figure class="finder">
      ${viewfinder(c, shot)}
        <figcaption class="note">The address is the shot: the path is the subject, and each word below goes into the prompt. Point at the frame to pull focus; tap it, or use the arrow keys, to put the subject on a third.</figcaption>
      </figure>
      <div class="take">
        <p class="prompt"><code id="prompt">${escapeHtml(midjourney)}</code></p>
        <p class="ways"><button type="button" id="copy" hidden>Copy prompt</button> <a id="address" href="${escapeHtml(c.addressOf(shot))}">This shot's address</a></p>
        <details class="more"><summary>Plain prompt and Spw</summary><p><code id="plain">${escapeHtml(plain)}</code></p><pre id="spw">${escapeHtml(c.spwOf(shot))}</pre></details>
      </div>
      <nav class="ladders" aria-label="The words of the shot">
        ${ladders(c, v, shot)}
      </nav>
    </section>
    <section class="season">
      <p>The production season runs from October 1 through New Year: a little promo every day. A moment holds one concept. That rule is <a href="https://mutex.buzz/">mutex.buzz</a>. The frame is <a href="https://factshift.center/">factshift.center</a>. boon, bane, and bone are that same frame with a pull: toward, away, or still. A sponsored viewport can show a picture. A physics setting is a query on the frame, once those three names serve it.</p>
      <p class="actions">
        <a href="https://autonomous.feedback/attention.productions">Leave a note</a>
      </p>
    </section>
    <figure class="held">
      <iframe src="https://mutex.buzz/now/" title="What holds the frame now, from mutex.buzz" loading="lazy"></iframe>
      <figcaption>What holds the frame this cycle, from <a href="https://mutex.buzz/">mutex.buzz</a>. When nothing else holds it, a laminated folio does. <a href="https://mutex.buzz/now/">Open it on its own</a>.</figcaption>
    </figure>
    <footer>
      <p>Nearby: ${neighborLine(["grain", "frame", "story"])}</p>
      <p><a href="/ecosystem.json">The set, as data</a> · <a href="/llms.txt">The shot, for a model</a></p>
    </footer>
  </main>
</body>
</html>
`;
}

/** Each light's colours, as the word on the viewfinder (data-light) selects them; the page changes only the word. */
function lightsCss(c, v) {
  return `/* Written by workers/attention-productions/carry.mjs from SHAPES.light in src/vocabulary.js. */
${Object.entries(v.SHAPES.light).map(([word, l]) => `.viewfinder[data-light="${c.slug(word)}"] { --key: ${l.key}; --fill: ${l.fill}; --second: ${l.second ?? l.key}; }`).join("\n")}
`;
}

function llms(v) {
  return `# attention.productions

Attention Productions is the name for the pictures: a feature in 2027, and a season of daily promo from October 1 through New Year.

The page is a shot composer for image prompts. The address is the shot: the path is the subject, a hyphen is a space, and each ladder is a query key whose value is one of its words (hyphens for spaces). What the address leaves out, the date picks; day=2026-12-01 fixes a date.

${Object.entries(v.LADDERS).map(([key, words]) => `- ${key}: ${words.join(", ")}`).join("\n")}
- material: any of texture.website's listed material words (its /vocabulary.json); the prompt then carries --sref with that material's image from texture.website and ${v.STYLE_WEIGHT}.

The page writes a Midjourney prompt (--ar in whole numbers, so scope is 239:100; ${v.SOURCES.aspect}), a plain prompt for any model, and Spw lines:
  !shot[close-up]{a laminated folio}(lamplight)<85mm>
  ^frame{ =ratio[scope] =focus[left_third] ~move[still] }

Example: ${ORIGIN}/a-laminated-folio?shot=close-up&lens=85mm&light=lamplight&move=dolly-in&ratio=scope&focus=left-third&material=vellum

Readings: /vocabulary.json (ladders, phrases, ratios), /ecosystem.json (the set).
`;
}

export async function carried() {
  const c = await import(pathToFileURL(path.join(HERE, "src/compose.js")).href);
  const v = await import(pathToFileURL(path.join(HERE, "src/vocabulary.js")).href);
  const { MATERIALS } = await import(pathToFileURL(path.join(HERE, "src/materials.js")).href);
  const bySlug = new Map(MATERIALS.map((m) => [m.slug, m]));
  for (const s of v.MATERIAL_OFFER) if (!bySlug.has(s)) throw new Error(`[attention-carry] ${s} is not a texture.website material`);
  const helpers = { ...c, MATERIAL_BY_SLUG_FOR_CARRY: (s) => bySlug.get(s) };
  const vocabulary = { site: "attention.productions", note: "a draft vocabulary; Midjourney parameters change between versions, so each source says where to check", ladders: v.LADDERS, phrases: v.PHRASES, ratios: v.RATIOS, subject: v.DEFAULT_SUBJECT, materials: "https://texture.website/vocabulary.json", sources: v.SOURCES };
  const shared = await Promise.all(SHARED.map(async (file) => [file, await readFile(path.join(HERE, "src", file), "utf8")]));
  return [
    ...shared,
    ["index.html", await page(helpers, v)],
    ["favicon.svg", ATTENTION_FAVICON],
    ["robots.txt", "User-agent: *\nAllow: /\n"],
    ["ecosystem.json", JSON.stringify(ecosystemJson, null, 2)],
    ["registry.json", JSON.stringify(ecosystemJson, null, 2)],
    ["vocabulary.json", `${JSON.stringify(vocabulary, null, 2)}\n`],
    ["llms.txt", llms(v)],
    ["lights.css", lightsCss(c, v)],
    ["_headers", headersFile()],
  ];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  const hint = "run node workers/attention-productions/carry.mjs";
  // The material list comes first: the composer imports it.
  let drift = await writeOrCheck(path.join(HERE, "src"), [["materials.js", MATERIALS_MODULE]], { check, label: "attention-carry", hint });
  drift += await writeOrCheck(ASSETS, await carried(), { check, label: "attention-carry", hint });
  if (check && drift) process.exit(1);
  if (!check) console.log(`[attention-carry] wrote the page, the composer and the host's files into workers/attention-productions/assets`);
}

export { MATERIALS_MODULE, CSP };
