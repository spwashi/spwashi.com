/**
 * Site Settings Manager
 * ---------------------------------------------------------------------------
 * Central hub for site-wide preferences.
 *
 * This version treats author workflow and developmental climate as separate
 * settings axes:
 * - authorMode: draft / revise / polish / publish / archive
 * - currentDevelopmentalClimate: orient / anchor / weave / rehearse / offer
 *
 * The manager normalizes persisted settings, applies datasets and CSS custom
 * properties to the document, and exposes derived modifiers. Form bindings
 * stay in site-settings-ui.js and load only when a settings scope exists.
 */

import { bus } from '/public/js/kernel/bus.js';
import {
  AUTHOR_WORKFLOW_DEFINITIONS,
  AUTHOR_WORKFLOW_MODES,
  normalizeAuthorMode,
  normalizeDevelopmentalClimate,
  normalizeComponentMotif,
  PEDAGOGICAL_FLAVOR_TO_COMPONENT_MOTIF
} from '/public/js/kernel/shared.js';
import { markLayoutTrope } from '/public/js/kernel/instrumentation.js';
import { parseModularQuery } from './query-composer.js';
import {
  buildLayoutPostureDatasets,
  buildSettingsShareHref,
  PARITY_QUERY_KEYS,
  queryParamsToSettingsPartial,
  syncUrlFromSettings,
} from './settings-query-parity.js';
import {
  DEFAULT_PALETTE_RESONANCE,
  PALETTE_RESONANCE_OPTIONS,
  getPaletteDepthSwatches,
  getPaletteResonanceSwatches,
  normalizePaletteResonance
} from '/public/js/interface/palette-resonance.js';
import { shouldDisableServiceWorkerInDevelopment } from '/public/js/kernel/runtime-environment.js';
import {
  clearPins,
  getPinStorageKey,
  readPins,
} from '/public/js/runtime/pin-registry.js';

import {
  AUTHOR_WORKFLOW_TOKEN_VALUE,
  CAULDRON_STORAGE_KEY,
  COMPONENT_COLLECTION_STORAGE_KEY,
  DEFAULT_SITE_SETTINGS,
  DEVELOPMENTAL_CLIMATES,
  DISCOVERY_DISMISSALS_STORAGE_KEY,
  ENHANCEMENT_FACTOR,
  FIELD_RESONANCE_PROFILE,
  FONT_SIZE_PRESET_MULTIPLIER,
  GRAIN_INTENSITY_VALUE,
  HEADER_OPACITY_VALUE,
  ICON_PACK_OPTIONS,
  INFOSPACE_FACTOR,
  INTERACTION_TUNER_PROFILE,
  LINE_SPACING_VALUE,
  MONOSPACE_FONT_VALUE,
  MOTION_INTENSITY_MULTIPLIER,
  ANIMATION_THROTTLE_MULTIPLIER,
  OPERATOR_PRESENTATION_FACTOR,
  OPERATOR_SATURATION_FACTOR,
  SEMANTIC_DENSITY_FACTOR,
  SEMANTIC_GRAIN_OFFSET,
  SETTING_OPTIONS,
  SETTING_VALUE_LABELS,
  SETTINGS_QUERY_RECIPES,
  SITE_SETTINGS_KEY,
  SPACING_TUNER_PROFILE,
  COLOR_TUNER_PROFILE,
  LAYOUT_TUNER_PROFILE,
  CONTOUR_PROFILE,
  STROKE_PROFILE,
  SVG_SCALE_PROFILE,
  SVG_STORY_PROFILE,
  THEME_PACK_OPTIONS,
  TUNING_LEXICON,
  TUNING_LEXICON_BY_SETTING,
  UX_RECIPES,
  VISITED_IMAGE_STORAGE_KEY,
  WONDER_MEMORY_PROFILE,
  PRESETS,
  PRESET_LABELS,
  PRESET_DESCRIPTIONS,
  buildSettingsQueryHref,
  buildSettingsQuerySearch,
  buildQueryString,
} from './site-settings-profiles.js';
import { ensureThemePackStyles } from './theme-pack-loader.js';

const PWA_PROMPT_DISMISSAL_STORAGE_KEYS = Object.freeze({
  install: 'spw-pwa-install-dismissed',
  iosHint: 'spw-pwa-ios-hint-dismissed',
});

const QUERY_SETTING_ALIASES = Object.freeze({
  lighting: 'colorTuner',
  color: 'colorTuner',
  layout: 'layoutTuner',
  spacing: 'spacingTuner',
  interaction: 'interactionTuner',
  flavor: 'pedagogicalFlavor',
  lifecycle: 'componentLifecycle',
  narrative: 'narrativeMode',
  'narrative-mode': 'narrativeMode',
  // Expanded for discoverability + wiring consistency across design/palettes/settings links and direct ? visits.
  // These are the common "tuner" and material levers surfaced in the design hub, palettes, and runtime labs.
  physics: 'physicsReason',
  'physics-reason': 'physicsReason',
  palette: 'paletteResonance',
  'palette-resonance': 'paletteResonance',
  material: 'baseMetamaterial',
  'base-metamaterial': 'baseMetamaterial',
  'high-contrast': 'highContrast',
  'component-density': 'componentDensity',
  'semantic-density': 'semanticDensity',
  explore: 'explorePosture',
  'explore-posture': 'explorePosture',
  enhancement: 'enhancementLevel',
  'enhancement-level': 'enhancementLevel',
  'cauldron-visibility': 'cauldronCandidateVisibility',
  'cauldron-candidate-visibility': 'cauldronCandidateVisibility',
  stance: 'metacognitiveStance',
  'metacognitive-stance': 'metacognitiveStance',
  'posture-stance': 'metacognitiveStance',
  self: 'attentionSelfRelation',
  'self-relation': 'attentionSelfRelation',
  local: 'attentionLocalRelation',
  'local-relation': 'attentionLocalRelation',
  global: 'attentionGlobalRelation',
  horizon: 'attentionGlobalRelation',
  'global-relation': 'attentionGlobalRelation',
  'operational-visibility': 'operationalVisibility',
  'ops-visibility': 'operationalVisibility',
  motif: 'componentMotif',
  'component-motif': 'componentMotif'
});

const parseSettingsFromSearch = (search = window.location.search) => {
  const { params } = parseModularQuery(search);
  const fromParity = queryParamsToSettingsPartial(params);
  const next = {};

  Object.entries(fromParity).forEach(([name, value]) => {
    if (!isKnownSetting(name)) return;
    if (validateSetting(name, value).valid) next[name] = value;
  });

  const paramsRaw = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  paramsRaw.forEach((value, key) => {
    const normalizedKey = String(key || '').trim().toLowerCase();
    if (PARITY_QUERY_KEYS.has(normalizedKey)) return;

    const settingName = QUERY_SETTING_ALIASES[normalizedKey] || QUERY_SETTING_ALIASES[key] || key;
    if (!isKnownSetting(settingName)) return;
    if (validateSetting(settingName, value).valid) next[settingName] = value;
  });

  return next;
};

