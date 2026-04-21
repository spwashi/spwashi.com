/**
 * Site Settings Manager
 * ---------------------------------------------------------------------------
 * Purpose
 * - Central hub for site-wide preferences.
 * - Normalizes persisted settings, applies them to the document, and exposes
 *   architectural modifiers for other systems.
 *
 * Primary concerns
 * - navigation / console visibility
 * - accessibility / typography / motion
 * - semantic density / operator presentation / infospace complexity
 * - developmental climate
 * - cognitive handles / metadata / relational visualization
 * - performance and progressive enhancement
 *
 * Design stance
 * - HTML/CSS should read stable datasets and CSS custom properties.
 * - JS modules should be able to ask for derived architectural modifiers
 *   rather than re-deriving them ad hoc.
 * - No transition layer for older spirit-phase vocabulary is kept here.
 *
 * New component-binding stance
 * - Settings UI does not need to live only on /settings.
 * - Any page may include:
 *   - a single field
 *   - a small fieldset
 *   - preset buttons
 *   - readout badges / summaries
 *   - state inspectors
 * - Components should connect to the same normalized model rather than
 *   inventing page-local state.
 *
 * Recommended markup contracts
 *
 * 1. Single setting controls
 *    <input type="radio" name="colorMode" value="dark" data-site-setting>
 *
 * 2. Group / container binding
 *    <form data-site-settings-form>...</form>
 *    <section data-site-settings-scope>...</section>
 *
 * 3. Preset triggers
 *    <button type="button" data-preset="loom">Apply Loom</button>
 *
 * 4. State readouts
 *    <strong data-settings-state="colorMode"></strong>
 *    <code data-site-setting-value="semanticDensity"></code>
 *
 * 5. Field validation hints
 *    <div data-site-setting-errors="colorMode"></div>
 *
 * 6. Declarative trigger controls
 *    <button type="button" data-site-setting-set="wonderMemory:sitewide">Resonate sitewide</button>
 *
 * Validation model
 * - validateSetting(name, value): validate a single field
 * - validatePartialSettings(partial): validate a partial payload
 * - normalizeSiteSettings(value): safe full-object normalization
 *
 * Binding model
 * - bindSettingsScope(root): attach settings behavior to any subtree
 * - bindSettingsField(field, options): attach one field directly
 * - bindSettingsReadouts(root): sync text-based state readouts
 *
 * These bindings are intended for independent reuse across pages.
 * ---------------------------------------------------------------------------
 */

import { bus } from './spw-bus.js';
import {
  DEFAULT_PALETTE_RESONANCE,
  PALETTE_RESONANCE_OPTIONS,
  getPaletteResonanceSwatches
} from './spw-palette-resonance.js';
import { shouldDisableServiceWorkerInDevelopment } from './spw-runtime-environment.js';

const SITE_SETTINGS_KEY = 'spw-site-settings';
const THEME_PACK_OPTIONS = Object.freeze([
  'neutral-paper',
  'oxide-ledger',
  'electric-studio',
  'ritual-vellum',
  'copper-brace',
  'glass-console'
]);

/* ==========================================================================
   1. Static registries
   ========================================================================== */

const FONT_SIZE_PRESET_MULTIPLIER = Object.freeze({
  small: 0.93,
  normal: 1,
  large: 1.12
});

const LINE_SPACING_VALUE = Object.freeze({
  compact: '1.55',
  normal: '1.68',
  loose: '1.82'
});

const MONOSPACE_FONT_VALUE = Object.freeze({
  system: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  jetbrains: '"JetBrains Mono", monospace',
  courier: '"Courier New", Courier, monospace'
});

const GRAIN_INTENSITY_VALUE = Object.freeze({
  none: 0,
  subtle: 0.018,
  moderate: 0.032,
  rich: 0.055
});

const SEMANTIC_GRAIN_OFFSET = Object.freeze({
  minimal: -0.01,
  normal: 0,
  rich: 0.01
});

const MOTION_INTENSITY_MULTIPLIER = Object.freeze({
  reduced: 0.82,
  normal: 1,
  enhanced: 1.18
});

const ANIMATION_THROTTLE_MULTIPLIER = Object.freeze({
  off: 1,
  light: 0.76,
  heavy: 0.4
});

const OPERATOR_SATURATION_FACTOR = Object.freeze({
  muted: 0.84,
  normal: 1,
  vibrant: 1.16
});

const SEMANTIC_DENSITY_FACTOR = Object.freeze({
  minimal: 0.84,
  normal: 1,
  rich: 1.18
});

const ENHANCEMENT_FACTOR = Object.freeze({
  minimal: 0.84,
  balanced: 1,
  rich: 1.18
});

const INFOSPACE_FACTOR = Object.freeze({
  simple: 0.82,
  adaptive: 1,
  complex: 1.18
});

const OPERATOR_PRESENTATION_FACTOR = Object.freeze({
  symbolic: 1,
  full: 1.08,
  text: 0.82
});

const HEADER_OPACITY_VALUE = Object.freeze({
  low: '0.76',
  normal: '0.9',
  high: '1'
});

const WONDER_MEMORY_PROFILE = Object.freeze({
  off: Object.freeze({
    strength: 0,
    ttlMs: 0,
    reach: 0
  }),
  nearby: Object.freeze({
    strength: 0.56,
    ttlMs: 28000,
    reach: 0.54
  }),
  sitewide: Object.freeze({
    strength: 0.92,
    ttlMs: 96000,
    reach: 1
  })
});

const CONTOUR_PROFILE = Object.freeze({
  tight: Object.freeze({
    shapeElement: '3px',
    shapeComponent: '4px',
    shapeSurface: '7px',
    shapeFloating: '11px',
    edgeSoftness: 0.16,
    materialBlurPx: 4
  }),
  balanced: Object.freeze({
    shapeElement: '4px',
    shapeComponent: '5px',
    shapeSurface: '8px',
    shapeFloating: '12px',
    edgeSoftness: 0.24,
    materialBlurPx: 6
  }),
  soft: Object.freeze({
    shapeElement: '6px',
    shapeComponent: '8px',
    shapeSurface: '12px',
    shapeFloating: '18px',
    edgeSoftness: 0.36,
    materialBlurPx: 9
  })
});

const FIELD_RESONANCE_PROFILE = Object.freeze({
  local: Object.freeze({
    attentionFieldRadius: 0.24,
    attentionFieldDecay: 0.56,
    attentionEchoDurationMs: 360,
    regionFieldIntensity: 0.12,
    materialBlurScale: 0.88,
    wonderStrengthScale: 0.84,
    wonderReachScale: 0.82
  }),
  field: Object.freeze({
    attentionFieldRadius: 0.4,
    attentionFieldDecay: 0.65,
    attentionEchoDurationMs: 480,
    regionFieldIntensity: 0.22,
    materialBlurScale: 1,
    wonderStrengthScale: 1,
    wonderReachScale: 1
  }),
  choral: Object.freeze({
    attentionFieldRadius: 0.72,
    attentionFieldDecay: 0.8,
    attentionEchoDurationMs: 620,
    regionFieldIntensity: 0.42,
    materialBlurScale: 1.18,
    wonderStrengthScale: 1.18,
    wonderReachScale: 1.24
  })
});

