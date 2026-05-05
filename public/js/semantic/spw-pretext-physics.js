/**
 * spw-pretext-physics.js
 * ---------------------------------------------------------------------------
 * Pretext Physics Runtime
 *
 * Purpose
 * - Make text behavior measurable, inspectable, and semantically responsive.
 * - Give designers a legible API for reading-aware interaction and
 *   microanimation.
 * - Keep runtime bounded, cache-heavy, and root-scoped.
 * - Expose useful internal concepts for later refinement without turning the
 *   module into a public grab-bag.
 *
 * Public API
 * - initPretextPhysics(options)
 * - createPretextController(root, options)
 * - registerPretextPreset(name, preset)
 * - registerPretextChannel(name, fn)
 *
 * Internal-but-exposed contracts
 * - initPretextPhysics._internals
 * - createPretextController._internals
 *
 * Notes
 * - These internals are intentionally exposed for design/runtime iteration,
 *   but not exported as stable public API.
 * - They may change more often than the top-level functions.
 * ---------------------------------------------------------------------------
 */

import { loadPretext } from '../legacy/pretext-utils.js';
import { bus } from '/public/js/spw-bus.js';

/* ==========================================================================
   1. Defaults, presets, channels
   ========================================================================== */

const DEFAULTS = Object.freeze({
  root: document,
  selector: '[data-spw-flow="pretext"]',
  scaffoldSelector: '[data-spw-pretext-scaffold], [data-spw-debug~="pretext"]',

  pointerFieldX: 520,
  pointerFieldY: 260,
  centerSnapPx: 12,
  approachRangePx: 120,
  projectDxMultiplier: 1.3,

  minWidthPx: 160,
  maxWidthPx: 960,
  defaultLineHeightPx: 24,
  widthStepPx: 12,

  asyncLayout: true,
  schedulerPriority: 'user-visible',

  ornamentEnabled: true,
  rhythmEnabled: true,
  rhythmPulseAffectsOnlyResting: true,

  debug: false,
  preserveOriginalText: true,

  preset: 'prose-calm',

  phaseProfiles: {
    ambient: { widthScale: 1.0, pulse: 0.25, measure: 'standard' },
    verse:   { widthScale: 0.92, pulse: 0.38, measure: 'tight' },
    chorus:  { widthScale: 1.1, pulse: 0.62, measure: 'wide' },
    bridge:  { widthScale: 0.96, pulse: 0.46, measure: 'elastic' },
    drop:    { widthScale: 1.2, pulse: 0.95, measure: 'wide' }
  },

  channels: {
    classify: null,
    project: null,
    decorate: null,
    scaffold: null
  }
});

const PRESETS = new Map([
  ['prose-calm', {
    kind: 'prose',
    density: 'medium',
    measureProfile: 'standard',
    projectionFamily: 'expand',
    ornamentFamily: 'none',
    motionBias: 'reading'
  }],
  ['question-probe', {
    kind: 'question',
    density: 'medium',
    measureProfile: 'tight',
    projectionFamily: 'lean',
    ornamentFamily: 'echo',
    motionBias: 'probe'
  }],
  ['registry-indexed', {
    kind: 'ledger',
    density: 'dense',
    measureProfile: 'wide',
    projectionFamily: 'indent',
    ornamentFamily: 'staged',
    motionBias: 'indexed'
  }],
  ['operator-spec', {
    kind: 'operator-dense',
    density: 'dense',
    measureProfile: 'elastic',
    projectionFamily: 'expand',
    ornamentFamily: 'sigil-edge',
    motionBias: 'structural'
  }],
  ['caption-tight', {
    kind: 'caption',
    density: 'soft',
    measureProfile: 'tight',
    projectionFamily: 'pulse',
    ornamentFamily: 'none',
    motionBias: 'caption'
  }],
  ['invocation-charged', {
    kind: 'invocation',
    density: 'medium',
    measureProfile: 'elastic',
    projectionFamily: 'pulse',
    ornamentFamily: 'echo',
    motionBias: 'charged'
  }]
]);

const CHANNELS = {
  classify: new Map(),
  project: new Map(),
  decorate: new Map(),
  scaffold: new Map()
};

const INFLUENCE_BUCKETS = Object.freeze([0, 0.2, 0.4, 0.6, 0.8, 1]);
const FALLBACK_OPERATOR = '?';

/* ==========================================================================
   2. Shared runtime state
   ========================================================================== */

const RUNTIME = {
  pretextPromise: null,
  pretext: null,

  instances: new Set(),
  byElement: new WeakMap(),
  controllers: new Set(),

  listenersAttached: false,
  resizeObserver: null,
  intersectionObserver: null,
  pointerRaf: 0,

  pointer: {
    active: false,
    x: 0,
    y: 0
  },

  rhythm: {
    phase: 'ambient',
    beat: 0,
    measure: 0,
    bpm: 96,
    playing: false
  },

  unsubs: [],
  config: DEFAULTS
};

/* ==========================================================================
   3. Public API
   ========================================================================== */

