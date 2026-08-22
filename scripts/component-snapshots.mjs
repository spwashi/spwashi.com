#!/usr/bin/env node
/**
 * Component + region ecology capture (zero new npm deps).
 *
 * QA track: device-reason viewports (pocket / fold / broadsheet) and their media queries.
 * Social track: unique content-fit cards plus named feed crops for posting.
 *
 * Output is a review pack: stills + manifest.json + precipitate.json + index.html.
 * Not a pixel-diff baseline system until a fixture opts into baseline ownership.
 *
 * Usage:
 *   npm run visual:capture -- --base http://127.0.0.1:4173
 *   npm run visual:ecology
 *   npm run visual:social -- --ids frame-card
 *   npm run visual:capture -- --dry-plan
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

import { COMPONENT_FIXTURES } from '../public/js/kernel/component-fixtures.js';
import { REGION_ECOLOGY_FIXTURES } from '../public/js/kernel/region-ecology-fixtures.js';
import {
  FLOWS,
  DEFAULT_QA_FLOWS,
  DEFAULT_QA_VIEWPORTS,
  DEFAULT_ECOLOGY_VIEWPORTS,
  DEFAULT_SOCIAL_ASPECTS,
  SOCIAL_ASPECTS,
  VISIBILITY_LENSES,
  sha8,
  cropToAspect,
  shouldSkipJob,
  fingerprintJob,
  socialViewport,
  templateDocumentHtml,
  buildCapturePlan,
  enhancementHint,
  marketingPrompt,
  intelligencePrompts,
} from './lib/visual-capture-plan.mjs';
import {
  CdpSession,
  applyViewport,
  closePageTarget,
  createChromeProfileDir,
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

function parseArgs(argv) {
  const options = {
    aspects: [],
    base: null,
    changed: false,
    chrome: null,
    dryPlan: false,
    ecology: false,
    flows: [...DEFAULT_QA_FLOWS],
    format: 'jpeg',
    help: false,
    ids: null,
    json: false,
    keep: false,
    lenses: [],
    noComponents: false,
    out: path.join(ROOT, 'design/components/captures'),
    port: 0,
    precipitate: false,
    quality: 70,
    quick: false,
    seats: null,
    settleMs: 2500,
    social: false,
    socialOnly: false,
    timeoutMs: 45000,
    viewports: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--dry-plan') options.dryPlan = true;
    else if (arg === '--ecology') options.ecology = true;
    else if (arg === '--no-components') options.noComponents = true;
    else if (arg === '--social') options.social = true;
    else if (arg === '--social-only') {
      options.social = true;
      options.socialOnly = true;
    }
    else if (arg === '--precipitate') options.precipitate = true;
    else if (arg === '--changed') options.changed = true;
    else if (arg === '--keep') options.keep = true;
    else if (arg === '--quick') options.quick = true;
    else if (arg === '--base' && argv[i + 1]) options.base = argv[++i];
    else if (arg.startsWith('--base=')) options.base = arg.slice(7);
    else if (arg === '--out' && argv[i + 1]) options.out = argv[++i];
    else if (arg.startsWith('--out=')) options.out = arg.slice(6);
    else if (arg === '--chrome' && argv[i + 1]) options.chrome = argv[++i];
    else if (arg.startsWith('--chrome=')) options.chrome = arg.slice(9);
    else if (arg === '--ids' && argv[i + 1]) options.ids = argv[++i].split(',').filter(Boolean);
    else if (arg.startsWith('--ids=')) options.ids = arg.slice(6).split(',').filter(Boolean);
    else if (arg === '--seats' && argv[i + 1]) options.seats = argv[++i].split(',').filter(Boolean);
    else if (arg.startsWith('--seats=')) options.seats = arg.slice(7).split(',').filter(Boolean);
    else if (arg === '--flows' && argv[i + 1]) {
      options.flows = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--flows=')) {
      options.flows = arg.slice(8).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--viewports' && argv[i + 1]) {
      options.viewports = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--viewports=')) {
      options.viewports = arg.slice(12).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--aspects' && argv[i + 1]) {
      options.aspects = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--aspects=')) {
      options.aspects = arg.slice(10).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--lenses' && argv[i + 1]) {
      options.lenses = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--lenses=')) {
      options.lenses = arg.slice(9).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--format' && argv[i + 1]) options.format = argv[++i];
    else if (arg.startsWith('--format=')) options.format = arg.slice(9);
    else if (arg === '--quality' && argv[i + 1]) options.quality = Number(argv[++i]) || options.quality;
    else if (arg === '--settle-ms' && argv[i + 1]) options.settleMs = Number(argv[++i]) || options.settleMs;
    else if (arg === '--timeout-ms' && argv[i + 1]) options.timeoutMs = Number(argv[++i]) || options.timeoutMs;
    else if (arg === '--port' && argv[i + 1]) options.port = Number(argv[++i]) || 0;
  }

  if (options.quick) {
    options.flows = ['region', 'component'];
    options.viewports = options.viewports || ['phone', 'desktop'];
    options.settleMs = Math.min(options.settleMs, 2000);
    options.format = options.format === 'png' && options.precipitate ? 'png' : 'jpeg';
  }
  if (options.precipitate) {
    options.format = 'png';
    options.social = true;
    options.keep = true;
  }
  if (options.social && !options.aspects.length) options.aspects = [...DEFAULT_SOCIAL_ASPECTS];
  if (options.changed) options.keep = true;
  if (!options.viewports) {
    options.viewports = options.ecology && options.noComponents
      ? [...DEFAULT_ECOLOGY_VIEWPORTS]
      : [...DEFAULT_QA_VIEWPORTS];
  }
  if (options.ecology && !options.noComponents && !argv.some((arg) => arg === '--viewports' || arg.startsWith('--viewports='))) {
    options.viewports = ['phone', 'fold', 'desktop'];
  }
  return options;
}

function printHelp() {
  console.log(`visual-capture — component + region ecology stills

Tracks:
  qa       Device-reason viewports and media queries (pocket / fold / broadsheet)
  social   Unique content-fit cards + named feed crops (1/1, 4/5, 9/16, 16/9, 1.91/1)

Usage:
  npm run visual:capture -- --base http://127.0.0.1:4173
  npm run visual:capture -- --dry-plan
  npm run visual:ecology
  npm run visual:social -- --ids frame-card --aspects fit,square,portrait
  npm run visual:capture -- --precipitate --ids frame-card,about-years --ecology

Options:
  --base URL         Server base (optional: auto-spawn dev-server)
  --out PATH         Review pack directory (default design/components/captures)
  --ids a,b          Fixture ids (component or ecology)
  --seats hook,cluster
  --flows a,b        page,region,component,template (default region,component)
  --viewports a,b    phone,fold,desktop,pocket,broadsheet,…
  --aspects a,b      fit,square,portrait,story,landscape,og
  --lenses a,b       density,enhancement,tangibility,labels (opt-in visibility/tangibility)
  --ecology          Include region-ecology seats
  --no-components    Skip component fixtures
  --social           Emit unique/social cards on top of QA
  --social-only      Social cards only (content-fit + named aspects)
  --precipitate      PNG lock + precipitate.json (implies --social)
  --changed          Only jobs whose source files changed (implies --keep)
  --keep             Do not wipe the pack; skip unchanged fingerprints
  --dry-plan         Print navigation groups, no Chrome
  --quick            region+component, phone+desktop, jpeg
  --format jpeg|png  Review default jpeg; precipitate forces png
  --settle-ms N      Default 2500
  --json
`);
}

function captureQuery(url, lens = null) {
  const u = new URL(url);
  if (!u.searchParams.has('interaction')) u.searchParams.set('interaction', 'calm');
  if (!u.searchParams.has('precipitate')) u.searchParams.set('precipitate', 'print');
  if (lens?.query && lens?.value) u.searchParams.set(lens.query, lens.value);
  return u.href;
}

function gitChangedFiles() {
  const result = spawnSync('git', ['diff', '--name-only', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) return [];
  return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
}

async function screenshotBuffer(session, { format = 'png', quality = 70, clip = null } = {}) {
  const params = {
    format,
    fromSurface: false,
    captureBeyondViewport: false,
  };
  if (format === 'jpeg') params.quality = quality;
  if (clip) {
    params.clip = {
      x: Math.max(0, clip.x),
      y: Math.max(0, clip.y),
      width: Math.max(2, clip.width),
      height: Math.max(2, clip.height),
      scale: clip.scale || 1,
    };
  }
  try {
    const { data } = await session.send('Page.captureScreenshot', params, 10000);
    if (data) return Buffer.from(data, 'base64');
  } catch {
    // labeled fallback below
  }
  const { data } = await session.send('Page.captureScreenshot', {
    format,
    ...(format === 'jpeg' ? { quality } : {}),
  }, 10000);
  return Buffer.from(data, 'base64');
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
        semantics: {
          kind: ds.spwKind || el.getAttribute('data-spw-kind') || null,
          role: ds.spwRole || el.getAttribute('data-spw-role') || null,
          region: ds.spwRegion || el.getAttribute('data-spw-region') || null,
          cluster: ds.spwCluster || el.getAttribute('data-spw-cluster') || null,
          feature: ds.spwFeature || el.getAttribute('data-spw-feature') || null,
          operator: ds.spwOperator || el.getAttribute('data-spw-operator') || null,
        },
        pretext: {
          wrap: ds.textWrap || ds.spwPretextWrap || el.getAttribute('data-text-wrap') || null,
          widthClass: ds.textWidthClass || ds.spwPretextWidthClass || el.getAttribute('data-text-width-class') || null,
          measure: ds.textMeasure || ds.spwPretextMeasure || null,
          occupancy: ds.spwPackOccupancy || el.getAttribute('data-spw-pack-occupancy') || null,
          density: ds.spwDensity || ds.textDensity || null,
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

function clipForBox(box, viewport, padding, aspect) {
  const cropped = cropToAspect(box, aspect || 'fit', padding);
  const dpr = viewport?.deviceScaleFactor || 1;
  const vpW = viewport?.width || 1440;
  const vpH = viewport?.height || 900;
  const viewportX = Math.max(0, Math.floor(cropped.viewportX ?? 0));
  const viewportY = Math.max(0, Math.floor(cropped.viewportY ?? 0));
  return {
    x: viewportX,
    y: viewportY,
    width: Math.max(2, Math.min(vpW - viewportX, Math.ceil(cropped.width))),
    height: Math.max(2, Math.min(vpH - viewportY, Math.ceil(cropped.height))),
    scale: dpr,
    aspect: cropped.aspect,
    ratioLabel: cropped.ratioLabel,
    coordinateSpace: 'viewport',
  };
}

function galleryHtml(manifest) {
  const cards = (manifest.captures || []).map((c) => `
    <figure class="card" data-flow="${c.flow}" data-track="${c.track || 'qa'}" data-aspect="${c.aspect || 'qa'}" data-fixture="${c.fixtureId || c.id || ''}">
      <img src="${c.file}" alt="${c.alt || ''}" loading="lazy" width="${c.clip?.width || ''}" height="${c.clip?.height || ''}"/>
      <figcaption>
        <strong>${c.fixtureId || c.id}</strong> · ${c.track || 'qa'} · ${c.flow} · ${c.aspect || c.viewport || ''}
        <br/><span class="meta">${c.wonder || c.label || ''}</span>
        ${c.ratioLabel ? `<br/><code>${c.ratioLabel}</code>` : ''}
        ${c.media ? `<br/><code>${c.media}</code>` : ''}
      </figcaption>
    </figure>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Visual capture pack · ${manifest.at || ''}</title>
  <style>
    :root { font-family: ui-sans-serif, system-ui, sans-serif; color: #1a1a1a; background: #f7f4ee; }
    body { margin: 0; padding: 1.5rem; }
    header { margin-bottom: 1.5rem; max-width: 64rem; }
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
    <h1>Visual capture pack</h1>
    <p class="meta">Generated ${manifest.at || ''} · ${manifest.captures?.length || 0} stills · qa device-reasons + social content-fit cards</p>
    <p class="meta">QA answers “does it pack?” Social precipitates answer “is this combination worth posting?” Pixels stay gitignored.</p>
    <div class="filters" role="group" aria-label="Filter stills">
      <button type="button" data-filter="all" aria-pressed="true">all</button>
      <button type="button" data-filter="qa">qa</button>
      <button type="button" data-filter="social">social</button>
      <button type="button" data-filter="region">region</button>
      <button type="button" data-filter="component">component</button>
      <button type="button" data-filter="fit">fit</button>
      <button type="button" data-filter="square">square</button>
    </div>
  </header>
  <div class="grid" id="grid">${cards}</div>
  <script>
    document.querySelectorAll('.filters button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filters button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        const f = btn.dataset.filter;
        document.querySelectorAll('.card').forEach((card) => {
          card.hidden = f !== 'all'
            && card.dataset.track !== f
            && card.dataset.flow !== f
            && card.dataset.aspect !== f;
        });
      });
    });
  </script>
</body>
</html>`;
}

async function readPriorManifest(outDir) {
  try {
    return JSON.parse(await readFile(path.join(outDir, 'manifest.json'), 'utf8'));
  } catch {
    return null;
  }
}

async function existingCaptureFiles(outDir) {
  try {
    const names = await readdir(path.join(outDir, 'captures'));
    return new Set(names.map((name) => `captures/${name}`));
  } catch {
    return new Set();
  }
}

async function hashSources(job) {
  const hashes = { snippet: '', css: '' };
  if (job.snippet) {
    try { hashes.snippet = sha8(await readFile(path.join(ROOT, job.snippet), 'utf8')); } catch { /* missing snippet recorded by contracts */ }
  }
  if (job.cssOwner) {
    try { hashes.css = sha8(await readFile(path.join(ROOT, job.cssOwner), 'utf8')); } catch { /* same */ }
  }
  return hashes;
}

