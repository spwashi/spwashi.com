/**
 * attention-architecture.js
 * --------------------------------------------------------------------------
 * Orchestrator for attention-field enhancements. Submodules live under
 * ./attention/ for section locomotion, resonance probe, reading groove,
 * pinch scaling, and scroll cadence.
 * --------------------------------------------------------------------------
 */

import { guardCall } from '/public/js/kernel/dom-render.js';
import {
  ATTENTION_ARCHITECTURE_CONTRACT,
  describeAttentionArchitecture,
} from './attention/shared.js';
import { initSectionHandle } from './attention/section-handle.js';
import { initResonanceProbe } from './attention/resonance-probe.js';
import { initReadingGroove } from './attention/reading-groove.js';
import { initPinchTextScale } from './attention/pinch-scale.js';
import { initScrollCadenceState } from './attention/scroll-cadence.js';

export {
  ATTENTION_ARCHITECTURE_CONTRACT,
  describeAttentionArchitecture,
  initSectionHandle,
  initResonanceProbe,
  initReadingGroove,
  initPinchTextScale,
  initScrollCadenceState,
};

const CHILD_INIT = Object.freeze({
  'scroll-cadence': (_root, _ctx) => initScrollCadenceState(),
  'section-handle': (root, ctx) => initSectionHandle(root, ctx),
  'resonance-probe': (root) => initResonanceProbe(root),
  'reading-groove': (root) => initReadingGroove(root),
  'pinch-scale': (root) => initPinchTextScale(root),
});

export function initSpwAttentionArchitecture(ctx = {}) {
  const root = ctx.root || (typeof document !== 'undefined' ? document : null);
  const wanted = ctx.children
    || Object.keys(ATTENTION_ARCHITECTURE_CONTRACT.children);
  const cleanups = [];

  const safeInit = (name) => {
    const factory = CHILD_INIT[name];
    if (!factory) return;
    const cleanup = guardCall(() => factory(root, ctx), `attention:${name}`, { silent: true })();
    if (cleanup) cleanups.push(cleanup);
  };

  wanted.forEach(safeInit);

  return () => {
    for (const cleanup of cleanups) {
      try { cleanup && cleanup(); } catch (_) {}
    }
  };
}
