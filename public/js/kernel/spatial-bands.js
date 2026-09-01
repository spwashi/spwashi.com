/**
 * spatial-bands.js
 * --------------------------------------------------------------------------
 * One table for the inline and block bands that runtime modules project onto
 * the DOM as data-spw-measure-band and data-spw-extent.
 *
 * Why this file exists. Two modules — runtime/spatial-gravity.js and
 * runtime/positioning-orchestration.js — write the same four attributes
 * (spwMeasureBand, spwExtent, spwVerticalGravity, spwSpaceVariant) to the same
 * [data-spw-gravity] elements, each from its own private copy of the
 * thresholds. The inline bands happened to agree. The block bands did not:
 * one called an element "overtall" at 0.95 of the viewport and the other at
 * 1.8, so the value on any shared element was decided by whichever module
 * measured last, and a squeeze keyed on "overtall" fired or did not fire for
 * reasons nothing in the CSS could explain.
 *
 * The rule this file enforces is narrow: a vocabulary has one definition. It
 * does not decide who writes the attribute — both callers still do — but they
 * can no longer disagree about what the words mean.
 *
 * `contained` is the anchored value: an element at or below one viewport
 * height fits on screen, which is a fact about the reader rather than a tuning
 * choice. `tall` and `overtall` are multiples of that anchor, and `squat` is
 * the band where an element is small enough that vertical position matters
 * more than vertical size.
 * --------------------------------------------------------------------------
 */

/* Inline size, in px. Below `compact` a component cannot hold a second column;
   above `wide` it can hold a rail beside its body. */
export const MEASURE_BANDS = Object.freeze({
  compact: 320,
  balanced: 580,
  wide: 880,
});

/* Block size as a ratio of viewport height. */
export const EXTENT_RATIOS = Object.freeze({
  squat: 0.25,
  contained: 1,
  tall: 1.8,
});

export const MEASURE_BAND_VALUES = Object.freeze(['compact', 'balanced', 'wide', 'maximal']);
export const EXTENT_VALUES = Object.freeze(['squat', 'contained', 'tall', 'overtall']);

/* Deadband.
 *
 * These bands drive a squeeze, and the squeeze changes the geometry the bands
 * are measured from: tightening gap and pad shortens a component, which can
 * carry it back across the edge it just crossed, which loosens them again. A
 * component parked within a few percent of an edge would sit there flipping.
 *
 * So an edge is only crossed when it is cleared by a margin, and the margin is
 * only required in the direction of travel. A band, once entered, is held until
 * the geometry has clearly left it. Callers pass the value currently on the
 * element; omit it and these resolve without memory, which is correct for a
 * first measurement and for anything that is not driving its own input. */
const MEASURE_BAND_EDGES = [MEASURE_BANDS.compact, MEASURE_BANDS.balanced, MEASURE_BANDS.wide];
const EXTENT_EDGES = [EXTENT_RATIOS.squat, EXTENT_RATIOS.contained, EXTENT_RATIOS.tall];

/* Relative to the edge, so an edge at 1.8 gets a wider absolute deadband than
   one at 0.25 — the squeeze moves a tall component further than a short one. */
export const BAND_HYSTERESIS = 0.08;

const holdBand = (value, raw, order, edges, previous) => {
  if (!previous || previous === raw) return raw;
  const prevIndex = order.indexOf(previous);
  const rawIndex = order.indexOf(raw);
  if (prevIndex < 0 || rawIndex < 0) return raw;
  if (rawIndex > prevIndex) {
    const edge = edges[rawIndex - 1];
    return value >= edge + edge * BAND_HYSTERESIS ? raw : previous;
  }
  const edge = edges[rawIndex];
  return value <= edge - edge * BAND_HYSTERESIS ? raw : previous;
};

const rawMeasureBand = (inlineSize) => {
  if (inlineSize < MEASURE_BANDS.compact) return 'compact';
  if (inlineSize < MEASURE_BANDS.balanced) return 'balanced';
  if (inlineSize < MEASURE_BANDS.wide) return 'wide';
  return 'maximal';
};

const rawExtent = (ratio) => {
  if (ratio < EXTENT_RATIOS.squat) return 'squat';
  if (ratio <= EXTENT_RATIOS.contained) return 'contained';
  if (ratio <= EXTENT_RATIOS.tall) return 'tall';
  return 'overtall';
};

export const resolveMeasureBand = (inlineSize, previous) =>
  holdBand(inlineSize, rawMeasureBand(inlineSize), MEASURE_BAND_VALUES, MEASURE_BAND_EDGES, previous);

export const resolveExtent = (blockSize, viewportHeight, previous) => {
  const ratio = blockSize / Math.max(1, viewportHeight);
  return holdBand(ratio, rawExtent(ratio), EXTENT_VALUES, EXTENT_EDGES, previous);
};

/* Vertical gravity shares a deadzone with the extent bands so a component that
   reads as centred by one module reads as centred by the other. */
export const VERTICAL_DEADZONE = 0.15;

export const resolveVerticalGravity = (bias) => {
  if (bias > VERTICAL_DEADZONE) return 'falls';
  if (bias < -VERTICAL_DEADZONE) return 'rises';
  return 'balanced';
};

export const SPATIAL_BANDS_CONTRACT = Object.freeze({
  owns: 'data-spw-measure-band, data-spw-extent, data-spw-vertical-gravity, data-spw-space-variant',
  writers: Object.freeze(['runtime/spatial-gravity.js', 'runtime/positioning-orchestration.js']),
  rule: 'One definition per vocabulary. A writer imports these; it does not restate them.',
  anchor: 'contained = at most one viewport height. Everything else is a multiple of that.',
  deadband: 'A band that drives a squeeze is held until the geometry clears its edge by BAND_HYSTERESIS. Pass the element\'s current value to engage it.',
});
