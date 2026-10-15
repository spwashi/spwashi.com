import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { bindPinchTextScale, pinchStepChange, pinchVariantFor, PINCH_STEP } from '../../public/js/kernel/pinch-text-scale.js';

/** A small element: attributes, a style that records properties, contains, closest by tag. */
class FakeNode extends globalThis.HTMLElement {
  constructor(tag, parent = null) {
    super();
    this.tagName = tag.toUpperCase();
    this.parent = parent;
    this.attributes = new Map();
    this.props = new Map();
    this.style = { setProperty: (k, v) => this.props.set(k, v), removeProperty: (k) => this.props.delete(k) };
    this.isContentEditable = false;
  }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  contains(node) { for (let at = node; at; at = at.parent) if (at === this) return true; return false; }
  closest(selector) {
    const tags = selector.split(',').map((part) => part.trim().toUpperCase());
    for (let at = this; at; at = at.parent) if (tags.includes(at.tagName)) return at;
    return null;
  }
}

function page() {
  const listeners = new Map();
  const html = new FakeNode('html');
  const body = new FakeNode('body', html);
  const main = new FakeNode('main', body);
  const paragraph = new FakeNode('p', main);
  const field = new FakeNode('textarea', main);
  const doc = {
    documentElement: html,
    body,
    addEventListener: (type, fn) => listeners.set(type, fn),
  };
  main.ownerDocument = doc;
  const touch = (type, contacts, target = paragraph) => {
    let prevented = false;
    listeners.get(type)?.({ touches: contacts.map(([x, y]) => ({ clientX: x, clientY: y, target })), preventDefault: () => { prevented = true; } });
    return prevented;
  };
  return { html, body, main, paragraph, field, touch };
}

const STEPS = Object.freeze(['70', '80', '90', '100', '110', '120']);
const at = (distance) => [[0, 0], [distance, 0]];

describe('pinch to resize text, as a portable gesture', () => {
  it('counts whole steps by the log of the finger distance', () => {
    assert.equal(pinchStepChange(100, 100), 0);
    assert.equal(pinchStepChange(100, 100 * 2 ** PINCH_STEP), 1);
    assert.equal(pinchStepChange(100, 100 / 2 ** (2 * PINCH_STEP)), -2);
    assert.equal(pinchStepChange(0, 100), 0);
    assert.deepEqual([0, 1, 2, 3, 4, 5].map((i) => pinchVariantFor(i, 6)), ['compact', 'compact', 'balanced', 'balanced', 'roomy', 'roomy']);
  });

  it('steps the text while the fingers move, shows the gesture, and clears when they lift', () => {
    const { html, main, touch } = page();
    let scale = '100';
    const set = [];
    bindPinchTextScale({ main, steps: STEPS, getScale: () => scale, setScale: (next) => { set.push(next); scale = next; } });
    touch('touchstart', at(100));
    assert.equal(html.getAttribute('data-spw-pinch-scaling'), 'true');
    assert.equal(html.props.get('--spw-pinch-factor'), '1');
    const prevented = touch('touchmove', at(100 * 2 ** (2 * PINCH_STEP)));
    assert.equal(prevented, true, 'a live pinch takes over native zoom');
    assert.deepEqual(set, ['120']);
    assert.equal(main.getAttribute('data-spw-pinch-direction'), 'expand');
    assert.equal(main.getAttribute('data-spw-pinch-variant'), 'roomy');
    touch('touchend', []);
    assert.equal(html.getAttribute('data-spw-pinch-scaling'), null);
    assert.equal(html.props.has('--spw-pinch-factor'), false);
  });

  it('leaves fields to their own gestures unless the page says otherwise', () => {
    const { main, field, touch } = page();
    let calls = 0;
    bindPinchTextScale({ main, steps: STEPS, getScale: () => '100', setScale: () => { calls += 1; } });
    touch('touchstart', at(100), field);
    touch('touchmove', at(200), field);
    assert.equal(calls, 0, 'textarea is ignored by default');
    const second = page();
    bindPinchTextScale({ main: second.main, steps: STEPS, getScale: () => '100', setScale: () => { calls += 1; }, ignore: 'a, button' });
    second.touch('touchstart', at(100), second.field);
    second.touch('touchmove', at(200), second.field);
    assert.equal(calls, 1, 'a page may let the pinch reach its code');
  });

  it('names a pinch it will not act on, once per gesture, instead of absorbing it', () => {
    const { main, touch } = page();
    let hints = 0;
    let calls = 0;
    bindPinchTextScale({ main, steps: STEPS, getScale: () => '100', setScale: () => { calls += 1; }, isEnabled: () => false, onDisabledPinch: () => { hints += 1; } });
    touch('touchstart', at(100));
    touch('touchmove', at(100));
    assert.equal(hints, 0, 'resting fingers are not a pinch');
    touch('touchmove', at(200));
    touch('touchmove', at(300));
    assert.deepEqual([hints, calls], [1, 0]);
  });
});
