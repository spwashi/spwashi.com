import { CAULDRON_KEY } from './contract.js';
import { deriveNumericityQuantifiers, isNumericalConcept, parseNumericalValue } from './helpers.js';
import { splitOperatorExpression } from '/public/js/kernel/shared.js';
import { operatorSpaces } from '/public/js/semantic/operator-spaces.js';

/* Delegates to the kernel's operator grammar (the old local regex required a
   literal backslash before ^ and ?, so those operators never matched). */
export function inferOperator(expression = '') {
  return splitOperatorExpression(expression).prefix;
}

export function inferPhaseState(operator = '', explicit = '') {
  if (explicit) {
    const norm = String(explicit).toLowerCase();
    if (norm === 'earth') return 'ground';
    if (norm === 'water') return 'fluid';
    if (norm === 'air') return 'radiant';
    if (norm === 'fire') return 'plastic';
    if (norm === 'metal') return 'lattice';
    if (norm === 'wood') return 'membrane';
    return norm;
  }
  if (operator === '#>' || operator === 'frame') return 'ground';
  if (operator === '~' || operator === 'ref') return 'fluid';
  if (operator === '?' || operator === 'probe') return 'radiant';
  if (operator === '!' || operator === '@' || operator === 'action') return 'plastic';
  if (operator === '^' || operator === 'object') return 'lattice';
  if (operator === '<' || operator === '>' || operator === 'topic' || operator === 'surface') return 'membrane';
  return 'ground';
}

export const inferElement = inferPhaseState;

export function inferTangibility(operator = '', phase = '') {
  const p = phase || inferPhaseState(operator);
  if (p === 'radiant') return 0.15;
  if (p === 'fluid') return 0.35;
  if (p === 'plastic') return 0.55;
  if (p === 'lattice') return 0.75;
  if (p === 'ground') return 0.95;
  if (p === 'membrane') return 0.50;
  return 0.50;
}

export function computeSuccession(ingredient) {
  const fixity = ingredient?.fixity || ingredient?.payload?.fixity || 'tending';
  if (fixity === 'fixed') return 'canopy';
  if (fixity === 'stable') return 'cluster';
  if (fixity === 'tending') return 'root';
  return 'spore';
}

/**
 * The sigil payload already on the element a fragment was gathered from.
 *
 * Reads the nearest payload-bearing ancestor, then fills gaps from the page's
 * own declarations, capturing fixity, thermodynamic phase, and prairie biome context.
 */
export function readSigilPayload(element) {
  const body = typeof document !== 'undefined' ? document.body : null;
  const host = element?.closest?.('[data-spw-sigil-payload-page], [data-spw-sigil-payload-scope], [data-spw-fixity], [data-spw-element], [data-spw-phase], [data-spw-biome]') || null;
  const from = (node, key) => node?.dataset?.[key] || '';

  const sigil = inferOperator(element?.textContent || '');
  const explicitFixity = from(host, 'spwFixity') || element?.closest?.('[data-spw-fixity]')?.dataset?.spwFixity || 'tending';
  const explicitPhase = from(host, 'spwPhase') || from(host, 'spwElement') || element?.closest?.('[data-spw-phase]')?.dataset?.spwPhase || inferPhaseState(sigil);
  const tangibility = inferTangibility(sigil, explicitPhase);
  const biome = from(host, 'spwBiome') || element?.closest?.('[data-spw-biome]')?.dataset?.spwBiome || from(host, 'spwRegion') || from(body, 'spwContext') || 'prairie';

  /**
   * Nearest wins. The sigil-payload attributes are written at runtime on a
   * transition and are absent from static markup entirely, so preferring them
   * and falling back to <body> reached past the specific nutrient to swallow a
   * generic one: 1,971 per-element data-spw-role values exist across the routes
   * and capture was taking the single page-level role instead.
   *
   * Ordered runtime payload, then nearest authored ancestor, then page. Each
   * step is more specific than the one after it.
   */
  const near = (attr, key) => element?.closest?.(`[${attr}]`)?.dataset?.[key] || '';

  const payload = {
    scope: from(host, 'spwSigilPayloadScope') || near('data-spw-slot', 'spwSlot'),
    page: from(host, 'spwSigilPayloadPage') || from(body, 'spwSurface'),
    family: from(host, 'spwSigilPayloadFamily') || near('data-spw-kind', 'spwKind') || from(body, 'spwPageFamily'),
    role: from(host, 'spwSigilPayloadRole') || near('data-spw-role', 'spwRole') || from(body, 'spwPageRole'),
    topic: from(host, 'spwSigilPayloadTopic') || near('data-spw-context', 'spwContext') || from(body, 'spwContext'),
    region: from(host, 'spwSigilRegion')
      || element?.closest?.('[data-spw-region]')?.dataset?.spwRegion || '',
    liminality: element?.closest?.('[data-spw-liminality]')?.dataset?.spwLiminality || '',
    // What the source could do, and what happened when it did. Nutritional
    // content for a spell: an ingredient that remembers its affordance can be
    // recomposed into something that affords the same.
    affordance: near('data-spw-affordance', 'spwAffordance'),
    consequence: near('data-spw-consequence', 'spwConsequence'),
    fixity: explicitFixity,
    phase: explicitPhase,
    element: explicitPhase,
    tangibility,
    biome,
  };

  return Object.values(payload).some(Boolean) ? payload : null;
}

