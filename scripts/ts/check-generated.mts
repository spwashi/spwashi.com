import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { collectCssBuildPlan } from './css-build.mjs';
import {
  BEHAVIOR_SCOPE_MODULE_HREF,
  listBundleTargets,
} from './css-manifest.mjs';

type GeneratedGroup = {
  label: string;
  paths: string[];
};

const GENERATED_TS_GROUPS: GeneratedGroup[] = [
  { label: 'tools-ts', paths: ['scripts/typed'] },
  { label: 'runtime-ts', paths: ['public/js/typed'] },
];

function runGit(args: string[]) {
  return spawnSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

function collectChangedFiles(args: string[]): string[] {
  const result = runGit(args);
  if (result.status !== 0) {
    throw new Error(`[generated] git ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  }

  return result.stdout
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectCssGeneratedPaths(cssPlan: Awaited<ReturnType<typeof collectCssBuildPlan>>): string[] {
  const bundleOutputs = listBundleTargets().map((target) => target.href.replace(/^\/+/, ''));
  const runtimeScopeOutput = BEHAVIOR_SCOPE_MODULE_HREF.replace(/^\/+/, '');
  return [...new Set([
    ...cssPlan.flatMap((entry) => (
      [entry.output, entry.mapOutput].filter((value): value is string => Boolean(value))
    )),
    ...bundleOutputs,
    runtimeScopeOutput,
  ])].sort();
}

export async function collectGeneratedGroups(): Promise<GeneratedGroup[]> {
  const cssPlan = await collectCssBuildPlan();
  return [
    ...GENERATED_TS_GROUPS,
    {
      label: 'css',
      paths: collectCssGeneratedPaths(cssPlan),
    },
  ];
}

export async function collectGeneratedOutputs(): Promise<string[]> {
  const groups = await collectGeneratedGroups();
  return groups.flatMap((group) => group.paths).sort();
}

import { promises as fs } from 'node:fs';

export async function main(): Promise<void> {
  const allowDirty = process.argv.includes('--allow-dirty') || process.argv.includes('--permissive');
  const groups = await collectGeneratedGroups();
  const generatedOutputs = await collectGeneratedOutputs();
  const unstaged = collectChangedFiles(['diff', '--name-only', '--', ...generatedOutputs]);
  const untracked = collectChangedFiles(['ls-files', '--others', '--exclude-standard', '--', ...generatedOutputs]);
  const changed = [...new Set([...unstaged, ...untracked])].sort();

  console.log(`[generated] groups=${groups.length} outputs=${generatedOutputs.length}`);
  for (const group of groups) {
    console.log(`  ${group.label}: ${group.paths.length}`);
  }

  // Ensure all generated files actually exist on disk
  const missing: string[] = [];
  for (const output of generatedOutputs) {
    try {
      await fs.access(output);
    } catch {
      missing.push(output);
    }
  }

  if (missing.length) {
    console.log(`[generated] missing=${missing.length}`);
    for (const file of missing.slice(0, 20)) {
      console.log(`  missing: ${file}`);
    }
    process.exit(1);
  }

  if (!changed.length) {
    console.log('[generated] passed');
    return;
  }

  if (allowDirty) {
    console.log(`[generated] passed (${changed.length} generated file(s) modified in working tree)`);
    return;
  }

  console.log(`[generated] uncommitted=${changed.length}`);
  for (const file of changed.slice(0, 20)) {
    console.log(`  uncommitted: ${file}`);
  }
  if (changed.length > 20) {
    console.log(`  ... ${changed.length - 20} more uncommitted generated file(s)`);
  }
  console.log('[generated] commit these outputs with the source change, or rerun with --allow-dirty');
  process.exit(1);
}
