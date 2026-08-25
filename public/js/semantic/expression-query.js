/**
 * Partial expression search and join reading.
 *
 * Search matches slots the build already named: subject, [mode], {parts},
 * <projection>. Unclosed fragments count: `home[` is a subject plus an open
 * mode slot; `{open` is a part prefix. Join reading tells `.` `,` `;` and `~>`
 * apart so a qualified identifier is not treated as a brace crawl.
 *
 * The workbench parser is available through `__SPW_SITE__.parser.parse` — this
 * module does not load it. Kinship and search stay on authored slots.
 */

export const JOIN_KINDS = Object.freeze({
  none: 'none',
  ident: 'ident',
  list: 'list',
  common: 'common',
  ordinal: 'ordinal',
  project: 'project',
  crawl: 'crawl',
});

/** Tight `mill.laminate.cure` — one IDENTIFIER. Parser keeps it whole. */
const TIGHT_IDENT = /^[A-Za-z_][\w-]*(?:\.[A-Za-z_][\w-]*)+$/;

const BRACED_CRAWL = /^(?:\{[^{}]+\}\s*\.\s*)+\{[^{}]+\}$/;

function trim(value = '') {
  return String(value || '').trim();
}

function prefixOrEqual(hay = '', needle = '') {
  const left = trim(hay).toLowerCase();
  const right = trim(needle).toLowerCase();
  if (!right) return false;
  return left === right || left.startsWith(right);
}

function captureGroup(raw, open, close) {
  const start = raw.indexOf(open);
  if (start < 0) return { present: false, value: '' };
  const rest = raw.slice(start + open.length);
  const end = rest.indexOf(close);
  return {
    present: true,
    value: (end < 0 ? rest : rest.slice(0, end)).trim(),
  };
}

