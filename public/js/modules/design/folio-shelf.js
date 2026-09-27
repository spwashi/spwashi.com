/**
 * folio-shelf.js — travel for the folio shelf (/design/folios/#release-set).
 *
 * The shelf already works as HTML: each tile opens a native popover, the
 * thread radios filter with :has(), and the views flip by popovertarget. This
 * module changes how those moves travel, and fixes one thing HTML cannot: a
 * flip button sits inside the view it leaves, so a native flip opens the
 * neighbor nested on top of it. Three flips left three views and three
 * backdrops open, and focus fell to the body. Here a flip replaces the view
 * and focus lands on the same control in the next one; close hands focus back
 * to the tile the piece belongs to.
 *
 * Each move is a discharge (.spw/conventions/interaction-microstates.spw#discharge_motion):
 *   open    project   the scan lifts out of its slot and becomes the plate
 *   flip    transfer  the plate slides toward the neighbor it becomes (← → too)
 *   close   ground    the scan settles back into its slot (Esc too)
 *   thread  induct    the thread's tiles glide together; the rest fall away
 * The signatures live in components/folio-shelf.css. With reduced motion,
 * capture mode, or no view-transition types, the same moves happen in place.
 */

import { ensureViewTransitionTap } from '/public/js/kernel/view-transition-tap.js';

const ROOT_SELECTOR = '.folio-release';
const VIEW_SELECTOR = '.folio-view';
const THREAD_SELECTOR = 'input[type="radio"][name="folio-thread"]';
const SCAN_NAME = 'folio-scan';
const CARD_NAME = 'folio-view';

let mounted = null;

function supportsTypedTransitions() {
  return typeof document.startViewTransition === 'function'
    && typeof ViewTransition !== 'undefined'
    && 'types' in ViewTransition.prototype;
}

function motionAllowed() {
  if (!supportsTypedTransitions()) return false;
  const html = document.documentElement;
  if (html.dataset.spwReduceMotion === 'on') return false;
  const capture = html.dataset.spwCaptureMode;
  if (capture && capture !== 'default') return false;
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const tileOf = (view) => view?.closest('.folio-tile') || null;
const openerOf = (view) => tileOf(view)?.querySelector('.folio-tile__open') || null;
const slotOf = (view) => openerOf(view)?.querySelector('picture') || null;
const plateOf = (view) => view?.querySelector('.folio-view__plate') || null;
const plateImageOf = (view) => plateOf(view)?.querySelector('img') || null;
const viewFor = (button) => {
  const target = document.getElementById(button?.getAttribute('popovertarget') || '');
  return target?.matches(VIEW_SELECTOR) ? target : null;
};

/* A name belongs to the move that wrote it. A newer move skips an older one,
   and the older move's cleanup must not strip names the newer move just set. */
const nameOwner = new WeakMap();

function writeNames(parts, move, named) {
  for (const [el, name] of parts) {
    if (!el) continue;
    el.style.viewTransitionName = name;
    nameOwner.set(el, move);
    named.add(el);
  }
}

function releaseNames(move, named) {
  for (const el of named) {
    if (nameOwner.get(el) !== move) continue;
    el.style.viewTransitionName = '';
    nameOwner.delete(el);
  }
}

function travel({ from = [], to = () => [], update, types }) {
  if (!motionAllowed()) {
    update();
    return;
  }

  const move = {};
  const named = new Set();
  writeNames(from, move, named);

  const transition = document.startViewTransition({
    update: async () => {
      releaseNames(move, named);
      await update();
      writeNames(to(), move, named);
    },
    types,
  });

  const release = () => releaseNames(move, named);
  transition.ready.catch(() => {});
  transition.updateCallbackDone.catch(() => {});
  transition.finished.then(release, release);
}

function showView(view, source) {
  if (view.matches(':popover-open')) return;
  // `source` keeps the tile as the view's invoker, so focus order and Esc
  // behave as they do for a native popovertarget open.
  view.showPopover(source ? { source } : undefined);
}

/* A plate's scan is lazy. Warm it on intent (a tile under the pointer or
   focus) and warm both neighbors whenever a view opens, so the piece lands on
   a picture instead of an empty plate that fills in after the move. */
function warm(view) {
  const img = plateImageOf(view);
  if (img?.loading === 'lazy') img.loading = 'eager';
  return img;
}

function warmNeighbors(view) {
  warm(neighborOf(view, 'prev'));
  warm(neighborOf(view, 'next'));
}

/* The new picture is taken when the update settles; wait briefly for the
   scan to decode, never longer than a beat. */
function settled(img, cap = 260) {
  if (!img || (img.complete && img.naturalWidth > 0)) return Promise.resolve();
  return Promise.race([img.decode().catch(() => {}), new Promise((resolve) => setTimeout(resolve, cap))]);
}

function focusFlip(view, direction) {
  const buttons = view.querySelectorAll('.folio-view__flip button');
  const target = direction === 'prev' ? buttons[0] : buttons[buttons.length - 1];
  (target || view.querySelector('button'))?.focus({ preventScroll: true });
}

function bringIntoView(tile) {
  const rect = tile.getBoundingClientRect();
  if (rect.top >= 0 && rect.bottom <= window.innerHeight) return;
  tile.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}

function open(view, opener) {
  mounted.showing = view;
  travel({
    from: [[slotOf(view), SCAN_NAME]],
    to: () => [[plateOf(view), SCAN_NAME], [view, CARD_NAME]],
    update: () => {
      showView(view, opener);
      warmNeighbors(view);
      return settled(warm(view));
    },
    types: ['folio-open'],
  });
}

function flip(current, next, direction) {
  mounted.showing = next;
  travel({
    from: [[plateOf(current), SCAN_NAME], [current, CARD_NAME]],
    to: () => [[plateOf(next), SCAN_NAME], [next, CARD_NAME]],
    update: () => {
      // Shown from outside the current view, the neighbor is not nested in it:
      // opening one auto popover closes the other.
      showView(next, openerOf(next));
      if (current.matches(':popover-open')) current.hidePopover();
      focusFlip(next, direction);
      warmNeighbors(next);
      return settled(warm(next));
    },
    types: ['folio-flip', `folio-flip-${direction}`],
  });
}

function close(view) {
  mounted.showing = null;
  const opener = openerOf(view);
  const onShelf = Boolean(opener?.checkVisibility?.() ?? opener?.offsetParent);
  travel({
    from: [[plateOf(view), SCAN_NAME], [view, CARD_NAME]],
    to: () => (onShelf ? [[slotOf(view), SCAN_NAME]] : []),
    update: () => {
      if (view.matches(':popover-open')) view.hidePopover();
      if (onShelf) {
        bringIntoView(tileOf(view));
        opener.focus({ preventScroll: true });
      } else {
        // The piece's thread is filtered out; the filter is where focus can act.
        mounted?.root.querySelector(`${THREAD_SELECTOR}:checked`)?.focus({ preventScroll: true });
      }
    },
    types: ['folio-close'],
  });
}

/* The view a queued move is heading to. A second press during a move flips
   from there, so quick presses chain instead of repeating the same step. */
function showingView() {
  const { showing, root } = mounted;
  if (showing?.matches(':popover-open') || (showing && document.activeViewTransition)) return showing;
  return root.querySelector(`${VIEW_SELECTOR}:popover-open`);
}

function neighborOf(view, direction) {
  const buttons = view.querySelectorAll('.folio-view__flip button');
  const next = viewFor(direction === 'prev' ? buttons[0] : buttons[buttons.length - 1]);
  return next && next !== view ? next : null;
}

function onClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const thread = target.matches(THREAD_SELECTOR) ? target : null;
  if (thread) {
    onThreadClick(event, thread);
    return;
  }

  const button = target.closest('button[popovertarget]');
  const view = viewFor(button);
  if (!view) return;

  const action = button.getAttribute('popovertargetaction') || 'toggle';
  const current = button.closest(VIEW_SELECTOR);

  if (current && current === view && action !== 'show') {
    event.preventDefault();
    close(view);
  } else if (current && current !== view && action !== 'hide') {
    event.preventDefault();
    const buttons = [...button.closest('.folio-view__flip')?.querySelectorAll('button') || []];
    const direction = buttons.indexOf(button) === 0 ? 'prev' : 'next';
    const from = showingView() || current;
    const to = from === current ? view : neighborOf(from, direction);
    if (to) flip(from, to, direction);
  } else if (!current && action !== 'hide' && !view.matches(':popover-open')) {
    event.preventDefault();
    open(view, button);
  }
}

