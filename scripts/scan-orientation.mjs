#!/usr/bin/env node
/**
 * Turn scans upright. A scan's .spw records how it lies (orientation_note);
 * some were scanned upside down and kept that way. This reads every scan that
 * has a master and a note, decides a turn from the note, asks tesseract's
 * orientation detection for a second opinion on the master, and with --apply
 * renders the scan's tiers again from the master, turned, under the same names
 * and sizes. The master stays as scanned; the .spw gains upright_turn and the
 * tiers' new sizes, so a second run leaves a turned scan alone.
 *
 * Only a whole piece whose lettering reads upside down is turned: a 180° turn
 * keeps every width and height the site's markup and image records already
 * give. A quarter turn would swap them and a collage of mixed directions has
 * no upright, so those are listed for a person to decide.
 *
 *   node scripts/scan-orientation.mjs            # what would turn, and what is left to decide
 *   node scripts/scan-orientation.mjs --apply    # turn the clear ones
 *
 * Requires magick, avifenc, cwebp and tesseract (with osd) on PATH.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'public/images/assets');
const APPLY = process.argv.includes('--apply');
/**
 * Each turned tier keeps the byte budget its .spw records: quality steps down
 * from the convention's ceiling until the file is no heavier than before (5%
 * slack), so turning a scan never makes a page slower.
 */
const CEILING = { thumb: 60, display: 70, hero: 80 };
const STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40];

/** Encode one format at the highest quality that fits the budget. */
async function encodeWithin(encode, out, ceiling, budgetKiB) {
  let quality = ceiling;
  for (const step of STEPS) {
    quality = Math.max(10, ceiling - step);
    await encode(quality);
    if (await kib(out) <= budgetKiB * 1.05) break;
  }
  return quality;
}

/** The turn a note asks for, or why it asks for none. */
export function turnOf(note) {
  const text = String(note ?? '').toLowerCase();
  if (/^lettering reads upside down\b/.test(text)) return { turn: 180 };
  if (/quarter turn clockwise/.test(text)) return { decide: 'a quarter turn clockwise would read it, but swaps width and height' };
  if (/\b(some|most|cards|the [a-z.]+ sign)\b|\band mirrored\b/.test(text)) return { decide: 'mixed directions: no single upright' };
  if (/sideways/.test(text)) return { decide: 'sideways, direction not recorded' };
  if (/upside down/.test(text)) return { decide: 'only part of it reads upside down' };
  return { decide: 'kept as scanned' };
}

/** tesseract's orientation detection: the turn it would make, and how sure it is. */
async function detect(master, scratch) {
  const small = path.join(scratch, 'osd.png');
  await run('magick', [master, '-resize', '1600x1600', small]);
  try {
    const { stdout } = await run('tesseract', [small, '-', '--psm', '0'], { maxBuffer: 1 << 20 });
    return { turn: Number(stdout.match(/Rotate:\s*(\d+)/)?.[1] ?? NaN), confidence: Number(stdout.match(/Orientation confidence:\s*([\d.]+)/)?.[1] ?? 0) };
  } catch {
    return { turn: NaN, confidence: 0 };
  }
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(abs));
    else if (entry.name.endsWith('.spw')) out.push(abs);
  }
  return out;
}

const field = (text, name) => text.match(new RegExp(`${name}:\\s*"([^"]*)"`))?.[1] ?? '';
const kib = async (file) => Math.round((await stat(file)).size / 1024);

async function turnTiers(spwFile, text, master, turn, scratch) {
  const dir = path.dirname(spwFile);
  const name = path.basename(spwFile, '.spw');
  const tiers = [...text.matchAll(/(thumb|display|hero):\s*\{\s*width:\s*(\d+),\s*height:\s*(\d+),\s*avif_kib:\s*(\d+),\s*webp_kib:\s*(\d+)/g)]
    .map(([, tier, w, h, a, b]) => ({ tier, w: Number(w), h: Number(h), avifKiB: Number(a), webpKiB: Number(b) }));
  if (!tiers.length) throw new Error(`${path.relative(ROOT, spwFile)} lists no tiers`);
  let next = text;
  for (const { tier, w, h, avifKiB, webpKiB } of tiers) {
    const png = path.join(scratch, `${tier}.png`);
    await run('magick', [master, '-strip', '-rotate', String(turn), '-resize', `${w}x${h}!`, png]);
    const avif = path.join(dir, `${name}-${tier}.avif`);
    const webp = path.join(dir, `${name}-${tier}.webp`);
    const ceiling = CEILING[tier] ?? 70;
    await encodeWithin((q) => run('avifenc', ['-q', String(q), png, avif]), avif, ceiling, avifKiB);
    await encodeWithin((q) => run('cwebp', ['-q', String(q), '-metadata', 'none', '-quiet', png, '-o', webp]), webp, ceiling + 10, webpKiB);
    next = next.replace(new RegExp(`(${tier}:\\s*\\{\\s*width:\\s*${w},\\s*height:\\s*${h},\\s*avif_kib:\\s*)\\d+(,\\s*webp_kib:\\s*)\\d+`), `$1${await kib(avif)}$2${await kib(webp)}`);
  }
  // The record says what was done: the scan as it lay, and the turn that reads it.
  return next.replace(/(\n\s*orientation_note:\s*"[^"]*")/, `$1\n  upright_turn: ${turn}`);
}

const scratch = await mkdtemp(path.join(tmpdir(), 'scan-orientation-'));
const rows = [];
try {
  for (const file of await walk(ASSETS)) {
    const text = await readFile(file, 'utf8');
    const note = field(text, 'orientation_note');
    const masterRel = field(text, 'master');
    if (!note || !masterRel) continue;
    const id = path.relative(ASSETS, file).replace(/\.spw$/, '');
    if (/upright_turn:/.test(text)) { rows.push({ id, verdict: 'turned', why: 'already upright' }); continue; }
    const want = turnOf(note);
    if (!want.turn) { rows.push({ id, verdict: 'decide', why: want.decide }); continue; }
    const master = path.join(ROOT, masterRel);
    try { await stat(master); } catch { rows.push({ id, verdict: 'decide', why: `master missing: ${masterRel}` }); continue; }
    const seen = await detect(master, scratch);
    // A confident detector that disagrees stops the turn; an unsure one does not.
    if (Number.isFinite(seen.turn) && seen.turn !== want.turn && seen.confidence >= 3) {
      rows.push({ id, verdict: 'decide', why: `note says ${want.turn}°, detection says ${seen.turn}° at ${seen.confidence}` });
      continue;
    }
    const agree = seen.turn === want.turn ? `detection agrees (${seen.confidence})` : `detection unsure (${Number.isFinite(seen.turn) ? `${seen.turn}° at ${seen.confidence}` : 'no reading'})`;
    if (APPLY) await writeFile(file, await turnTiers(file, text, master, want.turn, scratch));
    rows.push({ id, verdict: APPLY ? 'turned' : 'turn', why: `${want.turn}°, ${agree}` });
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}

for (const verdict of ['turn', 'turned', 'decide']) {
  const these = rows.filter((r) => r.verdict === verdict);
  if (!these.length) continue;
  console.log(`\n${verdict} (${these.length})`);
  for (const r of these) console.log(`  ${r.id.padEnd(58)} ${r.why}`);
}
