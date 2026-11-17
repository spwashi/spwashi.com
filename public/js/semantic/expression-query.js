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

// Workbench relation: extension. Readings for what the workbench lexer leaves to connectors: ~> project, ; ordinal, , common and . ident inside a body;
// ~ induct, & subject, ^ project and @ perspective between two lines (COMPOUND_JOIN_OPERATORS); the five valence words as charge.
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

/** Valence words the workbench lexes as modifiers. A leading chain is charge, not the subject. */
const VALENCE_WORD = 'bone|boon|bane|bonk|honk';
/* Charge, a leading scene, and the word, read as they always were; the brace
   pairs after the word are read by the containers that own them, below. */
const EXPRESSION_LEAD = new RegExp(
  `^(?:((?:${VALENCE_WORD})(?:\\.(?:${VALENCE_WORD}))*)(?:\\s+|(?=\\[)))?`
  + '(?:\\(([^)]*)\\))?'
  + '([^[{<(]*)',
);

/* Each brace pair names its slot wherever it sits (the creator, 2026-11-05):
   word[mode]{body}(scene)<projection> and word<concept>(scene)[mode]{body}
   read the same slots, and {chronicles} <of> (narnia) has no word at all. */
const CONTAINER_SLOT = Object.freeze({ '[': 'mode', '{': 'body', '(': 'scope', '<': 'projection' });
const CONTAINER_CLOSE = Object.freeze({ '[': ']', '{': '}', '(': ')', '<': '>' });
const QUOTES = new Set(['"', "'", '`']);
const LEADING_PARTICLE_RE = /^(#>|#:|#!|~#|[~?!*.^#@&=%$]+)\s*/;

/** Find the matching closer for `open` at `openIndex`, respecting nested pairs and quotes. */
export function findBalancedClose(source = '', openIndex = 0, openChar = '{', closeChar = '}') {
  let depth = 0;
  let quote = '';
  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === quote) quote = '';
      continue;
    }
    if (QUOTES.has(ch)) {
      quote = ch;
      continue;
    }
    if (ch === openChar) depth += 1;
    else if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Extract perspective holder (`maya@`, `viewer@subject`) from a subject nucleus. */
export function parseSubjectPersona(subject = '') {
  const clean = String(subject || '').trim().replace(LEADING_PARTICLE_RE, '');
  const at = clean.indexOf('@');
  if (at < 0) return { persona: '', target: clean, perspective: false };
  const persona = clean.slice(0, at).trim();
  const target = clean.slice(at + 1).trim();
  return { persona, target, perspective: true };
}

/** The brace pairs after the word, each slot once, in the order written; `end` is where reading stopped. */
export function readContainers(rest = '', { balanced = false } = {}) {
  const found = {};
  const order = [];
  let at = 0;
  for (;;) {
    while (at < rest.length && /\s/.test(rest[at])) at += 1;
    const open = rest[at];
    const slot = CONTAINER_SLOT[open];
    if (!slot || slot in found) break;
    if (balanced) {
      const close = findBalancedClose(rest, at, open, CONTAINER_CLOSE[open]);
      if (close < 0) break;
      found[slot] = rest.slice(at + 1, close);
      order.push(slot);
      at = close + 1;
      continue;
    }
    const close = rest.indexOf(CONTAINER_CLOSE[open], at + 1);
    if (close < 0) break;
    const held = rest.slice(at + 1, close);
    // A pair that opens again inside is nesting, not one slot: stop, as a reader would.
    if (held.includes(open)) break;
    found[slot] = held;
    order.push(slot);
    at = close + 1;
  }
  return { found, order, end: at };
}

/** Tap previews, a hold sustains, a trace charges. These are existing charge states. */
export const GESTURE_CHARGE = Object.freeze({
  tap: 'preview',
  hold: 'sustained',
  swipe: 'charging',
});

/** Resonance altitudes, strongest kinship first. A swipe that stays on one host walks this list. */
export const RESONANCE_LAYERS = Object.freeze([
  'subject', 'mode', 'part', 'scope', 'charge', 'projection',
]);

