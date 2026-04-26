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

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  attrs: Record<string, AttrValue> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;

  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  });

  return node;
}

export function cleanText(value: unknown = ''): string {
  return String(value).replace(/\s+/g, ' ').trim();
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

export function createJsonFeedLoader<T>(url: string, fallbackValue: T): () => Promise<T> {
  let cached: T | null = null;

  return async () => {
    if (cached) return cached;

    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Unable to load JSON feed: ${response.status}`);
      cached = (await response.json()) as T;
    } catch {
      cached = fallbackValue;
    }

    return cached;
  };
}
