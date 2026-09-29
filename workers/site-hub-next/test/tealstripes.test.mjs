import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { GROUND, SEEDS, parseFilters, parseMask, signMask, stampFor, vibe } from '../src/tealstripes.js';

const KEY = 'test-signing-key';
const NOW = '2026-10-13T21:30:00Z';
const env = { TSV_SIGNING_KEY: KEY, NOW };
const get = (path, init = {}, e = env) => worker.fetch(new Request(`https://tealstripesvibes.com${path}`, init), e);

test('masks read as letters, sigils, or %23, and normalize to letters in facet order', () => {
  assert.equal(parseMask('pr'), 'pr');
  assert.equal(parseMask('rp'), 'pr');
  assert.equal(parseMask('*#'), 'pr');
  assert.equal(parseMask('%23*'), 'pr');
  assert.equal(parseMask('*#@~.$'), 'pramgs');
  assert.equal(parseMask(undefined), 'pramgs');
  assert.equal(parseMask('-'), '');
  assert.equal(parseMask('px'), null);
  assert.deepEqual(parseFilters('night,hush'), ['night', 'hush']);
  assert.deepEqual(parseFilters('night+mono'), ['night', 'mono']);
  assert.equal(parseFilters('loud'), null);
});

test('a mask lets facets through and grounds the rest in teal stripes', () => {
  const v = vibe('harbor', 'p', []);
  assert.deepEqual(v.palette, SEEDS.harbor.palette);
  assert.deepEqual(v.rhythm, GROUND.rhythm);
  assert.equal(v.angle, GROUND.angle);
  const brand = vibe('lantern', '', []);
  assert.deepEqual(brand.palette, GROUND.palette);
  assert.deepEqual(vibe('harbor', 'pramgs', []).rhythm, SEEDS.harbor.rhythm);
});

test('filters run left to right', () => {
  const hushed = vibe('harbor', 'pramgs', ['night', 'hush']);
  assert.deepEqual(hushed.motion, { drift: 0, breath: 0 });
  assert.notDeepEqual(hushed.palette, SEEDS.harbor.palette);
  const a = vibe('lantern', 'p', ['night', 'mono']).palette;
  const b = vibe('lantern', 'p', ['mono', 'night']).palette;
  assert.notDeepEqual(a, b);
});

test('/ sends you to this hour, and the hour always paints the same seed', async () => {
  const home = await get('/');
  assert.equal(home.status, 302);
  assert.equal(home.headers.get('location'), '/@2026-10-13T21');
  const a = await (await get('/@2026-10-13T21')).text();
  const b = await (await get('/@2026-10-13T21')).text();
  assert.equal(a.match(/<h1>([^<]+)<\/h1>/)[1], b.match(/<h1>([^<]+)<\/h1>/)[1]);
});

