import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTermNoteContext,
  readTermNoteRows,
  registerTermNoteRow,
  resetTermNoteRows,
} from '/public/js/semantic/term-note-rows.js';
import {
  SEARCH_TERM_NOTE_ROW,
  countOtherPlaces,
  countPlaces,
  distinctPlaces,
  setLoadedTerms,
  termSearchHref,
  termsToEntries,
} from '/public/js/runtime/navigation/site-search.js';
import { LENS_TERM_NOTE_ROW, snapshotOpeningSeats } from '/public/js/runtime/page/lens-term-note-row.js';
import { INTENT_TERM_NOTE_ROW } from '/public/js/interface/intent-term-note-row.js';
import { CAULDRON_TERM_NOTE_ROW } from '/public/js/interface/cauldron/term-note-row.js';
import { buildTermEntries } from '../generate-site-search-index.mjs';
import { aggregateTerms, readTermsFromHtml } from '../lib/living-terms.mjs';

function fakeTerm({ concept = 'lattice', hosts = {} } = {}) {
  return {
    dataset: { spwConcept: concept },
    closest: (selector) => hosts[selector] || null,
  };
}

test('rows read in a fixed id order, gated by when(), and a throwing row is skipped', () => {
  resetTermNoteRows();
  const seen = [];
  registerTermNoteRow({ id: 'b', render: () => ({ label: 'b', value: 'second' }) });
  registerTermNoteRow({ id: 'a', when: (ctx) => ctx.concept === 'lattice', render: () => ({ label: 'a', value: 'gated in' }) });
  registerTermNoteRow({ id: 'off', when: () => false, render: () => { seen.push('off'); return { label: 'x', value: 'never' }; } });
  registerTermNoteRow({ id: 'empty', render: () => null });
  const warn = console.warn;
  console.warn = () => {};
  registerTermNoteRow({ id: 'boom', render: () => { throw new Error('boom'); } });
  const rows = readTermNoteRows({ concept: 'lattice' });
  assert.deepEqual(rows.map((row) => row.id), ['b', 'a'], 'unnamed ids keep registration order');
  // Named ids read search, lens, intent, cauldron however their owners mounted.
  for (const id of ['cauldron', 'intent', 'search', 'lens']) registerTermNoteRow({ id, render: () => ({ label: id, value: id }) });
  assert.deepEqual(readTermNoteRows({ concept: 'lattice' }).map((row) => row.id), ['search', 'lens', 'intent', 'cauldron', 'b', 'a']);
  for (const id of ['cauldron', 'intent', 'search', 'lens']) registerTermNoteRow({ id, when: () => false, render: () => null });
  assert.deepEqual(seen, [], 'a declined row never renders');
  assert.deepEqual(readTermNoteRows({ concept: 'other' }).map((row) => row.id).filter((id) => id !== 'boom'), ['b']);

  // Re-registering an id replaces it in place; unregister removes only its own row.
  const off = registerTermNoteRow({ id: 'b', render: () => ({ label: 'b', value: 'replaced' }) });
  assert.equal(readTermNoteRows({ concept: 'x' })[0].value, 'replaced');
  off();
  assert.ok(!readTermNoteRows({ concept: 'x' }).some((row) => row.id === 'b'));
  console.warn = warn;
  resetTermNoteRows();
});

test('context reads the root lens, only the carried intent, and only mounted modules', () => {
  const root = globalThis.document.documentElement.dataset;
  const before = { ...root };
  root.spwActiveLensMode = 'memory';
  root.spwActiveLensGroup = 'play';
  const storage = new Map([['spw:intent:v1', JSON.stringify({ operator: 'potential', sigil: '~', verb: 'play', word: 'play' })]]);
  const prevStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = { getItem: (k) => storage.get(k) ?? null, setItem() {}, removeItem() {} };
  const win = {
    location: { pathname: '/play/' },
    __SPW_SITE__: { getContext: () => ({ registry: { values: () => [
      { id: 'cauldron', baseId: 'cauldron', status: 'mounted' },
      { id: 'site-search:0', baseId: 'site-search', status: 'mounted' },
      { id: 'lore-arc', baseId: 'lore-arc', status: 'idle', stage: 'scheduled' },
    ] } }) },
  };
  try {
    const ctx = buildTermNoteContext(fakeTerm(), { win });
    assert.equal(ctx.concept, 'lattice');
    assert.equal(ctx.route, '/play/');
    assert.deepEqual(ctx.activeLens && [ctx.activeLens.group, ctx.activeLens.mode], ['play', 'memory']);
    assert.equal(ctx.primedContext?.operator, 'potential');
    assert.ok(ctx.mounted.has('cauldron') && ctx.mounted.has('site-search'));
    assert.ok(!ctx.mounted.has('lore-arc'), 'a scheduled module is not mounted');
    storage.clear();
    assert.equal(buildTermNoteContext(fakeTerm(), { win }).primedContext, null, 'a page seat alone primes nothing');
    assert.equal(buildTermNoteContext(fakeTerm(), { win: {} }).mounted.size, 0);
  } finally {
    globalThis.sessionStorage = prevStorage;
    for (const key of Object.keys(root)) if (!(key in before)) delete root[key];
  }
});

