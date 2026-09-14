#!/usr/bin/env node
/**
 * Two custom-property mistakes that fail silently in the browser.
 *
 * 1. Self reference. `--x: max(var(--x, 0), 0.4)` reads as "raise x to at least
 *    0.4", but a custom property that references itself on one element is a
 *    cycle. CSS makes it invalid at computed-value time: an unregistered
 *    property becomes guaranteed-invalid (readers take their var() fallback), a
 *    registered one falls back to inherit or its initial value. The author's
 *    effect never happens, and the rule usually erases the value it meant to
 *    raise. To combine with an inherited or earlier value, use a second name.
 *
 * 2. Periodic root writes. Some <html> attributes change on a clock — the beat,
 *    freshness pulses, palette treat splashes. A rule whose subject is html,
 *    :root, or body and that sets custom properties when one of those
 *    attributes changes re-resolves style for the whole document on every tick.
 *    Scope the property to the elements that read it.
 *
 * Self references that predate this audit are held in
 * css-custom-property-baseline.json, per file and property, as counts to shrink.
 * Periodic root writes have no baseline; the allowlist below names the bounded
 * exceptions and why.
 *
 *   node scripts/css-custom-property-audit.mjs
 *     --list            print every finding with its line
 *     --write-baseline  replace the self-reference baseline (review the diff)
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS_ROOT = path.join(ROOT, 'public/css');
const BASELINE_PATH = path.join(ROOT, 'scripts/css-custom-property-baseline.json');
const SKIP_DIRS = new Set(['bundles']);

export const PERIODIC_ROOT_ATTRIBUTES = Object.freeze([
  'data-spw-beat',
  'data-spw-beat-prime',
  'data-spw-playing',
  'data-spw-freshness-pulse',
  'data-spw-palette-splash',
  'data-spw-palette-treat-active',
  'data-spw-palette-treat-probe',
  'data-spw-palette-treat-depth',
]);

const PERIODIC_RE = new RegExp(`\\b(?:${PERIODIC_ROOT_ATTRIBUTES.join('|')})\\b`);

/* file → selector substring → reason. A match must name a bounded window. */
const PERIODIC_ROOT_ALLOW = Object.freeze({
  'public/css/systems/interaction-progression.css': {
    'data-spw-loading-ecology-phase="settling"': 'substrate-ecology reads the beat on the root only while loading-ecology holds the settling phase',
  },
});

/** Replace comments with spaces, keeping line numbers stable. */
export function stripCssComments(source = '') {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
}

const lineAt = (source, index) => source.slice(0, index).split('\n').length;
const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function findSelfReferences(source = '') {
  const text = stripCssComments(source);
  const findings = [];
  const declaration = /(--[a-zA-Z0-9_-]+)\s*:([^;{}]*)/g;
  for (const match of text.matchAll(declaration)) {
    const [, name, value] = match;
    if (new RegExp(`var\\(\\s*${escapeRe(name)}\\s*[,)]`).test(value)) {
      findings.push({ property: name, line: lineAt(text, match.index) });
    }
  }
  return findings;
}

/* The element a selector styles: drop functional pseudo-classes that do not
   change the subject, unwrap :where/:is, and take the last compound. */
