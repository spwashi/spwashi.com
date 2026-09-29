import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from '../../public/js/semantic/spw-workbench-parser.js';
import {
  ARC_BENCH_LIMITS,
  arcSlug,
  arcSlugs,
  arcString,
  mount,
  readArcBench,
  serializeArcBench,
} from '../../public/js/modules/projects/arc-bench.js';

const parsesClean = (source) => {
  const result = parse(source);
  assert.equal(result.success, true, source);
  assert.equal(result.errors.length, 0, source);
  assert.equal(result.warnings.length, 0, `${source}\n${JSON.stringify(result.warnings)}`);
  assert.equal(result.completeness?.complete, true, source);
  assert.equal(result.completeness?.proseFallback, false, source);
};

test('slugs and strings are safe Spw', () => {
  assert.equal(arcSlug('Hiring Team!'), 'hiring_team');
  assert.equal(arcSlug('Café crew'), 'cafe_crew');
  assert.equal(arcSlug('2026 work'), 'n2026_work');
  assert.equal(arcSlug('  ', 'element'), 'element');
  assert.equal(arcString('say "hi" \\ now\nplease'), '"say \\"hi\\" \\\\ now please"');
});

test('one arc per audience seat, beats in the writer\'s order, taste line last', () => {
  const text = serializeArcBench({
    element: 'Spw workbench',
    audiences: ['a hiring team', '', 'my mother'],
    beats: ['where it started', 'the turn', '', 'what it holds now'],
    lines: [
      ['I needed a notation', 'it learned braces', '', 'others open it'],
      ['', '', '', ''],
      ['I drew boxes', '', '', 'you can use it'],
    ],
  });
  const lines = text.split('\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], 'arc[a_hiring_team]{"I needed a notation"; "it learned braces"; "others open it"}<spw_workbench>');
  assert.equal(lines[1], 'arc[my_mother]{"I drew boxes"; ""; "you can use it"}<spw_workbench>');
  assert.equal(lines[2], 'taste[arc]{element = "Spw workbench"; beats = #["where it started", "the turn", "what it holds now"]; audiences = #["a hiring team", "my mother"]}');
  parsesClean(text);
  lines.forEach(parsesClean);
});

test('lines written under an unnamed beat or audience are kept in a positional seat', () => {
  const text = serializeArcBench({
    element: 'e',
    audiences: ['a', ''],
    beats: ['', '', 'named'],
    lines: [['first', '', ''], ['', 'second', '']],
  });
  const lines = text.split('\n');
  assert.equal(lines[0], 'arc[a]{"first"; ""; ""}<e>');
  assert.equal(lines[1], 'arc[audience_2]{""; "second"; ""}<e>');
  assert.equal(lines[2], 'taste[arc]{element = "e"; beats = #["", "", "named"]; audiences = #["a", ""]}');
  parsesClean(text);
});

test('names in another script, or that repeat, still give distinct arc heads', () => {
  const text = serializeArcBench({
    element: '仕事',
    audiences: ['チーム', '家族', '母'],
    beats: ['一', '二'],
    lines: [['a', 'b'], ['c', 'd'], ['e', 'f']],
  });
  const heads = text.split('\n').slice(0, 3).map((line) => line.slice(0, line.indexOf('{')));
  assert.deepEqual(heads, ['arc[audience_1]', 'arc[audience_2]', 'arc[audience_3]']);
  assert.match(text, /<element>$/m);
  assert.match(text, /audiences = #\["チーム", "家族", "母"\]/);
  parsesClean(text);

  const dupes = serializeArcBench({ element: 'e', audiences: ['Team!', 'team', 'TEAM'], beats: ['b'], lines: [['x'], ['y'], ['z']] });
  assert.deepEqual(dupes.split('\n').slice(0, 3).map((line) => line.slice(0, line.indexOf('{'))), ['arc[team]', 'arc[team_2]', 'arc[team_3]']);
  parsesClean(dupes);
  assert.deepEqual(arcSlugs(['', 'x', 'x_2', 'x'], [0, 1, 2, 3], 'audience'), ['audience_1', 'x', 'x_2', 'x_4']);
  assert.equal(arcSlug('Straße'), 'strasse');
});

test('an empty bench still serializes to a clean taste line and carries no default words', () => {
  const text = serializeArcBench({});
  assert.equal(text, 'taste[arc]{element = ""; beats = #[]; audiences = #[]}');
  parsesClean(text);
});

test('awkward writer input still parses', () => {
  const text = serializeArcBench({
    element: '"quoted" {braces} <angles> ; semis',
    audiences: ['[mode] people', 'ünïcode'],
    beats: ['a.b.c', 'x; y'],
    lines: [['then.turn.now', 'a "quote" \\ slash'], ['}', '<']],
  });
  parsesClean(text);
});

test('limits hold at three audiences and four beats', () => {
  const text = serializeArcBench({
    element: 'e',
    audiences: ['a', 'b', 'c', 'd'],
    beats: ['1', '2', '3', '4', '5'],
    lines: [['l', 'l', 'l', 'l', 'l']],
  });
  assert.equal(text.split('\n').length, ARC_BENCH_LIMITS.audiences + 1);
  assert.equal(text.split('\n')[0].split(';').length, ARC_BENCH_LIMITS.beats);
});

test('the authored /projects/ fields are the ones the reader expects', () => {
  const html = readFileSync(new URL('../../projects/index.html', import.meta.url), 'utf8');
  const start = html.indexOf('<section class="arc-bench"');
  assert.ok(start > 0, 'arc bench section exists');
  const section = html.slice(start, html.indexOf('</section>', start));
  assert.match(section, /<section class="arc-bench" id="arc-bench" hidden/);
  assert.doesNotMatch(section, /data-spw-/, 'no data-spw-* so search and cauldron do not advertise it');
  const names = new Set([...section.matchAll(/name="([^"]+)"/g)].map((m) => m[1]));
  const expected = ['arc-element'];
  for (let a = 1; a <= 3; a += 1) expected.push(`arc-audience-${a}`);
  for (let b = 1; b <= 4; b += 1) expected.push(`arc-beat-${b}`);
  for (let a = 1; a <= 3; a += 1) for (let b = 1; b <= 4; b += 1) expected.push(`arc-line-${a}-${b}`);
  assert.deepEqual([...names].sort(), expected.sort());
  assert.equal((html.match(/href="[^"]*#arc-bench"/g) || []).length, 0, 'projects/index.html does not link to the bench');

  /* No DOM parser in the module suite: a fake root built from the authored
     names and label hooks stands in for the section. */
  const listeners = new Map();
  const make = (attrs = {}) => Object.assign(Object.create(HTMLElement.prototype), { value: '', textContent: '', hidden: false, dataset: {}, attrs,
    getAttribute(name) { return this.attrs[name] ?? null; } });
  const fields = new Map([...names].map((name) => [name, make()]));
  const beatLabels = [...section.matchAll(/data-arc-beat-label="(\d)">([^<]+)</g)].map((m) => Object.assign(make({ 'data-arc-beat-label': m[1] }), { textContent: m[2] }));
  const audienceLabels = [...section.matchAll(/data-arc-audience-label="(\d)">([^<]+)</g)].map((m) => Object.assign(make({ 'data-arc-audience-label': m[1] }), { textContent: m[2] }));
  const out = make();
  const exits = Object.assign(make(), { hidden: true });
  const form = Object.assign(make(), {
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type) { listeners.delete(type); },
  });
  const root = Object.assign(make(), {
    querySelector(selector) {
      const named = selector.match(/^\[name="([^"]+)"\]$/);
      if (named) return fields.get(named[1]) || null;
      return { form, '[data-arc-output]': out, '[data-arc-exits]': exits }[selector] || null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-arc-beat-label]') return beatLabels;
      if (selector === '[data-arc-audience-label]') return audienceLabels;
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
  });
  fields.get('arc-element').value = 'folios';
  fields.get('arc-audience-1').value = 'a neighbor';
  fields.get('arc-beat-1').value = 'the first sheet';
  fields.get('arc-line-1-1').value = 'I laminated a drawing';
  const state = readArcBench(root);
  assert.equal(state.lines[0][0], 'I laminated a drawing');
  const unmount = mount(root);
  assert.match(out.textContent, /^arc\[a_neighbor\]\{"I laminated a drawing"\}<folios>$/m);
  assert.equal(exits.hidden, false);
  assert.equal(beatLabels.length, 12);
  assert.equal(beatLabels[0].textContent, 'Line for the first sheet');
  assert.equal(beatLabels[1].textContent, 'Line for beat 2');
  assert.equal(audienceLabels[0].textContent, 'For a neighbor');
  fields.get('arc-audience-1').value = '';
  listeners.get('input')();
  assert.equal(audienceLabels[0].textContent, 'For audience 1');
  unmount();
  assert.equal(listeners.size, 0);
  assert.equal(exits.hidden, true);
});

test('nothing on the site links to the bench', () => {
  const repo = fileURLToPath(new URL('../../', import.meta.url));
  let hits = '';
  try {
    hits = execFileSync('git', ['grep', '--untracked', '-l', '-E', '#arc-bench["\'?]', '--',
      '*.html', '*.js', '*.mjs', '*.json', '*.xml', '*.txt', ':!scripts/tests/**', ':!public/js/modules/projects/**', ':!public/js/runtime/catalog/**'],
    { cwd: repo, encoding: 'utf8' });
  } catch (error) {
    if (error.status !== 1) throw error; /* 1 = no match */
  }
  assert.equal(hits.trim(), '', `links or references to #arc-bench found:\n${hits}`);
});
