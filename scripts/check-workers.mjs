/**
 * Cluster gate for workers/: inventory, syntax, gitignore, no secrets in source.
 * Drift in a carried page fails before any suite. Every *.test.mjs under a
 * worker's test/ is run, so a new file is in the gate without being listed.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORKERS = path.join(ROOT, 'workers');
const LIB = path.join(WORKERS, 'lib');
const INVENTORY = path.join(WORKERS, 'cluster.json');
const BANNED = [
  [/wet\s+ass\s+pussy/i, 'banned expansion'],
  [/pussy/i, 'banned lemma'],
];

/** Shared browser/asset files in workers/lib/ that units copy into assets/ byte for byte. */
const SHARED_ASSET_FILES = [
  ['set-ring.js', 'set-ring.js'],
  ['set-ring.css', 'set-ring.css'],
  ['pinch.js', 'pinch.js'],
  ['pinch.css', 'pinch.css'],
  ['text-scale.js', 'text-scale.js'],
  ['text-scale.css', 'text-scale.css'],
  ['text-scale-head.js', 'text-scale-head.js'],
  ['clean-still.js', 'clean-still.js'],
  ['clean-still.css', 'clean-still.css'],
  ['slot-scrub.js', 'slot-scrub.js'],
  ['slot-scrub.css', 'slot-scrub.css'],
  ['hold.js', 'lib/hold.js'],
  ['near-word.js', 'lib/near-word.js'],
];

