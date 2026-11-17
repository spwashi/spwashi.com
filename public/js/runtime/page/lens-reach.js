/**
 * lens-reach.js — where a chosen seat lands on the page, read two ways.
 *
 * Declared: the page says a frame serves the seat (data-spw-lens-pass).
 * Parsed: the frame's own Spw leans toward the seat. Every handle in it is read
 * through the operator table (operator-detection.js), sigil text first and the
 * authored operator after, and the frame leans when the seat's operator is a
 * larger share of its handles than of the page's: a lift, not a raw share, so a
 * mark the whole page uses a lot does not make every frame lean.
 *
 * The two readings are kept apart rather than summed. Where they agree the page
 * and its Spw share ground; where only one holds, that is the edge, and both are
 * worth seeing. A frame carries the result as tokens on data-spw-lens-reach:
 * "declared", "parsed", or both. Nothing is written for the seat a page opens on.
 */

import { detectOperatorFromElement, getOperatorDefinition } from '/public/js/kernel/operator-detection.js';
import { readCarriedIntent, readSustainedLens } from '/public/js/kernel/visit-intent.js';
import { matchesActiveProfile } from '/public/js/semantic/expression-query.js';

export const LENS_REACH_ATTR = 'data-spw-lens-reach';
// A frame leans when the seat's mark is at least this many times its page share,
// carried by at least this many handles; one handle is a coincidence.
export const LENS_REACH_LIFT = 1.8;
export const LENS_REACH_MIN_HANDLES = 2;

const FRAME_SELECTOR = 'section.spw-frame[id]';
const PROFILE_TARGET_SELECTOR = 'section.spw-frame[id], main .spw-card, main .frame-card, main .spw-panel, main .spw-chip[data-spw-semantic-expression]';
const HANDLE_SELECTOR = '[data-spw-operator]';

const DEFAULT_PROFILE_SETTINGS = Object.freeze({
  themePack: 'neutral-paper',
  colorMode: 'auto',
  posture: 'reading',
  flavor: 'culinary',
  authorMode: 'draft',
  stance: 'witness',
  climate: 'orient',
  density: 'minimal',
});

export function readActiveProfile(doc = globalThis.document, { sustained = undefined, carried = undefined, source = '' } = {}) {
  const dataset = doc?.documentElement?.dataset || {};
  const sustainedLens = sustained === undefined ? readSustainedLens() : sustained;
  const carriedIntent = carried === undefined ? readCarriedIntent() : carried;

  const lens = String(dataset.spwActiveLensMode || sustainedLens?.mode || '').trim();
  const themePack = String(dataset.spwThemePack || '').trim();
  const colorMode = String(dataset.spwColorMode || '').trim();
  const posture = String(dataset.spwExplorePosture || '').trim();
  const flavor = String(dataset.spwPedagogicalFlavor || '').trim();
  const authorMode = String(dataset.spwAuthorMode || '').trim();
  const density = String(dataset.spwSemanticDensity || '').trim();
  const climate = String(dataset.spwDevelopmentalClimate || '').trim();
  const stance = String(dataset.spwMetacognitiveStance || '').trim();
  const operator = String(carriedIntent?.operator || sustainedLens?.operator || '').trim();
  const filterMode = String(dataset.spwLensFilter || sustainedLens?.filterMode || '').trim();

  const hasCustomSetting = Boolean(
    (themePack && themePack !== DEFAULT_PROFILE_SETTINGS.themePack)
    || (colorMode && colorMode !== DEFAULT_PROFILE_SETTINGS.colorMode)
    || (posture && posture !== DEFAULT_PROFILE_SETTINGS.posture)
    || (flavor && flavor !== DEFAULT_PROFILE_SETTINGS.flavor)
    || (authorMode && authorMode !== DEFAULT_PROFILE_SETTINGS.authorMode)
    || (stance && stance !== DEFAULT_PROFILE_SETTINGS.stance)
    || (climate && climate !== DEFAULT_PROFILE_SETTINGS.climate)
    || (density && density !== DEFAULT_PROFILE_SETTINGS.density),
  );

  const activeSource = source || dataset.spwActiveLensSource || '';
  const hasActiveLensSignal = Boolean(
    sustainedLens?.mode
    || (lens && activeSource && activeSource !== 'initial')
    || operator
    || filterMode === 'matched',
  );

  return {
    lens,
    sustainedLens: sustainedLens?.mode || '',
    themePack,
    colorMode,
    posture,
    flavor,
    authorMode,
    density,
    climate,
    stance,
    operator,
    filterMode,
    isCustom: hasCustomSetting || hasActiveLensSignal,
  };
}

