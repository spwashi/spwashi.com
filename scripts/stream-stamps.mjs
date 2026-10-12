#!/usr/bin/env node
/**
 * stream-stamps — give every stream entry a time git can ground.
 *
 * A stream entry is >>[stamp] type — content in a wip notebook or any .spw
 * stream. The site's stamp is a date and a time in the zone .spw/site.spw
 * ^"clock" names, written once there rather than on every entry:
 * >>[2026-10-12 10:54]. Older entries carry a date only, and agents have
 * written times in both Central time and UTC. This reads the whole history
 * of .agents and .spw once, finds the commit that first carried each entry,
 * and grounds the entry against it:
 *
 *   date only    takes that commit's time in the site zone, when the commit
 *                falls on the entry's own date. A later commit gives no time
 *                to trust, so the entry is left and listed.
 *   a time       read as site time if that falls before the commit (within
 *                48 hours), else as UTC and converted to site time. Read as
 *                site time the digits always sit five or six hours nearer the
 *                commit, so the site reading wins whenever it fits; a close
 *                call is settled by the other entries the same commit carried.
 *   no fit       left as written and listed: a time that falls after its
 *                commit, or more than 48 hours before it, in both zones,
 *                which is what an estimated time looks like.
 *
 * A grounded date-only time is "no later than": the commit that first
 * carried it. A commit that restamps an entry passes the entry's history on,
 * so a rerun reads a converted entry against the commit that first carried
 * it and leaves it alone. Entries the 2026-10-10 and 2026-10-12 reviews wrote
 * as `read` or `review` take the schema's word, `verify`.
 *
 *   npm run streams:stamp                 what it would change, and what it leaves
 *   npm run streams:stamp -- --write      apply
 *   npm run streams:stamp -- --list       every entry left, with its reason
 *   npm run streams:stamp -- --changes    every change, with the commit behind it
 *   npm run streams:stamp -- --check      exit 1 when an entry dated --since
 *                                         (default 2026-10-12) or later has no time
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteInstant, siteStamp, siteToday } from './lib/site-clock.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const since = args.find((arg) => arg.startsWith('--since='))?.slice(8) ?? '2026-10-12';
const WINDOW_HOURS = 48;
const REVIEW_DATES = new Set(['2026-10-10', '2026-10-12']);

const git = (gitArgs) => execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

/* >>[date], >>[date HH:MM], or a stamp with an explicit offset; then the type and the content's first words. */
const ENTRY = />>\[(\d{4}-\d{2}-\d{2})(?: (\d{2}:\d{2}))?(?: ([+-]\d{2}:\d{2}))?\](\s*)([A-Za-z_-]*)([^\n]{0,40})/g;
const words = (text) => text.replace(/^[\s—–-]+/, '').replace(/\s+/g, ' ').slice(0, 24);
const stampOf = (date, time) => `${date}${time ? ` ${time}` : ''}`;
const keysOf = (date, time, type, rest) => [`${stampOf(date, time)}|${type}|${words(rest)}`, `${stampOf(date, time)}|${type}`];
/* The same entry before and after a restamp: its content, with neither stamp nor type. */
const lineage = (rest) => words(rest);

/* One pass over history: for each entry key, the commits that first carried it, oldest first. */
const carried = new Map();
let commit = null;
let removed = new Map();
let pluses = [];
const flush = () => {
  for (const { keys, line, stamp } of pluses) {
    const before = removed.get(line);
    const inherited = before && before.stamp !== stamp
      ? [...new Set(before.keys.flatMap((key) => carried.get(key) ?? []))]
      : [];
    for (const key of keys) {
      if (!carried.has(key)) carried.set(key, []);
      const list = carried.get(key);
      for (const c of inherited.length ? inherited : [commit]) if (!list.includes(c)) list.push(c);
    }
  }
  removed = new Map();
  pluses = [];
};
for (const line of git(['log', '-p', '--reverse', '--no-merges', '--no-color', '--format=@@COMMIT %h %ct', '--', '.agents', '.spw']).split('\n')) {
  if (line.startsWith('@@COMMIT ')) {
    if (commit) flush();
    const [, hash, at] = line.split(' ');
    commit = { hash, at: Number(at) * 1000 };
    continue;
  }
  if (!commit || line.startsWith('+++') || line.startsWith('---')) continue;
  const sign = line[0];
  if (sign !== '+' && sign !== '-') continue;
  for (const m of line.matchAll(ENTRY)) {
    const [, date, time, , , type, rest] = m;
    const entry = { keys: keysOf(date, time, type, rest), line: lineage(rest), stamp: `${stampOf(date, time)} ${m[3] ?? ''}` };
    if (sign === '-') removed.set(entry.line, entry);
    else pluses.push(entry);
  }
}
if (commit) flush();

const files = git(['ls-files', '-co', '--exclude-standard', '--', '.agents', '.spw'])
  .split('\n')
  .filter((file) => file.endsWith('.spw') && !file.startsWith('.spw/_workbench/'));

