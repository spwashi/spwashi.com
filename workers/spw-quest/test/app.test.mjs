// spw.quest as an app on a phone: manifest, icons, head lines, policy, and the /install section.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../src/index.js';
import { APP_ICONS, MANIFEST, questAppInstall } from '../src/quest-manifest.js';
import { PAPER_THEME } from '../src/paper.js';

const assets = { fetch: async (request) => {
  const file = new URL(`../assets${new URL(request.url).pathname}`, import.meta.url);
  try {
    return new Response(readFileSync(file));
  } catch {
    return new Response('Not found', { status: 404 });
  }
} };
const get = (path, options) => worker.fetch(new Request(`https://spw.quest${path}`, options), { ASSETS: assets });

/** Width and height from a PNG's IHDR chunk. */
const pngSize = (bytes) => [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];

test('the manifest names an installable app in scope, in the paper colors', async () => {
  const response = await get('/manifest.webmanifest');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/manifest+json; charset=UTF-8');
  assert.equal(response.headers.get('content-security-policy'), null, 'a manifest carries no page policy');
  const manifest = await response.json();
  assert.deepEqual(manifest, JSON.parse(JSON.stringify(MANIFEST)));
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.start_url.startsWith(manifest.scope));
  assert.equal(manifest.background_color, PAPER_THEME.background);
  assert.equal(manifest.theme_color, PAPER_THEME.accent);
  for (const field of ['share_target', 'file_handlers', 'prefer_related_applications']) assert.ok(!(field in manifest), field);
  const sizes = manifest.icons.map((icon) => `${icon.sizes} ${icon.purpose}`);
  assert.deepEqual(sizes, ['192x192 any', '512x512 any', '512x512 maskable']);
  assert.equal(await (await get('/manifest.webmanifest', { method: 'HEAD' })).text(), '');
  assert.equal((await get('/manifest.webmanifest', { method: 'POST' })).status, 405);
});

test('every icon the manifest and head name is served as a PNG of its size', async () => {
  const named = new Set([...MANIFEST.icons.map((icon) => icon.src), '/icons/quest-180.png']);
  assert.deepEqual([...named].sort(), Object.keys(APP_ICONS).sort());
  for (const [path, size] of Object.entries(APP_ICONS)) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('content-type'), 'image/png', path);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=86400', path);
    assert.deepEqual(pngSize(Buffer.from(await response.arrayBuffer())), [size, size], path);
  }
  assert.equal((await get('/icons/quest.svg')).status, 404, 'the drawing is the source, not a served file');
  assert.equal((await get('/icons/other.png')).status, 404);
});

test('quest pages link the manifest and may read it; text answers keep the shell policy', async () => {
  for (const path of ['/', '/learn', '/build', '/install', '/specimens', '/read?step=act']) {
    const response = await get(path);
    const page = await response.text();
    assert.ok(page.includes('<link rel="manifest" href="/manifest.webmanifest">'), path);
    assert.ok(page.includes('<link rel="apple-touch-icon" href="/icons/quest-180.png">'), path);
    assert.match(response.headers.get('content-security-policy'), /manifest-src 'self'/, path);
    assert.doesNotMatch(response.headers.get('content-security-policy'), /img-src/, path);
  }
  assert.doesNotMatch((await get('/init')).headers.get('content-security-policy'), /manifest-src/);
});

test('/install leads with the phone, marks each way, and keeps the repository steps', async () => {
  const page = await (await get('/install')).text();
  assert.match(page, /<h1>Keep Spw on your phone, or in a repository\.<\/h1>/);
  const phone = page.indexOf('id="phone"');
  const repository = page.indexOf('<h2 id="repository">In a repository</h2>');
  assert.ok(phone > 0 && repository > phone, 'the phone section comes first');
  for (const way of ['ios', 'android', 'computer']) assert.match(page, new RegExp(`data-way="${way}"`));
  assert.match(page, /Add to Home Screen/);
  assert.match(page, /Install app/);
  // With scripts off the steps stand; the button waits for the browser's own offer.
  assert.match(page, /data-app-offer hidden/);
  assert.match(page, /data-copy="app-address"/);
  assert.match(page, /<code id="app-address">https:\/\/spw\.quest\/install#phone<\/code>/);
  // It says what an install does not carry.
  assert.match(page, /It needs a connection to open for now\./);
  assert.match(page, /a note kept in Safari does not follow it/);
  assert.ok(page.includes(`(${questAppInstall.toString()})();`), 'the script travels whole');
  const guide = await (await get('/')).text();
  assert.match(guide, /<a href="\/install#phone">Keep it on your phone<\/a>/);
});
