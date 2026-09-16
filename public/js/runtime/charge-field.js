import { bus } from '/public/js/kernel/bus.js';
import { writeDatasetValues, writeStyleProperty } from '/public/js/kernel/dom-contracts.js';
import { detectOperator, getOperatorDefinition } from '/public/js/kernel/shared.js';
import { PHASE_INTENSITY, CHARGE_TIMING, decayCharge } from '/public/js/kernel/charge-field-contract.js';

const OPERATOR_DISCHARGE = Object.freeze({
  wonder: 'release',
  probe: 'release',
  potential: 'transfer',
  ref: 'transfer',
  frame: 'ground',
  vibration: 'ground',
  address: 'ground',
  ground: 'ground',
  integration: 'project',
  object: 'project',
  action: 'release',
  value: 'project',
  substrate: 'transfer',
  meta: 'transfer',
  resource: 'transfer',
  support: 'transfer',
  binding: 'ground',
  perspective: 'transfer',
  subject: 'transfer',
  confluence: 'transfer',
  normalize: 'release',
  measure: 'release',
  // route/stream/surface: real operators (7/19/11 pages), classified under
  // RELATIONSHIP_OPERATORS below but previously absent here, so any
  // charge/discharge on them silently fell back to 'release'. electrostatic-
  // affordances.css independently infers discharge from the operator too —
  // matching its groups keeps the CSS-only and JS-driven paths honest.
  route: 'transfer',
  stream: 'transfer',
  surface: 'transfer',
});

