/**
 * Sample Dock — experiential organ
 * ---------------------------------------------------------------------------
 * Owns the specimen explorer: item collection across pages, features, and
 * routes; learner confidence assessment; dock DOM rendering; and
 * hold / swipe / click / keyboard gestures.
 *
 * Extracted from experiential.js so each organ carries a single readable
 * contract. The orchestrator delegates here; this module does not know
 * about breadcrumbs, memos, or operator learning.
 */

import { describeFeatureClusterElement } from '/public/js/kernel/dom-contracts.js';
import { escapeAttr as escapeAttribute, escapeHtml } from '/public/js/kernel/dom-render.js';
import {
  normalizeRouteHref,
  parseRouteList,
} from '/public/js/kernel/route-utils.js';

/* ── Constants ──────────────────────────────────────────────────────────── */

const SAMPLE_HOLD_MS = 220;
const SAMPLE_SWIPE_PX = 42;
const MAX_BREADCRUMB_NEIGHBORS = 3;

const GESTURE_SVGS = Object.freeze({
  tap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  hold: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 6v6l3 3"/></svg>',
  swipe: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  cauldron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h18M5 6v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><circle cx="12" cy="13" r="2.5"/></svg>',
  spell: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z"/></svg>',
});

/* ── Contract ───────────────────────────────────────────────────────────── */

export const SPW_SAMPLE_DOCK_CONTRACT = Object.freeze({
  id: 'sample-dock',
  events: Object.freeze([]),
  dataset: Object.freeze([
    'spwSampleState',
    'spwSampleCount',
    'spwSampleKind',
    'spwSamplePinned',
    'spwLearnerConfidence',
    'spwLearnerScope',
    'spwLearnerRecovery',
    'spwCognitiveInventory',
  ]),
  mount: 'initSampleDock',
});

/* ── Local state ────────────────────────────────────────────────────────── */

const state = {
  sampleDock: null,
  samplePreview: null,
  sampleItems: [],
  sampleSelectedIndex: 0,
  samplePinnedIndex: null,
  sampleGesture: null,
};

/* ── Shared helpers (injected from orchestrator to avoid circular deps) ── */

let _isTouchPrimary = () => false;
let _getInteractionHint = () => '';
let _ensureHeaderTraceHost = () => null;
let _collectRelatedBreadcrumbRoutes = () => [];
let _titleFromPath = (p) => p;
let _slugify = (v) => v;
let _humanizePathPart = (v) => v;

/* ── Public API ─────────────────────────────────────────────────────────── */

/**
 * Initialize the sample dock. Called once by the experiential orchestrator.
 * @param {{ ensureHeaderTraceHost, isTouchPrimary, getInteractionHint, collectRelatedBreadcrumbRoutes, titleFromPath, slugify, humanizePathPart }} ctx
 */
export function initSampleDock(ctx = {}) {
  if (ctx.isTouchPrimary) _isTouchPrimary = ctx.isTouchPrimary;
  if (ctx.getInteractionHint) _getInteractionHint = ctx.getInteractionHint;
  if (ctx.ensureHeaderTraceHost) _ensureHeaderTraceHost = ctx.ensureHeaderTraceHost;
  if (ctx.collectRelatedBreadcrumbRoutes) _collectRelatedBreadcrumbRoutes = ctx.collectRelatedBreadcrumbRoutes;
  if (ctx.titleFromPath) _titleFromPath = ctx.titleFromPath;
  if (ctx.slugify) _slugify = ctx.slugify;
  if (ctx.humanizePathPart) _humanizePathPart = ctx.humanizePathPart;

  const header = document.querySelector('header');
  if (!header) return;
  const traceHost = _ensureHeaderTraceHost(header);

  let dock = traceHost.querySelector('.spw-sample-dock');
  if (!dock) {
    dock = document.createElement('details');
    dock.className = 'spw-spell-dock spw-sample-dock';
    dock.open = false;
    dock.setAttribute('aria-label', 'Sample explorer');
    traceHost.appendChild(dock);
  }

  state.sampleDock = dock;

  if (dock.dataset.spwSampleBound !== 'true') {
    dock.addEventListener('pointerover', onSampleDockPointerOver);
    dock.addEventListener('pointerout', onSampleDockPointerOut);
    dock.addEventListener('focusin', onSampleDockFocusIn);
    dock.addEventListener('focusout', onSampleDockFocusOut);
    dock.addEventListener('pointerdown', onSampleDockPointerDown);
    dock.addEventListener('click', onSampleDockClick);
    dock.addEventListener('keydown', onSampleDockKeydown);
    dock.dataset.spwSampleBound = 'true';
  }

  renderSampleDock();
}

