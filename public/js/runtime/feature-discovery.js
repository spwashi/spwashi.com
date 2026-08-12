/**
 * feature-discovery.js
 * ---------------------------------------------------------------------------
 * A generic "field guide" for site features. Where region-profiler +
 * component-collection collect component *kinds*, this collects *features* —
 * the named [data-spw-feature] capabilities a visitor meets as they mosey.
 *
 * The palette treat used to be a bespoke reward mechanism; now it is just one
 * feature registered here. Any feature declares a small contract — or takes
 * sane defaults:
 *
 *   data-spw-feature="palette-probe"
 *   data-spw-feature-traits="escalating-reward resonance keyboard-navigable"
 *   data-spw-feature-progression="depth"     // familiarity | depth | traversal | (JS fn)
 *   data-spw-feature-memory="persistent"      // persistent | session | none
 *
 * registerFeature({...}) is the JS escape hatch for a custom progression fn or
 * traits a module owns rather than the markup.
 *
 * Naturalist framing — every encounter is classified:
 *   novel      — a species (feature id) met for the first time, with no trait
 *                you have collected before (a genuinely new form).
 *   convergent — a first-time species that nonetheless carries a trait already
 *                seen on another feature: the pleasure of recognizing convergent
 *                evolution as you wander.
 *   return     — a species met before; its local progression deepens.
 *
 * Writes element/root data tokens and emits spw:feature-discovered; relays a
 * generic spw:discovery-reward so existing reward surfaces respond without new
 * coupling. Memory is a localStorage blob sibling to (not merged with) the
 * component collection — a parallel field guide for now.
 */

import { STORAGE_KEYS } from '/public/js/kernel/storage-utils.js';
import { ATTENTION_PHASE_SHIFT } from '/public/js/runtime/page-state.js';

const STORAGE_KEY = STORAGE_KEYS.FEATURE_DISCOVERY;
const FRESH_PULSE_MS = 2400;
const DEFAULT_MAX_LEVEL = 3;

// Canonical diversity ladder shared with the profiler/collection (the "depth"
// progression rides the collection tier). Duplicated as a literal rather than
// imported so this module has no hard dependency on the collection engine.
const TIER_RANK = Object.freeze({ singular: 0, paired: 1, varied: 2, rich: 3, teeming: 4 });
// Where the reader sits in the attentional arc nudges "depth": a settled reader
// can be shown more. Shared with reward-ui salience via the arc's owner.

export const SPW_FEATURE_DISCOVERY_CONTRACT = Object.freeze({
  selector: '[data-spw-feature]',
  storageKey: STORAGE_KEY,
  events: Object.freeze({
    discovered: 'spw:feature-discovered',
    ready: 'spw:feature-discovery-ready',
    reward: 'spw:discovery-reward',
  }),
  attributes: Object.freeze({
    encounter: 'data-spw-feature-encounter',   // novel | convergent | return
    level: 'data-spw-feature-level',           // integer progression level
    progress: 'data-spw-feature-progress',     // 0..1 (level / maxLevel), for CSS calc
    convergent: 'data-spw-feature-convergent', // space-separated traits shared with prior species
    fresh: 'data-spw-feature-fresh',           // transient pulse on a first encounter
  }),
  declares: Object.freeze({
    progression: 'data-spw-feature-progression',
    memory: 'data-spw-feature-memory',
    traits: 'data-spw-feature-traits',
    maxLevel: 'data-spw-feature-max-level',
  }),
  progressionModels: Object.freeze(['familiarity', 'depth', 'traversal']),
  memoryModels: Object.freeze(['persistent', 'session', 'none']),
  portableUse:
    'Annotate a [data-spw-feature] cluster with data-spw-feature-progression/-memory/-traits, '
    + 'or registerFeature({ species, progression, memory, traits }) for a custom fn. Encounters '
    + 'accrue a field-guide record with novel/convergent/return classification.',
});

