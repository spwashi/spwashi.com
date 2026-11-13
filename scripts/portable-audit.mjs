#!/usr/bin/env node
/**
 * Portable audit — the import-graph half of "can another site use this?"
 *
 * Thin CLI wrapper over scripts/lib/portable-audit.mjs so generate-runtime-atlas.mjs
 * and this audit share one static closure analysis.
 *
 * Usage:
 *   npm run audit:portable                 summary by verdict
 *   npm run audit:portable -- --json       every module, machine form
 *   npm run audit:portable -- --module=id  one module in full
 *   npm run audit:portable -- --out=FILE   write the manifest other sites read
 */

import './lib/register-public-imports.mjs';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyzePortableModules } from './lib/portable-audit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || null;

const { MODULE_DEFS } = await import(path.join(ROOT, 'public/js/runtime/catalog/index.js'));
const report = await analyzePortableModules({ root: ROOT, defs: MODULE_DEFS });
const byVerdict = (verdict) => report.filter((row) => row.verdict === verdict);

if (flag('module')) {
  console.log(JSON.stringify(report.find((row) => row.id === flag('module')) || null, null, 2));
} else if (args.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else if (flag('out')) {
  const manifest = {
    about: 'Modules another origin can mount with runtime/orchestration/host.js. portable: markup and css.primary suffice; host-policy: the page must also accept the listed needs. css.alsoRead lists stylesheets that react to a shared attribute the module writes. Built by scripts/portable-audit.mjs.',
    host: '/public/js/runtime/orchestration/host.js',
    modules: report.filter((row) => row.verdict !== 'site-only' && row.export !== 'none')
      .map(({ blockers, declared, ...row }) => row),
  };
  writeFileSync(path.resolve(ROOT, flag('out')), `${JSON.stringify(manifest)}\n`);
  console.log(`[portable] wrote ${flag('out')}: ${manifest.modules.length} mountable modules`);
} else {
  const blocked = report.filter((row) => row.verdict === 'site-only' && row.declared !== 'site-only');
  console.log(`[portable] ${report.length} modules: ${byVerdict('portable').length} portable, ${byVerdict('host-policy').length} host-policy, ${byVerdict('site-only').length} site-only`);
  console.log(`[portable] declared portable or host-policy but blocked by their code: ${blocked.length}`);
  const reasons = new Map();
  for (const row of blocked) for (const blocker of row.blockers) {
    const key = blocker.replace(/ at .*$/, '').replace(/^imports \S+ /, 'imports ');
    reasons.set(key, (reasons.get(key) || 0) + 1);
  }
  for (const [reason, count] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(count).padStart(3)}× ${reason}`);
  console.log('[portable] portable now:');
  for (const row of byVerdict('portable')) console.log(`  ${row.id.padEnd(30)} ${String(Math.round(row.bytes / 1024)).padStart(4)} KiB  ${row.closure} files  css ${row.css.primary.join(' ') || '—'}`);
}