/** Shared exports in workers/lib/ that no worker unit may duplicate locally. */
const FORBIDDEN_LOCAL_COPIES = [
  [/\bfunction\s+escapeHtml\s*\(|\bconst\s+escapeHtml\s*=\s*\(/, 'local escapeHtml copy (import from workers/lib/http.js or shell.js)'],
  [/\bfunction\s+holdLines\s*\(|\bconst\s+holdLines\s*=\s*\(/, 'local holdLines copy (import from workers/lib/hold.js)'],
];

function fail(message) {
  console.error(`[check:workers] ${message}`);
  process.exit(1);
}

function run(args) {
  execFileSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
}

/** Test files relative to the repo, sorted, so the gate's command is stable. */
function testFiles(relDir) {
  return readdirSync(path.join(ROOT, relDir))
    .filter((name) => name.endsWith('.test.mjs'))
    .sort()
    .map((name) => path.join(relDir, name));
}

function parseJsonc(text) {
  return JSON.parse(text.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'));
}

function isIgnored(rel) {
  try {
    execFileSync('git', ['check-ignore', '-q', rel], { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    throw error;
  }
}

/** Collect all JS/MJS source files under unitDir/src and top-level carry*.mjs. */
async function unitSourceTexts(unitDir) {
  const texts = [];
  const srcDir = path.join(unitDir, 'src');
  if (existsSync(srcDir)) {
    for (const entry of await readdir(srcDir, { withFileTypes: true })) {
      if (entry.isFile() && /\.(?:js|mjs)$/.test(entry.name)) {
        const abs = path.join(srcDir, entry.name);
        texts.push({ rel: path.relative(ROOT, abs), text: await readFile(abs, 'utf8') });
      }
    }
  }
  for (const entry of await readdir(unitDir, { withFileTypes: true })) {
    if (entry.isFile() && /^carry.*\.mjs$/.test(entry.name)) {
      const abs = path.join(unitDir, entry.name);
      texts.push({ rel: path.relative(ROOT, abs), text: await readFile(abs, 'utf8') });
    }
  }
  return texts;
}

/**
 * Audit a unit's kinship with workers/lib/ and the peer kit:
 * - rejects local copies of shared workers/lib exports (escapeHtml, holdLines)
 * - verifies every carried workers/lib asset in assets/ matches workers/lib byte-for-byte
 * - returns a concise kinship summary of what the unit takes, copies, and keeps.
 */
async function auditUnitKinship(unit, libBytes) {
  const unitDir = path.join(ROOT, unit.dir);
  const sources = await unitSourceTexts(unitDir);
  const takes = new Set();
  const keeps = new Set();

  for (const { rel, text } of sources) {
    const isBrowserShared = existsSync(path.join(unitDir, 'assets', path.basename(rel)));
    if (isBrowserShared) keeps.add(`dual:${path.basename(rel)}`);
    for (const [pattern, reason] of FORBIDDEN_LOCAL_COPIES) {
      if (isBrowserShared && reason.includes('escapeHtml')) continue;
      if (pattern.test(text)) fail(`${unit.id} (${rel}): ${reason}`);
    }
    for (const match of text.matchAll(/from\s+['"](?:\.\.\/)+lib\/([a-z0-9-]+\.js)['"]/g)) {
      takes.add(match[1].replace(/\.js$/, ''));
    }
    if (/\bexport\s+const\s+BASE_SECURITY\b|\bconst\s+BASE_SECURITY\b/.test(text)) keeps.add('BASE_SECURITY');
    if (/\bexport\s+const\s+FAVICON\b|\bconst\s+FAVICON\b/.test(text)) keeps.add('FAVICON');
    if (/\bexport\s+function\s+layout\b|\bexport\s+function\s+page\b/.test(text)) keeps.add('layout');
  }

  const assetsDir = path.join(unitDir, 'assets');
  const copies = [];
  if (existsSync(assetsDir)) {
    for (const [libName, assetRel] of SHARED_ASSET_FILES) {
      const assetPath = path.join(assetsDir, assetRel);
      if (!existsSync(assetPath)) continue;
      const actual = await readFile(assetPath, 'utf8');
      if (actual !== libBytes.get(libName)) {
        fail(`${unit.id}: assets/${assetRel} drifted from workers/lib/${libName}`);
      }
      copies.push(libName.replace(/\.(?:js|css)$/, ''));
    }
    const peerDir = path.join(assetsDir, 'peer');
    if (existsSync(peerDir) && readdirSync(peerDir).some((n) => n.endsWith('.js'))) {
      copies.push('peer-kit');
    }
  }

  return {
    id: unit.id,
    takes: [...takes].sort(),
    copies: [...new Set(copies)],
    keeps: [...keeps].sort(),
  };
}

async function main() {
  const inventory = JSON.parse(await readFile(INVENTORY, 'utf8'));
  if (!Array.isArray(inventory.units) || inventory.units.length === 0) {
    fail('cluster.json needs units');
  }

  const gitignore = [
    await readFile(path.join(ROOT, '.gitignore'), 'utf8'),
    await readFile(path.join(WORKERS, '.gitignore'), 'utf8'),
  ].join('\n');
  if (!gitignore.includes('.dev.vars')) fail('.gitignore must ignore .dev.vars');
  if (!gitignore.includes('.wrangler')) fail('.gitignore must ignore .wrangler');
  if (!isIgnored('workers/wap-mom/.dev.vars')) fail('git does not ignore workers/wap-mom/.dev.vars');
  if (!isIgnored('workers/wap-mom/.wrangler/tmp')) fail('git does not ignore workers/.wrangler');

  const dirs = (await readdir(WORKERS, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const listed = new Set(inventory.units.map((unit) => path.basename(unit.dir)));
  for (const dir of dirs) {
    try {
      await readFile(path.join(WORKERS, dir, 'wrangler.jsonc'));
    } catch {
      continue;
    }
    if (!listed.has(dir)) fail(`${dir} has wrangler.jsonc but is missing from cluster.json`);
  }

  const seenHosts = new Set();
  const servingCount = {};
  for (const unit of inventory.units) {
    const dir = path.join(ROOT, unit.dir);
    const wranglerPath = path.join(dir, 'wrangler.jsonc');
    const srcPath = path.join(dir, 'src', 'index.js');
    let wrangler;
    try {
      wrangler = parseJsonc(await readFile(wranglerPath, 'utf8'));
    } catch (error) {
      fail(`${unit.id}: wrangler.jsonc ${error.message}`);
    }
    if (wrangler.name !== unit.script) {
      fail(`${unit.id}: wrangler name ${wrangler.name} !== script ${unit.script}`);
    }
    // A unit may be files only (no main): a held name carried into its own assets, never running a script.
    const source = wrangler.main ? await readFile(srcPath, 'utf8') : '';
    if (wrangler.main) execFileSync(process.execPath, ['--check', srcPath], { stdio: 'pipe' });
    else if (!wrangler.assets?.directory) fail(`${unit.id}: no main and no assets directory`);
    // Its serving tier (cluster.json serving), held to its wrangler config.
    const tier = inventory.serving?.tiers?.[unit.id];
    const first = wrangler.assets?.run_worker_first;
    if (!tier) fail(`${unit.id}: no serving tier in cluster.json`);
    else if (tier.now === 'files') {
      if (!wrangler.assets) fail(`${unit.id}: tier files without assets`);
      if (JSON.stringify(first ?? null) !== JSON.stringify(tier.script ?? null)) fail(`${unit.id}: run_worker_first ${JSON.stringify(first)} is not its declared script exceptions ${JSON.stringify(tier.script ?? null)}`);
    } else if (tier.now === 'mixed') {
      if (!wrangler.assets || first?.[0] !== '/*') fail(`${unit.id}: tier mixed wants assets with run_worker_first led by "/*"`);
    } else if (tier.now === 'script') {
      if (wrangler.assets) fail(`${unit.id}: tier script but it has assets; declare files or mixed`);
    } else fail(`${unit.id}: unknown tier ${tier.now}`);
    servingCount[tier?.now] = (servingCount[tier?.now] ?? 0) + 1;
    if (/CABINET_KEY\s*=\s*['"][^'"]+['"]/.test(source)) {
      fail(`${unit.id}: secret assignment in source`);
    }
    if (unit.id === 'wap-mom') {
      for (const [pattern, label] of BANNED) {
        if (pattern.test(source)) fail(`${unit.id}: ${label}`);
      }
    }
    for (const host of unit.hosts || []) {
      if (seenHosts.has(host)) fail(`host listed twice: ${host}`);
      seenHosts.add(host);
    }
  }

  // Carried pages and the peer kit are copies. They fail in a second, before a suite.
  run(['scripts/build-peer-kit.mjs', '--check']);
  // Specimens are carried from site modules that import by root path, so the check uses the repo's loader.
  const carried = [
    ['--import', './scripts/tests/register-public-imports.mjs', 'workers/spw-quest/carry-specimens.mjs', '--check'],
    ['--import', './scripts/tests/register-public-imports.mjs', 'workers/spw-quest/carry-shelf.mjs', '--check'],
    // The guide's examples' paths and the panels' edges, against a fresh reading of examples.js and steps.js.
    ['workers/spw-quest/carry-readings.mjs', '--check'],
    // /arcs/ against its carried season. The season moves with history; carry-arcs.mjs refreshes it.
    ['--import', './scripts/tests/register-public-imports.mjs', 'workers/spw-quest/carry-arcs.mjs', '--check'],
    // llms.txt, init, quest.json and the other constant answers, against what the worker answers.
    ['--import', './scripts/tests/register-public-imports.mjs', 'workers/spw-quest/carry-answers.mjs', '--check'],
    // The guide's front page, against what the worker renders for / with no query.
    ['--import', './scripts/tests/register-public-imports.mjs', 'workers/spw-quest/carry-guide.mjs', '--check'],
    // /pivot, /specimens, /physics and /constructs, against the no-query page.
    ['--import', './scripts/tests/register-public-imports.mjs', 'workers/spw-quest/carry-rooms.mjs', '--check'],
    ['workers/factshift-center/carry-shell.mjs', '--check'],
    // wap.mom's printed pages, against what its worker prints.
    ['workers/wap-mom/carry-pages.mjs', '--check'],
    // texture.website's materials and readings, against its data and the sidecars.
    ['workers/texture-website/carry.mjs', '--check'],
    // attention.productions' page, composer and host files, against its vocabulary and texture.website's materials.
    ['workers/attention-productions/carry.mjs', '--check'],
    // mutex.buzz's lock, pages, schedule and folios, against src/lock.js, lock.spw and the site's images.
    ['workers/mutex-buzz/carry.mjs', '--check'],
    // tealstripesvibes.com's shell, seeds, app files and icons, against src/vibe.js.
    ['workers/tealstripesvibes/carry.mjs', '--check'],
    // Each held name's door, as the file worker that answers its apex.
    ['workers/site-hub-next/carry-doors.mjs', '--check'],
  ];
  for (const args of carried) run(args);

  // Verify shared workers/lib/ kinship and byte-for-byte asset copies across all units.
  const libBytes = new Map();
  for (const [libName] of SHARED_ASSET_FILES) {
    libBytes.set(libName, await readFile(path.join(LIB, libName), 'utf8'));
  }
  const kinshipRows = [];
  let doorCount = 0;
  for (const unit of inventory.units) {
    const kinship = await auditUnitKinship(unit, libBytes);
    if (!kinship.takes.length && !kinship.copies.length && !kinship.keeps.length) {
      doorCount += 1;
      continue;
    }
    const parts = [];
    if (kinship.takes.length) parts.push(`takes ${kinship.takes.join(', ')}`);
    if (kinship.copies.length) parts.push(`copies ${kinship.copies.join(', ')}`);
    if (kinship.keeps.length) parts.push(`keeps ${kinship.keeps.join(', ')}`);
    kinshipRows.push(`  ${kinship.id.padEnd(22)} ${parts.join(' · ')}`);
  }
  if (doorCount > 0) {
    kinshipRows.push(`  ${`doors (${doorCount})`.padEnd(22)} carried by site-hub-next/carry-doors.mjs (http, carry)`);
  }

  for (const dir of ['workers/autonomous-feedback/test', 'workers/spw-quest/test', 'workers/site-hub-next/test', 'workers/factshift-center/test', 'workers/smut-today/test', 'workers/wap-mom/test', 'workers/texture-website/test', 'workers/attention-productions/test', 'workers/mutex-buzz/test', 'workers/tealstripesvibes/test']) {
    run(['--test', ...testFiles(dir)]);
  }
  const serving = ['files', 'mixed', 'script'].map((tier) => `${servingCount[tier] ?? 0} ${tier}`).join(', ');
  console.log(`[check:workers] kinship:\n${kinshipRows.join('\n')}`);
  console.log(`[check:workers] ${inventory.units.length} units, ${seenHosts.size} hosts (${serving}); quest and feedback routing verified`);
}

await main();
