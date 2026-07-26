#!/usr/bin/env node
/**
 * Performance matrix: pages × browser viewports (zero new npm deps).
 *
 * Usage:
 *   npm run bench:nav
 *   npm run bench:nav:quick
 *   node scripts/perf-matrix.mjs --viewports phone,laptop --routes /,/settings/
 *   node scripts/perf-matrix.mjs --json --out /tmp/perf-matrix.json
 *   node scripts/perf-matrix.mjs --require-settled --fail-on-overflow-x
 */

import { rm, writeFile } from 'node:fs/promises';
import process from 'node:process';

import {
  DEFAULT_ROUTES,
  VIEWPORTS,
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
  pickViewports,
  resolveChrome,
  spawnDevServer,
  waitForHttp,
  withDebugQuery,
  CdpSession,
} from './lib/chrome-headless-harness.mjs';

const QUICK_ROUTES = Object.freeze(['/', '/settings/', '/topics/software/']);

function parseArgs(argv) {
  const options = {
    base: null,
    chrome: null,
    csv: false,
    debugLayout: false,
    debugQa: false,
    failOnConsoleError: false,
    failOnOverflowX: false,
    help: false,
    json: false,
    out: null,
    port: 0,
    quick: false,
    requireSettled: false,
    retries: 1,
    routes: null,
    settleMs: 14000,
    timeoutMs: 60000,
    viewports: null,
    warm: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--csv') options.csv = true;
    else if (arg === '--quick') options.quick = true;
    else if (arg === '--warm') options.warm = true;
    else if (arg === '--debug-layout') options.debugLayout = true;
    else if (arg === '--debug-qa' || arg === '--agent-qa') options.debugQa = true;
    else if (arg === '--require-settled') options.requireSettled = true;
    else if (arg === '--fail-on-overflow-x') options.failOnOverflowX = true;
    else if (arg === '--fail-on-console-error') options.failOnConsoleError = true;
    else if (arg === '--base' && argv[i + 1]) options.base = argv[++i];
    else if (arg.startsWith('--base=')) options.base = arg.slice(7);
    else if (arg === '--chrome' && argv[i + 1]) options.chrome = argv[++i];
    else if (arg.startsWith('--chrome=')) options.chrome = arg.slice(9);
    else if (arg === '--out' && argv[i + 1]) options.out = argv[++i];
    else if (arg.startsWith('--out=')) options.out = arg.slice(6);
    else if (arg === '--routes' && argv[i + 1]) {
      options.routes = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--routes=')) {
      options.routes = arg.slice(9).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--viewports' && argv[i + 1]) {
      options.viewports = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--viewports=')) {
      options.viewports = arg.slice(12).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--settle-ms' && argv[i + 1]) options.settleMs = Number(argv[++i]) || options.settleMs;
    else if (arg === '--timeout-ms' && argv[i + 1]) options.timeoutMs = Number(argv[++i]) || options.timeoutMs;
    else if (arg === '--retries' && argv[i + 1]) options.retries = Math.max(0, Number(argv[++i]) || 0);
    else if (arg === '--port' && argv[i + 1]) options.port = Number(argv[++i]) || 0;
  }
  return options;
}

function printHelp() {
  console.log(`perf-matrix — page × viewport performance (Chrome headless)

Viewports: ${Object.keys(VIEWPORTS).join(', ')}

Usage:
  npm run bench:nav
  npm run bench:nav:quick
  node scripts/perf-matrix.mjs --viewports phone,desktop --routes /,/settings/

Options:
  --quick                 phone+laptop × home/settings/topics/software
  --warm                  Discard first cell (cold Chrome) from rollups
  --routes a,b            Paths
  --viewports a,b         Named sizes
  --base URL              Reuse server
  --debug-layout/--debug-qa
  --require-settled       Fail if runtime never reaches ready
  --fail-on-overflow-x    Fail if any horizontal frame overflow sampled
  --fail-on-console-error Fail if page logs console.error / exceptions
  --retries N             Per-cell retries (default 1)
  --settle-ms / --timeout-ms
  --json / --csv / --out PATH
  --chrome PATH
`);
}

function summarizeMatrix(cells) {
  const byRoute = Object.create(null);
  const byViewport = Object.create(null);

  for (const cell of cells) {
    (byRoute[cell.route] ||= []).push(cell);
    (byViewport[cell.viewport] ||= []).push(cell);
  }

  const avg = (arr, key) => {
    const vals = arr.map((c) => c[key]).filter((v) => typeof v === 'number' && Number.isFinite(v));
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  const max = (arr, key) => {
    const vals = arr.map((c) => c[key]).filter((v) => typeof v === 'number' && Number.isFinite(v));
    if (!vals.length) return null;
    return Math.max(...vals);
  };
  const p95 = (arr, key) => {
    const vals = arr.map((c) => c[key]).filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
    if (!vals.length) return null;
    const idx = Math.min(vals.length - 1, Math.ceil(vals.length * 0.95) - 1);
    return vals[Math.max(0, idx)];
  };

  const pack = (rows) => ({
    cells: rows.length,
    avgWallMs: avg(rows, 'wallMs'),
    maxWallMs: max(rows, 'wallMs'),
    p95WallMs: p95(rows, 'wallMs'),
    avgBootToReady: avg(rows, 'bootToReady'),
    avgImmediate: avg(rows, 'immediateLayer'),
    avgMainWidth: avg(rows, 'mainWidth'),
    overflowXFrames: rows.reduce((s, r) => s + (r.overflowXFrames || 0), 0),
    bodyOverflowX: rows.filter((r) => r.bodyOverflowX).length,
    settled: rows.filter((r) => r.settled).length,
    ok: rows.filter((r) => r.ok).length,
  });

  return {
    byRoute: Object.fromEntries(Object.entries(byRoute).map(([k, rows]) => [k, pack(rows)])),
    byViewport: Object.fromEntries(Object.entries(byViewport).map(([k, rows]) => [k, pack(rows)])),
  };
}

function formatTable(cells) {
  const header = [
    'route'.padEnd(22),
    'vp'.padEnd(8),
    'wxh'.padEnd(11),
    'wall'.padStart(6),
    'set'.padStart(3),
    'boot'.padStart(6),
    'imm'.padStart(6),
    'mainW'.padStart(6),
    'ovX'.padStart(3),
    'surface'.padEnd(12),
  ].join(' ');
  const lines = [header, '-'.repeat(header.length)];
  for (const c of cells) {
    lines.push([
      String(c.route).slice(0, 22).padEnd(22),
      String(c.viewport).padEnd(8),
      `${c.width}x${c.height}`.padEnd(11),
      String(c.wallMs).padStart(6),
      (c.settled ? 'y' : 'n').padStart(3),
      String(c.bootToReady ?? '-').padStart(6),
      String(c.immediateLayer ?? '-').padStart(6),
      String(c.mainWidth ?? '-').padStart(6),
      String(c.overflowXFrames ?? 0).padStart(3),
      String(c.surface || '-').slice(0, 12).padEnd(12),
    ].join(' '));
  }
  return lines.join('\n');
}

function formatCsv(cells) {
  const keys = [
    'route', 'viewport', 'width', 'height', 'mobile', 'wallMs', 'ok', 'settled', 'hardOk',
    'loadOutcome', 'attempt', 'dcl', 'load', 'navDuration', 'transferSize',
    'bootToReady', 'immediateLayer', 'immediateCore', 'siteSettingsMs', 'shellMs',
    'surface', 'pageState', 'runtimeStage', 'layoutVariant', 'layoutQaGrade', 'layoutShiftTotal',
    'packLocal', 'overflowXFrames', 'bodyOverflowX', 'mainWidth', 'mainHeight',
    'overflowXDetails',
    'innerWidth', 'innerHeight', 'scripts', 'scriptTransfer',
  ];
  const esc = (v) => {
    if (v == null) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /["',\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    keys.join(','),
    ...cells.map((c) => keys.map((k) => esc(c[k])).join(',')),
  ].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }
  if (typeof WebSocket === 'undefined') {
    console.error('[bench:nav] Global WebSocket required (Node 22+)');
    process.exit(2);
  }

  const chromePath = await resolveChrome(options.chrome);
  if (!chromePath) {
    console.error('[bench:nav] Chrome not found. Set CHROME_PATH or --chrome');
    process.exit(2);
  }

  const routes = options.routes || (options.quick ? [...QUICK_ROUTES] : [...DEFAULT_ROUTES]);
  const viewports = pickViewports(options.viewports, { quick: options.quick });
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
      process.stderr.write(`[bench:nav] starting dev-server on ${port}…\n`);
      const spawned = spawnDevServer(port);
      devChild = spawned.child;
      base = await spawned.ready;
    } else {
      await waitForHttp(base);
    }
    process.stderr.write(`[bench:nav] base ${base}\n`);
    process.stderr.write(
      `[bench:nav] routes ${routes.join(' ')} × viewports ${viewports.map((v) => v.id).join(',')}`
      + `${options.warm ? ' (warm)' : ''}\n`,
    );

    userDataDir = await createChromeProfileDir('spw-perf-');
    chromeChild = await openChrome(chromePath, userDataDir, debugPort);

    // Optional warm cell — discarded from primary rollup when --warm
    if (options.warm) {
      process.stderr.write('[bench:nav] warm cell…\n');
      const target = await newPageTarget(debugPort);
      const session = new CdpSession(target.webSocketDebuggerUrl);
      await session.open();
      try {
        await navigateAndProbe(session, {
          url: `${base}${withDebugQuery(routes[0], options)}`,
          viewport: viewports[0],
          settleMs: Math.min(options.settleMs, 8000),
          timeoutMs: options.timeoutMs,
          retries: 0,
        });
      } finally {
        session.close();
        await closePageTarget(debugPort, target);
      }
    }

    const cells = [];
    for (const route of routes) {
      for (const viewport of viewports) {
        const pathWithQuery = withDebugQuery(route, options);
        const absoluteUrl = `${base}${pathWithQuery}`;
        process.stderr.write(`[bench:nav] → ${viewport.id} ${absoluteUrl}\n`);

        const target = await newPageTarget(debugPort);
        const session = new CdpSession(target.webSocketDebuggerUrl);
        await session.open();
        try {
          const row = await navigateAndProbe(session, {
            url: absoluteUrl,
            viewport,
            settleMs: options.settleMs,
            timeoutMs: options.timeoutMs,
            retries: options.retries,
          });
          const cell = cellFromProbe(row, { route: pathWithQuery, viewport });
          cell.hardOk = evaluateHardOk(cell, options);
          cells.push(cell);
          process.stderr.write(
            `  ${cell.hardOk ? 'ok' : 'FAIL'} ${cell.wallMs}ms set=${cell.settled ? 'y' : 'n'} boot=${cell.bootToReady ?? '-'} imm=${cell.immediateLayer ?? '-'} mainW=${cell.mainWidth ?? '-'} ovX=${cell.overflowXFrames} scripts=${cell.scripts ?? '-'} cerr=${cell.consoleErrorCount || 0}\n`,
          );
        } finally {
          session.close();
          await closePageTarget(debugPort, target);
        }
      }
    }

    const rollup = summarizeMatrix(cells);
    const summary = {
      at: new Date().toISOString(),
      kind: 'page-viewport-performance-matrix',
      base,
      chrome: chromePath,
      settleMs: options.settleMs,
      requireSettled: options.requireSettled,
      failOnOverflowX: options.failOnOverflowX,
      failOnConsoleError: options.failOnConsoleError,
      warm: options.warm,
      debugLayout: options.debugLayout,
      debugQa: options.debugQa,
      routes,
      viewports: viewports.map((v) => ({
        id: v.id, width: v.width, height: v.height, mobile: v.mobile,
      })),
      ok: cells.every((c) => c.hardOk),
      cells: cells.length,
      failures: cells.filter((c) => !c.hardOk).length,
      settledCount: cells.filter((c) => c.settled).length,
      totalWallMs: cells.reduce((s, c) => s + c.wallMs, 0),
      rollup,
      results: cells.map(({ probe, ...rest }) => rest),
      // Keep full probes only in --out / --json for agents
      resultsFull: options.json || options.out ? cells : undefined,
      note: 'Directional headless timings. Prefer --warm for less cold-start bias. Horizontal overflow only (ovX).',
    };

    if (options.out) {
      await writeFile(options.out, `${JSON.stringify({
        ...summary,
        resultsFull: cells,
      }, null, 2)}\n`, 'utf8');
      process.stderr.write(`[bench:nav] wrote ${options.out}\n`);
    }

    if (options.json) {
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    } else if (options.csv) {
      process.stdout.write(`${formatCsv(cells)}\n`);
    } else {
      process.stdout.write(`\n${formatTable(cells)}\n`);
      process.stdout.write('\n--- rollup by route ---\n');
      for (const [route, row] of Object.entries(rollup.byRoute)) {
        process.stdout.write(
          `${route.padEnd(24)} avgWall=${row.avgWallMs ?? '-'} p95=${row.p95WallMs ?? '-'} max=${row.maxWallMs ?? '-'} boot=${row.avgBootToReady ?? '-'} imm=${row.avgImmediate ?? '-'} settled=${row.settled}/${row.cells}\n`,
        );
      }
      process.stdout.write('\n--- rollup by viewport ---\n');
      for (const [vp, row] of Object.entries(rollup.byViewport)) {
        process.stdout.write(
          `${vp.padEnd(10)} avgWall=${row.avgWallMs ?? '-'} p95=${row.p95WallMs ?? '-'} boot=${row.avgBootToReady ?? '-'} imm=${row.avgImmediate ?? '-'} mainW=${row.avgMainWidth ?? '-'} ovX=${row.overflowXFrames} settled=${row.settled}/${row.cells}\n`,
        );
      }
      process.stdout.write(
        `\nok=${summary.ok} cells=${summary.cells} failures=${summary.failures} settled=${summary.settledCount} totalWall=${summary.totalWallMs}ms\n`,
      );
    }

    return summary.ok ? 0 : 1;
  } catch (error) {
    console.error('[bench:nav] fatal', error);
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
