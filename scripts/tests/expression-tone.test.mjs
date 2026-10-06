/**
 * Tone is read from the expression a host carries (no DOM).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { expressionTone, readElementTone } from '../../public/js/semantic/expression-tone.js';

describe('expression tone', () => {
  it('reads the mode slot as the posture', () => {
    assert.equal(expressionTone('index[navigational]{question.route}<register>'), 'navigational');
    assert.equal(expressionTone('voice[field_guide]{habitat.notice}'), 'field guide');
  });

  it('leads with a boonhonk charge when one is written', () => {
    assert.equal(expressionTone('boon table[generous]{gather}'), 'boon generous');
  });

  it('is empty for an expression with no mode, and for nothing', () => {
    assert.equal(expressionTone('cauldron{costume.ink}'), '');
    assert.equal(expressionTone(''), '');
  });

  it('falls back to the authored context of a host with no expression', () => {
    assert.equal(readElementTone({ dataset: { spwContext: 'analysis' } }), 'analysis');
    assert.equal(readElementTone({ dataset: { spwSemanticExpression: 'kernel[threshold]{context.re_enter}<revisit>', spwContext: 'reading' } }), 'threshold');
    assert.equal(readElementTone(null), '');
  });
});
