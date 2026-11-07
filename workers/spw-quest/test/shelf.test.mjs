import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/index.js';
import { OPERATORS } from '../src/guide.js';
import { PAGE_CSP } from '../src/page.js';
import { SPECIMENS, planGroups } from '../src/specimens.js';
import { shelfPages } from '../src/shelf.js';
import { FORMS } from '../src/forms.js';
import { EXAMPLES } from '../src/examples.js';
import { readSpecimen } from '../src/specimen-reading.js';

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
// The asset binding serves a directory's index.html at its pretty path, as Workers assets do.
const env = { ASSETS: { fetch: async (request) => {
  const { pathname } = new URL(request.url);
  try {
    return new Response(await readFile(path.join(ASSETS, pathname, pathname.endsWith('/') ? 'index.html' : ''), 'utf8'), { status: 200 });
  } catch {
    return new Response('nf', { status: 404 });
  }
} } };
const get = (pathname, method = 'GET') => worker.fetch(new Request(`https://spw.quest${pathname}`, { method }), env, {});

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

test('the shelf\'s static pages on disk are the ones a fresh render writes', async () => {
  for (const [file, html] of shelfPages()) {
    assert.equal(await readFile(path.join(ASSETS, file), 'utf8'), html, `assets/${file}`);
  }
});

test('the landing starts with one search, then the operators as handles, then the ways in', async () => {
  assert.equal((await get('/shelf')).status, 301);
  assert.equal((await get('/shelf')).headers.get('location'), 'https://spw.quest/shelf/');
  const response = await get('/shelf/');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-security-policy'), PAGE_CSP);
  const page = await response.text();
  assertBalanced(page);
  assert.ok(page.length < 80_000, `the landing stays small (${page.length})`);
  const at = (marker) => page.indexOf(marker);
  assert.ok(at('id="find-title"') < at('id="ops-title"') && at('id="ops-title"') < at('id="browse-title"'), 'search, then handles, then tiles');
  assert.match(page, /<form action="\/specimens" method="get" role="search">/);
  const handles = [...page.matchAll(/<a class="handle" href="\/#op-([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(handles, OPERATORS.map((op) => op.name), 'each operator is a handle to its card in the guide');
  const guide = await (await get('/')).text();
  for (const name of handles) assert.ok(guide.includes(`id="op-${name}"`), `the guide holds #op-${name}`);
  const plans = SPECIMENS.filter(({ source }) => source === 'plans').length;
  assert.ok(page.includes(`<span class="name">Plans</span><span class="count">${plans}</span>`), 'the plans tile counts the plans');
  assert.ok(page.includes('href="/shelf/plans/"'));
  assert.equal((await get('/shelf/', 'HEAD')).status, 200);
});

test('the plans page groups every plan by its operation, each line opening on the pivot and as a canvas', async () => {
  const page = await (await get('/shelf/plans/')).text();
  assertBalanced(page);
  const groups = planGroups();
  for (const { mode, plans } of groups) {
    assert.ok(page.includes(`<section class="op-group" id="op-${mode}"`), mode);
    for (const plan of plans) {
      assert.ok(page.includes(`<li id="s-${plan.id}"><a href="/pivot?s=${plan.id}"><code><span data-t="frame">`), plan.id);
      assert.ok(page.includes(`href="/canvas?s=${plan.id}"`), plan.id);
    }
  }
  assert.equal(groups.reduce((sum, { plans }) => sum + plans.length, 0), SPECIMENS.filter(({ source }) => source === 'plans').length);
  assert.equal((await get('/shelf/nothing/')).status, 404);
});

test('forms side by side: each row opens in the editor and on the pivot, every sample script is listed, and every line reads', async () => {
  assert.equal((await get('/forms')).status, 301);
  const response = await get('/forms/');
  assert.equal(response.status, 200);
  const page = await response.text();
  assertBalanced(page);
  for (const { id, rows } of FORMS) {
    assert.ok(page.includes(`<section class="form-set" id="${id}"`), id);
    for (const [line] of rows) {
      assert.ok(page.includes(`href="/build?script=${encodeURIComponent(line)}#reading"`), `edit ${line}`);
      assert.ok(page.includes(`href="/pivot?line=${encodeURIComponent(line)}"`), `pivot ${line}`);
      const reading = readSpecimen(line);
      assert.ok(!reading.part && !reading.file, `${line} reads whole as one line`);
    }
  }
  for (const example of EXAMPLES) assert.ok(page.includes(`href="/?example=${example.id}#try"`), example.id);
  assert.match(page, /aria-current="page">Forms<\/a>/, 'the shelf rooms mark Forms as here');
});
