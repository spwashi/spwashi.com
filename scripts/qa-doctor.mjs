#!/usr/bin/env node
/**
 * QA preflight. Answers "is the ground sound?" before a headless run, so a
 * failed probe is not blamed on the page. Every check runs concurrently and
 * the whole pass stays under ~1s; each line names the next command.
 *
 *   npm run sense -- doctor
 *   npm run sense -- doctor --reap    # SIGTERM orphaned probe Chromes / dev-servers
 *   npm run sense -- doctor --json
 *
 * Checks:
 *   loopback  can this shell reach 127.0.0.1? (the Bash sandbox hangs it)
 *   chrome    is a Chrome binary resolvable for the harness?
 *   orphans   probe Chromes / dev-servers whose parent died (ppid 1)
 *   bundles   are tracked CSS bundles fresh against their sources?
 *   siblings  uncommitted CSS in the tree (another session's, maybe)
 *
 * Orphan reaping only touches ppid-1 processes with a probe signature; a
 * sibling session's live probe still has its parent and is left alone.
 */

import { execFile, spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { ROOT, resolveChrome } from './lib/chrome-headless-harness.mjs';

const run = promisify(execFile);

const PROBE_CHROME = /--remote-debugging-port=\d+/;
const PROBE_PROFILE = /--user-data-dir=\S*\/spw-[\w-]+/;
const PROBE_SERVER = /scripts\/dev-server\.mjs --host 127\.0\.0\.1 --port \d+/;

/**
 * Parse `ps -axo pid=,ppid=,etime=,command=` into probe rows.
 * @param {string} text
 * @returns {{ pid: number, ppid: number, etime: string, kind: 'chrome'|'dev-server', orphan: boolean }[]}
 */
export function parseProbeProcesses(text) {
  const rows = [];
  for (const line of String(text).split('\n')) {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/);
    if (!match) continue;
    const [, pid, ppid, etime, command] = match;
    let kind = null;
    if (PROBE_SERVER.test(command)) kind = 'dev-server';
    else if (PROBE_CHROME.test(command) && PROBE_PROFILE.test(command) && !/--type=/.test(command)) kind = 'chrome';
    if (!kind) continue;
    rows.push({ pid: Number(pid), ppid: Number(ppid), etime, kind, orphan: Number(ppid) === 1 });
  }
  return rows;
}

/** @param {string} porcelain `git status --porcelain` output */
export function dirtyCssPaths(porcelain) {
  return String(porcelain)
    .split('\n')
    .map((line) => line.slice(3).trim())
    .filter((file) => file.endsWith('.css'));
}

export async function checkLoopback(timeoutMs = 1500) {
  const server = http.createServer((_, res) => res.end('ok'));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  }).catch((error) => ({ error }));
  const address = server.address();
  if (!address) {
    return { ok: false, detail: 'cannot bind 127.0.0.1', next: 'run outside the sandbox, or fall back to npm run check:local and say so' };
  }
  try {
    const res = await fetch(`http://127.0.0.1:${address.port}/`, { signal: AbortSignal.timeout(timeoutMs) });
    return { ok: res.ok, detail: `bind + fetch :${address.port}` };
  } catch {
    return {
      ok: false,
      detail: `fetch 127.0.0.1 hung ${timeoutMs}ms — sandboxed shell`,
      next: 'headless probes will time out on Page.enable here; fall back to npm run check:local and say so',
    };
  } finally {
    server.close();
  }
}

async function checkChrome() {
  try {
    const found = await resolveChrome(process.env.CHROME_PATH || '');
    return found
      ? { ok: true, detail: path.basename(found) }
      : { ok: false, detail: 'no Chrome found', next: 'set CHROME_PATH or pass --chrome' };
  } catch (error) {
    return { ok: false, detail: error.message.split('\n')[0], next: 'set CHROME_PATH or pass --chrome' };
  }
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

/**
 * SIGTERM, then SIGKILL after `graceMs`. dev-server's shutdown waits on
 * server.close(), which an idle keep-alive socket can hold open indefinitely.
 */
async function reapPid(pid, graceMs = 1500) {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return 'gone';
  }
  const deadline = Date.now() + graceMs;
  while (Date.now() < deadline) {
    if (!alive(pid)) return 'SIGTERM';
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // exited at the edge
  }
  return 'SIGKILL';
}

