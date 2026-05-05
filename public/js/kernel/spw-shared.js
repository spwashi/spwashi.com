/* ==========================================================================
   spw-shared.js
   --------------------------------------------------------------------------
   Purpose
   - Shared semantic/runtime utilities used across the Spw front-end.
   - Central source of truth for operator metadata, event aliasing, page-level
     context, hormonal regulation, layered instantiation, CSS-token bridging,
     developmental climate, author workflow, and lightweight feature loading.

   Design goals
   - HTML-first: prefer explicit data attributes when present.
   - Layered instantiation: resolve substrate/form/role/context/field/recipe
     consistently across modules.
   - Author-app ready: separate author workflow from developmental climate.
   - Climate-aware: expose both legacy --developmental-* and newer --climate-*
     token interfaces.
   - CSS token bridge: read/write semantic state without duplicating token logic.
   - Bus-first eventing: route canonical events through SpwBus while preserving
     backward-compatible DOM pathways where needed.
   ========================================================================== */

import { bus } from '/public/js/kernel/spw-bus.js';

/* ==========================================================================
   1. Safe environment helpers
   ========================================================================== */

const hasDocument = () => typeof document !== 'undefined';
const hasWindow = () => typeof window !== 'undefined';
const hasPerformance = () => typeof performance !== 'undefined';

const isElement = (value) => (
  typeof Element !== 'undefined'
  && value instanceof Element
);

const isHTMLElement = (value) => (
  typeof HTMLElement !== 'undefined'
  && value instanceof HTMLElement
);

const getHtmlRoot = () => (
  hasDocument()
    ? document.documentElement
    : null
);

const getBody = () => (
  hasDocument()
    ? document.body
    : null
);

const getDefaultEventTarget = () => (
  hasDocument()
    ? document
    : null
);

/* ==========================================================================
   2. Operator registry
   ========================================================================== */

const OPERATOR_DEFINITIONS = Object.freeze([
  {
    pattern: /^#>/,
    type: 'frame',
    label: 'frame declaration',
    prefix: '#>',
    intent: 'orient',
    interaction: 'activate or inspect a named frame',
    family: 'structural',
    speech: 'anchor',
    reversibility: 'returnable'
  },
  {
    pattern: /^#:/,
    type: 'layer',
    label: 'layer marker',
    prefix: '#:',
    intent: 'qualify',
    interaction: 'inspect the interpretive layer or runtime constraint',
    family: 'structural',
    speech: 'qualifier',
    reversibility: 'inspectable'
  },
  {
    pattern: /^\./,
    type: 'baseline',
    label: 'baseline member',
    prefix: '.',
    intent: 'settle',
    interaction: 'return to the local baseline, member, or default lens',
    family: 'grounding',
    speech: 'ground',
    reversibility: 'recoverable'
  },
  {
    pattern: /^\^/,
    type: 'object',
    label: 'object',
    prefix: '^',
    intent: 'elevate',
    interaction: 'open or inspect structured content',
    family: 'structural',
    speech: 'noun',
    reversibility: 'inspectable'
  },
  {
    pattern: /^~/,
    type: 'ref',
    label: 'reference',
    prefix: '~',
    intent: 'refer',
    interaction: 'resolve a reference without forcing commitment',
    family: 'relational',
    speech: 'pointer',
    reversibility: 'deferrable'
  },
  {
    pattern: /^\?/,
    type: 'probe',
    label: 'probe',
    prefix: '?',
    intent: 'inquire',
    interaction: 'ask, filter, or reveal an exploratory lens',
    family: 'inquiry',
    speech: 'question',
    reversibility: 'reversible'
  },
  {
    pattern: /^@/,
    type: 'action',
    label: 'action',
    prefix: '@',
    intent: 'act',
    interaction: 'commit a local action or projection',
    family: 'operative',
    speech: 'verb',
    reversibility: 'committing'
  },
  {
    pattern: /^\*/,
    type: 'stream',
    label: 'stream',
    prefix: '*',
    intent: 'flow',
    interaction: 'connect to dynamic or event-like content',
    family: 'relational',
    speech: 'flow',
    reversibility: 'replayable'
  },
  {
    pattern: /^&/,
    type: 'merge',
    label: 'merge',
    prefix: '&',
    intent: 'integrate',
    interaction: 'overlay, compare, or combine fields',
    family: 'relational',
    speech: 'junction',
    reversibility: 'revisable'
  },
  {
    pattern: /^=/,
    type: 'binding',
    label: 'binding',
    prefix: '=',
    intent: 'bind',
    interaction: 'name, pin, or categorize a local value',
    family: 'grounding',
    speech: 'assignment',
    reversibility: 'sticky'
  },
  {
    pattern: /^\$/,
    type: 'meta',
    label: 'metacognitive reflection',
    prefix: '$',
    intent: 'reflect',
    interaction: 'inspect the medium, trace, or register itself',
    family: 'reflective',
    speech: 'aside',
    reversibility: 'reversible'
  },
  {
    pattern: /^%/,
    type: 'normalize',
    label: 'normalization',
    prefix: '%',
    intent: 'scale',
    interaction: 'compare, normalize, or adjust salience',
    family: 'reflective',
    speech: 'adverb',
    reversibility: 'revisable'
  },
  {
    pattern: /^!/,
    type: 'pragma',
    label: 'pragma',
    prefix: '!',
    intent: 'constrain',
    interaction: 'apply or inspect a runtime force or constraint',
    family: 'operative',
    speech: 'constraint',
    reversibility: 'constraining'
  },
  {
    pattern: /^>/,
    type: 'surface',
    label: 'surface',
    prefix: '>',
    intent: 'project',
    interaction: 'move into or inspect a rendered projection',
    family: 'projective',
    speech: 'projection',
    reversibility: 'projected'
  },
  {
    pattern: /^</,
    type: 'topic',
    label: 'topic lens',
    prefix: '<',
    intent: 'scope',
    interaction: 'enter or define a topical boundary — <topic> or (scene) <> (scene)',
    family: 'scoping',
    speech: 'subject',
    reversibility: 'scoping'
  }
]);

