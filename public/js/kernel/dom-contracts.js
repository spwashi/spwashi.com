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

export const OPERATOR_SIGNAL_SELECTORS = Object.freeze([
  '.frame-sigil',
  '.frame-card-sigil',
  '.frame-panel-sigil',
  '.syntax-token',
  '.operator-chip',
  '.spec-pill',
  '.header-sigil',
  '.site-footer__brand',
  '.cognitive-token-sigil',
  '.specimen-index-tag',
  '.spw-section-handle__op',
  '[data-spw-charge-key]',
  '.spw-delimiter',
]);

export const BARE_SPW_CONTAINER_SELECTORS = Object.freeze([
  '[data-spw-bare-spw="enhance"]',
  '.site-footer__summary',
  '[data-spw-material-context~="mutable-markup"]',
]);

export const OPERATOR_SIGNAL_SELECTOR = OPERATOR_SIGNAL_SELECTORS.join(', ');
export const BARE_SPW_CONTAINER_SELECTOR = BARE_SPW_CONTAINER_SELECTORS.join(', ');

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
  slots: Object.freeze([
    'top-priority',
    'bottom-console',
    'bottom-left-travel',
    'bottom-right-satchel',
    'bottom-center',
    'right-middle',
    'popover',
    'sheet',
    'toast',
    'modal',
  ]),
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
    'collection-dock',
    'collection-toast-stack',
    'query-composer',
  ]),
  portableUse:
    'Use annotateFloatingChromeElement(...) when a runtime-created element floats above normal document flow and CSS needs a readable layer tier.',
});

const FLOATING_CHROME_SELECTOR = FLOATING_CHROME_CONTRACT.selector;
const FLOATING_CHROME_OPEN_STATES = Object.freeze(['open', 'visible', 'active', 'expanded']);
const FLOATING_CHROME_DOCKED_ROLES = Object.freeze([
  'console',
  'section-handle',
  'section-handle-shell',
  'state-inspector',
  'state-satchel',
  'collection-dock',
]);

