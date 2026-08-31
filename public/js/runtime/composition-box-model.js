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
import { readPretextSignals } from '../semantic/pretext-measurement-bus.js';
import { PAGE_ATTENTION_EVENT } from './page-state.js';

const DEFAULT_SELECTOR = [
  '[data-spw-box-model]',
  '[data-spw-composition-flow]',
  '[data-spw-pack-local]',
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

/* Component-local packing mirror. These px values mirror the @container
   breakpoints in component-packing.css (26rem / 44rem / 52rem at a 16px root);
   owned region topology then decides whether that room can become split or feature.
   Only written for [data-spw-pack-local] opt-ins. */
const PACK_LAYOUT_BANDS = Object.freeze({ split: 416, feature: 704, contextSplit: 832 });

export const resolvePackLayoutForWidth = (inlineSize = 0, regionTopology = 3) => {
  const width = Number.isFinite(Number(inlineSize)) ? Number(inlineSize) : 0;
  const regionNames = Array.isArray(regionTopology) || regionTopology instanceof Set
    ? new Set([...regionTopology].map(normalizeToken).filter(Boolean))
    : null;
  const regionCount = regionNames
    ? regionNames.size
    : Math.max(0, Number.parseInt(regionTopology, 10) || 0);
  const ownsFeatureTopology = regionNames
    ? ['media', 'body', 'actions'].every((name) => regionNames.has(name))
    : regionCount >= 3;
  const ownsContextTopology = regionNames?.has('context') || false;

  if (width >= PACK_LAYOUT_BANDS.feature && ownsFeatureTopology) return 'feature';
  if (ownsContextTopology) {
    return width >= PACK_LAYOUT_BANDS.contextSplit && regionCount >= 2 ? 'split' : 'stack';
  }
  if (width >= PACK_LAYOUT_BANDS.split && regionCount >= 2) return 'split';
  return 'stack';
};

const readPackRegions = (el) => [...(el.querySelectorAll?.(
  '[data-spw-pack-regions] > [data-spw-pack-region]',
) || [])].filter((region) => region.closest?.('[data-spw-pack-local]') === el);

const resolvePackLayoutFromRegions = (box, regions) => {
  // Use the content-box inline size — that is what `container-type: inline-size`
  // measures, so the mirror matches the @container decision at the boundaries.
  return resolvePackLayoutForWidth(
    box.contentInline || box.inlineSize,
    regions.map((region) => region.dataset.spwPackRegion),
  );
};

export const resolvePackFillFromCount = (itemCount = 0) => {
  const count = Math.max(0, Number.parseInt(itemCount, 10) || 0);
  if (count <= 2) return 'sparse';
  if (count <= 5) return 'balanced';
  return 'full';
};

export const resolvePackRegionItemCount = (regions = []) => [...regions].reduce(
  (count, region) => count + Math.max(1, region?.children?.length || 0),
  0,
);

const resolvePackFill = (el, regions = readPackRegions(el)) => {
  // A region is itself one meaningful unit when it directly carries copy or
  // media. When it is a wrapper, count its direct children. This keeps a plain
  // <p data-spw-pack-region> from disappearing from the occupancy signal.
  const regionItems = resolvePackRegionItemCount(regions);
  const listItems = el.querySelectorAll?.(
    ':scope > ol > li, :scope > ul > li, :scope > nav > ol > li, :scope > nav > ul > li',
  ).length || 0;
  const directItems = [...(el.children || [])]
    .filter((child) => !child.hasAttribute?.('data-spw-pack-readout'))
    .length;
  return resolvePackFillFromCount(
    regions.length ? regionItems : (listItems || directItems),
  );
};

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

/**
 * Site frames and panels are vertical stages. Even when CSS uses display:grid
 * for stacking/gaps, packing them as composition-flow=grid activates multi-column
 * auto-fit rules meant for inner card grids — never mirror that onto stages.
 */
function resolveCompositionFlow(el, style) {
  if (el.matches?.('.site-frame, .frame-panel, .mode-panel, .site-hero')) {
    const authored = normalizeToken(el.getAttribute('data-spw-composition-flow') || '');
    if (authored && authored !== 'grid' && authored !== 'inline-grid') return authored;
    return 'stack';
  }
  return readDisplayFlow(style);
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
    flow: resolveCompositionFlow(el, style),
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

  const pretext = readPretextSignals(el);
  const isPackLocal = el.hasAttribute('data-spw-pack-local')
    || el.dataset?.spwPackLocal === 'true'
    || el.dataset?.spwPackLocal === '';
  // One structural scan feeds layout, fill, and inspection metadata. Packing
  // hosts can sit on resize-driven paths, so do not rediscover the same region
  // topology for each output attribute.
  const packRegionNodes = isPackLocal ? readPackRegions(el) : [];
  const packRegions = [...new Set(
    packRegionNodes.map((region) => normalizeToken(region.dataset.spwPackRegion)).filter(Boolean),
  )];
  const packLayout = isPackLocal
    ? resolvePackLayoutFromRegions(box, packRegionNodes)
    : (el.dataset.spwPackLayout || null);
  const packFill = isPackLocal
    ? resolvePackFill(el, packRegionNodes)
    : (el.dataset.spwPackFill || null);

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
    pretext,
    packLocal: isPackLocal,
    packLayout,
    packFill,
    packRegions,
    packRegionCount: packRegions.length,
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
    spwBoxMeasure: snapshot.pretext?.measure || snapshot.measure,
    spwBoxPresence: snapshot.presence,
    spwBoxOverflow: snapshot.box.overflowX || snapshot.box.overflowY ? 'true' : 'false',
    spwSizeContext: snapshot.sizeContext,
    spwContentTone: snapshot.pretext?.wrap || snapshot.contentTone,
    spwBoxSettlePhase: snapshot.settlePhase,
    spwTextWrap: snapshot.pretext?.wrap || '',
    spwTextMeasure: snapshot.pretext?.measure || '',
    spwTextWidthClass: snapshot.pretext?.widthClass || '',
    spwMeasureKind: snapshot.pretext ? 'objective' : '',
    spwMeasureSource: snapshot.pretext?.source || '',
  }, { missingOnly: options.missingOnly === true });

  if (options.story !== false) {
    writeDatasetValue(el, 'spwBoxStory', snapshot.story);
  }

  // Component-local packing mirror: expose the resolved internal-layout variant
  // and content fill so the CSS container-query decision is inspectable and
  // available to JS consumers. Only for elements that opt into packing.
  if (el.matches?.('[data-spw-pack-local]')) {
    const { packLayout, packFill } = snapshot;
    writeDatasetValues(el, {
      spwPackLayout: packLayout,
      spwPackFill: packFill,
    }, { missingOnly: options.missingOnly === true });

    const readout = el.querySelector('[data-spw-pack-readout]');
    if (readout) {
      readout.textContent = `layout: ${packLayout} · fill: ${packFill} · ${Math.round(snapshot.box.inlineSize)}px`;
    }
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
  const bus = ctx.bus || globalThis.__SPW_SITE__?.bus;
  const offSettings = bus?.on?.('settings:changed', queueRefresh) || null;

  document.addEventListener(PAGE_ATTENTION_EVENT, handleAttentionChange);
  window.addEventListener('resize', handleResize, { passive: true });
  window.visualViewport?.addEventListener?.('resize', handleResize, { passive: true });

  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => queueRefresh())
    : null;
  if (resizeObserver) {
    const resizeTargets = new Set();
    if (root instanceof Element) resizeTargets.add(root);
    else if (root === document) resizeTargets.add(document.documentElement);

    if (root instanceof Element && root.matches('[data-spw-pack-local]')) {
      resizeTargets.add(root);
    }
    root.querySelectorAll?.('[data-spw-pack-local]').forEach((host) => resizeTargets.add(host));
    resizeTargets.forEach((target) => resizeObserver.observe(target));
  }

  const cleanup = () => {
    offSettings?.();
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
    'data-spw-text-wrap',
    'data-spw-text-measure',
    'data-spw-text-width-class',
    'data-spw-measure-kind',
    'data-spw-measure-source',
    // Component-local packing mirror (for [data-spw-pack-local] cards)
    'data-spw-pack-layout',
    'data-spw-pack-fill',
  ]),
  settlePhases: SETTLE_PHASES,
  roles: Object.freeze(['stage', 'fold', 'control-group', 'control-card', 'feature', 'choice-field', 'component']),
  presence: PRESENCE_STATES,
  sizeContexts: SIZE_CONTEXTS,
  contentTones: CONTENT_TONES,
  packLayoutBands: PACK_LAYOUT_BANDS,
  packRegions: Object.freeze(['context', 'media', 'body', 'actions']),
  portableUse:
    'Import snapshotCompositionBox() or annotateCompositionBoxes() to make a static component explain its layout, presence, size context, content tone, and next repair clue.',
});
