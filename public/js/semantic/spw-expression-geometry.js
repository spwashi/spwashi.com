/**
 * Browser-safe projection of authored Spw expression geometry.
 *
 * This is intentionally smaller than the mounted workbench parser. It reads
 * operator sigils and paired-boundary geometry so public runtime features can
 * present authored syntax without claiming ONF, evaluation, or canonical form.
 */

import { detectOperator } from '/public/js/kernel/operator-detection.js';

const FORM_GLYPHS = Object.freeze({
  frame: '[]',
  body: '{}',
  scope: '()',
  capsule: '<>',
  stream: '<<>>',
  couple: '<>',
});

const OPEN_BOUNDARIES = Object.freeze({
  '[': Object.freeze({ close: ']', form: 'frame' }),
  '{': Object.freeze({ close: '}', form: 'body' }),
  '(': Object.freeze({ close: ')', form: 'scope' }),
  '<': Object.freeze({ close: '>', form: 'capsule' }),
  '<<': Object.freeze({ close: '>>', form: 'stream' }),
});

const CLOSE_BOUNDARIES = new Set([']', '}', ')', '>', '>>']);
const OPERATOR_SIGILS = Object.freeze(['#>', '#:', '?', '~', '@', '&', '*', '^', '.', '$', '%', '!', '=', '>', '#']);
const QUOTES = new Set(['"', "'", '`']);
const ROOT_RE = /^\s*([A-Za-z_][A-Za-z0-9_.-]*)/;
const OPERATOR_SUBJECT_RE = /[A-Za-z_"'([{<]/;

export const SPW_DIMENSIONAL_ASCENT = Object.freeze([
  Object.freeze({ order: 0, label: '0D', role: 'handle', source: 'authored' }),
  Object.freeze({ order: 1, label: '1D', role: 'vector', source: 'authored' }),
  Object.freeze({ order: 2, label: '2D', role: 'form', source: 'authored' }),
  Object.freeze({ order: 3, label: '3D', role: 'field', source: 'contextual' }),
  Object.freeze({ order: 4, label: '4D', role: 'path', source: 'runtime' }),
]);

export const SPW_DIMENSIONAL_EDGES = Object.freeze([
  Object.freeze({ from: 0, to: 1, relation: 'direct' }),
  Object.freeze({ from: 1, to: 2, relation: 'bound' }),
  Object.freeze({ from: 2, to: 3, relation: 'situate' }),
  Object.freeze({ from: 3, to: 4, relation: 'replay' }),
  Object.freeze({ from: 4, to: 0, relation: 'return' }),
]);

function pushText(tokens, value, start, end) {
  if (!value) return;
  const previous = tokens[tokens.length - 1];
  if (previous?.type === 'text' && previous.end === start) {
    previous.value += value;
    previous.end = end;
    return;
  }
  tokens.push({ type: 'text', value, start, end });
}

function readQuoted(source, start) {
  const quote = source[start];
  let cursor = start + 1;
  while (cursor < source.length) {
    if (source[cursor] === '\\') {
      cursor += 2;
      continue;
    }
    cursor += 1;
    if (source[cursor - 1] === quote) break;
  }
  return cursor;
}

function boundaryToken(value, meta, direction, start, end) {
  return {
    type: 'boundary',
    value,
    form: meta.form,
    direction,
    start,
    end,
  };
}

function operatorToken(value, start, end) {
  const operator = detectOperator(value);
  return {
    type: 'operator',
    value,
    operator: operator?.type || '',
    start,
    end,
  };
}

function canStartOperator(source, index, sigil) {
  if (sigil === '#>' || sigil === '#:' || sigil === '>') return true;
  const immediate = source[index + sigil.length] || '';
  if (OPERATOR_SUBJECT_RE.test(immediate)) return true;
  if (sigil !== '?') return false;
  const rest = source.slice(index + sigil.length);
  return /^\s+\(/.test(rest);
}

/**
 * Scan the public expression subset into lossless surface tokens.
 * Unknown material stays text; malformed bounds are reported, never repaired.
 */
export function scanSpwExpression(source = '') {
  const input = String(source);
  const tokens = [];
  const forms = [];
  const channels = [];
  const operators = [];
  const stack = [];
  const errors = [];
  let cursor = 0;
  let textStart = 0;

  const flushText = (end) => {
    if (end <= textStart) return;
    pushText(tokens, input.slice(textStart, end), textStart, end);
  };

  const rememberForm = (form) => {
    if (!forms.includes(form)) forms.push(form);
  };

  while (cursor < input.length) {
    const char = input[cursor];

    if (QUOTES.has(char)) {
      cursor = readQuoted(input, cursor);
      continue;
    }

    if (input.startsWith('<<', cursor)) {
      flushText(cursor);
      const meta = OPEN_BOUNDARIES['<<'];
      tokens.push(boundaryToken('<<', meta, 'open', cursor, cursor + 2));
      stack.push({ ...meta, open: '<<', contentStart: cursor + 2 });
      rememberForm(meta.form);
      cursor += 2;
      textStart = cursor;
      continue;
    }

    if (input.startsWith('>>', cursor)) {
      flushText(cursor);
      const active = stack[stack.length - 1];
      if (active?.close === '>>') {
        stack.pop();
        tokens.push(boundaryToken('>>', active, 'close', cursor, cursor + 2));
      } else {
        errors.push({ type: 'unexpected-close', value: '>>', index: cursor });
        pushText(tokens, '>>', cursor, cursor + 2);
      }
      cursor += 2;
      textStart = cursor;
      continue;
    }

    if (input.startsWith('<>', cursor)) {
      flushText(cursor);
      const meta = { form: 'couple' };
      tokens.push(boundaryToken('<>', meta, 'pair', cursor, cursor + 2));
      rememberForm(meta.form);
      cursor += 2;
      textStart = cursor;
      continue;
    }

    const openMeta = OPEN_BOUNDARIES[char];
    if (openMeta) {
      flushText(cursor);
      tokens.push(boundaryToken(char, openMeta, 'open', cursor, cursor + 1));
      stack.push({ ...openMeta, open: char, contentStart: cursor + 1 });
      rememberForm(openMeta.form);
      cursor += 1;
      textStart = cursor;
      continue;
    }

    if (CLOSE_BOUNDARIES.has(char) && (char !== '>' || stack[stack.length - 1]?.close === '>')) {
      flushText(cursor);
      const active = stack[stack.length - 1];
      if (active?.close === char) {
        stack.pop();
        tokens.push(boundaryToken(char, active, 'close', cursor, cursor + 1));
        if (active.form === 'capsule') {
          const channel = input.slice(active.contentStart, cursor).trim();
          if (channel && !/[\[\]{}()<>]/.test(channel)) channels.push(channel);
        }
      } else {
        errors.push({ type: 'unexpected-close', value: char, index: cursor });
        pushText(tokens, char, cursor, cursor + 1);
      }
      cursor += 1;
      textStart = cursor;
      continue;
    }

    const sigil = OPERATOR_SIGILS.find((candidate) => (
      input.startsWith(candidate, cursor)
      && canStartOperator(input, cursor, candidate)
    ));
    if (sigil) {
      flushText(cursor);
      const token = operatorToken(sigil, cursor, cursor + sigil.length);
      tokens.push(token);
      if (token.operator && !operators.includes(token.operator)) operators.push(token.operator);
      cursor += sigil.length;
      textStart = cursor;
      continue;
    }

    cursor += 1;
  }

  flushText(input.length);

  for (const unclosed of stack) {
    errors.push({ type: 'unclosed-boundary', value: unclosed.open, index: unclosed.contentStart - unclosed.open.length });
  }

  const root = input.match(ROOT_RE)?.[1] || '';
  return {
    source: input,
    root,
    tokens,
    forms,
    channels,
    operators,
    balanced: errors.length === 0,
    errors,
  };
}

export function describeSpwExpression(source = '', options = {}) {
  const geometry = scanSpwExpression(source);
  const maxRootLength = Number.isFinite(options.maxRootLength) ? options.maxRootLength : 18;
  const root = geometry.root.slice(0, Math.max(0, maxRootLength));
  const glyphs = geometry.forms.map((form) => FORM_GLYPHS[form] || '').filter(Boolean);
  const wake = [root, glyphs.join('')].filter(Boolean).join(' · ');
  const spokenForms = geometry.forms.length ? geometry.forms.join(', ') : 'unbounded';

  return {
    ...geometry,
    wake,
    formSignature: glyphs.join(''),
    description: `${root ? `${root}; ` : ''}${spokenForms}${geometry.balanced ? '' : '; partial'}`,
  };
}

export function parseSpwExpression(expression = '', options = {}) {
  const text = String(expression || '').trim();
  const described = describeSpwExpression(text, options);
  const prefix = described.tokens.find((token) => token.type === 'operator')?.value || '';
  const nucleus = prefix ? text.slice(prefix.length) : text;
  const operatorType = described.operators[0] || '';
  const operator = detectOperator(prefix || text);

  return {
    ...described,
    expression: text,
    prefix,
    nucleus,
    operatorType,
    operator,
  };
}

/**
 * Report the dimensional evidence available to a public expression surface.
 *
 * Authored text can prove identity, operator direction, and paired form. Field
 * context and replayable paths are projections supplied explicitly by a host
 * or runtime; they are never inferred from punctuation alone.
 */
export function describeSpwDimensionality(source = '', options = {}) {
  const geometry = describeSpwExpression(source, options);
  const identity = geometry.root || geometry.tokens
    .find((token) => token.type === 'text' && token.value.trim())
    ?.value.trim() || '';
  const authoredOrders = new Set();

  if (identity) authoredOrders.add(0);
  if (geometry.operators.length) authoredOrders.add(1);
  if (geometry.forms.length) authoredOrders.add(2);

  const dimensions = SPW_DIMENSIONAL_ASCENT.map((dimension) => {
    if (authoredOrders.has(dimension.order)) {
      return { ...dimension, state: 'authored' };
    }
    if (dimension.order === 3 && options.hostContext) {
      return { ...dimension, state: 'contextual' };
    }
    if (dimension.order === 4 && options.runtimePath) {
      return { ...dimension, state: 'runtime' };
    }
    return { ...dimension, state: 'available' };
  });

  return {
    identity,
    dimensions,
    edges: SPW_DIMENSIONAL_EDGES,
    authoredOrders: [...authoredOrders],
    authoredThrough: authoredOrders.size ? Math.max(...authoredOrders) : null,
    sourceBoundary: '0D-2D authored; 3D-4D contextual',
  };
}

export const SPW_EXPRESSION_GEOMETRY_CONTRACT = Object.freeze({
  forms: FORM_GLYPHS,
  dimensions: SPW_DIMENSIONAL_ASCENT,
  edges: SPW_DIMENSIONAL_EDGES,
  authority: 'surface-projection',
  nonGoals: Object.freeze(['ONF', 'evaluation', 'canonicalization', 'mutation', 'context-inference']),
});
