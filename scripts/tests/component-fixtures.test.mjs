import assert from 'node:assert/strict';
import test from 'node:test';

import {
  COMPONENT_FIXTURES,
  getComponentFixture,
} from '../../public/js/kernel/component-fixtures.js';
import {
  REGION_ECOLOGY_FIXTURES,
  getRegionEcologyFixture,
} from '../../public/js/kernel/region-ecology-fixtures.js';
import { readFile } from 'node:fs/promises';

import { readExpressionSlots } from '../../public/js/semantic/expression-query.js';
import { collectComponentContractReport } from '../component-contracts.mjs';

test('component fixtures have stable ids and consumer lookup', () => {
  assert.deepEqual(COMPONENT_FIXTURES.map((fixture) => fixture.id), [
    'site-frame',
    'frame-card',
    'operator-chip',
    'tuning-strip',
    'home-seat-line',
  ]);
  assert.equal(getComponentFixture('frame-card')?.label, 'Frame card');
  const tuningStrip = getComponentFixture('tuning-strip');
  assert.equal(tuningStrip?.cssOwner, 'public/css/components/controls.css');
  assert.equal(tuningStrip?.snippet, 'design/components/snippets/tuning-strip.html');
  // Retargeted in 60402f20 ("aim ... tuning ... at the frame that actually
  // holds them"): the wider #structural-vocabulary region crop was starved,
  // so the region flow now shoots the same host as the component flow.
  assert.equal(tuningStrip?.regionSelector, '#structural-vocabulary .tuning-strip');
  assert.deepEqual(tuningStrip?.captureFlows, ['region', 'component', 'template']);
  assert.ok(
    COMPONENT_FIXTURES
      .filter((fixture) => fixture.captureFlows?.includes('region'))
      .every((fixture) => fixture.regionSelector),
  );
  assert.equal(getComponentFixture('missing'), undefined);
});

test('component fixtures point to real specimens and CSS owners', async () => {
  const report = await collectComponentContractReport();
  assert.deepEqual(report.errors, []);
  assert.equal(report.ecology, REGION_ECOLOGY_FIXTURES.length);
});

test('region ecology fixtures name six seats on live routes', () => {
  assert.equal(getRegionEcologyFixture('about-years')?.seat, 'path');
  // Retargeted in 60402f20: the data-spw-cluster wrapper was the wrong host
  // for capture; #systems-register is the frame that actually holds it.
  assert.equal(getRegionEcologyFixture('about-systems-desk')?.selector, '#systems-register');
  assert.ok(REGION_ECOLOGY_FIXTURES.every((fixture) => fixture.specimenRoute && fixture.selector && fixture.seat));
  assert.equal(getComponentFixture('frame-card')?.sizeToken, 'measure-card');
});

/* The seat line's contract (.spw/caches/spw-native-components-2026-11.spw
   slots_agree): what a reader sees in each bracket is what the slot reader
   takes from the same text. Checked on the authored markup, so it holds with
   scripts off. */
const textOf = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
const partOf = (html, part) => textOf(html.match(new RegExp(`<(span|a) class="home-seat-line__${part}"[^>]*>([\\s\\S]*?)</\\1>`))?.[0] || '');

function seatLines(html) {
  return [...html.matchAll(/<p class="home-seat-line"[^>]*>([\s\S]*?)<\/p>/g)].map((match) => match[1]);
}

function assertSeatLineAgrees(line, where) {
  const slots = readExpressionSlots(textOf(line));
  assert.equal(partOf(line, 'subject'), slots.subject, `${where}: the word`);
  assert.equal(partOf(line, 'mode'), `[${slots.mode}]`, `${where}: the seat`);
  // The body span nests its held word, so it is read whole: from its opening tag to the link that follows it.
  const body = textOf(line.match(/<span class="home-seat-line__body"[^>]*>([\s\S]*)<\/span><a class="home-seat-line__next"/)?.[1] || '');
  assert.equal(body, `{${slots.body}}`, `${where}: what it holds`);
  assert.equal(partOf(line, 'held'), slots.body, `${where}: the held word is the body`);
  assert.equal(partOf(line, 'next'), `<${slots.projection}>`, `${where}: where it leads`);
  assert.match(line, /<a class="home-seat-line__next" href="[^"]+"/, `${where}: the projection is a link`);
}

test('each seat line shows the slots its own text reads as, on Home and in the snippet', async () => {
  const fixture = getComponentFixture('home-seat-line');
  const home = seatLines(await readFile(new URL('../../index.html', import.meta.url), 'utf8'));
  assert.equal(home.length, fixture.states.length, 'one seat line per lens the fixture names');
  home.forEach((line, index) => assertSeatLineAgrees(line, `home seat ${index + 1}`));
  assert.deepEqual(home.map((line) => readExpressionSlots(textOf(line)).mode), fixture.states);

  const snippet = seatLines(await readFile(new URL(`../../${fixture.snippet}`, import.meta.url), 'utf8'));
  assert.equal(snippet.length, 1);
  assertSeatLineAgrees(snippet[0], 'snippet');
});
