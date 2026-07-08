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
  HAPTICS_REGISTRY: 'spw-haptics-registry',
  SIGIL_COLLECTION: 'spw-sigil-collection',
  LOCAL_NOTES: 'spw-local-notes',
  STATE_SATCHEL_POSITION: 'spw-state-satchel-position',
  IMAGE_PROMPT_MEMORY: 'spw-image-prompt-memory',
  SEMANTICS_UNLOCKED: 'spw-semantics-unlocked',
  PREPAINT_STATE: 'spw-prepaint-state',
  SCENE_INTERACTION: 'spw-scene-interaction',
  EFFECT_LEDGER: 'spw-effect-ledger',
  PALETTE_TRACE: 'spw-palette-trace',
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
    STORAGE_KEYS.HAPTICS_REGISTRY,
    STORAGE_KEYS.SIGIL_COLLECTION,
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
  ]),
  inspection: Object.freeze([
    STORAGE_KEYS.STATE_SATCHEL_POSITION,
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

/** @deprecated Prefer readJson for new code. */
export const safeParseJson = readJson;