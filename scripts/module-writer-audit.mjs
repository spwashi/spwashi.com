#!/usr/bin/env node
/**
 * Every root write a module makes should be declared in its catalog `updates`,
 * and every root token should have one owner.
 *
 * Root writes are the expensive kind: a custom property or attribute on <html>
 * or <body> can invalidate style across the whole document, and two owners
 * writing the same root token fight in ways no single file shows. The catalog
 * already names writes in `updates`; this audit checks the names against the
 * source, so the declaration is a contract instead of annotation.
 *
 * For each catalog module it follows the entry file's local /public/js imports,
 * skipping shared kernel transport files, and collects root writes made through
 * direct dataset/style/attribute access, writeDatasetValue*, writeStyleProperty,
 * and object-literal write maps (writeDatasetValues, writeProjectionTier,
 * writeRuntimeDatasetValues, setDatasetEntries, setStyleProperties).
 * module-loader.js is scanned as a pseudo-module because it writes runtime
 * tokens for every page.
 *
 * Ownership: a module owns its entry file and files only it reaches. A file
 * several modules reach owns its own writes as `(file:path)`, so a shared helper
 * counts once instead of making each importer a writer.
 *
 * Findings that predate this audit live in module-writer-baseline.json. It is a
 * list to empty, not a place to add: a new undeclared write, a new shared-file
 * root write, or a new second owner fails, and a baseline entry that no longer
 * occurs fails until removed.
 *
 *   node --import ./scripts/lib/register-public-imports.mjs scripts/module-writer-audit.mjs
 *     --list            print every finding, known and new
 *     --json            machine-readable report
 *     --write-baseline  replace the baseline with current findings (review the diff)
 *
 * Output: a pass is one line that says how far the baseline is from empty. A
 * failure prints each new write in full, where it sits and how the module
 * reaches it, then the resolved entries, and the verdict last.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { MODULE_DEFS } from '../public/js/runtime/catalog/index.js';
import { normalizeModuleUpdates } from '../public/js/runtime/catalog/updates-contract.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_JS = path.join(ROOT, 'public/js');
const CATALOG_DIR = path.join(PUBLIC_JS, 'runtime/catalog');
const BASELINE_PATH = path.join(ROOT, 'scripts/module-writer-baseline.json');

/* Transport files every module imports; their writes are kernel mechanics, not
   module ownership. */
const SHARED_TRANSPORT = new Set([
  'kernel/dom-contracts.js',
  'kernel/shared.js',
  'kernel/bus.js',
  'kernel/instrumentation.js',
].map((file) => path.join(PUBLIC_JS, file)));

const PSEUDO_MODULES = Object.freeze([
  { id: '(module-loader)', file: path.join(PUBLIC_JS, 'runtime/orchestration/loader.js'), updates: [] },
]);

const ROOT_REF = '(?:html|root|rootEl|htmlEl|body|this\\.root|this\\.body|document\\.documentElement|document\\.body)';

const DIRECT_WRITES = Object.freeze([
  { kind: 'css-var', re: new RegExp(`${ROOT_REF}\\??\\.style\\??\\.(?:setProperty|removeProperty)\\(\\s*['\`](--[a-z0-9-]+)`, 'g') },
  { kind: 'css-var', re: new RegExp(`writeStyleProperty\\(\\s*${ROOT_REF}\\s*,\\s*['\`](--[a-z0-9-]+)`, 'g') },
  { kind: 'attr', re: new RegExp(`${ROOT_REF}\\??\\.dataset\\??\\.([a-zA-Z0-9]+)\\s*=(?!=)`, 'g'), camel: true },
  { kind: 'attr', re: new RegExp(`writeDatasetValue(?:IfMissing)?\\(\\s*${ROOT_REF}\\s*,\\s*['\`]([a-zA-Z0-9]+)['\`]`, 'g'), camel: true },
  { kind: 'attr', re: new RegExp(`${ROOT_REF}\\??\\.(?:setAttribute|toggleAttribute|removeAttribute)\\(\\s*['\`](data-[a-z0-9-]+)`, 'g') },
]);

const WRITE_MAP_CALL = new RegExp(
  `(writeDatasetValues|writeProjectionTier|writeRuntimeDatasetValues|setDatasetEntries|setStyleProperties)\\(\\s*${ROOT_REF}\\s*,\\s*(?:[A-Za-z_.]+\\s*,\\s*)?\\{`,
  'g',
);

/* The baseline as first committed (47bab2ea, 2026-09-14), so a pass can say how
   far the list has emptied. Reproduce with:
   git show 47bab2ea:scripts/module-writer-baseline.json, counting each section. */
