/**
 * REGION_DEFS — staged runtime catalog family.
 * load() paths are relative to public/js/runtime/.
 */

import { isFn, MODULE_LAYERS, MOUNT_WHEN, REGION_SELECTOR } from './module-catalog-constants.js';

export const REGION_DEFS = [
  {
    id: 'region-enhancer',
    layer: MODULE_LAYERS.REGION,
    when: MOUNT_WHEN.REGION,
    selector: REGION_SELECTOR,
    rootMode: 'each',
    describes: 'region[profile.harmony.density] enhancement pass',
    updates: ['data-spw-enhanced', 'data-spw-motion-family', 'data-spw-harmony', 'data-spw-density', 'data-spw-region-genome'],
    evaluates: 'region lifecycle harmony density motion defaults',
    timingArc: 'region-hydration',
    effectScope: 'region-state css-vars bus',
    load: () => import('./region-enhancer.js'),
    mount: (mod, ctx, root) => {
      const fn = mod?.initRegionEnhancer;
      if (!isFn(fn)) return;
      return fn(ctx, root);
    },
  },
];
