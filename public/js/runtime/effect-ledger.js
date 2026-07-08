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

export const EFFECT_LEDGER_CONTRACT = Object.freeze({
  storageKey: LEDGER_KEY,
  maxEffects: MAX_EFFECTS,
  sources: Object.freeze({
    reward: 'spw:discovery-reward',
    cast: 'spell:cast',
    decomposed: 'spell:decomposed',
  }),
  attributes: Object.freeze({
    /* G1 bundle on <html>: data-spw-effects="count:12 last:spell-cauldron-literacy" */
    state: 'data-spw-effects',
  }),
  events: Object.freeze({
    recorded: 'effect:recorded',
    cleared: 'effect:ledger-cleared',
  }),
});

function readLedger() {
  return readJson(LEDGER_KEY, [], { requireArray: true });
}

function writeLedger(entries) {
  return writeJson(LEDGER_KEY, entries.slice(0, MAX_EFFECTS));
}

function projectLedgerState(entries) {
  const root = document.documentElement;
  if (!root) return;

  const last = entries[0]?.kind || '';
  writeRuntimeDatasetValues(root, {
    spwEffects: [`count:${entries.length}`, last ? `last:${last}` : '']
      .filter(Boolean)
      .join(' '),
    spwEffectLedgerCount: entries.length ? String(entries.length) : null,
    spwEffectLedgerLast: last || null,
  }, {
    source: 'effect-ledger',
    reason: 'ledger-projection',
  });
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

  projectLedgerState(entries);
  bus.emit(EFFECT_LEDGER_CONTRACT.events.recorded, entry);
  return entry;
}

export function initEffectLedger() {
  const unsubs = [];

  const onReward = guardCall(
    (event) => record(event?.detail?.rewardKind || 'discovery-reward', event?.detail || {}),
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

  runCriticalPath('effect-ledger:project', () => projectLedgerState(readLedger()), null);

  window.spwEffects = {
    list: () => readLedger(),
    clear() {
      writeLedger([]);
      projectLedgerState([]);
      bus.emit(EFFECT_LEDGER_CONTRACT.events.cleared, {});
    },
  };

  return () => unsubs.forEach((fn) => {
    runCriticalPath('effect-ledger:teardown', () => fn(), null);
  });
}