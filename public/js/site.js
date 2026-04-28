import {
  PAGE_METADATA_REGION_SELECTOR,
  normalizeDocumentMetadata,
} from './spw-page-metadata.js';
import {
  FRAME_SELECTOR,
  buildAxisGenome,
  inferTopographyKind,
  writeDatasetValue,
  writeDatasetValueIfMissing,
  writeStyleValue,
} from './spw-dom-contracts.js';

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

const PAGE_STATES = {
  BOOTING: 'booting',
  INTERACTIVE: 'interactive',
  HYDRATED: 'hydrated',
  REGION_ENHANCED: 'region-enhanced',
  ENHANCED: 'enhanced',
};

const PAGE_PRESENCE = {
  FOREGROUND: 'foreground',
  BACKGROUND: 'background',
};

const PAGE_ARRIVAL = {
  ENTERING: 'entering',
  RETURNING: 'returning',
  RESTORED: 'restored',
  SETTLED: 'settled',
};

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

const HTML = document.documentElement;
const BODY = document.body;
const ROOT_MAIN = document.querySelector('main');
let SITE_SURFACE = BODY?.dataset?.spwSurface || 'default';
const PAGE_ATTENTION_EVENT = 'spw:page-attention-state';
const PAGE_ARRIVAL_STEP_SEQUENCE = Object.freeze([
  { step: '1', token: '--spw-page-arrival-step-1-delay', fallback: 0 },
  { step: '2', token: '--spw-page-arrival-step-2-delay', fallback: 96 },
  { step: '3', token: '--spw-page-arrival-step-3-delay', fallback: 212 },
]);

const REGION_SELECTOR = PAGE_METADATA_REGION_SELECTOR;

/* ==========================================================================
   2. Small runtime helpers
   ========================================================================== */

function setPageState(state) {
  writeDatasetValue(HTML, 'spwPageState', state);
}

function parseCssTimeMs(value, fallback = 0) {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return fallback;
  return raw.endsWith('s') && !raw.endsWith('ms') ? numeric * 1000 : numeric;
}

function readRootTimeToken(name, fallback = 0) {
  if (!name || typeof getComputedStyle !== 'function') return fallback;
  return parseCssTimeMs(getComputedStyle(HTML).getPropertyValue(name), fallback);
}

