/**
 * attention-architecture.js
 * --------------------------------------------------------------------------
 * Orchestrator for attention-field enhancements. Submodules live under
 * ./attention/ for section locomotion, resonance probe, reading groove,
 * pinch scaling, and scroll cadence.
 *
 * Catalog mounts each child on its own when=. This facade is the
 * compose/all-at-once path and uses the same SPW_MODULE_EXPORT.mount(ctx, root)
 * contract the loader uses.
 * --------------------------------------------------------------------------
 */

import { guardCall } from '/public/js/kernel/dom-render.js';
import {
  ATTENTION_ARCHITECTURE_CONTRACT,
  describeAttentionArchitecture,
} from './attention/shared.js';
import {
  initSectionHandle,
  SPW_MODULE_EXPORT as sectionHandleExport,
} from './attention/section-handle.js';
import {
  initResonanceProbe,
  SPW_MODULE_EXPORT as resonanceProbeExport,
} from './attention/resonance-probe.js';
import {
  initReadingGroove,
  SPW_MODULE_EXPORT as readingGrooveExport,
} from './attention/reading-groove.js';
import {
  initPinchTextScale,
  SPW_MODULE_EXPORT as pinchScaleExport,
} from './attention/pinch-scale.js';
import {
  initScrollCadenceState,
  SPW_MODULE_EXPORT as scrollCadenceExport,
} from './attention/scroll-cadence.js';

export {
  ATTENTION_ARCHITECTURE_CONTRACT,
  describeAttentionArchitecture,
  initSectionHandle,
  initResonanceProbe,
  initReadingGroove,
  initPinchTextScale,
  initScrollCadenceState,
};

const CHILD_MOUNT = Object.freeze({
  'scroll-cadence': scrollCadenceExport.mount,
  'section-handle': sectionHandleExport.mount,
  'resonance-probe': resonanceProbeExport.mount,
  'reading-groove': readingGrooveExport.mount,
  'pinch-scale': pinchScaleExport.mount,
});

function asCleanup(result) {
  if (typeof result === 'function') return result;
  if (typeof result?.cleanup === 'function') return result.cleanup;
  return null;
}

export function initSpwAttentionArchitecture(ctx = {}) {
  const root = ctx.root || (typeof document !== 'undefined' ? document : null);
  const wanted = ctx.children
    || Object.keys(ATTENTION_ARCHITECTURE_CONTRACT.children);
  const cleanups = [];

  wanted.forEach((name) => {
    const mount = CHILD_MOUNT[name];
    if (!mount) return;
    const result = guardCall(() => mount(ctx, root), `attention:${name}`, { silent: true })();
    const cleanup = asCleanup(result);
    if (cleanup) cleanups.push(cleanup);
  });

  return () => {
    for (const cleanup of cleanups) {
      try { cleanup(); } catch (_) {}
    }
  };
}
