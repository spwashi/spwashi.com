import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/index.js';
import { PARSER_JS } from '../src/parser-text.js';
import { BASE_SECURITY, escapeHtml } from '../../lib/shell.js';
import { CarryError, DEFAULT_ASSETS, carryRelease, checkAssets } from '../carry-parser-release.mjs';

const SCRIPT = fileURLToPath(new URL('../carry-parser-release.mjs', import.meta.url));
const ROOT = mkdtempSync(path.join(tmpdir(), 'spw-quest-parser-'));
test.after(() => rmSync(ROOT, { recursive: true, force: true }));

const REV_A = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const REV_B = 'b1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const IMMUTABLE = 'public, max-age=31536000, immutable';
const SHORT = 'public, max-age=300';
const digest = (algorithm, bytes, encoding) => createHash(algorithm).update(bytes).digest(encoding);
let dirs = 0;
const freshDir = (name) => {
  const dir = path.join(ROOT, `${name}-${++dirs}`);
  mkdirSync(dir, { recursive: true });
  return dir;
};

/**
 * A release shaped like the workbench's npm run bundle:parser output: full and lite in min and
 * debug forms, a map beside each debug form, the alias <offset>.js, and manifest.json last.
 */
function writeRelease(root, { release = '2026.10.13', offset = '00', revision = REV_A, dirty = false } = {}) {
  const dir = path.join(root, release);
  const files = [];
  const put = (rel, text, entry) => {
    const bytes = Buffer.from(text);
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    writeFileSync(path.join(dir, rel), bytes);
    files.push({ path: rel, ...entry, bytes: bytes.length, sha256: digest('sha256', bytes, 'hex'), integrity: `sha384-${digest('sha384', bytes, 'base64')}` });
  };
  let defaultText = '';
  for (const variant of ['full', 'lite']) {
    for (const form of ['min', 'debug']) {
      const stamp = JSON.stringify({ commit: revision.slice(0, 12), release, offset, variant, form });
      const body = variant === 'full' ? 'export const parse=(source)=>({source});' : 'export const scan=(source)=>[...source];';
      const text = `${body}export const SPW_PARSER_BUILD=Object.freeze(${stamp});\n`;
      const scriptPath = `${variant}/${offset}.${form}.js`;
      put(scriptPath, form === 'debug' ? `${text}//# sourceMappingURL=${offset}.debug.js.map\n` : text, { variant, form });
      if (form === 'debug') put(`${scriptPath}.map`, JSON.stringify({ version: 3, sources: [`packages/spw-seed/src/${variant}.ts`], mappings: '' }), { variant, form: 'debug', kind: 'map' });
      if (variant === 'full' && form === 'min') defaultText = text;
    }
  }
  put(`${offset}.js`, defaultText, { alias: `full/${offset}.min.js` });
  const manifest = {
    schema: 'spw.parser-release/1', release, offset, ...(dirty ? { dirty: true } : {}),
    workbench: { package: 'spw-workbench', version: '0.3.0', revision },
    grammar: '0.3.0',
    default: { variant: 'full', form: 'min', path: `full/${offset}.min.js` },
    files,
  };
  writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { dir, manifest };
}

