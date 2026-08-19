/**
 * component-semantics.js
 * ---------------------------------------------------------------------------
 * Purpose
 * - Normalize semantic metadata on reusable page components.
 * - Derive lightweight semantic profiles that CSS and JS can use for:
 *   - higher-value interactions
 *   - intuitive configurability
 *   - enhancement routing
 *   - surface inspection
 *
 * Design stance
 * - No decorative DOM injection in production.
 * - No global mutation/resize observers here.
 * - Root-scoped operation only.
 * - Metadata should help other systems decide what to do, not force visible UI.
 * - Authored data-spw-* values are source material; inferred values are written
 *   to data-spw-*-resolved and only backfilled into base attributes when absent.
 *
 * Public API
 * - initSpwComponentSemantics(options)
 * - snapshotComponentSemantics(el, options)
 * - collectSemanticTargets(root)
 * - applySemanticSnapshot(el, snapshot, options)
 *
 * Typical use
 * - normalize route structure after HTML is present
 * - emit semantic snapshot event for other modules
 * - write data-spw-* hints that CSS and JS can read
 */

import { bus } from '/public/js/kernel/bus.js';
import {
  COMPONENT_SELECTOR,
  buildAxisGenome,
  inferTopographyKind,
  resolveCompositionTier,
  writeDatasetValue,
  writeDatasetValueIfMissing,
} from '/public/js/kernel/dom-contracts.js';
import {
  applyInteractionSemantics,
  snapshotInteractionSemantics,
} from '/public/js/semantic/component-interaction-semantics.js';
import {
  humanizeToken,
  normalizeSlug,
  normalizeText,
  normalizeToken,
  unique,
} from '/public/js/semantic/semantic-utils.js';
import {
  deriveSemanticBraceExpression,
} from '/public/js/semantic/semantic-braces.js';
import { describeRelationship } from '/public/js/semantic/component-relationships.js';
import { inferComponentRole } from '/public/js/semantic/role-inference.js';

const DEFAULT_SELECTOR = COMPONENT_SELECTOR;

const ROLE_DEFAULTS = Object.freeze({
  orientation: { substrate: 'frame', phrase: 'premise', context: 'reading' },
  routing: { substrate: 'ref', phrase: 'guide', context: 'routing' },
  reference: { substrate: 'ref', phrase: 'guide', context: 'analysis' },
  schema: { substrate: 'object', phrase: 'structure', context: 'analysis' },
  control: { substrate: 'action', phrase: 'instruction', context: 'settings' },
  surface: { substrate: 'surface', phrase: 'artifact', context: 'publishing' },
  artifact: { substrate: 'surface', phrase: 'artifact', context: 'publishing' },
  probe: { substrate: 'probe', phrase: 'inquiry', context: 'analysis' },
  lab: { substrate: 'probe', phrase: 'inquiry', context: 'analysis' },
  tool: { substrate: 'action', phrase: 'instruction', context: 'settings' },
  telemetry: { substrate: 'probe', phrase: 'inquiry', context: 'analysis' },
  status: { substrate: 'baseline', phrase: 'premise', context: 'analysis' },
  registry: { substrate: 'ref', phrase: 'register', context: 'analysis' }
});

const INTERACTION_DEFAULTS = Object.freeze({
  orientation: { emphasis: 'anchored', interactivity: 'ambient', inspectability: 'summary' },
  routing: { emphasis: 'indexed', interactivity: 'navigable', inspectability: 'summary' },
  reference: { emphasis: 'measured', interactivity: 'ambient', inspectability: 'detailed' },
  schema: { emphasis: 'structured', interactivity: 'inspectable', inspectability: 'deep' },
  control: { emphasis: 'responsive', interactivity: 'controllable', inspectability: 'detailed' },
  surface: { emphasis: 'artifact', interactivity: 'viewable', inspectability: 'summary' },
  artifact: { emphasis: 'artifact', interactivity: 'viewable', inspectability: 'summary' },
  probe: { emphasis: 'charged', interactivity: 'reactive', inspectability: 'deep' },
  lab: { emphasis: 'charged', interactivity: 'inspectable', inspectability: 'deep' },
  tool: { emphasis: 'responsive', interactivity: 'controllable', inspectability: 'detailed' },
  telemetry: { emphasis: 'measured', interactivity: 'inspectable', inspectability: 'deep' },
  status: { emphasis: 'stable', interactivity: 'ambient', inspectability: 'summary' },
  registry: { emphasis: 'indexed', interactivity: 'inspectable', inspectability: 'detailed' }
});

const STANCE_BY_LIMINALITY = Object.freeze({
  entry: 'entry',
  threshold: 'entry',
  projected: 'entry',
  approach: 'entry',
  ground: 'ground',
  anchored: 'ground',
  settled: 'ground',
  stable: 'ground',
  realized: 'ground',
  interactive: 'ground',
  exit: 'exit',
  archived: 'exit',
  departed: 'exit'
});

const SEMANTIC_REGISTRY_VERSION = '0.7';
let semanticRegistry = null;

function tokenizeFeatureList(value = '') {
  return normalizeText(value)
    .split(/[\s,]+/)
    .map(normalizeToken)
    .filter(Boolean);
}

