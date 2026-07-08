/**
 * Spw Visitation
 *
 * Restores the runtime hook that summarizes visited image surfaces and exposes
 * lightweight page-level visitation metadata for CSS and downstream helpers.
 */

import { bus } from '/public/js/kernel/bus.js';
import { writeRuntimeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { normalizePathname } from '/public/js/kernel/route-utils.js';
import {
  VISITED_SURFACES_KEY,
  getVisitedCountOnPage,
  getVisitedSurfaceCount,
  readVisitedMap,
} from '/public/js/kernel/visited-surfaces-storage.js';

function applyVisitationState() {
  const entries = Object.values(readVisitedMap());
  const page = normalizePathname(window.location.pathname);
  const pageCount = getVisitedCountOnPage(page);
  const count = getVisitedSurfaceCount();

  writeRuntimeDatasetValues(document.documentElement, {
    spwVisitedSurfaceCount: String(count),
    spwVisitedOnPage: pageCount > 0 ? 'true' : null,
  }, {
    source: 'visitation',
    reason: 'visitation-sync',
  });

  writeRuntimeDatasetValues(document.body, {
    spwVisitedSurfaceCount: String(count),
    spwVisitedOnPage: pageCount > 0 ? 'true' : null,
  }, {
    source: 'visitation',
    reason: 'visitation-sync',
  });

  bus.emit('visitation:updated', {
    count,
    page,
    pageCount,
  });
}

export function initSpwVisitation() {
  applyVisitationState();

  bus.on('image:visited', () => {
    applyVisitationState();
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== VISITED_SURFACES_KEY) return;
    applyVisitationState();
  });
}