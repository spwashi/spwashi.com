import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { parse } from '../../public/js/semantic/spw-workbench-parser.js';
import { PASTE_ACTIONS, actionLabel, readPaste, spwSegments } from '../../public/js/modules/tools/spw-paste.js';
import { SEED_TEMPLATES, buildSeedText } from '../../public/js/modules/cards/seed-card.js';

const join = (segments) => segments.map((segment) => segment.text).join('');

test('segments carry every character of the paste, in order', () => {
  const sources = [
    'ink[apple]{bite.coaster.margin}<A>',
    '#>note\n^"plate"{\n  word = `Apple`\n  path = ~"../x.spw"\n}[reg=facet]\n',
    '◌[regard]{a.b.c}(costume)<you> — what stayed',
    'plain words with no operators at all',
  ];
  for (const source of sources) {
    assert.equal(join(readPaste(source, parse).segments), source);
  }
});

test('operators and brackets name their canon type', () => {
  const { segments } = readPaste('#>note ^"plate"{ ?["why"] }', parse);
  const typed = Object.fromEntries(segments.filter((s) => s.operator).map((s) => [s.text, s.operator]));
  assert.equal(typed['#>note'], 'frame');
  assert.equal(typed['^'], 'integration');
  assert.equal(typed['?'], 'wonder');
  assert.equal(typed['{'], 'direction');
  assert.equal(typed['}'], 'direction');
});

test('a document opens as a room first; an expression reads in the parser first', () => {
  const doc = readPaste('#>note\n^"plate"{ word = `Apple` }[reg=facet]', parse);
  assert.equal(doc.kind, 'document');
  assert.equal(doc.frames, 1);
  assert.deepEqual(doc.actions, ['room', 'parser', 'save']);

  const expression = readPaste('ink[apple]{bite.coaster}<A>', parse);
  assert.equal(expression.kind, 'expression');
  assert.deepEqual(expression.actions, ['parser', 'room', 'save']);
  assert.match(expression.reading, /one expression/);
});

test('prose is named gently, and an empty paste offers nothing', () => {
  const prose = readPaste('just some words', parse);
  assert.equal(prose.kind, 'prose');
  assert.deepEqual(prose.actions, ['parser']);
  assert.equal(readPaste('   ', parse).kind, 'empty');
  assert.deepEqual(readPaste('', parse).actions, []);
});

test('a source too long for a parser link goes to the room instead', () => {
  const long = `#>long\n${'^"row"{ a = 1 }\n'.repeat(500)}`;
  const reading = readPaste(long, parse);
  assert.ok(long.length > 6000);
  assert.ok(!reading.actions.includes('parser'));
  assert.equal(reading.actions[0], 'room');
  assert.match(reading.reading, /room is the way in/);
});

test('every action has a plain label, and home hosts the box with a working form', () => {
  for (const label of Object.values(PASTE_ACTIONS)) assert.match(label, /^[A-Z][a-z .]+/);
  const home = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.ok(/<form[^>]+action="\/tools\/spw-parser\/"[^>]+method="get"[^>]+data-paste-open="page"/.test(home), 'home hosts a GET form to the parser');
  assert.ok(/<textarea[^>]+name="spw_source"/.test(home), 'the form posts its text as spw_source');
});

test('a copied seed reads as its card and can go home to fill it', () => {
  const text = buildSeedText(SEED_TEMPLATES.folio, 'A-12', { piece: 'No. 07', form: 'original' });
  const reading = readPaste(`my order:\n${text}`, parse);
  assert.equal(reading.kind, 'seed');
  assert.equal(reading.seed.templateKey, 'folio');
  assert.deepEqual(reading.actions, ['card', 'home', 'parser', 'save']);
  assert.match(reading.reading, /folio order card: 2 of 5 lines filled/);
  assert.equal(actionLabel('home', reading), 'Fill its card on Art');
  assert.equal(actionLabel('card', reading), 'Open it as a card');
});

test('a costume sheet goes home to Costuming', () => {
  const reading = readPaste(buildSeedText(SEED_TEMPLATES.costuming, '2026', { appeared: 'a heron', affirms: 'patience' }), parse);
  assert.equal(reading.kind, 'seed');
  assert.equal(actionLabel('home', reading), 'Fill its card on Costuming');
});