export async function initPretextPhysics(options = {}) {
  const controller = createPretextController(options.root || document, options);
  await controller.mount();
  return () => controller.destroy();
}

export function createPretextController(root = document, options = {}) {
  const config = mergeConfig({ ...options, root });

  const controller = {
    root,
    config,
    mounted: false,
    mountedStates: [],

    async mount() {
      if (controller.mounted) return controller.api();

      const targets = collectTargets(root, config.selector);
      if (!targets.length) {
        controller.mounted = true;
        return controller.api();
      }

      const pretext = await ensurePretext();
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const states = targets
        .filter((el) => !RUNTIME.byElement.has(el))
        .map((el) => mountInstance(el, pretext, config));

      controller.mountedStates = states;
      controller.mounted = true;

      ensureRuntimeListeners(config);
      RUNTIME.controllers.add(controller);

      return controller.api();
    },

    refresh(nextOptions = {}) {
      const nextConfig = mergeConfig({ ...config, ...nextOptions, root: nextOptions.root || root });
      controller.config = nextConfig;

      for (const state of controller.mountedStates) {
        if (!RUNTIME.instances.has(state)) continue;
        state.config = nextConfig;
        state.context = classifyContext(state, nextConfig);
        refreshCanonicalWidth(state);
        syncSurfaceState(state);
        updateScaffold(state);
      }

      return controller.api();
    },

    destroy() {
      for (const state of controller.mountedStates) {
        unmountInstance(state);
      }
      controller.mountedStates = [];
      controller.mounted = false;
      RUNTIME.controllers.delete(controller);
      teardownRuntimeIfIdle();
    },

    api() {
      return {
        cleanup: () => controller.destroy(),
        refresh: (nextOptions) => controller.refresh(nextOptions),
        getStates: () => controller.mountedStates.slice()
      };
    }
  };

  return controller;
}

export function registerPretextPreset(name, preset) {
  if (!name || typeof name !== 'string' || !preset || typeof preset !== 'object') {
    return false;
  }
  PRESETS.set(name, Object.freeze({ ...preset }));
  return true;
}

export function registerPretextChannel(name, fn) {
  if (!CHANNELS[name] || typeof fn !== 'function') return false;
  CHANNELS[name].set(fn.name || `channel-${CHANNELS[name].size + 1}`, fn);
  return true;
}

/* ==========================================================================
   4. Internal exposure (not exported)
   --------------------------------------------------------------------------
   Useful for designers/debuggers in devtools without making this a full public
   API surface.
   ========================================================================== */

const INTERNALS = Object.freeze({
  DEFAULTS,
  PRESETS,
  CHANNELS,
  RUNTIME,
  classifyContext,
  resolveSemanticContext,
  createAmbientProposal,
  classifyWidthClass,
  quantizeInfluence,
  readOperatorContext,
  shouldDecorateLine
});

initPretextPhysics._internals = INTERNALS;
createPretextController._internals = INTERNALS;

/* ==========================================================================
   5. Config
   ========================================================================== */

function mergeConfig(options) {
  const presetName = options.preset || DEFAULTS.preset;
  const preset = PRESETS.get(presetName) || PRESETS.get(DEFAULTS.preset) || {};

  return {
    ...DEFAULTS,
    ...options,
    preset: presetName,
    presetConfig: preset,
    phaseProfiles: {
      ...DEFAULTS.phaseProfiles,
      ...(options.phaseProfiles || {})
    },
    channels: {
      ...DEFAULTS.channels,
      ...(options.channels || {})
    }
  };
}

/* ==========================================================================
   6. Boot helpers
   ========================================================================== */

async function ensurePretext() {
  if (!RUNTIME.pretextPromise) {
    RUNTIME.pretextPromise = loadPretext();
  }

  RUNTIME.pretext = RUNTIME.pretext || (await RUNTIME.pretextPromise);
  return RUNTIME.pretext;
}

function collectTargets(root, selector) {
  const targets = [];
  if (root instanceof Element && root.matches(selector)) {
    targets.push(root);
  }
  root.querySelectorAll?.(selector).forEach((el) => targets.push(el));
  return targets;
}

/* ==========================================================================
   7. Runtime listeners
   ========================================================================== */

function ensureRuntimeListeners(config) {
  if (RUNTIME.listenersAttached) return;

  RUNTIME.config = config;

  document.body.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('blur', settleAllInstances);

  if ('ResizeObserver' in window) {
    RUNTIME.resizeObserver = new ResizeObserver(onResize);
  } else {
    window.addEventListener('resize', onWindowResize, { passive: true });
  }

  if ('IntersectionObserver' in window) {
    RUNTIME.intersectionObserver = new IntersectionObserver(onIntersection, {
      threshold: [0, 0.1, 0.5, 1]
    });
  }

  if (config.rhythmEnabled) {
    attachRhythmListeners();
  }

  RUNTIME.listenersAttached = true;
}

