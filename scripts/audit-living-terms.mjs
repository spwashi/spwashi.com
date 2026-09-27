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
 * Per concept this reports how many terms it has, on which routes, whether
 * any term carries a definition, and which anchors on the site could be its
 * home (an element with that id, or a card/section declaring the concept).
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
 *   node scripts/audit-living-terms.mjs [--check] [--top=20] [--json=out.json]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const check = args.includes('--check');
const top = Number(flag('top', '20'));
const jsonOut = flag('json', '');
const SKIP = new Set(['node_modules', 'dist', 'dist-vite', 'public', 'scripts', 'workers', 'src', '00.unsorted']);

function listPages(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || SKIP.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) listPages(full, out);
    else if (name === 'index.html') out.push(full);
  }
  return out;
}

const attr = (tag, name) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
const concepts = new Map();
const homes = new Map();
const lies = { affordance: [], nested: [], focusable: [] };
let termCount = 0;

for (const file of listPages(ROOT)) {
  const rel = path.relative(ROOT, file);
  const route = `/${path.dirname(rel)}/`.replace('/./', '/');
  const html = readFileSync(file, 'utf8');

  for (const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bdata-spw-living-term\b[^>]*>/g)) {
    const tag = m[0];
    const concept = attr(tag, 'data-spw-concept');
    if (!concept) continue;
    termCount += 1;
    const line = html.slice(0, m.index).split('\n').length;
    const entry = concepts.get(concept) || { concept, terms: 0, routes: new Set(), defined: 0, element: new Set() };
    entry.terms += 1;
    entry.routes.add(route);
    entry.element.add(m[1]);
    const title = attr(tag, 'title') || '';
    if (/^tap[: ]/i.test(title)) lies.affordance.push(`${route}:${line} ${concept} · title="${title.slice(0, 40)}…"`);
    else if (title) entry.defined += 1;
    if (m[1] === 'span' && /\btabindex="0"/.test(tag)) lies.focusable.push(`${route}:${line} ${concept}`);
    const before = html.slice(Math.max(0, m.index - 400), m.index);
    const lastOpen = before.lastIndexOf('<a ');
    const lastClose = before.lastIndexOf('</a>');
    if (lastOpen > lastClose) lies.nested.push(`${route}:${line} ${concept}`);
    concepts.set(concept, entry);
  }

  for (const id of new Set([...html.matchAll(/\bid="([a-z0-9-]+)"/g)].map((x) => x[1]))) {
    if (!homes.has(id)) homes.set(id, new Set());
    homes.get(id).add(`${route}#${id}`);
  }
  for (const m of html.matchAll(/<(?!span\b)[a-z]+\b[^>]*>/g)) {
    const tag = m[0];
    const concept = attr(tag, 'data-spw-concept');
    const id = attr(tag, 'id');
    if (concept && id && !/\bdata-spw-living-term\b/.test(tag)) {
      if (!homes.has(concept)) homes.set(concept, new Set());
      homes.get(concept).add(`${route}#${id}`);
    }
  }
}

const rows = [...concepts.values()].map((c) => ({
  concept: c.concept,
  terms: c.terms,
  routes: [...c.routes].sort(),
  defined: c.defined,
  homes: [...(homes.get(c.concept) || [])].sort(),
  elements: [...c.element].sort(),
})).sort((a, b) => b.terms - a.terms || a.concept.localeCompare(b.concept));

const living = rows.filter((r) => r.defined || r.homes.length);
const decorated = rows.filter((r) => !r.defined && !r.homes.length);
console.log(`[living-terms] ${termCount} terms · ${rows.length} concepts · ${living.length} living (a definition or a home) · ${decorated.length} decorated (neither)`);
console.log(`  homes: ${rows.filter((r) => r.homes.length).length} concepts could link somewhere · definitions: ${rows.filter((r) => r.defined).length} concepts carry one in a title`);
console.log(`\n  most-used decorated concepts (give each a definition or a home):`);
for (const r of decorated.slice(0, top)) console.log(`    ${r.concept.padEnd(26)} ×${String(r.terms).padEnd(3)} ${r.routes.slice(0, 3).join(' ')}${r.routes.length > 3 ? ' …' : ''}`);
console.log(`\n  concepts with a home, still authored as inert spans:`);
for (const r of rows.filter((x) => x.homes.length && !x.elements.includes('a')).slice(0, top)) console.log(`    ${r.concept.padEnd(26)} ×${String(r.terms).padEnd(3)} → ${r.homes[0]}${r.homes.length > 1 ? ` (+${r.homes.length - 1})` : ''}`);
for (const [kind, list] of Object.entries(lies)) {
  if (!list.length) continue;
  console.log(`\n  ${kind} (${list.length})${kind === 'affordance' ? ' — HTML promises what only the runtime does' : ''}:`);
  for (const line of list.slice(0, kind === 'focusable' ? 5 : 40)) console.log(`    ${line}`);
  if (list.length > (kind === 'focusable' ? 5 : 40)) console.log(`    … ${list.length - (kind === 'focusable' ? 5 : 40)} more`);
}
if (jsonOut) await writeFile(jsonOut, `${JSON.stringify({ termCount, rows, lies }, null, 2)}\n`);
if (check && lies.affordance.length) process.exit(1);
