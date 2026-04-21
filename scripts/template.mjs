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
const ATTR_RE = /([a-zA-Z][a-zA-Z0-9_:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/g;
const VAR_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*\}\}/g;
const HTML_OPEN_RE = /<html\b([^>]*)>/i;
const BODY_OPEN_RE = /<body\b([^>]*)>/i;
const HEAD_CLOSE_RE = /<\/head>/i;
const PAGE_JSON_LD_RE = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*data-spw-generated=["']page["'][^>]*>([\s\S]*?)<\/script>/i;
const MAX_INCLUDE_DEPTH = 8;

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
  return /<spw-page\b/i.test(text) || /<spw-include\b/i.test(text);
}

function escapeJsonForScript(value) {
  return JSON.stringify(value, null, 8).replace(/</g, '\\u003c');
}

function normalizeContent(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
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

  const lang = normalizeContent(htmlAttrs.lang);
  if (lang) {
    entries.push({
      property: 'og:locale',
      value: lang.toLowerCase() === 'en' ? 'en_US' : lang,
    });
    entries.push({
      metaName: 'spw:lang',
      propertyName: 'spwLang',
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
  const output = enhanceHtmlMetadata(substituteVars(expanded, vars, warnings), warnings);
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
  VAR_RE,
};
