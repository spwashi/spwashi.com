/**
 * Region-scoped enhancement layer for profiled page regions.
 */

import {
  applyRegionProfile,
  REGION_STATES,
  setRegionState,
} from './region-profiler.js';

export function initRegionEnhancer(ctx, regionEl) {
  if (!(regionEl instanceof HTMLElement)) return;

  const region = ctx.regions.find((entry) => entry.el === regionEl);
  if (!region) return;

  setRegionState(regionEl, REGION_STATES.HYDRATING);

  const { profile } = region;

  regionEl.dataset.spwEnhanced = 'true';
  regionEl.dataset.spwMotionFamily = profile.tempo;
  regionEl.dataset.spwHarmony = profile.harmony;
  regionEl.dataset.spwDensity = profile.density;
  regionEl.dataset.spwRegionGenome = profile.genome;
  regionEl.dataset.spwRegionLayer = 'enhanced';
  regionEl.style.setProperty('--region-harmonic-weight', String(region.profile.index + 1));

  const chips = regionEl.querySelector('.spec-strip, .frame-operators, [data-spw-slot="meta"]');
  if (chips) {
    chips.dataset.spwRegionLinked = 'true';
  }

  setRegionState(regionEl, REGION_STATES.ENHANCED);
  region.enhanced = true;

  ctx.bus.emit('spw:region-enhanced', {
    route: ctx.route,
    id: profile.id,
    key: profile.key,
    harmony: profile.harmony,
    tempo: profile.tempo,
    density: profile.density,
    root: regionEl,
  });

  return {
    cleanup() {
      region.enhanced = false;
      regionEl.dataset.spwRegionLayer = 'settling';
      setRegionState(regionEl, REGION_STATES.SETTLING);
      delete regionEl.dataset.spwEnhanced;
      delete regionEl.dataset.spwMotionFamily;
      delete regionEl.dataset.spwHarmony;
      delete regionEl.dataset.spwDensity;
      delete regionEl.dataset.spwRegionGenome;
      regionEl.style.removeProperty('--region-harmonic-weight');
      const linked = regionEl.querySelector('.spec-strip, .frame-operators, [data-spw-slot="meta"]');
      if (linked) delete linked.dataset.spwRegionLinked;
    },
    refresh(nextCtx) {
      const nextRegion = (nextCtx || ctx).regions.find((entry) => entry.el === regionEl);
      if (!nextRegion) return;
      applyRegionProfile(regionEl, nextRegion.profile);
      regionEl.dataset.spwMotionFamily = nextRegion.profile.tempo;
      regionEl.dataset.spwHarmony = nextRegion.profile.harmony;
      regionEl.dataset.spwDensity = nextRegion.profile.density;
      regionEl.dataset.spwRegionGenome = nextRegion.profile.genome;
    },
  };
}