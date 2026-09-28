/**
 * Expression resonance — authored Spw with consequences.
 *
 * Authored `data-spw-semantic-expression` values were inert until the
 * build-time manifest. This module still does not parse: it reads structure
 * the build already named. The workbench parser is available on demand through
 * `__SPW_SITE__.parser.parse` for challenging a reading — not for kinship.
 * region-kin.js reads the same subject stems for #resonate jumps.
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

import { NATIVE_CONTROL_SELECTOR } from '/public/js/kernel/dom-contracts.js';
import { GESTURE_MEASURE } from '/public/js/kernel/gesture-measure.js';
import { readJson, writeJson } from '/public/js/kernel/storage-utils.js';
import { expressionLayers, GESTURE_CHARGE } from '/public/js/semantic/expression-query.js';

const STORAGE_KEY = 'spw-expression-salience';

const ATTR = Object.freeze({
  expression: 'data-spw-semantic-expression',
  kin: 'data-spw-expression-kin',
  source: 'data-spw-expression-resonating',
  salience: 'data-spw-expression-salience',
  resonance: '--spw-expression-resonance',
  join: 'data-spw-join',
  crawlOpen: 'data-spw-crawl-open',
  crawlClose: 'data-spw-crawl-close',
  crawlPole: 'data-spw-crawl-pole',
  projection: 'data-spw-projection',
  channel: 'data-spw-channel',
  layer: 'data-spw-expression-layer',
});

/** Dwell past this reads as an encounter rather than a glance. */
const ENCOUNTER_MS = 700;
/** A tap's layer stays lit this long on a coarse pointer, then settles. */
const LAYER_SETTLE_MS = 1400;
const SWIPE_MIN_PX = GESTURE_MEASURE.swipeMinPx;
const SWIPE_DOMINANCE = GESTURE_MEASURE.swipeDominance;
const HOLD_MS = GESTURE_MEASURE.holdMs;
const TRACE_CONTRACT = 'tap:prime hold:inspect swipe:cycle';
const TRACE_CARD = '[data-spw-kind="panel"], [data-spw-kind="frame"], .spw-panel, .spw-frame';
/** A tap collects the layer's tokens. Rarer layers are worth more than the address. */
const LAYER_WEIGHT = Object.freeze({
  subject: 1,
  mode: 1,
  part: 2,
  scope: 2,
  charge: 3,
  projection: 2,
});
/** Salience bands. Discrete so CSS can key off them without parsing numbers. */
const SALIENCE_BANDS = [0, 2, 5, 12, 30];

let manifest = null;
let kinIndex = null;
let elementsByExpression = null;
let livingByConcept = null;
let salience = null;
let lit = [];
let sourceRef = null;
let dwellTimer = null;
let settleTimer = null;
let layerCursor = 0;
let gesture = null;
let traceNodes = [];
let publishedNodes = [];
let contractTimer = null;
let cleanup = null;

const LIVING_SELECTOR = '[data-spw-living-term][data-spw-concept], .spw-living-term[data-spw-concept]';

function kinStrength(relation) {
  if (relation === 'subject') return 1;
  if (relation === 'mode') return 0.7;
  if (relation === 'projection') return 0.55;
  return 0.45;
}

function shapeTokens(shape) {
  if (!shape) return [];
  const tokens = [];
  if (shape.subject) tokens.push({ token: shape.subject, relation: 'subject' });
  if (shape.mode) tokens.push({ token: shape.mode, relation: 'mode' });
  for (const part of shape.parts || []) {
    if (part) tokens.push({ token: part, relation: 'part' });
  }
  if (shape.scope) tokens.push({ token: shape.scope, relation: 'scope' });
  for (const sign of shape.charge || []) {
    if (sign) tokens.push({ token: sign, relation: 'charge' });
  }
  if (shape.projection) tokens.push({ token: shape.projection, relation: 'projection' });
  return tokens;
}

function salienceTokens(shape) {
  if (!shape) return [];
  return [
    shape.subject,
    shape.mode,
    ...(shape.parts || []),
    shape.scope,
    ...(shape.charge || []),
    shape.projection,
  ].filter(Boolean);
}

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
    if (shape.scope && shape.scope.length > 1) add(shape.scope, expression);
    for (const sign of shape.charge || []) add(sign, expression);
    add(shape.projection, expression);
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

