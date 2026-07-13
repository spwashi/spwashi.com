import { writeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { getSiteSettings, resolveTuningDiscoverability } from '/public/js/kernel/site-settings.js';
import { registerDomSyncTask } from '/public/js/runtime/dom-sync-hub.js';
import { isReadingQuietChrome } from '/public/js/runtime/runtime-helpers.js';

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

/** Prefer component-semantics resolved contract when present. */
const GESTURE_CONTRACT_SELECTOR = [
  '[data-spw-gesture-contract-resolved]',
  '[data-spw-gesture-contract]',
  '.spw-living-term[data-spw-living-term]',
  '[data-spw-living-term]',
].join(', ');

const SLOT_HOST_SELECTOR = '.site-frame, .frame-card, .vibe-widget, [data-spw-component-kind], [data-spw-kind="frame"]';

function shouldAnnotate() {
  if (isReadingQuietChrome()) return false;

  const settings = getSiteSettings();
  const mode = document.documentElement.dataset.spwTuningDiscoverability
    || resolveTuningDiscoverability(settings);
  const stance = settings.metacognitiveStance || 'witness';
  if (settings.cognitiveHandles === 'on') return true;
  if (document.documentElement.dataset.spwDebugMode === 'on') return true;
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

function resolveGestureContract(node) {
  if (!(node instanceof HTMLElement)) return '';
  return (
    node.dataset.spwGestureContractResolved
    || node.getAttribute('data-spw-gesture-contract-resolved')
    || node.dataset.spwGestureContract
    || node.getAttribute('data-spw-gesture-contract')
    || ''
  );
}

function resolveThemingPosture(node) {
  if (!(node instanceof HTMLElement)) return '';
  return (
    node.dataset.spwThemingPostureResolved
    || node.dataset.spwThemingPosture
    || node.getAttribute('data-spw-theming-posture-resolved')
    || node.getAttribute('data-spw-theming-posture')
    || ''
  );
}

function annotateGestureContracts(root = document) {
  root.querySelectorAll(GESTURE_CONTRACT_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const contract = resolveGestureContract(node);
    if (!contract) {
      delete node.dataset.spwGestureHint;
      return;
    }
    const hint = parseGestureContract(contract);
    if (hint) node.dataset.spwGestureHint = hint;
    else delete node.dataset.spwGestureHint;
  });
}

function annotateSlotLabels(root = document) {
  root.querySelectorAll('[data-spw-slot]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.closest('.spw-anatomy-stack-rail')) return;
    const slot = node.getAttribute('data-spw-slot');
    if (!slot) return;
    const sigil = SLOT_SIGILS[slot] || '·';
    const label = `${sigil} ${slot}`;
    if (node.dataset.spwSlotLabel !== label) node.dataset.spwSlotLabel = label;
  });
}

function activeSlotName(frame) {
  if (!(frame instanceof HTMLElement)) return '';
  const active = frame.querySelector(':scope > [data-spw-slot]:is(:hover, :focus-within)');
  return active?.getAttribute('data-spw-slot') || '';
}

function ensureAnatomyStackRail(frame) {
  if (!(frame instanceof HTMLElement)) return;
  if (!shouldAnnotate()) return;

  const slots = [...frame.querySelectorAll(':scope > [data-spw-slot]')]
    .map((node) => node.getAttribute('data-spw-slot'))
    .filter(Boolean);

  if (slots.length < 2) {
    delete frame.dataset.spwAnatomyStack;
    delete frame.dataset.spwAnatomyTheming;
    // :scope > only — a descendant query here deletes nested frames' rails,
    // which their own pass re-adds, churning childList mutations every batch.
    frame.querySelector(':scope > .spw-anatomy-stack-rail')?.remove();
    return;
  }

  frame.dataset.spwAnatomyStack = 'true';
  const posture = resolveThemingPosture(frame);
  if (posture) frame.dataset.spwAnatomyTheming = posture;
  else delete frame.dataset.spwAnatomyTheming;

  let rail = frame.querySelector(':scope > .spw-anatomy-stack-rail');
  if (!(rail instanceof HTMLElement)) {
    rail = document.createElement('div');
    rail.className = 'spw-anatomy-stack-rail';
    rail.setAttribute('aria-hidden', 'true');
    rail.dataset.spwAnatomyRail = 'stack';
    frame.prepend(rail);
  }

  const active = activeSlotName(frame);
  // Rebuilding an unchanged rail still emits childList mutations, which
  // re-trigger the dom-sync observer every frame; skip when nothing moved.
  const signature = `${active}|${slots.join(',')}`;
  if (rail.dataset.spwRailSignature === signature) return;
  rail.dataset.spwRailSignature = signature;

  rail.replaceChildren();
  slots.forEach((slot) => {
    const item = document.createElement('span');
    item.className = 'spw-anatomy-stack-rail__item';
    item.dataset.spwSlot = slot;
    item.dataset.spwSlotActive = active === slot ? 'true' : 'false';
    item.innerHTML = `<span class="spw-anatomy-stack-rail__sigil" aria-hidden="true">${SLOT_SIGILS[slot] || '·'}</span><span>${slot}</span>`;
    rail.append(item);
  });
}

