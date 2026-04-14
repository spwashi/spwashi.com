/**
 * site.js
 * --------------------------------------------------------------------------
 * Purpose
 * - Minimal staged runtime bootstrap for spwashi.com.
 * - Restore a sane starting point after removing heavier JS.
 * - Provide explicit lifecycle contracts for future modules:
 *   core -> feature hydration -> idle enhancements.
 * - Make cleanup and refresh first-class so old modules can be reintroduced
 *   safely, one at a time.
 *
 * Design constraints
 * - Do not hijack scrolling.
 * - Do not continuously measure layout in core runtime.
 * - Do not mount modules unless a route or DOM selector proves they are needed.
 * - Do not assume every module supports refresh/cleanup yet.
 * - Keep this file useful even before all modules are migrated.
 *
 * Page lifecycle
 * - booting
 * - interactive
 * - hydrated
 * - enhanced
 *
 * Region lifecycle
 * - queued
 * - hydrating
 * - interactive
 * - enhanced
 *
 * Module contract
 * A module definition should provide:
 * - id: unique runtime id
 * - layer: "core" | "feature" | "enhancement"
 * - when: "immediate" | "visible" | "idle" | "interaction"
 * - selector?: CSS selector for feature sniffing
 * - route?: string | string[] route surface(s)
 * - load(): Promise<module>
 * - mount(mod, ctx, root?): cleanup fn | { cleanup?, refresh? } | void
 *
 * Optional future exports for modules
 * - cleanup(): void
 * - refresh(nextCtx): void
 *
 * Notes
 * - This file intentionally avoids importing heavy modules at top-level.
 * - Reintroduce modules by adding them to FEATURE_DEFS or ENHANCEMENT_DEFS.
 * - Keep core small until route behavior is verified as stable.
 * --------------------------------------------------------------------------
 */

/* ==========================================================================
   1. Runtime constants
   ========================================================================== */

const PAGE_STATES = {
  BOOTING: 'booting',
  INTERACTIVE: 'interactive',
  HYDRATED: 'hydrated',
  ENHANCED: 'enhanced',
};

const REGION_STATES = {
  QUEUED: 'queued',
  HYDRATING: 'hydrating',
  INTERACTIVE: 'interactive',
  ENHANCED: 'enhanced',
};

const MODULE_LAYERS = {
  CORE: 'core',
  FEATURE: 'feature',
  ENHANCEMENT: 'enhancement',
};

const MOUNT_WHEN = {
  IMMEDIATE: 'immediate',
  VISIBLE: 'visible',
  IDLE: 'idle',
  INTERACTION: 'interaction',
};

const HTML = document.documentElement;
const BODY = document.body;
const ROOT_MAIN = document.querySelector('main');
const SITE_SURFACE = BODY?.dataset?.spwSurface || 'default';

/* ==========================================================================
   2. Small runtime helpers
   ========================================================================== */

function setPageState(state) {
  HTML.dataset.spwPageState = state;
}

function setRegionState(el, state) {
  if (!el || !(el instanceof HTMLElement)) return;
  el.dataset.spwRegionState = state;
}

function safeQuery(selector, root = document) {
  try {
    return root.querySelector(selector);
  } catch {
    return null;
  }
}

function safeQueryAll(selector, root = document) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch {
    return [];
  }
}

function matchesRoute(def) {
  if (!def.route) return true;
  if (Array.isArray(def.route)) return def.route.includes(SITE_SURFACE);
  return def.route === SITE_SURFACE;
}

function hasSelector(def) {
  if (!def.selector) return true;
  return Boolean(safeQuery(def.selector));
}

function getRoots(def) {
  if (!def.selector) return [document.body];
  const matches = safeQueryAll(def.selector);
  return matches.length ? matches : [];
}

function isFn(value) {
  return typeof value === 'function';
}

function once(fn) {
  let called = false;
  let value;
  return (...args) => {
    if (called) return value;
    called = true;
    value = fn(...args);
    return value;
  };
}

function onIdle(callback, timeout = 1200) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  }
  return window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 0 }), 180);
}

function cancelIdle(handle) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
}

function whenDocumentReady() {
  if (document.readyState === 'loading') {
    return new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }
  return Promise.resolve();
}

function whenWindowLoaded() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener('load', resolve, { once: true });
  });
}

/* ==========================================================================
   3. Tiny event bus
   --------------------------------------------------------------------------
   Keep this small. Enough for lifecycle and future contracts.
   ========================================================================== */