/** Living terms whose concept was authored — they join the field by that name. */
function indexLivingConcepts(root = document) {
  const map = new Map();
  for (const node of root.querySelectorAll(LIVING_SELECTOR)) {
    const concept = node.getAttribute('data-spw-concept');
    if (!concept) continue;
    if (!map.has(concept)) map.set(concept, []);
    map.get(concept).push(node);
  }
  return map;
}

function lightNode(node, relation, token, poles = {}) {
  if (!node) return;
  node.setAttribute(ATTR.kin, relation);
  node.style.setProperty('--spw-expression-resonance', String(kinStrength(relation)));
  if (relation === 'part' && token) {
    if (token === poles.openPart) node.setAttribute(ATTR.crawlPole, 'open');
    else if (token === poles.closePart) node.setAttribute(ATTR.crawlPole, 'close');
  }
  lit.push(node);
}

function lightLiving(token, relation, poles = {}, except = null) {
  if (!token || !livingByConcept) return;
  for (const node of livingByConcept.get(token) || []) {
    if (node === except) continue;
    lightNode(node, relation, token, poles);
  }
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
  if (shape.scope && shape.scope.length > 1) relate(shape.scope, 'scope');
  for (const sign of shape.charge || []) relate(sign, 'charge');
  relate(shape.projection, 'projection');

  return [...found.entries()].map(([other, meta]) => ({ expression: other, ...meta }));
}

function clearResonance() {
  for (const node of lit) {
    node.removeAttribute(ATTR.kin);
    node.removeAttribute(ATTR.crawlPole);
    node.style.removeProperty('--spw-expression-resonance');
    if (node.getAttribute('data-spw-kin-tab') === '1') {
      node.removeAttribute('tabindex');
      node.removeAttribute('data-spw-kin-tab');
    }
  }
  lit = [];
  sourceRef = null;
  document.querySelectorAll(`[${ATTR.source}]`).forEach((node) => {
    node.removeAttribute(ATTR.source);
    node.removeAttribute(ATTR.layer);
  });
  for (const node of traceNodes) {
    if (node.getAttribute('data-spw-charge') === 'preview'
      || node.getAttribute('data-spw-charge') === 'sustained'
      || node.getAttribute('data-spw-charge') === 'charging') {
      node.removeAttribute('data-spw-charge');
    }
    node.style.removeProperty('--spw-trace-shift');
  }
  traceNodes = [];
}

function rememberTrace(node) {
  if (!node || traceNodes.includes(node)) return;
  traceNodes.push(node);
}

function chargeWouldReflow(node, state) {
  if (state !== 'preview' && state !== 'arming') return false;
  if (node.matches?.('.spw-wisdom-deck')) return true;
  return Boolean(node.querySelector?.('.spw-wisdom-deck'));
}

function markCharge(node, state) {
  if (!node || chargeWouldReflow(node, state)) return;
  node.setAttribute('data-spw-charge', state);
  rememberTrace(node);
}

function publishContract(node) {
  if (!node || node.hasAttribute('data-spw-gesture-contract')) return;
  node.setAttribute('data-spw-gesture-contract', TRACE_CONTRACT);
  publishedNodes.push(node);
}

function clearPublished() {
  for (const node of publishedNodes) {
    if (node.getAttribute('data-spw-gesture-contract') === TRACE_CONTRACT) {
      node.removeAttribute('data-spw-gesture-contract');
    }
  }
  publishedNodes = [];
}

function placeSheen(card, clientX) {
  if (!card || gesture?.reduce) return;
  const rect = card.getBoundingClientRect();
  if (!rect.width) return;
  const shift = ((clientX - rect.left) / rect.width - 0.5) * 56;
  card.style.setProperty('--spw-trace-shift', `${shift.toFixed(1)}px`);
  markCharge(card, 'charging');
}

