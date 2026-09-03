import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clusterIndexByExpression,
  clusterIngredients,
  readClusterKey,
  themeClusterCharge,
} from '../../public/js/interface/cauldron/storage.js';

function fragment(overrides = {}) {
  return {
    expression: overrides.expression || '~orient',
    operator: overrides.operator || '~',
    payload: {
      region: overrides.region || '',
      liminality: overrides.liminality || '',
      ...(overrides.payload || {}),
    },
    provenance: overrides.route
      ? { route: overrides.route, anchor: overrides.anchor || '', href: `${overrides.route}${overrides.anchor ? `#${overrides.anchor}` : ''}` }
      : null,
    deepLink: overrides.deepLink || (overrides.route
      ? `${overrides.route}${overrides.anchor ? `#${overrides.anchor}` : ''}`
      : ''),
    ...overrides,
  };
}

test('a single fragment does not cluster', () => {
  const result = clusterIngredients([fragment()]);
  assert.equal(result.axis, null);
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].clustered, false);
});

test('two fragments that share nothing stay a flat remainder', () => {
  const result = clusterIngredients([
    fragment({ expression: '~orient', operator: '~', region: 'hook', liminality: 'entry', route: '/about/' }),
    fragment({ expression: '?probe', operator: '?', region: 'read', liminality: 'exit', route: '/play/' }),
  ]);
  assert.equal(result.axis, null);
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].clustered, false);
  assert.equal(result.groups[0].items.length, 2);
});

test('shared operator wins over a weaker shared route when it yields more groups', () => {
  const result = clusterIngredients([
    fragment({ expression: '~a', operator: '~', route: '/about/' }),
    fragment({ expression: '~b', operator: '~', route: '/about/' }),
    fragment({ expression: '?c', operator: '?', route: '/about/' }),
    fragment({ expression: '?d', operator: '?', route: '/about/' }),
  ]);
  assert.equal(result.axis, 'operator');
  const clustered = result.groups.filter((group) => group.clustered);
  assert.equal(clustered.length, 2);
  assert.deepEqual(clustered.map((group) => group.items.length).sort(), [2, 2]);
});

test('region clusters when operator keys are unique', () => {
  const result = clusterIngredients([
    fragment({ expression: '~a', operator: '~', region: 'hook' }),
    fragment({ expression: '?b', operator: '?', region: 'hook' }),
    fragment({ expression: '#>c', operator: '#>', region: 'read' }),
  ]);
  assert.equal(result.axis, 'region');
  const hook = result.groups.find((group) => group.clustered && group.key === 'hook');
  assert.ok(hook);
  assert.equal(hook.items.length, 2);
  const remainder = result.groups.find((group) => !group.clustered);
  assert.equal(remainder.items.length, 1);
  assert.equal(remainder.items[0].index, 2);
});

test('remove indexes stay the original gather positions', () => {
  const items = [
    fragment({ expression: '~first', operator: '~', region: 'path' }),
    fragment({ expression: '?solo', operator: '?', region: 'read' }),
    fragment({ expression: '~third', operator: '~', region: 'path' }),
  ];
  const result = clusterIngredients(items);
  const clustered = result.groups.find((group) => group.clustered);
  assert.deepEqual(clustered.items.map((item) => item.index), [0, 2]);
});

test('cluster index is shared by kin and unique for remainder', () => {
  const items = [
    fragment({ expression: '~a', operator: '~' }),
    fragment({ expression: '?solo', operator: '?' }),
    fragment({ expression: '~b', operator: '~' }),
  ];
  const index = clusterIndexByExpression(items);
  assert.equal(index.get('~a'), index.get('~b'));
  assert.notEqual(index.get('?solo'), index.get('~a'));
});

test('readClusterKey canonicalizes sigil and name onto the same operator', () => {
  const bySigil = readClusterKey(fragment({ operator: '~' }), 'operator');
  const byName = readClusterKey(fragment({ operator: 'potential' }), 'operator');
  assert.ok(bySigil);
  assert.equal(bySigil, byName);
});

test('theme cluster charge credits wonder and spends action', () => {
  assert.equal(themeClusterCharge([
    fragment({ operator: 'wonder' }),
    fragment({ operator: 'wonder' }),
  ]), 'credit');
  assert.equal(themeClusterCharge([
    fragment({ operator: 'action' }),
    fragment({ operator: 'binding' }),
  ]), 'spend');
  assert.equal(themeClusterCharge([
    fragment({ operator: 'potential' }),
    fragment({ operator: 'ground' }),
  ]), '');
});
