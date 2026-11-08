// The quest shell (assets/sw.js), PR 3 of .agents/plans/spw-quest/note-shell-design.md.
// A fake Cache Storage and fetch run the worker script in a vm; no new package.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import worker from '../src/index.js';
import { PAGE_CSP } from '../src/page.js';
import { APP_ICONS } from '../src/quest-manifest.js';
import { PINNED_READER, PINNED_READER_SHA256, PINNED_RELEASE, SHELL_VERSION } from '../src/shell-pin.js';
import { PEER_FONTS } from '../../lib/peer-kit.js';

const ORIGIN = 'https://spw.quest';
const SW_PATH = new URL('../assets/sw.js', import.meta.url);
const SW = readFileSync(SW_PATH, 'utf8');
const asset = (path) => new URL(`../assets${path}`, import.meta.url);
const assets = { fetch: async (request) => {
  try {
    return new Response(readFileSync(asset(new URL(request.url).pathname)));
  } catch {
    return new Response('Not found', { status: 404 });
  }
} };
const get = (path, init) => worker.fetch(new Request(`${ORIGIN}${path}`, init), { ASSETS: assets });

/** Requests resolve against the worker's origin, as they do inside a service worker. */
class SwRequest extends Request {
  constructor(input, init) {
    super(typeof input === 'string' ? new URL(input, ORIGIN) : input, init);
  }
}

class FakeCache {
  entries = [];
  key(request) {
    const req = typeof request === 'string' ? new SwRequest(request) : request;
    return { url: req.url, accept: req.headers?.get?.('accept') || '', method: req.method || 'GET' };
  }
  async put(request, response) {
    const key = this.key(request);
    if (key.method === 'HEAD') throw new TypeError('cache.put refuses HEAD');
    if (response.redirected) throw new TypeError('cache.put refuses a redirected response');
    const vary = (response.headers.get('vary') || '').toLowerCase();
    this.entries = this.entries.filter((entry) => !(entry.url === key.url && entry.accept === key.accept));
    this.entries.push({ ...key, vary, response });
  }
  async match(request) {
    const key = this.key(request);
    const hit = this.entries.find((entry) => entry.url === key.url && (!entry.vary.includes('accept') || entry.accept === key.accept));
    return hit ? hit.response.clone() : undefined;
  }
  async addAll(urls) {
    for (const url of urls) {
      const response = await this.fetch(url);
      if (!response.ok) throw new TypeError(`addAll: ${url} answered ${response.status}`);
      await this.put(url, response);
    }
  }
}

/** One worker in a vm, with a network the test controls. */
function loadShell(network) {
  const listeners = {};
  const stores = new Map();
  const net = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url, ORIGIN);
    return network(url, typeof input === 'string' ? { method: 'GET', ...init } : input);
  };
  const caches = {
    async open(name) {
      if (!stores.has(name)) {
        const cache = new FakeCache();
        cache.fetch = net;
        stores.set(name, cache);
      }
      return stores.get(name);
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      return stores.delete(name);
    },
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type, fn) => {
      listeners[type] = fn;
    },
    clients: { claim: async () => {}, matchAll: async () => [] },
    skipWaiting: () => {},
  };
  const context = vm.createContext({ self, caches, fetch: net, Request: SwRequest, Response, Headers, URL, URLSearchParams, crypto: globalThis.crypto, Uint8Array, Array, Set, Promise, Error, TypeError, console });
  vm.runInContext(SW, context);
  const dispatch = (type, extra) => {
    const event = { ...extra, waits: [], waitUntil(p) { this.waits.push(p); }, responded: null, respondWith(p) { this.responded = p; } };
    listeners[type](event);
    return event;
  };
  return {
    stores,
    async install() {
      const event = dispatch('install', {});
      await Promise.all(event.waits);
    },
    async activate() {
      const event = dispatch('activate', {});
      await Promise.all(event.waits);
    },
    fetch(path, { method = 'GET', mode = 'no-cors', accept = '*/*', origin = ORIGIN } = {}) {
      const request = { method, mode, url: `${origin}${path}`, headers: new Headers({ accept }) };
      return dispatch('fetch', { request });
    },
  };
}

