/**
 * Deferred stylesheets.
 *
 * Some CSS is only ever spent by a minority of visitors: a palette nobody but
 * its chooser sees, seam overlays only visible with debug on. Shipping it in
 * bundles/core.css bills every route for it, and core weight is already
 * tracked as a forced-recalc risk.
 *
 * Files registered here are deliberately kept OUT of style-core.css's import
 * graph, so the bundler never pulls them into core, and are appended on demand
 * instead.
 *
 * Two properties make this safe for everything registered here:
 *   1. Every rule in these files is gated behind a root attribute that is off
 *      by default, so their absence is indistinguishable from their presence
 *      until the visitor opts in.
 *   2. They only override; the :root defaults in tokens/core.css stand in
 *      until they arrive. Arriving late restyles, it never breaks layout.
 *
 * Loads are idempotent and sheets are never removed — a visitor toggling debug
 * or switching palettes should not re-fetch.
 */

import { invalidateRoomAccent } from './room-signal.js';

const LOADED = new Map();

/**
 * Append a deferred stylesheet once.
 * @param {string} id stable element id, so repeat calls reuse the same link.
 * @param {string} href absolute site path to the stylesheet.
 * @returns {boolean} whether the stylesheet is present after this call.
 */
export function ensureDeferredStyles(id, href) {
  if (typeof document === 'undefined') return false;
  if (LOADED.has(id)) return true;

  const existing = document.getElementById(id);
  if (existing) {
    LOADED.set(id, existing);
    return true;
  }

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  // These restyle opt-in surfaces; they must never hold up first paint.
  link.fetchPriority = 'low';
  // A deferred sheet lands after callers may already have resolved and cached
  // computed values from it (room-signal memoizes --component-accent). Its own
  // cache key cannot see a stylesheet arriving, so invalidate on load.
  link.addEventListener('load', invalidateRoomAccent, { once: true });
  document.head.append(link);
  LOADED.set(id, link);
  return true;
}

/** The pack whose values are already the :root defaults in tokens/core.css. */
export const DEFAULT_THEME_PACK = 'neutral-paper';

/**
 * Theme packs (themes/packs.css). The default pack is the :root palette, so
 * a default visitor never fetches anything.
 * @param {string} [pack] defaults to the current root attribute.
 */
export function ensureThemePackStyles(pack) {
  if (typeof document === 'undefined') return false;
  const active = pack || document.documentElement.dataset.spwThemePack || DEFAULT_THEME_PACK;
  if (active === DEFAULT_THEME_PACK) return LOADED.has('spw-theme-packs');
  return ensureDeferredStyles('spw-theme-packs', '/public/css/themes/packs.css');
}

/**
 * Debug seam overlays (effects/debug.css). Every rule in that file sits behind
 * html[data-spw-debug-mode="on"] or a data-spw-debug token, so it is inert for
 * ordinary reading and pure weight until someone inspects.
 * @param {boolean} [active] defaults to reading the current debug attributes.
 */
export function ensureDebugStyles(active) {
  if (typeof document === 'undefined') return false;
  const html = document.documentElement;
  const on = active ?? (
    html.dataset.spwDebugMode === 'on'
    || Boolean(html.dataset.spwDebug)
    || Boolean(html.dataset.spwDebugLayers)
  );
  if (!on) return LOADED.has('spw-debug-styles');
  return ensureDeferredStyles('spw-debug-styles', '/public/css/effects/debug.css');
}
