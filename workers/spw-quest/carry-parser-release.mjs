// Carry one parser build from the workbench into spw.quest's static assets.
//   node workers/spw-quest/carry-parser-release.mjs <cut-dir>   copy into assets/parser/<name>/, rewrite the index it belongs to
//   node workers/spw-quest/carry-parser-release.mjs --check     verify every build in assets, and both indexes
//   --prune <N>      keep the newest N prereleases and remove the rest (releases are never pruned); alone, or after a carry
//   --assets <dir>   another assets directory (the tests use one)
//   --allow-dirty    carry a build the workbench cut from a tree with uncommitted changes
//
// <cut-dir> is the workbench's release/parser/<name>/ (npm run bundle:parser there), where a
// name is a release day YYYY.MM.DD, a prerelease YYYY.MM.DD-pre.N headed for that day, or a
// patch YYYY.MM.DD-patch.N of that published day. Every listed file's bytes, sha256 and
// integrity must match manifest.json, parser.js must be the same bytes as full.min.js, and every
// script's build stamp must name the build (and say prerelease or patch). A name is cut once:
// different bytes at a name already carried are refused. Releases and patches are published:
// tracked in git and listed in assets/parser/index.json. Prereleases are gitignored, deploy from
// the working tree, and are listed in assets/parser/prereleases.json; a prerelease carry or prune
// never touches index.json.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  DEFAULT_FILE, FILE_PATTERN, INDEX_SCHEMA, PRE_INDEX_SCHEMA, RELEASE_SCHEMA, isCalendarDay, isPublished, newestFirst, readName,
} from "./src/parser-releases.js";

export const DEFAULT_ASSETS = fileURLToPath(new URL("./assets", import.meta.url));
/** The two indexes: published builds (releases and patches), and prereleases. */
const INDEXES = {
  published: { file: "index.json", schema: INDEX_SCHEMA, key: "releases", what: "releases and patches", keeps: isPublished },
  prerelease: { file: "prereleases.json", schema: PRE_INDEX_SCHEMA, key: "prereleases", what: "prereleases", keeps: (kind) => kind === "prerelease" },
};
const groupOf = (kind) => (kind === "prerelease" ? "prerelease" : "published");
/** What to do instead of re-cutting a name already carried. */
const INSTEAD = {
  release: "a published day never changes; cut a patch of it (YYYY.MM.DD-patch.N)",
  patch: "a published patch never changes; cut the next -patch.N",
  prerelease: "a carried prerelease never changes; cut the next -pre.N",
};
/** A stamp field set true, minified (prerelease:!0) or not ("prerelease":true). */
const stampSays = (bytes, field) => new RegExp(`["']?${field}["']?\\s*:\\s*(?:!0|true)\\b`).test(bytes.toString("utf8"));

export class CarryError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.problems = problems;
  }
}

const hash = (algorithm, bytes, encoding) => createHash(algorithm).update(bytes).digest(encoding);
const exists = (file) => stat(file).then(() => true, () => false);

/** Every SRI token (sha256-, sha384-, sha512-) must match; at least one must be present. */
function integrityMatches(bytes, integrity) {
  const tokens = String(integrity ?? "").trim().split(/\s+/)
    .map((token) => token.match(/^(sha256|sha384|sha512)-([A-Za-z0-9+/]+={0,2})/)).filter(Boolean);
  return tokens.length > 0 && tokens.every(([, algorithm, value]) => hash(algorithm, bytes, "base64") === value);
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries.map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name)).sort();
}

/** What a manifest owes its name: the schema, a kind and day that agree with the name, and a full revision. */
function manifestProblems(manifest) {
  const problems = [];
  if (manifest.schema !== RELEASE_SCHEMA) problems.push(`manifest.json: schema is ${JSON.stringify(manifest.schema)}, not ${RELEASE_SCHEMA}`);
  const named = readName(manifest.name);
  if (!named) {
    problems.push(`manifest.json: name ${JSON.stringify(manifest.name)} is not YYYY.MM.DD, YYYY.MM.DD-pre.N or YYYY.MM.DD-patch.N`);
  } else {
    if (!isCalendarDay(named.day)) problems.push(`manifest.json: ${named.day} is not a day on the calendar`);
    if (manifest.kind !== named.kind) problems.push(`manifest.json: kind is ${JSON.stringify(manifest.kind)}, but ${named.name} names a ${named.kind}`);
    if (manifest.day !== named.day) problems.push(`manifest.json: day is ${JSON.stringify(manifest.day)}, but ${named.name} says ${named.day}`);
    for (const field of ["pre", "patch"]) {
      if ((manifest[field] ?? null) !== (named[field] ?? null)) problems.push(`manifest.json: ${field} is ${JSON.stringify(manifest[field] ?? null)}, but ${named.name} says ${named[field] ?? "none"}`);
    }
  }
  if (!/^[0-9a-f]{40}$/.test(manifest.workbench?.revision ?? "")) problems.push("manifest.json: workbench.revision is not a 40-hex revision");
  return problems;
}

