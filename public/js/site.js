import {
  enrichRegionMetadata,
  normalizeDocumentMetadata,
} from './kernel/page-metadata.js';
import {
  FEATURE_CLUSTER_CONTRACT,
  describeFeatureClusterElement,
  writeDatasetValue,
} from './kernel/dom-contracts.js';
import {
  announceSpwConsoleSurface,
  applySpwQueryDisposition,
  createSpwLogger,
  installSpwCompositionConsole,
  readConsoleLogBuffer,
  SPW_LOG_RELATIONSHIPS,
} from './kernel/instrumentation.js';
import { bus as sharedBus } from './kernel/bus.js';
import {
  PAGE_ARRIVAL,
  PAGE_ATTENTION_EVENT,
  PAGE_PRESENCE,
  PAGE_STATES,
  PAGE_TRANSITION_EVENT,
  SPW_PAGE_STATE_CONTRACT,
  annotateFloatingChrome,
  clearPageState,
  clearPageAttentionSequence,
  describePageStateSnapshot,
  initPageAttentionLifecycle,
  schedulePageArrival,
  setPageState,
  setPageAttentionState,
  snapshotPageState,
} from './runtime/page-state.js';
import { annotatePageHooks, describePageHook } from './runtime/page-hooks.js';
import {
  annotateCompositionBoxes,
  snapshotCompositionBox,
  snapshotCompositionBoxes,
} from './runtime/composition-box-model.js';
import {
  cancelIdle,
  createRegistry,
  describeRuntimePolicy,
  inferRuntimePosture,
  isFn,
  parseFeatureList,
  readRuntimePolicy,
  safeQuery,
  safeQueryAll,
  whenDocumentReady,
  whenWindowLoaded,
} from './runtime/runtime-helpers.js';
import {
  CORE_DEFS,
  ENHANCEMENT_DEFS as ENHANCEMENT_DEFS_BASE,
  FEATURE_DEFS,
  filterEnhancementDefs,
  MOUNT_WHEN,
  REGION_DEFS,
} from './runtime/module-catalog.js';
import {
  collectRelatedRouteSamples,
  describeComponentSample,
  describeCurrentPageSample,
  describeGestureContract,
  describeGestureTarget,
  GESTURE_SPELL_SEEDS,
  normalizeRoutePath,
  snapshotFeatureClusters,
  snapshotGestureTargets,
} from './runtime/gesture-contract.js';
import {
  primeRegions,
  refreshRegionProfiles,
} from './runtime/region-profiler.js';
import { createModuleLoader } from './runtime/module-loader.js';
/**
 * site.js
 * --------------------------------------------------------------------------
 * Purpose
 * - Minimal staged runtime bootstrap for spwashi.com.
 * - Provide explicit lifecycle contracts for:
 *   core -> feature hydration -> region enhancement -> idle enhancement.
 * - Give CSS and JS a shared semantic vocabulary for discoverable harmony.
 * - Keep cleanup and refresh first-class so older modules can be reintroduced
 *   safely and incrementally.
 *
 * Design constraints
 * - Do not hijack scrolling.
 * - Do not continuously rank regions on scroll.
 * - Do not mount modules unless route/DOM proves they are needed.
 * - Expose region state and harmony hints to CSS.
 * - Keep core small and region work bounded.
 *
 * Page lifecycle
 * - booting
 * - interactive
 * - hydrated
 * - region-enhanced
 * - enhanced
 *
 * Region lifecycle
 * - queued
 * - primed
 * - hydrating
 * - interactive
 * - enhanced
 * - settling
 *
 * Module contract
 * A module definition should provide:
 * - id
 * - layer: "core" | "feature" | "region" | "enhancement"
 * - when: "immediate" | "visible" | "idle" | "interaction" | "region"
 * - selector?: CSS selector
 * - route?: string | string[]
 * - features?: string | string[] — body[data-spw-features] tokens required before scheduling (aligns with CSS behavior bundles)
 * - reason?: human-readable load reason for audit surfaces
 * - describes?: Spw-style semantic expression describing what the module does or the structures it affects (strongly preferred for clarity)
 * - updates?: string[] — data-spw-* attributes, selectors, or Spw expressions describing the specific elements/structures updated by this module (for meaningful descriptions, attentional models, serialization)
 * - rootMode?: "single" | "each"
 * - evaluates?: explicit dimensions (inferred if absent)
 * - load(): Promise<module>
 * - mount(mod, ctx, root?): cleanup fn | { cleanup?, refresh? } | void
 *
 * The intent is a semantically meaningful lifecycle where module timing, load behavior, and effects are:
 * - Clearly described in terms of the Spw structures they touch.
 * - Observable and serializable as "runtime spells" for prompts, notes, recordings, screenshots, and cross-page replay.
 * - Integrated with attentional models, transitions, behavior profiles, and the broader spell/force system.
 *
 * Load instrumentation contract
 * - Phases and per-module costs are recorded with performance.mark/measure using the 'spw:' prefix
 *   (visible in DevTools Performance panel, getEntriesByType, and the timings() surfaces).
 * - Key transitions and module events are also emitted via the 'spw-runtime' logger (LIFECYCLE relation)
 *   so they respect ?log=spw-runtime&log-level=debug and the shared instrumentation controls.
 * - Existing internal timings (loadMs, durationMs, registry records, moduleAudit, data-spw-runtime-* attrs)
 *   and bus events remain the primary machine-readable model; the Performance + logger surfaces
 *   are the external observability layer.
 *
 * Notes
 * - This file intentionally avoids importing heavier modules at top-level.
 * - Region enhancement is lightweight by default and mostly writes state.
 * - Reintroduce richer modules by adding them to FEATURE_DEFS, REGION_DEFS,
 *   or ENHANCEMENT_DEFS.
 * --------------------------------------------------------------------------
 */


