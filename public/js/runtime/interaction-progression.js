/**
 * interaction-progression.js
 * ---------------------------------------------------------------------------
 * Progressive interaction phases and microinteraction pulses across figures,
 * gestures, pinch scaling, ecology settle, and link contracts.
 */

import {
  GESTURE_TARGET_SELECTOR,
  IMAGE_STATE_TO_PHASE,
  SCROLL_RAIL_SELECTOR,
  phaseFromGesture,
  phaseFromGestureContract,
  phaseFromInteractionContract,
  phaseFromLoopState,
  strongestPhase,
} from './interaction-vocabulary.js';
import { readMicrointeractionPulseMs } from './pulse-beat-tuner.js';

const PHASE_EVENT = 'spw:interaction-phase';
const SWIPE_DELTA_PX = 28;
const SWIPE_COOLDOWN_MS = 420;

let initialized = false;
let pulseTimer = null;
let currentPhase = 'idle';
let swipeCooldown = 0;

function writePhase(html, phase, detail = {}) {
  if (!html || !phase) return;
  const next = phase === 'idle' && detail.source === 'blur' ? 'idle' : phase;
  if (next === currentPhase && !detail.force) return;

  currentPhase = next;
  html.dataset.spwInteractionPhase = next;
  if (next !== 'idle') {
    html.dataset.spwMicrointeractionPulse = next;
    if (pulseTimer) window.clearTimeout(pulseTimer);
    const pulseMs = readMicrointeractionPulseMs(html.ownerDocument || document);
    pulseTimer = window.setTimeout(() => {
      delete html.dataset.spwMicrointeractionPulse;
    }, pulseMs);
  } else {
    delete html.dataset.spwMicrointeractionPulse;
  }

  document.dispatchEvent(new CustomEvent(PHASE_EVENT, {
    detail: { phase: next, ...detail },
    bubbles: true,
  }));
}

function readImagePhase(target) {
  if (!(target instanceof HTMLElement)) return '';
  const figure = target.closest('[data-spw-image-interaction-state]');
  if (!figure) return '';
  return IMAGE_STATE_TO_PHASE[figure.dataset.spwImageInteractionState] || '';
}

function readGesturePhase(target) {
  if (!(target instanceof HTMLElement)) return '';
  const host = target.closest('[data-spw-gesture]');
  if (!host) return '';
  return phaseFromGesture(host.dataset.spwGesture);
}

function readContractPhase(target) {
  if (!(target instanceof HTMLElement)) return '';
  const host = target.closest('[data-spw-interaction-contract]');
  if (!host) return '';
  return phaseFromInteractionContract(host.dataset.spwInteractionContract);
}

function readGestureContractPhase(target) {
  if (!(target instanceof HTMLElement)) return '';
  const host = target.closest('[data-spw-gesture-contract]');
  if (!host) return '';
  return phaseFromGestureContract(host.dataset.spwGestureContract);
}

function readLoopPhase(target) {
  if (!(target instanceof HTMLElement)) return '';
  const host = target.closest('[data-spw-loop-state]');
  if (!host) return '';
  return phaseFromLoopState(host.dataset.spwLoopState);
}

// 'settle' is the top of the phase ladder and the ecology drives it shortly
// after load, so strongestPhase(currentPhase='settle', …) would pin every later
// hover/focus/gesture at 'settle' and silently swallow its microinteraction.
// 'settle' is a *resting* terminal, not a live peak: a fresh interaction is
// allowed to begin a new arc from it, which keeps the interaction-reward
// contract (no silent absorption) after the page has settled.
const RESTING_PHASES = new Set(['idle', 'settle']);

function bumpPhase(html, candidate, detail = {}) {
  if (!candidate) return;
  const baseline = RESTING_PHASES.has(currentPhase) ? 'idle' : currentPhase;
  writePhase(html, strongestPhase(baseline, candidate), detail);
}

