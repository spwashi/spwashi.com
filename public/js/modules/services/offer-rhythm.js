/**
 * modules/services/offer-rhythm.js
 *
 * The 13-day rhythm for offers. The month runs in three cycles that close on
 * the 13th, the 26th, and the last day (A, B, C). Each day of a cycle is one
 * of thirteen operators, in the creator's order:
 *
 *   potential · vibration · ground · wonder · action · value · subject ·
 *   perspective · concept · scene · mode · definition · integration
 *
 * An operator puts some lanes of work in season (emphasis). Deals follow a
 * named day rule (DEAL_RULES) and the canonical operator's lanes, so a
 * reader's mutation can move emphasis but never a price.
 *
 * Mutation is the wonder: a reader can rotate the sequence or read it through
 * another name set, and see which lanes come into season. New linguistic
 * mechanics arrive as new NAME_SETS or new mutations, not new code paths.
 *
 * Deals are an easter-egg layer: they show only when the reader turns
 * numericity emphasis up in Settings, or when a link carries ?rhythm=deals.
 * Nothing here is a checkout; the reply to a bundle settles the number.
 *
 * Pure functions only; bundle-composer.js reads them.
 */

/** The canonical sequence: one operator per day of a cycle. */
export const SEQUENCE = Object.freeze([
  { id: 'potential', sigil: '~', lanes: ['scope-note', 'taste-pass', 'lunch'] },
  { id: 'vibration', sigil: '#', lanes: ['intro-card', 'routing', 'share-images'] },
  { id: 'ground', sigil: '.', lanes: ['diagnostic', 'page-check', 'keep-alive'] },
  { id: 'wonder', sigil: '?', lanes: ['half-hour', 'scope-note', 'doodle'] },
  { id: 'action', sigil: '!', lanes: ['fix', 'repair-pass', 'hour-block'] },
  { id: 'value', sigil: '*', lanes: ['plate', 'cover', 'logo'] },
  { id: 'subject', sigil: '&', lanes: ['author-site', 'business-site', 'single-page'] },
  { id: 'perspective', sigil: '@', lanes: ['taste-pass', 'qa-pass', 'page-check'] },
  { id: 'concept', sigil: '< >', lanes: ['arch-memo', 'interactive-cover', 'logo'] },
  { id: 'scene', sigil: '( )', lanes: ['video', 'interactive-cover', 'single-page'] },
  { id: 'mode', sigil: '[ ]', lanes: ['extra-page', 'search', 'signup'] },
  { id: 'definition', sigil: '{ }', lanes: ['handoff', 'app-sprint', 'arch-memo'] },
  { id: 'integration', sigil: '^', lanes: ['retainer', 'tending', 'handoff'] },
]);

/**
 * Ways to name the same thirteen. `canon` is the creator's list; `workbench`
 * is the Spw Workbench reader vocabulary where it differs; `mnemonic` reads
 * each operator as the gesture the site's operator table gives it.
 */
export const NAME_SETS = Object.freeze({
  canon: {},
  workbench: { integration: 'ascension' },
  mnemonic: {
    potential: 'reach out', vibration: 'find the frequency', ground: 'back to earth',
    wonder: 'open the door', action: 'follow the rule', value: 'open the tap',
    subject: 'better together', perspective: 'target locked', concept: 'lasso the field',
    scene: 'light the stage', mode: 'pick a lens', definition: 'hold the space',
    integration: 'lasso the thought',
  },
});

const isPrime = (n) => n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((d) => n % d);

/**
 * Which days carry a deal: named rules, each (day, step, closesOn) → boolean.
 * Add a rule to try a new mechanic; pick one with DEALS.rule, or test one with
 * ?deal-rule=<name> next to ?rhythm=deals.
 */
export const DEAL_RULES = Object.freeze({
  edges: (_day, step) => step <= 2 || step >= 12, // the two days that open a cycle and the two that close it
  closes: (day, _step, closesOn) => day === closesOn, // only the close itself: the 13th, the 26th, the last day
  primes: (day) => isPrime(day), // prime-numbered days of the month
  none: () => false,
});

