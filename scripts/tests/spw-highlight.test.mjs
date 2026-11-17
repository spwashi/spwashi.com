import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { bracePairAt, highlightSpw, operatorTypeOf, tokenSpans } from '../../public/js/semantic/spw-highlight.js';
import { parse, roles } from '../../public/js/semantic/spw-workbench-reader.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_CSS = readFileSync(path.join(ROOT, 'public/css/components/spw-source.css'), 'utf8');
const COLORED_TYPES = new Set([...SOURCE_CSS.matchAll(/data-op="([a-z-]+)"/g)].map((m) => m[1]));
const parseTokens = (source) => parse(source, { eventPolicy: 'none' }).tokens;

const decode = (html) => html.replace(/<[^>]+>/g, '')
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');

/** Every <code class="language-spw"> block in the authored routes, with its file. */
function spwBlocks() {
  const files = execFileSync('git', ['grep', '-l', 'class="language-spw"', '--', '*.html', ':!dist*', ':!workers'], { cwd: ROOT, encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  return files.flatMap((file) => {
    const html = readFileSync(path.join(ROOT, file), 'utf8');
    return [...html.matchAll(/<pre[^>]*>\s*<code class="language-spw"[^>]*>([\s\S]*?)<\/code>/g)].map((m) => ({ file, source: decode(m[1]) }));
  });
}

describe('Spw highlighting shared by code blocks and the parser tool', () => {
  const blocks = spwBlocks();

  it('marks Spw blocks across the site, each plain text inside its <code>', () => {
    assert.ok(blocks.length >= 30, `${blocks.length} blocks`);
    for (const { file, source } of blocks) assert.ok(source.trim(), file);
  });

  it('gives every character of every block back, once and in order', () => {
    for (const { file, source } of blocks) {
      assert.equal(decode(highlightSpw(source, parseTokens(source))), source, `${file} (kernel tokens)`);
      assert.equal(decode(highlightSpw(source, roles(source))), source, `${file} (legacy roles)`);
    }
  });

  it('colors every mark it types: each data-op has a rule in spw-source.css', () => {
    const seen = new Set();
    for (const { source } of blocks) {
      for (const m of highlightSpw(source, parseTokens(source)).matchAll(/data-op="([a-z-]+)"/g)) seen.add(m[1]);
    }
    assert.ok(seen.size >= 8, [...seen].join(' '));
    for (const type of seen) assert.ok(COLORED_TYPES.has(type), `${type} has no color rule`);
  });

  it('reads marks by the site registry, particle aims distinctly, stream entries, and never a string or number as a mark', () => {
    assert.equal(operatorTypeOf('#>note', 'keyword'), 'frame');
    assert.equal(operatorTypeOf('#:layer', 'type'), 'layer');
    assert.equal(operatorTypeOf('#!intent', 'function'), 'action');
    assert.equal(operatorTypeOf('~#trait', 'property'), 'potential');
    assert.equal(operatorTypeOf('<<', 'operator'), 'stream');
    assert.equal(operatorTypeOf('>>', 'operator'), 'stream');
    assert.equal(operatorTypeOf('((', 'operator'), 'scene');
    assert.equal(operatorTypeOf('))', 'operator'), 'scene');
    assert.equal(operatorTypeOf('}', 'operator'), 'direction');
    assert.equal(operatorTypeOf('>', 'operator'), 'concept');
    assert.equal(operatorTypeOf('".x"', 'string'), '');
    assert.equal(operatorTypeOf('.5', 'number'), '');
  });

  it('highlights ^seed[Title] and ^seed["title"] without swallowing braces, and paints all four particle forms', () => {
    for (const source of [
      '^seed[Title]{\n  #>anchor #:layer #!intent ~#aspect\n  ~#expect(3:1) #[a, b] #~p #?q\n}',
      '^seed["title"]{\n  #>anchor #:layer #!intent ~#aspect\n}',
    ]) {
      const tokens = parseTokens(source);
      const html = highlightSpw(source, tokens);
      assert.equal(decode(html), source);
      assert.match(html, /data-op="integration">\^<\/span>seed<span[^>]*data-op="mode">\[<\/span>/);
      assert.match(html, /data-op="frame">#&gt;anchor<\/span>/);
      assert.match(html, /data-op="layer">#:layer<\/span>/);
      assert.match(html, /data-op="action">#!intent<\/span>/);
      assert.match(html, /data-op="potential">~#aspect<\/span>/);
      const open = source.indexOf('[');
      const close = source.indexOf(']');
      assert.deepEqual(bracePairAt(tokens, open), [open, close]);
      const paired = highlightSpw(source, tokens, { emphasize: new Set([open, close]) });
      assert.equal((paired.match(/spw-paired/g) || []).length, 2);
    }
    const standaloneHash = highlightSpw('#[a, b] #~p #?q', parseTokens('#[a, b] #~p #?q'));
    assert.equal((standaloneHash.match(/data-op="vibration">#<\/span>/g) || []).length, 3);
    const apposition = highlightSpw('~#expect(3:1)', parseTokens('~#expect(3:1)'));
    assert.match(apposition, /data-op="potential">~#expect<\/span><span[^>]*data-op="scene">\(<\/span><span class="spw-role-string">3:1<\/span><span[^>]*data-op="scene">\)<\/span>/);
    assert.ok(tokenSpans(parseTokens('~#expect(3:1)')).length >= 4);
  });

  it('pairs a brace with its partner under the caret across containers, capsules, streams, and n-ranges', () => {
    const source = '^"a"{ b = #[c, d] }';
    const tokens = parseTokens(source);
    const open = source.indexOf('{');
    const close = source.lastIndexOf('}');
    assert.deepEqual(bracePairAt(tokens, open), [open, close]);
    assert.deepEqual(bracePairAt(tokens, close + 1), [open, close], 'just after a closing brace');
    assert.equal(bracePairAt(tokens, source.indexOf('b')), null);
    const html = highlightSpw(source, tokens, { emphasize: new Set([open, close]) });
    assert.equal((html.match(/spw-paired/g) || []).length, 2);

    const stream = '^"s"{ >>[2026-11-06] note — x }\n((inner))';
    const streamTokens = parseTokens(stream);
    const braceOpen = stream.indexOf('{');
    const braceClose = stream.indexOf('}');
    assert.deepEqual(bracePairAt(streamTokens, braceOpen), [braceOpen, braceClose], 'orphan stream bullet >> does not close {');
    const nOpen = stream.indexOf('((');
    const nClose = stream.indexOf('))');
    assert.deepEqual(bracePairAt(streamTokens, nOpen), [nOpen, nClose]);
  });

  it('mounts on exactly the blocks it highlights', () => {
    const catalog = readFileSync(path.join(ROOT, 'public/js/runtime/catalog/feature.js'), 'utf8');
    assert.match(catalog, /id: 'spw-code',[\s\S]*?selector: 'pre > code\.language-spw',/);
  });
});
