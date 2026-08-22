/**
 * Runtime parser for Spw — workbench kernel plus site join reading.
 *
 * The page is complete without this module. Boot does not import it. Console,
 * the literal parser tool, and join specimens load it on demand.
 *
 * Use `parse()`, not `parseExpression()`. The latter truncates identifier-led
 * noun forms. This site is a proof of concept while spw-workbench updates:
 * rival readings (list vs crawl vs project vs common) can be checked against
 * the kernel and against material/interaction surfaces here.
 */

import {
  parse as parseSeed,
  parseExpression,
  SPW_PARSER_BUILD,
} from '/public/js/semantic/spw-workbench-parser.js';
import { readJoinChain, shapeFromExpression } from '/public/js/semantic/expression-query.js';

export { SPW_PARSER_BUILD };

export const SPW_RUNTIME_PARSER_CONTRACT = Object.freeze({
  entry: 'parse',
  refuse: 'parseExpression truncates identifier-led noun forms',
  join: 'site-owned until workbench absorbs or refuses it',
  proof: 'this site is a source and proof of concept for workbench updates',
  sidecar: 'Dregg repos such as dragons-clutch keep .spw as curriculum beside the code',
  attrs: Object.freeze({
    join: 'data-spw-join',
  }),
  kinds: Object.freeze(['none', 'list', 'common', 'ordinal', 'project', 'crawl']),
});

export function parseSpw(source, options = {}) {
  const input = String(source ?? '');
  const join = readJoinChain(input);
  const shape = shapeFromExpression(input);
  const expressionEntry = options.expression === true;
  const output = expressionEntry
    ? parseExpression(input, options.parseOptions || {})
    : parseSeed(input, options.parseOptions || {});

  return {
    source: input,
    join,
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
