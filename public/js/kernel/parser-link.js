/**
 * parser-link.js — an address that opens the literal parser with a source.
 *
 * /tools/spw-parser/ reads spw_source and spw_source_name on arrival, so any
 * Spw on the site (a route's semantic expression, a region's seed, a module
 * contract, a folio reading) can be a plain link into the parser: it works
 * before any script, carries the source in the URL, and names it.
 */

export const PARSER_SOURCE_PARAM = 'spw_source';
export const PARSER_NAME_PARAM = 'spw_source_name';
/** Longer sources would make a URL hosts and chats truncate; the parser takes files for those. */
export const PARSER_LINK_MAX_SOURCE = 6000;

export function createParserAppUrl(source, name = '', base = globalThis.location?.origin || 'https://spwashi.com') {
  const url = new URL('/tools/spw-parser/', base);
  url.searchParams.set(PARSER_SOURCE_PARAM, String(source ?? ''));
  if (name) url.searchParams.set(PARSER_NAME_PARAM, String(name).slice(0, 120));
  url.hash = 'literal-parser';
  return url;
}

/** A root-relative href, or null when the source is too long to travel in a link. */
export function parserHref(source, name = '') {
  const text = String(source ?? '');
  if (!text.trim() || text.length > PARSER_LINK_MAX_SOURCE) return null;
  const url = createParserAppUrl(text, name, 'https://spwashi.com');
  return `${url.pathname}${url.search}${url.hash}`;
}
