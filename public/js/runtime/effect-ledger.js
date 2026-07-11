/**
 * Effect Ledger — rung 1 of the literacy precipitation press.
 *
 * Named esoteric effects (discovery rewards, spell casts, decompositions,
 * completed arcs) precipitate here as durable, inspectable records: the raw
 * material the bulletin boards will pin and the press will eventually print.
 * Lore: recognizing an ability you have gained is a named effect; the ledger
 * is where that recognition condenses.
 *
 * Interaction-cache stratum: remembered to make return visits feel earned,
 * never load-bearing. Clearing the ledger loses nothing but the residue.
 *
 * Flourish projection: count/last/charge land on <html> so ornament CSS can
 * read precipitated residue without inspecting localStorage.
 */

import { bus } from '/public/js/kernel/bus.js';
import { writeRuntimeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { guardCall } from '/public/js/kernel/dom-render.js';
import {
  readJson,
  runCriticalPath,
  STORAGE_KEYS,
  writeJson,
} from '/public/js/kernel/storage-utils.js';

const LEDGER_KEY = STORAGE_KEYS.EFFECT_LEDGER;
const MAX_EFFECTS = 60;
const PULSE_MS = 720;

export const EFFECT_LEDGER_CONTRACT = Object.freeze({
  storageKey: LEDGER_KEY,
  maxEffects: MAX_EFFECTS,
  timingChunk: 'idle-residue',
  sources: Object.freeze({
    reward: 'spw:discovery-reward',
    cast: 'spell:cast',
    decomposed: 'spell:decomposed',
    collection: 'spw:collection-achievement',
    rewardUi: 'spw:reward-unlocked',
  }),
  attributes: Object.freeze({
    /* G1 bundle on <html>: data-spw-effects="count:12 last:spell-cast" */
    state: 'data-spw-effects',
    count: 'data-spw-effect-ledger-count',
    last: 'data-spw-effect-ledger-last',
    pulse: 'data-spw-effect-pulse',
    charge: 'data-spw-effect-charge',
  }),
  cssVars: Object.freeze({
    count: '--spw-effect-count',
    charge: '--spw-effect-charge',
    pulse: '--spw-effect-pulse',
  }),
  events: Object.freeze({
    recorded: 'effect:recorded',
    cleared: 'effect:ledger-cleared',
  }),
  /** Catalog-aligned updates topology for flourish/residue consumers. */
  updates: Object.freeze([
    'html:flourish:data-spw-effects',
    'html:flourish:data-spw-effect-pulse',
    'html:flourish:data-spw-effect-charge',
    'html:residue:data-spw-effect-ledger-count',
    'html:residue:data-spw-effect-ledger-last',
    'html:flourish:--spw-effect-count',
    'html:flourish:--spw-effect-charge',
    'html:flourish:--spw-effect-pulse',
    'residue:event:effect:recorded',
    'residue:event:effect:ledger-cleared',
  ]),
});

let pulseTimer = 0;

function readLedger() {
  return readJson(LEDGER_KEY, [], { requireArray: true });
}

function writeLedger(entries) {
  return writeJson(LEDGER_KEY, entries.slice(0, MAX_EFFECTS));
}

function chargeFromCount(count = 0) {
  if (!count) return 0;
  // Soft log curve so large ledgers do not peg ornament intensity.
  return Math.min(1, 0.18 + Math.log10(count + 1) * 0.42);
}

function projectLedgerState(entries, options = {}) {
  const root = document.documentElement;
  if (!root) return;

  const count = entries.length;
  const last = entries[0]?.kind || '';
  const charge = chargeFromCount(count);
  const chargeToken = count ? charge.toFixed(3) : null;
  const pulse = Boolean(options.pulse && last);
  const countValue = count ? String(count) : '';

  writeRuntimeDatasetValues(root, {
    spwEffects: count
      ? [`count:${count}`, last ? `last:${last}` : ''].filter(Boolean).join(' ')
      : null,
    spwEffectLedgerCount: count ? String(count) : null,
    spwEffectLedgerLast: last || null,
    spwEffectCharge: chargeToken,
    spwEffectPulse: pulse ? last : null,
  }, {
    source: 'effect-ledger',
    reason: options.reason || 'ledger-projection',
  });

  // Flourish CSS vars — string-literal names for style-property contract;
  // skip no-op writes to limit style recalc pressure.
  if (root.style.getPropertyValue('--spw-effect-count').trim() !== countValue) {
    if (countValue) root.style.setProperty('--spw-effect-count', countValue);
    else root.style.removeProperty('--spw-effect-count');
  }
  if (root.style.getPropertyValue('--spw-effect-charge').trim() !== (chargeToken || '')) {
    if (chargeToken) root.style.setProperty('--spw-effect-charge', chargeToken);
    else root.style.removeProperty('--spw-effect-charge');
  }

  if (pulse) {
    if (root.style.getPropertyValue('--spw-effect-pulse').trim() !== '1') {
      root.style.setProperty('--spw-effect-pulse', '1');
    }
    if (pulseTimer) window.clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => {
      pulseTimer = 0;
      if (root.dataset.spwEffectPulse === last) {
        delete root.dataset.spwEffectPulse;
      }
      root.style.removeProperty('--spw-effect-pulse');
    }, PULSE_MS);
  }
}

