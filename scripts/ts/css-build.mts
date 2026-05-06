import { promises as fs } from 'node:fs';
import { watch as watchFs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
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
  written: boolean;
};

type CssBuildPlanEntry = {
  mode: 'copy' | 'postcss';
  output: string;
  outputPath: string;
  source: string;
  sourcePath: string;
};

type CssBuildOptions = {
  check: boolean;
  watch: boolean;
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
  const cssRelativePath = relativeEntryPath.replace(/\.(?:pcss|postcss)$/i, '.css');
  const outputRelativePath = (() => {
    if (cssRelativePath === 'spw-debug.css') return `effects/${cssRelativePath}`;
    if (cssRelativePath === 'design-experiments.css') return `routes/${cssRelativePath}`;
    if (cssRelativePath.endsWith('-surface.css')) return `routes/${cssRelativePath}`;
    return cssRelativePath;
  })();
  return path.join(PUBLIC_CSS_DIR, outputRelativePath);
}

export async function collectCssBuildPlan(): Promise<CssBuildPlanEntry[]> {
  const entries = (await walk(SOURCE_ENTRIES_DIR)).sort();
  const hasPostcssConfig = await pathExists(POSTCSS_CONFIG_PATH);
  return entries.map((entry) => {
    const outputPath = outputPathForEntry(entry);
    return {
      mode: hasPostcssConfig ? 'postcss' : 'copy',
      output: relativeRepoPath(outputPath),
      outputPath,
      source: relativeRepoPath(entry),
      sourcePath: entry,
    };
  });
}

async function readIfExists(absolutePath: string): Promise<string | null> {
  try {
    return await fs.readFile(absolutePath, 'utf8');
  } catch (error: any) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

function parseOptions(argv: string[]): CssBuildOptions {
  return {
    check: argv.includes('--check'),
    watch: argv.includes('--watch'),
  };
}

function shouldIgnoreWatchPath(absolutePath: string): boolean {
  const relativePath = relativeRepoPath(absolutePath);
  return shouldIgnoreValidationPath(relativePath);
}

function watchDelay(): number {
  return 100;
}

async function watchDirectory(directoryPath: string, onChange: (changedPath: string) => void, seen = new Set<string>()): Promise<void> {
  if (seen.has(directoryPath)) return;
  seen.add(directoryPath);

  let entries;
  try {
    entries = await fs.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return;
  }

  const watcher = watchFs(directoryPath, { recursive: false }, (eventType, fileName) => {
    const changedPath = fileName ? path.resolve(directoryPath, String(fileName)) : directoryPath;
    if (shouldIgnoreWatchPath(changedPath)) return;
    onChange(changedPath);
    if (eventType === 'rename') {
      void watchDirectory(changedPath, onChange, seen);
    }
  });

  watcher.on('error', (error) => {
    console.warn(`[css-build] watcher error at ${relativeRepoPath(directoryPath)}: ${error.message}`);
  });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await watchDirectory(path.join(directoryPath, entry.name), onChange, seen);
  }
}

function watchFile(filePath: string, onChange: (changedPath: string) => void): void {
  const watcher = watchFs(filePath, { recursive: false }, (_eventType, fileName) => {
    const changedPath = fileName ? path.resolve(path.dirname(filePath), String(fileName)) : filePath;
    if (shouldIgnoreWatchPath(changedPath)) return;
    onChange(changedPath);
  });

  watcher.on('error', (error) => {
    console.warn(`[css-build] watcher error at ${relativeRepoPath(filePath)}: ${error.message}`);
  });
}

export async function buildCssSources(options: CssBuildOptions = { check: false, watch: false }): Promise<CssBuildResult[]> {
  const plan = await collectCssBuildPlan();
  const pipeline = plan.length ? await loadPostcssPipeline() : null;
  const results: CssBuildResult[] = [];

  for (const entry of plan) {
    const source = await fs.readFile(entry.sourcePath, 'utf8');
    const output = pipeline
      ? (await pipeline.process(source, { from: entry.sourcePath, to: entry.outputPath })).css
      : source;
    const normalizedOutput = output.endsWith('\n') ? output : `${output}\n`;
    const currentOutput = await readIfExists(entry.outputPath);
    const isFresh = currentOutput === normalizedOutput;

    if (options.check && !isFresh) {
      throw new Error(`[css-build] stale output: ${entry.output}`);
    }

    if (!options.check && !isFresh) {
      await fs.mkdir(path.dirname(entry.outputPath), { recursive: true });
      await fs.writeFile(entry.outputPath, normalizedOutput, 'utf8');
    }

    results.push({
      output: entry.output,
      source: entry.source,
      transformed: Boolean(pipeline),
      written: !options.check && !isFresh,
    });
  }

  return results;
}

export async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const results = await buildCssSources(options);

  if (!results.length) {
    console.log('[css-build] no src/styles/entries sources; public/css remains authoritative');
    if (!options.watch) return;
  }

  const verb = options.check ? 'checked' : 'built';
  console.log(`[css-build] ${verb} ${results.length} stylesheet source(s)`);
  for (const result of results) {
    const mode = result.transformed ? 'postcss' : 'copy';
    const suffix = options.check ? '' : result.written ? ' updated' : ' fresh';
    console.log(`  ${mode}: ${result.source} -> ${result.output}${suffix}`);
  }

  if (!options.watch) return;

  let pending = false;
  let timer: NodeJS.Timeout | null = null;

  const rerun = async (changedPath: string) => {
    console.log(`[css-build] change detected: ${relativeRepoPath(changedPath)}`);
    pending = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      timer = null;
      if (!pending) return;
      pending = false;
      try {
        await buildCssSources({ check: false, watch: false });
        console.log('[css-build] watch rebuild complete');
      } catch (error) {
        console.error(`[css-build] watch rebuild failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, watchDelay());
  };

  if (await pathExists(SOURCE_ENTRIES_DIR)) {
    await watchDirectory(SOURCE_ENTRIES_DIR, rerun);
  }

  if (await pathExists(POSTCSS_CONFIG_PATH)) {
    watchFile(POSTCSS_CONFIG_PATH, rerun);
  }

  await new Promise<void>(() => {
    // Keep the process alive for filesystem watch mode.
  });
}
