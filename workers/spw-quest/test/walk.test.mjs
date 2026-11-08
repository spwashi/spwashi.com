// The guide's first offer: the visitor's walk through spw.quest, written in Spw, kept only in their browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { readFile } from '../src/file-reader.js';
import { OPEN_ROOMS, WALK_KEY, WALK_LIMIT, paintWalk, precipitate, recordWalk, walkStep, WALK_TYPES } from '../src/walk.js';

const get = (path) => worker.fetch(new Request(`https://spw.quest${path}`));

test('an address becomes a room, and a word when the address names one', () => {
  assert.deepEqual(walkStep('https://spw.quest/'), { room: 'guide' });
  assert.deepEqual(walkStep('/?example=notebook#try'), { room: 'guide', detail: 'notebook', kind: 'about' });
  assert.deepEqual(walkStep('/read?step=act&line=x'), { room: 'learn', detail: 'act', kind: 'scene' });
  assert.deepEqual(walkStep('/specimens?q=*[lens]'), { room: 'shelf', detail: 'lens', kind: 'asked' });
  assert.deepEqual(walkStep('/build?script=%23%3Elab_notebook%0A'), { room: 'build', detail: 'lab_notebook', kind: 'made' });
  assert.deepEqual(walkStep('/pivot?line=garden[closed]{hinge}'), { room: 'pivot', detail: 'garden', kind: 'made' });
  assert.deepEqual(walkStep('/parser/2026.10.13/'), { room: 'parser' });
  assert.deepEqual(walkStep('/shelf/plans/'), { room: 'shelf' });
  assert.equal(walkStep('/init'), null);
  assert.equal(walkStep('/quest.json'), null);
  // A word is only ever lowercase letters, digits and underscores, so it cannot break the file it lands in.
  assert.equal(walkStep('/specimens?q=<script>alert(1)</script>').detail, 'script');
  assert.equal(walkStep('/build?word=' + 'a'.repeat(60)).detail.length, 24);
});

test('the walk is kept in this browser, without repeats, and never past its limit', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const visit = (href) => {
    globalThis.location = { href: `https://spw.quest${href}` };
    recordWalk(WALK_KEY, WALK_LIMIT, walkStep);
  };
  visit('/');
  visit('/');
  visit('/learn');
  visit('/init');
  const walk = JSON.parse(store.get(WALK_KEY));
  assert.deepEqual(walk.map((step) => step.room), ['guide', 'learn'], 'a reload is not a step, and /init is not a room');
  assert.match(walk[0].day, /^\d{4}-\d{2}-\d{2}$/);
  for (let i = 0; i < WALK_LIMIT + 5; i += 1) visit(i % 2 ? '/build' : '/learn');
  assert.equal(JSON.parse(store.get(WALK_KEY)).length, WALK_LIMIT);
  store.set(WALK_KEY, '{not json');
  assert.doesNotThrow(() => visit('/'));
  delete globalThis.localStorage;
  delete globalThis.location;
});

test('a first visit assumes no Spw: it names the walk, says where you are, and offers rooms', () => {
  const first = precipitate([{ room: 'guide' }]);
  assert.equal(first.text, '#>walk\nyou@guide\n~learn ~build ~forms');
  assert.deepEqual(first.open.map(([room]) => room), ['learn', 'build', 'forms']);
  assert.equal(readFile(first.text).ok, true);
});

test('a walk precipitates into the marks the guide teaches, and reads as Spw', () => {
  const steps = [
    { room: 'guide' }, { room: 'learn' }, { room: 'learn', detail: 'act', kind: 'scene' },
    { room: 'shelf', detail: 'door', kind: 'asked' }, { room: 'build', detail: 'garden', kind: 'made' },
    { room: 'guide', detail: 'notebook', kind: 'about' }, { room: 'guide' },
  ];
  const { text, lines } = precipitate(steps);
  assert.equal(text, [
    '#>walk',
    'you@guide',
    '^[walked]{guide ~> learn ~> learn(act) ~> shelf[door] ~> build<garden> ~> guide<notebook> ~> guide}',
    '*guide',
    '?door(shelf)',
    '!garden(build)',
    '~forms ~parser ~install',
  ].join('\n'));
  assert.deepEqual(lines.map(([, kind]) => kind), ['frame', 'perspective', 'path', 'weight', 'asked', 'made', 'open']);
  const reading = readFile(text);
  assert.equal(reading.ok, true);
  assert.ok(reading.checks.some((check) => check.state === 'pass' && check.says === 'Spw read the whole file.'));
  // Every room opened: nothing left to offer, and no ~ line.
  const all = precipitate(OPEN_ROOMS.map(([room]) => ({ room })));
  assert.ok(!all.lines.some(([, kind]) => kind === 'open'));
  assert.deepEqual(all.open, []);
  // A stored step with a bad word or room is dropped, not written.
  assert.equal(precipitate([{ room: 'guide' }, { room: 'x}y' }, { room: 'shelf', detail: '}{', kind: 'asked' }]).text, '#>walk\nyou@guide\n^[walked]{guide ~> shelf}\n~learn ~build ~forms');
});

test('the paint gives each mark and brace its type and escapes the rest', () => {
  const painted = paintWalk('#>walk\n^[walked]{a ~> b<c>}\n~learn', WALK_TYPES);
  assert.match(painted, /^<span data-t="frame">#&gt;<\/span>walk/);
  assert.match(painted, /<span data-t="stream">~&gt;<\/span>/);
  assert.match(painted, /<span data-t="b-concept">&lt;<\/span>c<span data-t="b-concept">&gt;<\/span>/);
  assert.match(painted, /<span data-t="potential">~<\/span>learn/);
  // @ between a context and its subject is a mark too: you@guide.
  assert.equal(paintWalk('you@guide', WALK_TYPES), 'you<span data-t="perspective">@</span>guide');
});

test('the guide opens on the walk, ahead of the files, and every page adds itself to it', async () => {
  const page = await (await get('/')).text();
  const walk = page.indexOf('<section id="walk"');
  assert.ok(walk > 0 && walk < page.indexOf('<section id="try"'), 'the walk comes before the files');
  assert.match(page, /<h2 id="walk-title" class="eyebrow">Your walk, in Spw<\/h2>/);
  assert.match(page, /It stays in this browser; nothing is sent\./);
  // With scripts off: where a walk begins, painted, with a way into Build that needs no script.
  assert.ok(page.includes('<span data-t="frame">#&gt;</span>walk'));
  assert.ok(page.includes(`href="/build?script=${encodeURIComponent('#>walk\nyou@guide\n~learn ~build ~forms')}"`));
  assert.match(page, /<a href="\/learn">learn<\/a>/);
  for (const path of ['/', '/learn', '/install', '/specimens']) {
    assert.ok((await (await get(path)).text()).includes(`<script>(${recordWalk.toString()})("${WALK_KEY}", ${WALK_LIMIT}, ${walkStep.toString()});</script>`), path);
  }
});
