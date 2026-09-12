/**
 * Spw Experiential Cohesion
 * ---------------------------------------------------------------------------
 * Purpose
 * - Orchestrates semantic depth across the static site through decomposed
 *   experiential organs: adaptive breadcrumbs, contextual memos, progressive
 *   operator learning, literate bookmarks, QA beat gestures, and the specimen dock.
 * - Respond to gesture/runtime events without overwhelming the interface.
 *
 * Design rules
 * - Prefer local memos over console spam.
 * - Use roomy surfaces when available; stay compact otherwise.
 * - Let route, active frame, mode, operator, and wonder category shape output.
 * - Keep everything optional and progressive.
 */

import { getActiveRecentPathMemory } from '/public/js/interface/accent-palette.js';
import { describeCognitiveState } from '/public/js/runtime/cognitive-state.js';
import { initBookmarkRegistry } from './experiential/bookmark-registry.js';
import { initContextualMemos } from './experiential/contextual-memos.js';
import { initOperatorLearning } from './experiential/operator-learning.js';
import { initQABeatGestures } from './experiential/qa-beat-gestures.js';
import {
  initSampleDock as initSampleDockOrgan,
  renderSampleDock,
  SPW_SAMPLE_DOCK_CONTRACT,
} from './experiential/sample-dock.js';
import {
  initSpellBreadcrumbs,
  renderBreadcrumbSpell,
  navigateSpellPathTarget,
  syncSpellPathHash,
  collectRelatedBreadcrumbRoutes,
  titleFromPath,
  slugify,
  humanizePathPart,
  ensureHeaderTraceHost,
  isTouchPrimary,
  getInteractionHint,
  SPW_BREADCRUMB_SPELL_CONTRACT,
} from './experiential/breadcrumb-spell.js';

/* ── Contracts ──────────────────────────────────────────────────────────── */

export const SPW_EXPERIENTIAL_CONTRACT = Object.freeze({
  id: 'experiential',
  organs: Object.freeze([
    'sample-dock',
    'breadcrumb-spell',
    'contextual-memos',
    'operator-learning',
    'bookmark-registry',
    'qa-beat-gestures',
  ]),
  mount: 'initSpwExperiential',
});

export {
  navigateSpellPathTarget,
  syncSpellPathHash,
  renderBreadcrumbSpell,
  renderSampleDock,
  SPW_SAMPLE_DOCK_CONTRACT,
  SPW_BREADCRUMB_SPELL_CONTRACT,
};

/* ── Runtime state ──────────────────────────────────────────────────────── */

const runtime = {
  headerMemo: null,
};

function ensureHeaderMemo(traceHost) {
  let headerMemo = traceHost.querySelector('.spw-experience-memo');
  if (!headerMemo) {
    headerMemo = document.createElement('div');
    headerMemo.className = 'spw-experience-memo';
    headerMemo.setAttribute('aria-live', 'polite');
    headerMemo.hidden = true;
    traceHost.appendChild(headerMemo);
  }
  return headerMemo;
}

/** Context bundle passed to extracted organs so they can use shared helpers. */
function buildOrganContext() {
  return {
    isTouchPrimary,
    getInteractionHint,
    ensureHeaderTraceHost,
    collectRelatedBreadcrumbRoutes,
    titleFromPath,
    slugify,
    humanizePathPart,
  };
}

/* ── Cognitive Copy Hooks ───────────────────────────────────────────────── */

export function syncExperientialSurface() {
  const surface = document.body?.dataset.spwSurface || 'root';
  updateCognitiveCopyHooks(surface);
}

