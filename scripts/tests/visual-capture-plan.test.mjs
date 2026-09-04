import assert from 'node:assert/strict';
import test from 'node:test';

import { COMPONENT_FIXTURES } from '../../public/js/kernel/component-fixtures.js';
import { REGION_ECOLOGY_FIXTURES } from '../../public/js/kernel/region-ecology-fixtures.js';
import {
  DEVICE_REASONS,
  DEFAULT_QA_VIEWPORTS,
  DEFAULT_ECOLOGY_VIEWPORTS,
  LAYOUT_STACK,
  SOCIAL_ASPECTS,
  SIZE_TOKENS,
  buildCapturePlan,
  cropToAspect,
  enhancementHint,
  marketingPrompt,
  groupJobsByNavigation,
  sizeReasonFor,
  sizeTokenFor,
  templateDocumentHtml,
  viewportMatchesScenario,
  VISIBILITY_LENSES,
  applyVisibilityLenses,
  intelligencePrompt,
  componentSearchEntries,
  INTELLIGENCE_BANDS,
  ASSET_KINDS,
  parseSpwCaptureTokens,
  estimatePlanCost,
  assetKindFor,
  formatCapturePlanSpw,
  clipForBox,
  clipSpaceForJob,
  looksLikeShellChrome,
  isMissedSpecimen,
  assessCaptureOccupancy,
  assessViewportSubject,
  isBlankStill,
  isStarvedClip,
  formatCaptureExpression,
  buildViewportStillJobs,
  errorFile,
  browseCluster,
  captureSearchParams,
  specimenNavigationKey,
  CAPTURE_MEASURE,
  REVIEW_CHAPTERS,
  reviewChapterFor,
  prioritizeCaptureJobs,
  classifyCaptureFailure,
  buildCaptureIndex,
  capturePriorityScore,
} from '../lib/visual-capture-plan.mjs';
import { VIEWPORT_STILL_CHECKS, VIEWPORT_STILL_RECIPES } from '../lib/viewport-still-recipes.mjs';
import { archiveImageRel } from '../lib/visual-capture-archive.mjs';
import { VIEWPORTS } from '../lib/chrome-headless-harness.mjs';
import {
  CAPTURE_PROFILES,
  applyCaptureProfile,
  captureRunLayout,
  formatCaptureRunId,
  walkFileName,
} from '../lib/capture-profiles.mjs';

const phone = VIEWPORTS.phone;
const desktop = VIEWPORTS.desktop;
const fold = VIEWPORTS.fold;

test('device reasons carry media queries for QA', () => {
  assert.match(DEVICE_REASONS.pocket.media, /max-width: 45rem/);
  assert.match(DEVICE_REASONS.fold.media, /max-aspect-ratio: 4\/3/);
  assert.match(DEVICE_REASONS.phablet.media, /min-width: 26.25rem/);
  assert.equal(VIEWPORTS.pocket.width, VIEWPORTS.phone.width);
  assert.equal(VIEWPORTS.fold.width, VIEWPORTS.tablet.width);
  assert.equal(VIEWPORTS.broadsheet.width, VIEWPORTS.desktop.width);
  assert.equal(VIEWPORTS.phablet.width, DEVICE_REASONS.phablet.width);
  assert.deepEqual(DEFAULT_QA_VIEWPORTS, ['pocket', 'fold', 'broadsheet']);
  assert.deepEqual(DEFAULT_ECOLOGY_VIEWPORTS, ['pocket', 'fold', 'broadsheet']);
  assert.deepEqual([...LAYOUT_STACK], ['posture', 'seat', 'pack', 'gravity', 'resonance', 'still']);
});

test('grouped specimen navs collapse shared route+viewport', () => {
  const { groups, summary } = buildCapturePlan({
    componentFixtures: COMPONENT_FIXTURES,
    flows: ['region', 'component'],
    viewports: [phone, desktop],
    includeComponents: true,
  });
  const specimen = groups.filter((group) => group.canvas === 'specimen');
  assert.ok(specimen.length < summary.jobs, 'grouping must cut navigations');
  assert.equal(new Set(specimen.map((group) => group.key)).size, specimen.length);
});

