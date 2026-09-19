#!/usr/bin/env node
/**
 * JS tree value audit.
 *
 * Asks each file under public/js what it earns: who imports it, whether the
 * catalog loads it, whether a route names it, and whether it reaches up the
 * tree from a layer that should not know the layers above. The runtime
 * contract check (scripts/runtime-contracts.mjs) reads the catalog's promises;
 * this reads the import graph's facts, so a file that keeps a valid contract
 * but that nothing loads is still reported.
 *
 * Layers, low to high: kernel < semantic < runtime < interface < modules.
 * media sits beside runtime. A kernel file importing interface, runtime, or
 * modules is an upward import; the catalog's dynamic loads are the one
 * sanctioned crossing and are excluded.
 *
 * Usage:
 *   node scripts/js-tree-value.mjs            summary + lists
 *   node scripts/js-tree-value.mjs --json     machine form
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS_ROOT = path.join(ROOT, 'public/js');
const JSON_OUT = process.argv.includes('--json');
const SKIP_DIRS = new Set(['generated', 'typed']);
const ROOT_ENTRYPOINTS = new Set(['public/js/site.js', 'public/js/compose.js']);
const LAYER_RANK = { kernel: 0, semantic: 1, runtime: 2, media: 2, interface: 3, modules: 4 };
const IMPORT_RE = /(?:import\s*(?:[^'"`]*?from\s*)?|import\()\s*['"`]([^'"`]+)['"`]/g;
const CATALOG_FILES = ['core', 'feature', 'region', 'enhancement'].map((f) => `public/js/runtime/catalog/${f}.js`);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out);
    } else if (entry.name.endsWith('.js')) {
      out.push(path.relative(ROOT, full).split(path.sep).join('/'));
    }
  }
  return out;
}

function resolveSpecifier(spec, from) {
  let target = null;
  if (spec.startsWith('/public/js/')) target = spec.slice(1);
  else if (spec.startsWith('.')) target = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));
  if (!target) return null;
  return target.endsWith('.js') ? target : `${target}.js`;
}

function layerOf(file) {
  const segment = file.split('/')[2];
  return LAYER_RANK[segment] === undefined ? null : segment;
}

function htmlReferences() {
  const refs = new Set();
  const stack = [ROOT];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', 'dist', 'dist-vite', '.git', '_workbench', 'public', '.agents', '.spw'].includes(entry.name)) continue;
        stack.push(full);
      } else if (entry.name.endsWith('.html')) {
        const source = fs.readFileSync(full, 'utf8');
        for (const match of source.matchAll(/\/public\/js\/[^"'\s)]+\.js/g)) refs.add(match[0].slice(1));
      }
    }
  }
  return refs;
}

export function auditJsTree() {
  const files = walk(JS_ROOT).sort();
  const edges = new Map();
  const fanIn = new Map(files.map((f) => [f, 0]));
  const lines = new Map();
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    lines.set(file, source.split('\n').length);
    const targets = new Set();
    for (const match of source.matchAll(IMPORT_RE)) {
      const target = resolveSpecifier(match[1], file);
      if (target && fanIn.has(target)) targets.add(target);
    }
    edges.set(file, targets);
    for (const target of targets) fanIn.set(target, fanIn.get(target) + 1);
  }
  const catalogTargets = new Set();
  for (const catalog of CATALOG_FILES) {
    const source = fs.readFileSync(path.join(ROOT, catalog), 'utf8');
    for (const match of source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const target = resolveSpecifier(match[1], catalog);
      if (target) catalogTargets.add(target);
    }
  }
  const html = htmlReferences();
  const orphans = files.filter((f) => fanIn.get(f) === 0 && !catalogTargets.has(f) && !html.has(f) && !ROOT_ENTRYPOINTS.has(f))
    .map((f) => ({ file: f, lines: lines.get(f) }));
  const upward = [];
  for (const [file, targets] of edges) {
    const from = layerOf(file);
    if (!from) continue;
    if (CATALOG_FILES.includes(file)) continue;
    for (const target of targets) {
      const to = layerOf(target);
      if (to && LAYER_RANK[to] > LAYER_RANK[from]) upward.push({ file, target, from, to });
    }
  }
  const byDir = {};
  for (const file of files) {
    const dir = path.posix.dirname(file).replace('public/js', '') || '/';
    byDir[dir] = (byDir[dir] || 0) + 1;
  }
  return {
    files: files.length,
    lines: [...lines.values()].reduce((a, b) => a + b, 0),
    byDir,
    catalogTargets: catalogTargets.size,
    htmlReferences: html.size,
    orphans,
    orphanLines: orphans.reduce((sum, o) => sum + o.lines, 0),
    upward,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  // `| head` closes the pipe early; that is a reader's choice, not a failure.
  process.stdout.on('error', (error) => { if (error?.code === 'EPIPE') process.exit(0); throw error; });
  const report = auditJsTree();
  if (JSON_OUT) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`[js-tree] files=${report.files} lines=${report.lines} catalogTargets=${report.catalogTargets} htmlRefs=${report.htmlReferences}\n`);
    process.stdout.write(`[js-tree] orphans=${report.orphans.length} (${report.orphanLines} lines nothing loads)\n`);
    for (const o of report.orphans) process.stdout.write(`  orphan  ${String(o.lines).padStart(5)}  ${o.file}\n`);
    process.stdout.write(`[js-tree] upward imports=${report.upward.length}\n`);
    for (const u of report.upward) process.stdout.write(`  upward  ${u.from} → ${u.to}  ${u.file} → ${u.target}\n`);
  }
}