export function renderSampleDock() {
  const dock = state.sampleDock;
  if (!dock) return;

  const items = collectSampleItems();
  state.sampleItems = items;

  if (!items.length) {
    dock.hidden = true;
    return;
  }

  if (state.sampleSelectedIndex >= items.length || state.sampleSelectedIndex < 0) {
    state.sampleSelectedIndex = 0;
  }
  if (state.samplePinnedIndex != null && state.samplePinnedIndex >= items.length) {
    state.samplePinnedIndex = null;
  }

  const selectedIndex = state.samplePinnedIndex ?? state.sampleSelectedIndex;
  const selected = items[selectedIndex] || items[0];
  const selectedConfidence = describeLearnerConfidence(selected);
  const sampleInventory = summarizeSampleInventory(items);
  state.samplePreview = dock.querySelector('.spw-sample-preview');

  dock.hidden = false;
  dock.dataset.spwSampleState = state.samplePinnedIndex == null ? 'preview' : 'pinned';
  dock.dataset.spwSampleCount = String(items.length);
  dock.dataset.spwSampleKind = selected?.kind || 'page';
  dock.dataset.spwSamplePinned = state.samplePinnedIndex == null ? 'false' : 'true';
  dock.dataset.spwLearnerConfidence = selectedConfidence.level;
  dock.dataset.spwLearnerScope = selectedConfidence.scopeKey;
  dock.dataset.spwLearnerRecovery = selectedConfidence.recoveryKey;
  dock.dataset.spwCognitiveInventory = sampleInventory.key;

  dock.innerHTML = `
    <summary class="spw-spell-dock-summary spw-sample-dock-summary">
      <span class="spw-spell-dock-op">?</span>
      <span class="spw-spell-dock-label">samples</span>
      <span class="spw-spell-dock-count">${escapeHtml(String(items.length))}</span>
    </summary>
    <div class="spw-spell-dock-body spw-sample-dock-body">
      <p class="spw-sample-dock__lead" data-spw-interaction-hint="${_getInteractionHint()}" data-spw-learning-note="The cauldron shows the specific forces and expressions gathered. Any mix result is one limited crystallization — test it specifically rather than forming broad conclusions about its value.">
        ${_isTouchPrimary()
          ? 'Tap to ground, long-press to inspect, swipe to cycle between page, features, and nearby routes.'
          : 'Hover, focus, or hold to preview. Swipe (or use arrows) to move between the page, features, and nearby routes. ' + _getInteractionHint()}
      </p>
      <div class="spw-gesture-anchors" aria-hidden="true" data-spw-visual-anchor="interaction-semantics">
        ${renderGestureAnchor('tap', 'tap / click to ground or add a specific expression to the cauldron')}
        ${renderGestureAnchor('hold', 'hold to inspect the current ingredients or resulting combination')}
        ${renderGestureAnchor('swipe', 'swipe to cycle topical anchors')}
      </div>
      <section class="spw-sample-preview" aria-live="polite">
        ${renderSamplePreview(selected, sampleInventory)}
      </section>
      <div class="spw-sample-chip-rail" aria-label="Sample selectors">
        ${items.map((item, index) => renderSampleChip(item, index, index === selectedIndex)).join('')}
      </div>
    </div>
  `;

  state.samplePreview = dock.querySelector('.spw-sample-preview');
}

export function selectSampleIndex(index, options = {}) {
  if (!state.sampleItems.length) return;
  const next = Math.max(0, Math.min(index, state.sampleItems.length - 1));
  const sameSelected = state.sampleSelectedIndex === next;
  const samePinned = state.samplePinnedIndex === next;
  if (!options.pin && !options.keepPin && state.samplePinnedIndex == null && sameSelected) return;
  if (options.pin && samePinned) return;
  if (options.keepPin && state.samplePinnedIndex == null && sameSelected) return;
  state.sampleSelectedIndex = next;
  if (options.pin) {
    state.samplePinnedIndex = next;
  } else if (!options.keepPin) {
    state.samplePinnedIndex = null;
  }
  renderSampleDock();
}

export function pinSampleIndex(index) {
  selectSampleIndex(index, { pin: true });
}

