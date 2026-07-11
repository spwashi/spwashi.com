/**
 * Runtime module catalog for the staged site bootstrap.
 *
 * Families are split for reviewability:
 *   module-catalog-constants.js
 *   module-catalog-core.js
 *   module-catalog-feature.js
 *   module-catalog-region.js
 *   module-catalog-enhancement.js
 *
 * Contract parsers read each family file (export const *_DEFS = […])
 * or concatenate them via readModuleCatalogSource().
 * Updates helpers live in module-updates-contract.js (not re-exported here)
 * so this barrel stays Node-importable with the public-import resolve hook.
 */

export {
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

import { CORE_DEFS } from './module-catalog-core.js';
import { FEATURE_DEFS } from './module-catalog-feature.js';
import { REGION_DEFS } from './module-catalog-region.js';
import { ENHANCEMENT_DEFS } from './module-catalog-enhancement.js';

export function filterEnhancementDefs(defs, includeLayoutAudit = true) {
  if (includeLayoutAudit) return defs;
  return defs.filter((def) => def?.id !== 'layout-shift-audit');
}

export const MODULE_DEFS = [
  ...CORE_DEFS,
  ...FEATURE_DEFS,
  ...REGION_DEFS,
  ...ENHANCEMENT_DEFS,
];

/** Lightweight index for ecology scripts and DevTools without mounting modules. */
export function listModuleCatalogIndex(defs = MODULE_DEFS) {
  const byLayer = Object.create(null);
  const byWhen = Object.create(null);
  const rows = [];
  for (const def of defs) {
    if (!def?.id) continue;
    const layer = def.layer || 'unknown';
    const when = def.when || 'immediate';
    (byLayer[layer] ||= []).push(def.id);
    (byWhen[when] ||= []).push(def.id);
    rows.push({
      id: def.id,
      layer,
      when,
      timingArc: def.timingArc || null,
      timingChunk: def.timingChunk || null,
      features: def.features || null,
      selector: def.selector || null,
    });
  }
  return { count: rows.length, byLayer, byWhen, modules: rows };
}
