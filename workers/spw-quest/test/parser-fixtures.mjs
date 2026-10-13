// Fixtures shared by the parser release and prerelease tests: a scratch root, a cut shaped like
// the workbench's npm run bundle:parser output, and an in-memory ASSETS binding.
import test from 'node:test';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/index.js';
import { readName } from '../src/parser-releases.js';

export const SCRIPT = fileURLToPath(new URL('../carry-parser-release.mjs', import.meta.url));
export const REV_A = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
export const REV_B = 'b1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
export const REV_C = 'c1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
export const IMMUTABLE = 'public, max-age=31536000, immutable';
export const SHORT = 'public, max-age=300';
export const MINUTE = 'public, max-age=60';
/** Every folder's files, in the order the workbench lists them. */
export const FILES = ['full.min.js', 'full.debug.js', 'full.debug.js.map', 'lite.min.js', 'lite.debug.js', 'lite.debug.js.map', 'parser.js'];
export const digest = (algorithm, bytes, encoding) => createHash(algorithm).update(bytes).digest(encoding);
const sums = (bytes) => ({ bytes: bytes.length, sha256: digest('sha256', bytes, 'hex'), integrity: `sha384-${digest('sha384', bytes, 'base64')}` });

/** A scratch root removed after the file's tests; the function it returns hands out one new folder per call. */
export function scratch(prefix) {
  const root = mkdtempSync(path.join(tmpdir(), prefix));
  test.after(() => rmSync(root, { recursive: true, force: true }));
  let dirs = 0;
  return (name) => {
    const dir = path.join(root, `${name}-${++dirs}`);
    mkdirSync(dir, { recursive: true });
    return dir;
  };
}

/**
 * A cut shaped like the workbench's npm run bundle:parser output, at <root>/<name>/: full and lite
 * in min and debug forms, a map beside each debug form, parser.js (the bytes of full.min.js), and
 * manifest.json (spw.parser-release/2) last. The name says the kind: YYYY.MM.DD, -pre.N or -patch.N.
 */
export function writeRelease(root, { name = '2026.10.13', revision = REV_A, dirty = false } = {}) {
  const { kind, day, pre, patch } = readName(name);
  const dir = path.join(root, name);
  mkdirSync(dir, { recursive: true });
  const files = [];
  const put = (rel, text, entry) => {
    const bytes = Buffer.from(text);
    writeFileSync(path.join(dir, rel), bytes);
    files.push({ path: rel, ...entry, ...sums(bytes) });
  };
  const flags = { ...(dirty ? { dirty: true } : {}), ...(pre ? { prerelease: true } : {}), ...(patch ? { patch: true } : {}) };
  let defaultText = '';
  for (const variant of ['full', 'lite']) {
    for (const form of ['min', 'debug']) {
      const stamp = JSON.stringify({ package: 'spw-workbench', version: '0.3.0', commit: revision.slice(0, 12), source: `packages/spw-seed/src/${variant}.ts`, release: name, variant, form, ...flags });
      const body = variant === 'full' ? 'export const parse=(source)=>({source});' : 'export const scan=(source)=>[...source];';
      const text = `${body}export const SPW_PARSER_BUILD=Object.freeze(${stamp});\n`;
      put(`${variant}.${form}.js`, form === 'debug' ? `${text}//# sourceMappingURL=${variant}.debug.js.map\n` : text, { variant, form });
      if (form === 'debug') put(`${variant}.debug.js.map`, JSON.stringify({ version: 3, sources: [`packages/spw-seed/src/${variant}.ts`], mappings: '' }), { variant, form: 'debug', kind: 'map' });
      if (variant === 'full' && form === 'min') defaultText = text;
    }
  }
  // As the workbench writes it: the alias names its target and takes that file's variant and form.
  put('parser.js', defaultText, { alias: 'full.min.js' });
  const manifest = {
    schema: 'spw.parser-release/2', name, kind, day, ...(pre ? { pre } : {}), ...(patch ? { patch } : {}), ...(dirty ? { dirty: true } : {}),
    workbench: { package: 'spw-workbench', version: '0.3.0', revision },
    grammar: '0.3.0',
    default: { variant: 'full', form: 'min', path: 'parser.js' },
    files,
  };
  writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { dir, manifest };
}

/** Rewrite one file of a cut and its manifest entry together: the hashes hold, whatever else the file breaks. */
export function rewriteListed(cut, rel, text) {
  const bytes = Buffer.from(text);
  writeFileSync(path.join(cut.dir, rel), bytes);
  Object.assign(cut.manifest.files.find((file) => file.path === rel), sums(bytes));
  writeFileSync(path.join(cut.dir, 'manifest.json'), JSON.stringify(cut.manifest, null, 2));
}

/** Rewrite a cut's manifest by hand. */
export function editManifest(cut, change) {
  change(cut.manifest);
  writeFileSync(path.join(cut.dir, 'manifest.json'), JSON.stringify(cut.manifest, null, 2));
  return cut;
}

/** An in-memory ASSETS binding holding every file under an assets directory, keyed by URL path. */
export function assetsFrom(assetsDir) {
  const files = new Map();
  const walk = (rel) => {
    for (const entry of readdirSync(path.join(assetsDir, rel), { withFileTypes: true })) {
      const next = path.posix.join(rel, entry.name);
      if (entry.isDirectory()) walk(next);
      else files.set(`/${next}`, readFileSync(path.join(assetsDir, next)));
    }
  };
  walk('');
  return {
    files,
    async fetch(request) {
      const body = files.get(new URL(request.url).pathname);
      if (!body) return new Response('Not Found', { status: 404 });
      return new Response(body, { headers: { 'Content-Type': 'application/octet-stream', ETag: `"${digest('sha256', body, 'hex').slice(0, 16)}"` } });
    },
  };
}

export const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
export const get = (pathname, { env, ...options } = {}) => worker.fetch(new Request(`https://spw.quest${pathname}`, options), env);
