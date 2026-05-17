import {
  PAGE_METADATA_REGION_SELECTOR,
  normalizeDocumentMetadata,
} from './kernel/page-metadata.js';
import {
  FRAME_SELECTOR,
  buildAxisGenome,
  inferTopographyKind,
  writeDatasetValue,
  writeDatasetValueIfMissing,
  writeStyleValue,
} from './kernel/dom-contracts.js';
import {
  applySpwQueryDisposition,
  installSpwCompositionConsole,
} from './kernel/instrumentation.js';
import { bus as sharedBus } from './kernel/bus.js';
import {
  PAGE_ARRIVAL,
  PAGE_ATTENTION_EVENT,
  PAGE_PRESENCE,
  PAGE_STATES,
  PAGE_TRANSITION_EVENT,
  annotateFloatingChrome,
  clearPageState,
  clearPageAttentionSequence,
  initPageAttentionLifecycle,
  schedulePageArrival,
  setPageState,
  setPageAttentionState,
  snapshotPageState,
} from './runtime/page-state.js';
import { annotatePageHooks } from './runtime/page-hooks.js';

/**
 * site.js
 * --------------------------------------------------------------------------
 * Purpose
 * - Minimal staged runtime bootstrap for spwashi.com.
 * - Provide explicit lifecycle contracts for:
 *   core -> feature hydration -> region enhancement -> idle enhancement.
 * - Give CSS and JS a shared semantic vocabulary for discoverable harmony.
 * - Keep cleanup and refresh first-class so older modules can be reintroduced
 *   safely and incrementally.
 *
 * Design constraints
 * - Do not hijack scrolling.
 * - Do not continuously rank regions on scroll.
 * - Do not mount modules unless route/DOM proves they are needed.
 * - Expose region state and harmony hints to CSS.
 * - Keep core small and region work bounded.
 *
 * Page lifecycle
 * - booting
 * - interactive
 * - hydrated
 * - region-enhanced
 * - enhanced
 *
 * Region lifecycle
 * - queued
 * - primed
 * - hydrating
 * - interactive
 * - enhanced
 * - settling
 *
 * Module contract
 * A module definition should provide:
 * - id
 * - layer: "core" | "feature" | "region" | "enhancement"
 * - when: "immediate" | "visible" | "idle" | "interaction" | "region"
 * - selector?: CSS selector
 * - route?: string | string[]
 * - reason?: human-readable load reason for audit surfaces
 * - rootMode?: "single" | "each"
 * - load(): Promise<module>
 * - mount(mod, ctx, root?): cleanup fn | { cleanup?, refresh? } | void
 *
 * Notes
 * - This file intentionally avoids importing heavier modules at top-level.
 * - Region enhancement is lightweight by default and mostly writes state.
 * - Reintroduce richer modules by adding them to FEATURE_DEFS, REGION_DEFS,
 *   or ENHANCEMENT_DEFS.
 * --------------------------------------------------------------------------
 */

/* ==========================================================================
   1. Runtime constants
   ========================================================================== */

const REGION_STATES = {
  QUEUED: 'queued',
  PRIMED: 'primed',
  HYDRATING: 'hydrating',
  INTERACTIVE: 'interactive',
  ENHANCED: 'enhanced',
  SETTLING: 'settling',
};

const MODULE_LAYERS = {
  CORE: 'core',
  FEATURE: 'feature',
  REGION: 'region',
  ENHANCEMENT: 'enhancement',
};

const MOUNT_WHEN = {
  IMMEDIATE: 'immediate',
  VISIBLE: 'visible',
  IDLE: 'idle',
  INTERACTION: 'interaction',
  REGION: 'region',
};

const RUNTIME_TIMING_POLICIES = new Set(['normal', 'eager', 'defer', 'quiet', 'manual']);

const HTML = document.documentElement;
const BODY = document.body;
const ROOT_MAIN = document.querySelector('main');
let SITE_SURFACE = BODY?.dataset?.spwSurface || 'default';

const REGION_SELECTOR = PAGE_METADATA_REGION_SELECTOR;
annotateFloatingChrome(document);
annotatePageHooks(document);

/* ==========================================================================
   2. Small runtime helpers
   ========================================================================== */

