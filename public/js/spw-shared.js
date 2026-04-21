/* ==========================================================================
   spw-shared.js
   --------------------------------------------------------------------------
   Purpose
   - Shared semantic/runtime utilities used across the Spw front-end.
   - Central source of truth for operator metadata, event aliasing, page-level
     context, hormonal regulation, layered instantiation, CSS-token bridging,
     and lightweight feature/module loading.

   Design goals
   - HTML-first: prefer explicit data attributes when present.
   - Layered instantiation: make it easy for modules to resolve the same
     substrate/form/role/context/field/recipe stack consistently.
   - Hormonal metaphor: support lightweight regulation helpers that do not
     hijack scroll or force expensive orchestration.
   - CSS token bridge: JS should be able to read/write meaningful semantic
     state without duplicating token logic ad hoc.
   - Bus-first eventing: route canonical events through SpwBus while preserving
     backward-compatible DOM pathways where needed.
   ========================================================================== */

import { bus } from './spw-bus.js';

/* ==========================================================================
   1. Operator registry
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
   2. Shared taxonomies
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

/* ==========================================================================
   3. Hormonal + semantic token bridge
   --------------------------------------------------------------------------
   These names intentionally align with CSS token internals.
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

  developmentalClarity: '--spw-developmental-clarity',
  developmentalPressure: '--spw-developmental-pressure',
  developmentalAtmosphere: '--spw-developmental-atmosphere',
  developmentalMemory: '--spw-developmental-memory',
  developmentalResonance: '--spw-developmental-resonance',
  developmentalChargeBias: '--spw-developmental-charge-bias',
  developmentalSelectionBias: '--spw-developmental-selection-bias',
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
  })
});

/* ==========================================================================
   4. Normalization helpers
   ========================================================================== */

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

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

const getHtmlRoot = () => document.documentElement;
const getBody = () => document.body;

/* ==========================================================================
   5. DOM/runtime helpers
   ========================================================================== */

const onDomReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }

  callback();
};

const getPageSurface = () => document.body?.dataset.spwSurface || '';

const getRequestedFeatures = () => readDataTokens(document.body?.dataset.spwFeatures || '');

const getNavigationType = () => (
  performance.getEntriesByType?.('navigation')?.[0]?.type || 'navigate'
);

const matchesMaxWidth = (maxWidth) => (
  window.matchMedia(`(max-width: ${maxWidth}px)`).matches
);

const isInputFocused = () => {
  const element = document.activeElement;
  return !!element && (
    element.tagName === 'INPUT'
    || element.tagName === 'TEXTAREA'
    || element.isContentEditable
    || element.tagName === 'SELECT'
  );
};

const getComputedTokenValue = (element, tokenName, fallback = '') => {
  const target = element instanceof Element ? element : getHtmlRoot();
  return getComputedStyle(target).getPropertyValue(tokenName).trim() || fallback;
};

const setComputedTokenValue = (element, tokenName, value) => {
  const target = element instanceof Element ? element : getHtmlRoot();
  target.style.setProperty(tokenName, String(value));
};

const removeComputedTokenValue = (element, tokenName) => {
  const target = element instanceof Element ? element : getHtmlRoot();
  target.style.removeProperty(tokenName);
};

/* ==========================================================================
   6. Hormonal token helpers
   ========================================================================== */

const readHormoneState = (element = getHtmlRoot()) => {
  const target = element instanceof Element ? element : getHtmlRoot();

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

  const target = element instanceof Element ? element : getHtmlRoot();
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

  setComputedTokenValue(target, SPW_CSS_STATE_TOKENS.charge, normalized.charge);
  setComputedTokenValue(target, SPW_CSS_STATE_TOKENS.valence, normalized.valence);
  setComputedTokenValue(target, SPW_CSS_STATE_TOKENS.resonance, normalized.resonance);
  setComputedTokenValue(target, SPW_CSS_STATE_TOKENS.bias, normalized.bias);
  setComputedTokenValue(target, SPW_CSS_STATE_TOKENS.attention, normalized.attention);
  setComputedTokenValue(target, SPW_CSS_STATE_TOKENS.depth, normalized.depth);
  setComputedTokenValue(target, SPW_CSS_STATE_TOKENS.utility, normalized.utility);
  setComputedTokenValue(target, SPW_CSS_STATE_TOKENS.tasteProximity, normalized.tasteProximity);
  setComputedTokenValue(target, SPW_CSS_STATE_TOKENS.allocation, normalized.allocation);
  setComputedTokenValue(target, SPW_CSS_STATE_TOKENS.drift, normalized.drift);

  if (phase) {
    target.dataset.spwHormonePhase = normalizeToken(phase);
  }

  if (emit) {
    bus.emit('hormone:changed', {
      target,
      phase: normalizeToken(phase || ''),
      ...normalized
    });
  }

  return normalized;
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
    const baseValue = channel === 'tasteProximity'
      ? toNumber(base[channel], 0.5)
      : toNumber(base[channel], 0);
    const overlayValue = channel === 'tasteProximity'
      ? toNumber(overlay[channel], 0.5)
      : toNumber(overlay[channel], 0);

    merged[channel] = baseValue + ((overlayValue - baseValue) * amount);
  });

  return merged;
};

