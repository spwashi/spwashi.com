import { spawn } from 'node:child_process';
import process from 'node:process';

function parseArgs(argv) {
  const options = {
    host: undefined,
    help: false,
    open: true,
    outDir: undefined,
    path: '',
    port: undefined,
    strictPort: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--no-open') {
      options.open = false;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--open') {
      options.open = true;
      continue;
    }

    if (arg === '--path' && argv[index + 1]) {
      options.path = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--path=')) {
      options.path = arg.slice('--path='.length);
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
      options.port = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--port=')) {
      options.port = arg.slice('--port='.length);
      continue;
    }

    if (arg === '--outDir' && argv[index + 1]) {
      options.outDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--outDir=')) {
      options.outDir = arg.slice('--outDir='.length);
      continue;
    }

    if (arg === '--strictPort') {
      options.strictPort = true;
    }
  }

  return options;
}

function normalizeOpenPath(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  if (raw.startsWith('/')) return raw;
  return `/${raw}`;
}

function printUsage() {
  console.log('Usage: node scripts/preview-open.mjs [--path /route/] [--host 127.0.0.1] [--port 4174] [--outDir dist]');
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printUsage();
  process.exit(0);
}

const viteArgs = ['node_modules/vite/bin/vite.js', 'preview'];
if (options.host) viteArgs.push('--host', options.host);
if (options.port) viteArgs.push('--port', options.port);
if (options.strictPort) viteArgs.push('--strictPort');
if (options.outDir) viteArgs.push('--outDir', options.outDir);
if (options.open) viteArgs.push('--open', normalizeOpenPath(options.path));

const child = spawn('node', viteArgs, {
  stdio: 'inherit',
  env: process.env,
  shell: false,
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
