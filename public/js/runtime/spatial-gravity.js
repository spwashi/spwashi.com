/**
 * Spatial Gravity
 *
 * Measurable edge + vertical gravity for opt-in components. This grounds the
 * conceptual #cognitive_gravity_planes (site-semantics.spw) in real viewport
 * geometry: a component can read where it sits, how much room it has in each
 * direction, and how tall it is against the frame — then select a variant
 * opportunistically instead of hard-coding a breakpoint.
 *
 * Width/height philosophy: measure (inline band) and extent (block band vs
 * viewport) are two independent axes. A component can be wide but squat, or
 * narrow but overtall; the pair, not either alone, tells it how to pack.
 *
 * Opt in on any element:
 *   <div data-spw-gravity>            track edge + vertical gravity
 *   <div data-spw-gravity="open">     also expose an opening direction
 *
 * Writes (data attributes, for variant selection + inspection):
 *   data-spw-edge-gravity   = top | bottom | left | right | none
 *   data-spw-vertical-gravity = rises | balanced | falls  (where content should grow)
 *   data-spw-extent         = squat | contained | tall | overtall
 *   data-spw-measure-band   = narrow | comfortable | wide
 *   data-spw-space-variant  = <measure>-<extent>-<vertical>  (composite handle)
 *   data-spw-open-direction = up | down  (only when data-spw-gravity="open")
 *
 * Writes (custom properties, for smooth responsiveness):
 *   --spw-edge-proximity     0..1  (1 = touching the nearest edge)
 *   --spw-vertical-bias    -1..1  (<0 room above, >0 room below)
 *
 * Performance: one shared scroll/resize listener, rAF-throttled, and an
 * IntersectionObserver gate so only on-screen tracked elements are measured.
 */

import { writeDatasetValues, writeStyleValue } from '../kernel/dom-contracts.js';
import { createSpwLogger, markInstrumented } from '../kernel/instrumentation.js';

const GRAVITY_SELECTOR = '[data-spw-gravity]';

const MEASURE_BANDS = Object.freeze({ narrow: 340, comfortable: 680 });
const EDGE_THRESHOLD_RATIO = 0.12;
const VERTICAL_DEADZONE = 0.15;

const logger = createSpwLogger('spw-spatial-gravity', {
  role: 'spatial-controller',
  metaphor: 'gravity-field',
  owns: GRAVITY_SELECTOR,
  writes: 'data-spw-edge-gravity, data-spw-vertical-gravity, data-spw-extent, data-spw-space-variant',
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isElement = (value) => Boolean(value) && value.nodeType === 1;

const tracked = new Set();
const onScreen = new Set();
let intersectionObserver = null;
let rafId = 0;
let listenersBound = false;

const resolveMeasureBand = (inlineSize) => {
  if (inlineSize < MEASURE_BANDS.narrow) return 'narrow';
  if (inlineSize < MEASURE_BANDS.comfortable) return 'comfortable';
  return 'wide';
};

const resolveExtent = (blockSize, viewportHeight) => {
  const ratio = blockSize / Math.max(1, viewportHeight);
  if (ratio < 0.25) return 'squat';
  if (ratio <= 1) return 'contained';
  if (ratio <= 1.8) return 'tall';
  return 'overtall';
};

const resolveVerticalGravity = (rect, viewportHeight) => {
  const center = rect.top + rect.height / 2;
  const roomAbove = center;
  const roomBelow = viewportHeight - center;
  const bias = (roomBelow - roomAbove) / Math.max(1, viewportHeight);
  // More room below → content "falls" (opens down). More room above → "rises".
  if (bias > VERTICAL_DEADZONE) return { gravity: 'falls', bias };
  if (bias < -VERTICAL_DEADZONE) return { gravity: 'rises', bias };
  return { gravity: 'balanced', bias };
};

const resolveEdgeGravity = (rect, viewportWidth, viewportHeight) => {
  const distances = {
    top: rect.top,
    bottom: viewportHeight - rect.bottom,
    left: rect.left,
    right: viewportWidth - rect.right,
  };
  const nearest = Object.entries(distances).reduce(
    (best, entry) => (entry[1] < best[1] ? entry : best),
    ['none', Infinity],
  );
  const threshold = Math.min(viewportWidth, viewportHeight) * EDGE_THRESHOLD_RATIO;
  const proximity = clamp(1 - nearest[1] / Math.max(1, threshold), 0, 1);
  return {
    edge: nearest[1] > threshold ? 'none' : nearest[0],
    proximity,
  };
};

const measureElement = (el) => {
  if (!isElement(el) || !el.isConnected) return;

  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

  const measureBand = resolveMeasureBand(rect.width);
  const extent = resolveExtent(rect.height, viewportHeight);
  const vertical = resolveVerticalGravity(rect, viewportHeight);
  const edge = resolveEdgeGravity(rect, viewportWidth, viewportHeight);

  writeDatasetValues(el, {
    spwMeasureBand: measureBand,
    spwExtent: extent,
    spwVerticalGravity: vertical.gravity,
    spwEdgeGravity: edge.edge,
    spwSpaceVariant: `${measureBand}-${extent}-${vertical.gravity}`,
  });

  if (el.dataset.spwGravity === 'open') {
    // Expandable content grows toward the roomier side so it stays on-screen.
    writeDatasetValues(el, { spwOpenDirection: vertical.gravity === 'rises' ? 'up' : 'down' });
  }

  writeStyleValue(el, '--spw-edge-proximity', edge.proximity.toFixed(3));
  writeStyleValue(el, '--spw-vertical-bias', clamp(vertical.bias, -1, 1).toFixed(3));

  // Optional legibility surface: if the specimen carries a readout child, let
  // it narrate its own gravity as you scroll — interaction clarifies concept.
  const readout = el.querySelector?.('[data-spw-gravity-readout]');
  if (readout) {
    readout.innerHTML =
      `<span>edge <b>${edge.edge}</b></span>`
      + `<span>vertical <b>${vertical.gravity}</b></span>`
      + `<span>extent <b>${extent}</b></span>`
      + `<span>measure <b>${measureBand}</b></span>`;
  }
};

const measureOnScreen = () => {
  rafId = 0;
  onScreen.forEach(measureElement);
};

const scheduleMeasure = () => {
  if (rafId) return;
  rafId = window.requestAnimationFrame?.(measureOnScreen) || 0;
  if (!rafId) measureOnScreen();
};

const ensureIntersectionObserver = () => {
  if (intersectionObserver || typeof IntersectionObserver !== 'function') return intersectionObserver;
  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        onScreen.add(entry.target);
        measureElement(entry.target);
      } else {
        onScreen.delete(entry.target);
      }
    });
  }, { rootMargin: '20% 0px' });
  return intersectionObserver;
};