export function clearSamplePin() {
  if (state.samplePinnedIndex == null) return;
  state.samplePinnedIndex = null;
  renderSampleDock();
}

export function cycleSampleIndex(delta = 1) {
  if (!state.sampleItems.length) return;
  const next = (state.sampleSelectedIndex + delta + state.sampleItems.length) % state.sampleItems.length;
  selectSampleIndex(next, { keepPin: false });
}

/* ── Item collection ────────────────────────────────────────────────────── */

function collectSampleItems(root = document) {
  const page = describePageSample(root);
  const features = Array.from(root.querySelectorAll('[data-spw-feature]'))
    .map((element, index) => describeFeatureSample(element, index))
    .filter(Boolean)
    .slice(0, 4);
  const routes = _collectRelatedBreadcrumbRoutes(window.location.pathname)
    .map((route, index) => describeRouteSample(route, index))
    .filter(Boolean)
    .slice(0, MAX_BREADCRUMB_NEIGHBORS);

  return [page, ...features, ...routes];
}

function describePageSample(root = document) {
  const body = root.body || document.body;
  return {
    kind: 'page',
    label: body?.dataset.spwPageResponsibility
      || body?.dataset.spwPageRole
      || body?.dataset.spwSurface
      || 'page',
    note: body?.dataset.spwPagePrimaryAction || 'Current page context.',
    route: window.location.pathname,
    surface: body?.dataset.spwSurface || 'root',
    family: body?.dataset.spwPageFamily || '',
    routeFamily: body?.dataset.spwRouteFamily || '',
    pageModes: body?.dataset.spwPageModes || '',
    role: body?.dataset.spwPageRole || '',
    responsibility: body?.dataset.spwPageResponsibility || '',
    primaryAction: body?.dataset.spwPagePrimaryAction || '',
    context: body?.dataset.spwContext || '',
    wonder: body?.dataset.spwWonder || '',
    relatedRoutes: _collectRelatedBreadcrumbRoutes(window.location.pathname),
  };
}

function describeFeatureSample(element, index = 0) {
  const descriptor = describeFeatureClusterElement(element);
  if (!descriptor) return null;

  return {
    kind: 'feature',
    index,
    label: descriptor.label || descriptor.target || descriptor.feature || `feature ${index + 1}`,
    note: descriptor.inspect || descriptor.role || descriptor.context || 'Feature cluster from this page.',
    target: descriptor.target,
    feature: descriptor.feature,
    role: descriptor.role,
    context: descriptor.context,
    surface: descriptor.surface,
    inspect: descriptor.inspect,
    boxModel: descriptor.boxModel,
    compositionFlow: descriptor.compositionFlow,
    ancestry: descriptor.ancestry || [],
  };
}

function describeRouteSample(route, index = 0) {
  if (!route) return null;
  return {
    kind: 'route',
    index,
    label: route.label || _titleFromPath(route.href || ''),
    note: route.note || 'Related route from this page.',
    href: route.href || '/',
  };
}

/* ── Learner confidence ─────────────────────────────────────────────────── */

function describeLearnerConfidence(item) {
  if (item.kind === 'route') {
    return {
      level: 'low-risk',
      note: 'Opening a nearby route only changes where you are reading. The current route stays one browser Back action away.',
      scope: 'navigation',
      scopeKey: 'route',
      recovery: 'Back button or spell path',
      recoveryKey: 'browser-back',
      application: 'compare one neighboring idea',
    };
  }

  if (item.kind === 'feature') {
    return {
      level: 'inspectable',
      note: 'Previewing a feature is reversible. Hold or focus to inspect its owner before changing how you read it.',
      scope: item.feature || item.role || 'one feature',
      scopeKey: 'feature',
      recovery: 'unpin sample or choose another chip',
      recoveryKey: 'unpin',
      application: 'try one component behavior',
    };
  }

  return {
    level: 'recoverable',
    note: 'This surface is safe to explore: grounding, previewing, and cycling samples do not erase work or commit global changes.',
    scope: item.surface || 'current page',
    scopeKey: 'page',
    recovery: 'reset paths live in Settings',
    recoveryKey: 'settings-reset',
    application: 'notice, compare, then return',
  };
}

function summarizeSampleInventory(items = []) {
  const kinds = [...new Set(items.map((item) => item?.kind).filter(Boolean))];
  return {
    key: kinds.length ? kinds.join('-') : 'empty',
    label: kinds.length ? `${items.length} ${items.length === 1 ? 'sample' : 'samples'}: ${kinds.join(' / ')}` : 'no samples',
  };
}

