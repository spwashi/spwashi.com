/**
 * Catalog normalization + optimization summaries.
 *
 * Keeps schedule fields (when / timingArc / timingChunk) as source of truth
 * and attaches costClass so agents can budget without re-deriving from prose.
 */

import {
  COST_CLASS,
  COST_CLASS_VALUES,
  MODULE_LAYERS,
  MOUNT_WHEN,
} from './module-catalog-constants.js';

const COST_CLASS_SET = new Set(COST_CLASS_VALUES);

const BROAD_SELECTOR_RE = /^(html|body)$/i;
const PAINT_SCOPE_RE = /ornament|css-vars|paint|composite|flourish|express|backdrop|media-query/;
const MEMORY_SCOPE_RE = /observer|document-wide|document-scroll|resize|performance-observer|queryall|measure|metacognition|inspect/;
const INTERFERENCE_SCOPE_RE = /pack-local|layout-correction|dual|mirror/;
const MODULE_CATALOG_URL_PATH = '/public/js/runtime/module-catalog.js';

function asToken(value) {
  return String(value || '').trim().toLowerCase();
}

export function resolveModuleCatalogSpecifier(specifier = '', origin = '') {
  const normalized = String(specifier || '').trim();
  if (!normalized || (!normalized.startsWith('./') && !normalized.startsWith('../'))) return '';
  try {
    return new URL(normalized, new URL(MODULE_CATALOG_URL_PATH, origin)).href;
  } catch {
    return '';
  }
}

/**
 * Infer a primary cost class when a def omits costClass.
 * Explicit costClass on the def always wins (see normalizeCatalogDefinition).
 */
export function inferModuleCostClass(def = {}) {
  const when = asToken(def.when);
  const layer = asToken(def.layer);
  const scope = asToken(def.effectScope);
  const arc = asToken(def.timingArc);
  const id = asToken(def.id);
  const selector = String(def.selector || '').trim();
  const hasFeatures = Array.isArray(def.features) ? def.features.length > 0 : Boolean(def.features);
  const hasRoute = Boolean(def.route);
  const debugOnly = Boolean(def.debugOnly);

  if (def.costClass && COST_CLASS_SET.has(asToken(def.costClass))) {
    return asToken(def.costClass);
  }

  if (INTERFERENCE_SCOPE_RE.test(scope) || /layout-assumptions|spatial-gravity/.test(id)) {
    return COST_CLASS.INTERFERENCE;
  }

  if (PAINT_SCOPE_RE.test(scope) || /canvas-accents|module-effects|pulse-beat/.test(id)) {
    if (when === MOUNT_WHEN.IMMEDIATE && layer === MODULE_LAYERS.ENHANCEMENT && !hasFeatures) {
      return COST_CLASS.PAINT_COMPOSITE;
    }
  }

  if (
    MEMORY_SCOPE_RE.test(scope)
    || /composition-box|state-inspector|layout-shift|component-semantics|semantic-crossrefs|content-tone/.test(id)
    || /metacognition|inspection|diagnostics|layout/.test(arc)
  ) {
    if (when === MOUNT_WHEN.IMMEDIATE || when === MOUNT_WHEN.SETTLED) {
      return COST_CLASS.WORKING_MEMORY_PRESSURE;
    }
  }

  // Demand-coupled postures: late schedule or explicit gates.
  if (
    when === MOUNT_WHEN.VISIBLE
    || when === MOUNT_WHEN.IDLE
    || when === MOUNT_WHEN.INTERACTION
    || when === MOUNT_WHEN.REGION
  ) {
    return COST_CLASS.DEMAND_COUPLED;
  }

  if (debugOnly) {
    return COST_CLASS.DEMAND_COUPLED;
  }

  if (layer === MODULE_LAYERS.FEATURE && (hasRoute || hasFeatures || selector)) {
    return COST_CLASS.DEMAND_COUPLED;
  }

  if (layer === MODULE_LAYERS.ENHANCEMENT && hasFeatures) {
    return COST_CLASS.DEMAND_COUPLED;
  }

  if (layer === MODULE_LAYERS.CORE) {
    // Core immediate is intentional substrate, not "wrong" — still premature
    // relative to reading content, which is the right budget label.
    return COST_CLASS.PREMATURE_COMMITMENT;
  }

  if (when === MOUNT_WHEN.IMMEDIATE) {
    if (BROAD_SELECTOR_RE.test(selector) || selector === '' || selector === 'html' || selector === 'body') {
      return COST_CLASS.PREMATURE_COMMITMENT;
    }
    // Selector-gated enhancement immediate: still early, but demand-shaped.
    if (selector && !BROAD_SELECTOR_RE.test(selector.split(',')[0].trim())) {
      return COST_CLASS.DEMAND_COUPLED;
    }
    return COST_CLASS.PREMATURE_COMMITMENT;
  }

  if (when === MOUNT_WHEN.SETTLED) {
    return COST_CLASS.AUTHORED_PRIOR_SAFE;
  }

  return COST_CLASS.DEMAND_COUPLED;
}

/**
 * Attach resolved costClass (and preserve explicit overrides).
 * Does not mutate the source def object.
 */