/**
 * Deals, as a fraction off the ladder price, on the canonical operator's lanes.
 * Owner-configured: the numbers and the rule are the creator's to set, and
 * `enabled: false` hides every deal. Small jobs never discount.
 */
export const DEALS = Object.freeze({
  enabled: true,
  rule: 'edges',
  off: 0.1,
  never: ['lunch', 'fix', 'half-hour', 'page-check'],
});

export function dealRule(search = globalThis.location?.search || '') {
  const asked = new URLSearchParams(search).get('deal-rule');
  return Object.hasOwn(DEAL_RULES, asked) ? asked : DEALS.rule;
}

/** A reader's mutation: how far the sequence is rotated, and which name set reads it. */
export const DEFAULT_MUTATION = Object.freeze({ rotate: 0, names: 'canon' });

const CYCLES = ['A', 'B', 'C'];
const mod = (n, m) => ((n % m) + m) % m;

export function normalizeMutation(value = {}) {
  const rotate = Number.isInteger(value.rotate) ? mod(value.rotate, SEQUENCE.length) : 0;
  const names = Object.hasOwn(NAME_SETS, value.names) ? value.names : 'canon';
  return { rotate, names };
}

/** Day of month → { cycle, step (1–13, canonical), closesOn, operator (after mutation) } */
export function rhythmFor(date = new Date(), mutation = DEFAULT_MUTATION) {
  const { rotate, names } = normalizeMutation(mutation);
  const day = date.getDate();
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const index = Math.min(2, Math.floor((day - 1) / 13));
  const closesOn = index < 2 ? (index + 1) * 13 : last;
  // Cycle C is short (27th to the last day); it counts back from its close,
  // so the last day of every month is integration.
  const step = index < 2 ? day - index * 13 : Math.max(1, 13 - (closesOn - day));
  const base = SEQUENCE[mod(step - 1 + rotate, SEQUENCE.length)];
  const name = NAME_SETS[names][base.id] || base.id;
  return { day, cycle: CYCLES[index], step, closesOn, operator: { ...base, name }, mutation: { rotate, names } };
}

export const inSeason = (rhythm, skillId) => rhythm.operator.lanes.includes(skillId);

/** Deals follow the canonical step and the canonical operator's lanes, never the mutation. */
export function dealFor(rhythm, skillId, rule = dealRule()) {
  if (!DEALS.enabled || DEALS.never.includes(skillId)) return 0;
  const today = DEAL_RULES[rule]?.(rhythm.day, rhythm.step, rhythm.closesOn);
  return today && SEQUENCE[rhythm.step - 1].lanes.includes(skillId) ? DEALS.off : 0;
}

/** Deals show when the reader asked for the rhythm to be loud. */
export function dealsVisible(root = document.documentElement, search = globalThis.location?.search || '') {
  const emphasis = root?.dataset?.spwNumericityEmphasis;
  return emphasis === 'prominent' || emphasis === 'cauldron-first' || /[?&]rhythm=deals\b/.test(search);
}

export const isMutated = (rhythm) => rhythm.mutation.rotate !== 0 || rhythm.mutation.names !== 'canon';

/** One line for the readout: where the month is, as a Spw expression and in words. */
export function rhythmLine(rhythm) {
  const { rotate, names } = rhythm.mutation;
  const marks = [rotate ? `~rotate:${rotate}` : '', names !== 'canon' ? `%names:${names}` : ''].filter(Boolean).join(' ');
  return {
    expression: `.month[${rhythm.cycle}·${rhythm.step}]{${rhythm.operator.sigil} ${rhythm.operator.name}}${marks ? ` ${marks}` : ''}`,
    words: `Cycle ${rhythm.cycle}, day ${rhythm.step} of 13: ${rhythm.operator.name}. It closes on the ${ordinal(rhythm.closesOn)}.`,
  };
}

function ordinal(n) {
  const tail = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  return `${n}${tail}`;
}
