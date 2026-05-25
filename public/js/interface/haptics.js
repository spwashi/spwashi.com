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

import { bus } from '/public/js/kernel/bus.js';
import { detectOperator, getOperatorDefinition } from '/public/js/kernel/shared.js';

const STORAGE_KEY = 'spw-grounded-registry';
const SIGIL_COLLECTION_KEY = 'spw-sigil-collection';
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
  '[data-spw-concept]',
  '[data-spw-grounding]',
  '[data-spw-assignment]',
  '[data-spw-reference-seed]',
  '[data-spw-vocab]',
  '[data-spw-topic]',
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
const passiveChargeTimers = new WeakMap();
const PASSIVE_CHARGE_DELAY_MS = 220;

function readJsonStorage(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setGroundedFlags(el, grounded) {
  el.dataset.spwGrounded = grounded ? 'true' : 'false';
  if (!grounded) delete el.dataset.spwVisited;
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
  writeJsonStorage(STORAGE_KEY, next);
  return next;
}

function updateCouplingStore(key, transform) {
  const global = isGlobalKey(key);
  const current = global ? getGlobalCouplings() : getPathCouplings();
  const next = transform(current);
  if (global) writeJsonStorage(GLOBAL_COUPLING_KEY, next);
  else writeJsonStorage(COUPLING_KEY(), next);
  return next;
}

export function initSpwHaptics() {
  if (initialized) return () => {};
  initialized = true;

  restoreGroundedState(document);
  syncSigilCollectionState();
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

  setPassiveCharge(el, false, detail.source || 'ground');

  setGroundedFlags(el, true);
  el.dataset.spwSuccession = 'latched';
  el.dataset.spwVisited = 'true';
  setGroundedMetadata(el, detail.substrate || '', detail.wonder || '');
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

function setPassiveCharge(el, active, source = 'pointer') {
  if (!el || isGrounded(el)) return;

  if (active) {
    if (el.dataset.spwPassiveCharge === 'true') return;
    el.dataset.spwPassiveCharge = 'true';
    el.dataset.spwCharge = 'preview';
    el.dataset.spwChargeSource = source;

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
  delete el.dataset.spwCharge;
  delete el.dataset.spwChargeSource;

  const detail = buildSemanticDetail(el, { source, passive: true });

  bus.emit(
    'brace:discharged',
    detail,
    { target: el, element: el }
  );
}

function schedulePassiveCharge(el, source = 'pointer') {
  if (!el || isGrounded(el) || el.dataset.spwPassiveCharge === 'true') return;
  cancelPassiveCharge(el);
  el.dataset.spwChargePending = 'true';
  el.dataset.spwCharge = 'arming';
  el.dataset.spwChargeSource = source;

  const timer = window.setTimeout(() => {
    passiveChargeTimers.delete(el);
    delete el.dataset.spwChargePending;
    setPassiveCharge(el, true, source);
  }, PASSIVE_CHARGE_DELAY_MS);

  passiveChargeTimers.set(el, timer);
}

function cancelPassiveCharge(el) {
  const timer = passiveChargeTimers.get(el);
  if (timer) window.clearTimeout(timer);
  passiveChargeTimers.delete(el);
  if (el) {
    delete el.dataset.spwChargePending;
    if (el.dataset.spwPassiveCharge !== 'true') {
      delete el.dataset.spwCharge;
      delete el.dataset.spwChargeSource;
    }
  }
}

/* ==========================================================================
   Persistence
   ========================================================================== */

export function getGroundedRegistry() {
  const parsed = readJsonStorage(STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

function isGlobalKey(key = '') {
  return String(key).startsWith('global:') || String(key).startsWith('shared:');
}

function getPathCouplings() {
  return readJsonStorage(COUPLING_KEY(), {});
}

function getGlobalCouplings() {
  return readJsonStorage(GLOBAL_COUPLING_KEY, {});
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
  writeJsonStorage(COUPLING_KEY(), value);
}

function setGlobalCouplings(value) {
  writeJsonStorage(GLOBAL_COUPLING_KEY, value);
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

  writeJsonStorage(`${CHECKPOINT_PREFIX}${name}`, payload);

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

    writeJsonStorage(STORAGE_KEY, registry);
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

export function getSigilCollection() {
  return readJsonStorage(SIGIL_COLLECTION_KEY, {});
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

  writeJsonStorage(SIGIL_COLLECTION_KEY, next);
  document.documentElement.dataset.spwSigilCollectionCount = String(Object.keys(next).length);

  bus.emit(
    'sigil:collected',
    { sigil: next[definition.prefix], total: Object.keys(next).length },
    { target: document }
  );
}

function syncSigilCollectionState() {
  const count = Object.keys(getSigilCollection()).length;
  if (count) {
    document.documentElement.dataset.spwSigilCollectionCount = String(count);
  } else {
    delete document.documentElement.dataset.spwSigilCollectionCount;
  }
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
