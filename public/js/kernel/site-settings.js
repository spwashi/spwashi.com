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
 * properties to the document, exposes derived modifiers, and binds settings
 * controls anywhere on the site.
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
import {
  DEFAULT_PALETTE_RESONANCE,
  PALETTE_RESONANCE_OPTIONS,
  getPaletteResonanceSwatches
} from '/public/js/interface/palette-resonance.js';
import { shouldDisableServiceWorkerInDevelopment } from '/public/js/kernel/runtime-environment.js';
import {
  clearPins,
  getPinStorageKey,
  readPins,
} from '/public/js/runtime/pin-registry.js';

const SITE_SETTINGS_KEY = 'spw-site-settings';
const CAULDRON_STORAGE_KEY = 'spw-cauldron';
const DISCOVERY_DISMISSALS_STORAGE_KEY = 'spw-discovery-notice-dismissals';
const VISITED_IMAGE_STORAGE_KEY = 'spw-visited-image-surfaces';

const THEME_PACK_OPTIONS = Object.freeze([
  'neutral-paper',
  'oxide-ledger',
  'electric-studio',
  'ritual-vellum',
  'copper-brace',
  'glass-console'
]);

// Icon pack consideration (theming + icon packs plan started per while-working note).
// Lightweight semantic extension for different icon/visual treatments (text operators vs symbol vs regional/project motifs).
// Integrates with existing SVG tunability (project-motif), operator-chip, spec-pill, and design/ specimens.
// Stubbed here so the settings system, dataset writes, and design catalog can recognize 'iconPack' immediately.
// No UI or heavy logic yet; just the semantic + defaults for forward compatibility and instrumentation.
const ICON_PACK_OPTIONS = Object.freeze([
  'text',      // current: sigils + text operators (default)
  'symbol',    // more glyph / icon-forward
  'regional'   // local / project-specific motifs (ties to regional screenshot value + project dev notes)
]);

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

const COLOR_TUNER_PROFILE = Object.freeze({
  soft: Object.freeze({lightingGuard: 0.18, regionFrameAlpha: 0.18, regionFillAlpha: 0.04, controlContrastLift: 0.08}),
  balanced: Object.freeze({lightingGuard: 0.34, regionFrameAlpha: 0.26, regionFillAlpha: 0.07, controlContrastLift: 0.16}),
  guarded: Object.freeze({lightingGuard: 0.58, regionFrameAlpha: 0.38, regionFillAlpha: 0.1, controlContrastLift: 0.3})
});

const SPACING_TUNER_PROFILE = Object.freeze({
  compact: Object.freeze({scale: 0.88}),
  balanced: Object.freeze({scale: 1}),
  roomy: Object.freeze({scale: 1.16})
});

const LAYOUT_TUNER_PROFILE = Object.freeze({
  reading: Object.freeze({measure: '72ch', frameMax: 'var(--page-width-reading, 68rem)', columnMin: '16rem'}),
  wide: Object.freeze({measure: '82ch', frameMax: 'var(--page-width-wide, 82rem)', columnMin: '18rem'}),
  atlas: Object.freeze({measure: '92ch', frameMax: 'var(--page-width-atlas, 96rem)', columnMin: '20rem'})
});

const INTERACTION_TUNER_PROFILE = Object.freeze({
  calm: Object.freeze({scale: 0.82}),
  responsive: Object.freeze({scale: 1}),
  expressive: Object.freeze({scale: 1.18})
});

const HEADER_OPACITY_VALUE = Object.freeze({
  low: '0.76',
  normal: '0.9',
  high: '1'
});

