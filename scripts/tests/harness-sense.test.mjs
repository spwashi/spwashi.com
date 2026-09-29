import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SENSE_KINDS,
  formatSenseMenu,
  formatStillIds,
  listSenseFixtures,
  parseSenseArgs,
  parseWanderArgs,
  resolveInkIds,
  wanderSense,
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
  assert.equal(SENSE_KINDS.stills.script, 'audit:stills');
  const menu = formatSenseMenu([{ id: 'about-opening' }]);
  assert.match(menu, /npm run sense -- copy/);
  assert.match(menu, /npm run sense -- stills/);
  assert.match(menu, /full pack/);
  const listed = formatStillIds([
    { id: 'about-opening', specimenRoute: '/about/', label: 'About opening' },
  ]);
  assert.match(listed, /about-opening/);
  assert.match(listed, /\/about\//);
  const fixtures = listSenseFixtures();
  assert.ok(fixtures.some((recipe) => recipe.id === 'about-opening'));
  assert.ok(fixtures.some((recipe) => recipe.id === 'about-opening-dark'));
  assert.ok(fixtures.some((recipe) => recipe.id === 'rpg-wrap-jobs'));
  assert.ok(fixtures.length > 17);
});

test('wander is dry by default and hands back the replay command', () => {
  assert.deepEqual(parseWanderArgs(['moss']), { seed: 'moss', count: 6, run: false });
  assert.deepEqual(parseWanderArgs(['--seed=moss', '--count', '3', '--run']), { seed: 'moss', count: 3, run: true });
  assert.equal(parseWanderArgs([]).seed, undefined);
  const sensed = wanderSense(['moss']);
  assert.equal(sensed.run, false);
  assert.equal(sensed.receipt.seed, 'moss');
  assert.match(sensed.text, /#>wander seed=moss n=6/);
  assert.match(sensed.text, /capture: npm run visual:capture -- --profile wander --seed moss/);
  assert.deepEqual(wanderSense(['moss']).receipt, sensed.receipt);
  const menu = formatSenseMenu([{ id: 'about-opening' }]).split('\n');
  assert.equal(menu.filter((line) => line.startsWith('[sense] wander')).length, 1);
});
