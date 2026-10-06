/**
 * The bench, live: two readings of the design hub taken while it is open.
 *
 *   running   what the runtime has mounted on this page, and the last few
 *             changes to the root state, read from __SPW_SITE__ and from a
 *             MutationObserver on <html>
 *   combining how many cards one specimen can be: the product of the options
 *             on each axis of the component ecology specimen further down the
 *             page, with the current card written as one expression
 *
 * Both readings are expressions that change in place:
 *
 *   runtime[design]{mounted.41}<page>
 *   specimen[calm]{soft.rest.split}
 *
 * The module writes only inside its own host. It reads the specimen's
 * controls and presses them for a shuffle; it never writes to the root.
 * With scripts off the frame keeps its resting sentences and its links.
 */

const ECOLOGY_CONTROL = '[data-design-ecology-set]';
const AXIS_ORDER = ['environment', 'variant', 'behavior', 'posture'];
const ROOT_LOG_LIMIT = 5;

/** @param {Array<{ id?: string, status?: string, layer?: string, describes?: string|null }>} records */
export function summarizeModules(records = []) {
  const list = Array.isArray(records) ? records.filter((r) => r && r.id) : [];
  const mounted = list.filter((r) => r.status === 'mounted');
  const byLayer = {};
  for (const record of mounted) byLayer[record.layer || 'other'] = (byLayer[record.layer || 'other'] || 0) + 1;
  return {
    total: list.length,
    mounted: mounted.map((r) => ({ id: r.id, layer: r.layer || 'other', describes: r.describes || '' })).sort((a, b) => a.id.localeCompare(b.id)),
    waiting: list.length - mounted.length,
    byLayer,
  };
}

export function runtimeExpression(summary, surface = 'page') {
  const name = String(surface || 'page').replace(/[^a-z0-9_]+/gi, '_');
  return `runtime[${name}]{mounted.${summary.mounted.length}}<${summary.waiting}_waiting>`;
}

/**
 * Axes of the specimen, read from its controls: "environment:calm" and so on.
 * @param {Array<{ set?: string, pressed?: boolean }>} controls
 */