const OPERATOR_BY_TYPE = Object.freeze(
  Object.fromEntries(OPERATOR_DEFINITIONS.map((definition) => [definition.type, definition]))
);

const OPERATOR_BY_PREFIX = Object.freeze(
  Object.fromEntries(OPERATOR_DEFINITIONS.map((definition) => [definition.prefix, definition]))
);

const OPERATOR_PREFIXES = Object.freeze(
  Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, prefix }) => [type, prefix]))
);

const OPERATOR_INTENTS = Object.freeze(
  Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, intent }) => [type, intent]))
);

const OPERATOR_FAMILIES = Object.freeze(
  Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, family }) => [type, family]))
);

const OPERATOR_PREFIX_RE = /^(#>|#:|\.|\^|~|\?|@|\*|&|=|\$|%|!|>|<)/;

/* ==========================================================================
   3. Shared taxonomies
   ========================================================================== */

const SPW_WONDER_CATEGORIES = Object.freeze([
  'orientation',
  'inquiry',
  'comparison',
  'memory',
  'projection',
  'constraint',
  'resonance'
]);

const SPW_RECIPE_CHANNELS = Object.freeze([
  'syntax',
  'surface',
  'gesture',
  'memory',
  'ritual',
  'publication'
]);

const SPW_INSTANTIATION_LAYERS = Object.freeze([
  { name: 'substrate', description: 'operator/material basis for a local encounter' },
  { name: 'form', description: 'brace/block/inline mode of local address' },
  { name: 'role', description: 'local task or rhetorical function' },
  { name: 'context', description: 'reading/analysis/routing/ritual/play/settings climate' },
  { name: 'field', description: 'wonder, permeability, room, succession, and local charge' },
  { name: 'recipe', description: 'culturally tested or emerging genre pattern' }
]);

const AUTHOR_WORKFLOW_MODES = Object.freeze([
  'draft',
  'revise',
  'polish',
  'publish',
  'archive'
]);

const AUTHOR_WORKFLOW_DEFINITIONS = Object.freeze({
  draft: Object.freeze({
    id: 'draft',
    label: 'draft',
    description: 'Generate and protect unfinished material.',
    intent: 'compose',
    emphasis: ['privacy', 'flow', 'permission']
  }),
  revise: Object.freeze({
    id: 'revise',
    label: 'revise',
    description: 'Reshape structure, clarify argument, and compare alternatives.',
    intent: 'transform',
    emphasis: ['annotation', 'comparison', 'structure']
  }),
  polish: Object.freeze({
    id: 'polish',
    label: 'polish',
    description: 'Tune style, rhythm, precision, and reader experience.',
    intent: 'refine',
    emphasis: ['voice', 'line-editing', 'readability']
  }),
  publish: Object.freeze({
    id: 'publish',
    label: 'publish',
    description: 'Prepare the work for readers, export, teaching, or release.',
    intent: 'offer',
    emphasis: ['readiness', 'metadata', 'distribution']
  }),
  archive: Object.freeze({
    id: 'archive',
    label: 'archive',
    description: 'Store, recover, cite, and connect completed or paused work.',
    intent: 'preserve',
    emphasis: ['memory', 'retrieval', 'context']
  })
});

const DEVELOPMENTAL_CLIMATE_DEFINITIONS = Object.freeze({
  orient: Object.freeze({
    id: 'orient',
    label: 'kindle',
    authorLabel: 'find the page',
    learningMode: 'entry',
    description: 'Open the frame, notice cues, and sense the terrain before forcing conclusions.'
  }),
  anchor: Object.freeze({
    id: 'anchor',
    label: 'anchor',
    authorLabel: 'hold the structure',
    learningMode: 'stabilize',
    description: 'Name distinctions, stabilize references, and give the surface something firm to stand on.'
  }),
  weave: Object.freeze({
    id: 'weave',
    label: 'weave',
    authorLabel: 'connect the material',
    learningMode: 'connect',
    description: 'Relate examples, build parallels, and connect local structure to neighboring concepts.'
  }),
  rehearse: Object.freeze({
    id: 'rehearse',
    label: 'rehearse',
    authorLabel: 'test the voice',
    learningMode: 'practice',
    description: 'Retrieve, vary, test, and practice until the pattern can be used rather than merely recognized.'
  }),
  offer: Object.freeze({
    id: 'offer',
    label: 'offer',
    authorLabel: 'prepare the gift',
    learningMode: 'publish',
    description: 'Externalize the work through explanation, publication, teaching, or a usable contribution.'
  })
});

const DEVELOPMENTAL_CLIMATE_IDS = Object.freeze(Object.keys(DEVELOPMENTAL_CLIMATE_DEFINITIONS));

/* ==========================================================================
   4. Hormonal + semantic token bridge
   ========================================================================== */

const SPW_HORMONE_CHANNELS = Object.freeze([
  'charge',
  'valence',
  'resonance',
  'bias',
  'attention',
  'depth',
  'utility',
  'tasteProximity',
  'allocation',
  'drift'
]);

const SPW_CSS_STATE_TOKENS = Object.freeze({
  charge: '--charge',
  valence: '--spw-valence',
  resonance: '--spw-resonance',
  bias: '--spw-bias',
  attention: '--spw-attention',
  depth: '--spw-depth',
  utility: '--spw-utility',
  tasteProximity: '--spw-taste-proximity',
  allocation: '--spw-allocation',
  drift: '--spw-drift',

  motionScale: '--spw-motion-scale',
  semanticDensityFactor: '--spw-semantic-density-factor',
  enhancementFactor: '--spw-enhancement-factor',
  infospaceFactor: '--spw-infospace-factor',
  operatorPresentationFactor: '--spw-operator-presentation-factor',
  operatorSaturationFactor: '--spw-operator-saturation-factor',
  cognitiveHandleFactor: '--spw-cognitive-handle-factor',
  relationalFactor: '--spw-relational-factor',
  semanticMetadataFactor: '--spw-semantic-metadata-factor',

  /* Modern climate interface */
  climateAccent: '--climate-accent',
  climateAccentInk: '--climate-accent-ink',
  climateAccentLine: '--climate-accent-line',
  climateAccentWash: '--climate-accent-wash',
  climateClarityBias: '--climate-clarity-bias',
  climatePressureBias: '--climate-pressure-bias',
  climateAtmosphereBias: '--climate-atmosphere-bias',
  climateMemoryBias: '--climate-memory-bias',
  climateResonanceBias: '--climate-resonance-bias',
  climateChargeBias: '--climate-charge-bias',
  climateSelectionBias: '--climate-selection-bias',
  climateHintOpacity: '--climate-hint-opacity',
  climateOutlineStrength: '--climate-outline-strength',
  climateAnnotationStrength: '--climate-annotation-strength',
  climateConnectionStrength: '--climate-connection-strength',
  climatePublicationStrength: '--climate-publication-strength',

  /* Legacy/developmental compatibility */
  developmentalClarity: '--developmental-clarity',
  developmentalPressure: '--developmental-pressure',
  developmentalAtmosphere: '--developmental-atmosphere',
  developmentalMemory: '--developmental-memory',
  developmentalResonance: '--developmental-resonance',
  developmentalChargeBias: '--developmental-charge-bias',
  developmentalSelectionBias: '--developmental-selection-bias',

  /* Author-app interface */
  authorModeAccent: '--author-mode-accent',
  authorModeLine: '--author-mode-line',
  authorModeWash: '--author-mode-wash',
  authorAnnotationStrength: '--author-annotation-strength',
  authorMarginPresence: '--author-margin-presence',
  authorThreadDensity: '--author-thread-density',
  authorDraftPrivacy: '--author-draft-privacy',
  authorPublicationReadiness: '--author-publication-readiness',

  surfacePermeabilityBase: '--spw-surface-permeability-base',

  activeOpColor: '--active-op-color',
  activeOpBorder: '--active-op-border',
  activeOpBgSoft: '--active-op-bg-soft'
});

const SPW_HORMONAL_PROFILES = Object.freeze({
  neutral: Object.freeze({
    charge: 0,
    valence: 0,
    resonance: 0,
    bias: 0,
    attention: 0,
    depth: 0,
    utility: 0,
    tasteProximity: 0.5,
    allocation: 0,
    drift: 0
  }),
  orienting: Object.freeze({
    charge: 0.16,
    valence: 0.12,
    resonance: 0.1,
    bias: -0.08,
    attention: 0.18,
    depth: 0.06,
    utility: 0.08,
    tasteProximity: 0.52,
    allocation: 0.12,
    drift: 0.04
  }),
  probing: Object.freeze({
    charge: 0.28,
    valence: 0.04,
    resonance: 0.22,
    bias: 0.06,
    attention: 0.34,
    depth: 0.12,
    utility: 0.16,
    tasteProximity: 0.5,
    allocation: 0.18,
    drift: 0.16
  }),
  binding: Object.freeze({
    charge: 0.22,
    valence: 0.18,
    resonance: 0.32,
    bias: -0.16,
    attention: 0.28,
    depth: 0.14,
    utility: 0.3,
    tasteProximity: 0.56,
    allocation: 0.34,
    drift: 0.02
  }),
  projecting: Object.freeze({
    charge: 0.4,
    valence: 0.24,
    resonance: 0.28,
    bias: 0.1,
    attention: 0.46,
    depth: 0.34,
    utility: 0.42,
    tasteProximity: 0.58,
    allocation: 0.38,
    drift: 0.12
  }),
  settling: Object.freeze({
    charge: 0.08,
    valence: 0.1,
    resonance: 0.18,
    bias: -0.04,
    attention: 0.12,
    depth: 0.04,
    utility: 0.12,
    tasteProximity: 0.54,
    allocation: 0.1,
    drift: 0.01
  }),
  annotating: Object.freeze({
    charge: 0.3,
    valence: 0.1,
    resonance: 0.28,
    bias: 0.08,
    attention: 0.42,
    depth: 0.18,
    utility: 0.36,
    tasteProximity: 0.56,
    allocation: 0.28,
    drift: 0.1
  }),
  publishing: Object.freeze({
    charge: 0.36,
    valence: 0.34,
    resonance: 0.32,
    bias: -0.04,
    attention: 0.5,
    depth: 0.26,
    utility: 0.54,
    tasteProximity: 0.62,
    allocation: 0.44,
    drift: 0.04
  })
});

/* ==========================================================================
   5. Normalization helpers
   ========================================================================== */

const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const humanize = (value = '') => normalizeText(value)
  .replace(/[_-]+/g, ' ')
  .toLowerCase();

const normalizeToken = (value = '') => humanize(value)
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const readDataTokens = (value = '') => new Set(
  String(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
);

const readBooleanDataFlag = (element, name, fallback = false) => {
  const raw = element?.dataset?.[name];

  if (raw == null || raw === '') return fallback;

  return raw === 'true' || raw === 'on' || raw === '1';
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAuthorMode = (value = '') => {
  const normalized = normalizeToken(value);
  return AUTHOR_WORKFLOW_MODES.includes(normalized) ? normalized : 'draft';
};

const normalizeDevelopmentalClimate = (value = '') => {
  const normalized = normalizeToken(value);

  if (normalized === 'kindle' || normalized === 'initiation') return 'orient';
  if (normalized === 'settle' || normalized === 'attune' || normalized === 'resistance') return 'anchor';
  if (normalized === 'compose' || normalized === 'transformation') return 'weave';
  if (normalized === 'practice' || normalized === 'return') return 'rehearse';
  if (normalized === 'project' || normalized === 'expression') return 'offer';

  return DEVELOPMENTAL_CLIMATE_IDS.includes(normalized) ? normalized : 'orient';
};

/* ==========================================================================
   6. DOM/runtime helpers
   ========================================================================== */

const onDomReady = (callback) => {
  if (!hasDocument() || typeof callback !== 'function') return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
};

const getPageSurface = () => getBody()?.dataset.spwSurface || '';

const getRequestedFeatures = () => readDataTokens(getBody()?.dataset.spwFeatures || '');

const getNavigationType = () => (
  hasPerformance()
    ? performance.getEntriesByType?.('navigation')?.[0]?.type || 'navigate'
    : 'navigate'
);

const matchesMaxWidth = (maxWidth) => (
  hasWindow()
    ? window.matchMedia(`(max-width: ${maxWidth}px)`).matches
    : false
);

const isInputFocused = () => {
  if (!hasDocument()) return false;

  const element = document.activeElement;

  return !!element && (
    element.tagName === 'INPUT'
    || element.tagName === 'TEXTAREA'
    || element.tagName === 'SELECT'
    || element.isContentEditable
  );
};

const getComputedTokenValue = (element, tokenName, fallback = '') => {
  if (!hasWindow()) return fallback;

  const target = isElement(element) ? element : getHtmlRoot();
  if (!target) return fallback;

  return window.getComputedStyle(target).getPropertyValue(tokenName).trim() || fallback;
};

const setComputedTokenValue = (element, tokenName, value) => {
  const target = isElement(element) ? element : getHtmlRoot();
  if (!target) return;

  target.style.setProperty(tokenName, String(value));
};

const removeComputedTokenValue = (element, tokenName) => {
  const target = isElement(element) ? element : getHtmlRoot();
  if (!target) return;

  target.style.removeProperty(tokenName);
};

/* ==========================================================================
   7. Hormonal token helpers
   ========================================================================== */

const readHormoneState = (element = getHtmlRoot()) => {
  const target = isElement(element) ? element : getHtmlRoot();

  return Object.freeze({
    charge: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.charge, '0')),
    valence: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.valence, '0')),
    resonance: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.resonance, '0')),
    bias: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.bias, '0')),
    attention: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.attention, '0')),
    depth: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.depth, '0')),
    utility: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.utility, '0')),
    tasteProximity: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.tasteProximity, '0.5')),
    allocation: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.allocation, '0')),
    drift: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.drift, '0'))
  });
};

