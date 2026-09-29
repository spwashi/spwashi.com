import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { cycleFor, holderFor } from '../src/mutex.js';

const at = (iso) => ({ NOW: iso });
const get = (path, e) => worker.fetch(new Request(`https://mutex.buzz${path}`), e);

test('holds turn over at the closes: the 13th, the 26th, and the last day', () => {
  const oct1 = holderFor(new Date('2026-10-01T00:00:00Z'));
  const oct13 = holderFor(new Date('2026-10-13T23:59:59Z'));
  const oct14 = holderFor(new Date('2026-10-14T00:00:00Z'));
  const oct31 = holderFor(new Date('2026-10-31T12:00:00Z'));
  assert.equal(oct1.cycle, 'A');
  assert.equal(oct13.cycle, 'A');
  assert.equal(oct13.releasesAt, '2026-10-14T00:00:00.000Z');
  assert.equal(oct14.cycle, 'B');
  assert.equal(oct14.since, '2026-10-14T00:00:00.000Z');
  assert.equal(oct31.cycle, 'C');
  assert.equal(oct31.releasesAt, '2026-11-01T00:00:00.000Z');
  assert.equal(cycleFor(new Date('2027-02-28T00:00:00Z')).releasesAt.toISOString(), '2027-03-01T00:00:00.000Z');
  for (const h of [oct1, oct14, oct31]) {
    assert.equal(h.kind, 'folio');
    assert.match(h.href, /^https:\/\/spwashi\.com\/design\/folios\/#folio-\d+$/);
  }
  assert.notEqual(oct1.title, oct14.title);
});

test('/now/ is embeddable by attention.productions, and /now.json says the same', async () => {
  const now = await get('/now/', at('2026-10-14T09:00:00Z'));
  assert.equal(now.status, 200);
  assert.match(now.headers.get('content-security-policy'), /frame-ancestors 'self' https:\/\/attention\.productions/);
  assert.equal(now.headers.get('x-frame-options'), null);
  const html = await now.text();
  assert.match(html, /holds the lock · cycle B/);
  const data = await (await get('/now.json', at('2026-10-14T09:00:00Z'))).json();
  assert.equal(data.schema, 'mutex.now.v1');
  assert.equal(data.cycle, 'B');
  assert.deepEqual(data.queue, []);
});

test('the front page explains the lock and frames what holds it', async () => {
  const home = await get('/', at('2026-10-01T09:00:00Z'));
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /One concept in the frame/);
  assert.match(html, /<iframe src="\/now\/"/);
  const eco = await (await get('/ecosystem.json', at('2026-10-01T09:00:00Z'))).json();
  assert.equal(eco.schema, 'ecosystem.v1');
});

test('attention.productions frames the lock', async () => {
  const res = await worker.fetch(new Request('https://attention.productions/'), {});
  assert.match(res.headers.get('content-security-policy'), /frame-src https:\/\/mutex\.buzz/);
  assert.match(await res.text(), /<iframe src="https:\/\/mutex\.buzz\/now\/"/);
});
