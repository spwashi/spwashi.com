/**
 * Theme pack loader.
 *
 * Theme packs are token overrides on html[data-spw-theme-pack]. They live in
 * public/css/themes/packs.css, which is deliberately NOT in style-core.css's
 * import graph — so it never enters bundles/core.css, which every route ships.
 *
 * The default pack (neutral-paper) is the :root palette already in
 * tokens/core.css, so a default visitor never fetches this file. Anyone on
 * another pack gets one stylesheet appended once, as early as the settings
 * engine runs.
 *
 * Idempotent: repeated calls (settings changes, re-mounts) reuse the same
 * link element rather than stacking duplicates.
 */

const PACKS_HREF = '/public/css/themes/packs.css';
const LINK_ID = 'spw-theme-packs';

/** The pack whose values are already the :root defaults in tokens/core.css. */
export const DEFAULT_THEME_PACK = 'neutral-paper';

/**
 * Append the pack stylesheet if the active pack needs it.
 * @param {string} [pack] active theme pack; defaults to the current root attr.
 * @returns {boolean} whether the stylesheet is present after this call.
 */
export function ensureThemePackStyles(pack) {
  if (typeof document === 'undefined') return false;

  const active = pack || document.documentElement.dataset.spwThemePack || DEFAULT_THEME_PACK;
  const existing = document.getElementById(LINK_ID);

  // Default pack needs nothing. Leave an already-loaded sheet in place — the
  // visitor may switch back, and removing it would re-fetch on every toggle.
  if (active === DEFAULT_THEME_PACK) return Boolean(existing);
  if (existing) return true;

  const link = document.createElement('link');
  link.id = LINK_ID;
  link.rel = 'stylesheet';
  link.href = PACKS_HREF;
  // Packs only restyle; they must never hold up first paint.
  link.fetchPriority = 'low';
  document.head.append(link);
  return true;
}
