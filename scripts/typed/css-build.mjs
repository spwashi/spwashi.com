import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { shouldIgnoreValidationPath, toPosixPath, } from './shared/build-topology.mjs';
const ROOT_DIR = path.resolve(import.meta.dirname, '..', '..');
const SOURCE_ENTRIES_DIR = path.join(ROOT_DIR, 'src/styles/entries');
const PUBLIC_CSS_DIR = path.join(ROOT_DIR, 'public/css');
const POSTCSS_CONFIG_PATH = path.join(ROOT_DIR, 'postcss.config.mjs');
function relativeRepoPath(absolutePath) {
    return toPosixPath(path.relative(ROOT_DIR, absolutePath));
}
async function pathExists(absolutePath) {
    try {
        await fs.access(absolutePath);
        return true;
    }
    catch {
        return false;
    }
}
async function walk(directoryPath, results = []) {
    if (!(await pathExists(directoryPath)))
        return results;
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    for (const entry of entries) {
        const absolutePath = path.join(directoryPath, entry.name);
        const relativePath = relativeRepoPath(absolutePath);
        if (shouldIgnoreValidationPath(relativePath))
            continue;
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
    if (!(await pathExists(POSTCSS_CONFIG_PATH)))
        return null;
    try {
        const postcss = await import('postcss');
        const configModule = await import(pathToFileURL(POSTCSS_CONFIG_PATH).href);
        const plugins = configModule.default?.plugins || configModule.plugins || [];
        return postcss.default(plugins);
    }
    catch (error) {
        console.warn(`[css-build] PostCSS unavailable; copying native CSS sources. ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}
function outputPathForEntry(entryPath) {
    const relativeEntryPath = toPosixPath(path.relative(SOURCE_ENTRIES_DIR, entryPath));
    const outputRelativePath = relativeEntryPath.replace(/\.(?:pcss|postcss)$/i, '.css');
    return path.join(PUBLIC_CSS_DIR, outputRelativePath);
}
export async function collectCssBuildPlan() {
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
async function readIfExists(absolutePath) {
    try {
        return await fs.readFile(absolutePath, 'utf8');
    }
    catch (error) {
        if (error?.code === 'ENOENT')
            return null;
        throw error;
    }
}
function parseOptions(argv) {
    return {
        check: argv.includes('--check'),
    };
}
export async function buildCssSources(options = { check: false }) {
    const plan = await collectCssBuildPlan();
    const pipeline = plan.length ? await loadPostcssPipeline() : null;
    const results = [];
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
export async function main() {
    const options = parseOptions(process.argv.slice(2));
    const results = await buildCssSources(options);
    if (!results.length) {
        console.log('[css-build] no src/styles/entries sources; public/css remains authoritative');
        return;
    }
    const verb = options.check ? 'checked' : 'built';
    console.log(`[css-build] ${verb} ${results.length} stylesheet source(s)`);
    for (const result of results) {
        const mode = result.transformed ? 'postcss' : 'copy';
        const suffix = options.check ? '' : result.written ? ' updated' : ' fresh';
        console.log(`  ${mode}: ${result.source} -> ${result.output}${suffix}`);
    }
}
