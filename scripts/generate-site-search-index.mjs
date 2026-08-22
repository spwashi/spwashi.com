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
import { COMPONENT_FIXTURES } from '../public/js/kernel/component-fixtures.js';
import { REGION_ECOLOGY_FIXTURES } from '../public/js/kernel/region-ecology-fixtures.js';
import { componentSearchEntries } from './lib/visual-capture-plan.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'public/data/site-search-index.json');

/** Canonical types match public/js/kernel/operator-detection.js. Slug aliases keep old /operators/:slug routes searchable. */
const OPERATOR_GEOMETRY_INDEX = Object.freeze({
  frame: { type: 'frame', sigil: '#>', geometry: 'anchor', motion: 'anchor', brace: 'objective' },
  layer: { type: 'layer', sigil: '#:', geometry: 'field-plane', motion: 'anchor', brace: 'objective' },
  vibration: { type: 'vibration', sigil: '#', geometry: 'frequency-anchor', motion: 'anchor', brace: 'objective' },
  ground: { type: 'ground', sigil: '.', geometry: 'center-of-gravity', motion: 'anchor', brace: 'objective' },
  baseline: { type: 'ground', sigil: '.', geometry: 'center-of-gravity', motion: 'anchor', brace: 'objective' },
  integration: { type: 'integration', sigil: '^', geometry: 'lift', motion: 'lift', brace: 'objective-to-subjective' },
  object: { type: 'integration', sigil: '^', geometry: 'lift', motion: 'lift', brace: 'objective-to-subjective' },
  potential: { type: 'potential', sigil: '~', geometry: 'thread', motion: 'tether', brace: 'objective-to-subjective' },
  ref: { type: 'potential', sigil: '~', geometry: 'thread', motion: 'tether', brace: 'objective-to-subjective' },
  wonder: { type: 'wonder', sigil: '?', geometry: 'aperture', motion: 'collapse', brace: 'subjective' },
  probe: { type: 'wonder', sigil: '?', geometry: 'aperture', motion: 'collapse', brace: 'subjective' },
  perspective: { type: 'perspective', sigil: '@', geometry: 'coordinate-origin', motion: 'situate', brace: 'subjective-to-objective' },
  value: { type: 'value', sigil: '*', geometry: 'mass', motion: 'lift', brace: 'objective' },
  stream: { type: 'value', sigil: '*', geometry: 'mass', motion: 'lift', brace: 'objective' },
  subject: { type: 'subject', sigil: '&', geometry: 'binding-axis', motion: 'pair', brace: 'balanced' },
  concept: { type: 'concept', sigil: '<', geometry: 'opening-edge', motion: 'pair', brace: 'balanced' },
  'concept-edge': { type: 'concept-edge', sigil: '>', geometry: 'closing-edge', motion: 'pair', brace: 'balanced' },
  surface: { type: 'concept-edge', sigil: '>', geometry: 'closing-edge', motion: 'pair', brace: 'balanced' },
  binding: { type: 'binding', sigil: '=', geometry: 'pin', motion: 'pair', brace: 'objective' },
  substrate: { type: 'substrate', sigil: '$', geometry: 'support-plane', motion: 'anchor', brace: 'objective' },
  normalize: { type: 'normalize', sigil: '%', geometry: 'ratio', motion: 'collapse', brace: 'balanced' },
  action: { type: 'action', sigil: '!', geometry: 'impulse', motion: 'discharge', brace: 'subjective-to-objective' },
  pragma: { type: 'action', sigil: '!', geometry: 'impulse', motion: 'discharge', brace: 'subjective-to-objective' },
  scene: { type: 'scene', sigil: '(', geometry: 'scene-plane', motion: 'encapsulate', brace: 'subjective' },
  mode: { type: 'mode', sigil: '[', geometry: 'coordinate-choice', motion: 'snap', brace: 'balanced' },
  direction: { type: 'direction', sigil: '{', geometry: 'brace-container', motion: 'seal', brace: 'objective-to-subjective' },
});

const HANDLE_PREFIXES = ['#>', '#:', '#', '.', '^', '~', '?', '@', '*', '&', '=', '$', '%', '!', '>', '<', '(', '[', '{'];

