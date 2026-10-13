// Carry one dated parser release from the workbench into spw.quest's static assets.
//   node workers/spw-quest/carry-parser-release.mjs <release-dir>   copy into assets/parser/<release>/, rewrite assets/parser/index.json
//   node workers/spw-quest/carry-parser-release.mjs --check         verify every release already in assets, and the index
//   --assets <dir>   another assets directory (the tests use one)
//   --allow-dirty    carry a release the workbench cut from a tree with uncommitted changes
//
// <release-dir> is the workbench's release/parser/<YYYY.MM.DD>/ (npm run bundle:parser there).
// Every listed file's bytes, sha256 and integrity must match manifest.json, and the alias
// <offset>.js must be the same bytes as the default file. A file already carried never
// changes: different bytes are refused. A re-cut moves manifest.json to a newer offset and
// adds that offset's files beside the old ones, which stay; the manifest never moves back.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FILE_PATTERN, INDEX_SCHEMA, RELEASE_PATTERN, RELEASE_SCHEMA, newestFirst } from "./src/parser-releases.js";

export const DEFAULT_ASSETS = fileURLToPath(new URL("./assets", import.meta.url));
const OFFSET_PATTERN = /^\d{2}$/;

export class CarryError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.problems = problems;
  }
}

const hash = (algorithm, bytes, encoding) => createHash(algorithm).update(bytes).digest(encoding);

/** Every SRI token (sha256-, sha384-, sha512-) must match; at least one must be present. */
function integrityMatches(bytes, integrity) {
  const tokens = String(integrity ?? "").trim().split(/\s+/)
    .map((token) => token.match(/^(sha256|sha384|sha512)-([A-Za-z0-9+/]+={0,2})/)).filter(Boolean);
  return tokens.length > 0 && tokens.every(([, algorithm, value]) => hash(algorithm, bytes, "base64") === value);
}

async function listFiles(dir, prefix = "") {
  const entries = await readdir(path.join(dir, prefix), { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(dir, rel));
    else files.push(rel);
  }
  return files.sort();
}

/** An older offset's file: its name starts with a two-digit offset below the current one. */
function olderOffset(rel, offset) {
  const own = path.posix.basename(rel).match(/^(\d{2})\./);
  return Boolean(own) && FILE_PATTERN.test(rel) && Number(own[1]) < Number(offset);
}

