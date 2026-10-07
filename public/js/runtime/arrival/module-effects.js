// module-effects.js
//
// The page's tools waking, shown on the shell mark. Every module that mounts
// after idle turns the #>spwashi mark a notch, like a spool, and pays out one
// stitch beneath it. When mounts go quiet the thread runs out, fades, and the
// mark finishes its turn. One small element carries the cue; the root keeps
// only the ledger of side-effect scopes, written when it grows.
//
// Look: ornament/module-arrival.css.

import { resolveOwnerDocument } from '/public/js/kernel/browser-primitives.js';
import { ensureModuleArrivalStyles } from '/public/js/kernel/deferred-styles.js';
import { writeDatasetValue, writeStyleProperty } from '/public/js/kernel/dom-contracts.js';

const SPOOL_SELECTOR = '.site-header .header-sigil, body > header .header-sigil';
/** Degrees the mark turns for each module that wakes. */
const NOTCH_DEG = 15;
/** Mounts closer together than this read as one wake; this long without one settles it. */
const QUIET_MS = 1800;

export const MODULE_EFFECTS_CONTRACT = Object.freeze({
  spoolSelector: SPOOL_SELECTOR,
  notchDeg: NOTCH_DEG,
  quietMs: QUIET_MS,
  attributes: Object.freeze({
    active: 'data-spw-module-effects-active',
    pulse: 'data-spw-module-effect-pulse',
  }),
  properties: Object.freeze({
    stitches: '--spw-module-effect-stitches',
    turn: '--spw-module-effect-turn',
  }),
});

let activeModuleEffectsCleanup = null;

function normalizeEffectScope(value = '') {
  const tokens = Array.isArray(value) ? value : String(value || '').split(/[\s,+]+/);
  return tokens.map((token) => String(token || '').trim()).filter(Boolean);
}

const requestFrame = (fn) => (typeof window.requestAnimationFrame === 'function'
  ? window.requestAnimationFrame(fn)
  : window.setTimeout(fn, 16));
const cancelFrame = (id) => (typeof window.cancelAnimationFrame === 'function'
  ? window.cancelAnimationFrame(id)
  : window.clearTimeout(id));

function createModuleEffectsInstance(ctx, doc) {
  const html = doc.documentElement;
  const spool = doc.querySelector(SPOOL_SELECTOR);
  const scopes = new Set();
  let stitches = 0;
  let turn = 0;
  let pending = 0;
  let frame = 0;
  let quietTimer = 0;

  const syncLedger = () => {
    writeDatasetValue(html, 'spwModuleEffectsActive', scopes.size ? [...scopes].sort() : null);
  };

  // Modules that mounted before this one still belong in the ledger.
  for (const record of ctx?.registry?.values?.() || []) {
    if (record?.status === 'mounted') normalizeEffectScope(record.effectScope).forEach((scope) => scopes.add(scope));
  }
  syncLedger();

  if (spool) ensureModuleArrivalStyles();

  const settle = () => {
    quietTimer = 0;
    turn = Math.ceil(turn / 360) * 360;
    writeStyleProperty(spool, '--spw-module-effect-turn', `${turn}deg`);
    writeDatasetValue(spool, 'spwModuleEffectPulse', 'settled');
  };

  // A burst of mounts in one frame is one notch-and-stitch write.
  const flush = () => {
    frame = 0;
    if (!pending) return;
    if (spool.dataset.spwModuleEffectPulse !== 'waking') stitches = 0;
    stitches += pending;
    turn += pending * NOTCH_DEG;
    pending = 0;
    writeStyleProperty(spool, '--spw-module-effect-stitches', String(stitches));
    writeStyleProperty(spool, '--spw-module-effect-turn', `${turn}deg`);
    writeDatasetValue(spool, 'spwModuleEffectPulse', 'waking');
    if (quietTimer) window.clearTimeout(quietTimer);
    quietTimer = window.setTimeout(settle, QUIET_MS);
  };

  const onModuleMounted = (detail = {}) => {
    const known = scopes.size;
    normalizeEffectScope(detail.effectScope).forEach((scope) => scopes.add(scope));
    if (scopes.size !== known) syncLedger();
    if (!spool) return;
    pending += 1;
    if (!frame) frame = requestFrame(flush);
  };

  const off = ctx?.bus?.on?.('spw:module-mounted', onModuleMounted);

  return () => {
    if (typeof off === 'function') off();
    if (frame) cancelFrame(frame);
    if (quietTimer) window.clearTimeout(quietTimer);
    frame = 0;
    quietTimer = 0;
    pending = 0;
    writeDatasetValue(html, 'spwModuleEffectsActive', null);
    if (!spool) return;
    writeDatasetValue(spool, 'spwModuleEffectPulse', null);
    writeStyleProperty(spool, '--spw-module-effect-stitches', null);
    // The turn stays at a whole revolution: removing it would spin the mark
    // backwards through every turn it made.
    writeStyleProperty(spool, '--spw-module-effect-turn', `${Math.ceil(turn / 360) * 360}deg`);
  };
}

export function initModuleEffects(ctx, root = document) {
  unmountModuleEffects();
  activeModuleEffectsCleanup = createModuleEffectsInstance(ctx, root?.nodeType === 9 ? root : document);
  return unmountModuleEffects;
}

export function unmountModuleEffects() {
  if (!activeModuleEffectsCleanup) return;
  try { activeModuleEffectsCleanup(); } catch (_) {}
  activeModuleEffectsCleanup = null;
}

export { unmountModuleEffects as unmount };

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'module-effects',
  mount: (ctx, root) => initModuleEffects(ctx, resolveOwnerDocument(ctx, root)),
});

export const spwModule = SPW_MODULE_EXPORT;
