/**
 * `check:local` — the full local validation gate.
 *
 * Runs as one process instead of a chain of `npm run` calls (each of those cost
 * a full npm boot), in three waves:
 *
 *   1. compile   three tsc passes, concurrent (see build-compile.mjs)
 *   2. css       css-build, which the contract validators read
 *   3. validate  the validators, concurrent — all are read-only over the tree
 *                and generated output, so they cannot race each other
 *
 * Output is buffered per stage and printed in declaration order, so a parallel
 * run reads the same as a serial one. Pass --serial to run every stage
 * end-to-end when isolating a failure.
 *
 * Deploy's extra step is `npm run build:site:run` (catalog bundle into dist/).
 * This gate does not copy dist/. Catalog Node imports are covered by
 * infrastructure-contracts via scripts/lib/register-public-imports.mjs.
 */
import { availableParallelism } from 'node:os';
import process from 'node:process';

import { reportStages, runCommand, runCompile } from './build-compile.mjs';

const allowDirty = process.argv.includes('--allow-dirty') || process.argv.includes('--dirty');

const VALIDATORS = [
  { label: 'check-site', script: 'scripts/check-site.mjs' },
  { label: 'pwa-contracts', script: 'scripts/pwa-contracts.mjs' },
  {
    label: 'check-generated',
    args: allowDirty ? ['scripts/check-generated.mjs', '--allow-dirty'] : ['scripts/check-generated.mjs'],
  },
  { label: 'component-contracts', script: 'scripts/component-contracts.mjs' },
  { label: 'check-observation-locality', script: 'scripts/check-observation-locality.mjs' },
  { label: 'check-agents', script: 'scripts/check-agent-contracts.mjs' },
  {
    label: 'test:modules',
    script: 'scripts/run-module-tests.mjs',
  },
];

const serial = process.argv.includes('--serial');
const started = Date.now();

const runNode = ({ label, script, args }) => runCommand(process.execPath, script ? [script] : args, label);

function bail(prefix, results) {
  const failed = reportStages(prefix, results);
  if (!failed.length) return;
  console.log(`[check:local] failed at ${prefix}: ${failed.map((result) => result.label).join(', ')}`);
  process.exit(1);
}

/**
 * Run the wave with at most `limit` validators in flight. check-site spawns its
 * own batch workers, so an unbounded wave would oversubscribe a small CI runner.
 * Results stay in declaration order regardless of completion order.
 */
async function runWave(validators, limit) {
  const results = new Array(validators.length);
  let next = 0;
  const worker = async () => {
    while (next < validators.length) {
      const index = next;
      next += 1;
      results[index] = await runNode(validators[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, validators.length) }, worker));
  return results;
}

bail('compile', await runCompile({ serial }));
bail('css', [await runNode({ label: 'css-build', script: 'scripts/css-build.mjs' })]);
bail('validate', await runWave(VALIDATORS, serial ? 1 : Math.max(2, availableParallelism() - 1)));

console.log(`[check:local] passed ${((Date.now() - started) / 1000).toFixed(2)}s`);
