/**
 * Region profiling and harmony projection for the staged site runtime.
 */

import {
  buildAxisGenome,
  writeDatasetValue,
  writeDatasetValueIfMissing,
  writeStyleValue,
} from '../kernel/dom-contracts.js';
import {
  collectRegions,
  inferRegionContext,
  inferRegionKind,
  inferRegionRole,
} from '../semantic/role-inference.js';
import { parseFeatureList } from './runtime-helpers.js';

export const REGION_STATES = Object.freeze({
  QUEUED: 'queued',
  PRIMED: 'primed',
  HYDRATING: 'hydrating',
  INTERACTIVE: 'interactive',
  ENHANCED: 'enhanced',
  SETTLING: 'settling',
});

export const SPW_REGION_PROFILER_CONTRACT = Object.freeze({
  states: REGION_STATES,
  portableUse:
    'Import this module when a page needs region harmony, tempo, and density without booting site.js.',
});

const TEMPO_CASCADE_PROFILES = Object.freeze({
  snap: {
    step2: 36,
    step3: 84,
    arrival: 200,
    returning: 140,
    stagger: 10,
    regionRefresh: 160,
  },
  fast: {
    step2: 48,
    step3: 108,
    arrival: 220,
    returning: 160,
    stagger: 12,
    regionRefresh: 180,
  },
  base: {
    step2: 64,
    step3: 148,
    arrival: 280,
    returning: 180,
    stagger: 18,
    regionRefresh: 220,
  },
  deliberate: {
    step2: 88,
    step3: 196,
    arrival: 340,
    returning: 220,
    stagger: 24,
    regionRefresh: 280,
  },
  settle: {
    step2: 104,
    step3: 232,
    arrival: 400,
    returning: 260,
    stagger: 28,
    regionRefresh: 320,
  },
});

const TEMPO_DOMINANCE_ORDER = Object.freeze(['settle', 'deliberate', 'base', 'fast', 'snap']);

const CASCADE_TIMING_STYLE_KEYS = Object.freeze([
  '--spw-page-arrival-step-2-delay',
  '--spw-page-arrival-step-3-delay',
  '--spw-page-arrival-duration',
  '--spw-page-return-duration',
  '--spw-settle-stagger-step',
  '--spw-region-profile-refresh-duration',
]);

function readSet(...values) {
  return new Set(values.filter(Boolean));
}

export function setRegionState(el, state) {
  if (!el || !(el instanceof HTMLElement)) return;
  writeDatasetValue(el, 'spwRegionState', state);
}

function inferRegionHarmony(profile) {
  const { role, kind, context } = profile;

  if (role === 'routing') return 'indexed';
  if (role === 'schema') return 'structured';
  if (role === 'reference') return 'measured';
  if (role === 'control') return 'responsive';
  if (role === 'orientation') return 'anchored';
  if (context === 'publishing') return 'editorial';
  if (kind === 'card') return 'modular';
  return 'ambient';
}

function inferRegionTempo(profile) {
  switch (profile.harmony) {
    case 'indexed': return 'snap';
    case 'structured': return 'deliberate';
    case 'responsive': return 'fast';
    case 'editorial': return 'settle';
    case 'anchored': return 'base';
    default: return 'base';
  }
}

function inferRegionDensity(profile) {
  if (profile.kind === 'card') return 'compact';
  if (profile.kind === 'panel') return 'medium';
  if (profile.role === 'reference') return 'reading';
  if (profile.role === 'schema') return 'dense';
  return 'medium';
}

function inferRegionAttentionalWeight(el, profile) {
  if (el.dataset.spwAttentionalWeight) return el.dataset.spwAttentionalWeight;
  if (el.classList.contains('site-hero')) return '1.25';
  if (profile.kind === 'hook') return '1.2';
  if (profile.role === 'schema' || profile.role === 'routing') return '1.15';
  if (profile.role === 'orientation') return '1.1';
  if (profile.kind === 'card' || profile.kind === 'panel') return '0.95';
  return '1';
}

