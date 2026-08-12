/* ==========================================================================
   operator-detection.js
   --------------------------------------------------------------------------
   Canonical operator registry + detection. Split from shared.js so consumers
   that only need detectOperator (e.g. dom-contracts) do not pull the full
   shared surface (bus, climate, hormones, …).
   ========================================================================== */

import {
  collapseText as normalizeText,
  semanticToken as normalizeToken,
} from '/public/js/kernel/text-normalization.js';

const isElement = (value) => (
  typeof Element !== 'undefined'
  && value instanceof Element
);

/* ==========================================================================
   Operator registry
   ========================================================================== */

const OPERATOR_DEFINITIONS = Object.freeze([
  {
    pattern: /^#>/,
    type: 'frame',
    label: 'frame address',
    prefix: '#>',
    role: 'frame_address',
    physics: 'named resonance handle',
    intent: 'vibrate',
    interaction: 'activate or inspect a named resonance handle',
    family: 'resonance',
    speech: 'vibration',
    reversibility: 'returnable',
    pronunciation: 'hash-gt',
    mnemonic: 'Address the house.'
  },
  {
    pattern: /^#:/,
    type: 'layer',
    label: 'layer vibration',
    prefix: '#:',
    role: 'layer_vibration',
    physics: 'named resonance field',
    intent: 'vibrate',
    interaction: 'inspect the layer as a named resonance field',
    family: 'resonance',
    speech: 'vibration',
    reversibility: 'inspectable',
    pronunciation: 'layer',
    mnemonic: 'Set the mood.'
  },
  {
    pattern: /^#/,
    type: 'vibration',
    label: 'vibration',
    prefix: '#',
    role: 'annotation',
    physics: 'resonance tag',
    intent: 'resonate',
    interaction: 'name a structure so it can be recognized by resonance',
    family: 'resonance',
    speech: 'tone',
    reversibility: 'returnable',
    pronunciation: 'tone',
    mnemonic: 'Find the frequency.'
  },
  {
    pattern: /^\./,
    type: 'ground',
    label: 'ground',
    prefix: '.',
    role: 'ground_handle',
    physics: 'bound register/identifier handle',
    intent: 'settle',
    interaction: 'return to the local ground, baseline, or center of gravity',
    family: 'grounding',
    speech: 'ground',
    reversibility: 'recoverable',
    pronunciation: 'settle',
    mnemonic: 'Back to earth.'
  },
  {
    pattern: /^\^/,
    type: 'integration',
    label: 'integration',
    prefix: '^',
    role: 'integrate',
    physics: 'upward emission',
    intent: 'integrate',
    interaction: 'lift parts into an inspectable integrated relation',
    family: 'relational',
    speech: 'synthesis',
    reversibility: 'inspectable',
    pronunciation: 'lift',
    mnemonic: 'Lasso the thought.'
  },
  {
    pattern: /^~/,
    type: 'potential',
    label: 'potential',
    prefix: '~',
    role: 'potential',
    physics: 'superposition defer',
    intent: 'hold',
    interaction: 'keep a possible path available without collapsing it',
    family: 'possibility',
    speech: 'thread',
    reversibility: 'deferrable',
    pronunciation: 'thread',
    mnemonic: 'Reach out.'
  },
  {
    pattern: /^\?/,
    type: 'wonder',
    label: 'wonder',
    prefix: '?',
    role: 'probe',
    physics: 'measurement onset',
    intent: 'wonder',
    interaction: 'open curiosity, uncertainty, or an exploratory aperture',
    family: 'inquiry',
    speech: 'question',
    reversibility: 'reversible',
    pronunciation: 'ask',
    mnemonic: 'Open the door.'
  },
  {
    pattern: /^@/,
    type: 'perspective',
    label: 'perspective',
    prefix: '@',
    role: 'observer',
    physics: 'perspective push',
    intent: 'situate',
    interaction: 'shift or inspect the viewpoint shaping an observation',
    family: 'perspective',
    speech: 'viewpoint',
    reversibility: 'revisable',
    pronunciation: 'commit',
    mnemonic: 'Target locked.'
  },
  {
    pattern: /^\*/,
    type: 'value',
    label: 'value',
    prefix: '*',
    role: 'collapse',
    physics: 'materialization',
    intent: 'value',
    interaction: 'mark material salience, substance, or concrete worth',
    family: 'material',
    speech: 'value',
    reversibility: 'replayable',
    pronunciation: 'flow',
    mnemonic: 'Open the tap.'
  },
  {
    pattern: /^&/,
    type: 'subject',
    label: 'subject',
    prefix: '&',
    role: 'merge',
    physics: 'entanglement/composition',
    intent: 'subject',
    interaction: 'name the subject or binding focus of a relation',
    family: 'relational',
    speech: 'subject',
    reversibility: 'revisable',
    pronunciation: 'bind',
    mnemonic: 'Better together.'
  },
  {
    pattern: /^=/,
    type: 'binding',
    label: 'binding',
    prefix: '=',
    role: 'constraint',
    physics: 'bias field',
    intent: 'bind',
    interaction: 'name, pin, or categorize a local value',
    family: 'grounding',
    speech: 'assignment',
    reversibility: 'sticky',
    pronunciation: 'pin',
    mnemonic: 'Keep this here.'
  },
  {
    pattern: /^\$/,
    type: 'substrate',
    label: 'substrate',
    prefix: '$',
    role: 'selector',
    physics: 'addressing potential',
    intent: 'support',
    interaction: 'reveal the support layer: money, time, storage, memory, attention, infrastructure, or material pressure',
    family: 'resource-output',
    speech: 'substrate',
    reversibility: 'reversible',
    pronunciation: 'substrate',
    mnemonic: 'Name what carries the charge.'
  },
  {
    pattern: /^%/,
    type: 'normalize',
    label: 'normalization',
    prefix: '%',
    role: 'measure',
    physics: 'scalar observation',
    intent: 'scale',
    interaction: 'compare, normalize, or adjust salience',
    family: 'reflective',
    speech: 'adverb',
    reversibility: 'revisable',
    pronunciation: 'scale',
    mnemonic: 'Level the field.'
  },
  {
    pattern: /^!/,
    type: 'action',
    label: 'action',
    prefix: '!',
    role: 'action',
    physics: 'kinetic injection',
    intent: 'act',
    interaction: 'commit a move and make the consequence observable',
    family: 'operative',
    speech: 'verb',
    reversibility: 'committing',
    pronunciation: 'force',
    mnemonic: 'Follow the rule.'
  },
  {
    pattern: /^>/,
    type: 'concept-edge',
    label: 'concept edge',
    prefix: '>',
    role: 'concept_edge',
    physics: 'closing edge surface',
    intent: 'concept',
    interaction: 'mark the closing edge of a concept bracket',
    family: 'conceptual',
    speech: 'concept',
    reversibility: 'projected',
    pronunciation: 'show',
    mnemonic: 'Cast the light.'
  },
  {
    pattern: /^</,
    type: 'concept',
    label: 'concept',
    prefix: '<',
    role: 'concept',
    physics: 'topical boundary',
    intent: 'concept',
    interaction: 'open a concept bracket or topical boundary',
    family: 'conceptual',
    speech: 'concept',
    reversibility: 'scoping',
    pronunciation: 'swoop',
    mnemonic: 'Lasso the field.'
  },
  {
    pattern: /^\(/,
    type: 'scene',
    label: 'scene',
    prefix: '(',
    role: 'scene',
    physics: 'staged midprocess observability',
    intent: 'stage',
    interaction: 'enter a scene where structure becomes observable',
    family: 'situational',
    speech: 'scene',
    reversibility: 'enterable',
    pronunciation: 'scene',
    mnemonic: 'Light the stage.'
  },
  {
    pattern: /^\[/,
    type: 'mode',
    label: 'mode',
    prefix: '[',
    role: 'mode',
    physics: 'indexed posture lens',
    intent: 'select',
    interaction: 'choose a mode while keeping alternatives discoverable',
    family: 'modal',
    speech: 'mode',
    reversibility: 'switchable',
    pronunciation: 'choose',
    mnemonic: 'Pick a lens.'
  },
  {
    pattern: /^\{/,
    type: 'direction',
    label: 'direction',
    prefix: '{',
    role: 'direction',
    physics: 'material aperture',
    intent: 'direct',
    interaction: 'hold direction, bounded motion, or what belongs together',
    family: 'directional',
    speech: 'direction',
    reversibility: 'bounded',
    pronunciation: 'brace',
    mnemonic: 'Hold the space.'
  }
]);

const OPERATOR_BY_TYPE = Object.freeze(
  Object.fromEntries(OPERATOR_DEFINITIONS.map((definition) => [definition.type, definition]))
);

const OPERATOR_BY_PREFIX = Object.freeze(
  Object.fromEntries(OPERATOR_DEFINITIONS.map((definition) => [definition.prefix, definition]))
);

const OPERATOR_TYPE_ALIASES = Object.freeze({
  baseline: 'ground',
  ground_handle: 'ground',
  'ground-handle': 'ground',
  intrinsic: 'ground',
  object: 'integration',
  ref: 'potential',
  superposition: 'potential',
  probe: 'wonder',
  stream: 'value',
  collapse: 'value',
  merge: 'subject',
  confluence: 'subject',
  pragma: 'action',
  kinetic: 'action',
  topic: 'concept',
  surface: 'concept-edge',
  'concept-edge': 'concept-edge',
  'concept_edge': 'concept-edge',
  address: 'frame',
  select: 'mode',
  observer: 'perspective',
  constraint: 'binding',
  selector: 'substrate',
  annotation: 'vibration',
  scalar: 'normalize',
  /* intent-verb forms authored in route HTML (2026-07-03 sigil audit):
     without these, getOperatorDefinition returned null and affordances
     fell back to generic for ~50 authored handles. */
  integrate: 'integration',
  situate: 'perspective',
  bind: 'binding',
  act: 'action',
  tune: 'normalize',
  ascension: 'integration',
  publish: 'integration',
  meta: 'substrate',
  resource: 'substrate',
  support: 'substrate',
  configuration: 'binding',
  config: 'binding',
  measure: 'normalize',
  /* Inline prose links to another surface, authored as data-spw-operator="route"
     (46 handles across 7 routes). Same failure the 2026-07-03 pass fixed: the
     value resolved to null, so these fell back to generic while their
     siblings in the same sentence resolved and picked up operator treatment. */
  route: 'concept-edge'
});

const OPERATOR_PREFIXES = Object.freeze(
  Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, prefix }) => [type, prefix]))
);

