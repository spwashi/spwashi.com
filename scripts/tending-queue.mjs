#!/usr/bin/env node
/**
 * tending-queue — the next thing to tend, oldest first.
 *
 * Two kinds of surface are marked as tending and need to be taken up again:
 *
 *   audit  a .spw file marked #:operation #!audit and #:fixity #!tending
 *          (wherever it lives: audits, caches, reviews, skills). It was last
 *          tended on the latest date written in it, up to today; with none,
 *          the month in its name or the day git added it, shown as ≥.
 *          A folder audit is one item, its index.spw.
 *   plan   a live plan under .agents/plans/. It was last tended on its
 *          wip.spw's last dated entry, or its Status line when it has none.
 *
 * The queue is the order, not a file. Tending an item writes a date into
 * it, and that date sends it to the back. Nothing here goes stale on its own.
 *
 * Tending the head:
 *
 *   audit with a sensor   run it, compare with the numbers the audit
 *                         recorded, and add a dated line saying what
 *                         held and what moved.
 *   audit with none       read it against the tree; add a dated line, or
 *                         list it for cooling (fixity cold, operation
 *                         archive). Cooling is the creator's call, so the
 *                         queue marks the candidates and changes nothing.
 *   plan                  read the Status line against the tree, and add a
 *                         >>[date] entry and a fresh ^"cache" to wip.spw
 *                         (.spw/conventions/wip-notebook.spw).
 *
 * A sensor is an `npm run <name>` the file names that exists in
 * package.json and is not a site-wide gate (check:local, spw:integrity,
 * build…), since rerunning a gate does not tend one audit.
 *
 *   npm run tending:queue                    the head of the queue (12)
 *   npm run tending:queue -- --limit=0       all of it
 *   npm run tending:queue -- --kind=audit|plan
 *   npm run tending:queue -- --cool          only the cooling candidates
 *   npm run tending:queue -- --today=YYYY-MM-DD --cool-after=60 --json
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { planStatus, readWip } from './lib/plan-wip.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TREE = path.join(ROOT, '.spw');
const PLANS = path.join(ROOT, '.agents', 'plans');
const SKIP = new Set(['_workbench', 'gen']);

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const todayIso = option('today', new Date().toISOString().slice(0, 10));
const today = new Date(`${todayIso}T00:00:00Z`);
const limit = Number(option('limit', 12));
const kind = option('kind', null);
const coolAfter = Number(option('cool-after', 60));

const scripts = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts || {}));
const GATES = /^(?:check|check:[\w:-]+|build|build:[\w:-]+|typecheck|manifest(?::[\w-]+)?|spw:integrity|lsp|ecology:[\w-]+)$/;
const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');
const daysSince = (iso) => (iso ? Math.round((today - new Date(`${iso}T00:00:00Z`)) / 86400000) : null);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) out.push(...walk(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.spw')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const mark = (text, axis) => new RegExp(`^#:${axis} #!(\\w+)`, 'm').exec(text)?.[1]
  ?? new RegExp(`^${axis}\\s*=\\s*"(\\w+)"`, 'm').exec(text)?.[1]
  ?? null;

const queue = [];

/* When a file holds no date of its own: the month in its folder or file
   name, then the day git first saw it. Both are floors, so the item sorts
   no later than it should. */
function fallbackDate(file) {
  const month = /(20\d\d)-(0[1-9]|1[0-2])(?!-\d)/.exec(rel(file));
  if (month) return { iso: `${month[1]}-${month[2]}-01`, from: 'name' };
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--format=%cs', '--', rel(file)], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const created = out.trim().split('\n').filter(Boolean).at(-1);
    if (created) return { iso: created, from: 'added' };
  } catch { /* untracked: undated */ }
  return { iso: null, from: null };
}

