/**
 * shell/measurement.js
 * ---------------------------------------------------------------------------
 * Viewport tiers, scroll bands, pointer postures, and nav fit measurement.
 * Pure and semi-pure measurement primitives extracted from shell disclosure
 * and shared across shell and contextual UI modules.
 */

import {
  isCoarsePointerEnvironment,
  supportsHoverEnvironment,
  writeProjectionTier,
  PROJECTION_TIERS,
} from '/public/js/kernel/dom-contracts.js';

export const SHELL_MODES = Object.freeze({
  INLINE: 'inline',
  TOGGLE: 'toggle',
});

export const VIEWPORT_TIERS = Object.freeze({
  COMPACT: 'compact',
  NARROW: 'narrow',
  MID: 'mid',
  REGULAR: 'regular',
  WIDE: 'wide',
});

export const SCROLL_BANDS = Object.freeze({
  TOP: 'top',
  LIFTED: 'lifted',
  DEEP: 'deep',
});

export const SCROLL_DIRECTIONS = Object.freeze({
  UP: 'up',
  DOWN: 'down',
  STILL: 'still',
});

export const PRESSURES = Object.freeze({
  CALM: 'calm',
  TIGHT: 'tight',
  COMPRESSED: 'compressed',
  CROWDED: 'crowded',
});

export const SHELL_MEASUREMENT_DEFAULTS = Object.freeze({
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

/* Same query as navigation.css pocket/coarse hamburger. Rem and pointer,
   not a parallel 720px ladder, so the strip and the glyph cannot disagree. */
export const DRAWER_MENU_QUERY = '(pointer: coarse), (max-width: 45rem)';

export const SPW_SHELL_MEASUREMENT_CONTRACT = Object.freeze({
  modes: SHELL_MODES,
  tiers: VIEWPORT_TIERS,
  scrollBands: SCROLL_BANDS,
  scrollDirections: SCROLL_DIRECTIONS,
  pressures: PRESSURES,
  defaults: SHELL_MEASUREMENT_DEFAULTS,
  resolveViewportVariant,
});

export function prefersDrawerMenu(view = globalThis) {
  return view?.matchMedia?.(DRAWER_MENU_QUERY)?.matches === true;
}

export function getViewportTier(width = (globalThis.innerWidth || 1024), config = SHELL_MEASUREMENT_DEFAULTS) {
  if (width < 420) return VIEWPORT_TIERS.COMPACT;
  if (width < (config?.narrowBreakpointPx ?? SHELL_MEASUREMENT_DEFAULTS.narrowBreakpointPx)) {
    return VIEWPORT_TIERS.NARROW;
  }
  if (width < (config?.midBreakpointPx ?? SHELL_MEASUREMENT_DEFAULTS.midBreakpointPx)) {
    return VIEWPORT_TIERS.MID;
  }
  if (width < 1280) return VIEWPORT_TIERS.REGULAR;
  return VIEWPORT_TIERS.WIDE;
}

export function layoutReasonForTier(tier = VIEWPORT_TIERS.REGULAR) {
  if (tier === VIEWPORT_TIERS.COMPACT || tier === VIEWPORT_TIERS.NARROW) return 'pocket';
  if (tier === VIEWPORT_TIERS.MID) return 'fold';
  return 'broadsheet';
}

export function getPointerMode(view = globalThis) {
  return isCoarsePointerEnvironment(view) ? 'coarse' : 'fine';
}

export function getHoverMode(view = globalThis) {
  return supportsHoverEnvironment(view) ? 'hover' : 'touch';
}

export function syncDeviceContext(state, root = globalThis.document, view = globalThis) {
  const width = view?.innerWidth || 1024;
  const tier = getViewportTier(width, state?.config || SHELL_MEASUREMENT_DEFAULTS);
  const pointer = getPointerMode(view);
  const hover = getHoverMode(view);
  const reason = layoutReasonForTier(tier);
  const flow = reason === 'pocket' ? 'vertical-ribbon' : reason === 'fold' ? 'spread' : 'broadsheet';

  const target = root?.documentElement || root;
  if (target) {
    writeProjectionTier(target, PROJECTION_TIERS.TRANSIENT, {
      spwViewportTier: tier,
      spwPointerMode: pointer,
      spwHoverMode: hover,
      spwDeviceContext: `${tier}-${pointer}`,
      spwLayoutReason: reason,
      spwLayoutFlow: flow,
    });
  }

  return { tier, pointer, hover, reason, flow };
}

export function getScrollY(view = globalThis) {
  return Math.max(view?.scrollY || view?.pageYOffset || 0, 0);
}

export function resolveScrollBand(scrollY, config = SHELL_MEASUREMENT_DEFAULTS) {
  const lift = config?.scrollLiftPx ?? SHELL_MEASUREMENT_DEFAULTS.scrollLiftPx;
  const deep = config?.scrollDeepPx ?? SHELL_MEASUREMENT_DEFAULTS.scrollDeepPx;
  if (scrollY <= lift) return SCROLL_BANDS.TOP;
  if (scrollY < deep) return SCROLL_BANDS.LIFTED;
  return SCROLL_BANDS.DEEP;
}

export function resolveScrollDirection(nextScrollY, previousScrollY, config = SHELL_MEASUREMENT_DEFAULTS) {
  const deadzone = config?.scrollDirectionDeadzonePx ?? SHELL_MEASUREMENT_DEFAULTS.scrollDirectionDeadzonePx;
  if (nextScrollY > previousScrollY + deadzone) return SCROLL_DIRECTIONS.DOWN;
  if (nextScrollY < previousScrollY - deadzone) return SCROLL_DIRECTIONS.UP;
  return SCROLL_DIRECTIONS.STILL;
}

export function readNavContentWidth(nav, navList, view = globalThis) {
  if (!nav || !navList) return 0;

  const listItems = Array.from(navList.querySelectorAll?.(':scope > li') || []);
  const getStyle = view?.getComputedStyle?.bind(view) || globalThis.getComputedStyle;
  const listStyle = getStyle ? getStyle(navList) : {};
  const columnGap = Number.parseFloat(listStyle?.columnGap || listStyle?.gap || '0') || 0;
  const measuredItemsWidth = listItems.reduce((total, item) => {
    if (!item?.getBoundingClientRect) return total;
    return total + (item.getBoundingClientRect()?.width || 0);
  }, 0) + Math.max(0, listItems.length - 1) * columnGap;

  return Math.max(nav.scrollWidth || 0, navList.scrollWidth || 0, measuredItemsWidth);
}

export function computeNavRatio(header, nav, navList, state, view = globalThis) {
  if (!nav) return 1;
  const getStyle = view?.getComputedStyle?.bind(view) || globalThis.getComputedStyle;
  const navStyle = getStyle ? getStyle(nav) : {};
  const canMeasure = !nav.hidden && navStyle?.display !== 'none' && navStyle?.visibility !== 'hidden';
  const headerWidth = header?.clientWidth || 800;
  const cachedNavWidth = state?.navMeasure?.navWidth || 0;
  const navWidth = canMeasure
    ? nav.clientWidth || cachedNavWidth || Math.max(headerWidth * 0.58, 1)
    : cachedNavWidth || Math.max(headerWidth * 0.58, 1);
  if (!navWidth) return 1;

  const measuredRawContentWidth = canMeasure ? readNavContentWidth(nav, navList, view) : 0;
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
        ? Math.round(globalThis.performance?.now?.() || 0)
        : state.navMeasure.measuredAt,
    };
  }

  return ratio;
}

