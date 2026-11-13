// factshift.center's shell (src/shell.js): the canvas kept on the device.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import worker from '../src/index.js';
import { REGISTER_TAG, SHELL_SCRIPT, SHELL_VERSION, factshiftShell, withShell, withSiteHead } from '../src/shell.js';
import { DESCRIPTION, ROBOTS, SITE_MANIFEST, siteManifest, sitemap } from '../src/manifest.js';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SNAPSHOT, SNAPSHOT_FILES } from '../src/snapshot-files.js';
import { HEADERS, snapshotFiles } from '../carry-shell.mjs';

const ORIGIN = 'https://factshift.center';
const root = new URL('../', import.meta.url);
const version = JSON.parse(readFileSync(new URL('version.json', root), 'utf8'));

/** The assets binding, with the single-page fallback the wrangler config asks for. */
const ASSETS = { fetch: async (request) => {
  const { pathname } = new URL(request.url);
  const file = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const types = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', json: 'application/json', png: 'image/png', mp3: 'audio/mpeg' };
  const type = (name) => types[name.split('.').pop()] || 'application/octet-stream';
  try {
    return new Response(readFileSync(new URL(`assets${file}`, root)), { headers: { 'content-type': type(file), etag: '"x"' } });
  } catch {
    if (pathname.includes('.')) return new Response('Not found', { status: 404 });
    return new Response(readFileSync(new URL('assets/index.html', root)), { headers: { 'content-type': types.html } });
  }
} };
const get = (path, init) => worker.fetch(new Request(`${ORIGIN}${path}`, init), { ASSETS });

test('the kept list is every file the snapshot ships, and names this snapshot', async () => {
  assert.deepEqual([...SNAPSHOT_FILES], await snapshotFiles());
  assert.deepEqual(SNAPSHOT, { revision: version.revision, snapshot: version.snapshot });
  assert.equal(SNAPSHOT_FILES[0], '/');
  assert.ok(SNAPSHOT_FILES.includes('/manifest.json'));
  assert.ok(SNAPSHOT_FILES.some((file) => file.startsWith('/assets/workbench-adapter-')), 'lazy chunks too, so every mode opens offline');
  assert.ok(!SNAPSHOT_FILES.some((file) => file.endsWith('service-worker.js') || file.endsWith('index.html')));
});

test('the canvas is static: carried once with its lines, its shell and their headers; a file answers "/" before the worker', async () => {
  const config = JSON.parse(readFileSync(new URL('wrangler.jsonc', root), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(config.assets.run_worker_first, undefined, 'every address is a file answered at the edge');
  const check = spawnSync(process.execPath, [fileURLToPath(new URL('carry-shell.mjs', root)), '--check'], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
  for (const file of ['assets/index.html', 'assets/_spwashi@/index.html']) {
    const html = readFileSync(new URL(file, root), 'utf8');
    assert.equal(html.split('data-factshift-shell').length - 1, 1, file);
    assert.equal(html.split('data-factshift-site-head').length - 1, 1, file);
    assert.ok(html.indexOf(REGISTER_TAG) < html.lastIndexOf('</body>'), file);
  }
  for (const path of ['/', '/?spw=frame%5Bcare%5D%7Bseed%7D']) {
    const response = await get(path);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=60', path);
    assert.equal((await response.text()).split('data-factshift-shell').length - 1, 1, path);
  }
  const www = await worker.fetch(new Request('https://www.factshift.center/?spw=a'), { ASSETS });
  assert.equal(www.status, 301);
  assert.equal(www.headers.get('location'), 'https://factshift.center/?spw=a');
  assert.match(REGISTER_TAG, /register\("\/sw\.js", \{ scope: "\/", updateViaCache: "none" \}\)/);
  assert.equal(withShell(withShell('<body></body>')), `<body>${REGISTER_TAG}\n</body>`);
  assert.equal(readFileSync(new URL('assets/sw.js', root), 'utf8'), SHELL_SCRIPT);
  assert.ok(SHELL_SCRIPT.includes(`"version":"${SHELL_VERSION}"`));
  assert.match(SHELL_VERSION, new RegExp(`^${SNAPSHOT.revision}-${SNAPSHOT.snapshot}-site\\d+$`));
  const headers = readFileSync(new URL('assets/_headers', root), 'utf8');
  assert.equal(headers, HEADERS);
  assert.match(headers, /^\/\n  Cache-Control: public, max-age=60$/m, 'the canvas keeps its one-minute cache without the worker');
  assert.match(headers, /^\/sw\.js\n  Cache-Control: public, max-age=60$/m);
  assert.match(headers, /^\/manifest\.json\n  Content-Type: application\/manifest\+json; charset=UTF-8$/m);
});

/** One shell in a vm, with a network the test controls. */
function loadShell(network, waitMs = 30) {
  const listeners = {};
  const stores = new Map();
  class FakeCache {
    entries = new Map();
    key(request) {
      return new URL(typeof request === 'string' ? request : request.url, ORIGIN).href;
    }
    async put(request, response) {
      this.entries.set(this.key(request), response);
    }
    async match(request) {
      return this.entries.get(this.key(request))?.clone();
    }
    async addAll(urls) {
      for (const url of urls) {
        const response = await net(url);
        if (!response.ok) throw new TypeError(`addAll: ${url} ${response.status}`);
        await this.put(url, response);
      }
    }
  }
  const net = async (input) => network(new URL(typeof input === 'string' ? input : input.url, ORIGIN));
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new FakeCache());
      return stores.get(name);
    },
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
  };
  const self = { location: { origin: ORIGIN }, addEventListener: (type, fn) => { listeners[type] = fn; }, clients: { claim: async () => {} }, skipWaiting: () => {} };
  vm.runInContext(`(${factshiftShell.toString()})(${JSON.stringify({ version: 'test', files: SNAPSHOT_FILES, waitMs })})`, vm.createContext({ self, caches, fetch: net, Response, URL, Set, Promise, setTimeout }));
  const dispatch = (type, extra) => {
    const event = { ...extra, waits: [], waitUntil(p) { this.waits.push(p); }, responded: null, respondWith(p) { this.responded = p; } };
    listeners[type](event);
    return event;
  };
  return {
    stores,
    install: async () => Promise.all(dispatch('install', {}).waits),
    activate: async () => Promise.all(dispatch('activate', {}).waits),
    fetch: (path, { method = 'GET', mode = 'cors', origin = ORIGIN } = {}) => dispatch('fetch', { request: { method, mode, url: `${origin}${path}` } }),
  };
}