/** An in-memory ASSETS binding holding every file under an assets directory, keyed by URL path. */
function assetsFrom(assetsDir) {
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

const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

/** Two releases carried into a fresh assets directory, and the worker env that serves them. */
async function carriedPair() {
  const workbench = freshDir('workbench');
  const assets = freshDir('assets');
  const first = writeRelease(workbench, { release: '2026.10.13', revision: REV_A });
  const second = writeRelease(workbench, { release: '2026.10.14', revision: REV_B });
  await carryRelease(first.dir, assets);
  await carryRelease(second.dir, assets);
  return { workbench, assets, first, second, env: { ASSETS: assetsFrom(assets) } };
}

const get = (pathname, { env, ...options } = {}) => worker.fetch(new Request(`https://spw.quest${pathname}`, options), env);

test('carry copies a verified release, writes the index newest first, and is a no-op the second time', async () => {
  const workbench = freshDir('workbench');
  const assets = freshDir('assets');
  const first = writeRelease(workbench, { release: '2026.10.13' });
  const result = await carryRelease(first.dir, assets);
  assert.equal(result.release, '2026.10.13');
  assert.equal(result.copied.at(-1), 'manifest.json', 'the manifest lands last');
  assert.deepEqual([...result.copied].sort(), ['manifest.json', ...first.manifest.files.map((file) => file.path)].sort());
  for (const file of first.manifest.files) {
    assert.ok(readFileSync(path.join(assets, 'parser/2026.10.13', file.path)).equals(readFileSync(path.join(first.dir, file.path))), file.path);
  }
  const second = writeRelease(workbench, { release: '2026.10.14', revision: REV_B });
  await carryRelease(second.dir, assets);
  const index = JSON.parse(readFileSync(path.join(assets, 'parser/index.json'), 'utf8'));
  assert.equal(index.schema, 'spw.parser-index/1');
  assert.deepEqual(index.releases, [
    { release: '2026.10.14', offset: '00', revision: REV_B, default: { variant: 'full', form: 'min', path: 'full/00.min.js' } },
    { release: '2026.10.13', offset: '00', revision: REV_A, default: { variant: 'full', form: 'min', path: 'full/00.min.js' } },
  ]);
  assert.deepEqual((await checkAssets(assets)).problems, []);
  assert.deepEqual((await carryRelease(first.dir, assets)).copied, [], 'the same bytes again copy nothing');
  const check = run('--check', '--assets', assets);
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /2 release\(s\) in assets match their manifests/);
});

test('carry refuses a tampered file, an alias that is not the default, and a dirty cut', async () => {
  const assets = freshDir('assets');
  const tampered = writeRelease(freshDir('workbench'));
  appendFileSync(path.join(tampered.dir, 'full/00.min.js'), '/* changed */');
  await assert.rejects(carryRelease(tampered.dir, assets), (error) => {
    assert.ok(error instanceof CarryError);
    assert.ok(error.problems.some((problem) => /^full\/00\.min\.js: \d+ bytes, the manifest says \d+$/.test(problem)), error.problems.join('\n'));
    assert.ok(error.problems.includes('full/00.min.js: sha256 differs from the manifest'));
    assert.ok(error.problems.includes('00.js: not the same bytes as the default full/00.min.js'));
    return true;
  });
  assert.equal(existsSync(path.join(assets, 'parser/2026.10.13')), false, 'nothing is copied');
  const cli = run(tampered.dir, '--assets', assets);
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /full\/00\.min\.js: sha256 differs from the manifest/);

  // The alias is rewritten, and its own manifest entry with it: the hashes hold, the alias does not.
  const drifted = writeRelease(freshDir('workbench'));
  const bytes = Buffer.from('export const parse = () => null;\n');
  writeFileSync(path.join(drifted.dir, '00.js'), bytes);
  const entry = drifted.manifest.files.find((file) => file.path === '00.js');
  Object.assign(entry, { bytes: bytes.length, sha256: digest('sha256', bytes, 'hex'), integrity: `sha384-${digest('sha384', bytes, 'base64')}` });
  writeFileSync(path.join(drifted.dir, 'manifest.json'), JSON.stringify(drifted.manifest, null, 2));
  await assert.rejects(carryRelease(drifted.dir, assets), (error) => error.problems.join('\n') === '00.js: not the same bytes as the default full/00.min.js');

  const dirty = writeRelease(freshDir('workbench'), { dirty: true });
  await assert.rejects(carryRelease(dirty.dir, assets), /uncommitted changes/);
  assert.equal((await carryRelease(dirty.dir, assets, { allowDirty: true })).release, '2026.10.13');
});

