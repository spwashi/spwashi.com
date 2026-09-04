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
  shouldSkipJob,
  fingerprintJob,
  socialViewport,
  templateDocumentHtml,
  buildCapturePlan,
  enhancementHint,
  marketingPrompt,
  intelligencePrompts,
  parseSpwCaptureTokens,
  formatCapturePlanSpw,
  estimatePlanCost,
  clipForBox,
  clipSpaceForJob,
  isMissedSpecimen,
  assessCaptureOccupancy,
  assessViewportSubject,
  isBlankStill,
  isStarvedClip,
  formatCaptureExpression,
  errorFile,
  captureSearchParams,
  CAPTURE_MEASURE,
  REVIEW_CHAPTERS,
  CAPTURE_FAILURE_KINDS,
  classifyCaptureFailure,
  reviewChapterFor,
  buildCaptureIndex,
} from './lib/visual-capture-plan.mjs';
import { VIEWPORT_STILL_CHECKS, VIEWPORT_STILL_RECIPES } from './lib/viewport-still-recipes.mjs';
import {
  CAPTURE_PROFILES,
  DEFAULT_WALK_ROUTES,
  applyCaptureProfile,
  captureRunLayout,
  resolveCaptureProfile,
  walkFileName,
  writeRunPointer,
  writeRunsIndex,
} from './lib/capture-profiles.mjs';
import {
  archiveKeptPack,
  writeArchiveIndex,
  pruneArchivePacks,
  sealWipToCommit,
  isArchiveOnly,
} from './lib/visual-capture-archive.mjs';
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
  screenshotBuffer,
  spawnDevServer,
  waitForHttp,
  evaluateProbe,
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
    prune: false,
    index: false,
    seal: false,
    retain: 12,
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
    stills: false,
    checks: false,
    walk: false,
    walkRoutes: null,
    maxSlices: 8,
    maxNavs: null,
    themeViewport: null,
    retryErrors: null,
    profile: null,
    timeoutMs: 45000,
    viewports: null,
    tokens: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--dry-plan') options.dryPlan = true;
    else if (arg === '--ecology') options.ecology = true;
    else if (arg === '--stills') options.stills = true;
    else if (arg === '--checks') options.checks = true;
    else if (arg === '--walk') options.walk = true;
    else if (arg === '--profile' && argv[i + 1]) options.profile = argv[++i];
    else if (arg.startsWith('--profile=')) options.profile = arg.slice(10);
    else if (arg === '--budget' && argv[i + 1]) options.maxNavs = Number(argv[++i]) || 0;
    else if (arg.startsWith('--budget=')) options.maxNavs = Number(arg.slice(9)) || 0;
    else if (arg === '--retry-errors') options.retryErrors = true;
    else if (arg === '--no-components') options.noComponents = true;
    else if (arg === '--social') options.social = true;
    else if (arg === '--social-only') {
      options.social = true;
      options.socialOnly = true;
    }
    else if (arg === '--precipitate') options.precipitate = true;
    else if (arg === '--changed') options.changed = true;
    else if (arg === '--keep') options.keep = true;
    else if (arg === '--prune') options.prune = true;
    else if (arg === '--index') options.index = true;
    else if (arg === '--seal') options.seal = true;
    else if (arg === '--retain' && argv[i + 1]) options.retain = Number(argv[++i]) || 12;
    else if (arg.startsWith('--retain=')) options.retain = Number(arg.slice(9)) || 12;
    else if (arg === '--quick') options.quick = true;
    else if (arg === '--base' && argv[i + 1]) options.base = argv[++i];
    else if (arg.startsWith('--base=')) options.base = arg.slice(7);
    else if (arg === '--out' && argv[i + 1]) {
      options.out = argv[++i];
      options.outExplicit = true;
    } else if (arg.startsWith('--out=')) {
      options.out = arg.slice(6);
      options.outExplicit = true;
    }
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
    else if (arg === '--fast') {
      options.quick = true;
      options.settleMs = 1500;
    } else if (arg === '--set') {
      options.ecology = true;
      options.format = options.precipitate ? options.format : 'jpeg';
    } else if (!arg.startsWith('-')) {
      options.tokens.push(arg);
    }
  }

  if (options.tokens.length) {
    const knownIds = [
      ...COMPONENT_FIXTURES.map((fixture) => fixture.id),
      ...REGION_ECOLOGY_FIXTURES.map((fixture) => fixture.id),
      ...VIEWPORT_STILL_RECIPES.map((recipe) => recipe.id),
      ...VIEWPORT_STILL_CHECKS.map((recipe) => recipe.id),
    ];
    const parsed = parseSpwCaptureTokens(options.tokens, knownIds);
    if (parsed.seats.length) options.seats = [...new Set([...(options.seats || []), ...parsed.seats])];
    if (parsed.aspects.length) options.aspects = [...new Set([...options.aspects, ...parsed.aspects])];
    if (parsed.viewports.length) options.viewports = [...new Set([...(options.viewports || []), ...parsed.viewports])];
    if (parsed.lenses.length) options.lenses = [...new Set([...options.lenses, ...parsed.lenses])];
    if (parsed.ids.length) options.ids = [...new Set([...(options.ids || []), ...parsed.ids])];
    if (parsed.ecology) options.ecology = true;
    if (parsed.social) options.social = true;
    if (parsed.set) options.ecology = true;
    if (parsed.stills) options.stills = true;
    if (parsed.checks) {
      options.checks = true;
      options.stills = true;
    }
    if (parsed.walk) options.walk = true;
    if (parsed.seats.length && !parsed.ids.length) options.noComponents = true;
    if (options.tokens.includes('explore') || options.tokens.includes('iterate')) {
      options.profile = options.profile || 'explore';
    }
    if (options.tokens.includes('stabilize')) {
      options.profile = options.profile || 'stabilize';
    }
  }

  if (options.profile) {
    const profile = resolveCaptureProfile(options.profile);
    if (!profile) {
      throw new Error(`Unknown capture profile: ${options.profile}. Use ${Object.keys(CAPTURE_PROFILES).join(', ')}`);
    }
    Object.assign(options, applyCaptureProfile(options, profile));
  }
  if (options.checks) options.stills = true;
  if (options.walk) {
    options.walkRoutes = options.walkRoutes || [...DEFAULT_WALK_ROUTES];
    options.noComponents = true;
  }
  const flowsPassed = argv.some((arg) => arg === '--flows' || arg.startsWith('--flows='));
  const iterateProfile = options.profile === 'explore' || options.profile === 'stabilize';
  if ((options.stills || options.walk) && !flowsPassed && !iterateProfile) {
    options.flows = ['page'];
    options.noComponents = true;
  }
  if (iterateProfile && !flowsPassed) {
    options.flows = ['page', 'region', 'component'];
    options.ecology = true;
    options.noComponents = false;
  }

  if (options.quick) {
    options.viewports = options.viewports || ['pocket', 'broadsheet'];
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
  const profileViewports = Boolean(options.profile && CAPTURE_PROFILES[options.profile]?.viewports);
  if (
    options.ecology
    && !options.noComponents
    && !profileViewports
    && !argv.some((arg) => arg === '--viewports' || arg.startsWith('--viewports='))
  ) {
    options.viewports = [...DEFAULT_ECOLOGY_VIEWPORTS];
  }
  return options;
}

