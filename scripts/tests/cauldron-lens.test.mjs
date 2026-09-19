import assert from 'node:assert/strict';
import test from 'node:test';
import { composeLensPrompt } from '../../public/js/semantic/cauldron/lens.js';

test('composition intent changes the task while retaining every ingredient', () => {
  const outputs = ['connect', 'compare', 'apply'].map(intent => composeLensPrompt(['clay', 'rhythm'], { intent }));
  assert.equal(new Set(outputs).size, 3);
  for (const output of outputs) assert.match(output, /clay and rhythm/);
  assert.match(outputs[1], /difference/);
  assert.match(outputs[2], /how to check/);
});

test('page lens makes the same material relevant to its authored impact', () => {
  const result = composeLensPrompt(['clay', 'rhythm'], { lens: 'hospitality', impact: 'community-horizon', page: '/about/' });
  assert.match(result, /hospitality lens on \/about\//);
  assert.match(result, /community horizon/);
  assert.doesNotMatch(composeLensPrompt(['clay'], {}), /Through the/);
  assert.match(composeLensPrompt(['clay'], { intent: 'unknown' }), /relationship/);
});