const HTML = document.documentElement;
const BODY = document.body;
const ROOT_MAIN = document.querySelector('main');
let SITE_SURFACE = BODY?.dataset?.spwSurface || 'default';
let runtimeCtx = null;

function describeCurrentPageSampleForSite(root = document) {
  return describeCurrentPageSample(root, SITE_SURFACE);
}

function describeComponentSampleForSite(target) {
  return describeComponentSample(target, SITE_SURFACE);
}

// Runtime load instrumentation (Performance API + structured lifecycle logging)
// These are additive and zero-cost for normal visitors; they power DevTools timelines,
// ?log=spw-runtime diagnostics, and the exposed timings() surfaces.
performance.mark('spw:runtime-eval-start');
const runtimeLogger = createSpwLogger('spw-runtime', {
  role: 'lifecycle',
  metaphor: 'boot-sequence',
});

function getSpwPerformanceTimings() {
  const filter = (entry) => entry && typeof entry.name === 'string' && entry.name.startsWith('spw:');
  try {
    return {
      marks: performance.getEntriesByType('mark')
        .filter(filter)
        .map((m) => ({ name: m.name, startTime: Math.round(m.startTime) })),
      measures: performance.getEntriesByType('measure')
        .filter(filter)
        .map((m) => ({ name: m.name, duration: Math.round(m.duration), startTime: Math.round(m.startTime) })),
    };
  } catch {
    return { marks: [], measures: [] };
  }
}

annotateFloatingChrome(document);
annotatePageHooks(document);

/* ==========================================================================
   2. Small runtime helpers
   ========================================================================== */

function matchesRoute(def) {
  if (!def.route) return true;
  if (Array.isArray(def.route)) return def.route.includes(SITE_SURFACE);
  return def.route === SITE_SURFACE;
}

function hasSelector(def) {
  if (!def.selector) return true;
  return Boolean(safeQuery(def.selector));
}

function getRoots(def) {
  if (!def.selector) return [document.body];
  const matches = safeQueryAll(def.selector);
  return matches.length ? matches : [];
}

function readConnectionPosture() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  const effectiveType = String(connection?.effectiveType || '').toLowerCase();
  const saveData = Boolean(connection?.saveData);
  const online = navigator.onLine !== false;

  if (!online) return 'offline';
  if (saveData) return 'save-data';
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'constrained';
  if (effectiveType === '3g') return 'measured';
  return 'open';
}

function shouldPrefetchRuntimeResources(ctx) {
  if (!ctx || !navigator.onLine) return false;
  if (ctx.runtimePolicy.timing === 'manual' || ctx.runtimePolicy.timing === 'quiet') return false;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  if (connection?.saveData) return false;
  const effectiveType = String(connection?.effectiveType || '').toLowerCase();
  return effectiveType !== 'slow-2g' && effectiveType !== '2g';
}

function extractDynamicImportSpecifier(def) {
  const source = String(def?.load || '');
  const match = source.match(/import\(\s*['"]([^'"]+)['"]\s*\)/);
  return match?.[1] || '';
}

function moduleSpecifierToUrl(specifier = '') {
  if (!specifier || !specifier.startsWith('./')) return '';
  try {
    return new URL(specifier, new URL('/public/js/site.js', window.location.origin)).href;
  } catch {
    return '';
  }
}

function ensureResourceHint(href, rel = 'modulepreload') {
  if (!href) {
    return false;
  }

  const existingHint = Array.from(document.head.querySelectorAll(`link[rel="${rel}"]`)).some(
    (link) => link instanceof HTMLLinkElement && link.href === href,
  );
  if (existingHint) {
    return false;
  }

  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (rel === 'prefetch') {
    link.as = 'script';
  }
  link.setAttribute('data-spw-runtime-prefetch', rel);
  document.head.append(link);
  return true;
}

