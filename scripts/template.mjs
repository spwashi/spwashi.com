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
 *
 *   <spw-site-header current="Settings" indicator="settings"></spw-site-header>
 *     Generates the primary navigation chrome from compact route metadata.
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

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const PARTIALS_DIR = path.join(REPO_ROOT, '_partials');

const SPW_PAGE_RE = /<spw-page\b([^>]*?)(?:\/>|>\s*<\/spw-page>)/i;
const SPW_INCLUDE_RE = /<spw-include\b([^>]*?)(?:\/>|>\s*<\/spw-include>)/gi;
const SPW_SITE_HEAD_RE = /<spw-site-head\b([^>]*?)(?:\/>|>\s*<\/spw-site-head>)/gi;
const SPW_SITE_HEADER_RE = /<spw-site-header\b([^>]*?)(?:\/>|>\s*<\/spw-site-header>)/gi;
const ATTR_RE = /([a-zA-Z][a-zA-Z0-9_:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/g;
const VAR_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*\}\}/g;
const HTML_OPEN_RE = /<html\b([^>]*)>/i;
const BODY_OPEN_RE = /<body\b([^>]*)>/i;
const HEAD_CLOSE_RE = /<\/head>/i;
const PAGE_JSON_LD_RE = /<script\b(?=[^>]*type=["']application\/ld\+json["'])(?=[^>]*data-spw-generated=["']page["'])[^>]*>([\s\S]*?)<\/script>/i;
const MAX_INCLUDE_DEPTH = 8;

const PRIMARY_NAV_ITEMS = Object.freeze([
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/topics/', label: 'Topics' },
  { href: '/topics/software/', label: 'Software' },
  { href: '/topics/math/', label: 'Math' },
  { href: '/blog/', label: 'Blog' },
  { href: '/about/domains/lore.land/', label: 'lore.land' },
  { href: '/settings/', label: 'Settings' },
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

function parseAttrs(attrString) {
  const out = {};
  const attrRe = cloneRegex(ATTR_RE);
  let match;
  while ((match = attrRe.exec(attrString)) !== null) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    out[name] = value;
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
    let partial;
    try {
      partial = await fs.readFile(partialPath, 'utf8');
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
    || /<spw-site-header\b/i.test(text);
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
    return new URL(normalized, 'https://spwashi.com').pathname.replace(/\/+$/, '/') || '/';
  } catch {
    return normalized.replace(/\/+$/, '/') || '/';
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
  const locale = normalizeLocaleCode(firstValue(vars.locale, vars.lang, 'en'));
  const sourceLocale = normalizeLocaleCode(firstValue(vars.source_locale, vars.source_lang, locale));
  const alternateLocaleLinks = renderAlternateLocaleLinks(vars);
  const extraStyles = renderExtraStyles(vars.extra_styles);
  const extraScripts = renderExtraScripts(vars.extra_scripts);
  const pageJsonLd = renderPageJsonLd(vars);
  const breadcrumbs = renderBreadcrumbJsonLd(vars);

  return [
    `    <title>${htmlEscape(title)}</title>`,
    '    <meta charset="utf-8" />',
    '    <meta content="width=device-width, initial-scale=1" name="viewport" />',
    '    <meta content="#1a9999" name="theme-color" />',
    '    <meta content="yes" name="apple-mobile-web-app-capable" />',
    '    <meta content="black-translucent" name="apple-mobile-web-app-status-bar-style" />',
    '    <meta content="Spwashi" name="apple-mobile-web-app-title" />',
    `    <meta name="description" content="${attrEscape(description)}" />`,
    `    <meta name="spw:locale" content="${attrEscape(locale)}" />`,
    `    <meta name="spw:source-locale" content="${attrEscape(sourceLocale)}" />`,
    '',
    '    <link href="/favicon.ico" rel="icon" sizes="32x32" />',
    '    <link href="/public/images/favicon.svg" rel="icon" type="image/svg+xml" />',
    '    <link href="/public/images/apple-touch-icon.png" rel="apple-touch-icon" />',
    '    <link href="/manifest.webmanifest" rel="manifest" />',
    '    <link href="/public/css/style.css?v=0.0.2" rel="stylesheet" />',
    extraStyles,
    '',
    '    <script data-domain="spwashi.com" defer src="https://plausible.io/js/script.js"></script>',
    '    <script src="/public/js/site.js?v=0.0.2" type="module"></script>',
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
  ].filter(Boolean).join(' ');
  const navItems = PRIMARY_NAV_ITEMS.map((item) => {
    const hrefPath = normalizeUrlPath(item.href);
    const isCurrent = item.label.toLowerCase() === currentLabel || (currentHref && hrefPath === currentHref);
    const aria = isCurrent ? ' aria-current="page"' : '';
    return `            <li><a${aria} href="${attrEscape(item.href)}">${htmlEscape(item.label)}</a></li>`;
  }).join('\n');

  return `<header ${attrs}>\n`
    + '    <a aria-label="Spwashi home" class="header-sigil" href="/">#&gt;spwashi</a>\n\n'
    + '    <nav aria-label="Primary">\n'
    + '        <ul>\n'
    + `${navItems}\n`
    + '        </ul>\n'
    + '    </nav>\n\n'
    + `    <span aria-hidden="true" class="header-op-indicator" data-header-op-slot>${htmlEscape(indicator)}</span>\n`
    + '</header>';
}

function expandSiteDirectives(text, scopeVars, warnings) {
  let output = text.replace(cloneRegex(SPW_SITE_HEAD_RE), (_match, attrString) => {
    const vars = mergeScopeVars(scopeVars, parseAttrs(attrString), warnings);
    return renderSiteHead(vars);
  });

  output = output.replace(cloneRegex(SPW_SITE_HEADER_RE), (_match, attrString) => {
    const vars = mergeScopeVars(scopeVars, parseAttrs(attrString), warnings);
    return renderSiteHeader(vars);
  });

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

function applyPageDocumentAttributes(source, vars) {
  if (!/<html\b/i.test(source)) return source;

  const lang = normalizeLocaleCode(firstValue(vars.lang, vars.locale));
  const dir = firstValue(vars.dir, vars.text_direction);
  if (!lang && !dir) return source;

  return source.replace(HTML_OPEN_RE, (_match, attrs) => `<html${mergeHtmlAttributes(attrs || '', { lang, dir })}>`);
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
 * Returns `{ output, vars, warnings }`. If the source is not a template,
 * `output === source` unchanged.
 */
export async function renderTemplate(source, { sourceLabel = '<string>' } = {}) {
  const warnings = [];
  if (!shouldProcess(source)) {
    return { output: enhanceHtmlMetadata(source, warnings), vars: {}, warnings };
  }
  const { vars, rest } = extractPageVars(source);
  const expanded = await expandIncludes(rest, vars, 0, new Set(), warnings);
  const withSiteDirectives = expandSiteDirectives(expanded, vars, warnings);
  const withPageAttrs = applyPageDocumentAttributes(withSiteDirectives, vars);
  const output = enhanceHtmlMetadata(substituteVars(withPageAttrs, vars, warnings), warnings);
  if (warnings.length) {
    for (const w of warnings) {
      console.warn(`[template] ${sourceLabel}: ${w}`);
    }
  }
  return { output, vars, warnings };
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
  VAR_RE,
};
