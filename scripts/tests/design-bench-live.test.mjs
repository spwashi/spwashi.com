/**
 * The design hub's live bench: pure readings (no DOM).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { countCombinations, readAxes, runtimeExpression, specimenExpression, summarizeModules } from '../../public/js/modules/design/bench-live.js';

describe('design bench, live', () => {
  it('counts mounted modules by layer and writes them as one expression', () => {
    const summary = summarizeModules([
      { id: 'b-mod', status: 'mounted', layer: 'feature', describes: 'b[x]{y}' },
      { id: 'a-mod', status: 'mounted', layer: 'core' },
      { id: 'c-mod', status: 'scheduled', layer: 'feature' },
      null,
    ]);
    assert.deepEqual(summary.mounted.map((m) => m.id), ['a-mod', 'b-mod']);
    assert.equal(summary.waiting, 1);
    assert.deepEqual(summary.byLayer, { feature: 1, core: 1 });
    assert.equal(runtimeExpression(summary, 'design'), 'runtime[design]{mounted.2}<1_waiting>');
  });

  it('reads the specimen axes in order, with the pressed value as current', () => {
    const axes = readAxes([
      { set: 'posture:stack' }, { set: 'posture:split', pressed: true },
      { set: 'environment:calm', pressed: true }, { set: 'environment:social' },
      { set: 'variant:soft', pressed: true },
      { set: 'behavior:rest' }, { set: 'behavior:draft', pressed: true }, { set: 'broken' },
    ]);
    assert.deepEqual(axes.map((a) => a.axis), ['environment', 'variant', 'behavior', 'posture']);
    assert.equal(countCombinations(axes), 2 * 1 * 2 * 2);
    assert.equal(specimenExpression(axes), 'specimen[calm]{soft.draft.split}');
  });

  it('is empty without controls', () => {
    assert.equal(countCombinations([]), 0);
    assert.equal(specimenExpression([]), 'specimen{}');
  });
});
