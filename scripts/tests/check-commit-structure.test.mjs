import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { structurePaths } from '../check-commit-structure.mjs';
import { copyCompileStamps } from '../check-pushed.mjs';
import { problemsInPlanFiles } from '../lib/plan-file-problems.mjs';

test('structure paths split plan files from corpus citations', () => {
  const split = structurePaths([
    '.agents/plans/agent-optimization/index.spw',
    '.spw/conventions/copy-flow.spw',
    '.spw/gen/memo.spw',
    '.spw/_workbench/packages/spw-cli/src/x.spw',
    '.agents/skills/image-optimize/skill.spw',
    'public/css/style.css',
    '.agents/plans/archive/old/wip.spw',
  ]);
  assert.deepEqual(split.plans, [
    '.agents/plans/agent-optimization/index.spw',
    '.agents/plans/archive/old/wip.spw',
  ]);
  assert.deepEqual(split.citations, [
    '.spw/conventions/copy-flow.spw',
    '.agents/skills/image-optimize/skill.spw',
  ]);
});

test('plan problems are the review line and a missing index target', () => {
  const problems = problemsInPlanFiles([
    {
      path: '.agents/plans/demo/index.spw',
      text: '# Review 2026-09-28 — kept\n~"./missing.spw"\n~"../other/index.spw"\n',
    },
    { path: '.agents/plans/demo/wip.spw', text: 'no review line\n' },
  ], {
    treeReviewed: true,
    exists: (rel) => rel === '.agents/plans/other/index.spw',
  });
  assert.deepEqual(problems.map((problem) => problem.reason), ['missing-target', 'unreviewed']);
  assert.equal(problems[0].where, '.agents/plans/demo/index.spw:2');
  assert.equal(problems[0].detail, './missing.spw');
});

test('compile stamps copy the hash files and leave buildinfo behind', () => {
  const from = mkdtempSync(path.join(tmpdir(), 'spw-stamp-from-'));
  const scratch = mkdtempSync(path.join(tmpdir(), 'spw-stamp-to-'));
  const source = path.join(from, '.tmp', 'tsc');
  mkdirSync(source, { recursive: true });
  writeFileSync(path.join(source, 'build:tools.stamp'), 'abc\n');
  writeFileSync(path.join(source, 'build-tools.tsbuildinfo'), '{"version":"test"}\n');
  assert.equal(copyCompileStamps(from, scratch), 1);
  assert.equal(readFileSync(path.join(scratch, '.tmp', 'tsc', 'build:tools.stamp'), 'utf8'), 'abc\n');
  assert.throws(() => readFileSync(path.join(scratch, '.tmp', 'tsc', 'build-tools.tsbuildinfo')));
});
