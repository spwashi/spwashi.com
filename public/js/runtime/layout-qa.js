/**
 * layout-qa.js
 * --------------------------------------------------------------------------
 * Unified layout / packing / reflow / page-sizing snapshot for developers
 * and coding agents. Lazy-importable; zero cost until called.
 *
 * Surfaces:
 *   snapshotLayoutQa()           — full JSON report
 *   summarizeLayoutQa(report)    — one-line + checklist
 *   layoutQaRecipes()            — query strings + console recipes
 *
 * Pair with:
 *   ?debug=layout&log=layout-shift
 *   ?qa=screenshot-qa&debug=qa,layout,agent
 *   __SPW_SITE__.layoutQa.snapshot()
 */

import {
  snapshotCompositionBox,
  snapshotCompositionBoxes,
  SPW_COMPOSITION_BOX_MODEL_CONTRACT,
} from './composition-box-model.js';
import { snapshotLayoutAssumptions } from './layout-assumptions.js';
import {
  describeDebugQaPosture,
  readDebugQaPosture,
  SPW_DEBUG_QA_PRESETS,
} from './debug-qa-posture.js';

export const SPW_LAYOUT_QA_CONTRACT = Object.freeze({
  id: 'layout-qa',
  portableUse:
    'Call snapshotLayoutQa() from console or agent harness for packing, reflow, page size, and look-feel signals without mounting extra product UI.',
  recipes: Object.freeze({
    layoutDebug: SPW_DEBUG_QA_PRESETS.layout,
    screenshotQa: SPW_DEBUG_QA_PRESETS.screenshotQa,
    agentQa: SPW_DEBUG_QA_PRESETS.agentQa,
    packingInspect: SPW_DEBUG_QA_PRESETS.layoutInspect,
  }),
  composition: SPW_COMPOSITION_BOX_MODEL_CONTRACT,
});

function readCssPx(root, name, fallback = 0) {
  if (!root || !globalThis.getComputedStyle) return fallback;
  const raw = globalThis.getComputedStyle(root).getPropertyValue(name).trim();
  if (!raw) return fallback;
  if (raw.endsWith('px')) return Number.parseFloat(raw) || fallback;
  if (raw.endsWith('rem')) {
    const rem = Number.parseFloat(raw);
    const rootPx = Number.parseFloat(globalThis.getComputedStyle(root).fontSize) || 16;
    return (Number.isFinite(rem) ? rem : 0) * rootPx;
  }
  return Number.parseFloat(raw) || fallback;
}

function readCssVar(root, name) {
  if (!root || !globalThis.getComputedStyle) return '';
  return globalThis.getComputedStyle(root).getPropertyValue(name).trim();
}

function rectOf(el) {
  if (!(el instanceof Element)) return null;
  const r = el.getBoundingClientRect();
  return {
    x: Math.round(r.x),
    y: Math.round(r.y),
    width: Math.round(r.width),
    height: Math.round(r.height),
    top: Math.round(r.top),
    right: Math.round(r.right),
    bottom: Math.round(r.bottom),
    left: Math.round(r.left),
  };
}

function isOverflowing(el) {
  if (!(el instanceof HTMLElement)) return false;
  return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
}

/**
 * Viewport + route page-sizing posture (CSS layout variants + measure tokens).
 */
export function snapshotPageSizing(doc = document) {
  const html = doc.documentElement;
  const body = doc.body;
  const main = doc.querySelector('main');
  const vv = globalThis.visualViewport;
  const layout =
    body?.dataset?.spwLayout
    || main?.getAttribute?.('data-spw-layout')
    || html?.dataset?.spwLayout
    || 'default';

  const viewport = {
    innerWidth: globalThis.innerWidth || 0,
    innerHeight: globalThis.innerHeight || 0,
    devicePixelRatio: globalThis.devicePixelRatio || 1,
    visualWidth: vv?.width ?? null,
    visualHeight: vv?.height ?? null,
    scrollX: Math.round(globalThis.scrollX || 0),
    scrollY: Math.round(globalThis.scrollY || 0),
  };

  const tokens = {
    pageWidth: readCssVar(html, '--page-width'),
    pageWidthReading: readCssVar(html, '--page-width-reading'),
    pageWidthWide: readCssVar(html, '--page-width-wide'),
    pageWidthAtlas: readCssVar(html, '--page-width-atlas'),
    mainWidth: readCssVar(main || html, '--spw-main-width'),
    pageGutterInline: readCssVar(html, '--page-gutter-inline'),
    mainWidthPx: readCssPx(main || html, '--spw-main-width', 0),
  };

  const mainRect = rectOf(main);
  const measureBand =
    viewport.innerWidth < 320
      ? 'narrow'
      : viewport.innerWidth < 640
        ? 'comfortable'
        : viewport.innerWidth < 960
          ? 'wide'
          : 'atlas';

  return {
    layoutVariant: layout,
    route: body?.dataset?.spwSurface || html?.dataset?.spwSurface || doc.location?.pathname || '',
    pageState: html?.dataset?.spwPageState || '',
    mediumRegister: html?.dataset?.spwMediumRegister || '',
    interactionPosture: html?.dataset?.spwInteractionPosture || '',
    viewport,
    tokens,
    main: mainRect,
    measureBand,
    pointerCoarse: globalThis.matchMedia?.('(pointer: coarse)')?.matches ?? false,
    reducedMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
  };
}