const STROKE_PROFILE = Object.freeze({
  hairline: Object.freeze({
    lineMid: '1.15px',
    lineThick: '2px',
    lineHeavy: '2.5px',
    boundaryRailWidth: '1px',
    boundaryRailWidthStrong: '2px',
    fixtureAnnotationWeight: 0.24,
    svgStrokeScale: 0.9,
    svgFlowDash: '4',
    svgFlowGap: '11',
    svgLabelSpacing: '0.06em'
  }),
  structural: Object.freeze({
    lineMid: '1.5px',
    lineThick: '2.5px',
    lineHeavy: '3px',
    boundaryRailWidth: '1px',
    boundaryRailWidthStrong: '3px',
    fixtureAnnotationWeight: 0.34,
    svgStrokeScale: 1,
    svgFlowDash: '5',
    svgFlowGap: '9',
    svgLabelSpacing: '0.04em'
  }),
  bold: Object.freeze({
    lineMid: '1.85px',
    lineThick: '3.2px',
    lineHeavy: '3.8px',
    boundaryRailWidth: '1.5px',
    boundaryRailWidthStrong: '4px',
    fixtureAnnotationWeight: 0.46,
    svgStrokeScale: 1.12,
    svgFlowDash: '7',
    svgFlowGap: '7',
    svgLabelSpacing: '0.02em'
  })
});

const DEVELOPMENTAL_CLIMATES = Object.freeze({
  orient: Object.freeze({
    id: 'orient',
    label: 'kindle',
    learningMode: 'entry',
    description: 'Open the frame, notice cues, and sense the terrain before forcing conclusions.',
    clarity: 0.56,
    pressure: 0.24,
    atmosphere: 0.32,
    memory: 0.12,
    resonance: 0.18,
    chargeBias: 0.18,
    selectionBias: 0.18,
    recipeBias: Object.freeze(['survey', 'naming', 'entry']),
    wonderBias: Object.freeze(['orientation', 'inquiry'])
  }),
  anchor: Object.freeze({
    id: 'anchor',
    label: 'anchor',
    learningMode: 'stabilize',
    description: 'Name distinctions, stabilize references, and give the surface something firm to stand on.',
    clarity: 0.74,
    pressure: 0.46,
    atmosphere: 0.12,
    memory: 0.32,
    resonance: 0.14,
    chargeBias: 0.22,
    selectionBias: 0.32,
    recipeBias: Object.freeze(['contrast', 'grounding', 'naming']),
    wonderBias: Object.freeze(['memory', 'constraint'])
  }),
  weave: Object.freeze({
    id: 'weave',
    label: 'weave',
    learningMode: 'connect',
    description: 'Relate examples, build parallels, and connect local structure to neighboring concepts.',
    clarity: 0.68,
    pressure: 0.42,
    atmosphere: 0.2,
    memory: 0.2,
    resonance: 0.36,
    chargeBias: 0.26,
    selectionBias: 0.24,
    recipeBias: Object.freeze(['comparison', 'mapping', 'analogy']),
    wonderBias: Object.freeze(['comparison', 'resonance'])
  }),
  rehearse: Object.freeze({
    id: 'rehearse',
    label: 'rehearse',
    learningMode: 'practice',
    description: 'Retrieve, vary, test, and practice until the pattern can be used rather than merely recognized.',
    clarity: 0.7,
    pressure: 0.38,
    atmosphere: 0.16,
    memory: 0.42,
    resonance: 0.22,
    chargeBias: 0.2,
    selectionBias: 0.28,
    recipeBias: Object.freeze(['retrieval', 'variation', 'practice']),
    wonderBias: Object.freeze(['memory', 'constraint'])
  }),
  offer: Object.freeze({
    id: 'offer',
    label: 'offer',
    learningMode: 'publish',
    description: 'Externalize the work through explanation, publication, teaching, or a usable contribution.',
    clarity: 0.84,
    pressure: 0.3,
    atmosphere: 0.1,
    memory: 0.22,
    resonance: 0.28,
    chargeBias: 0.3,
    selectionBias: 0.34,
    recipeBias: Object.freeze(['publication', 'teaching', 'projection']),
    wonderBias: Object.freeze(['projection', 'resonance'])
  })
});

const DEFAULT_SITE_SETTINGS = Object.freeze({
  navigatorDisplay: 'quiet',
  consoleDisplay: 'hidden',
  viewportActivation: 'off',

  reduceMotion: 'off',
  highContrast: 'off',
  fontSize: 'normal',

  colorMode: 'auto',
  themePack: 'neutral-paper',
  paletteResonance: DEFAULT_PALETTE_RESONANCE,
  baseMetamaterial: 'glass',
  baseAffordance: 'read',
  componentDensity: 'soft',
  operatorSaturation: 'normal',
  animationIntensity: 'normal',
  contourProfile: 'balanced',
  strokeProfile: 'structural',
  fieldResonance: 'field',

  debugMode: 'off',
  showFrameMetadata: 'off',
  verboseLogging: 'off',

  fontSizeScale: '100',
  lineSpacing: 'normal',
  monospaceVariant: 'jetbrains',
  typesettingMode: 'default',

  showFooter: 'on',
  headerOpacity: 'normal',
  showSpecPills: 'off',

  animationThrottling: 'off',
  imageLazyLoading: 'on',

  enhancementLevel: 'minimal',
  semanticDensity: 'minimal',
  operatorPresentation: 'symbolic',
  infospaceComplexity: 'simple',
  cognitiveHandles: 'off',
  dimensionalBreadcrumbs: 'off',
  fractalNesting: 'off',
  implementationMutations: 'off',

  showSemanticMetadata: 'off',
  operatorHighlighting: 'off',
  relationalVisualization: 'off',
  wonderMemory: 'nearby',
  developmentalIndicators: 'off',
  depthIndicators: 'off',

  currentDevelopmentalClimate: 'orient',
  developmentalClimateAutoCycle: 'off',

  grainIntensity: 'subtle',

  busDiagnostics: 'off',
  busMirrorToConsole: 'off',
  busHistorySize: '100'
});

const SETTING_OPTIONS = Object.freeze({
  navigatorDisplay: new Set(['quiet', 'full', 'hidden']),
  consoleDisplay: new Set(['collapsed', 'expanded', 'hidden']),
  viewportActivation: new Set(['off', 'on']),

  reduceMotion: new Set(['off', 'on']),
  highContrast: new Set(['off', 'on']),
  fontSize: new Set(['small', 'normal', 'large']),

  colorMode: new Set(['auto', 'light', 'dark']),
  themePack: new Set(THEME_PACK_OPTIONS),
  paletteResonance: new Set(PALETTE_RESONANCE_OPTIONS),
  baseMetamaterial: new Set(['paper', 'glass', 'matte', 'field']),
  baseAffordance: new Set(['read', 'tune', 'inspect', 'orient']),
  componentDensity: new Set(['dense', 'soft', 'roomy']),
  operatorSaturation: new Set(['muted', 'normal', 'vibrant']),
  animationIntensity: new Set(['reduced', 'normal', 'enhanced']),
  contourProfile: new Set(['tight', 'balanced', 'soft']),
  strokeProfile: new Set(['hairline', 'structural', 'bold']),
  fieldResonance: new Set(['local', 'field', 'choral']),

  debugMode: new Set(['off', 'on']),
  showFrameMetadata: new Set(['off', 'on']),
  verboseLogging: new Set(['off', 'on']),

  fontSizeScale: new Set(['80', '90', '100', '110', '120']),
  lineSpacing: new Set(['compact', 'normal', 'loose']),
  monospaceVariant: new Set(['system', 'jetbrains', 'courier']),
  typesettingMode: new Set(['default', 'editorial']),

  showFooter: new Set(['on', 'off']),
  headerOpacity: new Set(['low', 'normal', 'high']),
  showSpecPills: new Set(['on', 'off']),

  animationThrottling: new Set(['off', 'light', 'heavy']),
  imageLazyLoading: new Set(['on', 'off']),

  enhancementLevel: new Set(['minimal', 'balanced', 'rich']),
  semanticDensity: new Set(['minimal', 'normal', 'rich']),
  operatorPresentation: new Set(['symbolic', 'full', 'text']),
  infospaceComplexity: new Set(['simple', 'adaptive', 'complex']),
  cognitiveHandles: new Set(['off', 'on']),
  dimensionalBreadcrumbs: new Set(['off', 'on']),
  fractalNesting: new Set(['off', 'on']),
  implementationMutations: new Set(['off', 'on']),

  showSemanticMetadata: new Set(['off', 'on']),
  operatorHighlighting: new Set(['off', 'on']),
  relationalVisualization: new Set(['off', 'on']),
  wonderMemory: new Set(['off', 'nearby', 'sitewide']),
  developmentalIndicators: new Set(['off', 'on']),
  depthIndicators: new Set(['off', 'on']),

  currentDevelopmentalClimate: new Set(Object.keys(DEVELOPMENTAL_CLIMATES)),
  developmentalClimateAutoCycle: new Set(['off', 'on']),

  grainIntensity: new Set(['none', 'subtle', 'moderate', 'rich']),

  busDiagnostics: new Set(['off', 'basic', 'verbose']),
  busMirrorToConsole: new Set(['off', 'on']),
  busHistorySize: new Set(['100', '250', '500'])
});

