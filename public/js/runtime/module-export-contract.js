/**
 * module-export-contract.js
 * --------------------------------------------------------------------------
 * Canonical module export shape for catalog mounting, compose portability,
 * and runtime-medium guild inspection.
 */

import { describeModuleUpdates, normalizeModuleUpdates } from './module-updates-contract.js';

export const SPW_MODULE_EXPORT_SHAPE = Object.freeze({
  required: Object.freeze(['mount']),
  optional: Object.freeze(['id', 'refresh', 'contract', 'updates', 'guild', 'describes']),
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
    describes: exportSurface?.describes || meta.describes || null,
  };
}

export function createModuleExport(definition = {}) {
  const { id, mount, refresh, contract, updates, guild, describes } = definition;
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
  });

  return Object.freeze({
    SPW_MODULE_EXPORT: exported,
    spwModule: exported,
  });
}
