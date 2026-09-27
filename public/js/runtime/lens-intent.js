/**
 * lens-intent.js — a lens you hold is an intent you carry.
 *
 * Tap a lens seat and it sits for this page (runtime/lens-modes.js answers,
 * as the one writer of lens state). Hold it and its operator also becomes the
 * visit's intent: the seat wears a ring, and every page whose lens has a seat
 * with the same operator offers that seat, marked and never switched for the
 * reader. Hold a carried seat again to set the intent down.
 *
 * The operator is the shared vocabulary. Lens seats author dozens of mode
 * names across the site, and every seat names an operator; the kernel
 * resolves aliases (integrate, object → integration), so "^ build" on Home
 * and "^ syntax" on Software are the same intent.
 *
 * The hold fills its ring while the finger or key is down, so the reader
 * feels what charging becomes, and lands on release (reward contract). The seat
 * answers the gesture alone: a hold does not reach its frame (seats are
 * native controls; kernel/dom-contracts.js). Enter or Space held on a focused
 * seat carries too.
 *
 * Session-scoped: an intent belongs to a visit, and nothing learns who is
 * visiting. Contract: .spw/caches/intent-across-pages-2026-09.spw s2.
 */

import { getOperatorDefinition } from '/public/js/kernel/operator-detection.js';

const SEAT_SELECTOR = '.mode-switch .frame-sigil[data-set-mode][data-spw-operator]';
const STORAGE_KEY = 'spw:intent:v1';
const HOLD_MS = 450;
const MOVE_TOLERANCE = 10;

let mounted = null;
// A hold belongs to the gesture, not to a module instance: the loader can
// remount this module mid-hold, and the carry must still land.
let hold = null;
let justCarried = null;

function readIntent() {
  try {
    const intent = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    return intent?.operator ? intent : null;
  } catch {
    return null;
  }
}

function writeIntent(intent) {
  try {
    if (intent) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked: the carry lasts for this page only */
  }
}

function operatorOf(seat) {
  return getOperatorDefinition(seat.dataset.spwOperator || '') || null;
}

// The seat's own word, without a sigil some seats print in front of it.
function seatWord(seat, prefix = '') {
  const word = (seat.querySelector('span')?.textContent || seat.textContent || '').trim();
  return prefix && word.startsWith(prefix) ? word.slice(prefix.length).trim() : word;
}

function describe(intent) {
  return `${intent.sigil} ${intent.word}`.trim();
}

function mark(intent) {
  for (const seat of document.querySelectorAll(SEAT_SELECTOR)) {
    const carried = Boolean(intent && operatorOf(seat)?.type === intent.operator);
    seat.classList.toggle('is-carried', carried);
    if (carried) seat.setAttribute('aria-description', `Your carried intent, ${describe(intent)}. Hold to set it down.`);
    else seat.removeAttribute('aria-description');
  }
}

// Set directly: a lens view transition suppresses rendering, and a message
// queued behind requestAnimationFrame would wait for it.
function announce(message) {
  if (mounted?.live) mounted.live.textContent = message;
}

function carry(seat) {
  const operator = operatorOf(seat);
  if (!operator) return;
  const current = readIntent();
  const next = current?.operator === operator.type
    ? null
    : {
      operator: operator.type,
      sigil: operator.prefix || '',
      verb: operator.intent || '',
      word: seatWord(seat, operator.prefix || ''),
      mode: seat.dataset.setMode,
      from: location.pathname,
      at: Date.now(),
    };
  writeIntent(next);
  mark(next);
  navigator.vibrate?.(next ? [4, 20, 8] : 6);
  announce(next
    ? `Carrying ${describe(next)} across pages. Hold it again to set it down.`
    : `Set down ${describe(current)}.`);
  seat.classList.add('is-carry-landed');
  setTimeout(() => seat.classList.remove('is-carry-landed'), 600);
}

/* A hold is measured, not timed. The ring fills in CSS while the finger or
   key is down; the carry lands on release when the release event's own
   timestamp is HOLD_MS past the press's. A timer cannot tell a tap from a
   hold on a busy page: it fired late and dropped real holds behind a lens
   view transition, and fired first and carried a 120 ms tap during boot. */
function startHold(seat, finish, origin, startedAt) {
  cancelHold();
  seat.classList.add('is-holding');
  hold = { seat, origin, startedAt, finish };
}

function cancelHold() {
  if (!hold) return;
  hold.seat.classList.remove('is-holding');
  hold = null;
}

function releaseHold(event) {
  if (!hold) return;
  if (event.timeStamp - hold.startedAt < HOLD_MS) {
    cancelHold();
    return;
  }
  const { seat, finish } = hold;
  seat.classList.remove('is-holding');
  hold = null;
  justCarried = seat;
  if (seat.isConnected) finish(seat);
}

function onPointerDown(event) {
  const seat = event.target instanceof Element ? event.target.closest(SEAT_SELECTOR) : null;
  if (!seat || event.button !== 0 || !event.isPrimary) return;
  startHold(seat, carry, { x: event.clientX, y: event.clientY, pointerId: event.pointerId }, event.timeStamp);
}

function onPointerMove(event) {
  const origin = hold?.origin;
  if (!origin || event.pointerId !== origin.pointerId) return;
  if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > MOVE_TOLERANCE) cancelHold();
}

function onPointerEnd(event) {
  const origin = hold?.origin;
  if (!origin || event.pointerId !== origin.pointerId) return;
  if (event.type === 'pointercancel') cancelHold();
  else releaseHold(event);
}

function onKeyDown(event) {
  if ((event.key !== 'Enter' && event.key !== ' ') || event.repeat) return;
  const seat = event.target instanceof Element ? event.target.closest(SEAT_SELECTOR) : null;
  if (seat) startHold(seat, carry, null, event.timeStamp);
}

function onKeyUp(event) {
  if ((event.key === 'Enter' || event.key === ' ') && hold && !hold.origin) releaseHold(event);
}

// A long press on a touch screen can open a callout or menu on the seat.
function onContextMenu(event) {
  const seat = event.target instanceof Element ? event.target.closest(SEAT_SELECTOR) : null;
  if (seat && (hold?.seat === seat || justCarried === seat)) event.preventDefault();
}

export function initLensIntent() {
  if (mounted || !document.querySelector(SEAT_SELECTOR)) return;
  const live = document.createElement('p');
  live.className = 'mode-switch-intent-status';
  live.setAttribute('aria-live', 'polite');
  document.body.append(live);
  mounted = { live };
  mark(readIntent());
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('pointermove', onPointerMove, true);
  document.addEventListener('pointerup', onPointerEnd, true);
  document.addEventListener('pointercancel', onPointerEnd, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('keyup', onKeyUp, true);
  document.addEventListener('contextmenu', onContextMenu, true);
}

export function unmountLensIntent() {
  if (!mounted) return;
  if (hold && !hold.seat.isConnected) cancelHold();
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.removeEventListener('pointermove', onPointerMove, true);
  document.removeEventListener('pointerup', onPointerEnd, true);
  document.removeEventListener('pointercancel', onPointerEnd, true);
  document.removeEventListener('keydown', onKeyDown, true);
  document.removeEventListener('keyup', onKeyUp, true);
  document.removeEventListener('contextmenu', onContextMenu, true);
  mounted.live.remove();
  mounted = null;
}

export { unmountLensIntent as unmount };
