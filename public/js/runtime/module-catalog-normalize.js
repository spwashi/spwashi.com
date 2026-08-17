/**
 * Catalog normalization + optimization summaries.
 *
 * Schedule fields (when / timingArc / timingChunk) stay the runtime contract.
 * cost = { commitment, spend, copy? } is the budget/inspect model.
 * costClass remains a derived alias for older audits.
 */

import {
  COST_CLASS,
  COST_CLASS_VALUES,
  COST_COMMITMENT,
  COST_COMMITMENT_VALUES,
  COST_COPY,
  COST_COPY_VALUES,
  COST_SPEND,
  COST_SPEND_VALUES,
  MODULE_LAYERS,
  MOUNT_WHEN,
  costClassFromModel,
  costModelFromClass,
  describeModuleCost,
} from './module-catalog-constants.js';
import { summarizeCatalogTiming } from '../kernel/module-timing-contract.js';

const COST_CLASS_SET = new Set(COST_CLASS_VALUES);
const COMMITMENT_SET = new Set(COST_COMMITMENT_VALUES);
const SPEND_SET = new Set(COST_SPEND_VALUES);
const COPY_SET = new Set(COST_COPY_VALUES);

const BROAD_SELECTOR_RE = /^(html|body)$/i;
const PAINT_SCOPE_RE = /ornament|css-vars|paint|composite|flourish|express|backdrop|media-query/;
const MEMORY_SCOPE_RE = /observer|document-wide|document-scroll|resize|performance-observer|queryall|measure|metacognition|inspect/;
const INTERFERENCE_SCOPE_RE = /pack-local|layout-correction|dual|mirror/;
const RESIDUE_SCOPE_RE = /storage|settings|pins|checkpoint|collection|visitation|cauldron|haptics/;
const LISTEN_SCOPE_RE = /listeners|observer|viewport|document-scroll|resize/;
const PIN_ID_RE = /spell|checkpoint|pin-registry|haptics/;
const KEEP_ID_RE = /site-settings|visitation|collection|local-notes|local-memory/;
const MODULE_CATALOG_URL_PATH = '/public/js/runtime/module-catalog.js';

function asToken(value) {
  return String(value || '').trim().toLowerCase();
}

function updatesText(def = {}) {
  const updates = def.updates;
  if (Array.isArray(updates)) return updates.join(' ');
  return String(updates || '');
}

export function resolveModuleCatalogSpecifier(specifier = '', origin = '') {
  const normalized = String(specifier || '').trim();
  if (!normalized) return '';
  try {
    if (normalized.startsWith('/public/js/')) {
      return new URL(normalized, origin || 'http://localhost').href;
    }
    if (!normalized.startsWith('./') && !normalized.startsWith('../')) return '';
    return new URL(normalized, new URL(MODULE_CATALOG_URL_PATH, origin)).href;
  } catch {
    return '';
  }
}

export function filterEnhancementDefs(defs, includeLayoutAudit = true) {
  if (includeLayoutAudit) return defs;
  return (defs || []).filter((def) => def?.id !== 'layout-shift-audit');
}

/** Lightweight index for ecology scripts and DevTools without mounting modules. */
export function listModuleCatalogIndex(defs = []) {
  const byLayer = Object.create(null);
  const byWhen = Object.create(null);
  const byCostClass = Object.create(null);
  const byCommitment = Object.create(null);
  const bySpend = Object.create(null);
  const rows = [];
  for (const def of defs) {
    if (!def?.id) continue;
    const layer = def.layer || 'unknown';
    const when = def.when || 'immediate';
    const cost = def.cost || inferModuleCost(def);
    const costClass = def.costClass || inferModuleCostClass(def);
    (byLayer[layer] ||= []).push(def.id);
    (byWhen[when] ||= []).push(def.id);
    (byCostClass[costClass] ||= []).push(def.id);
    (byCommitment[cost.commitment] ||= []).push(def.id);
    (bySpend[cost.spend] ||= []).push(def.id);
    rows.push({
      id: def.id,
      layer,
      when,
      cost,
      costClass,
      costLabel: def.costLabel || `${cost.commitment}/${cost.spend}`,
      describes: def.describes || null,
      timingArc: def.timingArc || null,
      timingChunk: def.timingChunk || null,
      features: def.features || null,
      pageFamily: def.pageFamily || null,
      pageModes: def.pageModes || null,
      selector: def.selector || null,
      debugOnly: Boolean(def.debugOnly),
      effectScope: def.effectScope || null,
    });
  }
  return {
    count: rows.length,
    byLayer,
    byWhen,
    byCostClass,
    byCommitment,
    bySpend,
    modules: rows,
    optimization: summarizeModuleCatalogOptimization(defs),
  };
}

