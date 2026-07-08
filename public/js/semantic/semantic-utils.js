export {
  collapseText,
  humanizeToken,
  normalizeSlug,
  normalizeText,
  normalizeToken,
  semanticToken,
  TEXT,
  TOKEN,
} from '/public/js/kernel/text-normalization.js';

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