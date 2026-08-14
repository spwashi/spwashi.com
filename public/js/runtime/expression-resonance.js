/**
 * Expression resonance — authored Spw with consequences.
 *
 * 441 `data-spw-semantic-expression` values are declared across the routes and
 * until now every one was inert: valid Spw that no runtime had ever read as
 * anything but a string. scripts/build-expression-manifest.mjs parses them with
 * the workbench parser at build time, so this module receives structure without
 * shipping a parser or doing any parsing itself.
 *
 * The consequence is inductance, which @electrostatic_affordances already
 * names: "Cluster + :has([data-spw-operator=X]). Kin of the same terminal share
 * momentum." Two expressions are kin when they share a subject, a mode, or a
 * body part. That relation is dense — 423 of 441 expressions have at least one
 * kin, over 205 subjects, 292 modes and 501 parts — so touching one element can
 * light every other element on the page that is structurally related to it,
 * and the relation was authored rather than invented here.
 *
 * Two timescales, deliberately different in kind:
 *
 *   resonance    transient. Hovering or focusing an expression raises its kin
 *                for as long as attention is there, then it decays. Pulse-
 *                shaped, per @attribute_governance rhythm.
 *   salience     accumulated. Every encounter deposits into a per-token store,
 *                so the tokens a reader actually travels grow warmer across
 *                visits. Residue-shaped, persisted, ledger-backed.
 *
 * Keeping those apart matters: @interaction_microstates#reward_contract's
 * boundary rule is that potential display is pulse-shaped and reward display is
 * residue-shaped, and that a preview must not be promoted into residue without
 * a deliberate landing. Hover previews kinship; it does not bank it. Only a
 * real encounter — dwell past a threshold, or a capture — deposits salience.
 *
 * Cost discipline: the kin index is built once on mount in a single pass over
 * the manifest, element lookup is a prebuilt Map, and nothing here reads layout.
 * Writes are attributes and custom properties on a bounded kin set, never a
 * full-document sweep.
 */

import { readJson, writeJson } from '/public/js/kernel/storage-utils.js';

const STORAGE_KEY = 'spw-expression-salience';

const ATTR = Object.freeze({
  expression: 'data-spw-semantic-expression',
  kin: 'data-spw-expression-kin',
  source: 'data-spw-expression-resonating',
  salience: 'data-spw-expression-salience',
  resonance: '--spw-expression-resonance',
});

/** Dwell past this reads as an encounter rather than a glance. */
const ENCOUNTER_MS = 700;
/** Salience bands. Discrete so CSS can key off them without parsing numbers. */
const SALIENCE_BANDS = [0, 2, 5, 12, 30];

let manifest = null;
let kinIndex = null;
let elementsByExpression = null;
let salience = null;
let lit = [];
let dwellTimer = null;
let cleanup = null;

function readSalience() {
  if (salience) return salience;
  const stored = readJson(STORAGE_KEY, null, { requireObject: true });
  salience = stored && typeof stored === 'object' ? stored : {};
  return salience;
}

/** Which band a token has reached. Discrete, so a hot token reads as hot. */
function salienceBand(token) {
  const count = readSalience()[token] || 0;
  let band = 0;
  for (let i = SALIENCE_BANDS.length - 1; i >= 0; i -= 1) {
    if (count >= SALIENCE_BANDS[i]) { band = i; break; }
  }
  return band;
}

/**
 * Invert the manifest into token → expressions. One pass over 441 entries at
 * mount; the build step deliberately does not ship this, because precomputing
 * it cost more in transfer than it saved in work.
 */
function buildKinIndex(entries) {
  const index = new Map();
  const add = (token, expression) => {
    if (!token) return;
    const key = token;
    if (!index.has(key)) index.set(key, new Set());
    index.get(key).add(expression);
  };
  for (const [expression, shape] of entries) {
    add(shape.subject, expression);
    add(shape.mode, expression);
    for (const part of shape.parts || []) add(part, expression);
  }
  // A token only one expression carries is a name, not kinship.
  for (const [token, set] of index) {
    if (set.size < 2) index.delete(token);
  }
  return index;
}

/** Every element on this page that declares an expression, grouped by it. */
function indexElements(root = document) {
  const map = new Map();
  for (const node of root.querySelectorAll(`[${ATTR.expression}]`)) {
    const expression = node.getAttribute(ATTR.expression);
    if (!expression) continue;
    if (!map.has(expression)) map.set(expression, []);
    map.get(expression).push(node);
  }
  return map;
}

