import {
  emitSpwAction,
  matchesMaxWidth,
  getPageSurface
} from './spw-shared.js';

const MOBILE_BREAKPOINT_PX = 720;
const DISCLOSURE_STORAGE_KEY = 'spw-shell-disclosure-memory';

const PHASES = Object.freeze({
  RESTING: 'resting',
  WARMING: 'warming',
  OPEN: 'open',
  SETTLING: 'settling'
});

const DEFAULTS = Object.freeze({
  mobileBreakpointPx: MOBILE_BREAKPOINT_PX,
  warmDurationMs: 140,
  settleDurationMs: 220,
  hoverIntentMs: 70,
  memoryTtlMs: 1000 * 60 * 20,
  openPressure: 0.72,
  warmPressure: 0.36,
  closePressure: 0.18
});

const SURFACE_BIAS = Object.freeze({
  settings: 0.2,
  blog: 0.1,
  about: 0.08,
  plans: 0.12,
  contact: 0.04,
  services: 0.16,
  play: 0,
  default: 0.06
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const isMobileShell = (breakpoint = MOBILE_BREAKPOINT_PX) => matchesMaxWidth(breakpoint);

function now() {
  return Date.now();
}

function readDisclosureMemory() {
  try {
    const raw = localStorage.getItem(DISCLOSURE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDisclosureMemory(payload) {
  try {
    localStorage.setItem(DISCLOSURE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* non-fatal */
  }
}

function getSurfaceBias() {
  const surface = getPageSurface?.() || document.body?.dataset?.spwSurface || 'default';
  return SURFACE_BIAS[surface] ?? SURFACE_BIAS.default;
}

function getNavigatorBias() {
  const navigatorMode = document.documentElement.dataset.spwNavigator || 'quiet';
  if (navigatorMode === 'full') return 0.22;
  if (navigatorMode === 'hidden') return -0.28;
  return 0;
}

function getAccessibilityBias() {
  const reduceMotion = document.documentElement.dataset.spwReduceMotion === 'on';
  const highContrast = document.documentElement.dataset.spwHighContrast === 'on';
  return (reduceMotion ? -0.06 : 0) + (highContrast ? 0.08 : 0);
}

function createState(config) {
  return {
    phase: PHASES.RESTING,
    pressure: 0,
    userIntentOpen: false,
    pointerInsideHeader: false,
    focusInsideHeader: false,
    hoverTimer: 0,
    settleTimer: 0,
    warmTimer: 0,
    memory: readDisclosureMemory(),
    config
  };
}

function computeBasePressure(state) {
  let pressure = 0;

  pressure += getSurfaceBias();
  pressure += getNavigatorBias();
  pressure += getAccessibilityBias();

  if (state.userIntentOpen) pressure += 0.62;
  if (state.pointerInsideHeader) pressure += 0.16;
  if (state.focusInsideHeader) pressure += 0.34;

  const memory = state.memory;
  if (memory?.open && typeof memory.at === 'number') {
    const age = now() - memory.at;
    if (age < state.config.memoryTtlMs) {
      pressure += 0.12;
    }
  }

  return clamp(pressure, 0, 1);
}

function setCssHormoneState(header, state) {
  header.dataset.spwMenuPhase = state.phase;
  header.dataset.spwMenuHormone = String(Math.round(state.pressure * 100));
  header.style.setProperty('--shell-disclosure-pressure', state.pressure.toFixed(3));
}

function applyMenuState(header, nav, toggle, state, open, source = 'system') {
  const nextPhase = open
    ? (state.phase === PHASES.WARMING ? PHASES.WARMING : PHASES.OPEN)
    : (state.phase === PHASES.SETTLING ? PHASES.SETTLING : PHASES.RESTING);

  header.dataset.spwMenu = open ? 'open' : 'closed';
  header.dataset.spwMenuSource = source;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  nav.hidden = isMobileShell(state.config.mobileBreakpointPx) ? !open : false;

  state.phase = nextPhase;
  setCssHormoneState(header, state);

  if (source === 'user') {
    emitSpwAction(
      open ? '@shell.open' : '@shell.close',
      open ? 'Navigation links expanded.' : 'Navigation links collapsed.'
    );
  }
}

function clearTimers(state) {
  window.clearTimeout(state.hoverTimer);
  window.clearTimeout(state.settleTimer);
  window.clearTimeout(state.warmTimer);
  state.hoverTimer = 0;
  state.settleTimer = 0;
  state.warmTimer = 0;
}

function persistState(state, isOpen) {
  state.memory = {
    open: Boolean(isOpen),
    at: now()
  };
  writeDisclosureMemory(state.memory);
}

function syncDisclosure(header, nav, toggle, state, source = 'sync') {
  const mobile = isMobileShell(state.config.mobileBreakpointPx);
  state.pressure = computeBasePressure(state);

  if (!mobile) {
    state.phase = PHASES.OPEN;
    applyMenuState(header, nav, toggle, state, true, source);
    return;
  }

  if (state.pressure >= state.config.openPressure) {
    state.phase = PHASES.OPEN;
    applyMenuState(header, nav, toggle, state, true, source);
    return;
  }

  if (state.pressure >= state.config.warmPressure) {
    state.phase = PHASES.WARMING;
    setCssHormoneState(header, state);

    if (header.dataset.spwMenu !== 'open') {
      window.clearTimeout(state.warmTimer);
      state.warmTimer = window.setTimeout(() => {
        if (computeBasePressure(state) >= state.config.openPressure - 0.08) {
          state.phase = PHASES.OPEN;
          applyMenuState(header, nav, toggle, state, true, 'hormone');
        } else {
          state.phase = PHASES.WARMING;
          setCssHormoneState(header, state);
        }
      }, state.config.warmDurationMs);
    }
    return;
  }

  if (header.dataset.spwMenu === 'open' && state.pressure > state.config.closePressure) {
    state.phase = PHASES.SETTLING;
    setCssHormoneState(header, state);

    window.clearTimeout(state.settleTimer);
    state.settleTimer = window.setTimeout(() => {
      if (computeBasePressure(state) <= state.config.closePressure) {
        state.phase = PHASES.RESTING;
        applyMenuState(header, nav, toggle, state, false, 'hormone');
      } else {
        syncDisclosure(header, nav, toggle, state, 'rebound');
      }
    }, state.config.settleDurationMs);
    return;
  }

  state.phase = PHASES.RESTING;
  applyMenuState(header, nav, toggle, state, false, source);
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
  header.dataset.spwMenuPhase = PHASES.RESTING;
  header.dataset.spwMenuSource = 'init';
  header.dataset.spwShellHormone = 'on';
  setCssHormoneState(header, state);

  const handleToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();

    state.userIntentOpen = header.dataset.spwMenu !== 'open';
    state.phase = state.userIntentOpen ? PHASES.OPEN : PHASES.SETTLING;
    persistState(state, state.userIntentOpen);
    syncDisclosure(header, nav, toggle, state, 'user');
  };

  const handleTogglePointerDown = (event) => {
    event.stopPropagation();
  };

  const handlePointerEnter = () => {
    state.pointerInsideHeader = true;
    window.clearTimeout(state.hoverTimer);
    state.hoverTimer = window.setTimeout(() => {
      syncDisclosure(header, nav, toggle, state, 'hover');
    }, state.config.hoverIntentMs);
  };

  const handlePointerLeave = () => {
    state.pointerInsideHeader = false;
    syncDisclosure(header, nav, toggle, state, 'leave');
  };

  const handleFocusIn = () => {
    state.focusInsideHeader = true;
    syncDisclosure(header, nav, toggle, state, 'focus');
  };

  const handleFocusOut = () => {
    const active = document.activeElement;
    state.focusInsideHeader = !!active && header.contains(active);
    syncDisclosure(header, nav, toggle, state, 'blur');
  };

  const handleNavClick = (event) => {
    const link = event.target.closest('a[href]');
    if (!link || !isMobileShell(state.config.mobileBreakpointPx)) return;

    state.userIntentOpen = false;
    persistState(state, false);
    syncDisclosure(header, nav, toggle, state, 'user');
  };

  const handleDocumentClick = (event) => {
    if (!isMobileShell(state.config.mobileBreakpointPx)) return;
    if (header.dataset.spwMenu !== 'open') return;
    if (header.contains(event.target)) return;

    state.userIntentOpen = false;
    persistState(state, false);
    syncDisclosure(header, nav, toggle, state, 'outside');
  };

  const handleDocumentKeydown = (event) => {
    if (event.key !== 'Escape') return;
    if (!isMobileShell(state.config.mobileBreakpointPx)) return;
    if (header.dataset.spwMenu !== 'open') return;

    state.userIntentOpen = false;
    persistState(state, false);
    syncDisclosure(header, nav, toggle, state, 'user');
    toggle.focus();
  };

  const handleResize = () => {
    syncDisclosure(header, nav, toggle, state, 'resize');
  };

  const handleHashChange = () => {
    if (!isMobileShell(state.config.mobileBreakpointPx)) return;
    state.userIntentOpen = false;
    persistState(state, false);
    syncDisclosure(header, nav, toggle, state, 'hash');
  };

  const handleSettingsChanged = () => {
    syncDisclosure(header, nav, toggle, state, 'settings');
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
  window.addEventListener('hashchange', handleHashChange);
  document.addEventListener('spw:settings-changed', handleSettingsChanged);
  document.addEventListener('spw:frame-change', handleSettingsChanged);

  syncDisclosure(header, nav, toggle, state, 'init');

  return {
    cleanup() {
      clearTimers(state);
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
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('spw:settings-changed', handleSettingsChanged);
      document.removeEventListener('spw:frame-change', handleSettingsChanged);
      delete header.dataset.spwShellDisclosureInit;
      delete header.dataset.spwShellHormone;
    },
    refresh(nextOptions = {}) {
      state.config = { ...state.config, ...nextOptions };
      syncDisclosure(header, nav, toggle, state, 'refresh');
    }
  };
}