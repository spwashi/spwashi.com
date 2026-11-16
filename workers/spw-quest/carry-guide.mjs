// Writes the guide's front page ("/") out of the worker into assets/index.html,
// so the assets layer answers "/" at the edge without running the worker. Since
// 2026-11-16 "/" is a file: the account's daily Worker requests had run out
// (Cloudflare error 1027, HTTP 429 on every scripted page) while carried files
// kept answering. The file is exactly the page the worker renders for "/" with
// no query; assets/_headers restates its headers, and test/static.test.mjs holds
// both. What "/" gave by Accept (text, JSON) is in /llms.txt and /quest.json,
// and ?example=, ?at= and ?parser= now open the plain guide.
// --check fails when the file on disk differs from what the worker renders.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "./src/index.js";

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");
const NO_ASSETS = { fetch: async () => new Response("Not found", { status: 404 }) };
const TARGET = path.join(ASSETS, "index.html");
const check = process.argv.includes("--check");

const response = await worker.fetch(new Request("https://spw.quest/", { headers: { Accept: "text/html" } }), { ASSETS: NO_ASSETS });
if (response.status !== 200) throw new Error(`[carry-guide] / answered ${response.status}`);
const html = await response.text();

if (check) {
  const current = await readFile(TARGET, "utf8").catch(() => "");
  if (current !== html) {
    console.error("[carry-guide] assets/index.html differs from what the worker renders for /; run node --import ./scripts/tests/register-public-imports.mjs workers/spw-quest/carry-guide.mjs");
    process.exit(1);
  }
  console.log("[carry-guide] assets/index.html matches the worker's /");
} else {
  await mkdir(ASSETS, { recursive: true });
  await writeFile(TARGET, html);
  console.log(`[carry-guide] wrote assets/index.html (${(html.length / 1024).toFixed(1)} KiB)`);
}
