/**
 * Content stamp for the route manifest and the committed search index.
 *
 * The gitignored agent cache is a shared local shortcut. The committed
 * public/data/site-search-index.json sourceStamp is what fails a clean
 * checkout. A matching stamp younger than one hour reuses that cache.
 *
 * Two readings of the same inputs: the working tree (check-site, the
 * generators, the local cache) and the git index (the pre-commit check).
 * Several sessions share this working tree, so a commit is checked against
 * what it stages, never against pages another session has not committed.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { shouldIgnoreValidationPath, toPosixPath } from './shared/build-topology.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SEARCH_INDEX_PATH = path.join(ROOT, 'public/data/site-search-index.json');
export const ROUTE_MANIFEST_CACHE = path.join(ROOT, '.agents/state/runtime/route-runtime-manifest.json');
export const MANIFEST_STAMP_PATH = path.join(ROOT, '.agents/state/runtime/route-runtime-manifest.stamp.json');
export const MANIFEST_CACHE_WINDOW_MS = Number(process.env.SPW_MANIFEST_CACHE_WINDOW_MS) || 60 * 60 * 1000;
export const SEARCH_INDEX_RELATIVE = 'public/data/site-search-index.json';
const EXTRA_INPUTS = Object.freeze([
    'public/js/runtime/catalog/core.js',
    'public/js/runtime/catalog/feature.js',
    'public/js/runtime/catalog/region.js',
    'public/js/runtime/catalog/enhancement.js',
    'public/js/kernel/component-fixtures.js',
    'public/js/kernel/region-ecology-fixtures.js',
    'scripts/generate-site-search-index.mjs',
    'scripts/lib/visual-capture-plan.mjs',
    'scripts/lib/manifest-stamp.mjs',
    'scripts/ts/manifest-stamp.mts',
]);
export function stampFromEntries(entries) {
    const hash = createHash('sha256');
    const ordered = [...entries].sort((left, right) => left.path.localeCompare(right.path));
    for (const entry of ordered) {
        hash.update(entry.path);
        hash.update('\0');
        hash.update(entry.content);
        hash.update('\0');
    }
    return hash.digest('hex');
}
export function evaluateManifestFreshness({ liveStamp, committedStamp = null, cacheStamp = null, verifiedAt = null, now = Date.now(), windowMs = MANIFEST_CACHE_WINDOW_MS, } = { liveStamp: '' }) {
    let indexStatus = 'unstamped';
    if (committedStamp && committedStamp === liveStamp)
        indexStatus = 'fresh';
    else if (committedStamp)
        indexStatus = 'stale';
    const verifiedMs = verifiedAt ? Date.parse(verifiedAt) : Number.NaN;
    const ageMs = Number.isFinite(verifiedMs) ? now - verifiedMs : null;
    const withinWindow = indexStatus === 'fresh'
        && cacheStamp === liveStamp
        && ageMs != null
        && ageMs >= 0
        && ageMs < windowMs;
    return { ageMs, indexStatus, withinWindow };
}
async function walkIndexHtml(directory, results = []) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        const relative = toPosixPath(path.relative(ROOT, absolute));
        if (shouldIgnoreValidationPath(relative))
            continue;
        if (entry.isDirectory()) {
            await walkIndexHtml(absolute, results);
            continue;
        }
        if (entry.isFile() && entry.name === 'index.html')
            results.push(relative);
    }
    return results;
}
export async function listManifestStampInputs() {
    const routes = await walkIndexHtml(ROOT);
    return [...new Set([...routes, ...EXTRA_INPUTS])].sort();
}
/** Inputs as the git index holds them: tracked routes plus the extra inputs that are staged. */
export function listStagedManifestStampInputs(indexPaths) {
    const extras = new Set(EXTRA_INPUTS);
    return [...new Set(indexPaths.filter((relativePath) => {
            if (extras.has(relativePath))
                return true;
            if (shouldIgnoreValidationPath(relativePath))
                return false;
            return relativePath === 'index.html' || relativePath.endsWith('/index.html');
        }))].sort();
}
/** path → staged blob, read in one `git cat-file --batch` pass. */
function readStagedBlobs(relativePaths) {
    const wanted = new Set(relativePaths);
    const listing = spawnSync('git', ['ls-files', '-s', '-z'], { cwd: ROOT, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
    if (listing.status !== 0)
        return new Map();
    const shaByPath = new Map();
    for (const record of listing.stdout.toString('utf8').split('\0')) {
        const tab = record.indexOf('\t');
        if (tab < 0)
            continue;
        const [, sha, stage] = record.slice(0, tab).split(' ');
        const relativePath = record.slice(tab + 1);
        if (stage === '0' && wanted.has(relativePath))
            shaByPath.set(relativePath, sha);
    }
    const order = [...shaByPath.keys()];
    const batch = spawnSync('git', ['cat-file', '--batch'], {
        cwd: ROOT,
        input: order.map((relativePath) => shaByPath.get(relativePath)).join('\n') + '\n',
        maxBuffer: 256 * 1024 * 1024,
    });
    const blobs = new Map();
    if (batch.status !== 0 || !batch.stdout)
        return blobs;
    let cursor = 0;
    for (const relativePath of order) {
        const headerEnd = batch.stdout.indexOf(0x0a, cursor);
        if (headerEnd < 0)
            break;
        const size = Number(batch.stdout.subarray(cursor, headerEnd).toString('utf8').split(' ')[2]);
        if (!Number.isFinite(size))
            break;
        blobs.set(relativePath, batch.stdout.subarray(headerEnd + 1, headerEnd + 1 + size));
        cursor = headerEnd + 1 + size + 1;
    }
    return blobs;
}
function listIndexPaths() {
    const result = spawnSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (result.status !== 0)
        return [];
    return result.stdout.split('\0').filter(Boolean);
}
/** The stamp of the routes a commit would record, read from the git index. */
export function computeStagedManifestSourceStamp() {
    const inputs = listStagedManifestStampInputs(listIndexPaths());
    const blobs = readStagedBlobs(inputs);
    return stampFromEntries(inputs.filter((relativePath) => blobs.has(relativePath))
        .map((relativePath) => ({ path: relativePath, content: blobs.get(relativePath) })));
}
/**
 * The pre-commit decision, pure. A commit passes when the search index it
 * records was built from the routes it records, whether or not this commit is
 * the one that stages the index: an index an earlier commit already made
 * correct needs no restaging.
 */
export function evaluateStagedManifest({ touchesInputs, touchesIndex, stagedStamp, indexStamp, }) {
    if (!touchesInputs && !touchesIndex)
        return { ok: true, reason: 'no manifest inputs staged' };
    if (indexStamp && indexStamp === stagedStamp) {
        return { ok: true, reason: 'the search index this commit records matches the routes it records' };
    }
    return {
        ok: false,
        reason: 'the search index this commit records was not built from the routes it records; run npm run manifest:staged, which builds from what is staged and leaves other sessions\' unstaged pages out',
    };
}
/**
 * When the working tree disagrees with the committed index, say whose drift it
 * is. If the index in the git index still matches the routes in the git index,
 * the disagreement is only unstaged work (often another session's), and the
 * names are the pages it is in; their commit will be checked on its own.
 */
export async function explainManifestDrift() {
    const indexPaths = listIndexPaths();
    const tracked = new Set(indexPaths);
    const stagedText = gitShow(`:${SEARCH_INDEX_RELATIVE}`);
    const indexStamp = sourceStampFromIndexText(stagedText ? stagedText.toString('utf8') : '');
    const stagedConsistent = Boolean(indexStamp) && indexStamp === computeStagedManifestSourceStamp();
    const inputs = await listManifestStampInputs();
    const changed = spawnSync('git', ['diff', '--name-only', '-z', '--', ...inputs], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    const unstaged = new Set(changed.status === 0 ? changed.stdout.split('\0').filter(Boolean) : []);
    for (const relativePath of inputs)
        if (!tracked.has(relativePath))
            unstaged.add(relativePath);
    return { stagedConsistent, unstaged: [...unstaged].sort() };
}
async function readWorktree(relativePath) {
    return fs.readFile(path.join(ROOT, relativePath));
}
function gitShow(spec) {
    const result = spawnSync('git', ['show', spec], {
        cwd: ROOT,
        encoding: 'buffer',
        maxBuffer: 32 * 1024 * 1024,
    });
    if (result.status !== 0 || !result.stdout)
        return null;
    return result.stdout;
}
function isEnoent(error) {
    return Boolean(error) && typeof error === 'object' && error.code === 'ENOENT';
}
export async function computeManifestSourceStamp({ readFile = readWorktree, } = {}) {
    const inputs = await listManifestStampInputs();
    const entries = [];
    for (const relativePath of inputs) {
        try {
            entries.push({ path: relativePath, content: await readFile(relativePath) });
        }
        catch (error) {
            if (isEnoent(error))
                continue;
            throw error;
        }
    }
    return stampFromEntries(entries);
}
export function sourceStampFromIndexText(text) {
    if (!text)
        return null;
    try {
        const parsed = JSON.parse(text);
        return typeof parsed.sourceStamp === 'string' && parsed.sourceStamp ? parsed.sourceStamp : null;
    }
    catch {
        return null;
    }
}
export async function readCommittedSourceStamp() {
    try {
        return sourceStampFromIndexText(await fs.readFile(SEARCH_INDEX_PATH, 'utf8'));
    }
    catch (error) {
        if (isEnoent(error))
            return null;
        throw error;
    }
}
export async function readManifestCacheStamp() {
    try {
        const parsed = JSON.parse(await fs.readFile(MANIFEST_STAMP_PATH, 'utf8'));
        return {
            sourceStamp: typeof parsed.sourceStamp === 'string' ? parsed.sourceStamp : null,
            verifiedAt: typeof parsed.verifiedAt === 'string' ? parsed.verifiedAt : null,
        };
    }
    catch {
        return { sourceStamp: null, verifiedAt: null };
    }
}
export async function writeManifestCacheStamp(sourceStamp, verifiedAt = new Date().toISOString()) {
    await fs.mkdir(path.dirname(MANIFEST_STAMP_PATH), { recursive: true });
    await fs.writeFile(MANIFEST_STAMP_PATH, `${JSON.stringify({ sourceStamp, verifiedAt })}\n`, 'utf8');
}
export async function inspectManifestStamp(now = Date.now()) {
    const liveStamp = await computeManifestSourceStamp();
    const committedStamp = await readCommittedSourceStamp();
    const cache = await readManifestCacheStamp();
    const freshness = evaluateManifestFreshness({
        liveStamp,
        committedStamp,
        cacheStamp: cache.sourceStamp,
        verifiedAt: cache.verifiedAt,
        now,
    });
    return { ...freshness, cacheStamp: cache.sourceStamp, committedStamp, liveStamp, verifiedAt: cache.verifiedAt };
}
function stagedNames() {
    const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
        cwd: ROOT,
        encoding: 'utf8',
    });
    if (result.status !== 0)
        return [];
    return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
}
export async function checkStagedManifestStamp() {
    const staged = new Set(stagedNames());
    const inputs = listStagedManifestStampInputs(listIndexPaths());
    const touchesInputs = inputs.some((relativePath) => staged.has(relativePath));
    const touchesIndex = staged.has(SEARCH_INDEX_RELATIVE);
    if (!touchesInputs && !touchesIndex)
        return evaluateStagedManifest({ touchesInputs, touchesIndex, stagedStamp: '', indexStamp: null });
    const stagedText = gitShow(`:${SEARCH_INDEX_RELATIVE}`);
    const stagedHead = stagedText ? stagedText.subarray(0, 512).toString('utf8') : '';
    const stagedMatch = stagedHead.match(/"sourceStamp":"([a-f0-9]{64})"/);
    const indexStamp = stagedMatch ? stagedMatch[1] : sourceStampFromIndexText(stagedText ? stagedText.toString('utf8') : '');
    return evaluateStagedManifest({ touchesInputs, touchesIndex, stagedStamp: computeStagedManifestSourceStamp(), indexStamp });
}
