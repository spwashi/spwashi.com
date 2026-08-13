/**
 * Room Signal — the shared "read the room" primitive for floating chrome.
 *
 * Composes from state the runtime already computes; adds no new sensing.
 * Page family comes from body[data-spw-page-family] (region-seats.css's
 * family model). Region comes from whichever section attention-architecture.js
 * has already marked current (html[data-spw-page-section-current]), falling
 * back to the nearest .site-frame[data-spw-region] ancestor of the caller's
 * reference element. Accent is the resolved --component-accent for that
 * region, which region-seats.css already derives from family + region.
 *
 * Any floating-chrome module can call readRoom() to find out where it
 * currently is, instead of presenting fixed state regardless of context.
 * Cheap by design: no scroll listeners, no measurement, no new mutation
 * observers — floating-chrome modules that already react to section/page
 * state changes (state-inspector.js's MutationObserver on
 * data-spw-page-section-current, for one) can call this from their existing
 * sync path.
 *
 * The room also carries the region's authored Spw expression when one exists.
 * 476 of these are already written across the site in a consistent grammar —
 * subject[register]{payload.tokens} — and they are the most specific true
 * statement the author made about what a region IS. Floating chrome that reads
 * them resonates with the page instead of presenting the same generic content
 * everywhere; ornament already spends authored semantics this way, and this
 * makes the same source available to chrome.
 */

import { describeSpwExpression } from '/public/js/semantic/spw-expression-geometry.js';

/* getComputedStyle forces a style recalc, and callers sit on paths that fire
   per section change while scrolling — exactly the hot-path read pattern that
   makes this codebase stutter. The resolved accent only depends on the region
   element, the theme pack, and the color mode, so memoize on that triple and
   re-read only when one of them actually changes. Everything else in readRoom
   is plain dataset access, which is cheap. */
let accentMemo = { key: null, value: null };

function readRegionAccent(region) {
  if (!(region instanceof HTMLElement)) return null;

  const html = document.documentElement;
  const key = [
    region.dataset.spwRegion || '',
    region.dataset.spwRegionRole || '',
    region.id || '',
    html.dataset.spwThemePack || '',
    html.dataset.spwColorMode || '',
  ].join('|');

  if (accentMemo.key === key) return accentMemo.value;

  const value = getComputedStyle(region).getPropertyValue('--component-accent').trim() || null;
  accentMemo = { key, value };
  return value;
}

/**
 * Parse an authored expression into its addressable parts.
 * subject[register]{payload.tokens} — subject is what it is about, register is
 * the form it takes, payload names the moves it affords. Geometry (which
 * boundaries were used, whether they balance) comes from the shared
 * browser-safe scanner rather than a second grammar defined here.
 */
function readExpression(el) {
  const raw = el?.dataset?.spwSemanticExpression || '';
  if (!raw) return null;

  const match = /^([^[\]{}()<>]*)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?/.exec(raw.trim());
  const payload = (match?.[3] || '')
    .split('.')
    .map((token) => token.trim())
    .filter(Boolean);

  return {
    raw,
    subject: (match?.[1] || '').trim() || null,
    register: (match?.[2] || '').trim() || null,
    payload,
    geometry: describeSpwExpression(raw),
  };
}

/** Drop the cached accent — call when a theme swap should be re-resolved. */
export function invalidateRoomAccent() {
  accentMemo = { key: null, value: null };
}

export function readRoom(referenceEl = null) {
  const html = document.documentElement;
  const body = document.body;

  const family = body?.dataset?.spwPageFamily || '';

  const currentSectionId = html?.dataset?.spwPageSectionCurrent || '';
  const currentSection = currentSectionId
    ? document.getElementById(currentSectionId)
    : null;

  const region = currentSection
    || (referenceEl?.closest?.('.site-frame[data-spw-region], .site-frame[data-spw-region-role]'))
    || null;

  // Prefer the region's own expression; fall back to the reference element's
  // nearest authored one, so chrome anchored outside a seated region still
  // resonates with whatever it is sitting next to.
  const expression = readExpression(region)
    || readExpression(referenceEl?.closest?.('[data-spw-semantic-expression]'))
    || null;

  return {
    family,
    region: region?.dataset?.spwRegion || '',
    regionRole: region?.dataset?.spwRegionRole || '',
    accent: readRegionAccent(region),
    sectionId: currentSectionId || null,
    expression,
  };
}