function setRegionState(el, state) {
  if (!el || !(el instanceof HTMLElement)) return;
  writeDatasetValue(el, 'spwRegionState', state);
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

function parseFeatureList(value) {
  if (!value || typeof value !== 'string') return new Set();
  return new Set(
    value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function setDataIfMissing(el, key, value) {
  writeDatasetValueIfMissing(el, key, value);
}

function readSet(...values) {
  return new Set(values.filter(Boolean));
}

function normalizeRuntimeToken(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readDelimitedSet(value = '') {
  return new Set(
    String(value || '')
      .split(/[\s,]+/)
      .map(normalizeRuntimeToken)
      .filter(Boolean)
  );
}

function readModuleTimingMap(value = '') {
  const map = new Map();
  String(value || '')
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const [rawId, rawWhen] = item.split(':');
      const id = normalizeRuntimeToken(rawId);
      const when = normalizeRuntimeToken(rawWhen);
      if (id && Object.values(MOUNT_WHEN).includes(when)) {
        map.set(id, when);
      }
    });
  return map;
}

function readRuntimePolicy() {
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

function inferRuntimePosture(policy) {
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

/* ==========================================================================
   3. Bus facade
   ========================================================================== */

function normalizeBusEventName(type = '') {
  const name = String(type || '').trim();
  return name.startsWith('spw:') ? name.slice(4) : name;
}

function createBus() {
  return {
    on(type, handler, options = {}) {
      return sharedBus.on(normalizeBusEventName(type), handler, options);
    },
    onAny(handler) {
      return sharedBus.onAny(handler);
    },
    recent(filter = null) {
      return sharedBus.recent(filter);
    },
    clearHistory() {
      sharedBus.clearHistory();
    },
    emit(type, detail = {}, options = {}) {
      const dispatchOptions = { ...options };
      if (!dispatchOptions.target) {
        dispatchOptions.target = document;
      }
      return sharedBus.emit(normalizeBusEventName(type), detail, {
        ...dispatchOptions,
      });
    },
    getDiagnostics() {
      return sharedBus.getDiagnostics();
    },
    setHistoryLimit(limit) {
      return sharedBus.setHistoryLimit(limit);
    },
    setMirrorToConsole(value) {
      return sharedBus.setMirrorToConsole(value);
    },
  };
}

/* ==========================================================================
   4. Runtime registry
   ========================================================================== */

function createRegistry() {
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
      cleanup:
        (isFn(result.cleanup) && result.cleanup)
        || (isFn(result.destroy) && result.destroy)
        || null,
      refresh: isFn(result.refresh) ? result.refresh : null,
    };
  }

  return { cleanup: null, refresh: null };
}

/* ==========================================================================
   6. Region profiling and harmony
   --------------------------------------------------------------------------
   This is the main new layer: a lightweight semantic read of regions that
   both CSS and JS can use without expensive choreography.
   ========================================================================== */

function collectRegions(root = document) {
  const regions = safeQueryAll(REGION_SELECTOR, root).filter((el) => el instanceof HTMLElement);
  const seen = new Set();
  const ordered = [];

  for (const el of regions) {
    if (seen.has(el)) continue;
    seen.add(el);
    ordered.push(el);
  }

  return ordered;
}

function inferRegionKind(el) {
  return inferTopographyKind(el, 'component');
}

function inferRegionRole(el) {
  if (el.dataset.spwRole) return el.dataset.spwRole;

  const text = (
    el.id ||
    el.getAttribute('aria-label') ||
    el.querySelector('h1,h2,h3,h4,strong')?.textContent ||
    ''
  ).toLowerCase();

  if (el.matches('nav')) return 'routing';
  if (text.includes('index') || text.includes('routes') || text.includes('navigation')) return 'routing';
  if (text.includes('plan') || text.includes('schema') || text.includes('structure')) return 'schema';
  if (text.includes('reference') || text.includes('register')) return 'reference';
  if (text.includes('settings')) return 'control';
  if (text.includes('hero') || text.includes('about') || text.includes('contact')) return 'orientation';

  return el.classList.contains('site-hero') ? 'orientation' : 'reference';
}

function inferRegionContext(el) {
  return (
    el.dataset.spwContext ||
    el.closest('[data-spw-context]')?.dataset?.spwContext ||
    BODY?.dataset?.spwContext ||
    'reading'
  );
}

function inferRegionSurface(el) {
  return (
    el.dataset.spwSurface ||
    el.closest('[data-spw-surface]')?.dataset?.spwSurface ||
    SITE_SURFACE
  );
}

function inferRegionHarmony(profile) {
  const role = profile.role;
  const kind = profile.kind;
  const context = profile.context;

  if (role === 'routing') return 'indexed';
  if (role === 'schema') return 'structured';
  if (role === 'reference') return 'measured';
  if (role === 'control') return 'responsive';
  if (role === 'orientation') return 'anchored';
  if (context === 'publishing') return 'editorial';
  if (kind === 'card') return 'modular';
  return 'ambient';
}

function inferRegionTempo(profile) {
  switch (profile.harmony) {
    case 'indexed': return 'snap';
    case 'structured': return 'deliberate';
    case 'responsive': return 'fast';
    case 'editorial': return 'settle';
    case 'anchored': return 'base';
    default: return 'base';
  }
}

function inferRegionDensity(profile) {
  if (profile.kind === 'card') return 'compact';
  if (profile.kind === 'panel') return 'medium';
  if (profile.role === 'reference') return 'reading';
  if (profile.role === 'schema') return 'dense';
  return 'medium';
}

function inferSpaceMotion() {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  if (width && width < 520) return 'fold';
  if (width && width < 840) return 'condense';
  if (width && width > 1320) return 'expand';
  return 'balance';
}

function buildRegionGenome(profile = {}) {
  return buildAxisGenome([
    ['kind', profile.kind],
    ['role', profile.role],
    ['context', profile.context],
    ['surface', profile.surface],
    ['harmony', profile.harmony],
    ['tempo', profile.tempo],
    ['density', profile.density],
  ]);
}

function buildRegionProfile(el, index = 0) {
  const kind = inferRegionKind(el);
  const role = inferRegionRole(el);
  const context = inferRegionContext(el);
  const surface = inferRegionSurface(el);

  const profile = {
    index,
    id: el.id || null,
    key: el.id || el.dataset.spwId || `${kind}-${index}`,
    kind,
    role,
    context,
    surface,
    harmony: '',
    tempo: '',
    density: '',
    genome: '',
    features: readSet(
      ...parseFeatureList(el.dataset.spwFeatures).values?.() || [],
      kind,
      role,
      context
    )
  };

  profile.harmony = inferRegionHarmony(profile);
  profile.tempo = inferRegionTempo(profile);
  profile.density = inferRegionDensity(profile);
  profile.genome = buildRegionGenome(profile);

  return profile;
}

function applyRegionProfile(el, profile) {
  setDataIfMissing(el, 'spwKind', profile.kind);
  setDataIfMissing(el, 'spwRole', profile.role);
  setDataIfMissing(el, 'spwContext', profile.context);
  setDataIfMissing(el, 'spwSurface', profile.surface);

  writeDatasetValue(el, 'spwHarmony', profile.harmony);
  writeDatasetValue(el, 'spwTempo', profile.tempo);
  writeDatasetValue(el, 'spwDensity', profile.density);
  writeDatasetValue(el, 'spwRegionKey', profile.key);
  writeDatasetValue(el, 'spwRegionGenome', profile.genome);
  writeStyleValue(el, '--region-index', String(profile.index));
}

function syncPageHarmony(ctx) {
  const profiles = ctx.regions.map((entry) => entry.profile);
  const harmonies = new Set(profiles.map((profile) => profile.harmony));
  const tempos = new Set(profiles.map((profile) => profile.tempo));

  writeDatasetValue(HTML, 'spwHarmonyField', [...harmonies].join(' '));
  writeDatasetValue(HTML, 'spwTempoField', [...tempos].join(' '));
  writeDatasetValue(HTML, 'spwSpaceMotion', inferSpaceMotion());
  writeStyleValue(HTML, '--region-count', String(profiles.length));
}

/* ==========================================================================
   7. Runtime context
   ========================================================================== */

function createRuntimeContext() {
  const bus = createBus();
  const registry = createRegistry();

  const ctx = {
    version: 'site-runtime-v0.2',
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
    runtimePolicy: readRuntimePolicy(),
    moduleAudit: [],
    moduleSkipAuditKeys: new Set(),
    observers: new Set(),
    timers: new Set(),
    pageAttentionTimers: new Set(),
    cleanupStack: [],
    regions: [],
  };

  writeDatasetValue(HTML, 'spwRuntimeTiming', ctx.runtimePolicy.timing);
  writeDatasetValue(HTML, 'spwRuntimePosture', inferRuntimePosture(ctx.runtimePolicy));
  writeDatasetValue(HTML, 'spwModuleAudit', ctx.runtimePolicy.audit ? 'on' : null);
  writeDatasetValue(HTML, 'spwModuleVisuals', ctx.runtimePolicy.visuals ? 'on' : null);
  if (ctx.runtimePolicy.delay) {
    writeDatasetValue(HTML, 'spwModuleDelay', String(ctx.runtimePolicy.delay));
  }

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
    ctx.regions = [];
  };

  return ctx;
}

function primeRegions(ctx) {
  const elements = collectRegions(document);
  ctx.regions = elements.map((el, index) => {
    const profile = buildRegionProfile(el, index);
    applyRegionProfile(el, profile);
    setRegionState(el, REGION_STATES.QUEUED);
    return {
      el,
      profile,
      visible: false,
      enhanced: false,
      active: false,
    };
  });

  syncPageHarmony(ctx);

  ctx.bus.emit('spw:regions-primed', {
    route: ctx.route,
    count: ctx.regions.length,
    profiles: ctx.regions.map((entry) => entry.profile),
  });
}

/* ==========================================================================
   8. Minimal core behavior
   ========================================================================== */

function initMinimalSiteCore(ctx) {
  const cleanups = [];

  cleanups.push(bindModeGroups(ctx));
  cleanups.push(bindExplicitFrameActivation(ctx));
  cleanups.push(bindHashLandingState(ctx));
  cleanups.push(bindHashChangeRefresh(ctx));
  cleanups.push(bindRegionPrimeObserver(ctx));

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
      nextCtx?.bus?.emit('spw:core-refresh', { route: nextCtx.route });
      refreshRegionProfiles(nextCtx || ctx);
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
  const frames = safeQueryAll(FRAME_SELECTOR);
  if (!frames.length) return () => {};

  function setActiveFrame(nextFrame) {
    for (const frame of frames) {
      const isActive = frame === nextFrame;
      if (isActive) {
        frame.dataset.state = 'active';
      } else {
        delete frame.dataset.state;
      }
      frame.dataset.spwActive = isActive ? 'true' : 'false';
    }

    const region = ctx.regions.find((entry) => entry.el === nextFrame);
    if (region) {
      region.active = true;
      region.el.dataset.spwAttention = 'focused';
      region.el.dataset.spwStateAccent = 'active';
    }

    ctx.bus.emit('spw:frame-change', {
      id: nextFrame?.id || null,
      frame: nextFrame || null,
      route: ctx.route,
      source: 'explicit',
    });
  }

  const handlers = [];
  const pointerStarts = new WeakMap();

  for (const frame of frames) {
    const focusHandler = () => setActiveFrame(frame);
    const pointerDownHandler = (event) => {
      pointerStarts.set(frame, {
        x: event.clientX,
        y: event.clientY,
      });
    };
    const pointerUpHandler = (event) => {
      const start = pointerStarts.get(frame);
      pointerStarts.delete(frame);
      if (!start) return;
      if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select, summary, [role="button"]')) return;

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) > 10) return;

      setActiveFrame(frame);
    };
    const pointerCancelHandler = () => {
      pointerStarts.delete(frame);
    };

    frame.addEventListener('focusin', focusHandler);
    frame.addEventListener('pointerdown', pointerDownHandler, { passive: true });
    frame.addEventListener('pointerup', pointerUpHandler, { passive: true });
    frame.addEventListener('pointercancel', pointerCancelHandler, { passive: true });

    handlers.push(() => frame.removeEventListener('focusin', focusHandler));
    handlers.push(() => frame.removeEventListener('pointerdown', pointerDownHandler));
    handlers.push(() => frame.removeEventListener('pointerup', pointerUpHandler));
    handlers.push(() => frame.removeEventListener('pointercancel', pointerCancelHandler));
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
  return target.closest(FRAME_SELECTOR) || null;
}

