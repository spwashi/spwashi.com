import test from 'node:test';
import assert from 'node:assert/strict';

import { harvestRouteFrames } from '../generate-site-search-index.mjs';
import { copyUnitPlaces } from '../lib/page-copy-audit.mjs';
import { matchUnitKey } from '/public/js/runtime/navigation/site-search.js';

const PAGE = `
  <main>
    <section class="spw-frame" id="home-frame" data-spw-kind="frame">
      <header class="frame-heading"><a class="frame-sigil" href="#home-frame">#&gt;home_frame</a><h1>I'm Spwashi.</h1></header>
      <p id="home-frame-note" data-spw-copy-unit="home.hook.lede">
        <span id="home-lede-atlas" data-spw-copy-unit="home.hook.lede.atlas">A working atlas.</span>
      </p>
      <section class="spw-frame" id="home-folios" aria-labelledby="home-folios-title">
        <h2 id="home-folios-title">Wonder through the stack</h2>
        <p id="home-folios-note" data-spw-copy-unit="home.folios.note">Collaged, laminated.</p>
      </section>
      <p id="home-live-note" data-spw-copy-unit="home.hook.live">Production season.</p>
    </section>
    <section class="spw-panel" id="runtime-atlas" aria-labelledby="runtime-atlas-title">
      <h2 id="runtime-atlas-title">Runtime atlas</h2>
      <p data-spw-copy-unit="design.runtime.atlas.lede">A key with no place stays out.</p>
    </section>
    <section class="spw-panel" id="unnamed-panel"><h2>Not a named region</h2></section>
    <section class="arc-bench" id="arc-bench" hidden aria-labelledby="arc-bench-title"><h2 id="arc-bench-title">Arc bench</h2></section>
    <p id="loose-note" data-spw-copy-unit="home.loose.note">Outside every frame.</p>
  </main>
`;

test('a labelled region is a landing place, and each unit rides on its innermost frame', () => {
  const { frames, unitHosts } = harvestRouteFrames(PAGE, '/', copyUnitPlaces(PAGE));
  assert.deepEqual(frames.map((frame) => frame.anchor), ['home-frame', 'home-folios', 'runtime-atlas']);
  const [hero, folios, runtime] = frames;
  assert.deepEqual(hero.unitHosts, {
    'home.hook.lede': 'home-frame-note',
    'home.hook.lede.atlas': 'home-lede-atlas',
    'home.hook.live': 'home-live-note',
  });
  assert.deepEqual(folios.unitHosts, { 'home.folios.note': 'home-folios-note' });
  assert.equal(runtime.title, 'Runtime atlas');
  assert.equal(runtime.unitHosts, undefined, 'a unit without an id is not a place');
  assert.deepEqual(unitHosts, { 'home.loose.note': 'loose-note' });
});

test('a typed key lands on its unit, whole or as a prefix', () => {
  const hosts = {
    'home.reason.why': 'home-reason-why',
    'home.reason.why.issue': 'home-reason-why-issue',
    'home.promoWonderCycle.intro': 'home-promo-wonder-cycle-intro',
  };
  assert.deepEqual(matchUnitKey(hosts, 'home.reason.why.issue'), { key: 'home.reason.why.issue', exact: true });
  assert.deepEqual(matchUnitKey(hosts, 'home.reason'), { key: 'home.reason.why', exact: false });
  assert.deepEqual(matchUnitKey(hosts, 'Home.PromoWonderCycle.Intro'), { key: 'home.promoWonderCycle.intro', exact: true });
  assert.equal(matchUnitKey(hosts, 'reason'), null, 'a bare word is not a key');
  assert.equal(matchUnitKey(hosts, '.recipes'), null, 'a sigil-led query stays a sigil');
  assert.equal(matchUnitKey(hosts, 'spw.quest'), null);
  assert.equal(matchUnitKey(undefined, 'home.reason'), null);
});
