import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMPONENT_FIXTURES,
  getComponentFixture,
} from '../../public/js/kernel/component-fixtures.js';
import {
  REGION_ECOLOGY_FIXTURES,
  getRegionEcologyFixture,
} from '../../public/js/kernel/region-ecology-fixtures.js';
import { collectComponentContractReport } from '../component-contracts.mjs';

test('component fixtures have stable ids and consumer lookup', () => {
  assert.deepEqual(COMPONENT_FIXTURES.map((fixture) => fixture.id), [
    'site-frame',
    'frame-card',
    'operator-chip',
    'tuning-strip',
  ]);
  assert.equal(getComponentFixture('frame-card')?.label, 'Frame card');
  const tuningStrip = getComponentFixture('tuning-strip');
  assert.equal(tuningStrip?.cssOwner, 'public/css/components/controls.css');
  assert.equal(tuningStrip?.snippet, 'design/components/snippets/tuning-strip.html');
  assert.equal(tuningStrip?.regionSelector, '#structural-vocabulary');
  assert.deepEqual(tuningStrip?.captureFlows, ['region', 'component', 'template']);
  assert.ok(
    COMPONENT_FIXTURES
      .filter((fixture) => fixture.captureFlows?.includes('region'))
      .every((fixture) => fixture.regionSelector),
  );
  assert.equal(getComponentFixture('missing'), undefined);
});

test('component fixtures point to real specimens and CSS owners', async () => {
  const report = await collectComponentContractReport();
  assert.deepEqual(report.errors, []);
  assert.equal(report.ecology, REGION_ECOLOGY_FIXTURES.length);
});

test('region ecology fixtures name six seats on live routes', () => {
  assert.equal(getRegionEcologyFixture('about-years')?.seat, 'path');
  assert.equal(getRegionEcologyFixture('about-systems-desk')?.selector, '[data-spw-cluster="systems-architecture"]');
  assert.ok(REGION_ECOLOGY_FIXTURES.every((fixture) => fixture.specimenRoute && fixture.selector && fixture.seat));
  assert.equal(getComponentFixture('frame-card')?.sizeToken, 'measure-card');
});