function getHeading(el) {
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const target = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (target) return normalizeText(target.textContent || '');
  }

  return normalizeText(
    el.querySelector(
      ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > .frame-heading h1, :scope > .frame-heading h2, :scope > .frame-heading h3, :scope > .frame-topline h1, :scope > .frame-topline h2, :scope > strong, :scope > figcaption'
    )?.textContent || ''
  );
}

function getKind(el) {
  return inferTopographyKind(el, 'component');
}

function inferRole(el, kind) {
  return inferComponentRole(el, kind);
}

function inferMeaning(el, kind) {
  if (el.dataset.spwMeaning) return humanizeToken(el.dataset.spwMeaning);
  const heading = humanizeToken(getHeading(el));
  if (heading) return heading;
  return kind;
}

function inferForm(el, kind) {
  if (el.dataset.spwForm) return normalizeToken(el.dataset.spwForm);
  if (kind === 'nav') return 'route-list';
  if (kind === 'frame') return 'brace';
  if (kind === 'card') return 'tile';
  if (kind === 'hook') return 'brace';
  if (kind === 'lens') return 'lens';
  if (kind === 'surface') return 'surface';
  if (kind === 'metric') return 'metric';
  return 'block';
}

function inferContext(el, role) {
  if (el.dataset.spwContext) return normalizeToken(el.dataset.spwContext);
  if (role === 'control') return 'settings';
  if (role === 'routing') return 'routing';
  if (role === 'surface' || role === 'artifact') return 'publishing';
  return 'analysis';
}

function inferSemanticBrace(el) {
  return deriveSemanticBraceExpression(el);
}

function inferSubstrate(el, role) {
  if (el.dataset.spwSubstrate) return normalizeToken(el.dataset.spwSubstrate);
  return (ROLE_DEFAULTS[role] || ROLE_DEFAULTS.reference).substrate;
}

function inferPhrase(el, role) {
  if (el.dataset.spwPhrase) return normalizeToken(el.dataset.spwPhrase);
  return (ROLE_DEFAULTS[role] || ROLE_DEFAULTS.reference).phrase;
}

function inferFeatures(el, kind, role, context) {
  const raw = tokenizeFeatureList(el.dataset.spwFeatures || '');
  const implied = [];

  if (kind === 'frame') implied.push('framed');
  if (kind === 'card') implied.push('modular');
  if (role === 'routing') implied.push('navigable');
  if (role === 'control') implied.push('configurable');
  if (role === 'schema') implied.push('inspectable');
  if (role === 'registry') implied.push('collectible');
  if (context === 'settings') implied.push('local-state');

  return unique([...raw, ...implied]);
}

function inferImportance(el, kind, role) {
  if (el.dataset.spwImportance) return normalizeToken(el.dataset.spwImportance);

  if (el.classList.contains('site-hero')) return 'primary';
  if (kind === 'hook') return 'high';
  if (kind === 'main') return 'primary';
  if (role === 'control' || role === 'routing') return 'high';
  if (role === 'schema' || role === 'registry') return 'high';
  if (kind === 'card' || kind === 'panel') return 'medium';
  return 'low';
}

function inferDensity(el, kind, role, features) {
  if (el.dataset.spwDensity) return normalizeToken(el.dataset.spwDensity);

  const featureSet = new Set(features);

  if (featureSet.has('configurable') || role === 'control') return 'dense';
  if (featureSet.has('inspectable') || role === 'schema') return 'dense';
  if (kind === 'card') return 'compact';
  return 'reading';
}

function inferInteractivity(el, role, features) {
  if (el.dataset.spwInteractivity) return normalizeToken(el.dataset.spwInteractivity);

  const featureSet = new Set(features);
  if (featureSet.has('configurable')) return 'controllable';
  if (featureSet.has('navigable')) return 'navigable';
  if (featureSet.has('inspectable')) return 'inspectable';

  return (INTERACTION_DEFAULTS[role] || INTERACTION_DEFAULTS.reference).interactivity;
}

function inferInspectability(el, role) {
  if (el.dataset.spwInspectability) return normalizeToken(el.dataset.spwInspectability);
  return (INTERACTION_DEFAULTS[role] || INTERACTION_DEFAULTS.reference).inspectability;
}

function inferEmphasis(el, role) {
  if (el.dataset.spwEmphasis) return normalizeToken(el.dataset.spwEmphasis);
  return (INTERACTION_DEFAULTS[role] || INTERACTION_DEFAULTS.reference).emphasis;
}

function inferConfigDomain(el, context, features) {
  if (el.dataset.spwConfigDomain) return normalizeToken(el.dataset.spwConfigDomain);

  const featureSet = new Set(features);
  if (context === 'settings' || featureSet.has('local-state')) return 'site-settings';
  if (featureSet.has('collectible')) return 'registry';
  if (featureSet.has('inspectable')) return 'semantic-inspection';
  return 'none';
}

function inferConfigKeys(el) {
  if (el.dataset.spwConfigKeys) {
    return unique(tokenizeFeatureList(el.dataset.spwConfigKeys));
  }

  const inspectFields = tokenizeFeatureList(el.dataset.spwInspectFields || '');
  const formOptions = tokenizeFeatureList(el.dataset.spwFormOptions || '');
  const keys = unique([...inspectFields, ...formOptions]);

  return keys;
}