/**
 * Packing + composition rollup from composition-box-model snapshots.
 */
export function snapshotPacking(root = document, options = {}) {
  const boxes = snapshotCompositionBoxes(root, options);
  const packLocal = boxes.filter((b) => b?.packLocal || b?.packLayout);
  const packLocalDom = root.querySelectorAll?.('[data-spw-pack-local]')?.length || 0;
  const overflowHosts = [];
  const presence = Object.create(null);
  const packLayouts = Object.create(null);
  const sizeContexts = Object.create(null);
  const contentTones = Object.create(null);

  for (const box of boxes) {
    const p = box.presence || 'unknown';
    presence[p] = (presence[p] || 0) + 1;
    if (box.packLayout) packLayouts[box.packLayout] = (packLayouts[box.packLayout] || 0) + 1;
    if (box.sizeContext) sizeContexts[box.sizeContext] = (sizeContexts[box.sizeContext] || 0) + 1;
    if (box.contentTone) contentTones[box.contentTone] = (contentTones[box.contentTone] || 0) + 1;
    if (box.box?.overflowX || box.box?.overflowY || box.presence === 'overfull') {
      overflowHosts.push({
        role: box.role,
        presence: box.presence,
        sizeContext: box.sizeContext,
        packLayout: box.packLayout || null,
        selector: box.selector || null,
        inlineSize: box.box?.inlineSize ?? null,
      });
    }
  }

  // Sample structural overflow on main frames (cheap; capped)
  const frameSample = Array.from(root.querySelectorAll?.('main .spw-frame, main [data-spw-kind="frame"]') || []).slice(0, 24);
  const overflowingFrames = frameSample.filter(isOverflowing).map((el) => ({
    id: el.id || null,
    kind: el.dataset?.spwKind || el.getAttribute('data-spw-kind') || 'frame',
    rect: rectOf(el),
  }));

  return {
    boxCount: boxes.length,
    packLocalDom,
    packLocalAnnotated: packLocal.length,
    presence,
    packLayouts,
    sizeContexts,
    contentTones,
    overflowHosts: overflowHosts.slice(0, 20),
    overflowingFrames,
    sample: boxes.slice(0, 8),
  };
}

function readLayoutShift(ctx = null) {
  try {
    const api = ctx?.layoutShiftAudit
      || globalThis.__SPW_SITE__?.runtimeCtx?.layoutShiftAudit
      || null;
    if (api?.snapshot) return api.snapshot();
  } catch {
    /* ignore */
  }
  const html = globalThis.document?.documentElement;
  if (!html?.dataset) return null;
  return {
    state: html.dataset.spwLayoutShiftState || null,
    outcome: html.dataset.spwLayoutShiftOutcome || null,
    count: Number(html.dataset.spwLayoutShiftCount || 0),
    totalValue: Number(html.dataset.spwLayoutShiftTotal || 0),
    lastValue: Number(html.dataset.spwLayoutShiftLast || 0),
    note: 'dataset-only — mount layout-shift-audit via ?debug=layout for full history',
  };
}

/**
 * Look-and-feel QA signals: structural, not pixel-perfect visual regression.
 */
export function evaluateLookFeel(page, packing, reflow, assumptions) {
  const checks = [];

  const push = (id, status, detail) => {
    checks.push({ id, status, detail });
  };

  // Page sizing
  if (page.main && page.main.width > 0) {
    const vw = page.viewport.innerWidth || 1;
    const ratio = page.main.width / vw;
    if (ratio > 0.98 && page.layoutVariant === 'reading') {
      push('page-width-reading', 'warn', 'reading layout main nearly full viewport — check gutters');
    } else {
      push('page-width-reading', 'pass', `main ${page.main.width}px · variant ${page.layoutVariant}`);
    }
  } else {
    push('page-width-main', 'warn', 'main rect missing');
  }

  // Packing opt-in density
  if (packing.packLocalDom === 0) {
    push('pack-local', 'info', 'no [data-spw-pack-local] on page — packing CSS idle');
  } else {
    push('pack-local', 'pass', `${packing.packLocalDom} pack-local host(s)`);
  }

  // Overflow
  const overflowN = (packing.overflowHosts?.length || 0) + (packing.overflowingFrames?.length || 0);
  if (overflowN > 0) {
    push('overflow', 'fail', `${overflowN} overflow/overfull signal(s)`);
  } else {
    push('overflow', 'pass', 'no sampled overflow/overfull');
  }

  // Reflow / CLS
  if (reflow?.totalValue != null) {
    const total = Number(reflow.totalValue) || 0;
    if (total >= 0.25) push('cls', 'fail', `CLS total ${total} (poor)`);
    else if (total >= 0.1) push('cls', 'warn', `CLS total ${total} (needs improvement)`);
    else push('cls', 'pass', `CLS total ${total}`);
  } else {
    push('cls', 'info', 'layout-shift not loaded — use ?debug=layout');
  }

  // Settled assumptions
  if (assumptions?.pass === 'fail' || (assumptions?.compromises?.length > 0 && assumptions?.pass === 'warn')) {
    push('assumptions', assumptions.pass === 'fail' ? 'fail' : 'warn', {
      pass: assumptions.pass,
      compromises: assumptions.compromises?.length || 0,
      refinements: assumptions.refinements?.length || 0,
    });
  } else if (assumptions) {
    push('assumptions', 'pass', {
      pass: assumptions.pass || 'ok',
      compromises: assumptions.compromises?.length || 0,
    });
  } else {
    push('assumptions', 'info', 'layout-assumptions not settled yet');
  }

  // Motion / medium
  if (page.reducedMotion) {
    push('reduced-motion', 'pass', 'prefers-reduced-motion: reduce');
  } else {
    push('reduced-motion', 'info', 'full motion allowed');
  }

  if (page.pointerCoarse) {
    push('pointer', 'info', 'coarse pointer — verify touch targets ≥ 44px');
  }

  // Presence overfull share
  const overfull = packing.presence?.overfull || 0;
  if (overfull > 0) {
    push('box-presence-overfull', 'warn', `${overfull} box(es) presence=overfull`);
  }

  const fails = checks.filter((c) => c.status === 'fail').length;
  const warns = checks.filter((c) => c.status === 'warn').length;
  const grade = fails > 0 ? 'fail' : warns > 0 ? 'warn' : 'pass';

  return { grade, checks, fails, warns };
}

