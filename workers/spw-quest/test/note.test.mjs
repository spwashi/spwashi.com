import test from 'node:test';
import assert from 'node:assert/strict';
import { NOTE_KEY, noteBootScript, noteKit } from '../src/note.js';
import { EXAMPLES } from '../src/examples.js';
import { FILE_LIMIT } from '../src/file-reader.js';
import worker from '../src/index.js';

const kit = noteKit();
const shelf = EXAMPLES.map(({ id, file, says, try: attempt, script }) => ({ id, file, says, try: attempt, script }));
const notebook = shelf.find((item) => item.id === 'notebook');
const persona = shelf.find((item) => item.id === 'persona');
const limit = FILE_LIMIT;
const noteOf = (script, { from = null, filename = 'reading-log.spw' } = {}) => kit.record({ script, filename, from }, limit, 1);
const boot = (search, stored, field = notebook.script) => kit.decideBoot({ search, field, filename: notebook.file, stored, shelf, limit });

test('the note key and the record schema are one name, and a bad value is ignored, not repaired', () => {
  assert.equal(kit.key, NOTE_KEY);
  assert.equal(kit.fromJson('not json', limit), null);
  assert.equal(kit.fromJson(JSON.stringify({ schema: 'spw.quest.note/2', id: 'local', script: 'x' }), limit), null);
  assert.equal(kit.fromJson(JSON.stringify({ schema: NOTE_KEY, id: 'other', script: 'x' }), limit), null);
  const stored = kit.fromJson(JSON.stringify({ schema: NOTE_KEY, id: 'local', script: 'a'.repeat(limit + 10), filename: '../x', from: 'persona', savedAt: 5 }), limit);
  assert.equal(stored.script.length, limit, 'sliced to FILE_LIMIT');
  assert.equal(stored.filename, 'x.spw', 'one segment, .spw');
});

test('the address carries no body, keeps every other key, and never holds example and note together', () => {
  assert.equal(kit.questAddress('?example=persona&parser=next', { note: true }), '/?parser=next&note#try');
  assert.equal(kit.questAddress('?note&parser=2026.10.13', { example: 'question' }), '/?parser=2026.10.13&example=question#try');
  assert.equal(kit.questAddress('', { note: true }), '/?note#try');
});

test('boot: ?note paints the stored note, or keeps the template and says none is kept, and never writes', () => {
  const stored = noteOf('#>my_note\n');
  const painted = boot('?note', stored);
  assert.deepEqual([painted.action, painted.field, painted.url, painted.write], ['paint-record', '#>my_note\n', null, null]);
  const empty = boot('?note', null);
  assert.deepEqual([empty.action, empty.notice, empty.write], ['keep-field', 'unstored', null]);
});

test('boot: a shelf example asks when the stored note differs, keeps when it matches, and never writes', () => {
  const clean = boot('?example=persona', noteOf(persona.script, { from: 'persona' }), persona.script);
  assert.equal(clean.action, 'keep-field');
  const dirty = boot('?example=persona', noteOf('#>my_note\n'), persona.script);
  assert.deepEqual([dirty.action, dirty.notice, dirty.write], ['ask', 'differs', null]);
});

test('boot: the bare guide and an unknown id restore a divergent note and move to ?note, keeping other keys', () => {
  const stored = noteOf('#>my_note\n');
  const bare = boot('?parser=next', stored);
  assert.deepEqual([bare.action, bare.url, bare.write], ['paint-record', '/?parser=next&note#try', null]);
  const unknown = boot('?example=nope', stored);
  assert.equal(unknown.action, 'paint-record');
  assert.equal(boot('?example=nope', noteOf(notebook.script, { from: 'notebook' })).action, 'keep-field', 'clean against the painted notebook');
  assert.equal(boot('', null).action, 'keep-field');
});

