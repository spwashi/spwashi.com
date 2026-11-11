// Reads which arcs of Spw are in season from the site's history, and writes
// /arcs/ (src/arcs.js).
//   node --import ./scripts/tests/register-public-imports.mjs workers/spw-quest/carry-arcs.mjs          read history, write all three
//   node --import ./scripts/tests/register-public-imports.mjs workers/spw-quest/carry-arcs.mjs --check  the page and JSON match src/arcs-data.js
//
// A line is counted on the day it first appeared on a page: in each commit of
// the last season (90 days back from HEAD's own date, so a re-run on the same
// HEAD writes the same file), the semantic expressions a route's HTML gained,
// less the ones the same commit took away from that route (a line moved or
// re-indented is not new). Each is read into the shelf's shape
// (src/specimen-reading.js) and counted by lens, projection, mark, subject and
// shape over the last 7, 30 and 90 days.
//
// src/arcs-data.js moves with every commit that writes a route, so --check
// holds only the page and the JSON to the carried data; run this without it
// to refresh the season (before a deploy, or when the shelf's rooms change).
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSpecimen } from "./src/specimen-reading.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const DATA = path.join(HERE, "src/arcs-data.js");
const PAGE = path.join(HERE, "assets/arcs/index.html");
const JSON_FILE = path.join(HERE, "assets/arcs/index.json");
const WINDOWS = [7, 30, 90];
const TOP = 10;
const DAY = 86_400_000;
const MARKS = /^[~?!*.^#@&=%$]+/;
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };
const decode = (value) => value.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, name) => ENTITIES[name]);
const ATTRIBUTE = /data-spw-semantic-expression="([^"]*)"/g;

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });

const routeOf = (file) => `/${file.replace(/(^|\/)index\.html$/, "$1")}`;

/** Every line new to a route in the season before `head`, with its day and route. */
export function newLines(head) {
  const since = new Date(head.getTime() - WINDOWS.at(-1) * DAY).toISOString();
  const log = git("log", `--since=${since}`, `--until=${head.toISOString()}`, "--format=%x1e%H %cI", "-p", "--unified=0", "--no-renames",
    "-G", "data-spw-semantic-expression=", "--", "*.html", ":!workers/**", ":!.agents/**", ":!.spw/**", ":!node_modules/**");
  const lines = [];
  let day = null;
  let file = null;
  let gained = new Map();
  let lost = new Map();
  const settle = () => {
    for (const [key, list] of gained) {
      const gone = [...(lost.get(key) || [])];
      for (const line of list) {
        const at = gone.indexOf(line);
        if (at !== -1) gone.splice(at, 1);
        else lines.push({ line, day, route: routeOf(key) });
      }
    }
    gained = new Map();
    lost = new Map();
  };
  const take = (map, text) => {
    for (const [, raw] of text.matchAll(ATTRIBUTE)) {
      const line = decode(raw).trim();
      if (line) map.set(file, [...(map.get(file) || []), line]);
    }
  };
  for (const text of log.split("\n")) {
    // A commit opens with a record separator (a hunk's own header also starts "@@").
    if (text.startsWith("\x1e")) {
      settle();
      day = text.split(" ")[1].slice(0, 10);
    } else if (text.startsWith("+++ ")) {
      file = text.startsWith("+++ b/") ? text.slice(6) : null;
    } else if (text.startsWith("--- ")) {
      if (text.startsWith("--- a/")) file = text.slice(6);
    } else if (file && text.startsWith("+")) take(gained, text);
    else if (file && text.startsWith("-")) take(lost, text);
  }
  settle();
  return lines;
}

const GLYPH = { subject: "word", mode: "[lens]", body: "{body}", scope: "(scene)", projection: "<point>" };

/** The arcs one line stands in: its lens, projection, mark, subject and shape. */
function arcsOf(line) {
  const { shape, slots } = readSpecimen(line);
  const subject = shape.subject || "";
  const mark = subject.startsWith("#>") ? "#>" : (subject.match(MARKS)?.[0] ?? "");
  const word = subject.slice(mark.length);
  const join = String(slots.join || "").match(/^[~^&@]+/)?.[0] || "&";
  const signature = Object.keys(slots).map((key) => GLYPH[key] ?? (key === "join" ? ` ${join} ` : key === "with" ? "word…" : "")).join("");
  return {
    lenses: shape.mode ? [shape.mode] : [],
    projections: shape.projection ? [shape.projection] : [],
    // A line with no mark is the ground; the page says how many, and counts only the marks.
    marks: mark ? [mark] : [],
    subjects: word ? [word] : [],
    shapes: signature ? [`${mark}${signature}`] : [],
  };
}