export function countPrimaryRoutes(navList) {
  if (!navList?.querySelectorAll) return 0;
  return navList.querySelectorAll(':scope > li > a[href]').length;
}

export function countOverflowRoutes(navList) {
  if (!navList?.querySelectorAll) return 0;
  const panelLinks = navList.querySelectorAll(':scope > li.spw-route-menu-host .spw-route-menu-panel a[href]').length;
  if (panelLinks) return panelLinks;

  const countText = navList.querySelector(':scope > li.spw-route-menu-host .spw-route-menu-count')?.textContent || '';
  const count = Number.parseInt(countText.replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export function resolveMenuMode(header, nav, navList, state, view = globalThis) {
  const doc = header?.ownerDocument || globalThis.document;
  const html = doc?.documentElement;
  const config = state?.config || SHELL_MEASUREMENT_DEFAULTS;
  const tier = html?.dataset?.spwViewportTier || getViewportTier(view?.innerWidth, config);
  const ratio = computeNavRatio(header, nav, navList, state, view);

  if (prefersDrawerMenu(view)) return SHELL_MODES.TOGGLE;
  if (tier === VIEWPORT_TIERS.COMPACT || tier === VIEWPORT_TIERS.NARROW) return SHELL_MODES.TOGGLE;

  const previousMode = state?.snapshot?.mode || state?.mode || SHELL_MODES.INLINE;
  const exitRatio = Math.max(1, config.compressedRatio - config.modeHysteresisRatio);
  if (previousMode === SHELL_MODES.TOGGLE) {
    return ratio > exitRatio ? SHELL_MODES.TOGGLE : SHELL_MODES.INLINE;
  }

  if (ratio > config.compressedRatio) return SHELL_MODES.TOGGLE;

  return SHELL_MODES.INLINE;
}

export function resolveMenuPressure({
  mode = SHELL_MODES.INLINE,
  ratio = 1,
  navFit = 'roomy',
  tier = VIEWPORT_TIERS.WIDE,
  pointer = 'fine',
  previousPressure = PRESSURES.CALM,
  config = SHELL_MEASUREMENT_DEFAULTS,
} = {}) {
  if (mode === SHELL_MODES.TOGGLE && (tier === VIEWPORT_TIERS.COMPACT || tier === VIEWPORT_TIERS.NARROW)) {
    return PRESSURES.CROWDED;
  }

  const pressureMargin = config?.pressureHysteresisRatio ?? SHELL_MEASUREMENT_DEFAULTS.pressureHysteresisRatio;
  const compressedEnterRatio = 1.18;
  const compressedExitRatio = compressedEnterRatio - pressureMargin;
  const tightEnterRatio = 1.02;
  const tightExitRatio = tightEnterRatio - pressureMargin;
  const compressedContext = navFit === 'compressed' || (tier === VIEWPORT_TIERS.MID && pointer === 'coarse');

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

export function resolveViewportVariant(widthOrTier = (globalThis.innerWidth || 1024), variantMap = {}, fallback = '') {
  if (!variantMap || typeof variantMap !== 'object') return fallback;
  const tier = typeof widthOrTier === 'number'
    ? getViewportTier(widthOrTier)
    : String(widthOrTier || '').trim().toLowerCase();

  // 1. Direct tier match: compact, narrow, mid, regular, wide
  if (Object.prototype.hasOwnProperty.call(variantMap, tier)) {
    return variantMap[tier];
  }

  // 2. Posture/layout reason match: pocket, fold, broadsheet
  const reason = layoutReasonForTier(tier);
  if (reason && Object.prototype.hasOwnProperty.call(variantMap, reason)) {
    return variantMap[reason];
  }

  return fallback;
}
