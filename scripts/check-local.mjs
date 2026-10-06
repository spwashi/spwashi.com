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
 * count); a failing one prints everything and the command that reruns it
 * alone. --verbose, SPW_CHECK_VERBOSE=1 or CI prints everything. Each run
 * writes the full text to SPW_CHECK_LOG (default
 * .agents/state/runtime/check-local-last.log), a JSON receipt beside it, and
 * one line to check-history.jsonl there; the run closes with what changed
 * since the last one (scripts/lib/check-signals.mjs). npm run check:signals
 * reads the history without running anything.
 *
 * Deploy's extra step is `npm run build:site:run` (catalog bundle into dist/).
 * This gate does not copy dist/. Catalog Node imports are covered by
 * infrastructure-contracts via scripts/lib/register-public-imports.mjs.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { isVerboseRun, reportStages, runCommand, runCompile } from './build-compile.mjs';
import { MODULE_TEST_IMPORTS } from './module-tests.mjs';
import {
  RECEIPT_SCHEMA,
  compareRuns,
  formatComparison,
  historyEntry,
  readSignals,
  rerunCommand,
  stageHeadline,
  trimHistory,
} from './lib/check-signals.mjs';

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
    headline: {
      tests: true,
      tag: 'test:modules',
      fileCommand: [process.execPath, ...MODULE_TEST_IMPORTS.flatMap((specifier) => ['--import', specifier]), '--test'],
    },
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

const receiptFile = logFile.replace(/\.log$/, '') + '.json';
const historyFile = process.env.SPW_CHECK_HISTORY || path.join(path.dirname(logFile), 'check-history.jsonl');
const shown = (file) => (path.relative(process.cwd(), file).startsWith('..') ? file : path.relative(process.cwd(), file));

/** Which tree this run judged: the commit, and how many files differ from it. */
function readTree() {
  try {
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    // A push checkout links node_modules in; that link is not a change to the tree.
    const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).split('\n')
      .filter((line) => line && line !== '?? node_modules');
    return { sha, dirty: { count: dirty.length, files: dirty.slice(0, 20).map((line) => line.slice(3)) } };
  } catch {
    return { sha: null, dirty: { count: 0, files: [] } };
  }
}

function readHistory() {
  try {
    return readFileSync(historyFile, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

/**
 * Leave the run behind for whoever reads it next: the full text, a receipt an
 * agent can parse, and one history line. Returns the closing comparison lines.
 */
function finish(verdict, failedAt = null) {
  const tree = readTree();
  const stages = logged.map((result) => ({
    prefix: result.prefix,
    label: result.label,
    status: result.status,
    ms: result.ms,
    cache: Boolean(result.cache),
    rerun: rerunCommand(result),
    headline: stageHeadline(result.output || '', result.headline),
    output: result.output,
  }));
  const history = readHistory();
  const signals = readSignals(stages, { previousTests: history.at(-1)?.tests || {} });
  const receipt = {
    schema: RECEIPT_SCHEMA,
    at: new Date().toISOString(),
    ...tree,
    verdict,
    failedAt,
    ms: Date.now() - started,
    stages: stages.map(({ output, ...stage }) => ({ ...stage })),
    signals,
    log: logFile,
  };
  const comparison = compareRuns(signals, history);
  receipt.comparison = {
    since: comparison.last ? comparison.last.sha : null,
    newWarnings: comparison.newWarnings.map((warning) => warning.text),
    cleared: comparison.cleared,
    moved: comparison.moved,
    standing: comparison.standing.map(({ id, kind, runs, since }) => ({ id, kind, runs, since })),
  };
  try {
    mkdirSync(path.dirname(logFile), { recursive: true });
    writeFileSync(logFile, stages.map(({ prefix, label, status, ms, output }) => (
      `[${prefix}] ${label} ${status === 0 ? 'ok' : 'FAILED'} ${(ms / 1000).toFixed(2)}s\n${(output || '').trimEnd()}\n`
    )).join('\n'));
    writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
    const lines = trimHistory([...history.map((entry) => JSON.stringify(entry)), JSON.stringify(historyEntry(receipt))]);
    writeFileSync(historyFile, `${lines.join('\n')}\n`);
  } catch (error) {
    console.log(`[check:local] could not write the receipt: ${error.message}`);
  }
  return { tree, lines: formatComparison(comparison) };
}

const describeTree = (tree) => (tree.sha ? ` on ${tree.sha.slice(0, 8)}${tree.dirty.count ? ` +${tree.dirty.count} uncommitted` : ''}` : '');

function bail(prefix, results) {
  logged.push(...results.map((result) => ({ prefix, ...result })));
  const failed = reportStages(prefix, results, { verbose });
  if (!failed.length) return;
  const { tree, lines } = finish('failed', prefix);
  for (const line of lines) console.log(line);
  console.log(`[check:local] failed at ${prefix}${describeTree(tree)}: ${failed.map((result) => result.label).join(', ')}; receipt ${shown(receiptFile)}`);
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

const { tree, lines } = finish('passed');
for (const line of lines) console.log(line);
const where = verbose ? '' : `; full text ${shown(logFile)}, receipt ${shown(receiptFile)}`;
console.log(`[check:local] passed ${((Date.now() - started) / 1000).toFixed(2)}s${describeTree(tree)}${where}`);