/** Kin of an expression, with the token that relates them. */
export function kinOf(expression) {
  const shape = manifest?.[expression];
  if (!shape || !kinIndex) return [];

  const found = new Map();
  const relate = (token, relation) => {
    const set = token && kinIndex.get(token);
    if (!set) return;
    for (const other of set) {
      if (other === expression || found.has(other)) continue;
      found.set(other, { token, relation });
    }
  };
  // Subject first: sharing what a thing *is* binds tighter than sharing a part.
  relate(shape.subject, 'subject');
  relate(shape.mode, 'mode');
  for (const part of shape.parts || []) relate(part, 'part');

  return [...found.entries()].map(([other, meta]) => ({ expression: other, ...meta }));
}

function clearResonance() {
  for (const node of lit) {
    node.removeAttribute(ATTR.kin);
    node.style.removeProperty('--spw-expression-resonance');
  }
  lit = [];
  document.querySelectorAll(`[${ATTR.source}]`).forEach((node) => {
    node.removeAttribute(ATTR.source);
  });
}

/**
 * Light the kin of one expression. Transient: this is potential display, so it
 * settles on leave and deposits nothing.
 */
function resonate(expression, sourceNode) {
  clearResonance();
  const kin = kinOf(expression);
  if (!kin.length) return 0;

  sourceNode?.setAttribute(ATTR.source, 'source');

  for (const { expression: other, relation } of kin) {
    for (const node of elementsByExpression.get(other) || []) {
      node.setAttribute(ATTR.kin, relation);
      // Subject kinship reads strongest, part kinship faintest — the same
      // ordering kinOf resolves in, made visible rather than merely internal.
      const strength = relation === 'subject' ? 1 : relation === 'mode' ? 0.7 : 0.45;
      // Literal so the custom property stays greppable from CSS and visible to
      // the runtime contract checker.
      node.style.setProperty('--spw-expression-resonance', String(strength));
      lit.push(node);
    }
  }
  return lit.length;
}

/**
 * Bank an encounter. Only called after real dwell, never on hover alone — a
 * preview promoted into residue is the boundary violation reward_contract names.
 */
function depositSalience(expression) {
  const shape = manifest?.[expression];
  if (!shape) return;
  const store = readSalience();
  for (const token of [shape.subject, shape.mode, ...(shape.parts || [])]) {
    if (!token) continue;
    store[token] = (store[token] || 0) + 1;
  }
  try {
    writeJson(STORAGE_KEY, store);
  } catch {
    // Storage is optional; losing it costs warmth, not correctness.
  }
  paintSalience(expression);
}

/**
 * Bank the expressions a reader gathered into the cauldron.
 *
 * Gathering is the strongest signal the site gets. A fragment reaches the
 * cauldron only after someone crossed a page, recognised something worth
 * keeping, and took it — navigation, recognition and intent in one act. Dwell
 * is a proxy for that; gathering is the thing itself.
 *
 * So a gathered expression deposits at a higher weight than dwell, and its kin
 * receive a share. That share is the reward for learning the site rather than
 * for visiting it: composing from two expressions that turn out to be kin warms
 * a whole neighbourhood, and a reader who has learned which fragments belong
 * together sees more of the page remember them.
 *
 * Consumes `cauldron:updated`, which already carries the full item list. The
 * mix itself emits nothing today — `mixIngredients()` builds a functional
 * payload described as "available for agents/spells" and the call site drops
 * it. When that byproduct is emitted, this is where it should land.
 */
const GATHER_WEIGHT = 3;
const KIN_SHARE = 1;

export function depositGathered(items = []) {
  if (!manifest || !Array.isArray(items) || !items.length) return 0;
  const store = readSalience();
  let banked = 0;

  for (const item of items) {
    const expression = item?.semanticExpression || item?.expression;
    const shape = expression && manifest[expression];
    if (!shape) continue;

    for (const token of [shape.subject, shape.mode, ...(shape.parts || [])]) {
      if (!token) continue;
      store[token] = (store[token] || 0) + GATHER_WEIGHT;
    }
    banked += 1;

    // Kin share: the neighbourhood a gathered fragment belongs to warms with it,
    // so recognising a relation pays more than collecting in isolation.
    for (const { token } of kinOf(expression)) {
      if (token) store[token] = (store[token] || 0) + KIN_SHARE;
    }
  }

  if (!banked) return 0;
  try {
    writeJson(STORAGE_KEY, store);
  } catch {
    // Storage optional; a lost deposit costs warmth, not correctness.
  }
  for (const expression of elementsByExpression?.keys() || []) paintSalience(expression);
  return banked;
}