const writeHormoneState = (element = getHtmlRoot(), partialState = {}, options = {}) => {
  const {
    clampValues = true,
    emit = false,
    phase = ''
  } = options;

  const target = isElement(element) ? element : getHtmlRoot();
  if (!target) return SPW_HORMONAL_PROFILES.neutral;

  const next = { ...SPW_HORMONAL_PROFILES.neutral, ...partialState };

  const normalized = {
    charge: clampValues ? clamp(toNumber(next.charge, 0), 0, 1) : toNumber(next.charge, 0),
    valence: clampValues ? clamp(toNumber(next.valence, 0), -1, 1) : toNumber(next.valence, 0),
    resonance: clampValues ? clamp(toNumber(next.resonance, 0), 0, 1) : toNumber(next.resonance, 0),
    bias: clampValues ? clamp(toNumber(next.bias, 0), -1, 1) : toNumber(next.bias, 0),
    attention: clampValues ? clamp(toNumber(next.attention, 0), 0, 1) : toNumber(next.attention, 0),
    depth: clampValues ? clamp(toNumber(next.depth, 0), 0, 1) : toNumber(next.depth, 0),
    utility: clampValues ? clamp(toNumber(next.utility, 0), 0, 1) : toNumber(next.utility, 0),
    tasteProximity: clampValues ? clamp(toNumber(next.tasteProximity, 0.5), 0, 1) : toNumber(next.tasteProximity, 0.5),
    allocation: clampValues ? clamp(toNumber(next.allocation, 0), 0, 1) : toNumber(next.allocation, 0),
    drift: clampValues ? clamp(toNumber(next.drift, 0), 0, 1) : toNumber(next.drift, 0)
  };

  for (const channel of SPW_HORMONE_CHANNELS) {
    setComputedTokenValue(target, SPW_CSS_STATE_TOKENS[channel], normalized[channel]);
  }

  if (phase) {
    target.dataset.spwHormonePhase = normalizeToken(phase);
  }

  if (emit) {
    emitSpwEvent('hormone:changed', {
      target,
      phase: normalizeToken(phase || ''),
      ...normalized
    }, {
      target: getDefaultEventTarget() || target,
      element: target
    });
  }

  return Object.freeze(normalized);
};

