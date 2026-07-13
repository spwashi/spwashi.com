import process from 'node:process';

import {
  buildRouteRuntimeManifest,
  collectManifestIssues,
  inspectRouteRuntimeManifestCache,
  runGitDiffCheck,
  runSyntaxChecks,
} from './site-contracts/index.mjs';
import { collectCssContractReport } from './css-contracts.mjs';
import { collectJsonContractReport } from './json-contracts.mjs';
import { collectRuntimeContractReport } from './runtime-contracts.mjs';

export async function main(): Promise<void> {
  // Validation should not mutate the repo-local agent cache. `npm run manifest`
  // is the explicit refresh command; checks derive the same data in memory.
  console.log('[check] phase=manifest');
  const manifest = await buildRouteRuntimeManifest();
  const manifestIssues = collectManifestIssues(manifest);
  const manifestCache = await inspectRouteRuntimeManifestCache(manifest);
  console.log('[check] phase=syntax');
  const syntaxReport = await runSyntaxChecks();
  console.log('[check] phase=css');
  const cssReport = await collectCssContractReport();
  console.log('[check] phase=runtime');
  const runtimeReport = await collectRuntimeContractReport();
  console.log('[check] phase=json');
  const jsonReport = await collectJsonContractReport();
  const gitDiffResult = runGitDiffCheck();

  console.log(`[check] manifest=in-memory cache=${manifestCache.status}`);
  console.log(`[check] routes=${manifest.routeCount} svgRoutes=${manifest.maps.svgRoutes.length} specRoutes=${manifest.maps.specRoutes.length}`);
  console.log(`[check] syntax targets=${syntaxReport.targets.length} concurrency=${syntaxReport.concurrency}`);
  console.log(`[check] css files=${cssReport.cssFiles.length} imports=${cssReport.imports.length} routeStylesheets=${cssReport.linkedStylesheets.length} sources=${cssReport.sourceFiles.length}`);
  console.log(`[check] runtime modules=${runtimeReport.modules.length} ownerDirs=${runtimeReport.ownerDirectories.length} rootEntrypoints=${runtimeReport.rootEntrypoints.length} typedOutputs=${runtimeReport.typedOutputs.length} kernelShims=${runtimeReport.kernelTypedShims.length}`);
  console.log(`[check] json feeds=${jsonReport.checked} jsonErrors=${jsonReport.errors.length}`);

  const warnings = [
    ...manifestIssues.warnings.map((warning) => `[manifest] ${warning}`),
    ...(manifestCache.status === 'missing'
      ? ['[manifest-cache] cache absent; run npm run manifest before relying on agent route/runtime summaries']
      : []),
    ...cssReport.warnings.map((warning) => `[css] ${warning}`),
    ...runtimeReport.warnings.map((warning) => `[runtime] ${warning}`),
  ];

  if (warnings.length) {
    console.log(`[check] warnings=${warnings.length}`);
    for (const warning of warnings.slice(0, 12)) {
      console.log(`  warn: ${warning}`);
    }
    if (warnings.length > 12) {
      console.log(`  ... ${warnings.length - 12} more warnings`);
    }
  }

  const failures: string[] = [];

  if (manifestCache.status === 'stale' || manifestCache.status === 'invalid') {
    failures.push(`[manifest-cache] ${manifestCache.status}; run npm run manifest`);
    for (const detail of manifestCache.details.slice(0, 12)) {
      console.log(`  manifest-cache: ${detail}`);
    }
  }

  if (manifestIssues.errors.length) {
    failures.push(`[manifest] ${manifestIssues.errors.length} error(s)`);
    for (const error of manifestIssues.errors.slice(0, 12)) {
      console.log(`  error: ${error}`);
    }
    if (manifestIssues.errors.length > 12) {
      console.log(`  ... ${manifestIssues.errors.length - 12} more errors`);
    }
  }

  if (syntaxReport.failures.length) {
    failures.push(`[syntax] ${syntaxReport.failures.length} file(s) failed node --check`);
    for (const failure of syntaxReport.failures.slice(0, 12)) {
      console.log(`  syntax: ${failure.file}`);
      if (failure.output) console.log(`    ${failure.output}`);
    }
    if (syntaxReport.failures.length > 12) {
      console.log(`  ... ${syntaxReport.failures.length - 12} more syntax failures`);
    }
  }

  if (cssReport.errors.length) {
    failures.push(`[css] ${cssReport.errors.length} contract error(s)`);
    for (const error of cssReport.errors.slice(0, 12)) {
      console.log(`  css: ${error}`);
    }
    if (cssReport.errors.length > 12) {
      console.log(`  ... ${cssReport.errors.length - 12} more css errors`);
    }
  }

  if (runtimeReport.errors.length) {
    failures.push(`[runtime] ${runtimeReport.errors.length} contract error(s)`);
    for (const error of runtimeReport.errors.slice(0, 12)) {
      console.log(`  runtime: ${error}`);
    }
    if (runtimeReport.errors.length > 12) {
      console.log(`  ... ${runtimeReport.errors.length - 12} more runtime errors`);
    }
  }

  if (jsonReport.errors.length) {
    failures.push(`[json] ${jsonReport.errors.length} contract error(s)`);
    for (const error of jsonReport.errors.slice(0, 12)) {
      console.log(`  json: ${error}`);
    }
    if (jsonReport.errors.length > 12) {
      console.log(`  ... ${jsonReport.errors.length - 12} more json errors`);
    }
  }

  if (gitDiffResult.status !== 0) {
    failures.push('[git] git diff --check failed');
    const output = `${gitDiffResult.stdout || ''}${gitDiffResult.stderr || ''}`.trim();
    if (output) {
      console.log(output);
    }
  }

  if (failures.length) {
    console.log('[check] failed');
    for (const failure of failures) {
      console.log(`  ${failure}`);
    }
    process.exit(1);
  }

  console.log('[check] passed');
}

await main();