/**
 * Read a release directory against its manifest.
 * contents: manifest path → bytes for manifest.json and every listed file that exists.
 * unlisted: files in the directory the manifest does not name (older offsets, or strays).
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
  const problems = [];
  if (manifest.schema !== RELEASE_SCHEMA) problems.push(`manifest.json: schema is ${JSON.stringify(manifest.schema)}, not ${RELEASE_SCHEMA}`);
  if (!RELEASE_PATTERN.test(manifest.release ?? "")) problems.push(`manifest.json: release ${JSON.stringify(manifest.release)} is not YYYY.MM.DD`);
  if (!OFFSET_PATTERN.test(manifest.offset ?? "")) problems.push(`manifest.json: offset ${JSON.stringify(manifest.offset)} is not two digits`);
  if (!/^[0-9a-f]{7,40}$/.test(manifest.workbench?.revision ?? "")) problems.push("manifest.json: workbench.revision is missing");
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  if (!files.length) problems.push("manifest.json: files is empty");

  const contents = new Map([["manifest.json", manifestBytes]]);
  for (const file of files) {
    if (typeof file?.path !== "string" || !FILE_PATTERN.test(file.path) || file.path === "manifest.json") {
      problems.push(`files: ${JSON.stringify(file?.path)} is not a path inside a release`);
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
  }

  // The default is a listed file, and the alias <offset>.js is the same bytes.
  const byPath = new Map(files.map((file) => [file?.path, file]));
  const fallback = manifest.default ?? {};
  const defaultFile = byPath.get(fallback.path);
  if (!defaultFile) problems.push(`default.path ${JSON.stringify(fallback.path)} is not a listed file`);
  else if (defaultFile.variant !== fallback.variant || defaultFile.form !== fallback.form) {
    problems.push(`default says ${fallback.variant} ${fallback.form}, but ${fallback.path} is ${defaultFile.variant} ${defaultFile.form}`);
  }
  const aliasPath = `${manifest.offset}.js`;
  const alias = byPath.get(aliasPath);
  if (!alias) problems.push(`${aliasPath}: the alias is not listed`);
  else {
    if (typeof alias.alias === "string" && alias.alias !== fallback.path) problems.push(`${aliasPath}: aliases ${alias.alias}, not the default ${fallback.path}`);
    const [aliasBytes, defaultBytes] = [contents.get(aliasPath), contents.get(fallback.path)];
    if (aliasBytes && defaultBytes && !aliasBytes.equals(defaultBytes)) problems.push(`${aliasPath}: not the same bytes as the default ${fallback.path}`);
  }

  const unlisted = (await listFiles(dir)).filter((rel) => !contents.has(rel) && !byPath.has(rel));
  return { manifest, contents, unlisted, problems };
}

/** The index the worker reads: every carried release, newest first. */
export async function buildIndex(assetsDir) {
  const parserDir = path.join(assetsDir, "parser");
  const entries = await readdir(parserDir, { withFileTypes: true }).catch(() => []);
  const releases = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !RELEASE_PATTERN.test(entry.name)) continue;
    try {
      const manifest = JSON.parse(await readFile(path.join(parserDir, entry.name, "manifest.json"), "utf8"));
      releases.push({ release: manifest.release, offset: manifest.offset, revision: manifest.workbench?.revision, default: manifest.default });
    } catch {
      // --check reports the unreadable manifest; the index skips it.
    }
  }
  return { schema: INDEX_SCHEMA, releases: releases.sort(newestFirst) };
}

export const indexText = (index) => `${JSON.stringify(index, null, 2)}\n`;

export async function writeIndex(assetsDir) {
  const index = await buildIndex(assetsDir);
  await mkdir(path.join(assetsDir, "parser"), { recursive: true });
  await writeFile(path.join(assetsDir, "parser", "index.json"), indexText(index));
  return index;
}

/** Copy one verified release into assets/parser/<release>/ and rewrite the index. */
export async function carryRelease(sourceDir, assetsDir = DEFAULT_ASSETS, { allowDirty = false } = {}) {
  const source = await readRelease(sourceDir);
  if (source.problems.length) throw new CarryError(`${sourceDir} does not match its manifest`, source.problems);
  const { manifest } = source;
  const named = path.basename(path.resolve(sourceDir));
  if (RELEASE_PATTERN.test(named) && named !== manifest.release) {
    throw new CarryError(`${sourceDir} holds release ${manifest.release}, not ${named}`);
  }
  if (manifest.dirty && !allowDirty) {
    throw new CarryError(`release ${manifest.release} was cut from a tree with uncommitted changes; its revision does not rebuild it. Pass --allow-dirty to carry it anyway.`);
  }

  const target = path.join(assetsDir, "parser", manifest.release);
  const differing = [];
  const copy = [];
  for (const [rel, bytes] of source.contents) {
    const existing = await readFile(path.join(target, rel)).catch(() => null);
    if (rel === "manifest.json" && existing) {
      const carried = JSON.parse(existing.toString("utf8"));
      if (Number(carried.offset) > Number(manifest.offset)) {
        throw new CarryError(`release ${manifest.release} is carried at offset ${carried.offset}; the manifest never moves back to ${manifest.offset}`);
      }
      if (carried.offset === manifest.offset && !existing.equals(bytes)) differing.push(rel);
      else if (!existing.equals(bytes)) copy.push(rel);
    } else if (existing && !existing.equals(bytes)) differing.push(rel);
    else if (!existing) copy.push(rel);
  }
  // Older offsets are not in this manifest and are not carried, but one already carried must still match.
  for (const rel of source.unlisted) {
    const existing = await readFile(path.join(target, rel)).catch(() => null);
    if (existing && !existing.equals(await readFile(path.join(sourceDir, rel)))) differing.push(rel);
  }
  if (differing.length) {
    throw new CarryError(`assets/parser/${manifest.release} already holds different bytes at these paths, and a carried file never changes`, differing);
  }

  // Files first and the manifest last, so the worker never reads a manifest naming a file that is not there.
  const order = [...copy.filter((rel) => rel !== "manifest.json"), ...copy.filter((rel) => rel === "manifest.json")];
  for (const rel of order) {
    await mkdir(path.dirname(path.join(target, rel)), { recursive: true });
    await writeFile(path.join(target, rel), source.contents.get(rel));
  }
  const carried = await readRelease(target);
  if (carried.problems.length) throw new CarryError(`assets/parser/${manifest.release} does not verify after the copy`, carried.problems);
  const index = await writeIndex(assetsDir);
  return { release: manifest.release, offset: manifest.offset, copied: order, skipped: source.unlisted, index };
}

