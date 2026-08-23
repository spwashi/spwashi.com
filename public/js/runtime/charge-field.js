import { bus } from '/public/js/kernel/bus.js';
import { writeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { detectOperator } from '/public/js/kernel/shared.js';

const PHASE_INTENSITY = Object.freeze({
  armed: 0.22,
  preview: 0.48,
  charged: 0.82,
  discharging: 0.34,
  settled: 0,
  grounded: 0.55,
  transferring: 0.65,
});

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

const FRAME_SELECTOR = 'main section.site-frame, main .site-frame, section.site-frame';
const RELATION_STYLE_PROPERTIES = Object.freeze([
  '--spw-curiosity-reward',
  '--spw-relationship-reward',
  '--spw-architecture-reward',
  '--spw-conceptual-nuance',
]);

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
  return OPERATOR_DISCHARGE[operatorType] || 'release';
}

function inferRelation(operatorType = '', discharge = '') {
  if (CURIOSITY_OPERATORS.has(operatorType) || discharge === 'release') return 'curiosity';
  if (RELATIONSHIP_OPERATORS.has(operatorType) || discharge === 'transfer') return 'relationship';
  if (ARCHITECTURE_OPERATORS.has(operatorType) || discharge === 'ground' || discharge === 'project') {
    return 'architecture';
  }
  return '';
}

function writeRelationReward(intensity = 0, relation = '') {
  const reward = clamp01(intensity);
  const curiosity = relation === 'curiosity' ? reward : 0;
  const relationship = relation === 'relationship' ? reward : 0;
  const architecture = relation === 'architecture' ? reward : 0;
  const nuance = Math.max(curiosity, relationship, architecture);

  document.documentElement.style.setProperty('--spw-curiosity-reward', curiosity.toFixed(2));
  document.documentElement.style.setProperty('--spw-relationship-reward', relationship.toFixed(2));
  document.documentElement.style.setProperty('--spw-architecture-reward', architecture.toFixed(2));
  document.documentElement.style.setProperty('--spw-conceptual-nuance', nuance.toFixed(2));
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
    document.documentElement.style.setProperty(
      '--spw-charge-field',
      String(state.intensity ?? 0)
    );
    writeRelationReward(state.intensity ?? 0, relation);
    syncReadouts();
  };

  const scheduleDecay = () => {
    if (decayTimer) window.clearTimeout(decayTimer);
    decayTimer = window.setTimeout(() => {
      activeIntensity = Math.max(0, activeIntensity - 0.18);
      if (activeIntensity < 0.08) {
        activeIntensity = 0;
        syncRoot({ field: 'quiet', intensity: 0 });
        return;
      }
      syncRoot({ field: 'bleeding', intensity: activeIntensity });
    }, 2800);
  };

  const applyFramePhase = (frame, phase, discharge = null) => {
    if (!(frame instanceof HTMLElement)) return;

    if (phase) frame.dataset.spwChargePhase = phase;

    if (phase === 'preview' || phase === 'charged') {
      frame.dataset.spwConsequenceLive = frame.dataset.spwConsequence || 'attention';
    }

    if (discharge) {
      frame.dataset.spwDischargeKind = discharge;
      frame.dataset.spwConsequenceLive = discharge;
      window.setTimeout(() => {
        if (frame.dataset.spwDischargeKind === discharge) {
          delete frame.dataset.spwDischargeKind;
        }
      }, 1400);
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
      const frame = nearestFrame(eventElement(event));
      if (frame) clearFrameLiveState(frame);
      activeIntensity = 0;
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

  syncRoot({ field: 'quiet', intensity: 0 });

  const cleanup = () => {
    unsubscribers.forEach((off) => off?.());
    if (decayTimer) window.clearTimeout(decayTimer);
    syncRoot({});
    document.documentElement.style.removeProperty('--spw-charge-field');
    RELATION_STYLE_PROPERTIES.forEach((property) => {
      document.documentElement.style.removeProperty(property);
    });
  };
  ctx?.addCleanup?.(cleanup);

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
