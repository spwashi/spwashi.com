#!/usr/bin/env node
/**
 * Sense-first dispatcher. Copy and nouns are cheap. Ink needs a fixture id
 * so it does not start the full visual:checks pack.
 *
 *   npm run sense
 *   npm run sense -- copy
 *   npm run sense -- nouns
 *   npm run sense -- ink about-opening
 *   npm run sense -- ids
 *   npm run sense -- doctor [--reap]   # QA preflight: sandbox, orphans, bundles
 *   npm run sense -- roots [--routes /,/about/]   # who writes to the page root on arrival
 *   npm run sense -- signals [--last 20]   # what the gate has said lately: new, moved, awaiting a decision
 *   npm run sense -- wander [seed] [--count N] [--run]   # seeded odd stills; dry unless --run
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  VIEWPORT_STILL_CHECKS,
  VIEWPORT_STILL_RECIPES,
  VIEWPORT_STILL_WANDERS,
} from './lib/viewport-still-recipes.mjs';
import {
  WANDER_DEFAULT_COUNT,
  formatWanderReceipt,
  wanderBatch,
  loadWanderSpell,
  wanderCaptureCommand,
} from './lib/visual-capture-plan.mjs';

export function listSenseFixtures() {
  return [...VIEWPORT_STILL_RECIPES, ...VIEWPORT_STILL_CHECKS, ...VIEWPORT_STILL_WANDERS];
}

export const SENSE_KINDS = Object.freeze({
  copy: { script: 'audit:copy:accessor', label: 'copy / voice' },
  nouns: { script: 'audit:module-selectors', label: 'catalog nouns' },
  stills: { script: 'audit:stills', label: 'still / module coverage' },
  ink: { script: 'visual:checks', label: 'ink / chrome', needsId: true },
  roots: { script: 'audit:root-writes', label: 'root writes on arrival', passArgs: true },
  signals: { script: 'check:signals', label: 'gate history', passArgs: true },
});

export function parseSenseArgs(argv) {
  const tokens = argv.filter((arg) => arg !== '--');
  const kind = String(tokens[0] || '').trim().toLowerCase();
  return { kind, rest: tokens.slice(1) };
}

export function resolveInkIds(rest) {
  const ids = [];
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--ids' && rest[i + 1]) {
      ids.push(...String(rest[i + 1]).split(','));
      i += 1;
      continue;
    }
    if (arg.startsWith('--ids=')) {
      ids.push(...arg.slice(6).split(','));
      continue;
    }
    if (!arg.startsWith('-')) ids.push(arg);
  }
  return ids.map((id) => id.trim()).filter(Boolean);
}

/** `wander [seed] [--count N] [--run]`. The seed defaults to the UTC date inside wanderBatch. */
export function parseWanderArgs(rest = []) {
  let seed;
  let count = WANDER_DEFAULT_COUNT;
  let run = false;
  for (let i = 0; i < rest.length; i += 1) {
    const arg = String(rest[i]);
    if (arg === '--run') run = true;
    else if (arg === '--count' && rest[i + 1]) count = Number(rest[++i]) || count;
    else if (arg.startsWith('--count=')) count = Number(arg.slice(8)) || count;
    else if (arg === '--seed' && rest[i + 1]) seed = rest[++i];
    else if (arg.startsWith('--seed=')) seed = arg.slice(7);
    else if (!arg.startsWith('-') && seed === undefined) seed = arg;
  }
  return { seed, count, run };
}

/** Dry by default: the receipt, then the one command that captures it. */
export function wanderSense(rest = []) {
  const { seed, count, run } = parseWanderArgs(rest);
  const receipt = wanderBatch({ seed, n: count, spell: loadWanderSpell(seed) });
  const command = wanderCaptureCommand(receipt);
  return { receipt, command, run, text: `${formatWanderReceipt(receipt)}\ncapture: ${command}\n` };
}

export function formatStillIds(recipes = listSenseFixtures()) {
  const width = recipes.reduce((max, recipe) => Math.max(max, recipe.id.length), 0);
  return recipes
    .map((recipe) => `${recipe.id.padEnd(width + 2)}${recipe.specimenRoute}  ${recipe.label}`)
    .join('\n');
}

export function formatSenseMenu(recipes = listSenseFixtures()) {
  return [
    '[sense] doctor  npm run sense -- doctor   (preflight before any headless run)',
    '[sense] copy    npm run sense -- copy',
    '[sense] nouns   npm run sense -- nouns',
    '[sense] stills  npm run sense -- stills',
    '[sense] roots   npm run sense -- roots [--routes /,/about/]   (headless; who writes to the page root on arrival)',
    '[sense] signals npm run sense -- signals   (what the gate said lately; nothing runs)',
    '[sense] ink     npm run sense -- ink <fixture>',
    `[sense] ids     ${recipes.length} fixtures — npm run sense -- ids`,
    '[sense] wander  npm run sense -- wander [seed]   (seeded odd stills; dry until --run)',
    '[sense] ink without an id lists fixtures instead of starting the full pack.',
  ].join('\n');
}

function runNpm(script, extra = []) {
  const args = extra.length ? ['run', script, '--', ...extra] : ['run', script];
  const result = spawnSync('npm', args, { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}

function main(argv = process.argv.slice(2)) {
  const { kind, rest } = parseSenseArgs(argv);
  if (!kind || kind === 'help' || kind === '-h' || kind === '--help') {
    process.stdout.write(`${formatSenseMenu()}\n`);
    process.exit(0);
  }
  if (kind === 'doctor') {
    const script = path.join(path.dirname(new URL(import.meta.url).pathname), 'qa-doctor.mjs');
    const result = spawnSync(process.execPath, [script, ...rest], { stdio: 'inherit' });
    process.exit(result.status ?? 1);
  }
  if (kind === 'wander') {
    const { receipt, text, run } = wanderSense(rest);
    process.stdout.write(text);
    if (!run) process.exit(0);
    const extra = ['--profile', 'wander', '--seed', receipt.seed];
    if (receipt.n !== WANDER_DEFAULT_COUNT) extra.push('--count', String(receipt.n));
    runNpm('visual:capture', extra);
  }
  if (kind === 'ids') {
    process.stdout.write(`${formatStillIds()}\n`);
    process.stdout.write('\nink: npm run sense -- ink about-opening\n');
    process.exit(0);
  }
  const spec = SENSE_KINDS[kind];
  if (!spec) {
    process.stderr.write(`[sense] unknown kind "${kind}". Use doctor, copy, nouns, stills, roots, signals, ink, ids, or wander.\n`);
    process.stderr.write(`${formatSenseMenu()}\n`);
    process.exit(2);
  }
  if (spec.needsId) {
    const ids = resolveInkIds(rest);
    if (!ids.length) {
      process.stderr.write('[sense] ink needs a fixture id. Full visual:checks is dear.\n');
      process.stdout.write(`${formatStillIds()}\n`);
      process.stdout.write('\nink: npm run sense -- ink about-opening\n');
      process.exit(2);
    }
    runNpm(spec.script, [`--ids=${ids.join(',')}`]);
  }
  runNpm(spec.script, spec.passArgs ? rest : []);
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) main();
