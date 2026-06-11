/**
 * dom-render.js
 * --------------------------------------------------------------------------
 * Shared DOM rendering, templating, hydration, and error-reporting primitives.
 * Prefer programmatic creation and escaped interpolation over raw innerHTML.
 * --------------------------------------------------------------------------
 */

import { bus } from '/public/js/kernel/bus.js';
import { createSpwLogger } from '/public/js/kernel/instrumentation.js';

const renderLogger = createSpwLogger('spw-render');

export const HYDRATION_STATES = Object.freeze(['loading', 'ready', 'error']);
export const SKELETON_ROLES = Object.freeze(['heading', 'line', 'card']);

const VAR_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*\}\}/g;

export function normalizeError(error, fallback = 'unknown error') {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'string') return error || fallback;
  if (error == null) return fallback;
  try {
    return String(error);
  } catch {
    return fallback;
  }
}

export function reportRenderError(source, error, options = {}) {
  const message = normalizeError(error);
  const payload = {
    source: source || 'render',
    message,
    host: options.host instanceof Element ? options.host : null,
  };

  if (!options.silent) {
    renderLogger.warn(message, payload, 'contract');
    console.warn(`[dom-render] ${payload.source}: ${message}`, error);
  }

  try {
    bus.emit('render:error', payload);
  } catch {
    // Bus is optional during early boot.
  }

  return payload;
}

export async function runSafe(task, options = {}) {
  const source = options.source || 'run-safe';

  try {
    const value = typeof task === 'function' ? await task() : await task;
    return { ok: true, value, error: null };
  } catch (error) {
    reportRenderError(source, error, options);
    return { ok: false, value: options.fallback ?? null, error };
  }
}

export function guardCall(fn, source = 'guard-call', options = {}) {
  if (typeof fn !== 'function') return () => options.fallback;

  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      reportRenderError(source, error, options);
      return options.fallback;
    }
  };
}

export function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

export function escapeAttr(value) {
  return escapeHtml(value);
}

export function interpolateTemplate(template, vars = {}, options = {}) {
  const shouldEscape = options.escape !== false;
  const unknown = new Set();

  const output = String(template).replace(VAR_RE, (_match, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      const value = vars[key] ?? '';
      return shouldEscape ? escapeHtml(value) : String(value);
    }
    unknown.add(key);
    return `{{${key}}}`;
  });

  if (typeof options.onUnknown === 'function') {
    unknown.forEach((key) => options.onUnknown(key));
  }

  return output;
}

function appendChild(parent, child) {
  if (child == null || child === false) return;

  if (Array.isArray(child)) {
    child.forEach((entry) => appendChild(parent, entry));
    return;
  }

  if (typeof child === 'string' || typeof child === 'number') {
    parent.appendChild(document.createTextNode(String(child)));
    return;
  }

  if (child instanceof Node) {
    parent.appendChild(child);
  }
}

function applyElementProps(element, props = {}) {
  Object.entries(props).forEach(([key, value]) => {
    if (value == null) return;

    if (key === 'className') {
      element.className = String(value);
      return;
    }

    if (key === 'text') {
      element.textContent = String(value);
      return;
    }

    if (key === 'html') {
      if (!props.trusted) {
        reportRenderError('el:html-without-trust', new Error('innerHTML requires trusted: true'), {
          host: element,
        });
        element.textContent = cleanText(value);
        return;
      }
      element.innerHTML = String(value);
      return;
    }

    if (key === 'trusted') return;

    if (key === 'dataset' && value && typeof value === 'object') {
      Object.entries(value).forEach(([datasetKey, datasetValue]) => {
        if (datasetValue == null || datasetValue === '') {
          delete element.dataset[datasetKey];
          return;
        }
        element.dataset[datasetKey] = String(datasetValue);
      });
      return;
    }

    if (key in element) {
      element[key] = value;
      return;
    }

    element.setAttribute(key, String(value));
  });
}

function normalizeElArgs(propsOrClassName = {}, children = []) {
  if (typeof propsOrClassName === 'string') {
    const className = propsOrClassName;
    const maybeAttrs = children;

    if (
      maybeAttrs
      && typeof maybeAttrs === 'object'
      && !Array.isArray(maybeAttrs)
      && !(maybeAttrs instanceof Node)
    ) {
      return {
        props: { className, ...maybeAttrs },
        children: [],
      };
    }

    return {
      props: className ? { className } : {},
      children: maybeAttrs ?? [],
    };
  }

  return {
    props: propsOrClassName || {},
    children,
  };
}

