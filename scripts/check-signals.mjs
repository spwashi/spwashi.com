#!/usr/bin/env node
/**
 * What the gate has been saying lately, without running it.
 *
 * Every check:local run (and every push, through check:pushed) appends one
 * line to .agents/state/runtime/check-history.jsonl. This reads that window as
 * one picture for a director between pushes: how often the gate passed, which
 * bundles grew, how the test count moved, what sits near a limit, and each
 * warning still standing with the date it first appeared. An agent can read
 * the same with --json before deciding whether a warning is its own.
 *
 *   npm run check:signals
 *   npm run check:signals -- --last 20 --json
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { digestHistory, formatDigest } from './lib/check-signals.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : null;
};
const file = process.env.SPW_CHECK_HISTORY || path.join(process.cwd(), '.agents/state/runtime/check-history.jsonl');
let entries = [];
try {
  entries = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
} catch {
  entries = [];
}
const last = Number(flag('--last')) || 0;
if (last > 0) entries = entries.slice(-last);
const digest = digestHistory(entries);
if (args.includes('--json')) process.stdout.write(`${JSON.stringify(digest, null, 2)}\n`);
else process.stdout.write(`${formatDigest(digest).join('\n')}\n`);
