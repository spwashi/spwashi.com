/**
 * Fluency — what a reader has met of the language, and what they have not.
 *
 * The cauldron records what someone gathered. That is a collection, and a
 * collection alone teaches nothing: a reader can hold forty fragments and still
 * have met one operator forty times.
 *
 * Fluency is coverage, not count. The question is which parts of the notation a
 * reader has actually encountered, and — the part that matters — which
 * neighbours of the parts they know are still missing. Knowing `wonder` without
 * ever having met `substrate` is knowing a question with no ground under it.
 *
 * This is deliberately not a score. A percentage would rank readers; what is
 * useful is knowing *which relatives of a concept you have not met yet*, so the
 * gap is an invitation rather than a grade. Every gap here is phrased as what
 * the missing thing does, because an operator you have never seen is not
 * learned by being told you are missing it.
 *
 * Three dimensions, because they fail independently:
 *
 *   operators   which of the canonical operators have been gathered at all
 *   affordances what those operators let you do — an operator met but never
 *               used in each of its affordances is recognised, not fluent
 *   slots       frame, body and projection. A reader who has only ever
 *               gathered bare subjects has not met the grammar, only the nouns
 *
 * Reads the cauldron and the kernel. Writes nothing, mounts nothing, and has no
 * DOM dependency, so it can be exercised by direct import.
 */

import { getOperatorThresholdState, OPERATOR_AFFORDANCES } from '/public/js/kernel/shared.js';
import { CAULDRON_REGISTERS, REGISTER_NAMES } from './registers.js';

/**
 * What each operator is for, in one clause. Used to phrase a gap as the thing
 * it is rather than as an absence — "integration lifts and joins" teaches; "you
 * are missing integration" does not.
 */
const OPERATOR_SENSE = Object.freeze({
  substrate: 'holds a measurement up so it can be charged or inspected',
  action: 'commits — it primes, dry-runs, and previews before it spends',
  subject: 'is the thing under discussion; it collects',
  perspective: 'moves the viewer, not the subject — it traces and pivots',
  potential: 'stores something latent so it can discharge later',
  frame: 'rings a thing and gives it an address',
  layer: 'peels, so what was one surface can be sounded',
  vibration: 'names, and a named thing resonates with its kin',
  ground: 'settles, and gives something to return to',
  integration: 'lifts and joins — it is how two things become one held thing',
  wonder: 'opens a question and leaves it open',
  value: 'resolves to something you can hold',
  binding: 'ties two things so they cannot drift apart',
  normalize: 'puts things on one scale so they can be compared',
  concept: 'is the idea apart from any instance of it',
  scene: 'is where something happens, which is not the same as when',
  mode: 'is how a thing is being done right now',
  direction: 'orients — it says which way, not how far',
});

/**
 * Neighbours. The founding complaint the notation exists to answer is that a
 * token bound to one referent loses the structure that gave it meaning, so a
 * fluency model that reported isolated operators would repeat the mistake it
 * is meant to detect. These pairs are the relations worth noticing an absence
 * in: each names an operator and the one that usually grounds or completes it.
 */
const NEIGHBOURS = Object.freeze({
  wonder: ['substrate', 'value'],
  substrate: ['normalize', 'wonder'],
  potential: ['action', 'ground'],
  action: ['potential', 'value'],
  integration: ['subject', 'binding'],
  perspective: ['subject', 'concept'],
  frame: ['ground', 'scene'],
  concept: ['perspective', 'vibration'],
  value: ['normalize', 'action'],
  ground: ['frame', 'potential'],
});

const SLOTS = Object.freeze(['frame', 'body', 'projection']);

/** Resolve any spelling of an operator to its canonical name. */
function canonicalOperator(raw) {
  if (!raw) return '';
  const name = String(raw).trim();
  if (OPERATOR_AFFORDANCES[name]) return name;
  return getOperatorThresholdState(name)?.operator || '';
}

/**
 * Which slots an expression actually uses. A bare `~orient` uses none; a full
 * `~orient[role.affords]{region.band}<consequence>` uses all three.
 */
function slotsUsed(expression = '') {
  const text = String(expression);
  return {
    frame: /\[[^\]]+\]/.test(text),
    body: /\{[^}]+\}/.test(text),
    projection: /<[^>]+>/.test(text),
  };
}

