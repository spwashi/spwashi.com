/**
 * Compile step shared by `build` and `check:local`.
 *
 * Root typecheck, scripts emit, and runtime emit read disjoint inputs and
 * write disjoint outputs, so they run concurrently. public-sources is a
 * noEmit strict check of the same public/ts files against imported JS
 * types; it does not write, so it can join the wave.
 * `fix-typed-imports` rewrites kernel specifiers in public/js/typed and so
 * waits on the runtime pass only.
 *
 * Unchanged passes are skipped by hashing their authored inputs against a
 * stamp under .tmp/tsc/. CSS starts as soon as build:tools is green so it
 * overlaps the remaining typechecks instead of waiting for the whole wave.
 *
 * Pass --serial to run one pass at a time when isolating a compile failure.
 * Pass --with-css to run css-build after tools (overlapped unless --serial).
 * Pass --force or set SPW_TSC_FORCE=1 to ignore stamps.
 */
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAMP_DIR = path.join(ROOT, '.tmp', 'tsc');

const SKIP_DIR_PREFIXES = [
  'public/js/typed/',
  'public/js/generated/',
  'public/css/bundles/',
];

const PASSES = [
  {
    name: 'typecheck:root',
    args: ['--noEmit'],
    inputs: ['tsconfig.json', 'vite.config.ts', 'scripts/template.d.mts', 'types'],
  },
  {
    name: 'build:tools',
    args: ['-p', 'tsconfig.scripts.json'],
    inputs: ['tsconfig.json', 'tsconfig.scripts.json', 'scripts/ts', 'types'],
    sentinel: 'scripts/typed/css-build.mjs',
  },
  {
    name: 'build:runtime',
    args: ['-p', 'tsconfig.runtime.json'],
    then: 'fix-typed-imports',
    inputs: ['tsconfig.json', 'tsconfig.runtime.json', 'public/ts', 'types'],
    sentinel: 'public/js/typed',
  },
  {
    name: 'typecheck:public-sources',
    args: ['-p', 'tsconfig.public-sources.json'],
    inputs: ['tsconfig.json', 'tsconfig.public-sources.json', 'public/ts', 'types', 'public/js'],
  },
];

const CSS_BUILD = {
  name: 'css-build',
  script: 'scripts/css-build.mjs',
  inputs: [
    'postcss.config.mjs',
    'src/styles',
    'public/css',
    'scripts/ts/css-build.mts',
    'scripts/ts/css-bundle.mts',
    'scripts/ts/css-manifest.mts',
    'scripts/ts/css-scopes.mts',
  ],
  sentinel: 'public/css/bundles/core.css',
};

function posixRel(from, to) {
  return path.relative(from, to).split(path.sep).join('/');
}

function shouldSkipRel(rel) {
  if (!rel || rel.endsWith('.map') || rel.endsWith('.DS_Store')) return true;
  return SKIP_DIR_PREFIXES.some((prefix) => rel === prefix.slice(0, -1) || rel.startsWith(prefix));
}

async function collectFiles(relPath) {
  const abs = path.join(ROOT, relPath);
  let stat;
  try {
    stat = await fs.stat(abs);
  } catch {
    return [];
  }
  if (stat.isFile()) return shouldSkipRel(relPath) ? [] : [relPath];
  if (!stat.isDirectory()) return [];

  const files = [];
  const entries = await fs.readdir(abs, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const full = path.join(entry.parentPath || abs, entry.name);
    const rel = posixRel(ROOT, full);
    if (shouldSkipRel(rel)) continue;
    files.push(rel);
  }
  return files;
}

async function sentinelExists(rel) {
  if (!rel) return true;
  const abs = path.join(ROOT, rel);
  try {
    const stat = await fs.stat(abs);
    if (stat.isFile()) return true;
    if (stat.isDirectory()) {
      const entries = await fs.readdir(abs);
      return entries.length > 0;
    }
  } catch {
    return false;
  }
  return false;
}

async function typescriptVersion() {
  try {
    const raw = await fs.readFile(path.join(ROOT, 'node_modules/typescript/package.json'), 'utf8');
    return JSON.parse(raw).version || 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function fingerprintInputs(inputs, extra = '') {
  const files = [];
  for (const input of inputs) files.push(...await collectFiles(input));
  files.sort();
  const hash = createHash('sha256');
  hash.update(`typescript:${await typescriptVersion()}\n`);
  if (extra) hash.update(extra);
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(await fs.readFile(path.join(ROOT, file)));
    hash.update('\n');
  }
  return { hash: hash.digest('hex'), files };
}

function stampPath(name) {
  return path.join(STAMP_DIR, `${name}.stamp`);
}

async function readStamp(name) {
  try {
    return (await fs.readFile(stampPath(name), 'utf8')).trim();
  } catch {
    return '';
  }
}

async function writeStamp(name, hash) {
  await fs.mkdir(STAMP_DIR, { recursive: true });
  await fs.writeFile(stampPath(name), `${hash}\n`);
}

async function cachedFingerprint(spec, force) {
  const { hash } = await fingerprintInputs(spec.inputs, `name:${spec.name}\n`);
  if (force || !(await sentinelExists(spec.sentinel))) return { hash, cache: false };
  const previous = await readStamp(spec.name);
  return { hash, cache: previous === hash && Boolean(hash) };
}

/**
 * Spawn a command, buffering output so concurrent stages never interleave.
 * Resolves rather than rejects; callers decide what a non-zero status means.
 */
export function runCommand(command, args, label) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.once('error', (error) => resolve({ label, status: 1, output: String(error), ms: Date.now() - started }));
    child.once('close', (status) => resolve({ label, status: status ?? 1, output, ms: Date.now() - started }));
  });
}