function printHelp() {
  console.log(`visual-capture — component + region ecology stills

Tracks:
  qa       Device-reason viewports (pocket / fold / broadsheet)
  social   Unique content-fit prints + named feed crops

Public names (not Storybook stories):
  situation  Component + live copy in a room (region flow)
  print      Manufactured part on the compose.css bed (template flow)
  set        Midjourney-style plate of situations for review / direction

Usage:
  npm run spw:capture:plan -- hook
  npm run spw:capture -- situation set --dry-plan
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
  --stills           Named viewport stills (device frame after scroll/prepare). Default flow is page.
  --checks           Route/env/theme/attention pin stills (deep link, dark, reduced motion).
  --walk             Viewport-tall slices to the bottom of core routes.
  --profile name     explore | stabilize | ambient | walk | checks | survey
  --budget N         Cap specimen navs (explore default 12). Drops lowest-priority combinations.
  --retry-errors     Recapture fixture ids from the latest pack's named misses into a new run.
  --out PATH         Pack root (default design/components/captures). Runs nest as runs/<day>/<profile>/<clock>--<hash>/
  --no-components    Skip component fixtures
  --social           Emit unique/social cards on top of QA
  --social-only      Social cards only (content-fit + named aspects)
  --precipitate      PNG lock + precipitate.json (implies --social)
  --changed          Only jobs whose source files changed (implies --keep)
  --keep             Do not wipe the pack; skip unchanged fingerprints
  --prune            Drop oldest dated archive packs; keep --retain (default 12). Alone: prune without capturing.
  --index            Rebuild archive/index.html from dated stills. No Chrome.
  --seal             Move archive/images/_wip into archive/images/<commit>/. No Chrome.
  --retain N         How many dated packs to keep with --prune
  --dry-plan         Print navigation groups, no Chrome
  --quick            region+component, phone+desktop, jpeg
  --format jpeg|png  Review default jpeg; precipitate forces png
  --settle-ms N      Default 2500
  --json

Clips: region/component use the element's document box (beyond the viewport).
Runs nest as runs/<day>/<profile>/<clock>--<hash>/. Viewport folders use readable names (pocket, pocket--dark-mode).
Walks write home--00000.jpg, home--00844.jpg so slices sort down the page.
JSON stays at pack root. Blanks/misses go in captures/errors/.
Retries keep the clip. Header-only hits are miss--, not specimen stills.
`);
}

function captureQuery(url, job = null) {
  const u = new URL(url);
  if (!u.searchParams.has('interaction')) u.searchParams.set('interaction', 'calm');
  if (!u.searchParams.has('precipitate')) u.searchParams.set('precipitate', 'print');
  if (!u.searchParams.has('capture-mode')) u.searchParams.set('capture-mode', 'screenshot');
  const lens = job?.lens;
  if (lens?.query && lens?.value) u.searchParams.set(lens.query, lens.value);
  const extra = captureSearchParams(job?.conditions || {}, job?.attention || {});
  extra.forEach((value, key) => {
    if (!u.searchParams.has(key)) u.searchParams.set(key, value);
  });
  return u.href;
}

