#!/usr/bin/env node
/**
 * Bottom-up alignment audit.
 *
 * Asks every laid-out box on a route how it sits inside the box that contains
 * it, and reports only the edges that nearly agree — see lib/alignment-probe.mjs
 * for why near-misses are the whole signal.
 *
 * This is the relational half of the composition box model. That module lets a
 * component describe itself; this one lets it describe its fit.
 *
 * Usage:
 *   node scripts/alignment-audit.mjs
 *   node scripts/alignment-audit.mjs --routes / /about/ --viewports pocket,broadsheet
 *   node scripts/alignment-audit.mjs --near 4 --json
 *   node scripts/alignment-audit.mjs --out /tmp/alignment.json
 */

import fs from 'node:fs/promises';
import {
  VIEWPORTS,
  resolveChrome,
  createChromeProfileDir,
  openChrome,
  newPageTarget,
  closePageTarget,
  CdpSession,
  applyViewport,
  spawnDevServer,
  pickFreePort,
  evaluateProbe,
  installShutdown,
  killProcessTree,
  sleep,
} from './lib/chrome-headless-harness.mjs';
import { buildAlignmentProbeExpression, summarizeAlignment } from './lib/alignment-probe.mjs';

function parseArgs(argv) {
  const args = {
    routes: [],
    viewports: ['pocket'],
    near: null,
    json: false,
    out: null,
    settleMs: 1200,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') args.json = true;
    else if (arg === '--out') args.out = argv[++i];
    else if (arg === '--near') args.near = Number(argv[++i]);
    else if (arg === '--settle') args.settleMs = Number(argv[++i]);
    else if (arg === '--viewports') args.viewports = String(argv[++i]).split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--routes') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) args.routes.push(argv[++i]);
    } else if (!arg.startsWith('--')) args.routes.push(arg);
  }
  if (!args.routes.length) args.routes = ['/'];
  return args;
}

function formatRow(row) {
  const times = row.occurrences > 1 ? ` ×${row.occurrences}` : '';
  if (row.kind === 'page-overflow') {
    return `  page-overflow     route scrolls sideways by ${row.overflowBy}px (${row.fits} → ${row.asked})\n`
      + `      widest  ${row.widestPainted ? `${row.widestPainted.at} ${row.widestPainted.node}` : 'none'}`
      + (row.note ? `\n      note    ${row.note}` : '');
  }
  if (row.kind === 'clipped-overflow') {
    return `  clipped-overflow  +${row.overflowBy}px${times}\n`
      + `      node    ${row.node}\n`
      + `      clipped ${row.clippedBy}`;
  }
  if (row.kind === 'sibling-ladder') {
    const members = (row.members || []).map((m) => `${m.at} ${m.node}`).join('\n              ');
    return `  sibling-ladder    ${row.edge} edges spread ${row.spread}px across ${row.count}${times}\n`
      + `      in      ${row.container}\n`
      + `      edges   ${members}`;
  }
  return `  near-flush        ${row.side} off by ${row.delta}px${times}\n`
    + `      child   ${row.child}\n`
    + `      in      ${row.container}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const probeOptions = args.near ? { nearMissPx: args.near } : {};
  const expression = buildAlignmentProbeExpression(probeOptions);

  const chromePath = await resolveChrome();
  const serverPort = await pickFreePort();
  const server = spawnDevServer(serverPort);
  const base = await server.ready;
  const debugPort = await pickFreePort();
  const profileDir = await createChromeProfileDir('spw-alignment-');
  const chromeChild = await openChrome(chromePath, profileDir, debugPort);

  const cleanup = [() => killProcessTree(chromeChild), () => killProcessTree(server.child)];
  installShutdown(cleanup);

  const reports = [];
  try {
    for (const viewportName of args.viewports) {
      const viewport = VIEWPORTS[viewportName];
      if (!viewport) {
        process.stderr.write(`[alignment] unknown viewport ${viewportName}\n`);
        continue;
      }
      for (const route of args.routes) {
        const target = await newPageTarget(debugPort);
        const session = new CdpSession(target.webSocketDebuggerUrl);
        try {
          await session.open();
          await session.send('Page.enable', {});
          await session.send('Runtime.enable', {});
          await applyViewport(session, viewport);
          await session.send('Page.navigate', { url: new URL(route, base).href });
          await sleep(args.settleMs);
          const raw = await evaluateProbe(session, expression, 20000);
          reports.push({ ...summarizeAlignment(raw), route, viewportName });
        } finally {
          session.close();
          await closePageTarget(debugPort, target);
        }
      }
    }
  } finally {
    for (const fn of cleanup) {
      try { fn(); } catch { /* shutting down */ }
    }
  }

  if (args.out) {
    await fs.writeFile(args.out, JSON.stringify(reports, null, 2));
    process.stdout.write(`[alignment] wrote ${args.out}\n`);
  }
  if (args.json) {
    process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`);
    return 0;
  }

  for (const r of reports) {
    const kinds = Object.entries(r.byKind).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none';
    process.stdout.write(
      `\n[alignment] ${r.route} @ ${r.viewportName} (${r.viewport.width}px)\n`
      + `  scanned ${r.scanned} boxes · ${r.total} findings in ${r.distinct} distinct sites · ${kinds}\n\n`,
    );
    for (const row of r.rows.slice(0, 12)) {
      process.stdout.write(`${formatRow(row)}\n\n`);
    }
    if (r.rows.length > 12) {
      process.stdout.write(`  … ${r.rows.length - 12} more distinct sites (use --json)\n\n`);
    }
  }
  return 0;
}

process.exit(await main());
