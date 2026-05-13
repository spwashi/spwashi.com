import {
  createSpwLogger,
  snapshotInstrumentationTarget,
  SPW_LOG_RELATIONSHIPS,
} from '/public/js/kernel/spw-instrumentation.js';
import { writeDatasetValue } from '/public/js/kernel/spw-dom-contracts.js';

const EVENT_NAME = 'spw:layout-shift';
const MEASUREMENT = Object.freeze({
  name: 'layout stability',
  metric: 'CLS',
  evaluator: 'PerformanceObserver(layout-shift)',
  cssDefaults: Object.freeze(['normal flow', 'intrinsic sizing', 'auto layout']),
});
const AUDIT_STATE = Object.freeze({
  IDLE: 'idle',
  OBSERVING: 'observing',
  SHIFTED: 'shifted',
  UNSUPPORTED: 'unsupported',
});
const DATASET_KEYS = Object.freeze({
  state: 'spwLayoutShiftState',
  count: 'spwLayoutShiftCount',
  total: 'spwLayoutShiftTotal',
  last: 'spwLayoutShiftLast',
  recent: 'spwLayoutShiftRecentInputCount',
});
const HISTORY_LIMIT = 12;
const SOURCE_LIMIT = 3;

const roundValue = (value = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 10000) / 10000;
};

const formatValue = (value = 0) => roundValue(value).toFixed(4);

const formatRect = (rect = {}) => ({
  x: Math.round(Number(rect.x) || 0),
  y: Math.round(Number(rect.y) || 0),
  width: Math.round(Number(rect.width) || 0),
  height: Math.round(Number(rect.height) || 0),
});

const getRouteLabel = (ctx) => ctx?.route || ctx?.body?.dataset?.spwSurface || window.location.pathname || 'surface';

const getDiagnosticsLevel = (ctx) => (
  ctx?.html?.dataset?.spwBusDiagnostics
  || ctx?.body?.dataset?.spwBusDiagnostics
  || 'off'
);

const describeOutcome = (detail = {}) => {
  if (detail.state === AUDIT_STATE.UNSUPPORTED) {
    return {
      outcome: 'unsupported',
      summary: 'layout stability measurement unavailable',
    };
  }

  if (detail.count === 0 && detail.recentInputCount > 0) {
    return {
      outcome: 'intentional',
      summary: 'shifted by recent input, not counted against stability',
    };
  }

  if (!detail.count && !detail.totalValue) {
    return {
      outcome: 'stable',
      summary: 'no measurable shift',
    };
  }

  if (detail.totalValue < 0.01) {
    return {
      outcome: 'subtle',
      summary: 'subtle movement worth watching',
    };
  }

  if (detail.totalValue < 0.05) {
    return {
      outcome: 'noticeable',
      summary: 'visible drift worth reviewing',
    };
  }

  return {
    outcome: 'unstable',
    summary: 'layout movement needs attention',
  };
};

const writeAuditDataset = (ctx, detail) => {
  const state = detail.state || AUDIT_STATE.OBSERVING;

  for (const target of [ctx?.html, ctx?.body]) {
    if (!target) continue;
    writeDatasetValue(target, DATASET_KEYS.state, state);
    writeDatasetValue(target, DATASET_KEYS.count, String(detail.count || 0));
    writeDatasetValue(target, DATASET_KEYS.total, formatValue(detail.totalValue || 0));
    writeDatasetValue(target, DATASET_KEYS.last, formatValue(detail.batchValue || 0));
    writeDatasetValue(target, DATASET_KEYS.recent, String(detail.recentInputCount || 0));
    writeDatasetValue(target, 'spwLayoutShiftOutcome', detail.outcome || 'stable');
  }
};

const clearAuditDataset = (ctx) => {
  for (const target of [ctx?.html, ctx?.body]) {
    if (!target?.dataset) continue;
    delete target.dataset.spwLayoutShiftState;
    delete target.dataset.spwLayoutShiftCount;
    delete target.dataset.spwLayoutShiftTotal;
    delete target.dataset.spwLayoutShiftLast;
    delete target.dataset.spwLayoutShiftRecentInputCount;
    delete target.dataset.spwLayoutShiftOutcome;
  }
};

const snapshotSource = (source = {}) => {
  const node = source?.node;
  const base = snapshotInstrumentationTarget(node, { includeText: false }) || {
    selector: node?.id ? `#${node.id}` : node?.tagName?.toLowerCase?.() || 'unknown',
    tag: node?.tagName?.toLowerCase?.() || '',
    id: node?.id || '',
    classes: node?.classList ? [...node.classList] : [],
    dataset: {},
    cssTokens: {},
    tuning: {},
    text: '',
  };

  return {
    ...base,
    previousRect: source?.previousRect ? formatRect(source.previousRect) : null,
    currentRect: source?.currentRect ? formatRect(source.currentRect) : null,
  };
};

