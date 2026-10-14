import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PARSER_JS } from '../src/parser-text.js';
import { BASE_SECURITY, escapeHtml } from '../../lib/shell.js';
import { CarryError, DEFAULT_ASSETS, carryRelease, checkAssets } from '../carry-parser-release.mjs';
import { FILES, IMMUTABLE, REV_A, REV_B, REV_C, SHORT, assetsFrom, editManifest, get, rewriteListed, run, scratch, writeRelease } from './parser-fixtures.mjs';

const PAGE_CSP = BASE_SECURITY['Content-Security-Policy'].replace("style-src 'unsafe-inline';", "style-src 'unsafe-inline'; font-src 'self';");
const freshDir = scratch('spw-quest-parser-');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/** Two releases carried into a fresh assets directory, and the worker env that serves them. */
async function carriedPair() {
  const workbench = freshDir('workbench');
  const assets = freshDir('assets');
  const first = writeRelease(workbench, { name: '2026.10.13', revision: REV_A });
  const second = writeRelease(workbench, { name: '2026.10.14', revision: REV_B });
  await carryRelease(first.dir, assets);
  await carryRelease(second.dir, assets);
  return { workbench, assets, first, second, env: { ASSETS: assetsFrom(assets) } };
}

/** The message and problems of a cut the carry refuses. */
async function refusal(cut, assets = freshDir('assets'), options) {
  try {
    await carryRelease(cut.dir, assets, options);
  } catch (error) {
    assert.ok(error instanceof CarryError, error.message);
    return [error.message, ...error.problems].join('\n');
  }
  assert.fail(`${cut.dir} carried`);
}

test('carry copies a verified release into parser/<name>/, writes the index newest first, and is a no-op the second time', async () => {
  const workbench = freshDir('workbench');
  const assets = freshDir('assets');
  const first = writeRelease(workbench, { name: '2026.10.13' });
  const result = await carryRelease(first.dir, assets);
  assert.deepEqual([result.name, result.kind], ['2026.10.13', 'release']);
  assert.equal(result.copied.at(-1), 'manifest.json', 'the manifest lands last');
  assert.deepEqual([...result.copied].sort(), ['manifest.json', ...FILES].sort());
  for (const file of FILES) {
    assert.ok(readFileSync(path.join(assets, 'parser/2026.10.13', file)).equals(readFileSync(path.join(first.dir, file))), file);
  }
  await carryRelease(writeRelease(workbench, { name: '2026.10.14', revision: REV_B }).dir, assets);
  assert.deepEqual(readJson(path.join(assets, 'parser/index.json')), {
    schema: 'spw.parser-index/2',
    releases: [
      { name: '2026.10.14', kind: 'release', day: '2026.10.14', revision: REV_B },
      { name: '2026.10.13', kind: 'release', day: '2026.10.13', revision: REV_A },
    ],
  });
  assert.deepEqual((await checkAssets(assets)).problems, []);
  assert.deepEqual((await carryRelease(first.dir, assets)).copied, [], 'the same bytes again copy nothing');
  const check = run('--check', '--assets', assets);
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /2 release\(s\) and patch\(es\) in assets match their manifests; index\.json is current/);
  assert.match(check.stdout, /0 prerelease\(s\)/);
});