async function emulateCaptureEnvironment(session, conditions = {}) {
  const features = [];
  if (conditions.colorMode === 'dark' || conditions.colorScheme === 'dark') {
    features.push({ name: 'prefers-color-scheme', value: 'dark' });
  } else if (conditions.colorMode === 'light' || conditions.colorScheme === 'light') {
    features.push({ name: 'prefers-color-scheme', value: 'light' });
  }
  if (conditions.reducedMotion === 'reduce' || conditions.reducedMotion === true) {
    features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  }
  if (features.length) {
    try {
      await session.send('Emulation.setEmulatedMedia', { features });
    } catch {
      // optional on older Chrome
    }
  }
  const pack = conditions.themePack || '';
  const mode = conditions.colorMode || '';
  if (!pack && !mode) return;
  try {
    await session.send('Runtime.evaluate', {
      expression: `(() => new Promise((resolve) => {
        const deadline = Date.now() + 1800;
        const wantPack = ${JSON.stringify(pack)};
        const wantMode = ${JSON.stringify(mode)};
        const tick = () => {
          const html = document.documentElement;
          const packOk = !wantPack || html.getAttribute('data-spw-theme-pack') === wantPack;
          const modeOk = !wantMode || html.getAttribute('data-spw-color-mode') === wantMode;
          if ((packOk && modeOk) || Date.now() > deadline) resolve({ packOk, modeOk });
          else requestAnimationFrame(tick);
        };
        tick();
      }))()`,
      awaitPromise: true,
      returnByValue: true,
    }, CAPTURE_MEASURE.evaluateTimeoutMs);
  } catch {
    // theme wait is best-effort
  }
}

