/**
 * Frozen settings profiles, presets, and query recipes.
 */

import {
  DEFAULT_PALETTE_RESONANCE,
  PALETTE_RESONANCE_OPTIONS,
} from '/public/js/interface/palette-resonance.js';
import { AUTHOR_WORKFLOW_MODES } from '/public/js/kernel/shared.js';

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
  newspaper: Object.freeze({measure: '54ch', frameMax: 'var(--page-width-wide, 84rem)', columnMin: '11.25rem'}),
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
  spellPathDisplay: 'auto',
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
  explorePosture: 'reading',
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
  attentionSelfRelation: 'breath',
  attentionLocalRelation: 'immediate-field',
  attentionGlobalRelation: 'horizon-systems',
  overflowMode: 'contained',
  operationalVisibility: 'off',

  authorMode: 'draft',
  currentDevelopmentalClimate: 'orient',
  developmentalClimateAutoCycle: 'off',
  narrativeMode: 'off', // Inline prose token lens for narrative surfaces.

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
  spellPathDisplay: new Set(['collapsed', 'auto', 'expanded']),
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
  layoutTuner: new Set(['reading', 'newspaper', 'wide', 'atlas']),
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
  explorePosture: new Set(['reading', 'field', 'workshop']),
  dimensionalBreadcrumbs: new Set(['off', 'on']),
  fractalNesting: new Set(['off', 'on']),
  implementationMutations: new Set(['off', 'on']),

  showSemanticMetadata: new Set(['off', 'on']),
  operatorHighlighting: new Set(['off', 'on']),
  relationalVisualization: new Set(['off', 'on']),
  wonderMemory: new Set(['off', 'nearby', 'sitewide']),
  developmentalIndicators: new Set(['off', 'on']),
  depthIndicators: new Set(['off', 'on']),
  metacognitiveStance: new Set(['witness', 'composer', 'explorer', 'integrator', 'overflow']),
  processAttention: new Set(['breath', 'scan', 'trace', 'compose']),
  attentionSelfRelation: new Set(['breath', 'inner-weather', 'dimensional-scan']),
  attentionLocalRelation: new Set(['immediate-field', 'witness', 'reciprocity-proof']),
  attentionGlobalRelation: new Set(['horizon-systems', 'cultural-fermentation', 'stewardship']),
  overflowMode: new Set(['contained', 'expanded', 'generous']),
  operationalVisibility: new Set(['off', 'on']),

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
    spellPathDisplay: 'expanded',
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
    spellPathDisplay: 'expanded',
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
  }),
  'contemplative-hearth': Object.freeze({
    authorMode: 'draft',
    currentDevelopmentalClimate: 'anchor',
    metacognitiveStance: 'witness',
    processAttention: 'breath',
    attentionSelfRelation: 'breath',
    attentionLocalRelation: 'witness',
    attentionGlobalRelation: 'stewardship',
    themePack: 'neutral-paper',
    colorTuner: 'balanced',
    pedagogicalFlavor: 'culinary',
    baseMetamaterial: 'paper',
    componentDensity: 'soft',
    operatorSaturation: 'muted',
    animationIntensity: 'reduced',
    fieldResonance: 'local',
    spacingTuner: 'roomy',
    interactionTuner: 'calm',
    grainIntensity: 'none',
    semanticDensity: 'minimal',
    enhancementLevel: 'minimal',
    infospaceComplexity: 'simple',
    relationalVisualization: 'on',
    wonderMemory: 'nearby',
    showSemanticMetadata: 'off',
    showSpecPills: 'off',
    developmentalIndicators: 'on',
    depthIndicators: 'off',
    developmentalClimateAutoCycle: 'off',
    reduceMotion: 'off',
    highContrast: 'off',
    busDiagnostics: 'off',
    busMirrorToConsole: 'off',
    busHistorySize: '100',
    typesettingMode: 'editorial'
  })
});

