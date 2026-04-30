/**
 * Spw Haptics — Token Grounding
 *
 * Purpose
 * - Ground concept-bearing handles into a settled semantic state.
 * - Provide lightweight passive charge for hover/focus without noisy repeats.
 * - Persist both grounded registry and semantic coupling metadata.
 * - Support future HTML-first semantics through explicit data attributes.
 *
 * Grounding model
 * - grounded     : settled / encountered / baseline-adjacent
 * - ungrounded   : available for inquiry
 * - charged      : passive hover/focus energy
 *
 * Canonical bus events emitted
 * - spell:probe
 * - spell:grounded
 * - spell:ungrounded
 * - spell:checkpoint-saved
 * - spell:checkpoint-restored
 *
 * Bus events consumed
 * - spell:reset
 * - spell:checkpoint
 */

import { bus } from './spw-bus.js';

const STORAGE_KEY = 'spw-grounded-registry';
const CHECKPOINT_PREFIX = 'spw-checkpoint:';
const COUPLING_KEY = (path = window.location.pathname) => `spw-coupling:${path}`;
const GLOBAL_COUPLING_KEY = 'spw-coupling:global';

const GROUND_SELECTORS = [
  '.operator-chip',
  '.syntax-token',
  '.frame-sigil',
  '.spec-pill',
  '.badge',
  '.tag',
  '.pill',
  '[data-spw-groundable="true"]'
].join(', ');

const CHARGE_SELECTORS = [
  GROUND_SELECTORS,
  '.frame-card',
  '.frame-panel',
  '.software-card',
  '.operator-card',
  '.media-card',
  '.media-focus-card',
  '[data-spw-component-kind]',
  '.domain-visual',
  '[data-spw-operator]',
  '[data-spw-cluster]',
  '[data-spw-form]',
  '[data-spw-image-key]'
].join(', ');

let initialized = false;
let restoreObserver = null;
let unsubscribeBus = [];

export function initSpwHaptics() {
  if (initialized) return () => {};
  initialized = true;

  restoreGroundedState(document);
  initRestoreObserver();

  document.addEventListener('click', onGroundToggleClick, true);
  document.addEventListener('keydown', onGroundToggleKeydown, true);

  document.addEventListener('pointerover', onChargeEnter, true);
  document.addEventListener('pointerout', onChargeLeave, true);
  document.addEventListener('focusin', onChargeFocusIn, true);
  document.addEventListener('focusout', onChargeFocusOut, true);

  unsubscribeBus = [
    bus.on('spell:reset', resetHaptics),
    bus.on('spell:checkpoint', saveCheckpoint)
  ];

  return () => {
    initialized = false;

    document.removeEventListener('click', onGroundToggleClick, true);
    document.removeEventListener('keydown', onGroundToggleKeydown, true);

    document.removeEventListener('pointerover', onChargeEnter, true);
    document.removeEventListener('pointerout', onChargeLeave, true);
    document.removeEventListener('focusin', onChargeFocusIn, true);
    document.removeEventListener('focusout', onChargeFocusOut, true);

    unsubscribeBus.forEach((off) => off?.());
    unsubscribeBus = [];

    restoreObserver?.disconnect();
    restoreObserver = null;
  };
}

/* ==========================================================================
   Interaction lifecycle
   ========================================================================== */

function onGroundToggleClick(event) {
  const target = getInteractiveTarget(event.target, GROUND_SELECTORS);
  if (!target) return;
  if (shouldIgnoreGroundToggle(target, event)) return;

  animateSettle(target, 'spw-pop-snap');
  toggleGroundedState(target, { source: 'click' });
}

function onGroundToggleKeydown(event) {
  if (event.defaultPrevented) return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;

  const target = getInteractiveTarget(event.target, GROUND_SELECTORS);
  if (!target) return;
  if (shouldIgnoreGroundToggle(target, event)) return;

  if (event.key === ' ') {
    event.preventDefault();
  }

  animateSettle(target, 'spw-pop-snap');
  toggleGroundedState(target, { source: 'keyboard' });
}

function onChargeEnter(event) {
  const target = getInteractiveTarget(event.target, CHARGE_SELECTORS);
  if (!target) return;

  const related = getInteractiveTarget(event.relatedTarget, CHARGE_SELECTORS);
  if (related && related === target) return;
  if (related instanceof Element && target.contains(related)) return;

  setPassiveCharge(target, true, 'pointer');
}

