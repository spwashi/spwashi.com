/**
 * Runtime module catalog for the staged site bootstrap.
 *
 * Families are split for reviewability:
 *   module-catalog-constants.js
 *   module-catalog-core.js
 *   module-catalog-feature.js
 *   module-catalog-region.js
 *   module-catalog-enhancement.js
 *   module-catalog-normalize.js  (costClass + optimization rollups)
 *
 * Contract parsers read each family file (export const *_DEFS = […])
 * or concatenate them via readModuleCatalogSource().
 * Updates helpers live in module-updates-contract.js (not re-exported here)
 * so this barrel stays Node-importable with the public-import resolve hook.
 */

export {
  CATALOG_DEF_FIELD_ORDER,
  COST_CLASS,
  COST_CLASS_VALUES,
  MODULE_LAYERS,
  MOUNT_WHEN,
  PRETEXT_LIVE_SELECTOR,
  REGION_SELECTOR,
  isFn,
} from './module-catalog-constants.js';
export { CORE_DEFS } from './module-catalog-core.js';
export { FEATURE_DEFS } from './module-catalog-feature.js';
export { REGION_DEFS } from './module-catalog-region.js';
export { ENHANCEMENT_DEFS } from './module-catalog-enhancement.js';
export {
  inferModuleCostClass,
  MODULE_CATALOG_NORMALIZE_CONTRACT,
  normalizeCatalogDefinition,
  normalizeCatalogDefinitions,
  resolveModuleCatalogSpecifier,
  summarizeModuleCatalogOptimization,
} from './module-catalog-normalize.js';

import { CORE_DEFS } from './module-catalog-core.js';
import { FEATURE_DEFS } from './module-catalog-feature.js';
import { REGION_DEFS } from './module-catalog-region.js';
import { ENHANCEMENT_DEFS } from './module-catalog-enhancement.js';
import {
  inferModuleCostClass,
  normalizeCatalogDefinitions,
  summarizeModuleCatalogOptimization,
} from './module-catalog-normalize.js';

export function filterEnhancementDefs(defs, includeLayoutAudit = true) {
  if (includeLayoutAudit) return defs;
  return defs.filter((def) => def?.id !== 'layout-shift-audit');
}

/** Normalized catalog: schedule fields preserved, costClass resolved. */
export const MODULE_DEFS = normalizeCatalogDefinitions([
  ...CORE_DEFS,
  ...FEATURE_DEFS,
  ...REGION_DEFS,
  ...ENHANCEMENT_DEFS,
]);

/** Lightweight index for ecology scripts and DevTools without mounting modules. */
export function listModuleCatalogIndex(defs = MODULE_DEFS) {
  const byLayer = Object.create(null);
  const byWhen = Object.create(null);
  const byCostClass = Object.create(null);
  const rows = [];
  for (const def of defs) {
    if (!def?.id) continue;
    const layer = def.layer || 'unknown';
    const when = def.when || 'immediate';
    const costClass = def.costClass || inferModuleCostClass(def);
    (byLayer[layer] ||= []).push(def.id);
    (byWhen[when] ||= []).push(def.id);
    (byCostClass[costClass] ||= []).push(def.id);
    rows.push({
      id: def.id,
      layer,
      when,
      costClass,
      timingArc: def.timingArc || null,
      timingChunk: def.timingChunk || null,
      features: def.features || null,
      selector: def.selector || null,
      debugOnly: Boolean(def.debugOnly),
      effectScope: def.effectScope || null,
    });
  }
  return {
    count: rows.length,
    byLayer,
    byWhen,
    byCostClass,
    modules: rows,
    optimization: summarizeModuleCatalogOptimization(defs),
  };
}