/**
 * What the language offers, as a countable surface. Derived from the kernel so
 * it cannot drift from what the parser actually knows.
 */
export function languageSurface() {
  const operators = Object.keys(OPERATOR_AFFORDANCES);
  const affordances = operators.flatMap((op) =>
    (OPERATOR_AFFORDANCES[op] || []).map((a) => `${op}:${a}`));
  return { operators, affordances, slots: SLOTS, registers: REGISTER_NAMES };
}

/**
 * What a gathering has met.
 *
 * Encounter is not mastery and this does not pretend otherwise — it reports
 * contact, which is the only thing a collection can evidence.
 */
export function measureFluency(ingredients = []) {
  const items = Array.isArray(ingredients) ? ingredients.filter(Boolean) : [];
  const surface = languageSurface();

  const metOperators = new Set();
  const metSlots = new Set();
  const registerValues = new Map(REGISTER_NAMES.map((name) => [name, new Set()]));

  for (const item of items) {
    const op = canonicalOperator(item?.operator);
    if (op) metOperators.add(op);

    const used = slotsUsed(item?.expression || item?.label || '');
    for (const slot of SLOTS) if (used[slot]) metSlots.add(slot);

    for (const name of REGISTER_NAMES) {
      const value = CAULDRON_REGISTERS[name].read(item);
      if (value !== '' && value !== undefined && value !== null) {
        registerValues.get(name).add(String(value));
      }
    }
  }

  /**
   * A register whose value never changed across a whole gathering is a
   * coordinate the reader has not actually travelled — they have one value,
   * not a sense of the axis.
   */
  const travelled = REGISTER_NAMES.filter((name) => registerValues.get(name).size > 1);
  const stuck = REGISTER_NAMES.filter((name) => registerValues.get(name).size === 1);

  return {
    gathered: items.length,
    operators: {
      met: [...metOperators],
      unmet: surface.operators.filter((op) => !metOperators.has(op)),
      of: surface.operators.length,
    },
    slots: {
      met: [...metSlots],
      unmet: SLOTS.filter((slot) => !metSlots.has(slot)),
    },
    registers: { travelled, stuck },
  };
}

/**
 * The gaps worth naming, ordered so the most useful one comes first.
 *
 * A neighbour gap outranks a plain unmet operator: not having met `substrate`
 * matters more when you *have* met `wonder`, because then the absence is
 * load-bearing rather than merely outstanding.
 */
export function fluencyGaps(ingredients = []) {
  const f = measureFluency(ingredients);
  const met = new Set(f.operators.met);
  const gaps = [];

  for (const known of f.operators.met) {
    for (const neighbour of NEIGHBOURS[known] || []) {
      if (met.has(neighbour) || gaps.some((g) => g.operator === neighbour)) continue;
      gaps.push({
        kind: 'neighbour',
        operator: neighbour,
        because: known,
        reading: `you have gathered ${known}; ${neighbour} ${OPERATOR_SENSE[neighbour] || 'is its relative'}`,
      });
    }
  }

  for (const slot of f.slots.unmet) {
    gaps.push({
      kind: 'slot',
      slot,
      reading: slot === 'frame'
        ? 'nothing you hold says how it should be read — that is the [frame] slot'
        : slot === 'body'
          ? 'nothing you hold says where it sat — that is the {body} slot'
          : 'nothing you hold says what it left behind — that is the <projection> slot',
    });
  }

  for (const name of f.registers.stuck) {
    gaps.push({
      kind: 'register',
      register: name,
      reading: `every fragment you hold has the same ${name} — you have a value, not yet a sense of the axis`,
    });
  }

  return gaps;
}

/**
 * A one-line reading of where a reader stands. Phrased as position, never as a
 * score, because the useful thing is which direction is unexplored.
 */
export function fluencyReading(ingredients = []) {
  const f = measureFluency(ingredients);
  if (!f.gathered) return 'nothing gathered — the language is all still ahead of you';

  const gaps = fluencyGaps(ingredients);
  const first = gaps.find((g) => g.kind === 'neighbour') || gaps[0];
  const breadth = `${f.operators.met.length} of ${f.operators.of} operators, ${f.slots.met.length} of 3 slots`;
  return first ? `${breadth} — ${first.reading}` : `${breadth} — no obvious next relative`;
}
