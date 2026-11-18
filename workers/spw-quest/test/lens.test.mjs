// Domain-biased lenses on spw.quest: landing from a peer domain or ?lens=
// reduces example noise and accents expression maneuverability handles across /, /build, and /pivot.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker from '../src/index.js';
import { DOMAIN_LENSES, HOST_TO_LENS, clientLensInit, clientLensPayload, resolveLens } from '../src/lens.js';
import { EXAMPLES } from '../src/examples.js';

const get = (path, headers = {}) => worker.fetch(new Request(`https://spw.quest${path}`, { headers }), {});

test('every domain lens names valid example files and resolves from Referer, ?from=, or ?lens=', () => {
  const validIds = new Set(EXAMPLES.map((e) => e.id));
  for (const lens of DOMAIN_LENSES) {
    assert.ok(lens.examples.length >= 4, lens.id);
    for (const id of lens.examples) assert.ok(validIds.has(id), `${lens.id}: ${id} exists`);
  }
  assert.equal(resolveLens({ params: new URLSearchParams(), referer: 'https://attention.productions/a-lamp' })?.lens.id, 'scene');
  assert.equal(resolveLens({ params: new URLSearchParams(), referer: 'https://wap.mom/22-7/' })?.lens.id, 'editorial');
  assert.equal(resolveLens({ params: new URLSearchParams('from=texture.website') })?.lens.id, 'material');
  assert.equal(resolveLens({ params: new URLSearchParams('lens=career') })?.lens.id, 'career');
  assert.equal(resolveLens({ params: new URLSearchParams(), referer: 'https://spw.quest/' }), null);
  for (const host of HOST_TO_LENS.keys()) assert.ok(host.includes('.'), host);
});

test('landing from a peer domain biases /, opens its signature example, and accents handles across /build and /pivot', async () => {
  const res = await get('/', { Referer: 'https://attention.productions/frame' });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<div class="lens-scope" data-server-lens="true" data-domain-lens="scene" data-lens-quiet="true" data-lens-from="attention\.productions"/);
  assert.match(html, /data-example="cinema" aria-current="page"/, 'opens cinema example first for attention.productions');
  assert.match(html, /data-lens-handles="b-scene b-mode b-concept"/);
  assert.match(html, /Cinema &amp; scene/);

  const buildHtml = await (await get('/build?lens=rhetoric')).text();
  assert.match(buildHtml, /data-domain-lens="rhetoric"/);
  assert.match(buildHtml, /data-lens-slots="scene scope mode definition body"/);

  const pivotHtml = await (await get('/pivot?line=garden%5Bcare%5D%7Bseed%7D&from=mutex.buzz')).text();
  assert.match(pivotHtml, /data-domain-lens="concurrency"/);
  assert.match(pivotHtml, /data-lens-accent="true">#<\/a>/, 'accents concurrency front mark on /pivot');

  const script = `(${clientLensInit.toString()})(${JSON.stringify(clientLensPayload())});`;
  assert.doesNotThrow(() => new vm.Script(script));
});
