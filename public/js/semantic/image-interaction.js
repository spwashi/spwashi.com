/**
 * image-interaction.js
 * ---------------------------------------------------------------------------
 * Image framing interaction: prime on hover/focus, inspect on hold, lens cycle
 * on horizontal swipe, discovered sync with reward surfaces.
 */

import { isOwnAffordanceTarget, observeAddedMatches } from '/public/js/kernel/dom-contracts.js';
import { resolveOwnerDocument } from '/public/js/runtime/runtime-helpers.js';
import { syncEffectInterpretation } from './effect-interpretation.js';

const INTERACTIVE_FIGURE_SELECTOR = [
  '.topic-photo-card',
  '.image-study',
  '[data-spw-image-reward]',
  '[data-spw-image-discovery]',
  '.frame-card-media',
  '[data-spw-image-surface]',
].join(', ');

const DISCOVERY_SELECTOR = '[data-spw-image-reward], [data-spw-image-discovery]';
const STUDY_GESTURE_CONTRACT = 'tap:prime swipe:toggle-lens hold:inspect';
const DISCOVERY_GESTURE_CONTRACT = 'tap:discover swipe:toggle-lens hold:inspect';
const HOLD_MS = 420;
const SWIPE_MIN_PX = 48;
const SWIPE_DOMINANCE = 1.45;
const DEFAULT_LENS_CUES = ['probe', 'frame', 'surface'];

let initialized = false;

function isInteractiveFigure(node) {
  return node instanceof HTMLElement && node.matches(INTERACTIVE_FIGURE_SELECTOR);
}

function readDiscovered(figure) {
  return figure.dataset.spwImageDiscovered === 'true';
}

function readReduceMotion() {
  return document.documentElement.dataset.spwReduceMotion === 'on';
}

function readLensCues(figure) {
  const authored = (figure.dataset.spwImageLensCues || '')
    .split(/[|,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (authored.length) return authored;

  const operator = figure.dataset.spwAccentOperator;
  if (operator) {
    return [operator, 'frame', 'probe'].filter((value, index, list) => list.indexOf(value) === index);
  }
  return [...DEFAULT_LENS_CUES];
}

function setInteractionState(figure, state) {
  if (!isInteractiveFigure(figure)) return;
  if (readDiscovered(figure) && state !== 'discovered') {
    figure.dataset.spwImageInteractionState = 'discovered';
    return;
  }
  figure.dataset.spwImageInteractionState = state;
  syncEffectInterpretation(figure);
}

function setLens(figure, lens) {
  if (!lens) return;
  figure.dataset.spwImageLensActive = lens;
  if (figure.matches(DISCOVERY_SELECTOR)) {
    figure.dataset.spwDiscoveryMotion = `${lens} lens`;
  }
  figure.dispatchEvent(new CustomEvent('spw:image-lens', {
    detail: { lens, figure },
    bubbles: true,
  }));
  syncEffectInterpretation(figure);
}

function cycleLens(figure, direction = 1) {
  const cues = readLensCues(figure);
  if (!cues.length) return;

  const current = figure.dataset.spwImageLensActive || cues[0];
  const index = cues.indexOf(current);
  const nextIndex = index === -1
    ? (direction > 0 ? 0 : cues.length - 1)
    : (index + direction + cues.length) % cues.length;

  setLens(figure, cues[nextIndex]);
  setInteractionState(figure, 'lensed');
  window.setTimeout(() => {
    if (figure.dataset.spwImageInteractionState === 'lensed') {
      setInteractionState(figure, figure.matches(':hover') ? 'primed' : 'idle');
    }
  }, 220);
}

function primeFigure(figure) {
  const isDiscovery = figure.matches(DISCOVERY_SELECTOR);
  const contract = isDiscovery ? DISCOVERY_GESTURE_CONTRACT : STUDY_GESTURE_CONTRACT;

  if (!figure.hasAttribute('data-spw-gesture-contract')) {
    figure.setAttribute('data-spw-gesture-contract', contract);
  }
  if (!figure.hasAttribute('data-spw-interaction-contract')) {
    figure.setAttribute('data-spw-interaction-contract', isDiscovery ? 'image-discovery' : 'image-study');
    figure.setAttribute('data-spw-interaction-affordance', isDiscovery ? 'discover' : 'prime');
  }
  if (!figure.dataset.spwImageLensActive) {
    setLens(figure, readLensCues(figure)[0]);
  }
  if (isDiscovery && !figure.hasAttribute('tabindex')) {
    figure.setAttribute('tabindex', '0');
  }
  if (readDiscovered(figure)) {
    setInteractionState(figure, 'discovered');
  } else if (!figure.dataset.spwImageInteractionState) {
    setInteractionState(figure, 'idle');
  }
  syncEffectInterpretation(figure);
}

function bindFigure(figure, controller) {
  primeFigure(figure);

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let holdTimer = null;
  let holdActive = false;

  const clearHold = () => {
    if (holdTimer) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
    holdActive = false;
  };

  const onPrime = () => {
    if (readDiscovered(figure)) {
      setInteractionState(figure, 'discovered');
      return;
    }
    setInteractionState(figure, 'primed');
  };

  const onIdle = () => {
    clearHold();
    if (figure.dataset.spwImageInteractionState === 'inspecting') return;
    setInteractionState(figure, readDiscovered(figure) ? 'discovered' : 'idle');
  };

  figure.addEventListener('pointerenter', onPrime, { signal: controller.signal });
  figure.addEventListener('focusin', onPrime, { signal: controller.signal });
  figure.addEventListener('pointerleave', onIdle, { signal: controller.signal });
  figure.addEventListener('focusout', onIdle, { signal: controller.signal });

  figure.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if (!isOwnAffordanceTarget(figure, event.target)) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    clearHold();

    if (readDiscovered(figure)) return;

    if (!readReduceMotion()) {
      holdTimer = window.setTimeout(() => {
        holdActive = true;
        setInteractionState(figure, 'inspecting');
      }, HOLD_MS);
    }
  }, { signal: controller.signal });

  figure.addEventListener('pointermove', (event) => {
    if (pointerId !== event.pointerId || holdActive) return;
    const dx = Math.abs(event.clientX - startX);
    const dy = Math.abs(event.clientY - startY);
    if (dx > 10 || dy > 10) clearHold();
  }, { signal: controller.signal });

  figure.addEventListener('pointerup', (event) => {
    if (pointerId !== event.pointerId) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const swiped = absX >= SWIPE_MIN_PX && absX > absY * SWIPE_DOMINANCE;

    clearHold();

    if (readDiscovered(figure)) {
      setInteractionState(figure, 'discovered');
      pointerId = null;
      return;
    }

    if (swiped) {
      const direction = dx > 0 ? 1 : -1;
      cycleLens(figure, direction);
      figure.dispatchEvent(new CustomEvent('spw:image-swipe', {
        detail: { figure, direction, lens: figure.dataset.spwImageLensActive },
        bubbles: true,
      }));
      pointerId = null;
      return;
    }

    if (holdActive) {
      setInteractionState(figure, figure.matches(':hover') ? 'primed' : 'idle');
    } else if (absX < 8 && absY < 8) {
      setInteractionState(figure, 'primed');
    } else {
      setInteractionState(figure, figure.matches(':hover') ? 'primed' : 'idle');
    }

    pointerId = null;
  }, { signal: controller.signal });

  figure.addEventListener('pointercancel', () => {
    clearHold();
    onIdle();
    pointerId = null;
  }, { signal: controller.signal });

  figure.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      cycleLens(figure, 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      cycleLens(figure, -1);
    }
  }, { signal: controller.signal });
}

