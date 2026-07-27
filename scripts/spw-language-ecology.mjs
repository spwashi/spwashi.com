#!/usr/bin/env node
/**
 * spw-language-ecology.mjs
 * ---------------------------------------------------------------------------
 * Inventory Spw *language* feature utilization on the site (not body feature packs).
 *
 * Counts:
 *   - data-spw-operator values
 *   - data-spw-semantic-expression presence
 *   - data-spw-form / data-spw-brace
 *   - claim / owner_claim / probe_ref in site .spw (excludes _workbench)
 *   - v04 pillar files
 *
 * Usage: node scripts/spw-language-ecology.mjs
 *        npm run ecology:language
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JSON_OUT = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');

/** Canonical site operator types from shared.js / operator-alignment (subset + aliases). */
const KNOWN_OPERATOR_TYPES = new Set([
  'frame', 'object', 'probe', 'ref', 'action', 'topic', 'stream', 'surface',
  'potential', 'wonder', 'ground', 'baseline', 'value', 'subject', 'binding',
  'perspective', 'integration', 'integrate', 'concept', 'concept-edge', 'concept_edge', 'scene', 'mode',
  'select', 'route', 'address', 'normalize', 'situate', 'act', 'merge',
  'substrate', 'meta', 'resource', 'support', 'measure', 'layer', 'bind',
  'vibration', 'intrinsic', 'observer', 'collapse', 'constraint', 'selector',
  'annotation', 'ground_handle',
]);

async function walkFiles(dir, predicate, acc = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'dist-vite') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_workbench' && dir.endsWith('.spw')) continue;
      await walkFiles(full, predicate, acc);
    } else if (predicate(full, entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function countAttrValues(text, attrName) {
  const re = new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, 'gi');
  const counts = new Map();
  for (const m of text.matchAll(re)) {
    const v = m[1].trim();
    if (!v) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return counts;
}

function mergeCounts(into, from) {
  for (const [k, n] of from) into.set(k, (into.get(k) || 0) + n);
}

async function inventoryHtml() {
  const files = await walkFiles(ROOT, (f, name) => name.endsWith('.html') && !f.includes(`${path.sep}dist${path.sep}`));
  const operators = new Map();
  const forms = new Map();
  const braces = new Map();
  let expressions = 0;
  let chips = 0;

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    mergeCounts(operators, countAttrValues(text, 'data-spw-operator'));
    mergeCounts(forms, countAttrValues(text, 'data-spw-form'));
    mergeCounts(braces, countAttrValues(text, 'data-spw-brace'));
    expressions += (text.match(/data-spw-semantic-expression/gi) || []).length;
    chips += (text.match(/operator-chip/gi) || []).length;
  }

  return { files: files.length, operators, forms, braces, expressions, chips };
}

async function inventorySpwLanguage() {
  const files = await walkFiles(path.join(ROOT, '.spw'), (f, name) => name.endsWith('.spw'));
  let ownerClaims = 0;
  let probeRefs = 0;
  let claims = 0;
  let operations = 0;
  const pillars = await walkFiles(path.join(ROOT, '.spw/language/v04/pillars'), (f, name) => name.endsWith('.spw'));

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    ownerClaims += (text.match(/owner_claim|claim\s*#/g) || []).length;
    probeRefs += (text.match(/probe_ref\s*=/g) || []).length;
    claims += (text.match(/\bhypothesis\s*=/g) || []).length;
    operations += (text.match(/operation\s*=\s*"(cache|audit|align|prime|contract|archive)"/g) || []).length;
  }

  return {
    spwFiles: files.length,
    pillars: pillars.length,
    ownerClaims,
    probeRefs,
    claims,
    operations,
  };
}

function printReport(html, spw) {
  console.log('=== Spw language ecology (not site feature packs) ===\n');
  console.log('HTML files scanned:', html.files);
  console.log('operator-chip mentions:', html.chips);
  console.log('data-spw-semantic-expression:', html.expressions);

  console.log('\nOperators (data-spw-operator) top:');
  const opSorted = [...html.operators.entries()].sort((a, b) => b[1] - a[1]);
  for (const [k, n] of opSorted.slice(0, 20)) {
    const known = KNOWN_OPERATOR_TYPES.has(k) ? 'known' : 'UNKNOWN';
    console.log(`  ${String(n).padStart(4)}  ${k.padEnd(16)}  [${known}]`);
  }
  const unknown = opSorted.filter(([k]) => !KNOWN_OPERATOR_TYPES.has(k));
  if (unknown.length) {
    console.log('\nUnknown / alias-check operators:');
    for (const [k, n] of unknown.slice(0, 15)) console.log(`  ${n}  ${k}`);
  }

  const light = ['ground', 'baseline', 'value', 'subject', 'scene', 'mode', 'concept', 'wonder'];
  console.log('\nUnder-taught original-set signals (counts):');
  for (const k of light) {
    console.log(`  ${k.padEnd(12)} ${html.operators.get(k) || 0}`);
  }

  console.log('\nForms (data-spw-form):');
  for (const [k, n] of [...html.forms.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${k}`);
  }
  console.log('\nBraces (data-spw-brace):');
  for (const [k, n] of [...html.braces.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${k}`);
  }

  console.log('\n.spw language / claims (site, no workbench):');
  console.log('  spw files     ', spw.spwFiles);
  console.log('  v04 pillars   ', spw.pillars);
  console.log('  owner_claim/# ', spw.ownerClaims);
  console.log('  probe_ref=    ', spw.probeRefs);
  console.log('  hypothesis=   ', spw.claims);
  console.log('  operation=    ', spw.operations);
  const probeRatio = spw.claims ? (spw.probeRefs / spw.claims).toFixed(2) : 'n/a';
  console.log('  probe/hypothesis ratio ~', probeRatio, '(higher is more falsifiable)');

  console.log('\nLanguage recursive improvement:');
  console.log('  1) .spw/language/v04 priority_stack');
  console.log('  2) .spw/language/feature-utilization.spw');
  console.log('  3) cache → stem/operator/claim patch');
  console.log('  4) re-run npm run ecology:language');
  console.log('\nFor site runtime packs (body features), use: npm run ecology\n');
}

async function main() {
  const [html, spw] = await Promise.all([inventoryHtml(), inventorySpwLanguage()]);

  if (JSON_OUT) {
    console.log(JSON.stringify({
      html: {
        files: html.files,
        chips: html.chips,
        expressions: html.expressions,
        operators: Object.fromEntries(html.operators),
        forms: Object.fromEntries(html.forms),
        braces: Object.fromEntries(html.braces),
      },
      spw,
    }, null, 2));
  } else {
    printReport(html, spw);
  }

  if (STRICT) {
    const unknown = [...html.operators.keys()].filter((k) => !KNOWN_OPERATOR_TYPES.has(k));
    if (unknown.length > 20) {
      console.error('[ecology:language] STRICT: many unknown operators', unknown.slice(0, 10));
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
