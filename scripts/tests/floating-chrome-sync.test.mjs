import assert from 'node:assert/strict';
import test from 'node:test';

import { requestFloatingChromeSync } from '../../public/js/kernel/dom-contracts.js';
import { resolveMenuMode, SHELL_MODES } from '../../public/js/runtime/shell/measurement.js';

test('floating chrome sync requests coalesce into one frame', () => {
  const saved = globalThis.requestAnimationFrame;
  const frames = [];
  globalThis.requestAnimationFrame = (fn) => frames.push(fn);
  try {
    requestFloatingChromeSync({ source: 'a', reason: 'mount' });
    requestFloatingChromeSync({ source: 'b', reason: 'resize' });
    requestFloatingChromeSync({ source: 'a', reason: 'mount' });
    assert.equal(frames.length, 1, 'three requests schedule one pass');

    frames.shift()();
    requestFloatingChromeSync({ reason: 'after-pass' });
    assert.equal(frames.length, 1, 'a request after the pass schedules the next one');
    frames.shift()();
  } finally {
    globalThis.requestAnimationFrame = saved;
  }
});

test('drawer and pocket menu modes resolve without measuring the nav strip', () => {
  const unmeasurable = {
    get clientWidth() { throw new Error('nav measured'); },
    get scrollWidth() { throw new Error('nav measured'); },
    querySelectorAll() { throw new Error('nav measured'); },
  };
  const header = { ownerDocument: { documentElement: { dataset: { spwViewportTier: 'regular' } } } };
  const drawerView = {
    innerWidth: 1100,
    matchMedia: () => ({ matches: true }),
    getComputedStyle() { throw new Error('nav measured'); },
  };
  assert.equal(resolveMenuMode(header, unmeasurable, unmeasurable, {}, drawerView), SHELL_MODES.TOGGLE);

  const pocketHeader = { ownerDocument: { documentElement: { dataset: { spwViewportTier: 'narrow' } } } };
  const fineView = { ...drawerView, matchMedia: () => ({ matches: false }) };
  assert.equal(resolveMenuMode(pocketHeader, unmeasurable, unmeasurable, {}, fineView), SHELL_MODES.TOGGLE);
});