function bindLensChipSelection(root, controller) {
  root.addEventListener('click', (event) => {
    const chip = event.target.closest('.spw-effect-chip[data-spw-lens-chip]');
    if (!(chip instanceof HTMLElement)) return;
    if (chip.getAttribute('aria-pressed') === 'true') return;

    const figure = chip.closest(INTERACTIVE_FIGURE_SELECTOR);
    const lens = chip.dataset.spwLensChip;
    if (!(figure instanceof HTMLElement) || !lens) return;

    event.preventDefault();
    setLens(figure, lens);
    setInteractionState(figure, 'lensed');
    window.setTimeout(() => {
      if (figure.dataset.spwImageInteractionState === 'lensed') {
        setInteractionState(figure, figure.matches(':hover') ? 'primed' : 'idle');
      }
    }, 220);
  }, { signal: controller.signal });
}

function observeDiscovered(figures, controller) {
  if (typeof MutationObserver !== 'function') return null;

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type !== 'attributes' || record.attributeName !== 'data-spw-image-discovered') return;
      const figure = record.target;
      if (!isInteractiveFigure(figure)) return;
      if (readDiscovered(figure)) {
        setInteractionState(figure, 'discovered');
      }
    });
  });

  figures.forEach((figure) => {
    observer.observe(figure, { attributes: true, attributeFilter: ['data-spw-image-discovered'] });
  });

  controller.signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  return observer;
}

function collectFigures(root) {
  return [...root.querySelectorAll(INTERACTIVE_FIGURE_SELECTOR)]
    .filter((figure) => figure instanceof HTMLElement);
}

export function initImageInteraction(root = document) {
  if (initialized) return () => {};
  initialized = true;

  const controller = new AbortController();
  const figures = collectFigures(root);

  figures.forEach((figure) => {
    figure.dataset.spwImageInteractionBound = 'true';
    bindFigure(figure, controller);
  });
  bindLensChipSelection(root, controller);
  observeDiscovered(figures, controller);

  const disconnect = observeAddedMatches(INTERACTIVE_FIGURE_SELECTOR, () => {
    collectFigures(root).forEach((figure) => {
      if (!figure.dataset.spwImageInteractionBound) {
        figure.dataset.spwImageInteractionBound = 'true';
        bindFigure(figure, controller);
      }
      primeFigure(figure);
    });
  }, { root: root.body || root.documentElement });

  controller.signal.addEventListener('abort', () => {
    disconnect();
    initialized = false;
  }, { once: true });

  return () => controller.abort();
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'image-interaction',
  mount: (ctx, root) => initImageInteraction(resolveOwnerDocument(ctx, root)),
  describes: 'image[interaction]{prime|inspect|discover|lens} gesture-contract',
  timingArc: 'visible-media',
  effectScope: 'media listeners element-state',
});

export const spwModule = SPW_MODULE_EXPORT;