test('paths and query strings render the same vibe with a canonical link', async () => {
  const path = await get('/harbor/pr/night');
  assert.equal(path.status, 200);
  assert.match(path.headers.get('link'), /<https:\/\/tealstripesvibes\.com\/harbor\/pr\/night>; rel="canonical"/);
  assert.match(path.headers.get('server-timing'), /^vibe;dur=/);
  assert.match(path.headers.get('content-security-policy'), /frame-ancestors 'self' https:\/\/attention\.productions/);
  const query = await get('/?seed=harbor&mask=*%23&filter=night');
  assert.equal(query.headers.get('link'), path.headers.get('link'));
  const html = await path.text();
  assert.match(html, /repeating-linear-gradient\(90deg/);
  assert.match(html, /\^vibe\[harbor\]\{pr,night\}/);
  assert.match(html, /class="stamp"/);
  assert.equal((await get('/nowhere')).status, 404);
});

test('tuples are deterministic data with a strong ETag, 304, digest, and a text form', async () => {
  const one = await get('/tuple?seed=harbor&mask=pr&filter=night');
  assert.equal(one.status, 200);
  assert.equal(one.headers.get('vary'), 'Accept');
  assert.match(one.headers.get('etag'), /^"[0-9a-f]{20}"$/);
  assert.match(one.headers.get('content-digest'), /^sha-256=:[A-Za-z0-9+/=]+:$/);
  const body = await one.json();
  assert.equal(body.mask, 'pr');
  assert.deepEqual(body.filters, ['night']);
  assert.equal(body.names.length, body.tuple.length);
  const again = await get('/tuple?seed=harbor&mask=*%23&filter=night');
  assert.equal(again.headers.get('etag'), one.headers.get('etag'));
  const cached = await get('/tuple?seed=harbor&mask=pr&filter=night', { headers: { 'If-None-Match': one.headers.get('etag') } });
  assert.equal(cached.status, 304);
  const text = await (await get('/tuple?seed=harbor&mask=pr&filter=night', { headers: { Accept: 'text/plain' } })).text();
  assert.match(text, /^\^vibe\[harbor\]\{pr,night\}<.+>\n$/);
  const many = await (await get('/tuple?seed=harbor&seed=ledger')).json();
  assert.equal(many.tuples.length, 2);
  const json = await (await get('/ledger/ag.json')).json();
  assert.equal(json.mask, 'ag');
  const head = await get('/harbor', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('signed masks live until they close, then answer 410; a bad signature is 403', async () => {
  const exp = Math.floor(Date.parse('2026-10-14T00:00:00Z') / 1000);
  const sig = await signMask(KEY, 'harbor', 'pr', ['night'], exp);
  const live = await get(`/m/harbor.pr.night.${exp}.${sig}`);
  assert.equal(live.status, 200);
  assert.match(live.headers.get('cache-control'), /^public, max-age=\d+, immutable$/);
  assert.equal(live.headers.get('sunset'), new Date(exp * 1000).toUTCString());
  assert.equal(live.headers.get('expires'), new Date(exp * 1000).toUTCString());
  const gone = await get(`/m/harbor.pr.night.${exp}.${sig}`, {}, { ...env, NOW: '2026-10-14T00:00:01Z' });
  assert.equal(gone.status, 410);
  assert.match(gone.headers.get('link'), /rel="predecessor-version"/);
  assert.match(await gone.text(), /This mask has closed/);
  const forged = await get(`/m/harbor.pr.night.${exp + 3600}.${sig}`);
  assert.equal(forged.status, 403);
  const unkeyed = await get(`/m/harbor.pr.night.${exp}.${sig}`, {}, { NOW });
  assert.equal(unkeyed.status, 503);
});

test('a stamp is valid in its hour, expired after, unknown when forged', async () => {
  const code = await stampFor(KEY, '2026-10-13T21', 'harbor', 'pr');
  const ok = await get(`/stamp/${code}?seed=harbor&mask=pr&hour=2026-10-13T21`);
  assert.equal(ok.status, 200);
  assert.match(await ok.text(), /^valid, harbor through pr, issued 2026-10-13T21:00Z, closes 2026-10-13T22:00Z/);
  const late = await get(`/stamp/${code}?seed=harbor&mask=pr&hour=2026-10-13T21`, {}, { ...env, NOW: '2026-10-13T22:05:00Z' });
  assert.equal(late.status, 410);
  const wrong = await get(`/stamp/${code}?seed=ledger&mask=pr&hour=2026-10-13T21`);
  assert.equal(wrong.status, 404);
  const card = await (await get('/harbor/pr')).text();
  assert.match(card, new RegExp(`/stamp/${code}\\?seed=harbor&amp;mask=pr&amp;hour=2026-10-13T21`));
});

test('the preview image is an SVG of the same stripes', async () => {
  const og = await get('/og/lantern/pr.svg');
  assert.equal(og.status, 200);
  assert.match(og.headers.get('content-type'), /image\/svg\+xml/);
  assert.match(await og.text(), /<pattern id="s"/);
});