/** Invoke tsc through its entry script; the .bin shim adds a process per pass. */
const runTsc = (args, label) => runCommand(process.execPath, ['node_modules/typescript/bin/tsc', ...args], label);

async function runPass(pass, { force = false } = {}) {
  const started = Date.now();
  const cached = await cachedFingerprint(pass, force);
  if (cached.cache) {
    return { label: pass.name, status: 0, output: '', ms: Date.now() - started, cache: true };
  }

  const result = await runTsc(pass.args, pass.name);
  if (result.status === 0 && pass.then) {
    const followUp = await runCommand(process.execPath, [`scripts/${pass.then}.mjs`], pass.then);
    if (followUp.status !== 0) return { ...followUp, ms: Date.now() - started, cache: false };
  }
  if (result.status === 0 && cached.hash) await writeStamp(pass.name, cached.hash);
  return { ...result, ms: Date.now() - started, cache: false };
}

async function runCssBuild({ force = false } = {}) {
  const started = Date.now();
  const cached = await cachedFingerprint(CSS_BUILD, force);
  if (cached.cache) {
    return { label: CSS_BUILD.name, status: 0, output: '', ms: Date.now() - started, cache: true };
  }
  const result = await runCommand(process.execPath, [CSS_BUILD.script, '--check', '--strict-budget'], CSS_BUILD.name);
  if (result.status === 0 && cached.hash) await writeStamp(CSS_BUILD.name, cached.hash);
  return { ...result, ms: Date.now() - started, cache: false };
}

export async function runCompile({ serial = false, withCss = false, force = false } = {}) {
  const options = { force };

  if (serial) {
    const compileResults = [];
    for (const pass of PASSES) compileResults.push(await runPass(pass, options));
    const cssResult = withCss ? await runCssBuild(options) : null;
    return { compileResults, cssResult };
  }

  if (!withCss) {
    const compileResults = await Promise.all(PASSES.map((pass) => runPass(pass, options)));
    return { compileResults, cssResult: null };
  }

  const toolsPass = PASSES.find((pass) => pass.name === 'build:tools');
  const otherPasses = PASSES.filter((pass) => pass.name !== 'build:tools');
  const byName = new Map();

  const toolsPromise = runPass(toolsPass, options).then((result) => {
    byName.set(result.label, result);
    return result;
  });
  const othersPromise = Promise.all(otherPasses.map((pass) => runPass(pass, options).then((result) => {
    byName.set(result.label, result);
    return result;
  })));

  const toolsResult = await toolsPromise;
  const cssPromise = toolsResult.status === 0
    ? runCssBuild(options)
    : Promise.resolve({
      label: CSS_BUILD.name,
      status: 1,
      output: '[css-build] skipped because build:tools failed\n',
      ms: 0,
      cache: false,
    });

  const [cssResult] = await Promise.all([cssPromise, othersPromise]);
  return {
    compileResults: PASSES.map((pass) => byName.get(pass.name)),
    cssResult,
  };
}

/** Print one line per stage plus any captured output; returns the failed stages. */
export function reportStages(prefix, results) {
  for (const { label, status, ms, output, cache } of results) {
    const cacheMark = cache ? ' cache' : '';
    console.log(`[${prefix}] ${label} ${status === 0 ? 'ok' : 'FAILED'} ${(ms / 1000).toFixed(2)}s${cacheMark}`);
    if (output && output.trim()) console.log(output.trimEnd());
  }
  return results.filter((result) => result.status !== 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const serial = process.argv.includes('--serial');
  const withCss = process.argv.includes('--with-css');
  const force = process.argv.includes('--force') || process.env.SPW_TSC_FORCE === '1';
  const { compileResults, cssResult } = await runCompile({ serial, withCss, force });
  const failed = [
    ...reportStages('compile', compileResults),
    ...(cssResult ? reportStages('css', [cssResult]) : []),
  ];
  if (failed.length) {
    console.log(`[compile] failed: ${failed.map((result) => result.label).join(', ')}`);
    process.exit(1);
  }
}