test('ecology seats use pocket/fold/desktop and named seats', () => {
  const { jobs, summary } = buildCapturePlan({
    ecologyFixtures: REGION_ECOLOGY_FIXTURES,
    viewports: [VIEWPORTS.pocket, fold, desktop],
    includeComponents: false,
    includeEcology: true,
  });
  assert.equal(summary.byKind.ecology, jobs.length);
  assert.ok(jobs.every((job) => job.flow === 'region'));
  assert.ok(jobs.some((job) => job.id === 'about-years' && job.viewportId === 'fold'));
  assert.ok(jobs.some((job) => job.seat === 'cluster' && job.id === 'about-systems-desk'));
});

test('social content-fit and named crops are separate size reasons', () => {
  const { jobs } = buildCapturePlan({
    componentFixtures: COMPONENT_FIXTURES,
    includeQa: false,
    includeSocial: true,
    aspects: ['fit', 'square', 'portrait'],
    ids: ['frame-card'],
  });
  const fit = jobs.find((job) => job.aspect === 'fit');
  const square = jobs.find((job) => job.aspect === 'square');
  assert.equal(fit.sizeReason, 'pretext-fit');
  assert.equal(square.sizeReason, 'social-crop');
  assert.equal(fit.canvas, 'card');
  assert.equal(SOCIAL_ASPECTS.square.ratioLabel, '1/1');
});