const online = async (url) => get(`${url.pathname}${url.search}`);
const down = async () => {
  throw new TypeError('Failed to fetch');
};

test('install keeps the whole snapshot; activate drops another snapshot\'s cache', async () => {
  const shell = loadShell(online);
  await shell.install();
  const cache = shell.stores.get('factshift-center-test');
  assert.equal(cache.entries.size, SNAPSHOT_FILES.length);
  assert.match(await (await cache.match('/')).text(), /data-factshift-shell/);
  shell.stores.set('factshift-center-old', {});
  shell.stores.set('spw-quest-shell-v1', {});
  await shell.activate();
  assert.ok(!shell.stores.has('factshift-center-old'));
  assert.ok(shell.stores.has('spw-quest-shell-v1'), 'another app\'s cache is not this shell\'s to drop');
});

test('offline, a navigation opens the kept canvas, with its line still in the address', async () => {
  let network = online;
  const shell = loadShell((url) => network(url));
  await shell.install();
  network = down;
  for (const path of ['/', '/?spw=frame%5Bcare%5D%7Bseed%7D', '/anything#spw64=YQ']) {
    const response = await shell.fetch(path, { mode: 'navigate' }).responded;
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /data-app="factshift"/, path);
  }
  assert.match(await (await shell.fetch('/_spwashi@/', { mode: 'navigate' }).responded).text(), /<html/);
  for (const file of SNAPSHOT_FILES.filter((file) => file.startsWith('/assets/'))) {
    assert.equal((await shell.fetch(file).responded).status, 200, file);
  }
});

test('a network that hangs gives way to the kept canvas; a fresh answer wins when it comes first', async () => {
  let network = online;
  const shell = loadShell((url) => network(url), 30);
  await shell.install();
  network = () => new Promise(() => {});
  const started = Date.now();
  const kept = await shell.fetch('/', { mode: 'navigate' }).responded;
  assert.equal(kept.status, 200);
  assert.ok(Date.now() - started < 1000);
  network = async () => new Response('<!doctype html><title>fresh</title>', { headers: { 'content-type': 'text/html' } });
  assert.match(await (await shell.fetch('/', { mode: 'navigate' }).responded).text(), /fresh/);
  // Before anything is kept, a failed navigation says so plainly.
  const empty = loadShell(down);
  const first = await empty.fetch('/', { mode: 'navigate' }).responded;
  assert.equal(first.status, 503);
});

test('what the shell does not keep goes to the network untouched', () => {
  const shell = loadShell(online);
  for (const [path, options] of [
    ['/', { method: 'POST', mode: 'navigate' }],
    ['/version.json', {}],
    ['/v0.0.2-alpha/service-worker.js', {}],
    ['/assets/main-pq1jI85J.js?x=1', {}],
    ['/', { origin: 'https://spw.quest' }],
  ]) assert.equal(shell.fetch(path, options).responded, null, path);
});

