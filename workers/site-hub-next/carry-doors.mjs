// Each held name's door, written out of this script into a files-only worker.
// A file cannot see the host, so each origin is its own unit
// (workers/<host-with-hyphens>/). The account's daily Worker requests are
// shared (Cloudflare error 1027, HTTP 429 once they are spent). A file is
// answered at the edge and does not count; this script does. Until a host's
// route moves in the dashboard, site-hub-next still answers it.
// --check fails when a carried file differs from what this script answers.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import worker from "./src/index.js";
import { DOOR_HOSTS } from "./src/hosts/doors.js";
import { headersFile, render, writeOrCheck } from "../lib/carry.js";
import { securityHeaders } from "../lib/http.js";

const WORKERS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SECURITY = securityHeaders({ referrer: "strict-origin-when-cross-origin", corp: "same-origin" });
const ADDRESSES = [
  ["/", "index.html"],
  ["/favicon.svg", "favicon.svg"],
  ["/robots.txt", "robots.txt"],
  ["/ecosystem.json", "ecosystem.json"],
  ["/registry.json", "registry.json"],
];

export const doorId = (host) => host.replaceAll(".", "-");

export function wranglerFor(id) {
  return `{
  "$schema": "https://json.schemastore.org/wrangler.json",
  "name": "${id}",
  "compatibility_date": "2026-11-23",
  "workers_dev": false,
  "preview_urls": false,
  // Files only. Move this host's route here from site-hub-next in the dashboard.
  // Until then site-hub-next still renders the door, and that request counts
  // toward the account's daily Worker limit (error 1027).
  "assets": {
    "directory": "./assets"
  }
}
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes("--check");
  let drift = 0;
  for (const host of DOOR_HOSTS) {
    const id = doorId(host);
    const rendered = await render(worker, `https://${host}`, ADDRESSES);
    const files = [
      ["wrangler.jsonc", wranglerFor(id)],
      ...rendered.map(({ file, body }) => [`assets/${file}`, body]),
      ["assets/_headers", headersFile(SECURITY, rendered, { note: "workers/site-hub-next/carry-doors.mjs" })],
    ];
    drift += await writeOrCheck(path.join(WORKERS, id), files, {
      check,
      label: "door-carry",
      hint: "run node workers/site-hub-next/carry-doors.mjs",
    });
  }
  if (check && drift) process.exit(1);
  if (!check) console.log(`[door-carry] wrote ${DOOR_HOSTS.length} door workers`);
}