const PRESETS = Object.freeze({
  hearth: {
    currentDevelopmentalClimate: 'orient',
    navigatorDisplay: 'quiet',
    consoleDisplay: 'hidden',
    colorMode: 'auto',
    themePack: 'neutral-paper',
    operatorSaturation: 'normal',
    animationIntensity: 'normal',
    contourProfile: 'balanced',
    strokeProfile: 'structural',
    fieldResonance: 'local',
    grainIntensity: 'none',
    semanticDensity: 'minimal',
    operatorHighlighting: 'off',
    cognitiveHandles: 'off',
    showSemanticMetadata: 'off',
    developmentalIndicators: 'off',
    depthIndicators: 'off',
    relationalVisualization: 'off',
    wonderMemory: 'nearby',
    showSpecPills: 'off',
    enhancementLevel: 'minimal',
    infospaceComplexity: 'simple',
    dimensionalBreadcrumbs: 'off',
    fractalNesting: 'off',
    implementationMutations: 'off',
    developmentalClimateAutoCycle: 'off',
    reduceMotion: 'off',
    highContrast: 'off',
    busDiagnostics: 'off',
    busMirrorToConsole: 'off',
    busHistorySize: '100',
    typesettingMode: 'default'
  },
  loom: {
    currentDevelopmentalClimate: 'weave',
    semanticDensity: 'rich',
    grainIntensity: 'moderate',
    themePack: 'electric-studio',
    operatorSaturation: 'vibrant',
    animationIntensity: 'enhanced',
    contourProfile: 'soft',
    strokeProfile: 'structural',
    fieldResonance: 'choral',
    operatorHighlighting: 'on',
    cognitiveHandles: 'on',
    showSemanticMetadata: 'on',
    developmentalIndicators: 'on',
    showSpecPills: 'on',
    relationalVisualization: 'on',
    wonderMemory: 'sitewide',
    enhancementLevel: 'rich',
    infospaceComplexity: 'adaptive',
    dimensionalBreadcrumbs: 'on',
    developmentalClimateAutoCycle: 'on',
    navigatorDisplay: 'full',
    consoleDisplay: 'collapsed',
    busDiagnostics: 'basic',
    busMirrorToConsole: 'off',
    busHistorySize: '250',
    typesettingMode: 'editorial'
  },
  workshop: {
    currentDevelopmentalClimate: 'anchor',
    navigatorDisplay: 'full',
    consoleDisplay: 'expanded',
    themePack: 'glass-console',
    semanticDensity: 'rich',
    contourProfile: 'tight',
    strokeProfile: 'bold',
    fieldResonance: 'field',
    operatorHighlighting: 'on',
    cognitiveHandles: 'on',
    showSemanticMetadata: 'on',
    showSpecPills: 'on',
    developmentalIndicators: 'on',
    relationalVisualization: 'on',
    wonderMemory: 'sitewide',
    implementationMutations: 'on',
    grainIntensity: 'none',
    debugMode: 'on',
    showFrameMetadata: 'on',
    busDiagnostics: 'verbose',
    busMirrorToConsole: 'on',
    busHistorySize: '500',
    typesettingMode: 'default'
  },
  access: {
    currentDevelopmentalClimate: 'anchor',
    highContrast: 'on',
    reduceMotion: 'on',
    themePack: 'neutral-paper',
    fontSize: 'large',
    fontSizeScale: '120',
    lineSpacing: 'loose',
    animationIntensity: 'reduced',
    animationThrottling: 'heavy',
    contourProfile: 'balanced',
    strokeProfile: 'bold',
    fieldResonance: 'local',
    grainIntensity: 'none',
    cognitiveHandles: 'on',
    showSemanticMetadata: 'on',
    developmentalIndicators: 'on',
    wonderMemory: 'off',
    navigatorDisplay: 'full',
    consoleDisplay: 'collapsed',
    busDiagnostics: 'basic',
    busMirrorToConsole: 'off',
    busHistorySize: '100',
    typesettingMode: 'default'
  }
});

const SETTING_VALUE_LABELS = Object.freeze({
  colorMode: Object.freeze({
    auto: 'Adaptive',
    light: 'Light',
    dark: 'Dark'
  }),
  themePack: Object.freeze({
    'neutral-paper': 'Neutral paper',
    'oxide-ledger': 'Oxide ledger',
    'electric-studio': 'Electric studio',
    'ritual-vellum': 'Ritual vellum',
    'copper-brace': 'Copper brace',
    'glass-console': 'Glass console'
  }),
  paletteResonance: Object.freeze({
    route: 'Context-led',
    craft: 'Craft-led',
    software: 'Software-led',
    math: 'Math-led'
  }),
  contourProfile: Object.freeze({
    tight: 'Tight',
    balanced: 'Balanced',
    soft: 'Soft'
  }),
  strokeProfile: Object.freeze({
    hairline: 'Hairline',
    structural: 'Structural',
    bold: 'Bold'
  }),
  fieldResonance: Object.freeze({
    local: 'Local',
    field: 'Field',
    choral: 'Choral'
  }),
  wonderMemory: Object.freeze({
    off: 'Focused',
    nearby: 'Connected',
    sitewide: 'Immersive'
  })
});

/* ==========================================================================
   2. Storage & normalization
   ========================================================================== */

