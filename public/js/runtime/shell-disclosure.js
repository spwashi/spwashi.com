import { emitSpwAction } from '/public/js/kernel/shared.js';
import {
  removeDatasetValues,
  writeDatasetValues,
  writeDatasetValue,
  writeRuntimeDatasetValues,
} from '/public/js/kernel/dom-contracts.js';

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
  compressedRatio: 1.55,
  scrollLiftPx: 18,
  scrollDeepPx: 132,
  scrollDirectionDeadzonePx: 4,
  settlePhaseMs: 180,
});

const MENU_DATASET_KEYS = Object.freeze([
  'spwMenuRole',
  'spwMenuMode',
  'spwMenuChanged',
  'spwMenuClarity',
  'spwMenu',
  'spwMenuPhase',
  'spwMenuSource',
  'spwMenuViewport',
  'spwMenuPointer',
  'spwMenuPressure',
  'spwMenuTopology',
  'spwMenuIntent',
  'spwMenuNavFit',
  'spwMenuRouteCount',
  'spwMenuOverflowCount',
  'spwMenuLocking',
  'spwMenuReversible',
  'spwMenuReturnPaths',
]);

const FONT_SCALE_STEPS = Object.freeze(['70', '80', '90', '100', '110', '120']);
const COLOR_MODE_STEPS = Object.freeze(['auto', 'dark', 'light']);
const UTILITY_LABELS = Object.freeze({
  compact: Object.freeze({
    'color-light': 'Light',
    'color-dark': 'Dark',
    'font-down': 'Smaller',
    'path-toggle': 'Path',
    'font-up': 'Larger',
    'clear-matte': 'Clear',
    'toggle-cauldron-visibility': 'Vis',
    'open-satchel': 'Satchel',
    settings: 'Style',
  }),
  regular: Object.freeze({
    'color-light': 'Light mode',
    'color-dark': 'Dark mode',
    'font-down': 'Smaller text',
    'path-toggle': 'Reading path',
    'font-up': 'Larger text',
    'clear-matte': 'Clear contrast',
    'toggle-cauldron-visibility': 'Cauldron vis',
    'open-satchel': 'State satchel',
    settings: 'Appearance',
  }),
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
    snapshot: null,
  };
}

