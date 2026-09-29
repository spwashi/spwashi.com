import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aggregateTerms,
  batchWorksheet,
  collectHomes,
  reachHistogram,
  readTermsFromHtml,
  routeForSource,
  termAnchor,
  trimAround,
} from '../lib/living-terms.mjs';

const PAGE = `<!doctype html>
<html><body data-spw-wonder="orientation">
<main>
  <section id="hook">
    <p>The kernel is small: <span class="spw-living-term" data-spw-living-term data-spw-concept="lattice" tabindex="0">lattice</span> carries it &amp; more.</p>
    <p>A <span class="spw-living-term" data-spw-living-term data-spw-concept="retrieval" title="retrieving something strengthens memory" data-spw-semantic-expression="memory[retrieve]{}" data-spw-practice="recall first">retrieval</span> habit.</p>
    <p><a href="/x/">see <span class="spw-living-term" data-spw-living-term data-spw-concept="nested-one">nested</span></a></p>
    <p><span class="spw-living-term" data-spw-living-term tabindex="0">waiting word</span> has no concept yet.</p>
    <p><span class="spw-living-term" data-spw-living-term data-spw-concept="lattice" title="tap: inspect • hold to prime">lattice</span> again.</p>
  </section>
  <article class="spw-living-term" data-spw-living-term data-spw-concept="garden" id="garden-card"><h3>Garden</h3><p>Where fragments rest.</p></article>
  <script>const s = '<span data-spw-living-term data-spw-concept="ghost">';</script>
  <button type="button" data-copy-target="data-spw-living-term" id="attr-data-spw-living-term">copy</button>
</main>
</body></html>`;

const HOME = `<section id="retrieval"><h2>Retrieval</h2></section>
<details class="card" data-spw-concept="garden" id="garden-home"></details>
<spw-include src="media-cauldron"></spw-include><spw-site-footer></spw-site-footer>`;

const PARTIAL = `<p>Name one <span class="spw-living-term" data-spw-living-term data-spw-concept="source-ingredient">source ingredient</span>.</p>`;

test('routeForSource maps pages and partials', () => {
  assert.equal(routeForSource('index.html'), '/');
  assert.equal(routeForSource('about/index.html'), '/about/');
  assert.equal(routeForSource('_partials/media-cauldron.html'), '/_partials/media-cauldron.html');
});

test('readTermsFromHtml reads every term field from fixture HTML', () => {
  const { terms, ids } = readTermsFromHtml(PAGE, '/fixture/');
  assert.equal(terms.length, 6, 'script bodies and attribute values naming the attribute are not terms');
  const [lattice, retrieval, nested, waiting, lie, garden] = terms;

  assert.equal(lattice.concept, 'lattice');
  assert.equal(lattice.element, 'span');
  assert.equal(lattice.text, 'lattice');
  assert.equal(lattice.hostId, 'hook');
  assert.equal(lattice.definition, null);
  assert.equal(lattice.focusable, true);
  assert.equal(lattice.sentence, 'The kernel is small: lattice carries it & more.');
  assert.equal(lattice.note.wonder, 'orientation');
  assert.equal(lattice.wonderFrom, 'ancestor');
  assert.equal(lattice.depth, 1);

  assert.equal(retrieval.definition, 'retrieving something strengthens memory');
  assert.equal(retrieval.expression, 'memory[retrieve]{}');
  assert.equal(retrieval.note.practice, 'recall first');
  assert.equal(retrieval.depth, 2);

  assert.equal(nested.nested, 'a');
  assert.equal(waiting.concept, null);
  assert.equal(waiting.text, 'waiting word');
  assert.equal(lie.definition, null, 'a gesture title is never a definition');
  assert.match(lie.affordanceTitle, /^tap:/);

  assert.equal(garden.element, 'article');
  assert.equal(garden.hostId, 'garden-card');
  assert.equal(garden.sentence, 'Garden Where fragments rest.', 'an article term is its own block');
  assert.ok(ids.includes('attr-data-spw-living-term'));
});

