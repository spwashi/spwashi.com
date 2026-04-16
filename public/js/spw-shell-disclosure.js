import { emitSpwAction } from './spw-shared.js';

const MODES = Object.freeze({
  INLINE: 'inline',
  TOGGLE: 'toggle'
});

const PHASES = Object.freeze({
  RESTING: 'resting',
  APPROACH: 'approach',
  CONTACT: 'contact',
  PROJECTING: 'projecting'
});

const DEFAULTS = Object.freeze({
  narrowBreakpointPx: 720,
  midBreakpointPx: 980,
  compressedRatio: 1.08
});

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

function createState(config) {
  return {
    config,
    mode: MODES.INLINE,
    pointerMode: getPointerMode(),
    userIntentOpen: false,
    pointerInsideHeader: false,
    focusInsideHeader: false
  };
}

function computeNavRatio(header, nav, navList) {
  const navWidth = nav.clientWidth || Math.max(header.clientWidth * 0.58, 1);
  if (!navWidth) return 1;
  return navList.scrollWidth / navWidth;
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

function resolveMenuPhase(state, open) {
  if (state.mode === MODES.TOGGLE && open) return PHASES.PROJECTING;
  if (state.focusInsideHeader) return PHASES.CONTACT;
  if (state.pointerInsideHeader && state.pointerMode === 'fine') return PHASES.APPROACH;
  return PHASES.RESTING;
}

function applyMenuState(header, nav, toggle, state, open, source = 'system') {
  header.dataset.spwMenuMode = state.mode;
  header.dataset.spwMenu = open ? 'open' : 'closed';
  header.dataset.spwMenuSource = source;
  header.dataset.spwMenuPhase = resolveMenuPhase(state, open);

  nav.hidden = state.mode === MODES.TOGGLE ? !open : false;
  toggle.hidden = state.mode !== MODES.TOGGLE;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.setAttribute('aria-hidden', state.mode === MODES.TOGGLE ? 'false' : 'true');
}

function syncDisclosure(header, nav, navList, toggle, state, source = 'sync') {
  state.pointerMode = getPointerMode();
  const previousMode = state.mode;
  state.mode = resolveMenuMode(header, nav, navList, state);

  if (previousMode === MODES.INLINE && state.mode === MODES.TOGGLE) {
    state.userIntentOpen = false;
  }

  if (state.mode === MODES.INLINE) {
    applyMenuState(header, nav, toggle, state, true, source);
    return;
  }

  applyMenuState(header, nav, toggle, state, state.userIntentOpen, source);
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
      <span class="spw-nav-toggle-label">menu</span>
    `;

    const sigil = header.querySelector('.header-sigil');
    if (sigil?.after) {
      sigil.after(toggle);
    } else {
      header.prepend(toggle);
    }
  }

  const state = createState(config);
  header.dataset.spwMenu = 'closed';
  header.dataset.spwMenuMode = MODES.INLINE;
  header.dataset.spwMenuPhase = PHASES.RESTING;
  header.dataset.spwMenuSource = 'init';

  const handleToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (state.mode !== MODES.TOGGLE) return;

    state.userIntentOpen = !state.userIntentOpen;
    syncDisclosure(header, nav, navList, toggle, state, 'user');

    emitSpwAction(
      state.userIntentOpen ? '@shell.open' : '@shell.close',
      state.userIntentOpen ? 'Navigation links expanded.' : 'Navigation links collapsed.'
    );
  };

  const handleTogglePointerDown = (event) => {
    event.stopPropagation();
  };

  const handlePointerEnter = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    state.pointerInsideHeader = true;
    syncDisclosure(header, nav, navList, toggle, state, 'pointer');
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    state.pointerInsideHeader = false;
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

  const closeToggleMenu = (source = 'system') => {
    if (state.mode !== MODES.TOGGLE || !state.userIntentOpen) return;
    state.userIntentOpen = false;
    syncDisclosure(header, nav, navList, toggle, state, source);
  };

  const handleNavClick = (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    closeToggleMenu('user');
  };

  const handleDocumentClick = (event) => {
    if (state.mode !== MODES.TOGGLE) return;
    if (!state.userIntentOpen) return;
    if (header.contains(event.target)) return;
    closeToggleMenu('outside');
  };

  const handleDocumentKeydown = (event) => {
    if (event.key !== 'Escape') return;
    if (state.mode !== MODES.TOGGLE || !state.userIntentOpen) return;
    closeToggleMenu('user');
    toggle.focus();
  };

  const handleResize = () => {
    syncDisclosure(header, nav, navList, toggle, state, 'resize');
  };

  const handleHashChange = () => {
    closeToggleMenu('hash');
  };

  const handleSettingsChanged = () => {
    syncDisclosure(header, nav, navList, toggle, state, 'settings');
  };

  toggle.addEventListener('click', handleToggle);
  toggle.addEventListener('pointerdown', handleTogglePointerDown);
  header.addEventListener('pointerenter', handlePointerEnter);
  header.addEventListener('pointerleave', handlePointerLeave);
  header.addEventListener('focusin', handleFocusIn);
  header.addEventListener('focusout', handleFocusOut);
  nav.addEventListener('click', handleNavClick);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize);
  window.addEventListener('hashchange', handleHashChange);
  document.addEventListener('spw:settings-changed', handleSettingsChanged);
  document.addEventListener('spw:frame-change', handleSettingsChanged);

  syncDisclosure(header, nav, navList, toggle, state, 'init');

  return {
    cleanup() {
      toggle.removeEventListener('click', handleToggle);
      toggle.removeEventListener('pointerdown', handleTogglePointerDown);
      header.removeEventListener('pointerenter', handlePointerEnter);
      header.removeEventListener('pointerleave', handlePointerLeave);
      header.removeEventListener('focusin', handleFocusIn);
      header.removeEventListener('focusout', handleFocusOut);
      nav.removeEventListener('click', handleNavClick);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeydown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('spw:settings-changed', handleSettingsChanged);
      document.removeEventListener('spw:frame-change', handleSettingsChanged);
      delete header.dataset.spwShellDisclosureInit;
      delete header.dataset.spwMenuMode;
      delete header.dataset.spwMenu;
      delete header.dataset.spwMenuPhase;
      delete header.dataset.spwMenuSource;
    },
    refresh(nextOptions = {}) {
      state.config = { ...state.config, ...nextOptions };
      syncDisclosure(header, nav, navList, toggle, state, 'refresh');
    }
  };
}
