/**
 * lens-reach.js — where a chosen seat lands on the page, read two ways.
 *
 * Declared: the page says a frame serves the seat (data-spw-lens-pass).
 * Parsed: the frame's own Spw leans toward the seat. Every handle in it is read
 * through the operator table (operator-detection.js), sigil text first and the
 * authored operator after, and the frame leans when the seat's operator is a
 * larger share of its handles than of the page's: a lift, not a raw share, so a
 * mark the whole page uses a lot does not make every frame lean.
 *
 * The two readings are kept apart rather than summed. Where they agree the page
 * and its Spw share ground; where only one holds, that is the edge, and both are
 * worth seeing. A frame carries the result as tokens on data-spw-lens-reach:
 * "declared", "parsed", or both. Nothing is written for the seat a page opens on.
 */

import { detectOperatorFromElement, getOperatorDefinition } from '/public/js/kernel/operator-detection.js';

export const LENS_REACH_ATTR = 'data-spw-lens-reach';
// A frame leans when the seat's mark is at least this many times its page share,
// carried by at least this many handles; one handle is a coincidence.
export const LENS_REACH_LIFT = 1.8;
export const LENS_REACH_MIN_HANDLES = 2;

const FRAME_SELECTOR = 'section.spw-frame[id]';
const HANDLE_SELECTOR = '[data-spw-operator]';

/** Pure: the reading of one frame, from its counts and the page's. */
export function classifyLensReach({ declared = false, count = 0, total = 0, pageCount = 0, pageTotal = 0 } = {}) {
  const share = total > 0 ? count / total : 0;
  const base = pageTotal > 0 ? pageCount / pageTotal : 0;
  const lift = base > 0 ? share / base : 0;
  const tokens = [];
  if (declared) tokens.push('declared');
  if (count >= LENS_REACH_MIN_HANDLES && lift >= LENS_REACH_LIFT) tokens.push('parsed');
  return { tokens, share, lift };
}

/** Pure: the words the lens feedback uses for a seat's reach. */
export function describeLensReachSummary({ declared = 0, parsed = 0, both = 0 } = {}) {
  const parts = [];
  if (declared) parts.push(`${declared} declared`);
  if (parsed) parts.push(`${parsed} ${parsed === 1 ? 'leans' : 'lean'} its way in ${parsed === 1 ? 'its' : 'their'} Spw`);
  if (both) parts.push(`${both} both`);
  return parts.join(', ');
}

function operatorTypeOf(element) {
  return detectOperatorFromElement(element)?.type || '';
}

/** Whether the page marks any place a seat serves; only such a page is read. */
export function pageTakesLensReach(doc = globalThis.document) {
  return Boolean(doc?.querySelector?.('[data-spw-lens-pass]'));
}

/**
 * Read every frame for one seat. `exclude` is the frame that holds the switch:
 * the reader is already there, and an outline on it would say nothing.
 */
export function readLensReach(doc = globalThis.document, { mode = '', operator = '', exclude = null } = {}) {
  const main = doc?.querySelector?.('main');
  const seatType = getOperatorDefinition(operator)?.type || '';
  if (!main || !mode || !seatType) return [];

  const pageTypes = [...main.querySelectorAll(HANDLE_SELECTOR)].map(operatorTypeOf).filter(Boolean);
  const pageCount = pageTypes.filter((type) => type === seatType).length;

  return [...main.querySelectorAll(FRAME_SELECTOR)]
    .filter((frame) => frame !== exclude)
    .map((frame) => {
      const types = [...frame.querySelectorAll(HANDLE_SELECTOR)].map(operatorTypeOf).filter(Boolean);
      const count = types.filter((type) => type === seatType).length;
      const declared = String(frame.getAttribute('data-spw-lens-pass') || '').split(/\s+/).includes(mode);
      return { frame, count, total: types.length, ...classifyLensReach({ declared, count, total: types.length, pageCount, pageTotal: pageTypes.length }) };
    });
}

export function writeLensReach(entries = []) {
  const summary = { declared: 0, parsed: 0, both: 0 };
  for (const { frame, tokens } of entries) {
    if (tokens.length) frame.setAttribute(LENS_REACH_ATTR, tokens.join(' '));
    else frame.removeAttribute(LENS_REACH_ATTR);
    const isDeclared = tokens.includes('declared');
    const isParsed = tokens.includes('parsed');
    if (isDeclared) summary.declared += 1;
    if (isParsed) summary.parsed += 1;
    if (isDeclared && isParsed) summary.both += 1;
  }
  return summary;
}

export function clearLensReach(doc = globalThis.document) {
  for (const frame of doc?.querySelectorAll?.(`[${LENS_REACH_ATTR}]`) || []) frame.removeAttribute(LENS_REACH_ATTR);
}
