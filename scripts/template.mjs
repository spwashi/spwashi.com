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
const MAX_INCLUDE_DEPTH = 8;

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

/**
 * Render a template source string to HTML.
 * Returns `{ output, vars, warnings }`. If the source is not a template,
 * `output === source` unchanged.
 */
export async function renderTemplate(source, { sourceLabel = '<string>' } = {}) {
  if (!shouldProcess(source)) {
    return { output: source, vars: {}, warnings: [] };
  }
  const warnings = [];
  const { vars, rest } = extractPageVars(source);
  const expanded = await expandIncludes(rest, vars, 0, new Set(), warnings);
  const output = substituteVars(expanded, vars, warnings);
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
