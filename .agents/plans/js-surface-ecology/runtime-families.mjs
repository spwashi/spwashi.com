#!/usr/bin/env node
/**
 * Runtime families move — 2026-09-27.
 *
 * Moves the loose files under public/js/runtime/ into named families and
 * rewrites every reference. Basenames never change, so a grep for a file name
 * still finds it; only the folder is new.
 *
 * Two rewrite passes:
 *   1. Relative specifiers in JS/TS sources (static, dynamic, and JSDoc
 *      import('…') types) are resolved against the file's old seat and
 *      recomputed from its new seat. This is the only pass that can fix
 *      `./sibling.js` and catalog `import('../x.js')` loads.
 *   2. Every tracked text file: `runtime/<moved>.js` becomes
 *      `runtime/<family>/<moved>.js`. That covers /public/js/ specifiers,
 *      HTML script tags, sw.js, .spw refs, plans, and prose — an address kept
 *      resolvable is kinder than a dated sentence left pointing at nothing.
 *
 * The installed workbench (.spw/_workbench) is never written.
 *
 * Usage: node .agents/plans/js-surface-ecology/runtime-families.mjs [--dry]
 * Regrouping later: edit FAMILIES for the files still loose, or write the next
 * map from `git mv` history; the passes do not assume a flat source.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry');
const RUNTIME = 'public/js/runtime';

export const FAMILIES = {
  arrival: [
    'arrival-shells', 'frame-size-memory', 'hydration-passes', 'load-trace',
    'loading-ecology', 'module-effects', 'prepaint-state',
  ],
  attention: ['attention-architecture'],
  diagnostics: ['debug-qa-posture', 'fit-report', 'layout-qa', 'layout-shift-audit', 'observation-beats'],
  discovery: ['feature-discovery', 'feature-lab', 'feature-lab-ui', 'tuning-discovery'],
  experiential: ['experiential'],
  expression: [
    'dom-probes', 'expression-resonance', 'gate', 'image-provenance',
    'precipitation-request', 'reactive-spine', 'sigil-anatomy', 'topical-payload',
  ],
  interaction: [
    'brace-actions', 'brace-gestures', 'brace-pivots', 'gesture-anatomy',
    'gesture-contract', 'scene-interaction', 'spw-key-events', 'wrap-jobs',
  ],
  labs: ['ingredient-lab', 'interactive-expression-lab', 'spw-hero-kinetic-stage', 'toolmaker-submissions'],
  memory: [
    'cauldron-fluency', 'cognitive-core', 'cognitive-state', 'component-collection',
    'effect-ledger', 'familiarity-gate', 'learnability-ledger', 'pin-registry',
    'reward-ui', 'spells', 'visitation', 'wonder-memory',
  ],
  navigation: ['frame-navigator', 'navigation-locomotion', 'navigation-spells', 'query-link-composer', 'site-search'],
  orchestration: ['behavior-scopes', 'dom-sync-hub'],
  page: [
    'frame-metrics', 'lens-intent', 'lens-modes', 'page-anatomy', 'page-category',
    'page-hooks', 'page-state', 'site-core-minimal', 'state-orchestrator', 'states',
  ],
  physics: [
    'charge-field', 'developmental-climate', 'palette-treat-discovery', 'physical-model',
    'pulse-beat-tuner', 'settings-momentum', 'spatial-gravity',
  ],
  regions: [
    'annotation-layer', 'composition-box-model', 'layout-assumptions', 'page-region-rail',
    'positioning-orchestration', 'region-enhancer', 'region-kin', 'region-menu',
    'region-profiler', 'variant-selection',
  ],
  shell: ['interactive-medium', 'pwa-update-handler', 'shell-disclosure', 'tuning-contract'],
};

const MOVES = new Map();
for (const [family, names] of Object.entries(FAMILIES)) {
  for (const name of names) {
    MOVES.set(`${RUNTIME}/${name}.js`, `${RUNTIME}/${family}/${name}.js`);
  }
}

const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']);
const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.svgz', '.woff', '.woff2',
  '.ttf', '.otf', '.eot', '.zip', '.gz', '.pdf', '.mp3', '.mp4', '.webm', '.wav', '.ogg', '.mov',
]);
const SKIP_PREFIXES = ['.spw/_workbench/', 'node_modules/', 'dist/', 'dist-vite/'];

function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
    .filter((file) => !SKIP_PREFIXES.some((prefix) => file.startsWith(prefix)))
    .filter((file) => !BINARY_EXT.has(path.extname(file).toLowerCase()));
}

function toPosixRelative(fromDir, target) {
  let rel = path.posix.relative(fromDir, target);
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

/** Pass 1: relative specifiers keep pointing at the same file from the new seat. */
function rewriteRelativeSpecifiers(file, source) {
  const newFile = MOVES.get(file) || file;
  const oldDir = path.posix.dirname(file);
  const newDir = path.posix.dirname(newFile);
  const specifierRe = /((?:\bfrom|\bimport)\s*\(?\s*)(['"])(\.{1,2}\/[^'"\n]+)\2/g;
  let changed = 0;
  const next = source.replace(specifierRe, (whole, lead, quote, spec) => {
    const [bare, suffix = ''] = spec.split(/(?=[?#])/);
    const oldTarget = path.posix.normalize(path.posix.join(oldDir, bare));
    const newTarget = MOVES.get(oldTarget) || oldTarget;
    if (newTarget === oldTarget && newDir === oldDir) return whole;
    const rewritten = toPosixRelative(newDir, newTarget) + suffix;
    if (rewritten === spec) return whole;
    changed += 1;
    return `${lead}${quote}${rewritten}${quote}`;
  });
  return { next, changed };
}

const names = [...MOVES.keys()].map((file) => path.posix.basename(file, '.js'));
const familyOf = new Map([...MOVES].map(([from, to]) => [
  path.posix.basename(from, '.js'),
  path.posix.basename(path.posix.dirname(to)),
]));
const addressRe = new RegExp(
  `(?<![\\w.-])runtime/(${names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\.js\\b`,
  'g',
);

/** Pass 2: addresses written from public/js (or the repo root) gain their family. */
function rewriteAddresses(source) {
  let changed = 0;
  const next = source.replace(addressRe, (_whole, name) => {
    changed += 1;
    return `runtime/${familyOf.get(name)}/${name}.js`;
  });
  return { next, changed };
}

function main() {
  for (const [from, to] of MOVES) {
    if (!fs.existsSync(path.join(ROOT, from))) throw new Error(`missing source ${from}`);
    if (fs.existsSync(path.join(ROOT, to))) throw new Error(`target exists ${to}`);
  }

  const edits = new Map();
  let relativeCount = 0;
  let addressCount = 0;
  for (const file of trackedFiles()) {
    const full = path.join(ROOT, file);
    let source;
    try {
      source = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    if (source.includes('\u0000')) continue;
    let next = source;
    if (CODE_EXT.has(path.extname(file))) {
      const pass = rewriteRelativeSpecifiers(file, next);
      next = pass.next;
      relativeCount += pass.changed;
    }
    const addresses = rewriteAddresses(next);
    next = addresses.next;
    addressCount += addresses.changed;
    if (next !== source) edits.set(file, next);
  }

  const loose = fs.readdirSync(path.join(ROOT, RUNTIME)).filter((entry) => entry.endsWith('.js'));
  const unmapped = loose.filter((entry) => !MOVES.has(`${RUNTIME}/${entry}`));

  console.log(`[runtime-families] moves=${MOVES.size} files-edited=${edits.size} relative=${relativeCount} addresses=${addressCount}`);
  if (unmapped.length) console.log(`[runtime-families] still loose: ${unmapped.join(' ')}`);
  if (DRY) {
    for (const file of [...edits.keys()].sort()) console.log(`  edit ${file}`);
    return;
  }

  for (const [file, next] of edits) fs.writeFileSync(path.join(ROOT, file), next);
  for (const [from, to] of MOVES) {
    fs.mkdirSync(path.join(ROOT, path.posix.dirname(to)), { recursive: true });
    execFileSync('git', ['mv', from, to], { cwd: ROOT });
  }
}

main();
