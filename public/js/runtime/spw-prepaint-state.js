/**
 * spw-prepaint-state.js
 * ---------------------------------------------------------------------------
 * Tiny synchronous bootstrap for the first paint.
 *
 * The site-settings runtime still owns normalization, persistence, and
 * canonical application. This file only seeds the document element with the
 * last saved visual state before the main stylesheet loads, reducing flash
 * and layout churn on refresh.
 */

(() => {
  const STORAGE_KEY = 'spw-site-settings';

  const COLOR_MODES = new Set(['auto', 'light', 'dark']);
  const THEME_PACKS = new Set([
    'neutral-paper',
    'oxide-ledger',
    'electric-studio',
    'ritual-vellum',
    'copper-brace',
    'glass-console'
  ]);
  const COMPONENT_DENSITIES = new Set(['dense', 'soft', 'roomy']);
  const AUTHOR_MODES = new Set(['draft', 'revise', 'polish', 'publish', 'archive']);
  const DEVELOPMENTAL_CLIMATES = new Set(['orient', 'anchor', 'weave', 'rehearse', 'offer']);
  const FONT_SIZES = new Set(['small', 'normal', 'large']);
  const LINE_SPACING = new Set(['compact', 'normal', 'loose']);
  const MONOSPACE_VARIANTS = new Set(['system', 'jetbrains', 'courier']);
  const HEADER_OPACITY = new Set(['low', 'normal', 'high']);
  const PALETTE_RESONANCE = new Set(['route', 'craft', 'software', 'math']);
  const SEMANTIC_DENSITY = new Set(['minimal', 'normal', 'rich']);
  const ENHANCEMENT_LEVEL = new Set(['minimal', 'balanced', 'rich']);
  const OPERATOR_SATURATION = new Set(['muted', 'normal', 'vibrant']);
  const BINARY = new Set(['off', 'on']);
  const GRAIN_INTENSITY = new Set(['none', 'subtle', 'moderate', 'rich']);

  const FONT_SIZE_PRESET_MULTIPLIER = Object.freeze({
    small: 0.93,
    normal: 1,
    large: 1.12
  });

  const LINE_SPACING_VALUE = Object.freeze({
    compact: '1.55',
    normal: '1.68',
    loose: '1.82'
  });

  const HEADER_OPACITY_VALUE = Object.freeze({
    low: '0.76',
    normal: '0.9',
    high: '1'
  });

  const MONOSPACE_FONT_VALUE = Object.freeze({
    system: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    jetbrains: '"JetBrains Mono", monospace',
    courier: '"Courier New", Courier, monospace'
  });

  const DEVELOPMENTAL_METADATA = Object.freeze({
    orient: { label: 'kindle', authorLabel: 'find the page', learningMode: 'entry' },
    anchor: { label: 'anchor', authorLabel: 'hold the structure', learningMode: 'stabilize' },
    weave: { label: 'weave', authorLabel: 'connect the material', learningMode: 'connect' },
    rehearse: { label: 'rehearse', authorLabel: 'test the voice', learningMode: 'practice' },
    offer: { label: 'offer', authorLabel: 'prepare the gift', learningMode: 'publish' }
  });

  const html = document.documentElement;

  const readStoredSettings = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const pick = (value, allowed, fallback) => (allowed.has(value) ? value : fallback);
  const toNumber = (value, fallback) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  };

  const settings = readStoredSettings();

  const colorMode = pick(settings.colorMode, COLOR_MODES, 'auto');
  const themePack = pick(settings.themePack, THEME_PACKS, 'neutral-paper');
  const componentDensity = pick(settings.componentDensity, COMPONENT_DENSITIES, 'soft');
  const authorMode = pick(settings.authorMode, AUTHOR_MODES, 'draft');
  const developmentalClimate = pick(settings.currentDevelopmentalClimate, DEVELOPMENTAL_CLIMATES, 'orient');
  const fontSize = pick(settings.fontSize, FONT_SIZES, 'normal');
  const lineSpacing = pick(settings.lineSpacing, LINE_SPACING, 'normal');
  const monospaceVariant = pick(settings.monospaceVariant, MONOSPACE_VARIANTS, 'jetbrains');
  const headerOpacity = pick(settings.headerOpacity, HEADER_OPACITY, 'normal');
  const paletteResonance = pick(settings.paletteResonance, PALETTE_RESONANCE, 'route');
  const semanticDensity = pick(settings.semanticDensity, SEMANTIC_DENSITY, 'minimal');
  const enhancementLevel = pick(settings.enhancementLevel, ENHANCEMENT_LEVEL, 'minimal');
  const operatorSaturation = pick(settings.operatorSaturation, OPERATOR_SATURATION, 'normal');
  const reduceMotion = pick(settings.reduceMotion, BINARY, 'off');
  const highContrast = pick(settings.highContrast, BINARY, 'off');
  const grainIntensity = pick(settings.grainIntensity, GRAIN_INTENSITY, 'subtle');
  const fontSizeScale = toNumber(settings.fontSizeScale, 100);
  const fontScale = FONT_SIZE_PRESET_MULTIPLIER[fontSize] || 1;
  const climate = DEVELOPMENTAL_METADATA[developmentalClimate] || DEVELOPMENTAL_METADATA.orient;

  html.dataset.spwColorMode = colorMode;
  html.dataset.spwThemePack = themePack;
  html.dataset.spwComponentDensity = componentDensity;
  html.dataset.spwAuthorMode = authorMode;
  html.dataset.authorMode = authorMode;
  html.dataset.spwDevelopmentalClimate = developmentalClimate;
  html.dataset.spwSpiritPhase = developmentalClimate;
  html.dataset.spwDevelopmentalLabel = climate.label;
  html.dataset.spwDevelopmentalAuthorLabel = climate.authorLabel;
  html.dataset.spwLearningMode = climate.learningMode;
  html.dataset.spwFontSize = fontSize;
  html.dataset.spwLineSpacing = lineSpacing;
  html.dataset.spwMonospaceVariant = monospaceVariant;
  html.dataset.spwHeaderOpacity = headerOpacity;
  html.dataset.spwPaletteResonance = paletteResonance;
  html.dataset.spwSemanticDensity = semanticDensity;
  html.dataset.spwEnhancementLevel = enhancementLevel;
  html.dataset.spwOperatorSaturation = operatorSaturation;
  html.dataset.spwReduceMotion = reduceMotion;
  html.dataset.spwHighContrast = highContrast;
  html.dataset.spwGrainIntensity = grainIntensity;
  html.dataset.spwFontSizeScale = String(fontSizeScale);
  html.dataset.spwSettingsPreflight = 'ready';

  html.style.colorScheme = colorMode === 'auto' ? 'light dark' : colorMode;
  html.style.setProperty('--font-size-scale', `${fontSizeScale}%`);
  html.style.setProperty('--site-root-font-size', `${Math.round(fontSizeScale * fontScale)}%`);
  html.style.setProperty('--site-line-height', LINE_SPACING_VALUE[lineSpacing] || LINE_SPACING_VALUE.normal);
  html.style.setProperty('--site-mono-font', MONOSPACE_FONT_VALUE[monospaceVariant] || MONOSPACE_FONT_VALUE.jetbrains);
  html.style.setProperty('--site-header-opacity', HEADER_OPACITY_VALUE[headerOpacity] || HEADER_OPACITY_VALUE.normal);
})();
