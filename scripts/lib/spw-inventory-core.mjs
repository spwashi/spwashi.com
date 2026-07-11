/**
 * spw-inventory-core.mjs
 * ---------------------------------------------------------------------------
 * Shared substrate for recursive-improvement inventory scripts
 * (language-census.mjs, spw-ecology-inventory.mjs).
 *
 * Doctrine (recursive-improvement.spw ^script_architecture): inventory scripts
 * stay pure zero-dep mjs, callable without build:tools, so chat-agent loops can
 * run them cold. This module exists so the walkers, skip sets, and .spw
 * emitters of those scripts cannot drift apart.
 */

import { readdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** Directories no inventory dimension should descend into. */
export const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'bundles',
  'dist',
  'dist-vite',
  '_workbench',
  '.claude',
]);

/** Generated HTML that must not count as authored surface. */
export const GENERATED_HTML_PREFIXES = ['design/catalog/'];

export function repoPath(path) {
  return relative(ROOT, path).replaceAll('\\', '/');
}

export function isAuthoredHtml(path) {
  const rel = repoPath(path);
  return !GENERATED_HTML_PREFIXES.some(
    (prefix) => rel === prefix.slice(0, -1) || rel.startsWith(prefix),
  );
}

export function* walk(dir, { exts = null, predicate = null, skip = SKIP_DIRS } = {}) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (skip.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path, { exts, predicate, skip });
    } else {
      if (exts && !exts.includes(extname(entry.name))) continue;
      if (predicate && !predicate(path, entry.name)) continue;
      yield path;
    }
  }
}

export function walkFiles(dir, opts) {
  return [...walk(dir, opts)];
}

// --- .spw emitters ---------------------------------------------------------

export function capList(list, n = 48) {
  return list.length > n ? [...list.slice(0, n), `… +${list.length - n} more`] : list;
}

/** `name: #[ ... ][reg=set]` with backticked entries, capped for readability. */
export function spwSet(name, list, { cap = 48, indent = '  ' } = {}) {
  const body = capList(list, cap).map((x) => `${indent}\`${x}\``).join(',\n');
  return `${name}: #[\n${body}\n][reg=set]`;
}

/** `name: .{ k = v ... }[reg=facet]` — values emitted verbatim. */
export function spwFacet(name, entries, { indent = '  ' } = {}) {
  const body = Object.entries(entries)
    .map(([k, v]) => `${indent}${k} = ${v}`)
    .join('\n');
  return `${name}: .{\n${body}\n}[reg=facet]`;
}

/** `^"label"{ k = v ... }[reg=facet]` — labeled stem facet, audit-index style. */
export function spwStemFacet(label, entries, { indent = '  ' } = {}) {
  const body = Object.entries(entries)
    .map(([k, v]) => `${indent}${k} = ${v}`)
    .join('\n');
  return `^"${label}"{\n${body}\n}[reg=facet]`;
}