function inferInstrumentation(el) {
  const items = [];

  if (el.dataset.spwInstrumentation) {
    items.push(...tokenizeFeatureList(el.dataset.spwInstrumentation));
  }

  if (el.dataset.spwInspect) items.push('state-inspector');
  if (el.dataset.spwPromptHost != null || el.dataset.spwPromptability === 'visible') items.push('prompt-surface');
  if (el.dataset.spwImageManaged === 'true') items.push('image-metaphysics');
  if (el.dataset.spwGenerated) items.push(`generated-${normalizeToken(el.dataset.spwGenerated)}`);
  if (el.querySelector?.(':scope > .spw-semantic-seam[data-spw-generated="semantic-chrome"]')) items.push('semantic-chrome');
  if (el.querySelector?.(':scope > .frame-prompt-copy[data-spw-instrumentation]')) items.push('prompt-copy');

  return unique(items);
}

function inferDebugSource(el, instrumentation) {
  if (el.dataset.spwDebugSource) return normalizeToken(el.dataset.spwDebugSource);
  if (instrumentation.includes('state-inspector')) return 'spw-state-inspector';
  if (instrumentation.includes('prompt-surface') || instrumentation.includes('prompt-copy')) return 'spw-prompt-utils';
  if (instrumentation.includes('semantic-chrome')) return 'spw-semantic-chrome';
  if (instrumentation.includes('image-metaphysics')) return 'spw-image-metaphysics';
  return '';
}

function inferInspectTarget(el) {
  return normalizeToken(el.dataset.spwInspect || el.id || '');
}

function inferTextVariant(el, snapshotBase = {}) {
  if (el.dataset.spwTextVariant) return normalizeToken(el.dataset.spwTextVariant);

  const text = (el.textContent || '').trim();
  const charCount = text.length;
  const kind = snapshotBase.kind || '';
  const climate = document.body?.dataset?.spwClimate || document.documentElement?.dataset?.spwClimate || '';

  if (climate === 'ludic' || el.dataset.spwClimate === 'ludic') return 'ludic';

  if (kind === 'card' || kind === 'panel') {
    if (charCount > 0 && charCount <= 120) return 'punchy';
    if (charCount >= 280) return 'editorial';
    if (snapshotBase.role === 'schema' || snapshotBase.role === 'registry' || el.querySelector('code, pre, .spec-strip')) return 'matrix';
  }

  return '';
}

function inferComponentId(el, snapshotBase = {}) {
  if (el.dataset.spwComponentId) return normalizeSlug(el.dataset.spwComponentId);
  if (el.id) return normalizeSlug(el.id);

  const primary = normalizeSlug(snapshotBase.primaryLabel || snapshotBase.primaryExpression || '');
  const meaning = normalizeSlug(snapshotBase.meaning || '');
  const role = normalizeSlug(snapshotBase.role || '');
  const kind = normalizeSlug(snapshotBase.kind || '');
  const label = primary || meaning || role || kind || 'component';
  const peers = Array.from(document.querySelectorAll(DEFAULT_SELECTOR));
  const index = Math.max(0, peers.indexOf(el)) + 1;

  return `${label}-${String(index).padStart(2, '0')}`;
}

function inferComponentName(el, snapshotBase = {}) {
  return normalizeText(
    el.dataset.spwComponentName
    || snapshotBase.primaryLabel
    || snapshotBase.meaning
    || getHeading(el)
    || snapshotBase.kind
    || 'component'
  );
}

function inferSemanticOwner(snapshotBase = {}) {
  if (snapshotBase.debugSource) return snapshotBase.debugSource;
  if (snapshotBase.configDomain && snapshotBase.configDomain !== 'none') return snapshotBase.configDomain;
  if (snapshotBase.instrumentation?.length) return snapshotBase.instrumentation[0];
  return 'spw-component-semantics';
}

function getComponentAddress(snapshotBase = {}) {
  const parts = [
    snapshotBase.kind,
    snapshotBase.role,
    snapshotBase.context,
    snapshotBase.valueLayer
  ].filter(Boolean);

  return parts.join('/');
}

function buildComponentGenome(snapshotBase = {}) {
  return buildAxisGenome(
    [
      ['kind', snapshotBase.kind],
      ['role', snapshotBase.role],
      ['form', snapshotBase.form],
      ['substrate', snapshotBase.substrate],
      ['context', snapshotBase.context],
      ['importance', snapshotBase.importance],
      ['density', snapshotBase.density],
      ['emphasis', snapshotBase.emphasis],
      ['interactivity', snapshotBase.interactivity],
      ['inspectability', snapshotBase.inspectability],
      ['value', snapshotBase.valueLayer],
      ['stance', snapshotBase.stance],
      ['stability', snapshotBase.resolvedCompositionStability || snapshotBase.compositionStability],
      ['occupancy', snapshotBase.packOccupancy],
      ['route', snapshotBase.routeState],
      ['operator', snapshotBase.primaryOperator]
    ],
    [
      ['slot', snapshotBase.slots],
      ['affordance', snapshotBase.affordances]
    ]
  );
}

function inferSlots(el) {
  const slots = [];
  if (el.dataset.spwSlot) slots.push(normalizeToken(el.dataset.spwSlot));
  el.querySelectorAll?.(':scope > [data-spw-slot]').forEach((child) => {
    slots.push(normalizeToken(child.dataset.spwSlot));
  });
  return unique(slots);
}