/* ── Rendering ──────────────────────────────────────────────────────────── */

function renderGestureAnchor(type, title = '') {
  const svg = GESTURE_SVGS[type] || GESTURE_SVGS.tap;
  return `<span class="spw-gesture-anchor" title="${escapeHtml(title || type)}" data-spw-visual-anchor="gesture-${type}">${svg}</span>`;
}

function renderSamplePreview(item, inventory = null) {
  if (!item) return '';

  const fields = [];
  const confidence = describeLearnerConfidence(item);

  if (item.kind === 'page') {
    fields.push(['surface', item.surface]);
    fields.push(['family', item.family]);
    fields.push(['role', item.role]);
    fields.push(['responsibility', item.responsibility]);
    fields.push(['action', item.primaryAction]);
    fields.push(['context', item.context]);
    fields.push(['wonder', item.wonder]);
  } else if (item.kind === 'feature') {
    fields.push(['feature', item.feature]);
    fields.push(['role', item.role]);
    fields.push(['context', item.context]);
    fields.push(['surface', item.surface]);
    fields.push(['inspect', item.inspect]);
    fields.push(['box model', item.boxModel]);
    fields.push(['composition', item.compositionFlow]);
  } else if (item.kind === 'route') {
    fields.push(['route', item.href]);
  }

  fields.push(['confidence', confidence.level]);
  fields.push(['scope', confidence.scope]);
  if (inventory?.label) {
    fields.push(['inventory', inventory.label]);
  }
  fields.push(['recover', confidence.recovery]);
  fields.push(['apply', confidence.application]);

  const ancestry = item.ancestry?.length
    ? `<div class="spw-sample-preview__ancestry"><span>ancestry</span><strong>${escapeHtml(item.ancestry.map((entry) => entry.target || entry.feature || entry.role || entry.kind || 'node').join(' → '))}</strong></div>`
    : '';

  return `
    <div class="spw-sample-preview__header">
      <span class="spw-sample-preview__kind">${escapeHtml(item.kind || 'sample')}</span>
      <strong class="spw-sample-preview__label">${escapeHtml(item.label || item.target || 'sample')}</strong>
    </div>
    ${item.note ? `<p class="spw-sample-preview__note">${escapeHtml(item.note)}</p>` : ''}
    <p class="spw-sample-preview__confidence" data-spw-confidence="${escapeAttribute(confidence.level)}">
      ${escapeHtml(confidence.note)}
    </p>
    <dl class="spw-sample-preview__fields">
      ${fields.filter(([, value]) => value).map(([label, value]) => `
        <div class="spw-sample-preview__field spw-sample-preview__field--${escapeAttribute(_slugify(label))}">
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(value)}</dd>
        </div>
      `).join('')}
    </dl>
    ${ancestry}
  `;
}

function renderSampleChip(item, index, current = false) {
  const surface = item.surface || item.family || '';
  const wonder = item.wonder || '';
  const context = item.context || item.role || '';

  const commonAttrs = `
    data-spw-sample-index="${index}"
    data-spw-sample-kind="${escapeAttribute(item.kind)}"
    ${surface ? `data-spw-sample-surface="${escapeAttribute(surface)}"` : ''}
    ${wonder ? `data-spw-sample-wonder="${escapeAttribute(wonder)}"` : ''}
    ${context ? `data-spw-sample-context="${escapeAttribute(context)}"` : ''}
    data-spw-interaction="tap-hold"
  `.trim();

  if (item.kind === 'route') {
    return `
      <button
        class="spw-sample-chip"
        type="button"
        ${commonAttrs}
        data-spw-sample-href="${escapeAttribute(item.href)}"
        aria-label="${escapeAttribute(`Open ${item.label}`)}"
        ${current ? 'aria-pressed="true"' : ''}>
        <span class="spw-sample-chip__token" data-spw-operator="frame">→</span>
        <span class="spw-sample-chip__label">${escapeHtml(item.label)}</span>
      </button>
    `;
  }

  return `
    <button
      class="spw-sample-chip"
      type="button"
      ${commonAttrs}
      aria-label="${escapeAttribute(`Preview ${item.label}`)}"
      ${current ? 'aria-pressed="true"' : ''}>
      <span class="spw-sample-chip__token">${escapeHtml(item.kind === 'page' ? 'page' : 'feature')}</span>
      <span class="spw-sample-chip__label">${escapeHtml(item.label)}</span>
    </button>
  `;
}

