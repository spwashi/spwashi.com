import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { tourForDay } from '../../public/js/modules/design/image-tour.js';

const piece = (n, added, kind = 'scan') => ({ src: `/public/images/p${n}.webp`, width: 200, height: 256, label: `Piece ${n}`, kind, href: `/design/folios/#p${n}`, added });
const feed = {
  recentDays: 21,
  pieces: [
    ...Array.from({ length: 12 }, (_, n) => piece(n, '2026-09-27')),
    ...Array.from({ length: 12 }, (_, n) => piece(100 + n, '2026-05-01', 'render')),
  ],
};

test('while the newest batch is recent, it leads the tour and rotates by day', () => {
  const today = tourForDay(feed, new Date(2026, 9, 5));
  assert.equal(today.mode, 'recent');
  assert.equal(today.since, '2026-09-27');
  assert.equal(today.pieces.length, 5);
  assert.ok(today.pieces.every((p) => p.added === '2026-09-27'));
  const tomorrow = tourForDay(feed, new Date(2026, 9, 6));
  assert.notDeepEqual(today.pieces.map((p) => p.src), tomorrow.pieces.map((p) => p.src));
});

test('on a quiet week the tour walks older work', () => {
  const later = tourForDay(feed, new Date(2026, 11, 1));
  assert.equal(later.mode, 'tour');
  assert.equal(later.pieces.length, 5);
  assert.equal(new Set(later.pieces.map((p) => p.src)).size, 5);
});

test('two salts tour differently on the same day, and a day is stable', () => {
  const day = new Date(2026, 9, 5, 8);
  const home = tourForDay(feed, day, { salt: 'home' }).pieces.map((p) => p.src);
  const now = tourForDay(feed, day, { salt: 'now' }).pieces.map((p) => p.src);
  assert.notDeepEqual(home, now);
  assert.deepEqual(home, tourForDay(feed, new Date(2026, 9, 5, 22), { salt: 'home' }).pieces.map((p) => p.src));
});

test('the generated feed names a page for every picture and stays newest first', () => {
  const tour = JSON.parse(readFileSync(new URL('../../public/data/image-tour.json', import.meta.url), 'utf8'));
  assert.equal(tour.count, tour.pieces.length);
  for (const p of tour.pieces) {
    assert.match(p.href, /^\/(?!public\/)/, `${p.src} links to a page, not a file`);
    assert.match(p.added, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(!['/', '/now/'].includes(p.href.split('#')[0]), `${p.src} links to a page that keeps it`);
  }
  const dates = tour.pieces.map((p) => p.added);
  assert.deepEqual(dates, [...dates].sort().reverse());
});