function inferAffordances(el, role, features) {
  const affordances = [];
  const featureSet = new Set(features);

  if (role === 'routing') affordances.push('anchor-jump');
  if (role === 'control') affordances.push('state-toggle');
  if (role === 'schema') affordances.push('inspect-reveal');
  if (role === 'registry') affordances.push('collect-recall');
  if (featureSet.has('configurable')) affordances.push('configure');
  if (featureSet.has('inspectable')) affordances.push('inspect');
  if (el.querySelector('[data-preset]')) affordances.push('preset-apply');
  if (el.querySelector('[data-site-settings-form], [data-site-settings-scope]')) affordances.push('settings-bind');
  if (el.querySelector('.operator-chip, a[href^="#"]')) affordances.push('navigate');

  return unique(affordances);
}

function inferValueLayer(role, context) {
  if (context === 'settings') return 'state';
  if (role === 'schema') return 'structure';
  if (role === 'routing') return 'path';
  if (role === 'registry') return 'memory';
  return 'surface';
}

function inferStance(el, importance, interactivity) {
  if (el.dataset.spwStance) return normalizeToken(el.dataset.spwStance);

  const liminality = normalizeToken(el.dataset.spwLiminality || '');
  if (liminality && STANCE_BY_LIMINALITY[liminality]) {
    return STANCE_BY_LIMINALITY[liminality];
  }

  if (importance === 'primary' || interactivity === 'controllable') return 'entry';
  return 'ground';
}

function inferResolvedCompositionStability(el, snapshotBase = {}) {
  const hasTopDownAnchor = Boolean(
    snapshotBase.kind
    && snapshotBase.role
    && snapshotBase.context
    && snapshotBase.meaning
  );
  const hasBottomUpAnchor = Boolean(
    el.dataset.spwFeature
    || snapshotBase.slots?.length
    || snapshotBase.affordances?.length
  );
  const hasTraversalAnchor = snapshotBase.routeState && snapshotBase.routeState !== 'none';

  if (snapshotBase.kind === 'hook') return 'volatile';
  if (hasTopDownAnchor && hasBottomUpAnchor && hasTraversalAnchor) return 'anchored';
  if (hasTopDownAnchor && hasBottomUpAnchor) return 'stable';
  if (hasTopDownAnchor) return 'implicit';
  return 'loose';
}

function inferPackOccupancy(el, snapshotBase = {}) {
  if (el.dataset.spwPackOccupancy) return normalizeToken(el.dataset.spwPackOccupancy);

  const slotNodes = Array.from(el.querySelectorAll?.(':scope > [data-spw-slot]') || []);
  const slotCount = slotNodes.length || snapshotBase.slots?.length || 0;
  const filledCount = slotNodes.filter((node) => (
    normalizeText(node.textContent || '') || node.querySelector?.(':scope > *')
  )).length;
  const ratio = slotCount ? filledCount / slotCount : 0;

  if (snapshotBase.kind === 'hook') return 'balanced';
  if (!slotCount) return snapshotBase.kind === 'card' || snapshotBase.kind === 'panel' ? 'compact' : 'sparse';
  if (ratio <= 0.34) return 'sparse';
  if (ratio <= 0.8) return 'balanced';
  return 'full';
}

function setIfMissing(el, key, value) {
  writeDatasetValueIfMissing(el, toResolvedDatasetKey(key), value);
  writeDatasetValueIfMissing(el, key, value);
}

function setOrReplace(el, key, value) {
  writeDatasetValue(el, toResolvedDatasetKey(key), value);
  writeDatasetValueIfMissing(el, key, value);
}

function toResolvedDatasetKey(key = '') {
  return key.endsWith('Resolved') ? key : `${key}Resolved`;
}

function inferFunctionalContract(el, snapshotBase = {}) {
  const semantic = snapshotBase.semanticBrace || inferSemanticBrace(el);
  const label = normalizeText(
    el.dataset.spwReadingCue
    || el.getAttribute('aria-label')
    || el.querySelector?.(':scope > header h1, :scope > header h2, :scope > h1, :scope > h2, :scope > h3')?.textContent
    || snapshotBase.primaryLabel
    || snapshotBase.meaning
    || ''
  );
  const input = normalizeText(
    el.dataset.spwInput
    || semantic?.rootLabel
    || snapshotBase.meaning
    || snapshotBase.role
    || ''
  );
  const operation = normalizeText(
    el.dataset.spwOperation
    || semantic?.behaviorLabel
    || snapshotBase.interactivity
    || snapshotBase.phrase
    || ''
  );
  const output = normalizeText(
    el.dataset.spwReturn
    || el.dataset.spwConsequence
    || semantic?.variantLabel
    || snapshotBase.valueLayer
    || ''
  );
  const tone = normalizeText(
    el.dataset.spwTone
    || el.dataset.spwContext
    || snapshotBase.context
    || ''
  );

  const signature = [
    input || snapshotBase.kind || 'component',
    operation ? `{${operation}}` : '',
    output ? `-> ${output}` : '',
  ].filter(Boolean).join(' ');

  return {
    readingCue: label,
    input,
    operation,
    returnValue: output,
    tone,
    signature,
  };
}

