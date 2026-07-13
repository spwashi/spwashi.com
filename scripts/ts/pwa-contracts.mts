import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  collectTagAttributes,
  extractRuntimeArrayLiteral,
  splitList,
  stripQueryHash,
} from './site-contracts/helpers.mjs';
import { renderTemplate } from '../template.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

export type PwaContractMode = 'source' | 'dist';

export type PwaContractOptions = {
  mode?: PwaContractMode;
  rootDir?: string;
};

export type PwaContractReport = {
  errors: string[];
  manifestIcons: number;
  mode: PwaContractMode;
  offlineDependencies: string[];
  precacheAssets: string[];
  precacheRoutes: string[];
  rootDir: string;
  warnings: string[];
};

type ManifestIcon = {
  purpose?: unknown;
  sizes?: unknown;
  src?: unknown;
  type?: unknown;
};

type ManifestShortcut = {
  url?: unknown;
};

type WebManifest = {
  display?: unknown;
  icons?: unknown;
  name?: unknown;
  scope?: unknown;
  short_name?: unknown;
  shortcuts?: unknown;
  start_url?: unknown;
};

type BuildAssetManifest = {
  assets?: unknown;
  fingerprinted?: unknown;
};

type PrecacheLists = {
  all: string[];
  assets: string[];
  buildAssets: string[];
  required: string[];
  requiredAssets: string[];
  requiredRoutes: string[];
  routes: string[];
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function normalizeLocalUrl(value: unknown): string | null {
  const raw = stripQueryHash(value).trim();
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  if (decoded.split('/').includes('..') || decoded.includes('\0')) return null;
  return decoded || '/';
}

function resolveLocalPath(rootDir: string, urlPath: string): string | null {
  const pathname = normalizeLocalUrl(urlPath);
  if (!pathname) return null;

  const resolvedRoot = path.resolve(rootDir);
  const resolved = path.resolve(resolvedRoot, pathname.replace(/^\/+/, ''));
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) return null;
  return resolved;
}

