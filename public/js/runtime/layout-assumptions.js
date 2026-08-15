/**
 * layout-assumptions.js
 * --------------------------------------------------------------------------
 * Late layout pass: alignment checks, recorded compromises, and refinements.
 * Mounts on MOUNT_WHEN.SETTLED — after idle enhancements and page-enhanced.
 */

import {
  syncFloatingChromeState,
  writeRuntimeDatasetValues,
} from '/public/js/kernel/dom-contracts.js';
import { createSpwLogger, SPW_LOG_RELATIONSHIPS } from '/public/js/kernel/instrumentation.js';

const logger = createSpwLogger('spw-layout-assumptions', {
  role: 'layout',
  metaphor: 'surveyor-pass',
});

const MOBILE_QUERY = '(max-width: 720px), (pointer: coarse)';
const OVERLAP_GUTTER_PX = 6;
const CLEARANCE_TOLERANCE_PX = 18;

export const LAYOUT_ASSUMPTION_IDS = Object.freeze({
  BOTTOM_LANE_OVERLAP: 'bottom-lane-overlap',
  BOTTOM_LANE_UNMANAGED: 'bottom-lane-unmanaged',
  TRAVEL_ROW_COLLISION: 'travel-row-collision',
  CLEARANCE_DRIFT: 'clearance-drift',
  FLOATING_CHROME_CROWDED: 'floating-chrome-crowded',
  USER_SATCHEL_POSITION: 'user-satchel-position',
});

export const SPW_LAYOUT_ASSUMPTIONS_CONTRACT = Object.freeze({
  mountWhen: 'settled',
  events: Object.freeze({
    ready: 'spw:layout-assumptions-ready',
    updated: 'spw:layout-assumptions-updated',
  }),
  attributes: Object.freeze({
    active: 'data-spw-layout-assumptions-active',
    pass: 'data-spw-layout-assumptions-pass',
    compromises: 'data-spw-layout-assumptions-compromises',
    refinements: 'data-spw-layout-assumptions-refinements',
    correction: 'data-spw-layout-correction',
    elementCorrection: 'data-spw-layout-assumption-correction',
  }),
  portableUse:
    'Runs once the runtime is enhanced; records layout assumptions, compromises, and late correction tokens for ornament CSS.',
});

let lastReport = null;

function isMobileViewport() {
  return globalThis.matchMedia?.(MOBILE_QUERY)?.matches ?? false;
}

function rectsOverlap(a, b, gutter = OVERLAP_GUTTER_PX) {
  if (!a || !b) return false;
  return !(
    a.right <= b.left + gutter
    || a.left >= b.right - gutter
    || a.bottom <= b.top + gutter
    || a.top >= b.bottom - gutter
  );
}

function readPxVar(name, fallback = 0) {
  const root = globalThis.document?.documentElement;
  if (!root || !globalThis.getComputedStyle) return fallback;
  const raw = globalThis.getComputedStyle(root).getPropertyValue(name).trim();
  if (!raw) return fallback;
  if (raw.endsWith('px')) return Number.parseFloat(raw) || fallback;
  if (raw.endsWith('rem')) {
    const rem = Number.parseFloat(raw);
    const rootPx = Number.parseFloat(globalThis.getComputedStyle(root).fontSize) || 16;
    return rem * rootPx;
  }
  return fallback;
}

function measureBottomStackPx(doc) {
  const nodes = [
    doc.querySelector('.spw-console:not(.is-collapsed)'),
    doc.querySelector('.spw-section-handle-shell[data-spw-handle-state="visible"]'),
    doc.querySelector('.spw-section-handle[data-spw-handle-state="visible"]:not([hidden])'),
    doc.querySelector('[data-spw-state-inspector-root] .spw-state-inspector__launch'),
    doc.querySelector('[data-spw-state-inspector-root][data-spw-state-inspector="open"] .spw-state-inspector__panel:not([hidden])'),
    doc.querySelector('.spw-nav .spw-nav-strip'),
  ].filter((node) => node instanceof HTMLElement);

  const vh = globalThis.innerHeight || doc.documentElement.clientHeight || 0;
  let maxReach = 0;
  nodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    maxReach = Math.max(maxReach, vh - rect.top);
  });
  return maxReach;
}

function findTravelRowNodes(doc) {
  const handle = doc.querySelector('.spw-section-handle-shell[data-spw-handle-state="visible"]')
    || doc.querySelector('.spw-section-handle[data-spw-handle-state="visible"]:not([hidden])');
  const inspector = doc.querySelector('[data-spw-state-inspector-root]');
  const launch = inspector?.querySelector?.('.spw-state-inspector__launch');
  return { handle, launch, inspector };
}

