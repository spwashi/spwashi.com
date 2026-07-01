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
  }),
  attributes: Object.freeze({
    host: 'data-spw-cauldron',
    phase: 'data-spw-cauldron-phase',
    state: 'data-spw-cauldron-state',
    count: 'data-spw-cauldron-count',
    ingredient: 'data-spw-cauldron-ingredient',
    ingredientPhase: 'data-spw-ingredient-phase',
    action: 'data-spw-cauldron-action',
    mirror: 'data-spw-cauldron-mirror',
    gardenPhase: 'data-spw-cauldron-garden-phase',
    discoverability: 'data-spw-cauldron-discoverability',
    resonance: 'data-spw-cauldron-resonance',
    collected: 'data-spw-cauldron-collected',
  }),
  events: Object.freeze({
    capture: 'spell:capture',
    updated: 'cauldron:updated',
    cleared: 'cauldron:cleared',
    gardened: 'cauldron:gardened',
    inspected: 'cauldron:ingredient-inspected',
    refreshed: 'cauldron:ingredient-refreshed',
  }),
});

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
