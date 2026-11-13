/**
 * design-qa.mjs — what a design experiment's controls look like to a reader, measured in a real browser.
 *
 * Used by `npm run smoke:nav:design` (scripts/headless-nav.mjs --design). For each route it is
 * run at a desk viewport and at a phone with a coarse pointer, and it reads every control in
 * <main>: a link, a button, a summary, a form control.
 *
 * What it reports, and why each is measured the way it is:
 *   families   controls that share a face, size, weight, shape and fill. Many families means the
 *              eye cannot rank actions by look. Reported, never a fault.
 *   targets    a standalone control under 24 px tall is a fault (WCAG 2.5.8's floor; a labelled
 *              form control is measured by its label). Under 44 px
 *              on a coarse pointer is counted against the site's ground-control target and reported.
 *              A link inside running text is inline and exempt from both.
 *   contrast   text against the first ancestor background more than half opaque. Colours go
 *              through a canvas first, because the site computes them in color() and oklch()
 *              forms that a regex misreads. Over a gradient or an image the ratio is unknown, not
 *              a fault.
 *   focus      each control is focused with focusVisible and must draw an outline or a ring.
 *              Needs Emulation.setFocusEmulationEnabled, or a background tab draws nothing.
 *   overflow   the page scrolls sideways.
 *
 * The probe string runs in the page; summarizeDesign and designFaults are pure, so the
 * rules can be tested without a browser (scripts/tests/design-qa.test.mjs).
 */

export const DESIGN_VIEWPORTS = Object.freeze([
  Object.freeze({ name: 'desk', width: 1280, height: 900, deviceScaleFactor: 1 }),
  Object.freeze({ name: 'phone', width: 390, height: 844, deviceScaleFactor: 2, mobile: true, hasTouch: true, coarse: true }),
]);

export const TARGET_FLOOR_PX = 24;
export const TARGET_GROUND_PX = 44;
export const TEXT_CONTRAST_MIN = 4.5;

/** Runs in the page. Returns { overflowX, rows: [{ text, h, w, inline, family, contrast, focus }] }. */
export const DESIGN_PROBE = `(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const backdrop = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const c = rgba(s.backgroundColor);
      if (c[3] > 0.5) return c;
    }
    return [255, 255, 255, 1];
  };
  const isInline = (el) => {
    if (getComputedStyle(el).display !== 'inline') return false;
    const parent = el.parentElement;
    return !!parent && [...parent.childNodes].some((n) => n !== el && n.nodeType === 3 && n.textContent.trim());
  };
  const shape = (s, h) => { const r = parseFloat(s.borderTopLeftRadius) || 0; return r === 0 ? 'square' : r >= h / 3 ? 'pill' : 'rounded'; };
  const focusable = 'a[href], button, summary, input:not([type=hidden]), select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const rows = [];
  // A form control's target is its label when it has one: pressing the label works the control.
  const targetOf = (el) => (el.matches('input, select, textarea') && (el.closest('label') || (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')))) || el;
  for (const el of document.querySelectorAll('main ' + focusable.split(', ').join(', main '))) {
    const hit = targetOf(el);
    const r = hit.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (!r.width || !r.height || s.visibility === 'hidden' || s.display === 'none') continue;
    const bg = backdrop(el);
    const ink = rgba(s.color);
    // Translucent text is laid over its backdrop before it is measured.
    const fg = bg ? [0, 1, 2].map((i) => ink[i] * ink[3] + bg[i] * (1 - ink[3])) : ink;
    const a = lum(fg), b = bg ? lum(bg) : null;
    const contrast = b === null ? null : Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
    const before = document.activeElement;
    el.focus({ focusVisible: true, preventScroll: true });
    const fs = getComputedStyle(el);
    const ring = (fs.outlineStyle !== 'none' && parseFloat(fs.outlineWidth) > 0) || (fs.boxShadow && fs.boxShadow !== 'none');
    const focus = document.activeElement === el ? (ring ? 'drawn' : 'missing') : 'not-focusable';
    if (before && before.focus) before.focus({ preventScroll: true }); else el.blur();
    rows.push({
      text: (el.getAttribute('aria-label') || (hit !== el ? hit.textContent : el.textContent) || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 40),
      h: Math.round(r.height),
      w: Math.round(r.width),
      inline: isInline(el),
      family: [s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), s.fontSize, s.fontWeight, shape(s, r.height), rgba(s.backgroundColor)[3] > 0.1 ? 'filled' : 'bare'].join(' / '),
      contrast,
      focus,
    });
  }
  // clientWidth, not innerWidth: a phone's emulated viewport widens innerWidth to fit wide content.
  const root = document.documentElement;
  return { overflowX: root.scrollWidth > root.clientWidth + 1, rows };
})()`;

/**
 * @param {{ overflowX: boolean, rows: Array<{ text: string, h: number, inline: boolean, family: string, contrast: number | null, focus: string }> }} probe
 * @param {{ coarse?: boolean }} [viewport]
 */
export function summarizeDesign(probe, viewport = {}) {
  const rows = probe?.rows || [];
  const standalone = rows.filter((row) => !row.inline);
  const families = {};
  for (const row of rows) families[row.family] = (families[row.family] || 0) + 1;
  return {
    controls: rows.length,
    inline: rows.length - standalone.length,
    families: Object.keys(families).length,
    largestFamily: Math.max(0, ...Object.values(families)),
    belowFloor: standalone.filter((row) => row.h < TARGET_FLOOR_PX).map((row) => `${row.text || '(no text)'} ${row.h}px`),
    belowGround: viewport.coarse ? standalone.filter((row) => row.h < TARGET_GROUND_PX).length : null,
    lowContrast: rows.filter((row) => row.contrast !== null && row.contrast < TEXT_CONTRAST_MIN).map((row) => `${row.text || '(no text)'} ${row.contrast}:1`),
    contrastUnknown: rows.filter((row) => row.contrast === null).length,
    focusMissing: rows.filter((row) => row.focus === 'missing').map((row) => row.text || '(no text)'),
    overflowX: Boolean(probe?.overflowX),
  };
}

/** The findings that are faults rather than reports. */
export function designFaults(summary) {
  const faults = [];
  if (summary.overflowX) faults.push('scrolls sideways');
  for (const item of summary.belowFloor) faults.push(`target under ${TARGET_FLOOR_PX}px: ${item}`);
  for (const item of summary.lowContrast) faults.push(`text under ${TEXT_CONTRAST_MIN}:1: ${item}`);
  for (const item of summary.focusMissing) faults.push(`no focus ring: ${item}`);
  return faults;
}

/** One line per route and viewport, read on green. */
export function formatDesignLine(route, viewportName, summary) {
  const ground = summary.belowGround === null ? '' : ` · under ${TARGET_GROUND_PX}px ${summary.belowGround}`;
  const faults = designFaults(summary).length;
  return `${String(route).slice(0, 40).padEnd(40)} ${viewportName.padEnd(5)} controls ${String(summary.controls).padStart(3)} (${summary.inline} inline) · families ${summary.families} (largest ${summary.largestFamily})${ground} · contrast unknown ${summary.contrastUnknown} · ${faults ? `FAULTS ${faults}` : 'no faults'}`;
}
