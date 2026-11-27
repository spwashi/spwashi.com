import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GESTURE_MEASURE,
  PINCH_MEASURE,
  SLOT_SCRUB_COMMIT_MODES,
  pinchCueOf,
  pinchThresholdOf,
  scrubStepDelta,
  stepLadderIndex,
  swallowsTap,
} from '../../public/js/kernel/gesture-measure.js';
import { PINCH_STEP } from '../../public/js/kernel/pinch-text-scale.js';
import { SECTION_HANDLE_SWIPE_DELTA_PX } from '../../public/js/runtime/attention/section-handle.js';
import { PINCH, cueOf, thresholdOf } from '../../workers/lib/pinch.js';
import { SCRUB_MEASURE, SLOT_SCRUB_COMMIT_MODES as WORKER_COMMIT_MODES } from '../../workers/lib/slot-scrub.js';
import { buildInventory, parseJsExports, resolveComposeSpecifier } from '../starter-inventory.mjs';

test('tap, hold, swipe, and slot scrub share one measure', () => {
  assert.equal(GESTURE_MEASURE.holdMs, 420);
  assert.equal(GESTURE_MEASURE.swipeMinPx, 48);
  assert.equal(GESTURE_MEASURE.swipeDominance, 1.45);
  assert.equal(GESTURE_MEASURE.scrubStepPx, 28);
  assert.equal(GESTURE_MEASURE.scrubDeadZonePx, 6);
  assert.equal(GESTURE_MEASURE.tapSwallowMs, 360);
  assert.equal(SECTION_HANDLE_SWIPE_DELTA_PX, GESTURE_MEASURE.swipeMinPx);
  assert.equal(SCRUB_MEASURE.stepPx, GESTURE_MEASURE.scrubStepPx);
  assert.equal(SCRUB_MEASURE.deadZonePx, GESTURE_MEASURE.scrubDeadZonePx);
  assert.deepEqual(SLOT_SCRUB_COMMIT_MODES, ['live', 'on-lift', 'prime-then-keep']);
  assert.deepEqual(WORKER_COMMIT_MODES, SLOT_SCRUB_COMMIT_MODES);
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
  assert.equal(pinchCueOf('shot', 1.24, '#>keep · close-up'), cueOf('shot', 1.24, '#>keep · close-up'));
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

test('swallowsTap suppresses one immediate post-scrub click and lets the next real tap land', () => {
  let listener = null;
  const host = {
    addEventListener(type, fn) { if (type === 'click') listener = fn; },
    removeEventListener(type, fn) { if (type === 'click' && listener === fn) listener = null; },
  };
  const check = swallowsTap(host, 200);
  assert.equal(typeof listener, 'function');
  let prevented = false;
  listener({ preventDefault() { prevented = true; }, stopPropagation() {} });
  assert.equal(prevented, true);
  assert.equal(listener, null);
  // The ghost click is spent: a later tap on the slot is a real one.
  assert.equal(check(), false);

  // A host handler that hears the click first claims it once, and the blocker stands down.
  const first = swallowsTap(host, 200);
  assert.equal(first(), true);
  assert.equal(listener, null);
  assert.equal(first(), false);
});

test('starter-inventory resolves both relative and root-relative compose.js specifiers and lists travelling pieces', async () => {
  assert.equal(resolveComposeSpecifier('./kernel/dom-render.js'), 'public/js/kernel/dom-render.js');
  assert.equal(resolveComposeSpecifier('/public/js/kernel/palette-resonance.js'), 'public/js/kernel/palette-resonance.js');
  const parsed = parseJsExports(`
    export { a } from './kernel/dom-render.js';
    export { b as c } from '/public/js/kernel/palette-resonance.js';
  `);
  assert.deepEqual(parsed.named, ['a', 'c']);
  assert.deepEqual(parsed.sources, ['public/js/kernel/dom-render.js', 'public/js/kernel/palette-resonance.js']);
  const inv = await buildInventory();
  assert.deepEqual(inv.missing, []);
  assert.ok(inv.travellingPieces.some((p) => p.id === 'gesture-measure' && p.exists));
});
