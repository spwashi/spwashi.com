/**
 * Session feature lab — editor-facing presence overrides for optional partials.
 *
 * Authored body[data-spw-features] remains the source of truth for the route.
 * Ops in sessionStorage (sign-prefixed tokens: +console -metrics) rewrite
 * the live feature set on each boot so catalog matchesFeatures + CSS
 * body[data-spw-features~="…"] gates stay aligned. Reload required; no storage
 * of settings preferences.
 */

import {
  parseFeatureList,
  normalizeRuntimeToken,
} from './runtime-helpers.js';

export const FEATURE_LAB_STORAGE_KEY = 'spw-feature-lab';

export const SPW_FEATURE_LAB_CONTRACT = Object.freeze({
  storageKey: FEATURE_LAB_STORAGE_KEY,
  format: '+token -token (space-separated; + adds, - removes from authored body features)',
  portableUse:
    'Call applyFeatureLabToBody(document.body) once before parseFeatureList for runtime context. '
    + 'UI may toggle tokens via toggleFeatureLabToken() then reload.',
});

/**
 * @param {string} raw
 * @returns {{ sign: '+' | '-', token: string }[]}
 */
export function parseFeatureLabOps(raw = '') {
  if (!raw || typeof raw !== 'string') return [];
  const ops = [];
  const seen = new Map();

  String(raw)
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const sign = part.startsWith('-') ? '-' : '+';
      const bare = part.replace(/^[+-]/, '');
      const token = normalizeRuntimeToken(bare);
      if (!token) return;
      // Last op wins for a token.
      seen.set(token, sign);
    });

  seen.forEach((sign, token) => {
    ops.push({ sign, token });
  });

  return ops.sort((a, b) => a.token.localeCompare(b.token));
}

export function serializeFeatureLabOps(ops = []) {
  return ops
    .map((op) => `${op.sign === '-' ? '-' : '+'}${op.token}`)
    .join(' ');
}

export function readFeatureLabSession() {
  try {
    return sessionStorage.getItem(FEATURE_LAB_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function writeFeatureLabSession(opsString = '') {
  try {
    const normalized = serializeFeatureLabOps(parseFeatureLabOps(opsString));
    if (!normalized) {
      sessionStorage.removeItem(FEATURE_LAB_STORAGE_KEY);
      return '';
    }
    sessionStorage.setItem(FEATURE_LAB_STORAGE_KEY, normalized);
    return normalized;
  } catch {
    return '';
  }
}

export function clearFeatureLabSession() {
  try {
    sessionStorage.removeItem(FEATURE_LAB_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Apply lab ops to an authored feature string.
 * @param {string} authored
 * @param {{ sign: string, token: string }[]} ops
 */
export function applyFeatureLabOps(authored = '', ops = []) {
  const set = parseFeatureList(authored);
  ops.forEach((op) => {
    if (op.sign === '-') set.delete(op.token);
    else set.add(op.token);
  });
  return [...set].sort().join(' ');
}

/**
 * Preserve authored features, apply session lab ops, annotate body.
 * Safe to call once per navigation; restores authored when lab is empty.
 * @param {HTMLElement | null | undefined} body
 * @returns {{ authored: string, active: string, ops: object[], applied: boolean } | null}
 */
export function applyFeatureLabToBody(body = document.body) {
  // Prefer dataset presence over instanceof so portable/test shells still work.
  if (!body?.dataset) return null;

  if (!body.dataset.spwFeaturesAuthored) {
    body.dataset.spwFeaturesAuthored = body.dataset.spwFeatures || '';
  }

  const authored = body.dataset.spwFeaturesAuthored || '';
  const ops = parseFeatureLabOps(readFeatureLabSession());

  if (!ops.length) {
    body.dataset.spwFeatures = authored;
    delete body.dataset.spwFeatureLab;
    delete body.dataset.spwFeatureLabOps;
    return {
      authored,
      active: authored,
      ops: [],
      applied: false,
    };
  }

  const active = applyFeatureLabOps(authored, ops);
  body.dataset.spwFeatures = active;
  body.dataset.spwFeatureLab = 'session';
  body.dataset.spwFeatureLabOps = serializeFeatureLabOps(ops);

  return {
    authored,
    active,
    ops,
    applied: true,
  };
}

/**
 * Toggle a token in the session lab (add if absent from effective set, remove if present).
 * Does not reload — caller should reload after write.
 * @param {string} token
 * @param {{ body?: HTMLElement, force?: 'add' | 'remove' }} [options]
 */
export function toggleFeatureLabToken(token, options = {}) {
  const body = options.body || document.body;
  const normalized = normalizeRuntimeToken(token);
  if (!normalized) return readFeatureLabSession();

  const authored = body?.dataset?.spwFeaturesAuthored || body?.dataset?.spwFeatures || '';
  const currentOps = parseFeatureLabOps(readFeatureLabSession());
  const effective = parseFeatureList(applyFeatureLabOps(authored, currentOps));
  const isActive = effective.has(normalized);

  let force = options.force;
  if (force !== 'add' && force !== 'remove') {
    force = isActive ? 'remove' : 'add';
  }

  const nextMap = new Map(currentOps.map((op) => [op.token, op.sign]));
  if (force === 'remove') {
    // Prefer explicit remove only if authored had it; else drop a prior add.
    if (parseFeatureList(authored).has(normalized)) {
      nextMap.set(normalized, '-');
    } else {
      nextMap.delete(normalized);
    }
  } else if (parseFeatureList(authored).has(normalized)) {
    // Authored already has it — clear any remove op.
    nextMap.delete(normalized);
  } else {
    nextMap.set(normalized, '+');
  }

  const nextOps = [...nextMap.entries()]
    .map(([tok, sign]) => ({ sign, token: tok }))
    .sort((a, b) => a.token.localeCompare(b.token));

  return writeFeatureLabSession(serializeFeatureLabOps(nextOps));
}

export function describeFeatureLabState(body = document.body) {
  const authored = body?.dataset?.spwFeaturesAuthored || body?.dataset?.spwFeatures || '';
  const ops = parseFeatureLabOps(readFeatureLabSession());
  const active = applyFeatureLabOps(authored, ops);
  const authoredSet = parseFeatureList(authored);
  const activeSet = parseFeatureList(active);

  return {
    authored,
    active,
    ops,
    opsString: serializeFeatureLabOps(ops),
    added: [...activeSet].filter((t) => !authoredSet.has(t)).sort(),
    removed: [...authoredSet].filter((t) => !activeSet.has(t)).sort(),
    applied: ops.length > 0,
  };
}