function inferRegionGradientBoundary(el, profile) {
  if (el.dataset.spwGradientBoundary) return el.dataset.spwGradientBoundary;
  if (el.classList.contains('site-hero') || profile.kind === 'hook') return 'hard';
  if (profile.role === 'routing' || profile.role === 'schema') return 'soft';
  if (profile.kind === 'card' || profile.kind === 'panel') return 'none';
  return 'soft';
}

function inferRegionCompositionStability(el, profile) {
  if (el.dataset.spwCompositionStability) return el.dataset.spwCompositionStability;

  const hasTopDownAnchor = Boolean(profile.kind && profile.role && profile.context && profile.surface);
  const hasBottomUpAnchor = Boolean(
    el.dataset.spwFeature
    || el.dataset.spwSlot
    || el.querySelector?.(':scope > [data-spw-slot], :scope [data-spw-feature]')
  );
  const hasTraversalAnchor = Boolean(
    el.id
    || el.dataset.spwRelatedRoutes
    || el.querySelector?.(':scope a[href], :scope [data-spw-related-routes]')
  );

  if (profile.kind === 'hook') return 'volatile';
  if (hasTopDownAnchor && hasBottomUpAnchor && hasTraversalAnchor) return 'anchored';
  if (hasTopDownAnchor && hasBottomUpAnchor) return 'stable';
  if (hasTopDownAnchor) return 'implicit';
  return 'loose';
}

export function inferSpaceMotion() {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  if (width && width < 520) return 'fold';
  if (width && width < 840) return 'condense';
  if (width && width > 1320) return 'expand';
  return 'balance';
}

function buildRegionGenome(profile = {}) {
  return buildAxisGenome([
    ['kind', profile.kind],
    ['role', profile.role],
    ['context', profile.context],
    ['surface', profile.surface],
    ['harmony', profile.harmony],
    ['tempo', profile.tempo],
    ['density', profile.density],
    ['weight', profile.attentionalWeight],
    ['boundary', profile.gradientBoundary],
    ['stability', profile.compositionStability],
  ]);
}

export function buildRegionProfile(el, index = 0, options = {}) {
  const body = options.body || document.body;
  const siteSurface = options.siteSurface || body?.dataset?.spwSurface || 'default';
  const kind = inferRegionKind(el);
  const role = inferRegionRole(el);
  const context = inferRegionContext(el, body);
  const surface = (
    el.dataset.spwSurface
    || el.closest('[data-spw-surface]')?.dataset?.spwSurface
    || siteSurface
  );

  const profile = {
    index,
    id: el.id || null,
    key: el.id || el.dataset.spwId || `${kind}-${index}`,
    kind,
    role,
    context,
    surface,
    harmony: '',
    tempo: '',
    density: '',
    attentionalWeight: '',
    gradientBoundary: '',
    compositionStability: '',
    genome: '',
    features: readSet(
      ...parseFeatureList(el.dataset.spwFeatures).values?.() || [],
      kind,
      role,
      context
    ),
  };

  profile.harmony = inferRegionHarmony(profile);
  profile.tempo = inferRegionTempo(profile);
  profile.density = inferRegionDensity(profile);
  profile.attentionalWeight = inferRegionAttentionalWeight(el, profile);
  profile.gradientBoundary = inferRegionGradientBoundary(el, profile);
  profile.compositionStability = inferRegionCompositionStability(el, profile);
  profile.genome = buildRegionGenome(profile);

  return profile;
}

export function applyRegionProfile(el, profile) {
  writeDatasetValueIfMissing(el, 'spwKind', profile.kind);
  writeDatasetValueIfMissing(el, 'spwRole', profile.role);
  writeDatasetValueIfMissing(el, 'spwContext', profile.context);
  writeDatasetValueIfMissing(el, 'spwSurface', profile.surface);

  writeDatasetValue(el, 'spwHarmony', profile.harmony);
  writeDatasetValue(el, 'spwTempo', profile.tempo);
  writeDatasetValue(el, 'spwDensity', profile.density);
  writeDatasetValueIfMissing(el, 'spwAttentionalWeight', profile.attentionalWeight);
  writeDatasetValueIfMissing(el, 'spwGradientBoundary', profile.gradientBoundary);
  writeDatasetValue(el, 'spwCompositionStability', profile.compositionStability);
  writeDatasetValue(el, 'spwRegionKey', profile.key);
  writeDatasetValue(el, 'spwRegionGenome', profile.genome);
  writeStyleValue(el, '--region-index', String(profile.index));
  writeStyleValue(el, '--spw-attentional-weight', profile.attentionalWeight);
}

