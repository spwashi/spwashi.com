/**
 * component-collection.js
 * ---------------------------------------------------------------------------
 * The collectible / achievement layer that sits on top of region profiling.
 *
 * region-profiler.js emits `spw:regions-profiled` / `spw:regions-primed` with a
 * `diversity` summary (distinct component kinds + a diversity tier). This module
 * is the consumer that turns those per-surface signals into a *persistent,
 * site-wide* collection: every distinct component kind a visitor encounters is
 * remembered across sessions, surfaces unlock achievements, and freshly-found
 * kinds get a short "rewarded wonder" pulse that CSS can celebrate.
 *
 * It writes only document-root tokens + bus events — no layout, no DOM build —
 * so it stays cheap and leaves presentation to CSS / reward-ui.js.
 */

import { SPW_REGION_PROFILER_CONTRACT } from '/public/js/runtime/region-profiler.js';
import { COMPONENT_COLLECTION_STORAGE_KEY } from '/public/js/kernel/site-settings-profiles.js';

const STORAGE_KEY = COMPONENT_COLLECTION_STORAGE_KEY;
const FRESH_PULSE_MS = 2400;

// Rank the diversity tiers from the profiler so "best surface seen" is ordinal.
// Derived from the profiler contract to keep a single source of truth.
const TIER_RANK = Object.freeze(
  SPW_REGION_PROFILER_CONTRACT.diversityTiers.reduce((ranks, tier, index) => {
    ranks[tier] = index;
    return ranks;
  }, {}),
);

export const SPW_COMPONENT_COLLECTION_CONTRACT = Object.freeze({
  storageKey: STORAGE_KEY,
  events: Object.freeze({
    updated: 'spw:collection-updated',
    unlocked: 'spw:achievement-unlocked',
  }),
  attributes: Object.freeze({
    kinds: 'data-spw-collection-kinds',
    total: 'data-spw-collection-total',
    tier: 'data-spw-collection-tier',
    achievements: 'data-spw-collection-achievements',
    fresh: 'data-spw-collection-fresh',
  }),
  portableUse:
    'Mount after region-profiler so spw:regions-profiled events accrue a persistent, '
    + 'cross-session collection of discovered component kinds and unlock achievements.',
});

// Achievements are pure predicates over the derived collection state, so the
// roster is data and adding one never touches the evaluation loop.
// Exported (sans predicate) so reward UI can render labels without re-declaring them.
export const ACHIEVEMENTS = Object.freeze([
  { id: 'first-sight', label: 'First Sight', test: (s) => s.distinctKinds >= 1 },
  { id: 'varied-eye', label: 'Varied Eye', test: (s) => s.maxTierRank >= TIER_RANK.varied },
  { id: 'rich-field', label: 'Rich Field', test: (s) => s.maxTierRank >= TIER_RANK.rich },
  { id: 'teeming-field', label: 'Teeming Field', test: (s) => s.maxTierRank >= TIER_RANK.teeming },
  { id: 'collector-v', label: 'Collector V', test: (s) => s.distinctKinds >= 5 },
  { id: 'collector-x', label: 'Collector X', test: (s) => s.distinctKinds >= 10 },
  { id: 'wayfarer', label: 'Wayfarer', test: (s) => s.routesSeen >= 4 },
]);

function getStore() {
  try {
    return globalThis.localStorage || null;
  } catch {
    // Access itself can throw in sandboxed / privacy contexts.
    return null;
  }
}

function emptyCollection() {
  return { kinds: {}, routes: [], maxTier: 'singular', achievements: [], updatedAt: 0 };
}

function readCollection(store) {
  if (!store) return emptyCollection();
  try {
    const parsed = JSON.parse(store.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return emptyCollection();
    return {
      kinds: parsed.kinds && typeof parsed.kinds === 'object' ? parsed.kinds : {},
      routes: Array.isArray(parsed.routes) ? parsed.routes : [],
      maxTier: typeof parsed.maxTier === 'string' ? parsed.maxTier : 'singular',
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      updatedAt: Number(parsed.updatedAt) || 0,
    };
  } catch {
    return emptyCollection();
  }
}

function writeCollection(store, collection) {
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(collection));
  } catch {
    // Quota / privacy mode — collection stays in-memory for this session only.
  }
}

function removeCollection(store) {
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private or sandboxed contexts.
  }
}

function tierRank(tier) {
  return TIER_RANK[tier] ?? 0;
}

function deriveState(collection) {
  const distinctKinds = Object.keys(collection.kinds).length;
  return {
    distinctKinds,
    routesSeen: collection.routes.length,
    maxTier: collection.maxTier,
    maxTierRank: tierRank(collection.maxTier),
  };
}

function evaluateAchievements(collection) {
  const state = deriveState(collection);
  const earned = ACHIEVEMENTS.filter((a) => {
    try {
      return a.test(state);
    } catch {
      return false;
    }
  });
  return earned.map((a) => a.id);
}

