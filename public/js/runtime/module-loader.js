/**
 * Composable module loader for the staged site runtime.
 */

import { writeDatasetValue } from '../kernel/dom-contracts.js';
import { MODULE_LAYERS, MOUNT_WHEN } from './module-catalog-constants.js';
import {
  annotateModuleUpdatesTarget,
  describeModuleUpdates,
  findModuleUpdateConflicts,
  formatModuleUpdatesSpell,
  normalizeModuleUpdates,
  summarizeModuleUpdates,
} from './module-updates-contract.js';
import { resolveModuleMount } from './module-export-contract.js';
import { REGION_STATES, setRegionState } from './region-profiler.js';
import {
  matchesFeatures,
  normalizeFeatureRequirements,
  normalizeMountHandle,
  normalizeRuntimeToken,
  onIdle,
  once,
  safeQuery,
  safeQueryAll,
  SPW_RUNTIME_HELPERS_CONTRACT,
} from './runtime-helpers.js';
import {
  describePageCategory,
  isLiteracyPage,
  isOrientationOnlyPage,
  matchesPageCategory,
  readPageCategory,
} from './page-category.js';

export const MODULE_TIMING_STAGES = Object.freeze([
  'scheduled',
  'loading',
  'mounted',
  'observed',
  'settled',
  'unmounting',
  'unmounted',
  'failed',
]);

const DEFAULT_RESOURCE_PROBE_CONCURRENCY = 4;

export const SPW_MODULE_LOADER_CONTRACT = Object.freeze({
  timingStages: MODULE_TIMING_STAGES,
  portableUse:
    'Use createModuleLoader() when a page shell needs staged module mounting without inlining the bootstrap.',
  featureGating:
    'shouldScheduleDefinition() honors module def.features against ctx.features (body[data-spw-features]). Gates may be CSS BEHAVIOR_SCOPES or presence-only tokens (operators, navigator, …).',
  pageCategory:
    'Optional def.pageFamily / pageRole / pageModes / pageContext / pageSurface match authored body data-spw-* category. Absent fields do not filter. Modes match any listed token. getEffectiveMountWhen may defer broad IMMEDIATE enhancements on orientation-only atlases and promote literacy modules on teaching pages.',
  immediateScheduling:
    'Immediate definitions within a layer mount concurrently after any site-settings core seed; call sites may run independent non-core layers together.',
  resourceDiscovery:
    'Visible and idle CacheStorage probes share a bounded pool; results and resource hints retain catalog order before page-interactive.',
  timingArc:
    'Module definitions may name timingArc to explain the intended scheduling posture beyond raw mount timing.',
  timingChunk:
    'Optional timingChunk (idle-residue|idle-collectible|idle-chrome|idle-lab|idle-default) staggers IDLE mounts so residue/ledger land before collectible flourishes.',
  effectScope:
    'Module definitions may name effectScope tokens to make global state, storage, observer, media, or local DOM side effects auditable.',
  cost:
    'Optional cost { commitment, spend, copy? }. enter=when, act=spend, leave=cleanup, remain=commitment. costClass remains a derived alias. Schedule still uses when/features/selector.',
  updatesContract:
    'Module updates accept flat strings or scope:role:kind:name tokens; roles (structural|flourish|inspect|residue|measure|diagnostic) power flourish topology inspection.',
  moduleExportFallback:
    'Definitions may keep explicit mount adapters; definitions without one fall back to SPW_MODULE_EXPORT, spwModule, default.mount, or init* exports.',
  lifecycleEvent:
    'spw:module-lifecycle emits scheduled, loading, mounted, observed, settled, unmounting, unmounted, and failed so modules can respond through ctx.bus without polling registry state.',
});

