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
const VARIABLE_LAB_SELECTOR = '[data-design-css-variable-lab]';
const VARIABLE_CONTROL_SELECTOR = '[data-design-css-var-control]';
const VARIABLE_VALUE_SELECTOR = '[data-design-css-var-value]';
const VARIABLE_RESET_SELECTOR = '[data-design-css-var-reset]';
const VARIABLE_STATUS_SELECTOR = '[data-design-css-var-status]';
const VARIABLE_STORAGE_KEY = 'spw-design-css-variable-lab';

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

function safeParseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readVariableStore() {
  try {
    return safeParseJson(window.localStorage.getItem(VARIABLE_STORAGE_KEY), {});
  } catch {
    return {};
  }
}

function writeVariableStore(next) {
  try {
    if (!next || !Object.keys(next).length) {
      window.localStorage.removeItem(VARIABLE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(VARIABLE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Local storage is optional here.
  }
}

function findVariableStatusNode(root) {
  if (!(root instanceof HTMLElement)) return null;
  return root.querySelector(VARIABLE_STATUS_SELECTOR);
}

function getVariableLabs(root) {
  if (!(root instanceof HTMLElement)) return [];
  if (root.matches(VARIABLE_LAB_SELECTOR)) return [root];
  return Array.from(root.querySelectorAll(VARIABLE_LAB_SELECTOR));
}

function getControlValue(control) {
  const unit = control.getAttribute('data-design-css-var-unit') || '';
  return unit ? `${control.value}${unit}` : control.value;
}

function getControlDefaultValue(control) {
  return control.defaultValue || control.getAttribute('data-design-css-var-default') || control.value || '';
}

function syncVariableValueNodes(root) {
  if (!(root instanceof HTMLElement)) return;

  const styles = getComputedStyle(document.documentElement);
  root.querySelectorAll(VARIABLE_VALUE_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const token = node.getAttribute('data-design-css-var-value');
    if (!token) return;
    node.textContent = styles.getPropertyValue(token).trim() || node.getAttribute('data-design-css-var-default') || 'unset';
  });
}

function applyVariableControl(control) {
  if (!(control instanceof HTMLInputElement)) return null;
  const token = control.getAttribute('data-design-css-var-control');
  if (!token) return null;

  const value = getControlValue(control);
  document.documentElement.style.setProperty(token, value);
  return { token, value };
}

function syncVariableControls(root) {
  if (!(root instanceof HTMLElement)) return;

  const store = readVariableStore();
  root.querySelectorAll(VARIABLE_CONTROL_SELECTOR).forEach((control) => {
    if (!(control instanceof HTMLInputElement)) return;
    const token = control.getAttribute('data-design-css-var-control');
    if (!token) return;

    const saved = store[token];
    if (saved !== undefined && saved !== null && saved !== '') {
      control.value = String(saved);
      document.documentElement.style.setProperty(token, getControlValue(control));
    }
  });

  syncVariableValueNodes(root);
}

function updateVariableStatus(root, message, type = 'info') {
  writeStatus(findVariableStatusNode(root), message, type);
}

function bindVariableControl(control, lab, scope) {
  if (!(control instanceof HTMLInputElement) || !(lab instanceof HTMLElement) || !(scope instanceof HTMLElement)) return () => {};

  const handleInput = () => {
    const token = control.getAttribute('data-design-css-var-control');
    if (!token) return;

    const defaultValue = getControlDefaultValue(control);
    const next = readVariableStore();
    if (String(control.value) === String(control.defaultValue || defaultValue)) {
      delete next[token];
    } else {
      next[token] = control.value;
    }

    const applied = applyVariableControl(control);
    writeVariableStore(next);
    syncVariableValueNodes(lab);
    syncTokenValues(scope);
    if (applied) {
      updateVariableStatus(lab, `Updated ${applied.token} to ${applied.value}.`, 'success');
    }
  };

  control.addEventListener('input', handleInput);
  control.addEventListener('change', handleInput);

  return () => {
    control.removeEventListener('input', handleInput);
    control.removeEventListener('change', handleInput);
  };
}

function bindVariableLab(lab, scope) {
  if (!(lab instanceof HTMLElement) || !(scope instanceof HTMLElement)) return () => {};

  const controls = Array.from(lab.querySelectorAll(VARIABLE_CONTROL_SELECTOR));
  if (!controls.length) return () => {};

  syncVariableControls(lab);
  syncTokenValues(scope);

  const cleanups = controls.map((control) => bindVariableControl(control, lab, scope));
  const resetButtons = Array.from(lab.querySelectorAll(VARIABLE_RESET_SELECTOR));

  const handleReset = () => {
    controls.forEach((control) => {
      if (!(control instanceof HTMLInputElement)) return;
      const token = control.getAttribute('data-design-css-var-control');
      if (!token) return;

      control.value = control.defaultValue;
      document.documentElement.style.removeProperty(token);
    });

    writeVariableStore({});
    syncVariableValueNodes(lab);
    syncTokenValues(scope);
    updateVariableStatus(lab, 'Reset CSS variables to authored defaults.', 'success');
  };

  resetButtons.forEach((button) => button.addEventListener('click', handleReset));

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    resetButtons.forEach((button) => button.removeEventListener('click', handleReset));
  };
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
  getVariableLabs(root).forEach((lab) => {
    syncVariableControls(lab);
  });
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
  const variableCleanups = roots.flatMap((scope) => getVariableLabs(scope).map((lab) => bindVariableLab(lab, scope)));

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
      variableCleanups.forEach((cleanup) => cleanup());
      off?.();
    },
    refresh() {
      syncAll();
    }
  };
}
