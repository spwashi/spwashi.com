/**
 * Composition Box Model
 *
 * Purpose
 * - Make component layout readable as a storytelling and inspection surface.
 * - Annotate regions with stable box/composition attributes for CSS.
 * - Expose snapshots that are useful from the browser console or another site.
 */

import {
  writeDatasetValue,
  writeDatasetValues,
} from '/public/js/kernel/dom-contracts.js';

const DEFAULT_SELECTOR = [
  '[data-spw-box-model]',
  '[data-spw-composition-flow]',
  '[data-site-settings-panel]',
  '[data-spw-feature]',
  '.site-frame',
  '.vibe-widget',
  '.settings-fieldset',
  '.settings-category',
].join(', ');

const FLOW_BY_DISPLAY = Object.freeze({
  block: 'stack',
  flex: 'flex',
  grid: 'grid',
  inline: 'inline',
  'inline-block': 'inline-block',
  'inline-flex': 'inline-flex',
  'inline-grid': 'inline-grid',
});

const MEASURE_BANDS = Object.freeze({
  narrow: 320,
  comfortable: 640,
  wide: 960,
});

const PRESENCE_STATES = Object.freeze({
  HIDDEN: 'hidden',
  WAITING: 'waiting',
  PRESENT: 'present',
  OVERFULL: 'overfull',
});

const normalizeToken = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const isElement = (value) => value instanceof Element;