const OPERATOR_INTENTS = Object.freeze(
  Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, intent }) => [type, intent]))
);

const OPERATOR_FAMILIES = Object.freeze(
  Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, family }) => [type, family]))
);

const OPERATOR_GEOMETRY = Object.freeze({
  frame: Object.freeze({
    leftRole: 'address-source',
    rightRole: 'named-resonance-field',
    flow: 'source-to-address',
    braceBias: 'objective',
    geometry: 'anchor',
    overload: 'address-vibration',
    chargeRole: 'frame-lock',
  }),
  layer: Object.freeze({
    leftRole: 'layer-source',
    rightRole: 'resonance-field',
    flow: 'source-to-register',
    braceBias: 'objective',
    geometry: 'field-plane',
    overload: 'layer-vibration',
    chargeRole: 'register-charge',
  }),
  vibration: Object.freeze({
    leftRole: 'naming-source',
    rightRole: 'resonant-category',
    flow: 'name-to-field',
    braceBias: 'objective',
    geometry: 'frequency-anchor',
    overload: 'name-or-tone',
    chargeRole: 'resonance-charge',
  }),
  potential: Object.freeze({
    leftRole: 'current-perspective',
    rightRole: 'deferred-target',
    flow: 'observer-to-potential',
    braceBias: 'objective-to-subjective',
    geometry: 'thread',
    overload: 'reference-or-memory',
    chargeRole: 'latent-charge',
  }),
  ground: Object.freeze({
    leftRole: 'wandering-state',
    rightRole: 'local-baseline',
    flow: 'exploration-to-ground',
    braceBias: 'objective',
    geometry: 'center-of-gravity',
    overload: 'return-or-default',
    chargeRole: 'discharge',
  }),
  integration: Object.freeze({
    leftRole: 'parts-or-evidence',
    rightRole: 'inspectable-whole',
    flow: 'implicit-to-explicit',
    braceBias: 'objective-to-subjective',
    geometry: 'lift',
    overload: 'object-or-ascension',
    chargeRole: 'integration-charge',
  }),
  wonder: Object.freeze({
    leftRole: 'known-edge',
    rightRole: 'open-aperture',
    flow: 'certainty-to-question',
    braceBias: 'subjective',
    geometry: 'aperture',
    overload: 'probe-or-uncertainty',
    chargeRole: 'curiosity-charge',
  }),
  perspective: Object.freeze({
    leftRole: 'observer-position',
    rightRole: 'observed-field',
    flow: 'viewpoint-to-observation',
    braceBias: 'subjective-to-objective',
    geometry: 'coordinate-origin',
    overload: 'viewpoint-or-context',
    chargeRole: 'situated-charge',
  }),
  value: Object.freeze({
    leftRole: 'material-source',
    rightRole: 'substance-or-flow',
    flow: 'substance-to-salience',
    braceBias: 'objective',
    geometry: 'mass',
    overload: 'value-or-stream',
    chargeRole: 'material-charge',
  }),
  subject: Object.freeze({
    leftRole: 'relation-inputs',
    rightRole: 'bound-subject',
    flow: 'adjacency-to-relation',
    braceBias: 'balanced',
    geometry: 'binding-axis',
    overload: 'subject-or-merge',
    chargeRole: 'relational-charge',
  }),
  binding: Object.freeze({
    leftRole: 'loose-value',
    rightRole: 'named-pin',
    flow: 'value-to-register',
    braceBias: 'objective',
    geometry: 'pin',
    overload: 'assignment-or-memory',
    chargeRole: 'retention-charge',
  }),
  substrate: Object.freeze({
    leftRole: 'carried-charge',
    rightRole: 'support-layer',
    flow: 'load-to-substrate',
    braceBias: 'objective',
    geometry: 'support-plane',
    overload: 'resource-or-medium',
    chargeRole: 'load-bearing-charge',
  }),
  normalize: Object.freeze({
    leftRole: 'raw-measure',
    rightRole: 'scaled-comparison',
    flow: 'measurement-to-scale',
    braceBias: 'balanced',
    geometry: 'ratio',
    overload: 'objective-or-subjective-measure',
    chargeRole: 'ordinal-charge',
  }),
  action: Object.freeze({
    leftRole: 'intent',
    rightRole: 'observable-consequence',
    flow: 'intent-to-effect',
    braceBias: 'subjective-to-objective',
    geometry: 'impulse',
    overload: 'command-or-commitment',
    chargeRole: 'release-charge',
  }),
  concept: Object.freeze({
    leftRole: 'outside-context',
    rightRole: 'concept-interior',
    flow: 'outside-to-boundary',
    braceBias: 'balanced',
    geometry: 'opening-edge',
    overload: 'concept-or-topic',
    chargeRole: 'boundary-charge',
  }),
  'concept-edge': Object.freeze({
    leftRole: 'concept-interior',
    rightRole: 'projected-surface',
    flow: 'boundary-to-output',
    braceBias: 'balanced',
    geometry: 'closing-edge',
    overload: 'surface-or-projection',
    chargeRole: 'projection-charge',
  }),
  scene: Object.freeze({
    leftRole: 'conditions',
    rightRole: 'staged-observation',
    flow: 'structure-to-performance',
    braceBias: 'subjective',
    geometry: 'scene-plane',
    overload: 'scene-or-context',
    chargeRole: 'performance-charge',
  }),
  mode: Object.freeze({
    leftRole: 'option-set',
    rightRole: 'active-selection',
    flow: 'alternatives-to-posture',
    braceBias: 'balanced',
    geometry: 'coordinate-choice',
    overload: 'mode-or-variant',
    chargeRole: 'ordinal-selection',
  }),
  direction: Object.freeze({
    leftRole: 'objective-boundary',
    rightRole: 'subjective-synthesis',
    flow: 'objective-to-subjective',
    braceBias: 'objective-to-subjective',
    geometry: 'brace-container',
    overload: 'containment-or-motion',
    chargeRole: 'containment-charge',
  }),
});

