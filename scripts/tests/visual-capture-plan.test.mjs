import assert from 'node:assert/strict';
import test from 'node:test';

import { COMPONENT_FIXTURES } from '../../public/js/kernel/component-fixtures.js';
import { REGION_ECOLOGY_FIXTURES } from '../../public/js/kernel/region-ecology-fixtures.js';
import {
  DEVICE_REASONS,
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
} from '../lib/visual-capture-plan.mjs';
import { VIEWPORTS } from '../lib/chrome-headless-harness.mjs';

const phone = VIEWPORTS.phone;
const desktop = VIEWPORTS.desktop;
const fold = VIEWPORTS.fold;

test('device reasons carry media queries for QA', () => {
  assert.match(DEVICE_REASONS.pocket.media, /max-width: 45rem/);
  assert.match(DEVICE_REASONS.fold.media, /max-aspect-ratio: 4\/3/);
  assert.equal(VIEWPORTS.pocket.width, VIEWPORTS.phone.width);
  assert.equal(VIEWPORTS.fold.width, VIEWPORTS.tablet.width);
  assert.equal(VIEWPORTS.broadsheet.width, VIEWPORTS.desktop.width);
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
  assert.equal(viewportMatchesScenario('fold', ['phone', 'desktop']), false);
  assert.equal(viewportMatchesScenario('fold', ['pocket', 'fold', 'desktop']), true);
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
