/** Existing interaction thresholds; rationale: interaction-cache.spw#hysteresis. */
export const INTERACTION_HYSTERESIS = Object.freeze({
  // Adjacent rail content is low-cost to reveal; preserve the thumb margin.
  rail: Object.freeze({ minDeltaPx: 28, cooldownMs: 420 }),
  // Navigation can lose scroll position; require a more deliberate gesture.
  landmark: Object.freeze({ minDeltaPx: 48, lockMs: 90 }),
});

// Layout remains owned by the kernel: a proportion of each edge, not pixels.
export { BAND_HYSTERESIS } from '../../kernel/spatial-bands.js';
