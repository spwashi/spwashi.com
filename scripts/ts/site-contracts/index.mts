import { spawn, spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { renderTemplate } from '../../template.mjs';
import {
  CORE_BUNDLE_HREF,
  isKnownRouteSurface,
  routeBundleHref,
} from '../css-manifest.mjs';
import {
  EXPECTED_SITE_SCRIPT_PREFIX,
  EXPECTED_STYLESHEET_PREFIX,
  REQUIRED_BODY_DATA_KEYS,
} from './types.mjs';
import {
  buildSvgSpecMaps,
  collectManifestIssues,
  collectRuntimeDefinitionsFromSource,
  countMatches,
  deriveRouteRuntime,
  extractBodyAttributes,
  extractSvgHosts,
  extractTitle,
  collectTagAttributes,
  normalizeInternalRoute,
  normalizeSpace,
  readModuleCatalogSource,
  routePathFromFile,
  splitList,
  splitPipeList,
  stripQueryHash,
  summarizeBySurface,
} from './helpers.mjs';
import {
  shouldIgnoreValidationPath,
  toPosixPath,
} from '../shared/build-topology.mjs';

export {
  collectManifestIssues,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
/** Repo-local agent cache by default (was TMPDIR — easy to leave stale). Override with SPW_ROUTE_MANIFEST_OUTPUT. */
export const ROUTE_MANIFEST_OUTPUT = process.env.SPW_ROUTE_MANIFEST_OUTPUT
  || path.join(ROOT_DIR, '.agents/state/runtime/route-runtime-manifest.json');

const DEFAULT_SYNTAX_CHECK_CONCURRENCY = Math.max(2, Math.min(8, availableParallelism()));

const SYNTAX_CHECK_BATCH_SCRIPT = path.join(ROOT_DIR, 'scripts', 'lib', 'syntax-check-batch.mjs');
/** Files per batch process; ~350 targets over 6 shards keeps each shard well under a second. */
const SYNTAX_CHECK_BATCH_SIZE = 64;

const RUNTIME_FRAGMENT_TARGETS = new Map([
  [
    '/play/rpg-wednesday/',
    {
      feature: 'rpg-gameplay',
      owner: 'public/js/modules/rpg-wednesday/index.js',
      targets: new Set(['rpgw-state-curator', 'rpg-kit-notes', 'rpg-kit-brief']),
    },
  ],
]);

function relativeRepoPath(absolutePath: string): string {
  return toPosixPath(path.relative(ROOT_DIR, absolutePath));
}

function shouldIgnoreRepoPath(relativePath: string): boolean {
  return shouldIgnoreValidationPath(relativePath);
}

function repoPathFromRootRelative(rootRelativePath: string): string {
  const cleanPath = stripQueryHash(rootRelativePath).replace(/^\/+/, '');
  return path.join(ROOT_DIR, cleanPath);
}

function decodeFragment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function collectLocalFragmentIssues(html: string, route: string, features: string[]): string[] {
  const ids = new Set<string>();
  const idPattern = /<[a-z][^>]*\sid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi;
  for (const match of html.matchAll(idPattern)) {
    const id = match[1] || match[2] || match[3] || '';
    if (id) ids.add(id);
  }

  const runtimeOwnership = RUNTIME_FRAGMENT_TARGETS.get(route);
  const runtimeTargets = runtimeOwnership && features.includes(runtimeOwnership.feature)
    ? runtimeOwnership.targets
    : new Set<string>();
  const issues = new Set<string>();

  for (const anchor of collectTagAttributes(html, 'a')) {
    const href = anchor.href || '';
    const hashIndex = href.indexOf('#');
    if (hashIndex < 0) continue;

    const routePart = href.slice(0, hashIndex);
    const rawFragment = href.slice(hashIndex + 1);
    if (!rawFragment || rawFragment.startsWith(':~:text=')) continue;

    if (routePart && routePart !== '.' && routePart !== './') {
      if (!routePart.startsWith('/')) continue;
      if (normalizeInternalRoute(stripQueryHash(routePart)) !== route) continue;
    }

    const fragment = decodeFragment(rawFragment);
    if (ids.has(fragment) || runtimeTargets.has(fragment)) continue;
    issues.add(`Same-page fragment #${fragment} has no static target.`);
  }

  return [...issues];
}

async function walkForRouteFiles(directoryPath: string, results: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    const relativePath = relativeRepoPath(absolutePath);

    if (shouldIgnoreRepoPath(relativePath)) continue;

    if (entry.isDirectory()) {
      await walkForRouteFiles(absolutePath, results);
      continue;
    }

    if (entry.isFile() && entry.name === 'index.html') {
      results.push(absolutePath);
    }
  }

  return results;
}

async function walkForFilesByExtension(directoryPath: string, extension: string, results: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    const relativePath = relativeRepoPath(absolutePath);

    if (shouldIgnoreRepoPath(relativePath)) continue;

    if (entry.isDirectory()) {
      await walkForFilesByExtension(absolutePath, extension, results);
      continue;
    }

    if (entry.isFile() && absolutePath.endsWith(extension)) {
      results.push(absolutePath);
    }
  }

  return results;
}