export function normalizeCatalogDefinition(def) {
  if (!def || typeof def !== 'object') return def;
  const costClass = inferModuleCostClass(def);
  if (def.costClass === costClass) return def;
  return { ...def, costClass };
}

export function normalizeCatalogDefinitions(defs = []) {
  return defs.map((def) => normalizeCatalogDefinition(def));
}

function countBy(rows, keyFn) {
  const out = Object.create(null);
  for (const row of rows) {
    const key = keyFn(row) || 'unknown';
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

/**
 * Optimization-oriented catalog rollup for DevTools / ecology / BRP probes.
 */
export function summarizeModuleCatalogOptimization(defs = []) {
  const normalized = normalizeCatalogDefinitions(defs);
  const byWhen = countBy(normalized, (d) => d.when);
  const byLayer = countBy(normalized, (d) => d.layer);
  const byCostClass = countBy(normalized, (d) => d.costClass || inferModuleCostClass(d));

  const enhancementImmediate = normalized.filter(
    (d) => d.layer === MODULE_LAYERS.ENHANCEMENT && d.when === MOUNT_WHEN.IMMEDIATE && !d.debugOnly,
  );
  const ungatedEnhancementImmediate = enhancementImmediate.filter(
    (d) => !(Array.isArray(d.features) && d.features.length) && !d.route,
  );
  const broadImmediate = ungatedEnhancementImmediate.filter((d) => {
    const sel = String(d.selector || '').trim();
    return !sel || BROAD_SELECTOR_RE.test(sel);
  });

  const reclassCandidates = ungatedEnhancementImmediate
    .filter((d) => {
      const cost = d.costClass || inferModuleCostClass(d);
      return (
        cost === COST_CLASS.PREMATURE_COMMITMENT
        || cost === COST_CLASS.WORKING_MEMORY_PRESSURE
        || cost === COST_CLASS.PAINT_COMPOSITE
      );
    })
    .map((d) => ({
      id: d.id,
      when: d.when,
      costClass: d.costClass || inferModuleCostClass(d),
      timingArc: d.timingArc || null,
      selector: d.selector || null,
      hint: suggestReclass(d),
    }));

  return {
    count: normalized.length,
    byWhen,
    byLayer,
    byCostClass,
    enhancementImmediate: enhancementImmediate.map((d) => d.id),
    enhancementImmediateCount: enhancementImmediate.length,
    ungatedEnhancementImmediate: ungatedEnhancementImmediate.map((d) => d.id),
    broadImmediate: broadImmediate.map((d) => d.id),
    reclassCandidates,
    interactionSlotEmpty: (byWhen[MOUNT_WHEN.INTERACTION] || 0) === 0,
    notes: [
      'costClass is an optimization coordinate; when/layer remain the schedule contract.',
      'reclassCandidates are heuristics — validate per route before moving MOUNT_WHEN.',
      'INTERACTION schedule is available but unused when interactionSlotEmpty is true.',
    ],
  };
}

function suggestReclass(def) {
  const cost = def.costClass || inferModuleCostClass(def);
  const id = asToken(def.id);
  const scope = asToken(def.effectScope);
  const arc = asToken(def.timingArc);

  if (def.debugOnly || /layout-shift|observation-beats|debug/.test(id)) {
    return { toward: MOUNT_WHEN.IDLE, timingChunk: 'idle-lab', reason: 'debug/diagnostics' };
  }
  if (cost === COST_CLASS.WORKING_MEMORY_PRESSURE || /inspect|metacognition|ledger|composition|semantics/.test(`${id} ${arc}`)) {
    if (/composition|box-model|canvas|visual|accent/.test(`${id} ${arc}`)) {
      return { toward: MOUNT_WHEN.VISIBLE, reason: 'measure/visual when hosts are near viewport' };
    }
    return { toward: MOUNT_WHEN.IDLE, timingChunk: 'idle-lab', reason: 'metacognition after interactive' };
  }
  if (cost === COST_CLASS.PAINT_COMPOSITE || /accent|ornament|visual/.test(`${id} ${scope}`)) {
    return { toward: MOUNT_WHEN.VISIBLE, reason: 'paint polish when in view' };
  }
  if (/feedback|notice|discovery|tuning/.test(id)) {
    return { toward: MOUNT_WHEN.IDLE, timingChunk: 'idle-chrome', reason: 'progressive feedback' };
  }
  if (BROAD_SELECTOR_RE.test(String(def.selector || '').trim()) || !def.selector) {
    return { toward: MOUNT_WHEN.IDLE, timingChunk: 'idle-default', reason: 'broad html/body root' };
  }
  return { toward: MOUNT_WHEN.VISIBLE, reason: 'selector-gated polish' };
}

export const MODULE_CATALOG_NORMALIZE_CONTRACT = Object.freeze({
  costClasses: COST_CLASS_VALUES,
  portableUse:
    'normalizeCatalogDefinition() attaches costClass; summarizeModuleCatalogOptimization() rolls up BRP-oriented counts; resolveModuleCatalogSpecifier() keeps resource probes aligned with catalog-relative imports.',
  scheduleOwns:
    'when / timingArc / timingChunk / features remain the runtime schedule; costClass is budget/inspect only unless a future loader policy opts in.',
});
