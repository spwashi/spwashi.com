// The line in hand (src/file-reader.js): a line of the file, its parts as
// handles, and a turn shown before it is written with what it would change.
// The ways between the guide's files, /pivot's kept walk, and /learn's carried
// word ride with it: each is a way to move through Spw without retyping it.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { parse } from '../../../public/js/semantic/spw-workbench-reader.js';
import { BUILD_KINDS } from '../src/build.js';
import { EXAMPLES, exampleById } from '../src/examples.js';
import { FILE_DATA, docShelf, fileKit, landingLine } from '../src/file-reader.js';
import { pivotState } from '../src/pivot.js';
import { STEPS } from '../src/steps.js';

const get = (path, options) => worker.fetch(new Request(`https://spw.quest${path}`, options));
const text = async (path, options) => (await get(path, options)).text();
const kit = fileKit(FILE_DATA);
const SONG = BUILD_KINDS[0].script;
const said = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
const hold = (reading, state, opts = {}) => kit.hand(parse, reading, { line: -1, path: [], held: -1, primed: null, receipt: null, ...state }, opts);

test('a line in hand is its parts in order: a mark, a word, and each brace by the slot it names', () => {
  const song = kit.read(parse, SONG);
  const chorus = hold(song, { line: 2 });
  assert.deepEqual(chorus.parts.map((part) => [part.says, song.text.slice(part.from, part.to)]), [
    ['ascension', '^'], ['word', 'chorus'], ['concept', '<hook>'], ['scene', '(car)'], ['mode', '[lift]'], ['definition', '{say it plain, say it twice}'],
  ]);
  // What a turn replaces is what the walls hold, never the walls.
  const mode = chorus.parts[4];
  assert.equal(song.text.slice(mode.a, mode.b), 'lift');
  // The lines on either side; a blank line is stepped over, and the ends say so.
  assert.deepEqual([chorus.up, chorus.down], [1, 3]);
  assert.equal(hold(song, { line: 0 }).up, -1);
  assert.equal(hold(kit.read(parse, 'a[x]\n\n\nb[y]'), { line: 0 }).down, 3);
  // A line past the end is the last; no line asked for is the first with anything on it.
  assert.equal(hold(song, { line: 99 }).n, 6);
  assert.equal(hold(kit.read(parse, '\n\n~door'), {}).n, 2);
  // A brace an earlier line opened closes here without becoming a part of this line; the mode after it is one.
  const block = kit.read(parse, exampleById('persona').script);
  const closing = block.text.split('\n').indexOf('}[reg=facet]');
  assert.deepEqual(hold(block, { line: closing }).parts.map((part) => [part.says, block.text.slice(part.from, part.to)]), [['mode', '[reg=facet]']]);
});

test('a held slot borrows from the same slot on the other lines, and a turn is shown before it is written', () => {
  const song = kit.read(parse, SONG);
  const held = hold(song, { line: 2, held: 4 });
  assert.deepEqual(held.choices.map((choice) => choice.value), ['draft', 'low', 'minor', 'steady', 'close', 'open']);
  assert.equal(held.primed, false);
  assert.ok(held.html.includes('aria-pressed="true"><code data-t="b-mode">[lift]</code>'), 'the held part is marked');
  // Primed: the line it would make, and what that changes. The file is not touched.
  const primed = hold(song, { line: 2, held: 4, primed: 'low' });
  assert.equal(primed.primed, true);
  assert.equal(song.text, SONG);
  assert.match(said(primed.html), /It would read \^ chorus < hook > \( car \) \[ low \] \{ say it plain, say it twice \} Joins \.verse at \[low\]\. Write it Let it go/);
  // A value nothing lends is never primed.
  assert.equal(hold(song, { line: 2, held: 4, primed: 'nowhere' }).primed, false);
  // The mark in front turns the same way, and says what the word reads as.
  const mark = hold(song, { line: 0, held: 0, primed: '^' });
  assert.match(said(mark.html), /porch_light reads as ascension now\. Joins \^chorus at \^\./);
  // A written turn leaves a receipt, with the way to put it back.
  const receipt = hold(song, { line: 2, held: 4, receipt: { was: 'lift', now: 'low' } });
  assert.match(said(receipt.html), /\[lift\] → \[low\]\. Put it back/);
});

