/**
 * Shared Chrome headless + CDP helpers for smoke:nav / bench:nav / component captures.
 * Zero npm deps — Node 22+ WebSocket + system Chrome.
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { access, mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Cap collected browser console/exception diagnostics per navigation. */
export const BROWSER_DIAGNOSTIC_LIMIT = 24;

export const CHROME_CANDIDATES = Object.freeze([
  process.env.CHROME_PATH,
  process.env.GOOGLE_CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
].filter(Boolean));

/** Named viewports aligned with packing / medium language. */
export const VIEWPORTS = Object.freeze({
  phone: Object.freeze({
    id: 'phone', width: 390, height: 844, deviceScaleFactor: 3, mobile: true, hasTouch: true,
  }),
  phablet: Object.freeze({
    id: 'phablet', width: 430, height: 932, deviceScaleFactor: 3, mobile: true, hasTouch: true,
  }),
  tablet: Object.freeze({
    id: 'tablet', width: 768, height: 1024, deviceScaleFactor: 2, mobile: true, hasTouch: true,
  }),
  laptop: Object.freeze({
    id: 'laptop', width: 1280, height: 800, deviceScaleFactor: 1, mobile: false, hasTouch: false,
  }),
  desktop: Object.freeze({
    id: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, hasTouch: false,
  }),
  wide: Object.freeze({
    id: 'wide', width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false, hasTouch: false,
  }),
  pocket: Object.freeze({
    id: 'pocket', width: 390, height: 844, deviceScaleFactor: 3, mobile: true, hasTouch: true,
  }),
  fold: Object.freeze({
    id: 'fold', width: 768, height: 1024, deviceScaleFactor: 2, mobile: true, hasTouch: true,
  }),
  broadsheet: Object.freeze({
    id: 'broadsheet', width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, hasTouch: false,
  }),
});

export const DEFAULT_ROUTES = Object.freeze([
  '/',
  '/settings/',
  '/about/',
  '/topics/',
  '/topics/software/',
]);

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resolveChrome(explicit) {
  const candidates = explicit ? [explicit, ...CHROME_CANDIDATES] : [...CHROME_CANDIDATES];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.includes('/') || candidate.includes('\\')) {
      try {
        await access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }
    return candidate;
  }
  return null;
}

export async function pickFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  return port;
}

export async function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok || res.status === 404 || res.status === 301 || res.status === 302) return true;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(120);
  }
  throw lastError || new Error(`Server not ready: ${url}`);
}