function inferCommitment(def = {}) {
  const scope = asToken(def.effectScope);
  const id = asToken(def.id);
  const updates = asToken(updatesText(def));
  const when = asToken(def.when);

  if (when === MOUNT_WHEN.SETTLED && !RESIDUE_SCOPE_RE.test(`${scope} ${updates}`)) {
    return COST_COMMITMENT.AUTHORED;
  }
  if (RESIDUE_SCOPE_RE.test(`${scope} ${id}`) || /\bresidue:/.test(updates)) {
    return COST_COMMITMENT.RESIDUE;
  }
  if (LISTEN_SCOPE_RE.test(scope) && !/root-state|css-vars/.test(scope)) {
    return COST_COMMITMENT.LISTEN;
  }
  if (MEMORY_SCOPE_RE.test(scope) && !/root-state/.test(scope)) {
    return COST_COMMITMENT.LISTEN;
  }
  return COST_COMMITMENT.PROJECT;
}

function inferSpend(def = {}, commitment) {
  const when = asToken(def.when);
  const layer = asToken(def.layer);
  const scope = asToken(def.effectScope);
  const arc = asToken(def.timingArc);
  const id = asToken(def.id);
  const selector = String(def.selector || '').trim();
  const hasFeatures = Array.isArray(def.features) ? def.features.length > 0 : Boolean(def.features);
  const hasRoute = Boolean(def.route);
  const debugOnly = Boolean(def.debugOnly);

  if (INTERFERENCE_SCOPE_RE.test(scope) || /layout-assumptions|spatial-gravity/.test(id)) {
    return COST_SPEND.FIGHT;
  }
  if (
    (PAINT_SCOPE_RE.test(scope) || /canvas-accents|module-effects|pulse-beat/.test(id))
    && when === MOUNT_WHEN.IMMEDIATE
    && layer === MODULE_LAYERS.ENHANCEMENT
    && !hasFeatures
  ) {
    return COST_SPEND.PAINT;
  }
  if (
    (MEMORY_SCOPE_RE.test(scope)
      || /composition-box|state-inspector|layout-shift|component-semantics|semantic-crossrefs|content-tone/.test(id)
      || /metacognition|inspection|diagnostics|layout/.test(arc))
    && (when === MOUNT_WHEN.IMMEDIATE || when === MOUNT_WHEN.SETTLED)
  ) {
    return COST_SPEND.WIDE;
  }
  if (
    when === MOUNT_WHEN.VISIBLE
    || when === MOUNT_WHEN.IDLE
    || when === MOUNT_WHEN.INTERACTION
    || when === MOUNT_WHEN.REGION
    || debugOnly
    || (layer === MODULE_LAYERS.FEATURE && (hasRoute || hasFeatures || selector))
    || (layer === MODULE_LAYERS.ENHANCEMENT && hasFeatures)
  ) {
    return COST_SPEND.NONE;
  }
  if (when === MOUNT_WHEN.IMMEDIATE) {
    if (selector && !BROAD_SELECTOR_RE.test(selector.split(',')[0].trim())) {
      return COST_SPEND.NONE;
    }
    return COST_SPEND.EARLY;
  }
  if (commitment === COST_COMMITMENT.AUTHORED) return COST_SPEND.NONE;
  return COST_SPEND.NONE;
}

function inferCopy(def = {}, commitment) {
  if (commitment !== COST_COMMITMENT.RESIDUE) return null;
  const id = asToken(def.id);
  const scope = asToken(def.effectScope);
  if (PIN_ID_RE.test(`${id} ${scope}`)) return COST_COPY.PIN;
  if (KEEP_ID_RE.test(`${id} ${scope}`)) return COST_COPY.KEEP;
  return COST_COPY.FOLLOW;
}

function readExplicitCost(def = {}) {
  const raw = def.cost;
  if (!raw || typeof raw !== 'object') return null;
  const commitment = asToken(raw.commitment);
  const spend = asToken(raw.spend);
  const copy = raw.copy == null || raw.copy === '' ? null : asToken(raw.copy);
  if (!COMMITMENT_SET.has(commitment) || !SPEND_SET.has(spend)) return null;
  if (copy && !COPY_SET.has(copy)) return null;
  return {
    commitment,
    spend,
    copy: commitment === COST_COMMITMENT.RESIDUE ? (copy || COST_COPY.FOLLOW) : null,
  };
}

/**
 * Resolve { commitment, spend, copy } for a catalog def.
 * Explicit def.cost wins; explicit costClass still expands; otherwise infer.
 */
export function inferModuleCost(def = {}) {
  const explicit = readExplicitCost(def);
  if (explicit) return explicit;

  if (def.costClass && COST_CLASS_SET.has(asToken(def.costClass))) {
    const fromClass = costModelFromClass(def.costClass);
    return {
      ...fromClass,
      copy: inferCopy(def, fromClass.commitment) || fromClass.copy,
    };
  }

  const commitment = inferCommitment(def);
  const spend = inferSpend(def, commitment);
  return {
    commitment,
    spend,
    copy: inferCopy(def, commitment),
  };
}

/**
 * Infer a legacy costClass token. Prefer inferModuleCost() for new work.
 */
