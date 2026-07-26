import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SPW_PARSER_BUILD } from '../../public/js/semantic/spw-workbench-parser.js';
import {
  createParserAppUrl,
  parseLiteralSource,
  SPW_LITERAL_PARSER_SAMPLES,
} from '../../public/js/modules/tools/spw-literal-parser.js';

describe('literal Spw parser proof', () => {
  it('uses a pinned workbench parser artifact', () => {
    assert.equal(SPW_PARSER_BUILD.package, 'spw-workbench');
    assert.match(SPW_PARSER_BUILD.version, /^\d+\.\d+\.\d+$/);
    assert.match(SPW_PARSER_BUILD.commit, /^[a-f0-9]{12}$/);
    assert.equal(SPW_PARSER_BUILD.source, 'packages/spw-seed/src/parser.ts');
  });

  it('produces a real AST and lossless token reconstruction', () => {
    const result = parseLiteralSource(SPW_LITERAL_PARSER_SAMPLES.contract);

    assert.equal(result.output.success, true);
    assert.equal(result.output.ast?.type, 'Seed');
    assert.ok(result.output.tokens.length > 10);
    assert.ok(result.astCensus.total > 5);
    assert.equal(result.reconstructsExactly, true);
    assert.equal(result.reconstruction, result.source);
  });

  it('keeps parser diagnostics and lossy reconstruction visible', () => {
    const result = parseLiteralSource('proof § unsupported_character');

    assert.ok(result.output.errors.length > 0);
    assert.equal(result.reconstructsExactly, false);
    assert.equal(result.source, 'proof § unsupported_character');
  });

  it('encodes exact source into an app-loadable route URL', () => {
    const source = 'proof[parser]{literal.ast.lossless}';
    const url = createParserAppUrl(source, 'proof.spw');

    assert.equal(url.pathname, '/tools/spw-parser/');
    assert.equal(url.searchParams.get('spw_source'), source);
    assert.equal(url.searchParams.get('spw_source_name'), 'proof.spw');
    assert.equal(url.hash, '#literal-parser');
  });
});