function createBus() {
  const target = new EventTarget();

  return {
    on(type, handler, options) {
      target.addEventListener(type, handler, options);
      return () => target.removeEventListener(type, handler, options);
    },
    emit(type, detail = {}) {
      target.dispatchEvent(new CustomEvent(type, { detail }));
    },
  };
}

/* ==========================================================================
   4. Runtime registry
   ========================================================================== */

function createRegistry() {
  /** @type {Map<string, {
   *   id: string,
   *   layer: string,
   *   status: 'idle' | 'mounted' | 'failed',
   *   cleanup: null | (() => void),
   *   refresh: null | ((ctx: object) => void),
   *   root: Element | null,
   *   mountedAt: number | null,
   *   error: unknown
   * }>} */
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
        console.warn(`[site.js] cleanup failed for ${record.id}`, error);
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

/* ==========================================================================
   5. Cleanup / refresh normalization
   ========================================================================== */

function normalizeMountHandle(result) {
  if (isFn(result)) {
    return { cleanup: result, refresh: null };
  }

  if (result && typeof result === 'object') {
    return {
      cleanup: isFn(result.cleanup) ? result.cleanup : null,
      refresh: isFn(result.refresh) ? result.refresh : null,
    };
  }

  return { cleanup: null, refresh: null };
}

/* ==========================================================================
   6. Runtime context
   ========================================================================== */

function createRuntimeContext() {
  const bus = createBus();
  const registry = createRegistry();

  const ctx = {
    version: 'site-runtime-v0.1',
    bus,
    registry,
    html: HTML,
    body: BODY,
    main: ROOT_MAIN,
    route: SITE_SURFACE,
    now: () => performance.now(),
    features: parseFeatureList(BODY?.dataset?.spwFeatures),
    routeFamily: parseFeatureList(BODY?.dataset?.spwRouteFamily),
    debug: parseFeatureList(HTML?.dataset?.spwDebug || BODY?.dataset?.spwDebug),
    observers: new Set(),
    timers: new Set(),
    cleanupStack: [],
  };

  ctx.addCleanup = (fn) => {
    if (!isFn(fn)) return () => {};
    ctx.cleanupStack.push(fn);
    return () => {
      const idx = ctx.cleanupStack.indexOf(fn);
      if (idx >= 0) ctx.cleanupStack.splice(idx, 1);
    };
  };

  ctx.addTimer = (timerId) => {
    ctx.timers.add(timerId);
    return timerId;
  };

  ctx.clearTimers = () => {
    for (const timerId of ctx.timers) {
      window.clearTimeout(timerId);
      window.clearInterval(timerId);
      cancelIdle(timerId);
    }
    ctx.timers.clear();
  };

  ctx.addObserver = (observer) => {
    if (observer) ctx.observers.add(observer);
    return observer;
  };

  ctx.disconnectObservers = () => {
    for (const observer of ctx.observers) {
      try {
        observer.disconnect?.();
      } catch (error) {
        console.warn('[site.js] observer disconnect failed', error);
      }
    }
    ctx.observers.clear();
  };

  ctx.destroy = () => {
    ctx.registry.cleanupAll();
    ctx.disconnectObservers();
    ctx.clearTimers();
    for (const fn of ctx.cleanupStack.splice(0)) {
      try {
        fn();
      } catch (error) {
        console.warn('[site.js] context cleanup failed', error);
      }
    }
  };

  return ctx;
}

function parseFeatureList(value) {
  if (!value || typeof value !== 'string') return new Set();
  return new Set(
    value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

/* ==========================================================================
   7. Minimal core behavior
   --------------------------------------------------------------------------
   Intentionally light. No scroll hijacking. No viewport ranking.
   ========================================================================== */

function initMinimalSiteCore(ctx) {
  const cleanups = [];

  cleanups.push(bindModeGroups(ctx));
  cleanups.push(bindExplicitFrameActivation(ctx));
  cleanups.push(bindHashLandingState(ctx));
  cleanups.push(bindHashChangeRefresh(ctx));

  return {
    cleanup() {
      for (const fn of cleanups) {
        try {
          fn?.();
        } catch (error) {
          console.warn('[site.js] core cleanup failed', error);
        }
      }
    },
    refresh(nextCtx) {
      // lightweight refresh hook for future route transitions
      nextCtx?.bus?.emit('spw:core-refresh', { route: nextCtx.route });
    },
  };
}

function bindModeGroups(ctx) {
  const buttons = safeQueryAll('[data-mode-group][data-set-mode]');
  if (!buttons.length) return () => {};

  const grouped = new Map();

  for (const button of buttons) {
    const group = button.getAttribute('data-mode-group');
    if (!group) continue;
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group).push(button);
  }

  function applyMode(group, mode) {
    const groupButtons = grouped.get(group) || [];
    for (const button of groupButtons) {
      const isActive = button.getAttribute('data-set-mode') === mode;
      button.setAttribute('aria-pressed', String(isActive));
    }

    const panels = safeQueryAll(`[data-mode-group="${CSS.escape(group)}"][data-mode-panel]`);
    for (const panel of panels) {
      const show = panel.getAttribute('data-mode-panel') === mode;
      panel.hidden = !show;
    }

    ctx.bus.emit('spw:mode-change', { group, mode });
  }

  const handlers = [];

  for (const button of buttons) {
    const handler = (event) => {
      event.preventDefault();
      const group = button.getAttribute('data-mode-group');
      const mode = button.getAttribute('data-set-mode');
      if (!group || !mode) return;
      applyMode(group, mode);
    };
    button.addEventListener('click', handler);
    handlers.push(() => button.removeEventListener('click', handler));
  }

  return () => {
    for (const cleanup of handlers) cleanup();
  };
}

function bindExplicitFrameActivation(ctx) {
  const frames = safeQueryAll('.site-frame, [data-spw-kind="frame"]');
  if (!frames.length) return () => {};

  function setActiveFrame(nextFrame) {
    for (const frame of frames) {
      const isActive = frame === nextFrame;
      frame.classList.toggle('is-active-frame', isActive);
      frame.dataset.spwActive = isActive ? 'true' : 'false';
    }

    ctx.bus.emit('spw:frame-change', {
      id: nextFrame?.id || null,
      frame: nextFrame || null,
      route: ctx.route,
      source: 'explicit',
    });
  }

  const handlers = [];

  for (const frame of frames) {
    const focusHandler = () => setActiveFrame(frame);
    const pointerHandler = () => setActiveFrame(frame);

    frame.addEventListener('focusin', focusHandler);
    frame.addEventListener('pointerdown', pointerHandler, { passive: true });

    handlers.push(() => frame.removeEventListener('focusin', focusHandler));
    handlers.push(() => frame.removeEventListener('pointerdown', pointerHandler));
  }

  const initialTarget = resolveHashTargetFrame() || frames[0] || null;
  if (initialTarget) setActiveFrame(initialTarget);

  return () => {
    for (const cleanup of handlers) cleanup();
  };
}

function resolveHashTargetFrame() {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;
  const target = safeQuery(hash);
  if (!target) return null;
  return target.closest('.site-frame, [data-spw-kind="frame"]') || null;
}

function bindHashLandingState(ctx) {
  function applyHashState() {
    const frame = resolveHashTargetFrame();
    if (!frame) return;
    frame.classList.add('is-active-frame');
    frame.dataset.spwActive = 'true';
    ctx.bus.emit('spw:hash-target', { frame, id: frame.id || null });
  }

  const handle = window.setTimeout(applyHashState, 0);
  ctx.addTimer(handle);

  return () => window.clearTimeout(handle);
}

function bindHashChangeRefresh(ctx) {
  const handler = () => {
    const frame = resolveHashTargetFrame();
    if (!frame) return;
    frame.classList.add('is-active-frame');
    frame.dataset.spwActive = 'true';
    ctx.bus.emit('spw:hash-target', { frame, id: frame.id || null });
  };

  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}

/* ==========================================================================
   8. Module definitions
   --------------------------------------------------------------------------
   Start small. Reintroduce modules one by one.
   ========================================================================== */

const CORE_DEFS = [
  {
    id: 'site-settings',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./site-settings.js'),
    mount: (mod, ctx) => {
      const fn = mod?.applySiteSettings;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'shell-disclosure',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./spw-shell-disclosure.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwShellDisclosure;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'site-core-minimal',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: async () => ({ initMinimalSiteCore }),
    mount: (mod, ctx) => {
      const fn = mod?.initMinimalSiteCore;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];

/**
 * Feature modules
 * --------------------------------------------------------------------------
 * Reintroduce route-specific behavior here.
 * Start with low-risk, high-value modules only.
 */
const FEATURE_DEFS = [
  {
    id: 'blog-interpreter',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-blog-interpreter]',
    route: 'blog',
    load: () => import('./blog-interpreter.js'),
    mount: (mod, ctx, root) => {
      const fn = mod?.initBlogInterpreter;
      if (!isFn(fn)) return;
      return fn({ ...ctx, root });
    },
  },
  {
    id: 'blog-specimens',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    selector: '.specimen-card, #specimen-index',
    route: 'blog',
    load: () => import('./blog-specimens.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initBlogSpecimens;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'settings-page',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'settings',
    selector: '[data-spw-surface="settings"], main',
    load: () => import('./site-settings-page.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSiteSettingsPage;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];

/**
 * Enhancements
 * --------------------------------------------------------------------------
 * Only loaded after the page is already interactive/hydrated.
 * Add more later, but keep this sparse until performance is verified.
 */
const ENHANCEMENT_DEFS = [
  {
    id: 'logo-runtime',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.spw-logo, [data-spw-logo]',
    load: () => import('./spw-logo-runtime.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwLogoRuntime || mod?.initLogoRuntime;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'topic-discovery',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.spw-topic, [data-spw-topic]',
    load: () => import('./spw-topic-discovery.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwTopicDiscovery || mod?.initTopicDiscovery;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'component-semantics',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    load: () => import('./spw-component-semantics.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwComponentSemantics;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];

/* ==========================================================================
   9. Module mounting
   ========================================================================== */

function makeRecordId(def, root = null, index = 0) {
  if (!root || root === document.body) return def.id;
  const rootId = root.id || root.getAttribute('data-spw-id') || root.getAttribute('data-spw-kind') || index;
  return `${def.id}::${String(rootId)}`;
}

async function mountDefinition(def, ctx, root = null, index = 0) {
  const recordId = makeRecordId(def, root, index);

  if (ctx.registry.has(recordId)) return ctx.registry.get(recordId);

  ctx.registry.set(recordId, {
    id: recordId,
    layer: def.layer,
    status: 'idle',
    cleanup: null,
    refresh: null,
    root,
    mountedAt: null,
    error: null,
  });

  try {
    if (root instanceof HTMLElement) setRegionState(root, REGION_STATES.HYDRATING);

    const mod = await def.load();
    const result = await def.mount(mod, ctx, root);
    const handle = normalizeMountHandle(result);

    const record = {
      id: recordId,
      layer: def.layer,
      status: 'mounted',
      cleanup: handle.cleanup,
      refresh: handle.refresh,
      root,
      mountedAt: performance.now(),
      error: null,
    };

    ctx.registry.set(recordId, record);

    if (root instanceof HTMLElement) {
      const state =
        def.layer === MODULE_LAYERS.ENHANCEMENT
          ? REGION_STATES.ENHANCED
          : REGION_STATES.INTERACTIVE;
      setRegionState(root, state);
    }

    ctx.bus.emit('spw:module-mounted', {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      route: ctx.route,
      root,
    });

    return record;
  } catch (error) {
    console.warn(`[site.js] module mount failed: ${def.id}`, error);

    const record = {
      id: recordId,
      layer: def.layer,
      status: 'failed',
      cleanup: null,
      refresh: null,
      root,
      mountedAt: null,
      error,
    };

    ctx.registry.set(recordId, record);

    if (root instanceof HTMLElement) setRegionState(root, REGION_STATES.QUEUED);

    ctx.bus.emit('spw:module-failed', {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      route: ctx.route,
      root,
      error,
    });

    return record;
  }
}

async function mountImmediateLayer(defs, ctx) {
  for (const def of defs) {
    if (!matchesRoute(def) || !hasSelector(def)) continue;
    await mountDefinition(def, ctx, null, 0);
  }
}

async function mountVisibleFeatures(defs, ctx) {
  const visibleDefs = defs.filter((def) => def.when === MOUNT_WHEN.VISIBLE && matchesRoute(def) && hasSelector(def));
  if (!visibleDefs.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        const defsForEl = visibleDefs.filter((def) => el.matches(def.selector));
        for (const def of defsForEl) {
          void mountDefinition(def, ctx, el);
        }
        observer.unobserve(el);
      }
    },
    {
      root: null,
      rootMargin: '240px 0px',
      threshold: 0.01,
    }
  );

  ctx.addObserver(observer);

  for (const def of visibleDefs) {
    const roots = getRoots(def);
    roots.forEach((el) => {
      if (el instanceof HTMLElement) {
        setRegionState(el, REGION_STATES.QUEUED);
      }
      observer.observe(el);
    });
  }
}

async function mountInteractionFeatures(defs, ctx) {
  const interactionDefs = defs.filter((def) => def.when === MOUNT_WHEN.INTERACTION && matchesRoute(def) && hasSelector(def));
  if (!interactionDefs.length) return;

  const activate = once(async () => {
    for (const def of interactionDefs) {
      const roots = getRoots(def);
      if (!roots.length) {
        await mountDefinition(def, ctx, null, 0);
        continue;
      }
      for (const [index, root] of roots.entries()) {
        await mountDefinition(def, ctx, root, index);
      }
    }
  });

  const handler = () => {
    void activate();
    cleanup();
  };

  const cleanup = () => {
    window.removeEventListener('pointerdown', handler, options);
    window.removeEventListener('keydown', handler, options);
    window.removeEventListener('touchstart', handler, options);
  };

  const options = { once: true, passive: true };
  window.addEventListener('pointerdown', handler, options);
  window.addEventListener('keydown', handler, options);
  window.addEventListener('touchstart', handler, options);

  ctx.addCleanup(cleanup);
}

function queueIdleEnhancements(defs, ctx) {
  const idleDefs = defs.filter((def) => def.when === MOUNT_WHEN.IDLE && matchesRoute(def) && hasSelector(def));
  if (!idleDefs.length) return;

  const handle = onIdle(async () => {
    for (const def of idleDefs) {
      const roots = getRoots(def);
      if (!roots.length) {
        await mountDefinition(def, ctx, null, 0);
        continue;
      }

      for (const [index, root] of roots.entries()) {
        await mountDefinition(def, ctx, root, index);
      }
    }

    setPageState(PAGE_STATES.ENHANCED);
    ctx.bus.emit('spw:page-enhanced', { route: ctx.route });
  });

  ctx.addTimer(handle);
}

/* ==========================================================================
   10. Refresh support
   --------------------------------------------------------------------------
   Future-safe hook for route transitions, font changes, or manual rebinds.
   ========================================================================== */

function refreshRuntime(ctx) {
  for (const record of ctx.registry.values()) {
    try {
      record.refresh?.(ctx);
    } catch (error) {
      console.warn(`[site.js] refresh failed for ${record.id}`, error);
    }
  }
  ctx.bus.emit('spw:runtime-refresh', { route: ctx.route });
}

/* ==========================================================================
   11. Public teardown / reinit hooks
   ========================================================================== */

let runtimeCtx = null;

function destroyRuntime() {
  if (!runtimeCtx) return;
  runtimeCtx.destroy();
  runtimeCtx = null;
  delete HTML.dataset.spwPageState;
}

async function bootSite() {
  await whenDocumentReady();

  runtimeCtx = createRuntimeContext();
  setPageState(PAGE_STATES.BOOTING);

  runtimeCtx.bus.emit('spw:page-boot', { route: runtimeCtx.route });

  await mountImmediateLayer(CORE_DEFS, runtimeCtx);
  await mountImmediateLayer(
    FEATURE_DEFS.filter((def) => def.when === MOUNT_WHEN.IMMEDIATE),
    runtimeCtx
  );

  setPageState(PAGE_STATES.INTERACTIVE);
  runtimeCtx.bus.emit('spw:page-interactive', { route: runtimeCtx.route });

  await mountVisibleFeatures(FEATURE_DEFS, runtimeCtx);
  await mountInteractionFeatures(FEATURE_DEFS, runtimeCtx);

  setPageState(PAGE_STATES.HYDRATED);
  runtimeCtx.bus.emit('spw:page-hydrated', { route: runtimeCtx.route });

  queueIdleEnhancements(ENHANCEMENT_DEFS, runtimeCtx);

  // refresh after full load in case late assets/fonts affect modules that opt in
  whenWindowLoaded().then(() => {
    if (!runtimeCtx) return;
    refreshRuntime(runtimeCtx);
  });

  return runtimeCtx;
}

/* ==========================================================================
   12. Dev / manual hooks
   ========================================================================== */

window.__SPW_SITE__ = {
  bootSite,
  destroyRuntime,
  refreshRuntime: () => runtimeCtx && refreshRuntime(runtimeCtx),
  getContext: () => runtimeCtx,
};

/* ==========================================================================
   13. Start
   ========================================================================== */

void bootSite();