#!/usr/bin/env node
/**
 * Start from MODULE_DEFS. Measure selector specificity, combinator depth,
 * and HTML host nesting across authored routes.
 *
 *   node --import ./scripts/lib/register-public-imports.mjs \
 *     scripts/module-selector-depth-audit.mjs
 *   node --import ./scripts/lib/register-public-imports.mjs \
 *     scripts/module-selector-depth-audit.mjs --json
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { MODULE_DEFS } from '../public/js/runtime/module-catalog.js';
import {
  combinatorDepth,
  indexHtmlElements,
  matchSelector,
  selectorSpecificity,
  summarizeHostDepths,
  usesLegacySiteFrame,
} from './lib/module-selector-audit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.spw', 'coverage', 'dist', 'dist-vite',
  'build', '.vite', 'design', 'public', 'scripts', '.agents',
]);

async function walkIndexHtml(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkIndexHtml(full, out);
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

function routeFromFile(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return `/${rel.replace(/\/index\.html$/, '/')}`;
}

function formatSpec(spec) {
  return `(${spec.a},${spec.b},${spec.c})`;
}

export async function auditModuleSelectors({ root = ROOT, defs = MODULE_DEFS } = {}) {
  const files = await walkIndexHtml(root);
  const routes = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const elements = indexHtmlElements(html);
    const maxDepth = elements.reduce((max, el) => Math.max(max, el.depth), 0);
    routes.push({
      file,
      route: routeFromFile(file),
      elements,
      maxDepth,
      elementCount: elements.length,
    });
  }

  const modules = defs.map((def) => {
    const selector = def.selector || '';
    const spec = selector ? selectorSpecificity(selector) : { a: 0, b: 0, c: 0, score: 0, combinators: 0, branches: 0 };
    const hostRoutes = [];
    let hits = 0;
    let minDepth = null;
    let maxDepth = null;
    for (const page of routes) {
      if (!selector) continue;
      const matched = matchSelector(page.elements, selector);
      if (!matched.length) continue;
      const summary = summarizeHostDepths(matched);
      hits += summary.count;
      minDepth = minDepth == null ? summary.min : Math.min(minDepth, summary.min);
      maxDepth = maxDepth == null ? summary.max : Math.max(maxDepth, summary.max);
      hostRoutes.push({
        route: page.route,
        count: summary.count,
        min: summary.min,
        max: summary.max,
        mean: summary.mean,
      });
    }
    return {
      id: def.id,
      layer: def.layer,
      when: def.when,
      selector: selector || null,
      noSelector: !selector,
      spec: formatSpec(spec),
      specScore: spec.score,
      combinators: spec.combinators,
      branches: spec.branches,
      legacySiteFrame: usesLegacySiteFrame(selector),
      hostRoutes: hostRoutes.length,
      hits,
      minDepth,
      maxDepth,
      orphan: Boolean(selector) && hostRoutes.length === 0,
    };
  });

  const gated = modules.filter((row) => row.selector);
  const orphans = gated.filter((row) => row.orphan);
  const legacy = gated.filter((row) => row.legacySiteFrame);
  const deepHosts = gated.filter((row) => (row.maxDepth || 0) >= 10);
  const combinatorHeavy = gated.filter((row) => row.combinators >= 2);
  const broad = gated.filter((row) => row.selector === 'html' || row.selector === 'body' || row.selector === 'main');

  const routeDepths = [...routes]
    .sort((a, b) => b.maxDepth - a.maxDepth)
    .slice(0, 12)
    .map((page) => ({ route: page.route, maxDepth: page.maxDepth, elements: page.elementCount }));

  return {
    at: new Date().toISOString(),
    catalog: defs.length,
    routes: routes.length,
    gated: gated.length,
    noSelector: modules.filter((row) => row.noSelector).length,
    orphans: orphans.map((row) => row.id),
    legacySiteFrame: legacy.map((row) => row.id),
    combinatorHeavy: combinatorHeavy.map((row) => `${row.id}:${row.combinators}`),
    broad: broad.map((row) => `${row.id}:${row.selector}`),
    deepHosts: deepHosts.map((row) => `${row.id}:d${row.maxDepth}`),
    routeDepths,
    modules,
  };
}

function printReport(report) {
  const lines = [];
  lines.push(`module-selector-depth  catalog=${report.catalog} routes=${report.routes} gated=${report.gated} no-selector=${report.noSelector}`);
  lines.push('');
  lines.push('orphans (selector never matches public index.html)');
  lines.push(report.orphans.length ? `  ${report.orphans.join(', ')}` : '  none');
  lines.push('');
  lines.push('legacy .site-frame in catalog selector');
  lines.push(report.legacySiteFrame.length ? `  ${report.legacySiteFrame.join(', ')}` : '  none');
  lines.push('');
  lines.push('combinator depth ≥ 2');
  lines.push(report.combinatorHeavy.length ? `  ${report.combinatorHeavy.join(', ')}` : '  none');
  lines.push('');
  lines.push('html|body|main selectors');
  lines.push(report.broad.length ? `  ${report.broad.join(', ')}` : '  none');
  lines.push('');
  lines.push('module hosts at HTML depth ≥ 10');
  lines.push(report.deepHosts.length ? `  ${report.deepHosts.join(', ')}` : '  none');
  lines.push('');
  lines.push('deepest public routes');
  for (const page of report.routeDepths) {
    lines.push(`  ${String(page.maxDepth).padStart(2)}  ${String(page.elements).padStart(5)} els  ${page.route}`);
  }
  lines.push('');
  lines.push('id                               spec     comb  hosts  hits   depth     selector');
  for (const row of report.modules) {
    const depth = row.maxDepth == null ? '—' : `${row.minDepth}–${row.maxDepth}`;
    const sel = (row.selector || '(always)').slice(0, 52);
    lines.push(
      `${row.id.padEnd(32)} ${row.spec.padEnd(8)} ${String(row.combinators).padStart(4)}  ${String(row.hostRoutes).padStart(5)}  ${String(row.hits).padStart(5)}  ${depth.padEnd(8)}  ${sel}`,
    );
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}

async function main(argv = process.argv.slice(2)) {
  const json = argv.includes('--json');
  const report = await auditModuleSelectors();
  if (json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else printReport(report);
  return 0;
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  main().then((code) => process.exit(code ?? 0));
}
