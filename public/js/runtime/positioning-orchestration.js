/**
 * positioning-orchestration.js
 * --------------------------------------------------------------------------
 * Component Positioning Awareness & Symphonic Lifecycle Orchestration
 *
 * Provides a unified, non-blocking spatial awareness engine that measures,
 * projects, and audits component positioning without layout thrashing:
 *
 * 1. MEASURE pass: Batched read of viewport coordinates, measure bands,
 *    and containment boundaries during requestAnimationFrame.
 * 2. PROJECT pass: Batched write of data-spw-space-variant, data-spw-extent,
 *    data-spw-vertical-gravity, and custom properties in one mutation cycle.
 * 3. AUDIT pass: Evaluates containment health and emits orchestration
 *    events for the symphonic interaction architecture.
 *
 * Lifecycle Hooks & Events:
 *   positioning:mounted  → emitted when a component enters spatial tracking
 *   positioning:shifted  → emitted when geometry changes significantly
 *   positioning:settled  → emitted when all tracked components reach rest
 * --------------------------------------------------------------------------
 */

import { bus } from '/public/js/kernel/bus.js';
import {
  writeDatasetValues,
  writeStyleValue,
} from '/public/js/kernel/dom-contracts.js';
import { guardCall } from '/public/js/kernel/dom-render.js';

const TRACKED_SELECTOR = [
  '[data-spw-gravity]',
  '[data-spw-box-model]',
  '[data-spw-pack-local]',
  '.site-frame',
  '.frame-card',
  '.vibe-widget',
  '.spw-section-handle',
  '[data-spw-feature="cauldron"]',
].join(', ');

const MEASURE_BANDS = Object.freeze({
  compact: 320,
  balanced: 580,
  wide: 880,
});

const trackedElements = new Set();
const visibleElements = new Set();
const elementSnapshots = new Map();

let intersectionObserver = null;
let resizeObserver = null;
let mutationObserver = null;
let rafId = 0;
let isPassPending = false;
let initialized = false;

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

function computeSpatialMetrics(el, viewportWidth, viewportHeight) {
  const rect = el.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  // Measure band (inline axis)
  const measureBand = width < MEASURE_BANDS.compact
    ? 'compact'
    : width < MEASURE_BANDS.balanced
      ? 'balanced'
      : width < MEASURE_BANDS.wide
        ? 'wide'
        : 'maximal';

  // Extent (block axis relative to viewport)
  const heightRatio = viewportHeight > 0 ? height / viewportHeight : 0;
  const extent = heightRatio < 0.22
    ? 'squat'
    : heightRatio < 0.65
      ? 'contained'
      : heightRatio < 0.95
        ? 'tall'
        : 'overtall';

  // Vertical bias (-1 room above -> +1 room below)
  const roomAbove = Math.max(0, rect.top);
  const roomBelow = Math.max(0, viewportHeight - rect.bottom);
  const totalRoom = roomAbove + roomBelow;
  const verticalBias = totalRoom > 0 ? (roomBelow - roomAbove) / totalRoom : 0;
  const verticalGravity = verticalBias > 0.15 ? 'falls' : verticalBias < -0.15 ? 'rises' : 'balanced';

  // Edge proximity (0 = center, 1 = touching edge)
  const distFromEdgeX = Math.min(rect.left, viewportWidth - rect.right);
  const edgeProximityX = viewportWidth > 0 ? clamp(1 - (distFromEdgeX / (viewportWidth * 0.25)), 0, 1) : 0;

  return {
    rect: { top: rect.top, left: rect.left, width, height },
    measureBand,
    extent,
    verticalGravity,
    verticalBias: Number(verticalBias.toFixed(3)),
    edgeProximity: Number(edgeProximityX.toFixed(3)),
    spaceVariant: `${measureBand}-${extent}-${verticalGravity}`,
  };
}