export const BASELINE_BIRTH = Object.freeze({ commit: '47bab2ea', date: '2026-09-14', undeclared: 284, shared: 41, multi: 12 });

const camelToData = (key) => `data-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
const rel = (file) => path.relative(ROOT, file).replace(/\\/g, '/');

function objectLiteralAt(source, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex, index + 1);
    }
  }
  return '';
}

/* Keys at the literal's top level only, so nested option objects stay out. */
function topLevelKeys(literal) {
  const keys = [];
  let depth = 0;
  let segmentStart = 1;
  for (let index = 0; index < literal.length; index += 1) {
    const char = literal[index];
    if (char === '{' || char === '[' || char === '(') depth += 1;
    else if (char === '}' || char === ']' || char === ')') depth -= 1;
    if ((char === ',' && depth === 1) || index === literal.length - 1) {
      const segment = literal.slice(segmentStart, index).trim();
      segmentStart = index + 1;
      const match = segment.match(/^['"]?(--[a-z0-9-]+|[a-zA-Z_$][a-zA-Z0-9_$]*)['"]?\s*(?::|$)/);
      if (match) keys.push(match[1]);
    }
  }
  return keys;
}

export function scanRootWrites(source = '') {
  const found = new Set();
  for (const { kind, re, camel } of DIRECT_WRITES) {
    for (const match of source.matchAll(re)) found.add(`${kind}:${camel ? camelToData(match[1]) : match[1]}`);
  }
  for (const match of source.matchAll(WRITE_MAP_CALL)) {
    const literal = objectLiteralAt(source, match.index + match[0].length - 1);
    const styleMap = match[1] === 'setStyleProperties';
    for (const key of topLevelKeys(literal)) {
      if (key.startsWith('--')) found.add(`css-var:${key}`);
      else if (!styleMap && /^[a-z]+[A-Z]/.test(key)) found.add(`attr:${camelToData(key)}`);
    }
  }
  return found;
}

const lineAt = (source, index) => source.slice(0, index).split('\n').length;

/** The first line where a file writes a root token, as scanRootWrites sees it; 0 when it does not. */
export function locateRootWrite(source = '', token = '') {
  for (const { kind, re, camel } of DIRECT_WRITES) {
    for (const match of source.matchAll(re)) {
      if (`${kind}:${camel ? camelToData(match[1]) : match[1]}` === token) return lineAt(source, match.index);
    }
  }
  for (const match of source.matchAll(WRITE_MAP_CALL)) {
    const literal = objectLiteralAt(source, match.index + match[0].length - 1);
    const styleMap = match[1] === 'setStyleProperties';
    for (const key of topLevelKeys(literal)) {
      const found = key.startsWith('--') ? `css-var:${key}` : (!styleMap && /^[a-z]+[A-Z]/.test(key) ? `attr:${camelToData(key)}` : '');
      if (found === token) return lineAt(source, match.index);
    }
  }
  return 0;
}

/** One line for a passing audit: what the baseline still holds, against what it held at birth. */
export function formatReceipt(counts, moduleCount, birth = BASELINE_BIRTH) {
  return `[audit:module-writers] ok — ${counts.undeclared} held · ${birth.undeclared} at birth · ${counts.shared} in shared files · ${counts.multi} shared tokens · ${moduleCount} modules`;
}

const sourceCache = new Map();

async function readSource(file) {
  if (!sourceCache.has(file)) {
    sourceCache.set(file, await readFile(file, 'utf8').catch(() => null));
  }
  return sourceCache.get(file);
}

async function collectLocalGraph(entry, seen = new Set()) {
  if (seen.has(entry) || !entry.startsWith(PUBLIC_JS)) return seen;
  const source = await readSource(entry);
  if (source == null) return seen;
  seen.add(entry);
  for (const match of source.matchAll(/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]/g)) {
    const specifier = match[1];
    if (!specifier.startsWith('.') && !specifier.startsWith('/public/')) continue;
    const next = specifier.startsWith('/') ? path.join(ROOT, specifier) : path.resolve(path.dirname(entry), specifier);
    await collectLocalGraph(next, seen);
  }
  return seen;
}

const localImports = (entry, source) => [...source.matchAll(/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]/g)]
  .map((match) => match[1])
  .filter((specifier) => specifier.startsWith('.') || specifier.startsWith('/public/'))
  .map((specifier) => (specifier.startsWith('/') ? path.join(ROOT, specifier) : path.resolve(path.dirname(entry), specifier)));

/** The shortest import path from a module's entry file to the file that holds a write. */
async function importChain(entry, target) {
  const parents = new Map([[entry, null]]);
  const queue = [entry];
  while (queue.length) {
    const file = queue.shift();
    if (file === target) break;
    const source = await readSource(file);
    if (source == null) continue;
    for (const next of localImports(file, source)) {
      if (parents.has(next) || !next.startsWith(PUBLIC_JS)) continue;
      parents.set(next, file);
      queue.push(next);
    }
  }
  if (!parents.has(target)) return [];
  const chain = [];
  for (let file = target; file; file = parents.get(file)) chain.unshift(rel(file));
  return chain;
}

/** A new finding in full: the token, the file and line that write it, and how the module gets there. */
async function describeFinding(report, line) {
  const [label, key, token] = line.split(' ');
  const out = [`  ${label} ${key} ${token}`];
  if (label === 'multi-writer') {
    out.push(`      written by ${(report.multiWriter[key] || []).join(', ')}`);
    return out;
  }
  const row = label === 'undeclared' ? report.modules.find((module) => module.id === key) : null;
  const file = row ? row.writes[token] : key.replace(/^\(file:|\)$/g, '');
  if (!file) return out;
  const source = await readSource(path.join(ROOT, file)) || '';
  const lineNumber = locateRootWrite(source, token);
  const text = lineNumber ? source.split('\n')[lineNumber - 1].trim() : '';
  out.push(`      at ${file}${lineNumber ? `:${lineNumber}` : ''}${text ? `   ${text}` : ''}`);
  if (row) {
    const chain = await importChain(path.join(ROOT, row.file), path.join(ROOT, file));
    if (chain.length > 1) out.push(`      reached through ${chain.join(' → ')}`);
  } else {
    out.push(`      reached by ${(report.sharedWriters[key]?.reachedBy || []).join(', ')}`);
  }
  return out;
}

function entryFileFor(def) {
  const specifier = String(def.load || '').match(/import\(\s*['"`]([^'"`]+)['"`]\s*\)/)?.[1];
  if (!specifier) return null;
  return specifier.startsWith('/') ? path.join(ROOT, specifier) : path.resolve(CATALOG_DIR, specifier);
}

function declaredRootTokens(updates) {
  return new Set(normalizeModuleUpdates(updates).map((entry) => `${entry.kind}:${entry.name}`));
}

const sortedEntries = (object) => Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));

