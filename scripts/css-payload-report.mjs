#!/usr/bin/env node
/**
 * CSS payload report — full style graph vs scoped bundles per surface.
 *
 * Usage:
 *   node scripts/css-payload-report.mjs
 *   node scripts/css-payload-report.mjs --json
 *   node scripts/css-payload-report.mjs --surface home,software,settings
 *   node scripts/css-payload-report.mjs --sheets      every sheet in core.css, by layer folder
 *   npm run css:payload
 *
 * core.css is also read sheet by sheet from its own provenance lines
 * (scripts/lib/css-sheet-shares.mjs). A sheet that shares a catalog module's id
 * carries that module's mount timing, so a sheet that ships at first paint for
 * a module that arrives later prints itself. The npm scripts load the
 * public-import hook for that join; without it the report runs and skips it.
 *
 * Aligns with .spw/audits/build-runtime-performance-2026-07/build.spw
 * (core-css-bundle-size + scoped delivery).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { formatKiB, lateOwnedSheets, readSheetShares } from './lib/css-sheet-shares.mjs';
import { cssForDelivery } from './typed/css-delivery.mjs';
import {
  BEHAVIOR_SCOPES,
  CSS_BUNDLE_SOFT_BUDGETS,
  estimateCssPayload,
  listBundleTargets,
  readStyleCoreImports,
  resolveCanonicalRouteSurface,
  ROUTE_SCOPES,
  ROUTE_SURFACE_ALIASES,
} from './typed/css-manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const options = { json: false, sheets: false, surfaces: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--sheets') options.sheets = true;
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

/** Catalog mount timing by module id; empty when the catalog cannot be imported (no public-import hook). */
async function readModuleMountTimings() {
  try {
    const { MODULE_DEFS } = await import('../public/js/runtime/catalog/index.js');
    return new Map(MODULE_DEFS.map((def) => [def.id, def.when]));
  } catch {
    return new Map();
  }
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
  node scripts/css-payload-report.mjs --sheets
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
  let coreDeliveredBytes = 0;
  let coreDeliveredGzipBytes = 0;
  let coreGzipBytes = 0;
  let coreSheets = null;
  if (coreTarget) {
    try {
      const source = await fs.readFile(path.join(ROOT, coreTarget.href.replace(/^\//, '')), 'utf8');
      const mountTimings = await readModuleMountTimings();
      coreSheets = { ...readSheetShares(source, { whenOf: (id) => mountTimings.get(id) }), moduleJoin: mountTimings.size > 0 };
      // The bundle should hold the sheets its entry imports, in that order. A
      // sheet added to style-core.css and not rebuilt shows here.
      const entry = (await readStyleCoreImports()).map((item) => item.file);
      const built = coreSheets.sheets.map((sheet) => sheet.href);
      const at = entry.findIndex((href, index) => href !== built[index]);
      coreSheets.entry = {
        sheets: entry.length,
        matches: at === -1 && entry.length === built.length,
        firstDifference: at === -1 ? (entry.length === built.length ? null : { index: entry.length, entry: null, bundle: built[entry.length] }) : { index: at, entry: entry[at], bundle: built[at] ?? null },
      };
      const delivered = cssForDelivery(source);
      coreBytes = Buffer.byteLength(source, 'utf8');
      coreGzipBytes = gzipSync(source, { level: 9 }).length;
      coreDeliveredBytes = Buffer.byteLength(delivered, 'utf8');
      coreDeliveredGzipBytes = gzipSync(delivered, { level: 9 }).length;
    } catch {
      coreBytes = 0;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    coreKiB: Math.round(coreBytes / 1024),
    coreSoftBudgetKiB: Math.round(CSS_BUNDLE_SOFT_BUDGETS.core / 1024),
    // What dist ships: the same rules without prose (scripts/ts/css-delivery.mts).
    coreDeliveredKiB: Math.round(coreDeliveredBytes / 1024),
    coreDeliveredGzipKiB: Math.round(coreDeliveredGzipBytes / 1024),
    coreGzipKiB: Math.round(coreGzipBytes / 1024),
    coreTransferSavedPercent: coreGzipBytes
      ? Number(((1 - coreDeliveredGzipBytes / coreGzipBytes) * 100).toFixed(1))
      : 0,
    fullAllBundlesKiB: Math.round(full.bytes / 1024),
    // core.css read from its own provenance lines: sheets + provenance + header = the bundle.
    coreSheets,
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
  console.log(`  core.css: ${report.coreKiB} KiB committed (soft budget ${report.coreSoftBudgetKiB} KiB)`);
  console.log(`            ${report.coreDeliveredKiB} KiB delivered — dist strips prose, rules unchanged`);
  console.log(`  over the wire (gzip): ${report.coreGzipKiB} → ${report.coreDeliveredGzipKiB} KiB, ${report.coreTransferSavedPercent}% smaller`);
  console.log(`  all bundles (full approx): ${report.fullAllBundlesKiB} KiB`);
  if (coreSheets) {
    const { folders, sheets, totalBytes, provenanceBytes, headerBytes, entry } = coreSheets;
    const pct = (share) => `${share.toFixed(1)}%`.padStart(6);
    const folderWidth = Math.max(...folders.map((row) => row.folder.length), 6);
    console.log('');
    console.log(`core.css by layer folder — ${sheets.length} sheets, ${totalBytes.toLocaleString('en-US')} B`);
    for (const folder of folders) {
      console.log(`  ${folder.folder.padEnd(folderWidth)}  ${formatKiB(folder.bytes).padStart(11)}  ${pct(folder.share)}  ${String(folder.sheets).padStart(3)} sheets`);
      if (!options.sheets) continue;
      for (const sheet of sheets.filter((entry) => entry.folder === folder.folder).sort((a, b) => b.bytes - a.bytes)) {
        const late = sheet.when && sheet.when !== 'immediate' ? `  arrives ${sheet.when}, ships at first paint` : '';
        console.log(`      ${formatKiB(sheet.bytes).padStart(11)}  ${pct(sheet.share)}  ${sheet.href.replace('/public/css/', '')}${late}`);
      }
    }
    console.log(`  with ${provenanceBytes.toLocaleString('en-US')} B of provenance lines and ${headerBytes} B of header, the rows are the whole bundle`);
    if (entry?.matches) {
      console.log(`  the sheets are the ${entry.sheets} that style-core.css imports, in its order`);
    } else if (entry) {
      const { index, entry: wanted, bundle: found } = entry.firstDifference;
      console.log(`  STALE BUNDLE: style-core.css imports ${entry.sheets} sheets and the bundle holds ${sheets.length}; at position ${index + 1} the entry has ${wanted || 'nothing'} and the bundle has ${found || 'nothing'}. Rebuild with npm run build:css.`);
    }
    const late = lateOwnedSheets(coreSheets);
    if (late.length) {
      console.log('');
      console.log('in core.css for a module that mounts after first paint (a probe decides; a name match is not proof):');
      for (const sheet of late) {
        console.log(`  ${formatKiB(sheet.bytes).padStart(11)}  ${sheet.href.replace('/public/css/', '')}  arrives ${sheet.when}, ships at first paint`);
      }
    } else if (!coreSheets.moduleJoin) {
      console.log('  (module mount timings not joined: run through npm run css:payload, which loads the public-import hook)');
    }
    if (!options.sheets) console.log('  --sheets lists every sheet under its folder');
  }
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
