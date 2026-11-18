import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { parse } from '../../public/js/semantic/spw-workbench-reader.js';
import { highlightSpw } from '../../public/js/semantic/spw-highlight.js';
import { PASTE_ACTIONS, actionLabel, doorLabel, readPaste, spwSegments, syncStaticDoors } from '../../public/js/modules/tools/spw-paste.js';
import { SEED_TEMPLATES, buildSeedText } from '../../public/js/modules/cards/seed-card.js';
import { ANSWER_EXAMPLES } from '../../workers/spw-quest/src/answer.js';
import { BUILD_KINDS } from '../../workers/spw-quest/src/build.js';
import { STARTERS } from '../../workers/spw-quest/src/starters.js';
import { exampleById } from '../../workers/spw-quest/src/examples.js';

const join = (segments) => segments.map((segment) => segment.text).join('');
const decodeHtml = (html) => html.replace(/<[^>]+>/g, '')
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&amp;', '&');

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

test('Spw that reads as Spw offers the canvas and spw.quest; prose and seeds do not', () => {
  const home = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const authored = home.match(/<textarea[^>]+name="spw_source"[^>]*>([^<]*)<\/textarea>/)[1]
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const doc = readPaste(authored, parse);
  assert.equal(doc.kind, 'document');
  assert.deepEqual(doc.doors.map(doorLabel), ['factshift.center', 'spw.quest']);
  const [canvas, build] = doc.doors.map((door) => new URL(door.href));
  assert.equal(Buffer.from(canvas.hash.replace('#spw64=', ''), 'base64url').toString('utf8'), authored.trim());
  assert.equal(build.searchParams.get('filename'), 'home_frame.spw');
  assert.equal(build.searchParams.get('script'), authored.trim());

  const line = readPaste('ink[apple]{bite.coaster}<A>', parse);
  assert.equal(new URL(line.doors[0].href).searchParams.get('spw'), 'ink[apple]{bite.coaster}<A>');
  assert.deepEqual(readPaste('just some words', parse).doors, []);
  assert.deepEqual(readPaste(buildSeedText(SEED_TEMPLATES.folio, 'A-12', { piece: 'No. 07' }), parse).doors, []);
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

test('syncStaticDoors keeps canvas and pivot links synced with live Spw and restores defaults on empty or prose', () => {
  const makeLink = (href) => {
    const attrs = new Map([['href', href]]);
    return {
      getAttribute: (name) => attrs.get(name) ?? null,
      setAttribute: (name, value) => attrs.set(name, String(value)),
    };
  };
  const canvasDoor = makeLink('https://factshift.center/?spw=default');
  const pivotDoor = makeLink('https://spw.quest/pivot?line=default');
  const host = {
    querySelector: (selector) => {
      if (selector === '.spw-card-door-canvas') return canvasDoor;
      if (selector === '.spw-card-door-pivot') return pivotDoor;
      return null;
    },
  };
  const defaults = {
    canvas: 'https://factshift.center/?spw=default',
    pivot: 'https://spw.quest/pivot?line=default',
  };

  syncStaticDoors(host, readPaste('leaf[moss]{listen}<grove>', parse), defaults);
  assert.equal(new URL(canvasDoor.getAttribute('href')).searchParams.get('spw'), 'leaf[moss]{listen}<grove>');
  assert.equal(new URL(pivotDoor.getAttribute('href')).searchParams.get('line'), 'leaf[moss]{listen}<grove>');

  syncStaticDoors(host, readPaste('#>custom\nstream[river]{carry}<bank>', parse), defaults);
  assert.ok(canvasDoor.getAttribute('href').includes('#spw64='));
  assert.equal(new URL(pivotDoor.getAttribute('href')).searchParams.get('line'), 'stream[river]{carry}<bank>');

  syncStaticDoors(host, readPaste('plain english words only', parse), defaults);
  assert.equal(canvasDoor.getAttribute('href'), defaults.canvas);
  assert.equal(pivotDoor.getAttribute('href'), defaults.pivot);

  syncStaticDoors(host, { kind: 'empty', source: '' }, defaults);
  assert.equal(canvasDoor.getAttribute('href'), defaults.canvas);
  assert.equal(pivotDoor.getAttribute('href'), defaults.pivot);
});

test('spw.quest starters, /llms.txt answers, build kits, and texture.website sheets paste cleanly into spwashi.com', () => {
  for (const starter of STARTERS) {
    const reading = readPaste(starter.line, parse);
    assert.equal(reading.kind, 'expression', `${starter.id} reads as an expression`);
    assert.deepEqual(reading.doors.map(doorLabel), ['factshift.center', 'spw.quest']);
    const highlighted = highlightSpw(starter.line, parse(starter.line, { eventPolicy: 'none' }).tokens);
    assert.equal(decodeHtml(highlighted), starter.line);
  }

  const cardReading = readPaste(ANSWER_EXAMPLES.card, parse);
  assert.equal(cardReading.kind, 'seed');
  assert.equal(cardReading.seed.templateKey, 'session');

  const wonderReading = readPaste(ANSWER_EXAMPLES.unknown, parse);
  assert.equal(wonderReading.kind, 'seed');
  assert.equal(wonderReading.seed.templateKey, 'wonder');

  const titledReading = readPaste(ANSWER_EXAMPLES.titled, parse);
  assert.equal(titledReading.kind, 'document');
  assert.equal(titledReading.seed, null, 'quoted ^seed["porch notes"] does not hijack a card template');
  const titledHtml = highlightSpw(ANSWER_EXAMPLES.titled, parse(ANSWER_EXAMPLES.titled, { eventPolicy: 'none' }).tokens);
  assert.match(titledHtml, /data-op="frame">#&gt;opening<\/span>/);
  assert.match(titledHtml, /data-op="layer">#:notes<\/span>/);
  assert.match(titledHtml, /data-op="action">#!draft<\/span>/);
  assert.match(titledHtml, /data-op="potential">~#expect<\/span>/);

  for (const kind of BUILD_KINDS) {
    const reading = readPaste(kind.script, parse);
    assert.equal(reading.kind, 'document', `${kind.kind} opens as a document`);
    assert.deepEqual(reading.doors.map(doorLabel), ['factshift.center', 'spw.quest']);
  }

  for (const id of ['cinema', 'debate']) {
    const example = exampleById(id);
    const reading = readPaste(example.script, parse);
    assert.equal(reading.kind, 'document', `${id} opens as a document`);
    assert.equal(decodeHtml(highlightSpw(example.script, parse(example.script, { eventPolicy: 'none' }).tokens)), example.script);
    assert.deepEqual(reading.doors.map(doorLabel), ['factshift.center', 'spw.quest']);
  }

  for (const personaLine of [
    'maya@[picture]{pacing, sound_lock}(friday)<cut>',
    'devon@[budget]{overtime, gear_return}(friday)<cut>',
    'priya@[story]{opening_scene, title_card}(tuesday)<cut>',
  ]) {
    const reading = readPaste(personaLine, parse);
    assert.equal(reading.kind, 'expression', `${personaLine} pastes as one perspective expression`);
    assert.match(
      highlightSpw(personaLine, parse(personaLine, { eventPolicy: 'none' }).tokens),
      /data-op="perspective">@<\/span>/,
    );
  }

  for (const material of ['vellum.spw', 'risograph-ink.spw', 'kintsugi.spw']) {
    const src = readFileSync(new URL(`../../workers/texture-website/assets/${material}`, import.meta.url), 'utf8');
    const reading = readPaste(src, parse);
    assert.equal(reading.kind, 'document', `${material} pastes as a document`);
    assert.equal(decodeHtml(highlightSpw(src, parse(src, { eventPolicy: 'none' }).tokens)), src, `${material} highlights losslessly`);
    assert.deepEqual(reading.doors.map(doorLabel), ['factshift.center', 'spw.quest']);
  }
});