function computeNavRatio(header, nav, navList) {
  const navWidth = nav.clientWidth || Math.max(header.clientWidth * 0.58, 1);
  if (!navWidth) return 1;
  const listItems = Array.from(navList.querySelectorAll(':scope > li'));
  const listStyle = window.getComputedStyle(navList);
  const columnGap = Number.parseFloat(listStyle.columnGap || listStyle.gap || '0') || 0;
  const measuredItemsWidth = listItems.reduce((total, item) => {
    if (!(item instanceof HTMLElement)) return total;
    return total + item.getBoundingClientRect().width;
  }, 0) + Math.max(0, listItems.length - 1) * columnGap;
  const contentWidth = Math.max(nav.scrollWidth, navList.scrollWidth, measuredItemsWidth);
  return contentWidth / navWidth;
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
  if (tier === 'compact' || tier === 'narrow') return MODES.TOGGLE;

  const ratio = computeNavRatio(header, nav, navList);
  if (ratio > state.config.compressedRatio) return MODES.TOGGLE;

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

  writeRuntimeDatasetValues(el, {
    spwMenuRole: role,
    spwMenuMode: snapshot.mode,
    spwMenuChanged: snapshot.changedAxes.join(' ') || 'none',
    spwMenuClarity: snapshot.clarity,
    spwMenu: snapshot.state,
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
    spwMenuReversible: snapshot.reversible ? 'true' : 'false',
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

function syncShellLock(snapshot) {
  const shouldLock = snapshot.locking === 'locked';

  [document.documentElement, document.body].forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    writeRuntimeDatasetValues(node, {
      spwShellMenuLock: shouldLock ? 'true' : null,
      spwRuntimeMutator: shouldLock ? 'shell-disclosure' : null,
      spwRuntimeMutationReason: shouldLock ? 'menu-scroll-lock' : null,
      spwRuntimeStylingAxis: shouldLock ? 'scroll-lock' : null,
    }, {
      source: 'shell-disclosure',
      reason: 'menu-scroll-lock',
    });
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

function getCurrentBaseMaterial() {
  const current = window.spwSettings?.get?.()?.baseMetamaterial
    || document.documentElement.dataset.spwBaseMetamaterial
    || 'glass';
  return ['paper', 'glass', 'matte', 'field'].includes(String(current)) ? String(current) : 'glass';
}

function getCurrentHighContrast() {
  const current = window.spwSettings?.get?.()?.highContrast
    || document.documentElement.dataset.spwHighContrast
    || 'off';
  return current === 'on' ? 'on' : 'off';
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
  // Granular architecture exposure for vocabulary, component locality (settings/menus), and flexible physics reason.
  // These attrs + clusters let CSS, catalog, and interns relate the shell controls directly to data structures
  // (baseMetamaterial, highContrast, fontScale, interaction state) without taking the visuals for granted.
  // Cognitive: clusters are mostly pairs (sigil+arg as "line") or small groups (cognitive planes); "down" in vertical layout is gravitational page flow.
  // Tunable material surface for storytellers: physics-reason here affects shell "feel" (navigability) across productions.
  row.setAttribute('data-spw-locality', 'high');
  row.setAttribute('data-spw-feature', 'shell-utility-controls');
  row.setAttribute('data-spw-role', 'state-rail');
  row.setAttribute('data-spw-semantic-expression', 'rail[utility]{read.tune.inspect}');
  row.setAttribute('data-spw-module-evaluates', 'semantic-density interaction physics-reason');
  row.setAttribute('data-spw-physics-reason', 'adaptive-shell'); // flexible; can be overridden by query/design bench / settings for gamified nav feel
  // Initial material for the utility surface itself (syncUtilityRow will keep in sync with global base + local overrides).
  // This ensures the row participates in material audit (local data-spw-metamaterial on chrome for glass/matte treatment).
  const initMat = getCurrentBaseMaterial();
  row.dataset.spwMetamaterial = initMat;

  // Use templating for the utility controls UI (minds value of templating for easy modification of
  // default visual abstractions/behavior for shell settings, and customization of site appearance wiring).
  // If a <template id="spw-shell-utility-template"> exists in the document, its content is used
  // (allows pages to provide custom sigils, clusters, metaphors, or even different controls while
  // keeping the data-action and structure for JS wiring).
  // Falls back to built-in default with sigil/argument distinction + clusters.
  let template = document.getElementById('spw-shell-utility-template');
  if (!(template instanceof HTMLTemplateElement)) {
    template = document.createElement('template');
    template.id = 'spw-shell-utility-template';
    template.innerHTML = `
      <div class="spw-utility-cluster" data-spw-utility-cluster="color-mode" role="group" aria-label="Color mode" data-spw-locality="medium" data-spw-component-locality="shell-color" data-spw-physics-reason="lighting-tuner">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="color-light" data-site-setting-set="colorMode:light" aria-label="Use light mode" title="Use light mode">
          <span class="spw-utility-sigil" aria-hidden="true">☀</span>
          <span class="spw-utility-argument"></span>
        </button>
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="color-dark" data-site-setting-set="colorMode:dark" aria-label="Use dark mode" title="Use dark mode">
          <span class="spw-utility-sigil" aria-hidden="true">☾</span>
          <span class="spw-utility-argument"></span>
        </button>
      </div>
      <div class="spw-utility-cluster" data-spw-utility-cluster="material-contrast" role="group" aria-label="Material contrast" data-spw-locality="medium" data-spw-component-locality="settings-material" data-spw-physics-reason="clear-contrast-safeguard" data-spw-module-evaluates="semantic-density">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="clear-matte" aria-label="Use matte for clear contrast reading" title="Use matte surfaces for clear high-contrast text">
          <span class="spw-utility-sigil" aria-hidden="true">■</span>
          <span class="spw-utility-argument"></span>
        </button>
      </div>
      <div class="spw-utility-cluster" data-spw-utility-cluster="typography-scale" role="group" aria-label="Typography scale" data-spw-locality="medium" data-spw-component-locality="text-density" data-spw-physics-reason="readability-tuner">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="font-down" aria-label="Decrease font size" title="Decrease font size">
          <span class="spw-utility-sigil" aria-hidden="true">−A</span>
          <span class="spw-utility-argument"></span>
        </button>
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="font-up" aria-label="Increase font size" title="Increase font size">
          <span class="spw-utility-sigil" aria-hidden="true">+A</span>
          <span class="spw-utility-argument"></span>
        </button>
      </div>
      <div class="spw-utility-cluster" data-spw-utility-cluster="cognitive-path" role="group" aria-label="Cognitive path">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="path-toggle" aria-label="Toggle cognitive path" title="Toggle cognitive path">
          <span class="spw-utility-sigil" aria-hidden="true">⟐</span>
          <span class="spw-utility-argument"></span>
        </button>
      </div>
      <div class="spw-utility-cluster" data-spw-utility-cluster="appearance" role="group" aria-label="Appearance settings">
        <a class="spw-shell-utility-button" data-spw-shell-action="settings" href="/settings/#appearance-settings" aria-label="Open appearance and typography settings" title="Open appearance and typography settings">
          <span class="spw-utility-sigil" aria-hidden="true">Aa</span>
          <span class="spw-utility-argument"></span>
        </a>
      </div>
      <div class="spw-utility-cluster" data-spw-utility-cluster="cauldron-visibility" role="group" aria-label="Cauldron and spell candidate visibility" data-spw-locality="medium" data-spw-component-locality="cauldron-visual" data-spw-physics-reason="feedback-tuner" data-spw-module-evaluates="cauldron spell visibility">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="toggle-cauldron-visibility" aria-label="Cycle cauldron and spell candidate visual mode (subtle / balanced / prominent)" title="Cycle visibility mode for cauldron ingredients and primed spell candidates">
          <span class="spw-utility-sigil" aria-hidden="true">◐</span>
          <span class="spw-utility-argument"></span>
        </button>
      </div>
      <div class="spw-utility-cluster" data-spw-utility-cluster="state-observability" role="group" aria-label="State satchel and observability" data-spw-locality="high" data-spw-component-locality="pattern-lock-satchel" data-spw-physics-reason="memory-gamified" data-spw-module-evaluates="semantic-density">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="open-satchel" aria-label="Open state satchel" title="Open state satchel for saving and inspecting current appearance/runtime state">
          <span class="spw-utility-sigil" aria-hidden="true">⧉</span>
          <span class="spw-utility-argument"></span>
        </button>
      </div>
    `;
    // Append to head for global availability (or body); allows other code / pages to clone/modify the default template.
    (document.head || document.body || document.documentElement).appendChild(template);
  }

  row.appendChild(template.content.cloneNode(true));

  const trace = header.querySelector('.spw-header-trace');
  header.insertBefore(row, trace || header.querySelector('nav') || null);
  return row;
}

function syncUtilityRow(row) {
  if (!(row instanceof HTMLElement)) return;

  const current = getCurrentFontScale();
  const currentColorMode = getCurrentColorMode();
  const currentBase = getCurrentBaseMaterial();
  const currentHigh = getCurrentHighContrast();
  const min = FONT_SCALE_STEPS[0];
  const max = FONT_SCALE_STEPS[FONT_SCALE_STEPS.length - 1];
  const pathToggle = document.querySelector('.spw-spell-path-toggle');
  const compact = document.documentElement.dataset.spwViewportTier === 'compact'
    || document.documentElement.dataset.spwPointerMode === 'coarse';
  const labels = compact ? UTILITY_LABELS.compact : UTILITY_LABELS.regular;

  row.dataset.spwFontScale = current;
  row.dataset.spwColorMode = currentColorMode;
  row.dataset.spwBaseMaterial = currentBase;
  row.dataset.spwHighContrast = currentHigh;
  row.dataset.spwPathAvailable = pathToggle ? 'true' : 'false';
  row.dataset.spwUtilityMode = compact ? 'compact' : 'regular';
  row.dataset.spwSatchelAvailable = document.querySelector('.spw-state-inspector__launch') ? 'true' : 'false';

  // Mind cognitive/attentional physics models + material tunability (per attention-field, wonder, material contracts).
  // Utilities are part of the attentional field and tunable material surface; they must reflect and propagate
  // current state (attention, wonder, field resonance, physics-reason, density, base material) for inspectability
  // and consistent "feel". Tap for action, hold (via titles/gestures) for deeper inspection of the model.
  const root = document.documentElement;
  row.dataset.spwAttention = root.dataset.spwAttention || '';
  row.dataset.spwWonderState = root.dataset.spwWonderState || root.dataset.spwWonderMemory || '';
  row.dataset.spwFieldResonance = root.dataset.spwFieldResonance || '';
  row.dataset.spwPhysicsReason = root.dataset.spwPhysicsReason || '';
  row.dataset.spwSemanticDensity = root.dataset.spwSemanticDensity || '';
  row.dataset.spwMetamaterial = currentBase; // local material on the utility surface itself for chrome rules
  row.dataset.spwModuleEvaluates = (row.dataset.spwModuleEvaluates || '') + ' cognitive attentional material'; // append for audit

  row.querySelectorAll('[data-spw-shell-action="color-light"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['color-light'];
    button.setAttribute('aria-pressed', currentColorMode === 'light' ? 'true' : 'false');
    button.title = currentColorMode === 'light'
      ? 'Light mode active'
      : compact ? 'Switch to light mode' : 'Switch to light mode';
  });

  row.querySelectorAll('[data-spw-shell-action="color-dark"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['color-dark'];
    button.setAttribute('aria-pressed', currentColorMode === 'dark' ? 'true' : 'false');
    button.title = currentColorMode === 'dark'
      ? 'Dark mode active'
      : compact ? 'Switch to dark mode' : 'Switch to dark mode';
  });

  row.querySelectorAll('[data-spw-shell-action="font-down"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['font-down'];
    button.toggleAttribute('disabled', current === min);
    button.setAttribute('aria-disabled', current === min ? 'true' : 'false');
    button.title = current === min ? 'Already at the smallest readable size' : 'Make text smaller';
  });

  row.querySelectorAll('[data-spw-shell-action="font-up"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['font-up'];
    button.toggleAttribute('disabled', current === max);
    button.setAttribute('aria-disabled', current === max ? 'true' : 'false');
    button.title = current === max ? 'Already at the largest readable size' : 'Make text larger';
  });

  row.querySelectorAll('[data-spw-shell-action="path-toggle"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['path-toggle'];
    button.toggleAttribute('disabled', false);
    button.setAttribute('aria-disabled', 'false');
    button.title = pathToggle
      ? 'Toggle the reading path'
      : 'Open the reading path when the header trace finishes mounting';
  });

  row.querySelectorAll('[data-spw-shell-action="settings"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels.settings;
    button.title = compact
      ? 'Open appearance settings'
      : 'Open appearance and typography settings';
  });

  const isClearMatte = currentBase === 'matte' || currentHigh === 'on';
  row.querySelectorAll('[data-spw-shell-action="clear-matte"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['clear-matte'];
    button.setAttribute('aria-pressed', isClearMatte ? 'true' : 'false');
    button.title = isClearMatte
      ? 'Matte clear contrast active (dense text, forms, inspection)'
      : compact ? 'Switch to matte clear contrast' : 'Switch to matte surfaces for clear high-contrast reading';
  });

  const vis = (window.spwSettings?.get?.()?.cauldronCandidateVisibility) || 'balanced';
  row.dataset.spwCauldronVisibility = vis;
  row.querySelectorAll('[data-spw-shell-action="toggle-cauldron-visibility"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['toggle-cauldron-visibility'] || (compact ? vis : `vis:${vis}`);
    button.setAttribute('aria-pressed', vis !== 'subtle' ? 'true' : 'false');
    button.title = `Cauldron/spell visibility: ${vis} (click to cycle subtle/balanced/prominent)`;
    button.dataset.spwCauldronVisibility = vis;
  });

  row.querySelectorAll('[data-spw-shell-action="open-satchel"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['open-satchel'];
    // Satchel minds the full models: tap opens, drag repositions (attentional locomotion in field),
    // hold/inspect reveals cognitive/attentional/physics/material state (wonder, attention, density, metamaterial).
    // Position and snapshot respect current field bias and material for consistent tunability.
    button.title = 'Open state satchel (drag to reposition in attention field; inspects cognitive/attentional physics, material tunability, wonder memory)';
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
  toggle.hidden = false;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.setAttribute('aria-pressed', open ? 'true' : 'false');

  writeMenuDatasets(header, snapshot, 'header');
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

    const indicator = header.querySelector('.header-op-indicator');
    if (indicator) {
      header.insertBefore(toggle, indicator);
    } else {
      header.appendChild(toggle);
    }
  }

  const utilityRow = ensureUtilityRow(header);

  const state = createState(config);
  syncDeviceContext(state);
  writeDatasetValues(header, {
    spwMenu: 'closed',
    spwMenuMode: MODES.INLINE,
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

    event.preventDefault();
    event.stopPropagation();

    document.querySelectorAll('.spw-route-menu[open]').forEach((menu) => {
      menu.open = false;
      syncRouteMenuMode(menu);
    });

    closeToggleMenu('route');

    window.requestAnimationFrame(() => {
      window.location.assign(href);
    });
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

  const handleUtilityClick = (event) => {
    const control = event.target.closest('[data-spw-shell-action]');
    if (!(control instanceof HTMLElement)) return;

    const action = control.dataset.spwShellAction || '';

    if (action === 'settings') return;

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
      return;
    }

    if (action === 'clear-matte') {
      const isCurrentlyClear = getCurrentBaseMaterial() === 'matte' || getCurrentHighContrast() === 'on';
      // Use explicit paired setter when available (single save for the material+contrast
      // intent); falls back to direct save. All paths hit the same kernel contract.
      if (isCurrentlyClear) {
        if (window.spwSettings?.setClearContrastMatte) {
          window.spwSettings.setClearContrastMatte(false);
        } else if (window.spwSettings?.setBaseMetamaterial && window.spwSettings?.setHighContrast) {
          window.spwSettings.setBaseMetamaterial('glass');
          window.spwSettings.setHighContrast('off');
        } else {
          window.spwSettings?.save?.({ baseMetamaterial: 'glass', highContrast: 'off' });
        }
      } else {
        if (window.spwSettings?.setClearContrastMatte) {
          window.spwSettings.setClearContrastMatte(true);
        } else if (window.spwSettings?.setBaseMetamaterial && window.spwSettings?.setHighContrast) {
          window.spwSettings.setBaseMetamaterial('matte');
          window.spwSettings.setHighContrast('on');
        } else {
          window.spwSettings?.save?.({ baseMetamaterial: 'matte', highContrast: 'on' });
        }
      }
      syncUtilityRow(utilityRow);
    }

    if (action === 'toggle-cauldron-visibility') {
      const curr = (window.spwSettings?.get?.()?.cauldronCandidateVisibility) || 'balanced';
      const order = ['subtle', 'balanced', 'prominent'];
      const idx = order.indexOf(curr);
      const next = order[(idx + 1) % order.length];
      if (window.spwSettings?.saveSiteSettings) {
        window.spwSettings.saveSiteSettings({ cauldronCandidateVisibility: next });
      } else {
        window.spwSettings?.save?.({ cauldronCandidateVisibility: next });
      }
      syncUtilityRow(utilityRow);
      return;
    }

    if (action === 'open-satchel') {
      // Shell utility (with appearance controls like clear-matte, color, font) interacts with
      // state satchel for observability of modified site appearance and system states.
      // Uses the launch button as the runtime entrypoint; provides default behavior for
      // capturing current shell/appearance state into the satchel.
      const launch = document.querySelector('.spw-state-inspector__launch');
      if (launch instanceof HTMLElement) {
        launch.click();
      } else {
        const root = document.querySelector('[data-spw-state-inspector-root]');
        if (root instanceof HTMLElement) {
          const isOpen = root.dataset.spwStateInspector === 'open';
          root.dataset.spwStateInspector = isOpen ? 'closed' : 'open';
          const panel = root.querySelector('#spw-state-inspector-panel');
          if (panel instanceof HTMLElement) panel.hidden = isOpen;
        }
      }
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
  window.addEventListener('load', handleLoad, { once: true });
  window.addEventListener('hashchange', handleHashChange);
  // Listen to both canonical (from bus dispatch) and legacy for robust settings wiring.
  document.addEventListener('spw:settings:changed', handleSettingsChanged);
  document.addEventListener('spw:settings-change', handleSettingsChanged);
  document.addEventListener('spw:frame-change', handleSettingsChanged);
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
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('spw:settings:changed', handleSettingsChanged);
      document.removeEventListener('spw:settings-change', handleSettingsChanged);
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
