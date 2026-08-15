// operators.js — orchestrates sigil annotation and operator interaction wiring.

import { OPERATOR_SIGNAL_SELECTOR, observeAddedMatches } from '/public/js/kernel/dom-contracts.js';
import {
  detectOperator,
  detectOperatorFromElement,
} from '/public/js/kernel/shared.js';
import {
  annotateDelimiters,
  annotateSemanticExpressions,
  applyOperatorMetadata,
} from '/public/js/semantic/sigil-annotation.js';
import {
  annotateRefs,
  wireSigilTransitions,
  wireProbeSigils,
} from '/public/js/semantic/operator-interactions.js';

let initialized = false;

const EXTENDED_OPERATOR_SIGNAL_SELECTOR = [
  OPERATOR_SIGNAL_SELECTOR,
  '.badge',
  '.tag',
  '.pill',
  '.spw-spell-button',
  '.spw-spell-shell',
  '.spw-spell-link',
].join(', ');

const annotateSignals = (root = document) => {
  const sigils = Array.from(root.querySelectorAll(EXTENDED_OPERATOR_SIGNAL_SELECTOR));

  for (const sigil of sigils) {
    if (sigil.matches('.spw-delimiter')) continue;

    const text = sigil.textContent.trim();
    const op = detectOperatorFromElement(sigil) || detectOperator(text);
    applyOperatorMetadata(sigil, op);
  }

  annotateDelimiters(root);
};

const refreshOperatorSemantics = (root = document) => {
  annotateSignals(root);
  annotateSemanticExpressions(root);
  wireSigilTransitions(root);
  wireProbeSigils(root);
  annotateRefs(root);
};

let observerDisconnect = null;

const initSpwOperators = () => {
  if (initialized) return;
  initialized = true;

  refreshOperatorSemantics(document);

  observerDisconnect = observeAddedMatches(EXTENDED_OPERATOR_SIGNAL_SELECTOR, () => {
    refreshOperatorSemantics(document);
  });
};

export function unmountSpwOperators() {
  if (observerDisconnect) {
    try { observerDisconnect(); } catch (_) {}
    observerDisconnect = null;
  }
  initialized = false;
}

export const unmount = unmountSpwOperators;

export { initSpwOperators, refreshOperatorSemantics };
