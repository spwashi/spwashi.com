/**
 * Arrival shells — perceptibility as a potential difference, not an animation.
 *
 * .spw/caches/arrival-perceptibility-2026-08.spw measured the failure: 58
 * modules land on home over 17.3s and none of them announce themselves, so
 * arrival reads as one undifferentiated wash. Its own refusal names the trap in
 * the obvious fix — "do not give every module an entrance. Unconstrained
 * announcement is the same failure as unconstrained rotation." An entrance
 * budget applied by taste is still applied by taste; it will drift.
 *
 * So the budget is physical instead. The model:
 *
 *   shells      A page is a nucleus with charged shells. data-spw-liminality
 *               already bands them: entry, threshold, deep, projected, settled.
 *               A module arrives into the shell of the seat it lands in.
 *
 *   walls       A brace is a wall between fields. Potential exists only ACROSS
 *               a wall — between two shells at different charge. A page with
 *               one band has no interior, therefore no wall, therefore no
 *               potential, therefore nothing here may discharge. scripts/
 *               page-reasons.mjs measures this: 124 of 153 routes are flat.
 *               Those pages stay silent by physics rather than by veto, which
 *               is what keeps this from becoming a louder wash.
 *
 *   dielectric  Image-bearing anatomy holds charge without conducting it. High
 *               dielectric raises what a shell can hold before anything must be
 *               spent, so an image-rich seat discharges longer and more quietly;
 *               a bare seat discharges shorter and sharper. This is the
 *               metacognitive part: the material that makes a page able to mean
 *               something is the material that refuses to spend it on arrival.
 *
 *   grounding   Every discharge sediments into encounter memory and cannot
 *               repeat. This is the cache's stated falsification — "a new
 *               feature ships with an entrance animation but no encounter
 *               memory, so it announces itself on every visit forever."
 *
 * Reads attributes and walks ancestors; never measures. No getBoundingClientRect,
 * no getComputedStyle, nothing that forces style recalc on a mount path — the
 * arrival path is exactly the hot path that must not do that.
 *
 * The visual half is public/css/systems/arrival-electrostatics.css. This module
 * writes tokens and gets out of the way.
 */

import { readJson, writeJson } from '/public/js/kernel/storage-utils.js';

const STORAGE_KEY = 'spw-arrival-grounded';

/** Ordered outward from the nucleus; index is the shell number. */
export const SHELL_BANDS = Object.freeze([
  'entry',
  'threshold',
  'deep',
  'projected',
  'settled',
]);

const ATTR = Object.freeze({
  shell: 'data-spw-arrival-shell',
  discharge: 'data-spw-arrival-discharge',
  dielectric: 'data-spw-arrival-dielectric',
  field: 'data-spw-arrival-field',
  potential: '--spw-arrival-potential',
});

/** Seats whose material stores rather than conducts. */
const DIELECTRIC_SELECTOR = [
  'figure',
  '[data-spw-image-reward]',
  '[data-spw-image-discovery]',
  '[data-spw-image-surface]',
  '[data-spw-image-prominence]',
  '.topic-photo-card',
  '.image-study',
  '.frame-card-media',
].join(',');

/** How long a discharge is legible, before and after dielectric weighting. */
const DISCHARGE_BASE_MS = 900;
const DISCHARGE_DIELECTRIC_MS = 700;

let field = null;
let grounded = null;
let unsubscribe = null;
const dischargedShells = new Set();
const pending = new Set();

function readGrounded() {
  if (grounded) return grounded;
  const stored = readJson(STORAGE_KEY, null, { requireObject: true });
  grounded = stored && typeof stored === 'object' ? stored : {};
  return grounded;
}

function groundDischarge(surface, key) {
  const store = readGrounded();
  const forSurface = store[surface] || (store[surface] = {});
  forSurface[key] = (forSurface[key] || 0) + 1;
  try {
    writeJson(STORAGE_KEY, store);
  } catch {
    // Storage is untrusted and optional; a failed write only means the
    // discharge may repeat next visit, which is degradation, not breakage.
  }
}

function isGrounded(surface, key) {
  return Boolean(readGrounded()[surface]?.[key]);
}

/**
 * Survey the page's shell structure once. Every read here is an attribute or a
 * selector match against static authored markup — none of it is layout.
 */
