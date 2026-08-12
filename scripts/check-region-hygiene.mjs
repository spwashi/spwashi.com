#!/usr/bin/env node
/**
 * Region hygiene check for public route HTML.
 *
 * Every `.site-frame` / article.site-frame should carry:
 *   - id (for page-region-rail + section-handle)
 *   - data-spw-kind
 *   - data-spw-role
 *
 * Entry spines (site-hero or liminality=entry with composition-stability=anchored)
 * should also declare data-spw-region-purpose.
 *
 * Usage:
 *   node scripts/check-region-hygiene.mjs
 *   node scripts/check-region-hygiene.mjs --json
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-vite',
  '.git',
  '.spw',
  '_workbench',
  'design/catalog',
]);

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === 'index.html') acc.push(full);
  }
  return acc;
}

function hasAttr(attrs, name) {
  return new RegExp(`\\b${name}\\s*=`, 'i').test(attrs);
}

function attr(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[2] ?? match[3] ?? '') : '';
}

function classList(attrs) {
  return attr(attrs, 'class');
}

function analyze(filePath) {
  const html = readFileSync(filePath, 'utf8');
  const rel = path.relative(ROOT, filePath).split(path.sep).join('/');
  const issues = [];
  const re = /<(section|article)\b([\s\S]*?)>/gi;
  let match;
  let frames = 0;

  while ((match = re.exec(html))) {
    const attrs = match[2];
    const classes = classList(attrs);
    if (!/\bsite-frame\b/.test(classes)) continue;
    frames += 1;

    const id = attr(attrs, 'id') || '(no-id)';
    if (!hasAttr(attrs, 'id')) {
      issues.push({ id, code: 'missing-id', detail: 'site-frame needs an id for region rail / section handle' });
    }
    if (!hasAttr(attrs, 'data-spw-kind')) {
      issues.push({ id, code: 'missing-kind', detail: 'expected data-spw-kind (usually frame)' });
    }
    if (!hasAttr(attrs, 'data-spw-role')) {
      issues.push({ id, code: 'missing-role', detail: 'expected data-spw-role' });
    }

    const isEntrySpine =
      /\bsite-hero\b/.test(classes)
      || (attr(attrs, 'data-spw-liminality') === 'entry'
        && attr(attrs, 'data-spw-composition-stability') === 'anchored');

    if (isEntrySpine && !hasAttr(attrs, 'data-spw-region-purpose')) {
      issues.push({
        id,
        code: 'missing-region-purpose',
        detail: 'entry spine should declare data-spw-region-purpose (e.g. public-spine)',
      });
    }
  }

  return { file: rel, frames, issues };
}

function main() {
  const asJson = process.argv.includes('--json');
  const files = walk(ROOT);
  const reports = files.map(analyze).filter((r) => r.frames > 0);
  const dirty = reports.filter((r) => r.issues.length > 0);
  const totals = reports.reduce(
    (acc, r) => {
      acc.frames += r.frames;
      acc.issues += r.issues.length;
      return acc;
    },
    { frames: 0, issues: 0 },
  );

  if (asJson) {
    process.stdout.write(`${JSON.stringify({ totals, dirty }, null, 2)}\n`);
  } else {
    console.log(`[region-hygiene] routes=${reports.length} frames=${totals.frames} issues=${totals.issues}`);
    for (const report of dirty.slice(0, 40)) {
      console.log(`  ${report.file} (${report.issues.length})`);
      for (const issue of report.issues.slice(0, 6)) {
        console.log(`    - ${issue.code} @ ${issue.id}: ${issue.detail}`);
      }
    }
    if (dirty.length > 40) console.log(`  … ${dirty.length - 40} more routes`);
  }

  process.exitCode = dirty.length ? 1 : 0;
}

main();
