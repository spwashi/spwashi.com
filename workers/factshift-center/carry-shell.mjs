// Writes src/snapshot-files.js: every file the factshift.center snapshot ships,
// as the shell (src/shell.js) keeps them, and the snapshot's name from
// version.json. Run after refreshing assets/ (PLAN.md, "Refreshing the
// snapshot"); --check fails when the file on disk differs from a fresh walk.
//
// A folder's index.html is kept at the folder's address (/, /_spwashi@/). The
// snapshot's own service workers and .assetsignore are not kept.
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(ROOT, "assets");
const TARGET = path.join(ROOT, "src", "snapshot-files.js");

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
  const files = (await walk(assets)).filter((file) => file !== "/.assetsignore" && !file.endsWith("/service-worker.js"));
  const documents = files.filter((file) => file.endsWith("/index.html")).map((file) => file.slice(0, -"index.html".length));
  const rest = files.filter((file) => !file.endsWith("/index.html"));
  return [...documents.sort((a, b) => a.length - b.length || a.localeCompare(b)), ...rest];
}

export async function render() {
  const version = JSON.parse(await readFile(path.join(ROOT, "version.json"), "utf8"));
  const files = await snapshotFiles();
  return `// Written by workers/factshift-center/carry-shell.mjs from assets/ and version.json; do not edit by hand.
// check-workers runs it with --check, so a refreshed snapshot without a fresh list fails.
export const SNAPSHOT = Object.freeze(${JSON.stringify({ revision: version.revision, snapshot: version.snapshot })});

export const SNAPSHOT_FILES = Object.freeze(${JSON.stringify(files, null, 2)});
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fresh = await render();
  if (process.argv.includes("--check")) {
    const current = await readFile(TARGET, "utf8").catch(() => "");
    if (current !== fresh) {
      console.error("[carry-shell] src/snapshot-files.js differs from assets/; run node workers/factshift-center/carry-shell.mjs");
      process.exit(1);
    }
    console.log("[carry-shell] src/snapshot-files.js matches assets/");
  } else {
    await writeFile(TARGET, fresh);
    console.log(`[carry-shell] wrote src/snapshot-files.js (${(await snapshotFiles()).length} files)`);
  }
}
