/**
 * Fit reporting — two directions, because they catch different failures.
 *
 * A component can be broken in two ways that look alike in a screenshot and are
 * nothing alike in the DOM:
 *
 *   bottom-up   the content exceeds its own box. scrollWidth beats clientWidth,
 *               something is clipped or scrolling that should not be.
 *
 *   top-down    the container refuses the box the room its content minimally
 *               needs. The box is not overflowing — it has been starved, and
 *               the content compensates by folding.
 *
 * The distinction matters because the second failure is silent under the first
 * test. A lens rendered at 19px inside a 1199px parent had unbreakable labels
 * folding one character per line, and `scrollWidth > clientWidth` was false the
 * whole time: nothing overflowed, the text simply wrapped between letters. Only
 * comparing the rendered inline size against the element's own min-content
 * width shows it.
 *
 * Cost.
 *
 * Both questions are free. Every reading happens inside a ResizeObserver
 * callback where layout is already resolved for the frame, so nothing here
 * forces a reflow and the whole thing can run live rather than waiting for a
 * pre-deploy sweep.
 *
 * An earlier version measured intrinsic width to answer the top-down question
 * and cost a reflow per element — and did not work anyway: asking a starved
 * container what it minimally needs returns the starved answer, because its
 * children are already collapsed.
 *
 * Reports, never repairs. A fit report that fixed layout would hide the defect
 * it exists to surface, and would also be a layout system competing with the
 * stylesheets. This writes attributes and stops.
 */

const ATTR = Object.freeze({
  fit: 'data-spw-fit',
  reason: 'data-spw-fit-reason',
  afforded: 'data-spw-fit-afforded',
  needs: 'data-spw-fit-needs',
  /*
   * A layout demand, kept separate from the report and deliberately sticky.
   *
   * A frame that overflows its column can be given the full width — but then it
   * fits, the report clears, the width is withdrawn, and it overflows again.
   * That oscillation is the reason a measurement must not directly drive the
   * layout it measures.
   *
   * So the demand only ever escalates. Once a frame has shown it needs the
   * width it keeps it for the session, and a reload re-decides from scratch.
   */
  demand: 'data-spw-fit-demand',
});

/**
 * Height-to-width ratio past which a horizontal row has clearly folded.
 * A control row is wider than it is tall by design; 2.5x the other way is not a
 * tight fit, it is a column of characters.
 */
const FOLDED_ASPECT = 2.5;

/** Ignore sub-pixel noise; a 1px difference is not a finding. */
const SLACK_PX = 2;

/**
 * How far past its box content must reach before the layout should widen the
 * box rather than let it scroll. A little overflow is a scroller doing its job;
 * an eightfold overrun is content in the wrong column.
 */
const WIDE_DEMAND_RATIO = 1.35;

/**
 * Is this a row of things that were never meant to wrap?
 *
 * Children carrying `white-space: nowrap` in a horizontal flow are chips,
 * tokens, controls — content whose author asserted it should stay on one line.
 * Prose makes no such claim, which is what separates a starved control row from
 * a paragraph doing exactly what paragraphs do.
 */
function isUnwrappableRow(el) {
  const kids = [...el.children];
  if (kids.length < 2) return false;
  const display = getComputedStyle(el).display;
  if (!display.includes('flex') && !display.includes('grid') && display !== 'block') return false;
  return kids.every((k) => getComputedStyle(k).whiteSpace.includes('nowrap'));
}

/**
 * Classify one element. Returns null when nothing is wrong, so a caller can
 * clear rather than write a passing state onto every element on the page.
 */
export function reportFit(el) {
  if (!(el instanceof (globalThis.HTMLElement || Object))) return null;

  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null; // display:none is not a fit failure

  // Bottom-up: content larger than the box it was given.
  const overflowsInline = el.scrollWidth > el.clientWidth + SLACK_PX;
  const overflowsBlock = el.scrollHeight > el.clientHeight + SLACK_PX;

  const overflowing = overflowsInline || overflowsBlock;

  /*
   * Top-down first, because a starved box also overflows and `scrollWidth` is
   * nearly useless once it has — it reported 22px for a lens whose content
   * wanted roughly 500, having already folded to one character per line.
   *
   * Intrinsic width cannot answer this. Measuring the container's min-content
   * returns 7px, because its children are themselves already collapsed and
   * their own layout is broken; asking a starved box what it needs gets the
   * starved answer back.
   *
   * Two free readings do answer it. A row whose children all declare
   * `white-space: nowrap` was authored to stay on one line, and a row rendering
   * far taller than it is wide has failed to. Neither costs a reflow, so this
   * runs live rather than waiting for a sweep.
   */
  if (rect.width > 0 && rect.height / rect.width >= FOLDED_ASPECT && isUnwrappableRow(el)) {
    return {
      fit: 'starved',
      reason: 'unwrappable-row-folded',
      afforded: Math.round(rect.width),
      // What one child needs on its line — a floor for the real requirement,
      // and honest that it is a floor rather than the full row width.
      needs: Math.round(Math.max(...[...el.children].map((k) => k.scrollWidth), 0)),
    };
  }

  if (overflowing) {
    return {
      fit: 'overflowing',
      reason: overflowsInline ? 'content-wider-than-box' : 'content-taller-than-box',
      afforded: Math.round(rect.width),
      // Honest about its own limit: once content has folded, this understates.
      needs: Math.round(overflowsInline ? el.scrollWidth : el.scrollHeight),
    };
  }

  return null;
}