test('search row links into the terms facet and counts only words the loaded index knows', () => {
  assert.equal(termSearchHref('brace-physics'), '/topics/search/?q=brace-physics&facet=terms');
  const ctx = { concept: 'brace-physics', route: '/design/runtime/' };
  setLoadedTerms(null);
  assert.deepEqual(SEARCH_TERM_NOTE_ROW.render(ctx), { label: 'practiced on', value: 'find it in search', href: termSearchHref('brace-physics') });
  // An index loaded without terms[] is "not loaded", never "only this page".
  setLoadedTerms([]);
  assert.equal(SEARCH_TERM_NOTE_ROW.render(ctx).value, 'find it in search');
  setLoadedTerms([{ concept: 'brace-physics', routes: [
    { route: '/design/runtime/', hostId: 'a' },
    { route: '/design/runtime/', hostId: 'b' },
    { route: '/tools/midjourney/', hostId: 'c' },
  ] }]);
  assert.equal(SEARCH_TERM_NOTE_ROW.render(ctx).value, '1 other page');
  assert.equal(SEARCH_TERM_NOTE_ROW.render({ concept: 'unknown', route: '/' }).value, 'find it in search', 'a word the index has not met claims no count');
  assert.equal(SEARCH_TERM_NOTE_ROW.render({ concept: 'brace-physics', route: '/tools/midjourney/' }).value, '1 other page');
  setLoadedTerms([{ concept: 'solo', routes: [{ route: '/play/', hostId: 'x' }] }]);
  assert.equal(SEARCH_TERM_NOTE_ROW.render({ concept: 'solo', route: '/play/' }).value, 'only this page so far');
  const footer = { routes: [{ route: '/', hostId: null, via: 'site-footer', reach: 193 }] };
  assert.equal(countOtherPlaces(footer, '/'), 192);
  assert.equal(countOtherPlaces(footer, '/about/'), 192, 'an includer of the partial counts itself out');
  assert.equal(countPlaces(footer), 193);
  assert.equal(SEARCH_TERM_NOTE_ROW.when({ concept: '' }), false);
  setLoadedTerms(null);
});

test('terms become search entries that land where the word is practised', () => {
  const [entry] = termsToEntries([{ concept: 'memory-garden', text: 'memory garden', definition: null, expression: 'garden[memory]{tend}', routes: [
    { route: '/play/', hostId: 'garden' },
    { route: '/about/', hostId: null },
  ] }]);
  assert.equal(entry.kind, 'term');
  assert.equal(entry.route, '/play/');
  assert.equal(entry.anchor, 'garden');
  assert.equal(entry.places.length, 2);
  assert.deepEqual(distinctPlaces([{ route: '/a/', hostId: 'x' }, { route: '/a/', hostId: 'y', reach: 3 }, { route: '/b/' }]).map((p) => [p.route, p.reach]), [['/a/', 3], ['/b/', 1]]);
  assert.match(entry.haystack, /memory garden/);
  assert.deepEqual(entry.expressionHosts, { 'garden[memory]{tend}': 'garden' });
});

