import { promises as fs } from 'node:fs';
import path from 'node:path';
import { stripQueryHash } from './site-contracts/helpers.mjs';
import { toPosixPath } from './shared/build-topology.mjs';
const ROOT_DIR = path.resolve(import.meta.dirname, '..', '..');
const STYLE_CORE_MANIFEST = path.join(ROOT_DIR, 'public/css/style-core.css');
const STYLE_MANIFEST = path.join(ROOT_DIR, 'public/css/style.css');
export const EXPECTED_LAYER_ORDER = 'reset, tokens, shell, typography, grammar, components, systems, routes, handles, effects, ornament';
/** CSS files gated by body[data-spw-features~="..."]. */
export const BEHAVIOR_SCOPES = Object.freeze({
    console: [
        '/public/css/components/cauldron.css',
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
});
/** Route personality keyed by data-spw-surface. */
export const ROUTE_SCOPES = Object.freeze({
    about: ['/public/css/routes/about-surface.css'],
    blog: [
        '/public/css/routes/surfaces/blog.css',
        '/public/css/routes/surfaces/blog-frames.css',
        '/public/css/routes/surfaces/blog-layouts.css',
        '/public/css/routes/surfaces/blog-motion.css',
    ],
    care: [],
    cards: [],
    contact: ['/public/css/routes/contact-surface.css'],
    coordination: [],
    craft: ['/public/css/routes/craft-surface.css'],
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
    play: ['/public/css/routes/play-surface.css'],
    privacy: [],
    recipes: ['/public/css/routes/recipes-surface.css'],
    research: [],
    'rpg-wednesday': [
        '/public/css/routes/play-surface.css',
        '/public/css/routes/rpg-wednesday-surface.css',
    ],
    services: ['/public/css/routes/services-surface.css'],
    'services-care': ['/public/css/routes/services-surface.css'],
    'services-creator': ['/public/css/routes/services-surface.css'],
    'services-ecosystem': ['/public/css/routes/services-surface.css'],
    'services-systems': ['/public/css/routes/services-surface.css'],
    settings: [
        '/public/css/routes/surfaces/settings.css',
        '/public/css/routes/surfaces/settings-forms.css',
        '/public/css/routes/surfaces/settings-notes.css',
        '/public/css/routes/surfaces/settings-runtime.css',
        '/public/css/routes/surfaces/settings-cues.css',
    ],
    topics: ['/public/css/routes/topics-surface.css'],
    town: [],
    'tools-budgeting': ['/public/css/routes/tools-budgeting-surface.css'],
    website: [
        '/public/css/routes/website-surface.css',
        '/public/css/routes/design-surface.css',
    ],
});
const ROUTE_BUNDLE_SLUGS = Object.freeze(Object.fromEntries(Object.entries(ROUTE_SCOPES)
    .filter(([, files]) => files.length > 0)
    .map(([surface]) => [surface, surface.replace(/[^a-z0-9]+/gi, '-')])));
const BEHAVIOR_BUNDLE_SLUGS = Object.freeze(Object.fromEntries(Object.keys(BEHAVIOR_SCOPES).map((feature) => [feature, feature.replace(/[^a-z0-9]+/gi, '-')])));
export const CORE_BUNDLE_HREF = '/public/css/bundles/core.css';
export const FULL_STYLESHEET_HREF = '/public/css/style.css';
export const BEHAVIOR_SCOPE_MODULE_HREF = '/public/js/runtime/behavior-scopes.js';
export function routeBundleHref(surface) {
    const files = ROUTE_SCOPES[surface];
    if (!files?.length)
        return null;
    const slug = ROUTE_BUNDLE_SLUGS[surface];
    return slug ? `/public/css/bundles/routes/${slug}.css` : null;
}
export function behaviorBundleHref(feature) {
    const files = BEHAVIOR_SCOPES[feature];
    if (!files?.length)
        return null;
    const slug = BEHAVIOR_BUNDLE_SLUGS[feature];
    return slug ? `/public/css/bundles/behaviors/${slug}.css` : null;
}
export function listBehaviorScopeKeys() {
    return Object.keys(BEHAVIOR_SCOPES).sort();
}
export function listBehaviorScopeBundles() {
    const bundles = {};
    for (const feature of listBehaviorScopeKeys()) {
        const href = behaviorBundleHref(feature);
        if (href)
            bundles[feature] = href;
    }
    return Object.freeze(bundles);
}
export function parseStyleImports(source) {
    const imports = [];
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
export function uniqueFiles(files) {
    return [...new Set([...files].map((file) => stripQueryHash(file)))];
}
export function collectBehaviorFiles(features) {
    const files = [];
    for (const feature of features) {
        const scoped = BEHAVIOR_SCOPES[feature];
        if (scoped)
            files.push(...scoped);
    }
    return uniqueFiles(files);
}
export function collectRouteFiles(surface = '') {
    const normalized = normalizeSpace(surface);
    if (!normalized)
        return [];
    return uniqueFiles(ROUTE_SCOPES[normalized] || []);
}
export function normalizeSpace(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}
export function resolveScopedStylesheets(options = {}) {
    const surface = normalizeSpace(options.surface);
    const features = [...(options.features || [])];
    const sheets = [{ href: CORE_BUNDLE_HREF, kind: 'core' }];
    const routeHref = surface ? routeBundleHref(surface) : null;
    if (routeHref) {
        sheets.push({ href: routeHref, kind: 'route', scope: surface });
    }
    for (const feature of features) {
        const behaviorHref = behaviorBundleHref(feature);
        if (!behaviorHref)
            continue;
        if (sheets.some((entry) => entry.href === behaviorHref))
            continue;
        sheets.push({ href: behaviorHref, kind: 'behavior', scope: feature });
    }
    for (const href of options.extraStyles || []) {
        const normalized = stripQueryHash(href);
        if (!normalized || sheets.some((entry) => entry.href === normalized))
            continue;
        sheets.push({ href: normalized, kind: 'behavior', scope: 'extra' });
    }
    return sheets;
}
export async function readStyleCoreImports() {
    const source = await fs.readFile(STYLE_CORE_MANIFEST, 'utf8');
    return parseStyleImports(source);
}
export async function readFullStyleImports() {
    const source = await fs.readFile(STYLE_MANIFEST, 'utf8');
    return parseStyleImports(source);
}
export function relativeBundleOutput(href) {
    return toPosixPath(href.replace(/^\/+/, ''));
}
export function absoluteFromRootHref(href) {
    return path.join(ROOT_DIR, href.replace(/^\/+/, ''));
}
export function listBundleTargets() {
    const targets = [];
    targets.push({
        kind: 'core',
        scope: 'core',
        href: CORE_BUNDLE_HREF,
        files: [],
    });
    for (const [surface, files] of Object.entries(ROUTE_SCOPES)) {
        if (!files.length)
            continue;
        const href = routeBundleHref(surface);
        if (!href)
            continue;
        targets.push({ kind: 'route', scope: surface, href, files: [...files] });
    }
    for (const [feature, files] of Object.entries(BEHAVIOR_SCOPES)) {
        const href = behaviorBundleHref(feature);
        if (!href)
            continue;
        targets.push({ kind: 'behavior', scope: feature, href, files: [...files] });
    }
    return targets;
}