test('trimAround keeps a word-aligned window around a term far into a long block', () => {
  const long = `${'word '.repeat(80)}needle ${'tail '.repeat(40)}`.trim();
  const out = trimAround(long, 'needle', 60);
  assert.ok(out.length <= 62);
  assert.ok(out.includes('needle'));
  assert.ok(out.startsWith('…word'));
  assert.equal(trimAround('short', 'short', 60), 'short');
});

function fixtureReport() {
  return aggregateTerms([
    readTermsFromHtml(PAGE, '/fixture/'),
    readTermsFromHtml(HOME, '/home/'),
    readTermsFromHtml(PARTIAL, '/_partials/media-cauldron.html'),
  ]);
}

test('aggregateTerms counts waiting terms by absence, homes, lies and reach', () => {
  const report = fixtureReport();
  assert.equal(report.terms.length, 7);
  assert.equal(report.waiting.length, 1);
  assert.equal(report.waiting[0].text, 'waiting word');
  const by = Object.fromEntries(report.concepts.map((c) => [c.concept, c]));
  assert.equal(by.lattice.terms, 2);
  assert.equal(by.lattice.living, false);
  assert.equal(by.retrieval.living, true);
  assert.deepEqual(by.retrieval.homes, ['/home/#retrieval']);
  assert.deepEqual(by.garden.homes, ['/home/#garden-home']);
  assert.equal(by['source-ingredient'].reach, 1, 'a partial term reaches the routes that include it');
  assert.deepEqual(report.includedBy['media-cauldron'], ['/home/']);
  assert.equal(report.lies.affordance.length, 1);
  assert.equal(report.lies.nested.length, 1);
  assert.equal(report.lies.focusable.length, 2);
  assert.deepEqual(report.depthHistogram, [1, 5, 1, 0, 0, 0]);
  assert.deepEqual(reachHistogram(report.concepts), [[1, 5]]);
});

test('a partial term takes the wonder around its include on each route, and its ids home on the first includer', () => {
  const partial = `<section id="media-cauldron"><p>Name one <span data-spw-living-term data-spw-concept="source-ingredient">source ingredient</span>.</p></section>
<footer><p><span data-spw-living-term data-spw-concept="spwashi">Spwashi</span></p></footer>`;
  const play = `<body data-spw-wonder="orientation"><main data-spw-wonder="projection resonance"><div><spw-include src="media-cauldron"></spw-include></div></main></body>`;
  const bare = `<body><main><spw-include src="media-cauldron.html"></spw-include></main></body>`;
  const report = aggregateTerms([
    readTermsFromHtml(play, '/play/'),
    readTermsFromHtml(bare, '/bare/'),
    readTermsFromHtml(partial, '/_partials/media-cauldron.html'),
  ]);
  const term = report.terms.find((t) => t.concept === 'source-ingredient');
  assert.deepEqual(term.includedOn, ['/bare/', '/play/']);
  assert.deepEqual(term.renderedDepths, { 0: 1, 1: 1 });
  assert.equal(term.depth, 1, 'a tie between routes goes to the deeper reading');
  assert.equal(term.wonderFrom, 'includer');
  assert.equal(term.includerWonder, 'projection resonance');
  assert.equal(term.note.wonder, null, 'the fragment itself still carries no wonder');
  assert.equal(termAnchor(term), '/bare/#media-cauldron (via _partials/media-cauldron, on 2 routes)');
  assert.deepEqual(report.includedBy['media-cauldron'], ['/bare/', '/play/']);

  const homes = collectHomes([
    readTermsFromHtml('<section id="media-cauldron"></section>', '/home/'),
    readTermsFromHtml(play, '/play/'),
    readTermsFromHtml(partial, '/_partials/media-cauldron.html'),
  ]);
  assert.deepEqual(homes.get('media-cauldron'), ['/home/#media-cauldron', '/play/#media-cauldron'], 'route-authored anchors first, then partial ids on the first includer');

  const orphan = aggregateTerms([readTermsFromHtml(partial, '/_partials/orphan.html')]).terms[0];
  assert.equal(orphan.depth, 0);
  assert.match(termAnchor(orphan), /included nowhere/);
});

