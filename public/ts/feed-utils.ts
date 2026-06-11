export const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type DayKey = (typeof DAY_KEYS)[number];
export type AttrValue = string | number | boolean | null | undefined;

export type JsonFeedLoader<T> = (() => Promise<T>) & {
  url: string;
  getLastError: () => unknown;
  reset: () => void;
};

export type JsonFeedLoaderOptions<T> = {
  cache?: RequestCache;
  label?: string;
  validate?: (value: unknown) => value is T;
};

export function cleanText(value: unknown = ''): string {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function parseJsonText(text: string, label = 'json'): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[${label}] invalid JSON: ${message}`);
  }
}

function normalizeElArgs(
  propsOrClassName: string | Record<string, AttrValue> = {},
  children: unknown = [],
) {
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
        props: { className, ...(maybeAttrs as Record<string, AttrValue>) },
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

function appendChild(parent: Element, child: unknown) {
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

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attrs?: Record<string, AttrValue>,
): HTMLElementTagNameMap[K];

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Record<string, AttrValue>,
  children?: unknown,
): HTMLElementTagNameMap[K];

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  propsOrClassName: string | Record<string, AttrValue> = {},
  children: unknown = [],
): HTMLElementTagNameMap[K] {
  const { props, children: resolvedChildren } = normalizeElArgs(propsOrClassName, children);
  const node = document.createElement(tag);

  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'className') {
      node.className = String(value);
      return;
    }
    if (key === 'text') {
      node.textContent = String(value);
      return;
    }
    if (key in node) {
      (node as Record<string, unknown>)[key] = value;
      return;
    }
    node.setAttribute(key, String(value));
  });

  appendChild(node, resolvedChildren);
  return node;
}

export function clampIndex(index: number, length: number): number {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

export function getWeekIndex(date = new Date()): number {
  const start = new Date(Date.UTC(date.getFullYear(), 0, 1));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 604800000);
}

export function createJsonFeedLoader<T>(
  url: string,
  fallbackValue: T,
  options: JsonFeedLoaderOptions<T> = {},
): JsonFeedLoader<T> {
  let cached: T | null = null;
  let lastError: unknown = null;
  const label = options.label || url;

  const loader = (async () => {
    if (cached !== null) return cached;

    try {
      const response = await fetch(url, { cache: options.cache || 'no-cache' });
      if (!response.ok) {
        throw new Error(`Unable to load JSON feed (${response.status}) from ${url}`);
      }

      const parsed = parseJsonText(await response.text(), label);
      if (options.validate && !options.validate(parsed)) {
        throw new Error(`JSON feed failed validation for ${label}`);
      }

      cached = parsed as T;
      lastError = null;
    } catch (error) {
      lastError = error;
      cached = fallbackValue;
    }

    return cached;
  }) as JsonFeedLoader<T>;

  loader.url = url;
  loader.getLastError = () => lastError;
  loader.reset = () => {
    cached = null;
    lastError = null;
  };

  return loader;
}