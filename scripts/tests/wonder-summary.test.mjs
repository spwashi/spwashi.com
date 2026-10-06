/**
 * The wonder summary the gate reads: one count line, and a key per question
 * that follows its words, not its line number.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { renderCountLine, wonderKey } from '../wonder.mjs';

test('a question keeps its key when it moves, and changes it when its words do', () => {
  const asked = { question: 'Does a season read as one expression changing?', line: 12 };
  assert.equal(wonderKey(asked), wonderKey({ ...asked, line: 40 }));
  assert.equal(wonderKey(asked), wonderKey({ question: '  Does a season read as one  expression changing? ' }));
  assert.notEqual(wonderKey(asked), wonderKey({ question: 'Does a season read as two expressions?' }));
  assert.match(wonderKey(asked), /^[0-9a-f]{8}$/);
});

test('the count line names open questions, surfaces, and the ones no probe can settle', () => {
  const wonders = [
    { file: 'a.spw', probes: ['!probe{x}'] },
    { file: 'a.spw', probes: [] },
    { file: 'b.spw', probes: [] },
  ];
  assert.equal(renderCountLine(wonders), '[wonder] 3 open on 2 surfaces · 2 without a probe');
});
