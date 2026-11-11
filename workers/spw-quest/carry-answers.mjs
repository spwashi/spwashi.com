// Writes spw.quest's constant answers (src/crawl.js CONSTANT_ANSWERS) out of the
// worker into assets/, so llms.txt, init, quest.json and the rest are files the
// assets layer serves at the edge without running the worker. Each file is
// exactly what the worker answers;
// assets/_headers restates its headers, and test/static.test.mjs holds both.
// --check fails when a file on disk differs from what the worker would send.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "./src/index.js";
import { CONSTANT_ANSWERS } from "./src/crawl.js";

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");
const NO_ASSETS = { fetch: async () => new Response("Not found", { status: 404 }) };
const check = process.argv.includes("--check");
let drift = 0;
for (const address of CONSTANT_ANSWERS) {
  const response = await worker.fetch(new Request(`https://spw.quest${address}`), { ASSETS: NO_ASSETS });
  if (response.status !== 200) throw new Error(`[carry-answers] ${address} answered ${response.status}`);
  const body = await response.text();
  const target = path.join(ASSETS, address);
  if (check) {
    const current = await readFile(target, "utf8").catch(() => "");
    if (current !== body) {
      drift += 1;
      console.error(`[carry-answers] assets${address} differs from what the worker answers; run node --import ./scripts/tests/register-public-imports.mjs workers/spw-quest/carry-answers.mjs`);
    }
    continue;
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
  console.log(`[carry-answers] wrote assets${address} (${(body.length / 1024).toFixed(1)} KiB)`);
}
if (check && drift) process.exit(1);
