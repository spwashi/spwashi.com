/**
 * dom-contracts.js
 * --------------------------------------------------------------------------
 * Shared DOM topography for the static site runtime.
 *
 * The goal is plain: make the site easy to hand to another developer without
 * asking them to rediscover which selectors define regions, components,
 * modules, and slots.
 * --------------------------------------------------------------------------
 */

import { detectOperator } from '/public/js/kernel/shared.js';

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
  '.settings-state-card',
  '.settings-nav-card',
  '.settings-structure-card',
  '.settings-map-card',
  '.pwa-status-card',
  '.payment-card',
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
  '[data-spw-feature]',
  '[data-spw-features]',
  '[data-spw-meaning]',
  '[data-spw-inspect]',
]);

export const COMPONENT_KIND_VALUES = Object.freeze([
  'frame',
  'panel',
  'card',
  'surface',
  'hook',
  'lens',
  'metric',
]);

export const COMPONENT_KIND_SHELL_EXCLUSION = ':not(body):not(main)';

export const COMPONENT_KIND_MIRROR_SELECTOR = [
  `[data-spw-component-kind]${COMPONENT_KIND_SHELL_EXCLUSION}`,
  `[data-spw-kind]${COMPONENT_KIND_SHELL_EXCLUSION}`,
].join(', ');

export const HOOK_REGION_SELECTOR = [
  'main [data-spw-kind="hook"]',
  'main [data-spw-component-kind="hook"]',
  'main article [data-spw-kind="hook"]',
  'main article [data-spw-component-kind="hook"]',
].join(', ');

export const REGION_SELECTORS = Object.freeze([
  '.site-frame',
  '[data-spw-kind="frame"]',
  '[data-spw-kind="panel"]',
  '[data-spw-kind="card"]',
  '[data-spw-kind="surface"]',
  '[data-spw-kind="hook"]',
  '[data-spw-kind="lens"]',
  '[data-spw-kind="metric"]',
  '[data-spw-component-kind="frame"]',
  '[data-spw-component-kind="panel"]',
  '[data-spw-component-kind="card"]',
  '[data-spw-component-kind="surface"]',
  '[data-spw-component-kind="hook"]',
  '[data-spw-component-kind="lens"]',
  '[data-spw-component-kind="metric"]',
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
  '[data-spw-feature]',
]);

export const COMPONENT_SELECTOR = COMPONENT_SELECTORS.join(', ');
export const MODULE_SELECTOR = MODULE_SELECTORS.join(', ');
export const REGION_SELECTOR = REGION_SELECTORS.join(', ');
export const SEMANTIC_CHROME_SELECTOR = SEMANTIC_CHROME_SELECTORS.join(', ');

export const FRAME_SELECTOR = '.site-frame, [data-spw-kind="frame"]';
export const REGION_HOST_SELECTOR = '.site-frame, .frame-panel, .frame-card, [data-spw-kind], [data-spw-role]';

export const ANNOTATION_LAYER_REGION_SELECTORS = Object.freeze([
  'main [data-spw-kind]',
  'main [data-spw-role]',
  'main [data-spw-context]',
  'main [data-spw-feature]',
  'main section[id]',
  'main article[id]',
]);

export const ANNOTATION_LAYER_REGION_SELECTOR = ANNOTATION_LAYER_REGION_SELECTORS.join(', ');

export const SITE_TOPOGRAPHY = Object.freeze({
  route: 'body[data-spw-surface]',
  shell: 'body > header, .site-header',
  main: 'main',
  region: REGION_SELECTOR,
  component: COMPONENT_SELECTOR,
  module: MODULE_SELECTOR,
  slot: '[data-spw-slot]',
  feature: '[data-spw-feature]',
});

