/**
 * concept-salience.js
 * ---------------------------------------------------------------------------
 * Conceptual salience, vocabulary collectibility, and learnable-dimension refs
 * for screenshot-worthy, reference-friendly markup.
 */

import { observeAddedMatches } from '/public/js/kernel/dom-contracts.js';

const TARGET_SELECTOR = [
  '[data-spw-concept]',
  '[data-spw-semantic-expression]',
  '.study-summary',
  '[data-spw-image-lens-active]',
  '[data-spw-collectability]',
  '.spec-pill',
].join(', ');

const DIMENSION_BY_ATTR = Object.freeze({
  'data-spw-packing-state': 'spatial',
  'data-spw-pack': 'spatial',
  'data-spw-pack-occupancy': 'spatial',
  'data-spw-loading-ecology-phase': 'temporal',
  'data-spw-position-phase': 'temporal',
  'data-spw-hydration-pass': 'temporal',
  'data-spw-palette-resonance': 'color',
  'data-spw-accent-operator': 'semantic',
  'data-spw-image-lens-active': 'semantic',
  'data-spw-wonder': 'attention',
  'data-spw-salience': 'attention',
});

let initialized = false;

function slugify(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['".,!?()[\]/]+/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[–—-]+/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '') || 'concept';
}

function inferConceptRef(element) {
  return element.dataset.spwConcept
    || element.dataset.spwLivingTerm
    || element.dataset.spwSemanticExpression
    || element.querySelector('strong')?.textContent
    || element.textContent
    || '';
}

function inferLearnableDimension(element) {
  const host = element.closest('.site-frame, [data-spw-feature], main') || element;
  for (const [attr, dimension] of Object.entries(DIMENSION_BY_ATTR)) {
    const name = attr.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (host.dataset?.[name]) return dimension;
  }
  if (host.dataset?.spwImageLensActive) return 'semantic';
  if (host.dataset?.spwCollectability) return 'attention';
  return 'semantic';
}

function mapCollectibility(element) {
  const raw = element.dataset.spwCollectability
    || element.closest('[data-spw-collectability]')?.dataset.spwCollectability
    || '';
  if (raw === 'high' || raw === 'index') return 'high';
  if (raw === 'medium' || raw === 'some') return 'medium';
  if (raw === 'low') return 'low';
  return '';
}

function annotateTarget(element) {
  const conceptRef = slugify(inferConceptRef(element));
  if (conceptRef && !element.dataset.spwConceptRef) {
    element.dataset.spwConceptRef = conceptRef;
  }

  const vocabulary = element.dataset.spwVocabularyTerm
    || element.querySelector('.spec-pill')?.textContent
    || element.dataset.spwImageLensActive
    || '';
  if (vocabulary && !element.dataset.spwVocabularyTerm) {
    element.dataset.spwVocabularyTerm = String(vocabulary).trim().toLowerCase();
  }

  const collectibility = mapCollectibility(element);
  if (collectibility && !element.dataset.spwVocabularyCollectible) {
    element.dataset.spwVocabularyCollectible = collectibility;
  }

  const dimension = inferLearnableDimension(element);
  if (dimension && !element.dataset.spwLearnableDimension) {
    element.dataset.spwLearnableDimension = dimension;
  }

  if (!element.dataset.spwSalienceWeight) {
    const weight = collectibility === 'high' ? '0.82' : collectibility === 'medium' ? '0.58' : '0.42';
    element.dataset.spwSalienceWeight = weight;
  }
}

function initConceptSalienceInternal(root = document) {
  if (initialized) return () => {};
  initialized = true;

  const annotateAll = () => {
    root.querySelectorAll(TARGET_SELECTOR).forEach((node) => {
      if (node instanceof HTMLElement) annotateTarget(node);
    });
  };

  annotateAll();

  const disconnect = observeAddedMatches(TARGET_SELECTOR, annotateAll, {
    root: root.body || root.documentElement,
  });

  return () => {
    disconnect();
    initialized = false;
  };
}

let activeSalienceCleanup = null;

export function initConceptSalience(root = document) {
  unmountConceptSalience();
  activeSalienceCleanup = initConceptSalienceInternal(root);
  return activeSalienceCleanup;
}

export function unmountConceptSalience() {
  if (activeSalienceCleanup) {
    try { activeSalienceCleanup(); } catch (_) {}
    activeSalienceCleanup = null;
  }
}

export { unmountConceptSalience as unmount };