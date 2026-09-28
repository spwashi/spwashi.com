#!/usr/bin/env node
/**
 * Structure of the files a commit (or the index) actually changed.
 *
 * The push runs this inside the commit checkout, after check:local.
 * A session runs `node scripts/check-commit-structure.mjs --staged` on its
 * own index. The whole plan tree and every citation stay on the nightly
 * corpus walk: a rename this diff did not touch is that walk's job.
 *
 *   node scripts/check-commit-structure.mjs
 *   node scripts/check-commit-structure.mjs --staged
 *
 * SPW_INTEGRITY_TOOLS is the checkout that holds .spw/_workbench. The push
 * sets it to the main tree, because the commit scratch does not populate
 * the submodule.
 */

import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { PLAN_REVIEW_MARKER, problemsInPlanFiles } from './lib/plan-file-problems.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function structurePaths(paths) {
  const plans = [];
  const citations = [];
  for (const file of paths) {
    const rel = String(file || '').split(path.sep).join('/');
    if (!rel.endsWith('.spw')) continue;
    if (rel.startsWith('.agents/plans/')) plans.push(rel);
    if (rel.includes('/_workbench/') || rel.startsWith('.spw/gen/')) continue;
    if (rel.startsWith('.spw/') || rel.startsWith('.agents/skills/')) citations.push(rel);
  }
  return { plans, citations };
}

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${(result.stderr || '').trim()}`);
  }
  return result.stdout;
}

function changedPaths(staged) {
  if (staged) {
    return git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
  const parent = spawnSync('git', ['rev-parse', '--verify', 'HEAD^'], { cwd: ROOT, encoding: 'utf8' });
  const args = parent.status === 0
    ? ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD^', 'HEAD']
    : ['diff-tree', '--root', '-r', '--name-only', '--no-commit-id', '--diff-filter=ACMR', 'HEAD'];
  return git(args).split('\n').map((line) => line.trim()).filter(Boolean);
}

function treeIsReviewed() {
  const walk = (dir) => {
    let entries = [];
    try {
      entries = readdir(dir);
    } catch {
      return false;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (walk(abs)) return true;
        continue;
      }
      if (!entry.name.endsWith('.spw')) continue;
      if (PLAN_REVIEW_MARKER.test(readFileSync(abs, 'utf8'))) return true;
    }
    return false;
  };
  return walk(path.join(ROOT, '.agents', 'plans'));
}

function readdir(dir) {
  return readdirSync(dir, { withFileTypes: true });
}

function planProblems(files, reviewed) {
  const entries = [];
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    if (!existsSync(abs)) continue;
    entries.push({ path: rel, text: readFileSync(abs, 'utf8') });
  }
  return problemsInPlanFiles(entries, {
    treeReviewed: reviewed,
    exists: (rel) => existsSync(path.join(ROOT, rel)),
  });
}

function citationStatus(files) {
  const tools = process.env.SPW_INTEGRITY_TOOLS
    ? path.resolve(process.env.SPW_INTEGRITY_TOOLS)
    : ROOT;
  const loader = path.join(tools, '.spw/_workbench/node_modules/tsx/dist/loader.mjs');
  if (!existsSync(loader)) {
    console.error('[check:commit] workbench loader missing; citation files were not resolved');
    return 1;
  }
  const listDir = mkdtempSync(path.join(tmpdir(), 'spw-cite-'));
  const list = path.join(listDir, 'files.txt');
  writeFileSync(list, `${files.join('\n')}\n`);
  try {
    const result = spawnSync(process.execPath, [
      '--import', loader,
      path.join(ROOT, 'scripts/spw-integrity.mjs'),
      '--files-from', list,
    ], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, SPW_INTEGRITY_TOOLS: tools, SPW_INTEGRITY_ROOT: ROOT },
    });
    return result.status === 0 ? 0 : result.status || 1;
  } finally {
    rmSync(listDir, { recursive: true, force: true });
  }
}

function main() {
  const staged = process.argv.includes('--staged');
  const changed = changedPaths(staged);
  const { plans, citations } = structurePaths(changed);
  if (!plans.length && !citations.length) {
    console.log('[check:commit] no plan or citation files in this diff');
    return;
  }
  console.log(`[check:commit] plans ${plans.length} · citations ${citations.length}`);
  let status = 0;
  if (plans.length) {
    const problems = planProblems(plans, treeIsReviewed());
    if (problems.length) {
      console.error(`[check:commit] ${problems.length} plan file problem(s)`);
      for (const problem of problems) {
        console.error(`- ${problem.where} ${problem.reason} ${problem.detail}`);
      }
      status = 1;
    }
  }
  if (citations.length) {
    const code = citationStatus(citations);
    if (code !== 0) status = code;
  }
  process.exitCode = status;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
