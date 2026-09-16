/** Query/dataset runtime policy and reader/inspection posture. */
import { runtimeToken } from '/public/js/kernel/text-normalization.js';
import { MOUNT_WHEN } from '../catalog/constants.js';

const RUNTIME_TIMING_POLICIES = new Set(['normal', 'eager', 'defer', 'quiet', 'manual']);
const MOUNT_WHEN_VALUES = new Set(Object.values(MOUNT_WHEN));
const HTML = typeof document !== 'undefined' ? document.documentElement : null;
const BODY = typeof document !== 'undefined' ? document.body : null;

/**
 * Portable policy vocabulary. The historical export name remains part of
 * compose.js; the implementation no longer owns DOM helpers or the registry.
 */
export const SPW_RUNTIME_HELPERS_CONTRACT = Object.freeze({
  timingPolicies: Object.freeze([...RUNTIME_TIMING_POLICIES]),
  mountWhenValues: Object.freeze([...MOUNT_WHEN_VALUES]),
  portableUse:
    'Read query/dataset scheduling policy and inspection posture without importing the bootstrap, scheduler, or registry.',
  featureGating:
    'Module defs may declare features (string or string[]) that must be present on body[data-spw-features] before scheduling. Tokens may be CSS BEHAVIOR_SCOPES or presence-only keys (operators, navigator, route-discovery, …) validated by runtime-contracts.',
});

export function normalizeRuntimeToken(value = '') {
  return runtimeToken(value);
}

export function readDelimitedSet(value = '') {
  return new Set(
    String(value || '')
      .split(/[\s,]+/)
      .map(normalizeRuntimeToken)
      .filter(Boolean)
  );
}

export function readModuleTimingMap(value = '') {
  const map = new Map();
  String(value || '')
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const [rawId, rawWhen] = item.split(':');
      const id = normalizeRuntimeToken(rawId);
      const when = normalizeRuntimeToken(rawWhen);
      if (id && MOUNT_WHEN_VALUES.has(when)) {
        map.set(id, when);
      }
    });
  return map;
}

export function readRuntimePolicy() {
  const search = typeof window !== 'undefined' && window.location ? window.location.search : '';
  const params = new URLSearchParams(search);
  const rawTiming =
    params.get('spw-runtime-timing')
    || params.get('runtime-timing')
    || HTML?.dataset.spwRuntimeTiming
    || BODY?.dataset.spwRuntimeTiming
    || 'normal';
  const timing = RUNTIME_TIMING_POLICIES.has(normalizeRuntimeToken(rawTiming))
    ? normalizeRuntimeToken(rawTiming)
    : 'normal';
  const delay = Number.parseInt(
    params.get('spw-module-delay')
    || params.get('module-delay')
    || HTML?.dataset.spwModuleDelay
    || BODY?.dataset.spwModuleDelay
    || '0',
    10
  );
  const auditValue =
    params.get('spw-module-audit')
    || params.get('module-audit')
    || HTML?.dataset.spwModuleAudit
    || BODY?.dataset.spwModuleAudit
    || '';
  const visualValue =
    params.get('spw-module-visuals')
    || params.get('module-visuals')
    || HTML?.dataset.spwModuleVisuals
    || BODY?.dataset.spwModuleVisuals
    || '';

  return {
    timing,
    audit: ['1', 'true', 'on', 'yes', '*'].includes(String(auditValue).toLowerCase()),
    visuals: ['1', 'true', 'on', 'yes', '*'].includes(String(visualValue).toLowerCase()),
    delay: Number.isFinite(delay) && delay > 0 ? Math.min(delay, 5000) : 0,
    only: readDelimitedSet(
      params.get('spw-module-only')
      || params.get('module-only')
      || HTML?.dataset.spwModuleOnly
      || BODY?.dataset.spwModuleOnly
    ),
    skip: readDelimitedSet(
      params.get('spw-module-skip')
      || params.get('module-skip')
      || HTML?.dataset.spwModuleSkip
      || BODY?.dataset.spwModuleSkip
    ),
    timingByModule: readModuleTimingMap(
      params.get('spw-module-timing')
      || params.get('module-timing')
      || HTML?.dataset.spwModuleTiming
      || BODY?.dataset.spwModuleTiming
    ),
  };
}

export function inferRuntimePosture(policy) {
  if (!policy) return 'minimal';
  if (policy.visuals && policy.timing === 'eager') return 'theatrical';
  if (policy.visuals) return 'resonant';
  if (
    policy.audit
    || policy.timing !== 'normal'
    || policy.delay
    || policy.only.size
    || policy.skip.size
    || policy.timingByModule.size
  ) {
    return 'precision';
  }
  return 'minimal';
}

/**
 * Describe the active runtime policy as a short sentence for logs, datasets,
 * or screenshots.
 */
export function describeRuntimePolicy(policy) {
  if (!policy) return 'runtime policy unavailable';

  const parts = [
    `timing:${policy.timing || 'normal'}`,
    `audit:${policy.audit ? 'on' : 'off'}`,
    `visuals:${policy.visuals ? 'on' : 'off'}`,
  ];

  if (policy.delay) parts.push(`delay:${policy.delay}ms`);
  if (policy.only?.size) parts.push(`only:${[...policy.only].join(',')}`);
  if (policy.skip?.size) parts.push(`skip:${[...policy.skip].join(',')}`);
  if (policy.timingByModule?.size) parts.push(`per-module:${policy.timingByModule.size}`);

  return parts.join(' · ');
}

const INSPECT_LAB_SURFACES = new Set(['settings', 'website', 'plans', 'tools-spw-parser']);

export function isInspectLabSurface(root = BODY) {
  return INSPECT_LAB_SURFACES.has(root?.dataset?.spwSurface || '');
}

/**
 * Public reading surfaces stay visually quiet unless debug seams, cognitive
 * handles, or inspect-lab routes are explicitly active.
 */
export function isReadingQuietChrome(root = document) {
  const html = root.documentElement || HTML;
  if (html.dataset.spwDebugMode === 'on') return false;
  if (html.dataset.spwCognitiveHandles === 'on') return false;
  if (isInspectLabSurface(root.body || BODY)) return false;
  return true;
}
