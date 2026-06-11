/**
 * Spw Experiential Cohesion
 * ---------------------------------------------------------------------------
 * Purpose
 * - Add semantic depth to the static site through adaptive breadcrumbs,
 *   contextual memos, progressive operator learning, and literate bookmarks.
 * - Respond to gesture/runtime events without overwhelming the interface.
 *
 * Design rules
 * - Prefer local memos over console spam.
 * - Use roomy surfaces when available; stay compact otherwise.
 * - Let route, active frame, mode, operator, and wonder category shape output.
 * - Keep everything optional and progressive.
 */

import { getActiveRecentPathMemory } from '/public/js/interface/accent-palette.js';
import { bus } from '/public/js/kernel/bus.js';
import { describeFeatureClusterElement } from '/public/js/kernel/dom-contracts.js';
import {
  clearPins,
  getPinStorageKey,
  readPins,
} from '/public/js/runtime/pin-registry.js';
import { describeCognitiveState } from '/public/js/runtime/cognitive-state.js';
import {
  closeRegionMenu,
  isRegionMenuOpen,
  openRegionMenuForElement,
} from '/public/js/runtime/region-menu.js';

const ROOMY_WIDTH_PX = 704;
const MEMO_TIMEOUT_MS = 2600;
const SAMPLE_HOLD_MS = 220;
const SAMPLE_SWIPE_PX = 42;
const MAX_BREADCRUMB_NEIGHBORS = 3;
const SHELL_MENU_INTENT_EVENT = 'spw:shell-menu-intent';
const SHELL_MENU_STATE_EVENT = 'spw:shell-menu-state';
const HEADER_TRACE_CHANGE_EVENT = 'spw:header-trace-change';

/**
 * Device-aware interaction helpers for learning science and discoverability.
 * These provide consistent reasons + semantics so uncurious visitors get immediate
 * value while active learners see clear progression (tap → hold → swipe).
 */
function getInteractionHint() {
  const isCoarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (isCoarse) {
    return 'tap to ground, long-press to inspect, swipe to cycle';
  }
  return 'click to ground, hold to inspect, swipe or arrow keys to cycle';
}