test('carry refuses what does not match its manifest or its name, and a dirty cut without --allow-dirty', async () => {
  const tampered = writeRelease(freshDir('workbench'));
  appendFileSync(path.join(tampered.dir, 'full.min.js'), '/* changed */');
  const assets = freshDir('assets');
  const problems = await refusal(tampered, assets);
  assert.match(problems, /^full\.min\.js: \d+ bytes, the manifest says \d+$/m);
  assert.match(problems, /^full\.min\.js: sha256 differs from the manifest$/m);
  assert.match(problems, /^parser\.js: not the same bytes as full\.min\.js$/m);
  assert.throws(() => readFileSync(path.join(assets, 'parser/2026.10.13/manifest.json')), 'nothing is copied');
  const cli = run(tampered.dir, '--assets', assets);
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /full\.min\.js: sha256 differs from the manifest/);

  // parser.js rewritten with its own manifest entry: the hashes hold, the alias does not.
  const drifted = writeRelease(freshDir('workbench'));
  rewriteListed(drifted, 'parser.js', 'export const parse = () => null;export const SPW_PARSER_BUILD={"release":"2026.10.13"};\n');
  assert.match(await refusal(drifted), /parser\.js: not the same bytes as full\.min\.js/);

  // Hashes that hold over a script whose stamp names another build.
  const misnamed = writeRelease(freshDir('workbench'));
  rewriteListed(misnamed, 'lite.min.js', 'export const scan=()=>[];export const SPW_PARSER_BUILD=Object.freeze({"release":"2026.10.13-pre.1"});\n');
  assert.match(await refusal(misnamed), /lite\.min\.js: its SPW_PARSER_BUILD stamp does not name 2026\.10\.13$/m);

  const edit = (change, name) => editManifest(writeRelease(freshDir('workbench'), { name }), change);
  assert.match(await refusal(edit((m) => { m.kind = 'prerelease'; })), /kind is "prerelease", but 2026\.10\.13 names a release/);
  assert.match(await refusal(edit((m) => { m.day = '2026.10.12'; })), /day is "2026\.10\.12", but 2026\.10\.13 says 2026\.10\.13/);
  assert.match(await refusal(edit((m) => { m.patch = 1; })), /patch is 1, but 2026\.10\.13 says none/);
  assert.match(await refusal(edit((m) => { delete m.patch; }, '2026.10.13-patch.2')), /patch is null, but 2026\.10\.13-patch\.2 says 2/);
  assert.match(await refusal(edit((m) => { m.schema = 'spw.parser-release/1'; })), /schema is "spw\.parser-release\/1", not spw\.parser-release\/2/);
  assert.match(await refusal(edit((m) => { m.workbench.revision = REV_A.slice(0, 12); })), /workbench\.revision is not a 40-hex revision/);
  assert.match(await refusal(edit((m) => { m.default.path = 'full.min.js'; })), /default\.path is "full\.min\.js", not parser\.js/);
  assert.match(await refusal(edit((m) => { m.name = '2026.10.13.1'; })), /name "2026\.10\.13\.1" is not YYYY\.MM\.DD, YYYY\.MM\.DD-pre\.N or YYYY\.MM\.DD-patch\.N/);
  assert.match(await refusal(writeRelease(freshDir('workbench'), { name: '2026.02.30' })), /2026\.02\.30 is not a day on the calendar/);

  // A folder copied under another name is refused by its name.
  const renamed = writeRelease(freshDir('workbench'), { name: '2026.10.13' });
  const moved = writeRelease(freshDir('workbench'), { name: '2026.10.14' });
  writeFileSync(path.join(moved.dir, 'manifest.json'), readFileSync(path.join(renamed.dir, 'manifest.json')));
  for (const file of FILES) writeFileSync(path.join(moved.dir, file), readFileSync(path.join(renamed.dir, file)));
  assert.match(await refusal(moved), /holds release 2026\.10\.13, not 2026\.10\.14/);

  const dirty = writeRelease(freshDir('workbench'), { dirty: true });
  assert.match(await refusal(dirty), /release 2026\.10\.13 was cut from a tree with uncommitted changes[\s\S]*--allow-dirty/);
  assert.equal((await carryRelease(dirty.dir, freshDir('assets'), { allowDirty: true })).name, '2026.10.13');
});

