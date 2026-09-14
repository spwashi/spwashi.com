import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COST_CLASS,
  COST_CLASS_VALUES,
  COST_COMMITMENT,
  COST_COPY,
  COST_SPEND,
  VISUAL_EFFECT,
  costClassFromModel,
  costModelFromClass,
} from '/public/js/runtime/catalog/constants.js';

test('costClassFromModel keeps spend when commitment is authored', () => {
  assert.equal(
    costClassFromModel({
      commitment: COST_COMMITMENT.AUTHORED,
      spend: COST_SPEND.PAINT,
    }),
    COST_CLASS.PAINT_COMPOSITE,
  );
});

test('costClassFromModel names listen and residue instead of demand_coupled', () => {
  assert.equal(
    costClassFromModel({
      commitment: COST_COMMITMENT.LISTEN,
      spend: COST_SPEND.NONE,
    }),
    COST_CLASS.LISTEN,
  );
  assert.equal(
    costClassFromModel({
      commitment: COST_COMMITMENT.RESIDUE,
      spend: COST_SPEND.NONE,
      copy: COST_COPY.PIN,
    }),
    COST_CLASS.RESIDUE,
  );
  assert.equal(
    costClassFromModel({
      commitment: COST_COMMITMENT.PROJECT,
      spend: COST_SPEND.NONE,
    }),
    COST_CLASS.DEMAND_COUPLED,
  );
});

test('costClassFromModel round-trips every COST_CLASS token', () => {
  assert.equal(COST_CLASS_VALUES.length, 8);
  for (const token of COST_CLASS_VALUES) {
    assert.equal(costClassFromModel(costModelFromClass(token)), token, token);
  }
});

test('visual effect set includes express', () => {
  assert.equal(VISUAL_EFFECT.EXPRESS, 'express');
});