function isTouchPrimary() {
  return window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

function syncSpellPathHash(sectionId = '') {
  const id = String(sectionId || '').replace(/^#/, '').trim();
  if (!id) return false;

  const hash = `#${id}`;
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentUrl === nextUrl) return false;

  history.replaceState(null, '', nextUrl);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  return true;
}

function navigateSpellPathTarget(sectionId, { source = 'breadcrumb' } = {}) {
  const section = document.getElementById(String(sectionId || '').replace(/^#/, ''));
  if (!(section instanceof HTMLElement)) return false;

  syncSpellPathHash(section.id);
  section.scrollIntoView({
    block: 'start',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });

  if (!section.hasAttribute('tabindex')) {
    section.setAttribute('tabindex', '-1');
  }
  section.focus({ preventScroll: true });

  document.dispatchEvent(new CustomEvent(HEADER_TRACE_CHANGE_EVENT, {
    detail: {
      source,
      target: section.id,
      action: 'focus-target',
    },
  }));

  return true;
}

const GESTURE_SVGS = Object.freeze({
  tap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  hold: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 6v6l3 3"/></svg>',
  swipe: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  cauldron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h18M5 6v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><circle cx="12" cy="13" r="2.5"/></svg>',
  spell: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z"/></svg>',
});

function renderGestureAnchor(type, title = '') {
  const svg = GESTURE_SVGS[type] || GESTURE_SVGS.tap;
  return `<span class="spw-gesture-anchor" title="${escapeHtml(title || type)}" data-spw-visual-anchor="gesture-${type}">${svg}</span>`;
}

/* Garden trace on the live spell path (one-pass ambitious enhancement).
   When the cauldron currently holds gesture provenance from living terms / holds, the spell path
   (the visible breadcrumb trail) now carries a compact "garden memory" marker + re-gather action.
   This makes the live navigation state and the planted spell memory feel like the same continuous attention. */
function renderGardenTraceOnSpellPath() {
  // Read from any existing cauldron mirror (populated by composition.js) — no new imports needed.
  const mirror = document.querySelector('[data-spw-cauldron-mirror]');
  if (!mirror) return '';

  const lastGesture = mirror.querySelector('[data-spw-mirror-label="last-gesture"]')?.textContent?.trim();
  const trace = mirror.querySelector('[data-spw-mirror-label="trace"]')?.textContent?.trim();
  const trail = mirror.querySelector('[data-spw-mirror-label="trail"]')?.textContent?.trim();

  const hasGarden = !!(lastGesture || trace || trail);
  if (!hasGarden) return '';

  const display = (lastGesture || trace || trail || '').replace(/^trace:\s*/i, '').slice(0, 48);
  const trailSig = trail ? trail.replace(/^trail:\s*/i, '') : display;

  return `
    <div class="spw-spell-path__garden-trace spell-provenance" data-spw-garden-on-path aria-live="polite">
      <span class="spell-provenance__label">garden in path</span>
      <span class="spell-provenance__trace">${escapeHtml(display)}</span>
      <button type="button" class="garden-action spell-action" data-spw-spell-action="re-gather" data-spw-spell-trail="${escapeHtml(trailSig)}">re-gather</button>
    </div>
  `;
}

const BREADCRUMB_ROUTE_REGISTRY = Object.freeze({
  '/': { label: 'Home', note: 'Start or re-enter the site.' },
  '/about/': { label: 'About', note: 'Read the method and the kernel.' },
  '/blog/': { label: 'Blog', note: 'Working threads and process notes.' },
  '/contact/': { label: 'Contact', note: 'Send a structured inquiry.' },
  '/play/': { label: 'Play', note: 'RPG Wednesday and experiments.' },
  '/recipes/': { label: 'Recipes', note: 'Culinary practice and technique.' },
  '/services/': { label: 'Services', note: 'Compare a collaboration path.' },
  '/settings/': { label: 'Settings', note: 'Tune the surface and inspect runtime.' },
  '/tools/': { label: 'Tools', note: 'Inspect reusable helpers.' },
  '/topics/': { label: 'Topics', note: 'Browse the atlas.' },
});

function normalizePathname(pathname = '') {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '/') || '/';
}

function normalizeRouteHref(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    return normalizePathname(new URL(raw, window.location.href).pathname);
  } catch {
    return normalizePathname(raw);
  }
}

const OPERATOR_INFO = Object.freeze({
  '#>': { type: 'frame', label: 'frame address', intent: 'name a resonance handle', wonder: 'resonance' },
  '#:': { type: 'layer', label: 'layer vibration', intent: 'name a resonance field', wonder: 'resonance' },
  '#':  { type: 'vibration', label: 'vibration', intent: 'make resonance recognizable', wonder: 'resonance' },
  '.':  { type: 'ground', label: 'ground', intent: 'settle to local ground', wonder: 'memory' },
  '^':  { type: 'integration', label: 'integration', intent: 'lift parts into relation', wonder: 'comparison' },
  '~':  { type: 'potential', label: 'potential', intent: 'hold possibility open', wonder: 'projection' },
  '?':  { type: 'wonder', label: 'wonder', intent: 'open curiosity', wonder: 'inquiry' },
  '@':  { type: 'perspective', label: 'perspective', intent: 'situate a viewpoint', wonder: 'orientation' },
  '*':  { type: 'value', label: 'value', intent: 'mark material salience', wonder: 'memory' },
  '&':  { type: 'subject', label: 'subject', intent: 'name the relational focus', wonder: 'comparison' },
  '=':  { type: 'binding', label: 'binding', intent: 'name or pin a local value', wonder: 'constraint' },
  '$':  { type: 'meta', label: 'meta', intent: 'reflect on medium or trace', wonder: 'comparison' },
  '%':  { type: 'normalize', label: 'normalize', intent: 'scale into comparability', wonder: 'constraint' },
  '!':  { type: 'action', label: 'action', intent: 'commit a visible move', wonder: 'projection' },
  '>':  { type: 'concept-edge', label: 'concept edge', intent: 'close a concept bracket', wonder: 'orientation' },
  '<':  { type: 'concept', label: 'concept', intent: 'open a concept boundary', wonder: 'orientation' },
  '(':  { type: 'scene', label: 'scene', intent: 'stage a context', wonder: 'projection' },
  '[':  { type: 'mode', label: 'mode', intent: 'select a posture', wonder: 'constraint' },
  '{':  { type: 'direction', label: 'direction', intent: 'hold bounded motion', wonder: 'orientation' },

  frame: { type: 'frame', label: 'frame address', intent: 'name a resonance handle', wonder: 'resonance' },
  layer: { type: 'layer', label: 'layer vibration', intent: 'name a resonance field', wonder: 'resonance' },
  vibration: { type: 'vibration', label: 'vibration', intent: 'make resonance recognizable', wonder: 'resonance' },
  baseline: { type: 'ground', label: 'ground', intent: 'settle to local ground', wonder: 'memory' },
  ground: { type: 'ground', label: 'ground', intent: 'settle to local ground', wonder: 'memory' },
  object: { type: 'integration', label: 'integration', intent: 'lift parts into relation', wonder: 'comparison' },
  integration: { type: 'integration', label: 'integration', intent: 'lift parts into relation', wonder: 'comparison' },
  ref: { type: 'potential', label: 'potential', intent: 'hold possibility open', wonder: 'projection' },
  potential: { type: 'potential', label: 'potential', intent: 'hold possibility open', wonder: 'projection' },
  probe: { type: 'wonder', label: 'wonder', intent: 'open curiosity', wonder: 'inquiry' },
  wonder: { type: 'wonder', label: 'wonder', intent: 'open curiosity', wonder: 'inquiry' },
  perspective: { type: 'perspective', label: 'perspective', intent: 'situate a viewpoint', wonder: 'orientation' },
  action: { type: 'action', label: 'action', intent: 'commit a visible move', wonder: 'projection' },
  stream: { type: 'value', label: 'value', intent: 'mark material salience', wonder: 'memory' },
  value: { type: 'value', label: 'value', intent: 'mark material salience', wonder: 'memory' },
  merge: { type: 'subject', label: 'subject', intent: 'name the relational focus', wonder: 'comparison' },
  subject: { type: 'subject', label: 'subject', intent: 'name the relational focus', wonder: 'comparison' },
  binding: { type: 'binding', label: 'binding', intent: 'name or pin a local value', wonder: 'constraint' },
  meta: { type: 'meta', label: 'meta', intent: 'reflect on medium or trace', wonder: 'comparison' },
  normalize: { type: 'normalize', label: 'normalize', intent: 'scale into comparability', wonder: 'constraint' },
  pragma: { type: 'action', label: 'action', intent: 'commit a visible move', wonder: 'projection' },
  surface: { type: 'concept-edge', label: 'concept edge', intent: 'close a concept bracket', wonder: 'orientation' },
  topic: { type: 'concept', label: 'concept', intent: 'open a concept boundary', wonder: 'orientation' },
  concept: { type: 'concept', label: 'concept', intent: 'open a concept boundary', wonder: 'orientation' },
  scene: { type: 'scene', label: 'scene', intent: 'stage a context', wonder: 'projection' },
  mode: { type: 'mode', label: 'mode', intent: 'select a posture', wonder: 'constraint' },
  direction: { type: 'direction', label: 'direction', intent: 'hold bounded motion', wonder: 'orientation' },
});

const runtime = {
  pathBar: null,
  headerMemo: null,
  sampleDock: null,
  samplePreview: null,
  sampleItems: [],
  sampleSelectedIndex: 0,
  samplePinnedIndex: null,
  sampleGesture: null,
  lastMemoTimeout: null,
  shellSnapshot: null,
  pathExpanded: null,
  pathExpandedManual: false,
  pathCompact: null,
  lastTraceSignature: '',
};

export function initSpwExperiential() {
  if (document.documentElement.dataset.spwExperientialInit === 'true') {
    renderBreadcrumbSpell();
    renderSampleDock();
    syncExperientialSurface();
    return {
      cleanup() {},
      refresh() {
        renderBreadcrumbSpell();
        renderSampleDock();
        syncExperientialSurface();
      },
    };
  }

  document.documentElement.dataset.spwExperientialInit = 'true';
  initSpellBreadcrumbs();
  if (document.body?.dataset.spwFeatures?.split(/\s+/).includes('shell-trace')) {
    initSampleDock();
  }
  initContextualMemos();
  initOperatorLearning();
  initBookmarkRegistry();
  syncExperientialSurface();

  return {
    cleanup() {},
    refresh() {
      renderBreadcrumbSpell();
      renderSampleDock();
      syncExperientialSurface();
    },
  };
}

/* ==========================================================================
   Breadcrumb spell
   ========================================================================== */

function initSpellBreadcrumbs() {
  const header = document.querySelector('header');
  if (!header) return;
  const traceHost = ensureHeaderTraceHost(header);

  let pathBar = traceHost.querySelector('.spw-spell-path');
  if (!pathBar) {
    pathBar = document.createElement('nav');
    pathBar.className = 'spw-spell-path';
    pathBar.setAttribute('aria-label', 'Cognitive breadcrumb and shell trace');
    traceHost.appendChild(pathBar);
  }

  if (pathBar.dataset.spwBreadcrumbBound !== 'true') {
    pathBar.addEventListener('click', onBreadcrumbAction);
    pathBar.addEventListener('keydown', onBreadcrumbKeydown);
    pathBar.dataset.spwBreadcrumbBound = 'true';
  }

  runtime.pathBar = pathBar;

  let headerMemo = traceHost.querySelector('.spw-experience-memo');
  if (!headerMemo) {
    headerMemo = document.createElement('div');
    headerMemo.className = 'spw-experience-memo';
    headerMemo.setAttribute('aria-live', 'polite');
    headerMemo.hidden = true;
    traceHost.appendChild(headerMemo);
  }

  runtime.headerMemo = headerMemo;

  const update = () => {
    renderBreadcrumbSpell();
    renderSampleDock();
    syncExperientialSurface();
  };

  const resetPathPreference = () => {
    runtime.pathExpandedManual = false;
    runtime.pathExpanded = resolveSpellPathExpandedDefault();
  };

  window.addEventListener('popstate', () => {
    resetPathPreference();
    update();
  });
  window.addEventListener('hashchange', () => {
    resetPathPreference();
    update();
  });
  window.addEventListener('resize', update);
  document.addEventListener('spw:memory:recent-path', update);
  document.addEventListener('spw:page-attention-state', update);
  document.addEventListener('spw:page-transition-state', update);
  document.addEventListener('spw:settings:changed', () => {
    if (!runtime.pathExpandedManual) {
      runtime.pathExpanded = resolveSpellPathExpandedDefault();
    }
    update();
  });
  document.addEventListener('spw:frame-change', update);
  document.addEventListener('spw:mode-change', update);
  document.addEventListener('brace:committed', update);
  document.addEventListener('brace:swapped', update);
  document.addEventListener(SHELL_MENU_STATE_EVENT, update);
  bus.on('region-menu:opened', update);
  bus.on('region-menu:closed', update);
  bus.on('region-menu:marked', update);

  renderBreadcrumbSpell();
}

function initSampleDock() {
  const header = document.querySelector('header');
  if (!header) return;
  const traceHost = ensureHeaderTraceHost(header);

  let dock = traceHost.querySelector('.spw-sample-dock');
  if (!dock) {
    dock = document.createElement('details');
    dock.className = 'spw-spell-dock spw-sample-dock';
    dock.open = true;
    dock.setAttribute('aria-label', 'Sample explorer');
    traceHost.appendChild(dock);
  }

  runtime.sampleDock = dock;

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

function ensureHeaderTraceHost(header) {
  let host = header.querySelector('.spw-header-trace');
  if (host) return host;

  host = document.createElement('div');
  host.className = 'spw-header-trace';

  const nav = header.querySelector('nav');
  if (nav?.after) {
    nav.after(host);
  } else {
    header.appendChild(host);
  }

  return host;
}

function collectSampleItems(root = document) {
  const page = describePageSample(root);
  const features = Array.from(root.querySelectorAll('[data-spw-feature]'))
    .map((element, index) => describeFeatureSample(element, index))
    .filter(Boolean)
    .slice(0, 4);
  const routes = collectRelatedBreadcrumbRoutes(window.location.pathname)
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
    relatedRoutes: collectRelatedBreadcrumbRoutes(window.location.pathname),
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
    label: route.label || titleFromPath(route.href || ''),
    note: route.note || 'Related route from this page.',
    href: route.href || '/',
  };
}

function renderSampleDock() {
  const dock = runtime.sampleDock;
  if (!dock) return;

  const items = collectSampleItems();
  runtime.sampleItems = items;

  if (!items.length) {
    dock.hidden = true;
    return;
  }

  if (runtime.sampleSelectedIndex >= items.length || runtime.sampleSelectedIndex < 0) {
    runtime.sampleSelectedIndex = 0;
  }
  if (runtime.samplePinnedIndex != null && runtime.samplePinnedIndex >= items.length) {
    runtime.samplePinnedIndex = null;
  }

  const selectedIndex = runtime.samplePinnedIndex ?? runtime.sampleSelectedIndex;
  const selected = items[selectedIndex] || items[0];
  const selectedConfidence = describeLearnerConfidence(selected);
  const sampleInventory = summarizeSampleInventory(items);
  runtime.samplePreview = dock.querySelector('.spw-sample-preview');

  dock.hidden = false;
  dock.dataset.spwSampleState = runtime.samplePinnedIndex == null ? 'preview' : 'pinned';
  dock.dataset.spwSampleCount = String(items.length);
  dock.dataset.spwSampleKind = selected?.kind || 'page';
  dock.dataset.spwSamplePinned = runtime.samplePinnedIndex == null ? 'false' : 'true';
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
      <p class="spw-sample-dock__lead" data-spw-interaction-hint="${getInteractionHint()}" data-spw-learning-note="The cauldron shows the specific forces and expressions gathered. Any mix result is one limited crystallization — test it specifically rather than forming broad conclusions about its value.">
        ${isTouchPrimary()
          ? 'Tap to ground, long-press to inspect, swipe to cycle between page, features, and nearby routes.'
          : 'Hover, focus, or hold to preview. Swipe (or use arrows) to move between the page, features, and nearby routes. ' + getInteractionHint()}
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

  runtime.samplePreview = dock.querySelector('.spw-sample-preview');
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
        <div class="spw-sample-preview__field spw-sample-preview__field--${escapeAttribute(slugify(label))}">
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(value)}</dd>
        </div>
      `).join('')}
    </dl>
    ${ancestry}
  `;
}