export function parseExpressionQuery(query = '') {
  const raw = String(query || '').trim();
  const mode = captureGroup(raw, '[', ']');
  const body = captureGroup(raw, '{', '}');
  const projection = captureGroup(raw, '<', '>');
  const subject = raw.match(/^([A-Za-z_][\w-]*)/)?.[1] || '';
  const join = body.value ? readBodyJoins(body.value) : { kind: JOIN_KINDS.none, parts: [] };
  const parts = join.parts;
  const wrapped = mode.present || body.present || projection.present;
  const freeTokens = wrapped
    ? []
    : raw
      .toLowerCase()
      .split(/[\s/|,_-]+/)
      .map((token) => token.replace(/^[?#@~^!*$%.=<>()[\]{}]+|[?#@~^!*$%.=<>()[\]{}]+$/g, ''))
      .filter((token) => token.length >= 2);

  return {
    raw,
    subject,
    mode: mode.value,
    hasModeSlot: mode.present,
    parts,
    join: join.kind,
    hasBodySlot: body.present,
    projection: projection.value,
    hasProjectionSlot: projection.present,
    wrapped,
    freeTokens,
  };
}

export function scoreExpressionShape(shape = {}, queryShape = {}) {
  if (!shape || !queryShape) return 0;
  let hits = 0;

  if (queryShape.subject && prefixOrEqual(shape.subject, queryShape.subject)) hits += 4;
  if (queryShape.hasModeSlot) {
    hits += queryShape.mode
      ? (prefixOrEqual(shape.mode, queryShape.mode) ? 4 : 0)
      : (shape.mode ? 1 : 0);
  }
  if (queryShape.hasBodySlot) {
    if (!queryShape.parts.length) {
      hits += shape.parts?.length ? 1 : 0;
    } else {
      for (const part of queryShape.parts) {
        if ((shape.parts || []).some((owned) => prefixOrEqual(owned, part))) hits += 3;
      }
    }
  }
  if (queryShape.hasProjectionSlot) {
    hits += queryShape.projection
      ? (prefixOrEqual(shape.projection, queryShape.projection) ? 3 : 0)
      : (shape.projection ? 1 : 0);
  }

  for (const token of queryShape.freeTokens || []) {
    const slots = [shape.subject, shape.mode, shape.projection, ...(shape.parts || [])];
    if (slots.some((slot) => prefixOrEqual(slot, token))) hits += 2;
  }

  return hits;
}

export function readBodyJoins(body = '') {
  const raw = trim(body);
  if (!raw) return { kind: JOIN_KINDS.none, parts: [] };
  if (raw.includes('~>')) {
    return { kind: JOIN_KINDS.project, parts: raw.split(/\s*~>\s*/).map(trim).filter(Boolean) };
  }
  if (raw.includes(';')) {
    return { kind: JOIN_KINDS.ordinal, parts: raw.split(';').map(trim).filter(Boolean) };
  }
  if (raw.includes(',')) {
    return { kind: JOIN_KINDS.common, parts: raw.split(',').map(trim).filter(Boolean) };
  }
  if (TIGHT_IDENT.test(raw)) {
    return { kind: JOIN_KINDS.ident, parts: raw.split('.').map(trim).filter(Boolean) };
  }
  return { kind: JOIN_KINDS.none, parts: [raw] };
}

/**
 * What `parse()` tokenized. Site join is a check against these tokens.
 * `;` is site ordinal until the default lexer emits it as a connector.
 */
export function kernelJoinFromTokens(tokens = []) {
  const sig = (Array.isArray(tokens) ? tokens : []).filter(
    (token) => token && token.type && token.type !== 'WHITESPACE' && token.type !== 'EOF',
  );
  if (!sig.length) return { kind: JOIN_KINDS.none, parts: [] };

  const types = sig.map((token) => token.type);
  const values = sig.map((token) => String(token.value || ''));
  const identParts = sig
    .filter((token) => token.type === 'IDENTIFIER')
    .map((token) => String(token.value || '').trim())
    .filter(Boolean);

  for (let i = 1; i < sig.length - 1; i += 1) {
    if (
      sig[i].type === 'OPERATOR'
      && values[i] === '.'
      && sig[i - 1].type === 'CONTAINER_CLOSE'
      && sig[i + 1].type === 'CONTAINER_OPEN'
    ) {
      return { kind: JOIN_KINDS.crawl, parts: identParts };
    }
  }
  if (types.includes('COMMA')) {
    return { kind: JOIN_KINDS.common, parts: identParts };
  }
  if (sig.some((token) => token.type === 'CONNECTOR' && token.value === ';')) {
    return { kind: JOIN_KINDS.ordinal, parts: identParts };
  }
  if (values.some((value, i) => value === '~' && values[i + 1] === '>')) {
    return { kind: JOIN_KINDS.project, parts: identParts };
  }
  const dotted = identParts.find((part) => part.includes('.'));
  if (dotted && TIGHT_IDENT.test(dotted)) {
    return { kind: JOIN_KINDS.ident, parts: dotted.split('.').filter(Boolean) };
  }
  if (identParts.length === 1) {
    return { kind: JOIN_KINDS.none, parts: identParts };
  }
  return { kind: JOIN_KINDS.none, parts: identParts };
}

/**
 * Read join chains that are not one dotted identifier inside a brace.
 *
 * `{mill}.{laminate}.{cure}` is a crawl: each unit is a complete practice.
 * `scrap ~> mill ~> temper` is potential then concept-edge — a path, not nested-about.
 * `{cullet,grog,fiber}` is common. `{mill.laminate.cure}` is one identifier.
 */
export function readJoinChain(source = '') {
  const raw = trim(source);
  if (!raw) return { kind: JOIN_KINDS.none, parts: [], raw };
  const compact = raw.replace(/\s+/g, '');
  if (BRACED_CRAWL.test(compact)) {
    const parts = [...raw.matchAll(/\{([^{}]+)\}/g)].map((match) => trim(match[1])).filter(Boolean);
    return { kind: JOIN_KINDS.crawl, parts, raw };
  }
  if (raw.includes('~>') && !raw.includes('{')) {
    return { kind: JOIN_KINDS.project, parts: raw.split(/\s*~>\s*/).map(trim).filter(Boolean), raw };
  }
  const body = captureGroup(raw, '{', '}');
  if (body.present) {
    const inner = readBodyJoins(body.value);
    return { ...inner, raw };
  }
  return { ...readBodyJoins(raw), raw };
}

export function shapeFromExpression(expression = '') {
  const raw = String(expression || '').trim();
  const chain = readJoinChain(raw);
  const match = raw.match(/^([^[{<]+)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?(?:<([^>]*)>)?/);
  if (!match) {
    return { subject: trim(raw), mode: '', parts: chain.parts, projection: '', join: chain.kind };
  }
  const body = readBodyJoins(match[3] || '');
  const parts = chain.kind === JOIN_KINDS.crawl || chain.kind === JOIN_KINDS.project
    ? chain.parts
    : body.parts;
  return {
    subject: trim(match[1]),
    mode: trim(match[2]),
    parts,
    projection: trim(match[4]),
    join: chain.kind === JOIN_KINDS.none ? body.kind : chain.kind,
  };
}

export const PRECIPITATES = Object.freeze({
  motion: 'motion',
  cauldron: 'cauldron',
  material: 'material',
});

function readDataset(el, key) {
  return el?.dataset?.[key] || '';
}

function nestDepth(element) {
  let depth = 0;
  let node = element;
  while (node && node.parentElement) {
    node = node.parentElement;
    if (node.matches?.('.spw-frame, .frame-card, [data-spw-form="brace"]')) depth += 1;
    if (depth >= 4) break;
  }
  return depth;
}

/**
 * One host, three precipitates. Read authored hydration without a second engine.
 * Motion is leftover room; cauldron is the gathered string; material is inspectable charge.
 */
export function readSpwHydration(element) {
  if (!element) return null;
  const closest = typeof element.closest === 'function'
    ? (sel) => element.closest(sel)
    : () => element;
  const host = closest('[data-spw-semantic-expression], [data-spw-gravity], [data-spw-charge], [data-spw-join], [data-spw-living-term], [data-spw-operator]')
    || element;
  const expression = readDataset(host, 'spwSemanticExpression');
  const shape = expression ? parseExpressionQuery(expression) : {
    raw: '',
    subject: '',
    mode: '',
    parts: [],
    join: JOIN_KINDS.none,
    projection: '',
  };
  const gravityHost = closest('[data-spw-gravity]') || host;
  const charge = readDataset(host, 'spwCharge') || readDataset(host, 'spwChargePhase');
  const join = readDataset(host, 'spwJoin') || shape.join || JOIN_KINDS.none;
  return {
    expression,
    join,
    shape,
    concept: readDataset(host, 'spwConcept'),
    charge,
    gravity: {
      vertical: readDataset(gravityHost, 'spwVerticalGravity'),
      edge: readDataset(gravityHost, 'spwEdgeGravity'),
      open: readDataset(gravityHost, 'spwOpenDirection'),
      variant: readDataset(gravityHost, 'spwSpaceVariant'),
    },
    region: closest('[data-spw-region]')?.dataset?.spwRegion || '',
    nest: nestDepth(host),
    precipitates: {
      [PRECIPITATES.motion]: Boolean(
        readDataset(gravityHost, 'spwGravity')
        || readDataset(gravityHost, 'spwVerticalGravity')
        || readDataset(gravityHost, 'spwEdgeGravity'),
      ),
      [PRECIPITATES.cauldron]: Boolean(expression || readDataset(host, 'spwLivingTerm') || readDataset(host, 'spwConcept')),
      [PRECIPITATES.material]: Boolean(charge),
    },
  };
}

export function bestExpressionMatch(expressions = [], query = '') {
  const queryShape = typeof query === 'string' ? parseExpressionQuery(query) : query;
  if (!queryShape?.raw) return null;

  let best = null;
  for (const expression of expressions) {
    const text = String(expression || '').trim();
    if (!text) continue;
    const hits = scoreExpressionShape(shapeFromExpression(text), queryShape);
    if (!hits) continue;
    if (!best || hits > best.hits) best = { expression: text, hits };
  }
  return best;
}
