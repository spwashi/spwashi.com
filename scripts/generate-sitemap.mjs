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

const CANONICAL_RE = /<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["'][^>]*>/i;
const ROBOTS_RE = /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/i;

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

function extractCanonical(html, repoPath) {
  const canonicalMatch = html.match(CANONICAL_RE);
  if (!canonicalMatch) {
    throw new Error(`[sitemap] missing canonical link in ${repoPath}`);
  }
  return canonicalMatch[1].trim();
}

function isNoIndex(html) {
  const robotsMatch = html.match(ROBOTS_RE);
  if (!robotsMatch) return false;
  return robotsMatch[1].split(',').some((token) => token.trim().toLowerCase() === 'noindex');
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
    const { output } = await renderTemplate(source, { sourceLabel: relRepo(absPath) });
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

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, xml, 'utf8');

  console.log(`[sitemap] wrote ${relRepo(outputPath)}`);
  console.log(`[sitemap] ${urls.length} urls from ${routeFiles.length} routes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
