import { emitSpwAction } from './spw-shared.js';

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

const DEFAULTS = Object.freeze({
  narrowBreakpointPx: 720,
  midBreakpointPx: 980,
  compressedRatio: 1.08,
  scrollLiftPx: 18,
  scrollDeepPx: 132,
  scrollDirectionDeadzonePx: 4,
});

const FONT_SCALE_STEPS = Object.freeze(['80', '90', '100', '110', '120']);
const COLOR_MODE_STEPS = Object.freeze(['auto', 'dark', 'light']);
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
    lastTransitionSource: 'init',
    snapshot: null,
  };
}

function computeNavRatio(header, nav, navList) {
  const navWidth = nav.clientWidth || Math.max(header.clientWidth * 0.58, 1);
  if (!navWidth) return 1;
  return navList.scrollWidth / navWidth;
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
  const html = document.documentElement;
  const tier = html.dataset.spwViewportTier || getViewportTier(window.innerWidth, state.config);
  const pointer = html.dataset.spwPointerMode || getPointerMode();
  const ratio = computeNavRatio(header, nav, navList);
  const navFit = header.dataset.spwNavFit || 'roomy';

  if (tier === 'compact' || tier === 'narrow') {
    return MODES.TOGGLE;
  }

  if (tier === 'mid' && (pointer === 'coarse' || navFit === 'compressed' || ratio > state.config.compressedRatio)) {
    return MODES.TOGGLE;
  }

  return MODES.INLINE;
}

function resolveMenuPressure({ mode, ratio, navFit, tier, pointer }) {
  if (mode === MODES.TOGGLE && (tier === 'compact' || tier === 'narrow')) {
    return PRESSURES.CROWDED;
  }

  if (ratio > 1.18 || navFit === 'compressed' || (tier === 'mid' && pointer === 'coarse')) {
    return PRESSURES.COMPRESSED;
  }

  if (ratio > 1.02 || navFit === 'tight') {
    return PRESSURES.TIGHT;
  }

  return PRESSURES.CALM;
}

function resolveMenuTopology(mode, pressure, tier) {
  if (mode === MODES.INLINE) return TOPOLOGIES.INLINE_RIBBON;
  if (tier === 'compact' || tier === 'narrow') return TOPOLOGIES.SCREEN_FIELD;
  if (pressure === PRESSURES.CROWDED) return TOPOLOGIES.DRAWER_FIELD;
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
  const ratio = computeNavRatio(header, nav, navList);
  const primaryRouteCount = countPrimaryRoutes(navList);
  const overflowRouteCount = countOverflowRoutes(navList);
  const pressure = resolveMenuPressure({
    mode: state.mode,
    ratio,
    navFit,
    tier,
    pointer,
  });
  const topology = resolveMenuTopology(state.mode, pressure, tier);
  const phase = resolveMenuPhase(state, open, source);
  const intent = resolveMenuIntent({ open, phase, pressure });
  const returnPaths = describeReturnPaths(open);
  const locking = open
    && state.mode === MODES.TOGGLE
    && topology === TOPOLOGIES.SCREEN_FIELD
    && pointer !== 'coarse'
    ? 'locked'
    : 'permeable';

  return {
    mode: state.mode,
    state: open ? 'open' : 'closed',
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
    reversible: true,
    returnPaths,
    returnHint: open ? 'toggle, Escape, route, or hash' : 'toggle or focus',
  };
}

function writeMenuDatasets(el, snapshot, role) {
  if (!(el instanceof HTMLElement)) return;

  el.dataset.spwMenuRole = role;
  el.dataset.spwMenuMode = snapshot.mode;
  el.dataset.spwMenuChanged = snapshot.changedAxes.join(' ') || 'none';
  el.dataset.spwMenuClarity = snapshot.clarity;
  el.dataset.spwMenu = snapshot.state;
  el.dataset.spwMenuPhase = snapshot.phase;
  el.dataset.spwMenuSource = snapshot.source;
  el.dataset.spwMenuViewport = snapshot.viewportTier;
  el.dataset.spwMenuPointer = snapshot.pointerMode;
  el.dataset.spwMenuPressure = snapshot.pressure;
  el.dataset.spwMenuTopology = snapshot.topology;
  el.dataset.spwMenuIntent = snapshot.intent;
  el.dataset.spwMenuNavFit = snapshot.navFit;
  el.dataset.spwMenuRouteCount = String(snapshot.totalRouteCount);
  el.dataset.spwMenuOverflowCount = String(snapshot.overflowRouteCount);
  el.dataset.spwMenuLocking = snapshot.locking;
  el.dataset.spwMenuReversible = snapshot.reversible ? 'true' : 'false';
  el.dataset.spwMenuReturnPaths = snapshot.returnPaths.join(' ');
}