const applyHormonalProfile = (element = getHtmlRoot(), profileName = 'neutral', options = {}) => {
  const profile = SPW_HORMONAL_PROFILES[profileName] || SPW_HORMONAL_PROFILES.neutral;

  return writeHormoneState(element, profile, {
    ...options,
    phase: options.phase || profileName
  });
};

const blendHormoneStates = (base = {}, overlay = {}, ratio = 0.5) => {
  const amount = clamp(toNumber(ratio, 0.5), 0, 1);
  const merged = {};

  SPW_HORMONE_CHANNELS.forEach((channel) => {
    const fallback = channel === 'tasteProximity' ? 0.5 : 0;
    const baseValue = toNumber(base[channel], fallback);
    const overlayValue = toNumber(overlay[channel], fallback);

    merged[channel] = baseValue + ((overlayValue - baseValue) * amount);
  });

  return merged;
};

const deriveHormoneStateFromElement = (element) => {
  if (!isElement(element)) {
    return SPW_HORMONAL_PROFILES.neutral;
  }

  const role = normalizeToken(
    element.dataset.spwRole
    || element.closest?.('[data-spw-role]')?.dataset?.spwRole
    || ''
  );

  const interactivity = normalizeToken(
    element.dataset.spwInteractivity
    || element.closest?.('[data-spw-interactivity]')?.dataset?.spwInteractivity
    || ''
  );

  const importance = normalizeToken(
    element.dataset.spwImportance
    || element.closest?.('[data-spw-importance]')?.dataset?.spwImportance
    || ''
  );

  const authorMode = normalizeAuthorMode(
    element.dataset.authorMode
    || element.closest?.('[data-author-mode]')?.dataset?.authorMode
    || getHtmlRoot()?.dataset.authorMode
    || ''
  );

  let base = SPW_HORMONAL_PROFILES.neutral;

  if (role === 'probe') base = SPW_HORMONAL_PROFILES.probing;
  else if (role === 'schema' || role === 'registry') base = SPW_HORMONAL_PROFILES.binding;
  else if (role === 'routing' || role === 'orientation') base = SPW_HORMONAL_PROFILES.orienting;
  else if (role === 'surface' || role === 'artifact') base = SPW_HORMONAL_PROFILES.projecting;
  else if (role === 'status' || role === 'reference') base = SPW_HORMONAL_PROFILES.settling;

  if (authorMode === 'revise') base = blendHormoneStates(base, SPW_HORMONAL_PROFILES.annotating, 0.42);
  if (authorMode === 'publish') base = blendHormoneStates(base, SPW_HORMONAL_PROFILES.publishing, 0.46);

  let overlay = {};

  if (interactivity === 'controllable') overlay = { attention: 0.42, utility: 0.38, allocation: 0.34 };
  if (interactivity === 'inspectable') overlay = { resonance: 0.34, depth: 0.24, allocation: 0.28 };
  if (interactivity === 'navigable') overlay = { valence: 0.18, attention: 0.3, drift: 0.04 };

  let ratio = 0.42;
  if (importance === 'primary') ratio = 0.7;
  else if (importance === 'high') ratio = 0.58;
  else if (importance === 'medium') ratio = 0.42;
  else ratio = 0.24;

  return blendHormoneStates(base, overlay, ratio);
};

