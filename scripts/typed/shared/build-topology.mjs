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
    'src',
    'types',
    'AGENTS.md',
    'package.json',
    'package-lock.json',
    'split-css.js',
    'tsconfig.json',
    'tsconfig.runtime.json',
    'tsconfig.scripts.json',
    'vite.config.ts',
];
export const BUILD_EXCLUDED_BASENAMES = [
    '.DS_Store',
];
export const BUILD_EXCLUDED_PREFIXES = [
    '.spw/_workbench',
    'public/ts',
    'public/images/renders/_raw',
    'public/images/renders/_raw-2x2',
];
export const VALIDATION_IGNORED_SEGMENTS = [
    '.agents',
    '.git',
    '.idea',
    '.spw',
    '00.unsorted',
    'dist',
    'dist-vite',
    'node_modules',
];
export const VALIDATION_IGNORED_PREFIXES = [
    'design/catalog/',
];
export const IMAGE_EXTENSIONS = [
    '.avif',
    '.gif',
    '.ico',
    '.jpeg',
    '.jpg',
    '.png',
    '.svg',
    '.webp',
];
export function toPosixPath(value) {
    return value.split('\\').join('/');
}
export function firstPathSegment(repoPath) {
    return toPosixPath(repoPath).replace(/^\/+/, '').split('/')[0] || '';
}
export function hasRepoPathPrefix(repoPath, prefix) {
    const normalizedPath = toPosixPath(repoPath).replace(/^\/+/, '');
    const normalizedPrefix = toPosixPath(prefix).replace(/^\/+|\/+$/g, '');
    return normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`);
}
export function shouldExcludeBuildPath(repoPath, outputRelativePath = 'dist') {
    const normalizedPath = toPosixPath(repoPath).replace(/^\/+/, '');
    if (!normalizedPath)
        return true;
    if (BUILD_EXCLUDED_TOP_LEVEL.includes(firstPathSegment(normalizedPath)))
        return true;
    if (outputRelativePath && hasRepoPathPrefix(normalizedPath, outputRelativePath))
        return true;
    if (BUILD_EXCLUDED_PREFIXES.some((prefix) => hasRepoPathPrefix(normalizedPath, prefix)))
        return true;
    const basename = normalizedPath.split('/').pop() || '';
    return BUILD_EXCLUDED_BASENAMES.includes(basename);
}
export function shouldIgnoreValidationPath(relativePath) {
    const normalizedPath = toPosixPath(relativePath).replace(/^\/+/, '');
    if (VALIDATION_IGNORED_SEGMENTS.includes(firstPathSegment(normalizedPath)))
        return true;
    return VALIDATION_IGNORED_PREFIXES.some((prefix) => hasRepoPathPrefix(normalizedPath, prefix));
}
