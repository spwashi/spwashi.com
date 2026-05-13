import {
  writeDatasetValue,
  writeDatasetValueIfMissing,
} from '/public/js/kernel/dom-contracts.js';

export const PAGE_HOOK_STATES = Object.freeze({
  IDLE: 'idle',
  FOCUSED: 'focused',
  PULSED: 'pulsed',
});

export const PAGE_HOOK_SELECTOR = [
  '[data-spw-page-hook]',
  '[data-spw-handle]',
  '[data-spw-hook]',
].join(', ');

const PAGE_HOOK_OWNER = 'page-hooks';

const normalizeHookName = (value = '') => String(value)
  .trim()
  .replace(/^#+/, '')
  .replace(/\s+/g, '-')
  .replace(/[^a-zA-Z0-9-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

const readHookNames = (element) => [
  element?.dataset?.spwPageHook,
  element?.dataset?.spwHandle,
  element?.dataset?.spwHook,
].map(normalizeHookName).filter(Boolean);

const readHookKind = (element) => {
  if (element?.hasAttribute('data-spw-page-hook')) return 'page-hook';
  if (element?.hasAttribute('data-spw-handle')) return 'handle';
  if (element?.hasAttribute('data-spw-hook')) return 'hook';
  return 'element';
};

const readHookLabel = (element) => (
  element?.dataset?.spwPageHookLabel
  || element?.getAttribute?.('aria-label')
  || element?.textContent?.trim()
  || element?.id
  || ''
);

const ensureHookAnnotation = (element) => {
  if (!element) return null;
  writeDatasetValueIfMissing(element, 'spwLayoutOwner', PAGE_HOOK_OWNER);
  writeDatasetValueIfMissing(element, 'spwPageHookKind', readHookKind(element));
  writeDatasetValueIfMissing(element, 'spwPageHookLabel', readHookLabel(element));
  if (!element.dataset.spwPageHookState) {
    writeDatasetValue(element, 'spwPageHookState', PAGE_HOOK_STATES.IDLE);
  }
  return element;
};

const toHookRecord = (element) => {
  if (!element) return null;
  ensureHookAnnotation(element);
  const names = readHookNames(element);
  const name = names[0] || normalizeHookName(element.id || '');

  return {
    name,
    names,
    label: readHookLabel(element),
    kind: readHookKind(element),
    state: element.dataset.spwPageHookState || PAGE_HOOK_STATES.IDLE,
    element,
  };
};

export function annotatePageHooks(root = document) {
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll(PAGE_HOOK_SELECTOR)].map(ensureHookAnnotation).filter(Boolean);
}

export function listPageHooks(root = document) {
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll(PAGE_HOOK_SELECTOR)]
    .map(toHookRecord)
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function resolvePageHook(target, root = document) {
  if (!target) return null;
  if (target?.nodeType === 1) return target;

  const name = normalizeHookName(target);
  if (!name) return null;

  const record = listPageHooks(root).find((hook) => (
    hook.name === name
    || hook.names.includes(name)
    || normalizeHookName(hook.element?.id || '') === name
  ));

  return record?.element || null;
}

export function snapshotPageHooks(root = document) {
  return listPageHooks(root).map(({ element, ...record }) => record);
}

export function setPageHookState(target, state = PAGE_HOOK_STATES.IDLE, root = document) {
  const element = resolvePageHook(target, root);
  if (!element) return null;
  writeDatasetValue(element, 'spwPageHookState', state);
  return element;
}

export function focusPageHook(target, options = {}) {
  const element = resolvePageHook(target, options.root);
  if (!element) return null;

  setPageHookState(element, PAGE_HOOK_STATES.FOCUSED);

  if (options.scroll !== false && typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({
      behavior: options.behavior || 'smooth',
      block: options.block || 'center',
      inline: 'nearest',
    });
  }

  return element;
}

export function pulsePageHook(target, duration = 600, options = {}) {
  const element = resolvePageHook(target, options.root);
  if (!element) return null;

  const previousState = element.dataset.spwPageHookState || PAGE_HOOK_STATES.IDLE;
  setPageHookState(element, PAGE_HOOK_STATES.PULSED);

  const timerId = window.setTimeout(() => {
    setPageHookState(element, previousState || PAGE_HOOK_STATES.IDLE);
  }, duration);

  return {
    element,
    state: PAGE_HOOK_STATES.PULSED,
    timerId,
  };
}
