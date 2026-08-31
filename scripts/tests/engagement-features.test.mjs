import assert from 'node:assert/strict';
import test from 'node:test';

import { clampIndex, getWeekIndex } from '../../public/js/typed/feed-utils.js';
import {
  buildDismissKey,
  buildVisibleNotices,
  getDateKeys,
  getRuntimeRewardPolicy,
  normalizeNotice,
  resolveNoticePresentation,
  shouldSuppressScheduledNotices,
  selectScheduleItems,
  slugify,
  shouldSuppressNotice,
} from '../../public/js/interface/discovery-notices.js';
import {
  feedLocale,
  pickDaily,
  pickWeekly,
} from '../../public/js/typed/promo-wonder-cycle.js';
import { createModuleLoader } from '../../public/js/runtime/module-loader.js';
import { MODULE_LAYERS, MOUNT_WHEN } from '../../public/js/runtime/module-catalog-constants.js';
import {
  SPW_FEATURE_DISCOVERY_CONTRACT,
  initFeatureDiscovery,
  normalizeFeatureTrigger,
} from '../../public/js/runtime/feature-discovery.js';
import { createRegistry, readRuntimePolicy } from '../../public/js/runtime/runtime-helpers.js';
import {
  resolvePackFillFromCount,
  resolvePackLayoutForWidth,
  resolvePackRegionItemCount,
} from '../../public/js/runtime/composition-box-model.js';
import {
  buildVariantEdge,
  resolveVariantChoice,
} from '../../public/js/runtime/variant-selection.js';

test('component packing resolves width and fill on independent axes', () => {
  assert.equal(resolvePackLayoutForWidth(415), 'stack');
  assert.equal(resolvePackLayoutForWidth(416), 'split');
  assert.equal(resolvePackLayoutForWidth(703), 'split');
  assert.equal(resolvePackLayoutForWidth(704), 'feature');
  assert.equal(resolvePackLayoutForWidth(704, 2), 'split');
  assert.equal(resolvePackLayoutForWidth(704, 1), 'stack');
  assert.equal(resolvePackLayoutForWidth(704, ['body', 'actions']), 'split');
  assert.equal(resolvePackLayoutForWidth(704, ['media', 'body', 'actions']), 'feature');
  assert.equal(resolvePackLayoutForWidth(704, ['body', 'body', 'actions']), 'split');
  assert.equal(resolvePackLayoutForWidth(831, ['context', 'body', 'actions']), 'stack');
  assert.equal(resolvePackLayoutForWidth(832, ['context', 'body', 'actions']), 'split');
  assert.equal(resolvePackLayoutForWidth(415, 3), 'stack');
  assert.equal(resolvePackFillFromCount(2), 'sparse');
  assert.equal(resolvePackFillFromCount(5), 'balanced');
  assert.equal(resolvePackFillFromCount(6), 'full');
  assert.equal(resolvePackRegionItemCount([{ children: [] }, { children: [] }]), 2);
  assert.equal(resolvePackRegionItemCount([{ children: [1, 2] }, { children: [1, 2, 3] }]), 5);
});

test('variant choice honors explicit intent and names its traversed edge', () => {
  assert.equal(resolveVariantChoice({ requested: 'inspect', pressed: 'read' }), 'inspect');
  assert.equal(resolveVariantChoice({ pressed: 'read', visible: 'compare' }), 'read');
  assert.equal(resolveVariantChoice({ visible: 'compare', fallback: 'build' }), 'compare');
  assert.equal(resolveVariantChoice({ fallback: 'build' }), 'build');
  assert.deepEqual(buildVariantEdge('read', 'inspect'), {
    from: 'read',
    to: 'inspect',
    changed: true,
    label: 'read → inspect',
  });
  assert.equal(buildVariantEdge('inspect', 'inspect').changed, false);
});