async function isFile(filePath: string | null): Promise<boolean> {
  if (!filePath) return false;
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function assetExists(rootDir: string, urlPath: string): Promise<boolean> {
  return isFile(resolveLocalPath(rootDir, urlPath));
}

async function routeExists(rootDir: string, route: string): Promise<boolean> {
  const pathname = normalizeLocalUrl(route);
  if (!pathname) return false;
  if (pathname === '/') return isFile(path.join(rootDir, 'index.html'));

  const relative = pathname.replace(/^\/+|\/+$/g, '');
  const direct = resolveLocalPath(rootDir, `/${relative}`);
  const candidates = [
    direct,
    resolveLocalPath(rootDir, `/${relative}.html`),
    resolveLocalPath(rootDir, `/${relative}/index.html`),
  ];

  for (const candidate of candidates) {
    if (await isFile(candidate)) return true;
  }
  return false;
}

function extractConstStrings(source: string): Map<string, string> {
  const values = new Map<string, string>();
  const pattern = /const\s+([A-Z][A-Z0-9_]*)\s*=\s*(['"])(.*?)\2\s*;/g;
  for (const match of source.matchAll(pattern)) {
    values.set(match[1], match[3]);
  }
  return values;
}

function decodeArrayString(token: string): string | null {
  const quote = token[0];
  if ((quote !== '"' && quote !== "'") || token.at(-1) !== quote) return null;
  return token
    .slice(1, -1)
    .replace(/\\(['"\\])/g, '$1');
}

function extractArrayValues(source: string, name: string, constants: Map<string, string>): string[] {
  const literal = extractRuntimeArrayLiteral(source, name);
  if (!literal) return [];

  const body = literal
    .slice(1, -1)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  const values: string[] = [];
  for (const rawToken of body.split(',')) {
    const token = rawToken.trim();
    if (!token) continue;
    const decoded = decodeArrayString(token);
    if (decoded !== null) {
      values.push(decoded);
      continue;
    }
    const constant = constants.get(token);
    if (constant) values.push(constant);
  }
  return uniqueSorted(values);
}

export function extractServiceWorkerPrecache(source: string): PrecacheLists {
  const constants = extractConstStrings(source);
  const routes = extractArrayValues(source, 'CORE_ROUTES', constants);
  const coreAssets = extractArrayValues(source, 'CORE_ASSETS', constants);
  const buildAssets = extractArrayValues(source, 'BUILD_PRECACHE_ASSETS', constants);
  const requiredLiteral = extractArrayValues(source, 'REQUIRED_PRECACHE_URLS', constants);
  const required = uniqueSorted([...requiredLiteral, ...buildAssets]);
  const routeSet = new Set(routes);
  const requiredRoutes = required.filter((value) => routeSet.has(value));
  const requiredAssets = required.filter((value) => !routeSet.has(value));
  const assets = uniqueSorted([...coreAssets, ...buildAssets, ...requiredAssets]);
  return {
    all: uniqueSorted([...routes, ...assets]),
    assets,
    buildAssets,
    required,
    requiredAssets,
    requiredRoutes,
    routes,
  };
}

export function collectOfflineDocumentDependencies(html: string): string[] {
  const dependencies: string[] = [];
  const dependencyRels = new Set([
    'apple-touch-icon',
    'icon',
    'manifest',
    'modulepreload',
    'preload',
    'stylesheet',
  ]);

  for (const attrs of collectTagAttributes(html, 'link')) {
    const rels = splitList(attrs.rel);
    if (!rels.some((rel) => dependencyRels.has(rel))) continue;
    const href = normalizeLocalUrl(attrs.href);
    if (href) dependencies.push(href);
  }

  for (const attrs of collectTagAttributes(html, 'script')) {
    const src = normalizeLocalUrl(attrs.src);
    if (src) dependencies.push(src);
  }

  return uniqueSorted(dependencies);
}

export function injectBuildPrecacheAssets(workerSource: string, dependencies: string[]): string {
  const precacheDeclaration = /const\s+PRECACHE_URLS\s*=\s*[^;]+;/;
  if (!precacheDeclaration.test(workerSource)) {
    throw new Error('[pwa] service worker is missing the PRECACHE_URLS declaration');
  }

  const withoutPreviousBuildList = workerSource
    .replace(
    /const\s+BUILD_PRECACHE_ASSETS\s*=\s*\[[\s\S]*?\];\s*/,
    '',
    )
    .replace(/^\s*\.\.\.BUILD_PRECACHE_ASSETS,?\s*$/gm, '');
  const existingRequired = new Set(extractServiceWorkerPrecache(withoutPreviousBuildList).required);
  const buildAssets = uniqueSorted(
    dependencies
      .map((value) => normalizeLocalUrl(value))
      .filter((value): value is string => Boolean(value)),
  ).filter((value) => !existingRequired.has(value));
  const requiredPattern = /const\s+REQUIRED_PRECACHE_URLS\s*=\s*\[([\s\S]*?)\];/;
  const requiredMatch = withoutPreviousBuildList.match(requiredPattern);
  if (!requiredMatch) {
    throw new Error('[pwa] service worker is missing the REQUIRED_PRECACHE_URLS declaration');
  }

  const requiredBody = requiredMatch[1].trimEnd();
  const separator = requiredBody.trim().endsWith(',') ? '' : ',';
  const declaration = `const BUILD_PRECACHE_ASSETS = ${JSON.stringify(buildAssets, null, 2)};\n\n`
    + `const REQUIRED_PRECACHE_URLS = [${requiredBody}${separator}\n  ...BUILD_PRECACHE_ASSETS,\n];`;
  const withRequiredBuildAssets = withoutPreviousBuildList.replace(requiredPattern, declaration);
  return withRequiredBuildAssets.replace(
    precacheDeclaration,
    'const PRECACHE_URLS = [...new Set([...REQUIRED_PRECACHE_URLS, ...OPTIONAL_PRECACHE_URLS])];',
  );
}

async function readJsonObject(filePath: string, label: string, errors: string[]): Promise<Record<string, unknown> | null> {
  let source = '';
  try {
    source = await fs.readFile(filePath, 'utf8');
  } catch {
    errors.push(`Missing ${label}: ${filePath}`);
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(source);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      errors.push(`${label} must contain a JSON object.`);
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function readPngDimensions(filePath: string): Promise<{ height: number; width: number } | null> {
  try {
    const handle = await fs.open(filePath, 'r');
    try {
      const header = Buffer.alloc(24);
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      const signature = '89504e470d0a1a0a';
      if (bytesRead < 24 || header.subarray(0, 8).toString('hex') !== signature) return null;
      return {
        height: header.readUInt32BE(20),
        width: header.readUInt32BE(16),
      };
    } finally {
      await handle.close();
    }
  } catch {
    return null;
  }
}

async function validateManifest(
  rootDir: string,
  precache: Set<string>,
  errors: string[],
): Promise<{ iconCount: number; manifest: WebManifest | null }> {
  const manifestPath = path.join(rootDir, 'manifest.webmanifest');
  const manifestObject = await readJsonObject(manifestPath, 'web manifest', errors);
  if (!manifestObject) return { iconCount: 0, manifest: null };
  const manifest = manifestObject as WebManifest;

  for (const key of ['name', 'short_name', 'start_url', 'scope', 'display'] as const) {
    if (typeof manifest[key] !== 'string' || !manifest[key].trim()) {
      errors.push(`Web manifest is missing required string field ${key}.`);
    }
  }

  if (!precache.has('/manifest.webmanifest')) {
    errors.push('Service worker precache is missing /manifest.webmanifest.');
  }

  if (typeof manifest.start_url === 'string' && !(await routeExists(rootDir, manifest.start_url))) {
    errors.push(`Web manifest start_url does not resolve: ${manifest.start_url}`);
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons as ManifestIcon[] : [];
  if (!icons.length) errors.push('Web manifest must define at least one icon.');

  let hasAny192 = false;
  let hasAny512 = false;
  let hasMaskable = false;

  for (const [index, icon] of icons.entries()) {
    const src = normalizeLocalUrl(icon?.src);
    const label = `Web manifest icon[${index}]`;
    if (!src) {
      errors.push(`${label} must use a root-relative src.`);
      continue;
    }

    const iconPath = resolveLocalPath(rootDir, src);
    if (!(await isFile(iconPath))) {
      errors.push(`${label} does not resolve: ${src}`);
      continue;
    }
    if (!precache.has(src)) errors.push(`Service worker precache is missing manifest icon ${src}.`);

    const sizes = typeof icon.sizes === 'string' ? splitList(icon.sizes) : [];
    const purpose = typeof icon.purpose === 'string' ? splitList(icon.purpose) : ['any'];
    if (purpose.includes('any') && sizes.includes('192x192')) hasAny192 = true;
    if (purpose.includes('any') && sizes.includes('512x512')) hasAny512 = true;
    if (purpose.includes('maskable')) hasMaskable = true;

    if (icon.type === 'image/png' && iconPath) {
      const dimensions = await readPngDimensions(iconPath);
      if (!dimensions) {
        errors.push(`${label} declares image/png but is not a readable PNG: ${src}`);
      } else if (
        sizes.length
        && !sizes.includes('any')
        && !sizes.includes(`${dimensions.width}x${dimensions.height}`)
      ) {
        errors.push(
          `${label} declares sizes=${sizes.join(' ')} but file is ${dimensions.width}x${dimensions.height}: ${src}`,
        );
      }
    }
  }

  if (!hasAny192) errors.push('Web manifest must include a 192x192 purpose=any icon.');
  if (!hasAny512) errors.push('Web manifest must include a 512x512 purpose=any icon.');
  if (!hasMaskable) errors.push('Web manifest must include a maskable icon.');

  const shortcuts = Array.isArray(manifest.shortcuts) ? manifest.shortcuts as ManifestShortcut[] : [];
  for (const [index, shortcut] of shortcuts.entries()) {
    const shortcutUrl = normalizeLocalUrl(shortcut?.url);
    if (!shortcutUrl) {
      errors.push(`Web manifest shortcut[${index}] must use a root-relative url.`);
      continue;
    }
    if (!(await routeExists(rootDir, shortcutUrl))) {
      errors.push(`Web manifest shortcut[${index}] does not resolve: ${shortcutUrl}`);
    }
  }

  return { iconCount: icons.length, manifest };
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
    if (entry.isDirectory()) await walkFiles(entryPath, results);
    else if (entry.isFile()) results.push(entryPath);
  }
  return results;
}

async function validateBuildAssetManifest(
  rootDir: string,
  workerPrecache: Set<string>,
  errors: string[],
): Promise<void> {
  const manifestObject = await readJsonObject(
    path.join(rootDir, 'asset-manifest.json'),
    'build asset manifest',
    errors,
  );
  if (!manifestObject) return;

  const buildManifest = manifestObject as BuildAssetManifest;
  if (typeof buildManifest.fingerprinted !== 'boolean') {
    errors.push('Build asset manifest must declare fingerprinted as a boolean.');
  }
  if (!buildManifest.assets || typeof buildManifest.assets !== 'object' || Array.isArray(buildManifest.assets)) {
    errors.push('Build asset manifest must declare an assets object.');
    return;
  }

  const assets = buildManifest.assets as Record<string, unknown>;
  const removedAssets: string[] = [];
  for (const [original, rawTarget] of Object.entries(assets)) {
    const target = normalizeLocalUrl(rawTarget);
    if (!target) {
      errors.push(`Build asset manifest target for ${original} must be root-relative.`);
      continue;
    }
    if (!(await assetExists(rootDir, target))) {
      errors.push(`Build asset manifest target does not resolve: ${target}`);
    }
    if (buildManifest.fingerprinted && original !== target) {
      removedAssets.push(original);
      if (await assetExists(rootDir, original)) {
        errors.push(`Fingerprinting left the removed entry asset in dist: ${original}`);
      }
      if (workerPrecache.has(original)) {
        errors.push(`Production worker still references removed entry asset ${original}.`);
      }
    }
  }

  if (!removedAssets.length) return;
  const catalogHtmlFiles = (await walkFiles(path.join(rootDir, 'design', 'catalog')))
    .filter((file) => file.endsWith('.html'));
  for (const file of catalogHtmlFiles) {
    const source = await fs.readFile(file, 'utf8');
    for (const removed of removedAssets) {
      if (source.includes(removed)) {
        errors.push(
          `Generated catalog references removed entry asset ${removed}: ${path.relative(rootDir, file)}`,
        );
      }
    }
  }
}

export async function collectPwaContractReport(options: PwaContractOptions = {}): Promise<PwaContractReport> {
  const rootDir = path.resolve(options.rootDir || REPO_ROOT);
  const mode = options.mode || 'source';
  const errors: string[] = [];
  const warnings: string[] = [];

  let workerSource = '';
  try {
    workerSource = await fs.readFile(path.join(rootDir, 'sw.js'), 'utf8');
  } catch {
    errors.push(`Missing root service worker: ${path.join(rootDir, 'sw.js')}`);
  }

  const precache = extractServiceWorkerPrecache(workerSource);
  if (!precache.routes.length) errors.push('Service worker CORE_ROUTES could not be read.');
  if (!precache.assets.length) errors.push('Service worker CORE_ASSETS could not be read.');

  for (const route of precache.routes) {
    if (!(await routeExists(rootDir, route))) errors.push(`Precache route does not resolve: ${route}`);
  }
  for (const asset of precache.assets) {
    if (!(await assetExists(rootDir, asset))) errors.push(`Precache asset does not resolve: ${asset}`);
  }

  const precacheSet = new Set(precache.all);
  const requiredPrecacheSet = new Set(precache.required);
  const manifest = await validateManifest(rootDir, precacheSet, errors);

  let offlineHtml = '';
  const offlinePath = path.join(rootDir, 'offline', 'index.html');
  try {
    offlineHtml = await fs.readFile(offlinePath, 'utf8');
    if (mode === 'source') {
      offlineHtml = (await renderTemplate(offlineHtml, {
        sourceLabel: path.relative(rootDir, offlinePath),
      })).output;
    }
  } catch {
    errors.push(`Missing offline document: ${offlinePath}`);
  }
  const offlineDependencies = collectOfflineDocumentDependencies(offlineHtml);
  if (!precache.routes.includes('/offline/')) errors.push('Service worker precache is missing /offline/.');
  for (const dependency of offlineDependencies) {
    if (!(await assetExists(rootDir, dependency))) {
      errors.push(`Offline document dependency does not resolve: ${dependency}`);
    }
    if (!precacheSet.has(dependency)) {
      errors.push(`Service worker precache is missing offline dependency ${dependency}.`);
    }
    if (mode === 'dist' && !requiredPrecacheSet.has(dependency)) {
      errors.push(`Required production precache is missing offline dependency ${dependency}.`);
    }
  }

  if (mode === 'dist') {
    const precacheExpression = workerSource.match(/const\s+PRECACHE_URLS\s*=\s*([^;]+);/)?.[1] || '';
    if (
      !precacheExpression.includes('REQUIRED_PRECACHE_URLS')
      || !precacheExpression.includes('OPTIONAL_PRECACHE_URLS')
    ) {
      errors.push('Production worker PRECACHE_URLS must combine required and optional precache lists.');
    }
    const requiredExpression = workerSource.match(/const\s+REQUIRED_PRECACHE_URLS\s*=\s*\[([\s\S]*?)\];/)?.[1] || '';
    if (!requiredExpression.includes('BUILD_PRECACHE_ASSETS')) {
      errors.push('Production worker does not include BUILD_PRECACHE_ASSETS in REQUIRED_PRECACHE_URLS.');
    }
    if (!/REQUIRED_PRECACHE_URLS\.map\s*\(/.test(workerSource)) {
      errors.push('Production worker install does not fetch REQUIRED_PRECACHE_URLS.');
    }
    if (!/OPTIONAL_PRECACHE_URLS\.map\s*\(/.test(workerSource)) {
      errors.push('Production worker install does not fetch OPTIONAL_PRECACHE_URLS.');
    }
    await validateBuildAssetManifest(rootDir, precacheSet, errors);
  }

  return {
    errors: uniqueSorted(errors),
    manifestIcons: manifest.iconCount,
    mode,
    offlineDependencies,
    precacheAssets: precache.assets,
    precacheRoutes: precache.routes,
    rootDir,
    warnings: uniqueSorted(warnings),
  };
}

export function formatPwaContractSummary(report: PwaContractReport): string {
  return `[pwa] mode=${report.mode} routes=${report.precacheRoutes.length} assets=${report.precacheAssets.length}`
    + ` offlineDependencies=${report.offlineDependencies.length} manifestIcons=${report.manifestIcons}`;
}

export async function assertPwaContract(options: PwaContractOptions = {}): Promise<PwaContractReport> {
  const report = await collectPwaContractReport(options);
  if (report.errors.length) {
    throw new Error(`${formatPwaContractSummary(report)} failed\n${report.errors.map((error) => `  ${error}`).join('\n')}`);
  }
  return report;
}

function parseCliArgs(argv: string[]): Required<PwaContractOptions> {
  const options: Required<PwaContractOptions> = {
    mode: 'source',
    rootDir: REPO_ROOT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dist') {
      options.mode = 'dist';
      options.rootDir = path.join(REPO_ROOT, 'dist');
      continue;
    }
    if (arg === '--mode' && argv[index + 1]) {
      const mode = argv[index + 1];
      if (mode !== 'source' && mode !== 'dist') throw new Error(`[pwa] unknown mode: ${mode}`);
      options.mode = mode;
      index += 1;
      continue;
    }
    if (arg.startsWith('--mode=')) {
      const mode = arg.slice('--mode='.length);
      if (mode !== 'source' && mode !== 'dist') throw new Error(`[pwa] unknown mode: ${mode}`);
      options.mode = mode;
      continue;
    }
    if (arg === '--root' && argv[index + 1]) {
      options.rootDir = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg.startsWith('--root=')) {
      options.rootDir = path.resolve(arg.slice('--root='.length));
      continue;
    }
    throw new Error(`[pwa] unknown argument: ${arg}`);
  }

  return options;
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const options = parseCliArgs(argv);
  const report = await collectPwaContractReport(options);
  console.log(formatPwaContractSummary(report));
  for (const warning of report.warnings) console.log(`  warn: ${warning}`);
  if (report.errors.length) {
    for (const error of report.errors) console.log(`  error: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log('[pwa] passed');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await main();
}