async function isRuntimeResourceCached(href) {
  if (!href || !('caches' in window)) return false;
  try {
    return Boolean(await caches.match(href));
  } catch {
    return false;
  }
}

function requestServiceWorkerPrefetch(urls = []) {
  const controller = navigator.serviceWorker?.controller;
  if (!controller || !urls.length) return false;
  try {
    controller.postMessage({
      type: 'SPW_PREFETCH_URLS',
      urls: urls.slice(0, 12),
    });
    return true;
  } catch {
    return false;
  }
}

function requestServiceWorkerCacheSummary() {
  const controller = navigator.serviceWorker?.controller;
  if (!controller) return false;
  try {
    controller.postMessage({ type: 'SPW_CACHE_SUMMARY' });
    return true;
  } catch {
    return false;
  }
}

/* Temporary debug-only guard for layout shift instrumentation.
   The layout-shift-audit module (and its 5s mutation + mount timing collectors)
   only loads when ?debug=layout or ?log=layout-shift (or spw- aliases).
   This keeps production free of the observer and extra diagnostics. */
function shouldActivateLayoutDebugInstrumentation() {
  try {
    const search = (typeof window !== 'undefined' && window.location) ? window.location.search : '';
    const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
    const debugRaw = String(params.get('debug') || params.get('spw-debug') || '').toLowerCase();
    const logRaw = String(params.get('log') || params.get('spw-log') || '').toLowerCase();
    const debugTokens = debugRaw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    const logTokens = logRaw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    const wantsLayout = debugTokens.some((t) => t === 'layout' || t === 'layout-shift' || t.includes('layout'));
    const wantsLogLayout = logTokens.some((t) => t.includes('layout'));
    return wantsLayout || wantsLogLayout;
  } catch {
    return false;
  }
}

function hasDebugOrQAMode(ctx) {
  if (ctx?.debug?.size && [...ctx.debug].some((token) => ['qa', 'agent', 'beat', 'layout', 'debug'].includes(token))) {
    return true;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const qa = String(params.get('qa') || params.get('spw-qa') || '').toLowerCase();
    const mode = String(params.get('mode') || params.get('spw-mode') || '').toLowerCase();
    return qa.includes('qa') || qa.includes('beat') || qa.includes('screenshot') || mode.includes('qa');
  } catch {
    return false;
  }
}


/* ==========================================================================
   3. Bus facade
   ========================================================================== */

function normalizeBusEventName(type = '') {
  const name = String(type || '').trim();
  return name.startsWith('spw:') ? name.slice(4) : name;
}

function createBus() {
  return {
    on(type, handler, options = {}) {
      return sharedBus.on(normalizeBusEventName(type), handler, options);
    },
    onAny(handler) {
      return sharedBus.onAny(handler);
    },
    recent(filter = null) {
      return sharedBus.recent(filter);
    },
    clearHistory() {
      sharedBus.clearHistory();
    },
    emit(type, detail = {}, options = {}) {
      const dispatchOptions = { ...options };
      if (!dispatchOptions.target) {
        dispatchOptions.target = document;
      }
      return sharedBus.emit(normalizeBusEventName(type), detail, {
        ...dispatchOptions,
      });
    },
    getDiagnostics() {
      return sharedBus.getDiagnostics();
    },
    setHistoryLimit(limit) {
      return sharedBus.setHistoryLimit(limit);
    },
    setMirrorToConsole(value) {
      return sharedBus.setMirrorToConsole(value);
    },
  };
}

/* ==========================================================================
   4. Runtime context
   ========================================================================== */

