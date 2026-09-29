/**
 * image-ingredient.js — a picture gathered into the cauldron keeps its name.
 *
 * A primed scan used to arrive as text only: haptics already treated
 * [data-spw-image-key] as a candidate, but capture kept no key, shape or
 * provenance, so the chip could not show what was held. This reads the image
 * stems the page already authors (data-spw-image-key/-shape/-surface/-model/
 * -prominence) plus the path stem of the picture, and nothing else.
 *
 * Only the key and stem are stored — never a src and never a data: URI — so a
 * held picture costs a few bytes of localStorage. The thumbnail is resolved at
 * render time from the tier word the picture was served at (thumb, else the
 * display/hero tier itself, which is known to exist), and kind/tool
 * are re-read from the stem each time, the same way image-provenance.js marks
 * the page: provenance is read, never restored from a stored copy.
 *
 * Component variants ride along the same way. variant-selection.js reports
 * spw:variant-selected; this module remembers the edge per group, and a capture
 * made inside the selected variant carries { expression, variant, previous }
 * so a compare-intent mix can name two variants of one component.
 *
 * Contract: .spw/conventions/site-semantics.spw #image_provenance.
 */

import { classifyImageSource } from '/public/js/runtime/expression/image-provenance.js';
import { IMAGE_PROVENANCE_RECORDS } from '/public/js/generated/image-provenance.js';
import { clusterIngredientsByTheme, composePromptDraft } from '/public/js/semantic/cauldron/storage.js';

const IMAGE_HOST_SELECTOR = '[data-spw-image-key], figure';
/* The derivative suffixes scripts/image-resource-manifest.mjs names, plus the
   scan tier the folio pipeline writes. A stem is the path without them. */
