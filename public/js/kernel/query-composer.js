/**
 * query-composer.js
 * ---------------------------------------------------------------------------
 * Modular, readable Spw query vocabulary. URLs always serialize with readable
 * keys; SPW_QUERY_LEGACY_ALIASES accepts older abbreviated links on parse only.
 */

/** @deprecated Import SPW_QUERY_LEGACY_ALIASES — short keys are parse-only. */
export const SPW_QUERY_SHORT_KEYS = Object.freeze({
  v: 'view',
  m: 'meaning',
  i: 'interaction',
  l: 'lens',
  c: 'condense',
  p: 'precipitate',
  shot: 'screenshot',
  pal: 'palette',
  lyt: 'layout',
  pos: 'explore-posture',
  den: 'component-density',
  spc: 'spacing',
  sem: 'semantic-density',
  enh: 'enhancement',
  dbg: 'debug',
  diag: 'diagnostics',
  rt: 'runtime-timing',
});

export const SPW_QUERY_LEGACY_ALIASES = SPW_QUERY_SHORT_KEYS;

export const SPW_QUERY_CANONICAL_ORDER = Object.freeze([
  'view',
  'meaning',
  'interaction',
  'lens',
  'pack',
  'layout',
  'explore-posture',
  'posture',
  'component-density',
  'density',
  'spacing',
  'semantic-density',
  'enhancement',
  'stance',
  'variant',
  'condense',
  'precipitate',
  'screenshot',
  'palette',
  'physics',
  'debug',
  'diagnostics',
  'log',
  'log-level',
  'runtime-timing',
  'reflow',
]);

const LEGACY_KEY_SET = new Set(Object.keys(SPW_QUERY_LEGACY_ALIASES));

export function expandQueryKey(key = '') {
  const raw = String(key || '').trim();
  if (!raw) return '';
  if (LEGACY_KEY_SET.has(raw)) return SPW_QUERY_LEGACY_ALIASES[raw];
  return raw;
}

export function expandQueryParams(params = {}) {
  const next = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    const expanded = expandQueryKey(key);
    if (!expanded) return;
    next[expanded] = String(value);
  });
  return next;
}

export function composeSpwQuery(...blocks) {
  return expandQueryParams(Object.assign({}, ...blocks.filter(Boolean)));
}

export function serializeSpwQuery(params = {}, { omit = [] } = {}) {
  const expanded = expandQueryParams(params);
  const omitted = new Set((omit || []).map((key) => expandQueryKey(key)));
  const keys = [
    ...SPW_QUERY_CANONICAL_ORDER.filter((key) => key in expanded && !omitted.has(key)),
    ...Object.keys(expanded).filter((key) => !SPW_QUERY_CANONICAL_ORDER.includes(key) && !omitted.has(key)).sort(),
  ];

  const search = new URLSearchParams();
  keys.forEach((key) => {
    search.set(key, expanded[key]);
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export function normalizeQuerySearch(search = '') {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const expanded = new URLSearchParams();

  params.forEach((value, key) => {
    const outKey = expandQueryKey(key);
    if (!outKey) return;
    if (!expanded.has(outKey)) expanded.set(outKey, value);
  });

  const query = expanded.toString();
  return query ? `?${query}` : '';
}

export function parseModularQuery(search = '') {
  const normalized = normalizeQuerySearch(search);
  const params = new URLSearchParams(normalized.replace(/^\?/, ''));
  const blocks = {};

  params.forEach((value, key) => {
    blocks[key] = value;
  });

  const readable = serializeSpwQuery(blocks);

  return {
    params: blocks,
    search: normalized,
    href: readable,
    readable,
  };
}

export function buildSpwQueryHref(pathname = '/', blocks = {}, hash = '') {
  const query = serializeSpwQuery(composeSpwQuery(blocks));
  const safeHash = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
  return `${pathname}${query}${safeHash}`;
}