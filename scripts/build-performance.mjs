#!/usr/bin/env node
/**
 * Build pipeline wall-time sampler (zero new deps).
 *
 * Usage:
 *   node scripts/build-performance.mjs
 *   node scripts/build-performance.mjs --skip-site --json
 *   node scripts/build-performance.mjs --only typecheck:root,build:runtime
 *   node scripts/build-performance.mjs --parallel-check --out /tmp/bench-build.json
 *   npm run bench:build
 *
 * Directional only — not CI SLOs. Aligns with
 * .spw/audits/build-runtime-performance-2026-07/build.spw
 */

import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  clearTemplatePartialCache,
  getTemplateStats,
  renderTemplate,
  resetTemplateStats,
} from './template.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_STEPS = Object.freeze([
  { id: 'typecheck:root', npm: 'typecheck:root', costClass: 'premature_commitment', wave: 0 },
  { id: 'build:tools', npm: 'build:tools', costClass: 'working_memory_pressure', wave: 0 },
  { id: 'build:runtime', npm: 'build:runtime', costClass: 'working_memory_pressure', wave: 1 },
  { id: 'build:css:run', npm: 'build:css:run', costClass: 'working_memory_pressure', wave: 2 },
  { id: 'build:site:run', npm: 'build:site:run', costClass: 'premature_commitment', heavy: true, wave: 3 },
  { id: 'template:micro', local: 'template-micro', costClass: 'working_memory_pressure', wave: 4, optional: true },
]);