async function parseRouteFile(absoluteFilePath: string) {
  const relativeFilePath = relativeRepoPath(absoluteFilePath);
  const source = await fs.readFile(absoluteFilePath, 'utf8');
  const { output: html } = await renderTemplate(source, { sourceLabel: relativeFilePath });
  const bodyAttributes = extractBodyAttributes(html);
  const linkTags = collectTagAttributes(html, 'link');
  const scriptTags = collectTagAttributes(html, 'script');

  const stylesheets = linkTags
    .filter((attrs) => splitList(attrs.rel).includes('stylesheet') && attrs.href)
    .map((attrs) => attrs.href);

  const moduleScripts = scriptTags
    .filter((attrs) => attrs.type === 'module' && attrs.src)
    .map((attrs) => attrs.src);

  const manifestHref = linkTags.find((attrs) => splitList(attrs.rel).includes('manifest') && attrs.href)?.href || null;

  const iconHrefs = linkTags
    .filter((attrs) => {
      const relValues = splitList(attrs.rel);
      return attrs.href && (relValues.includes('icon') || relValues.includes('apple-touch-icon'));
    })
    .map((attrs) => attrs.href);

  const errors: string[] = [];
  const warnings: string[] = [];
  const route = routePathFromFile(relativeFilePath);
  const features = splitList(bodyAttributes?.['data-spw-features']);

  if (!bodyAttributes) {
    errors.push('Missing <body> element.');
  }

  const missingBodyKeys = REQUIRED_BODY_DATA_KEYS.filter((key) => !bodyAttributes?.[`data-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`]);
  if (missingBodyKeys.length) {
    errors.push(`Missing required body data attributes: ${missingBodyKeys.join(', ')}`);
  }

  const stylesheetMode = bodyAttributes?.['data-spw-stylesheet-mode'];
  const hasFullStylesheet = stylesheets.some((href) => stripQueryHash(href) === EXPECTED_STYLESHEET_PREFIX);
  const hasScopedCore = stylesheets.some((href) => stripQueryHash(href) === CORE_BUNDLE_HREF);
  if (!hasFullStylesheet && !(stylesheetMode === 'scoped' && hasScopedCore)) {
    errors.push(`Missing shared stylesheet ${EXPECTED_STYLESHEET_PREFIX} or scoped core bundle ${CORE_BUNDLE_HREF}`);
  }

  const surface = normalizeSpace(bodyAttributes?.['data-spw-surface']);
  if (stylesheetMode === 'scoped' && surface && !isKnownRouteSurface(surface)) {
    errors.push(
      `data-spw-surface="${surface}" is not in ROUTE_SCOPES/ROUTE_SURFACE_ALIASES; `
      + 'scoped delivery will ship core (+ behaviors) without a route CSS bundle.',
    );
  }
  // Source HTML keeps style.css; template rewrite attaches route bundles at render time.
  // When rendered output is checked (has core link), require the expected route bundle when one exists.
  if (hasScopedCore && surface) {
    const expectedRoute = routeBundleHref(surface);
    if (expectedRoute && !stylesheets.some((href) => stripQueryHash(href) === expectedRoute)) {
      // Source pages intentionally link style.css only — only warn when other bundle links are present.
      const hasAnyBundle = stylesheets.some((href) => stripQueryHash(href).startsWith('/public/css/bundles/'));
      if (hasAnyBundle) {
        warnings.push(`Scoped page surface "${surface}" should link ${expectedRoute} (or keep source style.css for template rewrite).`);
      }
    }
  }

  if (route !== '/offline/' && !moduleScripts.some((src) => stripQueryHash(src) === EXPECTED_SITE_SCRIPT_PREFIX)) {
    errors.push(`Missing shared runtime script ${EXPECTED_SITE_SCRIPT_PREFIX}`);
  }

  if (stripQueryHash(manifestHref || '') !== '/manifest.webmanifest') {
    errors.push('Missing shared web app manifest /manifest.webmanifest');
  }

  errors.push(...collectLocalFragmentIssues(html, route, features));

  const requiredHeadAssets = [...stylesheets, ...moduleScripts];
  if (manifestHref) requiredHeadAssets.push(manifestHref);

  for (const assetPath of requiredHeadAssets) {
    if (!assetPath.startsWith('/')) continue;
    try {
      await fs.access(repoPathFromRootRelative(assetPath));
    } catch {
      errors.push(`Missing referenced asset ${assetPath}`);
    }
  }

  for (const iconHref of iconHrefs) {
    if (!iconHref.startsWith('/')) continue;
    try {
      await fs.access(repoPathFromRootRelative(iconHref));
    } catch {
      warnings.push(`Missing optional icon asset ${iconHref}`);
    }
  }

  return {
    assets: {
      icons: iconHrefs,
      manifest: manifestHref,
      moduleScripts,
      stylesheets,
    },
    context: bodyAttributes?.['data-spw-context'] || null,
    errors,
    features,
    file: relativeFilePath,
    layout: bodyAttributes?.['data-spw-layout'] || null,
    pageFamily: bodyAttributes?.['data-spw-page-family'] || null,
    pageModes: splitList(bodyAttributes?.['data-spw-page-modes']),
    pageRole: bodyAttributes?.['data-spw-page-role'] || null,
    pageSeed: bodyAttributes?.['data-spw-page-seed'] || null,
    relatedRoutes: splitPipeList(bodyAttributes?.['data-spw-related-routes']).map(normalizeInternalRoute),
    route,
    routeFamily: bodyAttributes?.['data-spw-route-family'] || null,
    spec: {
      featureEnabled: splitList(bodyAttributes?.['data-spw-features']).includes('specs'),
      gridCount: countMatches(html, /\bclass=["'][^"']*\bspec-grid\b[^"']*["']/gi),
      kickerCount: countMatches(html, /\bclass=["'][^"']*\bspec-kicker\b[^"']*["']/gi),
      pillCount: countMatches(html, /\bclass=["'][^"']*\bspec-pill\b[^"']*["']/gi),
      stripCount: countMatches(html, /\bclass=["'][^"']*\bspec-strip\b[^"']*["']/gi),
    },
    surface: bodyAttributes?.['data-spw-surface'] || null,
    title: extractTitle(html),
    warnings,
    wonder: splitList(bodyAttributes?.['data-spw-wonder']),
    svg: {
      featureEnabled: splitList(bodyAttributes?.['data-spw-features']).includes('svg-surfaces'),
      figureCount: countMatches(html, /\bclass=["'][^"']*\bspw-svg-figure\b[^"']*["']/gi),
      hosts: extractSvgHosts(html),
      inlineCount: countMatches(html, /<svg\b/gi),
      surfaceCount: countMatches(html, /\bclass=["'][^"']*\bspw-svg-surface\b[^"']*["']/gi),
    },
  };
}

export async function buildRouteRuntimeManifest() {
  const routeFiles = await walkForRouteFiles(ROOT_DIR);
  const parsedRoutes = await Promise.all(routeFiles.map((filePath) => parseRouteFile(filePath)));
  const moduleCatalogSource = await readModuleCatalogSource(path.join(ROOT_DIR, 'public/js/runtime'));
  const runtimeDefinitions = collectRuntimeDefinitionsFromSource(moduleCatalogSource);
  const svgAssetFiles = await walkForFilesByExtension(path.join(ROOT_DIR, 'public'), '.svg');
  const svgAssets = svgAssetFiles.map((absolutePath) => `/${relativeRepoPath(absolutePath)}`).sort();

  const routePathSet = new Set(parsedRoutes.map((route) => route.route));
  const routes = parsedRoutes
    .sort((left, right) => left.route.localeCompare(right.route))
    .map((route) => {
      const routeWarnings = [...route.warnings];

      for (const relatedRoute of route.relatedRoutes) {
        if (!relatedRoute || !relatedRoute.startsWith('/')) continue;
        if (/\.[a-z0-9]+$/i.test(relatedRoute)) continue;
        if (!routePathSet.has(relatedRoute)) {
          routeWarnings.push(`Unknown related route ${relatedRoute}`);
        }
      }

      return {
        ...route,
        runtime: deriveRouteRuntime(route, runtimeDefinitions),
        warnings: routeWarnings,
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    maps: buildSvgSpecMaps(routes, svgAssets),
    repoRoot: ROOT_DIR,
    routeCount: routes.length,
    routes,
    runtimeDefinitions,
    surfaces: summarizeBySurface(routes),
  };
}

type RouteRuntimeManifest = Awaited<ReturnType<typeof buildRouteRuntimeManifest>>;
type ManifestCacheStatus = {
  cachePath: string;
  details: string[];
  status: 'fresh' | 'invalid' | 'missing' | 'stale';
};

function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalizeJson(entry)]),
  );
}

function semanticManifestSnapshot(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const {
    generatedAt: _generatedAt,
    repoRoot: _repoRoot,
    ...semanticFields
  } = value as Record<string, unknown>;
  return canonicalizeJson(semanticFields);
}

function runtimeDefinitionCount(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  return Object.values(value as Record<string, unknown>)
    .reduce((total: number, definitions) => total + (Array.isArray(definitions) ? definitions.length : 0), 0);
}

function manifestSummary(value: unknown) {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const maps = record.maps && typeof record.maps === 'object' && !Array.isArray(record.maps)
    ? record.maps as Record<string, unknown>
    : {};
  return {
    routeCount: typeof record.routeCount === 'number' ? record.routeCount : 0,
    runtimeDefinitions: runtimeDefinitionCount(record.runtimeDefinitions),
    specRoutes: Array.isArray(maps.specRoutes) ? maps.specRoutes.length : 0,
    surfaces: record.surfaces && typeof record.surfaces === 'object' && !Array.isArray(record.surfaces)
      ? Object.keys(record.surfaces).length
      : 0,
    svgRoutes: Array.isArray(maps.svgRoutes) ? maps.svgRoutes.length : 0,
  };
}

export function compareRouteRuntimeManifestSemantics(live: RouteRuntimeManifest, cached: unknown) {
  const liveSnapshot = semanticManifestSnapshot(live);
  const cachedSnapshot = semanticManifestSnapshot(cached);
  const matches = JSON.stringify(liveSnapshot) === JSON.stringify(cachedSnapshot);
  if (matches) return { details: [], matches };

  const liveSummary = manifestSummary(live);
  const cachedSummary = manifestSummary(cached);
  const details = Object.entries(liveSummary)
    .filter(([key, value]) => cachedSummary[key as keyof typeof cachedSummary] !== value)
    .map(([key, value]) => `${key} cached=${cachedSummary[key as keyof typeof cachedSummary]} live=${value}`);

  if (!details.length) details.push('route metadata or runtime eligibility changed');
  return { details, matches };
}

export async function inspectRouteRuntimeManifestCache(
  live: RouteRuntimeManifest,
  cachePath = ROUTE_MANIFEST_OUTPUT,
): Promise<ManifestCacheStatus> {
  let source: string;
  try {
    source = await fs.readFile(cachePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { cachePath, details: ['cache is absent'], status: 'missing' };
    }
    return { cachePath, details: [String(error)], status: 'invalid' };
  }

  let cached: unknown;
  try {
    cached = JSON.parse(source);
  } catch (error) {
    return { cachePath, details: [`cache is not valid JSON: ${String(error)}`], status: 'invalid' };
  }

  const comparison = compareRouteRuntimeManifestSemantics(live, cached);
  return {
    cachePath,
    details: comparison.details,
    status: comparison.matches ? 'fresh' : 'stale',
  };
}

export async function writeRouteRuntimeManifest(outputPath = ROUTE_MANIFEST_OUTPUT) {
  const manifest = await buildRouteRuntimeManifest();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

async function collectSyntaxCheckTargets(): Promise<string[]> {
  const targets: string[] = [];

  async function walk(directoryPath: string): Promise<void> {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(directoryPath, entry.name);
      const relativePath = relativeRepoPath(absolutePath);

      if (shouldIgnoreRepoPath(relativePath)) continue;

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!/\.(?:js|mjs)$/i.test(entry.name)) continue;
      targets.push(absolutePath);
    }
  }

  await walk(path.join(ROOT_DIR, 'public/js'));
  await walk(path.join(ROOT_DIR, 'scripts'));

  const splitCssPath = path.join(ROOT_DIR, 'split-css.js');
  try {
    await fs.access(splitCssPath);
    targets.push(splitCssPath);
  } catch {
    // Optional helper script; ignore if absent.
  }

  for (const workerPath of [path.join(ROOT_DIR, 'sw.js'), path.join(ROOT_DIR, 'public/sw.js')]) {
    try {
      await fs.access(workerPath);
      targets.push(workerPath);
    } catch {
      // Compatibility worker is optional; the root worker is checked when present.
    }
  }

  return targets.sort();
}

type SyntaxFailure = { file: string; output: string };

/**
 * Parse one shard of targets in a single child process. Resolves `null` when the
 * batch runner itself could not run (missing script, unsupported flag, crash),
 * which tells the caller to fall back to per-file `node --check` spawns.
 */
function runSyntaxCheckBatch(shard: string[]): Promise<SyntaxFailure[] | null> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['--experimental-vm-modules', '--no-warnings', SYNTAX_CHECK_BATCH_SCRIPT],
      { cwd: ROOT_DIR, stdio: ['pipe', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    let settled = false;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    const finish = (result: SyntaxFailure[] | null) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    child.once('error', () => finish(null));
    child.once('close', (status) => {
      if (status !== 0) {
        console.log(`[check] syntax batch runner unavailable (exit ${status}); falling back to node --check`);
        if (stderr.trim()) console.log(`  syntax-batch: ${normalizeSpace(stderr)}`);
        finish(null);
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as { failures: SyntaxFailure[] };
        finish(parsed.failures.map((failure) => ({
          file: relativeRepoPath(failure.file),
          output: normalizeSpace(failure.output),
        })));
      } catch {
        console.log('[check] syntax batch runner returned unreadable output; falling back to node --check');
        finish(null);
      }
    });

    child.stdin.end(shard.join('\0'));
  });
}

/** Canonical single-file `node --check`, used as the fallback path and to render failure detail. */
function checkSyntaxTargetBySpawn(absolutePath: string): Promise<SyntaxFailure | null> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--check', absolutePath], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => { stdout += chunk; });
    child.stderr?.on('data', (chunk) => { stderr += chunk; });

    const finish = (status: number | null, error: unknown = null) => {
      if (settled) return;
      settled = true;
      if (status === 0 && !error) {
        resolve(null);
        return;
      }
      resolve({
        file: relativeRepoPath(absolutePath),
        output: normalizeSpace(`${stdout}\n${stderr}\n${error ? String(error) : ''}`),
      });
    };

    child.once('error', (error) => finish(null, error));
    child.once('close', (status) => finish(status));
  });
}

/** Shard targets across processes so a large tree still spreads over cores. */
function shardSyntaxTargets(targets: string[], maxShards: number): string[][] {
  const shardCount = Math.max(1, Math.min(maxShards, Math.ceil(targets.length / SYNTAX_CHECK_BATCH_SIZE)));
  const shards: string[][] = Array.from({ length: shardCount }, () => []);
  targets.forEach((target, index) => shards[index % shardCount].push(target));
  return shards;
}

export async function runSyntaxChecks() {
  const targets = await collectSyntaxCheckTargets();
  const requestedConcurrency = Number.parseInt(process.env.SPW_SYNTAX_CHECK_CONCURRENCY || '', 10);
  const concurrency = Number.isFinite(requestedConcurrency) && requestedConcurrency > 0
    ? Math.min(requestedConcurrency, Math.max(1, targets.length))
    : Math.min(DEFAULT_SYNTAX_CHECK_CONCURRENCY, Math.max(1, targets.length));

  // Batch mode parses in-process with the same V8 parsers `node --check` uses,
  // trading ~350 process spawns for a handful. `SPW_SYNTAX_CHECK_MODE=spawn`
  // restores per-file spawns.
  if (targets.length && process.env.SPW_SYNTAX_CHECK_MODE !== 'spawn') {
    const shards = shardSyntaxTargets(targets, concurrency);
    const batched = await Promise.all(shards.map((shard) => runSyntaxCheckBatch(shard)));
    if (batched.every((result) => result !== null)) {
      // The batch parser knows *which* files fail but not where — V8 attaches no
      // position to a module parse error. Re-check just those files through
      // `node --check` so reported detail (line, caret, snippet) is unchanged.
      const flagged = batched.flat() as SyntaxFailure[];
      const detailed = await Promise.all(flagged.map(async (failure) => {
        const absolutePath = path.join(ROOT_DIR, failure.file);
        return (await checkSyntaxTargetBySpawn(absolutePath)) ?? failure;
      }));
      return {
        concurrency: shards.length,
        mode: 'batch' as const,
        failures: detailed,
        targets: targets.map(relativeRepoPath),
      };
    }
  }

  const results: Array<SyntaxFailure | null> = new Array(targets.length).fill(null);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < targets.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await checkSyntaxTargetBySpawn(targets[index]);
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const failures = results.filter((result): result is SyntaxFailure => Boolean(result));

  return { concurrency, mode: 'spawn' as const, failures, targets: targets.map(relativeRepoPath) };
}

export function runGitDiffCheck() {
  return spawnSync('git', ['diff', '--check'], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
  });
}

export async function main(): Promise<void> {
  const strictMode = process.argv.includes('--check');

  const manifest = await writeRouteRuntimeManifest();
  const { errors, warnings } = collectManifestIssues(manifest);

  console.log(`[manifest] wrote ${ROUTE_MANIFEST_OUTPUT}`);
  console.log(`[manifest] routes=${manifest.routeCount} surfaces=${Object.keys(manifest.surfaces).length} svgAssets=${manifest.maps.svgAssets.length}`);
  console.log(`[manifest] svgRoutes=${manifest.maps.svgRoutes.length} specRoutes=${manifest.maps.specRoutes.length}`);

  if (warnings.length) {
    console.log(`[manifest] warnings=${warnings.length}`);
    for (const warning of warnings.slice(0, 12)) {
      console.log(`  warn: ${warning}`);
    }
    if (warnings.length > 12) {
      console.log(`  ... ${warnings.length - 12} more warnings`);
    }
  }

  if (errors.length) {
    console.log(`[manifest] errors=${errors.length}`);
    for (const error of errors.slice(0, 12)) {
      console.log(`  error: ${error}`);
    }
    if (errors.length > 12) {
      console.log(`  ... ${errors.length - 12} more errors`);
    }
  }

  if (strictMode && errors.length) {
    process.exit(1);
  }
}
