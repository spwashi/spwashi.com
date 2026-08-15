/**
 * Find attributes that are declared and never read.
 *
 * An inert attribute is one the site writes or stamps and nothing consumes: no
 * CSS selector, no runtime reader, no serializer. It costs bytes on every
 * request and it lies to the next reader, who reasonably assumes an attribute
 * that exists does something.
 *
 * Three populations, and the interesting findings live in the overlaps:
 *
 *   markup      stamped in HTML
 *   declared    named in a module catalog's `updates:` list
 *   consumed    selected by CSS, or read by JS
 *
 * The consumed check has to look for two spellings. `el.dataset.spwMicroWorld`
 * and `[data-spw-micro-world]` are the same attribute, and a search for only
 * the hyphenated literal reports "no reader" for every attribute the runtime
 * touches through the dataset API. Both forms are tested here.
 *
 * Not every unconsumed attribute is a defect. `data-spw-route-note` and
 * `data-spw-context-relevance` are annotations addressed to a reader or a
 * model, and styling them would be a category error. Those live in ADDRESSED_
 * ELSEWHERE and are reported separately rather than silently excused, so the
 * exemption stays visible and arguable.
 *
 * Usage:
 *   node scripts/spw-inert-audit.mjs            # report
 *   node scripts/spw-inert-audit.mjs --json     # machine-readable
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', '.spw', 'dist', 'coverage']);

/**
 * Attributes whose audience is a person or a model, not a stylesheet. Being
 * unconsumed by code is their correct state.
 */
const ADDRESSED_ELSEWHERE = new Set([
  'data-spw-route-note',
  'data-spw-context-relevance',
  'data-spw-seed',
  'data-spw-meaning',
  'data-spw-catalog-kind',
  'data-spw-css-scope',
]);

/** data-spw-micro-world → spwMicroWorld */
const toDatasetKey = (attr) => attr
  .replace(/^data-/, '')
  .replace(/-([a-z])/g, (_, c) => c.toUpperCase());

async function walk(dir, test, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, test, out);
    else if (test(entry.name)) out.push(full);
  }
  return out;
}

async function readAll(files) {
  const chunks = await Promise.all(files.map((f) => readFile(f, 'utf8').catch(() => '')));
  return chunks.join('\n');
}

async function main() {
  const [htmlFiles, cssFiles, jsFiles, catalogFiles] = await Promise.all([
    walk(ROOT, (n) => n.endsWith('.html')),
    walk(path.join(ROOT, 'public/css'), (n) => n.endsWith('.css')),
    walk(path.join(ROOT, 'public/js'), (n) => n.endsWith('.js')),
    readdir(path.join(ROOT, 'public/js/runtime')).then((names) => names
      .filter((n) => n.startsWith('module-catalog-') && n.endsWith('.js'))
      .map((n) => path.join(ROOT, 'public/js/runtime', n))),
  ]);

  const [html, , js, catalogs] = await Promise.all([
    readAll(htmlFiles), readAll(cssFiles), readAll(jsFiles), readAll(catalogFiles),
  ]);

  // Population 1 — stamped in markup, with a usage count.
  const markup = new Map();
  for (const m of html.matchAll(/(data-spw-[a-z-]+)=/g)) {
    markup.set(m[1], (markup.get(m[1]) || 0) + 1);
  }

  // Population 2 — declared by a module as something it writes.
  const declared = new Map();
  for (const m of catalogs.matchAll(/'([a-z-]+):(data-spw-[a-z-]+)'/g)) {
    declared.set(m[2], m[1]);
  }

  // Population 3 — consumed. Both spellings, and the generated lens does not
  // count: it is emitted from the declarations, so letting it satisfy them
  // would make every declared attribute self-justifying.
  const lensMarker = 'legibility-lens';
  const cssWithoutLens = cssFiles
    .filter((f) => !f.includes(lensMarker));
  const cssReal = await readAll(cssWithoutLens);

  const isConsumed = (attr) => {
    const key = toDatasetKey(attr);
    return cssReal.includes(attr)
      || new RegExp(`dataset\\.${key}\\b`).test(js)
      || new RegExp(`['"\`]${attr}['"\`]`).test(js)
      || js.includes(`[${attr}]`);
  };

  const universe = new Set([...markup.keys(), ...declared.keys()]);
  const rows = [...universe].map((attr) => ({
    attr,
    uses: markup.get(attr) || 0,
    channel: declared.get(attr) || null,
    consumed: isConsumed(attr),
    exempt: ADDRESSED_ELSEWHERE.has(attr),
  }));

  const inert = rows.filter((r) => !r.consumed && !r.exempt).sort((a, b) => b.uses - a.uses);
  const stampedNotDeclared = rows.filter((r) => r.uses > 0 && !r.channel && !r.exempt);
  const declaredNotStamped = rows.filter((r) => r.channel && r.uses === 0);
  const exempt = rows.filter((r) => r.exempt);

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ inert, stampedNotDeclared, declaredNotStamped, exempt }, null, 2));
    return;
  }

  console.log(`${universe.size} attributes known — ${markup.size} stamped in markup, ${declared.size} declared by modules\n`);

  console.log(`INERT — written or stamped, read by nothing (${inert.length})`);
  if (!inert.length) console.log('  none');
  for (const r of inert.slice(0, 20)) {
    console.log(`  ${String(r.uses).padStart(5)} uses  ${r.attr}${r.channel ? `  [declared ${r.channel}]` : ''}`);
  }
  if (inert.length > 20) console.log(`  … and ${inert.length - 20} more`);

  console.log(`\nDECLARED BUT NEVER STAMPED — a module writes it, no markup carries it (${declaredNotStamped.length})`);
  for (const r of declaredNotStamped.slice(0, 10)) {
    console.log(`  ${r.attr}  [${r.channel}]`);
  }
  if (declaredNotStamped.length > 10) console.log(`  … and ${declaredNotStamped.length - 10} more`);

  console.log(`\nSTAMPED BUT UNDECLARED — in markup, no module claims it (${stampedNotDeclared.length})`);
  console.log(`ADDRESSED ELSEWHERE — for a person or a model, correctly unconsumed (${exempt.length})`);

  const inertUses = inert.reduce((sum, r) => sum + r.uses, 0);
  console.log(`\n${inertUses} markup uses sit behind attributes nothing reads.`);
  process.exitCode = 0;
}

main().catch((error) => {
  console.error('[inert-audit]', error);
  process.exitCode = 1;
});