export function selectorSubject(selector = '') {
  let text = selector;
  let previous;
  do {
    previous = text;
    text = text.replace(/:(?:not|has|nth-[a-z-]+)\([^()]*\)/g, '');
  } while (text !== previous);
  text = text.replace(/:(?:where|is)\(/g, ' ').replace(/[()]/g, ' ');
  const compounds = text.split(/[\s>+~]+/).filter(Boolean);
  return compounds[compounds.length - 1] || '';
}

function splitSelectorList(prelude) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < prelude.length; index += 1) {
    const char = prelude[index];
    if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;
    else if (char === ',' && depth === 0) {
      parts.push(prelude.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(prelude.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

/* Innermost rule blocks only; at-rule wrappers have nested braces. The subject
   test runs per selector because :where(a, b) lists put several subjects in one
   argument. */
export function findPeriodicRootWrites(source = '', { allow = {} } = {}) {
  const text = stripCssComments(source);
  const findings = [];
  for (const match of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const prelude = match[1].trim();
    const body = match[2];
    if (!PERIODIC_RE.test(prelude) || !/--[a-zA-Z0-9_-]+\s*:/.test(body)) continue;
    if (Object.keys(allow).some((needle) => prelude.includes(needle))) continue;
    const rootSubjects = splitSelectorList(prelude).filter((selector) => (
      PERIODIC_RE.test(selector) && /^(?:html|:root|body)(?:[[:.]|$)/.test(selectorSubject(selector))
    ));
    /* :where(html[a], html[b]) is one selector whose subject compound list holds
       both roots; selectorSubject returns the last root compound, which is enough
       to classify the rule. */
    if (rootSubjects.length) {
      findings.push({ selector: rootSubjects[0].replace(/\s+/g, ' '), line: lineAt(text, match.index + match[0].indexOf(prelude)) });
    }
  }
  return findings;
}

async function walkCss(directory, out = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) await walkCss(full, out);
    } else if (entry.name.endsWith('.css')) {
      out.push(full);
    }
  }
  return out.sort();
}

export async function auditCssCustomProperties() {
  const selfReference = {};
  const selfReferenceLines = [];
  const periodicRoot = [];
  for (const file of await walkCss(CSS_ROOT)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const source = await readFile(file, 'utf8');
    for (const finding of findSelfReferences(source)) {
      selfReference[rel] ||= {};
      selfReference[rel][finding.property] = (selfReference[rel][finding.property] || 0) + 1;
      selfReferenceLines.push({ file: rel, ...finding });
    }
    for (const finding of findPeriodicRootWrites(source, { allow: PERIODIC_ROOT_ALLOW[rel] || {} })) {
      periodicRoot.push({ file: rel, ...finding });
    }
  }
  return { selfReference, selfReferenceLines, periodicRoot };
}

export function diffSelfReferences(current = {}, baseline = {}) {
  const grown = [];
  const shrunk = [];
  const files = new Set([...Object.keys(current), ...Object.keys(baseline)]);
  for (const file of files) {
    const properties = new Set([...Object.keys(current[file] || {}), ...Object.keys(baseline[file] || {})]);
    for (const property of properties) {
      const now = current[file]?.[property] || 0;
      const known = baseline[file]?.[property] || 0;
      if (now > known) grown.push(`${file} ${property} ${known} → ${now}`);
      if (now < known) shrunk.push(`${file} ${property} ${known} → ${now}`);
    }
  }
  return { grown, shrunk };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const report = await auditCssCustomProperties();
  const total = report.selfReferenceLines.length;

  if (args.has('--write-baseline')) {
    await writeFile(BASELINE_PATH, `${JSON.stringify(report.selfReference, null, 2)}\n`);
    console.log(`[audit:css-custom-properties] baseline written: ${total} self-referencing declarations in ${Object.keys(report.selfReference).length} files`);
    return;
  }

  if (args.has('--list')) {
    report.selfReferenceLines.forEach(({ file, line, property }) => console.log(`self-reference ${file}:${line} ${property}`));
    report.periodicRoot.forEach(({ file, line, selector }) => console.log(`periodic-root  ${file}:${line} ${selector}`));
  }

  const baseline = JSON.parse(await readFile(BASELINE_PATH, 'utf8').catch(() => '{}'));
  const { grown, shrunk } = diffSelfReferences(report.selfReference, baseline);
  let failed = false;

  if (report.periodicRoot.length) {
    failed = true;
    console.log('[audit:css-custom-properties] root rules set custom properties on a periodic attribute — scope them to the elements that read them:');
    report.periodicRoot.forEach(({ file, line, selector }) => console.log(`  ${file}:${line} ${selector}`));
  }
  if (grown.length) {
    failed = true;
    console.log('[audit:css-custom-properties] new self-referencing custom properties (a cycle, not an accumulator) — use a second property name:');
    grown.forEach((line) => console.log(`  ${line}`));
  }
  if (shrunk.length) {
    failed = true;
    console.log('[audit:css-custom-properties] self references removed — update scripts/css-custom-property-baseline.json (--write-baseline):');
    shrunk.forEach((line) => console.log(`  ${line}`));
  }
  if (failed) {
    process.exitCode = 1;
    return;
  }
  console.log(`[audit:css-custom-properties] ok — no periodic root writes; ${total} self-referencing declarations held in baseline`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  await main();
}