function createRuntimeContext() {
  const bus = createBus();
  const registry = createRegistry();

  const ctx = {
    version: 'site-runtime-v0.2',
    bus,
    registry,
    html: HTML,
    body: BODY,
    main: ROOT_MAIN,
    route: SITE_SURFACE,
    now: () => performance.now(),
    features: parseFeatureList(BODY?.dataset?.spwFeatures),
    routeFamily: parseFeatureList(BODY?.dataset?.spwRouteFamily),
    debug: parseFeatureList(HTML?.dataset?.spwDebug || BODY?.dataset?.spwDebug),
    runtimePolicy: readRuntimePolicy(),
    moduleAudit: [],
    moduleSkipAuditKeys: new Set(),
    resourceHints: [],
    resourceReadiness: new Map(),
    observers: new Set(),
    timers: new Set(),
    pageAttentionTimers: new Set(),
    cleanupStack: [],
    regions: [],
  };

  writeDatasetValue(HTML, 'spwRuntimeTiming', ctx.runtimePolicy.timing);
  writeDatasetValue(HTML, 'spwRuntimePosture', inferRuntimePosture(ctx.runtimePolicy));
  writeDatasetValue(HTML, 'spwRuntimePolicy', describeRuntimePolicy(ctx.runtimePolicy));
  writeDatasetValue(HTML, 'spwModuleAudit', ctx.runtimePolicy.audit ? 'on' : null);
  writeDatasetValue(HTML, 'spwModuleVisuals', ctx.runtimePolicy.visuals ? 'on' : null);
  if (ctx.runtimePolicy.delay) {
    writeDatasetValue(HTML, 'spwModuleDelay', String(ctx.runtimePolicy.delay));
  }

  // Explicit load posture for CSS targeting and editor discovery (helps avoid
  // over-broad :where() selectors on many component types by giving a single
  // hook for "how the runtime decided to load this page").
  const loadPosture = inferRuntimePosture(ctx.runtimePolicy);
  writeDatasetValue(HTML, 'spwLoadPosture', loadPosture);
  writeDatasetValue(HTML, 'spwLoadTiming', ctx.runtimePolicy.timing);
  writeDatasetValue(HTML, 'spwConnectionPosture', readConnectionPosture());
  writeDatasetValue(HTML, 'spwPrefetchMode', shouldPrefetchRuntimeResources(ctx) ? 'eligible' : 'conservative');

  ctx.addCleanup = (fn) => {
    if (!isFn(fn)) return () => {};
    ctx.cleanupStack.push(fn);
    return () => {
      const idx = ctx.cleanupStack.indexOf(fn);
      if (idx >= 0) ctx.cleanupStack.splice(idx, 1);
    };
  };

  ctx.addTimer = (timerId) => {
    ctx.timers.add(timerId);
    return timerId;
  };

  ctx.clearTimers = () => {
    for (const timerId of ctx.timers) {
      window.clearTimeout(timerId);
      window.clearInterval(timerId);
      cancelIdle(timerId);
    }
    ctx.timers.clear();
  };

  ctx.addObserver = (observer) => {
    if (observer) ctx.observers.add(observer);
    return observer;
  };

  ctx.disconnectObservers = () => {
    for (const observer of ctx.observers) {
      try {
        observer.disconnect?.();
      } catch (error) {
        console.warn('[site.js] observer disconnect failed', error);
      }
    }
    ctx.observers.clear();
  };

  ctx.destroy = () => {
    ctx.registry.cleanupAll();
    ctx.disconnectObservers();
    ctx.clearTimers();
    for (const fn of ctx.cleanupStack.splice(0)) {
      try {
        fn();
      } catch (error) {
        console.warn('[site.js] context cleanup failed', error);
      }
    }
    ctx.regions = [];
  };

  return ctx;
}

const ENHANCEMENT_DEFS = filterEnhancementDefs(
  ENHANCEMENT_DEFS_BASE,
  shouldActivateLayoutDebugInstrumentation(),
);

const MODULE_DEFS = [
  ...CORE_DEFS,
  ...FEATURE_DEFS,
  ...REGION_DEFS,
  ...ENHANCEMENT_DEFS,
];

const moduleLoader = createModuleLoader({
  moduleDefs: MODULE_DEFS,
  html: HTML,
  body: BODY,
  logger: runtimeLogger,
  logRelationships: SPW_LOG_RELATIONSHIPS,
  logLabel: 'site.js',
  matchesRoute,
  hasSelector,
  getRoots,
  hasDebugOrQAMode,
  readConnectionPosture,
  shouldPrefetchRuntimeResources,
  extractDynamicImportSpecifier,
  moduleSpecifierToUrl,
  ensureResourceHint,
  isRuntimeResourceCached,
  requestServiceWorkerPrefetch,
  requestServiceWorkerCacheSummary,
  refreshRegionProfiles,
  setPageState,
  pageStates: PAGE_STATES,
});

const {
  snapshotModuleTimingStages,
  listModuleDefinitions,
  snapshotRuntimeModules,
  snapshotRuntimeAsSpellbook,
  mountModuleById,
  buildLoadDiscoverySnapshot,
  snapshotRuntimeResourceReadiness,
  prefetchRuntimeResources,
  initRuntimeResourceAwareness,
  updateRuntimeStateTokens,
  mountImmediateLayer,
  mountVisibleFeatures,
  mountInteractionFeatures,
  mountRegionLayer,
  queueIdleEnhancements,
  refreshRuntime,
  wireRuntimeTokens,
} = moduleLoader;

/* ==========================================================================
   5. Deep links and effect snapshots
   ========================================================================== */

