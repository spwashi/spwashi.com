// link-copy.js
//
// Shared Spw-based link copy: expression sigils, readable labels, operator
// geometry, and interaction semantics for navigable handles.

import {
  detectOperator,
  extractOperatorPrefix,
} from '/public/js/kernel/shared.js';
import { applyOperatorGeometry } from '/public/js/semantic/sigil-annotation.js';

const INTERACTION_BY_DESTINATION = Object.freeze({
  projection: Object.freeze({
    affordance: 'navigate ground replay',
    contract: 'tap ground navigate',
    reversibility: 'reversible',
    wonder: 'projection',
  }),
  scope: Object.freeze({
    affordance: 'navigate inspect scope',
    contract: 'tap charge navigate',
    reversibility: 'inspectable',
    wonder: 'locality',
  }),
  settle: Object.freeze({
    affordance: 'navigate settle replay',
    contract: 'tap ground settle',
    reversibility: 'replayable',
    wonder: 'orientation',
  }),
});

export function parseSpwExpression(expression = '') {
  const text = String(expression || '').trim();
  const prefix = extractOperatorPrefix(text);
  const nucleus = prefix ? text.slice(prefix.length) : text;
  const operator = detectOperator(text);

  return {
    expression: text,
    prefix,
    nucleus,
    operatorType: operator?.type || '',
    operator,
  };
}

export function applyOperatorGeometryToElement(element, operatorType = '') {
  if (!(element instanceof HTMLElement) || !operatorType) return;
  applyOperatorGeometry(element, { type: operatorType });
}

export function applyInteractionSemanticsToLink(link, {
  destination = 'projection',
  operator = '',
  expression = '',
  scope = 'section',
  label = '',
} = {}) {
  if (!(link instanceof HTMLElement)) return;

  const semantics = INTERACTION_BY_DESTINATION[destination] || INTERACTION_BY_DESTINATION.projection;

  link.dataset.spwInteractionContract = link.dataset.spwInteractionContract || semantics.contract;
  link.dataset.spwInteractionAffordance = link.dataset.spwInteractionAffordance || semantics.affordance;
  link.dataset.spwInteractionDestination = destination;
  link.dataset.spwInteractionScope = scope;
  link.dataset.spwOperatorReversibility = link.dataset.spwOperatorReversibility || semantics.reversibility;
  link.dataset.spwWonder = link.dataset.spwWonder || semantics.wonder;

  if (expression) {
    link.dataset.spwNavExpression = expression;
    link.dataset.spwSemanticExpression = link.dataset.spwSemanticExpression || `nav[${scope}]{${destination}}`;
  }

  if (operator) {
    link.dataset.spwOperator = link.dataset.spwOperator || operator;
    applyOperatorGeometryToElement(link, operator);
  }

  if (label && !link.getAttribute('aria-label')) {
    link.setAttribute('aria-label', `${label} — ${expression || 'route'}`);
  }
}

export function appendSpwExpressionRow(parent, expression = '') {
  if (!(parent instanceof HTMLElement)) return null;

  const parsed = parseSpwExpression(expression);
  if (!parsed.expression) return null;

  const row = document.createElement('span');
  row.className = 'spw-link-expression spw-route-menu-link-expression';

  if (parsed.prefix) {
    const prefix = document.createElement('span');
    prefix.className = 'spw-link-expression__prefix';
    prefix.setAttribute('aria-hidden', 'true');
    prefix.textContent = parsed.prefix;
    row.append(prefix);
  }

  const nucleus = document.createElement('span');
  nucleus.className = 'spw-link-expression__nucleus';
  nucleus.textContent = parsed.nucleus || parsed.expression;
  row.append(nucleus);

  if (parsed.operatorType) {
    row.dataset.spwOperator = parsed.operatorType;
    applyOperatorGeometryToElement(row, parsed.operatorType);
  }

  row.dataset.spwNavExpression = parsed.expression;
  parent.append(row);
  return row;
}

export function buildRouteMenuLink(route = {}) {
  const link = document.createElement('a');
  link.href = route.href || '/';
  link.className = 'spw-route-menu-link';
  link.dataset.spwNavToken = route.token || '';
  link.dataset.spwRouteMenuLink = 'true';

  const copy = document.createElement('span');
  copy.className = 'spw-route-menu-link-copy';

  appendSpwExpressionRow(copy, route.token);

  const title = document.createElement('span');
  title.className = 'spw-route-menu-link-label';
  title.textContent = route.label || '';
  copy.append(title);

  if (route.note) {
    const note = document.createElement('span');
    note.className = 'spw-route-menu-link-note';
    note.textContent = route.note;
    copy.append(note);
  }

  const token = document.createElement('span');
  token.className = 'spw-route-menu-link-token';
  token.setAttribute('aria-hidden', 'true');
  token.textContent = route.token || '';

  link.append(copy, token);

  const parsed = parseSpwExpression(route.token);
  applyInteractionSemanticsToLink(link, {
    destination: 'projection',
    operator: parsed.operatorType,
    expression: parsed.expression,
    scope: 'shell',
    label: route.label,
  });

  return link;
}