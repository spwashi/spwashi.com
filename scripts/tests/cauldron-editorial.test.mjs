import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readEditorialClusterKey,
  clusterIngredientsByTheme,
  composePromptDraft,
  composeVisionDrafts,
  clusterIndexByExpression,
} from '../../public/js/interface/cauldron/storage.js';

function fragment(overrides = {}) {
  return {
    expression: overrides.expression || '~orient',
    operator: overrides.operator || '~',
    text: overrides.text,
    label: overrides.label,
    group: overrides.group,
    wonder: overrides.wonder,
    context: overrides.context,
    payload: {
      region: overrides.region || '',
      liminality: overrides.liminality || '',
      ...(overrides.payload || {}),
    },
    provenance: overrides.route
      ? { route: overrides.route, anchor: overrides.anchor || '', href: `${overrides.route}${overrides.anchor ? `#${overrides.anchor}` : ''}` }
      : null,
    ...overrides,
  };
}

test('readEditorialClusterKey reads group/wonder/context, lowercased and trimmed', () => {
  const item = fragment({ group: '  Papergami  ', wonder: 'What holds a grain?', context: 'materials' });
  assert.equal(readEditorialClusterKey(item, 'group'), 'papergami');
  assert.equal(readEditorialClusterKey(item, 'wonder'), 'what holds a grain?');
  assert.equal(readEditorialClusterKey(item, 'context'), 'materials');
  assert.equal(readEditorialClusterKey(item, 'unknown-axis'), '');
  assert.equal(readEditorialClusterKey(null, 'group'), '');
});

test('clusterIngredientsByTheme groups by shared topic, not by structural axes', () => {
  const items = [
    fragment({ text: 'grain', group: 'material', operator: '~', region: 'hook', route: '/design/' }),
    fragment({ text: 'matte', group: 'material', operator: '?', region: 'read', route: '/play/' }),
    fragment({ text: 'threshold', group: 'liminal', operator: '~', region: 'hook', route: '/design/' }),
  ];
  const result = clusterIngredientsByTheme(items);
  assert.equal(result.axis, 'group');
  const clustered = result.groups.find((g) => g.clustered);
  assert.equal(clustered.items.length, 2);
  assert.deepEqual(clustered.items.map((i) => i.ingredient.text), ['grain', 'matte']);
});

test('editorial clustering does not disturb the structural axis clusterIndexByExpression uses', () => {
  // Two share a topic (group) but nothing structural; two share a route but no topic.
  const items = [
    fragment({ expression: 'a', operator: '~', text: 'grain', group: 'material', route: '/design/' }),
    fragment({ expression: 'b', operator: '?', text: 'matte', group: 'material', route: '/play/' }),
    fragment({ expression: 'c', operator: '&', text: 'other', group: 'other', route: '/design/' }),
    fragment({ expression: 'd', operator: '@', text: 'more', group: 'more', route: '/design/' }),
  ];
  const structural = clusterIndexByExpression(items);
  // route is the only structural axis that clusters here (a/c/d share /design/).
  assert.equal(structural.get('a'), structural.get('c'));
  assert.equal(structural.get('c'), structural.get('d'));
  assert.notEqual(structural.get('a'), structural.get('b'));
});

test('composePromptDraft joins unique text (falling back to label), in capture order', () => {
  const items = [
    { ingredient: fragment({ text: 'papergami grain' }) },
    { ingredient: fragment({ text: '', label: 'boonhonk' }) },
    { ingredient: fragment({ text: 'papergami grain' }) }, // duplicate, collapses
  ];
  assert.equal(composePromptDraft(items), 'papergami grain, boonhonk');
});

test('composePromptDraft skips ingredients with no text or label', () => {
  const items = [
    { ingredient: fragment({ text: '', label: '' }) },
    { ingredient: fragment({ text: 'grain' }) },
  ];
  assert.equal(composePromptDraft(items), 'grain');
});

test('composeVisionDrafts turns theme clusters into prompt strings, skipping the unclustered remainder', () => {
  const items = [
    fragment({ text: 'grain', group: 'material' }),
    fragment({ text: 'matte', group: 'material' }),
    fragment({ text: 'orphan', group: 'unshared' }),
  ];
  const drafts = composeVisionDrafts(items);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].axis, 'group');
  assert.equal(drafts[0].key, 'material');
  assert.equal(drafts[0].prompt, 'grain, matte');
});

test('composeVisionDrafts returns nothing for a gathering with no shared theme', () => {
  const items = [
    fragment({ text: 'grain', group: 'a' }),
    fragment({ text: 'matte', group: 'b' }),
  ];
  assert.deepEqual(composeVisionDrafts(items), []);
});
