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
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { VIEWPORT_STILL_CHECKS, VIEWPORT_STILL_RECIPES } from './lib/viewport-still-recipes.mjs';

export function listSenseFixtures() {
  return [...VIEWPORT_STILL_RECIPES, ...VIEWPORT_STILL_CHECKS];
}

export const SENSE_KINDS = Object.freeze({
  copy: { script: 'audit:copy:accessor', label: 'copy / voice' },
  nouns: { script: 'audit:module-selectors', label: 'catalog nouns' },
  ink: { script: 'visual:checks', label: 'ink / chrome', needsId: true },
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

export function formatStillIds(recipes = listSenseFixtures()) {
  const width = recipes.reduce((max, recipe) => Math.max(max, recipe.id.length), 0);
  return recipes
    .map((recipe) => `${recipe.id.padEnd(width + 2)}${recipe.specimenRoute}  ${recipe.label}`)
    .join('\n');
}

export function formatSenseMenu(recipes = listSenseFixtures()) {
  return [
    '[sense] copy    npm run sense -- copy',
    '[sense] nouns   npm run sense -- nouns',
    '[sense] ink     npm run sense -- ink <fixture>',
    `[sense] ids     ${recipes.length} fixtures — npm run sense -- ids`,
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
  if (kind === 'ids') {
    process.stdout.write(`${formatStillIds()}\n`);
    process.stdout.write('\nink: npm run sense -- ink about-opening\n');
    process.exit(0);
  }
  const spec = SENSE_KINDS[kind];
  if (!spec) {
    process.stderr.write(`[sense] unknown kind "${kind}". Use copy, nouns, ink, or ids.\n`);
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
  runNpm(spec.script);
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) main();
