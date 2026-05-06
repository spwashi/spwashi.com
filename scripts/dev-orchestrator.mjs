import { spawn } from 'node:child_process';
import process from 'node:process';

const processes = [];

function parseArgs(argv) {
  const options = {
    host: undefined,
    open: false,
    port: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

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
      options.port = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--port=')) {
      options.port = arg.slice('--port='.length);
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));

function start(name, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });

  processes.push({ child, name });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    console.log(`[dev] ${name} exited ${signal ? `with signal ${signal}` : `with code ${code}`}`);
    shutdown(code ?? (signal ? 1 : 0));
  });
}

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const { child } of processes) {
    if (!child.killed) child.kill('SIGTERM');
  }

  setTimeout(() => process.exit(code), 250).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

start('runtime-watch', 'node', ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.runtime.json', '-w', '--preserveWatchOutput']);
start('css-watch', 'node', ['scripts/css-build.mjs', '--watch']);

const viteArgs = ['node_modules/vite/bin/vite.js'];
if (options.host) viteArgs.push('--host', options.host);
if (options.port) viteArgs.push('--port', options.port);
if (options.open) viteArgs.push('--open');

start('vite', 'node', viteArgs);
