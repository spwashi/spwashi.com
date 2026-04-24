#!/usr/bin/env node
/**
 * XML sitemap generator for the site-facing route tree.
 *
 * Scans tracked route HTML, renders any source templates, extracts canonical
 * URLs, and emits a sitemap.xml suitable for the build artifact.
 *
 * Zero deps.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { renderTemplate } from './template.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_OUT = path.join(ROOT_DIR, 'dist', 'sitemap.xml');

const EXCLUDED_TOP_LEVEL = new Set([
  '.agents',
  '.git',
  '.github',
  '.idea',
  '00.unsorted',
  '_partials',
  'dist',
  'node_modules',
  'scripts',
]);

const EXCLUDED_PREFIXES = [
  '.spw/_workbench',
];

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function relRepo(absPath) {
  return toPosix(path.relative(ROOT_DIR, absPath));
}

function parseOutPath(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out' && argv[index + 1]) return path.resolve(argv[index + 1]);
    if (arg.startsWith('--out=')) return path.resolve(arg.slice('--out='.length));
  }
  return DEFAULT_OUT;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(`[sitemap] git ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  }

  return result.stdout;
}

function shouldExcludeRepoPath(repoPath) {
  const normalizedPath = toPosix(repoPath).replace(/^\/+/, '');
  if (!normalizedPath) return true;

  const segments = normalizedPath.split('/');
  if (EXCLUDED_TOP_LEVEL.has(segments[0])) return true;
  if (EXCLUDED_PREFIXES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))) return true;

  return false;
}

function listSourceRouteFiles() {
  return runGit(['ls-files', '-c', '-o', '--exclude-standard', '-z'])
    .split('\0')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((repoPath) => repoPath.endsWith('index.html') || repoPath === 'index.html')
    .filter((repoPath) => !shouldExcludeRepoPath(repoPath))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Finds complete start tags for a given tag name.
 *
 * This intentionally avoids parsing all HTML. It only needs to safely collect
 * complete <link ...> and <meta ...> tags while ignoring ">" characters inside
 * quoted attribute values.
 */
function findStartTags(html, tagName) {
  const tags = [];
  const openTagRe = new RegExp(`<\\s*${tagName}\\b`, 'gi');

  let match;
  while ((match = openTagRe.exec(html))) {
    const start = match.index;
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

    tags.push(html.slice(start, index + 1));
    openTagRe.lastIndex = index + 1;
  }

  return tags;
}

/**
 * Parses attributes from a single HTML start tag.
 *
 * Supports:
 * - any attribute order
 * - single-quoted values
 * - double-quoted values
 * - unquoted values
 * - boolean attributes
 * - case-insensitive attribute names
 */
function parseTagAttributes(tag) {
  const attrs = new Map();
  let index = 0;

  if (tag[index] === '<') index += 1;

  while (index < tag.length && /\s/.test(tag[index])) index += 1;

  // Skip tag name.
  while (index < tag.length && !/[\s/>]/.test(tag[index])) index += 1;

  while (index < tag.length) {
    while (index < tag.length && /\s/.test(tag[index])) index += 1;

    if (tag[index] === '>' || (tag[index] === '/' && tag[index + 1] === '>')) break;

    const nameStart = index;

    while (index < tag.length && !/[\s=/>]/.test(tag[index])) index += 1;

    const name = tag.slice(nameStart, index).trim().toLowerCase();
    if (!name) break;

    while (index < tag.length && /\s/.test(tag[index])) index += 1;

    let value = '';

    if (tag[index] === '=') {
      index += 1;

      while (index < tag.length && /\s/.test(tag[index])) index += 1;

      const quote = tag[index];

      if (quote === '"' || quote === "'") {
        index += 1;
        const valueStart = index;

        while (index < tag.length && tag[index] !== quote) index += 1;

        value = tag.slice(valueStart, index);

        if (tag[index] === quote) index += 1;
      } else {
        const valueStart = index;

        while (index < tag.length && !/[\s>]/.test(tag[index])) index += 1;

        value = tag.slice(valueStart, index);
      }
    }

    attrs.set(name, decodeHtmlAttribute(value));
  }

  return attrs;
}

function tokenList(value) {
  return String(value || '')
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

function robotsTokenList(value) {
  return String(value || '')
    .split(/[,\s]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

function extractCanonical(html, repoPath) {
  const canonicals = findStartTags(html, 'link')
    .map(parseTagAttributes)
    .filter((attrs) => tokenList(attrs.get('rel')).includes('canonical'))
    .map((attrs) => attrs.get('href')?.trim())
    .filter(Boolean);

  const uniqueCanonicals = [...new Set(canonicals)];

  if (uniqueCanonicals.length === 0) {
    throw new Error(`[sitemap] missing canonical link in ${repoPath}`);
  }

  if (uniqueCanonicals.length > 1) {
    throw new Error(`[sitemap] multiple canonical links in ${repoPath}: ${uniqueCanonicals.join(', ')}`);
  }

  return uniqueCanonicals[0];
}

function isNoIndex(html) {
  return findStartTags(html, 'meta')
    .map(parseTagAttributes)
    .some((attrs) => {
      const name = attrs.get('name')?.trim().toLowerCase();
      if (name !== 'robots') return false;

      return robotsTokenList(attrs.get('content')).includes('noindex');
    });
}

function buildSitemapXml(urls) {
  const rows = urls.map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    '</urlset>',
    '',
  ].join('\n');
}

async function collectUrls(routeFiles) {
  const urls = [];

  for (const repoPath of routeFiles) {
    const absPath = path.join(ROOT_DIR, repoPath);
    const source = await fs.readFile(absPath, 'utf8');
    const {output} = await renderTemplate(source, {sourceLabel: relRepo(absPath)});

    if (isNoIndex(output)) continue;

    urls.push(extractCanonical(output, repoPath));
  }

  return [...new Set(urls)].sort((a, b) => a.localeCompare(b));
}

async function main() {
  const outputPath = parseOutPath(process.argv.slice(2));
  const routeFiles = listSourceRouteFiles();
  const urls = await collectUrls(routeFiles);
  const xml = buildSitemapXml(urls);

  await fs.mkdir(path.dirname(outputPath), {recursive: true});
  await fs.writeFile(outputPath, xml, 'utf8');

  console.log(`[sitemap] wrote ${relRepo(outputPath)}`);
  console.log(`[sitemap] ${urls.length} urls from ${routeFiles.length} routes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});