export async function auditModuleWriters({ defs = MODULE_DEFS } = {}) {
  const modules = [
    ...defs.map((def) => ({ id: def.id, file: entryFileFor(def), updates: def.updates })),
    ...PSEUDO_MODULES,
  ].filter((module) => module.file);

  const entryFiles = new Set(modules.map((module) => module.file));
  const graphs = new Map();
  const reachedBy = new Map();
  for (const module of modules) {
    const graph = [...await collectLocalGraph(module.file)]
      .filter((file) => !SHARED_TRANSPORT.has(file))
      .filter((file) => file === module.file || !entryFiles.has(file));
    graphs.set(module.id, graph);
    graph.forEach((file) => {
      if (!reachedBy.has(file)) reachedBy.set(file, new Set());
      reachedBy.get(file).add(module.id);
    });
  }

  const writers = new Map();
  const noteWriter = (token, owner) => {
    if (!writers.has(token)) writers.set(token, new Set());
    writers.get(token).add(owner);
  };

  const rows = [];
  for (const module of modules) {
    const privateFiles = graphs.get(module.id).filter((file) => file === module.file || reachedBy.get(file).size === 1);
    const writes = new Map();
    for (const file of privateFiles) {
      for (const token of scanRootWrites(await readSource(file) || '')) {
        if (!writes.has(token)) writes.set(token, rel(file));
      }
    }
    const declared = declaredRootTokens(module.updates);
    const undeclared = [...writes.keys()].filter((token) => !declared.has(token)).sort();
    writes.forEach((_, token) => noteWriter(token, module.id));
    rows.push({ id: module.id, file: rel(module.file), privateFiles: privateFiles.length, writes: Object.fromEntries(writes), undeclared });
  }

  const sharedWriters = {};
  const sharedFiles = [...reachedBy]
    .filter(([file, owners]) => owners.size > 1 && !entryFiles.has(file))
    .map(([file]) => file)
    .sort();
  for (const file of sharedFiles) {
    const tokens = [...scanRootWrites(await readSource(file) || '')].sort();
    if (!tokens.length) continue;
    const owner = `(file:${rel(file)})`;
    sharedWriters[owner] = { reachedBy: [...reachedBy.get(file)].sort(), tokens };
    tokens.forEach((token) => noteWriter(token, owner));
  }

  const multiWriter = sortedEntries(Object.fromEntries(
    [...writers].filter(([, owners]) => owners.size > 1).map(([token, owners]) => [token, [...owners].sort()]),
  ));
  const undeclared = sortedEntries(Object.fromEntries(
    rows.filter((row) => row.undeclared.length).map((row) => [row.id, row.undeclared]),
  ));

  return { modules: rows, undeclared, sharedWriters: sortedEntries(sharedWriters), multiWriter };
}

