#!/usr/bin/env node
/**
 * layer-ablation.mjs
 *
 * Times a full style pass with one cascade layer removed from bundles/core.css
 * at a time. Each configuration gets a fresh page with scripts disabled, and
 * the ablated sheet is served through CDP Fetch, because rules re-inserted
 * into a live sheet do not cost what parsed-once rules cost
 * (.spw/audits/runtime-recalc-cost-2026-09.spw#method).
 *
 * The pass: write a root custom property nothing reads, read
 * getComputedStyle(body) (the style half), then offsetHeight (the layout
 * half). Median of --runs per configuration.
 *
 * Layers are not additive: removing components once raised the pass, because
 * it carries the containment that makes the rest cheap. Read a row as "the
 * page this layer leaves behind", and repeat a surprising row before trusting it.
 *
 *   node scripts/layer-ablation.mjs [route] [--viewport=phone] [--runs=9]
 *        [--only] [--layers=a,b] [--json=out.json] [--chrome=<path>]
 *
 *   route       default /about/
 *   --only      also time each layer alone (only:<layer>)
 *   --layers    limit minus:/only: rows to these layers
 */
import { writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  ROOT,
  VIEWPORTS,
  CdpSession,
  applyViewport,
  closePageTarget,
  createChromeProfileDir,
  newPageTarget,
  openChrome,
  pickFreePort,
  resolveChrome,
  sleep,
  spawnDevServer,
} from './lib/chrome-headless-harness.mjs';
import { ablateLayers, listLayers } from './lib/css-layer-blocks.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const route = args.find((arg) => !arg.startsWith('--')) || '/about/';
const viewport = VIEWPORTS[flag('viewport', 'phone')];
const runs = Number(flag('runs', '9'));
const withOnly = args.includes('--only');
const jsonOut = flag('json', '');
if (!viewport) throw new Error(`unknown viewport; use one of ${Object.keys(VIEWPORTS).join(', ')}`);

const CORE = path.join(ROOT, 'public/css/bundles/core.css');
const css = readFileSync(CORE, 'utf8');
const allLayers = listLayers(css);
const picked = flag('layers', '') ? flag('layers', '').split(',') : allLayers;

const configs = [{ label: 'all', choice: {} }];
for (const layer of picked) configs.push({ label: `minus:${layer}`, choice: { drop: [layer] } });
if (withOnly) for (const layer of picked) configs.push({ label: `only:${layer}`, choice: { only: [layer] } });
configs.push({ label: 'all-again', choice: {} });

const MEASURE = `(() => {
  const root = document.documentElement;
  const style = [];
  const layout = [];
  for (let i = 0; i < ${runs}; i += 1) {
    root.style.setProperty('--spw-ablation-probe', String(i));
    const t0 = performance.now();
    getComputedStyle(document.body).color;
    const t1 = performance.now();
    document.body.offsetHeight;
    const t2 = performance.now();
    style.push(t1 - t0);
    layout.push(t2 - t1);
  }
  const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
  return { style: median(style), layout: median(layout), elements: document.getElementsByTagName('*').length };
})()`;

async function measure(debugPort, baseUrl, config) {
  const target = await newPageTarget(debugPort);
  const session = new CdpSession(target.webSocketDebuggerUrl);
  await session.open();
  try {
    const body = Buffer.from(ablateLayers(css, config.choice)).toString('base64');
    session.on('Fetch.requestPaused', ({ requestId }) => {
      session.send('Fetch.fulfillRequest', {
        requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/css; charset=utf-8' }, { name: 'Cache-Control', value: 'no-store' }],
        body,
      }).catch(() => {});
    });
    await session.send('Fetch.enable', { patterns: [{ urlPattern: '*/public/css/bundles/core.css*', requestStage: 'Request' }] });
    await session.send('Network.enable');
    await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    await session.send('Emulation.setScriptExecutionDisabled', { value: true });
    await applyViewport(session, viewport);
    await session.send('Page.enable');
    const loaded = session.once('Page.loadEventFired', 45000);
    await session.send('Page.navigate', { url: `${baseUrl}${route}` });
    await loaded;
    await sleep(600);
    const { result } = await session.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true });
    return { config: config.label, bytes: Buffer.byteLength(Buffer.from(body, 'base64')), ...result.value };
  } finally {
    session.close();
    await closePageTarget(debugPort, target);
  }
}

const serverPort = await pickFreePort();
const debugPort = await pickFreePort();
const server = spawnDevServer(serverPort);
let chrome = null;
const stop = () => {
  try { chrome?.kill('SIGTERM'); } catch { /* already gone */ }
  try { server.child.kill('SIGTERM'); } catch { /* already gone */ }
};
process.on('SIGINT', () => { stop(); process.exit(130); });

try {
  const baseUrl = await server.ready;
  chrome = await openChrome(await resolveChrome(flag('chrome', '')), await createChromeProfileDir('spw-ablation-'), debugPort);
  console.log(`[layer-ablation] ${route} at ${viewport.id}, ${runs} runs per row; shipped layers: ${allLayers.join(' → ')}`);
  const rows = [];
  for (const config of configs) {
    const row = await measure(debugPort, baseUrl, config);
    rows.push(row);
    console.log(`  ${row.config.padEnd(20)} style ${row.style.toFixed(1).padStart(7)} ms  layout ${row.layout.toFixed(1).padStart(6)} ms  ${String(row.elements).padStart(5)} el  ${(row.bytes / 1024).toFixed(0).padStart(5)} KiB`);
  }
  const [first, last] = [rows[0], rows.at(-1)];
  console.log(`  noise: all ${first.style.toFixed(1)} ms vs all-again ${last.style.toFixed(1)} ms; trust a row only beyond that spread`);
  if (jsonOut) await writeFile(jsonOut, `${JSON.stringify({ route, viewport: viewport.id, runs, layers: allLayers, rows }, null, 2)}\n`);
} finally {
  stop();
}