const storage = {
  get() {
    try {
      const raw = localStorage.getItem(SITE_SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      if (isLocalDev()) console.debug('[site-settings] storage read failed (impossible in some envs)', e);
      return {};
    }
  },
  set(settings) {
    try {
      localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      if (isLocalDev()) console.debug('[site-settings] storage write failed (impossible in some envs)', e);
      /* non-fatal */
    }
  },
  clear() {
    try {
      localStorage.removeItem(SITE_SETTINGS_KEY);
    } catch (e) {
      if (isLocalDev()) console.debug('[site-settings] storage clear failed (impossible in some envs)', e);
      /* non-fatal */
    }
  }
};

const isKnownSetting = (name) => Object.prototype.hasOwnProperty.call(DEFAULT_SITE_SETTINGS, name);

const normalizeSiteSettings = (value = {}) => {
  const settings = {...DEFAULT_SITE_SETTINGS};

  Object.keys(settings).forEach((key) => {
    const candidate = key === 'paletteResonance'
      ? normalizePaletteResonance(value[key])
      : value[key];
    if (SETTING_OPTIONS[key]?.has(candidate)) settings[key] = candidate;
  });

  settings.authorMode = normalizeAuthorMode(settings.authorMode);
  settings.currentDevelopmentalClimate = normalizeDevelopmentalClimate(settings.currentDevelopmentalClimate);

  return settings;
};

const validateSetting = (name, value) => {
  if (!isKnownSetting(name)) {
    return {valid: false, name, value, reason: 'unknown-setting', allowedValues: []};
  }

  const resolved = name === 'paletteResonance' ? normalizePaletteResonance(value) : value;
  const valid = SETTING_OPTIONS[name]?.has(resolved) || false;

  return {
    valid,
    name,
    value,
    reason: valid ? null : 'invalid-option',
    allowedValues: SETTING_OPTIONS[name] ? [...SETTING_OPTIONS[name]] : []
  };
};

const validatePartialSettings = (partial = {}) => {
  const results = Object.entries(partial).map(([name, value]) => validateSetting(name, value));
  return {
    valid: results.every((result) => result.valid),
    results,
    errors: results.filter((result) => !result.valid)
  };
};

const sanitizePartialSettings = (partial = {}) => {
  const next = {};
  Object.entries(partial).forEach(([name, value]) => {
    if (validateSetting(name, value).valid) next[name] = value;
  });
  return next;
};

const listDeviations = (settings = normalizeSiteSettings(storage.get())) => {
  const normalized = normalizeSiteSettings(settings);
  return Object.keys(DEFAULT_SITE_SETTINGS)
    .filter((key) => normalized[key] !== DEFAULT_SITE_SETTINGS[key])
    .map((key) => ({name: key, default: DEFAULT_SITE_SETTINGS[key], current: normalized[key]}));
};

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

const getRootFontSize = (settings) => {
  const scale = Number(settings.fontSizeScale) || 100;
  const presetMultiplier = FONT_SIZE_PRESET_MULTIPLIER[settings.fontSize] || 1;
  return `${Math.round(scale * presetMultiplier)}%`;
};

const getGrainOpacity = (settings) => {
  const base = GRAIN_INTENSITY_VALUE[settings.grainIntensity] ?? GRAIN_INTENSITY_VALUE.subtle;
  const semanticOffset = SEMANTIC_GRAIN_OFFSET[settings.semanticDensity] ?? 0;
  return String(clampNumber(base + semanticOffset, 0, 0.08));
};

const getMotionScale = (settings) => {
  if (settings.reduceMotion === 'on') return 0.01;
  const intensity = MOTION_INTENSITY_MULTIPLIER[settings.animationIntensity] || 1;
  const throttle = ANIMATION_THROTTLE_MULTIPLIER[settings.animationThrottling] || 1;
  return intensity * throttle;
};

const getDuration = (settings, milliseconds) => `${Math.max(1, Math.round(milliseconds * getMotionScale(settings)))}ms`;

const getDevelopmentalClimateDefinition = (settings) => (
  DEVELOPMENTAL_CLIMATES[normalizeDevelopmentalClimate(settings.currentDevelopmentalClimate)] || DEVELOPMENTAL_CLIMATES.orient
);

const getAuthorWorkflowDefinition = (settings) => (
  AUTHOR_WORKFLOW_DEFINITIONS[normalizeAuthorMode(settings.authorMode)] || AUTHOR_WORKFLOW_DEFINITIONS.draft
);

const getAuthorWorkflowTokens = (settings) => (
  AUTHOR_WORKFLOW_TOKEN_VALUE[normalizeAuthorMode(settings.authorMode)] || AUTHOR_WORKFLOW_TOKEN_VALUE.draft
);

const getWonderMemoryProfile = (settings) => (
  WONDER_MEMORY_PROFILE[settings.wonderMemory] || WONDER_MEMORY_PROFILE.nearby
);

const humanizeSettingName = (name = '') => String(name)
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .trim()
  .toLowerCase();

const describeSettingValue = (name, value) => SETTING_VALUE_LABELS[name]?.[value] || String(value ?? '—');
const safeParseStorageJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeStorageTimestamp = (value) => {
  if (!value || value === true || value === 1) return '';

  const numeric = typeof value === 'number'
    ? value
    : /^\d{10,13}$/.test(String(value))
      ? Number(value)
      : Number.NaN;
  const date = new Date(Number.isFinite(numeric)
    ? (numeric < 1e12 ? numeric * 1000 : numeric)
    : value);

  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

const readStorageMarker = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { active: false, timestamp: '' };

    let value = raw;
    try {
      value = JSON.parse(raw);
    } catch {
      // Existing markers are plain strings; future writers may store timestamped JSON.
    }

    const timestampValue = value && typeof value === 'object'
      ? value.dismissedAt || value.timestamp || value.updatedAt
      : value;

    return {
      active: true,
      timestamp: normalizeStorageTimestamp(timestampValue),
    };
  } catch {
    return { active: false, timestamp: '' };
  }
};

const formatStorageTimestamp = (value) => {
  if (!value) return 'not recorded';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'not recorded';
    return date.toLocaleString();
  } catch {
    return 'not recorded';
  }
};

const getLatestTimestamp = (values = [], pick) => {
  const latest = values.reduce((max, value) => {
    const next = pick(value);
    if (!next) return max;
    if (!max) return next;
    return new Date(next).getTime() > new Date(max).getTime() ? next : max;
  }, '');
  return latest || '';
};

const clearVisitedImageState = () => {
  document.querySelectorAll('[data-spw-image-managed="true"], [data-spw-image-surface]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    delete node.dataset.spwVisited;
    delete node.dataset.spwVisitBurst;
    node.dataset.spwImageMemoryState = 'fresh';
  });
};

const clearCurrentPinState = () => {
  document.querySelectorAll('[data-spw-pinned], [data-spw-latched]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    delete node.dataset.spwPinned;
    delete node.dataset.spwLatched;
  });
};

const clearComponentCollectionState = () => {
  const html = document.documentElement;
  if (!html) return;
  html.dataset.spwCollectionKinds = '0';
  html.dataset.spwCollectionTotal = '0';
  html.dataset.spwCollectionTier = 'singular';
  delete html.dataset.spwCollectionAchievements;
  delete html.dataset.spwCollectionFresh;
};

