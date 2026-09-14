import assert from 'node:assert/strict';
import test from 'node:test';

import { writeTextContent } from '/public/js/kernel/dom-contracts.js';

function countingTextNode(initial = '') {
  let text = initial;
  let writes = 0;
  return {
    get textContent() { return text; },
    set textContent(value) { writes += 1; text = String(value); },
    get writes() { return writes; },
  };
}

test('readout text writes skip unchanged text so subtree observers stay quiet', () => {
  const node = countingTextNode('breath');

  assert.equal(writeTextContent(node, 'breath'), false);
  assert.equal(node.writes, 0, 'identical text never replaces the child text node');

  assert.equal(writeTextContent(node, 'witness'), true);
  assert.equal(node.writes, 1);
  assert.equal(node.textContent, 'witness');

  assert.equal(writeTextContent(node, 3), true, 'non-string values compare as text');
  assert.equal(writeTextContent(node, '3'), false);
  assert.equal(node.writes, 2);

  assert.equal(writeTextContent(node, null), false, 'null leaves authored text in place');
  assert.equal(writeTextContent(null, 'x'), false);
  assert.equal(node.writes, 2);
});
