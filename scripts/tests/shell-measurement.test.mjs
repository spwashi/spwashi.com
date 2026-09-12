import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SPW_SHELL_MEASUREMENT_CONTRACT,
  VIEWPORT_TIERS,
  SCROLL_BANDS,
  SCROLL_DIRECTIONS,
  PRESSURES,
  getViewportTier,
  layoutReasonForTier,
  resolveScrollBand,
  resolveScrollDirection,
  resolveMenuPressure,
} from '../../public/js/runtime/shell/measurement.js';

test('shell measurement exports frozen contract', () => {
  assert.ok(Object.isFrozen(SPW_SHELL_MEASUREMENT_CONTRACT));
  assert.ok(Object.isFrozen(SPW_SHELL_MEASUREMENT_CONTRACT.tiers));
  assert.ok(Object.isFrozen(SPW_SHELL_MEASUREMENT_CONTRACT.scrollBands));
  assert.ok(Object.isFrozen(SPW_SHELL_MEASUREMENT_CONTRACT.scrollDirections));
  assert.ok(Object.isFrozen(SPW_SHELL_MEASUREMENT_CONTRACT.pressures));
});

test('viewport tiers resolve across standard breakpoints', () => {
  assert.equal(getViewportTier(320), VIEWPORT_TIERS.COMPACT);
  assert.equal(getViewportTier(419), VIEWPORT_TIERS.COMPACT);
  assert.equal(getViewportTier(420), VIEWPORT_TIERS.NARROW);
  assert.equal(getViewportTier(719), VIEWPORT_TIERS.NARROW);
  assert.equal(getViewportTier(720), VIEWPORT_TIERS.MID);
  assert.equal(getViewportTier(979), VIEWPORT_TIERS.MID);
  assert.equal(getViewportTier(980), VIEWPORT_TIERS.REGULAR);
  assert.equal(getViewportTier(1279), VIEWPORT_TIERS.REGULAR);
  assert.equal(getViewportTier(1280), VIEWPORT_TIERS.WIDE);
  assert.equal(getViewportTier(1920), VIEWPORT_TIERS.WIDE);
});

test('layoutReasonForTier maps tiers to layout postures', () => {
  assert.equal(layoutReasonForTier(VIEWPORT_TIERS.COMPACT), 'pocket');
  assert.equal(layoutReasonForTier(VIEWPORT_TIERS.NARROW), 'pocket');
  assert.equal(layoutReasonForTier(VIEWPORT_TIERS.MID), 'fold');
  assert.equal(layoutReasonForTier(VIEWPORT_TIERS.REGULAR), 'broadsheet');
  assert.equal(layoutReasonForTier(VIEWPORT_TIERS.WIDE), 'broadsheet');
});

test('scroll bands resolve thresholds', () => {
  assert.equal(resolveScrollBand(0), SCROLL_BANDS.TOP);
  assert.equal(resolveScrollBand(18), SCROLL_BANDS.TOP);
  assert.equal(resolveScrollBand(19), SCROLL_BANDS.LIFTED);
  assert.equal(resolveScrollBand(131), SCROLL_BANDS.LIFTED);
  assert.equal(resolveScrollBand(132), SCROLL_BANDS.DEEP);
  assert.equal(resolveScrollBand(500), SCROLL_BANDS.DEEP);
});

test('scroll directions honor deadzone', () => {
  assert.equal(resolveScrollDirection(10, 0), SCROLL_DIRECTIONS.DOWN);
  assert.equal(resolveScrollDirection(2, 0), SCROLL_DIRECTIONS.STILL);
  assert.equal(resolveScrollDirection(0, 10), SCROLL_DIRECTIONS.UP);
  assert.equal(resolveScrollDirection(0, 2), SCROLL_DIRECTIONS.STILL);
});

test('resolveMenuPressure handles ratio hysteresis and crowded toggle', () => {
  assert.equal(
    resolveMenuPressure({ mode: 'toggle', tier: VIEWPORT_TIERS.COMPACT }),
    PRESSURES.CROWDED
  );
  assert.equal(
    resolveMenuPressure({ ratio: 0.9, navFit: 'roomy', tier: VIEWPORT_TIERS.WIDE }),
    PRESSURES.CALM
  );
  assert.equal(
    resolveMenuPressure({ ratio: 1.05, navFit: 'roomy', tier: VIEWPORT_TIERS.WIDE }),
    PRESSURES.TIGHT
  );
  assert.equal(
    resolveMenuPressure({ ratio: 1.25, navFit: 'roomy', tier: VIEWPORT_TIERS.WIDE }),
    PRESSURES.COMPRESSED
  );
});