const FLOATING_CHROME_ROLE_SLOTS = Object.freeze({
  'skip-link': 'top-priority',
  console: 'bottom-console',
  'section-handle': 'bottom-left-travel',
  'section-handle-shell': 'bottom-left-travel',
  'state-inspector': 'bottom-right-satchel',
  'state-satchel': 'bottom-right-satchel',
  'cauldron-chip': 'bottom-right-satchel',
  'surface-map': 'right-middle',
  'surface-map-panel': 'right-middle',
  'parallel-navigator': 'bottom-left-travel',
  'region-menu-popover': 'popover',
  'topic-popover': 'popover',
  'semantic-popover': 'popover',
  'narrative-drawer': 'sheet',
  'discovery-toast-stack': 'toast',
  'application-credits': 'toast',
  'application-credit': 'toast',
  'pwa-status': 'toast',
  'persona-tooltip': 'popover',
  'persona-burst': 'toast',
  'pronunciation-hint': 'popover',
  'discovery-modal': 'modal',
  'collection-dock': 'bottom-center',
  'collection-toast-stack': 'toast',
  'query-composer': 'bottom-right-satchel',
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
    slot = '',
    mutator = '',
    reason = '',
    stylingAxis = 'floating-chrome',
    overlay = '',
  } = options;

  const resolvedSlot = slot || FLOATING_CHROME_ROLE_SLOTS[role] || '';

  const entries = {
    spwFloatingChrome: 'true',
    spwLayoutOwner: 'floating-chrome',
    spwChromeRole: role || null,
    spwChromeTier: tier || null,
    spwChromeSlot: resolvedSlot || null,
    spwRuntimeMutator: mutator || null,
    spwRuntimeMutationReason: reason || null,
    spwRuntimeStylingAxis: stylingAxis || null,
  };

  if (overlay) entries.spwOverlay = overlay;

  return {
    role,
    tier,
    slot: resolvedSlot,
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

function isSectionHandleShellSibling(el) {
  return el?.classList?.contains?.('spw-section-handle-shell');
}

function isSupersededSectionHandle(el) {
  if (el.dataset.spwChromeRole !== 'section-handle') return false;
  const shell = el.nextElementSibling;
  return isSectionHandleShellSibling(shell);
}

function isFloatingChromeRendered(el) {
  if (!globalThis.HTMLElement || !(el instanceof globalThis.HTMLElement)) return false;
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
  if (isSupersededSectionHandle(el)) return false;
  const handleState = el.dataset.spwHandleState;
  const popupState = el.dataset.spwPopupState || el.dataset.spwDisclosureState;
  if (handleState === 'hidden') return false;
  if (popupState === 'hidden' || popupState === 'closed') return false;
  return true;
}

function isFloatingChromeOpen(el) {
  if (!isFloatingChromeRendered(el)) return false;

  const stateValues = [
    el.dataset.spwState,
    el.dataset.spwMenu,
    el.dataset.spwStateInspector,
    el.dataset.spwHandleState,
    el.dataset.spwDisclosureState,
    el.dataset.spwPopupState,
  ].filter(Boolean);

  if (stateValues.some((value) => FLOATING_CHROME_OPEN_STATES.includes(value))) return true;
  if (el.classList?.contains('is-visible') || el.classList?.contains('is-open')) return true;
  if (el.matches?.('[open], [popover]:popover-open')) return true;
  return false;
}

function uniqueTokens(values = []) {
  return [...new Set(values.map((value) => normalizeTopographyToken(value)).filter(Boolean))];
}

function rectsOverlap(a, b, gutter = 4) {
  if (!a || !b) return false;
  return !(
    a.right <= b.left + gutter
    || a.left >= b.right - gutter
    || a.bottom <= b.top + gutter
    || a.top >= b.bottom - gutter
  );
}

function measureFloatingChromeOcclusion(nodes = []) {
  const boxes = nodes
    .map((node) => ({
      node,
      role: node.dataset.spwChromeRole || 'chrome',
      slot: node.dataset.spwChromeSlot || 'unassigned',
      rect: node.getBoundingClientRect(),
    }))
    .filter(({ rect }) => rect.width > 0 && rect.height > 0);

  const collisions = [];
  const collidingNodes = new Set();
  boxes.forEach((box, index) => {
    boxes.slice(index + 1).forEach((other) => {
      if (!rectsOverlap(box.rect, other.rect)) return;
      collisions.push(`${box.role}:${box.slot}->${other.role}:${other.slot}`);
      collidingNodes.add(box.node);
      collidingNodes.add(other.node);
    });
  });

  return {
    collisions,
    collidingNodes,
    state: collisions.length ? 'overlap' : 'clear',
  };
}

function resolveFloatingChromeCompetition(openCount, dockedOpenCount, overlap = false) {
  if (overlap) return 'crowded';
  if (openCount <= 1 && dockedOpenCount <= 1) return 'clear';
  if (openCount <= 2 && dockedOpenCount <= 2) return 'stacked';
  return 'crowded';
}

const BOTTOM_LANE_MOBILE_QUERY = '(max-width: 720px), (pointer: coarse)';
const BOTTOM_LANE_SLOT_GAP_PX = 10.4;
const BOTTOM_LANE_MENU_CLEARANCE_PX = 68;
const BOTTOM_LANE_MANAGED_STYLE_KEYS = Object.freeze([
  '--spw-floating-slot-section-handle',
  '--spw-floating-slot-satchel',
  '--spw-floating-slot-console',
  '--spw-floating-slot-parallel-nav',
  '--spw-floating-bottom-rail',
  '--spw-bottom-chrome-clearance',
  '--spw-floating-handle-inline-start',
  '--spw-floating-handle-inline-end',
  '--spw-floating-handle-transform',
  '--spw-floating-handle-max-inline-size',
  '--spw-floating-satchel-lane',
  '--spw-floating-inline-gutter',
  '--spw-floating-menu-clearance',
]);

let bottomLaneListenersBound = false;

function ensureBottomLaneListeners() {
  if (bottomLaneListenersBound || typeof globalThis.window === 'undefined') return;
  bottomLaneListenersBound = true;
  const resync = () => {
    globalThis.requestAnimationFrame(() => {
      syncFloatingChromeState(globalThis.document, {
        source: 'floating-chrome',
        reason: 'viewport-resize',
      });
    });
  };
  globalThis.window.addEventListener('resize', resync, { passive: true });
  globalThis.window.visualViewport?.addEventListener?.('resize', resync, { passive: true });
  globalThis.window.addEventListener('scroll', resync, { passive: true });
}

function isMobileBottomLane() {
  return globalThis.matchMedia?.(BOTTOM_LANE_MOBILE_QUERY)?.matches ?? false;
}

function pxToRem(px) {
  const rootStyle = globalThis.getComputedStyle?.(globalThis.document?.documentElement);
  const fontSize = Number.parseFloat(rootStyle?.fontSize) || 16;
  return `${(px / fontSize).toFixed(3)}rem`;
}

function readSafeAreaInsetPx(edge = 'bottom') {
  const root = globalThis.document?.documentElement;
  if (!root || !globalThis.getComputedStyle) return BOTTOM_LANE_SLOT_GAP_PX;
  const style = globalThis.getComputedStyle(root);
  const token = style.getPropertyValue(
    edge === 'bottom' ? '--spw-floating-slot-bottom-base' : '--spw-floating-slot-gutter'
  ).trim();
  if (token.endsWith('rem')) {
    const rem = Number.parseFloat(token);
    const rootPx = Number.parseFloat(style.fontSize) || 16;
    if (Number.isFinite(rem)) return rem * rootPx;
  }
  if (token.endsWith('px')) {
    const px = Number.parseFloat(token);
    if (Number.isFinite(px)) return px;
  }
  return BOTTOM_LANE_SLOT_GAP_PX;
}

function measureElementChrome(el) {
  if (!(el instanceof globalThis.HTMLElement)) return null;
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return null;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const viewportHeight = globalThis.innerHeight
    || globalThis.document?.documentElement?.clientHeight
    || 0;
  return {
    el,
    rect,
    height: rect.height,
    width: rect.width,
    bottomInset: Math.max(0, viewportHeight - rect.bottom),
    top: rect.top,
  };
}

function readMenuClearancePx(doc) {
  const menuOpen = doc.querySelector(
    '.site-header[data-spw-menu-mode="toggle"][data-spw-menu="open"], body > header[data-spw-menu-mode="toggle"][data-spw-menu="open"]'
  );
  return menuOpen ? BOTTOM_LANE_MENU_CLEARANCE_PX : 0;
}

function findBottomLaneHandle(doc) {
  const shell = doc.querySelector('.spw-section-handle-shell[data-spw-handle-state="visible"]');
  if (shell instanceof globalThis.HTMLElement && !shell.hidden) return shell;
  const handle = doc.querySelector('.spw-section-handle[data-spw-handle-state="visible"]:not([hidden])');
  return handle instanceof globalThis.HTMLElement ? handle : null;
}

function findBottomLaneInspector(doc) {
  return doc.querySelector('[data-spw-state-inspector-root]');
}

function findBottomLaneConsole(doc) {
  const consoleNode = doc.querySelector('.spw-console');
  if (!(consoleNode instanceof globalThis.HTMLElement)) return null;
  if (consoleNode.hidden || consoleNode.getAttribute('aria-hidden') === 'true') return null;
  return consoleNode;
}

function findBottomLaneSurfaceMap(doc) {
  const nav = doc.querySelector('.spw-nav');
  if (!(nav instanceof globalThis.HTMLElement)) return null;
  if (doc.documentElement?.dataset?.spwNavigator === 'hidden') return null;
  return nav;
}

function clearBottomLaneManagedStyles(html) {
  BOTTOM_LANE_MANAGED_STYLE_KEYS.forEach((key) => {
    html.style.removeProperty(key);
  });
}

function measureAndApplyBottomLane(doc, html, { competition, occlusion }) {
  const mobile = isMobileBottomLane();
  const menuClearancePx = readMenuClearancePx(doc);
  const safeBottomPx = readSafeAreaInsetPx('bottom');
  const safeSidePx = Math.max(readSafeAreaInsetPx('left'), readSafeAreaInsetPx('right'));

  const handleEl = findBottomLaneHandle(doc);
  const inspectorRoot = findBottomLaneInspector(doc);
  const consoleEl = findBottomLaneConsole(doc);
  const surfaceMapEl = findBottomLaneSurfaceMap(doc);

  const handleMeasure = measureElementChrome(handleEl);
  const consoleMeasure = measureElementChrome(consoleEl);
  const inspectorLaunch = inspectorRoot?.querySelector?.('.spw-state-inspector__launch');
  const inspectorPanel = inspectorRoot?.dataset?.spwStateInspector === 'open'
    ? inspectorRoot?.querySelector?.('.spw-state-inspector__panel:not([hidden])')
    : null;
  const launchMeasure = measureElementChrome(inspectorLaunch);
  const panelMeasure = measureElementChrome(inspectorPanel);
  const navOpen = mobile && (
    surfaceMapEl?.classList?.contains('is-open')
    || surfaceMapEl?.dataset?.spwNavState === 'open'
  );
  const navPanel = navOpen
    ? surfaceMapEl?.querySelector?.('.spw-nav-panel:not([hidden])')
    : null;
  const navPanelMeasure = measureElementChrome(navPanel);
  // Desktop chrome occupies named corners/edges rather than one vertical
  // bottom ladder. The navigation strip only participates in the compact
  // bottom-lane calculation where it actually consumes that rail.
  const surfaceMeasure = mobile
    ? measureElementChrome(surfaceMapEl?.querySelector?.('.spw-nav-strip') || surfaceMapEl)
    : null;

  if (!handleMeasure && !launchMeasure && !consoleMeasure && !surfaceMeasure && !panelMeasure && !navPanelMeasure) {
    clearBottomLaneManagedStyles(html);
    writeRuntimeDatasetValues(html, {
      spwBottomLaneManaged: null,
      spwBottomLaneMode: null,
      spwBottomLaneHandle: null,
      spwBottomLaneClearancePx: null,
      spwBottomLaneNav: null,
    }, {
      source: 'floating-chrome',
      reason: 'bottom-lane-clear',
    });
    return null;
  }

  let tierBottomPx = safeBottomPx + menuClearancePx;
  const vars = {};
  let clearancePx = safeBottomPx + menuClearancePx;
  let laneMode = mobile ? 'split' : 'desktop-snap';

  if (consoleMeasure) {
    vars['--spw-floating-slot-console'] = pxToRem(tierBottomPx);
    clearancePx = Math.max(clearancePx, tierBottomPx + consoleMeasure.height);
    if (mobile) tierBottomPx += consoleMeasure.height + BOTTOM_LANE_SLOT_GAP_PX;
  } else {
    vars['--spw-floating-slot-console'] = pxToRem(safeBottomPx + menuClearancePx);
  }

  const travelRowHeightPx = Math.max(handleMeasure?.height || 0, launchMeasure?.height || 0, 0);
  const travelRowBottomPx = tierBottomPx;

  vars['--spw-floating-slot-section-handle'] = pxToRem(travelRowBottomPx);
  vars['--spw-floating-slot-satchel'] = pxToRem(travelRowBottomPx);
  vars['--spw-floating-bottom-rail'] = pxToRem(travelRowBottomPx);

  if (travelRowHeightPx > 0) {
    clearancePx = Math.max(clearancePx, travelRowBottomPx + travelRowHeightPx);
  }

  const parallelNavBottomPx = mobile
    ? travelRowBottomPx + travelRowHeightPx + BOTTOM_LANE_SLOT_GAP_PX
    : safeBottomPx + menuClearancePx;
  vars['--spw-floating-slot-parallel-nav'] = pxToRem(parallelNavBottomPx);
  if (surfaceMeasure) {
    clearancePx = Math.max(clearancePx, parallelNavBottomPx + surfaceMeasure.height);
  }

  if (navPanelMeasure) {
    clearancePx = Math.max(
      clearancePx,
      Math.max(0, (globalThis.innerHeight || 0) - navPanelMeasure.top) + BOTTOM_LANE_SLOT_GAP_PX
    );
    laneMode = 'stacked';
  }

  if (panelMeasure) {
    clearancePx = Math.max(
      clearancePx,
      Math.max(0, (globalThis.innerHeight || 0) - panelMeasure.top) + BOTTOM_LANE_SLOT_GAP_PX
    );
  }

  vars['--spw-bottom-chrome-clearance'] = pxToRem(clearancePx + BOTTOM_LANE_SLOT_GAP_PX);
  vars['--spw-floating-menu-clearance'] = pxToRem(menuClearancePx);

  let handleLane = handleMeasure ? 'expanded' : null;

  if (mobile && (handleMeasure || launchMeasure)) {
    const satchelLanePx = launchMeasure?.width
      ? Math.ceil(launchMeasure.width + 16)
      : Math.min(184, ((globalThis.innerWidth || 360) * 0.5) - 13);
    const gutterPx = Math.max(BOTTOM_LANE_SLOT_GAP_PX, safeSidePx);
    const leftLaneMaxPx = Math.max(
      152,
      (globalThis.innerWidth || 360) - satchelLanePx - (gutterPx * 2) - BOTTOM_LANE_SLOT_GAP_PX
    );

    vars['--spw-floating-inline-gutter'] = pxToRem(gutterPx);
    vars['--spw-floating-satchel-lane'] = pxToRem(satchelLanePx);
    vars['--spw-floating-handle-inline-start'] = pxToRem(gutterPx);
    vars['--spw-floating-handle-inline-end'] = 'auto';
    vars['--spw-floating-handle-transform'] = 'none';
    vars['--spw-floating-handle-max-inline-size'] = pxToRem(leftLaneMaxPx);

    if (handleMeasure && launchMeasure) laneMode = 'split';
    else if (handleMeasure) laneMode = 'handle-only';
    else laneMode = 'satchel-only';
  } else if (!mobile) {
    const gutterPx = Math.max(BOTTOM_LANE_SLOT_GAP_PX, safeSidePx);
    const leftSnapMaxPx = Math.max(240, Math.min(420, (globalThis.innerWidth || 1200) * 0.38));
    vars['--spw-floating-inline-gutter'] = pxToRem(gutterPx);
    vars['--spw-floating-handle-inline-start'] = pxToRem(gutterPx);
    vars['--spw-floating-handle-inline-end'] = 'auto';
    vars['--spw-floating-handle-transform'] = 'none';
    vars['--spw-floating-handle-max-inline-size'] = pxToRem(leftSnapMaxPx);
    vars['--spw-floating-satchel-lane'] = pxToRem(leftSnapMaxPx);
    laneMode = 'desktop-snap';
  }

  const overlap = occlusion?.state === 'overlap';
  if (competition === 'crowded' || overlap) {
    laneMode = mobile ? 'crowded' : 'stacked';
    if (handleMeasure) handleLane = 'compact';
  } else if (competition === 'stacked' && mobile && handleMeasure && launchMeasure) {
    handleLane = 'compact';
  }

  Object.entries(vars).forEach(([key, value]) => {
    html.style.setProperty(key, value);
  });

  writeRuntimeDatasetValues(html, {
    spwBottomLaneManaged: 'true',
    spwBottomLaneMode: laneMode,
    spwBottomLaneHandle: handleLane,
    spwBottomLaneClearancePx: String(Math.round(clearancePx)),
    spwBottomLaneNav: navOpen ? 'open' : (surfaceMeasure ? 'strip' : null),
  }, {
    source: 'floating-chrome',
    reason: 'bottom-lane-layout',
  });

  return {
    laneMode,
    handleLane,
    clearancePx,
    travelRowBottomPx,
    travelRowHeightPx,
  };
}

// Ambient chrome that should yield (collapse to its minimal form) when the
// floating field gets crowded or it directly overlaps another element. Extend
// this list to opt a role into pressure-driven collapse.
const FLOATING_CHROME_COLLAPSIBLE_ROLES = Object.freeze(['collection-dock']);

function applyChromeCollapse(open = [], competition = 'clear', collidingNodes = new Set()) {
  let collapsed = 0;
  for (const node of open) {
    if (!FLOATING_CHROME_COLLAPSIBLE_ROLES.includes(node.dataset.spwChromeRole)) continue;
    const pressured = competition === 'crowded' || collidingNodes.has(node);
    if (pressured) {
      node.dataset.spwChromeCollapse = 'pressured';
      collapsed += 1;
    } else if (node.dataset.spwChromeCollapse) {
      delete node.dataset.spwChromeCollapse;
    }
  }
  return collapsed;
}

export function syncFloatingChromeState(root = document, options = {}) {
  const doc = root?.nodeType === globalThis.Node?.DOCUMENT_NODE
    ? root
    : root?.ownerDocument || globalThis.document;
  const html = doc?.documentElement;
  if (!(html instanceof globalThis.HTMLElement) || !doc?.querySelectorAll) return null;

  const nodes = Array.from(doc.querySelectorAll(FLOATING_CHROME_SELECTOR))
    .filter((node) => node instanceof globalThis.HTMLElement);
  const rendered = nodes.filter(isFloatingChromeRendered);
  const open = rendered.filter(isFloatingChromeOpen);
  const roles = uniqueTokens(rendered.map((node) => node.dataset.spwChromeRole));
  const openRoles = uniqueTokens(open.map((node) => node.dataset.spwChromeRole));
  const slots = uniqueTokens(rendered.map((node) => node.dataset.spwChromeSlot));
  const openSlots = uniqueTokens(open.map((node) => node.dataset.spwChromeSlot));
  const dockedOpen = open.filter((node) => FLOATING_CHROME_DOCKED_ROLES.includes(node.dataset.spwChromeRole));
  const dockedOpenCount = dockedOpen.length;
  const occlusion = measureFloatingChromeOcclusion(open);
  const competition = resolveFloatingChromeCompetition(
    open.length,
    dockedOpenCount,
    occlusion.state === 'overlap'
  );
  // Redundancy handling: collapse ambient chrome that is crowded or overlapping.
  const collapsedCount = applyChromeCollapse(open, competition, occlusion.collidingNodes);
  ensureBottomLaneListeners();
  const bottomLane = measureAndApplyBottomLane(doc, html, { competition, occlusion });

  writeRuntimeDatasetValues(html, {
    spwFloatingChromeCount: String(rendered.length),
    spwFloatingChromeOpenCount: String(open.length),
    spwFloatingChromeRoles: roles.join(' ') || null,
    spwFloatingChromeOpenRoles: openRoles.join(' ') || null,
    spwFloatingChromeSlots: slots.join(' ') || null,
    spwFloatingChromeOpenSlots: openSlots.join(' ') || null,
    spwFloatingChromeCompetition: rendered.length ? competition : null,
    spwFloatingChromeBottom: dockedOpenCount ? 'occupied' : 'clear',
    spwFloatingChromeOcclusion: open.length > 1 ? occlusion.state : 'clear',
    spwFloatingChromeOcclusionPairs: occlusion.collisions.join('|') || null,
    spwFloatingChromeCollapsed: collapsedCount ? String(collapsedCount) : null,
    spwRuntimeMutator: options.source || 'floating-chrome',
    spwRuntimeMutationReason: options.reason || 'chrome-state-sync',
    spwRuntimeStylingAxis: 'floating-chrome',
  }, {
    source: options.source || 'floating-chrome',
    reason: options.reason || 'chrome-state-sync',
  });

  return {
    count: rendered.length,
    openCount: open.length,
    dockedOpenCount,
    roles,
    openRoles,
    slots,
    openSlots,
    competition,
    occlusion,
    collapsedCount,
    bottomLane,
  };
}

function clearPopupPlacementStyles(popover) {
  ['left', 'right', 'top', 'bottom', 'width', 'maxWidth', 'maxHeight'].forEach((property) => {
    popover.style[property] = '';
  });
}

function readViewportBox() {
  const viewport = globalThis.visualViewport;
  const offsetLeft = viewport?.offsetLeft || 0;
  const offsetTop = viewport?.offsetTop || 0;
  const width = Math.max(1, viewport?.width || globalThis.innerWidth || 1);
  const height = Math.max(1, viewport?.height || globalThis.innerHeight || 1);
  return {
    left: offsetLeft,
    top: offsetTop,
    right: offsetLeft + width,
    bottom: offsetTop + height,
    width,
    height,
  };
}

function resolvePopupCollision(horizontalClamped, verticalFlipped) {
  if (horizontalClamped && verticalFlipped) return 'corner-clamp';
  if (horizontalClamped) return 'horizontal-clamp';
  if (verticalFlipped) return 'vertical-flip';
  return 'clear';
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resolvePopupHorizontalRoom(rect, viewport, gutter) {
  const midpoint = viewport.left + (viewport.width / 2);
  if (rect.left < midpoint && viewport.right - rect.right < rect.left - viewport.left) return 'left-edge';
  if (rect.right > midpoint && rect.left - viewport.left < viewport.right - rect.right) return 'right-edge';
  return 'balanced';
}

export function positionFloatingChromePopover(popover, target, options = {}) {
  if (!globalThis.HTMLElement || !(popover instanceof globalThis.HTMLElement)) return null;

  const {
    compact = false,
    maxWidth = 304,
    maxHeight = 416,
    gutter = 12,
    offset = 8,
    bottomReserve = 0,
    source = 'floating-chrome',
  } = options;

  if (compact || !(target instanceof globalThis.Element)) {
    clearPopupPlacementStyles(popover);
    writeRuntimeDatasetValues(popover, {
      spwPopupPlacement: 'sheet',
      spwPopupVertical: 'bottom',
      spwPopupHorizontal: 'stretch',
      spwPopupCollision: 'sheet',
      spwPopupRoom: 'viewport-sheet',
      spwRuntimeMutator: source,
      spwRuntimeMutationReason: 'popup-placement',
      spwRuntimeStylingAxis: 'popup-placement',
    }, {
      source,
      reason: 'popup-placement',
    });
    return {
      placement: 'sheet',
      vertical: 'bottom',
      horizontal: 'stretch',
      collision: 'sheet',
    };
  }

  const rect = target.getBoundingClientRect();
  const viewport = readViewportBox();
  const safeMaxWidth = Math.max(1, Math.min(maxWidth, viewport.width - (gutter * 2)));
  const safeMaxHeight = Math.max(1, Math.min(maxHeight, viewport.height - bottomReserve - (gutter * 2)));
  const centeredLeft = rect.left + (rect.width / 2) - (safeMaxWidth / 2);
  const left = clampNumber(
    centeredLeft,
    viewport.left + gutter,
    Math.max(viewport.left + gutter, viewport.right - safeMaxWidth - gutter)
  );
  const preferredTop = rect.bottom + offset;
  const fallbackTop = rect.top - safeMaxHeight - offset;
  const bottomLimit = Math.max(viewport.top + gutter, viewport.bottom - bottomReserve - gutter);
  const opensBelow = preferredTop + safeMaxHeight <= bottomLimit || fallbackTop < viewport.top + gutter;
  const top = opensBelow
    ? Math.min(preferredTop, Math.max(viewport.top + gutter, bottomLimit - safeMaxHeight))
    : Math.max(viewport.top + gutter, fallbackTop);
  const targetCenter = rect.left + (rect.width / 2);
  const horizontal = targetCenter < viewport.left + (viewport.width * 0.34)
    ? 'start'
    : targetCenter > viewport.left + (viewport.width * 0.66)
      ? 'end'
      : 'center';
  const verticalFlipped = !opensBelow;
  const horizontalClamped = Math.abs(left - centeredLeft) > 0.5;
  const collision = resolvePopupCollision(horizontalClamped, verticalFlipped);
  const room = resolvePopupHorizontalRoom(rect, viewport, gutter);

  writeRuntimeDatasetValues(popover, {
    spwPopupPlacement: 'popover',
    spwPopupVertical: opensBelow ? 'below' : 'above',
    spwPopupHorizontal: horizontal,
    spwPopupCollision: collision,
    spwPopupRoom: room,
    spwRuntimeMutator: source,
    spwRuntimeMutationReason: 'popup-placement',
    spwRuntimeStylingAxis: 'popup-placement',
  }, {
    source,
    reason: 'popup-placement',
  });

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  popover.style.right = 'auto';
  popover.style.bottom = 'auto';
  popover.style.width = '';
  popover.style.maxWidth = `${Math.round(safeMaxWidth)}px`;
  popover.style.maxHeight = `${Math.round(safeMaxHeight)}px`;

  return {
    placement: 'popover',
    vertical: opensBelow ? 'below' : 'above',
    horizontal,
    collision,
    room,
    left,
    top,
    maxWidth: safeMaxWidth,
    maxHeight: safeMaxHeight,
  };
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
  const selectorList = Array.isArray(selectors) ? selectors : [selectors];
  return selectorList.some((selector) => selector && el?.matches?.(selector));
}

export function writeDatasetValue(el, key, value, options = {}) {
  if (!el?.dataset || !key) return false;

  const { allowEmpty = false, missingOnly = false } = options;
  const next = serializeDatasetValue(value, options);
  const shouldRemove = next == null || (!allowEmpty && next === '');

  if (shouldRemove) {
    if (missingOnly || !(key in el.dataset)) return false;
    delete el.dataset[key];
    return true;
  }

  if (missingOnly && el.dataset[key]) return false;

  if (el.dataset[key] === next) return false;
  el.dataset[key] = next;
  return true;
}

export function serializeDatasetValue(value, options = {}) {
  const { allowEmpty = false, separator = ' ' } = options;

  if (value == null) return null;

  if (value instanceof Set) {
    return serializeDatasetValue([...value], { allowEmpty, separator });
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => serializeDatasetValue(item, { allowEmpty: true, separator }))
      .filter((item) => item != null && item !== '');

    if (!items.length) return allowEmpty ? '' : null;
    return items.join(separator);
  }

  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  const text = String(value);
  if (text) return text;
  return allowEmpty ? '' : null;
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

const COMPOSITION_TIER_ORDER = Object.freeze([
  'page',
  'region',
  'feature',
  'component',
  'slot',
  'module',
  'chrome',
  'runtime',
]);

export function resolveCompositionTier(el) {
  if (!globalThis.Element || !(el instanceof globalThis.Element)) return 'unknown';

  if (el === globalThis.document?.body || el === globalThis.document?.documentElement) {
    return 'page';
  }

  if (el.dataset?.spwFeature) return 'feature';
  if (el.dataset?.spwSlot) return 'slot';
  if (
    el.dataset?.spwModuleTrigger
    || el.dataset?.spwModule
    || el.matches?.('[data-spw-module-trigger], [data-spw-module]')
  ) {
    return 'module';
  }
  if (
    el.dataset?.spwFloatingChrome === 'true'
    || el.dataset?.spwChromeRole
    || el.dataset?.spwChromeIsland
    || el.matches?.(FLOATING_CHROME_CONTRACT.selector)
  ) {
    return 'chrome';
  }
  if (
    el.dataset?.spwRegionGenome
    || el.dataset?.spwRegionRole
    || el.matches?.(REGION_SELECTOR)
    || el.matches?.(HOOK_REGION_SELECTOR)
  ) {
    return 'region';
  }
  if (matchesAny(el, COMPONENT_SELECTOR)) return 'component';

  const volatileSignals = [
    el.dataset?.spwPhase,
    el.dataset?.spwCharge,
    el.dataset?.spwGesture,
    el.dataset?.spwResolvedCompositionStability,
    el.dataset?.spwPackOccupancy,
  ].some(Boolean);
  if (volatileSignals && !el.dataset?.spwKind && !el.dataset?.spwRole) {
    return 'runtime';
  }

  return 'unknown';
}

export function compareCompositionTiers(left = 'unknown', right = 'unknown') {
  const leftIndex = COMPOSITION_TIER_ORDER.indexOf(left);
  const rightIndex = COMPOSITION_TIER_ORDER.indexOf(right);
  if (leftIndex === -1 && rightIndex === -1) return 0;
  if (leftIndex === -1) return 1;
  if (rightIndex === -1) return -1;
  return leftIndex - rightIndex;
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
