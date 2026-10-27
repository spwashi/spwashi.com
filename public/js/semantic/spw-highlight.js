/**
 * Spw as highlighted HTML, shared by every place the site shows or edits Spw.
 *
 * The role stream comes from the workbench reader (spw-workbench-reader.js
 * `roles()`), which is what VS Code paints, so a page and the editor split a
 * file the same way. Each mark also wears its operator type from the site's
 * registry as `data-op`, the attribute the paste tool and the spirit sequence
 * already color by, so every sigil keeps its color here too.
 *
 * Pure: text and role spans in, HTML out, every character given back once.
 * Classes: `spw-role-<role>` and `spw-role-<modifier>`; `spw-paired` marks
 * the offsets a caller asks to emphasize (a brace and its partner).
 */
import { OPERATOR_DEFINITIONS } from '/public/js/kernel/operator-detection.js';

/** Longest prefix first, so #> wins over #. A stream entry's >> is the stream, not a concept edge. */
// Workbench relation: harmony with the workbench reader's roles; mutation, via the kernel, for paint types; extension: >> stream.
const PREFIXES = [...OPERATOR_DEFINITIONS.map((definition) => [definition.prefix, definition.type]), ['>>', 'stream']]
  .sort((a, b) => b[0].length - a[0].length);

/** A closing brace wears its opener's type. */
const OPENER_OF = Object.freeze({ '>': '<', ')': '(', ']': '[', '}': '{' });
const TYPE_OF = new Map(PREFIXES);

/** Roles whose text is never an operator, whatever it starts with. */
const UNTYPED_ROLES = new Set(['string', 'comment', 'number', 'commitRef', 'hashlike']);

const ESCAPES = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' });
const escapeHtml = (text) => text.replace(/[&<>"]/g, (ch) => ESCAPES[ch]);

/** The site operator type a span's text carries, or ''. */
export function operatorTypeOf(text, role = '') {
  if (!text || UNTYPED_ROLES.has(role)) return '';
  if (text.length === 1 && OPENER_OF[text]) return TYPE_OF.get(OPENER_OF[text]) || '';
  for (const [prefix, type] of PREFIXES) if (text.startsWith(prefix)) return type;
  return '';
}

/** Offsets where each line starts. */
export function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

/**
 * @param {string} source
 * @param {Array<{ line: number, char: number, length: number, role: string, modifiers: string[] }>} spans
 * @param {{ emphasize?: Set<number> | null }} [options] absolute offsets of spans to mark spw-paired
 */
export function highlightSpw(source, spans = [], { emphasize = null } = {}) {
  const text = String(source ?? '');
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
  const braces = tokens.filter((token) => /^(CONTAINER|CAPSULE)_(OPEN|CLOSE)$/.test(token.type) && token.span?.start);
  const stack = [];
  const pairs = new Map();
  for (const token of braces) {
    const at = token.span.start.offset;
    if (token.type.endsWith('_OPEN')) stack.push(at);
    else if (stack.length) {
      const open = stack.pop();
      pairs.set(open, at);
      pairs.set(at, open);
    }
  }
  for (const at of [offset, offset - 1]) {
    if (pairs.has(at)) return [Math.min(at, pairs.get(at)), Math.max(at, pairs.get(at))];
  }
  return null;
}
