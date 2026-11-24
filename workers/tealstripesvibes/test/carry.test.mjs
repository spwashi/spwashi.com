// tealstripesvibes.com as files first: the shell paints any address in the browser, the worker keeps signing and machine routes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP, ICONS, SCRIPT_ROUTES, carriedWithWorker } from '../carry.mjs';
import worker from '../src/index.js';
import { handleTealstripes } from '../src/server.js';
import { ALL, SEEDS, expressionOf, maskLabel, readAddress, vibe, vibeCss } from '../src/vibe.js';

const root = path.dirname(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)));
const assets = path.join(root, 'assets');
const NOW = '2026-11-17T01:30:00Z';
const serve = (address, env = {}) => handleTealstripes(new Request(`https://tealstripesvibes.com${address}`), { NOW, ...env });

test('the unit runs its worker only for the routes that need one, and falls back to the shell for every other address', () => {
  const config = JSON.parse(readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(config.main, 'src/index.js');
  assert.equal(config.assets.not_found_handling, 'single-page-application');
  assert.deepEqual(config.assets.run_worker_first, [...SCRIPT_ROUTES]);
});

test('each carried file is what carry.mjs writes, and the pure part the page imports is the one the worker uses', async () => {
  for (const [file, body] of await carriedWithWorker()) assert.equal(readFileSync(path.join(assets, file), 'utf8'), body, `assets/${file}: run node workers/tealstripesvibes/carry.mjs`);
  assert.equal(readFileSync(path.join(assets, 'vibe.js'), 'utf8'), readFileSync(path.join(root, 'src/vibe.js'), 'utf8'));
});

test('the page reads an address to the same vibe the worker renders for it', async () => {
  const addresses = ['/@2026-11-17T01', '/@2026-11-17', '/harbor', '/ledger/pr', '/lantern/pram/night', '/harbor/*%23', '/harbor/-/hush', '/?seed=ledger&mask=pr&filter=mono', '/lantern/pr/night,hush'];
  for (const address of addresses) {
    const [pathname, search = ''] = address.split('?');
    const place = readAddress(pathname, search ? `?${search}` : '', new Date(NOW));
    assert.notEqual(place.kind, 'unknown', address);
    const html = await (await serve(address)).text();
    const v = vibe(place.seed, place.mask, place.filters);
    assert.ok(html.includes(expressionOf(place.seed, place.mask, place.filters, v).replaceAll('<', '&lt;').replaceAll('>', '&gt;')), `${address} renders ${place.seed} ${maskLabel(place.mask)}`);
    assert.ok(html.includes(`${place.hour}Z`), `${address} at ${place.hour}`);
  }
  // "/" is this hour, as the worker's redirect says.
  const redirect = await serve('/');
  assert.equal(redirect.status, 302);
  assert.equal(readAddress('/', '', new Date(NOW)).redirect, redirect.headers.get('location'));
  // What the worker says is not a vibe, the page says is not a vibe.
  for (const address of ['/nope', '/harbor/zz', '/harbor/pr/loud', '/a/b/c/d', '/@2026-13-40']) {
    assert.equal(readAddress(address, '', new Date(NOW)).kind, 'unknown', address);
    assert.equal((await serve(address)).status, 404, address);
  }
});

test('a seed written whole reads with scripts off: its stripes, its card and its expression are in the file', () => {
  for (const seed of Object.keys(SEEDS)) {
    const page = readFileSync(path.join(assets, `${seed}.html`), 'utf8');
    const v = vibe(seed, ALL, []);
    assert.ok(page.includes(vibeCss(v)), `${seed}: its stripes`);
    assert.ok(page.includes(`<h1 id="seed-name">${seed}</h1>`), `${seed}: its card`);
    assert.ok(page.includes(expressionOf(seed, ALL, [], v).replaceAll('<', '&lt;').replaceAll('>', '&gt;')), `${seed}: its expression`);
  }
  for (const page of ['index.html', 'harbor.html']) assert.doesNotMatch(readFileSync(path.join(assets, page), 'utf8'), /<script>|\son[a-z]+=/i, `${page}: no inline script or handler`);
  assert.match(CSP, /script-src 'self';/);
  assert.match(CSP, /frame-ancestors 'self' https:\/\/attention\.productions https:\/\/mutex\.buzz/);
});

test('the worker answers the routes that need it and leaves the set\'s files to the assets layer', async () => {
  const assetsSeen = [];
  const env = { NOW, ASSETS: { fetch: async (request) => { assetsSeen.push(new URL(request.url).pathname); return new Response('{}'); } } };
  const ask = (address) => worker.fetch(new Request(`https://tealstripesvibes.com${address}`), env);
  assert.equal((await ask('/tuple?seed=harbor&mask=pr')).status, 200);
  assert.match((await ask('/og/harbor/pr.svg')).headers.get('content-type'), /image\/svg\+xml/);
  assert.equal((await ask('/harbor.json')).status, 200);
  assert.equal((await ask('/m/harbor.pr.night.1893456000.deadbeef')).status, 503, 'no key, as before');
  assert.equal((await ask('/stamp/abcde?seed=harbor&mask=pr&hour=2026-11-17T01')).status, 503);
  await ask('/ecosystem.json');
  assert.deepEqual(assetsSeen, ['/ecosystem.json']);
});

test('it installs: a manifest with a shortcut per seed, icons, and a worker that keeps the shell', () => {
  const manifest = JSON.parse(readFileSync(path.join(assets, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.deepEqual(manifest.shortcuts.map((s) => s.url), Object.keys(SEEDS).map((s) => `/${s}`));
  for (const [name, icon] of Object.entries(ICONS)) {
    const png = readFileSync(path.join(assets, 'icons', name));
    assert.ok(png.subarray(1, 4).toString() === 'PNG' && png.readUInt32BE(16) === icon.size, name);
  }
  const sw = readFileSync(path.join(assets, 'sw.js'), 'utf8');
  const shell = JSON.parse(sw.match(/const SHELL = (\[.*\]);/)[1]);
  for (const needed of ['/index.html', '/tealstripes.js', '/vibe.js', '/tealstripes.css', '/harbor']) assert.ok(shell.includes(needed), needed);
  assert.match(sw, /caches\.match\("\/index\.html"\)/, 'offline, any address paints from the shell');
  assert.match(sw, /SCRIPTED = /, 'the worker\'s routes are never kept');
  assert.match(readFileSync(path.join(assets, 'tealstripes.js'), 'utf8'), /"serviceWorker" in navigator && window\.top === window/);
});

test('the new stripes: a Euclidean rhythm by Bjorklund\'s algorithm, Fibonacci at the golden angle, and a moiré', async () => {
  const { bjorklund, euclidRhythm, EUCLID } = await import('../src/vibe.js');
  // The rhythms a drummer would name.
  assert.equal(bjorklund(3, 8).join(''), '10010010', 'the tresillo');
  assert.equal(bjorklund(5, 8).join(''), '10110110', 'the cinquillo');
  assert.equal(bjorklund(7, 16).join(''), '1001010100101010');
  assert.equal(bjorklund(4, 12).join(''), '100100100100');
  for (let n = 2; n <= 16; n += 1) for (let k = 1; k <= n; k += 1) {
    const p = bjorklund(k, n);
    assert.equal(p.length, n);
    assert.equal(p.filter(Boolean).length, k, `E(${k},${n}) has ${k} beats`);
    assert.equal(euclidRhythm(k, n, 1).reduce((a, b) => a + b, 0), n, `E(${k},${n}) widths fill the steps`);
  }
  assert.deepEqual(vibe('harbor', ALL, ['euclid']).rhythm, euclidRhythm(EUCLID.k, EUCLID.n));
  const golden = vibe('ledger', ALL, ['golden']);
  assert.deepEqual([golden.angle, golden.rhythm], [137.5, [2, 2, 4, 6, 10, 16, 26]]);
  assert.ok(vibeCss(vibe('lantern', ALL, ['moire'])).includes('.field::after'), 'the moiré is a second layer');
  assert.ok(!vibeCss(vibe('lantern', ALL, [])).includes('::after'));
  // The worker reads the new filters too.
  assert.equal((await serve('/harbor/-/moire,euclid')).status, 200);
});

test('a hand\'s tuning is held to its ranges, carried in the address, and read back as the same picture', async () => {
  const { readTuning, tune, TUNING } = await import('../src/vibe.js');
  const t = readTuning(new URLSearchParams('angle=400&drift=1.23&grain=x&beats=9&steps=5&turn=1'));
  assert.deepEqual(t, { angle: TUNING.angle.max, drift: 1.2, turn: 1, beats: 5, steps: 5 });
  const place = readAddress('/lantern/pr/moire', '?angle=40&drift=1.2&beats=3&steps=8&turn=1&say=%3Cb%3Ehello%3C%2Fb%3E%20there', new Date(NOW));
  assert.equal(place.say, 'bhello/b there', 'a caption keeps no markup');
  assert.equal(place.href, 'https://tealstripesvibes.com/lantern/palette,rhythm/moire?v=7sy0kehdf&say=bhello%2Fb%20there');
  const again = readAddress(...new URL(place.href).pathname.split('?'), new URL(place.href).search, new Date(NOW));
  assert.deepEqual([again.tuning, again.say], [place.tuning, place.say], 'the address reads back as itself');
  const v = tune(vibe(place.seed, place.mask, place.filters), place.tuning);
  assert.equal(v.angle, 40);
  assert.equal(v.motion.drift, 1.2);
  assert.deepEqual(v.rhythm, [9, 9, 6], 'three beats in eight steps');
  assert.equal(v.palette[0], vibe(place.seed, place.mask, place.filters).palette[1], 'the palette turned once');
  assert.ok(v.moire, 'the filter survives tuning');
});

test('a held slot scans its choices: the others seeds\' values first, then its own family, always including where it is', async () => {
  const { SLOTS, choicesFor, valueOf, turnHue, readTuning, tuningQuery, tuningFor, tune } = await import('../src/vibe.js');
  const v = vibe('harbor', ALL, []);
  for (const slot of SLOTS.filter((s) => s !== 'seed')) {
    const list = choicesFor(slot, v);
    assert.ok(list.some((c) => JSON.stringify(c) === JSON.stringify(valueOf(slot, v))), `${slot}: the scan starts where it is`);
    assert.ok(list.length >= 7, `${slot}: ${list.length} choices`);
  }
  for (const seed of Object.values(SEEDS)) {
    assert.ok(choicesFor('palette', v).some((c) => JSON.stringify(c) === JSON.stringify(seed.palette)), `borrows ${seed.name}'s palette`);
    assert.ok(choicesFor('rhythm', v).some((c) => JSON.stringify(c) === JSON.stringify(seed.rhythm)), `borrows ${seed.name}'s rhythm`);
  }
  // A hue turn keeps each colour's lightness, so the palette stays itself.
  const turned = turnHue(v.palette, 120);
  assert.notDeepEqual(turned, v.palette);
  assert.equal(turnHue(turned, 240).join(), v.palette.join(), 'a full turn comes home');
  // A kept palette and rhythm read back from the address; bad ones are not read.
  const t = readTuning(new URLSearchParams('palette=062a2b-0f766e-a7f3d0&rhythm=3-5-8&angle=45'));
  assert.deepEqual(t, { palette: ['#062a2b', '#0f766e', '#a7f3d0'], rhythm: [3, 5, 8], angle: 45 });
  assert.equal(tuningQuery(t), 'v=4g1&palette=062a2b-0f766e-a7f3d0&rhythm=3-5-8');
  assert.deepEqual(readTuning(new URLSearchParams('palette=zzz&rhythm=0-99')), {});
  // A kept rhythm stands over a Euclidean tuning.
  const kept = tune(v, { beats: 3, steps: 8, ...tuningFor('rhythm', [4, 4, 9]) });
  assert.deepEqual(kept.rhythm, [4, 4, 9]);
});

test('/@lock is the vibe mutex.buzz\'s lock holds: one seed a hold, filling in from the ground to the whole seed', async () => {
  const { lockVibe, holdAt, LOCK, FACETS } = await import('../src/vibe.js');
  const { CSP } = await import('../carry.mjs');
  const hold = { cycle: 'B', title: 'Teal Stripes Vibes wash', since: '2026-11-14T00:00:00.000Z', releasesAt: '2026-11-27T00:00:00.000Z' };
  const at = (iso) => lockVibe(hold, Date.parse(iso));
  assert.equal(at('2026-11-14T00:30:00Z').mask, '', 'its first hour is the ground');
  assert.equal(at('2026-11-26T23:30:00Z').mask, ALL, 'its last hour is the whole seed');
  let last = -1;
  const seeds = new Set();
  for (let h = 0; h < 312; h += 1) {
    const v = lockVibe(hold, Date.parse(hold.since) + h * 3_600_000 + 60_000);
    assert.ok(v.mask.length >= last, `hour ${h}: facets only come through`);
    assert.equal(v.mask, FACETS.slice(0, v.mask.length).map((f) => f.letter).join(''), 'in the facets\' order');
    last = v.mask.length;
    seeds.add(v.seed);
  }
  assert.equal(seeds.size, 1, 'one seed for the whole hold');
  // The lines are mutex.buzz's own for the moment (workers/mutex-buzz/src/lock.js nowLine and turnLine).
  assert.deepEqual(at('2026-11-16T13:30:00Z').lines, ['*holds[B]{teal stripes vibes wash}(november 14 ~> november 26)', '%turn[62/312]{hour}']);
  const { holderFor, nowLine, turnLine, turnOf } = await import('../../mutex-buzz/src/lock.js');
  const moment = new Date('2026-11-16T13:30:00Z');
  assert.deepEqual(at(moment.toISOString()).lines, [nowLine(holderFor(moment)), turnLine(turnOf(holderFor(moment), moment))]);
  assert.equal(holdAt([hold], Date.parse('2027-01-01T00:00:00Z')), null);
  assert.equal(readAddress(LOCK.path, '', new Date(NOW)).kind, 'lock-pending');
  assert.match(CSP, /connect-src 'self' https:\/\/mutex\.buzz;/, 'the page may read the lock');
  assert.ok(readFileSync(path.join(assets, 'index.html'), 'utf8').includes('<a id="lock-link" href="/@lock"'));
});

test('the mask is six chips a hand can switch, each a link to the address with its facet switched', async () => {
  const { facetChips } = await import('../src/vibe.js');
  const chips = facetChips('lantern', 'pramgs', []);
  assert.deepEqual(chips.map((c) => [c.name, c.on, c.href]), [
    ['palette', true, '/lantern/rhythm,angle,motion,grain,plate'], ['rhythm', true, '/lantern/palette,angle,motion,grain,plate'], ['angle', true, '/lantern/palette,rhythm,motion,grain,plate'],
    ['motion', true, '/lantern/palette,rhythm,angle,grain,plate'], ['grain', true, '/lantern/palette,rhythm,angle,motion,plate'], ['plate', true, '/lantern/palette,rhythm,angle,motion,grain'],
  ]);
  assert.equal(facetChips('lantern', '', [])[0].href, '/lantern/palette', 'from the ground, a chip brings its facet through');
  assert.equal(facetChips('harbor', 'p', ['moire'])[0].href, '/harbor/-/moire', 'the filters stay');
  assert.match(facetChips('lantern', 'p', [])[0].title, /palette from lantern; tap for the teal ground's/);
  const page = readFileSync(path.join(assets, 'lantern.html'), 'utf8');
  assert.ok(page.includes('<dt id="mask-from">from lantern</dt>'));
  assert.equal((page.match(/<a class="facet on" href=/g) ?? []).length, 6, 'a seed\'s own page lets every facet through');
  assert.ok(page.includes('<a class="facet on" href="/lantern/rhythm,angle,motion,grain,plate" data-mask="ramgs"'));
});

test('an address Cloudflare escaped (/@ sent on to /%40) reads as it was written', async () => {
  const { readAddress } = await import('../src/vibe.js');
  const at = new Date('2026-11-17T01:30:00Z');
  assert.equal(readAddress('/%40lock', '', at).kind, 'lock-pending');
  assert.equal(readAddress('/%402026-11-17T01', '', at).kind, 'moment');
  assert.equal(readAddress('/%402026-11-17T01', '', at).seed, readAddress('/@2026-11-17T01', '', at).seed);
  assert.equal(readAddress('/%E0%A4%A', '', at).kind, 'unknown', 'a malformed escape is read as it stands');
});