if (kind !== 'plan') {
  const records = new Map();
  for (const file of walk(TREE)) {
    const text = fs.readFileSync(file, 'utf8');
    if (mark(text, 'operation') !== 'audit' || mark(text, 'fixity') !== 'tending') continue;
    const written = [...text.matchAll(/\b(20\d\d-\d\d-\d\d)\b/g)].map((m) => m[1]).filter((iso) => iso <= todayIso).sort().at(-1) ?? null;
    const fallback = written ? { iso: written, from: null } : fallbackDate(file);
    const sensors = [...new Set([...text.matchAll(/npm run(?: -s)? ([a-z0-9][a-z0-9:_-]*)/g)].map((m) => m[1]))]
      .filter((name) => scripts.has(name) && !GATES.test(name));
    records.set(file, { file, last: fallback.iso, from: fallback.from, sensors, members: 0 });
  }
  /* A folder audit is one item: its index.spw carries its members' dates and sensors. */
  for (const [file, record] of records) {
    if (path.basename(file) === 'index.spw') continue;
    const hub = records.get(path.join(path.dirname(file), 'index.spw'));
    if (!hub) continue;
    hub.members += 1;
    if (record.last && (!hub.last || record.last > hub.last)) Object.assign(hub, { last: record.last, from: record.from });
    hub.sensors = [...new Set([...hub.sensors, ...record.sensors])];
    records.delete(file);
  }
  for (const record of records.values()) {
    const age = daysSince(record.last);
    queue.push({
      kind: 'audit',
      path: rel(record.file),
      members: record.members,
      last: record.last,
      from: record.from,
      age,
      next: record.sensors.length ? `npm run ${record.sensors.slice(0, 2).join(', npm run ')}` : 'read against the tree',
      cool: !record.sensors.length && (age === null || age > coolAfter),
    });
  }
}

if (kind !== 'audit') {
  for (const entry of fs.readdirSync(PLANS, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'archive') continue;
    const dir = path.join(PLANS, entry.name);
    const status = planStatus(dir);
    const wip = readWip(dir, entry.name);
    const last = wip?.last ?? status?.date ?? null;
    const note = !wip ? 'write wip.spw' : wip.gate && wip.gate !== 'nothing' ? `gate: ${wip.gate}` : wip.next || 'refresh wip.spw';
    queue.push({
      kind: 'plan',
      path: rel(wip?.file ?? status?.file ?? dir),
      last,
      age: daysSince(last),
      status: wip?.status ?? null,
      next: note,
      cool: false,
    });
  }
}

/* Never-dated items first, then the oldest; ties by path so the order is stable. */
queue.sort((a, b) => (b.age ?? Infinity) - (a.age ?? Infinity) || a.path.localeCompare(b.path));

const shown = flag('cool') ? queue.filter((item) => item.cool) : queue;
const head = limit > 0 ? shown.slice(0, limit) : shown;
const audits = queue.filter((item) => item.kind === 'audit').length;
const plans = queue.length - audits;
const cooling = queue.filter((item) => item.cool).length;

if (flag('json')) {
  console.log(JSON.stringify({ today: todayIso, audits, plans, cooling, queue: head }, null, 2));
} else {
  const width = Math.min(76, Math.max(...head.map((item) => item.path.length + (item.members ? 14 : 0)), 4));
  for (const item of head) {
    const age = item.age === null ? 'undated' : `${item.from ? '≥' : ''}${item.age}d`;
    const status = item.status ? ` [${item.status}]` : '';
    const members = item.members ? ` (+${item.members} files)` : '';
    const cool = item.cool ? ' · cool?' : '';
    console.log(`${age.padStart(7)}  ${item.kind.padEnd(5)}  ${(item.path + members).padEnd(width)}  ${item.next}${status}${cool}`);
  }
  if (head.length < shown.length) console.log(`        … ${shown.length - head.length} more (--limit=0 for all)`);
  const top = shown[0];
  const headline = top ? ` · head ${top.path} (${top.age === null ? 'undated' : `${top.age}d`})` : '';
  console.log(`[tending:queue] ${audits} audits · ${plans} plans · ${cooling} cooling candidates${headline}`);
}