export function createModuleLoader(config = {}) {
  const moduleDefs = config.moduleDefs || [];
  const moduleLayers = config.moduleLayers || MODULE_LAYERS;
  const mountWhen = config.mountWhen || MOUNT_WHEN;
  const regionStates = config.regionStates || REGION_STATES;
  const html = config.html || document.documentElement;
  const body = config.body || document.body;
  const logLabel = config.logLabel || 'module-loader';
  const logger = config.logger || null;
  const logRelationships = config.logRelationships || null;
  const timingPolicies = config.timingPolicies || SPW_RUNTIME_HELPERS_CONTRACT.timingPolicies;
  const resourceProbeConcurrency = Math.max(
    1,
    Math.min(8, Number.parseInt(config.resourceProbeConcurrency, 10) || DEFAULT_RESOURCE_PROBE_CONCURRENCY),
  );

  const matchesRoute = config.matchesRoute;
  const resolveFeatureMatch = config.matchesFeatures || ((def, ctx) => matchesFeatures(def, ctx?.features));
  const hasSelector = config.hasSelector;
  const getRoots = config.getRoots;
  const hasDebugOrQAMode = config.hasDebugOrQAMode;
  const readConnectionPosture = config.readConnectionPosture;
  const shouldPrefetchRuntimeResources = config.shouldPrefetchRuntimeResources;
  const extractDynamicImportSpecifier = config.extractDynamicImportSpecifier;
  const moduleSpecifierToUrl = config.moduleSpecifierToUrl;
  const ensureResourceHint = config.ensureResourceHint;
  const isRuntimeResourceCached = config.isRuntimeResourceCached;
  const requestServiceWorkerPrefetch = config.requestServiceWorkerPrefetch;
  const requestServiceWorkerCacheSummary = config.requestServiceWorkerCacheSummary;
  const refreshRegionProfiles = config.refreshRegionProfiles;
  const setPageState = config.setPageState;
  const pageStates = config.pageStates || {};

  if (!matchesRoute || !hasSelector || !getRoots || !hasDebugOrQAMode || !readConnectionPosture
    || !shouldPrefetchRuntimeResources || !extractDynamicImportSpecifier || !moduleSpecifierToUrl
    || !ensureResourceHint || !isRuntimeResourceCached || !requestServiceWorkerPrefetch
    || !requestServiceWorkerCacheSummary || !refreshRegionProfiles || !setPageState) {
    throw new Error('[module-loader] createModuleLoader requires site scheduling and refresh hooks.');
  }

  let mountBatchDepth = 0;
  let tokenFlushScheduled = false;
  let activeResourceProbes = 0;
  const queuedResourceProbes = [];

  function drainResourceProbeQueue() {
    while (activeResourceProbes < resourceProbeConcurrency && queuedResourceProbes.length) {
      const job = queuedResourceProbes.shift();
      activeResourceProbes += 1;
      Promise.resolve()
        .then(job.run)
        .then(job.resolve, job.reject)
        .finally(() => {
          activeResourceProbes -= 1;
          drainResourceProbeQueue();
        });
    }
  }

  function withResourceProbeSlot(run) {
    return new Promise((resolve, reject) => {
      queuedResourceProbes.push({ run, resolve, reject });
      drainResourceProbeQueue();
    });
  }

  function beginMountBatch() {
    mountBatchDepth += 1;
    if (mountBatchDepth === 1) {
      writeDatasetValue(html, 'spwRuntimeMountBatch', 'active');
    }
  }

  function endMountBatch(ctx) {
    if (mountBatchDepth <= 0) return;
    mountBatchDepth -= 1;
    if (mountBatchDepth === 0) {
      writeDatasetValue(html, 'spwRuntimeMountBatch', null);
      flushRuntimeTokenUpdate(ctx);
    }
  }

  function resetMountBatchState() {
    mountBatchDepth = 0;
    tokenFlushScheduled = false;
    writeDatasetValue(html, 'spwRuntimeMountBatch', null);
  }

  function mountModuleDefinition(def, mod, ctx, root) {
    if (typeof def?.mount === 'function') {
      return def.mount(mod, ctx, root);
    }

    const resolved = resolveModuleMount(mod);
    if (!resolved?.fn) return undefined;
    const result = resolved.fn(ctx, root);
    // Canonical module exports may declare refresh beside mount. Preserve a
    // mount-returned refresh when present; otherwise attach the export-level
    // refresh promised by module-export-contract.js.
    // Catalog adapters (def.mount) already return full handles and skip this path.
    if (typeof resolved.surface?.refresh !== 'function') return result;
    return Promise.resolve(result).then((mounted) => {
      const handle = normalizeMountHandle(mounted);
      const exportRefresh = (nextCtx) => resolved.surface.refresh(nextCtx, root);
      return {
        cleanup: handle.cleanup,
        refresh: handle.refresh || exportRefresh,
      };
    });
  }

  function flushRuntimeTokenUpdate(ctx) {
    tokenFlushScheduled = false;
    if (!ctx) return;
    updateRuntimeStateTokens(ctx);
  }

  function scheduleRuntimeTokenUpdate(ctx) {
    if (!ctx) return;
    if (mountBatchDepth > 0) return;
    if (tokenFlushScheduled) return;
    tokenFlushScheduled = true;
    queueMicrotask(() => flushRuntimeTokenUpdate(ctx));
  }

function normalizeModuleTimingStage(stage = 'scheduled') {
  return MODULE_TIMING_STAGES.includes(stage) ? stage : 'scheduled';
}

function pushModuleLifecycleStage(record, stage, detail = {}) {
  if (!record) return record;
  const normalizedStage = normalizeModuleTimingStage(stage);
  const at = Math.round(detail.at ?? performance.now());
  if (!Array.isArray(record.lifecycle)) record.lifecycle = [];
  const last = record.lifecycle[record.lifecycle.length - 1];
  if (last?.stage !== normalizedStage || last?.at !== at) {
    record.lifecycle.push({
      stage: normalizedStage,
      at,
      note: detail.note || '',
    });
  }
  record.stage = normalizedStage;
  record.stageAt = at;
  if (normalizedStage === 'observed') record.observedAt = at;
  if (normalizedStage === 'settled') record.settledAt = at;
  return record;
}

function emitModuleLifecycle(ctx, record, stage, detail = {}) {
  pushModuleLifecycleStage(record, stage, detail);
  ctx?.bus?.emit?.('spw:module-lifecycle', {
    id: record?.id || null,
    baseId: record?.baseId || null,
    layer: record?.layer || null,
    stage: record?.stage || stage,
    at: record?.stageAt || Math.round(performance.now()),
    note: detail.note || '',
    route: ctx?.route || null,
    root: record?.root || null,
  });
  return record;
}

function summarizeModuleLifecycle(record) {
  const lifecycle = Array.isArray(record?.lifecycle) ? record.lifecycle : [];
  return lifecycle.map((entry) => entry.stage).join(' > ');
}

function normalizeModuleIntentValue(value) {
  if (value == null) return [];
  const values = Array.isArray(value) ? value : String(value).split(/[\s,]+/);
  return values.map(normalizeRuntimeToken).filter(Boolean);
}

function summarizeModuleIntentValue(value, separator = '|') {
  return normalizeModuleIntentValue(value).join(separator);
}

function snapshotModuleTimingStages(ctx) {
  if (!ctx) {
    return {
      stages: [],
      counts: {},
      latest: null,
      records: [],
      generatedAt: Date.now(),
    };
  }

  const records = snapshotRuntimeModules(ctx).map((record) => ({
    ...record,
    lifecycle: Array.isArray(ctx.registry.get(record.id)?.lifecycle)
      ? ctx.registry.get(record.id).lifecycle.map((entry) => ({ ...entry }))
      : [],
    stage: ctx.registry.get(record.id)?.stage || (record.status === 'mounted'
      ? 'observed'
      : record.status === 'failed'
        ? 'failed'
        : record.status === 'loading'
          ? 'loading'
          : 'scheduled'),
  }));

  const counts = MODULE_TIMING_STAGES.reduce((acc, stage) => {
    acc[stage] = 0;
    return acc;
  }, {});

  for (const record of records) {
    const stage = normalizeModuleTimingStage(record.stage);
    counts[stage] = (counts[stage] || 0) + 1;
  }

  const latest = records.at(-1) || null;

  return {
    stages: MODULE_TIMING_STAGES.map((stage) => ({
      stage,
      count: counts[stage] || 0,
    })),
    counts,
    latest: latest ? {
      id: latest.id,
      baseId: latest.baseId,
      status: latest.status,
      stage: latest.stage,
      lifecycle: latest.lifecycle,
      loadMs: latest.loadMs,
      mountMs: latest.mountMs,
      durationMs: latest.durationMs,
      timingArc: latest.timingArc || null,
      effectScope: latest.effectScope || null,
      reason: latest.reason,
    } : null,
    records,
    generatedAt: Date.now(),
  };
}

function findModuleDefinition(id) {
  const key = normalizeRuntimeToken(id);
  return moduleDefs.find((def) => normalizeRuntimeToken(def.id) === key) || null;
}

function getModuleRoots(def, options = {}) {
  if (options.root instanceof HTMLElement) return [options.root];
  if (typeof options.root === 'string') {
    const root = safeQuery(options.root);
    return root ? [root] : [];
  }
  return getRoots(def);
}

function listModuleDefinitions(ctx) {
  return moduleDefs.map((def) => {
    const effectiveWhen = ctx ? getEffectiveMountWhen(def, ctx) : (def.when || mountWhen.IMMEDIATE);
    const record = ctx?.registry?.get(def.id);
    return {
      id: def.id,
      layer: def.layer,
      requestedWhen: def.when || mountWhen.IMMEDIATE,
      effectiveWhen,
      route: def.route || null,
      features: normalizeFeatureRequirements(def.features),
      selector: def.selector || '',
      rootMode: def.rootMode || 'single',
      evaluates: inferModuleDimensions(def),
      timingArc: def.timingArc || null,
      effectScope: normalizeModuleIntentValue(def.effectScope),
      describes: def.describes || null,
      updates: normalizeModuleUpdates(def.updates),
      updatesSummary: summarizeModuleUpdates(def.updates),
      updatesDescribe: describeModuleUpdates(def.updates),
      reason: ctx ? describeMountReason(def, ctx, null, effectiveWhen) : (def.reason || ''),
      status: record?.status || 'defined',
    };
  });
}

function snapshotRuntimeModules(ctx) {
  if (!ctx) return [];
  return ctx.registry.values().map((record) => ({
    id: record.id,
    baseId: record.baseId || record.id,
    layer: record.layer,
    evaluates: record.evaluates,
    requestedWhen: record.requestedWhen,
    effectiveWhen: record.effectiveWhen,
    status: record.status,
    reason: record.reason,
    describes: record.describes || null,
    updates: normalizeModuleUpdates(record.updates),
    updatesSummary: summarizeModuleUpdates(record.updates),
    updatesDescribe: describeModuleUpdates(record.updates),
    timingArc: record.timingArc || null,
    effectScope: normalizeModuleIntentValue(record.effectScope),
    stage: record.stage || record.status || 'scheduled',
    stageAt: record.stageAt || null,
    lifecycle: Array.isArray(record.lifecycle)
      ? record.lifecycle.map((entry) => ({ ...entry }))
      : [],
    mountedAt: record.mountedAt,
    loadMs: record.loadMs,
    mountMs: record.mountMs,
    durationMs: record.durationMs,
    root: record.root instanceof HTMLElement
      ? record.root.id || record.root.dataset.spwRegionKey || record.root.tagName.toLowerCase()
      : 'document',
    error: record.error?.message || null,
  }));
}

/**
 * Turns a module record into a portable "runtime spell" expression.
 * This gives modules cross-page, serializable, prompt-friendly value
 * consistent with the existing spell / grounded interaction model.
 */
function moduleRecordToSpellExpression(record) {
  if (!record) return null;
  const base = record.describes || record.reason || record.baseId || record.id;
  const updatesPart = formatModuleUpdatesSpell(record.updates);
  const effectScope = normalizeModuleIntentValue(record.effectScope);
  const effectPart = effectScope.length
    ? `{effects:${effectScope.join('+')}}`
    : '';
  const arcPart = record.timingArc ? `{arc:${record.timingArc}}` : '';
  const lifecyclePart = record.stage ? `{stage:${record.stage}}` : '';
  const timingPart = record.durationMs
    ? `[${Math.round(record.durationMs)}ms]`
    : '';
  const statusPart = record.status ? `:${record.status}` : '';

  // Produce something like: #>module:cauldron{updates:data-spw-cauldron}[120ms]:mounted
  return `#>${record.layer || 'module'}:${record.baseId || record.id}${updatesPart}${effectPart}${arcPart}${lifecyclePart}${timingPart}${statusPart} ${base}`.trim();
}

/**
 * Lightweight snapshot of the current runtime as a "module spellbook".
 * Useful for serialization into notes, prompts, recordings, or cross-page restoration.
 */
function snapshotRuntimeAsSpellbook(ctx) {
  if (!ctx) return { modules: [], activeLayers: '', generatedAt: Date.now() };

  const modules = snapshotRuntimeModules(ctx).map((rec) => ({
    ...rec,
    spell: moduleRecordToSpellExpression(rec),
  }));

  // Capture live token state for rich serialization (prompts, recordings, notes)
  const tokenSnapshot = {
    enhancementIntensity: parseFloat(html?.style.getPropertyValue('--spw-runtime-enhancement-intensity') || '0'),
    featureIntensity: parseFloat(html?.style.getPropertyValue('--spw-runtime-feature-intensity') || '0'),
    layerCount: parseInt(html?.style.getPropertyValue('--spw-runtime-layer-count') || '0', 10),
    avgModuleMs: parseInt(html?.style.getPropertyValue('--spw-runtime-avg-module-ms') || '0', 10),
  };

  return {
    modules,
    activeLayers: html?.dataset?.spwActiveLayers || '',
    tokens: tokenSnapshot,
    generatedAt: Date.now(),
    route: ctx.route,
  };
}

async function mountModuleById(id, ctx, options = {}) {
  if (!ctx) return null;
  const def = findModuleDefinition(id);
  if (!def) return null;
  const roots = getModuleRoots(def, options);

  if (!roots.length || def.rootMode === 'single') {
    return mountDefinition(def, ctx, roots[0] || null, 0);
  }

  const records = [];
  for (const [index, root] of roots.entries()) {
    records.push(await mountDefinition(def, ctx, root, index));
  }
  return records;
}

async function unmountModuleRecord(record, ctx) {
  if (!record || record.status !== 'mounted') return false;

  pushModuleLifecycleStage(record, 'unmounting', { note: 'unmounting module' });
  emitModuleLifecycle(ctx, record, 'unmounting', {
    at: Math.round(performance.now()),
    note: 'unmounting module',
  });

  if (typeof record.cleanup === 'function') {
    try {
      await record.cleanup();
    } catch (err) {
      logger?.error(
        `module unmount failed: ${record.id}`,
        { message: err?.message || String(err) },
        logRelationships.LIFECYCLE,
      );
    }
  }

  record.cleanup = null;
  record.refresh = null;
  record.status = 'unmounted';
  record.unmountedAt = Math.round(performance.now());

  pushModuleLifecycleStage(record, 'unmounted', { note: 'unmount complete' });
  emitModuleLifecycle(ctx, record, 'unmounted', {
    at: record.unmountedAt,
    note: 'unmount complete',
  });

  if (record.root) {
    annotateModuleTarget(record.root, record);
  }

  ctx.registry.remove(record.id);

  scheduleRuntimeTokenUpdate(ctx);
  return true;
}

async function unmountModuleById(id, ctx, options = {}) {
  if (!ctx || !id) return false;
  const records = Array.from(ctx.registry.values()).filter(
    (record) => (record.baseId === id || record.id === id) && record.status === 'mounted'
  );
  if (!records.length) return false;

  let unmountedAny = false;
  for (const record of records) {
    const ok = await unmountModuleRecord(record, ctx);
    if (ok) unmountedAny = true;
  }
  return unmountedAny;
}

async function unmountAllModules(ctx) {
  if (!ctx) return 0;
  const records = Array.from(ctx.registry.values()).filter(
    (record) => record.status === 'mounted'
  );
  let count = 0;
  for (const record of records) {
    const ok = await unmountModuleRecord(record, ctx);
    if (ok) count += 1;
  }
  return count;
}

function makeRecordId(def, root = null, index = 0) {
  if (!root || root === document.body) return def.id;
  const rootId = root.id || root.getAttribute('data-spw-region-key') || root.getAttribute('data-spw-id') || root.getAttribute('data-spw-kind') || index;
  return `${def.id}::${String(rootId)}`;
}

function resolvePageCategory(ctx) {
  return ctx?.pageCategory || readPageCategory(ctx?.body);
}

function getEffectiveMountWhen(def, ctx) {
  const baseWhen = def.when || mountWhen.IMMEDIATE;
  const moduleOverride = ctx.runtimePolicy.timingByModule.get(def.id);
  if (moduleOverride) return moduleOverride;

  const category = resolvePageCategory(ctx);
  const categoryWhen = resolveCategoryMountWhen(def, baseWhen, category, ctx);
  if (categoryWhen) return applyTimingPolicy(def, ctx, categoryWhen);

  return applyTimingPolicy(def, ctx, baseWhen);
}

function resolveCategoryMountWhen(def, baseWhen, category, ctx) {
  if (isOrientationOnlyPage(category) && def.layer === moduleLayers.ENHANCEMENT && baseWhen === mountWhen.IMMEDIATE) {
    const selector = String(def.selector || '');
    const broad = !selector || /html|body|\.frame-sigil|\.operator-chip|\.spw-delimiter/.test(selector);
    if (broad && def.id !== 'sigil-anatomy') return mountWhen.VISIBLE;
  }
  if (isLiteracyPage(category) && def.id === 'pronunciation-hints' && baseWhen === mountWhen.IDLE) {
    const arc = ctx?.html?.dataset?.spwAttentionArc || '';
    if (arc === 'dwell' || arc === 'echo' || arc === 'return') return mountWhen.VISIBLE;
  }
  return null;
}

function applyTimingPolicy(def, ctx, baseWhen) {
  switch (ctx.runtimePolicy.timing) {
    case 'eager':
      if (baseWhen === mountWhen.IDLE || baseWhen === mountWhen.VISIBLE || baseWhen === mountWhen.INTERACTION) {
        return mountWhen.IMMEDIATE;
      }
      return baseWhen;
    case 'defer':
      if (def.layer === moduleLayers.CORE || baseWhen === mountWhen.REGION) return baseWhen;
      if (baseWhen === mountWhen.IMMEDIATE) return def.selector ? mountWhen.VISIBLE : mountWhen.IDLE;
      return baseWhen;
    case 'quiet':
      if (def.layer === moduleLayers.CORE || baseWhen === mountWhen.REGION) return baseWhen;
      return mountWhen.IDLE;
    case 'manual':
      return def.layer === moduleLayers.CORE ? baseWhen : 'manual';
    default:
      return baseWhen;
  }
}

function describeMountConsequence(def) {
  const cost = def.cost || {};
  const commitment = cost.commitment || 'project';
  const spend = cost.spend || 'none';
  const updatesSummary = summarizeModuleUpdates(def.updates);
  const remain = commitment === 'authored'
    ? 'geometry-stays-authored'
    : commitment === 'residue'
      ? 'leaves-residue'
      : commitment === 'listen'
        ? 'handlers-only'
        : 'projects-state';
  return `${remain} spend:${spend}${updatesSummary ? ` updates:{${updatesSummary}}` : ''}`;
}

function describeMountReason(def, ctx, root = null, effectiveWhen = getEffectiveMountWhen(def, ctx)) {
  const category = describePageCategory(resolvePageCategory(ctx));
  const arc = ctx?.html?.dataset?.spwAttentionArc || '';
  const cost = def.cost ? `${def.cost.commitment || 'project'}/${def.cost.spend || 'none'}` : '';
  // Prefer explicit, semantically meaningful description when provided by the module author.
  if (def.describes) {
    const base = def.reason || `${effectiveWhen} ${def.layer}`;
    const updatesSummary = summarizeModuleUpdates(def.updates);
    const updates = updatesSummary ? ` updates:{${updatesSummary}}` : '';
    const timing = def.timingArc ? ` timing:${def.timingArc}` : '';
    const effects = def.effectScope
      ? ` effects:[${summarizeModuleIntentValue(def.effectScope)}]`
      : '';
    const page = category ? ` page:{${category}}` : '';
    const attention = arc ? ` arc:${arc}` : '';
    const budget = cost ? ` cost:${cost}` : '';
    return `${base} ${def.describes}${updates}${timing}${effects}${page}${attention}${budget}`;
  }

  const routeReason = def.route
    ? `route:${Array.isArray(def.route) ? def.route.join('|') : def.route}`
    : 'route:any';
  const selectorReason = def.selector ? `selector:${def.selector}` : 'selector:document';
  const rootReason =
    root instanceof HTMLElement
      ? `root:${root.id || root.dataset.spwRegionKey || root.dataset.spwKind || root.tagName.toLowerCase()}`
      : 'root:document';
  return def.reason || `${effectiveWhen} ${def.layer} ${routeReason} ${selectorReason} ${rootReason}`;
}

function inferModuleDimensions(def) {
  const text = `${def.id || ''} ${def.selector || ''} ${def.layer || ''}`.toLowerCase();
  const dimensions = new Set([def.layer]);

  if (/nav|route|link|hash|frame/.test(text)) dimensions.add('routing');
  if (/semantic|operator|topic|guide|annotation|brace/.test(text)) dimensions.add('semantics');
  if (/semantic|component|genome|kind|role|slot|density/.test(text)) dimensions.add('semantic-density');
  if (/layout|shift|region|canvas|svg|image|logo|promo|wonder/.test(text)) dimensions.add('visual');
  if (/canvas|svg|image|logo|promo|wonder|visual|motif/.test(text)) dimensions.add('visual-model');
  if (/layout|space|region|surface|grid|frame|fold/.test(text)) dimensions.add('spacing-semantics');
  if (/settings|tune|local|memory|storage|pwa/.test(text)) dimensions.add('state');
  if (/spell|haptic|gesture|experiential|interaction|pointer|mode/.test(text)) dimensions.add('interaction');
  if (/payment|service|rpg|blog|media|design/.test(text)) dimensions.add('surface');
  if (/lifecycle|phase|state|beat|observation|cauldron|region|page-state/.test(text)) dimensions.add('lifecycle');
  if (/qa|agent|debug|inspect|beat|observation/.test(text)) dimensions.add('qa-observation');

  if (def.evaluates) {
    String(def.evaluates)
      .split(/[\s,]+/)
      .map(normalizeRuntimeToken)
      .filter(Boolean)
      .forEach((token) => dimensions.add(token));
  }

  return [...dimensions].filter(Boolean).join(' ');
}

function shouldScheduleDefinition(def, ctx, expectedWhen = null) {
  const id = normalizeRuntimeToken(def.id);
  const effectiveWhen = getEffectiveMountWhen(def, ctx);
  const routeMatch = matchesRoute(def);
  const selectorMatch = hasSelector(def);
  const featureMatch = resolveFeatureMatch(def, ctx);
  const categoryMatch = matchesPageCategory(def, resolvePageCategory(ctx));
  const onlyMatch = !ctx.runtimePolicy.only.size || ctx.runtimePolicy.only.has(id);
  const skipMatch = ctx.runtimePolicy.skip.has(id);
  const whenMatch = expectedWhen ? effectiveWhen === expectedWhen : effectiveWhen !== 'manual';

  // Enhanced debug/QA module gating (supports observation-beats, layout-shift-audit, future agent surfaces)
  const debugOnly = !!def.debugOnly;
  const debugActive = hasDebugOrQAMode(ctx);
  const debugMatch = !debugOnly || debugActive;

  const allowed = routeMatch && selectorMatch && featureMatch && categoryMatch && onlyMatch && !skipMatch && whenMatch && debugMatch;

  if (!allowed && ctx.runtimePolicy.audit) {
    const reason = [
      routeMatch ? '' : 'route-mismatch',
      selectorMatch ? '' : 'selector-missing',
      featureMatch ? '' : 'feature-mismatch',
      categoryMatch ? '' : 'page-category-mismatch',
      onlyMatch ? '' : 'outside-module-only',
      skipMatch ? 'module-skip' : '',
      whenMatch ? '' : `waiting-for-${effectiveWhen}`,
      debugOnly && !debugActive ? 'debug-only-gated' : '',
    ].filter(Boolean).join(' ') || 'not-scheduled';
    const auditKey = `${id}:${expectedWhen || 'any'}:${reason}`;
    if (ctx.moduleSkipAuditKeys.has(auditKey)) return allowed;
    ctx.moduleSkipAuditKeys.add(auditKey);
    recordModuleAudit(ctx, {
      id: def.id,
      layer: def.layer,
      requestedWhen: def.when || mountWhen.IMMEDIATE,
      effectiveWhen,
      status: 'skipped',
      reason,
      timingArc: def.timingArc || null,
      effectScope: normalizeModuleIntentValue(def.effectScope),
    });
  }

  return allowed;
}

function annotateModuleTarget(target, record) {
  if (!(target instanceof HTMLElement)) return;
  writeDatasetValue(target, 'spwModule', record.baseId);
  writeDatasetValue(target, 'spwModuleId', record.id);
  writeDatasetValue(target, 'spwModuleLayer', record.layer);
  writeDatasetValue(target, 'spwModuleWhen', record.effectiveWhen);
  writeDatasetValue(target, 'spwModuleStatus', record.status);
  writeDatasetValue(target, 'spwModuleLifecycleStage', record.stage || record.status);
  writeDatasetValue(target, 'spwModuleReason', record.reason);
  writeDatasetValue(target, 'spwModuleEvaluates', record.evaluates);
  writeDatasetValue(target, 'spwModuleTimingArc', record.timingArc || null);
  writeDatasetValue(target, 'spwModuleEffectScope', record.effectScope || null);
  writeDatasetValue(target, 'spwModuleTriggerStatus', record.status);
  writeDatasetValue(target, 'spwModuleLifecycle', summarizeModuleLifecycle(record));

  // New semantically meaningful fields for clarity, inspectability, and serialization as "module spells"
  if (record.describes) {
    writeDatasetValue(target, 'spwModuleDescribes', record.describes);
  }
  annotateModuleUpdatesTarget(target, record.updates);

  writeDatasetValue(target, 'spwModuleHydration', record.status === 'mounted' ? 'ready' : record.status);
  if (Number.isFinite(record.durationMs)) {
    writeDatasetValue(target, 'spwModuleDurationMs', String(Math.round(record.durationMs)));
  }
}

function annotateModuleTrigger(target, def, ctx, effectiveWhen, status = 'queued') {
  if (!(target instanceof HTMLElement)) return;
  const reason = describeMountReason(def, ctx, target, effectiveWhen);
  writeDatasetValue(target, 'spwModuleTrigger', def.id);
  writeDatasetValue(target, 'spwModuleTriggerLayer', def.layer);
  writeDatasetValue(target, 'spwModuleTriggerWhen', effectiveWhen);
  writeDatasetValue(target, 'spwModuleTriggerStatus', status);
  writeDatasetValue(target, 'spwModuleTriggerReason', reason);
  writeDatasetValue(target, 'spwModuleTriggerTimingArc', def.timingArc || null);
  writeDatasetValue(target, 'spwModuleTriggerEffectScope', normalizeModuleIntentValue(def.effectScope));
  writeDatasetValue(target, 'spwFeatureMountTrigger', `${def.id}:${effectiveWhen}`);
  if (def.selector) writeDatasetValue(target, 'spwModuleTriggerSelector', def.selector);
}

function updateRuntimeStateTokens(ctx) {
  if (!ctx || !html) return;

  const records = Array.from(ctx.registry.values());
  const activeLayers = new Set();
  let hasEnhancement = false;
  let hasFeature = false;
  let totalDuration = 0;
  let count = 0;

  for (const r of records) {
    if (r.status === 'mounted' || r.status === 'loading') {
      activeLayers.add(r.layer);
      if (r.layer === moduleLayers.ENHANCEMENT) hasEnhancement = true;
      if (r.layer === moduleLayers.FEATURE) hasFeature = true;
    }
    if (Number.isFinite(r.durationMs)) {
      totalDuration += r.durationMs;
      count++;
    }
  }

  const layersList = [...activeLayers].sort();
  if (!layersList.length) layersList.push('core');
  const layersValue = layersList.join(' ');
  writeDatasetValue(html, 'spwActiveLayers', layersList);

  const enhancementIntensity = hasEnhancement ? 0.92 : 0.32;
  const featureIntensity = hasFeature ? 0.78 : 0.22;
  const layerCount = activeLayers.size || 1;
  const avgModuleTime = count > 0 ? Math.round(totalDuration / count) : 0;

  html.style.setProperty('--spw-runtime-enhancement-intensity', enhancementIntensity.toFixed(2));
  html.style.setProperty('--spw-runtime-feature-intensity', featureIntensity.toFixed(2));
  html.style.setProperty('--spw-runtime-layer-count', String(layerCount));
  if (avgModuleTime > 0) {
    html.style.setProperty('--spw-runtime-avg-module-ms', String(avgModuleTime));
  }

  // Site rhythm tokens for the visual ornament (derived from the same load + layer data).
  // Tempo is livelier when recent module work is fast / frequent; density tracks active surface complexity.
  const rhythmBase = avgModuleTime > 0 ? avgModuleTime : 180;
  const rhythmTempo = Math.max(0.35, Math.min(3.2, 1400 / rhythmBase));
  const rhythmDensity = Math.max(0.25, Math.min(1.6, 0.28 + layerCount * 0.19));
  html.style.setProperty('--spw-site-rhythm-tempo', rhythmTempo.toFixed(2));
  html.style.setProperty('--spw-site-rhythm-density', rhythmDensity.toFixed(2));
  writeDatasetValue(html, 'spwSiteRhythm', activeLayers.size > 0 ? 'active' : 'quiet');

  ctx.bus.emit('spw:runtime-tokens-updated', {
    activeLayers: layersValue,
    enhancementIntensity,
    featureIntensity,
    layerCount,
    avgModuleTime,
  });
}

function syncActiveModuleLayers(ctx) {
  scheduleRuntimeTokenUpdate(ctx);
}

function syncRuntimeModuleSummary(ctx, record) {
  const records = ctx.registry.values();
  const mounted = records.filter((entry) => entry.status === 'mounted').map((entry) => entry.baseId || entry.id);
  const failed = records.filter((entry) => entry.status === 'failed').map((entry) => entry.baseId || entry.id);
  const timingSnapshot = snapshotModuleTimingStages(ctx);
  const stageSummary = timingSnapshot.stages
    .map(({ stage, count }) => `${stage}:${count}`)
    .join(' ');

  writeDatasetValue(html, 'spwRuntimeLastModule', record.baseId || record.id);
  writeDatasetValue(html, 'spwRuntimeLastModuleStatus', record.status);
  writeDatasetValue(html, 'spwRuntimeLastModuleStage', record.stage || record.status);
  writeDatasetValue(html, 'spwRuntimeLastModuleWhen', record.effectiveWhen);
  writeDatasetValue(html, 'spwRuntimeLastModuleReason', record.reason);
  writeDatasetValue(html, 'spwRuntimeLastModuleEvaluates', record.evaluates);
  writeDatasetValue(html, 'spwRuntimeLastModuleDescribes', record.describes || null);
  writeDatasetValue(html, 'spwRuntimeLastModuleTimingArc', record.timingArc || null);
  writeDatasetValue(html, 'spwRuntimeLastModuleEffectScope', record.effectScope || null);
  writeDatasetValue(html, 'spwRuntimeMountedModules', new Set(mounted));
  writeDatasetValue(html, 'spwRuntimeFailedModules', new Set(failed));
  writeDatasetValue(html, 'spwRuntimeModuleCount', String(mounted.length));
  writeDatasetValue(html, 'spwRuntimeModuleLifecycleStages', stageSummary);
  writeDatasetValue(html, 'spwRuntimeModuleLifecycleSummary', timingSnapshot.latest
    ? `${timingSnapshot.latest.baseId || timingSnapshot.latest.id}:${timingSnapshot.latest.stage}`
    : null);
  writeDatasetValue(html, 'spwRuntimeModuleLifecycleLatest', timingSnapshot.latest?.lifecycle
    ? timingSnapshot.latest.lifecycle.map((entry) => entry.stage).join(' > ')
    : null);

  if (body) {
    writeDatasetValue(body, 'spwRuntimeLastModule', record.baseId || record.id);
    writeDatasetValue(body, 'spwRuntimeLastModuleStatus', record.status);
    writeDatasetValue(body, 'spwRuntimeLastModuleStage', record.stage || record.status);
    writeDatasetValue(body, 'spwRuntimeLastModuleWhen', record.effectiveWhen);
    writeDatasetValue(body, 'spwRuntimeLastModuleReason', record.reason);
    writeDatasetValue(body, 'spwRuntimeLastModuleEvaluates', record.evaluates);
    writeDatasetValue(body, 'spwRuntimeLastModuleDescribes', record.describes || null);
    writeDatasetValue(body, 'spwRuntimeLastModuleTimingArc', record.timingArc || null);
    writeDatasetValue(body, 'spwRuntimeLastModuleEffectScope', record.effectScope || null);
    writeDatasetValue(body, 'spwRuntimeModuleCount', String(mounted.length));
    writeDatasetValue(body, 'spwRuntimeModuleLifecycleStages', stageSummary);
    writeDatasetValue(body, 'spwRuntimeModuleLifecycleSummary', timingSnapshot.latest
      ? `${timingSnapshot.latest.baseId || timingSnapshot.latest.id}:${timingSnapshot.latest.stage}`
      : null);
    writeDatasetValue(body, 'spwRuntimeModuleLifecycleLatest', timingSnapshot.latest?.lifecycle
      ? timingSnapshot.latest.lifecycle.map((entry) => entry.stage).join(' > ')
      : null);
  }
}

function recordModuleAudit(ctx, entry) {
  const record = {
    at: Math.round(performance.now()),
    route: ctx.route,
    ...entry,
  };
  ctx.moduleAudit.push(record);
  if (ctx.moduleAudit.length > 160) ctx.moduleAudit.shift();
  if (ctx.runtimePolicy.audit) {
  const summary = [
    record.status || 'audit',
    record.stage ? `stage=${record.stage}` : '',
    record.baseId || record.id,
    record.layer ? `layer=${record.layer}` : '',
    record.effectiveWhen ? `when=${record.effectiveWhen}` : '',
      record.durationMs != null ? `duration=${record.durationMs}ms` : '',
      record.reason ? `reason=${record.reason}` : '',
    ].filter(Boolean).join(' | ');
    console.info(`[${logLabel}] module audit | ${summary}`, record);
  }
  return record;
}

function buildLoadDiscoverySnapshot(ctx) {
  if (!ctx) return null;
  const timingStages = snapshotModuleTimingStages(ctx);
  return {
    policies: [...timingPolicies],
    current: ctx.runtimePolicy,
    connectionPosture: html?.dataset?.spwConnectionPosture || readConnectionPosture(),
    prefetchMode: html?.dataset?.spwPrefetchMode || 'unknown',
    resources: snapshotRuntimeResourceReadiness(ctx),
    considered: listModuleDefinitions(ctx),
    mounted: snapshotRuntimeModules(ctx),
    updateConflicts: findModuleUpdateConflicts(listModuleDefinitions(ctx)),
    lifecycle: timingStages,
    skipped: [...(ctx.moduleSkipAuditKeys || [])],
  };
}

function snapshotRuntimeResourceReadiness(ctx) {
  if (!ctx) return [];
  return [...ctx.resourceReadiness.values()].map((entry) => ({ ...entry }));
}

function buildRuntimeResourceEntry(def, effectiveWhen, rel) {
  const specifier = extractDynamicImportSpecifier(def);
  const href = moduleSpecifierToUrl(specifier);
  if (!href) return null;
  return {
    id: def.id,
    layer: def.layer,
    effectiveWhen,
    timingArc: def.timingArc || null,
    effectScope: normalizeModuleIntentValue(def.effectScope),
    rel,
    href,
    status: 'discovered',
    cached: false,
  };
}

async function syncRuntimeResourceEntry(ctx, entry) {
  if (!ctx || !entry?.href) return null;
  const cached = await withResourceProbeSlot(() => isRuntimeResourceCached(entry.href));
  return {
    ...entry,
    cached,
    status: cached ? 'cached' : entry.status,
  };
}

async function prefetchRuntimeResources(ctx, defs, expectedWhen, rel) {
  if (!ctx) return [];
  const candidates = defs
    .filter((def) => shouldScheduleDefinition(def, ctx, expectedWhen))
    .map((def) => buildRuntimeResourceEntry(def, expectedWhen, rel))
    .filter(Boolean);

  if (!candidates.length) return [];

  const canPrefetch = shouldPrefetchRuntimeResources(ctx);
  const measureName = `spw:runtime-resource-prefetch:${expectedWhen}`;
  performance.mark(`${measureName}:start`);
  const inspected = await Promise.all(
    candidates.map((entry) => syncRuntimeResourceEntry(ctx, entry)),
  );
  const warmed = [];

  for (const current of inspected) {
    if (!current) continue;
    if (canPrefetch && !current.cached) {
      const hinted = ensureResourceHint(current.href, rel);
      current.status = hinted ? 'prefetched' : 'hint-present';
    } else if (!canPrefetch) {
      current.status = 'deferred';
    }
    ctx.resourceReadiness.set(current.id, current);
    warmed.push(current);
  }

  performance.mark(`${measureName}:complete`);
  performance.measure(measureName, `${measureName}:start`, `${measureName}:complete`);

  writeDatasetValue(html, 'spwConnectionPosture', readConnectionPosture());
  writeDatasetValue(html, 'spwPrefetchMode', canPrefetch ? 'selective' : 'deferred');
  writeDatasetValue(html, 'spwPrefetchCount', String(warmed.filter((entry) => entry.status === 'prefetched').length));
  writeDatasetValue(html, 'spwCachedModuleCount', String(warmed.filter((entry) => entry.cached).length));
  if (canPrefetch) {
    const sentToServiceWorker = requestServiceWorkerPrefetch(
      warmed
        .filter((entry) => !entry.cached)
        .map((entry) => entry.href)
    );
    writeDatasetValue(html, 'spwServiceWorkerPrefetch', sentToServiceWorker ? 'requested' : 'unavailable');
  }

  ctx.bus.emit('spw:runtime-resources-profiled', {
    route: ctx.route,
    expectedWhen,
    rel,
    connectionPosture: readConnectionPosture(),
    prefetchMode: html?.dataset?.spwPrefetchMode || 'unknown',
    probeConcurrency: resourceProbeConcurrency,
    resources: warmed,
  });

  return warmed;
}

function initRuntimeResourceAwareness(ctx) {
  if (!ctx) return () => {};

  const handleServiceWorkerMessage = (event) => {
    if (event.data?.type === 'SPW_CACHE_SUMMARY_RESULT') {
      const caches = Array.isArray(event.data.caches) ? event.data.caches : [];
      const entryCount = caches.reduce((sum, entry) => sum + (Number.parseInt(entry.count, 10) || 0), 0);
      writeDatasetValue(html, 'spwServiceWorkerCacheCount', String(caches.length));
      writeDatasetValue(html, 'spwServiceWorkerCacheEntries', String(entryCount));
      writeDatasetValue(html, 'spwServiceWorkerCacheVersion', event.data.version || null);
      writeDatasetValue(html, 'spwServiceWorkerCacheState', event.data.error ? 'error' : 'reported');
    }

    if (event.data?.type === 'SPW_PREFETCH_URLS_RESULT') {
      const summary = event.data.summary || {};
      writeDatasetValue(html, 'spwServiceWorkerPrefetchState', 'reported');
      writeDatasetValue(html, 'spwServiceWorkerPrefetchRequested', String(summary.requested || 0));
      writeDatasetValue(html, 'spwServiceWorkerPrefetchCached', String(summary.cached || 0));
    }
  };

  const syncConnection = () => {
    writeDatasetValue(html, 'spwConnectionPosture', readConnectionPosture());
    writeDatasetValue(html, 'spwPrefetchMode', shouldPrefetchRuntimeResources(ctx) ? 'eligible' : 'conservative');
    ctx.bus.emit('spw:runtime-connection', {
      route: ctx.route,
      connectionPosture: html?.dataset?.spwConnectionPosture || 'unknown',
      prefetchMode: html?.dataset?.spwPrefetchMode || 'unknown',
    });
  };

  syncConnection();
  requestServiceWorkerCacheSummary();
  navigator.serviceWorker?.addEventListener?.('message', handleServiceWorkerMessage);
  window.addEventListener('online', syncConnection);
  window.addEventListener('offline', syncConnection);
  navigator.connection?.addEventListener?.('change', syncConnection);

  return () => {
    navigator.serviceWorker?.removeEventListener?.('message', handleServiceWorkerMessage);
    window.removeEventListener('online', syncConnection);
    window.removeEventListener('offline', syncConnection);
    navigator.connection?.removeEventListener?.('change', syncConnection);
  };
}

async function mountDefinition(def, ctx, root = null, index = 0) {
  const recordId = makeRecordId(def, root, index);
  const effectiveWhen = getEffectiveMountWhen(def, ctx);
  const reason = describeMountReason(def, ctx, root, effectiveWhen);
  const evaluates = inferModuleDimensions(def);
  const effectScope = normalizeModuleIntentValue(def.effectScope);
  const scheduledAt = Math.round(performance.now());

  if (ctx.registry.has(recordId)) return ctx.registry.get(recordId);

  const record = ctx.registry.set(recordId, {
    id: recordId,
    baseId: def.id,
    layer: def.layer,
    evaluates,
    requestedWhen: def.when || mountWhen.IMMEDIATE,
    effectiveWhen,
    reason,
    consequence: describeMountConsequence(def),
    describes: def.describes || null,
    updates: normalizeModuleUpdates(def.updates),
    updatesSummary: summarizeModuleUpdates(def.updates),
    updatesDescribe: describeModuleUpdates(def.updates),
    timingArc: def.timingArc || null,
    effectScope: effectScope.length ? effectScope : null,
    status: 'idle',
    stage: 'scheduled',
    stageAt: scheduledAt,
    lifecycle: [{
      stage: 'scheduled',
      at: scheduledAt,
      note: effectiveWhen,
    }],
    cleanup: null,
    refresh: null,
    root,
    mountedAt: null,
    observedAt: null,
    settledAt: null,
    loadMs: null,
    mountMs: null,
    durationMs: null,
    error: null,
  });
  emitModuleLifecycle(ctx, record, 'scheduled', { at: scheduledAt, note: effectiveWhen });
  performance.mark(`spw:module:${def.id}:scheduled`);

  try {
    if (root instanceof HTMLElement) setRegionState(root, regionStates.HYDRATING);

    const startedAt = performance.now();
    performance.mark(`spw:module:${def.id}:start`);
    const loadStartedAt = performance.now();
    annotateModuleTarget(root, {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates,
      effectiveWhen,
      reason,
      timingArc: def.timingArc || null,
      effectScope,
      status: 'loading',
    });
    emitModuleLifecycle(ctx, record, 'loading', { at: loadStartedAt, note: reason });
    recordModuleAudit(ctx, {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates,
      requestedWhen: def.when || mountWhen.IMMEDIATE,
      effectiveWhen,
      status: 'loading',
      reason,
      timingArc: record.timingArc,
      effectScope: record.effectScope,
    });
    performance.mark(`spw:module:${def.id}:load-start`);
    const mod = await def.load();
    const loadEndedAt = performance.now();
    performance.mark(`spw:module:${def.id}:load-end`);
    performance.measure(
      `spw:module:${def.id}:load`,
      `spw:module:${def.id}:load-start`,
      `spw:module:${def.id}:load-end`,
    );
    logger?.debug(
      `module load complete: ${def.id}`,
      { ms: Math.round(loadEndedAt - loadStartedAt) },
      logRelationships.LIFECYCLE,
    );

    const mountStartedAt = performance.now();
    const result = await mountModuleDefinition(def, mod, ctx, root);
    const mountEndedAt = performance.now();
    performance.mark(`spw:module:${def.id}:mount-end`);
    performance.measure(
      `spw:module:${def.id}:mount`,
      `spw:module:${def.id}:load-end`,
      `spw:module:${def.id}:mount-end`,
    );
    const handle = normalizeMountHandle(result);

    Object.assign(record, {
      status: 'mounted',
      cleanup: handle.cleanup,
      refresh: handle.refresh,
      root,
      mountedAt: mountEndedAt,
      observedAt: null,
      settledAt: null,
      loadMs: loadEndedAt - loadStartedAt,
      mountMs: mountEndedAt - mountStartedAt,
      durationMs: mountEndedAt - startedAt,
      error: null,
    });
    emitModuleLifecycle(ctx, record, 'mounted', {
      at: mountEndedAt,
      note: `${Math.round(record.loadMs)}ms load / ${Math.round(record.mountMs)}ms mount`,
    });
    emitModuleLifecycle(ctx, record, 'observed', {
      at: Math.round(performance.now()),
      note: 'runtime summary written',
    });
    performance.mark(`spw:module:${def.id}:observed`);
    annotateModuleTarget(root, record);
    syncRuntimeModuleSummary(ctx, record);
    syncActiveModuleLayers(ctx); // for CSS transitions and attentional timing keyed off active runtime layers

    performance.mark(`spw:module:${def.id}:end`);
    performance.measure(
      `spw:module:${def.id}`,
      `spw:module:${def.id}:start`,
      `spw:module:${def.id}:end`,
    );
    logger?.info(
      `module mounted: ${def.id}`,
      {
        loadMs: Math.round(record.loadMs),
        mountMs: Math.round(record.mountMs),
        durationMs: Math.round(record.durationMs),
      },
      logRelationships.LIFECYCLE,
    );

    recordModuleAudit(ctx, {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates: record.evaluates,
      requestedWhen: record.requestedWhen,
      effectiveWhen,
      status: 'mounted',
      reason,
      describes: record.describes,
      updates: record.updates,
      timingArc: record.timingArc,
      effectScope: record.effectScope,
      loadMs: Math.round(record.loadMs),
      mountMs: Math.round(record.mountMs),
      durationMs: Math.round(record.durationMs),
    });

    if (root instanceof HTMLElement) {
      const state =
        def.layer === moduleLayers.ENHANCEMENT || def.layer === moduleLayers.REGION
          ? regionStates.ENHANCED
          : regionStates.INTERACTIVE;
      setRegionState(root, state);
    }

    ctx.bus.emit('spw:module-mounted', {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates: record.evaluates,
      requestedWhen: def.when || mountWhen.IMMEDIATE,
      effectiveWhen,
      reason,
      describes: record.describes,
      updates: record.updates,
      timingArc: record.timingArc,
      effectScope: record.effectScope,
      route: ctx.route,
      root,
      loadMs: record.loadMs,
      mountMs: record.mountMs,
      durationMs: record.durationMs,
    });

    return record;
  } catch (error) {
    logger?.error(
      `module mount failed: ${def.id}`,
      { message: error?.message || String(error) },
      logRelationships.LIFECYCLE,
    );
    console.warn(`[${logLabel}] module mount failed: ${def.id}`, error);

    const failedAt = Math.round(performance.now());
    Object.assign(record, {
      status: 'failed',
      cleanup: null,
      refresh: null,
      root,
      mountedAt: null,
      loadMs: null,
      mountMs: null,
      durationMs: null,
      error,
    });
    emitModuleLifecycle(ctx, record, 'failed', {
      at: failedAt,
      note: error?.message || String(error),
    });
    performance.mark(`spw:module:${record.id}:failed`);
    annotateModuleTarget(root, record);
    syncRuntimeModuleSummary(ctx, record);
    recordModuleAudit(ctx, {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates: record.evaluates,
      requestedWhen: record.requestedWhen,
      effectiveWhen,
      status: 'failed',
      reason,
      describes: record.describes,
      updates: record.updates,
      timingArc: record.timingArc,
      effectScope: record.effectScope,
      error: error?.message || String(error),
    });

    if (root instanceof HTMLElement) setRegionState(root, regionStates.QUEUED);

    ctx.bus.emit('spw:module-failed', {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates: record.evaluates,
      requestedWhen: def.when || mountWhen.IMMEDIATE,
      effectiveWhen,
      reason,
      timingArc: record.timingArc,
      effectScope: record.effectScope,
      route: ctx.route,
      root,
      error,
    });

    return record;
  }
}

async function mountImmediateLayer(defs, ctx, options = {}) {
  const eligible = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.IMMEDIATE));
  if (!eligible.length) return;

  const layerLabel = normalizeRuntimeToken(options.label || eligible[0]?.layer || 'layer') || 'layer';
  const startMark = `spw:immediate-layer:${layerLabel}:batch-start`;
  const endMark = `spw:immediate-layer:${layerLabel}:batch-end`;
  const measureName = `spw:immediate-layer:${layerLabel}:parallel`;

  performance.mark(startMark);
  beginMountBatch();
  try {
    const settingsDef = eligible.find((def) => def.id === 'site-settings');
    const parallelDefs = eligible.filter((def) => def.id !== 'site-settings');

    if (settingsDef) {
      await mountDefinition(settingsDef, ctx, null, 0);
    }
    if (parallelDefs.length) {
      await Promise.all(parallelDefs.map((def) => mountDefinition(def, ctx, null, 0)));
    }
  } finally {
    endMountBatch(ctx);
  }

  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);
  performance.measure('spw:immediate-layer-parallel', startMark, endMark);
}