/* ── Gesture handlers ───────────────────────────────────────────────────── */

function getSampleIndexFromEvent(event) {
  const item = event.target instanceof Element ? event.target.closest('[data-spw-sample-index]') : null;
  if (!(item instanceof HTMLElement)) return null;
  const index = Number(item.dataset.spwSampleIndex);
  return Number.isFinite(index) ? { item, index } : null;
}

function onSampleDockPointerOver(event) {
  const sample = getSampleIndexFromEvent(event);
  if (!sample || state.samplePinnedIndex != null) return;
  selectSampleIndex(sample.index, { keepPin: true });
}

function onSampleDockPointerOut(event) {
  if (state.samplePinnedIndex != null) return;
  const related = event.relatedTarget instanceof Element
    ? event.relatedTarget.closest('[data-spw-sample-index]')
    : null;
  if (related) return;
  state.sampleSelectedIndex = 0;
  renderSampleDock();
}

function onSampleDockFocusIn(event) {
  const sample = getSampleIndexFromEvent(event);
  if (!sample) return;
  if (state.samplePinnedIndex != null && state.samplePinnedIndex !== sample.index) return;
  selectSampleIndex(sample.index, { keepPin: true });
}

function onSampleDockFocusOut(event) {
  if (state.samplePinnedIndex != null) return;
  const related = event.relatedTarget instanceof Element
    ? event.relatedTarget.closest('[data-spw-sample-index]')
    : null;
  if (related) return;
  state.sampleSelectedIndex = 0;
  renderSampleDock();
}

function onSampleDockPointerDown(event) {
  const sample = getSampleIndexFromEvent(event);
  if (!sample) return;

  clearTimeout(state.sampleGesture?.holdTimer);
  state.sampleGesture = {
    index: sample.index,
    startX: event.clientX,
    startY: event.clientY,
    held: false,
    consumedClick: false,
    pointerId: event.pointerId,
    target: sample.item,
    holdTimer: window.setTimeout(() => {
      state.sampleGesture.held = true;
      state.sampleGesture.consumedClick = true;
      pinSampleIndex(sample.index);
    }, SAMPLE_HOLD_MS),
  };

  window.addEventListener('pointerup', finishSampleGesture, { once: true });
  window.addEventListener('pointercancel', finishSampleGesture, { once: true });
}

function finishSampleGesture(event) {
  const gesture = state.sampleGesture;
  if (!gesture) return;
  if (event.pointerId != null && gesture.pointerId != null && event.pointerId !== gesture.pointerId) return;
  clearTimeout(gesture.holdTimer);
  const dx = event.clientX - gesture.startX;
  const dy = event.clientY - gesture.startY;
  const isSwipe = Math.abs(dx) > SAMPLE_SWIPE_PX && Math.abs(dx) > Math.abs(dy);

  if (isSwipe) {
    gesture.consumedClick = true;
    cycleSampleIndex(dx < 0 ? 1 : -1);
  }

  if (!gesture.held && !isSwipe && state.samplePinnedIndex != null) {
    state.samplePinnedIndex = null;
    renderSampleDock();
  }

  window.setTimeout(() => {
    if (state.sampleGesture === gesture) {
      state.sampleGesture = null;
    }
  }, 0);
}

function onSampleDockClick(event) {
  const sample = getSampleIndexFromEvent(event);
  if (!sample) return;

  if (state.sampleGesture?.consumedClick) {
    event.preventDefault();
    event.stopPropagation();
    state.sampleGesture.consumedClick = false;
    return;
  }

  if (sample.item.dataset.spwSampleKind === 'route') {
    const href = sample.item.dataset.spwSampleHref || '';
    if (!href) return;
    window.location.assign(href);
    return;
  }

  if (state.samplePinnedIndex === sample.index) {
    clearSamplePin();
    return;
  }

  selectSampleIndex(sample.index, { pin: true });
}

function onSampleDockKeydown(event) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    cycleSampleIndex(-1);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    cycleSampleIndex(1);
  } else if (event.key === 'Escape') {
    clearSamplePin();
  }
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'sample-dock',
  contract: SPW_SAMPLE_DOCK_CONTRACT,
  mount: (ctx, root) => initSampleDock(ctx),
  refresh: () => renderSampleDock(),
});

export const spwModule = SPW_MODULE_EXPORT;

export default initSampleDock;
