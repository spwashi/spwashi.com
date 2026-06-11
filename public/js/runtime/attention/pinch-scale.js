import {
  FONT_SCALE_STEPS,
  PINCH_ACTIVE_ATTR,
  PINCH_TEXT_SCALE_ATTR,
  getRootPreference,
  writeAttributes,
} from './shared.js';

function getCurrentFontScale() {
  const current = window.spwSettings?.get?.()?.fontSizeScale
    || document.documentElement.dataset.spwFontSizeScale
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

function isPinchTextScaleEnabled() {
  return getRootPreference('spwPinchTextScale', 'on') !== 'off';
}

export function initPinchTextScale(root) {
  const main = root.querySelector?.('main');
  if (!(main instanceof HTMLElement)) return () => {};

  const state = {
    active: false,
    startDistance: 0,
    startIndex: clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale())),
    previewIndex: clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale())),
  };

  const clearPinchState = () => {
    state.active = false;
    state.startDistance = 0;
    state.startIndex = clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale()));
    state.previewIndex = state.startIndex;
    [document.documentElement, document.body, main].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.removeAttribute(PINCH_ACTIVE_ATTR);
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
    if (!isPinchTextScaleEnabled()) return;
    if (event.touches.length !== 2) return;
    if (!isAllowedTarget(event.target)) return;

    state.active = true;
    state.startDistance = getTouchDistance(event.touches);
    state.startIndex = clampFontScaleIndex(FONT_SCALE_STEPS.indexOf(getCurrentFontScale()));
    state.previewIndex = state.startIndex;

    [document.documentElement, document.body, main].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      writeAttributes(node, {
        [PINCH_ACTIVE_ATTR]: 'true',
      });
    });
  };

  const handleTouchMove = (event) => {
    if (!state.active || event.touches.length !== 2) return;
    if (!isPinchTextScaleEnabled()) return;

    const distance = getTouchDistance(event.touches);
    if (!(distance > 0) || !(state.startDistance > 0)) return;

    const delta = Math.log2(distance / state.startDistance);
    const stepChange = Math.round(delta / 0.12);
    const nextIndex = clampFontScaleIndex(state.startIndex + stepChange);
    event.preventDefault();

    if (nextIndex === state.previewIndex) return;
    state.previewIndex = nextIndex;

    const nextScale = FONT_SCALE_STEPS[nextIndex];
    if (nextScale && nextScale !== getCurrentFontScale()) {
      if (window.spwSettings?.setFontSizeScale) window.spwSettings.setFontSizeScale(nextScale);
      else window.spwSettings?.save?.({ fontSizeScale: nextScale });
    }
  };

  const handleTouchEnd = () => {
    if (!state.active) return;
    clearPinchState();
  };

  main.addEventListener('touchstart', handleTouchStart, { passive: true });
  main.addEventListener('touchmove', handleTouchMove, { passive: false });
  main.addEventListener('touchend', handleTouchEnd, { passive: true });
  main.addEventListener('touchcancel', handleTouchEnd, { passive: true });

  return () => {
    main.removeEventListener('touchstart', handleTouchStart);
    main.removeEventListener('touchmove', handleTouchMove);
    main.removeEventListener('touchend', handleTouchEnd);
    main.removeEventListener('touchcancel', handleTouchEnd);
    clearPinchState();
  };
}