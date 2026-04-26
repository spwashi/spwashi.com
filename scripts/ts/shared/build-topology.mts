export const BUILD_EXCLUDED_TOP_LEVEL = [
  '.agents',
  '.git',
  '.github',
  '.idea',
  '.gitignore',
  '.gitmodules',
  '00.unsorted',
  '_partials',
  'dist',
  'dist-vite',
  'node_modules',
  'scripts',
  'types',
  'AGENTS.md',
  'package.json',
  'package-lock.json',
  'split-css.js',
  'tsconfig.json',
  'tsconfig.runtime.json',
  'tsconfig.scripts.json',
  'vite.config.ts',
] as const;

export const BUILD_EXCLUDED_BASENAMES = [
  '.DS_Store',
] as const;

export const BUILD_EXCLUDED_PREFIXES = [
  '.spw/_workbench',
  'public/ts',
  'public/images/renders/_raw',
  'public/images/renders/_raw-2x2',
] as const;

export const VALIDATION_IGNORED_SEGMENTS = [
  '.agents',
  '.git',
  '.idea',
  '.spw',
  '00.unsorted',
  'dist',
  'dist-vite',
  'node_modules',
] as const;

export const VALIDATION_IGNORED_PREFIXES = [
  'design/catalog/',
] as const;

export const IMAGE_EXTENSIONS = [
  '.avif',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp',
] as const;

export function toPosixPath(value: string): string {
  return value.split('\\').join('/');
}

export function firstPathSegment(repoPath: string): string {
  return toPosixPath(repoPath).replace(/^\/+/, '').split('/')[0] || '';
}

export function hasRepoPathPrefix(repoPath: string, prefix: string): boolean {
  const normalizedPath = toPosixPath(repoPath).replace(/^\/+/, '');
  const normalizedPrefix = toPosixPath(prefix).replace(/^\/+|\/+$/g, '');
  return normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`);
}

export function shouldExcludeBuildPath(repoPath: string, outputRelativePath = 'dist'): boolean {
  const normalizedPath = toPosixPath(repoPath).replace(/^\/+/, '');
  if (!normalizedPath) return true;

  if ((BUILD_EXCLUDED_TOP_LEVEL as readonly string[]).includes(firstPathSegment(normalizedPath))) return true;
  if (outputRelativePath && hasRepoPathPrefix(normalizedPath, outputRelativePath)) return true;
  if (BUILD_EXCLUDED_PREFIXES.some((prefix) => hasRepoPathPrefix(normalizedPath, prefix))) return true;

  const basename = normalizedPath.split('/').pop() || '';
  return (BUILD_EXCLUDED_BASENAMES as readonly string[]).includes(basename);
}

export function shouldIgnoreValidationPath(relativePath: string): boolean {
  const normalizedPath = toPosixPath(relativePath).replace(/^\/+/, '');
  if ((VALIDATION_IGNORED_SEGMENTS as readonly string[]).includes(firstPathSegment(normalizedPath))) return true;
  return VALIDATION_IGNORED_PREFIXES.some((prefix) => hasRepoPathPrefix(normalizedPath, prefix));
}