const normalizeEntry = (entry = {}, index = 0) => {
  const sources = Array.from(entry.sources || []).slice(0, SOURCE_LIMIT).map(snapshotSource);
  return {
    index,
    value: roundValue(entry.value || 0),
    hadRecentInput: Boolean(entry.hadRecentInput),
    lastInputTime: roundValue(entry.lastInputTime || 0),
    startTime: roundValue(entry.startTime || 0),
    sourceCount: Array.isArray(entry.sources) ? entry.sources.length : 0,
    sources,
    primarySource: sources[0] || null,
  };
};

const summarizeBatch = (entries = []) => {
  const normalizedEntries = entries.map(normalizeEntry);
  const countedEntries = normalizedEntries.filter((entry) => !entry.hadRecentInput);
  const recentInputCount = normalizedEntries.length - countedEntries.length;
  const batchValue = countedEntries.reduce((sum, entry) => sum + entry.value, 0);
  const largestValue = normalizedEntries.reduce((largest, entry) => Math.max(largest, entry.value), 0);
  const sourceCount = countedEntries.reduce((sum, entry) => sum + entry.sourceCount, 0);
  const sources = countedEntries.flatMap((entry) => entry.sources).slice(0, SOURCE_LIMIT);
  return {
    entries: normalizedEntries,
    countedEntries,
    recentInputCount,
    batchValue: roundValue(batchValue),
    largestValue: roundValue(largestValue),
    sourceCount,
    primarySource: sources[0] || null,
    sources,
  };
};

const buildAuditDetail = (ctx, entries, state, history) => {
  const summary = summarizeBatch(entries);
  const batchValue = summary.batchValue;
  const totalValue = roundValue(history.totalValue + batchValue);
  const count = history.count + summary.countedEntries.length;
  const recentInputCount = history.recentInputCount + summary.recentInputCount;
  const latestEntry = summary.entries[summary.entries.length - 1] || null;
  const diagnosticsLevel = getDiagnosticsLevel(ctx);
  const outcome = describeOutcome({ state, count, totalValue, recentInputCount });

  return {
    state,
    route: getRouteLabel(ctx),
    diagnosticsLevel,
    outcome: outcome.outcome,
    outcomeSummary: outcome.summary,
    measurement: MEASUREMENT.name,
    metric: MEASUREMENT.metric,
    evaluator: MEASUREMENT.evaluator,
    cssDefaults: MEASUREMENT.cssDefaults,
    batchValue,
    totalValue,
    count,
    recentInputCount,
    largestValue: summary.largestValue,
    entries: summary.entries,
    sourceCount: summary.sourceCount,
    primarySource: summary.primarySource,
    sources: summary.sources,
    latestEntry,
    hadRecentInput: summary.entries.some((entry) => entry.hadRecentInput),
  };
};

