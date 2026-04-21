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

function parseOutDir(argv) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out' && argv[i + 1]) return path.resolve(argv[i + 1]);
    if (argv[i].startsWith('--out=')) return path.resolve(argv[i].slice('--out='.length));
  }
  return path.join(ROOT_DIR, 'design', 'catalog');
}

const OUTPUT_DIR = parseOutDir(process.argv.slice(2));

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
const CSS_VAR_REF_RE = /var\((--[a-z0-9-]+)/g;
const AT_PROPERTY_RE = /@property\s+(--[a-z0-9-]+)\s*\{([^}]*)\}/g;
const LAYER_IMPORT_RE = /@import\s+url\(['"]([^'"]+)['"]\)\s+layer\(([a-z-]+)\)/g;

const HTML_ATTR_USAGE_RE = /\bdata-spw-([a-z0-9-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
const JS_DATASET_WRITE_RE = /(?:\.dataset\.(spw[A-Za-z0-9]+)\s*=|setAttribute\(\s*['"](data-spw-[a-z0-9-]+)['"]\s*,)/g;

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function relRepo(absPath) {
  return toPosix(path.relative(ROOT_DIR, absPath));
}

function shouldIgnoreRelativePath(relativePath) {
  const normalizedPath = toPosix(relativePath).replace(/^\/+/, '');
  if (!normalizedPath) return false;

  const segments = normalizedPath.split('/');
  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) return true;
  if (normalizedPath === '.spw/_workbench' || normalizedPath.startsWith('.spw/_workbench/')) return true;

  return false;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = relRepo(abs);
    if (shouldIgnoreRelativePath(rel)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.spw') continue;
    if (rel.startsWith('design/catalog/')) continue;
    if (entry.isDirectory()) {
      files.push(...await walk(abs));
    } else {
      files.push(abs);
    }
  }
  return files;
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) line++;
  }
  return line;
}

function camelSpwToDataAttr(camel) {
  const rest = camel.slice(3);
  const dashed = rest.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `data-spw${dashed.startsWith('-') ? dashed : '-' + dashed}`;
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

async function parseCss(files, fileToLayer) {
  const attributes = new Map();
  const cssFiles = {};
  const tokens = new Map();

  for (const abs of files) {
    const rel = relRepo(abs);
    const text = await fs.readFile(abs, 'utf8');
    const layer = fileToLayer.get(rel) || null;
    const header = extractFileHeaderDoc(text);
    const attrsHere = new Set();
    const tokensDefinedHere = [];
    const tokensConsumedHere = new Set();

    for (const m of text.matchAll(CSS_SELECTOR_ATTR_RE)) {
      const name = `data-spw-${m[1]}`;
      const value = m[4] ?? m[5] ?? m[6] ?? null;
      attrsHere.add(name);
      const entry = ensureAttr(attributes, name);
      entry.cssSelectors.push({
        file: rel,
        layer,
        line: lineOf(text, m.index),
        snippet: m[0],
        value,
      });
      if (value) entry.valuesInCss.add(value);
    }

    for (const m of text.matchAll(CSS_VAR_DEF_RE)) {
      const name = m[1];
      tokensDefinedHere.push(name);
      ensureToken(tokens, name).definitions.push({
        file: rel,
        layer,
        line: lineOf(text, m.index),
      });
    }

    for (const m of text.matchAll(AT_PROPERTY_RE)) {
      const [, name, body] = m;
      const tokenEntry = ensureToken(tokens, name);
      const syntaxMatch = body.match(/syntax\s*:\s*["']([^"']+)["']/);
      const initialMatch = body.match(/initial-value\s*:\s*([^;]+);?/);
      const inheritsMatch = body.match(/inherits\s*:\s*(true|false)/);
      tokenEntry.syntax = syntaxMatch ? syntaxMatch[1] : tokenEntry.syntax;
      tokenEntry.initialValue = initialMatch ? initialMatch[1].trim() : tokenEntry.initialValue;
      tokenEntry.inherits = inheritsMatch ? inheritsMatch[1] === 'true' : tokenEntry.inherits;
      const atPropLine = lineOf(text, m.index);
      if (!tokenEntry.definitions.some((d) => d.file === rel && d.line === atPropLine)) {
        tokenEntry.definitions.push({ file: rel, layer, line: atPropLine, registered: true });
      }
    }

    for (const m of text.matchAll(CSS_VAR_REF_RE)) {
      tokensConsumedHere.add(m[1]);
    }
    for (const tokenName of tokensConsumedHere) {
      ensureToken(tokens, tokenName).consumers.push({ file: rel, layer });
    }

    cssFiles[rel] = {
      layer,
      header,
      attributesUsed: [...attrsHere].sort(),
      tokensDefined: [...new Set(tokensDefinedHere)].sort(),
      tokensConsumed: [...tokensConsumedHere].sort(),
    };
  }

  return { attributes, cssFiles, tokens };
}

async function scanHtml(files, attributes) {
  for (const abs of files) {
    const rel = relRepo(abs);
    const text = await fs.readFile(abs, 'utf8');
    for (const m of text.matchAll(HTML_ATTR_USAGE_RE)) {
      const name = `data-spw-${m[1]}`;
      const value = m[2] ?? m[3] ?? null;
      const entry = ensureAttr(attributes, name);
      entry.htmlUsage.push({ file: rel, line: lineOf(text, m.index), value });
      if (value) {
        for (const v of value.split(/\s+/).filter(Boolean)) {
          entry.valuesInHtml.add(v);
        }
      }
    }
  }
}

async function scanJs(files, attributes) {
  for (const abs of files) {
    const rel = relRepo(abs);
    const text = await fs.readFile(abs, 'utf8');
    for (const m of text.matchAll(JS_DATASET_WRITE_RE)) {
      const name = m[1] ? camelSpwToDataAttr(m[1]) : m[2];
      const entry = ensureAttr(attributes, name);
      entry.jsWrites.push({ file: rel, line: lineOf(text, m.index) });
    }
  }
}

async function scanSpwDocs(files, attributes, tokens) {
  const docs = {};
  for (const abs of files) {
    const rel = relRepo(abs);
    const text = await fs.readFile(abs, 'utf8');
    const attrsMentioned = new Set();
    const tokensMentioned = new Set();

    for (const m of text.matchAll(/data-spw-([a-z0-9-]+)/g)) {
      const name = `data-spw-${m[1]}`;
      attrsMentioned.add(name);
      const entry = attributes.get(name);
      if (entry) {
        entry.docMentions.push({ file: rel, line: lineOf(text, m.index) });
      }
    }
    for (const m of text.matchAll(/(--[a-z][a-z0-9-]{2,})/g)) {
      const name = m[1];
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
      cssFiles: [...new Set(entry.cssSelectors.map((s) => s.file))].sort(),
      docFiles: [...new Set(entry.docMentions.map((d) => d.file))].sort(),
      htmlFiles: [...new Set(entry.htmlUsage.map((h) => h.file))].sort(),
      jsFiles: [...new Set(entry.jsWrites.map((j) => j.file))].sort(),
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
    if (hasCss && !hasHtml) attrsInCssNotHtml.push(name);
    if (hasHtml && !hasCss) attrsInHtmlNotCss.push(name);
    if ((hasCss || hasHtml) && !hasDoc) attrsWithNoDoc.push(name);
    if (hasDoc && !hasCss && !hasHtml) attrsInDocOnly.push(name);
  }
  return { attrsInCssNotHtml, attrsInHtmlNotCss, attrsWithNoDoc, attrsInDocOnly };
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  }[c]));
}

function renderIndexHtml({ attrs, cssFiles, tokens, docs, orphans, generatedAt, counts }) {
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
          ${values.length ? `<p class="catalog-entry__line"><strong>values:</strong> ${values.slice(0, 32).map((v) => `<code>${esc(v)}</code>`).join(' ')}${values.length > 32 ? ` <em>+${values.length - 32}</em>` : ''}</p>` : ''}
          ${entry.cssFiles.length ? `<p class="catalog-entry__line"><strong>css:</strong> ${entry.cssFiles.map((f) => `<a href="#css-${esc(f)}"><code>${esc(f)}</code></a>`).join(' ')}</p>` : ''}
          ${entry.jsFiles.length ? `<p class="catalog-entry__line"><strong>js writers:</strong> ${entry.jsFiles.map((f) => `<code>${esc(f)}</code>`).join(' ')}</p>` : ''}
          ${entry.docFiles.length ? `<p class="catalog-entry__line"><strong>philosophy:</strong> ${entry.docFiles.map((f) => `<a href="/${esc(f)}"><code>${esc(f)}</code></a>`).join(' ')}</p>` : '<p class="catalog-entry__line catalog-entry__line--warn"><strong>philosophy:</strong> <em>no .spw doc mentions this attribute</em></p>'}
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
        ${info.attributesUsed.length ? `<p class="catalog-entry__line"><strong>reads attrs:</strong> ${info.attributesUsed.map((a) => `<a href="#attr-${esc(a)}"><code>${esc(a)}</code></a>`).join(' ')}</p>` : ''}
        ${info.tokensDefined.length ? `<p class="catalog-entry__line"><strong>defines tokens:</strong> ${info.tokensDefined.slice(0, 24).map((t) => `<code>${esc(t)}</code>`).join(' ')}${info.tokensDefined.length > 24 ? ` <em>+${info.tokensDefined.length - 24}</em>` : ''}</p>` : ''}
      </article>
    `)
    .join('\n');

  const orphanBlock = `
    <section class="catalog-section" id="orphans">
      <h2>Orphans &amp; gaps</h2>
      <p>Places where the traceability graph is incomplete.</p>
      <dl class="orphan-list">
        <dt>attrs in CSS, not in HTML (${orphans.attrsInCssNotHtml.length})</dt>
        <dd>${orphans.attrsInCssNotHtml.map((a) => `<a href="#attr-${esc(a)}"><code>${esc(a)}</code></a>`).join(' ') || '<em>none</em>'}</dd>
        <dt>attrs in HTML, not in CSS (${orphans.attrsInHtmlNotCss.length})</dt>
        <dd>${orphans.attrsInHtmlNotCss.map((a) => `<a href="#attr-${esc(a)}"><code>${esc(a)}</code></a>`).join(' ') || '<em>none</em>'}</dd>
        <dt>attrs with no philosophy doc (${orphans.attrsWithNoDoc.length})</dt>
        <dd>${orphans.attrsWithNoDoc.map((a) => `<a href="#attr-${esc(a)}"><code>${esc(a)}</code></a>`).join(' ') || '<em>none</em>'}</dd>
      </dl>
    </section>
  `;

  const docRows = docEntries.map(([file, info]) => `
    <article class="catalog-entry" data-spw-catalog-kind="doc">
      <header class="catalog-entry__header">
        <code class="catalog-entry__name"><a href="/${esc(file)}">${esc(file)}</a></code>
        <span class="catalog-entry__meta">${info.attributesMentioned.length} attrs • ${info.tokensMentioned.length} tokens</span>
      </header>
      ${info.attributesMentioned.length ? `<p class="catalog-entry__line"><strong>mentions attrs:</strong> ${info.attributesMentioned.map((a) => `<a href="#attr-${esc(a)}"><code>${esc(a)}</code></a>`).join(' ')}</p>` : ''}
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
      ${tokenEntries.slice(0, 500).map((t) => `
        <article class="catalog-entry" id="token-${esc(t.name)}" data-spw-catalog-kind="token">
          <header class="catalog-entry__header">
            <code class="catalog-entry__name">${esc(t.name)}</code>
            <span class="catalog-entry__meta">${t.definitions.length} defs • ${t.consumers.length} reads${t.syntax ? ` • syntax <code>${esc(t.syntax)}</code>` : ''}</span>
          </header>
          ${t.initialValue ? `<p class="catalog-entry__line"><strong>initial:</strong> <code>${esc(t.initialValue)}</code></p>` : ''}
          ${t.definitions.length ? `<p class="catalog-entry__line"><strong>defined in:</strong> ${[...new Set(t.definitions.map((d) => d.file))].map((f) => `<code>${esc(f)}</code>`).join(' ')}</p>` : ''}
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

async function main() {
  const styleCssText = await fs.readFile(path.join(ROOT_DIR, 'public/css/style.css'), 'utf8');
  const fileToLayer = buildFileToLayer(styleCssText);

  const allFiles = await walk(ROOT_DIR);
  const cssFiles = allFiles.filter((p) => p.endsWith('.css'));
  const htmlFiles = allFiles.filter((p) => p.endsWith('.html'));
  const jsFiles = allFiles.filter((p) => (p.endsWith('.js') || p.endsWith('.mjs')) && !relRepo(p).startsWith('scripts/'));
  const spwFiles = allFiles.filter((p) => p.endsWith('.spw'));

  const { attributes, cssFiles: cssFileInfo, tokens } = await parseCss(cssFiles, fileToLayer);
  await scanHtml(htmlFiles, attributes);
  await scanJs(jsFiles, attributes);
  const docs = await scanSpwDocs(spwFiles, attributes, tokens);

  const attrs = serializeAttributes(attributes);
  const orphans = computeOrphans(attrs);

  const tokensSerialized = [...tokens.values()].sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({
      name: t.name,
      syntax: t.syntax,
      initialValue: t.initialValue,
      inherits: t.inherits,
      definitions: t.definitions,
      consumerCount: t.consumers.length,
      consumerFiles: [...new Set(t.consumers.map((c) => c.file))].sort(),
    }));

  const counts = {
    attributes: Object.keys(attrs).length,
    cssFiles: Object.keys(cssFileInfo).length,
    tokens: tokensSerialized.length,
    docs: Object.keys(docs).length,
    htmlFilesScanned: htmlFiles.length,
    jsFilesScanned: jsFiles.length,
  };

  const catalog = {
    generatedAt: new Date().toISOString(),
    counts,
    attributes: attrs,
    cssFiles: cssFileInfo,
    tokens: tokensSerialized,
    docs,
    orphans,
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUTPUT_DIR, 'catalog.json'), JSON.stringify(catalog, null, 2));
  await fs.writeFile(path.join(OUTPUT_DIR, 'catalog.css'), CATALOG_CSS.trim() + '\n');
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), renderIndexHtml({
    attrs,
    cssFiles: cssFileInfo,
    tokens,
    docs,
    orphans,
    generatedAt: catalog.generatedAt,
    counts,
  }));

  console.log(`[catalog] wrote ${relRepo(path.join(OUTPUT_DIR, 'index.html'))}`);
  console.log(`[catalog] ${counts.attributes} attributes • ${counts.tokens} tokens • ${counts.cssFiles} css files • ${counts.docs} spw docs`);
  console.log(`[catalog] scanned ${counts.htmlFilesScanned} html • ${counts.jsFilesScanned} js • ${cssFiles.length} css • ${spwFiles.length} spw`);
  console.log(`[catalog] orphans: css-only=${orphans.attrsInCssNotHtml.length} html-only=${orphans.attrsInHtmlNotCss.length} no-doc=${orphans.attrsWithNoDoc.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