const SETTING_VALUE_LABELS = Object.freeze({
  navigatorDisplay: Object.freeze({quiet: 'Quiet', full: 'Full', hidden: 'Hidden'}),
  spellPathDisplay: Object.freeze({collapsed: 'Collapsed', auto: 'Auto', expanded: 'Expanded'}),
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
  layoutTuner: Object.freeze({reading: 'Reading', newspaper: 'Newspaper', wide: 'Wide', atlas: 'Atlas'}),
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
  explorePosture: Object.freeze({reading: 'Reading', field: 'Field', workshop: 'Workshop'}),
  dimensionalBreadcrumbs: Object.freeze({off: 'Off', on: 'On'}),
  fractalNesting: Object.freeze({off: 'Off', on: 'On'}),
  implementationMutations: Object.freeze({off: 'Off', on: 'On'}),
  showSemanticMetadata: Object.freeze({off: 'Hidden', on: 'Shown'}),
  operatorHighlighting: Object.freeze({off: 'Off', on: 'On'}),
  relationalVisualization: Object.freeze({off: 'Off', on: 'On'}),
  wonderMemory: Object.freeze({off: 'Focused', nearby: 'Connected', sitewide: 'Immersive'}),
  developmentalIndicators: Object.freeze({off: 'Off', on: 'On'}),
  depthIndicators: Object.freeze({off: 'Off', on: 'On'}),
  metacognitiveStance: Object.freeze({
    witness: 'Witness',
    composer: 'Composer',
    explorer: 'Explorer',
    integrator: 'Integrator',
    overflow: 'Overflow'
  }),
  processAttention: Object.freeze({
    breath: 'Breath',
    scan: 'Scan',
    trace: 'Trace',
    compose: 'Compose'
  }),
  attentionSelfRelation: Object.freeze({
    breath: 'Breath',
    'inner-weather': 'Inner weather',
    'dimensional-scan': 'Dimensional scan'
  }),
  attentionLocalRelation: Object.freeze({
    'immediate-field': 'Immediate field',
    witness: 'Witness',
    'reciprocity-proof': 'Reciprocity / proof'
  }),
  attentionGlobalRelation: Object.freeze({
    'horizon-systems': 'Horizon systems',
    'cultural-fermentation': 'Cultural inheritance / fermentation',
    stewardship: 'Stewardship'
  }),
  overflowMode: Object.freeze({contained: 'Contained', expanded: 'Expanded', generous: 'Generous'}),
  operationalVisibility: Object.freeze({off: 'Implicit', on: 'Explicit'}),
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

/** Poetic tuning dimensions: what can be tuned and how presentation relates to content. */
const TUNING_LEXICON = Object.freeze({
  atmosphere: Object.freeze({
    key: 'themePack',
    label: 'Atmosphere',
    sigil: '☼',
    metaphor: 'Vellum weather and material family',
    relation: 'presentation',
    contentLink: 'Copy stays; atmosphere changes how the page feels to read.',
    settingsAnchor: '#appearance-settings',
  }),
  lighting: Object.freeze({
    key: 'colorMode',
    label: 'Lighting',
    sigil: '◐',
    metaphor: 'Daylight, lamplight, adaptive sky',
    relation: 'presentation',
    contentLink: 'Meaning holds; light shifts legibility and mood.',
    settingsAnchor: '#appearance-settings',
  }),
  resonance: Object.freeze({
    key: 'paletteResonance',
    label: 'Resonance',
    sigil: '◎',
    metaphor: 'Which discipline colors the field',
    relation: 'bridge',
    contentLink: 'Topic copy remains; accent bias follows craft, software, math, or route context.',
    settingsAnchor: '#appearance-settings',
  }),
  memory: Object.freeze({
    key: 'wonderMemory',
    label: 'Memory',
    sigil: '∿',
    metaphor: 'How wonder carries between pages',
    relation: 'continuity',
    contentLink: 'Local story stays; ornament echo can stay nearby or spread sitewide.',
    settingsAnchor: '#semantic-settings',
  }),
  vocabulary: Object.freeze({
    key: 'semanticDensity',
    label: 'Vocabulary',
    sigil: '◇',
    metaphor: 'How loudly concepts answer back',
    relation: 'content',
    contentLink: 'Same routes; richer density reveals handles, prompts, and relation cues.',
    settingsAnchor: '#semantic-settings',
  }),
  explore: Object.freeze({
    key: 'explorePosture',
    label: 'Explore',
    sigil: '⌁',
    metaphor: 'Reading quiet, field ambient, workshop revealed',
    relation: 'anatomy',
    contentLink: 'Copy stays; posture controls tuning discoverability, region rails, and control labels.',
    settingsAnchor: '#runtime-preferences',
  }),
  material: Object.freeze({
    key: 'baseMetamaterial',
    label: 'Material',
    sigil: '▣',
    metaphor: 'Paper, glass, matte, or field surface',
    relation: 'presentation',
    contentLink: 'Structure unchanged; surface physics changes depth and contrast.',
    settingsAnchor: '#appearance-settings',
  }),
  posture: Object.freeze({
    key: 'currentDevelopmentalClimate',
    label: 'Climate',
    sigil: '☁',
    metaphor: 'Attention posture for the session',
    relation: 'attention',
    contentLink: 'Content stable; climate shifts how firmly the site invites, holds, or offers.',
    settingsAnchor: '#climate-settings',
  }),
  task: Object.freeze({
    key: 'authorMode',
    label: 'Workflow',
    sigil: '✎',
    metaphor: 'What the writer is doing now',
    relation: 'authoring',
    contentLink: 'Public shape unchanged; workflow tunes annotation and revision affordances.',
    settingsAnchor: '#author-workflow-settings',
  }),
  grain: Object.freeze({
    key: 'grainIntensity',
    label: 'Grain',
    sigil: '⁘',
    metaphor: 'Texture on the metaphysical page',
    relation: 'presentation',
    contentLink: 'Words stay; grain adds or removes tactile weather on the surface.',
    settingsAnchor: '#appearance-settings',
  }),
  interaction: Object.freeze({
    key: 'interactionTuner',
    label: 'Touch',
    sigil: '↯',
    metaphor: 'How responsive the material feels',
    relation: 'interaction',
    contentLink: 'Routes unchanged; touch physics changes echo, lift, and spell readiness.',
    settingsAnchor: '#runtime-preferences',
  }),
});

const TUNING_LEXICON_BY_SETTING = Object.freeze(
  Object.fromEntries(Object.entries(TUNING_LEXICON).map(([id, entry]) => [entry.key, { id, ...entry }]))
);

const PRESET_LABELS = Object.freeze({
  hearth: 'Hearth',
  loom: 'Loom',
  workshop: 'Workshop',
  access: 'Access',
  'contemplative-hearth': 'Contemplative Hearth'
});

const PRESET_DESCRIPTIONS = Object.freeze({
  hearth: 'Calm baseline for ordinary reading.',
  loom: 'Expressive semantic surface with richer visual feedback.',
  workshop: 'Inspection-forward setup for implementation and debugging.',
  access: 'Larger, calmer, higher-guidance setup for reduced friction.',
  'contemplative-hearth': 'Quiet relational baseline for attention-led media work.'
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
      spellPathDisplay: 'collapsed',
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

export {
  SITE_SETTINGS_KEY,
  CAULDRON_STORAGE_KEY,
  DISCOVERY_DISMISSALS_STORAGE_KEY,
  VISITED_IMAGE_STORAGE_KEY,
  THEME_PACK_OPTIONS,
  ICON_PACK_OPTIONS,
  FONT_SIZE_PRESET_MULTIPLIER,
  LINE_SPACING_VALUE,
  MONOSPACE_FONT_VALUE,
  GRAIN_INTENSITY_VALUE,
  SEMANTIC_GRAIN_OFFSET,
  MOTION_INTENSITY_MULTIPLIER,
  ANIMATION_THROTTLE_MULTIPLIER,
  OPERATOR_SATURATION_FACTOR,
  SEMANTIC_DENSITY_FACTOR,
  ENHANCEMENT_FACTOR,
  INFOSPACE_FACTOR,
  OPERATOR_PRESENTATION_FACTOR,
  COLOR_TUNER_PROFILE,
  SPACING_TUNER_PROFILE,
  LAYOUT_TUNER_PROFILE,
  INTERACTION_TUNER_PROFILE,
  HEADER_OPACITY_VALUE,
  WONDER_MEMORY_PROFILE,
  CONTOUR_PROFILE,
  FIELD_RESONANCE_PROFILE,
  STROKE_PROFILE,
  SVG_SCALE_PROFILE,
  SVG_STORY_PROFILE,
  AUTHOR_WORKFLOW_TOKEN_VALUE,
  DEVELOPMENTAL_CLIMATES,
  DEFAULT_SITE_SETTINGS,
  SETTING_OPTIONS,
  PRESETS,
  SETTING_VALUE_LABELS,
  TUNING_LEXICON,
  TUNING_LEXICON_BY_SETTING,
  PRESET_LABELS,
  PRESET_DESCRIPTIONS,
  UX_RECIPES,
  SETTINGS_QUERY_RECIPES,
  buildQueryString,
  getSettingsQueryRecipe,
  buildSettingsQuerySearch,
  buildSettingsQueryHref,
};
