import { writeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import {
  describeSettingValue,
  getSiteSettings,
  resolveTuningDiscoverability,
} from '/public/js/kernel/site-settings.js';
import { registerDomSyncTask } from '/public/js/runtime/dom-sync-hub.js';

export const LEARNABILITY_LEDGER_CONTRACT = Object.freeze({
  attributes: Object.freeze({
    posture: 'data-spw-learnability-posture',
    cue: 'data-spw-learnability-cue',
    cueTarget: 'data-spw-learnability-cue-target',
    resonance: 'data-spw-learnability-resonance',
    layoutContract: 'data-spw-layout-contract',
    featureTier: 'data-spw-learnability-tier',
  }),
  events: Object.freeze({
    updated: 'spw:learnability-ledger-updated',
  }),
});

const METACOGNITIVE_CUES = Object.freeze({
  witness: 'Notice orientation and grounding before acting.',
  composer: 'Gather forces, compose spells, and test crystallizations.',
  explorer: 'Scan routes, wonders, and bridges for the next probe.',
  integrator: 'Trace references, sync clusters, and follow relational threads.',
  overflow: 'Let concepts, features, and vocabulary stay richly visible.',
});

const PROCESS_CUES = Object.freeze({
  breath: 'Breathe with the page rhythm; let posture settle first.',
  scan: 'Sweep the viewport for primeable handles and route bridges.',
  trace: 'Follow gesture trails and semantic lineage across clusters.',
  compose: 'Combine gathered material into inspectable emergent forms.',
});

const LAYOUT_HOST_SELECTOR = '.site-frame, .frame-card, .vibe-widget, [data-spw-feature]';
const FEATURE_SELECTOR = '[data-spw-feature]';
const GESTURE_SELECTOR = '[data-spw-gesture-contract], [data-spw-interaction-contract]';
const SLOT_HOST_SELECTOR = '.site-frame, .frame-card, .vibe-widget';

let pulseTimer = 0;

function describeStance(stance = 'witness') {
  return describeSettingValue('metacognitiveStance', stance);
}

function inferFeatureTier(node) {
  if (!(node instanceof HTMLElement)) return 'named';
  if (node.hasAttribute('data-spw-interaction-contract')) return 'interactive';
  if (node.querySelector(GESTURE_SELECTOR)) return 'gestural';
  if (node.querySelector('[data-spw-slot]')) return 'slotted';
  return 'named';
}

function auditLayoutContracts(root = document) {
  root.querySelectorAll(LAYOUT_HOST_SELECTOR).forEach((host) => {
    if (!(host instanceof HTMLElement)) return;
    const slots = host.querySelector('[data-spw-slot]');
    const feature = host.hasAttribute('data-spw-feature');
    const gesture = host.matches(GESTURE_SELECTOR) || host.querySelector(GESTURE_SELECTOR);
    if (slots) {
      host.dataset.spwLayoutContract = 'slotted';
    } else if (feature && gesture) {
      host.dataset.spwLayoutContract = 'feature-gestural';
    } else if (feature) {
      host.dataset.spwLayoutContract = 'feature-only';
    } else {
      host.dataset.spwLayoutContract = 'implicit';
    }
  });
}

function annotateFeatureClusters(root = document) {
  root.querySelectorAll(FEATURE_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.dataset.spwLearnabilityTier = inferFeatureTier(node);
  });
}

function syncFooterPosture(settings) {
  const scope = document.body;
  if (!scope) return;

  const stance = settings.metacognitiveStance || 'witness';
  const process = settings.processAttention || 'breath';
  const stanceLabel = describeStance(stance);
  const cue = METACOGNITIVE_CUES[stance] || METACOGNITIVE_CUES.witness;
  const processCue = PROCESS_CUES[process] || '';

  scope.querySelectorAll('[data-spw-learnability-stance-label]').forEach((node) => {
    node.textContent = stanceLabel;
  });
  scope.querySelectorAll('[data-spw-learnability-cue-target], [data-spw-learnability-cue]').forEach((node) => {
    node.textContent = processCue ? `${cue} ${processCue}` : cue;
  });
  scope.querySelectorAll('[data-spw-learnability-posture]').forEach((node) => {
    node.dataset.spwLearnabilityPosture = stance;
    node.dataset.spwProcessAttention = process;
  });
}