export function resolveDominantTempo(tempos = []) {
  const set = tempos instanceof Set ? tempos : new Set(tempos.filter(Boolean));
  for (const tempo of TEMPO_DOMINANCE_ORDER) {
    if (set.has(tempo)) return tempo;
  }
  return 'base';
}

export function syncPageCascadeTiming(ctx, html = document.documentElement) {
  const profiles = ctx?.regions?.map((entry) => entry.profile) || [];
  const dominantTempo = resolveDominantTempo(profiles.map((profile) => profile.tempo));
  const scale = TEMPO_CASCADE_PROFILES[dominantTempo] || TEMPO_CASCADE_PROFILES.base;

  writeDatasetValue(html, 'spwPageTempo', dominantTempo);
  writeStyleValue(html, '--spw-page-arrival-step-2-delay', `${scale.step2}ms`);
  writeStyleValue(html, '--spw-page-arrival-step-3-delay', `${scale.step3}ms`);
  writeStyleValue(html, '--spw-page-arrival-duration', `${scale.arrival}ms`);
  writeStyleValue(html, '--spw-page-return-duration', `${scale.returning}ms`);
  writeStyleValue(html, '--spw-settle-stagger-step', `${scale.stagger}ms`);
  writeStyleValue(html, '--spw-region-profile-refresh-duration', `${scale.regionRefresh}ms`);

  return {
    dominantTempo,
    scale,
    regionCount: profiles.length,
  };
}

export function clearPageCascadeTiming(html = document.documentElement) {
  if (!(html instanceof HTMLElement)) return;
  delete html.dataset.spwPageTempo;
  for (const key of CASCADE_TIMING_STYLE_KEYS) {
    html.style.removeProperty(key);
  }
}

export function syncPageHarmony(ctx, html = document.documentElement) {
  const profiles = ctx.regions.map((entry) => entry.profile);
  const harmonies = new Set(profiles.map((profile) => profile.harmony));
  const tempos = new Set(profiles.map((profile) => profile.tempo));
  const gradientBoundaries = new Set(profiles.map((profile) => profile.gradientBoundary));
  const stabilities = new Set(profiles.map((profile) => profile.compositionStability));

  writeDatasetValue(html, 'spwHarmonyField', harmonies);
  writeDatasetValue(html, 'spwTempoField', tempos);
  writeDatasetValue(html, 'spwGradientBoundaryField', gradientBoundaries);
  writeDatasetValue(html, 'spwCompositionStabilityField', stabilities);
  writeDatasetValue(html, 'spwSpaceMotion', inferSpaceMotion());
  writeStyleValue(html, '--region-count', String(profiles.length));
  syncPageCascadeTiming(ctx, html);
}

export function refreshRegionProfiles(ctx, reason = 'runtime-refresh', options = {}) {
  ctx.regions.forEach((entry, index) => {
    entry.profile = buildRegionProfile(entry.el, index, options);
    applyRegionProfile(entry.el, entry.profile);
  });
  syncPageHarmony(ctx, options.html || document.documentElement);
  ctx.bus.emit('spw:regions-profiled', {
    route: ctx.route,
    reason,
    count: ctx.regions.length,
    profiles: ctx.regions.map((entry) => entry.profile),
  });
}

export function primeRegions(ctx, options = {}) {
  const elements = collectRegions(document);
  ctx.regions = elements.map((el, index) => {
    const profile = buildRegionProfile(el, index, options);
    applyRegionProfile(el, profile);
    setRegionState(el, REGION_STATES.QUEUED);
    return {
      el,
      profile,
      visible: false,
      enhanced: false,
      active: false,
    };
  });

  syncPageHarmony(ctx, options.html || document.documentElement);

  ctx.bus.emit('spw:regions-primed', {
    route: ctx.route,
    count: ctx.regions.length,
    profiles: ctx.regions.map((entry) => entry.profile),
  });
}
