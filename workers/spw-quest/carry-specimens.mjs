// Carry spwashi.com's Spw specimens into the spw.quest worker as data.
//   node --import ./scripts/tests/register-public-imports.mjs workers/spw-quest/carry-specimens.mjs          write src/specimens-data.js
//   node --import ./scripts/tests/register-public-imports.mjs workers/spw-quest/carry-specimens.mjs --check  exit 1 when it differs
// Three sources, read where they live: the parser tool's gallery
// (public/js/modules/tools/spw-literal-parser.js, named by tools/spw-parser/), the
// herbarium's pressed forms (.spw/language/expressions/), and every semantic
// expression the routes carry that the expression manifest reads, with the route
// and section it sits on. Each is read once here (src/specimen-reading.js), so the
// worker paints and compares without parsing on a request. Run it after any of
// those change, or the reader, the paint or expression-query.js; the specimens
// test holds the carried file to a fresh harvest.
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSpecimen } from "./src/specimen-reading.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUTPUT = path.join(ROOT, "workers/spw-quest/src/specimens-data.js");
const HERBARIUM = ".spw/language/expressions";
// Directories the expression harvest never reads (scripts/build-expression-manifest.mjs SKIP).
const SKIP = new Set(["node_modules", "dist", "dist-vite", ".git", ".spw", ".agents", ".references", ".tmp", "coverage", "tmp", "scripts", "src"]);
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };
const decode = (value) => value.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, name) => ENTITIES[name]);

async function gallery() {
  const { SPW_LITERAL_PARSER_SAMPLES } = await import("/public/js/modules/tools/spw-literal-parser.js");
  const html = await readFile(path.join(ROOT, "tools/spw-parser/index.html"), "utf8");
  const labels = new Map([...html.matchAll(/data-parser-sample="([\w-]+)">([^<]+)</g)].map(([, key, label]) => [key, label.trim()]));
  return Object.entries(SPW_LITERAL_PARSER_SAMPLES).map(([key, source]) => ({
    id: `g-${key}`,
    source: "gallery",
    name: labels.get(key) || key.replace(/_/g, " "),
    key,
    line: source,
  }));
}

/** Each `name: .{ form = `…`, … }[reg=facet]` in a herbarium file, with the block it sits in. */
async function herbarium() {
  const files = (await readdir(path.join(ROOT, HERBARIUM))).filter((name) => name.endsWith(".spw")).sort();
  const out = [];
  for (const file of files) {
    const text = await readFile(path.join(ROOT, HERBARIUM, file), "utf8");
    let group = "";
    let facet = null;
    for (const line of text.split("\n")) {
      const block = line.match(/^\^"([\w-]+)"\{/);
      if (block) group = block[1];
      const opens = line.match(/^\s+([\w-]+):\s*\.\{\s*form\s*=/);
      if (opens) facet = { name: opens[1], text: "" };
      if (!facet) continue;
      facet.text += `${line}\n`;
      if (!line.includes("}[reg=facet]")) continue;
      const field = (key) => facet.text.match(new RegExp(`\\b${key}\\s*=\\s*\`([^\`]*)\``))?.[1];
      out.push({
        id: `h-${facet.name}`,
        source: "herbarium",
        name: facet.name,
        file: `${HERBARIUM}/${file}`,
        group,
        line: field("form"),
        ...(field("note") ? { note: field("note") } : {}),
        ...(field("from") ? { from: `h-${field("from")}` } : {}),
      });
      facet = null;
    }
  }
  return out;
}

async function routeFiles(dir = ROOT, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) await routeFiles(full, out);
    } else if (entry.name === "index.html") out.push(full);
  }
  return out;
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

/**
 * Each semantic expression in a page, with the id of the nearest element that
 * holds it (itself first), so a link lands on its section. A small tag stack:
 * scripts, styles and comments are stepped over, and a close pops to its open.
 */
function expressionsIn(html) {
  const text = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  const stack = [];
  const out = [];
  for (const [tag, close, name] of text.matchAll(/<(\/?)([a-z][\w-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const lower = name.toLowerCase();
    if (close) {
      const at = stack.map((entry) => entry.name).lastIndexOf(lower);
      if (at !== -1) stack.length = at;
      continue;
    }
    const id = tag.match(/\sid="([^"]+)"/)?.[1] || "";
    const expression = tag.match(/\sdata-spw-semantic-expression="([^"]*)"/)?.[1];
    if (expression !== undefined) {
      const holder = id || [...stack].reverse().find((entry) => entry.id)?.id || "";
      out.push({ line: decode(expression), section: holder });
    }
    if (!VOID.has(lower) && !tag.endsWith("/>")) stack.push({ name: lower, id });
  }
  return out;
}

/** Where each read expression sits: its route, and the id of the element that holds it. */
async function routes() {
  const { SPW_EXPRESSION_MANIFEST } = await import("/public/js/generated/spw-expressions.js");
  const places = new Map();
  for (const file of (await routeFiles()).sort()) {
    const dir = path.relative(ROOT, path.dirname(file)).split(path.sep).join("/");
    const route = dir ? `/${dir}/` : "/";
    for (const { line, section } of expressionsIn(await readFile(file, "utf8"))) {
      if (!Object.hasOwn(SPW_EXPRESSION_MANIFEST, line)) continue;
      if (!places.has(line)) places.set(line, []);
      places.get(line).push({ route, section });
    }
  }
  // A captured run is a copy of a page; the page it copies is where the line lives.
  const rank = ({ route }) => (route.includes("/captures/runs/") ? 1 : 0);
  return [...places].map(([line, found]) => {
    const [first, ...rest] = [...found].sort((a, b) => rank(a) - rank(b));
    return { line, route: first.route, section: first.section, also: rest.length };
  }).sort((a, b) => a.route.localeCompare(b.route) || a.line.localeCompare(b.line))
    .map((entry) => ({ id: `r-${hash(entry.line)}`, source: "routes", ...entry }));
}

/** A short, stable address for a line: FNV-1a, eight hex digits. */
function hash(text) {
  let h = 0x811c9dc5;
  for (const char of text) {
    h ^= char.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export async function harvest() {
  const specimens = [...await herbarium(), ...await gallery(), ...await routes()];
  const ids = new Set();
  for (const { id } of specimens) {
    if (ids.has(id)) throw new Error(`[carry-specimens] two specimens share the id ${id}`);
    ids.add(id);
  }
  return specimens.map((specimen) => ({ ...specimen, reading: readSpecimen(specimen.line) }));
}

export function carry(specimens) {
  return `// Generated by workers/spw-quest/carry-specimens.mjs from the parser tool's gallery, ${HERBARIUM}/ and the routes' semantic expressions. Do not edit.
export const SPECIMENS = Object.freeze(${JSON.stringify(specimens, null, 0).replace(/\},\{/g, "},\n{")});
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const expected = carry(await harvest());
  if (process.argv.includes("--check")) {
    const current = await readFile(OUTPUT, "utf8").catch(() => "");
    if (current !== expected) {
      console.error("[carry-specimens] src/specimens-data.js differs from a fresh harvest; run node --import ./scripts/tests/register-public-imports.mjs workers/spw-quest/carry-specimens.mjs");
      process.exit(1);
    }
    console.log("[carry-specimens] src/specimens-data.js matches the sources");
  } else {
    await writeFile(OUTPUT, expected);
    console.log(`[carry-specimens] wrote src/specimens-data.js (${(expected.length / 1024).toFixed(1)} KiB)`);
  }
}
