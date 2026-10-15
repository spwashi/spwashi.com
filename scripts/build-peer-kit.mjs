#!/usr/bin/env node
/**
 * build-peer-kit — spwashi.com's paper material, carried to the peer sites the
 * workers serve.
 *
 * A peer should look like the site without loading anything from spwashi.com,
 * and without a hand copy of the tokens that drifts from them. This reads the
 * material where the site keeps it and writes it where a worker can import it:
 *
 *   public/css/tokens/core.css   the light :root values, and the dark values the
 *                                site restates under html[data-spw-color-mode="dark"]
 *   public/css/tokens/fonts.css  the faces, and public/fonts/ the files
 *   operator-detection.js        which operator color each sigil wears
 *
 *   workers/lib/peer-kit.js            tokens (light and dark), the peer vocabulary
 *                                      shell.js speaks, faces, sigil colors, and scripts
 *   workers/<unit>/assets/fonts/       the faces a unit serves, named by content hash
 *   workers/<unit>/assets/peer/        site script modules a unit runs, bundled from
 *                                      public/js and named by content hash
 *
 * Tokens are taken with everything they refer to, so a value written as
 * var(--charcoal-rgb) arrives with --charcoal-rgb. A token the site stops
 * defining is an error here, not a silent fallback on a peer.
 *
 *   npm run build:peer-kit             write the module and each unit's fonts
 *   npm run build:peer-kit -- --check  exit 1 when either has drifted (check:workers runs this)
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = path.join(ROOT, 'public/css/tokens/core.css');
const FONTS_CSS = path.join(ROOT, 'public/css/tokens/fonts.css');
const OUT = path.join(ROOT, 'workers/lib/peer-kit.js');
const DARK_SELECTOR = 'html[data-spw-color-mode="dark"]';

/** The site tokens a peer takes. Their references come along. */
const TOKENS = Object.freeze([
  '--bg', '--bg-deep', '--bg-field',
  '--surface-matte', '--surface-matte-strong',
  '--ink-strong', '--ink', '--ink-soft', '--ink-mid', '--ink-muted', '--ink-faint',
  '--line', '--line-strong', '--line-matte',
  '--teal', '--teal-deep',
  '--font-family-sans', '--font-family-mono', '--site-editorial-font',
]);

/**
 * The peer vocabulary: the names workers/lib/shell.js and the peers' own CSS
 * use, said in site tokens. The accent is the shell chrome's
 * (public/css/shell/chrome/header.css: teal 68% with ink 32%, in oklab).
 */
const ALIASES = Object.freeze([
  ['--fg', 'var(--ink)'],
  ['--muted', 'var(--ink-mid)'],
  ['--edge', 'var(--ink-faint)'],
  ['--surface', 'var(--surface-matte)'],
  ['--field', 'var(--surface-matte-strong)'],
  ['--accent', 'color-mix(in oklab, var(--teal) 68%, var(--ink) 32%)'],
  ['--accent-soft', 'color-mix(in srgb, var(--accent) 9%, transparent)'],
  ['--warn', 'var(--op-binding-color)'],
  ['--font', 'var(--font-family-sans)'],
  ['--mono', 'var(--font-family-mono)'],
  ['--manuscript', 'var(--site-editorial-font)'],
]);

/** The braces wear the site's scene, mode, direction and concept colors. */
const BRACE_TYPES = Object.freeze({ '<': 'concept', '(': 'scene', '[': 'mode', '{': 'direction' });

/**
 * Site script modules each unit runs, bundled with esbuild from public/js (the
 * workbench's esbuild, as build:spw-parser uses). An entry should be import-free
 * or close to it: the bundle carries whatever it imports.
 */
const SCRIPTS = Object.freeze({
  'spw-quest': [
    { name: 'pinch-text-scale', entry: 'public/js/kernel/pinch-text-scale.js' },
  ],
});
const ESBUILD = path.join(ROOT, '.spw/_workbench/node_modules/esbuild/lib/main.js');

/** Which faces each unit serves from its own assets. */
const UNITS = Object.freeze({
  'spw-quest': [
    { family: 'Newsreader', style: 'normal', file: 'newsreader-latin.woff2' },
    { family: 'JetBrains Mono', style: 'normal', file: 'jetbrains-mono-latin.woff2' },
  ],
});

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');
const fail = (message) => {
  console.error(`[build:peer-kit] ${message}`);
  process.exit(1);
};

