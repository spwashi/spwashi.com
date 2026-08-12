/**
 * HTML-native template renderer.
 *
 * Composition directives are custom elements — IDEs parse them as regular HTML,
 * so attribute auto-complete and outline navigation both work.
 *
 *   <spw-page title="..." description="..." canonical="..."></spw-page>
 *     Declares page-scope variables. Stripped from output.
 *     Any attribute becomes a variable of the same name (kebab-case preserved).
 *
 *   <spw-include src="head-meta"></spw-include>
 *     Inlines `_partials/head-meta.html` (or `src` literal if it ends in `.html`).
 *     Any extra attributes override page vars for the duration of that include.
 *
 *   <spw-site-head></spw-site-head>
 *     Generates the standard route head from page vars.
 *     Optional attrs: analytics="off", prepaint="off", site_script="off",
 *     analytics_engine="none|custom", analytics_src="/path/to/script.js",
 *     preconnect="https://example.com|https://cdn.example.com",
 *     modulepreloads="/public/js/module.js|/public/js/other.js".
 *     Analytics defaults to none; an engine must be declared explicitly.
 *
 *   <spw-site-header current="Settings" indicator="settings" header_annotation="local state"></spw-site-header>
 *     Generates the primary navigation chrome from compact route metadata.
 *     Use `nav_items="Home:/|Settings:/settings/"` for page-specific nav.
 *     Use `header_annotation` for a compact guide phrase beside the sigil.
 *
 *   <spw-site-footer></spw-site-footer>
 *     Generates the shared footer chrome from `_partials/site-footer.html`.
 *
 * Variable substitution uses `{{name}}` inside text and attribute values — this
 * is the one non-HTML-native bit, because you can't place a child element inside
 * an attribute string. HTML-escaped by default.
 *
 * Rules:
 *   - Opt-in per source: a file is processed only if it contains `<spw-page`,
 *     `<spw-include`, or `{{`. Otherwise it passes through verbatim.
 *   - Include depth is capped; self-referential or cyclic includes throw.
 *   - Unknown `{{name}}` is left as a literal and logged once per render.
 *
 * Zero deps. Shared by build.mjs and dev-server.mjs so dev matches prod.
 */

import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyScopedStylesheets,
  parseStylesheetMode,
  renderStylesheetLinks,
  resolveRouteStylesheets,
} from './typed/css-scopes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const PARTIALS_DIR = path.join(REPO_ROOT, '_partials');

/** mtime-keyed partial body cache — multi-page builds re-read the same chrome partials. */
const partialCache = new Map();
const templateStats = {
  renders: 0,
  passthrough: 0,
  includes: 0,
  partialHits: 0,
  partialMisses: 0,
  renderMs: 0,
};

