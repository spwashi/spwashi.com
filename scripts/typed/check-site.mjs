import { promises as fs } from 'node:fs';
import process from 'node:process';
import { buildRouteRuntimeManifest, collectManifestIssues, inspectRouteRuntimeManifestCache, runGitDiffCheck, runSyntaxChecks, } from './site-contracts/index.mjs';
import { inspectManifestStamp, ROUTE_MANIFEST_CACHE } from './manifest-stamp.mjs';
import { collectCssContractReport } from './css-contracts.mjs';
import { collectJsonContractReport } from './json-contracts.mjs';
import { collectRuntimeContractReport } from './runtime-contracts.mjs';
export async function main() {
    // Validation should not mutate the repo-local agent cache. `npm run manifest`
    // is the explicit refresh command. A matching search-index stamp younger
    // than an hour reuses that shared cache; the committed stamp is the failure.
    console.log('[check] phase=manifest');
    const stamp = await inspectManifestStamp();
    let manifest;
    let manifestCache;
    if (stamp.withinWindow) {
        try {
            manifest = JSON.parse(await fs.readFile(ROUTE_MANIFEST_CACHE, 'utf8'));
            manifestCache = { cachePath: ROUTE_MANIFEST_CACHE, details: [], status: 'reused' };
            console.log(`[check] manifest=cache cache=reused age=${Math.round((stamp.ageMs || 0) / 60000)}m`);
        }
        catch {
            manifest = await buildRouteRuntimeManifest();
            manifestCache = await inspectRouteRuntimeManifestCache(manifest);
        }
    }
    else {
        manifest = await buildRouteRuntimeManifest();
        manifestCache = await inspectRouteRuntimeManifestCache(manifest);
    }
    const manifestIssues = collectManifestIssues(manifest);
    console.log('[check] phase=syntax');
    const syntaxReport = await runSyntaxChecks();
    console.log('[check] phase=css');
    const cssReport = await collectCssContractReport();
    console.log('[check] phase=runtime');
    const runtimeReport = await collectRuntimeContractReport();
    console.log('[check] phase=json');
    const jsonReport = await collectJsonContractReport();
    const gitDiffResult = runGitDiffCheck();
    console.log(`[check] manifest=${manifestCache.status === 'reused' ? 'cache' : 'in-memory'} cache=${manifestCache.status} index=${stamp.indexStatus}`);
    console.log(`[check] routes=${manifest.routeCount} svgRoutes=${manifest.maps.svgRoutes.length} specRoutes=${manifest.maps.specRoutes.length}`);
    console.log(`[check] syntax targets=${syntaxReport.targets.length} mode=${syntaxReport.mode} concurrency=${syntaxReport.concurrency}`);
    console.log(`[check] css files=${cssReport.cssFiles.length} imports=${cssReport.imports.length} routeStylesheets=${cssReport.linkedStylesheets.length} sources=${cssReport.sourceFiles.length}`);
    console.log(`[check] runtime modules=${runtimeReport.modules.length} ownerDirs=${runtimeReport.ownerDirectories.length} rootEntrypoints=${runtimeReport.rootEntrypoints.length} typedOutputs=${runtimeReport.typedOutputs.length} kernelShims=${runtimeReport.kernelTypedShims.length}`);
    console.log(`[check] json feeds=${jsonReport.checked} jsonErrors=${jsonReport.errors.length}`);
    const warnings = [
        ...manifestIssues.warnings.map((warning) => `[manifest] ${warning}`),
        ...(manifestCache.status === 'missing'
            ? ['[manifest-cache] shared cache absent; this check parsed the routes. npm run manifest refills the one-hour window']
            : []),
        ...(manifestCache.status === 'stale' && stamp.indexStatus === 'fresh'
            ? ['[manifest-cache] shared cache drifted from the routes; the committed search index stamp still matches. npm run manifest refreshes the cache']
            : []),
        ...(manifestCache.status === 'invalid' && stamp.indexStatus === 'fresh'
            ? ['[manifest-cache] shared cache is unreadable; the committed search index stamp still matches']
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
    const failures = [];
    if (stamp.indexStatus !== 'fresh') {
        failures.push(`[manifest-stamp] search index is ${stamp.indexStatus}; run npm run manifest and commit public/data/site-search-index.json and public/js/generated/spw-expressions.js if they moved`);
        console.log(`  manifest-stamp: committed=${stamp.committedStamp ? stamp.committedStamp.slice(0, 12) : 'none'} live=${stamp.liveStamp.slice(0, 12)}`);
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
            if (failure.output)
                console.log(`    ${failure.output}`);
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
