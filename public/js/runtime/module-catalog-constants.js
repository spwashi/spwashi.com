/**
 * Shared catalog constants (layers + mount when + cost).
 * Definition families live in module-catalog-*.js for reviewability.
 *
 * Preferred definition field order (normalize / review scan):
 *   id, layer, when, cost?, costClass?, features?, route?, selector?, rootMode?,
 *   debugOnly?, describes, updates, evaluates, timingArc, timingChunk?,
 *   effectScope, visual?, load, mount
 *
 * A module is one reversible process:
 *   enter (when) → act (spend) → leave (cleanup) → remain (commitment)
 *
 * cost = { commitment, spend, copy? }. costClass is a derived alias for
 * older audits and build-performance steps — do not treat it as a kind of module.
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
 * How much survives unmount — irreversibility of the scene.
 * authored: HTML/CSS owns it. listen: handlers; cleanup restores.
 * project: live attrs/vars; unmount should clear. residue: storage/memory.
 */
export const COST_COMMITMENT = Object.freeze({
  AUTHORED: 'authored',
  LISTEN: 'listen',
  PROJECT: 'project',
  RESIDUE: 'residue',
});

/**
 * How the act hurts if mistimed. none is not a failure — it is a clean spend.
 */
export const COST_SPEND = Object.freeze({
  NONE: 'none',
  EARLY: 'early',
  WIDE: 'wide',
  FIGHT: 'fight',
  PAINT: 'paint',
});

/**
 * Only meaningful at commitment=residue: may the resident printing be replaced.
 * follow = take the current issue; keep = stay with the shelf copy; pin = this printing.
 */
export const COST_COPY = Object.freeze({
  FOLLOW: 'follow',
  KEEP: 'keep',
  PIN: 'pin',
});

export const COST_COMMITMENT_VALUES = Object.freeze(Object.values(COST_COMMITMENT));
export const COST_SPEND_VALUES = Object.freeze(Object.values(COST_SPEND));
export const COST_COPY_VALUES = Object.freeze(Object.values(COST_COPY));

/**
 * What a mount is allowed to do to first-paint geometry.
 * authored: HTML/CSS already owns the look; do not restyle.
 * annotate: may write data-* / ARIA; reader CSS must be a no-op.
 * inspect: visible only in editor/inspect display layers.
 * layout: allowed to reflow; screenshots after mount will differ.
 */
export const VISUAL_EFFECT = Object.freeze({
  AUTHORED: 'authored',
  ANNOTATE: 'annotate',
  INSPECT: 'inspect',
  LAYOUT: 'layout',
});

export const VISUAL_EFFECT_VALUES = Object.freeze(Object.values(VISUAL_EFFECT));

/**
 * Legacy single-token aliases derived from { commitment, spend }.
 * Keep until audits and build-performance.mjs stop reading the old ids.
 */
export const COST_CLASS = Object.freeze({
  /** spend=early — paid before the visitor or viewport needed it. */
  PREMATURE_COMMITMENT: 'premature_commitment',
  /** spend=wide — too many hosts scanned or mirrored. */
  WORKING_MEMORY_PRESSURE: 'working_memory_pressure',
  /** spend=fight — two writers or a stale mirror. */
  INTERFERENCE: 'interference',
  /** spend=none, commitment≠authored — demand-shaped activation. */
  DEMAND_COUPLED: 'demand_coupled',
  /** commitment=authored — JS narrates; geometry is already in HTML/CSS. */
  AUTHORED_PRIOR_SAFE: 'authored_prior_safe',
  /** spend=paint — composite/reflow/:has. */
  PAINT_COMPOSITE: 'paint_composite',
});

export const COST_CLASS_VALUES = Object.freeze(Object.values(COST_CLASS));

export function costClassFromModel(cost = {}) {
  const commitment = cost.commitment;
  const spend = cost.spend;
  if (commitment === COST_COMMITMENT.AUTHORED) return COST_CLASS.AUTHORED_PRIOR_SAFE;
  if (spend === COST_SPEND.FIGHT) return COST_CLASS.INTERFERENCE;
  if (spend === COST_SPEND.PAINT) return COST_CLASS.PAINT_COMPOSITE;
  if (spend === COST_SPEND.WIDE) return COST_CLASS.WORKING_MEMORY_PRESSURE;
  if (spend === COST_SPEND.EARLY) return COST_CLASS.PREMATURE_COMMITMENT;
  return COST_CLASS.DEMAND_COUPLED;
}

export function costModelFromClass(costClass = '') {
  const token = String(costClass || '').trim();
  if (token === COST_CLASS.AUTHORED_PRIOR_SAFE) {
    return { commitment: COST_COMMITMENT.AUTHORED, spend: COST_SPEND.NONE, copy: null };
  }
  if (token === COST_CLASS.INTERFERENCE) {
    return { commitment: COST_COMMITMENT.PROJECT, spend: COST_SPEND.FIGHT, copy: null };
  }
  if (token === COST_CLASS.PAINT_COMPOSITE) {
    return { commitment: COST_COMMITMENT.PROJECT, spend: COST_SPEND.PAINT, copy: null };
  }
  if (token === COST_CLASS.WORKING_MEMORY_PRESSURE) {
    return { commitment: COST_COMMITMENT.LISTEN, spend: COST_SPEND.WIDE, copy: null };
  }
  if (token === COST_CLASS.PREMATURE_COMMITMENT) {
    return { commitment: COST_COMMITMENT.PROJECT, spend: COST_SPEND.EARLY, copy: null };
  }
  return { commitment: COST_COMMITMENT.PROJECT, spend: COST_SPEND.NONE, copy: null };
}

export function describeModuleCost(cost = {}) {
  const commitment = cost.commitment || COST_COMMITMENT.PROJECT;
  const spend = cost.spend || COST_SPEND.NONE;
  const copy = commitment === COST_COMMITMENT.RESIDUE ? (cost.copy || COST_COPY.FOLLOW) : null;
  return copy ? `${commitment}/${spend} ${copy}` : `${commitment}/${spend}`;
}

/** Documented field order for agents reviewing or adding catalog defs. */
export const CATALOG_DEF_FIELD_ORDER = Object.freeze([
  'id',
  'layer',
  'when',
  'cost',
  'costClass',
  'features',
  'pageFamily',
  'pageRole',
  'pageModes',
  'pageContext',
  'pageSurface',
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
  'visual',
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
