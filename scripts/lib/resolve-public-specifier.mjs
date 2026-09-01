/**
 * Map browser-absolute `/public/…` specifiers onto a filesystem root.
 * Shared by the Node ESM hook, the site bundler, and tests.
 */

import path from 'node:path';

export const PUBLIC_SPECIFIER_PREFIX = '/public/';

export function isPublicSpecifier(specifier = '') {
  return String(specifier).startsWith(PUBLIC_SPECIFIER_PREFIX);
}

export function resolvePublicSpecifier(specifier, rootDir) {
  if (!rootDir || !isPublicSpecifier(specifier)) return null;
  return path.join(rootDir, String(specifier).slice(1));
}