/* Scroll can reveal dozens of visible-mount roots in one IntersectionObserver
   callback. Mounting them via Promise.all chains their synchronous init work
   through microtasks — one long main-thread task whose style/layout cost
   scales with the wave. Drain through a frame-budgeted queue instead so each
   slice yields back to the event loop (input, paint) before continuing. */
const VISIBLE_MOUNT_SLICE_BUDGET_MS = 10;

function yieldToNextFrame() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    // Headless / background: rAF and scheduler may stall; always arm a timeout.
    window.setTimeout(finish, 48);
    if (typeof window.scheduler?.postTask === 'function') {
      try {
        window.scheduler.postTask(finish, { priority: 'user-visible' });
        return;
      } catch {
        // fall through to rAF
      }
    }
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => window.setTimeout(finish, 0));
      return;
    }
  });
}

async function mountVisibleFeatures(defs, ctx) {
  const visibleDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.VISIBLE));
  if (!visibleDefs.length) return;

  const queue = [];
  let draining = false;

  const drainQueue = async () => {
    if (draining) return;
    draining = true;
    performance.mark('spw:visible-layer:drain-start');
    beginMountBatch();
    try {
      while (queue.length) {
        const sliceStart = performance.now();
        while (queue.length && performance.now() - sliceStart < VISIBLE_MOUNT_SLICE_BUDGET_MS) {
          const task = queue.shift();
          await task();
        }
        if (queue.length) await yieldToNextFrame();
      }
    } finally {
      endMountBatch(ctx);
      draining = false;
      performance.mark('spw:visible-layer:drain-end');
      performance.measure('spw:visible-layer:drain', 'spw:visible-layer:drain-start', 'spw:visible-layer:drain-end');
      if (queue.length) void drainQueue();
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const intersecting = entries.filter((entry) => entry.isIntersecting);
      if (!intersecting.length) return;

      for (const entry of intersecting) {
        const el = entry.target;
        observer.unobserve(el);

        for (const def of visibleDefs) {
          if (!el.matches(def.selector)) continue;
          annotateModuleTrigger(el, def, ctx, mountWhen.VISIBLE, 'triggered');

          queue.push(() => (def.rootMode === 'single'
            ? mountDefinition(def, ctx, null, 0)
            : mountDefinition(def, ctx, el)));
        }
      }

      void drainQueue();
    },
    {
      root: null,
      rootMargin: '240px 0px',
      threshold: 0.01,
    }
  );

  ctx.addObserver(observer);

  for (const def of visibleDefs) {
    const roots = getRoots(def);
    roots.forEach((el) => {
      if (el instanceof HTMLElement) {
        setRegionState(el, regionStates.QUEUED);
        annotateModuleTrigger(el, def, ctx, mountWhen.VISIBLE, 'queued');
      }
      observer.observe(el);
    });
  }
}