test('a published day never takes different bytes; its fix is a patch, which sits above it', async () => {
  const workbench = freshDir('workbench');
  const assets = freshDir('assets');
  const day = writeRelease(workbench, { name: '2026.10.13', revision: REV_A });
  await carryRelease(day.dir, assets);
  const recut = writeRelease(freshDir('workbench'), { name: '2026.10.13', revision: REV_B });
  const message = await refusal(recut, assets);
  assert.match(message, /^assets\/parser\/2026\.10\.13 already holds different bytes at these paths: a published day never changes; cut a patch of it \(YYYY\.MM\.DD-patch\.N\)$/m);
  for (const file of ['full.min.js', 'parser.js', 'manifest.json']) assert.match(message, new RegExp(`^${file.replace(/\./g, '\\.')}$`, 'm'), file);
  assert.ok(readFileSync(path.join(assets, 'parser/2026.10.13/full.min.js')).equals(readFileSync(path.join(day.dir, 'full.min.js'))));
  // A stray already in the carried folder counts as different bytes too.
  writeFileSync(path.join(assets, 'parser/2026.10.13/extra.js'), '');
  assert.match(await refusal(day, assets), /^extra\.js$/m);

  for (const n of [1, 2, 10]) await carryRelease(writeRelease(workbench, { name: `2026.10.13-patch.${n}`, revision: REV_C }).dir, assets);
  await carryRelease(writeRelease(workbench, { name: '2026.10.12', revision: REV_C }).dir, assets);
  const names = readJson(path.join(assets, 'parser/index.json')).releases.map((entry) => `${entry.kind} ${entry.name}`);
  assert.deepEqual(names, ['patch 2026.10.13-patch.10', 'patch 2026.10.13-patch.2', 'patch 2026.10.13-patch.1', 'release 2026.10.13', 'release 2026.10.12']);
  assert.equal(readJson(path.join(assets, 'parser/index.json')).releases[0].patch, 10);
  const repatched = writeRelease(freshDir('workbench'), { name: '2026.10.13-patch.2', revision: REV_A });
  assert.match(await refusal(repatched, assets), /a published patch never changes; cut the next -patch\.N/);
  // A patch of the newest day beats its release; the next day beats both.
  const env = () => ({ ASSETS: assetsFrom(assets) });
  assert.equal((await get('/parser/latest.js', { env: env() })).headers.get('location'), '/parser/2026.10.13-patch.10/parser.js');
  await carryRelease(writeRelease(workbench, { name: '2026.10.14', revision: REV_C }).dir, assets);
  assert.equal((await get('/parser/latest.js', { env: env() })).headers.get('location'), '/parser/2026.10.14/parser.js');
  // Stamps say patch: true, and the carry checks it.
  const unflagged = writeRelease(freshDir('workbench'), { name: '2026.10.14-patch.1' });
  const plain = 'export const parse=(s)=>({s});export const SPW_PARSER_BUILD=Object.freeze({"release":"2026.10.14-patch.1"});\n';
  rewriteListed(unflagged, 'full.min.js', plain);
  rewriteListed(unflagged, 'parser.js', plain);
  assert.match(await refusal(unflagged), /full\.min\.js: its SPW_PARSER_BUILD stamp does not say patch: true/);
  const page = await (await get('/parser/2026.10.13-patch.2/', { env: env() })).text();
  assert.match(page, /<h1>Parser patch 2026\.10\.13-patch\.2<\/h1>/);
  assert.ok(page.includes('<dt>Patch of</dt><dd><code>2026.10.13</code></dd>'));
  assert.ok((await (await get('/parser/', { env: env() })).text()).includes('<strong>2026.10.13-patch.2</strong></a> <span class="badge">patch</span>'));
});

test('--check fails on a file tampered with in assets, a stray, and an index that drifted', async () => {
  const { assets } = await carriedPair();
  appendFileSync(path.join(assets, 'parser/2026.10.13/lite.min.js'), ' ');
  writeFileSync(path.join(assets, 'parser/2026.10.13/stray.js'), '');
  mkdirSync(path.join(assets, 'parser/2026.10.13.1'));
  const check = run('--check', '--assets', assets);
  assert.equal(check.status, 1);
  assert.match(check.stderr, /parser\/2026\.10\.13\/lite\.min\.js: sha256 differs from the manifest/);
  assert.match(check.stderr, /parser\/2026\.10\.13\/stray\.js: not in the manifest/);
  assert.match(check.stderr, /parser\/2026\.10\.13\.1: not a release \(YYYY\.MM\.DD\), prerelease \(YYYY\.MM\.DD-pre\.N\) or patch \(YYYY\.MM\.DD-patch\.N\)/);
  writeFileSync(path.join(assets, 'parser/index.json'), '{"schema":"spw.parser-index/2","releases":[]}\n');
  assert.ok((await checkAssets(assets)).problems.some((problem) => /index\.json does not list the releases and patches/.test(problem)));
});

