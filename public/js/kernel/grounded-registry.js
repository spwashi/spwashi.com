/**
 * kernel/grounded-registry.js
 *
 * The reader's grounded memory as storage: which concept keys are grounded,
 * the coupling record behind each key (per path, and global for keys that
 * name themselves so), and the sigil collection. No gesture lives here.
 * interface/haptics.js owns the hand — charge, prime, ground, unground —
 * and writes through these; lattice, cognitive-surface, the smart console,
 * the guide, and spells only read, and read from below their layer.
 *
 * Keys come from kernel/storage-utils.js STORAGE_KEYS so the settings page
 * can list and clear them with everything else.
 */

import { bus } from '/public/js/kernel/bus.js';
import { readJson, removeJson, writeJson, STORAGE_KEYS } from '/public/js/kernel/storage-utils.js';
import { normalizePathname } from '/public/js/kernel/route-utils.js';

export const GROUNDED_REGISTRY_KEY = STORAGE_KEYS.GROUNDED_REGISTRY;
export const GLOBAL_COUPLING_KEY = STORAGE_KEYS.COUPLING_GLOBAL;
export const SIGIL_COLLECTION_KEY = STORAGE_KEYS.SIGIL_COLLECTION;
export const CHECKPOINT_PREFIX = STORAGE_KEYS.CHECKPOINT_PREFIX;

/** Couplings are remembered per page; global keys are shared across pages. */
export const couplingKeyForPath = (path = normalizePathname(globalThis.location?.pathname || '/')) => `spw-coupling:${path}`;

export function isGlobalCouplingKey(key = '') {
  return String(key).startsWith('global:') || String(key).startsWith('shared:');
}

/* ---- registry ---------------------------------------------------------- */

export function getGroundedRegistry() {
  return readJson(GROUNDED_REGISTRY_KEY, [], { requireArray: true });
}

export function writeGroundedRegistry(registry = []) {
  writeJson(GROUNDED_REGISTRY_KEY, Array.isArray(registry) ? registry : []);
}

export function updateGroundedRegistry(transform) {
  const next = transform(getGroundedRegistry());
  writeGroundedRegistry(next);
  return next;
}

export function addToGroundedRegistry(key) {
  return updateGroundedRegistry((registry) => (registry.includes(key) ? registry : [...registry, key]));
}

export function removeFromGroundedRegistry(key) {
  return updateGroundedRegistry((registry) => registry.filter((entry) => entry !== key));
}

/* ---- couplings --------------------------------------------------------- */

export function getPathCouplings(path) {
  return readJson(couplingKeyForPath(path), {}, { requireObject: true });
}

export function getGlobalCouplings() {
  return readJson(GLOBAL_COUPLING_KEY, {}, { requireObject: true });
}

/** Global first, then this page's, so a page-local record wins on a shared key. */
export function getGroundedCouplings(path) {
  return { ...getGlobalCouplings(), ...getPathCouplings(path) };
}

export function setPathCouplings(value, path) {
  writeJson(couplingKeyForPath(path), value);
}

export function setGlobalCouplings(value) {
  writeJson(GLOBAL_COUPLING_KEY, value);
}

export function updateCouplingStore(key, transform) {
  const global = isGlobalCouplingKey(key);
  const next = transform(global ? getGlobalCouplings() : getPathCouplings());
  if (global) setGlobalCouplings(next);
  else setPathCouplings(next);
  return next;
}

export function writeCoupling(key, value) {
  return updateCouplingStore(key, (couplings) => ({ ...couplings, [key]: value }));
}

export function removeCoupling(key) {
  return updateCouplingStore(key, (couplings) => {
    const next = { ...couplings };
    delete next[key];
    return next;
  });
}

/** Forget the registry and this page's and the global couplings. */
export function clearGroundedMemory() {
  removeJson(GROUNDED_REGISTRY_KEY);
  removeJson(couplingKeyForPath());
  removeJson(GLOBAL_COUPLING_KEY);
}

/* ---- checkpoints ------------------------------------------------------- */

/** A checkpoint's couplings, whether saved split (global/path) or flat. */
export function resolveCheckpointCouplings(source) {
  if (!source || typeof source !== 'object') return { global: {}, path: {} };
  if ((source.global && typeof source.global === 'object') || (source.path && typeof source.path === 'object')) {
    return {
      global: source.global && typeof source.global === 'object' ? source.global : {},
      path: source.path && typeof source.path === 'object' ? source.path : {},
    };
  }
  const global = {};
  const path = {};
  Object.entries(source).forEach(([key, value]) => {
    if (isGlobalCouplingKey(key)) global[key] = value;
    else path[key] = value;
  });
  return { global, path };
}

/** Save the current registry and couplings under a name; emits spell:checkpoint-saved. */
export function saveGroundedCheckpoint(name = `checkpoint_${Date.now()}`) {
  const path = globalThis.location?.pathname || '/';
  const payload = {
    registry: getGroundedRegistry(),
    couplings: { global: getGlobalCouplings(), path: getPathCouplings() },
    savedAt: Date.now(),
    path,
  };
  writeJson(`${CHECKPOINT_PREFIX}${name}`, payload);
  bus.emit('spell:checkpoint-saved', { name, count: payload.registry.length, path }, { target: globalThis.document });
  return payload;
}

/**
 * Restore a named checkpoint into storage. Returns the restored registry, or
 * null when nothing was saved under that name. The DOM is not touched here:
 * the hand (interface/haptics.js) listens for spell:checkpoint-restored and
 * re-projects grounded state where it is mounted.
 */
export function restoreGroundedCheckpoint(name) {
  if (!name) return null;
  const parsed = readJson(`${CHECKPOINT_PREFIX}${name}`, null);
  if (!parsed || typeof parsed !== 'object') return null;
  const registry = Array.isArray(parsed.registry) ? parsed.registry : [];
  const couplings = resolveCheckpointCouplings(parsed.couplings);
  writeGroundedRegistry(registry);
  setGlobalCouplings(couplings.global);
  setPathCouplings(couplings.path);
  bus.emit('spell:checkpoint-restored', { name, count: registry.length, path: globalThis.location?.pathname || '/' }, { target: globalThis.document });
  return registry;
}

/* ---- sigils ------------------------------------------------------------ */

export function getSigilCollection() {
  return readJson(SIGIL_COLLECTION_KEY, {}, { requireObject: true });
}

export function writeSigilCollection(collection = {}) {
  writeJson(SIGIL_COLLECTION_KEY, collection && typeof collection === 'object' ? collection : {});
}

export const SPW_GROUNDED_REGISTRY_CONTRACT = Object.freeze({
  id: 'grounded-registry',
  describes: 'memory[grounded|coupling|sigil]{storage} what the reader has grounded, read from below the hand that grounds it',
  keys: [GROUNDED_REGISTRY_KEY, GLOBAL_COUPLING_KEY, SIGIL_COLLECTION_KEY, 'spw-coupling:<path>', `${CHECKPOINT_PREFIX}<name>`],
  writer: 'interface/haptics.js',
  readers: ['semantic/lattice.js', 'semantic/cognitive-surface.js', 'interface/smart-console.js', 'interface/guide.js', 'runtime/spells.js'],
});
