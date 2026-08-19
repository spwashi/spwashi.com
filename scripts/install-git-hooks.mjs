#!/usr/bin/env node
/**
 * Point this clone at versioned hooks in scripts/githooks/.
 * Safe to run from npm prepare / npm ci. No-ops outside a git work tree.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hooksPath = 'scripts/githooks';

if (!existsSync(path.join(root, '.git'))) {
  process.exit(0);
}

try {
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd: root,
    stdio: 'ignore',
  });
} catch {
  process.exit(0);
}

let current = '';
try {
  current = execFileSync('git', ['config', '--get', 'core.hooksPath'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  current = '';
}

if (current === hooksPath) {
  process.exit(0);
}

execFileSync('git', ['config', 'core.hooksPath', hooksPath], { cwd: root });
console.log(`[hooks] core.hooksPath=${hooksPath}`);
