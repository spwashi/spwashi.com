/**
 * Local capture archive: stills live under archive/images/.
 * WIP until a commit; post-commit seals into archive/images/<shortsha>/.
 * Image folders stay image-only (viewport clusters, numbered names) so a
 * file-tree arrow-key preview walks stills, not JSON sidecars.
 * Fast no-op when _wip is empty — do not import the Chrome harness here.
 */
import { copyFile, mkdir, readFile, readdir, rename, rm, writeFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export const ARCHIVE_STAMP_RE = /^(\d{4}-\d{2}-\d{2}_\d{6})/;
const ERROR_PREFIX = /^(blank|collision|failed|miss)--/;

export function formatArchiveStamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + '_' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

export function gitHead(cwd = process.cwd()) {
  const hash = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd, encoding: 'utf8' });
  const subject = spawnSync('git', ['log', '-1', '--format=%s'], { cwd, encoding: 'utf8' });
  return {
    hash: (hash.stdout || '').trim() || 'unknown',
    subject: (subject.stdout || '').trim() || '',
  };
}

export function imagesRoot(outDir) {
  return path.join(outDir, 'archive', 'images');
}

export function wipDir(outDir) {
  return path.join(imagesRoot(outDir), '_wip');
}

export async function wipHasStills(outDir) {
  try {
    const names = await readdir(wipDir(outDir));
    return names.some((name) => !name.startsWith('.') && !name.endsWith('.json') && !name.endsWith('.html'));
  } catch {
    return false;
  }
}

function errorKindFromName(name) {
  return ERROR_PREFIX.exec(path.basename(name))?.[1] || null;
}

function isMetaName(name) {
  return name.endsWith('.json') || name.endsWith('.html') || name === 'meta';
}

export function archiveImageRel(captureFile) {
  return String(captureFile || '').replace(/^captures\//, '');
}

async function listImageFiles(dir, prefix = '') {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const names = [];
  for (const entry of entries) {
    if (isMetaName(entry.name) || entry.name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      names.push(...await listImageFiles(path.join(dir, entry.name), rel));
      continue;
    }
    names.push(rel);
  }
  return names.sort();
}

export async function archiveKeptPack(outDir, manifest, kept, errorArtifacts = []) {
  if (!kept.length && !errorArtifacts.length) return null;
  const stamp = formatArchiveStamp();
  const destDir = wipDir(outDir);
  await mkdir(path.join(destDir, 'meta'), { recursive: true });
  const flats = [];
  for (const still of [...kept, ...errorArtifacts]) {
    if (!still.file) continue;
    const rel = archiveImageRel(still.file);
    if (!rel || rel.endsWith('.json') || rel.endsWith('.html')) continue;
    const dest = path.join(destDir, rel);
    try {
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(path.join(outDir, still.file), dest);
      flats.push({
        file: rel,
        kind: errorKindFromName(rel) || still.kind || still.flow || 'still',
        id: still.id || still.fixtureId || rel,
        textPreview: still.textPreview || still.message || '',
      });
    } catch {
      // Missing file is itself a glitch; do not fail the pack.
    }
  }
  await writeFile(
    path.join(destDir, 'meta', `${stamp}.json`),
    `${JSON.stringify({
      at: manifest.at,
      archive: stamp,
      cluster: '_wip',
      captures: kept.length,
      errors: errorArtifacts.length,
      flats,
    }, null, 2)}\n`,
  );
  await writeArchiveIndex(outDir);
  return stamp;
}

export async function sealWipToCommit(outDir, cwd = process.cwd()) {
  if (!await wipHasStills(outDir)) return { sealed: 0, cluster: null };
  const { hash, subject } = gitHead(cwd);
  const cluster = hash;
  const from = wipDir(outDir);
  const to = path.join(imagesRoot(outDir), cluster);
  await mkdir(to, { recursive: true });
  const names = await readdir(from);
  let sealed = 0;
  for (const name of names) {
    try {
      await rename(path.join(from, name), path.join(to, name));
      sealed += 1;
    } catch {
      try {
        await copyFile(path.join(from, name), path.join(to, name));
        await rm(path.join(from, name), { force: true });
        sealed += 1;
      } catch {
        // leave in wip
      }
    }
  }
  await writeFile(
    path.join(to, 'commit.json'),
    `${JSON.stringify({ hash, subject, sealedAt: new Date().toISOString() }, null, 2)}\n`,
  );
  await writeArchiveIndex(outDir);
  return { sealed, cluster, subject };
}

async function migrateLooseArchive(outDir) {
  const root = path.join(outDir, 'archive');
  const prior = path.join(imagesRoot(outDir), '_prior');
  await mkdir(prior, { recursive: true });
  let entries = [];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return 0;
  }
  let moved = 0;
  for (const entry of entries) {
    if (entry.name === 'images' || entry.name === 'index.html') continue;
    const from = path.join(root, entry.name);
    if (entry.isDirectory() && ARCHIVE_STAMP_RE.test(entry.name)) {
      const nested = path.join(from, 'captures');
      let files = [];
      try {
        files = await readdir(nested);
      } catch {
        files = [];
      }
      for (const name of files) {
        try {
          await copyFile(path.join(nested, name), path.join(prior, `${entry.name}--${name}`));
          moved += 1;
        } catch { /* skip */ }
      }
      await rm(from, { recursive: true, force: true });
      continue;
    }
    if (entry.isFile() && (ARCHIVE_STAMP_RE.test(entry.name) || entry.name.endsWith('.json'))) {
      try {
        await rename(from, path.join(prior, entry.name));
        moved += 1;
      } catch { /* skip */ }
    }
  }
  return moved;
}