export const FLOATING_CHROME_CONTRACT = Object.freeze({
  selector: '[data-spw-floating-chrome="true"][data-spw-layout-owner="floating-chrome"]',
  tiers: Object.freeze(['floating', 'docked', 'header', 'priority', 'popover', 'toast', 'drawer', 'modal']),
  roles: Object.freeze([
    'skip-link',
    'section-handle',
    'section-handle-shell',
    'cauldron-chip',
    'console',
    'region-menu-popover',
    'parallel-navigator',
    'topic-popover',
    'semantic-popover',
    'narrative-drawer',
    'discovery-toast-stack',
    'discovery-modal',
    'application-credits',
    'application-credit',
    'surface-map',
    'surface-map-panel',
    'state-inspector',
    'state-satchel',
    'pwa-status',
    'persona-tooltip',
    'persona-burst',
    'pronunciation-hint',
  ]),
  portableUse:
    'Use annotateFloatingChromeElement(...) when a runtime-created element floats above normal document flow and CSS needs a readable layer tier.',
});

export const FEATURE_CLUSTER_CONTRACT = Object.freeze({
  selector: '[data-spw-feature]',
  portableUse:
    'Use [data-spw-feature] for the outermost named cluster that should stay visible to CSS, audit hooks, and region-menu inspection.',
});

export const LAYOUT_CONTRACT_VALUES = Object.freeze([
  'slotted',
  'feature-gestural',
  'feature-only',
  'implicit',
]);

const RUNTIME_AUDIT_LIMIT = 240;
const runtimeMutationLog = [];

function getRuntimeElementLabel(el) {
  if (!globalThis.Element || !(el instanceof globalThis.Element)) return '';
  if (el.id) return `#${el.id}`;
  const stableClass = Array.from(el.classList || []).find(Boolean);
  if (stableClass) return `.${stableClass}`;
  return el.localName || 'element';
}

function logRuntimeMutation(el, entries, options = {}) {
  if (!globalThis.Element || !(el instanceof globalThis.Element) || !entries || typeof entries !== 'object') return;

  const changed = Object.fromEntries(
    Object.entries(entries).filter(([key, value]) => {
      if (!key) return false;
      const current = el.dataset?.[key];
      if (value == null || value === '') return current != null;
      const next = String(value);
      return current !== next;
    })
  );

  if (!Object.keys(changed).length) return;

  runtimeMutationLog.push({
    at: Date.now(),
    source: options.source || 'runtime',
    reason: options.reason || '',
    target: getRuntimeElementLabel(el),
    attributes: changed,
  });

  if (runtimeMutationLog.length > RUNTIME_AUDIT_LIMIT) runtimeMutationLog.shift();

  if (globalThis.document?.documentElement?.dataset?.spwRuntimeAudit === 'verbose') {
    console.debug('[spw runtime attributes]', runtimeMutationLog[runtimeMutationLog.length - 1]);
  }
}

export function getRuntimeMutationLog() {
  return runtimeMutationLog.slice();
}

export function writeRuntimeDatasetValues(el, entries = {}, options = {}) {
  logRuntimeMutation(el, entries, options);
  return writeDatasetValues(el, entries, options);
}

export function createFloatingChromeDescriptor(options = {}) {
  const {
    role = '',
    tier = '',
    mutator = '',
    reason = '',
    stylingAxis = 'floating-chrome',
    overlay = '',
  } = options;

  const entries = {
    spwFloatingChrome: 'true',
    spwLayoutOwner: 'floating-chrome',
    spwChromeRole: role || null,
    spwChromeTier: tier || null,
    spwRuntimeMutator: mutator || null,
    spwRuntimeMutationReason: reason || null,
    spwRuntimeStylingAxis: stylingAxis || null,
  };

  if (overlay) entries.spwOverlay = overlay;

  return {
    role,
    tier,
    mutator,
    reason,
    stylingAxis,
    overlay,
    entries,
  };
}