/** Top-level rules of a stylesheet, comments removed; at-rule blocks are skipped whole. */
function topLevelRules(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  let depth = 0;
  let start = 0;
  let selector = '';
  let bodyStart = -1;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) {
        selector = text.slice(start, i).trim();
        bodyStart = i + 1;
      }
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        if (!selector.startsWith('@')) rules.push({ selector, body: text.slice(bodyStart, i) });
        start = i + 1;
      }
    } else if (ch === ';' && depth === 0) {
      start = i + 1;
    }
  }
  return rules;
}

/** Custom property declarations in a rule body, in order. */
function declarations(body) {
  const out = [];
  for (const match of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.push([match[1], match[2].trim()]);
  return out;
}

const refsOf = (value) => [...value.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)].map((m) => ({ name: m[1], hasFallback: Boolean(m[2]) }));

/** Light and dark token maps, plus each name's first position, from core.css. */
function readCore() {
  const light = new Map();
  const dark = new Map();
  const order = new Map();
  let position = 0;
  for (const rule of topLevelRules(fs.readFileSync(CORE, 'utf8'))) {
    const selectors = rule.selector.split(',').map((s) => s.trim());
    const target = selectors.includes(':root') ? light : selectors.includes(DARK_SELECTOR) ? dark : null;
    if (!target) continue;
    for (const [name, value] of declarations(rule.body)) {
      target.set(name, value);
      if (!order.has(name)) order.set(name, position);
      position += 1;
    }
  }
  return { light, dark, order };
}

/** Every token the wanted names need, through var() references. */
function closure(wanted, light) {
  const seen = new Set();
  const visit = (name, from) => {
    if (seen.has(name)) return;
    if (!light.has(name)) fail(`${name}${from ? ` (needed by ${from})` : ''} is not defined on :root in ${rel(CORE)}`);
    seen.add(name);
    for (const ref of refsOf(light.get(name))) {
      if (light.has(ref.name)) visit(ref.name, name);
      else if (!ref.hasFallback) fail(`${name} refers to ${ref.name}, which ${rel(CORE)} does not define on :root`);
    }
  };
  for (const name of wanted) visit(name);
  return seen;
}

/** Sigils and their operator types, from the site's registry. */
async function sigilTypes() {
  await import(pathToFileURL(path.join(ROOT, 'scripts/lib/register-public-imports.mjs')).href);
  const { OPERATOR_DEFINITIONS } = await import('/public/js/kernel/operator-detection.js');
  return OPERATOR_DEFINITIONS.map((def) => ({ sigil: def.prefix, type: def.type }));
}