// ─── Named progression models: (record, context) → level ──────────────────────
// A model reads whatever it needs (engagement count, collection tier, traversed
// variants) and returns an integer level; the engine clamps to maxLevel.
const PROGRESSION_MODELS = Object.freeze({
  // Escalates with raw engagement count — the default "getting to know it".
  familiarity: (record) => {
    const n = record.count || 0;
    if (n >= 8) return 3;
    if (n >= 3) return 2;
    if (n >= 1) return 1;
    return 0;
  },
  // Rides the site-wide collection tier + attentional arc; independent of count.
  depth: (_record, ctx) => {
    const html = ctx.html || document.documentElement;
    const tier = String(html.dataset.spwCollectionTier || 'singular').trim().toLowerCase();
    const attention = String(html.dataset.spwAttentionContext || 'settled').trim().toLowerCase();
    const base = TIER_RANK[tier] ?? 0;
    const shift = ATTENTION_PHASE_SHIFT[attention] ?? 0;
    return Math.max(0, base + shift);
  },
  // Escalates with how many distinct sub-states have been traversed this visit
  // (e.g. distinct gravity variants a bench specimen has shown). Session-shaped.
  traversal: (record) => (record.variants ? record.variants.length : 0),
});

const isElement = (v) => Boolean(v) && v.nodeType === 1;
const normToken = (v = '') => String(v).trim().toLowerCase();
const parseTraits = (v = '') => String(v).split(/[\s,]+/).map(normToken).filter(Boolean);

function getStore() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function emptyStore() {
  return { species: {}, traits: {}, updatedAt: 0 };
}

function readPersistent(store) {
  if (!store) return emptyStore();
  try {
    const parsed = JSON.parse(store.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return emptyStore();
    return {
      species: parsed.species && typeof parsed.species === 'object' ? parsed.species : {},
      traits: parsed.traits && typeof parsed.traits === 'object' ? parsed.traits : {},
      updatedAt: Number(parsed.updatedAt) || 0,
    };
  } catch {
    return emptyStore();
  }
}

function writePersistent(store, data) {
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota / privacy mode — the field guide stays in-memory this session.
  }
}

// ─── Registry + memory (module singletons; the engine is a page-lifetime service) ──
const registry = new Map();          // species → normalized descriptor
const elementsBySpecies = new Map(); // species → Set<HTMLElement>
const sessionRecords = new Map();    // species → record (for memory: 'session')
const viewedThisSession = new WeakSet(); // elements already counted as a view
const tokenSnapshots = new Map();        // element → authored values for generated attrs

let persistent = emptyStore();
let store = null;
let ctxHtml = null;
let ctxBus = null;
let initialized = false;
let persistentLoaded = false;
const freshTimers = new Map();

function ensurePersistentLoaded() {
  if (persistentLoaded) return;
  store = getStore();
  persistent = readPersistent(store);
  persistentLoaded = true;
}

function normalizeDescriptor(input = {}) {
  const species = normToken(input.species || '');
  if (!species) return null;
  const progression = typeof input.progression === 'function'
    ? input.progression
    : (PROGRESSION_MODELS[normToken(input.progression)] ? normToken(input.progression) : 'familiarity');
  const memory = SPW_FEATURE_DISCOVERY_CONTRACT.memoryModels.includes(normToken(input.memory))
    ? normToken(input.memory)
    : 'persistent';
  const maxLevel = Number.isFinite(input.maxLevel) && input.maxLevel > 0
    ? Math.floor(input.maxLevel)
    : (progression === 'depth' ? 4 : DEFAULT_MAX_LEVEL);
  return {
    species,
    label: input.label || species,
    traits: Array.isArray(input.traits) ? input.traits.map(normToken).filter(Boolean) : parseTraits(input.traits),
    progression,
    memory,
    maxLevel,
  };
}

// Build a descriptor from a cluster's declared data-* attributes, so a feature
// can opt in from markup with no JS at all.
function descriptorFromElement(el) {
  const d = SPW_FEATURE_DISCOVERY_CONTRACT.declares;
  return normalizeDescriptor({
    species: el.dataset.spwFeature,
    traits: el.getAttribute(d.traits) || '',
    progression: el.getAttribute(d.progression) || '',
    memory: el.getAttribute(d.memory) || '',
    maxLevel: Number.parseInt(el.getAttribute(d.maxLevel) || '', 10),
  });
}

