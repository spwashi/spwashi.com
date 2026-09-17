/**
 * viewport.js
 * ---------------------------------------------------------------------------
 * One cached viewport box.
 *
 * innerWidth, innerHeight, and the visual viewport are layout-dependent reads:
 * each one forces style and layout against the full stylesheet when anything
 * has dirtied them, and during boot a dozen modules asked for the width on
 * their own schedule — region profiling, the shell tier, floating chrome,
 * popup placement. The viewport only changes on resize, orientation, and
 * visual-viewport moves, so it is read once and invalidated on those events.
 *
 * A view other than the page window (a test or a portable host) is measured
 * directly and never cached.
 */

const resolveView = () => (typeof globalThis.window === 'object' && globalThis.window ? globalThis.window : globalThis);

let cached = null;
let boundView = null;

function invalidate() {
  cached = null;
}

function bind(view) {
  if (boundView === view) return;
  boundView = view;
  if (typeof view.addEventListener !== 'function') return;
  view.addEventListener('resize', invalidate, { passive: true });
  view.addEventListener('orientationchange', invalidate, { passive: true });
  view.visualViewport?.addEventListener?.('resize', invalidate, { passive: true });
  view.visualViewport?.addEventListener?.('scroll', invalidate, { passive: true });
}

function measure(view) {
  const visual = view?.visualViewport;
  const innerWidth = view?.innerWidth || 0;
  const innerHeight = view?.innerHeight || 0;
  const offsetLeft = visual?.offsetLeft || 0;
  const offsetTop = visual?.offsetTop || 0;
  const width = Math.max(1, visual?.width || innerWidth || 1);
  const height = Math.max(1, visual?.height || innerHeight || 1);
  return Object.freeze({
    innerWidth,
    innerHeight,
    left: offsetLeft,
    top: offsetTop,
    right: offsetLeft + width,
    bottom: offsetTop + height,
    width,
    height,
  });
}

/**
 * The visual viewport box (falls back to the layout viewport), with the
 * layout viewport's inner size beside it.
 *
 * @param {any} [view]
 */
export function readViewportBox(view = resolveView()) {
  if (view !== resolveView()) return measure(view);
  bind(view);
  if (!cached) cached = measure(view);
  return cached;
}

/** The layout viewport's inline size — what `innerWidth` answers, cached. */
export function readViewportInlineSize(view = resolveView()) {
  return readViewportBox(view).innerWidth;
}

/** For a host that resizes the view without firing resize. */
export function invalidateViewportBox() {
  invalidate();
}
