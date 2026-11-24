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
  // A folder address is answered by its index.html.
  for (const pattern of STATIC_PATTERNS) assert.ok(FILES.some((file) => glob(pattern.endsWith('/') ? `${pattern}index.html` : pattern).test(file)), pattern);
  // The worker keeps everything that is a page, and the parser's pages and redirects.
  // /build stays: Read and Format post to it, and an existing asset answers POST with 405.
  for (const page of ['/learn', '/install', '/build', '/parser/', '/parser/2026.10.13/', '/parser/latest.js', '/manifest.webmanifest', '/offline']) {
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
    '/',
    '/pivot', '/specimens', '/physics', '/constructs',
    '/shelf/', '/shelf/plans/', '/forms/', '/arcs/', '/bench/',
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
  assert.ok(!CONSTANT_ANSWERS.includes('/'), '/ is carried as a page by carry-guide.mjs, not as a constant answer');
});

test("the guide's front page is a file that says exactly what the worker renders for / with no query", async () => {
  const response = await get('/');
  assert.equal(response.status, 200);
  assert.equal(readFileSync(path.join(assetsDir, 'index.html'), 'utf8'), await response.text(), '/: run carry-guide.mjs');
});

test('pivot, specimens, physics and constructs are files of the page the worker renders with no query', async () => {
  for (const room of ['/pivot', '/specimens', '/physics', '/constructs']) {
    const response = await get(room);
    assert.equal(response.status, 200, room);
    assert.equal(readFileSync(path.join(assetsDir, room.slice(1)), 'utf8'), await response.text(), `${room}: run carry-rooms.mjs`);
  }
});

test('robots keeps crawlers to the rooms and names the sitemap; the sitemap names rooms that open', async () => {
  assert.equal(readFileSync(path.join(assetsDir, 'robots.txt'), 'utf8'), ROBOTS);
  assert.equal(readFileSync(path.join(assetsDir, 'sitemap.xml'), 'utf8'), sitemap());
  assert.equal(await (await get('/robots.txt')).text(), ROBOTS);
  assert.match(ROBOTS, /^Allow: \/$/m);
  assert.deepEqual(ROBOTS.match(/^Disallow: .+$/gm), ['Disallow: /*?', 'Disallow: /script.spw', 'Disallow: /canvas', 'Disallow: /read', 'Disallow: /card', 'Disallow: /*%3C', 'Disallow: /*%5B', 'Disallow: /*%7B', 'Disallow: /*(']);
  assert.match(ROBOTS, /^Crawl-delay: \d+$/m);
  // No room is disallowed: a room's address has no query and no brace.
  for (const room of STABLE_ROOMS) assert.ok(!/[?<[{(]/.test(room), room);
  for (const room of STABLE_ROOMS) assert.equal((await get(room)).status, 200, room);
});

test('stable rooms and dated releases ask to be indexed; query variants are neither indexed nor followed; a missing page is neither', async () => {
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
    assert.equal(seen.header, 'noindex, nofollow', variant);
    assert.equal(seen.meta, 'noindex, nofollow', variant);
  }
  const missing = await robots('/no-such-room');
  assert.equal(missing.status, 404);
  assert.equal(robotsFor(new URL('https://spw.quest/no-such-room'), 404), 'noindex');
  assert.equal(robotsFor(new URL('https://spw.quest/parser/2026.10.13/')), 'index, follow');
  assert.equal(robotsFor(new URL('https://spw.quest/parser/2026.10.13/reader.min.js')), 'noindex, nofollow');
  // Files that are not pages keep their own headers.
  assert.equal((await get('/robots.txt')).headers.get('X-Robots-Tag'), null);
  assert.equal((await get('/manifest.webmanifest')).headers.get('X-Robots-Tag'), null);
});

/** Whether robots.txt keeps a crawler from an address, as Google reads it: the longest matching rule wins, and Allow wins a tie. */
function disallowed(href) {
  const url = new URL(href.replace(/&amp;/g, '&'), 'https://spw.quest/');
  const target = url.pathname.replace(/[<>[\]{}]/g, (c) => encodeURIComponent(c)) + url.search;
  const rules = [...ROBOTS.matchAll(/^(Allow|Disallow): (.+)$/gm)].map(([, kind, pattern]) => ({ kind, pattern, re: new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*').replace(/\*/g, '.*')}`) }));
  const hits = rules.filter((rule) => rule.re.test(target)).sort((a, b) => b.pattern.length - a.pattern.length || (a.kind === 'Allow' ? -1 : 1));
  return hits[0]?.kind === 'Disallow';
}

test('a crawler that keeps robots.txt reaches only a finite set of addresses from the rooms, and reads the corpus in one file', async () => {
  for (const room of ['/specimens', '/build', '/pivot', '/constructs', '/learn', '/physics']) {
    const html = (await (await get(room)).text()).split(/<script\b[\s\S]*?<\/script>/).join('');
    const reached = new Set();
    for (const [, href] of html.matchAll(/<a\b[^>]*\shref="([^"]*)"/g)) {
      const url = new URL(href.replace(/&amp;/g, '&'), 'https://spw.quest/');
      if (url.origin !== 'https://spw.quest' || disallowed(href)) continue;
      reached.add(url.pathname);
    }
    // What is left is rooms, the parser's dated pages, and a few files: no query, no line, no brace.
    for (const pathname of reached) assert.ok(!/[<[{(]|%3C|%5B|%7B/i.test(pathname), `${room} lets a crawler reach ${pathname}`);
    assert.ok(reached.size < 60, `${room} reaches ${reached.size} addresses`);
  }
  for (const href of ['/specimens?q=x', '/build?subject=garden', '/pivot?a=subject', '/canvas?s=1', '/script.spw', '/read?line=a', '/card?line=a', '/rpgwednesday%3Ccard%3E', '/rpgwednesday<card>', '/x(scene)']) assert.ok(disallowed(href), href);
  for (const href of STABLE_ROOMS) assert.ok(!disallowed(href), href);
  const corpus = JSON.parse(readFileSync(path.join(assetsDir, 'specimens.json'), 'utf8'));
  assert.equal(corpus.schema, 'specimens.v1');
  assert.equal(corpus.count, corpus.specimens.length);
  assert.ok(corpus.count > 1000, `${corpus.count} specimens`);
  assert.ok(corpus.specimens.every((s) => s.id && s.line), 'each has an id and a line');
  assert.ok(!('reading' in corpus.specimens[0]), 'the painted reading stays on the page');
});