function parseArgs(argv) {
  const options = {
    json: false,
    skipSite: false,
    only: null,
    help: false,
    out: null,
    parallelCheck: false,
    includeTemplateMicro: false,
    continueOnError: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--skip-site') options.skipSite = true;
    else if (arg === '--parallel-check') options.parallelCheck = true;
    else if (arg === '--template-micro') options.includeTemplateMicro = true;
    else if (arg === '--continue-on-error') options.continueOnError = true;
    else if (arg === '--out' && argv[i + 1]) options.out = argv[++i];
    else if (arg.startsWith('--out=')) options.out = arg.slice('--out='.length);
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
  --skip-site         Omit build:site:run (default for agent loops via bench:build)
  --only a,b          Run only named steps
  --parallel-check    Run typecheck:root + build:tools concurrently (wave 0)
  --template-micro    Include partial-cache warm/cold template microbench
  --continue-on-error Keep sampling after a failed step
  --out PATH          Write JSON summary to PATH
  --json              Machine-readable summary on stdout
  -h, --help

Examples:
  npm run bench:build
  npm run bench:build -- --parallel-check --template-micro --json
  npm run bench:build -- --only typecheck:root,build:runtime --json
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
      process.stderr.write(chunk);
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

async function runTemplateMicro() {
  const started = performance.now();
  resetTemplateStats();
  clearTemplatePartialCache();

  const sample = `<!doctype html>
<html lang="en"><head>
<spw-page title="Bench" description="template micro" canonical="/bench/"></spw-page>
<spw-site-head></spw-site-head>
</head><body>
<spw-site-header current="Home"></spw-site-header>
<main><h1>Bench</h1></main>
<spw-site-footer></spw-site-footer>
</body></html>`;

  // Cold: empty cache
  const cold = await renderTemplate(sample, { sourceLabel: 'bench:cold' });
  const afterCold = getTemplateStats();
  // Warm: same partials should hit cache
  const warm = await renderTemplate(sample, { sourceLabel: 'bench:warm' });
  const afterWarm = getTemplateStats();
  const ms = Math.round(performance.now() - started);

  return {
    script: 'template-micro',
    code: 0,
    ms,
    ok: true,
    stdoutBytes: 0,
    stderrBytes: 0,
    detail: {
      coldMs: cold.ms,
      warmMs: warm.ms,
      partialHits: afterWarm.partialHits,
      partialMisses: afterWarm.partialMisses,
      includes: afterWarm.includes,
      stats: afterWarm,
      coldStats: afterCold,
    },
  };
}

function selectSteps(options) {
  let steps = [...DEFAULT_STEPS];
  if (options.skipSite) steps = steps.filter((s) => !s.heavy);
  if (!options.includeTemplateMicro) steps = steps.filter((s) => s.id !== 'template:micro');
  if (options.only) {
    steps = steps.filter((s) => options.only.has(s.id) || options.only.has(s.npm) || options.only.has(s.local));
  }
  return steps;
}

function formatTable(results, totalMs) {
  const rows = results.map((r) => ({
    step: r.id,
    s: (r.ms / 1000).toFixed(2),
    pct: totalMs > 0 ? `${Math.round((r.ms / totalMs) * 100)}%` : '-',
    ok: r.ok ? 'ok' : `exit ${r.code}`,
    cost: r.costClass,
  }));
  const w = Math.max(...rows.map((r) => r.step.length), 4);
  const lines = [
    `${'step'.padEnd(w)}  ${'sec'.padStart(8)}  ${'share'.padStart(6)}  status   cost_class`,
    `${'-'.repeat(w)}  ${'-'.repeat(8)}  ${'-'.repeat(6)}  -------  ----------`,
    ...rows.map((r) => `${r.step.padEnd(w)}  ${r.s.padStart(8)}  ${r.pct.padStart(6)}  ${r.ok.padEnd(7)}  ${r.cost}`),
    `${'TOTAL'.padEnd(w)}  ${(totalMs / 1000).toFixed(2).padStart(8)}`,
  ];
  return lines.join('\n');
}

async function runStep(step) {
  if (step.local === 'template-micro') {
    return runTemplateMicro();
  }
  return runNpm(step.npm);
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

  process.stderr.write(
    `[bench:build] steps: ${steps.map((s) => s.id).join(', ')}`
    + `${options.parallelCheck ? ' (parallel wave 0)' : ''}\n`,
  );
  const wallStart = performance.now();
  const results = [];

  const waves = new Map();
  for (const step of steps) {
    if (!waves.has(step.wave)) waves.set(step.wave, []);
    waves.get(step.wave).push(step);
  }

  if (options.parallelCheck) {
    const orderedWaves = [...waves.keys()].sort((a, b) => a - b);
    for (const wave of orderedWaves) {
      const batch = waves.get(wave).filter((s) => steps.some((x) => x.id === s.id));
      if (!batch.length) continue;
      process.stderr.write(`\n[bench:build] wave ${wave}: ${batch.map((s) => s.id).join(', ')}\n`);
      const runs = await Promise.all(batch.map(async (step) => {
        process.stderr.write(`[bench:build] → ${step.id}\n`);
        const run = await runStep(step);
        return {
          id: step.id,
          npm: step.npm || step.local,
          costClass: step.costClass,
          heavy: Boolean(step.heavy),
          wave: step.wave,
          ...run,
        };
      }));
      results.push(...runs);
      if (!options.continueOnError && runs.some((r) => !r.ok)) {
        process.stderr.write(`[bench:build] wave ${wave} had failures\n`);
        break;
      }
    }
  } else {
    for (const step of steps) {
      process.stderr.write(`\n[bench:build] → ${step.id}\n`);
      const run = await runStep(step);
      results.push({
        id: step.id,
        npm: step.npm || step.local,
        costClass: step.costClass,
        heavy: Boolean(step.heavy),
        wave: step.wave,
        ...run,
      });
      if (!run.ok) {
        process.stderr.write(`[bench:build] ${step.id} failed (exit ${run.code})\n`);
        if (!options.continueOnError) break;
      }
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
      parallelCheck: options.parallelCheck,
      includeTemplateMicro: options.includeTemplateMicro,
      only: options.only ? [...options.only] : null,
    },
    graph: options.parallelCheck
      ? 'wave-parallel: typecheck+tools → runtime → css → site → optional template micro'
      : 'non-overlapping build primitives used by npm run build',
    totalMs,
    totalSec: Number((totalMs / 1000).toFixed(3)),
    ok: results.every((r) => r.ok),
    slowest: results.length
      ? results.reduce((a, b) => (a.ms >= b.ms ? a : b)).id
      : null,
    steps: results.map((r) => ({
      id: r.id,
      npm: r.npm,
      ms: r.ms,
      sec: Number((r.ms / 1000).toFixed(3)),
      share: totalMs > 0 ? Number((r.ms / totalMs).toFixed(3)) : 0,
      ok: r.ok,
      code: r.code,
      costClass: r.costClass,
      wave: r.wave,
      detail: r.detail || undefined,
    })),
    note: 'Directional sample — not a CI SLO. Prefer --skip-site for agent loops; --parallel-check only times concurrent typecheck+tools.',
  };

  if (options.out) {
    await writeFile(options.out, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    process.stderr.write(`[bench:build] wrote ${options.out}\n`);
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write(`\n${formatTable(results, totalMs)}\n`);
    process.stdout.write(
      `\nok=${summary.ok} total=${summary.totalSec}s slowest=${summary.slowest || '-'} node=${summary.node}\n`,
    );
  }

  process.exit(summary.ok ? 0 : 1);
}

main().catch((error) => {
  console.error('[bench:build] fatal', error);
  process.exit(1);
});