function onChargeLeave(event) {
  const target = getInteractiveTarget(event.target, CHARGE_SELECTORS);
  if (!target) return;

  const related = getInteractiveTarget(event.relatedTarget, CHARGE_SELECTORS);
  if (related && related === target) return;
  if (related instanceof Element && target.contains(related)) return;

  setPassiveCharge(target, false, 'pointer');
}

function onChargeFocusIn(event) {
  const target = getInteractiveTarget(event.target, CHARGE_SELECTORS);
  if (!target) return;
  setPassiveCharge(target, true, 'focus');
}

function onChargeFocusOut(event) {
  const target = getInteractiveTarget(event.target, CHARGE_SELECTORS);
  if (!target) return;
  setPassiveCharge(target, false, 'focus');
}

/* ==========================================================================
   Grounding
   ========================================================================== */

function toggleGroundedState(el, overrides = {}) {
  if (isGrounded(el)) {
    ungroundElement(el, overrides);
    return;
  }

  groundElement(el, overrides);
}

export function groundElement(el, overrides = {}) {
  const detail = buildSemanticDetail(el, overrides);

  setPassiveCharge(el, false, detail.source || 'ground');

  el.dataset.spwGrounded = 'true';
  el.dataset.spwSuccession = 'latched';
  el.dataset.spwVisited = 'true';

  if (detail.substrate) {
    el.dataset.spwGroundedIn = detail.substrate;
  } else {
    delete el.dataset.spwGroundedIn;
  }

  if (detail.wonder) {
    el.dataset.spwGroundedWonder = detail.wonder;
  } else {
    delete el.dataset.spwGroundedWonder;
  }

  addToRegistry(detail.key);
  writeCoupling(detail.key, {
    text: detail.text,
    label: detail.label,
    expression: detail.expression,
    prefix: detail.prefix,
    postfix: detail.postfix,
    substrate: detail.substrate,
    context: detail.context,
    wonder: detail.wonder,
    affordance: detail.affordance,
    role: detail.role,
    kind: detail.kind,
    phrase: detail.phrase,
    realization: detail.realization,
    destination: detail.destination,
    href: detail.href,
    groundedAt: Date.now(),
    source: detail.source || 'manual'
  });

  bus.emit(
    'spell:grounded',
    { ...detail, grounded: true },
    { target: el, element: el }
  );
}

export function ungroundElement(el, overrides = {}) {
  const detail = buildSemanticDetail(el, overrides);

  el.dataset.spwGrounded = 'false';
  delete el.dataset.spwVisited;
  delete el.dataset.spwGroundedIn;
  delete el.dataset.spwGroundedWonder;
  if (el.dataset.spwSuccession === 'latched') {
    delete el.dataset.spwSuccession;
  }

  removeFromRegistry(detail.key);
  removeCoupling(detail.key);

  bus.emit(
    'spell:ungrounded',
    { ...detail, grounded: false },
    { target: el, element: el }
  );
}

function applyGroundedState(el, coupling = null) {
  el.dataset.spwGrounded = 'true';
  el.dataset.spwVisited = 'true';
  el.dataset.spwSuccession = 'latched';

  const substrate = coupling?.substrate || '';
  const wonder = coupling?.wonder || '';

  if (substrate) {
    el.dataset.spwGroundedIn = substrate;
  } else {
    delete el.dataset.spwGroundedIn;
  }

  if (wonder) {
    el.dataset.spwGroundedWonder = wonder;
  } else {
    delete el.dataset.spwGroundedWonder;
  }
}

function clearGroundedState(el) {
  el.dataset.spwGrounded = 'false';
  delete el.dataset.spwVisited;
  delete el.dataset.spwGroundedIn;
  delete el.dataset.spwGroundedWonder;
  if (el.dataset.spwSuccession === 'latched') {
    delete el.dataset.spwSuccession;
  }
}

/* ==========================================================================
   Passive charge
   ========================================================================== */

function setPassiveCharge(el, active, source = 'pointer') {
  if (!el || isGrounded(el)) return;

  if (active) {
    if (el.dataset.spwPassiveCharge === 'true') return;
    el.dataset.spwPassiveCharge = 'true';

    const detail = buildSemanticDetail(el, { source, passive: true });

    bus.emit(
      'brace:charged',
      detail,
      { target: el, element: el }
    );

    bus.emit(
      'spell:probe',
      detail,
      { target: el, element: el }
    );

    return;
  }

  if (el.dataset.spwPassiveCharge !== 'true') return;
  delete el.dataset.spwPassiveCharge;

  const detail = buildSemanticDetail(el, { source, passive: true });

  bus.emit(
    'brace:discharged',
    detail,
    { target: el, element: el }
  );
}

/* ==========================================================================
   Persistence
   ========================================================================== */

