import test from 'node:test';
import assert from 'node:assert/strict';
import { GESTURE_MEASURE } from '../../public/js/runtime/interaction/gesture-measure.js';
import { SECTION_HANDLE_SWIPE_DELTA_PX } from '../../public/js/runtime/attention/section-handle.js';

test('tap, hold, and swipe share one measure', () => {
  assert.equal(GESTURE_MEASURE.holdMs, 420);
  assert.equal(GESTURE_MEASURE.swipeMinPx, 48);
  assert.equal(GESTURE_MEASURE.swipeDominance, 1.45);
  assert.equal(SECTION_HANDLE_SWIPE_DELTA_PX, GESTURE_MEASURE.swipeMinPx);
});