/**
 * Create a DOM element with optional props and children.
 * Supports legacy `el(tag, className, attrs)` and `el(tag, props, children)`.
 * Use `text` for safe text content. Use `html` only with `trusted: true`.
 */
export function el(tag, propsOrClassName = {}, children = []) {
  const { props, children: resolvedChildren } = normalizeElArgs(propsOrClassName, children);
  const element = document.createElement(tag);
  applyElementProps(element, props);

  if (resolvedChildren != null) {
    appendChild(element, resolvedChildren);
  }

  return element;
}

export const createElement = el;

export function fragment(children = []) {
  const root = document.createDocumentFragment();
  appendChild(root, children);
  return root;
}

export function clearChildren(parent) {
  if (!parent) return;
  parent.replaceChildren();
}

export function replaceChildren(parent, children = []) {
  if (!parent) return;
  parent.replaceChildren(fragment(children));
}

export function setTrustedHtml(element, html = '') {
  if (!element) return;
  element.innerHTML = String(html);
}

export function createSkeleton(role = 'line') {
  const normalizedRole = SKELETON_ROLES.includes(role) ? role : 'line';
  return el('div', {
    className: 'spw-skeleton',
    dataset: { spwSkeletonRole: normalizedRole },
    ariaHidden: 'true',
  });
}

export function setHydrationState(element, state, options = {}) {
  if (!element) return false;

  const next = HYDRATION_STATES.includes(state) ? state : 'loading';
  element.setAttribute('data-spw-hydration', next);

  if (options.label) {
    element.setAttribute('aria-label', String(options.label));
  } else if (next === 'error') {
    element.setAttribute('aria-label', options.message || 'Failed to load content');
  } else if (next === 'ready') {
    element.removeAttribute('aria-label');
  }

  if (next === 'error' && options.message) {
    element.dataset.spwHydrationError = cleanText(options.message);
  } else {
    delete element.dataset.spwHydrationError;
  }

  return true;
}

/**
 * Async hydration helper for JSON/data-driven regions.
 * Keeps loading, ready, and error states on data-spw-hydration.
 */
export async function hydrateHost(host, {
  load,
  render,
  source = 'hydrate',
  onError,
  fallbackLabel = 'Failed to load content',
} = {}) {
  if (!host) {
    const error = new Error('hydrateHost requires a host element');
    reportRenderError(source, error);
    return { ok: false, value: null, error };
  }

  setHydrationState(host, 'loading');

  const result = await runSafe(async () => {
    const data = typeof load === 'function' ? await load() : null;
    const content = typeof render === 'function' ? await render(data, host) : data;

    clearChildren(host);

    if (content instanceof Node) {
      host.appendChild(content);
    } else if (Array.isArray(content)) {
      replaceChildren(host, content);
    } else if (typeof content === 'string') {
      host.appendChild(document.createTextNode(content));
    } else if (content != null) {
      host.appendChild(document.createTextNode(String(content)));
    }

    setHydrationState(host, 'ready');
    return data;
  }, { source, host });

  if (!result.ok) {
    setHydrationState(host, 'error', {
      message: normalizeError(result.error, fallbackLabel),
      label: fallbackLabel,
    });
    onError?.(result.error, host);
  }

  return result;
}

export function createJsonFeedLoader(url, fallbackValue, options = {}) {
  let cached = null;
  let lastError = null;
  const source = options.source || `json-feed:${url}`;

  const loader = async () => {
    if (cached !== null) return cached;

    const result = await runSafe(async () => {
      const response = await fetch(url, { cache: options.cache || 'no-cache' });
      if (!response.ok) {
        throw new Error(`Unable to load JSON feed (${response.status}) from ${url}`);
      }
      return response.json();
    }, { source, silent: options.silent });

    if (result.ok) {
      cached = result.value;
      lastError = null;
      return cached;
    }

    lastError = result.error;
    cached = fallbackValue;
    return cached;
  };

  loader.getLastError = () => lastError;
  loader.reset = () => {
    cached = null;
    lastError = null;
  };

  return loader;
}

export const SPW_DOM_RENDER_CONTRACT = Object.freeze({
  hydrationStates: HYDRATION_STATES,
  skeletonRoles: SKELETON_ROLES,
  portableUse:
    'Use el(), interpolateTemplate(), and hydrateHost() when a module needs safe rendering, async projection, or visible loading/error states.',
});