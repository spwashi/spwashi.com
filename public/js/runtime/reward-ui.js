/**
 * reward-ui.js
 * ---------------------------------------------------------------------------
 * The presentation layer for the component-collection / achievement system.
 *
 * component-collection.js owns the data (persisted kinds + achievement unlocks)
 * and emits `spw:collection-updated` / `spw:achievement-unlocked`. This module
 * renders that across three surfaces, as requested:
 *
 *   1. toasts        — transient achievement-unlock feedback
 *   2. docked window — a persistent, expandable collection chip in the
 *                      floating-chrome stack (occlusion-aware via slots)
 *   3. settings      — a full collection grid rendered into any
 *                      [data-spw-collection-panel] host (e.g. on /settings/)
 *
 * Mindfulness wired in per the brief:
 *   • Initial load / settling — the dock does not reveal until the page has
 *     settled (spw:page-hydrated), so a screenshot grabbed mid-arrival is calm.
 *   • Grok Imagine capture — built as floating chrome, so capture.css hides it
 *     in clean mode automatically; toasts are also suppressed during clean
 *     capture so an interpreted screenshot is never caught mid-pop.
 *   • Microinteractions / visual feedback — state lives in data-attributes
 *     (fresh pulse, expanded, toast enter/leave) for CSS to animate.
 *   • Physical model — each unlock emits a `charge:charged` pulse so the page's
 *     charge field physically responds to the reward.
 *   • Tunability — honours a `rewardDisplay` setting (docked | toasts | hidden)
 *     and `reduceMotion`; re-reads on settings change.
 *   • Easter eggs — settling reveals expose a `data-spw-reward-easter-egg` seam
 *     CSS can hook for rare-tier delight.
 */

import { annotateFloatingChromeElement } from '/public/js/kernel/dom-contracts.js';
import { el, clearChildren } from '/public/js/kernel/dom-render.js';
import { getSiteSettings } from '/public/js/kernel/site-settings.js';
import { ACHIEVEMENTS } from '/public/js/runtime/component-collection.js';
import { measureSpatialGravity } from '/public/js/runtime/spatial-gravity.js';

const TOAST_LINGER_MS = 4200;
const TOAST_LEAVE_MS = 360;
const MAX_TOASTS = 3;
const RARE_TIERS = new Set(['rich', 'teeming']);

const ACHIEVEMENT_LABEL = new Map(ACHIEVEMENTS.map((a) => [a.id, a.label]));

// ─── Salience mechanics ──────────────────────────────────────────────────────
// How loudly an easter-egg reveal announces itself. Salience is not fixed: it
// combines the reward's rarity, a page-declared base level, and where the reader
// currently sits in the attentional arc — so an egg stays quiet during arrival
// and only breathes once the reader is dwelling on a settled page.
const SALIENCE_LEVELS = Object.freeze(['subtle', 'notable', 'vivid']);
const SALIENCE_RANK = Object.freeze({ subtle: 0, notable: 1, vivid: 2 });
const ATTENTION_SALIENCE_SHIFT = Object.freeze({
  entering: -1,
  returning: 0,
  restored: 0,
  settled: 1,
  background: -2,
});

function clampSalience(rank) {
  return SALIENCE_LEVELS[Math.max(0, Math.min(SALIENCE_LEVELS.length - 1, rank))];
}

// Per-page base salience. Authors tune directly with data-spw-reward-salience on
// <body>; otherwise it's derived from the page zone so playful surfaces sparkle
// while funnel/reference surfaces stay restrained.
function readPageBaseSalience(body = document.body) {
  const explicit = body?.dataset?.spwRewardSalience;
  if (SALIENCE_LEVELS.includes(explicit)) return explicit;
  const zone = body?.dataset?.spwPageZone || '';
  if (zone === 'play' || zone === 'experiment') return 'vivid';
  if (zone === 'funnel' || zone === 'reference') return 'subtle';
  return 'notable';
}

function isCleanCapture() {
  const html = document.documentElement;
  return (html.dataset.spwCaptureMode || document.body?.dataset?.spwCaptureMode) === 'clean';
}

function readRewardDisplay() {
  try {
    const value = getSiteSettings()?.rewardDisplay;
    if (value === 'hidden' || value === 'toasts' || value === 'docked') return value;
  } catch {
    // settings module optional during early boot
  }
  return 'docked';
}

function prefersReducedMotion() {
  try {
    return getSiteSettings()?.reduceMotion === 'on'
      || document.documentElement.dataset.spwReduceMotion === 'on';
  } catch {
    return document.documentElement.dataset.spwReduceMotion === 'on';
  }
}

