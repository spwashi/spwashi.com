#!/usr/bin/env node
/**
 * Which modules write to the page root as a page arrives, measured.
 *
 * A write to <html> or <body> can restyle the whole document, so a module
 * that makes one on arrival costs every reader, engaged or not. The static
 * audit (audit:module-writers) reads what a module could write. This loads a
 * route from source in headless Chrome, hooks the root's write paths before
 * any script runs, keeps the call stack of each write, and names the catalog
 * module on that stack. No input is sent, so everything counted is arrival.
 * It watches for at least --observe ms and then until --quiet ms pass with no
 * new mount, so a loaded machine lengthens the watch and not the miss.
 *
 *   npm run audit:root-writes
 *   npm run audit:root-writes -- --routes /,/about/ --observe 12000 --quiet 6000
 *   npm run audit:root-writes -- --json --receipt census.json
 *
 * Reading the table: `writes` is every call, `changed` the ones that altered
 * a value, `styled` the changed ones on a token some stylesheet reads (the
 * dear kind), `repeats` a token written more than once. `quiet` lists modules
 * that mounted and never wrote to the root: candidates for arming on
 * engagement, since nothing they draw on arrival is root state.
 * `observed` counts root attribute mutations the browser reported; when it is
 * far above `writes`, a write path is unhooked and the table is short.
 *
 * Exit: 0 census taken · 2 no browser or runtime · 3 loopback unavailable.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const TRANSPORT_PREFIX = '/public/js/kernel/';

/**
 * Runs before any page script. Root writes go through four doors: attribute
 * methods, dataset, inline style and classList. Each is wrapped for <html>
 * and <body> only, and every call keeps the script files on its stack.
 */
