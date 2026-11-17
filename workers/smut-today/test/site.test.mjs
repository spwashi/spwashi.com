// smut.today as a self-contained script worker: routes, private cookie preferences,
// offline PWA assets, pinch-to-scale hooks, and syntax checks on emitted client scripts.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker from '../src/index.js';

const get = (path, init = {}) => worker.fetch(new Request(`https://smut.today${path}`, init));

test('core pages serve clean HTML with no inline scripts and keep scripts-off linger/settle intact', async () => {
  for (const path of ['/', '/to-you/', '/pitches/', '/meeting/', '/train/', '/settle/']) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    assert.doesNotMatch(html, /<script>|\son[a-z]+=/i, `${path}: no inline script or handler`);
    assert.match(html, /<script src="\/text-scale-head\.js"><\/script>/, path);
    assert.match(html, /<script src="\/app\.js" defer><\/script>/, path);
    assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest">/, path);
    assert.match(html, /data-text-scale="70"/, path);
    assert.match(res.headers.get('content-security-policy'), /script-src 'self';/, path);
  }
  const story = await (await get('/meeting/')).text();
  assert.match(story, /class="reading-thread"/);
  assert.match(story, /id="focus-toggle"/);
  assert.match(story, /id="footer-colophon"/);
  assert.match(story, /id="pace-drawer"/);
  assert.match(story, /data-words="/);
});

test('smut.today installs as a private PWA with PNG icons, manifest, and no-store /settle/', async () => {
  const manifestRes = await get('/manifest.webmanifest');
  assert.equal(manifestRes.status, 200);
  const manifest = await manifestRes.json();
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512'));
  for (const icon of manifest.icons.filter((i) => i.type === 'image/png')) {
    const png = Buffer.from(await (await get(icon.src)).arrayBuffer());
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], icon.src);
  }
  const settleRes = await get('/settle/');
  assert.equal(settleRes.headers.get('cache-control'), 'no-store');
  const settleHtml = await settleRes.text();
  assert.match(settleHtml, /id="keep-app"/);
  assert.match(settleHtml, /id="pwa-status"/);

  for (const jsPath of ['/app.js', '/sw.js', '/text-scale-head.js']) {
    const res = await get(jsPath);
    assert.equal(res.status, 200, jsPath);
    const code = await res.text();
    assert.doesNotThrow(() => new vm.Script(code), `${jsPath} compiles`);
    if (jsPath === '/sw.js') {
      assert.match(res.headers.get('cache-control'), /no-cache/);
      assert.match(code, /pathname\.startsWith\("\/settle"\)/, 'never caches settle route');
    }
  }
});

test('settle cookie round-trip sets type-larger and move-still cleanly', async () => {
  const post = await get('/settle/', {
    method: 'POST',
    body: new URLSearchParams({ pace: 'dirty', type: 'larger', move: 'still' }),
  });
  assert.equal(post.status, 303);
  const cookie = post.headers.get('set-cookie');
  assert.match(cookie, /settle=pace-dirty\.type-larger\.move-still/);
  const home = await (await get('/', { headers: { Cookie: cookie.split(';')[0] } })).text();
  assert.match(home, /<html lang="en" data-type="larger" data-move="still">/);
});
