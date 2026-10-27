#!/usr/bin/env node
/**
 * plan-twinkle — which concepts the live plans share, lit where one moved
 * after a plan that cites it last looked.
 *
 * The inquiry loop runs probe, then Spw update, then refactor, then test. When
 * a probe answers a wonder, or a convention or another plan changes, every
 * plan that cites it is holding an older reading. A reference twinkles when
 * its target moved after the citing plan's last dated look: its latest stream
 * entry that is not hygiene (a sweep across plans is not a look at a concept).
 *
 * A target moves when:
 *   a wonder    a stream line anywhere names its id                       bright ✦
 *   a plan      its Status line or its latest look is newer               bright ✦
 *   a file      git last committed it, or the working tree has it changed  dim ✧
 *
 * An archived plan does not move, and a folder citation is an address rather
 * than a concept: it shows when something under it last changed, and never
 * lights.
 *
 * A plan moves by what it says, not by its files: a sweep that renames a link
 * across forty plans moves none of them. Scaffolding that more than two thirds
 * of the plans cite (the wip convention, the plans root) is left out, since a
 * reference every plan carries tells no plan anything.
 *
 * References are read from every file in a live plan folder: ~"…" citations,
 * ~<"…"> neighbours, and relative Markdown links. A plan's own folder and the
 * mounted workbench are left out; the workbench moves by its pin, not by file.
 *
 *   npm run plans:twinkle                    headlines, the brightest shared concepts, then what to tend
 *   npm run plans:twinkle -- --plan <slug>   every concept one plan cites, lit or dark
 *   npm run plans:twinkle -- --json
 *
 * It reads and prints. Tending a lit reference is a plan's own stream entry,
 * written once the plan has looked.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { planStatus } from './lib/plan-wip.mjs';
import { siteToday } from './lib/site-clock.mjs';
import { parseWonders } from './wonder.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLANS = path.join(ROOT, '.agents', 'plans');
const WORKBENCH = path.join(ROOT, '.spw', '_workbench');
const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

const args = process.argv.slice(2);
const option = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : null);
const onlyPlan = option('plan');
const asJson = args.includes('--json');

const STAMP = />>\[(\d{4}-\d{2}-\d{2})[^\]]*\]\s+([a-z]+)/g;
const CITATION = /~<?"([^"]+)"/g;
const MD_LINK = /\]\((\.{1,2}\/[^)\s]+)\)/g;

/** The latest dated entry in a plan's notebook that is a look, not a sweep. */
export function lastLook(text = '') {
  let last = '';
  for (const [, date, type] of String(text).matchAll(STAMP)) {
    if (type !== 'hygiene' && date > last) last = date;
  }
  return last;
}