test('boot sequence: ask, then input and a matching tab write nothing, then Keep paints the stored note without writing', () => {
  const stored = noteOf('#>my_note\n');
  assert.equal(boot('?example=persona', stored, persona.script).action, 'ask');
  // While the choice is open, a keystroke and a click on the current tab write nothing and move nothing.
  const typed = kit.decideInput({ choiceOpen: true, field: `${persona.script}x`, shelf, filename: persona.file, limit, search: '?example=persona' });
  assert.deepEqual([typed.write, typed.url], [null, null]);
  const clicked = kit.decideTemplate({ choiceOpen: true, field: persona.script, currentScript: persona.script, stored, target: persona, search: '?example=persona', limit });
  assert.deepEqual([clicked.write, clicked.assign, clicked.ask], [null, false, false]);
  // Keep this note: the page paints stored.script and writes nothing; storage still holds the note.
  assert.equal(kit.fromJson(JSON.stringify(stored), limit).script, '#>my_note\n');
});

test('tab sequence: a dirty field asks instead of replacing, input while open writes nothing, Keep restores', () => {
  const stored = noteOf('#>my_note\nmore');
  const dirty = kit.decideTemplate({ choiceOpen: false, field: '#>my_note\nmore', currentScript: notebook.script, stored, target: persona, search: '?note', limit });
  assert.deepEqual([dirty.ask, dirty.assign, dirty.write], [true, false, null]);
  const typed = kit.decideInput({ choiceOpen: true, field: '#>my_note\nmore and more', shelf, filename: 'note.spw', limit, search: '?note' });
  assert.equal(typed.write, null);
  // No current template (a note with from null) and a different target is also dirty.
  assert.equal(kit.decideTemplate({ choiceOpen: false, field: 'anything', currentScript: null, stored, target: persona, search: '', limit }).ask, true);
});

test('a clean field swaps templates and writes the clean template; an edit keeps the note, landing back on a template names it', () => {
  const swap = kit.decideTemplate({ choiceOpen: false, field: notebook.script, currentScript: notebook.script, stored: null, target: persona, search: '?parser=next', limit });
  assert.deepEqual([swap.assign, swap.ask, swap.url, swap.write.from, swap.write.script], [true, false, '/?parser=next&example=persona#try', 'persona', persona.script]);
  const edited = kit.decideInput({ choiceOpen: false, field: `${notebook.script}\n#>more`, shelf, filename: notebook.file, limit, search: '?example=notebook' });
  assert.deepEqual([edited.write.from, edited.write.filename, edited.url], [null, notebook.file, '/?note#try']);
  const back = kit.decideInput({ choiceOpen: false, field: notebook.script, shelf, filename: notebook.file, limit, search: '?note' });
  assert.deepEqual([back.write.from, back.url], ['notebook', '/?example=notebook#try']);
});

test('the guide boots the note right after its form, before Copy and Download bind, with no import', async () => {
  const page = await (await worker.fetch(new Request('https://spw.quest/?note'))).text();
  const form = page.indexOf('<form class="file" data-file');
  const formEnd = page.indexOf('</form>', form);
  const bootAt = page.indexOf('<script>(function noteBoot', formEnd);
  assert.ok(bootAt > formEnd && bootAt - formEnd < 40, 'the boot script follows the form');
  const bootScript = page.slice(bootAt, page.indexOf('</script>', bootAt));
  assert.doesNotMatch(bootScript, /\bimport\b/);
  assert.ok(page.indexOf("[data-tool='copy']", bootAt) > bootAt, 'toolActions binds Copy after boot');
  assert.ok(noteBootScript(shelf, limit).includes(NOTE_KEY));
  // The server ignores ?note: it paints the notebook template, says nothing is sent with scripts off, and sets no cookie.
  assert.ok(page.includes('#&gt;reading_log'));
  assert.match(page, /<noscript><p class="note-state">Scripts are off, so this field is a template\./);
  assert.match(page, /<p class="note-choice" data-note-choice-line hidden>/);
});