test('the assets in the tree verify against their manifests and the indexes', async () => {
  assert.deepEqual((await checkAssets(DEFAULT_ASSETS)).problems, []);
});

test('/parser/ lists releases newest first; /parser/index.json is the index, short-cached and open to any origin', async () => {
  const { env } = await carriedPair();
  const page = await get('/parser/', { env });
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /^text\/html/);
  assert.equal(page.headers.get('content-security-policy'), PAGE_CSP, 'the shell policy, plus the faces from this origin');
  const html = await page.text();
  assert.ok(html.indexOf('href="/parser/2026.10.14/"') < html.indexOf('href="/parser/2026.10.13/"'), 'newest first');
  assert.ok(html.includes('href="/parser/2026.10.13/parser.js"'));
  assert.ok(html.includes('href="/parser/index.json"') && html.includes('href="/parser/latest.js"'));
  assert.ok(html.includes(REV_A.slice(0, 12)));
  const index = await get('/parser/index.json', { env });
  assert.equal(index.status, 200);
  assert.match(index.headers.get('content-type'), /^application\/json/);
  assert.equal(index.headers.get('access-control-allow-origin'), '*');
  assert.equal(index.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.equal(index.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(index.headers.get('cache-control'), SHORT);
  assert.deepEqual((await index.json()).releases.map((entry) => entry.name), ['2026.10.14', '2026.10.13']);
});

test('a release page names every file with its variant, form, bytes, integrity, an import and a script tag', async () => {
  const { env, first } = await carriedPair();
  const response = await get('/parser/2026.10.13/', { env });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), SHORT);
  const html = await response.text();
  assert.match(html, /<h1>Parser 2026\.10\.13<\/h1>/);
  assert.ok(html.includes(`<code>${REV_A}</code>`), 'the workbench revision');
  assert.ok(html.includes(`href="https://github.com/spwashi/spw-workbench/commit/${REV_A}"`));
  assert.ok(html.includes('<dt>Release day</dt><dd><code>2026.10.13</code></dd>'));
  assert.ok(html.includes('<a href="parser.js"><code>parser.js</code></a>, the same bytes as <a href="full.min.js"><code>full.min.js</code></a>'));
  assert.ok(html.includes('<a href="/?parser=2026.10.13">'), 'try it on the guide');
  for (const file of first.manifest.files) {
    const section = html.match(new RegExp(`<section class="file" id="file-${file.path.replace(/[^A-Za-z0-9]+/g, '-')}"[\\s\\S]*?</section>`))?.[0];
    assert.ok(section, file.path);
    // parser.js names only its alias, and shows the variant and form of the file it aliases.
    const { variant, form } = file.alias ? first.manifest.files.find((other) => other.path === file.alias) : file;
    // The variant names itself, then says what it is for.
    assert.ok(section.includes(`<dt>Variant</dt><dd>${variant} <span class="note">`) && section.includes(`<dt>Form</dt><dd>${form}</dd>`), file.path);
    assert.ok(section.includes(`<dt>Bytes</dt><dd>${file.bytes.toLocaleString('en-US')}</dd>`), file.path);
    assert.ok(section.includes(`<code>${file.integrity}</code>`), file.path);
    const url = `https://spw.quest/parser/2026.10.13/${file.path}`;
    if (file.path.endsWith('.js')) {
      const names = { full: 'parse', lite: 'scan', reader: 'parse, highlightHtml, outline, anchors', workbench: 'parse, runSpw, highlightHtml' }[variant];
      assert.ok(section.includes(escapeHtml(`import { ${names} } from "${url}";`)), `${file.path} import`);
      assert.ok(section.includes(escapeHtml(`<script type="module" src="${url}" integrity="${file.integrity}" crossorigin="anonymous"></script>`)), `${file.path} script tag`);
    } else {
      assert.doesNotMatch(section, /<pre id="(import|script)-/, `${file.path} is not a script`);
    }
  }
  assert.match(html, /<section class="file" id="file-parser-js"[\s\S]*?<span class="badge">default<\/span> <span class="badge">alias<\/span>[\s\S]*?<dt>Same bytes as<\/dt><dd><a href="full\.min\.js">/);
});

