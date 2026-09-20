import test from 'node:test';
import assert from 'node:assert/strict';
import { planInsertion, ingredientText, canCompose } from '../../public/js/interface/field-composition.js';

test('cauldron insertion preserves text outside the chosen range', () => {
  assert.equal(planInsertion('one two three', 'garden', 4, 7, 'insert').next, 'one garden three');
  assert.equal(planInsertion('prefix', ' scene', 6, 6, 'insert').next, 'prefix scene');
});
test('append ignores selection and refuses maxlength overflow without truncation', () => {
  const plan = planInsertion('keep me', 'new text', 0, 7, 'append', 10);
  assert.equal(plan.next, 'keep me\nnew text');
  assert.equal(plan.fits, false);
  assert.equal(planInsertion('', 'four', 0, 0, 'insert', 4).fits, true);
});
test('field handoff uses only fragment words or expression, not payload metadata', () => {
  const item = { text: 'a room', label: 'Room', expression: '~room{rest}', payload: { private: 'do not copy' } };
  assert.equal(ingredientText(item), 'a room');
  assert.equal(ingredientText(item, 'expression'), '~room{rest}');
  assert.equal(ingredientText({ text: 123, label: 'Fallback' }), 'Fallback');
  assert.equal(ingredientText({ payload: 'not text' }), '');
});
test('credential, readonly, disabled and private overlay fields are excluded', () => {
  const field = overrides => ({ matches: selector => selector !== ':disabled', closest: () => null, readOnly: false, ...overrides });
  assert.equal(canCompose(field({})), true);
  assert.equal(canCompose(field({ autocomplete: 'one-time-code' })), false);
  assert.equal(canCompose(field({ name: 'api_key' })), false);
  assert.equal(canCompose(field({ readOnly: true })), false);
  assert.equal(canCompose(field({ matches: () => true })), false);
  assert.equal(canCompose(field({ closest: () => ({}) })), false);
});
