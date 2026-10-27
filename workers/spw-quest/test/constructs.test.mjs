// /constructs and /pivot: the shapes a line takes, as cards you can walk
// between, and the lines one change away from any line. Both read with
// scripts off, keep their state in the address, and leave the guide alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { CONSTRUCT_KEYS, EDGES, USAGE, joinRows, namingQuestions } from '../src/constructs.js';
import { OPERATORS, CONTAINERS } from '../src/guide.js';
import { PIVOT_LIMIT, familiesOf, lineFrom, pivotState, pivotsOf } from '../src/pivot.js';
import { SPECIMENS } from '../src/specimens.js';
import { BASE_SECURITY } from '../../lib/shell.js';

const get = (path, options) => worker.fetch(new Request(`https://spw.quest${path}`, options));
const text = async (path) => (await get(path)).text();
const PAGE_CSP = BASE_SECURITY['Content-Security-Policy'].replace("style-src 'unsafe-inline';", "style-src 'unsafe-inline'; font-src 'self';");

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

test('the constructs read with scripts off: every mark and brace under its workbench name, and every name a door', async () => {
  const response = await get('/constructs');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-security-policy'), PAGE_CSP, 'no script, so no script-src self');
  const page = await response.text();
  assertBalanced(page);
  assert.ok(page.length < 160_000, `the page stays small (${page.length})`);
  for (const { name } of OPERATORS) assert.match(page, new RegExp(`id="c-${name}"`), name);
  for (const { name } of CONTAINERS) assert.match(page, new RegExp(`id="c-${name}"`), name);
  for (const key of CONSTRUCT_KEYS) assert.ok(page.includes(`id="c-${key}"`), key);
  // Every chip and anatomy part opens a card that is on the page.
  for (const [, target] of page.matchAll(/href="#(c-[\w-]+)"/g)) assert.ok(page.includes(`id="${target}"`), target);
  for (const family of ['braces', 'marks', 'line-forms', 'joins', 'file-forms', 'patterns']) assert.match(page, new RegExp(`id="${family}"`), family);
});

test('the map runs both ways: what a card holds names it as held, and every edge names a card', () => {
  for (const key of CONSTRUCT_KEYS) {
    for (const held of EDGES.holds.get(key)) {
      assert.ok(CONSTRUCT_KEYS.includes(held), `${key} holds ${held}`);
      assert.ok(EDGES.heldBy.get(held).has(key), `${held} is held by ${key}`);
    }
    for (const holder of EDGES.heldBy.get(key)) {
      assert.ok(CONSTRUCT_KEYS.includes(holder), `${key} is held by ${holder}`);
      assert.ok(EDGES.holds.get(holder).has(key), `${holder} holds ${key}`);
    }
  }
});

test('usage is the shelf\'s: joins and positions count the carried lines, and the open questions carry those counts', () => {
  const lines = SPECIMENS.filter(({ reading }) => !reading.file);
  assert.equal(USAGE.lines, lines.length);
  const joins = lines.filter(({ reading }) => reading.slots?.join).length;
  assert.equal(joinRows().filter((row) => row.where === 'between two lines').reduce((sum, row) => sum + row.n, 0), joins);
  assert.equal(USAGE.wordless, lines.filter(({ reading }) => reading.slots?.charge && !reading.slots?.subject).length);
  const questions = namingQuestions();
  assert.equal(questions.length, 5);
  assert.match(questions[0], /<em>project<\/em> names two forms/);
  assert.match(questions[1], /^<strong>Settled\.<\/strong>.*the slot reader calls an <code>@<\/code> join perspective/);
  assert.match(questions[4], new RegExp(`${USAGE.wordless} lines open with a valence word`));
});

