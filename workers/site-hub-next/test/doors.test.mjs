import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../src/index.js';

const cluster = JSON.parse(readFileSync(new URL('../../cluster.json', import.meta.url), 'utf8'));
const hosts = cluster.units.find((unit) => unit.id === 'site-hub-next').hosts;

const get = (host, path) => worker.fetch(new Request(`https://${host}${path}`));

test('every site-hub host is a product page or a door', async () => {
  const eco = await (await get('boon.land', '/ecosystem.json')).json();
  assert.equal(eco.schema, 'ecosystem.v1');
  const named = new Set([
    ...eco.products.map((product) => product.host),
    ...eco.doors.map((door) => door.host),
  ]);
  for (const host of hosts) {
    assert.equal(named.has(host), true, host);
    const page = await get(host, '/');
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
  assert.equal(mutex.href, 'https://attention.productions/');
});

test('texture keeps its lab and names the set', async () => {
  const page = await get('texture.website', '/');
  const html = await page.text();
  assert.match(html, /Take one with you/);
  assert.match(html, /attention\.productions/);
  const registry = await (await get('texture.website', '/registry.json')).json();
  assert.equal(registry.concept, 'grain');
  const other = await (await get('boon.land', '/registry.json')).json();
  assert.equal(other.schema, 'ecosystem.v1');
});