const SPW_PAGE_RE = /<spw-page\b([^>]*?)(?:\/>|>\s*<\/spw-page>)/i;
const SPW_INCLUDE_RE = /<spw-include\b([^>]*?)(?:\/>|>\s*<\/spw-include>)/gi;
const SPW_SITE_HEAD_RE = /<spw-site-head\b([^>]*?)(?:\/>|>\s*<\/spw-site-head>)/gi;
const SPW_SITE_HEADER_RE = /<spw-site-header\b([^>]*?)(?:\/>|>\s*<\/spw-site-header>)/gi;
const SPW_SITE_FOOTER_RE = /<spw-site-footer\b([^>]*?)(?:\/>|>\s*<\/spw-site-footer>)/gi;
const ATTR_RE = /([a-zA-Z][a-zA-Z0-9_:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/g;
const VAR_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*\}\}/g;
const HTML_OPEN_RE = /<html\b([^>]*)>/i;
const BODY_OPEN_RE = /<body\b([^>]*)>/i;
const HEAD_CLOSE_RE = /<\/head>/i;
const PAGE_JSON_LD_RE = /<script\b(?=[^>]*type=["']application\/ld\+json["'])(?=[^>]*data-spw-generated=["']page["'])[^>]*>([\s\S]*?)<\/script>/i;
const MAX_INCLUDE_DEPTH = 8;

const PRIMARY_NAV_ITEMS = Object.freeze([
  { href: '/', label: 'Home', note: 'Start here and find a nearby route.' },
  { href: '/about/', label: 'About', note: 'How I work and what guides the site.' },
  { href: '/design/', label: 'Design', note: 'CSS, SVG, layout, and interaction studies.' },
  { href: '/topics/', label: 'Topics', note: 'Software, math, craft, design, and related notes.' },
  { href: '/topics/software/', label: 'Software', note: 'Spw, parsers, renderers, and software practice.' },
  { href: '/topics/math/', label: 'Math', note: 'Visual routes into mathematical structure.' },
  { href: '/blog/', label: 'Blog', note: 'Working notes, drafts, and public process.' },
  { href: '/about/domains/lore.land/', label: 'lore.land', note: 'Long-form stories, ebooks, and narrative work.' },
  { href: '/settings/', label: 'Settings', note: 'Tune local reading, appearance, and saved state.' },
]);

const DERIVED_META_FIELDS = [
  { attr: 'data-spw-surface', metaName: 'spw:surface', propertyName: 'spwSurface' },
  { attr: 'data-spw-features', metaName: 'spw:features', propertyName: 'spwFeatures' },
  { attr: 'data-spw-route-family', metaName: 'spw:route-family', propertyName: 'spwRouteFamily' },
  { attr: 'data-spw-context', metaName: 'spw:context', propertyName: 'spwContext' },
  { attr: 'data-spw-wonder', metaName: 'spw:wonder', propertyName: 'spwWonder' },
  { attr: 'data-spw-page-family', metaName: 'spw:page-family', propertyName: 'spwPageFamily' },
  { attr: 'data-spw-page-modes', metaName: 'spw:page-modes', propertyName: 'spwPageModes' },
  { attr: 'data-spw-page-role', metaName: 'spw:page-role', propertyName: 'spwPageRole' },
  { attr: 'data-spw-page-seed', metaName: 'spw:page-seed', propertyName: 'spwPageSeed' },
  { attr: 'data-spw-related-routes', metaName: 'spw:related-routes', propertyName: 'spwRelatedRoutes' },
  { attr: 'data-spw-layout', metaName: 'spw:layout', propertyName: 'spwLayout' },
];

/**
 * Page-family personality defaults (layout / density / context / wonder / modes).
 * Authored body attributes always win; these only fill gaps during render.
 * Keep in sync with .spw/conventions/page-template-authoring.spw
 */
function personality(layout, density, context, wonder, modes) {
  return Object.freeze({
    layout, density, context, wonder, modes,
  });
}

const PAGE_FAMILY_PERSONALITY = Object.freeze({
  'kernel-atlas': personality('wide', 'balanced', 'orientation', 'orientation locality consequence', 'reading inspect collect'),
  'kernel-portrait': personality('reading', 'roomy', 'reflection', 'orientation consequence resonance', 'reading compare navigate'),
  'field-guide': personality('reading', 'roomy', 'reading', 'comparison consequence locality', 'read compare practice'),
  'operator-atlas': personality('wide', 'compact', 'analysis', 'comparison constraint locality', 'read inspect compare'),
  curriculum: personality('wide', 'compact', 'analysis', 'comparison constraint locality', 'read inspect compare build'),
  atlas: personality('atlas', 'compact', 'routing', 'orientation comparison projection', 'navigate compare collect read'),
  constellation: personality('wide', 'balanced', 'reflection', 'orientation locality consequence', 'read compare navigate'),
  campaign: personality('wide', 'balanced', 'play', 'projection resonance consequence', 'read play explore'),
  studio: personality('wide', 'balanced', 'publishing', 'texture locality consequence', 'read make compare'),
  laboratory: personality('wide', 'balanced', 'publishing', 'orientation locality consequence', 'reading inspect compose'),
  toolbench: personality('wide', 'compact', 'analysis', 'projection locality consequence', 'inspect build compare use'),
  workshop: personality('wide', 'compact', 'analysis', 'projection locality consequence', 'edit inspect export'),
  playfield: personality('wide', 'balanced', 'play', 'projection resonance consequence', 'read play explore'),
  'care-interface': personality('wide', 'roomy', 'reflection', 'translation consequence community', 'read reflect prepare share'),
  coordination: personality('wide', 'balanced', 'collaboration', 'roles circulation consequence', 'read plan join'),
  membership: personality('wide', 'roomy', 'participation', 'belonging consequence locality', 'read join support'),
  menu: personality('wide', 'balanced', 'action', 'projection consequence locality', 'read compare book contact'),
  switchboard: personality('wide', 'compact', 'routing', 'locality consequence resonance', 'navigate contact compare'),
  'proof-cards': personality('wide', 'compact', 'reference', 'locality consequence record', 'read collect support'),
  funding: personality('wide', 'balanced', 'collaboration', 'consequence locality projection', 'read support plan'),
  'runtime-observatory': personality('wide', 'compact', 'settings', 'comparison constraint locality', 'start write tune inspect'),
  policy: personality('reading', 'roomy', 'reference', 'locality consent inspectability', 'read inspect reset'),
  'kitchen-atlas': personality('wide', 'balanced', 'ritual', 'cultivation locality consequence', 'read cook practice'),
  'recipe-book': personality('reading', 'roomy', 'ritual', 'cultivation locality consequence', 'read cook practice'),
  design: personality('wide', 'compact', 'analysis', 'comparison constraint locality', 'inspect compare build'),
  'experiment-lab': personality('wide', 'compact', 'analysis', 'projection constraint locality', 'probe compare tune'),
  'practice-bed': personality('wide', 'balanced', 'play', 'projection resonance consequence', 'play practice inspect'),
  register: personality('reading', 'balanced', 'routing', 'orientation locality consequence', 'read inspect compare'),
  research: personality('wide', 'roomy', 'analysis', 'comparison consequence locality', 'read inspect compare'),
  seasonal: personality('wide', 'roomy', 'ritual', 'orientation belonging projection', 'read celebrate plan'),
  fallback: personality('reading', 'roomy', 'reference', 'locality consequence', 'read recover'),
  'topic-stub': personality('reading', 'roomy', 'reading', 'orientation locality', 'read navigate'),
  topic: personality('reading', 'roomy', 'reading', 'orientation comparison locality', 'read compare navigate'),
  'topic-hub': personality('wide', 'balanced', 'routing', 'orientation comparison projection', 'navigate compare read'),
  spec: personality('reading', 'compact', 'verification', 'comparison constraint locality', 'read inspect compare'),
  lab: personality('wide', 'compact', 'analysis', 'projection locality consequence', 'probe inspect compose'),
  // Authored families found on public leaves (keep in sync with route bodies)
  observatory: personality('wide', 'compact', 'analysis', 'orientation publication locality', 'read inspect publish'),
  roadmap: personality('wide', 'balanced', 'analysis', 'projection constraint consequence', 'read plan compare'),
  glossary: personality('reading', 'compact', 'reference', 'comparison locality orientation', 'read inspect compare'),
  chronicle: personality('reading', 'roomy', 'reading', 'memory consequence locality', 'read compare collect'),
  'folio-archive': personality('wide', 'balanced', 'reference', 'artifact memory locality', 'read inspect study share'),
  'syntax-atlas': personality('wide', 'compact', 'analysis', 'comparison constraint locality', 'read inspect compose'),
  'town-library': personality('wide', 'balanced', 'reading', 'memory locality consequence', 'read browse recall'),
});

/** spw-page var → body data-spw-* attribute (only filled when body lacks the attr). */
const PAGE_VAR_BODY_ATTRS = Object.freeze([
  ['surface', 'data-spw-surface'],
  ['spw_surface', 'data-spw-surface'],
  ['features', 'data-spw-features'],
  ['spw_features', 'data-spw-features'],
  ['route_family', 'data-spw-route-family'],
  ['context', 'data-spw-context'],
  ['density', 'data-spw-density'],
  ['wonder', 'data-spw-wonder'],
  ['page_family', 'data-spw-page-family'],
  ['page_modes', 'data-spw-page-modes'],
  ['page_role', 'data-spw-page-role'],
  ['page_seed', 'data-spw-page-seed'],
  ['related_routes', 'data-spw-related-routes'],
  ['layout', 'data-spw-layout'],
  ['stylesheet_mode', 'data-spw-stylesheet-mode'],
]);

function cloneRegex(pattern) {
  return new RegExp(pattern.source, pattern.flags);
}

function htmlEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function attrEscape(value) {
  return htmlEscape(value);
}

function decodeHtmlEntities(value = '') {
  return String(value).replace(
    /&(?:amp|lt|gt|quot|#39|#x27|#(\d+)|#x([0-9a-f]+));/gi,
    (entity, decimal, hex) => {
      if (decimal) return String.fromCodePoint(Number(decimal));
      if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
      const named = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&#x27;': "'",
      };
      return named[entity.toLowerCase()] ?? entity;
    },
  );
}

function parseAttrs(attrString) {
  const out = {};
  const attrRe = cloneRegex(ATTR_RE);
  let match;
  while ((match = attrRe.exec(attrString)) !== null) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    out[name] = decodeHtmlEntities(value);
  }
  return out;
}

function extractPageVars(source) {
  const match = source.match(SPW_PAGE_RE);
  if (!match) return { vars: {}, rest: source };
  const attrs = parseAttrs(match[1]);
  const before = source.slice(0, match.index);
  const after = source.slice(match.index + match[0].length);
  const rest = (before + after).replace(/^\s*\n/, '');
  return { vars: attrs, rest };
}

function resolvePartialPath(name) {
  const normalized = name.endsWith('.html') ? name : `${name}.html`;
  const abs = path.resolve(PARTIALS_DIR, normalized);
  const partialsRoot = PARTIALS_DIR.endsWith(path.sep) ? PARTIALS_DIR : PARTIALS_DIR + path.sep;
  if (!abs.startsWith(partialsRoot)) {
    throw new Error(`[template] partial path escapes _partials/: ${name}`);
  }
  return abs;
}

/**
 * Read a partial with mtime cache so multi-route builds reuse chrome HTML.
 * @param {string} partialPath absolute path under _partials/
 */
async function readPartialCached(partialPath) {
  let st;
  try {
    st = await fs.stat(partialPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      partialCache.delete(partialPath);
      throw err;
    }
    throw err;
  }
  const mtimeMs = st.mtimeMs;
  const cached = partialCache.get(partialPath);
  if (cached && cached.mtimeMs === mtimeMs) {
    templateStats.partialHits += 1;
    return cached.body;
  }
  const body = await fs.readFile(partialPath, 'utf8');
  partialCache.set(partialPath, { mtimeMs, body });
  templateStats.partialMisses += 1;
  return body;
}

export function clearTemplatePartialCache() {
  partialCache.clear();
}

export function getTemplateStats() {
  return { ...templateStats, partialCacheSize: partialCache.size };
}

export function resetTemplateStats() {
  templateStats.renders = 0;
  templateStats.passthrough = 0;
  templateStats.includes = 0;
  templateStats.partialHits = 0;
  templateStats.partialMisses = 0;
  templateStats.renderMs = 0;
}

async function expandIncludes(text, scopeVars, depth, seen, warnings) {
  if (depth > MAX_INCLUDE_DEPTH) {
    throw new Error(`[template] include depth exceeded ${MAX_INCLUDE_DEPTH} (cycle?)`);
  }
  const parts = [];
  let lastIndex = 0;
  const includeRe = cloneRegex(SPW_INCLUDE_RE);
  let match;
  while ((match = includeRe.exec(text)) !== null) {
    parts.push(text.slice(lastIndex, match.index));
    const rawAttrs = parseAttrs(match[1]);
    const attrs = {};
    for (const [k, v] of Object.entries(rawAttrs)) {
      attrs[k] = interpolateValue(v, scopeVars, warnings);
    }
    const src = attrs.src;
    if (!src) {
      warnings.push(`<spw-include> without src attribute at offset ${match.index}`);
      parts.push(match[0]);
      lastIndex = match.index + match[0].length;
      continue;
    }
    const partialPath = resolvePartialPath(src);
    if (seen.has(partialPath)) {
      throw new Error(`[template] include cycle at ${path.relative(REPO_ROOT, partialPath)}`);
    }
    templateStats.includes += 1;
    let partial;
    try {
      partial = await readPartialCached(partialPath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        warnings.push(`missing partial: ${path.relative(REPO_ROOT, partialPath)}`);
        parts.push(match[0]);
        lastIndex = match.index + match[0].length;
        continue;
      }
      throw err;
    }
    const nextSeen = new Set(seen);
    nextSeen.add(partialPath);
    const localVars = { ...scopeVars };
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'src') continue;
      localVars[k] = v;
    }
    const expanded = await expandIncludes(partial, localVars, depth + 1, nextSeen, warnings);
    const substituted = substituteVars(expanded, localVars, warnings);
    parts.push(substituted);
    lastIndex = match.index + match[0].length;
  }
  parts.push(text.slice(lastIndex));
  return parts.join('');
}

