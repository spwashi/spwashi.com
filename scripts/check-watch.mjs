import { spawn } from 'node:child_process';
import { promises as fs, watch as watchFs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const IGNORED_SEGMENTS = new Set([
  '.agents',
  '.claude',
  '.git',
  '.github',
  '.idea',
  '.references',
  '.tmp',
  '00.unsorted',
  'dist',
  'dist-vite',
  'node_modules',
]);
// The gate's own writes (tsc emit, stamps under .tmp) must not re-trigger it.
// Their sources, public/ts and scripts/ts, are still watched.
const IGNORED_PREFIXES = [
  '.spw/_workbench',
  '.spw/gen',
  'design/catalog',
  'design/components/captures',
  'public/js/typed',
  'scripts/typed',
];
const FULL = process.argv.includes('--full');
const CHECK_LABEL = FULL ? 'check' : 'check:local';
// An agent or a save-all writes a burst of files; one gate run should cover it.
const DEBOUNCE_MS = Number(process.env.SPW_CHECK_WATCH_DELAY_MS) || 1000;

const watcherRegistry = new Map();
let pendingTimer = null;
let running = false;
let rerunRequested = false;
let lastChange = 'initial';

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function shouldIgnorePath(targetPath) {
  const relativePath = path.relative(ROOT_DIR, targetPath);
  if (!relativePath || relativePath.startsWith('..')) return false;

  const normalized = toPosixPath(relativePath);
  const segments = relativePath.split(path.sep);
  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) return true;
  return IGNORED_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

function onChange(nextPath) {
  if (shouldIgnorePath(nextPath)) return;
  lastChange = toPosixPath(path.relative(ROOT_DIR, nextPath) || nextPath);
  scheduleCheck();
}

/**
 * macOS and Windows watch a whole tree through one native handle (FSEvents,
 * ReadDirectoryChangesW). Elsewhere, fall back to one watcher per directory.
 */
function watchRecursive() {
  if (process.platform !== 'darwin' && process.platform !== 'win32') return false;
  try {
    const watcher = watchFs(ROOT_DIR, { recursive: true }, (_eventType, fileName) => {
      onChange(fileName ? path.resolve(ROOT_DIR, String(fileName)) : ROOT_DIR);
    });
    watcher.on('error', (error) => {
      console.warn(`[check:watch] Watcher error: ${error.message}`);
    });
    watcherRegistry.set(ROOT_DIR, watcher);
    return true;
  } catch {
    return false;
  }
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
    onChange(nextPath);

    if (eventType === 'rename') {
      void watchTree(nextPath);
    }
  });

  watcher.on('error', (error) => {
    console.warn(`[check:watch] Watcher error at ${toPosixPath(path.relative(ROOT_DIR, directoryPath) || directoryPath)}: ${error.message}`);
  });

  watcherRegistry.set(directoryPath, watcher);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await watchTree(path.join(directoryPath, entry.name));
  }
}

function scheduleCheck() {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    void runCheck();
  }, DEBOUNCE_MS);
}

function runCheck() {
  if (running) {
    rerunRequested = true;
    return Promise.resolve();
  }

  running = true;
  console.log(`[check:watch] running ${CHECK_LABEL} after ${lastChange}`);

  // check:local runs as node directly; an npm wrapper would add a boot per save.
  const [command, args] = FULL
    ? ['npm', ['run', 'check']]
    : [process.execPath, ['scripts/check-local.mjs']];

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
      shell: false,
    });

    child.on('exit', (code, signal) => {
      running = false;
      if (signal) {
        console.log(`[check:watch] check interrupted by signal ${signal}`);
      } else if (code !== 0) {
        console.log(`[check:watch] check exited with code ${code}`);
      }

      resolve();

      if (rerunRequested) {
        rerunRequested = false;
        scheduleCheck();
      }
    });
  });
}

function shutdown(code = 0) {
  if (pendingTimer) clearTimeout(pendingTimer);
  for (const watcher of watcherRegistry.values()) {
    watcher.close();
  }
  watcherRegistry.clear();
  process.exit(code);
}

const mode = watchRecursive() ? 'recursive' : (await watchTree(ROOT_DIR), `${watcherRegistry.size} directories`);
console.log(`[check:watch] watching for changes (${CHECK_LABEL}, ${mode}, ${DEBOUNCE_MS}ms debounce)`);
void runCheck();

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
