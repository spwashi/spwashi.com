// Writes every page wap.mom prints into assets/, out of the worker itself, so the
// periodical is files the assets layer serves at the edge without running a
// script. The worker keeps
// /cabinet and an issue's /draw. assets/_headers restates the worker's headers:
// the security set once for every file, and each file's own type and cache
// (workers/lib/carry.js). --check fails when a file on disk differs from what
// the worker would send.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import worker from "./src/index.js";
import { printed } from "./src/catalog.js";
import { BASE_SECURITY } from "./src/layout.js";
import { headersFile, render, writeOrCheck } from "../lib/carry.js";

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");
const ORIGIN = "https://wap.mom";

/** [address, file] for everything the worker prints. */
export function addresses() {
  const out = [
    ["/", "index.html"], ["/room", "room.html"], ["/contents/", "contents/index.html"],
    ["/colophon/", "colophon/index.html"], ["/corrections/", "corrections/index.html"],
    ["/feed.xml", "feed.xml"], ["/sitemap.xml", "sitemap.xml"], ["/now.json", "now.json"],
    ["/figures.js", "figures.js"], ["/robots.txt", "robots.txt"], ["/favicon.svg", "favicon.svg"],
  ];
  for (const issue of printed) {
    out.push([`/${issue.slug}/`, `${issue.slug}/index.html`], [`/${issue.slug}/offprint/`, `${issue.slug}/offprint/index.html`]);
    if (issue.clip) out.push([`/${issue.slug}/clip/`, `${issue.slug}/clip/index.html`]);
  }
  return out;
}

/** Every file with its body, plus 404.html and _headers. */
export async function carried() {
  const rendered = await render(worker, ORIGIN, addresses());
  const missing = await worker.fetch(new Request(`${ORIGIN}/no-such-page`), {});
  return [
    ...rendered.map(({ file, body }) => [file, body]),
    ["404.html", await missing.text()],
    ["_headers", headersFile(BASE_SECURITY, rendered, { note: "workers/wap-mom/carry-pages.mjs: the headers src/index.js sends" })],
  ];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  const drift = await writeOrCheck(ASSETS, await carried(), { check, label: "carry-pages", hint: "run node workers/wap-mom/carry-pages.mjs" });
  if (check && drift) process.exit(1);
  if (!check) console.log(`[carry-pages] wrote ${addresses().length} pages, 404.html and _headers into workers/wap-mom/assets`);
}
