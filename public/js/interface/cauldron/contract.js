export const CAULDRON_KEY = 'spw-cauldron';
export const MAX_INGREDIENTS = 6;
export const GARDEN_PRUNE_DAYS = 30;

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