test('a carried release never takes different bytes; a re-cut moves forward and keeps the old offset', async () => {
  const assets = freshDir('assets');
  const original = writeRelease(freshDir('workbench'), { revision: REV_A });
  await carryRelease(original.dir, assets);
  const rewritten = writeRelease(freshDir('workbench'), { revision: REV_B });
  await assert.rejects(carryRelease(rewritten.dir, assets), (error) => {
    assert.match(error.message, /already holds different bytes/);
    assert.ok(error.problems.includes('full/00.min.js') && error.problems.includes('manifest.json'), error.problems.join(', '));
    return true;
  });
  assert.equal(readFileSync(path.join(assets, 'parser/2026.10.13/full/00.min.js'), 'utf8'), readFileSync(path.join(original.dir, 'full/00.min.js'), 'utf8'));

  // The workbench re-cuts the same day at offset 01, in the same folder: 00 stays, the manifest moves to 01.
  const recut = writeRelease(path.dirname(original.dir), { offset: '01', revision: REV_B });
  const result = await carryRelease(recut.dir, assets);
  assert.ok(result.copied.includes('01.js') && result.copied.includes('full/01.min.js'));
  assert.ok(result.skipped.includes('full/00.min.js'), 'the old offset is not in the new manifest');
  assert.ok(existsSync(path.join(assets, 'parser/2026.10.13/00.js')), 'the old offset stays');
  assert.equal(JSON.parse(readFileSync(path.join(assets, 'parser/index.json'), 'utf8')).releases[0].offset, '01');
  assert.deepEqual((await checkAssets(assets)).problems, []);
  const back = writeRelease(freshDir('workbench'), { offset: '00', revision: REV_A });
  await assert.rejects(carryRelease(back.dir, assets), /never moves back to 00/);
});

test('--check fails on a file tampered with in assets, and on an index that drifted', async () => {
  const { assets } = await carriedPair();
  appendFileSync(path.join(assets, 'parser/2026.10.13/lite/00.min.js'), ' ');
  writeFileSync(path.join(assets, 'parser/2026.10.13/stray.js'), '');
  const check = run('--check', '--assets', assets);
  assert.equal(check.status, 1);
  assert.match(check.stderr, /parser\/2026\.10\.13\/lite\/00\.min\.js: sha256 differs from the manifest/);
  assert.match(check.stderr, /parser\/2026\.10\.13\/stray\.js: not in the manifest, and not an older offset/);
  writeFileSync(path.join(assets, 'parser/index.json'), '{"schema":"spw.parser-index/1","releases":[]}\n');
  assert.ok((await checkAssets(assets)).problems.some((problem) => /index\.json does not list the releases/.test(problem)));
});

test('the assets in the tree verify against their manifests and the index', async () => {
  assert.deepEqual((await checkAssets(DEFAULT_ASSETS)).problems, []);
});

