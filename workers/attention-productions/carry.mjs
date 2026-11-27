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
// - manifest.webmanifest and sw.js: install metadata and a fixed offline shell.
// --check fails when a carried file differs from what this would write.
import { readFile } from "node:fs/promises";
import { peerScriptPath } from "../lib/peer-kit.js";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { escapeHtml, securityHeaders } from "../lib/http.js";
import { writeOrCheck } from "../lib/carry.js";
import { MATERIALS as TEXTURE_MATERIALS } from "../texture-website/src/vocabulary.js";
import { ATTENTION_FAVICON } from "../site-hub-next/src/hosts/attention.js";
import { ecosystemJson } from "../site-hub-next/src/hosts/ecosystem.js";
import { neighborLine } from "../site-hub-next/src/set.js";

import { APPLE_ICON, THEME, appManifest, serviceWorker } from "./src/pwa.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "assets");
const ORIGIN = "https://attention.productions";
const BLURB = "Each address is a shot, written as an image prompt.";
const SHARED = ["vocabulary.js", "compose.js", "materials.js"];

const MATERIALS_MODULE = `// Written by workers/attention-productions/carry.mjs from texture.website's vocabulary; do not edit.
// A material= in an address is one of these, so its --sref is an image texture.website serves.
export const MATERIALS = Object.freeze(${JSON.stringify(TEXTURE_MATERIALS.map(({ slug, word, cls }) => ({ slug, word, cls })))});
`;

/** spwashi.com's pinch for text, carried by scripts/build-peer-kit.mjs (workers/lib/text-scale.js binds it). */
const PINCH_TEXT = peerScriptPath("pinch-text-scale");

const CSP = "default-src 'none'; img-src 'self' https://texture.website; style-src 'self'; script-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-src https://mutex.buzz; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";

