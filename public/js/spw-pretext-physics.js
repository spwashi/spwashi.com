/**
 * spw-pretext-physics.js
 * ---------------------------------------------------------------------------
 * Pretext Physics Runtime
 *
 * Goals
 * - Treat text projection as a measurable layout system.
 * - Keep runtime bounded and composable.
 * - Prefer semantic context from markup over class-only inference.
 * - Make genre physics extensible via classify/project/decorate/scaffold hooks.
 */

import { loadPretext } from '../legacy/pretext-utils.js';
import { bus } from './spw-bus.js';

const DEFAULTS = Object.freeze({
  root: document,
  selector: '[data-spw-flow="pretext"]',
  scaffoldSelector: '[data-spw-pretext-scaffold], [data-spw-debug~="pretext"]',

  pointerFieldX: 520,
  pointerFieldY: 260,
  centerSnapPx: 12,
  approachRangePx: 120,
  projectDxMultiplier: 1.3,

  minWidthPx: 140,
  maxWidthPx: 960,
  defaultLineHeightPx: 24,
  widthStepPx: 12,

  asyncLayout: true,
  schedulerPriority: 'user-visible',

  ornamentEnabled: true,
  rhythmEnabled: true,
  rhythmPulseAffectsOnlyResting: true,

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

const INFLUENCE_BUCKETS = Object.freeze([0, 0.2, 0.4, 0.6, 0.8, 1]);
const FALLBACK_OPERATOR = '?';

const RUNTIME = {
  pretextPromise: null,
  pretext: null,

  instances: new Set(),
  byElement: new WeakMap(),

  listenersAttached: false,
  resizeObserver: null,
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

export async function initPretextPhysics(options = {}) {
  const config = mergeConfig(options);
  const root = options.root || config.root || document;
  const targets = [...root.querySelectorAll(config.selector)];

  if (!targets.length) {
    return () => {};
  }

  try {
    const pretext = await ensurePretext();
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const mounted = targets
      .filter((el) => !RUNTIME.byElement.has(el))
      .map((el) => mountInstance(el, pretext, config));

    ensureRuntimeListeners(config);

    return () => {
      mounted.forEach(unmountInstance);
      teardownRuntimeIfIdle();
    };
  } catch (error) {
    console.warn('[Pretext] Failed to initialize.', error);
    return () => {};
  }
}

function mergeConfig(options) {
  return {
    ...DEFAULTS,
    ...options,
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

async function ensurePretext() {
  if (!RUNTIME.pretextPromise) {
    RUNTIME.pretextPromise = loadPretext();
  }

  RUNTIME.pretext = RUNTIME.pretext || (await RUNTIME.pretextPromise);
  return RUNTIME.pretext;
}

function ensureRuntimeListeners(config) {
  if (RUNTIME.listenersAttached) return;

  RUNTIME.config = config;

  document.body.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('blur', settleAllInstances);

  document.addEventListener('spw:brace:charge-start', onBraceChargeStart);
  document.addEventListener('spw:brace:discharge', onBraceDischarge);
  document.addEventListener('spw:brace:activate', onBraceActivate);
  document.addEventListener('spw:brace:project-move', onBraceProjectMove);
  document.addEventListener('spw:brace:project-end', onBraceProjectEnd);

  if ('ResizeObserver' in window) {
    RUNTIME.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(({ target }) => {
        const state = RUNTIME.byElement.get(target);
        if (!state) return;
        refreshCanonicalWidth(state);
      });
    });
  } else {
    window.addEventListener('resize', onWindowResize, { passive: true });
  }

  if (config.rhythmEnabled) {
    attachRhythmListeners();
  }

  RUNTIME.listenersAttached = true;
}

function teardownRuntimeIfIdle() {
  if (!RUNTIME.listenersAttached) return;
  if (RUNTIME.instances.size) return;

  document.body.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('blur', settleAllInstances);

  document.removeEventListener('spw:brace:charge-start', onBraceChargeStart);
  document.removeEventListener('spw:brace:discharge', onBraceDischarge);
  document.removeEventListener('spw:brace:activate', onBraceActivate);
  document.removeEventListener('spw:brace:project-move', onBraceProjectMove);
  document.removeEventListener('spw:brace:project-end', onBraceProjectEnd);

  window.removeEventListener('resize', onWindowResize);

  if (RUNTIME.pointerRaf) {
    cancelAnimationFrame(RUNTIME.pointerRaf);
    RUNTIME.pointerRaf = 0;
  }

  RUNTIME.resizeObserver?.disconnect();
  RUNTIME.resizeObserver = null;

  detachRhythmListeners();

  RUNTIME.listenersAttached = false;
}

function attachRhythmListeners() {
  detachRhythmListeners();

  RUNTIME.unsubs.push(
    bus.on('rhythm:pulse', onRhythmPulse),
    bus.on('rhythm:phase', onRhythmPhase),
    bus.on('rhythm:measure', onRhythmMeasure),
    bus.on('rhythm:tempo', onRhythmTempo),
    bus.on('rhythm:start', onRhythmStart),
    bus.on('rhythm:stop', onRhythmStop),
    bus.on('rhythm:reset', onRhythmReset),
    bus.on('stream:pulse', onRhythmPulse),
    bus.on('stream:phase', onRhythmPhase)
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

function mountInstance(el, pretext, config) {
  const text = getSourceText(el);
  const computed = getComputedStyle(el);
  const font = readFontProfile(computed);
  const anatomy = analyzeText(text);
  const semanticContext = resolveSemanticContext(el);

  const baseContext = classifyTextContext({
    el,
    text,
    anatomy,
    font,
    semanticContext,
    config
  });

  const context = applyClassifyChannel(baseContext, config.channels.classify, {
    el,
    text,
    anatomy,
    font,
    semanticContext,
    config
  });

  const prepared = pretext.prepareWithSegments(text, font.fontShorthand, {
    whiteSpace: 'normal'
  });

  const linesRoot = document.createElement('div');
  linesRoot.className = 'pretext-flow-lines';

  const scaffoldRoot = shouldShowScaffold(el, config)
    ? createScaffoldRoot()
    : null;

  el.replaceChildren(linesRoot, ...(scaffoldRoot ? [scaffoldRoot] : []));

  const canonicalWidth = guessCanonicalWidth(el, anatomy, font, context, config);

  const state = {
    el,
    pretext,
    config,

    substrate: {
      text,
      prepared,
      font,
      lineHeightPx: context.lineHeightPx || font.lineHeightPx || config.defaultLineHeightPx
    },

    anatomy,
    semanticContext,

    context: {
      ...context,
      baseMeasure: context.measureProfile,
      rhythmMeasure: context.measureProfile
    },

    measurement: {
      canonicalWidth,
      projectedWidth: canonicalWidth,
      widthStepPx: context.widthStepPx || config.widthStepPx,
      widthClass: classifyWidthClass(canonicalWidth),
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
      source: 'none'
    },

    rhythm: {
      phase: RUNTIME.rhythm.phase,
      beat: RUNTIME.rhythm.beat,
      measure: RUNTIME.rhythm.measure,
      bpm: RUNTIME.rhythm.bpm,
      playing: RUNTIME.rhythm.playing
    },

    ornament: {
      enabled: Boolean(config.ornamentEnabled && context.ornamentFamily !== 'none'),
      family: context.ornamentFamily
    },

    dom: {
      linesRoot,
      scaffoldRoot,
      lineNodes: []
    },

    channels: {
      classify: config.channels.classify,
      project: config.channels.project,
      decorate: config.channels.decorate,
      scaffold: config.channels.scaffold
    }
  };

  RUNTIME.byElement.set(el, state);
  RUNTIME.instances.add(state);
  RUNTIME.resizeObserver?.observe(el);

  const canonicalLayout = getOrMeasureLayoutSync(state, canonicalWidth);
  state.measurement.canonicalKey = widthKey(canonicalWidth, state.measurement.widthStepPx);
  state.measurement.canonicalLines = canonicalLayout.lines.length;

  patchRenderedLines(state, canonicalLayout, canonicalWidth);
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
}

function getSourceText(el) {
  return (el.dataset.spwText || el.innerText || '').trim();
}

function readFontProfile(computed) {
  const fontSizePx = parsePx(computed.fontSize, 16);
  const lineHeightPx = parseLineHeight(computed.lineHeight, fontSizePx, DEFAULTS.defaultLineHeightPx);
  const fontFamily = computed.fontFamily || 'JetBrains Mono, monospace';

  return {
    fontFamily,
    fontSizePx,
    lineHeightPx,
    isMonospaceHint: /jetbrains mono|monospace/i.test(fontFamily),
    averageAdvancePxGuess: fontSizePx * 0.62,
    fontShorthand: computed.font || `${fontSizePx}px ${fontFamily}`
  };
}

function analyzeText(text) {
  const words = text.match(/\b[\w'-]+\b/g) || [];
  const operators = text.match(/[~@^?!*=&$%|:#<>]+/g) || [];
  const punctuation = text.match(/[.,;:!?()[\]{}'"`-]/g) || [];
  const uppercase = text.match(/[A-Z]/g) || [];
  const numerals = text.match(/\d/g) || [];
  const lineBreaks = text.match(/\n/g) || [];
  const chars = text.length || 0;

  return {
    chars,
    words: words.length,
    averageWordLength: words.length ? words.join('').length / words.length : 0,
    operatorsCount: operators.join('').length,
    punctuationCount: punctuation.length,
    uppercaseCount: uppercase.length,
    numeralsCount: numerals.length,
    lineBreakCount: lineBreaks.length,
    whitespaceRatio: chars ? ((text.match(/\s/g) || []).length / chars) : 0,
    operatorDensity: chars ? (operators.join('').length / chars) : 0,
    punctuationDensity: chars ? (punctuation.length / chars) : 0,
    uppercaseDensity: chars ? (uppercase.length / chars) : 0,
    questionDensity: chars ? ((text.match(/\?/g) || []).length / chars) : 0
  };
}

function resolveSemanticContext(el) {
  const nearestArticle = el.closest('article');
  const nearestSection = el.closest('section');
  const nearestFigure = el.closest('figure');
  const nearestNav = el.closest('nav');
  const nearestFrame = el.closest('.site-frame');
  const labelledContainer = el.closest('[aria-labelledby]');
  const headingId = labelledContainer?.getAttribute('aria-labelledby')?.split(/\s+/)[0];
  const heading = headingId ? document.getElementById(headingId) : null;

  const headingText = normalizeText(
    heading?.textContent ||
    nearestArticle?.querySelector('h1, h2, h3, h4')?.textContent ||
    nearestSection?.querySelector('h1, h2, h3, h4')?.textContent ||
    nearestFigure?.querySelector('figcaption')?.textContent ||
    ''
  );

  const scopeType =
    nearestFigure ? 'figure' :
    nearestArticle ? 'article' :
    nearestNav ? 'nav' :
    nearestSection ? 'section' :
    'ambient';

  const semanticGenre =
    el.dataset.spwGenre ||
    labelledContainer?.dataset.spwGenre ||
    inferGenreFromStructure(el, {
      headingText,
      scopeType,
      nearestArticle,
      nearestSection,
      nearestFigure,
      nearestNav,
      nearestFrame
    });

  return {
    scopeType,
    headingText,
    semanticGenre,
    nearestArticle,
    nearestSection,
    nearestFigure,
    nearestNav,
    nearestFrame
  };
}

function inferGenreFromStructure(el, context) {
  const haystack = humanize([
    context.headingText,
    context.nearestFrame?.dataset.spwRole,
    context.nearestSection?.dataset.spwRole,
    context.nearestArticle?.dataset.spwRole,
    el.dataset.textKind,
    el.textContent
  ].filter(Boolean).join(' '));

  if (context.scopeType === 'figure') return 'figure-caption';
  if (/operator|syntax|grammar|spec|normaliz|binding|probe|frame|layer|surface/.test(haystack)) return 'operator-spec';
  if (/session|arc|cast|world|play|rpg/.test(haystack)) return 'session-log';
  if (/register|index|routes|atlas/.test(haystack)) return 'registry';
  if (/prompt|spell|invocation/.test(haystack)) return 'prompt-block';
  return 'editorial';
}

function classifyTextContext({ el, anatomy, font, semanticContext, config }) {
  const explicitKind = el.dataset.textKind || '';
  const explicitMeasure = el.dataset.textMeasure || '';
  const explicitProjection = el.dataset.textProjection || '';
  const explicitOrnament = el.dataset.textOrnament || '';

  const kind = explicitKind || selectTextKind(anatomy, semanticContext);
  const density = selectDensity(anatomy, semanticContext);
  const measureProfile = explicitMeasure || selectMeasureProfile(anatomy, font, semanticContext);
  const projectionFamily = explicitProjection || selectProjectionFamily(kind, anatomy, semanticContext);
  const ornamentFamily = explicitOrnament || selectOrnamentFamily(kind, anatomy, semanticContext);

  return {
    kind,
    density,
    measureProfile,
    projectionFamily,
    ornamentFamily,
    widthStepPx: selectWidthStep(measureProfile, config),
    lineHeightPx: selectLineHeight(font, kind),
    semanticGenre: semanticContext.semanticGenre
  };
}

function selectTextKind(anatomy, semanticContext) {
  if (semanticContext.semanticGenre === 'operator-spec') return 'operator-dense';
  if (semanticContext.semanticGenre === 'session-log') return 'ledger';
  if (semanticContext.semanticGenre === 'figure-caption') return 'caption';
  if (semanticContext.semanticGenre === 'prompt-block') return 'invocation';
  if (anatomy.operatorDensity > 0.08) return 'operator-dense';
  if (anatomy.questionDensity > 0.02) return 'question';
  if (anatomy.lineBreakCount >= 2) return 'ledger';
  if (anatomy.words <= 8) return 'caption';
  if (anatomy.words > 24 && anatomy.punctuationDensity < 0.03) return 'invocation';
  return 'prose';
}

function selectDensity(anatomy, semanticContext) {
  let load =
    anatomy.operatorDensity * 2.4 +
    anatomy.punctuationDensity * 1.6 +
    anatomy.uppercaseDensity * 1.2 +
    Math.min(anatomy.words / 120, 1);

  if (semanticContext.semanticGenre === 'operator-spec') load += 0.25;
  if (semanticContext.semanticGenre === 'figure-caption') load -= 0.2;

  if (load > 1.45) return 'compressed';
  if (load > 1.05) return 'dense';
  if (load > 0.65) return 'medium';
  return 'soft';
}

function selectMeasureProfile(anatomy, font, semanticContext) {
  if (semanticContext.semanticGenre === 'figure-caption') return 'tight';
  if (semanticContext.semanticGenre === 'session-log') return 'elastic';
  if (semanticContext.semanticGenre === 'registry') return 'wide';
  if (anatomy.words <= 8) return 'tight';
  if (anatomy.operatorDensity > 0.08) return 'elastic';
  if (font.isMonospaceHint && anatomy.words > 48) return 'wide';
  return 'standard';
}

function selectProjectionFamily(kind, anatomy, semanticContext) {
  if (semanticContext.semanticGenre === 'registry') return 'indent';
  if (semanticContext.semanticGenre === 'prompt-block') return 'pulse';
  if (kind === 'operator-dense') return 'expand';
  if (kind === 'question') return 'lean';
  if (kind === 'caption') return 'pulse';
  if (anatomy.lineBreakCount >= 2) return 'indent';
  return 'expand';
}

function selectOrnamentFamily(kind, anatomy, semanticContext) {
  if (semanticContext.semanticGenre === 'operator-spec') return 'sigil-edge';
  if (semanticContext.semanticGenre === 'prompt-block') return 'echo';
  if (kind === 'operator-dense') return 'sigil-edge';
  if (kind === 'question') return 'echo';
  if (anatomy.operatorDensity > 0.04) return 'staged';
  return 'none';
}

function selectWidthStep(measureProfile, config) {
  if (measureProfile === 'elastic') return 8;
  if (measureProfile === 'tight') return 10;
  if (measureProfile === 'wide') return 16;
  return config.widthStepPx;
}

function selectLineHeight(font, kind) {
  if (kind === 'caption') return Math.round(font.fontSizePx * 1.4);
  if (kind === 'ledger') return Math.round(font.fontSizePx * 1.65);
  return font.lineHeightPx;
}

function applyClassifyChannel(baseContext, classifyChannel, meta) {
  if (typeof classifyChannel !== 'function') return baseContext;
  return classifyChannel(baseContext, meta) || baseContext;
}

function guessCanonicalWidth(el, anatomy, font, context, config) {
  const measured = Math.max(el.clientWidth || 0, el.offsetWidth || 0);
  const estimated = estimateWidthFromText(anatomy, font, context);
  const candidate = measured || estimated || 400;
  return clamp(candidate, config.minWidthPx, config.maxWidthPx);
}

function estimateWidthFromText(anatomy, font, context) {
  const charsPerLine =
    context.measureProfile === 'tight' ? 24 :
    context.measureProfile === 'wide' ? 68 :
    context.measureProfile === 'elastic' ? 44 :
    54;

  return Math.round(charsPerLine * font.averageAdvancePxGuess);
}

function refreshCanonicalWidth(state) {
  const next = guessCanonicalWidth(
    state.el,
    state.anatomy,
    state.substrate.font,
    state.context,
    state.config
  );

  if (Math.abs(next - state.measurement.canonicalWidth) < state.measurement.widthStepPx) {
    return;
  }

  state.measurement.canonicalWidth = next;
  state.measurement.widthClass = classifyWidthClass(next);
  state.measurement.cache.clear();
  state.measurement.canonicalKey = null;
  state.measurement.canonicalLines = 0;

  if (state.interaction.mode === 'resting' || state.interaction.mode === 'settling') {
    applyProjectionProposal(state, {
      width: next,
      influence: 0,
      direction: 0,
      mode: 'resting',
      source: 'resize',
      force: true
    });
  } else {
    syncSurfaceState(state);
    updateScaffold(state);
  }
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

function updateWrapVolatility(state, lineCount) {
  const canonical = state.measurement.canonicalLines || lineCount;
  const diff = Math.abs(lineCount - canonical);

  state.measurement.wrapVolatility =
    diff >= 4 ? 'volatile' :
    diff >= 2 ? 'responsive' :
    'stable';
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
      mode: state.interaction.mode === 'projecting' ? 'projecting' : 'settling',
      source: 'pointer'
    };
  }

  const influenceX = 1 - (absDx / state.config.pointerFieldX);
  const influenceY = 1 - (absDy / state.config.pointerFieldY);
  const influence = clamp(Math.min(influenceX, influenceY), 0, 1);
  const direction = dx === 0 ? 0 : dx > 0 ? 1 : -1;

  const targetWidth = absDx < state.config.centerSnapPx
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

function onBraceChargeStart(event) {
  const state = resolveStateFromEvent(event);
  if (!state) return;

  applyProjectionProposal(state, {
    width: state.measurement.projectedWidth,
    influence: Math.max(state.interaction.influence, 0.35),
    direction: state.interaction.direction || 0,
    mode: 'approach',
    source: 'brace-charge'
  });
}

function onBraceActivate(event) {
  const state = resolveStateFromEvent(event);
  if (!state) return;

  const width = state.measurement.canonicalWidth * 1.18;

  applyProjectionProposal(state, {
    width,
    influence: 1,
    direction: 0,
    mode: 'contact',
    source: 'brace-activate',
    force: true
  });

  window.setTimeout(() => {
    if (!RUNTIME.instances.has(state)) return;
    applyProjectionProposal(state, {
      width: state.measurement.canonicalWidth,
      influence: 0,
      direction: 0,
      mode: 'settling',
      source: 'brace-activate-settle',
      force: true
    });
  }, 180);
}

function onBraceProjectMove(event) {
  const state = resolveStateFromEvent(event);
  if (!state) return;

  const dx = Number(event.detail?.dx || 0);
  const distance = Number(event.detail?.distance || 0);
  const width = Math.max(
    state.config.minWidthPx,
    state.measurement.canonicalWidth + (dx * state.config.projectDxMultiplier)
  );

  applyProjectionProposal(state, {
    width,
    influence: clamp(distance / 160, 0, 1),
    direction: dx === 0 ? 0 : dx > 0 ? 1 : -1,
    mode: 'projecting',
    source: 'brace-project'
  });
}

function onBraceProjectEnd(event) {
  const state = resolveStateFromEvent(event);
  if (!state) return;

  applyProjectionProposal(state, {
    width: state.measurement.canonicalWidth,
    influence: 0,
    direction: 0,
    mode: 'settling',
    source: 'brace-project-end',
    force: true
  });
}

function onBraceDischarge(event) {
  const state = resolveStateFromEvent(event);
  if (!state) return;

  applyProjectionProposal(state, {
    width: state.measurement.canonicalWidth,
    influence: 0,
    direction: 0,
    mode: 'settling',
    source: 'brace-discharge',
    force: true
  });
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

function onWindowResize() {
  RUNTIME.instances.forEach(refreshCanonicalWidth);
}

function resolveStateFromEvent(event) {
  const origin =
    (event.target instanceof Element && event.target) ||
    (event.detail?.target instanceof Element && event.detail.target) ||
    null;

  if (!origin) return null;

  const flowEl =
    origin.matches?.(DEFAULTS.selector)
      ? origin
      : origin.querySelector?.(DEFAULTS.selector) || origin.closest?.(DEFAULTS.selector);

  return flowEl ? RUNTIME.byElement.get(flowEl) : null;
}

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
    applyRhythmicContext(state, phase);
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

function applyRhythmicContext(state, phase) {
  const profile = state.config.phaseProfiles[phase] || state.config.phaseProfiles.ambient;
  state.context.rhythmMeasure = profile.measure || state.context.baseMeasure;
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

function applyProjectionProposal(state, proposal) {
  const baseProposal = {
    width: proposal.width,
    influence: proposal.influence ?? state.interaction.influence,
    direction: proposal.direction ?? state.interaction.direction,
    mode: proposal.mode || state.interaction.mode,
    source: proposal.source || 'unknown',
    force: Boolean(proposal.force)
  };

  const tuned = typeof state.channels.project === 'function'
    ? (state.channels.project(baseProposal, state) || baseProposal)
    : baseProposal;

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
      phase: state.rhythm.phase,
      measure: state.rhythm.measure,
      bpm: state.rhythm.bpm,
      playing: state.rhythm.playing
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
  if (!state.ornament.enabled) {
    return { before: '', after: '', className: '' };
  }

  if (typeof state.channels.decorate === 'function') {
    return state.channels.decorate(lineInfo, state) || { before: '', after: '', className: '' };
  }

  if (!shouldDecorateLine(state, lineInfo)) {
    return { before: '', after: '', className: '' };
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
      return { before: '', after: '', className: '' };
  }
}

function shouldDecorateLine(state, lineInfo) {
  const densityBias =
    state.context.density === 'compressed' ? 3 :
    state.context.density === 'dense' ? 2 :
    1;

  const phaseBias =
    lineInfo.phase === 'drop' ? 1 :
    lineInfo.phase === 'chorus' ? 0 :
    -1;

  const beatBias =
    lineInfo.beat % 4 === 1 ? 1 :
    lineInfo.beat % 2 === 1 ? 0 :
    -1;

  const threshold = clamp(
    Math.max(1, 5 - lineInfo.influenceBucket - densityBias - phaseBias - beatBias),
    1,
    6
  );

  return lineInfo.influenceBucket > 0 && lineInfo.index % threshold === 0;
}

function createScaffoldRoot() {
  const root = document.createElement('div');
  root.className = 'pretext-flow-scaffold';
  root.setAttribute('aria-hidden', 'true');
  return root;
}

function shouldShowScaffold(el, config) {
  return el.matches(config.scaffoldSelector);
}

function updateScaffold(state) {
  if (!state.dom.scaffoldRoot) return;

  const summary = {
    kind: state.context.kind,
    density: state.context.density,
    measure: state.context.measureProfile,
    rhythmMeasure: state.context.rhythmMeasure,
    projection: state.context.projectionFamily,
    ornament: state.context.ornamentFamily,
    genre: state.context.semanticGenre,
    scope: state.semanticContext.scopeType,
    mode: state.interaction.mode,
    influence: state.interaction.influenceBucket,
    widthClass: state.measurement.widthClass,
    wrap: state.measurement.wrapVolatility,
    canonicalWidth: state.measurement.canonicalWidth,
    projectedWidth: state.measurement.projectedWidth,
    cacheEntries: state.measurement.cache.size,
    phase: state.rhythm.phase,
    beat: state.rhythm.beat,
    measureCount: state.rhythm.measure,
    bpm: state.rhythm.bpm,
    playing: state.rhythm.playing,
    token: state.measurement.appliedToken
  };

  const override = typeof state.channels.scaffold === 'function'
    ? state.channels.scaffold(summary, state)
    : null;

  state.dom.scaffoldRoot.textContent =
    typeof override === 'string'
      ? override
      : [
          `kind:${summary.kind}`,
          `genre:${summary.genre}`,
          `scope:${summary.scope}`,
          `density:${summary.density}`,
          `measure:${summary.measure}`,
          `r-measure:${summary.rhythmMeasure}`,
          `projection:${summary.projection}`,
          `mode:${summary.mode}`,
          `phase:${summary.phase}`,
          `beat:${summary.beat}`,
          `bar:${summary.measureCount}`,
          `bpm:${summary.bpm}`,
          `play:${summary.playing ? 'on' : 'off'}`,
          `width:${summary.projectedWidth}px`,
          `cache:${summary.cacheEntries}`,
          `wrap:${summary.wrap}`
        ].join(' · ');
}

function syncSurfaceState(state) {
  const { el, context, interaction, measurement, rhythm, semanticContext } = state;

  el.dataset.textKind = context.kind;
  el.dataset.textDensity = context.density;
  el.dataset.textMeasure = context.measureProfile;
  el.dataset.textRhythmMeasure = context.rhythmMeasure;
  el.dataset.textProjection = context.projectionFamily;
  el.dataset.textOrnament = context.ornamentFamily;
  el.dataset.textGenre = context.semanticGenre;
  el.dataset.textScope = semanticContext.scopeType;

  el.dataset.textMode = interaction.mode;
  el.dataset.textInfluence = String(interaction.influenceBucket);
  el.dataset.textDirection = String(interaction.direction);
  el.dataset.textWidthClass = measurement.widthClass;
  el.dataset.textWrap = measurement.wrapVolatility;

  el.dataset.textPhase = String(rhythm.phase);
  el.dataset.textBeat = String(rhythm.beat);
  el.dataset.textMeasureCount = String(rhythm.measure);
  el.dataset.textPlaying = rhythm.playing ? 'on' : 'off';

  el.style.setProperty('--pretext-canonical-width', `${measurement.canonicalWidth}px`);
  el.style.setProperty('--pretext-projected-width', `${measurement.projectedWidth}px`);
  el.style.setProperty('--pretext-influence', `${interaction.influence}`);
  el.style.setProperty('--pretext-direction', `${interaction.direction}`);
  el.style.setProperty('--pretext-phase', `"${rhythm.phase}"`);
  el.style.setProperty('--pretext-beat', `${rhythm.beat}`);
  el.style.setProperty('--pretext-measure', `${rhythm.measure}`);
  el.style.setProperty('--pretext-bpm', `${rhythm.bpm}`);
}

function readOperatorContext(el) {
  return el.closest('.site-frame')?.dataset.spwOperator || FALLBACK_OPERATOR;
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