/** Project accumulated warmth onto the elements carrying a token. */
function paintSalience(expression) {
  const shape = manifest?.[expression];
  if (!shape) return;
  const band = Math.max(
    salienceBand(shape.subject),
    salienceBand(shape.mode),
    ...(shape.parts || []).map(salienceBand),
    0,
  );
  for (const node of elementsByExpression.get(expression) || []) {
    if (band > 0) node.setAttribute(ATTR.salience, String(band));
    else node.removeAttribute(ATTR.salience);
  }
}

let projectionSeeds = null;

export function getProjectionSeeds() {
  return projectionSeeds;
}

export async function initExpressionResonance(ctx = {}) {
  if (typeof document === 'undefined') return () => {};

  try {
    const module = await import('/public/js/generated/spw-expressions.js');
    manifest = module.SPW_EXPRESSION_MANIFEST;
    projectionSeeds = module.SPW_PROJECTION_SEEDS || null;
  } catch {
    // No manifest built — the page keeps working, which is the whole bargain.
    return () => {};
  }

  const entries = Object.entries(manifest);
  kinIndex = buildKinIndex(entries);
  elementsByExpression = indexElements();
  if (!elementsByExpression.size) return () => {};

  // Paint whatever warmth this reader has already accumulated, before any
  // interaction — returning to a page you have travelled should look travelled.
  for (const expression of elementsByExpression.keys()) paintSalience(expression);

  const onEnter = (event) => {
    const host = event.target?.closest?.(`[${ATTR.expression}]`);
    if (!host) return;
    const expression = host.getAttribute(ATTR.expression);
    if (!expression) return;

    resonate(expression, host);
    clearTimeout(dwellTimer);
    dwellTimer = setTimeout(() => depositSalience(expression), ENCOUNTER_MS);
  };

  const onLeave = () => {
    clearTimeout(dwellTimer);
    clearResonance();
  };

  document.addEventListener('pointerover', onEnter, { passive: true });
  document.addEventListener('pointerout', onLeave, { passive: true });
  document.addEventListener('focusin', onEnter, { passive: true });
  document.addEventListener('focusout', onLeave, { passive: true });

  // Gathering banks harder than dwell. The cauldron already broadcasts its full
  // item list, so the loop closes without the mix having to be touched.
  const bus = ctx.bus || globalThis.__SPW_SITE__?.bus;
  const offGathered = bus?.on?.('cauldron:updated', (event) => {
    depositGathered(event?.detail?.items || event?.items || []);
  }) || null;

  cleanup = () => {
    offGathered?.();
    clearTimeout(dwellTimer);
    clearResonance();
    document.removeEventListener('pointerover', onEnter);
    document.removeEventListener('pointerout', onLeave);
    document.removeEventListener('focusin', onEnter);
    document.removeEventListener('focusout', onLeave);
  };
  return cleanup;
}

/** What this page's expressions are related to, and how warm each token is. */
export function describeExpressionField() {
  if (!manifest) return { ready: false };
  return {
    ready: true,
    expressions: Object.keys(manifest).length,
    onThisPage: elementsByExpression?.size || 0,
    kinTokens: kinIndex?.size || 0,
    salience: readSalience(),
  };
}

export const EXPRESSION_RESONANCE_CONTRACT = Object.freeze({
  attrs: ATTR,
  storageKey: STORAGE_KEY,
  encounterMs: ENCOUNTER_MS,
  salienceBands: SALIENCE_BANDS,
  rule: 'hover previews kinship (pulse); dwell banks salience (residue); never the reverse',
});

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'expression-resonance',
  mount: (ctx) => initExpressionResonance(ctx),
  describes: 'expression[kin]{subject.mode.part}<resonance>',
  updates: [
    'flourish:data-spw-expression-kin',
    'flourish:data-spw-expression-resonating',
    'residue:data-spw-expression-salience',
    'measure:--spw-expression-resonance',
  ],
  timingArc: 'idle-semantic-reinforcement',
  effectScope: 'local-dom flourish residue storage',
});