async function mountInteractionFeatures(defs, ctx) {
  const interactionDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.INTERACTION));
  if (!interactionDefs.length) return;

  const activate = once(async () => {
    beginMountBatch();
    try {
      await Promise.all(interactionDefs.map(async (def) => {
        const roots = getRoots(def);
        if (!roots.length || def.rootMode === 'single') {
          return mountDefinition(def, ctx, null, 0);
        }
        return Promise.all(roots.map((root, index) => {
          annotateModuleTrigger(root, def, ctx, mountWhen.INTERACTION, 'triggered');
          return mountDefinition(def, ctx, root, index);
        }));
      }));
    } finally {
      endMountBatch(ctx);
    }
  });

  const handler = () => {
    void activate();
    cleanup();
  };

  const cleanup = () => {
    window.removeEventListener('pointerdown', handler, options);
    window.removeEventListener('keydown', handler, options);
    window.removeEventListener('touchstart', handler, options);
  };

  const options = { once: true, passive: true };
  for (const def of interactionDefs) {
    getRoots(def).forEach((root) => annotateModuleTrigger(root, def, ctx, mountWhen.INTERACTION, 'waiting'));
  }
  window.addEventListener('pointerdown', handler, options);
  window.addEventListener('keydown', handler, options);
  window.addEventListener('touchstart', handler, options);

  ctx.addCleanup(cleanup);
}

