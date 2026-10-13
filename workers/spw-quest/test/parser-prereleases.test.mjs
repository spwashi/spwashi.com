import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { BASE_SECURITY } from '../../lib/shell.js';
import { CarryError, carryRelease, checkAssets, prunePrereleases } from '../carry-parser-release.mjs';
import { switchLoader } from '../src/parser-switch.js';
import { FILES, IMMUTABLE, MINUTE, REV_A, REV_B, REV_C, SHORT, assetsFrom, editManifest, get, rewriteListed, run, scratch, writeRelease } from './parser-fixtures.mjs';

const freshDir = scratch('spw-quest-prerelease-');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const PRE_1 = '2026.10.14-pre.1';
const PRE_2 = '2026.10.14-pre.2';

/** One release and two prereleases headed for the next day, in a fresh assets directory, and the env that serves them. */
async function carriedSet() {
  const workbench = freshDir('workbench');
  const assets = freshDir('assets');
  const release = writeRelease(workbench, { name: '2026.10.13', revision: REV_C });
  const older = writeRelease(workbench, { name: PRE_1, revision: REV_A });
  const newer = writeRelease(workbench, { name: PRE_2, revision: REV_B });
  for (const cut of [release, newer, older]) await carryRelease(cut.dir, assets);
  return { assets, release, older, newer, env: { ASSETS: assetsFrom(assets) } };
}

async function refusal(cut, assets = freshDir('assets'), options) {
  try {
    await carryRelease(cut.dir, assets, options);
  } catch (error) {
    assert.ok(error instanceof CarryError, error.message);
    return [error.message, ...error.problems].join('\n');
  }
  assert.fail(`${cut.dir} carried`);
}

test('a prerelease carries into parser/<day>-pre.N/, writes prereleases.json, and never touches index.json', async () => {
  const workbench = freshDir('workbench');
  const assets = freshDir('assets');
  await carryRelease(writeRelease(workbench, { name: '2026.10.13', revision: REV_C }).dir, assets);
  const published = readFileSync(path.join(assets, 'parser/index.json'));
  const cut = writeRelease(workbench, { name: PRE_1, revision: REV_A });
  const result = await carryRelease(cut.dir, assets);
  assert.deepEqual([result.name, result.kind], [PRE_1, 'prerelease']);
  assert.equal(result.copied.at(-1), 'manifest.json', 'the manifest lands last');
  for (const file of FILES) {
    assert.ok(readFileSync(path.join(assets, 'parser', PRE_1, file)).equals(readFileSync(path.join(cut.dir, file))), file);
  }
  assert.ok(readFileSync(path.join(assets, 'parser/index.json')).equals(published), 'index.json is untouched');
  assert.deepEqual(readJson(path.join(assets, 'parser/prereleases.json')), {
    schema: 'spw.parser-prerelease-index/1',
    prereleases: [{ name: PRE_1, kind: 'prerelease', day: '2026.10.14', pre: 1, revision: REV_A }],
  });
  assert.deepEqual((await carryRelease(cut.dir, assets)).copied, [], 'the same bytes again copy nothing');
  assert.deepEqual((await checkAssets(assets)).problems, []);
  const check = run('--check', '--assets', assets);
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /1 release\(s\) and patch\(es\) in assets match their manifests/);
  assert.match(check.stdout, /1 prerelease\(s\) in assets match their manifests; prereleases\.json is current/);
  const bare = freshDir('assets');
  await carryRelease(cut.dir, bare);
  assert.equal(existsSync(path.join(bare, 'parser/index.json')), false, 'a prerelease writes no index.json at all');
});

