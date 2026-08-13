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

  const regionKind = region?.dataset?.spwRegion || '';
  const regionRole = region?.dataset?.spwRegionRole || '';

  let accent = '';
  if (region instanceof HTMLElement) {
    accent = getComputedStyle(region).getPropertyValue('--component-accent').trim();
  }

  return {
    family,
    region: regionKind,
    regionRole,
    accent: accent || null,
    sectionId: currentSectionId || null,
  };
}
