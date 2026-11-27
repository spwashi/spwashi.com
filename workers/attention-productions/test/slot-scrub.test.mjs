// Shared horizontal slot-scrub runtime across attention.productions, texture.website, and tealstripesvibes.com.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SCRUB_MEASURE,
  SLOT_SCRUB_COMMIT_MODES,
  bindSlotScrub,
  scrubStepDelta,
  stepLadderIndex,
  swallowsTap,
} from '../../lib/slot-scrub.js';
import { PEER_GESTURES, PEER_PINCH, PEER_SCRUB_COMMIT_MODES } from '../../lib/peer-kit.js';
import {
  GESTURE_MEASURE,
  PINCH_MEASURE,
  SLOT_SCRUB_COMMIT_MODES as KERNEL_COMMIT_MODES,
  pinchCueOf,
  pinchThresholdOf,
  scrubStepDelta as kernelScrubDelta,
  stepLadderIndex as kernelStepLadder,
} from '../../../public/js/kernel/gesture-measure.js';
import { PINCH, cueOf, thresholdOf } from '../../lib/pinch.js';

const workers = path.dirname(path.dirname(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url))));
const HOSTS = [
  { dir: 'attention-productions', script: 'attention.js', commit: 'on-lift' },
  { dir: 'texture-website', script: 'texture.js', commit: 'live' },
  { dir: 'tealstripesvibes', script: 'tealstripes.js', commit: 'prime-then-keep' },
];

test('worker slot-scrub and pinch measures match the site kernel and peer-kit exports', () => {
  assert.deepEqual(PEER_GESTURES, GESTURE_MEASURE);
  assert.deepEqual(PEER_PINCH, PINCH_MEASURE);
  assert.deepEqual(PEER_SCRUB_COMMIT_MODES, KERNEL_COMMIT_MODES);
  assert.deepEqual(SLOT_SCRUB_COMMIT_MODES, KERNEL_COMMIT_MODES);
  assert.equal(SCRUB_MEASURE.stepPx, GESTURE_MEASURE.scrubStepPx);
  assert.equal(SCRUB_MEASURE.deadZonePx, GESTURE_MEASURE.scrubDeadZonePx);
  assert.equal(SCRUB_MEASURE.holdMs, GESTURE_MEASURE.holdMs);
  assert.equal(SCRUB_MEASURE.swipeMinPx, GESTURE_MEASURE.swipeMinPx);
  assert.equal(SCRUB_MEASURE.swipeDominance, GESTURE_MEASURE.swipeDominance);
  assert.equal(SCRUB_MEASURE.tapSwallowMs, GESTURE_MEASURE.tapSwallowMs);
  for (const key of ['enter', 'keep', 'near', 'up', 'wheel']) {
    assert.equal(PINCH[key], PINCH_MEASURE[key], `PINCH.${key}`);
  }
  for (const d of [-84, -28, -10, 0, 12, 28, 56]) {
    assert.equal(scrubStepDelta(d), kernelScrubDelta(d), `scrubStepDelta(${d})`);
  }
  assert.equal(stepLadderIndex(0, 5, -1, { wrap: true }), kernelStepLadder(0, 5, -1, { wrap: true }));
  assert.equal(stepLadderIndex(4, 5, 1, { clamp: true }), kernelStepLadder(4, 5, 1, { clamp: true }));
  assert.deepEqual(thresholdOf(1.22, 'close-up', 'wide'), pinchThresholdOf(1.22, 'close-up', 'wide'));
  assert.equal(cueOf('shot', 1.22, '#>keep · close-up'), pinchCueOf('shot', 1.22, '#>keep · close-up'));
});

