/**
 * spw-pretext-physics.js
 * ---------------------------------------------------------------------------
 * Spw Pretext Physics
 *
 * Purpose
 * - Treat live text interaction as measured typesetting, not transform-only FX.
 * - Recompose text blocks under changing conditions while preserving a
 *   canonical resting layout.
 * - Expose quantified, inspectable context for future CSS, haptics, sound,
 *   ornament, and story-specific component tropes.
 *
 * Core idea
 * - Text is prepared once.
 * - Typography is measured and cached in quantized width buckets.
 * - Interaction changes projected width / mode, not raw text.
 * - Rendered lines are the precipitate of:
 *     text + font anatomy + measure + interaction + ornament policy
 *
 * Contexts of live text interaction
 * - resting      : canonical readable layout
 * - approach     : anticipatory proximity influence
 * - contact      : discrete activation pulse
 * - projecting   : continuous gesture-driven projection
 * - settling     : return toward canonical layout
 *
 * Reasons for measurement
 * - preserve readable lineation under interaction
 * - keep interaction semantic rather than scale-only
 * - separate structure from ornament
 * - allow a canonical width to be cached and trusted while other interactions happen
 * - expose intermediate scaffolding for design and performance literacy
 *
 * Distinguishing router
 * - The text content itself should route the block into quantized typographic
 *   classes (kind / density / measure / projection / ornament).
 *
 * Current font
 * - JetBrains Mono is assumed as the current default. That makes rough width
 *   estimation and operator-density analysis more meaningful.
 *
 * Expansion channels
 * - classify(context, state) -> override or refine quantized context
 * - project(proposal, state) -> tune projected width / influence / mode
 * - decorate(lineInfo)       -> provide deterministic line ornament
 * - scaffold(summary, state) -> expose intermediate diagnostics
 */

import { loadPretext } from './pretext-utils.js';

/* ==========================================================================
   Configuration
   ========================================================================== */

const DEFAULTS = Object.freeze({
  selector: '[data-spw-flow="pretext"]',
  scaffoldSelector: '[data-spw-pretext-scaffold], [data-spw-debug~="pretext"]',

  // Interaction field
  approachFieldX: 600,
  approachFieldY: 300,
  centerSnapPx: 12,

  // Projection ranges
  approachRangePx: 120,
  activationPulseScale: 1.22,
  activationPulseMs: 180,
  projectDxMultiplier: 1.5,
  minProjectedWidth: 120,

  // Measurement
  minCanonicalWidth: 160,
  maxCanonicalWidth: 960,
  defaultLineHeightPx: 24,

  // Quantization
  widthStepPx: 12,
  influenceBuckets: [0, 0.2, 0.4, 0.6, 0.8, 1],

  // Ornament
  ornamentEnabled: true,
  deterministicDecoration: true,

  // Channels
  channels: {
    classify: null,
    project: null,
    decorate: null,
    scaffold: null,
  },
});

const FLOW_RUNTIME = {
  pretextPromise: null,
  pretext: null,
  instances: new Set(),
  byElement: new WeakMap(),
  pointer: {
    x: 0,
    y: 0,
    rafId: 0,
    active: false,
  },
  listenersAttached: false,
  resizeObserver: null,
};

const OPERATOR_SIGIL_FALLBACK = '?';

/* ==========================================================================
   Public API
   ========================================================================== */

/**
 * Initialize Pretext physics on the current surface.
 * Backward-compatible with no arguments.
 *
 * @param {object} [options]
 * @param {ParentNode} [options.root=document]
 * @param {string} [options.selector]
 * @param {object} [options.channels]
 * @returns {Promise<() => void>} cleanup
 */
export async function initPretextPhysics(options = {}) {
  const config = createConfig(options);
  const root = options.root || document;
  const targets = [...root.querySelectorAll(config.selector)];

  if (!targets.length) return () => {};

  try {
    const pretext = await ensurePretext();
    if (document.fonts?.ready) await document.fonts.ready;

    const mounted = targets
      .filter((el) => !FLOW_RUNTIME.byElement.has(el))
      .map((el) => mountFlowElement(el, pretext, config));

    ensureRuntimeListeners(config);

    return () => {
      mounted.forEach(unmountFlowElement);
      teardownRuntimeIfIdle();
    };
  } catch (error) {
    console.warn('Pretext physics failed to initialize:', error);
    return () => {};
  }
}