/** Layers this shape can actually show. A one-letter scope stays stored and is not a layer. */
export function expressionLayers(shape = {}) {
  const layers = [];
  if (shape.subject) layers.push('subject');
  if (shape.mode) layers.push('mode');
  if ((shape.parts || []).some(Boolean)) layers.push('part');
  if (shape.scope && String(shape.scope).length > 1) layers.push('scope');
  if ((shape.charge || []).length) layers.push('charge');
  if (shape.projection) layers.push('projection');
  return layers;
}

/**
 * Authored slots, including the ones a flatter regex used to drop.
 * charge is a leading valence chain. scope is a scene, before the subject or after the body.
 * A capsule after the scene stays the projection.
 */
export function readExpressionSlots(expression = '') {
  const raw = trim(expression);
  const match = raw.match(EXPRESSION_LEAD);
  if (!match) {
    return { charge: [], scope: '', subject: raw, mode: '', body: '', projection: '' };
  }
  const charge = match[1] ? match[1].split('.').filter(Boolean) : [];
  const leadingScope = trim(match[2]);
  const { found } = readContainers(raw.slice(match[0].length));
  return {
    charge,
    scope: trim(found.scope) || leadingScope,
    subject: trim(match[3]),
    mode: trim(found.mode),
    body: found.body || '',
    projection: trim(found.projection),
  };
}

/**
 * Where a line keeps its slots: whether its scene leads the word, and the brace
 * pairs after the word in the order written. A line written back in this order
 * reads as its author wrote it.
 */
export function readSlotOrder(expression = '') {
  const raw = trim(expression);
  const match = raw.match(EXPRESSION_LEAD);
  if (!match) return { sceneFirst: false, order: [] };
  const { order } = readContainers(raw.slice(match[0].length));
  return { sceneFirst: Boolean(trim(match[2])) && !order.includes('scope'), order };
}

const BRACED_CRAWL = /^(?:\{[^{}]+\}\s*\.\s*)+\{[^{}]+\}$/;

/**
 * Declared compound bonds — .spw/conventions/compound-expressions.spw
 * #the_grammar_already_holds verified these against the parser: `A ~ B`
 * is induction, `A & B` names B as A's subject, `A ^ B` is a project-join,
 * `viewer@subject` regards the subject from the viewer's perspective. `;` is excluded on purpose — it is a body-
 * internal ordinal separator (readBodyJoins), not an infix operator
 * between two whole operand expressions.
 */
export const COMPOUND_JOIN_OPERATORS = Object.freeze({
  '~': 'induct',
  '&': 'subject',
  '^': 'project',
  '@': 'perspective',
});

/** `~` immediately followed by `>` is the project-join body form
 *  (`scrap ~> mill`), already read by readBodyJoins/readJoinChain — not
 *  a compound operator between two operand expressions. */
const COMPOUND_JOIN = /^(.+?)\s+([~&^@])\s+(.+)$/;

function trim(value = '') {
  return String(value || '').trim();
}

function prefixOrEqual(hay = '', needle = '') {
  const left = trim(hay).toLowerCase();
  const right = trim(needle).toLowerCase();
  if (!right) return false;
  return left === right || left.startsWith(right);
}

function captureGroup(raw, open, close, { balanced = false } = {}) {
  const start = raw.indexOf(open);
  if (start < 0) return { present: false, value: '' };
  if (balanced) {
    const balancedEnd = findBalancedClose(raw, start, open, close);
    return {
      present: true,
      value: (balancedEnd < 0 ? raw.slice(start + open.length) : raw.slice(start + open.length, balancedEnd)).trim(),
    };
  }
  const rest = raw.slice(start + open.length);
  const end = rest.indexOf(close);
  return {
    present: true,
    value: (end < 0 ? rest : rest.slice(0, end)).trim(),
  };
}