test('a part that holds parts opens, and the way out is kept', () => {
  const syntax = kit.read(parse, exampleById('syntax').script);
  const n = syntax.text.split('\n').findIndex((line) => line.startsWith('nest ='));
  const line = hold(syntax, { line: n });
  const brace = line.parts.findIndex((part) => part.says === 'definition');
  assert.ok(hold(syntax, { line: n, held: brace }).html.includes('data-hand-open'), 'a nested body offers to open');
  const inside = hold(syntax, { line: n, path: [brace] });
  assert.equal(inside.depth, 1);
  assert.deepEqual(inside.parts.map((part) => syntax.text.slice(part.from, part.to)), ['chip{ring, pill}', ',', 'card{lifted}']);
  assert.ok(inside.html.includes('data-hand-out'), 'the way out');
  const deeper = hold(syntax, { line: n, path: [brace, 0] });
  assert.deepEqual([deeper.depth, deeper.parts.map((part) => syntax.text.slice(part.from, part.to))], [2, ['chip', '{ring, pill}']]);
  // Plain words inside a brace are typed over, not opened; a path that no longer fits falls back to the line.
  const song = kit.read(parse, '.arrive<threshold>{the kettle}');
  assert.ok(!hold(song, { line: 0, held: 3 }).html.includes('data-hand-open'));
  assert.equal(hold(song, { line: 0, path: [3] }).depth, 0);
});

test('on /build the hand reads with scripts off, and Read takes the line in hand apart', async () => {
  const page = await text('/build?kind=song&line=3');
  const bar = page.slice(page.indexOf('<div class="hand"'), page.indexOf('<p class="keys file-foot"'));
  assert.match(bar, /<input type="hidden" name="at" value="3">/);
  assert.ok(bar.includes('<span class="n">line 3 of 7</span>'));
  // Each part is a link to its row below; the rooms the line can go to are named by the page.
  for (const row of ['mark', 'word', 'concept', 'scene', 'mode', 'definition']) assert.ok(bar.includes(`<a href="#pivot-${row}">`) && page.includes(`id="pivot-${row}"`), row);
  assert.ok(bar.includes('<a href="/pivot?line=%5Echorus%3Chook%3E(car)%5Blift%5D%7Bsay%20it%20plain%2C%20say%20it%20twice%7D">Pivot this line</a>'));
  assert.ok(bar.includes('>Feel it at rest</a>') && bar.includes('>Open it on the canvas ↗</a>'));
  assert.doesNotMatch(bar, /<button/, 'nothing in the scripts-off bar needs a script');
  // The field the hand keeps tells Read which line it is; a line the page cannot take apart, or none, is the first.
  const post = (fields) => text('/build', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ script: BUILD_KINDS[2].script, tool: 'read', ...fields }) });
  assert.match(await post({ at: '3' }), /<h2 id="apart-title">The rae line, taken apart<\/h2>/);
  assert.match(await post({ at: '99' }), /<h2 id="apart-title">The first line, taken apart<\/h2>/);
  assert.match(await post({}), /<h2 id="apart-title">The first line, taken apart<\/h2>/);
  assert.match(await text('/build', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ script: '#>notes\n\n~door[ajar]\n?door[shut]', tool: 'read', at: '4' }) }), /aria-label="\?door\[shut\]"/);
});