/* ==========================================================================
   Config + runtime boot
   ========================================================================== */

function createConfig(options) {
  return {
    ...DEFAULTS,
    ...options,
    channels: {
      ...DEFAULTS.channels,
      ...(options.channels || {}),
    },
  };
}

async function ensurePretext() {
  if (!FLOW_RUNTIME.pretextPromise) {
    FLOW_RUNTIME.pretextPromise = loadPretext();
  }

  FLOW_RUNTIME.pretext = FLOW_RUNTIME.pretext || (await FLOW_RUNTIME.pretextPromise);
  return FLOW_RUNTIME.pretext;
}

function ensureRuntimeListeners(config) {
  if (FLOW_RUNTIME.listenersAttached) return;

  document.body.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('spw:brace:charge-start', onBraceChargeStart);
  document.addEventListener('spw:brace:discharge', onBraceDischarge);
  document.addEventListener('spw:brace:activate', onBraceActivate);
  document.addEventListener('spw:brace:project-move', onBraceProjectMove);
  document.addEventListener('spw:brace:project-end', onBraceProjectEnd);
  window.addEventListener('blur', settleAllFlows);

  if ('ResizeObserver' in window) {
    FLOW_RUNTIME.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const state = FLOW_RUNTIME.byElement.get(entry.target);
        if (!state) return;
        refreshCanonicalMeasurement(state);
      });
    });
  } else {
    window.addEventListener('resize', onWindowResize, { passive: true });
  }

  FLOW_RUNTIME.listenersAttached = true;
  FLOW_RUNTIME.config = config;
}

function teardownRuntimeIfIdle() {
  if (FLOW_RUNTIME.instances.size) return;
  if (!FLOW_RUNTIME.listenersAttached) return;

  document.body.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('spw:brace:charge-start', onBraceChargeStart);
  document.removeEventListener('spw:brace:discharge', onBraceDischarge);
  document.removeEventListener('spw:brace:activate', onBraceActivate);
  document.removeEventListener('spw:brace:project-move', onBraceProjectMove);
  document.removeEventListener('spw:brace:project-end', onBraceProjectEnd);
  window.removeEventListener('blur', settleAllFlows);
  window.removeEventListener('resize', onWindowResize);

  FLOW_RUNTIME.resizeObserver?.disconnect();
  FLOW_RUNTIME.resizeObserver = null;
  FLOW_RUNTIME.listenersAttached = false;
  FLOW_RUNTIME.pointer.rafId = 0;
}

/* ==========================================================================
   Mount / unmount
   ========================================================================== */

function mountFlowElement(el, pretext, config) {
  const computed = getComputedStyle(el);
  const text = getInitialText(el);
  const fontProfile = readFontProfile(computed);
  const anatomy = analyzeTextAnatomy(text);
  const baseContext = classifyTextContext({ el, anatomy, fontProfile, config });
  const context = applyClassifyChannel(baseContext, config.channels.classify, {
    el,
    anatomy,
    fontProfile,
  });

  const preparedText = pretext.prepareWithSegments(text, fontProfile.fontShorthand, {
    whiteSpace: 'normal',
  });

  const linesRoot = document.createElement('div');
  linesRoot.className = 'pretext-flow-lines';

  const scaffoldRoot = shouldShowScaffold(el, config)
    ? createScaffoldRoot()
    : null;

  el.replaceChildren(linesRoot, ...(scaffoldRoot ? [scaffoldRoot] : []));

  const canonicalWidth = guessCanonicalWidth(el, anatomy, fontProfile, context, config);
  const widthStep = context.widthStepPx || config.widthStepPx;
  const lineHeight = context.lineHeightPx || fontProfile.lineHeightPx || config.defaultLineHeightPx;

  const state = {
    el,
    pretext,
    config,

    substrate: {
      text,
      preparedText,
      fontProfile,
      lineHeightPx: lineHeight,
    },

    anatomy,

    context: {
      ...context,
    },

    measurement: {
      canonicalWidth,
      projectedWidth: canonicalWidth,
      widthStepPx: widthStep,
      layoutCache: new Map(),
      canonicalLayoutKey: null,
      canonicalLineCount: 0,
      wrapVolatility: 'stable',
      widthClass: classifyWidthClass(canonicalWidth),
    },

    interaction: {
      mode: 'resting',
      influence: 0,
      influenceBucket: 0,
      direction: 0,
      activeProjectionSource: 'none',
    },

    ornament: {
      enabled: config.ornamentEnabled && context.ornamentFamily !== 'none',
      family: context.ornamentFamily,
    },

    dom: {
      linesRoot,
      scaffoldRoot,
    },

    channels: {
      classify: config.channels.classify,
      project: config.channels.project,
      decorate: config.channels.decorate,
      scaffold: config.channels.scaffold,
    },
  };

  FLOW_RUNTIME.byElement.set(el, state);
  FLOW_RUNTIME.instances.add(state);

  if (FLOW_RUNTIME.resizeObserver) {
    FLOW_RUNTIME.resizeObserver.observe(el);
  }

  syncElementSurface(state);
  const canonicalLayout = getOrMeasureLayout(state, canonicalWidth);
  state.measurement.canonicalLayoutKey = widthKey(canonicalWidth, widthStep);
  state.measurement.canonicalLineCount = canonicalLayout.lines.length;

  renderProjectedLines(state, canonicalWidth);

  return state;
}

