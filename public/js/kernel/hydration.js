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
  if (body) {
    body.dataset.spwHydration = hydrationState;
    body.dataset.spwDisplayLayer = displayLayer;
    body.dataset.spwCaptureMode = captureMode;
  }
  html.dataset.spwCaptureMode = captureMode;

  return { hydrationState, displayLayer, captureMode };
}

export function progressHydration(nextState) {
  const html = document.documentElement;
  const body = readBody();
  const currentState = html.dataset.spwHydration || HYDRATION_STATES.STATIC;
  const normalized = normalizeHydrationState(nextState, currentState);
  html.dataset.spwHydration = normalized;
  if (body) body.dataset.spwHydration = normalized;
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
