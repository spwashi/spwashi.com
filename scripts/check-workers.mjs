/**
 * Cluster gate for workers/: inventory, syntax, gitignore, no secrets in source.
 * Drift in a carried page fails before any suite. Every *.test.mjs under a
 * worker's test/ is run, so a new file is in the gate without being listed.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORKERS = path.join(ROOT, 'workers');
const INVENTORY = path.join(WORKERS, 'cluster.json');
const BANNED = [
  [/wet\s+ass\s+pussy/i, 'banned expansion'],
  [/pussy/i, 'banned lemma'],
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
    // /arcs/ against its carried season. The season moves with history; carry-arcs.mjs refreshes it.
    ['--import', './scripts/tests/register-public-imports.mjs', 'workers/spw-quest/carry-arcs.mjs', '--check'],
    // llms.txt, init, quest.json and the other constant answers, against what the worker answers.
    ['--import', './scripts/tests/register-public-imports.mjs', 'workers/spw-quest/carry-answers.mjs', '--check'],
    ['workers/factshift-center/carry-shell.mjs', '--check'],
    // wap.mom's printed pages, against what its worker prints.
    ['workers/wap-mom/carry-pages.mjs', '--check'],
    // texture.website's materials and readings, against its data and the sidecars.
    ['workers/texture-website/carry.mjs', '--check'],
  ];
  for (const args of carried) run(args);

  for (const dir of ['workers/autonomous-feedback/test', 'workers/spw-quest/test', 'workers/site-hub-next/test', 'workers/factshift-center/test', 'workers/wap-mom/test', 'workers/texture-website/test']) {
    run(['--test', ...testFiles(dir)]);
  }
  const serving = ['files', 'mixed', 'script'].map((tier) => `${servingCount[tier] ?? 0} ${tier}`).join(', ');
  console.log(`[check:workers] ${inventory.units.length} units, ${seenHosts.size} hosts (${serving}); quest and feedback routing verified`);
}

await main();
