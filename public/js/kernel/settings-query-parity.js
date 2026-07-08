/**
 * settings-query-parity.js
 * ---------------------------------------------------------------------------
 * Bidirectional parity between canonical site settings and modular query strings.
 */

import { queryKey } from '/public/js/kernel/text-normalization.js';
import { DEFAULT_SITE_SETTINGS } from './site-settings-profiles.js';
import {
  composeSpwQuery,
  expandQueryKey,
  expandQueryParams,
  parseModularQuery,
  serializeSpwQuery,
  SPW_QUERY_LEGACY_ALIASES,
} from './query-composer.js';

/** Setting name → readable query param names (first entry is canonical for serialize). */
export const SETTINGS_TO_QUERY = Object.freeze({
  layoutTuner: ['layout'],
  explorePosture: ['explore-posture', 'posture', 'explore'],
  componentDensity: ['component-density', 'density'],
  spacingTuner: ['spacing'],
  paletteResonance: ['palette'],
  semanticDensity: ['semantic-density'],
  enhancementLevel: ['enhancement'],
  metacognitiveStance: ['stance', 'posture-stance'],
  interactionTuner: ['interaction'],
  colorMode: ['color-mode', 'color'],
  themePack: ['theme', 'theme-pack'],
  pack: ['pack'],
  componentVariant: ['variant'],
});

const QUERY_TO_SETTING = Object.freeze(
  Object.fromEntries(
    Object.entries(SETTINGS_TO_QUERY).flatMap(([setting, aliases]) =>
      aliases.map((alias) => [alias, setting])),
  ),
);

export const PARITY_QUERY_KEYS = Object.freeze(
  new Set([
    ...Object.keys(SPW_QUERY_LEGACY_ALIASES),
    ...Object.values(SPW_QUERY_LEGACY_ALIASES),
    ...Object.keys(QUERY_TO_SETTING),
  ]),
);

export function expandSettingsQueryParams(params = {}) {
  return expandQueryParams(params);
}

const DENSITY_TO_PACK = Object.freeze({
  dense: 'compact',
  soft: 'balanced',
  roomy: 'roomy',
});

const PACK_TO_DENSITY = Object.freeze({
  compact: 'dense',
  dense: 'dense',
  balanced: 'soft',
  roomy: 'roomy',
  spacious: 'roomy',
});

const LAYOUT_TUNER_TO_LAYOUT = Object.freeze({
  reading: 'reading',
  newspaper: 'wide',
  wide: 'wide',
  atlas: 'atlas',
});

function isDefaultSetting(name, value) {
  return DEFAULT_SITE_SETTINGS[name] === value;
}

export function resolveLayoutFromTuner(layoutTuner = 'reading') {
  return LAYOUT_TUNER_TO_LAYOUT[layoutTuner] || 'reading';
}

export function resolvePackingFromDensity(componentDensity = 'soft', spacingTuner = 'balanced') {
  const densityPack = DENSITY_TO_PACK[componentDensity];
  if (densityPack) return densityPack;
  return spacingTuner === 'compact' ? 'compact' : spacingTuner === 'roomy' ? 'roomy' : 'balanced';
}

export function queryParamsToSettingsPartial(params = {}) {
  const expanded = expandSettingsQueryParams(expandQueryParams(params));
  const partial = {};

  Object.entries(expanded).forEach(([key, value]) => {
    const setting = QUERY_TO_SETTING[key] || QUERY_TO_SETTING[queryKey(key)];
    if (!setting || setting === 'pack') return;
    partial[setting] = value;
  });

  if (expanded.pack) {
    const density = PACK_TO_DENSITY[queryKey(expanded.pack)];
    if (density) partial.componentDensity = density;
    if (!partial.spacingTuner) {
      partial.spacingTuner = queryKey(expanded.pack) === 'compact'
        ? 'compact'
        : queryKey(expanded.pack) === 'roomy' ? 'roomy' : 'balanced';
    }
  }

  if (expanded.layout && !partial.layoutTuner) {
    partial.layoutTuner = expanded.layout;
  }

  const explorePosture = expanded['explore-posture'] || expanded.posture;
  if (explorePosture && !partial.explorePosture) {
    partial.explorePosture = explorePosture;
  }

  const componentDensity = expanded['component-density'] || expanded.density;
  if (componentDensity && !partial.componentDensity) {
    partial.componentDensity = componentDensity;
  }

  return partial;
}

export function settingsToQueryParams(settings = {}, { omitDefaults = true } = {}) {
  const params = {};

  Object.entries(SETTINGS_TO_QUERY).forEach(([setting, aliases]) => {
    if (setting === 'pack' || setting === 'componentVariant') return;
    const value = settings[setting];
    if (value === undefined || value === null || value === '') return;
    if (omitDefaults && isDefaultSetting(setting, value)) return;
    params[aliases[0]] = String(value);
  });

  const pack = resolvePackingFromDensity(settings.componentDensity, settings.spacingTuner);
  if (!omitDefaults || pack !== 'balanced') {
    params.pack = pack;
  }

  if (settings.componentVariant) {
    params.variant = settings.componentVariant;
  }

  return params;
}

export function mergeSettingsWithQuery(settings = {}, search = '') {
  const { params } = parseModularQuery(search);
  const fromQuery = queryParamsToSettingsPartial(params);
  return { ...settings, ...fromQuery };
}

export function buildSettingsQueryFromState(settings = {}, options = {}) {
  const params = settingsToQueryParams(settings, options);
  return serializeSpwQuery(composeSpwQuery(params));
}

export function buildSettingsShareHref(settings = {}, location = globalThis.location || {}) {
  const query = buildSettingsQueryFromState(settings, { omitDefaults: true });
  const path = location.pathname || '/';
  const hash = location.hash || '';
  return `${path}${query}${hash}`;
}

export function syncUrlFromSettings(settings = {}, location = globalThis.location, { replace = true } = {}) {
  if (!location || typeof location.pathname !== 'string') return null;

  const { params: currentParams } = parseModularQuery(location.search || '');
  const settingsParams = settingsToQueryParams(settings, { omitDefaults: true });
  const merged = { ...currentParams };

  PARITY_QUERY_KEYS.forEach((key) => {
    delete merged[key];
    delete merged[expandQueryKey(key)];
  });
  Object.entries(SETTINGS_TO_QUERY).forEach(([, aliases]) => {
    aliases.forEach((alias) => {
      delete merged[alias];
    });
  });

  Object.assign(merged, settingsParams);

  const nextSearch = serializeSpwQuery(composeSpwQuery(merged));
  const nextUrl = `${location.pathname}${nextSearch}${location.hash || ''}`;
  const currentUrl = `${location.pathname}${location.search || ''}${location.hash || ''}`;
  if (nextUrl === currentUrl) return nextUrl;

  const history = globalThis.history;
  if (!history) return nextUrl;

  if (replace && typeof history.replaceState === 'function') {
    history.replaceState(history.state, '', nextUrl);
  } else if (typeof history.pushState === 'function') {
    history.pushState(history.state, '', nextUrl);
  }

  return nextUrl;
}

export function buildLayoutPostureDatasets(settings = {}) {
  const normalized = settings;
  return {
    spwLayout: resolveLayoutFromTuner(normalized.layoutTuner),
    spwPackingState: resolvePackingFromDensity(normalized.componentDensity, normalized.spacingTuner),
    spwLayoutPosture: normalized.explorePosture || 'reading',
    spwPackOccupancy: normalized.componentDensity === 'dense'
      ? 'sparse'
      : normalized.componentDensity === 'roomy' ? 'full' : 'balanced',
  };
}