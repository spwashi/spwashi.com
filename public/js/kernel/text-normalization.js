/**
 * text-normalization.js
 * --------------------------------------------------------------------------
 * Namespaced text and token normalization for the Spw kernel rhizosphere.
 *
 * Variants are intentionally separate. Do not collapse without reading the
 * contract in .spw/conventions/text-token-normalization.spw.
 */

/** Whitespace collapse for labels, copy, and operator expressions. */
export function collapseText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

/** @deprecated Prefer collapseText; kept for semantic-utils and shared.js parity. */
export const normalizeText = collapseText;

/** Lowercase phrase with separators softened to spaces. */
export function humanizeToken(value = '') {
  return collapseText(String(value).replace(/[_-]+/g, ' ')).toLowerCase();
}

/** Kebab-case semantic token for data-spw-* families and .spw keys. */
export function semanticToken(value = '') {
  return humanizeToken(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** @deprecated Prefer semanticToken. */
export const normalizeToken = semanticToken;

/** @deprecated Prefer semanticToken. */
export const normalizeSlug = semanticToken;

/** Module and feature identifiers; preserves underscore. */
export function runtimeToken(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** URL query and settings-query key normalization. */
export function queryKey(value = '') {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
}

/** Underscore slug for navigation spell tokens and frame handles. */
export function navSlug(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['".,!?()[\]/]+/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[–—-]+/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '') || 'token';
}

/** Lowercase token for whitespace-delimited presence / includes checks. */
export function presenceToken(value = '') {
  return String(value).trim().toLowerCase();
}

/** Anatomy tokens with quote stripping before semantic slugging. */
export function anatomyToken(value = '') {
  return semanticToken(
    collapseText(value)
      .toLowerCase()
      .replace(/['"]/g, '')
  );
}

export const TEXT = Object.freeze({
  collapse: collapseText,
});

export const TOKEN = Object.freeze({
  humanize: humanizeToken,
  semantic: semanticToken,
  runtime: runtimeToken,
  query: queryKey,
  nav: navSlug,
  presence: presenceToken,
  anatomy: anatomyToken,
});