test('feature discovery keeps regional attention opt-in and bounded', () => {
  assert.equal(normalizeFeatureTrigger('attention-settle'), 'attention-settle');
  assert.equal(normalizeFeatureTrigger('manual'), 'manual');
  assert.equal(normalizeFeatureTrigger('unknown'), 'view');
  assert.deepEqual(
    SPW_FEATURE_DISCOVERY_CONTRACT.triggerModels,
    ['view', 'attention-settle', 'manual'],
  );

  const runtime = initFeatureDiscovery({ html: document.documentElement });
  assert.doesNotThrow(() => runtime.cleanup(), 'feature discovery teardown must reset WeakSet memory safely');
  assert.equal(document.documentElement.dataset.spwFeatureDiscoveryInit, undefined);
});

test('feature discovery waits for settled regional attention before recording an encounter', async () => {
  const originalQuerySelectorAll = document.querySelectorAll;
  const originalGetElementById = document.getElementById;
  const originalAddEventListener = document.addEventListener;
  const originalRemoveEventListener = document.removeEventListener;
  let sectionListener = null;

  const attributes = new Map([
    ['data-spw-feature', 'regional-surprise'],
    ['data-spw-feature-trigger', 'attention-settle'],
    ['data-spw-feature-traits', 'regional-memory'],
  ]);
  const element = {
    nodeType: 1,
    dataset: { spwFeature: 'regional-surprise' },
    isConnected: true,
    getAttribute(name) { return attributes.get(name) ?? null; },
    hasAttribute(name) { return attributes.has(name); },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    removeAttribute(name) { attributes.delete(name); },
    matches(selector) { return selector.includes('data-spw-feature-trigger="attention-settle"'); },
    closest() { return null; },
    querySelectorAll() { return []; },
  };

  document.querySelectorAll = () => [element];
  document.getElementById = (id) => (id === 'regional-surprise-section' ? element : null);
  document.addEventListener = (type, listener) => {
    if (type === 'spw:section-locomotion-state') sectionListener = listener;
  };
  document.removeEventListener = (type, listener) => {
    if (type === 'spw:section-locomotion-state' && sectionListener === listener) sectionListener = null;
  };

  const html = {
    dataset: {
      spwPageSectionCurrent: 'regional-surprise-section',
      spwPageSectionPhase: 'settled',
    },
  };
  let runtime;
  try {
    runtime = initFeatureDiscovery({ html });
    assert.ok(sectionListener, 'attention-settle listener is installed only with feature discovery');
    assert.equal(attributes.has('data-spw-feature-encounter'), false);

    sectionListener({
      detail: {
        currentId: 'regional-surprise-section',
        phase: 'settled',
      },
    });
    assert.equal(attributes.has('data-spw-feature-encounter'), false, 'the region is not recorded immediately');

    await new Promise((resolve) => setTimeout(resolve, 900));
    assert.equal(attributes.get('data-spw-feature-encounter'), 'novel');
    assert.equal(
      window.spwFeatureDiscovery.get().species['regional-surprise'],
      undefined,
      'attention-settle encounters default to session memory rather than persistent storage',
    );
    assert.equal(
      window.spwFeatureDiscovery.get().traits['regional-memory'],
      undefined,
      'bounded attention traits do not leak into the persistent convergence ledger',
    );
  } finally {
    runtime?.cleanup();
    document.querySelectorAll = originalQuerySelectorAll;
    document.getElementById = originalGetElementById;
    document.addEventListener = originalAddEventListener;
    document.removeEventListener = originalRemoveEventListener;
  }
});

