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
 * 50,000 moments across November, so the pace is goal × day / 30. A series named
 * in ^"count" shares (e.g. post-nut-clarity) adds its episode files' moments
 * (e<n>-*.spw) to the same goal; it keeps its own title and is reported apart.
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

/** How many moments, of which kinds, and how many words they carry. */
function tally(moments) {
  return {
    moments: moments.length,
    kinds: Object.fromEntries([...KINDS, 'other'].map((kind) => [kind, moments.filter((m) => m.kind === kind).length])),
    words: moments.reduce((sum, moment) => sum + wordsIn(moment), 0),
  };
}

export function readChapter(text) {
  return {
    slug: field(text, 'slug'),
    number: Number(field(text, 'number')),
    operator: field(text, 'operator'),
    name: field(text, 'name'),
    target: Number(field(text, 'target')) || 0,
    ...tally(readMoments(text)),
  };
}

/** A series that shares the goal: its title, and the moments of its episode files. */
export function readSharedSeries(dir) {
  const episodes = readdirSync(dir).filter((name) => /^e\d+-.*\.spw$/.test(name));
  return {
    slug: path.basename(dir),
    title: field(readFileSync(path.join(dir, 'series.spw'), 'utf8'), 'title'),
    episodes: episodes.length,
    ...tally(episodes.flatMap((name) => readMoments(readFileSync(path.join(dir, name), 'utf8')))),
  };
}

/** The series slugs a series file's ^"count" shares its goal with. */
export const sharesOf = (seriesText) => field(seriesText, 'shares').split(/[\s,]+/).filter(Boolean);

const localDate = (d) => [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, '0')).join('-');

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

  const shared = sharesOf(seriesText).map((slug) => readSharedSeries(path.join(ROOT, '.spw/production', slug)));

  const total = [...chapters, ...shared].reduce((sum, part) => sum + part.moments, 0);
  const words = [...chapters, ...shared].reduce((sum, part) => sum + part.words, 0);
  const due = paceFor(goal, today);
  const fmt = (n) => n.toLocaleString('en-US');

  console.log(`[moments] ${series} · ${fmt(total)} of ${fmt(goal)} moments (${((total / goal) * 100).toFixed(1)}%) · ${fmt(words)} words · ${chapters.length} chapters`);
  for (const c of chapters) {
    const mix = KINDS.filter((kind) => c.kinds[kind]).map((kind) => `${c.kinds[kind]} ${kind}`).join(', ');
    console.log(`  ${String(c.number).padStart(2, '0')} ${c.operator.padEnd(2)} ${c.name.padEnd(12)} ${fmt(c.moments).padStart(6)} / ${fmt(c.target)}${mix ? `  ${mix}` : ''}${c.kinds.other ? `  ${c.kinds.other} unkinded` : ''}`);
  }
  for (const s of shared) {
    const mix = KINDS.filter((kind) => s.kinds[kind]).map((kind) => `${s.kinds[kind]} ${kind}`).join(', ');
    console.log(`  shares the goal: ${s.title} · ${fmt(s.moments)} moments in ${s.episodes} episode${s.episodes === 1 ? '' : 's'}${mix ? `  ${mix}` : ''}${s.kinds.other ? `  ${s.kinds.other} unkinded` : ''}`);
  }
  const gap = total - due;
  console.log(`pace      ${localDate(today)}: ${fmt(due)} due by an even month; ${gap >= 0 ? `ahead by ${fmt(gap)}` : `behind by ${fmt(-gap)}`}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
