/**
 * Familiarity gate — spend what the site already knows about a returning reader.
 *
 * The site tracks familiarity (cognitive-state.js's ladder: fresh, familiar,
 * practiced, fluent, habitual) and persists visited surfaces, but nothing ever
 * spent that on what arrives. 96 catalog modules gate on IMMEDIATE / VISIBLE /
 * IDLE / SETTLED / REGION and not one gates on whether the reader has been here
 * before, so a first visit and a fiftieth mount the same 58 modules on the home
 * page. That is a load order, not a progressive enhancement model, and it means
 * learning the site earns you nothing.
 *
 * This adds the missing axis. A module may declare `familiarity: 'practiced'`
 * to say "this is an expert surface; do not spend a newcomer's first paint on
 * it." On a fresh visit it is demoted rather than dropped - it still arrives,
 * just later, so nothing becomes unreachable and no content hides behind a
 * loyalty wall. As familiarity rises the demotion lifts and the surface arrives
 * sooner, which is the reward: the site gets faster and denser as you learn it.
 *
 * Reads persisted state only - no observers, no measurement. Storage is treated
 * as untrusted: any parse failure reads as 'fresh', the conservative answer.
 *
 * See .spw/conventions/interaction-microstates.spw#reward_contract - "every
 * interaction resolves into feedback or arc clarity" - and the learning-science
 * framing that an audience can tolerate cognitive load when familiarity is
 * allowed to reduce it.
 */

import { readJson, STORAGE_KEYS } from '/public/js/kernel/storage-utils.js';

/** Shared with cognitive-state.js; duplicated to stay importable without DOM. */
export const FAMILIARITY_LADDER = Object.freeze([
  'fresh',
  'familiar',
  'practiced',
  'fluent',
  'habitual',
]);

/** Visit counts at which each rung is reached. */
const RUNG_AT_VISITS = Object.freeze([0, 2, 5, 12, 30]);

let cached = null;

/**
 * How well does this reader know this surface?
 * Surface-scoped rather than sitewide: knowing /topics/ well should not make
 * /play/ behave as though it were already learned.
 */
export function readFamiliarity(surface = '') {
  if (cached && cached.surface === surface) return cached;

  let visits = 0;
  try {
    const store = readJson(STORAGE_KEYS.VISITED_SURFACES, null, { requireObject: true });
    const entry = store?.[surface] ?? store?.[`/${surface}`] ?? null;
    visits = Number.isFinite(entry) ? entry : Number(entry?.count) || 0;
  } catch {
    visits = 0;
  }

  let rung = 0;
  for (let i = RUNG_AT_VISITS.length - 1; i >= 0; i -= 1) {
    if (visits >= RUNG_AT_VISITS[i]) { rung = i; break; }
  }

  cached = { surface, visits, rung, level: FAMILIARITY_LADDER[rung] };
  return cached;
}

/** Forget the memo — call when the surface changes under a soft navigation. */
export function invalidateFamiliarity() {
  cached = null;
}

/**
 * Demote a module's mount tier when the reader has not yet earned it.
 *
 * Returns null when familiarity has nothing to say, so callers can fall through
 * to their existing policy. Never promotes: familiarity may only defer work on
 * an unfamiliar visit, never pull work forward into someone's first paint.
 */
export function applyFamiliarityGate(def, mountWhenEnum, baseWhen, surface = '') {
  const required = def?.familiarity;
  if (!required) return null;

  const requiredRung = FAMILIARITY_LADDER.indexOf(required);
  if (requiredRung < 1) return null;

  const { rung } = readFamiliarity(surface);
  if (rung >= requiredRung) return null;

  // Demote by distance: one rung short slips to VISIBLE, further slips to IDLE.
  // IDLE is the floor - the surface still arrives, so nothing is gated away.
  const shortBy = requiredRung - rung;
  if (baseWhen === mountWhenEnum.IMMEDIATE) {
    return shortBy > 1 ? mountWhenEnum.IDLE : mountWhenEnum.VISIBLE;
  }
  if (baseWhen === mountWhenEnum.VISIBLE && shortBy > 1) return mountWhenEnum.IDLE;
  return null;
}

export const FAMILIARITY_GATE_CONTRACT = Object.freeze({
  ladder: FAMILIARITY_LADDER,
  rungAtVisits: RUNG_AT_VISITS,
  attr: 'data-spw-familiarity',
  rule: 'defer-only; never promotes, never withholds',
});
