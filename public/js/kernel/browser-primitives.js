/** Portable browser scheduling, query, and mount-root primitives. No catalog or policy dependencies. */

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

function isDomNode(value) {
  return Boolean(value) && (value.nodeType === 1 || value.nodeType === 9 || typeof value.querySelector === 'function');
}

/** Loader calls mount(ctx, root). Prefer the matched node over the context object. */
export function resolveMountRoot(ctx, root, fallback = typeof document !== 'undefined' ? document : null) {
  if (isDomNode(root)) return root;
  if (isDomNode(ctx?.root)) return ctx.root;
  if (isDomNode(ctx?.body)) return ctx.body;
  return fallback;
}

/** Document that owns the matched root. Image/concept observers need body/documentElement. */
export function resolveOwnerDocument(ctx, root, fallback = typeof document !== 'undefined' ? document : null) {
  const host = resolveMountRoot(ctx, root, fallback);
  if (!host) return fallback;
  if (host.nodeType === 9) return host;
  return host.ownerDocument || fallback;
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

const SHARED_INTERSECTION_LANES = new Map();

function intersectionLaneKey(options = {}) {
  const threshold = Array.isArray(options.threshold)
    ? options.threshold.join(',')
    : String(options.threshold ?? 0);
  return [
    options.root ? 'custom-root' : 'viewport',
    options.rootMargin || '0px',
    threshold,
  ].join('|');
}

/**
 * One IntersectionObserver per (root, rootMargin, threshold) lane.
 * Callers keep their own callbacks; the observer instance is shared so later
 * modules do not add another viewport watcher for the same geometry.
 */
export function observeIntersections(options = {}) {
  const { callback, ...ioOptions } = options;
  if (typeof IntersectionObserver !== 'function') {
    return {
      observe() {},
      unobserve() {},
      disconnect() {},
    };
  }

  const key = intersectionLaneKey(ioOptions);
  let lane = SHARED_INTERSECTION_LANES.get(key);
  if (!lane) {
    const listeners = new Map();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const cbs = listeners.get(entry.target);
        if (!cbs) continue;
        for (const cb of cbs) cb(entry);
      }
    }, ioOptions);
    lane = { observer, listeners, users: 0 };
    SHARED_INTERSECTION_LANES.set(key, lane);
  }

  lane.users += 1;
  const owned = new Set();
  const handle = {
    observe(el) {
      if (!(el instanceof Element) || owned.has(el)) return;
      let cbs = lane.listeners.get(el);
      if (!cbs) {
        cbs = new Set();
        lane.listeners.set(el, cbs);
        lane.observer.observe(el);
      }
      if (typeof callback === 'function') cbs.add(callback);
      owned.add(el);
    },
    unobserve(el) {
      if (!owned.has(el)) return;
      owned.delete(el);
      const cbs = lane.listeners.get(el);
      if (!cbs) return;
      if (typeof callback === 'function') cbs.delete(callback);
      if (!cbs.size) {
        lane.listeners.delete(el);
        lane.observer.unobserve(el);
      }
    },
    disconnect() {
      for (const el of [...owned]) handle.unobserve(el);
      lane.users -= 1;
      if (lane.users <= 0) {
        lane.observer.disconnect();
        SHARED_INTERSECTION_LANES.delete(key);
      }
    },
  };
  return handle;
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
