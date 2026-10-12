#!/usr/bin/env node
/**
 * audit-plans — what each live plan claims, checked against the tree.
 *
 * A plan drifts in a few predictable ways: its Status goes stale, a link
 * follows a file that moved, a validation step names a script that is gone,
 * a path it names was renamed, a commit it cites was never in this history.
 * The 2026-10-10 review found all five by reading. This reads them.
 *
 *   hard   a relative link in the plan folder resolves to nothing; an
 *          `npm run <name>` names no script; a live folder has no PLAN.md
 *          or FIX.md. Each is an instruction that cannot be followed.
 *   warn   no dated Status line, or one older than --stale days; a repo path
 *          named in PLAN.md or FIX.md that does not exist (it may be
 *          history, so a line that says a file is proposed, never written,
 *          renamed or gone is skipped); a cited commit in neither this repo
 *          nor the workbench;
 *          `npm run check`, which runs npm audit before check:local; no
 *          wip.spw, a wip.spw whose last dated entry is older than the
 *          Status line, or one missing a required header mark
 *          (.spw/conventions/wip-notebook.spw).
 *
 * Live plans are the folders under .agents/plans/ outside archive/. Fenced
 * code blocks are examples and are not read for links or paths. A gitignored
 * target counts as present (built or local-only), as in spw:integrity.
 *
 *   npm run audit:plans                     headline on green, findings otherwise
 *   npm run audit:plans -- --check          exit 1 on any hard finding
 *   npm run audit:plans -- --slug=<slug>    one plan
 *   npm run audit:plans -- --today=YYYY-MM-DD --stale=21
 *   npm run audit:plans -- --json
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isGitIgnored } from './lib/git-ignored.mjs';
import { readWip } from './lib/plan-wip.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLANS = path.join(ROOT, '.agents', 'plans');
const WORKBENCH = path.join(ROOT, '.spw', '_workbench');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const today = new Date(`${option('today', new Date().toISOString().slice(0, 10))}T00:00:00Z`);
const staleDays = Number(option('stale', 21));
const onlySlug = option('slug', null);

const scripts = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts || {}));
const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

const exists = (abs) => {
  if (fs.existsSync(abs)) return true;
  const relative = rel(abs);
  return !relative.startsWith('..') && isGitIgnored(relative, { cwd: ROOT });
};

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(md|spw)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Lines outside fenced code blocks, with their 1-based numbers. */
function proseLines(text) {
  const out = [];
  let fenced = false;
  text.split('\n').forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return;
    }
    if (!fenced) out.push([index + 1, line]);
  });
  return out;
}

