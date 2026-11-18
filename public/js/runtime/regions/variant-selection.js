/**
 * variant-selection.js
 * ---------------------------------------------------------------------------
 * Component variant marks: which panel a lens reveals, which semantic or
 * content variant a host shows, and the query override for either.
 *
 * This module does not write the lens. The lens owner (site-core-minimal via
 * runtime/page/lens-modes.js) sets aria-pressed, hidden, tabindex, and the seat
 * expression, then emits frame:mode; this module hears that change and marks
 * the variant the change revealed, pulses the root, and reports the edge as
 * spw:variant-selected. A query or an API caller that wants a lens asks the
 * owner through LENS_MODE_REQUEST_EVENT instead of touching the buttons.
 */

import { bus } from '/public/js/kernel/bus.js';
import { parseModularQuery } from '/public/js/kernel/query-composer.js';
import { matchesActiveProfile } from '/public/js/semantic/expression-query.js';
import { requestLensMode } from '../page/lens-modes.js';
import { readActiveProfile, readCandidateSpwMetadata } from '../page/lens-reach.js';
import { readMicrointeractionPulseMs } from '../physics/pulse-timing.js';

const VARIANT_CONTAINER_SELECTOR = '.spw-frame, [data-spw-kind="frame"], .spw-card, .frame-card, [data-spw-feature]';
const MODE_BUTTON_SELECTOR = '.mode-switch [data-set-mode]';
const VARIANT_EVENT = 'spw:variant-selected';
const LENS_CHANGE_EVENT = 'spw:mode-change';
const DOCUMENT_NODE = 9;

let initialized = false;
let selectionPulseTimer = null;

function readQueryVariant() {
  const { params } = parseModularQuery(window.location.search);
  return params.variant || '';
}

export function buildVariantEdge(from = '', to = '') {
  const previous = String(from || '').trim();
  const next = String(to || '').trim();
  return Object.freeze({
    from: previous || null,
    to: next || null,
    changed: Boolean(next && previous !== next),
    label: `${previous || 'enter'} → ${next || 'none'}`,
  });
}

export function resolveVariantChoice({ requested = '', pressed = '', visible = '', fallback = '' } = {}) {
  return [requested, pressed, visible, fallback]
    .map((value) => String(value || '').trim())
    .find(Boolean) || '';
}

function clearVariantMarks(scope) {
  if (!(scope instanceof Element) && !(scope instanceof Document)) return;
  scope.querySelectorAll('[data-spw-variant-selected="true"]').forEach((node) => {
    delete node.dataset.spwVariantSelected;
  });
  scope.querySelectorAll('[data-spw-component-variant-active]').forEach((node) => {
    delete node.dataset.spwComponentVariantActive;
    delete node.dataset.spwVariantSelectionSource;
  });
}

function clearGroupVariantMarks(root, group) {
  if (!group) {
    clearVariantMarks(root);
    return;
  }
  const escaped = CSS.escape(group);
  root.querySelectorAll(`[data-mode-group="${escaped}"][data-mode-panel]`).forEach((panel) => {
    delete panel.dataset.spwVariantSelected;
    const host = panel.closest(VARIANT_CONTAINER_SELECTOR);
    if (host instanceof HTMLElement) {
      delete host.dataset.spwComponentVariantActive;
      delete host.dataset.spwVariantSelectionSource;
    }
  });
}

function variantFromPanel(panel) {
  if (!(panel instanceof HTMLElement)) return '';
  return panel.dataset.spwSemanticVariant
    || panel.dataset.spwContentVariant
    || panel.getAttribute('data-mode-panel')
    || panel.id
    || '';
}