async function renderCardDocument(session, base, snippetHtml, aspect, viewport, sizeToken, lens = null) {
  const html = templateDocumentHtml(base, snippetHtml, { aspect, sizeToken, lens });
  await applyViewport(session, viewport);
  try {
    await session.send('Page.navigate', { url: 'about:blank' }, 8000);
  } catch {
    // continue; setDocumentContent still needs a frame
  }
  const { frameTree } = await session.send('Page.getFrameTree');
  const frameId = frameTree?.frame?.id;
  if (!frameId) throw new Error('No main frame id for card document');
  await session.send('Page.setDocumentContent', { frameId, html });
  await new Promise((r) => setTimeout(r, 500));
}

function resolveJobViewport(job, qaViewports) {
  if (job.canvas === 'card') return socialViewport(job.aspect || 'fit');
  return qaViewports.find((viewport) => viewport.id === job.viewportId)
    || { id: job.viewportId, width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, hasTouch: false };
}

async function captureJob(session, job, {
  base,
  viewport,
  format,
  quality,
  snippetCache,
}) {
  const started = performance.now();
  let box = null;
  if (job.canvas === 'card') {
    const snippet = job.snippet
      ? snippetCache.get(job.snippet) ?? await readFile(path.join(ROOT, job.snippet), 'utf8')
      : '';
    snippetCache.set(job.snippet, snippet);
    await renderCardDocument(session, base, snippet, job.aspect || 'fit', viewport, job.sizeToken, job.lens);
    box = await measureSelector(session, job.selector)
      || await measureSelector(session, '[data-spw-capture-host="template"]');
  } else if (job.flow !== 'page') {
    box = await measureSelector(session, job.selector);
    if (!box || box.width < 2 || box.height < 2) {
      throw new Error(`${job.selector} not found or empty`);
    }
  }

  const padding = job.flow === 'region' ? 20 : job.canvas === 'card' ? 16 : 12;
  let clip = null;
  let buffer;
  if (job.flow === 'page' || !box) {
    buffer = await screenshotBuffer(session, { format, quality });
  } else {
    clip = clipForBox(box, viewport, padding, job.aspect || 'fit');
    buffer = await screenshotBuffer(session, { format, quality, clip });
  }
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  return {
    buffer,
    clip,
    box,
    sha256,
    ms: Math.round(performance.now() - started),
    ratioLabel: clip?.ratioLabel || (box ? `${Math.round((box.width / box.height) * 100) / 100}` : null),
    semantics: box?.semantics || null,
    pretext: box?.pretext || null,
    hint: enhancementHint(job, box?.pretext || {}),
    prompt: marketingPrompt(job, box?.pretext || {}),
    prompts: intelligencePrompts(job, box?.pretext || {}),
    textPreview: box?.text || null,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (typeof WebSocket === 'undefined') {
    console.error('[visual:capture] Node 22+ WebSocket required');
    process.exit(2);
  }

  const invalidFlows = options.flows.filter((f) => !FLOWS.includes(f));
  if (invalidFlows.length) {
    throw new Error(`Unknown flows: ${invalidFlows.join(', ')}. Use ${FLOWS.join(', ')}`);
  }
  const invalidAspects = options.aspects.filter((id) => !SOCIAL_ASPECTS[id]);
  if (invalidAspects.length) {
    throw new Error(`Unknown aspects: ${invalidAspects.join(', ')}. Use ${Object.keys(SOCIAL_ASPECTS).join(', ')}`);
  }
  const invalidLenses = options.lenses.filter((id) => !VISIBILITY_LENSES[id]);
  if (invalidLenses.length) {
    throw new Error(`Unknown lenses: ${invalidLenses.join(', ')}. Use ${Object.keys(VISIBILITY_LENSES).join(', ')}`);
  }
  if (!['jpeg', 'png'].includes(options.format)) {
    throw new Error('format must be jpeg or png');
  }

  const qaViewports = pickViewports(options.viewports, { fallback: [...DEFAULT_QA_VIEWPORTS] });
  const changedFiles = options.changed ? gitChangedFiles() : null;
  const plan = buildCapturePlan({
    componentFixtures: COMPONENT_FIXTURES,
    ecologyFixtures: REGION_ECOLOGY_FIXTURES,
    flows: options.flows,
    viewports: qaViewports,
    aspects: options.aspects,
    ids: options.ids,
    seats: options.seats,
    includeComponents: !options.noComponents,
    includeEcology: options.ecology,
    includeSocial: options.social || options.precipitate,
    includeQa: !options.socialOnly,
    format: options.format,
    changedFiles,
    lenses: options.lenses,
  });

  if (!plan.jobs.length) throw new Error('No capture jobs selected');

  process.stderr.write(
    `[visual:capture] ${plan.summary.jobs} jobs · ${plan.summary.specimenNavs} specimen navs · ${plan.summary.cardNavs} cards · qa ${plan.summary.byTrack.qa} / social ${plan.summary.byTrack.social}\n`,
  );

  if (options.dryPlan) {
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ summary: plan.summary, jobs: plan.jobs }, null, 2)}\n`);
    } else {
      for (const group of plan.groups) {
        process.stdout.write(`  ${group.canvas} ${group.key} (${group.jobs.length})\n`);
      }
    }
    return 0;
  }

  const prior = options.keep ? await readPriorManifest(options.out) : null;
  const priorFingerprints = new Set((prior?.captures || []).map((c) => c.fingerprint).filter(Boolean));
  const existingFiles = options.keep ? await existingCaptureFiles(options.out) : new Set();

  const hashedJobs = [];
  for (const job of plan.jobs) {
    const hashes = await hashSources(job);
    job.fingerprint = fingerprintJob(job, hashes);
    hashedJobs.push(job);
  }
  const runnable = hashedJobs.filter((job) => !shouldSkipJob(job, { priorFingerprints, existingFiles }));
  const skipped = hashedJobs.length - runnable.length;
  if (skipped) process.stderr.write(`[visual:capture] skip ${skipped} unchanged\n`);

  const chromePath = await resolveChrome(options.chrome);
  if (!chromePath) throw new Error('Chrome/Chromium not found; set CHROME_PATH or --chrome');

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
  if (!options.keep) await rm(capturesDir, { recursive: true, force: true }).catch(() => {});
  await mkdir(capturesDir, { recursive: true });

  const captures = [];
  const errors = [];
  const snippetCache = new Map();
  const captureHashes = new Map();

  try {
    if (!base) {
      const port = options.port > 0 ? options.port : await pickFreePort();
      process.stderr.write(`[visual:capture] starting dev-server on ${port}…\n`);
      const spawned = spawnDevServer(port);
      devChild = spawned.child;
      base = await spawned.ready;
    } else {
      await waitForHttp(base);
    }
    process.stderr.write(`[visual:capture] base ${base}\n`);
    process.stderr.write(`[visual:capture] out ${options.out} · ${options.format}\n`);

    userDataDir = await createChromeProfileDir('spw-visual-cap-');
    chromeChild = await openChrome(chromePath, userDataDir, debugPort);
    const target = await newPageTarget(debugPort);
    const session = new CdpSession(target.webSocketDebuggerUrl);
    await session.open();

    try {
      const runnableSet = new Set(runnable);
      const groups = plan.groups.map((group) => ({
        ...group,
        jobs: group.jobs.filter((job) => runnableSet.has(job)),
      })).filter((group) => group.jobs.length);

      for (const group of groups) {
        const viewport = resolveJobViewport(group.jobs[0], qaViewports);
        if (group.canvas === 'specimen') {
          const specimenUrl = captureQuery(new URL(routeHref(group.route, base), `${base}/`).href, group.jobs[0]?.lens);
          process.stderr.write(`[visual:capture] nav ${group.key}\n`);
          await navigateAndProbe(session, {
            url: specimenUrl,
            viewport,
            settleMs: options.settleMs,
            timeoutMs: options.timeoutMs,
            retries: 1,
            partialGraceMs: 2000,
          });
        }

        for (const job of group.jobs) {
          const jobViewport = resolveJobViewport(job, qaViewports);
          try {
            const shot = await captureJob(session, job, {
              base,
              viewport: jobViewport,
              format: options.format,
              quality: options.quality,
              snippetCache,
            });
            const abs = path.join(options.out, job.file);
            await mkdir(path.dirname(abs), { recursive: true });
            await writeFile(abs, shot.buffer);
            if (captureHashes.has(shot.sha256)) {
              errors.push(`Collision: ${job.file} identical to ${captureHashes.get(shot.sha256)}`);
            }
            captureHashes.set(shot.sha256, job.file);
            captures.push({
              id: job.id,
              fixtureId: job.fixtureId,
              label: job.label,
              kind: job.kind,
              track: job.track,
              flow: job.flow,
              viewport: job.viewportId,
              aspect: job.aspect,
              ratioLabel: shot.ratioLabel,
              seat: job.seat,
              media: job.media,
              wonder: job.wonder,
              synergy: job.synergy || null,
              sizeReason: job.sizeReason,
              sizeToken: job.sizeToken,
              lens: job.lens || null,
              pretext: shot.pretext,
              hint: shot.hint,
              prompt: shot.prompt,
              prompts: shot.prompts,
              file: job.file,
              fingerprint: job.fingerprint,
              sha256: shot.sha256,
              clip: shot.clip,
              semantics: shot.semantics,
              textPreview: shot.textPreview,
              selector: job.selector,
              specimenRoute: job.specimenRoute,
              publish: job.publish,
              alt: [
                job.label,
                job.track,
                job.aspect || job.viewportId,
                job.wonder,
              ].filter(Boolean).join(' — '),
              ms: shot.ms,
            });
            process.stderr.write(`  ${job.track} ${job.id} ${job.aspect || job.viewportId} ${job.flow} ${shot.ms}ms -> ${job.file}\n`);
          } catch (err) {
            errors.push(`${job.id}@${job.viewportId}/${job.aspect || 'qa'} ${job.flow}: ${err.message}`);
          }
        }
      }
    } finally {
      session.close();
      try { await closePageTarget(debugPort, target); } catch { /* ignore */ }
    }

    const manifest = {
      at: new Date().toISOString(),
      kind: 'visual-capture-pack',
      tracks: {
        qa: 'Device-reason viewports and media queries — packing proof',
        social: 'Unique content-fit cards and named feed crops — posting / intrigue',
      },
      base,
      chrome: chromePath,
      format: options.format,
      flows: options.flows,
      viewports: qaViewports.map((v) => ({ id: v.id, width: v.width, height: v.height })),
      aspects: options.aspects,
      summary: plan.summary,
      skipped,
      captures,
      errors,
      counts: {
        captures: captures.length,
        errors: errors.length,
        skipped,
        byTrack: {
          qa: captures.filter((c) => c.track === 'qa').length,
          social: captures.filter((c) => c.track === 'social').length,
        },
      },
    };

    await writeFile(path.join(options.out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(path.join(options.out, 'index.html'), galleryHtml(manifest));
    await writeFile(
      path.join(options.out, 'pipeline.json'),
      `${JSON.stringify({
        kind: 'visual-capture-pipeline-pointer',
        at: manifest.at,
        gallery: 'index.html',
        manifest: 'manifest.json',
        precipitate: 'precipitate.json',
        review: 'review.json',
        capturesDir: 'captures/',
        publishHints: {
          qa: 'device-reason packing, layout QA, agent briefs',
          social: 'unique component cards, feed crops, OG stills',
          ecology: 'seat tropes, leftover wrap, years packing',
        },
      }, null, 2)}\n`,
    );

    const stills = (options.precipitate ? captures : captures.filter((c) => c.track === 'social')).map((c) => ({
      id: c.fixtureId || c.id,
      kind: c.kind,
      track: c.track,
      flow: c.flow,
      aspect: c.aspect || 'fit',
      ratioLabel: c.ratioLabel,
      seat: c.seat,
      file: c.file,
      sha256: c.sha256,
      selector: c.selector,
      wonder: c.wonder,
      prompt: c.prompt || c.wonder,
      prompts: c.prompts,
      sizeReason: c.sizeReason,
      sizeToken: c.sizeToken,
      synergy: c.synergy,
      alt: c.alt,
    }));
    await writeFile(
      path.join(options.out, 'precipitate.json'),
      `${JSON.stringify({
        kind: 'visual-precipitate',
        at: manifest.at,
        format: options.format,
        note: 'Named stills + hashes. Binaries stay in the gitignored pack. Do not commit goldens.',
        stills,
      }, null, 2)}\n`,
    );

    const review = captures
      .filter((c) => c.hint)
      .map((c) => ({
        id: c.fixtureId || c.id,
        track: c.track,
        flow: c.flow,
        viewport: c.viewport,
        aspect: c.aspect,
        sizeReason: c.sizeReason,
        sizeToken: c.sizeToken,
        wrap: c.pretext?.wrap || null,
        widthClass: c.pretext?.widthClass || null,
        hint: c.hint,
        prompt: c.prompt || c.wonder,
        next: 'smallest honest patch, then npm run visual:capture -- --changed --keep',
      }));
    await writeFile(
      path.join(options.out, 'review.json'),
      `${JSON.stringify({
        kind: 'visual-review-loop',
        at: manifest.at,
        loop: ['capture', 'review gallery + hints', 'enhance smallest surface', '--changed recapture', 'precipitate lock'],
        open: review.length,
        items: review,
      }, null, 2)}\n`,
    );

    if (options.json) {
      process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    } else {
      process.stdout.write(
        `[visual:capture] ${captures.length} stills · ${skipped} skipped · ${errors.length} errors · gallery ${path.join(options.out, 'index.html')}\n`,
      );
      if (errors.length) {
        for (const err of errors) process.stderr.write(`  ! ${err}\n`);
      }
    }
    return errors.length ? 1 : 0;
  } catch (error) {
    console.error('[visual:capture] fatal', error);
    return 1;
  } finally {
    shutdown();
    killProcessTree(chromeChild);
    killProcessTree(devChild);
    if (userDataDir) await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

function routeHref(route, base) {
  if (!route) return `${base}/`;
  return route.startsWith('http') ? route : route;
}

main().then((code) => process.exit(code ?? 0));
