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
 * Reach is transitive from the roots: the two entrypoints, the catalog's
 * dynamic loads, script tags in routes, the source the page template inlines
 * into <head>, the documented catalog barrel, and the kernel shims the build
 * scripts import. A file only an orphan imports is still an orphan.
 *
 * Layers, low to high: kernel < semantic < runtime < interface < modules.
 * media sits beside runtime. A kernel file importing interface, runtime, or
 * modules is an upward import; the catalog's dynamic loads are the one
 * sanctioned crossing and are excluded. A lazy import() from any other file
 * is reported beside the static ones but counted apart: it is a bridge the
 * caller pays for at call time, not a load-order dependency.
 *
 * Usage:
 *   node scripts/js-tree-value.mjs            summary + lists
 *   node scripts/js-tree-value.mjs --json     machine form
 *   node scripts/js-tree-value.mjs --check    exit 1 on an orphan or on a static
 *                                             upward import not named in NAMED_SEAMS
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS_ROOT = path.join(ROOT, 'public/js');
const JSON_OUT = process.argv.includes('--json');
const CHECK = process.argv.includes('--check');
// Static upward imports that are kept on purpose, each with its reason. A new
// one is a layer decision, made here, not a side effect of an import line.
const NAMED_SEAMS = new Map([
  ['public/js/semantic/component-interaction-semantics.js → public/js/runtime/interaction/vocabulary.js',
    'the interaction family (runtime/interaction/) owns its gesture→phase table; semantic reads it rather than the table leaving its family'],
  ['public/js/semantic/image-interaction.js → public/js/runtime/interaction/gesture-measure.js',
    'the interaction family owns the one hold and swipe measure; image cards read it rather than keeping a private copy'],
]);
const SKIP_DIRS = new Set(['generated', 'typed']);
const ROOT_ENTRYPOINTS = new Set([
  'public/js/site.js',
  'public/js/compose.js',
  // README reading order #2: the full-catalog entrypoint; site.js imports the
  // families one by one to keep them lazy, so nothing imports the barrel.
  'public/js/runtime/catalog/index.js',
]);
// Sources a build script inlines or imports; the page never names them.
const TEMPLATE_FILE = 'scripts/template.mjs';
const SCRIPTS_ROOT = path.join(ROOT, 'scripts');
const LAYER_RANK = { kernel: 0, semantic: 1, runtime: 2, media: 2, interface: 3, modules: 4 };
const IMPORT_RE = /(import\s*(?:[^'"`]*?from\s*)?|import\()\s*['"`]([^'"`]+)['"`]/g;
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

function templateReferences() {
  const refs = new Set();
  const source = fs.readFileSync(path.join(ROOT, TEMPLATE_FILE), 'utf8');
  for (const match of source.matchAll(/public\/js\/[^"'\s)]+\.js/g)) refs.add(match[0]);
  return refs;
}

// Build scripts that import a browser module (the typed fixture shims) give it
// reach outside the page; tests are excluded because a test is not a consumer.
function scriptReferences() {
  const refs = new Set();
  const stack = [SCRIPTS_ROOT];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'tests' && entry.name !== 'node_modules') stack.push(full);
      } else if (entry.name.endsWith('.mjs') || entry.name.endsWith('.mts')) {
        const source = fs.readFileSync(full, 'utf8');
        for (const match of source.matchAll(/['"](\.\.\/)+public\/js\/([^'"]+\.js)['"]/g)) refs.add(`public/js/${match[2]}`);
      }
    }
  }
  return refs;
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
  const lazy = new Map();
  const fanIn = new Map(files.map((f) => [f, 0]));
  const lines = new Map();
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    lines.set(file, source.split('\n').length);
    const targets = new Set();
    const lazyTargets = new Set();
    for (const match of source.matchAll(IMPORT_RE)) {
      const target = resolveSpecifier(match[2], file);
      if (!target || !fanIn.has(target)) continue;
      targets.add(target);
      if (match[1].startsWith('import(')) lazyTargets.add(target);
    }
    edges.set(file, targets);
    lazy.set(file, lazyTargets);
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
  const template = templateReferences();
  const tooling = scriptReferences();
  const roots = files.filter((f) => ROOT_ENTRYPOINTS.has(f) || catalogTargets.has(f) || html.has(f) || template.has(f) || tooling.has(f));
  const reached = new Set(roots);
  const queue = [...roots];
  while (queue.length) {
    for (const target of edges.get(queue.pop()) || []) {
      if (!reached.has(target)) { reached.add(target); queue.push(target); }
    }
  }
  const orphans = files.filter((f) => !reached.has(f))
    .map((f) => ({ file: f, lines: lines.get(f), importedBy: fanIn.get(f) }));
  const upward = [];
  for (const [file, targets] of edges) {
    const from = layerOf(file);
    if (!from) continue;
    if (CATALOG_FILES.includes(file)) continue;
    for (const target of targets) {
      const to = layerOf(target);
      if (to && LAYER_RANK[to] > LAYER_RANK[from]) {
        upward.push({ file, target, from, to, kind: lazy.get(file).has(target) ? 'lazy' : 'static' });
      }
    }
  }
  const upwardStatic = upward.filter((u) => u.kind === 'static');
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
    templateReferences: template.size,
    toolingReferences: tooling.size,
    reached: reached.size,
    orphans,
    orphanLines: orphans.reduce((sum, o) => sum + o.lines, 0),
    upward,
    upwardStatic: upwardStatic.length,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  // `| head` closes the pipe early; that is a reader's choice, not a failure.
  process.stdout.on('error', (error) => { if (error?.code === 'EPIPE') process.exit(0); throw error; });
  const report = auditJsTree();
  if (CHECK) {
    const unnamed = report.upward.filter((u) => u.kind === 'static' && !NAMED_SEAMS.has(`${u.file} → ${u.target}`));
    const problems = [
      ...report.orphans.map((o) => `orphan: nothing loads ${o.file} (${o.lines} lines); wire it through a catalog def, name it a root, or delete it`),
      ...unnamed.map((u) => `upward: ${u.file} (${u.from}) imports ${u.target} (${u.to}); move one of them, make the import lazy, or name the seam in NAMED_SEAMS`),
    ];
    process.stdout.write(`[js-tree] files=${report.files} orphans=${report.orphans.length} upwardStatic=${report.upwardStatic} namedSeams=${NAMED_SEAMS.size}\n`);
    for (const line of problems) process.stdout.write(`  ${line}\n`);
    process.stdout.write(problems.length ? `[js-tree] FAILED ${problems.length} problem(s)\n` : '[js-tree] ok — every file is reached and every static import reads down or is a named seam\n');
    process.exit(problems.length ? 1 : 0);
  }
  if (JSON_OUT) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`[js-tree] files=${report.files} lines=${report.lines} reached=${report.reached} catalogTargets=${report.catalogTargets} htmlRefs=${report.htmlReferences} templateRefs=${report.templateReferences} toolingRefs=${report.toolingReferences}\n`);
    process.stdout.write(`[js-tree] orphans=${report.orphans.length} (${report.orphanLines} lines nothing loads)\n`);
    for (const o of report.orphans) {
      const via = o.importedBy ? `  (imported only by other orphans: ${o.importedBy})` : '';
      process.stdout.write(`  orphan  ${String(o.lines).padStart(5)}  ${o.file}${via}\n`);
    }
    process.stdout.write(`[js-tree] upward imports=${report.upwardStatic} static, ${report.upward.length - report.upwardStatic} lazy\n`);
    for (const u of report.upward) process.stdout.write(`  upward  ${u.kind === 'lazy' ? 'lazy  ' : 'static'}  ${u.from} → ${u.to}  ${u.file} → ${u.target}\n`);
  }
}
