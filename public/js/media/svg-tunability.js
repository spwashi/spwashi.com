/**
 * Spw SVG Tunability
 *
 * Declarative tuning and pointer-field behavior for SVG hosts.
 *
 * Hosts opt in with data attributes such as:
 * - data-spw-svg-host="diagram-posture"
 * - data-spw-svg-pointer="field|tilt|trace"
 * - data-spw-svg-persona="designer builder reviewer rendering-model"
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
 * - spw-svg-env=studio|proof|poster|model
 * - spw-svg-persona=<audience-token>
 *
 * Hosts with a .spw-svg-rail companion get addressable-node behavior: rail
 * chips that anchor to a named <g id> inside the SVG preview that node on
 * hover/focus (data-spw-svg-node-state on groups, data-spw-svg-focus-node on
 * the host). Chips with data-spw-svg-action="copy-url|copy-source" serialize
 * the host's current tuning into a shareable URL or copy the SVG source for
 * handoff, with a visible copied/failed settle state.
 */

import { bus } from '../kernel/bus.js';
import {
  createSpwLogger,
  markInstrumented,
  markReflowReason,
  writeTuningAttributes,
} from '../kernel/instrumentation.js';
import {
  removeDatasetValues,
  writeDatasetValues,
  writeStyleValue,
} from '../kernel/dom-contracts.js';

const SVG_HOST_SELECTOR = [
  '[data-spw-svg-host]',
  '.spw-svg-figure',
  '.spw-svg-surface[data-spw-svg-host]',
].join(', ');

/* SVG attribute development + trope integration (enhancement)
   - New supported attrs for richer system participation:
     data-spw-trope, data-spw-memory, data-spw-alignment-hint, data-spw-content-density
   - These allow SVGs to participate in trope wiring, image/prompt memory, and
     content-based layout/alignment variants.
   - Performance: declarative, read once on mount + on explicit tune events. */

/* Project development + notes + screenshot + interactivity extensions
   - data-spw-svg-semantic: "diagram|icon|illustration|map|project-motif" for layer clarity and screenshot value.
   - data-spw-svg-responsive: "fluid|fixed|contain|project" to refine layout personality and responsiveness.
   - data-spw-svg-interactive: "hover|tap|prime|note" for better interactivity; tap/prime can offer to cauldron/notes.
   - Enables unique local/regional screenshot value (e.g. project-specific motifs with clean capture states).
   - Ties to theme depth via palettes and notes opportunities in design labs. */

const POINTER_MODES = new Set(['field', 'tilt', 'trace']);
const MOTION_STATES = new Set(['steady', 'slow', 'quick', 'paused']);
const CONTRAST_STATES = new Set(['soft', 'balanced', 'strong']);
const SEMANTIC_MODES = new Set(['diagram', 'icon', 'illustration', 'map', 'project-motif']);
const RESPONSIVE_MODES = new Set(['fluid', 'fixed', 'contain', 'project']);
const INTERACTIVE_MODES = new Set(['hover', 'tap', 'prime', 'note']);
const DEVICE_MODES = new Set(['fine', 'coarse', 'hoverless']);
const ENVIRONMENT_STATES = new Set(['studio', 'proof', 'poster', 'model']);
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
const SVG_STYLE_PROPERTIES = Object.freeze([
  '--spw-svg-brand-accent',
  '--spw-svg-brand-field',
  '--spw-svg-pointer-x',
  '--spw-svg-pointer-y',
  '--spw-svg-pointer-x-ratio',
  '--spw-svg-pointer-y-ratio',
  '--spw-svg-pointer-intensity',
  '--spw-svg-pointer-lift',
  '--spw-svg-motion-rate',
  '--spw-svg-node-fill-mix',
  '--spw-svg-space',
  '--spw-svg-device-pointer-lift',
  '--spw-svg-stroke-scale',
  '--spw-svg-flow-dash',
  '--spw-svg-flow-gap',
  '--spw-svg-label-spacing',
]);
const SVG_DATASET_KEYS = Object.freeze([
  'spwSvgPalette',
  'spwSvgPaletteReason',
  'spwSvgTuneMotion',
  'spwSvgTuneContrast',
  'spwSvgPointer',
  'spwSvgPointerState',
  'spwSvgPointerX',
  'spwSvgPointerY',
  'spwSvgDevice',
  'spwSvgEnvironment',
  'spwSvgEnvironmentReason',
  'spwSvgPersonaMatch',
]);

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