function bindHashLandingState(ctx) {
  function applyHashState() {
    const frame = resolveHashTargetFrame();
    if (!frame) return;
    frame.dataset.state = 'active';
    frame.dataset.spwActive = 'true';
    frame.dataset.spwAttention = 'focused';
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
    frame.dataset.state = 'active';
    frame.dataset.spwActive = 'true';
    frame.dataset.spwAttention = 'focused';
    ctx.bus.emit('spw:hash-target', { frame, id: frame.id || null });
  };

  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}

function bindRegionPrimeObserver(ctx) {
  if (!ctx.regions.length || !('IntersectionObserver' in window)) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const region = ctx.regions.find((item) => item.el === entry.target);
        if (!region) continue;

        region.visible = entry.isIntersecting || entry.intersectionRatio > 0;
        if (region.visible) {
          setRegionState(region.el, REGION_STATES.PRIMED);
          region.el.dataset.spwAttention = region.active ? 'focused' : 'approach';
          region.el.dataset.spwStateAccent = region.profile.harmony;
        } else if (!region.enhanced) {
          setRegionState(region.el, REGION_STATES.QUEUED);
          region.el.dataset.spwAttention = 'ambient';
        }
      }
    },
    {
      root: null,
      rootMargin: '220px 0px',
      threshold: [0, 0.01, 0.2],
    }
  );

  ctx.addObserver(observer);
  ctx.regions.forEach((region) => observer.observe(region.el));

  return () => observer.disconnect();
}

function refreshRegionProfiles(ctx, reason = 'runtime-refresh') {
  ctx.regions.forEach((entry, index) => {
    entry.profile = buildRegionProfile(entry.el, index);
    applyRegionProfile(entry.el, entry.profile);
  });
  syncPageHarmony(ctx);
  ctx.bus.emit('spw:regions-profiled', {
    route: ctx.route,
    reason,
    count: ctx.regions.length,
    profiles: ctx.regions.map((entry) => entry.profile),
  });
}

/* ==========================================================================
   9. Region enhancement layer
   --------------------------------------------------------------------------
   Lightweight by default. Writes CSS-facing state and can mount tiny
   region-scoped helpers later.
   ========================================================================== */

function initRegionEnhancer(ctx, root) {
  if (!(root instanceof HTMLElement)) return;

  const region = ctx.regions.find((entry) => entry.el === root);
  if (!region) return;

  setRegionState(root, REGION_STATES.HYDRATING);

  const { profile } = region;

  root.dataset.spwEnhanced = 'true';
  root.dataset.spwMotionFamily = profile.tempo;
  root.dataset.spwHarmony = profile.harmony;
  root.dataset.spwDensity = profile.density;
  root.dataset.spwRegionGenome = profile.genome;
  root.dataset.spwRegionLayer = 'enhanced';
  root.style.setProperty('--region-harmonic-weight', String(region.profile.index + 1));

  const chips = root.querySelector('.spec-strip, .frame-operators, [data-spw-slot="meta"]');
  if (chips) {
    chips.dataset.spwRegionLinked = 'true';
  }

  setRegionState(root, REGION_STATES.ENHANCED);
  region.enhanced = true;

  ctx.bus.emit('spw:region-enhanced', {
    route: ctx.route,
    id: profile.id,
    key: profile.key,
    harmony: profile.harmony,
    tempo: profile.tempo,
    density: profile.density,
    root,
  });

  return {
    cleanup() {
      region.enhanced = false;
      root.dataset.spwRegionLayer = 'settling';
      setRegionState(root, REGION_STATES.SETTLING);
      delete root.dataset.spwEnhanced;
      const chips = root.querySelector('.spec-strip, .frame-operators, [data-spw-slot="meta"]');
      if (chips) delete chips.dataset.spwRegionLinked;
    },
    refresh(nextCtx) {
      const nextRegion = (nextCtx || ctx).regions.find((entry) => entry.el === root);
      if (!nextRegion) return;
      applyRegionProfile(root, nextRegion.profile);
      root.dataset.spwMotionFamily = nextRegion.profile.tempo;
      root.dataset.spwHarmony = nextRegion.profile.harmony;
      root.dataset.spwDensity = nextRegion.profile.density;
      root.dataset.spwRegionGenome = nextRegion.profile.genome;
    },
  };
}

/* ==========================================================================
   10. Module definitions
   ========================================================================== */

