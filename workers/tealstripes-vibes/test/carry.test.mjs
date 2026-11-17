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
  for (const [file, body] of await carriedWithWorker()) assert.equal(readFileSync(path.join(assets, file), 'utf8'), body, `assets/${file}: run node workers/tealstripes-vibes/carry.mjs`);
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
