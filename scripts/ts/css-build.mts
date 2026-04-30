import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  shouldIgnoreValidationPath,
  toPosixPath,
} from './shared/build-topology.mjs';

const ROOT_DIR = path.resolve(import.meta.dirname, '..', '..');
const SOURCE_ENTRIES_DIR = path.join(ROOT_DIR, 'src/styles/entries');
const PUBLIC_CSS_DIR = path.join(ROOT_DIR, 'public/css');
const POSTCSS_CONFIG_PATH = path.join(ROOT_DIR, 'postcss.config.mjs');

type CssBuildResult = {
  output: string;
  source: string;
  transformed: boolean;
};

function relativeRepoPath(absolutePath: string): string {
  return toPosixPath(path.relative(ROOT_DIR, absolutePath));
}

async function pathExists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(directoryPath: string, results: string[] = []): Promise<string[]> {
  if (!(await pathExists(directoryPath))) return results;
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    const relativePath = relativeRepoPath(absolutePath);
    if (shouldIgnoreValidationPath(relativePath)) continue;

    if (entry.isDirectory()) {
      await walk(absolutePath, results);
      continue;
    }

    if (entry.isFile() && /\.(?:css|pcss|postcss)$/i.test(entry.name)) {
      results.push(absolutePath);
    }
  }

  return results;
}

async function loadPostcssPipeline() {
  if (!(await pathExists(POSTCSS_CONFIG_PATH))) return null;

  try {
    const postcss = await import('postcss');
    const configModule = await import(pathToFileURL(POSTCSS_CONFIG_PATH).href);
    const plugins = configModule.default?.plugins || configModule.plugins || [];
    return postcss.default(plugins);
  } catch (error) {
    console.warn(`[css-build] PostCSS unavailable; copying native CSS sources. ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function outputPathForEntry(entryPath: string): string {
  const relativeEntryPath = toPosixPath(path.relative(SOURCE_ENTRIES_DIR, entryPath));
  const outputRelativePath = relativeEntryPath.replace(/\.(?:pcss|postcss)$/i, '.css');
  return path.join(PUBLIC_CSS_DIR, outputRelativePath);
}

export async function buildCssSources(): Promise<CssBuildResult[]> {
  const entries = (await walk(SOURCE_ENTRIES_DIR)).sort();
  const pipeline = entries.length ? await loadPostcssPipeline() : null;
  const results: CssBuildResult[] = [];

  for (const entry of entries) {
    const source = await fs.readFile(entry, 'utf8');
    const outputPath = outputPathForEntry(entry);
    const output = pipeline
      ? (await pipeline.process(source, { from: entry, to: outputPath })).css
      : source;

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, output.endsWith('\n') ? output : `${output}\n`, 'utf8');

    results.push({
      output: relativeRepoPath(outputPath),
      source: relativeRepoPath(entry),
      transformed: Boolean(pipeline),
    });
  }

  return results;
}

export async function main(): Promise<void> {
  const results = await buildCssSources();

  if (!results.length) {
    console.log('[css-build] no src/styles/entries sources; public/css remains authoritative');
    return;
  }

  console.log(`[css-build] built ${results.length} stylesheet source(s)`);
  for (const result of results) {
    const mode = result.transformed ? 'postcss' : 'copy';
    console.log(`  ${mode}: ${result.source} -> ${result.output}`);
  }
}
