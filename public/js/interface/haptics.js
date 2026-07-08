/**
 * Spw Haptics — Token Grounding
 *
 * Purpose
 * - Ground concept-bearing handles into a settled semantic state.
 * - Provide lightweight passive charge for hover/focus without noisy repeats.
 * - Persist both grounded registry and semantic coupling metadata.
 * - Support future HTML-first semantics through explicit data attributes.
 *
 * Interaction model
 * - charge       : transient passive attention from hover/focus.
 * - prime        : current working selected meaning, owned by focused modules.
 * - grounded     : deliberate persistent memory.
 * - collected    : deliberate retained artifact or sigil.
 *
 * Canonical bus events emitted
 * - charge:armed
 * - charge:preview
 * - charge:charged
 * - charge:settled
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

import { bus } from '/public/js/kernel/bus.js';
import { COMPONENT_KIND_MIRROR_SELECTOR, writeRuntimeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { guardCall } from '/public/js/kernel/dom-render.js';
import { normalizePathname } from '/public/js/kernel/route-utils.js';
import {
  readJson,
  removeJson,
  runCriticalPath,
  STORAGE_KEYS,
  writeJson,
} from '/public/js/kernel/storage-utils.js';
import { collapseText as normalizeText } from '/public/js/kernel/text-normalization.js';
import { detectOperator, getOperatorDefinition } from '/public/js/kernel/shared.js';
import { bindArcLifecycle } from '/public/js/interface/arc-lifecycle.js';

const STORAGE_KEY = STORAGE_KEYS.GROUNDED_REGISTRY;
const SIGIL_COLLECTION_KEY = STORAGE_KEYS.SIGIL_COLLECTION;
const CHECKPOINT_PREFIX = STORAGE_KEYS.CHECKPOINT_PREFIX;
const GLOBAL_COUPLING_KEY = STORAGE_KEYS.COUPLING_GLOBAL;
const couplingKeyForPath = (path = normalizePathname(window.location.pathname)) => `spw-coupling:${path}`;
const COUPLING_KEY = couplingKeyForPath;

const GROUND_SELECTORS = [
  '.operator-chip',
  '.syntax-token',
  '.frame-sigil',
  '.spec-pill',
  '.badge',
  '.tag',
  '.pill',
  '[data-spw-concept]',
  '[data-spw-grounding]',
  '[data-spw-assignment]',
  '[data-spw-reference-seed]',
  '[data-spw-vocab]',
  '[data-spw-topic]',
  '[data-spw-groundable="true"]'
].join(', ');

const CAULDRON_CANDIDATE_SELECTORS = [
  '[data-spw-cauldron-candidate="true"]',
  '[data-spw-living-term]',
  '.spw-living-term',
  '[data-spw-gesture-contract*="prime"]',
  '[data-spw-concept]',
  '[data-spw-topic]',
  '[data-spw-image-key]',
  '[data-spw-semantic-expression]'
].join(', ');

const CHARGE_SELECTORS = [
  GROUND_SELECTORS,
  '.site-frame',
  '.frame-card',
  '.frame-panel',
  '.mode-panel',
  '.plan-card',
  '.software-card',
  '.operator-card',
  '.media-card',
  '.media-focus-card',
  COMPONENT_KIND_MIRROR_SELECTOR,
  '.domain-visual',
  '[data-spw-operator]',
  '[data-spw-cluster]',
  '[data-spw-form]',
  '[data-spw-image-key]'
].join(', ');

let initialized = false;
let restoreObserver = null;
let cleanupArcLifecycle = null;
let unsubscribeBus = [];
const passiveChargeTimers = new WeakMap();
const holdPrimeTimers = new WeakMap();
const suppressClickTargets = new WeakSet();
const PASSIVE_CHARGE_DELAY_MS = 220;
const HOLD_PRIME_DELAY_MS = 520;

function setGroundedFlags(el, grounded) {
  el.dataset.spwGrounded = grounded ? 'true' : 'false';
  if (!grounded) delete el.dataset.spwVisited;
}

function setPrimeState(el, state = '') {
  if (!el) return;
  if (state) el.dataset.spwPrimeState = state;
  else delete el.dataset.spwPrimeState;
}

function setGestureState(el, state = '') {
  if (!el) return;
  if (state) el.dataset.spwGesture = state;
  else delete el.dataset.spwGesture;
}

function setGroundedMetadata(el, substrate = '', wonder = '') {
  if (substrate) el.dataset.spwGroundedIn = substrate;
  else delete el.dataset.spwGroundedIn;

  if (wonder) el.dataset.spwGroundedWonder = wonder;
  else delete el.dataset.spwGroundedWonder;
}

function clearGroundedMetadata(el) {
  delete el.dataset.spwVisited;
  delete el.dataset.spwCollected;
  delete el.dataset.spwGroundedIn;
  delete el.dataset.spwGroundedWonder;
  el.style.removeProperty('--spw-collection-strength');
  if (el.dataset.spwSuccession === 'latched') {
    delete el.dataset.spwSuccession;
  }
}

function updateRegistryStore(transform) {
  const current = getGroundedRegistry();
  const next = transform(current);
  writeJson(STORAGE_KEY, next);
  return next;
}

function updateCouplingStore(key, transform) {
  const global = isGlobalKey(key);
  const current = global ? getGlobalCouplings() : getPathCouplings();
  const next = transform(current);
  if (global) writeJson(GLOBAL_COUPLING_KEY, next);
  else writeJson(COUPLING_KEY(), next);
  return next;
}

export function initSpwHaptics() {
  if (initialized) return () => {};
  initialized = true;

  runCriticalPath('haptics:restore', () => restoreGroundedState(document));
  runCriticalPath('haptics:cauldron-annotate', () => annotateCauldronCandidates(document));
  runCriticalPath('haptics:sigil-sync', () => syncSigilCollectionState());
  initRestoreObserver();
  cleanupArcLifecycle = bindArcLifecycle(document);

  document.addEventListener('click', onGroundToggleClick, true);
  document.addEventListener('keydown', onGroundToggleKeydown, true);

  document.addEventListener('pointerdown', onPrimePointerDown, true);
  document.addEventListener('pointerup', onPrimePointerEnd, true);
  document.addEventListener('pointercancel', onPrimePointerEnd, true);
  document.addEventListener('pointermove', onPrimePointerMove, true);
  document.addEventListener('pointerover', onChargeEnter, true);
  document.addEventListener('pointerout', onChargeLeave, true);
  document.addEventListener('focusin', onChargeFocusIn, true);
  document.addEventListener('focusout', onChargeFocusOut, true);

  unsubscribeBus = [
    bus.on('spell:reset', () => guardCall('haptics:reset', resetHaptics)),
    bus.on('spell:checkpoint', (event) => guardCall('haptics:checkpoint', () => saveCheckpoint(event))),
  ];

  return () => {
    initialized = false;

    document.removeEventListener('click', onGroundToggleClick, true);
    document.removeEventListener('keydown', onGroundToggleKeydown, true);

    document.removeEventListener('pointerdown', onPrimePointerDown, true);
    document.removeEventListener('pointerup', onPrimePointerEnd, true);
    document.removeEventListener('pointercancel', onPrimePointerEnd, true);
    document.removeEventListener('pointermove', onPrimePointerMove, true);
    document.removeEventListener('pointerover', onChargeEnter, true);
    document.removeEventListener('pointerout', onChargeLeave, true);
    document.removeEventListener('focusin', onChargeFocusIn, true);
    document.removeEventListener('focusout', onChargeFocusOut, true);

    unsubscribeBus.forEach((off) => off?.());
    unsubscribeBus = [];

    restoreObserver?.disconnect();
    restoreObserver = null;
    cleanupArcLifecycle?.();
    cleanupArcLifecycle = null;
  };
}

/* ==========================================================================
   Interaction lifecycle
   ========================================================================== */

