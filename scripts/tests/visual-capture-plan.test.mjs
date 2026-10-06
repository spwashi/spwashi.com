import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMPONENT_FIXTURES,
  getComponentFixture,
} from '../../public/js/kernel/component-fixtures.js';
import {
  REGION_ECOLOGY_FIXTURES,
  getRegionEcologyFixture,
} from '../../public/js/kernel/region-ecology-fixtures.js';
import { MODULE_DEFS } from '../../public/js/runtime/catalog/index.js';
import { accountStillCoverage } from '../lib/still-module-coverage.mjs';
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
  assessStillAttention,
  assessStillOverflow,
  attentionAssertKind,
  attentionStepKind,
  attentionStepRequest,
  RECIPE_PAIR_KINDS,
  STILL_ATTENTION_READ_EXPRESSION,
  assessViewportSubject,
  isBlankStill,
  isStarvedClip,
  formatCaptureExpression,
  buildViewportStillJobs,
  errorFile,
  browseCluster,
  captureSearchParams,
  captureRecoverSettleMs,
  mergeAttentionIntoSearch,
  captureSearchNeedsAttention,
  specimenNavigationKey,
  CAPTURE_MEASURE,
  evaluateTimeoutMsFor,
  screenshotTimeoutMsFor,
  REVIEW_CHAPTERS,
  reviewChapterFor,
  prioritizeCaptureJobs,
  classifyCaptureFailure,
  attentionMissError,
  attentionReading,
  attentionReceipt,
  nightlyStillState,
  nightlySmokeRoutes,
  NIGHTLY_SMOKE_ROUTES,
  measuredAttention,
  nightlyClimateId,
  NIGHTLY_CLIMATE_IDS,
  nightlyMonthId,
  nightlyAttentionIds,
  nightlyMonthReceipt,
  NIGHTLY_MONTH_IDS,
  recaptureJobIds,
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

test('occupancy readings tell an advisor what the card is doing', () => {
  const light = assessCaptureOccupancy({}, {
    area: 240000,
    childCount: 1,
    textLength: 18,
  });
  assert.equal(light.occupancy, 'light');
  assert.equal(light.reason, 'low-presence-density');
  assert.equal(light.reading, 'The card is light. That is a review clue, not a repair.');

  const visual = assessCaptureOccupancy({}, {
    area: 240000,
    childCount: 1,
    mediaCount: 1,
    textLength: 0,
  });
  assert.equal(visual.reason, 'media-carries-presence');
  assert.equal(visual.reading, 'The picture carries the card. Few words are the point.');

  const balanced = assessCaptureOccupancy({}, {
    area: 120000,
    childCount: 4,
    textLength: 147,
  });
  assert.equal(balanced.occupancy, 'balanced');
  assert.equal(balanced.reason, null);
  assert.equal(balanced.reading, 'Words and controls share the card.');

  const dense = assessCaptureOccupancy({}, {
    area: 10000,
    childCount: 1,
    textLength: 50,
  });
  assert.equal(dense.occupancy, 'dense');
  assert.equal(dense.reason, null);
  assert.equal(dense.reading, 'The card is dense. Read it for packing.');

  assert.equal(assessCaptureOccupancy({}, { area: 400 }).reading, 'Nothing rendered in the box.');
  assert.equal(assessCaptureOccupancy({}, {}).reading, 'The box was not measured.');
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
  assert.ok(jobs.some((job) => job.id === 'home-nav-open' && job.prepare?.click?.includes('.spw-nav-toggle')));
  assert.ok(jobs.some((job) => job.id === 'home-living-term-note' && job.prepare?.click?.includes('#home-frame .spw-living-term[data-spw-concept="living-concepts"]')));
  assert.ok(jobs.some((job) => job.id === 'home-search-open' && job.prepare?.click?.includes('[data-spw-site-search-open]')));

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
  assert.ok(checks.some((job) => job.id === 'software-frame-probe' && job.attention?.probe === 'frame'));
  assert.ok(checks.some((job) => job.id === 'software-frame-probe' && job.file.startsWith('captures/pocket--operator-probe/')));
  const opening = checks.find((job) => job.id === 'software-opening');
  const frameProbe = checks.find((job) => job.id === 'software-frame-probe');
  assert.ok(opening && frameProbe);
  assert.notEqual(specimenNavigationKey(opening), specimenNavigationKey(frameProbe));
  assert.match(specimenNavigationKey(frameProbe), /operator-probe/);
  const softwareGroups = groupJobsByNavigation([opening, frameProbe]);
  assert.equal(softwareGroups.length, 2);
  assert.equal(captureSearchNeedsAttention('?interaction=calm', { probe: 'frame' }), true);
  assert.equal(captureSearchNeedsAttention('?interaction=calm&probe=frame', { probe: 'frame' }), false);
  assert.match(mergeAttentionIntoSearch('?interaction=calm', { probe: 'frame' }), /probe=frame/);
  assert.equal(captureRecoverSettleMs(1800), 2500);
  assert.equal(captureRecoverSettleMs(10000), 10000);
  assert.ok(checks.some((job) => job.id === 'curriculum-memory-pin' && job.attention?.section === 'memory-buffers'));
  assert.ok(checks.some((job) => job.id === 'curriculum-hero-focus' && job.assertAttention === 'spend'));
  assert.equal(VIEWPORT_STILL_CHECKS.length >= 3, true);
});

test('named stills can click the shell menu and popups open', () => {
  const { jobs } = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    viewports: [VIEWPORTS.pocket],
    ids: ['home-nav-open', 'home-living-term-note', 'home-search-open'],
  });
  const nav = jobs.find((job) => job.id === 'home-nav-open');
  const note = jobs.find((job) => job.id === 'home-living-term-note');
  const search = jobs.find((job) => job.id === 'home-search-open');
  assert.deepEqual(nav?.prepare?.click, ['.spw-nav-toggle']);
  assert.equal(nav?.selector, '.site-header[data-spw-menu="open"]');
  assert.deepEqual(note?.prepare?.click, ['#home-frame .spw-living-term[data-spw-concept="living-concepts"]']);
  assert.equal(note?.selector, '.spw-concept-popover');
  assert.deepEqual(search?.prepare?.click, ['[data-spw-site-search-open]']);
  assert.equal(search?.selector, '[data-spw-site-search="open"]');
});