function snapshotComponentSemantics(el, options = {}) {
  const kind = getKind(el);
  const role = inferRole(el, kind);
  const meaning = inferMeaning(el, kind);
  const form = inferForm(el, kind);
  const context = inferContext(el, role);
  const semanticBrace = inferSemanticBrace(el);
  const substrate = inferSubstrate(el, role);
  const phrase = inferPhrase(el, role);
  const features = inferFeatures(el, kind, role, context);
  const importance = inferImportance(el, kind, role);
  const density = inferDensity(el, kind, role, features);
  const interactivity = inferInteractivity(el, role, features);
  const inspectability = inferInspectability(el, role);
  const emphasis = inferEmphasis(el, role);
  const configDomain = inferConfigDomain(el, context, features);
  const configKeys = inferConfigKeys(el);
  const instrumentation = inferInstrumentation(el);
  const debugSource = inferDebugSource(el, instrumentation);
  const inspectTarget = inferInspectTarget(el);
  const slots = inferSlots(el);
  const affordances = inferAffordances(el, role, features);
  const valueLayer = inferValueLayer(role, context);
  const stance = inferStance(el, importance, interactivity);
  const relationship = describeRelationship(el);
  const resolvedCompositionStability = inferResolvedCompositionStability(el, {
    kind,
    role,
    meaning,
    context,
    slots,
    affordances,
    routeState: relationship.routeState
  });
  const compositionStability = el.dataset.spwCompositionStability
    ? normalizeToken(el.dataset.spwCompositionStability)
    : resolvedCompositionStability;
  const compositionStabilitySource = el.dataset.spwCompositionStability ? 'authored' : '';
  const packOccupancy = inferPackOccupancy(el, { kind, slots, affordances });
  const compositionTier = resolveCompositionTier(el);
  const contract = inferFunctionalContract(el, {
    kind,
    role,
    meaning,
    phrase,
    context,
    interactivity,
    valueLayer,
    primaryLabel: relationship.primaryLabel,
    semanticBrace
  });
  const componentBase = {
    kind,
    role,
    meaning,
    context,
    valueLayer,
    configDomain,
    instrumentation,
    debugSource,
    primaryExpression: relationship.primaryExpression,
    primaryLabel: relationship.primaryLabel,
    signature: contract.signature,
    semanticBrace
  };
  const componentId = inferComponentId(el, componentBase);
  const componentName = inferComponentName(el, componentBase);
  const semanticOwner = inferSemanticOwner(componentBase);
  const componentAddress = getComponentAddress(componentBase);
  const structuralGenome = buildComponentGenome({
    kind,
    role,
    form,
    substrate,
    context,
    importance,
    density,
    emphasis,
    interactivity,
    inspectability,
    valueLayer,
    stance,
    compositionStability,
    resolvedCompositionStability,
    packOccupancy,
    routeState: relationship.routeState,
    primaryOperator: relationship.primaryOperator,
    slots,
    affordances
  });
  const interaction = snapshotInteractionSemantics(el, {
    kind,
    role,
    context,
    importance,
    density,
    emphasis,
    interactivity,
    inspectability,
    stance,
    compositionTier,
    primaryLabel: relationship.primaryLabel,
  });
  const mergedAffordances = unique([...affordances, ...interaction.interactionAffordances]);
  const componentGenome = unique([
    ...structuralGenome.split(/\s+/).filter(Boolean),
    ...interaction.interactionGenome.split(/\s+/).filter(Boolean),
  ]).join(' ');

  return {
    componentId,
    componentName,
    componentAddress,
    componentGenome,
    semanticOwner,
    kind,
    role,
    meaning,
    form,
    substrate,
    phrase,
    context,
    importance,
    density,
    emphasis,
    interactivity,
    inspectability,
    configDomain,
    configKeys,
    instrumentation,
    debugSource,
    inspectTarget,
    slots,
    affordances: mergedAffordances,
    features,
    valueLayer,
    stance,
    compositionStability,
    compositionStabilitySource,
    resolvedCompositionStability,
    packOccupancy,
    compositionTier,
    routeState: relationship.routeState,
    branchCount: relationship.branchCount,
    primaryOperator: relationship.primaryOperator,
    primaryPrefix: relationship.primaryPrefix,
    primaryExpression: relationship.primaryExpression,
    primaryLabel: relationship.primaryLabel,
    routeMarker: relationship.routeMarker,
    readingCue: contract.readingCue,
    input: contract.input,
    operation: contract.operation,
    returnValue: contract.returnValue,
    tone: contract.tone,
    signature: contract.signature,
    semanticBrace,
    gestureContract: interaction.gestureContract,
    interactionContract: interaction.interactionContract,
    lifecycleBeat: interaction.lifecycleBeat,
    interactionPhaseAffinity: interaction.interactionPhaseAffinity,
    physicsProfile: interaction.physicsProfile,
    physicsMass: interaction.physicsMass,
    physicsDamping: interaction.physicsDamping,
    physicsStiffness: interaction.physicsStiffness,
    copyDepth: interaction.copyDepth,
    paletteDepth: interaction.paletteDepth,
    themingPosture: interaction.themingPosture,
    interactionGenome: interaction.interactionGenome,
    textVariant: inferTextVariant(el, componentBase),
    semanticTagged: 'true',
    semanticVersion: options.semanticVersion || SEMANTIC_REGISTRY_VERSION
  };
}

