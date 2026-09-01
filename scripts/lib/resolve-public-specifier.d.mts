export const PUBLIC_SPECIFIER_PREFIX: '/public/';

export function isPublicSpecifier(specifier?: string): boolean;

export function resolvePublicSpecifier(
  specifier: string,
  rootDir: string,
): string | null;
