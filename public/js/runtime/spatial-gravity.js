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
 * Performance: one shared scroll/resize listener, rAF-throttled, with an
 * IntersectionObserver gate so only on-screen tracked elements are measured, a
 * ResizeObserver so an element that grows re-derives its room, and a
 * MutationObserver so opt-in chrome added after mount is picked up. All churn
 * funnels through the same rAF measure pass.
 */

import { writeDatasetValues, removeDatasetValues, writeStyleValue } from '../kernel/dom-contracts.js';
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
const elementState = new Map();
let intersectionObserver = null;
let resizeObserver = null;
let mutationObserver = null;
let rafId = 0;
let listenersBound = false;

/* Salience is the attention axis (orthogonal to density). When two tracked
   elements contend for the same pixels, the higher-salience one holds and the
   lower-salience one yields visibly — boundary contests resolve by declared
   priority, not z-index luck. */
const SALIENCE_RANK = Object.freeze({ background: 0, ambient: 1, primary: 2, focal: 3 });

const normalizeToken = (value = '') => String(value).trim().toLowerCase();

const resolveSalience = (el) => {
  const declared = normalizeToken(el.dataset.spwSalience || '');
  return declared in SALIENCE_RANK ? declared : 'primary';
};

const rectsIntersect = (a, b) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

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

/* The raw primitive: room on each side of the element, in px (clamped >= 0).
   Everything else — gravity, edges, fit — derives from these four numbers, so
   consumers can either read a derived convenience (data-spw-vertical-gravity)
   or compute their own from room (e.g. a popover capping its height to the
   room below: max-block-size: var(--spw-room-below)). */
const axisGravity = (roomStart, roomEnd, span, startName, endName) => {
  const bias = (roomEnd - roomStart) / Math.max(1, span);
  if (bias > VERTICAL_DEADZONE) return { gravity: endName, bias };
  if (bias < -VERTICAL_DEADZONE) return { gravity: startName, bias };
  return { gravity: 'balanced', bias };
};