function pulseRootSelection(html, source, variant) {
  if (!(html instanceof HTMLElement)) return;
  html.dataset.spwVariantSelectionSource = source;
  html.dataset.spwVariantSelectionPulse = variant || source;
  html.dataset.spwVariantSelectionWeight = 'raised';

  if (selectionPulseTimer) window.clearTimeout(selectionPulseTimer);
  const pulseMs = readMicrointeractionPulseMs(html.ownerDocument || document);
  selectionPulseTimer = window.setTimeout(() => {
    delete html.dataset.spwVariantSelectionPulse;
    delete html.dataset.spwVariantSelectionWeight;
    delete html.dataset.spwVariantSelectionSource;
  }, pulseMs);
}

function applyVariant(host, variant, source = 'mode', options = {}) {
  if (!(host instanceof HTMLElement) || !variant) return;

  host.dataset.spwComponentVariantActive = variant;
  host.dataset.spwVariantSelectionSource = source;

  const selector = [
    `[data-mode-panel="${CSS.escape(variant)}"]`,
    `[data-spw-semantic-variant="${CSS.escape(variant)}"]`,
    `[data-spw-content-variant="${CSS.escape(variant)}"]`,
  ].join(', ');
  const panel = host.matches(selector) ? host : host.querySelector(selector);

  if (options.markSelected !== false && panel instanceof HTMLElement) {
    panel.dataset.spwVariantSelected = 'true';
  }

  return panel instanceof HTMLElement ? panel : null;
}

function emitVariantSelected(detail) {
  document.dispatchEvent(new CustomEvent(VARIANT_EVENT, {
    detail,
    bubbles: true,
  }));
}

function readGroupPanels(group, root) {
  return [...root.querySelectorAll(`[data-mode-group="${CSS.escape(group)}"][data-mode-panel]`)];
}

function readActiveMode(group, root) {
  const escaped = CSS.escape(group);
  const buttons = [...root.querySelectorAll(`.mode-switch [data-mode-group="${escaped}"][data-set-mode]`)];
  const panels = readGroupPanels(group, root);
  const pressed = buttons.find((button) => button.getAttribute('aria-pressed') === 'true');
  const visible = panels.find((panel) => !panel.hidden);
  return resolveVariantChoice({
    pressed: pressed?.getAttribute('data-set-mode'),
    visible: visible?.getAttribute('data-mode-panel'),
  });
}

/* Mark the panel a lens change revealed. Returns the panel, or null when the
   group has no panel for that mode. */
function markGroupVariant(group, mode, root, source) {
  const panel = readGroupPanels(group, root).find((candidate) => candidate.getAttribute('data-mode-panel') === mode);
  if (!panel) return null;
  clearGroupVariantMarks(root, group);
  const host = panel.closest(VARIANT_CONTAINER_SELECTOR) || panel;
  applyVariant(host, variantFromPanel(panel), source, { markSelected: false });
  panel.dataset.spwVariantSelected = 'true';
  return panel;
}

function onLensChange(event, root) {
  const detail = event?.detail || {};
  const group = detail.group || detail.groupName || '';
  const mode = detail.mode || '';
  if (!group || !mode) return;
  const source = detail.source || 'mode-switch';
  if (!markGroupVariant(group, mode, root, source)) return;
  // The boot pass restates authored state; it is not a selection anyone made.
  if (source === 'initial') return;
  const previous = detail.previousMode || null;
  const html = root.documentElement || document.documentElement;
  pulseRootSelection(html, source, mode);
  emitVariantSelected({
    group,
    variant: mode,
    previousVariant: previous,
    edge: buildVariantEdge(previous, mode),
    source,
  });
}

/* Ask the lens owner for a mode. Returns the edge the request would traverse,
   or null when the group has no such mode; the marks and the event follow
   from the owner's frame:mode, not from here. */
export function selectMode(button, root = document, source = 'mode-switch') {
  if (!(button instanceof HTMLElement)) return null;
  const group = button.getAttribute('data-mode-group');
  const mode = button.getAttribute('data-set-mode');
  if (!group || !mode) return null;
  if (!readGroupPanels(group, root).some((panel) => panel.getAttribute('data-mode-panel') === mode)) return null;
  const previous = readActiveMode(group, root);
  requestLensMode(bus, { group, mode, source });
  return buildVariantEdge(previous, mode);
}