const CORE_DEFS = [
  {
    id: 'site-settings',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./kernel/site-settings.js'),
    mount: (mod) => {
      const fn = mod?.applySiteSettings;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'pwa-update-handler',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./runtime/pwa-update-handler.js'),
    mount: (mod) => {
      const fn = mod?.initPwaUpdateHandler;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'shell-disclosure',
    layer: MODULE_LAYERS.CORE,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./runtime/shell-disclosure.js'),
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

const FEATURE_DEFS = [
  {
    id: 'blog-interpreter',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-blog-interpreter]',
    route: 'blog',
    rootMode: 'each',
    load: () => import('./modules/blog-interpreter.js'),
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
    rootMode: 'single',
    load: () => import('./modules/blog-specimens.js'),
    mount: (mod) => {
      const fn = mod?.initBlogSpecimens;
      if (!isFn(fn)) return;
      return fn(document.querySelector('main') || document);
    },
  },
  {
    id: 'attn-register',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'blog',
    selector: '[data-blog-interpreter], #specimen-index',
    load: () => import('./modules/attn-register.js'),
    mount: (mod) => {
      const fn = mod?.initAttnRegister;
      if (!isFn(fn)) return;
      return fn(document.querySelector('main') || document);
    },
  },
  {
    id: 'seed-cards',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: ['services', 'newyear'],
    selector: '[data-seed-card]',
    load: () => import('./modules/seed-card.js'),
    mount: (mod) => {
      const fn = mod?.initSeedCards;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'payment-cards',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'services',
    selector: '[data-payment-card]',
    load: () => import('./modules/payment-card.js'),
    mount: (mod) => {
      const fn = mod?.initPaymentCards;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'services-configurators',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'services',
    selector: '[data-services-configurator]',
    load: () => import('./modules/services-configurator.js'),
    mount: (mod) => {
      const fn = mod?.initServicesConfigurators;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'rpg-wednesday',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'rpg-wednesday',
    selector: 'main',
    load: () => import('./modules/rpg-wednesday.js'),
    mount: (mod) => {
      const fn = mod?.initRpgWednesday;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'settings-page',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'settings',
    selector: '[data-spw-surface="settings"], main',
    load: () => import('./kernel/site-settings.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSiteSettingsPage;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'payment-settings',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'settings',
    selector: '#payment-settings-container',
    load: () => import('./modules/payment-card.js'),
    mount: (mod) => {
      const fn = mod?.initPaymentSettings;
      if (!isFn(fn)) return;
      return fn(document.getElementById('payment-settings-container'));
    },
  },
  {
    id: 'home-section-index',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'home',
    selector: '[data-home-section-index]',
    load: () => import('./modules/home-section-index.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initHomeSectionIndex;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'promo-wonder-cycle',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    route: 'home',
    selector: '[data-promo-wonder-cycle]',
    load: () => import('./typed/promo-wonder-cycle.js'),
    mount: (mod) => {
      const fn = mod?.initPromoWonderCycle;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'media-publishing',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    route: 'website',
    selector: '[data-media-focus], [data-media-collection]',
    load: () => import('./typed/media-publishing.js'),
    mount: (mod) => {
      const fn = mod?.initMediaPublishing;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'brace-pivots',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-pivot]',
    load: () => import('./runtime/brace-pivots.js'),
    mount: (mod) => {
      const fn = mod?.initBracePivots;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'brace-physics',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-form="brace"], .spw-delimiter',
    rootMode: 'single',
    load: () => import('./runtime/brace-gestures.js'),
    mount: (mod) => {
      const fn = mod?.initBraceGestures;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'local-notes',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-local-note-entry], [data-spw-local-notes-root], [data-local-note-preview]',
    load: () => import('./interface/local-notes.js'),
    mount: (mod) => {
      const fn = mod?.initSpwLocalNotes;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'boonhonk-mixer',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-boonhonk-mixer]',
    rootMode: 'single',
    load: () => import('./modules/boonhonk-mixer.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initBoonhonkMixers;
      if (!isFn(fn)) return;
      return fn(ctx?.root || document);
    },
  },
];

const REGION_DEFS = [
  {
    id: 'region-enhancer',
    layer: MODULE_LAYERS.REGION,
    when: MOUNT_WHEN.REGION,
    selector: REGION_SELECTOR,
    rootMode: 'each',
    load: async () => ({ initRegionEnhancer }),
    mount: (mod, ctx, root) => {
      const fn = mod?.initRegionEnhancer;
      if (!isFn(fn)) return;
      return fn(ctx, root);
    },
  },
];

const ENHANCEMENT_DEFS = [
  {
    id: 'layout-shift-audit',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./runtime/layout-shift-audit.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwLayoutShiftAudit;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'svg-filters',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.spw-svg-figure, .image-study, [data-spw-image-surface]',
    rootMode: 'single',
    load: () => import('./media/svg-filters.js'),
    mount: (mod) => {
      const fn = mod?.initSpwSvgFilters;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'svg-tunability',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-svg-host], .spw-svg-figure[data-spw-svg-pointer]',
    rootMode: 'single',
    load: () => import('./media/svg-tunability.js'),
    mount: (mod) => {
      const fn = mod?.initSpwSvgTunability;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'canvas-accents',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-accent]',
    rootMode: 'single',
    load: () => import('./interface/canvas-accents.js'),
    mount: (mod) => {
      const fn = mod?.initSpwCanvasAccents;
      if (!isFn(fn)) return;
      return fn(document.querySelector('main') || document);
    },
  },
  {
    id: 'image-metaphysics',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.image-study, .spw-svg-figure, [data-spw-image-surface], .domain-visual, .spw-scaffold',
    rootMode: 'single',
    load: () => import('./media/image-metaphysics.js'),
    mount: (mod) => {
      const fn = mod?.initSpwImageMetaphysics;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'logo-runtime',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '.spw-logo, [data-spw-logo]',
    rootMode: 'single',
    load: () => import('./interface/logo-runtime.js'),
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
    rootMode: 'single',
    load: () => import('./interface/topic-discovery.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwTopicDiscovery || mod?.initTopicDiscovery;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'component-semantics',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
    load: () => import('./semantic/component-semantics.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwComponentSemantics;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'semantic-crossrefs',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-semantic-cluster], [data-spw-vocab], [data-spw-semantic-expression], [data-spw-topic], .spw-topic',
    rootMode: 'single',
    evaluates: 'semantics navigation interaction resonance',
    load: () => import('./semantic/semantic-crossrefs.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwSemanticCrossrefs;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'guide-badge',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.operator-chip, .frame-sigil, .frame-card-sigil, .spec-pill, [data-spw-guide-badge]',
    rootMode: 'single',
    load: () => import('./interface/guide-badge.js'),
    mount: (mod) => {
      const fn = mod?.initGuideBadges;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'discovery-notices',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    load: () => import('./interface/discovery-notices.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwDiscoveryNotices;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'semantic-chrome',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
    load: () => import('./interface/semantic-chrome.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwSemanticChrome;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'contextual-ui',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: 'main, .site-header',
    rootMode: 'single',
    load: () => import('./interface/contextual-ui.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwContextualUi;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'design-experiments',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-design-experiments-root]',
    rootMode: 'single',
    load: () => import('./modules/design-experiments.js'),
    mount: (mod) => {
      const fn = mod?.initDesignExperiments;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'design-review-surfaces',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: 'body[data-spw-page-role="asset-review"], body[data-spw-page-role="token-review"], body[data-spw-page-role="design-lab"]',
    rootMode: 'single',
    load: () => import('./modules/design-review-surfaces.js'),
    mount: (mod) => {
      const fn = mod?.initDesignReviewSurfaces;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'attention-architecture',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: 'main, .spw-section-handle, [data-spw-operator]',
    rootMode: 'single',
    load: () => import('./runtime/attention-architecture.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwAttentionArchitecture;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'annotation-layer',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-annotation-handle], [data-spw-header-annotation]',
    rootMode: 'single',
    load: () => import('./runtime/annotation-layer.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwAnnotationLayer;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
  {
    id: 'navigation-spells',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: 'header nav a[href], .page-index a[href], .card-sub-links a[href], .frame-operators a[href]',
    rootMode: 'single',
    load: () => import('./runtime/navigation-spells.js'),
    mount: (mod) => {
      const fn = mod?.initSpwNavigationSpells;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'operators',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.frame-sigil, .frame-card-sigil, .syntax-token',
    rootMode: 'single',
    load: () => import('./semantic/operators.js'),
    mount: (mod) => {
      const fn = mod?.initSpwOperators;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'haptics',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-groundable=\"true\"], .operator-chip, .syntax-token, .frame-sigil',
    rootMode: 'single',
    load: () => import('./interface/haptics.js'),
    mount: (mod) => {
      const fn = mod?.initSpwHaptics;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'local-memory-controls',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-memory-action]',
    rootMode: 'single',
    load: () => import('./interface/local-memory-controls.js'),
    mount: (mod) => {
      const fn = mod?.initSpwLocalMemoryControls;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'prompt-utils',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-promptability="visible"], [data-spw-prompt-host]',
    rootMode: 'single',
    load: () => import('./interface/prompt-utils.js'),
    mount: (mod) => {
      const fn = mod?.initSpwPromptUtils;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'experiential',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: 'header, main',
    rootMode: 'single',
    load: () => import('./runtime/experiential.js'),
    mount: (mod) => {
      const fn = mod?.initSpwExperiential;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'spells',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.spell-board-content, header',
    rootMode: 'single',
    load: () => import('./runtime/spells.js'),
    mount: (mod) => {
      const fn = mod?.initSpwSpells;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'guide',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IDLE,
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
    load: () => import('./interface/guide.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwGuide;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];

const MODULE_DEFS = [
  ...CORE_DEFS,
  ...FEATURE_DEFS,
  ...REGION_DEFS,
  ...ENHANCEMENT_DEFS,
];

/* ==========================================================================
   11. Module mounting
   ========================================================================== */

function findModuleDefinition(id) {
  const key = normalizeRuntimeToken(id);
  return MODULE_DEFS.find((def) => normalizeRuntimeToken(def.id) === key) || null;
}

function getModuleRoots(def, options = {}) {
  if (options.root instanceof HTMLElement) return [options.root];
  if (typeof options.root === 'string') {
    const root = safeQuery(options.root);
    return root ? [root] : [];
  }
  return getRoots(def);
}

function listModuleDefinitions(ctx = runtimeCtx) {
  return MODULE_DEFS.map((def) => {
    const effectiveWhen = ctx ? getEffectiveMountWhen(def, ctx) : (def.when || MOUNT_WHEN.IMMEDIATE);
    const record = ctx?.registry?.get(def.id);
    return {
      id: def.id,
      layer: def.layer,
      requestedWhen: def.when || MOUNT_WHEN.IMMEDIATE,
      effectiveWhen,
      route: def.route || null,
      selector: def.selector || '',
      rootMode: def.rootMode || 'single',
      evaluates: inferModuleDimensions(def),
      reason: ctx ? describeMountReason(def, ctx, null, effectiveWhen) : (def.reason || ''),
      status: record?.status || 'defined',
    };
  });
}

function snapshotRuntimeModules(ctx = runtimeCtx) {
  if (!ctx) return [];
  return ctx.registry.values().map((record) => ({
    id: record.id,
    baseId: record.baseId || record.id,
    layer: record.layer,
    evaluates: record.evaluates,
    requestedWhen: record.requestedWhen,
    effectiveWhen: record.effectiveWhen,
    status: record.status,
    reason: record.reason,
    mountedAt: record.mountedAt,
    loadMs: record.loadMs,
    mountMs: record.mountMs,
    durationMs: record.durationMs,
    root: record.root instanceof HTMLElement
      ? record.root.id || record.root.dataset.spwRegionKey || record.root.tagName.toLowerCase()
      : 'document',
    error: record.error?.message || null,
  }));
}

async function mountModuleById(id, ctx = runtimeCtx, options = {}) {
  if (!ctx) return null;
  const def = findModuleDefinition(id);
  if (!def) return null;
  const roots = getModuleRoots(def, options);

  if (!roots.length || def.rootMode === 'single') {
    return mountDefinition(def, ctx, roots[0] || null, 0);
  }

  const records = [];
  for (const [index, root] of roots.entries()) {
    records.push(await mountDefinition(def, ctx, root, index));
  }
  return records;
}

function makeRecordId(def, root = null, index = 0) {
  if (!root || root === document.body) return def.id;
  const rootId = root.id || root.getAttribute('data-spw-region-key') || root.getAttribute('data-spw-id') || root.getAttribute('data-spw-kind') || index;
  return `${def.id}::${String(rootId)}`;
}

function getEffectiveMountWhen(def, ctx) {
  const baseWhen = def.when || MOUNT_WHEN.IMMEDIATE;
  const moduleOverride = ctx.runtimePolicy.timingByModule.get(def.id);
  if (moduleOverride) return moduleOverride;

  switch (ctx.runtimePolicy.timing) {
    case 'eager':
      if (baseWhen === MOUNT_WHEN.IDLE || baseWhen === MOUNT_WHEN.VISIBLE || baseWhen === MOUNT_WHEN.INTERACTION) {
        return MOUNT_WHEN.IMMEDIATE;
      }
      return baseWhen;
    case 'defer':
      if (def.layer === MODULE_LAYERS.CORE || baseWhen === MOUNT_WHEN.REGION) return baseWhen;
      if (baseWhen === MOUNT_WHEN.IMMEDIATE) return def.selector ? MOUNT_WHEN.VISIBLE : MOUNT_WHEN.IDLE;
      return baseWhen;
    case 'quiet':
      if (def.layer === MODULE_LAYERS.CORE || baseWhen === MOUNT_WHEN.REGION) return baseWhen;
      return MOUNT_WHEN.IDLE;
    case 'manual':
      return def.layer === MODULE_LAYERS.CORE ? baseWhen : 'manual';
    default:
      return baseWhen;
  }
}

function describeMountReason(def, ctx, root = null, effectiveWhen = getEffectiveMountWhen(def, ctx)) {
  const routeReason = def.route
    ? `route:${Array.isArray(def.route) ? def.route.join('|') : def.route}`
    : 'route:any';
  const selectorReason = def.selector ? `selector:${def.selector}` : 'selector:document';
  const rootReason =
    root instanceof HTMLElement
      ? `root:${root.id || root.dataset.spwRegionKey || root.dataset.spwKind || root.tagName.toLowerCase()}`
      : 'root:document';
  return def.reason || `${effectiveWhen} ${def.layer} ${routeReason} ${selectorReason} ${rootReason}`;
}

function inferModuleDimensions(def) {
  const text = `${def.id || ''} ${def.selector || ''} ${def.layer || ''}`.toLowerCase();
  const dimensions = new Set([def.layer]);

  if (/nav|route|link|hash|frame/.test(text)) dimensions.add('routing');
  if (/semantic|operator|topic|guide|annotation|brace/.test(text)) dimensions.add('semantics');
  if (/semantic|component|genome|kind|role|slot|density/.test(text)) dimensions.add('semantic-density');
  if (/layout|shift|region|canvas|svg|image|logo|promo|wonder/.test(text)) dimensions.add('visual');
  if (/canvas|svg|image|logo|promo|wonder|visual|motif/.test(text)) dimensions.add('visual-model');
  if (/layout|space|region|surface|grid|frame|fold/.test(text)) dimensions.add('spacing-semantics');
  if (/settings|tune|local|memory|storage|pwa/.test(text)) dimensions.add('state');
  if (/spell|haptic|gesture|experiential|interaction|pointer|mode/.test(text)) dimensions.add('interaction');
  if (/payment|service|rpg|blog|media|design/.test(text)) dimensions.add('surface');

  if (def.evaluates) {
    String(def.evaluates)
      .split(/[\s,]+/)
      .map(normalizeRuntimeToken)
      .filter(Boolean)
      .forEach((token) => dimensions.add(token));
  }

  return [...dimensions].filter(Boolean).join(' ');
}

function shouldScheduleDefinition(def, ctx, expectedWhen = null) {
  const id = normalizeRuntimeToken(def.id);
  const effectiveWhen = getEffectiveMountWhen(def, ctx);
  const routeMatch = matchesRoute(def);
  const selectorMatch = hasSelector(def);
  const onlyMatch = !ctx.runtimePolicy.only.size || ctx.runtimePolicy.only.has(id);
  const skipMatch = ctx.runtimePolicy.skip.has(id);
  const whenMatch = expectedWhen ? effectiveWhen === expectedWhen : effectiveWhen !== 'manual';
  const allowed = routeMatch && selectorMatch && onlyMatch && !skipMatch && whenMatch;

  if (!allowed && ctx.runtimePolicy.audit) {
    const reason = [
      routeMatch ? '' : 'route-mismatch',
      selectorMatch ? '' : 'selector-missing',
      onlyMatch ? '' : 'outside-module-only',
      skipMatch ? 'module-skip' : '',
      whenMatch ? '' : `waiting-for-${effectiveWhen}`,
    ].filter(Boolean).join(' ') || 'not-scheduled';
    const auditKey = `${id}:${expectedWhen || 'any'}:${reason}`;
    if (ctx.moduleSkipAuditKeys.has(auditKey)) return allowed;
    ctx.moduleSkipAuditKeys.add(auditKey);
    recordModuleAudit(ctx, {
      id: def.id,
      layer: def.layer,
      requestedWhen: def.when || MOUNT_WHEN.IMMEDIATE,
      effectiveWhen,
      status: 'skipped',
      reason,
    });
  }

  return allowed;
}

function annotateModuleTarget(target, record) {
  if (!(target instanceof HTMLElement)) return;
  writeDatasetValue(target, 'spwModule', record.baseId);
  writeDatasetValue(target, 'spwModuleId', record.id);
  writeDatasetValue(target, 'spwModuleLayer', record.layer);
  writeDatasetValue(target, 'spwModuleWhen', record.effectiveWhen);
  writeDatasetValue(target, 'spwModuleStatus', record.status);
  writeDatasetValue(target, 'spwModuleReason', record.reason);
  writeDatasetValue(target, 'spwModuleEvaluates', record.evaluates);
  writeDatasetValue(target, 'spwModuleHydration', record.status === 'mounted' ? 'ready' : record.status);
  if (Number.isFinite(record.durationMs)) {
    writeDatasetValue(target, 'spwModuleDurationMs', String(Math.round(record.durationMs)));
  }
}

function syncRuntimeModuleSummary(ctx, record) {
  const records = ctx.registry.values();
  const mounted = records.filter((entry) => entry.status === 'mounted').map((entry) => entry.baseId || entry.id);
  const failed = records.filter((entry) => entry.status === 'failed').map((entry) => entry.baseId || entry.id);

  writeDatasetValue(HTML, 'spwRuntimeLastModule', record.baseId || record.id);
  writeDatasetValue(HTML, 'spwRuntimeLastModuleStatus', record.status);
  writeDatasetValue(HTML, 'spwRuntimeLastModuleWhen', record.effectiveWhen);
  writeDatasetValue(HTML, 'spwRuntimeLastModuleReason', record.reason);
  writeDatasetValue(HTML, 'spwRuntimeLastModuleEvaluates', record.evaluates);
  writeDatasetValue(HTML, 'spwRuntimeMountedModules', [...new Set(mounted)].join(' '));
  writeDatasetValue(HTML, 'spwRuntimeFailedModules', [...new Set(failed)].join(' ') || null);
  writeDatasetValue(HTML, 'spwRuntimeModuleCount', String(mounted.length));
  if (BODY) {
    writeDatasetValue(BODY, 'spwRuntimeLastModule', record.baseId || record.id);
    writeDatasetValue(BODY, 'spwRuntimeLastModuleStatus', record.status);
    writeDatasetValue(BODY, 'spwRuntimeLastModuleWhen', record.effectiveWhen);
    writeDatasetValue(BODY, 'spwRuntimeLastModuleReason', record.reason);
    writeDatasetValue(BODY, 'spwRuntimeLastModuleEvaluates', record.evaluates);
    writeDatasetValue(BODY, 'spwRuntimeModuleCount', String(mounted.length));
  }
}

function recordModuleAudit(ctx, entry) {
  const record = {
    at: Math.round(performance.now()),
    route: ctx.route,
    ...entry,
  };
  ctx.moduleAudit.push(record);
  if (ctx.moduleAudit.length > 160) ctx.moduleAudit.shift();
  if (ctx.runtimePolicy.audit) {
    console.info('[site.js] module audit', record);
  }
  return record;
}

function snapshotEffectSummary() {
  const root = document.documentElement;
  return {
    route: runtimeCtx?.route || BODY?.dataset.spwSurface || 'unknown',
    timing: root.dataset.spwInteractionTuner || root.dataset.spwRuntimeTiming || 'balanced',
    lighting: root.dataset.spwColorTuner || root.dataset.spwColorMode || 'system',
    density: root.dataset.spwSemanticDensity || 'medium',
    flavor: root.dataset.spwPedagogicalFlavor || 'neutral',
    runtimePosture: root.dataset.spwRuntimePosture || 'minimal',
    moduleVisuals: root.dataset.spwModuleVisuals || 'off',
    moduleAudit: root.dataset.spwModuleAudit || 'off',
    modules: snapshotRuntimeModules(runtimeCtx),
    expressions: snapshotSemanticExpressions(),
    projections: snapshotProjectionEquations(),
  };
}

function snapshotSemanticExpressions() {
  return safeQueryAll('[data-spw-semantic-expression], [data-spw-vocab], [data-spw-topic], [data-spw-operator]')
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: normalizeWhitespace(el.textContent || '').slice(0, 120),
      expression: el.dataset.spwSemanticExpression || null,
      vocab: el.dataset.spwVocab || null,
      topic: el.dataset.spwTopic || null,
      operator: el.dataset.spwOperator || null,
      href: el instanceof HTMLAnchorElement ? el.getAttribute('href') : null,
      route: window.location.pathname,
    }));
}

function snapshotProjectionEquations() {
  const expressions = snapshotSemanticExpressions()
    .map((entry) => entry.expression)
    .filter(Boolean);

  return expressions.map((expression) => {
    const match = expression.match(/^([^\[\{\(]+)(?:\[([^\]]+)\])?(?:\{([^}]+)\})?(?:\(([^)]+)\))?/);
    return {
      expression,
      noun: match?.[1]?.trim() || expression,
      variant: match?.[2] || null,
      behavior: match?.[3] || null,
      scene: match?.[4] || null,
    };
  });
}

function normalizeWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

async function mountDefinition(def, ctx, root = null, index = 0) {
  const recordId = makeRecordId(def, root, index);
  const effectiveWhen = getEffectiveMountWhen(def, ctx);
  const reason = describeMountReason(def, ctx, root, effectiveWhen);
  const evaluates = inferModuleDimensions(def);

  if (ctx.registry.has(recordId)) return ctx.registry.get(recordId);

  ctx.registry.set(recordId, {
    id: recordId,
    baseId: def.id,
    layer: def.layer,
    evaluates,
    requestedWhen: def.when || MOUNT_WHEN.IMMEDIATE,
    effectiveWhen,
    reason,
    status: 'idle',
    cleanup: null,
    refresh: null,
    root,
    mountedAt: null,
    loadMs: null,
    mountMs: null,
    durationMs: null,
    error: null,
  });

  try {
    if (root instanceof HTMLElement) setRegionState(root, REGION_STATES.HYDRATING);

    const startedAt = performance.now();
    annotateModuleTarget(root, {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates,
      effectiveWhen,
      reason,
      status: 'loading',
    });
    recordModuleAudit(ctx, {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates,
      requestedWhen: def.when || MOUNT_WHEN.IMMEDIATE,
      effectiveWhen,
      status: 'loading',
      reason,
    });

    const loadStartedAt = performance.now();
    const mod = await def.load();
    const loadEndedAt = performance.now();
    const mountStartedAt = performance.now();
    const result = await def.mount(mod, ctx, root);
    const mountEndedAt = performance.now();
    const handle = normalizeMountHandle(result);

    const record = {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates,
      requestedWhen: def.when || MOUNT_WHEN.IMMEDIATE,
      effectiveWhen,
      reason,
      status: 'mounted',
      cleanup: handle.cleanup,
      refresh: handle.refresh,
      root,
      mountedAt: mountEndedAt,
      loadMs: loadEndedAt - loadStartedAt,
      mountMs: mountEndedAt - mountStartedAt,
      durationMs: mountEndedAt - startedAt,
      error: null,
    };

    ctx.registry.set(recordId, record);
    annotateModuleTarget(root, record);
    syncRuntimeModuleSummary(ctx, record);
    recordModuleAudit(ctx, {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates: record.evaluates,
      requestedWhen: record.requestedWhen,
      effectiveWhen,
      status: 'mounted',
      reason,
      loadMs: Math.round(record.loadMs),
      mountMs: Math.round(record.mountMs),
      durationMs: Math.round(record.durationMs),
    });

    if (root instanceof HTMLElement) {
      const state =
        def.layer === MODULE_LAYERS.ENHANCEMENT || def.layer === MODULE_LAYERS.REGION
          ? REGION_STATES.ENHANCED
          : REGION_STATES.INTERACTIVE;
      setRegionState(root, state);
    }

    ctx.bus.emit('spw:module-mounted', {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates: record.evaluates,
      requestedWhen: def.when || MOUNT_WHEN.IMMEDIATE,
      effectiveWhen,
      reason,
      route: ctx.route,
      root,
      loadMs: record.loadMs,
      mountMs: record.mountMs,
      durationMs: record.durationMs,
    });

    return record;
  } catch (error) {
    console.warn(`[site.js] module mount failed: ${def.id}`, error);

    const record = {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates,
      requestedWhen: def.when || MOUNT_WHEN.IMMEDIATE,
      effectiveWhen,
      reason,
      status: 'failed',
      cleanup: null,
      refresh: null,
      root,
      mountedAt: null,
      loadMs: null,
      mountMs: null,
      durationMs: null,
      error,
    };

    ctx.registry.set(recordId, record);
    annotateModuleTarget(root, record);
    syncRuntimeModuleSummary(ctx, record);
    recordModuleAudit(ctx, {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates: record.evaluates,
      requestedWhen: record.requestedWhen,
      effectiveWhen,
      status: 'failed',
      reason,
      error: error?.message || String(error),
    });

    if (root instanceof HTMLElement) setRegionState(root, REGION_STATES.QUEUED);

    ctx.bus.emit('spw:module-failed', {
      id: recordId,
      baseId: def.id,
      layer: def.layer,
      evaluates: record.evaluates,
      requestedWhen: def.when || MOUNT_WHEN.IMMEDIATE,
      effectiveWhen,
      reason,
      route: ctx.route,
      root,
      error,
    });

    return record;
  }
}

async function mountImmediateLayer(defs, ctx) {
  for (const def of defs) {
    if (!shouldScheduleDefinition(def, ctx, MOUNT_WHEN.IMMEDIATE)) continue;
    await mountDefinition(def, ctx, null, 0);
  }
}

async function mountVisibleFeatures(defs, ctx) {
  const visibleDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, MOUNT_WHEN.VISIBLE));
  if (!visibleDefs.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;

        for (const def of visibleDefs) {
          if (!el.matches(def.selector)) continue;

          if (def.rootMode === 'single') {
            void mountDefinition(def, ctx, null, 0);
          } else {
            void mountDefinition(def, ctx, el);
          }
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
  const interactionDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, MOUNT_WHEN.INTERACTION));
  if (!interactionDefs.length) return;

  const activate = once(async () => {
    for (const def of interactionDefs) {
      const roots = getRoots(def);
      if (!roots.length || def.rootMode === 'single') {
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

async function mountRegionLayer(defs, ctx) {
  const regionDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, MOUNT_WHEN.REGION));
  if (!regionDefs.length || !ctx.regions.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;

        for (const def of regionDefs) {
          if (!el.matches(def.selector)) continue;
          void mountDefinition(def, ctx, el);
        }

        observer.unobserve(el);
      }
    },
    {
      root: null,
      rootMargin: '160px 0px',
      threshold: 0.01,
    }
  );

  ctx.addObserver(observer);

  ctx.regions.forEach((region) => {
    setRegionState(region.el, REGION_STATES.PRIMED);
    observer.observe(region.el);
  });
}

function queueIdleEnhancements(defs, ctx) {
  const idleDefs = defs.filter((def) => shouldScheduleDefinition(def, ctx, MOUNT_WHEN.IDLE));
  if (!idleDefs.length) return;

  const handle = onIdle(async () => {
    if (ctx.runtimePolicy.delay) {
      await new Promise((resolve) => {
        const timer = window.setTimeout(resolve, ctx.runtimePolicy.delay);
        ctx.addTimer(timer);
      });
    }

    for (const def of idleDefs) {
      const roots = getRoots(def);

      if (!roots.length || def.rootMode === 'single') {
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
   12. Refresh support
   ========================================================================== */

function refreshRuntime(ctx) {
  refreshRegionProfiles(ctx, 'runtime-refresh');

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
   13. Public teardown / reinit hooks
   ========================================================================== */

let runtimeCtx = null;

function destroyRuntime() {
  if (!runtimeCtx) return;
  runtimeCtx.destroy();
  runtimeCtx = null;
  clearPageState(HTML, BODY);
  delete HTML.dataset.spwLayoutShiftState;
  delete HTML.dataset.spwLayoutShiftCount;
  delete HTML.dataset.spwLayoutShiftTotal;
  delete HTML.dataset.spwLayoutShiftLast;
  delete HTML.dataset.spwLayoutShiftRecentInputCount;
  if (BODY?.dataset) {
    delete BODY.dataset.spwLayoutShiftState;
    delete BODY.dataset.spwLayoutShiftCount;
    delete BODY.dataset.spwLayoutShiftTotal;
    delete BODY.dataset.spwLayoutShiftLast;
    delete BODY.dataset.spwLayoutShiftRecentInputCount;
  }
}

async function bootSite() {
  await whenDocumentReady();
  const normalized = normalizeDocumentMetadata();
  SITE_SURFACE = normalized.surface || SITE_SURFACE;

  runtimeCtx = createRuntimeContext();
    const [
      { orchestrator: frameState, bindGlobalInteractions },
      pageHooks,
    ] = await Promise.all([
      import('./runtime/state-orchestrator.js'),
      import('./runtime/page-hooks.js'),
    ]);
    const composeApi = installSpwCompositionConsole(window, {
      namespace: 'site-runtime',
      role: 'runtime',
      metaphor: 'composition-console',
      owns: 'query disposition, runtime inspection, tuning hooks',
    controls: {
      pageState: {
        clearAttentionSequence: clearPageAttentionSequence,
        states: PAGE_STATES,
        presence: PAGE_PRESENCE,
        arrival: PAGE_ARRIVAL,
        events: {
          attention: PAGE_ATTENTION_EVENT,
          transition: PAGE_TRANSITION_EVENT,
        },
        annotateFloatingChrome,
        clear: clearPageState,
        init: initPageAttentionLifecycle,
        scheduleArrival: schedulePageArrival,
        setPageState,
        setAttentionState: setPageAttentionState,
        snapshot: snapshotPageState,
      },
      pageHooks: {
        annotate: pageHooks.annotatePageHooks,
        focus: pageHooks.focusPageHook,
        list: pageHooks.listPageHooks,
        pulse: pageHooks.pulsePageHook,
        resolve: pageHooks.resolvePageHook,
        snapshot: pageHooks.snapshotPageHooks,
        states: pageHooks.PAGE_HOOK_STATES,
      },
      frameState: {
        ...frameState,
        bindGlobalInteractions,
      },
      modules: {
        audit: () => [...(runtimeCtx?.moduleAudit || [])],
        definitions: () => listModuleDefinitions(runtimeCtx),
        mount: (id, options = {}) => mountModuleById(id, runtimeCtx, options),
        policy: () => runtimeCtx?.runtimePolicy || null,
        records: () => snapshotRuntimeModules(runtimeCtx),
      },
      effects: {
        expressions: snapshotSemanticExpressions,
        projections: snapshotProjectionEquations,
        summary: snapshotEffectSummary,
      },
    },
  });
  const queryDisposition = applySpwQueryDisposition(HTML, {
    source: 'site-runtime',
    scope: 'document',
  });
  runtimeCtx.queryDisposition = queryDisposition;
  runtimeCtx.compose = composeApi;
  setPageState(PAGE_STATES.BOOTING);
  runtimeCtx.addCleanup(initPageAttentionLifecycle(runtimeCtx));

  runtimeCtx.bus.emit('spw:page-boot', { route: runtimeCtx.route });

  // Initialize relational state and global interactions
  bindGlobalInteractions();

  primeRegions(runtimeCtx);

  await mountImmediateLayer(CORE_DEFS, runtimeCtx);
  await mountImmediateLayer(FEATURE_DEFS, runtimeCtx);
  await mountImmediateLayer(ENHANCEMENT_DEFS, runtimeCtx);
  refreshRegionProfiles(runtimeCtx, 'immediate-enrichment');

  schedulePageArrival(runtimeCtx, PAGE_ARRIVAL.ENTERING, 'page-enter');

  setPageState(PAGE_STATES.INTERACTIVE);
  runtimeCtx.bus.emit('spw:page-interactive', { route: runtimeCtx.route });

  await mountVisibleFeatures(FEATURE_DEFS, runtimeCtx);
  await mountInteractionFeatures(FEATURE_DEFS, runtimeCtx);

  setPageState(PAGE_STATES.HYDRATED);
  runtimeCtx.bus.emit('spw:page-hydrated', { route: runtimeCtx.route });

  await mountRegionLayer(REGION_DEFS, runtimeCtx);

  setPageState(PAGE_STATES.REGION_ENHANCED);
  runtimeCtx.bus.emit('spw:page-region-enhanced', { route: runtimeCtx.route });

  queueIdleEnhancements(ENHANCEMENT_DEFS, runtimeCtx);

  whenWindowLoaded().then(() => {
    if (!runtimeCtx) return;
    refreshRuntime(runtimeCtx);
  });

  return runtimeCtx;
}

/* ==========================================================================
   14. Dev / manual hooks
   ========================================================================== */

window.__SPW_SITE__ = {
  bootSite,
  destroyRuntime,
  auditModules: () => [...(runtimeCtx?.moduleAudit || [])],
  listModules: () => listModuleDefinitions(runtimeCtx),
  mountModule: (id, options = {}) => mountModuleById(id, runtimeCtx, options),
  snapshotModules: () => snapshotRuntimeModules(runtimeCtx),
  effects: snapshotEffectSummary,
  expressions: snapshotSemanticExpressions,
  projections: snapshotProjectionEquations,
  refreshRuntime: () => runtimeCtx && refreshRuntime(runtimeCtx),
  getContext: () => runtimeCtx,
};

/* ==========================================================================
   15. Start
   ========================================================================== */

void bootSite();
