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
import { PAGE_ATTENTION_EVENT } from './page-state.js';

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

/* New context feedback (Phase 1 of context-sensitive variants work).
   These close the loop: components now report their *effective* size role
   and rough content pressure back into stable data-spw-* attrs that CSS
   and agents can read. Explicit author values always win. */
const SIZE_CONTEXTS = Object.freeze({
  NARROW_HERO: 'narrow-hero',
  NARROW_PANEL: 'narrow-panel',
  COMFORTABLE: 'comfortable',
  WIDE_HERO: 'wide-hero',
  WIDE_PANEL: 'wide-panel',
  DENSE_GRID: 'dense-grid',
});

const CONTENT_TONES = Object.freeze({
  LIGHT: 'light',
  BALANCED: 'balanced',
  DENSE: 'dense',
  OPERATOR_HEAVY: 'operator-heavy',
  MEDIA_DOMINANT: 'media-dominant',
  TEXT_LONG: 'text-long',
});

const SETTLE_PHASES = Object.freeze({
  SETTLED: 'settled',
  BACKGROUND: 'background',
  STEP_1: 'step-1',
  STEP_2: 'step-2',
  STEP_3: 'step-3',
  ENTERING: 'entering',
  RETURNING: 'returning',
  RESTORED: 'restored',
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

/* Context feedback resolvers (new for context-sensitive variants).
   These are deliberately lightweight and conservative: explicit author data-*
   attributes win; otherwise we derive stable, useful signals from the box
   we already compute + role + light structural heuristics. */
function resolveSizeContext(el, box, role) {
  const explicit = el.dataset.spwSizeContext || el.dataset.spwSize || '';
  if (explicit) return normalizeToken(explicit);

  const measure = resolveMeasure(box);
  const isHeroish = role === 'stage' || el.matches('.site-hero, [data-spw-liminality="entry"]');
  const isGridish = el.matches('.frame-grid, [data-spw-composition-flow="grid"]') || box.childCount >= 3;

  if (measure === 'narrow') {
    return isHeroish ? SIZE_CONTEXTS.NARROW_HERO : SIZE_CONTEXTS.NARROW_PANEL;
  }
  if (measure === 'compact' || measure === 'comfortable') {
    return isGridish ? SIZE_CONTEXTS.DENSE_GRID : 'comfortable';
  }
  // wide+
  if (isHeroish) return SIZE_CONTEXTS.WIDE_HERO;
  if (isGridish) return SIZE_CONTEXTS.DENSE_GRID;
  return SIZE_CONTEXTS.WIDE_PANEL;
}

function resolveSettlePhase(el, root = document.documentElement) {
  const explicit = el.dataset.spwBoxSettlePhase || el.dataset.spwSettlePhase || '';
  if (explicit) return normalizeToken(explicit);

  const html = root?.dataset || {};
  if (html.spwPagePresence === 'background') return SETTLE_PHASES.BACKGROUND;
  if (html.spwPageArrival === 'settled' || html.spwPageSettling !== 'true') {
    return SETTLE_PHASES.SETTLED;
  }

  const step = String(html.spwPageArrivalStep || '0');
  if (step === '1') return SETTLE_PHASES.STEP_1;
  if (step === '2') return SETTLE_PHASES.STEP_2;
  if (step === '3') return SETTLE_PHASES.STEP_3;

  const arrival = html.spwPageArrival || 'entering';
  if (arrival === 'returning') return SETTLE_PHASES.RETURNING;
  if (arrival === 'restored') return SETTLE_PHASES.RESTORED;
  return SETTLE_PHASES.ENTERING;
}

function resolveContentTone(el, box) {
  const explicit = el.dataset.spwContentTone || el.dataset.spwContentDensity || '';
  if (explicit) return normalizeToken(explicit);

  const textLen = (el.textContent || '').trim().length;
  const opCount = el.querySelectorAll?.('[data-spw-operator], .operator-chip, .frame-sigil').length || 0;
  const mediaCount = el.querySelectorAll?.('img, picture, video, svg, canvas').length || 0;
  const childDensity = box.childCount / Math.max(1, (box.inlineSize || 300) / 100);

  if (mediaCount >= 2 && opCount <= 1) return CONTENT_TONES.MEDIA_DOMINANT;
  if (opCount >= 3 && textLen < 600) return CONTENT_TONES.OPERATOR_HEAVY;
  if (textLen > 1200 && opCount <= 2 && mediaCount <= 1) return CONTENT_TONES.TEXT_LONG;
  if (childDensity > 1.8 || box.childCount >= 6) return CONTENT_TONES.DENSE;
  if (textLen < 280 && opCount <= 1 && mediaCount <= 1) return CONTENT_TONES.LIGHT;
  return CONTENT_TONES.BALANCED;
}

function describeBox(el, box, role, presence) {
  const label = el.id || el.dataset.spwFeature || el.dataset.spwInspect || role;
  const action = presence === PRESENCE_STATES.OVERFULL
    ? 'needs containment before it can tell its story cleanly'
    : presence === PRESENCE_STATES.WAITING
      ? 'is waiting for copy, controls, or a visible outcome'
      : 'is ready to support reading, tuning, or navigation';

  // Include new size/content context in the narrative when available (Phase 1)
  const size = el.dataset.spwSizeContext || resolveSizeContext(el, box, role);
  const tone = el.dataset.spwContentTone || resolveContentTone(el, box);
  const contextNote = size || tone ? ` (${size || ''}${size && tone ? ' · ' : ''}${tone || ''})` : '';

  return `${label}: ${role} uses ${box.flow} flow at ${resolveMeasure(box)} measure${contextNote} and ${action}.`;
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
  const sizeContext = resolveSizeContext(el, box, role);
  const contentTone = resolveContentTone(el, box);
  const settlePhase = resolveSettlePhase(el, options.root || document.documentElement);

  return {
    selector: el.id ? `#${el.id}` : el.dataset.spwFeature ? `[data-spw-feature="${el.dataset.spwFeature}"]` : el.tagName.toLowerCase(),
    role,
    presence,
    measure,
    sizeContext,
    contentTone,
    settlePhase,
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
    spwSizeContext: snapshot.sizeContext,
    spwContentTone: snapshot.contentTone,
    spwBoxSettlePhase: snapshot.settlePhase,
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

const scheduleCompositionRefresh = (refresh, delay = 48) => {
  let timerId = 0;
  return () => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => {
      timerId = 0;
      refresh();
    }, delay);
  };
};

export function initSpwCompositionBoxModel(ctx = {}) {
  const root = ctx.root || document;
  const selector = ctx.selector || DEFAULT_SELECTOR;
  const snapshots = annotateCompositionBoxes(root, { selector });

  const refresh = () => annotateCompositionBoxes(root, { selector });
  const queueRefresh = scheduleCompositionRefresh(refresh, 48);

  const handleAttentionChange = () => queueRefresh();
  const handleResize = () => queueRefresh();

  document.addEventListener(PAGE_ATTENTION_EVENT, handleAttentionChange);
  window.addEventListener('resize', handleResize, { passive: true });
  window.visualViewport?.addEventListener?.('resize', handleResize, { passive: true });

  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => queueRefresh())
    : null;
  if (resizeObserver && root instanceof Element) {
    resizeObserver.observe(root);
  } else if (resizeObserver && root === document) {
    resizeObserver.observe(document.documentElement);
  }

  const cleanup = () => {
    document.removeEventListener(PAGE_ATTENTION_EVENT, handleAttentionChange);
    window.removeEventListener('resize', handleResize);
    window.visualViewport?.removeEventListener?.('resize', handleResize);
    resizeObserver?.disconnect();
  };

  return {
    refresh,
    cleanup,
    snapshot: () => snapshotCompositionBoxes(root, { selector }),
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
    // Phase 1 context feedback (size + content tone for more context-sensitive variants)
    'data-spw-size-context',
    'data-spw-content-tone',
    'data-spw-box-settle-phase',
  ]),
  settlePhases: SETTLE_PHASES,
  roles: Object.freeze(['stage', 'fold', 'control-group', 'control-card', 'feature', 'choice-field', 'component']),
  presence: PRESENCE_STATES,
  sizeContexts: SIZE_CONTEXTS,
  contentTones: CONTENT_TONES,
  portableUse:
    'Import snapshotCompositionBox() or annotateCompositionBoxes() to make a static component explain its layout, presence, size context, content tone, and next repair clue.',
});
