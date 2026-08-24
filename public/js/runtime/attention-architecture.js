/**
 * attention-architecture.js
 * --------------------------------------------------------------------------
 * Orchestrator for attention-field enhancements. Submodules live under
 * ./attention/ for section locomotion, resonance probe, reading groove,
 * pinch scaling, and scroll cadence.
 * --------------------------------------------------------------------------
 */

import { guardCall } from '/public/js/kernel/dom-render.js';
import { ATTENTION_ARCHITECTURE_CONTRACT } from './attention/shared.js';
import { initSectionHandle } from './attention/section-handle.js';
import { initResonanceProbe } from './attention/resonance-probe.js';
import { initReadingGroove } from './attention/reading-groove.js';
import { initPinchTextScale } from './attention/pinch-scale.js';
import { initScrollCadenceState } from './attention/scroll-cadence.js';

export { ATTENTION_ARCHITECTURE_CONTRACT };

export function initSpwAttentionArchitecture(ctx) {
  const root = (ctx && ctx.root) || document;
  const cleanups = [];

  const safeInit = (factory, name) => {
    const cleanup = guardCall(factory, `attention:${name}`, { silent: true })();
    if (cleanup) cleanups.push(cleanup);
  };

  safeInit(initScrollCadenceState, 'scroll-cadence');
  safeInit(() => initSectionHandle(root, ctx), 'section-handle');
  safeInit(() => initResonanceProbe(root), 'resonance-probe');
  safeInit(() => initReadingGroove(root), 'reading-groove');
  safeInit(() => initPinchTextScale(root), 'pinch-scale');

  return () => {
    for (const cleanup of cleanups) {
      try { cleanup && cleanup(); } catch (_) {}
    }
  };
}
