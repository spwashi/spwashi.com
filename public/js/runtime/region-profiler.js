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
  writeDatasetValue(el, 'spwRegionKey', profile.key);
  writeDatasetValue(el, 'spwRegionGenome', profile.genome);
  writeStyleValue(el, '--region-index', String(profile.index));
}

export function syncPageHarmony(ctx, html = document.documentElement) {
  const profiles = ctx.regions.map((entry) => entry.profile);
  const harmonies = new Set(profiles.map((profile) => profile.harmony));
  const tempos = new Set(profiles.map((profile) => profile.tempo));

  writeDatasetValue(html, 'spwHarmonyField', [...harmonies].join(' '));
  writeDatasetValue(html, 'spwTempoField', [...tempos].join(' '));
  writeDatasetValue(html, 'spwSpaceMotion', inferSpaceMotion());
  writeStyleValue(html, '--region-count', String(profiles.length));
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