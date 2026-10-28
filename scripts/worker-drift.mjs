#!/usr/bin/env node
/**
 * Which worker hosts serve what this repository holds. Workers are deployed
 * by hand (Wrangler), outside CI, so the Drift notice asks each probed host
 * for one fingerprint and compares it with the repository's. A difference is
 * a pending deploy: a decision for the creator, never a failure.
 *
 *   node scripts/worker-drift.mjs [--receipt workers-receipt.json]
 *
 * A probe must name something that only changes when the worker does:
 *   asset-script  the module script the built index.html loads (hashed name)
 *   render        the worker's own render of a page with no date in it,
 *                 hashed, against the live page
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FETCH_TIMEOUT_MS = 15000;

export const WORKER_PROBES = Object.freeze([
  Object.freeze({
    worker: 'factshift-center',
    host: 'factshift.center',
    kind: 'asset-script',
    path: '/',
    local: 'workers/factshift-center/assets/index.html',
  }),
  Object.freeze({
    worker: 'spw-quest',
    host: 'spw.quest',
    kind: 'render',
    path: '/constructs',
    module: 'workers/spw-quest/src/index.js',
  }),
]);

/** The first module script an index.html loads, by its hashed file name. */
export function scriptFingerprint(html = '') {
  const tag = String(html).match(/<script\b[^>]*type="module"[^>]*>/i)?.[0] || '';
  const src = tag.match(/\ssrc="([^"]+)"/i)?.[1] || '';
  return src ? path.posix.basename(src) : '';
}

export function textFingerprint(text = '') {
  return createHash('sha256').update(String(text)).digest('hex').slice(0, 12);
}

/** A probe's verdict from what the host served and what the repository holds. */
export function compareProbe(probe, live, local) {
  if (!live || !local) {
    return { where: probe.host, reason: 'unreadable', detail: !live ? 'live did not answer' : 'repository has no fingerprint' };
  }
  if (live === local) return null;
  return { where: probe.host, reason: 'deploy-pending', detail: `live ${live} · repository ${local}` };
}

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: 'follow' });
  return { status: response.status, text: await response.text() };
}

async function localFingerprint(probe) {
  if (probe.kind === 'asset-script') {
    return scriptFingerprint(readFileSync(path.join(ROOT, probe.local), 'utf8'));
  }
  const worker = (await import(pathToFileURL(path.join(ROOT, probe.module)).href)).default;
  const response = await worker.fetch(new Request(`https://${probe.host}${probe.path}`), {});
  return textFingerprint(await response.text());
}

function liveFingerprint(probe, { status, text }) {
  if (probe.kind === 'asset-script') return scriptFingerprint(text);
  return status >= 400 ? `HTTP ${status}` : textFingerprint(text);
}

/** Workers this script has no probe for, so the notice can say so. */
export function unprobedWorkers(names, probes = WORKER_PROBES) {
  const probed = new Set(probes.map((probe) => probe.worker));
  return names.filter((name) => !probed.has(name)).sort();
}

export async function checkWorkers(probes = WORKER_PROBES) {
  const pending = [];
  const checked = [];
  for (const probe of probes) {
    let local = '';
    let live = '';
    try {
      local = await localFingerprint(probe);
    } catch (error) {
      local = '';
      checked.push({ host: probe.host, error: `local: ${error.message}` });
    }
    try {
      live = liveFingerprint(probe, await fetchText(`https://${probe.host}${probe.path}`));
    } catch (error) {
      live = '';
      checked.push({ host: probe.host, error: `live: ${error.message}` });
    }
    checked.push({ host: probe.host, kind: probe.kind, path: probe.path, live, local });
    const verdict = compareProbe(probe, live, local);
    if (verdict) pending.push(verdict);
  }
  const workersDir = path.join(ROOT, 'workers');
  const names = existsSync(workersDir)
    ? readdirSync(workersDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(path.join(workersDir, entry.name, 'wrangler.jsonc')))
      .map((entry) => entry.name)
    : [];
  return {
    schema: 'workers-receipt.v0',
    ok: true,
    failures: [],
    pending,
    checked,
    unprobed: unprobedWorkers(names, probes),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf('--receipt');
  const receipt = await checkWorkers();
  const body = `${JSON.stringify(receipt, null, 2)}\n`;
  if (at !== -1 && args[at + 1]) writeFileSync(args[at + 1], body);
  else process.stdout.write(body);
  const lines = receipt.pending.map((row) => `${row.where} ${row.reason} (${row.detail})`);
  process.stderr.write(`[worker-drift] ${lines.length ? lines.join('; ') : 'every probed host serves the repository'}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`[worker-drift] ${error.message}\n`);
    process.exitCode = 0;
  });
}