function prefersReducedMotion() {
  return (
    HTML.dataset.spwReduceMotion === 'on'
    || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function setPageAttentionState(ctx, detail = {}) {
  const presence = detail.presence || HTML.dataset.spwPagePresence || PAGE_PRESENCE.FOREGROUND;
  const arrival = detail.arrival || HTML.dataset.spwPageArrival || PAGE_ARRIVAL.SETTLED;
  const step = String(detail.step ?? HTML.dataset.spwPageArrivalStep ?? '0');

  writeDatasetValue(HTML, 'spwPagePresence', presence);
  writeDatasetValue(HTML, 'spwPageArrival', arrival);
  writeDatasetValue(HTML, 'spwPageArrivalStep', step);
  writeDatasetValue(HTML, 'spwAttentionContext',
    presence === PAGE_PRESENCE.BACKGROUND
      ? 'background'
      : arrival === PAGE_ARRIVAL.SETTLED
        ? 'settled'
        : arrival
  );

  const payload = {
    presence,
    arrival,
    step,
    reason: detail.reason || 'runtime',
    route: ctx?.route || SITE_SURFACE,
  };

  ctx?.bus?.emit?.(PAGE_ATTENTION_EVENT, payload);
  document.dispatchEvent(new CustomEvent(PAGE_ATTENTION_EVENT, { detail: payload }));
}

function clearPageAttentionSequence(ctx) {
  if (!ctx?.pageAttentionTimers?.size) return;
  ctx.pageAttentionTimers.forEach((timerId) => {
    window.clearTimeout(timerId);
    ctx.timers.delete(timerId);
  });
  ctx.pageAttentionTimers.clear();
}

function addManagedTimeout(ctx, callback, delay) {
  const timerId = window.setTimeout(() => {
    ctx?.pageAttentionTimers?.delete(timerId);
    ctx?.timers?.delete(timerId);
    callback();
  }, delay);

  ctx?.pageAttentionTimers?.add(timerId);
  ctx?.addTimer?.(timerId);
  return timerId;
}

function schedulePageArrival(ctx, arrival = PAGE_ARRIVAL.ENTERING, reason = 'page-enter') {
  if (!ctx) return;

  clearPageAttentionSequence(ctx);

  if (prefersReducedMotion()) {
    setPageAttentionState(ctx, {
      presence: PAGE_PRESENCE.FOREGROUND,
      arrival: PAGE_ARRIVAL.SETTLED,
      step: '0',
      reason,
    });
    return;
  }

  PAGE_ARRIVAL_STEP_SEQUENCE.forEach(({ step, token, fallback }) => {
    addManagedTimeout(ctx, () => {
      setPageAttentionState(ctx, {
        presence: PAGE_PRESENCE.FOREGROUND,
        arrival,
        step,
        reason,
      });
    }, readRootTimeToken(token, fallback));
  });

  const settleDelayToken = arrival === PAGE_ARRIVAL.RETURNING
    ? '--spw-page-return-duration'
    : '--spw-page-arrival-duration';
  const settleDelayFallback = arrival === PAGE_ARRIVAL.RETURNING ? 280 : 420;

  addManagedTimeout(ctx, () => {
    setPageAttentionState(ctx, {
      presence: PAGE_PRESENCE.FOREGROUND,
      arrival: PAGE_ARRIVAL.SETTLED,
      step: '0',
      reason: `${reason}-settled`,
    });
  }, readRootTimeToken(settleDelayToken, settleDelayFallback));
}

function initPageAttentionLifecycle(ctx) {
  if (!ctx) return () => {};

  const handleVisibilityChange = () => {
    if (document.hidden) {
      clearPageAttentionSequence(ctx);
      setPageAttentionState(ctx, {
        presence: PAGE_PRESENCE.BACKGROUND,
        arrival: PAGE_ARRIVAL.SETTLED,
        step: '0',
        reason: 'visibility-hidden',
      });
      return;
    }

    schedulePageArrival(ctx, PAGE_ARRIVAL.RETURNING, 'visibility-visible');
  };

  const handlePageShow = (event) => {
    if (!event.persisted) return;
    schedulePageArrival(ctx, PAGE_ARRIVAL.RESTORED, 'pageshow-restored');
  };

  const handlePageHide = () => {
    clearPageAttentionSequence(ctx);
    setPageAttentionState(ctx, {
      presence: PAGE_PRESENCE.BACKGROUND,
      arrival: PAGE_ARRIVAL.SETTLED,
      step: '0',
      reason: 'pagehide',
    });
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handlePageShow);
  window.addEventListener('pagehide', handlePageHide);

  setPageAttentionState(ctx, {
    presence: document.hidden ? PAGE_PRESENCE.BACKGROUND : PAGE_PRESENCE.FOREGROUND,
    arrival: PAGE_ARRIVAL.SETTLED,
    step: '0',
    reason: 'page-init',
  });

  return () => {
    clearPageAttentionSequence(ctx);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pageshow', handlePageShow);
    window.removeEventListener('pagehide', handlePageHide);
  };
}

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

/* ==========================================================================
   3. Tiny event bus
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
    observers: new Set(),
    timers: new Set(),
    pageAttentionTimers: new Set(),
    cleanupStack: [],
    regions: [],
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
      frame.classList.toggle('is-active-frame', isActive);
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
  return target.closest(FRAME_SELECTOR) || null;
}

function bindHashLandingState(ctx) {
  function applyHashState() {
    const frame = resolveHashTargetFrame();
    if (!frame) return;
    frame.classList.add('is-active-frame');
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
    frame.classList.add('is-active-frame');
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
    load: () => import('./site-settings.js'),
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
    load: () => import('./spw-pwa-update-handler.js'),
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

const FEATURE_DEFS = [
  {
    id: 'blog-interpreter',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.VISIBLE,
    selector: '[data-blog-interpreter]',
    route: 'blog',
    rootMode: 'each',
    load: () => import('./spw-blog-interpreter.js'),
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
    load: () => import('./spw-blog-specimens.js'),
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
    load: () => import('./spw-attn-register.js'),
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
    load: () => import('./spw-seed-card.js'),
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
    load: () => import('./spw-payment-card.js'),
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
    load: () => import('./spw-services-configurator.js'),
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
    load: () => import('./rpg-wednesday.js'),
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
    load: () => import('./site-settings.js'),
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
    load: () => import('./spw-payment-card.js'),
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
    load: () => import('./home-section-index.js'),
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
    load: () => import('./spw-brace-pivots.js'),
    mount: (mod) => {
      const fn = mod?.initBracePivots;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'local-notes',
    layer: MODULE_LAYERS.FEATURE,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-local-note-entry], [data-spw-local-notes-root], [data-local-note-preview]',
    load: () => import('./spw-local-notes.js'),
    mount: (mod) => {
      const fn = mod?.initSpwLocalNotes;
      if (!isFn(fn)) return;
      return fn();
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
    id: 'svg-filters',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.spw-svg-figure, .image-study, [data-spw-image-surface]',
    rootMode: 'single',
    load: () => import('./spw-svg-filters.js'),
    mount: (mod) => {
      const fn = mod?.initSpwSvgFilters;
      if (!isFn(fn)) return;
      return fn();
    },
  },
  {
    id: 'canvas-accents',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-accent]',
    rootMode: 'single',
    load: () => import('./spw-canvas-accents.js'),
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
    load: () => import('./spw-image-metaphysics.js'),
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
    rootMode: 'single',
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
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
    load: () => import('./spw-component-semantics.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwComponentSemantics;
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
    load: () => import('./spw-guide-badge.js'),
    mount: (mod) => {
      const fn = mod?.initGuideBadges;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'semantic-chrome',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '[data-spw-kind], [data-spw-role], [data-spw-slot]',
    rootMode: 'single',
    load: () => import('./spw-semantic-chrome.js'),
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
    load: () => import('./spw-contextual-ui.js'),
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
    load: () => import('./design-experiments.js'),
    mount: (mod) => {
      const fn = mod?.initDesignExperiments;
      if (!isFn(fn)) return;
      return fn(document);
    },
  },
  {
    id: 'attention-architecture',
    layer: MODULE_LAYERS.ENHANCEMENT,
    when: MOUNT_WHEN.IMMEDIATE,
    selector: '.spw-section-handle, [data-spw-operator]',
    rootMode: 'single',
    load: () => import('./spw-attention-architecture.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwAttentionArchitecture;
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
    load: () => import('./spw-navigation-spells.js'),
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
    load: () => import('./spw-operators.js'),
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
    load: () => import('./spw-haptics.js'),
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
    load: () => import('./spw-local-memory-controls.js'),
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
    load: () => import('./spw-prompt-utils.js'),
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
    load: () => import('./spw-experiential.js'),
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
    load: () => import('./spw-spells.js'),
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
    load: () => import('./spw-guide.js'),
    mount: (mod, ctx) => {
      const fn = mod?.initSpwGuide;
      if (!isFn(fn)) return;
      return fn(ctx);
    },
  },
];

/* ==========================================================================
   11. Module mounting
   ========================================================================== */

function makeRecordId(def, root = null, index = 0) {
  if (!root || root === document.body) return def.id;
  const rootId = root.id || root.getAttribute('data-spw-region-key') || root.getAttribute('data-spw-id') || root.getAttribute('data-spw-kind') || index;
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
        def.layer === MODULE_LAYERS.ENHANCEMENT || def.layer === MODULE_LAYERS.REGION
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
  const interactionDefs = defs.filter((def) => def.when === MOUNT_WHEN.INTERACTION && matchesRoute(def) && hasSelector(def));
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
  const regionDefs = defs.filter((def) => def.when === MOUNT_WHEN.REGION && matchesRoute(def) && hasSelector(def));
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
  const idleDefs = defs.filter((def) => def.when === MOUNT_WHEN.IDLE && matchesRoute(def) && hasSelector(def));
  if (!idleDefs.length) return;

  const handle = onIdle(async () => {
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
  delete HTML.dataset.spwPageState;
  delete HTML.dataset.spwPagePresence;
  delete HTML.dataset.spwPageArrival;
  delete HTML.dataset.spwPageArrivalStep;
  delete HTML.dataset.spwAttentionContext;
  delete HTML.dataset.spwHarmonyField;
  delete HTML.dataset.spwTempoField;
}

async function bootSite() {
  await whenDocumentReady();
  const normalized = normalizeDocumentMetadata();
  SITE_SURFACE = normalized.surface || SITE_SURFACE;

  runtimeCtx = createRuntimeContext();
  setPageState(PAGE_STATES.BOOTING);
  runtimeCtx.addCleanup(initPageAttentionLifecycle(runtimeCtx));

  runtimeCtx.bus.emit('spw:page-boot', { route: runtimeCtx.route });

  primeRegions(runtimeCtx);

  await mountImmediateLayer(CORE_DEFS, runtimeCtx);
  await mountImmediateLayer(
    FEATURE_DEFS.filter((def) => def.when === MOUNT_WHEN.IMMEDIATE),
    runtimeCtx
  );
  await mountImmediateLayer(
    ENHANCEMENT_DEFS.filter((def) => def.when === MOUNT_WHEN.IMMEDIATE),
    runtimeCtx
  );
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
  refreshRuntime: () => runtimeCtx && refreshRuntime(runtimeCtx),
  getContext: () => runtimeCtx,
};

/* ==========================================================================
   15. Start
   ========================================================================== */

void bootSite();
