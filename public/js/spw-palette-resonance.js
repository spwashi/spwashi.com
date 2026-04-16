const DEFAULT_PALETTE_RESONANCE = 'route';

const PALETTE_RESONANCE_TOKENS = Object.freeze({
  route: Object.freeze([]),
  craft: Object.freeze(['craft', 'site-design', 'svg', 'fragments']),
  software: Object.freeze(['software', 'spw', 'parsers', 'renderers']),
  math: Object.freeze(['math', 'number-theory', 'category-theory', 'field-theory'])
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

export {
  DEFAULT_PALETTE_RESONANCE,
  PALETTE_RESONANCE_OPTIONS,
  getPaletteResonanceSwatches,
  getPaletteResonanceTokens,
  normalizePaletteResonance
};
