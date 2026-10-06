/**
 * The page structure sensor on small fixtures (no routes read).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { auditPage } from '../audit-page-structure.mjs';

const page = (body) => `<body><main>\n${body}\n</main></body>`;
const kinds = (body) => auditPage('fixture.html', page(body)).map((f) => f.kind);

describe('page structure audit', () => {
  it('passes a closed frame and reads a capsule inside an attribute as part of the tag', () => {
    assert.deepEqual(kinds('<section id="a" data-spw-semantic-expression="a[b]{c}<d>"><h1>A</h1><p>one<p>two</section>'), []);
  });

  it('names a section that never closes and a close with nothing open', () => {
    const found = auditPage('fixture.html', page('<section id="a"><div></div>\n<section id="b"></section>\n</div>'));
    assert.deepEqual(found.map((f) => f.note), ['stray </div>', '<section> never closed before </main>']);
  });

  it('flags a capsule written as a raw tag', () => {
    assert.deepEqual(kinds('<a href="/x/">beat[unary]<offer></a>'), ['raw-capsule']);
  });

  it('flags a heading skip, a labelled section with no id, a sizeless image and an untyped button', () => {
    assert.deepEqual(
      kinds('<h1>A</h1><section aria-labelledby="part-title"><h3 id="part-title">B</h3><img src="/x.webp" alt=""><button>go</button></section>'),
      ['section-id', 'heading-skip', 'img-size', 'button-type', 'script-only'],
    );
  });

  it('names a button only a script can answer, by the hook it would read', () => {
    const found = auditPage('fixture.html', page([
      '<button type="button" class="spw-chip" data-spw-handle="true" data-site-setting-set="palette:hand">~hand</button>',
      '<form><button type="button" data-set-mode="a">a</button></form>',
      '<div hidden><button type="button" data-set-mode="b">b</button></div>',
      '<button type="button" hidden data-set-mode="c">c</button>',
      '<button type="button" popovertarget="tip">?</button>',
      '<button type="button" class="frame-sigil">x</button>',
    ].join('\n')));
    assert.deepEqual(found.map((f) => [f.kind, f.note]), [
      ['script-only', 'data-site-setting-set'],
      ['script-only', '.frame-sigil'],
    ]);
  });
});