export function readCandidateSpwMetadata(element) {
  if (!element || typeof element !== 'object') return {};
  const dataset = element.dataset || {};
  const getAttr = typeof element.getAttribute === 'function' ? (name) => element.getAttribute(name) || '' : () => '';
  return {
    expression: dataset.spwSemanticExpression || getAttr('data-spw-semantic-expression'),
    lensPass: getAttr('data-spw-lens-pass'),
    copyLens: getAttr('data-spw-copy-lens'),
    variant: getAttr('data-mode-panel') || dataset.spwSemanticVariant || dataset.spwContentVariant || '',
    themeAffinity: dataset.spwThemeAffinity || getAttr('data-spw-theme-affinity'),
    operator: getAttr('data-spw-operator') || dataset.spwOperator || '',
  };
}

/** Pure: the reading of one frame, from its counts and the page's. */
export function classifyLensReach({ declared = false, count = 0, total = 0, pageCount = 0, pageTotal = 0 } = {}) {
  const share = total > 0 ? count / total : 0;
  const base = pageTotal > 0 ? pageCount / pageTotal : 0;
  const lift = base > 0 ? share / base : 0;
  const tokens = [];
  if (declared) tokens.push('declared');
  if (count >= LENS_REACH_MIN_HANDLES && lift >= LENS_REACH_LIFT) tokens.push('parsed');
  return { tokens, share, lift };
}

/** Pure: the words the lens feedback uses for a seat's reach. */
export function describeLensReachSummary({ declared = 0, parsed = 0, both = 0 } = {}) {
  const parts = [];
  if (declared) parts.push(`${declared} declared`);
  if (parsed) parts.push(`${parsed} ${parsed === 1 ? 'leans' : 'lean'} its way in ${parsed === 1 ? 'its' : 'their'} Spw`);
  if (both) parts.push(`${both} both`);
  return parts.join(', ');
}

function operatorTypeOf(element) {
  return detectOperatorFromElement(element)?.type || '';
}

/** Whether the page marks any place a seat serves; only such a page is read. */
export function pageTakesLensReach(doc = globalThis.document) {
  return Boolean(doc?.querySelector?.('[data-spw-lens-pass]'));
}

/**
 * Read every frame for one seat. `exclude` is the frame that holds the switch:
 * the reader is already there, and an outline on it would say nothing.
 */
export function readLensReach(doc = globalThis.document, { mode = '', operator = '', exclude = null } = {}) {
  const main = doc?.querySelector?.('main');
  const seatType = getOperatorDefinition(operator)?.type || '';
  if (!main || !mode || !seatType) return [];

  const pageTypes = [...main.querySelectorAll(HANDLE_SELECTOR)].map(operatorTypeOf).filter(Boolean);
  const pageCount = pageTypes.filter((type) => type === seatType).length;

  return [...main.querySelectorAll(FRAME_SELECTOR)]
    .filter((frame) => frame !== exclude)
    .map((frame) => {
      const types = [...frame.querySelectorAll(HANDLE_SELECTOR)].map(operatorTypeOf).filter(Boolean);
      const count = types.filter((type) => type === seatType).length;
      const declared = String(frame.getAttribute('data-spw-lens-pass') || '').split(/\s+/).includes(mode);
      return { frame, count, total: types.length, ...classifyLensReach({ declared, count, total: types.length, pageCount, pageTotal: pageTypes.length }) };
    });
}

export function writeLensReach(entries = []) {
  const summary = { declared: 0, parsed: 0, both: 0 };
  for (const { frame, tokens } of entries) {
    if (tokens.length) frame.setAttribute(LENS_REACH_ATTR, tokens.join(' '));
    else frame.removeAttribute(LENS_REACH_ATTR);
    const isDeclared = tokens.includes('declared');
    const isParsed = tokens.includes('parsed');
    if (isDeclared) summary.declared += 1;
    if (isParsed) summary.parsed += 1;
    if (isDeclared && isParsed) summary.both += 1;
  }
  return summary;
}

export function clearLensReach(doc = globalThis.document) {
  for (const frame of doc?.querySelectorAll?.(`[${LENS_REACH_ATTR}]`) || []) frame.removeAttribute(LENS_REACH_ATTR);
}

function setAttrIfChanged(element, name, value) {
  if (!element || typeof element.setAttribute !== 'function') return;
  const next = String(value || '');
  if (!next) {
    if (element.hasAttribute?.(name)) element.removeAttribute(name);
    return;
  }
  if (element.getAttribute(name) !== next) element.setAttribute(name, next);
}

function setDatasetFlagIfChanged(element, key, active) {
  if (!element?.dataset) return;
  if (active) {
    if (element.dataset[key] !== 'true') element.dataset[key] = 'true';
  } else if (key in element.dataset) {
    delete element.dataset[key];
  }
}

/**
 * Sync `[data-spw-copy-lens]` sibling groups against active profile (lens, theme pack,
 * color mode, posture, Spw expression). Preserves sole or fallback `default` blocks so
 * selecting any cross-route lens never hides a route's only lede.
 */