test('a line writes back from its slots, keeping where its scene sat', () => {
  assert.equal(lineFrom({ subject: 'home', mode: 'hook', body: 'software.art.practice', scope: 'atlas', projection: 'person' }), 'home[hook]{software.art.practice}(atlas)<person>');
  assert.equal(lineFrom({ subject: 'look', body: 'stage', scope: 'year', projection: 'learn' }, { sceneFirst: true }), '(year)look{stage}<learn>');
  assert.equal(lineFrom({ charge: 'bane', mode: 'bone', body: 'limit' }), 'bane[bone]{limit}');
  assert.equal(lineFrom({ charge: 'boon', subject: 'home', mode: 'hook' }), 'boon home[hook]');
  assert.equal(lineFrom({ subject: 'a', mode: 'x', body: 'p', join: '~ induct', with: 'b[y]{q}' }), 'a[x]{p} ~ b[y]{q}');
});

test('a pivot changes one slot, names it, and lands either on the shelf or somewhere new', () => {
  const line = 'bane[bone]{limit}';
  const pivots = pivotsOf(line);
  assert.ok(pivots.length > 10);
  for (const pivot of pivots) assert.notEqual(pivot.line.replace(/\s+/g, ''), line, pivot.label);
  // A lens other lines with the same charge use lands on a line /about/ already carries.
  assert.ok(pivots.some((pivot) => pivot.line === 'bane[constraint]{limit}'));
  // A charge with no word is offered one.
  assert.ok(pivots.some((pivot) => pivot.kind === 'add' && pivot.slot === 'subject'));
  const joined = pivotsOf('a[x]{p} ~ b[y]{q}');
  assert.ok(joined.some((pivot) => pivot.line === 'a[x]{p} ^ b[y]{q}'), 'the join turns to another bond');
  assert.ok(joined.some((pivot) => pivot.line === 'b[y]{q}'), 'the join splits');
  assert.ok(familiesOf('theory[practice]').some(({ query, n }) => query === 'theory[*]' && n > 1));
});

test('the pivot page reads with scripts off, keeps the way back, and reflects nothing it should not', async () => {
  const empty = await get('/pivot');
  assert.equal(empty.status, 200);
  assert.equal(empty.headers.get('content-security-policy'), PAGE_CSP);
  const start = await empty.text();
  assertBalanced(start);
  assert.match(start, /<h2 id="starts-title">Start from one of these<\/h2>/);
  const page = await text('/pivot?s=r-e9dc9b1e');
  assertBalanced(page);
  assert.match(page, /lines one change away<\/h2>/);
  assert.match(page, /href="\/specimens\?a=r-e9dc9b1e&amp;b=r-[0-9a-f]+#compare">Compare with this line<\/a>/);
  assert.match(page, /<section class="slot-group" id="turn-charge"/);
  const back = await text(`/pivot?line=${encodeURIComponent('home[hook]')}&from=${encodeURIComponent('home[live]')}`);
  assert.match(back, /Back to <code>/);
  const hostile = await text(`/pivot?line=${encodeURIComponent('a[<script>alert(1)</script>]{x}')}`);
  assertBalanced(hostile);
  assert.doesNotMatch(hostile, /<script>alert/);
  assert.equal(pivotState(new URLSearchParams({ line: 'x'.repeat(PIVOT_LIMIT + 50) })).line.length, PIVOT_LIMIT);
  assert.equal(pivotState(new URLSearchParams({ line: 'a\nb' })).line, '');
  assert.equal(pivotState(new URLSearchParams({ s: 'g-contract' })).line, '', 'a gallery file is not one line');
  assert.equal(await (await get('/pivot', { method: 'HEAD' })).text(), '');
});

test('the new pages are reached from learn, build and the shelf, and the guide is left alone', async () => {
  const guide = await text('/');
  assert.doesNotMatch(guide, /\/constructs|\/pivot/);
  for (const path of ['/learn', '/build', '/specimens']) {
    const page = await text(path);
    assert.match(page, /<a href="\/constructs">Constructs<\/a>/, path);
    assert.match(page, /<a href="\/pivot">Pivot a line<\/a>/, path);
  }
  assert.match(await text('/specimens'), /<a href="\/pivot\?s=h-capsule">Pivot<\/a>/);
});
