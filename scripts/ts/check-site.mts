import process from 'node:process';

import {
  ROUTE_MANIFEST_OUTPUT,
  collectManifestIssues,
  runGitDiffCheck,
  runSyntaxChecks,
  writeRouteRuntimeManifest,
} from './site-contracts/index.mjs';

export async function main(): Promise<void> {
  const manifest = await writeRouteRuntimeManifest();
  const manifestIssues = collectManifestIssues(manifest);
  const syntaxReport = await runSyntaxChecks();
  const gitDiffResult = runGitDiffCheck();

  console.log(`[check] manifest=${ROUTE_MANIFEST_OUTPUT}`);
  console.log(`[check] routes=${manifest.routeCount} svgRoutes=${manifest.maps.svgRoutes.length} specRoutes=${manifest.maps.specRoutes.length}`);
  console.log(`[check] syntax targets=${syntaxReport.targets.length}`);

  if (manifestIssues.warnings.length) {
    console.log(`[check] warnings=${manifestIssues.warnings.length}`);
    for (const warning of manifestIssues.warnings.slice(0, 12)) {
      console.log(`  warn: ${warning}`);
    }
    if (manifestIssues.warnings.length > 12) {
      console.log(`  ... ${manifestIssues.warnings.length - 12} more warnings`);
    }
  }

  const failures: string[] = [];

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
