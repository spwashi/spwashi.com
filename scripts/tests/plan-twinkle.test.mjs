/**
 * plans:twinkle reads a plan's last look and what it cites. A sweep is not a
 * look, and every citation form a plan uses resolves to one repo path.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { lastLook, referencesIn } from '../plan-twinkle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('a plan last looked at its latest entry that is not a sweep', () => {
  const stream = [
    ' >>[2026-10-12 10:59] verify — read against the tree.',
    ' >>[2026-10-25 17:45] observe — something seen.',
    ' >>[2026-10-27 13:40] hygiene — status moved by the plan audit.',
  ].join('\n');
  assert.equal(lastLook(stream), '2026-10-25');
  assert.equal(lastLook(' >>[2026-10-27 13:40] hygiene — only a sweep.'), '');
});

test('citations, neighbours and Markdown links resolve to repo paths, with a fragment kept apart', () => {
  const from = path.join(ROOT, '.agents/plans/sample/index.spw');
  const spw = '@x: ~"../../../.spw/site.spw"\n  ~<"../other/index.spw"> look = ~"./index.spw#wonder_sample_q"\n link = ~"https://example.com/a"';
  assert.deepEqual(referencesIn(spw, from), [
    { path: '.spw/site.spw', fragment: '' },
    { path: '.agents/plans/other/index.spw', fragment: '' },
    { path: '.agents/plans/sample/index.spw', fragment: 'wonder_sample_q' },
  ]);
  const md = 'See [other](../other/PLAN.md) and [here](#local) and [web](https://example.com).';
  assert.deepEqual(referencesIn(md, path.join(ROOT, '.agents/plans/sample/PLAN.md')), [
    { path: '.agents/plans/other/PLAN.md', fragment: '' },
  ]);
});
