import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build as rolldownBuild } from 'rolldown';
import { resolvePublicSpecifier } from '../../lib/resolve-public-specifier.mjs';
import { assertPwaContract, collectOfflineDocumentDependencies, formatPwaContractSummary, injectBuildPrecacheAssets, } from '../pwa-contracts.mjs';
import { assertSafeOutputDir, checkImageRedundancy, copyRepo, countFiles, createLogger, listFilesRecursive, listSourceRepoPaths, logDuplicateImages, parseArgs, printHelp, relRepo, rmrf, runNodeScript, writeNoJekyll, ROOT_DIR, } from './ops.mjs';
import { isErrnoCode, toPosixPath } from '../shared/build-topology.mjs';
function fingerprint(content) {
    return createHash('sha256').update(content).digest('hex').slice(0, 10);
}
async function prepareServiceWorkerPrecache(outDir) {
    const offlinePath = path.join(outDir, 'offline', 'index.html');
    const workerPath = path.join(outDir, 'sw.js');
    const offlineHtml = await fs.readFile(offlinePath, 'utf8');
    const workerSource = await fs.readFile(workerPath, 'utf8');
    const dependencies = collectOfflineDocumentDependencies(offlineHtml);
    const output = injectBuildPrecacheAssets(workerSource, dependencies);
    await fs.writeFile(workerPath, output, 'utf8');
    return dependencies;
}
function toPublicHref(outDir, filePath) {
    return `/public/${toPosixPath(path.relative(path.join(outDir, 'public'), filePath))}`;
}
function slugifyChunkName(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'module';
}
function normalizeModuleId(moduleId) {
    return path.resolve(String(moduleId || '').split('?')[0].split('#')[0]);
}
function extractCatalogLoadSpecifier(load) {
    if (typeof load !== 'function')
        return '';
    const source = Function.prototype.toString.call(load);
    return source.match(/import\s*\(\s*(['"`])([^'"`]+)\1\s*\)/)?.[2] || '';
}
function resolveCatalogEntryPath(outDir, specifier) {
    return resolvePublicSpecifier(specifier, outDir)
        || path.resolve(path.join(outDir, 'public/js/runtime'), specifier);
}
/**
 * Transport names follow the catalog's existing arrival vocabulary. Broad
 * demand lanes stay module-addressed so one visible feature cannot pull every
 * other visible feature into the same response. Immediate, idle, and settled
 * definitions intentionally share packs because their schedule already spends
 * them together.
 */
export function semanticPackIdForDefinition(definition) {
    const when = String(definition.when || 'immediate');
    if (when === 'immediate')
        return 'foundation';
    if (when === 'idle' && definition.timingChunk)
        return String(definition.timingChunk);
    if (when === 'settled')
        return 'settled';
    return `${slugifyChunkName(when)}-${slugifyChunkName(definition.id)}`;
}
export function createSemanticModulePlan(definitions, outDir) {
    const entriesByPath = new Map();
    for (const definition of definitions) {
        if (!definition?.id)
            continue;
        const specifier = extractCatalogLoadSpecifier(definition.load);
        if (!specifier)
            continue;
        const entryPath = normalizeModuleId(resolveCatalogEntryPath(outDir, specifier));
        const entries = entriesByPath.get(entryPath) || [];
        entries.push(definition);
        entriesByPath.set(entryPath, entries);
    }
    const packsById = new Map();
    const chunkNameByEntryPath = new Map();
    for (const [entryPath, entries] of entriesByPath) {
        const proposed = [...new Set(entries.map(semanticPackIdForDefinition))];
        const whens = [...new Set(entries.map((entry) => String(entry.when || 'immediate')))];
        const packId = proposed.length === 1
            ? proposed[0]
            : `${slugifyChunkName(whens.join('-'))}-${entries.map((entry) => slugifyChunkName(entry.id)).join('-')}`;
        const chunkName = `spw-${slugifyChunkName(packId)}`;
        const existing = packsById.get(packId) || {
            id: packId,
            chunkName,
            when: whens.length === 1 ? whens[0] : whens.join('|'),
            timingChunk: entries.every((entry) => entry.timingChunk === entries[0]?.timingChunk)
                ? (entries[0]?.timingChunk || null)
                : null,
            moduleIds: [],
            describes: [],
            updates: [],
            entryPaths: [],
        };
        existing.entryPaths.push(entryPath);
        for (const entry of entries) {
            existing.moduleIds.push(entry.id);
            if (entry.describes)
                existing.describes.push(String(entry.describes));
            const updates = Array.isArray(entry.updates) ? entry.updates : (entry.updates ? [entry.updates] : []);
            existing.updates.push(...updates.map((value) => String(value)));
        }
        packsById.set(packId, existing);
        chunkNameByEntryPath.set(entryPath, chunkName);
    }
    const packs = [...packsById.values()]
        .map((pack) => ({
        ...pack,
        moduleIds: [...new Set(pack.moduleIds)].sort(),
        describes: [...new Set(pack.describes)].sort(),
        updates: [...new Set(pack.updates)].sort(),
        entryPaths: [...new Set(pack.entryPaths)].sort(),
    }))
        .sort((a, b) => a.id.localeCompare(b.id));
    return { packs, chunkNameByEntryPath };
}
let publicImportHookReady = null;
/**
 * Catalog/runtime modules use browser-absolute `/public/…` specifiers.
 * Tests already register scripts/lib/public-import-hooks.mjs; the site
 * bundler must too, or Node resolves those to file:///public/….
 */
function ensurePublicImportHook() {
    if (!publicImportHookReady) {
        publicImportHookReady = import(pathToFileURL(path.join(ROOT_DIR, 'scripts/lib/register-public-imports.mjs')).href).then(() => undefined);
    }
    return publicImportHookReady;
}
async function loadCatalogDefinitionsForBuild() {
    await ensurePublicImportHook();
    const catalogUrl = pathToFileURL(path.join(ROOT_DIR, 'public/js/runtime/module-catalog.js')).href;
    try {
        const catalog = await import(catalogUrl);
        return catalog.MODULE_DEFS || [];
    }
    catch (error) {
        const code = error && typeof error === 'object' && 'code' in error
            ? String(error.code)
            : '';
        const url = error && typeof error === 'object' && 'url' in error
            ? String(error.url)
            : '';
        if (code === 'ERR_MODULE_NOT_FOUND' && url.includes('/public/')) {
            throw new Error(`[build] catalog import failed (${url}). Node must register scripts/lib/register-public-imports.mjs before loading public/js — npm run build:site:run already does.`, { cause: error });
        }
        throw error;
    }
}
export function collectStaticChunkClosure(chunks) {
    const chunksByFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
    const entry = chunks.find((chunk) => chunk.isEntry);
    if (!entry)
        return [];
    const closure = [];
    const visited = new Set();
    const visit = (fileName) => {
        if (visited.has(fileName))
            return;
        visited.add(fileName);
        const chunk = chunksByFile.get(fileName);
        if (!chunk)
            return;
        closure.push(chunk);
        chunk.imports.forEach(visit);
    };
    visit(entry.fileName);
    return closure;
}
function createPublicJsResolvePlugin(outDir) {
    return {
        name: 'public-js-root',
        resolveId(id) {
            return resolvePublicSpecifier(id, outDir);
        },
    };
}
/**
 * Bundle the static site.js graph. Catalog import() targets stay external as
 * /public/js/… specifiers so extractDynamicImportSpecifier and leftover
 * per-file minify keep working.
 */
async function bundleSiteRuntimeGraph(outDir, logger) {
    const jsRoot = path.join(outDir, 'public/js');
    const entry = path.join(jsRoot, 'site.js');
    const tmpDir = await fs.mkdtemp(path.join(outDir, '.bundle-'));
    const startedAt = Date.now();
    try {
        const definitions = await loadCatalogDefinitionsForBuild();
        const sharedOptions = {
            input: entry,
            cwd: outDir,
            makeAbsoluteExternalsRelative: false,
            preserveEntrySignatures: 'allow-extension',
            plugins: [createPublicJsResolvePlugin(outDir)],
        };
        const sharedOutput = {
            format: 'es',
            minify: true,
            sourcemap: false,
            strictExecutionOrder: true,
            entryFileNames: 'site.js',
            chunkFileNames: '[name]-[hash].js',
        };
        // First discover the static closure without manual groups. A catalog target
        // that is already resident through a static import cannot truthfully be a
        // deferred pack; assigning it to one would pull that whole pack into boot.
        const discovery = await rolldownBuild({
            ...sharedOptions,
            write: false,
            output: sharedOutput,
        });
        const discoveryChunks = discovery.output.filter((output) => output.type === 'chunk');
        const residentModuleIds = new Set(collectStaticChunkClosure(discoveryChunks)
            .flatMap((chunk) => chunk.moduleIds)
            .map(normalizeModuleId));
        const deferredDefinitions = definitions.filter((definition) => {
            const specifier = extractCatalogLoadSpecifier(definition.load);
            if (!specifier)
                return false;
            return !residentModuleIds.has(normalizeModuleId(resolveCatalogEntryPath(outDir, specifier)));
        });
        const semanticPlan = createSemanticModulePlan(deferredDefinitions, outDir);
        const result = await rolldownBuild({
            ...sharedOptions,
            output: {
                ...sharedOutput,
                dir: tmpDir,
                codeSplitting: {
                    includeDependenciesRecursively: false,
                    groups: [{
                            name(moduleId) {
                                return semanticPlan.chunkNameByEntryPath.get(normalizeModuleId(moduleId)) || null;
                            },
                            entriesAware: false,
                        }],
                },
            },
        });
        const chunks = result.output.filter((output) => output.type === 'chunk');
        const emittedHrefs = [];
        let bytes = 0;
        for (const chunk of chunks) {
            const target = path.join(jsRoot, path.basename(chunk.fileName));
            const content = Buffer.from(chunk.code);
            bytes += content.length;
            await fs.writeFile(target, content);
            emittedHrefs.push(toPublicHref(outDir, target));
        }
        emittedHrefs.sort();
        const bootChunks = collectStaticChunkClosure(chunks);
        const boot = {
            hrefs: bootChunks.map((chunk) => `/public/js/${path.basename(chunk.fileName)}`).sort(),
            bytes: bootChunks.reduce((total, chunk) => total + Buffer.byteLength(chunk.code), 0),
            gzipBytes: bootChunks.reduce((total, chunk) => total + gzipSync(chunk.code).length, 0),
        };
        const chunksByName = new Map(chunks.map((chunk) => [chunk.name, chunk]));
        const modulePacks = {};
        for (const pack of semanticPlan.packs) {
            const chunk = chunksByName.get(pack.chunkName);
            if (!chunk)
                continue;
            modulePacks[pack.id] = {
                href: `/public/js/${path.basename(chunk.fileName)}`,
                when: pack.when,
                timingChunk: pack.timingChunk,
                modules: pack.moduleIds,
                describes: pack.describes,
                updates: pack.updates,
                imports: chunk.imports.map((value) => `/public/js/${path.basename(value)}`).sort(),
                dynamicImports: chunk.dynamicImports.map((value) => `/public/js/${path.basename(value)}`).sort(),
                bytes: Buffer.byteLength(chunk.code),
                gzipBytes: gzipSync(chunk.code).length,
            };
        }
        const ms = Date.now() - startedAt;
        logger.info(`[build] bundled site runtime graph: boot=${boot.hrefs.join(', ') || '(none)'} `
            + `packs=${Object.keys(modulePacks).length} chunks=${chunks.length} `
            + `(${bytes} bytes total, ${boot.bytes} boot, ${ms}ms)`);
        return { boot, emittedHrefs, modulePacks, bytes, ms };
    }
    finally {
        await rmrf(tmpDir);
    }
}
const SITE_SCRIPT_RE = /(<script\b[^>]*\bsrc=["']\/public\/js\/site\.js["'][^>]*>\s*<\/script>)/i;
async function injectBootModulePreloads(outDir, hrefs) {
    const extra = hrefs.filter((href) => href !== '/public/js/site.js');
    if (!extra.length)
        return 0;
    const links = extra
        .map((href) => `    <link href="${href}" rel="modulepreload" data-spw-boot-chunk="true" />`)
        .join('\n');
    const files = (await listFilesRecursive(outDir)).filter((file) => file.endsWith('.html'));
    let changed = 0;
    for (const file of files) {
        const source = await fs.readFile(file, 'utf8');
        if (!SITE_SCRIPT_RE.test(source) || source.includes('data-spw-boot-chunk="true"'))
            continue;
        const output = source.replace(SITE_SCRIPT_RE, `${links}\n    $1`);
        if (output === source)
            continue;
        await fs.writeFile(file, output, 'utf8');
        changed += 1;
    }
    return changed;
}
/**
 * Per-file minify of leftover dist/public/js modules (catalog import()
 * targets and other non-boot files). The static site.js graph is bundled
 * separately and skipped here.
 */
async function minifyPublicJsModules(outDir, logger, skipFiles = []) {
    const jsRoot = path.join(outDir, 'public/js');
    const skip = new Set([...skipFiles].map((value) => resolvePublicSpecifier(value, outDir) || value));
    const allFiles = await listFilesRecursive(jsRoot);
    const jsFiles = allFiles.filter((file) => file.endsWith('.js') && !skip.has(file));
    const startedAt = Date.now();
    let beforeBytes = 0;
    let afterBytes = 0;
    const concurrency = 8;
    let cursor = 0;
    async function minifyOne(filePath) {
        const source = await fs.readFile(filePath);
        beforeBytes += source.length;
        const tmpDir = await fs.mkdtemp(path.join(outDir, '.minify-'));
        try {
            await rolldownBuild({
                input: filePath,
                output: {
                    dir: tmpDir,
                    format: 'es',
                    minify: true,
                    entryFileNames: 'out.js',
                    sourcemap: false,
                },
                // Externalize every non-entry import so relative and /public/ paths stay.
                external: (id) => id !== filePath && !id.startsWith('\0'),
            });
            const minified = await fs.readFile(path.join(tmpDir, 'out.js'));
            afterBytes += minified.length;
            await fs.writeFile(filePath, minified);
        }
        finally {
            await rmrf(tmpDir);
        }
    }
    async function worker() {
        while (cursor < jsFiles.length) {
            const index = cursor;
            cursor += 1;
            const filePath = jsFiles[index];
            if (!filePath)
                return;
            await minifyOne(filePath);
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, jsFiles.length) }, () => worker()));
    const ms = Date.now() - startedAt;
    logger.info(`[build] minified ${jsFiles.length} leftover js modules: ${beforeBytes} → ${afterBytes} bytes `
        + `(${beforeBytes ? ((afterBytes / beforeBytes) * 100).toFixed(1) : '0'}%) in ${ms}ms`);
    return { files: jsFiles.length, beforeBytes, afterBytes, ms };
}
async function hashAndRewritePublicAssets(outDir, options, runtimeBundle) {
    const assetMap = {};
    const chunkMap = new Map();
    const rewrites = [
        {
            source: path.join(outDir, 'public/css/style.css'),
            original: '/public/css/style.css',
            targetDir: path.join(outDir, 'public/css'),
            targetBase: 'style',
            extension: '.css',
            chunk: 'shell-css',
        },
        {
            source: path.join(outDir, 'public/js/site.js'),
            original: '/public/js/site.js',
            targetDir: path.join(outDir, 'public/js'),
            targetBase: 'site',
            extension: '.js',
            chunk: 'site-runtime',
        },
    ];
    const jsRoot = path.join(outDir, 'public/js');
    try {
        const bootFiles = (await fs.readdir(jsRoot)).filter((name) => /^boot-.+\.js$/.test(name));
        for (const name of bootFiles) {
            rewrites.push({
                source: path.join(jsRoot, name),
                original: `/public/js/${name}`,
                targetDir: jsRoot,
                targetBase: name.replace(/\.js$/i, ''),
                extension: '.js',
                chunk: 'site-runtime',
            });
        }
    }
    catch (error) {
        if (!isErrnoCode(error, 'ENOENT'))
            throw error;
    }
    for (const rewrite of rewrites) {
        const chunkEntries = chunkMap.get(rewrite.chunk) || [];
        chunkEntries.push(rewrite.original);
        chunkMap.set(rewrite.chunk, chunkEntries);
        try {
            const content = await fs.readFile(rewrite.source);
            if (!options.fingerprintAssets) {
                assetMap[rewrite.original] = rewrite.original;
                continue;
            }
            const hash = fingerprint(content);
            const hashedName = `${rewrite.targetBase}.${hash}${rewrite.extension}`;
            const target = path.join(rewrite.targetDir, hashedName);
            await fs.rename(rewrite.source, target);
            assetMap[rewrite.original] = `/public/${path.relative(path.join(outDir, 'public'), target).split(path.sep).join('/')}`;
        }
        catch (error) {
            if (isErrnoCode(error, 'ENOENT'))
                continue;
            throw error;
        }
    }
    const workerPath = path.join(outDir, 'sw.js');
    const rewriteTargets = (await listFilesRecursive(outDir)).filter((file) => (file.endsWith('.html')
        || file.endsWith('.js')
        || path.resolve(file) === path.resolve(workerPath)));
    for (const file of rewriteTargets) {
        const source = await fs.readFile(file, 'utf8');
        let output = source;
        for (const [original, hashed] of Object.entries(assetMap)) {
            output = output.replaceAll(original, hashed);
            const originalBase = path.posix.basename(original);
            const hashedBase = path.posix.basename(hashed);
            if (originalBase !== hashedBase) {
                output = output.replaceAll(`./${originalBase}`, `./${hashedBase}`);
            }
        }
        if (output !== source) {
            await fs.writeFile(file, output, 'utf8');
        }
    }
    const resolveAssetHref = (href) => assetMap[href] || href;
    const modulePacks = Object.fromEntries(Object.entries(runtimeBundle.modulePacks).map(([id, pack]) => [id, {
            ...pack,
            href: resolveAssetHref(pack.href),
            imports: pack.imports.map(resolveAssetHref),
            dynamicImports: pack.dynamicImports.map(resolveAssetHref),
        }]));
    const manifest = {
        fingerprinted: options.fingerprintAssets,
        assets: assetMap,
        chunks: Object.fromEntries([...chunkMap.entries()].map(([chunk, assets]) => [chunk, assets.sort()])),
        boot: {
            ...runtimeBundle.boot,
            hrefs: runtimeBundle.boot.hrefs.map(resolveAssetHref),
        },
        modulePacks,
    };
    await fs.writeFile(path.join(outDir, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return manifest;
}
export async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        printHelp();
        return;
    }
    options.outDir = assertSafeOutputDir(options.outDir);
    const logger = createLogger(options);
    const startedAt = Date.now();
    const sourcePaths = listSourceRepoPaths(options);
    if (options.local) {
        logger.info('[build] local mode: skipping image checks, sitemap, catalog, and fingerprinting');
    }
    if (options.clean) {
        logger.info(`[build] cleaning ${relRepo(options.outDir)}/`);
        await rmrf(options.outDir);
    }
    else {
        logger.info(`[build] preserving existing ${relRepo(options.outDir)}/`);
    }
    await fs.mkdir(options.outDir, { recursive: true });
    if (options.imageCheck) {
        logger.info('[build] checking image redundancy');
        logDuplicateImages(await checkImageRedundancy(sourcePaths), logger);
    }
    else {
        logger.info('[build] skipping image redundancy check');
    }
    logger.info(`[build] copying ${sourcePaths.length} source files to ${relRepo(options.outDir)}/`);
    const copyStats = await copyRepo(sourcePaths, options, logger);
    await writeNoJekyll(options.outDir);
    if (options.sitemap) {
        logger.info('[build] generating sitemap.xml');
        runNodeScript('scripts/generate-sitemap.mjs', ['--out', path.join(options.outDir, 'sitemap.xml')]);
    }
    else {
        logger.info('[build] skipping sitemap generation');
    }
    if (options.catalog) {
        logger.info('[build] regenerating design catalog');
        runNodeScript('scripts/generate-design-catalog.mjs', ['--out', path.join(options.outDir, 'design', 'catalog')]);
    }
    else {
        logger.info('[build] skipping design catalog generation');
    }
    let runtimeBundle = {
        boot: {
            hrefs: ['/public/js/site.js'],
            bytes: 0,
            gzipBytes: 0,
        },
        emittedHrefs: ['/public/js/site.js'],
        modulePacks: {},
        bytes: 0,
        ms: 0,
    };
    if (options.minifyJs) {
        logger.info('[build] bundling site.js static graph');
        runtimeBundle = await bundleSiteRuntimeGraph(options.outDir, logger);
        logger.info('[build] minifying leftover public/js modules (per-file, path-preserving)');
        await minifyPublicJsModules(options.outDir, logger, runtimeBundle.emittedHrefs);
    }
    else {
        logger.info('[build] skipping public/js bundle and minify');
    }
    const injected = await injectBootModulePreloads(options.outDir, runtimeBundle.boot.hrefs);
    if (injected) {
        logger.info(`[build] injected boot modulepreload into ${injected} html file(s)`);
    }
    logger.info('[build] preparing service-worker precache from rendered offline dependencies');
    const offlineDependencies = await prepareServiceWorkerPrecache(options.outDir);
    logger.info(`[build] service-worker offline dependencies=${offlineDependencies.length}`);
    const assetManifest = await hashAndRewritePublicAssets(options.outDir, options, runtimeBundle);
    if (assetManifest.fingerprinted) {
        logger.info(`[build] fingerprinted ${Object.keys(assetManifest.assets).length} core asset(s)`);
    }
    else {
        logger.info(`[build] preserved ${Object.keys(assetManifest.assets).length} core asset(s) for local caching`);
    }
    const pwaReport = await assertPwaContract({
        mode: 'dist',
        rootDir: options.outDir,
    });
    logger.info(formatPwaContractSummary(pwaReport));
    const fileCount = await countFiles(options.outDir);
    const ms = Date.now() - startedAt;
    logger.info(`[build] copied=${copyStats.copied} rendered=${copyStats.rendered} symlinked=${copyStats.symlinked} skipped=${copyStats.skipped}`
        + (copyStats.templateMs != null
            ? ` templateMs=${copyStats.templateMs} partialHits=${copyStats.templatePartialHits ?? 0}`
            : ''));
    logger.info(`[build] wrote ${fileCount} files to ${relRepo(options.outDir)}/ in ${ms}ms`);
}
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    await main();
}
