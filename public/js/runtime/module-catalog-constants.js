/**
 * Shared catalog constants (layers + mount when + cost class).
 * Definition families live in module-catalog-*.js for reviewability.
 *
 * Preferred definition field order (normalize / review scan):
 *   id, layer, when, costClass?, features?, route?, selector?, rootMode?,
 *   debugOnly?, describes, updates, evaluates, timingArc, timingChunk?,
 *   effectScope, load, mount
 *
 * costClass ids align with .spw/conventions/metaphor-dimensional-lexicon.spw
 * and audits/build-runtime-performance coordinates — operational stems, not
 * metaphor prose.
 */

export const MODULE_LAYERS = Object.freeze({
  CORE: 'core',
  FEATURE: 'feature',
  REGION: 'region',
  ENHANCEMENT: 'enhancement',
});

export const MOUNT_WHEN = Object.freeze({
  IMMEDIATE: 'immediate',
  VISIBLE: 'visible',
  IDLE: 'idle',
  INTERACTION: 'interaction',
  REGION: 'region',
  SETTLED: 'settled',
});

/**
 * Performance cost class — primary optimization coordinate per catalog def.
 * Prefer explicit costClass on defs; inferModuleCostClass() fills gaps.
 */
export const COST_CLASS = Object.freeze({
  /** Always-on or boot-width work that could often wait (schedule debt). */
  PREMATURE_COMMITMENT: 'premature_commitment',
  /** Concurrent scans, observers, queryAll breadth, metacognition mirrors. */
  WORKING_MEMORY_PRESSURE: 'working_memory_pressure',
  /** Stale measure/mirror vs true layout (pack-local RO gaps, dual truth). */
  INTERFERENCE: 'interference',
  /** Correctly gated by selector / features / route / interaction / idle. */
  DEMAND_COUPLED: 'demand_coupled',
  /** Geometry/meaning from authored HTML+CSS; JS narrates rather than invents. */
  AUTHORED_PRIOR_SAFE: 'authored_prior_safe',
  /** Paint/composite thrash: express, :has resonance, ornament, heavy blur. */
  PAINT_COMPOSITE: 'paint_composite',
});

export const COST_CLASS_VALUES = Object.freeze(Object.values(COST_CLASS));

/** Documented field order for agents reviewing or adding catalog defs. */
export const CATALOG_DEF_FIELD_ORDER = Object.freeze([
  'id',
  'layer',
  'when',
  'costClass',
  'features',
  'route',
  'selector',
  'rootMode',
  'debugOnly',
  'describes',
  'updates',
  'evaluates',
  'timingArc',
  'timingChunk',
  'effectScope',
  'load',
  'mount',
]);

/** Live pretext hosts that should mount measurement/physics (not static specimens). */
export const PRETEXT_LIVE_SELECTOR =
  '[data-spw-flow="pretext"][data-spw-pretext-live="true"]:not([data-spw-pretext-static])';

/**
 * Region mount targets — keep in sync with REGION_SELECTORS in kernel/dom-contracts.js.
 * Duplicated here so catalog families stay Node-importable without the bus/DOM chain.
 */
export const REGION_SELECTOR = [
  '.site-frame',
  '[data-spw-kind="frame"]',
  '[data-spw-kind="panel"]',
  '[data-spw-kind="card"]',
  '[data-spw-kind="surface"]',
  '[data-spw-kind="hook"]',
  '[data-spw-kind="lens"]',
  '[data-spw-kind="metric"]',
  '[data-spw-component-kind="frame"]',
  '[data-spw-component-kind="panel"]',
  '[data-spw-component-kind="card"]',
  '[data-spw-component-kind="surface"]',
  '[data-spw-component-kind="hook"]',
  '[data-spw-component-kind="lens"]',
  '[data-spw-component-kind="metric"]',
  '[data-spw-role]',
  '[data-spw-slot]',
].join(', ');

/** Pure predicate so catalog families stay Node-importable without runtime-helpers DOM. */
export function isFn(value) {
  return typeof value === 'function';
}