function gitChangedFiles() {
  const result = spawnSync('git', ['diff', '--name-only', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) return [];
  return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
}

async function measureSelector(session, selector) {
  const { result, exceptionDetails } = await session.send('Runtime.evaluate', {
    expression: `(async () => {
      const race = (promise, ms) => Promise.race([
        promise,
        new Promise((resolve) => setTimeout(resolve, ms)),
      ]);
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const html = document.documentElement;
      const body = document.body;
      if (html) html.setAttribute('data-spw-capture-mode', 'screenshot');
      if (body) body.setAttribute('data-spw-capture-mode', 'screenshot');
      try { el.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' }); }
      catch { el.scrollIntoView(true); }
      if (document.fonts && document.fonts.ready) {
        try { await race(document.fonts.ready, ${CAPTURE_MEASURE.fontWaitMs}); } catch { /* ignore font errors */ }
      }
      const pendingImages = Array.from(el.querySelectorAll('img')).filter((img) => !img.complete);
      if (pendingImages.length) {
        await race(Promise.allSettled(pendingImages.map((img) => img.decode ? img.decode() : new Promise((res) => { img.onload = img.onerror = res; }))), ${CAPTURE_MEASURE.imageWaitMs});
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const r = el.getBoundingClientRect();
      const ds = el.dataset || {};
      const text = (el.innerText || '').trim();
      let composition = null;
      let pretext = null;
      let measurementError = null;

      try {
        const compositionUrl = new URL('/public/js/runtime/composition-box-model.js', document.baseURI).href;
        const pretextUrl = new URL('/public/js/semantic/pretext-measurement-bus.js', document.baseURI).href;
        const [boxModule, pretextModule] = await race(Promise.all([
          import(compositionUrl),
          import(pretextUrl),
        ]), ${CAPTURE_MEASURE.importWaitMs});
        if (!boxModule || !pretextModule) {
          throw new Error('measurement modules timed out');
        }
        const boxSnapshot = boxModule.snapshotCompositionBox(el, { root: document });
        if (boxSnapshot) {
          composition = {
            role: boxSnapshot.role,
            presence: boxSnapshot.presence,
            measure: boxSnapshot.measure,
            sizeContext: boxSnapshot.sizeContext,
            contentTone: boxSnapshot.contentTone,
            settlePhase: boxSnapshot.settlePhase,
            flow: boxSnapshot.flow,
            box: boxSnapshot.box,
            packLocal: boxSnapshot.packLocal,
            packLayout: boxSnapshot.packLayout,
            packFill: boxSnapshot.packFill,
            story: boxSnapshot.story,
            semantics: boxSnapshot.semantics,
          };
        }

        const signals = pretextModule.readPretextSignals(el);
        if (signals?.host) {
          pretext = {
            kind: signals.kind || null,
            density: signals.density || null,
            measure: signals.measure || null,
            projection: signals.projection || null,
            ornament: signals.ornament || null,
            wrap: signals.wrap || null,
            widthClass: signals.widthClass || null,
            mode: signals.mode || null,
            preset: signals.preset || null,
            canonicalWidth: signals.canonicalWidth || null,
            projectedWidth: signals.projectedWidth || null,
            lineCount: signals.lineCount || null,
            projectedLineCount: signals.projectedLineCount || null,
            heightPx: signals.heightPx || null,
            measureKind: signals.measureKind,
            source: signals.source,
          };

          if (!signals.lineCount) {
            const hostRect = signals.host.getBoundingClientRect();
            const hostStyle = getComputedStyle(signals.host);
            const padding = (Number.parseFloat(hostStyle.paddingLeft) || 0)
              + (Number.parseFloat(hostStyle.paddingRight) || 0);
            const width = Math.max(40, hostRect.width - padding);
            const measured = await pretextModule.measureTextLayout({
              text: (signals.host.innerText || '').trim(),
              width,
            });
            pretext = {
              ...pretext,
              lineCount: measured.lineCount,
              projectedLineCount: measured.compareLineCount,
              heightPx: measured.height,
              widthPx: measured.width,
              compareWidthPx: measured.compareWidth,
              wrap: measured.wrap,
              measureKind: measured.measureKind,
              source: 'visual-capture-pretext',
            };
          }
        }
      } catch (error) {
        // Capture still proceeds; module-derived evidence is an enhancement.
        measurementError = String(error?.message || error || 'measurement module unavailable');
      }

      return {
        found: true,
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        viewportX: r.left,
        viewportY: r.top,
        width: r.width,
        height: r.height,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        inView: r.bottom > 0 && r.top < (window.innerHeight || 1),
        semantics: {
          kind: ds.spwKind || el.getAttribute('data-spw-kind') || composition?.semantics?.kind || null,
          role: ds.spwRole || el.getAttribute('data-spw-role') || composition?.semantics?.role || composition?.role || null,
          region: ds.spwRegion || el.getAttribute('data-spw-region') || null,
          cluster: ds.spwCluster || el.getAttribute('data-spw-cluster') || null,
          feature: ds.spwFeature || el.getAttribute('data-spw-feature') || null,
          operator: ds.spwOperator || el.getAttribute('data-spw-operator') || null,
        },
        componentExpression: ds.spwSemanticExpression || el.getAttribute('data-spw-semantic-expression') || null,
        composition,
        pretext,
        measurementError,
        area: Math.round(r.width * r.height),
        childCount: el.childElementCount,
        mediaCount: el.querySelectorAll('img, picture, video, canvas, svg').length,
        interactiveCount: el.querySelectorAll('a[href], button, input, select, textarea, [role="button"]').length,
        textLength: text.length,
        text: text.slice(0, 240),
      };
    })()`,
    returnByValue: true,
    awaitPromise: true,
  }, CAPTURE_MEASURE.evaluateTimeoutMs);
  if (exceptionDetails) throw new Error(exceptionDetails.text || 'measureSelector failed');
  return result?.value || null;
}

function galleryHtml(manifest) {
  const cards = (manifest.captures || []).map((c) => `
    <figure class="card" data-flow="${c.flow}" data-track="${c.track || 'qa'}" data-aspect="${c.aspect || 'qa'}" data-chapter="${c.chapter || ''}" data-fixture="${c.fixtureId || c.id || ''}">
      <img src="${c.file}" alt="${c.alt || ''}" loading="lazy" width="${c.clip?.width || ''}" height="${c.clip?.height || ''}"/>
      <figcaption>
        <strong>${c.fixtureId || c.id}</strong> · ${c.chapter || 'page'} · ${c.track || 'qa'} · ${c.flow} · ${c.aspect || c.viewport || ''}
        <br/><span class="meta">${c.wonder || c.label || ''}</span>
        ${c.ratioLabel ? `<br/><code>${c.ratioLabel}</code>` : ''}
        ${c.clip?.coordinateSpace ? `<br/><code>${c.clip.coordinateSpace} ${Math.round(c.clip.x)},${Math.round(c.clip.y)} ${Math.round(c.clip.width)}×${Math.round(c.clip.height)}</code>` : ''}
        ${c.media ? `<br/><code>${c.media}</code>` : ''}
        ${c.captureExpression ? `<br/><code>${c.captureExpression}</code>` : ''}
        ${c.captureOccupancy?.occupancy ? `<br/><span class="meta">occupancy: ${c.captureOccupancy.occupancy}${c.captureOccupancy.reason ? ` · ${c.captureOccupancy.reason}` : ''}</span>` : ''}
        ${c.textPreview ? `<br/><span class="meta">${String(c.textPreview).replace(/</g, '&lt;').slice(0, 160)}</span>` : ''}
      </figcaption>
    </figure>`).join('\n');

  const errorCards = (manifest.errorArtifacts || []).map((e) => {
    const isImage = /\.(png|jpe?g|webp)$/i.test(e.file || '');
    const media = isImage
      ? `<img src="${e.file}" alt="${e.kind} ${e.id || ''}" loading="lazy"/>`
      : `<pre>${String(e.message || e.kind).replace(/</g, '&lt;')}</pre>`;
    return `
    <figure class="card card--error" data-error="${e.kind}">
      ${media}
      <figcaption>
        <strong>${e.kind}</strong> · ${e.id || ''} · ${e.viewport || ''} · ${e.flow || ''}
        <br/><code>${e.file}</code>
        ${e.twin ? `<br/><span class="meta">twin of ${e.twin}</span>` : ''}
      </figcaption>
    </figure>`;
  }).join('\n');

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
    .card img { display: block; width: 100%; max-height: 14rem; height: auto; object-fit: contain; background: #eee; }
    .card--error { border-color: #c47a3a; }
    .card--error pre { margin: 0; padding: 0.75rem; font-size: 0.75rem; white-space: pre-wrap; background: #f3ece3; }
    figcaption { padding: 0.65rem 0.75rem 0.85rem; font-size: 0.82rem; line-height: 1.35; }
    code { font-size: 0.75rem; color: #444; }
    .errors { margin-top: 2rem; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0 1rem; }
    .filters button { border: 1px solid #ccc; background: #fff; border-radius: 999px; padding: 0.25rem 0.7rem; cursor: pointer; }
    .filters button[aria-pressed="true"] { background: #1a9999; color: #fff; border-color: #1a9999; }
  </style>
</head>
<body>
  <header>
    <h1>Visual capture pack</h1>
    <p class="meta">Generated ${manifest.at || ''} · ${manifest.captures?.length || 0} stills · ${manifest.errors?.length || 0} named misses · chapters ${REVIEW_CHAPTERS.join(' → ')}</p>
    <p class="meta">Walk the review arc, then recapture misses with <code>npm run visual:stabilize</code>. Theme checks stay pocket unless a profile widens them. Pixels stay gitignored.</p>
    <p class="meta"><a href="${manifest.archiveIndex || 'archive/index.html'}">Archive skim</a> · <a href="index.json">index.json</a> — stills cluster as <code>captures/&lt;viewport&gt;/NN-id.jpg</code>. Blanks, misses, and gone tabs live in <code>captures/errors/</code>.</p>
    <div class="filters" role="group" aria-label="Filter stills">
      <button type="button" data-filter="all" aria-pressed="true">all</button>
      ${REVIEW_CHAPTERS.map((chapter) => `<button type="button" data-filter="${chapter}">${chapter}</button>`).join('\n      ')}
      <button type="button" data-filter="qa">qa</button>
      <button type="button" data-filter="region">region</button>
      <button type="button" data-filter="component">component</button>
    </div>
  </header>
  <div class="grid" id="grid">${cards || '<p class="meta">No stills in this pack.</p>'}</div>
  ${errorCards ? `<section class="errors"><h2>Errors</h2><p class="meta">Named glitches: ${CAPTURE_FAILURE_KINDS.join(', ')}. Recapture with <code>npm run visual:stabilize</code>.</p><div class="grid">${errorCards}</div></section>` : ''}
  <script>
    document.querySelectorAll('.filters button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filters button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        const f = btn.dataset.filter;
        document.querySelectorAll('.card').forEach((card) => {
          if (card.dataset.error) {
            card.hidden = f !== 'all' && card.dataset.error !== f;
            return;
          }
          card.hidden = f !== 'all'
            && card.dataset.chapter !== f
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

function errorArtifactRel(kind, job, ext = null) {
  const rel = errorFile(kind, job);
  if (!ext) return rel;
  const suffix = ext.startsWith('.') ? ext : `.${ext}`;
  return rel.replace(/\.[^.]+$/, suffix);
}

async function writeErrorArtifact(outDir, kind, job, { buffer, message, twin } = {}) {
  const rel = buffer ? errorArtifactRel(kind, job) : errorArtifactRel(kind, job, '.txt');
  const abs = path.join(outDir, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  if (buffer) await writeFile(abs, buffer);
  else {
    await writeFile(
      abs,
      [`${kind}`, `${job.id} ${job.viewportId} ${job.flow}`, message || '', twin ? `twin ${twin}` : '']
        .filter(Boolean)
        .join('\n') + '\n',
      'utf8',
    );
  }
  return {
    kind,
    file: rel,
    message: message || kind,
    twin: twin || null,
    id: job.id,
    fixtureId: job.fixtureId,
    viewport: job.viewportId,
    flow: job.flow,
  };
}

async function loadLatestErrorIds(packRoot) {
  try {
    const latest = JSON.parse(await readFile(path.join(packRoot, 'runs', 'latest.json'), 'utf8'));
    const manifestPath = path.join(packRoot, latest.path, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    return [...new Set(
      (manifest.errorArtifacts || [])
        .map((artifact) => artifact.fixtureId || artifact.id)
        .filter(Boolean),
    )];
  } catch {
    return [];
  }
}

async function readPriorManifest(outDir) {
  try {
    return JSON.parse(await readFile(path.join(outDir, 'manifest.json'), 'utf8'));
  } catch {
    return null;
  }
}

async function existingCaptureFiles(outDir) {
  const files = new Set();
  async function walk(dir, prefix) {
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(path.join(dir, entry.name), rel);
        continue;
      }
      files.add(`captures/${rel}`);
    }
  }
  await walk(path.join(outDir, 'captures'), '');
  return files;
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
  let frameId = null;
  try {
    const navigation = await session.send('Page.navigate', { url: `${base}/design/components/` }, 8000);
    frameId = navigation?.frameId || null;
  } catch {
    // Continue with the current frame; setDocumentContent still provides the bed.
  }
  if (!frameId) {
    const { frameTree } = await session.send('Page.getFrameTree');
    frameId = frameTree?.frame?.id || null;
  }
  if (!frameId) throw new Error('No main frame id for card document');
  await session.send('Page.setDocumentContent', { frameId, html });
  await new Promise((r) => setTimeout(r, 500));
}

function resolveJobViewport(job, qaViewports) {
  if (job.canvas === 'card') return socialViewport(job.aspect || 'fit');
  return qaViewports.find((viewport) => viewport.id === job.viewportId)
    || { id: job.viewportId, width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, hasTouch: false };
}

async function readPageExtent(session) {
  return evaluateProbe(session, `(() => ({
    scrollY: Math.round(window.scrollY),
    innerHeight: window.innerHeight || 1,
    scrollHeight: Math.max(
      document.documentElement.scrollHeight || 0,
      document.body?.scrollHeight || 0,
    ),
  }))()`, CAPTURE_MEASURE.evaluateTimeoutMs);
}

async function scrollPageTo(session, y) {
  return evaluateProbe(session, `(async () => {
    window.scrollTo(0, ${Number(y) || 0});
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return Math.round(window.scrollY);
  })()`, CAPTURE_MEASURE.evaluateTimeoutMs);
}

async function capturePageWalk(session, job, { viewport, format, quality }) {
  const ext = format === 'jpeg' ? 'jpg' : format;
  const cluster = String(job.file || '').replace(/^captures\//, '').split('/').slice(0, -1).join('/') || (job.viewportId || 'pocket');
  const maxSlices = Math.max(1, Number(job.maxSlices) || 8);
  const slices = [];
  const pinCaptureMode = `(() => {
    document.documentElement.setAttribute('data-spw-capture-mode', 'screenshot');
    document.body?.setAttribute('data-spw-capture-mode', 'screenshot');
  })()`;
  await evaluateProbe(session, pinCaptureMode);
  let extent = await readPageExtent(session);
  const lastY = Math.max(0, extent.scrollHeight - extent.innerHeight);
  let y = 0;
  for (let index = 0; index < maxSlices; index += 1) {
    await evaluateProbe(session, pinCaptureMode);
    await scrollPageTo(session, y);
    const buffer = await screenshotBuffer(session, { format, quality });
    const file = `captures/${cluster}/${walkFileName(job.specimenRoute, y, ext)}`;
    slices.push({
      buffer,
      file,
      y,
      scrollHeight: extent.scrollHeight,
      innerHeight: extent.innerHeight,
    });
    if (y >= lastY - 24) break;
    y = Math.min(lastY, y + extent.innerHeight);
    extent = await readPageExtent(session);
  }
  return slices;
}

async function applyCapturePrepare(session, job) {
  const prepare = job?.prepare;
  const attention = job?.attention || {};
  const close = Array.isArray(prepare?.close) ? prepare.close : (prepare?.close ? [prepare.close] : []);
  const open = Array.isArray(prepare?.open) ? prepare.open : (prepare?.open ? [prepare.open] : []);
  const needsPrepare = close.length || open.length || attention.section || attention.probe;
  await evaluateProbe(session, `(async () => {
    const html = document.documentElement;
    if (html) html.setAttribute('data-spw-capture-mode', 'screenshot');
    document.body?.setAttribute('data-spw-capture-mode', 'screenshot');
    if (!${needsPrepare ? 'true' : 'false'}) return true;
    for (const sel of ${JSON.stringify(close)}) {
      document.querySelectorAll(sel).forEach((el) => { if ('open' in el) el.open = false; });
    }
    for (const sel of ${JSON.stringify(open)}) {
      document.querySelectorAll(sel).forEach((el) => { if ('open' in el) el.open = true; });
    }
    const pins = {
      section: ${JSON.stringify(attention.section || '')},
      probe: ${JSON.stringify(attention.probe || '')},
    };
    try {
      const mod = await import('/public/js/runtime/attention/capture-pins.js');
      mod.applyAttentionCapturePins(document, pins);
    } catch {
      if (pins.section) {
        const node = document.getElementById(pins.section);
        if (node) {
          node.setAttribute('data-spw-region-mark', 'capture');
          html.setAttribute('data-spw-page-section-current', pins.section);
        }
      }
      if (pins.probe) html.setAttribute('data-spw-resonance-probe', pins.probe);
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return true;
  })()`, CAPTURE_MEASURE.evaluateTimeoutMs);
}

function isTargetGoneError(error) {
  const message = String(error?.message || error || '');
  return /navigated or closed|session closed|websocket|timeout: Runtime\.evaluate/i.test(message);
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
  } else {
    await applyCapturePrepare(session, job);
    if (job.selector) {
      box = await measureSelector(session, job.selector);
      if (!box || box.width < 2 || box.height < 2) {
        throw new Error(`selector-miss: ${job.selector} not found or empty`);
      }
      const occupancy = assessCaptureOccupancy(job, box);
      if (isStarvedClip(job, box, occupancy)) {
        throw new Error(`selector-miss: ${job.selector} starved clip ${Math.round(box.width)}×${Math.round(box.height)}`);
      }
    }
  }

  const padding = job.flow === 'region' ? 20 : job.canvas === 'card' ? 16 : 12;
  let clip = null;
  let buffer;
  const deviceFrame = job.still || job.flow === 'page' || !box;
  if (deviceFrame) {
    buffer = await screenshotBuffer(session, { format, quality });
  } else {
    const space = clipSpaceForJob(job) || 'document';
    clip = clipForBox(box, viewport, padding, job.aspect || 'fit', { space });
    buffer = await screenshotBuffer(session, { format, quality, clip });
  }
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  const snapshot = { ...(box?.pretext || {}), ...(box || {}) };
  const captureOccupancy = assessCaptureOccupancy(job, snapshot);
  const subjectFit = assessViewportSubject(job, snapshot, viewport);
  return {
    buffer,
    clip,
    box,
    sha256,
    ms: Math.round(performance.now() - started),
    ratioLabel: clip?.ratioLabel || (box ? `${Math.round((box.width / box.height) * 100) / 100}` : null),
    semantics: box?.semantics || null,
    componentExpression: box?.componentExpression || null,
    composition: box?.composition || null,
    pretext: box?.pretext || null,
    measurementError: box?.measurementError || null,
    captureOccupancy,
    subjectFit,
    captureExpression: formatCaptureExpression(job, {
      ...snapshot,
      occupancy: captureOccupancy.occupancy,
      semantics: box?.semantics || null,
    }),
    hint: enhancementHint(job, snapshot) || subjectFit.hint,
    prompt: marketingPrompt(job, snapshot),
    prompts: intelligencePrompts(job, snapshot),
    textPreview: box?.text || null,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (isArchiveOnly(options)) {
    if (options.seal) {
      const sealed = await sealWipToCommit(options.out);
      process.stdout.write(
        `[visual:seal] ${sealed.sealed} file${sealed.sealed === 1 ? '' : 's'} → ${sealed.cluster || 'nothing'}\n`,
      );
    }
    if (options.prune) {
      const dropped = await pruneArchivePacks(options.out, options.retain);
      process.stdout.write(
        `[visual:prune] dropped ${dropped.length} cluster${dropped.length === 1 ? '' : 's'} · retain ${options.retain}\n`,
      );
    }
    await writeArchiveIndex(options.out);
    process.stdout.write(`[visual:archive] skim ${path.join(options.out, 'archive', 'index.html')}\n`);
    return 0;
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

  const packRoot = options.out;
  let runLayout = null;
  if (!options.outExplicit && (options.stills || options.walk || options.profile)) {
    const profileName = options.profile
      || (options.walk && options.checks ? 'survey'
        : options.walk ? 'walk'
          : options.checks ? 'checks'
            : 'ambient');
    runLayout = captureRunLayout(packRoot, {
      profile: profileName,
      params: {
        viewports: options.viewports,
        stills: options.stills,
        checks: options.checks,
        walk: options.walk,
        routes: options.walkRoutes,
      },
    });
    options.out = runLayout.dir;
    process.stderr.write(`[visual:capture] run ${runLayout.rel}\n`);
  }

  if (options.retryErrors) {
    const retryIds = await loadLatestErrorIds(packRoot);
    if (!retryIds.length) {
      process.stderr.write('[visual:capture] no named misses in the latest pack\n');
      return 0;
    }
    options.ids = options.ids?.length
      ? options.ids.filter((id) => retryIds.includes(id))
      : retryIds;
    process.stderr.write(`[visual:capture] retry ${options.ids.join(', ')}\n`);
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
    maxNavs: options.maxNavs || 0,
    themeViewport: options.themeViewport || null,
    seats: options.seats,
    includeComponents: !options.noComponents,
    includeEcology: options.ecology,
    includeSocial: options.social || options.precipitate,
    includeQa: !options.socialOnly,
    includeStills: options.stills,
    includeChecks: options.checks,
    includeWalk: options.walk,
    walkRoutes: options.walkRoutes || DEFAULT_WALK_ROUTES,
    maxSlices: options.maxSlices || 8,
    stillRecipes: VIEWPORT_STILL_RECIPES,
    format: options.format,
    changedFiles,
    lenses: options.lenses,
  });

  if (!plan.jobs.length) throw new Error('No capture jobs selected');

  const cost = estimatePlanCost(plan.jobs);
  process.stderr.write(
    `[visual:capture] ${plan.summary.jobs} jobs · ${cost.learn}\n`,
  );

  if (options.dryPlan) {
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ run: runLayout, summary: plan.summary, cost, jobs: plan.jobs }, null, 2)}\n`);
    } else {
      if (runLayout) process.stdout.write(`run = \`${runLayout.rel}\`\n`);
      process.stdout.write(formatCapturePlanSpw(plan, { cost }));
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
  const errorArtifacts = [];
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
    let target = await newPageTarget(debugPort);
    let session = new CdpSession(target.webSocketDebuggerUrl);
    await session.open();

    async function recoverPage(reason = 'target closed') {
      process.stderr.write(`  ~ ${reason}, new page target\n`);
      try { session.close(); } catch { /* ignore */ }
      try { await closePageTarget(debugPort, target); } catch { /* ignore */ }
      target = await newPageTarget(debugPort);
      session = new CdpSession(target.webSocketDebuggerUrl);
      await session.open();
    }

    try {
      const runnableSet = new Set(runnable);
      const groups = plan.groups.map((group) => ({
        ...group,
        jobs: group.jobs.filter((job) => runnableSet.has(job)),
      })).filter((group) => group.jobs.length);

      for (const group of groups) {
        const viewport = resolveJobViewport(group.jobs[0], qaViewports);
        if (group.canvas === 'specimen') {
          const specimenUrl = captureQuery(new URL(routeHref(group.route, base), `${base}/`).href, group.jobs[0]);
          process.stderr.write(`[visual:capture] nav ${group.key}\n`);
          await navigateAndProbe(session, {
            url: specimenUrl,
            viewport,
            settleMs: options.settleMs,
            timeoutMs: options.timeoutMs,
            retries: 1,
            partialGraceMs: 2000,
          });
          await emulateCaptureEnvironment(session, group.jobs[0]?.conditions || {});
        }

        for (const job of group.jobs) {
          const jobViewport = resolveJobViewport(job, qaViewports);
          try {
            if (job.walk) {
              try {
                await applyCapturePrepare(session, job);
              } catch {
                // walk still proceeds
              }
              const slices = await capturePageWalk(session, job, {
                viewport: jobViewport,
                format: options.format,
                quality: options.quality,
              });
              for (const slice of slices) {
                const abs = path.join(options.out, slice.file);
                if (isBlankStill(slice.buffer, job, null)) {
                  const artifact = await writeErrorArtifact(options.out, 'blank', { ...job, file: slice.file }, {
                    buffer: slice.buffer,
                    message: `Blank: ${slice.file} (${slice.buffer.length}B)`,
                  });
                  errorArtifacts.push(artifact);
                  errors.push(artifact.message);
                  process.stderr.write(`  ! blank ${artifact.file} (${slice.buffer.length}B)\n`);
                  continue;
                }
                await mkdir(path.dirname(abs), { recursive: true });
                await writeFile(abs, slice.buffer);
                captures.push({
                  id: `${job.id}--${String(slice.y).padStart(5, '0')}`,
                  fixtureId: job.fixtureId,
                  label: job.label,
                  kind: job.kind,
                  track: job.track,
                  flow: job.flow,
                  walk: true,
                  viewport: job.viewportId,
                  file: slice.file,
                  scrollY: slice.y,
                });
                process.stderr.write(`  ${job.track} ${job.id} y=${slice.y} ${job.viewportId} -> ${slice.file}\n`);
              }
              continue;
            }
            let shot;
            try {
              shot = await captureJob(session, job, {
                base,
                viewport: jobViewport,
                format: options.format,
                quality: options.quality,
                snippetCache,
              });
            } catch (firstErr) {
              if (!isTargetGoneError(firstErr) || group.canvas !== 'specimen') throw firstErr;
              await recoverPage('target closed');
              const specimenUrl = captureQuery(new URL(routeHref(group.route, base), `${base}/`).href, job);
              await navigateAndProbe(session, {
                url: specimenUrl,
                viewport: jobViewport,
                settleMs: Math.min(options.settleMs, 1800),
                timeoutMs: options.timeoutMs,
                retries: 1,
                partialGraceMs: 1200,
              });
              await emulateCaptureEnvironment(session, job.conditions || {});
              shot = await captureJob(session, job, {
                base,
                viewport: jobViewport,
                format: options.format,
                quality: options.quality,
                snippetCache,
              });
            }
            const abs = path.join(options.out, job.file);
            if (isBlankStill(shot.buffer, job, shot.clip)) {
              const artifact = await writeErrorArtifact(options.out, 'blank', job, {
                buffer: shot.buffer,
                message: `Blank: ${job.file} (${shot.buffer.length}B)`,
              });
              errorArtifacts.push(artifact);
              errors.push(artifact.message);
              process.stderr.write(`  ! blank ${artifact.file} (${shot.buffer.length}B)\n`);
              continue;
            }
            if (isMissedSpecimen(job, shot.box)) {
              const artifact = await writeErrorArtifact(options.out, 'miss', job, {
                buffer: shot.buffer,
                message: `Miss: ${job.file} clipped shell chrome instead of ${job.selector}`,
              });
              errorArtifacts.push(artifact);
              errors.push(artifact.message);
              process.stderr.write(`  ! miss ${artifact.file}\n`);
              continue;
            }
            await mkdir(path.dirname(abs), { recursive: true });
            await writeFile(abs, shot.buffer);
            if (captureHashes.has(shot.sha256)) {
              const twin = captureHashes.get(shot.sha256);
              const artifact = await writeErrorArtifact(options.out, 'collision', job, {
                buffer: shot.buffer,
                message: `Collision: ${job.file} identical to ${twin}`,
                twin,
              });
              errorArtifacts.push(artifact);
              errors.push(artifact.message);
              process.stderr.write(`  ! collision ${artifact.file} twin of ${twin}\n`);
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
              measurementError: shot.measurementError,
              composition: shot.composition,
              captureOccupancy: shot.captureOccupancy,
              subjectFit: shot.subjectFit || null,
              still: Boolean(job.still),
              chapter: job.chapter || reviewChapterFor(job),
              captureExpression: shot.captureExpression,
              componentExpression: shot.componentExpression,
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
            const kind = classifyCaptureFailure(err, job);
            const artifact = await writeErrorArtifact(options.out, kind, job, {
              message: `${job.id}@${job.viewportId}/${job.aspect || 'qa'} ${job.flow}: ${err.message}`,
            });
            errorArtifacts.push(artifact);
            errors.push(artifact.message);
            process.stderr.write(`  ! ${kind} ${artifact.file}\n`);
            if (kind === 'gone' && group.canvas === 'specimen') {
              const remaining = group.jobs.slice(group.jobs.indexOf(job) + 1);
              for (const skippedJob of remaining) {
                const skip = await writeErrorArtifact(options.out, 'gone', skippedJob, {
                  message: `${skippedJob.id}@${skippedJob.viewportId} skipped after closed tab`,
                });
                errorArtifacts.push(skip);
                errors.push(skip.message);
                process.stderr.write(`  ! gone ${skip.file}\n`);
              }
              try { await recoverPage('group abandoned'); } catch { /* ignore */ }
              break;
            }
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
      run: runLayout,
      profile: options.profile || runLayout?.profile || null,
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
      errorArtifacts,
      counts: {
        captures: captures.length,
        errors: errorArtifacts.length,
        skipped,
        byTrack: {
          qa: captures.filter((c) => c.track === 'qa').length,
          social: captures.filter((c) => c.track === 'social').length,
        },
      },
    };

    const captureIndex = buildCaptureIndex({ captures, errorArtifacts });
    manifest.index = captureIndex;
    await mkdir(options.out, { recursive: true });
    await writeFile(path.join(options.out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(path.join(options.out, 'index.json'), `${JSON.stringify(captureIndex, null, 2)}\n`);
    await writeFile(path.join(options.out, 'index.html'), galleryHtml(manifest));
    if (runLayout) {
      await writeFile(
        path.join(options.out, 'profile.json'),
        `${JSON.stringify({
          profile: runLayout.profile,
          runId: runLayout.runId,
          day: runLayout.day,
          stills: options.stills,
          checks: options.checks,
          walk: options.walk,
          routes: options.walkRoutes || null,
          viewports: options.viewports,
        }, null, 2)}\n`,
      );
      await writeRunPointer(packRoot, runLayout, {
        at: manifest.at,
        stills: captures.length,
        errors: errorArtifacts.length,
      });
      await writeRunsIndex(packRoot);
    } else {
      const archiveStamp = await archiveKeptPack(options.out, manifest, captures, errorArtifacts);
      if (archiveStamp) {
        process.stderr.write(`[visual:capture] archived archive/${archiveStamp}\n`);
      }
    }
    if (options.prune) {
      const dropped = await pruneArchivePacks(options.out, options.retain);
      if (dropped.length) {
        process.stderr.write(`[visual:capture] pruned ${dropped.length} older archive pack${dropped.length === 1 ? '' : 's'}\n`);
      }
    }
    await writeFile(
      path.join(options.out, 'pipeline.json'),
      `${JSON.stringify({
        kind: 'visual-capture-pipeline-pointer',
        at: manifest.at,
        gallery: 'index.html',
        archive: 'archive/',
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
      expression: c.captureExpression,
      componentExpression: c.componentExpression,
      semantics: c.semantics,
      composition: c.composition,
      pretext: c.pretext,
      measurementError: c.measurementError,
      occupancy: c.captureOccupancy,
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
        occupancy: c.captureOccupancy?.occupancy || null,
        occupancyReason: c.captureOccupancy?.reason || null,
        expression: c.captureExpression,
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
