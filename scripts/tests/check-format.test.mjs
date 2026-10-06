/**
 * How the gate reads in a terminal: phases under a rule, stages aligned,
 * their lines indented without their tag, warnings under one glyph, rows
 * wrapped at words, and the verdict last. Colour only when asked for.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createStyle,
  displayLine,
  formatComparison,
  formatDigest,
  formatStage,
  formatVerdict,
  fullness,
  row,
  rule,
  styleForStream,
  visibleLength,
  wrap,
} from '../lib/check-format.mjs';

const plain = createStyle({ width: 80 });
// The stage line's columns: mark, name padded to 28, time right-aligned in 7.
const stageLine = (mark, name, time, tail = '') => `${mark} ${name.padEnd(28)} ${time.padStart(7)}${tail}`;

test('wrap breaks at words, keeps a long word whole, and indents continuations', () => {
  assert.deepEqual(wrap('one two three four', 9, { first: '- ', indent: '  ' }), ['- one two', '  three', '  four']);
  assert.deepEqual(wrap('a reallylongwordthatdoesnotfit b', 10), ['a', 'reallylongwordthatdoesnotfit', 'b']);
  assert.deepEqual(wrap('ℹ slow  5.3s  mount arity', 40, { first: '    ' }), ['    ℹ slow  5.3s  mount arity']);
});

test('a stage line drops its tag, folds "passed" and a warning count, and marks warnings once', () => {
  assert.deepEqual(displayLine('[js-tree] ok — every file is reached'), { warn: false, text: 'every file is reached' });
  assert.equal(displayLine('[pwa] passed'), null);
  assert.equal(displayLine('[check] warnings=3'), null);
  assert.deepEqual(displayLine('  warn: [runtime] cognition is ungated'), { warn: true, text: '[runtime] cognition is ungated' });
  assert.deepEqual(displayLine('  ⚠ high-res set stale'), { warn: true, text: 'high-res set stale' });
  assert.deepEqual(displayLine('[check:agents] PASSED (6 adapters; 3 harness)'), { warn: false, text: '6 adapters; 3 harness' });
});

test('a passing stage aligns its name and time and indents what it said', () => {
  const lines = formatStage({
    label: 'check-site',
    status: 0,
    ms: 5560,
    output: '[check] phase=manifest\n[check] routes=206\n[check] warnings=1\n  warn: [runtime] cognition is ungated\n[check] passed',
  }, { style: plain });
  assert.deepEqual(lines, [
    stageLine('✔', 'check-site', '5.56s'),
    '    routes=206',
    '    ⚠ [runtime] cognition is ungated',
  ]);
});

test('census lines join into one, and a near-budget line becomes an aligned list', () => {
  const lines = formatStage({
    label: 'check-agents',
    status: 0,
    ms: 630,
    output: [
      '[check] routes=206 svgRoutes=50',
      '[check] css files=217 imports=152',
      '[check:agents] near budget: AGENTS.md 3181/3200w, .spw/conventions/css-instruction.spw 200/200L',
    ].join('\n'),
  }, { style: plain });
  assert.deepEqual(lines.slice(1), [
    '    routes=206 svgRoutes=50 · css files=217 imports=152',
    '    near budget',
    '      AGENTS.md                              99%  3181/3200w',
    '      .spw/conventions/css-instruction.spw  100%  200/200L',
  ]);
});

test('census segments wrap whole, and fullness reads either form of a cap', () => {
  const style = createStyle({ width: 60 });
  const lines = formatStage({
    label: 'check-site', status: 0, ms: 1,
    output: '[check] routes=206 svgRoutes=50 specRoutes=179\n[check] syntax targets=594 mode=batch concurrency=8\n[check] json feeds=2 jsonErrors=0',
  }, { style });
  assert.deepEqual(lines.slice(1), [
    '    routes=206 svgRoutes=50 specRoutes=179',
    '      syntax targets=594 mode=batch concurrency=8',
    '      json feeds=2 jsonErrors=0',
  ]);
  assert.equal(fullness('1712.1 of 1741 KiB'), 98);
  assert.equal(fullness('200/200L'), 100);
  assert.equal(fullness('no numbers'), null);
});

test('a stage that only says it used its cache shows that on its line', () => {
  const lines = formatStage({ label: 'check-runtime-bindings', status: 0, ms: 770, output: '[check:runtime-bindings] ok — cache' }, { style: plain });
  assert.deepEqual(lines, [stageLine('✔', 'check-runtime-bindings', '0.77s', ' cache')]);
});

test('a failed test stage shows its failures and the commands that rerun them', () => {
  const lines = formatStage({
    label: 'test:modules',
    status: 1,
    ms: 900,
    output: '✔ holds (0.4ms)\nℹ tests 2\nℹ fail 1\n✖ failing tests:\n\ntest at scripts/tests/x.test.mjs:4:1\n✖ breaks (1.9ms)',
    command: [process.execPath, 'scripts/run-module-tests.mjs'],
    headline: { tests: true, fileCommand: [process.execPath, '--test'] },
  }, { style: plain });
  assert.deepEqual(lines, [
    stageLine('✖', 'test:modules', '0.90s'),
    '    ℹ tests 2 · fail 1',
    '    ✖ failing tests:',
    '',
    '    test at scripts/tests/x.test.mjs:4:1',
    '    ✖ breaks (1.9ms)',
    '    rerun  node scripts/run-module-tests.mjs',
    '    file   node --test scripts/tests/x.test.mjs',
  ]);
});

test('a row keeps its suffix whole, on the last line or its own', () => {
  const style = createStyle({ width: 60 });
  assert.deepEqual(row('decide', 'short text', style, { suffix: ' · 3 runs' }), ['decide    short text · 3 runs']);
  const suffix = ' · 9 runs since 2026-10-06';
  for (const text of ['a sentence long enough that its last line fills the width nearly', 'a sentence that wraps once and ends short']) {
    const lines = row('decide', text, style, { suffix });
    assert.ok(lines.every((line) => visibleLength(line) <= 60), text);
    assert.equal(lines.filter((line) => line.includes('· 9 runs since 2026-10-06')).length, 1, text);
  }
});

test('the comparison groups rows under one label each, and says when nothing moved', () => {
  const lines = formatComparison({
    last: { sha: 'cccccccc3', dirty: 2 },
    newWarnings: [{ text: 'warn: new thing' }],
    cleared: ['old thing'],
    standing: [
      { text: '⚠ stale for 1 week', runs: 3, since: '2026-10-02T00:00:00Z' },
      { text: 'warn: semantics-gate is ungated; confirm it', runs: 9, since: '2026-10-01T00:00:00Z' },
      { text: 'warn: cognition is ungated; confirm it', runs: 9, since: '2026-10-01T00:00:00Z' },
    ],
    moved: [{ name: 'core', from: 1711.5, to: 1712.1, delta: 0.6 }],
  }, { style: plain });
  assert.deepEqual(lines.slice(1), [
    'new       ⚠ new thing',
    'cleared   old thing',
    'decide    semantics-gate is ungated; confirm it · 9 runs since 2026-10-01',
    '          cognition is ungated; confirm it · 9 runs since 2026-10-01',
    'standing  stale for 1 week · 3 runs since 2026-10-02',
    'moved     core +0.6 KiB → 1712.1',
  ]);
  assert.match(lines[0], /^── since cccccccc \+2 uncommitted ─+$/);
  assert.deepEqual(formatComparison({ last: { sha: 'd' }, newWarnings: [], cleared: [], standing: [], moved: [] }, { style: plain }).slice(1),
    ['quiet     nothing new, cleared, moved or waiting']);
  assert.match(formatComparison({ last: null }, { style: plain })[1], /^first     run with a history here/);
});

test('the verdict is the last line, after where the full text is', () => {
  const passed = formatVerdict({ passed: true, ms: 5970, tree: { sha: '8bfde39e1234', dirty: { count: 0 } }, log: 'x.log', receipt: 'x.json' }, { style: plain });
  assert.deepEqual(passed.slice(0, 2), ['log       x.log', 'receipt   x.json']);
  assert.match(passed.at(-1), /^── ✔ check:local passed in 6\.0s · 8bfde39e ─+$/);
  const failed = formatVerdict({ passed: false, ms: 1, failedAt: 'validate', failed: ['check-site'], tree: { sha: 'abc', dirty: { count: 4 } }, receipt: 'x.json' }, { style: plain });
  assert.equal(failed[0], 'failed    check-site');
  assert.match(failed.at(-1), /^── ✖ check:local failed at validate · abc \+4 uncommitted ─+$/);
});

test('the digest reads as rows under its own rule', () => {
  const lines = formatDigest({
    runs: 3, from: '2026-10-01T00:00:00Z', to: '2026-10-03T00:00:00Z', passed: 2,
    tests: { first: 600, last: 643 },
    bundles: { core: { first: 1700, last: 1712.1, max: 1712.1 } },
    near: ['core'],
    standing: [{ id: 'a', text: 'a, in words', kind: 'decision', runs: 3, since: '2026-10-01T00:00:00Z' }],
  }, { style: plain });
  assert.match(lines[0], /^── gate history · 3 runs, 2026-10-01 → 2026-10-03 · 2 passed ─+$/);
  assert.deepEqual(lines.slice(1), [
    'tests     600 → 643',
    'bundles   core 1700.0 → 1712.1 KiB',
    'near      core',
    'decide    a, in words · 3 runs since 2026-10-01',
  ]);
  assert.match(formatDigest({ runs: 0 }, { style: plain })[1], /^empty     no runs yet/);
});

test('colour only on a terminal, unless NO_COLOR or FORCE_COLOR says otherwise', () => {
  assert.equal(styleForStream({ isTTY: false }, {}).color, false);
  assert.equal(styleForStream({ isTTY: true, columns: 90 }, {}).color, true);
  assert.equal(styleForStream({ isTTY: true }, { NO_COLOR: '' }).color, false);
  assert.equal(styleForStream({ isTTY: false }, { FORCE_COLOR: '1' }).color, true);
  assert.equal(styleForStream({ isTTY: true }, { FORCE_COLOR: '0' }).color, false);
  const coloured = createStyle({ color: true });
  assert.equal(visibleLength(coloured.green('✔ ok')), 4);
  assert.ok(rule('compile', plain).startsWith('── compile ──'));
  assert.ok(!/\x1b/.test(formatStage({ label: 'a', status: 0, ms: 1, output: '' }, { style: plain }).join('')));
});
