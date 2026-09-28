/**
 * Authored page category — family, role, modes, context, surface.
 * One reader for loader gates, medium register, and load-reason copy.
 */

import { presenceToken as normalizeToken } from '/public/js/kernel/text-normalization.js';

export const PAGE_FAMILY_SETS = Object.freeze({
  play: Object.freeze(['campaign']),
  scene: Object.freeze(['practice-bed']),
  workshop: Object.freeze(['workshop', 'laboratory']),
  literacy: Object.freeze([
    'syntax-atlas',
    'operator-atlas',
    'curriculum',
    'field-guide',
    'learning-library',
  ]),
  orientation: Object.freeze(['atlas', 'topic-portal', 'constellation']),
});

export const PLAY_SURFACES = Object.freeze(['play', 'rpg-wednesday', 'rpg']);

const ORIENTATION_MODES = new Set(['navigate', 'onboard', 'collect']);
const LITERACY_MODES = new Set(['inspect', 'compare', 'teach', 'practice', 'reading']);
const EMPTY_CATEGORY = Object.freeze({
  family: '',
  role: '',
  modes: Object.freeze([]),
  modeSet: Object.freeze(new Set()),
  context: '',
  surface: '',
});

function tokenize(value = '') {
  return String(value || '')
    .split(/[\s,]+/)
    .map((item) => normalizeToken(item))
    .filter(Boolean);
}

function asTokenList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => normalizeToken(item)).filter(Boolean);
  return tokenize(value);
}

export function readPageCategory(body = document.body) {
  if (!(body instanceof HTMLElement)) return EMPTY_CATEGORY;
  const modes = tokenize(body.dataset.spwPageModes || '');
  return Object.freeze({
    family: normalizeToken(body.dataset.spwPageFamily || ''),
    role: normalizeToken(body.dataset.spwPageRole || ''),
    modes,
    modeSet: Object.freeze(new Set(modes)),
    context: normalizeToken(body.dataset.spwContext || ''),
    surface: normalizeToken(body.dataset.spwSurface || ''),
  });
}

export function tokenListIncludes(haystack, needle) {
  return tokenize(haystack).includes(normalizeToken(needle));
}

function matchesAny(required, actual) {
  const want = asTokenList(required);
  if (!want.length) return true;
  if (!actual) return false;
  if (actual instanceof Set) return want.some((token) => actual.has(token));
  if (Array.isArray(actual)) {
    const have = new Set(actual);
    return want.some((token) => have.has(token));
  }
  return want.includes(normalizeToken(actual));
}

/**
 * Optional catalog gates: pageFamily, pageRole, pageModes, pageContext, pageSurface.
 * Absent fields do not filter. Modes match ANY listed token.
 */
export function matchesPageCategory(def = {}, category = EMPTY_CATEGORY) {
  if (!matchesAny(def.pageFamily, category.family)) return false;
  if (!matchesAny(def.pageRole, category.role)) return false;
  if (!matchesAny(def.pageModes, category.modeSet)) return false;
  if (!matchesAny(def.pageContext, category.context)) return false;
  if (!matchesAny(def.pageSurface, category.surface)) return false;
  return true;
}

export function isLiteracyPage(category = EMPTY_CATEGORY) {
  if (PAGE_FAMILY_SETS.literacy.includes(category.family)) return true;
  return [...category.modeSet].some((mode) => LITERACY_MODES.has(mode));
}

export function isOrientationOnlyPage(category = EMPTY_CATEGORY) {
  if (!PAGE_FAMILY_SETS.orientation.includes(category.family)) return false;
  if (!category.modes.length) return true;
  return [...category.modeSet].every((mode) => ORIENTATION_MODES.has(mode));
}

export function describePageCategory(category = EMPTY_CATEGORY) {
  const modes = category.modes.length ? category.modes.join(' ') : 'none';
  return [
    category.family && `family:${category.family}`,
    category.role && `role:${category.role}`,
    `modes:${modes}`,
    category.context && `context:${category.context}`,
  ].filter(Boolean).join(' ');
}
