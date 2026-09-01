/**
 * module-describes-contract.js
 * --------------------------------------------------------------------------
 * Catalog `describes` is a Spw dialect, not a comment. Authors write one or
 * more subject[mode]{direction}<capsule> clauses; trailing English is gloss.
 * Runtime derives grade, subjects, and a spell head so inspectors can group
 * modules by what they name rather than by id.
 */

import { writeDatasetValue } from '../kernel/dom-contracts.js';

export const MODULE_DESCRIBES_GRADES = Object.freeze(['expression', 'mixed', 'prose']);

const CLAUSE_RE = /([A-Za-z_][A-Za-z0-9_.-]*)((?:\[[^\]]*\]|\{[^}]*\}|<[^>]*>)+)/g;
const WRAP_RE = /\[([^\]]*)\]|\{([^}]*)\}|<([^>]*)>/g;
const LIST_SEPARATOR = ' ';

function emptyDescribes(raw = '') {
  return {
    raw,
    expression: '',
    gloss: raw,
    grade: raw ? 'prose' : null,
    subjects: [],
    modes: [],
    directions: [],
    capsules: [],
    clauses: [],
    spell: raw,
    readable: raw,
  };
}

function splitWraps(wraps = '') {
  const modes = [];
  const directions = [];
  const capsules = [];
  for (const match of String(wraps).matchAll(WRAP_RE)) {
    if (match[1] != null) modes.push(match[1]);
    else if (match[2] != null) directions.push(match[2]);
    else if (match[3] != null) capsules.push(match[3]);
  }
  return { modes, directions, capsules };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function parseModuleDescribes(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return emptyDescribes('');

  const clauses = [];
  let cursor = 0;
  for (const match of raw.matchAll(CLAUSE_RE)) {
    const gap = raw.slice(cursor, match.index);
    if (gap && clauses.length && !/^\s+$/.test(gap)) {
      break;
    }
    const subject = match[1];
    const wraps = splitWraps(match[2]);
    clauses.push({
      subject,
      raw: match[0],
      modes: wraps.modes,
      directions: wraps.directions,
      capsules: wraps.capsules,
    });
    cursor = match.index + match[0].length;
  }

  if (!clauses.length) return emptyDescribes(raw);

  const expression = clauses.map((clause) => clause.raw).join(' ');
  const prefix = raw.slice(0, raw.indexOf(clauses[0].raw)).trim();
  const suffix = raw.slice(cursor).trim();
  const gloss = [prefix, suffix].filter(Boolean).join(' ');
  const grade = gloss ? 'mixed' : 'expression';

  return {
    raw,
    expression,
    gloss,
    grade,
    subjects: unique(clauses.map((clause) => clause.subject)),
    modes: unique(clauses.flatMap((clause) => clause.modes)),
    directions: unique(clauses.flatMap((clause) => clause.directions)),
    capsules: unique(clauses.flatMap((clause) => clause.capsules)),
    clauses,
    spell: expression,
    readable: gloss ? `${expression} — ${gloss}` : expression,
  };
}

export function describeModuleDescribes(value = '') {
  return parseModuleDescribes(value);
}

export function formatModuleDescribesSpell(value = '') {
  return parseModuleDescribes(value).spell || '';
}

export const SPW_MODULE_DESCRIBES_CONTRACT = Object.freeze({
  grades: MODULE_DESCRIBES_GRADES,
  portableUse:
    'describes is one or more subject[mode]{direction}<capsule> clauses. Trailing English is gloss. parseModuleDescribes() grades expression|mixed|prose so inspectors can group by subject instead of treating the string as copy.',
  dialect: Object.freeze([
    'cauldron[gather|mix|garden] force[operator] emergence[composition]',
    'texture[slice]{paper.linen.harlequin.wash.auto}<glitch.lift.screenshot>',
    'sigil[anatomy]{hydrate.split} raw fused text -> operand elements',
  ]),
  datasetFields: Object.freeze({
    raw: 'data-spw-module-describes',
    grade: 'data-spw-module-describes-grade',
    subject: 'data-spw-module-describes-subject',
    spell: 'data-spw-module-describes-spell',
  }),
});

export function annotateModuleDescribesTarget(target, value) {
  if (!(target instanceof HTMLElement)) return false;

  const contract = parseModuleDescribes(value);
  let changed = false;
  changed = writeDatasetValue(target, 'spwModuleDescribes', contract.raw || null) || changed;
  changed = writeDatasetValue(target, 'spwModuleDescribesGrade', contract.grade) || changed;
  changed = writeDatasetValue(
    target,
    'spwModuleDescribesSubject',
    contract.subjects.join(LIST_SEPARATOR) || null,
  ) || changed;
  changed = writeDatasetValue(target, 'spwModuleDescribesSpell', contract.spell || null) || changed;
  return changed;
}