const deriveHormoneStateFromElement = (element) => {
  if (!(element instanceof Element)) {
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

  let base = SPW_HORMONAL_PROFILES.neutral;

  if (role === 'probe') base = SPW_HORMONAL_PROFILES.probing;
  else if (role === 'schema' || role === 'registry') base = SPW_HORMONAL_PROFILES.binding;
  else if (role === 'routing' || role === 'orientation') base = SPW_HORMONAL_PROFILES.orienting;
  else if (role === 'surface' || role === 'artifact') base = SPW_HORMONAL_PROFILES.projecting;
  else if (role === 'status' || role === 'reference') base = SPW_HORMONAL_PROFILES.settling;

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
   7. Operator detection + lookup
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
  if (!(element instanceof Element)) return null;

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
    || element.textContent
    || element.querySelector?.('.frame-sigil, .frame-card-sigil, .operator-card-token')?.textContent
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
   8. Ecology + instantiation resolution
   ========================================================================== */

const resolveSurfaceEcology = (element = document.body) => ({
  surface: normalizeToken(
    element?.dataset?.spwSurface
    || document.body?.dataset?.spwSurface
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
    field: {
      wonder: overrides.wonder || ecology.wonder || '',
      permeability: overrides.permeability || ecology.permeability || '',
      room: overrides.room || ecology.room || '',
      succession: overrides.succession || ecology.succession || ''
    },
    recipe: {
      name: overrides.recipe || ecology.recipe || '',
      spell: overrides.spell || ecology.spell || '',
      channels: overrides.channels || []
    },
    operator: operator?.type || '',
    operatorDefinition: operator || null
  });
};

const createSpwRuntimeContext = (root = document, overrides = {}) => {
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
    timestamp: Date.now()
  });
};

/* ==========================================================================
   9. Feature loading
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

  const fallbackName = Object.keys(module || {}).find((key) => /^init[A-Z]/.test(key) && typeof module[key] === 'function');
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

  const context = options.context || createSpwRuntimeContext(options.root || document);
  const args = Array.isArray(options.args) ? options.args : [];

  if (resolved.kind === 'module-contract') {
    return resolved.fn(context);
  }

  return resolved.fn(...args);
};

/* ==========================================================================
   10. Event emission
   ========================================================================== */

const EVENT_ALIASES = Object.freeze({
  'frame-change': 'frame:activated',
  'mode-change': 'frame:mode',
  'phase-change': 'spirit:shifted',
  'operator-activated': 'operator:activated',
  'settings-change': 'settings:changed',
  'hormone-change': 'hormone:changed'
});

const emitSpwEvent = (name, detail = {}, options = {}) => {
  const rawName = String(name || '').replace(/^spw:/, '');
  const canonicalName = EVENT_ALIASES[rawName] || rawName;

  if (canonicalName.includes(':')) {
    return bus.emit(canonicalName, detail, options);
  }

  const target = options.target || document;
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

  const result = bus.emit('spell:cast', detail, options);

  const target = options.target || document;
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

  return result;
};

/* ==========================================================================
   11. Frame metadata
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
    hormone: deriveHormoneStateFromElement(frame)
  };
};

/* ==========================================================================
   12. Small convenience helpers
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
   13. Token + hormone snapshots
   ========================================================================== */

const snapshotSpwTokenField = (element = getHtmlRoot()) => {
  const target = element instanceof Element ? element : getHtmlRoot();

  return Object.freeze({
    hormone: readHormoneState(target),
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
  if (!(element instanceof Element)) return null;

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
   14. Exports
   ========================================================================== */

export { bus };

export {
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
  createSpwRuntimeContext,
  describeOperator,
  deriveHormoneStateFromElement,
  detectOperator,
  detectOperatorFromElement,
  emitSpwAction,
  emitSpwEvent,
  extractOperatorPrefix,
  getBody,
  getComputedTokenValue,
  getElementLabel,
  getFrameMeta,
  getHtmlRoot,
  getNavigationType,
  getOperatorDefinition,
  getPageSurface,
  getRequestedFeatures,
  getSpellProfile,
  humanize,
  isInputFocused,
  loadFeature,
  matchesMaxWidth,
  normalizeText,
  normalizeToken,
  onDomReady,
  readBooleanDataFlag,
  readDataTokens,
  readHormoneState,
  removeComputedTokenValue,
  resolveInstantiation,
  resolveSurfaceEcology,
  setComputedTokenValue,
  snapshotSpwTokenField,
  writeHormoneState
};
