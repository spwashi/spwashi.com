import { writeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { getSiteSettings, resolveTuningDiscoverability } from '/public/js/kernel/site-settings.js';
import { registerDomSyncTask } from '/public/js/runtime/dom-sync-hub.js';

const SLOT_SIGILS = Object.freeze({
  header: '⌁',
  meta: '◇',
  body: '¶',
  figure: '◫',
  actions: '↯',
  footer: '⌁',
  caption: '⁘',
});

const GESTURE_VERB_LABELS = Object.freeze({
  tap: 'tap',
  hold: 'hold',
  'double-click': 'dbl',
  swipe: 'swipe',
  drag: 'drag',
});

const GESTURE_ACTION_LABELS = Object.freeze({
  inspect: 'inspect',
  prime: 'prime',
  'prime-to-cauldron': 'cauldron',
  'prime-semantic-slice': 'slice',
  'toggle-lens': 'lens',
  'expand-full-wonder': 'wonder',
  'expand-trail': 'trail',
  'gather-search-term': 'gather',
  'cauldron-capture': 'capture',
});

const GESTURE_CONTRACT_SELECTOR = [
  '[data-spw-gesture-contract]',
  '.spw-living-term[data-spw-living-term]',
  '[data-spw-living-term]',
].join(', ');

const SLOT_HOST_SELECTOR = '.site-frame, .frame-card, .vibe-widget';

function shouldAnnotate() {
  const settings = getSiteSettings();
  const mode = document.documentElement.dataset.spwTuningDiscoverability
    || resolveTuningDiscoverability(settings);
  const stance = settings.metacognitiveStance || 'witness';
  if (settings.cognitiveHandles === 'on') return true;
  if (mode !== 'quiet') return true;
  if (stance === 'composer' || stance === 'overflow') return true;
  if (stance === 'integrator' && settings.developmentalIndicators === 'on') return true;
  return false;
}

function humanizeGestureAction(action = '') {
  if (GESTURE_ACTION_LABELS[action]) return GESTURE_ACTION_LABELS[action];
  return action.replace(/-/g, ' ').trim();
}

export function parseGestureContract(contract = '') {
  return String(contract)
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [verb, action] = part.split(':');
      const verbLabel = GESTURE_VERB_LABELS[verb] || verb;
      const actionLabel = humanizeGestureAction(action || '');
      return action ? `${verbLabel} ${actionLabel}` : verbLabel;
    })
    .join(' · ');
}

function annotateGestureContracts(root = document) {
  root.querySelectorAll(GESTURE_CONTRACT_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const contract = node.getAttribute('data-spw-gesture-contract');
    if (!contract) return;
    const hint = parseGestureContract(contract);
    if (hint) node.dataset.spwGestureHint = hint;
  });
}

function annotateSlotLabels(root = document) {
  root.querySelectorAll('[data-spw-slot]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const slot = node.getAttribute('data-spw-slot');
    if (!slot) return;
    const sigil = SLOT_SIGILS[slot] || '·';
    node.dataset.spwSlotLabel = `${sigil} ${slot}`;
  });
}

function ensureAnatomyStackRail(frame) {
  if (!(frame instanceof HTMLElement)) return;
  if (!shouldAnnotate()) return;

  const slots = [...frame.querySelectorAll(':scope > [data-spw-slot]')]
    .map((node) => node.getAttribute('data-spw-slot'))
    .filter(Boolean);

  if (slots.length < 2) {
    delete frame.dataset.spwAnatomyStack;
    frame.querySelector('.spw-anatomy-stack-rail')?.remove();
    return;
  }

  frame.dataset.spwAnatomyStack = 'true';

  let rail = frame.querySelector(':scope > .spw-anatomy-stack-rail');
  if (!(rail instanceof HTMLElement)) {
    rail = document.createElement('div');
    rail.className = 'spw-anatomy-stack-rail';
    rail.setAttribute('aria-hidden', 'true');
    frame.prepend(rail);
  }

  rail.replaceChildren();
  slots.forEach((slot) => {
    const item = document.createElement('span');
    item.className = 'spw-anatomy-stack-rail__item';
    item.dataset.spwSlotActive = frame.querySelector(`:scope > [data-spw-slot="${slot}"]:is(:hover, :focus-within)`) ? 'true' : 'false';
    item.innerHTML = `<span class="spw-anatomy-stack-rail__sigil" aria-hidden="true">${SLOT_SIGILS[slot] || '·'}</span><span>${slot}</span>`;
    rail.append(item);
  });
}

function annotateAnatomyStacks(root = document) {
  root.querySelectorAll(SLOT_HOST_SELECTOR).forEach((frame) => {
    if (!shouldAnnotate()) {
      delete frame.dataset.spwAnatomyStack;
      frame.querySelector('.spw-anatomy-stack-rail')?.remove();
      return;
    }
    ensureAnatomyStackRail(frame);
  });
}

export function refreshGestureAnatomy(root = document) {
  if (!shouldAnnotate()) {
    root.querySelectorAll('[data-spw-gesture-hint], [data-spw-slot-label]').forEach((node) => {
      delete node.dataset.spwGestureHint;
      delete node.dataset.spwSlotLabel;
    });
    root.querySelectorAll('[data-spw-anatomy-stack="true"]').forEach((frame) => {
      delete frame.dataset.spwAnatomyStack;
      frame.querySelector('.spw-anatomy-stack-rail')?.remove();
    });
    writeDatasetValues(document.documentElement, { spwGestureAnatomy: null });
    return;
  }

  annotateGestureContracts(root);
  annotateSlotLabels(root);
  annotateAnatomyStacks(root);
  writeDatasetValues(document.documentElement, { spwGestureAnatomy: 'active' });
}

export function initGestureAnatomy(ctx = null) {
  const unregister = registerDomSyncTask('gesture-anatomy', () => refreshGestureAnatomy(), ctx);

  const onPointerOver = (event) => {
    const slot = event.target.closest?.('[data-spw-slot]');
    const frame = slot?.closest?.(SLOT_HOST_SELECTOR);
    if (frame) ensureAnatomyStackRail(frame);
  };
  document.addEventListener('pointerover', onPointerOver, true);

  const cleanup = () => {
    unregister();
    document.removeEventListener('pointerover', onPointerOver, true);
  };

  ctx?.addCleanup?.(cleanup);

  return {
    cleanup,
    refresh: () => refreshGestureAnatomy(),
  };
}