function annotateAnatomyStacks(root = document) {
  root.querySelectorAll(SLOT_HOST_SELECTOR).forEach((frame) => {
    if (!shouldAnnotate()) {
      delete frame.dataset.spwAnatomyStack;
      delete frame.dataset.spwAnatomyTheming;
      frame.querySelector(':scope > .spw-anatomy-stack-rail')?.remove();
      return;
    }
    ensureAnatomyStackRail(frame);
  });
}

function projectAnatomyRootState() {
  const html = document.documentElement;
  const settings = getSiteSettings();
  const mode = html.dataset.spwTuningDiscoverability
    || resolveTuningDiscoverability(settings);
  const handles = settings.cognitiveHandles === 'on' || html.dataset.spwCognitiveHandles === 'on';
  const themeBiome = html.dataset.spwThemeBiome || '';
  const metamaterial = html.dataset.spwBaseMetamaterial || '';
  const colorMode = html.dataset.spwColorMode || '';
  const moduleEffects = Boolean(html.dataset.spwModuleEffectsActive);
  const semantics = Boolean(
    document.querySelector('[data-spw-gesture-contract-resolved], [data-spw-theming-posture-resolved]'),
  );

  writeDatasetValues(html, {
    spwGestureAnatomy: 'active',
    spwAnatomyDiscoverability: mode || null,
    spwAnatomyThemeLink: [
      themeBiome && `biome:${themeBiome}`,
      metamaterial && `material:${metamaterial}`,
      colorMode && `color:${colorMode}`,
      handles && 'handles',
      moduleEffects && 'module-effects',
      semantics && 'semantics',
    ].filter(Boolean).join(' ') || null,
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
      delete frame.dataset.spwAnatomyTheming;
      frame.querySelector(':scope > .spw-anatomy-stack-rail')?.remove();
    });
    writeDatasetValues(document.documentElement, {
      spwGestureAnatomy: null,
      spwAnatomyDiscoverability: null,
      spwAnatomyThemeLink: null,
    });
    return;
  }

  annotateGestureContracts(root);
  annotateSlotLabels(root);
  annotateAnatomyStacks(root);
  projectAnatomyRootState();
}

export function initGestureAnatomy(ctx = null) {
  const unregister = registerDomSyncTask('gesture-anatomy', () => refreshGestureAnatomy(), ctx);

  const onPointerOver = (event) => {
    const slot = event.target.closest?.('[data-spw-slot]');
    const frame = slot?.closest?.(SLOT_HOST_SELECTOR);
    if (frame) ensureAnatomyStackRail(frame);
  };

  const onPointerOut = (event) => {
    const slot = event.target.closest?.('[data-spw-slot]');
    const frame = slot?.closest?.(SLOT_HOST_SELECTOR);
    if (!frame) return;
    const next = event.relatedTarget;
    if (next instanceof Node && frame.contains(next)) {
      ensureAnatomyStackRail(frame);
      return;
    }
    ensureAnatomyStackRail(frame);
  };

  document.addEventListener('pointerover', onPointerOver, true);
  document.addEventListener('pointerout', onPointerOut, true);
  document.addEventListener('focusin', onPointerOver, true);
  document.addEventListener('focusout', onPointerOut, true);

  const cleanup = () => {
    unregister();
    document.removeEventListener('pointerover', onPointerOver, true);
    document.removeEventListener('pointerout', onPointerOut, true);
    document.removeEventListener('focusin', onPointerOver, true);
    document.removeEventListener('focusout', onPointerOut, true);
    writeDatasetValues(document.documentElement, {
      spwGestureAnatomy: null,
      spwAnatomyDiscoverability: null,
      spwAnatomyThemeLink: null,
    });
  };

  ctx?.addCleanup?.(cleanup);

  return {
    cleanup,
    refresh: () => refreshGestureAnatomy(),
  };
}