const noticeFeed = {
  sourceLocale: 'en',
  daily: [
    {
      promo: {
        label: 'Daily promo',
        title: 'Help the next release land',
        summary: 'Releases are scheduled for the 13th and 26th of each month.',
        href: '/services/#support',
        cta: 'Open support',
        why: 'A direct contribution keeps the monthly cadence steady.',
      },
    },
    {
      promo: {
        label: 'Daily promo',
        title: 'Keep the release rhythm steady',
        summary: 'Development costs are around $250 per month.',
        href: '/now/',
        cta: 'Review funding',
      },
    },
  ],
  weekly: [
    {
      promo: {
        label: 'Weekly promo',
        title: 'Keep the release rhythm steady',
        summary: 'Development costs are around $250 per month.',
        href: '/now/',
        cta: 'Review funding',
        why: 'One steady contribution helps keep releases on the 13th and 26th.',
      },
    },
    {
      promo: {
        label: 'Weekly promo',
        title: 'Support the next release',
        summary: 'Direct support keeps the public cadence open.',
        href: '/services/#support',
        cta: 'Open support',
      },
    },
  ],
};

const promoFeed = {
  sourceLocale: '  fr ',
  daily: [
    {
      promo: {
        title: 'Monday promo',
        summary: 'First daily option.',
        href: '/alpha/',
      },
      wonder: {
        title: 'Monday wonder',
        summary: 'First daily wonder.',
        href: '/wonder-alpha/',
      },
    },
    {
      promo: {
        title: 'Tuesday promo',
        summary: 'Second daily option.',
        href: '/beta/',
      },
      wonder: {
        title: 'Tuesday wonder',
        summary: 'Second daily wonder.',
        href: '/wonder-beta/',
      },
    },
  ],
  weekly: [
    {
      promo: {
        title: 'Week one promo',
        summary: 'First weekly option.',
        href: '/week-one/',
      },
      wonder: {
        title: 'Week one wonder',
        summary: 'First weekly wonder.',
        href: '/wonder-week-one/',
      },
    },
    {
      promo: {
        title: 'Week two promo',
        summary: 'Second weekly option.',
        href: '/week-two/',
      },
      wonder: {
        title: 'Week two wonder',
        summary: 'Second weekly wonder.',
        href: '/wonder-week-two/',
      },
    },
  ],
};

const date = new Date('2026-04-13T12:00:00-05:00');

test('runtime resource probes are bounded while resource hints keep catalog order', async () => {
  const definitions = Array.from({ length: 7 }, (_, index) => ({
    id: `probe-${index}`,
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.VISIBLE,
    specifier: `/public/js/probe-${index}.js`,
  }));
  const hinted = [];
  let active = 0;
  let maxActive = 0;

  const loader = createModuleLoader({
    moduleDefs: definitions,
    html: document.documentElement,
    body: document.body,
    resourceProbeConcurrency: 3,
    matchesRoute: () => true,
    matchesFeatures: () => true,
    hasSelector: () => true,
    getRoots: () => [],
    hasDebugOrQAMode: () => false,
    readConnectionPosture: () => 'fast',
    shouldPrefetchRuntimeResources: () => true,
    extractDynamicImportSpecifier: (definition) => definition.specifier,
    moduleSpecifierToUrl: (specifier) => specifier,
    ensureResourceHint: (href) => {
      hinted.push(href);
      return true;
    },
    isRuntimeResourceCached: async (href) => {
      const index = Number.parseInt(href.match(/probe-(\d+)/)?.[1] || '0', 10);
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, (7 - index) * 2));
      active -= 1;
      return false;
    },
    requestServiceWorkerPrefetch: () => false,
    requestServiceWorkerCacheSummary: () => false,
    refreshRegionProfiles: () => {},
    setPageState: () => {},
  });
  const emitted = [];
  const ctx = {
    route: '/',
    features: new Set(),
    runtimePolicy: {
      timing: 'normal',
      timingByModule: new Map(),
      only: new Set(),
      skip: new Set(),
      audit: false,
    },
    moduleSkipAuditKeys: new Set(),
    resourceReadiness: new Map(),
    bus: { emit: (event, detail) => emitted.push({ event, detail }) },
  };

  const resources = await loader.prefetchRuntimeResources(
    ctx,
    definitions,
    MOUNT_WHEN.VISIBLE,
    'modulepreload',
  );
  const expectedOrder = definitions.map((definition) => definition.specifier);

  assert.equal(maxActive, 3);
  assert.deepEqual(hinted, expectedOrder);
  assert.deepEqual(resources.map((entry) => entry.href), expectedOrder);
  assert.deepEqual([...ctx.resourceReadiness.values()].map((entry) => entry.href), expectedOrder);
  assert.equal(emitted.at(-1)?.detail?.probeConcurrency, 3);
});

