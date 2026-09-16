import assert from 'node:assert/strict';
import test from 'node:test';

import {
  annotateFloatingChromeElement,
  measureFloatingChromeStranding,
  requestFloatingChromeSync,
} from '../../public/js/kernel/dom-contracts.js';
import { resolveMenuMode, SHELL_MODES } from '../../public/js/runtime/shell/measurement.js';

test('idempotent floating chrome annotation still wires size observation', () => {
  const saved = globalThis.ResizeObserver;
  const observed = [];
  globalThis.ResizeObserver = class {
    observe(target) { observed.push(target); }
  };

  try {
    const chrome = new globalThis.HTMLElement();
    chrome.dataset = {};
    const options = { role: 'console', tier: 'docked', mutator: 'test' };

    assert.equal(annotateFloatingChromeElement(chrome, options), true);
    assert.equal(annotateFloatingChromeElement(chrome, options), false);
    assert.deepEqual(observed, [chrome, chrome]);
  } finally {
    globalThis.ResizeObserver = saved;
  }
});

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

test('stranding names docked chrome that sits wholly outside the viewport', () => {
  const viewport = { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 };
  const chrome = (role, slot, rect) => ({
    dataset: { spwChromeRole: role, spwChromeSlot: slot },
    getBoundingClientRect: () => ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height }),
  });
  const nodes = [
    // A dock whose bottom: 10px resolved against a transformed html, not the viewport.
    chrome('collection-dock', 'bottom-center', { left: 400, top: 6800, width: 150, height: 44 }),
    // The satchel peeking in from the edge is on screen and stays quiet.
    chrome('state-inspector', 'bottom-right-satchel', { left: 990, top: 650, width: 40, height: 52 }),
    // The skip link parks above the viewport by design.
    chrome('skip-link', 'top-priority', { left: 10, top: -45, width: 134, height: 38 }),
    // A toast is transient chrome, not a docked occupant.
    chrome('toast', 'bottom-center', { left: 400, top: 900, width: 200, height: 40 }),
    // No box, no verdict.
    chrome('console', 'bottom-console', { left: 0, top: 9000, width: 0, height: 0 }),
  ];
  assert.deepEqual(measureFloatingChromeStranding(nodes, viewport), ['collection-dock:bottom-center']);
});
