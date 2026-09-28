import {
  createSpwLogger,
  snapshotInstrumentationTarget,
  SPW_LOG_RELATIONSHIPS,
} from '/public/js/kernel/instrumentation.js';
import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';

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
  outcome: 'spwLayoutShiftOutcome',
});
const HISTORY_LIMIT = 12;
const SOURCE_LIMIT = 3;

// Reflow attribution: a counted shift whose start lands within this window
// *after* a module mount is read as purposeful (a component arriving into
// place), not incidental instability. The ring stays short — only the last
// few mounts can plausibly own a shift, so older mounts fall off cheaply.
const MOUNT_ATTRIBUTION_WINDOW_MS = 500;
const MOUNT_RING_LIMIT = 16;

const REFLOW_CLASS = Object.freeze({
  STABLE: 'stable',
  INPUT: 'input',
  MOUNT: 'mount',
  INCIDENTAL: 'incidental',
});

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

  if (detail.reflowClass === REFLOW_CLASS.MOUNT && detail.count > 0) {
    return {
      outcome: 'purposeful',
      summary: 'reflow attributed to an arriving component',
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

// Correlate a counted shift batch with the module that owns it. `recentMounts`
// is a small ring of { id, baseId, layer, root, mountedAt } records; `now`
// anchors the comparison when a batch carries no usable startTime.
//
// Two signals combine: a mount is only a candidate if the shift falls within
// its post-mount window, and among candidates the one whose `root` actually
// contains a shifted node wins over the merely most-recent one. Containment is
// the honest owner; recency is the fallback when no root/source is available.
const attributeReflow = (summary, recentMounts = [], now = 0, sourceNodes = []) => {
  if (!summary.countedEntries.length) {
    return {
      reflowClass: summary.recentInputCount ? REFLOW_CLASS.INPUT : REFLOW_CLASS.STABLE,
      attributedTo: null,
      withinMs: null,
      by: null,
    };
  }

  const anchor = summary.countedEntries.reduce(
    (max, entry) => Math.max(max, entry.startTime || 0),
    0,
  ) || now;

  const nodes = sourceNodes.filter((node) => node && node.nodeType === 1);

  let recent = null;
  let contained = null;
  for (const mount of recentMounts) {
    if (!Number.isFinite(mount.mountedAt)) continue;
    const withinMs = anchor - mount.mountedAt;
    // Allow a small negative slack: the shift can be observed a frame before
    // the mount timestamp settles.
    if (withinMs < -60 || withinMs > MOUNT_ATTRIBUTION_WINDOW_MS) continue;

    const candidate = { mount, withinMs: Math.round(withinMs) };
    if (!recent || mount.mountedAt > recent.mount.mountedAt) recent = candidate;

    if (mount.root && mount.root.isConnected && nodes.some((node) => mount.root.contains(node))) {
      // Prefer the most-recent *containing* mount — it is the honest owner.
      if (!contained || mount.mountedAt > contained.mount.mountedAt) contained = candidate;
    }
  }

  const best = contained || recent;
  if (best) {
    return {
      reflowClass: REFLOW_CLASS.MOUNT,
      attributedTo: best.mount,
      withinMs: best.withinMs,
      by: contained ? 'containment' : 'recency',
    };
  }

  return { reflowClass: REFLOW_CLASS.INCIDENTAL, attributedTo: null, withinMs: null, by: null };
};

const createAuditDetail = (ctx, state, extras = {}) => ({
  state,
  route: getRouteLabel(ctx),
  diagnosticsLevel: getDiagnosticsLevel(ctx),
  outcome: extras.outcome ?? 'stable',
  outcomeSummary: extras.outcomeSummary ?? 'no measurable shift',
  measurement: MEASUREMENT.name,
  metric: MEASUREMENT.metric,
  evaluator: MEASUREMENT.evaluator,
  cssDefaults: MEASUREMENT.cssDefaults,
  nativeDefaults: extras.nativeDefaults ?? MEASUREMENT.cssDefaults,
  batchValue: extras.batchValue ?? 0,
  totalValue: extras.totalValue ?? 0,
  count: extras.count ?? 0,
  recentInputCount: extras.recentInputCount ?? 0,
  largestValue: extras.largestValue ?? 0,
  entries: extras.entries ?? [],
  sourceCount: extras.sourceCount ?? 0,
  primarySource: extras.primarySource ?? null,
  sources: extras.sources ?? [],
  latestEntry: extras.latestEntry ?? null,
  hadRecentInput: Boolean(extras.hadRecentInput),
  reflowClass: extras.reflowClass ?? REFLOW_CLASS.STABLE,
  attributedTo: extras.attributedTo ?? null,
  attributedWithinMs: extras.attributedWithinMs ?? null,
  attributedBy: extras.attributedBy ?? null,
  error: extras.error ?? '',
});

const createUnsupportedDetail = (ctx, error = null) => createAuditDetail(ctx, AUDIT_STATE.UNSUPPORTED, {
  ...describeOutcome({ state: AUDIT_STATE.UNSUPPORTED }),
  batchValue: 0,
  totalValue: 0,
  entries: [],
  sources: [],
  sourceCount: 0,
  hadRecentInput: false,
  error: error ? String(error?.message || error) : '',
});

const createObservingDetail = (ctx) => createAuditDetail(ctx, AUDIT_STATE.OBSERVING, {
  ...describeOutcome({ state: AUDIT_STATE.OBSERVING }),
  batchValue: 0,
  totalValue: 0,
  entries: [],
  sources: [],
  sourceCount: 0,
  hadRecentInput: false,
});

const writeAuditDataset = (ctx, detail) => {
  const state = detail.state || AUDIT_STATE.OBSERVING;

  for (const target of [ctx?.html, ctx?.body]) {
    if (!target) continue;
    writeDatasetValue(target, DATASET_KEYS.state, state);
    writeDatasetValue(target, DATASET_KEYS.count, String(detail.count || 0));
    writeDatasetValue(target, DATASET_KEYS.total, formatValue(detail.totalValue || 0));
    writeDatasetValue(target, DATASET_KEYS.last, formatValue(detail.batchValue || 0));
    writeDatasetValue(target, DATASET_KEYS.recent, String(detail.recentInputCount || 0));
    writeDatasetValue(target, DATASET_KEYS.outcome, detail.outcome || 'stable');
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

const buildAuditDetail = (ctx, entries, state, history, recentMounts = [], now = 0, sourceNodes = []) => {
  const summary = summarizeBatch(entries);
  const attribution = attributeReflow(summary, recentMounts, now, sourceNodes);
  const batchValue = summary.batchValue;
  const totalValue = roundValue(history.totalValue + batchValue);
  const count = history.count + summary.countedEntries.length;
  const recentInputCount = history.recentInputCount + summary.recentInputCount;
  const latestEntry = summary.entries[summary.entries.length - 1] || null;
  const outcome = describeOutcome({
    state,
    count,
    totalValue,
    recentInputCount,
    reflowClass: attribution.reflowClass,
  });
  const attributedTo = attribution.attributedTo
    ? {
      id: attribution.attributedTo.id,
      baseId: attribution.attributedTo.baseId,
      layer: attribution.attributedTo.layer,
    }
    : null;

  return createAuditDetail(ctx, state, {
    outcome: outcome.outcome,
    outcomeSummary: outcome.summary,
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
    reflowClass: attribution.reflowClass,
    attributedTo,
    attributedWithinMs: attribution.withinMs,
    attributedBy: attribution.by,
  });
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

  // Always-on ring of recent module mounts, used to attribute counted shifts
  // to the component that just arrived. Kept independent of the debug window
  // below so attribution works in production with negligible cost.
  const recentMounts = [];
  const rememberMount = (mount) => {
    if (!Number.isFinite(mount?.mountedAt)) return;
    recentMounts.push(mount);
    if (recentMounts.length > MOUNT_RING_LIMIT) {
      recentMounts.splice(0, recentMounts.length - MOUNT_RING_LIMIT);
    }
  };
  const rememberMountFromEvent = (detail = {}, mountedAt) => {
    rememberMount({
      id: detail.id || detail.baseId || 'unknown',
      baseId: detail.baseId || detail.id || 'unknown',
      layer: detail.layer || '',
      // The mounted module's root element (when it has one) lets attribution
      // prefer the module whose DOM actually contains the shifted node, rather
      // than guessing by mount recency alone.
      root: detail.root && detail.root.nodeType === 1 ? detail.root : null,
      mountedAt: Number.isFinite(mountedAt) ? mountedAt : (ctx.now?.() || performance.now()),
    });
  };

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
        nativeDefaults: MEASUREMENT.cssDefaults,
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

  /* ----------------------------------------------------------------------
     Debug-only post-load instrumentation (activated only when the module
     itself was mounted via ?debug=layout or ?log=layout-shift guard in site.js).
     Records:
       - module mount timings (initial snapshot + live for first 5s)
       - first-5s DOM mutations on html/body/header/#home-frame/floating-chrome
     All behind the mount gate; zero production impact when flag absent.
     Existing CLS source/rect recording (snapshotSource + normalizeEntry) is kept.
  ---------------------------------------------------------------------- */
  const DEBUG_WINDOW_MS = 5000;
  const auditStart = performance.now();
  const debugMutations = [];
  const debugModuleMounts = [];
  let mutationObserver = null;
  let mountCleanup = null;
  let debugStopTimer = null;

  const roundValueLocal = (v) => roundValue(v); // reuse existing
  const formatRectLocal = (r) => formatRect(r);

  function describeDebugTarget(node) {
    if (!node) return { tag: 'unknown' };
    if (node.nodeType === 3) return { text: String(node.textContent || '').slice(0, 80) };
    if (node.nodeType !== 1) return { nodeType: node.nodeType };
    const el = node;
    return {
      tag: (el.tagName || '').toLowerCase(),
      id: el.id || '',
      classes: el.classList ? [...el.classList].slice(0, 5) : [],
      spw: Object.keys(el.dataset || {}).filter((k) => k.startsWith('spw')).slice(0, 6),
    };
  }

  function getDebugRect(el) {
    if (!el || typeof el.getBoundingClientRect !== 'function') return null;
    try {
      const r = el.getBoundingClientRect();
      return formatRectLocal({ x: r.x, y: r.y, width: r.width, height: r.height });
    } catch { return null; }
  }

  function isKeyLayoutSurface(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toUpperCase();
    if (tag === 'HTML' || tag === 'BODY' || tag === 'HEADER') return true;
    if (el.id === 'home-frame') return true;
    if (el.hasAttribute && el.hasAttribute('data-spw-floating-chrome')) return true;
    if (tag === 'SPW-SITE-HEADER') return true;
    return false;
  }

  function recordModuleMountTiming(detail = {}) {
    const t = performance.now();
    if (t - auditStart > DEBUG_WINDOW_MS) return;
    debugModuleMounts.push({
      id: detail.baseId || detail.id || 'unknown',
      layer: detail.layer || '',
      mountedAt: roundValueLocal(t),
      relativeMs: roundValueLocal(t - auditStart),
      durationMs: detail.durationMs != null ? roundValueLocal(detail.durationMs) : null,
      loadMs: detail.loadMs != null ? roundValueLocal(detail.loadMs) : null,
    });
  }

  // Snapshot already-mounted modules at audit init time (many immediate layers precede this enhancement)
  if (ctx?.registry && typeof ctx.registry.values === 'function') {
    for (const rec of ctx.registry.values()) {
      if (rec && rec.mountedAt != null) {
        debugModuleMounts.push({
          id: rec.baseId || rec.id || 'unknown',
          layer: rec.layer || '',
          mountedAt: roundValueLocal(rec.mountedAt),
          relativeMs: roundValueLocal(rec.mountedAt - auditStart),
          durationMs: rec.durationMs != null ? roundValueLocal(rec.durationMs) : null,
          loadMs: rec.loadMs != null ? roundValueLocal(rec.loadMs) : null,
          initial: true,
        });
        rememberMount({
          id: rec.id || rec.baseId || 'unknown',
          baseId: rec.baseId || rec.id || 'unknown',
          layer: rec.layer || '',
          root: rec.root && rec.root.nodeType === 1 ? rec.root : null,
          mountedAt: rec.mountedAt,
        });
      }
    }
  }

  // Persistent (audit-lifetime) subscription that keeps the attribution ring
  // fresh for modules mounting at any point — including idle/interaction layers
  // that arrive well after the 5s debug window has closed.
  let ringCleanup = null;
  if (ctx?.bus && typeof ctx.bus.on === 'function') {
    const off = ctx.bus.on('spw:module-mounted', (detail) => rememberMountFromEvent(detail || {}));
    ringCleanup = () => { try { off && off(); } catch {} };
  } else {
    const handler = (ev) => rememberMountFromEvent(ev && ev.detail ? ev.detail : {});
    document.addEventListener('spw:module-mounted', handler, false);
    ringCleanup = () => { try { document.removeEventListener('spw:module-mounted', handler, false); } catch {} };
  }

  // Live subscription for modules that mount during the 5s window
  if (ctx?.bus && typeof ctx.bus.on === 'function') {
    const unsub = ctx.bus.on('spw:module-mounted', recordModuleMountTiming);
    mountCleanup = () => { try { unsub && unsub(); } catch {} };
  } else {
    const handler = (ev) => recordModuleMountTiming(ev && ev.detail ? ev.detail : {});
    document.addEventListener('spw:module-mounted', handler, false);
    mountCleanup = () => { try { document.removeEventListener('spw:module-mounted', handler, false); } catch {} };
  }

  // 5s DOM mutation observer focused on surfaces that commonly host post-load shifts
  if (typeof MutationObserver === 'function') {
    mutationObserver = new MutationObserver((mutationList) => {
      const now = performance.now();
      if (now - auditStart > DEBUG_WINDOW_MS) {
        if (mutationObserver) { try { mutationObserver.disconnect(); } catch {} }
        return;
      }
      for (const mut of mutationList) {
        if (debugMutations.length >= 64) break;
        const tEl = (mut.target && mut.target.nodeType === 1) ? mut.target : (mut.target ? mut.target.parentElement : null);
        const rec = {
          t: roundValueLocal(now - auditStart),
          type: mut.type,
          target: describeDebugTarget(mut.target),
          added: mut.addedNodes ? mut.addedNodes.length : 0,
          removed: mut.removedNodes ? mut.removedNodes.length : 0,
          attr: mut.attributeName || null,
          old: mut.oldValue != null ? String(mut.oldValue).slice(0, 60) : null,
        };
        if (tEl && isKeyLayoutSurface(tEl)) {
          rec.keySurface = true;
          rec.rect = getDebugRect(tEl);
        }
        debugMutations.push(rec);
      }
    });

    const observeTargets = [
      document.documentElement,
      document.body,
      document.getElementById('home-frame'),
      document.querySelector('spw-site-header'),
      document.querySelector('header'),
      ...Array.from(document.querySelectorAll('[data-spw-floating-chrome]')),
    ].filter((el, idx, arr) => el && arr.indexOf(el) === idx);

    for (const t of observeTargets) {
      try {
        mutationObserver.observe(t, {
          childList: true,
          attributes: true,
          characterData: true,
          subtree: true,
          attributeOldValue: true,
          characterDataOldValue: true,
        });
        ctx?.addObserver?.(mutationObserver);
      } catch {}
    }

    debugStopTimer = setTimeout(() => {
      flushAndStopDebugCollectors();
    }, DEBUG_WINDOW_MS + 80);
    if (ctx?.addTimer) ctx.addTimer(debugStopTimer);
  }

  function flushAndStopDebugCollectors() {
    if (debugStopTimer) { try { clearTimeout(debugStopTimer); } catch {} debugStopTimer = null; }
    if (mutationObserver) {
      try { mutationObserver.disconnect(); } catch {}
      ctx?.observers?.delete?.(mutationObserver);
      mutationObserver = null;
    }
    if (typeof mountCleanup === 'function') {
      try { mountCleanup(); } catch {}
      mountCleanup = null;
    }
    if (debugMutations.length || debugModuleMounts.length) {
      const payload = {
        windowMs: DEBUG_WINDOW_MS,
        startedAt: roundValueLocal(auditStart),
        mutationCount: debugMutations.length,
        moduleMountCount: debugModuleMounts.length,
        mutations: debugMutations.slice(0, 40),
        moduleMounts: debugModuleMounts.slice(0, 40),
        capturedAt: roundValueLocal(performance.now()),
      };
      logger.debug('layout debug: 5s post-mount DOM + module timing', payload, SPW_LOG_RELATIONSHIPS.MEASURE);
      try {
        if (ctx?.bus?.emit) ctx.bus.emit('spw:layout-shift-debug', payload);
        window.__spwLayoutDebug = { ...(window.__spwLayoutDebug || {}), last: payload };
      } catch {}
    }
  }

  // expose for console / state inspector during debug sessions
  try {
    auditApi.debug = {
      get mutations() { return [...debugMutations]; },
      get moduleMounts() { return [...debugModuleMounts]; },
      flush: flushAndStopDebugCollectors,
    };
  } catch {}

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

    if (ctx?.bus?.emit) {
      ctx.bus.emit(EVENT_NAME, payload);
    } else {
      document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
    }
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
    const now = ctx.now?.() || performance.now();
    // Live shifted nodes stay local to attribution — they are never placed on
    // the emitted detail, which keeps `spw:layout-shift` serializable.
    const sourceNodes = [];
    for (const entry of batchEntries) {
      if (entry?.hadRecentInput) continue;
      for (const source of entry?.sources || []) {
        if (source?.node?.nodeType === 1) sourceNodes.push(source.node);
      }
    }
    const detail = buildAuditDetail(ctx, batchEntries, nextState, history, recentMounts, now, sourceNodes);
    history.totalValue = detail.totalValue;
    history.count = detail.count;
    history.recentInputCount = detail.recentInputCount;
    entries.push(detail);
    if (entries.length > HISTORY_LIMIT) entries.splice(0, entries.length - HISTORY_LIMIT);

    // Enrich the component model: attribute this shift's cost back onto the
    // arriving module's registry record so tuning/inspection surfaces can read
    // per-component reflow as a first-class signal, and mark it settled.
    if (detail.attributedTo?.id && detail.batchValue > 0 && typeof ctx.registry?.get === 'function') {
      const record = ctx.registry.get(detail.attributedTo.id);
      if (record) {
        record.reflowValue = roundValue((record.reflowValue || 0) + detail.batchValue);
        record.reflowClass = detail.reflowClass;
        record.reflowWithinMs = detail.attributedWithinMs;
        record.reflowAttributedBy = detail.attributedBy;
        if (record.settledAt == null) record.settledAt = Math.round(now);
      }
    }

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

    // Stop any active 5s debug collectors (mutation + mount listeners)
    if (typeof flushAndStopDebugCollectors === 'function') {
      try { flushAndStopDebugCollectors(); } catch {}
    }

    if (typeof ringCleanup === 'function') {
      try { ringCleanup(); } catch {}
      ringCleanup = null;
    }
    recentMounts.length = 0;
  };

  const supported = globalThis.PerformanceObserver?.supportedEntryTypes?.includes?.('layout-shift');
  if (!supported) {
    const detail = createUnsupportedDetail(ctx);
    syncState(detail);
    emit(detail, 'warn');
    return cleanup;
  }

  try {
    observer = new PerformanceObserver((list) => {
      recordBatch(list.getEntries());
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    const detail = createUnsupportedDetail(ctx, error);
    syncState(detail);
    emit(detail, 'warn');
    return cleanup;
  }

  ctx?.addObserver?.(observer);

  const detail = createObservingDetail(ctx);

  syncState(detail);
  emit(detail, 'info');

  return cleanup;
}
