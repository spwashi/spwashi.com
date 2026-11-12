// Fingerprints what each worker answers (status, headers, body) so a refactor can
// prove it changed nothing anyone can observe. Save before, compare after:
//
//   node --import ./scripts/tests/register-public-imports.mjs scripts/worker-fingerprint.mjs --save .tmp/before.json
//   node --import ./scripts/tests/register-public-imports.mjs scripts/worker-fingerprint.mjs --compare .tmp/before.json
//
// --unit <id> limits it to one worker. Every host a unit serves (workers/cluster.json)
// is asked every path in ROUTES. Date headers and CSP nonces are set aside, since
// they change on every response; a route whose answer moves with the clock (a
// date, an hour) holds only within one run of both commands on the same day.
// Units with D1 or KV (autonomous-feedback, wap-mom's cabinet) are asked only
// what needs no binding.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTES = {
  "smut-today": ["/", "/to-you", "/pitches", "/meeting", "/train", "/today.json", "/robots.txt", "/favicon.svg", "/nope"],
  "site-hub-next": ["/", "/robots.txt", "/favicon.svg", "/now/", "/now.json", "/nope"],
  "wap-mom": ["/", "/room", "/contents/", "/pi/", "/pi/offprint/", "/pi/draw", "/feed.xml", "/now.json", "/nope"],
  "spw-quest": ["/", "/learn", "/build", "/pivot", "/physics", "/llms.txt", "/quest.json", "/card?line=a%7Bb%7D", "/nope"],
  "factshift-center": ["/", "/?spw=garden%5Bcare%5D%7Bseed%7D"],
  "autonomous-feedback": ["/privacy", "/robots.txt"],
};

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const only = flag("--unit");
const ASSETS = { fetch: async () => new Response("Not found", { status: 404 }) };

const cluster = JSON.parse(readFileSync(path.join(ROOT, "workers/cluster.json"), "utf8"));
const prints = {};
for (const unit of cluster.units) {
  if (!ROUTES[unit.id] || (only && unit.id !== only)) continue;
  const worker = (await import(path.join(ROOT, unit.dir, "src/index.js"))).default;
  for (const host of unit.hosts) {
    for (const route of ROUTES[unit.id]) {
      let response;
      try {
        response = await worker.fetch(new Request(`https://${host}${route}`), { ASSETS });
      } catch (error) {
        prints[`${host}${route}`] = `threw ${error.message}`;
        continue;
      }
      const body = (await response.text()).replace(/nonce="[^"]+"/g, 'nonce=""');
      const headers = [...response.headers]
        .filter(([name]) => name !== "date")
        .map(([name, value]) => `${name}:${value.replace(/'nonce-[^']+'/g, "'nonce'")}`)
        .join("\n");
      prints[`${host}${route}`] = createHash("sha256").update(`${response.status}\n${headers}\n${body}`).digest("hex").slice(0, 16);
    }
  }
}

const save = flag("--save");
const compare = flag("--compare");
if (save) {
  mkdirSync(path.dirname(path.resolve(save)), { recursive: true });
  writeFileSync(save, `${JSON.stringify(prints, null, 1)}\n`);
  console.log(`[worker-fingerprint] saved ${Object.keys(prints).length} responses to ${save}`);
} else if (compare) {
  const before = JSON.parse(readFileSync(compare, "utf8"));
  const keys = new Set([...Object.keys(before), ...Object.keys(prints)]);
  const changed = [...keys].filter((key) => before[key] !== prints[key]);
  if (changed.length) {
    console.error(`[worker-fingerprint] ${changed.length} of ${keys.size} responses changed:\n  ${changed.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`[worker-fingerprint] all ${keys.size} responses identical`);
} else {
  console.log(JSON.stringify(prints, null, 1));
}