/* ==========================================================================
   8. Author workflow + developmental climate helpers
   ========================================================================== */

const getAuthorWorkflowDefinition = (mode = '') => (
  AUTHOR_WORKFLOW_DEFINITIONS[normalizeAuthorMode(mode)]
);

const resolveAuthorWorkflow = (element = getBody()) => {
  const html = getHtmlRoot();

  const mode = normalizeAuthorMode(
    element?.dataset?.authorMode
    || element?.dataset?.spwAuthorMode
    || element?.closest?.('[data-author-mode]')?.dataset?.authorMode
    || element?.closest?.('[data-spw-author-mode]')?.dataset?.spwAuthorMode
    || html?.dataset.authorMode
    || html?.dataset.spwAuthorMode
    || 'draft'
  );

  return Object.freeze({
    ...getAuthorWorkflowDefinition(mode),
    mode
  });
};

const writeAuthorWorkflow = (mode = 'draft', options = {}) => {
  const normalized = normalizeAuthorMode(mode);
  const html = getHtmlRoot();
  const body = getBody();

  if (html) {
    html.dataset.authorMode = normalized;
    html.dataset.spwAuthorMode = normalized;
  }

  if (body) {
    body.dataset.authorMode = normalized;
    body.dataset.spwAuthorMode = normalized;
  }

  if (options.emit !== false) {
    emitSpwEvent('author:mode', {
      mode: normalized,
      ...getAuthorWorkflowDefinition(normalized)
    }, {
      source: 'author',
      target: options.target || getDefaultEventTarget()
    });
  }

  return normalized;
};

const getDevelopmentalClimateDefinition = (climate = '') => (
  DEVELOPMENTAL_CLIMATE_DEFINITIONS[normalizeDevelopmentalClimate(climate)]
);

const resolveDevelopmentalClimate = (element = getBody()) => {
  const html = getHtmlRoot();

  const climate = normalizeDevelopmentalClimate(
    element?.dataset?.spwDevelopmentalClimate
    || element?.dataset?.spwSpiritPhase
    || element?.closest?.('[data-spw-developmental-climate]')?.dataset?.spwDevelopmentalClimate
    || element?.closest?.('[data-spw-spirit-phase]')?.dataset?.spwSpiritPhase
    || html?.dataset.spwDevelopmentalClimate
    || html?.dataset.spwSpiritPhase
    || 'orient'
  );

  return Object.freeze({
    ...getDevelopmentalClimateDefinition(climate),
    climate
  });
};