test('unique cards size to a copy-flow measure token, not a generic rem dump', () => {
  const html = templateDocumentHtml('http://127.0.0.1:4173', '<article class="frame-card"></article>', {
    aspect: 'fit',
    sizeToken: 'measure-card',
  });
  assert.match(html, /compose\.css/);
  assert.doesNotMatch(html, /style\.css/);
  assert.match(html, /var\(--measure-card/);
  assert.match(html, /data-spw-size-reason="pretext-fit"/);
  assert.ok(SIZE_TOKENS.includes(sizeTokenFor({ seat: 'hook' })));
  assert.equal(sizeTokenFor({ seat: 'hook' }), 'measure-reading');
  assert.equal(sizeTokenFor({ seat: 'path' }), 'measure-compact');
});

test('cropToAspect keeps content-fit unique and centers named ratios', () => {
  const box = { x: 10, y: 20, width: 400, height: 200, viewportX: 10, viewportY: 20 };
  const fit = cropToAspect(box, 'fit');
  assert.equal(fit.aspect, 'fit');
  assert.equal(fit.width, 400);
  const square = cropToAspect(box, 'square');
  assert.equal(square.aspect, 'square');
  assert.ok(Math.abs(square.width - square.height) < 1);
});

test('intermediate measures double as marketing teasers', () => {
  const prompt = marketingPrompt({
    wonder: 'The unique ratio is the chip itself.',
    sizeReason: 'pretext-fit',
  });
  assert.equal(prompt, 'The unique ratio is the chip itself.');
  assert.match(
    marketingPrompt({ label: 'About years', sizeReason: 'pretext-fit' }, { wrap: 'volatile' }),
    /will not hold one line/,
  );
});

test('enhancement loop names wrap and leftover-track work', () => {
  assert.match(
    enhancementHint({ track: 'social', sizeReason: 'pretext-fit' }, { wrap: 'volatile' }),
    /volatile/,
  );
  assert.match(
    enhancementHint({ seat: 'cluster', viewportId: 'fold' }, {}),
    /leftover/,
  );
  assert.equal(enhancementHint({ track: 'qa' }, { wrap: 'stable' }), null);
  assert.equal(sizeReasonFor({ track: 'qa', flow: 'region' }), 'device-reason');
});

test('--changed filter keeps only jobs whose sources moved', () => {
  const { jobs } = buildCapturePlan({
    componentFixtures: COMPONENT_FIXTURES,
    viewports: [desktop],
    flows: ['component'],
    changedFiles: ['public/css/components/cards.css'],
  });
  assert.ok(jobs.length);
  assert.ok(jobs.every((job) => job.sourceFiles.includes('public/css/components/cards.css')));
});

test('viewport aliases match component phone/desktop scenarios', () => {
  assert.equal(viewportMatchesScenario('pocket', ['phone', 'desktop']), true);
  assert.equal(viewportMatchesScenario('phone', ['pocket', 'fold', 'broadsheet']), true);
  assert.equal(viewportMatchesScenario('broadsheet', ['phone', 'desktop']), true);
  assert.equal(viewportMatchesScenario('desktop', ['pocket', 'fold', 'broadsheet']), true);
  assert.equal(viewportMatchesScenario('fold', ['phone', 'desktop']), false);
  assert.equal(viewportMatchesScenario('fold', ['pocket', 'fold', 'desktop']), true);
  assert.equal(viewportMatchesScenario('tablet', ['fold']), true);
  assert.equal(viewportMatchesScenario('phablet', ['phone', 'desktop']), false);
});

test('visibility lenses stamp tangibility/density without a default factorial', () => {
  const { jobs } = buildCapturePlan({
    componentFixtures: COMPONENT_FIXTURES,
    includeQa: false,
    includeSocial: true,
    aspects: ['fit'],
    ids: ['operator-chip'],
    lenses: ['labels'],
  });
  assert.ok(jobs.some((job) => job.lens?.id === 'labels' && job.lens.value === 'silent'));
  assert.equal(VISIBILITY_LENSES.tangibility.attr, 'data-spw-tangibility');
  const html = templateDocumentHtml('http://127.0.0.1:4173', '<span class="spw-chip"></span>', {
    aspect: 'fit',
    sizeToken: 'measure-compact',
    lens: { attr: 'data-spw-label-posture', value: 'silent' },
  });
  assert.match(html, /data-spw-label-posture="silent"/);
  const plain = [{ canvas: 'card', track: 'social', file: 'captures/a.jpg', wonder: 'x' }];
  assert.equal(applyVisibilityLenses(plain, []).length, 1);
});

test('intelligence bands scale from mosey copy to llm restage prompts', () => {
  const job = {
    id: 'frame-card',
    kind: 'component',
    label: 'Frame card',
    flow: 'template',
    sizeReason: 'pretext-fit',
    sizeToken: 'measure-card',
    selector: '.frame-card',
    wonder: 'A unique content-fit card of one loop is more postable than a full-page home dump.',
  };
  assert.equal(intelligencePrompt('mosey', job), job.wonder);
  assert.match(intelligencePrompt('search', job), /measure-card/);
  assert.match(intelligencePrompt('agent', job), /selector \.frame-card/);
  assert.match(intelligencePrompt('agent', job), /stack posture>seat>pack>gravity>resonance>still/);
  assert.match(intelligencePrompt('llm', job), /Spw relationship/);
  assert.equal(Object.keys(INTELLIGENCE_BANDS).join(','), 'mosey,search,agent,llm');
});

test('component search entries make cards and seats findable', () => {
  const entries = componentSearchEntries({
    componentFixtures: COMPONENT_FIXTURES,
    ecologyFixtures: REGION_ECOLOGY_FIXTURES,
  });
  assert.ok(entries.some((entry) => entry.componentId === 'frame-card' && entry.haystack.includes('card')));
  assert.ok(entries.some((entry) => entry.componentId === 'about-years' && entry.haystack.includes('path')));
  assert.ok(entries.every((entry) => entry.kind === 'component' && entry.route && entry.wonder));
});

test('situation / print / set are the public names — not Storybook stories', () => {
  assert.equal(ASSET_KINDS.situation.flow, 'region');
  assert.equal(ASSET_KINDS.print.flow, 'template');
  assert.equal(assetKindFor({ flow: 'region', kind: 'ecology' }).id, 'situation');
  assert.equal(assetKindFor({ flow: 'template' }).id, 'print');
  const parsed = parseSpwCaptureTokens(['hook', 'print', 'fit'], ['frame-card']);
  assert.deepEqual(parsed.seats, ['hook']);
  assert.equal(parsed.ecology, true);
  assert.equal(parsed.social, true);
  const spw = formatCapturePlanSpw({ jobs: [{ id: 'home-hook', seat: 'hook', flow: 'region', kind: 'ecology' }] });
  assert.match(spw, /situation/);
  assert.match(spw, /cost = /);
  assert.match(spw, /stack = `posture > seat > pack > gravity > resonance > still`/);
});

test('situation-set navs are the expensive cluster; prints skip the shell', () => {
  const cost = estimatePlanCost([
    { id: 'home-hook', flow: 'region', specimenRoute: '/', viewportId: 'fold', canvas: 'specimen' },
    { id: 'home-cluster', flow: 'region', specimenRoute: '/', viewportId: 'fold', canvas: 'specimen' },
    { id: 'frame-card', flow: 'template', canvas: 'card', viewportId: 'fit' },
  ]);
  assert.equal(cost.setNavs, 1);
  assert.equal(cost.prints, 1);
  assert.match(cost.learn, /share a nav/);
});

test('navigation groups keep template cards off the specimen tab', () => {
  const { groups } = buildCapturePlan({
    componentFixtures: COMPONENT_FIXTURES,
    includeQa: false,
    includeSocial: true,
    aspects: ['fit', 'square'],
    ids: ['operator-chip'],
  });
  assert.ok(groups.every((group) => group.canvas === 'card'));
});

test('document clips use page coordinates and are not clamped to the viewport', () => {
  const box = {
    x: 24,
    y: 2400,
    width: 360,
    height: 1200,
    viewportX: 24,
    viewportY: 80,
  };
  const documentClip = clipForBox(box, phone, 20, 'fit', { space: 'document' });
  assert.equal(documentClip.coordinateSpace, 'document');
  assert.equal(documentClip.captureBeyondViewport, true);
  assert.equal(documentClip.y, 2380);
  assert.equal(documentClip.height, 1240);
  const viewportClip = clipForBox(box, phone, 20, 'fit', { space: 'viewport' });
  assert.equal(viewportClip.coordinateSpace, 'viewport');
  assert.equal(viewportClip.captureBeyondViewport, false);
  assert.ok(viewportClip.height <= phone.height);
});

test('a header-only preview is a miss for a region, not a specimen', () => {
  assert.equal(clipSpaceForJob({ flow: 'region' }), 'document');
  assert.equal(clipSpaceForJob({ flow: 'page' }), null);
  assert.equal(clipSpaceForJob({ still: true }), null);
  assert.equal(looksLikeShellChrome('#>SPWASHI ROUTES ABOUT'), true);
  assert.equal(looksLikeShellChrome('Joins you can challenge. Cullet, grog, and fiber.'), false);
  assert.equal(isMissedSpecimen(
    { flow: 'region', selector: '#join-crawl' },
    { text: '#>SPWASHI  ROUTES  plain text operators' },
  ), true);
  assert.equal(isMissedSpecimen(
    { flow: 'page' },
    { text: '#>SPWASHI ROUTES' },
  ), false);
});

test('capture occupancy distinguishes light prose from visual-led presence', () => {
  const lightBox = {
    width: 600,
    height: 400,
    area: 240000,
    childCount: 1,
    text: 'Brief single link.',
    textLength: 18,
  };
  const result = assessCaptureOccupancy({ viewportId: 'desktop' }, lightBox);
  assert.equal(result.occupancy, 'light');
  assert.equal(result.reason, 'low-presence-density');

  const visual = assessCaptureOccupancy({}, {
    area: 240000,
    childCount: 1,
    mediaCount: 1,
    textLength: 0,
  });
  assert.equal(visual.occupancy, 'visual-led');
  assert.equal(visual.reason, 'media-carries-presence');

  const healthyBox = {
    width: 400,
    height: 300,
    area: 120000,
    childCount: 4,
    text: 'This is a well-balanced card with a header, multi-line paragraph description, operator chips, and a link footer that fills the allocated measure.',
    textLength: 147,
  };
  const healthyResult = assessCaptureOccupancy({ viewportId: 'desktop' }, healthyBox);
  assert.equal(healthyResult.occupancy, 'balanced');
});

test('capture expression annotates the still without replacing component semantics', () => {
  const expression = formatCaptureExpression({
    id: 'frame-card--fit',
    fixtureId: 'frame-card',
    aspect: 'fit',
    flow: 'template',
    sizeReason: 'pretext-fit',
  }, {
    occupancy: 'balanced',
    semantics: { feature: 'frame-card-specimen' },
  });

  assert.equal(
    expression,
    'still[fit]{template.pretext-fit.balanced}<frame-card-specimen>',
  );
});

test('viewport stills are device frames, not tall region anatomy', () => {
  const pocket = VIEWPORTS.pocket;
  const jobs = buildViewportStillJobs(VIEWPORT_STILL_RECIPES, {
    viewports: [pocket],
    ids: ['home-hook'],
  });
  assert.ok(jobs.length >= 4);
  assert.ok(jobs.every((job) => job.flow === 'page' && job.still === true));
  assert.equal(jobs[0].file, 'captures/pocket/01-home-opening.jpg');
  assert.equal(jobs[1].file, 'captures/pocket/02-home-reasons.jpg');
  assert.ok(jobs.every((job) => job.file.startsWith('captures/pocket/')));
  assert.equal(errorFile('blank', jobs[0]), 'captures/errors/pocket--blank--home-opening.jpg');
  assert.ok(jobs.some((job) => job.id === 'home-opening' && job.prepare?.close?.includes('.home-field-notes')));
  assert.ok(jobs.some((job) => job.id === 'home-entrance-open' && job.prepare?.open?.includes('.home-depth-disclosure')));

  const tall = assessViewportSubject(
    { flow: 'region', kind: 'ecology', viewportId: 'pocket' },
    { height: 2900 },
    pocket,
  );
  assert.equal(tall.fit, 'overflows-viewport');
  assert.match(tall.hint, /viewport still/);

  const opening = assessViewportSubject(
    { flow: 'page', still: true, viewportId: 'pocket' },
    { height: 844 },
    pocket,
  );
  assert.equal(opening.fit, 'fills-frame');
  assert.equal(isBlankStill(Buffer.alloc(120), { flow: 'page' }), true);
});

test('ecology page flow emits one rest still per route without dropping region jobs when asked', () => {
  const { jobs } = buildCapturePlan({
    ecologyFixtures: REGION_ECOLOGY_FIXTURES,
    viewports: [VIEWPORTS.pocket],
    flows: ['page', 'region'],
    includeComponents: false,
    includeEcology: true,
    ids: ['home-hook'],
  });
  assert.ok(jobs.some((job) => job.flow === 'page' && job.id.startsWith('page-')));
  assert.ok(jobs.some((job) => job.flow === 'region' && job.id === 'home-hook'));
});

test('capture conditions split route, theme, and attention into separate still folders', () => {
  const params = captureSearchParams(
    { colorMode: 'dark' },
    { section: 'entry-loops', probe: 'frame' },
  );
  assert.equal(params.get('color-mode'), 'dark');
  assert.equal(params.get('pin'), 'entry-loops');
  assert.equal(params.get('probe'), 'frame');

  const themeParams = captureSearchParams(
    { themePack: 'banked-ember', highContrast: 'on' },
  );
  assert.equal(themeParams.get('theme'), 'banked-ember');
  assert.equal(themeParams.get('high-contrast'), 'on');
  assert.equal(
    browseCluster({ still: true, viewportId: 'pocket', conditions: { themePack: 'banked-ember', highContrast: 'on' } }),
    'pocket--banked-ember-high-contrast',
  );

  const dark = {
    still: true,
    viewportId: 'pocket',
    conditions: { colorMode: 'dark' },
    specimenRoute: '/about/',
    id: 'about-opening-dark',
  };
  assert.equal(browseCluster(dark), 'pocket--dark-mode');
  assert.match(specimenNavigationKey(dark), /\/about\/\|pocket\|dark/);

  const pin = {
    still: true,
    viewportId: 'pocket',
    specimenRoute: '/#entry-loops',
    attention: { section: 'entry-loops' },
    id: 'home-entry-loops-pin',
  };
  assert.match(specimenNavigationKey(pin), /#entry-loops/);
  assert.notEqual(
    specimenNavigationKey(pin),
    specimenNavigationKey({ ...pin, specimenRoute: '/' }),
  );

  const checks = buildViewportStillJobs(VIEWPORT_STILL_RECIPES, {
    viewports: [VIEWPORTS.pocket],
    includeChecks: true,
  });
  assert.ok(checks.some((job) => job.id === 'about-opening-dark' && job.conditions?.colorMode === 'dark'));
  assert.ok(checks.some((job) => job.id === 'home-entry-loops-pin' && job.attention?.section === 'entry-loops'));
  assert.ok(checks.some((job) => job.file.startsWith('captures/pocket--dark-mode/')));
  assert.ok(checks.some((job) => job.id === 'home-entry-loops-pin' && job.file.startsWith('captures/pocket--section-pin/')));
  assert.equal(VIEWPORT_STILL_CHECKS.length >= 3, true);
});

test('capture runs nest readable profile folders under the day', () => {
  const when = new Date(2026, 7, 25, 18, 56, 58);
  const a = captureRunLayout('/tmp/pack', { profile: 'survey', params: { walk: true }, when, nonce: 'a' });
  const b = captureRunLayout('/tmp/pack', { profile: 'survey', params: { walk: true }, when, nonce: 'b' });
  assert.equal(a.day, '2026-08-25');
  assert.equal(a.profile, 'survey');
  assert.match(a.rel, /^runs\/2026-08-25\/survey\/\d{2}-\d{2}-\d{2}--[a-f0-9]{6}$/);
  assert.notEqual(a.runId, b.runId);
  assert.ok(a.runId < '99-99-99--ffffff');
  assert.equal(walkFileName('/', 0), 'home--00000.jpg');
  assert.equal(walkFileName('/about/', 844), 'about--00844.jpg');
  assert.equal(formatCaptureRunId({ when, nonce: 'x' }).split('--')[0], a.runId.split('--')[0]);
});

test('page walks emit one expandable job per route', () => {
  const { jobs } = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeWalk: true,
    walkRoutes: ['/', '/about/'],
    viewports: [VIEWPORTS.pocket],
  });
  assert.equal(jobs.length, 2);
  assert.ok(jobs.every((job) => job.walk && job.file.includes('--00000.jpg')));
  assert.ok(jobs.some((job) => job.file.startsWith('captures/pocket/home--')));
  assert.ok(jobs.some((job) => job.file.startsWith('captures/pocket/about--')));
});