function applySemanticSnapshot(el, snapshot, options = {}) {
  const { overwrite = true } = options;
  const writer = overwrite ? setOrReplace : setIfMissing;

  writer(el, 'spwKind', snapshot.kind);
  writer(el, 'spwRole', snapshot.role);
  writer(el, 'spwMeaning', snapshot.meaning);
  writer(el, 'spwForm', snapshot.form);
  writer(el, 'spwSubstrate', snapshot.substrate);
  writer(el, 'spwPhrase', snapshot.phrase);
  writer(el, 'spwContext', snapshot.context);

  writer(el, 'spwImportance', snapshot.importance);
  writer(el, 'spwDensity', snapshot.density);
  writer(el, 'spwEmphasis', snapshot.emphasis);
  writer(el, 'spwInteractivity', snapshot.interactivity);
  writer(el, 'spwInspectability', snapshot.inspectability);
  writer(el, 'spwConfigDomain', snapshot.configDomain);
  writer(el, 'spwValueLayer', snapshot.valueLayer);
  writer(el, 'spwStance', snapshot.stance);
  if (snapshot.textVariant) writer(el, 'spwTextVariant', snapshot.textVariant);
  if (snapshot.compositionStabilitySource === 'authored') {
    writeDatasetValueIfMissing(el, 'spwCompositionStability', snapshot.compositionStability);
    writeDatasetValueIfMissing(el, 'spwCompositionStabilitySource', 'authored');
  }
  writeDatasetValue(el, 'spwResolvedCompositionStability', snapshot.resolvedCompositionStability);
  writeDatasetValue(el, 'spwResolvedCompositionStabilitySource', 'component-semantics');
  writeDatasetValue(el, 'spwPackOccupancy', snapshot.packOccupancy);
  if (snapshot.compositionTier && snapshot.compositionTier !== 'unknown') {
    writer(el, 'spwCompositionTier', snapshot.compositionTier);
  }
  writer(el, 'spwSemanticTagged', snapshot.semanticTagged);
  writer(el, 'spwSemanticVersion', snapshot.semanticVersion);
  writer(el, 'spwComponentId', snapshot.componentId);
  writer(el, 'spwComponentName', snapshot.componentName);
  writer(el, 'spwComponentKind', snapshot.kind);
  writer(el, 'spwComponentAddress', snapshot.componentAddress);
  writer(el, 'spwComponentGenome', snapshot.componentGenome);
  writer(el, 'spwSemanticOwner', snapshot.semanticOwner);
  writer(el, 'spwRouteState', snapshot.routeState);
  writer(el, 'spwBranchCount', snapshot.branchCount);
  if (snapshot.instrumentation.length) writer(el, 'spwInstrumentation', snapshot.instrumentation.join(' '));
  if (snapshot.debugSource) writer(el, 'spwDebugSource', snapshot.debugSource);
  if (snapshot.primaryOperator) writer(el, 'spwPrimaryOperator', snapshot.primaryOperator);
  if (snapshot.primaryPrefix) writer(el, 'spwPrimaryPrefix', snapshot.primaryPrefix);
  if (snapshot.primaryExpression) writer(el, 'spwPrimaryExpression', snapshot.primaryExpression);
  if (snapshot.primaryLabel) writer(el, 'spwPrimaryLabel', snapshot.primaryLabel);
  if (snapshot.routeMarker) writer(el, 'spwRouteMarker', snapshot.routeMarker);
  if (snapshot.readingCue) writer(el, 'spwReadingCue', snapshot.readingCue);
  if (snapshot.input) writer(el, 'spwInput', snapshot.input);
  if (snapshot.operation) writer(el, 'spwOperation', snapshot.operation);
  if (snapshot.returnValue) writer(el, 'spwReturn', snapshot.returnValue);
  if (snapshot.tone) writer(el, 'spwTone', snapshot.tone);
  if (snapshot.signature) writer(el, 'spwSignature', snapshot.signature);
  if (snapshot.semanticBrace?.expression) writer(el, 'spwSemanticExpression', snapshot.semanticBrace.expression);
  if (snapshot.semanticBrace?.key) writer(el, 'spwSemanticKey', snapshot.semanticBrace.key);
  if (snapshot.semanticBrace?.family) writer(el, 'spwSemanticFamily', snapshot.semanticBrace.family);
  if (snapshot.semanticBrace?.root) writer(el, 'spwSemanticRoot', snapshot.semanticBrace.root);
  if (snapshot.semanticBrace?.rootLabel) writer(el, 'spwSemanticRootLabel', snapshot.semanticBrace.rootLabel);
  if (snapshot.semanticBrace?.variant) writer(el, 'spwSemanticVariant', snapshot.semanticBrace.variant);
  if (snapshot.semanticBrace?.variantLabel) writer(el, 'spwSemanticVariantLabel', snapshot.semanticBrace.variantLabel);
  if (snapshot.semanticBrace?.behavior) writer(el, 'spwSemanticBehavior', snapshot.semanticBrace.behavior);
  if (snapshot.semanticBrace?.behaviorLabel) writer(el, 'spwSemanticBehaviorLabel', snapshot.semanticBrace.behaviorLabel);
  if (snapshot.semanticBrace?.lens) writer(el, 'spwSemanticLens', snapshot.semanticBrace.lens);
  if (snapshot.semanticBrace?.lensLabel) writer(el, 'spwSemanticLensLabel', snapshot.semanticBrace.lensLabel);

  if (snapshot.configKeys.length) writer(el, 'spwConfigKeys', snapshot.configKeys.join(' '));
  if (snapshot.inspectTarget) writer(el, 'spwInspect', snapshot.inspectTarget);
  if (snapshot.slots.length) writer(el, 'spwSemanticSlots', snapshot.slots.join(' '));
  if (snapshot.affordances.length) writer(el, 'spwAffordances', snapshot.affordances.join(' '));
  if (snapshot.features.length) writer(el, 'spwFeatures', snapshot.features.join(' '));

  applyInteractionSemantics(el, snapshot, { overwrite });
}

