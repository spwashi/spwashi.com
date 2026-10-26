/**
 * Views of the operator canon (public/js/kernel/operator-detection.js).
 * Each table below keeps its own columns and takes its operator names from the
 * canon, so a renamed or added operator reaches every reader at once.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  OPERATOR_DEFINITIONS,
  OPERATOR_TYPE_ALIASES,
  getOperatorDefinition,
} from '../../public/js/kernel/operator-detection.js';
import { OPERATOR_INFO } from '../../public/js/runtime/experiential/operator-info.js';
import { OPERATOR_OPTIONS } from '../../public/js/modules/profile/builder.js';
import { COMPOSITE_OPERATOR_PREFIXES, SPW_OPERATOR_THRESHOLD_SEQUENCE } from '../../public/js/kernel/shared.js';
import { scanSpwExpression } from '../../public/js/semantic/spw-expression-geometry.js';

test('experiential operator info names every key the way the canon does', () => {
  const keys = [
    ...OPERATOR_DEFINITIONS.flatMap(({ prefix, type }) => [prefix, type]),
    ...Object.keys(OPERATOR_TYPE_ALIASES),
  ];
  for (const key of keys) {
    const canon = getOperatorDefinition(key);
    const info = OPERATOR_INFO[key];
    assert.ok(info, key);
    assert.equal(info.type, canon.type, key);
    assert.equal(info.label, canon.label, key);
    assert.ok(info.intent && info.wonder, key);
  }
  assert.equal(OPERATOR_INFO.$.type, 'substrate');
});

test('profile operator options take each sigil name from the canon', () => {
  for (const option of OPERATOR_OPTIONS) {
    assert.equal(option.label, `${option.value} ${getOperatorDefinition(option.value).type}`);
  }
});

test('threshold and composite tables read their operators from the canon', () => {
  for (const { sigil, operator } of SPW_OPERATOR_THRESHOLD_SEQUENCE) {
    assert.equal(operator, getOperatorDefinition(sigil).type, sigil);
  }
  for (const [pair, { primary, secondary }] of Object.entries(COMPOSITE_OPERATOR_PREFIXES)) {
    assert.equal(primary, getOperatorDefinition(pair[0]).type, pair);
    assert.equal(secondary, getOperatorDefinition(pair[1]).type, pair);
  }
});

test('the geometry scanner marks every canon prefix that is not a brace', () => {
  const marks = OPERATOR_DEFINITIONS.map(({ prefix }) => prefix).filter((prefix) => !'<([{'.includes(prefix));
  const source = marks.map((mark, index) => `${mark}w${index}`).join(' ');
  const scanned = scanSpwExpression(source).tokens
    .filter((token) => token.operator)
    .map((token) => [token.value ?? token.text, token.operator]);
  assert.deepEqual(scanned, marks.map((mark) => [mark, getOperatorDefinition(mark).type]));
});