function summarizeSampleInventory(items = []) {
  const kinds = [...new Set(items.map((item) => item?.kind).filter(Boolean))];
  return {
    key: kinds.length ? kinds.join('-') : 'empty',
    label: kinds.length ? `${items.length} ${items.length === 1 ? 'sample' : 'samples'}: ${kinds.join(' / ')}` : 'no samples',
  };
}

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

function selectSampleIndex(index, options = {}) {
  if (!runtime.sampleItems.length) return;
  const next = Math.max(0, Math.min(index, runtime.sampleItems.length - 1));
  const sameSelected = runtime.sampleSelectedIndex === next;
  const samePinned = runtime.samplePinnedIndex === next;
  if (!options.pin && !options.keepPin && runtime.samplePinnedIndex == null && sameSelected) return;
  if (options.pin && samePinned) return;
  if (options.keepPin && runtime.samplePinnedIndex == null && sameSelected) return;
  runtime.sampleSelectedIndex = next;
  if (options.pin) {
    runtime.samplePinnedIndex = next;
  } else if (!options.keepPin) {
    runtime.samplePinnedIndex = null;
  }
  renderSampleDock();
}

function pinSampleIndex(index) {
  selectSampleIndex(index, { pin: true });
}

function clearSamplePin() {
  if (runtime.samplePinnedIndex == null) return;
  runtime.samplePinnedIndex = null;
  renderSampleDock();
}

function cycleSampleIndex(delta = 1) {
  if (!runtime.sampleItems.length) return;
  const next = (runtime.sampleSelectedIndex + delta + runtime.sampleItems.length) % runtime.sampleItems.length;
  selectSampleIndex(next, { keepPin: false });
}

function getSampleIndexFromEvent(event) {
  const item = event.target instanceof Element ? event.target.closest('[data-spw-sample-index]') : null;
  if (!(item instanceof HTMLElement)) return null;
  const index = Number(item.dataset.spwSampleIndex);
  return Number.isFinite(index) ? { item, index } : null;
}

function onSampleDockPointerOver(event) {
  const sample = getSampleIndexFromEvent(event);
  if (!sample || runtime.samplePinnedIndex != null) return;
  selectSampleIndex(sample.index, { keepPin: true });
}

function onSampleDockPointerOut(event) {
  if (runtime.samplePinnedIndex != null) return;
  const related = event.relatedTarget instanceof Element
    ? event.relatedTarget.closest('[data-spw-sample-index]')
    : null;
  if (related) return;
  runtime.sampleSelectedIndex = 0;
  renderSampleDock();
}

function onSampleDockFocusIn(event) {
  const sample = getSampleIndexFromEvent(event);
  if (!sample) return;
  if (runtime.samplePinnedIndex != null && runtime.samplePinnedIndex !== sample.index) return;
  selectSampleIndex(sample.index, { keepPin: true });
}

function onSampleDockFocusOut(event) {
  if (runtime.samplePinnedIndex != null) return;
  const related = event.relatedTarget instanceof Element
    ? event.relatedTarget.closest('[data-spw-sample-index]')
    : null;
  if (related) return;
  runtime.sampleSelectedIndex = 0;
  renderSampleDock();
}

function onSampleDockPointerDown(event) {
  const sample = getSampleIndexFromEvent(event);
  if (!sample) return;

  clearTimeout(runtime.sampleGesture?.holdTimer);
  runtime.sampleGesture = {
    index: sample.index,
    startX: event.clientX,
    startY: event.clientY,
    held: false,
    consumedClick: false,
    pointerId: event.pointerId,
    target: sample.item,
    holdTimer: window.setTimeout(() => {
      runtime.sampleGesture.held = true;
      runtime.sampleGesture.consumedClick = true;
      pinSampleIndex(sample.index);
    }, SAMPLE_HOLD_MS),
  };

  window.addEventListener('pointerup', finishSampleGesture, { once: true });
  window.addEventListener('pointercancel', finishSampleGesture, { once: true });
}

function finishSampleGesture(event) {
  const gesture = runtime.sampleGesture;
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

  if (!gesture.held && !isSwipe && runtime.samplePinnedIndex != null) {
    runtime.samplePinnedIndex = null;
    renderSampleDock();
  }

  window.setTimeout(() => {
    if (runtime.sampleGesture === gesture) {
      runtime.sampleGesture = null;
    }
  }, 0);
}

