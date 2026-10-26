/**
 * Operator vocabulary for experiential learning, contextual memos, and
 * inspection fields: a view of the canon in kernel/operator-detection.js.
 *
 * The canon names each operator's type and label, and the keys it resolves:
 * every prefix, type and alias. This file adds only what a memo says the
 * operator does and the wonder it opens, keyed by canon type.
 */

import { OPERATOR_DEFINITIONS, OPERATOR_TYPE_ALIASES } from '/public/js/kernel/operator-detection.js';

const MEMO_BY_TYPE = Object.freeze({
  frame: { intent: 'name a resonance handle', wonder: 'resonance' },
  layer: { intent: 'name a resonance field', wonder: 'resonance' },
  vibration: { intent: 'make resonance recognizable', wonder: 'resonance' },
  ground: { intent: 'settle to local ground', wonder: 'memory' },
  integration: { intent: 'lift parts into relation', wonder: 'comparison' },
  potential: { intent: 'hold possibility open', wonder: 'projection' },
  wonder: { intent: 'open curiosity', wonder: 'inquiry' },
  perspective: { intent: 'situate a viewpoint', wonder: 'orientation' },
  value: { intent: 'mark material salience', wonder: 'memory' },
  subject: { intent: 'name the relational focus', wonder: 'comparison' },
  binding: { intent: 'name or pin a local value', wonder: 'constraint' },
  substrate: { intent: 'reveal the support layer', wonder: 'comparison' },
  normalize: { intent: 'scale into comparability', wonder: 'constraint' },
  action: { intent: 'commit a visible move', wonder: 'projection' },
  'concept-edge': { intent: 'close a concept bracket', wonder: 'orientation' },
  concept: { intent: 'open a concept boundary', wonder: 'orientation' },
  scene: { intent: 'stage a context', wonder: 'projection' },
  mode: { intent: 'select a posture', wonder: 'constraint' },
  direction: { intent: 'hold bounded motion', wonder: 'orientation' },
});

const INFO_BY_TYPE = Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, label }) => [
  type,
  Object.freeze({ type, label, ...MEMO_BY_TYPE[type] }),
]));

export const OPERATOR_INFO = Object.freeze({
  ...Object.fromEntries(OPERATOR_DEFINITIONS.map(({ prefix, type }) => [prefix, INFO_BY_TYPE[type]])),
  ...INFO_BY_TYPE,
  ...Object.fromEntries(Object.entries(OPERATOR_TYPE_ALIASES)
    .filter(([, type]) => INFO_BY_TYPE[type])
    .map(([alias, type]) => [alias, INFO_BY_TYPE[type]])),
});