export const SPW_SVG_ENVIRONMENTS = Object.freeze({
  studio: Object.freeze({
    reason: 'Use the calm authored surface for in-page reading and iterative design review.',
  }),
  proof: Object.freeze({
    reason: 'Use a high-legibility settled state for QA, comparison, and print-like checking.',
  }),
  poster: Object.freeze({
    reason: 'Use a richer capture state when the SVG needs to carry as a featured visual piece.',
  }),
  model: Object.freeze({
    reason: 'Use a settled labeled state for screenshot interpretation by Midjourney or another rendering model.',
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
    semantic: 'data-spw-svg-semantic',
    responsive: 'data-spw-svg-responsive',
    interactive: 'data-spw-svg-interactive',
    persona: 'data-spw-svg-persona',
    environment: 'data-spw-svg-environment',
    device: 'data-spw-svg-device',
    scale: 'data-spw-svg-scale',
    focusNode: 'data-spw-svg-focus-node',
    nodeState: 'data-spw-svg-node-state',
    action: 'data-spw-svg-action',
    actionState: 'data-spw-svg-action-state',
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
    semantic: 'spw-svg-semantic=<diagram|icon|illustration|map|project-motif>',
    responsive: 'spw-svg-responsive=<fluid|fixed|contain|project>',
    interactive: 'spw-svg-interactive=<hover|tap|prime|note>',
    environment: 'spw-svg-env=<studio|proof|poster|model>',
    persona: 'spw-svg-persona=<audience-token>',
  }),
  performanceRule:
    'Pointer mode writes CSS custom properties in requestAnimationFrame; visible response should stay in transform, opacity, color, and shadow rather than layout.',
});

