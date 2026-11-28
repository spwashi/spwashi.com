// mutex.buzz as files: the lock, worked out in the reader's browser, and the rule as a sample of Spw.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP_HOME, CSP_NOW, FOLIO_SOURCES, SCHEDULE, carried, carriedWithWorker, paintLock } from '../carry.mjs';
import { ICONS } from '../src/icon.js';
import { assertIconPng } from '../../lib/png.js';
import { CYCLES, DIAL, FOLIOS, TURN_MS, clockLine, countdown, cycleFor, dayOf, dialOf, holderFor, isoWeek, nextTurnIn, nowLine, seenAt, sinceWords, turnLine, turnOf } from '../src/lock.js';
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
  for (const [file, body] of await carriedWithWorker()) assert.equal(readFileSync(path.join(assets, file), 'utf8'), body, `assets/${file}: run node workers/mutex-buzz/carry.mjs`);
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

test('/ refuses to be framed and /now/ is the lock\'s embed, framed by any https page, with no rule setting a policy twice', () => {
  const headers = readFileSync(path.join(assets, '_headers'), 'utf8');
  const rules = headers.split('\n\n').map((block) => block.split('\n').filter((l) => !l.startsWith('#')));
  const rule = (pattern) => rules.find((r) => r[0] === pattern) ?? [];
  assert.ok(rule('/').includes(`  Content-Security-Policy: ${CSP_HOME}`) && rule('/').includes('  X-Frame-Options: DENY'));
  assert.ok(rule('/now/').includes(`  Content-Security-Policy: ${CSP_NOW}`));
  assert.ok(!rule('/now/').some((l) => l.includes('X-Frame-Options')));
  assert.ok(!rule('/*').some((l) => /Content-Security-Policy|X-Frame-Options/.test(l)), '/* sets no policy, so none is joined to another');
  assert.match(CSP_NOW, /frame-ancestors 'self' https:;/);
  assert.match(CSP_HOME, /frame-ancestors 'none'/);
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
  // What a mutex is, said plainly before this lock's own rules.
  const explain = home.slice(home.indexOf('<details class="explain"'), home.indexOf('</details>', home.indexOf('<details class="explain"')));
  // Open by default: with scripts off, and on a first visit, the explanation reads whole.
  assert.ok(home.includes('<details class="explain" id="explain" open>'));
  for (const words of ['mutual exclusion', 'acquires the lock', 'releases it', 'critical section', 'semaphore']) assert.ok(explain.includes(words), words);
  assert.ok(home.indexOf('class="explain"') < home.indexOf('class="rules"'), 'the explanation comes before the rules');
  for (const { cycle } of CYCLES) assert.ok(home.includes(`<li data-cycle="${cycle}"><b>${cycle}</b>`), `hold ${cycle} is listed`);
});

test('a hold is cut into turns of an hour: whole at its ends, a detail inside the picture between, each said as Spw', () => {
  const holder = holderFor(new Date('2026-11-16T12:00:00Z'));
  const since = Date.parse(holder.since);
  const first = turnOf(holder, new Date(since));
  assert.equal(first.of, 13 * 24, 'thirteen days of hours');
  assert.deepEqual([first.index, first.zoom], [0, 1]);
  assert.deepEqual([turnOf(holder, new Date(Date.parse(holder.releasesAt) - 1)).index, turnOf(holder, new Date(Date.parse(holder.releasesAt) - 1)).zoom], [first.of - 1, 1]);
  const seen = new Set();
  for (let i = 1; i < first.of - 1; i += 1) {
    const turn = turnOf(holder, new Date(since + i * TURN_MS + 1000));
    assert.equal(turn.index, i);
    // At this zoom a detail's centre keeps its whole crop inside the picture.
    const half = 0.5 / turn.zoom;
    assert.ok(turn.fx >= half && turn.fx <= 1 - half && turn.fy >= half && turn.fy <= 1 - half, `turn ${i}`);
    seen.add(`${turn.fx},${turn.fy}`);
  }
  assert.ok(seen.size > 90, `the details walk the work (${seen.size} places)`);
  for (const at of [0, 61, first.of - 1]) assert.ok(whole(turnLine(turnOf(holder, new Date(since + at * TURN_MS)))), `turn ${at}`);
  assert.equal(turnLine(turnOf(holder, new Date('2026-11-16T13:30:00Z'))), '%turn[62/312]{hour}');
  assert.equal(countdown(holder, new Date('2026-11-16T13:37:55Z')), '10d 10h 22m 05s');
  assert.equal(countdown(holder, new Date(Date.parse(holder.releasesAt) - 65_000)), '1m 05s');
  assert.equal(countdown(holder, new Date(Date.parse(holder.releasesAt) + 5)), '0s');
});

