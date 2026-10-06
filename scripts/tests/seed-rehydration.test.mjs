import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { SEED_HOMES, SEED_TEMPLATES, buildSeedText, readSeedText } from '../../public/js/modules/cards/seed-card.js';

const TRICKY = ['plain words', 'a "quoted" word', 'two\nlines', 'a back\\slash', '◌[regard]{a.b}<you> — and more', ''];

test('every template reads back exactly what it writes', () => {
  for (const [key, template] of Object.entries(SEED_TEMPLATES)) {
    const values = Object.fromEntries(template.fields.map((field, i) => [field.key, TRICKY[i % TRICKY.length]]));
    const seed = readSeedText(buildSeedText(template, '2026', values));
    assert.equal(seed?.templateKey, key, key);
    assert.equal(seed.mark, '2026');
    assert.deepEqual(seed.values, values, key);
  }
});

test('a plain value writes the same line it always did', () => {
  const text = buildSeedText(SEED_TEMPLATES.newyear, '2026', { threshold: 'old year into new', vow: 'draw daily' });
  assert.match(text, /^\^seed\[NewYear\.Joy year:2026\]\{\n {2}threshold : "old year into new"\n {2}vow {7}: "draw daily"\n/);
});

test('a seed copied before values were escaped still reads', () => {
  const legacy = '^seed[Folio.Order ref:A-12]{\n  piece     : "No. 07, the "bean" one"\n  form      : "original"\n  story     : "a scene\nthat ran long"\n  range     : ""\n  relay     : "DM on TikTok"\n}';
  const seed = readSeedText(legacy);
  assert.equal(seed.templateKey, 'folio');
  assert.equal(seed.mark, 'A-12');
  assert.equal(seed.values.piece, 'No. 07, the "bean" one');
  assert.equal(seed.values.story, 'a scene\nthat ran long');
  assert.equal(seed.values.relay, 'DM on TikTok');
  assert.equal(seed.filled, 4);
});

test('text around a seed is ignored, the earliest seed wins, and text without one is not a seed', () => {
  const ask = buildSeedText(SEED_TEMPLATES.ask, 'now', { need: 'lunch' });
  const wonder = buildSeedText(SEED_TEMPLATES.wonder, '2026', { question: 'why tables?' });
  const seed = readSeedText(`here is my card:\n${ask}\nand another\n${wonder}`);
  assert.equal(seed.templateKey, 'ask');
  assert.equal(seed.values.need, 'lunch');
  assert.equal(readSeedText('ink[apple]{bite.coaster}<A>'), null);
  assert.equal(readSeedText(''), null);
});

test('every template has a home whose card exists and offers it', () => {
  for (const key of Object.keys(SEED_TEMPLATES)) {
    const home = SEED_HOMES[key];
    assert.ok(home, `${key} has a home`);
    const route = home.href.split('#')[0].replace(/^\//, '');
    const html = readFileSync(new URL(`../../${route}index.html`, import.meta.url), 'utf8');
    const card = new RegExp(`<div[^>]*\\bid="${home.card}"[^>]*>`).exec(html)?.[0]
      ?? new RegExp(`<div\\b(?=[^>]*\\bid="${home.card}")[\\s\\S]*?>`).exec(html)?.[0];
    assert.ok(card, `${home.card} is on ${home.href}`);
    const named = /data-templates="([^"]*)"/.exec(card)?.[1];
    const offers = named ? named.split(/[\s,]+/) : Object.keys(SEED_TEMPLATES).filter((k) => !SEED_TEMPLATES[k].pinned);
    assert.ok(offers.includes(key), `${home.card} offers ${key}`);
    assert.ok(html.includes(`id="${home.href.split('#')[1]}"`), `${home.href} lands on an anchor`);
  }
});
