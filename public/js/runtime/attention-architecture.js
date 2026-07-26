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
  let activeNudgeTimer = 0;
  let rafId = 0;

  const safeInit = (factory, name) => {
    const cleanup = guardCall(factory, `attention:${name}`, { silent: true })();
    if (cleanup) cleanups.push(cleanup);
  };

  safeInit(initScrollCadenceState, 'scroll-cadence');
  safeInit(() => initSectionHandle(root), 'section-handle');
  safeInit(() => initResonanceProbe(root), 'resonance-probe');
  safeInit(() => initReadingGroove(root), 'reading-groove');
  safeInit(() => initPinchTextScale(root), 'pinch-scale');

  const busUnsubs = [];
  try {
    const bus = ctx?.bus || window.__SPW_SITE__?.bus || window.bus;
    if (bus && typeof bus.on === 'function') {
      const nudge = (event, mode = 'inspect') => {
        const resonance = event?.detail?.action || mode;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          root.querySelectorAll('.spw-section-handle, .spw-section-handle-shell').forEach((h) => {
            h.setAttribute('data-spw-cauldron-resonance', resonance);
          });
          if (activeNudgeTimer) clearTimeout(activeNudgeTimer);
          activeNudgeTimer = window.setTimeout(() => {
            root.querySelectorAll('.spw-section-handle, .spw-section-handle-shell').forEach((h) => {
              if (h?.getAttribute('data-spw-cauldron-resonance') === resonance) {
                h.removeAttribute('data-spw-cauldron-resonance');
              }
            });
          }, 1400);
        });
      };
      busUnsubs.push(bus.on('cauldron:ingredient-inspected', (event) => nudge(event, 'inspect')));
      busUnsubs.push(bus.on('cauldron:updated', (event) => nudge(event, event?.detail?.count > 0 ? 'gather' : 'empty')));
      busUnsubs.push(bus.on('cauldron:gardened', (event) => nudge(event, event?.detail?.action || 'garden')));
    }
  } catch (_) {}

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (activeNudgeTimer) clearTimeout(activeNudgeTimer);
    busUnsubs.forEach((off) => {
      try { typeof off === 'function' && off(); } catch (_) {}
    });
    for (const cleanup of cleanups) {
      try { cleanup && cleanup(); } catch (_) {}
    }
  };
}