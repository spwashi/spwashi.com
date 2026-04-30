import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { renderTemplate } from '../template.mjs';
import {
  collectTagAttributes,
  splitList,
  stripQueryHash,
} from './site-contracts/helpers.mjs';
import {
  shouldIgnoreValidationPath,
  toPosixPath,
} from './shared/build-topology.mjs';
import { collectCssBuildPlan } from './css-build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const CSS_DIR = path.join(ROOT_DIR, 'public/css');
const STYLE_SOURCE_DIR = path.join(ROOT_DIR, 'src/styles');
const STYLE_MANIFEST = path.join(CSS_DIR, 'style.css');
const EXPECTED_LAYER_ORDER = 'reset, tokens, shell, typography, grammar, components, systems, routes, handles, effects, ornament';

type CssImport = {
  file: string;
  layer: string | null;
};

type CssContractReport = {
  cssFiles: string[];
  errors: string[];
  imports: CssImport[];
  linkedStylesheets: string[];
  sourceFiles: string[];
  warnings: string[];
};

function relativeRepoPath(absolutePath: string): string {
  return toPosixPath(path.relative(ROOT_DIR, absolutePath));
}

function rootRelativeCssPath(absolutePath: string): string {
  return `/${relativeRepoPath(absolutePath)}`;
}

async function walk(directoryPath: string, predicate: (absolutePath: string) => boolean, results: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    const relativePath = relativeRepoPath(absolutePath);
    if (shouldIgnoreValidationPath(relativePath)) continue;

    if (entry.isDirectory()) {
      await walk(absolutePath, predicate, results);
      continue;
    }

    if (entry.isFile() && predicate(absolutePath)) {
      results.push(absolutePath);
    }
  }

  return results;
}

async function collectCssFiles(): Promise<string[]> {
  return (await walk(CSS_DIR, (absolutePath) => absolutePath.endsWith('.css'))).sort();
}

async function collectStyleSourceFiles(): Promise<string[]> {
  try {
    return (await walk(STYLE_SOURCE_DIR, (absolutePath) => /\.(?:css|pcss|postcss|scss)$/i.test(absolutePath))).sort();
  } catch {
    return [];
  }
}

async function collectRouteFiles(): Promise<string[]> {
  return (await walk(ROOT_DIR, (absolutePath) => path.basename(absolutePath) === 'index.html')).sort();
}

