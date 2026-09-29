#!/usr/bin/env node
/**
 * audit-living-terms.mjs
 *
 * A living term is a word in prose that carries a concept
 * (data-spw-living-term + data-spw-concept). It is living when the markup
 * alone honours it: a definition in title, or a home the concept can be
 * followed to. The runtime deepens that — inspect note, gather, carried
 * intent — and may not be the only thing that makes the word do anything.
 *
 * The reading lives in scripts/lib/living-terms.mjs (the one reader of
 * terms); this file prints it. Per concept: how many terms, on which routes,
 * whether any term carries a definition, which anchors could be its home.
 * It also names two lies and one smell:
 *
 *   affordance  a term whose HTML title advertises tap/hold/double-click.
 *               With scripts off that title is false; with scripts on the
 *               runtime writes one anyway. --check fails on these.
 *   nested      a term inside an <a> or a chip, which can never become a
 *               link of its own.
 *   focusable   a <span> term that authors tabindex; the runtime adds focus
 *               when it mounts, and a span that does nothing should not sit
 *               in the Tab order without it.
 *
 * And three counts: waiting (a term with no concept yet, counted by absence
 * only), note depth (how many of recognition/adjacent/contrast/practice/
 * wonder a term fills), reach (routes a concept renders on, partials
 * counted on every route that includes them).
 *
 * --batch prints a worksheet: the n-th batch of decorated concepts by use
 * (ties to wider reach, then name),
 * each with every sentence it lives in and its route#host. Facts only; the
 * words it waits for are the creator's.
 *
 *   node scripts/audit-living-terms.mjs [--check] [--top=20] [--json[=out.json]]
 *   node scripts/audit-living-terms.mjs --batch 1 [--size 7] [--json]
 */
import { writeFile } from 'node:fs/promises';
import process from 'node:process';

import {
  batchWorksheet,
  DEFAULT_BATCH_SIZE,
  NOTE_FIELDS,
  partialName,
  reachHistogram,
  readLivingTerms,
} from './lib/living-terms.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const eq = args.find((arg) => arg.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const at = args.indexOf(`--${name}`);
  if (at >= 0 && args[at + 1] && !args[at + 1].startsWith('--')) return args[at + 1];
  return at >= 0 ? true : fallback;
};
const check = args.includes('--check');
const top = Number(flag('top', '20'));
const json = flag('json', '');
const batchArg = flag('batch', '');
const size = Number(flag('size', String(DEFAULT_BATCH_SIZE))) || DEFAULT_BATCH_SIZE;

const report = readLivingTerms({ root: process.cwd() });
const { terms, concepts: rows, waiting, lies, depthHistogram } = report;

if (batchArg) {
  const n = Math.max(1, Number(batchArg === true ? 1 : batchArg) || 1);
  const sheet = batchWorksheet(report, n, size);
  if (json) {
    const text = `${JSON.stringify(sheet, null, 2)}\n`;
    if (json === true) process.stdout.write(text);
    else await writeFile(json, text);
  }
  if (json !== true) printBatch(sheet);
} else if (json === true) {
  // exitCode, not exit(): a piped stdout must drain before the process ends.
  process.stdout.write(`${JSON.stringify({ termCount: terms.length, rows, lies, waiting, depthHistogram, terms }, null, 2)}\n`);
} else {
  await printReport();
}
// --check holds in every mode: a batch worksheet does not excuse a lie.
if (check && lies.affordance.length) {
  process.exitCode = 1;
  if (batchArg || json === true) console.error(`[living-terms] --check: ${lies.affordance.length} affordance lie${lies.affordance.length === 1 ? '' : 's'} (run without --batch/--json to list)`);
}