const bindListeners = () => {
  if (listenersBound || typeof window === 'undefined') return;
  listenersBound = true;
  // Capture phase catches scroll from ANY container, not just the window —
  // scroll does not bubble, so a bubble-phase window listener misses pages
  // whose scroll lives on an inner element. Measurement is viewport-relative
  // (getBoundingClientRect) so it stays correct regardless of the scroller.
  document.addEventListener('scroll', scheduleMeasure, { passive: true, capture: true });
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  window.visualViewport?.addEventListener?.('resize', scheduleMeasure, { passive: true });
};

const trackElement = (el) => {
  if (!isElement(el) || tracked.has(el)) return;
  tracked.add(el);
  markInstrumented(el, 'spw-spatial-gravity', { tags: ['gravity', el.dataset.spwGravity || 'track'] });

  // Measure once at track time so the component reports a state immediately
  // (no empty-readout window before the first scroll). The IntersectionObserver
  // then keeps it fresh and gates ongoing measurement to on-screen elements.
  measureElement(el);

  const observer = ensureIntersectionObserver();
  if (observer) {
    observer.observe(el);
  } else {
    onScreen.add(el);
  }
};

export function initSpwSpatialGravity(root = document, options = {}) {
  const scope = options.root || root;
  const elements = [...(scope?.querySelectorAll?.(GRAVITY_SELECTOR) || [])];
  if (isElement(scope) && scope.matches?.(GRAVITY_SELECTOR)) elements.unshift(scope);
  if (!elements.length) return [];

  bindListeners();
  elements.forEach(trackElement);
  scheduleMeasure();

  logger.debug('tracking spatial gravity', { count: elements.length });
  return elements;
}

export function measureSpatialGravity(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (isElement(el)) measureElement(el);
  return el || null;
}

export const SPW_SPATIAL_GRAVITY_CONTRACT = Object.freeze({
  selector: GRAVITY_SELECTOR,
  attributes: Object.freeze([
    'data-spw-edge-gravity',
    'data-spw-vertical-gravity',
    'data-spw-extent',
    'data-spw-measure-band',
    'data-spw-space-variant',
    'data-spw-open-direction',
  ]),
  customProperties: Object.freeze(['--spw-edge-proximity', '--spw-vertical-bias']),
  performanceRule:
    'One shared rAF-throttled scroll/resize listener; IntersectionObserver gates measurement to on-screen tracked elements. Visible response should stay in transform, opacity, and color.',
});