test('/parser/ lists releases newest first; /parser/index.json is the index, short-cached and open to any origin', async () => {
  const { env } = await carriedPair();
  const page = await get('/parser/', { env });
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /^text\/html/);
  assert.equal(page.headers.get('content-security-policy'), BASE_SECURITY['Content-Security-Policy']);
  const html = await page.text();
  assert.ok(html.indexOf('href="/parser/2026.10.14/"') < html.indexOf('href="/parser/2026.10.13/"'), 'newest first');
  assert.ok(html.includes('href="/parser/2026.10.13/00.js"'));
  assert.ok(html.includes('href="/parser/index.json"') && html.includes('href="/parser/latest.js"'));
  assert.ok(html.includes(REV_A.slice(0, 12)));
  const index = await get('/parser/index.json', { env });
  assert.equal(index.status, 200);
  assert.match(index.headers.get('content-type'), /^application\/json/);
  assert.equal(index.headers.get('access-control-allow-origin'), '*');
  assert.equal(index.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.equal(index.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(index.headers.get('cache-control'), SHORT);
  assert.deepEqual((await index.json()).releases.map((entry) => entry.release), ['2026.10.14', '2026.10.13']);
});

test('a release page names every file with its variant, form, bytes, integrity, an import and a script tag', async () => {
  const { env, first } = await carriedPair();
  const response = await get('/parser/2026.10.13/', { env });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), SHORT);
  const html = await response.text();
  assert.ok(html.includes(`<code>${REV_A}</code>`), 'the workbench revision');
  assert.ok(html.includes(`href="https://github.com/spwashi/spw-workbench/commit/${REV_A}"`));
  for (const file of first.manifest.files) {
    const section = html.match(new RegExp(`<section class="file" id="file-${file.path.replace(/[^A-Za-z0-9]+/g, '-')}"[\\s\\S]*?</section>`))?.[0];
    assert.ok(section, file.path);
    const variant = file.variant ?? 'full';
    const form = file.form ?? 'min';
    assert.ok(section.includes(`<dt>Variant</dt><dd>${variant}</dd>`) && section.includes(`<dt>Form</dt><dd>${form}</dd>`), file.path);
    assert.ok(section.includes(`<dt>Bytes</dt><dd>${file.bytes.toLocaleString('en-US')}</dd>`), file.path);
    assert.ok(section.includes(`<code>${file.integrity}</code>`), file.path);
    const url = `https://spw.quest/parser/2026.10.13/${file.path}`;
    if (file.path.endsWith('.js')) {
      assert.ok(section.includes(escapeHtml(`import { ${variant === 'full' ? 'parse' : 'scan'} } from "${url}";`)), `${file.path} import`);
      assert.ok(section.includes(escapeHtml(`<script type="module" src="${url}" integrity="${file.integrity}" crossorigin="anonymous"></script>`)), `${file.path} script tag`);
    } else {
      assert.doesNotMatch(section, /<pre id="(import|script)-/, `${file.path} is not a script`);
    }
  }
  assert.match(html, /<section class="file" id="file-00-js"[\s\S]*?<dt>Same bytes as<\/dt><dd><a href="full\/00\.min\.js">/);
});

test('release files: JavaScript or JSON, open to any origin, immutable; the manifest stays short-cached', async () => {
  const { env, first } = await carriedPair();
  for (const file of [...first.manifest.files.map((entry) => entry.path)]) {
    const response = await get(`/parser/2026.10.13/${file}`, { env });
    assert.equal(response.status, 200, file);
    assert.equal(response.headers.get('content-type'), file.endsWith('.map') ? 'application/json; charset=UTF-8' : 'text/javascript; charset=UTF-8', file);
    assert.equal(response.headers.get('access-control-allow-origin'), '*', file);
    assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin', file);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff', file);
    assert.equal(response.headers.get('cache-control'), IMMUTABLE, file);
    assert.ok(response.headers.get('etag'), file);
    assert.ok(Buffer.from(await response.arrayBuffer()).equals(readFileSync(path.join(first.dir, file))), file);
  }
  const manifest = await get('/parser/2026.10.13/manifest.json', { env });
  assert.equal(manifest.headers.get('content-type'), 'application/json; charset=UTF-8');
  assert.equal(manifest.headers.get('access-control-allow-origin'), '*');
  assert.equal(manifest.headers.get('cache-control'), SHORT, 'a re-cut moves the manifest to a newer offset');
  assert.equal((await manifest.json()).release, '2026.10.13');
});

test('/parser/latest.js redirects to the newest alias for five minutes', async () => {
  const { env } = await carriedPair();
  const response = await get('/parser/latest.js', { env });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/parser/2026.10.14/00.js');
  assert.equal(response.headers.get('cache-control'), SHORT);
  assert.equal(response.headers.get('access-control-allow-origin'), '*', 'a cross-origin import follows the redirect');
  assert.equal((await get('/parser/latest.js')).status, 404, 'no assets, no latest');
});