async function mountRegionLayer(defs, ctx) {
  const regionDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.REGION));
  if (!regionDefs.length || !ctx.regions.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const intersecting = entries.filter((entry) => entry.isIntersecting);
      if (!intersecting.length) return;

      void (async () => {
        beginMountBatch();
        try {
          await Promise.all(intersecting.map(async (entry) => {
            const el = entry.target;

            for (const def of regionDefs) {
              if (!el.matches(def.selector)) continue;
              await mountDefinition(def, ctx, el);
            }

            observer.unobserve(el);
          }));
        } finally {
          endMountBatch(ctx);
        }
      })();
    },
    {
      root: null,
      rootMargin: '160px 0px',
      threshold: 0.01,
    }
  );

  ctx.addObserver(observer);

  ctx.regions.forEach((region) => {
    setRegionState(region.el, regionStates.PRIMED);
    observer.observe(region.el);
  });
}

/** Stagger IDLE mounts so residue/ledger listeners exist before collectible flourishes. */
const IDLE_CHUNK_ORDER = Object.freeze([
  'idle-residue',
  'idle-collectible',
  'idle-chrome',
  'idle-lab',
  'idle-default',
]);

function inferIdleTimingChunk(def) {
  const explicit = normalizeRuntimeToken(def?.timingChunk || '');
  if (explicit && IDLE_CHUNK_ORDER.includes(explicit)) return explicit;

  const arc = normalizeRuntimeToken(def?.timingArc || '');
  if (/ledger|residue|memory|spell$/.test(arc) || arc === 'enhance-ledger' || arc === 'enhance-spell') {
    return 'idle-residue';
  }
  if (/collect|reward|discover|guide|haptic|cauldron/.test(arc) || /collect|reward|discover/.test(def?.id || '')) {
    return 'idle-collectible';
  }
  if (/navigator|shell|chrome|logo|nav/.test(arc) || /navigator|logo|shell/.test(def?.id || '')) {
    return 'idle-chrome';
  }
  if (/lab|debug|metacognition|topic|learning|palette/.test(arc) || /lab|debug|topic|palette|pronunciation|query/.test(def?.id || '')) {
    return 'idle-lab';
  }
  return 'idle-default';
}

