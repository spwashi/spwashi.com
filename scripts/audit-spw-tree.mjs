#!/usr/bin/env node
/**
 * audit-spw-tree — the .spw tree's shape, and each document's header, checked.
 *
 * spw-architecture-ecology.spw ^"convention_hygiene" names a required header
 * (a title comment, a unique #> anchor, #: tags, an operation, a fixity, a
 * layer) and a validator, scripts/validate-conventions.mjs, that was never
 * written. spw-dimensional-index.mjs builds dimensions.spw from the same
 * marks, so a file without them cannot be found by "what is tending" or
 * "what is archived". Folders route through their index.spw (hub_rule). This
 * reads all of it.
 *
 *   hard   an alias declared twice in one file (the second silently wins).
 *   warn   line 1 is not a "# " title comment; no #> anchor; no operation,
 *          fixity or #:layer mark; a value outside the canon in
 *          semantic-capacity.spw (operation: cache audit align prime
 *          contract archive; fixity: fixed stable tending experimental
 *          volatile cold), or a fixity or operation word used as a layer;
 *          two files whose first anchor is the same; a file no index.spw in
 *          its folder or above names; a folder of four or more files with no
 *          index.spw that no parent index covers; a durable file over 400 lines.
 *
 * .spw/_workbench (mounted) and .spw/gen (generated) are not read. A file
 * whose header says GENERATED is read for duplicates only.
 *
 *   npm run audit:spw-tree                    headline on green, findings otherwise
 *   npm run audit:spw-tree -- --check         exit 1 on a hard finding
 *   npm run audit:spw-tree -- --home=conventions
 *   npm run audit:spw-tree -- --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TREE = path.join(ROOT, '.spw');
const SKIP = new Set(['_workbench', 'gen']);
const DURABLE = new Set(['conventions', 'surfaces', 'philosophy', 'language', 'slices', 'skills', '(root)']);

const OPERATIONS = new Set(['cache', 'audit', 'align', 'prime', 'contract', 'archive']);
const FIXITIES = new Set(['fixed', 'stable', 'tending', 'experimental', 'volatile', 'cold']);

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const onlyHome = option('home');

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) out.push(...walk(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.spw')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const homeOf = (file) => {
  const parts = path.relative(TREE, file).split(path.sep);
  return parts.length > 1 ? parts[0] : '(root)';
};

const files = walk(TREE).sort();
const texts = new Map(files.map((file) => [file, fs.readFileSync(file, 'utf8')]));
const findings = [];
const add = (file, line, level, message) => findings.push({ home: homeOf(file), file: rel(file), line, level, message });
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const marks = (text, axis) => [...text.matchAll(new RegExp(`^#:${axis} #!(\\w+)`, 'gm'))].map((m) => ({ value: m[1], line: lineOf(text, m.index) }));
const field = (text, axis) => new RegExp(`^${axis}\\s*=\\s*"(\\w+)"`, 'm').exec(text);

const firstAnchor = new Map();

for (const file of files) {
  const text = texts.get(file);
  const home = homeOf(file);
  const generated = /^#.*\bGENERATED\b/m.test(text.split('\n').slice(0, 6).join('\n'));

  const seen = new Map();
  for (const match of text.matchAll(/^@([a-z_][a-z0-9_]*)\s*:/gm)) {
    const line = lineOf(text, match.index);
    if (seen.has(match[1])) add(file, line, 'hard', `alias @${match[1]} declared again (first at line ${seen.get(match[1])})`);
    else seen.set(match[1], line);
  }
  if (generated) continue;

  if (!text.startsWith('# ')) add(file, 1, 'warn', 'line 1 is not a "# " title comment');

  const anchor = /^#>([A-Za-z_]\w*)/m.exec(text);
  if (!anchor) add(file, 1, 'warn', 'no #> anchor');
  else {
    if (!firstAnchor.has(anchor[1])) firstAnchor.set(anchor[1], []);
    firstAnchor.get(anchor[1]).push({ file, line: lineOf(text, anchor.index) });
  }

  const operation = marks(text, 'operation');
  const fixity = marks(text, 'fixity');
  const layer = marks(text, 'layer');
  if (!operation.length && !field(text, 'operation')) add(file, 1, 'warn', 'no operation (#:operation #!…)');
  if (!fixity.length && !field(text, 'fixity')) add(file, 1, 'warn', 'no fixity (#:fixity #!…)');
  if (!layer.length) add(file, 1, 'warn', 'no #:layer');
  for (const m of operation) if (!OPERATIONS.has(m.value)) add(file, m.line, 'warn', `operation #!${m.value} is not in the canon (semantic-capacity.spw)`);
  for (const [axis, canon] of [['operation', OPERATIONS], ['fixity', FIXITIES]]) {
    const value = field(text, axis);
    if (value && !canon.has(value[1])) add(file, lineOf(text, value.index), 'warn', `${axis} = "${value[1]}" is not in the canon (semantic-capacity.spw)`);
  }
  for (const m of fixity) if (!FIXITIES.has(m.value)) add(file, m.line, 'warn', `fixity #!${m.value} is not in the canon (semantic-capacity.spw)`);
  for (const m of layer) if (OPERATIONS.has(m.value) || FIXITIES.has(m.value)) add(file, m.line, 'warn', `layer #!${m.value} is ${OPERATIONS.has(m.value) ? 'an operation' : 'a fixity'} word, not a layer`);

  const lines = text.split('\n').length;
  if (DURABLE.has(home) && lines > 400) add(file, 1, 'warn', `${lines} lines in a durable home (over 400)`);
}

for (const [name, places] of firstAnchor) {
  if (places.length < 2) continue;
  for (const place of places.slice(1)) add(place.file, place.line, 'warn', `first anchor #>${name} also opens ${rel(places[0].file)}`);
}

/* An index names a file when its basename or its path from the index appears in it.
   A folder x/ beside a document x.spw is that document's; x.spw naming a file counts too. */
