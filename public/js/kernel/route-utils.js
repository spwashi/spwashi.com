/**
 * route-utils.js
 * --------------------------------------------------------------------------
 * Route normalization, list parsing, transition priming, and hydration context.
 */

import { unique } from '/public/js/semantic/semantic-utils.js';
import { writeRuntimeDatasetValues } from '/public/js/kernel/dom-contracts.js';

const primedRoutes = new Set();

/** Trailing-slash stable pathname for same-origin routes. */
export function normalizePathname(pathname = '') {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '/') || '/';
}

/** Resolve an href or path fragment to a normalized pathname. */
export function normalizeRouteHref(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    return normalizePathname(new URL(raw, globalThis.location?.href || 'https://spwashi.com/').pathname);
  } catch {
    return normalizePathname(raw);
  }
}

/**
 * Full same-origin route identity: pathname + search + hash.
 * Returns empty string for cross-origin hrefs.
 */
export function normalizeRoutePath(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '/';

  try {
    const url = new URL(raw, globalThis.location?.href || 'https://spwashi.com/');
    if (url.origin !== globalThis.location?.origin) return '';
    return `${url.pathname.replace(/\/+$/, '/') || '/'}${url.search}${url.hash}`;
  } catch {
    if (raw.startsWith('/')) return raw.replace(/\/+$/, '/') || '/';
    return `/${raw.replace(/^\/+/, '').replace(/\/+$/, '/')}`;
  }
}

/** Parse pipe- or comma-delimited route lists into deduped pathnames. */
export function parseRouteList(value = '', delimiter = /[|,]/) {
  return unique(
    String(value)
      .split(delimiter)
      .map((part) => normalizeRouteHref(part))
      .filter(Boolean)
  );
}

/** Lightweight route context for hydration and breadcrumb helpers. */
export function hydrateRouteContext(pathname = globalThis.location?.pathname || '/') {
  const path = normalizePathname(pathname);
  const segments = path.split('/').filter(Boolean);
  return Object.freeze({
    pathname: path,
    segments,
    leaf: segments.at(-1) || 'home',
    depth: segments.length,
  });
}

/**
 * Prime a route transition: optional prefetch link + html dataset for CSS/ornament.
 * Returns false when the route was already primed this session.
 */
export function primeRouteTransition(href, options = {}) {
  const path = normalizeRouteHref(href);
  if (!path || primedRoutes.has(path)) return false;

  primedRoutes.add(path);
  const html = globalThis.document?.documentElement;
  if (!html) return true;

  if (options.prefetch !== false && globalThis.document?.head) {
    const existing = globalThis.document.head.querySelector(`link[data-spw-route-prime="${path}"]`);
    if (!existing) {
      const link = globalThis.document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      link.dataset.spwRoutePrime = path;
      globalThis.document.head.appendChild(link);
    }
  }

  writeRuntimeDatasetValues(html, {
    spwRoutePrimed: path,
    spwRoutePrimeMode: options.mode || 'intent',
  }, {
    source: 'route-utils',
    reason: options.reason || 'route-prime',
  });

  return true;
}

export function clearRoutePrimeState() {
  primedRoutes.clear();
  const html = globalThis.document?.documentElement;
  if (!html) return;
  writeRuntimeDatasetValues(html, {
    spwRoutePrimed: null,
    spwRoutePrimeMode: null,
  }, {
    source: 'route-utils',
    reason: 'route-prime-clear',
  });
}

export const ROUTE = Object.freeze({
  pathname: normalizePathname,
  href: normalizeRouteHref,
  path: normalizeRoutePath,
  list: parseRouteList,
  context: hydrateRouteContext,
  prime: primeRouteTransition,
  clearPrime: clearRoutePrimeState,
});