import { CAULDRON_KEY } from './contract.js';
import { deriveNumericityQuantifiers, isNumericalConcept, parseNumericalValue } from './helpers.js';
import { getOperatorThresholdState, splitOperatorExpression } from '/public/js/kernel/shared.js';
import { operatorSpaces } from '/public/js/semantic/operator-spaces.js';
import { CAULDRON_REGISTERS, project } from './registers.js';

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
    // Editorial rhythm travels with the ingredient that was gathered. These
    // are authored annotations, not a due-date calculation or cauldron clock.
    cadence: near('data-spw-cadence', 'spwCadence'),
    cadenceMotion: near('data-spw-cadence-motion', 'spwCadenceMotion'),
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

  /**
   * Three slots, three meanings. The previous form joined six payload values
   * with dots into one body, where nothing distinguished a region from an
   * affordance and a reader had to know the order. The grammar already carries
   * the distinctions:
   *
   *   [frame]        how it is read — its role, and what it affords
   *   {body}         where it sits — region and the shell it stood in
   *   <projection>   what it leaves behind — its consequence
   *
   * Everything else stays on the payload. The expression is a reading, not a
   * dump of every field capture happened to resolve.
   */
  const distinct = (values) => values
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);

  const frame = distinct([payload.role || payload.scope, payload.affordance]);
  const body = distinct([payload.region, payload.liminality, !payload.region ? payload.topic : '']);
  const projection = payload.consequence || '';

  const text = `${sigil}${nucleus}`
    + (frame.length ? `[${frame.join('.')}]` : '')
    + (body.length ? `{${body.join('.')}}` : '')
    + (projection ? `<${projection}>` : '');

  const located = frame.length || body.length || projection;
  return { text, depth: located ? 'integrated' : 'naive' };
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
 * A route key in the form public/data/site-search-index.json uses: leading and
 * trailing slash, no query, no hash. Normalizing here is what lets a gathered
 * fragment be looked up against the index at all — the two halves have to agree
 * on what a route is called before they can be joined.
 *
 * @param {string} pathname
 * @returns {string} '' when there is nothing usable to normalize
 */
