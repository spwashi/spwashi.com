export const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const el = (tag, className, attrs = {}) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) node.setAttribute(key, value);
  });
  return node;
};

export const cleanText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

export const clampIndex = (index, length) => {
  if (!length) return 0;
  return ((index % length) + length) % length;
};

export const getWeekIndex = (date = new Date()) => {
  const start = new Date(Date.UTC(date.getFullYear(), 0, 1));
  const diff = date - start;
  return Math.floor(diff / 604800000);
};

export const createJsonFeedLoader = (url, fallbackValue) => {
  let cached = null;

  return async () => {
    if (cached) return cached;

    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Unable to load JSON feed: ${response.status}`);
      cached = await response.json();
    } catch {
      cached = fallbackValue;
    }

    return cached;
  };
};
