import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const EXCLUDED_TOP_LEVEL = new Set([
  '.agents',
  '.git',
  '.github',
  '.idea',
  '00.unsorted',
  '_partials',
  'dist',
  'node_modules',
  'scripts',
]);

export const EXCLUDED_PREFIXES = [
  '.spw/_workbench',
] as const;

function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

export function shouldExcludeRepoPath(repoPath: string): boolean {
  const normalizedPath = toPosix(repoPath).replace(/^\/+/, '');
  if (!normalizedPath) return true;

  const segments = normalizedPath.split('/');
  if (EXCLUDED_TOP_LEVEL.has(segments[0] || '')) return true;
  return EXCLUDED_PREFIXES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
}

export function runGit(args: string[]): string {
  const result = spawnSync('git', args, {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(`[sitemap] git ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  }

  return result.stdout;
}

export function listSourceRouteFiles(): string[] {
  return runGit(['ls-files', '-c', '-o', '--exclude-standard', '-z'])
    .split('\0')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((repoPath) => repoPath.endsWith('index.html') || repoPath === 'index.html')
    .filter((repoPath) => !shouldExcludeRepoPath(repoPath))
    .sort((a, b) => a.localeCompare(b));
}
