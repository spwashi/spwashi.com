import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { stripQueryHash } from './site-contracts/helpers.mjs';
import { toPosixPath } from './shared/build-topology.mjs';

const ROOT_DIR = path.resolve(import.meta.dirname, '..', '..');
const STYLE_CORE_MANIFEST = path.join(ROOT_DIR, 'public/css/style-core.css');
const STYLE_MANIFEST = path.join(ROOT_DIR, 'public/css/style.css');

export const EXPECTED_LAYER_ORDER =
  'reset, tokens, shell, typography, grammar, components, systems, routes, handles, effects, ornament';

export type CssImportRef = {
  file: string;
  layer: string | null;
  external: boolean;
};

export type ScopedStylesheet = {
  href: string;
  kind: 'core' | 'route' | 'behavior' | 'full';
  scope?: string;
};

/** CSS files gated by body[data-spw-features~="..."]. */
export const BEHAVIOR_SCOPES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  console: [
    '/public/css/components/cauldron.css',
  ],
  'feature-discovery': [
    '/public/css/systems/feature-discovery.css',
  ],
  'media-publishing': [
    '/public/css/components/promo-wonder-cycle.css',
  ],
  'pretext-lab': [
    '/public/css/components/pretext.css',
    '/public/css/systems/pretext-physics.css',
  ],
  'rpg-gameplay': [
    '/public/css/systems/surfaces/rpg.css',
  ],
  'svg-surfaces': [
    '/public/css/systems/svg-surfaces.css',
    '/public/css/systems/svg-personas.css',
  ],
  metrics: [
    '/public/css/handles/metrics.css',
  ],
});

/**
 * Route personality keyed by data-spw-surface.
 * Surfaces without files still pay core + behavior bundles only when scoped.
 */
export const ROUTE_SCOPES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  about: [
    '/public/css/routes/surfaces/about.css',
    '/public/css/routes/widgets/boonhonk-mixer.css',
  ],
  blog: [
    '/public/css/routes/surfaces/blog.css',
    '/public/css/routes/surfaces/blog-frames.css',
    '/public/css/routes/surfaces/blog-layouts.css',
    '/public/css/routes/surfaces/blog-motion.css',
  ],
  care: [],
  cards: [],
  contact: ['/public/css/routes/surfaces/contact.css'],
  coordination: [],
  craft: ['/public/css/routes/surfaces/craft.css'],
  curriculum: [],
  home: [
    '/public/css/routes/surfaces/home.css',
    '/public/css/routes/surfaces/home-panels.css',
  ],
  membership: [],
  newyear: [],
  now: [],
  offline: [],
  plans: [
    '/public/css/routes/surfaces/plans.css',
    '/public/css/routes/surfaces/plans-cards.css',
    '/public/css/routes/surfaces/plans-relationships.css',
    '/public/css/routes/surfaces/plans-responsive.css',
  ],
  play: ['/public/css/routes/surfaces/play.css'],
  privacy: [],
  recipes: ['/public/css/routes/surfaces/recipes.css'],
  research: [],
  'rpg-wednesday': [
    '/public/css/routes/surfaces/play.css',
    '/public/css/routes/surfaces/rpg-wednesday.css',
  ],
  services: ['/public/css/routes/surfaces/services.css'],
  'services-care': ['/public/css/routes/surfaces/services.css'],
  'services-creator': ['/public/css/routes/surfaces/services.css'],
  'services-ecosystem': ['/public/css/routes/surfaces/services.css'],
  'services-systems': ['/public/css/routes/surfaces/services.css'],
  settings: [
    '/public/css/routes/surfaces/settings.css',
    '/public/css/routes/surfaces/settings-forms.css',
    '/public/css/routes/surfaces/settings-notes.css',
    '/public/css/routes/surfaces/settings-runtime.css',
    '/public/css/routes/surfaces/settings-cues.css',
  ],
  topics: ['/public/css/routes/surfaces/topics.css'],
  town: [],
  tools: [],
  'tools-budgeting': ['/public/css/routes/surfaces/tools-budgeting-surface.css'],
  'tools-character-sheet': [],
  'tools-midjourney': [],
  'tools-profile': [],
  website: [
    '/public/css/routes/surfaces/website.css',
    '/public/css/routes/surfaces/design.css',
    '/public/css/routes/surfaces/design-experiments.css',
    '/public/css/routes/surfaces/review-surfaces.css',
  ],
});

/**
 * data-spw-surface values that share another surface's route CSS bundle.
 * Keeps topic curriculum pages (software) on topics.css without duplicate bundles.
 */
export const ROUTE_SURFACE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  software: 'topics',
});

