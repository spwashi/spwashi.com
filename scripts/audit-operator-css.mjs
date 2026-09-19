#!/usr/bin/env node
/**
 * audit-operator-css.mjs
 *
 * Every CSS rule keyed on data-spw-operator="<value>" should key on every
 * value the kernel resolves to the same operator, because the routes author
 * both the canon type and its atlas slug: 194 controls say value and 103 say
 * stream; 216 say integration, 59 object, 35 integrate. A rule that keys on
 * stream alone reaches a third of the value controls. The runtime writes
 * data-spw-operator-resolved after boot, but the rails must hold with JS off.
 *
 * Reads public/css (bundles excluded), groups the values inside each
 * selector list, resolves each through the kernel alias map, and reports a
 * hole wherever a rule covers an operator through some of its authored
 * values but not all of them. Authored values come from the routes so a
 * slug nobody writes is not demanded.
 *
 *   node --import ./scripts/lib/register-public-imports.mjs scripts/audit-operator-css.mjs [--check] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { getOperatorDefinition } from '/public/js/kernel/operator-detection.js';

const PROJECT_ROOT = process.cwd();
const CSS_ROOT = path.join(PROJECT_ROOT, 'public/css');
const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-vite', '.spw', '.references', '_partials', 'renders', '_workbench', 'bundles']);
const GENERATED_PREFIXES = ['design/catalog/', 'design/components/captures/'];
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);

function walk(dir, predicate, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, list);
    else if (predicate(full)) list.push(full);
  }
  return list;
}

/* Which operator values the routes actually author, by resolved type. */
function authoredValues() {
  const byType = new Map();
  const files = walk(PROJECT_ROOT, (file) => path.basename(file) === 'index.html')
    .filter((file) => !GENERATED_PREFIXES.some((prefix) => path.relative(PROJECT_ROOT, file).startsWith(prefix)));
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/data-spw-operator="([^"]+)"/g)) {
      const def = getOperatorDefinition(match[1]);
      if (!def) continue;
      if (!byType.has(def.type)) byType.set(def.type, new Map());
      const counts = byType.get(def.type);
      counts.set(match[1], (counts.get(match[1]) || 0) + 1);
    }
  }
  return byType;
}

/* Split a stylesheet into (selector, line) pairs; nested @-blocks are walked
   by brace depth, which is enough for these files. */
function selectorsOf(source) {
  const results = [];
  let depth = 0;
  let buffer = '';
  let line = 1;
  let bufferLine = 1;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '\n') line += 1;
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      const skipped = source.slice(i, end + 2);
      line += (skipped.match(/\n/g) || []).length;
      i = end + 1;
      continue;
    }
    if (char === '{') {
      const selector = buffer.trim();
      if (selector && !selector.startsWith('@')) results.push({ selector, line: bufferLine });
      depth += 1;
      buffer = '';
      bufferLine = line;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      buffer = '';
      bufferLine = line;
      continue;
    }
    if (char === ';' && depth > 0) {
      buffer = '';
      bufferLine = line;
      continue;
    }
    if (!buffer.trim()) bufferLine = line;
    buffer += char;
  }
  return results;
}

function run() {
  const authored = authoredValues();
  const files = walk(CSS_ROOT, (file) => file.endsWith('.css'));
  const holes = [];
  let rulesRead = 0;
  for (const file of files) {
    const rel = path.relative(PROJECT_ROOT, file);
    const source = fs.readFileSync(file, 'utf8');
    for (const { selector, line } of selectorsOf(source)) {
      const values = [...selector.matchAll(/\[data-spw-operator="([^"]+)"\]/g)].map((match) => match[1]);
      if (!values.length) continue;
      rulesRead += 1;
      const byType = new Map();
      for (const value of values) {
        const def = getOperatorDefinition(value);
        if (!def) { holes.push({ file: rel, line, type: null, value, missing: [], unknown: true }); continue; }
        if (!byType.has(def.type)) byType.set(def.type, new Set());
        byType.get(def.type).add(value);
      }
      for (const [type, present] of byType) {
        const wanted = [...(authored.get(type) || new Map()).keys()];
        const missing = wanted.filter((value) => !present.has(value));
        if (missing.length) {
          holes.push({ file: rel, line, type, present: [...present], missing, reach: missing.map((value) => authored.get(type).get(value)).reduce((a, b) => a + b, 0) });
        }
      }
    }
  }

  if (flag('json')) {
    console.log(JSON.stringify({ rulesRead, holes }, null, 2));
  } else {
    console.log('--- Operator CSS Audit ---');
    console.log(`Rules keyed on data-spw-operator: ${rulesRead}`);
    console.log(`Holes: ${holes.length} (a rule reaching an operator through some authored values but not all)\n`);
    const byFile = new Map();
    for (const hole of holes) byFile.set(hole.file, (byFile.get(hole.file) || 0) + 1);
    for (const [file, count] of [...byFile.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(count).padStart(3)}  ${file}`);
    console.log('\nBy operator (controls the missing values reach):');
    const byType = new Map();
    for (const hole of holes) if (hole.type) byType.set(hole.type, (byType.get(hole.type) || 0) + hole.reach);
    for (const [type, reach] of [...byType.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${type.padEnd(14)} ${reach}`);
  }
  if (flag('check') && holes.length) {
    console.error(`\n[audit-operator-css] ${holes.length} hole(s).`);
    process.exit(1);
  }
}

run();