test('release files: JavaScript or JSON, open to any origin, immutable; the manifest stays short-cached', async () => {
  const { env, first } = await carriedPair();
  for (const file of FILES) {
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
  assert.equal(manifest.headers.get('cache-control'), SHORT);
  assert.equal((await manifest.json()).name, '2026.10.13');
});

test('/parser/latest.js redirects to the newest parser.js for five minutes', async () => {
  const { env } = await carriedPair();
  const response = await get('/parser/latest.js', { env });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/parser/2026.10.14/parser.js');
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
  for (const known of ['/parser/', '/parser/index.json', '/parser/latest.js', '/parser/prereleases.json', '/parser/2026.10.14/', '/parser/2026.10.13/manifest.json']) {
    assert.ok(body.split('\n').includes(known), known);
  }
  assert.ok(!body.split('\n').includes('/parser/next.js'), 'next.js is offered only when a prerelease exists');
  const json = await get('/parser/2026.10.13/full.min.json', { env, headers: { accept: 'application/json' } });
  assert.equal(json.status, 404);
  assert.match(json.headers.get('content-type'), /^application\/json/);
  const listing = await json.json();
  assert.equal(listing.path, '/parser/2026.10.13/full.min.json');
  assert.ok(listing.paths.includes('/parser/2026.10.13/full.min.js') && listing.paths.includes('/parser/2026.10.13/lite.debug.js.map'), 'the release asked about lists its files');
  assert.ok(!listing.paths.includes('/parser/2026.10.14/full.min.js'), 'other releases list only their pages');
  for (const missing of ['/parser/2027.01.01/', '/parser/2026.10.13.1/', '/parser/2026.10.13-pre.0/', '/parser/2026.10.13-patch.01/', '/parser/2026.10.13/full/', '/parser/2026.10.13/.hidden', '/parser/2026.10.13/full/00.min.js', '/parser/pre/']) {
    assert.equal((await get(missing, { env })).status, 404, missing);
  }
  assert.equal((await get('/parser', { env })).headers.get('location'), '/parser/');
  assert.equal((await get('/parser/2026.10.13', { env })).headers.get('location'), '/parser/2026.10.13/');
});

test('HEAD answers every parser route without a body; other methods are refused', async () => {
  const { env } = await carriedPair();
  for (const pathname of ['/parser/', '/parser/index.json', '/parser/latest.js', '/parser/2026.10.13/', '/parser/2026.10.13/manifest.json', '/parser/2026.10.13/parser.js', '/parser/2026.10.13/full.debug.js.map', '/parser/missing']) {
    const [full, head] = [await get(pathname, { env }), await get(pathname, { env, method: 'HEAD' })];
    assert.equal(head.status, full.status, pathname);
    assert.equal(await head.text(), '', pathname);
    for (const name of ['content-type', 'cache-control', 'access-control-allow-origin', 'location']) {
      assert.equal(head.headers.get(name), full.headers.get(name), `${pathname} ${name}`);
    }
  }
  const post = await get('/parser/2026.10.13/parser.js', { env, method: 'POST' });
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
  assert.equal((await get('/', { env })).headers.get('content-security-policy'), PAGE_CSP.replace("script-src 'unsafe-inline'", "script-src 'self' 'unsafe-inline'"));
  assert.equal((await get('/install', { env })).headers.get('content-security-policy'), PAGE_CSP);
  assert.equal(await (await get('/missing', { env })).text(), 'Not found');
});