async function loadSiteFooterTemplate() {
  return fs.readFile(resolvePartialPath('site-footer'), 'utf8');
}

function substituteVars(text, vars, warnings) {
  const unknown = new Set();
  const out = text.replace(cloneRegex(VAR_RE), (_m, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return htmlEscape(vars[key]);
    }
    unknown.add(key);
    return `{{${key}}}`;
  });
  for (const key of unknown) warnings.push(`unknown var: {{${key}}}`);
  return out;
}

function interpolateValue(text, vars, warnings) {
  const unknown = new Set();
  const out = text.replace(cloneRegex(VAR_RE), (_m, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return String(vars[key] ?? '');
    }
    unknown.add(key);
    return `{{${key}}}`;
  });
  for (const key of unknown) warnings.push(`unknown var in include attribute: {{${key}}}`);
  return out;
}

function shouldProcess(text) {
  return /<spw-page\b/i.test(text)
    || /<spw-include\b/i.test(text)
    || /<spw-site-head\b/i.test(text)
    || /<spw-site-header\b/i.test(text)
    || /<spw-site-footer\b/i.test(text);
}

function escapeJsonForScript(value) {
  return JSON.stringify(value, null, 8).replace(/</g, '\\u003c');
}

function normalizeContent(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function firstValue(...values) {
  for (const value of values) {
    const normalized = normalizeContent(value);
    if (normalized) return normalized;
  }
  return '';
}

function splitList(value = '') {
  return String(value)
    .split(/[|,]/)
    .map((item) => normalizeContent(item))
    .filter(Boolean);
}

/**
 * Space/pipe/comma token lists for wonder, features, route-family, modes.
 * Lowercases, collapses whitespace, dedupes preserving first-seen order.
 */
function normalizeTokenList(value = '', { separator = ' ' } = {}) {
  const seen = new Set();
  const out = [];
  for (const raw of String(value || '').split(/[\s|,]+/)) {
    const token = normalizeContent(raw).toLowerCase();
    if (!token || seen.has(token)) continue;
    // Prefer kebab-case for multi-word tokens already using hyphens
    const normalized = token.replace(/_+/g, '-');
    if (seen.has(normalized)) continue;
    seen.add(token);
    seen.add(normalized);
    out.push(normalized);
  }
  return out.join(separator);
}

/**
 * Related routes: site paths get a trailing slash; absolute external URLs pass through.
 * Pipe-separated; first-seen order; empty segments dropped.
 */
function normalizeRelatedRoutes(value = '') {
  return String(value || '')
    .split('|')
    .map((item) => {
      const raw = normalizeContent(item);
      if (!raw) return '';
      if (/^https?:\/\//i.test(raw)) {
        try {
          const url = new URL(raw);
          // External hosts keep full origin; site host normalizes to path-only.
          if (url.hostname === 'spwashi.com' || url.hostname === 'www.spwashi.com') {
            return ensureTrailingSlash(url.pathname || '/');
          }
          return url.href;
        } catch {
          return raw;
        }
      }
      return normalizeUrlPath(raw);
    })
    .filter(Boolean)
    .filter((pathValue, index, all) => all.indexOf(pathValue) === index)
    .join('|');
}

function ensureTrailingSlash(pathname = '/') {
  const pathValue = pathname || '/';
  if (pathValue === '/') return '/';
  return pathValue.endsWith('/') ? pathValue : `${pathValue}/`;
}

function normalizePageFamily(value = '') {
  return normalizeContent(value).toLowerCase().replace(/[_\s]+/g, '-');
}

function splitLines(value = '') {
  return String(value)
    .split('|')
    .map((item) => normalizeContent(item))
    .filter(Boolean);
}

function parseKeyedList(value = '') {
  return splitLines(value)
    .map((item) => {
      const separatorIndex = item.indexOf(':');
      if (separatorIndex < 0) return null;
      const key = normalizeContent(item.slice(0, separatorIndex));
      const content = normalizeContent(item.slice(separatorIndex + 1));
      if (!key || !content) return null;
      return { key, content };
    })
    .filter(Boolean);
}

function normalizeUrlPath(value = '') {
  const normalized = normalizeContent(value);
  if (!normalized) return '';

  try {
    const pathname = new URL(normalized, 'https://spwashi.com').pathname || '/';
    return ensureTrailingSlash(pathname.replace(/\/{2,}/g, '/'));
  } catch {
    const pathValue = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return ensureTrailingSlash(pathValue.replace(/\/{2,}/g, '/'));
  }
}

function normalizeLocaleCode(value = '') {
  return normalizeContent(value).replace(/_/g, '-');
}

function localeToOgLocale(value = '') {
  const locale = normalizeLocaleCode(value);
  if (!locale) return '';
  if (locale.toLowerCase() === 'en') return 'en_US';
  return locale.replace(/-/g, '_');
}

function mergeScopeVars(scopeVars, rawAttrs, warnings) {
  const attrs = {};
  for (const [k, v] of Object.entries(rawAttrs)) {
    attrs[k] = interpolateValue(v, scopeVars, warnings);
  }
  return { ...scopeVars, ...attrs };
}

function renderExtraStyles(value = '') {
  return splitList(value)
    .map((href) => `    <link href="${attrEscape(href)}" rel="stylesheet" />`)
    .join('\n');
}

function renderExtraScripts(value = '') {
  return splitList(value)
    .map((src) => `    <script src="${attrEscape(src)}" type="module"></script>`)
    .join('\n');
}

function isOff(value = '') {
  return /^(?:0|false|no|off)$/i.test(normalizeContent(value));
}

function renderPreconnectLinks(value = '') {
  return splitList(value)
    .map((href) => {
      const needsCrossorigin = /\/\/fonts\.gstatic\.com(?:\/|$)/i.test(href);
      const crossorigin = needsCrossorigin ? ' crossorigin' : '';
      return `    <link href="${attrEscape(href)}" rel="preconnect"${crossorigin} />`;
    })
    .join('\n');
}

function renderModulePreloadLinks(value = '') {
  return splitList(value)
    .map((href) => `    <link href="${attrEscape(href)}" rel="modulepreload" />`)
    .join('\n');
}

function renderAnalyticsScript(vars) {
  const engine = firstValue(vars.analytics_engine, vars.analytics, vars.head_analytics, 'none').toLowerCase();
  if (!engine || isOff(engine) || engine === 'none') return '';

  const src = firstValue(vars.analytics_src, vars.analytics_script_src);
  if (!src) return '';

  const attrs = [
    `src="${attrEscape(src)}"`,
    'defer',
    `data-spw-analytics-engine="${attrEscape(engine)}"`,
  ];

  const site = firstValue(vars.analytics_site, vars.analytics_domain);
  if (site) attrs.push(`data-site="${attrEscape(site)}"`);

  return `    <script ${attrs.join(' ')}></script>`;
}

const PREPAINT_SOURCE_PATH = path.join(REPO_ROOT, 'public/js/runtime/prepaint-state.js');

// Read the zero-dep preflight IIFE once and inline it into the head. Inlining
// (rather than <script src>) removes a render-blocking network round-trip for a
// script that must execute before first paint — so the saved theme / font /
// color-scheme apply during parse instead of flashing the defaults and reflowing
// once the external script lands. The file stays the single source of truth.
let prepaintInlineSourceCache = null;
function readPrepaintInlineSource() {
  if (prepaintInlineSourceCache === null) {
    // Escape any literal `</script` so the inlined body can't close the tag early.
    prepaintInlineSourceCache = readFileSync(PREPAINT_SOURCE_PATH, 'utf8')
      .replace(/<\/script/gi, '<\\/script')
      .trim();
  }
  return prepaintInlineSourceCache;
}

function renderSettingsPreflightScript() {
  return `    <script data-spw-settings-preflight>\n${readPrepaintInlineSource()}\n    </script>`;
}

function injectSettingsPreflight(source) {
  if (source.includes('data-spw-settings-preflight') || source.includes('/public/js/runtime/prepaint-state.js')) return source;
  const script = renderSettingsPreflightScript();
  const styleLinkPattern = /(\s*<link\b[^>]*\bhref=["']\/public\/css\/style\.css[^>]*>)/i;
  if (styleLinkPattern.test(source)) {
    return source.replace(styleLinkPattern, `\n${script}$1`);
  }
  if (HEAD_CLOSE_RE.test(source)) {
    return source.replace(HEAD_CLOSE_RE, `${script}\n</head>`);
  }
  return source;
}

function injectPwaManifestLink(source) {
  if (!HEAD_CLOSE_RE.test(source)) return source;
  const manifestLinkPattern = /<link\b(?=[^>]*\brel=["'][^"']*\bmanifest\b[^"']*["'])[^>]*>/i;
  if (manifestLinkPattern.test(source)) return source;
  return source.replace(
    HEAD_CLOSE_RE,
    '    <link href="/manifest.webmanifest" rel="manifest" />\n</head>',
  );
}

function renderAlternateLocaleLinks(vars) {
  return parseKeyedList(vars.alternate_locales || vars.alternates || '')
    .map(({ key, content }) => `    <link rel="alternate" hreflang="${attrEscape(normalizeLocaleCode(key))}" href="${attrEscape(content)}" />`)
    .join('\n');
}

function renderPageJsonLd(vars) {
  const title = firstValue(vars.title, vars.og_title, 'Spwashi');
  const description = firstValue(vars.description, vars.og_description);
  const canonical = firstValue(vars.canonical, 'https://spwashi.com/');
  const about = splitList(firstValue(vars.jsonld_about, vars.about, vars.keywords));
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: canonical,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Spwashi',
      url: 'https://spwashi.com/',
    },
  };

  if (about.length) payload.about = about;

  return `    <script data-spw-generated="page" type="application/ld+json">\n${escapeJsonForScript(payload).split('\n').map((line) => `        ${line}`).join('\n')}\n    </script>`;
}

function renderBreadcrumbJsonLd(vars) {
  const label = firstValue(vars.breadcrumb_label, vars.nav_current, vars.header_current, vars.title);
  const canonical = firstValue(vars.canonical);
  if (!label || !canonical) return '';

  const payload = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://spwashi.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: label.replace(/^Spwashi\s*[•-]\s*/i, ''),
        item: canonical,
      },
    ],
  };

  return `    <script data-spw-generated="breadcrumbs" type="application/ld+json">\n${escapeJsonForScript(payload).split('\n').map((line) => `        ${line}`).join('\n')}\n    </script>`;
}

