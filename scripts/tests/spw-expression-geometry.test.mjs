import assert from 'node:assert/strict';
import test from 'node:test';

import {
  describeSpwExpression,
  parseSpwExpression,
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

test('parses operator chip and route expressions with canonical backward-compatible fields', () => {
  const chip = parseSpwExpression('?[topic]');
  assert.equal(chip.expression, '?[topic]');
  assert.equal(chip.prefix, '?');
  assert.equal(chip.nucleus, '[topic]');
  assert.equal(chip.operatorType, 'wonder');
  assert.equal(chip.operator?.prefix, '?');
  assert.deepEqual(chip.forms, ['frame']);
  assert.equal(chip.balanced, true);

  const frame = parseSpwExpression('#>summary');
  assert.equal(frame.prefix, '#>');
  assert.equal(frame.nucleus, 'summary');
  assert.equal(frame.operatorType, 'frame');
});

test('validates navigation tokens across all canonical operator sigils', () => {
  const tokens = [
    { expr: '#>home', expectedOp: 'frame', expectedPrefix: '#>', expectedNucleus: 'home' },
    { expr: '?topics', expectedOp: 'wonder', expectedPrefix: '?', expectedNucleus: 'topics' },
    { expr: '~play', expectedOp: 'potential', expectedPrefix: '~', expectedNucleus: 'play' },
    { expr: '^tools', expectedOp: 'integration', expectedPrefix: '^', expectedNucleus: 'tools' },
    { expr: '@services', expectedOp: 'perspective', expectedPrefix: '@', expectedNucleus: 'services' },
    { expr: '!commit', expectedOp: 'action', expectedPrefix: '!', expectedNucleus: 'commit' },
    { expr: '>projection', expectedOp: 'concept-edge', expectedPrefix: '>', expectedNucleus: 'projection' },
    { expr: '=settings', expectedOp: 'binding', expectedPrefix: '=', expectedNucleus: 'settings' },
  ];

  for (const item of tokens) {
    const parsed = parseSpwExpression(item.expr);
    assert.equal(parsed.expression, item.expr);
    assert.equal(parsed.prefix, item.expectedPrefix);
    assert.equal(parsed.nucleus, item.expectedNucleus);
    assert.equal(parsed.operatorType, item.expectedOp);
    assert.equal(parsed.balanced, true);
  }

  const capsule = describeSpwExpression('<software>');
  assert.deepEqual(capsule.forms, ['capsule']);
  assert.deepEqual(capsule.channels, ['software']);
  assert.equal(capsule.balanced, true);
});

test('generalizes script patterns across higher orders of dimension (0D to 4D)', () => {
  // 0D Point: Scalar handle
  const d0 = parseSpwExpression('#>handle');
  assert.equal(d0.operatorType, 'frame');
  assert.equal(d0.nucleus, 'handle');
  assert.deepEqual(d0.forms, []);

  // 1D Vector + 2D Spatial Container: multi-seat expression
  const d2 = describeSpwExpression('beans[stew]{cook}(kitchen)<food>');
  assert.equal(d2.root, 'beans');
  assert.deepEqual(d2.forms, ['frame', 'body', 'scope', 'capsule']);
  assert.deepEqual(d2.channels, ['food']);
  assert.equal(d2.formSignature, '[]{}()<>' );
  assert.equal(d2.balanced, true);

  // Compound pipeline: 1D vector leading into multi-channel boundary
  const compound = describeSpwExpression('surface[route]{path} > projection[css]{bundle}');
  assert.ok(compound.tokens.length > 0);
  assert.ok(compound.operators.includes('concept-edge'));
});
