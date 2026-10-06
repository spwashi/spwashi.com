#!/usr/bin/env node
/**
 * Load every catalog module from the built site.
 *
 * The deploy bundle packs catalog modules into chunks that import each other.
 * A module that reads an import at its top level then throws "Cannot access …
 * before initialization", in dist/ only: dev and the browser smoke run from
 * source and cannot see it. This serves dist/, opens one route in headless
 * Chrome, and asks the runtime to load each module through its own loader
 * (`__SPW_SITE__.loadModule`). Nothing mounts, so a route that lacks a
 * module's host cannot read as a failure.
 *
 *   node scripts/check-built-modules.mjs
 *   node scripts/check-built-modules.mjs --dist dist --route / --receipt built-receipt.json
 *
 * Exit: 0 every module loads · 1 a module failed to load · 2 no dist, browser
 * or runtime · 3 loopback unavailable (a sandboxed shell).
 */

import { createServer } from 'node:http';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const CAP = 20;
const BUNDLE_FAULT = /before initialization/i;

const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
});

function clip(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

/**
 * Sort the page's load results into a receipt. `ids` is the catalog, `loads`
 * one `{ id, ok, ms, error }` per answered load, `timedOut` the ids whose
 * loader never answered.
 */
export function classifyBuiltModules({ ids = [], loads = [], timedOut = [] } = {}, cap = CAP) {
  const byId = new Map(loads.filter((row) => row?.id).map((row) => [row.id, row]));
  const slow = new Set(timedOut);
  const failing = [];
  let loaded = 0;
  let slowest = null;
  for (const id of ids) {
    const row = byId.get(id);
    if (row?.ok) {
      loaded += 1;
      if (!slowest || row.ms > slowest.ms) slowest = { id, ms: Math.round(row.ms) };
    } else if (row) {
      failing.push({
        where: id,
        reason: BUNDLE_FAULT.test(row.error || '') ? 'bundle-order' : 'load-failed',
        detail: clip(row.error),
      });
    } else {
      failing.push({ where: id, reason: slow.has(id) ? 'load-timeout' : 'not-attempted', detail: '' });
    }
  }
  if (!ids.length) failing.push({ where: 'runtime', reason: 'empty-catalog', detail: '' });
  return {
    schema: 'built-modules-receipt.v0',
    ok: failing.length === 0,
    modules: ids.length,
    loaded,
    slowest,
    failures: failing.slice(0, cap),
    truncated: failing.length > cap,
  };
}

/** Runs in the page. Loads go one at a time so a bad pair is named, not masked. */
export function builtModulesProbe(perModuleMs = 30000) {
  return `(async () => {
    const site = window.__SPW_SITE__;
    if (!site || typeof site.loadModule !== 'function') return { missing: true };
    const ids = site.listModules().map((def) => def.id);
    const loads = [];
    const timedOut = [];
    for (const id of ids) {
      const row = await Promise.race([
        site.loadModule(id),
        new Promise((resolve) => setTimeout(() => resolve('timeout'), ${Number(perModuleMs) || 30000})),
      ]);
      if (row === 'timeout') timedOut.push(id);
      else if (row) loads.push({ id: row.id, ok: row.ok, ms: row.ms, error: row.error });
    }
    return { ids, loads, timedOut };
  })()`;
}

/** Resolve a request path to a file inside `root`, or null. */
export function resolveStaticFile(root, urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(urlPath, 'http://x').pathname);
  } catch {
    return null;
  }
  const target = path.resolve(root, `.${pathname}`);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  let file = target;
  try {
    if (statSync(file).isDirectory()) file = path.join(file, 'index.html');
    return statSync(file).isFile() ? file : null;
  } catch {
    return null;
  }
}

