/**
 * Clone and crawl neighboring repos listed in .references/catalog.json.
 *
 * This site stays the working tree. Dregg sidecar curriculum and lore.land
 * can sit beside it without being committed.
 */

import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const REF_DIR = path.join(ROOT, '.references');
const CATALOG_PATH = path.join(REF_DIR, 'catalog.json');
const CRAWL_PATH = path.join(REF_DIR, '_crawl.json');

async function git(args, cwd) {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

async function collectSpwFiles(dir, out = [], relRoot = dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '_workbench') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectSpwFiles(full, out, relRoot);
    } else if (entry.name.endsWith('.spw')) {
      out.push(path.relative(relRoot, full).split(path.sep).join('/'));
    }
  }
  return out;
}

async function syncRemote(remote) {
  const dest = path.join(REF_DIR, remote.id);
  const marker = path.join(dest, '.git');
  let action = 'fetched';
  try {
    await fs.access(marker);
    await git(['fetch', '--depth', '1', 'origin'], dest);
    const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD'], dest);
    try {
      await git(['pull', '--ff-only', '--depth', '1', 'origin', branch], dest);
    } catch {
      action = 'fetched-no-ff';
    }
  } catch {
    await git(['clone', '--depth', '1', remote.url, dest], ROOT);
    action = 'cloned';
  }
  const head = await git(['rev-parse', '--short=12', 'HEAD'], dest);
  const spw = await collectSpwFiles(dest);
  return {
    id: remote.id,
    url: remote.url,
    why: remote.why,
    action,
    head,
    spwCount: spw.length,
    spw: spw.sort(),
  };
}

async function main() {
  const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, 'utf8'));
  const refused = new Set(catalog.refuse || []);
  await fs.mkdir(REF_DIR, { recursive: true });

  const results = [];
  for (const remote of catalog.remotes || []) {
    const id = String(remote.id || '').trim();
    if (!id || refused.has(id)) {
      continue;
    }
    process.stderr.write(`sync ${id}…\n`);
    const row = await syncRemote(remote);
    results.push(row);
    console.log(`${row.id} ${row.action} @ ${row.head} — ${row.spwCount} .spw`);
  }

  const crawl = {
    generatedAt: new Date().toISOString(),
    directory: '.references',
    remotes: results,
  };
  await fs.writeFile(CRAWL_PATH, `${JSON.stringify(crawl, null, 2)}\n`);
  console.log(`wrote ${path.relative(ROOT, CRAWL_PATH)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