export function annotateFloatingChromeElement(el, options = {}) {
  if (!globalThis.HTMLElement || !(el instanceof globalThis.HTMLElement)) return false;

  /*
   * Stage mechanic:
   * Floating chrome is any runtime-created handle that appears above normal
   * prose flow. Give it a role and tier so authors can inspect the element,
   * see which script projected it, and tune the visual stack from CSS without
   * chasing scattered z-index rules.
   */
  const descriptor = createFloatingChromeDescriptor(options);

  return writeRuntimeDatasetValues(el, descriptor.entries, {
    source: descriptor.mutator || 'floating-chrome',
    reason: descriptor.reason || 'floating-chrome',
  });
}

export function describeFloatingChromeElement(element) {
  if (!globalThis.Element || !(element instanceof globalThis.Element)) return null;

  return {
    target: getRuntimeElementLabel(element),
    role: element.dataset.spwChromeRole || '',
    tier: element.dataset.spwChromeTier || '',
    mutator: element.dataset.spwRuntimeMutator || '',
    reason: element.dataset.spwRuntimeMutationReason || '',
    stylingAxis: element.dataset.spwRuntimeStylingAxis || '',
  };
}

export function describeFeatureClusterElement(element) {
  if (!globalThis.Element || !(element instanceof globalThis.Element)) return null;

  const context = describeElementContext(element);

  return {
    ...context,
    kind: element.dataset.spwComponentKind || context.kind,
    feature: element.dataset.spwFeature || context.feature || '',
  };
}

function collectElementAncestry(element, limit = 4) {
  if (!globalThis.Element || !(element instanceof globalThis.Element)) return [];

  const ancestry = [];
  let current = element.parentElement;

  while (current && ancestry.length < limit) {
    const isInspectable = Boolean(
      current.matches?.(COMPONENT_SELECTOR)
      || current.matches?.(REGION_SELECTOR)
      || current.matches?.('[data-spw-feature]')
      || current.matches?.('[data-spw-surface]')
    );

    if (isInspectable) {
      ancestry.push({
        target: getRuntimeElementLabel(current),
        kind: current.dataset.spwKind || inferTopographyKind(current, 'component'),
        role: current.dataset.spwRole || '',
        feature: current.dataset.spwFeature || '',
        context: current.dataset.spwContext || '',
        surface: current.closest?.('[data-spw-surface]')?.dataset?.spwSurface || '',
        slot: current.dataset.spwSlot || '',
      });
    }

    current = current.parentElement;
  }

  return ancestry;
}

export function describeElementContext(element) {
  if (!globalThis.Element || !(element instanceof globalThis.Element)) return null;

  const ancestry = collectElementAncestry(element);
  const owner = ancestry[0] || null;

  return {
    target: getRuntimeElementLabel(element),
    label:
      element.getAttribute?.('aria-label')
      || element.querySelector?.('h1, h2, h3, strong')?.textContent?.trim()
      || element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 120)
      || '',
    kind: element.dataset.spwKind || inferTopographyKind(element, 'component'),
    role: element.dataset.spwRole || '',
    feature: element.dataset.spwFeature || '',
    context: element.dataset.spwContext || '',
    surface: element.closest?.('[data-spw-surface]')?.dataset?.spwSurface || '',
    slot: element.dataset.spwSlot || '',
    inspect: element.dataset.spwInspect || '',
    boxModel: element.dataset.spwBoxModel || '',
    compositionFlow: element.dataset.spwCompositionFlow || '',
    owner,
    ancestry,
  };
}

if (globalThis.window) {
  globalThis.window.spwRuntimeAudit = Object.freeze({
    mutations: getRuntimeMutationLog,
    floatingChrome: () => Array.from(
      globalThis.document?.querySelectorAll?.(FLOATING_CHROME_CONTRACT.selector) || []
    ).map(describeFloatingChromeElement).filter(Boolean),
    featureClusters: () => Array.from(
      globalThis.document?.querySelectorAll?.(FEATURE_CLUSTER_CONTRACT.selector) || []
    ).map(describeFeatureClusterElement).filter(Boolean),
    elementContext: (target) => describeElementContext(target),
    contract: Object.freeze({
      verboseFlag: 'html[data-spw-runtime-audit="verbose"]',
      recordShape: '{ at, source, reason, target, attributes }',
      portableUse: 'Inspect which runtime modules added styling-relevant data attributes after load.',
    }),
    floatingChromeContract: FLOATING_CHROME_CONTRACT,
    featureClusterContract: FEATURE_CLUSTER_CONTRACT,
  });
}

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