function onThreadClick(event, input) {
  if (input === mounted.thread || !motionAllowed()) return;
  // Canceling the click restores the previous radio for the "before" picture;
  // the transition then checks the new one and the :has() filter answers it.
  event.preventDefault();
  travel({
    update: () => {
      input.checked = true;
      mounted.thread = input;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    types: ['folio-thread'],
  });
}

function onIntent(event) {
  const opener = event.target instanceof Element ? event.target.closest('.folio-tile__open') : null;
  if (opener) warm(opener.closest('.folio-tile')?.querySelector(VIEW_SELECTOR));
}

function onChange(event) {
  if (event.target instanceof Element && event.target.matches(THREAD_SELECTOR)) {
    mounted.thread = event.target;
  }
}

function onKeydown(event) {
  if (event.defaultPrevented || !mounted) return;
  const view = showingView();
  if (!view) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    close(view);
    return;
  }

  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;

  const direction = event.key === 'ArrowLeft' ? 'prev' : 'next';
  const next = neighborOf(view, direction);
  if (!next) return;
  event.preventDefault();
  flip(view, next, direction);
}

export function initFolioShelf() {
  const root = document.querySelector(ROOT_SELECTOR);
  if (!root || mounted) return;
  mounted = { root, showing: null, thread: root.querySelector(`${THREAD_SELECTOR}:checked`) };
  ensureViewTransitionTap(document);
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  root.addEventListener('pointerover', onIntent);
  root.addEventListener('focusin', onIntent);
  document.addEventListener('keydown', onKeydown);
}

export function unmountFolioShelf() {
  if (!mounted) return;
  mounted.root.removeEventListener('click', onClick);
  mounted.root.removeEventListener('change', onChange);
  mounted.root.removeEventListener('pointerover', onIntent);
  mounted.root.removeEventListener('focusin', onIntent);
  document.removeEventListener('keydown', onKeydown);
  mounted = null;
}

export { unmountFolioShelf as unmount };
