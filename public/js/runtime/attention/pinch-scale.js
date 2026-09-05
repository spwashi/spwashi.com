import {
  FONT_SCALE_STEPS,
  PINCH_ACTIVE_ATTR,
  getRootPreference,
  resolveAttentionMain,
  writeAttributes,
} from './shared.js';

function getCurrentFontScale(doc = document) {
  const current = doc.defaultView?.spwSettings?.get?.()?.fontSizeScale
    || doc.documentElement?.dataset?.spwFontSizeScale
    || '100';
  return FONT_SCALE_STEPS.includes(String(current)) ? String(current) : '100';
}

function clampFontScaleIndex(index) {
  return Math.max(0, Math.min(FONT_SCALE_STEPS.length - 1, index));
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

function getVariantForIndex(index) {
  if (index <= 1) return 'compact';
  if (index >= 4) return 'roomy';
  return 'balanced';
}

function isPinchTextScaleEnabled(doc = document) {
  return getRootPreference('spwPinchTextScale', 'on', doc) !== 'off';
}

/* interaction-microstates.spw's reward_contract: a gesture that moves
   nothing should reveal potential instead of being silently absorbed. A
   real two-finger pinch over readable content is a deliberate, legible
   gesture — if the setting is off, say so and point at the switch, rather
   than doing nothing. Routes through the existing discovery-notice toast
   (autoDismissMs default ~4.6s, pauses on hover/focus, dismissible) instead
   of building a parallel hint surface. See .spw/conventions/
   interaction-microstates.spw#reward_contract. */
function announcePinchDisabledHint(doc) {
  doc.dispatchEvent(new CustomEvent('spw:discovery-reward', {
    detail: {
      label: 'Gesture noticed',
      title: 'Pinch-to-resize text is off',
      summary: 'That two-finger pinch would step the text size, but the setting is off right now.',
      cta: 'Open Settings',
      href: '/settings/#typography-settings',
      why: 'attention[pinch-scale] recognized the gesture and is naming the switch instead of doing nothing.',
      presentation: 'toast',
      source: 'pinch-scale-hint',
      cadence: 'learning',
    },
    bubbles: true,
  }));
}

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

export function initPinchTextScale(root) {
  if (!supportsPinchTextScaleInput()) return () => {};
  const main = root?.matches?.('main') ? root : root?.querySelector?.('main');
  if (!(main instanceof HTMLElement)) return () => {};
  const doc = main.ownerDocument || document;
  const html = doc.documentElement;
  const abort = new AbortController();
  const { signal } = abort;

  const state = {
    active: false,
    startDistance: 0,
    startIndex: clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale(doc))),
    previewIndex: clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale(doc))),
  };

  const clearPinchState = () => {
    state.active = false;
    state.startDistance = 0;
    state.startIndex = clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale(doc)));
    state.previewIndex = state.startIndex;

    html.style.removeProperty('--spw-pinch-factor');
    html.style.removeProperty('--spw-pinch-delta');
    html.style.removeProperty('--spw-pinch-origin-x');
    html.style.removeProperty('--spw-pinch-origin-y');

    [html, doc.body, main].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.removeAttribute(PINCH_ACTIVE_ATTR);
      node.removeAttribute('data-spw-pinch-direction');
      node.removeAttribute('data-spw-pinch-variant');
    });
  };

  const isAllowedTarget = (target) => {
    if (!(target instanceof Element)) return false;
    if (!main.contains(target)) return false;
    return !target.closest(
      'a, button, input, select, textarea, label, summary, details, video, audio, iframe, [contenteditable="true"]'
    );
  };

  const handleTouchStart = (event) => {
    if (event.touches.length !== 2) return;
    if (!isAllowedTarget(event.target)) return;
    if (!isPinchTextScaleEnabled(doc)) {
      announcePinchDisabledHint(doc);
      return;
    }

    state.active = true;
    state.startDistance = getTouchDistance(event.touches);
    state.startIndex = clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale(doc)));
    state.previewIndex = state.startIndex;

    const center = getTouchCenter(event.touches);
    html.style.setProperty('--spw-pinch-origin-x', `${center.x}px`);
    html.style.setProperty('--spw-pinch-origin-y', `${center.y}px`);
    html.style.setProperty('--spw-pinch-factor', '1');
    html.style.setProperty('--spw-pinch-delta', '0');

    const variant = getVariantForIndex(state.startIndex);

    [html, doc.body, main].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      writeAttributes(node, {
        [PINCH_ACTIVE_ATTR]: 'true',
        'data-spw-pinch-direction': 'neutral',
        'data-spw-pinch-variant': variant,
      });
    });
  };

  const handleTouchMove = (event) => {
    if (!state.active || event.touches.length !== 2) return;
    if (!isPinchTextScaleEnabled(doc)) return;

    const distance = getTouchDistance(event.touches);
    if (!(distance > 0) || !(state.startDistance > 0)) return;

    const ratio = distance / state.startDistance;
    const delta = Math.log2(ratio);
    const stepChange = Math.round(delta / 0.12);
    const nextIndex = clampFontScaleIndex(state.startIndex + stepChange);

    event.preventDefault();

    html.style.setProperty('--spw-pinch-factor', ratio.toFixed(3));
    html.style.setProperty('--spw-pinch-delta', delta.toFixed(3));

    const direction = delta > 0.04 ? 'expand' : delta < -0.04 ? 'contract' : 'neutral';
    const variant = getVariantForIndex(nextIndex);

    [html, doc.body, main].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      writeAttributes(node, {
        'data-spw-pinch-direction': direction,
        'data-spw-pinch-variant': variant,
      });
    });

    if (nextIndex === state.previewIndex) return;
    state.previewIndex = nextIndex;

    const nextScale = FONT_SCALE_STEPS[nextIndex];
    if (nextScale && nextScale !== getCurrentFontScale(doc)) {
      const view = doc.defaultView || window;
      if (view.spwSettings?.setFontSizeScale) view.spwSettings.setFontSizeScale(nextScale);
      else view.spwSettings?.save?.({ fontSizeScale: nextScale });
    }
  };

  const handleTouchEnd = () => {
    if (!state.active) return;
    clearPinchState();
  };

  main.addEventListener('touchstart', handleTouchStart, { passive: true, signal });
  main.addEventListener('touchmove', handleTouchMove, { passive: false, signal });
  main.addEventListener('touchend', handleTouchEnd, { passive: true, signal });
  main.addEventListener('touchcancel', handleTouchEnd, { passive: true, signal });

  return () => {
    abort.abort();
    clearPinchState();
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'attention-pinch-scale',
  mount: (ctx, root) => initPinchTextScale(resolveAttentionMain(ctx, root) || root),
  describes: 'attention[pinch-scale] optional coarse-pointer text scale preview',
  timingArc: 'interaction-attention',
  effectScope: 'conditional-touch-listeners root-css-vars settings-api',
});

export const spwModule = SPW_MODULE_EXPORT;