test('each visual host carries byte-identical slot-scrub files, links /slot-scrub.css, and declares its commit mode', () => {
  const libJs = readFileSync(path.join(workers, 'lib', 'slot-scrub.js'), 'utf8');
  const libCss = readFileSync(path.join(workers, 'lib', 'slot-scrub.css'), 'utf8');
  for (const host of HOSTS) {
    const assets = path.join(workers, host.dir, 'assets');
    assert.equal(readFileSync(path.join(assets, 'slot-scrub.js'), 'utf8'), libJs, `${host.dir}/assets/slot-scrub.js`);
    assert.equal(readFileSync(path.join(assets, 'slot-scrub.css'), 'utf8'), libCss, `${host.dir}/assets/slot-scrub.css`);
    const html = readFileSync(path.join(assets, 'index.html'), 'utf8');
    assert.ok(html.includes('href="/slot-scrub.css"'), `${host.dir} links /slot-scrub.css`);
    const js = readFileSync(path.join(assets, host.script), 'utf8');
    assert.match(js, /bindSlotScrub\(/, `${host.dir} binds bindSlotScrub`);
    assert.ok(js.includes(`commit: "${host.commit}"`), `${host.dir} declares commit: "${host.commit}"`);
  }
});

test('swallowsTap and bindSlotScrub enforce 6px dead zone, 28px step cadence, and ghost-click suppression', () => {
  const listeners = new Map();
  const prevWindow = globalThis.window;
  const fakeWindow = {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatch(type, event) {
      for (const fn of [...(listeners.get(type) || [])]) fn(event);
    },
  };
  globalThis.window = fakeWindow;
  try {
    const slotAttrs = new Map([['data-key', 'light']]);
    const classes = new Set(['slot']);
    const slotListeners = new Map();
    const slot = {
      tagName: 'BUTTON',
      dataset: { key: 'light' },
      ownerDocument: { defaultView: fakeWindow },
      classList: {
        toggle(c, on) { if (on) classes.add(c); else classes.delete(c); },
        contains(c) { return classes.has(c); },
      },
      matches: (sel) => sel.includes('.slot'),
      closest: () => slot,
      contains: () => true,
      setAttribute: (k, v) => slotAttrs.set(k, String(v)),
      getAttribute: (k) => slotAttrs.get(k),
      removeAttribute: (k) => slotAttrs.delete(k),
      addEventListener(type, fn) {
        if (!slotListeners.has(type)) slotListeners.set(type, new Set());
        slotListeners.get(type).add(fn);
      },
      removeEventListener(type, fn) {
        slotListeners.get(type)?.delete(fn);
      },
      dispatch(type, event) {
        for (const fn of [...(slotListeners.get(type) || [])]) fn(event);
      },
    };

    const steps = [];
    const releases = [];
    let taps = 0;
    const cleanup = bindSlotScrub(slot, {
      selector: '.slot',
      commit: 'prime-then-keep',
      onStep: (key, dir, info) => steps.push([key, dir, info.delta]),
      onRelease: (key, info) => releases.push([key, info.delta, info.commit]),
      onTap: () => { taps += 1; },
    });

    assert.equal(slot.getAttribute('data-scrub-commit'), 'prime-then-keep');
    slot.dispatch('pointerdown', { button: 0, pointerId: 1, clientX: 100, target: slot, preventDefault() {} });
    // Sub-dead-zone jitter (< 6px) must not step.
    fakeWindow.dispatch('pointermove', { pointerId: 1, clientX: 104 });
    assert.equal(steps.length, 0);
    // 28px step forward + another 28px step forward.
    fakeWindow.dispatch('pointermove', { pointerId: 1, clientX: 158 });
    assert.deepEqual(steps, [['light', 1, 1], ['light', 1, 2]]);
    assert.equal(slot.getAttribute('data-scrubbing'), 'true');

    fakeWindow.dispatch('pointerup', { pointerId: 1 });
    assert.equal(slot.getAttribute('data-scrubbing'), undefined);
    assert.deepEqual(releases, [['light', 2, 'prime-then-keep']]);
    // Between presses the window hears nothing but the one-shot click blocker.
    assert.equal(listeners.get('pointermove')?.size ?? 0, 0);

    // Immediate synthetic click after scrub release is swallowed.
    let defaultPrevented = false;
    slot.dispatch('click', {
      button: 0,
      target: slot,
      preventDefault() { defaultPrevented = true; },
      stopPropagation() {},
    });
    assert.equal(defaultPrevented, true);
    assert.equal(taps, 0);

    // Subsequent intentional click steps via onTap.
    slot.dispatch('click', {
      button: 0,
      target: slot,
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(taps, 1);

    // In a browser the window's capture-phase blocker takes the ghost click first;
    // the next real tap on the slot must still land.
    slot.dispatch('pointerdown', { button: 0, pointerId: 2, clientX: 100, target: slot, preventDefault() {} });
    fakeWindow.dispatch('pointermove', { pointerId: 2, clientX: 140 });
    fakeWindow.dispatch('pointerup', { pointerId: 2 });
    let ghostStopped = false;
    fakeWindow.dispatch('click', { preventDefault() {}, stopPropagation() { ghostStopped = true; } });
    assert.equal(ghostStopped, true);
    slot.dispatch('click', { button: 0, target: slot, preventDefault() {}, stopPropagation() {} });
    assert.equal(taps, 2);

    // Shift on a button steps back (texture.website); it is not filtered out as a link's new-window click.
    let shifted = null;
    const shiftCleanup = bindSlotScrub(slot, { selector: '.slot', onTap: (_key, event) => { shifted = event.shiftKey; } });
    slot.dispatch('click', { button: 0, shiftKey: true, target: slot, preventDefault() {}, stopPropagation() {} });
    assert.equal(shifted, true);
    shiftCleanup();

    cleanup();
  } finally {
    globalThis.window = prevWindow;
  }

  const check = swallowsTap(null, 100);
  assert.equal(check(), true);
  assert.equal(check(), false);

  // Once the blocker has swallowed the ghost click, the predicate no longer claims a tap.
  let blocker = null;
  const host = { addEventListener: (_type, fn) => { blocker = fn; }, removeEventListener: () => {} };
  const after = swallowsTap(host, 100);
  blocker({ preventDefault() {}, stopPropagation() {} });
  assert.equal(after(), false);
});
