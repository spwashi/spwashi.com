import http from 'node:http';
import { promises as fs, createReadStream, watch as watchFs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const RELOAD_ENDPOINT = '/__spw/live-reload';
const SUPPORTS_RECURSIVE_WATCH = process.platform === 'darwin' || process.platform === 'win32';

const IGNORED_SEGMENTS = new Set([
  '.agents',
  '.git',
  '.idea',
  '.spw',
  '00.unsorted',
  'node_modules',
]);

const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.webm', 'video/webm'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

const LIVE_RELOAD_SNIPPET = String.raw`<script data-spw-dev-reload>
(() => {
  if (window.__SPW_DEV_RELOAD__) return;
  window.__SPW_DEV_RELOAD__ = true;
  window.__SPW_LOCAL_DEV__ = true;
  document.documentElement.dataset.spwDevServer = 'true';

  const endpoint = '${RELOAD_ENDPOINT}';

  const refreshStylesheets = () => {
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      try {
        const nextUrl = new URL(link.href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;

        const replacement = link.cloneNode();
        nextUrl.searchParams.set('__spw_reload', String(Date.now()));
        replacement.href = nextUrl.toString();
        replacement.addEventListener('load', () => link.remove(), { once: true });
        replacement.addEventListener('error', () => replacement.remove(), { once: true });
        link.after(replacement);
      } catch {
        // Ignore malformed stylesheet URLs during development.
      }
    });
  };

  const connect = () => {
    const source = new EventSource(endpoint);

    source.addEventListener('css', () => {
      refreshStylesheets();
    });

    source.addEventListener('reload', () => {
      window.location.reload();
    });

    source.onerror = () => {
      source.close();
      window.setTimeout(connect, 1200);
    };
  };

  connect();
})();
</script>`;

function parseArgs(argv) {
  const options = {
    host: DEFAULT_HOST,
    open: false,
    port: DEFAULT_PORT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--open') {
      options.open = true;
      continue;
    }

    if (arg === '--host' && argv[index + 1]) {
      options.host = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--host=')) {
      options.host = arg.slice('--host='.length);
      continue;
    }

    if (arg === '--port' && argv[index + 1]) {
      options.port = Number.parseInt(argv[index + 1], 10) || DEFAULT_PORT;
      index += 1;
      continue;
    }

    if (arg.startsWith('--port=')) {
      options.port = Number.parseInt(arg.slice('--port='.length), 10) || DEFAULT_PORT;
    }
  }

  return options;
}

function printUsage() {
  console.log(`Usage: node scripts/dev-server.mjs [--host 127.0.0.1] [--port 4173] [--open]`);
}

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function toBrowserPath(targetPath) {
  const relativePath = path.relative(ROOT_DIR, targetPath);
  if (!relativePath || relativePath.startsWith('..')) return '/';
  return `/${toPosixPath(relativePath)}`;
}

function shouldIgnorePath(targetPath) {
  const relativePath = path.relative(ROOT_DIR, targetPath);
  if (!relativePath || relativePath.startsWith('..')) return false;

  const segments = relativePath.split(path.sep);
  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) return true;

  const baseName = path.basename(targetPath);
  return baseName === '.DS_Store' || baseName.endsWith('~');
}

