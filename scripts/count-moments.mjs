#!/usr/bin/env node
/**
 * count-moments.mjs — how far a November book has come.
 *
 * Reads a series under .spw/production/<series>/: each chapter file's
 * ^"chapter" facet (number, operator, name, target) and the backtick entries
 * of its ^"moments" list. One entry is one moment (line · …, panel · <slug> · …,
 * choice · … → … | …). Seeds do not count. Words are tallied beside moments
 * from the text after each entry's kind, and are not the goal.
 *
 *   npm run moments                      lore-land, judged against today
 *   npm run moments -- --series=lore-land --today=2026-11-08
 *
 * The goal and the month come from the series file's ^"count" and ^"calendar":
 * 50,000 moments across November, so the pace is goal × day / 30.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KINDS = ['line', 'panel', 'choice'];

const field = (text, name) => text.match(new RegExp(`^\\s*${name} = \`([^\`]*)\``, 'm'))?.[1] ?? '';

/** The moments a chapter file holds: [{ kind, text }], in order. */
export function readMoments(text) {
  const block = /\^"moments"\{[\s\S]*?\blist = #\[([\s\S]*?)\]\[reg=list\]/.exec(text)?.[1] ?? '';
  return [...block.matchAll(/`([^`]*)`/g)].map(([, entry]) => {
    const [kind, ...rest] = entry.split(' · ');
    return { kind: KINDS.includes(kind.trim()) ? kind.trim() : 'other', text: rest.join(' · ').trim() };
  });
}

/** Words in a moment: a panel's slug is not words, its caption is. */
export function wordsIn({ kind, text }) {
  const body = kind === 'panel' ? text.split(' · ').slice(1).join(' ') : text;
  return body.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

export function readChapter(text) {
  const moments = readMoments(text);
  return {
    slug: field(text, 'slug'),
    number: Number(field(text, 'number')),
    operator: field(text, 'operator'),
    name: field(text, 'name'),
    target: Number(field(text, 'target')) || 0,
    moments: moments.length,
    kinds: Object.fromEntries([...KINDS, 'other'].map((kind) => [kind, moments.filter((m) => m.kind === kind).length])),
    words: moments.reduce((sum, moment) => sum + wordsIn(moment), 0),
  };
}

/** Moments due by a date, if the month runs at an even pace from day 1 to day 30. */
export function paceFor(goal, today) {
  if (today.getFullYear() !== 2026 || today.getMonth() !== 10) return today < new Date(2026, 10, 1) ? 0 : goal;
  return Math.round((goal * Math.min(today.getDate(), 30)) / 30);
}

function main() {
  const args = process.argv.slice(2);
  const flag = (name, fallback) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
  const series = flag('series', 'lore-land');
  const todayArg = flag('today', '');
  const today = todayArg ? new Date(`${todayArg}T12:00:00`) : new Date();
  const dir = path.join(ROOT, '.spw/production', series);
  const seriesText = readFileSync(path.join(dir, 'series.spw'), 'utf8');
  const goal = Number(field(seriesText, 'goal')) || 50000;
  const chapters = readdirSync(dir)
    .filter((name) => /^ch\d+-.*\.spw$/.test(name))
    .map((name) => readChapter(readFileSync(path.join(dir, name), 'utf8')))
    .sort((a, b) => a.number - b.number);

  const total = chapters.reduce((sum, chapter) => sum + chapter.moments, 0);
  const words = chapters.reduce((sum, chapter) => sum + chapter.words, 0);
  const due = paceFor(goal, today);
  const fmt = (n) => n.toLocaleString('en-US');

  console.log(`[moments] ${series} · ${fmt(total)} of ${fmt(goal)} moments (${((total / goal) * 100).toFixed(1)}%) · ${fmt(words)} words · ${chapters.length} chapters`);
  for (const c of chapters) {
    const mix = KINDS.filter((kind) => c.kinds[kind]).map((kind) => `${c.kinds[kind]} ${kind}`).join(', ');
    console.log(`  ${String(c.number).padStart(2, '0')} ${c.operator.padEnd(2)} ${c.name.padEnd(12)} ${fmt(c.moments).padStart(6)} / ${fmt(c.target)}${mix ? `  ${mix}` : ''}${c.kinds.other ? `  ${c.kinds.other} unkinded` : ''}`);
  }
  const gap = total - due;
  console.log(`pace      ${today.toISOString().slice(0, 10)}: ${fmt(due)} due by an even month; ${gap >= 0 ? `ahead by ${fmt(gap)}` : `behind by ${fmt(-gap)}`}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