test('archive copies stills into viewport folders and keeps json out', () => {
  assert.equal(archiveImageRel('captures/pocket/01-home-opening.jpg'), 'pocket/01-home-opening.jpg');
  assert.equal(
    archiveImageRel('captures/errors/pocket--blank--home-opening.jpg'),
    'errors/pocket--blank--home-opening.jpg',
  );
});

test('still token opts into named viewport recipes', () => {
  const parsed = parseSpwCaptureTokens(['still', 'home-opening', 'pocket'], ['home-opening', 'home-hook']);
  assert.equal(parsed.stills, true);
  assert.deepEqual(parsed.ids, ['home-opening']);
  assert.deepEqual(parsed.viewports, ['pocket']);

  const { jobs } = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    viewports: [VIEWPORTS.pocket],
  });
  assert.equal(jobs.length, VIEWPORT_STILL_RECIPES.length);
  assert.ok(jobs.every((job) => job.still && job.flow === 'page'));
  assert.equal(assetKindFor(jobs[0]).id, 'page');
});

test('clipForBox compensates dimensions when box is near page edges', () => {
  const edgeBox = {
    x: 5,
    y: 5,
    width: 300,
    height: 150,
    viewportX: 5,
    viewportY: 5,
  };
  // padding = 20: cropped.x will be -15, cropped.width will be 340
  const docClip = clipForBox(edgeBox, phone, 20, 'fit', { space: 'document' });
  assert.equal(docClip.x, 0);
  assert.equal(docClip.y, 0);
  // Adjusted width compensates for the clamped 15px: 340 - 15 = 325
  assert.equal(docClip.width, 325);
  assert.equal(docClip.height, 175);

  const vpClip = clipForBox(edgeBox, phone, 20, 'fit', { space: 'viewport' });
  assert.equal(vpClip.x, 0);
  assert.equal(vpClip.y, 0);
  assert.equal(vpClip.width, 325);
  assert.equal(vpClip.height, 175);
});