export const ROOT_WRITE_PROBE_SOURCE = `(() => {
  if (window.__spwRootWrites) return;
  Error.stackTraceLimit = 40;
  const rows = new Map();
  const observed = { html: 0, body: 0 };
  const targetOf = (el) => (el === document.documentElement ? 'html' : el === document.body ? 'body' : '');
  const stackFiles = () => {
    const files = [];
    const lines = String(new Error().stack || '').split('\\n');
    for (const line of lines) {
      const match = line.match(/(https?:\\/\\/[^\\s)]+?):\\d+:\\d+/);
      if (!match) continue;
      let file = '';
      try { file = new URL(match[1]).pathname; } catch { continue; }
      if (!file.startsWith('/public/js/')) continue;
      if (files[files.length - 1] !== file && !files.includes(file)) files.push(file);
    }
    return files;
  };
  const record = (target, channel, name, changed) => {
    const files = stackFiles();
    const key = [target, channel, name, files.join('>')].join('|');
    const now = Math.round(performance.now());
    const row = rows.get(key) || { target, channel, name, files, count: 0, changed: 0, firstMs: now, lastMs: now };
    row.count += 1;
    if (changed) row.changed += 1;
    row.lastMs = now;
    rows.set(key, row);
  };
  const dataName = (prop) => 'data-' + String(prop).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

  for (const method of ['setAttribute', 'removeAttribute', 'toggleAttribute']) {
    const original = Element.prototype[method];
    Element.prototype[method] = function patched(name, ...rest) {
      const target = targetOf(this);
      if (!target) return original.call(this, name, ...rest);
      const before = this.getAttribute(name);
      const result = original.call(this, name, ...rest);
      record(target, 'attr', String(name), before !== this.getAttribute(name));
      return result;
    };
  }

  const proxied = new WeakMap();
  const proxyFor = (owner, real, make) => {
    let byOwner = proxied.get(real);
    if (!byOwner) { byOwner = make(); proxied.set(real, byOwner); }
    return byOwner;
  };
  const wrapGetter = (proto, prop, make) => {
    const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
    if (!descriptor || !descriptor.get) return;
    Object.defineProperty(proto, prop, {
      ...descriptor,
      get() {
        const real = descriptor.get.call(this);
        const target = targetOf(this);
        return target ? proxyFor(this, real, () => make(real, target)) : real;
      },
    });
  };

  wrapGetter(HTMLElement.prototype, 'dataset', (real, target) => new Proxy(real, {
    set(map, prop, value) {
      const before = map[prop];
      map[prop] = value;
      record(target, 'dataset', dataName(prop), before !== map[prop]);
      return true;
    },
    deleteProperty(map, prop) {
      const had = prop in map;
      delete map[prop];
      record(target, 'dataset', dataName(prop), had);
      return true;
    },
  }));

  wrapGetter(HTMLElement.prototype, 'style', (real, target) => new Proxy(real, {
    get(style, prop) {
      if (prop === 'setProperty' || prop === 'removeProperty') {
        return (name, ...rest) => {
          const before = style.getPropertyValue(name);
          const result = style[prop](name, ...rest);
          record(target, 'style', String(name), before !== style.getPropertyValue(name));
          return result;
        };
      }
      const value = style[prop];
      return typeof value === 'function' ? value.bind(style) : value;
    },
    set(style, prop, value) {
      const before = style.cssText;
      style[prop] = value;
      record(target, 'style', String(prop), before !== style.cssText);
      return true;
    },
  }));

  wrapGetter(Element.prototype, 'classList', (real, target) => new Proxy(real, {
    get(list, prop) {
      if (prop === 'add' || prop === 'remove' || prop === 'toggle' || prop === 'replace') {
        return (...tokens) => {
          const before = list.value;
          const result = list[prop](...tokens);
          record(target, 'class', String(tokens[0]), before !== list.value);
          return result;
        };
      }
      const value = list[prop];
      return typeof value === 'function' ? value.bind(list) : value;
    },
  }));

  // Neither root exists when this runs; watch each as the parser makes it.
  const watched = new Set();
  const watchRoots = () => {
    for (const [el, target] of [[document.documentElement, 'html'], [document.body, 'body']]) {
      if (!el || watched.has(target)) continue;
      watched.add(target);
      new MutationObserver((records) => { observed[target] += records.length; }).observe(el, { attributes: true });
    }
    return watched.size === 2;
  };
  if (!watchRoots()) {
    const arrival = new MutationObserver(() => { if (watchRoots()) arrival.disconnect(); });
    arrival.observe(document, { childList: true, subtree: true });
  }

  window.__spwRootWrites = () => ({ rows: [...rows.values()], observed: { ...observed } });
})();`;

