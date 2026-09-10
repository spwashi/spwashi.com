/**
 * Bottom-up alignment probe.
 *
 * The composition box model already lets a component measure itself, but it is
 * egocentric: readBoxModel reads one element's rect, padding, border, and
 * overflow, and nothing in that module ever names an ancestor. Every panel on
 * the home opening reports a healthy box while their left edges ladder at four
 * different offsets, because nothing compares one box to the box that contains
 * it or to the boxes beside it.
 *
 * This probe adds the relation. It runs in the page, walks the laid-out tree
 * bottom-up, and reports where edges *nearly* agree.
 *
 * The near-miss rule is what keeps the output small enough to act on:
 *
 *   delta == 0        aligned. Say nothing.
 *   0 < delta <= NEAR alignment that someone meant and missed. Report it.
 *   delta > NEAR      an indent, a nest, a deliberate offset. Say nothing.
 *
 * A tool that reports every difference reports the whole page. A tool that
 * reports near-misses reports mistakes, because nobody chooses a 3px inset.
 *
 * Two edges are tracked per element and kept apart in the output:
 *   - frame edge   (border box) — what the eye sees when a surface is painted
 *   - content edge (border + padding) — where the text actually starts
 * A card family can agree on one and disagree on the other; that difference is
 * the finding, not noise.
 */

export const ALIGNMENT_DEFAULTS = Object.freeze({
  /** Deltas at or under this (CSS px) are treated as missed alignment. */
  nearMissPx: 6,
  /** Below this, a delta is sub-pixel rounding, not a decision anyone made. */
  floorPx: 1,
  /** Ignore boxes narrower than this; chips and icons align by other rules. */
  minInlineSize: 48,
  /** Cap the scan so a long route cannot produce an unreadable report. */
  maxElements: 1500,
  /** Only report a shared-edge cluster once this many elements land in it. */
  minClusterSize: 2,
});

/**
 * Builds the in-page probe expression.
 *
 * Returns an IIFE string for Runtime.evaluate. Everything below the boundary
 * runs in the page and may not close over anything from this module.
 */
