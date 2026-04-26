import type {
  RuntimeDefinition,
  SvgHost,
  SvgHostWithRoute,
  RouteSpecSummary,
  SvgRouteSummary,
  ManifestRoute,
  RouteRuntimeManifest,
} from './types.mjs';

export function stripQueryHash(value: unknown): string {
  return String(value || '').replace(/[?#].*$/, '');
}

export function normalizeSpace(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function splitList(value: unknown): string[] {
  return normalizeSpace(value)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitPipeList(value: unknown): string[] {
  return String(value || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function routePathFromFile(relativeFilePath: string): string {
  if (relativeFilePath === 'index.html') return '/';
  const routeDir = relativeFilePath.replace(/\/index\.html$/, '');
  return `/${routeDir}/`;
}

export function normalizeInternalRoute(value: unknown): string {
  const normalized = String(value || '');
  if (!normalized || !normalized.startsWith('/')) return normalized;
  if (normalized === '/') return '/';
  if (/\.[a-z0-9]+$/i.test(normalized)) return normalized;
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export function parseAttributes(tagSource: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of tagSource.matchAll(attributePattern)) {
    const [, name, doubleQuoted, singleQuoted, bareValue] = match;
    const value = doubleQuoted ?? singleQuoted ?? bareValue ?? '';
    attributes[name] = value;
  }

  return attributes;
}

export function collectTagAttributes(html: string, tagName: string): Record<string, string>[] {
  const tagPattern = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
  const tags: Record<string, string>[] = [];

  for (const match of html.matchAll(tagPattern)) {
    tags.push(parseAttributes(match[1] || ''));
  }

  return tags;
}

export function extractBodyAttributes(html: string): Record<string, string> | null {
  const match = html.match(/<body\b([^>]*)>/i);
  if (!match) return null;
  return parseAttributes(match[1] || '');
}

export function extractTitle(html: string): string {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return normalizeSpace(match?.[1] || '');
}

export function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}

export function extractSvgHosts(html: string): SvgHost[] {
  const hosts: SvgHost[] = [];
  const svgPattern = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/gi;

  for (const match of html.matchAll(svgPattern)) {
    const attrs = parseAttributes(match[1] || '');
    const svgInner = match[2] || '';
    const classList = splitList(attrs.class);
    const hasSurfaceClass = classList.includes('spw-svg-surface');
    const surfaceVariant = classList
      .filter((name) => name.startsWith('spw-svg-surface--'))
      .map((name) => name.replace('spw-svg-surface--', ''))[0] || null;

    const figureHead = html.slice(0, match.index);
    const figureOpen = figureHead.lastIndexOf('<figure');
    const figureClose = figureHead.lastIndexOf('</figure');
    let figureAttrs: Record<string, string> | null = null;
    if (figureOpen >= 0 && figureOpen > figureClose) {
      const figureTag = html.slice(figureOpen, figureHead.indexOf('>', figureOpen) + 1);
      const tagAttrs = figureTag.match(/<figure\b([^>]*)>/i);
      if (tagAttrs) figureAttrs = parseAttributes(tagAttrs[1] || '');
    }

    const figureClasses = figureAttrs ? splitList(figureAttrs.class) : [];
    const hasFigureContract = figureClasses.includes('spw-svg-figure');
    const hostId = figureAttrs?.['data-spw-svg-host'] || attrs['data-spw-svg-host'] || null;

    hosts.push({
      class: attrs.class || null,
      companion: figureAttrs?.['data-spw-svg-companion']
        || attrs['data-spw-svg-companion']
        || null,
      hasDesc: /<desc\b/i.test(svgInner),
      hasFigureContract,
      hasSurfaceClass,
      hasTitle: /<title\b/i.test(svgInner),
      hostId,
      kind: figureAttrs?.['data-spw-svg-kind']
        || attrs['data-spw-svg-kind']
        || null,
      motion: figureAttrs?.['data-spw-svg-motion']
        || attrs['data-spw-svg-motion']
        || null,
      role: attrs.role || null,
      scale: figureAttrs?.['data-spw-svg-scale']
        || attrs['data-spw-svg-scale']
        || null,
      surfaceVariant,
      viewBox: attrs.viewBox || attrs.viewbox || null,
    });
  }

  return hosts;
}

export function extractRuntimeArrayLiteral(source: string, arrayName: string): string {
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

export function extractObjectLiterals(arrayLiteral: string): string[] {
  const objects: string[] = [];
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

export function parseRouteList(value: string): string[] {
  if (!value) return [];
  const arrayMatch = value.match(/route:\s*\[([^\]]+)\]/);
  if (arrayMatch) {
    return [...arrayMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  }

  const singleMatch = value.match(/route:\s*'([^']+)'/);
  return singleMatch ? [singleMatch[1]] : [];
}

export function parseRuntimeDefinition(objectLiteral: string, family: string): RuntimeDefinition {
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

export function collectRuntimeDefinitionsFromSource(siteJs: string): RouteRuntimeManifest['runtimeDefinitions'] {
  const families = ['CORE_DEFS', 'FEATURE_DEFS', 'REGION_DEFS', 'ENHANCEMENT_DEFS'] as const;
  const runtime: Partial<Record<(typeof families)[number], RuntimeDefinition[]>> = {};

  for (const family of families) {
    const arrayLiteral = extractRuntimeArrayLiteral(siteJs, family);
    runtime[family] = extractObjectLiterals(arrayLiteral).map((objectLiteral) => parseRuntimeDefinition(objectLiteral, family));
  }

  return {
    coreModules: runtime.CORE_DEFS || [],
    enhancementModules: runtime.ENHANCEMENT_DEFS || [],
    featureModules: runtime.FEATURE_DEFS || [],
    regionModules: runtime.REGION_DEFS || [],
  };
}

export function deriveRouteRuntime(
  routeEntry: { surface: string | null },
  runtimeDefinitions: RouteRuntimeManifest['runtimeDefinitions'],
): NonNullable<ManifestRoute['runtime']> {
  const surface = routeEntry.surface;
  const routeSpecificFeatures = runtimeDefinitions.featureModules.filter((definition) => {
    if (!definition.route.length) return true;
    return definition.route.includes(surface || '');
  });

  return {
    coreModules: runtimeDefinitions.coreModules.map((definition) => definition.id),
    enhancementModules: runtimeDefinitions.enhancementModules.map((definition) => definition.id),
    featureModules: routeSpecificFeatures,
    regionModules: runtimeDefinitions.regionModules.map((definition) => definition.id),
  };
}

export function summarizeBySurface(routes: Array<{ surface: string | null }>): Record<string, number> {
  const summary: Record<string, number> = {};

  for (const route of routes) {
    const surface = route.surface || 'unknown';
    summary[surface] = (summary[surface] || 0) + 1;
  }

  return Object.fromEntries(Object.entries(summary).sort(([left], [right]) => left.localeCompare(right)));
}

export function buildSvgSpecMaps(
  routes: Array<{
    route: string;
    surface: string | null;
    title: string;
    spec: { stripCount: number; pillCount: number; gridCount: number; kickerCount: number };
    svg: {
      featureEnabled: boolean;
      inlineCount: number;
      figureCount: number;
      hosts: SvgHost[];
      surfaceCount: number;
    };
  }>,
  svgAssets: string[],
): RouteRuntimeManifest['maps'] {
  const svgRoutes = routes
    .filter((route) => route.svg.featureEnabled || route.svg.inlineCount > 0 || route.svg.figureCount > 0)
    .map((route) => ({
      featureEnabled: route.svg.featureEnabled,
      figureCount: route.svg.figureCount,
      hostCount: route.svg.hosts.length,
      inlineCount: route.svg.inlineCount,
      route: route.route,
      surface: route.surface,
      surfaceCount: route.svg.surfaceCount,
      title: route.title,
    }));

  const svgHosts: SvgHostWithRoute[] = [];
  for (const route of routes) {
    for (const host of route.svg.hosts) {
      svgHosts.push({
        ...host,
        route: route.route,
        surface: route.surface,
      });
    }
  }

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
    svgHosts,
    svgRoutes,
  };
}

export function collectManifestIssues(manifest: { routes: Array<{ route: string; errors: string[]; warnings: string[] }> }): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

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