export function surveyArrivalField(doc = document) {
  const body = doc.body;
  if (!body) return null;

  const bands = new Map();
  for (const node of doc.querySelectorAll('[data-spw-liminality]')) {
    const band = node.getAttribute('data-spw-liminality');
    if (!SHELL_BANDS.includes(band)) continue;
    bands.set(band, (bands.get(band) || 0) + 1);
  }

  // A wall is a boundary between fields. Braces are the authored form of one;
  // a region that declares its purpose is the other. Both must exist between
  // *different* shells for potential to develop, so band count gates them.
  const braces = doc.querySelectorAll('[data-spw-form="brace"]').length;
  const purposes = doc.querySelectorAll('[data-spw-region-purpose]').length;
  const dielectrics = doc.querySelectorAll(DIELECTRIC_SELECTOR).length;

  const shellCount = bands.size;
  const wallCount = shellCount > 1 ? braces + purposes : 0;

  return {
    surface: body.dataset.spwSurface || 'default',
    bands: Object.fromEntries(bands),
    shellCount,
    braces,
    purposes,
    wallCount,
    dielectrics,
    // No wall, no potential. This is the whole constraint, in one boolean.
    conductive: wallCount > 0,
    suppressed: readSuppression(doc),
  };
}

/**
 * Reasons never to discharge, regardless of potential. Capture mode matters
 * because pages get screenshotted and interpreted elsewhere — a transient
 * flourish caught mid-frame reads as a rendering artifact in the capture.
 */
function readSuppression(doc) {
  const html = doc.documentElement;
  const body = doc.body;
  if (body?.dataset?.spwCaptureMode && body.dataset.spwCaptureMode !== 'default') return 'capture';
  if (html?.dataset?.spwEnhancementLevel === 'minimal') return 'minimal';
  try {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return 'reduced-motion';
  } catch {
    // matchMedia absent (non-browser host); nothing to suppress.
  }
  return '';
}

/** Roots that are the page itself rather than a place within it. */
const PLACELESS = new Set(['HTML', 'BODY', 'MAIN']);

/**
 * The place that arrived. Page-wide roots return null: a module rooted at body
 * changed everything and therefore nothing, and has no seat to charge.
 */
function seatOf(root) {
  if (!(root instanceof Element)) return null;
  if (PLACELESS.has(root.tagName)) return null;
  return root;
}

/** Which shell does this seat sit in? Ancestor walk, nearest band wins. */
function shellOf(node) {
  const host = node?.closest?.('[data-spw-liminality]');
  const band = host?.getAttribute('data-spw-liminality') || '';
  const index = SHELL_BANDS.indexOf(band);
  return index < 0 ? null : { band, index, host };
}

/**
 * Potential across the wall this arrival sits behind.
 *
 * Charge that a reader has already spent is charge that is no longer available:
 * a shell the page has discharged once this arrival is flat, and a shell
 * grounded on a previous visit is flat permanently. What remains is the
 * distance the arrival crosses — an outer-shell landing crosses more walls than
 * an entry-shell one and so develops more potential.
 */
function computePotential(shell, seat) {
  if (!field?.conductive) return 0;
  if (dischargedShells.has(shell.band)) return 0;

  // Distance from the nucleus, normalized over the bands this page actually
  // builds rather than over all five — a page with two bands can still develop
  // full potential across its own single wall.
  const built = Object.keys(field.bands)
    .map((band) => SHELL_BANDS.indexOf(band))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b);
  const innermost = built[0] ?? 0;
  const outermost = built[built.length - 1] ?? 0;
  const span = Math.max(1, outermost - innermost);
  const distance = (shell.index - innermost) / span;

  // Dielectric in the seat raises what it can hold, so the same distance
  // develops more potential in image-bearing material.
  const dielectric = seat?.closest?.(DIELECTRIC_SELECTOR) ? 1 : 0;

  return Math.min(1, distance * 0.75 + dielectric * 0.35);
}

/**
 * Spend the potential: mark the seat, let CSS render it, then clear and ground.
 * The seat is marked rather than the module, because what a reader perceives
 * is a place changing — not a bundle finishing.
 */
