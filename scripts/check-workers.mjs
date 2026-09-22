/**
 * Cluster gate for workers/: inventory, syntax, gitignore, no secrets in source.
 */
import { execFileSync } from 'node:child_process';
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
    const source = await readFile(srcPath, 'utf8');
    execFileSync(process.execPath, ['--check', srcPath], { stdio: 'pipe' });
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

  execFileSync(process.execPath, ['--test', 'workers/autonomous-feedback/test/routes.test.mjs'], { cwd: ROOT, stdio: 'inherit' });
  execFileSync(process.execPath, ['--test', 'workers/spw-quest/test/routes.test.mjs'], { cwd: ROOT, stdio: 'inherit' });
  console.log(`[check:workers] ${inventory.units.length} units, ${seenHosts.size} hosts; quest and feedback routing verified`);
}

await main();