test('a prerelease is refused when dirty, tampered, not stamped as one, at odds with its name, or under another name', async () => {
  const dirty = writeRelease(freshDir('workbench'), { name: PRE_1, dirty: true });
  assert.match(await refusal(dirty), /prerelease 2026\.10\.14-pre\.1 was cut from a tree with uncommitted changes/);
  const cli = run(dirty.dir, '--assets', freshDir('assets'));
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /--allow-dirty/);
  assert.equal((await carryRelease(dirty.dir, freshDir('assets'), { allowDirty: true })).name, PRE_1);

  const tampered = writeRelease(freshDir('workbench'), { name: PRE_1 });
  appendFileSync(path.join(tampered.dir, 'lite.min.js'), '/* changed */');
  assert.match(await refusal(tampered), /lite\.min\.js: sha256 differs from the manifest/);

  // Hashes that hold over scripts whose stamps name the prerelease but do not say prerelease: true.
  const unflagged = writeRelease(freshDir('workbench'), { name: PRE_1 });
  const plain = `export const parse=(s)=>({s});export const SPW_PARSER_BUILD=Object.freeze({"release":"${PRE_1}","prerelease":false});\n`;
  rewriteListed(unflagged, 'full.min.js', plain);
  rewriteListed(unflagged, 'parser.js', plain);
  const stamps = await refusal(unflagged);
  assert.match(stamps, /^full\.min\.js: its SPW_PARSER_BUILD stamp does not say prerelease: true$/m);
  assert.match(stamps, /^parser\.js: its SPW_PARSER_BUILD stamp does not say prerelease: true$/m);

  const edit = (change) => editManifest(writeRelease(freshDir('workbench'), { name: PRE_1 }), change);
  assert.match(await refusal(edit((m) => { m.kind = 'release'; })), /kind is "release", but 2026\.10\.14-pre\.1 names a prerelease/);
  assert.match(await refusal(edit((m) => { m.pre = 2; })), /pre is 2, but 2026\.10\.14-pre\.1 says 1/);
  assert.match(await refusal(edit((m) => { m.day = '2026.10.13'; })), /day is "2026\.10\.13", but 2026\.10\.14-pre\.1 says 2026\.10\.14/);
  assert.match(await refusal(edit((m) => { m.name = '2026.10.14-pre.0'; })), /is not YYYY\.MM\.DD, YYYY\.MM\.DD-pre\.N or YYYY\.MM\.DD-patch\.N/);

  const named = writeRelease(freshDir('workbench'), { name: PRE_1 });
  const moved = path.join(freshDir('workbench'), PRE_2);
  cpSync(named.dir, moved, { recursive: true });
  await assert.rejects(carryRelease(moved, freshDir('assets')), /holds prerelease 2026\.10\.14-pre\.1, not 2026\.10\.14-pre\.2/);
});

test('a carried prerelease never takes different bytes; a new cut is the next -pre.N', async () => {
  const assets = freshDir('assets');
  const original = writeRelease(freshDir('workbench'), { name: PRE_1, revision: REV_A });
  await carryRelease(original.dir, assets);
  const rebuilt = writeRelease(freshDir('workbench'), { name: PRE_1, revision: REV_B });
  const message = await refusal(rebuilt, assets);
  assert.match(message, /^assets\/parser\/2026\.10\.14-pre\.1 already holds different bytes at these paths: a carried prerelease never changes; cut the next -pre\.N$/m);
  assert.match(message, /^manifest\.json$/m);
  assert.ok(readFileSync(path.join(assets, 'parser', PRE_1, 'lite.min.js')).equals(readFileSync(path.join(original.dir, 'lite.min.js'))));
});

