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
 */

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

  return {
    family,
    region: region?.dataset?.spwRegion || '',
    regionRole: region?.dataset?.spwRegionRole || '',
    accent: readRegionAccent(region),
    sectionId: currentSectionId || null,
  };
}
