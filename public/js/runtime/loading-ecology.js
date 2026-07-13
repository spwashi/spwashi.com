/**
 * loading-ecology.js
 * ---------------------------------------------------------------------------
 * Ecological narration for component loading: prefetch, measurement, mounting,
 * settling, personalization, localization, variant selection, theming,
 * salience direction, rhythm alignment, trope precipitation, and genre development.
 *
 * Writes root data attributes and bus events only — presentation stays in CSS.
 */

import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';
import { projectFeatureRouteContext } from '/public/js/kernel/feature-route-context.js';
import { markLayoutTrope } from '/public/js/kernel/instrumentation.js';
import { runtimeToken as normalizeToken } from '/public/js/kernel/text-normalization.js';
import { PAGE_ARRIVAL, PAGE_PRESENCE } from '/public/js/runtime/page-state.js';

export const ECOLOGY_PHASES = Object.freeze({
  DISCOVERING: 'discovering',
  PREFETCHING: 'prefetching',
  MEASURING: 'measuring',
  MOUNTING: 'mounting',
  SETTLING: 'settling',
  PERSONALIZING: 'personalizing',
  SETTLED: 'settled',
});

export const SALIENCE_DIRECTIONS = Object.freeze({
  FORWARD: 'forward',
  RETURN: 'return',
  RESTORE: 'restore',
  ANCHOR: 'anchor',
  DORMANCY: 'dormancy',
});

/** Shared dimension strings — keep aligned with tokens/dimensions.css + dimension-vocabulary.spw */
export const DIMENSION_VOCABULARY = Object.freeze({
  spatial: Object.freeze({
    packingTiers: Object.freeze(['compact', 'balanced', 'roomy']),
    packingAliases: Object.freeze({
      dense: 'compact',
      soft: 'roomy',
      spacious: 'roomy',
    }),
    occupancy: Object.freeze(['sparse', 'balanced', 'full']),
  }),
  temporal: Object.freeze({
    ecologyPhases: Object.freeze(Object.values(ECOLOGY_PHASES)),
    positioningPhases: Object.freeze(['approach', 'recall', 'restore', 'anchor', 'dormancy']),
    lifecycle: Object.freeze(['pre', 'loading', 'ready', 'empty', 'default', 'error']),
  }),
  color: Object.freeze({
    layers: Object.freeze(['fill', 'fill-muted', 'ink', 'ink-muted', 'line', 'accent-subtle', 'accent-apparent']),
    preStateVisibility: Object.freeze(['subtle', 'balanced', 'apparent']),
  }),
  ecologyDimensions: Object.freeze([
    'fetch',
    'measure',
    'align',
    'settle',
    'personalize',
    'localize',
    'variant',
    'theme',
    'packing',
  ]),
});

export const SPW_LOADING_ECOLOGY_CONTRACT = Object.freeze({
  phases: ECOLOGY_PHASES,
  salienceDirections: SALIENCE_DIRECTIONS,
  events: Object.freeze({
    updated: 'spw:loading-ecology',
    tropePrecipitated: 'spw:loading-ecology-trope',
  }),
  attributes: Object.freeze({
    phase: 'data-spw-loading-ecology-phase',
    salience: 'data-spw-loading-ecology-salience',
    rhythm: 'data-spw-loading-ecology-rhythm',
    twinkle: 'data-spw-loading-ecology-twinkle',
    trope: 'data-spw-loading-ecology-trope',
    genre: 'data-spw-loading-ecology-genre',
    dimensions: 'data-spw-loading-ecology-dimensions',
    measureKind: 'data-spw-loading-ecology-measure-kind',
  }),
  portableUse:
    'Mount early on html. Subscribe to page attention, resource profiling, measurement, '
    + 'region diversity, and module mount events to narrate loading as an ecological field.',
});

/** Match --spw-ecology-twinkle-duration / --spw-ecology-phase-pulse-duration tokens. */
const TWINKLE_MS = 760;
const PHASE_PULSE_MS = 360;

let initialized = false;
let cleanupFns = [];
let twinkleTimer = 0;
let phasePulseTimer = 0;

