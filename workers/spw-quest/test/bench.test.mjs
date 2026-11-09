// The bench (src/bench.js) and the arcs in season (src/arcs.js, carry-arcs.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/index.js';
import { BENCH, benchCases, differences, readHere } from '../src/bench.js';
import { ARCS } from '../src/arcs-data.js';
import { arcsJson, renderArcs } from '../src/arcs.js';
import { season } from '../carry-arcs.mjs';

const root = path.dirname(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)));
const assetsDir = path.join(root, 'assets');
const ASSETS = { fetch: async (request) => {
  try {
    const pathname = new URL(request.url).pathname;
    return new Response(readFileSync(path.join(assetsDir, pathname.endsWith('/') ? `${pathname}index.html` : pathname)));
  } catch {
    return new Response('Not found', { status: 404 });
  }
} };
const get = (p) => worker.fetch(new Request(`https://spw.quest${p}`), { ASSETS });

test('spw.quest\'s reader reads every bench line as the canvas does, except where the bench names a gap', () => {
  const lines = benchCases().map((entry) => entry.line);
  assert.equal(new Set(lines).size, lines.length, 'each line once');
  for (const entry of benchCases()) {
    const off = differences(entry.expect, readHere(entry.line));
    if (entry.gap) assert.ok(off.length, `${entry.line}: the gap "${entry.gap}" has closed; take it off the case`);
    else assert.deepEqual(off, [], `${entry.line}: spw.quest reads it as ${JSON.stringify(readHere(entry.line))}`);
  }
  assert.ok(BENCH.every((group) => group.cases.length), 'no empty group');
});

// The canvas's reader lives in the app checkout (gitignored), so this runs where the app is checked out.
const CANVAS_READER = path.resolve(root, '../factshift-center/app/src/js/vendor/spw-reader/reader.min.js');
test('the canvas\'s reader reads every bench line as the bench expects', { skip: !existsSync(CANVAS_READER) && 'no app checkout beside the site' }, async () => {
  const { readLine } = await import(CANVAS_READER);
  const KEY = { word: 'subject', mode: 'mode', body: 'body', scene: 'scope', concept: 'projection' };
  for (const entry of benchCases()) {
    const reading = readLine(entry.line);
    const read = reading.compound
      ? { join: reading.compound.mark }
      : { slots: reading.order.map((key) => KEY[key]), parts: reading.parts.length, whole: reading.whole };
    assert.deepEqual(differences(entry.expect, read), [], `${entry.line}: the canvas reads ${JSON.stringify(read)}`);
  }
});

test('/bench/ opens every line on the canvas and is indexed', async () => {
  const response = await get('/bench/');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Robots-Tag'), 'index, follow');
  const html = await response.text();
  const opens = [...html.matchAll(/class="open" href="([^"]+)"/g)].map(([, href]) => href.replaceAll('&amp;', '&'));
  assert.deepEqual(opens, benchCases().map((entry) => `https://factshift.center/?spw=${encodeURIComponent(entry.line)}`));
  assert.equal((await get('/bench')).status, 301);
  assert.match(html, /<a href="\/bench\/" aria-current="page">Bench<\/a>/);
});

test('arcs: a season counts new lines by week, month and season, and the page and JSON are its render', async () => {
  const head = new Date('2026-11-08T12:00:00Z');
  const lines = [
    { line: 'a[hook]{x}<atlas>', day: '2026-11-07', route: '/' },
    { line: 'b[hook]{y}', day: '2026-11-06', route: '/' },
    { line: '~c[hook]{z}', day: '2026-10-20', route: '/a/' },
    { line: 'd[rest]{w}', day: '2026-09-01', route: '/b/' },
    { line: 'e[rest]{v}', day: '2026-08-20', route: '/b/' },
  ];
  const arcs = season(lines, head, '2026-11-08');
  assert.deepEqual(arcs.total, [2, 3, 5]);
  assert.deepEqual(arcs.lenses.map((arc) => [arc.key, arc.counts]), [['hook', [2, 3, 3]], ['rest', [0, 0, 2]]]);
  assert.equal(arcs.lenses[0].example, 'a[hook]{x}<atlas>', 'the newest line is the example');
  assert.deepEqual(arcs.marks, [], 'one ~ line is not an arc yet');
  for (const kind of ['lenses', 'projections', 'marks', 'subjects', 'shapes']) assert.ok(Array.isArray(ARCS[kind]), kind);
  assert.equal(ARCS.windows.length, ARCS.total.length);
  assert.equal(readFileSync(path.join(assetsDir, 'arcs/index.html'), 'utf8'), renderArcs(ARCS));
  assert.equal(readFileSync(path.join(assetsDir, 'arcs/index.json'), 'utf8'), arcsJson(ARCS));
  const response = await get('/arcs/');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Robots-Tag'), 'index, follow');
  assert.match(await response.text(), /<h1>Arcs in season<\/h1>/);
  const check = spawnSync(process.execPath, ['--import', path.resolve(root, '../../scripts/tests/register-public-imports.mjs'), path.join(root, 'carry-arcs.mjs'), '--check'], { encoding: 'utf8', cwd: path.resolve(root, '../..') });
  assert.equal(check.status, 0, check.stderr);
});
