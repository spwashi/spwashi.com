/**
 * Pinch to resize text: the two-finger gesture alone, with no site imports.
 *
 * A page that keeps a ladder of text-size steps hands this its ladder and two
 * hooks (read the current step, set the next one), and a two-finger pinch over
 * its reading surface steps the text while the fingers move. spwashi.com binds
 * it through runtime/attention/pinch-scale.js (spwSettings, the attention
 * helpers, the "pinch is off" hint); spw.quest carries it in its peer build
 * (scripts/build-peer-kit.mjs) and keeps the step on the device.
 *
 * While a pinch is live the root carries --spw-pinch-factor, --spw-pinch-delta
 * and the pinch origin, and html, body and the surface carry the active
 * attribute, data-spw-pinch-direction (expand | contract | neutral) and
 * data-spw-pinch-variant (compact | balanced | roomy), so CSS can show the
 * gesture before the step lands. All of it clears when the fingers lift.
 */

/** One step per this much change in log2 of the finger distance. */
export const PINCH_STEP = 0.12;

/** Contacts on these never start a pinch: their own gestures come first. */
export const PINCH_IGNORE = 'a, button, input, select, textarea, label, summary, details, video, audio, iframe';

/* Deliberately any-pointer, not the plain pointer/hover check most of the
   runtime uses elsewhere (see dom-contracts.js isMobileBottomLane /
   supportsFinePointerHover): a touchscreen laptop reports pointer:fine
   because the mouse is primary, but any-pointer:coarse still holds because a
   coarse pointer is available at all — exactly the device a two-finger
   pinch needs to reach. Do not "fix" this to match the majority pattern. */
export function supportsPinchTextScaleInput(environment = globalThis) {
  const touchPoints = Number(environment.navigator?.maxTouchPoints) || 0;
  const coarsePointer = environment.matchMedia?.('(any-pointer: coarse)').matches === true;
  return touchPoints >= 2 || coarsePointer;
}

/** Whole steps between two finger distances; 0 until the fingers really move. */
export function pinchStepChange(startDistance, distance) {
  if (!(startDistance > 0) || !(distance > 0)) return 0;
  return Math.round(Math.log2(distance / startDistance) / PINCH_STEP);
}

