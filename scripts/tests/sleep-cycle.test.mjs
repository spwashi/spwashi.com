import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { parse } from '../../public/js/semantic/spw-workbench-reader.js';
import { changeOf, diffProbes, measure, normalizeObservation, paid, probeDigest, rankMoved, renderWake, replay, retireCandidates, runKeys, seeded, staleStills } from '../lib/sleep-cycle.mjs';

const open = (id, question, extra = {}) => ({ id, key: `k-${id}`, file: `.spw/${id}.spw`, line: 1, question, lifecycle: 'open', probes: [], ...extra });

test('a probe has moved only if something besides the clock or a line shift changed', () => {
  assert.equal(normalizeObservation('a.js:12:took 40ms, 110d'), normalizeObservation('a.js:99:took 7ms, 124d'));
  assert.notEqual(normalizeObservation('389'), normalizeObservation('461'));
  const previous = { w_a: { digest: probeDigest('a.js:1:hit'), observation: 'a.js:1:hit' }, w_b: { digest: probeDigest('5'), observation: '5' } };
  const runs = [{ wonder: 'w-a', file: 'a', observation: 'a.js:2:hit', digest: probeDigest('a.js:2:hit') }, { wonder: 'w-b', file: 'b', observation: '4', digest: probeDigest('4') }, { wonder: 'w-c', file: 'c', observation: 'x', digest: probeDigest('x') }];
  const { moved, steady, fresh } = diffProbes(previous, runs);
  assert.deepEqual([moved.map((item) => [item.key, item.was, item.now]), steady, fresh], [[['w_b', '5', '4']], 1, 1]);
});

test('the digest hears a change and not a shift, on the shapes probes really print', () => {
  // rg -c, from wonder_ecosystem_specimen_host: the trailing number is the finding.
  assert.notEqual(probeDigest('public/js/interface/spw-expression.js:1\nworkers/a.js:1'), probeDigest('public/js/interface/spw-expression.js:2\nworkers/a.js:1'));
  // rg -n on one file, from wonder_reference_assignment_word_lists: the leading number is a position.
  assert.equal(probeDigest('60:- Material: paper, vellum\n62:- Motion: fold, bloom'), probeDigest('75:- Material: paper, vellum\n77:- Motion: fold, bloom'));
  assert.notEqual(probeDigest('60:- Material: paper'), probeDigest('60:- Material: glass'));
  // rg -A context, from wonder_ecosystem_what_travels.
  assert.equal(probeDigest('284-\n285-/** The address */\n286-export function a() {'), probeDigest('285-\n286-/** The address */\n287-export function a() {'));
  assert.equal(probeDigest('a/b.js-12-text\na/b.js:13:hit'), probeDigest('a/b.js-40-text\na/b.js:41:hit'));
  // wc -l: a count at the start of a line, with no separator, stays.
  assert.notEqual(probeDigest('1526 public/js/kernel/shared.js'), probeDigest('1528 public/js/kernel/shared.js'));
  // A bare number is the whole answer.
  assert.notEqual(probeDigest('5'), probeDigest('4'));
});

test('thread order is not a change: rg printing the same hits in another order holds', () => {
  assert.equal(probeDigest('b.js:9:x\na.js:1:y\n'), probeDigest('a.js:40:y\nb.js:2:x'));
  assert.notEqual(probeDigest('a.js:1:y\nb.js:2:x'), probeDigest('a.js:1:y\nb.js:2:x\nc.js:3:z'));
});

test('a wonder with several probes keeps the keys its receipts use', () => {
  assert.deepEqual(runKeys([{ wonder: 'w-a' }, { wonder: 'w-a' }, { wonder: 'w-b' }]), ['w_a', 'w_a_2', 'w_b']);
});

test('the note leads with what can be judged, and a small change does not outrank a large one', () => {
  assert.equal(changeOf('a b c', 'a b c'), 0);
  assert.equal(changeOf('a', 'b'), 1);
  const moved = [
    { key: 'big', was: 'one two', now: 'three four' },
    { key: 'small', was: 'one two three four', now: 'one two three five', expect: 'x' },
    { key: 'mid', was: 'one two', now: 'one three' },
  ];
  assert.deepEqual(rankMoved(moved, 2).map((item) => item.key), ['small', 'big']);
});

test('a night is judged by what it closed: adding questions is accreting', () => {
  assert.equal(measure(null, { open: 9, answered: 1, retired: 0 }).verdict, 'first night');
  const before = { open: 10, answered: 2, retired: 0 };
  assert.equal(measure(before, { open: 9, answered: 3, retired: 0 }).verdict, 'settling');
  assert.equal(measure(before, { open: 10, answered: 3, retired: 0 }).verdict, 'settling');
  assert.equal(measure(before, { open: 12, answered: 3, retired: 0 }).verdict, 'accreting');
  assert.equal(measure(before, { open: 10, answered: 2, retired: 0 }).verdict, 'still');
});

