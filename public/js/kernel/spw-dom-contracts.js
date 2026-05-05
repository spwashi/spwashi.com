/**
 * spw-dom-contracts.js
 * --------------------------------------------------------------------------
 * Shared DOM topography for the static site runtime.
 *
 * The goal is plain: make the site easy to hand to another developer without
 * asking them to rediscover which selectors define regions, components,
 * modules, and slots.
 * --------------------------------------------------------------------------
 */

export const CORE_COMPONENT_SELECTORS = Object.freeze([
  '.site-frame',
  '.frame-panel',
  '.frame-card',
  '.media-card',
  '.media-focus-card',
  '.topic-reference-card',
  '.vibe-widget',
  '.palette-probe',
  '.software-card',
  '.operator-card',
  '.plan-card',
  '.compare-card',
  '.spec-column',
  '.mode-panel',
  '.ref-card',
]);

export const SURFACE_COMPONENT_SELECTORS = Object.freeze([
  '.image-study',
  '.topic-photo-card',
  '.spw-svg-figure',
  '[data-spw-image-surface]',
]);

export const RELATION_COMPONENT_SELECTORS = Object.freeze([
  '.intent-cluster',
  '.context-edge-card',
  '.semantic-contract-card',
]);

export const SEMANTIC_ATTRIBUTE_SELECTORS = Object.freeze([
  '[data-spw-kind]',
  '[data-spw-component-kind]',
  '[data-spw-role]',
  '[data-spw-slot]',
  '[data-spw-features]',
  '[data-spw-meaning]',
  '[data-spw-inspect]',
]);

export const REGION_SELECTORS = Object.freeze([
  '.site-frame',
  '[data-spw-kind="frame"]',
  '[data-spw-kind="panel"]',
  '[data-spw-kind="card"]',
  '[data-spw-kind="surface"]',
  '[data-spw-role]',
  '[data-spw-slot]',
]);

export const COMPONENT_SELECTORS = Object.freeze([
  ...CORE_COMPONENT_SELECTORS,
  ...SURFACE_COMPONENT_SELECTORS,
  ...RELATION_COMPONENT_SELECTORS,
  ...SEMANTIC_ATTRIBUTE_SELECTORS,
]);

export const MODULE_SELECTORS = Object.freeze([
  '.site-frame',
  '.frame-panel',
  '.frame-card',
  '.software-card',
  '.operator-card',
  ...SURFACE_COMPONENT_SELECTORS,
  ...RELATION_COMPONENT_SELECTORS,
]);

export const SEMANTIC_CHROME_SELECTORS = Object.freeze([
  '.site-frame',
  '.frame-panel',
  '.frame-card',
  '.mode-panel',
  '[data-spw-kind]',
  '[data-spw-role]',
  '[data-spw-slot]',
]);

export const COMPONENT_SELECTOR = COMPONENT_SELECTORS.join(', ');
export const MODULE_SELECTOR = MODULE_SELECTORS.join(', ');
export const REGION_SELECTOR = REGION_SELECTORS.join(', ');
export const SEMANTIC_CHROME_SELECTOR = SEMANTIC_CHROME_SELECTORS.join(', ');

export const FRAME_SELECTOR = '.site-frame, [data-spw-kind="frame"]';
export const REGION_HOST_SELECTOR = '.site-frame, .frame-panel, .frame-card, [data-spw-kind], [data-spw-role]';

export const SITE_TOPOGRAPHY = Object.freeze({
  route: 'body[data-spw-surface]',
  shell: 'body > header, .site-header',
  main: 'main',
  region: REGION_SELECTOR,
  component: COMPONENT_SELECTOR,
  module: MODULE_SELECTOR,
  slot: '[data-spw-slot]',
});

function hasClass(el, className) {
  return Boolean(el?.classList?.contains(className));
}

function matchesAny(el, selectors = []) {
  return selectors.some((selector) => el?.matches?.(selector));
}