function teardownRuntimeIfIdle() {
  if (!RUNTIME.listenersAttached) return;
  if (RUNTIME.instances.size > 0) return;

  document.body.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('blur', settleAllInstances);
  window.removeEventListener('resize', onWindowResize);

  if (RUNTIME.pointerRaf) {
    cancelAnimationFrame(RUNTIME.pointerRaf);
    RUNTIME.pointerRaf = 0;
  }

  RUNTIME.resizeObserver?.disconnect();
  RUNTIME.resizeObserver = null;

  RUNTIME.intersectionObserver?.disconnect();
  RUNTIME.intersectionObserver = null;

  detachRhythmListeners();

  RUNTIME.listenersAttached = false;
}

function attachRhythmListeners() {
  detachRhythmListeners();

  RUNTIME.unsubs.push(
    bus.on?.('rhythm:pulse', onRhythmPulse),
    bus.on?.('rhythm:phase', onRhythmPhase),
    bus.on?.('rhythm:measure', onRhythmMeasure),
    bus.on?.('rhythm:tempo', onRhythmTempo),
    bus.on?.('rhythm:start', onRhythmStart),
    bus.on?.('rhythm:stop', onRhythmStop),
    bus.on?.('rhythm:reset', onRhythmReset),
    bus.on?.('stream:pulse', onRhythmPulse),
    bus.on?.('stream:phase', onRhythmPhase)
  );
}

function detachRhythmListeners() {
  RUNTIME.unsubs.forEach((off) => {
    try {
      off?.();
    } catch (error) {
      console.warn('[Pretext] Failed to detach listener.', error);
    }
  });
  RUNTIME.unsubs = [];
}

/* ==========================================================================
   8. Instance lifecycle
   ========================================================================== */

function mountInstance(el, pretext, config) {
  const text = getSourceText(el);
  const computed = getComputedStyle(el);
  const font = readFontProfile(computed);
  const semanticContext = resolveSemanticContext(el);

  const prepared = pretext.prepareWithSegments(text, font.fontShorthand, {
    whiteSpace: 'normal'
  });

  const linesRoot = document.createElement('div');
  linesRoot.className = 'pretext-flow-lines';

  const scaffoldRoot = shouldShowScaffold(el, config)
    ? createScaffoldRoot()
    : null;

  const originalHTML = config.preserveOriginalText ? el.innerHTML : null;

  el.replaceChildren(linesRoot, ...(scaffoldRoot ? [scaffoldRoot] : []));

  const state = {
    el,
    pretext,
    config,
    originalHTML,

    substrate: {
      text,
      prepared,
      font,
      lineHeightPx: font.lineHeightPx || config.defaultLineHeightPx
    },

    semanticContext,
    context: null,

    measurement: {
      canonicalWidth: 0,
      projectedWidth: 0,
      widthStepPx: config.widthStepPx,
      widthClass: 'md',
      wrapVolatility: 'stable',
      cache: new Map(),
      canonicalKey: null,
      canonicalLines: 0,
      requestToken: 0,
      appliedToken: 0
    },

    interaction: {
      mode: 'resting',
      influence: 0,
      influenceBucket: 0,
      direction: 0,
      source: 'none',
      visible: true
    },

    rhythm: { ...RUNTIME.rhythm },

    ornament: {
      enabled: Boolean(config.ornamentEnabled),
      family: 'none'
    },

    dom: {
      linesRoot,
      scaffoldRoot,
      lineNodes: []
    }
  };

  state.context = classifyContext(state, config);
  state.ornament.family = state.context.ornamentFamily;

  const canonicalWidth = guessCanonicalWidth(state, config);
  state.measurement.canonicalWidth = canonicalWidth;
  state.measurement.projectedWidth = canonicalWidth;
  state.measurement.widthClass = classifyWidthClass(canonicalWidth);

  RUNTIME.byElement.set(el, state);
  RUNTIME.instances.add(state);

  RUNTIME.resizeObserver?.observe(el);
  RUNTIME.intersectionObserver?.observe(el);

  const layout = getOrMeasureLayoutSync(state, canonicalWidth);
  state.measurement.canonicalKey = widthKey(canonicalWidth, state.measurement.widthStepPx);
  state.measurement.canonicalLines = layout.lines.length;

  patchRenderedLines(state, layout, canonicalWidth);
  syncSurfaceState(state);
  updateScaffold(state);

  return state;
}

function unmountInstance(state) {
  if (!state) return;

  state.measurement.requestToken += 1;

  RUNTIME.instances.delete(state);
  RUNTIME.byElement.delete(state.el);

  RUNTIME.resizeObserver?.unobserve?.(state.el);
  RUNTIME.intersectionObserver?.unobserve?.(state.el);

  if (state.config.preserveOriginalText && typeof state.originalHTML === 'string') {
    state.el.innerHTML = state.originalHTML;
  }
}

/* ==========================================================================
   9. Semantic context
   ========================================================================== */