test('named stills charge, inspect, and hold visitor overlays', () => {
  const { jobs } = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    includeChecks: true,
    viewports: [VIEWPORTS.pocket],
    ids: [
      'home-pronunciation',
      'home-region-menu',
      'home-topic-note',
      'home-pronunciation-dark',
      'home-region-menu-dark',
      'home-topic-note-dark',
    ],
  });
  const hint = jobs.find((job) => job.id === 'home-pronunciation');
  const menu = jobs.find((job) => job.id === 'home-region-menu');
  const topic = jobs.find((job) => job.id === 'home-topic-note');
  assert.deepEqual(hint?.prepare?.charge, ['#home-frame .frame-sigil[data-spw-operator="frame"]']);
  assert.equal(hint?.selector, '.spw-pronunciation-hint');
  assert.deepEqual(menu?.prepare?.contextmenu, ['#home-frame .frame-sigil[data-spw-operator="frame"]']);
  assert.equal(menu?.selector, '.spw-region-menu');
  assert.deepEqual(topic?.prepare?.hold, ['#reading-layers .spw-topic[data-spw-topic="topic"]']);
  assert.equal(topic?.selector, '.spw-topic-popover');
  assert.equal(jobs.filter((job) => job.conditions?.colorMode === 'dark').length, 3);
});

test('named stills cover curriculum, software, and math openings', () => {
  const { jobs } = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    viewports: [VIEWPORTS.pocket],
  });
  assert.ok(jobs.some((job) => job.id === 'curriculum-opening' && job.selector === '#curriculum-hero'));
  assert.ok(jobs.some((job) => job.id === 'software-opening' && job.selector === '#software-surface'));
  assert.ok(jobs.some((job) => job.id === 'math-opening' && job.selector === '#math-hero'));
  assert.ok(jobs.some((job) => job.id === 'quest-opening' && job.selector === '#domain-frame'));
  assert.ok(jobs.some((job) => job.id === 'now-opening' && job.selector === '#current-sprint'));
});

test('named stills crop the public card, panel, chip, and lede nouns', () => {
  const rest = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    viewports: [VIEWPORTS.pocket],
  }).jobs;
  assert.ok(rest.some((job) => job.id === 'home-entry-loops' && job.selector === '#entry-loops'));
  assert.ok(rest.some((job) => job.id === 'home-entry-panels' && job.selector === '#home-entry-panels'));
  assert.ok(rest.some((job) => job.id === 'home-lede' && job.selector === '#home-frame-note'));
  assert.ok(rest.some((job) => job.id === 'home-chips'));

  const climate = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    includeChecks: true,
    viewports: [VIEWPORTS.pocket],
    ids: [
      'home-entry-loops-dark',
      'home-entry-loops-reduced',
      'home-entry-loops-ember',
      'home-entry-loops-high-contrast',
      'home-entry-panels-dark',
      'home-entry-panels-ember',
      'home-lede-dark',
      'home-chips-dark',
    ],
  }).jobs;
  assert.equal(climate.length, 8);
  assert.ok(climate.every((job) => job.still && job.conditions));
  assert.equal(getComponentFixture('frame-card')?.selector, '#entry-loops .spw-card');
});

test('folio probes and prices are named still recipes, not catalog components', () => {
  assert.equal(COMPONENT_FIXTURES.some((fixture) => fixture.id.startsWith('folio-')), false);
  assert.ok(REGION_ECOLOGY_FIXTURES.some((fixture) => fixture.id === 'folio-fold-probe'));
  assert.ok(REGION_ECOLOGY_FIXTURES.some((fixture) => fixture.id === 'folio-growth-probe'));
  assert.ok(REGION_ECOLOGY_FIXTURES.some((fixture) => fixture.id === 'folio-prices'));

  const { jobs } = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    includeChecks: true,
    viewports: [VIEWPORTS.pocket],
    ids: ['folio-fold-rest', 'folio-fold-open', 'folio-growth-rest', 'folio-growth-branch', 'folio-prices', 'folio-fold-open-reduced'],
  });
  const rest = jobs.find((job) => job.id === 'folio-fold-rest');
  const open = jobs.find((job) => job.id === 'folio-fold-open');
  const growthRest = jobs.find((job) => job.id === 'folio-growth-rest');
  const branch = jobs.find((job) => job.id === 'folio-growth-branch');
  const prices = jobs.find((job) => job.id === 'folio-prices');
  const reduced = jobs.find((job) => job.id === 'folio-fold-open-reduced');
  assert.deepEqual(rest?.prepare?.check, ['#folio-fold-probe input[value="rest"]']);
  assert.equal(open?.selector, '#folio-fold-probe');
  assert.deepEqual(open?.prepare?.check, ['#folio-fold-probe input[value="open"]']);
  assert.deepEqual(growthRest?.prepare?.check, ['#folio-growth-probe input[value="rest"]']);
  assert.equal(branch?.selector, '#folio-growth-probe');
  assert.deepEqual(branch?.prepare?.check, ['#folio-growth-probe input[value="branch"]']);
  assert.equal(prices?.selector, '#folio-prices');
  assert.equal(reduced?.conditions?.reducedMotion, 'reduce');
});

