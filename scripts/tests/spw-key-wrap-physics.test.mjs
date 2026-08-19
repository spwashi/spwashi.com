import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { getOperatorDefinition } from '../../public/js/kernel/operator-detection.js';

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