function discharge(seat, shell, potential, key) {
  const dielectric = seat.closest?.(DIELECTRIC_SELECTOR) ? 1 : 0;
  const duration = DISCHARGE_BASE_MS + dielectric * DISCHARGE_DIELECTRIC_MS;

  seat.setAttribute(ATTR.discharge, shell.band);
  // Written literally rather than through ATTR so the custom property stays
  // greppable from CSS and visible to the runtime contract checker.
  seat.style.setProperty('--spw-arrival-potential', potential.toFixed(3));
  if (dielectric) seat.setAttribute(ATTR.dielectric, 'held');

  dischargedShells.add(shell.band);

  const timer = setTimeout(() => {
    pending.delete(timer);
    seat.removeAttribute(ATTR.discharge);
    seat.removeAttribute(ATTR.dielectric);
    seat.style.removeProperty('--spw-arrival-potential');
  }, duration);
  pending.add(timer);

  groundDischarge(field.surface, key);
  return duration;
}

/**
 * Consider one arrival. Most arrivals do nothing here, which is the point:
 * the model is a filter, and a filter that passes everything is a wash.
 */
function considerArrival(detail) {
  if (!field || !field.conductive || field.suppressed) return null;

  const root = detail?.root;
  if (!(root instanceof Element)) return null;

  const baseId = detail.baseId || detail.id;
  if (!baseId) return null;

  // Grounded means this reader has already met this arrival here. It gets a
  // slot forever after, never a moment.
  if (isGrounded(field.surface, baseId)) return null;

  // A page-wide module has no seat, and a thing with no place cannot have a
  // moment. This drops most of the measured wash on its own: the majority of
  // the 58 home arrivals are rooted at body or main, and marking those would
  // flash the whole page — the loud-wash failure in a different costume.
  const seat = seatOf(root);
  if (!seat) return null;

  const shell = shellOf(seat);
  if (!shell) return null;

  const potential = computePotential(shell, seat);
  // Below breakdown the dielectric holds and nothing crosses. This threshold is
  // the one number here that is a taste call, and it is deliberately the only
  // one — everything else is derived from what the page is made of.
  if (potential < 0.5) return null;

  const duration = discharge(seat, shell, potential, baseId);
  return { module: baseId, band: shell.band, potential, duration };
}

export function initArrivalShells(ctx = {}) {
  const bus = ctx.bus || globalThis.__SPW_SITE__?.bus;
  if (!bus?.on || typeof document === 'undefined') return () => {};

  field = surveyArrivalField();
  if (!field) return () => {};

  dischargedShells.clear();

  // Publish the field even when it is inert, so "why did nothing happen here"
  // is answerable from the page rather than from this source file.
  document.documentElement.setAttribute(
    ATTR.field,
    field.suppressed ? `suppressed:${field.suppressed}` : (field.conductive ? 'conductive' : 'flat'),
  );

  const off = bus.on('spw:module-mounted', (event) => {
    considerArrival(event?.detail || event);
  });

  unsubscribe = () => {
    off?.();
    for (const timer of pending) clearTimeout(timer);
    pending.clear();
    document.documentElement.removeAttribute(ATTR.field);
  };
  return unsubscribe;
}

/** What the field is, why it is inert if it is, and what has spent so far. */
export function describeArrivalField() {
  return {
    ...(field || { conductive: false, reason: 'not initialized' }),
    discharged: [...dischargedShells],
    groundedHere: Object.keys(readGrounded()[field?.surface] || {}),
  };
}

/** Forget grounding for this surface, so a discharge can be seen again. */
export function resetArrivalGrounding(surface = field?.surface) {
  const store = readGrounded();
  if (surface) delete store[surface];
  else grounded = {};
  try {
    writeJson(STORAGE_KEY, surface ? store : {});
  } catch {
    // See groundDischarge: a failed write degrades repeat-suppression only.
  }
  dischargedShells.clear();
}

export const ARRIVAL_SHELLS_CONTRACT = Object.freeze({
  bands: SHELL_BANDS,
  attrs: ATTR,
  storageKey: STORAGE_KEY,
  rule: 'no wall, no potential, no discharge; one discharge per shell per arrival; every discharge grounds',
  breakdownThreshold: 0.5,
});

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'arrival-shells',
  mount: (ctx) => initArrivalShells(ctx),
  describes: 'arrival[shell]{potential.wall.dielectric.discharge}',
  updates: [
    'html:structural:data-spw-arrival-field',
    'flourish:data-spw-arrival-discharge',
    'flourish:data-spw-arrival-dielectric',
    'measure:--spw-arrival-potential',
  ],
  timingArc: 'compose-arrival',
  effectScope: 'root-state local-dom storage bus',
});