/** The commit that first carried an entry, and how its time reads against it. */
function ground(date, time, candidates) {
  const reasons = [];
  for (const c of candidates) {
    if (!time) {
      if (siteToday(new Date(c.at)) === date) return { stamp: siteStamp(new Date(c.at)), how: 'date, time from commit', commit: c.hash };
      reasons.push(`first committed in ${c.hash} on ${siteToday(new Date(c.at))}, a later day`);
      continue;
    }
    const fits = (hours) => hours >= -0.1 && hours <= WINDOW_HOURS;
    const siteHours = (c.at - siteInstant(date, time)) / 3600000;
    const utc = Date.parse(`${date}T${time}:00Z`);
    const utcHours = (c.at - utc) / 3600000;
    if (fits(siteHours) || fits(utcHours)) {
      return {
        commit: c.hash,
        site: fits(siteHours),
        utc: fits(utcHours) ? siteStamp(new Date(utc)) : null,
        close: fits(siteHours) && fits(utcHours) && utcHours <= 6,
      };
    }
    reasons.push(`its time fits ${c.hash} in neither zone (an estimated time?)`);
  }
  return { reason: candidates.length ? reasons[0] : 'no commit carries it yet' };
}

/* Read every entry first: a close call is settled by the other entries its commit carried. */
const records = [];
const texts = new Map();
for (const file of files) {
  const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
  texts.set(file, lines);
  lines.forEach((line, index) => {
    for (const m of line.matchAll(ENTRY)) {
      const [whole, date, time, offset, space, type, rest] = m;
      const verify = REVIEW_DATES.has(date) && (type === 'read' || type === 'review') ? 'verify' : type;
      const record = { file, index, whole, date, time, offset, space, type, rest, verify, result: null, next: whole };
      if (offset) {
        /* An explicit offset names its instant; the site writes it in its own zone. */
        record.result = { stamp: siteStamp(new Date(`${date}T${time}:00${offset}`)), how: 'offset, written as site time' };
      } else {
        const candidates = [...new Set(keysOf(date, time, type, rest).flatMap((key) => carried.get(key) ?? []))].sort((a, b) => a.at - b.at);
        record.result = ground(date, time, candidates);
      }
      records.push(record);
    }
  });
}

/* A commit wrote UTC when one of its entries only fits as UTC, and site time when one only fits as site time. */
const sessions = new Map();
for (const { result } of records) {
  if (!result?.commit || result.stamp) continue;
  const zone = sessions.get(result.commit) ?? { utc: false, site: false };
  if (result.utc && !result.site) zone.utc = true;
  if (result.site && !result.close) zone.site = true;
  sessions.set(result.commit, zone);
}

const changes = [];
const left = [];
const counts = new Map();
const tally = (key) => counts.set(key, (counts.get(key) ?? 0) + 1);
let untimedRecent = 0;

for (const record of records) {
  const { file, index, date, time, space, verify, rest, result } = record;
  let stamp = stampOf(date, time);
  let how = result.how ?? null;
  if (result.stamp) {
    stamp = result.stamp;
  } else if (result.commit) {
    const session = sessions.get(result.commit);
    const asUtc = result.close ? session.utc && !session.site : !result.site;
    if (asUtc) stamp = result.utc;
    how = result.close ? `close call, read as ${asUtc ? 'UTC' : 'site time'} with its commit` : 'written in UTC';
  } else {
    if (!time && date >= since) untimedRecent += 1;
    left.push({ file, line: index + 1, entry: `>>[${stampOf(date, time)}]`, reason: result.reason });
    tally('left');
  }
  record.next = `>>[${stamp}]${space}${verify}${rest}`;
  if (!record.whole.startsWith(`>>[${stamp}]`)) {
    tally(how);
    changes.push({ file, line: index + 1, from: record.whole.slice(0, record.whole.indexOf(']') + 1), to: `>>[${stamp}]`, commit: result.commit ?? '' });
  }
}

if (flag('write')) {
  for (const [file, lines] of texts) {
    const mine = records.filter((record) => record.file === file && record.next !== record.whole);
    if (!mine.length) continue;
    for (const record of mine) lines[record.index] = lines[record.index].replace(record.whole, record.next);
    fs.writeFileSync(path.join(ROOT, file), lines.join('\n'));
  }
}

if (flag('list')) for (const l of left) console.log(`${l.file}:${l.line}: ${l.entry} left: ${l.reason}`);
if (flag('changes')) for (const c of changes) console.log(`${c.file}:${c.line}: ${c.from} → ${c.to}${c.commit ? ` (${c.commit})` : ''}`);
const summary = [...counts].filter(([key]) => key !== 'left').map(([key, n]) => `${n} ${key}`).join(' · ');
const renamed = records.filter((record) => record.verify !== record.type).length;
console.log(`[streams:stamp] ${records.length} entries · ${changes.length} restamped${summary ? ` (${summary})` : ''} · ${counts.get('left') ?? 0} left · ${renamed} read/review → verify${flag('write') ? ' · written' : ' · dry run (--write to apply)'}`);
if (flag('check') && untimedRecent) {
  console.log(`[streams:stamp] ${untimedRecent} entries dated ${since} or later have no time; stamp them with npm run -s clock`);
  process.exitCode = 1;
}