function annotateDeepLinkTargets(root = document) {
  const targets = safeQueryAll('main :is(section, article, aside, div)[id], main :is(h1, h2, h3, h4)[id], [data-spw-feature][id]', root)
    .filter((el) => el instanceof HTMLElement && el.id && !el.closest('[hidden], template'));

  targets.forEach((el) => {
    const label = normalizeWhitespace(
      el.getAttribute('aria-label')
      || el.querySelector?.('h1, h2, h3, h4, .frame-sigil, .page-kicker')?.textContent
      || el.textContent
      || el.id
    ).slice(0, 80);
    writeDatasetValue(el, 'spwDeepLink', `#${el.id}`);
    writeDatasetValue(el, 'spwDeepLinkLabel', label || el.id);

    const sigil = el.querySelector?.(':scope > .frame-topline .frame-sigil[href^="#"], :scope > .frame-heading .frame-sigil[href^="#"]');
    if (sigil instanceof HTMLAnchorElement && !sigil.title) {
      sigil.title = `Deep link: #${el.id}`;
    }
  });

  writeDatasetValue(HTML, 'spwDeepLinkCount', String(targets.length));
  return targets;
}

function snapshotDeepLinks(root = document) {
  return annotateDeepLinkTargets(root).map((el) => ({
    id: el.id,
    href: `#${el.id}`,
    label: el.dataset.spwDeepLinkLabel || el.id,
    feature: el.dataset.spwFeature || null,
    kind: el.dataset.spwKind || null,
    role: el.dataset.spwRole || null,
  }));
}

function snapshotEffectSummary() {
  const root = document.documentElement;
  return {
    route: runtimeCtx?.route || BODY?.dataset.spwSurface || 'unknown',
    timing: root.dataset.spwInteractionTuner || root.dataset.spwRuntimeTiming || 'balanced',
    lighting: root.dataset.spwColorTuner || root.dataset.spwColorMode || 'system',
    density: root.dataset.spwSemanticDensity || 'medium',
    flavor: root.dataset.spwPedagogicalFlavor || 'neutral',
    runtimePosture: root.dataset.spwRuntimePosture || 'minimal',
    moduleVisuals: root.dataset.spwModuleVisuals || 'off',
    moduleAudit: root.dataset.spwModuleAudit || 'off',
    modules: snapshotRuntimeModules(runtimeCtx),
    expressions: snapshotSemanticExpressions(),
    projections: snapshotProjectionEquations(),
  };
}

function snapshotSemanticExpressions() {
  return safeQueryAll('[data-spw-semantic-expression], [data-spw-vocab], [data-spw-topic], [data-spw-operator]')
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: normalizeWhitespace(el.textContent || '').slice(0, 120),
      expression: el.dataset.spwSemanticExpression || null,
      vocab: el.dataset.spwVocab || null,
      topic: el.dataset.spwTopic || null,
      operator: el.dataset.spwOperator || null,
      href: el instanceof HTMLAnchorElement ? el.getAttribute('href') : null,
      route: window.location.pathname,
    }));
}

function snapshotProjectionEquations() {
  const expressions = snapshotSemanticExpressions()
    .map((entry) => entry.expression)
    .filter(Boolean);

  return expressions.map((expression) => {
    const match = expression.match(/^([^\[\{\(]+)(?:\[([^\]]+)\])?(?:\{([^}]+)\})?(?:\(([^)]+)\))?/);
    return {
      expression,
      noun: match?.[1]?.trim() || expression,
      variant: match?.[2] || null,
      behavior: match?.[3] || null,
      scene: match?.[4] || null,
    };
  });
}

function normalizeWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

/**
 * Shared snapshot builder for load discovery (used by both the compose API
 * and the global __SPW_SITE__ surface). Keeps the "what is the runtime doing
 * right now and how can I change its timing/targeting" story in one place.
 */

function destroyRuntime() {
  if (!runtimeCtx) return;
  runtimeCtx.destroy();
  runtimeCtx = null;
  clearPageState(HTML, BODY);
  delete HTML.dataset.spwLayoutShiftState;
  delete HTML.dataset.spwLayoutShiftCount;
  delete HTML.dataset.spwLayoutShiftTotal;
  delete HTML.dataset.spwLayoutShiftLast;
  delete HTML.dataset.spwLayoutShiftRecentInputCount;
  if (BODY?.dataset) {
    delete BODY.dataset.spwLayoutShiftState;
    delete BODY.dataset.spwLayoutShiftCount;
    delete BODY.dataset.spwLayoutShiftTotal;
    delete BODY.dataset.spwLayoutShiftLast;
    delete BODY.dataset.spwLayoutShiftRecentInputCount;
  }
}

let regionEnrichmentPromise = null;