function renderSiteHead(vars) {
  const title = firstValue(vars.title, vars.og_title, 'Spwashi');
  const description = firstValue(vars.description, vars.og_description, 'Spwashi builds software and makes art.');
  const canonical = firstValue(vars.canonical, 'https://spwashi.com/');
  const ogTitle = firstValue(vars.og_title, title);
  const ogDescription = firstValue(vars.og_description, description);
  const ogImage = firstValue(vars.og_image, 'https://spwashi.com/public/images/assets/illustrations/home-og-card.jpg');
  const ogImageAlt = firstValue(vars.og_image_alt, `${title} illustrated metadata card on Spwashi.`);
  const keywords = firstValue(vars.keywords);
  const robots = firstValue(vars.robots);
  const locale = normalizeLocaleCode(firstValue(vars.locale, vars.lang, 'en'));
  const sourceLocale = normalizeLocaleCode(firstValue(vars.source_locale, vars.source_lang, locale));
  const alternateLocaleLinks = renderAlternateLocaleLinks(vars);
  const preconnectLinks = renderPreconnectLinks(firstValue(vars.preconnect, vars.head_preconnect));
  const modulePreloadLinks = renderModulePreloadLinks(firstValue(vars.modulepreloads, vars.module_preloads, vars.head_modulepreloads));
  const extraStyles = renderExtraStyles(vars.extra_styles);
  const extraScripts = renderExtraScripts(vars.extra_scripts);
  const pageJsonLd = renderPageJsonLd(vars);
  const breadcrumbs = renderBreadcrumbJsonLd(vars);
  const analyticsScript = renderAnalyticsScript(vars);
  const includePrepaint = !isOff(firstValue(vars.prepaint, vars.head_prepaint));
  const includeSiteScript = !isOff(firstValue(vars.site_script, vars.head_site_script));
  const stylesheetMode = parseStylesheetMode(firstValue(vars.stylesheet_mode, vars.site_stylesheet_mode, 'full'));
  const stylesheetHref = firstValue(vars.stylesheet, vars.site_stylesheet, '/public/css/style.css');
  const siteScriptSrc = firstValue(vars.site_script_src, vars.site_runtime, '/public/js/site.js');
  const scopedStylesheets = stylesheetMode === 'scoped'
    ? resolveRouteStylesheets({
      surface: firstValue(vars.surface, vars.spw_surface),
      // data-spw-features is space-separated (same as helpers.splitList / body attrs).
      features: normalizeContent(firstValue(vars.features, vars.spw_features))
        .split(/\s+/)
        .filter(Boolean),
      extraStyles: splitList(vars.extra_styles),
      mode: 'scoped',
    })
    : null;

  return [
    `    <title>${htmlEscape(title)}</title>`,
    '    <meta charset="utf-8" />',
    '    <meta content="width=device-width, initial-scale=1" name="viewport" />',
    '    <meta content="#1a9999" name="theme-color" />',
    '    <meta content="yes" name="apple-mobile-web-app-capable" />',
    '    <meta content="black-translucent" name="apple-mobile-web-app-status-bar-style" />',
    '    <meta content="Spwashi" name="apple-mobile-web-app-title" />',
    `    <meta name="description" content="${attrEscape(description)}" />`,
    robots ? `    <meta name="robots" content="${attrEscape(robots)}" />` : '',
    `    <meta name="spw:locale" content="${attrEscape(locale)}" />`,
    `    <meta name="spw:source-locale" content="${attrEscape(sourceLocale)}" />`,
    '',
    preconnectLinks,
    modulePreloadLinks,
    '',
    '    <link href="/favicon.ico" rel="icon" type="image/x-icon" sizes="any" />',
    '    <link href="/public/images/apple-touch-icon.png" rel="apple-touch-icon" />',
    '    <link href="/manifest.webmanifest" rel="manifest" />',
    includePrepaint ? renderSettingsPreflightScript() : '',
    scopedStylesheets
      ? renderStylesheetLinks(scopedStylesheets, '    ')
      : `    <link href="${attrEscape(stylesheetHref)}" rel="stylesheet" />`,
    scopedStylesheets ? '' : extraStyles,
    '',
    analyticsScript,
    includeSiteScript ? `    <script src="${attrEscape(siteScriptSrc)}" type="module"></script>` : '',
    extraScripts,
    '',
    `    <link href="${attrEscape(canonical)}" rel="canonical" />`,
    alternateLocaleLinks,
    '',
    '    <meta content="website" property="og:type" />',
    '    <meta content="Spwashi" property="og:site_name" />',
    `    <meta content="${attrEscape(ogTitle)}" property="og:title" />`,
    `    <meta content="${attrEscape(ogDescription)}" property="og:description" />`,
    `    <meta content="${attrEscape(canonical)}" property="og:url" />`,
    `    <meta content="${attrEscape(localeToOgLocale(locale))}" property="og:locale" />`,
    `    <meta content="${attrEscape(ogImage)}" property="og:image" />`,
    `    <meta content="${attrEscape(ogImageAlt)}" property="og:image:alt" />`,
    '    <meta content="1200" property="og:image:width" />',
    '    <meta content="630" property="og:image:height" />',
    '',
    '    <meta content="summary_large_image" name="twitter:card" />',
    `    <meta content="${attrEscape(ogTitle)}" name="twitter:title" />`,
    `    <meta content="${attrEscape(ogDescription)}" name="twitter:description" />`,
    `    <meta content="${attrEscape(ogImage)}" name="twitter:image" />`,
    `    <meta content="${attrEscape(ogImageAlt)}" name="twitter:image:alt" />`,
    keywords ? `    <meta name="keywords" content="${attrEscape(keywords)}" />` : '',
    '',
    pageJsonLd,
    breadcrumbs,
  ].filter((line) => line !== '').join('\n');
}

