/**
 * Minimal core bindings mounted before feature and enhancement layers.
 */

import { FRAME_SELECTOR } from '../kernel/dom-contracts.js';
import { safeQuery, safeQueryAll } from './runtime-helpers.js';
import {
  REGION_STATES,
  refreshRegionProfiles,
  setRegionState,
} from './region-profiler.js';

export function initMinimalSiteCore(ctx) {
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
          console.warn('[site-core-minimal] core cleanup failed', error);
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

function activateHashTargetFrame(ctx) {
  const frame = resolveHashTargetFrame();
  const frames = safeQueryAll(FRAME_SELECTOR);

  for (const candidate of frames) {
    const isActive = candidate === frame;
    if (isActive) {
      candidate.dataset.state = 'active';
      candidate.dataset.spwActive = 'true';
      candidate.dataset.spwAttention = 'focused';
      candidate.dataset.spwStateAccent = 'active';
    } else {
      delete candidate.dataset.state;
      candidate.dataset.spwActive = 'false';
      candidate.dataset.spwAttention = 'ambient';
      delete candidate.dataset.spwStateAccent;
    }
  }

  if (!frame) return null;

  ctx.bus.emit('spw:hash-target', { frame, id: frame.id || null });
  ctx.bus.emit('spw:frame-change', {
    id: frame.id || null,
    frame,
    route: ctx.route,
    source: 'hash',
  });

  return frame;
}

function bindHashLandingState(ctx) {
  const handle = window.setTimeout(() => activateHashTargetFrame(ctx), 0);
  ctx.addTimer(handle);

  return () => window.clearTimeout(handle);
}

function bindHashChangeRefresh(ctx) {
  const handler = () => {
    activateHashTargetFrame(ctx);
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