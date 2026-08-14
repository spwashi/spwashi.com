import { CAULDRON_PHASES, computeIngredientPhase } from './contract.js';

const GARDEN_PHASE_RANK = Object.freeze({
  empty: 0,
  gathering: 1,
  resonant: 2,
  mature: 3,
  decayed: 4,
});

const PULSE_MS = 1400;

let lastMixSignature = '';

export function getLastMixSignature() {
  return lastMixSignature;
}

export function setLastMixSignature(signature = '') {
  lastMixSignature = signature;
}

export function computeGardenHealthPhase(ingredients = []) {
  if (!ingredients.length) return 'empty';
  const phases = ingredients.map(computeIngredientPhase);
  if (phases.includes('decayed')) return 'decayed';
  if (phases.includes('mature')) return 'mature';
  if (phases.includes('resonant')) return 'resonant';
  return 'gathering';
}

export function syncCollectedSourceMarks(ingredients = []) {
  const expressions = new Set(ingredients.map((item) => item.expression).filter(Boolean));

  document.querySelectorAll('[data-spw-cauldron-collected="true"]').forEach((node) => {
    const expr = node.getAttribute('data-spw-semantic-expression')
      || node.getAttribute('data-spw-expression')
      || node.dataset.spwConcept
      || '';
    if (!expressions.has(expr)) {
      delete node.dataset.spwCauldronCollected;
      if (node.dataset.spwPrimeState === 'collected') {
        node.dataset.spwPrimeState = node.dataset.spwCauldronCandidate ? 'candidate' : '';
      }
    }
  });

  ingredients.forEach((item) => {
    const expr = item.expression;
    if (!expr) return;
    const escaped = CSS.escape(expr);
    const selectors = [
      `[data-spw-semantic-expression="${escaped}"]`,
      `[data-spw-expression="${escaped}"]`,
    ];
    if (item.sourceElement) {
      const source = String(item.sourceElement);
      if (source.startsWith('#')) {
        selectors.push(source);
      } else if (!source.includes(' ')) {
        selectors.push(`[data-spw-concept="${CSS.escape(source)}"], [data-spw-living-term="${CSS.escape(source)}"]`);
      }
    }
    document.querySelectorAll(selectors.join(', ')).forEach((node) => {
      if (node.closest('.cauldron-ingredient, [data-spw-cauldron]')) return;
      node.dataset.spwCauldronCollected = 'true';
      node.dataset.spwPrimeState = 'collected';
    });
  });
}

export function syncOperatorResonance(ingredients = []) {
  const root = document.documentElement;
  const operators = [...new Set(ingredients.map((item) => item.operator).filter(Boolean))];
  const phases = ingredients.map((item) => item.phase || item.element).filter(Boolean);

  if (operators.length) {
    root.dataset.spwCauldronResonanceOperators = operators.join(' ');
  } else {
    delete root.dataset.spwCauldronResonanceOperators;
  }

  if (phases.length) {
    const counts = {};
    phases.forEach((p) => { counts[p] = (counts[p] || 0) + 1; });
    const dominant = Object.keys(counts).reduce((a, b) => (counts[a] >= counts[b] ? a : b), phases[0]);
    root.dataset.spwCauldronPhase = dominant;
  } else {
    delete root.dataset.spwCauldronPhase;
  }
}

export function syncDiscoverabilityCues(count, phase, availableSources) {
  document.querySelectorAll('[data-spw-cauldron]').forEach((host) => {
    if (!(host instanceof HTMLElement)) return;
    if (phase === 'empty' && availableSources > 0) {
      host.dataset.spwCauldronDiscoverability = 'primable';
    } else if (phase === 'primed') {
      host.dataset.spwCauldronDiscoverability = 'compose-next';
    } else if (phase === 'mixing' || phase === 'spell-ready') {
      host.dataset.spwCauldronDiscoverability = 'spell-ready';
    } else {
      delete host.dataset.spwCauldronDiscoverability;
    }
  });

  const root = document.documentElement;
  if (count === 0 && availableSources > 0) {
    root.dataset.spwCauldronCue = 'hold-to-gather';
  } else if (count === 1) {
    root.dataset.spwCauldronCue = 'add-second-force';
  } else if (count >= 2) {
    root.dataset.spwCauldronCue = 'mix-or-plant';
  } else {
    delete root.dataset.spwCauldronCue;
  }
}