export function buildAlignmentProbeExpression(options = {}) {
  const config = { ...ALIGNMENT_DEFAULTS, ...options };
  return `(() => {
  const CONFIG = ${JSON.stringify(config)};

  const round = (n) => Math.round(n * 2) / 2;

  /** Stable, readable address for a node so a finding can be chased. */
  const describe = (el) => {
    if (el === document.body) return 'body';
    const id = el.id ? '#' + el.id : '';
    if (id) return el.tagName.toLowerCase() + id;
    const cls = (typeof el.className === 'string' ? el.className : '')
      .split(/\\s+/).filter(Boolean).slice(0, 2).map((c) => '.' + c).join('');
    const data = el.dataset && el.dataset.spwFeature
      ? '[data-spw-feature="' + el.dataset.spwFeature + '"]'
      : '';
    return el.tagName.toLowerCase() + cls + data;
  };

  const path = (el) => {
    const parts = [];
    let node = el;
    let hops = 0;
    while (node && node.nodeType === 1 && hops < 4) {
      parts.unshift(describe(node));
      node = node.parentElement;
      hops += 1;
    }
    return parts.join(' > ');
  };

  /**
   * The box an element is actually laid out against. offsetParent skips
   * static ancestors and goes null inside fixed chrome, so prefer the real
   * parent element and let the caller group by it.
   */
  const containerOf = (el) => el.parentElement;

  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;

  const measure = (el) => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    if (rect.width < CONFIG.minInlineSize) return null;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return null;
    const bl = parseFloat(cs.borderLeftWidth) || 0;
    const br = parseFloat(cs.borderRightWidth) || 0;
    const pl = parseFloat(cs.paddingLeft) || 0;
    const pr = parseFloat(cs.paddingRight) || 0;
    return {
      el,
      frameLeft: round(rect.left + scrollX),
      frameRight: round(rect.right + scrollX),
      contentLeft: round(rect.left + scrollX + bl + pl),
      contentRight: round(rect.right + scrollX - br - pr),
      top: round(rect.top + scrollY),
      width: round(rect.width),
      overflowX: el.scrollWidth > Math.ceil(el.clientWidth + 1),
      clipsX: cs.overflowX === 'clip' || cs.overflowX === 'hidden',
      display: cs.display,
      position: cs.position,
      // A wrapping flex row ends wherever the last item lands. That trailing
      // gap is a wrap remainder, not a missed alignment, so children of one
      // are exempt from the near-flush test on the inline axis.
      wraps: (cs.display === 'flex' || cs.display === 'inline-flex')
        && cs.flexWrap === 'wrap',
    };
  };

  // ---- collect -----------------------------------------------------------
  const all = Array.from(document.querySelectorAll('body *'));
  const boxes = [];
  for (const el of all) {
    if (boxes.length >= CONFIG.maxElements) break;
    // Inline text runs align by line box, not by edge; skip them.
    const cs = getComputedStyle(el);
    if (cs.display === 'inline') continue;
    const m = measure(el);
    if (m) boxes.push(m);
  }

  const byEl = new Map(boxes.map((b) => [b.el, b]));
  const findings = [];

  // ---- 1. near-flush against the containing box --------------------------
  // An element inset from its parent's content edge by a hair either meant to
  // be flush, or its parent's padding meant to be the inset. Either way one of
  // the two is wrong.
  for (const b of boxes) {
    const parent = containerOf(b.el);
    if (!parent) continue;
    const p = byEl.get(parent);
    if (!p) continue;
    if (b.position === 'fixed' || b.position === 'absolute') continue;
    if (p.wraps) continue;
    for (const [side, delta] of [
      ['left', b.frameLeft - p.contentLeft],
      ['right', p.contentRight - b.frameRight],
    ]) {
      const d = Math.abs(delta);
      if (d >= CONFIG.floorPx && d <= CONFIG.nearMissPx) {
        findings.push({
          kind: 'near-flush',
          side,
          delta: round(delta),
          child: path(b.el),
          container: path(parent),
          top: b.top,
        });
      }
    }
  }

  // ---- 2. sibling edge disagreement --------------------------------------
  // Block siblings in one container should share an edge. A spread of a few px
  // between them is a ladder nobody authored.
  const groups = new Map();
  for (const b of boxes) {
    const parent = containerOf(b.el);
    if (!parent) continue;
    if (b.position === 'fixed' || b.position === 'absolute') continue;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(b);
  }
  for (const [parent, kids] of groups) {
    if (kids.length < 2) continue;
    for (const edge of ['frameLeft', 'contentLeft']) {
      const vals = kids.map((k) => k[edge]);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const spread = round(max - min);
      if (spread >= CONFIG.floorPx && spread <= CONFIG.nearMissPx) {
        findings.push({
          kind: 'sibling-ladder',
          edge: edge === 'frameLeft' ? 'frame' : 'content',
          spread,
          count: kids.length,
          container: path(parent),
          members: kids.slice(0, 6).map((k) => ({ at: k[edge], node: describe(k.el) })),
          top: Math.min(...kids.map((k) => k.top)),
        });
      }
    }
  }

  // ---- 3. silent truncation ----------------------------------------------
  // An element overflowing inside a clipping ancestor is cut with no scrollbar
  // and no scrollWidth signal at the document level. The still shows a
  // sentence ending mid-word and nothing reports it.
  for (const b of boxes) {
    if (!b.overflowX) continue;
    let node = b.el.parentElement;
    let clipper = null;
    let hops = 0;
    while (node && hops < 12) {
      const m = byEl.get(node);
      if (m && m.clipsX) { clipper = node; break; }
      node = node.parentElement;
      hops += 1;
    }
    if (clipper) {
      findings.push({
        kind: 'clipped-overflow',
        overflowBy: round(b.el.scrollWidth - b.el.clientWidth),
        node: path(b.el),
        clippedBy: path(clipper),
        top: b.top,
      });
    }
  }

  // ---- 4. the page itself does not fit -----------------------------------
  // A still is clipped to the viewport, so a route that scrolls sideways looks
  // perfect in every screenshot ever taken of it. Only a measurement can say.
  // clientWidth is the layout viewport; scrollWidth is what the content asked
  // for. Report the gap and name the widest painted box as a starting point —
  // attribution is a hint, not a verdict, because inline boxes and transforms
  // contribute to scrollWidth in ways a rect does not show.
  const de = document.documentElement;
  const fits = de.clientWidth;
  const asked = de.scrollWidth;
  if (asked > fits + 1) {
    let widest = null;
    for (const b of boxes) {
      if (!widest || b.frameRight > widest.frameRight) widest = b;
    }
    findings.push({
      kind: 'page-overflow',
      overflowBy: round(asked - fits),
      fits,
      asked,
      widestPainted: widest ? { at: widest.frameRight, node: path(widest.el) } : null,
      note: widest && widest.frameRight < asked - 1
        ? 'no painted box reaches the scroll width — look for inline runs or transformed layout boxes'
        : null,
      top: 0,
    });
  }

  return {
    url: location.pathname,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    layoutViewport: fits,
    scrollWidth: asked,
    scanned: boxes.length,
    truncated: boxes.length >= CONFIG.maxElements,
    findings,
  };
})()`;
}

/**
 * Collapses raw findings into something a person can read: same kind, same
 * container, same magnitude is one report line with a count, not N lines.
 */
export function summarizeAlignment(report) {
  const buckets = new Map();
  for (const f of report.findings || []) {
    const key = [
      f.kind,
      f.container || f.clippedBy || '',
      f.side || f.edge || '',
      f.delta ?? f.spread ?? f.overflowBy ?? '',
    ].join('|');
    if (!buckets.has(key)) buckets.set(key, { ...f, occurrences: 0 });
    buckets.get(key).occurrences += 1;
  }
  const rows = [...buckets.values()];
  const weight = (f) => (f.kind === 'page-overflow' ? 5000 : 0)
    + (f.kind === 'clipped-overflow' ? 1000 : 0)
    + (f.occurrences * 10)
    + Math.abs(f.spread ?? f.delta ?? 0);
  rows.sort((a, b) => weight(b) - weight(a));
  return {
    url: report.url,
    viewport: report.viewport,
    scanned: report.scanned,
    total: (report.findings || []).length,
    distinct: rows.length,
    byKind: rows.reduce((acc, f) => {
      acc[f.kind] = (acc[f.kind] || 0) + f.occurrences;
      return acc;
    }, {}),
    rows,
  };
}