test('the mutex you can watch is drawn at rest with scripts off: one bee inside the cell, two waiting', () => {
  const home = readFileSync(path.join(assets, 'index.html'), 'utf8');
  const figure = home.slice(home.indexOf('<figure class="threads"'), home.indexOf('</figure>', home.indexOf('<figure class="threads"')));
  assert.equal((figure.match(/class="inside"/g) ?? []).length, 1);
  assert.equal((figure.match(/class="waiting"/g) ?? []).length, 2);
  assert.ok(figure.includes('<button type="button" id="send-bee" hidden>Send a bee</button>'), 'its button waits for the script');
  assert.ok(home.indexOf('class="threads"') > home.indexOf('class="explain"'), 'it sits in the explanation');
});

test('mutex.buzz installs: a manifest with its icons and a shortcut, and a worker that keeps the whole lock', async () => {
  const manifest = JSON.parse(readFileSync(path.join(assets, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  const sizes = manifest.icons.filter((i) => i.type === 'image/png').map((i) => `${i.sizes}:${i.purpose}`);
  for (const want of ['192x192:any', '512x512:any', '512x512:maskable']) assert.ok(sizes.includes(want), want);
  for (const icon of manifest.icons) assert.ok(readFileSync(path.join(assets, icon.src)).length > 0, icon.src);
  assert.equal(manifest.shortcuts[0].url, '/now/');
  for (const [name, icon] of Object.entries(ICONS)) {
    const png = readFileSync(path.join(assets, 'icons', name));
    assert.ok(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${name} is a PNG`);
    assert.equal(png.readUInt32BE(16), icon.size, `${name} is ${icon.size} wide`);
    assertIconPng(png, icon.size, name);
  }
  // The worker keeps every file the lock needs, each one real, and names its cache for them.
  const sw = readFileSync(path.join(assets, 'sw.js'), 'utf8');
  const shell = JSON.parse(sw.match(/const SHELL = (\[.*\]);/)[1]);
  for (const file of shell) assert.ok(file === '/' || file === '/now/' || readFileSync(path.join(assets, file.slice(1))).length >= 0, file);
  for (const needed of ['/', '/now/', '/lock.js', '/mutex.js', '/mutex.css', '/visit-head.js', '/now.json']) assert.ok(shell.includes(needed), needed);
  assert.match(sw, /const CACHE = "mutex-[0-9a-f]{12}";/);
  const headers = readFileSync(path.join(assets, '_headers'), 'utf8');
  assert.match(headers, /\/sw\.js\n  Cache-Control: no-cache/);
  assert.match(headers, /\/manifest\.webmanifest\n  Cache-Control: public, max-age=300\n  Content-Type: application\/manifest\+json/);
  for (const page of ['index.html', 'now/index.html']) {
    const html = readFileSync(path.join(assets, page), 'utf8');
    for (const tag of ['<link rel="manifest" href="/manifest.webmanifest">', '<meta name="theme-color" content="#120d07">', '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">']) assert.ok(html.includes(tag), `${page}: ${tag}`);
  }
  // Framed on attention.productions, /now/ registers nothing.
  assert.match(readFileSync(path.join(assets, 'mutex.js'), 'utf8'), /"serviceWorker" in navigator && window\.top === window/);
});

test('the moment has a clock at every grain: the ISO week, the day of the hold, and the hour, said as Spw beside the rule\'s clock', () => {
  const weeks = { '2026-11-27': [2026, 48], '2027-01-01': [2026, 53], '2026-12-28': [2026, 53], '2027-01-04': [2027, 1], '2025-12-29': [2026, 1], '2027-12-31': [2027, 52] };
  for (const [day, [year, week]] of Object.entries(weeks)) assert.deepEqual(isoWeek(new Date(`${day}T12:00:00Z`)), { year, week }, day);
  for (const day of days(SCHEDULE.from, SCHEDULE.until)) {
    const holder = holderFor(day);
    const d = dayOf(holder, day);
    // A and B run thirteen days, so the day of the hold is the month's day modulo 13; C runs to the month's end.
    if (holder.cycle !== 'C') assert.equal(d.of, 13, `${day.toISOString()} ${holder.cycle}`);
    else assert.ok(d.of >= 2 && d.of <= 5, `${day.toISOString()} C runs ${d.of}`);
    assert.equal(d.index, ((day.getUTCDate() - 1) % 13) + 1, day.toISOString());
    const line = clockLine(holder, day);
    assert.match(line, /^\$clock\[utc\]\{w\d{1,2}, day \d{1,2}\/\d{1,2}\}$/);
    assert.ok(whole(line), line);
  }
});

test('a return says what changed since the last look, and every visit says when the next thing will', () => {
  const now = new Date('2026-11-27T15:37:00Z');
  assert.equal(nextTurnIn(holderFor(now), now), 23);
  assert.equal(sinceWords(null, now), 'A new detail of the holder every hour, and a new holder at each close. The next detail turns in 23 minutes.');
  assert.equal(sinceWords(seenAt(new Date('2026-11-27T15:05:00Z')), now), 'Same hour as your last look. The next detail turns in 23 minutes.');
  assert.equal(sinceWords(seenAt(new Date('2026-11-27T13:05:00Z')), now), 'Since your last look, 3 hours ago: 2 new details of factshift cabinet. The next detail turns in 23 minutes.');
  assert.equal(sinceWords(seenAt(new Date('2026-11-24T09:00:00Z')), now), 'Since your last look, 3 days ago: Teal Stripes Vibes wash let go, and factshift cabinet took the frame. The next detail turns in 23 minutes.');
  assert.match(sinceWords(seenAt(new Date('2026-11-02T09:00:00Z')), now), /^Since your last look, 4 weeks ago: 2 closes passed, and factshift cabinet holds the frame now\./);
  // The hold's last hour has no next detail: the close comes next.
  assert.match(sinceWords(null, new Date('2026-11-30T23:30:00Z')), /The lock lets go at the close\.$/);
  // A look kept from the future (a clock set wrong) or a broken record reads as a first visit.
  assert.match(sinceWords({ at: now.getTime() + 60_000, since: 'x' }, now), /^A new detail/);
  assert.match(sinceWords({ nonsense: true }, now), /^A new detail/);
  // What is kept is the moment and the holder, nothing about the reader.
  assert.deepEqual(Object.keys(seenAt(now)).sort(), ['at', 'since', 'title', 'turn']);
});

test('the lock is a tool: a calendar of its holds, an embed, a module, and a return laid out before first paint', () => {
  const ics = readFileSync(path.join(assets, 'closes.ics'), 'utf8');
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
  assert.doesNotMatch(ics.replace(/\r\n/g, ''), /[\r\n]/, 'every line ends in CRLF');
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, `folded: ${line}`);
  assert.doesNotMatch(ics, /[ \t]+\r\n/, 'folds keep spaces on the continuation line');
  const schedule = JSON.parse(readFileSync(path.join(assets, 'now.json'), 'utf8'));
  const events = ics.split('BEGIN:VEVENT').slice(1);
  assert.equal(events.length, schedule.holds.length);
  assert.ok(events[0].includes(`DTSTART;VALUE=DATE:${schedule.holds[0].since.slice(0, 10).replace(/-/g, '')}`));
  assert.equal(new Set(events.map((e) => e.match(/UID:(\S+)/)[1])).size, events.length, 'each event has its own UID');
  const headers = readFileSync(path.join(assets, '_headers'), 'utf8');
  assert.match(headers, /\/\*\.ics\n  Cache-Control: public, max-age=3600\n  Content-Type: text\/calendar; charset=UTF-8/);
  assert.match(headers, /\/lock\.js\n  Access-Control-Allow-Origin: \*/);
  assert.match(headers, /\/lib\/\*\n  Access-Control-Allow-Origin: \*/);
  const home = readFileSync(path.join(assets, 'index.html'), 'utf8');
  assert.ok(home.includes('<script src="/visit-head.js"></script>'), 'the return is laid out before first paint');
  assert.ok(home.indexOf('/visit-head.js') < home.indexOf('/mutex.js') && home.indexOf('/visit-head.js') < home.indexOf('</head>'), 'it runs in the head, before the page script');
  assert.doesNotMatch(readFileSync(path.join(assets, 'now/index.html'), 'utf8'), /visit-head/, 'an embed keeps no look');
  assert.ok(home.includes('id="since"') && home.includes('id="clock-line"') && home.includes('class="uses"'));
  assert.ok(home.includes('&lt;iframe src=&quot;https://mutex.buzz/now/&quot;'), 'the embed code is on the page');
  const visit = readFileSync(path.join(assets, 'visit-head.js'), 'utf8');
  assert.match(visit, /localStorage\.getItem\("mutex\.buzz:seen"\)/);
  assert.match(readFileSync(path.join(assets, 'mutex.js'), 'utf8'), /const SEEN_KEY = "mutex\.buzz:seen";/);
});
