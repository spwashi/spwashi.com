/**
 * Load trace — an instrument for stepping through arrival and seeing what it costs.
 *
 * The runtime already announces everything needed to reconstruct a page's
 * arrival: module-loader emits spw:module-mounted with layer, requestedWhen vs
 * effectiveWhen, timingArc, and the attribute/property updates each module
 * claims it will make; layout-shift-audit separately attributes counted layout
 * shifts to whichever module was arriving. Nothing was joining those two
 * streams, so "which arrival moved the page" stayed a question you answered by
 * squinting at a reload.
 *
 * Recording is always on and deliberately trivial — pushing a small object onto
 * an array inside a bus handler that already fires. Nothing measures, observes,
 * or reads layout here. The expensive parts (highlighting, stepping) are opt-in
 * calls, never ambient.
 *
 * Stepping is real rather than a replay: module-loader exposes mountModule and
 * unmountModule by id, so a trace can be wound back to a prefix and re-run.
 * Modules that declare no unmount cleanly are reported rather than silently
 * skipped — a step that cannot be undone is a finding about that module.
 *
 * See .spw/conventions/folding-chrome-organelle.spw — this is the instrument
 * its validation block asks for before more of that model gets built.
 */

const MAX_STEPS = 400;

const steps = [];
let started = 0;
let unsubscribe = null;

const now = () => (globalThis.performance?.now?.() ?? Date.now());

function record(entry) {
  if (steps.length >= MAX_STEPS) return;
  steps.push(entry);
}

/** Modules that arrived, in arrival order, with what they claimed to touch. */
export function getLoadSteps() {
  return steps.map((step, index) => ({ index, ...step }));
}

/**
 * Group the trace by mount tier. The interesting column is `deferred`:
 * modules that asked for IMMEDIATE and were given something later, which is
 * the loader disagreeing with the catalog and worth seeing plainly.
 */
export function summarizeLoadTrace() {
  const byWhen = new Map();
  let deferred = 0;
  let shifted = 0;

  for (const step of steps) {
    const key = step.effectiveWhen || step.requestedWhen || 'unknown';
    byWhen.set(key, (byWhen.get(key) || 0) + 1);
    if (step.requestedWhen && step.effectiveWhen && step.requestedWhen !== step.effectiveWhen) deferred += 1;
    if (step.shift) shifted += 1;
  }

  return {
    total: steps.length,
    byWhen: Object.fromEntries(byWhen),
    deferred,
    shifted,
    spanMs: steps.length ? Math.round(steps[steps.length - 1].at - steps[0].at) : 0,
  };
}

/**
 * Wind the runtime back to the first `count` steps by unmounting everything
 * after them, then optionally re-mount forward. Returns what actually happened,
 * including modules that refused to unmount.
 */
export async function stepTo(count, api = globalThis.__SPW_SITE__) {
  const target = Math.max(0, Math.min(count, steps.length));
  const undone = [];
  const stuck = [];

  for (let i = steps.length - 1; i >= target; i -= 1) {
    const step = steps[i];
    try {
      const ok = await api?.unmountModule?.(step.baseId || step.id);
      if (ok === false) stuck.push(step.id);
      else undone.push(step.id);
    } catch (error) {
      stuck.push(step.id);
    }
  }

  return { target, undone, stuck };
}

/**
 * Mark what a step claimed to touch, so its blast radius is visible in place.
 * Only attributes are written — no styles, no measurement — so the highlight is
 * itself inspectable and costs a CSS selector rather than a layout read.
 */
export function highlightStep(index, { clear = true } = {}) {
  if (typeof document === 'undefined') return 0;

  if (clear) {
    document.querySelectorAll('[data-spw-load-step-touched]').forEach((node) => {
      delete node.dataset.spwLoadStepTouched;
    });
  }

  const step = steps[index];
  if (!step) return 0;

  // `updates` entries look like "structural:data-spw-page-section-current" or
  // "measure:--spw-section-progress"; only the attribute half is selectable.
  const attrs = (step.updates || [])
    .map((entry) => String(entry).split(':').pop())
    .filter((name) => name.startsWith('data-spw-'));

  let touched = 0;
  for (const attr of attrs) {
    document.querySelectorAll(`[${attr}]`).forEach((node) => {
      node.dataset.spwLoadStepTouched = step.id;
      touched += 1;
    });
  }
  return touched;
}

export function clearLoadTraceHighlight() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-spw-load-step-touched]').forEach((node) => {
    delete node.dataset.spwLoadStepTouched;
  });
}

export function initLoadTrace(ctx = {}) {
  const bus = ctx.bus || globalThis.__SPW_SITE__?.bus;
  if (!bus?.on) return () => {};

  started = now();
  steps.length = 0;

  const offMount = bus.on('spw:module-mounted', (event) => {
    const d = event?.detail || event || {};
    record({
      id: d.id || d.baseId || 'unknown',
      baseId: d.baseId || d.id,
      layer: d.layer || '',
      requestedWhen: d.requestedWhen || '',
      effectiveWhen: d.effectiveWhen || '',
      timingArc: d.timingArc || '',
      reason: d.reason || '',
      updates: Array.isArray(d.updates) ? d.updates : [],
      at: now() - started,
      shift: null,
    });
  });

  // layout-shift-audit already attributes a counted shift to the arriving
  // module; join its verdict onto that module's step rather than observing
  // shifts a second time. Field names read off its buildAuditDetail payload.
  const offShift = bus.on('spw:layout-shift', (event) => {
    const d = event?.detail || event || {};
    const owner = d.attributedTo;
    if (!owner?.id && !owner?.baseId) return;
    for (let i = steps.length - 1; i >= 0; i -= 1) {
      if (steps[i].id === owner.id || steps[i].baseId === owner.baseId) {
        steps[i].shift = {
          value: d.batchValue ?? null,
          reflowClass: d.reflowClass || null,
          withinMs: d.attributedWithinMs ?? null,
          by: d.attributedBy || null,
        };
        break;
      }
    }
  });

  unsubscribe = () => {
    offMount?.();
    offShift?.();
  };
  return unsubscribe;
}

export const LOAD_TRACE_API = Object.freeze({
  steps: getLoadSteps,
  summary: summarizeLoadTrace,
  stepTo,
  highlight: highlightStep,
  clear: clearLoadTraceHighlight,
});