export function parseExpressionQuery(query = '') {
  const raw = String(query || '').trim();
  const mode = captureGroup(raw, '[', ']', { balanced: true });
  const body = captureGroup(raw, '{', '}', { balanced: true });
  const scene = captureGroup(raw, '(', ')', { balanced: true });
  const projection = captureGroup(raw, '<', '>', { balanced: true });
  const chargePrefix = raw.match(/^(?:bone|boon|bane|bonk|honk)(?:\.(?:bone|boon|bane|bonk|honk))*(?:\s+|(?=\[))/);
  const afterCharge = chargePrefix ? raw.slice(chargePrefix[0].length) : raw;
  const particleMatch = afterCharge.match(LEADING_PARTICLE_RE);
  const afterParticle = particleMatch ? afterCharge.slice(particleMatch[0].length) : afterCharge;
  const subjectMatch = afterParticle.match(/^([A-Za-z_][\w-]*(?:@[A-Za-z0-9_-]*)?)/);
  const subject = subjectMatch?.[1] || '';
  const { persona, target: personaTarget, perspective } = parseSubjectPersona(subject || afterCharge);
  const charge = chargePrefix ? chargePrefix[0].trim().split('.').filter(Boolean) : [];
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
    persona,
    personaTarget,
    perspective: perspective || Boolean(particleMatch?.[1]?.includes('@')),
    operator: particleMatch?.[1] || (perspective ? '@' : ''),
    charge,
    mode: mode.value,
    hasModeSlot: mode.present,
    parts,
    join: join.kind,
    scope: scene.value,
    hasScopeSlot: scene.present,
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

  const parsedSubject = parseSubjectPersona(shape.subject || '');
  if (queryShape.subject && prefixOrEqual(shape.subject, queryShape.subject)) hits += 4;
  else if (queryShape.persona && prefixOrEqual(parsedSubject.persona, queryShape.persona)) hits += 3;
  else if (queryShape.personaTarget && prefixOrEqual(parsedSubject.target, queryShape.personaTarget)) hits += 2;
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
    const slots = [
      shape.subject,
      parsedSubject.persona,
      parsedSubject.target,
      shape.mode,
      shape.scope,
      shape.projection,
      ...(shape.parts || []),
      ...(shape.charge || []),
    ];
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

/**
 * `A ~ B` (or `& ^ @`) split into its two operand expressions plus the bond
 * the operator names. Null for anything that is not a two-operand compound —
 * including a bare project-join body (`scrap ~> mill`), which COMPOUND_JOIN
 * does not match because `~` there is immediately followed by `>`, not
 * whitespace. compound-expressions.spw's own count (2026-08 vintage) found
 * 441 authored expressions and exactly 0 compound-joined; as of 2026-09 the
 * corpus has grown to 660 and still only 2 use this form — the manifest
 * builder read neither's second operand until this landed.
 */
export function readCompoundJoin(expression = '') {
  const raw = trim(expression);
  const match = raw.match(COMPOUND_JOIN);
  if (!match) return null;
  const [, left, operator, right] = match;
  if (!trim(left) || !trim(right)) return null;
  return {
    operator,
    bond: COMPOUND_JOIN_OPERATORS[operator] || 'unknown',
    left: trim(left),
    right: trim(right),
  };
}

export function shapeFromExpression(expression = '') {
  const raw = String(expression || '').trim();
  const compound = readCompoundJoin(raw);
  if (compound) {
    const leftShape = shapeFromExpression(compound.left);
    return {
      ...leftShape,
      compound: {
        operator: compound.operator,
        bond: compound.bond,
        right: shapeFromExpression(compound.right),
      },
    };
  }
  const chain = readJoinChain(raw);
  const slots = readExpressionSlots(raw);
  const body = readBodyJoins(slots.body);
  const parts = chain.kind === JOIN_KINDS.crawl || chain.kind === JOIN_KINDS.project
    ? chain.parts
    : body.parts;
  return {
    subject: slots.subject,
    mode: slots.mode,
    parts,
    projection: slots.projection,
    scope: slots.scope,
    charge: slots.charge,
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

const THEME_PROFILE_TERMS = Object.freeze({
  'neutral-paper': Object.freeze(['paper', 'neutral', 'default', 'reading', 'hearth', 'clear']),
  'oxide-ledger': Object.freeze(['ledger', 'oxide', 'records', 'archive', 'editorial', 'memory', 'audit', 'folio']),
  'electric-studio': Object.freeze(['studio', 'electric', 'weave', 'art', 'craft', 'canvas', 'visual', 'making', 'loom']),
  'ritual-vellum': Object.freeze(['ritual', 'vellum', 'season', 'myth', 'play', 'table', 'lore', 'costume']),
  'copper-brace': Object.freeze(['copper', 'brace', 'craft', 'grammar', 'syntax', 'material', 'design']),
  'glass-console': Object.freeze(['console', 'glass', 'workshop', 'runtime', 'systems', 'syntax', 'inspect', 'workbench', 'parser']),
  'banked-ember': Object.freeze(['ember', 'dark', 'charge', 'mood', 'night', 'contrast', 'depth', 'fire']),
});

const LENS_AFFINITY_TERMS = Object.freeze({
  reading: Object.freeze(['read', 'reading', 'editorial', 'narrative', 'prose', 'story', 'essay', 'person']),
  systems: Object.freeze(['systems', 'system', 'syntax', 'runtime', 'kernel', 'structure', 'build', 'software', 'workbench', 'parser', 'lattice', 'machine']),
  play: Object.freeze(['play', 'table', 'lore', 'game', 'boonhonk', 'magic', 'card', 'quest', 'world', 'rpg']),
  studio: Object.freeze(['studio', 'art', 'craft', 'design', 'folio', 'material', 'texture', 'canvas', 'visual', 'making']),
  syntax: Object.freeze(['syntax', 'grammar', 'parser', 'operator', 'operators', 'brace', 'token', 'ast']),
  inspect: Object.freeze(['inspect', 'audit', 'diagnostics', 'probe', 'parse', 'structure', 'measure', 'receipt']),
  workbench: Object.freeze(['workbench', 'parser', 'cli', 'lsp', 'seed', 'runtime', 'kernel']),
  memory: Object.freeze(['memory', 'archive', 'folio', 'history', 'lineage', 'session', 'record', 'return']),
  making: Object.freeze(['making', 'craft', 'build', 'workshop', 'practice', 'tool']),
  reuse: Object.freeze(['reuse', 'portable', 'bundle', 'library', 'compose', 'token']),
});

function splitProfileTerms(value = '') {
  const out = [];
  for (const raw of String(value || '').toLowerCase().split(/[^a-z0-9-]+/)) {
    const clean = raw.replace(/^-+|-+$/g, '');
    if (clean.length < 2) continue;
    out.push(clean);
    if (clean.includes('-')) {
      for (const part of clean.split('-')) {
        if (part.length >= 2) out.push(part);
      }
    }
  }
  return [...new Set(out)];
}

/**
 * Derive weighted direct and affinity term maps from an active site profile
 * (`lens`, `sustainedLens`, `themePack`, `colorMode`, `posture`, `flavor`, `authorMode`, `density`, `climate`, `stance`).
 */
export function buildActiveProfileTerms(profile = {}) {
  const direct = new Set();
  const affinity = new Set();
  const activeLens = String(profile.lens || profile.sustainedLens || '').trim().toLowerCase();
  const themePack = String(profile.themePack || '').trim().toLowerCase();
  const colorMode = String(profile.colorMode || '').trim().toLowerCase();
  const posture = String(profile.posture || profile.explorePosture || '').trim().toLowerCase();
  const flavor = String(profile.flavor || profile.pedagogicalFlavor || '').trim().toLowerCase();
  const authorMode = String(profile.authorMode || '').trim().toLowerCase();
  const density = String(profile.density || profile.semanticDensity || '').trim().toLowerCase();
  const climate = String(profile.climate || '').trim().toLowerCase();
  const stance = String(profile.stance || '').trim().toLowerCase();
  const operator = String(profile.operator || profile.carriedOperator || '').trim().toLowerCase();

  for (const val of [activeLens, posture, flavor, authorMode, climate, stance]) {
    if (!val) continue;
    direct.add(val);
    for (const term of splitProfileTerms(val)) direct.add(term);
    for (const aliased of LENS_AFFINITY_TERMS[val] || []) affinity.add(aliased);
  }
  if (colorMode && colorMode !== 'auto') direct.add(colorMode);
  if (density && density !== 'minimal') direct.add(density);
  if (themePack) {
    direct.add(themePack);
    for (const term of splitProfileTerms(themePack)) affinity.add(term);
    for (const mapped of THEME_PROFILE_TERMS[themePack] || []) affinity.add(mapped);
  }
  for (const term of LENS_AFFINITY_TERMS[activeLens] || []) affinity.add(term);
  for (const extra of profile.extraTerms || []) {
    for (const term of splitProfileTerms(extra)) direct.add(term);
  }

  return { direct, affinity, activeLens, themePack, colorMode, operator };
}

function collectShapeTokens(shape, target = { primary: new Set(), secondary: new Set() }) {
  if (!shape) return target;
  const { persona, target: personaTarget } = parseSubjectPersona(shape.subject || '');
  for (const val of [shape.subject, persona, personaTarget, shape.mode, shape.projection]) {
    for (const token of splitProfileTerms(val)) target.primary.add(token);
  }
  for (const val of [shape.scope, ...(shape.parts || []), ...(shape.charge || [])]) {
    for (const token of splitProfileTerms(val)) target.secondary.add(token);
  }
  if (shape.compound?.right) collectShapeTokens(shape.compound.right, target);
  return target;
}

/**
 * Evaluate whether an element's Spw expression / lens declarations match the active profile.
 * Pure, deterministic, and dependency-free for search, reach filtering, variant bias, and copy layers.
 */
export function matchesActiveProfile(candidate = '', profile = {}) {
  const terms = buildActiveProfileTerms(profile);
  const item = typeof candidate === 'string'
    ? { expression: candidate }
    : (candidate || {});

  const matchedTerms = [];
  const reasons = [];
  let score = 0;

  const lensPass = splitProfileTerms(item.lensPass);
  const copyLens = splitProfileTerms(item.copyLens);
  const variantTokens = splitProfileTerms(item.variant);
  const themeAffinity = splitProfileTerms(item.themeAffinity);
  const itemOperator = String(item.operator || '').trim().toLowerCase();

  for (const tok of lensPass) {
    if (tok === terms.activeLens || terms.direct.has(tok)) {
      score += 4;
      matchedTerms.push(tok);
      reasons.push('lens-pass');
    } else if (terms.affinity.has(tok)) {
      score += 2;
      matchedTerms.push(tok);
      reasons.push('lens-pass-affinity');
    }
  }

  for (const tok of copyLens) {
    if (tok === 'default' || tok === 'always') continue;
    if (tok === terms.themePack || tok === terms.activeLens || tok === terms.colorMode || terms.direct.has(tok)) {
      score += 4;
      matchedTerms.push(tok);
      reasons.push('copy-lens');
    } else if (terms.affinity.has(tok)) {
      score += 2;
      matchedTerms.push(tok);
      reasons.push('copy-affinity');
    }
  }

  for (const tok of variantTokens) {
    if (tok === terms.activeLens || terms.direct.has(tok)) {
      score += 3;
      matchedTerms.push(tok);
      reasons.push('variant');
    } else if (terms.affinity.has(tok)) {
      score += 1;
      matchedTerms.push(tok);
      reasons.push('variant-affinity');
    }
  }

  for (const tok of themeAffinity) {
    if (tok === terms.themePack || tok === terms.colorMode || terms.direct.has(tok)) {
      score += 3;
      matchedTerms.push(tok);
      reasons.push('theme');
    } else if (terms.affinity.has(tok)) {
      score += 1;
      matchedTerms.push(tok);
      reasons.push('theme-affinity');
    }
  }

  if (terms.operator && itemOperator && itemOperator === terms.operator) {
    score += 2;
    matchedTerms.push(itemOperator);
    reasons.push('operator');
  }

  const exprText = String(item.expression || '').trim();
  if (exprText) {
    const tokens = collectShapeTokens(shapeFromExpression(exprText));
    for (const tok of tokens.primary) {
      if (terms.direct.has(tok)) {
        score += 3;
        matchedTerms.push(tok);
        reasons.push('expr-slot');
      } else if (terms.affinity.has(tok)) {
        score += 2;
        matchedTerms.push(tok);
        reasons.push('expr-affinity');
      }
    }
    for (const tok of tokens.secondary) {
      if (terms.direct.has(tok)) {
        score += 2;
        matchedTerms.push(tok);
        reasons.push('expr-body');
      } else if (terms.affinity.has(tok)) {
        score += 1;
        matchedTerms.push(tok);
        reasons.push('expr-body-affinity');
      }
    }
  }

  return {
    matched: score > 0,
    score,
    reasons: [...new Set(reasons)],
    matchedTerms: [...new Set(matchedTerms)],
  };
}
