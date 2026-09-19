/**
 * composition-flow-authored.test.mjs
 * ---------------------------------------------------------------------------
 * The composition box model mirrors layout back into data-spw-* attributes.
 * CSS lays the page out from the authored data-spw-composition-flow before the
 * module mounts, so the mirror must keep that claim: writing the computed
 * display (grid used for stacking gaps) over an authored stack activated the
 * multi-column packing cluster and turned the settings register into a
 * five-column grid of 250px folds.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  annotateCompositionBox,
  snapshotCompositionBox,
} from '../../public/js/runtime/composition-box-model.js';

const camel = (name) => name
  .replace(/^data-/, '')
  .replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase());

const parseSimpleSelector = (token) => {
  const match = /^([a-z]+)?((?:\.[\w-]+)*)((?:\[[^\]]+\])*)$/.exec(token.trim());
  if (!match) return null;
  const classes = (match[2] || '').split('.').filter(Boolean);
  const attrs = [...(match[3] || '').matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)]
    .map(([, name, value]) => ({ name, value }));
  return { tag: match[1] || '', classes, attrs };
};

class FakeElement extends Element {
  constructor({ tag = 'div', attrs = {}, display = 'block', childCount = 0, id = '' } = {}) {
    super();
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.attrs = { ...attrs };
    this.dataset = {};
    for (const [name, value] of Object.entries(this.attrs)) {
      if (name.startsWith('data-')) this.dataset[camel(name)] = value;
    }
    this.children = Array.from({ length: childCount }, () => ({
      children: [],
      hasAttribute: () => false,
    }));
    this.style = { getPropertyValue: () => '' };
    this.textContent = '';
    this.display = display;
    this.scrollWidth = 400;
    this.clientWidth = 400;
    this.scrollHeight = 300;
    this.clientHeight = 300;
  }

  matches(selector) {
    return String(selector).split(',').some((token) => {
      const parsed = parseSimpleSelector(token);
      if (!parsed) return false;
      if (parsed.tag && parsed.tag !== this.tagName.toLowerCase()) return false;
      const classList = String(this.attrs.class || '').split(/\s+/).filter(Boolean);
      if (!parsed.classes.every((name) => classList.includes(name))) return false;
      return parsed.attrs.every(({ name, value }) => (
        name in this.attrs && (value === undefined || this.attrs[name] === value)
      ));
    });
  }

  getAttribute(name) { return name in this.attrs ? this.attrs[name] : null; }
  hasAttribute(name) { return name in this.attrs; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  getBoundingClientRect() { return { width: 400, height: 300, x: 0, y: 0, top: 0, left: 0 }; }
}

const zero = '0px';
const fakeComputedStyle = (el) => ({
  display: el.display,
  paddingLeft: zero,
  paddingRight: zero,
  paddingTop: zero,
  paddingBottom: zero,
  borderLeftWidth: zero,
  borderRightWidth: zero,
  borderTopWidth: zero,
  borderBottomWidth: zero,
  getPropertyValue: () => '',
});

const withComputedStyle = (run) => {
  const previous = globalThis.getComputedStyle;
  globalThis.getComputedStyle = fakeComputedStyle;
  try {
    return run();
  } finally {
    if (previous) globalThis.getComputedStyle = previous;
    else delete globalThis.getComputedStyle;
  }
};

test('authored stack survives a display:grid host with many children', () => {
  withComputedStyle(() => {
    const form = new FakeElement({
      tag: 'form',
      attrs: { class: 'settings-form', 'data-spw-composition-flow': 'stack', 'data-spw-box-model': 'settings-instrument' },
      display: 'grid',
      childCount: 13,
    });
    assert.equal(snapshotCompositionBox(form).flow, 'stack');
    annotateCompositionBox(form, { story: false });
    assert.equal(form.dataset.spwCompositionFlow, 'stack');
  });
});

test('a details fold is a stage: summary plus content never packs as a grid', () => {
  withComputedStyle(() => {
    const fold = new FakeElement({
      tag: 'details',
      attrs: { class: 'settings-category', 'data-spw-box-model': 'settings-fold' },
      display: 'grid',
      childCount: 3,
    });
    const snapshot = snapshotCompositionBox(fold);
    assert.equal(snapshot.flow, 'stack');
    assert.equal(snapshot.role, 'settings-fold');
  });
});

test('an unauthored host still reports its computed display', () => {
  withComputedStyle(() => {
    const grid = new FakeElement({ tag: 'div', attrs: { class: 'frame-grid' }, display: 'grid', childCount: 4 });
    assert.equal(snapshotCompositionBox(grid).flow, 'grid');
    const flexRow = new FakeElement({ tag: 'div', display: 'flex', childCount: 2 });
    assert.equal(snapshotCompositionBox(flexRow).flow, 'flex');
  });
});

test('non-canonical authored flows are kept rather than replaced by display', () => {
  withComputedStyle(() => {
    const wrap = new FakeElement({
      tag: 'div',
      attrs: { 'data-spw-composition-flow': 'inline-wrap' },
      display: 'flex',
      childCount: 5,
    });
    assert.equal(snapshotCompositionBox(wrap).flow, 'inline-wrap');
  });
});

test('stages refuse an authored grid flow and stay stacks', () => {
  withComputedStyle(() => {
    const frame = new FakeElement({
      tag: 'section',
      attrs: { class: 'spw-frame', 'data-spw-kind': 'frame', 'data-spw-composition-flow': 'grid' },
      display: 'grid',
      childCount: 3,
    });
    assert.equal(snapshotCompositionBox(frame).flow, 'stack');
  });
});
