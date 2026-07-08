/**
 * storage-utils.js
 * --------------------------------------------------------------------------
 * Browser storage envelopes and key topology for the Spw kernel rhizosphere.
 *
 * Canonical site settings still flow through site-settings-engine.js.
 * Feature-specific keys use this layer for parse hygiene and discoverability.
 */

export const STORAGE_KEYS = Object.freeze({
  SITE_SETTINGS: 'spw-site-settings',
  CAULDRON: 'spw-cauldron',
  DISCOVERY_DISMISSALS: 'spw-discovery-notice-dismissals',
  VISITED_SURFACES: 'spw-visited-image-surfaces',
  COMPONENT_COLLECTION: 'spw-component-collection',
  PIN_REGISTRY: 'spw-pins',
  CHECKPOINT_PREFIX: 'spw-checkpoint:',
  GROUNDED_REGISTRY: 'spw-grounded-registry',
  SIGIL_COLLECTION: 'spw-sigil-collection',
  COUPLING_GLOBAL: 'spw-coupling:global',
  LOCAL_NOTES: 'spw-local-notes',
  STATE_SATCHEL_POSITION: 'spw-state-satchel-position',
  IMAGE_PROMPT_MEMORY: 'spw-image-prompt-memory',
  SEMANTICS_UNLOCKED: 'spw-semantics-unlocked',
  PREPAINT_STATE: 'spw-prepaint-state',
  SCENE_INTERACTION: 'spw-scene-interaction-v1',
  EFFECT_LEDGER: 'spw-effect-ledger',
  PALETTE_TRACE: 'spw-palette-trace',
  ACTIVE_PERSONA: 'spw-active-persona',
  FEATURE_LEARNING_TOASTS: 'spw-feature-learning-toasts',
});

/** Guild-oriented topology for audits and agent inspection. */
export const STORAGE_TOPOLOGY = Object.freeze({
  substrate: Object.freeze([
    STORAGE_KEYS.SITE_SETTINGS,
    STORAGE_KEYS.PREPAINT_STATE,
  ]),
  memory: Object.freeze([
    STORAGE_KEYS.VISITED_SURFACES,
    STORAGE_KEYS.CHECKPOINT_PREFIX,
    STORAGE_KEYS.PIN_REGISTRY,
    STORAGE_KEYS.GROUNDED_REGISTRY,
    STORAGE_KEYS.SIGIL_COLLECTION,
    STORAGE_KEYS.COUPLING_GLOBAL,
    STORAGE_KEYS.LOCAL_NOTES,
    STORAGE_KEYS.IMAGE_PROMPT_MEMORY,
    STORAGE_KEYS.CAULDRON,
    STORAGE_KEYS.COMPONENT_COLLECTION,
    STORAGE_KEYS.EFFECT_LEDGER,
    STORAGE_KEYS.PALETTE_TRACE,
    STORAGE_KEYS.SCENE_INTERACTION,
  ]),
  discovery: Object.freeze([
    STORAGE_KEYS.DISCOVERY_DISMISSALS,
    STORAGE_KEYS.SEMANTICS_UNLOCKED,
    STORAGE_KEYS.FEATURE_LEARNING_TOASTS,
  ]),
  inspection: Object.freeze([
    STORAGE_KEYS.STATE_SATCHEL_POSITION,
  ]),
  expression: Object.freeze([
    STORAGE_KEYS.ACTIVE_PERSONA,
  ]),
});

function resolveStorage(options = {}) {
  return options.storage || globalThis.localStorage;
}

/** Read JSON from storage with a stable fallback shape. */
export function readJson(key, fallback, options = {}) {
  const storage = resolveStorage(options);
  if (!storage || typeof storage.getItem !== 'function') return fallback;

  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (options.requireObject && (parsed == null || typeof parsed !== 'object')) return fallback;
    if (options.requireArray && !Array.isArray(parsed)) return fallback;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/** Write JSON to storage; returns false when quota or privacy blocks the write. */
export function writeJson(key, value, options = {}) {
  const storage = resolveStorage(options);
  if (!storage || typeof storage.setItem !== 'function') return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeJson(key, options = {}) {
  const storage = resolveStorage(options);
  if (!storage || typeof storage.removeItem !== 'function') return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Read a scalar storage flag (`'true'` / absent). */
export function readStorageFlag(key, options = {}) {
  const storage = resolveStorage(options);
  if (!storage || typeof storage.getItem !== 'function') return false;
  try {
    return storage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

/** Persist a scalar storage flag. */
export function writeStorageFlag(key, value, options = {}) {
  const storage = resolveStorage(options);
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    if (value) storage.setItem(key, 'true');
    else storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Read plain-text storage values (persona ids, simple tokens). */
export function readStorageText(key, fallback = '', options = {}) {
  const storage = resolveStorage(options);
  if (!storage || typeof storage.getItem !== 'function') return fallback;
  try {
    const raw = storage.getItem(key);
    return raw == null || raw === '' ? fallback : String(raw);
  } catch {
    return fallback;
  }
}

/** Write plain-text storage values. */
export function writeStorageText(key, value, options = {}) {
  const storage = resolveStorage(options);
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    if (value == null || value === '') storage.removeItem(key);
    else storage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Critical-path wrapper: never throw through init/teardown surfaces.
 * Logs a tagged warning and returns fallback on failure.
 */
export function runCriticalPath(label, task, fallback = null) {
  try {
    return typeof task === 'function' ? task() : task;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[spw-critical:${label}]`, message);
    return fallback;
  }
}

/** @deprecated Prefer readJson for new code. */
export const safeParseJson = readJson;