/**
 * Compile step shared by `build` and `check:local`.
 *
 * Root typecheck, scripts emit, and runtime emit read disjoint inputs and
 * write disjoint outputs, so they run concurrently. public-sources is a
 * noEmit strict check of the same public/ts files against imported JS
 * types; it does not write, so it can join the wave.
 * `fix-typed-imports` rewrites kernel specifiers in public/js/typed and so
 * waits on the runtime pass only.
 *
 * Pass --serial to run one pass at a time when isolating a compile failure.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

const PASSES = [
  { name: 'typecheck:root', args: ['--noEmit'] },
  { name: 'build:tools', args: ['-p', 'tsconfig.scripts.json'] },
  { name: 'build:runtime', args: ['-p', 'tsconfig.runtime.json'], then: 'fix-typed-imports' },
  { name: 'typecheck:public-sources', args: ['-p', 'tsconfig.public-sources.json'] },
];

/**
 * Spawn a command, buffering output so concurrent stages never interleave.
 * Resolves rather than rejects; callers decide what a non-zero status means.
 */
export function runCommand(command, args, label) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.once('error', (error) => resolve({ label, status: 1, output: String(error), ms: Date.now() - started }));
    child.once('close', (status) => resolve({ label, status: status ?? 1, output, ms: Date.now() - started }));
  });
}

/** Invoke tsc through its entry script; the .bin shim adds a process per pass. */
const runTsc = (args, label) => runCommand(process.execPath, ['node_modules/typescript/bin/tsc', ...args], label);

async function runPass({ name, args, then }) {
  const started = Date.now();
  const result = await runTsc(args, name);
  if (result.status === 0 && then) {
    const followUp = await runCommand(process.execPath, [`scripts/${then}.mjs`], then);
    if (followUp.status !== 0) return { ...followUp, ms: Date.now() - started };
  }
  return { ...result, ms: Date.now() - started };
}

export async function runCompile({ serial = false } = {}) {
  const results = [];
  if (serial) {
    for (const pass of PASSES) results.push(await runPass(pass));
  } else {
    results.push(...(await Promise.all(PASSES.map(runPass))));
  }
  return results;
}

/** Print one line per stage plus any captured output; returns the failed stages. */
export function reportStages(prefix, results) {
  for (const { label, status, ms, output } of results) {
    console.log(`[${prefix}] ${label} ${status === 0 ? 'ok' : 'FAILED'} ${(ms / 1000).toFixed(2)}s`);
    if (output.trim()) console.log(output.trimEnd());
  }
  return results.filter((result) => result.status !== 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const failed = reportStages('compile', await runCompile({ serial: process.argv.includes('--serial') }));
  if (failed.length) {
    console.log(`[compile] failed: ${failed.map((result) => result.label).join(', ')}`);
    process.exit(1);
  }
}