function serveStatic(root) {
  const server = createServer(async (req, res) => {
    const file = resolveStaticFile(root, req.url || '/');
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end();
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function flag(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1] || '';
}

function writeReceipt(file, receipt) {
  if (!file) return;
  mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`);
}

function unavailable(reason, detail) {
  return {
    schema: 'built-modules-receipt.v0',
    ok: false,
    modules: 0,
    loaded: 0,
    slowest: null,
    failures: [{ where: 'check', reason, detail: clip(detail) }],
    truncated: false,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const say = (line) => process.stderr.write(`[check:built] ${line}\n`);
  const {
    ROOT,
    CdpSession,
    closePageTarget,
    createChromeProfileDir,
    evaluateProbe,
    installShutdown,
    killProcessTree,
    navigateAndProbe,
    newPageTarget,
    openChrome,
    resolveChrome,
  } = await import('./lib/chrome-headless-harness.mjs');
  const { checkLoopback } = await import('./qa-doctor.mjs');

  const dist = path.resolve(ROOT, flag(args, '--dist') || 'dist');
  const route = flag(args, '--route') || '/';
  const receiptFile = flag(args, '--receipt');
  const perModuleMs = Number(flag(args, '--module-timeout')) || 30000;

  if (!existsSync(path.join(dist, 'index.html'))) {
    say(`no built site at ${path.relative(ROOT, dist) || dist}; run npm run build first`);
    writeReceipt(receiptFile, unavailable('no-dist', 'dist/index.html missing'));
    return 2;
  }

  const loopback = await checkLoopback();
  if (!loopback.ok) {
    say(loopback.detail);
    say(`→ ${loopback.next}`);
    return 3;
  }

  let server = null;
  let chromeChild = null;
  let userDataDir = null;
  const shutdown = installShutdown([
    () => killProcessTree(chromeChild),
    () => server?.close(),
  ]);

  try {
    const chromePath = await resolveChrome(flag(args, '--chrome'));
    if (!chromePath || typeof WebSocket === 'undefined') {
      const why = chromePath ? 'global WebSocket unavailable (Node 22+ required for CDP)' : 'Chrome/Chromium not found';
      say(why);
      writeReceipt(receiptFile, unavailable('no-browser', why));
      return 2;
    }

    server = await serveStatic(dist);
    const base = `http://127.0.0.1:${server.address().port}`;
    say(`serving ${path.relative(ROOT, dist) || dist} at ${base}`);

    const debugPort = 9333 + Math.floor(Math.random() * 400);
    userDataDir = await createChromeProfileDir('spw-built-');
    chromeChild = await openChrome(chromePath, userDataDir, debugPort);

    const target = await newPageTarget(debugPort);
    const session = new CdpSession(target.webSocketDebuggerUrl);
    await session.open();
    let page;
    try {
      await navigateAndProbe(session, { url: `${base}${route}`, settleMs: 10000, timeoutMs: 45000, logBrowser: false });
      // Loads run in sequence; the budget covers a slow runner plus a few hung loaders.
      const budget = 120000 + perModuleMs * 4;
      page = await evaluateProbe(session, builtModulesProbe(perModuleMs), budget);
    } finally {
      session.close();
      await closePageTarget(debugPort, target);
    }

    if (!page || page.missing) {
      say(`no load probe on ${route}: the runtime did not come up, or this build predates loadModule`);
      writeReceipt(receiptFile, unavailable('no-runtime', `__SPW_SITE__.loadModule missing on ${route}`));
      return 2;
    }

    const receipt = { ...classifyBuiltModules(page), route };
    writeReceipt(receiptFile, receipt);
    for (const row of receipt.failures) say(`FAIL ${row.where} ${row.reason}${row.detail ? ` — ${row.detail}` : ''}`);
    say(`${receipt.ok ? 'ok' : 'FAIL'} ${receipt.loaded}/${receipt.modules} modules load from the built site${receipt.slowest ? `; slowest ${receipt.slowest.id} ${receipt.slowest.ms}ms` : ''}`);
    if (args.includes('--json')) process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    return receipt.ok ? 0 : 1;
  } finally {
    shutdown();
    if (userDataDir) await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code), (error) => {
    process.stderr.write(`[check:built] ${error?.stack || error}\n`);
    process.exit(2);
  });
}