export function syncProfileCopySelections(doc = globalThis.document, profile = readActiveProfile(doc)) {
  const nodes = [...(doc?.querySelectorAll?.('[data-spw-copy-lens]') || [])];
  if (!nodes.length) return { matched: 0, groups: 0 };

  const groups = new Map();
  for (const node of nodes) {
    const parent = node.parentElement || doc.body || doc;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(node);
  }

  let matchedCount = 0;
  for (const siblings of groups.values()) {
    const hostLens = siblings[0]?.closest?.('[data-spw-lens-mode]')?.getAttribute?.('data-spw-lens-mode') || '';
    const effectiveProfile = hostLens && hostLens !== profile.lens
      ? { ...profile, lens: hostLens }
      : profile;

    let bestScore = 0;
    const scored = siblings.map((node) => {
      const copyLens = String(node.getAttribute?.('data-spw-copy-lens') || '').trim();
      const tokens = copyLens.split(/\s+/).filter(Boolean);
      const isAlways = tokens.includes('always');
      const isDefault = tokens.includes('default');
      if (isAlways) return { node, score: 100, isAlways: true, isDefault };
      const match = matchesActiveProfile(readCandidateSpwMetadata(node), effectiveProfile);
      if (!isDefault && match.score > bestScore) bestScore = match.score;
      return { node, score: match.score, isAlways: false, isDefault };
    });

    const hasNonDefaultMatch = bestScore > 0;
    for (const item of scored) {
      if (item.isAlways) {
        setDatasetFlagIfChanged(item.node, 'spwVariantSelected', true);
        continue;
      }
      if (hasNonDefaultMatch) {
        const win = !item.isDefault && item.score === bestScore;
        setDatasetFlagIfChanged(item.node, 'spwVariantSelected', win);
        if (win) matchedCount += 1;
      } else {
        setDatasetFlagIfChanged(item.node, 'spwVariantSelected', item.isDefault);
      }
    }
  }

  return { matched: matchedCount, groups: groups.size };
}

/**
 * Evaluate lens reach + expression profile matching sitewide.
 * Maintains declared/parsed readings where `[data-spw-lens-pass]` exists, weights
 * expression-tagged elements by `matchesActiveProfile()`, and marks `recede` for filtering.
 */
export function applyProfileLensField(
  doc = globalThis.document,
  { mode = '', operator = '', exclude = null, source = 'initial', profile: givenProfile = null } = {},
) {
  const profile = givenProfile || readActiveProfile(doc, { source });
  const copySummary = syncProfileCopySelections(doc, profile);

  const effectiveMode = mode || profile.lens || '';
  const hasReachTargets = pageTakesLensReach(doc);
  let reachSummary = { declared: 0, parsed: 0, both: 0 };

  const shouldApplyReach = Boolean(source !== 'initial' || profile.isCustom || profile.filterMode === 'matched');
  if (!shouldApplyReach) {
    clearLensReach(doc);
    return { reachSummary, profileMatched: 0, copySummary, profile };
  }

  const baseTokens = new Map();
  if (hasReachTargets && effectiveMode && operator) {
    const entries = readLensReach(doc, { mode: effectiveMode, operator, exclude });
    reachSummary = writeLensReach(entries);
    for (const { frame, tokens } of entries) {
      baseTokens.set(frame, new Set(tokens));
    }
  }

  const targets = [...(doc?.querySelectorAll?.(PROFILE_TARGET_SELECTOR) || [])];
  if (!targets.length) {
    return { reachSummary, profileMatched: 0, copySummary, profile };
  }

  const results = [];
  const matchedEls = new Set();
  for (const el of targets) {
    if (el === exclude) continue;
    const match = matchesActiveProfile(readCandidateSpwMetadata(el), profile);
    const tokens = baseTokens.get(el) ? new Set(baseTokens.get(el)) : new Set();
    if (match.matched) {
      tokens.add('profile');
      matchedEls.add(el);
    } else if (baseTokens.has(el) && (tokens.has('declared') || tokens.has('parsed'))) {
      // keep declared/parsed seat reach intact
    } else if (!hasReachTargets && !profile.isCustom) {
      tokens.clear();
    }
    results.push({ el, match, tokens });
  }

  const matchedTotal = matchedEls.size;
  const containsMatch = (el) => {
    for (const matchedEl of matchedEls) {
      if (matchedEl !== el && el.contains?.(matchedEl)) return true;
    }
    return false;
  };

  const allowRecede = matchedTotal > 0 && (profile.filterMode === 'matched' || profile.isCustom || source !== 'initial');
  for (const { el, match, tokens } of results) {
    if (allowRecede && !match.matched && !tokens.has('declared') && !tokens.has('parsed') && !containsMatch(el)) {
      const hasSwitch = Boolean(el.querySelector?.('.mode-switch'));
      const isCardOrFrame = el.matches?.('.spw-card, .frame-card, section.spw-frame[id]');
      if (isCardOrFrame && !hasSwitch) {
        tokens.clear();
        tokens.add('recede');
      }
    }
    setAttrIfChanged(el, LENS_REACH_ATTR, [...tokens].join(' '));
  }

  return {
    reachSummary,
    profileMatched: matchedTotal,
    copySummary,
    profile,
  };
}
