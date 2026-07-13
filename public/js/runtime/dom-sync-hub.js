/**
 * dom-sync-hub.js
 * --------------------------------------------------------------------------
 * Debounced DOM projection hub — one MutationObserver + settings coalescing
 * for tuning-discovery, gesture-anatomy, and learnability-ledger.
 * --------------------------------------------------------------------------
 */

import { guardCall } from '/public/js/kernel/dom-render.js';

const TASK_ORDER = Object.freeze([
  'component-kind-mirror',
  'page-region-rail',
  'tuning-discovery',
  'gesture-anatomy',
  'learnability-ledger',
]);

const ATTRIBUTE_FILTER = Object.freeze([
  'data-spw-feature',
  'data-spw-region-role',
  'data-spw-role',
  'data-spw-gesture-contract',
  'data-spw-gesture-contract-resolved',
  'data-spw-interaction-contract',
  'data-spw-interaction-contract-resolved',
  'data-spw-theming-posture',
  'data-spw-theming-posture-resolved',
  'data-spw-slot',
  'data-spw-kind',
  'data-spw-component-kind',
  'data-spw-image-discovery',
  'data-spw-image-interaction-state',
  'data-spw-image-lens-active',
  'data-spw-effect-readout',
  'data-spw-effect-view',
  'data-spw-effect-state-value',
  'data-spw-image-utilization',
  'data-spw-interaction-phase',
  'data-spw-concept-ref',
  'data-spw-vocabulary-collectible',
  'data-spw-learnable-dimension',
  'data-spw-layout',
  'data-spw-layout-posture',
  'data-spw-packing-state',
  'data-spw-pack-occupancy',
  'data-spw-variant-selected',
  'data-spw-component-variant-active',
  'data-spw-query-parity',
  'data-spw-condense-tier',
  'data-spw-precipitation-mode',
  'data-spw-discovery-label',
  'data-spw-discovery-title',
  'data-spw-accent-anchor',
  'data-spw-accent-palette',
  'data-site-settings-scope',
  'data-spw-affordance',
  'data-site-settings-panel',
  'data-spw-anatomy',
  'data-spw-vocabulary',
]);

const tasks = new Map();
let observer = null;
let rafId = 0;
let pendingTasks = null;
let settingsBound = false;
let settingsCleanup = null;
let attachedCtx = null;

function runTaskBatch(ids) {
  const ordered = TASK_ORDER.filter((id) => ids.has(id));
  const trailing = [...ids].filter((id) => !TASK_ORDER.includes(id));
  for (const id of [...ordered, ...trailing]) {
    guardCall(tasks.get(id), `dom-sync-hub:${id}`, { fallback: undefined })();
  }
}

function flushScheduledTasks() {
  rafId = 0;
  const batch = pendingTasks;
  pendingTasks = null;
  if (batch && batch.size) {
    runTaskBatch(batch);
    return;
  }
  runTaskBatch(new Set(tasks.keys()));
}

export function scheduleDomSync(scope = 'all') {
  if (scope === 'all') {
    pendingTasks = null;
  } else if (pendingTasks instanceof Set) {
    pendingTasks.add(scope);
  } else {
    pendingTasks = new Set([scope]);
  }

  if (rafId) return;
  rafId = window.requestAnimationFrame(flushScheduledTasks);
}

function ensureObserver(ctx = attachedCtx) {
  if (observer) return observer;
  observer = new MutationObserver(() => scheduleDomSync('all'));
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [...ATTRIBUTE_FILTER],
  });
  ctx?.addObserver?.(observer);
  attachedCtx = ctx || attachedCtx;
  return observer;
}

function bindSettingsRefresh() {
  if (settingsBound) return;
  settingsBound = true;
  const onSettings = () => scheduleDomSync('all');
  document.addEventListener('spw:settings:changed', onSettings);
  document.addEventListener('spw:settings-change', onSettings);
  settingsCleanup = () => {
    document.removeEventListener('spw:settings:changed', onSettings);
    document.removeEventListener('spw:settings-change', onSettings);
    settingsBound = false;
    settingsCleanup = null;
  };
}

export function registerDomSyncTask(id, run, ctx = null) {
  if (!id || typeof run !== 'function') return () => {};
  tasks.set(id, run);
  bindSettingsRefresh();
  ensureObserver(ctx);
  run();
  return () => {
    tasks.delete(id);
    if (!tasks.size) {
      observer?.disconnect();
      observer = null;
      settingsCleanup?.();
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      pendingTasks = null;
    }
  };
}

export function destroyDomSyncHub() {
  observer?.disconnect();
  observer = null;
  tasks.clear();
  settingsCleanup?.();
  if (rafId) {
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }
  pendingTasks = null;
  attachedCtx = null;
}
