/**
 * A handle for a feeling: four choices, three forms (no DOM).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CARE_PRACTICES, composeCareHandle, handlePart, namePart } from '../../public/js/modules/services/care-handle.js';

describe('care handle', () => {
  it('rests on unsure, noticed, for myself', () => {
    const h = composeCareHandle({ state: 'unsure' });
    assert.equal(h.expression, '?unsure[notice]<myself>');
    assert.equal(h.sentence, 'Note to self: I am noticing that I feel unsure.');
    assert.equal(h.name, 'unsure-notice');
  });

  it('fills the four slots and precipitates a line and a name', () => {
    const h = composeCareHandle({ state: 'overloaded', practice: 'practice', toward: 'steady', witness: 'friend', step: 'one walk.' });
    assert.equal(h.expression, '!overloaded[practice]{steady}<friend>');
    assert.equal(h.sentence, 'Can I tell you something? I feel overloaded. One small thing I will try: one walk. I am heading toward steady.');
    assert.equal(h.name, 'steady-one-walk');
    assert.equal(h.operator, 'action');
  });

  it('gives each practice its own canon prefix', () => {
    const prefixes = Object.values(CARE_PRACTICES).map((p) => p.prefix);
    assert.deepEqual(prefixes, ['?', '=', '~', '@', '!', '.']);
    assert.equal(new Set(prefixes).size, prefixes.length);
  });

  it('keeps a person\'s own words, and falls back when a choice is unknown or empty', () => {
    const h = composeCareHandle({ state: 'Not sure   yet', practice: 'diagnose', witness: 'everyone' });
    assert.equal(h.expression, '?not_sure_yet[notice]<myself>');
    assert.equal(composeCareHandle({}).expression, '?not_sure_yet[notice]<myself>');
    assert.equal(handlePart('  Worn—out! '), 'worn_out');
    assert.equal(namePart('Steady Hands'), 'steady-hands');
  });
});
