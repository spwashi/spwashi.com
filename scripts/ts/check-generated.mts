import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { collectCssBuildPlan } from './css-build.mjs';

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

export async function collectGeneratedGroups(): Promise<GeneratedGroup[]> {
  const cssPlan = await collectCssBuildPlan();
  return [
    ...GENERATED_TS_GROUPS,
    {
      label: 'css',
      paths: cssPlan.map((entry) => entry.output).sort(),
    },
  ];
}

export async function collectGeneratedOutputs(): Promise<string[]> {
  const groups = await collectGeneratedGroups();
  return groups.flatMap((group) => group.paths).sort();
}

export async function main(): Promise<void> {
  const groups = await collectGeneratedGroups();
  const generatedOutputs = await collectGeneratedOutputs();
  const unstaged = collectChangedFiles(['diff', '--name-only', '--', ...generatedOutputs]);
  const untracked = collectChangedFiles(['ls-files', '--others', '--exclude-standard', '--', ...generatedOutputs]);
  const changed = [...new Set([...unstaged, ...untracked])].sort();

  console.log(`[generated] groups=${groups.length} outputs=${generatedOutputs.length}`);
  for (const group of groups) {
    console.log(`  ${group.label}: ${group.paths.length}`);
  }

  if (!changed.length) {
    console.log('[generated] passed');
    return;
  }

  console.log(`[generated] stale=${changed.length}`);
  for (const file of changed.slice(0, 20)) {
    console.log(`  stale: ${file}`);
  }
  if (changed.length > 20) {
    console.log(`  ... ${changed.length - 20} more stale generated file(s)`);
  }
  process.exit(1);
}