/**
 * Read a cut against its manifest.
 * contents: path → bytes for manifest.json and every listed file that exists.
 * unlisted: entries in the folder the manifest does not name.
 */
export async function readRelease(dir) {
  let manifestBytes;
  try {
    manifestBytes = await readFile(path.join(dir, "manifest.json"));
  } catch {
    return { manifest: null, contents: new Map(), unlisted: [], problems: ["manifest.json is missing"] };
  }
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString("utf8"));
  } catch (error) {
    return { manifest: null, contents: new Map(), unlisted: [], problems: [`manifest.json does not parse: ${error.message}`] };
  }
  const problems = manifestProblems(manifest);
  const kind = readName(manifest.name)?.kind;
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  if (!files.length) problems.push("manifest.json: files is empty");

  const contents = new Map([["manifest.json", manifestBytes]]);
  for (const file of files) {
    if (typeof file?.path !== "string" || !FILE_PATTERN.test(file.path) || file.path === "manifest.json") {
      problems.push(`files: ${JSON.stringify(file?.path)} is not a file name inside the folder`);
      continue;
    }
    if (contents.has(file.path)) {
      problems.push(`${file.path}: listed twice`);
      continue;
    }
    let bytes;
    try {
      bytes = await readFile(path.join(dir, file.path));
    } catch {
      problems.push(`${file.path}: missing`);
      continue;
    }
    contents.set(file.path, bytes);
    if (bytes.length !== file.bytes) problems.push(`${file.path}: ${bytes.length} bytes, the manifest says ${file.bytes}`);
    if (hash("sha256", bytes, "hex") !== String(file.sha256).toLowerCase()) problems.push(`${file.path}: sha256 differs from the manifest`);
    if (!integrityMatches(bytes, file.integrity)) problems.push(`${file.path}: integrity differs from the manifest`);
    // The guide's banner reads the stamp: a script must name its build, and a prerelease or patch must say which.
    if (file.path.endsWith(".js") && kind) {
      if (!bytes.includes(`"${manifest.name}"`)) problems.push(`${file.path}: its SPW_PARSER_BUILD stamp does not name ${manifest.name}`);
      else if (kind !== "release" && !stampSays(bytes, kind)) problems.push(`${file.path}: its SPW_PARSER_BUILD stamp does not say ${kind}: true`);
    }
  }

  // The default is parser.js, an alias with the same bytes as the file it names.
  const byPath = new Map(files.map((file) => [file?.path, file]));
  const fallback = manifest.default ?? {};
  const defaultFile = byPath.get(fallback.path);
  if (fallback.path !== DEFAULT_FILE) problems.push(`default.path is ${JSON.stringify(fallback.path)}, not ${DEFAULT_FILE}`);
  if (!defaultFile) {
    problems.push(`default.path ${JSON.stringify(fallback.path)} is not a listed file`);
  } else {
    const aliased = byPath.get(defaultFile.alias);
    if (!aliased) problems.push(`${fallback.path}: aliases ${JSON.stringify(defaultFile.alias)}, which is not a listed file`);
    else {
      // An alias may name its own variant and form; when it does not, it has its target's.
      const variant = defaultFile.variant ?? aliased.variant;
      const form = defaultFile.form ?? aliased.form;
      if (variant !== fallback.variant || form !== fallback.form || aliased.variant !== fallback.variant || aliased.form !== fallback.form) {
        problems.push(`default says ${fallback.variant} ${fallback.form}, but ${fallback.path} is ${variant} ${form} and ${aliased.path} is ${aliased.variant} ${aliased.form}`);
      }
      const [aliasBytes, targetBytes] = [contents.get(defaultFile.path), contents.get(aliased.path)];
      if (aliasBytes && targetBytes && !aliasBytes.equals(targetBytes)) problems.push(`${defaultFile.path}: not the same bytes as ${aliased.path}`);
    }
  }

  const unlisted = (await listFiles(dir)).filter((rel) => !contents.has(rel) && !byPath.has(rel));
  return { manifest, contents, unlisted, problems };
}

