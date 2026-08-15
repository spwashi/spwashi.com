/**
 * Compare the anatomy the HTML actually has against what the .spw corpus says.
 *
 * The routes carry a detailed structural vocabulary — hero slots, toplines,
 * sigils, actions — and the corpus describes operators, registers and surfaces.
 * Nothing has ever put the two side by side, so the site's anatomy and the
 * site's theory have been free to drift without either noticing.
 *
 * Three questions, and the third is the one worth running:
 *
 *   sitewide    how often the markup uses a structure
 *   opening     how many routes carry it in their first frame
 *   surfaces    how many corpus surfaces reason about it
 *
 * Thin corpus coverage is not automatically a defect — a structure that exists
 * for layout reasons does not need a theory. But a structure carrying many
 * pages while appearing on one surface or none is load-bearing and
 * undescribed, which is exactly the case where a later change has nothing to
 * check itself against.
 *
 * Slot population is reported separately because it answers a different
 * question: a slot that is declared, styled, and empty is an affordance the
 * site built and then did not use. That is where the compelling-landing-page
 * problem turned out to live — `data-spw-slot="actions"` is used 154 times
 * across the site and appears in 3 of 138 heroes.
 *
 * Usage:
 *   node scripts/spw-anatomy-audit.mjs             # report
 *   node scripts/spw-anatomy-audit.mjs --json      # machine-readable
 *   node scripts/spw-anatomy-audit.mjs --region hero
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPW = path.join(ROOT, '.spw');

/** Build output is not authored markup. */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.spw', 'coverage', '.claude',
  'dist', 'dist-vite', 'build', '.vite', '.next', 'out',
]);

/**
 * The structural vocabulary a page is assembled from. Class-based and
 * attribute-based both count — the site uses each, and an audit that saw only
 * one would report a false absence.
 */
const ANATOMY = Object.freeze({
  hero: /class="[^"]*\bsite-hero\b/g,
  'hero:split-figure': /class="[^"]*\bsite-hero--split-figure\b/g,
  'slot:header': /data-spw-slot="header"/g,
  'slot:body': /data-spw-slot="body"/g,
  'slot:figure': /data-spw-slot="figure"/g,
  'slot:actions': /data-spw-slot="actions"/g,
  topline: /class="[^"]*\bframe-topline\b/g,
  sigil: /class="[^"]*\bframe-sigil\b/g,
  note: /class="[^"]*\bframe-note\b/g,
  heading: /class="[^"]*\bframe-heading\b/g,
  grid: /class="[^"]*\bframe-grid\b/g,
  cluster: /data-spw-cluster="/g,
  brace: /data-spw-form="brace"/g,
  expression: /data-spw-semantic-expression="/g,
  operator: /data-spw-operator="/g,
  seed: /data-spw-seed="/g,
});

async function walkHtml(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(full, out);
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

async function walkSpw(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '_workbench' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkSpw(full, out);
    else if (entry.name.endsWith('.spw')) out.push(full);
  }
  return out;
}

/** The opening frame of a route — the de facto hero, whatever it is called. */
function openingFrame(source) {
  const main = source.indexOf('<main');
  if (main < 0) return '';
  const rest = source.slice(main);
  const end = rest.indexOf('</section>');
  return end < 0 ? rest.slice(0, 4000) : rest.slice(0, end);
}

function countAll(source) {
  const counts = {};
  for (const [name, re] of Object.entries(ANATOMY)) {
    counts[name] = (source.match(re) || []).length;
  }
  return counts;
}

async function main() {
  const wantJson = process.argv.includes('--json');
  const regionArg = process.argv.indexOf('--region');
  const region = regionArg > -1 ? process.argv[regionArg + 1] : null;

  const [htmlFiles, spwFiles] = await Promise.all([walkHtml(ROOT), walkSpw(SPW)]);
  const spwSources = await Promise.all(spwFiles.map(async (f) => ({
    file: path.relative(SPW, f),
    text: await readFile(f, 'utf8').catch(() => ''),
  })));

  const sitewide = {};
  const inOpening = {};
  let routes = 0;
  let heroes = 0;
  const heroMissingActions = [];

  for (const file of htmlFiles) {
    const source = await readFile(file, 'utf8').catch(() => '');
    if (!source) continue;
    routes += 1;

    const all = countAll(source);
    for (const [k, v] of Object.entries(all)) sitewide[k] = (sitewide[k] || 0) + v;

    const opening = openingFrame(source);
    const open = countAll(opening);
    for (const [k, v] of Object.entries(open)) inOpening[k] = (inOpening[k] || 0) + (v > 0 ? 1 : 0);

    if (open.hero > 0) {
      heroes += 1;
      if (open['slot:actions'] === 0) heroMissingActions.push(path.relative(ROOT, file));
    }
  }

  /**
   * How deeply the corpus describes each structure, counted in surfaces rather
   * than as a boolean.
   *
   * A yes/no column reads `yes` for everything, because words like "body" and
   * "grid" appear incidentally in prose about something else. Surface count
   * separates a structure the corpus actually reasons about from one it happens
   * to have said once — which is the difference that matters when deciding
   * whether a change has anything to check itself against.
   */
  const declared = {};
  for (const name of Object.keys(ANATOMY)) {
    const term = name.split(':').pop();
    const re = new RegExp(`\\b${term}\\b`, 'i');
    declared[name] = spwSources.filter(({ text }) => re.test(text)).length;
  }

  const rows = Object.keys(ANATOMY).map((name) => ({
    name,
    sitewide: sitewide[name] || 0,
    routes: inOpening[name] || 0,
    declared: declared[name],
  }));

  if (wantJson) {
    console.log(JSON.stringify({ routes, heroes, rows, heroMissingActions }, null, 2));
    return;
  }

  if (region === 'hero') {
    console.log(`${heroes} of ${routes} routes open with a hero\n`);
    console.log(`heroes with no actions slot: ${heroMissingActions.length}`);
    for (const f of heroMissingActions.slice(0, 15)) console.log(`  ${f}`);
    if (heroMissingActions.length > 15) console.log(`  … and ${heroMissingActions.length - 15} more`);
    return;
  }

  console.log(`${routes} routes, ${spwFiles.length} corpus surfaces\n`);
  console.log('anatomy                 sitewide   opening   surfaces');
  for (const r of rows.sort((a, b) => b.sitewide - a.sitewide)) {
    console.log(
      `  ${r.name.padEnd(20)} ${String(r.sitewide).padStart(7)}   ${String(r.routes).padStart(7)}   ${r.declared === 0 ? 'NONE' : String(r.declared)}`
    );
  }

  const undescribed = rows.filter((r) => r.declared <= 1 && r.sitewide > 0).sort((a, b) => b.sitewide - a.sitewide);
  if (undescribed.length) {
    console.log('\nTHIN IN THE CORPUS — heavily used in markup, reasoned about on at most one surface');
    for (const r of undescribed) console.log(`  ${String(r.sitewide).padStart(6)} uses  ${r.name}`);
  }

  console.log(`\nslot population — heroes: ${heroes}, of which ${heroes - heroMissingActions.length} carry an actions slot`);
  console.log('  run with --region hero to list the routes without one');
}

main().catch((error) => {
  console.error('[anatomy-audit]', error);
  process.exitCode = 1;
});