function toBaseline(report) {
  return {
    undeclared: report.undeclared,
    sharedWriters: Object.fromEntries(Object.entries(report.sharedWriters).map(([owner, entry]) => [owner, entry.tokens])),
    multiWriter: report.multiWriter,
  };
}

/* Each section maps an owner or token to a list; findings are the list items. */
function diffSection(label, current = {}, known = {}) {
  const fresh = [];
  const cleared = [];
  for (const [key, items] of Object.entries(current)) {
    const knownItems = new Set(known[key] || []);
    items.filter((item) => !knownItems.has(item)).forEach((item) => fresh.push(`${label} ${key} ${item}`));
  }
  for (const [key, items] of Object.entries(known)) {
    const currentItems = new Set(current[key] || []);
    items.filter((item) => !currentItems.has(item)).forEach((item) => cleared.push(`${label} ${key} ${item}`));
  }
  return { fresh, cleared };
}

export function diffAgainstBaseline(report, baseline = {}) {
  const current = toBaseline(report);
  const sections = [
    diffSection('undeclared', current.undeclared, baseline.undeclared),
    diffSection('shared-writer', current.sharedWriters, baseline.sharedWriters),
    diffSection('multi-writer', current.multiWriter, baseline.multiWriter),
  ];
  return {
    fresh: sections.flatMap((section) => section.fresh),
    cleared: sections.flatMap((section) => section.cleared),
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const report = await auditModuleWriters();
  const counts = {
    undeclared: Object.values(report.undeclared).flat().length,
    shared: Object.values(report.sharedWriters).reduce((total, entry) => total + entry.tokens.length, 0),
    multi: Object.keys(report.multiWriter).length,
  };

  if (args.has('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (args.has('--write-baseline')) {
    await writeFile(BASELINE_PATH, `${JSON.stringify(toBaseline(report), null, 2)}\n`);
    console.log(`[audit:module-writers] baseline written: ${counts.undeclared} undeclared module root writes, ${counts.shared} shared-file root writes, ${counts.multi} multi-owner root tokens`);
    return;
  }

  if (args.has('--list')) {
    for (const [id, tokens] of Object.entries(report.undeclared)) {
      tokens.forEach((token) => console.log(`undeclared    ${id.padEnd(30)} ${token}`));
    }
    for (const [owner, entry] of Object.entries(report.sharedWriters)) {
      console.log(`shared-writer ${owner} (reached by ${entry.reachedBy.join(', ')})`);
      entry.tokens.forEach((token) => console.log(`                ${token}`));
    }
    for (const [token, owners] of Object.entries(report.multiWriter)) {
      console.log(`multi-writer  ${token.padEnd(46)} ${owners.join(', ')}`);
    }
  }

  const baseline = JSON.parse(await readFile(BASELINE_PATH, 'utf8').catch(() => '{}'));
  const { fresh, cleared } = diffAgainstBaseline(report, baseline);

  if (fresh.length) {
    console.log('[audit:module-writers] new root writes:');
    for (const line of fresh) (await describeFinding(report, line)).forEach((detail) => console.log(detail));
  }
  if (cleared.length) {
    console.log('[audit:module-writers] baseline entries that no longer occur:');
    cleared.forEach((line) => console.log(`  ${line}`));
  }
  if (fresh.length || cleared.length) {
    const fixes = [
      fresh.length ? 'declare a new write in its module\'s catalog `updates`, move a shared helper\'s write behind its owner, or give the token one owner' : '',
      cleared.length ? 'remove resolved entries from scripts/module-writer-baseline.json' : '',
    ].filter(Boolean).join('; ');
    console.log(`[audit:module-writers] failed — ${fresh.length} new, ${cleared.length} resolved and still listed. To pass: ${fixes}.`);
    process.exitCode = 1;
    return;
  }

  console.log(formatReceipt(counts, report.modules.length));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  await main();
}
