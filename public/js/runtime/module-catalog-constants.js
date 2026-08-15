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
  /* Per-root designed trigger: the root advertises what it holds, and the
     reader accepts. Discovery is chosen rather than scrolled past. */
  INVITED: 'invited',
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

/**
 * Electrostatic role in the living medium (@electrostatic_affordances / @arrival_electrostatics).
 * An operator is a terminal; a region is the material channel; an image/satchel is a capacitor.
 */
export const ELECTROSTATIC_ROLE = Object.freeze({
  TERMINAL: 'terminal',      // [data-spw-operator] — electrode where potential accumulates
  CHANNEL: 'channel',        // [data-spw-region], [data-spw-form="brace"] — conducts current through walls
  CAPACITOR: 'capacitor',    // [data-spw-image-*], wonder memory — stores charge/dielectric hold without leaking
  TRANSFORMER: 'transformer',// palette shifts, mode switches — pivots energy to another perspective (@)
  INDUCTOR: 'inductor',      // operator resonance clusters — induces shared momentum across matching tokens
  GROUND: 'ground',          // #> address handles, settled layout — safely sediments charge into calm fixity
});

/**
 * How charge releases or precipitates once an interaction acts.
 */
export const DISCHARGE_KIND = Object.freeze({
  RELEASE: 'release',        // transient spark on click/tap
  TRANSFER: 'transfer',      // lateral conduction across a brace or section boundary
  PROJECT: 'project',        // elevation onto an inspection overlay or satchel
  GROUND: 'ground',          // sedimentation into persistent storage / checkpoint
  RESONATE: 'resonate',      // harmonic glow across kin operators
  SETTLE: 'settle',          // geometric stabilization and clearance freeze
});

/**
 * Interaction triggers that wake latent terminals into armed, preview, or acted states.
 */
export const INTERACTION_TRIGGER = Object.freeze({
  POINTER_APPROACH: 'pointer-approach', // pointer enters vicinity / hover begins
  OPERATOR_TOUCH: 'operator-touch',     // click or tap on an operator chip / handle
  BRACE_INTERACT: 'brace-interact',     // click/drag along a brace boundary
  SCROLL_BOUNDARY: 'scroll-boundary',   // scroll crosses a section liminality band
  KEYBOARD_CHORD: 'keyboard-chord',     // key sequence or shortcut (Alt+K, ?, Esc)
  SPELL_CAST: 'spell-cast',             // casting or restoring a spell/checkpoint
  IDLE_SETTLE: 'idle-settle',           // double-rAF + font render completion
});

export const ELECTROSTATIC_ROLE_VALUES = Object.freeze(Object.values(ELECTROSTATIC_ROLE));
export const DISCHARGE_KIND_VALUES = Object.freeze(Object.values(DISCHARGE_KIND));
export const INTERACTION_TRIGGER_VALUES = Object.freeze(Object.values(INTERACTION_TRIGGER));

/** Documented field order for agents reviewing or adding catalog defs. */
export const CATALOG_DEF_FIELD_ORDER = Object.freeze([
  'id',
  'layer',
  'when',
  'cost',
  'costClass',
  'features',
  'subfeatures',
  'triggers',
  'affordances',
  'electrostatics',
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

/**
 * Region enhancement targets — REGION_SELECTOR minus shell chrome.
 *
 * REGION_SELECTOR ends in the catch-alls [data-spw-role] and [data-spw-slot],
 * which the site header (data-spw-role="routing") and footer components match.
 * That made shell chrome eligible for the region-hydration pass, so the header
 * and nav received motion-family / harmony / density / region-genome writes in
 * the REGION tier — measured at ~8.4s after load on the home page, which is
 * exactly the "navigation changes as the page loads" complaint.
 *
 * region-component-ecology.spw#harmony_prime_2026_07 already draws this line:
 * chrome_field is "not pack-local" and is governed by shell-width and input
 * capability rather than by region packing. Chrome should be settled at first
 * paint, not restyled once content regions hydrate.
 *
 * Scoped to this pass only; REGION_SELECTOR itself is shared with
 * page-region-rail, role-inference, operator-interactions, and page-metadata,
 * where matching chrome is still correct.
 */
const SHELL_CHROME_EXCLUSION = ':not(.site-header, .site-header *, .site-footer, .site-footer *, [data-spw-kind="shell"], [data-spw-floating-chrome="true"], [data-spw-floating-chrome="true"] *)';

export const REGION_ENHANCER_SELECTOR = REGION_SELECTOR
  .split(', ')
  .map((entry) => `${entry}${SHELL_CHROME_EXCLUSION}`)
  .join(', ');

/** Pure predicate so catalog families stay Node-importable without runtime-helpers DOM. */
export function isFn(value) {
  return typeof value === 'function';
}
