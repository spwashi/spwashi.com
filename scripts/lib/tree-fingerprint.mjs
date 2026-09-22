/**
 * Content fingerprint of the working tree, for skipping a read-only stage
 * whose last green run saw the same files.
 *
 * The index supplies blob hashes for every tracked path; files that differ
 * from the index (modified, deleted, or untracked and not ignored) are hashed
 * from disk. Nothing is written to git: no stash, no write-tree, no index
 * refresh, so a concurrent session's staging is never touched.
 *
 * The stamp lives under .tmp/ and is local to this checkout. CI starts
 * without one, so CI always runs the stage.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STAMP_DIR = path.join(ROOT, '.tmp', 'stage-stamps');

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) return null;
  return result.stdout;
}

/** Git's own blob id, so a dirty file hashes the same before and after it is committed. */
function blobId(content) {
  return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
}

/**
 * Returns a hex digest of path → blob id over the tree as it sits on disk, or ''
 * when git is unavailable (the caller then runs). Staging or committing a file
 * without changing it leaves the digest alone.
 */
export async function treeFingerprint(extra = '') {
  const index = git(['ls-files', '-s', '-z']);
  const dirty = git(['ls-files', '-m', '-d', '-o', '--exclude-standard', '-z']);
  if (!index || !dirty) return '';

  const blobs = new Map();
  for (const entry of index.toString('utf8').split('\0')) {
    // "<mode> <blob> <stage>\t<path>"
    const tab = entry.indexOf('\t');
    if (tab < 0) continue;
    blobs.set(entry.slice(tab + 1), entry.slice(0, tab).split(' ')[1]);
  }
  for (const rel of new Set(dirty.toString('utf8').split('\0').filter(Boolean))) {
    try {
      const stat = await fs.stat(path.join(ROOT, rel));
      // A submodule gitlink keeps its index id; its checkout is not ours to hash.
      if (stat.isFile()) blobs.set(rel, blobId(await fs.readFile(path.join(ROOT, rel))));
    } catch {
      blobs.delete(rel);
    }
  }

  const hash = createHash('sha256');
  hash.update(`node:${process.version} ${process.platform}\n${extra}\n`);
  for (const rel of [...blobs.keys()].sort()) hash.update(`${rel}\0${blobs.get(rel)}\n`);
  return hash.digest('hex');
}

const stampPath = (name) => path.join(STAMP_DIR, `${name}.stamp`);

export async function readStageStamp(name) {
  try {
    return (await fs.readFile(stampPath(name), 'utf8')).trim();
  } catch {
    return '';
  }
}

export async function writeStageStamp(name, fingerprint) {
  if (!fingerprint) return;
  await fs.mkdir(STAMP_DIR, { recursive: true });
  await fs.writeFile(stampPath(name), `${fingerprint}\n`);
}