test('the guide\'s files point to each other, and a reading\'s path is a way to the line it names', async () => {
  const shelf = docShelf(EXAMPLES);
  const files = new Set(EXAMPLES.map((example) => example.file));
  const joins = shelf.flatMap((doc) => doc.links.filter((link) => files.has(link.file)).map((link) => [doc, link]));
  assert.ok(joins.length >= 10, `the files join each other (${joins.length})`);
  // Every path that names a line lands on one in the file it names.
  for (const [doc, link] of joins.filter(([, link]) => link.at)) {
    const target = EXAMPLES.find((example) => example.file === link.file);
    assert.ok(landingLine(target.script, link.at) >= 0, `${doc.file} @${link.name} lands in ${link.file} at ${link.at}`);
  }
  assert.equal(landingLine(exampleById('vocabulary').script, 'glass'), exampleById('vocabulary').script.split('\n').indexOf('^"glass"{'));
  assert.equal(landingLine(exampleById('syntax').script, 'line'), exampleById('syntax').script.split('\n').findIndex((line) => line.startsWith('line =')));
  assert.equal(landingLine('~door', 'nowhere'), -1);
  // The experiment's reading: a way to the chip, a way to the glass theme at its line, and the record that points back.
  const page = await text('/?example=question');
  assert.ok(page.includes('<a data-example="record" href="/?example=record#try"><code>./chip.spw</code></a>'));
  assert.ok(page.includes('<a data-example="vocabulary" data-at="glass" href="/?example=vocabulary&amp;at=glass#try"><code>./themes.spw#glass</code></a>'));
  assert.match(page, /<dt>Pointed to by<\/dt><dd><ul class="links"><li><span class="key">@tried<\/span><a data-example="record" data-at="tried" href="\/\?example=record&amp;at=tried#try"><code>chip\.spw<\/code><\/a><\/li>/);
  // A path outside the fourteen stays as written.
  assert.ok((await text('/?example=record')).includes('<span class="key">@broader</span><code>./control.spw</code></li>'));
  // An address that names a line puts it in hand; the guide's hand names no other room.
  const landed = await text('/?example=vocabulary&at=glass');
  const bar = landed.slice(landed.indexOf('<div class="hand"'), landed.indexOf('<div class="file-foot"'));
  assert.match(bar, /<input type="hidden" name="at" value="10">/);
  assert.ok(bar.includes('<code data-t="s">&quot;glass&quot;</code>'));
  assert.doesNotMatch(bar, /href="\/(pivot|physics|constructs)/);
  // Each mark's card says whether the open file uses it, and how often.
  assert.match(landed, /<p class="in-file" data-in-file="ascension"><a href="#try">in <span data-in-file-name>themes\.spw<\/span> <span class="count">×<span data-in-file-count>2<\/span><\/span><\/a><\/p>/);
  assert.match(landed, /<p class="in-file" data-in-file="wonder" hidden>/);
});

test('a line changed in /pivot\'s own box keeps the walk, and the line opens on the canvas', async () => {
  const page = await text(`/pivot?line=${encodeURIComponent('home[hook]')}&from=${encodeURIComponent('home[live]')}&t=${encodeURIComponent('home[live]')}`);
  const form = page.slice(page.indexOf('<form class="find"'), page.indexOf('</form>'));
  assert.ok(form.includes('<input type="hidden" name="from" value="home[hook]">'));
  assert.deepEqual([...form.matchAll(/name="t" value="([^"]+)"/g)].map(([, step]) => step), ['home[live]', 'home[hook]']);
  assert.ok(page.includes('<a href="/canvas?line=home%5Bhook%5D">Open it on the canvas</a>'));
  // Sent on changed, the line it was is the way back; sent again unchanged, the trail does not repeat it.
  const stepped = pivotState(new URLSearchParams([['line', 'home[draft]'], ['from', 'home[hook]'], ['t', 'home[live]'], ['t', 'home[hook]']]));
  assert.deepEqual([stepped.from, stepped.trail], ['home[hook]', ['home[live]', 'home[hook]']]);
  const same = pivotState(new URLSearchParams([['line', 'home[hook]'], ['from', 'home[hook]'], ['t', 'home[live]'], ['t', 'home[hook]']]));
  assert.deepEqual([same.from, same.trail], ['', ['home[live]']]);
  assert.doesNotMatch(await text('/pivot'), /name="from"/, 'an empty box carries nothing');
});

test('/learn carries a word of the reader\'s through the panels, and each line goes on from its panel', async () => {
  const plain = await text('/learn');
  for (const step of STEPS) assert.ok(plain.includes(`>${step.try.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</textarea>`), `${step.id} is the quest's own line`);
  const garden = await text('/learn?word=garden');
  assert.ok(garden.includes('>~garden</textarea>') && garden.includes('>garden[closed]{hinge, frame, key}</textarea>') && garden.includes('>the same garden, again this morning</textarea>'));
  assert.ok(garden.includes('The panels read with <code>garden</code> where the quest says <code>door</code>.'));
  assert.ok(garden.includes('line=%3Fgarden'), 'the lines a panel compares carry the word too');
  // Anything but a plain name is ignored, and never echoed.
  const hostile = await text(`/learn?word=${encodeURIComponent('<script>alert(1)</script>')}`);
  assert.ok(hostile.includes('>~door</textarea>') && !hostile.includes('<script>alert(1)'));
  // A panel's line goes on: to the pivot where it is one expression, and to the canvas.
  const act = plain.slice(plain.indexOf('id="form-act"'), plain.indexOf('id="reading-act"'));
  assert.ok(act.includes('<button type="submit" class="quiet-button" formaction="/pivot">Pivot it</button>'));
  assert.ok(act.includes('href="/canvas?line=~door"'));
  const grow = plain.slice(plain.indexOf('id="form-grow"'), plain.indexOf('id="reading-grow"'));
  assert.doesNotMatch(grow, /formaction|data-canvas/, 'the commands are not a line to turn');
});
