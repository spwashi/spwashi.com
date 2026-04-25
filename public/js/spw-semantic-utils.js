export function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function humanizeToken(value = '') {
  return normalizeText(String(value).replace(/[_-]+/g, ' ')).toLowerCase();
}

export function normalizeToken(value = '') {
  return humanizeToken(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function uniqueByKey(items = [], keyFn = (item) => item) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
