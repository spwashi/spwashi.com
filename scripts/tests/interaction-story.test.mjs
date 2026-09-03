import test from 'node:test';
import assert from 'node:assert/strict';
import {
  phaseFromContractKind,
  GESTURE_VERB_TO_PHASE,
} from '../../public/js/runtime/interaction-vocabulary.js';
import { landmarkHashFromHref } from '../../public/js/runtime/interaction-hops.js';
import { readInteractionStory } from '../../public/js/runtime/interaction-story.js';

test('tap and swipe verbs on one contract stay distinct', () => {
  const contract = 'tap:travel hold:preview swipe:cycle';
  assert.equal(phaseFromContractKind(contract, 'tap'), 'discover');
  assert.equal(phaseFromContractKind(contract, 'hold'), 'prime');
  assert.equal(phaseFromContractKind(contract, 'swipe'), 'discover');
  assert.equal(GESTURE_VERB_TO_PHASE.travel, 'discover');
});

test('a toggle-like tap without travel stays prime', () => {
  assert.equal(phaseFromContractKind('tap:prime hold:charge', 'tap'), 'prime');
  assert.equal(phaseFromContractKind('', 'tap'), 'prime');
});

test('landmark hashes read from in-page and route-shaped hrefs', () => {
  assert.equal(landmarkHashFromHref('#about-index'), 'about-index');
  assert.equal(landmarkHashFromHref('/about/#about-years'), 'about-years');
  assert.equal(landmarkHashFromHref('/play/'), '');
});

test('interaction story joins existing attrs rather than inventing one', () => {
  const html = document.documentElement;
  html.dataset.spwInteractionPhase = 'discover';
  html.dataset.spwMicrointeractionPulse = 'discover';
  const story = readInteractionStory(document);
  assert.equal(story.phase, 'discover');
  assert.equal(story.pulse, 'discover');
  assert.match(story.expression, /discover/);
  assert.ok(story.reading.includes('discover'));
  delete html.dataset.spwInteractionPhase;
  delete html.dataset.spwMicrointeractionPulse;
});