test('the installed face: the app\'s name, colors and icons, with the site\'s description, turn, launch and shortcuts', async () => {
  const manifest = await (await get('/manifest.json')).json();
  assert.deepEqual(manifest, JSON.parse(readFileSync(new URL('assets/manifest.json', root), 'utf8')));
  // A carried manifest carries again unchanged; the app's own fields pass through.
  assert.deepEqual(siteManifest(manifest), manifest);
  assert.equal(manifest.name, 'factshift');
  assert.equal(manifest.theme_color, '#4c1d1d');
  assert.equal(manifest.icons.length, 5);
  assert.equal(manifest.orientation, 'any');
  assert.deepEqual(manifest.display_override, ['window-controls-overlay', 'standalone', 'minimal-ui', 'browser']);
  assert.deepEqual(manifest.launch_handler, { client_mode: ['navigate-existing', 'auto'] });
  assert.deepEqual(manifest.categories, ['education', 'productivity', 'utilities']);
  assert.deepEqual(manifest.file_handlers, SITE_MANIFEST.file_handlers);
  assert.equal(manifest.description, DESCRIPTION);
  // Text shared from another app lands by the address the canvas already reads.
  assert.deepEqual(manifest.share_target, { action: '/', method: 'GET', params: { text: 'spw' } });
  // The description is the app's own sentence, not new copy.
  assert.ok(readFileSync(new URL('assets/index.html', root), 'utf8').includes(`<meta name="description" content="${DESCRIPTION}">`));
  assert.deepEqual(manifest.shortcuts.map((shortcut) => shortcut.short_name), SITE_MANIFEST.shortcuts.map((shortcut) => shortcut.short_name));
  for (const shortcut of manifest.shortcuts) {
    assert.ok(shortcut.url.startsWith('/'), shortcut.url);
    const page = await get(shortcut.url);
    assert.equal(page.status, 200, shortcut.url);
    assert.match(await page.text(), /data-app="factshift"/, shortcut.url);
  }
  assert.ok(!manifest.shortcuts.some((shortcut) => /reset|demo/.test(shortcut.url)), '?reset clears storage and /demo throws; neither is a shortcut');
});

test('the canvas head gains a bar color, an iOS icon and a preview, once', async () => {
  const html = await (await get('/')).text();
  const head = html.slice(0, html.indexOf('</head>'));
  assert.equal(head.split('data-factshift-site-head').length - 1, 1);
  assert.match(head, /<meta name="theme-color" content="#4c1d1d">/);
  assert.match(head, /<meta name="mobile-web-app-capable" content="yes">/);
  assert.match(head, /<meta name="apple-mobile-web-app-capable" content="yes">/);
  assert.match(head, /<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">/);
  assert.match(head, /<link rel="apple-touch-icon" href="\/v0\.0\.1\/favicon\/192\.png">/);
  assert.match(head, /<meta property="og:description" content="factshift\.center lays out a line of Spw/);
  assert.equal(withSiteHead(withSiteHead('<head></head>', 'x'), 'x').split('data-factshift-site-head').length - 1, 1);
  // A block carried before is replaced, so new lines reach a carried snapshot.
  assert.equal(withSiteHead(withSiteHead('<head>\n</head>', 'old'), 'new'), withSiteHead('<head>\n</head>', 'new'));
});

test('crawlers are welcome: the canvas is indexed under one canonical, the secondary entry is followed only', async () => {
  const root_ = readFileSync(new URL('assets/index.html', root), 'utf8');
  const second = readFileSync(new URL('assets/_spwashi@/index.html', root), 'utf8');
  assert.match(root_, /<link rel="canonical" href="https:\/\/factshift\.center\/">/);
  assert.match(root_, /<meta name="robots" content="index, follow">/);
  assert.match(second, /<link rel="canonical" href="https:\/\/factshift\.center\/_spwashi@\/">/);
  assert.match(second, /<meta name="robots" content="noindex, follow">/);
  for (const html of [root_, second]) assert.equal(html.split('<meta name="robots"').length - 1, 1, 'one robots line');
  assert.equal(readFileSync(new URL('assets/robots.txt', root), 'utf8'), ROBOTS);
  assert.equal(readFileSync(new URL('assets/sitemap.xml', root), 'utf8'), sitemap());
  assert.match(ROBOTS, /^Allow: \/$/m);
  assert.match(ROBOTS, /^Sitemap: https:\/\/factshift\.center\/sitemap\.xml$/m);
  assert.deepEqual(sitemap().match(/<loc>[^<]+<\/loc>/g), ['<loc>https://factshift.center/</loc>']);
  assert.ok(!SNAPSHOT_FILES.includes('/robots.txt') && !SNAPSHOT_FILES.includes('/sitemap.xml'), 'the shell does not keep them');
});

test('a new shell is offered, never forced, and an offline arrival keeps its line in view', () => {
  const page = readFileSync(new URL('assets/index.html', root), 'utf8');
  assert.match(page, /A new canvas is saved\./);
  assert.match(page, /postMessage\(\{ type: "skip-waiting" \}\)/);
  assert.match(page, /watch\(registration\.installing\)/, 'an install already under way is watched too');
  assert.match(page, /visibilitychange/, 'checks for updates when page becomes visible');
  assert.match(page, /launchQueue/, 'file handling dispatches to drop handler');
  const script = readFileSync(new URL('assets/sw.js', root), 'utf8');
  assert.match(script, /Your line is still in this address/);
  assert.match(script, /network\.catch\(\(\) => offline\(url\)\)/);
  assert.match(script, /answer && answer\.ok/, 'falls back to cached canvas on server error');
});
