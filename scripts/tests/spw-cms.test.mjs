import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compileAllSeeds, extractCmsFrames } from '../compile-spw-cms.mjs';
import {
  SPW_MODULE_EXPORT,
  computeUtcDayIndex,
  describeCloseCadence,
  mountSpwCmsSurface,
} from '/public/js/modules/cms/spw-cms-surface.js';

function makeNode(attrs = {}) {
  const map = new Map(Object.entries(attrs));
  const listeners = new Map();
  let children = [];
  return {
    hidden: Boolean(attrs.hidden),
    open: Boolean(attrs.open),
    textContent: '',
    src: '',
    className: '',
    getAttribute: (k) => (map.has(k) ? map.get(k) : null),
    setAttribute: (k, v) => { map.set(k, String(v)); },
    removeAttribute: (k) => { map.delete(k); },
    replaceChildren: (...next) => { children = next; },
    get children() { return children; },
    contains: () => true,
    addEventListener: (type, fn, opts) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      opts?.signal?.addEventListener?.('abort', () => listeners.get(type)?.delete(fn));
    },
    emit: (type, target) => {
      for (const fn of listeners.get(type) || []) {
        fn({ type, target });
      }
    },
  };
}

test('compileAllSeeds parses .spw/cms/*.spw via workbench reader and verifies fresh partials', async () => {
  const results = await compileAllSeeds({ check: true });
  assert.equal(results.length, 3);

  const homeHtml = await fs.readFile(path.resolve('_partials/cms/home-issue.html'), 'utf8');
  assert.match(homeHtml, /data-cms-surface="home_issue"/);
  assert.match(homeHtml, /data-spw-copy-lens="default reading surface read"/);
  assert.match(homeHtml, /data-spw-copy-lens="systems syntax inspect workbench"/);
  assert.match(homeHtml, /data-cms-theater/);
  assert.doesNotMatch(homeHtml, /<iframe/i, 'initial HTML must not auto-load cross-origin iframes');

  const recipesHtml = await fs.readFile(path.resolve('_partials/cms/recipes-ledger.html'), 'utf8');
  assert.match(recipesHtml, /data-spw-copy-lens="default cook reading surface"/);
  assert.match(recipesHtml, /data-spw-copy-lens="theory systems syntax"/);
  assert.match(recipesHtml, /data-cms-expect/);
});

test('extractCmsFrames rejects invalid Spw syntax', () => {
  assert.throws(() => extractCmsFrames('^"unclosed"{ key = `val`', 'broken.spw'), /Parse failed/);
});

test('close cadence and mountSpwCmsSurface enhance triptychs, curiosity gaps, and consentful theater', () => {
  assert.equal(typeof computeUtcDayIndex(new Date('2026-11-26T12:00:00Z')), 'number');
  assert.match(describeCloseCadence(new Date(2026, 10, 26)), /Close day \(26th\)/);
  assert.equal(SPW_MODULE_EXPORT.id, 'spw-cms-surface');

  const proseBtn = makeNode({ 'data-cms-face-btn': 'prose' });
  const scanBtn = makeNode({ 'data-cms-face-btn': 'scan' });
  const tabs = makeNode({ hidden: true });
  tabs.querySelectorAll = () => [proseBtn, scanBtn];

  const proseFace = makeNode({ 'data-cms-face': 'prose' });
  const scanFold = makeNode({ 'data-cms-face': 'scan', open: false, hidden: true });
  const card = makeNode();
  card.querySelector = (sel) => {
    if (sel === '.spw-triptych__tabs') return tabs;
    if (sel === '[data-cms-face="prose"]') return proseFace;
    return null;
  };
  card.querySelectorAll = (sel) => (sel === 'details.spw-triptych__fold' ? [scanFold] : []);

  const guessB = makeNode({ 'data-cms-guess': 'b' });
  guessB.closest = (sel) => (sel === '[data-cms-guess]' ? guessB : null);
  const details = makeNode({ open: false });
  const status = makeNode();
  const probe = makeNode({ 'data-cms-correct': 'b' });
  probe.querySelector = (sel) => {
    if (sel === '[data-cms-expect-status]') return status;
    if (sel === '[data-cms-expect-details]') return details;
    return null;
  };
  probe.querySelectorAll = () => [guessB];

  const slot = makeNode({ hidden: true });
  slot.querySelector = () => slot.children[0] || null;
  const mountBtn = makeNode();
  mountBtn.closest = (sel) => (sel === '[data-cms-theater-mount]' ? mountBtn : null);
  const theater = makeNode({ 'data-cms-active-url': 'https://attention.productions/test-shot' });
  theater.querySelector = (sel) => {
    if (sel === '[data-cms-theater-slot]') return slot;
    if (sel === '[data-cms-theater-mount]') return mountBtn;
    return null;
  };
  theater.querySelectorAll = () => [];

  const root = {
    querySelector: () => null,
    querySelectorAll: (sel) => {
      if (sel === '[data-cms-triptych]') return [card];
      if (sel === '[data-cms-expect]') return [probe];
      if (sel === '[data-cms-theater]') return [theater];
      return [];
    },
  };

  const prevCreate = globalThis.document.createElement;
  globalThis.document.createElement = (tag) => makeNode({ tag });
  try {
    const cleanup = mountSpwCmsSurface(root);
    assert.equal(tabs.hidden, false);

    scanBtn.closest = (sel) => (sel === '[data-cms-face-btn]' ? scanBtn : null);
    tabs.emit('click', scanBtn);
    assert.equal(proseFace.hidden, true);
    assert.equal(scanFold.hidden, false);
    assert.equal(scanFold.open, true);

    probe.emit('click', guessB);
    assert.equal(probe.getAttribute('data-cms-verdict'), 'hit');
    assert.equal(details.open, true);

    theater.emit('click', mountBtn);
    assert.equal(slot.hidden, false);
    assert.equal(slot.children.length, 1);
    assert.equal(slot.children[0].getAttribute('sandbox'), 'allow-scripts allow-same-origin');

    theater.emit('click', mountBtn);
    assert.equal(slot.hidden, true);
    assert.equal(slot.children.length, 0);
    cleanup();
  } finally {
    globalThis.document.createElement = prevCreate;
  }
});