/** One index (published or prerelease): every carried name it keeps, newest first, read from the manifests. */
export async function buildIndex(assetsDir, group = "published") {
  const { schema, key, keeps } = INDEXES[group];
  const parserDir = path.join(assetsDir, "parser");
  const entries = await readdir(parserDir, { withFileTypes: true }).catch(() => []);
  const listed = [];
  for (const entry of entries) {
    const named = readName(entry.name);
    if (!entry.isDirectory() || !keeps(named?.kind)) continue;
    try {
      const manifest = JSON.parse(await readFile(path.join(parserDir, entry.name, "manifest.json"), "utf8"));
      if (manifest.name !== entry.name) continue;
      const { name, kind, day, pre, patch } = named;
      listed.push({ name, kind, day, ...(pre ? { pre } : {}), ...(patch ? { patch } : {}), revision: manifest.workbench?.revision });
    } catch {
      // --check reports the unreadable manifest; the index skips it.
    }
  }
  return { schema, [key]: listed.sort(newestFirst) };
}

export const indexText = (index) => `${JSON.stringify(index, null, 2)}\n`;

async function saveIndex(assetsDir, group, index) {
  await mkdir(path.join(assetsDir, "parser"), { recursive: true });
  await writeFile(path.join(assetsDir, "parser", INDEXES[group].file), indexText(index));
  return index;
}

export const writeIndex = async (assetsDir, group = "published") => saveIndex(assetsDir, group, await buildIndex(assetsDir, group));

/** Keep the newest `keep` prereleases and remove the rest: prereleases.json drops them first, then their folders go. */
export async function prunePrereleases(assetsDir = DEFAULT_ASSETS, keep = 0) {
  if (!Number.isInteger(keep) || keep < 0) throw new CarryError(`--prune takes a whole number of prereleases to keep, not ${keep}`);
  const index = await buildIndex(assetsDir, "prerelease");
  const removed = index.prereleases.slice(keep).map((entry) => entry.name);
  const kept = { ...index, prereleases: index.prereleases.slice(0, keep) };
  if (removed.length || await exists(path.join(assetsDir, "parser", INDEXES.prerelease.file))) await saveIndex(assetsDir, "prerelease", kept);
  for (const name of removed) await rm(path.join(assetsDir, "parser", name), { recursive: true, force: true });
  return { kept: kept.prereleases.map((entry) => entry.name), removed, index: kept };
}

/** Copy one verified cut into assets/parser/<name>/ and rewrite the index of its kind. */
export async function carryRelease(sourceDir, assetsDir = DEFAULT_ASSETS, { allowDirty = false } = {}) {
  const source = await readRelease(sourceDir);
  if (source.problems.length) throw new CarryError(`${sourceDir} does not match its manifest`, source.problems);
  const { manifest } = source;
  const { kind, name } = readName(manifest.name);
  const folder = path.basename(path.resolve(sourceDir));
  if (readName(folder) && folder !== name) throw new CarryError(`${sourceDir} holds ${kind} ${name}, not ${folder}`);
  if (manifest.dirty && !allowDirty) {
    throw new CarryError(`${kind} ${name} was cut from a tree with uncommitted changes; its revision does not rebuild it. Pass --allow-dirty to carry it anyway.`);
  }

  const target = path.join(assetsDir, "parser", name);
  const differing = [];
  const copy = [];
  for (const [rel, bytes] of source.contents) {
    const existing = await readFile(path.join(target, rel)).catch(() => null);
    if (!existing) copy.push(rel);
    else if (!existing.equals(bytes)) differing.push(rel);
  }
  // Anything already carried under this name that this cut does not list differs from it too.
  const listed = new Set([...source.contents.keys(), ...source.unlisted]);
  differing.push(...(await listFiles(target)).filter((rel) => !listed.has(rel)));
  if (differing.length) {
    throw new CarryError(`assets/parser/${name} already holds different bytes at these paths: ${INSTEAD[kind]}`, differing);
  }

  // Files first and the manifest last, so the worker never reads a manifest naming a file that is not there.
  const order = [...copy.filter((rel) => rel !== "manifest.json"), ...copy.filter((rel) => rel === "manifest.json")];
  for (const rel of order) {
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, rel), source.contents.get(rel));
  }
  const carried = await readRelease(target);
  if (carried.problems.length) throw new CarryError(`assets/parser/${name} does not verify after the copy`, carried.problems);
  // Each cut rewrites only its own index: a prerelease never reaches index.json, so latest.js never lands on one.
  return { name, kind, copied: order, skipped: source.unlisted, index: await writeIndex(assetsDir, groupOf(kind)) };
}

