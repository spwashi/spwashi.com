/**
 * Unit checks for the deploy-time CSS delivery form (no DOM).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cssForDelivery, stripCssComments } from '../typed/css-delivery.mjs';

describe('css delivery form', () => {
  it('removes prose comments and indentation, not rules', () => {
    const source = [
      '/* ===',
      '   Frames — what this sheet dresses',
      '   === */',
      '@layer components {',
      '  /* a note */',
      '  .spw-frame > .a + .b {',
      '    inline-size: calc(100% - 2rem); /* trailing */',
      '  }',
      '}',
      '',
    ].join('\n');
    assert.equal(
      cssForDelivery(source),
      '@layer components {\n.spw-frame > .a + .b {\ninline-size: calc(100% - 2rem);\n}\n}\n',
    );
  });

  it('keeps strings and unquoted url() bodies verbatim', () => {
    const source = '.a::before { content: "/* not a comment */"; background: url(data:x/*y*/z); }';
    assert.equal(stripCssComments(source), source);
    assert.equal(stripCssComments(".a { content: '\\'/*'; } /* gone */"), ".a { content: '\\'/*'; } ");
  });

  it('keeps license, source-map, and provenance comments', () => {
    const kept = [
      '/*! license */',
      '/* /public/css/components/frames.css */',
      '/* public/css/tokens/core.css */',
      '/*# sourceMappingURL=debug.css.map */',
    ];
    for (const comment of kept) {
      assert.equal(stripCssComments(`${comment}\n.a{}`), `${comment}\n.a{}`);
    }
    assert.equal(stripCssComments('/* /public/css/frames.css is where */.a{}'), '.a{}');
  });

  it('treats an unterminated comment as running to the end', () => {
    assert.equal(stripCssComments('.a{} /* open'), '.a{} ');
  });
});