function resolveDescriptor(species, el) {
  if (registry.has(species)) return registry.get(species);
  if (isElement(el)) {
    const fromEl = descriptorFromElement(el);
    if (fromEl) { registry.set(species, fromEl); return fromEl; }
  }
  return null;
}

function getRecord(species, memory) {
  if (memory === 'session') {
    if (!sessionRecords.has(species)) sessionRecords.set(species, { count: 0, firstSeenAt: 0, lastSeenAt: 0, level: 0, variants: [] });
    return sessionRecords.get(species);
  }
  if (memory === 'none') {
    // Ephemeral: a throwaway record so every encounter reads as fresh.
    return { count: 0, firstSeenAt: 0, lastSeenAt: 0, level: 0, variants: [] };
  }
  if (!persistent.species[species]) {
    persistent.species[species] = { count: 0, firstSeenAt: 0, lastSeenAt: 0, level: 0, variants: [] };
  }
  return persistent.species[species];
}

function computeLevel(descriptor, record, detail) {
  const model = typeof descriptor.progression === 'function'
    ? descriptor.progression
    : PROGRESSION_MODELS[descriptor.progression] || PROGRESSION_MODELS.familiarity;
  let level = 0;
  try {
    level = model(record, { html: ctxHtml || document.documentElement, detail, descriptor });
  } catch {
    level = 0;
  }
  return Math.max(0, Math.min(descriptor.maxLevel, Math.round(Number(level) || 0)));
}

// Traits are the axis of convergence. The persistent ledger records the first
// species to exhibit each trait; a *different* species later carrying that trait
// is convergent evolution. Session/ephemeral features still contribute to and
// read from this ledger, so recognition works across the whole field guide.
function classifyConvergence(descriptor) {
  const shared = [];
  let origin = '';
  for (const trait of descriptor.traits) {
    const owner = persistent.traits[trait];
    if (owner && owner !== descriptor.species) {
      shared.push(trait);
      if (!origin) origin = owner;
    }
  }
  return { shared, origin };
}

function registerTraits(descriptor) {
  let changed = false;
  for (const trait of descriptor.traits) {
    if (!persistent.traits[trait]) { persistent.traits[trait] = descriptor.species; changed = true; }
  }
  return changed;
}

function writeElementTokens(species, tokens) {
  const els = elementsBySpecies.get(species);
  if (!els) return;
  const A = SPW_FEATURE_DISCOVERY_CONTRACT.attributes;
  els.forEach((el) => {
    if (!el.isConnected) return;
    if (!tokenSnapshots.has(el)) {
      tokenSnapshots.set(el, Object.fromEntries(
        Object.values(A).map((attribute) => [attribute, el.getAttribute(attribute)]),
      ));
    }
    el.setAttribute(A.encounter, tokens.encounter);
    el.setAttribute(A.level, String(tokens.level));
    el.setAttribute(A.progress, tokens.progress.toFixed(3));
    if (tokens.convergent) el.setAttribute(A.convergent, tokens.convergent);
    else el.removeAttribute(A.convergent);
    if (tokens.fresh) {
      el.setAttribute(A.fresh, tokens.encounter);
      const prev = freshTimers.get(el);
      if (prev) window.clearTimeout(prev);
      freshTimers.set(el, window.setTimeout(() => { el.removeAttribute(A.fresh); freshTimers.delete(el); }, FRESH_PULSE_MS));
    }
  });
}

function restoreElementTokens(el) {
  const snapshot = tokenSnapshots.get(el);
  if (!snapshot) return;
  Object.entries(snapshot).forEach(([attribute, value]) => {
    if (value == null) el.removeAttribute(attribute);
    else el.setAttribute(attribute, value);
  });
  tokenSnapshots.delete(el);
}

/**
 * Record an encounter with a feature. Called by the engine (viewport entry) or
 * by a feature module that owns richer signals (e.g. a probe interaction, a
 * gravity variant flip). `detail.variant` feeds traversal-style progression.
 */
