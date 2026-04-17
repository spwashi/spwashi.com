import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const ROUTE_MANIFEST_OUTPUT = process.env.SPW_ROUTE_MANIFEST_OUTPUT
  || path.join(process.env.TMPDIR || '/tmp', 'spwashi-route-runtime-manifest.json');

const IGNORED_SEGMENTS = new Set([
  '.agents',
  '.git',
  '.idea',
  '.spw',
  '00.unsorted',
  'node_modules',
]);

const REQUIRED_BODY_DATA_KEYS = Object.freeze([
  'spwSurface',
  'spwFeatures',
  'spwRouteFamily',
  'spwContext',
  'spwWonder',
  'spwPageFamily',
  'spwPageModes',
  'spwPageRole',
]);

const EXPECTED_STYLESHEET_PREFIX = '/public/css/style.css';
const EXPECTED_SITE_SCRIPT_PREFIX = '/public/js/site.js';

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function stripQueryHash(value) {
  return String(value || '').replace(/[?#].*$/, '');
}

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function splitList(value) {
  return normalizeSpace(value)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitPipeList(value) {
  return String(value || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function relativeRepoPath(absolutePath) {
  return toPosixPath(path.relative(ROOT_DIR, absolutePath));
}

function routePathFromFile(relativeFilePath) {
  if (relativeFilePath === 'index.html') return '/';
  const routeDir = relativeFilePath.replace(/\/index\.html$/, '');
  return `/${routeDir}/`;
}

function normalizeInternalRoute(value) {
  if (!value || !value.startsWith('/')) return value;
  if (value === '/') return '/';
  if (/\.[a-z0-9]+$/i.test(value)) return value;
  return value.endsWith('/') ? value : `${value}/`;
}

function repoPathFromRootRelative(rootRelativePath) {
  const cleanPath = stripQueryHash(rootRelativePath).replace(/^\/+/, '');
  return path.join(ROOT_DIR, cleanPath);
}

function parseAttributes(tagSource) {
  const attributes = {};
  const attributePattern = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of tagSource.matchAll(attributePattern)) {
    const [, name, doubleQuoted, singleQuoted, bareValue] = match;
    const value = doubleQuoted ?? singleQuoted ?? bareValue ?? '';
    attributes[name] = value;
  }

  return attributes;
}

function collectTagAttributes(html, tagName) {
  const tagPattern = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
  const tags = [];

  for (const match of html.matchAll(tagPattern)) {
    tags.push(parseAttributes(match[1] || ''));
  }

  return tags;
}

function extractBodyAttributes(html) {
  const match = html.match(/<body\b([^>]*)>/i);
  if (!match) return null;
  return parseAttributes(match[1] || '');
}

function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return normalizeSpace(match?.[1] || '');
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function extractRuntimeArrayLiteral(source, arrayName) {
  const marker = `const ${arrayName} = [`;
  const startIndex = source.indexOf(marker);
  if (startIndex < 0) return '';

  const bracketStart = source.indexOf('[', startIndex);
  let depth = 0;
  let inString = false;
  let stringQuote = '';
  let escaped = false;

  for (let index = bracketStart; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === stringQuote) {
        inString = false;
        stringQuote = '';
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;

    if (depth === 0) {
      return source.slice(bracketStart, index + 1);
    }
  }

  return '';
}

function extractObjectLiterals(arrayLiteral) {
  const objects = [];
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let stringQuote = '';
  let escaped = false;

  for (let index = 0; index < arrayLiteral.length; index += 1) {
    const char = arrayLiteral[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === stringQuote) {
        inString = false;
        stringQuote = '';
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === '{') {
      if (depth === 0) objectStart = index;
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
        objects.push(arrayLiteral.slice(objectStart, index + 1));
        objectStart = -1;
      }
    }
  }

  return objects;
}

function parseRouteList(value) {
  if (!value) return [];
  const arrayMatch = value.match(/route:\s*\[([^\]]+)\]/);
  if (arrayMatch) {
    return [...arrayMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  }

  const singleMatch = value.match(/route:\s*'([^']+)'/);
  return singleMatch ? [singleMatch[1]] : [];
}

function parseRuntimeDefinition(objectLiteral, family) {
  const id = objectLiteral.match(/id:\s*'([^']+)'/)?.[1] || '';
  const layer = objectLiteral.match(/layer:\s*MODULE_LAYERS\.([A-Z_]+)/)?.[1]?.toLowerCase() || family.toLowerCase();
  const when = objectLiteral.match(/when:\s*MOUNT_WHEN\.([A-Z_]+)/)?.[1]?.toLowerCase() || 'immediate';
  const selector = objectLiteral.match(/selector:\s*'([^']+)'/)?.[1] || null;
  const rootMode = objectLiteral.match(/rootMode:\s*'([^']+)'/)?.[1] || null;
  const importPath = objectLiteral.match(/import\('([^']+)'\)/)?.[1] || null;
  const route = parseRouteList(objectLiteral);

  return {
    id,
    importPath,
    layer,
    rootMode,
    route,
    selector,
    when,
  };
}