function writeScrollDatasets(header, state) {
  if (!(header instanceof HTMLElement)) return;
  header.dataset.spwShellScroll = state.scrollBand;
  header.dataset.spwShellScrollDirection = state.scrollDirection;
  header.classList.toggle('is-scrolled', state.scrollBand !== SCROLL_BANDS.TOP);
  syncShellOffset(header);
}

function syncShellOffset(header) {
  if (!(header instanceof HTMLElement)) return;
  const offset = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
  document.documentElement.style.setProperty('--spw-shell-menu-offset', `${offset}px`);
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
  header.dataset.spwShellPointer = 'tracking';
  header.dataset.spwShellMicrointeraction ||= 'pointer-field';
}

function clearHeaderPointerField(header) {
  if (!(header instanceof HTMLElement)) return;
  header.style.removeProperty('--spw-shell-pointer-x');
  header.style.removeProperty('--spw-shell-pointer-y');
  delete header.dataset.spwShellPointer;
}

function syncShellLock(snapshot) {
  const shouldLock = snapshot.locking === 'locked';

  [document.documentElement, document.body].forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (shouldLock) node.dataset.spwShellMenuLock = 'true';
    else delete node.dataset.spwShellMenuLock;
  });
}

function getCurrentFontScale() {
  const current = window.spwSettings?.get?.()?.fontSizeScale
    || document.documentElement.dataset.spwFontSizeScale
    || '100';
  return FONT_SCALE_STEPS.includes(String(current)) ? String(current) : '100';
}

function getCurrentColorMode() {
  const current = window.spwSettings?.get?.()?.colorMode
    || document.documentElement.dataset.spwColorMode
    || 'auto';
  return COLOR_MODE_STEPS.includes(String(current)) ? String(current) : 'auto';
}

function getNextFontScale(direction = 1) {
  const current = getCurrentFontScale();
  const index = Math.max(0, FONT_SCALE_STEPS.indexOf(current));
  const nextIndex = Math.min(FONT_SCALE_STEPS.length - 1, Math.max(0, index + direction));
  return FONT_SCALE_STEPS[nextIndex];
}

function ensureUtilityRow(header) {
  let row = header.querySelector('.spw-shell-utility-row');
  if (row instanceof HTMLElement) return row;

  row = document.createElement('div');
  row.className = 'spw-shell-utility-row';
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', 'Quick reading and display controls');
  row.innerHTML = `
    <button type="button" class="spw-shell-utility-button" data-spw-shell-action="color-light" aria-label="Use light mode" title="Light mode">L</button>
    <button type="button" class="spw-shell-utility-button" data-spw-shell-action="color-dark" aria-label="Use dark mode" title="Dark mode">D</button>
    <button type="button" class="spw-shell-utility-button" data-spw-shell-action="font-down" aria-label="Decrease font size">A-</button>
    <button type="button" class="spw-shell-utility-button" data-spw-shell-action="path-toggle" aria-label="Toggle cognitive path">PATH</button>
    <button type="button" class="spw-shell-utility-button" data-spw-shell-action="font-up" aria-label="Increase font size">A+</button>
    <a class="spw-shell-utility-button" data-spw-shell-action="settings" href="/settings/#appearance-settings" aria-label="Open appearance and typography settings">Aa</a>
  `;

  const trace = header.querySelector('.spw-header-trace');
  header.insertBefore(row, trace || header.querySelector('nav') || null);
  return row;
}

