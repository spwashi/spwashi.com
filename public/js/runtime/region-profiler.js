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
  diversityTiers: Object.freeze(['singular', 'paired', 'varied', 'rich', 'teeming']),
  diversityAttributes: Object.freeze({
    kindField: 'data-spw-region-kind-field',
    kindCount: 'data-spw-region-kind-count',
    diversity: 'data-spw-region-diversity',
    semanticDepth: 'data-spw-region-semantic-depth',
  }),
  portableUse:
    'Import this module when a page needs region harmony, tempo, and density without booting site.js. '
    + 'Read the region-diversity tier (or subscribe to spw:regions-profiled) to reward surfaces that '
    + 'reveal a wider spread of component kinds — the substrate for collection/achievement systems.',
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

// Diversity tiers reward surfaces that reveal a wider spread of component kinds.
// They give downstream collection/achievement systems an ordinal "how varied is
// this surface" signal without those systems re-deriving it from the DOM.
const REGION_DIVERSITY_TIERS = Object.freeze([
  { tier: 'singular', min: 0 },
  { tier: 'paired', min: 2 },
  { tier: 'varied', min: 3 },
  { tier: 'rich', min: 5 },
  { tier: 'teeming', min: 8 },
]);

function resolveDiversityTier(distinctKinds = 0) {
  let resolved = REGION_DIVERSITY_TIERS[0].tier;
  for (const entry of REGION_DIVERSITY_TIERS) {
    if (distinctKinds >= entry.min) resolved = entry.tier;
  }
  return resolved;
}

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

function inferRegionHarmony(el, profile) {
  if (el?.dataset?.spwHarmony) return el.dataset.spwHarmony;
  const { role, kind, context } = profile;
  const edgeGravity = el?.dataset?.spwEdgeGravity;

  if (edgeGravity && edgeGravity !== 'none' && (kind === 'rail' || role === 'control')) return 'responsive';
  if (role === 'routing') return 'indexed';
  if (role === 'schema') return 'structured';
  if (role === 'reference') return 'measured';
  if (role === 'control') return 'responsive';
  if (role === 'orientation') return 'anchored';
  if (context === 'publishing') return 'editorial';
  if (kind === 'card') return 'modular';
  return 'ambient';
}

function inferRegionTempo(el, profile) {
  if (el?.dataset?.spwTempo) return el.dataset.spwTempo;
  const salienceRank = el?.dataset?.spwSalienceRank;
  if (salienceRank === 'hero') return 'deliberate';
  if (salienceRank === 'whisper') return 'snap';

  switch (profile.harmony) {
    case 'indexed': return 'snap';
    case 'structured': return 'deliberate';
    case 'responsive': return 'fast';
    case 'editorial': return 'settle';
    case 'anchored': return 'base';
    default: return 'base';
  }
}

function inferRegionDensity(el, profile) {
  if (el?.dataset?.spwDensity) return el.dataset.spwDensity;
  const measureBand = el?.dataset?.spwMeasureBand;
  const extent = el?.dataset?.spwExtent;

  if (measureBand === 'compact' || extent === 'squat') return 'compact';
  if (measureBand === 'wide' || extent === 'overtall') {
    return profile.role === 'schema' ? 'dense' : 'reading';
  }

  if (profile.kind === 'card') return 'compact';
  if (profile.kind === 'panel') return 'medium';
  if (profile.role === 'reference') return 'reading';
  if (profile.role === 'schema') return 'dense';
  return 'medium';
}

function normalizeAttentionalWeight(value, fallback = '1') {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return String(Math.min(1.6, Math.max(0.65, parsed)));
}

