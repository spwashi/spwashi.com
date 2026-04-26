import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { renderTemplate } from '../../template.mjs';
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
export const ROUTE_MANIFEST_OUTPUT = process.env.SPW_ROUTE_MANIFEST_OUTPUT
  || path.join(process.env.TMPDIR || '/tmp', 'spwashi-route-runtime-manifest.json');

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

  if (!bodyAttributes) {
    errors.push('Missing <body> element.');
  }

  const missingBodyKeys = REQUIRED_BODY_DATA_KEYS.filter((key) => !bodyAttributes?.[`data-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`]);
  if (missingBodyKeys.length) {
    errors.push(`Missing required body data attributes: ${missingBodyKeys.join(', ')}`);
  }

  if (!stylesheets.some((href) => stripQueryHash(href) === EXPECTED_STYLESHEET_PREFIX)) {
    errors.push(`Missing shared stylesheet ${EXPECTED_STYLESHEET_PREFIX}`);
  }

  if (!moduleScripts.some((src) => stripQueryHash(src) === EXPECTED_SITE_SCRIPT_PREFIX)) {
    errors.push(`Missing shared runtime script ${EXPECTED_SITE_SCRIPT_PREFIX}`);
  }

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
    features: splitList(bodyAttributes?.['data-spw-features']),
    file: relativeFilePath,
    layout: bodyAttributes?.['data-spw-layout'] || null,
    pageFamily: bodyAttributes?.['data-spw-page-family'] || null,
    pageModes: splitList(bodyAttributes?.['data-spw-page-modes']),
    pageRole: bodyAttributes?.['data-spw-page-role'] || null,
    pageSeed: bodyAttributes?.['data-spw-page-seed'] || null,
    relatedRoutes: splitPipeList(bodyAttributes?.['data-spw-related-routes']).map(normalizeInternalRoute),
    route: routePathFromFile(relativeFilePath),
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
  const siteJs = await fs.readFile(path.join(ROOT_DIR, 'public/js/site.js'), 'utf8');
  const runtimeDefinitions = collectRuntimeDefinitionsFromSource(siteJs);
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

  return targets.sort();
}

export async function runSyntaxChecks() {
  const targets = await collectSyntaxCheckTargets();
  const failures: Array<{ file: string; output: string }> = [];

  for (const absolutePath of targets) {
    const result = spawnSync('node', ['--check', absolutePath], {
      cwd: ROOT_DIR,
      encoding: 'utf8',
    });

    if (result.status === 0) continue;

    failures.push({
      file: relativeRepoPath(absolutePath),
      output: normalizeSpace(`${result.stdout || ''}\n${result.stderr || ''}`),
    });
  }

  return { failures, targets: targets.map(relativeRepoPath) };
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
