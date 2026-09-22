import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateManifestFreshness, stampFromEntries } from '../lib/manifest-stamp.mjs';

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
