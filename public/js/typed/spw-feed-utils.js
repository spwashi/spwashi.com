export const DAY_KEYS = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
];
export function el(tag, className = '', attrs = {}) {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    Object.entries(attrs).forEach(([key, value]) => {
        if (value !== undefined && value !== null)
            node.setAttribute(key, String(value));
    });
    return node;
}
export function cleanText(value = '') {
    return String(value).replace(/\s+/g, ' ').trim();
}
export function clampIndex(index, length) {
    if (!length)
        return 0;
    return ((index % length) + length) % length;
}
export function getWeekIndex(date = new Date()) {
    const start = new Date(Date.UTC(date.getFullYear(), 0, 1));
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / 604800000);
}
export function createJsonFeedLoader(url, fallbackValue) {
    let cached = null;
    return async () => {
        if (cached)
            return cached;
        try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (!response.ok)
                throw new Error(`Unable to load JSON feed: ${response.status}`);
            cached = (await response.json());
        }
        catch {
            cached = fallbackValue;
        }
        return cached;
    };
}