export function inferModuleCostClass(def = {}) {
  if (def.costClass && COST_CLASS_SET.has(asToken(def.costClass))) {
    return asToken(def.costClass);
  }
  return costClassFromModel(inferModuleCost(def));
}

/**
 * Attach resolved cost + derived costClass. Does not mutate the source def.
 */
export function normalizeCatalogDefinition(def) {
  if (!def || typeof def !== 'object') return def;
  const cost = inferModuleCost(def);
  const costClass = costClassFromModel(cost);
  const described = describeModuleCost(cost);
  if (
    def.costClass === costClass
    && def.cost?.commitment === cost.commitment
    && def.cost?.spend === cost.spend
    && def.cost?.copy === cost.copy
    && def.costLabel === described
  ) {
    return def;
  }
  return { ...def, cost, costClass, costLabel: described };
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
  const byCommitment = countBy(normalized, (d) => d.cost?.commitment);
  const bySpend = countBy(normalized, (d) => d.cost?.spend);
  const byCopy = countBy(normalized.filter((d) => d.cost?.copy), (d) => d.cost.copy);

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
      const spend = d.cost?.spend || inferModuleCost(d).spend;
      return spend === COST_SPEND.EARLY || spend === COST_SPEND.WIDE || spend === COST_SPEND.PAINT;
    })
    .map((d) => ({
      id: d.id,
      when: d.when,
      cost: d.cost || inferModuleCost(d),
      costClass: d.costClass || inferModuleCostClass(d),
      costLabel: d.costLabel || describeModuleCost(d.cost || inferModuleCost(d)),
      timingArc: d.timingArc || null,
      selector: d.selector || null,
      hint: suggestReclass(d),
    }));

  const timing = summarizeCatalogTiming(normalized);

  return {
    count: normalized.length,
    byWhen,
    byLayer,
    byCostClass,
    byCommitment,
    bySpend,
    byCopy,
    byTimingStem: timing.byTimingStem,
    byIdleChunk: timing.byIdleChunk,
    timingHygiene: {
      knownArcCount: timing.knownArcCount,
      missingArcCount: timing.missingArcCount,
      idleWithChunk: timing.idleWithChunk,
      idleWithoutChunk: timing.idleWithoutChunk,
      nonstandardIdleChunk: timing.nonstandardIdleChunk,
    },
    enhancementImmediate: enhancementImmediate.map((d) => d.id),
    enhancementImmediateCount: enhancementImmediate.length,
    ungatedEnhancementImmediate: ungatedEnhancementImmediate.map((d) => d.id),
    broadImmediate: broadImmediate.map((d) => d.id),
    reclassCandidates,
    interactionSlotEmpty: (byWhen[MOUNT_WHEN.INTERACTION] || 0) === 0,
    notes: [
      'cost is { commitment, spend, copy? }: remain / how the act hurts / resident printing.',
      'costClass is a derived alias (early→premature_commitment, wide→working_memory_pressure, …).',
      'when / layer remain the schedule contract. INTERACTION is unused when interactionSlotEmpty.',
      'byTimingStem / byIdleChunk come from module-timing-contract.',
    ],
  };
}

function suggestReclass(def) {
  const cost = def.cost || inferModuleCost(def);
  const id = asToken(def.id);
  const scope = asToken(def.effectScope);
  const arc = asToken(def.timingArc);

  if (def.debugOnly || /layout-shift|observation-beats|debug/.test(id)) {
    return { toward: MOUNT_WHEN.IDLE, timingChunk: 'idle-lab', reason: 'debug/diagnostics' };
  }
  if (cost.spend === COST_SPEND.WIDE || /inspect|metacognition|ledger|composition|semantics/.test(`${id} ${arc}`)) {
    if (/composition|box-model|canvas|visual|accent/.test(`${id} ${arc}`)) {
      return { toward: MOUNT_WHEN.VISIBLE, reason: 'measure/visual when hosts are near viewport' };
    }
    return { toward: MOUNT_WHEN.IDLE, timingChunk: 'idle-lab', reason: 'metacognition after interactive' };
  }
  if (cost.spend === COST_SPEND.PAINT || /accent|ornament|visual/.test(`${id} ${scope}`)) {
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
  commitments: COST_COMMITMENT_VALUES,
  spends: COST_SPEND_VALUES,
  copies: COST_COPY_VALUES,
  costClasses: COST_CLASS_VALUES,
  portableUse:
    'inferModuleCost() returns { commitment, spend, copy? }. costClassFromModel() keeps older audits working. summarizeModuleCatalogOptimization() rolls up both views. listModuleCatalogIndex() includes describes so a module can be recognized by contract or by when/timingArc.',
  process:
    'enter=when, act=spend, leave=cleanup handle, remain=commitment. copy only at residue.',
  scheduleOwns:
    'when / timingArc / timingChunk / features remain the runtime schedule; cost is budget/inspect only unless a future loader policy opts in.',
});