const storage = {
  get() {
    try {
      const raw = localStorage.getItem(SITE_SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
  set(settings) {
    try {
      localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* non-fatal */
    }
  },
  clear() {
    try {
      localStorage.removeItem(SITE_SETTINGS_KEY);
    } catch {
      /* non-fatal */
    }
  }
};

const normalizeSiteSettings = (value = {}) => {
  const settings = { ...DEFAULT_SITE_SETTINGS };

  Object.keys(settings).forEach((key) => {
    const candidate = value[key];
    if (SETTING_OPTIONS[key]?.has(candidate)) {
      settings[key] = candidate;
    }
  });

  return settings;
};

/* ==========================================================================
   3. Validation helpers
   --------------------------------------------------------------------------
   These helpers are intentionally public and lightweight so partial settings
   components on other pages can validate inputs before saving.
   ========================================================================== */

const isKnownSetting = (name) => Object.prototype.hasOwnProperty.call(DEFAULT_SITE_SETTINGS, name);

const validateSetting = (name, value) => {
  if (!isKnownSetting(name)) {
    return {
      valid: false,
      name,
      value,
      reason: 'unknown-setting'
    };
  }

  const valid = SETTING_OPTIONS[name]?.has(value) || false;

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
    if (validateSetting(name, value).valid) {
      next[name] = value;
    }
  });
  return next;
};

const listDeviations = (settings = normalizeSiteSettings(storage.get())) => {
  const normalized = normalizeSiteSettings(settings);
  const deviations = [];

  Object.keys(DEFAULT_SITE_SETTINGS).forEach((key) => {
    if (normalized[key] !== DEFAULT_SITE_SETTINGS[key]) {
      deviations.push({
        name: key,
        default: DEFAULT_SITE_SETTINGS[key],
        current: normalized[key]
      });
    }
  });

  return deviations;
};

/* ==========================================================================
   4. Pure helpers
   ========================================================================== */

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

const getDuration = (settings, milliseconds) => (
  `${Math.max(1, Math.round(milliseconds * getMotionScale(settings)))}ms`
);

const applyImageLoadingPreference = (settings, root = document) => {
  root.querySelectorAll('img').forEach((image) => {
    if (!image.dataset.spwLoadingOriginal) {
      image.dataset.spwLoadingOriginal = image.getAttribute('loading') || '';
    }

    const original = image.dataset.spwLoadingOriginal;

    if (settings.imageLazyLoading === 'off' && original === 'lazy') {
      image.setAttribute('loading', 'eager');
    } else if (original) {
      image.setAttribute('loading', original);
    } else {
      image.removeAttribute('loading');
    }
  });
};

const getDevelopmentalClimateDefinition = (settings) => (
  DEVELOPMENTAL_CLIMATES[settings.currentDevelopmentalClimate] || DEVELOPMENTAL_CLIMATES.orient
);

const getWonderMemoryProfile = (settings) => (
  WONDER_MEMORY_PROFILE[settings.wonderMemory] || WONDER_MEMORY_PROFILE.nearby
);

const applyPaletteResonanceSwatches = (root, settings) => {
  const swatches = getPaletteResonanceSwatches(settings.paletteResonance);

  for (let index = 0; index < 4; index += 1) {
    const value = swatches[index];
    const name = `--spw-palette-probe-${index + 1}`;

    if (value) {
      root.style.setProperty(name, value);
    } else {
      root.style.removeProperty(name);
    }
  }
};

const setDatasetEntries = (root, entries = {}) => {
  if (!(root instanceof HTMLElement)) return;

  Object.entries(entries).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      delete root.dataset[key];
      return;
    }

    root.dataset[key] = String(value);
  });
};

const setStyleProperties = (root, entries = {}) => {
  if (!(root instanceof HTMLElement)) return;

  Object.entries(entries).forEach(([name, value]) => {
    if (value === undefined || value === null || value === '') {
      root.style.removeProperty(name);
      return;
    }

    root.style.setProperty(name, String(value));
  });
};

