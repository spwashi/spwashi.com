import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../src/index.js';
import { DOOR_HOSTS, renderDoor } from '../src/hosts/doors.js';
import { doorId } from '../carry-doors.mjs';

const cluster = JSON.parse(readFileSync(new URL('../../cluster.json', import.meta.url), 'utf8'));

const get = (host, path) => worker.fetch(new Request(`https://${host}${path}`));

test('the script still answers a door and the hosts whose routes may not have moved', async () => {
  const eco = await (await get('boon.land', '/ecosystem.json')).json();
  assert.equal(eco.schema, 'ecosystem.v1');
  const named = new Set([
    ...eco.products.map((product) => product.host),
    ...eco.doors.map((door) => door.host),
  ]);
  for (const host of [...DOOR_HOSTS, 'attention.productions', 'mutex.buzz', 'tealstripesvibes.com']) {
    assert.equal(named.has(host), true, host);
    let page = await get(host, '/');
    if (host === 'tealstripesvibes.com') {
      assert.equal(page.status, 302, host);
      page = await get(host, page.headers.get('location'));
    }
    assert.equal(page.status, 200, host);
    const html = await page.text();
    assert.doesNotMatch(html, /site-hub-next|constellation hub|github-pages/);
  }
});

test('attention.productions is the season page', async () => {
  const before = await get('attention.productions', '/');
  assert.equal(before.headers.get('x-robots-tag'), 'index, follow');
  const html = await before.text();
  assert.match(html, /Attention Productions/);
  assert.match(html, /2027/);
  assert.match(html, /https:\/\/spwashi\.com\/cards\/#back-the-film/);
  assert.match(html, /mutex\.buzz/);
  assert.match(html, /factshift\.center/);
  assert.match(html, /October 1/);
  const robots = await (await get('attention.productions', '/robots.txt')).text();
  assert.match(robots, /Allow: \//);
});

test('a held name stays a door', async () => {
  const page = await get('boon.land', '/');
  assert.equal(page.headers.get('x-robots-tag'), 'noindex');
  const html = await page.text();
  assert.match(html, /neutral frame/);
  assert.match(html, /about\/domains\/boon\.land/);
  const eco = await (await get('mutex.buzz', '/ecosystem.json')).json();
  const mutex = eco.doors.find((door) => door.host === 'mutex.buzz');
  assert.equal(mutex.href, 'https://mutex.buzz/now/');
});

test('a door page is its host alone, carried as that host\'s files worker', async () => {
  assert.deepEqual(cluster.units.find((unit) => unit.id === 'site-hub-next').hosts, []);
  for (const host of DOOR_HOSTS) {
    assert.equal(await (await get(host, '/')).text(), renderDoor(host), host);
    const id = doorId(host);
    const unit = cluster.units.find((item) => item.id === id);
    assert.deepEqual(unit.hosts, [host], host);
    assert.equal(unit.script, id);
    assert.equal(cluster.serving.tiers[id].now, 'files', host);
    const wrangler = JSON.parse(readFileSync(new URL(`../../${id}/wrangler.jsonc`, import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
    assert.equal(wrangler.main, undefined, host);
    assert.equal(wrangler.assets.directory, './assets');
    assert.equal(readFileSync(new URL(`../../${id}/assets/index.html`, import.meta.url), 'utf8'), renderDoor(host), host);
  }
});

test('a door names the set in its registry', async () => {
  const other = await (await get('boon.land', '/registry.json')).json();
  assert.equal(other.schema, 'ecosystem.v1');
});
