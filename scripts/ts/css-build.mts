import { promises as fs } from 'node:fs';
import { watch as watchFs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  buildBehaviorScopeModule,
  buildCssBundles,
  type BuildCssBundlesOptions,
  type CssBundleBuildResult,
} from './css-bundle.mjs';
import {
  isGeneratedCssHref,
  normalizeCssSourceHref,
  onlyTokensForTargets,
  readStyleCoreImports,
  targetsForSourcePaths,
} from './css-manifest.mjs';
import {
  shouldIgnoreValidationPath,
  toPosixPath,
} from './shared/build-topology.mjs';

const ROOT_DIR = path.resolve(import.meta.dirname, '..', '..');
const SOURCE_ENTRIES_DIR = path.join(ROOT_DIR, 'src/styles/entries');
const PUBLIC_CSS_DIR = path.join(ROOT_DIR, 'public/css');
const STYLE_CORE_MANIFEST = path.join(PUBLIC_CSS_DIR, 'style-core.css');
const STYLE_MANIFEST = path.join(PUBLIC_CSS_DIR, 'style.css');
const POSTCSS_CONFIG_PATH = path.join(ROOT_DIR, 'postcss.config.mjs');

type CssBuildResult = {
  output: string;
  source: string;
  map?: string;
  transformed: boolean;
  written: boolean;
  mapWritten?: boolean;
};

type CssBuildPlanEntry = {
  mode: 'copy' | 'postcss';
  output: string;
  outputPath: string;
  mapOutput?: string;
  mapOutputPath?: string;
  source: string;
  sourcePath: string;
};

type CssBuildOptions = {
  check: boolean;
  watch: boolean;
  /** Incremental bundle filter tokens (forwarded to buildCssBundles). */
  only: string[] | null;
  skipCore: boolean;
  skipSources: boolean;
  skipBundles: boolean;
  strictBudget: boolean;
  fromChange: string[] | null;
  concurrency: number | null;
  json: boolean;
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
    if (cssRelativePath === 'debug.css') return `effects/${cssRelativePath}`;
    if (cssRelativePath === 'design-experiments.css') return `routes/surfaces/${cssRelativePath}`;
    if (cssRelativePath.endsWith('-surface.css')) return `routes/surfaces/${cssRelativePath}`;
    return cssRelativePath;
  })();
  return path.join(PUBLIC_CSS_DIR, outputRelativePath);
}

function outputMapPathForEntry(entryPath: string): string {
  return `${outputPathForEntry(entryPath)}.map`;
}

