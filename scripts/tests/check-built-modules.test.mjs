import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  builtModulesProbe,
  classifyBuiltModules,
  resolveStaticFile,
} from '../check-built-modules.mjs';

test('every module loading is a pass and names the slowest', () => {
  const receipt = classifyBuiltModules({
    ids: ['a', 'b'],
    loads: [
      { id: 'a', ok: true, ms: 4.2, error: null },
      { id: 'b', ok: true, ms: 31.7, error: null },
    ],
    timedOut: [],
  });
  assert.equal(receipt.schema, 'built-modules-receipt.v0');
  assert.equal(receipt.ok, true);
  assert.equal(receipt.loaded, 2);
  assert.deepEqual(receipt.slowest, { id: 'b', ms: 32 });
  assert.deepEqual(receipt.failures, []);
});

test('a chunk that reads its pair too early is named as bundle order', () => {
  const receipt = classifyBuiltModules({
    ids: ['charge-field', 'b', 'c', 'd'],
    loads: [
      { id: 'charge-field', ok: false, ms: 2, error: "Cannot access 'a' before initialization" },
      { id: 'b', ok: false, ms: 2, error: 'Failed to fetch dynamically imported module' },
      { id: 'c', ok: true, ms: 1, error: null },
    ],
    timedOut: [],
  });
  assert.equal(receipt.ok, false);
  assert.equal(receipt.loaded, 1);
  assert.deepEqual(receipt.failures, [
    { where: 'charge-field', reason: 'bundle-order', detail: "Cannot access 'a' before initialization" },
    { where: 'b', reason: 'load-failed', detail: 'Failed to fetch dynamically imported module' },
    { where: 'd', reason: 'not-attempted', detail: '' },
  ]);
});

test('a loader that never answers fails, and an empty catalog is not a pass', () => {
  const hung = classifyBuiltModules({ ids: ['a'], loads: [], timedOut: ['a'] });
  assert.deepEqual(hung.failures, [{ where: 'a', reason: 'load-timeout', detail: '' }]);

  const empty = classifyBuiltModules({ ids: [], loads: [], timedOut: [] });
  assert.equal(empty.ok, false);
  assert.equal(empty.failures[0].reason, 'empty-catalog');
});

test('the failure list is capped and says so', () => {
  const ids = Array.from({ length: 5 }, (_, index) => `m${index}`);
  const receipt = classifyBuiltModules({ ids, loads: [], timedOut: [] }, 2);
  assert.equal(receipt.failures.length, 2);
  assert.equal(receipt.truncated, true);
});

test('the probe asks the runtime to load, never to mount', () => {
  const probe = builtModulesProbe(5000);
  assert.match(probe, /site\.loadModule\(id\)/);
  assert.doesNotMatch(probe, /mountModule/);
  assert.match(probe, /5000/);
});

test('the static server resolves directory indexes and stays inside its root', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'spw-built-test-'));
  try {
    mkdirSync(path.join(root, 'about'));
    writeFileSync(path.join(root, 'index.html'), 'home');
    writeFileSync(path.join(root, 'about', 'index.html'), 'about');
    assert.equal(resolveStaticFile(root, '/'), path.join(root, 'index.html'));
    assert.equal(resolveStaticFile(root, '/about/?x=1'), path.join(root, 'about', 'index.html'));
    assert.equal(resolveStaticFile(root, '/missing.js'), null);
    assert.equal(resolveStaticFile(root, '/../../etc/passwd'), null);
    assert.equal(resolveStaticFile(root, '/%2e%2e/%2e%2e/etc/passwd'), null);
    assert.equal(resolveStaticFile(root, '/%E0%A4%A'), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
