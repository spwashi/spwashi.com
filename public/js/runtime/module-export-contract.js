/**
 * module-export-contract.js
 * --------------------------------------------------------------------------
 * Canonical module export shape for catalog mounting, compose portability,
 * and runtime-medium guild inspection.
 *
 * @typedef {import('../../../types/module-catalog').SpwModuleExport} SpwModuleExport
 */

import { describeModuleUpdates, normalizeModuleUpdates } from './module-updates-contract.js';

/** @type {readonly import('../../../types/module-catalog').SpwModuleExportPortableField[]} */
const PORTABLE_EXPORT_FIELDS = Object.freeze([
  'id',
  'refresh',
  'contract',
  'updates',
  'describes',
]);

/** @type {readonly import('../../../types/module-catalog').SpwModuleExportMirrorField[]} */
const CATALOG_MIRROR_FIELDS = Object.freeze([
  'evaluates',
  'timingArc',
  'timingChunk',
  'effectScope',
]);

const KNOWN_EXPORT_FIELDS = new Set([
  'mount',
  ...PORTABLE_EXPORT_FIELDS,
  'guild',
  ...CATALOG_MIRROR_FIELDS,
]);

export const SPW_MODULE_EXPORT_SHAPE = Object.freeze({
  required: Object.freeze(['mount']),
  optional: Object.freeze([...PORTABLE_EXPORT_FIELDS, 'guild', ...CATALOG_MIRROR_FIELDS]),
  portable: PORTABLE_EXPORT_FIELDS,
  catalogMirrors: CATALOG_MIRROR_FIELDS,
  aliases: Object.freeze(['spwModule']),
});

export const SPW_MODULE_EXPORT_CONTRACT = Object.freeze({
  shape: SPW_MODULE_EXPORT_SHAPE,
  resolverOrder: Object.freeze([
    'SPW_MODULE_EXPORT.mount',
    'spwModule.mount',
    'default.mount',
    'initNamedExport',
  ]),
  datasetFields: Object.freeze({
    shape: 'data-spw-module-export-shape',
    guild: 'data-spw-module-guild',
    grade: 'data-spw-module-export-grade',
  }),
});

const INIT_EXPORT_RE = /^init[A-Z]/;

function isFn(value) {
  return typeof value === 'function';
}

function comparableFieldValue(field, value) {
  if (value == null || value === '') return null;
  if (field === 'updates') {
    return normalizeModuleUpdates(value).slice().sort();
  }
  if (field === 'effectScope' || field === 'evaluates') {
    const entries = Array.isArray(value) ? value : String(value).split(/[\s,]+/);
    return entries.map((entry) => String(entry || '').trim().toLowerCase()).filter(Boolean).sort();
  }
  return String(value).trim();
}

function listCatalogMirrorDrift(exportSurface, meta = {}) {
  if (!exportSurface || !meta?.id) return [];
  return ['id', 'updates', 'describes', ...CATALOG_MIRROR_FIELDS].filter((field) => {
    if (exportSurface[field] == null || meta[field] == null) return false;
    return JSON.stringify(comparableFieldValue(field, exportSurface[field]))
      !== JSON.stringify(comparableFieldValue(field, meta[field]));
  });
}

export function resolveModuleMount(mod) {
  if (!mod || typeof mod !== 'object') return null;

  if (isFn(mod.SPW_MODULE_EXPORT?.mount)) {
    return { fn: mod.SPW_MODULE_EXPORT.mount, shape: 'SPW_MODULE_EXPORT', surface: mod.SPW_MODULE_EXPORT };
  }
  if (isFn(mod.spwModule?.mount)) {
    return { fn: mod.spwModule.mount, shape: 'spwModule', surface: mod.spwModule };
  }
  if (isFn(mod.default?.mount)) {
    return { fn: mod.default.mount, shape: 'default', surface: mod.default };
  }

  for (const [key, value] of Object.entries(mod)) {
    if (INIT_EXPORT_RE.test(key) && isFn(value)) {
      return { fn: value, shape: key, surface: null };
    }
  }

  return null;
}

export function describeModuleExport(mod, meta = {}) {
  const resolved = resolveModuleMount(mod);
  const exportSurface = resolved?.surface || mod?.SPW_MODULE_EXPORT || mod?.spwModule || null;
  const updates = normalizeModuleUpdates(exportSurface?.updates || meta.updates);
  const updatesDescribe = describeModuleUpdates(updates);
  const drift = listCatalogMirrorDrift(exportSurface, meta);
  const catalogBacked = Boolean(meta?.id);
  const extras = exportSurface
    ? Object.keys(exportSurface).filter((field) => !KNOWN_EXPORT_FIELDS.has(field))
    : [];
  const catalogView = meta.orchestration || null;

  return {
    id: exportSurface?.id || meta.id || null,
    guild: exportSurface?.guild || meta.guild || null,
    shape: resolved?.shape || 'unresolved',
    mount: Boolean(resolved?.fn),
    hasRefresh: isFn(exportSurface?.refresh) || isFn(mod?.refresh),
    hasContract: Boolean(exportSurface?.contract || meta.contract),
    updates,
    updatesDescribe,
    flourishes: updatesDescribe.flourishes || [],
    topology: updatesDescribe.topology || '',
    describes: exportSurface?.describes || meta.describes || null,
    evaluates: exportSurface?.evaluates || meta.evaluates || null,
    timingArc: exportSurface?.timingArc || meta.timingArc || null,
    timingChunk: exportSurface?.timingChunk || meta.timingChunk || null,
    effectScope: exportSurface?.effectScope || meta.effectScope || null,
    extras,
    cost: catalogView?.cost || meta.cost || null,
    visual: catalogView?.effects?.visual || meta.visual || null,
    orchestration: {
      authority: catalogBacked ? 'catalog' : 'export',
      status: catalogBacked ? (drift.length ? 'drift' : 'aligned') : 'portable',
      drift,
      catalogMirrors: CATALOG_MIRROR_FIELDS,
      extras,
      cost: catalogView?.cost || meta.cost || null,
      visual: catalogView?.effects?.visual || meta.visual || null,
      lifecycle: catalogView?.lifecycle || null,
      cleanup: null,
      refreshReturned: false,
    },
  };
}

export function createModuleExport(definition = {}) {
  const {
    id,
    mount,
    refresh,
    contract,
    updates,
    guild,
    describes,
    evaluates,
    timingArc,
    timingChunk,
    effectScope,
  } = definition;
  if (!isFn(mount)) {
    throw new Error('[module-export-contract] createModuleExport requires mount function.');
  }

  const exported = Object.freeze({
    id: id || null,
    mount,
    refresh: isFn(refresh) ? refresh : null,
    contract: contract || null,
    updates: normalizeModuleUpdates(updates),
    guild: guild || null,
    describes: describes || null,
    evaluates: evaluates || null,
    timingArc: timingArc || null,
    timingChunk: timingChunk || null,
    effectScope: effectScope || null,
  });

  return Object.freeze({
    SPW_MODULE_EXPORT: exported,
    spwModule: exported,
  });
}
