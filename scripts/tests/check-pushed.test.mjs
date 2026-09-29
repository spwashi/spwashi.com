import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { materializeCommit, shasFromPushLines } from '../check-pushed.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('pre-push lines keep the commits and drop deletions', () => {
  const text = [
    'refs/heads/main aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa refs/heads/main bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'refs/heads/old 0000000000000000000000000000000000000000 refs/heads/old cccccccccccccccccfffffffffffffffffffffff',
    'refs/heads/main aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa refs/heads/main bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '',
  ].join('\n');
  assert.deepEqual(shasFromPushLines(text), ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
});

test('the pushed checkout is that commit, not the dirty working tree', () => {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const committed = execFileSync('git', ['show', `${sha}:scripts/build-compile.mjs`], { cwd: ROOT });
  const tree = materializeCommit(sha);
  try {
    const checkedOut = readFileSync(path.join(tree.scratch, 'scripts/build-compile.mjs'));
    assert.deepEqual(checkedOut, committed);
    assert.equal(
      execFileSync('git', ['-C', tree.scratch, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      sha,
    );
    const folio = path.join(tree.scratch, 'public/images/assets/folios');
    assert.ok(readdirSync(folio).some((name) => name.endsWith('.spw')));
    assert.equal(existsSync(path.join(tree.scratch, 'public/images/icon-192.png')), true);
    assert.equal(existsSync(path.join(tree.scratch, 'public/images/app-icon.svg')), true);
    assert.equal(
      existsSync(path.join(tree.scratch, 'public/images/assets/illustrations/garden-bed-atlas.spw')),
      true,
    );
    assert.equal(existsSync(path.join(tree.scratch, 'public/images/favicon.ico')), false);
    execFileSync('git', ['-C', tree.scratch, 'diff', '--check']);
    const status = execFileSync('git', ['-C', tree.scratch, 'status', '--short'], { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    assert.deepEqual(status, ['?? node_modules']);
  } finally {
    tree.release();
  }
});