test('a term-less page yields the same ids and concept hosts as one with a term', () => {
  const page = `<ol>
  <li data-plan-id="plan-bucket-semantic-rails" id="bucket">x</li>
  <details class="card"
    data-spw-concept="garden"
    id="garden-home"></details>
  <span data-spw-concept="not-a-host" id="span-host"></span>
</ol>`;
  const without = readTermsFromHtml(page, '/p/');
  const withTerm = readTermsFromHtml(`${page}<p><span data-spw-living-term data-spw-concept="x">x</span></p>`, '/p/');
  assert.deepEqual(without.ids.sort(), ['bucket', 'garden-home', 'span-host']);
  assert.deepEqual(without.ids, withTerm.ids.sort());
  assert.deepEqual(without.conceptHosts, [{ concept: 'garden', id: 'garden-home' }]);
  assert.deepEqual(without.conceptHosts, withTerm.conceptHosts);
});

test('batchWorksheet orders decorated concepts by use, then name, and lists every sentence', () => {
  const t = (route, concept, i) => ({
    route, line: i, element: 'span', text: concept, concept, definition: null, href: null,
    hostId: `h${i}`, expression: null, note: {}, depth: 0, sentence: `${concept} lives here ${i}.`,
  });
  const terms = [
    t('/a/', 'zeta', 1), t('/b/', 'zeta', 2), t('/c/', 'zeta', 3),
    t('/a/', 'alpha', 4), t('/b/', 'alpha', 5),
    t('/a/', 'beta', 6), t('/b/', 'beta', 7),
    t('/a/', 'gamma', 8),
    t('/a/', 'defined', 9), t('/b/', 'defined', 10), t('/c/', 'defined', 11), t('/d/', 'defined', 12),
  ];
  terms[8].definition = 'has one';
  const { concepts } = aggregateTerms([{ route: '/a/', terms, ids: [], conceptHosts: [], includes: [] }]);
  const first = batchWorksheet({ concepts, terms }, 1, 2);
  assert.equal(first.decorated, 4);
  assert.equal(first.batches, 2);
  assert.deepEqual(first.concepts.map((c) => c.concept), ['zeta', 'alpha']);
  assert.deepEqual(first.concepts[0].uses.map((u) => u.anchor), ['/a/#h1', '/b/#h2', '/c/#h3']);
  assert.equal(first.concepts[0].uses[1].sentence, 'zeta lives here 2.');
  const second = batchWorksheet({ concepts, terms }, 2, 2);
  assert.deepEqual(second.concepts.map((c) => c.concept), ['beta', 'gamma']);
  assert.equal(batchWorksheet({ concepts, terms }, 3, 2).concepts.length, 0);
});

test('batchWorksheet breaks a use tie on reach before name', () => {
  const one = (route, concept) => ({ route, line: 1, element: 'span', text: concept, concept, definition: null, href: null, hostId: null, expression: null, note: {}, depth: 0, sentence: '' });
  const terms = [one('/a/', 'alpha'), one('/_partials/site-footer.html', 'spwashi')];
  const { concepts } = aggregateTerms([
    { route: '/a/', terms: [terms[0]], ids: [], conceptHosts: [], includes: ['site-footer'] },
    { route: '/b/', terms: [], ids: [], conceptHosts: [], includes: ['site-footer'] },
    { route: '/_partials/site-footer.html', terms: [terms[1]], ids: [], conceptHosts: [], includes: [] },
  ]);
  assert.deepEqual(batchWorksheet({ concepts, terms }, 1, 2).concepts.map((c) => [c.concept, c.reach]), [['spwashi', 2], ['alpha', 1]]);
  assert.equal(batchWorksheet({ concepts, terms }, 1, 2).concepts[0].uses[0].anchor, '/a/ (via _partials/site-footer, on 2 routes)');
});