export function syncGardenHealth(hosts, ingredients) {
  const gardenPhase = computeGardenHealthPhase(ingredients);
  hosts.forEach((host) => {
    if (!(host instanceof HTMLElement)) return;
    host.dataset.spwCauldronGardenPhase = gardenPhase;
    const rank = GARDEN_PHASE_RANK[gardenPhase] ?? 0;
    host.dataset.spwCauldronGardenRank = String(rank);
  });
}

export function detectIngredientArrival(ingredients, previousSignature = '') {
  const signature = ingredients.map((item) => `${item.expression}|${item.capturedAt || 0}`).join('~');
  if (!signature || signature === previousSignature) return null;
  const previousCount = previousSignature ? previousSignature.split('~').filter(Boolean).length : 0;
  if (ingredients.length <= previousCount) return null;
  return ingredients[ingredients.length - 1] || null;
}

export function pulseNewIngredient(container, expression = '') {
  if (!(container instanceof HTMLElement) || !expression) return;
  const escaped = CSS.escape(expression);
  const chip = container.querySelector(
    `[data-spw-semantic-expression="${escaped}"], [data-spw-cauldron-ingredient]:last-child`,
  );
  if (!(chip instanceof HTMLElement)) return;
  chip.classList.add('is-cauldron-ingredient-new');
  chip.dataset.spwCauldronResonance = 'arrived';
  window.setTimeout(() => {
    chip.classList.remove('is-cauldron-ingredient-new');
    if (chip.dataset.spwCauldronResonance === 'arrived') delete chip.dataset.spwCauldronResonance;
  }, PULSE_MS);
}

export function pulseCauldronFeedback(kind = 'gather', detail = {}) {
  const host = document.querySelector('.site-footer__cauldron, [data-spw-cauldron]');
  const chip = document.getElementById('spw-cauldron-chip');
  const root = document.documentElement;

  root.dataset.spwCauldronResonance = kind;
  if (host instanceof HTMLElement) {
    host.classList.add('is-cauldron-pulsing');
    host.dataset.spwCauldronResonance = kind;
    if (detail.expression) host.dataset.spwCauldronLastGather = detail.expression;
  }
  if (chip instanceof HTMLElement) {
    chip.classList.add('is-cauldron-pulsing');
    chip.dataset.spwCauldronResonance = kind;
  }

  window.setTimeout(() => {
    if (root.dataset.spwCauldronResonance === kind) delete root.dataset.spwCauldronResonance;
    if (host instanceof HTMLElement) {
      host.classList.remove('is-cauldron-pulsing');
      if (host.dataset.spwCauldronResonance === kind) delete host.dataset.spwCauldronResonance;
      if (detail.expression && host.dataset.spwCauldronLastGather === detail.expression) {
        delete host.dataset.spwCauldronLastGather;
      }
    }
    if (chip instanceof HTMLElement) {
      chip.classList.remove('is-cauldron-pulsing');
      if (chip.dataset.spwCauldronResonance === kind) delete chip.dataset.spwCauldronResonance;
    }
  }, PULSE_MS);
}

export function shouldHideStaleMixOutput(ingredients) {
  if (!lastMixSignature) return false;
  const signature = ingredients.map((item) => `${item.expression}|${item.capturedAt || 0}`).join('~');
  return signature !== lastMixSignature;
}

export function clearMixOutputState() {
  lastMixSignature = '';
}

export function isPhaseComplete(stepPhase, activePhase) {
  const stepIndex = CAULDRON_PHASES.indexOf(stepPhase);
  const activeIndex = CAULDRON_PHASES.indexOf(activePhase);
  return stepIndex >= 0 && activeIndex >= 0 && stepIndex < activeIndex;
}