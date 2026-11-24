// Writes the rooms that answer one page ("/pivot", "/specimens", "/physics",
// "/constructs") out of the worker into extensionless files under assets/, so
// the assets layer answers them without running the worker. Each file is the
// page the worker renders for that path with no query. A query on the same
// path opens that file: a negative run_worker_first pattern matches the path,
// not the query. /learn and /install stay on the worker. /build stays too:
// Read and Format post to it, and the assets layer answers a non-GET on an
// existing file with 405, so the formatter would never run.
// --check fails when a file on disk differs from what the worker renders.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "./src/index.js";

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");
const NO_ASSETS = { fetch: async () => new Response("Not found", { status: 404 }) };
const ROOMS = ["/pivot", "/specimens", "/physics", "/constructs"];
const check = process.argv.includes("--check");

let drift = 0;
for (const room of ROOMS) {
  const response = await worker.fetch(new Request(`https://spw.quest${room}`, { headers: { Accept: "text/html" } }), { ASSETS: NO_ASSETS });
  if (response.status !== 200) throw new Error(`[carry-rooms] ${room} answered ${response.status}`);
  const html = await response.text();
  const target = path.join(ASSETS, room.slice(1));
  if (check) {
    const current = await readFile(target, "utf8").catch(() => "");
    if (current !== html) {
      console.error(`[carry-rooms] assets${room} differs from what the worker renders; run node --import ./scripts/tests/register-public-imports.mjs workers/spw-quest/carry-rooms.mjs`);
      drift += 1;
    }
  } else {
    await mkdir(ASSETS, { recursive: true });
    await writeFile(target, html);
    console.log(`[carry-rooms] wrote assets${room} (${(html.length / 1024).toFixed(1)} KiB)`);
  }
}
if (check && drift) process.exit(1);
if (check) console.log("[carry-rooms] the rooms match what the worker renders with no query");
