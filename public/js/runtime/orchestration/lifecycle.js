/** Mount invocation, lifecycle records, and coordinated teardown. Scheduling lives in loader.js. */
import { isFn } from '../browser-primitives.js';
import { resolveModuleMount } from '../catalog/export-contract.js';

export const MODULE_TIMING_STAGES = Object.freeze([
  'scheduled',
  'loading',
  'mounted',
  'observed',
  'settled',
  'unmounting',
  'unmounted',
  'failed',
]);

export function normalizeMountHandle(result) {
  if (isFn(result)) {
    return { cleanup: result, refresh: null };
  }

  if (result && typeof result === 'object') {
    return {
      cleanup:
        (isFn(result.cleanup) && result.cleanup)
        || (isFn(result.destroy) && result.destroy)
        || null,
      refresh: isFn(result.refresh) ? result.refresh : null,
    };
  }

  return { cleanup: null, refresh: null };
}

export function mountModuleDefinition(def, mod, ctx, root) {
  if (typeof def?.mount === 'function') {
    return def.mount(mod, ctx, root);
  }

  const resolved = resolveModuleMount(mod);
  if (!resolved?.fn) {
    throw new TypeError(`[module-loader] ${def.id} has no resolvable mount export.`);
  }
  const result = resolved.fn(ctx, root);
  // Canonical module exports may declare refresh beside mount. Preserve a
  // mount-returned refresh when present; otherwise attach the export-level
  // refresh promised by module-export-contract.js.
  // Catalog adapters (def.mount) already return full handles and skip this path.
  if (typeof resolved.surface?.refresh !== 'function') return result;
  return Promise.resolve(result).then((mounted) => {
    const handle = normalizeMountHandle(mounted);
    const exportRefresh = (nextCtx) => resolved.surface.refresh(nextCtx, root);
    return {
      cleanup: handle.cleanup,
      refresh: handle.refresh || exportRefresh,
    };
  });
}

export function normalizeModuleTimingStage(stage = 'scheduled') {
  return MODULE_TIMING_STAGES.includes(stage) ? stage : 'scheduled';
}

export function pushModuleLifecycleStage(record, stage, detail = {}) {
  if (!record) return record;
  const normalizedStage = normalizeModuleTimingStage(stage);
  const at = Math.round(detail.at ?? performance.now());
  if (!Array.isArray(record.lifecycle)) record.lifecycle = [];
  const last = record.lifecycle[record.lifecycle.length - 1];
  if (last?.stage !== normalizedStage || last?.at !== at) {
    record.lifecycle.push({
      stage: normalizedStage,
      at,
      note: detail.note || '',
    });
  }
  record.stage = normalizedStage;
  record.stageAt = at;
  if (normalizedStage === 'observed') record.observedAt = at;
  if (normalizedStage === 'settled') record.settledAt = at;
  return record;
}

export function emitModuleLifecycle(ctx, record, stage, detail = {}) {
  pushModuleLifecycleStage(record, stage, detail);
  ctx?.bus?.emit?.('spw:module-lifecycle', {
    id: record?.id || null,
    baseId: record?.baseId || null,
    layer: record?.layer || null,
    stage: record?.stage || stage,
    at: record?.stageAt || Math.round(performance.now()),
    note: detail.note || '',
    route: ctx?.route || null,
    root: record?.root || null,
    transportHref: record?.transportHref || null,
    affordances: record?.orchestration?.capabilities?.affordances || [],
  });
  return record;
}

export function summarizeModuleLifecycle(record) {
  const lifecycle = Array.isArray(record?.lifecycle) ? record.lifecycle : [];
  return lifecycle.map((entry) => entry.stage).join(' > ');
}

export function createModuleDisposal({ logger, logRelationships, annotateModuleTarget, scheduleRuntimeTokenUpdate }) {
    const pendingUnmounts = new WeakMap();

  function unmountModuleRecord(record, ctx) {
    if (pendingUnmounts.has(record)) return pendingUnmounts.get(record);
    if (!record || record.status !== 'mounted') return false;

    record.status = 'unmounting';
    // Publish ownership before invoking cleanup or emitting lifecycle events:
    // either can synchronously request another release of the same component.
    const pending = Promise.resolve()
      .then(() => performModuleUnmount(record, ctx))
      .finally(() => pendingUnmounts.delete(record));
    pendingUnmounts.set(record, pending);
    return pending;
  }

  async function performModuleUnmount(record, ctx) {
    pushModuleLifecycleStage(record, 'unmounting', { note: 'unmounting module' });
    emitModuleLifecycle(ctx, record, 'unmounting', {
      at: Math.round(performance.now()),
      note: 'unmounting module',
    });

    if (typeof record.unmount === 'function' || typeof record.cleanup === 'function') {
      try {
        // An explicit adapter owns teardown; running the returned cleanup as well
        // could dispose the same observers twice. It remains available on record
        // for adapters that need to delegate before releasing extra resources.
        if (typeof record.unmount === 'function') await record.unmount(record);
        else await record.cleanup();
      } catch (err) {
        logger?.error(
          `module unmount failed: ${record.id}`,
          { message: err?.message || String(err) },
          logRelationships.LIFECYCLE,
        );
      }
    }

    record.cleanup = null;
    record.unmount = null;
    record.refresh = null;
    record.status = 'unmounted';
    record.unmountedAt = Math.round(performance.now());

    pushModuleLifecycleStage(record, 'unmounted', { note: 'unmount complete' });
    emitModuleLifecycle(ctx, record, 'unmounted', {
      at: record.unmountedAt,
      note: 'unmount complete',
    });

    if (record.root) {
      annotateModuleTarget(record.root, record);
    }

    ctx.registry.remove(record.id);

    scheduleRuntimeTokenUpdate(ctx);
    return true;
  }

  async function unmountModuleById(id, ctx, options = {}) {
    if (!ctx || !id) return false;
    const records = Array.from(ctx.registry.values()).filter(
      (record) => (record.baseId === id || record.id === id)
        && (record.status === 'mounted' || pendingUnmounts.has(record))
    );
    if (!records.length) return false;

    let unmountedAny = false;
    for (const record of records) {
      const ok = await unmountModuleRecord(record, ctx);
      if (ok) unmountedAny = true;
    }
    return unmountedAny;
  }

  async function unmountAllModules(ctx) {
    if (!ctx) return 0;
    const records = Array.from(ctx.registry.values()).filter(
      (record) => record.status === 'mounted' || pendingUnmounts.has(record)
    );
    let count = 0;
    for (const record of records) {
      const ok = await unmountModuleRecord(record, ctx);
      if (ok) count += 1;
    }
    return count;
  }

  return { pendingUnmounts, unmountModuleRecord, unmountModuleById, unmountAllModules };
}
