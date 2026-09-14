import assert from 'node:assert/strict';
import test from 'node:test';

import { initPulseBeatTuner } from '/public/js/runtime/pulse-beat-tuner.js';

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

test('beat cycle keeps its phase through settings gestures and rests while hidden', async () => {
  const html = globalThis.document.documentElement;
  const intervals = new Map();
  let nextId = 0;
  let started = 0;
  const originalSetInterval = globalThis.window.setInterval;
  const originalClearInterval = globalThis.window.clearInterval;
  globalThis.window.setInterval = (fn, ms) => {
    started += 1;
    nextId += 1;
    intervals.set(nextId, { fn, ms });
    return nextId;
  };
  globalThis.window.clearInterval = (id) => { intervals.delete(id); };
  Object.defineProperty(globalThis.document, 'hidden', { value: false, writable: true, configurable: true });

  const dispose = initPulseBeatTuner(globalThis.document);
  try {
    await flushMicrotasks();
    assert.equal(started, 1, 'init schedules one cycle');
    assert.equal(html.dataset.spwBeat, '1');
    const [firstTick] = intervals.values();
    firstTick.fn();
    firstTick.fn();
    assert.equal(html.dataset.spwBeat, '3');

    ['spw:settings-change', 'spw:settings:changed', 'spw:settings-momentum', 'spell:momentum']
      .forEach((type) => globalThis.document.dispatchEvent(new CustomEvent(type, { detail: {} })));
    await flushMicrotasks();
    assert.equal(started, 1, 'an unchanged interval keeps the running cycle');
    assert.equal(intervals.size, 1);
    assert.equal(html.dataset.spwBeat, '3', 'beat phase survives the gesture');

    globalThis.document.hidden = true;
    globalThis.document.dispatchEvent(new CustomEvent('visibilitychange'));
    assert.equal(intervals.size, 0, 'hidden documents stop advancing the beat');
    assert.equal(html.dataset.spwBeat, '3', 'hidden documents keep the beat they rest on');
    assert.equal(html.dataset.spwFreshnessPulse, undefined, 'hiding clears the active pulse');
    globalThis.document.dispatchEvent(new CustomEvent('spw:component-lifecycle', { detail: { beat: 'ready' } }));
    assert.equal(html.dataset.spwFreshnessPulse, undefined, 'background lifecycle work cannot pulse');

    globalThis.document.hidden = false;
    globalThis.document.dispatchEvent(new CustomEvent('visibilitychange'));
    assert.equal(intervals.size, 1, 'visible documents resume');
    assert.equal(html.dataset.spwBeat, '3', 'resuming continues from the resting beat');
    [...intervals.values()][0].fn();
    assert.equal(html.dataset.spwBeat, '4');

    globalThis.document.dispatchEvent(new CustomEvent('spw:interaction-phase', { detail: { phase: 'charge' } }));
    assert.equal(html.dataset.spwFreshnessPulse, 'phase-charge');
    html.dataset.spwReduceMotion = 'on';
    globalThis.document.dispatchEvent(new CustomEvent('spw:settings-change'));
    await flushMicrotasks();
    assert.equal(intervals.size, 0, 'motion preference stops the beat');
    assert.equal(html.dataset.spwFreshnessPulse, undefined, 'motion preference clears the current pulse');
  } finally {
    dispose();
    globalThis.window.setInterval = originalSetInterval;
    globalThis.window.clearInterval = originalClearInterval;
    delete globalThis.document.hidden;
    delete html.dataset.spwReduceMotion;
  }
});