const ecology = {
  prefetched: false,
  measured: false,
  measuredSubjective: false,
  modulesMounted: 0,
  diversityTier: '',
  diversityKinds: 0,
  lastTrope: '',
  lastGenre: '',
  // Alignment memory: the layout-shift audit classifies each counted reflow as
  // purposeful (a component arriving into place) or incidental drift. We keep
  // the last classification so the ecology can narrate settling honestly.
  aligned: false,
  incidentalReflow: false,
  lastReflowClass: '',
};

function readSalienceDirection(html) {
  const presence = html.dataset.spwPagePresence || PAGE_PRESENCE.FOREGROUND;
  const arrival = html.dataset.spwPageArrival || PAGE_ARRIVAL.SETTLED;
  const sectionDirection = html.dataset.spwPageSectionDirection || '';

  if (presence === PAGE_PRESENCE.BACKGROUND) return SALIENCE_DIRECTIONS.DORMANCY;
  if (sectionDirection === 'back') return SALIENCE_DIRECTIONS.RETURN;
  if (sectionDirection === 'forward') return SALIENCE_DIRECTIONS.FORWARD;
  if (arrival === PAGE_ARRIVAL.RETURNING) return SALIENCE_DIRECTIONS.RETURN;
  if (arrival === PAGE_ARRIVAL.RESTORED) return SALIENCE_DIRECTIONS.RESTORE;
  if (arrival === PAGE_ARRIVAL.SETTLED) return SALIENCE_DIRECTIONS.ANCHOR;
  return SALIENCE_DIRECTIONS.FORWARD;
}

function readRhythmProfile(html) {
  return normalizeToken(html.dataset.spwPageTempo || html.dataset.spwTempoField?.split?.(/\s+/)?.[0] || 'base') || 'base';
}

function readPersonalizationActive(html) {
  const deviationState = html.dataset.spwDeviationState || 'default';
  const colorMode = html.dataset.spwColorMode || 'system';
  const palette = html.dataset.spwPaletteResonance || 'route';
  const density = html.dataset.spwSemanticDensity || 'normal';
  const climate = html.dataset.spwDevelopmentalClimate || 'neutral';

  return deviationState === 'deviated'
    || (colorMode && colorMode !== 'system')
    || (palette && palette !== 'route')
    || (density && density !== 'normal')
    || (climate && climate !== 'neutral');
}

function readLocalizationActive(html) {
  const lang = (document.documentElement.lang || 'en').toLowerCase();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  return lang !== 'en' || Boolean(timezone && !timezone.startsWith('America/'));
}

function normalizePackingTier(value = '') {
  const token = normalizeToken(value);
  if (!token) return '';
  return DIMENSION_VOCABULARY.spatial.packingAliases[token] || token;
}

function readPackingActive(html) {
  const packing = normalizePackingTier(
    html.dataset.spwDesignEcologyPacking
    || html.dataset.spwPackingState
    || '',
  );
  return packing && packing !== 'balanced';
}

function readVariantActive(body) {
  return Boolean(
    body?.dataset?.spwSemanticVariant
    || body?.dataset?.spwPageModes
    || body?.querySelector?.('[data-spw-semantic-variant], [data-spw-content-variant], [data-spw-genre]'),
  );
}

function readThemingActive(html) {
  return Boolean(
    (html.dataset.spwColorMode && html.dataset.spwColorMode !== 'system')
    || (html.dataset.spwPaletteResonance && html.dataset.spwPaletteResonance !== 'route')
    || html.dataset.spwThemePack,
  );
}

function collectDimensions(html, body) {
  const dimensions = [];
  if (ecology.prefetched) dimensions.push('fetch');
  if (ecology.measured) dimensions.push('measure');
  if (ecology.aligned) dimensions.push('align');
  if (html.dataset.spwPageSettling === 'true' || html.dataset.spwLoadingEcologyPhase === ECOLOGY_PHASES.SETTLING) {
    dimensions.push('settle');
  }
  if (readPersonalizationActive(html)) dimensions.push('personalize');
  if (readLocalizationActive(html)) dimensions.push('localize');
  if (readVariantActive(body)) dimensions.push('variant');
  if (readThemingActive(html)) dimensions.push('theme');
  if (readPackingActive(html)) dimensions.push('packing');
  return dimensions;
}

