/**
 * Minimal core bindings mounted before feature and enhancement layers.
 */

import { FRAME_SELECTOR, writeDatasetValue } from '../../kernel/dom-contracts.js';
import { readSustainedLens, writeSustainedLens } from '../../kernel/visit-intent.js';
import { safeQuery, safeQueryAll } from '/public/js/kernel/browser-primitives.js';
import {
  LENS_MODE_REQUEST_EVENT,
  LENS_MODE_SETTLE_MS,
  findLensModeSwitches,
  hasLensMode,
  parseLensModeQuery,
  lensFilterToggleCopy,
  resolveLensRovingIndex,
  resolveSustainedLensChoice,
  writeLensModeState,
} from './lens-modes.js';
import {
  applyProfileLensField,
  readActiveProfile,
} from './lens-reach.js';
import {
  REGION_STATES,
  refreshRegionProfiles,
  setRegionState,
} from '../regions/region-profiler.js';

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

function parseStandaloneLensQuery() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(String(window.location?.search || '').replace(/^\?/, ''));
  const raw = params.get('spw-lens') || '';
  if (!raw) return '';
  const [, mode = raw] = raw.split(':');
  return String(mode || '').trim();
}

function bindModeGroups(ctx) {
  const buttons = safeQueryAll('[data-mode-group][data-set-mode]');
  const grouped = new Map();
  const settleTimers = new WeakMap();
  const activeTimers = new Set();

  for (const button of buttons) {
    const group = button.getAttribute('data-mode-group');
    if (!group) continue;
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group).push(button);
  }

  const syncFilterToggleControls = () => {
    const isFiltered = document.documentElement.dataset.spwLensFilter === 'matched';
    const copy = lensFilterToggleCopy(isFiltered);
    for (const toggle of safeQueryAll('[data-spw-lens-filter-toggle]')) {
      toggle.hidden = false;
      toggle.setAttribute('aria-pressed', String(isFiltered));
      toggle.dataset.spwFilterState = copy.state;
      if (toggle.textContent !== copy.label) toggle.textContent = copy.label;
      if (toggle.getAttribute('title') !== copy.title) toggle.setAttribute('title', copy.title);
      if (toggle.getAttribute('aria-label') !== copy.title) toggle.setAttribute('aria-label', copy.title);
    }
  };

  const restoreFilterState = () => {
    const sustained = readSustainedLens();
    const filterValue = sustained?.filterMode === 'matched' ? 'matched' : null;
    writeDatasetValue(document.documentElement, 'spwLensFilter', filterValue);
    syncFilterToggleControls();
  };

  const setTransientState = (element, state = 'changed') => {
    if (!(element instanceof HTMLElement)) return;
    element.dataset.spwLensState = state;
    const existing = settleTimers.get(element);
    if (existing) {
      window.clearTimeout(existing);
      activeTimers.delete(existing);
    }
    const timer = window.setTimeout(() => {
      if (element.dataset.spwLensState === state) {
        element.dataset.spwLensState = 'settled';
      }
      settleTimers.delete(element);
      activeTimers.delete(timer);
    }, LENS_MODE_SETTLE_MS);
    settleTimers.set(element, timer);
    activeTimers.add(timer);
  };

  function applyMode(group, mode, options = {}) {
    const groupButtons = grouped.get(group) || [];
    // An unavailable mode leaves the group as it is: no fallback to the first
    // button, no event, no settle.
    if (!hasLensMode(groupButtons, mode)) return null;
    const detail = writeLensModeState({
      group,
      mode,
      buttons: groupButtons,
      source: options.source || 'mode-switch',
      setTransientState: (element) => setTransientState(element, options.initial ? 'settled' : 'changed'),
    });
    if (detail) ctx.bus.emit('frame:mode', detail);
    return detail;
  }

  const handlers = [];
  restoreFilterState();

  for (const button of buttons) {
    const handler = (event) => {
      event.preventDefault();
      const group = button.getAttribute('data-mode-group');
      const mode = button.getAttribute('data-set-mode');
      if (!group || !mode) return;
      applyMode(group, mode, { source: 'mode-switch' });
    };
    // Roving tabindex lives with the writer: arrows move within the group and
    // select as they go, Home and End jump. The tabindex itself is written by
    // writeLensModeState with the pressed state.
    const onKeydown = (event) => {
      const group = button.getAttribute('data-mode-group');
      const groupButtons = grouped.get(group) || [];
      const index = groupButtons.indexOf(button);
      const targetIndex = resolveLensRovingIndex(groupButtons.length, index, event.key);
      if (targetIndex === -1 || targetIndex === index) return;
      event.preventDefault();
      const next = groupButtons[targetIndex];
      next.focus?.({ preventScroll: true });
      applyMode(group, next.getAttribute('data-set-mode'), { source: 'keyboard' });
    };
    button.addEventListener('click', handler);
    button.addEventListener('keydown', onKeydown);
    handlers.push(() => {
      button.removeEventListener('click', handler);
      button.removeEventListener('keydown', onKeydown);
    });
  }

  // Everything else asks. The console, brace edges, probe sigils, and the
  // variant query all emit this request; the answer is one write here.
  const offRequest = ctx.bus?.on?.(LENS_MODE_REQUEST_EVENT, (event) => {
    const request = event?.detail || {};
    if (!request.mode) return;
    if (request.group && grouped.has(request.group)) {
      applyMode(request.group, request.mode, { source: request.source || 'request' });
      return;
    }
    for (const [group, groupButtons] of grouped.entries()) {
      if (hasLensMode(groupButtons, request.mode)) {
        applyMode(group, request.mode, { source: request.source || 'request' });
        return;
      }
    }
    writeSustainedLens({
      mode: request.mode,
      group: request.group || document.documentElement.dataset.spwActiveLensGroup || 'lens',
      operator: request.operator || '',
      filterMode: document.documentElement.dataset.spwLensFilter || readSustainedLens()?.filterMode || '',
    });
    writeDatasetValue(document.documentElement, 'spwActiveLensGroup', request.group || 'lens');
    writeDatasetValue(document.documentElement, 'spwActiveLensMode', request.mode);
    writeDatasetValue(document.documentElement, 'spwActiveLensSource', request.source || 'request');
    applyProfileLensField(document, {
      mode: request.mode,
      operator: request.operator || '',
      source: request.source || 'request',
    });
  });
  if (typeof offRequest === 'function') handlers.push(offRequest);

  const onFilterClick = (event) => {
    const toggle = event.target?.closest?.('[data-spw-lens-filter-toggle]');
    if (!toggle) return;
    event.preventDefault();
    const nextFiltered = document.documentElement.dataset.spwLensFilter !== 'matched';
    writeDatasetValue(document.documentElement, 'spwLensFilter', nextFiltered ? 'matched' : null);
    const current = readSustainedLens();
    if (current?.mode || document.documentElement.dataset.spwActiveLensMode || nextFiltered) {
      writeSustainedLens({
        mode: current?.mode || document.documentElement.dataset.spwActiveLensMode || '',
        group: current?.group || document.documentElement.dataset.spwActiveLensGroup || 'lens',
        operator: current?.operator || '',
        filterMode: nextFiltered ? 'matched' : '',
      });
    }
    syncFilterToggleControls();
    applyProfileLensField(document, {
      mode: document.documentElement.dataset.spwActiveLensMode || '',
      operator: readActiveProfile(document).operator,
      source: 'mode-switch',
    });
  };
  document.addEventListener('click', onFilterClick);
  handlers.push(() => document.removeEventListener('click', onFilterClick));

  const syncStandaloneField = (sourceHint = 'initial') => {
    const sustained = readSustainedLens();
    const queryMode = parseStandaloneLensQuery();
    const mode = queryMode || sustained?.mode || document.documentElement.dataset.spwActiveLensMode || '';
    const source = queryMode ? 'query' : sustained?.mode ? 'sustained' : sourceHint;
    if (mode && !grouped.size) {
      writeDatasetValue(document.documentElement, 'spwActiveLensGroup', sustained?.group || 'lens');
      writeDatasetValue(document.documentElement, 'spwActiveLensMode', mode);
      writeDatasetValue(document.documentElement, 'spwActiveLensSource', source);
    }
    applyProfileLensField(document, {
      mode,
      operator: sustained?.operator || readActiveProfile(document, { sustained }).operator,
      source,
    });
  };

  if (grouped.size) {
    const initial = parseLensModeQuery(grouped);
    const sustainedChoice = !initial ? resolveSustainedLensChoice(grouped, document) : null;
    for (const [group, groupButtons] of grouped.entries()) {
      const queryHit = initial?.group === group ? initial : null;
      const sustainedHit = !queryHit && sustainedChoice?.group === group ? sustainedChoice : null;
      const active = queryHit
        ? groupButtons.find((button) => button.getAttribute('data-set-mode') === queryHit.mode)
        : sustainedHit
          ? groupButtons.find((button) => button.getAttribute('data-set-mode') === sustainedHit.mode)
          : groupButtons.find((button) => button.getAttribute('aria-pressed') === 'true');
      const mode = active?.getAttribute('data-set-mode') || groupButtons[0]?.getAttribute('data-set-mode');
      const source = queryHit ? 'query' : sustainedHit ? sustainedHit.source : 'initial';
      if (mode) {
        applyMode(group, mode, {
          source,
          initial: source === 'initial',
        });
      }
    }
  } else {
    syncStandaloneField('initial');
  }

  const offSettings = ctx.bus?.on?.('settings:changed', () => {
    const currentSource = document.documentElement.dataset.spwActiveLensSource || 'initial';
    if (grouped.size && currentSource !== 'mode-switch' && currentSource !== 'keyboard' && currentSource !== 'query') {
      const choice = resolveSustainedLensChoice(grouped, document);
      if (choice && applyMode(choice.group, choice.mode, { source: choice.source })) return;
    }
    syncStandaloneField(currentSource);
  });
  if (typeof offSettings === 'function') handlers.push(offSettings);

  return () => {
    for (const cleanup of handlers) cleanup();
    for (const switchEl of findLensModeSwitches(buttons)) {
      const timer = settleTimers.get(switchEl);
      if (timer) window.clearTimeout(timer);
    }
    for (const timer of activeTimers) window.clearTimeout(timer);
    activeTimers.clear();
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