async function statIfExists(targetPath) {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

function injectLiveReload(html) {
  if (html.includes('data-spw-dev-reload')) return html;
  if (html.includes('</body>')) return html.replace('</body>', `${LIVE_RELOAD_SNIPPET}\n</body>`);
  if (html.includes('</head>')) return html.replace('</head>', `${LIVE_RELOAD_SNIPPET}\n</head>`);
  return `${html}\n${LIVE_RELOAD_SNIPPET}`;
}

async function resolveRequest(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const normalizedPath = decodedPath === '/' ? '' : decodedPath.replace(/^\/+/, '');
  const absolutePath = path.resolve(ROOT_DIR, normalizedPath);

  if (!absolutePath.startsWith(ROOT_DIR) || shouldIgnorePath(absolutePath)) {
    return { status: 404 };
  }

  const absoluteStat = await statIfExists(absolutePath);

  if (absoluteStat?.isDirectory()) {
    if (!decodedPath.endsWith('/')) {
      return { redirect: `${decodedPath}/` };
    }

    const indexPath = path.join(absolutePath, 'index.html');
    const indexStat = await statIfExists(indexPath);
    if (indexStat?.isFile()) {
      return { filePath: indexPath };
    }
    return { status: 404 };
  }

  if (absoluteStat?.isFile()) {
    return { filePath: absolutePath };
  }

  if (!path.extname(decodedPath)) {
    const directoryIndexPath = path.join(absolutePath, 'index.html');
    const directoryIndexStat = await statIfExists(directoryIndexPath);
    if (directoryIndexStat?.isFile()) {
      return { redirect: `${decodedPath}/` };
    }

    const htmlPath = `${absolutePath}.html`;
    const htmlStat = await statIfExists(htmlPath);
    if (htmlStat?.isFile()) {
      return { filePath: htmlPath };
    }
  }

  return { status: 404 };
}

function writeEvent(response, eventName, payload) {
  response.write(`event: ${eventName}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function openBrowser(url) {
  const platformCommand = process.platform === 'darwin'
    ? ['open', [url]]
    : process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : ['xdg-open', [url]];

  try {
    const child = spawn(platformCommand[0], platformCommand[1], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
  } catch (error) {
    console.warn(`[dev] Failed to open browser automatically: ${error.message}`);
  }
}

const clients = new Set();
const watcherRegistry = new Map();

let pendingFullReload = false;
let pendingLastPath = '/';
let pendingTimer = null;

function flushPendingChanges() {
  const eventName = pendingFullReload ? 'reload' : 'css';
  const payload = {
    at: Date.now(),
    path: pendingLastPath,
  };

  for (const client of clients) {
    writeEvent(client, eventName, payload);
  }

  console.log(`[dev] ${eventName} <- ${payload.path}`);

  pendingFullReload = false;
  pendingLastPath = '/';
  pendingTimer = null;
}

function scheduleChangeBroadcast(changedPath) {
  const extension = path.extname(changedPath).toLowerCase();
  if (extension !== '.css') {
    pendingFullReload = true;
  }

  pendingLastPath = changedPath;

  if (pendingTimer) {
    clearTimeout(pendingTimer);
  }

  pendingTimer = setTimeout(flushPendingChanges, 80);
}

async function watchTree(directoryPath) {
  if (watcherRegistry.has(directoryPath) || shouldIgnorePath(directoryPath)) return;

  let entries;
  try {
    entries = await fs.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return;
  }

  const watcher = watchFs(directoryPath, (eventType, fileName) => {
    const nextPath = fileName ? path.resolve(directoryPath, String(fileName)) : directoryPath;
    if (shouldIgnorePath(nextPath)) return;

    scheduleChangeBroadcast(toBrowserPath(nextPath));

    if (eventType === 'rename') {
      void watchTree(nextPath);
    }
  });

  watcher.on('error', (error) => {
    console.warn(`[dev] Watcher error at ${toBrowserPath(directoryPath)}: ${error.message}`);
  });

  watcherRegistry.set(directoryPath, watcher);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await watchTree(path.join(directoryPath, entry.name));
  }
}

function watchRecursively(directoryPath) {
  if (watcherRegistry.has(directoryPath)) return;

  const watcher = watchFs(directoryPath, { recursive: true }, (_eventType, fileName) => {
    if (!fileName) return;
    const nextPath = path.resolve(directoryPath, String(fileName));
    if (shouldIgnorePath(nextPath)) return;
    scheduleChangeBroadcast(toBrowserPath(nextPath));
  });

  watcher.on('error', (error) => {
    console.warn(`[dev] Recursive watcher error at ${toBrowserPath(directoryPath)}: ${error.message}`);
  });

  watcherRegistry.set(directoryPath, watcher);
}

function closeWatchers() {
  for (const watcher of watcherRegistry.values()) {
    watcher.close();
  }
  watcherRegistry.clear();
}

async function startWatchers() {
  if (SUPPORTS_RECURSIVE_WATCH) {
    watchRecursively(ROOT_DIR);
    return;
  }

  await watchTree(ROOT_DIR);
}

async function sendFile(request, response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES.get(extension) || 'application/octet-stream';

  if (extension === '.html') {
    const html = await fs.readFile(filePath, 'utf8');
    const body = injectLiveReload(html);
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
    });

    if (request.method !== 'HEAD') {
      response.end(body);
      return;
    }

    response.end();
    return;
  }

  const fileStat = await fs.stat(filePath);
  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Length': fileStat.size,
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url || '/', 'http://spwashi.local');

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method Not Allowed');
    return;
  }

  if (requestUrl.pathname === RELOAD_ENDPOINT) {
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
    });

    response.write(': connected\n\n');
    clients.add(response);

    const keepAlive = setInterval(() => {
      response.write(': keep-alive\n\n');
    }, 15000);

    request.on('close', () => {
      clearInterval(keepAlive);
      clients.delete(response);
    });
    return;
  }

  const resolved = await resolveRequest(requestUrl.pathname);

  if (resolved.redirect) {
    response.writeHead(302, {
      Location: resolved.redirect,
      'Cache-Control': 'no-store',
    });
    response.end();
    return;
  }

  if (!resolved.filePath) {
    response.writeHead(resolved.status || 404, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end('Not Found');
    return;
  }

  await sendFile(request, response, resolved.filePath);
}

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printUsage();
  process.exit(0);
}

await startWatchers();

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    response.writeHead(500, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end('Internal Server Error');
    console.error('[dev] Request failed', error);
  });
});

server.listen(options.port, options.host, () => {
  const address = `http://${options.host}:${options.port}`;
  console.log(`[dev] Spwashi live reload server running at ${address}`);
  console.log('[dev] Editing HTML/CSS/JS triggers a browser refresh; CSS changes hot-swap stylesheets.');

  if (options.open) {
    openBrowser(address);
  }
});

function shutdown() {
  closeWatchers();
  for (const client of clients) {
    client.end();
  }
  clients.clear();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