const WONDER_MEMORY_PROFILE = Object.freeze({
  off: Object.freeze({strength: 0, ttlMs: 0, reach: 0}),
  nearby: Object.freeze({strength: 0.56, ttlMs: 28000, reach: 0.54}),
  sitewide: Object.freeze({strength: 0.92, ttlMs: 96000, reach: 1})
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

const SVG_SCALE_PROFILE = Object.freeze({
  compact: Object.freeze({
    surfaceMax: '38rem',
    scaleFactor: 0.9,
    labelScale: 0.96,
    gapScale: 0.92
  }),
  balanced: Object.freeze({
    surfaceMax: '52rem',
    scaleFactor: 1,
    labelScale: 1,
    gapScale: 1
  }),
  expansive: Object.freeze({
    surfaceMax: '68rem',
    scaleFactor: 1.12,
    labelScale: 1.06,
    gapScale: 1.12
  })
});

const SVG_STORY_PROFILE = Object.freeze({
  quiet: Object.freeze({
    narrativeIntensity: 0.72,
    railIntensity: 0.82,
    pointerLift: 0.82,
    captionOpacity: 0.92
  }),
  guided: Object.freeze({
    narrativeIntensity: 1,
    railIntensity: 1,
    pointerLift: 1,
    captionOpacity: 1
  }),
  immersive: Object.freeze({
    narrativeIntensity: 1.18,
    railIntensity: 1.12,
    pointerLift: 1.14,
    captionOpacity: 1.06
  })
});

const AUTHOR_WORKFLOW_TOKEN_VALUE = Object.freeze({
  draft: Object.freeze({
    annotationStrength: 0.26,
    marginPresence: 0.34,
    threadDensity: 0.32,
    draftPrivacy: 0.82,
    publicationReadiness: 0.08
  }),
  revise: Object.freeze({
    annotationStrength: 0.56,
    marginPresence: 0.58,
    threadDensity: 0.56,
    draftPrivacy: 0.56,
    publicationReadiness: 0.32
  }),
  polish: Object.freeze({
    annotationStrength: 0.42,
    marginPresence: 0.46,
    threadDensity: 0.44,
    draftPrivacy: 0.36,
    publicationReadiness: 0.68
  }),
  publish: Object.freeze({
    annotationStrength: 0.32,
    marginPresence: 0.38,
    threadDensity: 0.28,
    draftPrivacy: 0.18,
    publicationReadiness: 0.92
  }),
  archive: Object.freeze({
    annotationStrength: 0.22,
    marginPresence: 0.3,
    threadDensity: 0.22,
    draftPrivacy: 0.24,
    publicationReadiness: 0.5
  })
});

const DEVELOPMENTAL_CLIMATES = Object.freeze({
  orient: Object.freeze({
    id: 'orient',
    label: 'kindle',
    authorLabel: 'find the page',
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
    authorLabel: 'hold the structure',
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
    authorLabel: 'connect the material',
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
    authorLabel: 'test the voice',
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
    authorLabel: 'prepare the gift',
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
  colorTuner: 'balanced',
  themePack: 'neutral-paper',
  iconPack: 'text',  // new consideration stub
  pedagogicalFlavor: 'culinary',
  paletteResonance: DEFAULT_PALETTE_RESONANCE,
  baseMetamaterial: 'glass',  // 'matte' acts as the clear-contrast opaque safeguard (see material.css + surface_material_contract)
  baseAffordance: 'read',
  componentDensity: 'soft',
  operatorSaturation: 'normal',
  numericityEmphasis: 'subtle',
  animationIntensity: 'normal',
  contourProfile: 'balanced',
  strokeProfile: 'structural',
  svgScaleProfile: 'balanced',
  svgStoryProfile: 'guided',
  fieldResonance: 'field',
  spacingTuner: 'balanced',
  layoutTuner: 'reading',
  interactionTuner: 'calm',
  componentLifecycle: 'stable',

  debugMode: 'off',
  showFrameMetadata: 'off',
  verboseLogging: 'off',

  fontSizeScale: '100',
  lineSpacing: 'normal',
  monospaceVariant: 'jetbrains',
  typesettingMode: 'default',
  readingGrooveMode: 'on',
  scrollCadence: 'on',
  pinchTextScale: 'on',

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

  /* New Spw semantics for metacognition and mindful overflow (2026+ direction) */
  metacognitiveStance: 'witness',
  processAttention: 'breath',
  overflowMode: 'contained',

  authorMode: 'draft',
  currentDevelopmentalClimate: 'orient',
  developmentalClimateAutoCycle: 'off',
  narrativeMode: 'off', // Inline prose token lens for narrative surfaces.

  /* Metacognitive and mindful profiles — encourage readers to notice their own stance */
  metacognitiveStance: 'witness',
  processAttention: 'breath',
  overflowMode: 'contained',

  /* Shell navigation chrome configuration (adaptive vs modal overlay etc). */
  shellMenuPresentation: 'adaptive',

  grainIntensity: 'subtle',

  /* Flexible 'reason' about interaction physics / navigability (fun, updatable descriptor for gamified feel,
     component response, menu spring, wonder gamification, pattern locks). Can be set via bench/query/design
     to explore business (precise, high-density) vs experiential (playful, calm) postures. Written as
     data-spw-physics-reason for granular CSS/selector relationship to the abstraction. */
  physicsReason: '',

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
  colorTuner: new Set(['soft', 'balanced', 'guarded']),
  themePack: new Set(THEME_PACK_OPTIONS),
  iconPack: new Set(ICON_PACK_OPTIONS),
  pedagogicalFlavor: new Set(['culinary', 'garden', 'studio', 'runtime']),
  paletteResonance: new Set(PALETTE_RESONANCE_OPTIONS),
  baseMetamaterial: new Set(['paper', 'glass', 'matte', 'field']),
  baseAffordance: new Set(['read', 'tune', 'inspect', 'orient']),
  componentDensity: new Set(['dense', 'soft', 'roomy']),
  operatorSaturation: new Set(['muted', 'normal', 'vibrant']),
  numericityEmphasis: new Set(['subtle', 'prominent', 'cauldron-first']),
  animationIntensity: new Set(['reduced', 'normal', 'enhanced']),
  contourProfile: new Set(['tight', 'balanced', 'soft']),
  strokeProfile: new Set(['hairline', 'structural', 'bold']),
  svgScaleProfile: new Set(['compact', 'balanced', 'expansive']),
  svgStoryProfile: new Set(['quiet', 'guided', 'immersive']),
  fieldResonance: new Set(['local', 'field', 'choral']),
  spacingTuner: new Set(['compact', 'balanced', 'roomy']),
  layoutTuner: new Set(['reading', 'wide', 'atlas']),
  interactionTuner: new Set(['calm', 'responsive', 'expressive']),
  componentLifecycle: new Set(['draft', 'stable', 'active', 'archived']),

  debugMode: new Set(['off', 'on']),
  showFrameMetadata: new Set(['off', 'on']),
  verboseLogging: new Set(['off', 'on']),

  fontSizeScale: new Set(['70', '80', '90', '100', '110', '120']),
  lineSpacing: new Set(['compact', 'normal', 'loose']),
  monospaceVariant: new Set(['system', 'jetbrains', 'courier']),
  typesettingMode: new Set(['default', 'editorial']),
  readingGrooveMode: new Set(['off', 'on']),
  scrollCadence: new Set(['off', 'on']),
  pinchTextScale: new Set(['off', 'on']),

  showFooter: new Set(['on', 'off']),
  headerOpacity: new Set(['low', 'normal', 'high']),
  showSpecPills: new Set(['on', 'off']),

  animationThrottling: new Set(['off', 'light', 'heavy']),
  imageLazyLoading: new Set(['on', 'off']),

  enhancementLevel: new Set(['minimal', 'balanced', 'rich']),
  cauldronCandidateVisibility: new Set(['subtle', 'balanced', 'prominent']),
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

  authorMode: new Set(AUTHOR_WORKFLOW_MODES),
  currentDevelopmentalClimate: new Set(Object.keys(DEVELOPMENTAL_CLIMATES)),
  developmentalClimateAutoCycle: new Set(['off', 'on']),
  narrativeMode: new Set(['off', 'on']),

  grainIntensity: new Set(['none', 'subtle', 'moderate', 'rich']),

  busDiagnostics: new Set(['off', 'basic', 'verbose']),
  busMirrorToConsole: new Set(['off', 'on']),
  busHistorySize: new Set(['100', '250', '500']),

  shellMenuPresentation: new Set(['adaptive', 'modal', 'drawer']),

  // Flexible descriptor (not a strict enum): supports research/exploration of "reason" for gamified
  // navigability, component locality physics, semantic density effects on feel. Any short token ok;
  // validate is intentionally permissive for 'physicsReason'.
  physicsReason: new Set(['', 'calm', 'playful', 'precise', 'expressive', 'springy', 'locked', 'puppet', 'screenshot', 'adaptive-shell', 'clear-contrast-safeguard', 'memory-gamified'])
});

const PRESETS = Object.freeze({
  hearth: Object.freeze({
    authorMode: 'draft',
    currentDevelopmentalClimate: 'orient',
    navigatorDisplay: 'quiet',
    consoleDisplay: 'hidden',
    colorMode: 'auto',
    colorTuner: 'balanced',
    themePack: 'neutral-paper',
    pedagogicalFlavor: 'culinary',
    operatorSaturation: 'normal',
    animationIntensity: 'normal',
    contourProfile: 'balanced',
    strokeProfile: 'structural',
    svgScaleProfile: 'balanced',
    svgStoryProfile: 'guided',
    fieldResonance: 'local',
    spacingTuner: 'balanced',
    interactionTuner: 'calm',
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
    cauldronCandidateVisibility: 'balanced',
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
  }),
  loom: Object.freeze({
    authorMode: 'revise',
    currentDevelopmentalClimate: 'weave',
    semanticDensity: 'rich',
    grainIntensity: 'moderate',
    themePack: 'electric-studio',
    colorTuner: 'balanced',
    pedagogicalFlavor: 'studio',
    operatorSaturation: 'vibrant',
    animationIntensity: 'enhanced',
    contourProfile: 'soft',
    strokeProfile: 'structural',
    svgScaleProfile: 'expansive',
    svgStoryProfile: 'immersive',
    fieldResonance: 'choral',
    spacingTuner: 'balanced',
    interactionTuner: 'expressive',
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
  }),
  workshop: Object.freeze({
    authorMode: 'revise',
    currentDevelopmentalClimate: 'anchor',
    navigatorDisplay: 'full',
    consoleDisplay: 'expanded',
    themePack: 'glass-console',
    colorTuner: 'guarded',
    pedagogicalFlavor: 'runtime',
    semanticDensity: 'rich',
    contourProfile: 'tight',
    strokeProfile: 'bold',
    svgScaleProfile: 'compact',
    svgStoryProfile: 'quiet',
    fieldResonance: 'field',
    spacingTuner: 'compact',
    interactionTuner: 'responsive',
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
  }),
  access: Object.freeze({
    authorMode: 'draft',
    currentDevelopmentalClimate: 'anchor',
    highContrast: 'on',
    reduceMotion: 'on',
    themePack: 'neutral-paper',
    colorTuner: 'guarded',
    pedagogicalFlavor: 'culinary',
    fontSize: 'large',
    fontSizeScale: '120',
    lineSpacing: 'loose',
    animationIntensity: 'reduced',
    animationThrottling: 'heavy',
    contourProfile: 'balanced',
    strokeProfile: 'bold',
    svgScaleProfile: 'compact',
    svgStoryProfile: 'quiet',
    fieldResonance: 'local',
    spacingTuner: 'roomy',
    interactionTuner: 'calm',
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
  })
});

const SETTING_VALUE_LABELS = Object.freeze({
  navigatorDisplay: Object.freeze({quiet: 'Quiet', full: 'Full', hidden: 'Hidden'}),
  consoleDisplay: Object.freeze({collapsed: 'Collapsed', expanded: 'Expanded', hidden: 'Hidden'}),
  viewportActivation: Object.freeze({off: 'Off', on: 'On'}),
  reduceMotion: Object.freeze({off: 'Motion allowed', on: 'Reduced motion'}),
  highContrast: Object.freeze({off: 'Standard contrast', on: 'High contrast'}),
  fontSize: Object.freeze({small: 'Small', normal: 'Normal', large: 'Large'}),
  colorMode: Object.freeze({auto: 'Adaptive', light: 'Light', dark: 'Dark'}),
  colorTuner: Object.freeze({soft: 'Soft light', balanced: 'Balanced light', guarded: 'Guarded contrast'}),
  themePack: Object.freeze({
    'neutral-paper': 'Neutral paper',
    'oxide-ledger': 'Oxide ledger',
    'electric-studio': 'Electric studio',
    'ritual-vellum': 'Ritual vellum',
    'copper-brace': 'Copper brace',
    'glass-console': 'Glass console'
  }),
  pedagogicalFlavor: Object.freeze({culinary: 'Culinary', garden: 'Garden', studio: 'Studio', runtime: 'Runtime'}),
  paletteResonance: Object.freeze({
    route: 'Context-led',
    craft: 'Craft-led',
    software: 'Software-led',
    math: 'Math-led'
  }),
  baseMetamaterial: Object.freeze({paper: 'Paper', glass: 'Glass', matte: 'Matte', field: 'Field'}),
  baseAffordance: Object.freeze({read: 'Read', tune: 'Tune', inspect: 'Inspect', orient: 'Orient'}),
  componentDensity: Object.freeze({dense: 'Dense', soft: 'Soft', roomy: 'Roomy'}),
  operatorSaturation: Object.freeze({muted: 'Muted', normal: 'Normal', vibrant: 'Vibrant'}),
  animationIntensity: Object.freeze({reduced: 'Reduced', normal: 'Normal', enhanced: 'Enhanced'}),
  contourProfile: Object.freeze({tight: 'Tight', balanced: 'Balanced', soft: 'Soft'}),
  strokeProfile: Object.freeze({hairline: 'Hairline', structural: 'Structural', bold: 'Bold'}),
  svgScaleProfile: Object.freeze({compact: 'Compact', balanced: 'Balanced', expansive: 'Expansive'}),
  svgStoryProfile: Object.freeze({quiet: 'Quiet', guided: 'Guided', immersive: 'Immersive'}),
  fieldResonance: Object.freeze({local: 'Local', field: 'Field', choral: 'Choral'}),
  spacingTuner: Object.freeze({compact: 'Compact', balanced: 'Balanced', roomy: 'Roomy'}),
  layoutTuner: Object.freeze({reading: 'Reading', wide: 'Wide', atlas: 'Atlas'}),
  interactionTuner: Object.freeze({calm: 'Calm', responsive: 'Responsive', expressive: 'Expressive'}),
  componentLifecycle: Object.freeze({draft: 'Draft', stable: 'Stable', active: 'Active', archived: 'Archived'}),
  narrativeMode: Object.freeze({off: 'Off', on: 'On'}),
  debugMode: Object.freeze({off: 'Off', on: 'On'}),
  showFrameMetadata: Object.freeze({off: 'Hidden', on: 'Shown'}),
  verboseLogging: Object.freeze({off: 'Off', on: 'On'}),
  fontSizeScale: Object.freeze({70: '70%', 80: '80%', 90: '90%', 100: '100%', 110: '110%', 120: '120%'}),
  lineSpacing: Object.freeze({compact: 'Compact', normal: 'Normal', loose: 'Loose'}),
  monospaceVariant: Object.freeze({system: 'System mono', jetbrains: 'JetBrains Mono', courier: 'Courier'}),
  typesettingMode: Object.freeze({default: 'Default', editorial: 'Editorial'}),
  readingGrooveMode: Object.freeze({off: 'Off', on: 'On'}),
  scrollCadence: Object.freeze({off: 'Off', on: 'On'}),
  pinchTextScale: Object.freeze({off: 'Off', on: 'On'}),
  showFooter: Object.freeze({on: 'Shown', off: 'Hidden'}),
  headerOpacity: Object.freeze({low: 'Low', normal: 'Normal', high: 'High'}),
  showSpecPills: Object.freeze({on: 'Shown', off: 'Hidden'}),
  animationThrottling: Object.freeze({off: 'Off', light: 'Light', heavy: 'Heavy'}),
  imageLazyLoading: Object.freeze({on: 'Lazy loading', off: 'Eager loading'}),
  enhancementLevel: Object.freeze({minimal: 'Minimal', balanced: 'Balanced', rich: 'Rich'}),
  cauldronCandidateVisibility: Object.freeze({subtle: 'Subtle', balanced: 'Balanced', prominent: 'Prominent'}),
  semanticDensity: Object.freeze({minimal: 'Minimal', normal: 'Normal', rich: 'Rich'}),
  operatorPresentation: Object.freeze({symbolic: 'Symbolic', full: 'Full', text: 'Text'}),
  infospaceComplexity: Object.freeze({simple: 'Simple', adaptive: 'Adaptive', complex: 'Complex'}),
  cognitiveHandles: Object.freeze({off: 'Off', on: 'On'}),
  dimensionalBreadcrumbs: Object.freeze({off: 'Off', on: 'On'}),
  fractalNesting: Object.freeze({off: 'Off', on: 'On'}),
  implementationMutations: Object.freeze({off: 'Off', on: 'On'}),
  showSemanticMetadata: Object.freeze({off: 'Hidden', on: 'Shown'}),
  operatorHighlighting: Object.freeze({off: 'Off', on: 'On'}),
  relationalVisualization: Object.freeze({off: 'Off', on: 'On'}),
  wonderMemory: Object.freeze({off: 'Focused', nearby: 'Connected', sitewide: 'Immersive'}),
  developmentalIndicators: Object.freeze({off: 'Off', on: 'On'}),
  depthIndicators: Object.freeze({off: 'Off', on: 'On'}),
  authorMode: Object.freeze({
    draft: 'Draft',
    revise: 'Revise',
    polish: 'Polish',
    publish: 'Publish',
    archive: 'Archive'
  }),
  currentDevelopmentalClimate: Object.freeze({
    orient: 'Kindle',
    anchor: 'Anchor',
    weave: 'Weave',
    rehearse: 'Rehearse',
    offer: 'Offer'
  }),
  developmentalClimateAutoCycle: Object.freeze({off: 'Off', on: 'On'}),
  grainIntensity: Object.freeze({none: 'None', subtle: 'Subtle', moderate: 'Moderate', rich: 'Rich'}),
  busDiagnostics: Object.freeze({off: 'Off', basic: 'Basic', verbose: 'Verbose'}),
  busMirrorToConsole: Object.freeze({off: 'Off', on: 'On'}),
  busHistorySize: Object.freeze({100: '100 events', 250: '250 events', 500: '500 events'}),
  physicsReason: Object.freeze({ '': '— (use interactionTuner + density)', calm: 'Calm', playful: 'Playful (gamified nav)', precise: 'Precise (business tools)', expressive: 'Expressive', springy: 'Springy', locked: 'Locked (pattern)', puppet: 'Puppet (lab)', screenshot: 'Screenshot-ready', 'adaptive-shell': 'Adaptive shell', 'clear-contrast-safeguard': 'Clear contrast', 'memory-gamified': 'Memory gamified' })
});

const PRESET_LABELS = Object.freeze({
  hearth: 'Hearth',
  loom: 'Loom',
  workshop: 'Workshop',
  access: 'Access'
});

const PRESET_DESCRIPTIONS = Object.freeze({
  hearth: 'Calm baseline for ordinary reading.',
  loom: 'Expressive semantic surface with richer visual feedback.',
  workshop: 'Inspection-forward setup for implementation and debugging.',
  access: 'Larger, calmer, higher-guidance setup for reduced friction.'
});

const UX_RECIPES = Object.freeze({
  draft: Object.freeze({
    label: 'Draft comfortably',
    settings: Object.freeze({
      authorMode: 'draft',
      currentDevelopmentalClimate: 'orient',
      typesettingMode: 'editorial',
      readingGrooveMode: 'on',
      scrollCadence: 'on',
      pinchTextScale: 'on',
      semanticDensity: 'minimal',
      wonderMemory: 'nearby',
      showSemanticMetadata: 'off',
      showSpecPills: 'off',
      consoleDisplay: 'hidden'
    })
  }),
  revise: Object.freeze({
    label: 'Revise with annotations',
    settings: Object.freeze({
      authorMode: 'revise',
      currentDevelopmentalClimate: 'rehearse',
      typesettingMode: 'editorial',
      readingGrooveMode: 'on',
      scrollCadence: 'on',
      pinchTextScale: 'on',
      semanticDensity: 'normal',
      operatorHighlighting: 'on',
      relationalVisualization: 'on',
      wonderMemory: 'nearby'
    })
  }),
  publish: Object.freeze({
    label: 'Prepare for readers',
    settings: Object.freeze({
      authorMode: 'publish',
      currentDevelopmentalClimate: 'offer',
      typesettingMode: 'editorial',
      readingGrooveMode: 'on',
      scrollCadence: 'on',
      pinchTextScale: 'on',
      semanticDensity: 'normal',
      enhancementLevel: 'balanced',
      showSemanticMetadata: 'on',
      developmentalIndicators: 'on'
    })
  }),
  calm: Object.freeze({
    label: 'Calm the site',
    settings: Object.freeze({
      themePack: 'neutral-paper',
      grainIntensity: 'none',
      operatorSaturation: 'muted',
      animationIntensity: 'reduced',
      fieldResonance: 'local',
      wonderMemory: 'off',
      showSpecPills: 'off',
      semanticDensity: 'minimal',
      enhancementLevel: 'minimal',
      infospaceComplexity: 'simple'
    })
  }),
  readable: Object.freeze({
    label: 'Make reading easier',
    settings: Object.freeze({
      fontSize: 'large',
      fontSizeScale: '110',
      lineSpacing: 'loose',
      componentDensity: 'roomy',
      typesettingMode: 'editorial',
      readingGrooveMode: 'on',
      scrollCadence: 'on',
      pinchTextScale: 'on'
    })
  }),
  accessible: Object.freeze({
    label: 'Reduce friction',
    settings: Object.freeze({
      highContrast: 'on',
      reduceMotion: 'on',
      fontSize: 'large',
      fontSizeScale: '120',
      lineSpacing: 'loose',
      animationIntensity: 'reduced',
      animationThrottling: 'heavy',
      strokeProfile: 'bold',
      grainIntensity: 'none',
      pinchTextScale: 'off'
    })
  }),
  expressive: Object.freeze({
    label: 'Make it expressive',
    settings: Object.freeze({
      themePack: 'electric-studio',
      paletteResonance: 'route',
      operatorSaturation: 'vibrant',
      semanticDensity: 'rich',
      enhancementLevel: 'rich',
      fieldResonance: 'choral',
      wonderMemory: 'sitewide',
      showSpecPills: 'on',
      operatorHighlighting: 'on'
    })
  }),
  focus: Object.freeze({
    label: 'Focus the current page',
    settings: Object.freeze({
      navigatorDisplay: 'quiet',
      consoleDisplay: 'hidden',
      showFooter: 'off',
      showSpecPills: 'off',
      wonderMemory: 'off',
      semanticDensity: 'minimal',
      infospaceComplexity: 'simple'
    })
  }),
  developer: Object.freeze({
    label: 'Inspect the system',
    settings: Object.freeze({
      navigatorDisplay: 'full',
      consoleDisplay: 'expanded',
      debugMode: 'on',
      showFrameMetadata: 'on',
      showSemanticMetadata: 'on',
      busDiagnostics: 'verbose',
      busMirrorToConsole: 'on',
      busHistorySize: '500'
    })
  }),
  default: Object.freeze({
    label: 'Restore authored default',
    settings: Object.freeze(DEFAULT_SITE_SETTINGS)
  })
});

const SETTINGS_QUERY_RECIPES = Object.freeze({
  quiet: Object.freeze({
    label: 'Quiet view',
    description: 'Minimal meaning, no debug chrome, and a quiet reading posture.',
    params: Object.freeze({
      view: 'quiet',
      meaning: 'quiet'
    })
  }),
  readable: Object.freeze({
    label: 'Readable view',
    description: 'Visible semantic cues without the full inspection layer.',
    params: Object.freeze({
      view: 'readable',
      meaning: 'readable'
    })
  }),
  reader: Object.freeze({
    label: 'Reader view',
    description: 'A calm, prose-forward surface for readers who want less chrome.',
    params: Object.freeze({
      view: 'readable',
      meaning: 'readable',
      interaction: 'calm'
    })
  }),
  inspect: Object.freeze({
    label: 'Inspect view',
    description: 'The page explains itself, shows debug chrome, and logs more detail.',
    params: Object.freeze({
      view: 'inspect',
      meaning: 'inspect',
      debug: 'css,layout',
      diagnostics: 'basic',
      log: 'site-settings,layout-shift',
      'log-level': 'debug',
    })
  }),
  builder: Object.freeze({
    label: 'Builder view',
    description: 'Expose structural chrome for visitors who want the mechanics visible and repeatable.',
    params: Object.freeze({
      view: 'inspect',
      meaning: 'inspect',
      debug: 'css,layout',
      diagnostics: 'basic',
      log: 'layout-shift',
      'log-level': 'debug',
      physics: 'puppet'
    })
  }),
  lab: Object.freeze({
    label: 'Lab view',
    description: 'Inspection plus physics and palette bias for design work, QA, and recorded practice.',
    params: Object.freeze({
      view: 'inspect',
      meaning: 'inspect',
      debug: 'css,layout',
      diagnostics: 'verbose',
      log: 'site-settings,layout-shift',
      'log-level': 'debug',
      physics: 'screenshot',
      palette: 'craft',
      reflow: 'interaction'
    })
  })
});

const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const getSettingsQueryRecipe = (name = 'inspect') => SETTINGS_QUERY_RECIPES[name] || SETTINGS_QUERY_RECIPES.inspect;

const buildSettingsQuerySearch = (name = 'inspect') => buildQueryString(getSettingsQueryRecipe(name).params);

const buildSettingsQueryHref = (name = 'inspect', location = window.location) => {
  const query = buildSettingsQuerySearch(name);
  const path = location?.pathname || '';
  const hash = location?.hash || '';
  return `${path}${query}${hash}`;
};

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
  density: 'semanticDensity',
  'semantic-density': 'semanticDensity',
  enhancement: 'enhancementLevel',
  'enhancement-level': 'enhancementLevel',
  'cauldron-visibility': 'cauldronCandidateVisibility',
  'cauldron-candidate-visibility': 'cauldronCandidateVisibility',
  motif: 'componentMotif',
  'component-motif': 'componentMotif'
});

const parseSettingsFromSearch = (search = window.location.search) => {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const next = {};

  params.forEach((value, key) => {
    const settingName = QUERY_SETTING_ALIASES[key] || key;
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
    const candidate = value[key];
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
      document.documentElement.dataset.spwCauldronCount = '0';
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

  for (let index = 0; index < 4; index += 1) {
    const value = swatches[index];
    const name = `--spw-palette-probe-${index + 1}`;
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  }
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
      layoutFrameMax: layoutTuner.frameMax,
      layoutColumnMin: layoutTuner.columnMin,
      interactionScale: interactionTuner.scale
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
const buildDatasetEntries = (normalized, modifiers, deviations, climate) => {
  const deviationNames = deviations.map((entry) => entry.name);
  const entries = {
    authorMode: modifiers.author.mode,
    spwAuthorMode: modifiers.author.mode,
    spwAuthorIntent: modifiers.author.intent,
    spwNavigator: normalized.navigatorDisplay,
    spwConsole: normalized.consoleDisplay,
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
    spwDimensionalBreadcrumbs: normalized.dimensionalBreadcrumbs,
    spwFractalNesting: normalized.fractalNesting,
    spwMetacognitiveStance: normalized.metacognitiveStance,
    spwProcessAttention: normalized.processAttention,
    spwOverflowMode: normalized.overflowMode,
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
    spwDeviationState: deviations.length > 0 ? 'deviated' : 'default'
  };

  // Semantic currents (emergent clusters...) – kept here as part of the dataset builder.
  const currentSignature = [
    normalized.semanticDensity,
    normalized.interactionTuner || 'balanced',
    document.documentElement?.dataset?.spwLoadPosture || 'normal'
  ].filter(Boolean).join('+');
  entries.spwSemanticCurrent = currentSignature || null;

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
    if (this.body) setDatasetEntries(this.body, datasetEntries);

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
  initSiteSettingsBindings();

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

const setPressedState = (node, isActive) => {
  if (!(node instanceof HTMLElement)) return;
  node.dataset.siteSettingActive = isActive ? 'true' : 'false';
  if (node instanceof HTMLButtonElement || node.getAttribute('role') === 'button') {
    node.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
};

const primeButtonLikeControl = (node) => {
  if (!(node instanceof HTMLElement)) return;
  if (!(node instanceof HTMLButtonElement)) node.setAttribute('role', 'button');
  if (!(node instanceof HTMLButtonElement) && !(node instanceof HTMLAnchorElement) && !node.hasAttribute('tabindex')) {
    node.setAttribute('tabindex', '0');
  }
};

const parseSettingTrigger = (value = '') => {
  const [name = '', option = ''] = String(value).split(':');
  const normalizedName = name.trim();
  const normalizedOption = option.trim();
  if (!normalizedName || !normalizedOption) return null;
  return {name: normalizedName, value: normalizedOption};
};

/** Supports compound "baseMetamaterial:matte;highContrast:on" (or & , separators)
 *  used by design bench global-apply buttons and future clustered controls.
 *  Returns array (possibly length 1) so callers can batch-save through kernel.
 */
const parseSettingTriggers = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return [];
  // Split on ; & or | for compound intent (human-friendly in data attrs)
  const segments = raw.split(/[;&|]+/).map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const seg of segments) {
    if (!seg) continue;
    const single = parseSettingTrigger(seg);
    if (single) {
      out.push(single);
      continue;
    }
    // fallback split inside segment
    const [n = '', o = ''] = seg.split(':');
    const nn = n.trim();
    const oo = o.trim();
    if (nn && oo) out.push({ name: nn, value: oo });
  }
  return out;
};

const STANDALONE_SETTINGS_HINT = 'Choose a mode to update this preference. The active option stays highlighted.';

const primeSettingTriggerControl = primeButtonLikeControl;

const setSettingTriggerState = (node, isActive) => {
  if (!(node instanceof HTMLElement)) return;
  node.dataset.siteSettingActive = isActive ? 'true' : 'false';
  if (node instanceof HTMLAnchorElement) node.removeAttribute('aria-current');
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
  statusNode.dataset.updatedAt = String(Date.now());
  if (!statusNode.hasAttribute('role')) statusNode.setAttribute('role', 'status');
  if (!statusNode.hasAttribute('aria-live')) statusNode.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
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
  const {statusNode = null, onSaved = null} = options;

  // Support single trigger object, string (possibly compound), or array from parseSettingTriggers.
  let triggers = [];
  if (Array.isArray(trigger)) {
    triggers = trigger;
  } else if (trigger && typeof trigger === 'object' && trigger.name) {
    triggers = [trigger];
  } else if (typeof trigger === 'string' || trigger instanceof String) {
    triggers = parseSettingTriggers(trigger);
  }

  if (!triggers.length) {
    writeSettingsStatus(statusNode, 'Unknown setting control.', 'info');
    return null;
  }

  // Build sanitized partial from all (compound) triggers; validate each.
  const partial = {};
  for (const t of triggers) {
    if (!t || !isKnownSetting(t.name)) continue;
    const validation = validateSetting(t.name, t.value);
    if (validation.valid) partial[t.name] = t.value;
  }

  if (Object.keys(partial).length === 0) {
    writeSettingsStatus(statusNode, 'Invalid setting option(s).', 'info');
    return null;
  }

  const current = getSiteSettings();
  const allMatch = Object.entries(partial).every(([k, v]) => current[k] === v);
  if (allMatch) {
    const label = Object.keys(partial).map((k) => describeSettingValue(k, partial[k])).join(' + ');
    writeSettingsStatus(statusNode, `${label} already active.`, 'info');
    syncSettingsUx(document, current);
    return current;
  }

  const saved = saveSiteSettings(partial);
  syncSettingsUx(document, saved);
  const summary = describeSettingsPatch(partial) || Object.keys(partial).join(', ');
  writeSettingsStatus(statusNode, `${summary}.`, 'success');
  // For onSaved, pass the first trigger or the batch for legacy consumers.
  onSaved?.(saved, triggers[0] || triggers);
  return saved;
};

const applyUxRecipe = (recipeName, options = {}) => {
  const {statusNode = null, onSaved = null} = options;
  const recipe = getUxRecipe(recipeName);

  if (!recipe) {
    writeSettingsStatus(statusNode, 'Unknown settings recipe.', 'info');
    return null;
  }

  const saved = recipeName === 'default' ? resetSiteSettings() : saveSiteSettings(recipe.settings);
  syncSettingsUx(document, saved);
  writeSettingsStatus(statusNode, `${recipe.label}.`, 'success');
  onSaved?.(saved, recipeName);
  return saved;
};

const syncSettingTriggers = (root = document, settings = getSiteSettings()) => {
  const normalized = normalizeSiteSettings(settings);

  root.querySelectorAll?.('[data-site-setting-set]').forEach((node) => {
    const attr = node.getAttribute('data-site-setting-set') || '';
    const triggers = parseSettingTriggers(attr);
    if (!triggers.length) return;
    primeSettingTriggerControl(node);
    // For compound triggers (e.g. base+high), mark active only when every pair matches current.
    const isActive = triggers.every((t) => isKnownSetting(t.name) && normalized[t.name] === t.value);
    setSettingTriggerState(node, isActive);
  });
};

const syncPresetControls = (root = document, settings = getSiteSettings()) => {
  const activePreset = findActivePreset(settings);

  root.querySelectorAll?.('[data-preset]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const presetName = node.getAttribute('data-preset');
    const exact = presetName && presetMatchesSettings(presetName, settings);
    const subset = presetName && presetIsSubsetOfSettings(presetName, settings);
    primeButtonLikeControl(node);
    setPressedState(node, Boolean(exact || subset));
    node.dataset.presetActive = exact ? 'exact' : subset ? 'partial' : 'false';
    node.dataset.siteSettingActive = (exact || subset) ? 'true' : 'false';
    if (presetName) {
      node.setAttribute('aria-label', `${PRESET_LABELS[presetName] || presetName} preset. ${PRESET_DESCRIPTIONS[presetName] || ''}`.trim());
    }
  });

  root.querySelectorAll?.('[data-site-active-preset]').forEach((node) => {
    node.textContent = activePreset ? (PRESET_LABELS[activePreset] || activePreset) : 'Custom';
    node.dataset.presetState = activePreset || 'custom';
  });
};

const syncUxRecipeControls = (root = document) => {
  root.querySelectorAll?.('[data-site-settings-recipe]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const recipeName = node.getAttribute('data-site-settings-recipe');
    const recipe = getUxRecipe(recipeName);
    primeButtonLikeControl(node);
    if (recipe) node.setAttribute('aria-label', recipe.label);
  });
};

const syncSettingsFieldStates = (root = document, settings = getSiteSettings()) => {
  const normalized = normalizeSiteSettings(settings);

  root.querySelectorAll?.('[name]').forEach((field) => {
    if (!(field instanceof HTMLElement)) return;
    const name = field.getAttribute('name');
    if (!name || !isKnownSetting(name)) return;
    field.dataset.siteSettingDefault = normalized[name] === DEFAULT_SITE_SETTINGS[name] ? 'true' : 'false';
  });

  root.querySelectorAll?.('.settings-fieldset, fieldset, .settings-category').forEach((container) => {
    if (!(container instanceof HTMLElement)) return;
    const relevantNames = new Set(
      [...container.querySelectorAll('[name]')]
        .map((field) => field.getAttribute('name'))
        .filter((name) => name && isKnownSetting(name))
    );
    if (!relevantNames.size) return;
    const deviationCount = [...relevantNames].filter((name) => normalized[name] !== DEFAULT_SITE_SETTINGS[name]).length;
    container.dataset.siteSettingDeviationCount = String(deviationCount);
    container.dataset.siteSettingDeviationState = deviationCount > 0 ? 'deviated' : 'default';
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

const syncSettingsUx = (root = document, settings = getSiteSettings()) => {
  syncSettingsReadouts(root, settings);
  syncDeviationReadouts(root, settings);
  syncPresetControls(root, settings);
  syncUxRecipeControls(root);
  syncSettingsFieldStates(root, settings);
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

const bindSettingsField = (field, options = {}) => {
  if (!(field instanceof HTMLElement)) return {
    cleanup() {
    }, refresh() {
    }, save() {
      return null;
    }
  };

  const {autosave = true, root = field.closest('[data-site-settings-scope]') || document, onSaved = null} = options;
  const name = field.getAttribute('name');

  if (!name || !isKnownSetting(name)) return {
    cleanup() {
    }, refresh() {
    }, save() {
      return null;
    }
  };

  const syncFromStore = (settings = getSiteSettings()) => {
    writeSettingsToScope(root, settings);
    syncSettingsUx(root, settings);
  };

  const saveField = () => {
    let value;
    if (field.type === 'checkbox') value = field.checked ? 'on' : 'off';
    else if (field.type === 'radio') value = root.querySelector(`[name="${CSS.escape(name)}"]:checked`)?.value;
    else value = field.value;

    const validation = validateSetting(name, value);
    if (!validation.valid) {
      writeFieldError(root, name, `Invalid value for ${name}.`);
      return null;
    }

    writeFieldError(root, name, '');

    const current = getSiteSettings();
    if (current[name] === value) {
      syncFromStore(current);
      return current;
    }

    const saved = saveSiteSettings({[name]: value});
    syncFromStore(saved);
    onSaved?.(saved, {name, value});
    return saved;
  };

  const handleChange = () => {
    if (autosave) saveField();
  };

  syncFromStore();
  field.addEventListener('change', handleChange);
  const off = bus.on?.('settings:changed', (event) => syncFromStore(event.detail));

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

const bindSettingsScope = (root, options = {}) => {
  if (!(root instanceof HTMLElement)) return {
    cleanup() {
    }, refresh() {
    }, save() {
      return null;
    }
  };

  const {
    autosave = true,
    debounceMs = 80,
    includePresets = true,
    statusNode = root.querySelector?.('[data-site-settings-status]') || null,
    onSaved = null,
    onPresetApplied = null
  } = options;

  let debounceTimer = null;
  const setStatus = (message, type = 'info') => writeSettingsStatus(statusNode, message, type);
  const syncFromStore = (settings = getSiteSettings()) => {
    writeSettingsToScope(root, settings);
    syncSettingsUx(root, settings);
  };

  const saveScope = () => {
    clearFieldErrors(root);
    const partial = collectSettingsFromScope(root);
    const validation = validatePartialSettings(partial);

    if (!validation.valid) {
      validation.errors.forEach((error) => writeFieldError(root, error.name, `Allowed: ${error.allowedValues.join(', ')}`));
      setStatus('Some settings are invalid.', 'info');
      return null;
    }

    const saved = saveSiteSettings(partial);
    syncFromStore(saved);
    const summary = describeSettingsPatch(partial);
    setStatus(summary ? `Saved locally · ${summary}.` : 'Saved locally.', 'success');
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

  // Note: compound triggers (data-site-setting-set="a:1;b:2") are handled inside
  // applySettingTrigger via parseSettingTriggers; no change needed at bind site.

  const handleSubmit = (event) => {
    event.preventDefault();
    saveScope();
  };

  const controls = root.querySelectorAll('input[name], select[name], textarea[name]');
  controls.forEach((field) => field.addEventListener('change', handleChange));
  root.addEventListener('keydown', handleTriggerKeydown);
  if (root.matches('form')) root.addEventListener('submit', handleSubmit);

  const presetHandlers = [];
  if (includePresets) {
    root.querySelectorAll('[data-preset]').forEach((button) => {
      const handler = () => {
        const presetName = button.dataset.preset;
        if (!PRESETS[presetName]) return;
        const saved = saveSiteSettings(getPresetSettings(presetName));
        syncFromStore(saved);
        const description = manager.describePreset(presetName);
        const label = PRESET_LABELS[presetName] || presetName;
        setStatus(`Applied ${label} · ${description?.climate || 'climate'}.`, 'success');
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
      const triggers = parseSettingTriggers(control.getAttribute('data-site-setting-set') || '');
      if (!triggers.length) return;
      if (control instanceof HTMLAnchorElement) event.preventDefault();
      const saved = applySettingTrigger(triggers, {statusNode, onSaved});
      if (saved) syncFromStore(saved);
    };
    control.addEventListener('click', handler);
    triggerHandlers.push(() => control.removeEventListener('click', handler));
  });

  const recipeHandlers = [];
  root.querySelectorAll('[data-site-settings-recipe]').forEach((control) => {
    const handler = (event) => {
      if (control instanceof HTMLAnchorElement) event.preventDefault();
      const saved = applyUxRecipe(control.getAttribute('data-site-settings-recipe'), {statusNode, onSaved});
      if (saved) syncFromStore(saved);
    };
    control.addEventListener('click', handler);
    recipeHandlers.push(() => control.removeEventListener('click', handler));
  });

  const resetButtons = [...root.querySelectorAll('[data-site-settings-reset]')];
  const handleReset = () => {
    const settings = resetSiteSettings();
    syncFromStore(settings);
    setStatus('Reset to authored defaults.', 'success');
  };
  resetButtons.forEach((button) => button.addEventListener('click', handleReset));

  const off = bus.on?.('settings:changed', (event) => syncFromStore(event.detail));

  syncFromStore();

  if (statusNode && !statusNode.textContent) {
    const defaultMessage = root.querySelector('[data-site-setting-set], [data-site-settings-recipe]')
      ? STANDALONE_SETTINGS_HINT
      : 'Preferences are saved in this browser.';
    setStatus(defaultMessage, 'info');
  }

  return {
    cleanup() {
      clearTimeout(debounceTimer);
      controls.forEach((field) => field.removeEventListener('change', handleChange));
      root.removeEventListener('keydown', handleTriggerKeydown);
      if (root.matches('form')) root.removeEventListener('submit', handleSubmit);
      resetButtons.forEach((button) => button.removeEventListener('click', handleReset));
      presetHandlers.forEach((cleanup) => cleanup());
      triggerHandlers.forEach((cleanup) => cleanup());
      recipeHandlers.forEach((cleanup) => cleanup());
      off?.();
    },
    refresh() {
      syncFromStore();
    },
    save: saveScope
  };
};

const bindStandaloneSettingTriggers = (root = document, options = {}) => {
  const {onSaved = null} = options;

  const handleClick = (event) => {
    const control = event.target instanceof Element
      ? event.target.closest('[data-site-setting-set], [data-site-settings-recipe]')
      : null;

    if (!(control instanceof HTMLElement)) return;
    if (control.closest('[data-site-settings-form], [data-site-settings-scope]')) return;
    if (control instanceof HTMLAnchorElement) event.preventDefault();

    if (control.hasAttribute('data-site-settings-recipe')) {
      applyUxRecipe(control.getAttribute('data-site-settings-recipe'), {
        statusNode: resolveStandaloneStatusNode(control),
        onSaved
      });
      return;
    }

    const triggers = parseSettingTriggers(control.getAttribute('data-site-setting-set') || '');
    if (!triggers.length) return;

    applySettingTrigger(triggers, {
      statusNode: resolveStandaloneStatusNode(control),
      onSaved
    });
  };

  const handleKeydown = (event) => {
    const control = resolveSettingTriggerControl(event, root);
    activateSettingTriggerFromKeyboard(event, control);
  };

  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeydown);
  syncSettingsUx(root);

  const off = bus.on?.('settings:changed', (event) => syncSettingsUx(root, event.detail));

  return {
    cleanup() {
      root.removeEventListener('click', handleClick);
      root.removeEventListener('keydown', handleKeydown);
      off?.();
    },
    refresh() {
      syncSettingsUx(root);
    }
  };
};

const bindSettingsReadouts = (root = document) => {
  const sync = (settings = getSiteSettings()) => syncSettingsUx(root, settings);
  sync();
  const off = bus.on?.('settings:changed', (event) => sync(event.detail));
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

  root.querySelectorAll?.('[data-site-deviation-count]').forEach((node) => {
    node.textContent = String(deviations.length);
  });

  root.querySelectorAll?.('[data-site-deviation-list]').forEach((host) => {
    host.innerHTML = '';

    if (!deviations.length) {
      const empty = document.createElement('p');
      empty.className = 'site-deviation-empty';
      empty.textContent = 'No deviations. This browser is using the authored default.';
      host.appendChild(empty);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'site-deviation-list';

    deviations.forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'site-deviation-item';
      item.dataset.siteDeviation = entry.name;

      const label = document.createElement('span');
      label.className = 'site-deviation-label';
      label.textContent = humanizeSettingName(entry.name);

      const value = document.createElement('code');
      value.textContent = `${describeSettingValue(entry.name, entry.default)} → ${describeSettingValue(entry.name, entry.current)}`;

      item.append(label, value);

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

const syncPersistenceReadouts = (root = document) => {
  const registries = buildPersistenceRegistries().map((registry) => ({
    ...registry,
    snapshot: registry.read(),
  }));
  const active = registries.filter((registry) => registry.snapshot.count > 0);
  const totalItems = registries.reduce((sum, registry) => sum + registry.snapshot.count, 0);
  const latest = formatStorageTimestamp(getLatestTimestamp(registries, (registry) => registry.snapshot.latest));

  root.querySelectorAll?.('[data-site-persistence-active-count]').forEach((node) => {
    node.textContent = String(active.length);
  });
  root.querySelectorAll?.('[data-site-persistence-item-count]').forEach((node) => {
    node.textContent = String(totalItems);
  });
  root.querySelectorAll?.('[data-site-persistence-latest]').forEach((node) => {
    node.textContent = latest;
  });

  root.querySelectorAll?.('[data-site-persistence-list]').forEach((host) => {
    host.innerHTML = '';

    if (!registries.length) {
      const empty = document.createElement('p');
      empty.className = 'settings-persistence-empty';
      empty.textContent = 'No browser-local registries are available here.';
      host.appendChild(empty);
      return;
    }

    registries.forEach((registry) => {
      const item = document.createElement('article');
      item.className = 'settings-persistence-item';
      item.dataset.sitePersistence = registry.id;

      const head = document.createElement('div');
      head.className = 'settings-persistence-head';

      const title = document.createElement('strong');
      title.className = 'settings-persistence-title';
      title.textContent = registry.label;

      const badge = document.createElement('span');
      badge.className = 'settings-persistence-badge';
      badge.textContent = registry.snapshot.count > 0
        ? `${registry.snapshot.count} stored`
        : 'empty';

      head.append(title, badge);

      const copy = document.createElement('p');
      copy.className = 'settings-persistence-copy';
      copy.textContent = registry.description;

      const meta = document.createElement('div');
      meta.className = 'settings-persistence-meta';
      meta.innerHTML = [
        `<p><strong>Scope</strong><br>${registry.scope}</p>`,
        `<p><strong>Writer</strong><br>${registry.source}</p>`,
        `<p><strong>Storage key</strong><br><code>${registry.storageKey}</code></p>`,
        `<p><strong>Summary</strong><br>${registry.snapshot.summary}</p>`,
        `<p><strong>Latest change</strong><br>${formatStorageTimestamp(registry.snapshot.latest)}</p>`,
      ].join('');

      const actions = document.createElement('div');
      actions.className = 'settings-persistence-actions';

      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'operator-chip';
      reset.textContent = `! clear ${registry.id}`;
      reset.setAttribute('data-site-persistence-reset', registry.id);
      actions.appendChild(reset);

      item.append(head, copy, meta, actions);
      host.appendChild(item);
    });
  });
};

const bindDeviationControls = (root = document) => {
  if (!(root instanceof HTMLElement) && root !== document) return {
    cleanup() {
    }, refresh() {
    }
  };

  const handleClick = (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-site-deviation-reset]') : null;
    if (!(target instanceof HTMLElement)) return;
    const name = target.getAttribute('data-site-deviation-reset');
    if (name) resetSingleSetting(name);
  };

  root.addEventListener('click', handleClick);
  syncDeviationReadouts(root);
  const off = bus.on?.('settings:changed', (event) => syncDeviationReadouts(root, event.detail));

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

const bindPersistenceControls = (root = document) => {
  if (!(root instanceof HTMLElement) && root !== document) return {
    cleanup() {},
    refresh() {},
  };

  const registryMap = new Map(buildPersistenceRegistries().map((registry) => [registry.id, registry]));
  const sync = () => syncPersistenceReadouts(root);

  const handleClick = (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-site-persistence-reset]') : null;
    if (!(target instanceof HTMLElement)) return;
    const id = target.getAttribute('data-site-persistence-reset');
    const registry = id ? registryMap.get(id) : null;
    if (!registry) return;
    registry.clear();
    sync();
  };

  const handleStorage = (event) => {
    if (!event.key) return;
    if ([SITE_SETTINGS_KEY, getPinStorageKey(), CAULDRON_STORAGE_KEY, DISCOVERY_DISMISSALS_STORAGE_KEY, VISITED_IMAGE_STORAGE_KEY].includes(event.key)) {
      sync();
    }
  };

  root.addEventListener('click', handleClick);
  window.addEventListener('storage', handleStorage);
  sync();

  const offSettings = bus.on?.('settings:changed', sync);
  const offCauldronUpdated = bus.on?.('cauldron:updated', sync);
  const offCauldronCleared = bus.on?.('cauldron:cleared', sync);
  const offImageVisited = bus.on?.('image:visited', sync);
  const handlePin = () => sync();
  const handleDiscoveryDismissals = () => sync();
  document.addEventListener('brace:pinned', handlePin);
  document.addEventListener('spw:discovery-dismissals-changed', handleDiscoveryDismissals);

  return {
    cleanup() {
      root.removeEventListener('click', handleClick);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('brace:pinned', handlePin);
      document.removeEventListener('spw:discovery-dismissals-changed', handleDiscoveryDismissals);
      offSettings?.();
      offCauldronUpdated?.();
      offCauldronCleared?.();
      offImageVisited?.();
    },
    refresh() {
      sync();
    },
  };
};

const initPwaStatusDisplay = () => {
  if (manager._pwaInitialized) return;
  manager._pwaInitialized = true;

  const installEl = document.querySelector('[data-pwa-install-status]');
  const swEl = document.querySelector('[data-pwa-sw-status]');
  const cacheEl = document.querySelector('[data-pwa-cache-status]');
  const connectionEl = document.querySelector('[data-pwa-connection-status]');

  if (!installEl) return;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
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
    if (swEl) {
      swEl.textContent = 'Active';
      swEl.dataset.status = 'active';
    }
  } else if (navigator.serviceWorker) {
    if (swEl) {
      swEl.textContent = 'Registering…';
      swEl.dataset.status = 'inactive';
      navigator.serviceWorker.ready.then(() => {
        swEl.textContent = 'Active';
        swEl.dataset.status = 'active';
      }).catch(() => {
        swEl.textContent = 'Error';
        swEl.dataset.status = 'error';
      });
    }
  } else if (swEl) {
    swEl.textContent = 'Unsupported';
    swEl.dataset.status = 'error';
  }

  if (cacheEl && !shouldDisableServiceWorkerInDevelopment()) {
    if ('caches' in window) {
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
  }

  if (connectionEl) {
    const updateConnection = () => {
      const online = navigator.onLine;
      connectionEl.textContent = online ? 'Online' : 'Offline';
      connectionEl.dataset.status = online ? 'active' : 'inactive';
    };
    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
  }
};

const initSiteSettingsBindings = () => {
  const forms = [...document.querySelectorAll('[data-site-settings-form]')];
  const scopes = [...document.querySelectorAll('[data-site-settings-scope]')]
    .filter((scope) => !forms.some((form) => form === scope || form.contains(scope)));
  const hasStandaloneTriggers = [...document.querySelectorAll('[data-site-setting-set], [data-site-settings-recipe]')]
    .some((control) => !control.closest('[data-site-settings-form], [data-site-settings-scope]'));
  const hasReadouts = Boolean(document.querySelector('[data-settings-state], [data-site-setting-value], [data-site-deviation-count], [data-site-deviation-list], [data-site-persistence-list]'));

  if ((!forms.length && !scopes.length && !hasStandaloneTriggers && !hasReadouts) || manager._initialized) return null;

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
  const persistenceControls = bindPersistenceControls(document);

  initPwaStatusDisplay();

  return {
    cleanup() {
      bindings.forEach((binding) => binding.cleanup());
      triggers.cleanup();
      readouts.cleanup();
      deviationControls.cleanup();
      persistenceControls.cleanup();
      manager._initialized = false;
    },
    refresh() {
      bindings.forEach((binding) => binding.refresh());
      triggers.refresh();
      readouts.refresh();
      deviationControls.refresh();
      persistenceControls.refresh();
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

  const category = target.matches('.settings-category') ? target : target.closest('.settings-category');
  if (!(category instanceof HTMLDetailsElement)) return;

  category.open = true;
  category.dataset.settingsTargeted = 'true';
};

const initSettingsCategoryRouting = () => {
  if (manager._settingsCategoryRouting) return manager._settingsCategoryRouting;

  const handleHashChange = () => window.requestAnimationFrame(() => syncSettingsCategoryTarget());

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

const bindSettingsQueryLab = (root = document) => {
  const panel = root.querySelector?.('[data-site-settings-query-lab]');
  if (!(panel instanceof HTMLElement)) return {
    cleanup() {},
    refresh() {}
  };

  const previewNode = panel.querySelector?.('[data-site-settings-query-preview]');
  const copyButton = panel.querySelector?.('[data-site-settings-query-copy]');
  const links = [...panel.querySelectorAll?.('[data-site-settings-query-mode]') || []];

  const syncPreview = (mode = panel.dataset.siteSettingsQueryMode || 'inspect') => {
    const recipe = getSettingsQueryRecipe(mode);
    const search = buildSettingsQuerySearch(mode);
    panel.dataset.siteSettingsQueryMode = mode;
    if (previewNode) {
      previewNode.textContent = search || ' ';
      previewNode.title = recipe.description;
    }
    links.forEach((link) => {
      const linkMode = link.getAttribute('data-site-settings-query-mode');
      link.dataset.settingsQueryActive = linkMode === mode ? 'true' : 'false';
    });
  };

  const handleClick = (event) => {
    const link = event.target instanceof Element
      ? event.target.closest('[data-site-settings-query-mode]')
      : null;

    if (link instanceof HTMLAnchorElement) {
      const mode = link.getAttribute('data-site-settings-query-mode');
      if (!mode) return;
      link.href = buildSettingsQueryHref(mode, window.location);
      link.setAttribute('aria-label', `${getSettingsQueryRecipe(mode).label} query`);
    }
  };

  const handleCopy = async () => {
    const activeMode = panel.dataset.siteSettingsQueryMode || copyButton?.getAttribute('data-site-settings-query-copy') || 'inspect';
    const text = buildSettingsQueryHref(activeMode, window.location);
    const {handleCopyButton} = await import('/public/js/kernel/copy.js');
    await handleCopyButton({
      text,
      button: copyButton || undefined,
      labelCopied: '✓ copied query',
      labelFailed: '! copy query',
      labelDefault: copyButton?.textContent || 'Copy query',
    });
  };

  links.forEach((link) => {
    const mode = link.getAttribute('data-site-settings-query-mode');
    if (!mode) return;
    link.href = buildSettingsQueryHref(mode, window.location);
    link.setAttribute('aria-label', `${getSettingsQueryRecipe(mode).label} query`);
    link.addEventListener('mouseenter', () => syncPreview(mode));
    link.addEventListener('focus', () => syncPreview(mode));
  });

  copyButton?.addEventListener('click', handleCopy);
  panel.addEventListener('click', handleClick);
  syncPreview(panel.dataset.siteSettingsQueryMode || 'inspect');

  return {
    cleanup() {
      copyButton?.removeEventListener('click', handleCopy);
      panel.removeEventListener('click', handleClick);
    },
    refresh() {
      links.forEach((link) => {
        const mode = link.getAttribute('data-site-settings-query-mode');
        if (!mode) return;
        link.href = buildSettingsQueryHref(mode, window.location);
      });
      syncPreview(panel.dataset.siteSettingsQueryMode || 'inspect');
    }
  };
};

const initSiteSettingsPage = () => {
  const bindings = initSiteSettingsBindings();
  const routing = initSettingsCategoryRouting();
  const queryLab = bindSettingsQueryLab();

  return {
    cleanup() {
      bindings?.cleanup?.();
      routing?.cleanup?.();
      queryLab?.cleanup?.();
    },
    refresh() {
      bindings?.refresh?.();
      syncSettingsCategoryTarget();
      queryLab?.refresh?.();
    }
  };
};

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
    // Explicit setters for shell utilities, design bench, and consumers (delegate to save).
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
  recipes: UX_RECIPES,
  applyRecipe: applyUxRecipe,
  findActivePreset,
    authorWorkflows: AUTHOR_WORKFLOW_DEFINITIONS,
    developmentalClimates: DEVELOPMENTAL_CLIMATES,
    syncUx: syncSettingsUx,
    describePreset: (name) => manager.describePreset(name),
    initBindings: initSiteSettingsBindings,
    manager
  };
}

export {
  AUTHOR_WORKFLOW_TOKEN_VALUE,
  DEFAULT_SITE_SETTINGS,
  DEVELOPMENTAL_CLIMATES,
  PRESETS,
  PRESET_DESCRIPTIONS,
  PRESET_LABELS,
  SETTINGS_QUERY_RECIPES,
  SETTING_OPTIONS,
  SITE_SETTINGS_KEY,
  UX_RECIPES,
  buildSettingsQueryHref,
  buildSettingsQuerySearch,
  applySiteSettings,
  applyUxRecipe,
  bindDeviationControls,
  bindSettingsField,
  bindSettingsReadouts,
  bindSettingsScope,
  bindStandaloneSettingTriggers,
  collectSettingsFromScope,
  describeDeviation,
  emitSettingsChange,
  findActivePreset,
  getAuthorWorkflowDefinition,
  getAuthorWorkflowTokens,
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
  setBaseMetamaterial,
  setClearContrastMatte,
  setFontSizeScale,
  setHighContrast,
  shouldUseViewportActivation,
  syncDeviationReadouts,
  syncPresetControls,
  syncSettingsReadouts,
  syncSettingsUx,
  syncUxRecipeControls,
  validatePartialSettings,
  validateSetting,
  writeSettingsToScope,
  // Exposed for discoverability surfaces (palettes "copy this look", design labs, shareable states):
  // lets pages build a minimal communicable query from current visual tuners without duplicating logic.
  buildQueryString,
  parseSettingsFromSearch
};
