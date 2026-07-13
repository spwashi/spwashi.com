/**
 * variant-selection.js
 * ---------------------------------------------------------------------------
 * Component variant selection: mode panels, semantic variants, query override.
 */

import { observeAddedMatches } from '/public/js/kernel/dom-contracts.js';
import { parseModularQuery } from '/public/js/kernel/query-composer.js';
import { queryParamsToSettingsPartial } from '/public/js/kernel/settings-query-parity.js';

const VARIANT_HOST_SELECTOR = '.site-frame, .frame-card, [data-spw-feature], [data-spw-semantic-variant], [data-spw-content-variant]';
const MODE_BUTTON_SELECTOR = '.mode-switch [data-set-mode]';

let initialized = false;

function readQueryVariant() {
  const { params } = parseModularQuery(window.location.search);
  const partial = queryParamsToSettingsPartial(params);
  return partial.componentVariant || params.variant || '';
}

function clearVariantMarks(root) {
  root.querySelectorAll('[data-spw-variant-selected="true"]').forEach((node) => {
    delete node.dataset.spwVariantSelected;
  });
  root.querySelectorAll('[data-spw-component-variant-active]').forEach((node) => {
    delete node.dataset.spwComponentVariantActive;
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

function applyVariant(host, variant, source = 'mode') {
  if (!(host instanceof HTMLElement) || !variant) return;

  host.dataset.spwComponentVariantActive = variant;
  host.dataset.spwVariantSelectionSource = source;

  const panel = host.querySelector(`[data-mode-panel="${CSS.escape(variant)}"]`)
    || host.querySelector(`[data-spw-semantic-variant="${CSS.escape(variant)}"]`)
    || host.querySelector(`[data-spw-content-variant="${CSS.escape(variant)}"]`);

  if (panel instanceof HTMLElement) {
    panel.dataset.spwVariantSelected = 'true';
  }
}

function syncModeSwitch(group, mode, root) {
  const buttons = [...root.querySelectorAll(`.mode-switch [data-mode-group="${CSS.escape(group)}"][data-set-mode]`)];
  const panels = [...root.querySelectorAll(`[data-mode-group="${CSS.escape(group)}"][data-mode-panel]`)];
  if (!buttons.length && !panels.length) return;

  buttons.forEach((button) => {
    const active = button.getAttribute('data-set-mode') === mode;
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  panels.forEach((panel) => {
    const active = panel.getAttribute('data-mode-panel') === mode;
    panel.hidden = !active;
    if (active) {
      const host = panel.closest(VARIANT_HOST_SELECTOR);
      if (host) applyVariant(host, variantFromPanel(panel), 'mode');
    }
  });
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
      clearVariantMarks(root);
      syncModeSwitch(group, mode, root);
      document.dispatchEvent(new CustomEvent('spw:variant-selected', {
        detail: { group, variant: mode, source: 'mode-switch' },
        bubbles: true,
      }));
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

  const host = target.closest(VARIANT_HOST_SELECTOR) || target;
  const group = target.getAttribute('data-mode-group');
  const mode = target.getAttribute('data-mode-panel') || variant;

  clearVariantMarks(root);
  applyVariant(host, variant, 'query');
  if (group) syncModeSwitch(group, mode, root);

  document.documentElement.dataset.spwQueryVariant = variant;
}

export function initVariantSelection(root = document) {
  if (initialized) return () => {};
  initialized = true;

  const controller = new AbortController();
  clearVariantMarks(root);
  bindModeSwitches(root, controller);
  primeFromQuery(root);

  root.querySelectorAll(`${VARIANT_HOST_SELECTOR}[data-spw-semantic-variant], ${VARIANT_HOST_SELECTOR}[data-spw-content-variant]`)
    .forEach((host) => {
      const variant = host.dataset.spwSemanticVariant || host.dataset.spwContentVariant;
      if (variant && !root.querySelector('[data-spw-variant-selected="true"]')) {
        applyVariant(host, variant, 'authored');
      }
    });

  const disconnect = observeAddedMatches(MODE_BUTTON_SELECTOR, () => bindModeSwitches(root, controller), {
    root: root.body || root.documentElement,
  });

  controller.signal.addEventListener('abort', () => {
    disconnect();
    root.querySelectorAll('[data-spw-variant-bound]').forEach((button) => {
      if (button instanceof HTMLElement) delete button.dataset.spwVariantBound;
    });
    initialized = false;
  }, { once: true });

  return () => controller.abort();
}