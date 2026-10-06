import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build as rolldownBuild } from 'rolldown';
import { resolvePublicSpecifier } from '../../lib/resolve-public-specifier.mjs';
import { cssForDelivery } from '../css-delivery.mjs';
import { assertPwaContract, collectOfflineDocumentDependencies, formatPwaContractSummary, injectBuildPrecacheAssets, } from '../pwa-contracts.mjs';
import { assertSafeOutputDir, checkImageRedundancy, copyRepo, countFiles, createLogger, listFilesRecursive, listSourceRepoPaths, logDuplicateImages, parseArgs, printHelp, relRepo, rmrf, runNodeScript, writeNoJekyll, ROOT_DIR, } from './ops.mjs';
import { isErrnoCode, toPosixPath } from '../shared/build-topology.mjs';
/** Folding a cycle can close another; a few passes settle the graphs this site makes. */
const MAX_FOLD_ROUNDS = 4;
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
        || path.resolve(path.join(outDir, 'public/js/runtime/catalog'), specifier);
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
    // A module that mounts only under a debug posture is addressed by itself,
    // so the packs every reader downloads do not carry it.
    if (definition.debugOnly || definition.timingArc === 'enhance-debug') {
        return `debug-${slugifyChunkName(definition.id)}`;
    }
    if (when === 'immediate')
        return 'foundation';
    if (when === 'idle')
        return definition.timingChunk ? String(definition.timingChunk) : 'idle-default';
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
/**
 * A pack that takes only its entry leaves the entry's private dependencies in
 * the chunk rolldown makes for the dynamic import. Pack and chunk then import
 * each other, and whichever runs first reads the other before it exists.
 * Discovery already groups an entry with the modules that travel only with
 * it, so those modules join the entry's pack. A discovery chunk whose entries
 * belong to two packs is left to rolldown.
 */
export function assignPackCompanions(chunkNameByEntryPath, discoveryChunks) {
    const assigned = new Map(chunkNameByEntryPath);
    for (const chunk of discoveryChunks) {
        const moduleIds = chunk.moduleIds.map(normalizeModuleId);
        const packs = new Set();
        for (const moduleId of moduleIds) {
            const pack = chunkNameByEntryPath.get(moduleId);
            if (pack)
                packs.add(pack);
        }
        if (packs.size !== 1)
            continue;
        const [pack] = [...packs];
        for (const moduleId of moduleIds) {
            if (!assigned.has(moduleId))
                assigned.set(moduleId, pack);
        }
    }
    return assigned;
}
/**
 * Groups of chunks that import each other, by static import. An acyclic
 * module graph can still be cut into a cyclic chunk graph, and a cycle makes
 * load order decide whether a module reads an initialised binding.
 */
export function findChunkCycles(chunks) {
    const edges = new Map(chunks.map((chunk) => [chunk.fileName, chunk.imports]));
    const index = new Map();
    const low = new Map();
    const stack = [];
    const onStack = new Set();
    const cycles = [];
    let next = 0;
    const visit = (fileName) => {
        index.set(fileName, next);
        low.set(fileName, next);
        next += 1;
        stack.push(fileName);
        onStack.add(fileName);
        for (const target of edges.get(fileName) || []) {
            if (!edges.has(target))
                continue;
            if (!index.has(target)) {
                visit(target);
                low.set(fileName, Math.min(low.get(fileName), low.get(target)));
            }
            else if (onStack.has(target)) {
                low.set(fileName, Math.min(low.get(fileName), index.get(target)));
            }
        }
        if (low.get(fileName) !== index.get(fileName))
            return;
        const group = [];
        let member = '';
        do {
            member = stack.pop();
            onStack.delete(member);
            group.push(member);
        } while (member !== fileName);
        if (group.length > 1 || (edges.get(fileName) || []).includes(fileName))
            cycles.push(group.sort());
    };
    for (const fileName of edges.keys()) {
        if (!index.has(fileName))
            visit(fileName);
    }
    return cycles.sort((left, right) => left[0].localeCompare(right[0]));
}
/** Earlier arrivals host a fold: the pack a page already spends first carries the rest. */
function packArrivalRank(pack) {
    if (pack.when === 'immediate')
        return 0;
    if (pack.when === 'idle')
        return 1;
    if (pack.when === 'settled')
        return 2;
    return 3;
}
/**
 * Chunks that import each other always load together, so one chunk can carry
 * them at no cost in transport. Each cycle folds into the pack in it that
 * arrives first. A cycle that touches the boot closure, or holds no pack, is
 * left alone and stays a warning: folding it would move boot code into a
 * deferred pack or the reverse.
 */
