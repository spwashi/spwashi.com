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

const LEDGER_KEY = 'spw-effect-ledger';
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
  try {
    const parsed = JSON.parse(localStorage.getItem(LEDGER_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLedger(entries) {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(entries.slice(0, MAX_EFFECTS)));
  } catch {
    /* storage may be unavailable; the ledger is residue, never load-bearing */
  }
}

function projectLedgerState(entries) {
  const root = document.documentElement;
  if (!root) return;
  const last = entries[0]?.kind || '';
  root.dataset.spwEffects = [`count:${entries.length}`, last ? `last:${last}` : '']
    .filter(Boolean)
    .join(' ');
}

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
  writeLedger(entries);
  projectLedgerState(entries);
  bus.emit(EFFECT_LEDGER_CONTRACT.events.recorded, entry);
  return entry;
}

export function initEffectLedger() {
  const unsubs = [];

  const onReward = (event) => record(event?.detail?.rewardKind || 'discovery-reward', event?.detail || {});
  document.addEventListener('spw:discovery-reward', onReward, { passive: true });
  unsubs.push(() => document.removeEventListener('spw:discovery-reward', onReward));

  unsubs.push(bus.on('spell:cast', (event) => record('spell-cast', { label: 'Spell cast', summary: event?.detail?.snippet ? 'Composed state serialized as a replayable extension.' : '', ...event?.detail })));
  unsubs.push(bus.on('spell:decomposed', (event) => record('spell-decomposed', { label: `Spell reopened: ${event?.detail?.name || ''}`, summary: 'A saved spell returned to the cauldron as ingredients.', ...event?.detail })));

  projectLedgerState(readLedger());

  window.spwEffects = {
    list: () => readLedger(),
    clear() {
      writeLedger([]);
      projectLedgerState([]);
      bus.emit(EFFECT_LEDGER_CONTRACT.events.cleared, {});
    },
  };

  return () => unsubs.forEach((fn) => { try { fn(); } catch { /* already gone */ } });
}
