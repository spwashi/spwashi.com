// /build starts from a whole file (a song, an image, a scene), takes any of its lines apart,
// and offers each slot the words the rest of the file already uses (src/build.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { BUILD_KINDS, buildFrom, focusLines, focusSlots } from '../src/build.js';
import { readFile } from '../src/file-reader.js';

const get = async (p) => (await worker.fetch(new Request(`https://spw.quest${p}`), {})).text();

test('each starting file reads whole, and every line of it can be taken apart', () => {
  assert.deepEqual(BUILD_KINDS.map((entry) => entry.kind), ['song', 'image', 'scene']);
  for (const entry of BUILD_KINDS) {
    const lines = entry.script.split('\n');
    assert.equal(focusLines(entry.script).length, lines.length, `${entry.kind}: every line is one expression`);
    assert.deepEqual(readFile(entry.script).checks.map((check) => check.state), ['pass'], `${entry.kind}: the reader reads it whole`);
  }
  // The ground mark is a mark like the rest.
  assert.deepEqual(focusSlots('.verse<memory>(kitchen)[low]{the kettle}'), { mark: '.', word: 'verse', concept: 'memory', scene: 'kitchen', mode: 'low', definition: 'the kettle' });
});

test('a bare /build is the song; ?kind= chooses; slot addresses without a script still make one line', async () => {
  const bare = buildFrom(new URLSearchParams());
  assert.equal(bare.kind, 'song');
  assert.equal(bare.script, BUILD_KINDS[0].script);
  assert.equal(bare.filename, 'porch_light.spw');
  const page = await get('/build');
  assert.ok(page.includes('<a href="/build?kind=song#build" aria-current="true">'), 'the song is chosen');
  assert.ok(page.includes('>porch_light.spw<') || page.includes('value="porch_light.spw"'), 'the file is named');
  assert.equal(buildFrom(new URLSearchParams('kind=scene')).filename, 'morning_after.spw');
  const slotted = buildFrom(new URLSearchParams('word=door&mode=ajar'));
  assert.equal(slotted.kind, null);
  assert.equal(slotted.script.split('\n').length, 1, 'a slot address is one line, as before');
});

test('any line can be taken apart, and a slot offers what the other lines use', async () => {
  const page = await get('/build?kind=scene&line=3');
  assert.match(page, /<h2 id="apart-title">The rae line, taken apart<\/h2>/);
  assert.ok(page.includes('<nav class="apart-lines" aria-label="Take another line apart">'));
  assert.match(page, /aria-current="true"><span class="n">3<\/span>@rae<\/a>/);
  // The mode row offers the scene's other lenses, and each choice keeps line 3 the one taken apart.
  const modes = [...page.matchAll(/href="(\/build\?script=[^"]+&amp;line=3#pivot-mode)"/g)].map(([, href]) => decodeURIComponent(href.replaceAll('&amp;', '&')));
  for (const lens of ['guarded', 'quiet', 'rising']) assert.ok(modes.some((href) => href.includes(`@rae<fatigue>(sink)[${lens}]`)), lens);
  assert.ok(modes.some((href) => href.includes('@rae<fatigue>(sink){dishes')), 'and none');
  // Changing a slot rewrites only that line.
  const changed = buildFrom(new URLSearchParams({ script: BUILD_KINDS[2].script, line: '3', mode: 'quiet' }));
  assert.equal(changed.script.split('\n')[2], '@rae<fatigue>(sink)[quiet]{dishes, a joke that lands wrong}');
  assert.deepEqual(changed.script.split('\n').filter((_, index) => index !== 2), BUILD_KINDS[2].script.split('\n').filter((_, index) => index !== 2));
  // A line past the end takes the first apart.
  assert.equal(buildFrom(new URLSearchParams({ script: BUILD_KINDS[2].script, line: '99' })).nth, 0);
});