function inferEcologyGenre(html, body) {
  const explicit = normalizeToken(body?.dataset?.spwGenre || html.dataset.spwGenre || '');
  const pageFamily = normalizeToken(body?.dataset?.spwPageFamily || '');
  const climate = normalizeToken(html.dataset.spwDevelopmentalClimate || 'neutral');
  const palette = normalizeToken(html.dataset.spwPaletteResonance || 'route');
  const tier = normalizeToken(ecology.diversityTier || html.dataset.spwRegionDiversity || 'singular');
  const root = explicit || pageFamily || climate;
  return `${root}-${palette}-${tier}`;
}

function inferPrecipitatedTrope(html) {
  const deviationCount = Number.parseInt(html.dataset.spwDeviationCount || '0', 10) || 0;
  if (deviationCount > 0 || readPersonalizationActive(html)) return 'ruleset-settle';
  if (readThemingActive(html)) return 'theme-shift';
  if (ecology.incidentalReflow) return 'alignment-drift';
  if (ecology.aligned && ecology.measured) return 'alignment-settle';
  if (ecology.measured) return 'typography-flow';
  if (ecology.diversityTier === 'rich' || ecology.diversityTier === 'teeming') return 'gestalt-rebalance';
  if (ecology.prefetched) return 'spacing-tune';
  return 'ruleset-settle';
}

function resolveDominantPhase(html) {
  if (html.dataset.spwPageSettling === 'true') {
    return readPersonalizationActive(html)
      ? ECOLOGY_PHASES.PERSONALIZING
      : ECOLOGY_PHASES.SETTLING;
  }
  if (html.dataset.spwPageArrival === PAGE_ARRIVAL.SETTLED && ecology.modulesMounted > 0) {
    return ECOLOGY_PHASES.SETTLED;
  }
  if (ecology.modulesMounted > 0 && html.dataset.spwPageArrival !== PAGE_ARRIVAL.SETTLED) {
    return ECOLOGY_PHASES.MOUNTING;
  }
  if (ecology.measured) return ECOLOGY_PHASES.MEASURING;
  if (ecology.prefetched) return ECOLOGY_PHASES.PREFETCHING;
  if (html.dataset.spwPageArrival && html.dataset.spwPageArrival !== PAGE_ARRIVAL.SETTLED) {
    return ECOLOGY_PHASES.DISCOVERING;
  }
  return ECOLOGY_PHASES.SETTLED;
}

function shouldTwinkle(html) {
  if (html.dataset.spwReduceMotion === 'on') return false;
  const settling = html.dataset.spwPageSettling === 'true';
  const step = String(html.dataset.spwPageArrivalStep || '0');
  const regionSettling = document.querySelector('[data-spw-region-state="settling"]');
  return settling && (step === '2' || step === '3' || Boolean(regionSettling));
}

function pulseTwinkle(html) {
  if (!shouldTwinkle(html)) {
    writeDatasetValue(html, 'spwLoadingEcologyTwinkle', null);
    return;
  }

  writeDatasetValue(html, 'spwLoadingEcologyTwinkle', 'true');
  if (twinkleTimer) window.clearTimeout(twinkleTimer);
  twinkleTimer = window.setTimeout(() => {
    if (html.dataset.spwLoadingEcologyTwinkle === 'true') {
      delete html.dataset.spwLoadingEcologyTwinkle;
    }
  }, TWINKLE_MS);
}

function precipitateTrope(html, ctx) {
  const trope = inferPrecipitatedTrope(html);
  if (!trope || trope === ecology.lastTrope) return trope;

  ecology.lastTrope = trope;
  writeDatasetValue(html, 'spwLoadingEcologyTrope', trope);
  markLayoutTrope(html, trope, {
    scope: 'loading-ecology',
    source: 'loading-ecology',
    reason: 'settle-complete',
  });

  const payload = {
    route: ctx?.route || document.body?.dataset?.spwSurface || 'default',
    trope,
    genre: ecology.lastGenre,
    dimensions: collectDimensions(html, document.body),
  };

  if (ctx?.bus?.emit) {
    ctx.bus.emit(SPW_LOADING_ECOLOGY_CONTRACT.events.tropePrecipitated, payload);
  } else {
    document.dispatchEvent(new CustomEvent(SPW_LOADING_ECOLOGY_CONTRACT.events.tropePrecipitated, { detail: payload }));
  }

  return trope;
}