function syncUtilityRow(row) {
  if (!(row instanceof HTMLElement)) return;

  const current = getCurrentFontScale();
  const currentColorMode = getCurrentColorMode();
  const min = FONT_SCALE_STEPS[0];
  const max = FONT_SCALE_STEPS[FONT_SCALE_STEPS.length - 1];
  const pathToggle = document.querySelector('.spw-spell-path-toggle');

  row.dataset.spwFontScale = current;
  row.dataset.spwColorMode = currentColorMode;
  row.dataset.spwPathAvailable = pathToggle ? 'true' : 'false';

  row.querySelectorAll('[data-spw-shell-action="color-light"]').forEach((button) => {
    button.setAttribute('aria-pressed', currentColorMode === 'light' ? 'true' : 'false');
    button.title = currentColorMode === 'light' ? 'Light mode active' : 'Use light mode';
  });

  row.querySelectorAll('[data-spw-shell-action="color-dark"]').forEach((button) => {
    button.setAttribute('aria-pressed', currentColorMode === 'dark' ? 'true' : 'false');
    button.title = currentColorMode === 'dark' ? 'Dark mode active' : 'Use dark mode';
  });

  row.querySelectorAll('[data-spw-shell-action="font-down"]').forEach((button) => {
    button.toggleAttribute('disabled', current === min);
    button.setAttribute('aria-disabled', current === min ? 'true' : 'false');
  });

  row.querySelectorAll('[data-spw-shell-action="font-up"]').forEach((button) => {
    button.toggleAttribute('disabled', current === max);
    button.setAttribute('aria-disabled', current === max ? 'true' : 'false');
  });

  row.querySelectorAll('[data-spw-shell-action="path-toggle"]').forEach((button) => {
    button.toggleAttribute('disabled', !pathToggle);
    button.setAttribute('aria-disabled', pathToggle ? 'false' : 'true');
  });
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

function describeToggleState(snapshot) {
  if (snapshot.state === 'open') return `${snapshot.topology} open`;
  if (snapshot.topology === TOPOLOGIES.SCREEN_FIELD) return 'screen routes';
  if (snapshot.pressure === PRESSURES.CALM) return 'survey routes';
  if (snapshot.pressure === PRESSURES.TIGHT) return 'tight routes';
  if (snapshot.pressure === PRESSURES.COMPRESSED) return 'condensed routes';
  return 'drawer routes';
}

function describeToggleMeta(snapshot) {
  if (snapshot.state === 'open') {
    return snapshot.topology === TOPOLOGIES.SCREEN_FIELD ? 'Esc · route · outside' : 'Esc settles';
  }
  if (snapshot.overflowRouteCount > 0) return `+${snapshot.overflowRouteCount} more`;
  return `${snapshot.totalRouteCount} routes`;
}

function buildToggleAria(snapshot) {
  const openness = snapshot.state === 'open' ? 'Collapse' : 'Open';
  return `${openness} navigation menu. ${snapshot.totalRouteCount} routes available. ${snapshot.topology}. ${snapshot.returnHint}.`;
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

function syncToggleCopy(toggle, snapshot) {
  const labelNode = toggle.querySelector('.spw-nav-toggle-label');
  const stateNode = toggle.querySelector('.spw-nav-toggle-state');
  const metaNode = toggle.querySelector('.spw-nav-toggle-meta');

  if (labelNode) {
    labelNode.textContent = snapshot.mode === MODES.TOGGLE ? 'menu' : 'routes';
  }

  if (stateNode) {
    stateNode.textContent = describeToggleState(snapshot);
  }

  if (metaNode) {
    metaNode.textContent = describeToggleMeta(snapshot);
  }

  toggle.setAttribute('aria-label', buildToggleAria(snapshot));
  toggle.title = `${snapshot.intent} · ${snapshot.returnHint}`;
}

function emitMenuState(snapshot) {
  document.dispatchEvent(new CustomEvent(EVENT_NAMES.STATE, {
    detail: snapshot,
  }));
}

function applyMenuState(header, nav, navList, toggle, state, open, source = 'system') {
  const snapshot = buildMenuSnapshot(header, nav, navList, state, open, source);
  snapshot.changedAxes = collectChangedAxes(state.snapshot, snapshot);
  snapshot.clarity = resolveMenuClarity(snapshot, snapshot.changedAxes);
  syncShellOffset(header);

  header.dataset.spwMenu = snapshot.state;
  header.dataset.spwMenuMode = snapshot.mode;
  header.dataset.spwMenuPhase = snapshot.phase;
  header.dataset.spwMenuSource = snapshot.source;

  nav.hidden = state.mode === MODES.TOGGLE ? !open : false;
  toggle.hidden = state.mode !== MODES.TOGGLE;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.setAttribute('aria-hidden', state.mode === MODES.TOGGLE ? 'false' : 'true');
  toggle.setAttribute('aria-pressed', open ? 'true' : 'false');

  writeMenuDatasets(header, snapshot, 'header');
  writeMenuDatasets(nav, snapshot, 'nav');
  writeMenuDatasets(toggle, snapshot, 'toggle');
  syncToggleCopy(toggle, snapshot);
  syncShellLock(snapshot);

  state.lastTransitionSource = source;
  state.snapshot = snapshot;
  emitMenuState(snapshot);
  return snapshot;
}

function syncDisclosure(header, nav, navList, toggle, state, source = 'sync') {
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

  header.dataset.spwShellDisclosureInit = 'true';
  nav.id ||= 'spw-shell-nav';

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
        <span class="spw-nav-toggle-label">menu</span>
        <span class="spw-nav-toggle-state">survey routes</span>
      </span>
      <span class="spw-nav-toggle-meta" aria-hidden="true">routes</span>
    `;

    const sigil = header.querySelector('.header-sigil');
    if (sigil?.after) {
      sigil.after(toggle);
    } else {
      header.prepend(toggle);
    }
  }

  const utilityRow = ensureUtilityRow(header);

  const state = createState(config);
  header.dataset.spwMenu = 'closed';
  header.dataset.spwMenuMode = MODES.INLINE;
  header.dataset.spwMenuPhase = PHASES.RESTING;
  header.dataset.spwMenuSource = 'init';
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

  const handleToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (state.mode !== MODES.TOGGLE) return;

    state.userIntentOpen = !state.userIntentOpen;
    const snapshot = applyMenuState(header, nav, navList, toggle, state, state.userIntentOpen, 'user');
    dispatchActionForSnapshot(snapshot);
  };

  const handleToggleKeydown = (event) => {
    if (state.mode !== MODES.TOGGLE) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!state.userIntentOpen) openToggleMenu('toggle-key');
      window.requestAnimationFrame(() => {
        focusFirstMenuTarget(nav);
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
    closeToggleMenu('route');
  };

  const handleDocumentClick = (event) => {
    if (state.mode !== MODES.TOGGLE) return;
    if (!state.userIntentOpen) return;
    if (header.contains(event.target)) return;
    closeToggleMenu('outside');
  };

  const handleDocumentKeydown = (event) => {
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

  const handleResize = () => {
    syncScrollState(header, state);
    syncDisclosure(header, nav, navList, toggle, state, 'resize');
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
    syncDisclosure(header, nav, navList, toggle, state, 'trace');
    syncUtilityRow(utilityRow);
  };

  const handleUtilityClick = (event) => {
    const control = event.target.closest('[data-spw-shell-action]');
    if (!(control instanceof HTMLElement)) return;

    const action = control.dataset.spwShellAction || '';

    if (action === 'settings') return;

    event.preventDefault();
    event.stopPropagation();

    if (action === 'path-toggle') {
      document.querySelector('.spw-spell-path-toggle')?.click();
      syncUtilityRow(utilityRow);
      return;
    }

    if (action === 'color-light' || action === 'color-dark') {
      const nextMode = action === 'color-light' ? 'light' : 'dark';
      if (nextMode === getCurrentColorMode()) return;
      window.spwSettings?.save?.({ colorMode: nextMode });
      syncUtilityRow(utilityRow);
      return;
    }

    if (action === 'font-down' || action === 'font-up') {
      const nextScale = getNextFontScale(action === 'font-up' ? 1 : -1);
      if (!nextScale || nextScale === getCurrentFontScale()) return;
      window.spwSettings?.save?.({ fontSizeScale: nextScale });
      syncUtilityRow(utilityRow);
    }
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
  });

  toggle.addEventListener('click', handleToggle);
  toggle.addEventListener('pointerdown', handleTogglePointerDown);
  toggle.addEventListener('keydown', handleToggleKeydown);
  header.addEventListener('pointerenter', handlePointerEnter);
  header.addEventListener('pointermove', handlePointerMove);
  header.addEventListener('pointerleave', handlePointerLeave);
  header.addEventListener('focusin', handleFocusIn);
  header.addEventListener('focusout', handleFocusOut);
  nav.addEventListener('click', handleNavClick);
  utilityRow.addEventListener('click', handleUtilityClick);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);
  document.addEventListener(EVENT_NAMES.INTENT, handleMenuIntent);
  document.addEventListener(EVENT_NAMES.TRACE, handleTraceChange);
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize);
  window.addEventListener('hashchange', handleHashChange);
  document.addEventListener('spw:settings-changed', handleSettingsChanged);
  document.addEventListener('spw:frame-change', handleSettingsChanged);
  navObserver.observe(navList, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  syncDisclosure(header, nav, navList, toggle, state, 'init');
  syncUtilityRow(utilityRow);

  return {
    cleanup() {
      toggle.removeEventListener('click', handleToggle);
      toggle.removeEventListener('pointerdown', handleTogglePointerDown);
      toggle.removeEventListener('keydown', handleToggleKeydown);
      header.removeEventListener('pointerenter', handlePointerEnter);
      header.removeEventListener('pointermove', handlePointerMove);
      header.removeEventListener('pointerleave', handlePointerLeave);
      header.removeEventListener('focusin', handleFocusIn);
      header.removeEventListener('focusout', handleFocusOut);
      nav.removeEventListener('click', handleNavClick);
      utilityRow.removeEventListener('click', handleUtilityClick);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeydown);
      document.removeEventListener(EVENT_NAMES.INTENT, handleMenuIntent);
      document.removeEventListener(EVENT_NAMES.TRACE, handleTraceChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('spw:settings-changed', handleSettingsChanged);
      document.removeEventListener('spw:frame-change', handleSettingsChanged);
      navObserver.disconnect();
      if (state.scrollRaf) {
        window.cancelAnimationFrame(state.scrollRaf);
        state.scrollRaf = 0;
      }
      delete header.dataset.spwShellDisclosureInit;
      delete header.dataset.spwShellScroll;
      delete header.dataset.spwShellScrollDirection;
      header.classList.remove('is-scrolled');
      delete header.dataset.spwMenu;
      delete header.dataset.spwMenuChanged;
      delete header.dataset.spwMenuClarity;
      delete header.dataset.spwMenuIntent;
      delete header.dataset.spwMenuPhase;
      delete header.dataset.spwMenuPointer;
      delete header.dataset.spwMenuPressure;
      delete header.dataset.spwMenuMode;
      delete header.dataset.spwMenuLocking;
      delete header.dataset.spwMenuNavFit;
      delete header.dataset.spwMenuOverflowCount;
      delete header.dataset.spwMenuReturnPaths;
      delete header.dataset.spwMenuReversible;
      delete header.dataset.spwMenuRole;
      delete header.dataset.spwMenuRouteCount;
      delete header.dataset.spwMenuSource;
      delete header.dataset.spwMenuTopology;
      delete header.dataset.spwMenuViewport;
      delete document.documentElement.dataset.spwShellMenuLock;
      delete document.body.dataset.spwShellMenuLock;
      document.documentElement.style.removeProperty('--spw-shell-menu-offset');
    },
    refresh(nextOptions = {}) {
      state.config = { ...state.config, ...nextOptions };
      syncScrollState(header, state);
      syncDisclosure(header, nav, navList, toggle, state, 'refresh');
    },
  };
}
