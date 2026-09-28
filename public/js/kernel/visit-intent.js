/**
 * visit-intent.js — the intent a visit carries: one owner, many readers.
 *
 * A held lens seat writes it (runtime/page/lens-intent.js). Everything that wants
 * to meet the reader along it reads it here: the promo picks by it
 * (interface/discovery-notices.js, typed/promo-wonder-cycle.js) and lens
 * seats on other routes offer the matching seat. It is an operator, not a
 * mode name; the kernel resolves aliases, so "^ build" on Home and "^ syntax"
 * on Software are one intent.
 *
 * When nothing is carried, the page's own sat lens is the weaker reading of
 * why the reader is here. Carried outranks page; neither means say nothing.
 * Session-scoped: an intent belongs to a visit, and nothing learns who is
 * visiting. Contract: .spw/caches/intent-across-pages-2026-09.spw.
 */

import { getOperatorDefinition } from '/public/js/kernel/operator-detection.js';

export const INTENT_STORAGE_KEY = 'spw:intent:v1';

const PAGE_SEAT_SELECTOR = '.mode-switch .frame-sigil[data-set-mode][aria-pressed="true"][data-spw-operator]';

/** The intent record for an operator name, or null when the kernel has no such operator. */
export function intentFromOperator(name = '', { word = '', mode = '', from = '' } = {}) {
  const operator = getOperatorDefinition(name) || null;
  if (!operator) return null;
  return {
    operator: operator.type,
    sigil: operator.prefix || '',
    verb: operator.intent || '',
    word,
    mode,
    from,
    at: Date.now(),
  };
}

export function readCarriedIntent(storage = globalThis.sessionStorage) {
  try {
    const intent = JSON.parse(storage?.getItem(INTENT_STORAGE_KEY) || 'null');
    return intent?.operator ? intent : null;
  } catch {
    return null;
  }
}

export function writeCarriedIntent(intent, storage = globalThis.sessionStorage) {
  try {
    if (intent) storage?.setItem(INTENT_STORAGE_KEY, JSON.stringify(intent));
    else storage?.removeItem(INTENT_STORAGE_KEY);
  } catch {
    /* storage blocked: the carry lasts for this page only */
  }
}

/** The lens the reader sat on this page, read as an intent. */
export function readPageIntent(root = globalThis.document) {
  const seat = root?.querySelector?.(PAGE_SEAT_SELECTOR);
  if (!seat) return null;
  return intentFromOperator(seat.dataset.spwOperator || '', {
    word: (seat.textContent || '').trim(),
    mode: seat.dataset.setMode || '',
    from: 'page',
  });
}

/** Carried outranks page; null means nothing to meet the reader along. */
export function readVisitIntent(root = globalThis.document, storage = globalThis.sessionStorage) {
  return readCarriedIntent(storage) || readPageIntent(root);
}

/** "~ play", the way the site says an intent aloud. */
export function describeIntent(intent) {
  if (!intent) return '';
  return [intent.sigil, intent.verb || intent.operator].filter(Boolean).join(' ');
}
