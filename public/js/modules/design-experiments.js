import { bus } from '/public/js/kernel/spw-bus.js';
import {
  getSiteSettings,
  saveSiteSettings,
  validatePartialSettings
} from '/public/js/kernel/site-settings.js';

const ROOT_SELECTOR = '[data-design-experiments-root]';
const BUNDLE_SELECTOR = '[data-design-setting-bundle]';
const TOKEN_VALUE_SELECTOR = '[data-design-token-value]';
const TOKEN_METER_SELECTOR = '[data-design-token-meter]';

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseBundle(bundle = '') {
  const entries = String(bundle)
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(':').map((part) => part.trim()))
    .filter(([name, value]) => name && value);

  if (!entries.length) return null;

  return Object.fromEntries(entries);
}

function parseNumericToken(value = '') {
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function writeStatus(node, message, type = 'info') {
  if (!(node instanceof HTMLElement)) return;
  node.textContent = message;
  node.dataset.status = type;
}

function findStatusNode(root) {
  if (!(root instanceof HTMLElement)) return null;
  return root.querySelector('[data-site-settings-status]');
}

function syncTokenValues(root) {
  if (!(root instanceof HTMLElement)) return;

  const styles = getComputedStyle(document.documentElement);

  root.querySelectorAll(TOKEN_VALUE_SELECTOR).forEach((node) => {
    const token = node.getAttribute('data-design-token-value');
    if (!token) return;
    const value = styles.getPropertyValue(token).trim() || node.getAttribute('data-design-token-fallback') || 'unset';
    node.textContent = value;
  });

  root.querySelectorAll(TOKEN_METER_SELECTOR).forEach((node) => {
    const token = node.getAttribute('data-design-token-meter');
    if (!token) return;

    const rawValue = styles.getPropertyValue(token).trim();
    const numericValue = parseNumericToken(rawValue);
    const max = Number.parseFloat(node.getAttribute('data-design-token-max') || '1');
    const fallback = node.getAttribute('data-design-token-fallback') || '0';

    if (numericValue === null || !Number.isFinite(max) || max <= 0) {
      node.style.setProperty('--design-meter-fill', '0');
      node.dataset.designMeterValue = fallback;
      return;
    }

    node.style.setProperty('--design-meter-fill', String(clampNumber(numericValue / max, 0, 1)));
    node.dataset.designMeterValue = rawValue;
  });
}

function syncBundleButtons(root, settings = getSiteSettings()) {
  if (!(root instanceof HTMLElement)) return;

  root.querySelectorAll(BUNDLE_SELECTOR).forEach((button) => {
    if (!(button instanceof HTMLElement)) return;

    const bundle = parseBundle(button.getAttribute('data-design-setting-bundle'));
    if (!bundle) return;

    const isActive = Object.entries(bundle).every(([name, value]) => settings[name] === value);
    button.dataset.designBundleActive = isActive ? 'true' : 'false';

    if (button instanceof HTMLButtonElement || button.getAttribute('role') === 'button') {
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
  });
}

function syncRoot(root, settings = getSiteSettings()) {
  syncTokenValues(root);
  syncBundleButtons(root, settings);
}

function applyBundle(button, root) {
  if (!(button instanceof HTMLElement) || !(root instanceof HTMLElement)) return null;

  const bundle = parseBundle(button.getAttribute('data-design-setting-bundle'));
  if (!bundle) return null;

  const validation = validatePartialSettings(bundle);
  if (!validation.valid) {
    writeStatus(findStatusNode(root), 'Bundle contains an invalid setting.', 'info');
    return null;
  }

  const saved = saveSiteSettings(bundle);
  const label = button.getAttribute('data-design-bundle-label') || button.textContent?.trim() || 'bundle';

  syncRoot(root, saved);
  writeStatus(findStatusNode(root), `Applied ${label.toLowerCase()} locally.`, 'success');

  return saved;
}

function bindBundleButton(button, root) {
  if (!(button instanceof HTMLElement)) {
    return () => {};
  }

  if (!(button instanceof HTMLButtonElement) && !button.hasAttribute('role')) {
    button.setAttribute('role', 'button');
  }

  const handleClick = (event) => {
    if (button instanceof HTMLAnchorElement) event.preventDefault();
    applyBundle(button, root);
  };

  const handleKeydown = (event) => {
    if (event.defaultPrevented) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (button instanceof HTMLButtonElement) return;
    event.preventDefault();
    applyBundle(button, root);
  };

  button.addEventListener('click', handleClick);
  button.addEventListener('keydown', handleKeydown);

  return () => {
    button.removeEventListener('click', handleClick);
    button.removeEventListener('keydown', handleKeydown);
  };
}

function resolveRoots(root = document) {
  if (root === document) {
    return Array.from(document.querySelectorAll(ROOT_SELECTOR));
  }

  if (!(root instanceof HTMLElement)) {
    return [];
  }

  if (root.matches(ROOT_SELECTOR)) {
    return [root];
  }

  return Array.from(root.querySelectorAll(ROOT_SELECTOR));
}

export function initDesignExperiments(root = document) {
  const roots = resolveRoots(root);
  if (!roots.length) return undefined;

  const cleanups = roots.flatMap((scope) => (
    Array.from(scope.querySelectorAll(BUNDLE_SELECTOR)).map((button) => bindBundleButton(button, scope))
  ));

  const syncAll = (settings = getSiteSettings()) => {
    roots.forEach((scope) => syncRoot(scope, settings));
  };

  syncAll();

  const off = bus.on('settings:changed', (event) => {
    syncAll(event.detail || getSiteSettings());
  });

  return {
    cleanup() {
      cleanups.forEach((cleanup) => cleanup());
      off?.();
    },
    refresh() {
      syncAll();
    }
  };
}