const buildPersistenceRegistries = () => ([
  {
    id: 'site-settings',
    label: 'Runtime preferences',
    description: 'Saved site settings that override authored defaults in this browser.',
    scope: 'sitewide preferences',
    source: 'site-settings manager',
    storageKey: SITE_SETTINGS_KEY,
    read() {
      const persisted = storage.get();
      const entries = Object.entries(persisted).filter(([name]) => isKnownSetting(name));
      return {
        count: entries.length,
        latest: '',
        summary: entries.length
          ? `${entries.length} explicit preference override${entries.length === 1 ? '' : 's'}`
          : 'Authored defaults only',
      };
    },
    clear() {
      resetSiteSettings();
    },
  },
  {
    id: 'pwa-prompts',
    label: 'PWA prompt dismissals',
    description: 'Install and iOS home-screen prompt dismissals remembered by this browser.',
    scope: 'sitewide install prompt preferences',
    source: 'PWA update handler',
    storageKey: Object.values(PWA_PROMPT_DISMISSAL_STORAGE_KEYS).join(' / '),
    read() {
      const prompts = [
        {
          label: 'Install prompt',
          ...readStorageMarker(PWA_PROMPT_DISMISSAL_STORAGE_KEYS.install),
        },
        {
          label: 'iOS home-screen hint',
          ...readStorageMarker(PWA_PROMPT_DISMISSAL_STORAGE_KEYS.iosHint),
        },
      ];
      const dismissed = prompts.filter((prompt) => prompt.active);
      const describePrompt = (prompt) => {
        if (!prompt.active) return `${prompt.label}: not dismissed`;
        return `${prompt.label}: dismissed (${formatStorageTimestamp(prompt.timestamp)})`;
      };

      return {
        count: dismissed.length,
        latest: getLatestTimestamp(dismissed, (prompt) => prompt.timestamp),
        summary: prompts.map(describePrompt).join(' · '),
      };
    },
    clear() {
      Object.values(PWA_PROMPT_DISMISSAL_STORAGE_KEYS).forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Storage can be unavailable in private or sandboxed contexts.
        }
      });
    },
  },
  {
    id: 'pins',
    label: 'Pinned frames',
    description: 'Frames and sigils remembered through brace pinning and bookmark surfaces.',
    scope: 'route-aware memory register',
    source: 'brace gestures and bookmark register',
    storageKey: getPinStorageKey(),
    read() {
      const pins = Object.values(readPins());
      return {
        count: pins.length,
        latest: getLatestTimestamp(pins, (pin) => pin.timestamp),
        summary: pins.length
          ? `${pins.length} pinned frame${pins.length === 1 ? '' : 's'}`
          : 'No pinned frames',
      };
    },
    clear() {
      clearPins();
      clearCurrentPinState();
    },
  },
  {
    id: 'cauldron',
    label: 'Cauldron ingredients',
    description: 'Captured expressions waiting to be mixed into a prompt or seed.',
    scope: 'composition scratch register',
    source: 'cauldron',
    storageKey: CAULDRON_STORAGE_KEY,
    read() {
      const items = safeParseStorageJson(CAULDRON_STORAGE_KEY, []);
      return {
        count: items.length,
        latest: getLatestTimestamp(items, (item) => item.capturedAt),
        summary: items.length
          ? `${items.length} ingredient${items.length === 1 ? '' : 's'} captured`
          : 'No saved ingredients',
      };
    },
    clear() {
      localStorage.removeItem(CAULDRON_STORAGE_KEY);
      // G1 bundle form (see interface/cauldron/contract.js); kernel avoids the interface import
      document.documentElement.dataset.spwCauldronState = 'phase:empty count:0';
      bus.emit?.('cauldron:cleared', {});
    },
  },
  {
    id: 'discovery-dismissals',
    label: 'Discovery dismissals',
    description: 'Dismissed promo notices that stay hidden until a later cycle becomes eligible.',
    scope: 'promo cadence register',
    source: 'discovery notices',
    storageKey: DISCOVERY_DISMISSALS_STORAGE_KEY,
    read() {
      const dismissals = safeParseStorageJson(DISCOVERY_DISMISSALS_STORAGE_KEY, {});
      const entries = Object.entries(dismissals);
      return {
        count: entries.length,
        latest: '',
        summary: entries.length
          ? `${entries.length} dismissed notice${entries.length === 1 ? '' : 's'}`
          : 'No dismissed notices',
      };
    },
    clear() {
      localStorage.removeItem(DISCOVERY_DISMISSALS_STORAGE_KEY);
      document.dispatchEvent(new CustomEvent('spw:discovery-dismissals-changed', {
        detail: { storageKey: DISCOVERY_DISMISSALS_STORAGE_KEY, cleared: true },
      }));
    },
  },
  {
    id: 'visited-images',
    label: 'Visited image surfaces',
    description: 'Image metaphysics memory marking which surfaces were held long enough to become visited.',
    scope: 'image memory register',
    source: 'image metaphysics',
    storageKey: VISITED_IMAGE_STORAGE_KEY,
    read() {
      const visited = Object.values(safeParseStorageJson(VISITED_IMAGE_STORAGE_KEY, {}));
      return {
        count: visited.length,
        latest: getLatestTimestamp(visited, (entry) => entry.visitedAt),
        summary: visited.length
          ? `${visited.length} visited image surface${visited.length === 1 ? '' : 's'}`
          : 'No visited image surfaces',
      };
    },
    clear() {
      localStorage.removeItem(VISITED_IMAGE_STORAGE_KEY);
      clearVisitedImageState();
    },
  },
  {
    id: 'component-collection',
    label: 'Component collection',
    description: 'Distinct component kinds and achievements discovered while moving through the site.',
    scope: 'sitewide component-memory register',
    source: 'component collection runtime',
    storageKey: COMPONENT_COLLECTION_STORAGE_KEY,
    read() {
      const collection = safeParseStorageJson(COMPONENT_COLLECTION_STORAGE_KEY, {});
      const kinds = collection.kinds && typeof collection.kinds === 'object' ? Object.keys(collection.kinds) : [];
      const achievements = Array.isArray(collection.achievements) ? collection.achievements : [];
      const routes = Array.isArray(collection.routes) ? collection.routes : [];
      return {
        count: kinds.length + achievements.length,
        latest: collection.updatedAt || '',
        summary: kinds.length || achievements.length
          ? [
            `${kinds.length} kind${kinds.length === 1 ? '' : 's'}`,
            `${achievements.length} achievement${achievements.length === 1 ? '' : 's'}`,
            `${routes.length} route${routes.length === 1 ? '' : 's'}`,
          ].join(' · ')
          : 'No component kinds collected',
      };
    },
    clear() {
      const api = window.spwComponentCollection;
      if (api?.reset) {
        api.reset('settings-clear');
        return;
      }

      try {
        localStorage.removeItem(COMPONENT_COLLECTION_STORAGE_KEY);
      } catch {
        // localStorage may be unavailable in private or sandboxed contexts.
      }
      clearComponentCollectionState();
      bus.emit?.('collection-updated', {
        reason: 'settings-clear',
        route: '',
        tier: 'singular',
        newKinds: [],
        distinctKinds: 0,
        achievements: [],
        newlyUnlocked: [],
        reset: true,
      });
    },
  },
]);

const describeSettingsPatch = (partial = {}) => Object.entries(partial)
  .filter(([name]) => isKnownSetting(name))
  .map(([name, value]) => `${humanizeSettingName(name)} → ${describeSettingValue(name, value)}`)
  .join(' · ');

const getPresetSettings = (name) => {
  const preset = PRESETS[name];
  if (!preset) return null;
  return normalizeSiteSettings({...DEFAULT_SITE_SETTINGS, ...preset});
};

const presetMatchesSettings = (presetName, settings = getSiteSettings()) => {
  const preset = getPresetSettings(presetName);
  if (!preset) return false;
  const normalized = normalizeSiteSettings(settings);
  return Object.keys(DEFAULT_SITE_SETTINGS).every((key) => normalized[key] === preset[key]);
};

const presetIsSubsetOfSettings = (presetName, settings = getSiteSettings()) => {
  const preset = PRESETS[presetName];
  if (!preset) return false;
  const normalized = normalizeSiteSettings(settings);
  return Object.entries(preset).every(([key, value]) => normalized[key] === value);
};

const findActivePreset = (settings = getSiteSettings()) => (
  Object.keys(PRESETS).find((presetName) => presetMatchesSettings(presetName, settings))
  || Object.keys(PRESETS).find((presetName) => presetIsSubsetOfSettings(presetName, settings))
  || null
);

const getUxRecipe = (name) => UX_RECIPES[name] || null;

const applyPaletteResonanceSwatches = (root, settings) => {
  const swatches = getPaletteResonanceSwatches(settings.paletteResonance);
  const depth = getPaletteDepthSwatches(settings.paletteResonance);

  for (let index = 0; index < 4; index += 1) {
    const value = swatches[index];
    const name = `--spw-palette-probe-${index + 1}`;
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  }

  const depthNames = ['--spw-palette-depth-shadow', '--spw-palette-depth-highlight', '--spw-palette-depth-glow'];
  depthNames.forEach((name, index) => {
    const value = depth[index];
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  });
};

