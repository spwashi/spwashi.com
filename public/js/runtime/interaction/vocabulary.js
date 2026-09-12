/**
 * interaction/vocabulary.js
 * ---------------------------------------------------------------------------
 * Canonical mappings between gestures, interaction contracts, and html phases.
 * Shared by interaction-progression, learnability surfaces, and inspection.
 */

import {
  composeOpBundle,
  getOperatorThresholdState,
  splitOperatorExpression,
} from '/public/js/kernel/shared.js';

import { PHASE_ARC } from './arc-taxonomy.js';

export const INTERACTION_PHASES = PHASE_ARC.states;

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

const SPELLBOOKS = Object.freeze({
  gesture: GESTURE_TO_INTERACTION_PHASE,
  image_state: IMAGE_STATE_TO_PHASE,
  loop_state: LOOP_STATE_TO_PHASE,
  verb: GESTURE_VERB_TO_PHASE,
  contract: INTERACTION_CONTRACT_HINTS,
});

export function phaseFromSpell(input = '', type = 'gesture') {
  const book = Object.hasOwn(SPELLBOOKS, type) ? SPELLBOOKS[type] : null;
  const key = String(input || '').trim().toLowerCase();
  return book && Object.hasOwn(book, key) ? book[key] : '';
}

export function phaseFromGesture(gesture = '') {
  return phaseFromSpell(gesture, 'gesture');
}

export function phaseFromInteractionContract(contract = '') {
  return phaseFromSpell(contract, 'contract');
}

export function phaseFromLoopState(state = '') {
  return phaseFromSpell(state, 'loop_state');
}

export function phaseFromGestureContract(contract = '', verb = '') {
  const normalizedVerb = String(verb || '').trim().toLowerCase();
  if (normalizedVerb) return phaseFromSpell(normalizedVerb, 'verb');

  const tokens = String(contract || '').trim().toLowerCase().split(/\s+/);
  let phase = '';
  tokens.forEach((token) => {
    const [, mappedVerb] = token.split(':');
    const mapped = phaseFromSpell(mappedVerb || token, 'verb');
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
  if (!token) return phaseFromSpell(kind, 'verb');
  const verb = token.slice(prefix.length);
  return phaseFromSpell(verb, 'verb') || phaseFromSpell(kind, 'verb');
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
