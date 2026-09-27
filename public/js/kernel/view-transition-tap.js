/**
 * view-transition-tap.js — a tap during a view transition is never eaten.
 *
 * While a view transition plays, the browser hit-tests its overlay instead of
 * the page: every pointer lands on <html>, and pointer-events on
 * ::view-transition does not change that (Chrome 152). A quick second lens was
 * dropped, and a quick second folio flip light-dismissed its view. Contact
 * outranks motion: a pointerdown that lands on <html> during a transition
 * finishes the transition at once, and when the pointer lifts, the click goes
 * to the control that is actually under it.
 *
 * Owners of view transitions (runtime/lens-modes.js, modules/design/folio-shelf.js)
 * install it before they start one. It is idempotent and does nothing where
 * document.activeViewTransition is missing.
 * Contract: .spw/conventions/interaction-microstates.spw#discharge_motion.
 */

const CONTROL_SELECTOR = [
  'button',
  'a[href]',
  'label',
  'input',
  'select',
  'textarea',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="switch"]',
].join(', ');

const installedOn = new WeakSet();
let pending = null;

function onPointerDown(event) {
  const doc = event.currentTarget;
  const transition = doc.activeViewTransition;
  if (!transition || !event.isPrimary || event.target !== doc.documentElement) return;
  transition.skipTransition();
  pending = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
}

function onPointerUp(event) {
  if (!pending || event.pointerId !== pending.pointerId) return;
  const { x, y } = pending;
  pending = null;
  const doc = event.currentTarget;
  // The native click lands on <html>; hand it to what the reader touched,
  // after the skipped transition has let go of the page.
  doc.defaultView.requestAnimationFrame(() => {
    doc.elementFromPoint(x, y)?.closest(CONTROL_SELECTOR)?.click();
  });
}

function onPointerCancel() {
  pending = null;
}

export function ensureViewTransitionTap(doc = globalThis.document) {
  if (!doc || installedOn.has(doc) || !('activeViewTransition' in doc)) return;
  installedOn.add(doc);
  doc.addEventListener('pointerdown', onPointerDown, true);
  doc.addEventListener('pointerup', onPointerUp, true);
  doc.addEventListener('pointercancel', onPointerCancel, true);
}
