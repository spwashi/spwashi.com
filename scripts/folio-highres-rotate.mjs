#!/usr/bin/env node
/**
 * folio-highres-rotate.mjs
 *
 * Opens the next week's five high-res folios in one move, so the weekly
 * check (scripts/audit-folio-highres.mjs) stays easy to satisfy:
 *
 *   1. makes folio-<slug>-full.webp for any of the five that lacks one —
 *      2400px on the long edge from the untracked master, no metadata,
 *      quality stepped down from 82 until under capBytes;
 *   2. records the tier in the folio's sidecar (full: { … opened });
 *   3. appends the week to public/data/folio-highres.json;
 *   4. moves the "View high-res" links on /design/folios/ to the five;
 *   5. runs the audit.
 *
 * Masters live in public/images/renders/_raw/folio-scans-<release>/ on the
 * scanning machine only. A folio whose full file already exists needs no
 * master, so a repeat week runs anywhere.
 *
 *   node scripts/folio-highres-rotate.mjs --ids=03,05,07,12,21 [--release=2026-09-26] [--week=2026-W40] [--opened=2026-09-28] [--dry-run]
 *
 *   --ids      five two-digit source numbers (folio-<release>-NN)
 *   --release  the scan set the five come from; default 2026-09-26
 *   --week     ISO week label; default is the week of --opened or today
 *   --opened   the date the set opens; default today
 *   --dry-run  print every step, write nothing
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { formatWeek, isoWeek, parseWeek } from './lib/iso-week.mjs';
import { rewriteFolioStrips } from './lib/folio-strip.mjs';

const ROOT = process.cwd();
const RECORD = 'public/data/folio-highres.json';
const PAGE = 'design/folios/index.html';
const ASSETS = 'public/images/assets/folios';
const QUALITIES = [82, 76, 70, 64, 58, 52];

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const dryRun = args.includes('--dry-run');
const RELEASE = flag('release', '2026-09-26');
const MASTERS = `public/images/renders/_raw/folio-scans-${RELEASE}`;
const ids = flag('ids', '').split(',').map((s) => s.trim()).filter(Boolean);
const opened = flag('opened', new Date().toISOString().slice(0, 10));
const week = flag('week', formatWeek(isoWeek(new Date(`${opened}T12:00:00Z`))));

const record = JSON.parse(readFileSync(path.join(ROOT, RECORD), 'utf8'));
const fail = (message) => { console.error(`[folio-highres-rotate] ${message}`); process.exit(1); };

// Redraw Home's and Now's strips from the latest recorded week, and stop.
if (args.includes('--strips-only')) {
  const latest = record.weeks.at(-1);
  if (!latest) fail(`${RECORD} has no week yet`);
  rewriteFolioStrips({ root: ROOT, five: latest.folios, dryRun, say: (line) => console.log(`${dryRun ? '[dry] ' : ''}${line}`) });
  process.exit(0);
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(RELEASE)) fail(`--release must be YYYY-MM-DD, got ${RELEASE}`);
if (ids.length !== record.perWeek) fail(`--ids needs exactly ${record.perWeek} source numbers, got ${ids.length}`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(opened)) fail(`--opened must be YYYY-MM-DD, got ${opened}`);
if (!parseWeek(week)) fail(`--week must look like 2026-W40, got ${week}`);
if (record.weeks.some((entry) => entry.week === week)) fail(`${week} is already in ${RECORD}`);
if (new Set(ids).size !== ids.length) fail('the five must be distinct');

// id → slug, from the sidecars; the sidecar is the record of which file is which folio.
const sidecars = new Map();
for (const name of execFileSync('ls', [path.join(ROOT, ASSETS)], { encoding: 'utf8' }).split('\n')) {
  if (!name.endsWith('.spw')) continue;
  const text = readFileSync(path.join(ROOT, ASSETS, name), 'utf8');
  // Source numbers repeat across scan sets; only the chosen release's sidecars count.
  const id = new RegExp(`id: "folio-${RELEASE}-(\\d{2})"`).exec(text)?.[1];
  if (id) sidecars.set(id, { slug: name.slice('folio-'.length, -'.spw'.length), file: name, text });
}
const five = ids.map((id) => {
  const entry = sidecars.get(id);
  if (!entry) fail(`no sidecar names source ${id}`);
  return { id, ...entry };
});

const say = (line) => console.log(`${dryRun ? '[dry] ' : ''}${line}`);
const magick = (argv) => execFileSync('magick', argv, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
const cwebp = (argv) => execFileSync('cwebp', argv, { stdio: ['ignore', 'ignore', 'inherit'] });

async function ensureFull({ id, slug }) {
  const out = path.join(ROOT, ASSETS, `folio-${slug}-full.webp`);
  if (existsSync(out)) {
    say(`${id} ${slug}: full file exists, ${Math.round(statSync(out).size / 1024)} KiB`);
    return out;
  }
  const master = path.join(ROOT, MASTERS, `folio-${RELEASE}-${id}-scan.png`);
  if (!existsSync(master)) fail(`${id} ${slug}: no full file and no master at ${path.relative(ROOT, master)}`);
  if (dryRun) {
    say(`${id} ${slug}: would make ${path.relative(ROOT, out)} from the master`);
    return out;
  }
  const dir = await mkdtemp(path.join(tmpdir(), 'folio-full-'));
  const png = path.join(dir, 'full.png');
  try {
    magick([master, '-strip', '-resize', `${record.longEdge}x${record.longEdge}`, png]);
    let quality = QUALITIES[0];
    for (quality of QUALITIES) {
      cwebp(['-q', String(quality), '-metadata', 'none', png, '-o', out]);
      if (statSync(out).size <= record.capBytes) break;
    }
    const size = statSync(out).size;
    if (size > record.capBytes) fail(`${id} ${slug}: ${Math.round(size / 1024)} KiB at quality ${quality}, still over the cap`);
    say(`${id} ${slug}: made ${path.relative(ROOT, out)}, ${Math.round(size / 1024)} KiB at quality ${quality}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  return out;
}

function recordTier({ id, slug, file, text }, out) {
  if (/^\s+full: \{/m.test(text)) return;
  const [width, height] = dryRun && !existsSync(out) ? ['?', '?'] : magick(['identify', '-format', '%w %h', out]).split(' ');
  const kib = existsSync(out) ? Math.round(statSync(out).size / 1024) : '?';
  let next = text.replace(/^(\s+hero: \{[^\n]*\}\n)/m, `$1    full: { width: ${width}, height: ${height}, webp_kib: ${kib}, opened: "${week}" }\n`);
  if (!/^\s+highres: /m.test(next)) {
    next = next.replace(/^(\s+formats_available: [^\n]*\n)/m, `$1  highres: "folio-${slug}-full.webp — ${record.longEdge}px WebP, opened in the weekly five (${RECORD})"\n`);
  }
  if (next === text) fail(`${id} ${slug}: could not place the full tier in ${file}`);
  say(`${id} ${slug}: sidecar gains full tier for ${week}`);
  if (!dryRun) writeFileSync(path.join(ROOT, ASSETS, file), next);
}

function rewritePage() {
  const page = readFileSync(path.join(ROOT, PAGE), 'utf8');
  const stripped = page.replace(/^[ \t]*<a href="[^"]*-full\.webp" data-folio-highres>View high-res<\/a>\n/gm, '');
  let next = stripped;
  for (const { id, slug } of five) {
    const anchor = new RegExp(`^([ \\t]*)(<a href="/public/images/assets/folios/folio-${slug}-hero\\.webp">Open the large scan</a>)`, 'm');
    if (!anchor.test(next)) fail(`${id} ${slug}: no "Open the large scan" link on ${PAGE}`);
    next = next.replace(anchor, `$1<a href="/public/images/assets/folios/folio-${slug}-full.webp" data-folio-highres>View high-res</a>\n$1$2`);
  }
  const removed = (page.match(/data-folio-highres/g) || []).length;
  say(`${PAGE}: ${removed} high-res link(s) → ${five.length}`);
  if (!dryRun) writeFileSync(path.join(ROOT, PAGE), next);
}

say(`opening ${week} (${opened}): ${five.map((f) => `${f.id} ${f.slug}`).join(', ')}`);
for (const folio of five) recordTier(folio, await ensureFull(folio));
rewritePage();
rewriteFolioStrips({ root: ROOT, five, dryRun, say });
record.weeks.push({ week, opened, folios: five.map(({ id, slug }) => ({ id: `folio-${RELEASE}-${id}`, slug })) });
say(`${RECORD}: week ${record.weeks.length} appended`);
if (!dryRun) {
  writeFileSync(path.join(ROOT, RECORD), `${JSON.stringify(record, null, 2)}\n`);
  // The worker reads the five at install, and install only reruns when sw.js changes.
  const worker = readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  if (!/^const FOLIO_WEEK = '[^']*';$/m.test(worker)) fail('sw.js: no FOLIO_WEEK line to stamp');
  writeFileSync(path.join(ROOT, 'sw.js'), worker.replace(/^const FOLIO_WEEK = '[^']*';$/m, `const FOLIO_WEEK = '${week}';`));
  say(`sw.js: FOLIO_WEEK → ${week}`);
  execFileSync(process.execPath, ['scripts/audit-folio-highres.mjs', '--check', `--today=${opened}`], { stdio: 'inherit' });
  console.log('[folio-highres-rotate] done. Rebuild manifests (npm run manifest) and commit the five files, the sidecars, the record, the page, the Home and Now strips, and sw.js.');
}
