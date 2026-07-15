/**
 * Build a public, client-loadable route search index from the live route
 * runtime contract (same census as npm run manifest).
 *
 * Enriches each route with nest path, kind, Spw geometry, and balance-physics
 * resolution motion so search can group and filter by structure.
 *
 * Output: public/data/site-search-index.json
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { buildRouteRuntimeManifest } from './typed/site-contracts/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'public/data/site-search-index.json');

/** Operator slug → Spw geometry + balance-physics resolution move + sigil. */
const OPERATOR_GEOMETRY_INDEX = Object.freeze({
  frame: { type: 'frame', sigil: '#>', geometry: 'anchor', motion: 'anchor', brace: 'objective' },
  layer: { type: 'layer', sigil: '#:', geometry: 'field-plane', motion: 'anchor', brace: 'objective' },
  baseline: { type: 'ground', sigil: '.', geometry: 'center-of-gravity', motion: 'anchor', brace: 'objective' },
  object: { type: 'integration', sigil: '^', geometry: 'lift', motion: 'lift', brace: 'objective-to-subjective' },
  ref: { type: 'potential', sigil: '~', geometry: 'thread', motion: 'tether', brace: 'objective-to-subjective' },
  probe: { type: 'wonder', sigil: '?', geometry: 'aperture', motion: 'collapse', brace: 'subjective' },
  action: { type: 'action', sigil: '!', geometry: 'discharge', motion: 'discharge', brace: 'subjective' },
  stream: { type: 'value', sigil: '*', geometry: 'mass', motion: 'lift', brace: 'objective' },
  surface: { type: 'surface', sigil: '<>', geometry: 'concept-edge', motion: 'pair', brace: 'balanced' },
  binding: { type: 'binding', sigil: '=', geometry: 'pin', motion: 'pair', brace: 'objective' },
  concept: { type: 'subject', sigil: '&', geometry: 'binding-axis', motion: 'pair', brace: 'balanced' },
  direction: { type: 'direction', sigil: '{', geometry: 'queue', motion: 'seal', brace: 'objective' },
  meta: { type: 'meta', sigil: '%%', geometry: 'ratio', motion: 'collapse', brace: 'balanced' },
  merge: { type: 'merge', sigil: '&&', geometry: 'binding-axis', motion: 'pair', brace: 'balanced' },
  normalize: { type: 'normalize', sigil: '%', geometry: 'ratio', motion: 'collapse', brace: 'balanced' },
  pragma: { type: 'pragma', sigil: '#!', geometry: 'address', motion: 'anchor', brace: 'objective' },
});

function asList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[\s|,]+/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function decodeHtmlEntities(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function nestFromRoute(route) {
  const segments = String(route || '')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    nest: segments,
    nestRoot: segments[0] || 'home',
    nestLabel: segments.length ? segments.join(' / ') : 'home',
    depth: segments.length,
  };
}

function kindFromRoute(route, nest) {
  if (route.includes('/operators/')) return 'operator';
  if (route.includes('/design/experiments/')) return 'lab';
  if (route.includes('/play/')) return 'play';
  if (route === '/' || nest.nestRoot === 'topics' && nest.depth <= 1) return 'atlas';
  if (['topics', 'about', 'blog', 'research', 'curriculum'].includes(nest.nestRoot)) return 'place';
  if (['tools', 'settings', 'services'].includes(nest.nestRoot)) return 'instrument';
  return 'route';
}

function geometryFromRoute(route, nest) {
  const opMatch = route.match(/\/operators\/([^/]+)\/?$/);
  if (opMatch) {
    const slug = opMatch[1];
    const profile = OPERATOR_GEOMETRY_INDEX[slug];
    if (profile) {
      return {
        kind: 'operator',
        operator: profile.type,
        operatorSlug: slug,
        sigil: profile.sigil,
        geometry: profile.geometry,
        motion: profile.motion,
        brace: profile.brace,
      };
    }
    return {
      kind: 'operator',
      operator: slug,
      operatorSlug: slug,
      sigil: null,
      geometry: null,
      motion: null,
      brace: null,
    };
  }

  if (route.includes('/spw/') || route.endsWith('/spw/')) {
    return {
      kind: 'atlas',
      operator: null,
      operatorSlug: null,
      sigil: '#>',
      geometry: 'anchor',
      motion: 'anchor',
      brace: 'objective',
    };
  }

  if (route.includes('/search/')) {
    return {
      kind: 'place',
      operator: 'wonder',
      operatorSlug: 'probe',
      sigil: '?',
      geometry: 'aperture',
      motion: 'collapse',
      brace: 'subjective',
    };
  }

  if (nest.nestRoot === 'design') {
    return {
      kind: 'lab',
      operator: null,
      operatorSlug: null,
      sigil: '^',
      geometry: 'lift',
      motion: 'lift',
      brace: 'objective-to-subjective',
    };
  }

  return {
    kind: kindFromRoute(route, nest),
    operator: null,
    operatorSlug: null,
    sigil: null,
    geometry: null,
    motion: null,
    brace: null,
  };
}

