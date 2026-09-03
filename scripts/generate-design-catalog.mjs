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
  '.references',
  '00.unsorted',
  'dist',
  'dist-vite',
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
const IMAGE_ASSET_EXTENSIONS = new Set(['.avif', '.gif', '.ico', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function relRepo(absPath) {
  return toPosix(path.relative(ROOT_DIR, absPath));
}

function humanizeBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}

function titleFromStem(stem) {
  return stem
    .split('/')
    .pop()
    ?.replace(/[-_]+/g, ' ')
    .trim() || stem;
}

function slugifyCatalogId(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

function imageBucketForPath(relativePath) {
  const normalized = toPosix(relativePath).replace(/^\/+/, '');
  const parts = normalized.split('/');
  const imageRootIndex = parts.indexOf('images');
  const imageParts = imageRootIndex >= 0 ? parts.slice(imageRootIndex + 1) : [];
  const family = imageParts[0] || 'images';
  const bucketParts = imageParts.slice(0, -1);

  if (!bucketParts.length) return 'root';

  if (bucketParts.length > 1) {
    return bucketParts.join('/');
  }

  return family;
}

function imageStateForBucket(bucket) {
  if (bucket === 'renders/_raw' || bucket === 'renders/_raw-2x2') return 'raw';
  if (bucket === 'renders/unsorted-curation') return 'review';
  if (bucket.startsWith('renders/')) return 'generated';
  return 'published';
}

export function routeHrefForHtmlFile(relativePath) {
  const normalized = toPosix(relativePath).replace(/^\/+/, '');
  if (normalized === 'index.html') return '/';
  if (normalized.endsWith('/index.html')) return `/${normalized.slice(0, -'index.html'.length)}`;
  return `/${normalized}`;
}

function normalizedPublicImagePath(src) {
  const normalized = decodeHtmlAttribute(src || '')
    .split(/[?#]/, 1)[0]
    .replace(/^\/+/, '');

  return normalized.startsWith('public/images/') ? normalized : null;
}

export function collectHtmlImageReferences(html, relativeFile) {
  const references = [];
  const lineAt = createLineLocator(html);
  const route = routeHrefForHtmlFile(relativeFile);

  for (const tag of findStartTags(html)) {
    if (tag.name !== 'img' && tag.name !== 'source') continue;
    const attrs = parseTagAttributes(tag.source);
    const sources = [];

    if (attrs.get('src')) sources.push(attrs.get('src'));
    if (attrs.get('srcset')) {
      for (const candidate of attrs.get('srcset').split(',')) {
        const source = candidate.trim().split(/\s+/, 1)[0];
        if (source) sources.push(source);
      }
    }

    for (const source of sources) {
      const assetPath = normalizedPublicImagePath(source);
      if (!assetPath) continue;
      references.push({
        alt: attrs.get('alt') || '',
        file: relativeFile,
        line: lineAt(tag.index),
        path: assetPath,
        route,
      });
    }
  }

  return references;
}

async function collectImageUsage(htmlFiles) {
  const usageByPath = new Map();

  for (const filePath of htmlFiles) {
    const relativeFile = relRepo(filePath);
    const html = await readTextFile(filePath);

    for (const reference of collectHtmlImageReferences(html, relativeFile)) {
      const existing = usageByPath.get(reference.path) || [];
      if (!existing.some((usage) => usage.file === reference.file && usage.line === reference.line)) {
        existing.push(reference);
      }
      usageByPath.set(reference.path, existing);
    }
  }

  return usageByPath;
}

async function collectImageAssets(filePaths, imageUsage = new Map()) {
  const assets = [];

  for (const filePath of filePaths) {
    const relativePath = relRepo(filePath);
    if (!relativePath.startsWith('public/images/')) continue;

    const extension = path.extname(relativePath).toLowerCase();
    if (!IMAGE_ASSET_EXTENSIONS.has(extension)) continue;

    const stat = await fs.stat(filePath);
    const stem = relativePath.slice(0, -extension.length);
    const bucket = imageBucketForPath(relativePath);
    const state = imageStateForBucket(bucket);
    const sidecarCandidates = [`${stem}.spw`, `${stem}.json`];
    const sidecars = [];

    for (const candidate of sidecarCandidates) {
      try {
        await fs.access(path.join(ROOT_DIR, candidate));
        sidecars.push(candidate);
      } catch {
        // Ignore missing sidecars.
      }
    }

    const usages = imageUsage.get(relativePath) || [];
    const authoredAlt = usages.find((usage) => usage.alt.trim())?.alt.trim();

    assets.push({
      alt: authoredAlt || titleFromStem(stem),
      bucket,
      bytes: stat.size,
      extension: extension.slice(1),
      family: bucket.split('/')[0],
      href: `/${relativePath}`,
      path: relativePath,
      sidecars,
      state,
      stem,
      usages,
    });
  }

  return assets.sort((a, b) => a.path.localeCompare(b.path));
}

function getGeneratedAt() {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) {
    return new Date(Number(epoch) * 1000).toISOString();
  }

  return new Date().toISOString();
}

export function catalogGeneratedAtFromText(catalogText) {
  if (!catalogText) return null;

  try {
    const generatedAt = JSON.parse(catalogText)?.generatedAt;
    return typeof generatedAt === 'string' && Number.isFinite(Date.parse(generatedAt))
      ? generatedAt
      : null;
  } catch {
    return null;
  }
}

async function generatedAtForRun(options) {
  if (!options.check) return getGeneratedAt();

  const existingCatalog = await readOptionalTextFile(path.join(options.outDir, 'catalog.json'));
  return catalogGeneratedAtFromText(existingCatalog) || getGeneratedAt();
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

export function shouldIgnoreRelativePath(relativePath, outputRelativePath = 'design/catalog') {
  const normalizedPath = toPosix(relativePath).replace(/^\/+/, '');
  if (!normalizedPath) return false;

  const segments = normalizedPath.split('/');
  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) return true;
  if (normalizedPath === '.spw/_workbench' || normalizedPath.startsWith('.spw/_workbench/')) return true;
  if (normalizedPath === 'public/css/bundles' || normalizedPath.startsWith('public/css/bundles/')) return true;
  if (normalizedPath === 'design/catalog' || normalizedPath.startsWith('design/catalog/')) return true;

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

export function createLineLocator(text) {
  const lineStarts = [0];

  for (let cursor = 0; cursor < text.length; cursor += 1) {
    if (text.charCodeAt(cursor) === 10) lineStarts.push(cursor + 1);
  }

  return (index = 0) => {
    const target = Math.max(0, Math.min(Number(index) || 0, text.length));
    let low = 0;
    let high = lineStarts.length;

    while (low < high) {
      const middle = (low + high) >>> 1;
      if (lineStarts[middle] <= target) low = middle + 1;
      else high = middle;
    }

    return low;
  };
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
  const lineAt = createLineLocator(html);

  for (const tag of findStartTags(html)) {
    const attrs = parseTagAttributes(tag.source);

    for (const [name, value] of attrs.entries()) {
      if (!DATA_SPW_ATTR_NAME_RE.test(name)) continue;

      usages.push({
        name,
        value: value || null,
        line: lineAt(tag.index),
      });
    }
  }

  return usages;
}

function collectJsDataSpwWrites(text) {
  const writes = [];
  const lineAt = createLineLocator(text);

  const dotDatasetRe = /\.dataset\.(spw[A-Za-z0-9]+)\s*=/g;
  for (const match of text.matchAll(dotDatasetRe)) {
    writes.push({
      name: camelSpwToDataAttr(match[1]),
      line: lineAt(match.index),
      snippet: match[0],
    });
  }

  const bracketDatasetRe = /\.dataset\[\s*['"](spw[A-Za-z0-9]+)['"]\s*\]\s*=/g;
  for (const match of text.matchAll(bracketDatasetRe)) {
    writes.push({
      name: camelSpwToDataAttr(match[1]),
      line: lineAt(match.index),
      snippet: match[0],
    });
  }

  const setAttributeRe = /setAttribute\(\s*['"](data-spw-[a-z0-9-]+)['"]\s*,/g;
  for (const match of text.matchAll(setAttributeRe)) {
    writes.push({
      name: match[1],
      line: lineAt(match.index),
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
    const lineAt = createLineLocator(text);
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
        line: lineAt(match.index),
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
        line: lineAt(match.index),
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

      const atPropLine = lineAt(match.index);
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
    const lineAt = createLineLocator(text);
    const attrsMentioned = new Set();
    const tokensMentioned = new Set();

    for (const match of text.matchAll(DOC_ATTR_RE)) {
      const name = `data-spw-${match[1]}`;
      attrsMentioned.add(name);

      const entry = attributes.get(name);
      if (entry) {
        entry.docMentions.push({file: rel, line: lineAt(match.index)});
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

function renderIndexHtml({attrs, cssFiles, tokens, docs, imageAssets, orphans, generatedAt, counts}) {
  const attrEntries = Object.values(attrs);
  const tokenEntries = [...tokens.values()].sort((a, b) => a.name.localeCompare(b.name));
  const docEntries = Object.entries(docs).sort(([a], [b]) => a.localeCompare(b));
  const imageBucketMap = new Map();

  for (const asset of imageAssets) {
    const bucket = imageBucketMap.get(asset.bucket) || [];
    bucket.push(asset);
    imageBucketMap.set(asset.bucket, bucket);
  }

  const imageBucketEntries = [...imageBucketMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, assets]) => ({
      bucket,
      assets: assets.sort((left, right) => left.path.localeCompare(right.path)),
    }));

  function isColorToken(name, value = '') {
    if (!name && !value) return false;
    const str = String(value || '').trim();
    if (/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(str)) return true;
    if (/^(?:rgb|rgba|hsl|hsla|oklch|color-mix)\(/.test(str)) return true;
    if (/-(?:color|bg|surface|border|tint|glow|palette|ink|accent|brand)(?:-|$)/.test(name)) return true;
    return false;
  }

  const attrRows = attrEntries
    .sort((a, b) => b.htmlUsageCount - a.htmlUsageCount || a.name.localeCompare(b.name))
    .map((entry) => {
      const values = entry.valuesInHtml.length ? entry.valuesInHtml : entry.valuesInCss;

      return `
        <article class="catalog-entry" id="attr-${esc(entry.name)}" data-spw-catalog-kind="attribute">
          <header class="catalog-entry__header">
            <div class="catalog-entry__title-wrap">
              <code class="catalog-entry__name">${esc(entry.name)}</code>
              <button type="button" class="catalog-copy-btn" data-copy-target="${esc(entry.name)}" title="Copy attribute name">Copy</button>
            </div>
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
          <div class="catalog-entry__title-wrap">
            <code class="catalog-entry__name">${esc(file)}</code>
            <button type="button" class="catalog-copy-btn" data-copy-target="${esc(file)}" title="Copy CSS file path">Copy</button>
          </div>
          <span class="catalog-entry__meta">layer ${esc(info.layer || '—')} • ${info.attributesUsed.length} attrs • ${info.tokensDefined.length} tokens</span>
        </header>
        ${info.header ? `<p class="catalog-entry__doc">${esc(info.header)}</p>` : ''}
        ${info.attributesUsed.length ? `<p class="catalog-entry__line"><strong>reads attrs:</strong> ${info.attributesUsed.map((attr) => `<a href="#attr-${esc(attr)}"><code>${esc(attr)}</code></a>`).join(' ')}</p>` : ''}
        ${info.tokensDefined.length ? `<p class="catalog-entry__line"><strong>defines tokens:</strong> ${info.tokensDefined.slice(0, 24).map((token) => `<code>${esc(token)}</code>`).join(' ')}${info.tokensDefined.length > 24 ? ` <em>+${info.tokensDefined.length - 24}</em>` : ''}</p>` : ''}
      </article>
    `)
    .join('\n');

  const imageAssetRows = imageBucketEntries.map(({bucket, assets}) => `
    <section class="catalog-asset-bucket" id="images-${esc(slugifyCatalogId(bucket))}">
      <header class="catalog-asset-bucket__header">
        <h3><code>${esc(bucket)}</code></h3>
        <p class="catalog-asset-bucket__meta">${assets.length} asset${assets.length === 1 ? '' : 's'}</p>
      </header>
      <div class="catalog-asset-grid">
        ${assets.map((asset) => `
          <article class="catalog-entry catalog-entry--asset" data-spw-catalog-kind="image-asset" id="image-${esc(slugifyCatalogId(asset.path))}">
            <header class="catalog-entry__header">
              <div class="catalog-entry__title-wrap">
                <code class="catalog-entry__name"><a href="${esc(asset.href)}">${esc(asset.path)}</a></code>
                <button type="button" class="catalog-copy-btn" data-copy-target="${esc(asset.path)}" title="Copy asset path">Copy</button>
              </div>
              <span class="catalog-entry__meta">${esc(asset.state)} • ${esc(asset.extension)} • ${humanizeBytes(asset.bytes)}</span>
            </header>
            <a class="catalog-entry__preview" href="${esc(asset.href)}" aria-label="Open ${esc(asset.path)}">
              <img src="${esc(asset.href)}" alt="${esc(asset.alt)}" loading="lazy" decoding="async">
            </a>
            <div class="catalog-asset-chips">
              <span class="catalog-chip">bucket: ${esc(asset.bucket)}</span>
              ${asset.sidecars.map((sidecar) => `<a class="catalog-chip catalog-chip--link" href="/${esc(sidecar)}">sidecar: ${esc(path.basename(sidecar))}</a>`).join('')}
            </div>
          </article>
        `).join('\n')}
      </div>
    </section>
  `).join('\n');

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

  // Design catalog improvements (this pass): added "Unique Wonder Connections" audit section.
  // Scans docs + attrs for connections distinctive to spwashi.com wonder (Spw grammar unifying software/math/pedagogy/nutrition as systems;
  // material metaphysics (glass/matte/charge/spacing as paint/attentional flow + liminal science); spell + cauldron as enhanced discovery/control
  // mechanism with settings/vocab wiring (tangential satisfying control, encourage different info structures + semantic density for magic w/ perf minding);
  // rpg + recipes as iterative character/worldbuild + entertainment venue prototype (own restaurant w/ compelling recipes + fantastic service as physical arc);
  // pragmatic engineering perspectives (interviews require abstractions/tech rels, exp design vs dev pace, personality frames, longitudinal vs short-term motivations);
  // AI wonder culture + iterative synthesis across social systems + media tropes/legacy; design-eng hire path (explore copy with wonder); book-like copy clustering + visual variety for flow/salience;
  // preparation for liminality/materials attentional + professional rels. This makes catalog a stronger research instrument + editor surface for the considerations.
  const wonderConnectionsBlock = `
    <section class="catalog-section" id="wonder-connections">
      <h2>Unique Wonder Connections (spwashi.com audit)</h2>
      <p>Connections that feel distinctive to the wonder of this site and can be developed iteratively. Derived from attrs, .spw docs, routes, and runtime (spells/cauldron/liminality/material/venue/rpg/semantic-density). Use to prioritize arcs, copy, and semantic markup (mind performance via enhancement-level + semantic-density).</p>
      <ul class="wonder-connection-list">
        <li><strong>Spw grammar as unifying lens</strong>: operators + braces + cauldron across software (parsers, spw/), math (combinatorics, symmetry, category), pedagogy, nutrition (mise-en-place as composition), craft, rpg worldbuild. Different page structures (atlas vs deep operator leaf vs recipe) reward bumbling exploration + semantic density for "magic".</li>
        <li><strong>Materials as paint + attentional flow + liminality</strong>: data-spw-metamaterial/base + charge/spacing/liminality on frames/cards; glass/matte as ground for speech-bubble metaphysics (l'n'd'r); materials science (permeability, nucleation in recipes/fermentation) meets liminal thresholds (hospitality, restaurant service, page regions). Attentional flow modulated by physics-reason, wonder-state, density.</li>
        <li><strong>Spell + cauldron as discovery + control</strong>: spells.js + navigation-spells + guide-badge cauldron + experiential gestures; wired to settings (physics-reason for cast ease/variability, semantic-density for vocab richness). Tangential control: collect notes, prime checkpoints, traverse states; encourages pages with varied info structures + more data-spw-* for higher-order magic (perf minded via existing models).</li>
        <li><strong>RPG Wednesday + recipes/venue as prototype arcs</strong>: iterative character design (l'n'd'r speech-bubble expertise, clay golem), worldbuild (restaurant scenes as entertainment venue with compelling recipes + fantastic service); physical modality extension of boonhonk (meals, rituals, public culture as readable system). Surface area for narrational flow across digital (site) to physical (venue).</li>
        <li><strong>Pragmatic engineering perspectives + AI wonder culture</strong>: abstractions discovered/taught respecting longitudinal existence + short-term motivations of perspective frames; engineering interviews/tech relationships/exp-design pace vs personality characterizations; culture of iterative wonder with AI synthesizing wisdom across social systems/experiences; develop tropes + media legacy responding to curiosities; lean compelling FE + design engineering; pave hire design engineer who explores site copy with wonder.</li>
        <li><strong>Semantic density for magic + book-like copy</strong>: add data-spw-* (spell, cauldron, liminal, material, artifact, perspective) to encourage "magic" while enhancement-level/semantic-density gate perf; copy clustering/phrasing improvements for mature informative book readability, professional relationship encouragement, visual variety for narrational flow + topical salience. Different structures (hubs vs paths) + bumbling links + scroll reasons + arcs.</li>
      </ul>
      <p class="catalog-note">See .spw frames (spell_cauldron_wonder_vocabulary, liminality_materials_attentional_flow, venue_entertainment_recipes, semantic_density_magic_performance, media_tropes_legacy_ai_wonder, design_engineer_hire_copy, pragmatic_engineering_perspectives, topic_wonder_connections, rpg_character_worldbuild_prep) and agent-optimization/PLAN.md. Catalog run surfaces these for editor inspection.</p>
    </section>
  `;

  const docRows = docEntries.map(([file, info]) => `
    <article class="catalog-entry" data-spw-catalog-kind="doc">
      <header class="catalog-entry__header">
        <div class="catalog-entry__title-wrap">
          <code class="catalog-entry__name"><a href="/${esc(file)}">${esc(file)}</a></code>
          <button type="button" class="catalog-copy-btn" data-copy-target="/${esc(file)}" title="Copy doc path">Copy</button>
        </div>
        <span class="catalog-entry__meta">${info.attributesMentioned.length} attrs • ${info.tokensMentioned.length} tokens</span>
      </header>
      ${info.attributesMentioned.length ? `<p class="catalog-entry__line"><strong>mentions attrs:</strong> ${info.attributesMentioned.map((attr) => `<a href="#attr-${esc(attr)}"><code>${esc(attr)}</code></a>`).join(' ')}</p>` : ''}
    </article>
  `).join('\n');

  const renderedTokenCount = Math.min(tokenEntries.length, 500);
  const totalEntriesCount = attrEntries.length + renderedTokenCount + Object.keys(cssFiles).length + docEntries.length + imageAssets.length + 1;

  return `<!DOCTYPE html>
<html lang="en" data-spw-page-family="design" data-spw-page-role="catalog">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spwashi • Design Catalog</title>
  <meta name="description" content="Traceability catalog: data-spw-* attributes, CSS clusters, tokens, and philosophy docs, cross-referenced across the site-facing surfaces.">
  <meta name="robots" content="noindex">
  <script type="module" src="/public/js/site.js"></script>
  <link rel="stylesheet" href="/public/css/style.css">
  <link rel="stylesheet" href="/design/catalog/catalog.css">
</head>
<body
  data-spw-surface="design"
  data-spw-route-family="design"
  data-spw-context="analysis"
  data-spw-wonder="traceability"
  data-spw-page-family="design"
  data-spw-page-modes="inspect trace browse"
  data-spw-page-role="catalog"
  data-spw-layout="atlas">
<main class="catalog-main" id="catalog-top" data-catalog-density="standard">
  <header class="catalog-masthead">
    <h1>Design Catalog</h1>
    <p class="catalog-masthead__lede">
      Cross-reference of <code>data-spw-*</code> attributes, CSS clusters, custom-property tokens,
      and <code>.spw</code> philosophy documents, scanned across the site-facing surfaces. Generated
      <time datetime="${esc(generatedAt)}">${esc(generatedAt)}</time>.
    </p>
    <p class="catalog-masthead__counts">
      ${counts.attributes} attributes • ${counts.tokens} tokens • ${counts.cssFiles} CSS files • ${counts.docs} philosophy docs • ${counts.imageAssets} images
    </p>
    <nav class="catalog-toc" aria-label="Catalog sections">
      <a href="#attributes">Attributes</a>
      <a href="#tokens">Tokens</a>
      <a href="#css-files">CSS files</a>
      <a href="#assets">Assets</a>
      <a href="#docs">Philosophy docs</a>
      <a href="#orphans">Orphans</a>
      <a href="#wonder-connections">Unique Wonder Connections</a>
    </nav>
  </header>

  <aside class="catalog-toolbar" aria-label="Catalog Search and Filters">
    <div class="catalog-toolbar__row">
      <div class="catalog-search-wrap">
        <input
          id="catalog-search"
          type="search"
          placeholder="Filter attributes, tokens, files, docs... (Press '/' to focus)"
          aria-label="Filter catalog items">
        <button id="catalog-search-clear" type="button" class="catalog-search-clear" aria-label="Clear filter" hidden>&times;</button>
      </div>
      <div class="catalog-count-badge" aria-live="polite">
        Showing <strong id="catalog-visible-count">${totalEntriesCount}</strong> of <span id="catalog-total-count">${totalEntriesCount}</span>
      </div>
    </div>
    <div class="catalog-toolbar__row catalog-toolbar__filters">
      <div class="catalog-filter-group" role="group" aria-label="Filter by kind">
        <button type="button" class="catalog-filter-chip" data-catalog-filter="all" aria-pressed="true">All</button>
        <button type="button" class="catalog-filter-chip" data-catalog-filter="attribute" aria-pressed="false">Attributes (${attrEntries.length})</button>
        <button type="button" class="catalog-filter-chip" data-catalog-filter="token" aria-pressed="false">Tokens (${renderedTokenCount}${tokenEntries.length > renderedTokenCount ? ` of ${tokenEntries.length}` : ''})</button>
        <button type="button" class="catalog-filter-chip" data-catalog-filter="css-file" aria-pressed="false">CSS (${Object.keys(cssFiles).length})</button>
        <button type="button" class="catalog-filter-chip" data-catalog-filter="image-asset" aria-pressed="false">Assets (${imageAssets.length})</button>
        <button type="button" class="catalog-filter-chip" data-catalog-filter="doc" aria-pressed="false">Docs (${docEntries.length})</button>
        <button type="button" class="catalog-filter-chip" data-catalog-filter="orphan" aria-pressed="false">Orphans</button>
      </div>
      <div class="catalog-density-group" role="group" aria-label="View density">
        <span class="catalog-density-label">Density:</span>
        <button type="button" class="catalog-density-btn" data-catalog-density="standard" aria-pressed="true">Standard</button>
        <button type="button" class="catalog-density-btn" data-catalog-density="compact" aria-pressed="false">Compact</button>
      </div>
    </div>
  </aside>

  ${orphanBlock}

  ${wonderConnectionsBlock}

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

  <section class="catalog-section" id="assets">
    <h2>Assets</h2>
    <p>Public image assets and review-side renders. This section is meant for local and production review of the site media inventory.</p>
    <div class="catalog-asset-buckets">${imageAssetRows || '<p><em>No image assets found.</em></p>'}</div>
  </section>

  <section class="catalog-section" id="tokens">
    <h2>Custom-property tokens</h2>
    <p>Every <code>--token</code> — where defined, where consumed.</p>
    <div class="catalog-entries">
      ${tokenEntries.slice(0, 500).map((token) => {
        const isColor = isColorToken(token.name, token.initialValue);
        return `
        <article class="catalog-entry" id="token-${esc(token.name)}" data-spw-catalog-kind="token">
          <header class="catalog-entry__header">
            <div class="catalog-entry__title-wrap">
              ${isColor ? `<span class="catalog-token-swatch" style="background: var(${esc(token.name)}, ${esc(token.initialValue || 'rgba(0,0,0,0.1)')});" title="Preview of ${esc(token.name)}"></span>` : ''}
              <code class="catalog-entry__name">${esc(token.name)}</code>
              <button type="button" class="catalog-copy-btn" data-copy-target="${esc(token.name)}" title="Copy token name">Copy</button>
            </div>
            <span class="catalog-entry__meta">${token.definitions.length} defs • ${token.consumers.length} reads${token.syntax ? ` • syntax <code>${esc(token.syntax)}</code>` : ''}</span>
          </header>
          ${token.initialValue ? `<p class="catalog-entry__line"><strong>initial:</strong> <code>${esc(token.initialValue)}</code></p>` : ''}
          ${token.definitions.length ? `<p class="catalog-entry__line"><strong>defined in:</strong> ${[...new Set(token.definitions.map((definition) => definition.file))].map((file) => `<code>${esc(file)}</code>`).join(' ')}</p>` : ''}
        </article>
      `;
      }).join('\n')}
      ${tokenEntries.length > 500 ? `<p><em>Showing first 500 of ${tokenEntries.length} tokens. See catalog.json for the full list.</em></p>` : ''}
    </div>
  </section>

  <section class="catalog-section" id="docs">
    <h2>Philosophy docs</h2>
    <p><code>.spw/</code> files that name attributes or tokens — the prose source of meaning.</p>
    <div class="catalog-entries">${docRows}</div>
  </section>
</main>

<a href="#catalog-top" class="catalog-back-to-top" id="catalog-back-to-top" aria-label="Back to top" hidden>↑ Top</a>

<script type="module">
  function initDesignCatalog() {
    const searchInput = document.getElementById('catalog-search');
    const clearBtn = document.getElementById('catalog-search-clear');
    const countDisplay = document.getElementById('catalog-visible-count');
    const filterButtons = document.querySelectorAll('[data-catalog-filter]');
    const densityButtons = document.querySelectorAll('[data-catalog-density]');
    const entries = Array.from(document.querySelectorAll('.catalog-entry, .catalog-asset-bucket'));
    const sections = Array.from(document.querySelectorAll('.catalog-section'));
    const backToTop = document.getElementById('catalog-back-to-top');

    let currentFilter = 'all';
    let currentQuery = '';
    let visibilityFrame = 0;

    function updateVisibility() {
      visibilityFrame = 0;
      const q = currentQuery.trim().toLowerCase();
      let visibleCount = 0;

      entries.forEach((entry) => {
        const kind = entry.dataset.spwCatalogKind || (entry.classList.contains('catalog-asset-bucket') ? 'asset-bucket' : '');
        const matchesFilter = currentFilter === 'all'
          || (currentFilter === 'attribute' && kind === 'attribute')
          || (currentFilter === 'token' && kind === 'token')
          || (currentFilter === 'css-file' && kind === 'css-file')
          || (currentFilter === 'image-asset' && (kind === 'image-asset' || kind === 'asset-bucket'))
          || (currentFilter === 'doc' && kind === 'doc')
          || (currentFilter === 'orphan' && entry.closest('#orphans'));

        const text = entry.textContent.toLowerCase();
        const matchesQuery = !q || text.includes(q);

        const isVisible = matchesFilter && matchesQuery;
        entry.hidden = !isVisible;
        if (isVisible && kind !== 'asset-bucket') visibleCount++;
      });

      sections.forEach((section) => {
        if (section.id === 'orphans') {
          const matchesOrphanFilter = currentFilter === 'all' || currentFilter === 'orphan';
          const matchesOrphanQuery = !q || section.textContent.toLowerCase().includes(q);
          section.hidden = !matchesOrphanFilter || !matchesOrphanQuery;
          if (!section.hidden) visibleCount += 1;
          return;
        }
        if (section.id === 'wonder-connections') {
          section.hidden = currentFilter !== 'all'
            || Boolean(q && !section.textContent.toLowerCase().includes(q));
          return;
        }
        const visibleChild = section.querySelector('.catalog-entry:not([hidden]), .catalog-asset-bucket:not([hidden])');
        section.hidden = (currentFilter !== 'all' || Boolean(q)) && !visibleChild;
      });

      if (countDisplay) {
        countDisplay.textContent = visibleCount;
      }
    }

    function scheduleVisibilityUpdate() {
      if (visibilityFrame) return;
      visibilityFrame = window.requestAnimationFrame(updateVisibility);
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentQuery = e.target.value;
        if (clearBtn) clearBtn.hidden = !currentQuery;
        scheduleVisibilityUpdate();
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput && !['input', 'textarea'].includes(document.activeElement?.tagName?.toLowerCase())) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        } else if (e.key === 'Escape' && document.activeElement === searchInput) {
          searchInput.value = '';
          currentQuery = '';
          if (clearBtn) clearBtn.hidden = true;
          searchInput.blur();
          updateVisibility();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        currentQuery = '';
        clearBtn.hidden = true;
        updateVisibility();
      });
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        currentFilter = btn.dataset.catalogFilter || 'all';
        updateVisibility();
      });
    });

    densityButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        densityButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        const density = btn.dataset.catalogDensity;
        document.querySelector('.catalog-main')?.setAttribute('data-catalog-density', density);
      });
    });

    document.addEventListener('click', async (e) => {
      const copyBtn = e.target.closest('[data-copy-target]');
      if (!copyBtn) return;
      const textToCopy = copyBtn.dataset.copyTarget;
      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.classList.remove('copied');
        }, 1600);
      } catch (err) {
        console.warn('Clipboard copy failed:', err);
      }
    });

    if (backToTop) {
      window.addEventListener('scroll', () => {
        backToTop.hidden = window.scrollY < 400;
      }, { passive: true });
    }

    updateVisibility();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDesignCatalog);
  } else {
    initDesignCatalog();
  }
</script>
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
.catalog-toc--compact { gap: 0.5rem 0.75rem; font-size: 0.8rem; }
.catalog-toc a { text-decoration: none; border-bottom: 1px dotted currentColor; }

/* Sticky interactive search and filter toolbar */
.catalog-toolbar {
  position: sticky;
  top: 1rem;
  z-index: 100;
  background: var(--surface-glass, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--line, rgba(0, 0, 0, 0.12));
  border-radius: 0.75rem;
  padding: 0.85rem 1.15rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  display: grid;
  gap: 0.75rem;
}
.catalog-toolbar__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.catalog-search-wrap {
  position: relative;
  flex: 1 1 20rem;
  display: flex;
  align-items: center;
}
#catalog-search {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.85rem;
  font-size: 0.92rem;
  border-radius: 0.45rem;
  border: 1px solid var(--line, rgba(0, 0, 0, 0.18));
  background: var(--surface, rgba(255, 255, 255, 0.9));
  color: inherit;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
#catalog-search:focus {
  border-color: var(--op-frame-color, #008899);
  box-shadow: 0 0 0 3px rgba(0, 136, 153, 0.18);
}
.catalog-search-clear {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--ink-soft, #778);
  cursor: pointer;
  padding: 0.2rem;
  line-height: 1;
}
.catalog-count-badge {
  font-size: 0.85rem;
  color: var(--ink-soft, #556);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.catalog-toolbar__filters {
  font-size: 0.85rem;
}
.catalog-filter-group,
.catalog-density-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.catalog-filter-chip,
.catalog-density-btn {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid var(--line, rgba(0, 0, 0, 0.12));
  background: var(--surface-soft, rgba(0, 0, 0, 0.04));
  color: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.catalog-filter-chip[aria-pressed="true"],
.catalog-density-btn[aria-pressed="true"] {
  background: var(--op-frame-color, #008899);
  color: #fff;
  border-color: transparent;
}
.catalog-density-label {
  font-size: 0.8rem;
  color: var(--ink-soft, #667);
  margin-right: 0.2rem;
}

.catalog-section { display: grid; gap: 1rem; }
.catalog-section h2 { margin: 0; }
.catalog-entries { display: grid; gap: 0.75rem; }
.catalog-asset-buckets { display: grid; gap: 1.5rem; }
.catalog-asset-bucket { display: grid; gap: 0.75rem; }
.catalog-asset-bucket__header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; align-items: baseline; }
.catalog-asset-bucket__meta { margin: 0; font-size: 0.85rem; color: var(--ink-soft, #667); }
.catalog-asset-grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }

.catalog-entry {
  padding: 0.75rem 1rem;
  border: 1px solid var(--line, rgba(0,0,0,0.1));
  border-radius: 0.5rem;
  background: var(--surface, rgba(255,255,255,0.6));
  display: grid; gap: 0.35rem;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.catalog-entry:hover {
  border-color: var(--op-frame-color, rgba(0, 136, 153, 0.4));
}
.catalog-entry--asset { gap: 0.6rem; }
.catalog-entry__header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.catalog-entry__title-wrap { display: flex; align-items: center; gap: 0.5rem; }
.catalog-entry__name { font-weight: 600; }
.catalog-entry__meta { font-size: 0.8rem; color: var(--ink-soft, #667); font-variant-numeric: tabular-nums; }
.catalog-entry__line { margin: 0; font-size: 0.88rem; }
.catalog-entry__line code { font-size: 0.82rem; }
.catalog-entry__line--warn { color: hsl(18 60% 40%); }
.catalog-entry__doc { margin: 0; font-size: 0.85rem; color: var(--ink-soft, #556); font-style: italic; }

/* Quick Copy button */
.catalog-copy-btn {
  padding: 0.12rem 0.45rem;
  font-size: 0.72rem;
  border-radius: 0.25rem;
  border: 1px solid var(--line, rgba(0, 0, 0, 0.15));
  background: var(--surface-soft, rgba(0, 0, 0, 0.04));
  color: var(--ink-soft, #556);
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.catalog-entry:hover .catalog-copy-btn,
.catalog-copy-btn:focus-visible {
  opacity: 1;
}
.catalog-copy-btn.copied {
  opacity: 1;
  background: var(--op-topic-color, #1a8754);
  color: #fff;
  border-color: transparent;
}

/* Token Color Swatch */
.catalog-token-swatch {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 0.2rem;
  border: 1px solid var(--line, rgba(0, 0, 0, 0.2));
  vertical-align: middle;
  flex-shrink: 0;
}

/* Compact view mode */
.catalog-main[data-catalog-density="compact"] .catalog-entry {
  padding: 0.4rem 0.75rem;
  gap: 0.15rem;
}
.catalog-main[data-catalog-density="compact"] .catalog-entry__line {
  font-size: 0.8rem;
}
.catalog-main[data-catalog-density="compact"] .catalog-entries {
  gap: 0.4rem;
}

.orphan-list dt { font-weight: 600; margin-top: 0.5rem; }
.orphan-list dd { margin: 0.15rem 0 0.5rem 0; display: flex; flex-wrap: wrap; gap: 0.35rem; }
.catalog-entry__preview { display: block; border-radius: 0.45rem; overflow: hidden; aspect-ratio: 4 / 3; background: var(--surface-soft, rgba(0,0,0,0.04)); border: 1px solid var(--line, rgba(0,0,0,0.1)); }
.catalog-entry__preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.catalog-asset-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.catalog-chip { display: inline-flex; align-items: center; padding: 0.15rem 0.45rem; border-radius: 999px; background: var(--surface-soft, rgba(0,0,0,0.05)); font-size: 0.75rem; }
.catalog-chip--link { text-decoration: none; color: inherit; }

.catalog-back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 99;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: var(--surface-glass, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(12px);
  border: 1px solid var(--line, rgba(0, 0, 0, 0.15));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: inherit;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.catalog-back-to-top:hover {
  transform: translateY(-2px);
}
@media (prefers-reduced-motion: reduce) {
  .catalog-entry,
  .catalog-filter-chip,
  .catalog-density-btn,
  .catalog-copy-btn,
  .catalog-back-to-top {
    transition: none;
  }
  .catalog-back-to-top:hover { transform: none; }
}
`;

function isColorCatalogToken(name, value = '') {
  const str = String(value || '').trim();
  return /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(str)
    || /^(?:rgb|rgba|hsl|hsla|oklch|color-mix)\(/.test(str)
    || /-(?:color|bg|surface|border|tint|glow|palette|ink|accent|brand)(?:-|$)/.test(name);
}

function uniqueAssetRoutes(asset) {
  return [...new Set((asset.usages || []).map((usage) => usage.route))].sort();
}

function modelBriefForAsset(asset) {
  const routes = uniqueAssetRoutes(asset);
  const routeContext = routes.length ? ` Seen on ${routes.join(', ')}.` : '';
  return `Image reference: ${asset.alt}. Source: /${asset.path}.${routeContext} Study the composition, type hierarchy, spacing, material, and recurring motif. Borrow the visual relationships; write copy for the new page's own purpose.`;
}

function renderImageAssetCard(asset, options = {}) {
  const routes = uniqueAssetRoutes(asset);
  const title = titleFromStem(asset.stem);
  const routeLinks = routes.slice(0, options.routeLimit || 4)
    .map((route) => `<a href="${esc(route)}">${esc(route)}</a>`)
    .join(' ');

  return `
    <article class="catalog-entry catalog-entry--asset" data-catalog-entry data-spw-catalog-kind="image-asset" data-catalog-state="${esc(asset.state)}" id="image-${esc(slugifyCatalogId(asset.path))}">
      <a class="catalog-entry__preview" href="${esc(asset.href)}" aria-label="Open ${esc(title)}">
        <img src="${esc(asset.href)}" alt="${esc(asset.alt)}" loading="lazy" decoding="async">
      </a>
      <div class="catalog-entry__body">
        <header class="catalog-entry__header">
          <div>
            <p class="catalog-entry__eyebrow">${esc(asset.state)} · ${esc(asset.extension)} · ${humanizeBytes(asset.bytes)}</p>
            <h3>${esc(title)}</h3>
          </div>
          <button type="button" class="catalog-copy-btn" data-copy-target="${esc(modelBriefForAsset(asset))}">Copy model brief</button>
        </header>
        <p class="catalog-entry__description">${esc(asset.alt)}</p>
        <p class="catalog-entry__path"><code>/${esc(asset.path)}</code></p>
        ${routeLinks ? `<p class="catalog-entry__routes"><strong>Seen in context</strong> ${routeLinks}${routes.length > 4 ? ` <span>+${routes.length - 4}</span>` : ''}</p>` : '<p class="catalog-entry__routes"><strong>Route context</strong> not yet authored</p>'}
        <div class="catalog-asset-chips">
          <span class="catalog-chip">${esc(asset.bucket)}</span>
          ${asset.sidecars.map((sidecar) => `<a class="catalog-chip catalog-chip--link" href="/${esc(sidecar)}">${esc(path.basename(sidecar))}</a>`).join('')}
        </div>
      </div>
    </article>`;
}

function selectFeaturedAssets(imageAssets, limit = 10) {
  const candidates = imageAssets
    .filter((asset) => asset.state !== 'raw' && uniqueAssetRoutes(asset).length && !/(?:favicon|touch-icon|app-icon)/i.test(asset.path))
    .sort((left, right) => {
      const routeDifference = uniqueAssetRoutes(right).length - uniqueAssetRoutes(left).length;
      if (routeDifference) return routeDifference;
      if (right.sidecars.length !== left.sidecars.length) return right.sidecars.length - left.sidecars.length;
      return left.path.localeCompare(right.path);
    });
  const selected = [];
  const usedBuckets = new Set();

  for (const asset of candidates) {
    if (usedBuckets.has(asset.bucket)) continue;
    selected.push(asset);
    usedBuckets.add(asset.bucket);
    if (selected.length >= limit) return selected;
  }

  for (const asset of candidates) {
    if (selected.includes(asset)) continue;
    selected.push(asset);
    if (selected.length >= limit) break;
  }

  return selected;
}

function renderRoomNav(currentPage) {
  const rooms = [
    ['overview', '/design/catalog/', 'Field guide'],
    ['assets', '/design/catalog/assets/', 'Stills'],
    ['tokens', '/design/catalog/tokens/', 'Tokens'],
    ['systems', '/design/catalog/systems/', 'Systems'],
    ['design', '/design/', 'Design hub'],
  ];

  return `<nav class="catalog-room-nav" aria-label="Design catalog rooms">
    ${rooms.map(([page, href, label]) => `<a href="${href}"${page === currentPage ? ' aria-current="page"' : ''}>${label}</a>`).join('\n    ')}
  </nav>`;
}

function renderCounts(counts) {
  const items = [
    [counts.imageAssets, 'images'],
    [counts.attributes, 'attributes'],
    [counts.tokens, 'tokens'],
    [counts.cssFiles, 'CSS files'],
    [counts.docs, 'meaning docs'],
  ];

  return `<dl class="catalog-counts" aria-label="Catalog inventory">
    ${items.map(([value, label]) => `<div><dt>${value}</dt><dd>${label}</dd></div>`).join('\n    ')}
  </dl>`;
}

function renderCatalogPage({page, title, lede, description, counts, generatedAt, body}) {
  const canonicalPath = page === 'overview' ? '/design/catalog/' : `/design/catalog/${page}/`;

  return `<!DOCTYPE html>
<html lang="en" data-spw-page-family="design" data-spw-page-role="catalog">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spwashi • ${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="https://spwashi.com${canonicalPath}">
  <script type="module" src="/public/js/site.js"></script>
  <link rel="stylesheet" href="/public/css/style.css">
  <link rel="stylesheet" href="/design/catalog/catalog.css">
</head>
<body
  data-spw-surface="design"
  data-spw-route-family="design"
  data-spw-context="analysis"
  data-spw-wonder="traceability composition typography layout"
  data-spw-page-family="design"
  data-spw-page-modes="browse inspect compare reuse"
  data-spw-page-role="catalog"
  data-spw-layout="atlas">
<main class="catalog-main" id="catalog-top" data-catalog-page="${esc(page)}" data-catalog-density="standard">
  ${renderRoomNav(page)}
  <header class="catalog-masthead">
    <div class="catalog-masthead__copy">
      <p class="catalog-kicker">Design field guide · generated evidence</p>
      <h1>${esc(title)}</h1>
      <p class="catalog-masthead__lede">${esc(lede)}</p>
      <p class="catalog-masthead__stamp">Regenerated <time datetime="${esc(generatedAt)}">${esc(generatedAt.slice(0, 10))}</time> from the authored site.</p>
    </div>
    ${renderCounts(counts)}
  </header>
  ${body}
</main>
<button type="button" class="catalog-back-to-top" id="catalog-back-to-top" data-catalog-top-href="${canonicalPath}" aria-label="Back to top" hidden>↑ Top</button>
<script type="module" src="/design/catalog/catalog.js"></script>
</body>
</html>
`;
}

function renderSearchToolbar({counts, total, kinds = [], states = [], overview = false}) {
  return `<aside class="catalog-toolbar" aria-label="Search this catalog room">
    <div class="catalog-toolbar__row">
      <div class="catalog-search-wrap">
        <label class="visually-hidden" for="catalog-search">Search the design catalog</label>
        <input id="catalog-search" type="search" placeholder="${overview ? 'Search the full catalog…' : 'Filter this room…'}" autocomplete="off">
        <button id="catalog-search-clear" type="button" class="catalog-search-clear" aria-label="Clear search" hidden>×</button>
      </div>
      <p class="catalog-count-badge" aria-live="polite"><strong id="catalog-visible-count">${overview ? 0 : (total ?? '—')}</strong> <span id="catalog-count-label">${overview ? 'matches' : 'visible'}</span></p>
    </div>
    ${(kinds.length || states.length) ? `<div class="catalog-toolbar__row catalog-toolbar__filters">
      ${kinds.length ? `<div class="catalog-filter-group" role="group" aria-label="Filter by kind">
        <button type="button" class="catalog-filter-chip" data-catalog-filter="all" aria-pressed="true">All</button>
        ${kinds.map(([kind, label, count]) => `<button type="button" class="catalog-filter-chip" data-catalog-filter="${esc(kind)}" aria-pressed="false">${esc(label)}${Number.isFinite(count) ? ` <span>${count}</span>` : ''}</button>`).join('')}
      </div>` : ''}
      ${states.length ? `<div class="catalog-filter-group" role="group" aria-label="Filter stills by state">
        <button type="button" class="catalog-filter-chip" data-catalog-state-filter="all" aria-pressed="true">All states</button>
        ${states.map((state) => `<button type="button" class="catalog-filter-chip" data-catalog-state-filter="${esc(state)}" aria-pressed="false">${esc(state)}</button>`).join('')}
      </div>` : ''}
      <div class="catalog-density-group" role="group" aria-label="View density">
        <button type="button" class="catalog-density-btn" data-catalog-density="standard" aria-pressed="true">Roomy</button>
        <button type="button" class="catalog-density-btn" data-catalog-density="compact" aria-pressed="false">Compact</button>
      </div>
    </div>` : ''}
  </aside>`;
}

function renderStudyCards() {
  const cards = [
    {
      label: '01 · component',
      title: 'What can this still teach about the component?',
      copy: 'Compare slot order, edges, actions, density, and how the card sits in company. Capture the page, the component, and the portable template for three different truths.',
      href: '/design/components/#component-recipes-capture',
      action: 'Study component captures',
    },
    {
      label: '02 · typography',
      title: 'Does the copy keep its hierarchy when the words change?',
      copy: 'Use repeated stills to notice measure, wrapping, label-to-title contrast, paragraph rhythm, and which lines begin competing at pocket width.',
      href: '/settings/#typography-measurement-preview',
      action: 'Open the type measurement',
    },
    {
      label: '03 · layout',
      title: 'Is this a trend, a breakpoint, or a bug?',
      copy: 'Compare pocket, fold, and broadsheet. Look for clipping, empty tracks, accidental symmetry, duplicated surfaces, and a layout that loses its reason between widths.',
      href: '/design/composition/#spatial-gravity-title',
      action: 'Inspect spatial gravity',
    },
    {
      label: '04 · trope',
      title: 'Which visual relationship is worth carrying forward?',
      copy: 'Name the frame, motif, material, light, and posture before using a still as a model reference. Borrow the relationship; keep the destination’s own meaning and copy.',
      href: '/design/palettes/',
      action: 'Trace palette and material',
    },
  ];

  return cards.map((card) => `<article class="catalog-study-card">
    <p class="catalog-study-card__label">${esc(card.label)}</p>
    <h3>${esc(card.title)}</h3>
    <p>${esc(card.copy)}</p>
    <a href="${esc(card.href)}">${esc(card.action)} <span aria-hidden="true">→</span></a>
  </article>`).join('\n');
}

function renderCatalogOverview({attrs, cssFiles, tokens, docs, imageAssets, orphans, generatedAt, counts}) {
  const featuredAssets = selectFeaturedAssets(imageAssets, 8);
  const body = `
  <section class="catalog-section catalog-section--opening" id="study">
    <header class="catalog-section__header">
      <p class="catalog-kicker">Four ways to look</p>
      <h2>Read the information. Then read the design carrying it.</h2>
      <p>A still is useful when it preserves a question. These lenses make screenshots and public images into evidence for the next component, type decision, layout repair, or visual direction.</p>
    </header>
    <div class="catalog-study-grid">${renderStudyCards()}</div>
  </section>

  <section class="catalog-section catalog-section--search" id="search">
    <header class="catalog-section__header catalog-section__header--split">
      <div>
        <p class="catalog-kicker">Find a handle</p>
        <h2>Search the complete design graph.</h2>
      </div>
      <p>Results open in the focused still, token, or systems room. Try <code>typography</code>, <code>cards.css</code>, <code>metamaterial</code>, or an image name.</p>
    </header>
    ${renderSearchToolbar({counts, overview: true, kinds: [
      ['image-asset', 'Stills', counts.imageAssets],
      ['attribute', 'Attributes', counts.attributes],
      ['token', 'Tokens', counts.tokens],
      ['css-file', 'CSS', counts.cssFiles],
      ['doc', 'Meaning', counts.docs],
    ]})}
    <div class="catalog-search-results" id="catalog-search-results">
      <p class="catalog-search-prompt">Type two or more characters to search without loading thousands of records into the page.</p>
    </div>
  </section>

  <section class="catalog-section" id="stills">
    <header class="catalog-section__header catalog-section__header--split">
      <div>
        <p class="catalog-kicker">Route-anchored stills</p>
        <h2>Begin with images that already live in context.</h2>
      </div>
      <p>These references are selected by authored route use, not a taste score. Open a route to see what the image is doing around real copy.</p>
    </header>
    <div class="catalog-asset-grid catalog-asset-grid--featured">${featuredAssets.map((asset) => renderImageAssetCard(asset, {routeLimit: 2})).join('\n')}</div>
    <p class="catalog-section__action"><a href="/design/catalog/assets/">Browse all ${counts.imageAssets} stills and image assets <span aria-hidden="true">→</span></a></p>
  </section>

  <section class="catalog-section" id="inventory">
    <header class="catalog-section__header">
      <p class="catalog-kicker">Rooms behind the field guide</p>
      <h2>Go deep only where the question needs it.</h2>
    </header>
    <div class="catalog-room-grid">
      <a class="catalog-room-card catalog-room-card--visual" href="/design/catalog/assets/"><span>stills</span><strong>Image &amp; still index</strong><em>Route context, alt text, sidecars, and model briefs.</em></a>
      <a class="catalog-room-card" href="/design/catalog/tokens/"><span>tokens</span><strong>Named design decisions</strong><em>Color, type, spacing, shape, material, and motion handles.</em></a>
      <a class="catalog-room-card" href="/design/catalog/systems/"><span>systems</span><strong>Cross-language trace</strong><em>Attributes, CSS owners, JavaScript writers, and meaning docs.</em></a>
      <a class="catalog-room-card catalog-room-card--friction" href="/design/catalog/systems/#orphans"><span>friction</span><strong>${orphans.attrsInCssNotHtml.length + orphans.attrsInHtmlNotCss.length} trace gaps</strong><em>Useful suspicions, not automatic defects.</em></a>
      <a class="catalog-room-card" href="/design/catalog/catalog.json"><span>machine</span><strong>Canonical JSON graph</strong><em>The complete scan for local tools and language-model analysis.</em></a>
    </div>
  </section>

  <section class="catalog-section" id="tropes">
    <header class="catalog-section__header">
      <p class="catalog-kicker">Recurring design tropes</p>
      <h2>Follow a relation, not a style label.</h2>
      <p>The most useful site motifs connect information and atmosphere: frame as address, field as relation, material as reading condition, and route as room. Each becomes more convincing when it survives another page with different copy.</p>
    </header>
    <nav class="catalog-wander-grid" aria-label="Continue through the design system">
      <a href="/design/components/"><strong>Frame as address</strong><span>Study components and their slots.</span></a>
      <a href="/design/composition/"><strong>Field as relation</strong><span>See how pieces pack and influence one another.</span></a>
      <a href="/design/materials/"><strong>Material as condition</strong><span>Compare glass, matte, paper, and canvas.</span></a>
      <a href="/design/folios/"><strong>Artifact as memory</strong><span>Browse work that keeps a practice visible.</span></a>
      <a href="/play/"><strong>Route as room</strong><span>Meet the grammar under playful pressure.</span></a>
      <a href="/about/website/"><strong>Site as authored surface</strong><span>Read why this place is built this way.</span></a>
    </nav>
  </section>`;

  return renderCatalogPage({
    page: 'overview',
    title: 'Design Catalog',
    lede: 'A field guide to the site’s components, typography, layouts, images, and recurring visual ideas. Use it to notice what works, name what breaks, borrow a relationship, and wander back into the live work.',
    description: 'A visitor-readable field guide to Spwashi components, typography, layouts, stills, tokens, and visual motifs.',
    counts,
    generatedAt,
    body,
  });
}

function renderAssetIndex({imageAssets, generatedAt, counts}) {
  const imageBucketMap = new Map();
  for (const asset of imageAssets) {
    const bucket = imageBucketMap.get(asset.bucket) || [];
    bucket.push(asset);
    imageBucketMap.set(asset.bucket, bucket);
  }
  const bucketEntries = [...imageBucketMap.entries()].sort(([left], [right]) => left.localeCompare(right));
  const states = [...new Set(imageAssets.map((asset) => asset.state))].sort();
  const bucketNav = bucketEntries.map(([bucket, assets]) => `<a href="#images-${esc(slugifyCatalogId(bucket))}">${esc(bucket)} <span>${assets.length}</span></a>`).join('');
  const buckets = bucketEntries.map(([bucket, assets]) => `<section class="catalog-asset-bucket" data-catalog-group id="images-${esc(slugifyCatalogId(bucket))}">
    <header class="catalog-asset-bucket__header"><h2><code>${esc(bucket)}</code></h2><p>${assets.length} still${assets.length === 1 ? '' : 's'}</p></header>
    <div class="catalog-asset-grid">${assets.map((asset) => renderImageAssetCard(asset)).join('\n')}</div>
  </section>`).join('\n');
  const body = `
  <section class="catalog-section catalog-section--method">
    <header class="catalog-section__header">
      <p class="catalog-kicker">Stills as working evidence</p>
      <h2>Keep the question attached to the image.</h2>
      <p>Public images are curated route material. Local capture packs remain editor-side evidence. Use the four study lenses below before promoting a still or handing it to a model.</p>
    </header>
    <div class="catalog-study-grid">${renderStudyCards()}</div>
  </section>
  <section class="catalog-section catalog-section--controls" id="index">
    <header class="catalog-section__header catalog-section__header--split"><div><p class="catalog-kicker">Image index</p><h2>Search by name, route, alt text, bucket, or state.</h2></div><p>“Copy model brief” carries source and route context with the image’s visible description.</p></header>
    ${renderSearchToolbar({counts, total: imageAssets.length, states})}
    <nav class="catalog-bucket-nav" aria-label="Image buckets">${bucketNav}</nav>
  </section>
  <div class="catalog-asset-buckets">${buckets}</div>`;

  return renderCatalogPage({
    page: 'assets',
    title: 'Image & Still Index',
    lede: 'Study public images as route evidence: where they appear, what their alt text says, which sidecars explain them, and which visual relationships might survive another page.',
    description: 'Public image and still references with route context, alt text, sidecars, and copyable model briefs.',
    counts,
    generatedAt,
    body,
  });
}

function renderTokenCard(token) {
  const color = isColorCatalogToken(token.name, token.initialValue);
  const definitionFiles = [...new Set(token.definitions.map((definition) => definition.file))];
  return `<article class="catalog-entry" data-catalog-entry data-catalog-color="${color}" id="token-${esc(token.name)}" data-spw-catalog-kind="token">
    <header class="catalog-entry__header">
      <div class="catalog-entry__title-wrap">
        ${color ? `<span class="catalog-token-swatch" style="background:var(${esc(token.name)}, ${esc(token.initialValue || 'transparent')})" aria-hidden="true"></span>` : ''}
        <code class="catalog-entry__name">${esc(token.name)}</code>
      </div>
      <button type="button" class="catalog-copy-btn" data-copy-target="${esc(token.name)}">Copy token</button>
    </header>
    <p class="catalog-entry__meta">${token.definitions.length} definition${token.definitions.length === 1 ? '' : 's'} · ${token.consumers.length} reads${token.syntax ? ` · ${esc(token.syntax)}` : ''}</p>
    ${token.initialValue ? `<p class="catalog-entry__line"><strong>Initial</strong> <code>${esc(token.initialValue)}</code></p>` : ''}
    ${definitionFiles.length ? `<p class="catalog-entry__line"><strong>Owned by</strong> ${definitionFiles.map((file) => `<code>${esc(file)}</code>`).join(' ')}</p>` : ''}
  </article>`;
}

function renderTokenIndex({tokens, generatedAt, counts}) {
  const tokenEntries = [...tokens.values()].sort((left, right) => left.name.localeCompare(right.name));
  const body = `
  <section class="catalog-section catalog-section--opening">
    <header class="catalog-section__header"><p class="catalog-kicker">Tokens are decisions</p><h2>Read the name before the number.</h2><p>A strong token says what a value is for, where it can vary, and which family it belongs to. Compare type, measure, spacing, material, color, and timing without collapsing them into one theme knob.</p></header>
    <nav class="catalog-wander-grid" aria-label="Token study routes">
      <a href="/settings/#typography-measurement-preview"><strong>Typography &amp; measure</strong><span>Test the reading hierarchy with real copy.</span></a>
      <a href="/design/palettes/"><strong>Palette grammar</strong><span>See color tokens acting in a family.</span></a>
      <a href="/design/materials/"><strong>Material conditions</strong><span>See surface tokens change legibility.</span></a>
      <a href="/design/experiments/css/"><strong>CSS rule bench</strong><span>Inspect how tokens meet selectors and layers.</span></a>
    </nav>
  </section>
  <section class="catalog-section catalog-section--controls" id="tokens">
    <header class="catalog-section__header catalog-section__header--split"><div><p class="catalog-kicker">Complete token index</p><h2>${tokenEntries.length} named handles</h2></div><p>Search a purpose such as <code>measure</code>, <code>ink</code>, <code>gap</code>, <code>motion</code>, or <code>material</code>.</p></header>
    ${renderSearchToolbar({counts, total: tokenEntries.length, kinds: [['color', 'Color-like', tokenEntries.filter((token) => isColorCatalogToken(token.name, token.initialValue)).length]]})}
    <div class="catalog-entries">${tokenEntries.map(renderTokenCard).join('\n')}</div>
  </section>`;

  return renderCatalogPage({
    page: 'tokens',
    title: 'Design Token Index',
    lede: 'A complete index of the site’s named design decisions—what defines them, what reads them, and where to see them act on real copy and components.',
    description: 'Design tokens for typography, color, spacing, shape, material, and motion, cross-referenced across the site.',
    counts,
    generatedAt,
    body,
  });
}

function renderSystemsIndex({attrs, cssFiles, docs, orphans, generatedAt, counts}) {
  const attrRows = Object.values(attrs).sort((left, right) => right.htmlUsageCount - left.htmlUsageCount || left.name.localeCompare(right.name)).map((entry) => {
    const values = entry.valuesInHtml.length ? entry.valuesInHtml : entry.valuesInCss;
    return `<article class="catalog-entry" data-catalog-entry id="attr-${esc(entry.name)}" data-spw-catalog-kind="attribute">
      <header class="catalog-entry__header"><code class="catalog-entry__name">${esc(entry.name)}</code><button type="button" class="catalog-copy-btn" data-copy-target="${esc(entry.name)}">Copy attribute</button></header>
      <p class="catalog-entry__meta">${entry.cssSelectors.length} CSS · ${entry.htmlUsageCount} HTML · ${entry.jsWrites.length} JS · ${entry.docMentions.length} meaning</p>
      ${values.length ? `<p class="catalog-entry__line"><strong>Values</strong> ${values.slice(0, 24).map((value) => `<code>${esc(value)}</code>`).join(' ')}${values.length > 24 ? ` <em>+${values.length - 24}</em>` : ''}</p>` : ''}
      ${entry.cssFiles.length ? `<p class="catalog-entry__line"><strong>CSS</strong> ${entry.cssFiles.map((file) => `<a href="#css-${esc(slugifyCatalogId(file))}"><code>${esc(file)}</code></a>`).join(' ')}</p>` : ''}
      ${entry.jsFiles.length ? `<p class="catalog-entry__line"><strong>Writers</strong> ${entry.jsFiles.map((file) => `<code>${esc(file)}</code>`).join(' ')}</p>` : ''}
    </article>`;
  }).join('\n');
  const cssRows = Object.entries(cssFiles).sort(([left], [right]) => left.localeCompare(right)).map(([file, info]) => `<article class="catalog-entry" data-catalog-entry id="css-${esc(slugifyCatalogId(file))}" data-spw-catalog-kind="css-file">
    <header class="catalog-entry__header"><code class="catalog-entry__name">${esc(file)}</code><button type="button" class="catalog-copy-btn" data-copy-target="${esc(file)}">Copy path</button></header>
    <p class="catalog-entry__meta">layer ${esc(info.layer || 'unassigned')} · ${info.attributesUsed.length} attributes · ${info.tokensDefined.length} definitions</p>
    ${info.header ? `<p class="catalog-entry__doc">${esc(info.header)}</p>` : ''}
  </article>`).join('\n');
  const docRows = Object.entries(docs).sort(([left], [right]) => left.localeCompare(right)).map(([file, info]) => `<article class="catalog-entry" data-catalog-entry id="doc-${esc(slugifyCatalogId(file))}" data-spw-catalog-kind="doc">
    <header class="catalog-entry__header"><code class="catalog-entry__name"><a href="/${esc(file)}">${esc(file)}</a></code><button type="button" class="catalog-copy-btn" data-copy-target="/${esc(file)}">Copy path</button></header>
    <p class="catalog-entry__meta">${info.attributesMentioned.length} attributes · ${info.tokensMentioned.length} tokens</p>
  </article>`).join('\n');
  const orphanGroups = [
    ['CSS without authored HTML', orphans.attrsInCssNotHtml],
    ['HTML without CSS readers', orphans.attrsInHtmlNotCss],
    ['Runtime surface without a meaning doc', orphans.attrsWithNoDoc],
    ['Meaning doc without implementation', orphans.attrsInDocOnly],
  ];
  const body = `
  <section class="catalog-section catalog-section--opening">
    <header class="catalog-section__header"><p class="catalog-kicker">Cross-language trace</p><h2>Follow one name through structure, presentation, behavior, and meaning.</h2><p>Use this room when a visual question becomes architectural: which HTML carries it, which CSS reads it, whether JavaScript writes it, and where the durable idea is explained.</p></header>
  </section>
  <section class="catalog-section catalog-section--controls" id="trace">
    ${renderSearchToolbar({counts, total: counts.attributes + counts.cssFiles + counts.docs, kinds: [['attribute', 'Attributes', counts.attributes], ['css-file', 'CSS', counts.cssFiles], ['doc', 'Meaning', counts.docs]]})}
  </section>
  <details class="catalog-index-group" data-catalog-group open><summary><span>Attributes</span><strong>${counts.attributes}</strong></summary><div class="catalog-entries">${attrRows}</div></details>
  <details class="catalog-index-group" data-catalog-group><summary><span>CSS files</span><strong>${counts.cssFiles}</strong></summary><div class="catalog-entries">${cssRows}</div></details>
  <details class="catalog-index-group" data-catalog-group><summary><span>Meaning docs</span><strong>${counts.docs}</strong></summary><div class="catalog-entries">${docRows}</div></details>
  <section class="catalog-section catalog-section--friction" id="orphans">
    <header class="catalog-section__header"><p class="catalog-kicker">Friction index</p><h2>Trace gaps are questions, not verdicts.</h2><p>A missing edge may be stale code, progressive enhancement, a debug-only state, or an undocumented contract. Inspect context before deleting or promoting anything.</p></header>
    <div class="catalog-friction-grid">${orphanGroups.map(([label, entries]) => `<details><summary><span>${esc(label)}</span><strong>${entries.length}</strong></summary><p>${entries.map((entry) => `<a href="#attr-${esc(entry)}"><code>${esc(entry)}</code></a>`).join(' ') || '<em>none</em>'}</p></details>`).join('')}</div>
  </section>`;

  return renderCatalogPage({
    page: 'systems',
    title: 'Design Systems Trace',
    lede: 'The deep reference layer: attributes, CSS ownership, JavaScript writers, meaning documents, and the gaps that deserve a closer look.',
    description: 'Trace Spwashi design attributes through HTML, CSS, JavaScript, and durable meaning documents.',
    counts,
    generatedAt,
    body,
  });
}

const CATALOG_FIELD_GUIDE_CSS = `
/* Field-guide projection: the canonical scan stays dense; its public rooms breathe. */
body[data-spw-page-role="catalog"] {
  background:
    radial-gradient(circle at 82% 7%, color-mix(in srgb, var(--op-probe-color, #7656a8) 10%, transparent), transparent 24rem),
    radial-gradient(circle at 9% 31%, color-mix(in srgb, var(--op-frame-color, #087f83) 9%, transparent), transparent 29rem),
    var(--page-bg, #f5f3ee);
}

body[data-spw-page-role="catalog"] > :is(
  .spw-discovery-notice-stack,
  .spw-section-handle,
  .spw-section-handle-shell,
  .spw-state-inspector
) {
  display: none;
}

.catalog-main {
  width: min(100%, var(--page-width-atlas, 88rem));
  padding: clamp(1rem, 2.5vw, 2.5rem) clamp(1rem, 3vw, 3rem) 7rem;
  gap: clamp(2rem, 5vw, 5rem);
}

.catalog-room-nav {
  position: sticky;
  top: 0.65rem;
  z-index: 110;
  display: flex;
  flex-wrap: wrap;
  width: fit-content;
  max-width: 100%;
  gap: 0.25rem;
  padding: 0.3rem;
  border: 1px solid color-mix(in srgb, var(--line, #ccd1cf) 86%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface, #fff) 88%, transparent);
  box-shadow: 0 0.55rem 1.8rem rgb(20 34 34 / 8%);
  backdrop-filter: blur(18px);
}

.catalog-room-nav a {
  min-height: 2.35rem;
  display: inline-flex;
  align-items: center;
  padding-inline: 0.8rem;
  border-radius: 999px;
  color: var(--ink-soft, #4e5d5c);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-decoration: none;
  white-space: nowrap;
}

.catalog-room-nav a[aria-current="page"] {
  background: var(--ink, #142323);
  color: var(--surface, #fff);
}

.catalog-masthead {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(15rem, 0.75fr);
  align-items: end;
  gap: clamp(2rem, 6vw, 7rem);
  min-height: min(72vh, 42rem);
  padding: clamp(1.5rem, 5vw, 5rem);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--op-frame-color, #087f83) 22%, var(--line, #ccd1cf));
  border-radius: clamp(1rem, 2.5vw, 2rem);
  background:
    linear-gradient(140deg, color-mix(in srgb, var(--surface-strong, #fff) 94%, var(--op-frame-color, #087f83) 6%), color-mix(in srgb, var(--surface, #f7f4ee) 91%, var(--op-probe-color, #7656a8) 9%));
  box-shadow: 0 1.6rem 5rem rgb(24 42 42 / 10%);
}

.catalog-masthead::after {
  content: "";
  position: absolute;
  z-index: -1;
  inset: auto -7rem -10rem auto;
  width: min(36rem, 54vw);
  aspect-ratio: 1;
  border: clamp(2rem, 6vw, 6rem) solid color-mix(in srgb, var(--op-frame-color, #087f83) 8%, transparent);
  border-radius: 48% 52% 62% 38%;
  transform: rotate(17deg);
}

.catalog-masthead__copy {
  max-width: 66ch;
}

.catalog-masthead h1 {
  max-width: 11ch;
  margin: 0;
  font-size: clamp(3rem, 8vw, 7.6rem);
  line-height: 0.86;
  letter-spacing: -0.075em;
  text-wrap: balance;
}

.catalog-kicker,
.catalog-entry__eyebrow {
  margin: 0 0 0.7rem;
  color: color-mix(in srgb, var(--ink, #142323) 66%, var(--op-frame-color, #087f83) 34%);
  font-family: var(--site-mono-font, monospace);
  font-size: clamp(0.68rem, 1.2vw, 0.78rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalog-masthead__lede {
  max-width: 58ch;
  margin: clamp(1.2rem, 3vw, 2.2rem) 0 0;
  color: var(--ink, #142323);
  font-family: var(--site-body-font, sans-serif);
  font-size: clamp(1.05rem, 1.8vw, 1.42rem);
  line-height: 1.55;
}

.catalog-masthead__stamp {
  margin: 1.3rem 0 0;
  color: var(--ink-soft, #586564);
  font-family: var(--site-mono-font, monospace);
  font-size: 0.74rem;
}

.catalog-counts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--line, #ccd1cf) 80%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--line, #ccd1cf) 70%, transparent);
}

.catalog-counts div {
  min-height: 7rem;
  display: grid;
  align-content: end;
  padding: 1rem;
  background: color-mix(in srgb, var(--surface, #fff) 92%, transparent);
}

.catalog-counts div:first-child {
  grid-column: span 2;
}

.catalog-counts dt {
  font-family: var(--site-heading-font, sans-serif);
  font-size: clamp(1.7rem, 3vw, 2.7rem);
  font-weight: 800;
  line-height: 1;
}

.catalog-counts dd {
  margin: 0.35rem 0 0;
  color: var(--ink-soft, #586564);
  font-size: 0.78rem;
}

.catalog-section {
  gap: clamp(1.1rem, 2.5vw, 2rem);
  scroll-margin-top: 6rem;
}

.catalog-section + .catalog-section,
.catalog-asset-buckets,
.catalog-index-group {
  padding-block-start: clamp(2rem, 5vw, 5rem);
  border-top: 1px solid color-mix(in srgb, var(--line, #ccd1cf) 78%, transparent);
}

.catalog-section__header {
  max-width: 76ch;
}

.catalog-section__header--split {
  max-width: none;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(16rem, 0.65fr);
  align-items: end;
  gap: 1.5rem;
}

.catalog-section__header h2 {
  max-width: 19ch;
  margin: 0;
  font-size: clamp(2rem, 4.4vw, 4.4rem);
  line-height: 1;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.catalog-section__header > p:last-child,
.catalog-section__header--split > p {
  margin: 1rem 0 0;
  color: var(--ink-soft, #586564);
  font-size: clamp(1rem, 1.4vw, 1.15rem);
  line-height: 1.65;
}

.catalog-study-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}

.catalog-study-card {
  grid-column: span 6;
  min-height: 19rem;
  display: flex;
  flex-direction: column;
  padding: clamp(1.2rem, 2.5vw, 2rem);
  border: 1px solid color-mix(in srgb, var(--line, #ccd1cf) 84%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--surface, #fff) 86%, transparent);
  box-shadow: 0 1rem 3rem rgb(24 42 42 / 5%);
}

.catalog-study-card:nth-child(1) { grid-column: 1 / span 7; }
.catalog-study-card:nth-child(2) { grid-column: 8 / span 5; }
.catalog-study-card:nth-child(3) { grid-column: 2 / span 5; }
.catalog-study-card:nth-child(4) { grid-column: 7 / span 6; }

.catalog-study-card__label {
  margin: 0 0 auto;
  color: var(--op-frame-color, #087f83);
  font-family: var(--site-mono-font, monospace);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.catalog-study-card h3 {
  max-width: 22ch;
  margin: 2.5rem 0 0;
  font-size: clamp(1.35rem, 2.1vw, 2rem);
  line-height: 1.12;
  text-wrap: balance;
}

.catalog-study-card > p:not(.catalog-study-card__label) {
  max-width: 56ch;
  color: var(--ink-soft, #586564);
  line-height: 1.6;
}

.catalog-study-card a,
.catalog-section__action a {
  width: fit-content;
  margin-top: auto;
  color: var(--ink, #142323);
  font-weight: 750;
  text-underline-offset: 0.22em;
}

.catalog-toolbar {
  top: 6.75rem;
  z-index: 90;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--surface, #fff) 91%, transparent);
  box-shadow: 0 1rem 3rem rgb(24 42 42 / 9%);
}

.catalog-toolbar .visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

#catalog-search {
  min-height: 3.1rem;
  padding-inline: 1rem 3rem;
  border-radius: 0.7rem;
  font-family: var(--site-body-font, sans-serif);
  font-size: 1rem;
}

.catalog-filter-chip,
.catalog-density-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.35rem;
  padding-inline: 0.78rem;
}

.catalog-filter-chip span {
  opacity: 0.72;
  font-variant-numeric: tabular-nums;
}

.catalog-search-results {
  min-height: 8rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 0.75rem;
}

.catalog-search-prompt,
.catalog-search-empty {
  grid-column: 1 / -1;
  align-self: center;
  margin: 0;
  color: var(--ink-soft, #586564);
}

.catalog-search-result {
  display: grid;
  gap: 0.45rem;
  min-height: 9rem;
  padding: 1rem;
  border: 1px solid var(--line, #ccd1cf);
  border-radius: 0.75rem;
  background: var(--surface, #fff);
  color: inherit;
  text-decoration: none;
}

.catalog-search-result span {
  color: var(--op-frame-color, #087f83);
  font-family: var(--site-mono-font, monospace);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.catalog-search-result small {
  color: var(--ink-soft, #586564);
  line-height: 1.45;
}

.catalog-asset-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
  gap: 1rem;
}

.catalog-entry--asset {
  min-width: 0;
  padding: 0;
  overflow: hidden;
  align-content: start;
  border-radius: 0.85rem;
  background: color-mix(in srgb, var(--surface, #fff) 92%, transparent);
}

.catalog-entry--asset .catalog-entry__preview {
  aspect-ratio: 4 / 3;
  border: 0;
  border-bottom: 1px solid var(--line, #ccd1cf);
  border-radius: 0;
  background:
    linear-gradient(45deg, rgb(0 0 0 / 3%) 25%, transparent 25% 75%, rgb(0 0 0 / 3%) 75%),
    linear-gradient(45deg, rgb(0 0 0 / 3%) 25%, transparent 25% 75%, rgb(0 0 0 / 3%) 75%);
  background-position: 0 0, 0.5rem 0.5rem;
  background-size: 1rem 1rem;
}

.catalog-entry--asset .catalog-entry__preview img {
  object-fit: contain;
  transition: transform 240ms ease;
}

.catalog-entry--asset:hover .catalog-entry__preview img {
  transform: scale(1.018);
}

.catalog-entry__body {
  display: grid;
  gap: 0.65rem;
  padding: 1rem;
}

.catalog-entry__body h3 {
  margin: 0;
  font-size: 1.12rem;
  line-height: 1.2;
}

.catalog-entry__description,
.catalog-entry__path,
.catalog-entry__routes {
  margin: 0;
  overflow-wrap: anywhere;
}

.catalog-entry__description {
  color: var(--ink-soft, #586564);
  font-size: 0.9rem;
  line-height: 1.5;
}

.catalog-entry__path {
  font-size: 0.72rem;
}

.catalog-entry__routes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.55rem;
  align-items: baseline;
  font-size: 0.76rem;
}

.catalog-entry__routes strong {
  width: 100%;
  color: var(--ink-soft, #586564);
}

.catalog-asset-grid--featured .catalog-entry--asset:first-child {
  grid-column: span 2;
}

.catalog-asset-grid--featured .catalog-entry--asset:first-child .catalog-entry__preview {
  aspect-ratio: 16 / 9;
}

.catalog-copy-btn {
  min-height: 2.1rem;
  opacity: 0.72;
}

.catalog-room-grid,
.catalog-wander-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 0.75rem;
}

.catalog-room-card,
.catalog-wander-grid a {
  min-height: 12rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.45rem;
  padding: 1.2rem;
  border: 1px solid var(--line, #ccd1cf);
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--surface, #fff) 91%, transparent);
  color: inherit;
  text-decoration: none;
}

.catalog-room-card--visual {
  grid-column: span 2;
  background: linear-gradient(140deg, color-mix(in srgb, var(--op-frame-color, #087f83) 13%, var(--surface, #fff)), var(--surface, #fff));
}

.catalog-room-card--friction {
  background: linear-gradient(140deg, color-mix(in srgb, #c36b3f 9%, var(--surface, #fff)), var(--surface, #fff));
}

.catalog-room-card span {
  margin-bottom: auto;
  color: var(--op-frame-color, #087f83);
  font-family: var(--site-mono-font, monospace);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.catalog-room-card strong,
.catalog-wander-grid strong {
  font-size: 1.15rem;
}

.catalog-room-card em,
.catalog-wander-grid span {
  color: var(--ink-soft, #586564);
  font-size: 0.86rem;
  font-style: normal;
  line-height: 1.45;
}

.catalog-bucket-nav {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding: 0.25rem 0 0.7rem;
  scrollbar-width: thin;
}

.catalog-bucket-nav a {
  flex: 0 0 auto;
  display: inline-flex;
  gap: 0.45rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--line, #ccd1cf);
  border-radius: 999px;
  color: inherit;
  font-family: var(--site-mono-font, monospace);
  font-size: 0.72rem;
  text-decoration: none;
}

.catalog-bucket-nav span {
  color: var(--ink-soft, #586564);
}

.catalog-asset-bucket {
  scroll-margin-top: 10rem;
}

.catalog-asset-bucket__header h2,
.catalog-asset-bucket__header p {
  margin: 0;
}

.catalog-index-group {
  scroll-margin-top: 10rem;
}

.catalog-index-group > summary {
  min-height: 4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  font-size: clamp(1.4rem, 2.5vw, 2.2rem);
  font-weight: 800;
}

.catalog-index-group > summary strong {
  color: var(--ink-soft, #586564);
  font-family: var(--site-mono-font, monospace);
  font-size: 0.82rem;
}

.catalog-index-group > .catalog-entries {
  margin-top: 1rem;
}

.catalog-friction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: 0.75rem;
}

.catalog-friction-grid details {
  padding: 1rem;
  border: 1px solid var(--line, #ccd1cf);
  border-radius: 0.75rem;
  background: var(--surface, #fff);
}

.catalog-friction-grid summary {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  cursor: pointer;
  font-weight: 700;
}

.catalog-friction-grid p {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.catalog-main[data-catalog-density="compact"] .catalog-asset-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr));
}

.catalog-main[data-catalog-density="compact"] .catalog-entry__description,
.catalog-main[data-catalog-density="compact"] .catalog-entry__routes {
  display: none;
}

.catalog-main :where(a, button, input, summary):focus-visible {
  outline: 3px solid var(--focus-ring, color-mix(in srgb, var(--op-frame-color, #087f83) 70%, white));
  outline-offset: 3px;
}

@media (max-width: 52rem) {
  .catalog-masthead,
  .catalog-section__header--split {
    grid-template-columns: 1fr;
  }

  .catalog-masthead {
    min-height: auto;
  }

  .catalog-study-card,
  .catalog-study-card:nth-child(1),
  .catalog-study-card:nth-child(2),
  .catalog-study-card:nth-child(3),
  .catalog-study-card:nth-child(4) {
    grid-column: 1 / -1;
    min-height: 16rem;
  }

  .catalog-room-card--visual,
  .catalog-asset-grid--featured .catalog-entry--asset:first-child {
    grid-column: auto;
  }

  .catalog-toolbar__filters {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }

  .catalog-filter-group {
    width: 100%;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.35rem;
  }

  .catalog-density-group {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 34rem) {
  .catalog-main {
    padding-inline: 0.75rem;
  }

  .catalog-room-nav {
    width: 100%;
    flex-wrap: nowrap;
    overflow-x: auto;
    border-radius: 0.8rem;
  }

  .catalog-masthead {
    padding: 1.25rem;
    border-radius: 1rem;
  }

  .catalog-masthead h1 {
    font-size: clamp(3.2rem, 18vw, 5rem);
  }

  .catalog-counts div {
    min-height: 5.5rem;
  }

  .catalog-toolbar {
    top: 7.5rem;
    padding: 0.7rem;
  }

  .catalog-toolbar__filters,
  .catalog-filter-group {
    flex-wrap: nowrap;
    overflow-x: auto;
    width: 100%;
    padding-bottom: 0.35rem;
  }

  .catalog-filter-chip,
  .catalog-density-btn {
    flex: 0 0 auto;
  }
}

@media (hover: none), (pointer: coarse) {
  .catalog-room-nav a,
  .catalog-filter-chip,
  .catalog-density-btn,
  .catalog-copy-btn,
  .catalog-bucket-nav a,
  .catalog-back-to-top {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .catalog-entry--asset .catalog-entry__preview img {
    transition: none;
  }
}
`;

const CATALOG_JS = `
const main = document.querySelector('.catalog-main');

if (main) {
  const searchInput = document.getElementById('catalog-search');
  const clearButton = document.getElementById('catalog-search-clear');
  const visibleCount = document.getElementById('catalog-visible-count');
  const results = document.getElementById('catalog-search-results');
  const backToTop = document.getElementById('catalog-back-to-top');
  const page = main.dataset.catalogPage || 'overview';
  const params = new URLSearchParams(window.location.search);
  let query = params.get('q') || '';
  let kind = params.get('kind') || 'all';
  let state = params.get('state') || 'all';
  let catalogIndex = null;
  let renderSequence = 0;

  function setPressed(selector, value, datasetKey) {
    document.querySelectorAll(selector).forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset[datasetKey] === value));
    });
  }

  function syncUrl() {
    const next = new URL(window.location.href);
    if (query) next.searchParams.set('q', query);
    else next.searchParams.delete('q');
    if (kind !== 'all') next.searchParams.set('kind', kind);
    else next.searchParams.delete('kind');
    if (state !== 'all') next.searchParams.set('state', state);
    else next.searchParams.delete('state');
    if (main.dataset.catalogDensity === 'compact') next.searchParams.set('density', 'compact');
    else next.searchParams.delete('density');
    window.history.replaceState({}, '', next);
  }

  function matchesEntry(entry) {
    const entryKind = entry.dataset.spwCatalogKind || '';
    const matchesKind = kind === 'all'
      || entryKind === kind
      || (kind === 'color' && entry.dataset.catalogColor === 'true');
    const matchesState = state === 'all' || entry.dataset.catalogState === state;
    const matchesQuery = !query || entry.textContent.toLowerCase().includes(query.toLowerCase());
    return matchesKind && matchesState && matchesQuery;
  }

  function filterStaticEntries() {
    const entries = Array.from(document.querySelectorAll('[data-catalog-entry]'));
    let count = 0;
    for (const entry of entries) {
      const visible = matchesEntry(entry);
      entry.hidden = !visible;
      if (visible) count += 1;
    }
    document.querySelectorAll('[data-catalog-group]').forEach((group) => {
      const hasVisible = Boolean(group.querySelector('[data-catalog-entry]:not([hidden])'));
      group.hidden = !hasVisible;
      if (hasVisible && (query || kind !== 'all' || state !== 'all') && group.tagName === 'DETAILS') group.open = true;
    });
    if (visibleCount) visibleCount.textContent = String(count);
    syncUrl();
  }

  function flattenCatalog(data) {
    const entries = [];
    for (const attribute of Object.values(data.attributes || {})) {
      entries.push({kind: 'attribute', title: attribute.name, meta: (attribute.htmlUsageCount || 0) + ' HTML uses · ' + attribute.cssSelectors.length + ' CSS readers', href: '/design/catalog/systems/#attr-' + attribute.name, search: [attribute.name, ...(attribute.valuesInHtml || []), ...(attribute.cssFiles || []), ...(attribute.jsFiles || [])].join(' ')});
    }
    for (const [file, info] of Object.entries(data.cssFiles || {})) {
      entries.push({kind: 'css-file', title: file, meta: 'layer ' + (info.layer || 'unassigned') + ' · ' + info.attributesUsed.length + ' attributes', href: '/design/catalog/systems/#css-' + slug(file), search: [file, info.header || '', ...(info.attributesUsed || []), ...(info.tokensDefined || [])].join(' ')});
    }
    for (const token of data.tokens || []) {
      entries.push({kind: 'token', title: token.name, meta: token.consumerCount + ' reads' + (token.initialValue ? ' · ' + token.initialValue : ''), href: '/design/catalog/tokens/#token-' + token.name, search: [token.name, token.initialValue || '', ...(token.consumerFiles || [])].join(' ')});
    }
    for (const [file, info] of Object.entries(data.docs || {})) {
      entries.push({kind: 'doc', title: file, meta: info.attributesMentioned.length + ' attributes · ' + info.tokensMentioned.length + ' tokens', href: '/design/catalog/systems/#doc-' + slug(file), search: [file, info.title || '', ...(info.attributesMentioned || []), ...(info.tokensMentioned || [])].join(' ')});
    }
    for (const asset of data.imageAssets || []) {
      const routes = [...new Set((asset.usages || []).map((usage) => usage.route))];
      entries.push({kind: 'image-asset', title: asset.alt || asset.path, meta: asset.state + ' · ' + asset.bucket + (routes.length ? ' · ' + routes.length + ' routes' : ''), href: '/design/catalog/assets/#image-' + slug(asset.path), search: [asset.path, asset.alt || '', asset.bucket, asset.state, ...routes].join(' ')});
    }
    return entries;
  }

  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function resultCard(entry) {
    const link = document.createElement('a');
    link.className = 'catalog-search-result';
    link.href = entry.href;
    const label = document.createElement('span');
    label.textContent = entry.kind.replace('-', ' ');
    const title = document.createElement('strong');
    title.textContent = entry.title;
    const meta = document.createElement('small');
    meta.textContent = entry.meta;
    link.append(label, title, meta);
    return link;
  }

  async function searchOverview() {
    const sequence = ++renderSequence;
    const canBrowseKind = kind !== 'all';
    if (!results || (query.trim().length < 2 && !canBrowseKind)) {
      if (results) results.innerHTML = '<p class="catalog-search-prompt">Type two or more characters, or choose a kind, to search the canonical graph.</p>';
      if (visibleCount) visibleCount.textContent = '0';
      syncUrl();
      return;
    }
    if (!catalogIndex) {
      results.innerHTML = '<p class="catalog-search-prompt">Opening the design graph…</p>';
      const response = await fetch('/design/catalog/catalog.json');
      if (!response.ok) throw new Error('Catalog graph could not be loaded');
      catalogIndex = flattenCatalog(await response.json());
    }
    if (sequence !== renderSequence) return;
    const needle = query.trim().toLowerCase();
    const matches = catalogIndex
      .filter((entry) => (kind === 'all' || entry.kind === kind) && (!needle || entry.search.toLowerCase().includes(needle)))
      .sort((left, right) => {
        const leftStarts = needle && left.title.toLowerCase().startsWith(needle) ? 0 : 1;
        const rightStarts = needle && right.title.toLowerCase().startsWith(needle) ? 0 : 1;
        return leftStarts - rightStarts || left.title.localeCompare(right.title);
      });
    results.replaceChildren(...matches.slice(0, 48).map(resultCard));
    if (!matches.length) results.innerHTML = '<p class="catalog-search-empty">No matching handle. Try a shorter stem or another room.</p>';
    if (matches.length > 48) {
      const note = document.createElement('p');
      note.className = 'catalog-search-empty';
      note.textContent = 'Showing 48 of ' + matches.length + ' matches. Refine the search or open a focused room.';
      results.append(note);
    }
    if (visibleCount) visibleCount.textContent = String(matches.length);
    syncUrl();
  }

  function update() {
    if (page === 'overview') searchOverview().catch((error) => {
      if (results) results.innerHTML = '<p class="catalog-search-empty">' + error.message + '.</p>';
    });
    else filterStaticEntries();
  }

  if (searchInput) {
    searchInput.value = query;
    clearButton.hidden = !query;
    searchInput.addEventListener('input', () => {
      query = searchInput.value.trim();
      clearButton.hidden = !query;
      update();
    });
  }

  clearButton?.addEventListener('click', () => {
    query = '';
    searchInput.value = '';
    clearButton.hidden = true;
    searchInput.focus();
    update();
  });

  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (event.key === '/' && !['input', 'textarea', 'select'].includes(tag)) {
      event.preventDefault();
      searchInput?.focus();
    }
    if (event.key === 'Escape' && document.activeElement === searchInput) {
      query = '';
      searchInput.value = '';
      clearButton.hidden = true;
      searchInput.blur();
      update();
    }
  });

  document.querySelectorAll('[data-catalog-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      kind = button.dataset.catalogFilter || 'all';
      setPressed('[data-catalog-filter]', kind, 'catalogFilter');
      update();
    });
  });

  document.querySelectorAll('[data-catalog-state-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state = button.dataset.catalogStateFilter || 'all';
      setPressed('[data-catalog-state-filter]', state, 'catalogStateFilter');
      update();
    });
  });

  document.querySelectorAll('[data-catalog-density]').forEach((button) => {
    button.addEventListener('click', () => {
      main.dataset.catalogDensity = button.dataset.catalogDensity || 'standard';
      setPressed('[data-catalog-density]', main.dataset.catalogDensity, 'catalogDensity');
      syncUrl();
    });
  });

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy-target]');
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.copyTarget || '');
      const prior = button.textContent;
      button.textContent = 'Copied';
      button.classList.add('copied');
      window.setTimeout(() => { button.textContent = prior; button.classList.remove('copied'); }, 1400);
    } catch {
      button.textContent = 'Copy unavailable';
    }
  });

  if (params.get('density') === 'compact') main.dataset.catalogDensity = 'compact';
  setPressed('[data-catalog-filter]', kind, 'catalogFilter');
  setPressed('[data-catalog-state-filter]', state, 'catalogStateFilter');
  setPressed('[data-catalog-density]', main.dataset.catalogDensity, 'catalogDensity');
  if (backToTop) {
    const updateBackToTop = () => { backToTop.hidden = window.scrollY < 600; };
    window.addEventListener('scroll', updateBackToTop, {passive: true});
    backToTop.addEventListener('click', () => window.location.assign(backToTop.dataset.catalogTopHref || '/design/catalog/'));
    updateBackToTop();
  }
  update();
}
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
    await fs.mkdir(path.dirname(filePath), {recursive: true});
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
  const imageUsage = await collectImageUsage(htmlFiles);
  const imageAssets = await collectImageAssets(allFiles, imageUsage);

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
    imageAssets: imageAssets.length,
    imageBuckets: new Set(imageAssets.map((asset) => asset.bucket)).size,
  };

  const catalog = {
    generatedAt: await generatedAtForRun(options),
    counts,
    attributes: attrs,
    cssFiles: cssFileInfo,
    tokens: tokensSerialized,
    docs,
    orphans,
    imageAssets,
  };

  const outputs = {
    'catalog.json': `${JSON.stringify(catalog, null, 2)}\n`,
    'catalog.css': `${CATALOG_CSS.trim()}\n\n${CATALOG_FIELD_GUIDE_CSS.trim()}\n`,
    'catalog.js': `${CATALOG_JS.trim()}\n`,
    'index.html': renderCatalogOverview({
      attrs,
      cssFiles: cssFileInfo,
      tokens,
      docs,
      orphans,
      imageAssets,
      generatedAt: catalog.generatedAt,
      counts,
    }),
    'assets/index.html': renderAssetIndex({
      imageAssets,
      generatedAt: catalog.generatedAt,
      counts,
    }),
    'tokens/index.html': renderTokenIndex({
      tokens,
      generatedAt: catalog.generatedAt,
      counts,
    }),
    'systems/index.html': renderSystemsIndex({
      attrs,
      cssFiles: cssFileInfo,
      docs,
      orphans,
      generatedAt: catalog.generatedAt,
      counts,
    }),
  };

  await writeOutputs(options.outDir, outputs, options);

  if (!options.quiet) {
    console.log(`[catalog] ${options.check ? 'checked' : 'wrote'} ${relRepo(path.join(options.outDir, 'index.html'))}`);
    console.log(`[catalog] ${counts.attributes} attributes • ${counts.tokens} tokens • ${counts.cssFiles} css files • ${counts.docs} spw docs • ${counts.imageAssets} images`);
    console.log(`[catalog] scanned ${counts.htmlFilesScanned} html • ${counts.jsFilesScanned} js • ${cssFiles.length} css • ${spwFiles.length} spw`);
    console.log(`[catalog] orphans: css-only=${orphans.attrsInCssNotHtml.length} html-only=${orphans.attrsInHtmlNotCss.length} no-doc=${orphans.attrsWithNoDoc.length}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
