import assert from 'node:assert/strict';
import test from 'node:test';

import { SHELL_CHROME_SELECTOR, isInsideShellChrome, syncComponentKindMirror } from '../../public/js/kernel/dom-contracts.js';

// Enough of an element for the contract: a parent whose closest() answers the shell selector.
const element = ({ insideChrome, kind = 'component' }) => ({
  dataset: { spwKind: kind },
  parentElement: { closest: (selector) => (selector === SHELL_CHROME_SELECTOR && insideChrome ? {} : null) },
});

test('the shell selector names the header, shell navigation, and floating chrome', () => {
  for (const part of ['.site-header', 'body > header', 'nav[data-spw-kind="shell"]', '[data-spw-floating-chrome="true"]']) {
    assert.ok(SHELL_CHROME_SELECTOR.includes(part), part);
  }
});

test('anything inside chrome is inside; the header itself and page content are not', () => {
  assert.equal(isInsideShellChrome(element({ insideChrome: true })), true);
  assert.equal(isInsideShellChrome(element({ insideChrome: false })), false);
  assert.equal(isInsideShellChrome({ parentElement: null }), false);
  assert.equal(isInsideShellChrome(null), false);
});

test('the kind mirror never stamps a component kind inside chrome', () => {
  const actions = element({ insideChrome: true });
  assert.equal(syncComponentKindMirror(actions), false);
  assert.equal(actions.dataset.spwComponentKind, undefined);
});