function groupIdleDefsByChunk(idleDefs) {
  const groups = new Map(IDLE_CHUNK_ORDER.map((chunk) => [chunk, []]));
  idleDefs.forEach((def) => {
    const chunk = inferIdleTimingChunk(def);
    const bucket = groups.get(chunk) || groups.get('idle-default');
    bucket.push(def);
  });
  return IDLE_CHUNK_ORDER
    .map((chunk) => ({ chunk, defs: groups.get(chunk) || [] }))
    .filter((entry) => entry.defs.length);
}

async function mountIdleDefinitionBatch(idleDefs, ctx) {
  beginMountBatch();
  try {
    await Promise.all(idleDefs.map(async (def) => {
      const roots = getRoots(def);
      if (!roots.length || def.rootMode === 'single') {
        return mountDefinition(def, ctx, null, 0);
      }
      return Promise.all(roots.map((root, index) => {
        annotateModuleTrigger(root, def, ctx, mountWhen.IDLE, 'triggered');
        return mountDefinition(def, ctx, root, index);
      }));
    }));
  } finally {
    endMountBatch(ctx);
  }
}

function queueIdleEnhancements(defs, ctx) {
  const idleDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.IDLE));
  const hasSettled = defs.some((def) => shouldScheduleDefinition(def, ctx, mountWhen.SETTLED));

  const finalizeEnhancement = () => {
    setPageState(pageStates.ENHANCED);
    ctx.bus.emit('spw:page-enhanced', { route: ctx.route });
    queueSettledEnhancements(defs, ctx);
  };

  if (!idleDefs.length) {
    if (!hasSettled) return;
    const handle = onIdle(() => {
      finalizeEnhancement();
    });
    ctx.addTimer(handle);
    return;
  }

  const handle = onIdle(async () => {
    if (ctx.runtimePolicy.delay) {
      await new Promise((resolve) => {
        const timer = window.setTimeout(resolve, ctx.runtimePolicy.delay);
        ctx.addTimer(timer);
      });
    }

    const chunks = groupIdleDefsByChunk(idleDefs);
    writeDatasetValue(html, 'spwRuntimeIdleChunks', chunks.map((entry) => entry.chunk).join(' '));

    for (const [index, entry] of chunks.entries()) {
      writeDatasetValue(html, 'spwRuntimeIdleChunk', entry.chunk);
      performance.mark(`spw:idle-chunk:${entry.chunk}:start`);
      await mountIdleDefinitionBatch(entry.defs, ctx);
      performance.mark(`spw:idle-chunk:${entry.chunk}:end`);
      performance.measure(
        `spw:idle-chunk:${entry.chunk}`,
        `spw:idle-chunk:${entry.chunk}:start`,
        `spw:idle-chunk:${entry.chunk}:end`,
      );

      // Yield between chunks so residue listeners can attach before collectible flourishes fire.
      if (index < chunks.length - 1) {
        await new Promise((resolve) => {
          const yieldHandle = onIdle(() => resolve(), 180);
          ctx.addTimer(yieldHandle);
        });
      }
    }

    writeDatasetValue(html, 'spwRuntimeIdleChunk', null);
    finalizeEnhancement();
  });

  for (const def of idleDefs) {
    getRoots(def).forEach((root) => annotateModuleTrigger(root, def, ctx, mountWhen.IDLE, 'queued'));
  }

  ctx.addTimer(handle);
}