/**
 * Render an ingredient in native Spw rather than as a bare label.
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
  const parts = [payload.family, payload.topic, payload.region, payload.affordance, payload.liminality, payload.phase || payload.element]
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index);

  const text = `${sigil}${nucleus}`
    + (mode ? `[${mode}]` : '')
    + (parts.length ? `{${parts.join('.')}}` : '');

  return { text, depth: mode || parts.length ? 'integrated' : 'naive' };
}

/**
 * What a gathered fragment still has room for.
 *
 * Cauldron ingredients are operator-led — capture keeps the sigil, so `~orient`
 * and `#>address` arrive with a position the kernel can read. Authored page
 * copy is not: 1 of 461 `data-spw-semantic-expression` values yields an
 * operator at all, which is why this reads ingredients and not the corpus.
 *
 * The open role is the niche — the side the operator affords and the text never
 * claimed. An ingredient that opens `current-perspective` can still take a
 * viewer; one that opens nothing is complete and cannot be extended.
 */
export function ingredientNiche(ingredient) {
  const spaces = operatorSpaces(ingredient?.expression || ingredient?.label || '');
  if (!spaces || !spaces.open.length) return null;
  return {
    position: spaces.position,
    geometry: spaces.geometry,
    open: spaces.open.map((slot) => slot.role),
  };
}


/**
 * Normalize any stored/captured item into an ingredient.
 * Mirror shape: SpwIngredient in types/spw.d.ts.
 */
export function normalizeIngredient(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    const split = splitOperatorExpression(item);
    const op = split.prefix;
    const ph = inferPhaseState(op);
    const tang = inferTangibility(op, ph);
    return {
      expression: item,
      label: item,
      operator: op,
      operand: split.operand,
      phase: ph,
      element: ph,
      tangibility: tang,
      fixity: 'tending',
      biome: 'prairie',
      succession: 'spore',
      capturedAt: Date.now(),
    };
  }
  const split = splitOperatorExpression(item.expression || item.label || '');
  const op = item.operator || split.prefix;
  const ph = item.phase || item.element || item.payload?.phase || item.payload?.element || inferPhaseState(op);
  const tang = item.tangibility || inferTangibility(op, ph);
  const fix = item.fixity || item.payload?.fixity || 'tending';
  const bio = item.biome || item.payload?.biome || 'prairie';

  const normalized = {
    expression: item.expression || item.label || '',
    label: item.label || item.expression || '',
    operator: op,
    operand: item.operand || split.operand,
    wonder: item.wonder || '',
    phase: ph,
    element: ph,
    tangibility: tang,
    fixity: fix,
    biome: bio,
    succession: item.succession || computeSuccession({ fixity: fix }),
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

let cauldronChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    cauldronChannel = new BroadcastChannel('spw-cauldron');
    cauldronChannel.onmessage = (event) => {
      if (event.data?.type === 'cauldron:sync' && typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('cauldron:updated', {
          detail: { ingredients: getCauldron(), source: 'broadcast' },
        }));
      }
    };
  }
} catch {
  /* BroadcastChannel unsupported or restricted */
}

export function broadcastCauldronSync() {
  try {
    cauldronChannel?.postMessage({ type: 'cauldron:sync', timestamp: Date.now() });
  } catch {
    /* BroadcastChannel post error */
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

