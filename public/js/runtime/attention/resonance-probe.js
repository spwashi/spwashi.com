import { getOperatorDefinition } from '/public/js/kernel/operator-detection.js';
import {
  PROBE_ATTR,
  PROBE_TARGET_SELECTOR,
  RESONANCE_KEY_ATTR,
  SPW_LOG_RELATIONSHIPS,
  logger,
  resolveAttentionMain,
  resolveAttentionDocument,
} from './shared.js';
import { readPinnedProbe } from './capture-pins.js';

function readResonanceState(target) {
  if (!target) return { key: '', family: '', concept: '', ingredient: '', navTarget: '' };
  const rawKey = (
    target.getAttribute(RESONANCE_KEY_ATTR)
    || target.getAttribute('data-spw-operator')
    || ''
  );
  const def = rawKey ? getOperatorDefinition(rawKey) : null;
  const key = def?.type || String(rawKey).trim().toLowerCase();
  // Kin operators (frame/layer/vibration, ground/binding, integration/subject,
  // concept-edge/concept) share a family in OPERATOR_DEFINITIONS but were
  // never grouped in CSS — pinning "frame" only ever echoed other "frame"
  // chips. wonder.css reads this to give same-family operators a fainter
  // echo alongside the existing exact-match one.
  const family = def?.family || '';
  const concept = target.getAttribute('data-spw-concept') || '';
  const ingredient = target.getAttribute('data-spw-ingredient') || '';
  // Quick-move chips (home/other hubs) author data-spw-target as a freeform
  // destination label ("rpg-images", "prompt-handles") — authored 25 times,
  // read by nothing. Unlike operator type, target values are high-cardinality
  // and freeform, so they cannot be enumerated as CSS selectors the way the
  // operator families above are; matching is done directly against the DOM.
  const navTarget = target.getAttribute('data-spw-target') || '';
  return { key, family, concept, ingredient, navTarget };
}

export function initResonanceProbe(root) {
  if (!root?.addEventListener) return () => {};
  const doc = root.ownerDocument || document;
  const html = doc.documentElement;
  const hoverCapable = doc.defaultView?.matchMedia?.('(hover: hover) and (pointer: fine)').matches === true;
  let probeFocus = null;
  let probeHover = null;
  let hoverTimer = 0;
  let lastProbeLogKey = '';
  const HOVER_DELAY = 260;
  const abort = new AbortController();
  const { signal } = abort;

  let rafId = 0;
  let markedTargetEls = [];
  let lastNavTarget = '';

  function clearTargetKin() {
    for (const el of markedTargetEls) el.removeAttribute('data-spw-target-kin');
    markedTargetEls = [];
  }

  function applyTargetKin(navTarget) {
    if (navTarget === lastNavTarget) return;
    clearTargetKin();
    lastNavTarget = navTarget;
    if (!navTarget) return;
    const escaped = window.CSS?.escape ? CSS.escape(navTarget) : navTarget.replace(/["\\]/g, '\\$&');
    markedTargetEls = Array.from(doc.querySelectorAll(`[data-spw-target="${escaped}"]`));
    for (const el of markedTargetEls) el.setAttribute('data-spw-target-kin', 'true');
  }

  function scheduleApply() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(apply);
  }

  function apply() {
    const pinnedProbe = readPinnedProbe(doc);
    const pinnedState = pinnedProbe
      ? { key: pinnedProbe, family: getOperatorDefinition(pinnedProbe)?.family || '', concept: '', ingredient: '', navTarget: '' }
      : { key: '', family: '', concept: '', ingredient: '', navTarget: '' };
    const state = probeFocus || probeHover || pinnedState;
    const key = state.key;
    const family = state.family;
    const concept = state.concept;
    const ingredient = state.ingredient;
    applyTargetKin(state.navTarget);
    const nextLogKey = (key || concept || ingredient) ? `${key}:${concept}:${ingredient}` : 'cleared';
    const shouldLog = nextLogKey !== lastProbeLogKey;
    lastProbeLogKey = nextLogKey;

    if (key) {
      html.setAttribute(PROBE_ATTR, key);
    } else {
      html.removeAttribute(PROBE_ATTR);
    }

    if (family) {
      html.setAttribute('data-spw-resonance-family', family);
    } else {
      html.removeAttribute('data-spw-resonance-family');
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

  root.addEventListener('focusin', onFocusIn, { signal });
  root.addEventListener('focusout', onFocusOut, { signal });
  if (hoverCapable) {
    root.addEventListener('mouseover', onMouseEnter, { signal });
    root.addEventListener('mouseout', onMouseLeave, { signal });
  }
  if (readPinnedProbe(doc)) scheduleApply();

  return () => {
    abort.abort();
    if (rafId) cancelAnimationFrame(rafId);
    clearTimeout(hoverTimer);
    clearTargetKin();
    lastNavTarget = '';
    if (!readPinnedProbe(doc)) html.removeAttribute(PROBE_ATTR);
    html.removeAttribute('data-spw-resonance-family');
    html.removeAttribute('data-spw-resonance-concept');
    html.removeAttribute('data-spw-resonance-ingredient');
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'attention-resonance-probe',
  mount: (ctx, root) => initResonanceProbe(
    resolveAttentionMain(ctx, root) || resolveAttentionDocument(ctx, root),
  ),
  describes: 'attention[operator|family|concept|ingredient|nav-target] resonance probe',
  timingArc: 'visible-attention',
  effectScope: 'root-state focus-listener conditional-hover-listener',
});

export const spwModule = SPW_MODULE_EXPORT;