const resolveSpatial = (rect, vw, vh) => {
  const room = {
    above: Math.max(0, rect.top),
    below: Math.max(0, vh - rect.bottom),
    left: Math.max(0, rect.left),
    right: Math.max(0, vw - rect.right),
  };
  const threshold = Math.min(vw, vh) * EDGE_THRESHOLD_RATIO;
  const near = (dist) => clamp(1 - dist / Math.max(1, threshold), 0, 1);
  const prox = {
    top: near(room.above),
    bottom: near(room.below),
    left: near(room.left),
    right: near(room.right),
  };

  // Which way expandable content should grow to stay on-screen.
  const vertical = axisGravity(room.above, room.below, vh, 'rises', 'falls');
  const horizontal = axisGravity(room.left, room.right, vw, 'trails', 'leads');

  // Two-axis edge classification (corner-aware).
  const edgeY = prox.top === 0 && prox.bottom === 0 ? 'middle' : (prox.top >= prox.bottom ? 'top' : 'bottom');
  const edgeX = prox.left === 0 && prox.right === 0 ? 'center' : (prox.left >= prox.right ? 'left' : 'right');
  const edge = [edgeY === 'middle' ? '' : edgeY, edgeX === 'center' ? '' : edgeX].filter(Boolean).join('-') || 'none';

  // 2D opening anchor for popovers/overlays: <up|down>-<start|end|center>.
  const openVertical = vertical.gravity === 'rises' ? 'up' : 'down';
  const openHorizontal = horizontal.gravity === 'trails' ? 'start' : horizontal.gravity === 'leads' ? 'end' : 'center';

  return {
    room,
    prox,
    edgeProximity: Math.max(prox.top, prox.bottom, prox.left, prox.right),
    vertical,
    horizontal,
    edgeY,
    edgeX,
    edge,
    openVertical,
    openAnchor: `${openVertical}-${openHorizontal}`,
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
  const s = resolveSpatial(rect, viewportWidth, viewportHeight);

  writeDatasetValues(el, {
    spwMeasureBand: measureBand,
    spwExtent: extent,
    spwVerticalGravity: s.vertical.gravity,
    spwHorizontalGravity: s.horizontal.gravity,
    spwEdgeGravity: s.edge,
    spwEdgeX: s.edgeX,
    spwEdgeY: s.edgeY,
    spwSpaceVariant: `${measureBand}-${extent}-${s.vertical.gravity}`,
  });

  if (el.dataset.spwGravity === 'open') {
    // Expandable content grows toward the roomier side so it stays on-screen.
    writeDatasetValues(el, { spwOpenDirection: s.openVertical, spwOpenAnchor: s.openAnchor });
  }

  // Room in px is the composable primitive: CSS can cap a popover to it
  // (max-block-size: var(--spw-room-below)) without any JS fit math.
  writeStyleValue(el, '--spw-room-above', `${Math.round(s.room.above)}px`);
  writeStyleValue(el, '--spw-room-below', `${Math.round(s.room.below)}px`);
  writeStyleValue(el, '--spw-room-left', `${Math.round(s.room.left)}px`);
  writeStyleValue(el, '--spw-room-right', `${Math.round(s.room.right)}px`);
  writeStyleValue(el, '--spw-proximity-top', s.prox.top.toFixed(3));
  writeStyleValue(el, '--spw-proximity-bottom', s.prox.bottom.toFixed(3));
  writeStyleValue(el, '--spw-proximity-left', s.prox.left.toFixed(3));
  writeStyleValue(el, '--spw-proximity-right', s.prox.right.toFixed(3));
  writeStyleValue(el, '--spw-edge-proximity', s.edgeProximity.toFixed(3));
  writeStyleValue(el, '--spw-vertical-bias', clamp(s.vertical.bias, -1, 1).toFixed(3));
  writeStyleValue(el, '--spw-horizontal-bias', clamp(s.horizontal.bias, -1, 1).toFixed(3));

  // Record rect + salience for the overlap-resolution pass.
  const salience = resolveSalience(el);
  elementState.set(el, { el, rect, salience });
  if (el.dataset.spwSalience) writeDatasetValues(el, { spwSalienceRank: String(SALIENCE_RANK[salience]) });

  // Optional legibility surface: if the specimen carries a readout child, let
  // it narrate its own gravity as you scroll — interaction clarifies concept.
  const readout = el.querySelector?.('[data-spw-gravity-readout]');
  if (readout) {
    readout.innerHTML =
      `<span>edge <b>${s.edge}</b></span>`
      + `<span>vertical <b>${s.vertical.gravity}</b></span>`
      + `<span>horizontal <b>${s.horizontal.gravity}</b></span>`
      + `<span>extent <b>${extent}</b></span>`
      + `<span>measure <b>${measureBand}</b></span>`;
  }
};

/* Boundary overlap: when two on-screen tracked elements share pixels, the
   lower-salience one yields (data-spw-yielded) with a reason, so the contest is
   visible and inspectable rather than a silent clip. N is small — only opted-in
   [data-spw-gravity] elements currently on screen — so pairwise is fine. */
const resolveOverlaps = () => {
  const items = [...elementState.values()].filter((s) => s?.rect && s.el.isConnected);
  items.forEach(({ el }) => {
    if (el.dataset.spwYielded) removeDatasetValues(el, ['spwYielded', 'spwYieldReason']);
  });

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      if (!rectsIntersect(a.rect, b.rect)) continue;
      const rankA = SALIENCE_RANK[a.salience];
      const rankB = SALIENCE_RANK[b.salience];
      if (rankA === rankB) continue; // equal salience: neither is forced to yield
      const loser = rankA < rankB ? a : b;
      const winner = rankA < rankB ? b : a;
      writeDatasetValues(loser.el, {
        spwYielded: 'true',
        spwYieldReason: `held-by-${winner.salience}`,
      });
    }
  }
};

