export const CAULDRON_KEY = 'spw-cauldron';
export const MAX_INGREDIENTS = 6;
export const GARDEN_PRUNE_DAYS = 30;

/* Capacity is a stat, not a constant.
 *
 * MAX_INGREDIENTS stays the base value every visitor starts with, but the
 * effective capacity is resolved at call time from `:root` so it can be raised
 * or lowered as a designed consequence — earned by a gathering streak, granted
 * by a route that wants to hold more, reduced by a surface that wants focus.
 *
 * Publishing it (rather than keeping it in module scope) is what makes it an
 * ecology hook instead of a cauldron detail: once capacity and fill are on the
 * document element, any stylesheet on any page can respond to how much the
 * visitor is carrying without importing anything or knowing the cauldron
 * exists. systems/field-physics.css reads the fill ratio as a salience axis.
 */
export const CAPACITY_MIN = 1;
export const CAPACITY_MAX = 12;

/**
 * Effective capacity right now: the `:root` override when present and sane,
 * otherwise the base. Clamped so a bad attribute cannot uncap the gathering.
 * @returns {number}
 */
export function cauldronCapacity() {
  if (typeof document === 'undefined') return MAX_INGREDIENTS;
  const raw = document.documentElement?.dataset?.spwCauldronCapacity;
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed)) return MAX_INGREDIENTS;
  return Math.min(CAPACITY_MAX, Math.max(CAPACITY_MIN, parsed));
}

/**
 * Grant or revoke capacity. Passing null restores the base value.
 * @param {number|null} next
 * @returns {number} the capacity now in effect
 */
export function setCauldronCapacity(next) {
  if (typeof document === 'undefined') return MAX_INGREDIENTS;
  const root = document.documentElement;
  if (next === null || next === undefined) {
    delete root.dataset.spwCauldronCapacity;
    return MAX_INGREDIENTS;
  }
  const clamped = Math.min(CAPACITY_MAX, Math.max(CAPACITY_MIN, Number(next) || MAX_INGREDIENTS));
  root.dataset.spwCauldronCapacity = String(clamped);
  return clamped;
}

/**
 * Put the load on the document element so the rest of the page ecology can
 * respond. `--spw-cauldron-load-ratio` is 0..1 and is the value stylesheets
 * should read; the discrete `data-spw-cauldron-load` gives selectors something
 * to match on without doing arithmetic.
 *
 * Named -load-ratio, not -fill, because `--spw-cauldron-fill` was already taken
 * by shell/chrome/adaptive.css for the vessel's liquid level. That variable now
 * derives from this one, so the two meanings stay distinct while the drawing
 * finally tracks the real capacity instead of a hardcoded six-step ladder.
 * @param {number} count how many ingredients are currently held
 */
export function publishCauldronCapacity(count = 0) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const capacity = cauldronCapacity();
  const held = Math.max(0, Number(count) || 0);
  const fill = capacity > 0 ? Math.min(1, held / capacity) : 0;

  /* Only the ratio becomes a custom property, because only the ratio is read by
     a stylesheet. Capacity itself reaches CSS as the data-spw-cauldron-capacity
     attribute (selectors can match it) and reaches JS through cauldronCapacity(),
     so publishing it as a third copy would be a variable nothing consumes —
     which scripts/check-site.mjs correctly rejects. */
  root.style.setProperty('--spw-cauldron-load-ratio', fill.toFixed(3));

  root.dataset.spwCauldronLoad = held === 0
    ? 'empty'
    : held >= capacity ? 'full'
      : fill >= 0.5 ? 'heavy' : 'light';
}

export const CAULDRON_PHASES = Object.freeze(['empty', 'primed', 'mixing', 'spell-ready']);

