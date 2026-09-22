/**
 * Module-first selector audit helpers.
 * Specificity and HTML host matching for catalog `selector` fields.
 * Pure. Tests consume this; the CLI walks MODULE_DEFS + routes.
 */

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

export function splitSelectorList(input = '') {
  const out = [];
  let buf = '';
  let paren = 0;
  let square = 0;
  for (const ch of String(input)) {
    if (ch === '(') paren += 1;
    else if (ch === ')' && paren) paren -= 1;
    else if (ch === '[') square += 1;
    else if (ch === ']' && square) square -= 1;
    if (ch === ',' && !paren && !square) {
      const part = buf.trim();
      if (part) out.push(part);
      buf = '';
      continue;
    }
    buf += ch;
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

function splitCompounds(selector) {
  const compounds = [];
  const combinators = [];
  let buf = '';
  let paren = 0;
  let square = 0;
  let pending = null;
  const pushCompound = () => {
    const part = buf.trim();
    buf = '';
    if (!part) return;
    if (compounds.length) combinators.push(pending || ' ');
    compounds.push(part);
    pending = null;
  };
  for (const ch of selector) {
    if (ch === '(') paren += 1;
    else if (ch === ')' && paren) paren -= 1;
    else if (ch === '[') square += 1;
    else if (ch === ']' && square) square -= 1;
    if (!paren && !square && (ch === '>' || ch === '+' || ch === '~')) {
      pushCompound();
      pending = ch;
      continue;
    }
    if (!paren && !square && /\s/.test(ch)) {
      if (buf.trim()) {
        pushCompound();
        pending = pending || ' ';
      }
      continue;
    }
    buf += ch;
  }
  pushCompound();
  return { compounds, combinators };
}

export function combinatorDepth(selector = '') {
  return splitSelectorList(selector).reduce((max, part) => {
    const { combinators } = splitCompounds(part);
    return Math.max(max, combinators.length);
  }, 0);
}

function maxTriple(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a[0] !== b[0]) return a[0] > b[0] ? a : b;
  if (a[1] !== b[1]) return a[1] > b[1] ? a : b;
  return a[2] >= b[2] ? a : b;
}

function addTriple(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function parseArgs(inner) {
  return splitSelectorList(inner);
}

function compoundSpecificity(compound) {
  let spec = [0, 0, 0];
  const src = String(compound || '').trim();
  if (!src || src === '*') return spec;
  let i = 0;
  const len = src.length;
  while (i < len) {
    const ch = src[i];
    if (ch === '*') {
      i += 1;
      continue;
    }
    if (ch === '#') {
      i += 1;
      while (i < len && /[a-zA-Z0-9_-]/.test(src[i])) i += 1;
      spec = addTriple(spec, [1, 0, 0]);
      continue;
    }
    if (ch === '.') {
      i += 1;
      while (i < len && /[a-zA-Z0-9_-]/.test(src[i])) i += 1;
      spec = addTriple(spec, [0, 1, 0]);
      continue;
    }
    if (ch === '[') {
      i += 1;
      while (i < len && src[i] !== ']') i += 1;
      if (src[i] === ']') i += 1;
      spec = addTriple(spec, [0, 1, 0]);
      continue;
    }
    if (ch === ':') {
      const dbl = src[i + 1] === ':';
      i += dbl ? 2 : 1;
      let name = '';
      while (i < len && /[a-zA-Z0-9_-]/.test(src[i])) {
        name += src[i];
        i += 1;
      }
      let inner = '';
      if (src[i] === '(') {
        let depth = 1;
        i += 1;
        while (i < len && depth) {
          if (src[i] === '(') depth += 1;
          else if (src[i] === ')') depth -= 1;
          if (depth) inner += src[i];
          i += 1;
        }
      }
      if (dbl) {
        spec = addTriple(spec, [0, 0, 1]);
        continue;
      }
      if (name === 'where') continue;
      if (name === 'is' || name === 'not' || name === 'has') {
        const args = parseArgs(inner);
        let best = [0, 0, 0];
        for (const arg of args) best = maxTriple(best, selectorSpecificity(arg).triple);
        spec = addTriple(spec, best);
        continue;
      }
      spec = addTriple(spec, [0, 1, 0]);
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      while (i < len && /[a-zA-Z0-9_:-]/.test(src[i])) i += 1;
      spec = addTriple(spec, [0, 0, 1]);
      continue;
    }
    i += 1;
  }
  return spec;
}

export function selectorSpecificity(selector = '') {
  const parts = splitSelectorList(selector);
  let best = [0, 0, 0];
  let deepest = 0;
  for (const part of parts) {
    const { compounds, combinators } = splitCompounds(part);
    deepest = Math.max(deepest, combinators.length);
    let spec = [0, 0, 0];
    for (const compound of compounds) spec = addTriple(spec, compoundSpecificity(compound));
    best = maxTriple(best, spec);
  }
  return {
    triple: best,
    a: best[0],
    b: best[1],
    c: best[2],
    score: best[0] * 10000 + best[1] * 100 + best[2],
    combinators: deepest,
    branches: parts.length,
  };
}

function parseAttrs(raw = '') {
  const attrs = new Map();
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match;
  while ((match = re.exec(raw))) {
    attrs.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

export function indexHtmlElements(html = '') {
  const stripped = String(html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const elements = [];
  const stack = [];
  const re = /<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  let match;
  while ((match = re.exec(stripped))) {
    if (match[1]) {
      const close = match[1].toLowerCase();
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        if (elements[stack[i]].tag === close) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const tag = match[2].toLowerCase();
    const attrs = parseAttrs(match[3] || '');
    const selfClosing = Boolean(match[4]) || VOID.has(tag);
    const parentIndex = stack.length ? stack[stack.length - 1] : -1;
    const depth = stack.length + 1;
    const className = attrs.get('class') || '';
    const node = {
      tag,
      id: attrs.get('id') || '',
      classes: className.split(/\s+/).filter(Boolean),
      attrs,
      depth,
      parentIndex,
      index: elements.length,
    };
    elements.push(node);
    if (!selfClosing) stack.push(node.index);
  }
  return elements;
}

function parseCompound(compound) {
  const src = String(compound || '').trim();
  const parsed = { tag: '', id: '', classes: [], attrs: [] };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '*') {
      i += 1;
      continue;
    }
    if (ch === '#') {
      i += 1;
      let id = '';
      while (i < src.length && /[a-zA-Z0-9_-]/.test(src[i])) {
        id += src[i];
        i += 1;
      }
      parsed.id = id;
      continue;
    }
    if (ch === '.') {
      i += 1;
      let cls = '';
      while (i < src.length && /[a-zA-Z0-9_-]/.test(src[i])) {
        cls += src[i];
        i += 1;
      }
      if (cls) parsed.classes.push(cls);
      continue;
    }
    if (ch === '[') {
      const end = src.indexOf(']', i);
      const body = src.slice(i + 1, end < 0 ? src.length : end);
      const attrMatch = body.match(/^([^\s=~|^$*]+)(?:\s*([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]]+)))?/);
      if (attrMatch) {
        parsed.attrs.push({
          name: attrMatch[1].toLowerCase(),
          op: attrMatch[2] || '',
          value: attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? '',
        });
      }
      i = end < 0 ? src.length : end + 1;
      continue;
    }
    if (ch === ':') {
      i += src[i + 1] === ':' ? 2 : 1;
      while (i < src.length && /[a-zA-Z0-9_-]/.test(src[i])) i += 1;
      if (src[i] === '(') {
        let depth = 1;
        i += 1;
        while (i < src.length && depth) {
          if (src[i] === '(') depth += 1;
          else if (src[i] === ')') depth -= 1;
          i += 1;
        }
      }
      continue;
    }
    if (/[a-zA-Z_]/.test(ch) && !parsed.tag) {
      let tag = '';
      while (i < src.length && /[a-zA-Z0-9_:-]/.test(src[i])) {
        tag += src[i];
        i += 1;
      }
      parsed.tag = tag.toLowerCase();
      continue;
    }
    i += 1;
  }
  return parsed;
}

/* A selector list is matched against every route, so the same compound string
   is seen thousands of times. Parse it once. */
const compoundCache = new Map();

function parsedCompound(compound) {
  let parsed = compoundCache.get(compound);
  if (!parsed) {
    parsed = parseCompound(compound);
    compoundCache.set(compound, parsed);
  }
  return parsed;
}

function matchCompound(el, parsed) {
  if (parsed.tag && el.tag !== parsed.tag) return false;
  if (parsed.id && el.id !== parsed.id) return false;
  for (const cls of parsed.classes) {
    if (!el.classes.includes(cls)) return false;
  }
  for (const attr of parsed.attrs) {
    if (!el.attrs.has(attr.name)) return false;
    if (!attr.op) continue;
    const got = el.attrs.get(attr.name) ?? '';
    if (attr.op === '=' && got !== attr.value) return false;
    if (attr.op === '~=' && !got.split(/\s+/).includes(attr.value)) return false;
    if (attr.op === '|=' && got !== attr.value && !got.startsWith(`${attr.value}-`)) return false;
    if (attr.op === '^=' && !got.startsWith(attr.value)) return false;
    if (attr.op === '$=' && !got.endsWith(attr.value)) return false;
    if (attr.op === '*=' && !got.includes(attr.value)) return false;
  }
  return true;
}

/* Previous-sibling index per element, derived once per element list. */
const previousSiblingCache = new WeakMap();

function previousSiblingIndexes(elements) {
  let previous = previousSiblingCache.get(elements);
  if (previous) return previous;
  previous = new Int32Array(elements.length).fill(-1);
  const lastChild = new Map();
  for (const el of elements) {
    previous[el.index] = lastChild.get(el.parentIndex) ?? -1;
    lastChild.set(el.parentIndex, el.index);
  }
  previousSiblingCache.set(elements, previous);
  return previous;
}

/* Each step keeps the right-hand matches whose relation reaches a left-hand
   match: one pass over the right side with a set lookup, not a left × right
   product. Hits come back in document order. */
function stepCombinator(elements, leftIndexes, rights, combinator) {
  if (combinator === '>') return rights.filter((right) => leftIndexes.has(right.parentIndex));
  if (combinator === ' ') {
    return rights.filter((right) => {
      for (let cursor = right.parentIndex; cursor >= 0; cursor = elements[cursor].parentIndex) {
        if (leftIndexes.has(cursor)) return true;
      }
      return false;
    });
  }
  const previous = previousSiblingIndexes(elements);
  if (combinator === '+') return rights.filter((right) => leftIndexes.has(previous[right.index]));
  if (combinator === '~') {
    return rights.filter((right) => {
      for (let cursor = previous[right.index]; cursor >= 0; cursor = previous[cursor]) {
        if (leftIndexes.has(cursor)) return true;
      }
      return false;
    });
  }
  return [];
}

export function matchSelector(elements, selector) {
  const hits = new Set();
  for (const branch of splitSelectorList(selector)) {
    const { compounds, combinators } = splitCompounds(branch);
    if (!compounds.length) continue;
    const first = parsedCompound(compounds[0]);
    let candidates = elements.filter((el) => matchCompound(el, first));
    for (let i = 1; i < compounds.length && candidates.length; i += 1) {
      const parsed = parsedCompound(compounds[i]);
      const rights = elements.filter((el) => matchCompound(el, parsed));
      const leftIndexes = new Set(candidates.map((el) => el.index));
      candidates = stepCombinator(elements, leftIndexes, rights, combinators[i - 1] || ' ');
    }
    for (const el of candidates) hits.add(el);
  }
  return [...hits];
}

export function summarizeHostDepths(hits = []) {
  if (!hits.length) {
    return { count: 0, min: null, max: null, mean: null };
  }
  const depths = hits.map((el) => el.depth);
  const sum = depths.reduce((acc, n) => acc + n, 0);
  return {
    count: hits.length,
    min: Math.min(...depths),
    max: Math.max(...depths),
    mean: Math.round((sum / depths.length) * 10) / 10,
  };
}

export function usesLegacySiteFrame(selector = '') {
  return /(?:^|[\s,>+~])\.site-frame(?:$|[\s,>+~:[])/.test(` ${selector} `)
    || selector.includes('.site-frame');
}