const applyImageLoadingPreference = (settings, root = document) => {
  root.querySelectorAll?.('img').forEach((image) => {
    if (!image.dataset.spwLoadingOriginal) {
      image.dataset.spwLoadingOriginal = image.getAttribute('loading') || '';
    }

    const original = image.dataset.spwLoadingOriginal;

    if (settings.imageLazyLoading === 'off' && original === 'lazy') image.setAttribute('loading', 'eager');
    else if (original) image.setAttribute('loading', original);
    else image.removeAttribute('loading');
  });
};

const setDatasetEntries = (root, entries = {}) => {
  if (!(root instanceof HTMLElement)) return;
  Object.entries(entries).forEach(([key, value]) => {
    if (value === undefined || value === null) delete root.dataset[key];
    else root.dataset[key] = String(value);
  });
};

const setStyleProperties = (root, entries = {}) => {
  if (!(root instanceof HTMLElement)) return;
  Object.entries(entries).forEach(([name, value]) => {
    if (value === undefined || value === null || value === '') root.style.removeProperty(name);
    else root.style.setProperty(name, String(value));
  });
};

const deriveArchitecturalModifiers = (settings) => {
  const climate = getDevelopmentalClimateDefinition(settings);
  const authorWorkflow = getAuthorWorkflowDefinition(settings);
  const authorTokens = getAuthorWorkflowTokens(settings);
  const motionScale = getMotionScale(settings);
  const semanticDensityFactor = SEMANTIC_DENSITY_FACTOR[settings.semanticDensity] || 1;
  const enhancementFactor = ENHANCEMENT_FACTOR[settings.enhancementLevel] || 1;
  const infospaceFactor = INFOSPACE_FACTOR[settings.infospaceComplexity] || 1;
  const operatorPresentationFactor = OPERATOR_PRESENTATION_FACTOR[settings.operatorPresentation] || 1;
  const operatorSaturationFactor = OPERATOR_SATURATION_FACTOR[settings.operatorSaturation] || 1;
  const numericityEmphasisFactor = settings.numericityEmphasis === 'prominent' ? 1.35 : settings.numericityEmphasis === 'cauldron-first' ? 1.6 : 1;
  const cognitiveFactor = settings.cognitiveHandles === 'on' ? 1 : 0;
  const relationalFactor = settings.relationalVisualization === 'on' ? 1 : 0;
  const metadataFactor = settings.showSemanticMetadata === 'on' ? 1 : 0;
  const wonderProfile = getWonderMemoryProfile(settings);
  const contourProfile = CONTOUR_PROFILE[settings.contourProfile] || CONTOUR_PROFILE.balanced;
  const strokeProfile = STROKE_PROFILE[settings.strokeProfile] || STROKE_PROFILE.structural;
  const svgScaleProfile = SVG_SCALE_PROFILE[settings.svgScaleProfile] || SVG_SCALE_PROFILE.balanced;
  const svgStoryProfile = SVG_STORY_PROFILE[settings.svgStoryProfile] || SVG_STORY_PROFILE.guided;
  const fieldResonance = FIELD_RESONANCE_PROFILE[settings.fieldResonance] || FIELD_RESONANCE_PROFILE.field;
  const colorTuner = COLOR_TUNER_PROFILE[settings.colorTuner] || COLOR_TUNER_PROFILE.balanced;
  const spacingTuner = SPACING_TUNER_PROFILE[settings.spacingTuner] || SPACING_TUNER_PROFILE.balanced;
  const layoutTuner = LAYOUT_TUNER_PROFILE[settings.layoutTuner] || LAYOUT_TUNER_PROFILE.reading;
  const interactionTuner = INTERACTION_TUNER_PROFILE[settings.interactionTuner] || INTERACTION_TUNER_PROFILE.calm;
  const motionIntensity = MOTION_INTENSITY_MULTIPLIER[settings.animationIntensity] || 1;
  const animationThrottle = ANIMATION_THROTTLE_MULTIPLIER[settings.animationThrottling] || 1;
  const reduceMotionDamp = settings.reduceMotion === 'on' ? 0.38 : 1;
  const freshnessWeight = clampNumber(
    (interactionTuner.freshness ?? 0.62)
      * enhancementFactor
      * motionIntensity
      * reduceMotionDamp,
    0.12,
    1,
  );
  const pulseIntensity = clampNumber(
    (interactionTuner.pulseScale ?? interactionTuner.scale)
      * enhancementFactor
      * motionIntensity,
    0.72,
    1.32,
  );
  const beatTempo = clampNumber(
    (interactionTuner.beatTempo ?? interactionTuner.scale)
      * animationThrottle
      * reduceMotionDamp,
    0.32,
    2.4,
  );
  const pulseDurationMs = Math.round(clampNumber(280 / pulseIntensity, 160, 520));
  const beatIntervalMs = Math.round(clampNumber(1300 / beatTempo, 520, 2800));
  const materialBlur = `${clampNumber(contourProfile.materialBlurPx * fieldResonance.materialBlurScale, 2, 16)}px`;

  const ecology = Object.freeze({
    clarity: clampNumber(climate.clarity * enhancementFactor, 0, 1),
    pressure: clampNumber(climate.pressure * infospaceFactor, 0, 1),
    atmosphere: clampNumber(climate.atmosphere * enhancementFactor, 0, 1),
    memory: clampNumber(climate.memory * semanticDensityFactor, 0, 1),
    resonance: clampNumber(climate.resonance * (1 + (relationalFactor * 0.18)), 0, 1),
    chargeBias: clampNumber(climate.chargeBias * operatorSaturationFactor, 0, 1),
    selectionBias: clampNumber(climate.selectionBias * semanticDensityFactor, 0, 1),
    permeabilityBase: clampNumber(
      0.18
      + (settings.enhancementLevel === 'rich' ? 0.16 : settings.enhancementLevel === 'balanced' ? 0.08 : 0)
      + (cognitiveFactor * 0.18)
      + (metadataFactor * 0.12)
      + (settings.implementationMutations === 'on' ? 0.18 : 0),
      0,
      1
    )
  });

  return Object.freeze({
    author: Object.freeze({
      mode: normalizeAuthorMode(settings.authorMode),
      label: authorWorkflow.label,
      intent: authorWorkflow.intent,
      description: authorWorkflow.description,
      emphasis: authorWorkflow.emphasis || [],
      annotationStrength: authorTokens.annotationStrength,
      marginPresence: authorTokens.marginPresence,
      threadDensity: authorTokens.threadDensity,
      draftPrivacy: authorTokens.draftPrivacy,
      publicationReadiness: authorTokens.publicationReadiness
    }),
    climate: Object.freeze({
      ...climate,
      authorLabel: climate.authorLabel || climate.label
    }),
    typography: Object.freeze({
      rootFontSize: getRootFontSize(settings),
      lineHeight: LINE_SPACING_VALUE[settings.lineSpacing] || LINE_SPACING_VALUE.normal,
      monoFont: MONOSPACE_FONT_VALUE[settings.monospaceVariant] || MONOSPACE_FONT_VALUE.jetbrains,
      headerOpacity: HEADER_OPACITY_VALUE[settings.headerOpacity] || HEADER_OPACITY_VALUE.normal
    }),
    motion: Object.freeze({
      scale: motionScale,
      instant: getDuration(settings, 50),
      fast: getDuration(settings, 120),
      base: getDuration(settings, 200),
      slow: getDuration(settings, 400)
    }),
    grain: Object.freeze({opacity: getGrainOpacity(settings)}),
    tuning: Object.freeze({
      lightingGuard: colorTuner.lightingGuard,
      regionFrameAlpha: colorTuner.regionFrameAlpha,
      regionFillAlpha: colorTuner.regionFillAlpha,
      controlContrastLift: colorTuner.controlContrastLift,
      spacingScale: spacingTuner.scale,
      layoutMeasure: layoutTuner.measure,
      /* Default tuner is "reading". That must not shrink an authored
         newspaper/wide/atlas route to 56rem. Only a user deviation tightens. */
      layoutFrameMax: settings.layoutTuner === DEFAULT_SITE_SETTINGS.layoutTuner
        ? '100%'
        : layoutTuner.frameMax,
      layoutColumnMin: layoutTuner.columnMin,
      interactionScale: interactionTuner.scale,
      pulseIntensity,
      beatTempo,
      freshnessWeight,
      pulseDurationMs,
      beatIntervalMs,
    }),
    ecology,
    semantic: Object.freeze({
      densityFactor: semanticDensityFactor,
      enhancementFactor,
      infospaceFactor,
      operatorPresentationFactor,
      operatorSaturationFactor,
      numericityEmphasisFactor,
      cognitiveFactor,
      relationalFactor,
      metadataFactor
    }),
    contour: Object.freeze({
      shapeElement: contourProfile.shapeElement,
      shapeComponent: contourProfile.shapeComponent,
      shapeSurface: contourProfile.shapeSurface,
      shapeFloating: contourProfile.shapeFloating,
      edgeSoftness: contourProfile.edgeSoftness,
      materialBlur
    }),
    stroke: Object.freeze({
      lineMid: strokeProfile.lineMid,
      lineThick: strokeProfile.lineThick,
      lineHeavy: strokeProfile.lineHeavy,
      boundaryRailWidth: strokeProfile.boundaryRailWidth,
      boundaryRailWidthStrong: strokeProfile.boundaryRailWidthStrong,
      fixtureAnnotationWeight: strokeProfile.fixtureAnnotationWeight,
      svgStrokeScale: strokeProfile.svgStrokeScale,
      svgFlowDash: strokeProfile.svgFlowDash,
      svgFlowGap: strokeProfile.svgFlowGap,
      svgLabelSpacing: `${(parseFloat(strokeProfile.svgLabelSpacing) * svgScaleProfile.labelScale).toFixed(2)}em`,
      svgScaleFactor: svgScaleProfile.scaleFactor,
      svgSurfaceMax: svgScaleProfile.surfaceMax,
      svgGapScale: svgScaleProfile.gapScale,
      svgNarrativeIntensity: svgStoryProfile.narrativeIntensity,
      svgRailIntensity: svgStoryProfile.railIntensity,
      svgPointerLift: svgStoryProfile.pointerLift,
      svgCaptionOpacity: svgStoryProfile.captionOpacity
    }),
    field: Object.freeze({
      radius: fieldResonance.attentionFieldRadius,
      decay: fieldResonance.attentionFieldDecay,
      echoDuration: `${fieldResonance.attentionEchoDurationMs}ms`,
      regionFieldIntensity: fieldResonance.regionFieldIntensity
    }),
    wonder: Object.freeze({
      mode: settings.wonderMemory,
      strength: clampNumber(wonderProfile.strength * fieldResonance.wonderStrengthScale, 0, 2),
      ttlMs: wonderProfile.ttlMs,
      reach: clampNumber(wonderProfile.reach * fieldResonance.wonderReachScale, 0, 2)
    })
  });
};