function queueSettledEnhancements(defs, ctx) {
  const settledDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.SETTLED));
  if (!settledDefs.length) return;

  const run = async () => {
    // Double-rAF yields a paint; headless/background tabs may never fire rAF,
    // so pair with a short timeout so SETTLED modules still mount.
    await new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const timeout = window.setTimeout(finish, 200);
      ctx.addTimer?.(timeout);
      const raf = globalThis.requestAnimationFrame
        ? globalThis.requestAnimationFrame.bind(globalThis)
        : (cb) => window.setTimeout(cb, 16);
      raf(() => {
        raf(finish);
      });
    });

    performance.mark('spw:settled-layer:start');
    beginMountBatch();
    try {
      await Promise.all(settledDefs.map((def) => mountDefinition(def, ctx, null, 0)));
    } finally {
      endMountBatch(ctx);
    }
    performance.mark('spw:settled-layer:end');
    try {
      performance.measure('spw:settled-layer', 'spw:settled-layer:start', 'spw:settled-layer:end');
    } catch {
      // measure requires both marks; ignore if navigation cleared them
    }

    ctx.bus.emit('spw:layout-assumptions-ready', { route: ctx.route });
  };

  void run();
}

function refreshRuntime(ctx) {
  refreshRegionProfiles(ctx, 'runtime-refresh');
  const settledAt = Math.round(performance.now());

  for (const record of ctx.registry.values()) {
    try {
      if (record.status === 'mounted' && record.stage !== 'settled') {
        emitModuleLifecycle(ctx, record, 'settled', {
          at: settledAt,
          note: 'runtime refresh completed',
        });
        performance.mark(`spw:module:${record.id}:settled`);
        syncRuntimeModuleSummary(ctx, record);
      }
      record.refresh?.(ctx);
    } catch (error) {
      console.warn(`[${logLabel}] refresh failed for ${record.id}`, error);
    }
  }

  ctx.bus.emit('spw:runtime-refresh', { route: ctx.route });
}

  function wireRuntimeTokens(ctx) {
    if (!ctx) return () => {};
    if (ctx.runtimeTokensCleanup) return ctx.runtimeTokensCleanup;

    const onMounted = () => scheduleRuntimeTokenUpdate(ctx);
    const onFailed = () => scheduleRuntimeTokenUpdate(ctx);
    const unsubscribeMounted = ctx.bus.on('spw:module-mounted', onMounted);
    const unsubscribeFailed = ctx.bus.on('spw:module-failed', onFailed);
    updateRuntimeStateTokens(ctx);

    const cleanup = () => {
      unsubscribeMounted?.();
      unsubscribeFailed?.();
      delete ctx.runtimeTokensCleanup;
      resetMountBatchState();
      html?.style?.removeProperty('--spw-runtime-enhancement-intensity');
      html?.style?.removeProperty('--spw-runtime-feature-intensity');
      html?.style?.removeProperty('--spw-runtime-layer-count');
      html?.style?.removeProperty('--spw-runtime-avg-module-ms');
      html?.style?.removeProperty('--spw-site-rhythm-tempo');
      html?.style?.removeProperty('--spw-site-rhythm-density');
      writeDatasetValue(html, 'spwActiveLayers', null);
      writeDatasetValue(html, 'spwSiteRhythm', null);
    };

    ctx.runtimeTokensCleanup = cleanup;
    return cleanup;
  }

  return {
    normalizeModuleTimingStage,
    pushModuleLifecycleStage,
    emitModuleLifecycle,
    summarizeModuleLifecycle,
    snapshotModuleTimingStages,
    findModuleDefinition,
    listModuleDefinitions,
    snapshotRuntimeModules,
    moduleRecordToSpellExpression,
    snapshotRuntimeAsSpellbook,
    describeModuleUpdates,
    findModuleUpdateConflicts,
    normalizeModuleUpdates,
    summarizeModuleUpdates,
    mountModuleById,
    unmountModuleById,
    unmountAllModules,
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
    queueSettledEnhancements,
    refreshRuntime,
    wireRuntimeTokens,
    resetMountBatchState,
  };
}