/** @font-face rules in fonts.css, by family, style and file. */
function readFaces() {
  const css = fs.readFileSync(FONTS_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
    const get = (prop) => (body.match(new RegExp(`${prop}\\s*:\\s*([^;]+);`)) || [])[1]?.trim();
    const src = get('src') || '';
    return {
      family: (get('font-family') || '').replace(/^["']|["']$/g, ''),
      style: get('font-style') || 'normal',
      weight: get('font-weight') || '400',
      display: get('font-display') || 'swap',
      unicodeRange: get('unicode-range') || '',
      file: (src.match(/url\(["']?\/public\/fonts\/([^"')]+)["']?\)/) || [])[1] || '',
    };
  });
}

function build() {
  return (async () => {
    const { light, dark, order } = readCore();
    const types = await sigilTypes();
    const colorTokens = [...new Set([...types.map((t) => t.type), ...Object.values(BRACE_TYPES)])]
      .map((type) => `--op-${type}-color`)
      .filter((name) => light.has(name));
    const names = [...closure([...TOKENS, ...colorTokens, '--op-binding-color'], light)]
      .sort((a, b) => order.get(a) - order.get(b));
    const darkNames = names.filter((name) => dark.has(name));
    // A literal color the site never restates for dark stays its light value on a dark ground.
    const undarkened = names.filter((name) => !dark.has(name) && /^(hsl|rgb|#)/.test(light.get(name)));

    const faces = readFaces();
    const fontFiles = new Map();
    const fonts = [];
    for (const [unit, wanted] of Object.entries(UNITS)) {
      for (const want of wanted) {
        const face = faces.find((f) => f.family === want.family && f.style === want.style && f.file === want.file);
        if (!face) fail(`${rel(FONTS_CSS)} has no ${want.style} ${want.family} face in ${want.file}`);
        const source = path.join(ROOT, 'public/fonts', face.file);
        const bytes = fs.readFileSync(source);
        const sha256 = createHash('sha256').update(bytes).digest('hex');
        const file = face.file.replace(/\.woff2$/, `.${sha256.slice(0, 10)}.woff2`);
        fontFiles.set(`${unit}/${file}`, { unit, file, bytes });
        if (!fonts.some((f) => f.file === file)) {
          fonts.push({ family: face.family, style: face.style, weight: face.weight, display: face.display, unicodeRange: face.unicodeRange, file, bytes: bytes.length, sha256, source: `public/fonts/${face.file}` });
        }
      }
    }

    // Scripts: one bundle per entry, absolute /public/ imports resolved from the repo.
    const { build: bundle } = await import(pathToFileURL(ESBUILD).href);
    const publicRoot = { name: 'public-root', setup(b) { b.onResolve({ filter: /^\/public\// }, (args) => ({ path: path.join(ROOT, args.path) })); } };
    const scriptFiles = new Map();
    const scripts = [];
    for (const [unit, entries] of Object.entries(SCRIPTS)) {
      for (const { name, entry } of entries) {
        const result = await bundle({
          entryPoints: [path.join(ROOT, entry)],
          bundle: true,
          format: 'esm',
          platform: 'browser',
          target: ['es2022'],
          minify: true,
          legalComments: 'none',
          write: false,
          logLevel: 'silent',
          plugins: [publicRoot],
          banner: { js: `/* ${entry}, carried by scripts/build-peer-kit.mjs; do not edit. */` },
        });
        const bytes = Buffer.from(result.outputFiles[0].contents);
        const sha256 = createHash('sha256').update(bytes).digest('hex');
        const file = `${name}.${sha256.slice(0, 10)}.js`;
        scriptFiles.set(`${unit}/${file}`, { unit, file, bytes });
        if (!scripts.some((s) => s.file === file)) scripts.push({ name, file, bytes: bytes.length, sha256, source: entry });
      }
    }

    const sigils = types
      .filter((t) => light.has(`--op-${t.type}-color`))
      .map((t) => ({ sigil: t.sigil, type: t.type, color: `--op-${t.type}-color` }));
    const braces = Object.entries(BRACE_TYPES).map(([open, type]) => ({ open, type, color: `--op-${type}-color` }));

    const decl = (map, list, indent) => list.map((name) => `${indent}${name}: ${map.get(name)};`).join('\n');
    const module = `// Generated by scripts/build-peer-kit.mjs from spwashi.com's tokens and fonts — do not edit by hand.
// Sources: ${rel(CORE)} (:root and ${DARK_SELECTOR}), ${rel(FONTS_CSS)}, public/js/kernel/operator-detection.js.
// Regenerate with \`npm run build:peer-kit\`; \`npm run check:workers\` fails when this file has drifted.

/** Site tokens, light, with everything they refer to. */
export const PEER_LIGHT = \`${decl(light, names, '  ')}\`;

/** The same tokens where the site restates them for dark. */
export const PEER_DARK = \`${decl(dark, darkNames, '  ')}\`;

/** The names workers/lib/shell.js speaks, said in site tokens. */
export const PEER_ALIASES = \`${ALIASES.map(([name, value]) => `  ${name}: ${value};`).join('\n')}\`;

/** Each sigil's operator color, as the site paints it. */
export const PEER_SIGILS = Object.freeze(${JSON.stringify(sigils, null, 2)});

/** Each brace pair's color. */
export const PEER_BRACES = Object.freeze(${JSON.stringify(braces, null, 2)});

/** Faces a peer serves from its own origin, named by content hash. */
export const PEER_FONTS = Object.freeze(${JSON.stringify(fonts, null, 2)});

/** Site script modules a peer serves from its own origin under /peer/, named by content hash. */
export const PEER_SCRIPTS = Object.freeze(${JSON.stringify(scripts, null, 2)});

/** The address of a carried script by name, or null. */
export function peerScriptPath(name, base = "/peer/") {
  const script = PEER_SCRIPTS.find((item) => item.name === name);
  return script ? \`\${base}\${script.file}\` : null;
}

/**
 * The tokens as one stylesheet. dark: "system" follows the reader's system,
 * "never" keeps the light material (a peer that forces light).
 */
export function peerTokens({ dark = "system" } = {}) {
  const root = \`:root {\\n  color-scheme: \${dark === "system" ? "light dark" : "light"};\\n\${PEER_LIGHT}\\n\${PEER_ALIASES}\\n}\`;
  if (dark !== "system") return root;
  return \`\${root}\\n@media (prefers-color-scheme: dark) {\\n:root {\\n\${PEER_DARK}\\n}\\n}\`;
}

/** @font-face rules for the faces, served under base on the peer's own origin. */
export function peerFontFaces(base = "/fonts/") {
  return PEER_FONTS.map((face) => \`@font-face { font-family: "\${face.family}"; font-style: \${face.style}; font-weight: \${face.weight}; font-display: \${face.display}; src: url("\${base}\${face.file}") format("woff2"); unicode-range: \${face.unicodeRange}; }\`).join("\\n");
}

/** Preload links for the faces a page sets above the fold. */
export function peerFontPreloads(base = "/fonts/") {
  return PEER_FONTS.map((face) => \`<link rel="preload" href="\${base}\${face.file}" as="font" type="font/woff2" crossorigin>\`).join("\\n  ");
}
`;
    return { module, fontFiles, scriptFiles, undarkened };
  })();
}

const check = process.argv.includes('--check');
const { module, fontFiles, scriptFiles, undarkened } = await build();
if (undarkened.length) console.log(`[build:peer-kit] note: the site gives no dark value for ${undarkened.join(', ')}`);
const drift = [];

if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== module) drift.push(rel(OUT));
for (const unit of Object.keys(UNITS)) {
  const dir = path.join(ROOT, 'workers', unit, 'assets', 'fonts');
  const want = [...fontFiles.values()].filter((f) => f.unit === unit);
  const have = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith('.woff2')) : [];
  for (const f of want) {
    const at = path.join(dir, f.file);
    if (!fs.existsSync(at) || !fs.readFileSync(at).equals(f.bytes)) drift.push(rel(at));
  }
  for (const name of have) if (!want.some((f) => f.file === name)) drift.push(`${rel(path.join(dir, name))} (stale)`);
}
for (const unit of Object.keys(SCRIPTS)) {
  const dir = path.join(ROOT, 'workers', unit, 'assets', 'peer');
  const want = [...scriptFiles.values()].filter((f) => f.unit === unit);
  const have = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith('.js')) : [];
  for (const f of want) {
    const at = path.join(dir, f.file);
    if (!fs.existsSync(at) || !fs.readFileSync(at).equals(f.bytes)) drift.push(rel(at));
  }
  for (const name of have) if (!want.some((f) => f.file === name)) drift.push(`${rel(path.join(dir, name))} (stale)`);
}

if (check) {
  if (drift.length) fail(`drifted from the site: ${drift.join(', ')}. Run npm run build:peer-kit.`);
  console.log(`[build:peer-kit] current: ${rel(OUT)}, ${fontFiles.size} font file(s) and ${scriptFiles.size} script(s)`);
} else {
  fs.writeFileSync(OUT, module);
  for (const unit of Object.keys(UNITS)) {
    const dir = path.join(ROOT, 'workers', unit, 'assets', 'fonts');
    fs.mkdirSync(dir, { recursive: true });
    const want = [...fontFiles.values()].filter((f) => f.unit === unit);
    for (const name of fs.readdirSync(dir)) if (name.endsWith('.woff2') && !want.some((f) => f.file === name)) fs.rmSync(path.join(dir, name));
    for (const f of want) fs.writeFileSync(path.join(dir, f.file), f.bytes);
  }
  for (const unit of Object.keys(SCRIPTS)) {
    const dir = path.join(ROOT, 'workers', unit, 'assets', 'peer');
    fs.mkdirSync(dir, { recursive: true });
    const want = [...scriptFiles.values()].filter((f) => f.unit === unit);
    for (const name of fs.readdirSync(dir)) if (name.endsWith('.js') && !want.some((f) => f.file === name)) fs.rmSync(path.join(dir, name));
    for (const f of want) fs.writeFileSync(path.join(dir, f.file), f.bytes);
  }
  console.log(`[build:peer-kit] wrote ${rel(OUT)}${drift.length ? ` (changed: ${drift.join(', ')})` : ' (unchanged)'}`);
}