/**
 * Precipitate one named effect into the ledger.
 * Mirror shape: SpwEffectEntry in types/spw.d.ts.
 */
function record(kind, detail = {}) {
  const entry = {
    kind,
    label: detail.label || detail.title || kind,
    summary: detail.summary || '',
    rewardKind: detail.rewardKind || '',
    path: window.location.pathname,
    at: Date.now(),
  };
  const entries = [entry, ...readLedger()];
  if (!writeLedger(entries)) return entry;

  projectLedgerState(entries, { pulse: true, reason: 'ledger-record' });
  bus.emit(EFFECT_LEDGER_CONTRACT.events.recorded, entry);
  return entry;
}

function normalizeKindFromDetail(fallback, detail = {}) {
  return detail.rewardKind || detail.kind || detail.id || detail.name || fallback;
}

export function initEffectLedger() {
  const unsubs = [];

  const onReward = guardCall(
    (event) => record(
      normalizeKindFromDetail('discovery-reward', event?.detail || {}),
      event?.detail || {},
    ),
    'effect-ledger:reward',
    { silent: true },
  );
  document.addEventListener('spw:discovery-reward', onReward, { passive: true });
  unsubs.push(() => document.removeEventListener('spw:discovery-reward', onReward));

  unsubs.push(bus.on('spell:cast', guardCall(
    (event) => record('spell-cast', {
      label: 'Spell cast',
      summary: event?.detail?.snippet ? 'Composed state serialized as a replayable extension.' : '',
      ...event?.detail,
    }),
    'effect-ledger:cast',
    { silent: true },
  )));

  unsubs.push(bus.on('spell:decomposed', guardCall(
    (event) => record('spell-decomposed', {
      label: `Spell reopened: ${event?.detail?.name || ''}`,
      summary: 'A saved spell returned to the cauldron as ingredients.',
      ...event?.detail,
    }),
    'effect-ledger:decomposed',
    { silent: true },
  )));

  // Optional flourish sources — no-op when no producer emits them.
  unsubs.push(bus.on('spw:collection-achievement', guardCall(
    (event) => record(
      normalizeKindFromDetail('collection-achievement', event?.detail || {}),
      {
        label: event?.detail?.label || 'Collection achievement',
        summary: event?.detail?.summary || 'A collectible diversity threshold was crossed.',
        ...event?.detail,
      },
    ),
    'effect-ledger:collection',
    { silent: true },
  )));

  unsubs.push(bus.on('spw:reward-unlocked', guardCall(
    (event) => record(
      normalizeKindFromDetail('reward-unlocked', event?.detail || {}),
      event?.detail || {},
    ),
    'effect-ledger:reward-ui',
    { silent: true },
  )));

  runCriticalPath('effect-ledger:project', () => projectLedgerState(readLedger()), null);

  window.spwEffects = {
    list: () => readLedger(),
    contract: () => EFFECT_LEDGER_CONTRACT,
    clear() {
      writeLedger([]);
      projectLedgerState([], { reason: 'ledger-clear' });
      bus.emit(EFFECT_LEDGER_CONTRACT.events.cleared, {});
    },
  };

  return () => {
    if (pulseTimer) {
      window.clearTimeout(pulseTimer);
      pulseTimer = 0;
    }
    unsubs.forEach((fn) => {
      runCriticalPath('effect-ledger:teardown', () => fn(), null);
    });
    const root = document.documentElement;
    if (root) {
      root.style.removeProperty('--spw-effect-count');
      root.style.removeProperty('--spw-effect-charge');
      root.style.removeProperty('--spw-effect-pulse');
    }
    delete window.spwEffects;
  };
}
