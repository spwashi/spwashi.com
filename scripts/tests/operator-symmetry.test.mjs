import assert from 'node:assert/strict';
import test from 'node:test';
import { SQUARE_IDENTITY, transformSquare } from '../../public/js/modules/tools/operator-symmetry.js';

const walk = (...moves) => moves.reduce(transformSquare, [...SQUARE_IDENTITY]);
test('four rotations and two reflections return every label to its seat', () => {
  assert.deepEqual(walk('rotate', 'rotate', 'rotate', 'rotate'), SQUARE_IDENTITY);
  assert.deepEqual(walk('reflect', 'reflect'), SQUARE_IDENTITY);
  assert.deepEqual(SQUARE_IDENTITY, [0, 1, 2, 3]);
});
test('reflection reverses rotation; order matters', () => {
  assert.notDeepEqual(walk('rotate', 'reflect'), walk('reflect', 'rotate'));
  assert.deepEqual(walk('reflect', 'rotate', 'reflect'), walk('rotate', 'rotate', 'rotate'));
});
test('closure produces exactly eight arrangements, preserving all four labels', () => {
  const seen = new Set();
  const queue = [[...SQUARE_IDENTITY]];
  while (queue.length) {
    const state = queue.shift();
    if (seen.has(state.join())) continue;
    seen.add(state.join());
    assert.deepEqual([...state].sort(), SQUARE_IDENTITY);
    queue.push(transformSquare(state, 'rotate'), transformSquare(state, 'reflect'));
  }
  assert.equal(seen.size, 8);
  assert.throws(() => transformSquare(SQUARE_IDENTITY, 'invent'), RangeError);
});
