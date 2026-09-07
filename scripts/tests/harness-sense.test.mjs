import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SENSE_KINDS,
  formatSenseMenu,
  formatStillIds,
  listSenseFixtures,
  parseSenseArgs,
  resolveInkIds,
} from '../harness-sense.mjs';

test('sense args drop npm -- separators', () => {
  assert.deepEqual(parseSenseArgs(['--', 'ink', 'about-opening']), {
    kind: 'ink',
    rest: ['about-opening'],
  });
  assert.equal(parseSenseArgs([]).kind, '');
});

test('ink ids accept bare names and --ids forms', () => {
  assert.deepEqual(resolveInkIds(['about-opening']), ['about-opening']);
  assert.deepEqual(resolveInkIds(['--ids=about-opening,home-opening']), ['about-opening', 'home-opening']);
  assert.deepEqual(resolveInkIds(['--ids', 'about-opening']), ['about-opening']);
});

test('menu and id list name the cheap path', () => {
  assert.ok(SENSE_KINDS.ink.needsId);
  const menu = formatSenseMenu([{ id: 'about-opening' }]);
  assert.match(menu, /npm run sense -- copy/);
  assert.match(menu, /full pack/);
  const listed = formatStillIds([
    { id: 'about-opening', specimenRoute: '/about/', label: 'About opening' },
  ]);
  assert.match(listed, /about-opening/);
  assert.match(listed, /\/about\//);
  const fixtures = listSenseFixtures();
  assert.ok(fixtures.some((recipe) => recipe.id === 'about-opening'));
  assert.ok(fixtures.some((recipe) => recipe.id === 'about-opening-dark'));
  assert.ok(fixtures.length > 17);
});
