/**
 * Spw as highlighted HTML, shared by every place the site shows or edits Spw.
 *
 * Highlight spans derive from the workbench reader kernel's token stream
 * (`parse(source, { eventPolicy: 'none' }).tokens` via `tokenSpans`), with
 * fallback support for precomputed role spans (`roles()`). Every mark also wears
 * its operator type from the site's registry as `data-op`, so operators,
 * braces, and all four particle axes keep their colors without running a
 * separate scanner.
 *
 * Pure: text and tokens/spans in, HTML out, every character given back once.
 * Classes: `spw-role-<role>` and `spw-role-<modifier>`; `spw-paired` marks
 * the offsets a caller asks to emphasize (a brace and its partner).
 */
import { OPERATOR_DEFINITIONS } from '/public/js/kernel/operator-detection.js';
import { scanSpwExpression } from '/public/js/semantic/spw-expression-geometry.js';

/** Longest prefix first, so #> / #: / #! win over #. Stream and n-range pairs keep their own types before < or (. */
// Workbench relation: harmony with the workbench reader's tokens/roles; mutation, via the kernel, for paint types; extension: << / >> stream, (( / )) scene.
const PREFIXES = [
  ...OPERATOR_DEFINITIONS.map((definition) => [definition.prefix, definition.type]),
  ['<<', 'stream'],
  ['>>', 'stream'],
  ['((', 'scene'],
  ['))', 'scene'],
].sort((a, b) => b[0].length - a[0].length);

/** A closing brace wears its opener's type. */
const OPENER_OF = Object.freeze({ '>': '<', ')': '(', ']': '[', '}': '{', '>>': '<<', '))': '((' });
const TYPE_OF = new Map(PREFIXES);

/** Roles whose text is never an operator, whatever it starts with. */
const UNTYPED_ROLES = new Set(['string', 'comment', 'number', 'commitRef', 'hashlike', 'punct']);

