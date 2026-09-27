#!/usr/bin/env node
/**
 * audit-copy-clock.mjs
 *
 * Copy that names a date speaks in a tense, and the tense goes wrong on a
 * schedule the author did not set. This reads every copy unit
 * (data-spw-copy-unit) on the authored routes and asks three things:
 *
 *   decayed   a <time datetime> in the unit is already past, and the unit
 *             still points at the present from it ("closes today", "next
 *             close", "coming soon", "this week"). The claim has decayed;
 *             the copy has not. A contract cue ("orders remain open") is
 *             never decayed by a date: it decays by a counter-receipt.
 *   undated   the unit uses a relative or contract cue but carries no
 *             <time>, so nothing can tell when it goes wrong. A dated claim
 *             wants a receipt.
 *   aging     the unit was last renewed (git blame on its opening line)
 *             more than --weeks ago and uses a tense cue. Not wrong yet;
 *             worth a look.
 *
 * Read with .spw/caches/copy-decay-2026-09.spw, which names the half-lives
 * this sensor measures against. Warn-only unless --check, which exits 1 on
 * decayed units.
 *
 *   node scripts/audit-copy-clock.mjs [--check] [--today=YYYY-MM-DD] [--weeks=6] [--route=/]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const check = args.includes('--check');
const today = new Date(`${flag('today', new Date().toISOString().slice(0, 10))}T12:00:00Z`);
const agingWeeks = Number(flag('weeks', '6'));
const onlyRoute = flag('route', '');

// Relative cues point at the present from a date and decay when the date passes.
// Contract cues promise an action and decay only by a counter-receipt (sold, closed),
// so they are never called decayed here, only undated when no <time> stands with them.
const RELATIVE = /\b(today|tonight|this (?:week|weekend|morning|evening)|next close|closes today|opens today|coming soon|later this (?:week|month))\b/i;
const CONTRACT = /\b(remains? open|still open|orders are open|closes? on|opens? on|through (?:mon|tues|wednes|thurs|fri|satur|sun)day)\b/i;
const SKIP = new Set(['node_modules', 'dist', 'dist-vite', 'public', 'scripts', 'workers', 'src', '00.unsorted', 'design']);

function listPages(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || SKIP.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) listPages(full, out);
    else if (name === 'index.html') out.push(full);
  }
  return out;
}

/** The unit's outer HTML: from its opening tag to the matching close of that tag. */
function unitHtml(html, at) {
  const tag = /^<([a-z][a-z0-9]*)/i.exec(html.slice(at))?.[1];
  if (!tag) return '';
  const open = new RegExp(`<${tag}\\b`, 'gi');
  const close = new RegExp(`</${tag}>`, 'gi');
  let depth = 0;
  let i = at;
  for (;;) {
    open.lastIndex = i;
    close.lastIndex = i;
    const o = open.exec(html);
    const c = close.exec(html);
    if (!c) return html.slice(at);
    if (o && o.index < c.index) { depth += 1; i = o.index + 1; continue; }
    depth -= 1;
    i = c.index + c[0].length;
    if (depth === 0) return html.slice(at, i);
  }
}

function blameDate(file, line) {
  try {
    const out = execFileSync('git', ['blame', '--line-porcelain', '-L', `${line},${line}`, file], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const seconds = Number(/^author-time (\d+)/m.exec(out)?.[1]);
    return Number.isFinite(seconds) ? new Date(seconds * 1000) : null;
  } catch {
    return null;
  }
}

const findings = [];
for (const file of listPages(ROOT)) {
  const rel = path.relative(ROOT, file);
  const route = `/${path.dirname(rel)}/`.replace('/./', '/');
  if (onlyRoute && route !== onlyRoute) continue;
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<[a-z][a-z0-9]*\b[^>]*\bdata-spw-copy-unit="([^"]+)"[^>]*>/gi)) {
    const unit = m[1];
    const outer = unitHtml(html, m.index);
    const text = outer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const dates = [...outer.matchAll(/<time[^>]*\bdatetime="(\d{4}-\d{2}-\d{2})/g)].map((d) => new Date(`${d[1]}T12:00:00Z`));
    const relative = RELATIVE.exec(text)?.[0];
    const cue = relative || CONTRACT.exec(text)?.[0];
    if (!cue) continue;
    const line = html.slice(0, m.index).split('\n').length;
    const renewed = blameDate(rel, line);
    const ageWeeks = renewed ? Math.floor((today - renewed) / (7 * 86400000)) : null;
    const latest = dates.length ? new Date(Math.max(...dates)) : null;
    const excerpt = text.slice(0, 110);
    if (relative && latest && latest < today) {
      findings.push({ kind: 'decayed', route, unit, line, cue, date: latest.toISOString().slice(0, 10), ageWeeks, excerpt });
    } else if (!dates.length) {
      findings.push({ kind: 'undated', route, unit, line, cue, ageWeeks, excerpt });
    } else if (ageWeeks !== null && ageWeeks > agingWeeks) {
      findings.push({ kind: 'aging', route, unit, line, cue, ageWeeks, excerpt });
    }
  }
}

const order = { decayed: 0, undated: 1, aging: 2 };
findings.sort((a, b) => order[a.kind] - order[b.kind] || a.route.localeCompare(b.route));
const counts = { decayed: 0, undated: 0, aging: 0 };
for (const f of findings) {
  counts[f.kind] += 1;
  const mark = f.kind === 'decayed' ? '✗' : f.kind === 'undated' ? '?' : '~';
  const age = f.ageWeeks === null ? 'unblamed' : `${f.ageWeeks}w since renewal`;
  console.log(`  ${mark} ${f.kind.padEnd(8)} ${f.route} ${f.unit}:${f.line} · "${f.cue}"${f.date ? ` after ${f.date}` : ''} · ${age}\n      ${f.excerpt}…`);
}
console.log(`[copy-clock] ${counts.decayed} decayed · ${counts.undated} undated · ${counts.aging} aging (>${agingWeeks}w), as of ${today.toISOString().slice(0, 10)}`);
if (check && counts.decayed) process.exit(1);
