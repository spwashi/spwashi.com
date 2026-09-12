/**
 * interaction/progression.js
 * ---------------------------------------------------------------------------
 * Progressive interaction phases and microinteraction pulses across figures,
 * gestures, pinch scaling, ecology settle, and link contracts.
 */

import { bus } from '../../kernel/bus.js';
import { supportsFinePointerHover } from '../../kernel/dom-contracts.js';
import { bindInteractionHops, readHopHash } from './hops.js';
import {
  GESTURE_TARGET_SELECTOR,
  phaseFromSpell,
  IN_PAGE_HOP_SELECTOR,
  SCROLL_RAIL_SELECTOR,
  phaseFromContractKind,
  phaseFromGesture,
  phaseFromInteractionContract,
  phaseFromLoopState,
  strongestPhase,
} from './vocabulary.js';
import { readMicrointeractionPulseMs } from '../pulse-beat-tuner.js';
import { ensureInteractionProgressionStyles } from '../../kernel/deferred-styles.js';

import { INTERACTION_HYSTERESIS } from './hysteresis.js';
import { createPhaseQueue } from './phase-queue.js';

const PHASE_EVENT = 'spw:interaction-phase';
const RAIL = INTERACTION_HYSTERESIS.rail;

let initialized = false;
let pulseTimer = null;
let currentPhase = 'idle';
let swipeCooldown = 0;
let lastCauldronCount = null;