function runAlignmentChecks(ctx, doc) {
  const html = doc.documentElement;
  const assumptions = [];
  const compromises = [];
  const refinements = [];

  const chrome = syncFloatingChromeState(doc, {
    source: 'layout-assumptions',
    reason: 'alignment-pass',
  });

  const bottomManaged = html.dataset.spwBottomLaneManaged === 'true';
  const competition = html.dataset.spwFloatingChromeCompetition || 'clear';
  const occlusion = html.dataset.spwFloatingChromeOcclusion || 'clear';

  if (bottomManaged) {
    assumptions.push('bottom-lane-managed');
  } else if (doc.querySelector('[data-spw-floating-chrome="true"]')) {
    compromises.push({
      id: LAYOUT_ASSUMPTION_IDS.BOTTOM_LANE_UNMANAGED,
      note: 'Floating chrome present without measured bottom lane.',
    });
  }

  if (competition === 'crowded' || occlusion === 'overlap') {
    compromises.push({
      id: LAYOUT_ASSUMPTION_IDS.FLOATING_CHROME_CROWDED,
      note: `Chrome competition=${competition}, occlusion=${occlusion}.`,
    });
    refinements.push({
      id: 'chrome-pressure-compact',
      correction: 'chrome-pressure',
      target: 'html',
    });
  }

  if (occlusion === 'overlap' && bottomManaged) {
    compromises.push({
      id: LAYOUT_ASSUMPTION_IDS.BOTTOM_LANE_OVERLAP,
      note: html.dataset.spwFloatingChromeOcclusionPairs || 'overlap detected',
    });
    refinements.push({
      id: 'bottom-lane-resync',
      correction: 'bottom-lane-nudge',
      target: 'html',
      apply: () => {
        syncFloatingChromeState(doc, {
          source: 'layout-assumptions',
          reason: 'overlap-refinement',
        });
      },
    });
  }

  const { handle, launch, inspector } = findTravelRowNodes(doc);
  if (isMobileViewport() && handle && launch) {
    const handleRect = handle.getBoundingClientRect();
    const launchRect = launch.getBoundingClientRect();
    if (rectsOverlap(handleRect, launchRect)) {
      compromises.push({
        id: LAYOUT_ASSUMPTION_IDS.TRAVEL_ROW_COLLISION,
        note: 'Section handle and satchel launch overlap on mobile travel row.',
      });
      refinements.push({
        id: 'travel-row-split',
        correction: 'travel-row-split',
        target: 'handle',
        apply: () => {
          if (html.dataset.spwBottomLaneHandle !== 'compact') {
            writeRuntimeDatasetValues(html, { spwBottomLaneHandle: 'compact' }, {
              source: 'layout-assumptions',
              reason: 'travel-row-split',
            });
          }
          handle.dataset.spwLayoutAssumptionCorrection = 'travel-row-split';
        },
      });
    }
  }

  if (inspector?.dataset?.spwSatchelPositioned === 'user') {
    compromises.push({
      id: LAYOUT_ASSUMPTION_IDS.USER_SATCHEL_POSITION,
      note: 'User-positioned satchel; lane split assumptions deferred.',
    });
  }

  const declaredClearance = readPxVar('--spw-bottom-chrome-clearance', 0);
  const measuredClearance = measureBottomStackPx(doc);
  if (
    measuredClearance > 0
    && declaredClearance > 0
    && Math.abs(measuredClearance - declaredClearance) > CLEARANCE_TOLERANCE_PX
  ) {
    compromises.push({
      id: LAYOUT_ASSUMPTION_IDS.CLEARANCE_DRIFT,
      note: `Declared ${Math.round(declaredClearance)}px vs measured ${Math.round(measuredClearance)}px.`,
    });
    refinements.push({
      id: 'clearance-measured',
      correction: 'clearance-measured',
      target: 'html',
      apply: () => {
        const px = Math.ceil(measuredClearance + 10);
        const rem = px / (Number.parseFloat(globalThis.getComputedStyle(html).fontSize) || 16);
        html.style.setProperty('--spw-bottom-chrome-clearance', `${rem.toFixed(3)}rem`);
        html.dataset.spwLayoutAssumptionCorrection = 'clearance-measured';
      },
    });
  }

  const mountedEnhancements = (ctx?.registry ? [...ctx.registry.values()] : [])
    .filter((record) => record.status === 'mounted' && record.layer === 'enhancement')
    .map((record) => record.id);
  assumptions.push(`enhancement-modules:${mountedEnhancements.length}`);

  const pass = compromises.length === 0
    ? 'clear'
    : refinements.length > 0
      ? 'refined'
      : 'compromise';

  return {
    pass,
    assumptions,
    compromises,
    refinements,
    chrome,
    mountedEnhancements,
  };
}

