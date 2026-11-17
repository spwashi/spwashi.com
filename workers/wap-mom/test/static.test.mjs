// wap.mom as files: every printed page is carried out of the worker into assets/,
// and the worker runs only where it reads something (carry-pages.mjs, wrangler.jsonc).
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/index.js';
import { addresses, carried } from '../carry-pages.mjs';
import { printed } from '../src/catalog.js';

const root = path.dirname(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)));
const config = JSON.parse(readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const get = (p) => worker.fetch(new Request(`https://wap.mom${p}`), {});

test('the worker runs only for the cabinet and a figure drawn without script; everything else is a file', () => {
  assert.deepEqual(config.assets.run_worker_first, ['/cabinet', '/cabinet/*', '/*/draw']);
  assert.equal(config.assets.not_found_handling, '404-page');
});

test('each carried file is what the worker prints, and every sitemap address has one', async () => {
  for (const [file, body] of await carried()) {
    assert.equal(readFileSync(path.join(root, 'assets', file), 'utf8'), body, `assets/${file}: run node workers/wap-mom/carry-pages.mjs`);
  }
  const files = new Map(addresses());
  const sitemap = readFileSync(path.join(root, 'assets', 'sitemap.xml'), 'utf8');
  for (const [, address] of sitemap.matchAll(/<loc>https:\/\/wap\.mom([^<]*)<\/loc>/g)) {
    assert.ok(files.has(address), `${address} is in the sitemap and carried`);
    assert.ok(existsSync(path.join(root, 'assets', files.get(address))), address);
  }
});

test('a figure posts its controls to the issue\'s /draw, which the worker draws and keeps out of the index', async () => {
  const issue = printed.find((each) => readFileSync(path.join(root, 'assets', each.slug, 'index.html'), 'utf8').includes('class="fig-controls"'));
  assert.ok(issue, 'some printed issue has a figure with controls');
  const page = readFileSync(path.join(root, 'assets', issue.slug, 'index.html'), 'utf8');
  assert.ok(page.includes(`action="/${issue.slug}/draw#fig-${issue.slug}"`), issue.slug);
  const drawn = await get(`/${issue.slug}/draw`);
  assert.equal(drawn.status, 200);
  assert.equal(drawn.headers.get('X-Robots-Tag'), 'noindex, follow');
  assert.match(await drawn.text(), /class="fig-controls"/);
});

test('wap.mom installs as an app and keeps every printed issue for reading offline', async () => {
  const { ICONS, iconPng } = await import('../src/icon.js');
  const { KEPT } = await import('../src/app.js');
  const manifest = JSON.parse(readFileSync(path.join(root, 'assets', 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512'));
  for (const [name, icon] of Object.entries(ICONS)) assert.ok(readFileSync(path.join(root, 'assets', 'icons', name)).equals(iconPng(icon.size, icon)), name);
  // Every kept address is a file the assets layer has, and every printed issue is kept.
  for (const issue of printed) assert.ok(KEPT.includes(`/${issue.slug}/`), issue.slug);
  const sw = readFileSync(path.join(root, 'assets', 'sw.js'), 'utf8');
  assert.ok(sw.includes(JSON.stringify(KEPT)), 'the worker lists what it keeps');
  assert.match(sw, /LIVE = /, 'the cabinet and the drawn figures are never kept');
  const front = readFileSync(path.join(root, 'assets', 'index.html'), 'utf8');
  for (const tag of ['<link rel="manifest" href="/manifest.webmanifest">', '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">', '<script src="/app.js" defer></script>', '<button type="button" id="keep-app" hidden>']) assert.ok(front.includes(tag), tag);
  const headers = readFileSync(path.join(root, 'assets', '_headers'), 'utf8');
  assert.match(headers, /manifest-src 'self'/);
  // A service worker runs under the policy its script is served with: without connect-src it could keep nothing.
  assert.match(headers, /connect-src 'self'/);
  assert.match(headers, /\/sw\.js\n(?:  .*\n)*?  Cache-Control: no-cache/);
});

test('wap.mom binds cluster pinch-to-scale, keeps offprints/clippings offline, and emits valid client scripts', async () => {
  const { APP_JS, SW_JS } = await import('../src/app.js');
  const { FIGURES_JS } = await import('../src/figures.js');
  const { PINCH_TEXT } = await import('../src/layout.js');
  const front = readFileSync(path.join(root, 'assets', 'index.html'), 'utf8');
  for (const tag of [
    '<link rel="stylesheet" href="/text-scale.css">',
    '<script src="/text-scale-head.js"></script>',
    `<link rel="modulepreload" id="text-pinch" href="${PINCH_TEXT}">`,
    'id="euler-card"',
    'id="pwa-status"',
  ]) assert.ok(front.includes(tag), tag);
  for (const file of ['text-scale.css', 'text-scale.js', 'text-scale-head.js', PINCH_TEXT.slice(1)]) {
    assert.ok(existsSync(path.join(root, 'assets', file)), file);
  }
  const sw = readFileSync(path.join(root, 'assets', 'sw.js'), 'utf8');
  for (const issue of printed) {
    assert.ok(sw.includes(`/${issue.slug}/offprint/`), `${issue.slug} offprint cached`);
    if (issue.clip) assert.ok(sw.includes(`/${issue.slug}/clip/`), `${issue.slug} clip cached`);
  }
  for (const [name, code] of [['APP_JS', APP_JS], ['SW_JS', SW_JS], ['FIGURES_JS', FIGURES_JS]]) {
    assert.doesNotThrow(() => new vm.Script(code), `${name} compiles cleanly`);
  }
});