function scheduleRegionEnrichment(pageMeta, ctx) {
  if (!pageMeta || !ctx) return Promise.resolve();
  if (regionEnrichmentPromise) return regionEnrichmentPromise;

  regionEnrichmentPromise = new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        enrichRegionMetadata(pageMeta, { body: ctx.body || BODY });
        primeRegions(ctx);
        refreshRegionProfiles(ctx, 'region-metadata-enrichment');
        resolve();
      });
    });
  });

  return regionEnrichmentPromise;
}

async function bootSite() {
  await whenDocumentReady();
  performance.mark('spw:document-ready');
  const normalized = normalizeDocumentMetadata({ deferRegions: true });
  SITE_SURFACE = normalized.surface || SITE_SURFACE;

  runtimeCtx = createRuntimeContext();
  wireRuntimeTokens(runtimeCtx);
  performance.mark('spw:boot-start');
  runtimeLogger.info('runtime boot started', { route: runtimeCtx.route }, SPW_LOG_RELATIONSHIPS.LIFECYCLE);
  const [
    { orchestrator: frameState, bindGlobalInteractions },
    pageHooks,
  ] = await Promise.all([
    import('./runtime/state-orchestrator.js'),
    import('./runtime/page-hooks.js'),
  ]);

  const composeApi = installSpwCompositionConsole(window, {
    namespace: 'site-runtime',
    role: 'runtime',
    metaphor: 'composition-console',
    owns: 'query disposition, runtime inspection, tuning hooks',
    controls: {
      pageState: {
        clearAttentionSequence: clearPageAttentionSequence,
        describe: describePageStateSnapshot,
        contract: SPW_PAGE_STATE_CONTRACT,
        states: PAGE_STATES,
        presence: PAGE_PRESENCE,
        arrival: PAGE_ARRIVAL,
        events: {
          attention: PAGE_ATTENTION_EVENT,
          transition: PAGE_TRANSITION_EVENT,
        },
        annotateFloatingChrome,
        clear: clearPageState,
        init: initPageAttentionLifecycle,
        scheduleArrival: schedulePageArrival,
        setPageState,
        setAttentionState: setPageAttentionState,
        snapshot: snapshotPageState,
      },
      pageHooks: {
        annotate: pageHooks.annotatePageHooks,
        describe: describePageHook,
        focus: pageHooks.focusPageHook,
        contract: pageHooks.SPW_PAGE_HOOK_CONTRACT,
        list: pageHooks.listPageHooks,
        pulse: pageHooks.pulsePageHook,
        resolve: pageHooks.resolvePageHook,
        snapshot: pageHooks.snapshotPageHooks,
        states: pageHooks.PAGE_HOOK_STATES,
      },
      frameState: {
        ...frameState,
        bindGlobalInteractions,
      },
      modules: {
        audit: () => [...(runtimeCtx?.moduleAudit || [])],
        definitions: () => listModuleDefinitions(runtimeCtx),
        mount: (id, options = {}) => mountModuleById(id, runtimeCtx, options),
        policy: () => runtimeCtx?.runtimePolicy || null,
        records: () => snapshotRuntimeModules(runtimeCtx),
        resources: () => snapshotRuntimeResourceReadiness(runtimeCtx),
        timings: () => runtimeCtx
          ? {
              ...getSpwPerformanceTimings(),
              lifecycle: snapshotModuleTimingStages(runtimeCtx),
              modules: snapshotRuntimeModules(runtimeCtx),
            }
          : null,
        // Discovery + timing customization surface (makes "knowing about runtime load"
        // and adjusting targeting feel first-class for editors and power users).
        // Returns the canonical timing policies, current posture, and a lightweight
        // view of what was considered vs actually mounted (aids targeting/debug).
        discovery: () => runtimeCtx ? buildLoadDiscoverySnapshot(runtimeCtx) : null,
      },
      deepLinks: {
        annotate: (root = document) => annotateDeepLinkTargets(root),
        list: (root = document) => snapshotDeepLinks(root),
      },
      composition: {
        annotate: (root = document, options = {}) => annotateCompositionBoxes(root, options),
        inspect: (target, options = {}) => snapshotCompositionBox(target, options),
        snapshot: (root = document, options = {}) => snapshotCompositionBoxes(root, options),
      },
      featureClusters: {
        inspect: (target) => describeFeatureClusterElement(target),
        list: (root = document) => snapshotFeatureClusters(root),
        contract: FEATURE_CLUSTER_CONTRACT,
      },
      gestures: {
        contract: describeGestureContract,
        inspect: (target) => describeGestureTarget(target),
        list: (root = document) => snapshotGestureTargets(root),
        seeds: () => GESTURE_SPELL_SEEDS.slice(),
      },
      routes: {
        current: () => describeCurrentPageSampleForSite(document),
        list: (root = document) => collectRelatedRouteSamples(root),
        open: (pathname = '') => {
          const href = normalizeRoutePath(pathname);
          if (!href) return '';
          window.location.assign(href);
          return href;
        },
      },
      samples: {
        page: (root = document) => describeCurrentPageSampleForSite(root),
        component: (target) => describeComponentSampleForSite(target),
      },
      effects: {
        expressions: snapshotSemanticExpressions,
        projections: snapshotProjectionEquations,
        summary: snapshotEffectSummary,
      },
    },
  });
  const queryDisposition = applySpwQueryDisposition(HTML, {
    source: 'site-runtime',
    scope: 'document',
  });
  runtimeCtx.queryDisposition = queryDisposition;
  runtimeCtx.compose = composeApi;
  setPageState(PAGE_STATES.BOOTING);
  runtimeCtx.addCleanup(initPageAttentionLifecycle(runtimeCtx));
  runtimeCtx.addCleanup(initRuntimeResourceAwareness(runtimeCtx));

  runtimeCtx.bus.emit('spw:page-boot', { route: runtimeCtx.route });

  // Initialize relational state and global interactions
  bindGlobalInteractions();
  annotateDeepLinkTargets(document);

  await mountImmediateLayer(CORE_DEFS, runtimeCtx);
  await mountImmediateLayer(FEATURE_DEFS, runtimeCtx);
  await mountImmediateLayer(ENHANCEMENT_DEFS, runtimeCtx);
  await prefetchRuntimeResources(runtimeCtx, FEATURE_DEFS, MOUNT_WHEN.VISIBLE, 'modulepreload');
  await prefetchRuntimeResources(runtimeCtx, ENHANCEMENT_DEFS, MOUNT_WHEN.IDLE, 'prefetch');
  performance.mark('spw:immediate-layer-complete');
  performance.measure('spw:immediate-layer', 'spw:boot-start', 'spw:immediate-layer-complete');
  runtimeLogger.info('immediate layers mounted', { route: runtimeCtx.route }, SPW_LOG_RELATIONSHIPS.LIFECYCLE);
  refreshRegionProfiles(runtimeCtx, 'immediate-enrichment');

  schedulePageArrival(runtimeCtx, PAGE_ARRIVAL.ENTERING, 'page-enter');

  setPageState(PAGE_STATES.INTERACTIVE);
  runtimeCtx.bus.emit('spw:page-interactive', { route: runtimeCtx.route });

  scheduleRegionEnrichment(normalized.pageMeta, runtimeCtx);

  await mountVisibleFeatures(FEATURE_DEFS, runtimeCtx);
  await mountInteractionFeatures(FEATURE_DEFS, runtimeCtx);

  setPageState(PAGE_STATES.HYDRATED);
  performance.mark('spw:page-hydrated');
  runtimeCtx.bus.emit('spw:page-hydrated', { route: runtimeCtx.route });

  await scheduleRegionEnrichment(normalized.pageMeta, runtimeCtx);
  await mountRegionLayer(REGION_DEFS, runtimeCtx);

  setPageState(PAGE_STATES.REGION_ENHANCED);
  performance.mark('spw:region-enhanced');
  runtimeCtx.bus.emit('spw:page-region-enhanced', { route: runtimeCtx.route });

  queueIdleEnhancements(ENHANCEMENT_DEFS, runtimeCtx);

  whenWindowLoaded().then(() => {
    if (!runtimeCtx) return;
    performance.mark('spw:window-loaded');
    performance.measure('spw:full-boot', 'spw:boot-start', 'spw:window-loaded');
    runtimeLogger.info('site ready (window load)', { route: runtimeCtx.route }, SPW_LOG_RELATIONSHIPS.LIFECYCLE);
    refreshRuntime(runtimeCtx);
  });

  // Final site-ready mark for traces that end before full window load
  performance.mark('spw:site-ready');
  performance.measure('spw:boot-to-ready', 'spw:boot-start', 'spw:site-ready');
  runtimeLogger.info('site ready (post region)', { route: runtimeCtx.route }, SPW_LOG_RELATIONSHIPS.LIFECYCLE);

  announceSpwConsoleSurface(window, composeApi, {
    timings: runtimeCtx.compose?.controls?.modules?.timings?.() || null,
  });

  return runtimeCtx;
}