// Pull the discovered kinds + best tier out of a regions event, whether or not
// the emitter included the diversity summary (older emits carried only profiles).
function readEventDiversity(detail = {}) {
  const diversity = detail.diversity;
  if (diversity && Array.isArray(diversity.kinds)) {
    return { kinds: diversity.kinds.filter(Boolean), tier: diversity.tier || 'singular' };
  }
  const profiles = Array.isArray(detail.profiles) ? detail.profiles : [];
  const kinds = [...new Set(profiles.map((p) => p && p.kind).filter(Boolean))];
  return { kinds, tier: 'singular' };
}

export function initComponentCollection(ctx = {}) {
  const html = ctx.html || document.documentElement;
  if (!html) return { cleanup() {}, refresh() {} };
  if (html.dataset.spwComponentCollectionInit === '1') {
    return { cleanup() {}, refresh() {} };
  }
  html.dataset.spwComponentCollectionInit = '1';

  const store = getStore();
  const bus = ctx.bus || null;
  let collection = readCollection(store);
  let freshTimer = 0;

  const writeTokens = () => {
    const state = deriveState(collection);
    html.dataset.spwCollectionKinds = String(state.distinctKinds);
    html.dataset.spwCollectionTotal = String(
      Object.values(collection.kinds).reduce((sum, n) => sum + (Number(n) || 0), 0),
    );
    html.dataset.spwCollectionTier = collection.maxTier;
    if (collection.achievements.length) {
      html.dataset.spwCollectionAchievements = collection.achievements.join(' ');
    } else {
      delete html.dataset.spwCollectionAchievements;
    }
  };

  const emitReset = (reason = 'reset') => {
    if (!bus?.emit) return;
    bus.emit('spw:collection-updated', {
      reason,
      route: ctx.route || '',
      tier: 'singular',
      newKinds: [],
      distinctKinds: 0,
      achievements: [],
      newlyUnlocked: [],
      reset: true,
    });
  };

  // Short-lived token CSS can hook to celebrate a freshly discovered kind.
  const pulseFresh = (newKinds) => {
    if (!newKinds.length) return;
    html.dataset.spwCollectionFresh = newKinds.join(' ');
    window.clearTimeout(freshTimer);
    freshTimer = window.setTimeout(() => {
      delete html.dataset.spwCollectionFresh;
    }, FRESH_PULSE_MS);
  };

  const ingest = (detail, reason) => {
    const { kinds, tier } = readEventDiversity(detail);
    if (!kinds.length) return;

    const newKinds = [];
    for (const kind of kinds) {
      if (!(kind in collection.kinds)) newKinds.push(kind);
      collection.kinds[kind] = (collection.kinds[kind] || 0) + 1;
    }

    const route = detail.route || ctx.route || '';
    if (route && !collection.routes.includes(route)) {
      collection.routes.push(route);
    }

    if (tierRank(tier) > tierRank(collection.maxTier)) {
      collection.maxTier = tier;
    }

    const before = new Set(collection.achievements);
    const earned = evaluateAchievements(collection);
    const newlyUnlocked = earned.filter((id) => !before.has(id));
    collection.achievements = earned;
    collection.updatedAt = Date.now();

    writeCollection(store, collection);
    writeTokens();
    pulseFresh(newKinds);

    if (bus?.emit) {
      bus.emit('spw:collection-updated', {
        reason,
        route,
        tier,
        newKinds,
        distinctKinds: deriveState(collection).distinctKinds,
        achievements: collection.achievements,
        newlyUnlocked,
      });
      newlyUnlocked.forEach((id) => {
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        bus.emit('spw:achievement-unlocked', { id, label: def?.label || id, route });
      });
    }
  };

  const onRegions = (event) => ingest(event?.detail || {}, event?.detail?.reason || 'regions');

  // Paint whatever we already know immediately, then replay the boot-time
  // regions event this module may have mounted too late to hear live.
  writeTokens();
  if (bus?.recent) {
    const history = bus.recent('regions');
    const last = history[history.length - 1];
    if (last?.detail) ingest(last.detail, 'replay');
  }

  const unsubs = [];
  if (bus?.on) {
    unsubs.push(bus.on('spw:regions-profiled', onRegions));
    unsubs.push(bus.on('spw:regions-primed', onRegions));
  }

  const api = {
    get() {
      return { ...collection, kinds: { ...collection.kinds }, routes: [...collection.routes] };
    },
    reset(reason = 'reset') {
      collection = emptyCollection();
      removeCollection(store);
      writeTokens();
      delete html.dataset.spwCollectionFresh;
      emitReset(reason);
    },
  };
  if (typeof window !== 'undefined') window.spwComponentCollection = api;

  const cleanup = () => {
    unsubs.forEach((off) => {
      try { off(); } catch {}
    });
    window.clearTimeout(freshTimer);
    delete html.dataset.spwComponentCollectionInit;
    if (window.spwComponentCollection === api) delete window.spwComponentCollection;
  };

  ctx.addCleanup?.(cleanup);

  return {
    cleanup,
    refresh: () => writeTokens(),
    api,
  };
}