const publicPath = (file) => String(file || '').replace(/^\/public\/js\//, '');

/**
 * Name the owner of one write from the files on its stack, innermost first.
 * A catalog entry on the stack owns the write. Failing that, the innermost
 * file outside the kernel does, as `(file:…)`: shared helpers and the loader
 * write for everyone and belong to no module. A write with no script file on
 * its stack came from an inline script in the page.
 */
export function ownerOfWrite(files = [], entryFiles = new Map()) {
  for (const file of files) {
    const ids = entryFiles.get(file);
    if (ids?.length) return ids.join('+');
  }
  const outside = files.find((file) => !file.startsWith(TRANSPORT_PREFIX));
  const file = outside || files[0];
  return file ? `(file:${publicPath(file)})` : '(inline script)';
}

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Does any stylesheet read this root token? An attribute or custom property
 * no selector names is a cheap write; one a selector names can restyle every
 * element that selector could match. Inline style properties and classes on
 * the root always count.
 */
export function isStyledToken(cssText, channel, name) {
  if (channel === 'class') return new RegExp(`\\.${escapeRegExp(name)}(?![\\w-])`).test(cssText);
  if (name.startsWith('--')) return new RegExp(`var\\(\\s*${escapeRegExp(name)}\\s*[,)]`).test(cssText);
  if (channel === 'style') return true;
  return new RegExp(`\\[${escapeRegExp(name)}(?![\\w-])`).test(cssText);
}

/** Fold the page's write rows into one line per owner, and name who stayed quiet. */
export function summarizeRootWrites(
  { rows = [], observed = {}, mounted = [] } = {},
  entryFiles = new Map(),
  isStyled = () => false,
) {
  const byOwner = new Map();
  const styledByToken = new Map();
  for (const row of rows) {
    const owner = ownerOfWrite(row.files, entryFiles);
    const entry = byOwner.get(owner) || { owner, writes: 0, changed: 0, styled: 0, firstMs: row.firstMs, lastMs: row.lastMs, tokens: new Map() };
    const tokenKey = `${row.channel}|${row.name}`;
    if (!styledByToken.has(tokenKey)) styledByToken.set(tokenKey, Boolean(isStyled(row.channel, row.name)));
    entry.writes += row.count;
    entry.changed += row.changed;
    if (styledByToken.get(tokenKey)) entry.styled += row.changed;
    entry.firstMs = Math.min(entry.firstMs, row.firstMs);
    entry.lastMs = Math.max(entry.lastMs, row.lastMs);
    const token = `${row.target}:${row.name}`;
    entry.tokens.set(token, (entry.tokens.get(token) || 0) + row.count);
    byOwner.set(owner, entry);
  }
  const owners = [...byOwner.values()]
    .map((entry) => ({
      owner: entry.owner,
      writes: entry.writes,
      changed: entry.changed,
      styled: entry.styled,
      firstMs: entry.firstMs,
      lastMs: entry.lastMs,
      tokens: [...entry.tokens.keys()].sort(),
      repeats: [...entry.tokens.entries()].filter(([, count]) => count > 1).map(([token, count]) => `${token}×${count}`).sort(),
    }))
    .sort((left, right) => (
      right.styled - left.styled || right.changed - left.changed || right.writes - left.writes
      || left.owner.localeCompare(right.owner)
    ));

  const writerIds = new Set(owners.flatMap((entry) => (entry.owner.startsWith('(') ? [] : entry.owner.split('+'))));
  const mountedIds = [...new Set(mounted)].sort();
  const writes = owners.reduce((total, entry) => total + entry.writes, 0);
  return {
    schema: 'root-write-census.v0',
    mounted: mountedIds.length,
    writers: mountedIds.filter((id) => writerIds.has(id)),
    quiet: mountedIds.filter((id) => !writerIds.has(id)),
    writes,
    changed: owners.reduce((total, entry) => total + entry.changed, 0),
    styled: owners.reduce((total, entry) => total + entry.styled, 0),
    tokens: new Set(owners.flatMap((entry) => entry.tokens)).size,
    observed: (observed.html || 0) + (observed.body || 0),
    owners,
  };
}

/**
 * When each module arrived: one line per catalog id. A module mounted on
 * several hosts keeps its earliest mount, the sum of its mount time and the
 * count of hosts. Times are the page's own clock, stretched by the probe.
 */
export function summarizeModuleTiming(records = []) {
  const byId = new Map();
  for (const row of records) {
    if (!row?.id) continue;
    const entry = byId.get(row.id) || { id: row.id, when: row.when || null, status: row.status, hosts: 0, mountedAt: null, loadMs: null, mountMs: 0 };
    entry.hosts += 1;
    if (row.status === 'mounted') entry.status = 'mounted';
    if (Number.isFinite(row.mountedAt)) entry.mountedAt = entry.mountedAt == null ? row.mountedAt : Math.min(entry.mountedAt, row.mountedAt);
    if (Number.isFinite(row.loadMs)) entry.loadMs = entry.loadMs == null ? row.loadMs : Math.max(entry.loadMs, row.loadMs);
    if (Number.isFinite(row.mountMs)) entry.mountMs += row.mountMs;
    byId.set(row.id, entry);
  }
  return [...byId.values()]
    .map((entry) => ({
      ...entry,
      mountedAt: entry.mountedAt == null ? null : Math.round(entry.mountedAt),
      loadMs: entry.loadMs == null ? null : Math.round(entry.loadMs),
      mountMs: Math.round(entry.mountMs),
    }))
    .sort((left, right) => (left.mountedAt ?? Infinity) - (right.mountedAt ?? Infinity) || left.id.localeCompare(right.id));
}

export function formatRootWriteCensus(route, census, { top = 30 } = {}) {
  const lines = [
    `[root-writes] ${route}: ${census.mounted} mounted · ${census.writers.length} write to the root on arrival · ${census.quiet.length} quiet`,
    `[root-writes] ${census.writes} writes · ${census.changed} changed a value · ${census.styled} of those on a token a stylesheet reads · ${census.tokens} tokens · browser observed ${census.observed} root mutations`,
  ];
  const width = census.owners.slice(0, top).reduce((max, entry) => Math.max(max, entry.owner.length), 5);
  lines.push(`  ${'owner'.padEnd(width)}  writes  changed  styled  tokens  first–last ms`);
  for (const entry of census.owners.slice(0, top)) {
    lines.push(`  ${entry.owner.padEnd(width)}  ${String(entry.writes).padStart(6)}  ${String(entry.changed).padStart(7)}  ${String(entry.styled).padStart(6)}  ${String(entry.tokens.length).padStart(6)}  ${entry.firstMs}–${entry.lastMs}`);
  }
  if (census.owners.length > top) lines.push(`  … ${census.owners.length - top} more owners (--json for all)`);
  lines.push(`[root-writes] quiet: ${census.quiet.join(', ') || '(none)'}`);
  return lines.join('\n');
}

/** Catalog entry file (as a /public/js/… path) → the module ids that load it. */
export function catalogEntryFiles(definitions = [], catalogDirUrl = '/public/js/runtime/catalog/') {
  const entries = new Map();
  for (const definition of definitions) {
    const match = String(definition?.load || '').match(/import\(\s*['"`]([^'"`]+)['"`]\s*\)/);
    if (!definition?.id || !match) continue;
    const file = match[1].startsWith('/')
      ? match[1]
      : new URL(match[1], `http://x${catalogDirUrl}`).pathname;
    entries.set(file, [...(entries.get(file) || []), definition.id]);
  }
  return entries;
}

/** Authored stylesheets only; the generated bundles repeat them. */
async function readCss(dir) {
  const { readdir, readFile } = await import('node:fs/promises');
  const parts = [];
  for (const entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.css')) continue;
    const file = path.join(entry.parentPath || entry.path, entry.name);
    if (/[\\/](?:bundles|generated|dist)[\\/]/.test(file)) continue;
    parts.push(await readFile(file, 'utf8'));
  }
  return parts.join('\n');
}

function flag(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1] || '';
}

async function main() {
  const args = process.argv.slice(2);
  const say = (line) => process.stderr.write(`[root-writes] ${line}\n`);
  const harness = await import('./lib/chrome-headless-harness.mjs');
  const { checkLoopback } = await import('./qa-doctor.mjs');
  await import('./lib/register-public-imports.mjs');
  const { MODULE_DEFS } = await import('../public/js/runtime/catalog/index.js');
  const entryFiles = catalogEntryFiles(MODULE_DEFS);
  const cssText = await readCss(path.join(harness.ROOT, 'public/css'));
  const isStyled = (channel, name) => isStyledToken(cssText, channel, name);

  const routes = (flag(args, '--routes') || '/').split(',').map((route) => route.trim()).filter(Boolean);
  const observeMs = Number(flag(args, '--observe')) || 12000;
  const quietMs = Number(flag(args, '--quiet')) || 6000;
  const maxObserveMs = Math.max(observeMs, Number(flag(args, '--max-observe')) || 90000);
  const receiptFile = flag(args, '--receipt');

  const loopback = await checkLoopback();
  if (!loopback.ok) {
    say(loopback.detail);
    say(`→ ${loopback.next}`);
    return 3;
  }
  const chromePath = await harness.resolveChrome(flag(args, '--chrome'));
  if (!chromePath || typeof WebSocket === 'undefined') {
    say(chromePath ? 'global WebSocket unavailable (Node 22+ required for CDP)' : 'Chrome/Chromium not found');
    return 2;
  }

  let devChild = null;
  let chromeChild = null;
  const shutdown = harness.installShutdown([
    () => harness.killProcessTree(chromeChild),
    () => harness.killProcessTree(devChild),
  ]);

  try {
    let base = (flag(args, '--base') || '').replace(/\/$/, '');
    if (!base) {
      const spawned = harness.spawnDevServer(await harness.pickFreePort());
      devChild = spawned.child;
      base = await spawned.ready;
    }
    say(`source at ${base}; at least ${observeMs}ms of arrival per route, until ${quietMs}ms pass with no new mount; no input`);

    const debugPort = 9333 + Math.floor(Math.random() * 400);
    chromeChild = await harness.openChrome(chromePath, await harness.createChromeProfileDir('spw-roots-'), debugPort);

    const report = { schema: 'root-write-census-report.v0', observeMs, routes: {} };
    for (const route of routes) {
      const target = await harness.newPageTarget(debugPort);
      const session = new harness.CdpSession(target.webSocketDebuggerUrl);
      await session.open();
      try {
        await session.send('Page.enable');
        await session.send('Page.addScriptToEvaluateOnNewDocument', { source: ROOT_WRITE_PROBE_SOURCE });
        await harness.navigateAndProbe(session, { url: `${base}${route}`, settleMs: 10000, timeoutMs: 45000, logBrowser: false });
        // A busy machine stretches arrival. Watch until no module has mounted
        // for a quiet spell, so a slow page is not read as a short one.
        const startedAt = Date.now();
        let lastCount = -1;
        let lastChangeAt = Date.now();
        while (Date.now() - startedAt < maxObserveMs) {
          await harness.sleep(1500);
          const count = await harness.evaluateProbe(session, `(window.__SPW_SITE__?.snapshotModules?.() || []).filter((row) => row.status === 'mounted').length`, 20000).catch(() => lastCount);
          if (count !== lastCount) {
            lastCount = count;
            lastChangeAt = Date.now();
          }
          if (Date.now() - startedAt >= observeMs && Date.now() - lastChangeAt >= quietMs) break;
        }
        const observedMs = Date.now() - startedAt;
        const page = await harness.evaluateProbe(session, `(() => {
          if (typeof window.__spwRootWrites !== 'function' || !window.__SPW_SITE__) return { missing: true };
          const records = window.__SPW_SITE__.snapshotModules().map((row) => ({
            id: row.baseId, status: row.status, when: row.effectiveWhen,
            mountedAt: row.mountedAt, loadMs: row.loadMs, mountMs: row.mountMs,
          }));
          const mounted = records.filter((row) => row.status === 'mounted').map((row) => row.id);
          return { ...window.__spwRootWrites(), mounted, records };
        })()`, 20000);
        if (!page || page.missing) {
          say(`${route}: the probe or the runtime did not come up`);
          return 2;
        }
        const census = { ...summarizeRootWrites(page, entryFiles, isStyled), observedMs, modules: summarizeModuleTiming(page.records) };
        report.routes[route] = census;
        if (!args.includes('--json')) process.stdout.write(`${formatRootWriteCensus(route, census)}\n`);
      } finally {
        session.close();
        await harness.closePageTarget(debugPort, target);
      }
    }

    if (receiptFile) {
      mkdirSync(path.dirname(path.resolve(receiptFile)), { recursive: true });
      writeFileSync(receiptFile, `${JSON.stringify(report, null, 2)}\n`);
    }
    if (args.includes('--json')) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return 0;
  } finally {
    shutdown();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code), (error) => {
    process.stderr.write(`[root-writes] ${error?.stack || error}\n`);
    process.exit(2);
  });
}