function collectSemanticTargets(root, selector = DEFAULT_SELECTOR) {
  const targets = new Set();
  // Route/root hosts own page-level state; component semantics must not backfill them.
  const shouldSkip = (el) => (
    el === document.documentElement
    || el === document.body
  );

  if (root instanceof Element && root.matches(selector) && !shouldSkip(root)) {
    targets.add(root);
  }

  root.querySelectorAll?.(selector).forEach((el) => {
    if (shouldSkip(el)) return;
    targets.add(el);
  });

  return [...targets];
}

function summarizeSemanticField(snapshots) {
  const summary = {
    roles: new Set(),
    contexts: new Set(),
    configDomains: new Set(),
    affordances: new Set(),
    interactivity: new Set(),
    instrumentation: new Set(),
    owners: new Set(),
    valueLayers: new Set(),
    compositionStability: new Set(),
    resolvedCompositionStability: new Set(),
    packOccupancy: new Set(),
    lifecycleBeats: new Set(),
    physicsProfiles: new Set(),
    themingPostures: new Set(),
    interactionPhaseAffinities: new Set()
  };

  snapshots.forEach(({ snapshot }) => {
    summary.roles.add(snapshot.role);
    summary.contexts.add(snapshot.context);
    summary.configDomains.add(snapshot.configDomain);
    summary.interactivity.add(snapshot.interactivity);
    summary.owners.add(snapshot.semanticOwner);
    summary.valueLayers.add(snapshot.valueLayer);
    summary.compositionStability.add(snapshot.compositionStability);
    summary.resolvedCompositionStability.add(snapshot.resolvedCompositionStability);
    summary.packOccupancy.add(snapshot.packOccupancy);
    summary.lifecycleBeats.add(snapshot.lifecycleBeat);
    summary.physicsProfiles.add(snapshot.physicsProfile);
    summary.themingPostures.add(snapshot.themingPosture);
    summary.interactionPhaseAffinities.add(snapshot.interactionPhaseAffinity);
    snapshot.affordances.forEach((value) => summary.affordances.add(value));
    snapshot.instrumentation.forEach((value) => summary.instrumentation.add(value));
  });

  const countBy = (key) => snapshots.reduce((counts, { snapshot }) => {
    const value = snapshot[key] || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});

  return {
    roles: [...summary.roles],
    contexts: [...summary.contexts],
    configDomains: [...summary.configDomains],
    affordances: [...summary.affordances],
    interactivity: [...summary.interactivity],
    instrumentation: [...summary.instrumentation],
    owners: [...summary.owners],
    valueLayers: [...summary.valueLayers],
    compositionStability: [...summary.compositionStability],
    resolvedCompositionStability: [...summary.resolvedCompositionStability],
    packOccupancy: [...summary.packOccupancy],
    lifecycleBeats: [...summary.lifecycleBeats],
    physicsProfiles: [...summary.physicsProfiles],
    themingPostures: [...summary.themingPostures],
    interactionPhaseAffinities: [...summary.interactionPhaseAffinities],
    counts: {
      roles: countBy('role'),
      kinds: countBy('kind'),
      owners: countBy('semanticOwner'),
      valueLayers: countBy('valueLayer'),
      compositionStability: countBy('compositionStability'),
      resolvedCompositionStability: countBy('resolvedCompositionStability'),
      packOccupancy: countBy('packOccupancy')
    }
  };
}

function makePublicSnapshot(element, snapshot) {
  return {
    id: element.id || null,
    componentId: snapshot.componentId,
    componentName: snapshot.componentName,
    componentAddress: snapshot.componentAddress,
    componentGenome: snapshot.componentGenome,
    semanticOwner: snapshot.semanticOwner,
    kind: snapshot.kind,
    role: snapshot.role,
    meaning: snapshot.meaning,
    form: snapshot.form,
    substrate: snapshot.substrate,
    phrase: snapshot.phrase,
    context: snapshot.context,
    importance: snapshot.importance,
    density: snapshot.density,
    emphasis: snapshot.emphasis,
    interactivity: snapshot.interactivity,
    inspectability: snapshot.inspectability,
    configDomain: snapshot.configDomain,
    configKeys: snapshot.configKeys,
    instrumentation: snapshot.instrumentation,
    debugSource: snapshot.debugSource,
    inspectTarget: snapshot.inspectTarget,
    slots: snapshot.slots,
    affordances: snapshot.affordances,
    features: snapshot.features,
    valueLayer: snapshot.valueLayer,
    stance: snapshot.stance,
    compositionStability: snapshot.compositionStability,
    compositionStabilitySource: snapshot.compositionStabilitySource,
    resolvedCompositionStability: snapshot.resolvedCompositionStability,
    packOccupancy: snapshot.packOccupancy,
    routeState: snapshot.routeState,
    branchCount: snapshot.branchCount,
    primaryOperator: snapshot.primaryOperator,
    primaryExpression: snapshot.primaryExpression,
    primaryLabel: snapshot.primaryLabel,
    routeMarker: snapshot.routeMarker,
    readingCue: snapshot.readingCue,
    input: snapshot.input,
    operation: snapshot.operation,
    returnValue: snapshot.returnValue,
    tone: snapshot.tone,
    signature: snapshot.signature,
    semanticBrace: snapshot.semanticBrace,
    gestureContract: snapshot.gestureContract,
    interactionContract: snapshot.interactionContract,
    lifecycleBeat: snapshot.lifecycleBeat,
    interactionPhaseAffinity: snapshot.interactionPhaseAffinity,
    physicsProfile: snapshot.physicsProfile,
    copyDepth: snapshot.copyDepth,
    paletteDepth: snapshot.paletteDepth,
    themingPosture: snapshot.themingPosture,
    semanticVersion: snapshot.semanticVersion
  };
}