export function getGroundedRegistry() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isGlobalKey(key = '') {
  return String(key).startsWith('global:') || String(key).startsWith('shared:');
}

function getPathCouplings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COUPLING_KEY()) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getGlobalCouplings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GLOBAL_COUPLING_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getStoredCouplings() {
  return {
    ...getGlobalCouplings(),
    ...getPathCouplings(),
  };
}

export function getGroundedCouplings() {
  return getStoredCouplings();
}

function setPathCouplings(value) {
  localStorage.setItem(COUPLING_KEY(), JSON.stringify(value));
}

function setGlobalCouplings(value) {
  localStorage.setItem(GLOBAL_COUPLING_KEY, JSON.stringify(value));
}

function addToRegistry(key) {
  const registry = getGroundedRegistry();
  if (!registry.includes(key)) {
    registry.push(key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  }
}

function removeFromRegistry(key) {
  const registry = getGroundedRegistry().filter((entry) => entry !== key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
}

function writeCoupling(key, value) {
  if (isGlobalKey(key)) {
    const couplings = getGlobalCouplings();
    couplings[key] = value;
    setGlobalCouplings(couplings);
    return;
  }

  const couplings = getPathCouplings();
  couplings[key] = value;
  setPathCouplings(couplings);
}

function removeCoupling(key) {
  if (isGlobalKey(key)) {
    const couplings = getGlobalCouplings();
    delete couplings[key];
    setGlobalCouplings(couplings);
    return;
  }

  const couplings = getPathCouplings();
  delete couplings[key];
  setPathCouplings(couplings);
}

function restoreGroundedState(root = document) {
  const registry = getGroundedRegistry();
  const couplings = getStoredCouplings();

  queryGroundables(root).forEach((el) => {
    const key = getElementKey(el);
    if (registry.includes(key)) {
      applyGroundedState(el, couplings[key]);
    }
  });
}

function initRestoreObserver() {
  if (!document.body) return;

  restoreObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        restoreGroundedState(node);
      });
    });
  });

  restoreObserver.observe(document.body, { childList: true, subtree: true });
}

/* ==========================================================================
   Checkpoints
   ========================================================================== */

export function saveCheckpoint(event) {
  const name = event?.detail?.name || `checkpoint_${Date.now()}`;
  const payload = {
    registry: getGroundedRegistry(),
    couplings: {
      global: getGlobalCouplings(),
      path: getPathCouplings(),
    },
    savedAt: Date.now(),
    path: window.location.pathname
  };

  localStorage.setItem(`${CHECKPOINT_PREFIX}${name}`, JSON.stringify(payload));

  bus.emit(
    'spell:checkpoint-saved',
    { name, count: payload.registry.length, path: payload.path },
    { target: document }
  );
}

export function restoreCheckpoint(name) {
  if (!name) return false;

  const raw = localStorage.getItem(`${CHECKPOINT_PREFIX}${name}`);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    const registry = Array.isArray(parsed?.registry) ? parsed.registry : [];
    const couplings = resolveCheckpointCouplings(parsed?.couplings);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
    setGlobalCouplings(couplings.global);
    setPathCouplings(couplings.path);

    document.querySelectorAll('[data-spw-grounded="true"]').forEach(clearGroundedState);
    restoreGroundedState(document);

    bus.emit(
      'spell:checkpoint-restored',
      { name, count: registry.length, path: window.location.pathname },
      { target: document }
    );

    return true;
  } catch {
    return false;
  }
}

export function resetHaptics() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(COUPLING_KEY());
  localStorage.removeItem(GLOBAL_COUPLING_KEY);

  document.querySelectorAll('[data-spw-grounded="true"]').forEach((el) => {
    clearGroundedState(el);
  });
}

/* ==========================================================================
   Semantics
   ========================================================================== */

