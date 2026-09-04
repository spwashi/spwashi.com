import { emitSpwAction } from '/public/js/kernel/shared.js';
import {
  removeDatasetValues,
  syncFloatingChromeState,
  writeDatasetValues,
  writeDatasetValue,
  writeRuntimeDatasetValues,
} from '/public/js/kernel/dom-contracts.js';
import { TUNING_SURFACES_EVENT } from '/public/js/runtime/tuning-contract.js';
import { releaseShellLock, syncShellLock } from './shell/scroll-lock.js';
import {
  ensureAttentionPosturePanel,
  setAttentionPosturePanelOpen,
} from './shell/attention-posture-panel.js';
import {
  ensureUtilityRow,
  getCurrentFontScale,
  getNextFontScale,
  syncUtilityRow,
} from './shell/utility-row.js';
import { bindInteractionHops } from './interaction-hops.js';

const EVENT_NAMES = Object.freeze({
  INTENT: 'spw:shell-menu-intent',
  STATE: 'spw:shell-menu-state',
  TRACE: 'spw:header-trace-change',
});

const MODES = Object.freeze({
  INLINE: 'inline',
  TOGGLE: 'toggle',
});

const PHASES = Object.freeze({
  RESTING: 'resting',
  APPROACH: 'approach',
  CONTACT: 'contact',
  PROJECTING: 'projecting',
  SETTLING: 'settling',
});

const PRESSURES = Object.freeze({
  CALM: 'calm',
  TIGHT: 'tight',
  COMPRESSED: 'compressed',
  CROWDED: 'crowded',
});

const TOPOLOGIES = Object.freeze({
  INLINE_RIBBON: 'inline-ribbon',
  STACKED_FIELD: 'stacked-field',
  DRAWER_FIELD: 'drawer-field',
  SCREEN_FIELD: 'screen-field',
});

const INTENTS = Object.freeze({
  SURVEY: 'survey',
  CONDENSE: 'condense',
  CONTACT: 'contact',
  PROJECT: 'project',
  SETTLE: 'settle',
});

const CLARITIES = Object.freeze({
  STEADY: 'steady',
  SURVEY: 'survey',
  CONDENSE: 'condense',
  CONTACT: 'contact',
  PROJECT: 'project',
  SETTLE: 'settle',
});

const SCROLL_BANDS = Object.freeze({
  TOP: 'top',
  LIFTED: 'lifted',
  DEEP: 'deep',
});

const SCROLL_DIRECTIONS = Object.freeze({
  UP: 'up',
  DOWN: 'down',
  STILL: 'still',
});

const SHELL_LAYOUTS = Object.freeze({
  INLINE_RIBBON: 'inline-ribbon',
  INLINE_TABLET: 'inline-tablet',
  INLINE_STACKED: 'inline-stacked',
  TOGGLE_FIELD: 'toggle-field',
});

const SHELL_END_SLOTS = Object.freeze({
  INDICATOR: 'indicator',
  TOGGLE: 'toggle',
});

const SHELL_TUNE_SURFACES = Object.freeze({
  KNOB: 'knob',
  NESTED: 'nested',
  STRIP: 'strip',
});

const DEFAULTS = Object.freeze({
  narrowBreakpointPx: 720,
  midBreakpointPx: 980,
  compressedRatio: 1.55,
  modeHysteresisRatio: 0.14,
  pressureHysteresisRatio: 0.04,
  scrollLiftPx: 18,
  scrollDeepPx: 132,
  scrollDirectionDeadzonePx: 4,
  settlePhaseMs: 180,
});

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'summary',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getViewportTier(width = window.innerWidth, config = DEFAULTS) {
  if (width < 420) return 'compact';
  if (width < config.narrowBreakpointPx) return 'narrow';
  if (width < config.midBreakpointPx) return 'mid';
  if (width < 1280) return 'regular';
  return 'wide';
}

function getPointerMode() {
  if (window.matchMedia('(pointer: coarse)').matches) return 'coarse';
  return 'fine';
}

function getHoverMode() {
  if (window.matchMedia('(hover: hover)').matches) return 'hover';
  return 'touch';
}

function syncDeviceContext(state) {
  const tier = getViewportTier(window.innerWidth, state?.config || DEFAULTS);
  const pointer = getPointerMode();
  const hover = getHoverMode();

  writeDatasetValues(document.documentElement, {
    spwViewportTier: tier,
    spwPointerMode: pointer,
    spwHoverMode: hover,
    spwDeviceContext: `${tier}-${pointer}`,
  });
}

function getScrollY() {
  return Math.max(window.scrollY || window.pageYOffset || 0, 0);
}

function resolveScrollBand(scrollY, config = DEFAULTS) {
  if (scrollY <= config.scrollLiftPx) return SCROLL_BANDS.TOP;
  if (scrollY < config.scrollDeepPx) return SCROLL_BANDS.LIFTED;
  return SCROLL_BANDS.DEEP;
}

function resolveScrollDirection(nextScrollY, previousScrollY, config = DEFAULTS) {
  if (nextScrollY > previousScrollY + config.scrollDirectionDeadzonePx) return SCROLL_DIRECTIONS.DOWN;
  if (nextScrollY < previousScrollY - config.scrollDirectionDeadzonePx) return SCROLL_DIRECTIONS.UP;
  return SCROLL_DIRECTIONS.STILL;
}

function createState(config) {
  const scrollY = getScrollY();
  return {
    config,
    mode: MODES.INLINE,
    pointerMode: getPointerMode(),
    userIntentOpen: false,
    pointerInsideHeader: false,
    focusInsideHeader: false,
    scrollY,
    scrollBand: resolveScrollBand(scrollY, config),
    scrollDirection: SCROLL_DIRECTIONS.STILL,
    scrollRaf: 0,
    settleTimer: 0,
    lastTransitionSource: 'init',
    navMeasure: {
      contentWidth: 0,
      navWidth: 0,
      ratio: 1,
      source: 'fallback',
      measuredAt: 0,
    },
    snapshot: null,
  };
}

