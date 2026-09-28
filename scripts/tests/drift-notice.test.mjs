import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assembleNotice,
  auditReceipt,
  citationReceipt,
  smokeReceipt,
  subjectsReceipt,
} from '../drift-notice.mjs';

test('smoke receipt keeps the reason and drops the probe', () => {
  const receipt = smokeReceipt({
    ok: false,
    results: [
      {
        route: '/settings/',
        hardOk: false,
        failureReasons: ['horizontal-overflow'],
        wallMs: 900,
        settled: true,
        overflowXFrames: 1,
        probe: { spw: { pendingModules: ['a', 'b'] } },
        consoleErrors: ['nope'],
      },
      { route: '/', hardOk: true, wallMs: 400, settled: true, consoleErrorCount: 0 },
    ],
  });
  assert.equal(receipt.ok, false);
  assert.deepEqual(receipt.failures, [
    { where: '/settings/', reason: 'horizontal-overflow', detail: '1 frame' },
  ]);
  assert.equal(JSON.stringify(receipt).includes('pendingModules'), false);
  assert.equal(receipt.routes[1].ok, true);
});

test('citation receipt lists missing files and anchors', () => {
  const receipt = citationReceipt({
    scanned: 3,
    pathRefs: 4,
    findings: [
      { file: 'a.spw', line: 2, verdict: 'ok', target: './b.spw' },
      { file: 'a.spw', line: 8, verdict: 'missing-anchor', target: './b.spw#gone' },
      { file: 'c.spw', line: 1, verdict: 'malformed', target: 'not a path' },
    ],
  });
  assert.equal(receipt.ok, false);
  assert.equal(receipt.failures.length, 1);
  assert.equal(receipt.failures[0].reason, 'missing-anchor');
  assert.equal(receipt.failures[0].where, 'a.spw:8');
});

test('audit receipt fails the moderate gate and lists high advisories', () => {
  const receipt = auditReceipt({
    vulnerabilities: {
      left: { severity: 'low', via: [], range: '<1' },
      mid: { severity: 'moderate', via: [{ title: 'Moderate title' }], range: '<2' },
      top: { severity: 'high', via: ['mid', { title: 'High title' }], range: '<3' },
    },
  });
  assert.equal(receipt.ok, false);
  assert.equal(receipt.moderate, 1);
  assert.deepEqual(receipt.failures, [{ where: 'top', reason: 'high', detail: 'High title' }]);
});

test('assemble skips a missing job and fails when a present job failed', () => {
  const notice = assembleNotice({
    sha: 'abc',
    jobs: {
      smoke: { ok: false, failures: [{ where: '/', reason: 'navigation', detail: '' }] },
      attention: null,
      subjects: subjectsReceipt('abc subject\n'),
    },
  });
  assert.equal(notice.schema, 'drift-notice.v0');
  assert.equal(notice.ok, false);
  assert.equal(notice.jobs.attention.skipped, true);
  assert.deepEqual(notice.jobs.subjects.subjects, ['abc subject']);
});
