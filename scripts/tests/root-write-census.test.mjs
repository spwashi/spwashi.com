import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ROOT_WRITE_PROBE_SOURCE,
  catalogEntryFiles,
  formatRootWriteCensus,
  isStyledToken,
  ownerOfWrite,
  summarizeModuleTiming,
  summarizeRootWrites,
} from '../root-write-census.mjs';

const ENTRY_FILES = new Map([
  ['/public/js/runtime/physics/pulse-beat-tuner.js', ['pulse-beat-tuner']],
  ['/public/js/runtime/attention/attention-architecture.js', ['attention-section-handle', 'attention-reading-groove']],
]);

test('catalog loaders resolve to the public path a stack will name', () => {
  const entries = catalogEntryFiles([
    { id: 'pulse-beat-tuner', load: () => import('../physics/pulse-beat-tuner.js') },
    { id: 'site-settings', load: () => import('../../kernel/site-settings-engine.js') },
    { id: 'absolute', load: () => import('/public/js/interface/absolute.js') },
    { id: 'twin', load: () => import('../physics/pulse-beat-tuner.js') },
    { id: 'no-loader' },
  ]);
  assert.deepEqual(entries.get('/public/js/runtime/physics/pulse-beat-tuner.js'), ['pulse-beat-tuner', 'twin']);
  assert.deepEqual(entries.get('/public/js/kernel/site-settings-engine.js'), ['site-settings']);
  assert.deepEqual(entries.get('/public/js/interface/absolute.js'), ['absolute']);
  assert.equal(entries.size, 3);
});

test('a write belongs to the catalog module on its stack, else to the file that made it', () => {
  assert.equal(
    ownerOfWrite(['/public/js/kernel/dom-contracts.js', '/public/js/runtime/physics/pulse-beat-tuner.js', '/public/js/runtime/orchestration/loader.js'], ENTRY_FILES),
    'pulse-beat-tuner',
  );
  assert.equal(
    ownerOfWrite(['/public/js/runtime/attention/attention-architecture.js'], ENTRY_FILES),
    'attention-section-handle+attention-reading-groove',
  );
  assert.equal(
    ownerOfWrite(['/public/js/kernel/dom-contracts.js', '/public/js/runtime/orchestration/loader.js'], ENTRY_FILES),
    '(file:runtime/orchestration/loader.js)',
  );
  assert.equal(ownerOfWrite(['/public/js/kernel/dom-contracts.js'], ENTRY_FILES), '(file:kernel/dom-contracts.js)');
  assert.equal(ownerOfWrite([], ENTRY_FILES), '(inline script)');
});

test('a token counts as styled only when a stylesheet reads it', () => {
  const css = `
    html[data-spw-beat-prime] .x { color: red; }
    .y { inline-size: var(--spw-beat-interval-ms, 1300); gap: var( --spaced ); }
    body.is-locked { overflow: hidden; }
  `;
  assert.equal(isStyledToken(css, 'dataset', 'data-spw-beat-prime'), true);
  assert.equal(isStyledToken(css, 'dataset', 'data-spw-beat'), false);
  assert.equal(isStyledToken(css, 'style', '--spw-beat-interval-ms'), true);
  assert.equal(isStyledToken(css, 'style', '--spaced'), true);
  assert.equal(isStyledToken(css, 'style', '--spw-beat-interval'), false);
  assert.equal(isStyledToken(css, 'style', 'overflow'), true);
  assert.equal(isStyledToken(css, 'class', 'is-locked'), true);
  assert.equal(isStyledToken(css, 'class', 'is-lock'), false);
});

test('the census ranks owners by styled writes and names who stayed quiet', () => {
  const census = summarizeRootWrites({
    rows: [
      { target: 'html', channel: 'dataset', name: 'data-spw-beat', files: ['/public/js/runtime/physics/pulse-beat-tuner.js'], count: 9, changed: 9, firstMs: 1200, lastMs: 12000 },
      { target: 'html', channel: 'dataset', name: 'data-spw-beat-prime', files: ['/public/js/runtime/physics/pulse-beat-tuner.js'], count: 3, changed: 2, firstMs: 1200, lastMs: 9000 },
      { target: 'body', channel: 'dataset', name: 'data-spw-module-status', files: ['/public/js/kernel/dom-contracts.js', '/public/js/runtime/orchestration/loader.js'], count: 4, changed: 4, firstMs: 700, lastMs: 9000 },
      { target: 'html', channel: 'style', name: '--site-line-height', files: [], count: 1, changed: 1, firstMs: 40, lastMs: 40 },
    ],
    observed: { html: 12, body: 4 },
    mounted: ['pulse-beat-tuner', 'spells', 'site-search', 'spells'],
  }, ENTRY_FILES, (channel, name) => name === 'data-spw-beat-prime' || name === 'data-spw-module-status');

  assert.equal(census.schema, 'root-write-census.v0');
  assert.equal(census.mounted, 3);
  assert.deepEqual(census.writers, ['pulse-beat-tuner']);
  assert.deepEqual(census.quiet, ['site-search', 'spells']);
  assert.equal(census.writes, 17);
  assert.equal(census.changed, 16);
  assert.equal(census.styled, 6);
  assert.equal(census.tokens, 4);
  assert.equal(census.observed, 16);
  assert.deepEqual(census.owners.map((entry) => [entry.owner, entry.styled]), [
    ['(file:runtime/orchestration/loader.js)', 4],
    ['pulse-beat-tuner', 2],
    ['(inline script)', 0],
  ]);
  assert.deepEqual(census.owners[1].repeats, ['html:data-spw-beat-prime×3', 'html:data-spw-beat×9']);

  const text = formatRootWriteCensus('/', census);
  assert.match(text, /3 mounted · 1 write to the root on arrival · 2 quiet/);
  assert.match(text, /quiet: site-search, spells/);
});

test('module timing keeps one line per id: earliest mount, summed mount time, host count', () => {
  const timing = summarizeModuleTiming([
    { id: 'frame-size-memory', status: 'mounted', when: 'immediate', mountedAt: 1410.6, loadMs: 12.2, mountMs: 3.4 },
    { id: 'frame-size-memory', status: 'mounted', when: 'immediate', mountedAt: 1402.2, loadMs: 0.4, mountMs: 2.2 },
    { id: 'spells', status: 'mounted', when: 'idle', mountedAt: 9050, loadMs: 31, mountMs: 8 },
    { id: 'annotation-layer', status: 'idle', when: 'visible', mountedAt: null, loadMs: null, mountMs: null },
  ]);
  assert.deepEqual(timing, [
    { id: 'frame-size-memory', when: 'immediate', status: 'mounted', hosts: 2, mountedAt: 1402, loadMs: 12, mountMs: 6 },
    { id: 'spells', when: 'idle', status: 'mounted', hosts: 1, mountedAt: 9050, loadMs: 31, mountMs: 8 },
    { id: 'annotation-layer', when: 'visible', status: 'idle', hosts: 1, mountedAt: null, loadMs: null, mountMs: 0 },
  ]);
});

test('the probe is one self-contained expression and hooks all four doors', () => {
  assert.doesNotThrow(() => new Function(`return ${ROOT_WRITE_PROBE_SOURCE.replace(/;\s*$/, '')}`));
  for (const door of ['setAttribute', "'dataset'", "'style'", "'classList'", 'MutationObserver']) {
    assert.ok(ROOT_WRITE_PROBE_SOURCE.includes(door), door);
  }
});