export function normalizeRoute(pathname = '') {
  const raw = String(pathname || '').split('#')[0].split('?')[0].trim();
  if (!raw || !raw.startsWith('/')) return '';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

/**
 * Where a fragment was gathered from.
 *
 * Capture already resolved a deep link, but it stored it as one opaque href.
 * That is enough to follow and not enough to reason about: you cannot ask which
 * routes a gathering spans, group ingredients by origin, or join against the
 * search index with a string like "/design/?x=1#slots".
 *
 * Derived rather than captured, so it back-fills. Every ingredient saved before
 * this existed still has its deepLink, so reading provenance out of that on load
 * gives the whole existing cauldron provenance without a migration.
 *
 * Deliberately returns null when there is no deep link to read. The alternative
 * — defaulting to the current location — would silently claim that a fragment
 * gathered three routes ago came from whatever page you happen to be standing
 * on now, which is worse than admitting the origin is unknown.
 *
 * @param {{deepLink?: string｜null}} ingredient
 * @returns {{route: string, anchor: string, href: string}|null}
 */
export function deriveProvenance(ingredient) {
  const href = ingredient?.deepLink ? String(ingredient.deepLink) : '';
  if (!href) return null;

  const hashIndex = href.indexOf('#');
  const anchor = hashIndex >= 0 ? href.slice(hashIndex + 1) : '';
  const route = normalizeRoute(hashIndex >= 0 ? href.slice(0, hashIndex) : href);
  if (!route) return null;

  return { route, anchor, href };
}

/**
 * Partial clustering — a reading of gathered payloads, not a second store.
 *
 * Only axes the ingredient already carries may group it. Groups of one stay
 * unclustered. The winning axis is the one that clusters the most fragments
 * without collapsing the whole gathering into a single blob.
 */
export const CLUSTER_AXES = Object.freeze(['operator', 'region', 'liminality', 'route']);

/**
 * Editorial axes — the idea-coordinates a picked living term carries (which
 * topic it belongs to, which open question it touches, which page context it
 * was moseyed from), distinct from the structural axes above (operator,
 * region, liminality, route). Kept as a second, separately-named set rather
 * than merged into CLUSTER_AXES: merging would change which axis
 * clusterIngredients() picks by default, and resonance.js reads
 * clusterIndexByExpression off exactly that default to stagger the live
 * gather pulse — a felt change belongs behind its own demo, not a silent
 * axis swap. clusterIngredientsByTheme below is the additive, opt-in path.
 */
export const EDITORIAL_CLUSTER_AXES = Object.freeze(['group', 'wonder', 'context']);

export function readClusterKey(ingredient, axis = 'operator') {
  if (!ingredient) return '';
  if (axis === 'operator') {
    const raw = ingredient.operator || inferOperator(ingredient.expression || '') || '';
    if (!raw) return '';
    return getOperatorThresholdState(raw)?.operator || String(raw).toLowerCase();
  }
  if (axis === 'region') return String(ingredient.payload?.region || '').trim();
  if (axis === 'liminality') return String(ingredient.payload?.liminality || '').trim();
  if (axis === 'route') return String(ingredient.provenance?.route || deriveProvenance(ingredient)?.route || '').trim();
  return '';
}

/**
 * Editorial reading of the same ingredient: what it is *about* rather than
 * where it structurally sits. `group`/`wonder`/`context` are already carried
 * on every gathered fragment — buildSemanticDetail in interface/haptics.js
 * sets them from data-spw-ground-group/domain/vocab, data-spw-wonder, and
 * data-spw-context at the moment a living term is primed — so this reads
 * existing signal rather than inventing new markup.
 */
export function readEditorialClusterKey(ingredient, axis = 'group') {
  if (!ingredient) return '';
  if (axis === 'group') return String(ingredient.group || '').trim().toLowerCase();
  if (axis === 'wonder') return String(ingredient.wonder || '').trim().toLowerCase();
  if (axis === 'context') return String(ingredient.context || '').trim().toLowerCase();
  return '';
}

/**
 * Groups gathered ingredients along whichever `axes` entry clusters the most
 * fragments (a reading of gathered payloads, not a second store). Only axes
 * an ingredient already carries may group it; groups of one stay unclustered.
 * `axes`/`keyFn` default to the structural reading so every existing caller
 * (clusterIndexByExpression, and resonance.js's live pulse through it) keeps
 * its exact prior behavior; pass EDITORIAL_CLUSTER_AXES/readEditorialClusterKey
 * (or use clusterIngredientsByTheme) for the idea-level reading instead.
 */
export function clusterIngredients(ingredients = [], axes = CLUSTER_AXES, keyFn = readClusterKey) {
  const items = Array.isArray(ingredients) ? ingredients.filter(Boolean) : [];
  if (items.length < 2) {
    return {
      axis: null,
      groups: items.length
        ? [{
          axis: null,
          key: '',
          clustered: false,
          items: items.map((ingredient, index) => ({ ingredient, index })),
        }]
        : [],
    };
  }

  let best = null;
  for (const axis of axes) {
    const buckets = new Map();
    items.forEach((ingredient, index) => {
      const key = keyFn(ingredient, axis);
      if (!key) return;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(index);
      else buckets.set(key, [index]);
    });
    const clusteredBuckets = [...buckets.entries()].filter(([, indices]) => indices.length >= 2);
    const clusteredCount = clusteredBuckets.reduce((n, [, indices]) => n + indices.length, 0);
    const groupCount = clusteredBuckets.length;
    if (clusteredCount < 2) continue;
    if (
      !best
      || clusteredCount > best.clusteredCount
      || (clusteredCount === best.clusteredCount && groupCount > best.groupCount)
    ) {
      best = { axis, buckets, clusteredCount, groupCount };
    }
  }

  if (!best) {
    return {
      axis: null,
      groups: [{
        axis: null,
        key: '',
        clustered: false,
        items: items.map((ingredient, index) => ({ ingredient, index })),
      }],
    };
  }

  const clusteredIndices = new Set();
  const emittedKeys = new Set();
  const groups = [];

  items.forEach((ingredient) => {
    const key = keyFn(ingredient, best.axis);
    const bucket = key ? best.buckets.get(key) : null;
    if (!bucket || bucket.length < 2 || emittedKeys.has(key)) return;
    emittedKeys.add(key);
    bucket.forEach((memberIndex) => clusteredIndices.add(memberIndex));
    groups.push({
      axis: best.axis,
      key,
      clustered: true,
      items: bucket.map((memberIndex) => ({ ingredient: items[memberIndex], index: memberIndex })),
    });
  });

  const remainder = items
    .map((ingredient, index) => ({ ingredient, index }))
    .filter(({ index }) => !clusteredIndices.has(index));
  if (remainder.length) {
    groups.push({
      axis: best.axis,
      key: '',
      clustered: false,
      items: remainder,
    });
  }

  return { axis: best.axis, groups };
}

/** Idea-level reading: same algorithm, editorial axes and key reader. */
export function clusterIngredientsByTheme(ingredients = []) {
  return clusterIngredients(ingredients, EDITORIAL_CLUSTER_AXES, readEditorialClusterKey);
}

/**
 * Signed charge of a cluster, as the theme-resonance sheet already paints:
 * credit (wonder opens), spend (action/binding commits), or ambient.
 */
export function themeClusterCharge(items = []) {
  const sum = items.reduce((total, entry) => {
    const ingredient = entry?.ingredient || entry;
    return total + (CAULDRON_REGISTERS.valence.read(ingredient) || 0);
  }, 0);
  if (sum > 0) return 'credit';
  if (sum < 0) return 'spend';
  return '';
}

/**
 * One theme cluster's fragments read out as plain, comma-joined phrases — raw
 * material for an external art tool (Midjourney, Grok Imagine), not a
 * finished prompt. `text` (the moseyed prose) wins over `label` (a chip's
 * name) because a picked word is closer to the source than its category is.
 * Order follows capture order, not alphabetical — a mosey has its own order
 * and an art tool reads left-to-right same as a person composing one does.
 */
export function composePromptDraft(groupItems = []) {
  const phrases = groupItems
    .map(({ ingredient }) => String(ingredient?.text || ingredient?.label || '').trim())
    .filter(Boolean);
  return [...new Set(phrases)].join(', ');
}

/**
 * The gathering read as vision-bench material: one prompt draft per theme
 * cluster the ingredients actually form, skipping the unclustered remainder
 * (a fragment with nothing to combine with is not yet a prompt). This is the
 * real backing for CAULDRON_CONTRACT.actions.vision — "Send the gathering to
 * the Midjourney vision bench" — which has named the action since before
 * anything computed what to send.
 */
export function composeVisionDrafts(ingredients = []) {
  const themed = clusterIngredientsByTheme(ingredients);
  return themed.groups
    .filter((group) => group.clustered)
    .map((group) => ({
      axis: group.axis,
      key: group.key,
      prompt: composePromptDraft(group.items),
    }));
}

/**
 * Conceptual cluster ordinal per expression. Kin share an index so page-source
 * twinkles fire together; unclustered fragments keep a unique later ordinal.
 */
export function clusterIndexByExpression(ingredients = []) {
  const clustered = clusterIngredients(ingredients);
  const map = new Map();
  let ordinal = 0;
  for (const group of clustered.groups) {
    if (group.clustered) {
      for (const { ingredient } of group.items) {
        if (ingredient?.expression) map.set(ingredient.expression, ordinal);
      }
      ordinal += 1;
    } else {
      for (const { ingredient } of group.items) {
        if (ingredient?.expression) map.set(ingredient.expression, ordinal);
        ordinal += 1;
      }
    }
  }
  return map;
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
  const fix = item.fixity || item.payload?.fixity || 'tending';
  const bio = item.biome || item.payload?.biome || 'prairie';

  /**
   * Coordinates first, then the spread, then projections last.
   *
   * The spread used to come last, so a stored copy of a derived value beat the
   * freshly computed one and any drift became permanent. `element`,
   * `tangibility` and `succession` carry no information their sources do not —
   * they are views — so they are recomputed here after the spread rather than
   * restored from it. A stored ingredient from any earlier schema still loads;
   * it just cannot contradict itself any more.
   */
  const carried = {
    expression: item.expression || item.label || '',
    label: item.label || item.expression || '',
    operator: op,
    operand: item.operand || split.operand,
    wonder: item.wonder || '',
    phase: ph,
    fixity: fix,
    biome: bio,
    capturedAt: item.capturedAt || Date.now(),
    ...item,
  };

  const normalized = {
    ...carried,
    // Coordinates the registers own, re-read after the spread so the stored shape
    // cannot override them.
    phase: ph,
    fixity: fix,
    biome: bio,
    ...project(carried),
  };

  /* Derived after the spread for the same reason the registers are: provenance
     is a reading of deepLink, not an independent fact, so a stored copy must not
     be able to disagree with the link it came from. */
  normalized.provenance = deriveProvenance(carried);

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
  if (typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function') {
    cauldronChannel = new window.BroadcastChannel('spw-cauldron');
    /* Node's BroadcastChannel (unlike a browser tab's) keeps the event loop
       alive on its own; unref lets a Node process/test runner exit normally.
       Browsers have no `unref`, so this is a no-op there. */
    cauldronChannel.unref?.();
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