export function foldChunkCycles(cycles, chunks, packs, packNameByModuleId, bootFileNames = new Set()) {
    const chunkByFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
    const packByChunkName = new Map(packs.map((pack) => [pack.chunkName, pack]));
    const next = new Map(packNameByModuleId);
    const folds = [];
    for (const cycle of cycles) {
        if (cycle.some((fileName) => bootFileNames.has(fileName)))
            continue;
        const members = cycle.map((fileName) => chunkByFile.get(fileName)).filter((chunk) => chunk != null);
        const hosts = members
            .filter((chunk) => packByChunkName.has(chunk.name))
            .sort((left, right) => (packArrivalRank(packByChunkName.get(left.name)) - packArrivalRank(packByChunkName.get(right.name))
            || left.name.localeCompare(right.name)));
        if (!hosts.length)
            continue;
        const host = hosts[0].name;
        for (const chunk of members) {
            for (const moduleId of chunk.moduleIds)
                next.set(normalizeModuleId(moduleId), host);
        }
        folds.push({ host, members: members.map((chunk) => chunk.name).filter((name) => name !== host).sort() });
    }
    return { packNameByModuleId: next, folds };
}
/** The module imports that hold a chunk cycle together, so a warning names what to move. */
export function describeCycleEdges(cycle, chunkByModuleId, importsByModuleId) {
    const members = new Set(cycle);
    const edges = [];
    for (const [from, imports] of importsByModuleId) {
        const fromChunk = chunkByModuleId.get(from);
        if (!fromChunk || !members.has(fromChunk))
            continue;
        for (const to of imports) {
            const toChunk = chunkByModuleId.get(to);
            if (!toChunk || toChunk === fromChunk || !members.has(toChunk))
                continue;
            edges.push({ from, fromChunk, to, toChunk });
        }
    }
    return edges.sort((left, right) => left.from.localeCompare(right.from) || left.to.localeCompare(right.to));
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
    const catalogUrl = pathToFileURL(path.join(ROOT_DIR, 'public/js/runtime/catalog/index.js')).href;
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
    const startedAt = Date.now();
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
        // Off deliberately. Strict order wraps every module in a lazy `init_x()`
        // held in a `var`, and the semantic groups below once handed rolldown
        // chunk graphs with cycles in them even though the module graph has none.
        // A `var` binding is not hoisted like a function declaration, so the first
        // chunk into a cycle called an initializer that was still undefined and
        // every module mount after it died on `is not a function`. Native ESM
        // ordering is already correct for an acyclic module graph, which this
        // one is; the wrappers were buying nothing and costing the runtime. The
        // cut into packs is now folded until it has no cycles either (below).
        strictExecutionOrder: false,
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
    let packNameByModuleId = assignPackCompanions(semanticPlan.chunkNameByEntryPath, discoveryChunks);
    const importsByModuleId = new Map();
    const bundleWithPacks = async (packNames) => {
        const result = await rolldownBuild({
            ...sharedOptions,
            plugins: [
                ...sharedOptions.plugins,
                {
                    name: 'static-import-ledger',
                    moduleParsed(info) {
                        importsByModuleId.set(normalizeModuleId(info.id), info.importedIds.map(normalizeModuleId));
                    },
                },
            ],
            write: false,
            output: {
                ...sharedOutput,
                codeSplitting: {
                    includeDependenciesRecursively: false,
                    groups: [{
                            name(moduleId) {
                                return packNames.get(normalizeModuleId(moduleId)) || null;
                            },
                            entriesAware: false,
                        }],
                },
            },
        });
        return result.output.filter((output) => output.type === 'chunk');
    };
    // The module graph has no cycles; a cut of it into packs can. Fold each
    // cycle into one pack and cut again, until the chunk graph is a DAG too.
    let chunks = await bundleWithPacks(packNameByModuleId);
    let chunkCycles = findChunkCycles(chunks);
    const folds = [];
    for (let round = 0; chunkCycles.length && round < MAX_FOLD_ROUNDS; round += 1) {
        const bootFileNames = new Set(collectStaticChunkClosure(chunks).map((chunk) => chunk.fileName));
        const folded = foldChunkCycles(chunkCycles, chunks, semanticPlan.packs, packNameByModuleId, bootFileNames);
        if (!folded.folds.length)
            break;
        folds.push(...folded.folds);
        packNameByModuleId = folded.packNameByModuleId;
        chunks = await bundleWithPacks(packNameByModuleId);
        chunkCycles = findChunkCycles(chunks);
    }
    for (const fold of folds) {
        logger.info(`[build] folded ${fold.members.join(', ')} into ${fold.host}: they import each other and load together`);
    }
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
    const chunkByModuleId = new Map();
    for (const chunk of chunks) {
        for (const moduleId of chunk.moduleIds)
            chunkByModuleId.set(normalizeModuleId(moduleId), chunk);
    }
    const packIdByChunkName = new Map(semanticPlan.packs.map((pack) => [pack.chunkName, pack.id]));
    const modulePacks = {};
    for (const pack of semanticPlan.packs) {
        // A folded pack has no chunk of its own name; its entry says where it went.
        const chunk = chunksByName.get(pack.chunkName) || chunkByModuleId.get(pack.entryPaths[0]);
        if (!chunk)
            continue;
        const foldedInto = chunk.name === pack.chunkName ? null : packIdByChunkName.get(chunk.name) || null;
        modulePacks[pack.id] = {
            ...(foldedInto ? { foldedInto } : {}),
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
    for (const cycle of chunkCycles) {
        logger.warn(`[build] chunk cycle: ${cycle.map((fileName) => path.basename(fileName)).join(' <-> ')}`);
        const fileByModuleId = new Map([...chunkByModuleId].map(([moduleId, chunk]) => [moduleId, chunk.fileName]));
        for (const edge of describeCycleEdges(cycle, fileByModuleId, importsByModuleId)) {
            logger.warn(`[build]   ${path.relative(jsRoot, edge.from)} (${path.basename(edge.fromChunk)}) imports ${path.relative(jsRoot, edge.to)} (${path.basename(edge.toChunk)})`);
        }
    }
    const ms = Date.now() - startedAt;
    logger.info(`[build] bundled site runtime graph: boot=${boot.hrefs.join(', ') || '(none)'} `
        + `packs=${Object.keys(modulePacks).length} chunks=${chunks.length} cycles=${chunkCycles.length} `
        + `(${bytes} bytes total, ${boot.bytes} boot, ${ms}ms)`);
    return {
        boot,
        emittedHrefs,
        modulePacks,
        chunkCycles: chunkCycles.map((cycle) => cycle.map((fileName) => path.basename(fileName))),
        bytes,
        ms,
    };
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
    await Promise.all(files.map(async (file) => {
        const source = await fs.readFile(file, 'utf8');
        if (!SITE_SCRIPT_RE.test(source) || source.includes('data-spw-boot-chunk="true"'))
            return;
        const output = source.replace(SITE_SCRIPT_RE, `${links}\n    $1`);
        if (output === source)
            return;
        await fs.writeFile(file, output, 'utf8');
        changed += 1;
    }));
    return changed;
}
/**
 * Delivery form of every dist/public/css sheet: comments and indentation out,
 * rules untouched. Committed CSS keeps its prose; see css-delivery.mts.
 */
async function stripPublicCssComments(outDir, logger) {
    const cssFiles = (await listFilesRecursive(path.join(outDir, 'public/css'))).filter((file) => file.endsWith('.css'));
    let beforeBytes = 0;
    let afterBytes = 0;
    await Promise.all(cssFiles.map(async (file) => {
        const source = await fs.readFile(file, 'utf8');
        const output = cssForDelivery(source);
        beforeBytes += Buffer.byteLength(source, 'utf8');
        afterBytes += Buffer.byteLength(output, 'utf8');
        if (output !== source)
            await fs.writeFile(file, output, 'utf8');
    }));
    logger.info(`[build] stripped comments from ${cssFiles.length} css files: ${beforeBytes} → ${afterBytes} bytes `
        + `(${beforeBytes ? ((afterBytes / beforeBytes) * 100).toFixed(1) : '0'}%)`);
    return { files: cssFiles.length, beforeBytes, afterBytes };
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
        const bundle = await rolldownBuild({
            input: filePath,
            write: false,
            output: {
                format: 'es',
                minify: true,
                sourcemap: false,
            },
            // Externalize every non-entry import so relative and /public/ paths stay.
            external: (id) => id !== filePath && !id.startsWith('\0'),
        });
        const chunk = bundle.output.find((out) => out.type === 'chunk');
        if (chunk) {
            const minified = Buffer.from(chunk.code, 'utf8');
            afterBytes += minified.length;
            await fs.writeFile(filePath, minified);
        }
        else {
            afterBytes += source.length;
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
    const activeRewrites = Object.entries(assetMap).filter(([original, hashed]) => original !== hashed);
    if (activeRewrites.length > 0) {
        const workerPath = path.join(outDir, 'sw.js');
        const rewriteTargets = (await listFilesRecursive(outDir)).filter((file) => (file.endsWith('.html')
            || file.endsWith('.js')
            || path.resolve(file) === path.resolve(workerPath)));
        const rewritePoolLimit = 16;
        let cursor = 0;
        async function rewriteWorker() {
            while (cursor < rewriteTargets.length) {
                const index = cursor;
                cursor += 1;
                const file = rewriteTargets[index];
                if (!file)
                    return;
                const source = await fs.readFile(file, 'utf8');
                let output = source;
                for (const [original, hashed] of activeRewrites) {
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
        }
        await Promise.all(Array.from({ length: Math.min(rewritePoolLimit, rewriteTargets.length) }, () => rewriteWorker()));
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
        chunkCycles: runtimeBundle.chunkCycles,
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
    // The sitemap and the catalog write outputs nothing else in this build writes
    // (sitemap.xml, design/catalog/), and both read the repo, not the out dir, so
    // they run beside the JS bundle and minify. They must land before the passes
    // that rewrite every .html (boot preloads, asset fingerprints).
    const generators = [];
    const startGenerator = (label, script, args) => {
        logger.info(`[build] ${label} (in parallel)`);
        generators.push(runNodeScript(script, args).then((output) => {
            if (output)
                logger.info(output);
        }));
    };
    if (options.sitemap) {
        startGenerator('generating sitemap.xml', 'scripts/generate-sitemap.mjs', ['--out', path.join(options.outDir, 'sitemap.xml')]);
    }
    else {
        logger.info('[build] skipping sitemap generation');
    }
    if (options.catalog) {
        startGenerator('regenerating design catalog', 'scripts/generate-design-catalog.mjs', ['--out', path.join(options.outDir, 'design', 'catalog')]);
        // The committed atlas is the version history; the deployed one is always current.
        startGenerator('regenerating runtime atlas', 'scripts/generate-runtime-atlas.mjs', [`--out=${path.join(options.outDir, 'public', 'data', 'runtime-atlas.json')}`]);
        // What another origin may mount with runtime/orchestration/host.js, and which stylesheets travel with it.
        startGenerator('writing portable module manifest', 'scripts/portable-audit.mjs', [`--out=${path.join(options.outDir, 'public', 'data', 'portable-modules.json')}`]);
    }
    else {
        logger.info('[build] skipping design catalog generation');
    }
    // Reject together below, not as an unhandled rejection mid-bundle.
    const generatorsSettled = Promise.allSettled(generators);
    let runtimeBundle = {
        boot: {
            hrefs: ['/public/js/site.js'],
            bytes: 0,
            gzipBytes: 0,
        },
        emittedHrefs: ['/public/js/site.js'],
        modulePacks: {},
        chunkCycles: [],
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
    if (options.minifyCss) {
        await stripPublicCssComments(options.outDir, logger);
    }
    else {
        logger.info('[build] skipping public/css comment strip');
    }
    const failedGenerator = (await generatorsSettled).find((result) => result.status === 'rejected');
    if (failedGenerator)
        throw failedGenerator.reason;
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