function syncEcology(ctx, reason = 'runtime') {
  const html = document.documentElement;
  const body = document.body;
  if (!html) return null;

  projectFeatureRouteContext(html, {
    source: 'loading-ecology',
    reason,
  });

  const phase = resolveDominantPhase(html);
  const salience = readSalienceDirection(html);
  const rhythm = readRhythmProfile(html);
  const genre = inferEcologyGenre(html, body);
  const dimensions = collectDimensions(html, body);
  const measureKind = ecology.measuredSubjective ? 'subjective' : ecology.measured ? 'objective' : null;

  writeDatasetValue(html, 'spwLoadingEcologyPhase', phase);
  writeDatasetValue(html, 'spwLoadingEcologySalience', salience);
  writeDatasetValue(html, 'spwLoadingEcologyRhythm', rhythm);
  writeDatasetValue(html, 'spwLoadingEcologyGenre', genre !== ecology.lastGenre ? genre : html.dataset.spwLoadingEcologyGenre || genre);
  writeDatasetValue(html, 'spwLoadingEcologyDimensions', dimensions.length ? dimensions.join(' ') : null);
  writeDatasetValue(html, 'spwLoadingEcologyMeasureKind', measureKind);

  ecology.lastGenre = genre;
  pulseTwinkle(html);

  if (phase === ECOLOGY_PHASES.SETTLED && html.dataset.spwPageArrival === PAGE_ARRIVAL.SETTLED) {
    precipitateTrope(html, ctx);
  }

  const payload = {
    route: ctx?.route || body?.dataset?.spwSurface || 'default',
    reason,
    phase,
    salience,
    rhythm,
    genre,
    dimensions,
    measureKind,
    prefetched: ecology.prefetched,
    measured: ecology.measured,
    modulesMounted: ecology.modulesMounted,
    diversityTier: ecology.diversityTier,
  };

  if (ctx?.bus?.emit) {
    ctx.bus.emit(SPW_LOADING_ECOLOGY_CONTRACT.events.updated, payload);
  } else {
    document.dispatchEvent(new CustomEvent(SPW_LOADING_ECOLOGY_CONTRACT.events.updated, { detail: payload }));
  }

  return payload;
}

function pulsePhase(html, phase) {
  writeDatasetValue(html, 'spwLoadingEcologyPhase', phase);
  if (phasePulseTimer) window.clearTimeout(phasePulseTimer);
  phasePulseTimer = window.setTimeout(() => {
    syncEcology(null, 'phase-pulse-complete');
  }, PHASE_PULSE_MS);
}

function onPageAttention(detail = {}, ctx) {
  const html = document.documentElement;
  if (detail.arrival === PAGE_ARRIVAL.SETTLED && detail.presence === PAGE_PRESENCE.FOREGROUND) {
    syncEcology(ctx, detail.reason || 'page-settled');
    return;
  }
  syncEcology(ctx, detail.reason || 'page-attention');
  if (html?.dataset?.spwPageSettling === 'true') {
    pulseTwinkle(html);
  }
}

function onResourcesProfiled(detail = {}, ctx) {
  const warmed = Array.isArray(detail.resources) ? detail.resources : [];
  ecology.prefetched = warmed.some((entry) => entry.status === 'prefetched' || entry.status === 'cached');
  const html = document.documentElement;
  pulsePhase(html, ECOLOGY_PHASES.PREFETCHING);
  syncEcology(ctx, detail.expectedWhen || 'resources-profiled');
}

function onPretextMeasurement(detail = {}, ctx) {
  ecology.measured = true;
  ecology.measuredSubjective = detail.measureKind === 'subjective';
  const html = document.documentElement;
  pulsePhase(html, ECOLOGY_PHASES.MEASURING);
  syncEcology(ctx, 'pretext-measurement');
}

function onRegionsProfiled(detail = {}, ctx) {
  ecology.measured = true;
  ecology.diversityTier = detail.diversity?.tier || '';
  ecology.diversityKinds = detail.diversity?.kindCount || 0;
  const html = document.documentElement;
  pulsePhase(html, ECOLOGY_PHASES.MEASURING);
  syncEcology(ctx, detail.reason || 'regions-profiled');
}