export async function waitForJson(url, timeoutMs = 20000) {
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
      lastError = new Error(`HTTP ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw lastError || new Error(`timeout ${url}`);
}

export function spawnDevServer(port) {
  const child = spawn(process.execPath, [
    'scripts/dev-server.mjs',
    '--host', '127.0.0.1',
    '--port', String(port),
  ], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  let output = '';
  const onData = (chunk) => {
    output += chunk.toString();
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  let settled = false;
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`dev-server start timeout\n${output.slice(-2000)}`));
      }
    }, 25000);

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    const check = (chunk) => {
      const match = chunk.toString().match(/running at (http:\/\/[^\s]+)/);
      if (match) finish(resolve, match[1].replace(/\/$/, ''));
    };
    child.stdout.on('data', check);
    child.stderr.on('data', check);
    child.on('exit', (code) => {
      finish(reject, new Error(`dev-server exited early (${code})\n${output.slice(-2000)}`));
    });
    child.on('error', (error) => finish(reject, error));
  });

  return { child, ready, getOutput: () => output };
}

export class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.eventHandlers = new Map();
    this._onMessage = null;
  }

  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (err) => {
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      };
      const cleanup = () => {
        this.ws.removeEventListener('open', onOpen);
        this.ws.removeEventListener('error', onError);
      };
      this.ws.addEventListener('open', onOpen);
      this.ws.addEventListener('error', onError);
    });

    this._onMessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (msg.id != null && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
        return;
      }
      if (msg.method) {
        const handlers = this.eventHandlers.get(msg.method) || [];
        for (const fn of handlers.slice()) fn(msg.params);
      }
    };
    this.ws.addEventListener('message', this._onMessage);
  }

  on(method, fn) {
    const list = this.eventHandlers.get(method) || [];
    list.push(fn);
    this.eventHandlers.set(method, list);
    return () => {
      const next = (this.eventHandlers.get(method) || []).filter((h) => h !== fn);
      this.eventHandlers.set(method, next);
    };
  }

  once(method, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error(`CDP event timeout: ${method} (${timeoutMs}ms)`));
      }, timeoutMs);
      const off = this.on(method, (params) => {
        clearTimeout(timer);
        off();
        resolve(params);
      });
    });
  }

  send(method, params = {}, timeoutMs = 60000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP call timeout: ${method} (${timeoutMs}ms)`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  close() {
    for (const { reject } of this.pending.values()) {
      reject(new Error('CDP session closed'));
    }
    this.pending.clear();
    this.eventHandlers.clear();
    try {
      if (this._onMessage && this.ws) this.ws.removeEventListener('message', this._onMessage);
      this.ws?.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Chrome user-data directory with OS tmp first, repo-local `.tmp/` fallback
 * (sandbox / restricted tmp environments).
 * @param {string} [prefix='spw-chrome-']
 * @returns {Promise<string>}
 */
export async function createChromeProfileDir(prefix = 'spw-chrome-') {
  try {
    return await mkdtemp(path.join(tmpdir(), prefix));
  } catch {
    const localTmp = path.join(ROOT, '.tmp');
    await mkdir(localTmp, { recursive: true });
    return mkdtemp(path.join(localTmp, prefix));
  }
}

/**
 * Close a CDP page target so Chrome does not accumulate tabs across cells.
 * @param {number|string} debugPort
 * @param {{ id?: string, targetId?: string }|string|null} target
 */
export async function closePageTarget(debugPort, target) {
  const targetId = typeof target === 'string'
    ? target
    : (target?.id || target?.targetId);
  if (!targetId || debugPort == null) return;
  try {
    await fetch(`http://127.0.0.1:${debugPort}/json/close/${targetId}`, { method: 'PUT' });
  } catch {
    // ignore — process kill cleans up remaining targets
  }
}

export async function openChrome(chromePath, userDataDir, port) {
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-extensions',
    '--disable-sync',
    '--disable-translate',
    '--mute-audio',
    '--disable-dev-shm-usage',
    // Keep timers/rAF alive in headless — background throttling stalls boot settle.
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-crash-reporter',
    '--disable-breakpad',
    '--disable-software-rasterizer',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ];
  const child = spawn(chromePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let err = '';
  child.stderr.on('data', (c) => {
    err += c.toString();
  });
  await waitForJson(`http://127.0.0.1:${port}/json/version`, 25000).catch((error) => {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
    throw new Error(`Chrome debug port not ready: ${error.message}\n${err.slice(-1500)}`);
  });
  return child;
}

export async function newPageTarget(debugPort) {
  try {
    const res = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
    if (res.ok) return res.json();
  } catch {
    // fall through
  }
  const list = await waitForJson(`http://127.0.0.1:${debugPort}/json/list`);
  const page = (list || []).find((t) => t.type === 'page' && t.webSocketDebuggerUrl) || list?.[0];
  if (!page?.webSocketDebuggerUrl) throw new Error('No CDP page target');
  return page;
}

/**
 * Format a CDP console/exception payload into a short diagnostic string.
 * Exported for unit tests.
 */
export function formatBrowserDiagnostic(kind, payload) {
  if (kind === 'console') {
    const type = payload?.type || 'log';
    const text = (payload?.args || [])
      .map((a) => a?.value ?? a?.description ?? a?.unserializableValue ?? '')
      .filter(Boolean)
      .join(' ')
      .trim();
    return `[${type}] ${text || '(empty console message)'}`.slice(0, 400);
  }
  if (kind === 'exception') {
    const details = payload?.exceptionDetails || payload;
    const text = details?.exception?.description || details?.text || 'Uncaught exception';
    return `[exception] ${String(text).slice(0, 400)}`;
  }
  return String(payload || '').slice(0, 400);
}

function pushDiagnostic(list, entry) {
  if (list.length >= BROWSER_DIAGNOSTIC_LIMIT) return;
  list.push(entry);
}

export function withDebugQuery(pathname, { debugLayout = false, debugQa = false } = {}) {
  const url = new URL(pathname.startsWith('/') ? pathname : `/${pathname}`, 'http://local.invalid');
  if (debugQa) {
    url.searchParams.set('debug', 'qa,layout,agent');
    url.searchParams.set('qa', 'agent');
    url.searchParams.set('log', 'layout-shift');
    url.searchParams.set('log-level', 'debug');
  } else if (debugLayout) {
    url.searchParams.set('debug', 'layout');
    url.searchParams.set('log', 'layout-shift');
    url.searchParams.set('log-level', 'debug');
  }
  return `${url.pathname}${url.search}`;
}

/**
 * Lightweight document-shell probe for environments where Chrome/CDP is unavailable.
 * This is intentionally not presented as runtime coverage: it only verifies that the
 * server returned a minimally usable authored document.
 */
export function inspectHtmlShell(html, { status = 200 } = {}) {
  const source = String(html || '');
  const surfaceMatch = source.match(/data-spw-surface=["']([^"']+)["']/i);
  const result = {
    status,
    hasTitle: /<title(?:\s[^>]*)?>\s*[^<\s][^<]*<\/title>/i.test(source),
    hasH1: /<h1(?:\s[^>]*)?>/i.test(source),
    hasMain: /<main(?:\s[^>]*)?>/i.test(source),
    surface: surfaceMatch?.[1] || null,
  };
  return {
    ...result,
    ok: status >= 200
      && status < 400
      && result.hasTitle
      && result.hasH1
      && result.hasMain
      && Boolean(result.surface),
  };
}

/**
 * Probe route document shells without a browser. Callers must label this as a
 * degraded mode because JavaScript execution and runtime readiness are not tested.
 */
export async function probeHttpRoutes({
  base,
  routes,
  queryOptions = {},
  fetchImpl = fetch,
} = {}) {
  const results = [];
  for (const route of routes || []) {
    const pathWithQuery = withDebugQuery(route, queryOptions);
    const url = new URL(pathWithQuery, `${String(base).replace(/\/$/, '')}/`).href;
    try {
      const response = await fetchImpl(url);
      const html = await response.text();
      results.push({
        route: pathWithQuery,
        url,
        ...inspectHtmlShell(html, { status: response.status }),
      });
    } catch (error) {
      results.push({
        route: pathWithQuery,
        url,
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
}

export async function applyViewport(session, viewport) {
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
    mobile: Boolean(viewport.mobile),
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  });
  try {
    await session.send('Emulation.setTouchEmulationEnabled', {
      enabled: Boolean(viewport.hasTouch),
      maxTouchPoints: viewport.hasTouch ? 5 : 0,
    });
  } catch {
    // optional
  }
}

export async function clearViewport(session) {
  try {
    await session.send('Emulation.clearDeviceMetricsOverride');
  } catch {
    // optional
  }
}

/** Rich in-page probe for nav smoke + perf matrix. */
export const PERF_PROBE_EXPRESSION = `(() => {
  const html = document.documentElement;
  const body = document.body;
  const main = document.querySelector('main');
  const nav = performance.getEntriesByType('navigation')[0];
  const marks = performance.getEntriesByType('mark')
    .filter((m) => String(m.name || '').startsWith('spw:'))
    .map((m) => ({ name: m.name, startTime: Math.round(m.startTime) }));
  const measures = performance.getEntriesByType('measure')
    .filter((m) => String(m.name || '').startsWith('spw:'))
    .map((m) => ({ name: m.name, duration: Math.round(m.duration) }));
  const measureMap = Object.create(null);
  for (const m of measures) {
    if (measureMap[m.name] == null || m.duration > measureMap[m.name]) {
      measureMap[m.name] = m.duration;
    }
  }
  const pick = (...names) => {
    for (const n of names) {
      if (measureMap[n] != null) return measureMap[n];
    }
    return null;
  };
  const hasMark = (name) => marks.some((m) => m.name === name);
  const lastMark = marks.length ? marks[marks.length - 1] : null;
  const recentMarks = marks.slice(-8).map((m) => m.name);

  // Horizontal overflow only (vertical scroll is normal page length).
  const packLocal = document.querySelectorAll('[data-spw-pack-local]').length;
  const frameEls = Array.from(document.querySelectorAll('main .site-frame, main [data-spw-kind="frame"]')).slice(0, 40);
  const overflowXDetails = [];
  frameEls.forEach((el) => {
    if (el.scrollWidth <= el.clientWidth + 2) return;
    const heading = el.querySelector(':scope > :is(h1, h2, h3), :scope > header :is(h1, h2, h3)');
    overflowXDetails.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      className: typeof el.className === 'string'
        ? el.className.trim().split(/\\s+/).filter(Boolean).slice(0, 4).join('.')
        : null,
      feature: el.getAttribute('data-spw-feature') || null,
      kind: el.getAttribute('data-spw-kind') || null,
      heading: heading?.textContent?.trim().replace(/\\s+/g, ' ').slice(0, 80) || null,
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      overflowPx: el.scrollWidth - el.clientWidth,
    });
  });
  const overflowXFrames = overflowXDetails.length;
  let bodyOverflowX = false;
  if (body) bodyOverflowX = body.scrollWidth > body.clientWidth + 2;

  let site = null;
  let moduleStages = null;
  try {
    site = window.__SPW_SITE__ ? {
      hasLayoutQa: typeof window.__SPW_SITE__.layoutQa?.snapshot === 'function',
      hasDebugQa: typeof window.__SPW_SITE__.debugQa?.posture === 'function',
      listModules: typeof window.__SPW_SITE__.listModules === 'function',
    } : null;
    const records = window.spwCompose?.controls?.modules?.records?.()
      || window.__SPW_SITE__?.compose?.controls?.modules?.records?.()
      || null;
    if (Array.isArray(records)) {
      const counts = Object.create(null);
      for (const r of records) {
        const stage = r?.stage || r?.status || 'unknown';
        counts[stage] = (counts[stage] || 0) + 1;
      }
      moduleStages = counts;
    }
  } catch (e) {
    site = { error: String(e) };
  }

  const mainRect = main ? main.getBoundingClientRect() : null;
  const resources = performance.getEntriesByType('resource') || [];
  const jsResources = resources.filter((r) => /\\.js($|\\?)/i.test(r.name) || r.initiatorType === 'script');

  return {
    title: document.title || '',
    readyState: document.readyState,
    href: location.href,
    surface: body?.dataset?.spwSurface || html?.dataset?.spwSurface || null,
    layoutVariant: body?.dataset?.spwLayout || main?.getAttribute?.('data-spw-layout') || null,
    runtimeStage: html?.dataset?.spwRuntimeStage || null,
    pageState: html?.dataset?.spwPageState || null,
    debugQaPosture: html?.dataset?.spwDebugQaPosture || null,
    debugLayout: html?.dataset?.spwDebugLayout || null,
    layoutQaGrade: html?.dataset?.spwLayoutQaGrade || null,
    layoutShiftState: html?.dataset?.spwLayoutShiftState || null,
    layoutShiftTotal: html?.dataset?.spwLayoutShiftTotal || null,
    layoutAssumptionsPass: html?.dataset?.spwLayoutAssumptionsPass || null,
    colorMode: html?.dataset?.spwColorMode || null,
    paletteResonance: html?.dataset?.spwPaletteResonance || null,
    tangibility: html?.dataset?.spwTangibility || null,
    captureMode: html?.dataset?.spwCaptureMode || null,
    fontsReady: document.fonts ? document.fonts.status === 'loaded' : true,
    activeSection: document.querySelector('main section[data-spw-section-state="active"]')?.id || null,
    sectionHandleState: document.querySelector('.spw-section-handle')?.getAttribute('data-spw-handle-state') || null,
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    main: mainRect ? {
      width: Math.round(mainRect.width),
      height: Math.round(mainRect.height),
    } : null,
    packing: {
      packLocal,
      frames: frameEls.length,
      overflowXFrames,
      overflowXDetails: overflowXDetails.slice(0, 12),
      bodyOverflowX,
    },
    navigation: nav ? {
      type: nav.type,
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
      loadEventEnd: Math.round(nav.loadEventEnd),
      duration: Math.round(nav.duration),
      transferSize: nav.transferSize || 0,
      responseEnd: Math.round(nav.responseEnd || 0),
      domInteractive: Math.round(nav.domInteractive || 0),
    } : null,
    spw: {
      bootToReady: pick('spw:boot-to-ready'),
      immediateLayer: pick('spw:immediate-layer', 'spw:immediate-layer-parallel'),
      immediateCore: pick('spw:immediate-layer:core:parallel'),
      immediateNonCore: pick('spw:immediate-non-core-layers'),
      settledLayer: pick('spw:settled-layer'),
      fullBoot: pick('spw:full-boot'),
      siteSettings: pick('spw:module:site-settings'),
      shellDisclosure: pick('spw:module:shell-disclosure'),
      hasSiteReadyMark: hasMark('spw:site-ready'),
      hasBootStartMark: hasMark('spw:boot-start'),
      lastMark: lastMark ? lastMark.name : null,
      recentMarks,
      moduleStages,
      idleChunks: Object.fromEntries(
        measures
          .filter((m) => String(m.name || '').startsWith('spw:idle-chunk:') && !String(m.name).includes(':start') && !String(m.name).includes(':end'))
          .map((m) => [String(m.name).replace(/^spw:idle-chunk:/, ''), m.duration]),
      ),
      idleChunkActive: html?.dataset?.spwRuntimeIdleChunk || null,
      idleChunksPlanned: html?.dataset?.spwRuntimeIdleChunks || null,
    },
    resources: {
      total: resources.length,
      scripts: jsResources.length,
      scriptTransfer: Math.round(jsResources.reduce((s, r) => s + (r.transferSize || 0), 0)),
    },
    markCount: marks.length,
    measureCount: measures.length,
    site,
  };
})()`;

export async function evaluateProbe(session, expression = PERF_PROBE_EXPRESSION, timeoutMs = 10000) {
  const { result, exceptionDetails } = await session.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  }, timeoutMs);
  if (exceptionDetails) {
    throw new Error(exceptionDetails.text || 'Runtime.evaluate failed');
  }
  return result?.value || {};
}

/**
 * Capture a JPEG/PNG still. Tries compositor surface first, then the
 * fallback that survives headless blanks. Shared by visual:capture and
 * ad-hoc viewport still scripts so they cannot drift.
 */
export async function screenshotBuffer(session, { format = 'png', quality = 70, clip = null } = {}) {
  const cssClip = clip
    ? {
      x: Math.max(0, clip.x),
      y: Math.max(0, clip.y),
      width: Math.max(2, clip.width),
      height: Math.max(2, clip.height),
      scale: clip.scale || 1,
    }
    : null;
  const beyond = Boolean(clip?.captureBeyondViewport);
  const attempts = cssClip
    ? [
      { format, fromSurface: true, captureBeyondViewport: beyond, clip: cssClip },
      { format, fromSurface: true, captureBeyondViewport: !beyond, clip: cssClip },
      { format, fromSurface: false, captureBeyondViewport: beyond, clip: cssClip },
    ]
    : [
      { format, fromSurface: true, captureBeyondViewport: false },
      { format, fromSurface: false, captureBeyondViewport: false },
    ];
  let lastErr = null;
  for (let i = 0; i < attempts.length; i += 1) {
    const params = { ...attempts[i] };
    if (format === 'jpeg') params.quality = quality;
    try {
      const { data } = await session.send('Page.captureScreenshot', params, 12000);
      if (data) return Buffer.from(data, 'base64');
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('captureScreenshot failed');
}

/**
 * Settled when boot finished writing ready stage, lifecycle advanced, or boot-to-ready measure exists.
 */
export function isRuntimeSettled(probe) {
  if (!probe) return false;
  if (probe.runtimeStage === 'ready') return true;
  if (probe.spw?.hasSiteReadyMark) return true;
  if (probe.spw?.bootToReady != null) return true;
  if (probe.pageState && !['', 'booting', 'boot', 'preflight'].includes(probe.pageState)) {
    return true;
  }
  return false;
}

/** Core immediate wave measured — useful partial under cold headless when full ready lags. */
export function isBootPartial(probe) {
  if (!probe) return false;
  if (isRuntimeSettled(probe)) return true;
  if (probe.spw?.immediateLayer != null || probe.spw?.immediateCore != null) return true;
  if (probe.spw?.hasBootStartMark && probe.measureCount > 0) return true;
  return false;
}

export function isSoftOk(probe) {
  if (!probe?.surface) return false;
  return probe.readyState === 'complete' || probe.readyState === 'interactive';
}

export async function navigateAndProbe(session, {
  url,
  viewport = null,
  settleMs = 10000,
  timeoutMs = 45000,
  retries = 1,
  logBrowser = true,
  /** Extra settle budget when boot is clearly progressing but not yet ready. */
  partialGraceMs = 8000,
} = {}) {
  let lastError;
  // Runtime.evaluate can briefly queue behind first-paint work even when a short
  // settle budget is requested. Keep its call budget independent enough to
  // avoid turning a fast smoke request into a false CDP failure.
  const probeTimeoutMs = Math.min(8000, Math.max(3000, Math.floor(settleMs / 2)));
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const diagnostics = [];
    const offs = [];
    try {
      await session.send('Page.enable');
      await session.send('Runtime.enable');
      try {
        await session.send('Network.enable');
      } catch {
        // optional
      }
      // Prefer an active target so headless does not throttle rAF / timers.
      try {
        await session.send('Page.bringToFront');
      } catch {
        // optional on older Chrome
      }
      try {
        await session.send('Emulation.setFocusEmulationEnabled', { enabled: true });
      } catch {
        // optional
      }

      offs.push(session.on('Runtime.consoleAPICalled', (params) => {
        if (params?.type !== 'error' && params?.type !== 'warning') return;
        const entry = formatBrowserDiagnostic('console', params);
        pushDiagnostic(diagnostics, entry);
        if (logBrowser) process.stderr.write(`  [browser:${params.type}] ${entry.replace(/^\[[^\]]+\]\s*/, '')}\n`);
      }));
      offs.push(session.on('Runtime.exceptionThrown', (params) => {
        const entry = formatBrowserDiagnostic('exception', params);
        pushDiagnostic(diagnostics, entry);
        if (logBrowser) process.stderr.write(`  [browser:exception] ${entry.replace(/^\[exception\]\s*/, '')}\n`);
      }));

      if (viewport) await applyViewport(session, viewport);

      const loadWait = session.once('Page.loadEventFired', timeoutMs).then(() => 'load').catch(() => 'timeout');

      const navStart = performance.now();
      const navResult = await session.send('Page.navigate', { url }, timeoutMs);
      if (navResult?.errorText) {
        throw new Error(`navigate failed: ${navResult.errorText}`);
      }

      const loadOutcome = await loadWait;

      const baseDeadline = Date.now() + Math.max(settleMs, 2000);
      let deadline = baseDeadline;
      let probe = await evaluateProbe(session, PERF_PROBE_EXPRESSION, probeTimeoutMs);
      let sawPartial = isBootPartial(probe);
      while (Date.now() < deadline && !isRuntimeSettled(probe)) {
        await sleep(250);
        probe = await evaluateProbe(session, PERF_PROBE_EXPRESSION, probeTimeoutMs);
        if (!sawPartial && isBootPartial(probe)) {
          sawPartial = true;
          // Boot is progressing; allow a modest grace window beyond settleMs.
          deadline = Math.max(deadline, Date.now() + Math.max(0, partialGraceMs));
        }
      }
      if (isRuntimeSettled(probe)) {
        await sleep(Math.min(800, Math.max(200, Math.floor(settleMs / 10))));
        probe = await evaluateProbe(session, PERF_PROBE_EXPRESSION, probeTimeoutMs);
      }

      const wallMs = Math.round(performance.now() - navStart);
      const settled = isRuntimeSettled(probe);
      const partial = isBootPartial(probe);
      const ok = isSoftOk(probe);
      const consoleErrors = diagnostics.filter((d) => d.startsWith('[error]') || d.startsWith('[exception]'));
      const consoleWarnings = diagnostics.filter((d) => d.startsWith('[warning]'));

      return {
        url,
        wallMs,
        ok,
        settled,
        partial,
        loadOutcome,
        attempt: attempt + 1,
        probe,
        diagnostics,
        consoleErrors,
        consoleWarnings,
        hasConsoleError: consoleErrors.length > 0,
      };
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(400);
    } finally {
      for (const off of offs) {
        try {
          off();
        } catch {
          // ignore
        }
      }
    }
  }
  throw lastError || new Error('navigateAndProbe failed');
}

export function killProcessTree(child) {
  if (!child || child.killed) return;
  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }
  setTimeout(() => {
    try {
      if (!child.killed) child.kill('SIGKILL');
    } catch {
      // ignore
    }
  }, 1500).unref?.();
}

export function installShutdown(handlers = []) {
  const run = () => {
    for (const fn of handlers) {
      try {
        fn();
      } catch {
        // ignore
      }
    }
  };
  process.once('SIGINT', () => {
    run();
    process.exit(130);
  });
  process.once('SIGTERM', () => {
    run();
    process.exit(143);
  });
  return run;
}

export function pickViewports(names, { quick = false, fallback = ['phone', 'tablet', 'laptop', 'desktop'] } = {}) {
  const list = names?.length
    ? names
    : (quick ? ['phone', 'laptop'] : fallback);
  return list.map((name) => {
    const vp = VIEWPORTS[name];
    if (!vp) {
      throw new Error(`Unknown viewport "${name}". Choose: ${Object.keys(VIEWPORTS).join(', ')}`);
    }
    return vp;
  });
}

export function cellFromProbe(row, { route, viewport = null } = {}) {
  const p = row.probe || {};
  const consoleErrors = Array.isArray(row.consoleErrors) ? row.consoleErrors : [];
  const consoleWarnings = Array.isArray(row.consoleWarnings) ? row.consoleWarnings : [];
  const diagnostics = Array.isArray(row.diagnostics) ? row.diagnostics : [];
  return {
    route: route || (p.href ? new URL(p.href).pathname + new URL(p.href).search : row.url),
    viewport: viewport?.id || 'default',
    width: viewport?.width || p.viewport?.innerWidth || null,
    height: viewport?.height || p.viewport?.innerHeight || null,
    mobile: viewport ? Boolean(viewport.mobile) : null,
    wallMs: row.wallMs,
    ok: row.ok,
    settled: row.settled,
    partial: Boolean(row.partial),
    loadOutcome: row.loadOutcome || null,
    attempt: row.attempt || 1,
    dcl: p.navigation?.domContentLoaded ?? null,
    load: p.navigation?.loadEventEnd ?? null,
    navDuration: p.navigation?.duration ?? null,
    transferSize: p.navigation?.transferSize ?? null,
    bootToReady: p.spw?.bootToReady ?? null,
    immediateLayer: p.spw?.immediateLayer ?? null,
    immediateCore: p.spw?.immediateCore ?? null,
    siteSettingsMs: p.spw?.siteSettings ?? null,
    shellMs: p.spw?.shellDisclosure ?? null,
    settledLayerMs: p.spw?.settledLayer ?? null,
    surface: p.surface,
    pageState: p.pageState,
    runtimeStage: p.runtimeStage,
    layoutVariant: p.layoutVariant,
    layoutQaGrade: p.layoutQaGrade,
    layoutShiftTotal: p.layoutShiftTotal,
    lastMark: p.spw?.lastMark ?? null,
    moduleStages: p.spw?.moduleStages ?? null,
    idleChunks: p.spw?.idleChunks ?? null,
    idleChunkActive: p.spw?.idleChunkActive ?? null,
    packLocal: p.packing?.packLocal ?? 0,
    overflowXFrames: p.packing?.overflowXFrames ?? 0,
    overflowXDetails: p.packing?.overflowXDetails ?? [],
    bodyOverflowX: Boolean(p.packing?.bodyOverflowX),
    mainWidth: p.main?.width ?? null,
    mainHeight: p.main?.height ?? null,
    innerWidth: p.viewport?.innerWidth ?? null,
    innerHeight: p.viewport?.innerHeight ?? null,
    scripts: p.resources?.scripts ?? null,
    scriptTransfer: p.resources?.scriptTransfer ?? null,
    consoleErrorCount: consoleErrors.length,
    consoleWarningCount: consoleWarnings.length,
    hasConsoleError: Boolean(row.hasConsoleError) || consoleErrors.length > 0,
    diagnostics: diagnostics.length ? diagnostics : undefined,
    consoleErrors: consoleErrors.length ? consoleErrors : undefined,
    consoleWarnings: consoleWarnings.length ? consoleWarnings : undefined,
    probe: p,
  };
}

/**
 * Shared hard-ok policy for smoke/bench cells.
 * @param {{ ok?: boolean, settled?: boolean, hasConsoleError?: boolean, bodyOverflowX?: boolean, overflowXFrames?: number }} cell
 * @param {{ requireSettled?: boolean, failOnConsoleError?: boolean, failOnOverflowX?: boolean }} [options]
 */
export function evaluateHardOk(cell, options = {}) {
  if (!cell?.ok) return false;
  if (options.requireSettled && !cell.settled) return false;
  if (options.failOnConsoleError && cell.hasConsoleError) return false;
  if (options.failOnOverflowX && (cell.bodyOverflowX || (cell.overflowXFrames || 0) > 0)) return false;
  return true;
}
