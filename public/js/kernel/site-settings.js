/**
 * Site settings public entry — re-exports profiles, engine, and UI bindings.
 */

import { AUTHOR_WORKFLOW_DEFINITIONS } from '/public/js/kernel/shared.js';
import {
  DEVELOPMENTAL_CLIMATES,
  PRESETS,
  PRESET_DESCRIPTIONS,
  PRESET_LABELS,
  SETTINGS_QUERY_RECIPES,
  UX_RECIPES,
  buildSettingsQueryHref,
  buildSettingsQuerySearch,
} from './site-settings-profiles.js';
import {
  applySiteSettings,
  describeDeviation,
  findActivePreset,
  getSettingValue,
  getSiteSettingDeviations,
  getSiteSettingModifiers,
  getSiteSettings,
  manager,
  resetSingleSetting,
  resetSiteSettings,
  sanitizePartialSettings,
  saveSiteSettings,
  setBaseMetamaterial,
  setClearContrastMatte,
  setFontSizeScale,
  setHighContrast,
  validatePartialSettings,
  validateSetting,
  buildSettingsShareHref,
} from './site-settings-engine.js';
import {
  applyUxRecipe,
  bindDeviationControls,
  bindSettingsField,
  bindSettingsReadouts,
  bindSettingsScope,
  bindStandaloneSettingTriggers,
  initSiteSettingsBindings,
  syncSettingsUx,
} from './site-settings-ui.js';

export * from './site-settings-profiles.js';
export * from './site-settings-engine.js';
export * from './site-settings-ui.js';

if (typeof window !== 'undefined') {
  window.spwSettings = {
    get: getSiteSettings,
    getModifiers: getSiteSettingModifiers,
    getValue: getSettingValue,
    save: saveSiteSettings,
    reset: resetSiteSettings,
    resetOne: resetSingleSetting,
    apply: applySiteSettings,
    validateSetting,
    validatePartialSettings,
    sanitizePartialSettings,
    bindSettingsScope,
    bindSettingsField,
    bindStandaloneSettingTriggers,
    bindSettingsReadouts,
    bindDeviationControls,
    listDeviations: getSiteSettingDeviations,
    describeDeviation,
    setBaseMetamaterial,
    setHighContrast,
    setFontSizeScale,
    setClearContrastMatte,
    presets: PRESETS,
    presetLabels: PRESET_LABELS,
    presetDescriptions: PRESET_DESCRIPTIONS,
    queryRecipes: SETTINGS_QUERY_RECIPES,
    buildSettingsQueryHref,
    buildSettingsQuerySearch,
    buildSettingsShareHref,
    recipes: UX_RECIPES,
    applyRecipe: applyUxRecipe,
    findActivePreset,
    authorWorkflows: AUTHOR_WORKFLOW_DEFINITIONS,
    developmentalClimates: DEVELOPMENTAL_CLIMATES,
    syncUx: syncSettingsUx,
    describePreset: (name) => manager.describePreset(name),
    initBindings: initSiteSettingsBindings,
    manager,
  };
}