function parseStyleImports(source: string): CssImport[] {
  const imports: CssImport[] = [];
  const importPattern = /@import\s+url\((['"]?)([^'")]+)\1\)\s*(?:layer\(([^)]+)\))?\s*;/g;

  for (const match of source.matchAll(importPattern)) {
    const [, , file, layer] = match;
    if (!file.startsWith('/public/css/')) continue;
    imports.push({
      file: stripQueryHash(file),
      layer: layer?.trim() || null,
    });
  }

  return imports;
}

async function collectLinkedStylesheets(): Promise<string[]> {
  const stylesheets = new Set<string>();
  const routeFiles = await collectRouteFiles();

  for (const routeFile of routeFiles) {
    const source = await fs.readFile(routeFile, 'utf8');
    const { output: html } = await renderTemplate(source, { sourceLabel: relativeRepoPath(routeFile) });
    const linkTags = collectTagAttributes(html, 'link');

    for (const attrs of linkTags) {
      if (!attrs.href || !splitList(attrs.rel).includes('stylesheet')) continue;
      const href = stripQueryHash(attrs.href);
      if (href.startsWith('/public/css/')) stylesheets.add(href);
    }
  }

  return [...stylesheets].sort();
}

function hasInstructionHeader(source: string, filename: string): boolean {
  if (filename === 'style.css') return source.startsWith('@layer ');
  const firstChunk = source.slice(0, 900);
  return firstChunk.trimStart().startsWith('/*') && (
    firstChunk.includes(filename)
    || /\bPurpose\b|Direction|Design goals|Surface purpose|Visual mixer|Route-scoped|CSS for\b/.test(firstChunk)
  );
}

function hasTopFileContract(source: string): boolean {
  const firstChunk = source.slice(0, 1200);
  return firstChunk.trimStart().startsWith('/*');
}

function referencesSemanticCss(source: string): boolean {
  return /\bdata-spw-|--spw-|--component-|--grammar-|--handle-|--shell-|--material-|--ornament-/.test(source);
}

export async function collectCssContractReport(): Promise<CssContractReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cssFiles = await collectCssFiles();
  const sourceFiles = await collectStyleSourceFiles();
  const buildPlan = await collectCssBuildPlan();
  const styleSource = await fs.readFile(STYLE_MANIFEST, 'utf8');
  const imports = parseStyleImports(styleSource);
  const linkedStylesheets = await collectLinkedStylesheets();

  const manifestLayerMatch = styleSource.match(/^@layer\s+([^;]+);/);
  if (!manifestLayerMatch) {
    errors.push('public/css/style.css must begin with an explicit @layer manifest.');
  } else if (manifestLayerMatch[1].replace(/\s+/g, ' ').trim() !== EXPECTED_LAYER_ORDER) {
    errors.push('public/css/style.css layer order drifted from the CSS instruction contract.');
  }

  const importedFiles = new Set(imports.map((item) => item.file));
  const linkedFiles = new Set(linkedStylesheets);
  const knownReferences = new Set<string>([...importedFiles, ...linkedFiles]);
  knownReferences.add('/public/css/style.css');

  for (const item of imports) {
    if (!item.layer) errors.push(`${item.file} is imported without an explicit cascade layer.`);
    try {
      await fs.access(path.join(ROOT_DIR, item.file.replace(/^\/+/, '')));
    } catch {
      errors.push(`${item.file} is imported by style.css but does not exist.`);
    }
  }

  for (const href of linkedStylesheets) {
    try {
      await fs.access(path.join(ROOT_DIR, href.replace(/^\/+/, '')));
    } catch {
      errors.push(`${href} is linked by a route but does not exist.`);
    }
  }

  for (const entry of buildPlan) {
    if (!knownReferences.has(`/${entry.output}`)) {
      errors.push(`${entry.source} generates ${entry.output}, but that output is not imported or linked.`);
    }
  }

  for (const absolutePath of cssFiles) {
    const relativePath = relativeRepoPath(absolutePath);
    const rootPath = rootRelativeCssPath(absolutePath);
    const filename = path.basename(absolutePath);
    const source = await fs.readFile(absolutePath, 'utf8');

    if (!hasInstructionHeader(source, filename)) {
      errors.push(`${relativePath} needs an instructional header naming its file and scope.`);
    }

    if (referencesSemanticCss(source) && !hasTopFileContract(source)) {
      warnings.push(`${relativePath} uses semantic CSS hooks without an obvious top-of-file contract.`);
    }

    if (!knownReferences.has(rootPath)) {
      warnings.push(`${relativePath} is not imported by style.css or linked by rendered routes.`);
    }
  }

  for (const absolutePath of sourceFiles) {
    const relativePath = relativeRepoPath(absolutePath);
    const extension = path.extname(absolutePath);
    if (extension === '.scss') {
      warnings.push(`${relativePath} is planned source only; Sass is not wired into build:css yet.`);
    }
  }

  return {
    cssFiles: cssFiles.map(relativeRepoPath),
    errors,
    imports,
    linkedStylesheets,
    sourceFiles: sourceFiles.map(relativeRepoPath),
    warnings,
  };
}

export async function main(): Promise<void> {
  const report = await collectCssContractReport();

  console.log(`[css] files=${report.cssFiles.length} imports=${report.imports.length} routeStylesheets=${report.linkedStylesheets.length} sources=${report.sourceFiles.length}`);

  if (report.warnings.length) {
    console.log(`[css] warnings=${report.warnings.length}`);
    for (const warning of report.warnings.slice(0, 12)) {
      console.log(`  warn: ${warning}`);
    }
    if (report.warnings.length > 12) {
      console.log(`  ... ${report.warnings.length - 12} more warnings`);
    }
  }

  if (report.errors.length) {
    console.log(`[css] errors=${report.errors.length}`);
    for (const error of report.errors.slice(0, 12)) {
      console.log(`  error: ${error}`);
    }
    if (report.errors.length > 12) {
      console.log(`  ... ${report.errors.length - 12} more errors`);
    }
    process.exit(1);
  }

  console.log('[css] passed');
}
