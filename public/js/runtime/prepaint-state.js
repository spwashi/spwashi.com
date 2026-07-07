/**
 * prepaint-state.js
 * ---------------------------------------------------------------------------
 * Tiny synchronous bootstrap for the first paint.
 *
 * The site-settings runtime still owns normalization, persistence, and
 * canonical application. This file only seeds the document element with the
 * last saved visual state before the main stylesheet loads, reducing flash
 * and layout churn on refresh.
 *
 * Extended to cover pedagogicalFlavor + componentMotif (critical for early
 * pigment/motif token application in tokens/core.css) and spwRuntimeStage
 * for observable load timing / CSS progressive hooks.
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
  const ATTENTION_SELF_RELATION = new Set(['breath', 'inner-weather', 'dimensional-scan']);
  const ATTENTION_LOCAL_RELATION = new Set(['immediate-field', 'witness', 'reciprocity-proof']);
  const ATTENTION_GLOBAL_RELATION = new Set(['horizon-systems', 'cultural-fermentation', 'stewardship']);

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
  const baseMetamaterial = pick(settings.baseMetamaterial, new Set(['paper', 'glass', 'matte', 'field']), 'glass');
  const grainIntensity = pick(settings.grainIntensity, GRAIN_INTENSITY, 'subtle');
  const attentionSelfRelation = pick(settings.attentionSelfRelation, ATTENTION_SELF_RELATION, 'breath');
  const attentionLocalRelation = pick(settings.attentionLocalRelation, ATTENTION_LOCAL_RELATION, 'immediate-field');
  const attentionGlobalRelation = pick(settings.attentionGlobalRelation, ATTENTION_GLOBAL_RELATION, 'horizon-systems');
  const physicsReason = (settings.physicsReason || '').toString().trim().slice(0, 40); // flexible short reason for nav/physics gamification
  const fontSizeScale = toNumber(settings.fontSizeScale, 100);
  const fontScale = FONT_SIZE_PRESET_MULTIPLIER[fontSize] || 1;
  const climate = DEVELOPMENTAL_METADATA[developmentalClimate] || DEVELOPMENTAL_METADATA.orient;

  // Critical visual for early CSS (motif-driven pigment, tokens in core.css).
  // Duplicated tiny logic from shared.js so prepaint stays zero-dep and runs before any other module.
  const pedagogicalFlavor = pick(settings.pedagogicalFlavor, new Set(['culinary', 'garden', 'studio', 'runtime']), 'runtime');
  let componentMotif = 'lab';
  const f = String(pedagogicalFlavor).toLowerCase();
  if (f === 'culinary' || f === 'garden') componentMotif = 'curriculum';
  else if (f === 'studio') componentMotif = 'artifact';

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
  html.dataset.spwBaseMetamaterial = baseMetamaterial;
  html.dataset.spwGrainIntensity = grainIntensity;
  html.dataset.spwAttentionSelfRelation = attentionSelfRelation;
  html.dataset.spwAttentionLocalRelation = attentionLocalRelation;
  html.dataset.spwAttentionGlobalRelation = attentionGlobalRelation;
  if (physicsReason) html.dataset.spwPhysicsReason = physicsReason;
  html.dataset.spwFontSizeScale = String(fontSizeScale);
  html.dataset.spwPedagogicalFlavor = pedagogicalFlavor;
  html.dataset.spwComponentMotif = componentMotif;
  html.dataset.spwActiveMotif = componentMotif;
  html.dataset.spwSettingsPreflight = 'ready';
  html.dataset.spwRuntimeStage = 'preflight';

  // Copy-editor guidance rail: ?tempo= tunes the arrival pacing cluster
  // (signals.css tempo token blocks) from the first frame. Forgiving —
  // unknown values are ignored; the region profiler may refine tempo later.
  try {
    const tempoRail = (new URLSearchParams(window.location.search).get('tempo') || '').trim().toLowerCase();
    if (new Set(['snap', 'fast', 'deliberate', 'settle']).has(tempoRail)) {
      html.dataset.spwPageTempo = tempoRail;
    }
  } catch {
    /* rails are guidance, never load-bearing */
  }

  html.style.colorScheme = colorMode === 'auto' ? 'light dark' : colorMode;
  html.style.setProperty('--font-size-scale', `${fontSizeScale}%`);
  html.style.setProperty('--site-root-font-size', `${Math.round(fontSizeScale * fontScale)}%`);
  html.style.setProperty('--site-line-height', LINE_SPACING_VALUE[lineSpacing] || LINE_SPACING_VALUE.normal);
  html.style.setProperty('--site-mono-font', MONOSPACE_FONT_VALUE[monospaceVariant] || MONOSPACE_FONT_VALUE.jetbrains);
  html.style.setProperty('--site-header-opacity', HEADER_OPACITY_VALUE[headerOpacity] || HEADER_OPACITY_VALUE.normal);

  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('spw:preflight-complete');
  }
})();