const measureOnScreen = () => {
  rafId = 0;
  onScreen.forEach(measureElement);
  resolveOverlaps();
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
        elementState.delete(entry.target);
        if (entry.target.dataset.spwYielded) {
          removeDatasetValues(entry.target, ['spwYielded', 'spwYieldReason']);
        }
      }
    });
  }, { rootMargin: '20% 0px' });
  return intersectionObserver;
};

/* A tracked element that changes size (a panel expanding, a card reflowing)
   has new room around it, so its gravity must be re-derived — otherwise an
   opening panel keeps the open-direction it had while collapsed. Scoped to
   tracked elements only, and folded into the shared rAF measure so a burst of
   resizes costs one measurement. */
const ensureResizeObserver = () => {
  if (resizeObserver || typeof ResizeObserver !== 'function') return resizeObserver;
  resizeObserver = new ResizeObserver(() => scheduleMeasure());
  return resizeObserver;
};

/* Adoption gate: the module mounts once, before most floating chrome exists.
   Watch for opt-in elements added later (docks, popovers, disclosure panels
   built at runtime) so [data-spw-gravity] works on dynamic surfaces, not only
   nodes present at first paint. */
const ensureMutationObserver = () => {
  if (mutationObserver || typeof MutationObserver !== 'function') return mutationObserver;
  mutationObserver = new MutationObserver((records) => {
    let found = false;
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (!isElement(node)) return;
        if (node.matches?.(GRAVITY_SELECTOR)) { trackElement(node); found = true; }
        node.querySelectorAll?.(GRAVITY_SELECTOR).forEach((el) => { trackElement(el); found = true; });
      });
    }
    if (found) scheduleMeasure();
  });
  const host = document.body || document.documentElement;
  if (host) mutationObserver.observe(host, { childList: true, subtree: true });
  return mutationObserver;
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
  ensureResizeObserver()?.observe(el);
};

export function initSpwSpatialGravity(root = document, options = {}) {
  const scope = options.root || root;
  const elements = [...(scope?.querySelectorAll?.(GRAVITY_SELECTOR) || [])];
  if (isElement(scope) && scope.matches?.(GRAVITY_SELECTOR)) elements.unshift(scope);
  if (!elements.length) return [];

  bindListeners();
  ensureMutationObserver();
  elements.forEach(trackElement);
  scheduleMeasure();

  logger.debug('tracking spatial gravity', { count: elements.length });
  return elements;
}

export function measureSpatialGravity(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (isElement(el)) {
    measureElement(el);
    resolveOverlaps();
  }
  return el || null;
}

export const SPW_SPATIAL_GRAVITY_CONTRACT = Object.freeze({
  selector: GRAVITY_SELECTOR,
  attributes: Object.freeze([
    'data-spw-edge-gravity',
    'data-spw-edge-x',
    'data-spw-edge-y',
    'data-spw-vertical-gravity',
    'data-spw-horizontal-gravity',
    'data-spw-extent',
    'data-spw-measure-band',
    'data-spw-space-variant',
    'data-spw-open-direction',
    'data-spw-open-anchor',
    'data-spw-salience-rank',
    'data-spw-yielded',
    'data-spw-yield-reason',
  ]),
  customProperties: Object.freeze([
    '--spw-room-above',
    '--spw-room-below',
    '--spw-room-left',
    '--spw-room-right',
    '--spw-proximity-top',
    '--spw-proximity-bottom',
    '--spw-proximity-left',
    '--spw-proximity-right',
    '--spw-edge-proximity',
    '--spw-vertical-bias',
    '--spw-horizontal-bias',
  ]),
  performanceRule:
    'One shared rAF-throttled scroll/resize listener; IntersectionObserver gates measurement to on-screen tracked elements. Visible response should stay in transform, opacity, and color.',
});