const CURIOSITY_OPERATORS = new Set([
  'wonder',
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

const READOUT_KEYS = Object.freeze({
  field: 'spwChargeField',
  intensity: 'spwChargeIntensity',
  discharge: 'spwLastDischarge',
  carrier: 'spwChargeCarrier',
});

const FRAME_SELECTOR = 'main section.spw-frame, main .spw-frame, section.spw-frame';
const RELATION_STYLE_PROPERTIES = Object.freeze([
  '--spw-curiosity-reward',
  '--spw-relationship-reward',
  '--spw-architecture-reward',
]);

/* The colour the charged field paints with. Eight system sheets (arrival,
   roles, affordance and probe legibility, module potential, expression and
   theme resonance, the legibility lens) already funnel their accent through
   this one hook and fall back to --active-op-color, but nothing set it, so a
   discharge on a probe and a discharge on a binding lit the same teal. The
   carrier operator's own token is the honest colour, and theme packs
   redefine --op-*-color, so the field follows the theme without a second
   palette. Removed at quiet so the ambient accent returns.

   Authored HTML still writes aliases (integrate, probe, route). The colour
   keeps the authored token first so a pack that recolours --op-probe-color
   still wins, then falls through to the canonical token so an integrate
   chip reaches --op-integration-color instead of the ambient teal. */
const CHARGE_FIELD_COLOR_PROPERTY = '--spw-charge-field-color';

function canonicalOperatorType(type = '') {
  const operator = String(type || '').trim().toLowerCase();
  if (!operator) return '';
  return getOperatorDefinition(operator)?.type || operator;
}

function chargeFieldColor(carrier = '') {
  const operator = String(carrier || '').trim().toLowerCase();
  if (!/^[a-z][a-z-]*$/.test(operator)) return '';
  const canonical = canonicalOperatorType(operator);
  if (canonical && canonical !== operator && /^[a-z][a-z-]*$/.test(canonical)) {
    return `var(--op-${operator}-color, var(--op-${canonical}-color, var(--active-op-color, #008080)))`;
  }
  return `var(--op-${operator}-color, var(--active-op-color, #008080))`;
}

function clamp01(value = 0) {
  const next = Number(value);
  if (!Number.isFinite(next)) return 0;
  return Math.max(0, Math.min(1, next));
}

function eventElement(event) {
  const target = event?.target;
  const detailEl = event?.detail?.element;
  if (target instanceof HTMLElement) return target;
  if (detailEl instanceof HTMLElement) return detailEl;
  return null;
}

function nearestFrame(el) {
  return el?.closest?.(FRAME_SELECTOR) ?? null;
}

function resolveOperatorType(el, detail = {}) {
  const declared = el?.dataset?.spwOperator;
  if (declared) return declared;

  const text = detail.label || detail.text || el?.textContent || '';
  const detected = detectOperator(String(text).trim());
  return detected?.type || '';
}

function inferDischarge(operatorType, detail = {}) {
  if (detail.grounded) return 'ground';
  if (detail.collected || detail.primedBy) return 'transfer';
  return OPERATOR_DISCHARGE[operatorType]
    || OPERATOR_DISCHARGE[canonicalOperatorType(operatorType)]
    || 'release';
}

function inferRelation(operatorType = '', discharge = '') {
  const canonical = canonicalOperatorType(operatorType);
  if (
    CURIOSITY_OPERATORS.has(operatorType)
    || CURIOSITY_OPERATORS.has(canonical)
    || discharge === 'release'
  ) return 'curiosity';
  if (
    RELATIONSHIP_OPERATORS.has(operatorType)
    || RELATIONSHIP_OPERATORS.has(canonical)
    || discharge === 'transfer'
  ) return 'relationship';
  if (
    ARCHITECTURE_OPERATORS.has(operatorType)
    || ARCHITECTURE_OPERATORS.has(canonical)
    || discharge === 'ground'
    || discharge === 'project'
  ) {
    return 'architecture';
  }
  return '';
}

function writeRelationReward(intensity = 0, relation = '') {
  const reward = clamp01(intensity);
  const curiosity = relation === 'curiosity' ? reward : 0;
  const relationship = relation === 'relationship' ? reward : 0;
  const architecture = relation === 'architecture' ? reward : 0;

  writeStyleProperty(document.documentElement, '--spw-curiosity-reward', curiosity.toFixed(2));
  writeStyleProperty(document.documentElement, '--spw-relationship-reward', relationship.toFixed(2));
  writeStyleProperty(document.documentElement, '--spw-architecture-reward', architecture.toFixed(2));
}

function syncReadouts(root = document) {
  const html = document.documentElement;
  root.querySelectorAll('[data-charge-field-readout]').forEach((node) => {
    const slot = node.getAttribute('data-charge-field-readout');
    const key = READOUT_KEYS[slot];
    if (!key) return;
    const value = html.dataset[key] || '—';
    if (node.textContent !== value) node.textContent = value;
  });
}

function clearFrameLiveState(frame) {
  if (!(frame instanceof HTMLElement)) return;
  delete frame.dataset.spwChargePhase;
  delete frame.dataset.spwDischargeKind;
  delete frame.dataset.spwConsequenceLive;
}

function createChargeFieldInstance(ctx = null) {
  let activeIntensity = 0;
  let decayTimer = null;
  let disposed = false;
  const frameTimers = new Map();
  const activeFrames = new Set();

  const clearFrame = (frame) => {
    if (frameTimers.has(frame)) window.clearTimeout(frameTimers.get(frame));
    frameTimers.delete(frame);
    activeFrames.delete(frame);
    clearFrameLiveState(frame);
  };

  const syncRoot = (state = {}) => {
    const relation = state.relation
      || inferRelation(state.carrier || '', state.discharge || '');
    const entries = {
      spwChargeField: state.field ?? null,
      spwChargeIntensity: state.intensity != null
        ? String(Number(state.intensity).toFixed(2))
        : null,
      spwLastDischarge: state.discharge ?? null,
      spwChargeCarrier: state.carrier ?? null,
      spwConceptRelation: relation || null,
      spwInteractionWonder: relation || null,
    };

    writeDatasetValues(document.documentElement, entries);
    writeStyleProperty(
      document.documentElement,
      '--spw-charge-field',
      String(state.intensity ?? 0)
    );
    writeStyleProperty(
      document.documentElement,
      CHARGE_FIELD_COLOR_PROPERTY,
      clamp01(state.intensity) > 0 ? chargeFieldColor(state.carrier) : ''
    );
    writeRelationReward(state.intensity ?? 0, relation);
    syncReadouts();
  };

  const scheduleDecay = () => {
    if (decayTimer !== null) window.clearTimeout(decayTimer);
    decayTimer = null;
    if (disposed || activeIntensity === 0) return;
    decayTimer = window.setTimeout(() => {
      decayTimer = null;
      if (disposed) return;
      const state = decayCharge(activeIntensity);
      activeIntensity = state.intensity;
      syncRoot(state);
      if (activeIntensity === 0) activeFrames.forEach(clearFrame);
      else scheduleDecay();
    }, CHARGE_TIMING.decayMs);
  };

  const applyFramePhase = (frame, phase, discharge = null) => {
    if (!(frame instanceof HTMLElement)) return;
    // A new gesture supersedes the previous discharge, even on the same frame.
    if (frameTimers.has(frame)) clearFrame(frame);
    activeFrames.add(frame);

    if (phase) writeDatasetValues(frame, { spwChargePhase: phase });

    if (phase === 'preview' || phase === 'charged') {
      writeDatasetValues(frame, { spwConsequenceLive: frame.dataset.spwConsequence || 'attention' });
    }

    if (discharge) {
      frame.dataset.spwDischargeKind = discharge;
      frame.dataset.spwConsequenceLive = discharge;
      frameTimers.set(frame, window.setTimeout(() => clearFrame(frame), CHARGE_TIMING.dischargeMs));
    }
  };

  const onChargePhase = (phase, event) => {
    const el = eventElement(event);
    if (!(el instanceof HTMLElement)) return;

    const detail = event?.detail || {};
    const operatorType = resolveOperatorType(el, detail);
    const intensity = PHASE_INTENSITY[phase] ?? activeIntensity;
    activeIntensity = Math.max(activeIntensity, intensity);

    const field = phase === 'charged'
      ? 'charged'
      : phase === 'preview'
        ? 'primed'
        : phase === 'armed'
          ? 'arming'
          : phase === 'settled'
            ? 'quiet'
            : 'primed';

    syncRoot({
      field,
      intensity: activeIntensity,
      carrier: operatorType || null,
      discharge: null,
    });

    applyFramePhase(nearestFrame(el), phase);
    scheduleDecay();
  };

  const onDischarge = (event) => {
    const el = eventElement(event);
    const detail = event?.detail || {};
    const operatorType = el ? resolveOperatorType(el, detail) : (document.documentElement.dataset.spwChargeCarrier || '');
    const discharge = inferDischarge(operatorType, detail);

    activeIntensity = PHASE_INTENSITY.discharging;
    syncRoot({
      field: 'discharging',
      intensity: activeIntensity,
      discharge,
      carrier: operatorType || null,
    });

    if (el) applyFramePhase(nearestFrame(el), 'discharging', discharge);
    scheduleDecay();
  };

  const unsubscribers = [
    bus.on('charge:armed', (event) => onChargePhase('armed', event)),
    bus.on('charge:preview', (event) => onChargePhase('preview', event)),
    bus.on('charge:charged', (event) => onChargePhase('charged', event)),
    bus.on('charge:settled', (event) => {
      activeFrames.forEach(clearFrame);
      activeIntensity = 0;
      scheduleDecay();
      syncRoot({ field: 'quiet', intensity: 0, carrier: null, discharge: null });
    }),
    bus.on('brace:discharged', onDischarge),
    bus.on('spell:grounded', (event) => {
      const operatorType = resolveOperatorType(eventElement(event), event?.detail || {});
      activeIntensity = PHASE_INTENSITY.grounded;
      syncRoot({
        field: 'grounded',
        intensity: activeIntensity,
        discharge: 'ground',
        carrier: operatorType || null,
      });
      applyFramePhase(nearestFrame(eventElement(event)), 'charged', 'ground');
      scheduleDecay();
    }),
    bus.on('spell:capture', (event) => {
      const operatorType = resolveOperatorType(eventElement(event), event?.detail || {});
      activeIntensity = PHASE_INTENSITY.transferring;
      syncRoot({
        field: 'transferring',
        intensity: activeIntensity,
        discharge: 'transfer',
        carrier: operatorType || null,
      });
      applyFramePhase(nearestFrame(eventElement(event)), 'charged', 'transfer');
      scheduleDecay();
    }),
  ];

  const HOP_FIELD_SOURCES = new Set([
    'in-page-hop',
    'hash-hop',
    'landmark-swipe',
    'section-travel',
    'cauldron-gather',
    'cauldron-inspect',
    'swipe-rail',
  ]);
  const onInteractionPhase = (event) => {
    const source = event?.detail?.source || '';
    if (!HOP_FIELD_SOURCES.has(source)) return;
    const interactionPhase = event?.detail?.phase || '';
    const chargePhase = interactionPhase === 'discover' || interactionPhase === 'inspect'
      ? 'charged'
      : interactionPhase === 'charge'
        ? 'preview'
        : interactionPhase === 'approach' || interactionPhase === 'prime'
          ? 'armed'
          : '';
    if (!chargePhase) return;
    const hash = event?.detail?.hash || '';
    const el = (hash && document.getElementById(hash))
      || document.querySelector('[data-spw-section-state="active"]');
    onChargePhase(chargePhase, { target: el, detail: event.detail || {} });
  };
  document.addEventListener('spw:interaction-phase', onInteractionPhase);

  syncRoot({ field: 'quiet', intensity: 0 });

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    unsubscribers.forEach((off) => off?.());
    document.removeEventListener('spw:interaction-phase', onInteractionPhase);
    if (decayTimer !== null) window.clearTimeout(decayTimer);
    decayTimer = null;
    activeFrames.forEach(clearFrame);
    syncRoot({});
    document.documentElement.style.removeProperty('--spw-charge-field');
    document.documentElement.style.removeProperty(CHARGE_FIELD_COLOR_PROPERTY);
    RELATION_STYLE_PROPERTIES.forEach((property) => {
      document.documentElement.style.removeProperty(property);
    });
  };
  return { cleanup, syncRoot, syncReadouts };
}

let lastChargeFieldInstance = null;

export function initChargeField(ctx = null) {
  unmountChargeField();
  lastChargeFieldInstance = createChargeFieldInstance(ctx);
  return lastChargeFieldInstance;
}

export function unmountChargeField() {
  if (lastChargeFieldInstance?.cleanup) {
    try { lastChargeFieldInstance.cleanup(); } catch (_) {}
    lastChargeFieldInstance = null;
  }
}

export const SPW_CHARGE_FIELD_CONTRACT = Object.freeze({
  phases: Object.freeze(Object.keys(PHASE_INTENSITY)),
  phaseIntensity: PHASE_INTENSITY,
  operatorDischarge: OPERATOR_DISCHARGE,
  readoutKeys: READOUT_KEYS,
  rewardProperties: RELATION_STYLE_PROPERTIES,
  fieldColorProperty: CHARGE_FIELD_COLOR_PROPERTY,
  portableUse:
    'Electrostatic charge and discharge field model tracking operator carrier, phase intensity, and relation rewards.',
});

export function describeChargeFieldState(root = document) {
  const html = root?.documentElement
    || (typeof document !== 'undefined' ? document.documentElement : null)
    || (root?.nodeType === 1 ? root : null);
  return {
    field: html?.dataset?.spwChargeField || 'quiet',
    intensity: Number.parseFloat(html?.dataset?.spwChargeIntensity || '0') || 0,
    carrier: html?.dataset?.spwChargeCarrier || null,
    discharge: html?.dataset?.spwLastDischarge || null,
  };
}

export { unmountChargeField as unmount };
