/**
 * Spw SVG Tunability
 *
 * Declarative tuning and pointer-field behavior for SVG hosts.
 *
 * Hosts opt in with data attributes such as:
 * - data-spw-svg-host="diagram-posture"
 * - data-spw-svg-pointer="field|tilt|trace"
 *
 * Query parameters can tune hosts without page-local scripts:
 * - spw-svg-stroke=1.2
 * - spw-svg-dash=6
 * - spw-svg-gap=10
 * - spw-svg-label=0.05em
 * - spw-svg-fill=14%
 * - spw-svg-palette=brand|signal|soft-blue|warm-offer|monochrome
 * - spw-svg-accent=%23008080
 * - spw-svg-field=%23ffffff
 * - spw-svg-space=0.75rem
 * - spw-svg-motion=slow|quick|paused
 * - spw-svg-pointer=field|tilt|trace|none
 */

import {
  createSpwLogger,
  markInstrumented,
  markReflowReason,
  writeTuningAttributes,
} from '../kernel/spw-instrumentation.js';

const SVG_HOST_SELECTOR = [
  '[data-spw-svg-host]',
  '.spw-svg-figure',
  '.spw-svg-surface[data-spw-svg-host]',
].join(', ');

const POINTER_MODES = new Set(['field', 'tilt', 'trace']);
const MOTION_STATES = new Set(['steady', 'slow', 'quick', 'paused']);
const CONTRAST_STATES = new Set(['soft', 'balanced', 'strong']);
const NUMERIC_TUNINGS = Object.freeze({
  strokeScale: '--spw-svg-stroke-scale',
  flowDash: '--spw-svg-flow-dash',
  flowGap: '--spw-svg-flow-gap',
  motionRate: '--spw-svg-motion-rate',
  pointerLift: '--spw-svg-pointer-lift',
});
const CSS_TUNINGS = Object.freeze({
  accent: '--spw-svg-brand-accent',
  field: '--spw-svg-brand-field',
  space: '--spw-svg-space',
  nodeFill: '--spw-svg-node-fill-mix',
});

export const SPW_SVG_PALETTES = Object.freeze({
  brand: Object.freeze({
    reason: 'Use the current site accent and surface so the SVG belongs to the page brand.',
    accent: 'var(--active-op-color, #008080)',
    field: 'var(--surface, #ffffff)',
    nodeFill: '12%',
  }),
  signal: Object.freeze({
    reason: 'Use stronger contrast when the SVG needs to explain action or status in a screenshot.',
    accent: 'var(--op-action-color, #005959)',
    field: 'color-mix(in srgb, var(--op-action-color, #005959) 4%, var(--surface, #ffffff))',
    nodeFill: '18%',
  }),
  'soft-blue': Object.freeze({
    reason: 'Use a quieter interpretation palette for documentation, comparison, and model review.',
    accent: 'var(--op-ref-color, #1d57a3)',
    field: '#f7faff',
    nodeFill: '10%',
  }),
  'warm-offer': Object.freeze({
    reason: 'Use warmer affordance color when the SVG represents an offer, event, discount, or service.',
    accent: 'var(--op-binding-color, #8f401f)',
    field: '#fff8f2',
    nodeFill: '18%',
  }),
  monochrome: Object.freeze({
    reason: 'Use restrained ink when the SVG needs maximum legibility before brand styling.',
    accent: 'var(--ink, #161c1d)',
    field: 'var(--surface, #ffffff)',
    nodeFill: '6%',
  }),
});

export const SPW_SVG_TUNABILITY_CONTRACT = Object.freeze({
  selector: SVG_HOST_SELECTOR,
  attributes: Object.freeze({
    host: 'data-spw-svg-host',
    pointer: 'data-spw-svg-pointer',
    pointerState: 'data-spw-svg-pointer-state',
    contrast: 'data-spw-svg-tune-contrast',
    motion: 'data-spw-svg-tune-motion',
  }),
  queryParameters: Object.freeze({
    stroke: 'spw-svg-stroke=<number>',
    dash: 'spw-svg-dash=<number>',
    gap: 'spw-svg-gap=<number>',
    label: 'spw-svg-label=<length>',
    fill: 'spw-svg-fill=<percentage>',
    palette: 'spw-svg-palette=<brand|signal|soft-blue|warm-offer|monochrome>',
    accent: 'spw-svg-accent=<color>',
    field: 'spw-svg-field=<color>',
    space: 'spw-svg-space=<length>',
    motion: 'spw-svg-motion=<steady|slow|quick|paused>',
    motionRate: 'spw-svg-motion-rate=<time>',
    contrast: 'spw-svg-contrast=<soft|balanced|strong>',
    pointer: 'spw-svg-pointer=<field|tilt|trace|none>',
  }),
  performanceRule:
    'Pointer mode writes CSS custom properties in requestAnimationFrame; visible response should stay in transform, opacity, color, and shadow rather than layout.',
});