export function initSpwLayoutShiftAudit(ctx = {}) {
  const logger = createSpwLogger('layout-shift', {
    namespace: 'layout-shift',
    role: 'runtime',
    metaphor: 'measure',
    owns: 'layout instability audit, buffered observer, and shift summaries',
  });

  const history = {
    totalValue: 0,
    count: 0,
    recentInputCount: 0,
  };
  const entries = [];
  const auditApi = {
    get history() {
      return [...entries];
    },
    get latest() {
      return entries[entries.length - 1] || null;
    },
    snapshot() {
      const root = ctx?.html?.dataset || {};
      return {
        state: root.spwLayoutShiftState || AUDIT_STATE.IDLE,
        diagnosticsLevel: getDiagnosticsLevel(ctx),
        outcome: root.spwLayoutShiftOutcome || 'stable',
        measurement: MEASUREMENT.name,
        metric: MEASUREMENT.metric,
        evaluator: MEASUREMENT.evaluator,
        cssDefaults: MEASUREMENT.cssDefaults,
        count: Number(root.spwLayoutShiftCount || 0),
        totalValue: Number(root.spwLayoutShiftTotal || 0),
        lastValue: Number(root.spwLayoutShiftLast || 0),
        recentInputCount: Number(root.spwLayoutShiftRecentInputCount || 0),
        route: getRouteLabel(ctx),
        history: [...entries],
        latest: entries[entries.length - 1] || null,
      };
    },
  };
  let observer = null;
  let active = true;

  ctx.layoutShiftAudit = auditApi;

  const emit = (detail, level = 'warn') => {
    const payload = {
      ...detail,
      timestamp: roundValue(ctx.now?.() || performance.now()),
    };
    const message = detail.state === AUDIT_STATE.UNSUPPORTED
      ? 'layout stability observer unavailable'
      : detail.state === AUDIT_STATE.OBSERVING && detail.recentInputCount
        ? 'layout stability ignored by recent input'
      : detail.state === AUDIT_STATE.OBSERVING && !detail.batchValue && !detail.totalValue
        ? 'layout stability observer active'
        : 'layout stability batch';

    logger[level](message, payload, SPW_LOG_RELATIONSHIPS.MEASURE);

    ctx?.bus?.emit?.(EVENT_NAME, payload);
    document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
    return payload;
  };

  const syncState = (detail) => {
    writeAuditDataset(ctx, detail);
  };

  const recordBatch = (batchEntries = []) => {
    if (!batchEntries.length || !active) return null;

    const nextState = batchEntries.some((entry) => !entry.hadRecentInput && entry.value > 0)
      ? AUDIT_STATE.SHIFTED
      : AUDIT_STATE.OBSERVING;
    const detail = buildAuditDetail(ctx, batchEntries, nextState, history);
    history.totalValue = detail.totalValue;
    history.count = detail.count;
    history.recentInputCount = detail.recentInputCount;
    entries.push(detail);
    if (entries.length > HISTORY_LIMIT) entries.splice(0, entries.length - HISTORY_LIMIT);

    syncState(detail);
    return emit(detail, detail.batchValue > 0 ? 'warn' : 'info');
  };

  const cleanup = () => {
    if (!active) return;

    const pending = observer?.takeRecords?.() || [];
    if (pending.length) {
      recordBatch(pending);
    }

    active = false;
    observer?.disconnect?.();
    ctx?.observers?.delete?.(observer);
    clearAuditDataset(ctx);
    if (ctx.layoutShiftAudit === auditApi) {
      ctx.layoutShiftAudit = null;
    }
  };

  const supported = globalThis.PerformanceObserver?.supportedEntryTypes?.includes?.('layout-shift');
  if (!supported) {
    const detail = {
      state: AUDIT_STATE.UNSUPPORTED,
      route: getRouteLabel(ctx),
      diagnosticsLevel: getDiagnosticsLevel(ctx),
      outcome: 'unsupported',
      outcomeSummary: 'layout stability measurement unavailable',
      measurement: MEASUREMENT.name,
      metric: MEASUREMENT.metric,
      evaluator: MEASUREMENT.evaluator,
      cssDefaults: MEASUREMENT.cssDefaults,
      batchValue: 0,
      totalValue: 0,
      count: 0,
      recentInputCount: 0,
      sourceCount: 0,
      sources: [],
      entries: [],
      hadRecentInput: false,
    };
    syncState(detail);
    emit(detail, 'warn');
    return cleanup;
  }

  try {
    observer = new PerformanceObserver((list) => {
      recordBatch(list.getEntries(), AUDIT_STATE.SHIFTED);
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    const detail = {
      state: AUDIT_STATE.UNSUPPORTED,
      route: getRouteLabel(ctx),
      diagnosticsLevel: getDiagnosticsLevel(ctx),
      outcome: 'unsupported',
      outcomeSummary: 'layout stability measurement unavailable',
      measurement: MEASUREMENT.name,
      metric: MEASUREMENT.metric,
      evaluator: MEASUREMENT.evaluator,
      cssDefaults: MEASUREMENT.cssDefaults,
      batchValue: 0,
      totalValue: 0,
      count: 0,
      recentInputCount: 0,
      sourceCount: 0,
      sources: [],
      entries: [],
      hadRecentInput: false,
      error: String(error?.message || error),
    };
    syncState(detail);
    emit(detail, 'warn');
    return cleanup;
  }

  ctx?.addObserver?.(observer);

  const detail = {
    state: AUDIT_STATE.OBSERVING,
    route: getRouteLabel(ctx),
    diagnosticsLevel: getDiagnosticsLevel(ctx),
    outcome: 'stable',
    outcomeSummary: 'no measurable shift',
    measurement: MEASUREMENT.name,
    metric: MEASUREMENT.metric,
    evaluator: MEASUREMENT.evaluator,
    cssDefaults: MEASUREMENT.cssDefaults,
    batchValue: 0,
    totalValue: 0,
    count: 0,
    recentInputCount: 0,
    largestValue: 0,
    entries: [],
    sourceCount: 0,
    primarySource: null,
    sources: [],
    hadRecentInput: false,
  };

  syncState(detail);
  emit(detail, 'info');

  return cleanup;
}