const snapshotClimateTokenField = (element = getHtmlRoot()) => {
  const target = isElement(element) ? element : getHtmlRoot();

  return Object.freeze({
    climate: resolveDevelopmentalClimate(target),
    accent: getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateAccent, ''),
    accentInk: getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateAccentInk, ''),
    accentLine: getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateAccentLine, ''),
    accentWash: getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateAccentWash, ''),
    clarityBias: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateClarityBias, '0'), 0),
    pressureBias: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climatePressureBias, '0'), 0),
    atmosphereBias: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateAtmosphereBias, '0'), 0),
    memoryBias: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateMemoryBias, '0'), 0),
    resonanceBias: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateResonanceBias, '0'), 0),
    chargeBias: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateChargeBias, '0'), 0),
    selectionBias: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateSelectionBias, '0'), 0),
    hintOpacity: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateHintOpacity, '0'), 0),
    outlineStrength: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateOutlineStrength, '0'), 0),
    annotationStrength: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateAnnotationStrength, '0'), 0),
    connectionStrength: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climateConnectionStrength, '0'), 0),
    publicationStrength: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.climatePublicationStrength, '0'), 0)
  });
};

const snapshotAuthorTokenField = (element = getHtmlRoot()) => {
  const target = isElement(element) ? element : getHtmlRoot();

  return Object.freeze({
    workflow: resolveAuthorWorkflow(target),
    accent: getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.authorModeAccent, ''),
    line: getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.authorModeLine, ''),
    wash: getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.authorModeWash, ''),
    annotationStrength: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.authorAnnotationStrength, '0'), 0),
    marginPresence: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.authorMarginPresence, '0'), 0),
    threadDensity: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.authorThreadDensity, '0'), 0),
    draftPrivacy: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.authorDraftPrivacy, '0'), 0),
    publicationReadiness: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.authorPublicationReadiness, '0'), 0)
  });
};

/* ==========================================================================
   9. Operator detection + lookup
   ========================================================================== */

const extractOperatorPrefix = (text = '') => {
  const match = normalizeText(text).match(OPERATOR_PREFIX_RE);
  return match?.[0] || '';
};

const detectOperator = (text = '') => {
  const normalized = normalizeText(text);

  for (const operator of OPERATOR_DEFINITIONS) {
    if (operator.pattern.test(normalized)) return operator;
  }

  return null;
};

const getOperatorDefinition = (type = '') => (
  OPERATOR_BY_TYPE[normalizeToken(type)] || null
);

const detectOperatorFromElement = (element) => {
  if (!isElement(element)) return null;

  const explicitType = normalizeToken(
    element.dataset.spwOperator
    || element.closest?.('[data-spw-operator]')?.dataset?.spwOperator
    || ''
  );

  if (explicitType && OPERATOR_BY_TYPE[explicitType]) {
    return OPERATOR_BY_TYPE[explicitType];
  }

  const text = (
    element.dataset.spwSigil
    || element.querySelector?.('.frame-sigil, .frame-card-sigil, .operator-card-token')?.textContent
    || element.textContent
    || ''
  );

  return detectOperator(text);
};

const describeOperator = (value = '') => {
  const byType = getOperatorDefinition(value);
  if (byType) return byType;

  return detectOperator(value);
};

/* ==========================================================================
   10. Ecology + instantiation resolution
   ========================================================================== */

const resolveSurfaceEcology = (element = getBody()) => ({
  surface: normalizeToken(
    element?.dataset?.spwSurface
    || getBody()?.dataset?.spwSurface
    || ''
  ),
  context: normalizeToken(
    element?.dataset?.spwContext
    || element?.closest?.('[data-spw-context]')?.dataset?.spwContext
    || ''
  ),
  wonder: normalizeToken(
    element?.dataset?.spwWonder
    || element?.closest?.('[data-spw-wonder]')?.dataset?.spwWonder
    || ''
  ),
  permeability: normalizeToken(
    element?.dataset?.spwPermeability
    || element?.closest?.('[data-spw-permeability]')?.dataset?.spwPermeability
    || ''
  ),
  room: normalizeToken(
    element?.dataset?.spwRoom
    || element?.closest?.('[data-spw-room]')?.dataset?.spwRoom
    || ''
  ),
  succession: normalizeToken(
    element?.dataset?.spwSuccession
    || element?.closest?.('[data-spw-succession]')?.dataset?.spwSuccession
    || ''
  ),
  recipe: normalizeToken(
    element?.dataset?.spwRecipe
    || element?.closest?.('[data-spw-recipe]')?.dataset?.spwRecipe
    || ''
  ),
  spell: normalizeToken(
    element?.dataset?.spwSpell
    || element?.closest?.('[data-spw-spell]')?.dataset?.spwSpell
    || ''
  )
});

const resolveInstantiation = (element, overrides = {}) => {
  const operator = detectOperatorFromElement(element);
  const ecology = resolveSurfaceEcology(element);

  return Object.freeze({
    substrate: overrides.substrate
      || normalizeToken(element?.dataset?.spwSubstrate || '')
      || operator?.type
      || '',
    form: overrides.form
      || normalizeToken(element?.dataset?.spwForm || '')
      || '',
    role: overrides.role
      || normalizeToken(element?.dataset?.spwRole || '')
      || '',
    context: overrides.context || ecology.context || '',
    field: Object.freeze({
      wonder: overrides.wonder || ecology.wonder || '',
      permeability: overrides.permeability || ecology.permeability || '',
      room: overrides.room || ecology.room || '',
      succession: overrides.succession || ecology.succession || ''
    }),
    recipe: Object.freeze({
      name: overrides.recipe || ecology.recipe || '',
      spell: overrides.spell || ecology.spell || '',
      channels: overrides.channels || []
    }),
    author: resolveAuthorWorkflow(element),
    climate: resolveDevelopmentalClimate(element),
    operator: operator?.type || '',
    operatorDefinition: operator || null
  });
};

