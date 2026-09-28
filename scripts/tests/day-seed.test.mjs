import assert from 'node:assert/strict';
import test from 'node:test';

import { dayKey, dayNumber, dayWindow, pickForDay } from '../../public/js/kernel/day-seed.js';

test('a day key and number follow the local calendar', () => {
  assert.equal(dayKey(new Date(2026, 8, 27, 23, 59)), '2026-09-27');
  assert.equal(dayNumber(new Date(2026, 8, 28, 0, 1)) - dayNumber(new Date(2026, 8, 27, 23, 59)), 1);
});

test('a pick is stable within a day and salted between surfaces', () => {
  const list = Array.from({ length: 31 }, (_, index) => `folio-${index}`);
  const morning = new Date(2026, 9, 3, 8);
  const night = new Date(2026, 9, 3, 22);
  assert.equal(pickForDay(list, morning, 'home'), pickForDay(list, night, 'home'));
  const differs = Array.from({ length: 14 }, (_, offset) => new Date(2026, 9, 1 + offset))
    .some((day) => pickForDay(list, day, 'home') !== pickForDay(list, day, 'now'));
  assert.ok(differs);
});

test('every item appears once per pass before any repeats', () => {
  const list = ['a', 'b', 'c', 'd', 'e'];
  const day0 = dayNumber(new Date(2026, 9, 1));
  const start = new Date(2026, 9, 1 - (day0 % list.length));
  const seen = dayWindow(list, start, list.length, 'x').map((entry) => entry.item);
  assert.deepEqual([...seen].sort(), [...list].sort());
  assert.equal(pickForDay([], new Date()), null);
});

test('a rotation does not clump neighbors from the list', () => {
  // 83 items in id order, like the folio feed: a good pass scatters contiguous runs.
  const list = Array.from({ length: 83 }, (_, index) => index);
  for (const salt of ['folio-day', 'site-search-pieces', 'home']) {
    const firstTen = dayWindow(list, new Date(2026, 8, 27), 10, salt).map((entry) => entry.item);
    const spread = Math.max(...firstTen) - Math.min(...firstTen);
    assert.ok(spread > 40, `${salt}: first ten span ${spread}`);
  }
});
