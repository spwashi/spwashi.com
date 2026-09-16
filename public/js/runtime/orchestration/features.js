/** Feature gates shared by catalog scheduling and page tools. */
import { runtimeToken as normalizeRuntimeToken } from '/public/js/kernel/text-normalization.js';

export function parseFeatureList(value) {
  if (!value) return new Set();
  if (value instanceof Set) {
    return new Set(
      [...value]
        .map((item) => normalizeRuntimeToken(item))
        .filter(Boolean)
    );
  }
  if (Array.isArray(value)) {
    return new Set(
      value
        .flatMap((item) => String(item).split(/[\s,]+/))
        .map((item) => normalizeRuntimeToken(item))
        .filter(Boolean)
    );
  }
  if (typeof value !== 'string') return new Set();
  return new Set(
    value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

export function normalizeFeatureRequirements(features) {
  if (!features) return [];
  if (typeof features === 'string') {
    const token = normalizeRuntimeToken(features);
    return token ? [token] : [];
  }
  if (Array.isArray(features)) {
    return features.map((item) => normalizeRuntimeToken(item)).filter(Boolean);
  }
  return [];
}

/**
 * Returns true when a module has no feature gate or every required feature
 * is present in the active page feature set (body[data-spw-features]).
 */
export function matchesFeatures(def, activeFeatures) {
  const required = normalizeFeatureRequirements(def?.features);
  if (!required.length) return true;

  const active = activeFeatures instanceof Set
    ? activeFeatures
    : parseFeatureList(activeFeatures);

  return required.every((feature) => active.has(feature));
}
