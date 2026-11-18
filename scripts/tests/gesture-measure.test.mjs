import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GESTURE_MEASURE,
  PINCH_MEASURE,
  pinchThresholdOf,
  scrubStepDelta,
  stepLadderIndex,
} from '../../public/js/kernel/gesture-measure.js';
import { PINCH_STEP } from '../../public/js/kernel/pinch-text-scale.js';
import { SECTION_HANDLE_SWIPE_DELTA_PX } from '../../public/js/runtime/attention/section-handle.js';
import { PINCH, thresholdOf } from '../../workers/lib/pinch.js';

test('tap, hold, swipe, and slot scrub share one measure', () => {
  assert.equal(GESTURE_MEASURE.holdMs, 420);
  assert.equal(GESTURE_MEASURE.swipeMinPx, 48);
  assert.equal(GESTURE_MEASURE.swipeDominance, 1.45);
  assert.equal(GESTURE_MEASURE.scrubStepPx, 28);
  assert.equal(SECTION_HANDLE_SWIPE_DELTA_PX, GESTURE_MEASURE.swipeMinPx);
});

test('pinch measures align across text scale and spatial/optical planes', () => {
  assert.equal(PINCH_MEASURE.textStepLog2, PINCH_STEP);
  assert.equal(PINCH_MEASURE.enter, PINCH.enter);
  assert.equal(PINCH_MEASURE.keep, PINCH.keep);
  assert.equal(PINCH_MEASURE.near, PINCH.near);
  assert.equal(PINCH_MEASURE.up, PINCH.up);
  assert.equal(PINCH_MEASURE.wheel, PINCH.wheel);
  assert.deepEqual(pinchThresholdOf(1.2, 'close-up', 'wide'), thresholdOf(1.2, 'close-up', 'wide'));
  assert.deepEqual(pinchThresholdOf(1.4, 'close-up', 'wide'), thresholdOf(1.4, 'close-up', 'wide'));
  assert.deepEqual(pinchThresholdOf(0.8, 'close-up', 'wide'), thresholdOf(0.8, 'close-up', 'wide'));
  assert.deepEqual(pinchThresholdOf(0.6, 'close-up', 'wide'), thresholdOf(0.6, 'close-up', 'wide'));
});

test('stepLadderIndex handles bounded, clamped, and wrapping ladders', () => {
  assert.equal(stepLadderIndex(0, 4, -1), -1);
  assert.equal(stepLadderIndex(3, 4, 1), -1);
  assert.equal(stepLadderIndex(1, 4, 1), 2);
  assert.equal(stepLadderIndex(0, 4, -1, { clamp: true }), 0);
  assert.equal(stepLadderIndex(3, 4, 1, { clamp: true }), 3);
  assert.equal(stepLadderIndex(0, 4, -1, { wrap: true }), 3);
  assert.equal(stepLadderIndex(3, 4, 1, { wrap: true }), 0);
  assert.equal(stepLadderIndex(0, 0, 1, { wrap: true }), -1);
});

test('scrubStepDelta quantizes pointer travel toward zero', () => {
  assert.equal(scrubStepDelta(0), 0);
  assert.equal(scrubStepDelta(27), 0);
  assert.equal(scrubStepDelta(28), 1);
  assert.equal(scrubStepDelta(-56), -2);
  assert.equal(scrubStepDelta(40, 20), 2);
});