/** The live network: the worker's own routes, and the files from disk. */
const online = async (url, init = {}) => {
  const response = await get(`${url.pathname}${url.search}`, { method: init.method || 'GET', headers: { accept: init.headers?.get?.('accept') || init.headers?.Accept || '*/*' } });
  // A same-origin response inside a service worker is basic.
  Object.defineProperty(response, 'type', { value: 'basic' });
  return response;
};
const offline = async () => {
  throw new TypeError('Failed to fetch');
};

test('the shell is a classic script that parses, served with no policy of its own', async () => {
  const check = spawnSync(process.execPath, ['--check', SW_PATH.pathname], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
  assert.doesNotMatch(SW, /^\s*(import|export)\s/m);
  const response = await get('/sw.js');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/javascript; charset=UTF-8');
  assert.equal(response.headers.get('content-security-policy'), null, 'a policy on a worker script becomes the worker\'s own');
  assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
  assert.equal(response.headers.get('x-spw-shell'), SHELL_VERSION);
  assert.equal(await response.text(), SW);
  assert.equal((await get('/sw.js', { method: 'POST' })).status, 405);
});

test('the shell repeats the pin, names the files the pages use, and never mentions the note', () => {
  assert.ok(SW.includes(`const SHELL_VERSION = "${SHELL_VERSION}";`));
  assert.ok(SW.includes(`const PINNED_RELEASE = "${PINNED_RELEASE}";`));
  assert.ok(SW.includes(`const PINNED_READER = "${PINNED_READER}";`));
  assert.ok(SW.includes(`const PINNED_READER_SHA256 = "${PINNED_READER_SHA256}";`));
  for (const face of PEER_FONTS) assert.ok(SW.includes(`"/fonts/${face.file}"`), face.file);
  for (const icon of Object.keys(APP_ICONS)) assert.ok(SW.includes(`"${icon}"`), icon);
  assert.ok(SW.includes('"/manifest.webmanifest"'));
  assert.doesNotMatch(SW, /spw\.quest\.note/);
});

test('/offline is a small page with a way back, and it does not register the shell itself', async () => {
  const response = await get('/offline');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-security-policy'), PAGE_CSP);
  const page = await response.text();
  assert.match(page, /<h1>Offline, and this page was not saved\.<\/h1>/);
  assert.match(page, /<a class="chip" href="\/">Open the guide<\/a>/);
  assert.doesNotMatch(page, /form[^>]*data-file|serviceWorker\.register/);
  for (const path of ['/', '/learn', '/build', '/install']) assert.match(await (await get(path)).text(), /navigator\.serviceWorker\.register\("\/sw\.js", \{ updateViaCache: "none" \}\)/, path);
  assert.doesNotMatch(await (await get('/read?step=act')).text(), /serviceWorker\.register/);
});

test('install keeps the shell, and only a reader that matches the pin', async () => {
  const shell = loadShell(online);
  await shell.install();
  const kept = shell.stores.get(`spw-quest-shell-v${SHELL_VERSION}`);
  const urls = kept.entries.map((entry) => new URL(entry.url).pathname).sort();
  assert.deepEqual(urls, ['/fonts/jetbrains-mono-latin.2c32b9b3ee.woff2', '/fonts/newsreader-latin.01817351be.woff2', '/icons/quest-180.png', '/icons/quest-192.png', '/icons/quest-512.png', '/icons/quest-mask-512.png', '/manifest.webmanifest', '/offline', PINNED_READER].sort());
  assert.ok(!urls.includes('/'), 'the guide is not precached');
  // A recut file at the pinned address fails the install, so the previous shell keeps control.
  const recut = loadShell(async (url, init) => (url.pathname === PINNED_READER ? new Response('export const parse = () => ({});') : online(url, init)));
  await assert.rejects(recut.install(), /does not match the pin/);
  // Activate drops another version's caches and keeps this one's.
  shell.stores.set('spw-quest-shell-v0', new FakeCache());
  await shell.activate();
  assert.ok(!shell.stores.has('spw-quest-shell-v0'));
  assert.ok(shell.stores.has(`spw-quest-shell-v${SHELL_VERSION}`));
});

test('what the shell does not name goes to the network untouched', async () => {
  const shell = loadShell(online);
  const open = [
    ['/install', { method: 'POST', mode: 'navigate' }],
    ['/build', { method: 'POST', mode: 'navigate' }],
    ['/', { method: 'HEAD', mode: 'navigate' }],
    ['/', { origin: 'https://factshift.center', mode: 'navigate' }],
    ['/git.txt', {}], ['/quest.json', {}], ['/health', {}], ['/parser.js', {}], ['/parser/index.json', {}],
    ['/parser/latest.js', {}], ['/parser/next.js', {}], ['/parser/2026.10.13/workbench.min.js', {}], ['/script.spw?script=x', {}],
    ['/?parser=next', { mode: 'navigate' }], ['/?example=notebook&utm=1', { mode: 'navigate' }], ['/?note&example=commit', { mode: 'navigate' }],
    ['/build?script=a', { mode: 'navigate' }], ['/read?step=act&line=x', { mode: 'navigate' }], ['/specimens?q=x', { mode: 'navigate' }],
    ['/', { mode: 'cors' }], ['/specimens', { mode: 'navigate' }],
  ];
  for (const [path, options] of open) assert.equal(shell.fetch(path, options).responded, null, `${options.method || 'GET'} ${path}`);
});

test('the guide is network first, kept under its own key, and served from there only when the network fails', async () => {
  let network = online;
  const shell = loadShell((url, init) => network(url, init));
  await shell.install();
  const nav = (path) => shell.fetch(path, { mode: 'navigate', accept: 'text/html' }).responded;

  // Online: /?note is stored under "/" (the response varies on Accept).
  const fresh = await nav('/?note');
  assert.equal(fresh.status, 200);
  assert.equal(fresh.headers.get('vary'), 'Accept');
  await new Promise((resolve) => setTimeout(resolve, 10));
  const pages = shell.stores.get(`spw-quest-pages-v${SHELL_VERSION}`);
  assert.deepEqual(pages.entries.map((entry) => [new URL(entry.url).pathname + new URL(entry.url).search, entry.accept]), [['/', 'text/html']]);

  // Offline: "/" comes back from the pages cache, the walk card and all.
  network = offline;
  const kept = await nav('/');
  assert.equal(kept.status, 200);
  assert.match(await kept.text(), /Your walk, in Spw/);
  // An example never opened online gets /offline, never the "/" entry.
  assert.match(await (await nav('/?example=garden')).text(), /Offline, and this page was not saved\./);
  // The other rooms get /offline when the network is gone.
  assert.match(await (await nav('/learn')).text(), /Offline, and this page was not saved\./);

  // A 5xx is the network's answer: shown, not replaced, not stored.
  network = async () => new Response('down', { status: 503, headers: { 'Content-Type': 'text/html' } });
  assert.equal((await nav('/?example=commit')).status, 503);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(!pages.entries.some((entry) => entry.url.includes('example=commit')));
});

test('the pinned reader and the shell files come from the shell, offline too', async () => {
  let network = online;
  const shell = loadShell((url, init) => network(url, init));
  await shell.install();
  network = offline;
  const reader = await shell.fetch(PINNED_READER, { mode: 'cors' }).responded;
  assert.equal(reader.status, 200);
  assert.equal((await reader.arrayBuffer()).byteLength, readFileSync(asset(PINNED_READER)).byteLength);
  for (const path of ['/manifest.webmanifest', '/icons/quest-192.png', `/fonts/${PEER_FONTS[0].file}`]) {
    assert.equal((await shell.fetch(path, { mode: 'cors' }).responded).status, 200, path);
  }
});