export const CAULDRON_CONTRACT = Object.freeze({
  storageKey: CAULDRON_KEY,
  maxIngredients: MAX_INGREDIENTS,
  phases: CAULDRON_PHASES,
  ingredientPhases: Object.freeze(['gathering', 'resonant', 'mature', 'decayed']),
  actions: Object.freeze({
    mix: 'Combine saved fragments into an inspectable extension draft',
    plant: 'Commit the current gathering as a durable trail',
    nourish: 'Refresh the most recent ingredient timestamp',
    prune: 'Remove ingredients older than the garden threshold',
    vision: 'Send the gathering to the Midjourney vision bench',
    clear: 'Empty the cauldron',
    undo: 'Restore the previous gathering state',
    're-gather': 'Scroll to the cauldron and surface the last tended material',
    decompose: 'Reopen a saved spell as cauldron ingredients for editing',
    share: 'Share gathering via Web Share API or copy as Spw expression',
    copy: 'Copy gathering as inspectable Spw expression to clipboard',
  }),
  attributes: Object.freeze({
    host: 'data-spw-cauldron',
    state: 'data-spw-cauldron-state',
    ingredient: 'data-spw-cauldron-ingredient',
    ingredientPhase: 'data-spw-ingredient-phase',
    action: 'data-spw-cauldron-action',
    actionState: 'data-spw-cauldron-action-state',
    mirror: 'data-spw-cauldron-mirror',
    gardenPhase: 'data-spw-cauldron-garden-phase',
    discoverability: 'data-spw-cauldron-discoverability',
    resonance: 'data-spw-cauldron-resonance',
    resonanceOperators: 'data-spw-cauldron-resonance-operators',
    collected: 'data-spw-cauldron-collected',
    candidate: 'data-spw-cauldron-candidate',
    candidateVisibility: 'data-spw-cauldron-candidate-visibility',
    category: 'data-spw-cauldron-category',
    cue: 'data-spw-cauldron-cue',
    operators: 'data-spw-cauldron-operators',
    outputState: 'data-spw-cauldron-output-state',
    panel: 'data-spw-cauldron-panel',
    panelToggle: 'data-spw-cauldron-panel-toggle',
    phaseRail: 'data-spw-cauldron-phase-rail',
    remove: 'data-spw-cauldron-remove',
    visibility: 'data-spw-cauldron-visibility',
    chipCount: 'data-spw-cauldron-chip-count',
    chipPhase: 'data-spw-cauldron-chip-phase',
    fixity: 'data-spw-fixity',
    phaseState: 'data-spw-phase',
    tangibility: 'data-spw-tangibility',
    element: 'data-spw-element',
    biome: 'data-spw-biome',
    succession: 'data-spw-succession',
    /* Cross-cutting (shared with spellbook actions; see types/spw.d.ts):
       the vessel writes charge; cast/reset write discharge; checkpoint
       writes reference; restore/decompose write dereference. */
    opDisposition: 'data-spw-op-disposition',
  }),
  events: Object.freeze({
    capture: 'spell:capture',
    updated: 'cauldron:updated',
    cleared: 'cauldron:cleared',
    gardened: 'cauldron:gardened',
    inspected: 'cauldron:ingredient-inspected',
    refreshed: 'cauldron:ingredient-refreshed',
    decomposed: 'spell:decomposed',
  }),
});

/* Cauldron state travels as one axis bundle (G1 grammar, 2026-07-03):
   data-spw-cauldron-state="phase:mixing count:4 garden:tending biome:prairie". */
export const CAULDRON_STATE_AXES = Object.freeze(['phase', 'count', 'garden', 'resonance', 'collected', 'discoverability', 'biome', 'fixity', 'element', 'phaseState', 'tangibility']);

/**
 * @typedef {Object} CauldronStateParts
 * @property {'empty'|'primed'|'mixing'|'spell-ready'} [phase]
 * @property {number|string} [count]
 * @property {string} [garden] garden lifecycle summary
 * @property {number|string} [resonance]
 * @property {boolean|string} [collected]
 * @property {string} [discoverability]
 */

/**
 * Serialize state parts into the G1 bundle value ("phase:mixing count:4").
 * @param {CauldronStateParts} parts
 * @returns {string}
 */
export function composeCauldronState(parts = {}) {
  return CAULDRON_STATE_AXES
    .filter((axis) => parts[axis] !== undefined && parts[axis] !== null && parts[axis] !== '')
    .map((axis) => `${axis}:${parts[axis]}`)
    .join(' ');
}

/**
 * Parse an element's bundle back into parts (inverse of composeCauldronState).
 * @param {{ dataset?: DOMStringMap } | null | undefined} el
 * @returns {CauldronStateParts & Record<string, string>}
 */
