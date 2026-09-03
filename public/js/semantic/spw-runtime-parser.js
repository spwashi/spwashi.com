/**
 * Runtime parser for Spw — workbench kernel plus site join reading.
 *
 * The page is complete without this module. Boot does not import it. Console,
 * the literal parser tool, and join specimens load it on demand.
 *
 * `parse()` stays the default entry point below; `parseExpression()` used to
 * truncate identifier-led noun forms but no longer does as of workbench
 * 75d8f9d26253 (2026-09-03 rebuild, commit f3061c5 — the same fix that binds
 * same-line [frame]/{body}/<capsule> onto one Expression node instead of
 * juxtaposed Sequence items). Proof of concept realized: this file predicted
 * spw-workbench would absorb the gap, and it has. Rival readings (ident vs
 * crawl vs project vs common vs ordinal) can still be checked against the
 * kernel and against material/interaction surfaces here — that comparison
 * remains useful for catching any future disagreement, not just this one.
 */

import {
  parse as parseSeed,
  parseExpression,
  SPW_PARSER_BUILD,
} from '/public/js/semantic/spw-workbench-parser.js';
import {
  kernelJoinFromTokens,
  readJoinChain,
  shapeFromExpression,
} from '/public/js/semantic/expression-query.js';

export { SPW_PARSER_BUILD };

export const SPW_RUNTIME_PARSER_CONTRACT = Object.freeze({
  entry: 'parse',
  refuse: 'parse() is the general entry point; parseExpression() no longer truncates as of workbench 75d8f9d26253 but stays the narrower, single-expression form',
  join: 'site-owned until workbench absorbs or refuses it',
  proof: 'this site is a source and proof of concept for workbench updates — the parseExpression gap this contract named is the first one absorbed',
  sidecar: 'Dregg repos such as dragons-clutch keep .spw as curriculum beside the code',
  attrs: Object.freeze({
    join: 'data-spw-join',
  }),
  kinds: Object.freeze(['none', 'ident', 'list', 'common', 'ordinal', 'project', 'crawl']),
  process: 'parse() first; site join is a check against those tokens, not a second grammar',
});

export function parseSpw(source, options = {}) {
  const input = String(source ?? '');
  const join = readJoinChain(input);
  const shape = shapeFromExpression(input);
  const expressionEntry = options.expression === true;
  const output = expressionEntry
    ? parseExpression(input, options.parseOptions || {})
    : parseSeed(input, options.parseOptions || {});
  const kernel = kernelJoinFromTokens(output.tokens);

  return {
    source: input,
    join,
    kernel,
    shape,
    output,
    entry: expressionEntry ? 'parseExpression' : 'parse',
    build: SPW_PARSER_BUILD,
    contract: SPW_RUNTIME_PARSER_CONTRACT,
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'spw-runtime-parser',
  describes: 'parser[runtime]{join.seed.proof}<workbench>',
  updates: ['inspect:__SPW_SITE__.parser'],
});