test('owner rows gate on a chosen lens seat near the term, a carried intent, and a mounted cauldron', () => {
  // The page opens the play group on "default" (authored aria-pressed), the study group on its first seat.
  const button = (group, mode, pressed) => ({ getAttribute: (name) => ({ 'data-mode-group': group, 'data-set-mode': mode, 'aria-pressed': pressed ? 'true' : 'false' })[name] ?? null });
  snapshotOpeningSeats({ querySelectorAll: () => [button('play', 'memory', false), button('play', 'default', true), button('study', 'reading', false), button('study', 'making', false)] });

  assert.equal(LENS_TERM_NOTE_ROW.when({ activeLens: null, term: fakeTerm() }), false);
  const hostAt = (mode) => ({ dataset: { spwLensGroup: 'play', spwLensMode: mode, spwLensImpact: 'recall-emphasis', spwLensFeedback: 'recall emphasis · panel' } });
  const inHost = (mode) => ({ activeLens: { mode, group: 'play' }, term: fakeTerm({ hosts: { '[data-spw-lens-impact]': hostAt(mode) } }) });
  assert.equal(LENS_TERM_NOTE_ROW.when(inHost('default')), false, 'the seat the page opened on is not a choice');
  assert.equal(LENS_TERM_NOTE_ROW.when(inHost('memory')), true);
  assert.equal(LENS_TERM_NOTE_ROW.render(inHost('memory')).value, 'memory · recall emphasis · panel');
  const copy = { dataset: { spwCopyLens: 'default memory', spwCopyLabel: 'memory lens' } };
  const inCopy = { activeLens: { mode: 'memory', group: 'play' }, term: fakeTerm({ hosts: { '[data-spw-copy-lens]': copy } }) };
  assert.equal(LENS_TERM_NOTE_ROW.when(inCopy), true);
  assert.equal(LENS_TERM_NOTE_ROW.render(inCopy).value, 'memory · memory lens');
  // A term outside every lens host and copy block: the root's last-written lens is not its lens.
  assert.equal(LENS_TERM_NOTE_ROW.when({ activeLens: { mode: 'making', group: 'study' }, term: fakeTerm() }), false);
  // Another group's host around the term speaks for that group, not the root's.
  const studyHost = { dataset: { spwLensGroup: 'study', spwLensMode: 'reading', spwLensImpact: 'read' } };
  assert.equal(LENS_TERM_NOTE_ROW.when({ activeLens: { mode: 'memory', group: 'play' }, term: fakeTerm({ hosts: { '[data-spw-lens-impact]': studyHost } }) }), false);
  snapshotOpeningSeats({ querySelectorAll: () => [] });

  assert.equal(INTENT_TERM_NOTE_ROW.when({ primedContext: null }), false);
  assert.equal(INTENT_TERM_NOTE_ROW.when({ primedContext: { operator: 'ground', word: 'Study.reading', from: 'page' } }), false);
  assert.equal(INTENT_TERM_NOTE_ROW.render({ primedContext: { operator: 'potential', sigil: '~', verb: 'play', word: 'play' } }).value, '~ play');

  assert.equal(CAULDRON_TERM_NOTE_ROW.when({ mounted: new Set() }), false);
  assert.equal(CAULDRON_TERM_NOTE_ROW.when({ mounted: new Set(['cauldron']) }), true);
});

test('index terms[] carry concept, text, definition, routes {route, hostId}, expression', () => {
  const page = readTermsFromHtml(`<main><section id="bench"><p>A <span class="spw-living-term" data-spw-living-term data-spw-concept="dose-trace" title="what a dose leaves" data-spw-semantic-expression="trace[dose]{}">dose trace</span> here.</p></section></main>`, '/play/');
  const other = readTermsFromHtml(`<p id="x">and a <span data-spw-living-term data-spw-concept="dose-trace">dose trace</span></p><p>orphan <span data-spw-living-term data-spw-concept="elsewhere">word</span></p>`, '/ghost/');
  const terms = buildTermEntries(aggregateTerms([page, other]), { knownRoutes: new Set(['/play/']) });
  assert.deepEqual(terms, [{
    concept: 'dose-trace',
    text: 'dose trace',
    definition: 'what a dose leaves',
    routes: [{ route: '/play/', hostId: 'bench' }],
    expression: 'trace[dose]{}',
  }]);
  const all = buildTermEntries(aggregateTerms([page, other]));
  assert.deepEqual(all.find((t) => t.concept === 'dose-trace').routes.map((r) => r.route), ['/ghost/', '/play/']);
});
