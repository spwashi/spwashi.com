// factshift.center's shell (src/shell.js): the canvas kept on the device.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import worker from '../src/index.js';
import { REGISTER_TAG, SHELL_SCRIPT, SHELL_VERSION, factshiftShell, withShell, withSiteHead } from '../src/shell.js';
import { DESCRIPTION, SITE_MANIFEST } from '../src/manifest.js';
import { SNAPSHOT, SNAPSHOT_FILES } from '../src/snapshot-files.js';
import { snapshotFiles } from '../carry-shell.mjs';

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

test('the canvas carries one registration line; files pass untouched; /sw.js is the shell', async () => {
  for (const path of ['/', '/?spw=frame%5Bcare%5D%7Bseed%7D', '/anything']) {
    const response = await get(path);
    const html = await response.text();
    assert.equal(html.split('data-factshift-shell').length - 1, 1, path);
    assert.ok(html.indexOf(REGISTER_TAG) < html.lastIndexOf('</body>'), path);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=60', path);
    assert.equal(response.headers.get('etag'), null, path);
  }
  assert.match(REGISTER_TAG, /register\("\/sw\.js", \{ scope: "\/", updateViaCache: "none" \}\)/);
  assert.equal(withShell(withShell('<body></body>')), `<body>${REGISTER_TAG}\n</body>`);
  const script = await get('/assets/main-pq1jI85J.js');
  assert.doesNotMatch(await script.text(), /data-factshift-shell/);
  const shell = await get('/sw.js');
  assert.equal(shell.headers.get('content-type'), 'text/javascript; charset=UTF-8');
  assert.equal(shell.headers.get('cache-control'), 'public, max-age=60');
  assert.equal(await shell.text(), SHELL_SCRIPT);
  assert.ok(SHELL_SCRIPT.includes(`"version":"${SHELL_VERSION}"`));
  assert.match(SHELL_VERSION, new RegExp(`^${SNAPSHOT.revision}-${SNAPSHOT.snapshot}-site\\d+$`));
  assert.equal((await get('/', { headers: { host: 'www.factshift.center' } })).status, 200);
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
  const snapshot = JSON.parse(readFileSync(new URL('assets/manifest.json', root), 'utf8'));
  const response = await get('/manifest.json');
  assert.equal(response.headers.get('content-type'), 'application/manifest+json; charset=UTF-8');
  const manifest = await response.json();
  for (const key of ['name', 'short_name', 'theme_color', 'background_color', 'icons', 'start_url', 'scope', 'display']) assert.deepEqual(manifest[key], snapshot[key], key);
  assert.equal(manifest.orientation, 'any');
  assert.deepEqual(manifest.launch_handler, { client_mode: ['navigate-existing', 'auto'] });
  assert.equal(manifest.description, DESCRIPTION);
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
  assert.match(head, /<link rel="apple-touch-icon" href="\/v0\.0\.1\/favicon\/192\.png">/);
  assert.match(head, /<meta property="og:description" content="factshift\.center lays out a line of Spw/);
  assert.equal(withSiteHead(withSiteHead('<head></head>', 'x'), 'x').split('data-factshift-site-head').length - 1, 1);
});
