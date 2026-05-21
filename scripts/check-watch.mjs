import { spawn } from 'node:child_process';
import { promises as fs, watch as watchFs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const IGNORED_SEGMENTS = new Set([
  '.agents',
  '.git',
  '.github',
  '.idea',
  '00.unsorted',
  'dist',
  'dist-vite',
  'node_modules',
]);
const IGNORED_PREFIXES = [
  '.spw/_workbench',
  'design/catalog',
];

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

    lastChange = toPosixPath(path.relative(ROOT_DIR, nextPath) || nextPath);
    scheduleCheck();

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
  }, 120);
}

function runCheck() {
  if (running) {
    rerunRequested = true;
    return Promise.resolve();
  }

  running = true;
  console.log(`[check:watch] running checks after ${lastChange}`);

  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'check'], {
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

await watchTree(ROOT_DIR);
console.log('[check:watch] watching for changes');
void runCheck();

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