function onGroundToggleClick(event) {
  const target = getInteractiveTarget(event.target, GROUND_SELECTORS);
  if (!target) return;
  if (suppressClickTargets.has(target)) {
    suppressClickTargets.delete(target);
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (shouldIgnoreGroundToggle(target, event)) return;

  animateSettle(target, 'spw-pop-snap');
  toggleGroundedState(target, { source: 'click' });
}

function onPrimePointerDown(event) {
  if (event.button != null && event.button !== 0) return;
  const target = getInteractiveTarget(event.target, CAULDRON_CANDIDATE_SELECTORS);
  if (!target || shouldIgnorePrimeCandidate(target, event)) return;

  target.dataset.spwCauldronCandidate = 'true';
  setPrimeState(target, 'candidate');
  setGestureState(target, 'charging');

  const armedTimer = window.setTimeout(() => {
    if (!holdPrimeTimers.has(target)) return;
    setGestureState(target, 'armed');
  }, Math.round(HOLD_PRIME_DELAY_MS * 0.55));

  const timer = window.setTimeout(() => {
    holdPrimeTimers.delete(target);
    collectPrimeCandidate(target, event);
  }, HOLD_PRIME_DELAY_MS);

  holdPrimeTimers.set(target, {
    timer,
    armedTimer,
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
  });
}

function onPrimePointerMove(event) {
  const target = getInteractiveTarget(event.target, CAULDRON_CANDIDATE_SELECTORS);
  if (!target) return;
  const record = holdPrimeTimers.get(target);
  if (!record || record.pointerId !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - record.x, event.clientY - record.y);
  if (distance > 12) cancelHoldPrime(target);
}

function onPrimePointerEnd(event) {
  const target = getInteractiveTarget(event.target, CAULDRON_CANDIDATE_SELECTORS);
  if (!target) return;
  cancelHoldPrime(target);
}

function cancelHoldPrime(target) {
  const record = holdPrimeTimers.get(target);
  if (record) {
    window.clearTimeout(record.timer);
    if (record.armedTimer) window.clearTimeout(record.armedTimer);
  }
  holdPrimeTimers.delete(target);
  setGestureState(target, '');
  if (!isGrounded(target) && target.dataset.spwPrimeState === 'candidate') {
    setPrimeState(target, '');
  }
}

function shouldIgnorePrimeCandidate(target, event) {
  if (!(target instanceof Element)) return true;
  if (target.closest('[data-spw-groundable="false"], input, textarea, select, button[data-spw-cauldron-action]')) return true;
  if (event?.pointerType === 'mouse' && target.closest('a[href]')) return true;
  return false;
}

function collectPrimeCandidate(target, event) {
  const detail = buildSemanticDetail(target, { source: 'hold-prime' });
  setPrimeState(target, 'primed');
  setGestureState(target, 'committed');
  target.dataset.spwCauldronCandidate = 'true';
  target.dataset.spwIngredientState = 'active';
  suppressClickTargets.add(target);
  window.setTimeout(() => suppressClickTargets.delete(target), 800);
  animateSettle(target, 'spw-pop-snap');

  bus.emit('spell:capture', {
    ...detail,
    origin: detail.context || document.body?.dataset?.spwSurface || 'page',
    originLabel: detail.context || document.body?.dataset?.spwSurface || 'page',
    primedBy: 'hold-prime',
    chargeContext: detail.substrate || detail.context || '',
    gestureHistory: `notice->prime->gather:${detail.key.split(':').pop()}`,
    sourceElement: detail.key,
    element: target,
  }, { target, element: target, originalEvent: event });

  setPrimeState(target, 'collected');
  target.dataset.spwCauldronCollected = 'true';
  window.setTimeout(() => setGestureState(target, ''), 420);

  bus.emit('prime:collected', detail, { target, element: target });
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

  schedulePassiveCharge(target, 'pointer');
}

function onChargeLeave(event) {
  const target = getInteractiveTarget(event.target, CHARGE_SELECTORS);
  if (!target) return;

  const related = getInteractiveTarget(event.relatedTarget, CHARGE_SELECTORS);
  if (related && related === target) return;
  if (related instanceof Element && target.contains(related)) return;

  cancelPassiveCharge(target);
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
  cancelPassiveCharge(target);
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

  settleCharge(el, detail.source || 'ground');

  setGroundedFlags(el, true);
  el.dataset.spwSuccession = 'latched';
  el.dataset.spwVisited = 'true';
  setGroundedMetadata(el, detail.substrate || '', detail.wonder || '');
  setPrimeState(el, 'collected');
  el.dataset.spwCollected = 'true';
  el.style.setProperty('--spw-collection-strength', '1');

  addToRegistry(detail.key);
  collectSigil(detail);
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
    deepLink: detail.deepLink,
    deepLinkLabel: detail.deepLinkLabel,
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

  setGroundedFlags(el, false);
  clearGroundedMetadata(el);
  setPrimeState(el, '');

  removeFromRegistry(detail.key);
  removeCoupling(detail.key);

  bus.emit(
    'spell:ungrounded',
    { ...detail, grounded: false },
    { target: el, element: el }
  );
}

function applyGroundedState(el, coupling = null) {
  setGroundedFlags(el, true);
  el.dataset.spwVisited = 'true';
  el.dataset.spwSuccession = 'latched';
  el.dataset.spwCollected = 'true';
  el.style.setProperty('--spw-collection-strength', '0.75');
  setGroundedMetadata(el, coupling?.substrate || '', coupling?.wonder || '');
}

function clearGroundedState(el) {
  setGroundedFlags(el, false);
  clearGroundedMetadata(el);
}

/* ==========================================================================
   Passive charge
   ========================================================================== */

function emitChargePhase(el, phase, source = 'pointer') {
  const detail = buildSemanticDetail(el, { source, passive: true });

  bus.emit(
    `charge:${phase}`,
    detail,
    { target: el, element: el }
  );

  return detail;
}

export function armCharge(el, source = 'pointer') {
  if (!el || isGrounded(el)) return;
  if (el.dataset.spwPassiveCharge === 'true') return;

  el.dataset.spwChargePending = 'true';
  el.dataset.spwCharge = 'arming';
  el.dataset.spwChargeSource = source;

  emitChargePhase(el, 'armed', source);
}

export function previewCharge(el, source = 'pointer') {
  if (!el || isGrounded(el)) return;
  if (el.dataset.spwPassiveCharge === 'true' && el.dataset.spwCharge === 'preview') return;

  delete el.dataset.spwChargePending;
  el.dataset.spwPassiveCharge = 'true';
  el.dataset.spwCharge = 'preview';
  el.dataset.spwChargeSource = source;
  setPrimeState(el, 'candidate');

  const detail = emitChargePhase(el, 'preview', source);

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
}

export function chargeElement(el, source = 'manual') {
  if (!el || isGrounded(el)) return;

  delete el.dataset.spwChargePending;
  el.dataset.spwPassiveCharge = 'true';
  el.dataset.spwCharge = 'charged';
  el.dataset.spwChargeSource = source;
  setPrimeState(el, 'primed');

  const detail = emitChargePhase(el, 'charged', source);

  bus.emit(
    'brace:charged',
    detail,
    { target: el, element: el }
  );
}

export function settleCharge(el, source = 'pointer') {
  if (!el) return;

  const wasActiveCharge =
    el.dataset.spwPassiveCharge === 'true'
    || el.dataset.spwCharge === 'preview'
    || el.dataset.spwCharge === 'charged';
  const hadCharge =
    wasActiveCharge
    || Boolean(el.dataset.spwCharge)
    || el.dataset.spwChargePending === 'true';

  delete el.dataset.spwPassiveCharge;
  delete el.dataset.spwCharge;
  delete el.dataset.spwChargeSource;
  delete el.dataset.spwChargePending;
  if (!isGrounded(el)) setPrimeState(el, '');

  if (!hadCharge) return;

  const detail = emitChargePhase(el, 'settled', source);

  if (!wasActiveCharge) return;

  bus.emit(
    'brace:discharged',
    detail,
    { target: el, element: el }
  );
}

function setPassiveCharge(el, active, source = 'pointer') {
  if (!el || isGrounded(el)) return;

  if (active) {
    previewCharge(el, source);
    return;
  }

  settleCharge(el, source);
}

function schedulePassiveCharge(el, source = 'pointer') {
  if (!el || isGrounded(el) || el.dataset.spwPassiveCharge === 'true') return;
  cancelPassiveCharge(el);
  armCharge(el, source);

  const timer = window.setTimeout(() => {
    passiveChargeTimers.delete(el);
    previewCharge(el, source);
  }, PASSIVE_CHARGE_DELAY_MS);

  passiveChargeTimers.set(el, timer);
}

function cancelPassiveCharge(el) {
  const timer = passiveChargeTimers.get(el);
  if (timer) window.clearTimeout(timer);
  passiveChargeTimers.delete(el);
  if (el) {
    if (el.dataset.spwPassiveCharge !== 'true') {
      settleCharge(el, 'cancel');
    } else {
      delete el.dataset.spwChargePending;
    }
  }
}

/* ==========================================================================
   Persistence
   ========================================================================== */

export function getGroundedRegistry() {
  return readJson(STORAGE_KEY, [], { requireArray: true });
}

function isGlobalKey(key = '') {
  return String(key).startsWith('global:') || String(key).startsWith('shared:');
}

function getPathCouplings() {
  return readJson(COUPLING_KEY(), {}, { requireObject: true });
}

function getGlobalCouplings() {
  return readJson(GLOBAL_COUPLING_KEY, {}, { requireObject: true });
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
  writeJson(COUPLING_KEY(), value);
}

function setGlobalCouplings(value) {
  writeJson(GLOBAL_COUPLING_KEY, value);
}

function addToRegistry(key) {
  updateRegistryStore((registry) => (
    registry.includes(key) ? registry : [...registry, key]
  ));
}

function removeFromRegistry(key) {
  updateRegistryStore((registry) => registry.filter((entry) => entry !== key));
}

function writeCoupling(key, value) {
  updateCouplingStore(key, (couplings) => ({
    ...couplings,
    [key]: value
  }));
}

function removeCoupling(key) {
  updateCouplingStore(key, (couplings) => {
    const next = { ...couplings };
    delete next[key];
    return next;
  });
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
        annotateCauldronCandidates(node);
      });
    });
  });

  restoreObserver.observe(document.body, { childList: true, subtree: true });
}

