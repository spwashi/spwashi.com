import path from 'node:path';
import process from 'node:process';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assertSafeOutputDir, checkImageRedundancy, copyRepo, countFiles, createLogger, listSourceRepoPaths, logDuplicateImages, parseArgs, printHelp, rmrf, runNodeScript, writeNoJekyll, ROOT_DIR, } from './ops.mjs';
function relRepo(absPath) {
    return path.relative(ROOT_DIR, absPath).split(path.sep).join('/');
}
export async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        printHelp();
        return;
    }
    options.outDir = assertSafeOutputDir(options.outDir);
    const logger = createLogger(options);
    const startedAt = Date.now();
    const sourcePaths = listSourceRepoPaths(options);
    if (options.clean) {
        logger.info(`[build] cleaning ${relRepo(options.outDir)}/`);
        await rmrf(options.outDir);
    }
    else {
        logger.info(`[build] preserving existing ${relRepo(options.outDir)}/`);
    }
    await fs.mkdir(options.outDir, { recursive: true });
    if (options.imageCheck) {
        logger.info('[build] checking image redundancy');
        logDuplicateImages(await checkImageRedundancy(sourcePaths), logger);
    }
    else {
        logger.info('[build] skipping image redundancy check');
    }
    logger.info(`[build] copying ${sourcePaths.length} source files to ${relRepo(options.outDir)}/`);
    const copyStats = await copyRepo(sourcePaths, options, logger);
    await writeNoJekyll(options.outDir);
    if (options.sitemap) {
        logger.info('[build] generating sitemap.xml');
        runNodeScript('scripts/generate-sitemap.mjs', ['--out', path.join(options.outDir, 'sitemap.xml')]);
    }
    else {
        logger.info('[build] skipping sitemap generation');
    }
    if (options.catalog) {
        logger.info('[build] regenerating design catalog');
        runNodeScript('scripts/generate-design-catalog.mjs', ['--out', path.join(options.outDir, 'design', 'catalog')]);
    }
    else {
        logger.info('[build] skipping design catalog generation');
    }
    const fileCount = await countFiles(options.outDir);
    const ms = Date.now() - startedAt;
    logger.info(`[build] copied=${copyStats.copied} rendered=${copyStats.rendered} symlinked=${copyStats.symlinked} skipped=${copyStats.skipped}`);
    logger.info(`[build] wrote ${fileCount} files to ${relRepo(options.outDir)}/ in ${ms}ms`);
}
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    await main();
}
