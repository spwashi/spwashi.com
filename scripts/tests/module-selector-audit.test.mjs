import assert from 'node:assert/strict';
import test from 'node:test';

import {
  combinatorDepth,
  indexHtmlElements,
  matchSelector,
  selectorSpecificity,
  summarizeHostDepths,
  usesLegacySiteFrame,
} from '../lib/module-selector-audit.mjs';

test('module selector specificity treats :where as zero and :is as its strongest arg', () => {
  assert.deepEqual(selectorSpecificity('html').triple, [0, 0, 1]);
  assert.deepEqual(selectorSpecificity('.site-frame').triple, [0, 1, 0]);
  assert.deepEqual(selectorSpecificity('[data-spw-kind="frame"]').triple, [0, 1, 0]);
  assert.deepEqual(selectorSpecificity(':where(.spw-frame)').triple, [0, 0, 0]);
  assert.deepEqual(selectorSpecificity(':is(#hero, .spw-frame)').triple, [1, 0, 0]);
  assert.deepEqual(
    selectorSpecificity('main .site-frame ~ .site-frame').triple,
    [0, 2, 1],
  );
  assert.equal(selectorSpecificity('main .site-frame ~ .site-frame').combinators, 2);
  assert.equal(combinatorDepth('html'), 0);
  assert.equal(combinatorDepth('main [data-spw-region-role] ~ [data-spw-region-role]'), 2);
});

test('HTML host matching walks combinators and reports depth from the document root', () => {
  const html = `
    <html><body>
      <main>
        <section class="spw-frame" data-spw-kind="frame" data-spw-region-role="entry-spine"></section>
        <section class="spw-frame" data-spw-kind="frame" data-spw-region-role="reading"></section>
      </main>
    </body></html>
  `;
  const elements = indexHtmlElements(html);
  const frames = matchSelector(elements, '[data-spw-kind="frame"]');
  assert.equal(frames.length, 2);
  assert.equal(frames[0].depth, 4);
  assert.equal(matchSelector(elements, '.site-frame').length, 0);
  const siblings = matchSelector(elements, 'main [data-spw-region-role] ~ [data-spw-region-role]');
  assert.equal(siblings.length, 1);
  assert.equal(siblings[0].attrs.get('data-spw-region-role'), 'reading');
  const summary = summarizeHostDepths(frames);
  assert.equal(summary.min, 4);
  assert.equal(summary.max, 4);
});

test('legacy site-frame detector does not fire on spw-frame', () => {
  assert.equal(usesLegacySiteFrame('.site-frame, .frame-card'), true);
  assert.equal(usesLegacySiteFrame('.spw-frame, [data-spw-kind="frame"]'), false);
  assert.equal(usesLegacySiteFrame('main .site-frame ~ .site-frame'), true);
});