function onModuleMounted(detail = {}, ctx) {
  ecology.modulesMounted += 1;
  const html = document.documentElement;
  pulsePhase(html, ECOLOGY_PHASES.MOUNTING);
  syncEcology(ctx, detail.baseId || detail.id || 'module-mounted');
}

function onLayoutShift(detail = {}, ctx) {
  const reflowClass = detail.reflowClass || '';
  if (!reflowClass || reflowClass === 'stable' || reflowClass === 'input') return;
  ecology.lastReflowClass = reflowClass;
  if (reflowClass === 'mount') {
    ecology.aligned = true;
  } else if (reflowClass === 'incidental' && (detail.batchValue || 0) > 0) {
    ecology.incidentalReflow = true;
  }
  syncEcology(ctx, 'layout-shift');
}

function onRuntimeConnection(detail = {}, ctx) {
  syncEcology(ctx, 'runtime-connection');
}

function onSettingsUpdated(ctx) {
  syncEcology(ctx, 'settings-updated');
}

export function initLoadingEcology(ctx) {
  if (initialized) return () => {};
  initialized = true;

  syncEcology(ctx, 'init');

  if (ctx?.bus?.on) {
    cleanupFns.push(
      ctx.bus.on('spw:page-attention-state', (detail) => onPageAttention(detail, ctx)),
      ctx.bus.on('spw:page-transition-state', (detail) => onPageAttention(detail, ctx)),
      ctx.bus.on('spw:runtime-resources-profiled', (detail) => onResourcesProfiled(detail, ctx)),
      ctx.bus.on('spw:runtime-connection', (detail) => onRuntimeConnection(detail, ctx)),
      ctx.bus.on('spw:regions-profiled', (detail) => onRegionsProfiled(detail, ctx)),
      ctx.bus.on('spw:module-mounted', (detail) => onModuleMounted(detail, ctx)),
      ctx.bus.on('spw:layout-shift', (detail) => onLayoutShift(detail, ctx)),
    );
  }

  const handlePretextMeasurement = (event) => {
    onPretextMeasurement(event?.detail || {}, ctx);
  };
  const handleSettingsChange = () => {
    onSettingsUpdated(ctx);
  };
  document.addEventListener('spw:pretext-measurement', handlePretextMeasurement, { passive: true });
  document.addEventListener('spw:settings-change', handleSettingsChange, { passive: true });
  document.addEventListener('spw:settings:changed', handleSettingsChange, { passive: true });
  cleanupFns.push(() => {
    document.removeEventListener('spw:pretext-measurement', handlePretextMeasurement);
    document.removeEventListener('spw:settings-change', handleSettingsChange);
    document.removeEventListener('spw:settings:changed', handleSettingsChange);
  });

  return () => {
    cleanupFns.forEach((fn) => {
      try {
        fn?.();
      } catch {
        /* ignore */
      }
    });
    cleanupFns = [];
    if (twinkleTimer) window.clearTimeout(twinkleTimer);
    if (phasePulseTimer) window.clearTimeout(phasePulseTimer);
    twinkleTimer = 0;
    phasePulseTimer = 0;
    ecology.prefetched = false;
    ecology.measured = false;
    ecology.measuredSubjective = false;
    ecology.modulesMounted = 0;
    ecology.diversityTier = '';
    ecology.diversityKinds = 0;
    ecology.lastTrope = '';
    ecology.lastGenre = '';
    ecology.aligned = false;
    ecology.incidentalReflow = false;
    ecology.lastReflowClass = '';
    const html = document.documentElement;
    if (html?.dataset) {
      delete html.dataset.spwLoadingEcologyPhase;
      delete html.dataset.spwLoadingEcologySalience;
      delete html.dataset.spwLoadingEcologyRhythm;
      delete html.dataset.spwLoadingEcologyTwinkle;
      delete html.dataset.spwLoadingEcologyTrope;
      delete html.dataset.spwLoadingEcologyGenre;
      delete html.dataset.spwLoadingEcologyDimensions;
      delete html.dataset.spwLoadingEcologyMeasureKind;
    }
    initialized = false;
  };
}