function toNumber(value = '') {
  const parsed = Number.parseFloat(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveTargets(root = document, selector = DEFAULT_SELECTOR) {
  if (isElement(root) && root.matches(selector)) return [root];
  return [...(root?.querySelectorAll?.(selector) || [])];
}

function readDisplayFlow(style) {
  const display = String(style.display || 'block').split(/\s+/).find(Boolean) || 'block';
  return FLOW_BY_DISPLAY[display] || display;
}

function readBoxModel(el) {
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const paddingInline = toNumber(style.paddingLeft) + toNumber(style.paddingRight);
  const paddingBlock = toNumber(style.paddingTop) + toNumber(style.paddingBottom);
  const borderInline = toNumber(style.borderLeftWidth) + toNumber(style.borderRightWidth);
  const borderBlock = toNumber(style.borderTopWidth) + toNumber(style.borderBottomWidth);
  const contentInline = Math.max(0, rect.width - paddingInline - borderInline);
  const contentBlock = Math.max(0, rect.height - paddingBlock - borderBlock);
  const overflowX = el.scrollWidth > Math.ceil(el.clientWidth + 1);
  const overflowY = el.scrollHeight > Math.ceil(el.clientHeight + 1);
  const childCount = el.children?.length || 0;
  const linkCount = el.querySelectorAll?.('a[href], button, summary, input, select, textarea')?.length || 0;

  return {
    display: style.display,
    flow: readDisplayFlow(style),
    inlineSize: Math.round(rect.width),
    blockSize: Math.round(rect.height),
    contentInline: Math.round(contentInline),
    contentBlock: Math.round(contentBlock),
    paddingInline: Math.round(paddingInline),
    paddingBlock: Math.round(paddingBlock),
    borderInline: Math.round(borderInline),
    borderBlock: Math.round(borderBlock),
    overflowX,
    overflowY,
    childCount,
    linkCount,
  };
}

function resolveMeasure(box) {
  if (box.inlineSize < MEASURE_BANDS.narrow) return 'narrow';
  if (box.inlineSize < MEASURE_BANDS.comfortable) return 'compact';
  if (box.inlineSize < MEASURE_BANDS.wide) return 'comfortable';
  return 'wide';
}

function resolvePresence(box) {
  if (!box.inlineSize || !box.blockSize) return PRESENCE_STATES.HIDDEN;
  if (box.overflowX || box.overflowY) return PRESENCE_STATES.OVERFULL;
  if (!box.childCount && !box.linkCount) return PRESENCE_STATES.WAITING;
  return PRESENCE_STATES.PRESENT;
}

function resolveCompositionRole(el, box) {
  const explicit = el.dataset.spwBoxModel || el.dataset.spwCompositionRole || '';
  if (explicit) return normalizeToken(explicit);
  if (el.matches('.site-frame')) return 'stage';
  if (el.matches('.settings-category, details')) return 'fold';
  if (el.matches('.settings-fieldset')) return 'control-group';
  if (el.matches('.vibe-widget, [data-site-settings-panel]')) return 'control-card';
  if (el.matches('[data-spw-feature]')) return 'feature';
  if (box.linkCount > 2) return 'choice-field';
  return 'component';
}

function describeBox(el, box, role, presence) {
  const label = el.id || el.dataset.spwFeature || el.dataset.spwInspect || role;
  const action = presence === PRESENCE_STATES.OVERFULL
    ? 'needs containment before it can tell its story cleanly'
    : presence === PRESENCE_STATES.WAITING
      ? 'is waiting for copy, controls, or a visible outcome'
      : 'is ready to support reading, tuning, or navigation';

  return `${label}: ${role} uses ${box.flow} flow at ${resolveMeasure(box)} measure and ${action}.`;
}

export function snapshotCompositionBox(target, options = {}) {
  const el = typeof target === 'string'
    ? (options.root || document).querySelector(target)
    : target;
  if (!isElement(el)) return null;

  const box = readBoxModel(el);
  const role = resolveCompositionRole(el, box);
  const presence = resolvePresence(box);
  const measure = resolveMeasure(box);

  return {
    selector: el.id ? `#${el.id}` : el.dataset.spwFeature ? `[data-spw-feature="${el.dataset.spwFeature}"]` : el.tagName.toLowerCase(),
    role,
    presence,
    measure,
    flow: box.flow,
    box,
    story: describeBox(el, box, role, presence),
    semantics: {
      kind: el.dataset.spwKind || '',
      role: el.dataset.spwRole || '',
      feature: el.dataset.spwFeature || '',
      inspect: el.dataset.spwInspect || '',
      module: el.dataset.spwModule || '',
    },
  };
}

export function annotateCompositionBox(target, options = {}) {
  const snapshot = snapshotCompositionBox(target, options);
  const el = typeof target === 'string'
    ? (options.root || document).querySelector(target)
    : target;
  if (!snapshot || !isElement(el)) return null;

  writeDatasetValues(el, {
    spwBoxModel: snapshot.role,
    spwCompositionFlow: snapshot.flow,
    spwBoxMeasure: snapshot.measure,
    spwBoxPresence: snapshot.presence,
    spwBoxOverflow: snapshot.box.overflowX || snapshot.box.overflowY ? 'true' : 'false',
  }, { missingOnly: options.missingOnly === true });

  if (options.story !== false) {
    writeDatasetValue(el, 'spwBoxStory', snapshot.story);
  }

  return snapshot;
}

export function annotateCompositionBoxes(root = document, options = {}) {
  const selector = options.selector || DEFAULT_SELECTOR;
  return resolveTargets(root, selector)
    .map((el) => annotateCompositionBox(el, options))
    .filter(Boolean);
}

export function snapshotCompositionBoxes(root = document, options = {}) {
  const selector = options.selector || DEFAULT_SELECTOR;
  return resolveTargets(root, selector)
    .map((el) => snapshotCompositionBox(el, options))
    .filter(Boolean);
}

export function initSpwCompositionBoxModel(ctx = {}) {
  const root = ctx.root || document;
  const snapshots = annotateCompositionBoxes(root, {
    selector: ctx.selector || DEFAULT_SELECTOR,
  });

  const refresh = () => annotateCompositionBoxes(root, {
    selector: ctx.selector || DEFAULT_SELECTOR,
  });

  return {
    refresh,
    snapshot: () => snapshotCompositionBoxes(root, { selector: ctx.selector || DEFAULT_SELECTOR }),
    initialCount: snapshots.length,
  };
}

export const SPW_COMPOSITION_BOX_MODEL_CONTRACT = Object.freeze({
  selector: DEFAULT_SELECTOR,
  attributes: Object.freeze([
    'data-spw-box-model',
    'data-spw-composition-flow',
    'data-spw-box-measure',
    'data-spw-box-presence',
    'data-spw-box-overflow',
    'data-spw-box-story',
  ]),
  roles: Object.freeze(['stage', 'fold', 'control-group', 'control-card', 'feature', 'choice-field', 'component']),
  presence: PRESENCE_STATES,
  portableUse:
    'Import snapshotCompositionBox() or annotateCompositionBoxes() to make a static component explain its layout, presence, and next repair clue.',
});