export function syncComponentKindMirror(el, options = {}) {
  if (!el?.dataset) return false;

  const { missingOnly = true } = options;
  const kind = normalizeTopographyToken(el.dataset.spwKind || el.dataset.spwComponentKind || '');
  if (!kind) return false;

  const writer = missingOnly ? writeDatasetValueIfMissing : writeDatasetValue;
  let changed = false;
  changed = writer(el, 'spwKind', kind) || changed;
  changed = writer(el, 'spwComponentKind', kind) || changed;
  return changed;
}

export function syncComponentKindMirrors(root = document, options = {}) {
  if (!root?.querySelectorAll) return 0;

  let changed = 0;
  root.querySelectorAll(COMPONENT_KIND_MIRROR_SELECTOR).forEach((el) => {
    if (syncComponentKindMirror(el, options)) changed += 1;
  });
  return changed;
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

export function createFrameSigil({
  href = '',
  sigilText = '',
  operator = '',
  asLink = null
} = {}) {
  const detected = detectOperator(sigilText);
  const opType = operator || detected?.type || '';
  const shouldLink = asLink ?? Boolean(href);
  const tag = shouldLink ? 'a' : 'span';
  const el = document.createElement(tag);
  el.className = 'frame-sigil';

  if (shouldLink) {
    el.href = href || '#';
  }

  el.textContent = sigilText;

  if (opType) {
    writeDatasetValue(el, 'spwOperator', opType);
  }

  return el;
}

export function createFrameHeading({
  href = '',
  sigilText = '',
  title = '',
  headingLevel = 2,
  operator = '',
  headingId = ''
} = {}) {
  const header = document.createElement('header');
  header.className = 'frame-heading';
  const heading = document.createElement(`h${Math.min(6, Math.max(1, headingLevel))}`);
  heading.textContent = title;
  if (headingId) heading.id = headingId;

  header.append(
    createFrameSigil({ href, sigilText, operator }),
    heading
  );
  return header;
}

export function createCardSigil(sigilText = '', {
  operator = '',
  className = 'frame-card-sigil',
  ariaHidden = false
} = {}) {
  const detected = detectOperator(sigilText);
  const opType = operator || detected?.type || '';
  const el = document.createElement('span');
  el.className = className.includes('frame-card-sigil')
    ? className
    : `frame-card-sigil ${className}`.trim();
  el.textContent = sigilText;

  if (opType) {
    writeDatasetValue(el, 'spwOperator', opType);
  }

  if (ariaHidden) {
    el.setAttribute('aria-hidden', 'true');
  }

  return el;
}

export function inferTopographyKind(el, fallback = 'component') {
  if (!el) return fallback;
  if (el.dataset?.spwKind) return normalizeTopographyToken(el.dataset.spwKind);
  if (el.dataset?.spwComponentKind) return normalizeTopographyToken(el.dataset.spwComponentKind);

  if (matchesAny(el, SURFACE_COMPONENT_SELECTORS)) return 'surface';
  if (hasClass(el, 'site-frame')) return 'frame';
  if (hasClass(el, 'frame-panel') || hasClass(el, 'intent-cluster')) return 'panel';
  if (hasClass(el, 'mode-panel') || el.matches?.('[data-spw-kind="lens"], [data-spw-component-kind="lens"]')) return 'lens';
  if (el.matches?.('[data-spw-kind="hook"], [data-spw-component-kind="hook"]')) return 'hook';
  if (el.matches?.('[data-spw-kind="surface"], [data-spw-component-kind="surface"]')) return 'surface';
  if (el.matches?.('[data-spw-kind="metric"], [data-spw-component-kind="metric"]')) return 'metric';
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
