// The files spw.quest serves without its worker (src/crawl.js): routing, headers, robots and sitemap.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/index.js';
import { CONSTANT_ANSWERS, ROBOTS, STABLE_ROOMS, STATIC_PATTERNS, robotsFor, sitemap } from '../src/crawl.js';
import { SHELL_VERSION } from '../src/shell-pin.js';
import { PEER_FONTS, PEER_SCRIPTS } from '../../lib/peer-kit.js';

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

const walk = (dir, prefix = '') => readdirSync(dir).flatMap((name) => {
  const full = path.join(dir, name);
  return statSync(full).isDirectory() ? walk(full, `${prefix}/${name}`) : [`${prefix}/${name}`];
});
const FILES = walk(assetsDir);
const glob = (pattern) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);

/** assets/_headers as { pattern: { header: value } }, in file order. */
function readHeaders() {
  const rules = [];
  let current = null;
  for (const line of readFileSync(path.join(assetsDir, '_headers'), 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: {} };
      rules.push(current);
    } else {
      const at = line.indexOf(':');
      current.headers[line.slice(0, at).trim().toLowerCase()] = line.slice(at + 1).trim();
    }
  }
  return rules;
}

test('wrangler sends the static patterns to the assets layer, and each names files that exist', () => {
  const config = JSON.parse(readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  assert.deepEqual(config.assets.run_worker_first, ['/*', ...STATIC_PATTERNS.map((pattern) => `!${pattern}`)]);
  for (const pattern of STATIC_PATTERNS) assert.ok(FILES.some((file) => glob(pattern).test(file)), pattern);
  // The worker keeps everything that is a page, and the parser's pages and redirects.
  for (const page of ['/', '/learn', '/install', '/parser/', '/parser/2026.10.13/', '/parser/latest.js', '/manifest.webmanifest', '/offline']) {
    assert.ok(!STATIC_PATTERNS.some((pattern) => glob(pattern).test(page)), page);
  }
});

test('assets/_headers restates what the worker sends for each static file', async () => {
  const rules = readHeaders();
  const samples = [
    `/fonts/${PEER_FONTS[0].file}`,
    `/peer/${PEER_SCRIPTS[0].file}`,
    '/icons/quest-192.png',
    '/sw.js',
    '/parser/index.json',
    '/parser/2026.10.13/reader.min.js',
    '/parser/2026.10.13/manifest.json',
    '/parser/2026.10.13/reader.debug.js.map',
    ...CONSTANT_ANSWERS,
  ];
  for (const sample of samples) {
    const rule = rules.find((candidate) => glob(candidate.pattern).test(sample));
    assert.ok(rule, `${sample} has a rule`);
    assert.equal(rules.filter((candidate) => glob(candidate.pattern).test(sample)).length, 1, `${sample} matches one rule, so no header is doubled`);
    const response = await get(sample);
    assert.equal(response.status, 200, sample);
    for (const [name, value] of Object.entries(rule.headers)) assert.equal(response.headers.get(name), value, `${sample} ${name}`);
  }
  assert.equal(rules.find((rule) => rule.pattern === '/sw.js').headers['x-spw-shell'], SHELL_VERSION);
});

test('each constant answer is a file that says exactly what the worker says, so llms.txt never needs the worker', async () => {
  for (const address of CONSTANT_ANSWERS) {
    const response = await get(address);
    assert.equal(response.status, 200, address);
    assert.equal(readFileSync(path.join(assetsDir, address), 'utf8'), await response.text(), `${address}: run carry-answers.mjs`);
    assert.equal(response.headers.get('Vary'), null, `${address} does not vary by reader, so one file serves everyone`);
  }
  assert.ok(!CONSTANT_ANSWERS.includes('/'), '/ answers text, JSON or a page by Accept, so it stays with the worker');
});

test('robots welcomes crawlers to every page and names the sitemap; the sitemap names rooms that open', async () => {
  assert.equal(readFileSync(path.join(assetsDir, 'robots.txt'), 'utf8'), ROBOTS);
  assert.equal(readFileSync(path.join(assetsDir, 'sitemap.xml'), 'utf8'), sitemap());
  assert.equal(await (await get('/robots.txt')).text(), ROBOTS);
  assert.match(ROBOTS, /^Allow: \/$/m);
  assert.deepEqual(ROBOTS.match(/^Disallow: .+$/gm), ['Disallow: /script.spw', 'Disallow: /canvas']);
  for (const room of STABLE_ROOMS) assert.equal((await get(room)).status, 200, room);
});

test('stable rooms and dated releases ask to be indexed; query variants are followed, not indexed; a missing page is neither', async () => {
  const robots = async (p) => {
    const response = await get(p);
    const html = await response.text();
    const meta = html.match(/<meta name="robots" content="([^"]*)">/)?.[1];
    return { status: response.status, type: response.headers.get('Content-Type'), header: response.headers.get('X-Robots-Tag'), meta, metas: html.match(/<meta name="robots"/g)?.length ?? 0 };
  };
  for (const room of STABLE_ROOMS) {
    const seen = await robots(room);
    // /init and /llms.txt are text, which a crawler indexes without being asked.
    if (!seen.type.startsWith('text/html')) {
      assert.equal(seen.header, null, room);
      continue;
    }
    assert.equal(seen.header, 'index, follow', room);
    assert.equal(seen.meta, 'index, follow', room);
    assert.equal(seen.metas, 1, `${room} has one robots line`);
  }
  for (const variant of ['/?s=hearth', '/build?subject=garden', '/specimens?q=%5Bearned%5D', '/pivot?a=subject']) {
    const seen = await robots(variant);
    assert.equal(seen.status, 200, variant);
    assert.equal(seen.header, 'noindex, follow', variant);
    assert.equal(seen.meta, 'noindex, follow', variant);
  }
  const missing = await robots('/no-such-room');
  assert.equal(missing.status, 404);
  assert.equal(robotsFor(new URL('https://spw.quest/no-such-room'), 404), 'noindex');
  assert.equal(robotsFor(new URL('https://spw.quest/parser/2026.10.13/')), 'index, follow');
  assert.equal(robotsFor(new URL('https://spw.quest/parser/2026.10.13/reader.min.js')), 'noindex, follow');
  // Files that are not pages keep their own headers.
  assert.equal((await get('/robots.txt')).headers.get('X-Robots-Tag'), null);
  assert.equal((await get('/manifest.webmanifest')).headers.get('X-Robots-Tag'), null);
});
