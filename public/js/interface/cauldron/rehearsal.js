/**
 * Rehearsal and saturation — when more gathering stops paying.
 *
 * The fluency model reports coverage: which operators a reader has met. Meeting
 * is not learning, and the two findings that matter here are old and robust:
 *
 *   spacing    a construct met twice with time between is retained far better
 *              than one met twice in a row. Massed re-exposure feels like
 *              progress and mostly is not.
 *   retrieval  producing something from memory strengthens it more than seeing
 *              it again.
 *
 * So an encounter is not one event type, and the ledger records the interval —
 * a rehearsal at ten minutes and one at three days are different acts.
 *
 * Saturation, not a score.
 *
 * The question of when reinforcement is appropriate is not a question about the
 * visitor. Scoring someone's investment means ranking them, and a threshold on
 * a reader is a judgement that has to be defended. Saturation is a property of
 * the solution: a cauldron holding six fragments of one construct cannot
 * dissolve a seventh usefully, and that is a fact about the mixture rather than
 * a verdict on whoever stirred it.
 *
 * This is where reinforcement becomes relevant on its own terms. Below
 * saturation, more gathering still teaches — so the honest thing is to stay out
 * of the way and let someone collect. At saturation, further collecting of that
 * construct adds nothing, and rehearsal is what pays instead. Nobody has to be
 * assessed for that to be true.
 *
 * Solubility rises with spaced rehearsal. What you have actually learned, you
 * can hold more of — so the limit is not fixed, and the way past it is to
 * return to something after time has passed rather than to gather harder.
 *
 * Past saturation the excess precipitates, which is the same return pass the
 * corpus already runs: what will not stay in solution comes out as a solid and
 * is available to be read. Supersaturation is possible and unstable — a
 * supersaturated cauldron crystallises on contact with a seed.
 *
 * No DOM, no mount. One storage key, read defensively.
 */

import { measureFluency } from './fluency.js';

const LEDGER_KEY = 'spw-rehearsal';

/**
 * How many of one construct a cauldron holds before that construct stops
 * dissolving. Low on purpose: the interesting behaviour is at the limit, and a
 * limit nobody reaches is not a mechanic.
 */
const BASE_SOLUBILITY = 3;

/** Each spaced rehearsal raises what can be held of that construct. */
const SOLUBILITY_PER_REHEARSAL = 2;

/** Beyond this ratio the solution is supersaturated and ready to nucleate. */
const SUPERSATURATION = 1.5;

/** A second encounter sooner than this is massed, not spaced. */
const MASSED_WINDOW_MS = 5 * 60 * 1000;