const logger = createSpwLogger('spw-svg-tunability', {
  role: 'svg-controller',
  metaphor: 'pointer-spell',
  owns: SVG_HOST_SELECTOR,
  writes: 'data-spw-svg-pointer-state, SVG tuning custom properties',
});

const HOST_STATE = new WeakMap();
const isElement = (value) => Boolean(value) && value.nodeType === 1;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeToken = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const resolveDocument = (target = globalThis.document) => {
  if (target?.nodeType === 9) return target;
  return target?.ownerDocument || globalThis.document || null;
};

const resolveHost = (target, root = globalThis.document) => {
  if (!target) return null;
  if (typeof target === 'string') return root?.querySelector?.(target) || null;
  if (!isElement(target)) return null;
  if (target.matches?.(SVG_HOST_SELECTOR)) return target;
  return target.closest?.(SVG_HOST_SELECTOR) || null;
};

const getHosts = (root = globalThis.document) => {
  if (!root?.querySelectorAll) return [];
  const hosts = [...root.querySelectorAll(SVG_HOST_SELECTOR)];
  if (isElement(root) && root.matches?.(SVG_HOST_SELECTOR)) hosts.unshift(root);
  return [...new Set(hosts)].filter((host) => !host.closest?.('[data-spw-svg-tunability="off"]'));
};

const readNumber = (value, min, max) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return '';
  return String(clamp(parsed, min, max));
};

const writeStyleIfPresent = (host, property, value) => {
  if (value === undefined || value === null || value === '') return;
  host.style.setProperty(property, String(value));
};

export function applySvgTunability(target, options = {}) {
  const root = options.root || resolveDocument(target);
  const host = resolveHost(target, root);
  if (!host) return null;

  const motion = normalizeToken(options.motion || '');
  const contrast = normalizeToken(options.contrast || '');
  const pointer = normalizeToken(options.pointer || '');
  const paletteName = normalizeToken(options.palette || '');
  const palette = SPW_SVG_PALETTES[paletteName];

  if (palette) {
    writeStyleIfPresent(host, '--spw-svg-brand-accent', palette.accent);
    writeStyleIfPresent(host, '--spw-svg-brand-field', palette.field);
    writeStyleIfPresent(host, '--spw-svg-node-fill-mix', palette.nodeFill);
    host.dataset.spwSvgPalette = paletteName;
    host.dataset.spwSvgPaletteReason = palette.reason;
  }

  Object.entries(NUMERIC_TUNINGS).forEach(([key, property]) => {
    writeStyleIfPresent(host, property, options[key]);
  });
  Object.entries(CSS_TUNINGS).forEach(([key, property]) => {
    writeStyleIfPresent(host, property, options[key]);
  });
  writeStyleIfPresent(host, '--spw-svg-label-spacing', options.labelSpacing);

  if (MOTION_STATES.has(motion)) host.dataset.spwSvgTuneMotion = motion;
  if (CONTRAST_STATES.has(contrast)) host.dataset.spwSvgTuneContrast = contrast;
  if (pointer === 'none') delete host.dataset.spwSvgPointer;
  else if (POINTER_MODES.has(pointer)) host.dataset.spwSvgPointer = pointer;

  writeTuningAttributes(host, {
    svgStroke: options.strokeScale,
    svgDash: options.flowDash,
    svgGap: options.flowGap,
    svgLabel: options.labelSpacing,
    svgFill: options.nodeFill,
    svgPalette: paletteName,
    svgPaletteReason: palette?.reason,
    svgAccent: options.accent,
    svgField: options.field,
    svgSpace: options.space,
    svgMotion: motion,
    svgPointer: pointer,
  }, { source: 'spw-svg-tunability' });

  const reflowReason = normalizeToken(options.reflowReason || '');
  const fallbackReason = palette || options.accent || options.field
    ? 'theme'
    : 'interaction';

  markReflowReason(host, reflowReason || fallbackReason, {
    source: 'spw-svg-tunability',
    scope: 'svg',
    cost: 'paint-transform',
  });

  logger.trace('applied svg tunability', host, {
    tokens: [
      '--spw-svg-stroke-scale',
      '--spw-svg-flow-dash',
      '--spw-svg-flow-gap',
      '--spw-svg-label-spacing',
    ],
  });

  return host;
}