/* ==========================================================================
   14. Dev / manual hooks
   ========================================================================== */

window.__SPW_SITE__ = {
  bootSite,
  destroyRuntime,
  get bus() {
    return runtimeCtx?.bus || sharedBus;
  },
  help: (topic, options = {}) => window.spwCompose?.help?.(topic, options),
  logs: (filter, limit) => window.spwCompose?.logs?.(filter, limit) || readConsoleLogBuffer(limit),
  snapshot: () => window.spwCompose?.snapshot?.() || null,
  auditModules: () => [...(runtimeCtx?.moduleAudit || [])],
  listModules: () => listModuleDefinitions(runtimeCtx),
  mountModule: (id, options = {}) => mountModuleById(id, runtimeCtx, options),
  snapshotModules: () => snapshotRuntimeModules(runtimeCtx),
  timings: () => runtimeCtx
    ? {
        ...getSpwPerformanceTimings(),
        lifecycle: snapshotModuleTimingStages(runtimeCtx),
        modules: snapshotRuntimeModules(runtimeCtx),
      }
    : getSpwPerformanceTimings(),
  getLoadTimings: () => runtimeCtx
    ? {
        ...getSpwPerformanceTimings(),
        lifecycle: snapshotModuleTimingStages(runtimeCtx),
        modules: snapshotRuntimeModules(runtimeCtx),
      }
    : getSpwPerformanceTimings(),
  // Same discovery surface as the compose API for direct console/global access.
  discoverRuntimeLoad: () => runtimeCtx ? buildLoadDiscoverySnapshot(runtimeCtx) : null,
  discoverRuntimeResources: () => snapshotRuntimeResourceReadiness(runtimeCtx),
  discoverDeepLinks: (root = document) => snapshotDeepLinks(root),
  composition: {
    annotate: (root = document, options = {}) => annotateCompositionBoxes(root, options),
    inspect: (target, options = {}) => snapshotCompositionBox(target, options),
    snapshot: (root = document, options = {}) => snapshotCompositionBoxes(root, options),
  },
  featureClusters: {
    inspect: (target) => describeFeatureClusterElement(target),
    list: (root = document) => snapshotFeatureClusters(root),
    contract: FEATURE_CLUSTER_CONTRACT,
  },
  gestures: {
    contract: describeGestureContract,
    inspect: (target) => describeGestureTarget(target),
    list: (root = document) => snapshotGestureTargets(root),
    seeds: () => GESTURE_SPELL_SEEDS.slice(),
  },
  beats: {
    snapshot: () => {
      try {
        // Lazy to keep surface small when not debug-gated
        return import('./runtime/observation-beats.js').then(m => m.snapshotObservationBeats?.() || { active: [], contract: null });
      } catch {
        return { active: [], contract: null };
      }
    },
    listActive: () => {
      // Fallback sync view via DOM when module not fully loaded
      const root = document.documentElement;
      return root.dataset.spwActiveBeat ? [{
        id: root.dataset.spwActiveBeat,
        state: root.dataset.spwActiveBeatState || 'gathering',
        reason: root.dataset.spwActiveBeatReason || 'qa',
      }] : [];
    },
  },
  routes: {
    current: () => describeCurrentPageSampleForSite(document),
    list: (root = document) => collectRelatedRouteSamples(root),
    open: (pathname = '') => {
      const href = normalizeRoutePath(pathname);
      if (!href) return '';
      window.location.assign(href);
      return href;
    },
  },
  samples: {
    page: (root = document) => describeCurrentPageSampleForSite(root),
    component: (target) => describeComponentSampleForSite(target),
  },
  effects: snapshotEffectSummary,
  expressions: snapshotSemanticExpressions,
  projections: snapshotProjectionEquations,
  refreshRuntime: () => runtimeCtx && refreshRuntime(runtimeCtx),
  getContext: () => runtimeCtx,
  // Runtime state + token utilities (high-value for external tools, serialization, and CSS consumers)
  runtimeTokens: {
    update: () => runtimeCtx && updateRuntimeStateTokens(runtimeCtx),
    snapshot: () => runtimeCtx && snapshotRuntimeAsSpellbook(runtimeCtx),
    getCurrent: () => ({
      activeLayers: HTML?.dataset?.spwActiveLayers || '',
      enhancementIntensity: parseFloat(HTML?.style.getPropertyValue('--spw-runtime-enhancement-intensity') || '0'),
      featureIntensity: parseFloat(HTML?.style.getPropertyValue('--spw-runtime-feature-intensity') || '0'),
      layerCount: parseInt(HTML?.style.getPropertyValue('--spw-runtime-layer-count') || '0', 10),
    }),
  },
};

if (window.spwRuntimeAudit) {
  window.spwRuntimeAudit = Object.freeze({
    ...window.spwRuntimeAudit,
    gestures: (root = document) => snapshotGestureTargets(root),
    gestureContract: describeGestureContract,
  });
}

/* ==========================================================================
   15. Start
   ========================================================================== */

void bootSite();
