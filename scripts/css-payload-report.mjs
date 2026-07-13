#!/usr/bin/env node
/**
 * CSS payload report — full style graph vs scoped bundles per surface.
 *
 * Usage:
 *   node scripts/css-payload-report.mjs
 *   node scripts/css-payload-report.mjs --json
 *   node scripts/css-payload-report.mjs --surface home,software,settings
 *   npm run css:payload
 *
 * Aligns with .spw/audits/build-runtime-performance-2026-07/build.spw
 * (core-css-bundle-size + scoped delivery).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  BEHAVIOR_SCOPES,
  CSS_BUNDLE_SOFT_BUDGETS,
  estimateCssPayload,
  listBundleTargets,
  resolveCanonicalRouteSurface,
  ROUTE_SCOPES,
  ROUTE_SURFACE_ALIASES,
} from './typed/css-manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const options = { json: false, surfaces: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--surface' && argv[i + 1]) {
      options.surfaces = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--surface=')) {
      options.surfaces = arg.slice('--surface='.length).split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return options;
}

async function walkIndexHtml(dir, out = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  const skip = new Set([
    '.git', 'node_modules', 'dist', 'dist-vite', 'public', 'scripts',
    'design', '.spw', '.agents', 'captures', 'src',
  ]);
  for (const ent of entries) {
    if (skip.has(ent.name) || ent.name.startsWith('.')) continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) await walkIndexHtml(abs, out);
    else if (ent.name === 'index.html') out.push(abs);
  }
  return out;
}

function extractAttr(html, name) {
  const re = new RegExp(`${name}="([^"]*)"`, 'i');
  return html.match(re)?.[1] || '';
}

async function collectLiveSurfaces() {
  const pages = await walkIndexHtml(ROOT);
  const bySurface = new Map();
  for (const file of pages) {
    const html = await fs.readFile(file, 'utf8');
    const surface = extractAttr(html, 'data-spw-surface') || '(none)';
    const features = (extractAttr(html, 'data-spw-features') || '').split(/\s+/).filter(Boolean);
    const mode = extractAttr(html, 'data-spw-stylesheet-mode') || 'full';
    const entry = bySurface.get(surface) || {
      surface,
      pages: 0,
      features: new Set(),
      modes: { full: 0, scoped: 0 },
    };
    entry.pages += 1;
    for (const f of features) entry.features.add(f);
    entry.modes[mode === 'scoped' ? 'scoped' : 'full'] += 1;
    bySurface.set(surface, entry);
  }
  return [...bySurface.values()].sort((a, b) => b.pages - a.pages || a.surface.localeCompare(b.surface));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(`css-payload-report — scoped vs full CSS bytes

Usage:
  npm run css:payload
  node scripts/css-payload-report.mjs --json
  node scripts/css-payload-report.mjs --surface home,software,settings
`);
    return;
  }

  const live = await collectLiveSurfaces();
  const surfaceList = options.surfaces
    || live.map((row) => row.surface).filter((s) => s !== '(none)');

  const full = await estimateCssPayload({ mode: 'full' });
  const rows = [];

  for (const surface of surfaceList) {
    const liveRow = live.find((row) => row.surface === surface);
    const features = liveRow
      ? [...liveRow.features]
      : Object.keys(BEHAVIOR_SCOPES);
    const scoped = await estimateCssPayload({
      surface,
      features: liveRow ? features : [],
      mode: 'scoped',
    });
    // Also estimate with live features when present
    const scopedLive = liveRow
      ? await estimateCssPayload({ surface, features, mode: 'scoped' })
      : scoped;

    rows.push({
      surface,
      canonical: resolveCanonicalRouteSurface(surface),
      pages: liveRow?.pages || 0,
      scopedSource: liveRow?.modes.scoped || 0,
      fullSource: liveRow?.modes.full || 0,
      features: liveRow ? features : [],
      scopedKiB: Math.round(scopedLive.bytes / 1024),
      fullAllBundlesKiB: Math.round(full.bytes / 1024),
      savedKiB: Math.round((full.bytes - scopedLive.bytes) / 1024),
      sheets: scopedLive.sheets.map((s) => (s.scope ? `${s.kind}:${s.scope}` : s.kind)),
      routeFiles: ROUTE_SCOPES[resolveCanonicalRouteSurface(surface)] || [],
    });
  }

  const coreTarget = listBundleTargets().find((t) => t.kind === 'core');
  let coreBytes = 0;
  if (coreTarget) {
    try {
      coreBytes = (await fs.stat(path.join(ROOT, coreTarget.href.replace(/^\//, '')))).size;
    } catch {
      coreBytes = 0;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    coreKiB: Math.round(coreBytes / 1024),
    coreSoftBudgetKiB: Math.round(CSS_BUNDLE_SOFT_BUDGETS.core / 1024),
    fullAllBundlesKiB: Math.round(full.bytes / 1024),
    aliases: ROUTE_SURFACE_ALIASES,
    routeSurfacesWithCss: Object.entries(ROUTE_SCOPES)
      .filter(([, files]) => files.length)
      .map(([k]) => k),
    rows,
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('CSS payload report (scoped delivery vs all bundles)');
  console.log(`  core.css: ${report.coreKiB} KiB (soft budget ${report.coreSoftBudgetKiB} KiB)`);
  console.log(`  all bundles (full approx): ${report.fullAllBundlesKiB} KiB`);
  console.log(`  aliases: ${JSON.stringify(ROUTE_SURFACE_ALIASES)}`);
  console.log('');
  const w = Math.max(...rows.map((r) => r.surface.length), 8);
  console.log(
    `${'surface'.padEnd(w)}  pages  scoped  scopedKiB  saveKiB  sheets`,
  );
  for (const row of rows) {
    console.log(
      `${row.surface.padEnd(w)}  ${String(row.pages).padStart(5)}  `
      + `${String(row.scopedSource).padStart(6)}  ${String(row.scopedKiB).padStart(9)}  `
      + `${String(row.savedKiB).padStart(7)}  ${row.sheets.join(',')}`,
    );
  }
  console.log('');
  console.log('Note: scoped pages rewrite style.css → core + route + behavior bundles at template render.');
  console.log('Core dominates (~1.5 MiB). Route scoping mainly drops other-route CSS (~0.4–0.6 MiB).');
}

await main();
