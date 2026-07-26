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

import { rm } from 'node:fs/promises';
import process from 'node:process';

import {
  DEFAULT_ROUTES,
  cellFromProbe,
  closePageTarget,
  createChromeProfileDir,
  evaluateHardOk,
  installShutdown,
  killProcessTree,
  navigateAndProbe,
  newPageTarget,
  openChrome,
  pickFreePort,
  probeHttpRoutes,
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
    failOnConsoleError: false,
    failOnOverflowX: false,
    help: false,
    json: false,
    port: 0,
    requireSettled: false,
    requireBrowser: false,
    retries: 1,
    routes: null,
    settleMs: 18000,
    timeoutMs: 45000,
    warm: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--debug-layout') options.debugLayout = true;
    else if (arg === '--debug-qa' || arg === '--agent-qa') options.debugQa = true;
    else if (arg === '--require-settled') options.requireSettled = true;
    else if (arg === '--require-browser') options.requireBrowser = true;
    else if (arg === '--fail-on-console-error') options.failOnConsoleError = true;
    else if (arg === '--fail-on-overflow-x') options.failOnOverflowX = true;
    else if (arg === '--warm') options.warm = true;
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
  --base URL                Reuse server (skip dev-server spawn)
  --routes a,b              Paths (default home/settings/about/topics)
  --debug-layout            ?debug=layout&log=layout-shift
  --debug-qa                Agent/layout QA query
  --require-browser         Fail instead of using the degraded HTTP shell probe
  --require-settled         Fail cells that never reach runtime ready
  --fail-on-console-error   Fail when page logs console.error / exceptions
  --fail-on-overflow-x      Fail when sampled frames overflow horizontally
  --warm                    Discard a cold first navigation (reduces Chrome cold bias)
  --retries N               Retry failed navigations (default 1)
  --settle-ms N             Max wait for runtime ready (default 18000; +grace when boot progresses)
  --timeout-ms N            Load event timeout (default 45000)
  --chrome PATH             Browser binary
  --json                    JSON report on stdout
  -h, --help
`);
}

/**
 * HTTP-only fallback probe: validates routes via fetch when Chrome is unavailable.
 */
async function httpFallbackProbe(base, routes, options, reason) {
  process.stderr.write(`[smoke:nav] ${reason} — using degraded HTTP shell probe\n`);
  const results = await probeHttpRoutes({ base, routes, queryOptions: options });
  for (const result of results) {
    process.stderr.write(`[smoke:nav] → ${result.url}\n`);
    process.stderr.write(
      `  ${result.ok ? 'ok' : 'FAIL'} status=${result.status} title=${result.hasTitle ? 'y' : 'n'} h1=${result.hasH1 ? 'y' : 'n'} main=${result.hasMain ? 'y' : 'n'} surface=${result.surface || '-'}${result.error ? ` error=${result.error}` : ''}\n`,
    );
  }

  const allOk = results.every((r) => r.ok);
  const summary = {
    at: new Date().toISOString(),
    kind: 'headless-nav-smoke',
    mode: 'http-fallback',
    degraded: true,
    degradedReason: reason,
    base,
    ok: allOk,
    routes: results.length,
    failures: results.filter((r) => !r.ok).length,
    results,
  };

  if (options.json) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write('\nroute                                      status  title  h1  main  surface\n');
    process.stdout.write(`${'-'.repeat(78)}\n`);
    for (const r of results) {
      const pathPart = String(r.route || '/').slice(0, 42).padEnd(42);
      process.stdout.write(
        `${pathPart} ${String(r.status).padStart(5)}  ${r.hasTitle ? '  ✓  ' : '  ✗  '}${r.hasH1 ? ' ✓ ' : ' ✗ '} ${r.hasMain ? ' ✓  ' : ' ✗  '} ${r.surface || '-'}\n`,
      );
    }
    process.stdout.write(
      `\nok=${allOk} routes=${results.length} failures=${summary.failures} mode=http-fallback\n`,
    );
  }

  return allOk ? 0 : 1;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
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

    const chromePath = await resolveChrome(options.chrome);
    const browserUnavailableReason = typeof WebSocket === 'undefined'
      ? 'global WebSocket unavailable (Node 22+ required for CDP)'
      : (!chromePath ? 'Chrome/Chromium not found' : null);
    if (browserUnavailableReason) {
      if (options.requireBrowser) {
        process.stderr.write(`[smoke:nav] ${browserUnavailableReason}\n`);
        return 2;
      }
      return httpFallbackProbe(base, routes, options, browserUnavailableReason);
    }

    userDataDir = await createChromeProfileDir('spw-headless-');
    process.stderr.write(`[smoke:nav] chrome ${chromePath} debug=${debugPort}\n`);
    try {
      chromeChild = await openChrome(chromePath, userDataDir, debugPort);
    } catch (chromeError) {
      process.stderr.write(`[smoke:nav] Chrome launch failed: ${chromeError.message}\n`);
      if (options.requireBrowser) return 2;
      return httpFallbackProbe(base, routes, options, 'Chrome launch failed');
    }

    if (options.warm && routes.length) {
      process.stderr.write('[smoke:nav] warm cell…\n');
      const warmTarget = await newPageTarget(debugPort);
      const warmSession = new CdpSession(warmTarget.webSocketDebuggerUrl);
      await warmSession.open();
      try {
        await navigateAndProbe(warmSession, {
          url: `${base}${withDebugQuery(routes[0], options)}`,
          settleMs: Math.min(options.settleMs, 10000),
          timeoutMs: options.timeoutMs,
          retries: 0,
          partialGraceMs: 4000,
        });
      } finally {
        warmSession.close();
        await closePageTarget(debugPort, warmTarget);
      }
    }

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
        const hardOk = evaluateHardOk(cell, options);
        results.push({ ...cell, hardOk, raw: row });
        const markHint = cell.lastMark ? ` last=${cell.lastMark}` : '';
        process.stderr.write(
          `  ${hardOk ? 'ok' : 'FAIL'} ${cell.wallMs}ms settled=${cell.settled ? 'y' : 'n'} surface=${cell.surface || '-'} stage=${cell.runtimeStage || '-'} page=${cell.pageState || '-'} layoutQa=${cell.layoutQaGrade || '-'} consoleErr=${cell.consoleErrorCount || 0}${markHint}\n`,
        );
      } finally {
        session.close();
        await closePageTarget(debugPort, target);
      }
    }

    const summary = {
      at: new Date().toISOString(),
      kind: 'headless-nav-smoke',
      mode: 'chrome-cdp',
      base,
      chrome: chromePath,
      degraded: false,
      debugLayout: options.debugLayout,
      debugQa: options.debugQa,
      requireSettled: options.requireSettled,
      failOnConsoleError: options.failOnConsoleError,
      failOnOverflowX: options.failOnOverflowX,
      settleMs: options.settleMs,
      ok: results.every((r) => r.hardOk),
      routes: results.length,
      failures: results.filter((r) => !r.hardOk).length,
      settledCount: results.filter((r) => r.settled).length,
      consoleErrorCount: results.reduce((s, r) => s + (r.consoleErrorCount || 0), 0),
      totalWallMs: results.reduce((s, r) => s + r.wallMs, 0),
      results: results.map(({ raw, hardOk, ...cell }) => ({ ...cell, hardOk })),
    };

    if (options.json) {
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    } else {
      process.stdout.write('\nroute                                      ms  set  surface        stage     cerr\n');
      process.stdout.write(`${'-'.repeat(84)}\n`);
      for (const r of results) {
        const pathPart = r.route || '/';
        process.stdout.write(
          `${String(pathPart).slice(0, 42).padEnd(42)} ${String(r.wallMs).padStart(5)}  ${r.settled ? 'y' : 'n'}   ${String(r.surface || '-').padEnd(14)} ${String(r.runtimeStage || '-').padEnd(9)} ${r.consoleErrorCount || 0}\n`,
        );
      }
      process.stdout.write(
        `\nok=${summary.ok} routes=${summary.routes} failures=${summary.failures} settled=${summary.settledCount} consoleErr=${summary.consoleErrorCount} totalWall=${summary.totalWallMs}ms\n`,
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
