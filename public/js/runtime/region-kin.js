/**
 * Region kin — similar, contrast, resonate.
 *
 * Moves use Spw operators, not nicknames:
 *   ~ potential  similar   same 2D seat, hold the path
 *   & subject    contrast  complementary seat/operator, compare
 *   # vibration  resonate  shared handle / expression subject / wonder
 *
 * ? is wonder/probe — it asks. It is not a resonate jump.
 *
 * 2D serialization: pickKinLabel chooses a short→long expression by
 * available inline size (Pretext brace-fit idea, no live engine).
 */

export const SEAT_COMPLEMENT = Object.freeze({
  hook: 'read',
  hero: 'read',
  read: 'hook',
  hub: 'path',
  path: 'hub',
  cluster: 'wide',
  wide: 'cluster',
});

export const OPERATOR_COMPLEMENT = Object.freeze({
  potential: 'perspective',
  ref: 'perspective',
  perspective: 'potential',
  wonder: 'action',
  probe: 'action',
  action: 'wonder',
  frame: 'state',
  state: 'frame',
  concept: 'surface',
  topic: 'surface',
  surface: 'concept',
});

export const KIN_MOVES = Object.freeze({
  similar: Object.freeze({
    relation: 'similar',
    operator: 'potential',
    sigil: '~',
    ladder: Object.freeze([
      { min: 0, expression: '~' },
      { min: 72, expression: '~similar' },
      { min: 148, expression: 'region[kin]{similar}<seat>' },
    ]),
  }),
  contrast: Object.freeze({
    relation: 'contrast',
    operator: 'subject',
    sigil: '&',
    ladder: Object.freeze([
      { min: 0, expression: '&' },
      { min: 72, expression: '&contrast' },
      { min: 148, expression: 'region[kin]{contrast}<pair>' },
    ]),
  }),
  resonate: Object.freeze({
    relation: 'resonate',
    operator: 'vibration',
    sigil: '#',
    ladder: Object.freeze([
      { min: 0, expression: '#' },
      { min: 72, expression: '#resonate' },
      { min: 148, expression: 'region[kin]{resonate}<frame>' },
    ]),
  }),
});

export const KIN_CYCLE = Object.freeze(['similar', 'contrast', 'resonate']);

export function wonderTokens(value = '') {
  return new Set(
    String(value || '')
      .toLowerCase()
      .split(/[\s,|/]+/)
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

export function wonderOverlap(a = '', b = '') {
  const left = wonderTokens(a);
  const right = wonderTokens(b);
  let count = 0;
  left.forEach((token) => {
    if (right.has(token)) count += 1;
  });
  return count;
}

/** Leading stem of subject[mode]{parts}<projection> — the 0D handle. */
export function expressionSubject(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/^([^\[{<\s:~@!#]+)/);
  return match ? match[1] : '';
}

export function pickKinLabel(relation, width = 0) {
  const move = KIN_MOVES[relation];
  if (!move) return '';
  const resolved = Math.max(0, Number(width) || 0);
  let chosen = move.ladder[0].expression;
  for (const rung of move.ladder) {
    if (resolved >= rung.min) chosen = rung.expression;
  }
  return chosen;
}

/**
 * @returns {string[]} zero or more of similar | contrast | resonate
 */
export function classifyRegionRelation(from, to) {
  if (!from || !to || from.id === to.id) return [];
  const relations = [];
  if (from.seat && from.seat === to.seat) relations.push('similar');
  const seatContrast = from.seat && SEAT_COMPLEMENT[from.seat] === to.seat;
  const opContrast = from.operator && OPERATOR_COMPLEMENT[from.operator] === to.operator;
  if (seatContrast || opContrast) relations.push('contrast');

  const sameOperator = Boolean(from.operator && from.operator === to.operator);
  const sharedWonder = wonderOverlap(from.wonder, to.wonder) > 0;
  const sharedHandle = Boolean(
    expressionSubject(from.expression) &&
    expressionSubject(from.expression) === expressionSubject(to.expression),
  );
  const authoredKin = Boolean(
    from.expression &&
    to.expression &&
    Array.isArray(from.expressionKin) &&
    from.expressionKin.includes(to.expression),
  );
  if (sameOperator || sharedWonder || sharedHandle || authoredKin) {
    relations.push('resonate');
  }
  return relations;
}

function documentOrderPick(active, list, regions) {
  if (!list.length) return null;
  const activeIndex = regions.indexOf(active);
  return list.find((region) => regions.indexOf(region) > activeIndex) || list[0];
}

export function pickRegionKin(active, regions = []) {
  const empty = { similar: null, contrast: null, resonate: null };
  if (!active || !regions.length) return empty;

  const buckets = { similar: [], contrast: [], resonate: [] };
  regions.forEach((region) => {
    classifyRegionRelation(active, region).forEach((relation) => {
      buckets[relation].push(region);
    });
  });

  return {
    similar: documentOrderPick(active, buckets.similar, regions),
    contrast: documentOrderPick(active, buckets.contrast, regions),
    resonate: documentOrderPick(active, buckets.resonate, regions),
  };
}

export function kinIds(kin = {}) {
  return {
    similar: kin.similar?.id || '',
    contrast: kin.contrast?.id || '',
    resonate: kin.resonate?.id || '',
  };
}

export function nextKinRelation(current = 'similar') {
  const index = KIN_CYCLE.indexOf(current);
  return KIN_CYCLE[(index + 1) % KIN_CYCLE.length];
}
