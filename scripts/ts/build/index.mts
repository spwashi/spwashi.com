import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build as rolldownBuild } from 'rolldown';

import {
  assertPwaContract,
  collectOfflineDocumentDependencies,
  formatPwaContractSummary,
  injectBuildPrecacheAssets,
} from '../pwa-contracts.mjs';
import {
  assertSafeOutputDir,
  checkImageRedundancy,
  copyRepo,
  countFiles,
  createLogger,
  DEFAULT_OUT_DIR,
  listSourceRepoPaths,
  logDuplicateImages,
  parseArgs,
  printHelp,
  rmrf,
  runNodeScript,
  writeNoJekyll,
  ROOT_DIR,
} from './ops.mjs';
import type { BuildLogger } from './types.mjs';

function relRepo(absPath: string): string {
  return path.relative(ROOT_DIR, absPath).split(path.sep).join('/');
}

async function walkFiles(directoryPath: string, results: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(entryPath, results);
      continue;
    }

    if (entry.isFile()) {
      results.push(entryPath);
    }
  }

  return results;
}

function fingerprint(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 10);
}

type AssetRewrite = {
  source: string;
  original: string;
  targetDir: string;
  targetBase: string;
  extension: string;
  chunk: string;
};

type AssetManifest = {
  fingerprinted: boolean;
  assets: Record<string, string>;
  chunks: Record<string, string[]>;
};

async function prepareServiceWorkerPrecache(outDir: string): Promise<string[]> {
  const offlinePath = path.join(outDir, 'offline', 'index.html');
  const workerPath = path.join(outDir, 'sw.js');
  const offlineHtml = await fs.readFile(offlinePath, 'utf8');
  const workerSource = await fs.readFile(workerPath, 'utf8');
  const dependencies = collectOfflineDocumentDependencies(offlineHtml);
  const output = injectBuildPrecacheAssets(workerSource, dependencies);
  await fs.writeFile(workerPath, output, 'utf8');
  return dependencies;
}

/**
 * Per-file minify of dist/public/js. Keeps each module path and import()
 * specifier intact so modulepreload/prefetch (extractDynamicImportSpecifier)
 * and content-hash of site.js continue to work. Full eager-graph bundling is
 * deferred until root-relative resolve + missing-export issues are closed.
 */
async function minifyPublicJsModules(
  outDir: string,
  logger: BuildLogger,
): Promise<{ files: number; beforeBytes: number; afterBytes: number; ms: number }> {
  const jsRoot = path.join(outDir, 'public/js');
  const allFiles = await walkFiles(jsRoot);
  const jsFiles = allFiles.filter((file) => file.endsWith('.js'));
  const startedAt = Date.now();
  let beforeBytes = 0;
  let afterBytes = 0;
  const concurrency = 8;
  let cursor = 0;

  async function minifyOne(filePath: string): Promise<void> {
    const source = await fs.readFile(filePath);
    beforeBytes += source.length;
    const tmpDir = await fs.mkdtemp(path.join(outDir, '.minify-'));
    try {
      await rolldownBuild({
        input: filePath,
        output: {
          dir: tmpDir,
          format: 'es',
          minify: true,
          entryFileNames: 'out.js',
          sourcemap: false,
        },
        // Externalize every non-entry import so relative and /public/ paths stay.
        external: (id: string) => id !== filePath && !id.startsWith('\0'),
      });
      const minified = await fs.readFile(path.join(tmpDir, 'out.js'));
      afterBytes += minified.length;
      await fs.writeFile(filePath, minified);
    } finally {
      await rmrf(tmpDir);
    }
  }

  async function worker(): Promise<void> {
    while (cursor < jsFiles.length) {
      const index = cursor;
      cursor += 1;
      const filePath = jsFiles[index];
      if (!filePath) return;
      await minifyOne(filePath);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, jsFiles.length) }, () => worker()));

  const ms = Date.now() - startedAt;
  logger.info(
    `[build] minified ${jsFiles.length} js modules: ${beforeBytes} → ${afterBytes} bytes `
    + `(${beforeBytes ? ((afterBytes / beforeBytes) * 100).toFixed(1) : '0'}%) in ${ms}ms`,
  );
  return { files: jsFiles.length, beforeBytes, afterBytes, ms };
}