const createSpwRuntimeContext = (root = getDefaultEventTarget(), overrides = {}) => {
  const html = getHtmlRoot();
  const body = getBody();

  return Object.freeze({
    root,
    html,
    body,
    surface: overrides.surface || getPageSurface(),
    features: overrides.features || getRequestedFeatures(),
    navigationType: overrides.navigationType || getNavigationType(),
    ecology: overrides.ecology || resolveSurfaceEcology(body),
    hormone: overrides.hormone || readHormoneState(html),
    author: overrides.author || resolveAuthorWorkflow(body),
    climate: overrides.climate || resolveDevelopmentalClimate(body),
    tokenField: overrides.tokenField || snapshotSpwTokenField(html),
    timestamp: Date.now()
  });
};

/* ==========================================================================
   11. Feature loading
   ========================================================================== */

const resolveFeatureInitializer = (module, exportName) => {
  if (exportName && typeof module?.[exportName] === 'function') {
    return {
      kind: 'named',
      fn: module[exportName]
    };
  }

  if (typeof module?.spwModule?.mount === 'function') {
    return {
      kind: 'module-contract',
      fn: module.spwModule.mount
    };
  }

  if (typeof module?.default === 'function') {
    return {
      kind: 'default',
      fn: module.default
    };
  }

  const fallbackName = Object.keys(module || {}).find((key) => (
    /^init[A-Z]/.test(key)
    && typeof module[key] === 'function'
  ));

  if (fallbackName) {
    return {
      kind: 'fallback-init',
      fn: module[fallbackName]
    };
  }

  return null;
};

const loadFeature = async (specifier, exportName, options = {}) => {
  const module = await import(specifier);
  const resolved = resolveFeatureInitializer(module, exportName);

  if (!resolved) return null;

  const context = options.context || createSpwRuntimeContext(options.root || getDefaultEventTarget());
  const args = Array.isArray(options.args) ? options.args : [];

  if (resolved.kind === 'module-contract') {
    return resolved.fn(context);
  }

  return resolved.fn(...args);
};

/* ==========================================================================
   12. Event emission
   ========================================================================== */

const EVENT_ALIASES = Object.freeze({
  'frame-change': 'frame:activated',
  'mode-change': 'frame:mode',
  'phase-change': 'spirit:shifted',
  'development-shifted': 'development:shifted',
  'operator-activated': 'operator:activated',
  'settings-change': 'settings:changed',
  'hormone-change': 'hormone:changed',
  'author-mode': 'author:mode'
});

const emitSpwEvent = (name, detail = {}, options = {}) => {
  const rawName = String(name || '').replace(/^spw:/, '');
  const canonicalName = EVENT_ALIASES[rawName] || rawName;

  if (canonicalName.includes(':')) {
    return bus.emit(canonicalName, detail, {
      target: options.target || getDefaultEventTarget(),
      ...options
    });
  }

  const target = options.target || getDefaultEventTarget();
  if (!target) {
    return {
      name: canonicalName,
      detail,
      ts: Date.now()
    };
  }

  const bubbles = options.bubbles ?? true;
  const enriched = {
    ...detail,
    _name: `spw:${canonicalName}`,
    _ts: Date.now(),
    _source: canonicalName.split(':')[0] || 'spw'
  };

  target.dispatchEvent(new CustomEvent(`spw:${canonicalName}`, {
    detail: enriched,
    bubbles,
    composed: true
  }));

  return {
    name: canonicalName,
    detail: enriched,
    ts: enriched._ts
  };
};

const emitSpwAction = (token, description, options = {}) => {
  const detail = typeof token === 'object' && token !== null
    ? token
    : { token, description };

  const result = emitSpwEvent('spell:cast', detail, options);

  const target = options.target || getDefaultEventTarget();
  if (target) {
    target.dispatchEvent(new CustomEvent('spw:action', {
      detail: {
        ...detail,
        _name: 'spw:action',
        _ts: Date.now(),
        _source: 'spell'
      },
      bubbles: options.bubbles ?? true,
      composed: true
    }));
  }

  return result;
};

/* ==========================================================================
   13. Frame metadata
   ========================================================================== */

const getFrameMeta = (frame) => {
  if (!frame) {
    return {
      id: '',
      opType: null,
      prefix: null,
      sigilText: '#>frame',
      headingText: 'Frame',
      operatorLabel: 'frame declaration',
      intent: 'orient',
      family: 'structural',
      context: '',
      wonder: '',
      author: AUTHOR_WORKFLOW_DEFINITIONS.draft,
      climate: DEVELOPMENTAL_CLIMATE_DEFINITIONS.orient,
      hormone: SPW_HORMONAL_PROFILES.neutral
    };
  }

  const sigil = frame.querySelector('.frame-sigil');
  const heading = frame.querySelector('h1, h2, h3');
  const sigilText = normalizeText(
    sigil?.textContent || (frame.id ? `#>${frame.id}` : '#>frame')
  );
  const detected = detectOperator(sigilText);
  const opType = normalizeToken(sigil?.dataset.spwOperator || detected?.type || '');
  const definition = getOperatorDefinition(opType) || detected;
  const ecology = resolveSurfaceEcology(frame);

  return {
    id: frame.id || '',
    opType: definition?.type || opType || null,
    prefix: definition?.prefix || (opType ? (OPERATOR_PREFIXES[opType] ?? opType) : null),
    sigilText,
    headingText: normalizeText(heading?.textContent || frame.id || 'Frame'),
    operatorLabel: definition?.label || 'frame declaration',
    intent: definition?.intent || '',
    family: definition?.family || '',
    context: ecology.context || '',
    wonder: ecology.wonder || '',
    author: resolveAuthorWorkflow(frame),
    climate: resolveDevelopmentalClimate(frame),
    hormone: deriveHormoneStateFromElement(frame)
  };
};

/* ==========================================================================
   14. Small convenience helpers
   ========================================================================== */