function commitPhase(html, phase, detail = {}) {
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
  return phaseFromSpell(figure.dataset.spwImageInteractionState, 'image_state');
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

function readLoopPhase(target) {
  if (!(target instanceof HTMLElement)) return '';
  const host = target.closest('[data-spw-loop-state]');
  if (!host) return '';
  return phaseFromLoopState(host.dataset.spwLoopState);
}

function readGestureContractHost(target) {
  if (!(target instanceof Element)) return null;
  return target.closest('[data-spw-gesture-contract]');
}

export function initInteractionProgression(root = document) {
  if (initialized) return () => {};
  const html = document.documentElement;
  if (!html) return () => {};
  initialized = true;
  ensureInteractionProgressionStyles();
  const controller = new AbortController();
  const { signal } = controller;
  const supportsHover = supportsFinePointerHover(window);

  const phases = createPhaseQueue(() => currentPhase, commitPhase);
  const writePhase = phases.write;
  const bumpPhase = phases.bump;
  commitPhase(html, 'idle', { source: 'boot', force: true });
  const hops = bindInteractionHops({ html, root, writePhase, signal });

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

    if (event.target instanceof Element && event.target.closest(IN_PAGE_HOP_SELECTOR)) {
      const href = event.target.closest('a')?.getAttribute('href') || '';
      const hopHash = readHopHash(event.target);
      if (hopHash && !href.startsWith('#')) hops.hop('cross-page-hop', hopHash);
      return;
    }

    if (event.target instanceof Element) {
      if (event.target.closest('[data-spw-handle-target="toggle"]')) {
        bumpPhase(html, 'prime', { source: 'handle-toggle', force: true });
        return;
      }
      const ingredient = event.target.closest('.cauldron-ingredient');
      if (ingredient && !event.target.closest('[data-spw-cauldron-remove]')) {
        bumpPhase(html, 'inspect', { source: 'cauldron-inspect', force: true });
        return;
      }
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

    const tapHost = readGestureContractHost(event.target);
    if (tapHost) {
      const tapPhase = phaseFromContractKind(tapHost.dataset.spwGestureContract, 'tap');
      if (tapPhase) {
        bumpPhase(html, tapPhase, { source: 'tap-contract', force: true });
        return;
      }
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
    if (html.dataset.spwPinchScaling === 'true' || root?.body?.dataset.spwPinchScaling === 'true') {
      writePhase(html, 'approach', { source: 'pinch-scale', force: true });
    }
  };

  const interactionObserver = typeof MutationObserver === 'function'
    ? new MutationObserver((records) => {
      const targets = new Map();
      for (const record of records) {
        if (record.type !== 'attributes') continue;
        if (!targets.has(record.attributeName)) targets.set(record.attributeName, new Set());
        targets.get(record.attributeName).add(record.target);
      }
      if (targets.has('data-spw-pinch-scaling')) onPinchAttr();
      let imagePhase = '';
      for (const target of targets.get('data-spw-image-interaction-state') || []) {
        imagePhase = strongestPhase(imagePhase, phaseFromSpell(target.dataset.spwImageInteractionState, 'image_state'));
      }
      if (imagePhase) writePhase(html, imagePhase, { source: 'image-state', force: true });
      let phase = '';
      for (const target of targets.get('data-spw-gesture') || []) {
        phase = strongestPhase(phase, phaseFromGesture(target.dataset.spwGesture));
      }
      for (const target of targets.get('data-spw-loop-state') || []) {
        phase = strongestPhase(phase, phaseFromLoopState(target.dataset.spwLoopState));
      }
      if (phase) bumpPhase(html, phase, { source: 'gesture-or-loop-state', force: true });
      if (records.some(record => record.type === 'childList')) syncVocabulary();
    })
    : null;

  // Subtree observation already covers images inserted after mount.
  interactionObserver?.observe(html, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: [
      'data-spw-gesture', 'data-spw-loop-state',
      'data-spw-pinch-scaling', 'data-spw-image-interaction-state',
    ],
  });

  // Hover and keyboard focus can coexist; leaving one must preserve the other.
  const vocabularySelector = '[data-spw-vocabulary-term]';
  let hoveredVocabulary = null;
  const vocabularyHost = (target) => target instanceof Element ? target.closest(vocabularySelector) : null;
  const syncVocabulary = () => {
    const focused = document.activeElement;
    const engaged = Boolean(hoveredVocabulary?.isConnected
      || (vocabularyHost(focused) && focused.matches(':focus-visible')));
    if (engaged) {
      if (html.dataset.spwVocabularyHover !== 'true') html.dataset.spwVocabularyHover = 'true';
    } else if (html.hasAttribute('data-spw-vocabulary-hover')) {
      delete html.dataset.spwVocabularyHover;
    }
  };
  const onVocabularyPointerOver = (event) => {
    if (!supportsHover || event.pointerType === 'touch') return;
    hoveredVocabulary = vocabularyHost(event.target);
    syncVocabulary();
  };
  const onVocabularyPointerOut = (event) => {
    if (!supportsHover || event.pointerType === 'touch') return;
    hoveredVocabulary = vocabularyHost(event.relatedTarget);
    syncVocabulary();
  };
  const onVocabularyFocus = () => queueMicrotask(() => {
    if (!signal.aborted) syncVocabulary();
  });
  const onWindowBlur = () => {
    hoveredVocabulary = null;
    delete html.dataset.spwVocabularyHover;
  };
  document.addEventListener('pointerover', onVocabularyPointerOver, { signal, passive: true });
  document.addEventListener('pointerout', onVocabularyPointerOut, { signal, passive: true });
  document.addEventListener('focusin', onVocabularyFocus, { signal });
  document.addEventListener('focusout', onVocabularyFocus, { signal });
  window.addEventListener('blur', onWindowBlur, { signal });
  window.addEventListener('focus', onVocabularyFocus, { signal });
  syncVocabulary();

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
    if (!start || event.type === 'pointercancel') return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const scrollDelta = rail.scrollLeft - start.scrollLeft;
    const moved = Math.abs(dx) > Math.abs(dy)
      && (Math.abs(dx) > RAIL.minDeltaPx || Math.abs(scrollDelta) > RAIL.minDeltaPx);

    if (!moved) return;
    const now = Date.now();
    if (now - swipeCooldown < RAIL.cooldownMs) return;
    const swipeHost = event.target instanceof Element
      ? event.target.closest('[data-spw-gesture-contract*="swipe:"]')
      : null;
    if (!swipeHost) return;
    const swipePhase = phaseFromContractKind(swipeHost.dataset.spwGestureContract, 'swipe');
    if (!swipePhase) return;
    swipeCooldown = now;
    writePhase(html, swipePhase, { source: 'swipe-rail', force: true });
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

  let lastLayoutTuner = html?.dataset?.spwLayoutTuner || '';
  const onCauldronUpdated = (event) => {
    const detail = event?.detail || event || {};
    const count = Number(detail.count ?? detail.items?.length ?? 0);
    const prev = lastCauldronCount;
    lastCauldronCount = count;
    if (prev === null) return;
    if (count > prev) writePhase(html, 'charge', { source: 'cauldron-gather', count, force: true });
    else if (count < prev) writePhase(html, 'settle', { source: 'cauldron-release', count, force: true });
    else if (count > 0) writePhase(html, 'prime', { source: 'cauldron-refresh', count, force: true });
  };

  const onCauldronInspected = (event) => {
    writePhase(html, 'inspect', {
      source: 'cauldron-inspect',
      expression: event?.detail?.expression || event?.expression,
      force: true,
    });
  };

  const onSettingsLayoutSelection = () => {
    const nextTuner = html?.dataset?.spwLayoutTuner || '';
    if (!nextTuner || nextTuner === lastLayoutTuner) {
      lastLayoutTuner = nextTuner;
      return;
    }
    lastLayoutTuner = nextTuner;
    if (html) html.dataset.spwLayoutSelectionPulse = nextTuner;
    if (html) writePhase(html, 'approach', {
      source: 'layout-selection',
      layoutTuner: nextTuner,
      force: true,
    });
    window.setTimeout(() => {
      if (signal.aborted) return;
      if (html?.dataset?.spwLayoutSelectionPulse === nextTuner) {
        delete html.dataset.spwLayoutSelectionPulse;
      }
    }, readMicrointeractionPulseMs(html?.ownerDocument || document));
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
  document.addEventListener('pointerdown', onRailPointerDown, { signal, capture: true, passive: true });
  document.addEventListener('pointerup', onRailPointerUp, { signal, capture: true, passive: true });
  document.addEventListener('pointercancel', onRailPointerUp, { signal, capture: true, passive: true });

  if (typeof bus?.on === 'function') {
    bus.on('cauldron:updated', onCauldronUpdated, { signal });
    bus.on('cauldron:ingredient-inspected', onCauldronInspected, { signal });
  } else {
    document.addEventListener('cauldron:updated', onCauldronUpdated, { signal });
    document.addEventListener('cauldron:ingredient-inspected', onCauldronInspected, { signal });
  }

  onPinchAttr();

  controller.signal.addEventListener('abort', () => {
    interactionObserver?.disconnect();
    phases.clear();
    hoveredVocabulary = null;
    delete html.dataset.spwVocabularyHover;
    swipeCooldown = 0;
    if (pulseTimer) window.clearTimeout(pulseTimer);
    pulseTimer = null;
    delete html.dataset.spwInteractionPhase;
    delete html.dataset.spwMicrointeractionPulse;
    delete html.dataset.spwLayoutSelectionPulse;
    initialized = false;
    currentPhase = 'idle';
    lastCauldronCount = null;
  }, { once: true });

  return () => controller.abort();
}

export { INTERACTION_PHASES } from './vocabulary.js';

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'interaction-progression',
  updates: Object.freeze(['attr:data-spw-interaction-phase', 'attr:data-spw-microinteraction-pulse', 'attr:data-spw-vocabulary-hover']),
  mount: (ctx, root) => initInteractionProgression(root),
});

export const spwModule = SPW_MODULE_EXPORT;