/** Verify every release in assets against its manifest, and the index against the releases. */
export async function checkAssets(assetsDir = DEFAULT_ASSETS) {
  const parserDir = path.join(assetsDir, "parser");
  const entries = await readdir(parserDir, { withFileTypes: true }).catch(() => null);
  if (!entries) return { releases: [], problems: [`${parserDir} does not exist`] };
  const problems = [];
  const releases = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name === "index.json") continue;
    if (!entry.isDirectory() || !RELEASE_PATTERN.test(entry.name)) {
      problems.push(`parser/${entry.name}: not a dated release`);
      continue;
    }
    const { manifest, unlisted, problems: own } = await readRelease(path.join(parserDir, entry.name));
    problems.push(...own.map((problem) => `parser/${entry.name}/${problem}`));
    if (!manifest) continue;
    releases.push(entry.name);
    if (manifest.release !== entry.name) problems.push(`parser/${entry.name}: manifest.json names release ${manifest.release}`);
    for (const rel of unlisted) {
      if (!olderOffset(rel, manifest.offset)) problems.push(`parser/${entry.name}/${rel}: not in the manifest, and not an older offset`);
    }
  }
  const expected = indexText(await buildIndex(assetsDir));
  const actual = await readFile(path.join(parserDir, "index.json"), "utf8").catch(() => "");
  if (actual !== expected) problems.push("parser/index.json does not list the releases in assets; carrying any release rewrites it");
  return { releases, problems };
}

export async function main(argv) {
  const args = [...argv];
  let assetsDir = DEFAULT_ASSETS;
  const at = args.indexOf("--assets");
  if (at >= 0) {
    assetsDir = path.resolve(args[at + 1] ?? "");
    args.splice(at, 2);
  }
  const say = (line) => console.log(`[carry-parser-release] ${line}`);
  const complain = (line, problems = []) => console.error([`[carry-parser-release] ${line}`, ...problems.map((p) => `  ${p}`)].join("\n"));
  if (args.includes("--check")) {
    const { releases, problems } = await checkAssets(assetsDir);
    if (problems.length) {
      complain(`${problems.length} problem(s) in ${path.relative(process.cwd(), assetsDir) || assetsDir}`, problems);
      return 1;
    }
    say(`${releases.length} release(s) in assets match their manifests; index.json is current`);
    return 0;
  }
  const allowDirty = args.includes("--allow-dirty");
  const [source] = args.filter((arg) => !arg.startsWith("--"));
  if (!source) {
    complain("usage: node workers/spw-quest/carry-parser-release.mjs <release-dir> [--allow-dirty] | --check");
    return 2;
  }
  try {
    const result = await carryRelease(path.resolve(source), assetsDir, { allowDirty });
    say(result.copied.length
      ? `carried ${result.release} offset ${result.offset}: ${result.copied.join(", ")}`
      : `${result.release} offset ${result.offset} is already carried, byte for byte`);
    if (result.skipped.length) say(`not in the manifest, left behind: ${result.skipped.join(", ")}`);
    say(`index.json lists ${result.index.releases.map((entry) => entry.release).join(", ")}`);
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
