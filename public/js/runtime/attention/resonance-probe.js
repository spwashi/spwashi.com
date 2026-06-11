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

  function readResonanceKey(target) {
    return (
      target?.getAttribute?.(RESONANCE_KEY_ATTR)
      || target?.getAttribute?.('data-spw-operator')
      || ''
    );
  }

  function apply() {
    const key = probeFocus || probeHover;
    const nextLogKey = key || 'cleared';
    const shouldLog = nextLogKey !== lastProbeLogKey;
    lastProbeLogKey = nextLogKey;
    if (key) {
      html.setAttribute(PROBE_ATTR, key);
      if (shouldLog) logger.debug('resonance probe set', { resonanceKey: key }, SPW_LOG_RELATIONSHIPS.GESTURE);
    } else {
      html.removeAttribute(PROBE_ATTR);
      if (shouldLog) logger.debug('resonance probe cleared', {}, SPW_LOG_RELATIONSHIPS.GESTURE);
    }
  }

  function onFocusIn(event) {
    const target = event.target.closest?.(PROBE_TARGET_SELECTOR);
    if (!target) return;
    probeFocus = readResonanceKey(target);
    apply();
  }

  function onFocusOut(event) {
    const next = event.relatedTarget?.closest?.(PROBE_TARGET_SELECTOR);
    if (!next) {
      probeFocus = null;
      apply();
    }
  }

  function onMouseEnter(event) {
    const target = event.target.closest?.(PROBE_TARGET_SELECTOR);
    if (!target) return;
    if (target.contains(event.relatedTarget)) return;
    clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      probeHover = readResonanceKey(target);
      apply();
    }, HOVER_DELAY);
  }

  function onMouseLeave(event) {
    const target = event.target.closest?.(PROBE_TARGET_SELECTOR);
    if (!target) return;
    if (target.contains(event.relatedTarget)) return;
    clearTimeout(hoverTimer);
    probeHover = null;
    apply();
  }

  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  root.addEventListener('mouseover', onMouseEnter);
  root.addEventListener('mouseout', onMouseLeave);

  return () => {
    clearTimeout(hoverTimer);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    root.removeEventListener('mouseover', onMouseEnter);
    root.removeEventListener('mouseout', onMouseLeave);
    html.removeAttribute(PROBE_ATTR);
  };
}