export function parseSvgTunabilitySearch(search = globalThis.location?.search || '') {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const tuning = {};

  const strokeScale = readNumber(params.get('spw-svg-stroke'), 0.45, 2.25);
  const flowDash = readNumber(params.get('spw-svg-dash'), 1, 18);
  const flowGap = readNumber(params.get('spw-svg-gap'), 1, 24);
  const pointerLift = readNumber(params.get('spw-svg-pointer-lift'), 0, 1);

  if (strokeScale) tuning.strokeScale = strokeScale;
  if (flowDash) tuning.flowDash = flowDash;
  if (flowGap) tuning.flowGap = flowGap;
  if (pointerLift) tuning.pointerLift = pointerLift;

  const labelSpacing = params.get('spw-svg-label');
  if (labelSpacing) tuning.labelSpacing = labelSpacing;

  const nodeFill = params.get('spw-svg-fill');
  if (nodeFill) tuning.nodeFill = nodeFill;

  const palette = normalizeToken(params.get('spw-svg-palette') || '');
  if (SPW_SVG_PALETTES[palette]) tuning.palette = palette;

  const accent = params.get('spw-svg-accent');
  if (accent) tuning.accent = accent;

  const field = params.get('spw-svg-field');
  if (field) tuning.field = field;

  const space = params.get('spw-svg-space');
  if (space) tuning.space = space;

  const motionRate = params.get('spw-svg-motion-rate');
  if (motionRate) tuning.motionRate = motionRate;

  const motion = normalizeToken(params.get('spw-svg-motion') || '');
  if (MOTION_STATES.has(motion)) tuning.motion = motion;

  const contrast = normalizeToken(params.get('spw-svg-contrast') || '');
  if (CONTRAST_STATES.has(contrast)) tuning.contrast = contrast;

  const pointer = normalizeToken(params.get('spw-svg-pointer') || '');
  if (pointer === 'none' || POINTER_MODES.has(pointer)) tuning.pointer = pointer;

  const reflowReason = normalizeToken(params.get('spw-reflow') || '');
  if (reflowReason) tuning.reflowReason = reflowReason;

  return tuning;
}

export function applySvgQueryTunability(root = globalThis.document, options = {}) {
  const tuning = parseSvgTunabilitySearch(options.search);
  if (!Object.keys(tuning).length) return [];

  const hosts = getHosts(root);
  hosts.forEach((host) => applySvgTunability(host, { ...tuning, root }));
  logger.info('applied query svg tunability', { count: hosts.length, tuning });
  return hosts;
}

const getHostState = (host) => {
  let state = HOST_STATE.get(host);
  if (state) return state;

  state = {
    frame: 0,
    rect: null,
    queuedEvent: null,
  };
  HOST_STATE.set(host, state);
  return state;
};

const measureHost = (host) => {
  const state = getHostState(host);
  state.rect = host.getBoundingClientRect?.() || null;
  return state.rect;
};

const writePointerVars = (host, event) => {
  const state = getHostState(host);
  const rect = state.rect || measureHost(host);
  if (!rect?.width || !rect?.height) return;

  const xRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const yRatio = clamp((event.clientY - rect.top) / rect.height, 0, 1);

  host.style.setProperty('--spw-svg-pointer-x', `${(xRatio * 100).toFixed(2)}%`);
  host.style.setProperty('--spw-svg-pointer-y', `${(yRatio * 100).toFixed(2)}%`);
  host.style.setProperty('--spw-svg-pointer-x-ratio', xRatio.toFixed(4));
  host.style.setProperty('--spw-svg-pointer-y-ratio', yRatio.toFixed(4));
  host.style.setProperty('--spw-svg-pointer-intensity', '1');
  host.dataset.spwSvgPointerState = 'active';
};

const queuePointerWrite = (host, event) => {
  const state = getHostState(host);
  state.queuedEvent = event;
  if (state.frame) return;

  state.frame = globalThis.requestAnimationFrame?.(() => {
    state.frame = 0;
    if (state.queuedEvent) writePointerVars(host, state.queuedEvent);
    state.queuedEvent = null;
  }) || 0;
};

const clearPointerHost = (host) => {
  const state = getHostState(host);
  state.queuedEvent = null;
  if (state.frame && globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame(state.frame);
  }
  state.frame = 0;
  host.style.setProperty('--spw-svg-pointer-intensity', '0');
  host.dataset.spwSvgPointerState = 'rest';
};

function initPointerHost(host) {
  const pointerMode = normalizeToken(host.dataset.spwSvgPointer || '');
  if (!POINTER_MODES.has(pointerMode) || host.dataset.spwSvgPointerManaged === 'true') return;

  host.dataset.spwSvgPointerManaged = 'true';
  host.dataset.spwSvgPointerState ||= 'rest';
  markInstrumented(host, 'spw-svg-tunability', { tags: ['svg-pointer', pointerMode] });

  host.addEventListener('pointerenter', (event) => {
    measureHost(host);
    queuePointerWrite(host, event);
  }, { passive: true });

  host.addEventListener('pointermove', (event) => {
    queuePointerWrite(host, event);
  }, { passive: true });

  host.addEventListener('pointerleave', () => {
    clearPointerHost(host);
  }, { passive: true });

  host.addEventListener('focusin', () => {
    host.dataset.spwSvgPointerState = 'active';
    host.style.setProperty('--spw-svg-pointer-intensity', '0.66');
  });

  host.addEventListener('focusout', () => {
    clearPointerHost(host);
  });
}

export function initSpwSvgTunability(root = globalThis.document, options = {}) {
  const hosts = getHosts(root);
  applySvgQueryTunability(root, options);
  hosts.forEach(initPointerHost);

  if (hosts.length) {
    logger.debug('initialized svg tunability hosts', { count: hosts.length });
  }

  return hosts;
}
