/**
 * Tone, read from the Spw expression a host already carries.
 *
 * The site refuses a tone attribute (.spw/conventions/copy-accessor.spw
 * #voice_register). The words of an expression carry their own valence, so
 * the posture of a host is the mode slot of its expression, led by any
 * boonhonk charge: `about[navigational]{question.route}` reads navigational,
 * `boon table[generous]{...}` reads boon generous. A host with no expression
 * falls back to its authored context.
 */
import { readExpressionSlots } from '/public/js/semantic/expression-query.js';

export function expressionTone(expression = '') {
  if (!expression) return '';
  const slots = readExpressionSlots(expression);
  return [...slots.charge, slots.mode].filter(Boolean).join(' ').replace(/[_-]+/g, ' ').trim();
}

/** @param {{ dataset?: DOMStringMap } | null | undefined} el */
export function readElementTone(el) {
  const data = el?.dataset;
  if (!data) return '';
  return expressionTone(data.spwSemanticExpression || '') || data.spwContext || '';
}
