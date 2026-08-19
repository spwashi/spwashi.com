#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { MODULE_TEST_FILES, MODULE_TEST_IMPORTS } from './module-tests.mjs';

const args = [
  ...MODULE_TEST_IMPORTS.flatMap((specifier) => ['--import', specifier]),
  '--test',
  ...MODULE_TEST_FILES,
];

const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
