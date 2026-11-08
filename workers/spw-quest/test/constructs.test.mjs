// /constructs and /pivot: the shapes a line takes, as cards you can walk
// between, and the lines one change away from any line. Both read with
// scripts off, keep their state in the address, and leave the guide alone.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { CONSTRUCT_KEYS, EDGES, USAGE, joinRows, namingQuestions } from '../src/constructs.js';
import { OPERATORS, CONTAINERS } from '../src/guide.js';
import { PIVOT_LIMIT, familiesOf, lineFrom, pivotState, pivotsOf, withBodyPart, withFrontMark } from '../src/pivot.js';
import { SPECIMENS } from '../src/specimens.js';
import { BASE_SECURITY } from '../../lib/shell.js';

const get = (path, options) => worker.fetch(new Request(`https://spw.quest${path}`, options));
const text = async (path) => (await get(path)).text();
const PAGE_CSP = BASE_SECURITY['Content-Security-Policy'].replace("style-src 'unsafe-inline';", "style-src 'unsafe-inline'; font-src 'self'; manifest-src 'self';");

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

test('each brace pair names its slot wherever it sits, and a pivot keeps the order the line was written in', () => {
  // The guide's order pivots without losing its concept or its scene.
  const guide = pivotsOf('beans<food>(kitchen)[mode]{soak,cook,serve}');
  for (const pivot of guide.filter((item) => item.slot === 'mode' && item.kind !== 'drop')) assert.match(pivot.line, /^beans<food>\(kitchen\)\[/, pivot.label);
  assert.ok(guide.some((pivot) => pivot.line === 'beans<food>(kitchen){soak,cook,serve}'), 'dropping the lens keeps the concept and the scene');
  // A line with no word: three containers, its own order.
  const title = pivotsOf('{chronicles} <of> (narnia)');
  assert.ok(title.length > 3);
  assert.ok(title.every((pivot) => !pivot.line.includes('{chronicles}') || /^\{chronicles\}/.test(pivot.line)), 'the body stays first');
  // A body with parts turns how it holds them: one name, together, in order, a path.
  const turns = guide.filter((pivot) => pivot.slot === 'body' && pivot.kind === 'turn').map((pivot) => pivot.line);
  assert.deepEqual(turns, [
    'beans<food>(kitchen)[mode]{soak.cook.serve}',
    'beans<food>(kitchen)[mode]{soak;cook;serve}',
    'beans<food>(kitchen)[mode]{soak ~> cook ~> serve}',
  ]);
  // A one-part body has nothing to turn.
  assert.ok(!pivotsOf('bane[bone]{limit}').some((pivot) => pivot.kind === 'turn' && pivot.slot === 'body'));
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

test('into a line and between lines: its parts as handles, the operators primed then actualized, a part added by the link chosen, and the trail kept', async () => {
  const P = (q) => new URLSearchParams(q);
  const line = 'garden[care]{seed}';
  // Adding to the body: the link chosen joins the parts, and the line it came from is kept behind it.
  assert.equal(pivotState(P({ line, add: 'water', join: 'ident' })).line, 'garden[care]{seed.water}');
  assert.equal(pivotState(P({ line, add: 'water', join: 'common' })).line, 'garden[care]{seed,water}');
  assert.equal(pivotState(P({ line, add: 'water', join: 'ordinal' })).line, 'garden[care]{seed;water}');
  assert.equal(pivotState(P({ line, add: 'water', join: 'project' })).line, 'garden[care]{seed ~> water}');
  const added = pivotState(P({ line, add: 'wa}ter', join: 'ordinal' }));
  assert.equal(added.line, 'garden[care]{seed;water}', 'a brace typed into a part is dropped');
  assert.equal(added.from, line);
  assert.deepEqual(added.trail, [line]);
  assert.equal(withBodyPart('{a}', 'x', 'common'), null, 'a body with no word takes no part');
  assert.equal(withBodyPart('a[x]{p}\nb[y]{q}', 'x', 'common'), null, 'a file takes no part; one line at a time');
  // An operator in front: added, or replacing the mark there; a frame is left alone.
  assert.equal(withFrontMark(line, { sigil: '~' }), '~garden[care]{seed}');
  assert.equal(withFrontMark('?garden[care]{seed}', { sigil: '!' }), '!garden[care]{seed}');
  assert.equal(withFrontMark('#>plan[prime]{a}', { sigil: '~' }), null);
  const primed = await text(`/pivot?line=${encodeURIComponent(line)}&op=potential`);
  assertBalanced(primed);
  assert.match(primed, /<section class="operators" id="operators"/);
  assert.match(primed, /<a href="\/pivot\?line=garden%5Bcare%5D%7Bseed%7D#operators" aria-current="true"/, 'the active operator says so, and a second press lets it go');
  assert.match(primed, /<a href="\/pivot\?line=garden%5Bcare%5D%7Bseed%7D&amp;op=wonder#operators"/, 'another operator primes in its place');
  assert.match(primed, /<div class="primed" role="status" data-op-primed>/, 'primed, the panel shows');
  assert.match(primed, /<input type="range" name="opi" min="0" max="11" step="1" value="\d+" aria-label="Operator in front" aria-valuetext="~ potential" data-op-slider>/, 'the field is a slider set on the primed operator');
  assert.match(primed, /<ol class="op-ticks" style="--ticks: 12">/, 'every operator a tick on the field');
  assert.match(primed, /<script type="application\/json" data-op-lines>\[\{"index":0,/, 'each tick carries its line for the live slider');
  const scrubbed = await text(`/pivot?line=${encodeURIComponent(line)}&opi=0`);
  assert.match(scrubbed, /aria-valuetext="~ potential"/, 'scripts off, the slider submits its position and primes that operator');
  // The < & > move: a part keeps what it holds and turns its walls to the next empty pair; a full line has none to turn.
  const walls = pivotsOf(line).filter(({ kind }) => kind === 'walls').map(({ line: next }) => next);
  assert.deepEqual(walls, ['garden{seed}(care)', 'garden{seed}<care>', 'garden[care](seed)', 'garden[care]<seed>']);
  assert.deepEqual(pivotsOf('<&>').filter(({ kind }) => kind === 'walls').map(({ line: next }) => next), ['[&]', '{&}', '(&)'], 'the base form turns through every pair');
  assert.equal(pivotsOf('garden[care]{seed}(yard)<home>').filter(({ kind }) => kind === 'walls').length, 0);
  assert.match(await text('/pivot'), /<li class="base-form"><a href="\/pivot\?line=%3C%26%3E">/, 'the empty pivot offers the base form first');
  const idle = await text(`/pivot?line=${encodeURIComponent(line)}`);
  assert.ok(idle.includes('"mode":{"says":"the lens","turns":[{"label":"turn its walls to ( )"'), 'a first tap on a part turns its walls');
  assert.match(idle, /<div class="primed" role="status" data-op-primed hidden>/, 'nothing primed, nothing shown');
  assert.match(idle, /aria-valuetext="none chosen"/);
  assert.match(idle, /<div class="instrument" data-instrument>/, 'the parts are one instrument');
  assert.match(idle, /<script type="application\/json" data-slot-alts>\{/);
  assert.match(idle, /function instrument\(\)/, 'the gestures ride along as the page script');
  assert.match(primed, /<a class="actualize" data-op-go href="\/pivot\?line=%7Egarden%5Bcare%5D%7Bseed%7D&amp;from=garden%5Bcare%5D%7Bseed%7D&amp;t=garden%5Bcare%5D%7Bseed%7D">Actualize: go to this line<\/a>/);
  // Into the line: each part a handle to its turns; and the trail, origin ~> now.
  const page = await text(`/pivot?line=${encodeURIComponent(line)}&add=water&join=ordinal`);
  assertBalanced(page);
  assert.match(page, /Added <code>water<\/code>, hold the parts in order\./);
  for (const slot of ['subject', 'mode', 'body']) assert.ok(page.includes(`href="#turn-${slot}"`) && page.includes(`id="turn-${slot}"`), slot);
  assert.match(page, /<nav class="trail" aria-label="The way here"><ol><li><a href="\/pivot\?line=garden%5Bcare%5D%7Bseed%7D">/);
  assert.match(page, /<li class="sep" aria-hidden="true"><code>~&gt;<\/code><\/li><li aria-current="step">/);
  assert.match(page, /<form class="add-part" method="get" action="\/pivot">/);
  assert.match(page, /<input type="radio" name="join" value="ordinal" checked>/, 'the body\'s own link is the one offered first');
});