const logger = createSpwLogger('spw-svg-tunability', {
  role: 'svg-controller',
  metaphor: 'pointer-spell',
  owns: SVG_HOST_SELECTOR,
  writes: 'data-spw-svg-pointer-state, data-spw-svg-environment, data-spw-svg-persona-active, data-spw-svg-persona-match, data-spw-svg-focus-node, data-spw-svg-node-state, data-spw-svg-action-state, SVG tuning custom properties',
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

const resetSvgTunability = (host) => {
  SVG_STYLE_PROPERTIES.forEach((property) => {
    writeStyleValue(host, property, '');
  });
  removeDatasetValues(host, SVG_DATASET_KEYS);
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
  const semantic = normalizeToken(options.semantic || '');
  const responsive = normalizeToken(options.responsive || '');
  const interactive = normalizeToken(options.interactive || '');
  const device = normalizeToken(options.device || '');
  const environment = normalizeToken(options.environment || '');
  const environmentSpec = SPW_SVG_ENVIRONMENTS[environment];

  resetSvgTunability(host);

  if (palette) {
    writeStyleValue(host, '--spw-svg-brand-accent', palette.accent);
    writeStyleValue(host, '--spw-svg-brand-field', palette.field);
    writeStyleValue(host, '--spw-svg-node-fill-mix', palette.nodeFill);
    writeDatasetValues(host, {
      spwSvgPalette: paletteName,
      spwSvgPaletteReason: palette.reason,
    });
  }

  Object.entries(NUMERIC_TUNINGS).forEach(([key, property]) => {
    writeStyleValue(host, property, options[key]);
  });
  Object.entries(CSS_TUNINGS).forEach(([key, property]) => {
    writeStyleValue(host, property, options[key]);
  });
  writeStyleValue(host, '--spw-svg-label-spacing', options.labelSpacing);

  writeDatasetValues(host, {
    spwSvgTuneMotion: MOTION_STATES.has(motion) ? motion : '',
    spwSvgTuneContrast: CONTRAST_STATES.has(contrast) ? contrast : '',
    spwSvgPointer: POINTER_MODES.has(pointer) ? pointer : '',
    spwSvgSemantic: SEMANTIC_MODES.has(semantic) ? semantic : '',
    spwSvgResponsive: RESPONSIVE_MODES.has(responsive) ? responsive : '',
    spwSvgInteractive: INTERACTIVE_MODES.has(interactive) ? interactive : '',
    spwSvgEnvironment: environmentSpec ? environment : '',
    spwSvgEnvironmentReason: environmentSpec?.reason || '',
    spwSvgDevice: DEVICE_MODES.has(device) ? device : '',
  });

  if (pointer === 'none') {
    removeDatasetValues(host, ['spwSvgPointer']);
  }

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
    svgSemantic: semantic,
    svgResponsive: responsive,
    svgInteractive: interactive,
    svgEnvironment: environment,
    svgEnvironmentReason: environmentSpec?.reason,
    svgDevice: device,
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

  const semantic = normalizeToken(params.get('spw-svg-semantic') || '');
  if (SEMANTIC_MODES.has(semantic)) tuning.semantic = semantic;

  const responsive = normalizeToken(params.get('spw-svg-responsive') || '');
  if (RESPONSIVE_MODES.has(responsive)) tuning.responsive = responsive;

  const interactive = normalizeToken(params.get('spw-svg-interactive') || '');
  if (INTERACTIVE_MODES.has(interactive)) tuning.interactive = interactive;

  const environment = normalizeToken(params.get('spw-svg-env') || params.get('spw-svg-environment') || '');
  if (ENVIRONMENT_STATES.has(environment)) tuning.environment = environment;

  const persona = normalizeToken(params.get('spw-svg-persona') || '');
  if (persona) tuning.persona = persona;

  const device = normalizeToken(params.get('spw-svg-device') || '');
  if (DEVICE_MODES.has(device)) tuning.device = device;

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

export function serializeSvgTunability(host) {
  const params = new URLSearchParams();
  if (!isElement(host)) return params.toString();

  const dataset = host.dataset || {};
  const read = (property) => host.style?.getPropertyValue?.(property).trim() || '';

  const palette = normalizeToken(dataset.spwSvgPalette || '');
  if (SPW_SVG_PALETTES[palette]) params.set('spw-svg-palette', palette);

  const pairs = [
    ['spw-svg-stroke', read('--spw-svg-stroke-scale')],
    ['spw-svg-dash', read('--spw-svg-flow-dash')],
    ['spw-svg-gap', read('--spw-svg-flow-gap')],
    ['spw-svg-label', read('--spw-svg-label-spacing')],
    ['spw-svg-space', read('--spw-svg-space')],
    ['spw-svg-motion-rate', read('--spw-svg-motion-rate')],
    ['spw-svg-pointer-lift', read('--spw-svg-pointer-lift')],
  ];
  if (!SPW_SVG_PALETTES[palette]) {
    pairs.push(
      ['spw-svg-accent', read('--spw-svg-brand-accent')],
      ['spw-svg-field', read('--spw-svg-brand-field')],
      ['spw-svg-fill', read('--spw-svg-node-fill-mix')],
    );
  }
  pairs.forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const motion = normalizeToken(dataset.spwSvgTuneMotion || '');
  if (MOTION_STATES.has(motion)) params.set('spw-svg-motion', motion);

  const contrast = normalizeToken(dataset.spwSvgTuneContrast || '');
  if (CONTRAST_STATES.has(contrast)) params.set('spw-svg-contrast', contrast);

  const pointer = normalizeToken(dataset.spwSvgPointer || '');
  if (POINTER_MODES.has(pointer)) params.set('spw-svg-pointer', pointer);

  const semantic = normalizeToken(dataset.spwSvgSemantic || '');
  if (SEMANTIC_MODES.has(semantic)) params.set('spw-svg-semantic', semantic);

  const responsive = normalizeToken(dataset.spwSvgResponsive || '');
  if (RESPONSIVE_MODES.has(responsive)) params.set('spw-svg-responsive', responsive);

  const interactive = normalizeToken(dataset.spwSvgInteractive || '');
  if (INTERACTIVE_MODES.has(interactive)) params.set('spw-svg-interactive', interactive);

  const environment = normalizeToken(dataset.spwSvgEnvironment || '');
  if (ENVIRONMENT_STATES.has(environment)) params.set('spw-svg-env', environment);

  const persona = normalizeToken(globalThis.document?.documentElement?.dataset?.spwSvgPersonaActive || '');
  if (persona) params.set('spw-svg-persona', persona);

  return params.toString();
}

const buildTunedUrl = (host) => {
  const base = globalThis.location?.href || 'https://spwashi.com/';
  const url = new URL(base);
  url.search = serializeSvgTunability(host);
  const anchorId = host.id || host.closest?.('[id]')?.id || '';
  if (anchorId) url.hash = anchorId;
  return url.toString();
};

const copyText = async (text) => {
  try {
    await globalThis.navigator?.clipboard?.writeText?.(text);
    return true;
  } catch (_) {
    return false;
  }
};

const getNamedGroups = (host) => [...(host.querySelectorAll?.('svg g[id]') || [])];

const setNodeFocus = (host, targetId = '') => {
  const groups = getNamedGroups(host);
  if (!groups.length) return;

  groups.forEach((group) => {
    if (!targetId) {
      removeDatasetValues(group, ['spwSvgNodeState']);
      return;
    }
    writeDatasetValues(group, {
      spwSvgNodeState: group.id === targetId ? 'focused' : 'dimmed',
    });
  });

  if (targetId) {
    writeDatasetValues(host, { spwSvgFocusNode: targetId });
  } else {
    removeDatasetValues(host, ['spwSvgFocusNode']);
  }
};

function initRailCompanion(host) {
  if (host.dataset.spwSvgRailManaged === 'true') return;

  const rail = host.querySelector?.('.spw-svg-rail');
  if (!rail) return;

  const chips = [...rail.querySelectorAll('a[href^="#"]')].filter((chip) => {
    const id = (chip.getAttribute('href') || '').slice(1);
    return id && host.querySelector(`svg g[id="${globalThis.CSS?.escape?.(id) ?? id}"]`);
  });
  if (!chips.length) return;

  writeDatasetValues(host, { spwSvgRailManaged: 'true' });
  markInstrumented(host, 'spw-svg-tunability', { tags: ['svg-rail', 'node-focus'] });

  chips.forEach((chip) => {
    const id = (chip.getAttribute('href') || '').slice(1);
    writeDatasetValues(chip, { spwSvgNodeRef: id });
    chip.addEventListener('pointerenter', () => setNodeFocus(host, id), { passive: true });
    chip.addEventListener('pointerleave', () => setNodeFocus(host, ''), { passive: true });
    chip.addEventListener('focusin', () => setNodeFocus(host, id));
    chip.addEventListener('focusout', () => setNodeFocus(host, ''));
  });
}

const ACTION_SETTLE_MS = 1600;

function initActionChips(host) {
  const chips = [...(host.querySelectorAll?.('[data-spw-svg-action]') || [])];

  chips.forEach((chip) => {
    if (chip.dataset.spwSvgActionManaged === 'true') return;
    writeDatasetValues(chip, { spwSvgActionManaged: 'true' });

    chip.addEventListener('click', async (event) => {
      event.preventDefault();
      const kind = normalizeToken(chip.dataset.spwSvgAction || '');

      let payload = '';
      if (kind === 'copy-url') payload = buildTunedUrl(host);
      if (kind === 'copy-source') payload = host.querySelector?.('svg')?.outerHTML || '';
      if (!payload) return;

      const copied = await copyText(payload);
      writeDatasetValues(chip, { spwSvgActionState: copied ? 'copied' : 'failed' });
      globalThis.setTimeout?.(() => {
        removeDatasetValues(chip, ['spwSvgActionState']);
      }, ACTION_SETTLE_MS);

      logger.info('svg action', {
        action: kind,
        host: host.dataset.spwSvgHost || 'svg',
        copied,
        bytes: payload.length,
      });
    });
  });
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
  writeDatasetValues(host, {
    spwSvgPointerState: 'active',
    spwSvgPointerX: xRatio.toFixed(4),
    spwSvgPointerY: yRatio.toFixed(4),
  });
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
  writeStyleValue(host, '--spw-svg-pointer-intensity', '0');
  writeStyleValue(host, '--spw-svg-pointer-x', '');
  writeStyleValue(host, '--spw-svg-pointer-y', '');
  writeStyleValue(host, '--spw-svg-pointer-x-ratio', '');
  writeStyleValue(host, '--spw-svg-pointer-y-ratio', '');
  writeDatasetValues(host, {
    spwSvgPointerState: 'rest',
    spwSvgPointerX: '',
    spwSvgPointerY: '',
  });
};

const getDeviceMode = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'fine';
  if (window.matchMedia('(hover: none)').matches) return 'hoverless';
  if (window.matchMedia('(pointer: coarse)').matches) return 'coarse';
  return 'fine';
};

const hostHasActivePointerMode = (host) => POINTER_MODES.has(normalizeToken(host?.dataset?.spwSvgPointer || ''));

/* Device mode is live, not a boot-time snapshot: attaching a mouse to a
   tablet, docking, or orientation change re-resolves data-spw-svg-device on
   every host that did not author an explicit device. Scroll/resize invalidate
   cached host rects so the pointer field never tracks a stale position. */

const POINTER_MANAGED_HOSTS = new Set();
const DEVICE_TRACKED_HOSTS = new Set();
let deviceWatcherStarted = false;

const invalidateHostRects = () => {
  POINTER_MANAGED_HOSTS.forEach((host) => {
    if (!host.isConnected) {
      POINTER_MANAGED_HOSTS.delete(host);
      return;
    }
    const state = HOST_STATE.get(host);
    if (state) state.rect = null;
  });
};

const syncDeviceMode = () => {
  const mode = getDeviceMode();
  DEVICE_TRACKED_HOSTS.forEach((host) => {
    if (!host.isConnected) {
      DEVICE_TRACKED_HOSTS.delete(host);
      return;
    }
    writeDatasetValues(host, { spwSvgDevice: mode });
  });
  logger.debug('device mode resolved', { mode, hosts: DEVICE_TRACKED_HOSTS.size });
};

const startDeviceWatcher = () => {
  if (deviceWatcherStarted || typeof window === 'undefined') return;
  deviceWatcherStarted = true;

  if (window.matchMedia) {
    ['(hover: none)', '(pointer: coarse)'].forEach((query) => {
      window.matchMedia(query).addEventListener?.('change', syncDeviceMode);
    });
  }
  window.addEventListener('resize', invalidateHostRects, { passive: true });
  window.addEventListener('scroll', invalidateHostRects, { passive: true });
};

function initPointerHost(host) {
  const pointerMode = normalizeToken(host.dataset.spwSvgPointer || '');
  if (!POINTER_MODES.has(pointerMode) || host.dataset.spwSvgPointerManaged === 'true') return;

  const authoredDevice = normalizeToken(host.dataset.spwSvgDevice || '');
  writeDatasetValues(host, {
    spwSvgPointerManaged: 'true',
    spwSvgPointerState: host.dataset.spwSvgPointerState || 'rest',
    spwSvgDevice: DEVICE_MODES.has(authoredDevice) ? authoredDevice : getDeviceMode(),
  });
  if (!DEVICE_MODES.has(authoredDevice)) DEVICE_TRACKED_HOSTS.add(host);
  POINTER_MANAGED_HOSTS.add(host);
  startDeviceWatcher();
  markInstrumented(host, 'spw-svg-tunability', { tags: ['svg-pointer', pointerMode] });

  host.addEventListener('pointerenter', (event) => {
    if (!hostHasActivePointerMode(host)) return;
    measureHost(host);
    queuePointerWrite(host, event);
  }, { passive: true });

  host.addEventListener('pointermove', (event) => {
    if (!hostHasActivePointerMode(host)) return;
    queuePointerWrite(host, event);
  }, { passive: true });

  host.addEventListener('pointerleave', () => {
    clearPointerHost(host);
  }, { passive: true });

  host.addEventListener('focusin', () => {
    if (!hostHasActivePointerMode(host)) return;
    host.dataset.spwSvgPointerState = 'active';
    host.style.setProperty('--spw-svg-pointer-intensity', '0.66');
  });

  host.addEventListener('focusout', () => {
    clearPointerHost(host);
  });

  // Interactive modes for project development, notes, and cauldron priming.
  // Improves SVG semantics (actionable), interactivity (tap/prime/note), and ties to local notes/screenshots.
  const interactiveMode = normalizeToken(host.dataset.spwSvgInteractive || '');
  if (INTERACTIVE_MODES.has(interactiveMode)) {
    host.addEventListener('click', (event) => {
      if (interactiveMode === 'tap' || interactiveMode === 'prime') {
        try {
          const bus = globalThis.__SPW_SITE__?.bus || globalThis.bus;
          bus?.emit?.('spw:svg-interaction', {
            host: host.dataset.spwSvgHost || 'svg',
            mode: interactiveMode,
            semantic: host.dataset.spwSvgSemantic || '',
            pointer: { x: event.clientX, y: event.clientY },
          });
        } catch (_) {}
      }
      if (interactiveMode === 'note' || interactiveMode === 'prime') {
        // Opportunity for notes: if nearby note field or cauldron, prime a note about this SVG.
        const noteTarget = host.closest('[data-spw-local-note-entry]') || document.querySelector('[data-spw-local-note-entry]');
        if (noteTarget) {
          const input = noteTarget.querySelector('input, textarea');
          if (input) {
            const hint = `SVG: ${host.dataset.spwSvgHost || 'tunable'} (${host.dataset.spwSvgSemantic || 'project'})`;
            if (!input.value.includes(hint)) input.value = (input.value ? input.value + ' ' : '') + hint;
            input.focus();
          }
        }
      }
    });
  }
}

/* Live workbench: form controls that drive applySvgTunability on a target
   specimen directly, with a live shareable-URL readout. Moving a control
   retunes the diagram and rewrites the URL you would copy — the lab becomes a
   playable instrument instead of a static demo. Framework-free and
   inspectable on purpose: this is meant to be legible as training material. */

const WORKBENCH_INPUT_SELECTOR = '[data-spw-svg-tune]';

const readWorkbenchValue = (input) => {
  const raw = input.value?.trim?.() ?? '';
  if (!raw) return '';
  const unit = input.dataset.spwSvgTuneUnit || '';
  return unit && input.type === 'range' ? `${raw}${unit}` : raw;
};

const renderWorkbenchEcho = (input) => {
  const field = input.closest?.('.svg-workbench__field');
  const echo = field?.querySelector?.('[data-spw-svg-tune-echo]');
  if (!echo) return;
  echo.textContent = readWorkbenchValue(input) || 'authored';
};

const collectWorkbenchOptions = (workbench) => {
  const options = {};
  workbench.querySelectorAll(WORKBENCH_INPUT_SELECTOR).forEach((input) => {
    const key = input.dataset.spwSvgTune;
    if (!key) return;
    const value = readWorkbenchValue(input);
    if (!value) return;
    options[key] = value;
  });
  return options;
};

const renderWorkbenchReadout = (workbench, host) => {
  const query = serializeSvgTunability(host);
  const readout = workbench.querySelector('[data-spw-svg-workbench-url]');
  if (readout) readout.textContent = query ? `?${query}` : '(authored defaults)';

  workbench.querySelectorAll('[data-spw-svg-workbench-count]').forEach((node) => {
    const count = query ? new URLSearchParams(query).size : 0;
    node.textContent = String(count);
  });
};

function initSvgWorkbench(workbench) {
  if (workbench.dataset.spwSvgWorkbenchManaged === 'true') return;

  const targetSelector = workbench.dataset.spwSvgWorkbenchTarget || '';
  const doc = resolveDocument(workbench);
  const host = resolveHost(targetSelector || workbench, doc);
  if (!host) return;

  writeDatasetValues(workbench, { spwSvgWorkbenchManaged: 'true' });
  markInstrumented(workbench, 'spw-svg-tunability', { tags: ['svg-workbench'] });

  const retune = () => {
    applySvgTunability(host, { ...collectWorkbenchOptions(workbench), root: doc });
    renderWorkbenchReadout(workbench, host);
  };

  workbench.querySelectorAll(WORKBENCH_INPUT_SELECTOR).forEach((input) => {
    const event = input.tagName === 'SELECT' ? 'change' : 'input';
    renderWorkbenchEcho(input);
    input.addEventListener(event, () => {
      renderWorkbenchEcho(input);
      retune();
    });
  });

  const reset = workbench.querySelector('[data-spw-svg-workbench-reset]');
  if (reset) {
    reset.addEventListener('click', (event) => {
      event.preventDefault();
      workbench.querySelectorAll(WORKBENCH_INPUT_SELECTOR).forEach((input) => {
        if (input.tagName === 'SELECT') input.selectedIndex = 0;
        else if (input.type === 'range') input.value = input.defaultValue;
        renderWorkbenchEcho(input);
      });
      resetSvgTunability(host);
      renderWorkbenchReadout(workbench, host);
    });
  }

  // The workbench's copy button lives outside the target host, so wire it to
  // serialize the target rather than relying on initActionChips' host scan.
  const copyUrl = workbench.querySelector('[data-spw-svg-action="copy-url"]');
  if (copyUrl && copyUrl.dataset.spwSvgActionManaged !== 'true') {
    writeDatasetValues(copyUrl, { spwSvgActionManaged: 'true' });
    copyUrl.addEventListener('click', async (event) => {
      event.preventDefault();
      const copied = await copyText(buildTunedUrl(host));
      writeDatasetValues(copyUrl, { spwSvgActionState: copied ? 'copied' : 'failed' });
      globalThis.setTimeout?.(() => removeDatasetValues(copyUrl, ['spwSvgActionState']), ACTION_SETTLE_MS);
    });
  }

  renderWorkbenchReadout(workbench, host);
}

const readHostPersonaTokens = (host) => (host.getAttribute('data-spw-svg-persona') || '')
  .split(/\s+/)
  .map(normalizeToken)
  .filter(Boolean);

const resolveHtmlRoot = (root = globalThis.document) => root?.documentElement || null;

export function applySvgPersonaLens(persona = '', root = globalThis.document) {
  const html = resolveHtmlRoot(root);
  if (!html) return '';

  const token = normalizeToken(persona);
  if (!token) {
    removeDatasetValues(html, ['spwSvgPersonaActive']);
    writeStyleValue(html, '--spw-svg-persona-harmony', '0');
    getHosts(root).forEach((host) => removeDatasetValues(host, ['spwSvgPersonaMatch']));
    bus.emit('svg:persona-selected', { persona: '', source: 'svg-tunability' });
    return '';
  }

  writeDatasetValues(html, { spwSvgPersonaActive: token });
  writeStyleValue(html, '--spw-svg-persona-harmony', '1');

  getHosts(root).forEach((host) => {
    if (!host.getAttribute('data-spw-svg-persona')) return;
    const match = readHostPersonaTokens(host).includes(token);
    writeDatasetValues(host, {
      spwSvgPersonaMatch: match ? 'true' : 'dim',
    });
  });

  bus.emit('svg:persona-selected', { persona: token, source: 'svg-tunability' });
  logger.info('svg persona lens active', { persona: token });
  return token;
}

export function applySvgPersonaQuery(root = globalThis.document, options = {}) {
  const tuning = parseSvgTunabilitySearch(options.search);
  if (!tuning.persona) return '';
  return applySvgPersonaLens(tuning.persona, root);
}

const PERSONA_SELECT_SELECTOR = '[data-spw-svg-persona-select]';

function syncPersonaSelectChips(root, active = '') {
  const token = normalizeToken(active);
  root.querySelectorAll(PERSONA_SELECT_SELECTOR).forEach((chip) => {
    const value = normalizeToken(chip.dataset.spwSvgPersonaSelect || '');
    const pressed = Boolean(token) && value === token;
    chip.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    writeDatasetValues(chip, {
      spwSvgPersonaSelectState: pressed ? 'active' : '',
    });
  });
}

function initPersonaLens(root = globalThis.document) {
  const chips = [...(root?.querySelectorAll?.(PERSONA_SELECT_SELECTOR) || [])];
  if (!chips.length) return;

  chips.forEach((chip) => {
    if (chip.dataset.spwSvgPersonaSelectManaged === 'true') return;
    writeDatasetValues(chip, { spwSvgPersonaSelectManaged: 'true' });

    chip.addEventListener('click', (event) => {
      event.preventDefault();
      const next = normalizeToken(chip.dataset.spwSvgPersonaSelect || '');
      const current = normalizeToken(root.documentElement?.dataset?.spwSvgPersonaActive || '');
      const persona = current === next ? '' : next;

      if (typeof globalThis.history?.replaceState === 'function' && globalThis.location) {
        const url = new URL(globalThis.location.href);
        if (persona) url.searchParams.set('spw-svg-persona', persona);
        else url.searchParams.delete('spw-svg-persona');
        globalThis.history.replaceState(null, '', url);
      }

      applySvgPersonaLens(persona, root);
      syncPersonaSelectChips(root, persona);
    });
  });

  const active = normalizeToken(root.documentElement?.dataset?.spwSvgPersonaActive || '')
    || normalizeToken(parseSvgTunabilitySearch(globalThis.location?.search).persona || '');
  if (active) applySvgPersonaLens(active, root);
  syncPersonaSelectChips(root, active);
}

export function initSpwSvgTunability(ctx, root, options = {}) {
  if (!(root instanceof Node)) {
    root = globalThis.document;
  }
  const hosts = getHosts(root);
  applySvgQueryTunability(root, options);
  applySvgPersonaQuery(root, options);
  hosts.forEach((host) => {
    initPointerHost(host);
    initRailCompanion(host);
    initActionChips(host);
  });

  const workbenches = [...(root?.querySelectorAll?.('[data-spw-svg-workbench]') || [])];
  workbenches.forEach(initSvgWorkbench);
  initPersonaLens(root);

  if (hosts.length) {
    logger.debug('initialized svg tunability hosts', { count: hosts.length, workbenches: workbenches.length });
  }

  return hosts;
}
