import assert from 'node:assert/strict';
import test from 'node:test';
import { initPinchTextScale } from '../../public/js/runtime/attention/pinch-scale.js';

test('pinch scaling owns only two reading contacts and releases interrupted gestures', () => {
  const originals = new Map(['Element', 'HTMLElement', 'matchMedia'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  class Node extends EventTarget {
    dataset = {};
    attributes = new Map();
    properties = new Map();
    style = {
      setProperty: (key, value) => this.properties.set(key, value),
      removeProperty: (key) => this.properties.delete(key),
    };
    getAttribute(key) { return this.attributes.get(key) ?? null; }
    setAttribute(key, value) { this.attributes.set(key, value); }
    removeAttribute(key) { this.attributes.delete(key); }
    matches(selector) { return selector === 'main' && this === main; }
    contains(node) { return node.inside === true; }
    closest() { return this.control ? this : null; }
  }
  globalThis.Element = globalThis.HTMLElement = Node;
  globalThis.matchMedia = () => ({ matches: true });
  const doc = new EventTarget();
  const main = new Node();
  const paragraph = new Node();
  paragraph.inside = true;
  const button = new Node();
  button.inside = button.control = true;
  const editor = new Node();
  editor.inside = editor.isContentEditable = true;
  const outside = new Node();
  doc.documentElement = new Node();
  doc.body = new Node();
  main.ownerDocument = doc;
  let scale = '100';
  const writes = [];
  doc.defaultView = { spwSettings: {
    get: () => ({ fontSizeScale: scale }),
    setFontSizeScale(value) { scale = value; writes.push(value); },
  } };
  const contact = (target, x) => ({ target, clientX: x, clientY: 0 });
  const pair = (second = paragraph, distance = 100) => [contact(paragraph, 0), contact(second, distance)];
  const emit = (type, touches) => {
    const event = new Event(type, { cancelable: true });
    Object.defineProperties(event, { touches: { value: touches }, target: { value: paragraph } });
    doc.dispatchEvent(event);
    return event;
  };
  const isActive = () => doc.documentElement.getAttribute('data-spw-pinch-scaling') === 'true';
  let cleanup;
  try {
    cleanup = initPinchTextScale(main);
    for (const second of [button, editor, outside]) {
      emit('touchstart', pair(second));
      assert.equal(isActive(), false);
      assert.equal(emit('touchmove', pair(second, 120)).defaultPrevented, false);
    }
    assert.deepEqual(writes, []);
    emit('touchstart', pair());
    assert.equal(isActive(), true);
    assert.equal(emit('touchmove', pair(paragraph, 110)).defaultPrevented, true);
    assert.deepEqual(writes, ['110']);

    emit('touchstart', [...pair(), contact(outside, 200)]);
    assert.equal(isActive(), false);
    assert.equal(doc.documentElement.properties.size, 0);
    assert.equal(emit('touchmove', pair(paragraph, 140)).defaultPrevented, false);
    assert.deepEqual(writes, ['110']);

    emit('touchstart', pair());
    doc.documentElement.dataset.spwPinchTextScale = 'off';
    assert.equal(emit('touchmove', pair(paragraph, 120)).defaultPrevented, false);
    assert.equal(isActive(), false);
    assert.equal(doc.documentElement.properties.size, 0);
    doc.documentElement.dataset.spwPinchTextScale = 'on';

    for (const end of ['touchend', 'touchcancel']) {
      emit('touchstart', pair());
      emit(end, []);
      assert.equal(isActive(), false);
    }
    emit('touchstart', pair());
    cleanup();
    assert.equal(isActive(), false);
    emit('touchstart', pair());
    assert.equal(isActive(), false);
  } finally {
    cleanup?.();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
