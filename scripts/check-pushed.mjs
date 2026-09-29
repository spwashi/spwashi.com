#!/usr/bin/env node
/**
 * check:local on the commit a push is sending, then the diff-scoped
 * plan and citation check. Compile stamps are copied in so an unchanged
 * pass stays warm. The nightly corpus walk is not repeated here.
 *
 * Pre-push feeds "<local ref> <local sha> <remote ref> <remote sha>" on stdin.
 * The working tree is often another session's files. Deploy checks out the
 * commit, so the local gate has to see that same tree. Images stay in the
 * main checkout. check:local reads two slices of them: the folio directory
 * (about 20 MB) and the five install icons the PWA contract stats. Those
 * are extracted from the commit. The rest of public/images stays out.
 *
 *   node scripts/check-pushed.mjs            # stdin, or HEAD from a terminal
 *   node scripts/check-pushed.mjs <sha>      # one commit, for a manual check
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FOLIOS = 'public/images/assets/folios';
const PWA_SHELL_IMAGES = [
  'public/images/app-icon.svg',
  'public/images/apple-touch-icon.png',
  'public/images/icon-192.png',
  'public/images/icon-512.png',
  'public/images/icon-maskable-512.png',
];
const SHA = /^[0-9a-f]{40}$/i;

export function gitEnv() {
  const env = { ...process.env };
  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;
  delete env.GIT_INDEX_FILE;
  delete env.GIT_PREFIX;
  return env;
}

function git(args, { cwd = ROOT, input, encoding = 'utf8' } = {}) {
  const result = spawnSync('git', args, { cwd, input, encoding, env: gitEnv(), maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return result.stdout;
}

export function shasFromPushLines(text) {
  const shas = [];
  for (const line of String(text).split('\n')) {
    const sha = line.trim().split(/\s+/)[1];
    if (!sha || !SHA.test(sha) || /^0+$/.test(sha)) continue;
    shas.push(sha.toLowerCase());
  }
  return [...new Set(shas)];
}

function extractPaths(sha, rels, scratch) {
  const archive = spawnSync('git', ['archive', sha, '--', ...rels], {
    cwd: ROOT,
    env: gitEnv(),
    maxBuffer: 80 * 1024 * 1024,
  });
  if (archive.status !== 0) {
    throw new Error(`git archive ${sha} ${rels.join(' ')} failed: ${archive.stderr || archive.error || ''}`);
  }
  const tar = spawnSync('tar', ['-x', '-C', scratch], { input: archive.stdout, maxBuffer: 1024 * 1024 });
  if (tar.status !== 0) {
    throw new Error(`tar extract of ${rels.join(' ')} failed: ${tar.stderr || tar.error || ''}`);
  }
}

function extractPath(sha, rel, scratch) {
  extractPaths(sha, [rel], scratch);
}

/**
 * Copy `*.stamp` into the scratch. The stamp is a hash of authored inputs,
 * so a commit whose sources differ misses and compiles. Incremental
 * tsbuildinfo from the shared tree is left behind: it can describe a
 * different commit, and a stamp hit does not read it.
 */
export function copyCompileStamps(fromRoot, scratch) {
  const source = path.join(fromRoot, '.tmp', 'tsc');
  if (!existsSync(source)) return 0;
  const dest = path.join(scratch, '.tmp', 'tsc');
  mkdirSync(dest, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(source)) {
    if (!name.endsWith('.stamp')) continue;
    cpSync(path.join(source, name), path.join(dest, name));
    copied += 1;
  }
  return copied;
}

/**
 * A detached worktree of `sha` with node_modules linked and the folio
 * directory extracted from that commit. `release` removes the worktree.
 */
export function materializeCommit(sha) {
  const scratch = mkdtempSync(path.join(tmpdir(), 'spw-push-'));
  let registered = false;
  const release = () => {
    if (registered) {
      spawnSync('git', ['worktree', 'remove', '--force', scratch], { cwd: ROOT, env: gitEnv() });
    }
    rmSync(scratch, { recursive: true, force: true });
  };
  try {
    git(['worktree', 'add', '--detach', '--no-checkout', scratch, sha]);
    registered = true;
    git([
      'sparse-checkout', 'set', '--no-cone', '--skip-checks',
      '/*',
      '!/public/images/',
    ], { cwd: scratch });
    git(['checkout', '--detach', sha], { cwd: scratch });
    // A directory pattern in .gitignore does not match this symlink, so
    // `git status` lists it. `git diff --check` does not, and that is the
    // whitespace gate check:local runs.
    symlinkSync(path.join(ROOT, 'node_modules'), path.join(scratch, 'node_modules'));
    mkdirSync(path.join(scratch, 'public/images/assets'), { recursive: true });
    extractPath(sha, FOLIOS, scratch);
    const icons = git(['ls-tree', '-r', '--name-only', sha, '--', ...PWA_SHELL_IMAGES])
      .split('\n')
      .filter(Boolean);
    if (icons.length) extractPaths(sha, icons, scratch);
    const stamps = copyCompileStamps(ROOT, scratch);
    if (stamps) console.log(`[check:pushed] compile stamps ${stamps}`);
    return { scratch, release };
  } catch (error) {
    release();
    throw error;
  }
}

function run(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: { ...gitEnv(), ...extraEnv } });
  if (result.status === 0) return;
  const error = new Error(`${command} ${args.join(' ')} exited ${result.status}`);
  error.status = result.status || 1;
  throw error;
}

function shasToCheck() {
  const fromArgs = process.argv.slice(2).filter((arg) => SHA.test(arg)).map((arg) => arg.toLowerCase());
  if (fromArgs.length) return [...new Set(fromArgs)];
  if (process.stdin.isTTY) return [git(['rev-parse', 'HEAD']).trim().toLowerCase()];
  const fromPush = shasFromPushLines(readFileSync(0, 'utf8'));
  return fromPush;
}

function main() {
  const shas = shasToCheck();
  if (!shas.length) {
    console.log('[check:pushed] no commit in this push');
    return;
  }
  let status = 0;
  for (const sha of shas) {
    console.log(`[check:pushed] ${sha}`);
    const tree = materializeCommit(sha);
    try {
      run(process.execPath, ['scripts/check-local.mjs'], tree.scratch);
      run(process.execPath, ['scripts/check-commit-structure.mjs'], tree.scratch, {
        SPW_INTEGRITY_TOOLS: ROOT,
      });
    } catch (error) {
      status = error.status || 1;
      console.error(`[check:pushed] ${sha} failed`);
      break;
    } finally {
      tree.release();
    }
  }
  process.exitCode = status;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
