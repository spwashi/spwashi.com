#!/usr/bin/env node
/**
 * Design catalog — traceability across site-specific surfaces.
 *
 * Scans:
 *   every *.css  (CSS selectors reading data-spw-*, --token defs, var() reads)
 *   every *.html (data-spw-* attribute usages with literal values)
 *   every *.js / *.mjs outside scripts/ (dataset.spw* writes, setAttribute)
 *   every *.spw  (prose that names attributes or tokens — philosophy links)
 *
 * Emits:
 *   design/catalog/catalog.json   machine-readable cross-reference
 *   design/catalog/catalog.css    catalog-only chrome (added to style)
 *   design/catalog/index.html     literate, navigable view
 *
 * Output lives under design/ because that's the design hub; the scan stays
 * scoped to the site rather than the installed workbench/tooling subtree.
 * Zero deps.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_OUT_DIR = path.join(ROOT_DIR, 'design', 'catalog');

const IGNORED_SEGMENTS = new Set([
  '.agents',
  '.git',
  '.github',
  '.idea',
  '00.unsorted',
  'dist',
  'node_modules',
]);

const CSS_SELECTOR_ATTR_RE = /\[data-spw-([a-z0-9-]+)(?:(~|\||\*|\^|\$)?=\s*("([^"]*)"|'([^']*)'|([^\]\s]+)))?\s*(?:i|s)?\s*\]/g;
const CSS_VAR_DEF_RE = /^\s*(--[a-z0-9-]+)\s*:/gim;
const CSS_VAR_REF_RE = /var\(\s*(--[a-z0-9-]+)/g;
const AT_PROPERTY_RE = /@property\s+(--[a-z0-9-]+)\s*\{([^}]*)\}/g;
const LAYER_IMPORT_RE = /@import\s+(?:url\(\s*)?['"]([^'"]+)['"]\s*\)?\s+layer\(([a-z0-9_-]+)\)/g;

const DATA_SPW_ATTR_NAME_RE = /^data-spw-[a-z0-9-]+$/;
const DOC_ATTR_RE = /data-spw-([a-z0-9-]+)/g;
const DOC_TOKEN_RE = /(--[a-z][a-z0-9-]{2,})/g;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function relRepo(absPath) {
  return toPosix(path.relative(ROOT_DIR, absPath));
}

function parseArgs(argv) {
  const options = {
    outDir: DEFAULT_OUT_DIR,
    check: false,
    quiet: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--out' && argv[index + 1]) {
      options.outDir = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith('--out=')) {
      options.outDir = path.resolve(arg.slice('--out='.length));
      continue;
    }

    if (arg === '--check') {
      options.check = true;
      continue;
    }

    if (arg === '--quiet') {
      options.quiet = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    throw new Error(`[catalog] unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/generate-design-catalog.mjs [options]

Options:
  --out <dir>     Output directory. Default: design/catalog
  --check         Do not write files; fail if generated files differ.
  --quiet         Suppress summary output.
  -h, --help      Show this help.
`);
}

function getGeneratedAt() {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) {
    return new Date(Number(epoch) * 1000).toISOString();
  }

  return new Date().toISOString();
}

function esc(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[char]));
}

function decodeHtmlAttribute(value) {
  const named = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };

  return String(value).replace(/&(#x[\da-f]+|#\d+|[a-z][a-z0-9]+);/gi, (match, entity) => {
    const normalized = entity.toLowerCase();

    if (normalized.startsWith('#x')) {
      const codepoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codepoint) ? String.fromCodePoint(codepoint) : match;
    }

    if (normalized.startsWith('#')) {
      const codepoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codepoint) ? String.fromCodePoint(codepoint) : match;
    }

    return Object.prototype.hasOwnProperty.call(named, normalized)
      ? named[normalized]
      : match;
  });
}

function shouldIgnoreRelativePath(relativePath, outputRelativePath = 'design/catalog') {
  const normalizedPath = toPosix(relativePath).replace(/^\/+/, '');
  if (!normalizedPath) return false;

  const segments = normalizedPath.split('/');
  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) return true;
  if (normalizedPath === '.spw/_workbench' || normalizedPath.startsWith('.spw/_workbench/')) return true;

  if (
    outputRelativePath
    && (normalizedPath === outputRelativePath || normalizedPath.startsWith(`${outputRelativePath}/`))
  ) {
    return true;
  }

  return false;
}

async function walk(dir, options = {}) {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  entries.sort((a, b) => a.name.localeCompare(b.name));

  const files = [];

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = relRepo(abs);

    if (shouldIgnoreRelativePath(rel, options.outputRelativePath)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.spw') continue;
    if (entry.isSymbolicLink()) continue;

    if (entry.isDirectory()) {
      files.push(...await walk(abs, options));
    } else if (entry.isFile()) {
      files.push(abs);
    }
  }

  return files;
}

function lineOf(text, index) {
  let line = 1;

  for (let cursor = 0; cursor < index && cursor < text.length; cursor += 1) {
    if (text.charCodeAt(cursor) === 10) line += 1;
  }

  return line;
}

function camelSpwToDataAttr(camel) {
  const rest = camel.slice(3);
  const dashed = rest.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `data-spw${dashed.startsWith('-') ? dashed : `-${dashed}`}`;
}

function extractFileHeaderDoc(text) {
  const match = text.match(/^\s*\/\*([\s\S]*?)\*\//);
  if (!match) return null;

  return match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*\*+\s?/, '').replace(/^\s*={3,}.*$/, '').trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 600);
}

async function readTextFile(absPath) {
  return fs.readFile(absPath, 'utf8');
}

async function readOptionalTextFile(absPath, fallback = '') {
  try {
    return await readTextFile(absPath);
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

function buildFileToLayer(styleCss) {
  const map = new Map();

  for (const match of styleCss.matchAll(LAYER_IMPORT_RE)) {
    const [, url, layer] = match;
    const rel = url.replace(/^\//, '');
    map.set(rel, layer);
  }

  return map;
}

function ensureAttr(attributes, name) {
  let entry = attributes.get(name);

  if (!entry) {
    entry = {
      name,
      cssSelectors: [],
      valuesInCss: new Set(),
      htmlUsage: [],
      valuesInHtml: new Set(),
      jsWrites: [],
      docMentions: [],
    };
    attributes.set(name, entry);
  }

  return entry;
}

function ensureToken(tokens, name) {
  let tokenEntry = tokens.get(name);

  if (!tokenEntry) {
    tokenEntry = {
      name,
      definitions: [],
      consumers: [],
      syntax: null,
      initialValue: null,
      inherits: null,
    };
    tokens.set(name, tokenEntry);
  }

  return tokenEntry;
}

function findStartTags(html) {
  const tags = [];
  const openTagRe = /<\s*([a-z][a-z0-9:-]*)\b/gi;

  let match;
  while ((match = openTagRe.exec(html))) {
    const start = match.index;
    const tagName = match[1].toLowerCase();
    let index = openTagRe.lastIndex;
    let quote = null;

    for (; index < html.length; index += 1) {
      const char = html[index];

      if (quote) {
        if (char === quote) quote = null;
        continue;
      }

      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }

      if (char === '>') break;
    }

    if (index >= html.length) break;

    tags.push({
      name: tagName,
      source: html.slice(start, index + 1),
      index: start,
    });

    openTagRe.lastIndex = index + 1;
  }

  return tags;
}

function parseTagAttributes(tagSource) {
  const attrs = new Map();
  let index = 0;

  if (tagSource[index] === '<') index += 1;
  while (index < tagSource.length && /\s/.test(tagSource[index])) index += 1;

  while (index < tagSource.length && !/[\s/>]/.test(tagSource[index])) index += 1;

  while (index < tagSource.length) {
    while (index < tagSource.length && /\s/.test(tagSource[index])) index += 1;
    if (tagSource[index] === '>' || (tagSource[index] === '/' && tagSource[index + 1] === '>')) break;

    const nameStart = index;
    while (index < tagSource.length && !/[\s=/>]/.test(tagSource[index])) index += 1;

    const name = tagSource.slice(nameStart, index).trim().toLowerCase();
    if (!name) break;

    while (index < tagSource.length && /\s/.test(tagSource[index])) index += 1;

    let value = '';

    if (tagSource[index] === '=') {
      index += 1;
      while (index < tagSource.length && /\s/.test(tagSource[index])) index += 1;

      const quote = tagSource[index];

      if (quote === '"' || quote === "'") {
        index += 1;
        const valueStart = index;
        while (index < tagSource.length && tagSource[index] !== quote) index += 1;
        value = tagSource.slice(valueStart, index);
        if (tagSource[index] === quote) index += 1;
      } else {
        const valueStart = index;
        while (index < tagSource.length && !/[\s>]/.test(tagSource[index])) index += 1;
        value = tagSource.slice(valueStart, index);
      }
    }

    attrs.set(name, decodeHtmlAttribute(value));
  }

  return attrs;
}

function collectHtmlDataSpwAttributes(html) {
  const usages = [];

  for (const tag of findStartTags(html)) {
    const attrs = parseTagAttributes(tag.source);

    for (const [name, value] of attrs.entries()) {
      if (!DATA_SPW_ATTR_NAME_RE.test(name)) continue;

      usages.push({
        name,
        value: value || null,
        line: lineOf(html, tag.index),
      });
    }
  }

  return usages;
}

function collectJsDataSpwWrites(text) {
  const writes = [];

  const dotDatasetRe = /\.dataset\.(spw[A-Za-z0-9]+)\s*=/g;
  for (const match of text.matchAll(dotDatasetRe)) {
    writes.push({
      name: camelSpwToDataAttr(match[1]),
      line: lineOf(text, match.index),
      snippet: match[0],
    });
  }

  const bracketDatasetRe = /\.dataset\[\s*['"](spw[A-Za-z0-9]+)['"]\s*\]\s*=/g;
  for (const match of text.matchAll(bracketDatasetRe)) {
    writes.push({
      name: camelSpwToDataAttr(match[1]),
      line: lineOf(text, match.index),
      snippet: match[0],
    });
  }

  const setAttributeRe = /setAttribute\(\s*['"](data-spw-[a-z0-9-]+)['"]\s*,/g;
  for (const match of text.matchAll(setAttributeRe)) {
    writes.push({
      name: match[1],
      line: lineOf(text, match.index),
      snippet: match[0],
    });
  }

  return writes;
}

async function parseCss(files, fileToLayer) {
  const attributes = new Map();
  const cssFiles = {};
  const tokens = new Map();

  for (const abs of files) {
    const rel = relRepo(abs);
    const text = await readTextFile(abs);
    const layer = fileToLayer.get(rel) || null;
    const header = extractFileHeaderDoc(text);
    const attrsHere = new Set();
    const tokensDefinedHere = [];
    const tokensConsumedHere = new Set();

    for (const match of text.matchAll(CSS_SELECTOR_ATTR_RE)) {
      const name = `data-spw-${match[1]}`;
      const value = match[4] ?? match[5] ?? match[6] ?? null;

      attrsHere.add(name);

      const entry = ensureAttr(attributes, name);
      entry.cssSelectors.push({
        file: rel,
        layer,
        line: lineOf(text, match.index),
        snippet: match[0],
        value,
      });

      if (value) entry.valuesInCss.add(decodeHtmlAttribute(value));
    }

    for (const match of text.matchAll(CSS_VAR_DEF_RE)) {
      const name = match[1];
      tokensDefinedHere.push(name);

      ensureToken(tokens, name).definitions.push({
        file: rel,
        layer,
        line: lineOf(text, match.index),
      });
    }

    for (const match of text.matchAll(AT_PROPERTY_RE)) {
      const [, name, body] = match;
      const tokenEntry = ensureToken(tokens, name);
      const syntaxMatch = body.match(/syntax\s*:\s*["']([^"']+)["']/);
      const initialMatch = body.match(/initial-value\s*:\s*([^;]+);?/);
      const inheritsMatch = body.match(/inherits\s*:\s*(true|false)/);

      tokenEntry.syntax = syntaxMatch ? syntaxMatch[1] : tokenEntry.syntax;
      tokenEntry.initialValue = initialMatch ? initialMatch[1].trim() : tokenEntry.initialValue;
      tokenEntry.inherits = inheritsMatch ? inheritsMatch[1] === 'true' : tokenEntry.inherits;

      const atPropLine = lineOf(text, match.index);
      if (!tokenEntry.definitions.some((definition) => definition.file === rel && definition.line === atPropLine)) {
        tokenEntry.definitions.push({file: rel, layer, line: atPropLine, registered: true});
      }
    }

    for (const match of text.matchAll(CSS_VAR_REF_RE)) {
      tokensConsumedHere.add(match[1]);
    }

    for (const tokenName of tokensConsumedHere) {
      ensureToken(tokens, tokenName).consumers.push({file: rel, layer});
    }

    cssFiles[rel] = {
      layer,
      header,
      attributesUsed: [...attrsHere].sort(),
      tokensDefined: [...new Set(tokensDefinedHere)].sort(),
      tokensConsumed: [...tokensConsumedHere].sort(),
    };
  }

  return {attributes, cssFiles, tokens};
}

async function scanHtml(files, attributes) {
  for (const abs of files) {
    const rel = relRepo(abs);
    const text = await readTextFile(abs);

    for (const usage of collectHtmlDataSpwAttributes(text)) {
      const entry = ensureAttr(attributes, usage.name);
      entry.htmlUsage.push({file: rel, line: usage.line, value: usage.value});

      if (usage.value) {
        for (const value of usage.value.split(/\s+/).filter(Boolean)) {
          entry.valuesInHtml.add(value);
        }
      }
    }
  }
}

async function scanJs(files, attributes) {
  for (const abs of files) {
    const rel = relRepo(abs);
    const text = await readTextFile(abs);

    for (const write of collectJsDataSpwWrites(text)) {
      const entry = ensureAttr(attributes, write.name);
      entry.jsWrites.push({
        file: rel,
        line: write.line,
        snippet: write.snippet,
      });
    }
  }
}

async function scanSpwDocs(files, attributes, tokens) {
  const docs = {};

  for (const abs of files) {
    const rel = relRepo(abs);
    const text = await readTextFile(abs);
    const attrsMentioned = new Set();
    const tokensMentioned = new Set();

    for (const match of text.matchAll(DOC_ATTR_RE)) {
      const name = `data-spw-${match[1]}`;
      attrsMentioned.add(name);

      const entry = attributes.get(name);
      if (entry) {
        entry.docMentions.push({file: rel, line: lineOf(text, match.index)});
      }
    }

    for (const match of text.matchAll(DOC_TOKEN_RE)) {
      const name = match[1];
      if (tokens.has(name)) tokensMentioned.add(name);
    }

    const titleMatch = text.match(/^#>([a-z0-9_]+)/m);

    docs[rel] = {
      title: titleMatch ? titleMatch[1] : path.basename(rel, path.extname(rel)),
      attributesMentioned: [...attrsMentioned].sort(),
      tokensMentioned: [...tokensMentioned].sort(),
    };
  }

  return docs;
}

function serializeAttributes(attributes) {
  const out = {};

  for (const [name, entry] of [...attributes.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    out[name] = {
      name: entry.name,
      cssSelectors: entry.cssSelectors,
      valuesInCss: [...entry.valuesInCss].sort(),
      htmlUsage: entry.htmlUsage,
      htmlUsageCount: entry.htmlUsage.length,
      valuesInHtml: [...entry.valuesInHtml].sort(),
      jsWrites: entry.jsWrites,
      docMentions: entry.docMentions,
      cssFiles: [...new Set(entry.cssSelectors.map((selector) => selector.file))].sort(),
      docFiles: [...new Set(entry.docMentions.map((doc) => doc.file))].sort(),
      htmlFiles: [...new Set(entry.htmlUsage.map((usage) => usage.file))].sort(),
      jsFiles: [...new Set(entry.jsWrites.map((write) => write.file))].sort(),
    };
  }

  return out;
}

function computeOrphans(attrs) {
  const attrsInCssNotHtml = [];
  const attrsInHtmlNotCss = [];
  const attrsWithNoDoc = [];
  const attrsInDocOnly = [];

  for (const [name, entry] of Object.entries(attrs)) {
    const hasCss = entry.cssSelectors.length > 0;
    const hasHtml = entry.htmlUsage.length > 0;
    const hasDoc = entry.docMentions.length > 0;
    const hasJs = entry.jsWrites.length > 0;

    if (hasCss && !hasHtml) attrsInCssNotHtml.push(name);
    if (hasHtml && !hasCss) attrsInHtmlNotCss.push(name);
    if ((hasCss || hasHtml || hasJs) && !hasDoc) attrsWithNoDoc.push(name);
    if (hasDoc && !hasCss && !hasHtml && !hasJs) attrsInDocOnly.push(name);
  }

  return {
    attrsInCssNotHtml,
    attrsInHtmlNotCss,
    attrsWithNoDoc,
    attrsInDocOnly,
  };
}

function renderIndexHtml({attrs, cssFiles, tokens, docs, orphans, generatedAt, counts}) {
  const attrEntries = Object.values(attrs);
  const tokenEntries = [...tokens.values()].sort((a, b) => a.name.localeCompare(b.name));
  const docEntries = Object.entries(docs).sort(([a], [b]) => a.localeCompare(b));

  const attrRows = attrEntries
    .sort((a, b) => b.htmlUsageCount - a.htmlUsageCount || a.name.localeCompare(b.name))
    .map((entry) => {
      const values = entry.valuesInHtml.length ? entry.valuesInHtml : entry.valuesInCss;

      return `
        <article class="catalog-entry" id="attr-${esc(entry.name)}" data-spw-catalog-kind="attribute">
          <header class="catalog-entry__header">
            <code class="catalog-entry__name">${esc(entry.name)}</code>
            <span class="catalog-entry__meta">${entry.cssSelectors.length} CSS • ${entry.htmlUsageCount} HTML • ${entry.jsWrites.length} JS • ${entry.docMentions.length} docs</span>
          </header>
          ${values.length ? `<p class="catalog-entry__line"><strong>values:</strong> ${values.slice(0, 32).map((value) => `<code>${esc(value)}</code>`).join(' ')}${values.length > 32 ? ` <em>+${values.length - 32}</em>` : ''}</p>` : ''}
          ${entry.cssFiles.length ? `<p class="catalog-entry__line"><strong>css:</strong> ${entry.cssFiles.map((file) => `<a href="#css-${esc(file)}"><code>${esc(file)}</code></a>`).join(' ')}</p>` : ''}
          ${entry.jsFiles.length ? `<p class="catalog-entry__line"><strong>js writers:</strong> ${entry.jsFiles.map((file) => `<code>${esc(file)}</code>`).join(' ')}</p>` : ''}
          ${entry.docFiles.length ? `<p class="catalog-entry__line"><strong>philosophy:</strong> ${entry.docFiles.map((file) => `<a href="/${esc(file)}"><code>${esc(file)}</code></a>`).join(' ')}</p>` : '<p class="catalog-entry__line catalog-entry__line--warn"><strong>philosophy:</strong> <em>no .spw doc mentions this attribute</em></p>'}
        </article>
      `;
    })
    .join('\n');

  const cssFileRows = Object.entries(cssFiles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, info]) => `
      <article class="catalog-entry" id="css-${esc(file)}" data-spw-catalog-kind="css-file">
        <header class="catalog-entry__header">
          <code class="catalog-entry__name">${esc(file)}</code>
          <span class="catalog-entry__meta">layer ${esc(info.layer || '—')} • ${info.attributesUsed.length} attrs • ${info.tokensDefined.length} tokens</span>
        </header>
        ${info.header ? `<p class="catalog-entry__doc">${esc(info.header)}</p>` : ''}
        ${info.attributesUsed.length ? `<p class="catalog-entry__line"><strong>reads attrs:</strong> ${info.attributesUsed.map((attr) => `<a href="#attr-${esc(attr)}"><code>${esc(attr)}</code></a>`).join(' ')}</p>` : ''}
        ${info.tokensDefined.length ? `<p class="catalog-entry__line"><strong>defines tokens:</strong> ${info.tokensDefined.slice(0, 24).map((token) => `<code>${esc(token)}</code>`).join(' ')}${info.tokensDefined.length > 24 ? ` <em>+${info.tokensDefined.length - 24}</em>` : ''}</p>` : ''}
      </article>
    `)
    .join('\n');

  const orphanBlock = `
    <section class="catalog-section" id="orphans">
      <h2>Orphans &amp; gaps</h2>
      <p>Places where the traceability graph is incomplete.</p>
      <dl class="orphan-list">
        <dt>attrs in CSS, not in HTML (${orphans.attrsInCssNotHtml.length})</dt>
        <dd>${orphans.attrsInCssNotHtml.map((attr) => `<a href="#attr-${esc(attr)}"><code>${esc(attr)}</code></a>`).join(' ') || '<em>none</em>'}</dd>
        <dt>attrs in HTML, not in CSS (${orphans.attrsInHtmlNotCss.length})</dt>
        <dd>${orphans.attrsInHtmlNotCss.map((attr) => `<a href="#attr-${esc(attr)}"><code>${esc(attr)}</code></a>`).join(' ') || '<em>none</em>'}</dd>
        <dt>attrs with no philosophy doc (${orphans.attrsWithNoDoc.length})</dt>
        <dd>${orphans.attrsWithNoDoc.map((attr) => `<a href="#attr-${esc(attr)}"><code>${esc(attr)}</code></a>`).join(' ') || '<em>none</em>'}</dd>
      </dl>
    </section>
  `;

  const docRows = docEntries.map(([file, info]) => `
    <article class="catalog-entry" data-spw-catalog-kind="doc">
      <header class="catalog-entry__header">
        <code class="catalog-entry__name"><a href="/${esc(file)}">${esc(file)}</a></code>
        <span class="catalog-entry__meta">${info.attributesMentioned.length} attrs • ${info.tokensMentioned.length} tokens</span>
      </header>
      ${info.attributesMentioned.length ? `<p class="catalog-entry__line"><strong>mentions attrs:</strong> ${info.attributesMentioned.map((attr) => `<a href="#attr-${esc(attr)}"><code>${esc(attr)}</code></a>`).join(' ')}</p>` : ''}
    </article>
  `).join('\n');

  return `<!DOCTYPE html>
<html lang="en" data-spw-page-family="design" data-spw-page-role="catalog">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spwashi • Design Catalog</title>
  <meta name="description" content="Traceability catalog: data-spw-* attributes, CSS clusters, tokens, and philosophy docs, cross-referenced across the site-facing surfaces.">
  <meta name="robots" content="noindex">
  <script type="module" src="/public/js/site.js?v=0.0.2"></script>
  <link rel="stylesheet" href="/public/css/style.css">
  <link rel="stylesheet" href="/design/catalog/catalog.css">
</head>
<body
  data-spw-surface="design"
  data-spw-features="catalog"
  data-spw-route-family="design"
  data-spw-context="analysis"
  data-spw-wonder="traceability"
  data-spw-page-family="design"
  data-spw-page-modes="inspect trace browse"
  data-spw-page-role="catalog"
  data-spw-layout="atlas">
<main class="catalog-main">
  <header class="catalog-masthead">
    <h1>Design Catalog</h1>
    <p class="catalog-masthead__lede">
      Cross-reference of <code>data-spw-*</code> attributes, CSS clusters, custom-property tokens,
      and <code>.spw</code> philosophy documents, scanned across the site-facing surfaces. Generated
      <time datetime="${esc(generatedAt)}">${esc(generatedAt)}</time>.
    </p>
    <p class="catalog-masthead__counts">
      ${counts.attributes} attributes • ${counts.tokens} tokens • ${counts.cssFiles} CSS files • ${counts.docs} philosophy docs
    </p>
    <nav class="catalog-toc" aria-label="Catalog sections">
      <a href="#attributes">Attributes</a>
      <a href="#tokens">Tokens</a>
      <a href="#css-files">CSS files</a>
      <a href="#docs">Philosophy docs</a>
      <a href="#orphans">Orphans</a>
    </nav>
  </header>

  ${orphanBlock}

  <section class="catalog-section" id="attributes">
    <h2>Attributes</h2>
    <p>Every <code>data-spw-*</code> attribute that appears anywhere in the repo, with its full cross-reference.</p>
    <div class="catalog-entries">${attrRows}</div>
  </section>

  <section class="catalog-section" id="css-files">
    <h2>CSS files</h2>
    <p>Each CSS file with its layer, attributes it reads, and tokens it defines.</p>
    <div class="catalog-entries">${cssFileRows}</div>
  </section>

  <section class="catalog-section" id="tokens">
    <h2>Custom-property tokens</h2>
    <p>Every <code>--token</code> — where defined, where consumed.</p>
    <div class="catalog-entries">
      ${tokenEntries.slice(0, 500).map((token) => `
        <article class="catalog-entry" id="token-${esc(token.name)}" data-spw-catalog-kind="token">
          <header class="catalog-entry__header">
            <code class="catalog-entry__name">${esc(token.name)}</code>
            <span class="catalog-entry__meta">${token.definitions.length} defs • ${token.consumers.length} reads${token.syntax ? ` • syntax <code>${esc(token.syntax)}</code>` : ''}</span>
          </header>
          ${token.initialValue ? `<p class="catalog-entry__line"><strong>initial:</strong> <code>${esc(token.initialValue)}</code></p>` : ''}
          ${token.definitions.length ? `<p class="catalog-entry__line"><strong>defined in:</strong> ${[...new Set(token.definitions.map((definition) => definition.file))].map((file) => `<code>${esc(file)}</code>`).join(' ')}</p>` : ''}
        </article>
      `).join('\n')}
      ${tokenEntries.length > 500 ? `<p><em>Showing first 500 of ${tokenEntries.length} tokens. See catalog.json for the full list.</em></p>` : ''}
    </div>
  </section>

  <section class="catalog-section" id="docs">
    <h2>Philosophy docs</h2>
    <p><code>.spw/</code> files that name attributes or tokens — the prose source of meaning.</p>
    <div class="catalog-entries">${docRows}</div>
  </section>
</main>
</body>
</html>
`;
}

const CATALOG_CSS = `
/* Design catalog — reuses site typography, scopes only its own page chrome. */
.catalog-main {
  max-width: var(--page-width-atlas, 88rem);
  margin-inline: auto;
  padding: 2rem 1.25rem 6rem;
  display: grid;
  gap: 2.5rem;
}
.catalog-masthead h1 { margin-bottom: 0.5rem; }
.catalog-masthead__lede { color: var(--ink-soft, #556); max-width: 60ch; }
.catalog-masthead__counts { font-size: 0.9rem; color: var(--ink-soft, #667); font-variant-numeric: tabular-nums; }
.catalog-toc { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; font-size: 0.9rem; }
.catalog-toc a { text-decoration: none; border-bottom: 1px dotted currentColor; }
.catalog-section { display: grid; gap: 1rem; }
.catalog-section h2 { margin: 0; }
.catalog-entries { display: grid; gap: 0.75rem; }
.catalog-entry {
  padding: 0.75rem 1rem;
  border: 1px solid var(--line, rgba(0,0,0,0.1));
  border-radius: 0.5rem;
  background: var(--surface, rgba(255,255,255,0.6));
  display: grid; gap: 0.35rem;
}
.catalog-entry__header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; align-items: baseline; }
.catalog-entry__name { font-weight: 600; }
.catalog-entry__meta { font-size: 0.8rem; color: var(--ink-soft, #667); font-variant-numeric: tabular-nums; }
.catalog-entry__line { margin: 0; font-size: 0.88rem; }
.catalog-entry__line code { font-size: 0.82rem; }
.catalog-entry__line--warn { color: hsl(18 60% 40%); }
.catalog-entry__doc { margin: 0; font-size: 0.85rem; color: var(--ink-soft, #556); font-style: italic; }
.orphan-list dt { font-weight: 600; margin-top: 0.5rem; }
.orphan-list dd { margin: 0.15rem 0 0.5rem 0; display: flex; flex-wrap: wrap; gap: 0.35rem; }
`;

function serializeTokens(tokens) {
  return [...tokens.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((token) => ({
      name: token.name,
      syntax: token.syntax,
      initialValue: token.initialValue,
      inherits: token.inherits,
      definitions: token.definitions,
      consumerCount: token.consumers.length,
      consumerFiles: [...new Set(token.consumers.map((consumer) => consumer.file))].sort(),
    }));
}

async function writeOrCheckFile(filePath, contents, options) {
  if (!options.check) {
    await fs.writeFile(filePath, contents);
    return false;
  }

  let existing = null;

  try {
    existing = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  return existing !== contents;
}

async function writeOutputs(outputDir, outputs, options) {
  await fs.mkdir(outputDir, {recursive: true});

  const changed = [];

  for (const [filename, contents] of Object.entries(outputs)) {
    const filePath = path.join(outputDir, filename);
    const differs = await writeOrCheckFile(filePath, contents, options);

    if (differs) {
      changed.push(relRepo(filePath));
    }
  }

  if (options.check && changed.length) {
    throw new Error(`[catalog] --check failed; generated files differ: ${changed.join(', ')}`);
  }

  return changed;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const outputRelativePath = relRepo(options.outDir);
  const styleCssText = await readOptionalTextFile(path.join(ROOT_DIR, 'public/css/style.css'));
  const fileToLayer = buildFileToLayer(styleCssText);

  const allFiles = await walk(ROOT_DIR, {outputRelativePath});

  const cssFiles = allFiles.filter((filePath) => filePath.endsWith('.css'));
  const htmlFiles = allFiles.filter((filePath) => filePath.endsWith('.html'));
  const jsFiles = allFiles.filter((filePath) => {
    const rel = relRepo(filePath);
    return (filePath.endsWith('.js') || filePath.endsWith('.mjs')) && !rel.startsWith('scripts/');
  });
  const spwFiles = allFiles.filter((filePath) => filePath.endsWith('.spw'));

  const {attributes, cssFiles: cssFileInfo, tokens} = await parseCss(cssFiles, fileToLayer);
  await scanHtml(htmlFiles, attributes);
  await scanJs(jsFiles, attributes);

  const docs = await scanSpwDocs(spwFiles, attributes, tokens);
  const attrs = serializeAttributes(attributes);
  const orphans = computeOrphans(attrs);
  const tokensSerialized = serializeTokens(tokens);

  const counts = {
    attributes: Object.keys(attrs).length,
    cssFiles: Object.keys(cssFileInfo).length,
    tokens: tokensSerialized.length,
    docs: Object.keys(docs).length,
    htmlFilesScanned: htmlFiles.length,
    jsFilesScanned: jsFiles.length,
  };

  const catalog = {
    generatedAt: getGeneratedAt(),
    counts,
    attributes: attrs,
    cssFiles: cssFileInfo,
    tokens: tokensSerialized,
    docs,
    orphans,
  };

  const outputs = {
    'catalog.json': `${JSON.stringify(catalog, null, 2)}\n`,
    'catalog.css': `${CATALOG_CSS.trim()}\n`,
    'index.html': renderIndexHtml({
      attrs,
      cssFiles: cssFileInfo,
      tokens,
      docs,
      orphans,
      generatedAt: catalog.generatedAt,
      counts,
    }),
  };

  await writeOutputs(options.outDir, outputs, options);

  if (!options.quiet) {
    console.log(`[catalog] ${options.check ? 'checked' : 'wrote'} ${relRepo(path.join(options.outDir, 'index.html'))}`);
    console.log(`[catalog] ${counts.attributes} attributes • ${counts.tokens} tokens • ${counts.cssFiles} css files • ${counts.docs} spw docs`);
    console.log(`[catalog] scanned ${counts.htmlFilesScanned} html • ${counts.jsFilesScanned} js • ${cssFiles.length} css • ${spwFiles.length} spw`);
    console.log(`[catalog] orphans: css-only=${orphans.attrsInCssNotHtml.length} html-only=${orphans.attrsInHtmlNotCss.length} no-doc=${orphans.attrsWithNoDoc.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});