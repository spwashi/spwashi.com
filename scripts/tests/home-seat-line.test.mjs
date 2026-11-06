/**
 * Home's seat lines: which held words join a seat's {body} (no DOM).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { heldWordsFor } from '../../public/js/runtime/page/home-seat-line.js';

const held = (operator, operand, capturedAt, deepLink = '') => ({ operator, operand, capturedAt, deepLink });

describe('home seat line', () => {
  it('keeps only the words whose operator is the seat operator, newest first', () => {
    const words = heldWordsFor([
      held('~', 'wonder', 1, '/topics/#field'),
      held('^', 'parser', 2, '/topics/software/'),
      held('~', 'table', 3, '/play/rpg-wednesday/#session'),
    ], 'potential');
    assert.deepEqual(words.map((w) => `${w.sigil}${w.word}`), ['~table', '~wonder']);
    assert.equal(words[0].href, '/play/rpg-wednesday/#session');
    assert.equal(words[0].route, '/play/rpg-wednesday/');
  });

  it('holds a word once, caps the container, and leaves an unknown origin unlinked', () => {
    const words = heldWordsFor([
      held('.', 'craft', 5), held('.', 'craft', 4), held('.', 'ground', 3), held('.', 'recipe', 2), held('.', 'soil', 1),
    ], 'ground');
    assert.deepEqual(words.map((w) => w.word), ['craft', 'ground', 'recipe']);
    assert.equal(words[0].href, '');
  });

  it('does not repeat the word the seat already names', () => {
    const words = heldWordsFor([held('.', 'craft', 2), held('.', 'soil', 1)], 'ground', { already: ['craft'] });
    assert.deepEqual(words.map((w) => w.word), ['soil']);
  });

  it('holds nothing for a seat with no operator', () => {
    assert.deepEqual(heldWordsFor([held('~', 'wonder', 1)], ''), []);
  });
});