function decodeChipText(value = '') {
  return decodeHtmlEntities(String(value || ''))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function prefixFromHandle(text = '') {
  const value = decodeChipText(text);
  return HANDLE_PREFIXES.find((prefix) => value.startsWith(prefix)) || '';
}

function harvestRouteHandles(html = '') {
  const handles = new Set();
  const operators = new Set();
  /* Frequency, not just presence. A set of operator names says which sigils a
     page uses at all; counts say which one the page is actually built around,
     which is what geometry resolution needs to pick a character for the route. */
  const operatorCounts = new Map();
  const tally = (type) => {
    if (!type) return;
    operators.add(type);
    operatorCounts.set(type, (operatorCounts.get(type) || 0) + 1);
  };

  const pattern = /<(a|button|span)([^>]*\bclass=["'][^"']*\b(?:operator-chip|frame-sigil|frame-card-sigil)\b[^"']*["'][^>]*)>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const text = decodeChipText(match[3]);
    const prefix = prefixFromHandle(text);
    if (!text || !prefix) continue;
    handles.add(text.slice(0, 80));
    const profile = Object.values(OPERATOR_GEOMETRY_INDEX).find((item) => item.sigil === prefix);
    tally(profile?.type);
    const attr = match[2].match(/data-spw-operator=["']([^"']+)["']/);
    tally(attr?.[1]);
  }
  return {
    handles: [...handles].slice(0, 48),
    operators: [...operators],
    operatorCounts,
    ...harvestRouteExpressions(html),
  };
}

function harvestRouteExpressions(html = '') {
  const expressions = [];
  const expressionHosts = {};
  const pattern = /<([a-zA-Z][\w-]*)([^>]*\bdata-spw-semantic-expression=["']([^"']+)["'][^>]*)>/g;
  let match;
  while ((match = pattern.exec(html))) {
    const value = decodeHtmlEntities(match[3]).trim().slice(0, 120);
    if (!value) continue;
    if (!expressions.includes(value)) expressions.push(value);
    if (!expressionHosts[value]) {
      const id = (match[2].match(/\bid=["']([^"']+)["']/) || [])[1] || '';
      if (id) expressionHosts[value] = id;
    }
  }
  return {
    expressions: expressions.slice(0, 80),
    expressionHosts,
  };
}

/**
 * Geometry read off what a page is made of, for the 72% of routes whose path
 * matches none of the special cases in geometryFromRoute.
 *
 * Those routes were previously indexed with null geometry, motion, sigil and
 * brace — searchable by title and text, invisible to any query that groups by
 * structure. The information was already being collected two functions up: the
 * operator chips and frame sigils in the page's own markup. This resolves the
 * operator a route leans on hardest and lets the route inherit its character.
 *
 * Ties break toward the operator that appears first, which is document order,
 * which in practice is the hero's frame sigil — the page's opening claim about
 * what it is.
 */
function geometryFromOperators(operatorCounts) {
  if (!operatorCounts || !operatorCounts.size) return null;

  let bestType = '';
  let bestCount = 0;
  for (const [type, count] of operatorCounts) {
    if (count > bestCount) {
      bestType = type;
      bestCount = count;
    }
  }
  if (!bestType) return null;

  const profile = OPERATOR_GEOMETRY_INDEX[bestType]
    || Object.values(OPERATOR_GEOMETRY_INDEX).find((item) => item.type === bestType);
  if (!profile) return null;

  return {
    operator: profile.type,
    operatorSlug: bestType,
    sigil: profile.sigil,
    geometry: profile.geometry,
    motion: profile.motion,
    brace: profile.brace,
  };
}

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

function buildSearchEntry(routeRecord, harvested = { handles: [], operators: [] }) {
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
  const routeGeometry = geometryFromRoute(route, nest);
  const kind = routeGeometry.kind || kindFromRoute(route, nest);

  /* Path patterns win when they match — they encode intent about what a route
     is for. Only when they resolve nothing does the route inherit geometry from
     the operators its own markup leans on. geometrySource records which of the
     two answered, so a null geometry now means "this page declares no operator
     at all" rather than "the generator had no rule for this path". */
  const harvestedGeometry = routeGeometry.geometry
    ? null
    : geometryFromOperators(harvested.operatorCounts);
  const geometry = harvestedGeometry ? { ...routeGeometry, ...harvestedGeometry } : routeGeometry;
  const geometrySource = routeGeometry.geometry
    ? 'route'
    : (harvestedGeometry ? 'harvest' : null);

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
    harvested.handles.join(' '),
    harvested.operators.join(' '),
    (harvested.expressions || []).join(' '),
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
    geometrySource,
    handles: harvested.handles,
    operators: harvested.operators,
    expressions: harvested.expressions || [],
    expressionHosts: harvested.expressionHosts || {},
    brace: geometry.brace,
    haystack,
  };
}

export async function generateSiteSearchIndex() {
  const manifest = await buildRouteRuntimeManifest();
  const components = componentSearchEntries({
    componentFixtures: COMPONENT_FIXTURES,
    ecologyFixtures: REGION_ECOLOGY_FIXTURES,
  });
  const routes = [];
  for (const record of manifest.routes || []) {
    let harvested = { handles: [], operators: [], expressions: [], expressionHosts: {} };
    if (record.file) {
      try {
        const html = await fs.readFile(path.join(ROOT, record.file), 'utf8');
        harvested = harvestRouteHandles(html);
      } catch {
        harvested = { handles: [], operators: [], expressions: [], expressionHosts: {} };
      }
    }
    const entry = buildSearchEntry(record, harvested);
    if (entry) {
      const extras = components.filter((item) => item.route.split('#')[0] === record.route);
      if (extras.length) {
        entry.haystack = `${entry.haystack} ${extras.map((item) => item.haystack).join(' ')}`.trim();
        entry.componentIds = extras.map((item) => item.componentId);
      }
      routes.push(entry);
    }
  }
  routes.sort((a, b) => a.route.localeCompare(b.route));

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
    componentCount: components.length,
    facets: {
      nestRoots: Object.keys(byNestRoot).sort(),
      kinds: Object.keys(byKind).sort(),
      motions: Object.keys(byMotion).sort(),
      counts: { byNestRoot, byKind, byMotion, components: components.length },
    },
    components,
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
  console.log(`[search-index] kinds=${payload.facets.kinds.join(',')} components=${payload.componentCount}`);
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