function updateCognitiveCopyHooks(surface = document.body?.dataset.spwSurface || 'root') {
  const note = document.querySelector('[data-spw-page-hook="settings-cognitive-note"]');
  if (!(note instanceof HTMLElement)) return;

  const cognitiveState = describeCognitiveState({
    signalCount: document.querySelectorAll(
      '.operator-chip[data-spw-grounded="true"], .frame-sigil[data-spw-grounded="true"], .spell-ingredient[data-spw-grounded="true"]'
    ).length,
    recentPath: getActiveRecentPathMemory(),
    currentPath: window.location.pathname,
    currentSurface: surface,
    pageArrival: document.documentElement.dataset.spwPageArrival || '',
    pageTransitionPhase: document.documentElement.dataset.spwPageTransitionPhase || '',
    pageLiminality: document.body?.dataset.spwLiminality || '',
  });
  const narrationMode = document.documentElement.dataset.spwMeaningMode || 'readable';

  const lead =
    cognitiveState.familiarity === 'fresh'
      ? 'The page starts <strong>fresh</strong>: keep it calm until you need more handles.'
      : cognitiveState.familiarity === 'familiar'
        ? 'The page is becoming <strong>familiar</strong>: the shape can show a little more of itself without getting louder.'
        : cognitiveState.familiarity === 'practiced'
          ? 'The page feels <strong>practiced</strong>: you can return without rebuilding the route from scratch.'
          : cognitiveState.familiarity === 'fluent'
            ? 'The page is <strong>fluent</strong> enough to expose more of its internal grammar.'
            : 'The page is <strong>habitual</strong>: the same surface can stay readable while you customize it with confidence.';

  const liminality =
    cognitiveState.liminality === 'entry'
      ? 'You are at an <strong>entry</strong> seam.'
      : cognitiveState.liminality === 'threshold'
        ? 'You are at a <strong>threshold</strong>, where extra detail can appear without overwhelming the page.'
        : cognitiveState.liminality === 'settled'
          ? 'The surface is <strong>settled</strong> and ready for calm reuse.'
          : cognitiveState.liminality === 'nested'
            ? 'The surface is <strong>nested</strong> enough to hold deeper controls.'
            : cognitiveState.liminality === 'projected'
              ? 'The surface is <strong>projected</strong> and visible enough for inspection.'
              : 'The surface is <strong>deep</strong>: it can keep more of its mechanics visible.';

  const meaning =
    narrationMode === 'inspect'
      ? 'Inspect mode keeps the scaffold visible so the same shape is easier to learn.'
      : narrationMode === 'quiet'
        ? 'Quiet mode keeps the surface lean while preserving the return path.'
        : 'Readable mode keeps the page calm while still leaving room for stronger handles when you want them.';

  note.innerHTML = `${lead} ${liminality} ${meaning}`;
}

/* ── Orchestrator Mount ─────────────────────────────────────────────────── */

export function initSpwExperiential() {
  if (document.documentElement.dataset.spwExperientialInit === 'true') {
    renderBreadcrumbSpell();
    renderSampleDock();
    syncExperientialSurface();
    return {
      cleanup() {},
      refresh() {
        renderBreadcrumbSpell();
        renderSampleDock();
        syncExperientialSurface();
      },
    };
  }

  document.documentElement.dataset.spwExperientialInit = 'true';

  const header = document.querySelector('header');
  if (header) {
    const traceHost = ensureHeaderTraceHost(header);
    runtime.headerMemo = ensureHeaderMemo(traceHost);
  }

  initSpellBreadcrumbs({
    ensureHeaderTraceHost,
    onUpdate: () => {
      renderSampleDock();
      syncExperientialSurface();
    },
  });

  if (document.body?.dataset.spwFeatures?.split(/\s+/).includes('shell-trace')) {
    initSampleDockOrgan(buildOrganContext());
  }

  initContextualMemos({ getHeaderMemo: () => runtime.headerMemo });
  initOperatorLearning({ getHeaderMemo: () => runtime.headerMemo });
  initBookmarkRegistry();
  initQABeatGestures();
  syncExperientialSurface();

  return {
    cleanup() {},
    refresh() {
      renderBreadcrumbSpell();
      renderSampleDock();
      syncExperientialSurface();
    },
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'experiential',
  contract: SPW_EXPERIENTIAL_CONTRACT,
  describes: 'gesture[tap|hold|swipe] spell[cauldron] learning[intuition]',
  mount: (ctx, root) => initSpwExperiential(ctx, root),
  refresh: () => {
    renderBreadcrumbSpell();
    renderSampleDock();
    syncExperientialSurface();
  },
});

export const spwModule = SPW_MODULE_EXPORT;

export default initSpwExperiential;