export function pulseLearnabilityResonance(kind = 'sync') {
  const root = document.documentElement;
  root.dataset.spwLearnabilityResonance = kind;
  window.clearTimeout(pulseTimer);
  pulseTimer = window.setTimeout(() => {
    if (root.dataset.spwLearnabilityResonance === kind) {
      delete root.dataset.spwLearnabilityResonance;
    }
  }, 1200);
}

export function syncLearnabilityLedger(root = document) {
  const settings = getSiteSettings();
  const stance = settings.metacognitiveStance || 'witness';
  const process = settings.processAttention || 'breath';
  const tuningMode = document.documentElement.dataset.spwTuningDiscoverability
    || resolveTuningDiscoverability(settings);

  const features = root.querySelectorAll(FEATURE_SELECTOR);
  const gestures = root.querySelectorAll(GESTURE_SELECTOR);
  const slotHosts = root.querySelectorAll(`${SLOT_HOST_SELECTOR} > [data-spw-slot]`);

  auditLayoutContracts(root);
  annotateFeatureClusters(root);
  syncFooterPosture(settings);

  writeDatasetValues(document.documentElement, {
    spwLearnabilityPosture: stance,
    spwLearnabilityProcess: process,
    spwLearnabilityCue: METACOGNITIVE_CUES[stance] || METACOGNITIVE_CUES.witness,
    spwLearnabilityFeatureCount: features.length ? String(features.length) : null,
    spwLearnabilityGestureCount: gestures.length ? String(gestures.length) : null,
    spwLearnabilitySlotCount: slotHosts.length ? String(slotHosts.length) : null,
    spwLearnabilityLedger: 'active',
    spwLearnabilityTuning: tuningMode,
  });

  document.dispatchEvent(new CustomEvent(LEARNABILITY_LEDGER_CONTRACT.events.updated, {
    detail: {
      stance,
      process,
      featureCount: features.length,
      gestureCount: gestures.length,
      slotCount: slotHosts.length,
      tuningMode,
    },
  }));

  return {
    stance,
    process,
    featureCount: features.length,
    gestureCount: gestures.length,
    slotCount: slotHosts.length,
  };
}

export function initLearnabilityLedger(ctx = null) {
  const unregister = registerDomSyncTask('learnability-ledger', () => syncLearnabilityLedger(), ctx);

  const onSettingsPulse = () => pulseLearnabilityResonance('settings');
  document.addEventListener('spw:settings:changed', onSettingsPulse);
  document.addEventListener('spw:settings-change', onSettingsPulse);

  const bus = ctx?.bus || window.__SPW_SITE__?.bus || window.bus;
  const busUnsubs = [];
  if (bus && typeof bus.on === 'function') {
    busUnsubs.push(bus.on('cauldron:updated', () => pulseLearnabilityResonance('gather')));
    busUnsubs.push(bus.on('prime:collected', () => pulseLearnabilityResonance('prime')));
    busUnsubs.push(bus.on('spell:checkpoint-saved', () => pulseLearnabilityResonance('spell')));
  }

  const cleanup = () => {
    unregister();
    document.removeEventListener('spw:settings:changed', onSettingsPulse);
    document.removeEventListener('spw:settings-change', onSettingsPulse);
    busUnsubs.forEach((off) => off());
    window.clearTimeout(pulseTimer);
  };

  ctx?.addCleanup?.(cleanup);

  return {
    cleanup,
    refresh: () => syncLearnabilityLedger(),
  };
}