function headersFile() {
  const rules = ["# Written by workers/attention-productions/carry.mjs.", "/*", ...Object.entries(securityHeaders({ csp: CSP })).map(([n, v]) => `  ${n}: ${v}`), ""];
  const rule = (pattern, ...lines) => rules.push(pattern, ...lines.map((line) => `  ${line}`), "");
  rule("/*.txt", "Cache-Control: public, max-age=300", "Content-Type: text/plain; charset=UTF-8", "Access-Control-Allow-Origin: *");
  rule("/*.json", "Cache-Control: public, max-age=300", "Access-Control-Allow-Origin: *");
  rule("/*.js", "Cache-Control: public, max-age=300", "Content-Type: text/javascript; charset=UTF-8");
  rule("/*.css", "Cache-Control: public, max-age=300");
  rule("/manifest.webmanifest", "Content-Type: application/manifest+json; charset=UTF-8", "Cache-Control: public, max-age=300");
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
        <circle id="beat" class="handle beat" cx="${g.bar.x2}" cy="${g.bar.y}" r="10"/>
        <g id="lamp" class="handle lamp" transform="translate(${g.lamp.x} ${g.lamp.y})"><circle r="11"/><path d="M0 -19V-15M0 15V19M-19 0H-15M15 0H19M-13.4 -13.4L-10.6 -10.6M10.6 10.6L13.4 13.4M-13.4 13.4L-10.6 10.6M10.6 -10.6L13.4 -13.4"/></g>
      </svg>`;
}

/** All 91 surfaces grouped by class, so every texture.website material is reachable without leaving the page. */
function surfaceSelect(shot) {
  const byClass = new Map();
  for (const m of TEXTURE_MATERIALS) {
    if (!byClass.has(m.cls)) byClass.set(m.cls, []);
    byClass.get(m.cls).push(m);
  }
  const groups = [...byClass.entries()].map(([cls, list]) => `<optgroup label="${escapeHtml(cls)}">${list.map((m) => `<option value="${escapeHtml(m.slug)}"${shot.material?.slug === m.slug ? " selected" : ""}>${escapeHtml(m.word)}</option>`).join("")}</optgroup>`).join("");
  return `<select id="material-select" class="surface-select" aria-label="All ${TEXTURE_MATERIALS.length} surfaces from texture.website"><option value="">All ${TEXTURE_MATERIALS.length} surfaces…</option>${groups}</select>`;
}

/** Each ladder as a row of links; each link is the address of the shot with that word. */
function ladders(c, v, shot) {
  const row = (key, words, label = key, note = "") => `<div class="ladder" data-key="${key}"><span class="key">${escapeHtml(label)}</span>${words.map(([word, value, href]) => `<a href="${escapeHtml(href)}" data-word="${escapeHtml(value)}"${value === (key === "material" ? shot.material?.slug ?? "" : shot[key]) ? ' aria-current="true"' : ""}>${escapeHtml(word)}</a>`).join("")}${note}</div>`;
  const rows = Object.entries(v.LADDERS).map(([key, words]) => row(key, words.map((word) => [word, word, c.addressOf({ ...shot, [key]: word })])));
  const offer = v.MATERIAL_OFFER.map((s) => c.MATERIAL_BY_SLUG_FOR_CARRY(s));
  rows.push(row("material", [["none", "", c.addressOf({ ...shot, material: null })], ...offer.map((m) => [m.word, m.slug, c.addressOf({ ...shot, material: m })])], "surface", `${surfaceSelect(shot)}<a class="out" id="texture-link" href="https://texture.website/">texture ↗</a>`));
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
  <meta name="description" content="${BLURB}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${ORIGIN}/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" sizes="180x180" href="${APPLE_ICON}">
  <meta name="theme-color" content="${THEME}">
  <meta property="og:title" content="Attention Productions">
  <meta property="og:description" content="${BLURB}">
  <link rel="stylesheet" href="/attention.css">
  <link rel="stylesheet" href="/lights.css">
  <link rel="stylesheet" href="/set-ring.css">
  <link rel="stylesheet" href="/pinch.css">
  <link rel="stylesheet" href="/text-scale.css">
  <link rel="stylesheet" href="/clean-still.css">
  <link rel="stylesheet" href="/slot-scrub.css">
  <script src="/text-scale-head.js"></script>
  <link rel="modulepreload" id="text-pinch" href="${PINCH_TEXT}">
  <script type="module" src="/attention.js"></script>
</head>
<body>
  <main id="attention">
    <header class="head">
      <p class="kicker">attention.productions</p>
      <h1>Attention Productions</h1>
    </header>
    <section class="shot" aria-labelledby="shot-title">
      <h2 id="shot-title" class="label"><span id="shot-label">A shot</span> <span id="shot-day" class="day"></span></h2>
      <figure class="finder">
      ${viewfinder(c, shot)}
        <figcaption class="note">Drag the focus ring, lamp, or tempo bar — or scrub any bracket horizontally.</figcaption>
      </figure>
      <div class="take">
        <div class="subject-bar">
          <label class="subject-label" for="subject-input">Subject</label>
          <input id="subject-input" class="subject-input" type="text" maxlength="80" value="${escapeHtml(shot.subject)}" placeholder="Describe the subject" autocomplete="off">
        </div>
        <div class="slip">
          <p class="prompt"><code id="prompt">${escapeHtml(midjourney)}</code></p>
          <div class="expr" id="expr">${c.expressionHtml(shot)}</div>
          <div class="slip-actions">
            <button type="button" id="copy-mj">Copy Midjourney</button>
            <button type="button" id="copy-plain">Copy Plain</button>
            <button type="button" id="copy-spw">Copy Spw</button>
            <button type="button" id="roll-shot">Roll</button>
            <button type="button" id="today-shot">Today</button>
            <a class="action-link" id="beat-canvas" href="${escapeHtml(c.beatHrefOf(shot))}">3-shot beat ↗</a>
          </div>
        </div>
        <details class="more"><summary>Plain</summary><p><code id="plain">${escapeHtml(plain)}</code></p></details>
        <div class="takes" id="takes" aria-label="Recent takes" hidden></div>
      </div>
      <nav class="ladders" aria-label="The words of the shot">
        ${ladders(c, v, shot)}
      </nav>
    </section>
    <figure class="held">
      <iframe src="https://mutex.buzz/now/" title="What holds the frame now, from mutex.buzz" loading="lazy"></iframe>
      <figcaption><a href="https://mutex.buzz/">mutex.buzz</a> · <a href="https://mutex.buzz/now/">on its own</a></figcaption>
    </figure>
    <footer>
      <p>Nearby: ${neighborLine(["grain", "frame", "story"])}</p>
      <p><a id="canvas" href="${escapeHtml(c.canvasHrefOf(shot))}">Canvas</a> · <a href="/ecosystem.json">ecosystem.json</a> · <a href="/llms.txt">llms.txt</a> · <a href="https://autonomous.feedback/attention.productions">Leave a note</a></p>
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

${BLURB}

The path is the subject, a hyphen is a space, and each ladder is a query key whose value is one of its words (hyphens for spaces). What the address leaves out, the date picks; day=2026-12-01 fixes a date; tempo=0.5..2 scales motion speed (rest 1).

${Object.entries(v.LADDERS).map(([key, words]) => `- ${key}: ${words.join(", ")}`).join("\n")}
- tempo: ${v.TEMPO.min} to ${v.TEMPO.max} in steps of ${v.TEMPO.step} (default ${v.TEMPO.rest}; drawn on the viewfinder bar and written as %tempo[n] in Spw)
- material: any of texture.website's ${TEXTURE_MATERIALS.length} listed material words (its /vocabulary.json); the prompt then carries --sref with that material's image from texture.website and ${v.STYLE_WEIGHT}.

The page supports inline subject editing, draggable viewfinder handles (focus ring, lamp, tempo bar), horizontal bracket scrubbing across the Spw expression, a six-take A/B comparison strip, and a three-shot storyboard beat (establishing, medium, close-up) that opens directly on factshift.center via #spw64=.

The page writes a Midjourney prompt (--ar in whole numbers, so scope is 239:100; ${v.SOURCES.aspect}), a plain prompt for any model, and Spw lines:
  !shot[close-up]{a laminated folio}(lamplight)<85mm>
  ^frame{ =ratio[scope] =focus[left_third] =light_from[right] ~move[still] %tempo[1] }
  @material: ~"texture.website/vellum.spw"

Example: ${ORIGIN}/a-laminated-folio?shot=close-up&lens=85mm&light=lamplight&from=right&move=dolly-in&ratio=scope&focus=left-third&material=vellum

Readings: /vocabulary.json (ladders, phrases, ratios), /ecosystem.json (the set), https://texture.website/llms.txt (materials), https://factshift.center/ (spatial canvas), https://spw.quest/llms.txt (Spw grammar).
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
  // The set's ring, shared by the set's pages (workers/lib/set-ring.js).
  for (const file of ["set-ring.js", "set-ring.css", "pinch.js", "pinch.css", "text-scale.js", "text-scale.css", "text-scale-head.js", "clean-still.js", "clean-still.css", "slot-scrub.js", "slot-scrub.css"]) shared.push([file, await readFile(path.join(HERE, "../lib", file), "utf8")]);
  const files = [
    ...shared,
    ["index.html", await page(helpers, v)],
    ["favicon.svg", ATTENTION_FAVICON],
    ["manifest.webmanifest", appManifest(BLURB)],
    ["robots.txt", "User-agent: *\nAllow: /\n"],
    ["ecosystem.json", JSON.stringify(ecosystemJson, null, 2)],
    ["registry.json", JSON.stringify(ecosystemJson, null, 2)],
    ["vocabulary.json", `${JSON.stringify(vocabulary, null, 2)}\n`],
    ["llms.txt", llms(v)],
    ["lights.css", lightsCss(c, v)],
    ["_headers", headersFile()],
  ];
  const shell = files.filter(([name]) =>
    /\.(?:css|js|svg|webmanifest)$/.test(name) || name === "index.html"
  );
  const local = [
    "attention.js", "attention.css", PINCH_TEXT.slice(1),
    APPLE_ICON.slice(1), "icon-192.png", "icon-512.png", "icon-maskable-512.png",
  ];
  for (const name of local) shell.push([name, await readFile(path.join(ASSETS, name))]);
  return [...files, ["sw.js", serviceWorker(shell)]];
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
