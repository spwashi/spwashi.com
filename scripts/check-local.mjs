/**
 * `check:local` — the full local validation gate.
 *
 * Runs as one process instead of a chain of `npm run` calls (each of those cost
 * a full npm boot), in two waves:
 *
 *   1. compile   four tsc passes, concurrent (see build-compile.mjs);
 *                css-build --check --strict-budget starts as soon as build:tools is green
 *   2. validate  the validators, concurrent — all are read-only over the tree
 *                and generated output, so they cannot race each other
 *
 * Output is buffered per stage and printed in declaration order, so a parallel
 * run reads the same as a serial one. Pass --serial to run every stage
 * end-to-end when isolating a failure.
 *
 * A passing stage prints its headline (tagged result lines, warnings, a test
 * count); a failing one prints everything. --verbose, SPW_CHECK_VERBOSE=1 or
 * CI prints everything. The full text of every stage goes to SPW_CHECK_LOG
 * (default .agents/state/runtime/check-local-last.log).
 *
 * Deploy's extra step is `npm run build:site:run` (catalog bundle into dist/).
 * This gate does not copy dist/. Catalog Node imports are covered by
 * infrastructure-contracts via scripts/lib/register-public-imports.mjs.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { isVerboseRun, reportStages, runCommand, runCompile } from './build-compile.mjs';

const allowDirty = process.argv.includes('--allow-dirty') || process.argv.includes('--dirty');

const VALIDATORS = [
  { label: 'check-site', script: 'scripts/check-site.mjs' },
  { label: 'check-runtime-bindings', script: 'scripts/check-runtime-bindings.mjs' },
  { label: 'pwa-contracts', script: 'scripts/pwa-contracts.mjs' },
  {
    label: 'check-generated',
    args: allowDirty ? ['scripts/check-generated.mjs', '--allow-dirty'] : ['scripts/check-generated.mjs'],
  },
  { label: 'component-contracts', script: 'scripts/component-contracts.mjs' },
  { label: 'check-observation-locality', script: 'scripts/check-observation-locality.mjs' },
  // Reach and layer order over public/js: an orphan or an unnamed static
  // upward import fails; the named seams live in the script.
  { label: 'audit-js-tree', args: ['scripts/js-tree-value.mjs', '--check'] },
  // Operator controls in the routes: a visible sigil and its authored
  // data-spw-operator must agree, and a sigil-led control must author one.
  {
    label: 'audit-operator-controls',
    args: ['--import', './scripts/lib/register-public-imports.mjs', 'scripts/audit-operator-controls.mjs', '--check'],
  },
  // Folio high-res: five a week under a size cap, page links equal to the
  // latest week's set. A stale week prints a warning and does not fail.
  { label: 'audit-folio-highres', args: ['scripts/audit-folio-highres.mjs', '--check'] },
  { label: 'check-agents', script: 'scripts/check-agent-contracts.mjs' },
  { label: 'check-workers', script: 'scripts/check-workers.mjs', headline: { tests: true, tag: 'check:workers' } },
  // Skipped when the tree matches the last green run (see run-module-tests.mjs);
  // --force re-runs it.
  {
    label: 'test:modules',
    args: ['scripts/run-module-tests.mjs', ...(process.argv.includes('--force') ? [] : ['--cached'])],
    headline: { tests: true, tag: 'test:modules' },
  },
];

const serial = process.argv.includes('--serial');
const force = process.argv.includes('--force') || process.env.SPW_TSC_FORCE === '1';
const started = Date.now();

const runNode = ({ label, script, args, headline }) => runCommand(process.execPath, script ? [script] : args, label)
  .then((result) => ({ ...result, headline }));

const verbose = isVerboseRun();
const logFile = process.env.SPW_CHECK_LOG || path.join(process.cwd(), '.agents/state/runtime/check-local-last.log');
const logged = [];

function writeLog() {
  try {
    mkdirSync(path.dirname(logFile), { recursive: true });
    writeFileSync(logFile, logged.map(({ prefix, label, status, ms, output }) => (
      `[${prefix}] ${label} ${status === 0 ? 'ok' : 'FAILED'} ${(ms / 1000).toFixed(2)}s\n${(output || '').trimEnd()}\n`
    )).join('\n'));
    return true;
  } catch {
    return false;
  }
}

function bail(prefix, results) {
  logged.push(...results.map((result) => ({ prefix, ...result })));
  const failed = reportStages(prefix, results, { verbose });
  if (!failed.length) return;
  writeLog();
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

const { compileResults, cssResult } = await runCompile({ serial, withCss: true, force });
bail('compile', compileResults);
if (cssResult) bail('css', [cssResult]);
bail('validate', await runWave(VALIDATORS, serial ? 1 : Math.max(2, availableParallelism() - 1)));

const shownLog = path.relative(process.cwd(), logFile).startsWith('..') ? logFile : path.relative(process.cwd(), logFile);
const where = writeLog() && !verbose ? `; every stage in full: ${shownLog}` : '';
console.log(`[check:local] passed ${((Date.now() - started) / 1000).toFixed(2)}s${where}`);
