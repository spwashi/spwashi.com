#!/usr/bin/env node
/**
 * folio-days.json — the pieces a route can rotate through by date.
 *
 * Read from the sidecars, never written by hand: every scanned piece a page
 * shows (folios, panel faces, and from October the cutouts and pads) with its title, where it hangs, its thumb, and the question its
 * ^"dialog" facet opens with, when it has one. kernel/day-seed.js picks from
 * this list per day, so a surface stays fresh without anyone editing it, and
 * every scan intake grows the rotation.
 *
 *   node scripts/generate-folio-days.mjs           write public/data/folio-days.json
 *   node scripts/generate-folio-days.mjs --check   exit 1 when it is stale
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'public/data/folio-days.json';
const DIRS = ['public/images/assets/folios', 'public/images/assets/panels', 'public/images/assets/primes', 'public/images/assets/pads'];
// Months whose pieces hang on a page of their own; earlier scans live on the folio shelf.
const MONTH_PAGES = { '10': '/design/folios/october-2026/' };

/** Where a piece hangs, or null when no page shows it yet (the September primes stay in their demo). */
function hrefFor(id) {
  // September panel faces carry a side in their id (panel-2026-09-27-front-00).
  if (/^panel-2026-09-\d{2}-(?:front|back)-\d{2}$/.test(id)) return '/design/folios/#panel-faces';
  const piece = id.match(/^(folio|panel|prime|pad)-2026-(\d{2})-(\d{2})-(\d{2})$/);
  if (!piece) return null;
  const [, kind, month, day, no] = piece;
  if (MONTH_PAGES[month]) return `${MONTH_PAGES[month]}#${kind}-${month}${day}-${no}`;
  if (kind === 'folio') return month === '09' && day === '26' ? `/design/folios/#folio-${no}` : `/design/folios/#folio-${month}${day}-${no}`;
  return null;
}

const pieces = [];
for (const dir of DIRS) {
  for (const name of readdirSync(path.join(ROOT, dir)).filter((file) => file.endsWith('.spw')).sort()) {
    const text = readFileSync(path.join(ROOT, dir, name), 'utf8');
    const id = text.match(/^\s*id:\s*"([^"]+)"/m)?.[1];
    if (!id) continue;
    const href = hrefFor(id);
    if (!href) continue;
    const stem = name.slice(0, -4);
    const thumb = text.match(/^\s*thumb:\s*\{\s*width:\s*(\d+),\s*height:\s*(\d+)/m);
    pieces.push({
      id,
      title: text.match(/^\s*title:\s*"([^"]+)"/m)?.[1] || stem,
      href,
      thumb: `/${dir}/${stem}-thumb.webp`,
      width: thumb ? Number(thumb[1]) : null,
      height: thumb ? Number(thumb[2]) : null,
      alt: text.match(/^\s*alt_text:\s*"((?:[^"\\]|\\.)*)"/m)?.[1]?.replace(/\\"/g, '"') || '',
      opens: text.match(/^\s*opens:\s*`\?([^`]*)`/m)?.[1] || null,
      handles: [...(text.match(/^\s*handles:\s*\[([^\]]*)\]/m)?.[1] || '').matchAll(/"([^"]+)"/g)].map((match) => match[1]),
    });
  }
}
pieces.sort((a, b) => a.id.localeCompare(b.id));

const body = `${JSON.stringify({
  about: 'Pieces to rotate through by date, read from the scan sidecars by scripts/generate-folio-days.mjs; kernel/day-seed.js picks one per day.',
  count: pieces.length,
  withQuestion: pieces.filter((piece) => piece.opens).length,
  pieces,
}).replace(/\},\{"id"/g, '},\n{"id"')}\n`;

if (process.argv.includes('--check')) {
  let committed = '';
  try { committed = readFileSync(path.join(ROOT, OUT), 'utf8'); } catch { committed = ''; }
  if (committed !== body) {
    console.error(`[folio-days] ${OUT} is stale; run node scripts/generate-folio-days.mjs`);
    process.exit(1);
  }
  console.log('[folio-days] current');
} else {
  writeFileSync(path.join(ROOT, OUT), body);
  console.log(`[folio-days] ${OUT}: ${pieces.length} pieces, ${pieces.filter((piece) => piece.opens).length} with a question`);
}