test('a recipe id is not a fixture family, and press is a pair not a second recipe', () => {
  const restOnly = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    includeChecks: true,
    viewports: [VIEWPORTS.pocket],
    ids: ['home-entry-panels'],
  }).jobs;
  assert.equal(restOnly.length, 1);
  assert.equal(restOnly[0].id, 'home-entry-panels');

  const { jobs } = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    viewports: [VIEWPORTS.pocket],
    ids: ['about-opening'],
  });
  const rest = jobs.find((job) => job.id === 'about-opening');
  const press = jobs.find((job) => job.id === 'about-opening-press');
  const hover = jobs.find((job) => job.id === 'about-opening-hover');
  const keys = jobs.find((job) => job.id === 'about-opening-keys');
  assert.ok(rest);
  assert.ok(press);
  assert.ok(hover);
  assert.ok(keys);
  assert.deepEqual(press?.prepare?.click, ['#about-frame .mode-switch [data-set-mode="kernel"]']);
  assert.deepEqual(hover?.prepare?.hover, ['#about-frame .mode-switch [data-set-mode="kernel"]']);
  // The lens switch is a roving group: an arrow moves within it, Tab leaves it.
  assert.deepEqual(keys?.prepare?.keys, ['ArrowRight']);
  assert.equal(keys?.prepare?.focus, '#about-frame .mode-switch [data-set-mode="reading"]');
  assert.equal(keys?.prepare?.lands, '#about-frame .mode-switch [data-set-mode="kernel"]');
  assert.equal(attentionStepKind(attentionStepRequest(keys)), 'keys');
  assert.equal(jobs.some((job) => job.id === 'quest-opening'), false);

  const pressOnly = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    viewports: [VIEWPORTS.pocket],
    ids: ['about-opening-press'],
  }).jobs;
  assert.equal(pressOnly.length, 1);
  assert.equal(pressOnly[0].id, 'about-opening-press');

  const quest = buildCapturePlan({
    includeComponents: false,
    includeEcology: false,
    includeStills: true,
    viewports: [VIEWPORTS.pocket],
    ids: ['quest-opening'],
  }).jobs;
  assert.equal(quest.length, 1);
  assert.equal(quest[0].selector, '#domain-frame');
  assert.deepEqual([...RECIPE_PAIR_KINDS], ['press', 'hover', 'keys']);
});