const deriveArchitecturalModifiers = (settings) => {
  const climate = getDevelopmentalClimateDefinition(settings);
  const motionScale = getMotionScale(settings);
  const semanticDensityFactor = SEMANTIC_DENSITY_FACTOR[settings.semanticDensity] || 1;
  const enhancementFactor = ENHANCEMENT_FACTOR[settings.enhancementLevel] || 1;
  const infospaceFactor = INFOSPACE_FACTOR[settings.infospaceComplexity] || 1;
  const operatorPresentationFactor = OPERATOR_PRESENTATION_FACTOR[settings.operatorPresentation] || 1;
  const operatorSaturationFactor = OPERATOR_SATURATION_FACTOR[settings.operatorSaturation] || 1;
  const cognitiveFactor = settings.cognitiveHandles === 'on' ? 1 : 0;
  const relationalFactor = settings.relationalVisualization === 'on' ? 1 : 0;
  const metadataFactor = settings.showSemanticMetadata === 'on' ? 1 : 0;
  const wonderProfile = getWonderMemoryProfile(settings);
  const contourProfile = CONTOUR_PROFILE[settings.contourProfile] || CONTOUR_PROFILE.balanced;
  const strokeProfile = STROKE_PROFILE[settings.strokeProfile] || STROKE_PROFILE.structural;
  const fieldResonance = FIELD_RESONANCE_PROFILE[settings.fieldResonance] || FIELD_RESONANCE_PROFILE.field;
  const resolvedMaterialBlur = `${clampNumber(
    contourProfile.materialBlurPx * fieldResonance.materialBlurScale,
    2,
    16
  )}px`;

  const ecology = {
    clarity: clampNumber(climate.clarity * enhancementFactor, 0, 1),
    pressure: clampNumber(climate.pressure * infospaceFactor, 0, 1),
    atmosphere: clampNumber(climate.atmosphere * enhancementFactor, 0, 1),
    memory: clampNumber(climate.memory * semanticDensityFactor, 0, 1),
    resonance: clampNumber(climate.resonance * (1 + (relationalFactor * 0.18)), 0, 1),
    chargeBias: clampNumber(climate.chargeBias * operatorSaturationFactor, 0, 1),
    selectionBias: clampNumber(climate.selectionBias * semanticDensityFactor, 0, 1),
    permeabilityBase: clampNumber(
      0.18
      + ((settings.enhancementLevel === 'rich') ? 0.16 : settings.enhancementLevel === 'balanced' ? 0.08 : 0)
      + (cognitiveFactor * 0.18)
      + (metadataFactor * 0.12)
      + (settings.implementationMutations === 'on' ? 0.18 : 0),
      0,
      1
    )
  };

  return Object.freeze({
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
    grain: Object.freeze({
      opacity: getGrainOpacity(settings)
    }),
    climate,
    ecology: Object.freeze(ecology),
    semantic: Object.freeze({
      densityFactor: semanticDensityFactor,
      enhancementFactor,
      infospaceFactor,
      operatorPresentationFactor,
      operatorSaturationFactor,
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
      materialBlur: resolvedMaterialBlur
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
      svgLabelSpacing: strokeProfile.svgLabelSpacing
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

/* ==========================================================================
   5. Core manager
   ========================================================================== */

class SiteSettingsManager {
  constructor() {
    this.root = document.documentElement;
    this._initialized = false;
    this._pwaInitialized = false;
  }

  get() {
    return normalizeSiteSettings(storage.get());
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

    setDatasetEntries(this.root, {
      spwNavigator: normalized.navigatorDisplay,
      spwConsole: normalized.consoleDisplay,
      spwViewportActivation: normalized.viewportActivation,
      spwReduceMotion: normalized.reduceMotion,
      spwHighContrast: normalized.highContrast,
      spwFontSize: normalized.fontSize,
      spwColorMode: normalized.colorMode,
      spwThemePack: normalized.themePack,
      spwPaletteResonance: normalized.paletteResonance,
      spwBaseMetamaterial: normalized.baseMetamaterial,
      spwBaseAffordance: normalized.baseAffordance,
      spwComponentDensity: normalized.componentDensity,
      spwOperatorSaturation: normalized.operatorSaturation,
      spwAnimationIntensity: normalized.animationIntensity,
      spwContourProfile: normalized.contourProfile,
      spwStrokeProfile: normalized.strokeProfile,
      spwFieldResonance: normalized.fieldResonance,
      spwDebugMode: normalized.debugMode,
      spwShowFrameMetadata: normalized.showFrameMetadata,
      spwVerboseLogging: normalized.verboseLogging,
      spwFontSizeScale: normalized.fontSizeScale,
      spwLineSpacing: normalized.lineSpacing,
      spwMonospaceVariant: normalized.monospaceVariant,
      spwTypeset: normalized.typesettingMode,
      spwShowFooter: normalized.showFooter,
      spwHeaderOpacity: normalized.headerOpacity,
      spwShowSpecPills: normalized.showSpecPills,
      spwAnimationThrottling: normalized.animationThrottling,
      spwImageLazyLoading: normalized.imageLazyLoading,
      spwEnhancementLevel: normalized.enhancementLevel,
      spwSemanticDensity: normalized.semanticDensity,
      spwOperatorPresentation: normalized.operatorPresentation,
      spwInfospaceComplexity: normalized.infospaceComplexity,
      spwCognitiveHandles: normalized.cognitiveHandles,
      spwDimensionalBreadcrumbs: normalized.dimensionalBreadcrumbs,
      spwFractalNesting: normalized.fractalNesting,
      spwImplementationMutations: normalized.implementationMutations,
      spwShowSemanticMetadata: normalized.showSemanticMetadata,
      spwOperatorHighlighting: normalized.operatorHighlighting,
      spwRelationalVisualization: normalized.relationalVisualization,
      spwWonderMemory: normalized.wonderMemory,
      spwDevelopmentalIndicators: normalized.developmentalIndicators,
      spwDepthIndicators: normalized.depthIndicators,
      spwDevelopmentalClimate: normalized.currentDevelopmentalClimate,
      spwDevelopmentalLabel: climate.label,
      spwLearningMode: climate.learningMode,
      spwDevelopmentalClimateAutoCycle: normalized.developmentalClimateAutoCycle,
      spwGrainIntensity: normalized.grainIntensity,
      spwDeviationCount: String(deviations.length),
      spwDeviations: deviationNames.join(' ') || null,
      spwDeviationState: deviations.length > 0 ? 'deviated' : 'default'
    });

    setStyleProperties(this.root, {
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
      '--spw-cognitive-handle-factor': modifiers.semantic.cognitiveFactor,
      '--spw-relational-factor': modifiers.semantic.relationalFactor,
      '--spw-semantic-metadata-factor': modifiers.semantic.metadataFactor,
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
      '--attention-field-radius': modifiers.field.radius,
      '--attention-field-decay': modifiers.field.decay,
      '--attention-echo-duration': modifiers.field.echoDuration,
      '--spw-region-field-intensity': modifiers.field.regionFieldIntensity,
      '--spw-wonder-memory-strength': modifiers.wonder.strength,
      '--spw-wonder-memory-ttl-ms': modifiers.wonder.ttlMs,
      '--spw-wonder-memory-reach': modifiers.wonder.reach
    });
    applyPaletteResonanceSwatches(this.root, normalized);
    setStyleProperties(this.root, {
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

    applyImageLoadingPreference(normalized);

    return normalized;
  }

  listDeviations(settings = this.get()) {
    return listDeviations(settings);
  }

  save(nextSettings = {}) {
    const current = this.get();
    const merged = normalizeSiteSettings({ ...current, ...sanitizePartialSettings(nextSettings) });
    storage.set(merged);
    const applied = this.apply(merged);
    const deviations = listDeviations(applied);
    bus.emit('settings:changed', applied);
    bus.emit('settings:deviations-changed', { deviations, count: deviations.length });
    return applied;
  }

  reset() {
    storage.clear();
    const applied = this.apply(DEFAULT_SITE_SETTINGS);
    bus.emit('settings:changed', applied);
    bus.emit('settings:deviations-changed', { deviations: [], count: 0 });
    return applied;
  }

  shouldUseViewportActivation() {
    return this.get().viewportActivation === 'on';
  }

  describePreset(name) {
    const preset = PRESETS[name];
    if (!preset) return null;

    const merged = normalizeSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...preset });
    const climate = DEVELOPMENTAL_CLIMATES[merged.currentDevelopmentalClimate];

    return {
      name,
      settings: merged,
      climate: climate.label,
      learningMode: climate.learningMode
    };
  }
}

const manager = new SiteSettingsManager();

/* ==========================================================================
   6. Public API helpers
   ========================================================================== */

const getSiteSettings = () => manager.get();
const getSiteSettingModifiers = (settings) => manager.getModifiers(settings);
const applySiteSettings = (settings) => {
  const applied = manager.apply(settings);
  initSiteSettingsBindings();
  return applied;
};
const saveSiteSettings = (nextSettings) => manager.save(nextSettings);
const resetSiteSettings = () => manager.reset();
const shouldUseViewportActivation = () => manager.shouldUseViewportActivation();

const emitSettingsChange = (settings) => {
  bus.emit('settings:changed', settings);
};

const getSettingValue = (name, settings = getSiteSettings()) => {
  if (!isKnownSetting(name)) return undefined;
  return normalizeSiteSettings(settings)[name];
};

const getSiteSettingDeviations = (settings) => listDeviations(settings ?? getSiteSettings());

const describeDeviation = ({ name, default: defaultValue, current }) => ({
  name,
  humanName: humanizeSettingName(name),
  default: defaultValue,
  defaultLabel: describeSettingValue(name, defaultValue),
  current,
  currentLabel: describeSettingValue(name, current)
});

const resetSingleSetting = (name) => {
  if (!isKnownSetting(name)) return null;
  return saveSiteSettings({ [name]: DEFAULT_SITE_SETTINGS[name] });
};

/* ==========================================================================
   7. Form / field / readout utilities
   --------------------------------------------------------------------------
   These are intentionally reusable outside the dedicated settings page.
   ========================================================================== */

const collectSettingsFromScope = (root) => {
  const next = {};

  Object.keys(DEFAULT_SITE_SETTINGS).forEach((key) => {
    const fields = root.querySelectorAll?.(`[name="${CSS.escape(key)}"]`);
    if (!fields?.length) return;

    const first = fields[0];

    if (first.type === 'radio') {
      const checked = [...fields].find((field) => field.checked);
      if (checked) next[key] = checked.value;
      return;
    }

    if (first.type === 'checkbox') {
      next[key] = first.checked ? 'on' : 'off';
      return;
    }

    next[key] = first.value;
  });

  return next;
};

const writeSettingsToScope = (root, settings) => {
  const normalized = normalizeSiteSettings(settings);

  Object.entries(normalized).forEach(([name, value]) => {
    const fields = root.querySelectorAll?.(`[name="${CSS.escape(name)}"]`);
    if (!fields?.length) return;

    fields.forEach((field) => {
      if (field.type === 'radio') {
        field.checked = field.value === value;
        return;
      }

      if (field.type === 'checkbox') {
        field.checked = value === 'on';
        return;
      }

      field.value = value;
    });
  });

  syncSettingsReadouts(root, normalized);
};

const humanizeSettingName = (name = '') => (
  String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
);

const describeSettingValue = (name, value) => (
  SETTING_VALUE_LABELS[name]?.[value]
  || String(value ?? '—')
);

const parseSettingTrigger = (value = '') => {
  const [name = '', option = ''] = String(value).split(':');
  const normalizedName = name.trim();
  const normalizedOption = option.trim();

  if (!normalizedName || !normalizedOption) return null;

  return {
    name: normalizedName,
    value: normalizedOption
  };
};

const STANDALONE_SETTINGS_HINT = 'Choose a mode to update this browser-local setting. The active option stays highlighted.';

const primeSettingTriggerControl = (node) => {
  if (!(node instanceof HTMLElement)) return;

  if (!(node instanceof HTMLButtonElement)) {
    node.setAttribute('role', 'button');
  }

  if (
    !(node instanceof HTMLButtonElement)
    && !(node instanceof HTMLAnchorElement)
    && !node.hasAttribute('tabindex')
  ) {
    node.setAttribute('tabindex', '0');
  }
};

const setSettingTriggerState = (node, isActive) => {
  if (!(node instanceof HTMLElement)) return;

  node.dataset.siteSettingActive = isActive ? 'true' : 'false';

  if (node instanceof HTMLAnchorElement) {
    node.removeAttribute('aria-current');
  }

  if (node instanceof HTMLButtonElement || node.getAttribute('role') === 'button') {
    node.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
};

const resolveSettingTriggerControl = (source, root = document) => {
  const origin = source instanceof Event ? source.target : source;
  if (!(origin instanceof Element)) return null;

  const control = origin.closest('[data-site-setting-set]');
  if (!(control instanceof HTMLElement)) return null;
  if (root instanceof HTMLElement && !root.contains(control)) return null;

  return control;
};

const activateSettingTriggerFromKeyboard = (event, control) => {
  if (!(control instanceof HTMLElement)) return false;
  if (event.defaultPrevented || (event.key !== 'Enter' && event.key !== ' ')) return false;
  if (control instanceof HTMLButtonElement) return false;
  if (control.getAttribute('role') !== 'button') return false;

  event.preventDefault();
  control.click();
  return true;
};

const writeSettingsStatus = (statusNode, message = '', type = 'info') => {
  if (!(statusNode instanceof HTMLElement)) return;
  statusNode.textContent = message;
  statusNode.dataset.status = type;
};

const resolveStandaloneStatusNode = (node) => {
  if (!(node instanceof HTMLElement)) return null;

  const containers = [
    node.closest('[data-site-settings-panel]'),
    node.closest('.vibe-widget'),
    node.closest('.site-frame'),
    node.closest('section, article, aside')
  ].filter(Boolean);

  for (const container of containers) {
    const statusNode = container.querySelector?.('[data-site-settings-status]');
    if (statusNode) return statusNode;
  }

  return null;
};

const applySettingTrigger = (trigger, options = {}) => {
  const {
    statusNode = null,
    onSaved = null
  } = options;

  if (!trigger || !isKnownSetting(trigger.name)) {
    writeSettingsStatus(statusNode, 'Unknown setting control.', 'info');
    return null;
  }

  const validation = validateSetting(trigger.name, trigger.value);
  if (!validation.valid) {
    writeSettingsStatus(
      statusNode,
      `Invalid ${humanizeSettingName(trigger.name)} option.`,
      'info'
    );
    return null;
  }

  const saved = saveSiteSettings({ [trigger.name]: trigger.value });
  syncSettingsReadouts(document, saved);
  writeSettingsStatus(
    statusNode,
    `${humanizeSettingName(trigger.name)} → ${describeSettingValue(trigger.name, trigger.value)}.`,
    'success'
  );
  onSaved?.(saved, trigger);
  return saved;
};

const syncSettingTriggers = (root = document, settings = getSiteSettings()) => {
  const normalized = normalizeSiteSettings(settings);

  root.querySelectorAll?.('[data-site-setting-set]').forEach((node) => {
    const trigger = parseSettingTrigger(node.getAttribute('data-site-setting-set'));
    if (!trigger || !isKnownSetting(trigger.name)) return;
    primeSettingTriggerControl(node);

    const isActive = normalized[trigger.name] === trigger.value;
    setSettingTriggerState(node, isActive);
  });
};

const syncSettingsReadouts = (root = document, settings = getSiteSettings()) => {
  const normalized = normalizeSiteSettings(settings);

  root.querySelectorAll?.('[data-settings-state]').forEach((node) => {
    const key = node.getAttribute('data-settings-state');
    if (!key || !isKnownSetting(key)) return;
    node.textContent = describeSettingValue(key, normalized[key]);
  });

  root.querySelectorAll?.('[data-site-setting-value]').forEach((node) => {
    const key = node.getAttribute('data-site-setting-value');
    if (!key || !isKnownSetting(key)) return;
    node.textContent = describeSettingValue(key, normalized[key]);
  });

  syncSettingTriggers(root, normalized);
};

const writeFieldError = (root, name, message = '') => {
  root.querySelectorAll?.(`[data-site-setting-errors="${CSS.escape(name)}"]`).forEach((node) => {
    node.textContent = message;
    node.hidden = !message;
  });
};

const clearFieldErrors = (root) => {
  root.querySelectorAll?.('[data-site-setting-errors]').forEach((node) => {
    node.textContent = '';
    node.hidden = true;
  });
};

/* ==========================================================================
   8. Independent component binding
   --------------------------------------------------------------------------
   These helpers allow settings widgets to appear on any page independently.
   ========================================================================== */

/**
 * Bind a single settings field.
 *
 * Example:
 * <fieldset data-local-setting-group>
 *   <label><input type="radio" name="colorMode" value="light" data-site-setting></label>
 *   <label><input type="radio" name="colorMode" value="dark" data-site-setting></label>
 * </fieldset>
 *
 * bindSettingsField(field)
 */
const bindSettingsField = (field, options = {}) => {
  if (!(field instanceof HTMLElement)) {
    return { cleanup() {}, refresh() {} };
  }

  const {
    autosave = true,
    root = field.closest('[data-site-settings-scope]') || document,
    onSaved = null
  } = options;

  const name = field.getAttribute('name');
  if (!name || !isKnownSetting(name)) {
    return { cleanup() {}, refresh() {} };
  }

  const syncFromStore = () => {
    writeSettingsToScope(root, getSiteSettings());
  };

  const saveField = () => {
    let value;

    if (field.type === 'checkbox') {
      value = field.checked ? 'on' : 'off';
    } else if (field.type === 'radio') {
      const checked = root.querySelector(`[name="${CSS.escape(name)}"]:checked`);
      value = checked?.value;
    } else {
      value = field.value;
    }

    const validation = validateSetting(name, value);
    if (!validation.valid) {
      writeFieldError(root, name, `Invalid value for ${name}.`);
      return null;
    }

    writeFieldError(root, name, '');
    const saved = saveSiteSettings({ [name]: value });
    syncSettingsReadouts(root, saved);
    onSaved?.(saved, { name, value });
    return saved;
  };

  const handleChange = () => {
    if (!autosave) return;
    saveField();
  };

  syncFromStore();
  field.addEventListener('change', handleChange);

  const off = bus.on?.('settings:changed', (event) => {
    syncSettingsReadouts(root, event.detail);
    writeSettingsToScope(root, event.detail);
  });

  return {
    cleanup() {
      field.removeEventListener('change', handleChange);
      off?.();
    },
    refresh() {
      syncFromStore();
    },
    save: saveField
  };
};

/**
 * Bind a scope containing settings controls.
 *
 * Supports:
 * - full forms
 * - partial forms
 * - small local control clusters on other pages
 *
 * Example:
 * <section data-site-settings-scope>
 *   <label><input type="radio" name="colorMode" value="dark"></label>
 *   <strong data-settings-state="colorMode"></strong>
 * </section>
 *
 * const binding = bindSettingsScope(section);
 */
const bindSettingsScope = (root, options = {}) => {
  if (!(root instanceof HTMLElement)) {
    return { cleanup() {}, refresh() {} };
  }

  const {
    autosave = true,
    debounceMs = 80,
    includePresets = true,
    statusNode = root.querySelector?.('[data-site-settings-status]') || null,
    onSaved = null,
    onPresetApplied = null
  } = options;

  let debounceTimer = null;

  const setStatus = (message, type = 'info') => {
    writeSettingsStatus(statusNode, message, type);
  };

  const syncFromStore = (settings = getSiteSettings()) => {
    writeSettingsToScope(root, settings);
    syncSettingsReadouts(root, settings);
  };

  const saveScope = () => {
    clearFieldErrors(root);

    const partial = collectSettingsFromScope(root);
    const validation = validatePartialSettings(partial);

    if (!validation.valid) {
      validation.errors.forEach((error) => {
        writeFieldError(root, error.name, `Allowed: ${error.allowedValues.join(', ')}`);
      });
      setStatus('Some settings are invalid.', 'info');
      return null;
    }

    const saved = saveSiteSettings(partial);
    syncFromStore(saved);
    setStatus('Saved locally.', 'success');
    onSaved?.(saved);
    return saved;
  };

  const handleChange = () => {
    if (!autosave) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveScope, debounceMs);
  };

  const handleTriggerKeydown = (event) => {
    const control = resolveSettingTriggerControl(event, root);
    activateSettingTriggerFromKeyboard(event, control);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveScope();
  };

  const controls = root.querySelectorAll('input[name], select[name], textarea[name]');
  controls.forEach((field) => field.addEventListener('change', handleChange));
  root.addEventListener('keydown', handleTriggerKeydown);

  if (root.matches('form')) {
    root.addEventListener('submit', handleSubmit);
  }

  const presetHandlers = [];
  if (includePresets) {
    root.querySelectorAll('[data-preset]').forEach((button) => {
      const handler = () => {
        const presetName = button.dataset.preset;
        const preset = PRESETS[presetName];
        if (!preset) return;

        const merged = { ...getSiteSettings(), ...preset };
        const saved = saveSiteSettings(merged);
        syncFromStore(saved);

        const description = manager.describePreset(presetName);
        setStatus(`Applied "${presetName}" preset · ${description?.climate || 'climate'}.`, 'success');

        button.classList.add('is-applied');
        setTimeout(() => button.classList.remove('is-applied'), 1200);

        onPresetApplied?.(saved, presetName);
      };

      button.addEventListener('click', handler);
      presetHandlers.push(() => button.removeEventListener('click', handler));
    });
  }

  const triggerHandlers = [];
  root.querySelectorAll('[data-site-setting-set]').forEach((control) => {
    const handler = (event) => {
      const trigger = parseSettingTrigger(control.getAttribute('data-site-setting-set'));
      if (!trigger) return;

      if (control instanceof HTMLAnchorElement) {
        event.preventDefault();
      }

      const saved = applySettingTrigger(trigger, {
        statusNode,
        onSaved
      });
      if (!saved) return;
      syncFromStore(saved);
    };

    control.addEventListener('click', handler);
    triggerHandlers.push(() => control.removeEventListener('click', handler));
  });

  const resetButton = root.querySelector('[data-site-settings-reset]');
  const handleReset = () => {
    const settings = resetSiteSettings();
    syncFromStore(settings);
    setStatus('Reset to hearth defaults.', 'success');
  };

  resetButton?.addEventListener('click', handleReset);

  const off = bus.on?.('settings:changed', (event) => {
    syncFromStore(event.detail);
  });

  syncFromStore();
  if (statusNode && !statusNode.textContent) {
    const defaultMessage = root.querySelector('[data-site-setting-set]')
      ? STANDALONE_SETTINGS_HINT
      : 'Settings are stored locally in this browser.';
    setStatus(defaultMessage, 'info');
  }

  return {
    cleanup() {
      clearTimeout(debounceTimer);
      controls.forEach((field) => field.removeEventListener('change', handleChange));
      root.removeEventListener('keydown', handleTriggerKeydown);
      if (root.matches('form')) {
        root.removeEventListener('submit', handleSubmit);
      }
      resetButton?.removeEventListener('click', handleReset);
      presetHandlers.forEach((cleanup) => cleanup());
      triggerHandlers.forEach((cleanup) => cleanup());
      off?.();
    },
    refresh() {
      syncFromStore();
    },
    save: saveScope
  };
};

const bindStandaloneSettingTriggers = (root = document, options = {}) => {
  if (!(root instanceof HTMLElement) && root !== document) {
    return { cleanup() {}, refresh() {} };
  }

  const {
    onSaved = null
  } = options;

  const handleClick = (event) => {
    const control = event.target instanceof Element
      ? event.target.closest('[data-site-setting-set]')
      : null;

    if (!(control instanceof HTMLElement)) return;
    if (control.closest('[data-site-settings-form], [data-site-settings-scope]')) return;

    const trigger = parseSettingTrigger(control.getAttribute('data-site-setting-set'));
    if (!trigger) return;

    if (control instanceof HTMLAnchorElement) {
      event.preventDefault();
    }

    applySettingTrigger(trigger, {
      statusNode: resolveStandaloneStatusNode(control),
      onSaved
    });
  };

  const handleKeydown = (event) => {
    const control = resolveSettingTriggerControl(event, root);
    if (!(control instanceof HTMLElement)) return;
    if (control.closest('[data-site-settings-form], [data-site-settings-scope]')) return;
    activateSettingTriggerFromKeyboard(event, control);
  };

  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeydown);

  root.querySelectorAll('[data-site-settings-status]').forEach((statusNode) => {
    if (!statusNode.textContent?.trim()) {
      writeSettingsStatus(statusNode, STANDALONE_SETTINGS_HINT, 'info');
    }
  });

  return {
    cleanup() {
      root.removeEventListener('click', handleClick);
      root.removeEventListener('keydown', handleKeydown);
    },
    refresh() {
      syncSettingsReadouts(document);
    }
  };
};

const bindSettingsReadouts = (root = document) => {
  if (!(root instanceof HTMLElement) && root !== document) {
    return { cleanup() {}, refresh() {} };
  }

  const sync = (settings = getSiteSettings()) => {
    syncSettingsReadouts(root, settings);
    syncDeviationReadouts(root, settings);
  };

  sync();

  const off = bus.on?.('settings:changed', (event) => {
    sync(event.detail);
  });

  return {
    cleanup() {
      off?.();
    },
    refresh() {
      sync();
    }
  };
};

const syncDeviationReadouts = (root = document, settings = getSiteSettings()) => {
  const deviations = listDeviations(settings);
  const described = deviations.map(describeDeviation);

  root.querySelectorAll?.('[data-site-deviation-count]').forEach((node) => {
    node.textContent = String(described.length);
    node.dataset.deviationState = described.length > 0 ? 'deviated' : 'default';
  });

  root.querySelectorAll?.('[data-site-deviation-list]').forEach((host) => {
    host.replaceChildren();
    host.dataset.deviationState = described.length > 0 ? 'deviated' : 'default';

    if (!described.length) {
      const empty = document.createElement('span');
      empty.className = 'site-deviation-empty';
      empty.textContent = 'All settings match the authored default.';
      host.appendChild(empty);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'site-deviation-entries';

    described.forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'site-deviation-entry';
      item.dataset.deviationName = entry.name;

      const name = document.createElement('span');
      name.className = 'site-deviation-name';
      name.textContent = entry.humanName;

      const change = document.createElement('span');
      change.className = 'site-deviation-change';
      change.textContent = `${entry.defaultLabel} → ${entry.currentLabel}`;

      item.append(name, change);

      if (host.dataset.siteDeviationList === 'resettable') {
        const reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'site-deviation-reset';
        reset.textContent = 'reset';
        reset.setAttribute('data-site-deviation-reset', entry.name);
        item.appendChild(reset);
      }

      list.appendChild(item);
    });

    host.appendChild(list);
  });
};

const bindDeviationControls = (root = document) => {
  if (!(root instanceof HTMLElement) && root !== document) {
    return { cleanup() {}, refresh() {} };
  }

  const handleClick = (event) => {
    const target = event.target instanceof Element
      ? event.target.closest('[data-site-deviation-reset]')
      : null;
    if (!(target instanceof HTMLElement)) return;
    const name = target.getAttribute('data-site-deviation-reset');
    if (!name) return;
    resetSingleSetting(name);
  };

  root.addEventListener('click', handleClick);
  syncDeviationReadouts(root);

  const off = bus.on?.('settings:changed', (event) => {
    syncDeviationReadouts(root, event.detail);
  });

  return {
    cleanup() {
      root.removeEventListener('click', handleClick);
      off?.();
    },
    refresh() {
      syncDeviationReadouts(root);
    }
  };
};

/* ==========================================================================
   9. Settings page UI
   --------------------------------------------------------------------------
   The dedicated settings page is now just one bound scope.
   ========================================================================== */

const initSiteSettingsBindings = () => {
  const forms = [...document.querySelectorAll('[data-site-settings-form]')];
  const scopes = [...document.querySelectorAll('[data-site-settings-scope]')]
    .filter((scope) => !forms.some((form) => form === scope || form.contains(scope)));
  const hasStandaloneTriggers = [...document.querySelectorAll('[data-site-setting-set]')]
    .some((control) => !control.closest('[data-site-settings-form], [data-site-settings-scope]'));
  const hasReadouts = Boolean(
    document.querySelector('[data-settings-state], [data-site-setting-value], [data-site-deviation-count], [data-site-deviation-list]')
  );

  if ((!forms.length && !scopes.length && !hasStandaloneTriggers && !hasReadouts) || manager._initialized) return;

  manager._initialized = true;

  const getStatusNode = (root) => (
    root.querySelector('[data-site-settings-status]')
    || root.closest('.site-frame, section, article, aside')?.querySelector('[data-site-settings-status]')
    || document.querySelector('[data-site-settings-status]')
    || null
  );

  const bindings = [...forms, ...scopes].map((root) => bindSettingsScope(root, {
    autosave: true,
    includePresets: true,
    statusNode: getStatusNode(root)
  }));
  const triggers = bindStandaloneSettingTriggers(document);
  const readouts = bindSettingsReadouts(document);
  const deviationControls = bindDeviationControls(document);

  initPwaStatusDisplay();

  return {
    cleanup() {
      bindings.forEach((binding) => binding.cleanup());
      triggers.cleanup();
      readouts.cleanup();
      deviationControls.cleanup();
      manager._initialized = false;
    },
    refresh() {
      bindings.forEach((binding) => binding.refresh());
      triggers.refresh();
      readouts.refresh();
      deviationControls.refresh();
      initPwaStatusDisplay();
    }
  };
};

const syncSettingsCategoryTarget = () => {
  const targeted = [...document.querySelectorAll('.settings-category[data-settings-targeted="true"]')];
  targeted.forEach((node) => delete node.dataset.settingsTargeted);

  if (!window.location.hash) return;

  let target = null;
  try {
    target = document.querySelector(window.location.hash);
  } catch {
    target = null;
  }

  if (!(target instanceof HTMLElement)) return;

  const category = target.matches('.settings-category')
    ? target
    : target.closest('.settings-category');

  if (!(category instanceof HTMLDetailsElement)) return;

  category.open = true;
  category.dataset.settingsTargeted = 'true';
};

const initSettingsCategoryRouting = () => {
  if (manager._settingsCategoryRouting) return manager._settingsCategoryRouting;

  const handleHashChange = () => {
    window.requestAnimationFrame(() => {
      syncSettingsCategoryTarget();
    });
  };

  manager._settingsCategoryRouting = {
    cleanup() {
      window.removeEventListener('hashchange', handleHashChange);
      manager._settingsCategoryRouting = null;
    }
  };

  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();

  return manager._settingsCategoryRouting;
};

const initSiteSettingsPage = () => {
  const bindings = initSiteSettingsBindings();
  const routing = initSettingsCategoryRouting();

  return {
    cleanup() {
      bindings?.cleanup?.();
      routing?.cleanup?.();
    },
    refresh() {
      bindings?.refresh?.();
      syncSettingsCategoryTarget();
    }
  };
};

/* ==========================================================================
   10. PWA status
   ========================================================================== */

const initPwaStatusDisplay = () => {
  if (manager._pwaInitialized) return;
  manager._pwaInitialized = true;

  const installEl = document.querySelector('[data-pwa-install-status]');
  const swEl = document.querySelector('[data-pwa-sw-status]');
  const cacheEl = document.querySelector('[data-pwa-cache-status]');
  const connectionEl = document.querySelector('[data-pwa-connection-status]');

  if (!installEl) return;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  installEl.textContent = isStandalone ? 'Installed' : 'Browser tab';
  installEl.dataset.status = isStandalone ? 'active' : 'inactive';

  if (shouldDisableServiceWorkerInDevelopment()) {
    if (swEl) {
      swEl.textContent = 'Disabled in local dev';
      swEl.dataset.status = 'inactive';
    }
    if (cacheEl) {
      cacheEl.textContent = 'Bypassed';
      cacheEl.dataset.status = 'inactive';
    }
  } else if (navigator.serviceWorker?.controller) {
    swEl.textContent = 'Active';
    swEl.dataset.status = 'active';
  } else if (navigator.serviceWorker) {
    swEl.textContent = 'Registering…';
    swEl.dataset.status = 'inactive';
    navigator.serviceWorker.ready.then(() => {
      swEl.textContent = 'Active';
      swEl.dataset.status = 'active';
    }).catch(() => {
      swEl.textContent = 'Error';
      swEl.dataset.status = 'error';
    });
  } else {
    swEl.textContent = 'Unsupported';
    swEl.dataset.status = 'error';
  }

  if (shouldDisableServiceWorkerInDevelopment()) {
    // Local development intentionally bypasses cache-backed PWA behavior.
  } else if ('caches' in window) {
    caches.keys().then((names) => {
      const count = names.length;
      cacheEl.textContent = count > 0 ? `${count} cache${count > 1 ? 's' : ''}` : 'Empty';
      cacheEl.dataset.status = count > 0 ? 'active' : 'inactive';
    }).catch(() => {
      cacheEl.textContent = 'Error';
      cacheEl.dataset.status = 'error';
    });
  } else {
    cacheEl.textContent = 'Unsupported';
    cacheEl.dataset.status = 'error';
  }

  const updateConnection = () => {
    const online = navigator.onLine;
    connectionEl.textContent = online ? 'Online' : 'Offline';
    connectionEl.dataset.status = online ? 'active' : 'inactive';
  };

  updateConnection();
  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);
};

/* ==========================================================================
   11. Runtime API
   ========================================================================== */

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
    presets: PRESETS,
    describePreset: (name) => manager.describePreset(name),
    initBindings: initSiteSettingsBindings,
    manager
  };
}

/* ==========================================================================
   12. Exports
   ========================================================================== */

export {
  DEFAULT_SITE_SETTINGS,
  DEVELOPMENTAL_CLIMATES,
  PRESETS,
  SETTING_OPTIONS,
  SITE_SETTINGS_KEY,
  applySiteSettings,
  bindDeviationControls,
  bindSettingsField,
  bindSettingsReadouts,
  bindSettingsScope,
  bindStandaloneSettingTriggers,
  collectSettingsFromScope,
  describeDeviation,
  emitSettingsChange,
  getSettingValue,
  getSiteSettingDeviations,
  getSiteSettingModifiers,
  getSiteSettings,
  initSiteSettingsBindings,
  initSiteSettingsPage,
  normalizeSiteSettings,
  resetSingleSetting,
  resetSiteSettings,
  sanitizePartialSettings,
  saveSiteSettings,
  shouldUseViewportActivation,
  syncDeviationReadouts,
  syncSettingsReadouts,
  validatePartialSettings,
  validateSetting,
  writeSettingsToScope
};