function getTouchDistance(touches) {
  if (!touches || touches.length < 2) return 0;
  const [first, second] = touches;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

function getTouchCenter(touches) {
  if (!touches || touches.length < 2) return { x: 0, y: 0 };
  const [first, second] = touches;
  return {
    x: Math.round((first.clientX + second.clientX) / 2),
    y: Math.round((first.clientY + second.clientY) / 2),
  };
}

/** The ladder's ends read compact and roomy; the middle reads balanced. */
export function pinchVariantFor(index, length) {
  if (index <= 1) return 'compact';
  if (index >= length - 2) return 'roomy';
  return 'balanced';
}

const writeChanged = (node, attributes) => {
  for (const [name, value] of Object.entries(attributes)) {
    if (node.getAttribute(name) !== value) node.setAttribute(name, value);
  }
};

/**
 * Listen for two-finger pinches over `main`. Returns the cleanup.
 *
 * @param {object} options
 * @param {HTMLElement} options.main the reading surface every contact must start on
 * @param {readonly string[]} options.steps the text-size ladder, smallest first
 * @param {() => string} options.getScale the current step, one of steps
 * @param {(step: string) => void} options.setScale applies and keeps the next step
 * @param {() => boolean} [options.isEnabled] false: the gesture is noticed, not acted on
 * @param {() => void} [options.onDisabledPinch] a real pinch while disabled, once per gesture
 * @param {string} [options.ignore] contacts on these never start a pinch
 * @param {string} [options.activeAttr] the attribute that marks a live pinch
 * @param {(node: HTMLElement, attributes: object) => void} [options.write] attribute writer
 */
export function bindPinchTextScale({
  main,
  steps,
  getScale,
  setScale,
  isEnabled = () => true,
  onDisabledPinch = () => {},
  ignore = PINCH_IGNORE,
  activeAttr = 'data-spw-pinch-scaling',
  write = writeChanged,
}) {
  if (!(main instanceof HTMLElement)) return () => {};
  const doc = main.ownerDocument || document;
  const html = doc.documentElement;
  const abort = new AbortController();
  const { signal } = abort;
  const clamp = (index) => Math.max(0, Math.min(steps.length - 1, index));
  const currentIndex = () => clamp(steps.indexOf(String(getScale())));

  const state = { active: false, startDistance: 0, startIndex: currentIndex(), previewIndex: currentIndex() };
  const disabledHint = { armed: false, startDistance: 0, announced: false };

  const clearDisabledHint = () => {
    disabledHint.armed = false;
    disabledHint.startDistance = 0;
    disabledHint.announced = false;
  };

  const clearPinchState = () => {
    state.active = false;
    state.startDistance = 0;
    state.startIndex = currentIndex();
    state.previewIndex = state.startIndex;

    html.style.removeProperty('--spw-pinch-factor');
    html.style.removeProperty('--spw-pinch-delta');
    html.style.removeProperty('--spw-pinch-origin-x');
    html.style.removeProperty('--spw-pinch-origin-y');

    [html, doc.body, main].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.removeAttribute(activeAttr);
      node.removeAttribute('data-spw-pinch-direction');
      node.removeAttribute('data-spw-pinch-variant');
    });
  };

  const isAllowedTarget = (target) => {
    if (!(target instanceof Element)) return false;
    if (!main.contains(target)) return false;
    return !(ignore && target.closest(ignore)) && !target.isContentEditable;
  };

  const handleTouchStart = (event) => {
    // TouchEvent.target names only one contact. Every contact must belong to
    // the reading surface before this enhancement can take over native zoom.
    if (event.touches.length !== 2
      || !Array.from(event.touches).every((touch) => isAllowedTarget(touch.target))) {
      if (state.active) clearPinchState();
      return;
    }
    if (!isEnabled()) {
      // Two resting contacts are not a pinch. Wait for a separation step.
      disabledHint.armed = true;
      disabledHint.startDistance = getTouchDistance(event.touches);
      disabledHint.announced = false;
      return;
    }
    clearDisabledHint();

    state.active = true;
    state.startDistance = getTouchDistance(event.touches);
    state.startIndex = currentIndex();
    state.previewIndex = state.startIndex;

    const center = getTouchCenter(event.touches);
    html.style.setProperty('--spw-pinch-origin-x', `${center.x}px`);
    html.style.setProperty('--spw-pinch-origin-y', `${center.y}px`);
    html.style.setProperty('--spw-pinch-factor', '1');
    html.style.setProperty('--spw-pinch-delta', '0');

    const variant = pinchVariantFor(state.startIndex, steps.length);
    [html, doc.body, main].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      write(node, {
        [activeAttr]: 'true',
        'data-spw-pinch-direction': 'neutral',
        'data-spw-pinch-variant': variant,
      });
    });
  };

  const handleTouchMove = (event) => {
    if (disabledHint.armed) {
      if (event.touches.length !== 2) {
        clearDisabledHint();
        return;
      }
      if (disabledHint.announced) return;
      const distance = getTouchDistance(event.touches);
      if (pinchStepChange(disabledHint.startDistance, distance) === 0) return;
      disabledHint.announced = true;
      onDisabledPinch();
      return;
    }
    if (!state.active) return;
    if (event.touches.length !== 2 || !isEnabled()) {
      clearPinchState();
      return;
    }

    const distance = getTouchDistance(event.touches);
    if (!(distance > 0) || !(state.startDistance > 0)) return;

    const ratio = distance / state.startDistance;
    const delta = Math.log2(ratio);
    const stepChange = pinchStepChange(state.startDistance, distance);
    const nextIndex = clamp(state.startIndex + stepChange);

    event.preventDefault();

    html.style.setProperty('--spw-pinch-factor', ratio.toFixed(3));
    html.style.setProperty('--spw-pinch-delta', delta.toFixed(3));

    const direction = delta > 0.04 ? 'expand' : delta < -0.04 ? 'contract' : 'neutral';
    const variant = pinchVariantFor(nextIndex, steps.length);
    [html, doc.body, main].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      write(node, {
        'data-spw-pinch-direction': direction,
        'data-spw-pinch-variant': variant,
      });
    });

    if (nextIndex === state.previewIndex) return;
    state.previewIndex = nextIndex;

    const nextScale = steps[nextIndex];
    if (nextScale && nextScale !== String(getScale())) setScale(nextScale);
  };

  const handleTouchEnd = () => {
    clearDisabledHint();
    if (!state.active) return;
    clearPinchState();
  };

  // Observe the full touch set, including a third contact outside main.
  doc.addEventListener('touchstart', handleTouchStart, { passive: true, signal });
  doc.addEventListener('touchmove', handleTouchMove, { passive: false, signal });
  doc.addEventListener('touchend', handleTouchEnd, { passive: true, signal });
  doc.addEventListener('touchcancel', handleTouchEnd, { passive: true, signal });

  return () => {
    abort.abort();
    clearPinchState();
  };
}
