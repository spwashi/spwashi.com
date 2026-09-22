/**
 * Content stamp for the route manifest and the committed search index.
 *
 * The gitignored agent cache is a shared local shortcut. The committed
 * public/data/site-search-index.json sourceStamp is what fails a clean
 * checkout. A matching stamp younger than one hour reuses that cache.
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

type StampEntry = { path: string; content: string | Buffer };
type IndexStatus = 'fresh' | 'stale' | 'unstamped';

export function stampFromEntries(entries: StampEntry[]): string {
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

export function evaluateManifestFreshness({
  liveStamp,
  committedStamp = null,
  cacheStamp = null,
  verifiedAt = null,
  now = Date.now(),
  windowMs = MANIFEST_CACHE_WINDOW_MS,
}: {
  liveStamp: string;
  committedStamp?: string | null;
  cacheStamp?: string | null;
  verifiedAt?: string | null;
  now?: number;
  windowMs?: number;
} = { liveStamp: '' }): { ageMs: number | null; indexStatus: IndexStatus; withinWindow: boolean } {
  let indexStatus: IndexStatus = 'unstamped';
  if (committedStamp && committedStamp === liveStamp) indexStatus = 'fresh';
  else if (committedStamp) indexStatus = 'stale';

  const verifiedMs = verifiedAt ? Date.parse(verifiedAt) : Number.NaN;
  const ageMs = Number.isFinite(verifiedMs) ? now - verifiedMs : null;
  const withinWindow = indexStatus === 'fresh'
    && cacheStamp === liveStamp
    && ageMs != null
    && ageMs >= 0
    && ageMs < windowMs;

  return { ageMs, indexStatus, withinWindow };
}

async function walkIndexHtml(directory: string, results: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    const relative = toPosixPath(path.relative(ROOT, absolute));
    if (shouldIgnoreValidationPath(relative)) continue;
    if (entry.isDirectory()) {
      await walkIndexHtml(absolute, results);
      continue;
    }
    if (entry.isFile() && entry.name === 'index.html') results.push(relative);
  }
  return results;
}

export async function listManifestStampInputs(): Promise<string[]> {
  const routes = await walkIndexHtml(ROOT);
  return [...new Set([...routes, ...EXTRA_INPUTS])].sort();
}

async function readWorktree(relativePath: string): Promise<Buffer> {
  return fs.readFile(path.join(ROOT, relativePath));
}

function gitShow(spec: string): Buffer | null {
  const result = spawnSync('git', ['show', spec], {
    cwd: ROOT,
    encoding: 'buffer',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0 || !result.stdout) return null;
  return result.stdout;
}

function isEnoent(error: unknown): boolean {
  return Boolean(error) && typeof error === 'object' && (error as { code?: string }).code === 'ENOENT';
}

export async function computeManifestSourceStamp({
  readFile = readWorktree,
}: { readFile?: (relativePath: string) => Promise<string | Buffer> } = {}): Promise<string> {
  const inputs = await listManifestStampInputs();
  const entries: StampEntry[] = [];
  for (const relativePath of inputs) {
    try {
      entries.push({ path: relativePath, content: await readFile(relativePath) });
    } catch (error) {
      if (isEnoent(error)) continue;
      throw error;
    }
  }
  return stampFromEntries(entries);
}

export function sourceStampFromIndexText(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as { sourceStamp?: unknown };
    return typeof parsed.sourceStamp === 'string' && parsed.sourceStamp ? parsed.sourceStamp : null;
  } catch {
    return null;
  }
}

export async function readCommittedSourceStamp(): Promise<string | null> {
  try {
    return sourceStampFromIndexText(await fs.readFile(SEARCH_INDEX_PATH, 'utf8'));
  } catch (error) {
    if (isEnoent(error)) return null;
    throw error;
  }
}

export async function readManifestCacheStamp(): Promise<{ sourceStamp: string | null; verifiedAt: string | null }> {
  try {
    const parsed = JSON.parse(await fs.readFile(MANIFEST_STAMP_PATH, 'utf8')) as {
      sourceStamp?: unknown;
      verifiedAt?: unknown;
    };
    return {
      sourceStamp: typeof parsed.sourceStamp === 'string' ? parsed.sourceStamp : null,
      verifiedAt: typeof parsed.verifiedAt === 'string' ? parsed.verifiedAt : null,
    };
  } catch {
    return { sourceStamp: null, verifiedAt: null };
  }
}

export async function writeManifestCacheStamp(sourceStamp: string, verifiedAt = new Date().toISOString()): Promise<void> {
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

function stagedNames(): string[] {
  const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) return [];
  return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
}

export async function checkStagedManifestStamp(): Promise<{ ok: boolean; reason: string }> {
  const staged = new Set(stagedNames());
  const inputs = await listManifestStampInputs();
  const touchesInputs = inputs.some((relativePath) => staged.has(relativePath));
  const touchesIndex = staged.has(SEARCH_INDEX_RELATIVE);
  if (!touchesInputs && !touchesIndex) {
    return { ok: true, reason: 'no manifest inputs staged' };
  }

  const liveStamp = await computeManifestSourceStamp();
  const worktreeStamp = await readCommittedSourceStamp();
  if (worktreeStamp !== liveStamp) {
    return {
      ok: false,
      reason: 'working tree search index stamp does not match the routes; run npm run manifest',
    };
  }
  if (!touchesIndex) {
    return { ok: false, reason: `stage ${SEARCH_INDEX_RELATIVE} with the route change` };
  }

  const stagedText = gitShow(`:${SEARCH_INDEX_RELATIVE}`);
  const stagedHead = stagedText ? stagedText.subarray(0, 512).toString('utf8') : '';
  const stagedMatch = stagedHead.match(/"sourceStamp":"([a-f0-9]{64})"/);
  const stagedStamp = stagedMatch ? stagedMatch[1] : sourceStampFromIndexText(stagedText ? stagedText.toString('utf8') : '');
  if (stagedStamp !== liveStamp) {
    return {
      ok: false,
      reason: 'staged search index does not match the working tree; stage the regenerated index',
    };
  }
  return { ok: true, reason: 'staged search index matches the routes' };
}
