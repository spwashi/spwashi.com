import process from 'node:process';
import { ROUTE_MANIFEST_OUTPUT, collectManifestIssues, runGitDiffCheck, runSyntaxChecks, writeRouteRuntimeManifest, } from './site-contracts/index.mjs';
import { collectCssContractReport } from './css-contracts.mjs';
import { collectJsonContractReport } from './json-contracts.mjs';
import { collectRuntimeContractReport } from './runtime-contracts.mjs';
export async function main() {
    const manifest = await writeRouteRuntimeManifest();
    const manifestIssues = collectManifestIssues(manifest);
    const syntaxReport = await runSyntaxChecks();
    const cssReport = await collectCssContractReport();
    const runtimeReport = await collectRuntimeContractReport();
    const jsonReport = await collectJsonContractReport();
    const gitDiffResult = runGitDiffCheck();
    console.log(`[check] manifest=${ROUTE_MANIFEST_OUTPUT}`);
    console.log(`[check] routes=${manifest.routeCount} svgRoutes=${manifest.maps.svgRoutes.length} specRoutes=${manifest.maps.specRoutes.length}`);
    console.log(`[check] syntax targets=${syntaxReport.targets.length}`);
    console.log(`[check] css files=${cssReport.cssFiles.length} imports=${cssReport.imports.length} routeStylesheets=${cssReport.linkedStylesheets.length} sources=${cssReport.sourceFiles.length}`);
    console.log(`[check] runtime modules=${runtimeReport.modules.length} ownerDirs=${runtimeReport.ownerDirectories.length} rootEntrypoints=${runtimeReport.rootEntrypoints.length} typedOutputs=${runtimeReport.typedOutputs.length}`);
    console.log(`[check] json feeds=${jsonReport.checked} jsonErrors=${jsonReport.errors.length}`);
    const warnings = [
        ...manifestIssues.warnings.map((warning) => `[manifest] ${warning}`),
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
