import assert from 'node:assert/strict';
import test from 'node:test';

import {
  describeSpwDimensionality,
  describeSpwExpression,
  parseSpwExpression,
  scanSpwExpression,
  SPW_DIMENSIONAL_ASCENT,
  SPW_DIMENSIONAL_EDGES,
} from '../../public/js/semantic/spw-expression-geometry.js';
import { formatMicrointeractionExpression } from '../../public/js/semantic/interaction-expression.js';

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

test('separates authored 0D-2D evidence from contextual 3D-4D projections', () => {
  assert.deepEqual(
    SPW_DIMENSIONAL_ASCENT.map(({ label, role, source }) => ({ label, role, source })),
    [
      { label: '0D', role: 'handle', source: 'authored' },
      { label: '1D', role: 'vector', source: 'authored' },
      { label: '2D', role: 'form', source: 'authored' },
      { label: '3D', role: 'field', source: 'contextual' },
      { label: '4D', role: 'path', source: 'runtime' },
    ],
  );
  assert.deepEqual(
    SPW_DIMENSIONAL_EDGES.map(({ from, to, relation }) => ({ from, to, relation })),
    [
      { from: 0, to: 1, relation: 'direct' },
      { from: 1, to: 2, relation: 'bound' },
      { from: 2, to: 3, relation: 'situate' },
      { from: 3, to: 4, relation: 'replay' },
      { from: 4, to: 0, relation: 'return' },
    ],
  );

  const pointVector = describeSpwDimensionality('#>handle');
  assert.equal(pointVector.identity, 'handle');
  assert.deepEqual(pointVector.authoredOrders, [0, 1]);
  assert.equal(pointVector.dimensions[2].state, 'available');
  assert.equal(pointVector.dimensions[3].state, 'available');
  assert.equal(pointVector.dimensions[4].state, 'available');

  const fullProjection = describeSpwDimensionality('beans[stew]{cook}(kitchen)<food>', {
    hostContext: 'software-field',
    runtimePath: '/settings/#spell-board',
  });
  assert.deepEqual(fullProjection.authoredOrders, [0, 2]);
  assert.equal(fullProjection.authoredThrough, 2);
  assert.equal(fullProjection.dimensions[3].state, 'contextual');
  assert.equal(fullProjection.dimensions[4].state, 'runtime');
  assert.equal(fullProjection.edges[2].relation, 'situate');
  assert.equal(fullProjection.sourceBoundary, '0D-2D authored; 3D-4D contextual');

  const compound = describeSpwExpression('surface[route]{path} > projection[css]{bundle}');
  assert.ok(compound.tokens.length > 0);
  assert.ok(compound.operators.includes('concept-edge'));
});

test('parses transdimensional expressions with prefix/postfix, scenes, and registers', () => {
  const expr = '<a,b,c>{ foo ; bar } (( ! ~> $ )) { foo ; bar }<abc>[reg=clipboard@"copied"]';
  const result = describeSpwExpression(expr);

  assert.equal(result.balanced, true);
  assert.deepEqual(result.forms, ['capsule', 'body', 'scene', 'frame']);
  const openForms = result.tokens
    .filter((token) => token.type === 'boundary' && token.direction === 'open')
    .map((token) => token.form);
  assert.deepEqual(openForms, ['capsule', 'body', 'scene', 'body', 'capsule', 'frame']);
  assert.ok(result.channels.includes('a,b,c'));
  assert.ok(result.channels.includes('abc'));
  assert.equal(result.formSignature, '<>{}(())[]');
});

test('formatMicrointeractionExpression serializes rich transdimensional gestures and states', () => {
  const formatted = formatMicrointeractionExpression({
    input: 'data-spw-metamaterial',
    gesture: 'click',
    transform: '!copy ~> $clipboard',
    destination: 'catalog',
    register: 'clipboard',
    state: 'copied',
  });

  assert.equal(
    formatted,
    '<data-spw-metamaterial> { click } (( !copy ~> $clipboard )) <catalog> [reg=clipboard@"copied"]',
  );

  const scanned = describeSpwExpression(formatted);
  assert.equal(scanned.balanced, true);
  assert.deepEqual(scanned.forms, ['capsule', 'body', 'scene', 'frame']);
  const openForms = scanned.tokens
    .filter((token) => token.type === 'boundary' && token.direction === 'open')
    .map((token) => token.form);
  assert.deepEqual(openForms, ['capsule', 'body', 'scene', 'capsule', 'frame']);
});

test('microinteraction narration keeps event-derived delimiters parseable', () => {
  const formatted = formatMicrointeractionExpression({
    input: 'chip<unsafe>',
    gesture: 'press {again}',
    transform: '!settle ~> $sigil',
    destination: 'region[one]',
    register: 'probe state',
    state: 'ready "now"',
  });

  assert.equal(
    formatted,
    '<chip-unsafe> { press -again- } (( !settle ~> $sigil )) <region-one> [reg=probe-state@"ready \\"now\\""]',
  );
  assert.equal(describeSpwExpression(formatted).balanced, true);
});