/**
 * Full layout QA report for agents and DevTools.
 */
export function snapshotLayoutQa(options = {}) {
  const doc = options.document || globalThis.document;
  const root = options.root || doc;
  const ctx = options.ctx || null;

  const page = snapshotPageSizing(doc);
  const packing = snapshotPacking(root, options);
  const reflow = readLayoutShift(ctx);
  const assumptions = snapshotLayoutAssumptions();
  const lookFeel = evaluateLookFeel(page, packing, reflow, assumptions);

  const html = doc.documentElement;
  const rootDatasets = {
    pageState: html?.dataset?.spwPageState || null,
    layoutShiftState: html?.dataset?.spwLayoutShiftState || null,
    layoutAssumptionsPass: html?.dataset?.spwLayoutAssumptionsPass || null,
    layoutCorrection: html?.dataset?.spwLayoutCorrection || null,
    pageRegionRail: html?.dataset?.spwPageRegionRail || null,
    enhancementLevel: html?.dataset?.spwEnhancementLevel || null,
  };

  const debugQa = describeDebugQaPosture(readDebugQaPosture(null, doc));

  return {
    at: Date.now(),
    contract: SPW_LAYOUT_QA_CONTRACT.id,
    page,
    packing,
    reflow,
    assumptions,
    lookFeel,
    rootDatasets,
    debugQa,
    recipes: SPW_LAYOUT_QA_CONTRACT.recipes,
    href: doc.location?.href || '',
  };
}

export function summarizeLayoutQa(report = null) {
  const r = report || snapshotLayoutQa();
  const { lookFeel, page, packing, reflow } = r;
  const line = [
    `layoutQa ${lookFeel.grade}`,
    `variant=${page.layoutVariant}`,
    `band=${page.measureBand}`,
    `boxes=${packing.boxCount}`,
    `packLocal=${packing.packLocalDom}`,
    `cls=${reflow?.totalValue ?? 'n/a'}`,
    `fail=${lookFeel.fails} warn=${lookFeel.warns}`,
  ].join(' · ');
  return { line, grade: lookFeel.grade, checks: lookFeel.checks };
}

export function layoutQaRecipes() {
  return {
    ...SPW_LAYOUT_QA_CONTRACT.recipes,
    console: [
      '__SPW_SITE__.layoutQa.snapshot()',
      '__SPW_SITE__.layoutQa.summary()',
      '__SPW_SITE__.layoutQa.page()',
      '__SPW_SITE__.layoutQa.packing()',
      '__SPW_SITE__.composition.snapshot()',
      'spwCompose.qa.layout()',
      'spwCompose.logs("layout-shift")',
    ],
    agentProbe: [
      'Open route with ?debug=layout&log=layout-shift',
      'Wait for page enhanced / idle',
      'Call layoutQa.snapshot() and assert lookFeel.grade !== fail',
      'For packing: inspect packing.packLayouts + overflowHosts',
      'For reflow: require layout-shift module via debug flag; check reflow.totalValue < 0.1',
      'For assumptions: wait SETTLED; check assumptions.pass',
    ],
  };
}

/** Convenience: inspect one host packing/measure story. */
export function inspectLayoutTarget(target, options = {}) {
  const box = snapshotCompositionBox(target, options);
  const page = snapshotPageSizing();
  return {
    box,
    page: { layoutVariant: page.layoutVariant, measureBand: page.measureBand, viewport: page.viewport },
    rect: rectOf(target instanceof Element ? target : null),
  };
}