test('discovery notice selection stays deterministic', () => {
  const keys = getDateKeys(date);
  const selected = selectScheduleItems(noticeFeed, date);
  const weeklyIndex = clampIndex(getWeekIndex(date), noticeFeed.weekly.length);

  assert.equal(keys.isoDay, '2026-04-13');
  assert.equal(selected.length, 2);
  assert.equal(selected[0].cadence, 'daily');
  assert.equal(selected[0].label, 'monday promo');
  assert.equal(selected[0].source.title, 'Keep the release rhythm steady');
  assert.equal(selected[1].cadence, 'weekly');
  assert.equal(selected[1].scheduleKey, keys.isoWeek);
  assert.equal(selected[1].source.title, noticeFeed.weekly[weeklyIndex].promo.title);
});

test('discovery notices keep dismiss keys and suppression rules stable', () => {
  const normalized = normalizeNotice(
    {
      title: 'Help the next release land',
      summary: 'Releases are scheduled for the 13th and 26th of each month.',
      href: '/services/#support',
      cta: 'Open support',
      why: 'A direct contribution keeps the monthly cadence steady.',
    },
    'daily',
    '2026-04-13',
    1,
    'en',
  );

  assert.ok(normalized);
  assert.equal(normalized.why, 'A direct contribution keeps the monthly cadence steady.');
  assert.equal(normalized.dismissKey, buildDismissKey('daily', normalized, '2026-04-13', 1));
  assert.equal(slugify('  Help the next release land  '), 'help-the-next-release-land');
  assert.equal(shouldSuppressNotice(normalized, '2026-04-13', {}, '/services/'), true);
  assert.equal(shouldSuppressNotice(normalized, '2026-04-13', { [normalized.dismissKey]: '2026-04-13' }, '/other/'), true);
  assert.equal(shouldSuppressNotice(normalized, '2026-04-14', {}, '/other/'), false);
});

test('discovery notices suppress duplicate visible routes', () => {
  const { visible } = buildVisibleNotices(noticeFeed, date, {}, '/other/');
  const sameRoute = buildVisibleNotices(noticeFeed, date, {}, '/now/');

  assert.equal(visible.length, 1);
  assert.equal(visible[0].href, '/now/');
  assert.equal(sameRoute.visible.length, 0);
});

test('discovery notices downgrade modal promos on reading-quiet chrome', () => {
  assert.equal(resolveNoticePresentation('modal', { readingQuiet: true }), 'toast');
  assert.equal(resolveNoticePresentation('modal', { inspectLab: true }), 'toast');
  assert.equal(resolveNoticePresentation('modal', { readingQuiet: false, inspectLab: false }), 'modal');
  assert.equal(resolveNoticePresentation('modal', { forceModal: true, readingQuiet: true }), 'modal');
  assert.equal(resolveNoticePresentation('popup', { readingQuiet: true }), 'popup');

  const normalized = normalizeNotice(
    {
      title: 'Open the culinary route into play',
      summary: 'Recipes now carry cuisine taxonomy and software metaphors.',
      href: '/recipes/',
      cta: 'Open recipes',
      presentation: 'modal',
      promotion: { presentation: 'modal' },
    },
    'daily',
    '2026-06-14',
    0,
    'en',
  );

  document.documentElement.dataset.spwDebugMode = 'off';
  document.documentElement.dataset.spwCognitiveHandles = 'off';
  document.body.dataset.spwSurface = 'topics';

  assert.ok(normalized);
  assert.equal(normalized.presentation, 'toast');

  document.documentElement.dataset.spwDebugMode = 'on';
  const debugNotice = normalizeNotice(
    {
      title: 'Open the culinary route into play',
      summary: 'Recipes now carry cuisine taxonomy and software metaphors.',
      href: '/recipes/',
      cta: 'Open recipes',
      presentation: 'modal',
      promotion: { presentation: 'modal' },
    },
    'daily',
    '2026-06-14',
    0,
    'en',
  );
  assert.equal(debugNotice.presentation, 'modal');

  delete document.documentElement.dataset.spwDebugMode;
  delete document.documentElement.dataset.spwCognitiveHandles;
  delete document.body.dataset.spwSurface;
});