const TIER_RE = /-(thumb|display|hero|scan|icon|large|square|og|full)$/;
const SERVED_TIER_RE = /-(thumb|display|hero)\.(?:avif|webp|png|jpe?g)(?:[?#\s]|$)/;
const MODEL_LIMIT = 160;

/** '/public/images/assets/folios/folio-bone-box-display.webp?v=2' → '/public/images/assets/folios/folio-bone-box'. */
export function imageStemFromSource(src = '') {
  const value = String(src || '').trim();
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) return '';
  const at = value.indexOf('/public/images/');
  if (at < 0) return '';
  const path = value.slice(at).split(/[?#\s]/)[0];
  return path.replace(/\.[a-z0-9]+$/i, '').replace(TIER_RE, '');
}

/* The longest recorded stem wins, as in image-provenance.js; that module keeps
   its lookup private, so only the tool is read here and the kind comes from
   classifyImageSource itself. */
function recordedTool(stem) {
  let best = null;
  for (const record of IMAGE_PROVENANCE_RECORDS) {
    if ((stem === record.stem || stem.startsWith(`${record.stem}-`)) && (!best || record.stem.length > best.stem.length)) best = record;
  }
  return best?.tool || null;
}

/** Kind, sigil and tool for a stem, or null when nothing records how it was made. */
export function readImageProvenance(stem = '') {
  if (!stem) return null;
  const rule = classifyImageSource(`${stem}.webp`);
  if (!rule) return null;
  return {
    kind: rule.kind,
    sigil: rule.sigil,
    tool: rule.kind === 'generated' ? recordedTool(stem) : null,
  };
}

function baseName(stem = '') {
  return String(stem).split('/').pop() || '';
}

function imageOf(element, host) {
  if (element?.tagName === 'IMG') return element;
  return host?.querySelector?.('img') || null;
}

function srcCandidates(img) {
  if (!img) return [];
  const sources = [img.currentSrc, img.getAttribute?.('src'), img.getAttribute?.('data-src'), img.getAttribute?.('srcset')];
  const picture = img.parentElement?.tagName === 'PICTURE' ? img.parentElement : null;
  picture?.querySelectorAll?.('source')?.forEach?.((source) => sources.push(source.getAttribute?.('srcset')));
  return sources.filter(Boolean).map(String);
}

/**
 * The image ingredient an element is or sits in, or null.
 * @param {Element|null} element
 * @returns {{key:string, shape:string, surface:string, model:string, prominence:string, stem:string, kind:string|null, tool:string|null, tier:string}|null}
 */
export function readImageIngredient(element) {
  if (!element || typeof element.closest !== 'function') return null;
  const host = element.closest(IMAGE_HOST_SELECTOR);
  const img = imageOf(element, host);
  if (!host && !img) return null;

  const data = host?.dataset || {};
  const sources = srcCandidates(img);
  const stem = sources.map(imageStemFromSource).find(Boolean) || '';
  /* image-metaphysics writes a src pathname into the key when none was
     authored; a key that is a path is a src, so the stem's name stands in. */
  const authored = String(data.spwImageKey || '').trim();
  const key = authored && !/[/:]/.test(authored) ? authored : baseName(stem);
  if (!key && !stem) return null;

  const provenance = readImageProvenance(stem);
  return {
    key,
    shape: data.spwImageShape || '',
    surface: data.spwImageSurface || '',
    model: String(data.spwImageModel || '').slice(0, MODEL_LIMIT),
    prominence: data.spwImageProminence || '',
    stem,
    kind: provenance?.kind || null,
    tool: provenance?.tool || null,
    tier: stem ? servedTier(sources) : '',
  };
}

/* The smallest tier word any candidate was served at: 'thumb' when a thumb was
   in the srcset, else 'display' or 'hero'. 31 published display/hero pictures
   have no -thumb sibling, so a display tier never implies a thumb. */
function servedTier(sources = []) {
  const tiers = sources.map((src) => SERVED_TIER_RE.exec(src)?.[1]).filter(Boolean);
  return ['thumb', 'display', 'hero'].find((tier) => tiers.includes(tier)) || '';
}

/**
 * A thumb URL for a stored image record, or null. `known` is an optional set of
 * published paths (public/data/image-resources.json images[].path) for callers
 * that have it loaded; it lets a -thumb win even when a larger tier was served.
 * Without it only the tier the picture was served at is trusted: every
 * published display/hero tier has a .webp, but not every one has a -thumb.
 */
export function resolveImageThumb(record, known = null) {
  const stem = record?.stem;
  if (!stem || !stem.startsWith('/public/images/')) return null;
  const tier = ['thumb', 'display', 'hero'].includes(record.tier) ? record.tier : '';
  if (known && typeof known.has === 'function') {
    const candidates = [`${stem}-thumb.webp`, `${stem}-thumb.avif`, ...(tier ? [`${stem}-${tier}.webp`] : [])];
    return candidates.find((path) => known.has(path)) || null;
  }
  return tier ? `${stem}-${tier}.webp` : null;
}

/** The words the provenance mark carries: 'scan', the tool, or 'generated'. */
export function describeImageProvenance(record) {
  const provenance = readImageProvenance(record?.stem);
  if (!provenance) return null;
  if (provenance.kind === 'original') return { ...provenance, word: 'scan', label: `Original artwork, scan of ${record.key || baseName(record.stem)}` };
  const word = provenance.tool || 'generated';
  return { ...provenance, word, label: provenance.tool ? `Generated with ${provenance.tool}` : 'Generated image' };
}

/** Thumbnail + provenance mark for a cauldron chip; '' when the ingredient holds no picture. */
export function renderImageIngredientMarkup(record, escape = (value) => String(value)) {
  if (!record?.key && !record?.stem) return '';
  const thumb = resolveImageThumb(record);
  const provenance = describeImageProvenance(record);
  const img = thumb
    ? `<img class="spw-cauldron-ingredient__thumb" src="${escape(thumb)}" alt="" loading="lazy" decoding="async" width="28" height="28">`
    : '';
  const mark = provenance
    ? `<span class="spw-cauldron-ingredient__provenance spw-cauldron-ingredient__provenance--${escape(provenance.kind)}" role="img" aria-label="${escape(provenance.label)}" title="${escape(provenance.label)}">${escape(provenance.sigil)}</span>`
    : '';
  return img + mark;
}

/** One line per held picture, pointing a prompt back at what it came from. */
export function imageProvenanceLines(ingredients = []) {
  const lines = [];
  for (const ingredient of ingredients) {
    const record = ingredient?.payload?.image;
    if (!record) continue;
    const name = baseName(record.stem) || record.key;
    const provenance = readImageProvenance(record.stem);
    if (provenance?.kind === 'original') lines.push(`from scan ${name}`);
    else if (provenance?.kind === 'generated') lines.push(`after ${provenance.tool || 'a generated render'} ${name}`);
    else if (name) lines.push(`from picture ${name}`);
  }
  return [...new Set(lines)];
}

/**
 * The vision-bench seed: one draft per theme cluster (as composeVisionDrafts
 * reads them), then the unclustered remainder as a last draft so every held
 * fragment still reaches the prompt, as the old expression list did. Provenance
 * lines therefore never name a scan whose fragment is missing.
 *
 * `use` and the trace line are the caller's authored copy; `traceFirst` keeps
 * the spell-trail order (trace, then use) apart from the daily one.
 */
export function composeVisionSeed(ingredients = [], {
  lead = 'Daily observation as vision',
  gestureHistory = '',
  traceLabel = 'Gesture history',
  use = '',
  traceFirst = false,
} = {}) {
  const groups = clusterIngredientsByTheme(ingredients).groups || [];
  const drafts = groups.filter((group) => group.clustered)
    .map((group) => composePromptDraft(group.items))
    .filter(Boolean);
  const loose = groups.filter((group) => !group.clustered).flatMap((group) => group.items);
  const remainder = composePromptDraft(drafts.length ? loose : ingredients.map((ingredient) => ({ ingredient })));
  if (remainder) drafts.push(remainder);
  const provenance = imageProvenanceLines(ingredients);
  const parts = [`${lead}: ${drafts.join(' / ') || 'an open gathering'}.`];
  if (provenance.length) parts.push(`${provenance.join('; ')}.`);
  const trace = `${traceLabel}: ${gestureHistory || 'direct'}.`;
  const tail = use ? [use] : [];
  parts.push(...(traceFirst ? [trace, ...tail] : [...tail, trace]));
  return { prompt: parts.join(' '), drafts, provenance };
}

/* ── Component variants ─────────────────────────────────────────────────── */

const variantMemory = new Map();

/** Remember the last variant edge per group (null group = query selection). */
export function rememberVariantSelection(detail = {}) {
  const variant = String(detail.variant || '').trim();
  if (!variant) return;
  variantMemory.set(detail.group || variant, {
    variant,
    previous: detail.previousVariant || detail.edge?.from || null,
  });
}

/** Listen for spw:variant-selected; returns the unsubscribe. */
export function watchVariantSelections(target = typeof document !== 'undefined' ? document : null) {
  if (!target?.addEventListener) return () => {};
  const onSelected = (event) => rememberVariantSelection(event?.detail);
  target.addEventListener('spw:variant-selected', onSelected);
  return () => target.removeEventListener('spw:variant-selected', onSelected);
}

/** The selected component variant a capture sits in, when it names an expression. */
export function readVariantIngredient(element) {
  if (!element || typeof element.closest !== 'function') return null;
  const panel = element.closest('[data-spw-variant-selected="true"]');
  const host = element.closest('[data-spw-component-variant-active]');
  const expression = panel?.dataset?.spwSemanticExpression || host?.dataset?.spwSemanticExpression || '';
  if (!expression || (!panel && !host)) return null;
  const variant = host?.dataset?.spwComponentVariantActive
    || panel?.dataset?.spwSemanticVariant
    || panel?.dataset?.spwContentVariant
    || panel?.getAttribute?.('data-mode-panel')
    || '';
  const group = panel?.getAttribute?.('data-mode-group') || null;
  const heard = variantMemory.get(group || variant);
  return {
    expression,
    variant,
    group,
    previous: heard && heard.variant === variant ? heard.previous : null,
  };
}

/** Capture payload with the held picture and variant attached, when present. */
export function enrichCapturePayload(payload, element) {
  const image = readImageIngredient(element);
  const variant = readVariantIngredient(element);
  if (!image && !variant) return payload;
  return {
    ...(payload || {}),
    ...(image ? { image } : {}),
    ...(variant ? { variant } : {}),
  };
}
