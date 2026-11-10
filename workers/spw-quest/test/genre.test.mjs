// One set of genre rules, said twice: spw.quest's reading (fileKit, which
// must stay self-contained to travel into its page) and the site's
// public/js/semantic/spw-genre-checks.js, which /tools/spw-parser/ shows
// with each rule's reason. This holds their sentences equal over every file
// the guide keeps, whole and with its point taken out.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../../../public/js/semantic/spw-workbench-reader.js';
import { GENRE_REASONS, readGenre } from '../../../public/js/semantic/spw-genre-checks.js';
import { EXAMPLES, exampleById } from '../src/examples.js';
import { readFile } from '../src/file-reader.js';

const GENRE_SAYS = /entr(y|ies)|question|\[(scene|change|verify)\]|what happened/;
const quest = (source) => readFile(source).checks.filter((check) => check.state !== 'info' && GENRE_SAYS.test(check.says)).map(({ state, says }) => ({ state, says }));
const site = (source) => readGenre(parse(source), source).checks.map(({ state, says }) => ({ state, says }));

test('the site and the quest ask a file of each kind the same thing, in the same words', () => {
  for (const example of EXAMPLES) assert.deepEqual(site(example.script), quest(example.script), example.id);
  const broken = [
    exampleById('revision').script.replace(/\n {2}\*\[verify\][^\n]*/, ''),
    exampleById('revision').script.replace(/\n {2}~\[scene\][^\n]*/, ''),
    exampleById('question').script.replace(/\n {2}!probe[^\n]*/, ''),
    exampleById('notebook').script.replace(/\] try — /, '] '),
    exampleById('notebook').script.replace(/\[2026-11-06 14:05\] /, ''),
  ];
  for (const source of broken) {
    assert.deepEqual(site(source), quest(source));
    assert.equal(site(source).filter((check) => check.state === 'fail').length, 1, source.slice(0, 40));
  }
});

test('a check names its genre, its reason, and the line to go to; identity is read beside it', () => {
  const notebook = exampleById('notebook').script;
  const loose = notebook.replace(/\[2026-11-06 14:05\] /, '');
  const reading = readGenre(parse(loose), loose);
  assert.deepEqual([reading.layers, reading.names], [['log'], ['lab_notebook']]);
  const [check] = reading.checks;
  assert.deepEqual([check.genre, check.state, check.why], ['log', 'fail', GENRE_REASONS.log]);
  assert.equal(loose.split('\n')[check.line - 1].trim(), '>>measure — --shape-panel read 22 times in 11 files, with three fallbacks');
  // A file of no known kind is asked nothing, and that is not a failure.
  assert.deepEqual(readGenre(parse('~door[ajar]'), '~door[ajar]'), { layers: [], names: [], checks: [] });
  assert.deepEqual(readGenre(parse('door[ {'), 'door[ {').checks, []);
  for (const why of Object.values(GENRE_REASONS)) assert.ok(why.length > 40 && why.endsWith('.'));
});