function renderSiteHeader(vars) {
  const current = firstValue(vars.current, vars.header_current, vars.nav_current, vars.breadcrumb_label);
  const currentHref = normalizeUrlPath(firstValue(vars.current_href, vars.header_current_href, vars.canonical));
  const indicator = firstValue(vars.indicator, vars.header_indicator, current).toLowerCase();
  const annotation = firstValue(vars.annotation, vars.header_annotation, vars.guide, vars.header_guide);
  const configuredNavItems = parseKeyedList(firstValue(vars.nav_items, vars.header_nav, vars.primary_nav));
  const navSource = configuredNavItems.length
    ? configuredNavItems.map(({ key, content }) => ({ label: key, href: content }))
    : PRIMARY_NAV_ITEMS;
  const relatedRoutes = firstValue(vars.related_routes, vars.spw_related_routes);
  const seed = firstValue(vars.seed, vars.header_seed);
  const contextRelevance = firstValue(vars.context_relevance, vars.header_context_relevance);
  const currentLabel = current.toLowerCase();
  const attrs = [
    'class="site-header"',
    'role="banner"',
    'data-spw-kind="shell"',
    'data-spw-role="routing"',
    'data-spw-category-family="portal"',
    'data-spw-template="site-header"',
    'data-spw-shell-microinteraction="pointer-field"',
    seed ? `data-spw-seed="${attrEscape(seed)}"` : '',
    relatedRoutes ? `data-spw-related-routes="${attrEscape(relatedRoutes)}"` : '',
    contextRelevance ? `data-spw-context-relevance="${attrEscape(contextRelevance)}"` : '',
    annotation ? `data-spw-header-annotation="${attrEscape(annotation)}"` : '',
  ].filter(Boolean).join(' ');
  const navItems = navSource.map((item) => {
    const hrefPath = normalizeUrlPath(item.href);
    const routeInfo = PRIMARY_NAV_ITEMS.find((route) => (
      normalizeUrlPath(route.href) === hrefPath
      || route.label.toLowerCase() === String(item.label || '').toLowerCase()
    ));
    const isCurrent = item.label.toLowerCase() === currentLabel || (currentHref && hrefPath === currentHref);
    const aria = isCurrent ? ' aria-current="page"' : '';
    const note = firstValue(item.note, routeInfo?.note);
    const noteAttrs = note
      ? ` title="${attrEscape(note)}" data-spw-route-note="${attrEscape(note)}" aria-label="${attrEscape(`${item.label}${isCurrent ? ', current page' : ''}. ${note}`)}"`
      : '';
    return `            <li><a${aria}${noteAttrs} href="${attrEscape(item.href)}">${htmlEscape(item.label)}</a></li>`;
  }).join('\n');

  return `<header ${attrs}>\n`
    + '    <div class="header-surface" aria-hidden="true" data-spw-layout-owner="header-surface"></div>\n'
    + '    <div class="header-brand">\n'
    + '        <a aria-label="Spwashi home" class="header-sigil" href="/" data-spw-operator="frame" data-spw-sigil="#&gt;spwashi" data-spw-semantic-expression="identity[brand]{route.home}">#&gt;spwashi</a>\n'
    + (annotation
      ? `        <button type="button" class="header-annotation" data-spw-annotation-handle data-spw-annotation-kind="${attrEscape(annotation)}" aria-label="Inspect ${attrEscape(annotation)} annotation">${htmlEscape(annotation)}</button>\n`
      : '')
    + '    </div>\n\n'
    + '    <nav aria-label="Primary">\n'
    + '        <ul>\n'
    + `${navItems}\n`
    + '        </ul>\n'
    + '    </nav>\n\n'
    + '    <div class="spw-header-actions" data-spw-feature="shell-primary-actions" data-spw-semantic-expression="shell[actions]{attention.cauldron.tune.search}">\n'
    + '        <button type="button" class="spw-header-action spw-header-action--search" data-spw-site-search-open data-spw-operator="probe" aria-label="Search routes (Control or Command K)" title="Search routes (Ctrl/⌘K)">Search</button>\n'
    + '        <a class="spw-header-action spw-header-action--cauldron" href="/play/#media-cauldron" data-spw-operator="action" data-spw-shell-action="open-media-cauldron" aria-label="Open saved fragments in the Media Cauldron">Cauldron</a>\n'
    + '        <button type="button" class="spw-attention-posture-pill" data-spw-shell-action="preview-attention-posture" data-spw-attention-posture="self-local-global" aria-label="Preview attention scope">\n'
    + '            <span class="spw-attention-posture-pill__kicker">Attention</span>\n'
    + '            <span class="spw-attention-posture-pill__value" data-spw-attention-posture-label>self / local / global</span>\n'
    + '        </button>\n'
    + '    </div>\n\n'
    + '    <span aria-hidden="true" class="header-op-indicator" data-header-op-slot>\n'
    + `        <span class="header-op-indicator__token">${htmlEscape(indicator)}</span>\n`
    + '    </span>\n'
    + '    <div class="spw-header-trace" data-spw-template-slot="header-trace"></div>\n'
    + '</header>';
}

