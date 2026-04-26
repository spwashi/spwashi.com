import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderTemplate } from '../../template.mjs';
import { DEFAULT_COPY_CONCURRENCY, DEFAULT_COPY_PROGRESS_INTERVAL, } from './types.mjs';
import { IMAGE_EXTENSIONS, shouldExcludeBuildPath, toPosixPath, } from '../shared/build-topology.mjs';
export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const DEFAULT_OUT_DIR = path.join(ROOT_DIR, 'dist');
function toPosix(value) {
    return toPosixPath(value);
}
function relRepo(absPath) {
    return toPosix(path.relative(ROOT_DIR, absPath));
}
export function parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
export function parseArgs(argv) {
    const options = {
        outDir: DEFAULT_OUT_DIR,
        clean: true,
        imageCheck: true,
        sitemap: true,
        catalog: true,
        quiet: false,
        copyConcurrency: parsePositiveInteger(process.env.BUILD_COPY_CONCURRENCY, DEFAULT_COPY_CONCURRENCY),
        progressInterval: parsePositiveInteger(process.env.BUILD_PROGRESS_INTERVAL, DEFAULT_COPY_PROGRESS_INTERVAL),
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--out' && argv[index + 1]) {
            options.outDir = path.resolve(argv[index + 1]);
            index += 1;
            continue;
        }
        if (arg.startsWith('--out=')) {
            options.outDir = path.resolve(arg.slice('--out='.length));
            continue;
        }
        if (arg === '--no-clean') {
            options.clean = false;
            continue;
        }
        if (arg === '--skip-image-check') {
            options.imageCheck = false;
            continue;
        }
        if (arg === '--skip-sitemap') {
            options.sitemap = false;
            continue;
        }
        if (arg === '--skip-catalog') {
            options.catalog = false;
            continue;
        }
        if (arg === '--quiet') {
            options.quiet = true;
            continue;
        }
        if (arg === '--concurrency' && argv[index + 1]) {
            options.copyConcurrency = parsePositiveInteger(argv[index + 1], options.copyConcurrency);
            index += 1;
            continue;
        }
        if (arg.startsWith('--concurrency=')) {
            options.copyConcurrency = parsePositiveInteger(arg.slice('--concurrency='.length), options.copyConcurrency);
            continue;
        }
        if (arg === '--progress-interval' && argv[index + 1]) {
            options.progressInterval = parsePositiveInteger(argv[index + 1], options.progressInterval);
            index += 1;
            continue;
        }
        if (arg.startsWith('--progress-interval=')) {
            options.progressInterval = parsePositiveInteger(arg.slice('--progress-interval='.length), options.progressInterval);
            continue;
        }
        if (arg === '--help' || arg === '-h') {
            options.help = true;
            continue;
        }
        throw new Error(`[build] unknown argument: ${arg}`);
    }
    return options;
}
export function printHelp() {
    console.log(`Usage: node scripts/build.mjs [options]

Options:
  --out <dir>              Output directory. Default: dist
  --no-clean               Do not delete the output directory before copying.
  --skip-image-check       Skip duplicate image detection.
  --skip-sitemap           Skip sitemap generation.
  --skip-catalog           Skip design catalog generation.
  --concurrency <n>        Copy concurrency. Default: ${DEFAULT_COPY_CONCURRENCY}
  --progress-interval <n>  Copy progress log interval. Default: ${DEFAULT_COPY_PROGRESS_INTERVAL}
  --quiet                  Suppress non-error logs.
  -h, --help               Show this help.

Environment:
  BUILD_COPY_CONCURRENCY   Default copy concurrency.
  BUILD_PROGRESS_INTERVAL  Default copy progress interval.
  SOURCE_DATE_EPOCH        Passed through to child scripts that support reproducible output.
`);
}
export function createLogger(options) {
    return {
        info(message) {
            if (!options.quiet)
                console.log(message);
        },
        warn(message) {
            console.warn(message);
        },
    };
}
export function assertSafeOutputDir(outDir) {
    const resolved = path.resolve(outDir);
    const root = path.resolve(ROOT_DIR);
    const relative = path.relative(root, resolved);
    if (!relative || relative === '') {
        throw new Error('[build] refusing to use repo root as output directory');
    }
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`[build] output directory must stay inside repo: ${resolved}`);
    }
    const normalized = toPosix(relative);
    if (normalized === '.git' || normalized.startsWith('.git/')) {
        throw new Error('[build] refusing to write inside .git');
    }
    return resolved;
}
export function shouldExcludeRepoPath(repoPath, outputRelativePath = 'dist') {
    return shouldExcludeBuildPath(repoPath, outputRelativePath);
}
export async function rmrf(target) {
    await fs.rm(target, { recursive: true, force: true });
}
export async function copyFileOrRender(srcPath, dstPath) {
    await fs.mkdir(path.dirname(dstPath), { recursive: true });
    if (srcPath.endsWith('.html')) {
        const source = await fs.readFile(srcPath, 'utf8');
        const { output } = await renderTemplate(source, { sourceLabel: relRepo(srcPath) });
        await fs.writeFile(dstPath, output, 'utf8');
        return 'rendered';
    }
    await fs.copyFile(srcPath, dstPath);
    return 'copied';
}
export async function countFiles(dir) {
    let count = 0;
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    }
    catch (error) {
        if (error?.code === 'ENOENT')
            return 0;
        throw error;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            count += await countFiles(abs);
        }
        else if (entry.isFile() || entry.isSymbolicLink()) {
            count += 1;
        }
    }
    return count;
}
export function runGit(args) {
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
export function listSourceRepoPaths(options) {
    const outputRelativePath = relRepo(options.outDir);
    return runGit(['ls-files', '-c', '-o', '--exclude-standard', '-z'])
        .split('\0')
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((repoPath) => !shouldExcludeRepoPath(repoPath, outputRelativePath))
        .sort((a, b) => a.localeCompare(b));
}
export async function checkImageRedundancy(sourcePaths) {
    const imagePaths = sourcePaths.filter((repoPath) => {
        if (!repoPath.startsWith('public/images/'))
            return false;
        const extension = path.posix.extname(repoPath).toLowerCase();
        return IMAGE_EXTENSIONS.includes(extension);
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
    if (!candidates.length)
        return [];
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
        .map((paths) => paths.sort((a, b) => a.localeCompare(b)))
        .sort((a, b) => a[0].localeCompare(b[0]));
}
export function logDuplicateImages(duplicateGroups, logger) {
    if (!duplicateGroups.length)
        return;
    logger.warn(`[build] duplicate images detected (${duplicateGroups.length} groups)`);
    for (const group of duplicateGroups.slice(0, 8)) {
        logger.warn(`[build]   ${group.join(' | ')}`);
    }
    if (duplicateGroups.length > 8) {
        logger.warn(`[build]   ... ${duplicateGroups.length - 8} more duplicate groups`);
    }
}
export async function copyTrackedPath(repoPath, options) {
    const srcPath = path.join(ROOT_DIR, repoPath);
    const dstPath = path.join(options.outDir, repoPath);
    let stats;
    try {
        stats = await fs.lstat(srcPath);
    }
    catch (error) {
        if (error?.code === 'ENOENT')
            return 'skipped-missing';
        throw error;
    }
    if (stats.isDirectory())
        return 'skipped-directory';
    if (stats.isSymbolicLink()) {
        await fs.mkdir(path.dirname(dstPath), { recursive: true });
        try {
            await fs.unlink(dstPath);
        }
        catch (error) {
            if (error?.code !== 'ENOENT')
                throw error;
        }
        const link = await fs.readlink(srcPath);
        await fs.symlink(link, dstPath);
        return 'symlinked';
    }
    if (stats.isFile()) {
        return copyFileOrRender(srcPath, dstPath);
    }
    return 'skipped-special';
}
export async function copyRepo(sourcePaths, options, logger) {
    let nextIndex = 0;
    let completed = 0;
    const stats = {
        copied: 0,
        rendered: 0,
        symlinked: 0,
        skipped: 0,
    };
    async function worker() {
        while (nextIndex < sourcePaths.length) {
            const repoPath = sourcePaths[nextIndex];
            nextIndex += 1;
            const result = await copyTrackedPath(repoPath, options);
            if (result === 'rendered')
                stats.rendered += 1;
            else if (result === 'copied')
                stats.copied += 1;
            else if (result === 'symlinked')
                stats.symlinked += 1;
            else
                stats.skipped += 1;
            completed += 1;
            if (options.progressInterval > 0
                && (completed % options.progressInterval === 0 || completed === sourcePaths.length)) {
                logger.info(`[build] copied ${completed}/${sourcePaths.length} files`);
            }
        }
    }
    const workerCount = Math.min(options.copyConcurrency, Math.max(sourcePaths.length, 1));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return stats;
}
export function runNodeScript(scriptRelPath, args = []) {
    const result = spawnSync(process.execPath, [path.join(ROOT_DIR, scriptRelPath), ...args], {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        env: process.env,
    });
    if (result.status !== 0) {
        throw new Error(`[build] ${scriptRelPath} exited with code ${result.status}`);
    }
}
export async function writeNoJekyll(outDir) {
    await fs.writeFile(path.join(outDir, '.nojekyll'), '', 'utf8');
}