async function hashAndRewritePublicAssets(outDir: string, options: { fingerprintAssets: boolean }): Promise<AssetManifest> {
  const assetMap: Record<string, string> = {};
  const chunkMap = new Map<string, string[]>();
  const rewrites: AssetRewrite[] = [
    {
      source: path.join(outDir, 'public/css/style.css'),
      original: '/public/css/style.css',
      targetDir: path.join(outDir, 'public/css'),
      targetBase: 'style',
      extension: '.css',
      chunk: 'shell-css',
    },
    {
      source: path.join(outDir, 'public/js/site.js'),
      original: '/public/js/site.js',
      targetDir: path.join(outDir, 'public/js'),
      targetBase: 'site',
      extension: '.js',
      chunk: 'site-runtime',
    },
  ];

  for (const rewrite of rewrites) {
    const chunkEntries = chunkMap.get(rewrite.chunk) || [];
    chunkEntries.push(rewrite.original);
    chunkMap.set(rewrite.chunk, chunkEntries);

    try {
      const content = await fs.readFile(rewrite.source);
      if (!options.fingerprintAssets) {
        assetMap[rewrite.original] = rewrite.original;
        continue;
      }

      const hash = fingerprint(content);
      const hashedName = `${rewrite.targetBase}.${hash}${rewrite.extension}`;
      const target = path.join(rewrite.targetDir, hashedName);

      await fs.rename(rewrite.source, target);
      assetMap[rewrite.original] = `/public/${path.relative(path.join(outDir, 'public'), target).split(path.sep).join('/')}`;
    } catch (error: any) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }
  }

  const workerPath = path.join(outDir, 'sw.js');
  const rewriteTargets = (await walkFiles(outDir)).filter(
    (file) => file.endsWith('.html') || path.resolve(file) === path.resolve(workerPath),
  );
  for (const file of rewriteTargets) {
    const source = await fs.readFile(file, 'utf8');
    let output = source;
    for (const [original, hashed] of Object.entries(assetMap)) {
      output = output.replaceAll(original, hashed);
    }
    if (output !== source) {
      await fs.writeFile(file, output, 'utf8');
    }
  }

  const manifest: AssetManifest = {
    fingerprinted: options.fingerprintAssets,
    assets: assetMap,
    chunks: Object.fromEntries([...chunkMap.entries()].map(([chunk, assets]) => [chunk, assets.sort()])),
  };

  await fs.writeFile(path.join(outDir, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  options.outDir = assertSafeOutputDir(options.outDir);

  const logger = createLogger(options);
  const startedAt = Date.now();
  const sourcePaths = listSourceRepoPaths(options);

  if (options.local) {
    logger.info('[build] local mode: skipping image checks, sitemap, catalog, and fingerprinting');
  }

  if (options.clean) {
    logger.info(`[build] cleaning ${relRepo(options.outDir)}/`);
    await rmrf(options.outDir);
  } else {
    logger.info(`[build] preserving existing ${relRepo(options.outDir)}/`);
  }

  await fs.mkdir(options.outDir, { recursive: true });

  if (options.imageCheck) {
    logger.info('[build] checking image redundancy');
    logDuplicateImages(await checkImageRedundancy(sourcePaths), logger);
  } else {
    logger.info('[build] skipping image redundancy check');
  }

  logger.info(`[build] copying ${sourcePaths.length} source files to ${relRepo(options.outDir)}/`);
  const copyStats = await copyRepo(sourcePaths, options, logger);

  await writeNoJekyll(options.outDir);

  if (options.sitemap) {
    logger.info('[build] generating sitemap.xml');
    runNodeScript('scripts/generate-sitemap.mjs', ['--out', path.join(options.outDir, 'sitemap.xml')]);
  } else {
    logger.info('[build] skipping sitemap generation');
  }

  if (options.catalog) {
    logger.info('[build] regenerating design catalog');
    runNodeScript('scripts/generate-design-catalog.mjs', ['--out', path.join(options.outDir, 'design', 'catalog')]);
  } else {
    logger.info('[build] skipping design catalog generation');
  }

  if (options.minifyJs) {
    logger.info('[build] minifying public/js modules (per-file, path-preserving)');
    await minifyPublicJsModules(options.outDir, logger);
  } else {
    logger.info('[build] skipping public/js minify');
  }

  logger.info('[build] preparing service-worker precache from rendered offline dependencies');
  const offlineDependencies = await prepareServiceWorkerPrecache(options.outDir);
  logger.info(`[build] service-worker offline dependencies=${offlineDependencies.length}`);

  const assetManifest = await hashAndRewritePublicAssets(options.outDir, options);
  if (assetManifest.fingerprinted) {
    logger.info(`[build] fingerprinted ${Object.keys(assetManifest.assets).length} core asset(s)`);
  } else {
    logger.info(`[build] preserved ${Object.keys(assetManifest.assets).length} core asset(s) for local caching`);
  }

  const pwaReport = await assertPwaContract({
    mode: 'dist',
    rootDir: options.outDir,
  });
  logger.info(formatPwaContractSummary(pwaReport));

  const fileCount = await countFiles(options.outDir);
  const ms = Date.now() - startedAt;

  logger.info(
    `[build] copied=${copyStats.copied} rendered=${copyStats.rendered} symlinked=${copyStats.symlinked} skipped=${copyStats.skipped}`
    + (copyStats.templateMs != null
      ? ` templateMs=${copyStats.templateMs} partialHits=${copyStats.templatePartialHits ?? 0}`
      : '')
  );
  logger.info(`[build] wrote ${fileCount} files to ${relRepo(options.outDir)}/ in ${ms}ms`);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await main();
}
