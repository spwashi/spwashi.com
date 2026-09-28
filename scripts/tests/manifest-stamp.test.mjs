import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateManifestFreshness,
  evaluateStagedManifest,
  listStagedManifestStampInputs,
  stampFromEntries,
} from '../lib/manifest-stamp.mjs';

const HOUR = 60 * 60 * 1000;

test('stamp ignores entry order', () => {
  const left = stampFromEntries([
    { path: 'b', content: 'two' },
    { path: 'a', content: 'one' },
  ]);
  const right = stampFromEntries([
    { path: 'a', content: 'one' },
    { path: 'b', content: 'two' },
  ]);
  assert.equal(left, right);
  assert.notEqual(left, stampFromEntries([{ path: 'a', content: 'changed' }]));
});

test('a matching stamp inside the hour reuses the shared cache', () => {
  const now = Date.parse('2026-09-22T18:00:00.000Z');
  const fresh = evaluateManifestFreshness({
    liveStamp: 'abc',
    committedStamp: 'abc',
    cacheStamp: 'abc',
    verifiedAt: '2026-09-22T17:30:00.000Z',
    now,
    windowMs: HOUR,
  });
  assert.equal(fresh.indexStatus, 'fresh');
  assert.equal(fresh.withinWindow, true);
});

test('a matching stamp older than the hour rebuilds and a drifted index fails', () => {
  const now = Date.parse('2026-09-22T18:00:00.000Z');
  const aged = evaluateManifestFreshness({
    liveStamp: 'abc',
    committedStamp: 'abc',
    cacheStamp: 'abc',
    verifiedAt: '2026-09-21T18:00:00.000Z',
    now,
    windowMs: HOUR,
  });
  assert.equal(aged.indexStatus, 'fresh');
  assert.equal(aged.withinWindow, false);

  const drifted = evaluateManifestFreshness({
    liveStamp: 'live',
    committedStamp: 'old',
    cacheStamp: 'old',
    verifiedAt: new Date(now).toISOString(),
    now,
    windowMs: HOUR,
  });
  assert.equal(drifted.indexStatus, 'stale');
  assert.equal(drifted.withinWindow, false);

  const unstamped = evaluateManifestFreshness({ liveStamp: 'live', now, windowMs: HOUR });
  assert.equal(unstamped.indexStatus, 'unstamped');
});

test('a commit is checked against the routes it stages, not the pages on disk', () => {
  assert.equal(evaluateStagedManifest({ touchesInputs: false, touchesIndex: false, stagedStamp: '', indexStamp: null }).ok, true);
  // Another session's unstaged page changes nothing here: only staged content enters the stamp.
  assert.equal(evaluateStagedManifest({ touchesInputs: true, touchesIndex: true, stagedStamp: 'abc', indexStamp: 'abc' }).ok, true);
  // An index an earlier commit already made correct needs no restaging.
  assert.equal(evaluateStagedManifest({ touchesInputs: true, touchesIndex: false, stagedStamp: 'abc', indexStamp: 'abc' }).ok, true);
  const stale = evaluateStagedManifest({ touchesInputs: true, touchesIndex: false, stagedStamp: 'new', indexStamp: 'old' });
  assert.equal(stale.ok, false);
  assert.match(stale.reason, /manifest:staged/);
  assert.equal(evaluateStagedManifest({ touchesInputs: false, touchesIndex: true, stagedStamp: 'new', indexStamp: null }).ok, false);
});

test('staged inputs are tracked routes plus the named scripts, never ignored trees', () => {
  const inputs = listStagedManifestStampInputs([
    'index.html',
    'about/index.html',
    'about/notes.html',
    'dist/index.html',
    '.agents/plans/x/index.html',
    'design/catalog/index.html',
    'scripts/generate-site-search-index.mjs',
    'public/js/runtime/catalog/feature.js',
    'public/js/site.js',
  ]);
  assert.deepEqual(inputs, [
    'about/index.html',
    'index.html',
    'public/js/runtime/catalog/feature.js',
    'scripts/generate-site-search-index.mjs',
  ]);
});

test('the expression manifest stamps routes, tracked canon, and its harvester, never local caches', async () => {
  const { isExpressionStampInput } = await import('../lib/manifest-stamp.mjs');
  for (const input of [
    'index.html', 'design/folios/index.html', '.spw/site.spw', '.spw/surfaces/folio-archive/release-2026-09-27.spw',
    'scripts/build-expression-manifest.mjs', 'public/js/semantic/expression-query.js',
  ]) assert.ok(isExpressionStampInput(input), input);
  for (const input of [
    '.spw/gen/session/corpus-memo/a.spw', '.spw/_workbench/x.spw', '.agents/plans/x/index.html',
    'scripts/x/index.html', 'about/notes.html', '.spw/readme.md', 'dist/index.html',
  ]) assert.ok(!isExpressionStampInput(input), input);
});
