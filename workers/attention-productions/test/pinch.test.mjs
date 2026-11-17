// The set's pinch (workers/lib/pinch.js): factshift.center's thresholds and words, on every page that carries it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { PINCH, cueOf, thresholdOf } from '../../lib/pinch.js';
import { SHOT_DEPTH, stepShot } from '../src/compose.js';

const factshift = (file) => new URL(`../../factshift-center/app/src/js/${file}`, import.meta.url);
const app = existsSync(factshift('simulation/pinch.ts'));

test('the pinch steps where factshift.center\'s does, in its words', { skip: !app && 'the factshift.center app is not checked out here' }, () => {
  const pinch = readFileSync(factshift('simulation/pinch.ts'), 'utf8');
  const cue = readFileSync(factshift('ui/scale-cue.ts'), 'utf8');
  assert.match(pinch, new RegExp(`const SPREAD = ${PINCH.enter};`));
  assert.match(pinch, new RegExp(`const CLOSED = ${PINCH.up};`));
  assert.match(pinch, new RegExp(`Math\\.exp\\(-event\\.deltaY / ${PINCH.wheel}\\)`));
  for (const [sign, at, words] of [['>=', PINCH.enter, '#>enter · '], ['>=', PINCH.keep, '#>keep · '], ['<=', PINCH.up, '^up · '], ['<=', PINCH.near, '^near · ']]) {
    assert.ok(cue.includes(`scale ${sign} ${at}`), `scale ${sign} ${at}`);
    assert.ok(cue.includes(`\`${words}`), words);
  }
  assert.ok(cue.includes("`${base} → ${input.action}`") && cue.includes('×${(input.scale ?? 1).toFixed(2)}'), 'the cue reads @plane · ×1.24 → action');
});

test('a pinch says before it goes, and goes only past the step', () => {
  assert.deepEqual(thresholdOf(1.1, 'close-up', 'wide'), { direction: null, action: '', armed: false });
  assert.deepEqual(thresholdOf(1.2, 'close-up', 'wide'), { direction: 'in', action: '#>keep · close-up', armed: false });
  assert.deepEqual(thresholdOf(1.35, 'close-up', 'wide'), { direction: 'in', action: '#>enter · close-up', armed: true });
  assert.deepEqual(thresholdOf(0.8, 'close-up', 'wide'), { direction: 'out', action: '^near · wide', armed: false });
  assert.deepEqual(thresholdOf(0.6, 'close-up', 'wide'), { direction: 'out', action: '^up · wide', armed: true });
  assert.equal(thresholdOf(2, null, 'wide').armed, false, 'no step in, no step');
  assert.equal(cueOf('shot', 1.2, '#>keep · close-up'), '@shot · ×1.20 → #>keep · close-up');
  assert.equal(cueOf('vibe', 0.9, ''), '@vibe · ×0.90');
});

test('on attention.productions, in is a tighter shot and out a wider one', () => {
  const at = (shot) => ({ shot });
  assert.equal(stepShot(at('wide'), 'in'), 'medium');
  assert.equal(stepShot(at('wide'), 'out'), 'establishing');
  assert.equal(stepShot(at('establishing'), 'out'), null, 'out past establishing is the set');
  assert.equal(stepShot(at('extreme close-up'), 'in'), null);
  assert.equal(stepShot(at('overhead'), 'in'), 'close-up', 'an angle stands at a medium\'s depth');
  for (const shot of SHOT_DEPTH) assert.ok(SHOT_DEPTH.includes(shot));
});

test('each page in the set carries the same pinch', () => {
  const lib = (file) => readFileSync(new URL(`../../lib/${file}`, import.meta.url), 'utf8');
  for (const unit of ['attention-productions', 'mutex-buzz', 'tealstripes-vibes']) {
    for (const file of ['pinch.js', 'pinch.css']) assert.equal(readFileSync(new URL(`../../${unit}/assets/${file}`, import.meta.url), 'utf8'), lib(file), `${unit}/assets/${file}`);
  }
});