test('attention capture pins write existing region-mark and probe attributes', async () => {
  const {
    applyAttentionCapturePins,
    readCapturePinQuery,
  } = await import('../../public/js/runtime/attention/capture-pins.js');
  const pins = readCapturePinQuery('?pin=entry-loops&probe=frame', '#ignored');
  assert.equal(pins.section, 'entry-loops');
  assert.equal(pins.probe, 'frame');
  const marked = {};
  const node = {
    setAttribute(name, value) {
      marked[name] = value;
    },
  };
  const rootAttrs = {};
  document.getElementById = (id) => (id === 'entry-loops' ? node : null);
  document.documentElement.setAttribute = (name, value) => {
    rootAttrs[name] = value;
  };
  document.documentElement.getAttribute = (name) => rootAttrs[name] || null;
  applyAttentionCapturePins(document, pins);
  assert.equal(marked['data-spw-region-mark'], 'capture');
  assert.equal(rootAttrs['data-spw-page-section-current'], 'entry-loops');
  assert.equal(rootAttrs['data-spw-resonance-probe'], 'frame');
});

test('readPinnedProbe reads probe from the live search string', async () => {
  const { readPinnedProbe } = await import('../../public/js/runtime/attention/capture-pins.js');
  const root = {
    nodeType: 9,
    defaultView: { location: { search: '?probe=topic', hash: '#entry-loops' } },
  };
  assert.equal(readPinnedProbe(root), 'topic');
});