function bodyScopeVarsFromDocument(text) {
  const bodyMatch = text.match(/<body\b([^>]*)>/i);
  if (!bodyMatch?.[1]) return {};
  const attrs = parseAttrs(bodyMatch[1]);
  const surface = normalizeContent(attrs['data-spw-surface']);
  const features = normalizeContent(attrs['data-spw-features']);
  const stylesheetMode = normalizeContent(attrs['data-spw-stylesheet-mode']);
  const extraStyles = normalizeContent(attrs['data-spw-extra-styles']);
  const vars = {};
  if (surface) {
    vars.surface = surface;
    vars.spw_surface = surface;
  }
  if (features) {
    vars.features = features;
    vars.spw_features = features;
  }
  if (stylesheetMode) {
    vars.stylesheet_mode = stylesheetMode;
    vars.site_stylesheet_mode = stylesheetMode;
  }
  if (extraStyles) vars.extra_styles = extraStyles;
  return vars;
}

async function expandSiteDirectives(text, scopeVars, warnings) {
  const bodyScope = bodyScopeVarsFromDocument(text);
  let output = text.replace(cloneRegex(SPW_SITE_HEAD_RE), (_match, attrString) => {
    // Body data-spw-stylesheet-mode/surface/features drive scoped CSS for spw-site-head pages.
    const vars = mergeScopeVars(
      mergeScopeVars(bodyScope, scopeVars, warnings),
      parseAttrs(attrString),
      warnings,
    );
    return renderSiteHead(vars);
  });

  output = output.replace(cloneRegex(SPW_SITE_HEADER_RE), (_match, attrString) => {
    const vars = mergeScopeVars(scopeVars, parseAttrs(attrString), warnings);
    return renderSiteHeader(vars);
  });

  if (/<spw-site-footer\b/i.test(output)) {
    const footerTemplate = await loadSiteFooterTemplate();
    output = output.replace(cloneRegex(SPW_SITE_FOOTER_RE), (_match, attrString) => {
      const vars = mergeScopeVars(scopeVars, parseAttrs(attrString), warnings);
      return substituteVars(footerTemplate, vars, warnings);
    });
  }

  return output;
}

