/**
 * variant-selection.js
 * ---------------------------------------------------------------------------
 * Component variant selection: mode panels, semantic variants, query override.
 * Couples selection to measure/frame theory via selection weight + micro pulse.
 */

import { observeAddedMatches } from '/public/js/kernel/dom-contracts.js';
import { parseModularQuery } from '/public/js/kernel/query-composer.js';
import { queryParamsToSettingsPartial } from '/public/js/kernel/settings-query-parity.js';
import { readMicrointeractionPulseMs } from './pulse-beat-tuner.js';

const VARIANT_CONTAINER_SELECTOR = '.site-frame, .frame-card, [data-spw-feature]';
const MODE_BUTTON_SELECTOR = '.mode-switch [data-set-mode]';
const VARIANT_EVENT = 'spw:variant-selected';

let initialized = false;
let selectionPulseTimer = null;

function readQueryVariant() {
  const { params } = parseModularQuery(window.location.search);
  const partial = queryParamsToSettingsPartial(params);
  return partial.componentVariant || params.variant || '';
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

function readActiveMode(group, root) {
  const escaped = CSS.escape(group);
  const buttons = [...root.querySelectorAll(`.mode-switch [data-mode-group="${escaped}"][data-set-mode]`)];
  const panels = [...root.querySelectorAll(`[data-mode-group="${escaped}"][data-mode-panel]`)];
  const pressed = buttons.find((button) => button.getAttribute('aria-pressed') === 'true');
  const visible = panels.find((panel) => !panel.hidden);
  return resolveVariantChoice({
    pressed: pressed?.getAttribute('data-set-mode'),
    visible: visible?.getAttribute('data-mode-panel'),
  });
}

function syncModeSwitch(group, mode, root, source = 'mode') {
  const previous = readActiveMode(group, root);
  const buttons = [...root.querySelectorAll(`.mode-switch [data-mode-group="${CSS.escape(group)}"][data-set-mode]`)];
  const panels = [...root.querySelectorAll(`[data-mode-group="${CSS.escape(group)}"][data-mode-panel]`)];
  if (!buttons.length && !panels.length) return null;

  buttons.forEach((button) => {
    const active = button.getAttribute('data-set-mode') === mode;
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  panels.forEach((panel) => {
    const active = panel.getAttribute('data-mode-panel') === mode;
    panel.hidden = !active;
    if (active) {
      const host = panel.closest(VARIANT_CONTAINER_SELECTOR) || panel;
      if (host) applyVariant(host, variantFromPanel(panel), source);
    }
  });

  return buildVariantEdge(previous, mode);
}

function bindModeSwitches(root, controller) {
  root.querySelectorAll(MODE_BUTTON_SELECTOR).forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    // Re-runs per added-node batch; without this guard every pass stacks a
    // duplicate click listener on every button.
    if (button.dataset.spwVariantBound === 'true') return;
    button.dataset.spwVariantBound = 'true';
    button.addEventListener('click', () => {
      const group = button.getAttribute('data-mode-group');
      const mode = button.getAttribute('data-set-mode');
      if (!group || !mode) return;
      clearGroupVariantMarks(root, group);
      const edge = syncModeSwitch(group, mode, root, 'mode-switch');
      const html = root.documentElement || document.documentElement;
      pulseRootSelection(html, 'mode-switch', mode);
      emitVariantSelected({
        group,
        variant: mode,
        previousVariant: edge?.from || null,
        edge,
        source: 'mode-switch',
      });
    }, { signal: controller.signal });
  });
}

function primeFromQuery(root) {
  const variant = readQueryVariant();
  if (!variant) return;

  const target = root.querySelector(`[data-spw-semantic-variant="${CSS.escape(variant)}"]`)
    || root.querySelector(`[data-spw-content-variant="${CSS.escape(variant)}"]`)
    || root.querySelector(`[data-mode-panel="${CSS.escape(variant)}"]`);

  if (!(target instanceof HTMLElement)) return;

  const host = target.closest(VARIANT_CONTAINER_SELECTOR) || target;
  const group = target.getAttribute('data-mode-group');
  const mode = target.getAttribute('data-mode-panel') || variant;
  const previous = group
    ? readActiveMode(group, root)
    : host.dataset.spwComponentVariantActive || '';

  if (group) clearGroupVariantMarks(root, group);
  else clearVariantMarks(host);

  applyVariant(host, variant, 'query');
  const edge = group
    ? syncModeSwitch(group, mode, root, 'query')
    : buildVariantEdge(previous, variant);

  const html = root.documentElement || document.documentElement;
  html.dataset.spwQueryVariant = variant;
  pulseRootSelection(html, 'query', variant);
  emitVariantSelected({
    group: group || null,
    variant,
    previousVariant: edge?.from || null,
    edge,
    source: 'query',
  });
}

export function initVariantSelection(root = document) {
  if (initialized) return () => {};
  initialized = true;

  const controller = new AbortController();
  clearVariantMarks(root);
  bindModeSwitches(root, controller);

  const groups = new Set(
    [...root.querySelectorAll(MODE_BUTTON_SELECTOR)]
      .map((button) => button.getAttribute('data-mode-group'))
      .filter(Boolean),
  );
  groups.forEach((group) => {
    const mode = readActiveMode(group, root);
    if (mode) syncModeSwitch(group, mode, root, 'authored');
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

  const disconnect = observeAddedMatches(MODE_BUTTON_SELECTOR, () => bindModeSwitches(root, controller), {
    root: root.body || root.documentElement,
  });

  controller.signal.addEventListener('abort', () => {
    disconnect();
    if (selectionPulseTimer) window.clearTimeout(selectionPulseTimer);
    selectionPulseTimer = null;
    const html = root.documentElement || document.documentElement;
    delete html.dataset.spwVariantSelectionPulse;
    delete html.dataset.spwVariantSelectionWeight;
    delete html.dataset.spwVariantSelectionSource;
    root.querySelectorAll('[data-spw-variant-bound]').forEach((button) => {
      if (button instanceof HTMLElement) delete button.dataset.spwVariantBound;
    });
    initialized = false;
  }, { once: true });

  return () => controller.abort();
}

export { VARIANT_EVENT };

export const spwModule = {
  updates: ['attr:data-spw-query-variant', 'attr:data-spw-variant-selection-pulse'],
  mount: (mod, ctx, root) => initVariantSelection(root),
};