function annotateCauldronCandidates(root = document) {
  const nodes = new Set();
  if (root instanceof Element && root.matches(CAULDRON_CANDIDATE_SELECTORS)) {
    nodes.add(root);
  }
  root.querySelectorAll?.(CAULDRON_CANDIDATE_SELECTORS).forEach((node) => nodes.add(node));

  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.closest('[data-spw-groundable="false"]')) return;
    node.dataset.spwCauldronCandidate = node.dataset.spwCauldronCandidate || 'true';
    node.dataset.spwGestureContract = node.dataset.spwGestureContract || 'tap:inspect hold:prime-to-cauldron';
    if (!node.title) node.title = 'tap to inspect; hold to gather as a cauldron ingredient';
  });
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

  writeJson(`${CHECKPOINT_PREFIX}${name}`, payload);

  bus.emit(
    'spell:checkpoint-saved',
    { name, count: payload.registry.length, path: payload.path },
    { target: document }
  );
}

export function restoreCheckpoint(name) {
  if (!name) return false;

  const parsed = readJson(`${CHECKPOINT_PREFIX}${name}`, null);
  if (!parsed) return false;

  try {
    const registry = Array.isArray(parsed?.registry) ? parsed.registry : [];
    const couplings = resolveCheckpointCouplings(parsed?.couplings);

    writeJson(STORAGE_KEY, registry);
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
  removeJson(STORAGE_KEY);
  removeJson(COUPLING_KEY());
  removeJson(GLOBAL_COUPLING_KEY);

  document
    .querySelectorAll('[data-spw-passive-charge], [data-spw-charge], [data-spw-charge-pending]')
    .forEach((el) => settleCharge(el, 'reset'));

  document.querySelectorAll('[data-spw-grounded="true"]').forEach((el) => {
    clearGroundedState(el);
  });
}

export function getSigilCollection() {
  return readJson(SIGIL_COLLECTION_KEY, {}, { requireObject: true });
}

function collectSigil(detail = {}) {
  const definition = resolveSigilDefinition(detail);
  if (!definition?.prefix) return;

  const collection = getSigilCollection();
  const current = collection[definition.prefix] || {};
  const next = {
    ...collection,
    [definition.prefix]: {
      prefix: definition.prefix,
      type: definition.type,
      label: definition.label,
      count: Number(current.count || 0) + 1,
      lastContext: detail.context || '',
      lastExpression: detail.expression || detail.label || '',
      lastCollectedAt: Date.now(),
    }
  };

  writeJson(SIGIL_COLLECTION_KEY, next);
  writeRuntimeDatasetValues(document.documentElement, {
    spwSigilCollectionCount: String(Object.keys(next).length),
  }, {
    source: 'haptics',
    reason: 'sigil-collected',
  });

  bus.emit(
    'sigil:collected',
    { sigil: next[definition.prefix], total: Object.keys(next).length },
    { target: document }
  );
}

function syncSigilCollectionState() {
  const count = Object.keys(getSigilCollection()).length;
  writeRuntimeDatasetValues(document.documentElement, {
    spwSigilCollectionCount: count ? String(count) : null,
  }, {
    source: 'haptics',
    reason: 'sigil-sync',
  });
}

function resolveSigilDefinition(detail = {}) {
  const expression = detail.expression || detail.label || detail.text || '';
  return (
    detectOperator(expression)
    || getOperatorDefinition(detail.substrate || '')
    || detectOperator(detail.prefix || '')
    || null
  );
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
      ?? buildConceptExpression(el)
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
      inferSubstrate(el, overrides),
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
    recognition:
      overrides.recognition
      ?? el.dataset.spwRecognition
      ?? null,
    operation:
      overrides.operation
      ?? el.dataset.spwOperation
      ?? null,
    failureMode:
      overrides.failureMode
      ?? el.dataset.spwFailureMode
      ?? null,
    adjacent:
      overrides.adjacent
      ?? el.dataset.spwAdjacent
      ?? null,
    contrast:
      overrides.contrast
      ?? el.dataset.spwContrast
      ?? null,
    practice:
      overrides.practice
      ?? el.dataset.spwPractice
      ?? null,
    proficiency:
      overrides.proficiency
      ?? el.dataset.spwProficiency
      ?? null,
    group:
      overrides.group
      ?? el.dataset.spwGroundGroup
      ?? el.dataset.spwDomain
      ?? el.dataset.spwVocab
      ?? null,
    destination:
      overrides.destination
      ?? el.dataset.spwNavDestination
      ?? null,
    href:
      overrides.href
      ?? (el instanceof HTMLAnchorElement ? el.getAttribute('href') : null)
      ?? null,
    deepLink:
      overrides.deepLink
      ?? resolveElementDeepLink(el)
      ?? null,
    deepLinkLabel:
      overrides.deepLinkLabel
      ?? resolveElementDeepLinkLabel(el)
      ?? null,
    source: overrides.source || 'manual',
    passive: Boolean(overrides.passive),
    fieldRootId: fieldRoot?.id || null
  };
}