test('live capture measure evaluate is bounded and races font wait', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../component-snapshots.mjs', import.meta.url), 'utf8');
  assert.ok(CAPTURE_MEASURE.evaluateTimeoutMs < 60000);
  assert.match(source, /CAPTURE_MEASURE\.evaluateTimeoutMs/);
  assert.match(source, /CAPTURE_MEASURE\.fontWaitMs/);
  assert.match(source, /fonts\.ready[\s\S]{0,180}race\(/);
  assert.doesNotMatch(
    source,
    /await document\.fonts\.ready;/,
    'unbounded fonts.ready hung the thorough run for 60s per job',
  );
});

test('PERF_PROBE_EXPRESSION instruments capture, font readiness, and section handle state', async () => {
  const { PERF_PROBE_EXPRESSION } = await import('../lib/chrome-headless-harness.mjs');
  assert.match(PERF_PROBE_EXPRESSION, /fontsReady/);
  assert.match(PERF_PROBE_EXPRESSION, /activeSection/);
  assert.match(PERF_PROBE_EXPRESSION, /sectionHandleState/);
  assert.match(PERF_PROBE_EXPRESSION, /captureMode/);
});

test('review chapters walk linguistics before climate', () => {
  assert.deepEqual([...REVIEW_CHAPTERS], [
    'linguistics', 'physics', 'region', 'personality', 'page', 'climate',
  ]);
  assert.equal(reviewChapterFor({ id: 'operator-chip', flow: 'component' }), 'linguistics');
  assert.equal(reviewChapterFor({ id: 'frame-card', flow: 'component' }), 'physics');
  assert.equal(reviewChapterFor({ id: 'home-hook', seat: 'hook', flow: 'region' }), 'region');
  assert.equal(reviewChapterFor({ id: 'home-cluster', seat: 'cluster', flow: 'region' }), 'personality');
  assert.equal(reviewChapterFor({ id: 'home-opening', still: true, flow: 'page' }), 'page');
  assert.equal(reviewChapterFor({
    id: 'home-hook-dark',
    still: true,
    flow: 'page',
    conditions: { colorMode: 'dark' },
  }), 'climate');
  assert.ok(capturePriorityScore({ id: 'operator-chip', viewportId: 'pocket' })
    < capturePriorityScore({ id: 'home-hook-dark', viewportId: 'fold', conditions: { colorMode: 'dark' } }));
});

