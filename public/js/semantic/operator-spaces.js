/**
 * Operator spaces — which side of an operator is still open.
 *
 * The kernel already models both halves of this and nothing has ever joined
 * them. `splitOperatorExpression` returns a `position` — prefix, infix, postfix
 * or expression — and `OPERATOR_GEOMETRY` gives every operator a `leftRole` and
 * a `rightRole`: the kind of space that sits on each side. Position says which
 * of those roles the text actually filled.
 *
 * The join is the interesting part. A prefix `?` leads its operand, so the
 * operand takes the right role — `open-aperture` — and the left role,
 * `known-edge`, is never stated. That unstated role is not missing data. It is
 * a space the operator makes possible and nobody has occupied: the expression
 * can still accept a known edge, and something could grow there.
 *
 * An open role is a niche. That is the same word the biome convention wants and
 * the same thing corpus completion needs — what can follow, derived from what
 * an operator affords rather than from a schema of allowed values.
 *
 * Reads only. No DOM, no storage, no measurement; composable anywhere.
 *
 * LIMITATION, stated because it is structural rather than incidental:
 * left and right are one dimension. Two sides, because that is what an operator
 * has in a line of text. The grammar this serves is not one-dimensional —
 * `subject[mode]{parts}<projection>` is four named slots, and the parser
 * confirms it, structuring Frame, Parameter, Body and ModifierChain as separate
 * containers. Left/right is the two-slot special case of a slot model, and it
 * will not generalise upward.
 *
 * The tension underneath is real and not resolvable here: `.spw` is linear text,
 * where an operator genuinely has two sides, while HTML is a tree, where an
 * element has a parent, children, siblings and attributes — many more sides than
 * two. OPERATOR_GEOMETRY was written for the first and is being asked about the
 * second. The generalisation is named slots rather than sides, so an open slot
 * stays a niche at any arity; until the geometry table carries slots, this is
 * accurate for simple operator-operand forms and silent about compounds.
 *
 * See .spw/conventions/compound-expressions.spw for why the operator carries a
 * relation type inference cannot recover, and .spw/conventions/component-biome.spw
 * for niches.
 */

import { getOperatorGeometry, splitOperatorExpression } from '/public/js/kernel/shared.js';

/**
 * Which role a given position leaves unstated.
 *
 * `expression` means the whole string is the operand with no operator leading
 * or trailing it, so neither role was claimed and both stay open — the least
 * committed form, and the most available.
 */
const OPEN_BY_POSITION = Object.freeze({
  prefix: ['left'],
  postfix: ['right'],
  infix: [],
  expression: ['left', 'right'],
});

/**
 * Describe the spaces an expression opens.
 *
 * Returns null when no operator is detected — a plain identifier has geometry
 * only once something operates on it, and inventing roles for it would be the
 * schema-shaped guessing this is meant to avoid.
 */
export function operatorSpaces(expression = '') {
  const split = splitOperatorExpression(expression);
  const geometry = getOperatorGeometry(split.operator) || getOperatorGeometry(split.prefix);
  if (!geometry) return null;

  const position = split.position || 'expression';
  const open = OPEN_BY_POSITION[position] || [];

  const role = (side) => (side === 'left' ? geometry.leftRole : geometry.rightRole);

  return {
    expression,
    operator: split.operator || split.prefix || '',
    operand: split.operand || '',
    position,
    geometry: geometry.geometry,
    flow: geometry.flow,
    chargeRole: geometry.chargeRole,
    filled: ['left', 'right']
      .filter((side) => !open.includes(side))
      .map((side) => ({ side, role: role(side) })),
    /** Niches: roles this operator affords that the text never claimed. */
    open: open.map((side) => ({ side, role: role(side) })),
  };
}

/**
 * Can this expression accept something in the named role?
 *
 * The question completion actually wants — not "what values are legal" but
 * "what does this expression still have room for".
 */
export function acceptsRole(expression = '', roleName = '') {
  const spaces = operatorSpaces(expression);
  if (!spaces) return false;
  return spaces.open.some((slot) => slot.role === roleName);
}

/**
 * Group expressions by the niche they leave open.
 *
 * Two expressions with the same open role are competing for the same space,
 * which is a stronger relation than sharing a vocabulary token — kinship by
 * inferred overlap says they used the same word, this says they afford the
 * same thing.
 */
export function nichesAcross(expressions = []) {
  const niches = new Map();
  for (const expression of expressions) {
    const spaces = operatorSpaces(expression);
    if (!spaces) continue;
    for (const { side, role } of spaces.open) {
      const key = `${side}:${role}`;
      if (!niches.has(key)) niches.set(key, { side, role, expressions: [] });
      niches.get(key).expressions.push(expression);
    }
  }
  return [...niches.values()].sort((a, b) => b.expressions.length - a.expressions.length);
}

export const OPERATOR_SPACES_CONTRACT = Object.freeze({
  positions: Object.keys(OPEN_BY_POSITION),
  rule: 'position says which role the text claimed; the unclaimed role is the niche',
  reads: ['splitOperatorExpression.position', 'OPERATOR_GEOMETRY.leftRole', 'OPERATOR_GEOMETRY.rightRole'],
  arity: 2,
  generalises_to: 'named slots — subject | mode | body | projection — so an open slot stays a niche at any arity',
  accurate_for: 'operator-operand forms in linear text',
  silent_about: 'compounds, nesting, and the tree dimensions HTML adds beyond two sides',
});
