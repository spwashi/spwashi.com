// /specimens: the shelf, the search by slot, and two lines side by side, all
// with scripts off. The carried data is held to a fresh harvest by
// `carry-specimens.mjs --check`, which npm run check:workers runs.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { SPECIMENS, compareSpecimens, findSpecimens, readQuery, specimenById } from '../src/specimens.js';
import { SPW_EXPRESSION_MANIFEST } from '../../../public/js/generated/spw-expressions.js';
import { BASE_SECURITY } from '../../lib/shell.js';

const get = (path, options) => worker.fetch(new Request(`https://spw.quest${path}`, options));
const PAGE_CSP = BASE_SECURITY['Content-Security-Policy'].replace("style-src 'unsafe-inline';", "style-src 'unsafe-inline'; font-src 'self';");
const text = async (path) => (await get(path)).text();
const unpaint = (html) => html.replace(/<span data-t="[^"]*">|<\/span>/g, '');

/** Every element this page opens is closed, in order (void elements aside). */
function assertBalanced(html) {
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  const body = html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '');
  const stack = [];
  for (const [, close, name] of body.matchAll(/<(\/?)([a-z][\w-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/g)) {
    if (VOID.has(name)) continue;
    if (!close) { stack.push(name); continue; }
    assert.equal(stack.pop(), name, `</${name}> closes what it did not open`);
  }
  assert.deepEqual(stack, [], 'every element is closed');
}

test('the shelf reads with scripts off: pressed forms, the pages\' rarer lines, and the gallery files', async () => {
  const response = await get('/specimens');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-security-policy'), PAGE_CSP, 'no script, so no script-src self');
  assert.match(response.headers.get('cache-control'), /max-age=300/);
  const page = await response.text();
  assertBalanced(page);
  assert.ok(page.length < 260_000, `the shelf stays under 260 KB (${page.length})`);
  assert.match(page, /<h1 id="specimens-title">Specimens<\/h1>/);
  for (const id of ['pressed', 'pages', 'gallery']) assert.match(page, new RegExp(`<section id="${id}" class="band"`), id);
  for (const specimen of SPECIMENS.filter(({ source }) => source !== 'routes')) {
    assert.ok(page.includes(`id="s-${specimen.id}"`), specimen.id);
  }
  // A herbarium form that departs from another offers the comparison with it.
  assert.match(page, /href="\/specimens\?a=h-prefixed_compound&amp;b=h-induct_join#compare">Against induct_join, where it departs from<\/a>/);
  // Each kind of rarer line says how many it holds; the first is open.
  const kinds = [...page.matchAll(/<details class="kind" id="pages-([a-z]+)"( open)?>\s*<summary>[^<]+<span class="count">(\d+)<\/span>/g)];
  assert.deepEqual(kinds.map((m) => m[1]), ['charged', 'joined', 'marked', 'scened']);
  assert.deepEqual(kinds.map((m) => Boolean(m[2])), [true, false, false, false]);
  assert.ok(kinds.every((m) => Number(m[3]) > 0));
  // Nothing on the guide changed for this page: the note shell is left alone.
  assert.doesNotMatch(await text('/'), /\/specimens/);
  assert.match(await text('/build'), /<a href="\/specimens">Specimens<\/a>/);
  assert.match(await text('/learn'), /<a href="\/specimens">Specimens<\/a>/);
  assert.equal(await (await get('/specimens', { method: 'HEAD' })).text(), '');
});

test('every expression the routes carry is on the shelf\'s search, at the section that holds it', async () => {
  const lines = new Set(SPECIMENS.filter(({ source }) => source === 'routes').map(({ line }) => line));
  for (const expression of Object.keys(SPW_EXPRESSION_MANIFEST)) assert.ok(lines.has(expression), expression);
  for (const specimen of SPECIMENS.filter(({ source }) => source === 'routes')) {
    assert.match(specimen.route, /^\/(?:[\w.-]+\/)*$/, specimen.id);
    assert.ok(specimen.section, `${specimen.id} lands on a section`);
    assert.equal(specimen.reading.part, undefined, `${specimen.line} is read whole`);
  }
  const page = await text('/specimens?q=medium%5B*%5D');
  assert.match(page, /href="https:\/\/spwashi\.com\/topics\/hypermedia\/#surface">spwashi\.com\/topics\/hypermedia\/#surface<\/a>/);
  // The herbarium and the gallery open in spwashi.com's parser.
  const shelf = await text('/specimens');
  assert.match(shelf, /href="https:\/\/spwashi\.com\/tools\/spw-parser\/\?spw_source=[^"]+&amp;spw_source_name=container-formations\.spw%23induct_join#literal-parser"/);
  assert.match(shelf, /href="https:\/\/spwashi\.com\/tools\/spw-parser\/\?spw_sample=contract#literal-parser">Open in spwashi\.com's parser<\/a>/);
});

test('a search names the slots it knows; every slot it names must hold', async () => {
  const lines = (q) => findSpecimens(readQuery(q)).map(({ line }) => line);
  assert.ok(lines('medium[*]').every((line) => /^medium\[[^\]]+\]/.test(line)));
  assert.ok(lines('[pi]').every((line) => /\[pi/.test(line)), 'a lens is read by its start');
  assert.ok(lines('{seed}').every((line) => /\{[^}]*seed/.test(line)));
  assert.ok(lines('<receipt>').every((line) => /<receipt>/.test(line)));
  assert.ok(lines('garden').length > 0, 'a bare word may sit in any slot');
  assert.ok(lines('surfaces[route]').includes('surfaces[route]{path.role}<publish>'));
  assert.ok(!lines('surfaces[craft]').includes('surfaces[route]{path.role}<publish>'), 'both slots must hold');
  // The right side of a join is searched too.
  assert.ok(lines('lift[whole]').includes('?open[edge]{aperture} ~ ^lift[whole]{parts}'));
  const page = await text('/specimens?q=medium%5B*%5D');
  assertBalanced(page);
  assert.match(page, /<h2 id="found-title">6 lines hold <code>medium\[\*\]<\/code><\/h2>/);
  assert.match(page, /<input id="q" name="q" type="search" value="medium\[\*\]"/);
  // Every example the form offers finds something.
  const examples = [...(await text('/specimens')).matchAll(/<li><a href="\/specimens\?q=([^"#]+)#found"><code>/g)];
  assert.equal(examples.length, 5);
  for (const [, q] of examples) assert.ok(findSpecimens(readQuery(decodeURIComponent(q.replace(/\+/g, ' ')))).length, q);
  const none = await text('/specimens?q=zzzz%5Bqqq%5D');
  assert.match(none, /No line here holds <code>zzzz\[qqq\]<\/code>/);
  const hostile = await text('/specimens?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
  assert.doesNotMatch(hostile, /<script>alert/);
  assert.match(hostile, /&lt;script&gt;alert/);
});

test('two lines read side by side: the ground they share, then the slot where they part', async () => {
  const reading = compareSpecimens(specimenById('h-prefixed_compound'), specimenById('h-induct_join'));
  assert.deepEqual(reading.ground, ['join']);
  assert.equal(reading.first, 'subject');
  assert.deepEqual(reading.moved, ['subject', 'mode', 'body', 'with']);
  const page = await text('/specimens?a=h-prefixed_compound&b=h-induct_join');
  assertBalanced(page);
  const compare = unpaint(page.match(/<section id="compare"[\s\S]*?<\/section>/)[0]);
  assert.match(compare, /<h3>The ground they share<\/h3>\s*<dl class="slots"><div><dt>join<\/dt><dd><code>~ induct<\/code><\/dd><\/div><\/dl>/);
  assert.match(compare, /They part first at <strong>subject<\/strong>, the word\./);
  assert.match(compare, /<tr class="first"><th scope="row">subject<\/th><td><code>\?open<\/code><\/td><td><code>a<\/code><\/td><\/tr>/);
  assert.match(compare, /href="\/specimens\?a=h-induct_join&amp;b=h-prefixed_compound#compare">Swap a and b<\/a>/);
  // The rest of the shelf now offers itself as b.
  assert.match(page, /href="\/specimens\?a=h-prefixed_compound&amp;b=h-triple#compare">Compare with this<\/a>/);
  // A line the slot reader takes in part says so, and so does the comparison.
  const partial = await text('/specimens?a=h-three_deep&b=h-one_deep');
  assert.match(partial, /The slot reader takes part of <code>three_deep<\/code> and <code>one_deep<\/code>/);
  // Holding one line asks for a second; unknown lines and files are not held.
  assert.match(await text('/specimens?a=h-capsule'), /Held: <code>capsule<\/code>\. Choose a second line below/);
  for (const path of ['/specimens?a=nope&b=h-capsule', '/specimens?a=g-contract', '/specimens?b=h-capsule']) {
    assert.doesNotMatch(await text(path), /<section id="compare"/, path);
  }
  // The same line in two places reads as one.
  const twice = SPECIMENS.find((specimen) => specimen.source === 'herbarium' && SPECIMENS.some((other) => other !== specimen && other.line === specimen.line));
  if (twice) {
    const other = SPECIMENS.find((specimen) => specimen !== twice && specimen.line === twice.line);
    assert.ok(compareSpecimens(twice, other).same);
  }
});
