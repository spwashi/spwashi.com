/**
 * One measure for tap, hold, and swipe.
 * A number with no behavior sits in the kernel so semantic, runtime, and
 * interface can read it without reaching up. vocabulary.js re-exports it
 * so the interaction family still has one door.
 */

export const GESTURE_MEASURE = Object.freeze({
  holdMs: 420,
  swipeMinPx: 48,
  swipeDominance: 1.45,
});