function onSampleDockClick(event) {
  const sample = getSampleIndexFromEvent(event);
  if (!sample) return;

  if (runtime.sampleGesture?.consumedClick) {
    event.preventDefault();
    event.stopPropagation();
    runtime.sampleGesture.consumedClick = false;
    return;
  }

  if (sample.item.dataset.spwSampleKind === 'route') {
    const href = sample.item.dataset.spwSampleHref || '';
    if (!href) return;
    window.location.assign(href);
    return;
  }

  if (runtime.samplePinnedIndex === sample.index) {
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

function renderBreadcrumbSpell() {
  const pathBar = runtime.pathBar;
  if (!pathBar) return;

  const url = new URL(window.location.href);
  const surface = document.body?.dataset.spwSurface || 'root';
  const routeParts = url.pathname.split('/').filter(Boolean);
  const shellSnapshot = readShellSnapshot();
  runtime.shellSnapshot = shellSnapshot;
  syncBreadcrumbViewportPreference();

  const pageRole = document.body?.dataset.spwPageRole || '';
  const pageResponsibility = document.body?.dataset.spwPageResponsibility || '';
  const pagePrimaryAction = document.body?.dataset.spwPagePrimaryAction || '';
  const relatedRoutes = collectRelatedBreadcrumbRoutes(url.pathname);
  const activeFrame =
    document.querySelector('.site-frame[data-state~="active"]')
    || (url.hash ? document.querySelector(url.hash) : null);

  const activeFrameSigil =
    activeFrame?.querySelector('.frame-sigil')?.textContent?.trim()
    || activeFrame?.id
    || null;

  const activeModeButton = document.querySelector('[data-mode-group][data-set-mode][aria-pressed="true"]');
  const activeMode = activeModeButton?.dataset.setMode || null;
  const activeModeSelector = ensureStableId(activeModeButton, 'spw-mode');
  const narrationMode = document.documentElement.dataset.spwMeaningMode || 'readable';
  const items = [];

  items.push(renderBreadcrumbLink({
    kind: 'home',
    href: '/',
    token: '#>',
    label: 'spwashi',
    current: url.pathname === '/' && !activeFrameSigil,
  }));

  items.push(renderBreadcrumbLink({
    kind: 'surface',
    href: url.pathname,
    token: '#:surface',
    label: humanizePathPart(surface),
    current: routeParts.length === 0 && !activeFrameSigil && !activeMode,
  }));

  let cumulativePath = '';
  routeParts.forEach((part, index) => {
    cumulativePath += `/${part}`;
    const isLast = index === routeParts.length - 1 && !activeFrameSigil && !activeMode;
    items.push(renderBreadcrumbLink({
      kind: 'route',
      href: `${cumulativePath}/`,
      token: '~',
      label: humanizePathPart(part),
      current: isLast,
    }));
  });

  if (activeFrameSigil && url.hash) {
    items.push(renderBreadcrumbLink({
      kind: 'frame',
      href: `${url.pathname}${url.hash}`,
      token: '#>',
      label: activeFrameSigil,
      current: !activeMode,
    }));
  }

  if (activeMode && activeModeSelector) {
    items.push(renderBreadcrumbButton({
      kind: 'mode',
      action: 'focus-mode',
      token: '[]',
      label: humanizePathPart(activeMode),
      current: true,
      selector: activeModeSelector,
    }));
  }

  if (activeFrame && activeFrameSigil) {
    const regionMenuOpen = isRegionMenuOpen();
    items.push(renderBreadcrumbButton({
      kind: 'region',
      action: 'inspect-region',
      token: '?',
      label: regionMenuOpen ? 'region open' : 'inspect region',
      current: regionMenuOpen,
      pressed: regionMenuOpen,
    }));
  }

  const cognitiveState = describeCognitiveState({
    signalCount: items.length + (activeFrameSigil ? 1 : 0) + (activeMode ? 1 : 0),
    recentPath: getActiveRecentPathMemory(),
    currentPath: url.pathname,
    currentSurface: surface,
    pageArrival: document.documentElement.dataset.spwPageArrival || '',
    pageTransitionPhase: document.documentElement.dataset.spwPageTransitionPhase || '',
    pageLiminality: document.body?.dataset.spwLiminality || '',
  });
  const meaning = describeBreadcrumbMeaning({
    surface,
    pageRole,
    pageResponsibility,
    pagePrimaryAction,
    activeFrameSigil,
    activeMode,
    shellSnapshot,
    cognitiveState,
    narrationMode,
  });
  const compactSummary = describeBreadcrumbSummary({
    surface,
    routeParts,
    pageResponsibility,
    pagePrimaryAction,
    activeFrameSigil,
    activeMode,
  });
  const compact = runtime.pathCompact === true;
  const pathState = runtime.pathExpanded ? 'open' : 'closed';
  const guide = describeBreadcrumbGuide({
    surface,
    pageRole,
    pageResponsibility,
    pagePrimaryAction,
    activeFrameSigil,
    activeMode,
    relatedRoutes,
    compact,
    pathState,
  });

  pathBar.dataset.spwBreadcrumbSurface = surface;
  pathBar.dataset.spwBreadcrumbDepth = String(items.length);
  pathBar.dataset.spwBreadcrumbFrame = activeFrameSigil ? 'active' : 'route';
  pathBar.dataset.spwBreadcrumbMode = activeMode ? 'active' : 'ambient';
  pathBar.dataset.spwBreadcrumbMenuState = shellSnapshot.state;
  pathBar.dataset.spwBreadcrumbMenuMode = shellSnapshot.mode;
  pathBar.dataset.spwBreadcrumbMenuChanged = shellSnapshot.changedAxes.join(' ') || 'none';
  pathBar.dataset.spwBreadcrumbMenuClarity = shellSnapshot.clarity;
  pathBar.dataset.spwBreadcrumbMenuPhase = shellSnapshot.phase;
  pathBar.dataset.spwBreadcrumbMenuTopology = shellSnapshot.topology;
  pathBar.dataset.spwBreadcrumbMenuPressure = shellSnapshot.pressure;
  pathBar.dataset.spwBreadcrumbMenuIntent = shellSnapshot.intent;
  pathBar.dataset.spwBreadcrumbReversible = shellSnapshot.reversible ? 'true' : 'false';
  pathBar.dataset.spwBreadcrumbFamiliarity = cognitiveState.familiarity;
  pathBar.dataset.spwBreadcrumbLiminality = cognitiveState.liminality;
  pathBar.dataset.spwBreadcrumbCognitive = cognitiveState.gradient;
  pathBar.dataset.spwBreadcrumbMeaningMode = narrationMode;
  pathBar.dataset.spwBreadcrumbState = pathState;
  pathBar.dataset.spwBreadcrumbViewport = compact ? 'compact' : 'roomy';
  pathBar.dataset.spwBreadcrumbRelatedCount = String(relatedRoutes.length);
  pathBar.dataset.spwBreadcrumbPageRole = pageRole || 'none';
  pathBar.dataset.spwBreadcrumbPageResponsibility = pageResponsibility || 'none';
  pathBar.dataset.spwBreadcrumbRegionMenu = isRegionMenuOpen() ? 'open' : 'closed';
  if (document.documentElement.dataset.spwDimensionalBreadcrumbs === 'on') {
    pathBar.setAttribute('data-dimensional-breadcrumb', 'spell-path');
  } else {
    pathBar.removeAttribute('data-dimensional-breadcrumb');
  }

  syncSpellPathSurfaceDatasets({
    pathState,
    compact,
    depth: items.length,
    cognitiveState,
    surface,
  });

  const trailId = 'spw-spell-trail';
  pathBar.innerHTML = `
    <div class="spw-spell-path__header">
      <button
        class="spw-spell-path-toggle"
        type="button"
        data-spw-breadcrumb-action="toggle-path"
        aria-expanded="${pathState === 'open' ? 'true' : 'false'}"
        aria-controls="${trailId}"
        aria-label="${escapeAttribute(`${pathState === 'open' ? 'Collapse' : 'Expand'} spell path. ${compactSummary}. ${cognitiveState.gradient}.${narrationMode !== 'readable' ? ` ${narrationMode} meaning mode.` : ''}`)}">
        <span class="spw-spell-path__title">spell path</span>
        <span class="spw-spell-path__summary">${escapeHtml(compactSummary)}</span>
      </button>
      ${compact ? '' : renderShellControl(shellSnapshot)}
      ${renderRouteSorterChip({ pathname: url.pathname, pageResponsibility, compact })}
    </div>
    ${renderSpellPathInteractionHint({
      compact,
      pageResponsibility,
      pathState,
      activeFrameSigil,
    })}
    ${guide ? `<p class="spw-spell-path__guide">${guide}</p>` : ''}
    <ol class="spw-spell-trail" id="${trailId}" aria-label="Current cognitive breadcrumb">
      ${items.join('')}
    </ol>
    ${compact || !relatedRoutes.length ? '' : renderBreadcrumbNearbyRoutes(relatedRoutes)}
    <p class="spw-spell-meaning">${escapeHtml(meaning)}</p>
    <!-- Live garden trace on the spell path itself (ambitious one-pass enhancement).
         When the cauldron holds recent gesture provenance (from living-term holds etc.), the spell path
         now surfaces it directly so the breadcrumb trail and the garden memory are visibly linked.
         Re-gather button makes the originating attention traversable from the path. -->
    ${renderGardenTraceOnSpellPath()}
  `;

  const traceSignature = [
    pathState,
    compact ? 'compact' : 'roomy',
    String(items.length),
    shellSnapshot.state,
    shellSnapshot.mode,
    shellSnapshot.phase,
    shellSnapshot.pressure,
  ].join('|');

  if (pathState === 'open') {
    pathBar.querySelector('.spw-spell-crumb[data-spw-current="true"]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }

  if (runtime.lastTraceSignature === traceSignature) return;
  runtime.lastTraceSignature = traceSignature;

  document.dispatchEvent(new CustomEvent(HEADER_TRACE_CHANGE_EVENT, {
    detail: {
      state: pathState,
      compact,
      depth: items.length,
    },
  }));
}

function renderBreadcrumbLink({ kind, href, token, label, current = false }) {
  return `
    <li class="spw-spell-crumb" data-spw-crumb-kind="${escapeAttribute(kind)}" ${current ? 'data-spw-current="true"' : ''}>
      <a class="spw-spell-link" href="${escapeAttribute(href)}">
        <span class="spw-spell-token">${escapeHtml(token)}</span>
        <span class="spw-spell-label">${escapeHtml(label)}</span>
      </a>
    </li>
  `;
}

function renderBreadcrumbButton({
  kind,
  action,
  token,
  label,
  current = false,
  selector = '',
  pressed = false,
}) {
  return `
    <li class="spw-spell-crumb" data-spw-crumb-kind="${escapeAttribute(kind)}" ${current ? 'data-spw-current="true"' : ''}>
      <button
        class="spw-spell-button"
        type="button"
        data-spw-breadcrumb-action="${escapeAttribute(action)}"
        aria-pressed="${pressed ? 'true' : 'false'}"
        ${selector ? `data-spw-breadcrumb-selector="${escapeAttribute(selector)}"` : ''}>
        <span class="spw-spell-token">${escapeHtml(token)}</span>
        <span class="spw-spell-label">${escapeHtml(label)}</span>
      </button>
    </li>
  `;
}

function renderRouteSorterChip({
  pathname = '',
  pageResponsibility = '',
  compact = false,
} = {}) {
  if (pathname !== '/' || pageResponsibility !== 'route sorter') return '';

  const touchCue = compact && isTouchPrimary()
    ? 'Tap to jump to entrance roles.'
    : 'Jump to entrance roles.';

  return `
    <a
      class="spw-spell-sorter-chip"
      href="#choose-your-entrance"
      data-spw-breadcrumb-action="focus-sorter"
      title="${escapeAttribute(touchCue)}"
      aria-label="Jump to route sorter — pick your entrance">
      <span class="spw-spell-sorter-chip__token">@</span>
      <span class="spw-spell-sorter-chip__label">
        <span class="spw-spell-sorter-chip__label-full">route sorter</span>
        <span class="spw-spell-sorter-chip__label-short" aria-hidden="true">sorter</span>
      </span>
    </a>
  `;
}

function renderSpellPathInteractionHint({
  compact = false,
  pageResponsibility = '',
  pathState = 'closed',
  activeFrameSigil = null,
} = {}) {
  const hint = describeSpellPathInteractionHint({
    compact,
    pageResponsibility,
    pathState,
    activeFrameSigil,
  });
  if (!hint) return '';

  return `<p class="spw-spell-path__hint" aria-live="polite">${escapeHtml(hint)}</p>`;
}

function describeSpellPathInteractionHint({
  compact = false,
  pageResponsibility = '',
  pathState = 'closed',
  activeFrameSigil = null,
} = {}) {
  const touch = isTouchPrimary();

  if (compact && touch) {
    if (pageResponsibility === 'route sorter' && pathState === 'closed') {
      return 'Tap @ sorter to pick an entrance, then expand spell path for the trail.';
    }
    if (activeFrameSigil) {
      return 'Tap ? inspect region to open the brace menu on this frame.';
    }
    if (pathState === 'closed') {
      return 'Tap spell path to expand the trail. Double-tap a sigil to inspect.';
    }
    return 'Swipe the trail sideways. Long-press a handle to inspect.';
  }

  if (!compact && touch) {
    if (pageResponsibility === 'route sorter') {
      return 'Tap @ route sorter for entrances; use ? inspect region once a frame is active.';
    }
    if (activeFrameSigil) {
      return 'Tap ? inspect region, or long-press a semantic handle in the frame.';
    }
  }

  if (!touch && pageResponsibility === 'route sorter' && pathState === 'closed') {
    return 'Click @ route sorter to jump to entrances, or expand spell path for nearby routes.';
  }

  if (!touch && activeFrameSigil) {
    return 'Click ? inspect region, or Alt+click a sigil to open the brace menu.';
  }

  return '';
}

function resolveActiveFrameElement() {
  return document.querySelector('.site-frame[data-state~="active"]')
    || (window.location.hash ? document.querySelector(window.location.hash) : null);
}

function resolveRegionInspectTarget() {
  const frame = resolveActiveFrameElement();
  if (!(frame instanceof HTMLElement)) return null;

  return frame.querySelector(
    '.frame-sigil, [data-spw-feature], [data-spw-semantic-expression], [data-spw-kind="hook"]'
  ) || frame;
}

function renderShellControl(shellSnapshot) {
  const action = shellSnapshot.mode === 'toggle' ? 'toggle-menu' : 'focus-nav';
  const label = humanizePathPart(shellSnapshot.topology);
  const pressed = shellSnapshot.mode === 'toggle' && shellSnapshot.state === 'open';

  return `
    <button
      class="spw-spell-shell"
      type="button"
      data-spw-breadcrumb-action="${escapeAttribute(action)}"
      aria-pressed="${pressed ? 'true' : 'false'}"
      aria-label="${escapeAttribute(`Menu controls. ${shellSnapshot.returnHint}.`)}">
      <span class="spw-spell-shell-token">menu</span>
      <span class="spw-spell-shell-state">${escapeHtml(label)}</span>
    </button>
  `;
}

function renderBreadcrumbNearbyRoutes(routes) {
  if (!routes.length) return '';

  return `
    <div class="spw-spell-neighborhood" aria-label="Nearby routes">
      <span class="spw-spell-neighborhood__label">nearby</span>
      <ul class="spw-spell-neighborhood__list">
        ${routes.slice(0, MAX_BREADCRUMB_NEIGHBORS).map((route) => `
          <li class="spw-spell-neighborhood__item">
            <a class="spw-spell-neighborhood__link" href="${escapeAttribute(route.href)}" title="${escapeAttribute(route.note)}">
              <span class="spw-spell-neighborhood__name">${escapeHtml(route.label)}</span>
              <span class="spw-spell-neighborhood__note">${escapeHtml(route.note)}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function collectRelatedBreadcrumbRoutes(currentPath = '') {
  const normalizedCurrentPath = normalizeRouteHref(currentPath);
  const related = [
    document.body?.dataset.spwRelatedRoutes,
    document.querySelector('header')?.dataset.spwRelatedRoutes,
  ]
    .filter(Boolean)
    .join('|');

  return parseRelatedRouteList(related)
    .filter((pathname) => pathname && pathname !== normalizedCurrentPath)
    .map((pathname) => describeBreadcrumbRoute(pathname))
    .filter(Boolean)
    .slice(0, MAX_BREADCRUMB_NEIGHBORS);
}

function parseRelatedRouteList(value = '') {
  return Array.from(new Set(
    String(value)
      .split(/[|,]/)
      .map((part) => normalizeRouteHref(part))
      .filter(Boolean)
  ));
}

function describeBreadcrumbRoute(pathname = '') {
  const normalized = normalizeRouteHref(pathname);
  if (!normalized) return null;
  const known = BREADCRUMB_ROUTE_REGISTRY[normalized];

  if (known) {
    return {
      href: normalized,
      label: known.label,
      note: known.note,
    };
  }

  return {
    href: normalized,
    label: titleFromPath(normalized),
    note: 'Related route from this page.',
  };
}

function resolveSpellPathExpandedDefault() {
  const mode = document.documentElement.dataset.spwSpellPath || 'auto';
  if (mode === 'expanded') return true;
  if (mode === 'collapsed') return false;

  const routeParts = window.location.pathname.split('/').filter(Boolean);
  const hasHash = Boolean(window.location.hash);
  const hasActiveFrame = Boolean(
    document.querySelector('.site-frame[data-state~="active"]')
    || (hasHash && document.querySelector(window.location.hash))
  );
  const relatedCount = Number.parseInt(
    document.querySelector('.spw-spell-path')?.dataset.spwBreadcrumbRelatedCount || '0',
    10
  ) || collectRelatedBreadcrumbRoutes(window.location.pathname).length;

  return routeParts.length >= 2 || hasActiveFrame || relatedCount > 0;
}

function syncBreadcrumbViewportPreference() {
  const compact = window.matchMedia('(max-width: 720px)').matches;

  if (runtime.pathExpanded == null) {
    runtime.pathCompact = compact;
    runtime.pathExpanded = resolveSpellPathExpandedDefault();
    return;
  }

  runtime.pathCompact = compact;
}

function syncSpellPathSurfaceDatasets({
  pathState,
  compact,
  depth,
  cognitiveState,
  surface,
}) {
  const entries = {
    spwSpellPathState: pathState,
    spwSpellPathViewport: compact ? 'compact' : 'roomy',
    spwSpellPathDepth: String(depth),
    spwPageRegionAffinity: cognitiveState?.gradient || '',
    spwPageRegionFamiliarity: cognitiveState?.familiarity || '',
    spwPageRegionLiminality: cognitiveState?.liminality || '',
    spwPageRegionSurface: surface || '',
  };

  [document.documentElement, document.body].forEach((node) => {
    Object.entries(entries).forEach(([key, value]) => {
      const attr = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
      if (value) {
        node.setAttribute(`data-${attr}`, value);
      } else {
        node.removeAttribute(`data-${attr}`);
      }
    });
  });
}

function describeBreadcrumbSummary({ surface, routeParts, pageResponsibility, pagePrimaryAction, activeFrameSigil, activeMode }) {
  const routeLabel = humanizePathPart(routeParts.at(-1) || surface || 'home');
  const responsibilityLabel = humanizePathPart(pageResponsibility || '');
  const actionLabel = humanizePathPart(pagePrimaryAction || '');

  if (activeFrameSigil) {
    return [routeLabel, responsibilityLabel || actionLabel, stripWhitespace(activeFrameSigil)]
      .filter(Boolean)
      .join(' · ');
  }
  if (activeMode) {
    return [routeLabel, responsibilityLabel || actionLabel, humanizePathPart(activeMode)]
      .filter(Boolean)
      .join(' · ');
  }
  return [routeLabel, responsibilityLabel || actionLabel].filter(Boolean).join(' · ') || routeLabel;
}

function describeBreadcrumbGuide({
  surface,
  pageRole,
  pageResponsibility,
  pagePrimaryAction,
  activeFrameSigil,
  activeMode,
  relatedRoutes,
  compact,
  pathState = 'closed',
}) {
  const lead = pageResponsibility
    ? `This page is a ${humanizePathPart(pageResponsibility)}.`
    : `This page is part of ${humanizePathPart(surface)}.`;
  const action = pagePrimaryAction
    ? `Use it to ${humanizePathPart(pagePrimaryAction)}.`
    : `Use it to read, inspect, or move deeper.`;
  const details = [];

  if (pageRole) {
    details.push(`role ${humanizePathPart(pageRole)}`);
  }
  if (activeFrameSigil) {
    details.push(`frame ${stripWhitespace(activeFrameSigil)}`);
  }
  if (activeMode) {
    details.push(`mode ${humanizePathPart(activeMode)}`);
  }
  if (!compact && relatedRoutes.length) {
    details.push(`nearby ${relatedRoutes.length}`);
  }

  const interactionHint = describeSpellPathInteractionHint({
    compact,
    pageResponsibility,
    pathState,
    activeFrameSigil,
  });
  if (interactionHint) {
    details.push(interactionHint);
  }

  return [
    `<span class="spw-spell-path__guide-lead">${escapeHtml(lead)}</span>`,
    `<span class="spw-spell-path__guide-action">${escapeHtml(action)}</span>`,
    details.length ? `<span class="spw-spell-path__guide-details">${escapeHtml(details.join(' · '))}</span>` : '',
  ].filter(Boolean).join(' ');
}

function describeBreadcrumbMeaning({ surface, pageRole, pageResponsibility, pagePrimaryAction, activeFrameSigil, activeMode, shellSnapshot, cognitiveState, narrationMode }) {
  const parts = [
    `surface ${surface}`,
    pageResponsibility ? `responsibility ${pageResponsibility}` : '',
    pagePrimaryAction ? `action ${pagePrimaryAction}` : '',
    pageRole ? `role ${pageRole}` : '',
    activeFrameSigil ? `frame ${stripWhitespace(activeFrameSigil)}` : 'frame route-level',
    activeMode ? `mode ${humanizePathPart(activeMode)}` : 'mode ambient',
    `menu ${humanizePathPart(shellSnapshot.topology)} ${shellSnapshot.state}`,
    `memory ${cognitiveState.familiarity}`,
    `liminality ${cognitiveState.liminality}`,
  ];

  if (shellSnapshot.reversible) {
    parts.push(`return via ${shellSnapshot.returnHint}`);
  }

  if (narrationMode && narrationMode !== 'readable') {
    parts.push(`meaning ${narrationMode}`);
  }

  return parts.filter(Boolean).join(' · ');
}

function readShellSnapshot() {
  const header = document.querySelector('body > header, .site-header');
  if (!(header instanceof HTMLElement)) {
    return {
      mode: 'inline',
      state: 'open',
      phase: 'resting',
      topology: 'inline-ribbon',
      pressure: 'calm',
      intent: 'survey',
      clarity: 'steady',
      changedAxes: [],
      returnHint: 'hash or route',
      reversible: true,
    };
  }

  return {
    mode: header.dataset.spwMenuMode || 'inline',
    state: header.dataset.spwMenu || 'open',
    phase: header.dataset.spwMenuPhase || 'resting',
    topology: header.dataset.spwMenuTopology || 'inline-ribbon',
    pressure: header.dataset.spwMenuPressure || 'calm',
    intent: header.dataset.spwMenuIntent || 'survey',
    clarity: header.dataset.spwMenuClarity || 'steady',
    changedAxes: (header.dataset.spwMenuChanged || '')
      .split(/\s+/)
      .filter((value) => value && value !== 'none'),
    returnHint: (header.dataset.spwMenuReturnPaths || 'toggle route').replace(/\s+/g, ', '),
    reversible: header.dataset.spwMenuReversible !== 'false',
  };
}

function onBreadcrumbKeydown(event) {
  if (event.key !== 'Escape') return;
  if (!runtime.pathExpanded) return;
  event.preventDefault();
  runtime.pathExpanded = false;
  renderBreadcrumbSpell();
}

function onBreadcrumbAction(event) {
  const control = event.target instanceof Element
    ? event.target.closest('[data-spw-breadcrumb-action]')
    : null;

  if (!(control instanceof HTMLElement)) return;

  switch (control.dataset.spwBreadcrumbAction) {
    case 'toggle-path':
      runtime.pathExpanded = !runtime.pathExpanded;
      runtime.pathExpandedManual = true;
      renderBreadcrumbSpell();
      break;
    case 'focus-mode': {
      const selector = control.dataset.spwBreadcrumbSelector;
      if (!selector) return;
      const modeControl = document.querySelector(selector);
      if (modeControl instanceof HTMLElement) {
        modeControl.focus();
        modeControl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      break;
    }
    case 'toggle-menu':
      document.dispatchEvent(new CustomEvent(SHELL_MENU_INTENT_EVENT, {
        detail: {
          intent: 'toggle',
          source: 'breadcrumb',
          focusToggle: true,
        },
      }));
      break;
    case 'focus-nav':
      document.dispatchEvent(new CustomEvent(SHELL_MENU_INTENT_EVENT, {
        detail: {
          intent: 'focus',
          source: 'breadcrumb',
          open: false,
        },
      }));
      break;
    case 'inspect-region': {
      const target = resolveRegionInspectTarget();
      if (!target) return;
      if (isRegionMenuOpen()) {
        closeRegionMenu();
      } else {
        openRegionMenuForElement(target, { source: 'breadcrumb' });
      }
      renderBreadcrumbSpell();
      break;
    }
    case 'focus-sorter': {
      event.preventDefault();
      navigateSpellPathTarget('choose-your-entrance', { source: 'breadcrumb' });
      renderBreadcrumbSpell();
      break;
    }
    default:
      break;
  }
}

function ensureStableId(element, prefix) {
  if (!(element instanceof HTMLElement)) return '';
  if (!element.id) {
    const seed = element.dataset.setMode || element.textContent || prefix;
    element.id = `${prefix}-${slugify(seed)}`;
  }
  return `#${element.id}`;
}

function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function humanizePathPart(value = '') {
  return String(value)
    .replace(/^!/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function titleFromPath(pathname = '') {
  return humanizePathPart(pathname)
    .split('/')
    .filter(Boolean)
    .at(-1)
    ?.replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Home';
}

function stripWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

/* ==========================================================================
   Contextual memos
   ========================================================================== */

function initContextualMemos() {
  document.addEventListener('brace:charge-start', onSemanticGestureEvent);
  document.addEventListener('brace:activate', onSemanticGestureEvent);
  document.addEventListener('brace:armed', onSemanticGestureEvent);
  document.addEventListener('brace:committed', onSemanticGestureEvent);
  document.addEventListener('brace:swapped', onSemanticGestureEvent);
  document.addEventListener('brace:pinned', onSemanticGestureEvent);
}

function onSemanticGestureEvent(event) {
  const detail = event.detail || {};
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const meta = resolveSemanticMeta(target, detail);
  applyFieldAttrs(meta);
  presentContextMemo(meta, event.type, detail);
}

function presentContextMemo(meta, eventType, detail) {
  const roomTarget = findRoomyMemoTarget(meta.target);
  const text = memoTextForEvent(meta, eventType, detail);
  if (!text) return;

  if (roomTarget) {
    const memo = ensureLocalMemo(roomTarget);
    memo.textContent = text;
    memo.hidden = false;
    roomTarget.dataset.spwMemoWonder = meta.wonder;
    clearTimeout(runtime.lastMemoTimeout);
    runtime.lastMemoTimeout = window.setTimeout(() => {
      memo.hidden = true;
      delete roomTarget.dataset.spwMemoWonder;
    }, MEMO_TIMEOUT_MS);
    return;
  }

  const headerMemo = runtime.headerMemo;
  if (!headerMemo) return;

  headerMemo.textContent = text;
  headerMemo.hidden = false;
  clearTimeout(runtime.lastMemoTimeout);
  runtime.lastMemoTimeout = window.setTimeout(() => {
    headerMemo.hidden = true;
  }, MEMO_TIMEOUT_MS);
}

function findRoomyMemoTarget(target) {
  const frame =
    target.closest('.site-frame')
    || target.closest('.frame-card, .frame-panel, .mode-panel');

  if (!frame) return null;
  if (frame.clientWidth < ROOMY_WIDTH_PX) return null;

  return frame.querySelector('.frame-topline, .frame-heading') || frame;
}

function ensureLocalMemo(root) {
  let memo = root.querySelector(':scope > .spw-context-memo');
  if (!memo) {
    memo = document.createElement('div');
    memo.className = 'spw-context-memo';
    memo.setAttribute('aria-live', 'polite');
    memo.hidden = true;
    root.appendChild(memo);
  }
  return memo;
}

function memoTextForEvent(meta, eventType, detail) {
  switch (eventType) {
    case 'brace:charge-start':
      return memoForCharge(meta);
    case 'brace:activate':
      return memoForActivate(meta);
    case 'brace:armed':
      return memoForArmed(meta);
    case 'brace:committed':
      return memoForCommitted(meta, detail);
    case 'brace:swapped':
      return `swap: ${detail.from || meta.operator} → ${detail.to || meta.operator}`;
    case 'brace:pinned':
      return detail.pinned ? `pinned as ${meta.wonder}` : `unpinned ${meta.label}`;
    default:
      return null;
  }
}

function memoForCharge(meta) {
  if (meta.affordances.includes('swap')) {
    return `${meta.label}: hold to arm swap`;
  }
  if (meta.affordances.includes('pin')) {
    return `${meta.label}: hold to arm pin`;
  }
  if (meta.affordances.includes('navigate')) {
    return `${meta.label}: orient and follow`;
  }
  return `${meta.label}: ${meta.intent}`;
}

function memoForActivate(meta) {
  if (meta.affordances.includes('swap')) {
    return `${meta.label}: press engages, hold prepares change`;
  }
  if (meta.affordances.includes('pin')) {
    return `${meta.label}: press engages, hold prepares memory`;
  }
  return `${meta.label}: ${meta.intent}`;
}

function memoForArmed(meta) {
  if (meta.affordances.includes('swap')) {
    return `${meta.label}: release to cycle operator`;
  }
  if (meta.affordances.includes('pin')) {
    return `${meta.label}: release to latch into bookmarks`;
  }
  if (meta.affordances.includes('toggle')) {
    return `${meta.label}: release to commit toggle`;
  }
  return `${meta.label}: armed`;
}

function memoForCommitted(meta, detail) {
  if (detail.affordance === 'swap') {
    return `${meta.label}: operator cycled`;
  }
  if (detail.affordance === 'pin') {
    return `${meta.label}: stored for return`;
  }
  if (detail.affordance === 'toggle') {
    return `${meta.label}: local state committed`;
  }
  return `${meta.label}: committed`;
}

/* ==========================================================================
   Operator learning
   ========================================================================== */

function initOperatorLearning() {
  document.addEventListener('mouseenter', onOperatorLearn, true);
  document.addEventListener('focusin', onOperatorLearn, true);
}

function onOperatorLearn(event) {
  const target = event.target instanceof Element
    ? event.target.closest('.frame-sigil, .operator-chip, [data-spw-operator], .spw-delimiter')
    : null;

  if (!target) return;

  const meta = resolveSemanticMeta(target);
  if (!meta.operator) return;

  applyFieldAttrs(meta);

  const roomTarget = findRoomyMemoTarget(target);
  const text = learningMemo(meta);

  if (roomTarget) {
    const memo = ensureLocalMemo(roomTarget);
    memo.textContent = text;
    memo.hidden = false;
    roomTarget.dataset.spwMemoWonder = meta.wonder;
    clearTimeout(runtime.lastMemoTimeout);
    runtime.lastMemoTimeout = window.setTimeout(() => {
      memo.hidden = true;
      delete roomTarget.dataset.spwMemoWonder;
    }, MEMO_TIMEOUT_MS);
  } else if (runtime.headerMemo) {
    runtime.headerMemo.textContent = text;
    runtime.headerMemo.hidden = false;
    clearTimeout(runtime.lastMemoTimeout);
    runtime.lastMemoTimeout = window.setTimeout(() => {
      runtime.headerMemo.hidden = true;
    }, MEMO_TIMEOUT_MS);
  }
}

function learningMemo(meta) {
  const base = `${meta.operatorLabel}: ${meta.intent}`;
  if (meta.targetKind === 'delimiter') {
    return `${base} · delimiter grammar for ${meta.context}`;
  }
  if (meta.affordances.includes('swap')) {
    return `${base} · this handle can cycle instantiation`;
  }
  if (meta.affordances.includes('pin')) {
    return `${base} · this handle can be remembered`;
  }
  return base;
}

/* ==========================================================================
   Bookmark registry
   ========================================================================== */

function initBookmarkRegistry() {
  const root = document.querySelector('[data-spw-bookmarks-root]');
  if (!root) return;
  const storageKey = getPinStorageKey();

  const render = () => {
    const pins = readPins();
    const values = Object.values(pins);

    if (!values.length) {
      root.innerHTML = '<p class="inline-note">No pinned frames yet. Hold a roomy frame or sigil long enough to arm a pin, then release.</p>';
      return;
    }

    const grouped = groupPins(values);
    const parts = [
      '<pre><code>',
      '<span class="spell-op">^[</span><span class="spell-node">pinned_frames</span><span class="spell-op">]</span><span class="spell-sep">{</span>\n',
    ];

    Object.entries(grouped).forEach(([group, pinsInGroup]) => {
      parts.push(`  <span class="spell-op">${escapeHtml(group)}</span><span class="spell-sep">:</span>\n`);
      pinsInGroup.forEach((pin) => {
        const date = safeDate(pin.timestamp);
        parts.push(
          `    <span class="spell-node">${escapeHtml(pin.id)}</span> `,
          `<span class="spell-op">~</span>`,
          `<a href="${escapeAttribute(pin.page)}#${escapeAttribute(pin.id)}" class="spell-node">"${escapeHtml(pin.page)}"</a> `,
          `<span class="spell-meta">(${escapeHtml(date)} · ${escapeHtml(pin.operator || 'frame')} · ${escapeHtml(pin.wonder || 'memory')})</span>\n`
        );
      });
    });

    parts.push('<span class="spell-sep">}</span></code></pre>');
    root.innerHTML = parts.join('');

    const clearBtn = document.createElement('button');
    clearBtn.className = 'operator-chip';
    clearBtn.style.marginTop = '1rem';
    clearBtn.innerHTML = '<span class="spell-op">!</span> reset_pins';
    clearBtn.addEventListener('click', () => {
      clearPins();
      document.querySelectorAll('[data-spw-pinned]').forEach((el) => {
        delete el.dataset.spwPinned;
        delete el.dataset.spwLatched;
      });
      render();
    });

    root.appendChild(clearBtn);
  };

  render();

  window.addEventListener('storage', (e) => {
    if (e.key === storageKey) render();
  });

  document.addEventListener('brace:pinned', render);
}

function groupPins(pins) {
  return pins.reduce((acc, pin) => {
    const key = pin.wonder || 'memory';
    if (!acc[key]) acc[key] = [];
    acc[key].push(pin);
    return acc;
  }, {});
}

/* ==========================================================================
   Surface sync
   ========================================================================== */

function syncExperientialSurface() {
  const surface = document.body?.dataset.spwSurface || 'root';
  document.documentElement.dataset.spwExperientialSurface = surface;
  updateCognitiveCopyHooks(surface);
}

function updateCognitiveCopyHooks(surface = document.body?.dataset.spwSurface || 'root') {
  const note = document.querySelector('[data-spw-page-hook="settings-cognitive-note"]');
  if (!(note instanceof HTMLElement)) return;

  const cognitiveState = describeCognitiveState({
    signalCount: document.querySelectorAll('.operator-chip[data-spw-grounded="true"], .frame-sigil[data-spw-grounded="true"], .spell-ingredient[data-spw-grounded="true"]').length,
    recentPath: getActiveRecentPathMemory(),
    currentPath: window.location.pathname,
    currentSurface: surface,
    pageArrival: document.documentElement.dataset.spwPageArrival || '',
    pageTransitionPhase: document.documentElement.dataset.spwPageTransitionPhase || '',
    pageLiminality: document.body?.dataset.spwLiminality || '',
  });
  const narrationMode = document.documentElement.dataset.spwMeaningMode || 'readable';

  const lead =
    cognitiveState.familiarity === 'fresh'
      ? 'The page starts <strong>fresh</strong>: keep it calm until you need more handles.'
      : cognitiveState.familiarity === 'familiar'
        ? 'The page is becoming <strong>familiar</strong>: the shape can show a little more of itself without getting louder.'
        : cognitiveState.familiarity === 'practiced'
          ? 'The page feels <strong>practiced</strong>: you can return without rebuilding the route from scratch.'
          : cognitiveState.familiarity === 'fluent'
            ? 'The page is <strong>fluent</strong> enough to expose more of its internal grammar.'
            : 'The page is <strong>habitual</strong>: the same surface can stay readable while you customize it with confidence.';

  const liminality =
    cognitiveState.liminality === 'entry'
      ? 'You are at an <strong>entry</strong> seam.'
      : cognitiveState.liminality === 'threshold'
        ? 'You are at a <strong>threshold</strong>, where extra detail can appear without overwhelming the page.'
        : cognitiveState.liminality === 'settled'
          ? 'The surface is <strong>settled</strong> and ready for calm reuse.'
          : cognitiveState.liminality === 'nested'
            ? 'The surface is <strong>nested</strong> enough to hold deeper controls.'
            : cognitiveState.liminality === 'projected'
              ? 'The surface is <strong>projected</strong> and visible enough for inspection.'
              : 'The surface is <strong>deep</strong>: it can keep more of its mechanics visible.';

  const meaning =
    narrationMode === 'inspect'
      ? 'Inspect mode keeps the scaffold visible so the same shape is easier to learn.'
      : narrationMode === 'quiet'
        ? 'Quiet mode keeps the surface lean while preserving the return path.'
        : 'Readable mode keeps the page calm while still leaving room for stronger handles when you want them.';

  note.innerHTML = `${lead} ${liminality} ${meaning}`;
}

function applyFieldAttrs(meta) {
  const root =
    meta.target.closest('.site-frame')
    || meta.target.closest('main')
    || document.body;

  if (!(root instanceof HTMLElement)) return;

  root.dataset.spwInspectFieldWonder = meta.wonder;
  root.dataset.spwInspectFieldOperator = meta.operator || '';
  root.dataset.spwInspectFieldContext = meta.context || '';
}

/* ==========================================================================
   Semantic resolution helpers
   ========================================================================== */

function resolveSemanticMeta(target, detail = {}) {
  const sigil = extractSigil(target);
  const opInfo =
    OPERATOR_INFO[detail.operator]
    || OPERATOR_INFO[sigil]
    || OPERATOR_INFO[target.dataset.spwOperator]
    || inferOperatorInfoFromText(target);

  const affordances = normalizeAffordances(detail.affordances, target);
  const label =
    target.querySelector?.('.frame-sigil, .frame-card-sigil')?.textContent?.trim()
    || target.textContent?.trim()
    || opInfo?.label
    || 'handle';

  return {
    target,
    targetKind: detail.targetKind || inferTargetKind(target),
    operator: opInfo?.type || detail.operator || target.dataset.spwOperator || '',
    operatorLabel: opInfo?.label || detail.operator || target.dataset.spwOperator || 'operator',
    intent: opInfo?.intent || 'make structure inspectable',
    wonder: detail.wonder || opInfo?.wonder || inferWonder(target),
    affordances,
    context: detail.context || inferContext(target),
    label,
  };
}

function extractSigil(target) {
  const text =
    target.dataset.spwSigil
    || target.textContent
    || '';

  const match = text.trim().match(/^(#>|#:|\.|\^|~|\?|@|\*|&|=|\$|%|!|>)/);
  return match?.[0] || '';
}

function inferOperatorInfoFromText(target) {
  const explicit = target.dataset.spwOperator || target.closest('[data-spw-operator]')?.dataset.spwOperator || '';
  if (explicit && OPERATOR_INFO[explicit]) {
    return OPERATOR_INFO[explicit];
  }

  const sigil = extractSigil(target);
  return OPERATOR_INFO[sigil] || null;
}

function normalizeAffordances(detailAffordances, target) {
  if (Array.isArray(detailAffordances) && detailAffordances.length) {
    return detailAffordances;
  }

  const attrs = target.dataset.spwResolvedAffordance || target.dataset.spwAffordance || '';
  if (attrs) return attrs.split(/\s+/).filter(Boolean);

  const out = [];
  const opInfo = inferOperatorInfoFromText(target);
  if (target.matches('a[href], .operator-chip[href], .frame-sigil[href]')) out.push('navigate');
  if (opInfo?.type === 'probe') out.push('explore');
  if (opInfo?.type === 'pragma' || opInfo?.type === 'action') out.push('commit');
  if (target.closest('[data-spw-swappable]') || target.hasAttribute('data-spw-swappable')) out.push('swap');
  if (target.matches('.site-frame, .frame-card, .frame-panel, .frame-sigil, .frame-card-sigil')) out.push('pin');
  if (!out.length) out.push('hint');
  return [...new Set(out)];
}

function inferTargetKind(target) {
  if (target.matches('.frame-sigil')) return 'frame-sigil';
  if (target.matches('.frame-card-sigil')) return 'frame-card-sigil';
  if (target.matches('.operator-chip')) return 'operator-chip';
  if (target.matches('.spw-delimiter')) return 'delimiter';
  if (target.matches('.site-frame')) return 'frame';
  if (target.matches('.frame-card')) return 'card';
  return 'handle';
}

function inferWonder(target) {
  const opInfo = inferOperatorInfoFromText(target);
  if (opInfo?.wonder) return opInfo.wonder;
  if (target.matches('.spw-delimiter')) return 'orientation';
  if (target.matches('.operator-chip')) return 'inquiry';
  if (target.matches('.frame-sigil, .frame-card-sigil')) return 'memory';
  return 'orientation';
}

function inferContext(target) {
  return (
    target.dataset.spwContext
    || target.closest('[data-spw-context]')?.dataset.spwContext
    || target.closest('.site-frame')?.dataset.spwRole
    || document.body?.dataset.spwSurface
    || 'surface'
  );
}

/* ==========================================================================
   Utilities
   ========================================================================== */

function safeDate(timestamp) {
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return 'unknown-date';
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

/* ==========================================================================
   QA / Beat / Cauldron gesture affordances (Phase 3)
   Smallest honest wiring: only active in debug/QA contexts.
   Keyboard: s = capture artifact + cauldron, ? = status, b = start beat
   Touch: long-press on .site-frame in QA mode offers beat/capture
   ========================================================================== */

function initQABeatGestures() {
  if (typeof window === 'undefined') return;

  const isQA = () => {
    const d = document.documentElement?.dataset || {};
    const search = location.search.toLowerCase();
    // Align with central hasDebugOrQAMode logic from site.js for consistency across QA/beat surfaces
    return d.spwDebugMode === 'on' ||
           search.includes('qa=') || search.includes('debug=qa') || search.includes('debug=agent') ||
           search.includes('mode=screenshot-qa') || search.includes('mode=qa');
  };

  // Keyboard affordances (discoverable, minimal)
  document.addEventListener('keydown', async (e) => {
    if (!isQA()) return;
    const key = e.key.toLowerCase();
    const target = e.target;
    const isTextInput = target instanceof Element && target.matches('input,textarea,[contenteditable]');

    if (key === 's' && !isTextInput) {
      e.preventDefault();
      try {
        const mod = await import('/public/js/runtime/observation-beats.js');
        const art = mod.captureCurrentBeatArtifact({ trigger: 'keyboard-s' });
        // Attempt to feed cauldron
        const cauldronMod = await import('/public/js/interface/composition.js');
        if (cauldronMod.captureBeatAsIngredient) {
          await cauldronMod.captureBeatAsIngredient();
        }
        console.info('[QA] Artifact captured + offered to cauldron', art);
      } catch (err) { console.warn('[QA] capture failed', err); }
    }

    if (key === '?') {
      e.preventDefault();
      import('/public/js/runtime/observation-beats.js').then(m => {
        console.info('[QA Beats status]', m.getActiveBeats ? m.getActiveBeats() : 'no beats module');
      });
    }

    if (key === 'b') {
      e.preventDefault();
      import('/public/js/runtime/observation-beats.js').then(m => {
        if (m.startQABeat) m.startQABeat({ reasonDetail: 'keyboard-b' });
      });
    }
  }, { passive: false });

  // Touch / long-press on frames in QA mode for beat start or capture
  let lpTimer = null;
  document.addEventListener('pointerdown', (e) => {
    if (!isQA()) return;
    const frame = e.target.closest?.('.site-frame, [data-spw-kind="frame"]');
    if (!frame) return;

    clearTimeout(lpTimer);
    lpTimer = setTimeout(async () => {
      try {
        const mod = await import('/public/js/runtime/observation-beats.js');
        if (mod.startQABeat) {
          const beat = mod.startQABeat({ reasonDetail: 'touch-longpress-frame' });
          frame.dataset.spwActiveBeat = beat.id || 'active';
          console.info('[QA] Beat started via long-press on frame');
        }
      } catch {}
    }, 520);
  }, { passive: true });

  document.addEventListener('pointerup', () => clearTimeout(lpTimer), { passive: true });
  document.addEventListener('pointercancel', () => clearTimeout(lpTimer), { passive: true });

  // Swipe on cauldron hosts in QA to cycle or capture
  document.addEventListener('swipe', async (e) => { // if custom swipe events exist
    if (!isQA() || !e.target.closest?.('[data-spw-cauldron]')) return;
    // Future: cycle capture targets or flush current beat into cauldron
  });
}

// Auto-init the affordances (progressive, cheap check)
if (typeof document !== 'undefined') {
  // Run after main experiential init
  setTimeout(initQABeatGestures, 1200);
}
