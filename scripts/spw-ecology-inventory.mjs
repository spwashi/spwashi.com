#!/usr/bin/env node
/**
 * spw-ecology-inventory.mjs
 * ---------------------------------------------------------------------------
 * Zero-dep inventory for recursive improvement loops:
 *   - body data-spw-features token frequency
 *   - BEHAVIOR_SCOPES keys (from generated behavior-scopes.js)
 *   - .spw audits / conventions / caches counts
 *   - module catalog MOUNT_WHEN + timingArc hygiene summary
 *
 * Usage: node scripts/spw-ecology-inventory.mjs
 *        npm run ecology
 *
 * Does not require build:tools. Does not fail CI unless --strict.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT, walkFiles, isAuthoredHtml } from './lib/spw-inventory-core.mjs';

const STRICT = process.argv.includes('--strict');
const JSON_OUT = process.argv.includes('--json');

function tokenizeFeatures(attrValue = '') {
  return String(attrValue)
    .split(/[\s,]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

async function collectFeatureTokens() {
  // Authored HTML only — generated pages (design/catalog) must not drive
  // feature-utilization review.
  const htmlFiles = walkFiles(ROOT, { exts: ['.html'], predicate: (full) => isAuthoredHtml(full) });
  const counts = new Map();
  const routesByToken = new Map();
  let bodies = 0;

  for (const file of htmlFiles) {
    const text = await fs.readFile(file, 'utf8');
    const match = text.match(/data-spw-features\s*=\s*"([^"]*)"/i)
      || text.match(/data-spw-features\s*=\s*'([^']*)'/i);
    if (!match) continue;
    bodies += 1;
    const rel = path.relative(ROOT, file);
    for (const token of tokenizeFeatures(match[1])) {
      counts.set(token, (counts.get(token) || 0) + 1);
      if (!routesByToken.has(token)) routesByToken.set(token, []);
      const list = routesByToken.get(token);
      if (list.length < 5) list.push(rel);
    }
  }

  return { bodies, counts, routesByToken, htmlFiles: htmlFiles.length };
}

async function readBehaviorScopeKeys() {
  const scopePath = path.join(ROOT, 'public/js/runtime/behavior-scopes.js');
  try {
    const text = await fs.readFile(scopePath, 'utf8');
    const block = text.match(/BEHAVIOR_SCOPE_KEYS\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/);
    if (!block) return [];
    return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

async function countSpwTree() {
  const base = path.join(ROOT, '.spw');
  const count = (sub) => walkFiles(path.join(base, sub), { exts: ['.spw'] }).length;
  return {
    conventions: count('conventions'),
    audits: count('audits'),
    reviews: count('reviews'),
    caches: count('caches'),
    language: count('language'),
    surfaces: count('surfaces'),
    philosophy: count('philosophy'),
    slices: count('slices'),
  };
}

/**
 * Parse the tier token sets out of feature-utilization.spw so token
 * classification cannot drift from the convention (utilization_rules u1/u2).
 * Backtick-quoted single tokens inside each named tier sub-facet are the
 * tier's members; prose backtick strings contain spaces and never match.
 */
