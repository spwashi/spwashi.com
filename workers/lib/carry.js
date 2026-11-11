// Carrying a worker's fixed answers into files (2026-11-11).
//
// A file answers what never changes per request: it is served at the edge
// without running code, so it is faster, caches cleanly, and keeps answering
// when a script cannot, and the worker's compute is left for what computes. A
// worker whose answer reads nothing from the request hands that answer to its
// assets folder: render it once, out of
// the worker itself, write it as a file, and restate its headers in _headers.
// The worker keeps its branch, so its tests read one source, and a carry script's
// --check holds the files equal to what the worker would say (check:workers).
// wap.mom carries every page this way (workers/wap-mom/carry-pages.mjs); a door
// host can carry its page with its own origin, since a file cannot see the host.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const titled = (name) => name.replace(/(^|-)([a-z])/g, (_, dash, letter) => dash + letter.toUpperCase());

/**
 * Ask the worker for each [address, file] and keep its body and headers.
 * Every answer must be 200: a carried 404 or redirect is a mistake to see.
 */
export async function render(worker, origin, addresses, env = {}) {
  const out = [];
  for (const [address, file] of addresses) {
    const response = await worker.fetch(new Request(`${origin}${address}`), env);
    if (response.status !== 200) throw new Error(`[carry] ${origin}${address} answered ${response.status}`);
    out.push({ address, file, body: await response.text(), headers: [...response.headers] });
  }
  return out;
}

/**
 * _headers for carried files: the security set once for every file, then each
 * address's own headers, leaving out the security set and, for HTML, the type
 * the assets layer already sends.
 */
export function headersFile(security, rendered, { note = "a carry script: the headers the worker sends" } = {}) {
  const shared = new Set(Object.keys(security).map((name) => name.toLowerCase()));
  let text = `# Written by ${note}.\n/*\n${Object.entries(security).map(([name, value]) => `  ${name}: ${value}`).join("\n")}\n`;
  for (const { address, file, headers } of rendered) {
    const own = headers.filter(([name]) => !shared.has(name) && !(name === "content-type" && file.endsWith(".html")));
    text += `\n${address}\n${own.map(([name, value]) => `  ${titled(name)}: ${value}`).join("\n")}\n`;
  }
  return text;
}

/** Write [file, body] pairs under dir, or with check report each that differs; resolves to the count that differ. */
export async function writeOrCheck(dir, files, { check = false, label = "carry", hint = "" } = {}) {
  let drift = 0;
  for (const [file, body] of files) {
    const target = path.join(dir, file);
    if (check) {
      if ((await readFile(target, "utf8").catch(() => "")) !== body) {
        drift += 1;
        console.error(`[${label}] ${path.relative(process.cwd(), target)} differs from what the worker answers${hint ? `; ${hint}` : ""}`);
      }
      continue;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
  }
  return drift;
}
