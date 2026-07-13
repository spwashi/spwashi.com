#!/usr/bin/env node
/**
 * generate-pwa-icons.mjs
 * ---------------------------------------------------------------------------
 * Compose the derived PWA icon set from the canonical icon artwork
 * (public/images/icon-512.png).
 *
 * Launcher-masked surfaces must be full-bleed: Android crops `purpose:
 * maskable` icons to the device tile shape and fills leftover transparency
 * with black, and iOS composites apple-touch icons onto black. Artwork with
 * baked-in rounded corners therefore ships with its own field extended
 * edge-to-edge, scaled so the motif stays inside the maskable safe zone
 * (the central 80% circle) while the artwork's decorative ring falls outside
 * the canvas and the launcher's crop.
 *
 * Rendering happens in headless Chrome (canvas → PNG data URL) against a
 * throwaway local static server, so the tool stays dependency-free and the
 * output matches browser rasterization.
 *
 * Usage:
 *   node scripts/generate-pwa-icons.mjs [--check]
 *
 *   --check  render to a temp dir and report byte differences without
 *            touching public/images/.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ICON = '/public/images/icon-512.png';
const OUTPUT_DIR = join(REPO_ROOT, 'public/images');
const CHECK_MODE = process.argv.includes('--check');

const CHROME_CANDIDATES = [
  process.env.SPW_CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].filter(Boolean);

/**
 * Derived surfaces. `scale` is artwork width relative to the tile: values
 * above 1 push the artwork's own rounded corners and ring off-canvas so the
 * sampled field color reads as the full bleed. The maskable motif must stay
 * within the central 80% circle (motif ≈ 62% of the artwork → scale ≤ ~1.29).
 */
const ICON_JOBS = [
  { file: 'icon-maskable-512.png', size: 512, scale: 1.29 },
  { file: 'apple-touch-icon.png', size: 180, scale: 1.12 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error('No Chrome/Chromium binary found; set SPW_CHROME_BIN.');
}

function startStaticServer() {
  return new Promise((resolveServer) => {
    const server = createServer((req, res) => {
      const path = decodeURIComponent((req.url || '/').split('?')[0]);
      const file = path.endsWith('/')
        ? join(REPO_ROOT, path, 'index.html')
        : join(REPO_ROOT, path);
      if (!file.startsWith(REPO_ROOT) || !existsSync(file)) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const type = file.endsWith('.png') ? 'image/png'
        : file.endsWith('.html') ? 'text/html; charset=utf-8'
          : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => {
      resolveServer({ server, port: server.address().port });
    });
  });
}

async function getPageTarget(port) {
  for (let i = 0; i < 30; i += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page;
    } catch { /* retry until Chrome is up */ }
    await sleep(500);
  }
  throw new Error('No Chrome page target appeared.');
}

function connect(wsUrl) {
  return new Promise((resolveWs, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.onopen = () => resolveWs({
      send: (method, params = {}, timeoutMs = 30000) => new Promise((res, rej) => {
        id += 1;
        const timer = setTimeout(() => {
          pending.delete(id);
          rej(new Error(`timeout ${method}`));
        }, timeoutMs);
        pending.set(id, { res, rej, timer });
        ws.send(JSON.stringify({ id, method, params }));
      }),
      close: () => ws.close(),
    });
    ws.onerror = () => reject(new Error('CDP websocket error'));
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (!data.id || !pending.has(data.id)) return;
      const { res, rej, timer } = pending.get(data.id);
      clearTimeout(timer);
      pending.delete(data.id);
      if (data.error) rej(new Error(data.error.message));
      else res(data.result);
    };
  });
}

const COMPOSE_FN = String.raw`
async (size, artScale, srcUrl) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = srcUrl; });

  // Sample the artwork's field color just inside its shape (below the ring)
  // so the extended bleed matches the artwork exactly.
  const probe = document.createElement('canvas');
  probe.width = img.width; probe.height = img.height;
  const pctx = probe.getContext('2d');
  pctx.drawImage(img, 0, 0);
  const px = pctx.getImageData(Math.round(img.width * 0.5), Math.round(img.height * 0.12), 1, 1).data;
  const bg = 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')';

  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  const art = Math.round(size * artScale);
  const off = Math.round((size - art) / 2);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, off, off, art, art);
  return { data: canvas.toDataURL('image/png'), bg };
}
`;

async function main() {
  const chromeBin = findChrome();
  const { server, port: httpPort } = await startStaticServer();
  const debugPort = 9200 + Math.floor(Math.random() * 500);
  const profile = mkdtempSync(join(tmpdir(), 'spw-icons-'));

  const chrome = spawn(chromeBin, [
    '--headless=new', '--disable-gpu', `--user-data-dir=${profile}`,
    `--remote-debugging-port=${debugPort}`, '--window-size=800,800', 'about:blank',
  ], { stdio: 'ignore' });

  const outDir = CHECK_MODE ? mkdtempSync(join(tmpdir(), 'spw-icons-check-')) : OUTPUT_DIR;
  let dirty = 0;

  try {
    const target = await getPageTarget(debugPort);
    const cdp = await connect(target.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/offline/` });
    await sleep(1500);

    for (const job of ICON_JOBS) {
      const result = await cdp.send('Runtime.evaluate', {
        expression: `(${COMPOSE_FN})(${job.size}, ${job.scale}, '${SOURCE_ICON}')`,
        awaitPromise: true,
        returnByValue: true,
      });
      const { data, bg } = result.result.value;
      const bytes = Buffer.from(data.split(',')[1], 'base64');
      const finalPath = join(OUTPUT_DIR, job.file);
      const previous = existsSync(finalPath) ? readFileSync(finalPath) : null;
      const changed = !previous || !previous.equals(bytes);
      if (changed) dirty += 1;

      writeFileSync(join(outDir, job.file), bytes);
      console.log(`[icons] ${job.file} size=${job.size} scale=${job.scale} bg=${bg} ${changed ? 'changed' : 'unchanged'}`);
    }
    cdp.close();
  } finally {
    chrome.kill('SIGKILL');
    server.close();
  }

  if (CHECK_MODE) {
    console.log(dirty ? `[icons] check: ${dirty} file(s) would change` : '[icons] check: outputs current');
    process.exit(dirty ? 1 : 0);
  }
  console.log(`[icons] wrote ${ICON_JOBS.length} file(s) to public/images/`);
}

main().catch((error) => {
  console.error(`[icons] failed: ${error.message}`);
  process.exit(1);
});
