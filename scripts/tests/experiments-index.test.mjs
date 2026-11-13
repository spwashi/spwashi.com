/**
 * experiments-index.test.mjs — every design experiment can be found, and can find its way back.
 *
 * /design/experiments/ is the one index of the rooms under it. A room added without a line
 * there is reachable only by its address, and a room with no door back strands a visitor who
 * arrived by a link. A room may stay off the index, or keep a header with no door back, only
 * when a reason is written below.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const INDEX = 'design/experiments/index.html';

/** Rooms kept off the index on purpose. */
const UNLISTED = Object.freeze({
  '/design/experiments/residency/': 'a draft charter that says it is not an announcement; listing it is the creator\'s call',
});

/** Rooms whose header has no door back to the index on purpose. */
const NO_DOOR = Object.freeze({
  '/design/experiments/symphony/a/': 'reproduces the Topics atlas, header included, for side-by-side loading stills',
  '/design/experiments/symphony/b/': 'reproduces the Topics atlas, header included, for side-by-side loading stills',
});

const rooms = execSync("git ls-files 'design/experiments/**/index.html'", { encoding: 'utf8' })
  .trim().split('\n').filter((file) => file && file !== INDEX)
  .map((file) => ({ file, route: `/${file.replace(/index\.html$/, '')}` }));

test('every room under /design/experiments/ is on the index, or unlisted with a reason', () => {
  const index = readFileSync(INDEX, 'utf8');
  const missing = rooms.filter(({ route }) => !index.includes(`href="${route}"`) && !UNLISTED[route]).map(({ route }) => route);
  assert.deepEqual(missing, [], `rooms with no line on ${INDEX}: ${missing.join(', ')}`);
  const stale = Object.keys(UNLISTED).filter((route) => !rooms.some((room) => room.route === route));
  assert.deepEqual(stale, [], 'an unlisted room that no longer exists');
});

test('every room has a door back to the index, or a reason it does not', () => {
  const stranded = rooms
    .filter(({ route }) => !UNLISTED[route] && !NO_DOOR[route])
    .filter(({ file }) => {
      const html = readFileSync(file, 'utf8');
      return !html.includes('href="/design/experiments/"') && !/nav_items="[^"]*:\/design\/experiments\/(?:\||")/.test(html);
    })
    .map(({ route }) => route);
  assert.deepEqual(stranded, [], `rooms with no door back: ${stranded.join(', ')}`);
});
