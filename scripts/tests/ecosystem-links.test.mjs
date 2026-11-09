import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  CANVAS_LINE_MAX,
  ECOSYSTEM_JOBS,
  FACTSHIFT_CONFIG,
  PIVOT_LINE_MAX,
  QUEST_SHARE_MAX,
  SCRIPT_MAX,
  canvasConfig,
  canvasHref,
  carriedName,
  ecosystemLinks,
  questBuildHref,
  questPivotHref,
  spellName,
  toSpw64,
  withName,
} from '../../public/js/kernel/ecosystem-links.js';
import { MAX_SCRIPT, SHARE_MAX, spw64 } from '../../workers/spw-quest/src/build.js';
import { PIVOT_LIMIT } from '../../workers/spw-quest/src/pivot.js';

const root = new URL('../../', import.meta.url);
const fromSpw64 = (code) => Buffer.from(code, 'base64url').toString('utf8');
const fragment = (href) => fromSpw64(new URL(href).hash.replace(/^#spw64=/, ''));

test('the limits are the receivers\' own, and the fragment encodes as spw.quest does', () => {
  assert.equal(QUEST_SHARE_MAX, SHARE_MAX);
  assert.equal(SCRIPT_MAX, MAX_SCRIPT);
  assert.equal(PIVOT_LINE_MAX, PIVOT_LIMIT);
  for (const text of ['home[hook]{a.b}<person>', '#>walk\nyou@guide\n~learn ~build', 'ë · ◌[regard]{café}(rêve) — 字']) {
    assert.equal(toSpw64(text), spw64(text));
    assert.equal(fromSpw64(toSpw64(text)), text);
  }
  // With the canvas app checked out, its own line limit and tool names are checked too.
  const rootTs = new URL('workers/factshift-center/app/src/js/init/root.ts', root);
  if (existsSync(rootTs)) assert.match(readFileSync(rootTs, 'utf8'), new RegExp(`SPW_LINE_LIMIT = ${CANVAS_LINE_MAX};`));
  const iface = new URL('workers/factshift-center/app/src/js/spwashi/interface.ts', root);
  if (existsSync(iface)) {
    const order = readFileSync(iface, 'utf8').match(/DEFAULT_MODE_ORDER[^=]*=\s*\[([^\]]+)\]/)?.[1] || '';
    for (const mode of order.match(/'([a-z]+)'/g).map((quoted) => quoted.slice(1, -1)).filter((mode) => mode !== 'debug')) {
      assert.deepEqual(canvasConfig({ mode }), [['mode', mode]], `factshift.center's ${mode} tool`);
    }
  }
});

test('only configuration factshift.center reads is passed, each value checked', () => {
  const { query } = JSON.parse(readFileSync(new URL('workers/factshift-center/version.json', root), 'utf8'));
  for (const key of Object.keys(FACTSHIFT_CONFIG)) assert.ok(query.includes(key), `${key} is in factshift.center's query list`);
  assert.deepEqual(canvasConfig({
    reset: 1, debug: 1, doFetch: 1, spw: 'x', frame: 'a', identity: 'b',
    zoom: false, mode: 'map', charge: '-30', names: 'seed', display: 'words', story: 'not a word',
    title: '  A   title\nwith a break ', intent: 2.5, linkStrength: 'strong',
  }), [['mode', 'map'], ['display', 'words'], ['zoom', '0'], ['names', 'seed'], ['charge', '-30'], ['title', 'A title with a break']]);
  assert.deepEqual(canvasConfig({ mode: 'debug', display: 'everything' }), []);
  // A held script retitles the page, so title only travels with a line.
  assert.deepEqual(canvasConfig({ title: 'Home', zoom: 1 }, { form: 'script' }), [['zoom', '1']]);
});

test('one line that fits goes to the canvas by ?spw=, readable', () => {
  const line = 'home[hook]{software.art.practice}(atlas)<person>';
  const href = canvasHref(`  ${line}\n`, { config: { mode: 'map', reset: 1 } });
  const url = new URL(href);
  assert.equal(url.origin, 'https://factshift.center');
  assert.equal(url.pathname, '/');
  assert.equal(url.searchParams.get('spw'), line);
  assert.equal(url.searchParams.get('mode'), 'map');
  assert.ok(!url.searchParams.has('reset'));
  assert.ok(href.startsWith('https://factshift.center/?spw=home%5Bhook%5D'), 'spw leads the address');
  // ?spw= holds one line, so a given name has no room and the line goes as it is.
  assert.equal(new URL(canvasHref(line, { name: 'home-frame-note' })).searchParams.get('spw'), line);
  assert.equal(canvasHref('   '), null);
});

test('a script, or a line too long for ?spw=, goes whole by #spw64= with its name', () => {
  const script = 'home[hook]{a.b}<person>\nhome[live]{season.close}(production)<now>';
  const href = canvasHref(script, { name: 'home frame', config: { title: 'Home', zoom: 0 } });
  assert.ok(href.startsWith('https://factshift.center/?zoom=0#spw64='));
  assert.equal(fragment(href), `#>home_frame\n${script}`);

  const own = '#>home_frame\nhome[hook]{a.b}<person>\n.about @now';
  assert.equal(fragment(canvasHref(own, { name: 'other' })), own, 'a text that carries its name keeps it');
  assert.ok(canvasHref(own).startsWith('https://factshift.center/#spw64='), 'no configuration, no query');

  const long = `garden[care]{${'seed.'.repeat(90)}water}`;
  assert.ok(long.length > CANVAS_LINE_MAX);
  assert.equal(fragment(canvasHref(long, { name: 'garden' })), `#>garden\n${long}`);
  assert.equal(canvasHref('x'.repeat(SCRIPT_MAX + 1)), null);
});

test('spw.quest\'s editor gets the script in ?script= while it fits, by #spw64= past that, named either way', () => {
  const line = 'home[hook]{software.art.practice}(atlas)<person>';
  const href = questBuildHref(line, { name: 'home-frame-note' });
  const url = new URL(href);
  assert.equal(url.pathname, '/build');
  assert.equal(url.hash, '#build');
  assert.equal(url.searchParams.get('script'), `#>home_frame_note\n${line}`);
  assert.equal(url.searchParams.get('filename'), 'home_frame_note.spw');
  assert.ok(href.startsWith('https://spw.quest/build?filename='), 'the name leads, as spw.quest writes it');

  const own = '#>walk\nyou@guide\n~learn ~build ~forms';
  assert.equal(new URL(questBuildHref(own)).searchParams.get('filename'), 'walk.spw');
  assert.equal(new URL(questBuildHref('a[b]{c}')).searchParams.has('filename'), false, 'no name, no file name');

  const big = `#>big\n${'^"row"{ a = 1 }\n'.repeat(200)}`.trim();
  assert.ok(big.length > QUEST_SHARE_MAX);
  const far = questBuildHref(big);
  assert.ok(far.startsWith('https://spw.quest/build?filename=big.spw#spw64='));
  assert.equal(fragment(far), big);
  assert.equal(questBuildHref(''), null);
  assert.equal(questBuildHref('x'.repeat(SCRIPT_MAX + 1)), null);
});

test('the pivot turns one line that fits', () => {
  assert.equal(questPivotHref('board[workshop]{mill.laminate.cure}'), 'https://spw.quest/pivot?line=board%5Bworkshop%5D%7Bmill.laminate.cure%7D');
  assert.equal(questPivotHref('a\nb'), null);
  assert.equal(questPivotHref('x'.repeat(PIVOT_LINE_MAX + 1)), null);
});

test('a name is a Spw word, and a text that opens with #>name already carries one', () => {
  assert.equal(spellName('frost-hearth'), 'frost_hearth');
  assert.equal(spellName('#>walk'), 'walk');
  assert.equal(spellName('  home frame / note '), 'home_frame_note');
  assert.equal(spellName('2026'), '');
  assert.equal(spellName(''), '');
  assert.equal(carriedName('#>home[reading]{folio_stack}'), 'home');
  assert.equal(carriedName('\n#>walk\nyou@guide'), 'walk');
  assert.equal(carriedName('home #>x'), '');
  assert.equal(withName('a[b]', 'n'), '#>n\na[b]');
  assert.equal(withName('#>m\na[b]', 'n'), '#>m\na[b]');
  assert.equal(withName('a[b]', '9'), 'a[b]');
});

test('a component asks for its doors and gets them in order, in the same words everywhere', () => {
  const doors = ecosystemLinks('board[workshop]{mill.laminate.cure}', { jobs: ['pivot', 'canvas', 'build', 'nowhere'], name: 'board' });
  assert.deepEqual(doors.map((door) => door.job), ['pivot', 'canvas', 'build']);
  for (const door of doors) {
    assert.equal(door.label, ECOSYSTEM_JOBS[door.job].label);
    assert.match(door.title, /^Opens (factshift\.center|spw\.quest)/);
    assert.match(door.href, /^https:\/\/(factshift\.center|spw\.quest)\//);
  }
  // A script has no pivot; empty text has no doors.
  assert.deepEqual(ecosystemLinks('a\nb', { jobs: ['pivot', 'canvas'] }).map((door) => door.job), ['canvas']);
  assert.deepEqual(ecosystemLinks(''), []);
});
