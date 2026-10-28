import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assembleNotice,
  auditReceipt,
  carryList,
  citationReceipt,
  noticeSummary,
  reproduceCommand,
  smokeReceipt,
  subjectsReceipt,
  updateLedger,
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

  const mapped = assembleNotice({
    sha: 'abc',
    jobs: {
      month: null,
      attention: { ok: true, failures: [] },
    },
  });
  assert.equal(mapped.ok, true);
  assert.equal(mapped.jobs.month.skipped, true);
  const kept = assembleNotice({
    sha: 'abc',
    jobs: {
      month: {
        schema: 'month-receipt.v0',
        ok: true,
        day: 7,
        week: 1,
        weekClose: true,
        ids: ['about-opening', 'research-opening', 'about-opening-dark'],
        failures: [],
      },
    },
  });
  assert.equal(kept.jobs.month.day, 7);
  assert.equal(kept.jobs.month.weekClose, true);
  assert.equal(kept.ok, true);
});

test('the ledger keeps a failure open until its check runs clean, and carries it', () => {
  const night1 = updateLedger(null, {
    attention: { ok: false, failures: [{ where: 'curriculum-hero-focus', reason: 'step-not-landed', detail: 'focus', reading: 'Focus did not stay.' }] },
    month: { ids: ['about-opening', 'curriculum-hero-focus'] },
    plans: { ok: true, failures: [] },
  }, { date: '2026-10-14', sha: 'a' });
  assert.equal(night1.open.length, 1);
  assert.equal(night1.open[0].isNew, true);
  assert.equal(night1.open[0].carry, 'curriculum-hero-focus');

  // The rotation moves on; the still is carried into the next night's ids.
  assert.deepEqual(carryList(night1.ledger, 'attention', ['about-opening', 'topics-opening-dark']), ['about-opening', 'topics-opening-dark', 'curriculum-hero-focus']);
  const night2 = updateLedger(night1.ledger, {
    attention: { ok: false, failures: [{ where: 'curriculum-hero-focus', reason: 'step-not-landed' }] },
    month: { ids: ['about-opening', 'topics-opening-dark', 'curriculum-hero-focus'] },
  }, { date: '2026-10-15' });
  assert.equal(night2.open[0].isNew, false);
  assert.equal(night2.open[0].firstSeen, '2026-10-14');
  assert.equal(night2.open[0].runs, 2);

  // A night the still did not run leaves it open; a night it passes clears it.
  const skipped = updateLedger(night2.ledger, { attention: { ok: true, failures: [] }, month: { ids: ['about-opening'] } }, { date: '2026-10-16' });
  assert.equal(skipped.open.length, 1);
  const passed = updateLedger(skipped.ledger, { attention: { ok: true, failures: [] }, month: { ids: ['about-opening', 'curriculum-hero-focus'] } }, { date: '2026-10-17' });
  assert.equal(passed.open.length, 0);
  assert.equal(passed.cleared[0].where, 'curriculum-hero-focus');
  assert.equal(passed.ledger.cleared[0].firstSeen, '2026-10-14');
});

test('a variant still is carried as the still that was asked for', () => {
  const folded = updateLedger(null, {
    attention: { ok: false, failures: [{ where: 'about-opening-keys', reason: 'step-not-landed' }] },
    month: { ids: ['about-opening', 'about-opening-dark'] },
  }, { date: '2026-10-28' });
  assert.equal(folded.open[0].carry, 'about-opening');
});

test('advisories and pending deploys are decisions: listed, marked new, and never fail the notice', () => {
  const notice = assembleNotice({
    sha: 'abc',
    jobs: {
      smoke: { ok: true, failures: [], routes: [] },
      audit: { ok: false, failures: [{ where: 'pkg', reason: 'high', detail: 'title' }] },
      workers: { ok: true, failures: [], pending: [{ where: 'spw.quest', reason: 'deploy-pending', detail: 'live HTTP 404 · repository 96481bdea451' }] },
    },
  });
  assert.equal(notice.ok, true);
  const first = updateLedger(null, notice.jobs, { date: '2026-10-28' });
  assert.equal(first.open.length, 0);
  assert.equal(first.decide.length, 2);
  assert.ok(first.decide.every((item) => item.isNew));
  const second = updateLedger(first.ledger, notice.jobs, { date: '2026-10-29' });
  assert.ok(second.decide.every((item) => !item.isNew && item.firstSeen === '2026-10-28'));
});

test('the summary says what is open, new or standing, how to see it again, and what waits on a decision', () => {
  const night1 = updateLedger(null, {
    attention: { ok: false, failures: [{ where: 'curriculum-hero-focus', reason: 'step-not-landed', reading: 'Focus did not stay.' }] },
    month: { ids: ['curriculum-hero-focus'] },
    workers: { ok: true, failures: [], pending: [{ where: 'spw.quest', reason: 'deploy-pending', detail: 'live HTTP 404' }] },
  }, { date: '2026-10-28' });
  const page = noticeSummary({ sha: '67318849abc' }, night1, {
    month: { day: 28, ids: ['curriculum-hero-focus'], carried: [] },
    workers: { unprobed: ['wap-mom'] },
  });
  assert.match(page, /^## Drift notice 67318849/);
  assert.match(page, /\*\*1 open\*\* \(1 new, 0 standing\)/);
  assert.match(page, /\| new \| Pocket attention \| curriculum-hero-focus \| step-not-landed \(Focus did not stay\.\) \| 2026-10-28 \| 1 \|/);
  assert.match(page, /--ids curriculum-hero-focus/);
  assert.match(page, /\*\*new\*\* Worker deploys: spw\.quest \(deploy-pending\)/);
  assert.match(page, /Not fingerprinted yet: wap-mom\./);
  assert.match(noticeSummary({ sha: 'x' }, updateLedger(null, {}, { date: '2026-10-28' })), /\*\*Nothing open\.\*\*/);
  assert.equal(reproduceCommand('smoke', '/about/'), 'npm run smoke:nav:ci -- --routes "/about/"');
});

test('worker fingerprints: the module script by its hashed name, and a pending deploy as a decision', async () => {
  const { scriptFingerprint, compareProbe, unprobedWorkers } = await import('../worker-drift.mjs');
  assert.equal(scriptFingerprint('<script type="module" crossorigin src="/assets/main-zHteQgVP.js"></script>'), 'main-zHteQgVP.js');
  assert.equal(scriptFingerprint('<p>no script</p>'), '');
  const probe = { host: 'factshift.center' };
  assert.equal(compareProbe(probe, 'main-a.js', 'main-a.js'), null);
  assert.deepEqual(compareProbe(probe, 'main-a.js', 'main-b.js'), { where: 'factshift.center', reason: 'deploy-pending', detail: 'live main-a.js · repository main-b.js' });
  assert.equal(compareProbe(probe, '', 'main-b.js').reason, 'unreadable');
  assert.deepEqual(unprobedWorkers(['wap-mom', 'spw-quest', 'smut-today'], [{ worker: 'spw-quest' }]), ['smut-today', 'wap-mom']);
});
