// mutex.buzz as files: the lock, worked out in the reader's browser, and the rule as a sample of Spw.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP_HOME, CSP_NOW, FOLIO_SOURCES, SCHEDULE, carried, paintLock } from '../carry.mjs';
import { CYCLES, DIAL, FOLIOS, cycleFor, dialOf, holderFor, nowLine } from '../src/lock.js';
import * as served from '../../site-hub-next/src/mutex.js';
import { parse } from '../../../public/js/semantic/spw-workbench-reader.js';
import { parse as parsePinned } from '../../spw-quest/assets/parser/2026.10.13/reader.min.js';

const root = path.dirname(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)));
const assets = path.join(root, 'assets');
const repo = path.resolve(root, '../..');
const whole = (text) => [parse(text, { eventPolicy: 'none' }), parsePinned(text)].every((r) => r.success && !r.completeness?.proseFallback && r.errors.length === 0);
const days = (from, until) => { const out = []; for (let t = Date.parse(`${from}T12:00:00Z`); t < Date.parse(`${until}T00:00:00Z`); t += 86_400_000) out.push(new Date(t)); return out; };

test('the unit is files only, and an unknown path is a page that says nothing holds it', () => {
  const config = JSON.parse(readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(config.main, undefined);
  assert.equal(config.assets.not_found_handling, '404-page');
});

test('each carried file is what carry.mjs writes, and the folios are the site\'s own bytes', async () => {
  for (const [file, body] of await carried()) assert.equal(readFileSync(path.join(assets, file), 'utf8'), body, `assets/${file}: run node workers/mutex-buzz/carry.mjs`);
  for (const [name, source] of Object.entries(FOLIO_SOURCES)) assert.ok(readFileSync(path.join(assets, 'folios', name)).equals(readFileSync(path.join(repo, source))), name);
  for (const folio of Object.values(FOLIOS)) assert.ok(Object.keys(FOLIO_SOURCES).includes(folio.image.replace('/folios/', '')), folio.title);
});

test('the lock keeps the rule site-hub-next served, every day through 2027', () => {
  for (const day of days('2026-10-01', '2028-01-01')) {
    const a = holderFor(day);
    const b = served.holderFor(day);
    assert.deepEqual([a.cycle, a.since, a.releasesAt, a.title, a.alt], [b.cycle, b.since, b.releasesAt, b.title, b.alt], day.toISOString());
  }
  assert.equal(cycleFor(new Date('2027-02-28T00:00:00Z')).releasesAt.toISOString(), '2027-03-01T00:00:00.000Z');
});

test('/now.json is the schedule: every hold from the season through 2027, with no gap between them', () => {
  const schedule = JSON.parse(readFileSync(path.join(assets, 'now.json'), 'utf8'));
  assert.equal(schedule.schema, 'mutex.schedule.v1');
  const holds = schedule.holds;
  assert.equal(holds[0].since, `${SCHEDULE.from}T00:00:00.000Z`);
  assert.equal(holds.at(-1).releasesAt, `${SCHEDULE.until}T00:00:00.000Z`);
  assert.equal(holds.length, 15 * 3, 'three holds a month for fifteen months');
  for (let i = 1; i < holds.length; i += 1) assert.equal(holds[i].since, holds[i - 1].releasesAt, `hold ${i} starts where ${i - 1} lets go`);
});

test('lock.spw is a sample of Spw: it reads whole on both readers, uses every mark, and says the closes the lock keeps', () => {
  const source = readFileSync(path.join(root, 'src/lock.spw'), 'utf8');
  assert.ok(whole(source), 'lock.spw reads whole');
  const marks = new Set(parse(source, { eventPolicy: 'none' }).tokens.filter((t) => t.type === 'OPERATOR').map((t) => t.value));
  for (const mark of ['^', '=', '$', '!', '.', '~', '%', '@', '&', '?']) assert.ok(marks.has(mark), `uses ${mark}`);
  assert.match(source, /^#>mutex_buzz$/m, 'names itself with #>');
  assert.match(nowLine(holderFor(new Date())), /^\*holds\[/, 'and * marks what holds now');
  const clock = source.split('\n').find((line) => line.startsWith('$clock'));
  assert.equal(clock, '$clock[utc]{13th, 26th, last_day}');
  assert.deepEqual(CYCLES.map((c) => c.from), [1, 14, 27], 'the closes after the 13th and the 26th');
  for (const line of source.split('\n').filter((l) => /^[\^=$!.~%@&]/.test(l))) assert.ok(whole(line), `${line} reads whole as a line too`);
});

test('the line that says what holds now reads whole for every hold, short months and long', () => {
  for (const day of days('2026-10-01', '2028-01-01').filter((d) => [1, 14, 27].includes(d.getUTCDate()))) {
    const line = nowLine(holderFor(day));
    assert.ok(whole(line), line);
  }
  assert.equal(nowLine(holderFor(new Date('2026-11-16T12:00:00Z'))), '*holds[B]{teal stripes vibes wash}(november 14 ~> november 26)');
});

test('the page paints lock.spw from the reader\'s tokens, every character in order, each line naming the part it governs', () => {
  const source = readFileSync(path.join(root, 'src/lock.spw'), 'utf8');
  const painted = paintLock(source);
  const text = painted.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  assert.equal(text, source.replace(/\n$/, ''));
  const parts = [...painted.matchAll(/data-part="([a-z]+)"/g)].map((m) => m[1]);
  for (const part of ['name', 'lock', 'window', 'clock', 'hold', 'rest', 'wait', 'release', 'frame', 'dial', 'now']) assert.ok(parts.includes(part), part);
  const page = readFileSync(path.join(assets, 'index.html'), 'utf8');
  assert.ok(page.includes(painted), 'the page carries the painting');
  const b64 = Buffer.from(source, 'utf8').toString('base64url');
  assert.ok(page.includes(`https://factshift.center/#spw64=${b64}`) && page.includes(`https://spw.quest/build#spw64=${b64}`), 'it opens on the canvas and on spw.quest');
});

test('the dial keeps the month on its ring, and today moves around it', () => {
  const nov = days('2026-11-01', '2026-12-01').map((d) => dialOf(d));
  for (const d of nov) {
    for (const h of d.holds) assert.ok(h.label.x >= 0 && h.label.x <= DIAL.size && h.label.y >= 0 && h.label.y <= DIAL.size);
    assert.ok(d.elapsed >= 0 && d.elapsed <= 1);
  }
  for (let i = 1; i < nov.length; i += 1) assert.ok(nov[i].needle.angle > nov[i - 1].needle.angle, `day ${i + 1} is further round`);
  assert.equal(nov[15].current, 'B');
});

test('/ refuses to be framed and /now/ lets attention.productions frame it, with no rule setting a policy twice', () => {
  const headers = readFileSync(path.join(assets, '_headers'), 'utf8');
  const rules = headers.split('\n\n').map((block) => block.split('\n').filter((l) => !l.startsWith('#')));
  const rule = (pattern) => rules.find((r) => r[0] === pattern) ?? [];
  assert.ok(rule('/').includes(`  Content-Security-Policy: ${CSP_HOME}`) && rule('/').includes('  X-Frame-Options: DENY'));
  assert.ok(rule('/now/').includes(`  Content-Security-Policy: ${CSP_NOW}`));
  assert.ok(!rule('/now/').some((l) => l.includes('X-Frame-Options')));
  assert.ok(!rule('/*').some((l) => /Content-Security-Policy|X-Frame-Options/.test(l)), '/* sets no policy, so none is joined to another');
  assert.match(CSP_NOW, /frame-ancestors 'self' https:\/\/attention\.productions/);
  assert.doesNotMatch(`${CSP_HOME} ${CSP_NOW}`, /unsafe-inline/);
});

test('the pages read with scripts off, carry nothing inline, and point to no one\'s own site', () => {
  for (const file of ['index.html', 'now/index.html', '404.html', 'lock.js', 'llms.txt']) {
    const body = readFileSync(path.join(assets, file), 'utf8');
    assert.doesNotMatch(body, /spwashi\.com/, `${file} names no owner's site`);
    if (file.endsWith('.html')) assert.doesNotMatch(body, /\sstyle=|<style|<script>|\son[a-z]+=/i, `${file}: nothing inline`);
  }
  const home = readFileSync(path.join(assets, 'index.html'), 'utf8');
  assert.ok(home.includes('A mutex lets one thread in and makes the rest wait.'));
  for (const { cycle } of CYCLES) assert.ok(home.includes(`<li data-cycle="${cycle}"><b>${cycle}</b>`), `hold ${cycle} is listed`);
});