const getElementLabel = (element) => normalizeText(
  element?.dataset?.spwLabel
  || element?.getAttribute?.('aria-label')
  || element?.querySelector?.('h1, h2, h3, h4, strong, figcaption')?.textContent
  || element?.textContent
  || ''
);

const getSpellProfile = (element) => Object.freeze({
  spell: normalizeToken(
    element?.dataset?.spwSpell
    || element?.closest?.('[data-spw-spell]')?.dataset?.spwSpell
    || ''
  ),
  recipe: normalizeToken(
    element?.dataset?.spwRecipe
    || element?.closest?.('[data-spw-recipe]')?.dataset?.spwRecipe
    || ''
  ),
  genre: normalizeToken(
    element?.dataset?.spwGenre
    || element?.closest?.('[data-spw-genre]')?.dataset?.spwGenre
    || ''
  )
});

/* ==========================================================================
   15. Token + hormone snapshots
   ========================================================================== */

const snapshotSpwTokenField = (element = getHtmlRoot()) => {
  const target = isElement(element) ? element : getHtmlRoot();

  return Object.freeze({
    hormone: readHormoneState(target),
    author: snapshotAuthorTokenField(target),
    climate: snapshotClimateTokenField(target),

    motionScale: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.motionScale, '1'), 1),
    semanticDensityFactor: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.semanticDensityFactor, '1'), 1),
    enhancementFactor: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.enhancementFactor, '1'), 1),
    infospaceFactor: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.infospaceFactor, '1'), 1),
    operatorPresentationFactor: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.operatorPresentationFactor, '1'), 1),
    operatorSaturationFactor: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.operatorSaturationFactor, '1'), 1),
    cognitiveHandleFactor: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.cognitiveHandleFactor, '0'), 0),
    relationalFactor: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.relationalFactor, '0'), 0),
    semanticMetadataFactor: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.semanticMetadataFactor, '0'), 0),

    developmentalClarity: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.developmentalClarity, '0'), 0),
    developmentalPressure: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.developmentalPressure, '0'), 0),
    developmentalAtmosphere: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.developmentalAtmosphere, '0'), 0),
    developmentalMemory: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.developmentalMemory, '0'), 0),
    developmentalResonance: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.developmentalResonance, '0'), 0),
    developmentalChargeBias: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.developmentalChargeBias, '0'), 0),
    developmentalSelectionBias: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.developmentalSelectionBias, '0'), 0),

    surfacePermeabilityBase: toNumber(getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.surfacePermeabilityBase, '0'), 0),
    activeOpColor: getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.activeOpColor, ''),
    activeOpBorder: getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.activeOpBorder, ''),
    activeOpBgSoft: getComputedTokenValue(target, SPW_CSS_STATE_TOKENS.activeOpBgSoft, '')
  });
};

const applyElementHormoneHint = (element, profileNameOrState = 'neutral', options = {}) => {
  if (!isElement(element)) return null;

  const nextState =
    typeof profileNameOrState === 'string'
      ? (SPW_HORMONAL_PROFILES[profileNameOrState] || SPW_HORMONAL_PROFILES.neutral)
      : profileNameOrState;

  const written = writeHormoneState(element, nextState, options);

  element.dataset.spwHormoneHint = typeof profileNameOrState === 'string'
    ? normalizeToken(profileNameOrState)
    : (options.phase ? normalizeToken(options.phase) : 'custom');

  return written;
};

/* ==========================================================================
   16. Exports
   ========================================================================== */

export { bus };

export {
  AUTHOR_WORKFLOW_DEFINITIONS,
  AUTHOR_WORKFLOW_MODES,
  DEVELOPMENTAL_CLIMATE_DEFINITIONS,
  DEVELOPMENTAL_CLIMATE_IDS,
  OPERATOR_DEFINITIONS,
  OPERATOR_BY_PREFIX,
  OPERATOR_BY_TYPE,
  OPERATOR_FAMILIES,
  OPERATOR_INTENTS,
  OPERATOR_PREFIXES,
  SPW_CSS_STATE_TOKENS,
  SPW_HORMONAL_PROFILES,
  SPW_HORMONE_CHANNELS,
  SPW_INSTANTIATION_LAYERS,
  SPW_RECIPE_CHANNELS,
  SPW_WONDER_CATEGORIES,
  applyElementHormoneHint,
  applyHormonalProfile,
  blendHormoneStates,
  clamp,
  createSpwRuntimeContext,
  describeOperator,
  deriveHormoneStateFromElement,
  detectOperator,
  detectOperatorFromElement,
  emitSpwAction,
  emitSpwEvent,
  extractOperatorPrefix,
  getAuthorWorkflowDefinition,
  getBody,
  getComputedTokenValue,
  getDevelopmentalClimateDefinition,
  getElementLabel,
  getFrameMeta,
  getHtmlRoot,
  getNavigationType,
  getOperatorDefinition,
  getPageSurface,
  getRequestedFeatures,
  getSpellProfile,
  hasDocument,
  hasPerformance,
  hasWindow,
  humanize,
  isElement,
  isHTMLElement,
  isInputFocused,
  loadFeature,
  matchesMaxWidth,
  normalizeAuthorMode,
  normalizeDevelopmentalClimate,
  normalizeText,
  normalizeToken,
  onDomReady,
  readBooleanDataFlag,
  readDataTokens,
  readHormoneState,
  removeComputedTokenValue,
  resolveAuthorWorkflow,
  resolveDevelopmentalClimate,
  resolveInstantiation,
  resolveSurfaceEcology,
  setComputedTokenValue,
  snapshotAuthorTokenField,
  snapshotClimateTokenField,
  snapshotSpwTokenField,
  toNumber,
  writeAuthorWorkflow,
  writeHormoneState
};