async function printReport() {

  const living = rows.filter((r) => r.living);
  const decorated = rows.filter((r) => !r.living);
  const partialTerms = terms.filter((t) => partialName(t.route));
  console.log(`[living-terms] ${terms.length} terms · ${rows.length} concepts · ${living.length} living (a definition or a home) · ${decorated.length} decorated (neither)`);
  console.log(`  homes: ${rows.filter((r) => r.homes.length).length} concepts could link somewhere · definitions: ${rows.filter((r) => r.defined).length} concepts carry one in a title`);
  console.log(`  sources: ${report.sources} (route pages + _partials; ignored generated pages are not read) · ${partialTerms.length} terms authored in partials`);
  console.log(`  waiting: ${waiting.length} term${waiting.length === 1 ? '' : 's'} with no data-spw-concept`);
  for (const t of waiting.slice(0, top)) console.log(`    ${t.route}:${t.line} ${t.element} «${t.text.slice(0, 40)}»`);
  const inherited = terms.filter((t) => t.wonderFrom === 'ancestor').length;
  const fromIncluder = terms.filter((t) => t.wonderFrom === 'includer').length;
  console.log(`  note depth (${NOTE_FIELDS.join('/')} filled, as rendered): ${depthHistogram.map((count, depth) => `${depth}:${count}`).join(' · ')}${inherited ? ` — wonder inherited from an ancestor on ${inherited}` : ''}${fromIncluder ? `, from the including route on ${fromIncluder} partial term${fromIncluder === 1 ? '' : 's'}` : ''}`);
  for (const t of partialTerms.filter((x) => x.renderedDepths && Object.keys(x.renderedDepths).length > 1)) {
    console.log(`    ${t.route}:${t.line} ${t.concept} depth by including route: ${Object.entries(t.renderedDepths).map(([d, n]) => `${d} on ${n}`).join(' · ')}`);
  }
  console.log(`  reach (routes a concept renders on → concepts): ${reachHistogram(rows).map(([reach, count]) => `${reach}→${count}`).join(' · ')}`);

  console.log(`\n  most-used decorated concepts (give each a definition or a home):`);
  for (const r of decorated.slice(0, top)) console.log(`    ${r.concept.padEnd(26)} ×${String(r.terms).padEnd(3)} ${r.routes.slice(0, 3).join(' ')}${r.routes.length > 3 ? ' …' : ''}`);
  console.log(`\n  widest reach (routes rendered on):`);
  for (const r of [...rows].sort((a, b) => b.reach - a.reach || b.terms - a.terms || a.concept.localeCompare(b.concept)).slice(0, Math.min(top, 7))) {
    console.log(`    ${r.concept.padEnd(26)} reach ${String(r.reach).padEnd(4)} ×${String(r.terms).padEnd(3)} ${r.living ? 'living' : 'decorated'} · depth ${r.depth}`);
  }
  console.log(`\n  concepts with a home, still authored as inert spans:`);
  for (const r of rows.filter((x) => x.homes.length && !x.elements.includes('a')).slice(0, top)) console.log(`    ${r.concept.padEnd(26)} ×${String(r.terms).padEnd(3)} → ${r.homes[0]}${r.homes.length > 1 ? ` (+${r.homes.length - 1})` : ''}`);
  for (const [kind, list] of Object.entries(lies)) {
    if (!list.length) continue;
    const cap = kind === 'focusable' ? 5 : 40;
    console.log(`\n  ${kind} (${list.length})${kind === 'affordance' ? ' — HTML promises what only the runtime does' : ''}:`);
    for (const line of list.slice(0, cap)) console.log(`    ${line}`);
    if (list.length > cap) console.log(`    … ${list.length - cap} more`);
  }
  if (typeof json === 'string' && json) await writeFile(json, `${JSON.stringify({ termCount: terms.length, rows, lies, waiting, depthHistogram, terms }, null, 2)}\n`);
}

function printBatch(sheet) {
  const first = (sheet.batch - 1) * sheet.size + 1;
  if (!sheet.concepts.length) {
    console.log(`[living-terms] batch ${sheet.batch} is past the last (${sheet.batches} batches of ${sheet.size} over ${sheet.decorated} decorated concepts)`);
    return;
  }
  console.log(`[living-terms] batch ${sheet.batch} of ${sheet.batches} · decorated concepts ${first}–${first + sheet.concepts.length - 1} of ${sheet.decorated}, most used first`);
  for (const c of sheet.concepts) {
    console.log(`\n  ${c.concept} ×${c.terms} · reach ${c.reach}`);
    for (const use of c.uses) {
      console.log(`    ${use.anchor}  (${use.element}, line ${use.line}${use.expression ? ` · ${use.expression}` : ''}${use.depth ? ` · depth ${use.depth}` : ''})  «${use.text}»`);
      console.log(`      ${use.sentence}`);
    }
  }
}
