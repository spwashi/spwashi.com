/**
 * Runtime helper utilities shared by the site bootstrap and portable compose
 * entrypoints.
 *
 * This module keeps the page shell legible: query parsing, mount timing,
 * registry handling, and guardrails for scripts that want to be portable.
 */

const RUNTIME_TIMING_POLICIES = new Set(['normal', 'eager', 'defer', 'quiet', 'manual']);
const MOUNT_WHEN_VALUES = new Set(['immediate', 'visible', 'idle', 'interaction', 'region']);
const HTML = document.documentElement;
const BODY = document.body;

/**
 * Small contract for code that wants to reuse the runtime's helper layer
 * without booting the whole site shell.
 */
export const SPW_RUNTIME_HELPERS_CONTRACT = Object.freeze({
  timingPolicies: Object.freeze([...RUNTIME_TIMING_POLICIES]),
  mountWhenValues: Object.freeze([...MOUNT_WHEN_VALUES]),
  portableUse:
    'Use this module when a page shell needs to read runtime policy, normalize mount handles, or share registry helpers without importing the whole bootstrap.',
});

export function safeQuery(selector, root = document) {
  try {
    return root.querySelector(selector);
  } catch {
    return null;
  }
}

export function safeQueryAll(selector, root = document) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch {
    return [];
  }
}

export function isFn(value) {
  return typeof value === 'function';
}

export function once(fn) {
  let called = false;
  let value;
  return (...args) => {
    if (called) return value;
    called = true;
    value = fn(...args);
    return value;
  };
}

export function onIdle(callback, timeout = 1200) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  }
  const fallbackDelay = Number.isFinite(timeout) && timeout > 0 ? timeout : 180;
  return window.setTimeout(
    () => callback({ didTimeout: true, timeRemaining: () => 0 }),
    fallbackDelay
  );
}

export function cancelIdle(handle) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
}

export function whenDocumentReady() {
  if (document.readyState === 'loading') {
    return new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }
  return Promise.resolve();
}

export function whenWindowLoaded() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener('load', resolve, { once: true });
  });
}

export function parseFeatureList(value) {
  if (!value || typeof value !== 'string') return new Set();
  return new Set(
    value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

export function normalizeRuntimeToken(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function readDelimitedSet(value = '') {
  return new Set(
    String(value || '')
      .split(/[\s,]+/)
      .map(normalizeRuntimeToken)
      .filter(Boolean)
  );
}

export function readModuleTimingMap(value = '') {
  const map = new Map();
  String(value || '')
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const [rawId, rawWhen] = item.split(':');
      const id = normalizeRuntimeToken(rawId);
      const when = normalizeRuntimeToken(rawWhen);
      if (id && MOUNT_WHEN_VALUES.has(when)) {
        map.set(id, when);
      }
    });
  return map;
}

export function readRuntimePolicy() {
  const params = new URLSearchParams(window.location.search);
  const rawTiming =
    params.get('spw-runtime-timing')
    || params.get('runtime-timing')
    || HTML?.dataset.spwRuntimeTiming
    || BODY?.dataset.spwRuntimeTiming
    || 'normal';
  const timing = RUNTIME_TIMING_POLICIES.has(normalizeRuntimeToken(rawTiming))
    ? normalizeRuntimeToken(rawTiming)
    : 'normal';
  const delay = Number.parseInt(
    params.get('spw-module-delay')
    || params.get('module-delay')
    || HTML?.dataset.spwModuleDelay
    || BODY?.dataset.spwModuleDelay
    || '0',
    10
  );
  const auditValue =
    params.get('spw-module-audit')
    || params.get('module-audit')
    || HTML?.dataset.spwModuleAudit
    || BODY?.dataset.spwModuleAudit
    || '';
  const visualValue =
    params.get('spw-module-visuals')
    || params.get('module-visuals')
    || HTML?.dataset.spwModuleVisuals
    || BODY?.dataset.spwModuleVisuals
    || '';

  return {
    timing,
    audit: ['1', 'true', 'on', 'yes', '*'].includes(String(auditValue).toLowerCase()),
    visuals: ['1', 'true', 'on', 'yes', '*'].includes(String(visualValue).toLowerCase()),
    delay: Number.isFinite(delay) && delay > 0 ? Math.min(delay, 5000) : 0,
    only: readDelimitedSet(params.get('spw-module-only') || params.get('module-only')),
    skip: readDelimitedSet(params.get('spw-module-skip') || params.get('module-skip')),
    timingByModule: readModuleTimingMap(params.get('spw-module-timing') || params.get('module-timing')),
  };
}

export function inferRuntimePosture(policy) {
  if (!policy) return 'minimal';
  if (policy.visuals && policy.timing === 'eager') return 'theatrical';
  if (policy.visuals) return 'resonant';
  if (
    policy.audit
    || policy.timing !== 'normal'
    || policy.delay
    || policy.only.size
    || policy.skip.size
    || policy.timingByModule.size
  ) {
    return 'precision';
  }
  return 'minimal';
}

/**
 * Describe the active runtime policy as a short sentence for logs, datasets,
 * or screenshots.
 */
export function describeRuntimePolicy(policy) {
  if (!policy) return 'runtime policy unavailable';

  const parts = [
    `timing:${policy.timing || 'normal'}`,
    `audit:${policy.audit ? 'on' : 'off'}`,
    `visuals:${policy.visuals ? 'on' : 'off'}`,
  ];

  if (policy.delay) parts.push(`delay:${policy.delay}ms`);
  if (policy.only?.size) parts.push(`only:${[...policy.only].join(',')}`);
  if (policy.skip?.size) parts.push(`skip:${[...policy.skip].join(',')}`);
  if (policy.timingByModule?.size) parts.push(`per-module:${policy.timingByModule.size}`);

  return parts.join(' · ');
}

export function createRegistry() {
  const records = new Map();

  function set(id, record) {
    records.set(id, record);
    return record;
  }

  function get(id) {
    return records.get(id) || null;
  }

  function has(id) {
    return records.has(id);
  }

  function remove(id) {
    records.delete(id);
  }

  function values() {
    return [...records.values()];
  }

  function cleanupAll() {
    for (const record of records.values()) {
      try {
        record.cleanup?.();
      } catch (error) {
        console.warn(`[runtime-helpers] cleanup failed for ${record.id}`, error);
      }
    }
    records.clear();
  }

  return {
    set,
    get,
    has,
    remove,
    values,
    cleanupAll,
  };
}

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