function readLedger() {
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(LEDGER_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeLedger(ledger) {
  try {
    globalThis.localStorage?.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    /* storage unavailable or full; rehearsal is not worth failing a page over */
  }
}

/**
 * Record an encounter with a construct. Returns what kind it was, because a
 * first meeting and a genuine spaced rehearsal deserve different responses and
 * collapsing them is how a reward stops meaning anything.
 */
export function recordEncounter(construct, now = Date.now()) {
  if (!construct) return null;
  const ledger = readLedger();
  const prior = ledger[construct];

  if (!prior) {
    ledger[construct] = { first: now, last: now, met: 1, spaced: 0 };
    writeLedger(ledger);
    return { construct, kind: 'first', interval: 0, spaced: 0 };
  }

  const interval = now - prior.last;
  const spaced = interval >= MASSED_WINDOW_MS;
  ledger[construct] = {
    first: prior.first,
    last: now,
    met: (prior.met || 0) + 1,
    // Only spaced repetitions count toward strength. Massed ones are recorded
    // and earn nothing, which is the honest model.
    spaced: (prior.spaced || 0) + (spaced ? 1 : 0),
  };
  writeLedger(ledger);
  return { construct, kind: spaced ? 'rehearsal' : 'massed', interval, spaced: ledger[construct].spaced };
}

/** What one construct can currently hold, given what has been rehearsed. */
export function solubilityOf(construct) {
  const record = readLedger()[construct];
  return BASE_SOLUBILITY + (record?.spaced || 0) * SOLUBILITY_PER_REHEARSAL;
}

/**
 * Saturation per construct, and for the cauldron as a whole.
 *
 * `ratio` is held over solubility: below 1 the construct still dissolves, at 1
 * it is saturated, above SUPERSATURATION it is ready to nucleate.
 */
export function measureSaturation(ingredients = []) {
  const items = Array.isArray(ingredients) ? ingredients.filter(Boolean) : [];
  const held = new Map();
  for (const item of items) {
    const key = item?.operator || item?.expression || '';
    if (key) held.set(key, (held.get(key) || 0) + 1);
  }

  const constructs = [...held.entries()].map(([construct, count]) => {
    const solubility = solubilityOf(construct);
    const ratio = count / solubility;
    return {
      construct,
      held: count,
      solubility,
      ratio,
      state: ratio >= SUPERSATURATION ? 'supersaturated' : ratio >= 1 ? 'saturated' : 'dissolving',
    };
  }).sort((a, b) => b.ratio - a.ratio);

  const saturated = constructs.filter((c) => c.state !== 'dissolving');
  // What will not stay in solution. This is the return pass: excess comes out
  // as a solid rather than being discarded.
  const precipitate = constructs
    .filter((c) => c.held > c.solubility)
    .map((c) => ({ construct: c.construct, excess: c.held - c.solubility }));

  return {
    constructs,
    saturated,
    precipitate,
    supersaturated: constructs.filter((c) => c.state === 'supersaturated'),
    reading: !constructs.length
      ? 'nothing in solution'
      : saturated.length
        ? `${saturated.length} of ${constructs.length} at or past saturation — gathering more of those dissolves nothing`
        : 'everything still dissolving — collecting is still teaching',
  };
}

/**
 * What is due for rehearsal — held constructs whose last encounter is furthest
 * back, weighted so something met once long ago outranks something met five
 * times today.
 */
export function dueForRehearsal(now = Date.now(), limit = 3) {
  const ledger = readLedger();
  return Object.entries(ledger)
    .filter(([construct]) => !construct.startsWith('__'))
    .map(([construct, record]) => {
      const since = now - (record.last || now);
      // Each spaced repetition roughly doubles how long it can rest. Crude
      // beside a real scheduler, and enough to stop recommending the thing
      // someone just looked at.
      const restBudget = MASSED_WINDOW_MS * (2 ** (record.spaced || 0));
      return { construct, since, overdue: since - restBudget, met: record.met || 0 };
    })
    .filter((row) => row.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, limit);
}

/**
 * The only thing a caller should need.
 *
 * Reinforcement is inactive while the solution is still dissolving — not
 * because the reader has not earned it, but because collecting is still the
 * thing that teaches and interrupting it would be worse than useless. The
 * returned shape carries no rehearsal data in that case, so a consumer cannot
 * accidentally render an offer that is not warranted.
 */
export function reinforcement(ingredients = [], now = Date.now()) {
  const saturation = measureSaturation(ingredients);
  const fluency = measureFluency(ingredients);

  if (!saturation.saturated.length) {
    return { active: false, saturation, reading: saturation.reading };
  }

  const due = dueForRehearsal(now);
  const nucleating = saturation.supersaturated[0] || null;

  return {
    active: true,
    saturation,
    due,
    // A supersaturated construct is the one moment where a prompt is clearly
    // warranted: the solution is unstable and a seed resolves it.
    nucleation: nucleating
      ? {
        construct: nucleating.construct,
        reading: `${nucleating.construct} is supersaturated — a seed would crystallise it`,
      }
      : null,
    reading: due.length
      ? `${due.length} held ${due.length === 1 ? 'construct has' : 'constructs have'} rested long enough to be worth meeting again`
      : `saturated, nothing rested yet — ${fluency.operators.unmet.length} operators remain unmet if you want to keep dissolving`,
  };
}

export const REHEARSAL_CONTRACT = Object.freeze({
  key: LEDGER_KEY,
  baseSolubility: BASE_SOLUBILITY,
  solubilityPerRehearsal: SOLUBILITY_PER_REHEARSAL,
  supersaturation: SUPERSATURATION,
  massedWindowMs: MASSED_WINDOW_MS,
  rule: 'reinforcement follows the state of the solution, never an assessment of the reader',
});