async function readCommitMeta(dir) {
  try {
    return JSON.parse(await readFile(path.join(dir, 'commit.json'), 'utf8'));
  } catch {
    return null;
  }
}

export async function writeArchiveIndex(outDir) {
  const root = path.join(outDir, 'archive');
  await mkdir(root, { recursive: true });
  await mkdir(imagesRoot(outDir), { recursive: true });
  await migrateLooseArchive(outDir);

  let clusters = [];
  try {
    clusters = (await readdir(imagesRoot(outDir), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    clusters = [];
  }

  const order = (name) => {
    if (name === '_wip') return 0;
    if (name === '_prior') return 2;
    return 1;
  };
  clusters.sort((a, b) => order(a) - order(b) || b.localeCompare(a));

  const tocParts = [];
  const sections = [];
  for (const cluster of clusters) {
    const dir = path.join(imagesRoot(outDir), cluster);
    const files = await listImageFiles(dir);
    if (!files.length && cluster !== '_wip') continue;
    const meta = await readCommitMeta(dir);
    const label = cluster === '_wip'
      ? 'WIP — uncommitted'
      : cluster === '_prior'
        ? 'Prior stills'
        : `${cluster}${meta?.subject ? ` — ${meta.subject}` : ''}`;
    const errors = files.filter((name) => ERROR_PREFIX.test(name)).length;
    tocParts.push(`<a href="#${cluster}"><code>${cluster}</code></a> · ${files.length}${errors ? ` · ${errors} err` : ''}`);
    const cards = files.map((name) => {
      const kind = errorKindFromName(name);
      const href = `./images/${cluster}/${name}`;
      const isImage = /\.(png|jpe?g|webp)$/i.test(name);
      const media = isImage ? `<img src="${href}" alt="${name}" loading="lazy"/>` : `<pre>${name}</pre>`;
      return `<figure class="card${kind ? ' card--error' : ''}" data-error="${kind || ''}">
        ${media}
        <figcaption><code>${name}</code></figcaption>
      </figure>`;
    }).join('\n');
    sections.push(`<section id="${cluster}">
      <h2>${label} · ${files.length}</h2>
      <div class="grid">${cards || '<p class="meta">Empty.</p>'}</div>
    </section>`);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Visual capture archive</title>
  <style>
    :root { font-family: ui-sans-serif, system-ui, sans-serif; color: #1a1a1a; background: #f7f4ee; }
    body { margin: 0; padding: 1.5rem; }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    h2 { font-size: 1rem; margin: 2rem 0 0.75rem; }
    .meta, .toc { color: #555; font-size: 0.9rem; }
    .toc { display: flex; flex-wrap: wrap; gap: 0.35rem 0.85rem; margin: 0.75rem 0 1.25rem; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); }
    .card { margin: 0; background: #fff; border: 1px solid #ddd4c4; border-radius: 0.5rem; overflow: hidden; }
    .card img { display: block; width: 100%; max-height: 12rem; object-fit: contain; background: #eee; }
    .card--error { border-color: #c47a3a; }
    figcaption { padding: 0.5rem 0.65rem 0.7rem; font-size: 0.75rem; line-height: 1.3; word-break: break-all; }
    a { color: #176; }
    code { font-size: 0.86em; }
  </style>
</head>
<body>
  <h1>Visual capture archive</h1>
  <p class="meta">Images live in <code>archive/images/&lt;commit&gt;/&lt;viewport&gt;/</code>. JSON is in <code>meta/</code>. WIP waits in <code>_wip</code> until seal. Latest pack: <a href="../index.html">current</a>.</p>
  <nav class="toc">${tocParts.join(' · ') || 'No stills yet. Run <code>npm run visual:capture</code>.'}</nav>
  ${sections.join('\n')}
</body>
</html>
`;
  await writeFile(path.join(root, 'index.html'), html);
}

export async function pruneArchivePacks(outDir, retain = 12) {
  const root = imagesRoot(outDir);
  let clusters = [];
  try {
    clusters = (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name !== '_wip' && entry.name !== '_prior')
      .map((entry) => entry.name);
  } catch {
    return [];
  }
  const dated = [];
  for (const name of clusters) {
    let mtime = 0;
    try {
      mtime = (await stat(path.join(root, name))).mtimeMs;
    } catch { /* skip */ }
    dated.push({ name, mtime });
  }
  dated.sort((a, b) => b.mtime - a.mtime);
  const dropped = dated.slice(Math.max(0, retain)).map((row) => row.name);
  for (const name of dropped) {
    await rm(path.join(root, name), { recursive: true, force: true });
  }
  if (dropped.length) await writeArchiveIndex(outDir);
  return dropped;
}

export function isArchiveOnly(options) {
  return Boolean(
    (options.prune || options.index || options.seal)
    && !options.ecology
    && !options.social
    && !options.precipitate
    && !options.changed
    && !options.dryPlan
    && !options.ids
    && !options.tokens.length,
  );
}
