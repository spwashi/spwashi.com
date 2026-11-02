import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { paceFor, readChapter, readMoments, readSharedSeries, sharesOf, wordsIn } from '../count-moments.mjs';

const chapter = (list) => `^"chapter"{
  slug = \`ch03-wonder\`
  number = \`3\`
  operator = \`?\`
  name = \`Wonder\`
  target = \`3846\`
}[reg=facet]

^"seeds"{
  lines = #[
    \`pad-wonder-about-pi-box · Wonder about pi\`
  ][reg=list]
}[reg=facet]

^"moments"{
  rule = \`one entry is one moment\`
  list = #[
${list}
  ][reg=list]
}[reg=facet]
`;

test('a chapter counts its moments by kind, and seeds do not count', () => {
  const text = chapter([
    '    `line · Honk Bazongas honks at the pie.`,',
    '    `panel · folio-honk-bazongas-graph-paper · The name, sideways, in teal.`,',
    '    `choice · Follow the honk? → yes | no`',
  ].join('\n'));
  const c = readChapter(text);
  assert.equal(c.number, 3);
  assert.equal(c.operator, '?');
  assert.equal(c.moments, 3);
  assert.deepEqual(c.kinds, { line: 1, panel: 1, choice: 1, other: 0 });
});

test('a panel counts its caption as words, not its slug', () => {
  assert.equal(wordsIn({ kind: 'panel', text: 'folio-honk-bazongas-graph-paper · The name, sideways.' }), 3);
  assert.equal(wordsIn({ kind: 'line', text: 'A line of five words.' }), 5);
});

test('an empty list is zero moments', () => {
  assert.equal(readMoments(chapter('')).length, 0);
});

test('the pace is even across November', () => {
  assert.equal(paceFor(50000, new Date(2026, 10, 1)), 1667);
  assert.equal(paceFor(50000, new Date(2026, 10, 15)), 25000);
  assert.equal(paceFor(50000, new Date(2026, 10, 30)), 50000);
  assert.equal(paceFor(50000, new Date(2026, 9, 31)), 0);
  assert.equal(paceFor(50000, new Date(2026, 11, 2)), 50000);
});

test('the lore.land outline holds thirteen chapters whose targets make 50,000', () => {
  const dir = '.spw/production/lore-land';
  const chapters = readdirSync(dir).filter((name) => /^ch\d+-/.test(name)).map((name) => readChapter(readFileSync(`${dir}/${name}`, 'utf8')));
  assert.equal(chapters.length, 13);
  assert.deepEqual(chapters.map((c) => c.number).sort((a, b) => a - b), [...Array(13).keys()]);
  assert.equal(chapters.reduce((sum, c) => sum + c.target, 0), 50000);
});

test('Post-Nut Clarity shares the 50,000 and keeps its own title', () => {
  assert.deepEqual(sharesOf(readFileSync('.spw/production/lore-land/series.spw', 'utf8')), ['post-nut-clarity']);
  const pnc = readSharedSeries('.spw/production/post-nut-clarity');
  assert.equal(pnc.title, 'Post-Nut Clarity');
  assert.ok(pnc.episodes >= 1);
  assert.equal(pnc.moments, pnc.kinds.line + pnc.kinds.panel + pnc.kinds.choice + pnc.kinds.other);
});