function noteTraceHost(host, expression) {
  if (!gesture || !host || !expression || gesture.seen.has(expression)) return;
  gesture.seen.add(expression);
  gesture.path.push(expression);
  if (!gesture.startExpr) {
    gesture.startExpr = expression;
    gesture.startHost = host;
  }
  if (gesture.endHost && gesture.endHost !== host) {
    gesture.endHost.setAttribute(ATTR.source, 'path');
    markCharge(gesture.endHost, 'charging');
  }
  gesture.endExpr = expression;
  gesture.endHost = host;
  host.setAttribute(ATTR.source, gesture.path.length === 1 ? 'start' : 'end');
  if (gesture.startHost && gesture.startHost !== host) {
    gesture.startHost.setAttribute(ATTR.source, 'start');
  }
  markCharge(host, 'charging');
}

function lightLayer(expression, sourceNode, layer) {
  const shape = manifest?.[expression];
  if (!shape) return;
  for (const { expression: other, relation, token } of kinOf(expression)) {
    if (layer && relation !== layer) continue;
    for (const node of elementsByExpression.get(other) || []) {
      lightNode(node, relation, token, {});
    }
  }
  for (const { token, relation } of shapeTokens(shape)) {
    if (layer && relation !== layer) continue;
    lightLiving(token, relation, {}, sourceNode);
  }
}

function kinTrail() {
  return [sourceRef, ...lit].filter((node) => node?.isConnected);
}

function cycleKin(step) {
  const trail = kinTrail();
  if (trail.length < 2) return false;
  const active = document.activeElement;
  let index = trail.indexOf(active);
  if (index < 0) index = 0;
  const next = trail[(index + step + trail.length) % trail.length];
  if (!(next instanceof HTMLElement)) return false;
  if (next.tabIndex < 0 && !next.hasAttribute('tabindex')) {
    next.setAttribute('data-spw-kin-tab', '1');
    next.tabIndex = -1;
  }
  const reduce = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  next.focus({ preventScroll: Boolean(reduce) });
  if (!reduce) next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  return true;
}

function onKinKey(event) {
  if (event.key !== '[' && event.key !== ']') return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const tag = event.target?.tagName;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || event.target?.isContentEditable) return;
  const inField = event.target?.closest?.(`[${ATTR.source}], [${ATTR.kin}]`);
  if (!inField || !lit.length) return;
  event.preventDefault();
  cycleKin(event.key === ']' ? 1 : -1);
}

/**
 * Light the kin of one expression. Transient: this is potential display, so it
 * settles on leave and deposits nothing.
 */
function layersFor(expression) {
  return expressionLayers(manifest?.[expression]);
}

function activeLayer(expression) {
  const layers = layersFor(expression);
  if (!layers.length) return '';
  const index = ((layerCursor % layers.length) + layers.length) % layers.length;
  return layers[index];
}

function resonate(expression, sourceNode, layer = '') {
  clearResonance();
  const shape = manifest?.[expression];
  if (!shape) return 0;

  sourceNode?.setAttribute(ATTR.source, 'source');
  if (layer) sourceNode?.setAttribute(ATTR.layer, layer);
  sourceRef = sourceNode || null;
  const sourceJoin = sourceNode?.getAttribute?.(ATTR.join)
    || sourceNode?.closest?.(`[${ATTR.join}]`)?.getAttribute(ATTR.join);
  const sourceParts = shape.parts || [];
  const poles = {
    openPart: sourceJoin === 'crawl' ? (sourceParts[0] || '') : '',
    closePart: sourceJoin === 'crawl' && sourceParts.length > 1 ? sourceParts[sourceParts.length - 1] : '',
  };

  for (const { expression: other, relation, token } of kinOf(expression)) {
    if (layer && relation !== layer) continue;
    for (const node of elementsByExpression.get(other) || []) {
      lightNode(node, relation, token, poles);
    }
  }
  for (const { token, relation } of shapeTokens(shape)) {
    if (layer && relation !== layer) continue;
    lightLiving(token, relation, poles, sourceNode);
  }
  return lit.length;
}

/** Bank only the tokens on one layer. A tap is a collect, not a smear of the whole expression. */
function depositLayer(expression, layer, times = 1) {
  const shape = manifest?.[expression];
  if (!shape || !layer) return 0;
  const weight = (LAYER_WEIGHT[layer] || 1) * times;
  const store = readSalience();
  let banked = 0;
  for (const entry of shapeTokens(shape)) {
    if (entry.relation !== layer || !entry.token) continue;
    store[entry.token] = (store[entry.token] || 0) + weight;
    banked += 1;
  }
  if (!banked) return 0;
  try {
    writeJson(STORAGE_KEY, store);
  } catch {
    // Storage is optional; the lit layer still showed.
  }
  paintSalience(expression);
  return banked;
}