export function initRewardUI(ctx = {}) {
  const html = ctx.html || document.documentElement;
  const bus = ctx.bus || null;
  if (!html || html.dataset.spwRewardUiInit === '1') {
    return { cleanup() {}, refresh() {} };
  }
  html.dataset.spwRewardUiInit = '1';

  let display = readRewardDisplay();
  let settled = false;
  let attentionPhase = html.dataset.spwAttentionContext || 'settled';
  let latest = { distinctKinds: 0, tier: 'singular', achievements: [], newKinds: [] };
  const timers = new Set();
  const unsubs = [];

  // Combine page-base salience, rarity, and the current attentional arc into a
  // single level the easter-egg presentation reads from.
  const resolveSalience = (rare) => {
    const base = SALIENCE_RANK[readPageBaseSalience()] ?? 1;
    const attnShift = ATTENTION_SALIENCE_SHIFT[attentionPhase] ?? 0;
    return clampSalience(base + (rare ? 1 : 0) + attnShift);
  };

  // ─── Docked collection window ──────────────────────────────────────────────
  let dock = null;
  let dockTrigger = null;
  let dockCount = null;
  let dockBody = null;
  let dockExpanded = false;

  const removeDock = () => {
    dock?.remove();
    dock = null;
    dockTrigger = null;
    dockCount = null;
    dockBody = null;
    dockExpanded = false;
  };

  const buildDock = () => {
    if (dock) return;
    dock = el('div', 'spw-reward-dock');
    annotateFloatingChromeElement(dock, {
      role: 'collection-dock',
      tier: 'docked',
      mutator: 'reward-ui',
      reason: 'collection-dock',
      stylingAxis: 'reward-collection',
    });
    dock.setAttribute('aria-label', 'Component collection');
    dock.dataset.spwRewardReveal = 'pending';
    // Opt the dock into spatial gravity: the panel opens toward the roomier
    // side (upward from the bottom-center anchor) and its height caps to the
    // measured room above, scrolling past a ceiling instead of towering.
    dock.dataset.spwGravity = 'open';

    dockTrigger = el('button', 'spw-reward-dock-trigger', {
      type: 'button',
      'aria-expanded': 'false',
    });
    dockCount = el('span', 'spw-reward-dock-count');
    dockTrigger.append(
      el('span', { className: 'spw-reward-dock-glyph', text: '◇', 'aria-hidden': 'true' }),
      dockCount,
    );

    dockBody = el('div', 'spw-reward-dock-body', { hidden: true, dataset: { spwGravityReveal: 'collection' } });

    dockTrigger.addEventListener('click', () => toggleDock());
    dock.append(dockTrigger, dockBody);
    document.body.appendChild(dock);
    renderDock();
  };

  const toggleDock = (force) => {
    if (!dock || !dockBody || !dockTrigger) return;
    dockExpanded = typeof force === 'boolean' ? force : !dockExpanded;
    dockBody.hidden = !dockExpanded;
    dock.dataset.spwState = dockExpanded ? 'expanded' : 'collapsed';
    dockTrigger.setAttribute('aria-expanded', dockExpanded ? 'true' : 'false');
    if (dockExpanded) {
      renderDock();
      // Measure now so the panel opens the correct way on the first expand,
      // before the ResizeObserver would otherwise catch up a frame later.
      try { measureSpatialGravity(dock); } catch {}
    }
  };

  const renderCollectionInto = (host) => {
    clearChildren(host);
    const kinds = collectionKinds();
    const kindsRow = el('div', 'spw-reward-kinds');
    if (kinds.length) {
      kinds.forEach((kind) => {
        // data-spw-collected-kind, NOT data-spw-kind: the chip names a collected
        // specimen. Carrying the component-kind contract attribute would dress
        // the chip as a real component (frame layout, container queries).
        kindsRow.append(el('span', { className: 'spw-reward-kind', text: kind, dataset: { spwCollectedKind: kind } }));
      });
    } else {
      kindsRow.append(el('span', { className: 'spw-reward-kind is-empty', text: 'none yet' }));
    }

    const badges = el('ul', 'spw-reward-badges');
    ACHIEVEMENTS.forEach((a) => {
      const earned = latest.achievements.includes(a.id);
      badges.append(el('li', {
        className: 'spw-reward-badge',
        dataset: { spwAchievement: a.id, spwEarned: earned ? 'true' : 'false' },
        text: `${earned ? '✦' : '✧'} ${a.label}`,
      }));
    });

    const summary = el('p', { className: 'spw-reward-summary', text: `${kinds.length} kinds · ${latest.tier}` });
    const children = [summary, kindsRow, badges];
    const hasState = kinds.length > 0 || latest.achievements.length > 0 || latest.distinctKinds > 0;

    if (hasState) {
      const actions = el('div', 'spw-reward-actions');
      const reset = el('button', {
        className: 'operator-chip spw-reward-reset',
        type: 'button',
        text: '! clear collection',
        dataset: { spwCollectionReset: 'true' },
      });
      reset.addEventListener('click', () => resetCollection('reward-ui-reset'));
      actions.append(reset);
      children.push(actions);
    }

    host.append(...children);
  };

  const renderDock = () => {
    if (!dock || !dockCount) return;
    dockCount.textContent = `${latest.distinctKinds} · ${latest.tier}`;
    dock.dataset.spwRewardTier = latest.tier;
    if (dockExpanded) renderCollectionInto(dockBody);
  };

  // ─── Settings-surface panel (rendered into an author-placed host) ──────────
  const settingsHosts = () => Array.from(document.querySelectorAll('[data-spw-collection-panel]'));
  const renderSettingsPanels = () => settingsHosts().forEach(renderCollectionInto);

  const resetCollection = (reason = 'reward-ui-reset') => {
    const api = window.spwComponentCollection;
    if (api?.reset) {
      api.reset(reason);
      return;
    }

    cachedKinds = [];
    latest = { distinctKinds: 0, tier: 'singular', achievements: [], newKinds: [] };
    removeDock();
    renderSettingsPanels();
    bus?.emit?.('collection-updated', {
      reason,
      route: '',
      tier: 'singular',
      newKinds: [],
      distinctKinds: 0,
      achievements: [],
      newlyUnlocked: [],
      reset: true,
    });
  };

  // ─── Toast stack ───────────────────────────────────────────────────────────
  let toastStack = null;
  const buildToastStack = () => {
    if (toastStack) return;
    toastStack = el('div', 'spw-reward-toasts');
    annotateFloatingChromeElement(toastStack, {
      role: 'collection-toast-stack',
      tier: 'toast',
      mutator: 'reward-ui',
      reason: 'collection-toasts',
      stylingAxis: 'reward-collection',
    });
    toastStack.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastStack);
  };

  const popToast = (id, label, rare, salience = 'notable') => {
    if (display === 'hidden' || isCleanCapture()) return;
    buildToastStack();

    while (toastStack.children.length >= MAX_TOASTS) {
      toastStack.firstElementChild?.remove();
    }

    const toast = el('div', 'spw-reward-toast', {
      role: 'status',
      dataset: {
        spwAchievement: id,
        spwState: 'enter',
        spwRewardEasterEgg: rare ? 'rare' : null,
        spwRewardSalience: salience,
      },
    });
    toast.append(
      el('span', { className: 'spw-reward-toast-glyph', text: rare ? '✦' : '✧', 'aria-hidden': 'true' }),
      el('span', { className: 'spw-reward-toast-label', text: label }),
    );
    toastStack.appendChild(toast);

    // Next frame → settled state (CSS transition entry). Skip the dance for reduced motion.
    if (prefersReducedMotion()) {
      toast.dataset.spwState = 'settled';
    } else {
      requestAnimationFrame(() => { toast.dataset.spwState = 'settled'; });
    }

    const leave = window.setTimeout(() => {
      toast.dataset.spwState = 'leave';
      const remove = window.setTimeout(() => {
        toast.remove();
        timers.delete(remove);
      }, TOAST_LEAVE_MS);
      timers.add(remove);
      timers.delete(leave);
    }, TOAST_LINGER_MS);
    timers.add(leave);
  };

  // ─── Physical model: let the page feel the reward ──────────────────────────
  const pulsePhysicalModel = (rare) => {
    if (!bus?.emit) return;
    // The charge field listens to charge:* events; a reward is a small surge.
    bus.emit('charge:charged', {
      source: 'reward-ui',
      reason: 'achievement-unlocked',
      intensity: rare ? 0.85 : 0.5,
    });
  };

  // ─── Collectible bookkeeping bridge (read kinds from the persistent store) ──
  let cachedKinds = [];
  const collectionKinds = () => cachedKinds;

  const ingestCollection = (detail) => {
    const nextDistinctKinds = Number(detail.distinctKinds);
    const hasDistinctKinds = Number.isFinite(nextDistinctKinds);
    latest = {
      distinctKinds: hasDistinctKinds ? nextDistinctKinds : latest.distinctKinds,
      tier: detail.tier || latest.tier,
      achievements: Array.isArray(detail.achievements) ? detail.achievements : latest.achievements,
      newKinds: Array.isArray(detail.newKinds) ? detail.newKinds : [],
    };

    if (detail.reset) {
      cachedKinds = [];
    } else if (window.spwComponentCollection?.get) {
      cachedKinds = Object.keys(window.spwComponentCollection.get().kinds || {});
    }

    if (display === 'docked' && latest.distinctKinds > 0) {
      buildDock();
      // Fresh discovery → brief pulse the dock CSS can celebrate.
      if (latest.newKinds.length) {
        dock.dataset.spwCollectionFresh = latest.newKinds.join(' ');
        const clear = window.setTimeout(() => {
          if (dock) delete dock.dataset.spwCollectionFresh;
          timers.delete(clear);
        }, 2400);
        timers.add(clear);
      }
      revealDockIfSettled();
      renderDock();
    } else {
      removeDock();
    }
    renderSettingsPanels();
  };

  const onUnlock = (detail) => {
    const id = detail.id;
    const label = detail.label || ACHIEVEMENT_LABEL.get(id) || id;
    const rare = RARE_TIERS.has(latest.tier);
    const salience = resolveSalience(rare);
    popToast(id, label, rare, salience);
    pulsePhysicalModel(rare);
    // Easter-egg seam: a rare-tier unlock marks the document for a settling reveal,
    // carrying the resolved salience so page CSS can tune how vivid the reveal is.
    if (rare) {
      html.dataset.spwRewardEasterEgg = id;
      html.dataset.spwRewardSalience = salience;
      const clear = window.setTimeout(() => {
        if (html.dataset.spwRewardEasterEgg === id) {
          delete html.dataset.spwRewardEasterEgg;
          delete html.dataset.spwRewardSalience;
        }
        timers.delete(clear);
      }, 6000);
      timers.add(clear);
    }
  };

  // ─── Settling gate ─────────────────────────────────────────────────────────
  const revealDockIfSettled = () => {
    if (!dock || !settled) return;
    dock.dataset.spwRewardReveal = 'revealed';
  };

  const markSettled = () => {
    settled = true;
    revealDockIfSettled();
  };

  // ─── Tunability ────────────────────────────────────────────────────────────
  const applyDisplay = () => {
    display = readRewardDisplay();
    if (display !== 'docked' || latest.distinctKinds <= 0) {
      removeDock();
      return;
    }
    buildDock();
    revealDockIfSettled();
    renderDock();
  };

  // ─── Wire events ───────────────────────────────────────────────────────────
  if (bus?.on) {
    unsubs.push(bus.on('collection-updated', (e) => ingestCollection(e?.detail || {})));
    unsubs.push(bus.on('achievement-unlocked', (e) => onUnlock(e?.detail || {})));
    unsubs.push(bus.on('spw:page-hydrated', markSettled));
    // Track the attentional arc so easter-egg salience follows the reader.
    unsubs.push(bus.on('spw:page-attention-state', (e) => {
      const d = e?.detail || {};
      attentionPhase = d.phase || d.arrival || attentionPhase;
    }));
  }
  document.addEventListener('spw:settings-change', applyDisplay);

  // If the page is already past hydration when we mount (IDLE), treat as settled.
  if (html.dataset.spwPageState === 'present' || document.readyState === 'complete') {
    markSettled();
  }

  // Seed from the persistent store so a return visit paints the dock + settings
  // panel from saved state immediately, before any region event arrives.
  const stored = window.spwComponentCollection?.get?.();
  if (stored && Object.keys(stored.kinds || {}).length) {
    cachedKinds = Object.keys(stored.kinds);
    latest = {
      distinctKinds: cachedKinds.length,
      tier: stored.maxTier || 'singular',
      achievements: Array.isArray(stored.achievements) ? stored.achievements : [],
      newKinds: [],
    };
    if (display === 'docked') {
      buildDock();
      revealDockIfSettled();
      renderDock();
    }
  }

  // Replay the most recent collection snapshot so a late mount still paints.
  if (bus?.recent) {
    const history = bus.recent('collection-updated');
    const last = history[history.length - 1];
    if (last?.detail) ingestCollection(last.detail);
  }
  renderSettingsPanels();

  const cleanup = () => {
    unsubs.forEach((off) => { try { off(); } catch {} });
    document.removeEventListener('spw:settings-change', applyDisplay);
    timers.forEach((t) => window.clearTimeout(t));
    timers.clear();
    removeDock();
    toastStack?.remove();
    delete html.dataset.spwRewardUiInit;
    delete html.dataset.spwRewardEasterEgg;
    delete html.dataset.spwRewardSalience;
  };

  ctx.addCleanup?.(cleanup);

  return {
    cleanup,
    refresh: () => { renderDock(); renderSettingsPanels(); },
    toggleDock,
  };
}