function runPositioningPass() {
  isPassPending = false;
  rafId = 0;

  if (!visibleElements.size && !trackedElements.size) return;

  const vpWidth = window.innerWidth || document.documentElement.clientWidth || 1024;
  const vpHeight = window.innerHeight || document.documentElement.clientHeight || 768;

  const measurements = [];
  const activeTargets = visibleElements.size ? visibleElements : trackedElements;

  // 1. MEASURE PASS (read-only)
  for (const el of activeTargets) {
    if (!el.isConnected) {
      trackedElements.delete(el);
      visibleElements.delete(el);
      elementSnapshots.delete(el);
      continue;
    }

    try {
      const metrics = computeSpatialMetrics(el, vpWidth, vpHeight);
      measurements.push({ el, metrics });
    } catch {
      /* non-blocking spatial metric catch */
    }
  }

  // 2. PROJECT PASS (batched writes)
  let shiftCount = 0;
  for (const { el, metrics } of measurements) {
    const prev = elementSnapshots.get(el);
    const hasShifted = !prev || prev.spaceVariant !== metrics.spaceVariant;

    elementSnapshots.set(el, metrics);

    if (hasShifted) {
      shiftCount += 1;
      writeDatasetValues(el, {
        spwMeasureBand: metrics.measureBand,
        spwExtent: metrics.extent,
        spwVerticalGravity: metrics.verticalGravity,
        spwSpaceVariant: metrics.spaceVariant,
      });

      writeStyleValue(el, '--spw-edge-proximity', String(metrics.edgeProximity));
      writeStyleValue(el, '--spw-vertical-bias', String(metrics.verticalBias));
    }
  }

  // 3. AUDIT & ORCHESTRATION NOTIFICATION
  if (shiftCount > 0) {
    bus.emit('positioning:shifted', {
      count: shiftCount,
      totalTracked: trackedElements.size,
      timestamp: Date.now(),
    });
  }
}

export function requestPositioningPass() {
  if (isPassPending) return;
  isPassPending = true;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(runPositioningPass);
}

export function registerPositionedElement(el) {
  if (!el || !(el instanceof Element) || trackedElements.has(el)) return;
  trackedElements.add(el);
  intersectionObserver?.observe(el);
  resizeObserver?.observe(el);
  requestPositioningPass();
  bus.emit('positioning:mounted', { target: el, totalTracked: trackedElements.size });
}

export function unregisterPositionedElement(el) {
  if (!el || !trackedElements.has(el)) return;
  trackedElements.delete(el);
  visibleElements.delete(el);
  elementSnapshots.delete(el);
  intersectionObserver?.unobserve(el);
  resizeObserver?.unobserve(el);
}

export function initPositioningOrchestration(ctx) {
  if (initialized && typeof window !== 'undefined') {
    requestPositioningPass();
    return () => {};
  }
  initialized = true;

  const root = (ctx && ctx.root) || document;

  // Setup IntersectionObserver for visibility gating
  if (typeof IntersectionObserver !== 'undefined') {
    intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleElements.add(entry.target);
        } else {
          visibleElements.delete(entry.target);
        }
      }
      requestPositioningPass();
    }, { rootMargin: '120px 0px 120px 0px' });
  }

  // Setup ResizeObserver for element container resizing
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      requestPositioningPass();
    });
  }

  // Collect and register initial candidates
  root.querySelectorAll(TRACKED_SELECTOR).forEach((el) => {
    registerPositionedElement(el);
  });

  // Setup MutationObserver for dynamically added elements
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver((mutations) => {
      let needsPass = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            if (node.matches(TRACKED_SELECTOR)) {
              registerPositionedElement(node);
              needsPass = true;
            }
            node.querySelectorAll?.(TRACKED_SELECTOR).forEach((child) => {
              registerPositionedElement(child);
              needsPass = true;
            });
          }
        }
      }
      if (needsPass) requestPositioningPass();
    });

    mutationObserver.observe(root.body || root, {
      childList: true,
      subtree: true,
    });
  }

  // Listen to viewport changes
  const onResize = () => requestPositioningPass();
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  // Initial pass
  requestPositioningPass();

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    trackedElements.clear();
    visibleElements.clear();
    elementSnapshots.clear();
    initialized = false;
  };
}

export const POSITIONING_ORCHESTRATION_CONTRACT = Object.freeze({
  timingArc: 'immediate-orchestration',
  idleChunk: 'idle-lab',
  measureBands: MEASURE_BANDS,
  events: Object.freeze(['positioning:mounted', 'positioning:shifted', 'positioning:settled']),
});