/** Resolve alias → canonical ROUTE_SCOPES key (or the surface itself). */
export function resolveCanonicalRouteSurface(surface: string): string {
  const normalized = normalizeSpace(surface);
  if (!normalized) return '';
  return ROUTE_SURFACE_ALIASES[normalized] || normalized;
}

const ROUTE_BUNDLE_SLUGS = Object.freeze(
  Object.fromEntries(
    Object.entries(ROUTE_SCOPES)
      .filter(([, files]) => files.length > 0)
      .map(([surface]) => [surface, surface.replace(/[^a-z0-9]+/gi, '-')]),
  ),
);

const BEHAVIOR_BUNDLE_SLUGS = Object.freeze(
  Object.fromEntries(
    Object.keys(BEHAVIOR_SCOPES).map((feature) => [feature, feature.replace(/[^a-z0-9]+/gi, '-')]),
  ),
);

export const CORE_BUNDLE_HREF = '/public/css/bundles/core.css';
export const FULL_STYLESHEET_HREF = '/public/css/style.css';
export const BEHAVIOR_SCOPE_MODULE_HREF = '/public/js/runtime/behavior-scopes.js';

export function routeBundleHref(surface: string): string | null {
  const canonical = resolveCanonicalRouteSurface(surface);
  const files = ROUTE_SCOPES[canonical];
  if (!files?.length) return null;
  const slug = ROUTE_BUNDLE_SLUGS[canonical];
  return slug ? `/public/css/bundles/routes/${slug}.css` : null;
}

export function behaviorBundleHref(feature: string): string | null {
  const files = BEHAVIOR_SCOPES[feature];
  if (!files?.length) return null;
  const slug = BEHAVIOR_BUNDLE_SLUGS[feature];
  return slug ? `/public/css/bundles/behaviors/${slug}.css` : null;
}

export function listBehaviorScopeKeys(): string[] {
  return Object.keys(BEHAVIOR_SCOPES).sort();
}

export function listBehaviorScopeBundles(): Readonly<Record<string, string>> {
  const bundles: Record<string, string> = {};

  for (const feature of listBehaviorScopeKeys()) {
    const href = behaviorBundleHref(feature);
    if (href) bundles[feature] = href;
  }

  return Object.freeze(bundles);
}

