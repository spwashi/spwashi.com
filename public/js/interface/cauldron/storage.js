import { CAULDRON_KEY } from './contract.js';
import { deriveNumericityQuantifiers, isNumericalConcept, parseNumericalValue } from './helpers.js';
import { splitOperatorExpression } from '/public/js/kernel/shared.js';

/* Delegates to the kernel's operator grammar (the old local regex required a
   literal backslash before ^ and ?, so those operators never matched). */
export function inferOperator(expression = '') {
  return splitOperatorExpression(expression).prefix;
}

export function normalizeIngredient(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    const split = splitOperatorExpression(item);
    return { expression: item, label: item, operand: split.operand, capturedAt: Date.now() };
  }
  const split = splitOperatorExpression(item.expression || item.label || '');
  const normalized = {
    expression: item.expression || item.label || '',
    label: item.label || item.expression || '',
    operator: item.operator || split.prefix,
    operand: item.operand || split.operand,
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

