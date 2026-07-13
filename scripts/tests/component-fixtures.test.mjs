import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMPONENT_FIXTURES,
  getComponentFixture,
} from '../../public/js/kernel/component-fixtures.js';
import { collectComponentContractReport } from '../component-contracts.mjs';

test('component fixtures have stable ids and consumer lookup', () => {
  assert.deepEqual(COMPONENT_FIXTURES.map((fixture) => fixture.id), [
    'site-frame',
    'frame-card',
    'operator-chip',
  ]);
  assert.equal(getComponentFixture('frame-card')?.label, 'Frame card');
  assert.equal(getComponentFixture('missing'), undefined);
});

test('component fixtures point to real specimens and CSS owners', async () => {
  const report = await collectComponentContractReport();
  assert.deepEqual(report.errors, []);
});