export async function collectCssBuildPlan(): Promise<CssBuildPlanEntry[]> {
  const entries = (await walk(SOURCE_ENTRIES_DIR)).sort();
  const hasPostcssConfig = await pathExists(POSTCSS_CONFIG_PATH);
  return entries.map((entry) => {
    const outputPath = outputPathForEntry(entry);
    const mapOutputPath = outputMapPathForEntry(entry);
    return {
      mode: hasPostcssConfig ? 'postcss' : 'copy',
      output: relativeRepoPath(outputPath),
      outputPath,
      mapOutput: hasPostcssConfig ? relativeRepoPath(mapOutputPath) : undefined,
      mapOutputPath: hasPostcssConfig ? mapOutputPath : undefined,
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
  const only: string[] = [];
  const fromChange: string[] = [];
  let concurrency: number | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--only' && argv[i + 1]) {
      only.push(...argv[++i].split(',').map((token) => token.trim()).filter(Boolean));
    } else if (arg.startsWith('--only=')) {
      only.push(...arg.slice('--only='.length).split(',').map((token) => token.trim()).filter(Boolean));
    } else if ((arg === '--from-change' || arg === '--changed') && argv[i + 1]) {
      fromChange.push(...argv[++i].split(',').map((token) => token.trim()).filter(Boolean));
    } else if (arg.startsWith('--from-change=') || arg.startsWith('--changed=')) {
      const value = arg.slice(arg.indexOf('=') + 1);
      fromChange.push(...value.split(',').map((token) => token.trim()).filter(Boolean));
    } else if (arg === '--concurrency' && argv[i + 1]) {
      concurrency = Number(argv[++i]);
    } else if (arg.startsWith('--concurrency=')) {
      concurrency = Number(arg.slice('--concurrency='.length));
    }
  }

  return {
    check: argv.includes('--check'),
    watch: argv.includes('--watch'),
    only: only.length ? only : null,
    skipCore: argv.includes('--skip-core'),
    skipSources: argv.includes('--skip-sources') || argv.includes('--bundles-only'),
    skipBundles: argv.includes('--skip-bundles') || argv.includes('--sources-only'),
    strictBudget: argv.includes('--strict-budget'),
    fromChange: fromChange.length ? fromChange : null,
    concurrency: Number.isFinite(concurrency) && concurrency !== null && concurrency > 0 ? concurrency : null,
    json: argv.includes('--json'),
  };
}

function shouldIgnoreWatchPath(absolutePath: string): boolean {
  const relativePath = relativeRepoPath(absolutePath);
  if (shouldIgnoreValidationPath(relativePath)) return true;
  // Never rebuild from watching generated outputs (feedback loop).
  if (relativePath.startsWith('public/css/bundles/')) return true;
  if (relativePath === 'public/js/runtime/behavior-scopes.js') return true;
  if (relativePath.endsWith('.css.map')) return true;
  return false;
}

function isPublicCssSourcePath(absolutePath: string): boolean {
  const relativePath = relativeRepoPath(absolutePath);
  return relativePath.startsWith('public/css/') && !relativePath.startsWith('public/css/bundles/');
}

type IncrementalBundlePlan = {
  only: string[] | null;
  skipCore: boolean;
  skipBundles: boolean;
  skipSources: boolean;
  fromChange: string[] | null;
  reason: string;
};

/**
 * Map a filesystem change to the smallest honest CSS rebuild.
 * Unknown public/css sources fall back to full bundles (safe).
 */
export async function planIncrementalCssRebuild(changedPath: string): Promise<IncrementalBundlePlan> {
  const relativePath = relativeRepoPath(changedPath);
  const href = normalizeCssSourceHref(changedPath);

  if (relativePath === 'postcss.config.mjs' || relativePath.startsWith('src/styles/')) {
    return {
      only: null,
      skipCore: false,
      skipBundles: false,
      skipSources: false,
      fromChange: null,
      reason: 'source-entries-or-postcss',
    };
  }

  if (isGeneratedCssHref(href) || relativePath.startsWith('public/css/bundles/')) {
    return {
      only: null,
      skipCore: true,
      skipBundles: true,
      skipSources: true,
      fromChange: null,
      reason: 'generated-output-ignored',
    };
  }

  if (!isPublicCssSourcePath(changedPath) && !relativePath.endsWith('.css')) {
    return {
      only: null,
      skipCore: false,
      skipBundles: false,
      skipSources: false,
      fromChange: null,
      reason: 'unknown-path-full',
    };
  }

  const coreImports = await readStyleCoreImports();
  const coreSourceHrefs = coreImports.filter((entry) => !entry.external).map((entry) => entry.file);
  const affected = targetsForSourcePaths([changedPath, href], { coreSourceHrefs });

  if (!affected.length) {
    // Shared public/css file not listed in any scope — likely nested import of core.
    // Rebuild core only when under public/css.
    if (isPublicCssSourcePath(changedPath)) {
      return {
        only: ['core'],
        skipCore: false,
        skipBundles: false,
        skipSources: true,
        fromChange: null,
        reason: 'unscoped-public-css-core',
      };
    }
    return {
      only: null,
      skipCore: false,
      skipBundles: false,
      skipSources: false,
      fromChange: null,
      reason: 'unmatched-full',
    };
  }

  const tokens = onlyTokensForTargets(affected);
  const hasCore = affected.some((target) => target.kind === 'core');
  return {
    only: tokens,
    skipCore: !hasCore,
    skipBundles: false,
    skipSources: true,
    fromChange: null,
    reason: `targets:${tokens.join(',')}`,
  };
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

export async function buildCssSources(options: Partial<CssBuildOptions> = {}): Promise<CssBuildResult[]> {
  const resolved: CssBuildOptions = {
    check: false,
    watch: false,
    only: null,
    skipCore: false,
    skipSources: false,
    skipBundles: false,
    strictBudget: false,
    fromChange: null,
    concurrency: null,
    json: false,
    ...options,
  };
  if (resolved.skipSources) return [];

  const plan = await collectCssBuildPlan();
  const pipeline = plan.length ? await loadPostcssPipeline() : null;
  const results: CssBuildResult[] = [];

  for (const entry of plan) {
    const source = await fs.readFile(entry.sourcePath, 'utf8');
    const processed = pipeline
      ? await pipeline.process(source, {
        from: entry.sourcePath,
        to: entry.outputPath,
        map: {
          annotation: true,
          inline: false,
          sourcesContent: true,
        },
      })
      : null;
    const output = processed?.css || source;
    const map = processed?.map?.toString() || null;
    const normalizedOutput = output.endsWith('\n') ? output : `${output}\n`;
    const normalizedMap = map ? (map.endsWith('\n') ? map : `${map}\n`) : null;
    const currentOutput = await readIfExists(entry.outputPath);
    const currentMap = entry.mapOutputPath ? await readIfExists(entry.mapOutputPath) : null;
    const isFresh = currentOutput === normalizedOutput;
    const isMapFresh = !entry.mapOutputPath || currentMap === normalizedMap;

    if (resolved.check && (!isFresh || !isMapFresh)) {
      throw new Error(`[css-build] stale output: ${entry.output}`);
    }

    if (!resolved.check && (!isFresh || !isMapFresh)) {
      await fs.mkdir(path.dirname(entry.outputPath), { recursive: true });
      await fs.writeFile(entry.outputPath, normalizedOutput, 'utf8');
      if (entry.mapOutputPath && normalizedMap) {
        await fs.writeFile(entry.mapOutputPath, normalizedMap, 'utf8');
      }
    }

    results.push({
      output: entry.output,
      source: entry.source,
      map: entry.mapOutput,
      transformed: Boolean(pipeline),
      written: !resolved.check && !isFresh,
      mapWritten: Boolean(!resolved.check && entry.mapOutputPath && !isMapFresh),
    });
  }

  return results;
}

function bundleOptionsFromBuild(options: CssBuildOptions, override: Partial<BuildCssBundlesOptions> = {}): BuildCssBundlesOptions {
  return {
    check: options.check,
    only: override.only ?? options.only,
    skipCore: override.skipCore ?? options.skipCore,
    strictBudget: options.strictBudget,
    fromChange: override.fromChange ?? options.fromChange,
    concurrency: options.concurrency ?? undefined,
  };
}

function logBuildSummary(params: {
  options: CssBuildOptions;
  results: CssBuildResult[];
  bundleResults: CssBundleBuildResult[];
  behaviorScopeResult: Awaited<ReturnType<typeof buildBehaviorScopeModule>> | null;
  totalMs: number;
  planNote?: string;
}): void {
  const {
    options,
    results,
    bundleResults,
    behaviorScopeResult,
    totalMs,
    planNote,
  } = params;
  const verb = options.check ? 'checked' : 'built';
  const log = options.json ? console.error.bind(console) : console.log.bind(console);

  if (!results.length && !options.skipSources) {
    log('[css-build] no src/styles/entries sources; public/css remains authoritative');
  }

  log(
    `[css-build] ${verb} ${results.length} stylesheet source(s) + ${bundleResults.length} bundle(s) in ${totalMs}ms`
    + (planNote ? ` (${planNote})` : ''),
  );
  for (const result of results) {
    const mode = result.transformed ? 'postcss' : 'copy';
    const suffix = options.check ? '' : (result.written || result.mapWritten) ? ' updated' : ' fresh';
    const mapNote = result.map ? ` (+ ${result.map})` : '';
    log(`  ${mode}: ${result.source} -> ${result.output}${mapNote}${suffix}`);
  }

  if (bundleResults.length) {
    log(`[css-build] ${verb} ${bundleResults.length} scoped bundle(s)`);
    for (const bundle of bundleResults) {
      const suffix = options.check ? '' : bundle.written ? ' updated' : ' fresh';
      const budgetNote = bundle.overBudget
        ? ` ⚠ over soft budget ${((bundle.budgetBytes || 0) / 1024).toFixed(0)} KiB`
        : '';
      log(
        `  bundle: ${bundle.kind}:${bundle.scope} ${(bundle.bytes / 1024).toFixed(1)} KiB ${bundle.ms}ms${suffix}${budgetNote}`,
      );
    }
  }

  if (behaviorScopeResult) {
    log(
      `  runtime: ${behaviorScopeResult.href} (${(behaviorScopeResult.bytes / 1024).toFixed(1)} KiB)`
      + `${options.check ? '' : behaviorScopeResult.written ? ' updated' : ' fresh'}`,
    );
  }

  if (options.json) {
    console.log(JSON.stringify({
      verb,
      totalMs,
      planNote: planNote || null,
      only: options.only,
      fromChange: options.fromChange,
      sources: results,
      bundles: bundleResults,
      behaviorScope: behaviorScopeResult,
      overBudget: bundleResults.filter((bundle) => bundle.overBudget).map((bundle) => bundle.href),
    }, null, 2));
  }
}

async function runCssBuildPass(
  options: CssBuildOptions,
  override: Partial<IncrementalBundlePlan> = {},
): Promise<{
  results: CssBuildResult[];
  bundleResults: CssBundleBuildResult[];
  behaviorScopeResult: Awaited<ReturnType<typeof buildBehaviorScopeModule>> | null;
  totalMs: number;
}> {
  const started = performance.now();
  const skipSources = override.skipSources ?? options.skipSources;
  const skipBundles = override.skipBundles ?? options.skipBundles;
  const results = await buildCssSources({ ...options, skipSources });

  let bundleResults: CssBundleBuildResult[] = [];
  let behaviorScopeResult: Awaited<ReturnType<typeof buildBehaviorScopeModule>> | null = null;

  if (!skipBundles) {
    bundleResults = await buildCssBundles(bundleOptionsFromBuild(options, {
      only: override.only ?? options.only,
      skipCore: override.skipCore ?? options.skipCore,
      fromChange: override.fromChange ?? options.fromChange,
    }));
    behaviorScopeResult = await buildBehaviorScopeModule({ check: options.check });
  }

  return {
    results,
    bundleResults,
    behaviorScopeResult,
    totalMs: Math.round(performance.now() - started),
  };
}

export async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`css-build — source copy/postcss + scoped bundles

Usage:
  npm run build:css
  npm run build:css -- --only routes,behaviors
  npm run build:css -- --only home,settings --skip-core --bundles-only
  npm run build:css -- --from-change public/css/routes/surfaces/home.css --bundles-only
  npm run build:css -- --sources-only
  npm run build:css -- --check --strict-budget --json

Options:
  --only a,b           Bundle filter (core|routes|behaviors|home|route:home|…)
  --from-change path   Rebuild only bundles that include this source CSS file
  --skip-core          Do not rebuild core.css
  --bundles-only       Skip src/styles/entries (bundles + behavior-scopes only)
  --sources-only       Skip scoped bundle flattening
  --concurrency N      Parallel bundle workers (default 6)
  --check              Fail if outputs are stale
  --strict-budget      Fail when soft size budgets exceeded
  --json               Machine-readable summary on stdout
  --watch              Rebuild on public/css + entry/config changes (incremental)
`);
    return;
  }

  const pass = await runCssBuildPass(options);
  logBuildSummary({
    options,
    results: pass.results,
    bundleResults: pass.bundleResults,
    behaviorScopeResult: pass.behaviorScopeResult,
    totalMs: pass.totalMs,
    planNote: options.fromChange
      ? `from-change:${options.fromChange.join(',')}`
      : options.only
        ? `only:${options.only.join(',')}`
        : undefined,
  });

  const over = pass.bundleResults.filter((bundle) => bundle.overBudget);
  if (over.length) {
    const message = `[css-build] soft budget exceeded: ${over.map((bundle) => bundle.href).join(', ')}`;
    if (options.strictBudget) throw new Error(message);
    console.warn(message);
  }

  if (!options.watch) return;

  let pendingPaths = new Set<string>();
  let timer: NodeJS.Timeout | null = null;
  let rebuilding = false;

  const flush = async () => {
    timer = null;
    if (rebuilding) return;
    const batch = [...pendingPaths];
    pendingPaths = new Set();
    if (!batch.length) return;
    rebuilding = true;

    try {
      // Coalesce multi-file saves into one plan (union of tokens).
      const plans = await Promise.all(batch.map((changedPath) => planIncrementalCssRebuild(changedPath)));
      const anySources = plans.some((plan) => !plan.skipSources);
      const anyBundles = plans.some((plan) => !plan.skipBundles);
      const tokenSet = new Set<string>();
      let skipCore = true;
      let fullBundles = false;

      for (const plan of plans) {
        if (plan.skipBundles) continue;
        if (!plan.only) {
          fullBundles = true;
          skipCore = false;
        } else {
          for (const token of plan.only) tokenSet.add(token);
          if (!plan.skipCore) skipCore = false;
        }
      }

      const override: Partial<IncrementalBundlePlan> = {
        skipSources: !anySources,
        skipBundles: !anyBundles,
        only: fullBundles ? null : (tokenSet.size ? [...tokenSet] : null),
        skipCore: fullBundles ? false : skipCore,
        fromChange: null,
        reason: plans.map((plan) => plan.reason).join('+'),
      };

      console.log(
        `[css-build] change batch (${batch.map(relativeRepoPath).join(', ')}) → ${override.reason}`
        + (override.only ? ` only=${override.only.join(',')}` : ' full'),
      );

      const watchPass = await runCssBuildPass({ ...options, check: false, json: false }, override);
      logBuildSummary({
        options: { ...options, check: false, json: false },
        results: watchPass.results,
        bundleResults: watchPass.bundleResults,
        behaviorScopeResult: watchPass.behaviorScopeResult,
        totalMs: watchPass.totalMs,
        planNote: String(override.reason || 'watch'),
      });
      console.log('[css-build] watch rebuild complete');
    } catch (error) {
      console.error(`[css-build] watch rebuild failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      rebuilding = false;
      if (pendingPaths.size) {
        timer = setTimeout(() => {
          void flush();
        }, watchDelay());
      }
    }
  };

  const rerun = (changedPath: string) => {
    if (shouldIgnoreWatchPath(changedPath)) return;
    pendingPaths.add(changedPath);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void flush();
    }, watchDelay());
  };

  if (await pathExists(SOURCE_ENTRIES_DIR)) {
    await watchDirectory(SOURCE_ENTRIES_DIR, rerun);
  }

  if (await pathExists(PUBLIC_CSS_DIR)) {
    await watchDirectory(PUBLIC_CSS_DIR, rerun);
  }

  if (await pathExists(STYLE_CORE_MANIFEST)) {
    watchFile(STYLE_CORE_MANIFEST, rerun);
  }

  if (await pathExists(STYLE_MANIFEST)) {
    watchFile(STYLE_MANIFEST, rerun);
  }

  if (await pathExists(POSTCSS_CONFIG_PATH)) {
    watchFile(POSTCSS_CONFIG_PATH, rerun);
  }

  console.log('[css-build] watching public/css + src/styles/entries (incremental bundles)');

  await new Promise<void>(() => {
    // Keep the process alive for filesystem watch mode.
  });
}
