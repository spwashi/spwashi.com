/**
 * sigil-annotation.js
 * ---------------------------------------------------------------------------
 * Operator sigil metadata: prefix/infix/postfix, geometry, delimiters, fixity.
 * No event wiring — annotation only.
 */

import {
  detectOperator,
  detectOperatorFromElement,
  extractOperatorPrefix,
  getOperatorGeometry,
  normalizeToken,
  parseSigilPosition,
} from '/public/js/kernel/shared.js';

const DELIMITER_FORM_BY_CLASS = Object.freeze({
  'spw-delimiter--brace': 'brace',
  'spw-delimiter--square': 'block',
  'spw-delimiter--angle': 'angle',
  'spw-delimiter--paren': 'circle',
});

const DELIMITER_PERSPECTIVE = Object.freeze({
  '{': 'objective',
  '[': 'objective',
  '<': 'objective',
  '(': 'objective',
  '}': 'subjective',
  ']': 'subjective',
  '>': 'subjective',
  ')': 'subjective',
});

const stripSigilWrapper = (value = '') => value
  .trim()
  .replace(/^\s*["'[{(<]+/, '')
  .replace(/[>"'\])}]+\s*$/, '')
  .replace(/\{\s*$/, '')
  .trim();

const readSigilText = (element) => (
  element.dataset.spwSigil
  || element.textContent
  || ''
).trim();

const parseSigilParts = (element, op) => {
  const sigil = readSigilText(element);
  if (!sigil || !op) return null;

  const prefix = op.prefix || extractOperatorPrefix(sigil);
  const rawName = prefix ? sigil.slice(prefix.length) : sigil;
  const name = normalizeToken(stripSigilWrapper(rawName));

  return {
    sigil,
    prefix,
    name,
    label: name ? `${op.label}: ${name.replace(/_/g, ' ')}` : op.label,
  };
};

export function applyOperatorGeometry(element, op) {
  const geometry = getOperatorGeometry(op?.type);
  if (!geometry) return;

  element.dataset.spwOperatorLeftRole = element.dataset.spwOperatorLeftRole || geometry.leftRole;
  element.dataset.spwOperatorRightRole = element.dataset.spwOperatorRightRole || geometry.rightRole;
  element.dataset.spwOperatorFlow = element.dataset.spwOperatorFlow || geometry.flow;
  element.dataset.spwOperatorBraceBias = element.dataset.spwOperatorBraceBias || geometry.braceBias;
  element.dataset.spwOperatorGeometry = element.dataset.spwOperatorGeometry || geometry.geometry;
  element.dataset.spwOperatorOverload = element.dataset.spwOperatorOverload || geometry.overload;
  element.dataset.spwOperatorChargeRole = element.dataset.spwOperatorChargeRole || geometry.chargeRole;
}

const resolveStableIdentifier = (element) => {
  if (!(element instanceof HTMLElement)) return '';

  const explicit = element.dataset.spwIdentifier
    || element.getAttribute('data-spw-inspect')
    || element.dataset.spwDeepLink
    || '';
  if (explicit) return normalizeToken(String(explicit).replace(/^#/, ''));

  if (element.id) return normalizeToken(element.id);

  if (element instanceof HTMLAnchorElement) {
    const hash = decodeURIComponent(element.hash || '').replace(/^#/, '');
    if (hash) return normalizeToken(hash);
    const path = element.pathname?.replace(/^\/+|\/+$/g, '').replace(/\//g, '_');
    if (path) return normalizeToken(path);
  }

  return '';
};

const applySigilParts = (element, op) => {
  const parts = parseSigilParts(element, op);
  if (!parts) return;

  element.dataset.spwSigil = element.dataset.spwSigil || parts.sigil;
  element.dataset.spwSigilPrefix = element.dataset.spwSigilPrefix || parts.prefix;
  element.dataset.spwSigilName = element.dataset.spwSigilName || parts.name;
  element.dataset.spwSigilLabel = element.dataset.spwSigilLabel || parts.label;
  element.dataset.spwSigilRole = element.dataset.spwSigilRole || 'grammar';

  const position = parseSigilPosition(parts.sigil);
  if (position.position !== 'unknown') {
    element.dataset.spwSigilPosition = element.dataset.spwSigilPosition || position.position;
    element.dataset.spwFixityTier = element.dataset.spwFixityTier || position.fixity;
    if (position.delimiter && !element.dataset.spwDelimiter) {
      element.dataset.spwDelimiter = position.delimiter;
    }
  }

  const identifier = resolveStableIdentifier(element);
  if (identifier) {
    element.dataset.spwIdentifier = element.dataset.spwIdentifier || identifier;
    element.dataset.spwAddressRole = element.dataset.spwAddressRole || 'identifier';
  }

  if (!element.getAttribute('aria-label')) {
    element.setAttribute('aria-label', parts.label);
  }
};

export function applyOperatorMetadata(element, op) {
  if (!(element instanceof HTMLElement) || !op) return;

  element.dataset.spwOperator = element.dataset.spwOperator || op.type;
  element.dataset.spwOperatorIntent = op.intent;
  element.dataset.spwOperatorInteraction = op.interaction;
  element.dataset.spwOperatorFamily = op.family;
  element.dataset.spwOperatorResolved = op.type;
  element.dataset.spwOperatorPublicLabel = op.label;
  element.dataset.spwOperatorSpeech = op.speech;
  element.dataset.spwOperatorReversibility = op.reversibility;
  element.dataset.spwTransformation = `${op.intent}/${op.speech}`;

  applySigilParts(element, op);
  applyOperatorGeometry(element, op);

  if (!element.title) {
    element.title = element.dataset.spwSigilLabel
      ? `${element.dataset.spwSigilLabel} — ${op.interaction}`
      : `${op.label}: ${op.interaction}`;
  }
}

const inferDelimiterForm = (element) => {
  if (element.dataset.spwForm) return element.dataset.spwForm;

  for (const [className, form] of Object.entries(DELIMITER_FORM_BY_CLASS)) {
    if (element.classList.contains(className)) return form;
  }

  return '';
};

export function annotateDelimiters(root = document) {
  root.querySelectorAll('.spw-delimiter').forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    const char = element.textContent.trim();
    const form = inferDelimiterForm(element);
    if (form) element.dataset.spwForm = form;
    if (!element.dataset.spwDelimiter && char) element.dataset.spwDelimiter = char;

    const perspective = DELIMITER_PERSPECTIVE[char];
    if (perspective && !element.dataset.spwPerspective) {
      element.dataset.spwPerspective = perspective;
    }

    if (!element.dataset.spwOperatorGeometry) {
      element.dataset.spwOperatorGeometry = form === 'brace'
        ? 'brace-container'
        : form === 'block'
          ? 'lift'
          : form === 'angle'
            ? 'opening-edge'
            : form === 'circle'
              ? 'scene-plane'
              : 'brace-container';
    }

    const isClosing = char === '}' || char === ')' || char === ']' || char === '>';
    element.dataset.spwSigilPosition = element.dataset.spwSigilPosition
      || (isClosing ? 'postfix' : 'infix');
    element.dataset.spwFixityTier = element.dataset.spwFixityTier
      || (isClosing ? 'tending' : 'stable');
  });
}

export function annotateSemanticExpressions(root = document) {
  root.querySelectorAll('[data-spw-semantic-expression]').forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    if (element.dataset.spwSigilPosition) return;

    const parsed = parseSigilPosition(element.dataset.spwSemanticExpression || '');
    if (parsed.position === 'unknown') return;

    element.dataset.spwSigilPosition = parsed.position;
    element.dataset.spwFixityTier = element.dataset.spwFixityTier || parsed.fixity;
  });
}