export function readCauldronState(el) {
  const raw = el?.dataset?.spwCauldronState || '';
  const parsed = {};
  raw.split(/\s+/).forEach((token) => {
    const [axis, ...rest] = token.split(':');
    if (axis && rest.length) parsed[axis] = rest.join(':');
  });
  return parsed;
}

/**
 * Merge parts into an element's existing bundle (unnamed axes survive).
 * @param {{ dataset?: DOMStringMap } | null | undefined} el
 * @param {CauldronStateParts} parts
 */
export function applyCauldronState(el, parts = {}) {
  if (!el) return;
  el.dataset.spwCauldronState = composeCauldronState({ ...readCauldronState(el), ...parts });
}

export function computeIngredientPhase(ing) {
  if (!ing || !ing.capturedAt) return 'gathering';
  const ageMs = Date.now() - Number(ing.capturedAt);
  const days = ageMs / (1000 * 60 * 60 * 24);
  if (days > GARDEN_PRUNE_DAYS * 1.5) return 'decayed';
  if (days > GARDEN_PRUNE_DAYS) return 'mature';
  if (ing.wonder || ing.operator) return 'resonant';
  return 'gathering';
}

/* The six thermodynamic phases an ingredient can hold, in the order
   storage.js#inferPhaseState assigns them from an operator sigil. */
export const PHASE_SPECTRUM = Object.freeze([
  'ground', 'fluid', 'radiant', 'plastic', 'lattice', 'membrane',
]);

/**
 * What the gathering has become, as opposed to how much of it there is.
 *
 * This is the reason to keep playing with a cauldron after the mechanics are
 * understood. Count tells you the cauldron is working; brew tells you that
 * WHAT you gathered mattered, which is a different and better feeling.
 *
 *   pure      every ingredient shares one phase. Deliberate, narrow, and
 *             reachable early — the first hint that composition is legible.
 *   spectrum  all six phases present at once. Base capacity is six and there
 *             are six phases, so at the default this is an exact set: one of
 *             each, nothing wasted. Raising capacity makes it reachable more
 *             loosely, which is itself a reason to want more room.
 *   mixed     anything else. Not a failure state — the ordinary case.
 *
 * Operators map to phases, so a spectrum is really a claim about having
 * gathered across the whole operator grammar rather than circling one corner
 * of it. That is the lesson the easter egg is teaching.
 *
 * @param {Array<{phase?: string, element?: string}>} ingredients
 * @returns {'empty'|'pure'|'spectrum'|'mixed'}
 */
export function computeCauldronBrew(ingredients = []) {
  const phases = ingredients
    .map((item) => item?.phase || item?.element)
    .filter(Boolean);
  if (!phases.length) return 'empty';

  const distinct = new Set(phases);
  if (distinct.size === 1) return 'pure';
  if (PHASE_SPECTRUM.every((phase) => distinct.has(phase))) return 'spectrum';
  return 'mixed';
}

export function computeCauldronPhase(ingredients = []) {
  const count = ingredients.length;
  if (count === 0) return 'empty';
  if (count === 1) return 'primed';
  if (count === 2) return 'mixing';
  return 'spell-ready';
}

export function getCauldronStatusCopy(count, phase) {
  const available = countPrimeableSources();
  const availabilityCopy = available
    ? `${available} prime sources are visible on this page.`
    : 'No prime sources are visible in this viewport yet.';
  if (phase === 'empty') {
    return `Hold a living term or brace to save it as a fragment. ${availabilityCopy}`;
  }
  if (phase === 'primed') {
    return '1 saved fragment. Add another fragment to compose an extension, or nourish this one for later.';
  }
  if (phase === 'mixing') {
    return '2 saved fragments. An extension draft is available; mix to inspect the combination before planting.';
  }
  return `${count} saved fragments. Extension draft available: refine, copy, plant, or turn it into a vision seed.`;
}

export function countPrimeableSources() {
  return document.querySelectorAll([
    '[data-spw-cauldron-candidate="true"]',
    '[data-spw-living-term]',
    '.spw-living-term',
    '[data-spw-gesture-contract*="prime"]',
    '[data-spw-concept]',
    '[data-spw-topic]',
    '[data-spw-image-key]',
    '[data-spw-semantic-expression]',
  ].join(', ')).length;
}