test('--prune keeps the newest N prereleases by name, alone or after a carry, and never a release', async () => {
  const workbench = freshDir('workbench');
  const assets = freshDir('assets');
  await carryRelease(writeRelease(workbench, { name: '2026.10.13', revision: REV_C }).dir, assets);
  const published = readFileSync(path.join(assets, 'parser/index.json'));
  for (const name of ['2026.10.15-pre.1', PRE_2, '2026.10.14-pre.10']) await carryRelease(writeRelease(workbench, { name }).dir, assets);
  const names = () => readJson(path.join(assets, 'parser/prereleases.json')).prereleases.map((entry) => entry.name);
  assert.deepEqual(names(), ['2026.10.15-pre.1', '2026.10.14-pre.10', PRE_2], 'by day, then by N as a number');
  const pruned = await prunePrereleases(assets, 2);
  assert.deepEqual([pruned.kept, pruned.removed], [['2026.10.15-pre.1', '2026.10.14-pre.10'], [PRE_2]]);
  assert.equal(existsSync(path.join(assets, 'parser', PRE_2)), false);
  assert.deepEqual(names(), ['2026.10.15-pre.1', '2026.10.14-pre.10']);
  assert.deepEqual((await checkAssets(assets)).problems, []);
  const again = run('--prune', '2', '--assets', assets);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /nothing to prune; 2 prerelease\(s\) kept/);
  // Carry one more and prune to one in a single run.
  const both = run(writeRelease(workbench, { name: '2026.10.16-pre.1' }).dir, '--prune', '1', '--assets', assets);
  assert.equal(both.status, 0, both.stderr);
  assert.match(both.stdout, /carried prerelease 2026\.10\.16-pre\.1/);
  assert.match(both.stdout, /pruned 2026\.10\.15-pre\.1, 2026\.10\.14-pre\.10; kept 2026\.10\.16-pre\.1/);
  assert.deepEqual(names(), ['2026.10.16-pre.1']);
  assert.ok(readFileSync(path.join(assets, 'parser/index.json')).equals(published), 'pruning never touches index.json');
  assert.ok(existsSync(path.join(assets, 'parser/2026.10.13/parser.js')), 'nor a release');
  assert.deepEqual((await checkAssets(assets)).problems, []);
  assert.equal(run('--prune', 'all', '--assets', assets).status, 2);
  assert.equal(run('--assets', assets, '--prune').status, 2);
});

test('--check verifies prereleases: tampered files, strays, and a prereleases.json that drifted', async () => {
  const { assets } = await carriedSet();
  appendFileSync(path.join(assets, 'parser', PRE_1, 'full.debug.js'), ' ');
  writeFileSync(path.join(assets, 'parser', PRE_1, 'full.min.js.gz'), '');
  const check = run('--check', '--assets', assets);
  assert.equal(check.status, 1);
  assert.match(check.stderr, /parser\/2026\.10\.14-pre\.1\/full\.debug\.js: sha256 differs from the manifest/);
  assert.match(check.stderr, /parser\/2026\.10\.14-pre\.1\/full\.min\.js\.gz: not in the manifest/);
  const drifted = (await carriedSet()).assets;
  const indexPath = path.join(drifted, 'parser/prereleases.json');
  const index = readJson(indexPath);
  const drift = (prereleases) => writeFileSync(indexPath, `${JSON.stringify({ ...index, prereleases }, null, 2)}\n`);
  const says = async () => (await checkAssets(drifted)).problems.filter((problem) => /prereleases\.json does not list the prereleases in assets, newest first/.test(problem)).length;
  drift(index.prereleases.slice(1));
  assert.equal(await says(), 1, 'one missing');
  drift([...index.prereleases].reverse());
  assert.equal(await says(), 1, 'out of order');
  rmSync(indexPath);
  assert.equal(await says(), 1, 'a missing prereleases.json, with prereleases carried');
});

test('/parser/ names prereleases as prereleases, after the releases; /parser/prereleases.json lists them for a minute', async () => {
  const { env } = await carriedSet();
  const html = await (await get('/parser/', { env })).text();
  assert.ok(html.indexOf('href="/parser/2026.10.13/"') < html.indexOf('<h2 id="prereleases">Prereleases</h2>'));
  assert.ok(html.indexOf(`href="/parser/${PRE_2}/"`) < html.indexOf(`href="/parser/${PRE_1}/"`), 'newest first');
  assert.equal([...html.matchAll(/<span class="badge">prerelease<\/span>/g)].length, 2);
  assert.ok(html.includes('headed for <code>2026.10.14</code>'));
  assert.ok(html.includes(`href="/parser/${PRE_2}/parser.js"`) && html.includes(`href="/?parser=${PRE_2}"`));
  assert.ok(html.includes('href="/parser/prereleases.json"') && html.includes('href="/parser/next.js"'));
  const index = await get('/parser/prereleases.json', { env });
  assert.equal(index.status, 200);
  assert.match(index.headers.get('content-type'), /^application\/json/);
  assert.equal(index.headers.get('access-control-allow-origin'), '*');
  assert.equal(index.headers.get('cache-control'), MINUTE);
  const body = await index.json();
  assert.equal(body.schema, 'spw.parser-prerelease-index/1');
  assert.deepEqual(body.prereleases.map((entry) => entry.name), [PRE_2, PRE_1]);
  assert.deepEqual((await (await get('/parser/index.json', { env })).json()).releases.map((entry) => entry.name), ['2026.10.13'], 'index.json has no prerelease');
});