async function collectRuntimeDefinitions() {
  const siteJs = await fs.readFile(path.join(ROOT_DIR, 'public/js/site.js'), 'utf8');
  const families = ['CORE_DEFS', 'FEATURE_DEFS', 'REGION_DEFS', 'ENHANCEMENT_DEFS'];
  const runtime = {};

  for (const family of families) {
    const arrayLiteral = extractRuntimeArrayLiteral(siteJs, family);
    runtime[family] = extractObjectLiterals(arrayLiteral).map((objectLiteral) => parseRuntimeDefinition(objectLiteral, family));
  }

  return {
    coreModules: runtime.CORE_DEFS,
    featureModules: runtime.FEATURE_DEFS,
    regionModules: runtime.REGION_DEFS,
    enhancementModules: runtime.ENHANCEMENT_DEFS,
  };
}

async function walkForRouteFiles(directoryPath, results = []) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    const relativePath = relativeRepoPath(absolutePath);
    const firstSegment = relativePath.split('/')[0];

    if (IGNORED_SEGMENTS.has(firstSegment)) continue;

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

async function walkForFilesByExtension(directoryPath, extension, results = []) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    const relativePath = relativeRepoPath(absolutePath);
    const firstSegment = relativePath.split('/')[0];

    if (IGNORED_SEGMENTS.has(firstSegment)) continue;

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

async function parseRouteFile(absoluteFilePath) {
  const relativeFilePath = relativeRepoPath(absoluteFilePath);
  const html = await fs.readFile(absoluteFilePath, 'utf8');
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

  const errors = [];
  const warnings = [];

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
      inlineCount: countMatches(html, /<svg\b/gi),
      surfaceCount: countMatches(html, /\bclass=["'][^"']*\bspw-svg-surface\b[^"']*["']/gi),
    },
  };
}

function deriveRouteRuntime(routeEntry, runtimeDefinitions) {
  const surface = routeEntry.surface;
  const routeSpecificFeatures = runtimeDefinitions.featureModules.filter((definition) => {
    if (!definition.route.length) return true;
    return definition.route.includes(surface);
  });

  return {
    coreModules: runtimeDefinitions.coreModules.map((definition) => definition.id),
    enhancementModules: runtimeDefinitions.enhancementModules.map((definition) => definition.id),
    featureModules: routeSpecificFeatures,
    regionModules: runtimeDefinitions.regionModules.map((definition) => definition.id),
  };
}

function summarizeBySurface(routes) {
  const summary = {};

  for (const route of routes) {
    const surface = route.surface || 'unknown';
    summary[surface] = (summary[surface] || 0) + 1;
  }

  return Object.fromEntries(Object.entries(summary).sort(([left], [right]) => left.localeCompare(right)));
}

function buildSvgSpecMaps(routes, svgAssets) {
  const svgRoutes = routes
    .filter((route) => route.svg.featureEnabled || route.svg.inlineCount > 0 || route.svg.figureCount > 0)
    .map((route) => ({
      featureEnabled: route.svg.featureEnabled,
      figureCount: route.svg.figureCount,
      inlineCount: route.svg.inlineCount,
      route: route.route,
      surface: route.surface,
      surfaceCount: route.svg.surfaceCount,
      title: route.title,
    }));

  const specRoutes = routes
    .filter((route) => route.spec.stripCount > 0 || route.spec.pillCount > 0 || route.spec.gridCount > 0 || route.spec.kickerCount > 0)
    .map((route) => ({
      gridCount: route.spec.gridCount,
      kickerCount: route.spec.kickerCount,
      pillCount: route.spec.pillCount,
      route: route.route,
      stripCount: route.spec.stripCount,
      surface: route.surface,
      title: route.title,
    }));

  return {
    specRoutes,
    svgAssets,
    svgRoutes,
  };
}

function collectManifestIssues(manifest) {
  const errors = [];
  const warnings = [];

  for (const route of manifest.routes) {
    for (const error of route.errors) {
      errors.push(`${route.route}: ${error}`);
    }
    for (const warning of route.warnings) {
      warnings.push(`${route.route}: ${warning}`);
    }
  }

  return { errors, warnings };
}

async function buildRouteRuntimeManifest() {
  const routeFiles = await walkForRouteFiles(ROOT_DIR);
  const parsedRoutes = await Promise.all(routeFiles.map((filePath) => parseRouteFile(filePath)));
  const runtimeDefinitions = await collectRuntimeDefinitions();
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

async function writeRouteRuntimeManifest(outputPath = ROUTE_MANIFEST_OUTPUT) {
  const manifest = await buildRouteRuntimeManifest();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

async function collectSyntaxCheckTargets() {
  const targets = [];

  async function walk(directoryPath) {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(directoryPath, entry.name);
      const relativePath = relativeRepoPath(absolutePath);
      const firstSegment = relativePath.split('/')[0];

      if (IGNORED_SEGMENTS.has(firstSegment)) continue;

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

async function runSyntaxChecks() {
  const targets = await collectSyntaxCheckTargets();
  const failures = [];

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

function runGitDiffCheck() {
  return spawnSync('git', ['diff', '--check'], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
  });
}

export {
  ROOT_DIR,
  ROUTE_MANIFEST_OUTPUT,
  buildRouteRuntimeManifest,
  collectManifestIssues,
  runGitDiffCheck,
  runSyntaxChecks,
  writeRouteRuntimeManifest,
};