test('discovery notices suppress scheduled promos on inspect-lab surfaces', () => {
  document.body.dataset.spwSurface = 'settings';
  assert.equal(shouldSuppressScheduledNotices(), true);

  const suppressed = buildVisibleNotices(noticeFeed, date, {}, '/settings/');
  assert.equal(suppressed.visible.length, 0);

  document.body.dataset.spwSurface = 'tools-spw-parser';
  assert.equal(shouldSuppressScheduledNotices(), true);

  document.body.dataset.spwSurface = 'topics';
  assert.equal(shouldSuppressScheduledNotices(), false);

  delete document.body.dataset.spwSurface;
});

test('discovery notices accept image reward popup presentation', () => {
  const normalized = normalizeNotice(
    {
      title: 'Golden spiral discovered',
      summary: 'A visual invariant can become a prompt seed.',
      href: '/public/images/renders/2026-05-B-rhythms/rhythms-prompt-pack.md',
      presentation: 'popup',
      cadenceMotion: 'compare.orbit',
      rewardKind: 'math-prompt',
      productionSeed: 'symmetry-motion-card',
      promotion: {
        handles: ['image', 'spiral', 'reward'],
      },
    },
    'reward',
    'runtime-test',
    0,
    'en',
  );

  assert.ok(normalized);
  assert.equal(normalized.presentation, 'popup');
  assert.deepEqual(normalized.handles, ['image', 'spiral', 'reward']);
  assert.equal(normalized.cadenceMotion, 'compare.orbit');
  assert.equal(normalized.rewardKind, 'math-prompt');
  assert.equal(normalized.productionSeed, 'symmetry-motion-card');
});

test('runtime reward policy keeps credits transient and deduplicated', () => {
  const policy = getRuntimeRewardPolicy({
    cadence: 'reward',
    presentation: 'credits',
    rewardKind: 'spell-cauldron-literacy',
    title: 'Spell cast',
    href: '/design/palettes/#spell-cauldron-hooks',
  });
  const custom = getRuntimeRewardPolicy({
    presentation: 'toast',
    linger: 250,
    rewardKey: 'custom-key',
  });

  assert.equal(policy.presentation, 'credits');
  assert.equal(policy.cadence, 'reward');
  assert.equal(policy.autoDismissMs, 5600);
  assert.equal(policy.maxVisible, 2);
  assert.equal(policy.rewardKey, 'reward:spell-cauldron-literacy:Spell cast:/design/palettes/#spell-cauldron-hooks');
  assert.equal(custom.autoDismissMs, 800);
  assert.equal(custom.rewardKey, 'custom-key');
});

test('promo wonder selection remains data driven', () => {
  const daily = pickDaily(promoFeed, date);
  const weekly = pickWeekly(promoFeed, date);
  const weeklyIndex = clampIndex(getWeekIndex(date), promoFeed.weekly.length);

  assert.equal(feedLocale(promoFeed), 'fr');
  assert.equal(daily.promo.title, 'Tuesday promo');
  assert.equal(weekly.promo.title, promoFeed.weekly[weeklyIndex].promo.title);
});