export function resolveMeasureTierVariant(measureBandOrTier = '', variantMap = {}, fallback = '') {
  const key = String(measureBandOrTier || '').trim().toLowerCase();
  if (key && variantMap && Object.prototype.hasOwnProperty.call(variantMap, key)) {
    return variantMap[key];
  }
  return fallback;
}

function readCandidateVariantName(candidate) {
  if (!candidate || typeof candidate !== 'object') return '';
  if (typeof candidate.getAttribute === 'function') {
    return (
      candidate.getAttribute('data-mode-panel')
      || candidate.dataset?.spwSemanticVariant
      || candidate.dataset?.spwContentVariant
      || ''
    );
  }
  return String(candidate.variant || candidate.mode || candidate.name || '').trim();
}

export function selectProfileBiasedVariant(candidates = [], profile = {}) {
  if (!Array.isArray(candidates) || !candidates.length || !profile) return null;
  const hasAnySignal = Boolean(
    profile.lens
    || profile.sustainedLens
    || profile.themePack
    || profile.colorMode
    || profile.posture
    || profile.flavor
    || profile.authorMode
    || profile.operator
    || profile.climate
    || profile.stance,
  );
  if (!hasAnySignal) return null;

  let best = null;
  for (const candidate of candidates) {
    const meta = typeof candidate?.getAttribute === 'function'
      ? readCandidateSpwMetadata(candidate)
      : {
          expression: candidate?.expression || '',
          lensPass: candidate?.lensPass || '',
          copyLens: candidate?.copyLens || '',
          variant: candidate?.variant || candidate?.mode || '',
          themeAffinity: candidate?.themeAffinity || '',
          operator: candidate?.operator || '',
        };
    const match = matchesActiveProfile(meta, profile);
    const variant = readCandidateVariantName(candidate);
    if (!variant || !match.matched) continue;
    if (!best || match.score > best.score) {
      best = {
        variant,
        score: match.score,
        reasons: match.reasons,
        matchedTerms: match.matchedTerms,
        candidate,
      };
    }
  }
  return best;
}

function primeFromQuery(root) {
  const variant = readQueryVariant();
  if (!variant) return;

  const target = root.querySelector(`[data-spw-semantic-variant="${CSS.escape(variant)}"]`)
    || root.querySelector(`[data-spw-content-variant="${CSS.escape(variant)}"]`)
    || root.querySelector(`[data-mode-panel="${CSS.escape(variant)}"]`);

  if (!(target instanceof HTMLElement)) return;

  const html = root.documentElement || document.documentElement;
  html.dataset.spwQueryVariant = variant;

  const group = target.getAttribute('data-mode-group');
  if (group) {
    // A lens panel: the owner writes the lens and this module marks the
    // variant when frame:mode arrives.
    requestLensMode(bus, { group, mode: target.getAttribute('data-mode-panel') || variant, source: 'query' });
    return;
  }

  const host = target.closest(VARIANT_CONTAINER_SELECTOR) || target;
  const previous = host.dataset.spwComponentVariantActive || '';
  clearVariantMarks(host);
  applyVariant(host, variant, 'query');
  pulseRootSelection(html, 'query', variant);
  emitVariantSelected({
    group: null,
    variant,
    previousVariant: previous || null,
    edge: buildVariantEdge(previous, variant),
    source: 'query',
  });
}

