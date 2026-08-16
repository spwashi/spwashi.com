import {
  PROBE_ATTR,
  PROBE_TARGET_SELECTOR,
  RESONANCE_KEY_ATTR,
  SPW_LOG_RELATIONSHIPS,
  logger,
} from './shared.js';

export function initResonanceProbe(root) {
  const html = document.documentElement;
  let probeFocus = null;
  let probeHover = null;
  let hoverTimer = 0;
  let lastProbeLogKey = '';
  const HOVER_DELAY = 260;

  function readResonanceState(target) {
    if (!target) return { key: '', concept: '', ingredient: '' };
    const key = (
      target.getAttribute(RESONANCE_KEY_ATTR)
      || target.getAttribute('data-spw-operator')
      || ''
    );
    const concept = target.getAttribute('data-spw-concept') || '';
    const ingredient = target.getAttribute('data-spw-ingredient') || '';
    return { key, concept, ingredient };
  }

  let rafId = 0;

  function scheduleApply() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(apply);
  }

  function apply() {
    const state = probeFocus || probeHover || { key: '', concept: '', ingredient: '' };
    const key = state.key;
    const concept = state.concept;
    const ingredient = state.ingredient;
    const nextLogKey = (key || concept || ingredient) ? `${key}:${concept}:${ingredient}` : 'cleared';
    const shouldLog = nextLogKey !== lastProbeLogKey;
    lastProbeLogKey = nextLogKey;

    if (key) {
      html.setAttribute(PROBE_ATTR, key);
    } else {
      html.removeAttribute(PROBE_ATTR);
    }

    if (concept) {
      html.setAttribute('data-spw-resonance-concept', concept);
    } else {
      html.removeAttribute('data-spw-resonance-concept');
    }

    if (ingredient) {
      html.setAttribute('data-spw-resonance-ingredient', ingredient);
    } else {
      html.removeAttribute('data-spw-resonance-ingredient');
    }

    if (shouldLog) {
      logger.debug(key || concept || ingredient ? 'resonance probe set' : 'resonance probe cleared', { key, concept, ingredient }, SPW_LOG_RELATIONSHIPS.GESTURE);
    }
  }

  function onFocusIn(event) {
    const target = event.target.closest?.(PROBE_TARGET_SELECTOR);
    if (!target) return;
    probeFocus = readResonanceState(target);
    scheduleApply();
  }

  function onFocusOut(event) {
    const next = event.relatedTarget?.closest?.(PROBE_TARGET_SELECTOR);
    if (!next) {
      probeFocus = null;
      scheduleApply();
    }
  }

  function onMouseEnter(event) {
    const target = event.target.closest?.(PROBE_TARGET_SELECTOR);
    if (!target) return;
    if (target.contains(event.relatedTarget)) return;
    clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      probeHover = readResonanceState(target);
      scheduleApply();
    }, HOVER_DELAY);
  }

  function onMouseLeave(event) {
    const target = event.target.closest?.(PROBE_TARGET_SELECTOR);
    if (!target) return;
    if (target.contains(event.relatedTarget)) return;
    clearTimeout(hoverTimer);
    probeHover = null;
    scheduleApply();
  }

  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  root.addEventListener('mouseover', onMouseEnter);
  root.addEventListener('mouseout', onMouseLeave);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    clearTimeout(hoverTimer);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    root.removeEventListener('mouseover', onMouseEnter);
    root.removeEventListener('mouseout', onMouseLeave);
    html.removeAttribute(PROBE_ATTR);
    html.removeAttribute('data-spw-resonance-concept');
    html.removeAttribute('data-spw-resonance-ingredient');
  };
}

export const spwModule = {
  updates: ['attr:data-spw-resonance-probe'],
  mount: (mod, ctx, root) => initResonanceProbe(root),
};