export function discoverFeature(species, detail = {}) {
  species = normToken(species);
  if (!species) return null;
  // Feature owners may call discover() before the idle engine mounts. Hydrate
  // once here so that encounter is not later replaced by init-time storage.
  ensurePersistentLoaded();
  const el = detail.element && isElement(detail.element) ? detail.element : null;
  const descriptor = resolveDescriptor(species, el);
  if (!descriptor) return null;

  const record = getRecord(species, descriptor.memory);
  const wasKnown = record.count > 0;
  const now = Date.now();
  record.count += 1;
  record.lastSeenAt = now;
  if (!record.firstSeenAt) record.firstSeenAt = now;

  const variant = detail.variant != null ? String(detail.variant) : '';
  if (variant && !record.variants.includes(variant)) record.variants.push(variant);

  const { shared, origin } = classifyConvergence(descriptor);
  const traitsChanged = registerTraits(descriptor);

  record.level = computeLevel(descriptor, record, detail);

  const encounter = wasKnown ? 'return' : (shared.length ? 'convergent' : 'novel');
  const progress = descriptor.maxLevel > 0 ? record.level / descriptor.maxLevel : 0;

  // Persist when a persistent-memory record changed, or when a session/ephemeral
  // feature contributed a new trait to the (always-persistent) convergence ledger.
  if (descriptor.memory === 'persistent' || traitsChanged) {
    persistent.updatedAt = now;
    writePersistent(store, persistent);
  }

  const payload = {
    species,
    label: descriptor.label,
    encounter,
    level: record.level,
    progress,
    maxLevel: descriptor.maxLevel,
    traits: descriptor.traits.slice(),
    convergent: shared,
    convergentOrigin: origin,
    count: record.count,
    trigger: detail.trigger || 'discover',
    route: detail.route || ctxHtml?.dataset?.spwRoute || '',
  };

  writeElementTokens(species, {
    encounter,
    level: record.level,
    progress,
    convergent: shared.join(' '),
    fresh: !wasKnown,
  });

  // The canonical bus already dispatches a DOM CustomEvent. Fall back to a raw
  // event only when the bus is unavailable, otherwise listeners receive the
  // same discovery twice.
  const root = (ctxHtml && ctxHtml.ownerDocument) || document;
  if (ctxBus?.emit) {
    ctxBus.emit(SPW_FEATURE_DISCOVERY_CONTRACT.events.discovered, payload);
  } else {
    root.dispatchEvent(new CustomEvent(SPW_FEATURE_DISCOVERY_CONTRACT.events.discovered, { detail: payload, bubbles: true }));
  }
  root.dispatchEvent(new CustomEvent(SPW_FEATURE_DISCOVERY_CONTRACT.events.reward, {
    detail: { source: 'feature-discovery', reward: `feature-${species}`, feature: species, encounter, level: record.level },
    bubbles: true,
  }));

  return payload;
}

/** Register or upgrade a feature's contract (JS escape hatch for custom fns). */
export function registerFeature(descriptor) {
  const normalized = normalizeDescriptor(descriptor);
  if (!normalized) return null;
  registry.set(normalized.species, normalized);
  // If the cluster is already in the DOM, start tracking + paint known state.
  if (initialized) trackSpeciesElements(normalized.species);
  return normalized;
}

/** Current progression level for a species (0 if unknown) — e.g. palette depth. */
export function getFeatureLevel(species) {
  species = normToken(species);
  const descriptor = registry.get(species);
  if (!descriptor) return 0;
  const record = getRecord(species, descriptor.memory);
  return computeLevel(descriptor, record, {});
}

