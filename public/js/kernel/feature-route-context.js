/**
 * feature-route-context.js
 * --------------------------------------------------------------------------
 * Shared route hydration projection for feature modules.
 */

import { writeRuntimeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { hydrateRouteContext } from '/public/js/kernel/route-utils.js';

/**
 * Project normalized route context onto a runtime target for CSS/inspection.
 * Returns the hydrated context object for module payloads.
 */
export function projectFeatureRouteContext(target = document.documentElement, options = {}) {
  const ctx = hydrateRouteContext(options.pathname);
  if (!(target instanceof Element)) return ctx;

  writeRuntimeDatasetValues(target, {
    spwRoutePathname: ctx.pathname,
    spwRouteLeaf: ctx.leaf,
    spwRouteDepth: String(ctx.depth),
    spwRouteSegments: ctx.segments.join('/') || null,
  }, {
    source: options.source || 'feature-route-context',
    reason: options.reason || 'route-hydration',
  });

  return ctx;
}