/**
 * Data builder for runtime dataset entries.
 * Extracted for composition, testability, and to keep apply() as a clear pipeline
 * (normalize -> modifiers -> build datasets -> build styles -> side effects -> bus).
 * Supports the "tunable material surface" and cognitive abstractions (physics-reason,
 * locality, density as first-class inspectable state for storytellers/engineers).
 */
const resolveTuningDiscoverability = (settings = {}) => {
  if (settings.cognitiveHandles === 'on') return 'revealed';
  if (settings.explorePosture === 'workshop') return 'revealed';
  if (settings.explorePosture === 'field') return 'ambient';
  if (settings.explorePosture === 'reading') return 'quiet';
  if (settings.semanticDensity === 'rich') return 'revealed';
  if (settings.semanticDensity === 'normal') return 'ambient';
  return 'quiet';
};

const buildDatasetEntries = (normalized, modifiers, deviations, climate) => {
  const deviationNames = deviations.map((entry) => entry.name);
  const entries = {
    authorMode: modifiers.author.mode,
    spwAuthorMode: modifiers.author.mode,
    spwAuthorIntent: modifiers.author.intent,
    spwNavigator: normalized.navigatorDisplay,
    spwSpellPath: normalized.spellPathDisplay,
    spwConsole: normalized.consoleDisplay,
    spwRewardDisplay: normalized.rewardDisplay,
    spwViewportActivation: normalized.viewportActivation,
    spwReduceMotion: normalized.reduceMotion,
    spwHighContrast: normalized.highContrast,
    spwFontSize: normalized.fontSize,
    spwColorMode: normalized.colorMode,
    spwColorTuner: normalized.colorTuner,
    spwThemePack: normalized.themePack,
    spwIconPack: normalized.iconPack,
    spwPedagogicalFlavor: normalized.pedagogicalFlavor,
    spwPaletteResonance: normalized.paletteResonance,
    spwBaseMetamaterial: normalized.baseMetamaterial,
    spwBaseAffordance: normalized.baseAffordance,
    spwComponentDensity: normalized.componentDensity,
    spwOperatorSaturation: normalized.operatorSaturation,
    spwNumericityEmphasis: normalized.numericityEmphasis,
    spwAnimationIntensity: normalized.animationIntensity,
    spwContourProfile: normalized.contourProfile,
    spwStrokeProfile: normalized.strokeProfile,
    spwSvgScaleProfile: normalized.svgScaleProfile,
    spwSvgStoryProfile: normalized.svgStoryProfile,
    spwFieldResonance: normalized.fieldResonance,
    spwSpacingTuner: normalized.spacingTuner,
    spwLayoutTuner: normalized.layoutTuner,
    spwInteractionTuner: normalized.interactionTuner,
    spwComponentLifecycle: normalized.componentLifecycle,
    spwDebugMode: normalized.debugMode,
    spwShowFrameMetadata: normalized.showFrameMetadata,
    spwVerboseLogging: normalized.verboseLogging,
    spwFontSizeScale: normalized.fontSizeScale,
    spwLineSpacing: normalized.lineSpacing,
    spwMonospaceVariant: normalized.monospaceVariant,
    spwTypeset: normalized.typesettingMode,
    spwReadingGrooveMode: normalized.readingGrooveMode,
    spwScrollCadence: normalized.scrollCadence,
    spwPinchTextScale: normalized.pinchTextScale,
    spwShowFooter: normalized.showFooter,
    spwHeaderOpacity: normalized.headerOpacity,
    spwShowSpecPills: normalized.showSpecPills,
    spwAnimationThrottling: normalized.animationThrottling,
    spwImageLazyLoading: normalized.imageLazyLoading,
    spwEnhancementLevel: normalized.enhancementLevel,
    spwCauldronCandidateVisibility: normalized.cauldronCandidateVisibility,
    spwSemanticDensity: normalized.semanticDensity,
    spwOperatorPresentation: normalized.operatorPresentation,
    spwInfospaceComplexity: normalized.infospaceComplexity,
    spwCognitiveHandles: normalized.cognitiveHandles,
    spwExplorePosture: normalized.explorePosture,
    spwDimensionalBreadcrumbs: normalized.dimensionalBreadcrumbs,
    spwFractalNesting: normalized.fractalNesting,
    spwMetacognitiveStance: normalized.metacognitiveStance,
    spwProcessAttention: normalized.processAttention,
    spwAttentionSelfRelation: normalized.attentionSelfRelation,
    spwAttentionLocalRelation: normalized.attentionLocalRelation,
    spwAttentionGlobalRelation: normalized.attentionGlobalRelation,
    spwOverflowMode: normalized.overflowMode,
    spwOperationalVisibility: normalized.operationalVisibility,
    spwImplementationMutations: normalized.implementationMutations,
    spwShowSemanticMetadata: normalized.showSemanticMetadata,
    spwOperatorHighlighting: normalized.operatorHighlighting,
    spwRelationalVisualization: normalized.relationalVisualization,
    spwWonderMemory: normalized.wonderMemory,
    spwNarrativeMode: normalized.narrativeMode,
    spwDevelopmentalIndicators: normalized.developmentalIndicators,
    spwDepthIndicators: normalized.depthIndicators,
    spwDevelopmentalClimate: normalized.currentDevelopmentalClimate,
    spwDevelopmentalLabel: climate.label,
    spwDevelopmentalAuthorLabel: climate.authorLabel,
    spwLearningMode: climate.learningMode,
    spwSpiritPhase: normalized.currentDevelopmentalClimate,
    spwDevelopmentalClimateAutoCycle: normalized.developmentalClimateAutoCycle,
    spwGrainIntensity: normalized.grainIntensity,
    spwBusDiagnostics: normalized.busDiagnostics,
    spwBusMirrorToConsole: normalized.busMirrorToConsole,
    spwBusHistorySize: normalized.busHistorySize,
    spwShellMenuPresentation: normalized.shellMenuPresentation,
    spwPhysicsReason: normalized.physicsReason || null,
    spwDeviationCount: String(deviations.length),
    spwDeviations: deviationNames.join(' ') || null,
    spwDeviationState: deviations.length > 0 ? 'deviated' : 'default',
    spwTuningDiscoverability: resolveTuningDiscoverability(normalized),
    spwFreshnessWeight: modifiers.tuning.freshnessWeight.toFixed(2),
    spwPulseBeatCadence: '13',
  };

  // Semantic currents (emergent clusters...) – kept here as part of the dataset builder.
  const currentSignature = [
    normalized.semanticDensity,
    normalized.interactionTuner || 'balanced',
    document.documentElement?.dataset?.spwLoadPosture || 'normal'
  ].filter(Boolean).join('+');
  entries.spwSemanticCurrent = currentSignature || null;

  Object.assign(entries, buildLayoutPostureDatasets(normalized));

  return entries;
};

