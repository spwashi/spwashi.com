// Carries the site's layer onto a factshift.center snapshot, so the canvas is
// served as static files and the worker runs only for "/" (the www redirect).
// Run after refreshing assets/ (PLAN.md, "Refreshing the snapshot"); --check
// fails when anything on disk differs from a fresh carry.
//
// It writes:
// - src/snapshot-files.js: every file the shell keeps (a folder's index.html at
//   the folder's address), and the snapshot's name from version.json;
// - assets/index.html and assets/_spwashi@/index.html: the site's head lines
//   and the shell's registration line, added once;
// - assets/manifest.json: the snapshot's manifest with the site's fields on top;
// - assets/sw.js: the shell, for this snapshot and its kept files;
// - assets/_headers: the headers the worker used to send for /sw.js and the manifest;
// - assets/robots.txt and assets/sitemap.xml (src/manifest.js): crawlers are
//   welcome, the canvas is indexed, and each document names its canonical.
// Every step is idempotent, so carrying a carried snapshot changes nothing.
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROBOTS, headLines, siteManifest, sitemap } from "./src/manifest.js";
import { shellScript, withShell, withSiteHead } from "./src/shell.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(ROOT, "assets");
const LIST = path.join(ROOT, "src", "snapshot-files.js");

/** Files the site writes into assets/; the shell does not keep them. */
const SITE_FILES = new Set(["/sw.js", "/_headers", "/.assetsignore", "/robots.txt", "/sitemap.xml"]);

export const HEADERS = `# Written by workers/factshift-center/carry-shell.mjs; the worker no longer serves these files.
/
  Cache-Control: public, max-age=60

/sw.js
  Cache-Control: public, max-age=60
  X-Content-Type-Options: nosniff

/manifest.json
  Content-Type: application/manifest+json; charset=UTF-8
  Cache-Control: public, max-age=300
  X-Content-Type-Options: nosniff

/robots.txt
  Cache-Control: public, max-age=3600

/sitemap.xml
  Cache-Control: public, max-age=3600
`;

async function walk(dir, prefix = "") {
  const out = [];
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) out.push(...await walk(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

/** The addresses the shell keeps, documents first. */
export async function snapshotFiles(assets = ASSETS) {
  const files = (await walk(assets)).filter((file) => !SITE_FILES.has(file) && !file.endsWith("/service-worker.js"));
  const documents = files.filter((file) => file.endsWith("/index.html")).map((file) => file.slice(0, -"index.html".length));
  const rest = files.filter((file) => !file.endsWith("/index.html"));
  return [...documents.sort((a, b) => a.length - b.length || a.localeCompare(b)), ...rest];
}

/** Every output of a fresh carry, as { absolute path: contents }. */
export async function carry() {
  const version = JSON.parse(await readFile(path.join(ROOT, "version.json"), "utf8"));
  const snapshot = { revision: version.revision, snapshot: version.snapshot };
  const files = await snapshotFiles();
  const manifest = siteManifest(JSON.parse(await readFile(path.join(ASSETS, "manifest.json"), "utf8")));
  const outputs = {
    [LIST]: `// Written by workers/factshift-center/carry-shell.mjs from assets/ and version.json; do not edit by hand.
// check-workers runs it with --check, so a refreshed snapshot without a fresh carry fails.
export const SNAPSHOT = Object.freeze(${JSON.stringify(snapshot)});

export const SNAPSHOT_FILES = Object.freeze(${JSON.stringify(files, null, 2)});
`,
    [path.join(ASSETS, "manifest.json")]: `${JSON.stringify(manifest, null, 2)}\n`,
    [path.join(ASSETS, "sw.js")]: shellScript(snapshot, files),
    [path.join(ASSETS, "_headers")]: HEADERS,
    [path.join(ASSETS, "robots.txt")]: ROBOTS,
    [path.join(ASSETS, "sitemap.xml")]: sitemap(),
  };
  for (const document of files.filter((file) => file.endsWith("/"))) {
    const at = path.join(ASSETS, document, "index.html");
    outputs[at] = withShell(withSiteHead(await readFile(at, "utf8"), headLines(manifest, document)));
  }
  return outputs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputs = await carry();
  if (process.argv.includes("--check")) {
    const stale = [];
    for (const [file, contents] of Object.entries(outputs)) {
      if ((await readFile(file, "utf8").catch(() => "")) !== contents) stale.push(path.relative(ROOT, file));
    }
    if (stale.length) {
      console.error(`[carry-shell] differs from a fresh carry: ${stale.join(", ")}; run node workers/factshift-center/carry-shell.mjs`);
      process.exit(1);
    }
    console.log("[carry-shell] the snapshot carries the site's layer");
  } else {
    for (const [file, contents] of Object.entries(outputs)) await writeFile(file, contents);
    console.log(`[carry-shell] wrote ${Object.keys(outputs).map((file) => path.relative(ROOT, file)).join(", ")}`);
  }
}
