const DEFAULT_PALETTE_RESONANCE = 'situate';

/**
 * Facet keys name how ink answers a charged viewpoint.
 * They are not content lenses. Legacy domain names stay aliases.
 */
const PALETTE_RESONANCE_ALIASES = Object.freeze({
  route: 'situate',
  context: 'situate',
  'context-led': 'situate',
  craft: 'hand',
  'craft-led': 'hand',
  software: 'lattice',
  'software-led': 'lattice',
  math: 'inquiry',
  'math-led': 'inquiry'
});

const PALETTE_RESONANCE_TOKENS = Object.freeze({
  situate: Object.freeze([]),
  hand: Object.freeze(['craft', 'site-design', 'svg', 'fragments', 'website', 'services', 'contact']),
  lattice: Object.freeze(['software', 'spw', 'parsers', 'renderers', 'browser', 'compression', 'schedulers', 'lattices']),
  inquiry: Object.freeze(['math', 'number-theory', 'category-theory', 'field-theory', 'complexity', 'symmetry', 'topology', 'combinatorics'])
});

const PALETTE_RESONANCE_SWATCHES = Object.freeze({
  situate: Object.freeze([
    'var(--active-op-color, #008080)',
    'var(--op-object-color, #c68a22)',
    'var(--op-ref-color, #1d57a3)',
    'var(--op-probe-color, #6a3fb8)'
  ]),
  hand: Object.freeze([
    'var(--op-object-color, #c68a22)',
    'var(--op-pragma-color, #7f4b2e)',
    'var(--pigment-brass-warm, hsl(38 64% 42%))',
    'var(--op-frame-color, #178282)'
  ]),
  lattice: Object.freeze([
    'var(--teal, #008080)',
    'var(--op-ref-color, #1d57a3)',
    'var(--op-topic-color, #2a8c76)',
    'var(--op-frame-color, #178282)'
  ]),
  inquiry: Object.freeze([
    'var(--op-probe-color, #6a3fb8)',
    'var(--pigment-violet-ink, hsl(268 56% 34%))',
    'var(--op-topic-color, #2a8c76)',
    'var(--op-ref-color, #1d57a3)'
  ])
});

const PALETTE_RESONANCE_OPTIONS = Object.freeze(
  Object.keys(PALETTE_RESONANCE_TOKENS)
);

const normalizePaletteResonance = (value = '') => {
  const normalized = String(value).trim().toLowerCase();
  const resolved = PALETTE_RESONANCE_ALIASES[normalized] || normalized;
  return PALETTE_RESONANCE_OPTIONS.includes(resolved)
    ? resolved
    : DEFAULT_PALETTE_RESONANCE;
};

const getPaletteResonanceTokens = (value = DEFAULT_PALETTE_RESONANCE) => (
  [...(PALETTE_RESONANCE_TOKENS[normalizePaletteResonance(value)] || [])]
);

const getPaletteResonanceSwatches = (value = DEFAULT_PALETTE_RESONANCE) => (
  [...(PALETTE_RESONANCE_SWATCHES[normalizePaletteResonance(value)] || PALETTE_RESONANCE_SWATCHES.situate)]
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
  PALETTE_RESONANCE_ALIASES,
  PALETTE_RESONANCE_OPTIONS,
  getPaletteDepthSwatches,
  getPaletteResonanceSwatches,
  getPaletteResonanceTokens,
  normalizePaletteResonance
};