const LINK = /\]\(((?:\.\.?\/)[^)\s#]*)|~<?"((?:\.\.?\/)[^"#]*)"/g;
const NPM = /npm run(?: -s)? ([a-z0-9][a-z0-9:_-]*)/g;
const PATH_ROOTS = 'public|scripts|workers|\\.spw|\\.agents|\\.vscode|design|topics|about|settings|now|_partials|play|tools|curriculum|services|projects';
const PATH = new RegExp(`\`((?:\\./)?(?:${PATH_ROOTS})/[^\\s\`*<>{}…|]+)\``, 'g');
const COMMIT = /(?<![\w./#-])([0-9a-f]{7,12})(?![\w-])/g;
const STATUS = /^\*\*Status (\d{4}-\d{2}-\d{2})\.\*\*/m;
/* A line that already says a file is proposed or gone is not drift. */
const ACKNOWLEDGED = /\[NEW|\(proposed|\bproposed\b|\bplanned\b|\bnever (?:written|built|started|landed)|\bnot (?:built|written|started)(?: yet)?\b|\bunbuilt\b|\bdo(?:es)? not exist|\bno longer\b|\bremoved\b|\bdeleted\b|\brenamed\b|\bsplit into\b|\bmoved to\b|\blanded as\b|\bis gone|\bare gone|\bretired\b|\boptional\b|\bcandidates?\b|\bscaffold\b|\bdeliverable\b|\bnext slice\b|\bwould (?:create|add|read|write)|\(new\)/i;

const plans = fs.readdirSync(PLANS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
  .map((entry) => entry.name)
  .filter((slug) => !onlySlug || slug === onlySlug)
  .sort();

const findings = [];
const cited = new Map();
const add = (slug, file, line, level, message) => findings.push({ slug, file: rel(file), line, level, message });

const statusAges = [];

for (const slug of plans) {
  const dir = path.join(PLANS, slug);
  const docName = ['PLAN.md', 'FIX.md'].find((name) => fs.existsSync(path.join(dir, name)));
  if (!docName) {
    add(slug, dir, 1, 'hard', 'live folder with no PLAN.md or FIX.md');
    continue;
  }
  const doc = path.join(dir, docName);
  const docText = fs.readFileSync(doc, 'utf8');

  const status = STATUS.exec(docText);
  if (!status) {
    add(slug, doc, 1, 'warn', 'no dated **Status YYYY-MM-DD.** line');
  } else {
    const days = Math.round((today - new Date(`${status[1]}T00:00:00Z`)) / 86400000);
    statusAges.push([slug, days]);
    if (days > staleDays) add(slug, doc, docText.slice(0, status.index).split('\n').length, 'warn', `Status is ${days} days old (${status[1]})`);
  }

  const wip = readWip(dir, slug);
  if (!wip) add(slug, doc, 1, 'warn', 'no wip.spw beside it (.spw/conventions/wip-notebook.spw)');
  else {
    if (wip.gaps.length) add(slug, wip.file, 1, 'warn', `wip.spw lacks ${wip.gaps.join(', ')}`);
    if (!wip.last) add(slug, wip.file, 1, 'warn', 'wip.spw has no dated stream entry');
    else if (status && wip.last < status[1]) add(slug, wip.file, 1, 'warn', `wip.spw last tended ${wip.last}, before the Status line (${status[1]})`);
  }

  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const [number, line] of proseLines(text)) {
      for (const match of line.matchAll(LINK)) {
        const target = match[1] || match[2];
        if (!exists(path.resolve(path.dirname(file), target))) add(slug, file, number, 'hard', `link resolves to nothing: ${target}`);
      }
      for (const match of line.matchAll(NPM)) {
        const name = match[1];
        if (name === 'check') add(slug, file, number, 'warn', '`npm run check` runs npm audit first; validation should say check:local');
        else if (!scripts.has(name) && !ACKNOWLEDGED.test(line)) add(slug, file, number, 'hard', `npm run ${name}: no such script in package.json`);
      }
    }
  }

  /* A list under a line that ends "…proposal:" or "…candidates:" is proposals, until a blank line. */
  let proposalList = false;
  for (const [number, line] of proseLines(docText)) {
    if (!line.trim()) proposalList = false;
    const skip = proposalList || ACKNOWLEDGED.test(line);
    if (/\b(?:proposals?|candidates?)\b[^:]*:\s*$/i.test(line)) proposalList = true;
    for (const match of skip ? [] : line.matchAll(PATH)) {
      const named = match[1].replace(/[.,;:)]+$/, '').replace(/:\d+(?:-\d+)?$/, '').split('#')[0];
      if (named.includes('..')) continue;
      if (!exists(path.join(ROOT, named))) add(slug, doc, number, 'warn', `named path does not exist: ${named}`);
    }
    for (const match of line.matchAll(COMMIT)) {
      const hash = match[1];
      if (!/[0-9]/.test(hash) || !/[a-f]/.test(hash)) continue;
      if (/(?:claude|codex|grok|gemini|gpt|session|agent)[\s:#-]*$/i.test(line.slice(0, match.index))) continue;
      if (!cited.has(hash)) cited.set(hash, []);
      cited.get(hash).push({ slug, file: doc, line: number });
    }
  }
}

/** One git process per repository answers every cited hash. */
function knownCommits(repo, hashes) {
  if (!hashes.length || !fs.existsSync(repo)) return new Set();
  try {
    const out = execFileSync('git', ['cat-file', '--batch-check'], {
      cwd: repo,
      input: hashes.map((hash) => `${hash}^{commit}`).join('\n'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const known = new Set();
    out.trim().split('\n').forEach((row, index) => {
      if (!row.endsWith('missing')) known.add(hashes[index]);
    });
    return known;
  } catch {
    return new Set();
  }
}

const hashes = [...cited.keys()];
const inSite = knownCommits(ROOT, hashes);
const inWorkbench = knownCommits(WORKBENCH, hashes.filter((hash) => !inSite.has(hash)));
for (const [hash, places] of cited) {
  if (inSite.has(hash) || inWorkbench.has(hash)) continue;
  for (const place of places) add(place.slug, place.file, place.line, 'warn', `cited commit ${hash} is in neither this repo nor the workbench`);
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
const hard = findings.filter((f) => f.level === 'hard');
const warn = findings.filter((f) => f.level === 'warn');
const oldest = statusAges.sort((a, b) => b[1] - a[1])[0];

if (flag('json')) {
  console.log(JSON.stringify({ plans: plans.length, hard: hard.length, warn: warn.length, findings }, null, 2));
} else {
  const bySlug = new Map();
  for (const f of findings) {
    if (!bySlug.has(f.slug)) bySlug.set(f.slug, []);
    bySlug.get(f.slug).push(f);
  }
  for (const [slug, rows] of bySlug) {
    const h = rows.filter((r) => r.level === 'hard').length;
    console.log(`${slug} — ${h} hard, ${rows.length - h} warn`);
    for (const r of rows) console.log(`${r.file}:${r.line}: ${r.level} ${r.message}`);
    console.log('');
  }
  const age = oldest ? ` · oldest Status ${oldest[1]}d (${oldest[0]})` : '';
  console.log(`[audit:plans] ${plans.length} plans · ${hard.length} hard · ${warn.length} warn${age}`);
}

if (flag('check') && hard.length) process.exitCode = 1;
