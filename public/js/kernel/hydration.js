/**
 * Hydration + display-layer coordination for the site runtime.
 *
 * This module owns the root attribute sequence that CSS uses to reduce
 * reflow during boot and to choose the public-facing presentation layer.
 */

export const HYDRATION_STATES = Object.freeze({
  STATIC: 'static',
  ACTIVATING: 'activating',
  READY: 'ready',
});

/** Workbench-aligned pass names (lex → semantic → pragmatic). */
export const HYDRATION_PASSES = Object.freeze({
  LEX: 'lex',
  SEMANTIC: 'semantic',
  PRAGMATIC: 'pragmatic',
});

export const SPW_HYDRATION_CONTRACT = Object.freeze({
  states: HYDRATION_STATES,
  passes: HYDRATION_PASSES,
  events: Object.freeze({
    pass: 'spw:hydration-pass',
  }),
  portableUse:
    'static/lex is authored HTML; activating/semantic is annotation and measure; ready/pragmatic is interactive spell surfaces.',
});

const HYDRATION_PASS_BY_STATE = Object.freeze({
  [HYDRATION_STATES.STATIC]: HYDRATION_PASSES.LEX,
  [HYDRATION_STATES.ACTIVATING]: HYDRATION_PASSES.SEMANTIC,
  [HYDRATION_STATES.READY]: HYDRATION_PASSES.PRAGMATIC,
});

export const DISPLAY_LAYERS = Object.freeze({
  READER: 'reader',
  EDITOR: 'editor',
  INSPECT: 'inspect',
});

export const CAPTURE_MODES = Object.freeze({
  DEFAULT: 'default',
  CLEAN: 'clean',
});

const HYDRATION_ORDER = [HYDRATION_STATES.STATIC, HYDRATION_STATES.ACTIVATING, HYDRATION_STATES.READY];
const DISPLAY_LAYER_VALUES = [DISPLAY_LAYERS.READER, DISPLAY_LAYERS.EDITOR, DISPLAY_LAYERS.INSPECT];
const CAPTURE_MODE_VALUES = [CAPTURE_MODES.DEFAULT, CAPTURE_MODES.CLEAN];

function readBody() {
  return document.body || document.documentElement;
}

function normalizeEnumValue(nextValue, fallback, allowed) {
  return allowed.includes(nextValue) ? nextValue : fallback;
}

function normalizeHydrationState(nextState, currentState) {
  if (!HYDRATION_ORDER.includes(nextState)) return currentState;
  if (!HYDRATION_ORDER.includes(currentState)) return nextState;
  return HYDRATION_ORDER.indexOf(nextState) >= HYDRATION_ORDER.indexOf(currentState) ? nextState : currentState;
}

export function initHydration(options = {}) {
  const html = document.documentElement;
  const body = readBody();
  const hydrationState = normalizeHydrationState(
    options.hydrationState || body?.dataset?.spwHydration || html.dataset.spwHydration || HYDRATION_STATES.STATIC,
    HYDRATION_STATES.STATIC,
  );
  const displayLayer = normalizeEnumValue(
    options.displayLayer || body?.dataset?.spwDisplayLayer || DISPLAY_LAYERS.READER,
    DISPLAY_LAYERS.READER,
    DISPLAY_LAYER_VALUES,
  );
  const captureMode = normalizeEnumValue(
    options.captureMode || body?.dataset?.spwCaptureMode || html.dataset.spwCaptureMode || CAPTURE_MODES.DEFAULT,
    CAPTURE_MODES.DEFAULT,
    CAPTURE_MODE_VALUES,
  );

  html.dataset.spwHydration = hydrationState;
  html.dataset.spwHydrationPass = HYDRATION_PASS_BY_STATE[hydrationState] || HYDRATION_PASSES.LEX;
  if (body) {
    body.dataset.spwHydration = hydrationState;
    body.dataset.spwHydrationPass = html.dataset.spwHydrationPass;
    body.dataset.spwDisplayLayer = displayLayer;
    body.dataset.spwCaptureMode = captureMode;
  }
  html.dataset.spwCaptureMode = captureMode;

  return { hydrationState, hydrationPass: html.dataset.spwHydrationPass, displayLayer, captureMode };
}

export function progressHydration(nextState) {
  const html = document.documentElement;
  const body = readBody();
  const currentState = html.dataset.spwHydration || HYDRATION_STATES.STATIC;
  const normalized = normalizeHydrationState(nextState, currentState);
  const pass = HYDRATION_PASS_BY_STATE[normalized] || HYDRATION_PASSES.LEX;
  html.dataset.spwHydration = normalized;
  html.dataset.spwHydrationPass = pass;
  if (body) {
    body.dataset.spwHydration = normalized;
    body.dataset.spwHydrationPass = pass;
  }

  const detail = { state: normalized, pass, previous: currentState };
  document.dispatchEvent(new CustomEvent(SPW_HYDRATION_CONTRACT.events.pass, { detail }));

  return normalized;
}

export function setDisplayLayer(layer) {
  const body = readBody();
  const currentLayer = body?.dataset?.spwDisplayLayer || DISPLAY_LAYERS.READER;
  const normalized = normalizeEnumValue(layer, currentLayer, DISPLAY_LAYER_VALUES);
  if (body) body.dataset.spwDisplayLayer = normalized;
  return normalized;
}

export function setCaptureMode(mode) {
  const html = document.documentElement;
  const body = readBody();
  const currentMode = html.dataset.spwCaptureMode || body?.dataset?.spwCaptureMode || CAPTURE_MODES.DEFAULT;
  const normalized = normalizeEnumValue(mode, currentMode, CAPTURE_MODE_VALUES);
  html.dataset.spwCaptureMode = normalized;
  if (body) body.dataset.spwCaptureMode = normalized;
  return normalized;
}

export function getCurrentHydrationState() {
  const html = document.documentElement;
  const body = readBody();
  return normalizeHydrationState(
    html.dataset.spwHydration || body?.dataset?.spwHydration || HYDRATION_STATES.STATIC,
    HYDRATION_STATES.STATIC,
  );
}

export function getCurrentDisplayLayer() {
  return normalizeEnumValue(readBody()?.dataset?.spwDisplayLayer, DISPLAY_LAYERS.READER, DISPLAY_LAYER_VALUES);
}

export function getCurrentCaptureMode() {
  const html = document.documentElement;
  const body = readBody();
  return normalizeEnumValue(
    html.dataset.spwCaptureMode || body?.dataset?.spwCaptureMode,
    CAPTURE_MODES.DEFAULT,
    CAPTURE_MODE_VALUES,
  );
}