function mergeHtmlAttributes(existingAttrs, nextAttrs) {
  const attrs = { ...parseAttrs(existingAttrs) };
  for (const [key, value] of Object.entries(nextAttrs)) {
    const normalized = normalizeContent(value);
    if (!normalized) continue;
    attrs[key] = normalized;
  }

  return Object.entries(attrs)
    .map(([key, value]) => ` ${key}="${attrEscape(value)}"`)
    .join('');
}

/**
 * Resolve page-family personality defaults (layout / wonder / modes).
 * Exported for migration tooling and contracts.
 */
export { PAGE_FAMILY_PERSONALITY };

export function resolvePageFamilyPersonality(pageFamily = '') {
  const family = normalizePageFamily(pageFamily);
  if (!family) return null;
  return PAGE_FAMILY_PERSONALITY[family] || null;
}

export function listPageFamilyPersonalities() {
  return { ...PAGE_FAMILY_PERSONALITY };
}

/**
 * Build body data-spw-* fills from spw-page vars + page-family personality.
 * Never overwrites an authored body attribute (missingOnly).
 */
function buildBodyPersonalityAttrs(vars, existingBodyAttrs = {}) {
  const next = {};
  const has = (attr) => Boolean(normalizeContent(existingBodyAttrs[attr]));

  for (const [varName, attr] of PAGE_VAR_BODY_ATTRS) {
    if (has(attr)) continue;
    const raw = firstValue(vars[varName]);
    if (!raw) continue;
    if (attr === 'data-spw-related-routes') next[attr] = normalizeRelatedRoutes(raw);
    else if (
      attr === 'data-spw-features'
      || attr === 'data-spw-wonder'
      || attr === 'data-spw-route-family'
      || attr === 'data-spw-page-modes'
    ) {
      next[attr] = normalizeTokenList(raw);
    } else if (attr === 'data-spw-page-family') {
      next[attr] = normalizePageFamily(raw);
    } else {
      next[attr] = normalizeContent(raw);
    }
  }

  // Personality defaults for layout / density / context / wonder / modes when still missing
  const family = normalizePageFamily(
    next['data-spw-page-family']
    || existingBodyAttrs['data-spw-page-family']
    || vars.page_family
    || '',
  );
  const personality = resolvePageFamilyPersonality(family);
  if (personality) {
    if (!has('data-spw-layout') && !next['data-spw-layout'] && personality.layout) {
      next['data-spw-layout'] = personality.layout;
    }
    if (!has('data-spw-density') && !next['data-spw-density'] && personality.density) {
      next['data-spw-density'] = personality.density;
    }
    if (!has('data-spw-context') && !next['data-spw-context'] && personality.context) {
      next['data-spw-context'] = personality.context;
    }
    if (!has('data-spw-wonder') && !next['data-spw-wonder'] && personality.wonder) {
      next['data-spw-wonder'] = personality.wonder;
    }
    if (!has('data-spw-page-modes') && !next['data-spw-page-modes'] && personality.modes) {
      next['data-spw-page-modes'] = personality.modes;
    }
  }

  // Default scoped stylesheets for templated public routes when unspecified
  if (!has('data-spw-stylesheet-mode') && !next['data-spw-stylesheet-mode']) {
    const mode = firstValue(vars.stylesheet_mode, vars.site_stylesheet_mode);
    if (mode) next['data-spw-stylesheet-mode'] = normalizeContent(mode);
  }

  return next;
}

function normalizeExistingBodySemanticAttrs(existingBodyAttrs = {}) {
  const next = {};
  for (const [attr, value] of Object.entries(existingBodyAttrs)) {
    if (!attr.startsWith('data-spw-')) continue;
    const raw = normalizeContent(value);
    if (!raw) continue;
    if (attr === 'data-spw-related-routes') next[attr] = normalizeRelatedRoutes(raw);
    else if (
      attr === 'data-spw-features'
      || attr === 'data-spw-wonder'
      || attr === 'data-spw-route-family'
      || attr === 'data-spw-page-modes'
    ) {
      next[attr] = normalizeTokenList(raw);
    } else if (attr === 'data-spw-page-family') {
      next[attr] = normalizePageFamily(raw);
    }
  }
  return next;
}

function applyPageDocumentAttributes(source, vars) {
  if (!/<html\b/i.test(source)) return source;

  let output = source;
  const lang = normalizeLocaleCode(firstValue(vars.lang, vars.locale));
  const dir = firstValue(vars.dir, vars.text_direction);
  if (lang || dir) {
    output = output.replace(HTML_OPEN_RE, (_match, attrs) => `<html${mergeHtmlAttributes(attrs || '', { lang, dir })}>`);
  }

  if (BODY_OPEN_RE.test(output)) {
    output = output.replace(BODY_OPEN_RE, (_match, attrs) => {
      const existing = parseAttrs(attrs || '');
      const normalizedExisting = normalizeExistingBodySemanticAttrs(existing);
      const fills = buildBodyPersonalityAttrs(vars, { ...existing, ...normalizedExisting });
      const merged = { ...normalizedExisting, ...fills };
      return `<body${mergeHtmlAttributes(attrs || '', merged)}>`;
    });
  }

  return output;
}

function parseDocumentSemanticMeta(source) {
  const htmlMatch = source.match(HTML_OPEN_RE);
  const bodyMatch = source.match(BODY_OPEN_RE);
  if (!bodyMatch) return [];

  const htmlAttrs = htmlMatch ? parseAttrs(htmlMatch[1]) : {};
  const bodyAttrs = parseAttrs(bodyMatch[1]);
  const entries = [];

  for (const field of DERIVED_META_FIELDS) {
    const rawValue = bodyAttrs[field.attr];
    const value = normalizeContent(rawValue);
    if (!value) continue;
    entries.push({
      metaName: field.metaName,
      propertyName: field.propertyName,
      value,
    });
  }

  const sourceLocale = normalizeLocaleCode(bodyAttrs['data-spw-source-locale'] || htmlAttrs['data-spw-source-locale']);
  if (sourceLocale) {
    entries.push({
      metaName: 'spw:source-locale',
      propertyName: 'spwSourceLocale',
      value: sourceLocale,
    });
  }

  const lang = normalizeLocaleCode(htmlAttrs.lang);
  if (lang) {
    entries.push({
      property: 'og:locale',
      value: localeToOgLocale(lang),
    });
    entries.push({
      metaName: 'spw:locale',
      propertyName: 'spwLocale',
      value: lang,
    });
  }

  return entries;
}