const ESCAPES = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' });
const escapeHtml = (text) => text.replace(/[&<>"]/g, (ch) => ESCAPES[ch]);

/** The site operator type a span's text carries, or ''. */
export function operatorTypeOf(text, role = '') {
  if (!text || UNTYPED_ROLES.has(role)) return '';
  if (OPENER_OF[text]) return TYPE_OF.get(OPENER_OF[text]) || '';
  for (const [prefix, type] of PREFIXES) if (text.startsWith(prefix)) return type;
  return '';
}

/** Offsets where each line starts. */
export function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

const PARTICLE_ROLE_BY_AIM = Object.freeze({
  '>': { role: 'keyword', modifiers: ['declaration'] },
  ':': { role: 'type', modifiers: ['definition'] },
  '!': { role: 'function', modifiers: ['modification'] },
});

const OPERATOR_ROLE_BY_SIGIL = Object.freeze({
  '^': { role: 'keyword', modifiers: ['declaration'] },
  '*': { role: 'keyword', modifiers: [] },
  '%': { role: 'keyword', modifiers: [] },
  '=': { role: 'property', modifiers: ['readonly'] },
  '!': { role: 'function', modifiers: ['modification'] },
  '?': { role: 'function', modifiers: ['async'] },
  '~': { role: 'variable', modifiers: [] },
  '$': { role: 'variable', modifiers: [] },
  '@': { role: 'keyword', modifiers: ['declaration'] },
  '.': { role: 'punct', modifiers: [] },
  '#': { role: 'keyword', modifiers: ['declaration'] },
  '&': { role: 'operator', modifiers: [] },
  '<': { role: 'operator', modifiers: ['declaration'] },
  '>': { role: 'operator', modifiers: [] },
});

const isKernelToken = (entry) => Boolean(entry && typeof entry.type === 'string' && entry.span?.start && entry.span?.end);

const pushTokenSpan = (spans, line, char, text, role, modifiers) => {
  if (!text.includes('\n')) {
    spans.push({ line, char, length: text.length, role, modifiers });
    return;
  }
  text.split('\n').forEach((part, offset) => {
    if (part.length > 0) spans.push({ line: line + offset, char: offset === 0 ? char : 0, length: part.length, role, modifiers });
  });
};

/**
 * Project parameterized kernel tokens (`parse(source, { eventPolicy: 'none' }).tokens`)
 * into role spans for `highlightSpw`, keeping exact offsets and unifying all
 * four particle axes (`#>`, `#:`, `#!`, `~#`) without a separate scanner.
 */
export function tokenSpans(tokens = []) {
  const spans = [];
  for (const token of tokens) {
    if (!isKernelToken(token)) continue;
    const { start, end } = token.span;
    const length = token.value ? token.value.length : (end.offset - start.offset);
    if (length <= 0) continue;
    const line = Math.max(0, start.line - 1);
    const char = Math.max(0, start.column - 1);

    switch (token.type) {
      case 'WHITESPACE':
      case 'EOF':
      case 'TEXT':
      case 'HOLE':
        break;
      case 'IDENTIFIER':
        if (token.kind === 'commit_ref') pushTokenSpan(spans, line, char, token.value, 'commitRef', []);
        break;
      case 'COMMENT':
        pushTokenSpan(spans, line, char, token.value, 'comment', []);
        break;
      case 'STRING':
      case 'PHRASE':
        pushTokenSpan(spans, line, char, token.value, 'string', []);
        break;
      case 'NUMBER':
      case 'BOOLEAN':
        pushTokenSpan(spans, line, char, token.value, 'number', []);
        break;
      case 'MODIFIER':
        pushTokenSpan(spans, line, char, token.value, 'function', ['modification']);
        break;
      case 'PARTICLE': {
        const meta = PARTICLE_ROLE_BY_AIM[token.kind] || { role: 'type', modifiers: [] };
        pushTokenSpan(spans, line, char, token.value, meta.role, meta.modifiers);
        break;
      }
      case 'ANNOTATION':
        pushTokenSpan(spans, line, char, token.value, 'property', ['declaration']);
        break;
      case 'APPOSITION': {
        const open = token.value.indexOf('(');
        const close = token.value.lastIndexOf(')');
        if (open >= 2 && close > open) {
          pushTokenSpan(spans, line, char, token.value.slice(0, open), 'property', ['declaration']);
          pushTokenSpan(spans, line, char + open, '(', 'operator', ['declaration']);
          if (close > open + 1) pushTokenSpan(spans, line, char + open + 1, token.value.slice(open + 1, close), 'string', []);
          pushTokenSpan(spans, line, char + close, ')', 'operator', []);
        } else {
          pushTokenSpan(spans, line, char, token.value, 'property', ['declaration']);
        }
        break;
      }
      case 'CONTAINER_OPEN':
      case 'CAPSULE_OPEN':
        pushTokenSpan(spans, line, char, token.value, 'operator', ['declaration']);
        break;
      case 'CONTAINER_CLOSE':
      case 'CAPSULE_CLOSE':
        pushTokenSpan(spans, line, char, token.value, 'operator', []);
        break;
      case 'STREAM_OPEN':
      case 'STREAM_CLOSE':
        pushTokenSpan(spans, line, char, token.value, 'operator', ['async']);
        break;
      case 'NRANGE_OPEN':
        pushTokenSpan(spans, line, char, token.value, 'operator', ['declaration', 'async']);
        break;
      case 'NRANGE_CLOSE':
        pushTokenSpan(spans, line, char, token.value, 'operator', ['async']);
        break;
      case 'OPERATOR': {
        const meta = OPERATOR_ROLE_BY_SIGIL[token.value] || { role: 'operator', modifiers: [] };
        pushTokenSpan(spans, line, char, token.value, meta.role, meta.modifiers);
        break;
      }
      case 'CONNECTOR':
        pushTokenSpan(
          spans,
          line,
          char,
          token.value,
          token.value === '..' || token.value === '~>' ? 'operator' : 'punct',
          [],
        );
        break;
      default:
        break;
    }
  }
  return spans;
}

/**
 * @param {string} source
 * @param {Array | { tokens?: Array }} spansOrTokens Role spans (`roles()`), kernel `Token[]`, or `{ tokens }` from `parse()`.
 * @param {{ emphasize?: Set<number> | null }} [options] absolute offsets of spans to mark spw-paired
 */
export function highlightSpw(source, spansOrTokens = [], { emphasize = null } = {}) {
  const text = String(source ?? '');
  const raw = Array.isArray(spansOrTokens?.tokens) ? spansOrTokens.tokens : (spansOrTokens || []);
  const spans = raw.some(isKernelToken) ? tokenSpans(raw) : raw;
  const lines = text.split('\n');
  const starts = lineStarts(text);
  const byLine = new Map();
  for (const span of spans) {
    if (!span || span.length <= 0) continue;
    const list = byLine.get(span.line);
    if (list) list.push(span);
    else byLine.set(span.line, [span]);
  }
  return lines.map((lineText, index) => {
    const list = (byLine.get(index) || []).sort((a, b) => a.char - b.char);
    let out = '';
    let col = 0;
    for (const span of list) {
      if (span.char < col || span.char >= lineText.length) continue;
      const end = Math.min(lineText.length, span.char + span.length);
      const piece = lineText.slice(span.char, end);
      const type = operatorTypeOf(piece, span.role);
      const classes = [span.role, ...(span.modifiers || [])].map((name) => `spw-role-${name}`);
      if (emphasize?.has(starts[index] + span.char)) classes.push('spw-paired');
      out += escapeHtml(lineText.slice(col, span.char));
      out += `<span class="${classes.join(' ')}"${type ? ` data-op="${type}"` : ''}>${escapeHtml(piece)}</span>`;
      col = end;
    }
    return out + escapeHtml(lineText.slice(col));
  }).join('\n');
}

/**
 * The brace that pairs with the one at or just before an offset, from the
 * parser's tokens (strings and comments are already their own tokens).
 * Returns [open, close] offsets, or null.
 */
export function bracePairAt(tokens = [], offset = 0) {
  const braces = tokens.filter((token) => /^(CONTAINER|CAPSULE|STREAM|NRANGE)_(OPEN|CLOSE)$/.test(token.type) && token.span?.start);
  const stack = [];
  const pairs = new Map();
  for (const token of braces) {
    const at = token.span.start.offset;
    const len = token.value ? token.value.length : ((token.span.end?.offset ?? (at + 1)) - at);
    if (token.type.endsWith('_OPEN')) {
      stack.push({ at, value: token.value, len });
    } else if (stack.length) {
      const opener = OPENER_OF[token.value];
      const top = stack[stack.length - 1];
      if (!opener || top.value !== opener) continue;
      stack.pop();
      pairs.set(top.at, at);
      pairs.set(at, top.at);
      if (len > 1) pairs.set(at + len - 1, top.at);
      if (top.len > 1) pairs.set(top.at + top.len - 1, at);
    }
  }
  for (const at of [offset, offset - 1]) {
    if (pairs.has(at)) return [Math.min(at, pairs.get(at)), Math.max(at, pairs.get(at))];
  }
  return null;
}

const INLINE_FORM_OP = Object.freeze({
  frame: 'mode',
  body: 'ground',
  scope: 'scene',
  scene: 'scene',
  capsule: 'concept',
  stream: 'stream',
  couple: 'concept',
});

/**
 * Synchronous, kernel-free syntax highlighter for concise inline expressions and
 * instant pre-worker painting of Spw source blocks before `parse()` resolves.
 */
export function highlightSpwInline(source = '') {
  const text = String(source ?? '');
  if (!text) return '';
  const { tokens } = scanSpwExpression(text);
  let out = '';
  let cursor = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.start > cursor) out += escapeHtml(text.slice(cursor, token.start));
    const piece = text.slice(token.start, token.end);
    if (token.type === 'operator') {
      const meta = OPERATOR_ROLE_BY_SIGIL[piece] || { role: 'operator', modifiers: ['declaration'] };
      const opType = token.operator || operatorTypeOf(piece, meta.role);
      const classes = [meta.role, ...(meta.modifiers || [])].map((name) => `spw-role-${name}`);
      out += `<span class="${classes.join(' ')}"${opType ? ` data-op="${opType}"` : ''}>${escapeHtml(piece)}</span>`;
    } else if (token.type === 'boundary') {
      const opType = INLINE_FORM_OP[token.form] || operatorTypeOf(piece, 'operator') || 'operator';
      const classes = ['spw-role-operator'];
      if (token.direction === 'open') classes.push('spw-role-declaration');
      out += `<span class="${classes.join(' ')}" data-op="${opType}">${escapeHtml(piece)}</span>`;
    } else if (/^["'`]/.test(piece)) {
      out += `<span class="spw-role-string">${escapeHtml(piece)}</span>`;
    } else if (tokens[i + 1]?.type === 'operator' && tokens[i + 1]?.value === '@' && /[A-Za-z0-9_-]$/.test(piece)) {
      const split = piece.match(/^(.*?)([A-Za-z0-9_-]+)$/);
      if (split && split[2]) {
        out += escapeHtml(split[1]);
        out += `<span class="spw-role-variable" data-op="perspective">${escapeHtml(split[2])}</span>`;
      } else {
        out += escapeHtml(piece);
      }
    } else {
      out += escapeHtml(piece);
    }
    cursor = token.end;
  }

  if (cursor < text.length) out += escapeHtml(text.slice(cursor));
  return out;
}
