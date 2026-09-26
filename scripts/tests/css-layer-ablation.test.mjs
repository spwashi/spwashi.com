/**
 * Unit checks for the layer splitter the layer-ablation probe serves (no Chrome).
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { ablateLayers, listLayers, splitTopLevelLayers } from '../lib/css-layer-blocks.mjs';

const SHEET = [
  '/* /public/css/reset/base.css */',
  '@layer reset {\n.a { color: red; }\n}',
  '/* note with a { brace */',
  '@layer tokens {\n:root { --x: "}"; }\n@media (min-width: 1px) { .b { color: blue; } }\n}',
  '@layer reset {\n.c { margin: 0; }\n}',
  '.unlayered { color: green; }',
].join('\n');

describe('css layer blocks', () => {
  it('splits top-level layer blocks, skipping braces in comments and strings', () => {
    const layers = splitTopLevelLayers(SHEET).map((s) => s.layer);
    assert.deepEqual(layers, [null, 'reset', null, 'tokens', null, 'reset', null]);
  });

  it('lists layers in first-appearance order', () => {
    assert.deepEqual(listLayers(SHEET), ['reset', 'tokens']);
  });

  it('drops a layer everywhere it opens and keeps the rest', () => {
    const out = ablateLayers(SHEET, { drop: ['reset'] });
    assert.ok(!out.includes('.a {') && !out.includes('.c {'));
    assert.ok(out.includes('--x: "}"') && out.includes('.unlayered'));
  });

  it('keeps only the named layers plus unlayered text', () => {
    const out = ablateLayers(SHEET, { only: ['tokens'] });
    assert.ok(out.includes('.b {') && out.includes('.unlayered'));
    assert.ok(!out.includes('.a {'));
  });

  it('the ?spw-layer-order=declared rail states the manifest order', async () => {
    const { EXPECTED_LAYER_ORDER } = await import('../typed/css-manifest.mjs');
    const prepaint = await readFile(new URL('../../public/js/runtime/prepaint-state.js', import.meta.url), 'utf8');
    assert.ok(prepaint.includes(`'@layer ${EXPECTED_LAYER_ORDER};'`));
  });

  it('round-trips the committed core bundle unchanged', async () => {
    const css = await readFile(new URL('../../public/css/bundles/core.css', import.meta.url), 'utf8');
    assert.equal(ablateLayers(css), css);
    const layers = listLayers(css);
    assert.ok(layers.includes('components') && layers.includes('tokens'));
    for (const layer of layers) {
      assert.ok(ablateLayers(css, { drop: [layer] }).length < css.length, `dropping ${layer} removes text`);
    }
  });
});

describe('style rule walk', () => {
  it('visits rules with their layer, through media, with property names', async () => {
    const { walkStyleRules } = await import('../lib/css-layer-blocks.mjs');
    const seen = [];
    walkStyleRules('@layer handles { .chip { color: red; --x: "}"; } @media (min-width: 1px) { .chip:hover { background: blue } } } .loose { margin: 0 }', (rule) => seen.push(rule));
    assert.deepEqual(seen.map((r) => [r.layer, r.selector, r.props.join(',')]), [
      ['handles', '.chip', 'color,--x'],
      ['handles', '.chip:hover', 'background'],
      [null, '.loose', 'margin'],
    ]);
  });
});
