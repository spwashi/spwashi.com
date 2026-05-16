import { normalizeText, normalizeToken } from '/public/js/semantic/semantic-utils.js';

function buildSemanticExpression({ root = '', variant = '', behavior = '', lens = '' } = {}) {
  const parts = [];
  const rootLabel = normalizeText(root);
  if (rootLabel) parts.push(rootLabel);
  if (normalizeText(variant)) parts.push(`[${normalizeText(variant)}]`);
  if (normalizeText(behavior)) parts.push(`{${normalizeText(behavior)}}`);
  if (normalizeText(lens)) parts.push(`<${normalizeText(lens)}>`);
  return parts.join('');
}

export function parseSemanticBraceExpression(source = '') {
  const expression = normalizeText(source);
  if (!expression) {
    return {
      expression: '',
      root: '',
      rootLabel: '',
      variant: '',
      variantLabel: '',
      behavior: '',
      behaviorLabel: '',
      lens: '',
      lensLabel: '',
      key: '',
      family: '',
    };
  }

  const result = {
    expression,
    root: '',
    rootLabel: '',
    variant: '',
    variantLabel: '',
    behavior: '',
    behaviorLabel: '',
    lens: '',
    lensLabel: '',
    key: '',
    family: '',
  };

  let cursor = 0;
  let rootLabel = '';

  while (cursor < expression.length && !'[{<'.includes(expression[cursor])) {
    rootLabel += expression[cursor];
    cursor += 1;
  }

  rootLabel = normalizeText(rootLabel);
  result.rootLabel = rootLabel;
  result.root = normalizeToken(rootLabel);

  while (cursor < expression.length) {
    const open = expression[cursor];
    const close = open === '[' ? ']' : open === '{' ? '}' : '>';
    cursor += 1;

    let segment = '';
    while (cursor < expression.length && expression[cursor] !== close) {
      segment += expression[cursor];
      cursor += 1;
    }

    if (expression[cursor] === close) {
      cursor += 1;
    }

    const label = normalizeText(segment);
    if (!label) continue;

    if (open === '[') {
      result.variantLabel = label;
      result.variant = normalizeToken(label);
    } else if (open === '{') {
      result.behaviorLabel = label;
      result.behavior = normalizeToken(label);
    } else if (open === '<') {
      result.lensLabel = label;
      result.lens = normalizeToken(label);
    }
  }

  result.family = result.root || normalizeToken(result.rootLabel);
  result.key = buildSemanticExpression({
    root: result.rootLabel,
    variant: result.variantLabel,
    behavior: result.behaviorLabel,
    lens: result.lensLabel,
  });

  return result;
}

export function composeSemanticBraceExpression(parts = {}) {
  return buildSemanticExpression(parts);
}

export function deriveSemanticBraceExpression(el) {
  if (!(el instanceof Element)) return null;

  const explicitExpression = normalizeText(el.dataset.spwSemanticExpression || '');
  if (explicitExpression) {
    return parseSemanticBraceExpression(explicitExpression);
  }

  const explicitKey = normalizeText(el.dataset.spwSemanticKey || '');
  if (explicitKey) {
    return parseSemanticBraceExpression(explicitKey);
  }

  const root = normalizeText(el.dataset.spwSemanticRoot || '');
  const variant = normalizeText(el.dataset.spwSemanticVariant || '');
  const behavior = normalizeText(el.dataset.spwSemanticBehavior || '');
  const lens = normalizeText(el.dataset.spwSemanticLens || '');

  if (root || variant || behavior || lens) {
    return parseSemanticBraceExpression(
      composeSemanticBraceExpression({
        root,
        variant,
        behavior,
        lens,
      })
    );
  }

  const meaning = normalizeText(el.dataset.spwMeaning || '');
  if (meaning && /[\[{<]/.test(meaning)) {
    return parseSemanticBraceExpression(meaning);
  }

  return null;
}

export function collectSemanticBraceMatches(root, family) {
  if (!family) return [];

  const scope = root instanceof Element ? root : document;
  const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(family)
    : family.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  const selector = [
    `[data-spw-semantic-root="${escaped}"]`,
    `[data-spw-semantic-family="${escaped}"]`,
  ].join(', ');

  const matches = [];
  if (scope instanceof Element && scope.matches?.(selector)) {
    matches.push(scope);
  }

  const descendants = scope.querySelectorAll?.(selector) || [];
  descendants.forEach((node) => matches.push(node));
  return matches;
}