test('unknown paths under /parser/ list what exists, as text or as JSON', async () => {
  const { env } = await carriedPair();
  const text = await get('/parser/nothing-here', { env });
  assert.equal(text.status, 404);
  assert.match(text.headers.get('content-type'), /^text\/plain/);
  const body = await text.text();
  assert.match(body, /^Not found: \/parser\/nothing-here\n/);
  for (const known of ['/parser/', '/parser/index.json', '/parser/latest.js', '/parser/2026.10.14/', '/parser/2026.10.13/manifest.json']) {
    assert.ok(body.split('\n').includes(known), known);
  }
  const json = await get('/parser/2026.10.13/full/99.min.js', { env, headers: { accept: 'application/json' } });
  assert.equal(json.status, 404);
  assert.match(json.headers.get('content-type'), /^application\/json/);
  const listing = await json.json();
  assert.equal(listing.path, '/parser/2026.10.13/full/99.min.js');
  assert.ok(listing.paths.includes('/parser/2026.10.13/full/00.min.js') && listing.paths.includes('/parser/2026.10.13/lite/00.debug.js.map'), 'the release asked about lists its files');
  assert.ok(!listing.paths.includes('/parser/2026.10.14/full/00.min.js'), 'other releases list only their pages');
  for (const missing of ['/parser/2027.01.01/', '/parser/2026.10.13/full/', '/parser/2026.10.13/.hidden', '/parser/2026.10.13/full/a/b.js']) {
    assert.equal((await get(missing, { env })).status, 404, missing);
  }
  assert.equal((await get('/parser', { env })).headers.get('location'), '/parser/');
  assert.equal((await get('/parser/2026.10.13', { env })).headers.get('location'), '/parser/2026.10.13/');
});

test('HEAD answers every parser route without a body; other methods are refused', async () => {
  const { env } = await carriedPair();
  for (const pathname of ['/parser/', '/parser/index.json', '/parser/latest.js', '/parser/2026.10.13/', '/parser/2026.10.13/manifest.json', '/parser/2026.10.13/00.js', '/parser/2026.10.13/full/00.debug.js.map', '/parser/missing']) {
    const [full, head] = [await get(pathname, { env }), await get(pathname, { env, method: 'HEAD' })];
    assert.equal(head.status, full.status, pathname);
    assert.equal(await head.text(), '', pathname);
    for (const name of ['content-type', 'cache-control', 'access-control-allow-origin', 'location']) {
      assert.equal(head.headers.get(name), full.headers.get(name), `${pathname} ${name}`);
    }
  }
  const post = await get('/parser/2026.10.13/00.js', { env, method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});

test('with no releases carried, /parser/ says so; /parser.js and the other routes are unchanged', async () => {
  const empty = { ASSETS: assetsFrom(freshDir('assets')) };
  const html = await (await get('/parser/', { env: empty })).text();
  assert.match(html, /No release has been carried here yet\./);
  assert.match(await (await get('/parser/', {})).text(), /No release has been carried here yet\./, 'no binding at all');
  const { env } = await carriedPair();
  const bundle = await get('/parser.js', { env });
  assert.equal(await bundle.text(), PARSER_JS);
  assert.equal(bundle.headers.get('cache-control'), 'public, max-age=3600');
  assert.equal(bundle.headers.get('access-control-allow-origin'), null);
  assert.equal((await get('/', { env })).headers.get('content-security-policy'),
    BASE_SECURITY['Content-Security-Policy'].replace("script-src 'unsafe-inline'", "script-src 'self' 'unsafe-inline'"));
  assert.equal((await get('/install', { env })).headers.get('content-security-policy'), BASE_SECURITY['Content-Security-Policy']);
  assert.equal(await (await get('/missing', { env })).text(), 'Not found');
});
