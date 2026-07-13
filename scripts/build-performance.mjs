#!/usr/bin/env node
/**
 * Build pipeline wall-time sampler (zero new deps).
 *
 * Usage:
 *   node scripts/build-performance.mjs
 *   node scripts/build-performance.mjs --skip-site --json
 *   node scripts/build-performance.mjs --only typecheck,build:runtime
 *   npm run bench:build
 *
 * Directional only — not CI SLOs. Aligns with
 * .spw/audits/build-runtime-performance-2026-07/build.spw
 */

import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_STEPS = Object.freeze([
  { id: 'typecheck', npm: 'typecheck', costClass: 'premature_commitment' },
  { id: 'build:tools', npm: 'build:tools', costClass: 'working_memory_pressure' },
  { id: 'build:runtime', npm: 'build:runtime', costClass: 'working_memory_pressure' },
  { id: 'build:css', npm: 'build:css', costClass: 'working_memory_pressure' },
  { id: 'build:site', npm: 'build:site', costClass: 'premature_commitment', heavy: true },
]);

function parseArgs(argv) {
  const options = {
    json: false,
    skipSite: false,
    only: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--skip-site') options.skipSite = true;
    else if (arg === '--only' && argv[i + 1]) {
      options.only = new Set(argv[++i].split(',').map((s) => s.trim()).filter(Boolean));
    } else if (arg.startsWith('--only=')) {
      options.only = new Set(arg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean));
    }
  }
  return options;
}

function printHelp() {
  console.log(`build-performance — time npm pipeline stages

Usage:
  node scripts/build-performance.mjs [options]

Options:
  --skip-site     Omit build:site (default for agent loops)
  --only a,b      Run only named steps (typecheck,build:tools,build:runtime,build:css,build:site)
  --json          Machine-readable summary on stdout
  -h, --help      This help

Examples:
  npm run bench:build
  npm run bench:build -- --skip-site
  npm run bench:build -- --only typecheck,build:runtime --json
`);
}

function runNpm(script) {
  return new Promise((resolve) => {
    const start = performance.now();
    const child = spawn('npm', ['run', script], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      process.stderr.write(chunk); // stream progress to stderr so --json stays clean on stdout
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on('close', (code) => {
      const ms = Math.round(performance.now() - start);
      resolve({
        script,
        code: code ?? 1,
        ms,
        ok: code === 0,
        stdoutBytes: Buffer.byteLength(stdout),
        stderrBytes: Buffer.byteLength(stderr),
      });
    });
  });
}

function selectSteps(options) {
  let steps = [...DEFAULT_STEPS];
  if (options.skipSite) steps = steps.filter((s) => !s.heavy);
  if (options.only) steps = steps.filter((s) => options.only.has(s.id) || options.only.has(s.npm));
  return steps;
}

function formatTable(results, totalMs) {
  const rows = results.map((r) => ({
    step: r.id,
    s: (r.ms / 1000).toFixed(2),
    ok: r.ok ? 'ok' : `exit ${r.code}`,
    cost: r.costClass,
  }));
  const w = Math.max(...rows.map((r) => r.step.length), 4);
  const lines = [
    `${'step'.padEnd(w)}  ${'sec'.padStart(8)}  status   cost_class`,
    `${'-'.repeat(w)}  ${'-'.repeat(8)}  -------  ----------`,
    ...rows.map((r) => `${r.step.padEnd(w)}  ${r.s.padStart(8)}  ${r.ok.padEnd(7)}  ${r.cost}`),
    `${'TOTAL'.padEnd(w)}  ${(totalMs / 1000).toFixed(2).padStart(8)}`,
  ];
  return lines.join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const steps = selectSteps(options);
  if (!steps.length) {
    console.error('[bench:build] no steps selected');
    process.exit(2);
  }

  process.stderr.write(`[bench:build] steps: ${steps.map((s) => s.id).join(', ')}\n`);
  const wallStart = performance.now();
  const results = [];

  for (const step of steps) {
    process.stderr.write(`\n[bench:build] → ${step.id}\n`);
    const run = await runNpm(step.npm);
    results.push({
      id: step.id,
      npm: step.npm,
      costClass: step.costClass,
      heavy: Boolean(step.heavy),
      ...run,
    });
    if (!run.ok) {
      process.stderr.write(`[bench:build] ${step.id} failed (exit ${run.code})\n`);
      break;
    }
  }

  const totalMs = Math.round(performance.now() - wallStart);
  const summary = {
    at: new Date().toISOString(),
    host: process.env.HOSTNAME || process.env.HOST || 'local',
    node: process.version,
    cwd: ROOT,
    options: {
      skipSite: options.skipSite,
      only: options.only ? [...options.only] : null,
    },
    totalMs,
    totalSec: Number((totalMs / 1000).toFixed(3)),
    ok: results.every((r) => r.ok),
    steps: results.map((r) => ({
      id: r.id,
      npm: r.npm,
      ms: r.ms,
      sec: Number((r.ms / 1000).toFixed(3)),
      ok: r.ok,
      code: r.code,
      costClass: r.costClass,
    })),
    note: 'Directional sample — not a CI SLO. Prefer --skip-site for agent loops.',
  };

  if (options.json) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write(`\n${formatTable(results, totalMs)}\n`);
    process.stdout.write(`\nok=${summary.ok} total=${summary.totalSec}s node=${summary.node}\n`);
  }

  process.exit(summary.ok ? 0 : 1);
}

main().catch((error) => {
  console.error('[bench:build] fatal', error);
  process.exit(1);
});
