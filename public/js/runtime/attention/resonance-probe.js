import { getOperatorDefinition } from '/public/js/kernel/operator-detection.js';
import {
  PROJECTION_TIERS,
  supportsFinePointerHover,
  writeProjectionTier,
} from '/public/js/kernel/dom-contracts.js';
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

const CURIOSITY_OPERATORS = new Set([
  'probe',
  'potential',
  'action',
  'normalize',
  'measure',
]);

const RELATIONSHIP_OPERATORS = new Set([
  'ref',
  'route',
  'stream',
  'surface',
  'substrate',
  'meta',
  'resource',
  'support',
  'perspective',
  'subject',
  'confluence',
]);

const ARCHITECTURE_OPERATORS = new Set([
  'frame',
  'vibration',
  'address',
  'integration',
  'object',
  'value',
  'binding',
]);

function inferRelation(operatorType = '') {
  if (!operatorType) return '';
  if (CURIOSITY_OPERATORS.has(operatorType)) return 'curiosity';
  if (RELATIONSHIP_OPERATORS.has(operatorType)) return 'relationship';
  if (ARCHITECTURE_OPERATORS.has(operatorType)) return 'architecture';
  return '';
}

function readResonanceState(target) {
  if (!target) return { key: '', family: '', concept: '', ingredient: '', navTarget: '', sigil: '' };
  const rawKey = (
    target.getAttribute(RESONANCE_KEY_ATTR)
    || target.getAttribute('data-spw-operator')
    || ''
  );
  const def = rawKey ? getOperatorDefinition(rawKey) : null;
  const key = def?.type || String(rawKey).trim().toLowerCase();
  const family = def?.family || '';
  const sigil = def?.sigil || '';
  const concept = target.getAttribute('data-spw-concept') || '';
  const ingredient = target.getAttribute('data-spw-ingredient') || '';
  const navTarget = target.getAttribute('data-spw-target') || '';
  return { key, family, concept, ingredient, navTarget, sigil };
}

export function initResonanceProbe(root) {
  if (!root?.addEventListener) return () => {};
  const doc = root.ownerDocument || document;
  const html = doc.documentElement;
  const hoverCapable = supportsFinePointerHover(doc.defaultView);
  let probeFocus = null;
  let probeHover = null;
  let hoverTimer = 0;
  let lastProbeLogKey = '';
  const HOVER_DELAY = 260;
  const abort = new AbortController();
  const { signal } = abort;

  let rafId = 0;
  let markedTargetEls = [];
  let markedBlockEls = [];
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

  function clearBlockResonance() {
    for (const el of markedBlockEls) {
      writeProjectionTier(el, PROJECTION_TIERS.TRANSIENT, { spwBlockResonance: null });
    }
    markedBlockEls = [];
  }

  function applyBlockResonance(key, concept, sigil) {
    clearBlockResonance();
    if (!key && !concept && !sigil) return;

    const blocks = Array.from(doc.querySelectorAll('[data-spw-definition], [data-spw-ref], script[type="text/spw"]'));
    for (const block of blocks) {
      const def = block.getAttribute('data-spw-definition') || '';
      const ref = block.getAttribute('data-spw-ref') || '';
      const text = block.textContent || '';
      const matchesOp = (
        (key && (def.includes(key) || ref.includes(key) || text.includes(key)))
        || (sigil && (def.includes(sigil) || ref.includes(sigil) || text.includes(sigil)))
      );
      const matchesConcept = concept && (def.includes(concept) || ref.includes(concept) || text.includes(concept));
      if (matchesOp || matchesConcept) {
        writeProjectionTier(block, PROJECTION_TIERS.TRANSIENT, { spwBlockResonance: 'echoed' });
        markedBlockEls.push(block);
      }
    }
  }

  function scheduleApply() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(apply);
  }

  function apply() {
    const pinnedProbe = readPinnedProbe(doc);
    const pinnedDef = pinnedProbe ? getOperatorDefinition(pinnedProbe) : null;
    const pinnedState = pinnedProbe
      ? { key: pinnedProbe, family: pinnedDef?.family || '', concept: '', ingredient: '', navTarget: '', sigil: pinnedDef?.sigil || '' }
      : { key: '', family: '', concept: '', ingredient: '', navTarget: '', sigil: '' };
    const state = probeFocus || probeHover || pinnedState;
    const key = state.key;
    const family = state.family;
    const concept = state.concept;
    const ingredient = state.ingredient;
    const sigil = state.sigil || '';
    applyTargetKin(state.navTarget);
    applyBlockResonance(key, concept, sigil);

    const relation = inferRelation(key);
    if (relation) {
      html.setAttribute('data-spw-probe-relation', relation);
    } else {
      html.removeAttribute('data-spw-probe-relation');
    }

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
    if (!next || !root.contains(next)) {
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
  // Visible/idle mounts may happen after the reader has already focused a chip.
  const focused = doc.activeElement?.closest?.(PROBE_TARGET_SELECTOR);
  if (focused && root.contains(focused)) {
    probeFocus = readResonanceState(focused);
    scheduleApply();
  }

  return () => {
    abort.abort();
    if (rafId) cancelAnimationFrame(rafId);
    clearTimeout(hoverTimer);
    clearTargetKin();
    clearBlockResonance();
    lastNavTarget = '';
    if (!readPinnedProbe(doc)) html.removeAttribute(PROBE_ATTR);
    html.removeAttribute('data-spw-resonance-family');
    html.removeAttribute('data-spw-resonance-concept');
    html.removeAttribute('data-spw-resonance-ingredient');
    html.removeAttribute('data-spw-probe-relation');
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'attention-resonance-probe',
  mount: (ctx, root) => initResonanceProbe(
    resolveAttentionMain(ctx, root) || resolveAttentionDocument(ctx, root),
  ),
  describes: 'attention[operator|family|concept|ingredient|nav-target|relation] resonance probe',
  timingArc: 'visible-attention',
  effectScope: 'root-state focus-listener conditional-hover-listener block-echo',
});

export const spwModule = SPW_MODULE_EXPORT;