function unmountFlowElement(state) {
  if (!state) return;

  FLOW_RUNTIME.instances.delete(state);
  FLOW_RUNTIME.byElement.delete(state.el);
  FLOW_RUNTIME.resizeObserver?.unobserve?.(state.el);
}

function getInitialText(el) {
  return (el.dataset.spwText || el.innerText || '').trim();
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

/* ==========================================================================
   Text / font anatomy
   ========================================================================== */

function readFontProfile(computed) {
  const fontSizePx = parsePx(computed.fontSize, 16);
  const lineHeightPx = parseLineHeight(computed.lineHeight, fontSizePx, DEFAULTS.defaultLineHeightPx);
  const fontFamily = computed.fontFamily || 'JetBrains Mono, monospace';

  return {
    fontFamily,
    fontSizePx,
    lineHeightPx,
    fontShorthand: computed.font || `${fontSizePx}px ${fontFamily}`,
    isMonospaceHint: /jetbrains mono|monospace/i.test(fontFamily),
    averageAdvancePxGuess: fontSizePx * 0.62,
  };
}

function analyzeTextAnatomy(text) {
  const words = text.match(/\b[\w'-]+\b/g) || [];
  const operators = text.match(/[~@^?!*=&$%|:#<>]+/g) || [];
  const punctuation = text.match(/[.,;:!?()[\]{}'"`-]/g) || [];
  const numerals = text.match(/\d/g) || [];
  const lineBreaks = text.match(/\n/g) || [];
  const uppercase = text.match(/[A-Z]/g) || [];

  const chars = text.length || 0;
  const wordsCount = words.length || 0;

  return {
    chars,
    words: wordsCount,
    averageWordLength: wordsCount ? words.join('').length / wordsCount : 0,
    operatorsCount: operators.join('').length,
    punctuationCount: punctuation.length,
    numeralsCount: numerals.length,
    uppercaseCount: uppercase.length,
    lineBreakCount: lineBreaks.length,
    whitespaceRatio: chars ? (text.match(/\s/g) || []).length / chars : 0,
    operatorDensity: chars ? operators.join('').length / chars : 0,
    punctuationDensity: chars ? punctuation.length / chars : 0,
    uppercaseDensity: chars ? uppercase.length / chars : 0,
    questionDensity: chars ? (text.match(/\?/g) || []).length / chars : 0,
  };
}

function classifyTextContext({ el, anatomy, fontProfile, config }) {
  const explicitKind = el.dataset.textKind || '';
  const explicitProjection = el.dataset.textProjection || '';
  const explicitOrnament = el.dataset.textOrnament || '';
  const explicitMeasure = el.dataset.textMeasure || '';

  const kind =
    explicitKind
    || selectTextKind(anatomy);

  const density = selectDensityClass(anatomy);
  const measureProfile =
    explicitMeasure
    || selectMeasureProfile(anatomy, fontProfile);

  const projectionFamily =
    explicitProjection
    || selectProjectionFamily(kind, anatomy);

  const ornamentFamily =
    explicitOrnament
    || selectOrnamentFamily(kind, anatomy);

  const widthStepPx = selectWidthStep(measureProfile, config);
  const lineHeightPx = selectLineHeight(fontProfile, kind);

  return {
    kind,
    density,
    measureProfile,
    projectionFamily,
    ornamentFamily,
    widthStepPx,
    lineHeightPx,
  };
}

function selectTextKind(anatomy) {
  if (anatomy.operatorDensity > 0.08) return 'operator-dense';
  if (anatomy.questionDensity > 0.02) return 'question';
  if (anatomy.lineBreakCount >= 2) return 'ledger';
  if (anatomy.words <= 8) return 'caption';
  if (anatomy.punctuationDensity < 0.03 && anatomy.words > 24) return 'invocation';
  return 'prose';
}

function selectDensityClass(anatomy) {
  const visualLoad =
    anatomy.operatorDensity * 2.4
    + anatomy.punctuationDensity * 1.6
    + anatomy.uppercaseDensity * 1.2
    + Math.min(anatomy.words / 120, 1);

  if (visualLoad > 1.45) return 'compressed';
  if (visualLoad > 1.05) return 'dense';
  if (visualLoad > 0.65) return 'medium';
  return 'soft';
}

function selectMeasureProfile(anatomy, fontProfile) {
  if (anatomy.words <= 8) return 'tight';
  if (anatomy.operatorDensity > 0.08) return 'elastic';
  if (fontProfile.isMonospaceHint && anatomy.words > 48) return 'wide';
  return 'standard';
}

function selectProjectionFamily(kind, anatomy) {
  if (kind === 'operator-dense') return 'expand';
  if (kind === 'question') return 'lean';
  if (kind === 'caption') return 'pulse';
  if (anatomy.lineBreakCount >= 2) return 'indent';
  return 'expand';
}

function selectOrnamentFamily(kind, anatomy) {
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

function selectLineHeight(fontProfile, kind) {
  if (kind === 'caption') return Math.round(fontProfile.fontSizePx * 1.4);
  if (kind === 'ledger') return Math.round(fontProfile.fontSizePx * 1.65);
  return fontProfile.lineHeightPx;
}

/* ==========================================================================
   Measurement
   ========================================================================== */

function guessCanonicalWidth(el, anatomy, fontProfile, context, config) {
  const measured = Math.max(el.clientWidth || 0, el.offsetWidth || 0);
  const estimatedFromChars = estimateWidthFromText(anatomy, fontProfile, context);

  const candidate = measured || estimatedFromChars || 400;
  return clamp(candidate, config.minCanonicalWidth, config.maxCanonicalWidth);
}

function estimateWidthFromText(anatomy, fontProfile, context) {
  const targetCharsPerLine = (() => {
    switch (context.measureProfile) {
      case 'tight': return 24;
      case 'wide': return 68;
      case 'elastic': return 44;
      default: return 54;
    }
  })();

  return Math.round(targetCharsPerLine * fontProfile.averageAdvancePxGuess);
}

function refreshCanonicalMeasurement(state) {
  const nextCanonical = guessCanonicalWidth(
    state.el,
    state.anatomy,
    state.substrate.fontProfile,
    state.context,
    state.config
  );

  if (Math.abs(nextCanonical - state.measurement.canonicalWidth) < state.measurement.widthStepPx) {
    return;
  }

  state.measurement.canonicalWidth = nextCanonical;
  state.measurement.widthClass = classifyWidthClass(nextCanonical);
  state.measurement.layoutCache.clear();

  if (state.interaction.mode === 'resting' || state.interaction.mode === 'settling') {
    projectWidth(state, nextCanonical, {
      mode: 'resting',
      source: 'resize',
      force: true,
    });
  } else {
    syncElementSurface(state);
    updateScaffold(state);
  }
}

function getOrMeasureLayout(state, width) {
  const key = widthKey(width, state.measurement.widthStepPx);
  const cached = state.measurement.layoutCache.get(key);
  if (cached) return cached;

  const quantizedWidth = quantize(width, state.measurement.widthStepPx);
  const result = state.pretext.layoutWithLines(
    state.substrate.preparedText,
    quantizedWidth,
    state.substrate.lineHeightPx
  );

  state.measurement.layoutCache.set(key, result);
  updateWrapVolatility(state, result.lines.length);

  return result;
}

function updateWrapVolatility(state, lineCount) {
  const canonical = state.measurement.canonicalLineCount || lineCount;
  const diff = Math.abs(lineCount - canonical);

  if (diff >= 4) {
    state.measurement.wrapVolatility = 'volatile';
  } else if (diff >= 2) {
    state.measurement.wrapVolatility = 'responsive';
  } else {
    state.measurement.wrapVolatility = 'stable';
  }
}

function widthKey(width, step) {
  return `${quantize(width, step)}`;
}

function classifyWidthClass(width) {
  if (width < 220) return 'xs';
  if (width < 340) return 'sm';
  if (width < 520) return 'md';
  if (width < 720) return 'lg';
  return 'xl';
}

/* ==========================================================================
   Interaction field
   ========================================================================== */

function onPointerMove(event) {
  FLOW_RUNTIME.pointer.x = event.clientX;
  FLOW_RUNTIME.pointer.y = event.clientY;
  FLOW_RUNTIME.pointer.active = true;

  if (FLOW_RUNTIME.pointer.rafId) return;
  FLOW_RUNTIME.pointer.rafId = requestAnimationFrame(runAmbientApproachFrame);
}

function runAmbientApproachFrame() {
  FLOW_RUNTIME.pointer.rafId = 0;
  const { x, y } = FLOW_RUNTIME.pointer;

  FLOW_RUNTIME.instances.forEach((state) => {
    const proposal = createAmbientApproachProposal(state, x, y);
    applyProjectionProposal(state, proposal);
  });
}

function createAmbientApproachProposal(state, pointerX, pointerY) {
  const rect = state.el.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const inField =
    absDx < state.config.approachFieldX &&
    absDy < state.config.approachFieldY;

  if (!inField) {
    return {
      width: state.measurement.canonicalWidth,
      influence: 0,
      direction: 0,
      mode: state.interaction.mode === 'projecting' ? 'projecting' : 'settling',
      source: 'ambient-approach',
    };
  }

  const direction = dx < 0 ? -1 : 1;
  const influenceX = 1 - absDx / state.config.approachFieldX;
  const influenceY = 1 - absDy / state.config.approachFieldY;
  const influence = clamp(Math.min(influenceX, influenceY), 0, 1);

  const delta = direction * influence * state.config.approachRangePx;
  const targetWidth = state.measurement.canonicalWidth + delta;
  const snappedWidth = absDx < state.config.centerSnapPx
    ? state.measurement.canonicalWidth
    : targetWidth;

  return {
    width: snappedWidth,
    influence,
    direction,
    mode: 'approach',
    source: 'ambient-approach',
  };
}

function onBraceChargeStart(event) {
  const state = resolveFlowStateFromEvent(event);
  if (!state) return;

  applyProjectionProposal(state, {
    width: state.measurement.projectedWidth,
    influence: Math.max(state.interaction.influence, 0.35),
    direction: state.interaction.direction || 0,
    mode: 'approach',
    source: 'brace-charge',
  });
}

function onBraceActivate(event) {
  const state = resolveFlowStateFromEvent(event);
  if (!state) return;

  const pulseWidth = state.measurement.canonicalWidth * state.config.activationPulseScale;

  applyProjectionProposal(state, {
    width: pulseWidth,
    influence: 1,
    direction: 0,
    mode: 'contact',
    source: 'brace-activate',
    force: true,
  });

  window.setTimeout(() => {
    if (!FLOW_RUNTIME.instances.has(state)) return;
    applyProjectionProposal(state, {
      width: state.measurement.canonicalWidth,
      influence: 0,
      direction: 0,
      mode: 'settling',
      source: 'brace-activate-settle',
      force: true,
    });
  }, state.config.activationPulseMs);
}

function onBraceProjectMove(event) {
  const state = resolveFlowStateFromEvent(event);
  if (!state) return;

  const dx = Number(event.detail?.dx || 0);
  const distance = Number(event.detail?.distance || 0);
  const variance = dx * state.config.projectDxMultiplier;
  const targetWidth = Math.max(
    state.config.minProjectedWidth,
    state.measurement.canonicalWidth + variance
  );

  const influence = clamp(distance / 160, 0, 1);
  const direction = dx === 0 ? 0 : dx > 0 ? 1 : -1;

  applyProjectionProposal(state, {
    width: targetWidth,
    influence,
    direction,
    mode: 'projecting',
    source: 'brace-project',
  });
}

function onBraceProjectEnd(event) {
  const state = resolveFlowStateFromEvent(event);
  if (!state) return;

  applyProjectionProposal(state, {
    width: state.measurement.canonicalWidth,
    influence: 0,
    direction: 0,
    mode: 'settling',
    source: 'brace-project-end',
    force: true,
  });
}

function onBraceDischarge(event) {
  const state = resolveFlowStateFromEvent(event);
  if (!state) return;

  applyProjectionProposal(state, {
    width: state.measurement.canonicalWidth,
    influence: 0,
    direction: 0,
    mode: 'settling',
    source: 'brace-discharge',
    force: true,
  });
}

function settleAllFlows() {
  FLOW_RUNTIME.instances.forEach((state) => {
    applyProjectionProposal(state, {
      width: state.measurement.canonicalWidth,
      influence: 0,
      direction: 0,
      mode: 'settling',
      source: 'window-blur',
      force: true,
    });
  });
}

function onWindowResize() {
  FLOW_RUNTIME.instances.forEach(refreshCanonicalMeasurement);
}

function resolveFlowStateFromEvent(event) {
  const origin =
    (event.target instanceof Element && event.target)
    || (event.detail?.target instanceof Element && event.detail.target)
    || null;

  if (!origin) return null;

  const flowEl =
    origin.matches?.(DEFAULTS.selector)
      ? origin
      : origin.querySelector?.(DEFAULTS.selector) || origin.closest?.(DEFAULTS.selector);

  return flowEl ? FLOW_RUNTIME.byElement.get(flowEl) : null;
}

/* ==========================================================================
   Projection
   ========================================================================== */

function applyProjectionProposal(state, proposal) {
  const baseProposal = {
    width: proposal.width,
    influence: proposal.influence ?? state.interaction.influence,
    direction: proposal.direction ?? state.interaction.direction,
    mode: proposal.mode || state.interaction.mode,
    source: proposal.source || 'unknown',
    force: Boolean(proposal.force),
  };

  const tuned =
    typeof state.channels.project === 'function'
      ? state.channels.project(baseProposal, state) || baseProposal
      : baseProposal;

  projectWidth(state, tuned.width, tuned);
}

function projectWidth(state, width, meta = {}) {
  const nextWidth = clamp(
    quantize(width, state.measurement.widthStepPx),
    state.config.minProjectedWidth,
    state.config.maxCanonicalWidth
  );

  const widthChanged =
    Math.abs(nextWidth - state.measurement.projectedWidth) >= state.measurement.widthStepPx;

  const modeChanged = meta.mode && meta.mode !== state.interaction.mode;
  const force = Boolean(meta.force);

  state.interaction.mode = meta.mode || state.interaction.mode;
  state.interaction.influence = clamp(meta.influence ?? state.interaction.influence, 0, 1);
  state.interaction.influenceBucket = quantizeInfluenceBucket(
    state.interaction.influence,
    state.config.influenceBuckets
  );
  state.interaction.direction = meta.direction ?? state.interaction.direction;
  state.interaction.activeProjectionSource = meta.source || state.interaction.activeProjectionSource;

  if (!widthChanged && !modeChanged && !force) {
    syncElementSurface(state);
    updateScaffold(state);
    return;
  }

  state.measurement.projectedWidth = nextWidth;
  renderProjectedLines(state, nextWidth);
}

/* ==========================================================================
   Render + ornament + scaffold
   ========================================================================== */

function renderProjectedLines(state, width) {
  const layout = getOrMeasureLayout(state, width);
  const fragment = document.createDocumentFragment();
  const operator = readOperatorContext(state.el);

  layout.lines.forEach((line, index) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'pretext-flow-line';
    lineEl.style.width = `${width}px`;
    lineEl.style.setProperty('--line-index', index);

    const decoration = getLineDecoration(state, {
      line,
      index,
      operator,
      influence: state.interaction.influence,
      influenceBucket: state.interaction.influenceBucket,
      mode: state.interaction.mode,
    });

    if (decoration.before) {
      const before = document.createElement('span');
      before.className = `line-decor ${decoration.className || ''}`.trim();
      before.textContent = decoration.before;
      lineEl.appendChild(before);
    }

    const textNode = document.createElement('span');
    textNode.className = 'pretext-flow-line-text';
    textNode.textContent = line.text;
    lineEl.appendChild(textNode);

    if (decoration.after) {
      const after = document.createElement('span');
      after.className = `line-decor ${decoration.className || ''}`.trim();
      after.textContent = decoration.after;
      lineEl.appendChild(after);
    }

    fragment.appendChild(lineEl);
  });

  state.dom.linesRoot.replaceChildren(fragment);
  syncElementSurface(state);
  updateScaffold(state);
}

function getLineDecoration(state, lineInfo) {
  if (!state.ornament.enabled) {
    return { before: '', after: '', className: '' };
  }

  if (typeof state.channels.decorate === 'function') {
    return state.channels.decorate(lineInfo, state) || {
      before: '',
      after: '',
      className: '',
    };
  }

  const shouldDecorate = shouldDecorateLineDeterministically(state, lineInfo);
  if (!shouldDecorate) {
    return { before: '', after: '', className: '' };
  }

  const sigil = lineInfo.operator || OPERATOR_SIGIL_FALLBACK;

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

function shouldDecorateLineDeterministically(state, lineInfo) {
  const { influenceBucket, index } = lineInfo;
  if (influenceBucket <= 0) return false;

  const densityBias =
    state.context.density === 'compressed' ? 3 :
    state.context.density === 'dense' ? 2 :
    1;

  const threshold = Math.max(1, 5 - influenceBucket - densityBias);
  return index % threshold === 0;
}

function updateScaffold(state) {
  if (!state.dom.scaffoldRoot) return;

  const summary = {
    kind: state.context.kind,
    density: state.context.density,
    measure: state.context.measureProfile,
    projection: state.context.projectionFamily,
    ornament: state.context.ornamentFamily,
    mode: state.interaction.mode,
    widthClass: state.measurement.widthClass,
    wrapVolatility: state.measurement.wrapVolatility,
    canonicalWidth: state.measurement.canonicalWidth,
    projectedWidth: state.measurement.projectedWidth,
    cacheEntries: state.measurement.layoutCache.size,
    influenceBucket: state.interaction.influenceBucket,
  };

  const override =
    typeof state.channels.scaffold === 'function'
      ? state.channels.scaffold(summary, state)
      : null;

  const text =
    typeof override === 'string'
      ? override
      : [
          `kind:${summary.kind}`,
          `density:${summary.density}`,
          `measure:${summary.measure}`,
          `projection:${summary.projection}`,
          `mode:${summary.mode}`,
          `width:${summary.projectedWidth}px`,
          `cache:${summary.cacheEntries}`,
          `wrap:${summary.wrapVolatility}`,
        ].join(' · ');

  state.dom.scaffoldRoot.textContent = text;
}

function syncElementSurface(state) {
  const { el, context, interaction, measurement } = state;

  el.dataset.textKind = context.kind;
  el.dataset.textDensity = context.density;
  el.dataset.textMeasure = context.measureProfile;
  el.dataset.textProjection = context.projectionFamily;
  el.dataset.textOrnament = context.ornamentFamily;

  el.dataset.textMode = interaction.mode;
  el.dataset.textInfluence = `${interaction.influenceBucket}`;
  el.dataset.textDirection = `${interaction.direction}`;
  el.dataset.textWidthClass = measurement.widthClass;
  el.dataset.textWrap = measurement.wrapVolatility;

  el.style.setProperty('--pretext-canonical-width', `${measurement.canonicalWidth}px`);
  el.style.setProperty('--pretext-projected-width', `${measurement.projectedWidth}px`);
  el.style.setProperty('--pretext-influence', `${interaction.influence}`);
  el.style.setProperty('--pretext-direction', `${interaction.direction}`);
}

/* ==========================================================================
   Channels
   ========================================================================== */

function applyClassifyChannel(baseContext, classifyChannel, stateLike) {
  if (typeof classifyChannel !== 'function') return baseContext;
  return classifyChannel(baseContext, stateLike) || baseContext;
}

/* ==========================================================================
   Utilities
   ========================================================================== */

function readOperatorContext(el) {
  return el.closest('.site-frame')?.dataset.spwOperator || OPERATOR_SIGIL_FALLBACK;
}

function quantize(value, step) {
  return Math.round(value / step) * step;
}

function quantizeInfluenceBucket(value, buckets) {
  let bucket = 0;
  buckets.forEach((threshold, index) => {
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