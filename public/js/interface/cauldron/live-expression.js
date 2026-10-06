/**
 * The cauldron's state, written as one Spw expression that changes in place.
 *
 * The panel used to say the same thing three ways: a count sentence, a status
 * sentence, and an availability sentence. The expression carries the first of
 * those by itself: the braces hold what is held, and the prefix is the state.
 *
 *   .cauldron{}                       resting: nothing held
 *   ~cauldron{costume}                held: one more makes a mix
 *   *cauldron{costume.recipe.ink}     ready: enough to mix
 *   ^cauldron{costume.recipe.ink}     mixed: the result is shown below
 *
 * The prefixes are canon operators (ground, potential, value, integration),
 * so reading the panel teaches four of them. Words: .spw/conventions/word-sets.spw.
 *
 * composeLiveExpression is pure; renderLiveExpression writes it into any
 * [data-cauldron-live-expression] host, which the footer authors with a static
 * resting form so the line reads with scripts off.
 */

const STATES = Object.freeze({
  '.': { operator: 'ground', word: 'resting', hint: 'nothing held' },
  '~': { operator: 'potential', word: 'held', hint: 'one more makes a mix' },
  '*': { operator: 'value', word: 'ready', hint: 'enough to mix' },
  '^': { operator: 'integration', word: 'mixed', hint: 'the result is shown below' },
});

const MAX_PARTS = 6;

/** A held label as an expression part: lower case, words joined by underscores. */
export function expressionPart(label = '') {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 28);
}

/**
 * @param {Array<{label?: string}>} ingredients
 * @param {{ mixed?: boolean }} [options] mixed: a mix result is showing
 */
export function composeLiveExpression(ingredients = [], { mixed = false } = {}) {
  const seen = new Set();
  const parts = [];
  for (const item of Array.isArray(ingredients) ? ingredients : []) {
    const part = expressionPart(item?.label);
    if (!part || seen.has(part)) continue;
    seen.add(part);
    parts.push(part);
  }
  const count = Array.isArray(ingredients) ? ingredients.length : 0;
  const prefix = count === 0 ? '.' : mixed && count >= 2 ? '^' : count >= 3 ? '*' : '~';
  const shown = parts.slice(0, MAX_PARTS);
  const more = parts.length - shown.length;
  const inner = shown.join('.') + (more > 0 ? `.+${more}` : '');
  const state = STATES[prefix];
  return {
    prefix,
    operator: state.operator,
    parts: shown,
    more,
    text: `${prefix}cauldron{${inner}}`,
    label: `${count} held, ${state.word}: ${state.hint}`,
  };
}

export function renderLiveExpression(ingredients = [], options = {}, doc = document) {
  const expression = composeLiveExpression(ingredients, options);
  doc.querySelectorAll('[data-cauldron-live-expression]').forEach((host) => {
    const op = host.querySelector('[data-cauldron-live-op]');
    const parts = host.querySelector('[data-cauldron-live-parts]');
    if (!op || !parts) return;
    if (op.textContent !== expression.prefix) op.textContent = expression.prefix;
    op.dataset.spwOperator = expression.operator;
    const inner = expression.text.slice(expression.text.indexOf('{') + 1, -1);
    if (parts.textContent !== inner) parts.textContent = inner;
    host.title = expression.label;
  });
  return expression;
}