export function readAxes(controls = []) {
  const axes = new Map();
  for (const control of controls) {
    const [axis, value] = String(control?.set || '').split(':');
    if (!axis || !value) continue;
    if (!axes.has(axis)) axes.set(axis, { values: [], current: '' });
    const entry = axes.get(axis);
    if (!entry.values.includes(value)) entry.values.push(value);
    if (control.pressed) entry.current = value;
  }
  const ordered = [...axes.keys()].sort((a, b) => {
    const ia = AXIS_ORDER.indexOf(a); const ib = AXIS_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  return ordered.map((axis) => ({ axis, ...axes.get(axis) }));
}

export function countCombinations(axes = []) {
  return axes.reduce((product, axis) => product * Math.max(1, axis.values.length), axes.length ? 1 : 0);
}

/** The first axis is the mode; the rest are the parts, in order. */
export function specimenExpression(axes = []) {
  if (!axes.length) return 'specimen{}';
  const [mode, ...parts] = axes.map((axis) => axis.current || axis.values[0] || 'unset');
  return `specimen[${mode}]{${parts.join('.')}}`;
}

function readControls(doc) {
  return [...doc.querySelectorAll(ECOLOGY_CONTROL)].map((el) => ({
    el,
    set: el.getAttribute('data-design-ecology-set') || '',
    pressed: el.getAttribute('aria-pressed') === 'true',
  }));
}

export function initBenchLive(ctx = {}) {
  const doc = ctx.root?.ownerDocument || (typeof document !== 'undefined' ? document : null);
  const host = ctx.root?.matches?.('[data-bench-live]') ? ctx.root : doc?.querySelector('[data-bench-live]');
  if (!doc || !host) return () => {};

  const $ = (name) => host.querySelector(`[data-bench-${name}]`);
  const tried = new Set();
  const rootLog = [];
  const abort = new AbortController();
  const { signal } = abort;

  const renderRuntime = () => {
    const site = globalThis.__SPW_SITE__;
    const records = typeof site?.snapshotModules === 'function' ? site.snapshotModules() : [];
    const summary = summarizeModules(records);
    const expr = $('runtime-expression');
    if (expr) expr.textContent = runtimeExpression(summary, doc.body?.dataset?.spwSurface);
    const list = $('modules');
    if (list) {
      list.replaceChildren(...summary.mounted.map((record) => {
        const pill = doc.createElement('span');
        pill.className = 'spec-pill';
        pill.textContent = record.id;
        pill.title = record.describes ? `${record.layer} · ${record.describes}` : record.layer;
        pill.tabIndex = 0;
        return pill;
      }));
    }
    const layers = $('layers');
    if (layers) {
      layers.textContent = Object.entries(summary.byLayer).map(([layer, count]) => `${count} ${layer}`).join(' · ')
        || 'The runtime has not reported any modules yet.';
    }
    renderRegisterCount();
  };

  const renderRegisterCount = () => {
    const registers = [...doc.documentElement.attributes].filter((attr) => attr.name.startsWith('data-spw-'));
    const count = $('register-count');
    if (count) count.textContent = String(registers.length);
  };

  const renderRootLog = () => {
    const log = $('root-log');
    if (!log) return;
    // Always five rows, so the first changes to arrive do not push the page.
    const rows = Array.from({ length: ROOT_LOG_LIMIT }, (_, index) => rootLog[index] || null);
    log.replaceChildren(...rows.map((entry) => {
      const item = doc.createElement('li');
      const code = doc.createElement('code');
      code.textContent = entry
        ? `${entry.name.replace(/^data-spw-/, '')} = ${entry.value === null ? '(removed)' : entry.value.slice(0, 48) || '""'}`
        : '·';
      item.append(code);
      return item;
    }));
  };

  const renderCombo = () => {
    const axes = readAxes(readControls(doc));
    const total = countCombinations(axes);
    const expression = specimenExpression(axes);
    if (axes.length) tried.add(expression);
    const expr = $('combo-expression');
    if (expr) expr.textContent = expression;
    const product = $('combo-product');
    if (product && axes.length) product.textContent = `${axes.map((axis) => axis.values.length).join(' × ')} = ${total}`;
    const seen = $('combo-tried');
    if (seen) seen.textContent = total ? `${tried.size} of ${total} seen this visit` : '';
  };

  let frame = 0;
  const schedule = (fn) => {
    if (frame) return;
    frame = globalThis.requestAnimationFrame ? globalThis.requestAnimationFrame(() => { frame = 0; fn(); }) : (fn(), 0);
  };

  // Root changes, as they happen. Reads only; the log lives inside the host.
  const observer = typeof MutationObserver === 'function'
    ? new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const name = mutation.attributeName || '';
        if (!name.startsWith('data-spw-')) continue;
        const value = doc.documentElement.getAttribute(name);
        if (rootLog[0]?.name === name && rootLog[0]?.value === value) continue;
        rootLog.unshift({ name, value });
      }
      rootLog.length = Math.min(rootLog.length, ROOT_LOG_LIMIT);
      schedule(() => { renderRootLog(); renderRegisterCount(); });
    })
    : null;
  observer?.observe(doc.documentElement, { attributes: true });

  doc.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest(ECOLOGY_CONTROL)) {
      globalThis.setTimeout(renderCombo, 0);
      return;
    }
    const action = target.closest('[data-bench-action]')?.getAttribute('data-bench-action');
    if (action === 'read') renderRuntime();
    if (action === 'shuffle') {
      const axes = readAxes(readControls(doc));
      for (const axis of axes) {
        const value = axis.values[Math.floor(Math.random() * axis.values.length)];
        doc.querySelector(`[data-design-ecology-set="${axis.axis}:${value}"]`)?.click();
      }
      globalThis.setTimeout(renderCombo, 0);
    }
  }, { signal });

  renderRuntime();
  renderCombo();
  host.dataset.benchLiveState = 'live';
  // Visible and idle modules keep arriving after this one; read once more.
  const settle = globalThis.setTimeout(renderRuntime, 4000);

  return () => {
    abort.abort();
    observer?.disconnect();
    globalThis.clearTimeout(settle);
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'design-bench-live',
  mount: (ctx, root) => initBenchLive({ root: root instanceof Element ? root : ctx?.root }),
  describes: 'bench[live]{runtime.root.combinations}<readout> lists the modules mounted on the design hub, logs root-state changes as they happen, and counts and shuffles the cards one specimen can be',
  timingArc: 'visible-lab',
  effectScope: ['local-dom', 'element-state', 'listeners'],
});