test('combination budget keeps theme checks on pocket and caps navs', () => {
  const jobs = [
    { id: 'chip', fixtureId: 'operator-chip', specimenRoute: '/design/components/', viewportId: 'pocket', flow: 'component' },
    { id: 'chip-fold', fixtureId: 'operator-chip', specimenRoute: '/design/components/', viewportId: 'fold', flow: 'component' },
    { id: 'ember-pocket', fixtureId: 'home-hook', specimenRoute: '/', viewportId: 'pocket', flow: 'page', still: true, conditions: { themePack: 'banked-ember' } },
    { id: 'ember-fold', fixtureId: 'home-hook', specimenRoute: '/', viewportId: 'fold', flow: 'page', still: true, conditions: { themePack: 'banked-ember' } },
    { id: 'home', fixtureId: 'home-hook', specimenRoute: '/', viewportId: 'pocket', flow: 'region', seat: 'hook' },
  ];
  const kept = prioritizeCaptureJobs(jobs, { maxNavs: 4, themeViewport: 'pocket' });
  assert.equal(kept.some((job) => job.id === 'ember-fold'), false);
  assert.ok(kept.some((job) => job.id === 'ember-pocket'));
  const navs = new Set(kept.map((job) => specimenNavigationKey(job)));
  assert.ok(navs.size <= 4);
  assert.equal(kept[0].chapter, 'linguistics');
});