function resolveElementDeepLink(el) {
  if (!(el instanceof HTMLElement)) return null;

  const directHash = el instanceof HTMLAnchorElement
    ? el.getAttribute('href')
    : null;
  if (directHash && directHash.startsWith('#')) return directHash;

  const target = el.id ? el : el.closest('[id]');
  if (!(target instanceof HTMLElement) || !target.id) return null;
  return `${window.location.pathname}${window.location.search}#${target.id}`;
}

function resolveElementDeepLinkLabel(el) {
  if (!(el instanceof HTMLElement)) return null;
  const target = el.id ? el : el.closest('[id]');
  if (!(target instanceof HTMLElement)) return null;
  return normalizeText(
    target.dataset.spwDeepLinkLabel
    || target.getAttribute('aria-label')
    || target.querySelector?.('h1, h2, h3, h4, .frame-sigil, .page-kicker')?.textContent
    || target.textContent
    || target.id
  ).slice(0, 80) || target.id || null;
}

/* ==========================================================================
   Element helpers
   ========================================================================== */

function getInteractiveTarget(target, selector) {
  return target instanceof Element ? target.closest(selector) : null;
}

function inferSubstrate(el, overrides = {}) {
  if (overrides.substrate) return overrides.substrate;

  const expression = (
    el.dataset.spwGroundExpression
    || el.dataset.spwNavExpression
    || el.dataset.spwSigil
    || getElementText(el)
  );
  const detected = detectOperator(expression);
  if (detected?.type) return detected.type;

  return (
    el.dataset.spwGroundSubstrate
    || el.dataset.spwSubstrate
    || el.closest('[data-spw-substrate]')?.dataset.spwSubstrate
    || el.dataset.spwOperator
    || el.closest('[data-spw-operator]')?.dataset.spwOperator
    || null
  );
}