/** Count each arc over the windows, newest example kept; the top of each kind, by month then season. */
export function season(lines, head, asOf = head.toISOString().slice(0, 10)) {
  const today = Date.parse(`${asOf}T00:00:00Z`);
  const ageOf = (day) => Math.round((today - Date.parse(`${day}T00:00:00Z`)) / DAY);
  const kinds = { lenses: new Map(), projections: new Map(), marks: new Map(), subjects: new Map(), shapes: new Map() };
  const total = WINDOWS.map(() => 0);
  for (const { line, day, route } of [...lines].sort((a, b) => a.day.localeCompare(b.day))) {
    const age = ageOf(day);
    const inside = WINDOWS.map((window) => age < window);
    inside.forEach((yes, index) => { if (yes) total[index] += 1; });
    for (const [kind, keys] of Object.entries(arcsOf(line))) {
      for (const key of keys) {
        const arc = kinds[kind].get(key) || { key, counts: WINDOWS.map(() => 0), example: line, route };
        inside.forEach((yes, index) => { if (yes) arc.counts[index] += 1; });
        arc.example = line;
        arc.route = route;
        kinds[kind].set(key, arc);
      }
    }
  }
  const ranked = (map) => [...map.values()]
    .filter((arc) => arc.counts.at(-1) > 1)
    .sort((a, b) => b.counts[1] - a.counts[1] || b.counts[2] - a.counts[2] || a.key.localeCompare(b.key))
    .slice(0, TOP)
    .map((arc) => ({ ...arc, rising: total[0] > 0 && arc.counts[0] >= 2 && arc.counts[0] / total[0] > 1.25 * (arc.counts[1] / Math.max(total[1], 1)) }));
  return {
    asOf,
    windows: WINDOWS,
    total,
    ...Object.fromEntries(Object.entries(kinds).map(([kind, map]) => [kind, ranked(map)])),
  };
}

export const dataModule = (arcs) => `// Written by workers/spw-quest/carry-arcs.mjs from the site's history; do not edit by hand.
// Refresh it by running the carry; the page in assets/arcs/ is rendered from it (src/arcs.js).
export const ARCS = Object.freeze(${JSON.stringify(arcs, null, 2)});
`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  if (!check) {
    // HEAD's own date, as its commit wrote it, so the season ends where the history does.
    const stamp = git("log", "-1", "--format=%cI").trim();
    const head = new Date(stamp);
    const arcs = season(newLines(head), head, stamp.slice(0, 10));
    await writeFile(DATA, dataModule(arcs));
    console.log(`[carry-arcs] read ${arcs.total.join(" / ")} new lines (week / month / season) up to ${arcs.asOf}`);
  }
  // Render from the data on disk, in a fresh import, so --check holds the page to the carried season.
  const { renderArcs, arcsJson } = await import(`./src/arcs.js?at=${Date.now()}`);
  const { ARCS } = await import(`./src/arcs-data.js?at=${Date.now()}`);
  const { ORIGIN, asServed } = await import("./src/crawl.js");
  // The page as the worker serves it, so the assets layer can answer /arcs/ (src/crawl.js STATIC_PATTERNS).
  const outputs = { [PAGE]: asServed(renderArcs(ARCS), new URL("/arcs/", ORIGIN)), [JSON_FILE]: arcsJson(ARCS) };
  if (check) {
    const stale = [];
    for (const [file, text] of Object.entries(outputs)) if ((await readFile(file, "utf8").catch(() => "")) !== text) stale.push(path.relative(HERE, file));
    if (stale.length) {
      console.error(`[carry-arcs] differs from src/arcs-data.js: ${stale.join(", ")}; run node --import ./scripts/tests/register-public-imports.mjs workers/spw-quest/carry-arcs.mjs`);
      process.exit(1);
    }
    console.log("[carry-arcs] /arcs/ matches the carried season");
  } else {
    await mkdir(path.dirname(PAGE), { recursive: true });
    for (const [file, text] of Object.entries(outputs)) await writeFile(file, text);
    console.log(`[carry-arcs] wrote ${Object.keys(outputs).map((file) => path.relative(HERE, file)).join(", ")}`);
  }
}