function resolveSemanticContext(el) {
  const nearestFrame = el.closest('.site-frame');
  const nearestArticle = el.closest('article');
  const nearestSection = el.closest('section');
  const nearestFigure = el.closest('figure');
  const nearestNav = el.closest('nav');

  const role =
    nearestFrame?.dataset.spwRole ||
    nearestArticle?.dataset.spwRole ||
    nearestSection?.dataset.spwRole ||
    el.dataset.spwRole ||
    'ambient';

  const meaning =
    nearestFrame?.dataset.spwMeaning ||
    nearestArticle?.dataset.spwMeaning ||
    nearestSection?.dataset.spwMeaning ||
    el.dataset.spwMeaning ||
    '';

  const heading =
    nearestFrame?.querySelector('h1, h2, h3') ||
    nearestArticle?.querySelector('h1, h2, h3') ||
    nearestSection?.querySelector('h1, h2, h3') ||
    nearestFigure?.querySelector('figcaption') ||
    null;

  return {
    role,
    meaning,
    headingText: normalizeText(heading?.textContent || ''),
    nearestFrame,
    nearestArticle,
    nearestSection,
    nearestFigure,
    nearestNav,
    scopeType:
      nearestFigure ? 'figure' :
      nearestArticle ? 'article' :
      nearestNav ? 'nav' :
      nearestSection ? 'section' :
      'ambient'
  };
}

function classifyContext(state, config) {
  const { el, substrate, semanticContext } = state;
  const anatomy = analyzeText(substrate.text);
  const presetFromAttr = el.dataset.spwPretextPreset || el.dataset.pretextPreset;
  const presetName = presetFromAttr || config.preset;
  const preset = PRESETS.get(presetName) || config.presetConfig || {};

  const baseContext = {
    kind: preset.kind || inferTextKind(anatomy, semanticContext),
    density: preset.density || inferDensity(anatomy, semanticContext),
    measureProfile: preset.measureProfile || inferMeasureProfile(anatomy, semanticContext),
    projectionFamily: preset.projectionFamily || inferProjectionFamily(anatomy, semanticContext),
    ornamentFamily: preset.ornamentFamily || inferOrnamentFamily(anatomy, semanticContext),
    motionBias: preset.motionBias || 'reading',
    semanticGenre: el.dataset.spwPretextGenre || semanticContext.role,
    lineHeightPx: substrate.font.lineHeightPx || config.defaultLineHeightPx,
    widthStepPx: config.widthStepPx
  };

  return runChannels('classify', baseContext, {
    state,
    el,
    anatomy,
    semanticContext,
    config
  }, config);
}