function inferRegionAttentionalWeight(el, profile) {
  if (el?.dataset?.spwAttentionalWeight) return normalizeAttentionalWeight(el.dataset.spwAttentionalWeight);
  const salienceRank = el?.dataset?.spwSalienceRank;
  if (salienceRank === 'hero') return '1.35';
  if (salienceRank === 'prominent') return '1.2';
  if (salienceRank === 'recessive') return '0.85';
  if (salienceRank === 'whisper') return '0.7';

  if (el?.classList?.contains?.('site-hero')) return '1.25';
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

function inferResolvedRegionCompositionStability(el, profile) {
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

function inferRegionPackOccupancy(el, profile) {
  if (el.dataset.spwPackOccupancy) return el.dataset.spwPackOccupancy;

  const slotNodes = Array.from(el.querySelectorAll?.(':scope > [data-spw-slot]') || []);
  const declaredSlots = new Set();
  const filledSlots = new Set();

  if (el.dataset.spwSlot) declaredSlots.add(el.dataset.spwSlot);

  slotNodes.forEach((node) => {
    const slotName = node.dataset.spwSlot;
    if (!slotName) return;
    declaredSlots.add(slotName);
    const hasContent = Boolean(node.textContent?.trim() || node.querySelector?.(':scope > *'));
    if (hasContent) filledSlots.add(slotName);
  });

  const declaredCount = declaredSlots.size;
  const filledCount = filledSlots.size;
  const ratio = declaredCount ? filledCount / declaredCount : 0;

  if (profile.kind === 'hook') return 'balanced';
  if (!declaredCount) return profile.kind === 'card' || profile.kind === 'panel' ? 'compact' : 'sparse';
  if (ratio <= 0.34) return 'sparse';
  if (ratio <= 0.8) return 'balanced';
  return 'full';
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
    ['occupancy', profile.packOccupancy],
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
    compositionStabilitySource: '',
    resolvedCompositionStability: '',
    packOccupancy: '',
    genome: '',
    features: readSet(
      ...parseFeatureList(el.dataset.spwFeatures).values?.() || [],
      kind,
      role,
      context
    ),
  };

  profile.harmony = inferRegionHarmony(el, profile);
  profile.tempo = inferRegionTempo(el, profile);
  profile.density = inferRegionDensity(el, profile);
  profile.attentionalWeight = inferRegionAttentionalWeight(el, profile);
  profile.gradientBoundary = inferRegionGradientBoundary(el, profile);
  profile.resolvedCompositionStability = inferResolvedRegionCompositionStability(el, profile);
  profile.compositionStability = el.dataset.spwCompositionStability
    ? el.dataset.spwCompositionStability
    : profile.resolvedCompositionStability;
  profile.compositionStabilitySource = el.dataset.spwCompositionStability ? 'authored' : '';
  profile.packOccupancy = inferRegionPackOccupancy(el, profile);
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
  if (profile.compositionStabilitySource === 'authored') {
    writeDatasetValueIfMissing(el, 'spwCompositionStability', profile.compositionStability);
    writeDatasetValueIfMissing(el, 'spwCompositionStabilitySource', 'authored');
  }
  writeDatasetValue(el, 'spwResolvedCompositionStability', profile.resolvedCompositionStability);
  writeDatasetValue(el, 'spwResolvedCompositionStabilitySource', 'region-profiler');
  writeDatasetValue(el, 'spwPackOccupancy', profile.packOccupancy);
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

/**
 * Summarize how varied a set of region profiles is. Distinct component kinds
 * drive the collectible "diversity" signal; roles/harmonies/contexts add a
 * coarse semantic-depth measure. Pure — safe to call from tests or standalone.
 */
export function summarizeRegionDiversity(profiles = []) {
  const kinds = new Set();
  const roles = new Set();
  const harmonies = new Set();
  const contexts = new Set();

  for (const profile of profiles) {
    if (!profile) continue;
    if (profile.kind) kinds.add(profile.kind);
    if (profile.role) roles.add(profile.role);
    if (profile.harmony) harmonies.add(profile.harmony);
    if (profile.context) contexts.add(profile.context);
  }

  const diversityIndex = kinds.size;
  return {
    kinds,
    roles,
    harmonies,
    contexts,
    kindCount: kinds.size,
    diversityIndex,
    // Coarse "how much distinct semantic material is on this surface" score.
    semanticDepth: kinds.size + roles.size + harmonies.size + contexts.size,
    tier: resolveDiversityTier(diversityIndex),
    total: profiles.length,
  };
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

  // Single pass to aggregate every harmony field — previously six separate
  // .map()/Set passes over the same profiles on each region lifecycle refresh.
  const harmonies = new Set();
  const tempos = new Set();
  const gradientBoundaries = new Set();
  const stabilities = new Set();
  const resolvedStabilities = new Set();
  const occupancies = new Set();
  for (const profile of profiles) {
    harmonies.add(profile.harmony);
    tempos.add(profile.tempo);
    gradientBoundaries.add(profile.gradientBoundary);
    stabilities.add(profile.compositionStability);
    resolvedStabilities.add(profile.resolvedCompositionStability);
    occupancies.add(profile.packOccupancy);
  }

  const diversity = summarizeRegionDiversity(profiles);

  writeDatasetValue(html, 'spwHarmonyField', harmonies);
  writeDatasetValue(html, 'spwTempoField', tempos);
  writeDatasetValue(html, 'spwGradientBoundaryField', gradientBoundaries);
  writeDatasetValue(html, 'spwCompositionStabilityField', stabilities);
  writeDatasetValue(html, 'spwResolvedCompositionStabilityField', resolvedStabilities);
  writeDatasetValue(html, 'spwPackOccupancyField', occupancies);
  writeDatasetValue(html, 'spwRegionKindField', diversity.kinds);
  writeDatasetValue(html, 'spwRegionKindCount', String(diversity.kindCount));
  writeDatasetValue(html, 'spwRegionDiversity', diversity.tier);
  writeDatasetValue(html, 'spwRegionSemanticDepth', String(diversity.semanticDepth));
  writeDatasetValue(html, 'spwSpaceMotion', inferSpaceMotion());
  writeStyleValue(html, '--region-count', String(profiles.length));
  writeStyleValue(html, '--region-kind-count', String(diversity.kindCount));
  syncPageCascadeTiming(ctx, html);

  return { diversity };
}

function serializeDiversity(diversity) {
  if (!diversity) return null;
  return {
    kinds: [...diversity.kinds],
    roles: [...diversity.roles],
    harmonies: [...diversity.harmonies],
    contexts: [...diversity.contexts],
    kindCount: diversity.kindCount,
    diversityIndex: diversity.diversityIndex,
    semanticDepth: diversity.semanticDepth,
    tier: diversity.tier,
    total: diversity.total,
  };
}

export function refreshRegionProfiles(ctx, reason = 'runtime-refresh', options = {}) {
  ctx.regions.forEach((entry, index) => {
    entry.profile = buildRegionProfile(entry.el, index, options);
    applyRegionProfile(entry.el, entry.profile);
  });
  const { diversity } = syncPageHarmony(ctx, options.html || document.documentElement);
  ctx.bus.emit('spw:regions-profiled', {
    route: ctx.route,
    reason,
    count: ctx.regions.length,
    diversity: serializeDiversity(diversity),
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

  const { diversity } = syncPageHarmony(ctx, options.html || document.documentElement);

  ctx.bus.emit('spw:regions-primed', {
    route: ctx.route,
    count: ctx.regions.length,
    diversity: serializeDiversity(diversity),
    profiles: ctx.regions.map((entry) => entry.profile),
  });
}