export function writeDatasetValue(el, key, value, options = {}) {
  if (!el?.dataset || !key) return false;

  const { allowEmpty = false, missingOnly = false } = options;
  const shouldRemove = value == null || (!allowEmpty && value === '');

  if (shouldRemove) {
    if (missingOnly || !(key in el.dataset)) return false;
    delete el.dataset[key];
    return true;
  }

  if (missingOnly && el.dataset[key]) return false;

  const next = String(value);
  if (el.dataset[key] === next) return false;
  el.dataset[key] = next;
  return true;
}

export function writeDatasetValueIfMissing(el, key, value, options = {}) {
  return writeDatasetValue(el, key, value, { ...options, missingOnly: true });
}

export function writeDatasetValues(el, entries = {}, options = {}) {
  if (!el?.dataset || !entries || typeof entries !== 'object') return false;

  let changed = false;
  Object.entries(entries).forEach(([key, value]) => {
    changed = writeDatasetValue(el, key, value, options) || changed;
  });
  return changed;
}

export function removeDatasetValues(el, keys = []) {
  if (!el?.dataset || !Array.isArray(keys)) return false;

  let changed = false;
  keys.forEach((key) => {
    if (!key || !(key in el.dataset)) return;
    delete el.dataset[key];
    changed = true;
  });
  return changed;
}

export function writeStyleValue(el, property, value, options = {}) {
  if (!el?.style || !property) return false;

  const { allowEmpty = false } = options;
  const shouldRemove = value == null || (!allowEmpty && value === '');

  if (shouldRemove) {
    if (!el.style.getPropertyValue(property)) return false;
    el.style.removeProperty(property);
    return true;
  }

  const next = String(value);
  if (el.style.getPropertyValue(property) === next) return false;
  el.style.setProperty(property, next);
  return true;
}

export function normalizeTopographyToken(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function axisToken(axis, value) {
  const normalizedAxis = normalizeTopographyToken(axis);
  const normalizedValue = normalizeTopographyToken(value);
  return normalizedAxis && normalizedValue ? `${normalizedAxis}-${normalizedValue}` : '';
}

export function buildAxisGenome(axisEntries = [], listEntries = []) {
  const tokens = new Set();

  axisEntries.forEach(([axis, value]) => {
    const token = axisToken(axis, value);
    if (token) tokens.add(token);
  });

  listEntries.forEach(([axis, values]) => {
    (values || []).forEach((value) => {
      const token = axisToken(axis, value);
      if (token) tokens.add(token);
    });
  });

  return [...tokens].join(' ');
}

export function inferTopographyKind(el, fallback = 'component') {
  if (!el) return fallback;
  if (el.dataset?.spwKind) return normalizeTopographyToken(el.dataset.spwKind);
  if (el.dataset?.spwComponentKind) return normalizeTopographyToken(el.dataset.spwComponentKind);

  if (matchesAny(el, SURFACE_COMPONENT_SELECTORS)) return 'surface';
  if (hasClass(el, 'site-frame')) return 'frame';
  if (hasClass(el, 'frame-panel') || hasClass(el, 'intent-cluster')) return 'panel';
  if (hasClass(el, 'mode-panel')) return 'lens';
  if (
    hasClass(el, 'frame-card')
    || hasClass(el, 'media-card')
    || hasClass(el, 'media-focus-card')
    || hasClass(el, 'topic-reference-card')
    || hasClass(el, 'vibe-widget')
    || hasClass(el, 'palette-probe')
    || hasClass(el, 'software-card')
    || hasClass(el, 'operator-card')
    || hasClass(el, 'plan-card')
    || hasClass(el, 'compare-card')
    || hasClass(el, 'spec-column')
    || hasClass(el, 'context-edge-card')
    || hasClass(el, 'semantic-contract-card')
  ) return 'card';

  if (el.matches?.('main')) return 'main';
  if (el.matches?.('nav')) return 'nav';
  if (el.matches?.('aside')) return 'aside';
  if (el.matches?.('article')) return 'article';
  if (el.matches?.('section')) return 'section';
  if (el.matches?.('figure')) return 'figure';

  return fallback;
}
