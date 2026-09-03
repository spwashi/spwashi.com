/**
 * interaction-vocabulary.js
 * ---------------------------------------------------------------------------
 * Canonical mappings between gestures, interaction contracts, and html phases.
 * Shared by interaction-progression, learnability surfaces, and inspection.
 */

import {
  composeOpBundle,
  getOperatorThresholdState,
  splitOperatorExpression,
} from '/public/js/kernel/shared.js';

export const INTERACTION_PHASES = Object.freeze([
  'idle',
  'approach',
  'prime',
  'charge',
  'inspect',
  'discover',
  'settle',
]);

export const GESTURE_TO_INTERACTION_PHASE = Object.freeze({
  neutral: 'idle',
  active: 'approach',
  charging: 'prime',
  armed: 'charge',
  sustained: 'charge',
  projecting: 'inspect',
  committed: 'settle',
});

export const IMAGE_STATE_TO_PHASE = Object.freeze({
  idle: 'idle',
  primed: 'prime',
  inspecting: 'inspect',
  lensed: 'charge',
  discovered: 'discover',
});

export const INTERACTION_CONTRACT_HINTS = Object.freeze({
  'tap ground navigate': 'prime',
  'tap charge navigate': 'charge',
  'tap ground settle': 'settle',
  'image-study': 'prime',
  'image-discovery': 'discover',
});

export const LOOP_STATE_TO_PHASE = Object.freeze({
  preview: 'prime',
  activated: 'charge',
  resolved: 'settle',
});

export const GESTURE_VERB_TO_PHASE = Object.freeze({
  prime: 'prime',
  inspect: 'inspect',
  discover: 'discover',
  'toggle-lens': 'discover',
  charge: 'charge',
  ground: 'prime',
  navigate: 'settle',
  travel: 'discover',
  swipe: 'discover',
  cycle: 'discover',
  tap: 'prime',
  hold: 'charge',
  preview: 'prime',
});

export const GESTURE_TARGET_SELECTOR = [
  '[data-spw-gesture-contract]',
  '[data-spw-interaction-contract]',
  '[data-spw-operator]',
  '.spw-chip',
  '.frame-sigil',
  '.spw-route-menu-link',
  '.spw-link-expression',
  '.spw-page-landmarks a',
  '.cauldron-ingredient',
  '.cauldron-ingredient-meta.cauldron-deep-link',
].join(', ');

export const IN_PAGE_HOP_SELECTOR = [
  '.spw-page-landmarks a[href]',
  'a.cauldron-deep-link',
  '.cauldron-ingredient-meta.cauldron-deep-link',
].join(', ');

export const SCROLL_RAIL_SELECTOR = '[data-spw-scroll-rail], .spw-visual-link-board__grid, .frame-grid--media';

export function phaseFromGesture(gesture = '') {
  return GESTURE_TO_INTERACTION_PHASE[gesture] || '';
}

export function phaseFromInteractionContract(contract = '') {
  const key = String(contract || '').trim().toLowerCase();
  return INTERACTION_CONTRACT_HINTS[key] || '';
}

export function phaseFromLoopState(state = '') {
  return LOOP_STATE_TO_PHASE[String(state || '').trim().toLowerCase()] || '';
}

export function phaseFromGestureContract(contract = '', verb = '') {
  const normalizedVerb = String(verb || '').trim().toLowerCase();
  if (normalizedVerb) return GESTURE_VERB_TO_PHASE[normalizedVerb] || '';

  const tokens = String(contract || '').trim().toLowerCase().split(/\s+/);
  let phase = '';
  tokens.forEach((token) => {
    const [, mappedVerb] = token.split(':');
    const mapped = GESTURE_VERB_TO_PHASE[mappedVerb || token];
    if (mapped) phase = strongestPhase(phase || 'idle', mapped);
  });
  return phase;
}

/**
 * Tap, hold, and swipe are different verbs on the same contract.
 * Reading only the matching kind keeps a toggle tap from inheriting swipe:cycle.
 */
export function phaseFromContractKind(contract = '', kind = 'tap') {
  const prefix = `${String(kind || 'tap').trim().toLowerCase()}:`;
  const token = String(contract || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .find((part) => part.startsWith(prefix));
  if (!token) return GESTURE_VERB_TO_PHASE[kind] || '';
  const verb = token.slice(prefix.length);
  return GESTURE_VERB_TO_PHASE[verb] || GESTURE_VERB_TO_PHASE[kind] || '';
}


export function strongestPhase(current = 'idle', candidate = '') {
  if (!candidate || candidate === current) return current;
  const order = INTERACTION_PHASES;
  const currentIndex = order.indexOf(current);
  const candidateIndex = order.indexOf(candidate);
  if (candidateIndex < 0) return current;
  if (currentIndex < 0) return candidate;
  return candidateIndex > currentIndex ? candidate : current;
}

const WRAP_CONTEXT = Object.freeze({
  mode: 'inspecting',
  scene: 'comparing',
  direction: 'browsing',
  ground: 'reading',
  potential: 'browsing',
});

export function resolveInteractionSemantics(element) {
  if (!element || typeof element !== 'object') return null;

  const host = element.closest?.('.mode-switch, [data-spw-scene-interpret], .spw-frame, [data-spw-kind="frame"]') || element;
  const seatOpen = Boolean(host?.closest?.('.mode-switch')?.dataset?.spwModeSeat === 'open'
    || host?.dataset?.spwModeSeat === 'open');
  const sceneEntered = host?.dataset?.spwSceneState === 'entered'
    || Boolean(host?.closest?.('[data-spw-scene-state="entered"]'));
  const expression = host?.dataset?.spwSemanticExpression || '';
  const text = expression || (element.textContent || '').trim();
  const split = splitOperatorExpression(text);
  const operator = seatOpen
    ? 'mode'
    : (sceneEntered ? 'scene' : (element.dataset?.spwOperator || host?.dataset?.spwOperator || split.operator || ''));
  const threshold = getOperatorThresholdState(operator || split.prefix);
  const bundle = composeOpBundle(text);
  const context = element.dataset?.spwInteractionContext
    || host?.dataset?.spwInteractionContext
    || document.documentElement?.dataset?.spwInteractionContext
    || WRAP_CONTEXT[operator]
    || 'idle';
  const reversibility = element.dataset?.spwOperatorReversibility || 'revisable';
  const dispatch = split.position === 'postfix' ? 'reflect' : (split.position === 'infix' ? 'enclose' : 'forward');

  return {
    operator,
    prefix: split.prefix || '',
    operand: split.operand || '',
    position: split.position || 'prefix',
    thresholdState: threshold?.state || 'latent',
    context,
    reversibility,
    dispatch,
    expression,
    bundle,
  };
}