class SiteSettingsManager {
  constructor() {
    this.root = document.documentElement;
    this.body = document.body;
    this._initialized = false;
    this._pwaInitialized = false;
    this._settingsCategoryRouting = null;
  }

  get() {
    return normalizeSiteSettings({...storage.get(), ...parseSettingsFromSearch(window.location.search)});
  }

  getModifiers(settings = this.get()) {
    return deriveArchitecturalModifiers(normalizeSiteSettings(settings));
  }

  apply(settings = this.get()) {
    const normalized = normalizeSiteSettings(settings);
    const modifiers = this.getModifiers(normalized);
    const climate = modifiers.climate;
    const deviations = listDeviations(normalized);
    const deviationNames = deviations.map((entry) => entry.name);

    // Use extracted data builder (better composition + pipeline clarity in apply()).
    const datasetEntries = buildDatasetEntries(normalized, modifiers, deviations, climate);

    setDatasetEntries(this.root, datasetEntries);
    if (this.body) {
      const { spwLayout, ...bodyEntries } = datasetEntries;
      setDatasetEntries(this.body, bodyEntries);
    }

    // Theme packs are token overrides in a stylesheet kept out of the core
    // bundle (themes/packs.css). Fetch it only once a non-default pack is
    // actually active — the attribute is already on the root above, so the
    // packs apply the moment the sheet lands.
    ensureThemePackStyles(normalized.themePack);

    const deviationCount = deviations.length;
    if (deviationCount > 0) {
      syncUrlFromSettings(normalized);
      this.root.dataset.spwQueryParity = 'synced';
    } else {
      syncUrlFromSettings(normalized);
      delete this.root.dataset.spwQueryParity;
    }

    setStyleProperties(this.root, {
      '--author-annotation-strength': modifiers.author.annotationStrength,
      '--author-margin-presence': modifiers.author.marginPresence,
      '--author-thread-density': modifiers.author.threadDensity,
      '--author-draft-privacy': modifiers.author.draftPrivacy,
      '--author-publication-readiness': modifiers.author.publicationReadiness,
      '--font-size-scale': `${normalized.fontSizeScale}%`,
      '--site-root-font-size': modifiers.typography.rootFontSize,
      '--site-line-height': modifiers.typography.lineHeight,
      '--site-mono-font': modifiers.typography.monoFont,
      '--site-header-opacity': modifiers.typography.headerOpacity,
      '--duration-instant': modifiers.motion.instant,
      '--duration-fast': modifiers.motion.fast,
      '--duration-base': modifiers.motion.base,
      '--duration-slow': modifiers.motion.slow,
      '--spw-motion-scale': modifiers.motion.scale,
      '--grain-opacity': modifiers.grain.opacity,
      '--spw-semantic-density-factor': modifiers.semantic.densityFactor,
      '--spw-enhancement-factor': modifiers.semantic.enhancementFactor,
      '--spw-infospace-factor': modifiers.semantic.infospaceFactor,
      '--spw-operator-presentation-factor': modifiers.semantic.operatorPresentationFactor,
      '--spw-operator-saturation-factor': modifiers.semantic.operatorSaturationFactor,
      '--spw-numericity-emphasis-factor': modifiers.semantic.numericityEmphasisFactor,
      '--spw-cognitive-handle-factor': modifiers.semantic.cognitiveFactor,
      '--spw-relational-factor': modifiers.semantic.relationalFactor,
      '--spw-semantic-metadata-factor': modifiers.semantic.metadataFactor,
      '--spw-lighting-guard': modifiers.tuning.lightingGuard,
      '--spw-region-frame-alpha': modifiers.tuning.regionFrameAlpha,
      '--spw-region-fill-alpha': modifiers.tuning.regionFillAlpha,
      '--spw-control-contrast-lift': modifiers.tuning.controlContrastLift,
      '--spw-spacing-scale': modifiers.tuning.spacingScale,
      '--spw-layout-measure': modifiers.tuning.layoutMeasure,
      '--spw-layout-frame-max': modifiers.tuning.layoutFrameMax,
      '--spw-layout-column-min': modifiers.tuning.layoutColumnMin,
      '--spw-interaction-scale': modifiers.tuning.interactionScale,
      '--spw-microinteraction-pulse-duration': `${modifiers.tuning.pulseDurationMs}ms`,
      '--spw-microinteraction-pulse-intensity': modifiers.tuning.pulseIntensity.toFixed(2),
      '--spw-beat-interval-ms': String(modifiers.tuning.beatIntervalMs),
      '--spw-freshness-weight': modifiers.tuning.freshnessWeight.toFixed(2),
      '--spw-site-rhythm-tempo': modifiers.tuning.beatTempo.toFixed(2),
      '--shape-element': modifiers.contour.shapeElement,
      '--shape-component': modifiers.contour.shapeComponent,
      '--shape-surface': modifiers.contour.shapeSurface,
      '--shape-floating': modifiers.contour.shapeFloating,
      '--edge-softness': modifiers.contour.edgeSoftness,
      '--material-blur': modifiers.contour.materialBlur,
      '--line-mid': modifiers.stroke.lineMid,
      '--line-thick': modifiers.stroke.lineThick,
      '--line-heavy': modifiers.stroke.lineHeavy,
      '--boundary-rail-width': modifiers.stroke.boundaryRailWidth,
      '--boundary-rail-width-strong': modifiers.stroke.boundaryRailWidthStrong,
      '--fixture-annotation-weight': modifiers.stroke.fixtureAnnotationWeight,
      '--spw-svg-stroke-scale': modifiers.stroke.svgStrokeScale,
      '--spw-svg-flow-dash': modifiers.stroke.svgFlowDash,
      '--spw-svg-flow-gap': modifiers.stroke.svgFlowGap,
      '--spw-svg-label-spacing': modifiers.stroke.svgLabelSpacing,
      '--spw-svg-scale-factor': modifiers.stroke.svgScaleFactor,
      '--spw-svg-surface-max': modifiers.stroke.svgSurfaceMax,
      '--spw-svg-gap-scale': modifiers.stroke.svgGapScale,
      '--spw-svg-narrative-intensity': modifiers.stroke.svgNarrativeIntensity,
      '--spw-svg-rail-intensity': modifiers.stroke.svgRailIntensity,
      '--spw-svg-pointer-lift': modifiers.stroke.svgPointerLift,
      '--spw-svg-caption-opacity': modifiers.stroke.svgCaptionOpacity,
      '--attention-field-radius': modifiers.field.radius,
      '--attention-field-decay': modifiers.field.decay,
      '--attention-echo-duration': modifiers.field.echoDuration,
      '--spw-region-field-intensity': modifiers.field.regionFieldIntensity,
      '--spw-wonder-memory-strength': modifiers.wonder.strength,
      '--spw-wonder-memory-ttl-ms': modifiers.wonder.ttlMs,
      '--spw-wonder-memory-reach': modifiers.wonder.reach,
      '--climate-clarity-bias': modifiers.ecology.clarity,
      '--climate-pressure-bias': modifiers.ecology.pressure,
      '--climate-atmosphere-bias': modifiers.ecology.atmosphere,
      '--climate-memory-bias': modifiers.ecology.memory,
      '--climate-resonance-bias': modifiers.ecology.resonance,
      '--climate-charge-bias': modifiers.ecology.chargeBias,
      '--climate-selection-bias': modifiers.ecology.selectionBias,
      '--spw-developmental-clarity': modifiers.ecology.clarity,
      '--spw-developmental-pressure': modifiers.ecology.pressure,
      '--spw-developmental-atmosphere': modifiers.ecology.atmosphere,
      '--spw-developmental-memory': modifiers.ecology.memory,
      '--spw-developmental-resonance': modifiers.ecology.resonance,
      '--spw-developmental-charge-bias': modifiers.ecology.chargeBias,
      '--spw-developmental-selection-bias': modifiers.ecology.selectionBias,
      '--spw-surface-permeability-base': modifiers.ecology.permeabilityBase,
      '--spw-deviation-count': deviations.length
    });

    applyPaletteResonanceSwatches(this.root, normalized);
    applyImageLoadingPreference(normalized);

    return normalized;
  }

