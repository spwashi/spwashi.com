import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getOperatorDefinition } from '../../public/js/kernel/operator-detection.js';
import {
  composeModeSeatExpression,
  composeWrapJobExpression,
  describeWrapScan,
  formatWrapJobChip,
} from '../../public/js/semantic/spw-compose.js';

const keyEvents = await readFile(new URL('../../public/js/runtime/spw-key-events.js', import.meta.url), 'utf8');
const navigator = await readFile(new URL('../../public/js/runtime/frame-navigator.js', import.meta.url), 'utf8');

test('mode wrap opens a seat instead of cycling like arrows', () => {
  const mode = getOperatorDefinition('mode');
  assert.equal(mode.prefix, '[');
  assert.equal(mode.physics, 'indexed posture lens');
  assert.match(mode.interaction, /choose a mode while keeping alternatives discoverable/);
  assert.match(keyEvents, /function openModeSeat/);
  assert.match(keyEvents, /function closeModeSeat/);
  assert.doesNotMatch(keyEvents, /cycleActiveFrameMode/);
  assert.doesNotMatch(keyEvents, /event\.key === '\['\) \{\s*if \(cycle/);
});

test('direction and scene wraps stay distinct from mode', () => {
  const direction = getOperatorDefinition('direction');
  const scene = getOperatorDefinition('scene');
  assert.equal(direction.prefix, '{');
  assert.equal(scene.prefix, '(');
  assert.match(keyEvents, /event\.key === '\{'/);
  assert.match(keyEvents, /event\.key === '\('/);
  assert.match(keyEvents, /binding: 'scene-enter'/);
  assert.doesNotMatch(navigator, /e\.key === '\]'/);
  assert.doesNotMatch(navigator, /e\.key === '\['/);
});

test('mode-seat expressions name the seat, not a sibling list', () => {
  assert.equal(composeModeSeatExpression({ subject: 'home', seat: 'reading' }), 'home[reading]{open.sit}');
  assert.doesNotMatch(
    composeModeSeatExpression({ subject: 'home', seat: 'reading' }),
    /reading\.systems/,
  );
  assert.doesNotMatch(keyEvents, /variants\.join\('\.'\)/);
});

test('wrap keys write interaction context from the focused host', () => {
  assert.match(keyEvents, /function writeInteractionContext/);
  assert.match(keyEvents, /function resolveContextSceneHost/);
  assert.match(keyEvents, /writeInteractionContext\('inspecting'/);
  assert.match(keyEvents, /writeInteractionContext\('comparing'/);
  assert.match(keyEvents, /writeInteractionContext\('browsing'/);
  assert.match(keyEvents, /writeInteractionContext\('reading'/);
});

test('wrap jobs name sit, travel, and learn without dotted sibling lists', () => {
  assert.equal(
    composeWrapJobExpression({ wrap: 'mode', subject: 'home', seat: 'reading', job: 'display' }),
    'home[reading]{open.sit}<display>',
  );
  assert.equal(
    composeWrapJobExpression({ wrap: 'direction', subject: 'rooms', job: 'navigate' }),
    'rooms{travel}<navigate>',
  );
  assert.equal(
    composeWrapJobExpression({ wrap: 'scene', subject: 'look', job: 'learn' }),
    '(look{stage}<learn>',
  );
  assert.equal(
    composeWrapJobExpression({ wrap: 'wonder', subject: 'reading', job: 'learn' }),
    '?reading{kin}<learn>',
  );
  assert.equal(formatWrapJobChip({ wrap: 'mode', seat: 'systems' }), '[systems] sit lens');
  assert.equal(formatWrapJobChip({ wrap: 'direction', nextLabel: 'entrance_sorter' }), '{entrance_sorter} next frame');
  assert.doesNotMatch(
    composeWrapJobExpression({ wrap: 'mode', subject: 'home', seat: 'reading' }),
    /reading\.systems/,
  );
  assert.doesNotMatch(composeWrapJobExpression({ wrap: 'wonder', subject: 'reading' }), /ask\.see/);
  assert.doesNotMatch(composeWrapJobExpression({ wrap: 'direction', subject: 'rooms' }), /prev\.next/);
  assert.doesNotMatch(composeWrapJobExpression({ wrap: 'scene', subject: 'look' }), /enter\.leave/);
});

test('section-handle scan follows wrap context', () => {
  assert.deepEqual(
    describeWrapScan({ context: 'inspecting', seat: 'reading', token: '#>', label: 'home' }),
    { token: '[reading]', label: 'sit lens' },
  );
  assert.deepEqual(
    describeWrapScan({ context: 'browsing', nextLabel: 'Pick your door', token: '#>', label: 'home' }),
    { token: '{ }', label: 'Pick your door' },
  );
  assert.deepEqual(
    describeWrapScan({ context: 'comparing', token: '#>', label: 'home' }),
    { token: '(look)', label: 'learn more' },
  );
  assert.deepEqual(
    describeWrapScan({ context: 'reading', token: '#>home_frame', label: 'home' }),
    { token: '#>home_frame', label: 'home' },
  );
});

test('wrap-job clicks bind to existing wrap physics', () => {
  assert.match(keyEvents, /function onWrapJobActivate/);
  assert.match(keyEvents, /function syncWrapJobLabels/);
  assert.match(keyEvents, /data-spw-feature="wrap-jobs"/);
  assert.match(keyEvents, /addEventListener\('click', onWrapJobActivate\)/);
  assert.match(keyEvents, /function focusFrame/);
  assert.match(keyEvents, /\[wrap\]\{rail\}/);
});
