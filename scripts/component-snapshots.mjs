#!/usr/bin/env node
/**
 * Component screenshot + capture pipeline (zero new npm deps).
 *
 * Flows (long-term handling strategy):
 *   page     — live specimen route full-viewport capture (context + chrome)
 *   region   — clipped owning section around a specimen (layout/packing evidence)
 *   component— clipped selector on specimen (review evidence, starter kit)
 *   template — isolated snippet under compose.css (portable unit, no site shell)
 *
 * Output is a review pack: PNGs + manifest.json + index.html gallery.
 * Not a pixel-diff baseline system until a fixture opts into baseline ownership.
 *
 * Usage:
 *   npm run component:screenshots -- --base http://127.0.0.1:4173
 *   npm run component:screenshots -- --base http://127.0.0.1:4173 --out design/components/captures --flows page,component,template
 *   npm run component:screenshots -- --base http://127.0.0.1:4173 --ids frame-card --viewports phone,desktop --json
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { COMPONENT_FIXTURES } from '../public/js/kernel/component-fixtures.js';
import {
  VIEWPORTS,
  CdpSession,
  applyViewport,
  closePageTarget,
  createChromeProfileDir,
  evaluateProbe,
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
  ROOT,
} from './lib/chrome-headless-harness.mjs';

const FLOWS = Object.freeze(['page', 'region', 'component', 'template']);
const DEFAULT_FLOWS = Object.freeze(['page', 'region', 'component', 'template']);
const DEFAULT_VIEWPORTS = Object.freeze(['phone', 'desktop']);

function parseArgs(argv) {
  const options = {
    base: null,
    chrome: null,
    flows: [...DEFAULT_FLOWS],
    help: false,
    ids: null,
    json: false,
    out: path.join(ROOT, 'design/components/captures'),
    port: 0,
    settleMs: 8000,
    timeoutMs: 45000,
    viewports: [...DEFAULT_VIEWPORTS],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--base' && argv[i + 1]) options.base = argv[++i];
    else if (arg.startsWith('--base=')) options.base = arg.slice(7);
    else if (arg === '--out' && argv[i + 1]) options.out = argv[++i];
    else if (arg.startsWith('--out=')) options.out = arg.slice(6);
    else if (arg === '--chrome' && argv[i + 1]) options.chrome = argv[++i];
    else if (arg.startsWith('--chrome=')) options.chrome = arg.slice(9);
    else if (arg === '--ids' && argv[i + 1]) options.ids = argv[++i].split(',').filter(Boolean);
    else if (arg.startsWith('--ids=')) options.ids = arg.slice(6).split(',').filter(Boolean);
    else if (arg === '--flows' && argv[i + 1]) {
      options.flows = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--flows=')) {
      options.flows = arg.slice(8).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--viewports' && argv[i + 1]) {
      options.viewports = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--viewports=')) {
      options.viewports = arg.slice(12).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--settle-ms' && argv[i + 1]) options.settleMs = Number(argv[++i]) || options.settleMs;
    else if (arg === '--timeout-ms' && argv[i + 1]) options.timeoutMs = Number(argv[++i]) || options.timeoutMs;
    else if (arg === '--port' && argv[i + 1]) options.port = Number(argv[++i]) || 0;
  }
  return options;
}

function printHelp() {
  console.log(`component-snapshots — multi-flow component capture pack

Flows:
  page       Full specimen route (context value for agents / design review)
  region     Owning section around the component (packing and hierarchy evidence)
  component  Clipped selector on specimen (starter kit evidence)
  template   Isolated snippet + compose.css (portable unit without shell)

Usage:
  npm run component:screenshots -- --base http://127.0.0.1:4173
  npm run component:screenshots -- --base http://127.0.0.1:4173 --flows component,template
  npm run component:screenshots -- --out design/components/captures --ids frame-card

Options:
  --base URL         Server base (optional: auto-spawn dev-server)
  --out PATH         Review pack directory (default design/components/captures)
  --ids a,b          Fixture ids
  --flows a,b        page,region,component,template (default all)
  --viewports a,b    phone,desktop,… (default phone,desktop)
  --settle-ms N      Wait for specimen ready (default 8000)
  --json             Emit manifest JSON to stdout
  --chrome PATH
`);
}

function sha8(text) {
  return createHash('sha256').update(String(text || '')).digest('hex').slice(0, 8);
}

function captureQuery(url) {
  // Prefer still / reduced-motion-ish capture posture without inventing new params.
  const u = new URL(url);
  if (!u.searchParams.has('interaction')) u.searchParams.set('interaction', 'calm');
  return u.href;
}

async function screenshotPage(session, filePath) {
  try {
    const { data } = await session.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: false,
      captureBeyondViewport: false,
    }, 10000);
    await writeFile(filePath, Buffer.from(data, 'base64'));
  } catch {
    const { data } = await session.send('Page.captureScreenshot', {
      format: 'png',
    }, 10000);
    await writeFile(filePath, Buffer.from(data, 'base64'));
  }
}

async function measureSelector(session, selector) {
  const { result, exceptionDetails } = await session.send('Runtime.evaluate', {
    expression: `(async () => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const r = el.getBoundingClientRect();
      const ds = el.dataset || {};
      return {
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        viewportX: r.left,
        viewportY: r.top,
        width: r.width,
        height: r.height,
        top: r.top,
        left: r.left,
        semantics: {
          kind: ds.spwKind || el.getAttribute('data-spw-kind') || null,
          role: ds.spwRole || el.getAttribute('data-spw-role') || null,
          feature: ds.spwFeature || el.getAttribute('data-spw-feature') || null,
          operator: ds.spwOperator || el.getAttribute('data-spw-operator') || null,
        },
        text: (el.innerText || '').trim().slice(0, 240),
      };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.text || 'measureSelector failed');
  return result?.value || null;
}

async function screenshotClip(session, filePath, box, viewport, padding = 12) {
  const dpr = viewport?.deviceScaleFactor || 1;
  const vpW = viewport?.width || 1440;
  const vpH = viewport?.height || 900;

  // Document coordinate geometry
  const x = Math.max(0, Math.floor(box.x - padding));
  const y = Math.max(0, Math.floor(box.y - padding));
  const width = Math.ceil(box.width + padding * 2);
  // Keep region artifacts reviewable without asking Chrome for an unbounded page slice.
  const height = Math.max(2, Math.min(vpH * 2, Math.ceil(box.height + padding * 2)));

  // Chromium crashes when captureBeyondViewport is true and y+height is large,
  // or on some headless Mac versions regardless of height.
  // We rely entirely on the viewport-relative fallback block.
  try {
    const viewportX = Math.max(0, Math.floor((box.viewportX ?? 0) - padding));
    const viewportY = Math.max(0, Math.floor((box.viewportY ?? 0) - padding));
    const viewportWidth = Math.max(2, Math.min(vpW - viewportX, width));
    const viewportHeight = Math.max(2, Math.min(vpH - viewportY, height));
    const res = await session.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: false,
      clip: {
        x: viewportX,
        y: viewportY,
        width: viewportWidth,
        height: viewportHeight,
        scale: dpr,
      },
      captureBeyondViewport: false,
    }, 10000);
    if (res?.data) {
      await writeFile(filePath, Buffer.from(res.data, 'base64'));
      return {
        x: viewportX,
        y: viewportY,
        width: viewportWidth,
        height: viewportHeight,
        coordinateSpace: 'viewport',
      };
    }
  } catch {
    // A labeled viewport fallback is preferable to silently omitting the artifact.
  }

  await screenshotPage(session, filePath);
  return {
    x: 0,
    y: 0,
    width: vpW,
    height: vpH,
    fallback: 'viewport',
  };
}

async function renderTemplateDocument(session, base, snippetHtml, viewport) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <base href="${base}/"/>
  <title>Spw component template capture</title>
  <link rel="stylesheet" href="${base}/public/css/bundles/core.css"/>
  <link rel="stylesheet" href="${base}/public/css/style.css"/>
  <link rel="stylesheet" href="${base}/public/css/compose.css"/>
  <link rel="stylesheet" href="${base}/public/css/themes/packs.css"/>
  <style>
    html, body { margin: 0; padding: 0; }
    body { min-height: 100vh; display: grid; place-items: center; padding: 2rem; box-sizing: border-box; }
    .spw-template-capture-host {
      width: min(100%, 42rem);
      container-type: inline-size;
    }
  </style>
</head>
<body
  data-spw-surface="software"
  data-spw-features="operators metrics navigator console"
  data-spw-route-family="systems"
  data-spw-page-family="spec"
  data-spw-capture-flow="template"
  data-spw-theme-pack="glass-console">
  <div class="spw-template-capture-host" data-spw-capture-host="template">
    ${snippetHtml}
  </div>
</body>
</html>`;

  await navigateAndProbe(session, {
    url: `${base}/?template=1`,
    viewport,
    settleMs: 200,
    timeoutMs: 5000,
    retries: 1,
  });

  // CDP requires frameId for setDocumentContent
  const { frameTree } = await session.send('Page.getFrameTree');
  const frameId = frameTree?.frame?.id;
  if (!frameId) throw new Error('No main frame id for template document');
  await session.send('Page.setDocumentContent', { frameId, html });
  // Allow CSS/fonts to settle
  await new Promise((r) => setTimeout(r, 900));
}

function galleryHtml(manifest) {
  const cards = (manifest.captures || []).map((c) => `
    <figure class="card" data-flow="${c.flow}" data-fixture="${c.fixtureId}" data-viewport="${c.viewport}">
      <img src="${c.file}" alt="${c.alt}" loading="lazy" width="${c.clip?.width || ''}" height="${c.clip?.height || ''}"/>
      <figcaption>
        <strong>${c.fixtureId}</strong> · ${c.flow} · ${c.viewport}
        <br/><span class="meta">${c.label || ''}</span>
        ${c.semantics ? `<br/><code>${JSON.stringify(c.semantics)}</code>` : ''}
      </figcaption>
    </figure>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Component capture pack · ${manifest.at || ''}</title>
  <style>
    :root { font-family: ui-sans-serif, system-ui, sans-serif; color: #1a1a1a; background: #f7f4ee; }
    body { margin: 0; padding: 1.5rem; }
    header { margin-bottom: 1.5rem; max-width: 60rem; }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    .meta { color: #555; font-size: 0.9rem; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); }
    .card { margin: 0; background: #fff; border: 1px solid #ddd4c4; border-radius: 0.5rem; overflow: hidden; }
    .card img { display: block; width: 100%; height: auto; background: #eee; }
    figcaption { padding: 0.65rem 0.75rem 0.85rem; font-size: 0.82rem; line-height: 1.35; }
    code { font-size: 0.75rem; color: #444; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0 1rem; }
    .filters button { border: 1px solid #ccc; background: #fff; border-radius: 999px; padding: 0.25rem 0.7rem; cursor: pointer; }
    .filters button[aria-pressed="true"] { background: #1a9999; color: #fff; border-color: #1a9999; }
  </style>
</head>
<body>
  <header>
    <h1>Component capture pack</h1>
    <p class="meta">Generated ${manifest.at || ''} · ${manifest.captures?.length || 0} images · strategy: page / region / component / template</p>
    <p class="meta">Pipeline sources: specimen routes, fixture registry, compose.css isolation. Review evidence — not pixel CI unless opted in.</p>
    <div class="filters" role="group" aria-label="Filter by flow">
      <button type="button" data-filter="all" aria-pressed="true">all</button>
      <button type="button" data-filter="page">page</button>
      <button type="button" data-filter="region">region</button>
      <button type="button" data-filter="component">component</button>
      <button type="button" data-filter="template">template</button>
    </div>
  </header>
  <div class="grid" id="grid">
    ${cards}
  </div>
  <script>
    document.querySelectorAll('.filters button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filters button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        const f = btn.dataset.filter;
        document.querySelectorAll('.card').forEach((card) => {
          card.hidden = f !== 'all' && card.dataset.flow !== f;
        });
      });
    });
  </script>
</body>
</html>`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (typeof WebSocket === 'undefined') {
    console.error('[component:screenshots] Node 22+ WebSocket required');
    process.exit(2);
  }

  const invalidFlows = options.flows.filter((f) => !FLOWS.includes(f));
  if (invalidFlows.length) {
    throw new Error(`Unknown flows: ${invalidFlows.join(', ')}. Use ${FLOWS.join(', ')}`);
  }

  const chromePath = await resolveChrome(options.chrome);
  if (!chromePath) throw new Error('Chrome/Chromium not found; set CHROME_PATH or --chrome');

  const fixtures = options.ids
    ? COMPONENT_FIXTURES.filter((f) => options.ids.includes(f.id))
    : [...COMPONENT_FIXTURES];
  if (!fixtures.length) throw new Error('No fixtures selected');

  const viewports = pickViewports(options.viewports, { fallback: [...DEFAULT_VIEWPORTS] });

  let base = options.base ? options.base.replace(/\/$/, '') : null;
  let devChild = null;
  let chromeChild = null;
  let userDataDir = null;
  const debugPort = 9333 + Math.floor(Math.random() * 400);
  const shutdown = installShutdown([
    () => killProcessTree(chromeChild),
    () => killProcessTree(devChild),
  ]);

  const capturesDir = path.join(options.out, 'captures');
  await rm(capturesDir, { recursive: true, force: true }).catch(() => {});
  await mkdir(capturesDir, { recursive: true });

  const captures = [];
  const errors = [];
  const capturedPages = new Set();
  const captureHashes = new Map(); // Hash -> source label
  const { createHash } = await import('crypto');

  try {
    if (!base) {
      const port = options.port > 0 ? options.port : await pickFreePort();
      process.stderr.write(`[component:screenshots] starting dev-server on ${port}…\n`);
      const spawned = spawnDevServer(port);
      devChild = spawned.child;
      base = await spawned.ready;
    } else {
      await waitForHttp(base);
    }
    process.stderr.write(`[component:screenshots] base ${base}\n`);
    process.stderr.write(`[component:screenshots] out ${options.out}\n`);

    userDataDir = await createChromeProfileDir('spw-comp-cap-');
    chromeChild = await openChrome(chromePath, userDataDir, debugPort);

    const target = await newPageTarget(debugPort);
    const session = new CdpSession(target.webSocketDebuggerUrl);
    await session.open();

    try {
      for (const fixture of fixtures) {
        let snippetText = '';
        try {
          snippetText = await readFile(path.join(ROOT, fixture.snippet), 'utf8');
        } catch {
          errors.push(`${fixture.id}: cannot read snippet ${fixture.snippet}`);
          continue;
        }
        const snippetHash = sha8(snippetText);

        const fixtureFlows = Array.isArray(fixture.captureFlows) && fixture.captureFlows.length
          ? fixture.captureFlows
          : FLOWS;
        const activeFlows = options.flows.filter((f) => fixtureFlows.includes(f));
        if (!activeFlows.length) continue;

        for (const viewport of viewports) {
          if (fixture.layoutScenarios?.length && !fixture.layoutScenarios.includes(viewport.id)) {
            // Allow only declared scenarios when present
            continue;
          }

          // --- page + region + component flows share specimen navigation ---
          if (activeFlows.includes('page') || activeFlows.includes('region') || activeFlows.includes('component')) {
            const specimenUrl = captureQuery(new URL(fixture.specimenRoute, `${base}/`).href);
            process.stderr.write(`[component:screenshots] ${fixture.id} ${viewport.id} specimen\n`);
            await navigateAndProbe(session, {
              url: specimenUrl,
              viewport,
              settleMs: options.settleMs,
              timeoutMs: options.timeoutMs,
              retries: 1,
            });

            if (activeFlows.includes('page')) {
              try {
                const pageKey = `${new URL(fixture.specimenRoute, `${base}/`).pathname}|${viewport.id}`;
                if (!capturedPages.has(pageKey)) {
                  capturedPages.add(pageKey);
                  const routeId = new URL(fixture.specimenRoute, `${base}/`).pathname
                    .replace(/^\/|\/$/g, '')
                    .replaceAll('/', '--') || 'home';
                  const file = `captures/page--${routeId}--${viewport.id}.png`;
                  const abs = path.join(options.out, file);
                  await screenshotPage(session, abs);
                  captures.push({
                    fixtureId: null,
                    label: `${fixture.specimenRoute} page`,
                    flow: 'page',
                    viewport: viewport.id,
                    width: viewport.width,
                    height: viewport.height,
                    file,
                    abs,
                    source: 'specimen-route',
                    specimenRoute: fixture.specimenRoute,
                    alt: `${fixture.specimenRoute} at ${viewport.id} (full page context)`,
                    publish: ['design-review', 'agent-brief', 'page-pipeline'],
                  });
                  process.stderr.write(`  page -> ${file}\n`);
                  
                  const fileBuffer = await readFile(abs);
                  const hash = createHash('md5').update(fileBuffer).digest('hex');
                  if (captureHashes.has(hash)) {
                    errors.push(`Collision detected: ${file} is identical to ${captureHashes.get(hash)}`);
                  }
                  captureHashes.set(hash, file);
                }
              } catch (err) {
                errors.push(`${fixture.id}@${viewport.id} page capture failed: ${err.message}`);
              }
            }

            if (activeFlows.includes('region')) {
              try {
                const box = await measureSelector(session, fixture.regionSelector);
                if (!box || box.width < 2 || box.height < 2) {
                  errors.push(`${fixture.id}@${viewport.id}: region ${fixture.regionSelector} not found or empty`);
                } else {
                  const file = `captures/${fixture.id}--${viewport.id}--region.png`;
                  const abs = path.join(options.out, file);
                  const clip = await screenshotClip(session, abs, box, viewport, 20);
                  captures.push({
                    fixtureId: fixture.id,
                    label: fixture.label,
                    flow: 'region',
                    viewport: viewport.id,
                    width: viewport.width,
                    height: viewport.height,
                    file,
                    abs,
                    source: 'specimen-region',
                    specimenRoute: fixture.specimenRoute,
                    selector: fixture.regionSelector,
                    componentSelector: fixture.selector,
                    snippet: fixture.snippet,
                    snippetHash,
                    clip,
                    semantics: box.semantics,
                    textPreview: box.text,
                    alt: `${fixture.label} owning region (${fixture.regionSelector}) at ${viewport.id}`,
                    publish: ['design-review', 'layout-qa', 'agent-brief'],
                  });
                  process.stderr.write(`  region -> ${file} (${clip.width}×${clip.height})\n`);
                  
                  const fileBuffer = await readFile(abs);
                  const hash = createHash('md5').update(fileBuffer).digest('hex');
                  if (captureHashes.has(hash)) {
                    errors.push(`Collision detected: ${file} is identical to ${captureHashes.get(hash)}`);
                  }
                  captureHashes.set(hash, file);
                }
              } catch (err) {
                errors.push(`${fixture.id}@${viewport.id} region capture failed: ${err.message}`);
              }
            }

            if (activeFlows.includes('component')) {
              try {
                const box = await measureSelector(session, fixture.selector);
                if (!box || box.width < 2 || box.height < 2) {
                  errors.push(`${fixture.id}@${viewport.id}: selector ${fixture.selector} not found or empty on specimen`);
                } else {
                  const file = `captures/${fixture.id}--${viewport.id}--component.png`;
                  const abs = path.join(options.out, file);
                  const clip = await screenshotClip(session, abs, box, viewport);
                  captures.push({
                    fixtureId: fixture.id,
                    label: fixture.label,
                    flow: 'component',
                    viewport: viewport.id,
                    width: viewport.width,
                    height: viewport.height,
                    file,
                    abs,
                    source: 'specimen-clip',
                    specimenRoute: fixture.specimenRoute,
                    selector: fixture.selector,
                    snippet: fixture.snippet,
                    snippetHash,
                    clip,
                    semantics: box.semantics,
                    textPreview: box.text,
                    alt: `${fixture.label} component clip (${fixture.selector}) at ${viewport.id}`,
                    publish: ['starter-kit', 'design-review', 'component-pipeline', 'agent-brief'],
                  });
                  process.stderr.write(`  component -> ${file} (${clip.width}×${clip.height})\n`);
                  
                  const fileBuffer = await readFile(abs);
                  const hash = createHash('md5').update(fileBuffer).digest('hex');
                  if (captureHashes.has(hash)) {
                    errors.push(`Collision detected: ${file} is identical to ${captureHashes.get(hash)}`);
                  }
                  captureHashes.set(hash, file);
                }
              } catch (err) {
                errors.push(`${fixture.id}@${viewport.id} component capture failed: ${err.message}`);
              }
            }
          }

          // --- template isolation (compose.css only) ---
          if (activeFlows.includes('template')) {
            try {
              process.stderr.write(`[component:screenshots] ${fixture.id} ${viewport.id} template\n`);
              await renderTemplateDocument(session, base, snippetText, viewport);
              // Prefer clip to host; fall back to page
              let box = await measureSelector(session, fixture.selector);
              if (!box) box = await measureSelector(session, '[data-spw-capture-host="template"]');
              const file = `captures/${fixture.id}--${viewport.id}--template.png`;
              const abs = path.join(options.out, file);
              let clip = null;
              if (box && box.width >= 2) {
                clip = await screenshotClip(session, abs, box, viewport, 16);
              } else {
                await screenshotPage(session, abs);
              }
              captures.push({
                fixtureId: fixture.id,
                label: fixture.label,
                flow: 'template',
                viewport: viewport.id,
                width: viewport.width,
                height: viewport.height,
                file,
                abs,
                source: 'snippet-isolation',
                specimenRoute: null,
                selector: fixture.selector,
                snippet: fixture.snippet,
                snippetHash,
                clip,
                semantics: box?.semantics || null,
                alt: `${fixture.label} isolated template (compose.css) at ${viewport.id}`,
                publish: ['starter-kit', 'template-pipeline', 'portable-export', 'agent-brief'],
              });
              process.stderr.write(`  template -> ${file}\n`);
              
              const fileBuffer = await readFile(abs);
              const hash = createHash('md5').update(fileBuffer).digest('hex');
              if (captureHashes.has(hash)) {
                errors.push(`Collision detected: ${file} is identical to ${captureHashes.get(hash)}`);
              }
              captureHashes.set(hash, file);
            } catch (err) {
              errors.push(`${fixture.id}@${viewport.id} template capture failed: ${err.message}`);
            }
          }
        }
      }
    } finally {
      session.close();
    }

    const manifest = {
      at: new Date().toISOString(),
      kind: 'component-capture-pack',
      strategy: {
        flows: {
          page: 'Live specimen route full viewport — page publishing / context for agents',
          region: 'Owning live section clip — hierarchy, spacing, and packing evidence',
          component: 'Clipped selector on specimen — component passport evidence',
          template: 'Snippet + compose.css isolation — portable template publishing',
        },
        longTerm: [
          'Fixtures own capture intent; screenshots are evidence until baseline-opt-in',
          'Page flow feeds design review and route-level briefs',
          'Region flow connects page hierarchy to component anatomy and packing',
          'Component flow feeds starter kit and packing QA',
          'Template flow feeds portable export and other pipeline sources (catalog, Midjourney refs, docs)',
          'Do not commit noisy goldens by default; publish packs to design/components/captures/ (gitignored) or CI artifacts',
        ],
        otherPipelineSources: [
          'design/catalog (attribute cross-ref, not pixels)',
          'starter:inventory portable boundary',
          'layout-qa / perf-matrix structural metrics',
          'external art tools via clip exports (template/component)',
        ],
      },
      base,
      chrome: chromePath,
      fixtures: fixtures.map((f) => ({
        id: f.id,
        label: f.label,
        selector: f.selector,
        regionSelector: f.regionSelector || null,
        specimenRoute: f.specimenRoute,
        snippet: f.snippet,
        cssOwner: f.cssOwner,
        states: f.states,
        layoutScenarios: f.layoutScenarios,
      })),
      viewports: viewports.map((v) => ({ id: v.id, width: v.width, height: v.height })),
      flows: options.flows,
      captures: captures.map(({ abs, ...rest }) => rest),
      errors,
      counts: {
        captures: captures.length,
        errors: errors.length,
        byFlow: Object.fromEntries(FLOWS.map((f) => [f, captures.filter((c) => c.flow === f).length])),
      },
    };

    await writeFile(path.join(options.out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(path.join(options.out, 'index.html'), galleryHtml(manifest));

    // Sidecar for pipeline consumers (catalog / agents)
    await writeFile(
      path.join(options.out, 'pipeline.json'),
      `${JSON.stringify({
        kind: 'component-capture-pipeline-pointer',
        at: manifest.at,
        gallery: 'index.html',
        manifest: 'manifest.json',
        capturesDir: 'captures/',
        publishHints: {
          page: 'route review, OG/social stills, agent page briefs',
          region: 'section hierarchy, layout QA, component ownership',
          component: 'starter kit evidence, packing review, passport cards',
          template: 'portable export, docs embeds, external render tools',
        },
      }, null, 2)}\n`,
    );

    if (options.json) {
      process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    } else {
      process.stdout.write(
        `[component:screenshots] ${captures.length} captures · ${errors.length} errors · gallery ${path.join(options.out, 'index.html')}\n`,
      );
      if (errors.length) {
        for (const err of errors) process.stderr.write(`  ! ${err}\n`);
      }
    }

    return errors.length ? 1 : 0;
  } catch (error) {
    console.error('[component:screenshots] fatal', error);
    return 1;
  } finally {
    shutdown();
    killProcessTree(chromeChild);
    killProcessTree(devChild);
    if (userDataDir) await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().then((code) => process.exit(code ?? 0));