  listDeviations(settings = this.get()) {
    return listDeviations(settings);
  }

  save(nextSettings = {}) {
    const current = this.get();
    const merged = normalizeSiteSettings({...current, ...sanitizePartialSettings(nextSettings)});
    storage.set(merged);
    const applied = this.apply(merged);
    const deviations = listDeviations(applied);

    bus.emit('settings:changed', applied);
    bus.emit('author:mode', {mode: applied.authorMode, ...getAuthorWorkflowDefinition(applied)});
    bus.emit('development:shifted', {phase: applied.currentDevelopmentalClimate, ...getDevelopmentalClimateDefinition(applied)});
    bus.emit('settings:deviations-changed', {deviations, count: deviations.length});

    return applied;
  }

  reset() {
    storage.clear();
    const applied = this.apply(DEFAULT_SITE_SETTINGS);

    bus.emit('settings:changed', applied);
    bus.emit('author:mode', {mode: applied.authorMode, ...getAuthorWorkflowDefinition(applied)});
    bus.emit('development:shifted', {phase: applied.currentDevelopmentalClimate, ...getDevelopmentalClimateDefinition(applied)});
    bus.emit('settings:deviations-changed', {deviations: [], count: 0});

    return applied;
  }

  shouldUseViewportActivation() {
    return this.get().viewportActivation === 'on';
  }

  describePreset(name) {
    const preset = PRESETS[name];
    if (!preset) return null;

    const merged = normalizeSiteSettings({...DEFAULT_SITE_SETTINGS, ...preset});
    const climate = getDevelopmentalClimateDefinition(merged);
    const author = getAuthorWorkflowDefinition(merged);

    return {
      name,
      settings: merged,
      authorMode: merged.authorMode,
      authorIntent: author.intent,
      climate: climate.label,
      climateAuthorLabel: climate.authorLabel || climate.label,
      learningMode: climate.learningMode
    };
  }
}

const manager = new SiteSettingsManager();

const getSiteSettings = () => manager.get();
const getSiteSettingModifiers = (settings) => manager.getModifiers(settings);
const applySiteSettings = (settings) => {
  const applied = manager.apply(settings);
  scheduleSettingsUiBindings();

  // Instrumentability + composability timing improvement:
  // Consolidated data attrs (component-motif, etc.) are set synchronously during apply,
  // which for initial load occurs from localStorage before full first paint in the
  // common bootstrap path. This eliminates FOUC for motif-driven tokens (see core.css
  // pigment-context-boost + motif rules) and makes the full artistic selection
  // (flavor + motif + theme + color-mode + resonance + climate) queryable in devtools,
  // state-inspector, and design catalog immediately.
  const flavor = applied?.pedagogicalFlavor || getSiteSettings().pedagogicalFlavor || 'runtime';
  const motif = normalizeComponentMotif(flavor);
  if (document?.documentElement) {
    document.documentElement.dataset.spwComponentMotif = motif;
    // Snapshot the active combo for easy inspection / combinatoric debugging.
    // Enables queries like [data-spw-component-motif="curriculum"][data-spw-color-mode="dark"]
    // in catalog and .spw operational contracts.
    document.documentElement.dataset.spwActiveMotif = motif;
  }

  // Emit so reactive surfaces (tuning widgets, ornament/wonder, measure displays)
  // can re-compose ornament or accent without a full settings re-apply cycle.
  // This is part of making the palette/theme/motif/lighting/mind-context system
  // first-class and event-instrumented for evolutionary semantic enhancement.
  try {
    emitSettingsChange({ ...applied, componentMotif: motif, flavor });
    // Also a dedicated semantic event for operators/measures/attention that care
    // about the combined artistic + developmental context.
    if (typeof bus !== 'undefined' && bus?.emit) {
      bus.emit('spw:palette-state', { flavor, motif, themePack: applied?.themePack, colorMode: applied?.colorMode });
    }

    // Spell/cauldron chainability: surface setting changes as primable, chainable expressions.
    // This turns the settings workbench into a source of spells — a cluster or recipe can be
    // directly primed into cauldron or composed into a personal replayable spell.
    if (typeof bus !== 'undefined' && bus?.emit) {
      const spellPayload = {
        source: 'settings',
        type: 'settings-bundle',
        expression: `settings[${flavor || 'balanced'}]{${applied?.authorMode || 'draft'}+${applied?.currentDevelopmentalClimate || 'orient'}}`,
        label: 'Current settings climate',
        destination: 'cauldron',
        canChain: true,
        tuning: { ...applied, motif, flavor }
      };
      bus.emit('spell:primed', spellPayload);
      bus.emit('cauldron:offer', { type: 'settings-state', payload: spellPayload });
    }
  } catch (e) {
    if (isLocalDev()) {
      console.debug('[site-settings] progressive bus emit skipped (early/edge state)', e);
    }
  }

  // Expressive layout trope instrumentation (vision: deliberate shifts as design language).
  // When author workflow or developmental climate (core "magic manuscript" layers) change,
  // we mark a named "phase-transition" trope. This produces rich dataset + logger + bus
  // artifacts so senior SEs can inspect the mechanics and game devs can imagine extracting
  // the model into fidget toys or future office surfaces. The shift itself may be subtle
  // (orchestrated by CSS tokens for the mode/climate) or zero-layout (pure color/ornament);
  // either way it is now a first-class, describable, tunable effect.
  try {
    const root = document?.documentElement;
    if (root && applied) {
      if (applied.authorMode || applied.currentDevelopmentalClimate) {
        markLayoutTrope(root, 'phase-transition', {
          reason: 'LAYOUT',
          scope: 'author-manuscript',
          source: 'site-settings',
          tuning: {
            authorMode: applied.authorMode,
            developmentalClimate: applied.currentDevelopmentalClimate,
          },
        });
      }

      // Richer trope wiring for theme tuning, palette refinement, spacing tunability
      if (applied.themePack || applied.paletteResonance || applied.colorMode) {
        markLayoutTrope(root, 'theme-shift', {
          reason: 'THEME',
          scope: 'palette-refinement',
          source: 'site-settings',
          tuning: {
            themePack: applied.themePack,
            paletteResonance: applied.paletteResonance,
            colorMode: applied.colorMode,
          },
        });
      }

      if (applied.componentDensity || applied.spacingTuner) {
        markLayoutTrope(root, 'spacing-tune', {
          reason: 'LAYOUT',
          scope: 'content-based-spacing',
          source: 'site-settings',
          tuning: {
            density: applied.componentDensity,
            spacing: applied.spacingTuner,
          },
        });
      }
    }
  } catch (e) {
    if (isLocalDev()) {
      // Audit "impossible" or edge state during full apply (e.g. motif + new material combos,
      // early DOM, or experimental shell utilities). Surfaces for local debugging convenience
      // without spamming prod or deployed noise.
      console.debug('[site-settings] non-fatal during apply (audited impossible/edge state)', e);
    }
  }

  return applied;
};
const saveSiteSettings = (nextSettings) => manager.save(nextSettings);
const resetSiteSettings = () => manager.reset();
const shouldUseViewportActivation = () => manager.shouldUseViewportActivation();
const emitSettingsChange = (settings) => bus.emit('settings:changed', settings);
const getSettingValue = (name, settings = getSiteSettings()) => (isKnownSetting(name) ? normalizeSiteSettings(settings)[name] : undefined);
const getSiteSettingDeviations = (settings) => listDeviations(settings ?? getSiteSettings());

