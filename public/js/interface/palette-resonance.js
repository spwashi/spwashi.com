const DEFAULT_PALETTE_RESONANCE = 'route';

const PALETTE_RESONANCE_TOKENS = Object.freeze({
  route: Object.freeze([]),
  craft: Object.freeze(['craft', 'site-design', 'svg', 'fragments', 'website', 'services', 'contact']),
  software: Object.freeze(['software', 'spw', 'parsers', 'renderers', 'browser', 'compression', 'schedulers', 'lattices']),
  math: Object.freeze(['math', 'number-theory', 'category-theory', 'field-theory', 'complexity', 'symmetry', 'topology', 'combinatorics'])
});

const PALETTE_RESONANCE_SWATCHES = Object.freeze({
  route: Object.freeze([
    'var(--active-op-color, #008080)',
    'var(--op-object-color, #c68a22)',
    'var(--op-ref-color, #1d57a3)',
    'var(--op-probe-color, #6a3fb8)'
  ]),
  craft: Object.freeze([
    'var(--op-frame-color, #178282)',
    'var(--op-object-color, #c68a22)',
    'var(--op-pragma-color, #7f4b2e)',
    'var(--op-topic-color, #2a8c76)'
  ]),
  software: Object.freeze([
    'var(--teal, #008080)',
    'var(--op-topic-color, #2a8c76)',
    'var(--op-ref-color, #1d57a3)',
    'var(--op-probe-color, #6a3fb8)'
  ]),
  math: Object.freeze([
    'var(--op-topic-color, #2a8c76)',
    'var(--op-object-color, #c68a22)',
    'var(--op-probe-color, #6a3fb8)',
    'var(--op-ref-color, #1d57a3)'
  ])
});

const PALETTE_RESONANCE_OPTIONS = Object.freeze(
  Object.keys(PALETTE_RESONANCE_TOKENS)
);

const normalizePaletteResonance = (value = '') => {
  const normalized = String(value).trim().toLowerCase();
  return PALETTE_RESONANCE_OPTIONS.includes(normalized)
    ? normalized
    : DEFAULT_PALETTE_RESONANCE;
};

const getPaletteResonanceTokens = (value = DEFAULT_PALETTE_RESONANCE) => (
  [...(PALETTE_RESONANCE_TOKENS[normalizePaletteResonance(value)] || [])]
);

const getPaletteResonanceSwatches = (value = DEFAULT_PALETTE_RESONANCE) => (
  [...(PALETTE_RESONANCE_SWATCHES[normalizePaletteResonance(value)] || PALETTE_RESONANCE_SWATCHES.route)]
);

/** Depth probes derived from the primary resonance swatch (shadow + highlight). */
const getPaletteDepthSwatches = (value = DEFAULT_PALETTE_RESONANCE) => {
  const base = getPaletteResonanceSwatches(value);
  const primary = base[0] || 'var(--active-op-color, #008080)';
  const accent = base[3] || base[1] || primary;
  return Object.freeze([
    `color-mix(in srgb, ${primary} 58%, #101418 42%)`,
    `color-mix(in srgb, ${primary} 24%, #ffffff 76%)`,
    `color-mix(in srgb, ${accent} 18%, transparent)`,
  ]);
};

export {
  DEFAULT_PALETTE_RESONANCE,
  PALETTE_RESONANCE_OPTIONS,
  getPaletteDepthSwatches,
  getPaletteResonanceSwatches,
  getPaletteResonanceTokens,
  normalizePaletteResonance
};