test('a prerelease page, manifest and files: labelled, short-cached pages, immutable files', async () => {
  const { env, newer } = await carriedSet();
  const response = await get(`/parser/${PRE_2}/`, { env });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), SHORT);
  const html = await response.text();
  assert.match(html, /<h1>Parser prerelease 2026\.10\.14-pre\.2<\/h1>/);
  assert.match(html, /<code>\/parser\.js<\/code> and <code>\/parser\/latest\.js<\/code> never serve it/);
  assert.ok(html.includes(`<code>${REV_B}</code>`) && html.includes('<dt>Headed for</dt><dd><code>2026.10.14</code></dd>'));
  assert.ok(html.includes(`<a href="/?parser=${PRE_2}">`) && html.includes('<a href="/parser/#prereleases">prereleases</a>'));
  assert.ok(html.includes(`import { parse } from &quot;https://spw.quest/parser/${PRE_2}/full.min.js&quot;;`));
  for (const file of FILES) {
    const served = await get(`/parser/${PRE_2}/${file}`, { env });
    assert.equal(served.status, 200, file);
    assert.equal(served.headers.get('content-type'), file.endsWith('.map') ? 'application/json; charset=UTF-8' : 'text/javascript; charset=UTF-8', file);
    assert.equal(served.headers.get('access-control-allow-origin'), '*', file);
    assert.equal(served.headers.get('cross-origin-resource-policy'), 'cross-origin', file);
    assert.equal(served.headers.get('x-content-type-options'), 'nosniff', file);
    assert.equal(served.headers.get('cache-control'), IMMUTABLE, file);
    assert.ok(Buffer.from(await served.arrayBuffer()).equals(readFileSync(path.join(newer.dir, file))), file);
  }
  const manifest = await get(`/parser/${PRE_2}/manifest.json`, { env });
  assert.equal(manifest.headers.get('cache-control'), SHORT);
  assert.deepEqual(Object.entries(await manifest.json()).slice(1, 5), [['name', PRE_2], ['kind', 'prerelease'], ['day', '2026.10.14'], ['pre', 2]]);
});

test('/parser/next.js is a one-minute 302 to the newest prerelease; latest.js never lands on one', async () => {
  const { env } = await carriedSet();
  const next = await get('/parser/next.js', { env });
  assert.equal(next.status, 302);
  assert.equal(next.headers.get('location'), `/parser/${PRE_2}/parser.js`);
  assert.equal(next.headers.get('cache-control'), MINUTE);
  assert.equal(next.headers.get('access-control-allow-origin'), '*');
  const latest = await get('/parser/latest.js', { env });
  assert.equal(latest.headers.get('location'), '/parser/2026.10.13/parser.js', 'the release, though both prereleases are headed for a later day');
  const assets = freshDir('assets');
  await carryRelease(writeRelease(freshDir('workbench'), { name: PRE_1 }).dir, assets);
  const onlyPre = { ASSETS: assetsFrom(assets) };
  assert.equal((await get('/parser/latest.js', { env: onlyPre })).status, 404, 'with only prereleases, latest.js has nowhere to go');
  assert.equal((await get('/parser/next.js', { env: onlyPre })).headers.get('location'), `/parser/${PRE_1}/parser.js`);
});