function applyRefinements(findings = {}) {
  const corrections = new Set();
  (findings.refinements || []).forEach((entry) => {
    if (!entry?.correction) return;
    corrections.add(entry.correction);
    entry.apply?.();
  });
  return [...corrections];
}

function writeAssumptionState(html, findings, corrections = []) {
  const compromiseIds = (findings.compromises || []).map((entry) => entry.id).filter(Boolean);
  writeRuntimeDatasetValues(html, {
    spwLayoutAssumptionsActive: 'true',
    spwLayoutAssumptionsPass: findings.pass || 'clear',
    spwLayoutAssumptionsCompromises: compromiseIds.join(' ') || null,
    spwLayoutAssumptionsRefinements: (findings.refinements || []).map((entry) => entry.id).join(' ') || null,
    spwLayoutCorrection: corrections.join(' ') || null,
    spwRuntimeMutator: 'layout-assumptions',
    spwRuntimeMutationReason: 'assumption-pass',
    spwRuntimeStylingAxis: 'layout-correction',
  }, {
    source: 'layout-assumptions',
    reason: 'assumption-pass',
  });
}

function waitForPaintSettle() {
  return new Promise((resolve) => {
    globalThis.requestAnimationFrame(() => {
      globalThis.requestAnimationFrame(resolve);
    });
  });
}

function waitForPageEnhanced(ctx) {
  const html = globalThis.document?.documentElement;
  if (html?.dataset?.spwPageState === 'enhanced') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      unsub?.();
      resolve();
    };
    const unsub = ctx?.bus?.on?.('spw:page-enhanced', finish);
    globalThis.setTimeout(finish, 4800);
  });
}

export function snapshotLayoutAssumptions() {
  return lastReport ? { ...lastReport } : null;
}

export function initLayoutAssumptions(ctx) {
  const doc = globalThis.document;
  const html = doc?.documentElement;
  if (!(html instanceof HTMLElement)) return () => {};

  let disposed = false;
  let resizeTimer = 0;

  const runPass = async (reason = 'settled-mount') => {
    if (disposed) return null;
    await waitForPageEnhanced(ctx);
    await waitForPaintSettle();

    const findings = runAlignmentChecks(ctx, doc);
    const corrections = applyRefinements(findings);
    writeAssumptionState(html, findings, corrections);

    lastReport = {
      at: Date.now(),
      reason,
      route: ctx?.route || '',
      ...findings,
      corrections,
    };

    ctx?.bus?.emit?.(SPW_LAYOUT_ASSUMPTIONS_CONTRACT.events.updated, lastReport);
    logger.debug(
      `layout assumptions ${findings.pass}`,
      {
        compromises: findings.compromises.length,
        refinements: findings.refinements.length,
        corrections,
      },
      SPW_LOG_RELATIONSHIPS.LIFECYCLE
    );

    return lastReport;
  };

  void runPass('initial');

  const onResize = () => {
    globalThis.clearTimeout(resizeTimer);
    resizeTimer = globalThis.setTimeout(() => {
      void runPass('viewport-resize');
    }, 180);
  };

  globalThis.window.addEventListener('resize', onResize, { passive: true });
  globalThis.window.visualViewport?.addEventListener?.('resize', onResize, { passive: true });

  return () => {
    disposed = true;
    globalThis.clearTimeout(resizeTimer);
    globalThis.window.removeEventListener('resize', onResize);
    globalThis.window.visualViewport?.removeEventListener?.('resize', onResize);
    writeRuntimeDatasetValues(html, {
      spwLayoutAssumptionsActive: null,
      spwLayoutAssumptionsPass: null,
      spwLayoutAssumptionsCompromises: null,
      spwLayoutAssumptionsRefinements: null,
      spwLayoutCorrection: null,
      spwRuntimeStylingAxis: null,
    }, {
      source: 'layout-assumptions',
      reason: 'teardown',
    });
    doc.querySelectorAll('[data-spw-layout-assumption-correction]').forEach((node) => {
      if (node instanceof HTMLElement) {
        delete node.dataset.spwLayoutAssumptionCorrection;
      }
    });
    lastReport = null;
  };
}