const OPERATOR_PREFIX_RE = /^(#>|#:|#|\.|\^|~|\?|@|\*|&|=|\$|%|!|>|<|\(|\[|\{)/;


/* ==========================================================================
   Operator detection
   ========================================================================== */

export function extractOperatorPrefix(text = '') {
  const match = normalizeText(text).match(OPERATOR_PREFIX_RE);
  return match?.[0] || '';
}

export function detectOperator(text = '') {
  const normalized = normalizeText(text);

  for (const operator of OPERATOR_DEFINITIONS) {
    if (operator.pattern.test(normalized)) return operator;
  }

  return null;
}

export function getOperatorDefinition(type = '') {
  const raw = normalizeText(type);
  const normalized = normalizeToken(raw);

  return (
    OPERATOR_BY_PREFIX[raw]
    || OPERATOR_BY_TYPE[normalized]
    || OPERATOR_BY_TYPE[OPERATOR_TYPE_ALIASES[normalized]]
    || null
  );
}

export function detectOperatorFromElement(element) {
  if (!isElement(element)) return null;

  const text = (
    element.dataset.spwSigil
    || element.querySelector?.('.frame-sigil, .frame-card-sigil, .operator-card-token')?.textContent
    || element.textContent
    || ''
  );
  const fromText = detectOperator(text);
  if (fromText) return fromText;

  const explicitType = normalizeToken(
    element.dataset.spwOperator
    || element.closest?.('[data-spw-operator]')?.dataset?.spwOperator
    || ''
  );

  if (explicitType) return getOperatorDefinition(explicitType);
  return null;
}

export function describeOperator(value = '') {
  const byType = getOperatorDefinition(value);
  if (byType) return byType;

  return detectOperator(value);
}

export function getOperatorGeometry(value = '') {
  const operator = getOperatorDefinition(value) || detectOperator(value);
  if (!operator) return null;
  return OPERATOR_GEOMETRY[operator.type] || null;
}


export {
  OPERATOR_DEFINITIONS,
  OPERATOR_BY_TYPE,
  OPERATOR_BY_PREFIX,
  OPERATOR_TYPE_ALIASES,
  OPERATOR_PREFIXES,
  OPERATOR_INTENTS,
  OPERATOR_FAMILIES,
  OPERATOR_GEOMETRY,
  OPERATOR_PREFIX_RE,
};
