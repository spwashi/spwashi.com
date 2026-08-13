/**
 * module-export-contract.js
 * --------------------------------------------------------------------------
 * Canonical module export shape for catalog mounting, compose portability,
 * and runtime-medium guild inspection.
 */

import { describeModuleUpdates, normalizeModuleUpdates } from './module-updates-contract.js';

export const SPW_MODULE_EXPORT_SHAPE = Object.freeze({
  required: Object.freeze(['mount']),
  optional: Object.freeze([
    'id',
    'refresh',
    'contract',
    'updates',
    'guild',
    'describes',
    'evaluates',
    'timingArc',
    'timingChunk',
    'effectScope',
  ]),
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
  portableUse:
    'Export SPW_MODULE_EXPORT with mount(); re-export spwModule as alias during migration. Catalog and compose resolve the same mount path.',
  mountResult:
    'mount() returns void, a cleanup function, or { cleanup?, refresh? }. A mount-returned refresh wins over the export-level refresh.',
  cleanupOwnership:
    'Loader-mounted modules return their handle and do not register that same cleanup with ctx.addCleanup.',
  routeBoundary:
    'Routes replace the document; partial DOM replacement uses refresh/untracking. Do not tear down on pagehide because BFCache may restore the same document.',
  catalogParity:
    'Prefer catalog fields (when, features, timingArc, timingChunk, effectScope, visual, updates with role: topology) as the schedule contract; SPW_MODULE_EXPORT mirrors mount + optional updates/describes for portable compose.',
  updatesTopology:
    'updates may use scope:role:kind:name (html:flourish:--token). Roles: structural|flourish|inspect|residue|measure|diagnostic.',
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
