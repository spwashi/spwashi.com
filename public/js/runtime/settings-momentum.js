/**
 * settings-momentum.js
 * ---------------------------------------------------------------------------
 * Settings tuning as spell momentum — brief root tokens and bus events when
 * canonical settings change so ornament, learnability, and spell surfaces
 * can echo the tuning gesture without re-applying settings.
 */

import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';

function readMomentumMs(html) {
  if (typeof getComputedStyle !== 'function') return 640;
  const raw = getComputedStyle(html).getPropertyValue('--spw-microinteraction-pulse-duration').trim();
  const parsed = Number.parseInt(raw, 10);
  const pulse = Number.isFinite(parsed) && parsed > 80 ? parsed : 280;
  return Math.max(420, Math.round(pulse * 2.2));
}

let initialized = false;
let momentumTimer = 0;

export const SPW_SETTINGS_MOMENTUM_CONTRACT = Object.freeze({
  events: Object.freeze({
    momentum: 'spell:momentum',
    tuning: 'spw:settings-momentum',
  }),
  attributes: Object.freeze({
    settingsMomentum: 'data-spw-settings-momentum',
    spellMomentum: 'data-spw-spell-momentum',
    tuningPhase: 'data-spw-settings-tuning-phase',
  }),
});

function pulseMomentum(html, phase = 'tuning') {
  writeDatasetValue(html, 'spwSettingsMomentum', 'pulse');
  writeDatasetValue(html, 'spwSpellMomentum', 'tuning');
  writeDatasetValue(html, 'spwSettingsTuningPhase', phase);
  writeDatasetValue(html, 'spwFreshnessPulse', 'settings-tuning');

  if (momentumTimer) window.clearTimeout(momentumTimer);
  const momentumMs = readMomentumMs(html);
  momentumTimer = window.setTimeout(() => {
    delete html.dataset.spwSettingsMomentum;
    delete html.dataset.spwSpellMomentum;
    delete html.dataset.spwSettingsTuningPhase;
    delete html.dataset.spwFreshnessPulse;
  }, momentumMs);
}

export function initSettingsMomentum(ctx) {
  if (initialized) return () => {};
  initialized = true;

  const html = document.documentElement;

  const onSettingsChange = (event) => {
    const phase = event?.detail?.currentDevelopmentalClimate
      || event?.detail?.authorMode
      || 'tuning';
    pulseMomentum(html, String(phase));

    const payload = {
      source: 'settings',
      phase,
      route: ctx?.route || document.body?.dataset?.spwSurface || 'default',
      detail: event?.detail || {},
    };

    if (ctx?.bus?.emit) {
      ctx.bus.emit(SPW_SETTINGS_MOMENTUM_CONTRACT.events.momentum, payload);
      ctx.bus.emit(SPW_SETTINGS_MOMENTUM_CONTRACT.events.tuning, payload);
    } else {
      document.dispatchEvent(new CustomEvent(SPW_SETTINGS_MOMENTUM_CONTRACT.events.momentum, { detail: payload }));
    }
  };

  document.addEventListener('spw:settings-change', onSettingsChange, { passive: true });
  document.addEventListener('spw:settings:changed', onSettingsChange, { passive: true });

  return () => {
    document.removeEventListener('spw:settings-change', onSettingsChange);
    document.removeEventListener('spw:settings:changed', onSettingsChange);
    if (momentumTimer) window.clearTimeout(momentumTimer);
    momentumTimer = 0;
    delete html.dataset.spwSettingsMomentum;
    delete html.dataset.spwSpellMomentum;
    delete html.dataset.spwSettingsTuningPhase;
    initialized = false;
  };
}