export function parseStyleImports(source: string): CssImportRef[] {
  const imports: CssImportRef[] = [];
  const importPattern = /@import\s+url\((['"]?)([^'")]+)\1\)\s*(?:layer\(([^)]+)\))?\s*;/g;

  for (const match of source.matchAll(importPattern)) {
    const [, , file, layer] = match;
    const href = stripQueryHash(file);
    imports.push({
      file: href,
      layer: layer?.trim() || null,
      external: /^https?:\/\//i.test(href),
    });
  }

  return imports;
}

export function uniqueFiles(files: Iterable<string>): string[] {
  return [...new Set([...files].map((file) => stripQueryHash(file)))];
}

export function collectBehaviorFiles(features: Iterable<string>): string[] {
  const files: string[] = [];
  for (const feature of features) {
    const scoped = BEHAVIOR_SCOPES[feature];
    if (scoped) files.push(...scoped);
  }
  return uniqueFiles(files);
}

export function collectRouteFiles(surface = ''): string[] {
  const canonical = resolveCanonicalRouteSurface(surface);
  if (!canonical) return [];
  return uniqueFiles(ROUTE_SCOPES[canonical] || []);
}

/** Whether this surface is known to the route CSS map (including empty + aliases). */
export function isKnownRouteSurface(surface: string): boolean {
  const normalized = normalizeSpace(surface);
  if (!normalized) return false;
  if (normalized in ROUTE_SCOPES) return true;
  const canonical = resolveCanonicalRouteSurface(normalized);
  return canonical in ROUTE_SCOPES;
}

export function normalizeSpace(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function resolveScopedStylesheets(options: {
  surface?: string;
  features?: Iterable<string>;
  extraStyles?: Iterable<string>;
} = {}): ScopedStylesheet[] {
  const surface = normalizeSpace(options.surface);
  const canonicalSurface = resolveCanonicalRouteSurface(surface);
  const features = [...(options.features || [])];
  const sheets: ScopedStylesheet[] = [{ href: CORE_BUNDLE_HREF, kind: 'core' }];

  const routeHref = surface ? routeBundleHref(surface) : null;
  if (routeHref) {
    sheets.push({ href: routeHref, kind: 'route', scope: canonicalSurface || surface });
  }

  for (const feature of features) {
    const behaviorHref = behaviorBundleHref(feature);
    if (!behaviorHref) continue;
    if (sheets.some((entry) => entry.href === behaviorHref)) continue;
    sheets.push({ href: behaviorHref, kind: 'behavior', scope: feature });
  }

  for (const href of options.extraStyles || []) {
    const normalized = stripQueryHash(href);
    if (!normalized || sheets.some((entry) => entry.href === normalized)) continue;
    sheets.push({ href: normalized, kind: 'behavior', scope: 'extra' });
  }

  return sheets;
}

export type CssPayloadEstimate = {
  surface: string;
  canonicalSurface: string;
  features: string[];
  mode: 'full' | 'scoped';
  sheets: ScopedStylesheet[];
  bytes: number;
  hrefs: string[];
};

/** Estimate linked CSS bytes for a route (bundle files for scoped; style.css for full). */
export async function estimateCssPayload(options: {
  surface?: string;
  features?: Iterable<string>;
  mode?: 'full' | 'scoped';
  extraStyles?: Iterable<string>;
} = {}): Promise<CssPayloadEstimate> {
  const surface = normalizeSpace(options.surface);
  const features = [...(options.features || [])];
  const mode = options.mode === 'full' ? 'full' : 'scoped';
  const sheets = mode === 'full'
    ? [{ href: FULL_STYLESHEET_HREF, kind: 'full' as const }]
    : resolveScopedStylesheets({
      surface,
      features,
      extraStyles: options.extraStyles,
    });

  let bytes = 0;
  const hrefs: string[] = [];
  for (const sheet of sheets) {
    hrefs.push(sheet.href);
    try {
      const absolute = absoluteFromRootHref(sheet.href);
      const stat = await fs.stat(absolute);
      bytes += stat.size;
    } catch {
      // Missing generated bundle — report 0 for that sheet.
    }
  }

  // Full mode: style.css is a thin import graph; approximate with core + all route/behavior bundles.
  if (mode === 'full') {
    const all = listBundleTargets();
    bytes = 0;
    hrefs.length = 0;
    for (const target of all) {
      hrefs.push(target.href);
      try {
        const stat = await fs.stat(absoluteFromRootHref(target.href));
        bytes += stat.size;
      } catch {
        /* skip */
      }
    }
  }

  return {
    surface,
    canonicalSurface: resolveCanonicalRouteSurface(surface),
    features,
    mode,
    sheets,
    bytes,
    hrefs,
  };
}

export async function readStyleCoreImports(): Promise<CssImportRef[]> {
  const source = await fs.readFile(STYLE_CORE_MANIFEST, 'utf8');
  return parseStyleImports(source);
}

export async function readFullStyleImports(): Promise<CssImportRef[]> {
  const source = await fs.readFile(STYLE_MANIFEST, 'utf8');
  return parseStyleImports(source);
}

export function relativeBundleOutput(href: string): string {
  return toPosixPath(href.replace(/^\/+/, ''));
}

export function absoluteFromRootHref(href: string): string {
  return path.join(ROOT_DIR, href.replace(/^\/+/, ''));
}

export type CssBundleTarget = {
  kind: 'core' | 'route' | 'behavior';
  scope: string;
  href: string;
  files: string[];
};

export function listBundleTargets(): CssBundleTarget[] {
  const targets: CssBundleTarget[] = [];

  targets.push({
    kind: 'core',
    scope: 'core',
    href: CORE_BUNDLE_HREF,
    files: [],
  });

  for (const [surface, files] of Object.entries(ROUTE_SCOPES)) {
    if (!files.length) continue;
    const href = routeBundleHref(surface);
    if (!href) continue;
    targets.push({ kind: 'route', scope: surface, href, files: [...files] });
  }

  for (const [feature, files] of Object.entries(BEHAVIOR_SCOPES)) {
    const href = behaviorBundleHref(feature);
    if (!href) continue;
    targets.push({ kind: 'behavior', scope: feature, href, files: [...files] });
  }

  return targets;
}

/**
 * Select bundle targets for incremental agent/local rebuilds.
 * Tokens: core | routes | behaviors | route:home | behavior:svg-surfaces | home | console
 */
export function filterBundleTargets(
  targets: CssBundleTarget[],
  options: {
    only?: Iterable<string> | null;
    skipCore?: boolean;
  } = {},
): CssBundleTarget[] {
  let selected = [...targets];

  if (options.skipCore) {
    selected = selected.filter((target) => target.kind !== 'core');
  }

  const onlyTokens = [...(options.only || [])]
    .map((token) => normalizeSpace(token).toLowerCase())
    .filter(Boolean);

  if (!onlyTokens.length) return selected;

  const wantCore = onlyTokens.some((token) => token === 'core');
  const wantAllRoutes = onlyTokens.some((token) => token === 'routes' || token === 'route');
  const wantAllBehaviors = onlyTokens.some((token) => token === 'behaviors' || token === 'behavior');

  const explicit = new Set<string>();
  for (const token of onlyTokens) {
    if (token === 'core' || token === 'routes' || token === 'route' || token === 'behaviors' || token === 'behavior') {
      continue;
    }
    let name = token;
    if (token.startsWith('route:')) name = token.slice('route:'.length);
    else if (token.startsWith('behavior:') || token.startsWith('feature:')) {
      name = token.replace(/^(?:behavior|feature):/, '');
    }
    explicit.add(name);
    const canonical = resolveCanonicalRouteSurface(name).toLowerCase();
    if (canonical) explicit.add(canonical);
  }

  return selected.filter((target) => {
    if (target.kind === 'core') return wantCore && !options.skipCore;
    if (target.kind === 'route') {
      return wantAllRoutes || explicit.has(target.scope.toLowerCase());
    }
    if (target.kind === 'behavior') {
      return wantAllBehaviors || explicit.has(target.scope.toLowerCase());
    }
    return false;
  });
}

/** Normalize a repo-relative path, absolute path, or root href to `/public/css/...` when under CSS tree. */
export function normalizeCssSourceHref(pathOrHref: string): string {
  let value = stripQueryHash(String(pathOrHref || '').trim()).replace(/\\/g, '/');
  if (!value) return '';

  if (value.startsWith('file:')) {
    try {
      value = fileURLToPath(value);
    } catch {
      /* keep raw */
    }
  }

  value = value.replace(/\\/g, '/');

  if (path.isAbsolute(value) || /^[A-Za-z]:\//.test(value)) {
    const relative = toPosixPath(path.relative(ROOT_DIR, value));
    if (relative.startsWith('..')) return stripQueryHash(value);
    value = relative;
  }

  value = value.replace(/^\.\//, '').replace(/^\/+/, '');
  if (!value.startsWith('public/') && value.startsWith('css/')) {
    value = `public/${value}`;
  }
  return value ? `/${value}` : '';
}

export function isGeneratedCssHref(href: string): boolean {
  const normalized = normalizeCssSourceHref(href);
  return (
    normalized.startsWith('/public/css/bundles/')
    || normalized === BEHAVIOR_SCOPE_MODULE_HREF
    || normalized.endsWith('.css.map')
  );
}

/**
 * Map source CSS paths to bundle targets for incremental rebuilds.
 * Pass `coreSourceHrefs` (from style-core @imports) so shared token/shell edits hit core.
 */
export function targetsForSourcePaths(
  pathOrHrefs: Iterable<string>,
  options: {
    targets?: CssBundleTarget[];
    coreSourceHrefs?: Iterable<string> | null;
  } = {},
): CssBundleTarget[] {
  const targets = options.targets || listBundleTargets();
  const coreFiles = new Set(
    [...(options.coreSourceHrefs || [])]
      .map((href) => normalizeCssSourceHref(href))
      .filter(Boolean),
  );
  // Manifests always imply core.
  coreFiles.add('/public/css/style-core.css');
  coreFiles.add('/public/css/style.css');

  const matched = new Map<string, CssBundleTarget>();

  for (const raw of pathOrHrefs) {
    const href = normalizeCssSourceHref(raw);
    if (!href || isGeneratedCssHref(href)) continue;

    for (const target of targets) {
      if (target.kind === 'core') {
        if (coreFiles.has(href)) matched.set(target.href, target);
        continue;
      }
      if (target.files.some((file) => normalizeCssSourceHref(file) === href)) {
        matched.set(target.href, target);
      }
    }
  }

  return [...matched.values()];
}

/** Filter tokens for filterBundleTargets from resolved targets (e.g. route:home, core). */
export function onlyTokensForTargets(targets: Iterable<CssBundleTarget>): string[] {
  const tokens: string[] = [];
  for (const target of targets) {
    if (target.kind === 'core') tokens.push('core');
    else if (target.kind === 'route') tokens.push(`route:${target.scope}`);
    else if (target.kind === 'behavior') tokens.push(`behavior:${target.scope}`);
  }
  return tokens;
}

/** Soft budgets (bytes) for agent/publish hygiene — warn only unless --strict-budget. */
export const CSS_BUNDLE_SOFT_BUDGETS = Object.freeze({
  core: 1.6 * 1024 * 1024,
  route: 120 * 1024,
  behavior: 48 * 1024,
});
