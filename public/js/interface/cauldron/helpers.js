export function isNumericalConcept(expr = '') {
  const s = String(expr).toLowerCase();
  return /\b(13|200|10k|10000|day|step|video|trace|mod|per|across|dimensional|epoch|chunk)\b/.test(s);
}

export function parseNumericalValue(expr = '') {
  const match = String(expr).match(/(\d+)(k?)\s*[- ]?(day|step|video|trace|chunk|epoch)?/i);
  if (!match) return null;
  let val = parseInt(match[1], 10);
  if (match[2] === 'k') val *= 1000;
  return { value: val, unit: match[3] || 'count' };
}

export function deriveNumericityQuantifiers(ingredients = []) {
  const nums = ingredients.filter((i) => i.type === 'numerical' && typeof i.value === 'number');
  if (!nums.length) return [];

  const suggestions = new Set();
  nums.forEach((n) => {
    const v = n.value;
    const u = n.unit || 'unit';
    suggestions.add(`mod-${v}`);
    suggestions.add(`per-${v}-${u}`);
    suggestions.add(`across-${v}-trace`);
    if (v % 13 === 0 || v === 13) suggestions.add('mod-13-allocation');
    suggestions.add(`dimensional-${Math.min(3, Math.floor(v / 50) || 1)}`);
  });
  return Array.from(suggestions);
}