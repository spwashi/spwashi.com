#!/usr/bin/env node
/**
 * Run the module suite. `--cached` (what check:local passes) skips the run when
 * the working tree matches the last green run's content fingerprint; a direct
 * `npm run test:modules:run` always runs. SPW_TEST_FORCE=1 ignores the stamp.
 *
 * The suite is ~58 files at one Node process each, and most of its CPU is
 * process boot, so a skipped run is the saving that matters on pre-push and
 * check:watch reruns.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { MODULE_TEST_FILES, MODULE_TEST_IMPORTS } from './module-tests.mjs';
import { readStageStamp, treeFingerprint, writeStageStamp } from './lib/tree-fingerprint.mjs';

const STAMP = 'test-modules';
const cached = process.argv.includes('--cached') && process.env.SPW_TEST_FORCE !== '1';
const fingerprint = cached ? await treeFingerprint(`files:${MODULE_TEST_FILES.join(',')}`) : '';

if (fingerprint && fingerprint === await readStageStamp(STAMP)) {
  console.log(`[test:modules] cache — tree ${fingerprint.slice(0, 12)} passed last run`);
  process.exit(0);
}

const args = [
  ...MODULE_TEST_IMPORTS.flatMap((specifier) => ['--import', specifier]),
  '--test',
  ...MODULE_TEST_FILES,
];

const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
if (result.status === 0) await writeStageStamp(STAMP, fingerprint);
process.exit(result.status ?? 1);