test('with no prerelease carried, prereleases.json is an empty list and next.js explains its 404', async () => {
  const { assets } = await carriedSet();
  await prunePrereleases(assets, 0);
  const env = { ASSETS: assetsFrom(assets) };
  for (const environment of [env, { ASSETS: assetsFrom(freshDir('assets')) }, undefined]) {
    const index = await get('/parser/prereleases.json', { env: environment });
    assert.equal(index.status, 200);
    assert.deepEqual((await index.json()).prereleases, []);
    const next = await get('/parser/next.js', { env: environment });
    assert.equal(next.status, 404);
    assert.match(await next.text(), /^Not found: \/parser\/next\.js\nNo prerelease has been carried, so next\.js has nowhere to go; \/parser\/latest\.js is the newest published build\.\n/);
  }
  assert.doesNotMatch(await (await get('/parser/', { env })).text(), /Prereleases|next\.js/, '/parser/ links prereleases only when one exists');
  assert.equal((await get(`/parser/${PRE_2}/parser.js`, { env })).status, 404, 'a pruned path simply 404s');
});

test('unknown prerelease paths 404 with what exists; short forms redirect; HEAD matches GET', async () => {
  const { env } = await carriedSet();
  const json = await get(`/parser/${PRE_1}/full.min.json`, { env, headers: { accept: 'application/json' } });
  assert.equal(json.status, 404);
  const listing = await json.json();
  for (const known of ['/parser/prereleases.json', '/parser/next.js', `/parser/${PRE_2}/`, `/parser/${PRE_1}/full.min.js`, '/parser/2026.10.13/']) {
    assert.ok(listing.paths.includes(known), known);
  }
  assert.ok(!listing.paths.includes(`/parser/${PRE_2}/full.min.js`), 'other prereleases list only their pages');
  for (const missing of ['/parser/2026.10.14-pre.3/', '/parser/2026.10.14-PRE.1/', '/parser/2026.10.14-pre.1/.hidden', '/parser/2026.10.14-pre.1/a/b.js', '/parser/pre/']) {
    assert.equal((await get(missing, { env })).status, 404, missing);
  }
  assert.equal((await get(`/parser/${PRE_1}`, { env })).headers.get('location'), `/parser/${PRE_1}/`);
  for (const pathname of ['/parser/prereleases.json', '/parser/next.js', `/parser/${PRE_1}/`, `/parser/${PRE_1}/manifest.json`, `/parser/${PRE_1}/parser.js`, '/parser/2026.10.14-pre.9/']) {
    const [full, head] = [await get(pathname, { env }), await get(pathname, { env, method: 'HEAD' })];
    assert.equal(head.status, full.status, pathname);
    assert.equal(await head.text(), '', pathname);
    for (const name of ['content-type', 'cache-control', 'location']) assert.equal(head.headers.get(name), full.headers.get(name), `${pathname} ${name}`);
  }
});

const GUIDE_CSP = BASE_SECURITY['Content-Security-Policy'].replace("script-src 'unsafe-inline'", "script-src 'self' 'unsafe-inline'");
const STATIC_IMPORT = '<script type="module">\nimport { parse } from "/parser.js";';

test('?parser= switches the guide to a /parser/ build, with a banner that says so', async () => {
  const cases = [
    ['next', '/parser/next.js'],
    ['latest', '/parser/latest.js'],
    ['2026.10.13', '/parser/2026.10.13/parser.js'],
    [PRE_2, `/parser/${PRE_2}/parser.js`],
    ['2026.10.13-patch.1', '/parser/2026.10.13-patch.1/parser.js'],
  ];
  for (const [value, from] of cases) {
    const response = await get(`/?parser=${value}`);
    assert.equal(response.status, 200, value);
    assert.equal(response.headers.get('content-security-policy'), GUIDE_CSP, `${value}: the CSP stays as it is`);
    const page = await response.text();
    assert.ok(page.includes(`<code>?parser=${value}</code> asks this page to read with <a href="${from}"><code>${from}</code></a> instead of <code>/parser.js</code>.`), value);
    assert.ok(page.includes(`})(${JSON.stringify(from)});`), `${value} loads ${from}`);
    assert.ok(!page.includes(STATIC_IMPORT), `${value}: no static import of /parser.js`);
    assert.ok(page.includes('import("/parser.js")'), `${value}: /parser.js is the fallback`);
    assert.match(page, /<p id="parser-running" data-state="pending"><span class="scripts-on">Loading it…<\/span><span class="scripts-off">Scripts are off, so it did not load\.<\/span><\/p>/);
    assert.ok(page.includes("With scripts off, and at <code>/read</code>, every line is read by the worker's built-in parser"), value);
    assert.ok(page.includes('<a href="/">Back to the default parser</a>'), value);
    assert.ok(page.indexOf('class="parser-switch"') < page.indexOf('<header class="opening">'), 'the banner leads');
    assert.match(page, /<section class="step" id="act"[\s\S]*?data-state="pass"/, `${value}: the worker still reads the panels`);
  }
});

