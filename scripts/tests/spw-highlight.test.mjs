import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { bracePairAt, highlightSpw, operatorTypeOf } from '../../public/js/semantic/spw-highlight.js';
import { parse, roles } from '../../public/js/semantic/spw-workbench-reader.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_CSS = readFileSync(path.join(ROOT, 'public/css/components/spw-source.css'), 'utf8');
const COLORED_TYPES = new Set([...SOURCE_CSS.matchAll(/data-op="([a-z-]+)"/g)].map((m) => m[1]));

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
      assert.equal(decode(highlightSpw(source, roles(source))), source, file);
    }
  });

  it('colors every mark it types: each data-op has a rule in spw-source.css', () => {
    const seen = new Set();
    for (const { source } of blocks) {
      for (const m of highlightSpw(source, roles(source)).matchAll(/data-op="([a-z-]+)"/g)) seen.add(m[1]);
    }
    assert.ok(seen.size >= 8, [...seen].join(' '));
    for (const type of seen) assert.ok(COLORED_TYPES.has(type), `${type} has no color rule`);
  });

  it('reads marks by the site registry, a stream entry as the stream, and never a string or number as a mark', () => {
    assert.equal(operatorTypeOf('#>note', 'keyword'), 'frame');
    assert.equal(operatorTypeOf('#:layer', 'type'), 'layer');
    assert.equal(operatorTypeOf('>>', 'operator'), 'stream');
    assert.equal(operatorTypeOf('}', 'operator'), 'direction');
    assert.equal(operatorTypeOf('>', 'operator'), 'concept');
    assert.equal(operatorTypeOf('".x"', 'string'), '');
    assert.equal(operatorTypeOf('.5', 'number'), '');
  });

  it('pairs a brace with its partner under the caret, and lights both', () => {
    const source = '^"a"{ b = #[c, d] }';
    const { tokens } = parse(source);
    const open = source.indexOf('{');
    const close = source.lastIndexOf('}');
    assert.deepEqual(bracePairAt(tokens, open), [open, close]);
    assert.deepEqual(bracePairAt(tokens, close + 1), [open, close], 'just after a closing brace');
    assert.equal(bracePairAt(tokens, source.indexOf('b')), null);
    const html = highlightSpw(source, roles(source), { emphasize: new Set([open, close]) });
    assert.equal((html.match(/spw-paired/g) || []).length, 2);
  });

  it('mounts on exactly the blocks it highlights', () => {
    const catalog = readFileSync(path.join(ROOT, 'public/js/runtime/catalog/feature.js'), 'utf8');
    assert.match(catalog, /id: 'spw-code',[\s\S]*?selector: 'pre > code\.language-spw',/);
  });
});
