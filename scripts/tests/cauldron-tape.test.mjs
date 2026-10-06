/**
 * A held fragment read as a tape (no DOM).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FULL_TAPE, appendixIndex, readTape } from '../../public/js/interface/cauldron/tape.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

describe('cauldron tape', () => {
  it('reads a construct never recorded as a new tape', () => {
    const tape = readTape(null, NOW);
    assert.equal(tape.wound, 0);
    assert.equal(tape.readout, 'new tape');
  });

  it('winds with spaced returns only, and is full at FULL_TAPE', () => {
    assert.equal(readTape({ first: NOW - DAY, met: 9, spaced: 0 }, NOW).wound, 0);
    assert.equal(readTape({ first: NOW - 21 * DAY, met: 7, spaced: 3 }, NOW).wound, 0.75);
    assert.equal(readTape({ first: NOW - 60 * DAY, met: 20, spaced: FULL_TAPE + 3 }, NOW).wound, 1);
  });

  it('reads velocity as meetings per week since the first, never over less than a week', () => {
    assert.equal(readTape({ first: NOW - 21 * DAY, met: 7, spaced: 3 }, NOW).readout, 'met 7 · spaced 3 · 2.3/wk');
    assert.equal(readTape({ first: NOW - DAY, met: 2, spaced: 1 }, NOW).perWeek, 2);
  });

  it('numbers fragments as appendix entries', () => {
    assert.equal(appendixIndex(0), 'A·1');
    assert.equal(appendixIndex(11), 'A·12');
  });
});
