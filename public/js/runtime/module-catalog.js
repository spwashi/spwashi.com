/**
 * Runtime module catalog for the staged site bootstrap.
 *
 * Families are split for reviewability:
 *   catalog/constants.js
 *   catalog/core.js
 *   catalog/feature.js
 *   catalog/region.js
 *   catalog/enhancement.js
 *   catalog/normalize.js  (cost + costClass aliases + optimization rollups)
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
  COST_COMMITMENT,
  COST_COMMITMENT_VALUES,
  COST_COPY,
  COST_COPY_VALUES,
  COST_SPEND,
  COST_SPEND_VALUES,
  MODULE_LAYERS,
  MOUNT_WHEN,
  costClassFromModel,
  costModelFromClass,
  describeModuleCost,
  isFn,
} from './catalog/constants.js';
export { CORE_DEFS } from './catalog/core.js';
export { FEATURE_DEFS } from './catalog/feature.js';
export { REGION_DEFS } from './catalog/region.js';
export { ENHANCEMENT_DEFS } from './catalog/enhancement.js';
export {
  describeModuleOrchestration,
  filterEnhancementDefs,
  inferModuleCost,
  inferModuleCostClass,
  MODULE_CATALOG_NORMALIZE_CONTRACT,
  normalizeCatalogDefinition,
  normalizeCatalogDefinitions,
  resolveModuleCatalogSpecifier,
  summarizeModuleCatalogOptimization,
} from './catalog/normalize.js';

import { CORE_DEFS } from './catalog/core.js';
import { FEATURE_DEFS } from './catalog/feature.js';
import { REGION_DEFS } from './catalog/region.js';
import { ENHANCEMENT_DEFS } from './catalog/enhancement.js';
import {
  listModuleCatalogIndex as indexCatalogDefinitions,
  normalizeCatalogDefinitions,
} from './catalog/normalize.js';

/** Normalized catalog: schedule fields preserved, cost + costClass resolved. */
export const MODULE_DEFS = normalizeCatalogDefinitions([
  ...CORE_DEFS,
  ...FEATURE_DEFS,
  ...REGION_DEFS,
  ...ENHANCEMENT_DEFS,
]);

/** Barrel default is the full site catalog; pass defs to index a subset. */
export function listModuleCatalogIndex(defs = MODULE_DEFS) {
  return indexCatalogDefinitions(defs);
}