function createSemanticRegistry({ root, field, snapshots }) {
  const records = snapshots.map(({ element, snapshot }) => ({
    element,
    snapshot,
    public: makePublicSnapshot(element, snapshot)
  }));
  const byComponentId = new Map(records.map((record) => [record.snapshot.componentId, record]));

  return {
    version: SEMANTIC_REGISTRY_VERSION,
    root,
    count: records.length,
    field,
    records,
    list(filter = {}) {
      return records
        .filter((record) => {
          if (filter.role && record.snapshot.role !== filter.role) return false;
          if (filter.kind && record.snapshot.kind !== filter.kind) return false;
          if (filter.owner && record.snapshot.semanticOwner !== filter.owner) return false;
          if (filter.valueLayer && record.snapshot.valueLayer !== filter.valueLayer) return false;
          if (filter.compositionStability && record.snapshot.compositionStability !== filter.compositionStability) return false;
          if (filter.resolvedCompositionStability && record.snapshot.resolvedCompositionStability !== filter.resolvedCompositionStability) return false;
          if (filter.lifecycleBeat && record.snapshot.lifecycleBeat !== filter.lifecycleBeat) return false;
          if (filter.physicsProfile && record.snapshot.physicsProfile !== filter.physicsProfile) return false;
          if (filter.themingPosture && record.snapshot.themingPosture !== filter.themingPosture) return false;
          if (filter.interactionPhaseAffinity && record.snapshot.interactionPhaseAffinity !== filter.interactionPhaseAffinity) return false;
          if (filter.instrumentation && !record.snapshot.instrumentation.includes(filter.instrumentation)) return false;
          return true;
        })
        .map((record) => record.public);
    },
    get(componentId) {
      return byComponentId.get(normalizeSlug(componentId))?.public || null;
    },
    element(componentId) {
      return byComponentId.get(normalizeSlug(componentId))?.element || null;
    },
    summary() {
      return {
        version: this.version,
        count: this.count,
        field: this.field
      };
    },
    toJSON() {
      return {
        version: this.version,
        count: this.count,
        field: this.field,
        components: this.list()
      };
    }
  };
}

function installSemanticRegistry(registry) {
  semanticRegistry = registry;

  if (typeof window === 'undefined') return registry;

  const siteApi = window.__SPW_SITE__ || {};
  const inspect = siteApi.inspect || {};
  const semanticsApi = {
    registry: () => semanticRegistry,
    summary: () => semanticRegistry?.summary() || null,
    list: (filter = {}) => semanticRegistry?.list(filter) || [],
    get: (componentId) => semanticRegistry?.get(componentId) || null,
    element: (componentId) => semanticRegistry?.element(componentId) || null,
    json: () => semanticRegistry?.toJSON() || null
  };

  window.__SPW_SITE__ = {
    ...siteApi,
    inspect: {
      ...inspect,
      semantics: semanticsApi,
      components: semanticsApi.list
    }
  };

  return registry;
}

function getSemanticRegistry() {
  return semanticRegistry;
}

export function initSpwComponentSemantics(options = {}) {
  const {
    root = document,
    selector = DEFAULT_SELECTOR,
    emit = true,
    overwrite = true,
    semanticVersion = SEMANTIC_REGISTRY_VERSION
  } = options;

  const targets = collectSemanticTargets(root, selector);
  const snapshots = [];

  for (const el of targets) {
    const snapshot = snapshotComponentSemantics(el, { semanticVersion });
    applySemanticSnapshot(el, snapshot, { overwrite });
    snapshots.push({ element: el, snapshot });
  }

  if (emit) {
    const field = summarizeSemanticField(snapshots);
    const registry = createSemanticRegistry({ root, field, snapshots });
    installSemanticRegistry(registry);

    const detail = {
      root,
      count: snapshots.length,
      field,
      registryVersion: registry.version,
      snapshots: snapshots.map(({ element, snapshot }) => makePublicSnapshot(element, snapshot))
    };

    bus.emit?.('semantic-snapshot', detail);
    document.dispatchEvent(new CustomEvent('spw:component-semantics-ready', { detail }));
  }

  return {
    cleanup() {},
    refresh(nextOptions = {}) {
      return initSpwComponentSemantics({
        root: nextOptions.root || root,
        selector: nextOptions.selector || selector,
        emit,
        overwrite,
        semanticVersion
      });
    },
    getSnapshots() {
      return snapshots.slice();
    },
    getRegistry() {
      return semanticRegistry;
    }
  };
}

export function unmountComponentSemantics() {}

export {
  applySemanticSnapshot,
  collectSemanticTargets,
  getSemanticRegistry,
  snapshotComponentSemantics,
  unmountComponentSemantics as unmount
};