/** A living term joins the field by its authored concept name. */
function resonateConcept(concept, sourceNode) {
  clearResonance();
  if (!concept) return 0;
  sourceNode?.setAttribute(ATTR.source, 'source');
  sourceRef = sourceNode || null;
  lightLiving(concept, 'part', {}, sourceNode);
  for (const [expression, nodes] of elementsByExpression || []) {
    const shape = manifest?.[expression];
    const hit = shapeTokens(shape).find((entry) => entry.token === concept);
    if (!hit) continue;
    for (const node of nodes) lightNode(node, hit.relation, concept);
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
  for (const token of salienceTokens(shape)) {
    store[token] = (store[token] || 0) + 1;
  }
  try {
    writeJson(STORAGE_KEY, store);
  } catch {
    // Storage is optional; losing it costs warmth, not correctness.
  }
  paintSalience(expression);
  paintLivingSalience();
}

function depositConcept(concept) {
  if (!concept) return;
  const store = readSalience();
  store[concept] = (store[concept] || 0) + 1;
  try {
    writeJson(STORAGE_KEY, store);
  } catch {
    // Storage is optional; losing it costs warmth, not correctness.
  }
  paintLivingSalience();
  for (const expression of elementsByExpression?.keys() || []) paintSalience(expression);
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
/**
 * Compost returns less than gathering deposited, because decomposition is lossy
 * and because a fragment that aged out was, by definition, not returned to. It
 * is not zero: the reader still travelled that token once, and the substrate
 * should remember that something passed through even after the material is gone.
 */
const COMPOST_WEIGHT = 1;

export function depositGathered(items = [], weight = GATHER_WEIGHT) {
  if (!manifest || !Array.isArray(items) || !items.length) return 0;
  const store = readSalience();
  let banked = 0;

  for (const item of items) {
    const expression = item?.semanticExpression || item?.expression;
    const shape = expression && manifest[expression];
    if (!shape) continue;

    for (const token of salienceTokens(shape)) {
      store[token] = (store[token] || 0) + weight;
    }
    banked += 1;

    // Kin share: the neighbourhood a gathered fragment belongs to warms with it,
    // so recognising a relation pays more than collecting in isolation.
    //
    // Compost does not spread. Decomposition returns material to the ground it
    // fell on, not to every relation that ground participates in — and a
    // fragment that aged out earned no new recognition on its way out.
    if (weight >= GATHER_WEIGHT) {
      for (const { token } of kinOf(expression)) {
        if (token) store[token] = (store[token] || 0) + KIN_SHARE;
      }
    }
  }

  if (!banked) return 0;
  try {
    writeJson(STORAGE_KEY, store);
  } catch {
    // Storage optional; a lost deposit costs warmth, not correctness.
  }
  for (const expression of elementsByExpression?.keys() || []) paintSalience(expression);
  paintLivingSalience();
  return banked;
}

/**
 * Honor authored crawl; mark common / ordinal / project from punctuation.
 * Never infer crawl from tight dots — those are one identifier, not nested-about.
 */
function paintJoin(expression) {
  const shape = manifest?.[expression];
  const parts = shape?.parts || [];
  const kind = shape?.join;
  for (const node of elementsByExpression.get(expression) || []) {
    const authored = node.getAttribute(ATTR.join);
    if (authored === 'crawl') {
      if (parts.length >= 2) {
        node.setAttribute(ATTR.crawlOpen, parts[0]);
        node.setAttribute(ATTR.crawlClose, parts[parts.length - 1]);
      }
      continue;
    }
    if (authored) continue;
    if (kind === 'common' || kind === 'ordinal' || kind === 'project') {
      node.setAttribute(ATTR.join, kind);
    }
  }
}

/** Capsule is the authored channel — where the expression is allowed to go. */
function paintProjection(expression) {
  const projection = manifest?.[expression]?.projection;
  if (!projection) return;
  for (const node of elementsByExpression.get(expression) || []) {
    if (!node.getAttribute(ATTR.projection)) {
      node.setAttribute(ATTR.projection, projection);
    }
  }
}

/** Project accumulated warmth onto living terms whose concept was travelled. */
function paintLivingSalience() {
  if (!livingByConcept) return;
  for (const [concept, nodes] of livingByConcept) {
    const band = salienceBand(concept);
    for (const node of nodes) {
      if (band > 0) node.setAttribute(ATTR.salience, String(band));
      else node.removeAttribute(ATTR.salience);
    }
  }
}

/** Project accumulated warmth onto the elements carrying a token. */
function paintSalience(expression) {
  const shape = manifest?.[expression];
  if (!shape) return;
  const band = Math.max(
    salienceBand(shape.subject),
    salienceBand(shape.mode),
    salienceBand(shape.scope),
    salienceBand(shape.projection),
    ...(shape.parts || []).map(salienceBand),
    ...(shape.charge || []).map(salienceBand),
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
  livingByConcept = indexLivingConcepts();
  if (!elementsByExpression.size && !livingByConcept.size) return () => {};

  // One pass: warmth from prior visits; join marks only when authored or punctuated.
  for (const expression of elementsByExpression.keys()) {
    paintSalience(expression);
    paintJoin(expression);
    paintProjection(expression);
  }
  paintLivingSalience();

  const onEnter = (event) => {
    if (event.pointerType === 'touch') return;
    clearTimeout(settleTimer);
    const host = event.target?.closest?.(`[${ATTR.expression}]`);
    if (host) {
      const expression = host.getAttribute(ATTR.expression);
      if (!expression) return;
      resonate(expression, host);
      clearTimeout(dwellTimer);
      dwellTimer = setTimeout(() => depositSalience(expression), ENCOUNTER_MS);
      return;
    }
    const living = event.target?.closest?.(LIVING_SELECTOR);
    if (!living) return;
    const concept = living.getAttribute('data-spw-concept');
    if (!concept) return;
    resonateConcept(concept, living);
    clearTimeout(dwellTimer);
    dwellTimer = setTimeout(() => depositConcept(concept), ENCOUNTER_MS);
  };

  const onLeave = (event) => {
    if (gesture || event.pointerType === 'touch') return;
    const next = event.relatedTarget;
    if (next?.closest?.(`[${ATTR.source}], [${ATTR.kin}]`)) return;
    clearTimeout(dwellTimer);
    clearResonance();
  };

  const blocksGesture = (node) => Boolean(node?.closest?.(NATIVE_CONTROL_SELECTOR));

  const armSettle = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => clearResonance(), LAYER_SETTLE_MS);
  };

  const sampleTrace = () => {
    if (!gesture) return;
    gesture.frame = 0;
    placeSheen(gesture.card, gesture.x);
    const hit = document.elementFromPoint(gesture.x, gesture.y);
    const host = hit?.closest?.(`[${ATTR.expression}]`);
    if (!host || (gesture.card && !gesture.card.contains(host))) return;
    const expression = host.getAttribute(ATTR.expression);
    noteTraceHost(host, expression);
  };

  const onPointerMove = (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    const moved = Math.hypot(gesture.x - gesture.downX, gesture.y - gesture.downY);
    if (moved > 10 && gesture.holdTimer) {
      clearTimeout(gesture.holdTimer);
      gesture.holdTimer = null;
    }
    if (gesture.frame) return;
    gesture.frame = requestAnimationFrame(sampleTrace);
  };

  const onPointerDown = (event) => {
    if (event.button !== 0 || blocksGesture(event.target)) return;
    const host = event.target?.closest?.(`[${ATTR.expression}]`);
    const expression = host?.getAttribute(ATTR.expression);
    if (!host || !expression) return;
    const card = host.closest(TRACE_CARD);
    gesture = {
      id: event.pointerId,
      downX: event.clientX,
      downY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      host,
      expression,
      card,
      startExpr: '',
      startHost: null,
      endExpr: '',
      endHost: null,
      path: [],
      seen: new Set(),
      holdTimer: null,
      frame: 0,
      held: false,
      reduce: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
    };
    noteTraceHost(host, expression);
    publishContract(host);
    gesture.holdTimer = setTimeout(() => {
      if (!gesture || gesture.id !== event.pointerId) return;
      gesture.held = true;
      resonate(expression, host, activeLayer(expression));
      markCharge(host, GESTURE_CHARGE.hold);
    }, HOLD_MS);
    document.addEventListener('pointermove', onPointerMove, { passive: true });
  };

  const finishGesture = (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.downX;
    const dy = event.clientY - gesture.downY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const current = gesture;
    if (current.holdTimer) clearTimeout(current.holdTimer);
    if (current.frame) cancelAnimationFrame(current.frame);
    document.removeEventListener('pointermove', onPointerMove);
    gesture = null;
    if (!current.host.isConnected) {
      clearPublished();
      return;
    }

    const coarse = event.pointerType === 'touch' || event.pointerType === 'pen';
    const traced = current.path.length > 1;
    clearTimeout(dwellTimer);
    const releaseContract = () => {
      clearTimeout(contractTimer);
      contractTimer = setTimeout(clearPublished, coarse ? LAYER_SETTLE_MS : 0);
    };

    if (current.held && !traced && absX < 10 && absY < 10) {
      const layer = activeLayer(current.expression);
      resonate(current.expression, current.host, layer);
      markCharge(current.host, GESTURE_CHARGE.hold);
      current.host?.setAttribute(ATTR.source, 'start');
      depositLayer(current.expression, layer, 2);
      if (coarse) armSettle();
      releaseContract();
      return;
    }

    if (traced) {
      current.startHost?.setAttribute(ATTR.source, 'start');
      current.endHost?.setAttribute(ATTR.source, 'end');
      markCharge(current.startHost, GESTURE_CHARGE.swipe);
      markCharge(current.endHost, GESTURE_CHARGE.swipe);
      depositLayer(current.startExpr, activeLayer(current.startExpr));
      if (current.endExpr !== current.startExpr) {
        depositLayer(current.endExpr, activeLayer(current.endExpr));
      }
      for (const mid of current.path.slice(1, -1)) depositLayer(mid, 'subject');
      lightLayer(current.endExpr, current.endHost, activeLayer(current.endExpr));
      if (coarse) armSettle();
      releaseContract();
      return;
    }

    if (absX >= SWIPE_MIN_PX && absX > absY * SWIPE_DOMINANCE) {
      layerCursor += dx < 0 ? 1 : -1;
      const layer = activeLayer(current.expression);
      resonate(current.expression, current.host, layer);
      markCharge(current.host, GESTURE_CHARGE.swipe);
      current.host?.setAttribute(ATTR.source, 'start');
      if (coarse) armSettle();
      releaseContract();
      return;
    }

    if (absX < 10 && absY < 10) {
      const layer = activeLayer(current.expression);
      resonate(current.expression, current.host, layer);
      markCharge(current.host, GESTURE_CHARGE.tap);
      current.host?.setAttribute(ATTR.source, 'start');
      depositLayer(current.expression, layer);
      if (coarse) armSettle();
    }
    releaseContract();
  };

  const onPointerCancel = (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    if (gesture.holdTimer) clearTimeout(gesture.holdTimer);
    if (gesture.frame) cancelAnimationFrame(gesture.frame);
    document.removeEventListener('pointermove', onPointerMove);
    gesture = null;
    clearPublished();
  };

  document.addEventListener('pointerover', onEnter, { passive: true });
  document.addEventListener('pointerout', onLeave, { passive: true });
  document.addEventListener('pointerdown', onPointerDown, { passive: true });
  document.addEventListener('pointerup', finishGesture, { passive: true });
  document.addEventListener('pointercancel', onPointerCancel, { passive: true });
  document.addEventListener('focusin', onEnter, { passive: true });
  document.addEventListener('focusout', onLeave, { passive: true });
  document.addEventListener('keydown', onKinKey);

  // Gathering banks harder than dwell. The cauldron already broadcasts its full
  // item list, so the loop closes without the mix having to be touched.
  const bus = ctx.bus || globalThis.__SPW_SITE__?.bus;
  const offGathered = bus?.on?.('cauldron:updated', (event) => {
    depositGathered(event?.detail?.items || event?.items || []);
  }) || null;

  // Composting: pruned material returns its tokens to the substrate at a
  // reduced weight. The one place the cauldron shrinks is now also the one
  // place it feeds something.
  const offComposted = bus?.on?.('cauldron:gardened', (event) => {
    const detail = event?.detail || event || {};
    if (detail.action !== 'prune') return;
    depositGathered(detail.composted || [], COMPOST_WEIGHT);
  }) || null;

  /**
   * Lab state names a live channel. That is residue of the current
   * consideration, not a hover preview — it must not call resonate().
   */
  function markLiveChannel(expression, sourceNode) {
    document.querySelectorAll(`[${ATTR.channel}="live"]`).forEach((node) => {
      if (node !== sourceNode) node.removeAttribute(ATTR.channel);
    });
    if (sourceNode) {
      sourceNode.setAttribute(ATTR.channel, 'live');
      const projection = manifest?.[expression]?.projection || sourceNode.getAttribute(ATTR.projection);
      if (projection) sourceNode.setAttribute(ATTR.projection, projection);
    }
    if (!expression || !manifest?.[expression]) return;
    const light = (expr) => {
      for (const node of elementsByExpression.get(expr) || []) {
        node.setAttribute(ATTR.channel, 'live');
        const projection = manifest[expr]?.projection;
        if (projection) node.setAttribute(ATTR.projection, projection);
      }
    };
    light(expression);
    for (const { expression: other, relation } of kinOf(expression)) {
      if (relation === 'projection') light(other);
    }
  }

  const onChannel = (event) => {
    const detail = event?.detail || event || {};
    const source = event.target?.closest?.(`[${ATTR.expression}]`) || null;
    markLiveChannel(detail.expression || '', source);
  };
  document.addEventListener('spw:expression-channel', onChannel);

  cleanup = () => {
    offGathered?.();
    offComposted?.();
    clearTimeout(dwellTimer);
    clearTimeout(settleTimer);
    clearTimeout(contractTimer);
    gesture = null;
    clearPublished();
    clearResonance();
    document.removeEventListener('pointerover', onEnter);
    document.removeEventListener('pointerout', onLeave);
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointerup', finishGesture);
    document.removeEventListener('pointercancel', onPointerCancel);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('focusin', onEnter);
    document.removeEventListener('focusout', onLeave);
    document.removeEventListener('keydown', onKinKey);
    document.removeEventListener('spw:expression-channel', onChannel);
    elementsByExpression = null;
    livingByConcept = null;
    lit = [];
    sourceRef = null;
    cleanup = null;
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
    livingConcepts: livingByConcept?.size || 0,
    projections: Object.values(manifest).filter((shape) => shape?.projection).length,
    salience: readSalience(),
  };
}

export const EXPRESSION_RESONANCE_CONTRACT = Object.freeze({
  attrs: ATTR,
  storageKey: STORAGE_KEY,
  encounterMs: ENCOUNTER_MS,
  salienceBands: SALIENCE_BANDS,
  rule: 'A fine pointer hover previews every kin layer and dwell banks the whole expression. A tap collects the active layer as preview. A hold sustains that layer at double weight. A finger tracing a card charges each expression it crosses: the first is the start anchor, the last is the end anchor, and the hosts between bank only their subject. While the pointer is down the host publishes tap:prime hold:inspect swipe:cycle, then releases it. Preview and arming stay off a wisdom deck, whose charge changes layout. A swipe that stays on one host still walks the layers. Touch does not dwell. The move listener exists only while the pointer is down.',
});

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'expression-resonance',
  mount: (ctx) => initExpressionResonance(ctx),
  describes: 'expression[kin]{subject.mode.part.projection}<resonance.join.channel>',
  updates: [
    'flourish:data-spw-expression-kin',
    'flourish:data-spw-expression-resonating',
    'flourish:data-spw-join',
    'flourish:data-spw-crawl-pole',
    'flourish:data-spw-projection',
    'flourish:data-spw-channel',
    'residue:data-spw-expression-salience',
    'measure:--spw-expression-resonance',
  ],
  timingArc: 'idle-semantic-reinforcement',
  effectScope: 'local-dom flourish residue storage',
});
