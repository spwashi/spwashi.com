import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { collectCssBuildPlan } from './css-build.mjs';
const GENERATED_ROOTS = [
    'scripts/typed',
    'public/js/typed',
];
function runGit(args) {
    return spawnSync('git', args, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
    });
}
function collectChangedFiles(args) {
    const result = runGit(args);
    if (result.status !== 0) {
        throw new Error(`[generated] git ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
    }
    return result.stdout
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
}
export async function collectGeneratedOutputs() {
    const cssPlan = await collectCssBuildPlan();
    return [...GENERATED_ROOTS, ...cssPlan.map((entry) => entry.output)].sort();
}
export async function main() {
    const generatedOutputs = await collectGeneratedOutputs();
    const unstaged = collectChangedFiles(['diff', '--name-only', '--', ...generatedOutputs]);
    const untracked = collectChangedFiles(['ls-files', '--others', '--exclude-standard', '--', ...generatedOutputs]);
    const changed = [...new Set([...unstaged, ...untracked])].sort();
    console.log(`[generated] outputs=${generatedOutputs.length}`);
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