async function readUtilizationTiers() {
  const conventionPath = path.join(ROOT, '.spw/conventions/feature-utilization.spw');
  let text;
  try {
    text = await fs.readFile(conventionPath, 'utf8');
  } catch {
    return null;
  }
  const start = text.indexOf('^"tiers"');
  const end = text.indexOf('^"packs"');
  if (start === -1) return null;
  const block = text.slice(start, end === -1 ? undefined : end);
  const tiers = {};
  const heads = [...block.matchAll(/^\s{2}(\w+) = \.\{/gm)];
  for (let i = 0; i < heads.length; i += 1) {
    const name = heads[i][1];
    const from = heads[i].index;
    const to = i + 1 < heads.length ? heads[i + 1].index : block.length;
    const tokens = [...block.slice(from, to).matchAll(/`([a-z0-9][a-z0-9-]*)`/g)]
      .map((m) => m[1]);
    tiers[name] = [...new Set(tokens)];
  }
  return tiers;
}

function classifyTokens(counts, tiers) {
  const tierOf = new Map();
  if (tiers) {
    for (const [tier, tokens] of Object.entries(tiers)) {
      for (const token of tokens) {
        if (!tierOf.has(token)) tierOf.set(token, []);
        tierOf.get(token).push(tier);
      }
    }
  }
  const untiered = [...counts.keys()].filter((t) => !tierOf.has(t)).sort();
  return { tierOf, untiered };
}

async function catalogHygiene() {
  const catalogPath = path.join(ROOT, 'public/js/runtime/module-catalog.js');
  let text;
  try {
    text = await fs.readFile(catalogPath, 'utf8');
  } catch {
    return null;
  }

  // Lightweight object-ish scan for id/when/timingArc in def blocks
  const ids = [...text.matchAll(/\bid:\s*'([^']+)'/g)].map((m) => m[1]);
  const whens = [...text.matchAll(/\bwhen:\s*MOUNT_WHEN\.(\w+)/g)].map((m) => m[1].toLowerCase());
  const arcs = [...text.matchAll(/\btimingArc:\s*'([^']+)'/g)].map((m) => m[1]);

  const whenCounts = {};
  for (const w of whens) {
    whenCounts[w] = (whenCounts[w] || 0) + 1;
  }

  // Approximate IMMEDIATE without timingArc: count immediate defs via simple split
  const defChunks = text.split(/\{\s*\n\s*id:/);
  let immediate = 0;
  let immediateNoArc = 0;
  for (const chunk of defChunks.slice(1)) {
    const isImm = /when:\s*MOUNT_WHEN\.IMMEDIATE/.test(chunk) || /when:\s*'immediate'/.test(chunk);
    if (!isImm) continue;
    immediate += 1;
    if (!/timingArc:/.test(chunk.split(/\n\s*\},/)[0] || chunk.slice(0, 800))) {
      immediateNoArc += 1;
    }
  }

  return {
    idCount: ids.length,
    whenCounts,
    timingArcCount: arcs.length,
    immediate,
    immediateNoArc,
  };
}

function printReport(report) {
  const { features, scopes, spw, catalog, utilization } = report;
  console.log('=== Spw ecology inventory ===\n');

  console.log('HTML bodies with data-spw-features:', features.bodies, `/ files scanned:`, features.htmlFiles);
  console.log('\nFeature tokens (count → token → scope → convention tier):');
  const sorted = [...features.counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [token, n] of sorted) {
    const inScope = scopes.includes(token) ? 'scope' : 'presence';
    const tier = utilization.tierOf.get(token)?.join('+') || 'UNTIERED';
    console.log(`  ${String(n).padStart(4)}  ${token.padEnd(28)}  [${inScope}]  ${tier}`);
  }

  if (utilization.untiered.length) {
    console.log('\nTokens outside every feature-utilization.spw tier (u1/u2 review):');
    console.log(`  ${utilization.untiered.join(', ')}`);
  }

  console.log('\nBEHAVIOR_SCOPE_KEYS:', scopes.join(', ') || '(missing — run build:css)');

  const rare = sorted.filter(([, n]) => n <= 2);
  if (rare.length) {
    console.log('\nRare tokens (≤2 routes) — review pack membership:');
    for (const [token, n] of rare) {
      const samples = features.routesByToken.get(token)?.join(', ') || '';
      console.log(`  ${token} (${n})  e.g. ${samples}`);
    }
  }

  const missingScope = scopes.filter((s) => !features.counts.has(s));
  if (missingScope.length) {
    console.log('\nScopes never seen on a body (ok if unused):', missingScope.join(', '));
  }

  console.log('\n.spw tree (excluding _workbench):');
  for (const [k, v] of Object.entries(spw)) {
    console.log(`  ${k.padEnd(14)} ${v}`);
  }

  if (catalog) {
    console.log('\nModule catalog hygiene (approx):');
    console.log('  ids ~', catalog.idCount);
    console.log('  when:', JSON.stringify(catalog.whenCounts));
    console.log('  timingArc declarations ~', catalog.timingArcCount);
    console.log('  IMMEDIATE ~', catalog.immediate, ' without timingArc in chunk ~', catalog.immediateNoArc);
  }

  console.log('\nRecursive improvement:');
  console.log('  1) read .spw/audits/index.spw reading_orders');
  console.log('  2) cache under .spw/caches/ or audit claims');
  console.log('  3) smallest surface patch → check:local / check:runtime');
  console.log('  4) re-run npm run ecology\n');
}

async function main() {
  const [features, scopes, spw, catalog, tiers] = await Promise.all([
    collectFeatureTokens(),
    readBehaviorScopeKeys(),
    countSpwTree(),
    catalogHygiene(),
    readUtilizationTiers(),
  ]);
  const utilization = { tiers, ...classifyTokens(features.counts, tiers) };

  const report = { features: {
    bodies: features.bodies,
    htmlFiles: features.htmlFiles,
    counts: features.counts,
    routesByToken: features.routesByToken,
  }, scopes, spw, catalog, utilization };

  if (JSON_OUT) {
    console.log(JSON.stringify({
      bodies: features.bodies,
      tokens: Object.fromEntries(features.counts),
      scopes,
      spw,
      catalog,
      tiers,
      tokenTiers: Object.fromEntries(utilization.tierOf),
      untiered: utilization.untiered,
    }, null, 2));
  } else {
    printReport(report);
  }

  if (STRICT) {
    // Soft strict: fail if BEHAVIOR_SCOPE_KEYS empty (broken generate)
    if (!scopes.length) {
      console.error('[ecology] STRICT: behavior-scopes.js missing keys');
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