/** Each reference in a file, resolved to a repo path and an optional fragment. */
export function referencesIn(text, fromFile) {
  const out = [];
  const add = (raw) => {
    if (/^[a-z]+:\/\//i.test(raw) || raw.startsWith('#')) return;
    const [target, fragment = ''] = raw.split('#');
    const abs = target.startsWith('/') ? path.join(ROOT, target) : path.resolve(path.dirname(fromFile), target);
    out.push({ path: rel(abs).replace(/\/$/, ''), fragment });
  };
  for (const [, raw] of String(text).matchAll(CITATION)) add(raw);
  if (fromFile.endsWith('.md')) for (const [, raw] of String(text).matchAll(MD_LINK)) add(raw);
  return out;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === WORKBENCH || entry.name === 'archive' || entry.name === 'gen' || entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (/\.(spw|md)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** When each file last moved: its last commit since `since`, or today when the working tree has it modified. */
function moveDates(since) {
  const dates = new Map();
  const log = execFileSync('git', ['log', `--since=${since}`, '--format=@%cs', '--name-only'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  let date = '';
  for (const line of log.split('\n')) {
    if (line.startsWith('@')) date = line.slice(1);
    else if (line && !dates.has(line)) dates.set(line, date);
  }
  const today = siteToday();
  const status = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: ROOT, encoding: 'utf8' });
  for (const line of status.split('\n')) {
    const file = line.slice(3).split(' -> ').pop();
    if (file) dates.set(file, today);
  }
  return dates;
}

/** Wonder ids by the latest date a stream line names them, and the ones carrying an answer. */
function wonderMoves() {
  const moved = new Map();
  const settled = new Set();
  const files = [...walk(path.join(ROOT, '.spw')), ...walk(PLANS)].filter((file) => file.endsWith('.spw'));
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split('\n')) {
      const stamp = /^\s*>>\[(\d{4}-\d{2}-\d{2})/.exec(line);
      if (!stamp) continue;
      for (const id of line.match(/\b\w*wonder_\w+/g) || []) {
        if ((moved.get(id) || '') < stamp[1]) moved.set(id, stamp[1]);
      }
    }
    if (!text.includes('?[')) continue;
    for (const wonder of parseWonders(text, file)) {
      if (wonder.answer || wonder.retired) settled.add(wonder.id);
    }
  }
  return { moved, settled };
}

function main() {
  const slugs = fs.readdirSync(PLANS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive' && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();

  const plans = slugs.map((slug) => {
    const dir = path.join(PLANS, slug);
    const files = walk(dir);
    const wip = path.join(dir, 'wip.spw');
    const looked = fs.existsSync(wip) ? lastLook(fs.readFileSync(wip, 'utf8')) : '';
    const own = rel(dir);
    const refs = new Map();
    for (const file of files) {
      for (const ref of referencesIn(fs.readFileSync(file, 'utf8'), file)) {
        if (ref.path === own || ref.path.startsWith(`${own}/`) || ref.path.startsWith('.spw/_workbench')) continue;
        const wonder = /^\w*wonder_\w+$/.test(ref.fragment) ? ref.fragment : '';
        const key = wonder ? `${ref.path}#${wonder}` : ref.path;
        if (!refs.has(key)) refs.set(key, { path: ref.path, wonder });
      }
    }
    const status = planStatus(dir)?.date || '';
    return { slug, looked, moved: [status, looked].sort().at(-1), refs: [...refs.entries()].map(([key, ref]) => ({ key, ...ref })) };
  });
  const planOf = new Map(plans.map((plan) => [rel(path.join(PLANS, plan.slug)), plan]));
  const citedBy = new Map();
  for (const plan of plans) for (const ref of plan.refs) citedBy.set(ref.path, (citedBy.get(ref.path) || 0) + 1);
  const scaffolding = new Set([...citedBy].filter(([, n]) => n > (plans.length * 2) / 3).map(([target]) => target));
  for (const plan of plans) plan.refs = plan.refs.filter((ref) => !scaffolding.has(ref.path));

  const earliest = plans.map((plan) => plan.looked).filter(Boolean).sort()[0] || '2026-09-01';
  const dates = moveDates(earliest);
  const { moved, settled } = wonderMoves();
  const folderDate = new Map();
  const targetPlan = (ref) => {
    const hit = /^(\.agents\/plans\/[^/]+)/.exec(ref.path);
    return hit ? planOf.get(hit[1]) : null;
  };
  const isFolder = (ref) => !ref.wonder && !dates.has(ref.path) && !path.extname(ref.path);
  const movedAt = (ref) => {
    if (ref.wonder) return moved.get(ref.wonder) || '';
    if (ref.path.startsWith('.agents/plans/archive/')) return '';
    const other = targetPlan(ref);
    if (other) return other.moved;
    if (dates.has(ref.path)) return dates.get(ref.path);
    if (!folderDate.has(ref.path)) {
      let latest = '';
      for (const [file, date] of dates) if (file.startsWith(`${ref.path}/`) && date > latest) latest = date;
      folderDate.set(ref.path, latest);
    }
    return folderDate.get(ref.path);
  };

  const concepts = new Map();
  for (const plan of plans) {
    for (const ref of plan.refs) {
      ref.moved = movedAt(ref);
      ref.lit = Boolean(plan.looked && ref.moved && ref.moved > plan.looked) && !isFolder(ref);
      ref.bright = ref.lit && Boolean(ref.wonder || targetPlan(ref));
      ref.settled = Boolean(ref.wonder && settled.has(ref.wonder));
      if (!concepts.has(ref.key)) concepts.set(ref.key, { key: ref.key, moved: ref.moved, settled: ref.settled, bright: Boolean(ref.wonder || targetPlan(ref)), cited: [] });
      concepts.get(ref.key).cited.push({ slug: plan.slug, looked: plan.looked, lit: ref.lit });
    }
  }

  const shared = [...concepts.values()].filter((concept) => concept.cited.length > 1);
  const litPlans = plans.filter((plan) => plan.refs.some((ref) => ref.lit));
  const count = (plan, key) => plan.refs.filter((ref) => ref[key]).length;
  const brightRefs = plans.reduce((sum, plan) => sum + count(plan, 'bright'), 0);
  const dimRefs = plans.reduce((sum, plan) => sum + count(plan, 'lit'), 0) - brightRefs;
  const glyph = (ref) => (ref.bright ? '✦' : ref.lit ? '✧' : '·');

  if (asJson) {
    console.log(JSON.stringify({
      scaffolding: [...scaffolding],
      plans: plans.map(({ slug, looked, refs }) => ({ slug, looked, lit: refs.filter((ref) => ref.lit).map((ref) => ({ key: ref.key, moved: ref.moved, bright: ref.bright, settled: ref.settled })) })),
      shared,
    }, null, 2));
    return;
  }

  if (onlyPlan) {
    const plan = plans.find((entry) => entry.slug === onlyPlan);
    if (!plan) {
      console.error(`[plans:twinkle] no live plan named ${onlyPlan}`);
      process.exitCode = 1;
      return;
    }
    const rows = [...plan.refs].sort((a, b) => Number(b.bright) - Number(a.bright) || Number(b.lit) - Number(a.lit) || (b.moved || '').localeCompare(a.moved || ''));
    console.log(`${plan.slug} — last looked ${plan.looked || 'never'}; ${count(plan, 'bright')} bright and ${count(plan, 'lit') - count(plan, 'bright')} dim of ${rows.length} references`);
    for (const row of rows) {
      const others = concepts.get(row.key).cited.length - 1;
      console.log(`  ${glyph(row)} ${(row.moved || '—').padEnd(10)} ${row.key}${row.settled ? '  (answered)' : ''}${others ? `  · ${others} other plan${others === 1 ? '' : 's'}` : ''}`);
    }
    return;
  }

  const brightness = (concept) => concept.cited.filter((entry) => entry.lit).length;
  const brightest = shared.filter((concept) => brightness(concept) > 0)
    .sort((a, b) => Number(b.bright) - Number(a.bright) || brightness(b) - brightness(a) || (b.moved || '').localeCompare(a.moved || ''))
    .slice(0, 12);
  console.log(`plans:twinkle — the concepts plans share, lit where one moved after a citing plan last looked`);
  console.log(`${plans.length} plans cite ${concepts.size} concepts; ${shared.length} are shared by two or more plans; ${scaffolding.size} scaffolding surfaces left out`);
  console.log(`lit: ${brightRefs} bright (a wonder or a plan moved) and ${dimRefs} dim (a file changed) in ${litPlans.length} plans`);
  if (brightest.length) {
    console.log('');
    console.log('brightest shared concepts');
    for (const concept of brightest) {
      const lit = concept.cited.filter((entry) => entry.lit).map((entry) => entry.slug);
      console.log(`  ${concept.bright ? '✦' : '✧'} ${concept.key}${concept.settled ? '  (answered)' : ''}`);
      console.log(`      moved ${concept.moved} · lit for ${lit.length} of ${concept.cited.length}: ${lit.slice(0, 6).join(', ')}${lit.length > 6 ? ', …' : ''}`);
    }
  }
  const order = [...litPlans].sort((a, b) => count(b, 'bright') - count(a, 'bright') || count(b, 'lit') - count(a, 'lit'));
  console.log('');
  console.log(order.length
    ? `next: tend ${order.slice(0, 3).map((plan) => `${plan.slug} (${count(plan, 'bright')} bright, ${count(plan, 'lit') - count(plan, 'bright')} dim)`).join(', ')} first; npm run plans:twinkle -- --plan <slug> lists what moved under each.`
    : 'next: nothing a plan cites has moved since it last looked.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
