/**
 * A green gate prints what a reader acts on: tagged results, warnings, a test
 * count. Fixtures are trimmed from a real check:pushed run.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { isVerboseRun, stageHeadline } from '../build-compile.mjs';
import { nearBudget } from '../check-agent-contracts.mjs';

test('a validator keeps its tagged lines and warnings, and drops tables and chatter', () => {
  const output = [
    '[check] phase=manifest',
    '[check:agents] spend',
    '[check] routes=206 svgRoutes=50 specRoutes=179',
    '[check] warnings=1',
    '  warn: [runtime] cognition is ungated by selector; confirm it is intentionally document-wide.',
    '  copy: src/styles/entries/debug.css -> public/css/effects/debug.css',
    '  bundle: route:home 111.3 KiB 11ms',
    '--- Operator Controls Audit ---',
    '  tight              3449',
    '  ⚠ high-res set stale for 1 week: latest is 2026-W40, this is 2026-W41.',
    '[check] passed',
  ].join('\n');
  assert.deepEqual(stageHeadline(output), [
    '[check] routes=206 svgRoutes=50 specRoutes=179',
    '[check] warnings=1',
    '  warn: [runtime] cognition is ungated by selector; confirm it is intentionally document-wide.',
    '  ⚠ high-res set stale for 1 week: latest is 2026-W40, this is 2026-W41.',
    '[check] passed',
  ]);
});

test('a test stage sums its runs into one count and keeps only its own tag', () => {
  const output = [
    '✔ a pasted link becomes a domain (6.7ms)',
    '[check:pushed] workbench 229aedcf9b6f',
    "[module-loader] module audit | skipped | visible-miss | layer=enhancement { at: 806 }",
    'ℹ tests 30',
    'ℹ pass 30',
    'ℹ fail 0',
    'ℹ tests 5',
    'ℹ fail 0',
    '[check:workers] 6 units, 20 hosts; quest and feedback routing verified',
  ].join('\n');
  assert.deepEqual(stageHeadline(output, { tests: true, tag: 'check:workers' }), [
    'ℹ tests 35 · fail 0',
    '[check:workers] 6 units, 20 hosts; quest and feedback routing verified',
  ]);
});

test('verbose comes from the flag, the env switch, or CI', () => {
  assert.equal(isVerboseRun([], {}), false);
  assert.equal(isVerboseRun(['--verbose'], {}), true);
  assert.equal(isVerboseRun([], { SPW_CHECK_VERBOSE: '1' }), true);
  assert.equal(isVerboseRun([], { CI: 'true' }), true);
});

test('near budget names files within 5% of a cap, by the cap they approach', () => {
  const report = (file, words, lines, maxWords, maxLines, ok = true) => ({ ok, words, lines, spec: { file, maxWords, maxLines } });
  assert.deepEqual(nearBudget([
    report('AGENTS.md', 3181, 238, 3200, null),
    report('css-instruction.spw', 2389, 200, null, 200),
    report('roomy.spw', 900, 120, null, 200),
    report('over.md', 4000, 10, 3200, null, false),
  ]), ['AGENTS.md 3181/3200w', 'css-instruction.spw 200/200L']);
});