test('replay finds a cold question the day spoke of, not one it touched, and no long question wins by length', () => {
  const wonders = [
    open('cold', 'Does the hamburger drawer hold focus?'),
    open('touched', 'Does the hamburger drawer hold focus again?', { file: '.spw/touched.spw' }),
    open('long', 'Would many several assorted unrelated considerations about gardens, tomatoes, compost, trellises, seedlings, mulch and drawer hamburger matter?'),
    open('other', 'Which glaze cracks in winter?'),
    open('closed', 'Does the hamburger drawer close?', { lifecycle: 'answered' }),
  ];
  const found = replay(wonders, 'fix the hamburger drawer focus', ['.spw/touched.spw']);
  assert.deepEqual(found.map(({ wonder }) => wonder.id), ['cold']);
  assert.deepEqual(found[0].shared.sort(), ['drawer', 'focus', 'hamburger']);
});

test('retire offers only quiet questions that say neither what to expect nor how to check', () => {
  const wonders = [open('old', 'a?'), open('newer', 'b?'), open('expects', 'c?', { expect: 'x' }), open('runs', 'd?', { probeKind: 'run' }), open('done', 'e?', { lifecycle: 'answered' })];
  const ages = { '.spw/old.spw': 200, '.spw/newer.spw': 10, '.spw/expects.spw': 300, '.spw/runs.spw': 300 };
  assert.deepEqual(retireCandidates(wonders, (file) => ages[file]).map(({ wonder, days }) => [wonder.id, days]), [['old', 200], ['newer', 10]]);
});

test('a still is stale when its page changed after it was taken', () => {
  const captures = { a: { at: 100, file: 'a.jpg' }, b: { at: 300, file: 'b.jpg' } };
  const result = staleStills([{ id: 'a', specimenRoute: '/a/' }, { id: 'b', specimenRoute: '/b/' }, { id: 'c', specimenRoute: '/c/' }], (id) => captures[id], () => 200);
  assert.deepEqual([result.stale.map((still) => still.id), result.current.map((still) => still.id), result.missing], [['a'], ['b'], 1]);
});

test('seeded picks repeat for a seed, and the last note is scored by what it led to', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f'];
  assert.deepEqual(seeded(items, 's', 3), seeded([...items].reverse(), 's', 3));
  assert.notDeepEqual(seeded(items, 's', 6), seeded(items, 't', 6));
  const wonders = [open('still', 'a?'), open('done', 'b?', { lifecycle: 'answered' }), open('probed', 'c?', { probed: '2026-11-11' })];
  assert.deepEqual(paid(['k-still', 'k-done', 'k-probed', 'k-gone'], wonders, {}), { offered: 4, settled: 3 });
});

test('the note is Spw a reader can parse, and stays short with everything full', () => {
  const many = Array.from({ length: 40 }, (_, index) => ({ key: `w_${index}`, wonder: `w-${index}`, file: 'a.spw', was: 'one "two"', now: 'three `four`', expect: 'it holds' }));
  const wonder = open('a', 'Does it hold?');
  const note = renderWake({
    stamp: '2026-11-10 18:00', revision: 'abc', since: 'def', tally: measure({ open: 5, answered: 1, retired: 0 }, { open: 4, answered: 2, retired: 0 }), lastPaid: { offered: 3, settled: 1 },
    opened: [wonder], settled: ['x'], moved: many, steady: 2, fresh: 1, replayed: [{ wonder, shared: ['a', 'b'] }],
    stills: { stale: Array.from({ length: 9 }, (_, index) => ({ id: `s${index}`, route: '/', file: 'a.jpg' })), current: [], missing: 0, look: 'b.jpg' }, stillProbes: [{ wonder, ink: 'home-opening' }],
    retire: [{ wonder, days: 9 }], seed: '2026-11-10', babble: { total: 3, fresh: 1, undoored: 2, picks: [{ from: 'a[b]', fromRoute: '/a/', to: 'a[c]', toRoute: '/b/' }] }, capture: 'npm run sense -- wander x --run',
  });
  const result = parse(note);
  assert.equal(result.success, true);
  assert.equal(result.completeness?.proseFallback, false);
  assert.ok(note.split('\n').length < 110, `${note.split('\n').length} lines`);
  assert.match(note, /measure = "settling: 4 not closed, 2 answered, 0 retired; was 5 not closed/);
  assert.match(note, /last_note = "offered 3 questions; 1 settled or probed since"/);
});

test('sleep writes only under .spw/gen, and never asks', () => {
  const source = readFileSync(new URL('../sleep.mjs', import.meta.url), 'utf8');
  const writes = [...source.matchAll(/(?:writeFileSync|appendFileSync|mkdirSync)\(([^,)]+)/g)].map(([, target]) => target.trim());
  assert.ok(writes.length >= 4);
  for (const target of writes) assert.match(target, /^(?:OUT|WAKE|STATE|path\.join\(OUT)/, target);
  assert.ok(source.includes("join(ROOT, '.spw/gen/sleep')"));
  assert.doesNotMatch(source, /\?\["/, 'a sleep does not write a wonder');
});