const isLocalDev = () =>
  (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.endsWith('.local')))
  || (typeof document !== 'undefined' && document.documentElement?.dataset?.spwDebugMode === 'on');

const describeDeviation = ({name, default: defaultValue, current}) => ({
  name,
  humanName: humanizeSettingName(name),
  default: defaultValue,
  defaultLabel: describeSettingValue(name, defaultValue),
  current,
  currentLabel: describeSettingValue(name, current)
});

const resetSingleSetting = (name) => {
  if (!isKnownSetting(name)) return null;
  return saveSiteSettings({[name]: DEFAULT_SITE_SETTINGS[name]});
};

/**
 * Explicit named setters for common shell / bench / utility controls.
 * All delegate to canonical saveSiteSettings (which does: sanitize/validate,
 * normalize+merge, persist, apply (datasets+styles+side effects), deviations,
 * and bus 'settings:changed' + related emits).
 * This centralizes wiring so matte/clear-contrast, font, etc. from shell
 * buttons, design bench, pinch, etc. all flow through the same contract.
 * High-contrast value is normalized to canonical 'on'/'off' strings.
 */
const setBaseMetamaterial = (value) => {
  const v = String(value || '').trim();
  if (!SETTING_OPTIONS.baseMetamaterial?.has(v)) {
    if (isLocalDev()) console.debug('[site-settings] invalid baseMetamaterial attempted', v);
    return null;
  }
  return saveSiteSettings({ baseMetamaterial: v });
};

const setHighContrast = (value) => {
  let v = value;
  if (v === true || v === 'true' || v === 1 || v === '1') v = 'on';
  else if (v === false || v === 'false' || v === 0 || v === '0') v = 'off';
  v = String(v || '').trim().toLowerCase();
  if (v !== 'on' && v !== 'off') v = 'off';
  if (!SETTING_OPTIONS.highContrast?.has(v)) v = 'off';
  return saveSiteSettings({ highContrast: v });
};

const setFontSizeScale = (scale) => {
  const s = String(scale || '').trim();
  if (!SETTING_OPTIONS.fontSizeScale?.has(s)) {
    if (isLocalDev()) console.debug('[site-settings] invalid fontSizeScale attempted', s);
    return null;
  }
  return saveSiteSettings({ fontSizeScale: s });
};

/** Convenience for the paired "clear matte contrast" intent (shell utility + design global apply). */
const setClearContrastMatte = (active = true) => {
  const base = active ? 'matte' : 'glass';
  const hc = active ? 'on' : 'off';
  return saveSiteSettings({ baseMetamaterial: base, highContrast: hc });
};


let settingsUiModule = null;
let settingsUiLoadPromise = null;

const SETTINGS_UI_BINDING_SELECTOR = [
  '[data-site-settings-form]',
  '[data-site-settings-scope]',
  '[data-site-setting-set]',
  '[data-site-settings-recipe]',
  '[data-settings-state]',
  '[data-site-setting-value]',
  '[data-site-deviation-count]',
  '[data-site-deviation-list]',
  '[data-site-persistence-list]',
].join(', ');

function loadSettingsUi() {
  settingsUiLoadPromise ??= import('./site-settings-ui.js').then((mod) => {
    settingsUiModule = mod;
    return mod;
  });
  return settingsUiLoadPromise;
}

function callSettingsUi(method, args) {
  if (settingsUiModule?.[method]) {
    return settingsUiModule[method](...args);
  }
  return loadSettingsUi().then((mod) => mod[method](...args));
}

function scheduleSettingsUiBindings() {
  if (manager._initialized) return;
  if (typeof document === 'undefined' || !document.querySelector(SETTINGS_UI_BINDING_SELECTOR)) return;
  loadSettingsUi().then((mod) => {
    mod.initSiteSettingsBindings(manager);
  });
}

function installSiteSettingsConsole() {
  if (typeof window === 'undefined' || window.spwSettings) return;
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
    bindSettingsScope: (...args) => callSettingsUi('bindSettingsScope', args),
    bindSettingsField: (...args) => callSettingsUi('bindSettingsField', args),
    bindStandaloneSettingTriggers: (...args) => callSettingsUi('bindStandaloneSettingTriggers', args),
    bindSettingsReadouts: (...args) => callSettingsUi('bindSettingsReadouts', args),
    bindDeviationControls: (...args) => callSettingsUi('bindDeviationControls', args),
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
    applyRecipe: (...args) => callSettingsUi('applyUxRecipe', args),
    findActivePreset,
    authorWorkflows: AUTHOR_WORKFLOW_DEFINITIONS,
    developmentalClimates: DEVELOPMENTAL_CLIMATES,
    syncUx: (...args) => callSettingsUi('syncSettingsUx', args),
    describePreset: (name) => manager.describePreset(name),
    initBindings: (...args) => callSettingsUi('initSiteSettingsBindings', args),
    manager,
  };
}

installSiteSettingsConsole();


export {
  manager,
  buildPersistenceRegistries,
  PWA_PROMPT_DISMISSAL_STORAGE_KEYS,
  humanizeSettingName,
  isKnownSetting,
  getAuthorWorkflowDefinition,
  getDevelopmentalClimateDefinition,
  getAuthorWorkflowTokens,
  applySiteSettings,
  saveSiteSettings,
  resetSiteSettings,
  getSiteSettings,
  getSiteSettingModifiers,
  getSettingValue,
  getSiteSettingDeviations,
  emitSettingsChange,
  describeDeviation,
  describeSettingValue,
  formatStorageTimestamp,
  getLatestTimestamp,
  getPresetSettings,
  getUxRecipe,
  findActivePreset,
  presetIsSubsetOfSettings,
  presetMatchesSettings,
  describeSettingsPatch,
  normalizeSiteSettings,
  resetSingleSetting,
  sanitizePartialSettings,
  validatePartialSettings,
  validateSetting,
  shouldUseViewportActivation,
  setBaseMetamaterial,
  setHighContrast,
  setFontSizeScale,
  setClearContrastMatte,
  resolveTuningDiscoverability,
  parseSettingsFromSearch,
  buildSettingsShareHref,
};
