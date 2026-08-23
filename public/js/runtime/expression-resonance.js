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

import { readJson, writeJson } from '/public/js/kernel/storage-utils.js';

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
});

/** Dwell past this reads as an encounter rather than a glance. */
const ENCOUNTER_MS = 700;
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
let cleanup = null;

const LIVING_SELECTOR = '[data-spw-living-term][data-spw-concept], .spw-living-term[data-spw-concept]';

function kinStrength(relation) {
  return relation === 'subject' ? 1 : relation === 'mode' ? 0.7 : 0.45;
}

function shapeTokens(shape) {
  if (!shape) return [];
  const tokens = [];
  if (shape.subject) tokens.push({ token: shape.subject, relation: 'subject' });
  if (shape.mode) tokens.push({ token: shape.mode, relation: 'mode' });
  for (const part of shape.parts || []) {
    if (part) tokens.push({ token: part, relation: 'part' });
  }
  return tokens;
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
  });
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
function resonate(expression, sourceNode) {
  clearResonance();
  const shape = manifest?.[expression];
  if (!shape) return 0;

  sourceNode?.setAttribute(ATTR.source, 'source');
  sourceRef = sourceNode || null;
  const sourceJoin = sourceNode?.getAttribute?.(ATTR.join)
    || sourceNode?.closest?.(`[${ATTR.join}]`)?.getAttribute(ATTR.join);
  const sourceParts = shape.parts || [];
  const poles = {
    openPart: sourceJoin === 'crawl' ? (sourceParts[0] || '') : '',
    closePart: sourceJoin === 'crawl' && sourceParts.length > 1 ? sourceParts[sourceParts.length - 1] : '',
  };

  for (const { expression: other, relation, token } of kinOf(expression)) {
    for (const node of elementsByExpression.get(other) || []) {
      lightNode(node, relation, token, poles);
    }
  }
  for (const { token, relation } of shapeTokens(shape)) {
    lightLiving(token, relation, poles, sourceNode);
  }
  return lit.length;
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

    for (const token of [shape.subject, shape.mode, ...(shape.parts || [])]) {
      if (!token) continue;
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
 * Never infer crawl from a dotted list — that list is not cure-about-laminate.
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
  livingByConcept = indexLivingConcepts();
  if (!elementsByExpression.size && !livingByConcept.size) return () => {};

  // One pass: warmth from prior visits; join marks only when authored or punctuated.
  for (const expression of elementsByExpression.keys()) {
    paintSalience(expression);
    paintJoin(expression);
  }
  paintLivingSalience();

  const onEnter = (event) => {
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
    const next = event.relatedTarget;
    if (next?.closest?.(`[${ATTR.source}], [${ATTR.kin}]`)) return;
    clearTimeout(dwellTimer);
    clearResonance();
  };

  document.addEventListener('pointerover', onEnter, { passive: true });
  document.addEventListener('pointerout', onLeave, { passive: true });
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

  cleanup = () => {
    offGathered?.();
    offComposted?.();
    clearTimeout(dwellTimer);
    clearResonance();
    document.removeEventListener('pointerover', onEnter);
    document.removeEventListener('pointerout', onLeave);
    document.removeEventListener('focusin', onEnter);
    document.removeEventListener('focusout', onLeave);
    document.removeEventListener('keydown', onKinKey);
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
    salience: readSalience(),
  };
}

export const EXPRESSION_RESONANCE_CONTRACT = Object.freeze({
  attrs: ATTR,
  storageKey: STORAGE_KEY,
  encounterMs: ENCOUNTER_MS,
  salienceBands: SALIENCE_BANDS,
  rule: 'hover previews kinship (pulse); dwell banks salience (residue); never the reverse. [ and ] travel lit kin while a source is held. Living terms join the field by authored data-spw-concept. Crawl is authored, never inferred from a dotted list. Parser lives at `__SPW_SITE__.parser.parse`.',
});

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'expression-resonance',
  mount: (ctx) => initExpressionResonance(ctx),
  describes: 'expression[kin]{subject.mode.part}<resonance.join>',
  updates: [
    'flourish:data-spw-expression-kin',
    'flourish:data-spw-expression-resonating',
    'flourish:data-spw-join',
    'flourish:data-spw-crawl-pole',
    'residue:data-spw-expression-salience',
    'measure:--spw-expression-resonance',
  ],
  timingArc: 'idle-semantic-reinforcement',
  effectScope: 'local-dom flourish residue storage',
});
