#!/usr/bin/env node
/**
 * audit-folio-highres.mjs
 *
 * High-res folio scans open five at a time, one set per ISO week
 * (public/data/folio-highres.json). This reads the record, the files, and the
 * folio page together.
 *
 *   errors    a week over perWeek, a file missing or over capBytes, a slug
 *             without its sidecar or with another folio's id, weeks out of
 *             order, or page links that are not exactly the latest week's set.
 *   warnings  the latest week is behind the calendar (the set is stale), or
 *             it repeats the week before it. A stale set is a nudge, not a
 *             broken build.
 *
 *   node scripts/audit-folio-highres.mjs [--check] [--today=YYYY-MM-DD]
 *
 *   --check   exit 1 on any error
 *   --today   judge staleness against this date instead of now
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { isoWeek, parseWeek, weekStart } from './lib/iso-week.mjs';

const ROOT = process.cwd();
const RECORD = 'public/data/folio-highres.json';
const PAGE = 'design/folios/index.html';
const ASSETS = 'public/images/assets/folios';

const check = process.argv.includes('--check');
const todayArg = process.argv.find((arg) => arg.startsWith('--today='));
const today = todayArg ? new Date(`${todayArg.slice(8)}T12:00:00Z`) : new Date();

const errors = [];
const warnings = [];
const record = JSON.parse(fs.readFileSync(path.join(ROOT, RECORD), 'utf8'));
const weeks = Array.isArray(record.weeks) ? record.weeks : [];

let previous = null;
for (const entry of weeks) {
  const parsed = parseWeek(entry.week);
  if (!parsed) {
    errors.push(`${entry.week}: not an ISO week label like 2026-W39`);
    continue;
  }
  if (previous && weekStart(parsed) <= weekStart(previous)) {
    errors.push(`${entry.week}: weeks must run forward, one entry per week`);
  }
  previous = parsed;
  const folios = entry.folios || [];
  if (folios.length > record.perWeek) {
    errors.push(`${entry.week}: ${folios.length} folios, over the ${record.perWeek} a week`);
  }
  for (const { id, slug } of folios) {
    const sidecar = path.join(ROOT, ASSETS, `folio-${slug}.spw`);
    if (!fs.existsSync(sidecar)) {
      errors.push(`${entry.week}: no sidecar for ${slug}`);
    } else if (!fs.readFileSync(sidecar, 'utf8').includes(`id: "${id}"`)) {
      errors.push(`${entry.week}: ${slug} is not ${id}`);
    }
    const file = path.join(ROOT, ASSETS, `folio-${slug}-full.webp`);
    if (!fs.existsSync(file)) {
      errors.push(`${entry.week}: missing ${path.relative(ROOT, file)}`);
    } else if (fs.statSync(file).size > record.capBytes) {
      errors.push(`${entry.week}: ${path.basename(file)} is ${Math.round(fs.statSync(file).size / 1024)} KiB, over ${Math.round(record.capBytes / 1024)} KiB`);
    }
  }
}

const latest = weeks.at(-1);
const latestSlugs = new Set((latest?.folios || []).map((folio) => folio.slug));
const page = fs.readFileSync(path.join(ROOT, PAGE), 'utf8');
const linked = new Set([...page.matchAll(/folio-([a-z0-9-]+)-full\.webp"[^>]*data-folio-highres/g)].map((m) => m[1]));
const missingOnPage = [...latestSlugs].filter((slug) => !linked.has(slug));
const extraOnPage = [...linked].filter((slug) => !latestSlugs.has(slug));
if (missingOnPage.length) errors.push(`${PAGE}: no high-res link for ${missingOnPage.join(', ')}`);
if (extraOnPage.length) errors.push(`${PAGE}: high-res link outside ${latest?.week}: ${extraOnPage.join(', ')}`);

if (latest && parseWeek(latest.week)) {
  const now = isoWeek(today);
  const behind = Math.round((weekStart(now) - weekStart(parseWeek(latest.week))) / (7 * 86400000));
  if (behind > 0) {
    warnings.push(`high-res set stale for ${behind} week${behind === 1 ? '' : 's'}: latest is ${latest.week}, this is ${now.year}-W${String(now.week).padStart(2, '0')}. Open five more in ${RECORD}.`);
  }
  const before = weeks.at(-2);
  if (before) {
    const prior = new Set((before.folios || []).map((folio) => folio.slug));
    if (prior.size === latestSlugs.size && [...prior].every((slug) => latestSlugs.has(slug))) {
      warnings.push(`${latest.week} repeats ${before.week}; the five did not change.`);
    }
  }
}

console.log(`[folio-highres] ${weeks.length} week(s); latest ${latest?.week || 'none'} with ${latestSlugs.size} folio(s); ${linked.size} linked on the page`);
for (const warning of warnings) console.log(`  ⚠ ${warning}`);
for (const error of errors) console.log(`  ✗ ${error}`);
if (check && errors.length) process.exit(1);
