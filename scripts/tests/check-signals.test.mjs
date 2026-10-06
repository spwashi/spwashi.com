/**
 * The gate's memory: a warning keeps its identity across runs, a run says what
 * changed since the last one, and a window of runs reads as one picture.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compareRuns,
  digestHistory,
  formatComparison,
  formatDigest,
  historyEntry,
  readSignals,
  rerunCommand,
  slowestTests,
  stageHeadline,
  trimHistory,
  warningId,
} from '../lib/check-signals.mjs';

const STAGES = [
  {
    label: 'css-build',
    output: [
      '  bundle: core:core 1712.1 KiB 111ms',
      '  bundle: route:home 111.3 KiB 11ms',
      '[css-build] near soft budget: core 1712.1 of 1741 KiB, route:website 140.0 of 140 KiB',
    ].join('\n'),
  },
  {
    label: 'audit-folio-highres',
    output: '  ⚠ high-res set stale for 1 week: latest is 2026-W40, this is 2026-W41. Open five more.',
  },
  {
    label: 'check-agents',
    output: '[check:agents] near budget: AGENTS.md 3181/3200w, .spw/conventions/css-instruction.spw 200/200L',
  },
  { label: 'test:modules', output: '✔ a (1ms)\nℹ tests 643\nℹ pass 643\nℹ fail 0' },
];

test('a warning keeps its identity when only its numbers move', () => {
  assert.equal(
    warningId('  ⚠ high-res set stale for 1 week: latest is 2026-W40, this is 2026-W41.'),
    warningId('⚠ high-res set stale for 2 weeks: latest is 2026-W40, this is 2026-W42.'),
  );
  assert.notEqual(warningId('⚠ a bundle is over budget'), warningId('⚠ a bundle is near budget'));
  assert.equal(warningId('  warn: [runtime] cognition is ungated by selector'), '[runtime] cognition is ungated by selector');
});

test('signals read warnings, near-limit items, bundle sizes and test counts', () => {
  const signals = readSignals(STAGES);
  assert.equal(signals.warnings.length, 1);
  assert.equal(signals.warnings[0].stage, 'audit-folio-highres');
  assert.deepEqual(signals.near.map((entry) => entry.key), ['core', 'route:website', 'AGENTS.md', '.spw/conventions/css-instruction.spw']);
  assert.deepEqual(signals.bundles, { core: 1712.1, 'route:home': 111.3 });
  assert.deepEqual(signals.tests, { 'test:modules': { count: 643, failed: 0 } });
});

test('a run says what is new, what cleared, what moved, and how long the rest has stood', () => {
  const signals = readSignals(STAGES);
  const stale = signals.warnings[0].id;
  const history = [
    { at: '2026-10-01T10:00:00Z', sha: 'aaaaaaaa1', warnings: [], bundles: { core: 1700 } },
    { at: '2026-10-02T10:00:00Z', sha: 'bbbbbbbb2', warnings: [stale], bundles: { core: 1710 } },
    { at: '2026-10-03T10:00:00Z', sha: 'cccccccc3', dirty: 2, warnings: [stale, 'old thing'], bundles: { core: 1711.5, 'route:home': 111.3 } },
  ];
  const comparison = compareRuns(signals, history);
  assert.deepEqual(comparison.newWarnings, []);
  assert.deepEqual(comparison.cleared, ['old thing']);
  assert.deepEqual(comparison.moved.map((row) => [row.name, Number(row.delta.toFixed(1))]), [['core', 0.6]]);
  assert.equal(comparison.standing[0].runs, 3);
  assert.equal(comparison.standing[0].since, '2026-10-02T10:00:00Z');
  const lines = formatComparison(comparison);
  assert.ok(lines.some((line) => line.startsWith('[check:local] cleared since cccccccc (+2 uncommitted): old thing')));
  assert.ok(lines.some((line) => line.includes('moved since cccccccc') && line.includes('core +0.6 KiB → 1712.1')));
  assert.ok(lines.some((line) => line.includes('standing: 1 warning(s) carried over; the oldest for 3 runs since 2026-10-02')));
});

test('a warning not in the last run is new; with no history the run says so', () => {
  const signals = readSignals(STAGES);
  const comparison = compareRuns(signals, [{ at: 'x', sha: 'dddddddd', warnings: [], bundles: {} }]);
  assert.equal(comparison.newWarnings.length, 1);
  assert.match(formatComparison(comparison)[0], /^\[check:local\] new since dddddddd: ⚠ high-res set stale/);
  assert.match(formatComparison(compareRuns(signals, []))[0], /first run with a history here/);
});

test('a warning that asks for a confirmation waits on a director, apart from drift', () => {
  const decide = { label: 'check-site', output: '  warn: [runtime] cognition is ungated by selector; confirm it is intentionally document-wide.' };
  const signals = readSignals([...STAGES, decide]);
  assert.deepEqual(signals.warnings.map((warning) => warning.kind), ['drift', 'decision']);
  const ids = signals.warnings.map((warning) => warning.id);
  const lines = formatComparison(compareRuns(signals, [{ at: '2026-10-05T00:00:00Z', sha: 'eeeeeeee', warnings: ids, bundles: {} }]));
  assert.ok(lines.some((line) => line.startsWith('[check:local] awaiting a decision, 2 runs since 2026-10-05: [runtime] cognition is ungated')));
  assert.ok(lines.some((line) => line.startsWith('[check:local] standing: 1 warning(s) carried over')));
});

test('a cached test stage carries its last known count instead of reading as none', () => {
  const stages = [{ label: 'test:modules', output: '[test:modules] cache — tree 7ef701eba850 passed last run' }];
  assert.deepEqual(readSignals(stages, { previousTests: { 'test:modules': { count: 651, failed: 0 } } }).tests,
    { 'test:modules': { count: 651, failed: 0, cached: true } });
  assert.deepEqual(readSignals(stages).tests, {});
});

test('a history line is small and a window keeps the newest', () => {
  const receipt = { at: 't', sha: 's', dirty: { count: 3 }, verdict: 'passed', ms: 9, signals: readSignals(STAGES) };
  const entry = historyEntry(receipt);
  assert.deepEqual(Object.keys(entry), ['at', 'sha', 'dirty', 'verdict', 'ms', 'warnings', 'warningTexts', 'near', 'bundles', 'tests']);
  assert.equal(entry.dirty, 3);
  assert.deepEqual(trimHistory(['a', '', 'b', 'c'], 2), ['b', 'c']);
});

test('a failed stage names the command that reruns it alone', () => {
  assert.equal(rerunCommand({ command: [process.execPath, 'scripts/js-tree-value.mjs', '--check'] }), 'node scripts/js-tree-value.mjs --check');
  assert.equal(rerunCommand({ command: ['git', 'diff', '--check'] }), 'git diff --check');
  assert.equal(rerunCommand({}), null);
});

test('the slowest tests lead a test headline, and only past two seconds', () => {
  const output = '✔ quick (12ms)\n✔ the pushed checkout is that commit (15351.3ms)\n✔ mount arity (5292.1ms)\nℹ tests 3\nℹ fail 0';
  assert.deepEqual(slowestTests(output).map((row) => row.name), ['the pushed checkout is that commit', 'mount arity']);
  assert.match(stageHeadline(output, { tests: true })[0], /^ℹ tests 3 · fail 0 · slowest the pushed checkout is that commit 15\.4s, mount arity 5\.3s$/);
});

test('a window of runs reads as one picture for a director', () => {
  const entries = [
    { at: '2026-10-01T00:00:00Z', verdict: 'passed', warnings: ['a'], bundles: { core: 1700 }, tests: { m: { count: 600, failed: 0 } } },
    { at: '2026-10-02T00:00:00Z', verdict: 'failed', warnings: ['a', 'b'], bundles: { core: 1705 }, tests: { m: { count: 620, failed: 1 } } },
    { at: '2026-10-03T00:00:00Z', verdict: 'passed', warnings: ['a', 'b'], warningTexts: { a: '⚠ a, in words' }, near: ['core'], bundles: { core: 1712.1 }, tests: { m: { count: 643, failed: 0 } } },
  ];
  const digest = digestHistory(entries);
  assert.equal(digest.passed, 2);
  assert.deepEqual(digest.tests, { first: 600, last: 643 });
  assert.deepEqual(digest.standing.map((row) => [row.id, row.runs]), [['a', 3], ['b', 2]]);
  const lines = formatDigest(digest);
  assert.equal(lines[0], '[check:signals] 3 runs 2026-10-01 → 2026-10-03; 2 passed');
  assert.ok(lines.includes('[check:signals] bundles moved: core 1700.0 → 1712.1 KiB'));
  assert.ok(lines.includes('[check:signals] standing 3 run(s) since 2026-10-01: a, in words'));
  assert.ok(lines.includes('[check:signals] standing 2 run(s) since 2026-10-02: b'));
  assert.deepEqual(formatDigest(digestHistory([])), ['[check:signals] no history yet: run npm run check:local']);
});