async function checkOrphans({ reap }) {
  const { stdout } = await run('ps', ['-axo', 'pid=,ppid=,etime=,command=']);
  const probes = parseProbeProcesses(stdout);
  const orphans = probes.filter((row) => row.orphan);
  const live = probes.length - orphans.length;
  const liveNote = live ? `; ${live} live probe(s) owned by a running session` : '';
  if (!orphans.length) return { ok: true, detail: `none${liveNote}` };
  const list = orphans.map((row) => `${row.kind}:${row.pid} (${row.etime})`).join(', ');
  if (reap) {
    const killed = await Promise.all(orphans.map((row) => reapPid(row.pid)));
    const forced = killed.filter((outcome) => outcome === 'SIGKILL').length;
    const forcedNote = forced ? ` (${forced} ignored SIGTERM, sent SIGKILL)` : '';
    return { ok: true, detail: `reaped ${orphans.length}: ${list}${forcedNote}${liveNote}` };
  }
  return {
    ok: false,
    detail: `${orphans.length} orphaned: ${list}${liveNote}`,
    next: 'npm run sense -- doctor --reap',
  };
}

function checkBundles() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['scripts/css-build.mjs', '--check'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    child.stderr.on('data', (chunk) => {
      err += chunk;
    });
    child.on('close', (code) => {
      if (code === 0) return resolve({ ok: true, detail: 'fresh' });
      const stale = err.match(/stale output: (\S+)/)?.[1];
      resolve({
        ok: false,
        detail: stale ? `stale ${path.relative(ROOT, stale)}` : `css-build --check exited ${code}`,
        next: 'npm run build:css — unless siblings (below) hold dirty CSS; then leave the bundle to them',
      });
    });
  });
}

async function checkSiblings() {
  const { stdout } = await run('git', ['status', '--porcelain', '--', 'public/css'], { cwd: ROOT });
  const dirty = dirtyCssPaths(stdout);
  if (!dirty.length) return { ok: true, detail: 'no uncommitted CSS' };
  const shown = dirty.slice(0, 3).join(', ') + (dirty.length > 3 ? ` +${dirty.length - 3}` : '');
  return {
    ok: true,
    warn: true,
    detail: `${dirty.length} uncommitted CSS: ${shown}`,
    next: 'if not yours, do not regenerate bundles; git log before calling a regression yours',
  };
}

const settle = (promise) => promise.catch((error) => ({ ok: false, detail: String(error?.message || error).split('\n')[0] }));

export async function runDoctor({ reap = false } = {}) {
  const started = Date.now();
  const names = ['loopback', 'chrome', 'orphans', 'bundles', 'siblings'];
  const results = await Promise.all([
    settle(checkLoopback()),
    settle(checkChrome()),
    settle(checkOrphans({ reap })),
    settle(checkBundles()),
    settle(checkSiblings()),
  ]);
  const checks = names.map((name, index) => ({ name, ...results[index] }));
  return { ok: checks.every((check) => check.ok), ms: Date.now() - started, checks };
}

export function formatDoctor(report) {
  const width = Math.max(...report.checks.map((check) => check.name.length));
  const lines = report.checks.map((check) => {
    const mark = !check.ok ? 'FAIL' : check.warn ? 'warn' : 'ok  ';
    const head = `[doctor] ${mark} ${check.name.padEnd(width)}  ${check.detail}`;
    return check.next && (!check.ok || check.warn) ? `${head}\n${' '.repeat(width + 16)}→ ${check.next}` : head;
  });
  lines.push(`[doctor] ${report.ok ? 'ground sound' : 'ground unsound — fix above before blaming the page'} (${report.ms}ms)`);
  return lines.join('\n');
}

async function main(argv = process.argv.slice(2)) {
  const report = await runDoctor({ reap: argv.includes('--reap') });
  process.stdout.write(argv.includes('--json') ? `${JSON.stringify(report, null, 2)}\n` : `${formatDoctor(report)}\n`);
  process.exit(report.ok ? 0 : 1);
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) main();
