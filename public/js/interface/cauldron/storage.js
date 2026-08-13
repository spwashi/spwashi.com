import { CAULDRON_KEY } from './contract.js';
import { deriveNumericityQuantifiers, isNumericalConcept, parseNumericalValue } from './helpers.js';
import { splitOperatorExpression } from '/public/js/kernel/shared.js';

/* Delegates to the kernel's operator grammar (the old local regex required a
   literal backslash before ^ and ?, so those operators never matched). */
export function inferOperator(expression = '') {
  return splitOperatorExpression(expression).prefix;
}

/**
 * The sigil payload already on the element a fragment was gathered from.
 *
 * operator-interactions.js writes data-spw-sigil-payload-{scope,page,family,
 * role,topic} and data-spw-sigil-region-* onto whatever the reader is touching,
 * but capture only ever kept `origin` — the bare surface name. So an ingredient
 * remembered *that* it came from /about/website/ and nothing about what it was
 * there: which region held it, what role that page plays, which topic it sat
 * under. Everything needed to say so was already on the node.
 *
 * Reads the nearest payload-bearing ancestor, then fills gaps from the page's
 * own declarations, so a fragment gathered before any sigil transition still
 * carries page-level context. Attribute reads only — no layout, no measurement.
 */
export function readSigilPayload(element) {
  const body = typeof document !== 'undefined' ? document.body : null;
  const host = element?.closest?.('[data-spw-sigil-payload-page], [data-spw-sigil-payload-scope]') || null;
  const from = (node, key) => node?.dataset?.[key] || '';

  const payload = {
    scope: from(host, 'spwSigilPayloadScope'),
    page: from(host, 'spwSigilPayloadPage') || from(body, 'spwSurface'),
    family: from(host, 'spwSigilPayloadFamily') || from(body, 'spwPageFamily'),
    role: from(host, 'spwSigilPayloadRole') || from(body, 'spwPageRole'),
    topic: from(host, 'spwSigilPayloadTopic') || from(body, 'spwContext'),
    region: from(host, 'spwSigilRegion')
      || element?.closest?.('[data-spw-region]')?.dataset?.spwRegion || '',
    // The shell the fragment was standing in when it was taken. Arrival
    // electrostatics bands a page by liminality; a fragment gathered at `deep`
    // was earned differently from one picked up at `entry`, and a spell that
    // forgets which is which cannot honour the difference on replay.
    liminality: element?.closest?.('[data-spw-liminality]')?.dataset?.spwLiminality || '',
  };

  return Object.values(payload).some(Boolean) ? payload : null;
}

/**
 * Render an ingredient in native Spw rather than as a bare label.
 *
 * The site's own copy grammar is `subject[mode]{parts}` — see the 50
 * data-spw-semantic-expression declarations on the home page. An ingredient has
 * all three and was displaying none of them: the operator sigil carries the
 * discharge kind, the payload role is the mode it was read under, and family /
 * topic / region are the parts that locate it. Composing them gives a fragment
 * that reads as an expression in the same language as the page it came from.
 *
 *   ~orient[media-field-guide]{about.website.deep}
 *
 * Two parses, and the difference is worth reporting rather than hiding:
 *
 *   naive       the string alone. splitOperatorExpression finds a sigil and a
 *               nucleus; nothing else is known, so the result is whatever the
 *               text happened to say.
 *   integrated  the string read against the context it was taken from. The
 *               payload supplies the mode and the locating parts, so the
 *               expression states where it came from rather than only what it
 *               said.
 *
 * A consumer that cannot tell these apart will treat a guess as a grounding.
 * That was the same mistake spw-integrity.mjs made with a regex before it was
 * moved onto the parser, so the depth travels with the value here.
 */
export function toSpwExpression(ingredient) {
  if (!ingredient) return { text: '', depth: 'naive' };
  const split = splitOperatorExpression(ingredient.expression || ingredient.label || '');
  const nucleus = ingredient.operand || split.operand || ingredient.label || '';
  if (!nucleus) return { text: ingredient.expression || '', depth: 'naive' };

  const sigil = ingredient.operator || split.prefix || '';
  const payload = ingredient.payload || null;
  if (!payload) return { text: `${sigil}${nucleus}`, depth: 'naive' };

  const mode = payload.role || payload.scope || '';
  const parts = [payload.family, payload.topic, payload.region, payload.liminality]
    .filter(Boolean)
    // Distinct parts only — family and topic are frequently the same token, and
    // `{about.about}` reads as a bug rather than as emphasis.
    .filter((part, index, all) => all.indexOf(part) === index);

  const text = `${sigil}${nucleus}`
    + (mode ? `[${mode}]` : '')
    + (parts.length ? `{${parts.join('.')}}` : '');

  // Payload present but empty of anything locating is still only a naive read.
  return { text, depth: mode || parts.length ? 'integrated' : 'naive' };
}

/**
 * Normalize any stored/captured item into an ingredient.
 * Mirror shape: SpwIngredient in types/spw.d.ts.
 * @param {string | Partial<{expression: string, label: string, operator: string, operand: string, wonder: string, capturedAt: number}> | null} item
 * @returns {{expression: string, label: string, operator?: string, operand?: string, wonder?: string, capturedAt: number} | null}
 */
export function normalizeIngredient(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    const split = splitOperatorExpression(item);
    return { expression: item, label: item, operand: split.operand, capturedAt: Date.now() };
  }
  const split = splitOperatorExpression(item.expression || item.label || '');
  const normalized = {
    expression: item.expression || item.label || '',
    label: item.label || item.expression || '',
    operator: item.operator || split.prefix,
    operand: item.operand || split.operand,
    wonder: item.wonder || '',
    capturedAt: item.capturedAt || Date.now(),
    ...item,
  };

  if (isNumericalConcept(normalized.expression)) {
    normalized.type = 'numerical';
    const parsed = parseNumericalValue(normalized.expression);
    if (parsed) {
      normalized.value = parsed.value;
      normalized.unit = parsed.unit;
      normalized.quantifiers = deriveNumericityQuantifiers([normalized]);
    }
  }

  return normalized;
}

export function getCauldron() {
  try {
    const raw = JSON.parse(localStorage.getItem(CAULDRON_KEY) || '[]');
    return raw.map(normalizeIngredient).filter(Boolean);
  } catch {
    return [];
  }
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[s]));
}