/** Verify every release, patch and prerelease in assets against its manifest, and both indexes against them. */
export async function checkAssets(assetsDir = DEFAULT_ASSETS) {
  const parserDir = path.join(assetsDir, "parser");
  const entries = await readdir(parserDir, { withFileTypes: true }).catch(() => null);
  if (!entries) return { releases: [], prereleases: [], problems: [`${parserDir} does not exist`] };
  const problems = [];
  const found = { published: [], prerelease: [] };
  for (const entry of entries) {
    if (entry.isFile() && Object.values(INDEXES).some((index) => index.file === entry.name)) continue;
    const named = readName(entry.name);
    if (!entry.isDirectory() || !named) {
      problems.push(`parser/${entry.name}: not a release (YYYY.MM.DD), prerelease (YYYY.MM.DD-pre.N) or patch (YYYY.MM.DD-patch.N)`);
      continue;
    }
    const { manifest, unlisted, problems: own } = await readRelease(path.join(parserDir, entry.name));
    problems.push(...own.map((problem) => `parser/${entry.name}/${problem}`));
    if (!manifest) continue;
    found[groupOf(named.kind)].push(entry.name);
    if (manifest.name !== entry.name) problems.push(`parser/${entry.name}: manifest.json names ${manifest.name}`);
    for (const rel of unlisted) problems.push(`parser/${entry.name}/${rel}: not in the manifest`);
  }
  for (const [group, { file, key, what }] of Object.entries(INDEXES)) {
    const index = await buildIndex(assetsDir, group);
    const actual = await readFile(path.join(parserDir, file), "utf8").catch(() => null);
    // A tree with no prereleases may have no prereleases.json at all; index.json is tracked and always there.
    if (actual === null && group === "prerelease" && !index[key].length) continue;
    if (actual !== indexText(index)) problems.push(`parser/${file} does not list the ${what} in assets, newest first; carrying one rewrites it`);
  }
  return { releases: found.published, prereleases: found.prerelease, problems };
}

const USAGE = "usage: node workers/spw-quest/carry-parser-release.mjs <cut-dir> [--allow-dirty] [--prune <N>] | --prune <N> | --check  [--assets <dir>]";

/** Take `--flag value` out of args: undefined when absent, null when the value is missing. */
function takeOption(args, flag) {
  const at = args.indexOf(flag);
  if (at < 0) return undefined;
  const [, value = null] = args.splice(at, 2);
  return value;
}

export async function main(argv) {
  const args = [...argv];
  const say = (line) => console.log(`[carry-parser-release] ${line}`);
  const complain = (line, problems = []) => console.error([`[carry-parser-release] ${line}`, ...problems.map((p) => `  ${p}`)].join("\n"));
  const assetsOption = takeOption(args, "--assets");
  const assetsDir = assetsOption === undefined ? DEFAULT_ASSETS : path.resolve(assetsOption ?? "");
  const pruneOption = takeOption(args, "--prune");
  if (pruneOption !== undefined && !/^\d+$/.test(pruneOption ?? "")) {
    complain(`--prune takes the number of prereleases to keep, like --prune 3\n${USAGE}`);
    return 2;
  }
  if (args.includes("--check")) {
    const { releases, prereleases, problems } = await checkAssets(assetsDir);
    if (problems.length) {
      complain(`${problems.length} problem(s) in ${path.relative(process.cwd(), assetsDir) || assetsDir}`, problems);
      return 1;
    }
    say(`${releases.length} release(s) and patch(es) in assets match their manifests; index.json is current`);
    say(`${prereleases.length} prerelease(s) in assets match their manifests; prereleases.json is current`);
    return 0;
  }
  const allowDirty = args.includes("--allow-dirty");
  const [source] = args.filter((arg) => !arg.startsWith("--"));
  if (!source && pruneOption === undefined) {
    complain(USAGE);
    return 2;
  }
  try {
    if (source) {
      const result = await carryRelease(path.resolve(source), assetsDir, { allowDirty });
      say(result.copied.length
        ? `carried ${result.kind} ${result.name}: ${result.copied.join(", ")}`
        : `${result.kind} ${result.name} is already carried, byte for byte`);
      if (result.skipped.length) say(`not in the manifest, left behind: ${result.skipped.join(", ")}`);
      const { file, key } = INDEXES[groupOf(result.kind)];
      say(`${file} lists ${result.index[key].map((entry) => entry.name).join(", ")}, newest first`);
    }
    if (pruneOption !== undefined) {
      const { kept, removed } = await prunePrereleases(assetsDir, Number(pruneOption));
      say(removed.length ? `pruned ${removed.join(", ")}; kept ${kept.join(", ") || "none"}` : `nothing to prune; ${kept.length} prerelease(s) kept`);
    }
    return 0;
  } catch (error) {
    if (!(error instanceof CarryError)) throw error;
    complain(error.message, error.problems);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2));
}