test('module loader unmount and remount round-trips correctly', async () => {
  let cleanups = 0;
  let mounts = 0;

  const testDef = {
    id: 'test-unmount-remount',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: async () => ({
      default: {
        mount: () => {
          mounts += 1;
          return () => {
            cleanups += 1;
          };
        },
      },
    }),
  };

  const loader = createModuleLoader({
    moduleDefs: [testDef],
    html: document.documentElement,
    body: document.body,
    matchesRoute: () => true,
    matchesFeatures: () => true,
    hasSelector: () => true,
    getRoots: () => [],
    hasDebugOrQAMode: () => false,
    readConnectionPosture: () => 'fast',
    shouldPrefetchRuntimeResources: () => true,
    extractDynamicImportSpecifier: (def) => def.specifier,
    moduleSpecifierToUrl: (spec) => spec,
    ensureResourceHint: () => true,
    isRuntimeResourceCached: async () => false,
    requestServiceWorkerPrefetch: () => false,
    requestServiceWorkerCacheSummary: () => false,
    refreshRegionProfiles: () => {},
    setPageState: () => {},
  });

  const ctx = {
    registry: createRegistry(),
    runtimePolicy: readRuntimePolicy(),
    moduleAudit: [],
    bus: { emit() {} },
    html: document.documentElement,
    body: document.body,
    now: () => performance.now(),
  };

  const mountedRecord = await loader.mountModuleById('test-unmount-remount', ctx);
  assert.equal(mountedRecord.status, 'mounted');
  assert.equal(mounts, 1);

  const unmounted = await loader.unmountModuleById('test-unmount-remount', ctx);
  assert.equal(unmounted, true);
  assert.equal(cleanups, 1);

  const remountedRecord = await loader.mountModuleById('test-unmount-remount', ctx);
  assert.equal(remountedRecord.status, 'mounted');
  assert.equal(mounts, 2);
  await new Promise((r) => setTimeout(r, 10));
});

/* Regression: shell-disclosure's cleanup() reached for bindShellScrollLockTouchGuard,
   which is private to shell/scroll-lock.js, so unmounting the shell threw a
   ReferenceError. Teardown must go through the exported releaseShellLock(). */
test('shell scroll lock round-trips and unbinds its touch guard on release', async () => {
  const { releaseShellLock, syncShellLock } = await import('../../public/js/runtime/shell/scroll-lock.js');

  const makeEl = () => ({
    dataset: {},
    style: {
      _props: {},
      setProperty(k, v) { this._props[k] = v; },
      getPropertyValue(k) { return this._props[k] || ''; },
      removeProperty(k) { delete this._props[k]; },
    },
  });

  const previousDocument = globalThis.document;
  const previousAdd = globalThis.addEventListener;
  const previousRemove = globalThis.removeEventListener;
  const previousScrollTo = globalThis.scrollTo;

  const html = makeEl();
  const body = makeEl();
  const bound = [];

  globalThis.document = { documentElement: html, body };
  globalThis.addEventListener = (type, fn) => { bound.push([type, fn]); };
  globalThis.removeEventListener = (type, fn) => {
    const i = bound.findIndex(([t, f]) => t === type && f === fn);
    if (i >= 0) bound.splice(i, 1);
  };
  globalThis.scrollTo = () => {};

  try {
    syncShellLock({ open: true, topology: 'drawer-field' });
    assert.equal(body.dataset.spwShellScrollLock, 'true', 'body locks while the drawer is open');
    assert.equal(html.dataset.spwShellScrollLock, 'true', 'root mirrors the lock');
    assert.equal(bound.length, 1, 'touchmove guard is bound while locked');
    assert.equal(bound[0][0], 'touchmove');

    releaseShellLock();
    assert.equal(body.dataset.spwShellScrollLock, undefined, 'lock is cleared on release');
    assert.equal(body.dataset.spwShellScrollY, undefined, 'stored scroll offset is cleared');
    assert.equal(bound.length, 0, 'touchmove guard is unbound after release');

    // Releasing twice must stay a no-op rather than throw.
    releaseShellLock();
    assert.equal(bound.length, 0);
  } finally {
    globalThis.document = previousDocument;
    globalThis.addEventListener = previousAdd;
    globalThis.removeEventListener = previousRemove;
    globalThis.scrollTo = previousScrollTo;
  }
});