function readNavContentWidth(nav, navList) {
  if (!(nav instanceof HTMLElement) || !(navList instanceof HTMLElement)) return 0;

  const listItems = Array.from(navList.querySelectorAll(':scope > li'));
  const listStyle = window.getComputedStyle(navList);
  const columnGap = Number.parseFloat(listStyle.columnGap || listStyle.gap || '0') || 0;
  const measuredItemsWidth = listItems.reduce((total, item) => {
    if (!(item instanceof HTMLElement)) return total;
    return total + item.getBoundingClientRect().width;
  }, 0) + Math.max(0, listItems.length - 1) * columnGap;

  return Math.max(nav.scrollWidth, navList.scrollWidth, measuredItemsWidth);
}

function computeNavRatio(header, nav, navList, state) {
  const navStyle = window.getComputedStyle(nav);
  const canMeasure = !nav.hidden && navStyle.display !== 'none' && navStyle.visibility !== 'hidden';
  const cachedNavWidth = state?.navMeasure?.navWidth || 0;
  const navWidth = canMeasure
    ? nav.clientWidth || cachedNavWidth || Math.max(header.clientWidth * 0.58, 1)
    : cachedNavWidth || Math.max(header.clientWidth * 0.58, 1);
  if (!navWidth) return 1;

  const measuredRawContentWidth = canMeasure ? readNavContentWidth(nav, navList) : 0;
  const cachedContentWidth = state?.navMeasure?.contentWidth || 0;
  const measuredContentWidth = measuredRawContentWidth && cachedContentWidth
    && Math.abs(measuredRawContentWidth - cachedContentWidth) < 12
    ? cachedContentWidth
    : measuredRawContentWidth;
  const contentWidth = measuredContentWidth || cachedContentWidth;

  if (!contentWidth) {
    return state?.navMeasure?.ratio || 1;
  }

  const ratio = contentWidth / navWidth;
  if (state?.navMeasure) {
    state.navMeasure = {
      contentWidth,
      navWidth,
      ratio,
      source: measuredContentWidth ? 'measured' : 'cached-content',
      measuredAt: measuredContentWidth
        ? Math.round(performance.now())
        : state.navMeasure.measuredAt,
    };
  }

  return ratio;
}

function countPrimaryRoutes(navList) {
  return navList.querySelectorAll(':scope > li > a[href]').length;
}