function hasMetaTag(headHtml, { metaName, property }) {
  if (metaName) {
    const pattern = new RegExp(`<meta\\b[^>]*\\bname=["']${metaName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
    return pattern.test(headHtml);
  }
  if (property) {
    const pattern = new RegExp(`<meta\\b[^>]*\\bproperty=["']${property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
    return pattern.test(headHtml);
  }
  return false;
}

function injectDerivedMetaTags(source, entries) {
  if (!entries.length || !HEAD_CLOSE_RE.test(source)) return source;

  const headCloseMatch = source.match(HEAD_CLOSE_RE);
  if (!headCloseMatch || headCloseMatch.index == null) return source;

  const headSegment = source.slice(0, headCloseMatch.index);
  const derivedTags = entries
    .filter((entry) => !hasMetaTag(headSegment, entry))
    .map((entry) => {
      if (entry.property) {
        return `    <meta property="${entry.property}" content="${htmlEscape(entry.value)}"/>`;
      }
      return `    <meta name="${entry.metaName}" content="${htmlEscape(entry.value)}"/>`;
    });

  if (!derivedTags.length) return source;

  return source.replace(HEAD_CLOSE_RE, `${derivedTags.join('\n')}\n</head>`);
}

function enrichPageJsonLd(source, entries, warnings) {
  if (!entries.length) return source;

  return source.replace(PAGE_JSON_LD_RE, (fullMatch, jsonSource) => {
    let parsed;
    try {
      parsed = JSON.parse(jsonSource.trim());
    } catch (error) {
      warnings.push(`unable to parse page json-ld for metadata enrichment: ${error.message}`);
      return fullMatch;
    }

    const additionalProperty = Array.isArray(parsed.additionalProperty) ? [...parsed.additionalProperty] : [];
    const knownNames = new Set(
      additionalProperty
        .map((item) => (item && typeof item.name === 'string' ? item.name : null))
        .filter(Boolean),
    );

    let changed = false;
    for (const entry of entries) {
      if (!entry.propertyName || knownNames.has(entry.propertyName)) continue;
      additionalProperty.push({
        '@type': 'PropertyValue',
        name: entry.propertyName,
        value: entry.value,
      });
      knownNames.add(entry.propertyName);
      changed = true;
    }

    if (!changed) return fullMatch;

    parsed.additionalProperty = additionalProperty;
    return fullMatch.replace(jsonSource, `\n${escapeJsonForScript(parsed)}\n`);
  });
}

function enhanceHtmlMetadata(source, warnings) {
  if (!/<html\b/i.test(source) || !/<head\b/i.test(source) || !/<body\b/i.test(source)) {
    return source;
  }

  const entries = parseDocumentSemanticMeta(source);
  if (!entries.length) return source;

  let output = injectDerivedMetaTags(source, entries);
  output = enrichPageJsonLd(output, entries, warnings);
  return output;
}

/**
 * Render a template source string to HTML.
 * Returns `{ output, vars, warnings, ms }`. If the source is not a template,
 * `output === source` unchanged (still may inject scoped CSS / PWA / preflight).
 */
export async function renderTemplate(source, { sourceLabel = '<string>' } = {}) {
  const started = performance.now();
  const warnings = [];
  if (!shouldProcess(source)) {
    templateStats.passthrough += 1;
    const output = enhanceHtmlMetadata(
      injectPwaManifestLink(applyScopedStylesheets(injectSettingsPreflight(source))),
      warnings,
    );
    const ms = Math.round(performance.now() - started);
    templateStats.renderMs += ms;
    return { output, vars: {}, warnings, ms };
  }
  templateStats.renders += 1;
  const { vars: rawVars, rest } = extractPageVars(source);
  // Normalize common spw-page vars once so head/header/body share the same tokens
  const vars = { ...rawVars };
  if (vars.page_family) vars.page_family = normalizePageFamily(vars.page_family);
  if (vars.features || vars.spw_features) {
    const features = normalizeTokenList(firstValue(vars.features, vars.spw_features));
    vars.features = features;
    vars.spw_features = features;
  }
  if (vars.wonder) vars.wonder = normalizeTokenList(vars.wonder);
  if (vars.route_family) vars.route_family = normalizeTokenList(vars.route_family);
  if (vars.page_modes) vars.page_modes = normalizeTokenList(vars.page_modes);
  if (vars.related_routes) vars.related_routes = normalizeRelatedRoutes(vars.related_routes);
  if (vars.canonical) {
    try {
      const url = new URL(vars.canonical, 'https://spwashi.com');
      if (url.pathname && !url.pathname.endsWith('/')) {
        url.pathname = `${url.pathname}/`;
      }
      vars.canonical = url.href;
    } catch {
      // leave canonical as authored
    }
  }
  const expanded = await expandIncludes(rest, vars, 0, new Set(), warnings);
  const withSiteDirectives = await expandSiteDirectives(expanded, vars, warnings);
  const withPageAttrs = applyPageDocumentAttributes(withSiteDirectives, vars);
  const substituted = substituteVars(withPageAttrs, vars, warnings);
  const withPreflight = isOff(firstValue(vars.prepaint, vars.head_prepaint))
    ? substituted
    : injectSettingsPreflight(substituted);
  const output = enhanceHtmlMetadata(
    injectPwaManifestLink(applyScopedStylesheets(withPreflight)),
    warnings,
  );
  if (warnings.length) {
    for (const w of warnings) {
      console.warn(`[template] ${sourceLabel}: ${w}`);
    }
  }
  const ms = Math.round(performance.now() - started);
  templateStats.renderMs += ms;
  return { output, vars, warnings, ms };
}

export async function renderTemplateFile(absPath) {
  const source = await fs.readFile(absPath, 'utf8');
  return renderTemplate(source, { sourceLabel: path.relative(REPO_ROOT, absPath) });
}

export const TEMPLATE_INTERNALS = {
  PARTIALS_DIR,
  SPW_PAGE_RE,
  SPW_INCLUDE_RE,
  SPW_SITE_HEAD_RE,
  SPW_SITE_HEADER_RE,
  SPW_SITE_FOOTER_RE,
  VAR_RE,
  PAGE_FAMILY_PERSONALITY,
  PAGE_VAR_BODY_ATTRS,
  normalizeTokenList,
  normalizeRelatedRoutes,
  normalizePageFamily,
  normalizeUrlPath,
};