export function initInteractionProgression(root = document) {
  if (initialized) return () => {};
  initialized = true;

  const html = root.documentElement;
  const controller = new AbortController();
  const { signal } = controller;
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  writePhase(html, 'idle', { source: 'boot', force: true });

  const onImageLens = (event) => {
    writePhase(html, 'charge', { source: 'image-lens', lens: event.detail?.lens, force: true });
  };

  const onDiscovery = () => {
    writePhase(html, 'discover', { source: 'image-discovery', force: true });
  };

  const onImageSwipe = () => {
    writePhase(html, 'discover', { source: 'image-swipe', force: true });
  };

  const onEcology = (event) => {
    const phase = event.detail?.phase;
    if (phase === 'settling' || phase === 'personalizing') {
      writePhase(html, 'approach', { source: 'ecology', ecology: phase, force: true });
    }
    if (phase === 'settled') {
      writePhase(html, 'settle', { source: 'ecology', ecology: phase, force: true });
    }
  };

  const onPointerDown = (event) => {
    const imagePhase = readImagePhase(event.target);
    if (imagePhase) {
      writePhase(html, imagePhase, { source: 'image', imagePhase, force: true });
      return;
    }

    const loopPhase = readLoopPhase(event.target);
    if (loopPhase) {
      bumpPhase(html, loopPhase, { source: 'loop-state', force: true });
      return;
    }

    const contractPhase = readContractPhase(event.target);
    if (contractPhase) {
      bumpPhase(html, contractPhase, { source: 'interaction-contract', force: true });
      return;
    }

    const gestureContractPhase = readGestureContractPhase(event.target);
    if (gestureContractPhase) {
      bumpPhase(html, gestureContractPhase, { source: 'gesture-contract', force: true });
      return;
    }

    const gesturePhase = readGesturePhase(event.target);
    if (gesturePhase) {
      bumpPhase(html, gesturePhase, { source: 'gesture', force: true });
    }
  };

  const onFocusIn = (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.closest(GESTURE_TARGET_SELECTOR)) return;
    bumpPhase(html, 'prime', { source: 'focus', force: true });
  };

  const onFocusOut = (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.closest(GESTURE_TARGET_SELECTOR)) return;
    const next = event.relatedTarget instanceof HTMLElement
      && event.relatedTarget.closest(GESTURE_TARGET_SELECTOR)
      ? null
      : 'idle';
    if (next) writePhase(html, next, { source: 'blur', force: true });
  };

  const onPointerEnter = (event) => {
    if (!supportsHover) return;
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.closest(GESTURE_TARGET_SELECTOR)) return;
    bumpPhase(html, 'approach', { source: 'hover' });
  };

  const onPinchAttr = () => {
    if (html.dataset.spwPinchScaling === 'true' || root.body?.dataset.spwPinchScaling === 'true') {
      writePhase(html, 'approach', { source: 'pinch-scale', force: true });
    }
  };

  const onLoopOrGestureAttr = (records) => {
    let phase = '';
    records.forEach((record) => {
      if (record.type !== 'attributes') return;
      if (record.attributeName === 'data-spw-gesture') {
        const mapped = phaseFromGesture(record.target?.dataset?.spwGesture);
        if (mapped) phase = strongestPhase(phase, mapped);
        return;
      }
      if (record.attributeName === 'data-spw-loop-state') {
        const mapped = phaseFromLoopState(record.target?.dataset?.spwLoopState);
        if (mapped) phase = strongestPhase(phase, mapped);
      }
    });
    if (phase) bumpPhase(html, phase, { source: 'gesture-or-loop-state', force: true });
  };

  const gestureObserver = typeof MutationObserver === 'function'
    ? new MutationObserver(onLoopOrGestureAttr)
    : null;

  gestureObserver?.observe(root.body || html, {
    attributes: true,
    attributeFilter: ['data-spw-gesture', 'data-spw-loop-state'],
    subtree: true,
  });

  const pinchObserver = typeof MutationObserver === 'function'
    ? new MutationObserver(onPinchAttr)
    : null;

  pinchObserver?.observe(html, { attributes: true, attributeFilter: ['data-spw-pinch-scaling'] });
  if (root.body) {
    pinchObserver?.observe(root.body, { attributes: true, attributeFilter: ['data-spw-pinch-scaling'] });
  }

  const imageObserver = typeof MutationObserver === 'function'
    ? new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type !== 'attributes' || record.attributeName !== 'data-spw-image-interaction-state') return;
        const figure = record.target;
        if (!(figure instanceof HTMLElement)) return;
        const mapped = IMAGE_STATE_TO_PHASE[figure.dataset.spwImageInteractionState];
        if (mapped) writePhase(html, mapped, { source: 'image-state', force: true });
      });
    })
    : null;

  const observeImages = () => {
    root.querySelectorAll('[data-spw-image-interaction-state]').forEach((node) => {
      imageObserver?.observe(node, { attributes: true, attributeFilter: ['data-spw-image-interaction-state'] });
    });
  };

  observeImages();

  const domObserver = typeof MutationObserver === 'function'
    ? new MutationObserver(observeImages)
    : null;

  domObserver?.observe(root.body || html, { childList: true, subtree: true });

  const swipeState = new WeakMap();

  const onRailPointerDown = (event) => {
    if (!(event.target instanceof Element)) return;
    const rail = event.target.closest(SCROLL_RAIL_SELECTOR);
    if (!rail) return;
    swipeState.set(rail, {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: rail.scrollLeft,
    });
  };

  const onRailPointerUp = (event) => {
    if (!(event.target instanceof Element)) return;
    const rail = event.target.closest(SCROLL_RAIL_SELECTOR);
    if (!rail) return;
    const start = swipeState.get(rail);
    swipeState.delete(rail);
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const scrollDelta = rail.scrollLeft - start.scrollLeft;
    const moved = Math.abs(dx) > Math.abs(dy)
      && (Math.abs(dx) > SWIPE_DELTA_PX || Math.abs(scrollDelta) > SWIPE_DELTA_PX);

    if (!moved) return;
    const now = Date.now();
    if (now - swipeCooldown < SWIPE_COOLDOWN_MS) return;
    swipeCooldown = now;
    writePhase(html, 'discover', { source: 'swipe-rail', force: true });
  };

  const onVariantSelected = (event) => {
    const source = event.detail?.source || 'variant';
    // Selection is a deliberate commit — prime, not a full discover arc.
    writePhase(html, 'prime', {
      source: 'variant-selection',
      variant: event.detail?.variant,
      selectionSource: source,
      force: true,
    });
  };

  let lastLayoutTuner = html.dataset.spwLayoutTuner || '';
  const onSettingsLayoutSelection = () => {
    const nextTuner = html.dataset.spwLayoutTuner || '';
    if (!nextTuner || nextTuner === lastLayoutTuner) {
      lastLayoutTuner = nextTuner;
      return;
    }
    lastLayoutTuner = nextTuner;
    html.dataset.spwLayoutSelectionPulse = nextTuner;
    writePhase(html, 'approach', {
      source: 'layout-selection',
      layoutTuner: nextTuner,
      force: true,
    });
    window.setTimeout(() => {
      if (html.dataset.spwLayoutSelectionPulse === nextTuner) {
        delete html.dataset.spwLayoutSelectionPulse;
      }
    }, readMicrointeractionPulseMs(html.ownerDocument || document));
  };

  document.addEventListener('spw:image-lens', onImageLens, { signal });
  document.addEventListener('spw:image-swipe', onImageSwipe, { signal });
  document.addEventListener('spw:discovery-reward', onDiscovery, { signal });
  document.addEventListener('spw:loading-ecology', onEcology, { signal });
  document.addEventListener('spw:variant-selected', onVariantSelected, { signal });
  document.addEventListener('spw:settings:changed', onSettingsLayoutSelection, { signal });
  document.addEventListener('spw:settings-change', onSettingsLayoutSelection, { signal });
  document.addEventListener('pointerdown', onPointerDown, { signal, capture: true });
  document.addEventListener('focusin', onFocusIn, { signal, capture: true });
  document.addEventListener('focusout', onFocusOut, { signal, capture: true });
  document.addEventListener('pointerenter', onPointerEnter, { signal, capture: true });
  document.addEventListener('pointerdown', onRailPointerDown, { signal, capture: true });
  document.addEventListener('pointerup', onRailPointerUp, { signal, capture: true });
  document.addEventListener('pointercancel', onRailPointerUp, { signal, capture: true });

  onPinchAttr();

  controller.signal.addEventListener('abort', () => {
    gestureObserver?.disconnect();
    pinchObserver?.disconnect();
    imageObserver?.disconnect();
    domObserver?.disconnect();
    if (pulseTimer) window.clearTimeout(pulseTimer);
    initialized = false;
    currentPhase = 'idle';
  }, { once: true });

  return () => controller.abort();
}

export { INTERACTION_PHASES } from './interaction-vocabulary.js';