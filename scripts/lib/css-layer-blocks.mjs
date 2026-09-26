/**
 * css-layer-blocks.mjs
 *
 * Finds the top-level `@layer name { … }` blocks of a flattened bundle
 * (bundles/core.css opens each layer as a block and carries no order
 * statement) and rebuilds the sheet with chosen layers dropped or kept.
 * Pure string work, so a probe can serve the result through CDP Fetch and a
 * test can check it without Chrome.
 */

/** @typedef {{ layer: string | null, start: number, end: number }} Segment */

/**
 * Split CSS into top-level segments: `@layer name { … }` blocks and the text
 * between them (comments, unlayered rules). Strings and comments are skipped
 * when counting braces.
 * @param {string} css
 * @returns {Segment[]}
 */
export function splitTopLevelLayers(css) {
  const segments = [];
  const header = /@layer\s+([a-zA-Z0-9_-]+)\s*\{/y;
  let depth = 0;
  let i = 0;
  let gapStart = 0;
  let blockStart = -1;
  let blockLayer = null;

  while (i < css.length) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') {
      const close = css.indexOf('*/', i + 2);
      i = close === -1 ? css.length : close + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== ch) j += css[j] === '\\' ? 2 : 1;
      i = j + 1;
      continue;
    }
    if (depth === 0 && ch === '@') {
      header.lastIndex = i;
      const match = header.exec(css);
      if (match) {
        if (i > gapStart) segments.push({ layer: null, start: gapStart, end: i });
        blockStart = i;
        blockLayer = match[1];
        depth = 1;
        i = header.lastIndex;
        continue;
      }
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && blockStart !== -1) {
        segments.push({ layer: blockLayer, start: blockStart, end: i + 1 });
        blockStart = -1;
        blockLayer = null;
        gapStart = i + 1;
      }
    }
    i += 1;
  }
  if (blockStart !== -1) throw new Error(`unclosed @layer ${blockLayer} block at ${blockStart}`);
  if (gapStart < css.length) segments.push({ layer: null, start: gapStart, end: css.length });
  return segments;
}

/**
 * Layer names in first-appearance order: the order a bundle without an order
 * statement actually ships.
 * @param {string} css
 */
export function listLayers(css) {
  return [...new Set(splitTopLevelLayers(css).map((s) => s.layer).filter(Boolean))];
}

/**
 * Rebuild the sheet keeping or dropping whole layers. Text outside any layer
 * block is kept either way.
 * @param {string} css
 * @param {{ drop?: string[], only?: string[] }} choice
 */
export function ablateLayers(css, { drop = [], only = null } = {}) {
  const keep = (layer) => {
    if (layer === null) return true;
    if (only) return only.includes(layer);
    return !drop.includes(layer);
  };
  return splitTopLevelLayers(css)
    .filter((segment) => keep(segment.layer))
    .map((segment) => css.slice(segment.start, segment.end))
    .join('');
}

/** Index of the brace that closes the one opening at `open`, skipping comments and strings. */
function matchBrace(css, open) {
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') {
      const close = css.indexOf('*/', i + 2);
      i = close === -1 ? css.length : close + 1;
    } else if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== ch) j += css[j] === '\\' ? 2 : 1;
      i = j;
    } else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return css.length - 1;
}

/**
 * Visit every style rule with the cascade layer it sits in. At-rules are
 * descended; `@layer name { }` sets the layer for what it holds. Declarations
 * are reduced to property names; nested style rules are visited with the
 * parent selector as their scope.
 * @param {string} css
 * @param {(rule: { layer: string | null, selector: string, props: string[] }) => void} visit
 * @param {string | null} [layer]
 */
export function walkStyleRules(css, visit, layer = null) {
  let i = 0;
  let start = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') {
      const close = css.indexOf('*/', i + 2);
      i = close === -1 ? css.length : close + 2;
      start = i;
      continue;
    }
    if (ch === ';') {
      start = i + 1;
    } else if (ch === '{') {
      const prelude = css.slice(start, i).trim();
      const end = matchBrace(css, i);
      const body = css.slice(i + 1, end);
      if (prelude.startsWith('@')) {
        const named = /^@layer\s+([a-zA-Z0-9_-]+)$/.exec(prelude);
        walkStyleRules(body, visit, named ? named[1] : layer);
      } else if (prelude) {
        const flat = body.replace(/\{[^{}]*\}/g, ';');
        const props = [...flat.matchAll(/(?:^|;)\s*(-{0,2}[a-zA-Z][\w-]*)\s*:/g)].map((m) => m[1]);
        visit({ layer, selector: prelude, props });
        if (body.includes('{')) {
          walkStyleRules(body, (rule) => visit({ ...rule, selector: `${prelude} ${rule.selector}` }), layer);
        }
      }
      i = end + 1;
      start = i;
      continue;
    }
    i += 1;
  }
}