function getFieldRoot(el) {
  return el.closest('[data-spw-field-root], .site-frame, main, body') || document.body;
}

function getElementKey(el) {
  const explicit =
    el.dataset.spwGroundKey
    || el.dataset.spwSemanticKey
    || el.dataset.spwConcept
    || el.dataset.spwAssignment
    || el.dataset.spwReferenceSeed
    || el.dataset.spwGrounding
    || el.dataset.spwTopic
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
    || el.dataset.spwConcept
    || el.dataset.spwAssignment
    || el.dataset.spwReferenceSeed
    || el.dataset.spwGrounding
    || el.dataset.spwTopic
    || el.dataset.spwMeaning
    || el.getAttribute('aria-label')
    || el.querySelector?.('h1, h2, h3, h4, strong, figcaption, .frame-sigil, .frame-card-sigil')?.textContent
    || el.textContent
    || ''
  );
}

function buildConceptExpression(el) {
  const root = normalizeText(
    el.dataset.spwConcept
    || el.dataset.spwAssignment
    || el.dataset.spwReferenceSeed
    || el.dataset.spwGrounding
    || el.dataset.spwTopic
    || (el.hasAttribute('data-spw-vocab') ? el.textContent : '')
    || ''
  );

  if (!root) return '';

  const variant = normalizeText(el.dataset.spwDomain || el.dataset.spwReferenceSeed || el.dataset.spwVocab || '');
  const behavior = normalizeText(el.dataset.spwBehavior || el.dataset.spwAttention || '');
  const lens = normalizeText(el.dataset.spwGrounding || el.dataset.spwAssignment || '');

  return [
    root,
    variant ? `[${variant}]` : '',
    behavior ? `{${behavior}}` : '',
    lens ? `<${lens}>` : '',
  ].join('');
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
  if (isPlainNavigableLink(target, event)) return true;

  const activeTag = document.activeElement?.tagName;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
    return true;
  }

  if (event instanceof KeyboardEvent && event.repeat) return true;

  return false;
}

function isPlainNavigableLink(target, event) {
  const link = target.closest('a[href]');
  if (!(link instanceof HTMLAnchorElement)) return false;
  if (link.dataset.spwGroundable === 'true') return false;

  const href = link.getAttribute('href') || '';
  if (!href || href.startsWith('#')) return false;

  return true;
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
