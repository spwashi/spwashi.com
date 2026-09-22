#!/usr/bin/env node
/**
 * CSS history — the core stylesheet measured at past commits.
 *
 * The payload report says what core.css weighs today. This says how it got
 * here: for the last commit of each week that touched the bundle, it reads the
 * committed file from git, derives the delivered form the deploy ships today
 * (cssForDelivery), and gzips both. It also counts the routes that existed
 * then, so the numbers read against how much site they were dressing.
 *
 * Nothing is checked out and nothing is written. Older weeks are measured with
 * today's delivery pass; that is the point — it shows what each week would
 * have cost a visitor had the pass existed then, beside what it did cost.
 *
 * Usage:
 *   node scripts/css-history.mjs            # weekly table
 *   node scripts/css-history.mjs --json
 *   node scripts/css-history.mjs --every    # every commit, not weekly
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { cssForDelivery } from './typed/css-delivery.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = 'public/css/bundles/core.css';
const args = new Set(process.argv.slice(2));

function git(argv) {
  return execFileSync('git', argv, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
}

/** Monday of the ISO week a date falls in, as YYYY-MM-DD. */
function weekOf(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

function countRoutes(rev) {
  return git(['ls-tree', '-r', '--name-only', rev])
    .split('\n')
    .filter((file) => file.endsWith('/index.html') && !/^(?:public|scripts|src|captures|dist|\.)/.test(file))
    .length + 1;
}

function measure(rev) {
  const source = git(['show', `${rev}:${BUNDLE}`]);
  const delivered = cssForDelivery(source);
  return {
    committedKiB: Buffer.byteLength(source, 'utf8') / 1024,
    deliveredKiB: Buffer.byteLength(delivered, 'utf8') / 1024,
    committedGzipKiB: gzipSync(source, { level: 9 }).length / 1024,
    deliveredGzipKiB: gzipSync(delivered, { level: 9 }).length / 1024,
  };
}

const commits = git(['log', '--reverse', '--format=%H %ad %s', '--date=short', '--', BUNDLE])
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [hash, date, ...subject] = line.split(' ');
    return { hash, date, subject: subject.join(' ') };
  });

const picked = args.has('--every')
  ? commits
  : [...commits.reduce((weeks, commit) => weeks.set(weekOf(commit.date), commit), new Map()).values()];

const rows = picked.map((commit) => {
  const numbers = measure(commit.hash);
  return {
    date: commit.date,
    commit: commit.hash.slice(0, 8),
    subject: commit.subject,
    routes: countRoutes(commit.hash),
    ...Object.fromEntries(Object.entries(numbers).map(([key, value]) => [key, Number(value.toFixed(1))])),
  };
});

if (args.has('--json')) {
  console.log(JSON.stringify({ bundle: BUNDLE, generatedAt: new Date().toISOString(), rows }, null, 2));
} else {
  const pad = (value, width) => String(value).padStart(width);
  console.log(`core.css through history — committed and delivered KiB, raw and gzip (${rows.length} ${args.has('--every') ? 'commits' : 'weeks'})`);
  console.log('');
  console.log(`date        commit    routes  committed  gzip   delivered  gzip`);
  for (const row of rows) {
    console.log(
      `${row.date}  ${row.commit}  ${pad(row.routes, 6)}  ${pad(Math.round(row.committedKiB), 9)}  ${pad(Math.round(row.committedGzipKiB), 5)}  `
      + `${pad(Math.round(row.deliveredKiB), 9)}  ${pad(Math.round(row.deliveredGzipKiB), 4)}`,
    );
  }
  console.log('');
  console.log('Delivered columns apply today\'s deploy pass (comments and indentation out) to each week\'s bundle.');
}