function analyzeText(text) {
  const chars = text.length || 0;
  const words = text.match(/\b[\w'-]+\b/g) || [];
  const operators = text.match(/[~@^?!*=&$%|:#<>]+/g) || [];
  const punctuation = text.match(/[.,;:!?()[\]{}'"`-]/g) || [];

  return {
    chars,
    words: words.length,
    operatorDensity: chars ? (operators.join('').length / chars) : 0,
    punctuationDensity: chars ? (punctuation.length / chars) : 0,
    lineBreakCount: (text.match(/\n/g) || []).length,
    questionDensity: chars ? ((text.match(/\?/g) || []).length / chars) : 0
  };
}

function inferTextKind(anatomy, semanticContext) {
  if (semanticContext.scopeType === 'figure') return 'caption';
  if (/operator|syntax|grammar|spec|binding|probe|frame/.test(humanize(`${semanticContext.role} ${semanticContext.meaning} ${semanticContext.headingText}`))) {
    return 'operator-dense';
  }
  if (anatomy.questionDensity > 0.02) return 'question';
  if (anatomy.lineBreakCount >= 2) return 'ledger';
  return 'prose';
}

function inferDensity(anatomy) {
  const load = anatomy.operatorDensity * 2.2 + anatomy.punctuationDensity * 1.4 + Math.min(anatomy.words / 120, 1);
  if (load > 1.25) return 'dense';
  if (load > 0.7) return 'medium';
  return 'soft';
}

function inferMeasureProfile(anatomy, semanticContext) {
  if (semanticContext.scopeType === 'figure') return 'tight';
  if (anatomy.operatorDensity > 0.08) return 'elastic';
  if (anatomy.words > 50) return 'wide';
  return 'standard';
}

function inferProjectionFamily(anatomy, semanticContext) {
  if (semanticContext.scopeType === 'figure') return 'pulse';
  if (anatomy.questionDensity > 0.02) return 'lean';
  if (anatomy.lineBreakCount >= 2) return 'indent';
  return 'expand';
}

function inferOrnamentFamily(anatomy, semanticContext) {
  if (semanticContext.scopeType === 'figure') return 'none';
  if (anatomy.operatorDensity > 0.05) return 'sigil-edge';
  if (anatomy.questionDensity > 0.02) return 'echo';
  return 'none';
}

/* ==========================================================================
   10. Layout measurement
   ========================================================================== */

function guessCanonicalWidth(state, config) {
  const { el, context, substrate } = state;
  const measured = Math.max(el.clientWidth || 0, el.offsetWidth || 0);

  if (measured) {
    return clamp(measured, config.minWidthPx, config.maxWidthPx);
  }

  const charsPerLine =
    context.measureProfile === 'tight' ? 24 :
    context.measureProfile === 'wide' ? 68 :
    context.measureProfile === 'elastic' ? 44 :
    54;

  const estimated = Math.round(charsPerLine * substrate.font.averageAdvancePxGuess);
  return clamp(estimated, config.minWidthPx, config.maxWidthPx);
}

function getOrMeasureLayoutSync(state, width) {
  const key = widthKey(width, state.measurement.widthStepPx);
  const cached = state.measurement.cache.get(key);
  if (cached) return cached;

  const quantized = quantize(width, state.measurement.widthStepPx);
  const layout = state.pretext.layoutWithLines(
    state.substrate.prepared,
    quantized,
    state.substrate.lineHeightPx
  );

  state.measurement.cache.set(key, layout);
  updateWrapVolatility(state, layout.lines.length);
  return layout;
}

async function getOrMeasureLayoutAsync(state, width) {
  const key = widthKey(width, state.measurement.widthStepPx);
  const cached = state.measurement.cache.get(key);
  if (cached) return cached;

  const quantized = quantize(width, state.measurement.widthStepPx);

  const task = () => {
    const layout = state.pretext.layoutWithLines(
      state.substrate.prepared,
      quantized,
      state.substrate.lineHeightPx
    );
    state.measurement.cache.set(key, layout);
    updateWrapVolatility(state, layout.lines.length);
    return layout;
  };

  if (
    state.config.asyncLayout &&
    window.scheduler &&
    typeof window.scheduler.postTask === 'function'
  ) {
    return window.scheduler.postTask(task, {
      priority: state.config.schedulerPriority
    });
  }

  return task();
}

function refreshCanonicalWidth(state) {
  const next = guessCanonicalWidth(state, state.config);

  if (Math.abs(next - state.measurement.canonicalWidth) < state.measurement.widthStepPx) {
    return;
  }

  state.measurement.canonicalWidth = next;
  state.measurement.widthClass = classifyWidthClass(next);
  state.measurement.cache.clear();
  state.measurement.canonicalKey = null;
  state.measurement.canonicalLines = 0;

  applyProjectionProposal(state, {
    width: next,
    influence: 0,
    direction: 0,
    mode: 'resting',
    source: 'resize',
    force: true
  });
}

function updateWrapVolatility(state, lineCount) {
  const canonical = state.measurement.canonicalLines || lineCount;
  const diff = Math.abs(lineCount - canonical);

  state.measurement.wrapVolatility =
    diff >= 4 ? 'volatile' :
    diff >= 2 ? 'responsive' :
    'stable';
}

/* ==========================================================================
   11. Rendering
   ========================================================================== */

function renderProjectedLines(state, width) {
  const token = ++state.measurement.requestToken;

  getOrMeasureLayoutAsync(state, width)
    .then((layout) => {
      if (!RUNTIME.instances.has(state)) return;
      if (token !== state.measurement.requestToken) return;

      state.measurement.appliedToken = token;

      if (!state.measurement.canonicalKey && width === state.measurement.canonicalWidth) {
        state.measurement.canonicalKey = widthKey(width, state.measurement.widthStepPx);
        state.measurement.canonicalLines = layout.lines.length;
      }

      patchRenderedLines(state, layout, width);
      syncSurfaceState(state);
      updateScaffold(state);
    })
    .catch((error) => {
      if (token !== state.measurement.requestToken) return;
      console.warn('[Pretext] Layout render failed.', error);
    });
}

function patchRenderedLines(state, layout, width) {
  const operator = readOperatorContext(state.el);
  const nodes = state.dom.lineNodes;
  const lines = layout.lines;
  const needed = lines.length;

  while (nodes.length < needed) {
    const node = createLineNode();
    nodes.push(node);
    state.dom.linesRoot.appendChild(node);
  }

  while (nodes.length > needed) {
    const node = nodes.pop();
    node.remove();
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const node = nodes[index];

    node.style.width = `${width}px`;
    node.style.setProperty('--line-index', index);

    const decoration = getLineDecoration(state, {
      line,
      index,
      operator,
      influence: state.interaction.influence,
      influenceBucket: state.interaction.influenceBucket,
      mode: state.interaction.mode,
      beat: state.rhythm.beat,
      phase: state.rhythm.phase
    });

    const before = decoration.before || '';
    const after = decoration.after || '';
    const text = line.text || '';
    const className = `line-decor ${decoration.className || ''}`.trim();

    if (node._before.textContent !== before) node._before.textContent = before;
    if (node._text.textContent !== text) node._text.textContent = text;
    if (node._after.textContent !== after) node._after.textContent = after;

    node._before.className = className;
    node._after.className = className;
    node._before.hidden = !before;
    node._after.hidden = !after;
  }
}

function createLineNode() {
  const line = document.createElement('div');
  line.className = 'pretext-flow-line';

  const before = document.createElement('span');
  before.className = 'line-decor';
  before.hidden = true;

  const text = document.createElement('span');
  text.className = 'pretext-flow-line-text';

  const after = document.createElement('span');
  after.className = 'line-decor';
  after.hidden = true;

  line.append(before, text, after);
  line._before = before;
  line._text = text;
  line._after = after;

  return line;
}

function getLineDecoration(state, lineInfo) {
  if (!state.ornament.enabled || state.ornament.family === 'none') {
    return { before: '', after: '', className: '' };
  }

  const base = { before: '', after: '', className: '' };
  const decorated = runChannels('decorate', base, { state, lineInfo }, state.config);

  if (decorated.before || decorated.after || decorated.className) {
    return decorated;
  }

  if (!shouldDecorateLine(state, lineInfo)) {
    return base;
  }

  const sigil = lineInfo.operator || FALLBACK_OPERATOR;

  switch (state.ornament.family) {
    case 'sigil-edge':
      return { before: sigil, after: sigil, className: 'is-sigil-edge' };
    case 'echo':
      return { before: sigil, after: '', className: 'is-echo' };
    case 'staged':
      return { before: '', after: sigil, className: 'is-staged' };
    default:
      return base;
  }
}

function shouldDecorateLine(state, lineInfo) {
  const densityBias =
    state.context.density === 'dense' ? 2 :
    state.context.density === 'medium' ? 1 :
    0;

  const threshold = clamp(
    Math.max(1, 4 - lineInfo.influenceBucket - densityBias),
    1,
    6
  );

  return lineInfo.influenceBucket > 0 && lineInfo.index % threshold === 0;
}

/* ==========================================================================
   12. Scaffold
   ========================================================================== */

function shouldShowScaffold(el, config) {
  return el.matches(config.scaffoldSelector);
}

function createScaffoldRoot() {
  const root = document.createElement('div');
  root.className = 'pretext-flow-scaffold';
  root.setAttribute('aria-hidden', 'true');
  return root;
}

function updateScaffold(state) {
  if (!state.dom.scaffoldRoot) return;

  const summary = {
    preset: state.config.preset,
    kind: state.context.kind,
    density: state.context.density,
    measure: state.context.measureProfile,
    projection: state.context.projectionFamily,
    ornament: state.context.ornamentFamily,
    mode: state.interaction.mode,
    influence: state.interaction.influenceBucket,
    widthClass: state.measurement.widthClass,
    wrap: state.measurement.wrapVolatility,
    width: Math.round(state.measurement.projectedWidth),
    phase: state.rhythm.phase,
    beat: state.rhythm.beat
  };

  const override = runChannels('scaffold', null, { state, summary }, state.config);

  state.dom.scaffoldRoot.textContent =
    typeof override === 'string'
      ? override
      : [
          `preset:${summary.preset}`,
          `kind:${summary.kind}`,
          `density:${summary.density}`,
          `measure:${summary.measure}`,
          `projection:${summary.projection}`,
          `ornament:${summary.ornament}`,
          `mode:${summary.mode}`,
          `influence:${summary.influence}`,
          `width:${summary.width}px`,
          `wrap:${summary.wrap}`,
          `phase:${summary.phase}`,
          `beat:${summary.beat}`
        ].join(' · ');
}

/* ==========================================================================
   13. Surface sync
   ========================================================================== */

function syncSurfaceState(state) {
  const { el, context, interaction, measurement, rhythm } = state;

  el.dataset.textKind = context.kind;
  el.dataset.textDensity = context.density;
  el.dataset.textMeasure = context.measureProfile;
  el.dataset.textProjection = context.projectionFamily;
  el.dataset.textOrnament = context.ornamentFamily;
  el.dataset.textMode = interaction.mode;
  el.dataset.textInfluence = String(interaction.influenceBucket);
  el.dataset.textDirection = String(interaction.direction);
  el.dataset.textWidthClass = measurement.widthClass;
  el.dataset.textWrap = measurement.wrapVolatility;
  el.dataset.textPhase = String(rhythm.phase);
  el.dataset.textBeat = String(rhythm.beat);
  el.dataset.textPlaying = rhythm.playing ? 'on' : 'off';

  el.dataset.spwPretextPreset = state.config.preset;
  el.dataset.spwPretextGenre = context.kind;
  el.dataset.spwPretextDensity = context.density;
  el.dataset.spwPretextMeasure = context.measureProfile;
  el.dataset.spwPretextProjection = context.projectionFamily;
  el.dataset.spwPretextOrnament = context.ornamentFamily;
  el.dataset.spwPretextWidthClass = measurement.widthClass;
  el.dataset.spwPretextInfluence = String(interaction.influenceBucket);
  el.dataset.spwPretextMode = interaction.mode;

  el.style.setProperty('--pretext-canonical-width', `${measurement.canonicalWidth}px`);
  el.style.setProperty('--pretext-projected-width', `${measurement.projectedWidth}px`);
  el.style.setProperty('--pretext-influence', `${interaction.influence}`);
  el.style.setProperty('--pretext-direction', `${interaction.direction}`);
  el.style.setProperty('--pretext-beat', `${rhythm.beat}`);
  el.style.setProperty('--pretext-measure', `${rhythm.measure}`);
  el.style.setProperty('--pretext-bpm', `${rhythm.bpm}`);
}

/* ==========================================================================
   14. Interaction / projection
   ========================================================================== */

function onPointerMove(event) {
  RUNTIME.pointer.active = true;
  RUNTIME.pointer.x = event.clientX;
  RUNTIME.pointer.y = event.clientY;

  if (RUNTIME.pointerRaf) return;
  RUNTIME.pointerRaf = requestAnimationFrame(runPointerFrame);
}

function runPointerFrame() {
  RUNTIME.pointerRaf = 0;
  const { x, y } = RUNTIME.pointer;

  RUNTIME.instances.forEach((state) => {
    if (!state.interaction.visible) return;
    const proposal = createAmbientProposal(state, x, y);
    applyProjectionProposal(state, proposal);
  });
}

function createAmbientProposal(state, pointerX, pointerY) {
  const rect = state.el.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const inField =
    absDx < state.config.pointerFieldX &&
    absDy < state.config.pointerFieldY;

  if (!inField) {
    return {
      width: state.measurement.canonicalWidth,
      influence: 0,
      direction: 0,
      mode: 'settling',
      source: 'pointer'
    };
  }

  const influenceX = 1 - (absDx / state.config.pointerFieldX);
  const influenceY = 1 - (absDy / state.config.pointerFieldY);
  const influence = clamp(Math.min(influenceX, influenceY), 0, 1);
  const direction = dx === 0 ? 0 : dx > 0 ? 1 : -1;

  const targetWidth =
    absDx < state.config.centerSnapPx
      ? state.measurement.canonicalWidth
      : state.measurement.canonicalWidth + (direction * influence * state.config.approachRangePx);

  return {
    width: targetWidth,
    influence,
    direction,
    mode: 'approach',
    source: 'pointer'
  };
}

function applyProjectionProposal(state, proposal) {
  const baseProposal = {
    width: proposal.width,
    influence: proposal.influence ?? state.interaction.influence,
    direction: proposal.direction ?? state.interaction.direction,
    mode: proposal.mode || state.interaction.mode,
    source: proposal.source || 'unknown',
    force: Boolean(proposal.force)
  };

  const tuned = runChannels('project', baseProposal, { state }, state.config);
  projectWidth(state, tuned.width, tuned);
}

function projectWidth(state, width, meta = {}) {
  const nextWidth = clamp(
    quantize(width, state.measurement.widthStepPx),
    state.config.minWidthPx,
    state.config.maxWidthPx
  );

  const widthChanged = Math.abs(nextWidth - state.measurement.projectedWidth) >= state.measurement.widthStepPx;
  const modeChanged = meta.mode && meta.mode !== state.interaction.mode;
  const force = Boolean(meta.force);

  state.interaction.mode = meta.mode || state.interaction.mode;
  state.interaction.influence = clamp(meta.influence ?? state.interaction.influence, 0, 1);
  state.interaction.influenceBucket = quantizeInfluence(state.interaction.influence);
  state.interaction.direction = meta.direction ?? state.interaction.direction;
  state.interaction.source = meta.source || state.interaction.source;

  if (!widthChanged && !modeChanged && !force) {
    syncSurfaceState(state);
    updateScaffold(state);
    return;
  }

  state.measurement.projectedWidth = nextWidth;
  renderProjectedLines(state, nextWidth);
}

/* ==========================================================================
   15. Resize / intersection / settle
   ========================================================================== */

function onResize(entries) {
  entries.forEach(({ target }) => {
    const state = RUNTIME.byElement.get(target);
    if (!state) return;
    refreshCanonicalWidth(state);
  });
}

function onIntersection(entries) {
  entries.forEach((entry) => {
    const state = RUNTIME.byElement.get(entry.target);
    if (!state) return;
    state.interaction.visible = entry.isIntersecting || entry.intersectionRatio > 0;
  });
}

function onWindowResize() {
  RUNTIME.instances.forEach(refreshCanonicalWidth);
}

function settleAllInstances() {
  RUNTIME.instances.forEach((state) => {
    applyProjectionProposal(state, {
      width: state.measurement.canonicalWidth,
      influence: 0,
      direction: 0,
      mode: 'settling',
      source: 'window-blur',
      force: true
    });
  });
}

/* ==========================================================================
   16. Rhythm
   ========================================================================== */

function onRhythmPulse(event) {
  const beat = Number(event?.detail?.beat || 0);
  const measure = Number(event?.detail?.measure ?? RUNTIME.rhythm.measure);

  RUNTIME.rhythm.beat = beat;
  RUNTIME.rhythm.measure = measure;

  RUNTIME.instances.forEach((state) => {
    state.rhythm.beat = beat;
    state.rhythm.measure = measure;

    if (
      state.config.rhythmPulseAffectsOnlyResting &&
      state.interaction.mode === 'projecting'
    ) {
      syncSurfaceState(state);
      updateScaffold(state);
      return;
    }

    applyRhythmPulse(state);
  });
}

function onRhythmPhase(event) {
  const phase = event?.detail?.phase || 'ambient';
  if (!RUNTIME.config.phaseProfiles[phase]) return;

  RUNTIME.rhythm.phase = phase;

  RUNTIME.instances.forEach((state) => {
    state.rhythm.phase = phase;
    syncSurfaceState(state);
    updateScaffold(state);
  });
}

function onRhythmMeasure(event) {
  const measure = Number(event?.detail?.measure ?? RUNTIME.rhythm.measure);
  RUNTIME.rhythm.measure = measure;
  RUNTIME.instances.forEach((state) => {
    state.rhythm.measure = measure;
    syncSurfaceState(state);
    updateScaffold(state);
  });
}

function onRhythmTempo(event) {
  const bpm = Number(event?.detail?.bpm || RUNTIME.rhythm.bpm);
  RUNTIME.rhythm.bpm = bpm;
  RUNTIME.instances.forEach((state) => {
    state.rhythm.bpm = bpm;
    syncSurfaceState(state);
    updateScaffold(state);
  });
}

function onRhythmStart() {
  RUNTIME.rhythm.playing = true;
  RUNTIME.instances.forEach((state) => {
    state.rhythm.playing = true;
    syncSurfaceState(state);
    updateScaffold(state);
  });
}

function onRhythmStop() {
  RUNTIME.rhythm.playing = false;
  RUNTIME.instances.forEach((state) => {
    state.rhythm.playing = false;
    syncSurfaceState(state);
    updateScaffold(state);
  });
}

function onRhythmReset() {
  RUNTIME.rhythm.beat = 0;
  RUNTIME.rhythm.measure = 0;
  RUNTIME.instances.forEach((state) => {
    state.rhythm.beat = 0;
    state.rhythm.measure = 0;
    syncSurfaceState(state);
    updateScaffold(state);
  });
}

function applyRhythmPulse(state) {
  const profile = state.config.phaseProfiles[state.rhythm.phase] || state.config.phaseProfiles.ambient;
  const beatInMeasure = ((Math.max(state.rhythm.beat, 1) - 1) % 4) + 1;

  const beatAccent =
    beatInMeasure === 1 ? 1 :
    beatInMeasure === 3 ? 0.65 :
    0.35;

  const influence = clamp((profile.pulse ?? 0.5) * beatAccent, 0, 1);
  const width = state.measurement.canonicalWidth * (profile.widthScale || 1);

  applyProjectionProposal(state, {
    width,
    influence,
    direction: 0,
    mode: state.interaction.mode === 'projecting' ? 'projecting' : 'approach',
    source: 'rhythm'
  });
}

/* ==========================================================================
   17. Channel runner
   ========================================================================== */

function runChannels(name, baseValue, meta, config) {
  let next = baseValue;

  const explicit = config.channels?.[name];
  if (typeof explicit === 'function') {
    next = explicit(next, meta) || next;
  }

  const registered = CHANNELS[name];
  if (registered) {
    for (const fn of registered.values()) {
      next = fn(next, meta) || next;
    }
  }

  return next;
}

/* ==========================================================================
   18. Utilities
   ========================================================================== */

function getSourceText(el) {
  return (el.dataset.spwText || el.textContent || '').trim();
}

function readFontProfile(computed) {
  const fontSizePx = parsePx(computed.fontSize, 16);
  const lineHeightPx = parseLineHeight(computed.lineHeight, fontSizePx, DEFAULTS.defaultLineHeightPx);
  const fontFamily = computed.fontFamily || 'JetBrains Mono, monospace';

  return {
    fontFamily,
    fontSizePx,
    lineHeightPx,
    averageAdvancePxGuess: fontSizePx * 0.62,
    fontShorthand: computed.font || `${fontSizePx}px ${fontFamily}`
  };
}

function readOperatorContext(el) {
  return el.closest('.site-frame')?.dataset.spwOperator || FALLBACK_OPERATOR;
}

function classifyWidthClass(width) {
  if (width < 220) return 'xs';
  if (width < 340) return 'sm';
  if (width < 520) return 'md';
  if (width < 720) return 'lg';
  return 'xl';
}

function widthKey(width, step) {
  return String(quantize(width, step));
}

function quantize(value, step) {
  return Math.round(value / step) * step;
}

function quantizeInfluence(value) {
  let bucket = 0;
  INFLUENCE_BUCKETS.forEach((threshold, index) => {
    if (value >= threshold) bucket = index;
  });
  return bucket;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parsePx(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseLineHeight(value, fontSizePx, fallback) {
  if (!value || value === 'normal') {
    return Math.round(fontSizePx * 1.55);
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;

  return value.endsWith('px')
    ? parsed
    : Math.round(parsed * fontSizePx);
}

function normalizeText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function humanize(value = '') {
  return normalizeText(value).replace(/[_-]+/g, ' ').toLowerCase();
}