import { promises as fs } from 'node:fs';
import path from 'node:path';
export function stripQueryHash(value) {
    return String(value || '').replace(/[?#].*$/, '');
}
export function normalizeSpace(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}
export function splitList(value) {
    return normalizeSpace(value)
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
}
export function splitPipeList(value) {
    return String(value || '')
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean);
}
export function routePathFromFile(relativeFilePath) {
    if (relativeFilePath === 'index.html')
        return '/';
    const routeDir = relativeFilePath.replace(/\/index\.html$/, '');
    return `/${routeDir}/`;
}
export function normalizeInternalRoute(value) {
    const normalized = String(value || '');
    if (!normalized || !normalized.startsWith('/'))
        return normalized;
    if (normalized === '/')
        return '/';
    if (/\.[a-z0-9]+$/i.test(normalized))
        return normalized;
    return normalized.endsWith('/') ? normalized : `${normalized}/`;
}
export function parseAttributes(tagSource) {
    const attributes = {};
    const attributePattern = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    for (const match of tagSource.matchAll(attributePattern)) {
        const [, name, doubleQuoted, singleQuoted, bareValue] = match;
        const value = doubleQuoted ?? singleQuoted ?? bareValue ?? '';
        attributes[name] = value;
    }
    return attributes;
}
export function collectTagAttributes(html, tagName) {
    const tagPattern = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
    const tags = [];
    for (const match of html.matchAll(tagPattern)) {
        tags.push(parseAttributes(match[1] || ''));
    }
    return tags;
}
export function extractBodyAttributes(html) {
    const match = html.match(/<body\b([^>]*)>/i);
    if (!match)
        return null;
    return parseAttributes(match[1] || '');
}
export function extractTitle(html) {
    const match = html.match(/<title>([\s\S]*?)<\/title>/i);
    return normalizeSpace(match?.[1] || '');
}
export function countMatches(source, pattern) {
    return [...source.matchAll(pattern)].length;
}
export function extractSvgHosts(html) {
    const hosts = [];
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
        let figureAttrs = null;
        if (figureOpen >= 0 && figureOpen > figureClose) {
            const figureTag = html.slice(figureOpen, figureHead.indexOf('>', figureOpen) + 1);
            const tagAttrs = figureTag.match(/<figure\b([^>]*)>/i);
            if (tagAttrs)
                figureAttrs = parseAttributes(tagAttrs[1] || '');
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
export function extractRuntimeArrayLiteral(source, arrayName) {
    // Prefer export const (module-catalog.js); fall back to const (legacy site.js embeds).
    const markers = [`export const ${arrayName} = [`, `const ${arrayName} = [`];
    let startIndex = -1;
    for (const candidate of markers) {
        startIndex = source.indexOf(candidate);
        if (startIndex >= 0)
            break;
    }
    if (startIndex < 0)
        return '';
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
        // Skip comments before string detection: an apostrophe in a prose comment
        // ("a reader's Spw") would otherwise open a string that never closes and
        // silently swallow the rest of the catalog family.
        if (char === '/' && source[index + 1] === '/') {
            const lineEnd = source.indexOf('\n', index);
            if (lineEnd < 0)
                break;
            index = lineEnd;
            continue;
        }
        if (char === '/' && source[index + 1] === '*') {
            const blockEnd = source.indexOf('*/', index + 2);
            if (blockEnd < 0)
                break;
            index = blockEnd + 1;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringQuote = char;
            continue;
        }
        if (char === '[')
            depth += 1;
        if (char === ']')
            depth -= 1;
        if (depth === 0) {
            return source.slice(bracketStart, index + 1);
        }
    }
    return '';
}
export function extractObjectLiterals(arrayLiteral) {
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
            if (depth === 0)
                objectStart = index;
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
export function parseRouteList(value) {
    if (!value)
        return [];
    const arrayMatch = value.match(/route:\s*\[([^\]]+)\]/);
    if (arrayMatch) {
        return [...arrayMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
    }
    const singleMatch = value.match(/route:\s*'([^']+)'/);
    return singleMatch ? [singleMatch[1]] : [];
}
export function parseRuntimeDefinition(objectLiteral, family) {
    const id = objectLiteral.match(/id:\s*'([^']+)'/)?.[1] || '';
    const layer = objectLiteral.match(/layer:\s*MODULE_LAYERS\.([A-Z_]+)/)?.[1]?.toLowerCase() || family.toLowerCase();
    const when = objectLiteral.match(/when:\s*MOUNT_WHEN\.([A-Z_]+)/)?.[1]?.toLowerCase() || 'immediate';
    const selector = objectLiteral.match(/selector:\s*'([^']+)'/)?.[1] || null;
    const rootMode = objectLiteral.match(/rootMode:\s*'([^']+)'/)?.[1] || null;
    const importPath = objectLiteral.match(/import\(\s*['"]([^'"]+)['"]\s*\)/)?.[1] || null;
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
/** Family files under public/js/runtime/ — catalog barrel re-exports these. */
export const MODULE_CATALOG_FAMILY_FILES = Object.freeze({
    CORE_DEFS: 'module-catalog-core.js',
    FEATURE_DEFS: 'module-catalog-feature.js',
    REGION_DEFS: 'module-catalog-region.js',
    ENHANCEMENT_DEFS: 'module-catalog-enhancement.js',
});
/**
 * Concatenate family sources so extractRuntimeArrayLiteral still finds
 * `export const *_DEFS = […]` after the catalog split.
 */