test('still attention receipts fail when ink stays at rest while charge is live', () => {
  assert.equal(attentionAssertKind({ attention: { section: 'memory-buffers' } }), 'pin');
  assert.equal(attentionAssertKind({ attention: { probe: 'frame' } }), 'probe');
  assert.equal(attentionAssertKind({ prepare: { focus: '[data-spw-operator="frame"]' } }), 'spend');
  assert.equal(attentionAssertKind({ still: true }), null);

  const skip = assessStillAttention({ still: true }, { attention: { attentionOpacity: '0.86' } });
  assert.equal(skip.verdict, 'skip');
  assert.equal(skip.opacity, 0.86);
  assert.equal(skip.reason, 'no-attention-assert');

  const unmeasured = assessStillAttention({ assertAttention: 'spend' }, {});
  assert.equal(unmeasured.ok, false);
  assert.equal(unmeasured.reason, 'attention-unmeasured');

  const inkRest = assessStillAttention(
    { assertAttention: 'spend' },
    {
      attention: {
        attentionCharge: '0.6',
        attentionOpacity: '0.86',
        restOpacity: '0.86',
        attentionLight: '0.67',
      },
    },
  );
  assert.equal(inkRest.ok, false);
  assert.equal(inkRest.reason, 'ink-ignores-attention');

  const lightRest = assessStillAttention(
    { assertAttention: 'spend' },
    {
      attention: {
        attentionCharge: '0.6',
        restFloor: '0.96',
        attentionOpacity: '0.92',
        restOpacity: '0.96',
        attentionLight: '0.48',
      },
    },
  );
  assert.equal(lightRest.ok, false);
  assert.equal(lightRest.reason, 'light-ignores-attention');

  const focusMiss = assessStillAttention(
    { assertAttention: 'spend', prepare: { focus: '[data-spw-operator="frame"]' } },
    { attention: { attentionOpacity: '0.86', restOpacity: '0.86', attentionLight: '0.48' } },
  );
  assert.equal(focusMiss.ok, false);
  assert.equal(focusMiss.reason, 'focus-not-held');

  const focusFloorMiss = assessStillAttention(
    { assertAttention: 'spend', prepare: { focus: true } },
    {
      attention: {
        focusWithin: true,
        restFloor: '0.86',
        attentionOpacity: '0.86',
        attentionLight: '0.48',
      },
    },
  );
  assert.equal(focusFloorMiss.ok, false);
  assert.equal(focusFloorMiss.reason, 'rest-floor-ignores-focus');

  const focusInkOnly = assessStillAttention(
    { assertAttention: 'spend', prepare: { focus: true } },
    {
      attention: {
        focusWithin: true,
        restFloor: '0.96',
        attentionOpacity: '0.96',
        restOpacity: '0.96',
        attentionLight: '0.48',
        attentionCharge: '0',
      },
    },
  );
  assert.equal(focusInkOnly.ok, true);

  const spendPass = assessStillAttention(
    { assertAttention: 'spend' },
    {
      attention: {
        attentionCharge: '0.6',
        attentionOpacity: '0.92',
        restFloor: '0.96',
        restOpacity: '0.96',
        attentionLight: '0.67',
        focusWithin: true,
      },
    },
  );
  assert.equal(spendPass.ok, true);
  assert.equal(spendPass.verdict, 'pass');

  const pinPass = assessStillAttention(
    { attention: { section: 'memory-buffers' } },
    { attention: { regionMark: 'capture' } },
  );
  assert.equal(pinPass.ok, true);

  const pinMiss = assessStillAttention(
    { attention: { section: 'memory-buffers' } },
    { attention: { regionMark: '' } },
  );
  assert.equal(pinMiss.ok, false);
  assert.equal(pinMiss.reason, 'pin-not-marked');

  const probeMiss = assessStillAttention(
    { attention: { probe: 'frame' } },
    { attention: { resonanceProbe: 'frame', operatorResonance: '0', attentionResonance: '0' } },
  );
  assert.equal(probeMiss.ok, false);
  assert.equal(probeMiss.reason, 'resonance-report-rest');

  const probePass = assessStillAttention(
    { attention: { probe: 'frame' } },
    { attention: { resonanceProbe: 'frame', operatorResonance: '0.4' } },
  );
  assert.equal(probePass.ok, true);
  assert.match(STILL_ATTENTION_READ_EXPRESSION, /--spw-attention-opacity/);

  const overflowSkip = assessStillOverflow({ flow: 'component' }, { clipOverflow: true });
  assert.equal(overflowSkip.verdict, 'skip');
  const clipped = assessStillOverflow({ still: true, flow: 'page' }, { clipOverflow: true });
  assert.equal(clipped.ok, false);
  assert.equal(clipped.reason, 'handle-clipped');
  const overflowX = assessStillOverflow(
    { still: true, flow: 'page' },
    { composition: { box: { overflowX: true } } },
  );
  assert.equal(overflowX.reason, 'overflow-x');
  const overflowPass = assessStillOverflow({ still: true, flow: 'page' }, { clipOverflow: false });
  assert.equal(overflowPass.ok, true);
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
  const pairJobs = VIEWPORT_STILL_RECIPES.reduce(
    (n, recipe) => n + RECIPE_PAIR_KINDS.filter((kind) => recipe[kind]).length,
    0,
  );
  assert.equal(jobs.length, VIEWPORT_STILL_RECIPES.length + pairJobs);
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

test('attention steps report where a prepare landed', async () => {
  const {
    attentionStepKind: runtimeKind,
    readAttentionStep,
  } = await import('../../public/js/runtime/attention/capture-pins.js');
  const samples = [
    {},
    { section: 'memory-buffers' },
    { probe: 'frame' },
    { keys: ['Tab'], focus: '#reading', lands: '#kernel' },
    { focus: '[data-spw-operator="frame"]' },
    { hover: ['#kernel'] },
    { click: ['#kernel'] },
    { check: ['#open'] },
  ];
  for (const request of samples) {
    assert.equal(attentionStepKind(request), runtimeKind(request));
  }

  const kernel = { id: 'kernel' };
  const reading = { id: 'reading' };
  const host = { contains: (node) => node === kernel || node === reading };
  const doc = {
    nodeType: 9,
    documentElement: {
      getAttribute(name) {
        if (name === 'data-spw-resonance-probe') return 'frame';
        if (name === 'data-spw-reading-groove') return 'on';
        return null;
      },
    },
    body: { tag: 'body' },
    activeElement: kernel,
    getElementById(id) {
      if (id !== 'memory-buffers') return null;
      return { getAttribute: (name) => (name === 'data-spw-region-mark' ? 'capture' : null) };
    },
    querySelector(sel) {
      if (sel === '#about-frame') return host;
      if (sel === '#kernel' || sel.endsWith('[data-set-mode="kernel"]')) return kernel;
      if (sel.endsWith('[data-set-mode="reading"]')) return reading;
      if (sel === '#open') return { type: 'checkbox', checked: true, getAttribute: () => null };
      if (sel === '#pressed') return { getAttribute: (name) => (name === 'aria-pressed' ? 'false' : null) };
      return null;
    },
  };

  assert.equal(readAttentionStep(doc, {}).step, 'rest');
  assert.equal(readAttentionStep(doc, {}).landed, true);
  assert.equal(readAttentionStep(doc, { section: 'memory-buffers' }).landed, true);
  assert.equal(readAttentionStep(doc, { section: 'missing' }).landed, false);
  assert.equal(readAttentionStep(doc, { probe: 'frame' }).step, 'probe');
  assert.equal(readAttentionStep(doc, { probe: 'topic' }).landed, false);
  const keys = readAttentionStep(doc, {
    selector: '#about-frame',
    focus: '#about-frame .mode-switch [data-set-mode="reading"]',
    lands: '#about-frame .mode-switch [data-set-mode="kernel"]',
    keys: ['Tab'],
  });
  assert.equal(keys.step, 'keys');
  assert.equal(keys.landed, true);
  assert.equal(keys.focusWithin, true);
  assert.equal(keys.groove, 'on');
  doc.activeElement = reading;
  assert.equal(readAttentionStep(doc, {
    selector: '#about-frame',
    lands: '#about-frame .mode-switch [data-set-mode="kernel"]',
    keys: ['Tab'],
  }).landed, false);
  doc.activeElement = kernel;
  assert.equal(readAttentionStep(doc, {
    selector: '#about-frame',
    focus: '#about-frame .mode-switch [data-set-mode="kernel"]',
  }).landed, true);
  assert.equal(readAttentionStep(doc, { hover: ['#kernel'] }).landed, true);
  assert.equal(readAttentionStep(doc, { hover: ['#kernel'], hoverMissed: true }).landed, false);
  assert.equal(readAttentionStep(doc, { hover: ['#missing'] }).landed, false);
  assert.equal(readAttentionStep(doc, { check: ['#open'] }).landed, true);
  assert.equal(readAttentionStep(doc, { click: ['#pressed'] }).landed, false);

  const missed = assessStillAttention(
    { still: true },
    { attention: { step: 'keys', landed: false, attentionOpacity: '0.96', attentionCharge: '0.4' } },
  );
  assert.equal(missed.ok, false);
  assert.equal(missed.reason, 'step-not-landed');
  assert.equal(missed.step, 'keys');
  assert.equal(missed.opacity, 0.96);

  const held = assessStillAttention(
    { assertAttention: 'spend', prepare: { focus: '[data-spw-operator="frame"]' } },
    {
      attention: {
        step: 'focus',
        landed: true,
        focusWithin: true,
        restFloor: '0.96',
        attentionOpacity: '0.96',
        attentionLight: '0.48',
        attentionCharge: '0',
      },
    },
  );
  assert.equal(held.ok, true);
  assert.equal(held.step, 'focus');

  const error = attentionMissError(
    { id: 'about-opening-keys', fixtureId: 'about-hook', viewportId: 'pocket' },
    missed,
  );
  assert.equal(error.attention.id, 'about-opening-keys');
  const receipt = attentionReceipt({
    errorArtifacts: [{ attention: error.attention }],
    captures: [{
      id: 'about-opening-hover',
      attention: { verdict: 'skip', step: 'hover', opacity: 0.9, charge: 0.1, resonance: 0 },
    }],
  });
  assert.equal(receipt.failures[0].where, 'about-opening-keys');
  assert.equal(receipt.failures[0].detail, 'keys opacity 0.96');
  assert.equal(receipt.passes[0].step, 'hover');
  assert.equal(receipt.passes[0].where, 'about-opening-hover');
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
  assert.match(source, /evaluateTimeoutMsFor/);
  assert.match(source, /blank, recapture/);
  assert.match(source, /recoverChrome/);
  assert.match(source, /recaptureJobIds/);
  assert.doesNotMatch(source, /skipped after closed tab/);
  assert.match(source, /CAPTURE_MEASURE\.fontWaitMs/);
  assert.match(source, /readStillAttention/);
  assert.match(source, /readAttentionStep/);
  assert.match(source, /readPrepareStep/);
  assert.match(source, /evaluateProbe\(\s*session,\s*\n\s*attentionStepExpression/);
  assert.match(source, /throw attentionMissError\(/);
  const planSource = await readFile(new URL('../lib/visual-capture-plan.mjs', import.meta.url), 'utf8');
  assert.match(planSource, /attention-miss:/);
  assert.match(source, /applyPointerHover/);
  assert.match(source, /applyKeyPrepare/);
  assert.match(source, /overflow-x:/);
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
  assert.equal(reviewChapterFor({ id: 'curriculum-hero-focus', assertAttention: 'spend' }), 'climate');
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
  assert.equal(classifyCaptureFailure(new Error('attention-miss: ink-ignores-attention')), 'miss');
  assert.equal(classifyCaptureFailure(new Error('Inspected target navigated or closed')), 'gone');
  assert.equal(
    classifyCaptureFailure(new Error('CDP call timeout: Runtime.evaluate (8000ms)'), { flow: 'page' }),
    'cdp-timeout',
  );
  assert.equal(
    classifyCaptureFailure(new Error('CDP call timeout: Page.captureScreenshot (12000ms)'), { flow: 'page' }),
    'cdp-timeout',
  );
  assert.equal(
    classifyCaptureFailure(new Error('CDP websocket open timeout (10000ms)')),
    'cdp-timeout',
  );
  const missed = attentionMissError(
    { id: 'about-opening', fixtureId: 'about-opening', viewportId: 'pocket' },
    { verdict: 'failed', reason: 'ink-ignores-attention', opacity: 0.42, charge: 0.4, resonance: 0 },
  );
  assert.equal(missed.attention.reason, 'ink-ignores-attention');
  assert.equal(missed.attention.opacity, 0.42);
  const receipt = attentionReceipt({
    errorArtifacts: [
      { attention: missed.attention },
      { id: 'capture', kind: 'cdp-timeout', message: 'CDP call timeout: Runtime.evaluate (16000ms)' },
    ],
  });
  assert.equal(receipt.ok, false);
  assert.equal(receipt.failures[0].reason, 'ink-ignores-attention');
  assert.equal(receipt.failures[0].detail, 'opacity 0.42');
  assert.equal(receipt.failures[1].reason, 'cdp-timeout');
  assert.deepEqual(receipt.passes, []);
  const gone = attentionReceipt({
    errorArtifacts: [
      { kind: 'gone', id: 'about-opening-keys', fixtureId: 'about-hook', message: 'Inspected target navigated or closed' },
    ],
  });
  assert.equal(gone.failures[0].where, 'about-opening-keys');
  assert.equal(gone.failures[0].reason, 'gone');
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
  assert.deepEqual(
    recaptureJobIds([
      { kind: 'gone', id: 'home-opening', fixtureId: 'home-hook' },
      { kind: 'blank', id: 'math-opening', fixtureId: 'math-hook' },
      { kind: 'gone', id: 'home-reasons', fixtureId: 'home-hook' },
    ]),
    ['home-opening', 'math-opening', 'home-reasons'],
  );
});

test('attention receipts keep measured passes and rotate one climate still', () => {
  assert.equal(measuredAttention({}), null);
  assert.equal(measuredAttention({ attention: { attentionOpacity: '', attentionCharge: '', attentionResonance: '' } }), null);
  const resonanceOnly = measuredAttention({ attention: { attentionResonance: '0.4' } });
  assert.equal(resonanceOnly.opacity, null);
  assert.equal(resonanceOnly.charge, null);
  assert.equal(resonanceOnly.resonance, 0.4);

  const bare = assessStillAttention({ still: true }, {});
  assert.equal(bare.verdict, 'skip');
  assert.equal('opacity' in bare, false);

  const measuredSkip = assessStillAttention(
    { still: true },
    { attention: { attentionOpacity: '0.92', attentionCharge: '0.2' } },
  );
  assert.equal(measuredSkip.verdict, 'skip');
  assert.equal(measuredSkip.opacity, 0.92);
  assert.equal(measuredSkip.charge, 0.2);
  assert.equal(measuredSkip.resonance, null);

  const passes = [
    { id: 'about-opening', fixtureId: 'about-hook', attention: { verdict: 'skip', opacity: 0.86, charge: null, resonance: null } },
    { id: 'about-opening-dark', fixtureId: 'about-hook', attention: { verdict: 'pass', opacity: 0.91, charge: 0.1, resonance: 0 } },
    { id: 'unmeasured', attention: { verdict: 'pass' } },
    ...Array.from({ length: 8 }, (_, index) => ({
      id: `extra-${index}`,
      attention: { verdict: 'pass', opacity: 0.9 },
    })),
  ];
  const kept = attentionReceipt({ errorArtifacts: [], captures: passes });
  assert.equal(kept.ok, true);
  assert.equal(kept.passes.length, 8);
  assert.equal(kept.truncated, true);
  assert.equal(kept.passes[0].where, 'about-opening');
  assert.equal(kept.passes[0].reason, 'skip');
  assert.equal(kept.passes[0].opacity, 0.86);
  assert.equal(kept.passes[1].where, 'about-opening-dark');
  assert.equal(kept.passes[1].charge, 0.1);
  assert.equal(kept.passes.some((row) => row.where === 'unmeasured'), false);

  assert.deepEqual([...NIGHTLY_CLIMATE_IDS], [
    'about-opening-dark',
    'curriculum-hero-focus',
    'software-frame-probe',
    'folio-fold-open-reduced',
  ]);
  assert.equal(nightlyClimateId(0), 'about-opening-dark');
  assert.equal(nightlyClimateId(1), 'curriculum-hero-focus');
  assert.equal(nightlyClimateId(2), 'software-frame-probe');
  assert.equal(nightlyClimateId(3), 'folio-fold-open-reduced');
  assert.equal(nightlyClimateId(4), 'about-opening-dark');
  assert.equal(nightlyClimateId(-1), 'folio-fold-open-reduced');
  assert.equal(nightlyClimateId(Number.NaN), 'about-opening-dark');
  assert.equal(nightlyClimateId('nope'), 'about-opening-dark');

  for (const id of NIGHTLY_CLIMATE_IDS) {
    const { jobs } = buildCapturePlan({
      componentFixtures: COMPONENT_FIXTURES,
      includeStills: true,
      includeChecks: true,
      viewports: [VIEWPORTS.pocket],
      ids: ['about-opening', id],
    });
    const ids = jobs.map((job) => job.id);
    assert.deepEqual(
      ids.filter((jobId) => jobId === 'about-opening' || (jobId.startsWith('about-opening-') && jobId !== id)).sort(),
      ['about-opening', 'about-opening-hover', 'about-opening-keys', 'about-opening-press'],
    );
    assert.equal(jobs.filter((job) => job.id === id).length, 1);
    assert.equal(jobs.length, 5);
    assert.equal(jobs.some((job) => job.specimenRoute === '/' || String(job.id).startsWith('home')), false);
  }

  const byId = (id) => buildCapturePlan({
    includeComponents: false,
    includeStills: true,
    includeChecks: true,
    viewports: [VIEWPORTS.pocket],
    ids: [id],
  }).jobs.find((job) => job.id === id);
  assert.equal(byId('about-opening-dark').conditions.colorMode, 'dark');
  assert.equal(byId('curriculum-hero-focus').assertAttention, 'spend');
  assert.equal(byId('software-frame-probe').attention.probe, 'frame');
  assert.equal(byId('folio-fold-open-reduced').conditions.reducedMotion, 'reduce');
});

test('a month of nights starts on the 1st and keeps one climate still at each week close', () => {
  const known = new Set([
    ...VIEWPORT_STILL_RECIPES.map((recipe) => recipe.id),
    ...VIEWPORT_STILL_CHECKS.map((recipe) => recipe.id),
  ]);
  const nonHome = [...known].filter((id) => id !== 'about-opening' && !id.startsWith('home'));
  assert.equal(NIGHTLY_MONTH_IDS.length, 31);
  assert.deepEqual(new Set(NIGHTLY_MONTH_IDS.slice(0, 26)), new Set(nonHome));
  assert.equal(NIGHTLY_MONTH_IDS.some((id) => id === 'about-opening' || id.startsWith('home')), false);
  assert.deepEqual(NIGHTLY_MONTH_IDS.slice(0, 4), [...NIGHTLY_CLIMATE_IDS]);
  assert.deepEqual(NIGHTLY_MONTH_IDS.slice(26), [
    'about-opening-dark',
    'curriculum-hero-focus',
    'software-frame-probe',
    'folio-fold-open-reduced',
    'topics-opening-dark',
  ]);

  assert.equal(nightlyMonthId(1), 'about-opening-dark');
  assert.equal(nightlyMonthId(7), 'research-opening');
  assert.equal(nightlyMonthId(8), 'now-opening');
  assert.equal(nightlyMonthId(26), 'curriculum-memory-pin');
  assert.equal(nightlyMonthId(27), 'about-opening-dark');
  assert.equal(nightlyMonthId(31), 'topics-opening-dark');
  assert.equal(nightlyMonthId(32), 'about-opening-dark');
  assert.equal(nightlyMonthId(0), 'about-opening-dark');
  assert.equal(nightlyMonthId(Number.NaN), 'about-opening-dark');
  assert.equal(nightlyMonthId('nope'), 'about-opening-dark');
  assert.equal(new Set(Array.from({ length: 26 }, (_, index) => nightlyMonthId(index + 1))).size, 26);

  assert.deepEqual(nightlyAttentionIds(1), ['about-opening', 'about-opening-dark']);
  assert.deepEqual(nightlyAttentionIds(6), ['about-opening', 'town-opening']);
  assert.deepEqual(nightlyAttentionIds(7), ['about-opening', 'research-opening', 'about-opening-dark']);
  assert.deepEqual(nightlyAttentionIds(14), ['about-opening', 'topics-opening-dark', 'curriculum-hero-focus']);
  assert.deepEqual(nightlyAttentionIds(21), ['about-opening', 'about-boonhonk-ember', 'software-frame-probe']);
  assert.deepEqual(nightlyAttentionIds(28), ['about-opening', 'curriculum-hero-focus', 'folio-fold-open-reduced']);
  assert.deepEqual(nightlyAttentionIds(29), ['about-opening', 'software-frame-probe']);
  assert.equal(nightlyAttentionIds(31).length, 2);

  const weekClose = nightlyMonthReceipt(7);
  assert.equal(weekClose.schema, 'month-receipt.v0');
  assert.equal(weekClose.ok, true);
  assert.equal(weekClose.day, 7);
  assert.equal(weekClose.week, 1);
  assert.equal(weekClose.weekClose, true);
  assert.deepEqual(weekClose.ids, nightlyAttentionIds(7));
  assert.equal(nightlyMonthReceipt(8).week, 2);
  assert.equal(nightlyMonthReceipt(8).weekClose, false);
  assert.equal(nightlyMonthReceipt(31).week, 5);
  assert.equal(nightlyMonthReceipt('nope').day, 1);

  for (let day = 1; day <= 31; day += 1) {
    const ids = nightlyAttentionIds(day);
    assert.equal(new Set(ids).size, ids.length);
    const { jobs } = buildCapturePlan({
      componentFixtures: COMPONENT_FIXTURES,
      includeStills: true,
      includeChecks: true,
      viewports: [VIEWPORTS.pocket],
      ids,
    });
    assert.equal(jobs.length, 3 + ids.length, `day ${day}`);
    assert.equal(jobs.some((job) => job.specimenRoute === '/' || String(job.id).startsWith('home')), false);
    for (const id of ids) assert.equal(jobs.some((job) => job.id === id), true, `${day} ${id}`);
  }
});

test('attention readings use a closed vocabulary an advisor can repeat', () => {
  assert.equal(attentionReading({ reason: 'step-not-landed', step: 'press', opacity: 0.96 }), 'The press did not sit.');
  assert.equal(attentionReading({ reason: 'step-not-landed', step: 'keys' }), 'The key did not land.');
  assert.equal(attentionReading({ reason: 'step-not-landed', step: 'focus' }), 'Focus did not stay.');
  assert.equal(attentionReading({ reason: 'step-not-landed', step: 'hover' }), 'The hover target was not there.');
  assert.equal(attentionReading({ reason: 'step-not-landed', step: 'pin' }), 'The section pin did not mark the room.');
  assert.equal(attentionReading({ reason: 'step-not-landed', step: 'probe' }), 'The probe did not pin.');
  assert.equal(attentionReading({ reason: 'ink-ignores-attention', opacity: 0.42 }), 'Ink stayed down.');
  assert.equal(attentionReading({ reason: 'light-ignores-attention' }), 'Light stayed down.');
  assert.equal(attentionReading({ reason: 'focus-not-held' }), 'Focus did not stay.');
  assert.equal(attentionReading({ reason: 'rest-floor-ignores-focus' }), 'The rest floor ignored focus.');
  assert.equal(attentionReading({ reason: 'resonance-report-rest' }), 'Resonance reported rest.');
  assert.equal(attentionReading({ reason: 'attention-unmeasured' }), 'Attention was not measured.');
  assert.equal(attentionReading({ reason: 'gone' }), 'The page left before the still settled.');
  assert.equal(attentionReading({ reason: 'cdp-timeout' }), 'Chrome timed out before the still could be read.');
  assert.equal(
    attentionReading({ reason: 'no-attention-assert', verdict: 'skip', opacity: 0.96, step: 'hover' }),
    'Ink lifted.',
  );
  assert.equal(
    attentionReading({ reason: 'no-attention-assert', verdict: 'skip', opacity: 0.86 }),
    'This still did not ask for attention.',
  );
  assert.equal(attentionReading({ verdict: 'pass', opacity: 0.86 }), 'Ink held the rest.');

  const receipt = attentionReceipt({
    errorArtifacts: [
      {
        attention: {
          id: 'about-opening-press',
          reason: 'step-not-landed',
          step: 'press',
          opacity: 0.86,
        },
      },
      { kind: 'gone', id: 'about-opening-keys', fixtureId: 'about-hook', message: 'Inspected target navigated or closed' },
      { kind: 'cdp-timeout', id: 'capture', message: 'CDP call timeout: Runtime.evaluate (16000ms)' },
    ],
    captures: [
      {
        id: 'about-opening-hover',
        attention: {
          verdict: 'skip',
          reason: 'no-attention-assert',
          opacity: 0.96,
          charge: 0.2,
          resonance: 0,
          step: 'hover',
        },
        captureOccupancy: {
          occupancy: 'light',
          reading: 'The card is light. That is a review clue, not a repair.',
        },
      },
    ],
  });
  assert.equal(receipt.failures[0].reason, 'step-not-landed');
  assert.equal(receipt.failures[0].reading, 'The press did not sit.');
  assert.equal(receipt.failures[1].where, 'about-opening-keys');
  assert.equal(receipt.failures[1].reading, 'The page left before the still settled.');
  assert.equal(receipt.failures[2].reading, 'Chrome timed out before the still could be read.');
  assert.equal(
    receipt.passes[0].reading,
    'Ink lifted. The card is light. That is a review clue, not a repair.',
  );
});

test('a night names the room and state, and smoke adds one route', () => {
  const core = [...NIGHTLY_SMOKE_ROUTES];
  assert.deepEqual(core, ['/', '/settings/', '/topics/software/', '/tools/spw-parser/', '/about/']);

  assert.equal(nightlyStillState({ conditions: { colorMode: 'dark', themePack: 'banked-ember' } }), 'dark');
  assert.equal(nightlyStillState({ conditions: { highContrast: 'on', themePack: 'ritual-vellum' } }), 'high-contrast');
  assert.equal(nightlyStillState({
    conditions: { reducedMotion: 'reduce' },
    prepare: { focus: '#x' },
  }), 'reduced-motion');
  assert.equal(nightlyStillState({ prepare: { check: ['#x'] } }), 'plain');
  assert.equal(nightlyStillState({}), 'plain');
  assert.deepEqual(
    nightlySmokeRoutes({ route: '/about/', state: 'high-contrast' }).at(-1),
    '/about/?high-contrast=on',
  );
  assert.deepEqual(nightlySmokeRoutes({ route: '/', state: 'dark' }), core);

  const day1 = nightlyMonthReceipt(1);
  assert.equal(day1.still, 'about-opening-dark');
  assert.equal(day1.state, 'dark');
  assert.equal(day1.route, '/about/');
  assert.equal(day1.ok, true);
  assert.deepEqual(day1.smoke.routes.slice(0, 5), core);
  assert.equal(day1.smoke.routes.at(-1), '/about/?color-mode=dark');
  assert.equal(day1.reading, 'Day 1, week 1. The still is about-opening-dark on /about/, state dark.');

  const day2 = nightlyMonthReceipt(2);
  assert.equal(day2.state, 'focus');
  assert.equal(day2.route, '/curriculum/');
  assert.equal(day2.smoke.routes.at(-1), '/curriculum/');
  assert.equal(day2.smoke.routes.some((route) => route.includes('?')), false);
  assert.equal(day2.reading, 'Day 2, week 1. The still is curriculum-hero-focus on /curriculum/, state focus.');

  const day4 = nightlyMonthReceipt(4);
  assert.equal(day4.state, 'reduced-motion');
  assert.equal(day4.route, '/design/folios/');
  assert.equal(day4.smoke.routes.at(-1), '/design/folios/');

  const day7 = nightlyMonthReceipt(7);
  assert.equal(day7.still, 'research-opening');
  assert.equal(day7.route, '/research/');
  assert.equal(day7.state, 'plain');
  assert.equal(day7.smoke.routes.at(-1), '/research/');
  assert.equal(
    day7.reading,
    'Day 7, week 1. The still is research-opening on /research/, state plain. Week close also keeps about-opening-dark.',
  );

  const day21 = nightlyMonthReceipt(21);
  assert.equal(day21.state, 'banked-ember');
  assert.equal(day21.route, '/about/');
  assert.equal(day21.smoke.routes.filter((route) => route.startsWith('/about')).length, 1);
  assert.match(day21.reading, /state banked-ember\. Week close also keeps software-frame-probe\.$/);

  const day26 = nightlyMonthReceipt(26);
  assert.equal(day26.state, 'pin');
  assert.equal(day26.route, '/curriculum/');
  assert.equal(day26.smoke.routes.includes('/curriculum/?color-mode=dark'), false);

  const day29 = nightlyMonthReceipt(29);
  assert.equal(day29.still, 'software-frame-probe');
  assert.equal(day29.state, 'probe');
  assert.equal(day29.route, '/topics/software/');
  assert.equal(day29.weekClose, false);
  assert.deepEqual(day29.smoke.routes, core);
  assert.equal(
    day29.reading,
    'Day 29, week 5. The still is software-frame-probe on /topics/software/, state probe.',
  );

  for (let day = 1; day <= 31; day += 1) {
    const receipt = nightlyMonthReceipt(day);
    assert.equal(receipt.ok, true, `day ${day}`);
    assert.deepEqual(receipt.smoke.routes.slice(0, 5), core, `day ${day}`);
    assert.ok(receipt.smoke.routes.length <= 6, `day ${day}`);
    assert.equal(
      receipt.smoke.routes.filter((route) => route === '/' || route.startsWith('/?')).length,
      1,
      `day ${day}`,
    );
    if (receipt.state !== 'dark' && receipt.state !== 'high-contrast') {
      assert.equal(receipt.smoke.routes.some((route) => route.includes('?')), false, `day ${day}`);
    }
    assert.match(
      receipt.reading,
      new RegExp(`^Day ${day}, week ${receipt.week}\\. The still is ${receipt.still} on ${receipt.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, state ${receipt.state}\\.`),
      `day ${day}`,
    );
  }
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

test('page stills get their own nav and a longer evaluate budget', () => {
  assert.ok(evaluateTimeoutMsFor({ flow: 'page' }) > evaluateTimeoutMsFor({ flow: 'component' }));
  assert.ok(
    evaluateTimeoutMsFor({ flow: 'page', still: true, prepare: { click: ['.spw-living-term'] } })
      > evaluateTimeoutMsFor({ flow: 'page', still: true }),
  );
  assert.ok(screenshotTimeoutMsFor({ flow: 'page' }) > screenshotTimeoutMsFor({ flow: 'component' }));
  const homeA = {
    id: 'home-opening',
    flow: 'page',
    still: true,
    specimenRoute: '/',
    viewportId: 'pocket',
  };
  const homeB = {
    id: 'home-reasons',
    flow: 'page',
    still: true,
    specimenRoute: '/',
    viewportId: 'pocket',
  };
  const clipA = {
    id: 'chip-a',
    flow: 'component',
    specimenRoute: '/design/components/',
    viewportId: 'pocket',
  };
  const clipB = {
    id: 'chip-b',
    flow: 'component',
    specimenRoute: '/design/components/',
    viewportId: 'pocket',
  };
  const pageGroups = groupJobsByNavigation([homeA, homeB]);
  assert.equal(pageGroups.length, 2);
  assert.equal(pageGroups[0].jobs.length, 1);
  const clipGroups = groupJobsByNavigation([clipA, clipB]);
  assert.equal(clipGroups.length, 1);
  assert.equal(clipGroups[0].jobs.length, 2);
});

test('explore and stabilize profiles cap combinations the way fuzz explore/stabilize do', () => {
  assert.equal(CAPTURE_PROFILES.explore.maxNavs, 12);
  assert.equal(CAPTURE_PROFILES.stabilize.retryErrors, true);
  const applied = applyCaptureProfile({ viewports: null, maxNavs: null, themeViewport: null, retryErrors: null }, CAPTURE_PROFILES.explore);
  assert.deepEqual(applied.viewports, ['pocket']);
  assert.equal(applied.maxNavs, 12);
  assert.equal(applied.themeViewport, 'pocket');
});

test('visitor overlay modules have a still, and recipe seats resolve', () => {
  const report = accountStillCoverage({
    modules: MODULE_DEFS,
    recipes: VIEWPORT_STILL_RECIPES,
    checks: VIEWPORT_STILL_CHECKS,
    ecologyFixtures: REGION_ECOLOGY_FIXTURES,
    componentFixtures: COMPONENT_FIXTURES,
  });
  assert.deepEqual(report.visitor.sort(), [
    'haptics',
    'pronunciation-hints',
    'region-menu',
    'shell-disclosure',
    'site-search',
    'topic-discovery',
  ]);
  assert.deepEqual(report.visitorMiss, []);
  assert.deepEqual(report.behavior.sort(), ['svg-tunability', 'wrap-jobs']);
  assert.deepEqual(report.behaviorMiss, []);
  assert.deepEqual(report.environment.sort(), ['canvas-accents', 'texture-slice']);
  assert.deepEqual(report.environmentMiss, []);
  assert.deepEqual(report.danglingFixtureIds, []);
  assert.equal(report.unguardedOverlays.includes('pronunciation-hints'), false);
  assert.equal(report.unguardedOverlays.includes('region-menu'), false);
  assert.ok(getRegionEcologyFixture('curriculum-hook'));
  assert.ok(getRegionEcologyFixture('rpg-boonhonk'));
});
