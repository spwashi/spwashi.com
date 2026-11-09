import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { spwDepth, summarizeSpw } from '../../public/js/kernel/spw-summary.js';

/** Every pair a summary opens, it closes, outside quoted text. */
function balanced(text) {
  const pairs = { '{': '}', '[': ']', '(': ')' };
  const stack = [];
  let quote = '';
  for (let at = 0; at < text.length; at += 1) {
    const ch = text[at];
    if (quote) {
      if (ch === '\\') at += 1;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === '`') quote = ch;
    else if (pairs[ch]) stack.push(pairs[ch]);
    else if (Object.values(pairs).includes(ch) && stack.pop() !== ch) return false;
  }
  return !stack.length && !quote;
}

describe('the site fractal summary', () => {
  it('leaves a line that fits as written', () => {
    assert.equal(summarizeSpw('garden{seed}', 32), 'garden{seed}');
  });

  it('folds the deepest bodies first, then keeps the outer body\'s first parts, then folds it', () => {
    const line = 'garden[care]{seed, water[deep]{roots, rain}, sun}(atlas)';
    assert.equal(summarizeSpw(line, 50), 'garden[care]{seed, water[deep]{…}, sun}(atlas)');
    assert.equal(summarizeSpw(line, 30), 'garden[care]{seed, …}(atlas)');
    assert.equal(summarizeSpw(line, 24), 'garden[care]{…}(atlas)');
    assert.equal(spwDepth(line), 2);
  });

  it('keeps a body\'s own separator when it trims its parts', () => {
    assert.equal(summarizeSpw('path{one; two; three; four; five}', 22), 'path{one; two; …}');
  });

  it('cuts inside an open pair at a word, and closes what it cut', () => {
    const said = summarizeSpw('garden{beans + salt + a long simmered broth}·hold·tap', 30);
    assert.ok(said.length <= 30, said);
    assert.ok(balanced(said), said);
  });

  it('never leaves a pair or a quote open, at any width, on lines of every kind', () => {
    const lines = [
      'kitchen{bread{flour, water{well{stone}}}, soup{beans, salt}}',
      '#[episode]{ ~[scene]{ the creator asked } ![change]{ a file changed } *[verify]{ a check passed } }',
      'note{"a quote with a } brace inside", tail}',
      'word { more',
      'trace: hold·tap·spread·close·hold·tap·spread',
      '',
    ];
    for (const line of lines) {
      for (let budget = 4; budget <= 80; budget += 3) {
        const said = summarizeSpw(line, budget);
        assert.ok(said.length <= budget, `${line} @ ${budget}: ${said}`);
        if (balanced(line)) assert.ok(balanced(said), `${line} @ ${budget}: ${said}`);
      }
    }
  });
});
