// /llms.txt teaches a model to answer in Spw (src/answer.js). What it shows has
// to be what the tools read: an example that fails its own genre check, or a
// card that does not open as a card, teaches the wrong thing to every reader.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { parse } from '../../../public/js/semantic/spw-workbench-reader.js';
import { readGenre } from '../../../public/js/semantic/spw-genre-checks.js';
import { ADDRESS_INDEX, FULL_INDEX } from '../src/addresses.js';
import { ANSWER_EXAMPLES, MARK_SAYS, cardReading, kinOf, lineFromPath } from '../src/answer.js';
import { EXAMPLES } from '../src/examples.js';
import { OPERATORS } from '../src/guide.js';

const get = (path, headers = {}) => worker.fetch(new Request(`https://spw.quest${path}`, { headers }), {});

// seed-card.js is held to this card in scripts/tests/seed-rehydration.test.mjs; here it is only read for its fields.
const seedOf = (text, sigil) => {
  const at = text.indexOf(sigil);
  if (at < 0) return null;
  return Object.fromEntries([...text.slice(text.indexOf('{', at)).matchAll(/([A-Za-z_][\w-]*)\s*:\s*"([^"]*)"/g)].map(([, key, value]) => [key, value]));
};

test('every mark is taught, under the name the guide gives it', () => {
  assert.deepEqual(MARK_SAYS.map(([sigil, name]) => [sigil, name]), OPERATORS.map(({ sigil, name }) => [sigil, name]));
  for (const [sigil, name, says] of MARK_SAYS) assert.ok(ADDRESS_INDEX.includes(`- ${sigil} ${name}: ${says}`), name);
});

test('each worked answer parses, passes its genre, and appears in the index', () => {
  for (const [kind, source] of Object.entries(ANSWER_EXAMPLES)) {
    const output = parse(source);
    assert.ok(output.success, kind);
    assert.deepEqual(output.errors, [], kind);
    assert.deepEqual(readGenre(output, source).checks.filter((check) => check.state === 'fail'), [], kind);
    for (const line of source.split('\n')) assert.ok(ADDRESS_INDEX.includes(`    ${line}`), `${kind}: ${line}`);
  }
  assert.equal(readGenre(parse(ANSWER_EXAMPLES.question), ANSWER_EXAMPLES.question).checks[0].genre, 'wonder');
  assert.equal(readGenre(parse(ANSWER_EXAMPLES.change), ANSWER_EXAMPLES.change).checks[0].genre, 'episode');
  assert.deepEqual(Object.keys(seedOf(ANSWER_EXAMPLES.card, '^seed[Session]')), ['scene', 'carry', 'revisit']);
});

test('the example fits a post, and nothing in it would mention an account', () => {
  for (const source of Object.values(ANSWER_EXAMPLES)) {
    assert.ok(source.length <= 280, source);
    assert.doesNotMatch(source, /(^|[^A-Za-z0-9_])@[A-Za-z]/);
  }
});

test('the index stays in the llms.txt form and holds no backtick', () => {
  const before = ADDRESS_INDEX.slice(0, ADDRESS_INDEX.indexOf('## Addresses'));
  assert.equal((before.match(/^#{1,6} /gm) || []).length, 1, 'only the title is a heading before the lists');
  assert.ok(!ADDRESS_INDEX.includes('`'));
  assert.ok(FULL_INDEX.startsWith(ADDRESS_INDEX));
  for (const example of EXAMPLES) assert.ok(FULL_INDEX.includes(example.file), example.id);
});

test('the bare address reaches the form however it is asked for', async () => {
  for (const accept of ['text/plain', 'text/markdown, text/html, */*']) {
    assert.equal(await (await get('/', { accept })).text(), ADDRESS_INDEX, accept);
  }
  for (const agent of ['Mozilla/5.0 (compatible; ClaudeBot/1.0)', 'Mozilla/5.0 (compatible; GPTBot/1.1)']) {
    assert.equal(await (await get('/', { 'user-agent': agent })).text(), ADDRESS_INDEX, agent);
  }
  const page = await (await get('/', { accept: 'text/html' })).text();
  assert.match(page, /<a href="\/llms\.txt">How to answer in Spw<\/a>/);
  assert.ok(page.indexOf('/llms.txt">How to answer') < page.indexOf('id="try"'), 'the way to the form comes before the guide');
  assert.match(await (await get('/init')).text(), /^# spw\.quest — initialize a mounted Spw workbench/);
});

test('a joined word finds what the site holds under its split forms', () => {
  const lines = kinOf('rpgwednesday').map(({ line }) => line);
  assert.equal(lines[0], 'rpg[wednesday]{sessions.cast.world}');
  const reading = cardReading('rpgwednesday<card>');
  assert.deepEqual([reading.word, reading.concept], ['rpgwednesday', 'card']);
  assert.ok(reading.pages.includes('https://spwashi.com/play/rpg-wednesday/'));
  assert.deepEqual(kinOf('zz'), [], 'too short to mean anything');
});

test('a card answers as text, as a page that unfurls, and by the line as its own path', async () => {
  const asked = encodeURIComponent('rpgwednesday<card>');
  const text = await (await get(`/card.txt?line=${asked}`)).text();
  assert.match(text, /asks for: card/);
  assert.match(text, /rpg\[wednesday\]\{sessions\.cast\.world\}/);
  const html = await (await get(`/card?line=${asked}`, { 'user-agent': 'Twitterbot/1.0', accept: '*/*' })).text();
  assert.match(html, /<meta name="twitter:card" content="summary">/);
  assert.match(html, /property="og:title" content="rpgwednesday&lt;card&gt;"/);
  assert.ok(html.length < 60_000, `a small page (${html.length})`);
  assert.equal((await get(`/${asked}`)).status, 200);
  assert.equal(lineFromPath(`/${asked}`), 'rpgwednesday<card>');
  for (const path of ['/rpgwednesday', '/a/b<c>', '/favicon.ico']) assert.equal(lineFromPath(path), '', path);
  assert.match(await (await get('/card.txt')).text(), /No line to read/);
});
