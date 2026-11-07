// Writes the shelf's static pages (src/shelf.js) into assets/shelf/, so the
// landing and its indexes are files the worker serves, not pages it renders on
// each request. Run after carry-specimens.mjs; --check fails when a page on disk
// differs from a fresh render.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shelfPages } from "./src/shelf.js";

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");
const check = process.argv.includes("--check");
let drift = 0;
for (const [file, html] of shelfPages()) {
  const target = path.join(ASSETS, file);
  if (check) {
    const current = await readFile(target, "utf8").catch(() => "");
    if (current !== html) {
      drift += 1;
      console.error(`[carry-shelf] assets/${file} differs from a fresh render; run node --import ./scripts/tests/register-public-imports.mjs workers/spw-quest/carry-shelf.mjs`);
    }
    continue;
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
  console.log(`[carry-shelf] wrote assets/${file} (${(html.length / 1024).toFixed(1)} KiB)`);
}
if (check) {
  if (drift) process.exit(1);
  console.log("[carry-shelf] the shelf's static pages match a fresh render");
}
