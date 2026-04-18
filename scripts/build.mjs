#!/usr/bin/env node
/**
 * Static site build.
 *
 * Source:  tracked deployable site files in the repo root.
 * Output:  dist/ — flat static files, ready to publish to GitHub Pages.
 *
 * Steps:
 *   1. Clean dist/
 *   2. Copy tracked source files into dist/, skipping build-internal and
 *      non-deploy paths
 *   3. Write a .nojekyll so GitHub Pages does not strip underscore dirs
 *   4. Generate dist/sitemap.xml from tracked route canonicals
 *   5. Regenerate the design catalog into dist/design/catalog/
 *
 * Zero deps.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { renderTemplate } from './template.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const EXCLUDED_TOP_LEVEL = new Set([
  '.agents',
  '.git',
  '.github',
  '.idea',
  '.gitignore',
  '.gitmodules',
  '00.unsorted',
  '_partials',
  'dist',
  'node_modules',
  'scripts',
  'AGENTS.md',
  'package.json',
  'package-lock.json',
  'split-css.js',
]);

const EXCLUDED_BASENAMES = new Set([
  '.DS_Store',
]);

const EXCLUDED_PREFIXES = [
  '.spw/_workbench',
  'public/images/renders/_raw',
  'public/images/renders/_raw-2x2',
];

const IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp',
]);

const COPY_CONCURRENCY = 8;
const COPY_PROGRESS_INTERVAL = 100;

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function relRepo(abs) {
  return toPosix(path.relative(ROOT_DIR, abs));
}

function shouldExcludeRepoPath(repoPath) {
  const normalizedPath = toPosix(repoPath).replace(/^\/+/, '');
  if (!normalizedPath) return true;

  const segments = normalizedPath.split('/');
  if (EXCLUDED_TOP_LEVEL.has(segments[0])) return true;
  if (EXCLUDED_PREFIXES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))) return true;

  const basename = path.posix.basename(normalizedPath);
  return EXCLUDED_BASENAMES.has(basename);
}

async function rmrf(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function copyFileOrRender(srcPath, dstPath) {
  await fs.mkdir(path.dirname(dstPath), { recursive: true });

  if (srcPath.endsWith('.html')) {
    const source = await fs.readFile(srcPath, 'utf8');
    const { output } = await renderTemplate(source, { sourceLabel: relRepo(srcPath) });
    await fs.writeFile(dstPath, output);
    return;
  }
  await fs.copyFile(srcPath, dstPath);
}

async function countFiles(dir) {
  let count = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += await countFiles(abs);
    } else if (entry.isFile()) {
      count += 1;
    }
  }
  return count;
}

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(`[build] git ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  }

  return result.stdout;
}

function listTrackedRepoPaths() {
  return runGit(['ls-files', '-z'])
    .split('\0')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((repoPath) => !shouldExcludeRepoPath(repoPath));
}

async function checkTrackedImageRedundancy(trackedPaths) {
  const imagePaths = trackedPaths.filter((repoPath) => {
    if (!repoPath.startsWith('public/images/')) return false;
    return IMAGE_EXTENSIONS.has(path.posix.extname(repoPath).toLowerCase());
  });

  const pathsBySize = new Map();
  for (const repoPath of imagePaths) {
    const absPath = path.join(ROOT_DIR, repoPath);
    const stats = await fs.stat(absPath);
    const sizeKey = String(stats.size);
    const matches = pathsBySize.get(sizeKey) || [];
    matches.push(repoPath);
    pathsBySize.set(sizeKey, matches);
  }

  const candidates = [...pathsBySize.values()].filter((paths) => paths.length > 1);
  if (!candidates.length) return [];

  const pathsByHash = new Map();
  for (const candidatePaths of candidates) {
    for (const repoPath of candidatePaths) {
      const hash = createHash('sha256')
        .update(await fs.readFile(path.join(ROOT_DIR, repoPath)))
        .digest('hex');
      const matches = pathsByHash.get(hash) || [];
      matches.push(repoPath);
      pathsByHash.set(hash, matches);
    }
  }

  return [...pathsByHash.values()]
    .filter((paths) => paths.length > 1)
    .map((paths) => paths.sort((a, b) => a.localeCompare(b)));
}

function logDuplicateImages(duplicateGroups) {
  if (!duplicateGroups.length) return;

  console.warn(`[build] duplicate tracked images detected (${duplicateGroups.length} groups)`);
  for (const group of duplicateGroups.slice(0, 8)) {
    console.warn(`[build]   ${group.join(' | ')}`);
  }
  if (duplicateGroups.length > 8) {
    console.warn(`[build]   ... ${duplicateGroups.length - 8} more duplicate groups`);
  }
}

async function copyTrackedPath(repoPath) {
  const srcPath = path.join(ROOT_DIR, repoPath);
  const dstPath = path.join(DIST_DIR, repoPath);
  const stats = await fs.lstat(srcPath);

  if (stats.isDirectory()) return;

  if (stats.isSymbolicLink()) {
    await fs.mkdir(path.dirname(dstPath), { recursive: true });
    const link = await fs.readlink(srcPath);
    await fs.symlink(link, dstPath);
    return;
  }

  if (stats.isFile()) {
    await copyFileOrRender(srcPath, dstPath);
  }
}

async function copyRepo(trackedPaths) {
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < trackedPaths.length) {
      const repoPath = trackedPaths[nextIndex];
      nextIndex += 1;
      await copyTrackedPath(repoPath);
      completed += 1;

      if (completed % COPY_PROGRESS_INTERVAL === 0 || completed === trackedPaths.length) {
        console.log(`[build] copied ${completed}/${trackedPaths.length} tracked files`);
      }
    }
  }

  const workerCount = Math.min(COPY_CONCURRENCY, trackedPaths.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

function runNodeScript(scriptRelPath, args = []) {
  const result = spawnSync(process.execPath, [path.join(ROOT_DIR, scriptRelPath), ...args], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`[build] ${scriptRelPath} exited with code ${result.status}`);
  }
}

async function main() {
  const startedAt = Date.now();
  const trackedPaths = listTrackedRepoPaths();

  console.log(`[build] cleaning ${relRepo(DIST_DIR)}/`);
  await rmrf(DIST_DIR);
  await fs.mkdir(DIST_DIR, { recursive: true });

  console.log('[build] checking tracked image redundancy');
  logDuplicateImages(await checkTrackedImageRedundancy(trackedPaths));

  console.log('[build] copying source tree to dist/');
  await copyRepo(trackedPaths);

  await fs.writeFile(path.join(DIST_DIR, '.nojekyll'), '');

  console.log('[build] generating dist/sitemap.xml');
  runNodeScript('scripts/generate-sitemap.mjs', ['--out', path.join(DIST_DIR, 'sitemap.xml')]);

  console.log('[build] regenerating design catalog into dist/design/catalog/');
  runNodeScript('scripts/generate-design-catalog.mjs', ['--out', path.join(DIST_DIR, 'design', 'catalog')]);

  const fileCount = await countFiles(DIST_DIR);
  const ms = Date.now() - startedAt;
  console.log(`[build] wrote ${fileCount} files to ${relRepo(DIST_DIR)}/ in ${ms}ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
