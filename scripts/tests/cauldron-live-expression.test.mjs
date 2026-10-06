/**
 * The cauldron's count line as one Spw expression (no DOM).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { composeLiveExpression, expressionPart } from '../../public/js/interface/cauldron/live-expression.js';

const held = (...labels) => labels.map((label) => ({ label }));

describe('cauldron live expression', () => {
  it('rests on the ground operator when nothing is held', () => {
    const e = composeLiveExpression([]);
    assert.equal(e.text, '.cauldron{}');
    assert.equal(e.operator, 'ground');
  });

  it('holds with ~ until three, then reads ready with *', () => {
    assert.equal(composeLiveExpression(held('Costume')).text, '~cauldron{costume}');
    assert.equal(composeLiveExpression(held('costume', 'seed card')).text, '~cauldron{costume.seed_card}');
    const ready = composeLiveExpression(held('costume', 'seed card', 'ink'));
    assert.equal(ready.text, '*cauldron{costume.seed_card.ink}');
    assert.equal(ready.operator, 'value');
  });

  it('lifts to ^ only while a mix of two or more is showing', () => {
    assert.equal(composeLiveExpression(held('a1', 'b2'), { mixed: true }).text, '^cauldron{a1.b2}');
    assert.equal(composeLiveExpression(held('a1'), { mixed: true }).prefix, '~');
  });

  it('names each held word once and counts what it does not show', () => {
    const e = composeLiveExpression(held('ink', 'ink', 'a', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg'));
    assert.equal(e.text, '*cauldron{ink.a.bb.cc.dd.ee.+2}');
    assert.match(e.label, /^9 held, ready/);
  });

  it('writes a label as an expression part', () => {
    assert.equal(expressionPart('  200-day chunks '), '200_day_chunks');
    assert.equal(expressionPart('^seed'), 'seed');
  });
});
