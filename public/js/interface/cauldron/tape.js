/**
 * A held fragment, read as a tape.
 *
 * Each thing in the cauldron is drawn as a small cassette: an appendix
 * number, a label, and a window with two reels. The reels are a reading, not
 * decoration. Tape moves from the supply reel to the take-up reel as a reader
 * comes back to that construct after time away, which is the only kind of
 * return the rehearsal ledger counts toward strength
 * (semantic/cauldron/rehearsal.js).
 *
 *   met      how many times the construct has been gathered
 *   spaced   how many of those came after time away
 *   wound    0..1, spaced returns out of FULL_TAPE
 *   perWeek  met per week since the first meeting: the velocity of the wonder
 *
 * Pure. The ledger record is passed in so the reading can be tested.
 */

/** Spaced returns that wind a whole tape. */
export const FULL_TAPE = 4;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @param {{ first?: number, last?: number, met?: number, spaced?: number } | null | undefined} record
 */
export function readTape(record, now = Date.now()) {
  const met = Math.max(0, Number(record?.met) || 0);
  const spaced = Math.max(0, Number(record?.spaced) || 0);
  const first = Number(record?.first) || now;
  const weeks = Math.max(1, (now - first) / WEEK_MS);
  const perWeek = met / weeks;
  const wound = Math.min(1, spaced / FULL_TAPE);
  const rate = perWeek >= 10 ? perWeek.toFixed(0) : perWeek.toFixed(1);
  return {
    met,
    spaced,
    wound: Number(wound.toFixed(2)),
    perWeek: Number(rate),
    readout: met ? `met ${met} · spaced ${spaced} · ${rate}/wk` : 'new tape',
    title: met
      ? `Gathered ${met} time${met === 1 ? '' : 's'}, ${spaced} after time away, about ${rate} a week. Coming back after a pause winds the tape.`
      : 'First time held. Coming back after a pause winds the tape.',
  };
}

/** Appendix number for the nth held fragment: A·1, A·2, … */
export function appendixIndex(index = 0) {
  return `A·${Number(index) + 1}`;
}
