import assert from 'node:assert/strict';
import test from 'node:test';

import {
  describeSpwExpression,
  scanSpwExpression,
} from '../../public/js/semantic/spw-expression-geometry.js';

test('reads root and paired-boundary geometry without claiming evaluation', () => {
  const result = describeSpwExpression('root[variant]{behavior}<lens>');

  assert.equal(result.root, 'root');
  assert.deepEqual(result.forms, ['frame', 'body', 'capsule']);
  assert.deepEqual(result.channels, ['lens']);
  assert.equal(result.formSignature, '[]{}<>');
  assert.equal(result.wake, 'root · []{}<>');
  assert.equal(result.balanced, true);
});

test('distinguishes medial capsules, couples, and streams', () => {
  const medial = scanSpwExpression('bagel<scent>coffee');
  const couple = scanSpwExpression('a<>b');
  const stream = scanSpwExpression('<<a,b>>');

  assert.deepEqual(medial.forms, ['capsule']);
  assert.deepEqual(medial.channels, ['scent']);
  assert.deepEqual(couple.forms, ['couple']);
  assert.deepEqual(couple.channels, []);
  assert.deepEqual(stream.forms, ['stream']);
  assert.equal(stream.balanced, true);
});

test('keeps quoted delimiters and sigils opaque', () => {
  const source = 'root["[not] ?probe"]{body}';
  const result = scanSpwExpression(source);

  assert.deepEqual(result.forms, ['frame', 'body']);
  assert.deepEqual(result.operators, []);
  assert.equal(result.tokens.map((token) => token.value).join(''), source);
});

test('recognizes probe scope but ignores ordinary sentence punctuation', () => {
  const probe = scanSpwExpression('?(lens @main)');
  const prose = scanSpwExpression('Hello. Why? Great!');

  assert.deepEqual(probe.forms, ['scope']);
  assert.ok(probe.operators.includes('wonder'));
  assert.deepEqual(prose.operators, []);
});

test('reports partial geometry for unbalanced authored input', () => {
  const result = describeSpwExpression('root[variant{behavior}');

  assert.equal(result.balanced, false);
  assert.ok(result.errors.length > 0);
  assert.match(result.description, /partial$/);
});
