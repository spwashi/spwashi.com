import {
  LOOP_STATES,
  LOOP_TOKENS,
  createLoopRecord,
  getLoopTiming,
} from '/public/js/runtime/interaction-loop.js';
const ARC_TARGET_SELECTOR = [
  '[data-spw-arc]',
  '.operator-chip',
  '.frame-sigil',
  '.syntax-token',
  '.spw-route-menu-link',
  '.spw-nav-toggle',
  'header nav a[href]',
  '.header-sigil[href]',
  'a.frame-card',
  'button.frame-card',
  '.frame-card > a:first-child',
].join(', ');
const POINTER_TARGETS = new Map();
const TIMERS = new WeakMap();
const closestArcTarget = (target, root) => {
  if (!(target instanceof Element)) return null;
  const match = target.closest(ARC_TARGET_SELECTOR);
  return match && root.contains(match) ? match : null;
};
const arcToken = (target) => {
  if (target.matches('.operator-chip, [data-spw-operator]')) return LOOP_TOKENS.OPERATOR;
  if (target.matches('[data-spw-form], [data-spw-brace]')) return LOOP_TOKENS.BRACE;
  if (target.matches('.spw-nav-toggle, nav a[href]')) return LOOP_TOKENS.MODE;
  return LOOP_TOKENS.SURFACE;
};
const clearTimers = (target) => {
  TIMERS.get(target)?.forEach((timer) => window.clearTimeout(timer));
  TIMERS.delete(target);
};
const remember = (target, timer) => {
  TIMERS.set(target, [...(TIMERS.get(target) || []), timer]);
};
const setLoop = (target, state) => {
  const record = createLoopRecord(state, arcToken(target));
  target.dataset.spwLoopState = record.state;
  target.dataset.spwLoopToken = record.token;
  target.dataset.spwLoopLabel = record.label;
};
const clearArc = (target) => {
  clearTimers(target);
  if (target.dataset.spwArcAuto === 'true') delete target.dataset.spwArc;
  delete target.dataset.spwArcAuto;
  delete target.dataset.spwInteractionArc;
  delete target.dataset.spwLoopState;
  delete target.dataset.spwLoopToken;
  delete target.dataset.spwLoopLabel;
};
const setArc = (target, arcState, loopState) => {
  target.dataset.spwInteractionArc = arcState;
  if (!target.hasAttribute('data-spw-arc')) {
    target.dataset.spwArc = 'auto';
    target.dataset.spwArcAuto = 'true';
  }
  setLoop(target, loopState);
};
const prime = (target) => {
  clearTimers(target);
  setArc(target, 'prime', LOOP_STATES.PREVIEW);
};
const land = (target) => {
  clearTimers(target);
  const timing = getLoopTiming();
  setArc(target, 'land', LOOP_STATES.ACTIVATED);
  remember(target, window.setTimeout(() => setArc(target, 'residue', LOOP_STATES.RESOLVED),
    Math.max(90, Math.round(timing.previewReleaseMs * 0.75))));
  remember(target, window.setTimeout(() => clearArc(target),
    Math.max(420, Math.round(timing.resolveMs * 0.72))));
};
export function bindArcLifecycle(root = document) {
  const host = root instanceof Document ? root : root.ownerDocument || document;
  const scope = root instanceof Document ? root.documentElement : root;
  const onPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    const target = closestArcTarget(event.target, scope);
    if (!target) return;
    POINTER_TARGETS.set(event.pointerId, target);
    prime(target);
  };
  const onPointerEnd = (event) => {
    const target = POINTER_TARGETS.get(event.pointerId) || closestArcTarget(event.target, scope);
    POINTER_TARGETS.delete(event.pointerId);
    if (target) land(target);
  };
  const onKey = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = closestArcTarget(event.target, scope);
    if (!target) return;
    if (event.type === 'keydown') prime(target);
    else land(target);
  };
  host.addEventListener('pointerdown', onPointerDown, true);
  host.addEventListener('pointerup', onPointerEnd, true);
  host.addEventListener('pointercancel', onPointerEnd, true);
  host.addEventListener('keydown', onKey, true);
  host.addEventListener('keyup', onKey, true);
  return () => {
    host.removeEventListener('pointerdown', onPointerDown, true);
    host.removeEventListener('pointerup', onPointerEnd, true);
    host.removeEventListener('pointercancel', onPointerEnd, true);
    host.removeEventListener('keydown', onKey, true);
    host.removeEventListener('keyup', onKey, true);
    scope.querySelectorAll?.('[data-spw-interaction-arc]').forEach(clearArc);
  };
}