function buildSearchEntry(routeRecord) {
  const route = String(routeRecord.route || '').trim();
  if (!route) return null;

  const title = decodeHtmlEntities(String(routeRecord.title || route).trim());
  const surface = String(routeRecord.surface || '').trim();
  const context = String(routeRecord.context || '').trim();
  const wonder = String(routeRecord.wonder || '').trim();
  const pageFamily = String(routeRecord.pageFamily || '').trim();
  const pageRole = String(routeRecord.pageRole || '').trim();
  const routeFamily = String(routeRecord.routeFamily || '').trim();
  const features = asList(routeRecord.features);
  const relatedRoutes = asList(routeRecord.relatedRoutes);
  const layout = String(routeRecord.layout || '').trim();
  const nest = nestFromRoute(route);
  const geometry = geometryFromRoute(route, nest);
  const kind = geometry.kind || kindFromRoute(route, nest);

  const haystack = [
    title,
    route,
    surface,
    context,
    wonder,
    pageFamily,
    pageRole,
    routeFamily,
    layout,
    kind,
    nest.nestLabel,
    nest.nestRoot,
    geometry.operator,
    geometry.operatorSlug,
    geometry.sigil,
    geometry.geometry,
    geometry.motion,
    geometry.brace,
    features.join(' '),
    relatedRoutes.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    route,
    title,
    surface: surface || null,
    context: context || null,
    wonder: wonder || null,
    pageFamily: pageFamily || null,
    pageRole: pageRole || null,
    routeFamily: routeFamily || null,
    layout: layout || null,
    features,
    relatedRoutes,
    nest: nest.nest,
    nestRoot: nest.nestRoot,
    nestLabel: nest.nestLabel,
    depth: nest.depth,
    kind,
    sigil: geometry.sigil,
    operator: geometry.operator,
    operatorSlug: geometry.operatorSlug,
    geometry: geometry.geometry,
    motion: geometry.motion,
    brace: geometry.brace,
    haystack,
  };
}

export async function generateSiteSearchIndex() {
  const manifest = await buildRouteRuntimeManifest();
  const routes = (manifest.routes || [])
    .map(buildSearchEntry)
    .filter(Boolean)
    .sort((a, b) => a.route.localeCompare(b.route));

  const byNestRoot = {};
  const byKind = {};
  const byMotion = {};
  for (const entry of routes) {
    byNestRoot[entry.nestRoot] = (byNestRoot[entry.nestRoot] || 0) + 1;
    byKind[entry.kind] = (byKind[entry.kind] || 0) + 1;
    if (entry.motion) byMotion[entry.motion] = (byMotion[entry.motion] || 0) + 1;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    version: 2,
    routeCount: routes.length,
    facets: {
      nestRoots: Object.keys(byNestRoot).sort(),
      kinds: Object.keys(byKind).sort(),
      motions: Object.keys(byMotion).sort(),
      counts: { byNestRoot, byKind, byMotion },
    },
    geometryLegend: OPERATOR_GEOMETRY_INDEX,
    routes,
  };

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${JSON.stringify(payload)}\n`, 'utf8');
  return payload;
}

export async function main() {
  const payload = await generateSiteSearchIndex();
  console.log(`[search-index] wrote ${path.relative(ROOT, OUTPUT)}`);
  console.log(`[search-index] routes=${payload.routeCount} version=${payload.version}`);
  console.log(`[search-index] kinds=${payload.facets.kinds.join(',')}`);
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
