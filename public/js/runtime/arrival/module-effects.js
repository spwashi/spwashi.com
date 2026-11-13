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

function summarizeLoadStory(modules, scopes, latestId = '') {
  const count = modules.size;
  const scopeList = [...scopes].sort().slice(0, 4).join(', ');
  const parts = [`${count} module${count === 1 ? '' : 's'} awake`];
  if (latestId) parts.push(`latest: ${latestId}`);
  if (scopeList) parts.push(`scopes: ${scopeList}${scopes.size > 4 ? ', …' : ''}`);
  return parts.join(' · ');
}

function createModuleEffectsInstance(ctx, doc) {
  const html = doc.documentElement;
  const spool = doc.querySelector(SPOOL_SELECTOR);
  const initialSpoolTitle = spool?.getAttribute?.('title') ?? spool?.title ?? '';
  const presenceNodes = [...(doc.querySelectorAll?.('.site-footer__runtime-copy') || [])];
  const initialPresenceCopy = presenceNodes.map((node) => node.textContent || '');
  const scopes = new Set();
  const mountedModules = new Set();
  let latestModuleId = '';
  let stitches = 0;
  let turn = 0;
  let pending = 0;
  let frame = 0;
  let quietTimer = 0;

  const syncLedger = () => {
    writeDatasetValue(html, 'spwModuleEffectsActive', scopes.size ? [...scopes].sort() : null);
  };

  const syncPresenceStory = () => {
    if (!mountedModules.size && !scopes.size) return;
    const story = summarizeLoadStory(mountedModules, scopes, latestModuleId);
    if (spool) {
      spool.title = initialSpoolTitle ? `${initialSpoolTitle} — ${story}` : `#>spwashi · ${story}`;
    }
    for (const node of presenceNodes) {
      node.textContent = story;
    }
  };

  // Modules that mounted before this one still belong in the ledger.
  for (const record of ctx?.registry?.values?.() || []) {
    if (record?.status === 'mounted') {
      const moduleName = record.baseId || record.id;
      if (moduleName) {
        mountedModules.add(moduleName);
        latestModuleId = moduleName;
      }
      normalizeEffectScope(record.effectScope).forEach((scope) => scopes.add(scope));
    }
  }
  syncLedger();
  syncPresenceStory();

  if (spool) ensureModuleArrivalStyles();

  const settle = () => {
    quietTimer = 0;
    turn = Math.ceil(turn / 360) * 360;
    writeStyleProperty(spool, '--spw-module-effect-turn', `${turn}deg`);
    writeDatasetValue(spool, 'spwModuleEffectPulse', 'settled');
    syncPresenceStory();
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
    syncPresenceStory();
    if (quietTimer) window.clearTimeout(quietTimer);
    quietTimer = window.setTimeout(settle, QUIET_MS);
  };

  const onModuleMounted = (detail = {}) => {
    const known = scopes.size;
    const moduleName = detail.baseId || detail.id;
    if (moduleName) {
      mountedModules.add(moduleName);
      latestModuleId = moduleName;
    }
    normalizeEffectScope(detail.effectScope).forEach((scope) => scopes.add(scope));
    if (scopes.size !== known) syncLedger();
    if (!spool) {
      syncPresenceStory();
      return;
    }
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
    presenceNodes.forEach((node, index) => {
      node.textContent = initialPresenceCopy[index];
    });
    if (!spool) return;
    if (initialSpoolTitle) spool.title = initialSpoolTitle;
    else if (typeof spool.removeAttribute === 'function') spool.removeAttribute('title');
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
  describes: 'module[effects]{ledger.spool}<shell-mark>',
  updates: [
    'html:flourish:data-spw-module-effects-active',
    'flourish:data-spw-module-effect-pulse',
    'flourish:--spw-module-effect-stitches',
    'flourish:--spw-module-effect-turn',
  ],
  evaluates: [],
  timingArc: 'enhance-effects',
  timingChunk: 'idle-lab',
  effectScope: ['css-vars', 'element-state', 'root-state'],
  contract: Object.freeze({
    story: 'Turns the header spool a notch and stitches a faint thread as modules wake after idle, narrating active scopes and module count into the header mark title and footer colophon.',
    wonder: ['orientation', 'memory'],
    host: 'html with optional .header-sigil spool and .site-footer__runtime-copy colophon',
    css: ['public/css/ornament/module-arrival.css'],
    value: 'Makes invisible async hydration feel like mechanical watchwork and honest page telemetry rather than mystery background spinners.',
  }),
});

export const spwModule = SPW_MODULE_EXPORT;
