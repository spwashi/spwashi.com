import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';

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

  const htmlFiles = (await walkFiles(outDir)).filter((file) => file.endsWith('.html'));
  for (const file of htmlFiles) {
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

  const assetManifest = await hashAndRewritePublicAssets(options.outDir, options);
  if (assetManifest.fingerprinted) {
    logger.info(`[build] fingerprinted ${Object.keys(assetManifest.assets).length} core asset(s)`);
  } else {
    logger.info(`[build] preserved ${Object.keys(assetManifest.assets).length} core asset(s) for local caching`);
  }

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

  const fileCount = await countFiles(options.outDir);
  const ms = Date.now() - startedAt;

  logger.info(
    `[build] copied=${copyStats.copied} rendered=${copyStats.rendered} symlinked=${copyStats.symlinked} skipped=${copyStats.skipped}`
  );
  logger.info(`[build] wrote ${fileCount} files to ${relRepo(options.outDir)}/ in ${ms}ms`);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await main();
}
