/**
 * Canonical region role, kind, and context inference.
 * Shared by page metadata normalization and runtime region profiling.
 */

import {
  ANNOTATION_LAYER_REGION_SELECTOR,
  REGION_SELECTOR,
  inferTopographyKind,
} from '../kernel/dom-contracts.js';
import { safeQueryAll } from '../runtime/runtime-helpers.js';

export const SPW_ROLE_INFERENCE_CONTRACT = Object.freeze({
  authoredTruth: 'data-spw-role',
  inferredRoles: Object.freeze([
    'routing',
    'schema',
    'reference',
    'control',
    'orientation',
  ]),
  portableUse:
    'Import this module when multiple runtime layers need the same region role vocabulary.',
  regionSelectors: Object.freeze({
    default: 'REGION_SELECTOR from dom-contracts',
    annotation: 'ANNOTATION_LAYER_REGION_SELECTOR for main-scoped annotation targets',
  }),
});

export function collectRegions(root = document, options = {}) {
  const selector = options.selector || REGION_SELECTOR;
  const regions = safeQueryAll(selector, root).filter((el) => el instanceof HTMLElement);
  const seen = new Set();
  const ordered = [];

  for (const el of regions) {
    if (seen.has(el)) continue;
    seen.add(el);
    ordered.push(el);
  }

  return ordered;
}

export function collectAnnotationRegions(root = document) {
  return collectRegions(root, { selector: ANNOTATION_LAYER_REGION_SELECTOR });
}

export function inferRegionKind(el) {
  return inferTopographyKind(el, 'component');
}

export function inferRegionRole(el) {
  if (el.dataset.spwRole) return el.dataset.spwRole;

  const text = (
    el.id
    || el.getAttribute('aria-label')
    || el.querySelector('h1,h2,h3,h4,strong')?.textContent
    || ''
  ).toLowerCase();

  if (el.matches('nav')) return 'routing';
  if (text.includes('index') || text.includes('routes') || text.includes('navigation')) return 'routing';
  if (text.includes('plan') || text.includes('schema') || text.includes('structure')) return 'schema';
  if (text.includes('reference') || text.includes('register')) return 'reference';
  if (text.includes('settings')) return 'control';
  if (text.includes('hero') || text.includes('about') || text.includes('contact')) return 'orientation';

  return el.classList.contains('site-hero') ? 'orientation' : 'reference';
}

export function inferRegionContext(el, body = document.body) {
  return (
    el.dataset.spwContext
    || el.closest('[data-spw-context]')?.dataset?.spwContext
    || body?.dataset?.spwContext
    || 'reading'
  );
}