function escapeAttrSelector(value = '') {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function trackSpeciesElements(species) {
  const nodes = document.querySelectorAll(`[data-spw-feature="${escapeAttrSelector(species)}"]`);
  if (!nodes.length) return;
  let set = elementsBySpecies.get(species);
  if (!set) { set = new Set(); elementsBySpecies.set(species, set); }
  nodes.forEach((el) => {
    set.add(el);
    // Paint accrued state on a return visit so progress is visible immediately.
    const descriptor = resolveDescriptor(species, el);
    if (!descriptor) return;
    const record = getRecord(species, descriptor.memory);
    if (record.count > 0) {
      const level = computeLevel(descriptor, record, {});
      writeElementTokens(species, {
        encounter: 'return',
        level,
        progress: descriptor.maxLevel > 0 ? level / descriptor.maxLevel : 0,
        convergent: '',
        fresh: false,
      });
    }
    intersectionObserver?.observe(el);
  });
}

let intersectionObserver = null;

export function initFeatureDiscovery(ctx = {}) {
  const html = ctx.html || document.documentElement;
  if (!html || html.dataset.spwFeatureDiscoveryInit === '1') {
    return { cleanup() {}, refresh() {} };
  }
  html.dataset.spwFeatureDiscoveryInit = '1';

  ctxHtml = html;
  ctxBus = ctx.bus || null;
  ensurePersistentLoaded();
  initialized = true;

  // First on-screen appearance of a tracked cluster this session counts as an
  // encounter — moseying past a feature is how you "find the species".
  if (typeof IntersectionObserver === 'function') {
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (viewedThisSession.has(el)) return;
        viewedThisSession.add(el);
        const species = normToken(el.dataset.spwFeature || '');
        if (species) discoverFeature(species, { trigger: 'view', element: el });
      });
    // Large feature clusters can be taller than the viewport, making a 35%
    // ratio unreachable. A small threshold records an actual encounter while
    // still requiring meaningful on-screen presence.
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  }

  // Track any cluster that has already declared a contract (via JS registry or
  // data-* attributes). Undeclared [data-spw-feature] clusters stay dormant —
  // this pass does not auto-enroll all 202; a feature opts in on purpose.
  const scan = () => {
    document.querySelectorAll(SPW_FEATURE_DISCOVERY_CONTRACT.selector).forEach((el) => {
      const species = normToken(el.dataset.spwFeature || '');
      if (!species) return;
      const declared = registry.has(species)
        || el.hasAttribute(SPW_FEATURE_DISCOVERY_CONTRACT.declares.progression)
        || el.hasAttribute(SPW_FEATURE_DISCOVERY_CONTRACT.declares.memory)
        || el.hasAttribute(SPW_FEATURE_DISCOVERY_CONTRACT.declares.traits);
      if (declared) trackSpeciesElements(species);
    });
  };
  scan();

  const api = {
    register: registerFeature,
    discover: discoverFeature,
    level: getFeatureLevel,
    get: () => ({ species: { ...persistent.species }, traits: { ...persistent.traits } }),
    reset() {
      persistent = emptyStore();
      sessionRecords.clear();
      if (store) {
        try {
          store.removeItem(STORAGE_KEY);
        } catch {
          // Privacy mode / disabled storage — in-memory guide already cleared.
        }
      }
      elementsBySpecies.forEach((elements) => elements.forEach(restoreElementTokens));
    },
    contract: SPW_FEATURE_DISCOVERY_CONTRACT,
  };
  if (typeof window !== 'undefined') window.spwFeatureDiscovery = api;

  // Announce readiness so feature owners that mounted earlier can register their
  // custom contracts now (order-independent registration).
  if (ctxBus?.emit) {
    ctxBus.emit(SPW_FEATURE_DISCOVERY_CONTRACT.events.ready, { storageKey: STORAGE_KEY });
  } else {
    (html.ownerDocument || document).dispatchEvent(
      new CustomEvent(SPW_FEATURE_DISCOVERY_CONTRACT.events.ready, { bubbles: true }),
    );
  }

  const cleanup = () => {
    intersectionObserver?.disconnect();
    intersectionObserver = null;
    freshTimers.forEach((t) => window.clearTimeout(t));
    freshTimers.clear();
    viewedThisSession.clear();
    elementsBySpecies.forEach((elements) => elements.forEach(restoreElementTokens));
    tokenSnapshots.clear();
    elementsBySpecies.clear();
    // Drop module-level registry entries that were only hydrated from markup so
    // a later remount re-reads attributes; keep registerFeature() contracts.
    // (Registry is intentional process memory for owner modules.)
    delete html.dataset.spwFeatureDiscoveryInit;
    initialized = false;
    ctxHtml = null;
    ctxBus = null;
    if (typeof window !== 'undefined' && window.spwFeatureDiscovery === api) {
      delete window.spwFeatureDiscovery;
    }
  };
  return { cleanup, refresh: scan, api };
}