function write(el, report) {
  if (!report) {
    // The demand survives: it records what this element has needed, not what it
    // needs at this instant, and clearing it is what would start an oscillation.
    for (const [key, attr] of Object.entries(ATTR)) {
      if (key !== 'demand') el.removeAttribute(attr);
    }
    return false;
  }

  if (
    report.reason === 'content-wider-than-box'
    && report.afforded > 0
    && report.needs > report.afforded * WIDE_DEMAND_RATIO
  ) {
    el.setAttribute(ATTR.demand, 'wide');
  }
  el.setAttribute(ATTR.fit, report.fit);
  el.setAttribute(ATTR.reason, report.reason);
  el.setAttribute(ATTR.afforded, String(report.afforded));
  el.setAttribute(ATTR.needs, String(report.needs));
  return true;
}

/** Everything worth asking about fit. */
const FIT_SELECTOR = '[data-spw-kind], [data-spw-role], .site-frame, .frame-card, .mode-switch';

/**
 * Sweep a tree once and return the findings, for a console or a pre-deploy
 * check. `limit` caps the scan because the honest failure mode of a whole-page
 * sweep is freezing the tab, and a partial answer beats none.
 */
export function auditFit(root = document, { limit = 400 } = {}) {
  const targets = [...root.querySelectorAll(FIT_SELECTOR)].slice(0, limit);

  /*
   * Read everything, then write everything.
   *
   * Interleaving them froze the renderer: each write can change layout, so the
   * next element's measurement forces a fresh one, and 400 elements become 400
   * forced reflows with invalidation between each. Reading first means the
   * whole sweep sees one layout, and the writes afterwards invalidate once.
   */
  const reports = targets.map((el) => [el, reportFit(el)]);

  const found = [];
  for (const [el, report] of reports) {
    if (write(el, report)) found.push({ el, ...report });
  }
  return { scanned: targets.length, findings: found };
}

export function initFitReport(ctx = {}) {
  if (typeof document === 'undefined' || typeof ResizeObserver === 'undefined') return () => {};

  const seen = new Set();
  const observer = new ResizeObserver((entries) => {
    // Inside the callback layout is already resolved for this frame, so these
    // reads are free. Writes go to attributes only and cannot re-trigger layout.
    for (const entry of entries) write(entry.target, reportFit(entry.target));
  });

  const observe = (root = document) => {
    for (const el of root.querySelectorAll(FIT_SELECTOR)) {
      if (seen.has(el)) continue;
      seen.add(el);
      observer.observe(el);
    }
  };

  observe();

  const bus = ctx.bus || globalThis.__SPW_SITE__?.bus;
  const off = bus?.on?.('spw:runtime-refresh', () => observe()) || null;

  return () => {
    off?.();
    observer.disconnect();
    for (const el of seen) write(el, null);
    seen.clear();
  };
}

export const FIT_REPORT_CONTRACT = Object.freeze({
  attrs: ATTR,
  hysteresis: 'demand escalates only; a measurement never withdraws the room it asked for',
  directions: Object.freeze({
    'bottom-up': 'content exceeds box — free inside a ResizeObserver, runs live',
    'top-down': 'container starves box — costs a reflow, QA sweep only',
  }),
  rule: 'reports, never repairs',
});

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'fit-report',
  mount: (ctx) => initFitReport(ctx),
  describes: 'fit[component]{overflowing.starved}<diagnostic>',
  updates: [
    'diagnostic:data-spw-fit',
    'diagnostic:data-spw-fit-reason',
    'diagnostic:data-spw-fit-afforded',
    'diagnostic:data-spw-fit-needs',
  ],
  timingArc: 'idle-inspection',
  effectScope: 'local-dom',
});