function buildSemanticDetail(el, overrides = {}) {
  const key = overrides.key || getElementKey(el);
  const text = overrides.text || normalizeText(getElementText(el));
  const label = overrides.label || el.dataset.spwGroundLabel || text || key;
  const fieldRoot = getFieldRoot(el);

  return {
    key,
    text,
    label,
    expression:
      overrides.expression
      ?? el.dataset.spwGroundExpression
      ?? el.dataset.spwNavExpression
      ?? label,
    prefix:
      overrides.prefix
      ?? el.dataset.spwGroundPrefix
      ?? el.dataset.spwNavPrefix
      ?? null,
    postfix:
      overrides.postfix
      ?? el.dataset.spwGroundPostfix
      ?? el.dataset.spwNavPostfix
      ?? null,
    grounded: isGrounded(el),
    substrate:
      overrides.substrate
      ?? el.dataset.spwGroundSubstrate
      ?? el.dataset.spwSubstrate
      ?? el.closest('[data-spw-substrate]')?.dataset.spwSubstrate
      ?? el.dataset.spwOperator
      ?? el.closest('[data-spw-operator]')?.dataset.spwOperator
      ?? null,
    context:
      overrides.context
      ?? el.dataset.spwContext
      ?? el.closest('[data-spw-context]')?.dataset.spwContext
      ?? document.body?.dataset.spwSurface
      ?? null,
    wonder:
      overrides.wonder
      ?? el.dataset.spwWonder
      ?? el.closest('[data-spw-wonder]')?.dataset.spwWonder
      ?? null,
    affordance:
      overrides.affordance
      ?? el.dataset.spwAffordance
      ?? null,
    role:
      overrides.role
      ?? el.dataset.spwRole
      ?? null,
    kind:
      overrides.kind
      ?? el.dataset.spwComponentKind
      ?? el.dataset.spwKind
      ?? null,
    phrase:
      overrides.phrase
      ?? el.dataset.spwPhrase
      ?? null,
    realization:
      overrides.realization
      ?? el.dataset.spwRealization
      ?? null,
    group:
      overrides.group
      ?? el.dataset.spwGroundGroup
      ?? null,
    destination:
      overrides.destination
      ?? el.dataset.spwNavDestination
      ?? null,
    href:
      overrides.href
      ?? (el instanceof HTMLAnchorElement ? el.getAttribute('href') : null)
      ?? null,
    source: overrides.source || 'manual',
    passive: Boolean(overrides.passive),
    fieldRootId: fieldRoot?.id || null
  };
}

/* ==========================================================================
   Element helpers
   ========================================================================== */

function getInteractiveTarget(target, selector) {
  return target instanceof Element ? target.closest(selector) : null;
}

function getFieldRoot(el) {
  return el.closest('[data-spw-field-root], .site-frame, main, body') || document.body;
}

function getElementKey(el) {
  const explicit =
    el.dataset.spwGroundKey
    || el.dataset.spwSemanticKey
    || el.dataset.spwImageKey
    || el.id;

  if (explicit) {
    if (isGlobalKey(explicit)) return explicit;
    return `${window.location.pathname}:${explicit}`;
  }

  if (el instanceof HTMLAnchorElement && el.getAttribute('href')) {
    return `${window.location.pathname}:href:${el.getAttribute('href')}`;
  }

  const text = normalizeText(getElementText(el)).slice(0, 120);
  return `${window.location.pathname}:${text}`;
}

function getElementText(el) {
  return (
    el.dataset.spwGroundLabel
    || el.dataset.spwMeaning
    || el.getAttribute('aria-label')
    || el.querySelector?.('h1, h2, h3, h4, strong, figcaption, .frame-sigil, .frame-card-sigil')?.textContent
    || el.textContent
    || ''
  );
}

function normalizeText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function queryGroundables(root) {
  const nodes = new Set();

  if (root instanceof Element && root.matches(GROUND_SELECTORS)) {
    nodes.add(root);
  }

  root.querySelectorAll?.(GROUND_SELECTORS).forEach((node) => nodes.add(node));
  return [...nodes];
}

function isGrounded(el) {
  return el?.dataset?.spwGrounded === 'true';
}

function shouldIgnoreGroundToggle(target, event) {
  if (!(target instanceof Element)) return true;

  if (target.closest('[data-spw-groundable="false"]')) return true;

  const activeTag = document.activeElement?.tagName;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
    return true;
  }

  if (event instanceof KeyboardEvent && event.repeat) return true;

  return false;
}

function animateSettle(el, className) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  el.classList.add(className);
  window.setTimeout(() => el.classList.remove(className), 200);
}

function resolveCheckpointCouplings(source) {
  if (!source || typeof source !== 'object') {
    return { global: {}, path: {} };
  }

  if (
    source.global && typeof source.global === 'object'
    || source.path && typeof source.path === 'object'
  ) {
    return {
      global: source.global && typeof source.global === 'object' ? source.global : {},
      path: source.path && typeof source.path === 'object' ? source.path : {},
    };
  }

  const legacy = {};
  Object.entries(source).forEach(([key, value]) => {
    legacy[key] = value;
  });

  const global = {};
  const path = {};

  Object.entries(legacy).forEach(([key, value]) => {
    if (isGlobalKey(key)) {
      global[key] = value;
    } else {
      path[key] = value;
    }
  });

  return { global, path };
}
