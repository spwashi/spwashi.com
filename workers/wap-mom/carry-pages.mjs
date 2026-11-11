// Writes every page wap.mom prints into assets/, out of the worker itself, so the
// periodical is files the assets layer serves without running a script (and stays
// up when the account's daily script allowance runs out). The worker keeps
// /cabinet and an issue's /draw. assets/_headers restates the worker's headers:
// the security set once for every file, and each file's own type and cache.
// --check fails when a file on disk differs from what the worker would send.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import worker from "./src/index.js";
import { printed } from "./src/catalog.js";
import { BASE_SECURITY } from "./src/layout.js";

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

const SECURITY = new Set(Object.keys(BASE_SECURITY).map((name) => name.toLowerCase()));

/** Every file with its body, plus 404.html and _headers. */
export async function carried() {
  const files = [];
  let rules = `# Written by workers/wap-mom/carry-pages.mjs: the headers src/index.js sends.\n/*\n${Object.entries(BASE_SECURITY).map(([name, value]) => `  ${name}: ${value}`).join("\n")}\n`;
  for (const [address, file] of addresses()) {
    const response = await worker.fetch(new Request(`${ORIGIN}${address}`), {});
    if (response.status !== 200) throw new Error(`[carry-pages] ${address} answered ${response.status}`);
    files.push([file, await response.text()]);
    const own = [...response.headers].filter(([name]) => !SECURITY.has(name) && !(name === "content-type" && file.endsWith(".html")));
    rules += `\n${address}\n${own.map(([name, value]) => `  ${name.replace(/(^|-)([a-z])/g, (_, dash, letter) => dash + letter.toUpperCase())}: ${value}`).join("\n")}\n`;
  }
  const missing = await worker.fetch(new Request(`${ORIGIN}/no-such-page`), {});
  files.push(["404.html", await missing.text()], ["_headers", rules]);
  return files;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  let drift = 0;
  for (const [file, body] of await carried()) {
    const target = path.join(ASSETS, file);
    if (check) {
      if ((await readFile(target, "utf8").catch(() => "")) !== body) {
        drift += 1;
        console.error(`[carry-pages] assets/${file} differs from what the worker prints; run node workers/wap-mom/carry-pages.mjs`);
      }
      continue;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
  }
  if (check && drift) process.exit(1);
  if (!check) console.log(`[carry-pages] wrote ${addresses().length} pages, 404.html and _headers into workers/wap-mom/assets`);
}