function countOverflowRoutes(navList) {
  const panelLinks = navList.querySelectorAll(':scope > li.spw-route-menu-host .spw-route-menu-panel a[href]').length;
  if (panelLinks) return panelLinks;

  const countText = navList.querySelector(':scope > li.spw-route-menu-host .spw-route-menu-count')?.textContent || '';
  const count = Number.parseInt(countText.replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

function resolveMenuMode(header, nav, navList, state) {
  const tier = document.documentElement.dataset.spwViewportTier || getViewportTier(window.innerWidth, state.config);
  const ratio = computeNavRatio(header, nav, navList, state);
  if (tier === 'compact' || tier === 'narrow') return MODES.TOGGLE;

  const previousMode = state.snapshot?.mode || state.mode || MODES.INLINE;
  const exitRatio = Math.max(1, state.config.compressedRatio - state.config.modeHysteresisRatio);
  if (previousMode === MODES.TOGGLE) {
    return ratio > exitRatio ? MODES.TOGGLE : MODES.INLINE;
  }

  if (ratio > state.config.compressedRatio) return MODES.TOGGLE;

  return MODES.INLINE;
}

function resolveShellLayout(snapshot) {
  if (snapshot.mode === MODES.TOGGLE) return SHELL_LAYOUTS.TOGGLE_FIELD;
  if (snapshot.viewportTier === 'mid') return SHELL_LAYOUTS.INLINE_TABLET;
  if (snapshot.pressure === PRESSURES.COMPRESSED || snapshot.pressure === PRESSURES.CROWDED) {
    return SHELL_LAYOUTS.INLINE_STACKED;
  }
  return SHELL_LAYOUTS.INLINE_RIBBON;
}

function resolveShellEndSlot(snapshot) {
  if (snapshot.mode === MODES.TOGGLE) return SHELL_END_SLOTS.TOGGLE;
  if (snapshot.viewportTier === 'wide' || snapshot.viewportTier === 'regular') {
    if (snapshot.pressure === PRESSURES.CALM || snapshot.pressure === PRESSURES.TIGHT) {
      return SHELL_END_SLOTS.INDICATOR;
    }
  }
  return SHELL_END_SLOTS.TOGGLE;
}

function resolveShellTuneSurface(snapshot) {
  if (snapshot.mode === MODES.TOGGLE) return SHELL_TUNE_SURFACES.STRIP;
  if (snapshot.pressure === PRESSURES.COMPRESSED || snapshot.pressure === PRESSURES.CROWDED) {
    return SHELL_TUNE_SURFACES.NESTED;
  }
  return SHELL_TUNE_SURFACES.KNOB;
}

function syncShellChromeLayout(header, snapshot) {
  if (!(header instanceof HTMLElement) || !snapshot) return;

  const disclosure = header.querySelector('.spw-shell-tools-disclosure');
  const toolsOpen = disclosure instanceof HTMLDetailsElement && disclosure.open;
  const layout = resolveShellLayout(snapshot);
  const endSlot = resolveShellEndSlot(snapshot);
  const tuneSurface = resolveShellTuneSurface(snapshot);

  writeDatasetValues(header, {
    spwShellLayout: layout,
    spwShellEndSlot: endSlot,
    spwShellTuneSurface: tuneSurface,
    spwShellTools: toolsOpen ? 'open' : 'closed',
  });

  const indicator = header.querySelector('.header-op-indicator');
  const toggle = header.querySelector('.spw-nav-toggle');

  if (indicator instanceof HTMLElement) {
    indicator.hidden = endSlot !== SHELL_END_SLOTS.INDICATOR;
  }

  if (toggle instanceof HTMLButtonElement) {
    toggle.hidden = endSlot !== SHELL_END_SLOTS.TOGGLE;
    if (!toggle.hidden) {
      toggle.setAttribute('aria-controls', header.querySelector('nav')?.id || 'spw-shell-nav');
    }
  }

  if (disclosure instanceof HTMLDetailsElement) {
    disclosure.dataset.spwShellTuneSurface = tuneSurface;
  }
}

function resolveMenuPressure({ mode, ratio, navFit, tier, pointer, previousPressure, config = DEFAULTS }) {
  if (mode === MODES.TOGGLE && (tier === 'compact' || tier === 'narrow')) {
    return PRESSURES.CROWDED;
  }

  const pressureMargin = config.pressureHysteresisRatio || 0;
  const compressedEnterRatio = 1.18;
  const compressedExitRatio = compressedEnterRatio - pressureMargin;
  const tightEnterRatio = 1.02;
  const tightExitRatio = tightEnterRatio - pressureMargin;
  const compressedContext = navFit === 'compressed' || (tier === 'mid' && pointer === 'coarse');

  if (previousPressure === PRESSURES.COMPRESSED && (ratio > compressedExitRatio || compressedContext)) {
    return PRESSURES.COMPRESSED;
  }

  if (ratio > compressedEnterRatio || compressedContext) {
    return PRESSURES.COMPRESSED;
  }

  if (previousPressure === PRESSURES.TIGHT && (ratio > tightExitRatio || navFit === 'tight')) {
    return PRESSURES.TIGHT;
  }

  if (ratio > tightEnterRatio || navFit === 'tight') {
    return PRESSURES.TIGHT;
  }

  return PRESSURES.CALM;
}

function resolveMenuTopology(mode, pressure, tier) {
  if (mode === MODES.INLINE) return TOPOLOGIES.INLINE_RIBBON;
  if (tier === 'compact' || pressure === PRESSURES.CROWDED) {
    return TOPOLOGIES.SCREEN_FIELD;
  }
  if (tier === 'narrow' || pressure === PRESSURES.COMPRESSED) {
    return TOPOLOGIES.DRAWER_FIELD;
  }
  return TOPOLOGIES.STACKED_FIELD;
}

function resolveMenuPhase(state, open, source) {
  if (!open && ['outside', 'hash', 'route', 'escape', 'intent-settle', 'settle'].includes(source)) {
    return PHASES.SETTLING;
  }

  if (state.mode === MODES.TOGGLE && open) return PHASES.PROJECTING;
  if (state.focusInsideHeader) return PHASES.CONTACT;
  if (state.pointerInsideHeader && state.pointerMode === 'fine') return PHASES.APPROACH;
  return PHASES.RESTING;
}

function resolveMenuIntent({ open, phase, pressure }) {
  if (open) return INTENTS.PROJECT;
  if (phase === PHASES.CONTACT) return INTENTS.CONTACT;
  if (phase === PHASES.SETTLING) return INTENTS.SETTLE;
  if (pressure === PRESSURES.COMPRESSED || pressure === PRESSURES.CROWDED) return INTENTS.CONDENSE;
  return INTENTS.SURVEY;
}

function describeReturnPaths(open) {
  if (!open) return ['toggle', 'focus'];
  return ['toggle', 'escape', 'route', 'hash', 'outside'];
}

function collectChangedAxes(previousSnapshot, nextSnapshot) {
  if (!previousSnapshot) return ['init'];

  const changedAxes = [];
  const axisMap = [
    ['mode', 'mode'],
    ['state', 'state'],
    ['phase', 'phase'],
    ['pressure', 'pressure'],
    ['topology', 'topology'],
    ['intent', 'intent'],
    ['viewport', 'viewportTier'],
    ['pointer', 'pointerMode'],
    ['fit', 'navFit'],
    ['routes', 'totalRouteCount'],
  ];

  axisMap.forEach(([axis, key]) => {
    if (previousSnapshot[key] !== nextSnapshot[key]) {
      changedAxes.push(axis);
    }
  });

  return changedAxes;
}

function resolveMenuClarity(snapshot, changedAxes) {
  if (changedAxes.includes('state')) {
    return snapshot.state === 'open' ? CLARITIES.PROJECT : CLARITIES.SETTLE;
  }

  if (changedAxes.includes('mode')) {
    return snapshot.mode === MODES.TOGGLE ? CLARITIES.CONDENSE : CLARITIES.SURVEY;
  }

  if (snapshot.phase === PHASES.CONTACT || changedAxes.includes('phase')) {
    if (snapshot.phase === PHASES.CONTACT || snapshot.phase === PHASES.APPROACH) {
      return CLARITIES.CONTACT;
    }
  }

  if (changedAxes.includes('pressure')) {
    return snapshot.pressure === PRESSURES.CALM ? CLARITIES.SURVEY : CLARITIES.CONDENSE;
  }

  return CLARITIES.STEADY;
}

function buildMenuSnapshot(header, nav, navList, state, open, source) {
  const html = document.documentElement;
  const tier = html.dataset.spwViewportTier || getViewportTier(window.innerWidth, state.config);
  const pointer = html.dataset.spwPointerMode || getPointerMode();
  const navFit = header.dataset.spwNavFit || 'roomy';
  const ratio = computeNavRatio(header, nav, navList, state);
  const primaryRouteCount = countPrimaryRoutes(navList);
  const overflowRouteCount = countOverflowRoutes(navList);
  const pressure = resolveMenuPressure({
    mode: state.mode,
    ratio,
    navFit,
    tier,
    pointer,
    previousPressure: state.snapshot?.pressure,
    config: state.config,
  });
  const topology = resolveMenuTopology(state.mode, pressure, tier);
  const phase = resolveMenuPhase(state, open, source);
  const intent = resolveMenuIntent({ open, phase, pressure });
  const returnPaths = describeReturnPaths(open);
  // Any open toggle field owns page scroll. Menu panels scroll internally;
  // the page stays put so drawer/screen fields do not drift under the finger.
  const locking = open && state.mode === MODES.TOGGLE
    ? 'locked'
    : 'permeable';

  return {
    mode: state.mode,
    state: open ? 'open' : 'closed',
    overlay: open && state.mode === MODES.TOGGLE ? 'active' : 'idle',
    phase,
    source,
    viewportTier: tier,
    pointerMode: pointer,
    navFit,
    navRatio: Number(ratio.toFixed(3)),
    pressure,
    topology,
    intent,
    primaryRouteCount,
    overflowRouteCount,
    totalRouteCount: primaryRouteCount + overflowRouteCount,
    locking,
    returnPaths,
    returnHint: open ? 'toggle, Escape, route, or hash' : 'toggle or focus',
  };
}

function writeMenuDatasets(el, snapshot, role) {
  if (!(el instanceof HTMLElement)) return;

  writeRuntimeDatasetValues(el, {
    spwMenuRole: role,
    spwMenuMode: snapshot.mode,
    spwMenuChanged: snapshot.changedAxes.join(' ') || 'none',
    spwMenuClarity: snapshot.clarity,
    spwMenu: snapshot.state,
    spwMenuOverlay: snapshot.overlay,
    spwMenuPhase: snapshot.phase,
    spwMenuSource: snapshot.source,
    spwMenuViewport: snapshot.viewportTier,
    spwMenuPointer: snapshot.pointerMode,
    spwMenuPressure: snapshot.pressure,
    spwMenuTopology: snapshot.topology,
    spwMenuIntent: snapshot.intent,
    spwMenuNavFit: snapshot.navFit,
    spwMenuRouteCount: snapshot.totalRouteCount,
    spwMenuOverflowCount: snapshot.overflowRouteCount,
    spwMenuLocking: snapshot.locking,
    // spwMenuReversible dropped 2026-08-12: was hardcoded `true` in
    // buildMenuSnapshot, never actually varied. experiential.js's own
    // reader (`header.dataset.spwMenuReversible !== 'false'`) already
    // treats an absent attribute as true, so not writing it changes
    // nothing observable.
    spwMenuReturnPaths: snapshot.returnPaths.join(' '),
    spwRuntimeMutator: 'shell-disclosure',
    spwRuntimeMutationReason: 'navigation-layout',
    spwRuntimeStylingAxis: 'menu',
  }, {
    source: 'shell-disclosure',
    reason: 'navigation-layout',
  });
}

function writeScrollDatasets(header, state) {
  if (!(header instanceof HTMLElement)) return;
  writeDatasetValues(header, {
    spwShellScroll: state.scrollBand,
    spwShellScrollDirection: state.scrollDirection,
  });
  header.classList.toggle('is-scrolled', state.scrollBand !== SCROLL_BANDS.TOP);
  syncShellOffset(header);
}

function syncShellOffset(header) {
  if (!(header instanceof HTMLElement)) return;
  const rect = header.getBoundingClientRect();
  const offset = Math.max(0, rect.bottom || 0);
  document.documentElement.style.setProperty('--spw-shell-menu-offset', `${offset.toFixed(1)}px`);
  syncFloatingChromeState(document, {
    source: 'shell-disclosure',
    reason: 'shell-offset',
  });
}

function syncHeaderPointerField(header, event) {
  if (!(header instanceof HTMLElement)) return;
  if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const rect = header.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
  const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
  header.style.setProperty('--spw-shell-pointer-x', `${x.toFixed(2)}%`);
  header.style.setProperty('--spw-shell-pointer-y', `${y.toFixed(2)}%`);
  writeRuntimeDatasetValues(header, {
    spwShellPointer: 'tracking',
    spwRuntimeMutator: 'shell-disclosure',
    spwRuntimeMutationReason: 'pointer-field',
    spwRuntimeStylingAxis: 'header-pointer',
  }, {
    source: 'shell-disclosure',
    reason: 'pointer-field',
  });
  writeDatasetValue(header, 'spwShellMicrointeraction', 'pointer-field', { missingOnly: true });
}

function clearHeaderPointerField(header) {
  if (!(header instanceof HTMLElement)) return;
  header.style.removeProperty('--spw-shell-pointer-x');
  header.style.removeProperty('--spw-shell-pointer-y');
  removeDatasetValues(header, ['spwShellPointer']);
}

function setToolsDisclosureOpen(disclosure, open) {
  if (!(disclosure instanceof HTMLDetailsElement)) return;
  disclosure.open = !!open;

  const summary = disclosure.querySelector('summary');
  if (summary instanceof HTMLElement) {
    summary.setAttribute('aria-expanded', disclosure.open ? 'true' : 'false');
  }
}
function syncScrollState(header, state, nextScrollY = getScrollY()) {
  const direction = resolveScrollDirection(nextScrollY, state.scrollY, state.config);
  const band = resolveScrollBand(nextScrollY, state.config);
  if (
    header.dataset.spwShellScroll === band
    && header.dataset.spwShellScrollDirection === direction
  ) {
    state.scrollY = nextScrollY;
    return;
  }

  state.scrollY = nextScrollY;
  state.scrollBand = band;
  state.scrollDirection = direction;
  writeScrollDatasets(header, state);
}

function isCoarsePointerMode() {
  return document.documentElement.dataset.spwPointerMode === 'coarse'
    || window.matchMedia?.('(pointer: coarse)')?.matches === true;
}

function describeToggleState(snapshot) {
  const coarse = isCoarsePointerMode();
  if (snapshot.mode === MODES.INLINE) return 'visible';
  if (snapshot.state === 'open') return coarse ? 'tap to close' : 'click to close';
  if (snapshot.mode === MODES.TOGGLE) return coarse ? 'tap to open' : 'click to open';
  return 'ready';
}

function describeToggleMeta(snapshot) {
  return `${snapshot.totalRouteCount} routes`;
}

function buildToggleAria(snapshot) {
  if (snapshot.mode === MODES.INLINE) {
    return `Routes are visible. ${snapshot.totalRouteCount} routes available.`;
  }
  const openness = snapshot.state === 'open' ? 'Close' : 'Open';
  return `${openness} routes. ${snapshot.totalRouteCount} routes available.`;
}

function getFocusableMenuElements(header, nav, toggle) {
  const nodes = [toggle, ...header.querySelectorAll(FOCUSABLE_SELECTOR)];
  return nodes.filter((node, index, list) => {
    if (!(node instanceof HTMLElement)) return false;
    if (node.hidden) return false;
    if (node.getAttribute('aria-hidden') === 'true') return false;
    if (node.closest('[hidden], [aria-hidden="true"]')) return false;
    if (!header.contains(node) && node !== toggle && !nav.contains(node)) return false;
    if (node !== toggle && !nav.contains(node)) return false;
    return list.indexOf(node) === index;
  });
}

function focusFirstMenuTarget(nav) {
  const target = nav.querySelector(FOCUSABLE_SELECTOR);
  if (target instanceof HTMLElement) {
    target.focus();
    return true;
  }
  return false;
}

function focusCurrentMenuTarget(nav) {
  const current = nav.querySelector('a[aria-current="page"]');
  const target = current instanceof HTMLElement ? current : nav.querySelector(FOCUSABLE_SELECTOR);
  if (!(target instanceof HTMLElement)) return false;

  target.focus();
  target.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  return true;
}

function syncToggleCopy(toggle, snapshot) {
  const labelNode = toggle.querySelector('.spw-nav-toggle-label');
  const stateNode = toggle.querySelector('.spw-nav-toggle-state');
  const metaNode = toggle.querySelector('.spw-nav-toggle-meta');

  if (labelNode) {
    labelNode.textContent = snapshot.mode !== MODES.INLINE && snapshot.state === 'open'
      ? 'Map'
      : 'Routes';
  }

  if (stateNode) {
    stateNode.textContent = describeToggleState(snapshot);
  }

  if (metaNode) {
    metaNode.textContent = describeToggleMeta(snapshot);
  }

  toggle.setAttribute('aria-label', buildToggleAria(snapshot));
  toggle.title = snapshot.mode === MODES.INLINE
    ? 'Routes are visible'
    : snapshot.state === 'open'
      ? 'Close routes'
      : 'Open routes';
}

function emitMenuState(snapshot) {
  document.dispatchEvent(new CustomEvent(EVENT_NAMES.STATE, {
    detail: snapshot,
  }));
}

function clearSettleTimer(state) {
  if (!state.settleTimer) return;
  window.clearTimeout(state.settleTimer);
  state.settleTimer = 0;
}

function scheduleRestingPhase(header, nav, toggle, state, snapshot) {
  clearSettleTimer(state);
  if (snapshot.phase !== PHASES.SETTLING || snapshot.state !== 'closed') return;

  state.settleTimer = window.setTimeout(() => {
    state.settleTimer = 0;
    if (!state.snapshot || state.snapshot.state !== 'closed' || state.snapshot.phase !== PHASES.SETTLING) return;

    const settled = {
      ...state.snapshot,
      phase: PHASES.RESTING,
      intent: INTENTS.SURVEY,
      clarity: CLARITIES.STEADY,
      changedAxes: ['phase'],
      source: 'settled',
    };

    writeMenuDatasets(header, settled, 'header');
    writeMenuDatasets(nav, settled, 'nav');
    writeMenuDatasets(toggle, settled, 'toggle');
    state.snapshot = settled;
    emitMenuState(settled);
  }, state.config.settlePhaseMs);
}

function applyMenuState(header, nav, navList, toggle, state, open, source = 'system') {
  const snapshot = buildMenuSnapshot(header, nav, navList, state, open, source);
  snapshot.changedAxes = collectChangedAxes(state.snapshot, snapshot);
  snapshot.clarity = resolveMenuClarity(snapshot, snapshot.changedAxes);
  syncShellOffset(header);

  nav.hidden = state.mode === MODES.TOGGLE ? !open : false;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

  if (open && state.mode === MODES.TOGGLE) {
    window.requestAnimationFrame(() => {
      focusCurrentMenuTarget(nav);
    });
  }

  writeMenuDatasets(header, snapshot, 'header');
  syncShellChromeLayout(header, snapshot);
  writeMenuDatasets(nav, snapshot, 'nav');
  writeMenuDatasets(toggle, snapshot, 'toggle');
  syncToggleCopy(toggle, snapshot);
  syncShellLock(snapshot);

  state.lastTransitionSource = source;
  state.snapshot = snapshot;
  emitMenuState(snapshot);
  scheduleRestingPhase(header, nav, toggle, state, snapshot);
  return snapshot;
}

function syncDisclosure(header, nav, navList, toggle, state, source = 'sync') {
  syncDeviceContext(state);
  state.pointerMode = getPointerMode();
  const previousMode = state.mode;
  state.mode = resolveMenuMode(header, nav, navList, state);

  if (previousMode === MODES.INLINE && state.mode === MODES.TOGGLE) {
    state.userIntentOpen = false;
  }

  if (state.mode === MODES.INLINE) {
    applyMenuState(header, nav, navList, toggle, state, true, source);
    return;
  }

  applyMenuState(header, nav, navList, toggle, state, state.userIntentOpen, source);
}

function dispatchActionForSnapshot(snapshot) {
  if (!snapshot) return;

  if (snapshot.state === 'open') {
    emitSpwAction('@shell.open', `Menu projected as ${snapshot.topology}. Return paths stay explicit.`);
    return;
  }

  if (snapshot.phase === PHASES.SETTLING) {
    emitSpwAction('.shell.settle', `Menu settled. Route field remains reversible.`);
    return;
  }

  emitSpwAction('@shell.close', 'Navigation field condensed without trapping focus.');
}

export function initSpwShellDisclosure(options = {}) {
  const config = { ...DEFAULTS, ...options };
  const header = document.querySelector('body > header, .site-header');
  const nav = header?.querySelector('nav');
  const navList = nav?.querySelector('ul');

  if (!header || !nav || !navList || header.dataset.spwShellDisclosureInit === 'true') {
    return { cleanup() {}, refresh() {} };
  }

  writeDatasetValue(header, 'spwShellDisclosureInit', 'true');
  nav.id ||= 'spw-shell-nav';
  bindInteractionHops({
    html: document.documentElement,
    root: document,
    writePhase: (node, phase) => {
      if (!node || !phase) return;
      node.dataset.spwInteractionPhase = phase;
    },
  });

  let toggle = header.querySelector('.spw-nav-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.className = 'spw-nav-toggle';
    toggle.type = 'button';
    toggle.hidden = true;
    toggle.setAttribute('aria-controls', nav.id);
    toggle.setAttribute('aria-label', 'Toggle navigation menu');
    toggle.innerHTML = `
      <span class="spw-nav-toggle-glyph" aria-hidden="true"></span>
      <span class="spw-nav-toggle-copy">
        <span class="spw-nav-toggle-label">Routes</span>
        <span class="spw-nav-toggle-state">tap to open</span>
      </span>
      <span class="spw-nav-toggle-meta" aria-hidden="true">routes</span>
    `;

    const indicator = header.querySelector('.header-op-indicator');
    if (indicator) {
      header.insertBefore(toggle, indicator);
    } else {
      header.appendChild(toggle);
    }
  }

  const utilityRow = ensureUtilityRow(header);
  const utilityDisclosure = utilityRow.closest('.spw-shell-tools-disclosure');
  const utilitySummary = utilityDisclosure?.querySelector('.spw-shell-tools-summary');
  const attentionPill = header.querySelector('.spw-attention-posture-pill');
  const attentionPanel = ensureAttentionPosturePanel(header, attentionPill);

  const state = createState(config);
  syncDeviceContext(state);
  state.mode = resolveMenuMode(header, nav, navList, state);
  writeDatasetValues(header, {
    spwMenu: state.mode === MODES.TOGGLE ? 'closed' : 'open',
    spwMenuOverlay: 'idle',
    spwMenuMode: state.mode,
    spwMenuPhase: PHASES.RESTING,
    spwMenuSource: 'init',
  });
  syncScrollState(header, state, state.scrollY);

  const closeToggleMenu = (source = 'system') => {
    if (state.mode !== MODES.TOGGLE || !state.userIntentOpen) return;
    state.userIntentOpen = false;
    document.querySelectorAll('.spw-route-menu[open]').forEach((menu) => {
      menu.open = false;
    });
    const snapshot = applyMenuState(header, nav, navList, toggle, state, false, source);
    dispatchActionForSnapshot(snapshot);
  };

  const openToggleMenu = (source = 'system') => {
    if (state.mode !== MODES.TOGGLE || state.userIntentOpen) return;
    state.userIntentOpen = true;
    const snapshot = applyMenuState(header, nav, navList, toggle, state, true, source);
    dispatchActionForSnapshot(snapshot);
  };

  let lastToggleActivation = 0;
  const shouldIgnoreDuplicateActivation = () => {
    const now = performance.now();
    if (now - lastToggleActivation < 90) return true;
    lastToggleActivation = now;
    return false;
  };

  const handleToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (shouldIgnoreDuplicateActivation()) return;

    const activeToggle = event.target?.closest?.('.spw-nav-toggle');
    if (activeToggle instanceof HTMLButtonElement && activeToggle !== toggle) {
      toggle = activeToggle;
      toggle.setAttribute('aria-controls', nav.id);
    }

    if (state.mode !== MODES.TOGGLE) {
      nav.querySelector('a[href]')?.focus();
      emitSpwAction('@shell.focus_routes', 'Route neighborhood is already visible; menu control moved focus into the page-authored links.');
      return;
    }

    state.userIntentOpen = !state.userIntentOpen;
    const snapshot = applyMenuState(header, nav, navList, toggle, state, state.userIntentOpen, 'user');
    dispatchActionForSnapshot(snapshot);
  };

  const handleToggleKeydown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (state.mode !== MODES.TOGGLE) {
        focusFirstMenuTarget(nav);
        return;
      }
      if (!state.userIntentOpen) openToggleMenu('toggle-key');
      window.requestAnimationFrame(() => {
        focusCurrentMenuTarget(nav);
      });
      return;
    }

    if (event.key === 'ArrowUp' && state.userIntentOpen) {
      event.preventDefault();
      closeToggleMenu('toggle-key');
      toggle.focus();
    }
  };

  const handleTogglePointerDown = (event) => {
    event.stopPropagation();
  };

  const handleTogglePointerUp = (event) => {
    if (event.button && event.button !== 0) return;
    writeRuntimeDatasetValues(toggle, {
      spwMenuPhase: PHASES.CONTACT,
      spwMenuSource: 'pointer',
      spwRuntimeMutator: 'shell-disclosure',
      spwRuntimeMutationReason: 'menu-contact',
      spwRuntimeStylingAxis: 'menu',
    }, {
      source: 'shell-disclosure',
      reason: 'menu-contact',
    });
  };

  const handleDelegatedToggleClick = (event) => {
    const activeToggle = event.target?.closest?.('.spw-nav-toggle');
    if (!(activeToggle instanceof HTMLButtonElement)) return;
    if (activeToggle === toggle) return;
    handleToggle(event);
  };

  const handleAttentionPillClick = (event) => {
    const activePill = event.target?.closest?.('.spw-attention-posture-pill');
    if (!(activePill instanceof HTMLElement) || activePill !== attentionPill) return;

    event.preventDefault();
    event.stopPropagation();
    const isOpen = activePill.getAttribute('aria-expanded') === 'true';
    setAttentionPosturePanelOpen(header, !isOpen);
  };

  const handleAttentionPillKeydown = (event) => {
    if (event.key !== 'ArrowDown') return;
    const activePill = event.target?.closest?.('.spw-attention-posture-pill');
    if (!(activePill instanceof HTMLElement) || activePill !== attentionPill) return;

    event.preventDefault();
    setAttentionPosturePanelOpen(header, true);
    window.requestAnimationFrame(() => {
      attentionPanel?.querySelector('a[href]')?.focus();
    });
  };

  const handleAttentionPanelClick = (event) => {
    const close = event.target?.closest?.('[data-spw-attention-panel-close]');
    if (!(close instanceof HTMLElement) || !attentionPanel?.contains(close)) return;

    event.preventDefault();
    event.stopPropagation();
    setAttentionPosturePanelOpen(header, false, { focusPill: true });
  };

  const handlePointerEnter = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    state.pointerInsideHeader = true;
    syncHeaderPointerField(header, event);
    syncDisclosure(header, nav, navList, toggle, state, 'pointer');
  };

  const handlePointerMove = (event) => {
    syncHeaderPointerField(header, event);
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    state.pointerInsideHeader = false;
    clearHeaderPointerField(header);
    syncDisclosure(header, nav, navList, toggle, state, 'pointer');
  };

  const handleFocusIn = () => {
    state.focusInsideHeader = true;
    syncDisclosure(header, nav, navList, toggle, state, 'focus');
  };

  const handleFocusOut = () => {
    const active = document.activeElement;
    state.focusInsideHeader = !!active && header.contains(active);
    syncDisclosure(header, nav, navList, toggle, state, 'blur');
  };

  const handleNavClick = (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const href = link.getAttribute('href') || link.href || '';
    if (!href) return;

    document.querySelectorAll('.spw-route-menu[open]').forEach((menu) => {
      menu.open = false;
      syncRouteMenuMode(menu);
    });

    window.setTimeout(() => {
      closeToggleMenu('route');
    }, 0);
  };

  const handleDocumentClick = (event) => {
    if (attentionPanel && !attentionPanel.hidden && !header.contains(event.target)) {
      setAttentionPosturePanelOpen(header, false);
    }

    if (state.mode !== MODES.TOGGLE) return;
    if (!state.userIntentOpen) return;
    if (header.contains(event.target)) return;
    closeToggleMenu('outside');
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === 'Escape' && attentionPanel && !attentionPanel.hidden) {
      event.preventDefault();
      setAttentionPosturePanelOpen(header, false, { focusPill: true });
      return;
    }

    if (event.key === 'Tab' && state.mode === MODES.TOGGLE && state.userIntentOpen) {
      const focusables = getFocusableMenuElements(header, nav, toggle);
      if (focusables.length > 1) {
        const active = document.activeElement;
        const currentIndex = focusables.indexOf(active);
        const lastIndex = focusables.length - 1;

        if (event.shiftKey) {
          if (currentIndex <= 0) {
            event.preventDefault();
            focusables[lastIndex].focus();
          }
        } else if (currentIndex === lastIndex || currentIndex === -1) {
          event.preventDefault();
          focusables[0].focus();
        }
      }
      return;
    }

    if (event.key !== 'Escape') return;
    if (state.mode !== MODES.TOGGLE || !state.userIntentOpen) return;
    closeToggleMenu('escape');
    toggle.focus();
  };

  let measureRaf = 0;
  let measureRafSettled = 0;
  const scheduleMeasuredSync = (source = 'layout') => {
    if (measureRaf || measureRafSettled) return;
    measureRaf = window.requestAnimationFrame(() => {
      measureRaf = 0;
      measureRafSettled = window.requestAnimationFrame(() => {
        measureRafSettled = 0;
        syncScrollState(header, state);
        syncDisclosure(header, nav, navList, toggle, state, source);
        syncUtilityRow(utilityRow);
      });
    });
  };

  const handleResize = () => {
    syncDeviceContext(state);
    syncScrollState(header, state);
    syncDisclosure(header, nav, navList, toggle, state, 'resize');
    scheduleMeasuredSync('resize-layout');
  };

  const handleScroll = () => {
    if (state.scrollRaf) return;
    state.scrollRaf = window.requestAnimationFrame(() => {
      state.scrollRaf = 0;
      syncScrollState(header, state);
    });
  };

  const handleHashChange = () => {
    closeToggleMenu('hash');
  };

  const handleSettingsChanged = () => {
    syncScrollState(header, state);
    syncDisclosure(header, nav, navList, toggle, state, 'settings');
    syncUtilityRow(utilityRow);
  };

  const handleTraceChange = () => {
    syncScrollState(header, state);
    syncShellOffset(header);
    syncUtilityRow(utilityRow);
  };

  const handleLoad = () => {
    scheduleMeasuredSync('load-layout');
  };

  // 2026-08-12: dropped 8 branches (reveal-tuners, cycle-explore-posture,
  // cycle-resonance, cycle-theme-pack, cycle-color-tuner, clear-matte,
  // toggle-cauldron-visibility, open-satchel) alongside the matching buttons
  // removed from utility-row.js. Three of them (explore-posture, theme-pack,
  // color-tuner) referenced EXPLORE_POSTURE_CYCLE/THEME_PACK_CYCLE/
  // COLOR_TUNER_CYCLE — never defined or imported anywhere in this file, so
  // every click threw a silent ReferenceError inside this handler. State
  // satchel is the state-inspector launch button, already directly reachable
  // in floating chrome; cauldron visibility and clear-contrast belong on
  // /settings/, not a header shortcut. See cascade-audit artifact, Part Five.
  const handleUtilityClick = (event) => {
    const control = event.target.closest('[data-spw-shell-action]');
    if (!(control instanceof HTMLElement)) return;

    const action = control.dataset.spwShellAction || '';

    if (action === 'color-light' || action === 'color-dark') {
      // Delegated to central data-site-setting-set wiring (see bindStandaloneSettingTriggers + applySettingTrigger).
      // The settings:changed event (and our listener) will cause syncUtilityRow to update pressed states etc.
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (action === 'path-toggle') {
      document.querySelector('.spw-spell-path-toggle')?.click();
      syncUtilityRow(utilityRow);
      return;
    }

    if (action === 'font-down' || action === 'font-up') {
      const nextScale = getNextFontScale(action === 'font-up' ? 1 : -1);
      if (!nextScale || nextScale === getCurrentFontScale()) return;
      // Delegate to canonical kernel setter (saveSiteSettings path: validate, normalize,
      // storage, apply datasets/styles, deviations, bus 'settings:changed').
      if (window.spwSettings?.setFontSizeScale) {
        window.spwSettings.setFontSizeScale(nextScale);
      } else {
        window.spwSettings?.save?.({ fontSizeScale: nextScale });
      }
      syncUtilityRow(utilityRow);
    }
  };

  const handleToolsSummaryClick = (event) => {
    if (!(utilityDisclosure instanceof HTMLDetailsElement)) return;
    const summary = event.target?.closest?.('.spw-shell-tools-summary');
    if (!(summary instanceof HTMLElement) || !utilityDisclosure.contains(summary)) return;

    event.preventDefault();
    event.stopPropagation();
    setToolsDisclosureOpen(utilityDisclosure, !utilityDisclosure.open);
    syncShellOffset(header);
    if (state.snapshot) syncShellChromeLayout(header, state.snapshot);
  };

  const handleToolsSummaryKeydown = (event) => {
    if (!(utilityDisclosure instanceof HTMLDetailsElement)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    event.stopPropagation();
    setToolsDisclosureOpen(utilityDisclosure, !utilityDisclosure.open);
    syncShellOffset(header);
    if (state.snapshot) syncShellChromeLayout(header, state.snapshot);
  };

  const handleMenuIntent = (event) => {
    const detail = event.detail || {};
    const source = detail.source || 'intent';

    switch (detail.intent) {
      case 'toggle': {
        if (state.mode === MODES.TOGGLE) {
          state.userIntentOpen = !state.userIntentOpen;
          const snapshot = applyMenuState(header, nav, navList, toggle, state, state.userIntentOpen, source);
          if (detail.focusToggle) toggle.focus();
          dispatchActionForSnapshot(snapshot);
        } else if (detail.focusNav) {
          nav.querySelector('a[href]')?.focus();
        }
        break;
      }
      case 'open':
        openToggleMenu(source);
        if (detail.focusToggle) toggle.focus();
        else if (detail.focusNav) window.requestAnimationFrame(() => focusFirstMenuTarget(nav));
        break;
      case 'close':
      case 'settle':
        closeToggleMenu(detail.intent === 'settle' ? 'intent-settle' : source);
        if (detail.focusToggle) toggle.focus();
        break;
      case 'focus':
        if (state.mode === MODES.TOGGLE) {
          toggle.focus();
          if (detail.open !== false) {
            openToggleMenu(source);
            if (detail.focusNav !== false) {
              window.requestAnimationFrame(() => focusFirstMenuTarget(nav));
            }
          }
        } else {
          nav.querySelector('a[href]')?.focus();
        }
        break;
      default:
        break;
    }
  };

  const navObserver = new MutationObserver(() => {
    syncDisclosure(header, nav, navList, toggle, state, 'structure');
    scheduleMeasuredSync('structure-layout');
  });

  toggle.addEventListener('click', handleToggle);
  toggle.addEventListener('pointerdown', handleTogglePointerDown);
  toggle.addEventListener('pointerup', handleTogglePointerUp);
  toggle.addEventListener('keydown', handleToggleKeydown);
  header.addEventListener('pointerenter', handlePointerEnter);
  header.addEventListener('pointermove', handlePointerMove);
  header.addEventListener('pointerleave', handlePointerLeave);
  header.addEventListener('click', handleDelegatedToggleClick);
  attentionPill?.addEventListener('click', handleAttentionPillClick);
  attentionPill?.addEventListener('keydown', handleAttentionPillKeydown);
  attentionPanel?.addEventListener('click', handleAttentionPanelClick);
  header.addEventListener('focusin', handleFocusIn);
  header.addEventListener('focusout', handleFocusOut);
  nav.addEventListener('click', handleNavClick);
  utilityRow.addEventListener('click', handleUtilityClick);
  utilitySummary?.addEventListener('click', handleToolsSummaryClick, true);
  utilitySummary?.addEventListener('keydown', handleToolsSummaryKeydown, true);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);
  document.addEventListener(EVENT_NAMES.INTENT, handleMenuIntent);
  document.addEventListener(EVENT_NAMES.TRACE, handleTraceChange);
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize);
  window.addEventListener('load', handleLoad, { once: true });
  window.addEventListener('hashchange', handleHashChange);
  // Listen to both canonical (from bus dispatch) and legacy for robust settings wiring.
  document.addEventListener('spw:settings:changed', handleSettingsChanged);
  document.addEventListener('spw:settings-change', handleSettingsChanged);
  document.addEventListener('spw:frame-change', handleSettingsChanged);
  const handleTuningSurfacesUpdated = () => syncUtilityRow(utilityRow);
  document.addEventListener(TUNING_SURFACES_EVENT, handleTuningSurfacesUpdated);
  navObserver.observe(navList, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  syncDisclosure(header, nav, navList, toggle, state, 'init');
  syncUtilityRow(utilityRow);
  scheduleMeasuredSync(document.readyState === 'complete' ? 'complete-layout' : 'init-layout');

  return {
    cleanup() {
      toggle.removeEventListener('click', handleToggle);
      toggle.removeEventListener('pointerdown', handleTogglePointerDown);
      toggle.removeEventListener('pointerup', handleTogglePointerUp);
      toggle.removeEventListener('keydown', handleToggleKeydown);
      header.removeEventListener('pointerenter', handlePointerEnter);
      header.removeEventListener('pointermove', handlePointerMove);
      header.removeEventListener('pointerleave', handlePointerLeave);
      header.removeEventListener('click', handleDelegatedToggleClick);
      attentionPill?.removeEventListener('click', handleAttentionPillClick);
      attentionPill?.removeEventListener('keydown', handleAttentionPillKeydown);
      attentionPanel?.removeEventListener('click', handleAttentionPanelClick);
      header.removeEventListener('focusin', handleFocusIn);
      header.removeEventListener('focusout', handleFocusOut);
      nav.removeEventListener('click', handleNavClick);
      utilityRow.removeEventListener('click', handleUtilityClick);
      utilitySummary?.removeEventListener('click', handleToolsSummaryClick, true);
      utilitySummary?.removeEventListener('keydown', handleToolsSummaryKeydown, true);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeydown);
      document.removeEventListener(EVENT_NAMES.INTENT, handleMenuIntent);
      document.removeEventListener(EVENT_NAMES.TRACE, handleTraceChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('spw:settings:changed', handleSettingsChanged);
      document.removeEventListener('spw:settings-change', handleSettingsChanged);
      document.removeEventListener(TUNING_SURFACES_EVENT, handleTuningSurfacesUpdated);
      document.removeEventListener('spw:frame-change', handleSettingsChanged);
      navObserver.disconnect();
      clearSettleTimer(state);
      if (state.scrollRaf) {
        window.cancelAnimationFrame(state.scrollRaf);
        state.scrollRaf = 0;
      }
      if (measureRaf) {
        window.cancelAnimationFrame(measureRaf);
        measureRaf = 0;
      }
      if (measureRafSettled) {
        window.cancelAnimationFrame(measureRafSettled);
        measureRafSettled = 0;
      }
      removeDatasetValues(header, [
        'spwShellDisclosureInit',
        'spwShellScroll',
        'spwShellScrollDirection',
        'spwShellPointer',
      ]);
      header.classList.remove('is-scrolled');
      removeDatasetValues(header, MENU_DATASET_KEYS);
      removeDatasetValues(nav, MENU_DATASET_KEYS);
      removeDatasetValues(toggle, MENU_DATASET_KEYS);
      removeDatasetValues(document.documentElement, ['spwShellMenuLock']);
      removeDatasetValues(document.body, ['spwShellMenuLock']);
      releaseShellLock();
      document.documentElement.style.removeProperty('--spw-shell-menu-offset');
    },
    refresh(nextOptions = {}) {
      state.config = { ...state.config, ...nextOptions };
      syncScrollState(header, state);
      syncDisclosure(header, nav, navList, toggle, state, 'refresh');
      scheduleMeasuredSync('refresh-layout');
    },
  };
}