test('any other ?parser= is ignored: the guide is the default page, and the value is not written into it', async () => {
  const plain = await (await get('/')).text();
  assert.ok(plain.includes(STATIC_IMPORT) && !plain.includes('parser-switch'));
  const ignored = ['', 'nope', 'NEXT', 'next.js', ' next', 'latest ', '2026.10.13.1', '2026.10.13-pre.0', '2026.10.13-pre.01', '2026.10.13-patch',
    '2026.10.13-rc.1', '2026.13.01-pre.1', '2026.02.30', '2026.1.1', 'pre/a1b2c3d4e5f6', '2026.10.13/parser.js', '../parser.js',
    '//evil.example/x.js', 'https://evil.example/x.js', '<script>alert(1)</script>', '"><img src=x>'];
  for (const value of ignored) {
    assert.equal(await (await get(`/?parser=${encodeURIComponent(value)}`)).text(), plain, JSON.stringify(value));
  }
  for (const query of ['parser=next&parser=latest', 'parser=next&parser=next', 'Parser=next']) {
    assert.equal(await (await get(`/?${query}`)).text(), plain, query);
  }
  assert.doesNotMatch(await (await get('/read?step=act&parser=next')).text(), /parser-switch/, 'only the guide switches');
});

/** A stand-in for the few DOM calls the page's loader makes. */
function fakeDocument() {
  const line = { dataset: {}, text: '', replaceChildren(...nodes) { this.text = nodes.map((node) => node.textContent).join(''); this.links = nodes.filter((node) => node.href).map((node) => node.href); } };
  return {
    line,
    getElementById: (id) => (id === 'parser-running' ? line : null),
    createTextNode: (text) => ({ textContent: text }),
    createElement: () => ({ textContent: '', setAttribute(name, value) { this[name] = value; } }),
  };
}

test('in the page, the loader names the build that runs from its stamp, or says nothing loaded', async () => {
  const AsyncFunction = (async () => {}).constructor;
  const load = (from) => new AsyncFunction('document', `${switchLoader(from).before}\nreturn parse;`);
  const assets = freshDir('assets');
  const workbench = freshDir('workbench');
  await carryRelease(writeRelease(workbench, { name: PRE_1, dirty: true }).dir, assets, { allowDirty: true });
  await carryRelease(writeRelease(workbench, { name: '2026.10.13-patch.1', revision: REV_B }).dir, assets);
  const pre = fakeDocument();
  assert.equal(typeof await load(pathToFileURL(path.join(assets, 'parser', PRE_1, 'parser.js')).href)(pre), 'function');
  assert.equal(pre.line.dataset.state, 'running');
  assert.equal(pre.line.text, 'Running prerelease 2026.10.14-pre.1, workbench a1b2c3d4e5f6. Its release page. Cut from a tree with uncommitted changes. Every panel is read again with it.');
  assert.deepEqual(pre.line.links, [`/parser/${PRE_1}/`]);
  const patch = fakeDocument();
  await load(pathToFileURL(path.join(assets, 'parser/2026.10.13-patch.1/parser.js')).href)(patch);
  assert.equal(patch.line.text, 'Running patch 2026.10.13-patch.1, workbench b1b2c3d4e5f6. Its release page. Every panel is read again with it.');
  // Outside a page, /parser.js does not resolve either: the loader says neither loaded, and stops.
  const lost = fakeDocument();
  await assert.rejects(load(pathToFileURL(path.join(assets, 'missing.js')).href)(lost), /could not load/);
  assert.equal(lost.line.dataset.state, 'failed');
  assert.match(lost.line.text, /^Neither file:.*missing\.js nor \/parser\.js loaded; the readings here are the worker's\.$/);
});