test('failure kinds distinguish miss from gone, and index names the recapture command', () => {
  assert.equal(classifyCaptureFailure(new Error('selector-miss: .spw-chip not found or empty')), 'miss');
  assert.equal(classifyCaptureFailure(new Error('Inspected target navigated or closed')), 'gone');
  const index = buildCaptureIndex({
    captures: [{ id: 'home-opening', file: 'captures/pocket/01-home-opening.jpg', flow: 'page', still: true }],
    errorArtifacts: [
      { kind: 'miss', id: 'operator-chip', fixtureId: 'operator-chip', file: 'captures/errors/pocket--miss--operator-chip.txt' },
    ],
  });
  assert.equal(index.chapters.page.length, 1);
  assert.equal(index.errors.miss[0].id, 'operator-chip');
  assert.equal(index.next.command, 'npm run visual:stabilize');
  assert.deepEqual(index.next.ids, ['operator-chip']);
});

test('starved clips are misses, and recapture ids skip generic page blanks', () => {
  assert.equal(isStarvedClip({ flow: 'region' }, { width: 18, height: 800 }), true);
  assert.equal(isStarvedClip({ flow: 'page', still: true }, { width: 18, height: 800 }), false);
  assert.equal(isStarvedClip({ flow: 'component' }, { width: 320, height: 180 }, { occupancy: 'balanced' }), false);
  const index = buildCaptureIndex({
    captures: [],
    errorArtifacts: [
      { kind: 'blank', id: 'page-home', fixtureId: 'home-hook', file: 'captures/errors/pocket--blank--page-home.jpg' },
      { kind: 'miss', id: 'operator-chip', fixtureId: 'operator-chip', file: 'captures/errors/pocket--miss--operator-chip.txt' },
    ],
  });
  assert.deepEqual(index.next.ids, ['operator-chip']);
});

test('explore and stabilize profiles cap combinations the way fuzz explore/stabilize do', () => {
  assert.equal(CAPTURE_PROFILES.explore.maxNavs, 12);
  assert.equal(CAPTURE_PROFILES.stabilize.retryErrors, true);
  const applied = applyCaptureProfile({ viewports: null, maxNavs: null, themeViewport: null, retryErrors: null }, CAPTURE_PROFILES.explore);
  assert.deepEqual(applied.viewports, ['pocket']);
  assert.equal(applied.maxNavs, 12);
  assert.equal(applied.themeViewport, 'pocket');
});
