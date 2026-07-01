// module-effects.js
//
// Surfaces runtime module side effects on the document root so CSS ornament,
// interaction semantics, and inspectors can read what changed.

import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';

let initialized = false;
let cleanupFns = [];

const EFFECT_TOKENS = new Set();

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
  window.setTimeout(() => {
    if (html.dataset.spwModuleEffectPulse === moduleId) {
      delete html.dataset.spwModuleEffectPulse;
    }
  }, 520);
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

export function initModuleEffects(ctx) {
  if (initialized) return () => {};
  initialized = true;

  const html = document.documentElement;
  const body = document.body;

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