const indexes = files.filter((file) => path.basename(file) === 'index.spw');
const names = (holder, dir, file) => texts.has(holder) && holder !== file
  && (texts.get(holder).includes(path.basename(file)) || texts.get(holder).includes(path.relative(dir, file).split(path.sep).join('/')));
const namedBy = (file) => {
  for (let dir = path.dirname(file); dir.startsWith(TREE); dir = path.dirname(dir)) {
    if (names(path.join(dir, 'index.spw'), dir, file)) return true;
    if (dir !== TREE && names(`${dir}.spw`, path.dirname(dir), file)) return true;
  }
  return false;
};
for (const file of files) {
  if (path.basename(file) === 'index.spw' && path.dirname(file) === TREE) continue;
  if (!namedBy(file)) add(file, 1, 'warn', 'no index.spw in its folder or above names this file');
}
const folders = new Map();
for (const file of files) {
  const dir = path.dirname(file);
  if (!folders.has(dir)) folders.set(dir, []);
  folders.get(dir).push(file);
}
for (const [dir, members] of folders) {
  if (dir === TREE || indexes.includes(path.join(dir, 'index.spw')) || members.length < 4) continue;
  if (members.every(namedBy)) continue;
  add(path.join(dir, 'index.spw'), 1, 'warn', `${members.length} files and no index.spw, and no index above names them all`);
}

const shown = findings
  .filter((f) => !onlyHome || f.home === onlyHome)
  .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
const hard = shown.filter((f) => f.level === 'hard');
const warn = shown.filter((f) => f.level === 'warn');
const counted = onlyHome ? files.filter((file) => homeOf(file) === onlyHome).length : files.length;

if (flag('json')) {
  console.log(JSON.stringify({ files: counted, hard: hard.length, warn: warn.length, findings: shown }, null, 2));
} else {
  const byHome = new Map();
  for (const f of shown) {
    if (!byHome.has(f.home)) byHome.set(f.home, []);
    byHome.get(f.home).push(f);
  }
  for (const [home, rows] of byHome) {
    const h = rows.filter((r) => r.level === 'hard').length;
    console.log(`${home} — ${h} hard, ${rows.length - h} warn`);
    for (const r of rows) console.log(`${r.file}:${r.line}: ${r.level} ${r.message}`);
    console.log('');
  }
  console.log(`[audit:spw-tree] ${counted} files · ${hard.length} hard · ${warn.length} warn`);
}

if (flag('check') && hard.length) process.exitCode = 1;
