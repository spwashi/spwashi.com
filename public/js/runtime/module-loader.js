/**
 * Composable module loader for the staged site runtime.
 */

import { writeDatasetValue } from '../kernel/dom-contracts.js';
import { MODULE_LAYERS, MOUNT_WHEN } from './module-catalog.js';
import { REGION_STATES, setRegionState } from './region-profiler.js';
import {
  normalizeMountHandle,
  normalizeRuntimeToken,
  onIdle,
  once,
  safeQuery,
  safeQueryAll,
  SPW_RUNTIME_HELPERS_CONTRACT,
} from './runtime-helpers.js';

export const MODULE_TIMING_STAGES = Object.freeze([
  'scheduled',
  'loading',
  'mounted',
  'observed',
  'settled',
  'failed',
]);

export const SPW_MODULE_LOADER_CONTRACT = Object.freeze({
  timingStages: MODULE_TIMING_STAGES,
  portableUse:
    'Use createModuleLoader() when a page shell needs staged module mounting without inlining the bootstrap.',
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

  const matchesRoute = config.matchesRoute;
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

function summarizeModuleLifecycle(record) {
  const lifecycle = Array.isArray(record?.lifecycle) ? record.lifecycle : [];
  return lifecycle.map((entry) => entry.stage).join(' > ');
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
      selector: def.selector || '',
      rootMode: def.rootMode || 'single',
      evaluates: inferModuleDimensions(def),
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
    updates: record.updates || null,
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
  const updatesPart = record.updates && record.updates.length
    ? `{updates:${record.updates.join('+')}}`
    : '';
  const lifecyclePart = record.stage ? `{stage:${record.stage}}` : '';
  const timingPart = record.durationMs
    ? `[${Math.round(record.durationMs)}ms]`
    : '';
  const statusPart = record.status ? `:${record.status}` : '';

  // Produce something like: #>module:cauldron{updates:data-spw-cauldron}[120ms]:mounted
  return `#>${record.layer || 'module'}:${record.baseId || record.id}${updatesPart}${lifecyclePart}${timingPart}${statusPart} ${base}`.trim();
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

function makeRecordId(def, root = null, index = 0) {
  if (!root || root === document.body) return def.id;
  const rootId = root.id || root.getAttribute('data-spw-region-key') || root.getAttribute('data-spw-id') || root.getAttribute('data-spw-kind') || index;
  return `${def.id}::${String(rootId)}`;
}

function getEffectiveMountWhen(def, ctx) {
  const baseWhen = def.when || mountWhen.IMMEDIATE;
  const moduleOverride = ctx.runtimePolicy.timingByModule.get(def.id);
  if (moduleOverride) return moduleOverride;

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

function describeMountReason(def, ctx, root = null, effectiveWhen = getEffectiveMountWhen(def, ctx)) {
  // Prefer explicit, semantically meaningful description when provided by the module author.
  if (def.describes) {
    const base = def.reason || `${effectiveWhen} ${def.layer}`;
    const updates = Array.isArray(def.updates) && def.updates.length
      ? ` updates:[${def.updates.join('|')}]`
      : '';
    return `${base} ${def.describes}${updates}`;
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
  const onlyMatch = !ctx.runtimePolicy.only.size || ctx.runtimePolicy.only.has(id);
  const skipMatch = ctx.runtimePolicy.skip.has(id);
  const whenMatch = expectedWhen ? effectiveWhen === expectedWhen : effectiveWhen !== 'manual';

  // Enhanced debug/QA module gating (supports observation-beats, layout-shift-audit, future agent surfaces)
  const debugOnly = !!def.debugOnly;
  const debugActive = hasDebugOrQAMode(ctx);
  const debugMatch = !debugOnly || debugActive;

  const allowed = routeMatch && selectorMatch && onlyMatch && !skipMatch && whenMatch && debugMatch;

  if (!allowed && ctx.runtimePolicy.audit) {
    const reason = [
      routeMatch ? '' : 'route-mismatch',
      selectorMatch ? '' : 'selector-missing',
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
  writeDatasetValue(target, 'spwModuleTriggerStatus', record.status);
  writeDatasetValue(target, 'spwModuleLifecycle', summarizeModuleLifecycle(record));

  // New semantically meaningful fields for clarity, inspectability, and serialization as "module spells"
  if (record.describes) {
    writeDatasetValue(target, 'spwModuleDescribes', record.describes);
  }
  if (record.updates && Array.isArray(record.updates) && record.updates.length) {
    writeDatasetValue(target, 'spwModuleUpdates', record.updates.join(' '));
  }

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

  const layersValue = [...activeLayers].sort().join(' ') || 'core';
  writeDatasetValue(html, 'spwActiveLayers', layersValue);

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
  writeDatasetValue(html, 'spwRuntimeMountedModules', [...new Set(mounted)].join(' '));
  writeDatasetValue(html, 'spwRuntimeFailedModules', [...new Set(failed)].join(' ') || null);
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
    rel,
    href,
    status: 'discovered',
    cached: false,
  };
}

async function syncRuntimeResourceEntry(ctx, entry) {
  if (!ctx || !entry?.href) return null;
  const cached = await isRuntimeResourceCached(entry.href);
  const next = {
    ...entry,
    cached,
    status: cached ? 'cached' : entry.status,
  };
  ctx.resourceReadiness.set(entry.id, next);
  return next;
}

async function prefetchRuntimeResources(ctx, defs, expectedWhen, rel) {
  if (!ctx) return [];
  const candidates = defs
    .filter((def) => shouldScheduleDefinition(def, ctx, expectedWhen))
    .map((def) => buildRuntimeResourceEntry(def, expectedWhen, rel))
    .filter(Boolean);

  if (!candidates.length) return [];

  const canPrefetch = shouldPrefetchRuntimeResources(ctx);
  const warmed = [];

  for (const entry of candidates) {
    const current = await syncRuntimeResourceEntry(ctx, entry);
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
    describes: def.describes || null,
    updates: Array.isArray(def.updates) ? def.updates : null,
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
      status: 'loading',
    });
    pushModuleLifecycleStage(record, 'loading', { at: loadStartedAt, note: reason });
    recordModuleAudit(ctx, {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates,
      requestedWhen: def.when || mountWhen.IMMEDIATE,
      effectiveWhen,
      status: 'loading',
      reason,
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
    const result = await def.mount(mod, ctx, root);
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
    pushModuleLifecycleStage(record, 'mounted', {
      at: mountEndedAt,
      note: `${Math.round(record.loadMs)}ms load / ${Math.round(record.mountMs)}ms mount`,
    });
    pushModuleLifecycleStage(record, 'observed', {
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
    pushModuleLifecycleStage(record, 'failed', {
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
      route: ctx.route,
      root,
      error,
    });

    return record;
  }
}

async function mountImmediateLayer(defs, ctx) {
  const eligible = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.IMMEDIATE));
  if (!eligible.length) return;

  performance.mark('spw:immediate-layer-batch-start');
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

  performance.mark('spw:immediate-layer-batch-end');
  performance.measure(
    'spw:immediate-layer-parallel',
    'spw:immediate-layer-batch-start',
    'spw:immediate-layer-batch-end',
  );
}

async function mountVisibleFeatures(defs, ctx) {
  const visibleDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.VISIBLE));
  if (!visibleDefs.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;

        for (const def of visibleDefs) {
          if (!el.matches(def.selector)) continue;
          annotateModuleTrigger(el, def, ctx, mountWhen.VISIBLE, 'triggered');

          if (def.rootMode === 'single') {
            void mountDefinition(def, ctx, null, 0);
          } else {
            void mountDefinition(def, ctx, el);
          }
        }

        observer.unobserve(el);
      }
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
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;

        for (const def of regionDefs) {
          if (!el.matches(def.selector)) continue;
          void mountDefinition(def, ctx, el);
        }

        observer.unobserve(el);
      }
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

function queueIdleEnhancements(defs, ctx) {
  const idleDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, mountWhen.IDLE));
  if (!idleDefs.length) return;

  const handle = onIdle(async () => {
    if (ctx.runtimePolicy.delay) {
      await new Promise((resolve) => {
        const timer = window.setTimeout(resolve, ctx.runtimePolicy.delay);
        ctx.addTimer(timer);
      });
    }

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

    setPageState(pageStates.ENHANCED);
    ctx.bus.emit('spw:page-enhanced', { route: ctx.route });
  });

  for (const def of idleDefs) {
    getRoots(def).forEach((root) => annotateModuleTrigger(root, def, ctx, mountWhen.IDLE, 'queued'));
  }

  ctx.addTimer(handle);
}

function refreshRuntime(ctx) {
  refreshRegionProfiles(ctx, 'runtime-refresh');
  const settledAt = Math.round(performance.now());

  for (const record of ctx.registry.values()) {
    try {
      if (record.status === 'mounted' && record.stage !== 'settled') {
        pushModuleLifecycleStage(record, 'settled', {
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
    ctx.bus.on('spw:module-mounted', () => scheduleRuntimeTokenUpdate(ctx));
    ctx.bus.on('spw:module-failed', () => scheduleRuntimeTokenUpdate(ctx));
    updateRuntimeStateTokens(ctx);
  }

  return {
    normalizeModuleTimingStage,
    pushModuleLifecycleStage,
    summarizeModuleLifecycle,
    snapshotModuleTimingStages,
    findModuleDefinition,
    listModuleDefinitions,
    snapshotRuntimeModules,
    moduleRecordToSpellExpression,
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
  };
}
