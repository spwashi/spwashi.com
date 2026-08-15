// module-effects.js
//
// Surfaces runtime module side effects on the document root so CSS ornament,
// interaction semantics, and inspectors can read what changed.

import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';

let initialized = false;
let cleanupFns = [];
let pulseTimer = 0;

const EFFECT_TOKENS = new Set();
/** Fallback when --spw-module-effect-pulse-duration is unavailable (matches --touch-recover). */
const MODULE_PULSE_MS_FALLBACK = 520;
const MODULE_PULSE_DURATION_VAR = '--spw-module-effect-pulse-duration';

export const MODULE_EFFECTS_CONTRACT = Object.freeze({
  pulseDurationVar: MODULE_PULSE_DURATION_VAR,
  pulseDurationMs: MODULE_PULSE_MS_FALLBACK,
  attributes: Object.freeze({
    active: 'data-spw-module-effects-active',
    count: 'data-spw-module-effect-count',
    pulse: 'data-spw-module-effect-pulse',
  }),
});

function readCssDurationMs(varName, fallbackMs) {
  try {
    const root = document.documentElement;
    if (!root) return fallbackMs;
    const raw = getComputedStyle(root).getPropertyValue(varName).trim();
    if (!raw) return fallbackMs;
    if (raw.endsWith('ms')) {
      const n = Number.parseFloat(raw);
      return Number.isFinite(n) && n > 0 ? n : fallbackMs;
    }
    if (raw.endsWith('s')) {
      const n = Number.parseFloat(raw) * 1000;
      return Number.isFinite(n) && n > 0 ? n : fallbackMs;
    }
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : fallbackMs;
  } catch {
    return fallbackMs;
  }
}

function readModulePulseDurationMs() {
  return readCssDurationMs(MODULE_PULSE_DURATION_VAR, MODULE_PULSE_MS_FALLBACK);
}

let pulseDurationMs = MODULE_PULSE_MS_FALLBACK;

function normalizeEffectScope(value = '') {
  return String(value || '')
    .split(/[\s,+]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function syncModuleEffects(html) {
  if (!html) return;

  const tokens = [...EFFECT_TOKENS].sort();
  writeDatasetValue(html, 'spwModuleEffectsActive', tokens.length ? tokens : null);
  writeDatasetValue(html, 'spwModuleEffectCount', tokens.length ? String(tokens.length) : null);
}

function pulseModuleEffect(html, moduleId = '') {
  if (!html || !moduleId) return;

  writeDatasetValue(html, 'spwModuleEffectPulse', moduleId);
  if (pulseTimer) window.clearTimeout(pulseTimer);
  pulseTimer = window.setTimeout(() => {
    pulseTimer = 0;
    if (html.dataset.spwModuleEffectPulse === moduleId) {
      delete html.dataset.spwModuleEffectPulse;
    }
  }, pulseDurationMs);
}

function onModuleMounted(detail = {}, html) {
  normalizeEffectScope(detail.effectScope).forEach((token) => EFFECT_TOKENS.add(token));
  syncModuleEffects(html);
  pulseModuleEffect(html, detail.baseId || detail.id || '');
}

function onRuntimeTokensUpdated(detail = {}, html) {
  writeDatasetValue(html, 'spwRuntimeEnhancementActive', detail.enhancementIntensity > 0.5 ? 'true' : null);
  writeDatasetValue(html, 'spwRuntimeFeatureActive', detail.featureIntensity > 0.5 ? 'true' : null);
  writeDatasetValue(html, 'spwRuntimeLayerPulse', detail.layerCount > 2 ? 'dense' : 'light');
}

function createModuleEffectsInstance(ctx) {
  if (initialized) return () => {};
  initialized = true;

  const html = document.documentElement;
  const body = document.body;
  // Theme-independent timing tokens only need one computed-style read per mount.
  pulseDurationMs = readModulePulseDurationMs();

  if (body?.dataset?.spwRuntimeMountedModules) {
    normalizeEffectScope(body.dataset.spwRuntimeLastModuleEffectScope).forEach((token) => {
      EFFECT_TOKENS.add(token);
    });
  }
  syncModuleEffects(html);

  if (ctx?.bus?.on) {
    cleanupFns.push(
      ctx.bus.on('spw:module-mounted', (detail) => onModuleMounted(detail, html)),
      ctx.bus.on('spw:runtime-tokens-updated', (detail) => onRuntimeTokensUpdated(detail, html)),
    );
  }

  return () => {
    if (pulseTimer) {
      window.clearTimeout(pulseTimer);
      pulseTimer = 0;
    }
    cleanupFns.forEach((fn) => {
      try {
        fn?.();
      } catch {
        /* ignore */
      }
    });
    cleanupFns = [];
    EFFECT_TOKENS.clear();
    syncModuleEffects(html);
    delete html.dataset.spwModuleEffectPulse;
    delete html.dataset.spwRuntimeEnhancementActive;
    delete html.dataset.spwRuntimeFeatureActive;
    delete html.dataset.spwRuntimeLayerPulse;
    initialized = false;
  };
}

let activeModuleEffectsCleanup = null;

export function initModuleEffects(ctx, root = document) {
  unmountModuleEffects();
  activeModuleEffectsCleanup = createModuleEffectsInstance(ctx, root);
  return activeModuleEffectsCleanup;
}

export function unmountModuleEffects() {
  if (activeModuleEffectsCleanup) {
    try { activeModuleEffectsCleanup(); } catch (_) {}
    activeModuleEffectsCleanup = null;
  }
}

export { unmountModuleEffects as unmount };
