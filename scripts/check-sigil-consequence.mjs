#!/usr/bin/env node
/**
 * sigil_consequence check for public route HTML.
 *
 * .spw/conventions/semantic-braces.spw asserts:
 *
 *   "A public sigil must match a parser prefix in
 *    public/js/kernel/operator-detection.js. data-spw-operator must resolve
 *    to that same type (or a declared alias). If the mark cannot be parsed
 *    or inspected, do not use it as ornament."
 *
 * Two failures are reported:
 *
 *   mismatch   the visible sigil and data-spw-operator disagree, even after
 *              resolving OPERATOR_TYPE_ALIASES
 *   ornamental the element wears .operator-chip but carries no sigil and no
 *              data-spw-operator, so nothing about it is inspectable
 *
 * The registry and alias map are parsed out of the kernel source rather than
 * imported: kernel modules use browser-absolute specifiers that Node cannot
 * resolve, and duplicating the table here would be the drift this guards.
 *
 * Usage:
 *   node scripts/check-sigil-consequence.mjs
 *   node scripts/check-sigil-consequence.mjs --json
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DETECTION_SRC = path.join(ROOT, 'public/js/kernel/operator-detection.js');
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'dist-vite', '.git', '.spw', '_workbench', 'design/catalog',
]);

/* ==========================================================================
   Vocabulary, read from the kernel
   ========================================================================== */

function readRegistry(source) {
  // Definitions are emitted in longest-prefix-first order; preserve it so
  // `#>` wins over `#`.
  const defs = [];
  const block = /prefix:\s*'((?:[^'\\]|\\.)*)'/g;
  const types = [...source.matchAll(/^\s{4}type:\s*'([^']+)'/gm)].map((m) => m[1]);
  let i = 0;
  for (const m of source.matchAll(block)) {
    const prefix = m[1].replace(/\\(.)/g, '$1');
    const type = types[i++];
    if (prefix && type) defs.push([prefix, type]);
  }
  return defs;
}

function readAliases(source) {
  const start = source.indexOf('const OPERATOR_TYPE_ALIASES');
  if (start === -1) return {};
  const end = source.indexOf('});', start);
  const body = source.slice(start, end);
  const aliases = {};
  for (const m of body.matchAll(/^\s*'?([A-Za-z_][\w-]*)'?:\s*'([^']+)'/gm)) {
    aliases[m[1]] = m[2];
  }
  return aliases;
}

const detectionSource = readFileSync(DETECTION_SRC, 'utf8');
const REGISTRY = readRegistry(detectionSource);
const ALIASES = readAliases(detectionSource);

if (!REGISTRY.length) {
  console.error('[sigils] could not parse OPERATOR_DEFINITIONS from operator-detection.js');
  process.exit(2);
}

const resolveType = (value) => ALIASES[value] || value;
const sigilType = (text) => {
  const trimmed = text.trimStart();
  for (const [prefix, type] of REGISTRY) {
    if (trimmed.startsWith(prefix)) return { prefix, type };
  }
  return null;
};

/* ==========================================================================
   HTML scan
   ========================================================================== */

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

const ENTITIES = {
  '&gt;': '>', '&lt;': '<', '&amp;': '&', '&quot;': '"',
  '&apos;': "'", '&#39;': "'", '&nbsp;': ' ',
};
const decode = (s) => s.replace(
  /&(?:gt|lt|amp|quot|apos|nbsp|#39);/gi,
  (e) => ENTITIES[e.toLowerCase()] ?? e
);
const textOf = (html) => decode(html.replace(/<[^>]*>/g, '')).trim();
const attrOf = (attrs, name) => attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null;

const CHIP_RE = /<a\b([^>]*\bclass="[^"]*\boperator-chip\b[^"]*"[^>]*)>([\s\S]*?)<\/a>/gi;

const findings = [];
let chips = 0;
let operators = 0;

const KNOWN_TYPES = new Set([
  ...REGISTRY.map(([, type]) => type),
  ...Object.keys(ALIASES),
]);
const OPERATOR_ATTR_RE = /data-spw-operator="([^"]*)"/g;

for (const file of walk(ROOT)) {
  const source = readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  /*
   * Every data-spw-operator, not only the ones on .operator-chip. An
   * unresolvable value silently falls back to generic affordances, so an
   * inline prose handle renders unlike its siblings in the same sentence.
   */
  for (const match of source.matchAll(OPERATOR_ATTR_RE)) {
    const value = match[1].trim();
    if (!value) continue;
    operators += 1;
    if (!KNOWN_TYPES.has(value)) {
      findings.push({
        kind: 'unresolvable',
        rel,
        line: source.slice(0, match.index).split('\n').length,
        declared: value,
      });
    }
  }

  for (const match of source.matchAll(CHIP_RE)) {
    const [, attrs, inner] = match;
    const text = textOf(inner);
    if (!text) continue;
    chips += 1;

    const declared = attrOf(attrs, 'data-spw-operator');
    const detected = sigilType(text);
    const line = source.slice(0, match.index).split('\n').length;

    if (!detected) {
      // A chip with a declared operator but no sigil is still inspectable by
      // runtime; one with neither is pure ornament.
      if (!declared) findings.push({ kind: 'ornamental', rel, line, text });
      continue;
    }
    if (!declared) continue;

    const resolved = resolveType(declared);
    if (resolved !== detected.type) {
      findings.push({
        kind: 'mismatch', rel, line, text,
        sigil: detected.prefix, expected: detected.type, declared,
        ...(resolved === declared ? {} : { resolvedTo: resolved }),
      });
    }
  }
}

/* ==========================================================================
   Report
   ========================================================================== */

const mismatches = findings.filter((f) => f.kind === 'mismatch');
const ornamental = findings.filter((f) => f.kind === 'ornamental');
const unresolvable = findings.filter((f) => f.kind === 'unresolvable');

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ chips, operators, findings }, null, 2));
} else {
  console.log(
    `[sigils] chips=${chips} handles=${operators}`
    + ` types=${REGISTRY.length} aliases=${Object.keys(ALIASES).length}`
  );
  console.log(
    `[sigils] mismatch=${mismatches.length} unresolvable=${unresolvable.length}`
    + ` ornamental=${ornamental.length}`
  );

  const byValue = new Map();
  for (const f of unresolvable) byValue.set(f.declared, (byValue.get(f.declared) || 0) + 1);
  for (const [value, n] of [...byValue].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  data-spw-operator="${value}" resolves to nothing`);
  }

  for (const f of mismatches) {
    console.log(
      `  ${f.rel}:${f.line}  "${f.text}"  ${f.sigil} means ${f.expected}, declared ${f.declared}`
      + (f.resolvedTo ? ` (-> ${f.resolvedTo})` : '')
    );
  }
  for (const f of ornamental) {
    console.log(`  ${f.rel}:${f.line}  "${f.text}"  operator-chip with no sigil and no operator`);
  }
}

if (findings.length) {
  console.log('[sigils] failed');
  process.exit(1);
}
console.log('[sigils] passed');
