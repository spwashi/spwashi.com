import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NATIVE_CONTROL_SELECTOR,
  isNativeControl,
  isOwnAffordanceTarget,
} from '../../public/js/kernel/dom-contracts.js';
import { initBraceGestures } from '../../public/js/runtime/brace-gestures.js';

function mockNode(label, parent = null) {
  const node = {
    label,
    matches(selector) {
      return String(selector)
        .split(',')
        .map((part) => part.trim())
        .some((part) => part === label || (label === 'button' && part === 'button'));
    },
    closest(selector) {
      if (node.matches(selector)) return node;
      return parent ? parent.closest(selector) : null;
    },
  };
  return node;
}

test('native control selector names disclosure and buttons, not tabindex', () => {
  assert.match(NATIVE_CONTROL_SELECTOR, /summary/);
  assert.match(NATIVE_CONTROL_SELECTOR, /button/);
  assert.doesNotMatch(NATIVE_CONTROL_SELECTOR, /tabindex/);
});

test('isOwnAffordanceTarget leaves nested buttons and summaries to themselves', () => {
  const hook = mockNode('[data-spw-kind="hook"]');
  const button = mockNode('button', hook);
  const summary = mockNode('summary', hook);
  const prose = mockNode('p', hook);

  assert.equal(isOwnAffordanceTarget(hook, hook), true);
  assert.equal(isOwnAffordanceTarget(hook, prose), true);
  assert.equal(isOwnAffordanceTarget(hook, button), false);
  assert.equal(isOwnAffordanceTarget(hook, summary), false);
  assert.equal(isOwnAffordanceTarget(button, button), true);
  assert.equal(isNativeControl(button), true);
  assert.equal(isNativeControl(prose), false);
});

test('mounted brace keyboard listeners preserve native handle activation on press and release', () => {
  // Mode-switch lenses are button.frame-sigil on home, about, software, folio, and the footer.
  const previousBody = document.body;
  const listeners = new Map();
  document.body = {
    dataset: {},
    addEventListener(type, listener) { listeners.set(type, listener); },
  };
  try {
    initBraceGestures();
    for (const tag of ['button', 'a[href]', 'summary', 'input', 'select', 'textarea']) {
      const handle = {
        matches(selector) { return selector.split(',').map((s) => s.trim()).includes(tag); },
        closest(selector) { return selector.includes('.frame-sigil') ? handle : null; },
        getAttribute() { assert.fail('native activation must not enter brace semantic classification'); },
      };
      for (const key of ['Enter', ' ']) {
        for (const type of ['keydown', 'keyup']) {
          let prevented = false;
          listeners.get(type)({ target: handle, key, preventDefault() { prevented = true; } });
          assert.equal(prevented, false, `${tag} ${type} ${key}`);
        }
      }
    }
  } finally {
    document.body = previousBody;
  }
});
