import assert from 'node:assert/strict';
import test from 'node:test';
import { observeAddedMatches } from '../../public/js/kernel/dom-contracts.js';
import { applyOperatorMetadata, annotateDelimiters } from '../../public/js/semantic/sigil-annotation.js';
import { detectOperator } from '../../public/js/kernel/shared.js';

class Element {
  constructor(parent = null, signal = true) {
    this.parent = parent;
    this.signal = signal;
    this.writes = 0;
    this.dataset = new Proxy({}, { set: (target, key, value) => {
      this.writes++;
      target[key] = String(value);
      return true;
    } });
    this.attributes = new Map();
    this.textContent = '!move';
    this.classList = { contains: () => false };
  }
  contains(node) { return node === this || Boolean(node.parent && this.contains(node.parent)); }
  matches() { return this.signal; }
  closest() { return this.signal ? this : this.parent?.closest() || null; }
  querySelector() { return null; }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  setAttribute(key, value) { this.writes++; this.attributes.set(key, String(value)); }
}

function environment(run) {
  const saved = { HTMLElement: globalThis.HTMLElement, HTMLAnchorElement: globalThis.HTMLAnchorElement,
    MutationObserver: globalThis.MutationObserver, requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame };
  let callback;
  let frame;
  let disconnected = false;
  globalThis.HTMLElement = Element;
  globalThis.HTMLAnchorElement = class extends Element {};
  globalThis.MutationObserver = class {
    constructor(fn) { callback = fn; }
    observe() {}
    disconnect() { disconnected = true; }
  };
  window.requestAnimationFrame = (fn) => { frame = fn; return 1; };
  window.cancelAnimationFrame = () => { frame = null; };
  try {
    run({ deliver: (records) => callback(records), flush: () => {
      const fn = frame; frame = null; fn?.();
    }, disconnected: () => disconnected });
  } finally {
    for (const key of ['HTMLElement', 'HTMLAnchorElement', 'MutationObserver']) globalThis[key] = saved[key];
    window.requestAnimationFrame = saved.requestAnimationFrame;
    window.cancelAnimationFrame = saved.cancelAnimationFrame;
  }
}

test('annotation preserves authored values and empty fallback semantics, then stops writing', () => environment(() => {
  const element = new Element();
  element.dataset.spwOperatorFlow = 'authored';
  element.dataset.spwSigilName = '';
  element.setAttribute('aria-label', 'Keep this label');
  const op = detectOperator('!move');
  applyOperatorMetadata(element, op);
  assert.equal(element.dataset.spwOperatorFlow, 'authored');
  assert.equal(element.dataset.spwSigilName, 'move');
  assert.equal(element.getAttribute('aria-label'), 'Keep this label');
  const first = { ...element.dataset };
  element.writes = 0;
  applyOperatorMetadata(element, op);
  assert.deepEqual({ ...element.dataset }, first);
  assert.equal(element.writes, 0);
  const delimiter = new Element();
  delimiter.textContent = '}';
  const root = { querySelectorAll: () => [delimiter] };
  annotateDelimiters(root);
  assert.equal(delimiter.dataset.spwSigilPosition, 'postfix');
  delimiter.writes = 0;
  annotateDelimiters(root);
  assert.equal(delimiter.writes, 0);
}));

test('default added-match observers retain one argument-free callback per frame', () => environment(({ deliver, flush }) => {
  const root = new Element(null, false), node = new Element(root);
  const calls = [];
  const disconnect = observeAddedMatches('.signal', (...args) => calls.push(args), { root });
  deliver([{ target: root, addedNodes: [node] }]);
  deliver([{ target: root, addedNodes: [node] }]);
  assert.deepEqual(calls, []);
  flush();
  assert.deepEqual(calls, [[]]);
  disconnect();
}));

test('collected roots include changed hosts, collapse overlap and exclude removed nodes', () => environment(({ deliver, flush }) => {
  const root = new Element(null, false), host = new Element(root), child = new Element(host);
  const removed = new Element(root), independent = new Element(root);
  const calls = [];
  const disconnect = observeAddedMatches('.signal', (roots) => calls.push(roots), { root, collectRoots: true });
  deliver([{ target: host, addedNodes: [child] }, { target: root, addedNodes: [host, removed, independent] }]);
  removed.parent = null;
  flush();
  assert.deepEqual(calls, [[host, independent]]);
  disconnect();
}));

test('disconnect cancels pending work and a later observer starts with an empty queue', () => environment(({ deliver, flush, disconnected }) => {
  const root = new Element(null, false), node = new Element(root);
  const calls = [];
  const disconnect = observeAddedMatches('.signal', (roots) => calls.push(roots), { root, collectRoots: true });
  deliver([{ target: root, addedNodes: [node] }]);
  disconnect();
  flush();
  assert.equal(disconnected(), true);
  assert.deepEqual(calls, []);
  const next = observeAddedMatches('.signal', (roots) => calls.push(roots), { root, collectRoots: true });
  deliver([{ target: root, addedNodes: [node] }]);
  flush();
  assert.deepEqual(calls, [[node]]);
  next();
}));
