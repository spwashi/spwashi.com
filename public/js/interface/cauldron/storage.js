import { CAULDRON_KEY, MAX_INGREDIENTS } from './contract.js';
import { deriveNumericityQuantifiers, isNumericalConcept, parseNumericalValue } from './helpers.js';

export function inferOperator(expression = '') {
  const match = String(expression).match(/^(#>|\\^|\\?|~|@|<|>)/);
  return match ? match[1] : '';
}

export function normalizeIngredient(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    return { expression: item, label: item, capturedAt: Date.now() };
  }
  const normalized = {
    expression: item.expression || item.label || '',
    label: item.label || item.expression || '',
    operator: item.operator || inferOperator(item.expression),
    wonder: item.wonder || '',
    capturedAt: item.capturedAt || Date.now(),
    ...item,
  };

  if (isNumericalConcept(normalized.expression)) {
    normalized.type = 'numerical';
    const parsed = parseNumericalValue(normalized.expression);
    if (parsed) {
      normalized.value = parsed.value;
      normalized.unit = parsed.unit;
      normalized.quantifiers = deriveNumericityQuantifiers([normalized]);
    }
  }

  return normalized;
}

export function getCauldron() {
  try {
    const raw = JSON.parse(localStorage.getItem(CAULDRON_KEY) || '[]');
    return raw.map(normalizeIngredient).filter(Boolean);
  } catch {
    return [];
  }
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[s]));
}

