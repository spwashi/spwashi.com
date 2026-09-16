import assert from 'node:assert/strict';
import test from 'node:test';
import { createRegistry } from '../../public/js/kernel/module-registry.js';

test('registry joins reentrant and overlapping asynchronous cleanup', async () => {
  const registry = createRegistry();
  let release;
  let reentrant;
  let calls = 0;
  const gate = new Promise((resolve) => { release = resolve; });
  registry.set('owned', {
    id: 'owned',
    cleanup() {
      calls += 1;
      reentrant = registry.cleanupAll();
      return gate;
    },
  });
  const stages = [];
  const first = registry.cleanupAll((record, stage) => stages.push(stage));
  const second = registry.cleanupAll();
  assert.equal(calls, 1);
  assert.equal(registry.has('owned'), true);
  release();
  await Promise.all([first, second, reentrant]);
  assert.deepEqual(stages, ['unmounting', 'unmounted']);
  assert.equal(registry.has('owned'), false);
});

test('a cleanup wave preserves replacement records and does not visit new instances', async () => {
  const registry = createRegistry();
  let newCleanups = 0;
  const replacement = { id: 'same', cleanup() { newCleanups += 1; } };
  registry.set('same', {
    id: 'same',
    cleanup() {
      registry.set('same', replacement);
      registry.set('new', { id: 'new', cleanup() { newCleanups += 1; } });
    },
  });
  await registry.cleanupAll();
  assert.equal(registry.get('same'), replacement);
  assert.equal(registry.has('new'), true);
  assert.equal(newCleanups, 0);
  await registry.cleanupAll();
  assert.equal(newCleanups, 2);
  assert.deepEqual(registry.values(), []);
});

test('cleanup and lifecycle failures release records and do not abort other owners', async () => {
  const registry = createRegistry();
  const warnings = [];
  const previous = console.warn;
  console.warn = (...args) => warnings.push(args);
  let cleanups = 0;
  try {
    registry.set('sync', { id: 'sync', cleanup() { throw new Error('sync'); } });
    registry.set('async', { id: 'async', async cleanup() { throw new Error('async'); } });
    registry.set('healthy', { id: 'healthy', cleanup() { cleanups += 1; } });
    await registry.cleanupAll((record, stage) => {
      if (record.id === 'sync' && stage === 'unmounted') throw new Error('callback');
      if (record.id === 'healthy' && stage === 'unmounting') throw new Error('early callback');
    });
    assert.equal(cleanups, 1);
    assert.equal(warnings.length, 4);
    assert.deepEqual(registry.values(), []);
  } finally {
    console.warn = previous;
  }
});
