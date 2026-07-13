#!/usr/bin/env node
/**
 * Headless Chrome navigation smoke (zero new npm deps).
 *
 * Usage:
 *   npm run smoke:nav
 *   npm run smoke:nav -- --routes /,/settings/ --require-settled
 *   npm run smoke:nav:qa
 *   npm run smoke:nav -- --base http://127.0.0.1:4173 --json
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';

import {
  DEFAULT_ROUTES,
  cellFromProbe,
  installShutdown,
  killProcessTree,
  navigateAndProbe,
  newPageTarget,
  openChrome,
  pickFreePort,
  resolveChrome,
  spawnDevServer,
  waitForHttp,
  withDebugQuery,
  CdpSession,
} from './lib/chrome-headless-harness.mjs';

function parseArgs(argv) {
  const options = {
    base: null,
    chrome: null,
    debugLayout: false,
    debugQa: false,
    help: false,
    json: false,
    port: 0,
    requireSettled: false,
    retries: 1,
    routes: null,
    settleMs: 12000,
    timeoutMs: 45000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--debug-layout') options.debugLayout = true;
    else if (arg === '--debug-qa' || arg === '--agent-qa') options.debugQa = true;
    else if (arg === '--require-settled') options.requireSettled = true;
    else if (arg === '--base' && argv[i + 1]) options.base = argv[++i];
    else if (arg.startsWith('--base=')) options.base = arg.slice(7);
    else if (arg === '--chrome' && argv[i + 1]) options.chrome = argv[++i];
    else if (arg.startsWith('--chrome=')) options.chrome = arg.slice(9);
    else if (arg === '--routes' && argv[i + 1]) {
      options.routes = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--routes=')) {
      options.routes = arg.slice(9).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--settle-ms' && argv[i + 1]) options.settleMs = Number(argv[++i]) || options.settleMs;
    else if (arg === '--timeout-ms' && argv[i + 1]) options.timeoutMs = Number(argv[++i]) || options.timeoutMs;
    else if (arg === '--retries' && argv[i + 1]) options.retries = Math.max(0, Number(argv[++i]) || 0);
    else if (arg === '--port' && argv[i + 1]) options.port = Number(argv[++i]) || 0;
  }
  return options;
}

function printHelp() {
  console.log(`headless-nav — Chrome headless route smoke

Usage:
  node scripts/headless-nav.mjs [options]

Options:
  --base URL           Reuse server (skip dev-server spawn)
  --routes a,b         Paths (default home/settings/about/topics)
  --debug-layout       ?debug=layout&log=layout-shift
  --debug-qa           Agent/layout QA query
  --require-settled    Fail cells that never reach runtime ready
  --retries N          Retry failed navigations (default 1)
  --settle-ms N        Max wait for runtime ready (default 12000)
  --timeout-ms N       Load event timeout (default 45000)
  --chrome PATH        Browser binary
  --json               JSON report on stdout
  -h, --help
`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }
  if (typeof WebSocket === 'undefined') {
    console.error('[smoke:nav] Global WebSocket required (Node 22+)');
    process.exit(2);
  }

  const chromePath = await resolveChrome(options.chrome);
  if (!chromePath) {
    console.error('[smoke:nav] Chrome/Chromium not found. Set CHROME_PATH or --chrome');
    process.exit(2);
  }

  const routes = options.routes || [...DEFAULT_ROUTES];
  let base = options.base ? options.base.replace(/\/$/, '') : null;
  let devChild = null;
  let chromeChild = null;
  let userDataDir = null;
  const debugPort = 9333 + Math.floor(Math.random() * 400);
  const shutdown = installShutdown([
    () => killProcessTree(chromeChild),
    () => killProcessTree(devChild),
  ]);

  try {
    if (!base) {
      const port = options.port > 0 ? options.port : await pickFreePort();
      process.stderr.write(`[smoke:nav] starting dev-server on ${port}…\n`);
      const spawned = spawnDevServer(port);
      devChild = spawned.child;
      base = await spawned.ready;
      process.stderr.write(`[smoke:nav] server ${base}\n`);
    } else {
      await waitForHttp(base);
      process.stderr.write(`[smoke:nav] using base ${base}\n`);
    }

    userDataDir = await mkdtemp(path.join(tmpdir(), 'spw-headless-'));
    process.stderr.write(`[smoke:nav] chrome ${chromePath} debug=${debugPort}\n`);
    chromeChild = await openChrome(chromePath, userDataDir, debugPort);

    const results = [];
    for (const route of routes) {
      const pathWithQuery = withDebugQuery(route, options);
      const absoluteUrl = `${base}${pathWithQuery}`;
      process.stderr.write(`[smoke:nav] → ${absoluteUrl}\n`);

      const target = await newPageTarget(debugPort);
      const session = new CdpSession(target.webSocketDebuggerUrl);
      await session.open();
      try {
        const row = await navigateAndProbe(session, {
          url: absoluteUrl,
          settleMs: options.settleMs,
          timeoutMs: options.timeoutMs,
          retries: options.retries,
        });
        const cell = cellFromProbe(row, { route: pathWithQuery });
        const hardOk = cell.ok && (!options.requireSettled || cell.settled);
        results.push({ ...cell, hardOk, raw: row });
        process.stderr.write(
          `  ${hardOk ? 'ok' : 'FAIL'} ${cell.wallMs}ms settled=${cell.settled ? 'y' : 'n'} surface=${cell.surface || '-'} stage=${cell.runtimeStage || '-'} page=${cell.pageState || '-'} layoutQa=${cell.layoutQaGrade || '-'}\n`,
        );
      } finally {
        session.close();
      }
    }

    const summary = {
      at: new Date().toISOString(),
      kind: 'headless-nav-smoke',
      base,
      chrome: chromePath,
      debugLayout: options.debugLayout,
      debugQa: options.debugQa,
      requireSettled: options.requireSettled,
      settleMs: options.settleMs,
      ok: results.every((r) => r.hardOk),
      routes: results.length,
      failures: results.filter((r) => !r.hardOk).length,
      settledCount: results.filter((r) => r.settled).length,
      totalWallMs: results.reduce((s, r) => s + r.wallMs, 0),
      results: results.map(({ raw, hardOk, ...cell }) => ({ ...cell, hardOk })),
    };

    if (options.json) {
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    } else {
      process.stdout.write('\nroute                                      ms  set  surface        stage\n');
      process.stdout.write(`${'-'.repeat(78)}\n`);
      for (const r of results) {
        const pathPart = r.route || '/';
        process.stdout.write(
          `${String(pathPart).slice(0, 42).padEnd(42)} ${String(r.wallMs).padStart(5)}  ${r.settled ? 'y' : 'n'}   ${String(r.surface || '-').padEnd(14)} ${r.runtimeStage || '-'}\n`,
        );
      }
      process.stdout.write(
        `\nok=${summary.ok} routes=${summary.routes} failures=${summary.failures} settled=${summary.settledCount} totalWall=${summary.totalWallMs}ms\n`,
      );
    }

    return summary.ok ? 0 : 1;
  } catch (error) {
    console.error('[smoke:nav] fatal', error);
    return 1;
  } finally {
    shutdown();
    killProcessTree(chromeChild);
    killProcessTree(devChild);
    if (userDataDir) {
      await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

main().then((code) => process.exit(code ?? 0));