export async function readModuleCatalogSource(runtimeDir) {
    const parts = await Promise.all(Object.values(MODULE_CATALOG_FAMILY_FILES).map((file) => fs.readFile(path.join(runtimeDir, file), 'utf8')));
    return parts.join('\n');
}
/**
 * Parse staged module defs from catalog (or any source that still uses const *_DEFS = […]).
 * Families live in module-catalog-*.js; pass concatenated source from readModuleCatalogSource().
 */
export function collectRuntimeDefinitionsFromSource(catalogSource) {
    const families = ['CORE_DEFS', 'FEATURE_DEFS', 'REGION_DEFS', 'ENHANCEMENT_DEFS'];
    const runtime = {};
    for (const family of families) {
        const arrayLiteral = extractRuntimeArrayLiteral(catalogSource, family);
        runtime[family] = extractObjectLiterals(arrayLiteral).map((objectLiteral) => parseRuntimeDefinition(objectLiteral, family));
    }
    return {
        coreModules: runtime.CORE_DEFS || [],
        enhancementModules: runtime.ENHANCEMENT_DEFS || [],
        featureModules: runtime.FEATURE_DEFS || [],
        regionModules: runtime.REGION_DEFS || [],
    };
}
export function deriveRouteRuntime(routeEntry, runtimeDefinitions) {
    const surface = routeEntry.surface;
    const routeSpecificFeatures = runtimeDefinitions.featureModules.filter((definition) => {
        if (!definition.route.length)
            return true;
        return definition.route.includes(surface || '');
    });
    return {
        coreModules: runtimeDefinitions.coreModules.map((definition) => definition.id),
        enhancementModules: runtimeDefinitions.enhancementModules.map((definition) => definition.id),
        featureModules: routeSpecificFeatures,
        regionModules: runtimeDefinitions.regionModules.map((definition) => definition.id),
    };
}
export function summarizeBySurface(routes) {
    const summary = {};
    for (const route of routes) {
        const surface = route.surface || 'unknown';
        summary[surface] = (summary[surface] || 0) + 1;
    }
    return Object.fromEntries(Object.entries(summary).sort(([left], [right]) => left.localeCompare(right)));
}
export function buildSvgSpecMaps(routes, svgAssets) {
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
    const svgHosts = [];
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
export function collectManifestIssues(manifest) {
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