export function initVariantSelection(root = document) {
  if (initialized) return () => {};
  initialized = true;

  const controller = new AbortController();
  clearVariantMarks(root);

  const groups = new Set(
    [...root.querySelectorAll(MODE_BUTTON_SELECTOR)]
      .map((button) => button.getAttribute('data-mode-group'))
      .filter(Boolean),
  );
  groups.forEach((group) => {
    const mode = readActiveMode(group, root);
    if (mode) markGroupVariant(group, mode, root, 'authored');
  });

  root.querySelectorAll('[data-spw-semantic-variant], [data-spw-content-variant]')
    .forEach((host) => {
      if (host.hasAttribute('data-mode-group')) return;
      const variant = host.dataset.spwSemanticVariant || host.dataset.spwContentVariant;
      if (variant) applyVariant(host, variant, 'authored', { markSelected: false });
    });

  // Query intent wins after authored defaults have established each group's
  // local starting point, preserving a truthful from → to edge in the event.
  primeFromQuery(root);

  const biasVariantsFromProfile = (trigger = 'profile') => {
    if (readQueryVariant()) return;
    const profile = readActiveProfile(root);
    if (!profile.isCustom) return;

    const standalone = [...root.querySelectorAll('[data-spw-semantic-variant], [data-spw-content-variant]')]
      .filter((host) => !host.hasAttribute('data-mode-group'));
    if (standalone.length > 1) {
      const siblingsByParent = new Map();
      for (const node of standalone) {
        const container = node.parentElement || root;
        if (!siblingsByParent.has(container)) siblingsByParent.set(container, []);
        siblingsByParent.get(container).push(node);
      }
      for (const siblings of siblingsByParent.values()) {
        if (siblings.length < 2) continue;
        const winner = selectProfileBiasedVariant(siblings, profile);
        if (!winner) continue;
        for (const sibling of siblings) {
          const isWin = sibling === winner.candidate;
          if (isWin) applyVariant(sibling, winner.variant, 'profile');
          else if (sibling.dataset?.spwVariantSelected) delete sibling.dataset.spwVariantSelected;
        }
      }
    }

    const html = root.documentElement || document.documentElement;
    const activeSource = html?.dataset?.spwActiveLensSource || '';
    if (activeSource === 'mode-switch' || activeSource === 'keyboard' || activeSource === 'query') return;
    for (const group of groups) {
      const panels = readGroupPanels(group, root);
      if (panels.length < 2) continue;
      const biased = selectProfileBiasedVariant(panels, profile);
      if (!biased || biased.score < 4) continue;
      const current = readActiveMode(group, root);
      if (biased.variant !== current) {
        requestLensMode(bus, { group, mode: biased.variant, source: trigger === 'settings' ? 'profile' : trigger });
      }
    }
  };

  biasVariantsFromProfile('profile');

  const onChange = (event) => onLensChange(event, root);
  document.addEventListener(LENS_CHANGE_EVENT, onChange, { signal: controller.signal });
  const offSettings = bus.on('settings:changed', () => biasVariantsFromProfile('settings'));

  controller.signal.addEventListener('abort', () => {
    if (typeof offSettings === 'function') offSettings();
    if (selectionPulseTimer) window.clearTimeout(selectionPulseTimer);
    selectionPulseTimer = null;
    const html = root.documentElement || document.documentElement;
    delete html.dataset.spwVariantSelectionPulse;
    delete html.dataset.spwVariantSelectionWeight;
    delete html.dataset.spwVariantSelectionSource;
    initialized = false;
  }, { once: true });

  return () => controller.abort();
}

export { VARIANT_EVENT };

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'variant-selection',
  updates: Object.freeze([
    'structural:data-spw-variant-selected',
    'structural:data-spw-component-variant-active',
    'structural:data-spw-variant-selection-source',
    'structural:data-spw-query-variant',
    'flourish:data-spw-variant-selection-pulse',
    'flourish:data-spw-variant-selection-weight',
  ]),
  mount(ctx, root) {
    // Variant marks follow every lens on the page, so the scope is the
    // document whichever host the catalog matched first.
    const targetRoot = root?.nodeType === DOCUMENT_NODE
      ? root
      : root?.ownerDocument || ctx?.root?.ownerDocument || document;
    return initVariantSelection(targetRoot);
  },
});

export const spwModule = SPW_MODULE_EXPORT;
