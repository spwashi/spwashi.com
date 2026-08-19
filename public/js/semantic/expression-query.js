/**
 * Partial expression search — match a typed fragment against authored shapes.
 *
 * The browser never parses Spw. It matches slots the build already named:
 * subject, [mode], {parts}, <projection>. Unclosed fragments count:
 * `home[` is a subject plus an open mode slot; `{open` is a part prefix.
 */

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
  const parts = body.value
    ? body.value.split(/[.~]/).map((part) => part.trim()).filter(Boolean)
    : [];
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

export function shapeFromExpression(expression = '') {
  const match = String(expression || '').match(/^([^[{<]+)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?(?:<([^>]*)>)?/);
  if (!match) return { subject: trim(expression), mode: '', parts: [], projection: '' };
  return {
    subject: trim(match[1]),
    mode: trim(match[2]),
    parts: String(match[3] || '').split(/[.~]/).map((part) => part.trim()).filter(Boolean),
    projection: trim(match[4]),
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
