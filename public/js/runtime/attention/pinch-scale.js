import { bindPinchTextScale, supportsPinchTextScaleInput } from '/public/js/kernel/pinch-text-scale.js';
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

// The gesture lives in kernel/pinch-text-scale.js, import-free, so spw.quest's peer
// build can carry it; this module binds it to the site's settings and attention helpers.
export { supportsPinchTextScaleInput };

export function initPinchTextScale(root) {
  if (!supportsPinchTextScaleInput()) return () => {};
  const main = root?.matches?.('main') ? root : root?.querySelector?.('main');
  if (!(main instanceof HTMLElement)) return () => {};
  const doc = main.ownerDocument || document;
  return bindPinchTextScale({
    main,
    steps: FONT_SCALE_STEPS,
    getScale: () => getCurrentFontScale(doc),
    setScale: (nextScale) => {
      const view = doc.defaultView || window;
      if (view.spwSettings?.setFontSizeScale) view.spwSettings.setFontSizeScale(nextScale);
      else view.spwSettings?.save?.({ fontSizeScale: nextScale });
    },
    isEnabled: () => isPinchTextScaleEnabled(doc),
    onDisabledPinch: () => announcePinchDisabledHint(doc),
    activeAttr: PINCH_ACTIVE_ATTR,
    write: writeAttributes,
  });
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'attention-pinch-scale',
  mount: (ctx, root) => initPinchTextScale(resolveAttentionMain(ctx, root) || root),
  describes: 'attention[pinch-scale] optional coarse-pointer text scale preview',
  timingArc: 'interaction-attention',
  effectScope: ['css-vars', 'listeners', 'root-state', 'window'],
});

export const spwModule = SPW_MODULE_EXPORT;
