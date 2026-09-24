#!/usr/bin/env node
/**
 * Group a dirty working tree into candidate commits by the history of each file.
 *
 * Each changed path is asked what its own last few commits were called. The
 * most frequent `[category]` among them is the suggestion, so a file that has
 * always landed as `[chrome]` groups with other chrome files rather than with
 * whatever its name happens to contain. Untracked files ask their nearest
 * tracked directory instead. Ties go to the most recent commit.
 *
 * Only the category is predicted. The symbol says what *this* change does
 * (`+` adds, `~` refines, `!fix` repairs), so history can only hint at it;
 * the symbols it used are listed beside each group.
 *
 * This is a proposal, not a staging plan. Other sessions commit to this tree;
 * a file in a group is not yours until you have read its diff.
 *
 * Usage:
 *   node .agents/skills/patch-consolidator/scripts/analyze-changes.mjs
 *   node .agents/skills/patch-consolidator/scripts/analyze-changes.mjs --json
 *   node .agents/skills/patch-consolidator/scripts/analyze-changes.mjs --depth 8
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const json = args.includes('--json');
const depthIndex = args.indexOf('--depth');
const depth = depthIndex >= 0 ? Number(args[depthIndex + 1]) || 5 : 5;

const PREFIX = /^(\S{0,8})\[([^\]\s]+)\]/;

const git = (...argv) => execFileSync('git', argv, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });

const root = git('rev-parse', '--show-toplevel').trim();
process.chdir(root);

/** @returns {{ file: string, state: string }[]} */
function changedFiles() {
  const out = git('status', '--porcelain=v1', '-z', '--untracked-files=all');
  const entries = out.split('\0').filter(Boolean);
  const files = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const x = entry[0];
    const y = entry[1];
    const file = entry.slice(3);
    if (x === 'R' || x === 'C') i += 1; // the next entry is the rename source
    const state = x === '?' ? 'untracked'
      : x !== ' ' && y !== ' ' ? 'partly staged'
      : x !== ' ' ? 'staged'
      : 'unstaged';
    files.push({ file, state });
  }
  return files;
}

/** @returns {{ symbol: string, category: string }[]} newest first */
function historyPrefixes(target) {
  const log = git('log', `-${depth}`, '--format=%s', '--', target);
  return log.split('\n')
    .map((line) => line.match(PREFIX))
    .filter(Boolean)
    .map((m) => ({ symbol: m[1], category: `[${m[2]}]` }));
}

function suggestPrefix(file, state) {
  let target = file;
  let prefixes = state === 'untracked' ? [] : historyPrefixes(target);
  while (!prefixes.length && target !== '.') {
    target = path.dirname(target);
    prefixes = historyPrefixes(target);
  }
  if (!prefixes.length) return { category: '(no history)', symbols: [], from: target, votes: 0, of: 0 };
  const counts = new Map();
  for (const p of prefixes) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  const [category, votes] = [...counts].sort((a, b) => b[1] - a[1])[0]; // stable: ties keep newest
  const symbols = [...new Set(prefixes.filter((p) => p.category === category).map((p) => p.symbol || '·'))];
  return { category, symbols, from: target, votes, of: prefixes.length };
}

const files = changedFiles();
if (!files.length) {
  console.log(json ? '[]' : 'No changes to analyze.');
  process.exit(0);
}

const groups = new Map();
for (const { file, state } of files) {
  const suggestion = suggestPrefix(file, state);
  const group = groups.get(suggestion.category) ?? [];
  group.push({ file, state, ...suggestion });
  groups.set(suggestion.category, group);
}

const ordered = [...groups].sort((a, b) => b[1].length - a[1].length);

if (json) {
  console.log(JSON.stringify(ordered.map(([category, entries]) => ({ category, entries })), null, 2));
  process.exit(0);
}

for (const [category, entries] of ordered) {
  const symbols = [...new Set(entries.flatMap((e) => e.symbols))].join(' ');
  console.log(`${category}  (${entries.length})${symbols ? `  symbols seen: ${symbols}` : ''}`);
  for (const e of entries) {
    const basis = e.from === e.file ? `${e.votes}/${e.of}` : `${e.votes}/${e.of} via ${e.from}/`;
    console.log(`  ${e.state.padEnd(13)} ${e.file}  [${basis}]`);
  }
  console.log('');
}
console.log(`${files.length} files, ${groups.size} candidate categories. Choose each symbol from what the change does. Read each diff before staging; a group is a proposal.`);
