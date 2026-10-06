#!/usr/bin/env node
/**
 * CSS tree — the stylesheet tree read as an ontology, granular.
 *
 * Every hyphen in a file name becomes a folder (`systems/image-theming.css`
 * reads as `systems/image/theming.css`), so each folder level names one
 * concept. For each granular folder the report asks whether the name fits
 * what its files style, using the files' own evidence: the data-spw-*
 * attribute stems and class blocks in their selectors. A refactor is then a
 * chance to evaluate the ontology rather than a rename.
 *
 * Read only. Nothing moves; the folder names are the creator's to write.
 *
 *   layer      a top folder names a cascade layer, a role rather than a
 *              concept, so it has no fit
 *   fit        share of files under a folder whose evidence carries its name
 *   seeds      evidence words most files under a folder share, as name seeds
 *   lone       a folder with one file under it: a concept with one instance;
 *              names the sibling whose evidence overlaps most, if any does
 *   joined     a file name with "-and-": two concepts in one file
 *
 * Usage:
 *   node scripts/css-tree.mjs            summary and the folders worth a look
 *   node scripts/css-tree.mjs --json     machine form (the Precipitate Bench reads it)
 *   npm run css:tree
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS_ROOT = 'public/css/';
const STOP = new Set(['and', 'the', 'of', 'a', 'spw', 'is', 'has', 'not', 'data', 'css']);
const LOW_FIT = 0.34;

// One word per concept: plurals fold into their singular, so cards and card agree.
const words = (s) => s.split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w)).map((w) => (/[^s]s$/.test(w) ? w.slice(0, -1) : w));

function listFiles() {
  return execFileSync('git', ['ls-files', `${CSS_ROOT}*.css`], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((f) => f && !f.includes('/bundles/') && path.posix.dirname(f) !== 'public/css');
}

/** Evidence words a file's selectors carry: data-spw-* stems and class blocks. */
function evidenceOf(text) {
  const counts = new Map();
  const add = (w) => counts.set(w, (counts.get(w) || 0) + 1);
  const selectors = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{[^{}]*\}/g, '{}');
  for (const m of selectors.matchAll(/data-spw-([a-z0-9-]+)/g)) words(m[1]).forEach(add);
  for (const m of selectors.matchAll(/\.([a-z][a-z0-9-]*)(?:__|--)?/g)) words(m[1].split(/__|--/)[0]).forEach(add);
  return counts;
}

export function readTree() {
  const files = listFiles().map((file) => {
    const rel = file.slice(CSS_ROOT.length).replace(/\.css$/, '');
    const text = readFileSync(path.join(ROOT, file), 'utf8');
    return {
      path: rel,
      granular: rel.replace(/-/g, '/'),
      kib: +(statSync(path.join(ROOT, file)).size / 1024).toFixed(1),
      joined: /(^|\/)[^/]*-and-[^/]*$/.test(rel),
      evidence: evidenceOf(text),
    };
  });

  const folders = new Map();
  for (const f of files) {
    const parts = f.granular.split('/');
    for (let i = 1; i < parts.length; i += 1) {
      const key = parts.slice(0, i).join('/');
      if (!folders.has(key)) folders.set(key, { path: key, name: parts[i - 1], depth: i, files: [] });
      folders.get(key).files.push(f);
    }
  }

  const rows = [...folders.values()].map((folder) => {
    const n = folder.files.length;
    const nameWords = words(folder.name);
    const fits = folder.files.filter((f) => nameWords.some((w) => f.evidence.has(w))).length;
    const shared = new Map();
    for (const f of folder.files) for (const w of f.evidence.keys()) shared.set(w, (shared.get(w) || 0) + 1);
    const seeds = [...shared.entries()]
      .filter(([w, c]) => !nameWords.includes(w) && c >= Math.max(2, Math.ceil(n / 2)))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 4)
      .map(([w]) => w);
    const layer = folder.depth === 1;
    return { path: folder.path, name: folder.name, depth: folder.depth, layer, files: n, fit: layer ? null : +(fits / n).toFixed(2), seeds, words: shared };
  });

  // A lone folder may belong beside the sibling whose evidence overlaps most.
  const byParent = new Map();
  for (const r of rows) {
    const parent = r.path.includes('/') ? r.path.slice(0, r.path.lastIndexOf('/')) : '';
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(r);
  }
  for (const r of rows) {
    if (r.files !== 1) continue;
    const parent = r.path.includes('/') ? r.path.slice(0, r.path.lastIndexOf('/')) : '';
    const mine = new Set(r.words.keys());
    let best = null;
    for (const sib of byParent.get(parent) || []) {
      if (sib === r || sib.files < 2) continue;
      const theirs = new Set(sib.words.keys());
      const inter = [...mine].filter((w) => theirs.has(w)).length;
      const jaccard = inter / (mine.size + theirs.size - inter || 1);
      if (!best || jaccard > best.jaccard) best = { path: sib.path, jaccard: +jaccard.toFixed(2) };
    }
    r.lone = best && best.jaccard >= 0.2 ? best : { path: null, jaccard: best?.jaccard ?? 0 };
  }

  const depthToday = Math.max(...files.map((f) => f.path.split('/').length));
  const depthGranular = Math.max(...files.map((f) => f.granular.split('/').length));
  const foldersToday = new Set(files.map((f) => path.posix.dirname(f.path))).size;
  return {
    files: files.map(({ evidence, ...f }) => ({ ...f, top: [...evidence.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5) })),
    folders: rows.map(({ words: _w, ...r }) => r),
    summary: {
      files: files.length,
      hyphenated: files.filter((f) => f.path.split('/').at(-1).includes('-')).length,
      joined: files.filter((f) => f.joined).length,
      foldersToday,
      foldersGranular: rows.length,
      depthToday,
      depthGranular,
      lone: rows.filter((r) => r.files === 1 && r.depth > 1).length,
      lowFit: rows.filter((r) => !r.layer && r.files > 1 && r.fit < LOW_FIT).length,
    },
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const tree = readTree();
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(tree)}\n`);
  } else {
    const s = tree.summary;
    console.log(`[css-tree] ${s.files} files, ${s.hyphenated} hyphenated, ${s.joined} joined with "and"`);
    console.log(`[css-tree] folders ${s.foldersToday} → ${s.foldersGranular} granular; depth ${s.depthToday} → ${s.depthGranular}`);
    console.log(`[css-tree] ${s.lowFit} folders whose name few of their files carry; ${s.lone} lone folders`);
    const look = tree.folders
      .filter((r) => !r.layer && ((r.files > 1 && r.fit < LOW_FIT) || r.files >= 4))
      .sort((a, b) => a.fit - b.fit || b.files - a.files)
      .slice(0, 24);
    for (const r of look) {
      console.log(`  ${r.path.padEnd(34)} ${String(r.files).padStart(3)} files  fit ${r.fit.toFixed(2)}  seeds ${r.seeds.join(' ') || '—'}`);
    }
  }
}
