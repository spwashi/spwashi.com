/**
 * visited-surfaces-storage.js
 * --------------------------------------------------------------------------
 * Shared storage contract for image-surface visitation memory.
 *
 * Writers: image-metaphysics (and future managed media surfaces)
 * Readers: visitation runtime, site-settings profiles, ornament CSS via datasets
 */

import { bus } from '/public/js/kernel/bus.js';
import { readJson, writeJson, STORAGE_KEYS } from '/public/js/kernel/storage-utils.js';
import { normalizePathname } from '/public/js/kernel/route-utils.js';

export const VISITED_SURFACES_KEY = STORAGE_KEYS.VISITED_SURFACES;

export function readVisitedMap() {
  return readJson(VISITED_SURFACES_KEY, {}, { requireObject: true });
}

export function writeVisitedMap(map) {
  return writeJson(VISITED_SURFACES_KEY, map);
}

/**
 * Record a visited surface and emit the canonical bus event.
 */
export function recordVisitedSurface({
  key,
  page = globalThis.location?.pathname || '/',
  medium = 'raster',
  host = null,
} = {}) {
  if (!key) return null;

  const map = readVisitedMap();
  const existing = map[key] || { pages: [] };
  const normalizedPage = normalizePathname(page);

  map[key] = {
    visitedAt: new Date().toISOString(),
    medium,
    pages: [...new Set([...(existing.pages || []), normalizedPage])],
  };

  writeVisitedMap(map);

  bus.emit('image:visited', { key, page: normalizedPage, medium }, { element: host });

  return map[key];
}

export function getVisitedSurfaceCount() {
  return Object.keys(readVisitedMap()).length;
}

export function getVisitedCountOnPage(page = globalThis.location?.pathname || '/') {
  const normalizedPage = normalizePathname(page);
  return Object.values(readVisitedMap()).filter(
    (entry) => Array.isArray(entry?.pages) && entry.pages.includes(normalizedPage)
  ).length;
}