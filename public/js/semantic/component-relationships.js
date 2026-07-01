/**
 * component-relationships.js
 * ---------------------------------------------------------------------------
 * Infer primary route/operator relationships from component link anatomy.
 */

import { detectOperator } from '/public/js/kernel/shared.js';
import { humanizeToken, normalizeText, normalizeToken } from '/public/js/semantic/semantic-utils.js';

function normalizeSlug(value = '') {
  return humanizeToken(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toLocalUrl(href = '') {
  if (!href) return null;

  try {
    const url = new URL(href, document.baseURI);
    if (url.origin !== window.location.origin) return null;
    return url;
  } catch {
    return null;
  }
}

function collectRelationshipLinks(el) {
  const relations = [];
  const seen = new Set();
  const selectors = [
    ':scope > .frame-heading a[href]',
    ':scope > .frame-topline a[href]',
    ':scope > h1 a[href]',
    ':scope > h2 a[href]',
    ':scope > h3 a[href]',
    ':scope > strong a[href]',
    ':scope > [data-spw-slot="actions"] a[href]',
    ':scope > .frame-operators a[href]',
    ':scope > .card-sub-links a[href]',
    ':scope > a[href]',
  ];

  const pushLink = (link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.closest('[hidden], [aria-hidden="true"]')) return;

    const url = toLocalUrl(link.getAttribute('href') || '');
    if (!url) return;

    const key = `${url.pathname}${url.hash}`;
    if (seen.has(key)) return;
    seen.add(key);
    relations.push({ link, url, key });
  };

  if (el instanceof HTMLAnchorElement && el.hasAttribute('href')) {
    pushLink(el);
  }

  selectors.forEach((selector) => {
    el.querySelectorAll?.(selector).forEach(pushLink);
  });

  return relations;
}

function resolvePrimaryRelationship(el, relations) {
  if (!relations.length) return null;

  const preferredSelectors = [
    ':scope > .frame-heading a[href]',
    ':scope > .frame-topline a[href]',
    ':scope > h1 a[href]',
    ':scope > h2 a[href]',
    ':scope > h3 a[href]',
    ':scope > [data-spw-slot="actions"] a[href]',
    ':scope > .frame-operators a[href]',
    ':scope > .card-sub-links a[href]',
    ':scope > a[href]',
  ];

  if (el instanceof HTMLAnchorElement && el.hasAttribute('href')) {
    return relations[0];
  }

  for (const selector of preferredSelectors) {
    const match = el.querySelector?.(selector);
    if (!(match instanceof HTMLAnchorElement)) continue;
    const url = toLocalUrl(match.getAttribute('href') || '');
    if (!url) continue;
    const key = `${url.pathname}${url.hash}`;
    const relation = relations.find((entry) => entry.key === key);
    if (relation) return relation;
  }

  return relations[0];
}

export function describeRelationship(el) {
  const relations = collectRelationshipLinks(el);
  const branchCount = relations.length;
  const routeState = branchCount > 1 ? 'branching' : branchCount === 1 ? 'single' : 'none';
  const primary = resolvePrimaryRelationship(el, relations);

  if (!primary) {
    return {
      routeState,
      branchCount: '0',
      primaryOperator: '',
      primaryPrefix: '',
      primaryExpression: '',
      primaryLabel: '',
      routeMarker: '',
    };
  }

  const label = normalizeText(
    primary.link.dataset.spwNavLabel
    || primary.link.getAttribute('aria-label')
    || primary.link.textContent
    || '',
  );
  const explicitExpression = normalizeText(
    primary.link.dataset.spwNavExpression
    || primary.link.dataset.spwToken
    || primary.link.textContent
    || '',
  );
  const detected = detectOperator(explicitExpression) || detectOperator(label);
  const hashSlug = normalizeSlug(primary.url.hash.replace(/^#/, ''));
  const pathSlug = normalizeSlug(primary.url.pathname.split('/').filter(Boolean).pop() || 'home');
  const fallbackToken = primary.link.closest('.frame-operators')
    ? `?${hashSlug || pathSlug || 'branch'}`
    : `~${hashSlug || pathSlug || 'route'}`;
  const expression = explicitExpression && detectOperator(explicitExpression)
    ? explicitExpression
    : fallbackToken;
  const operator = detected?.type || detectOperator(expression)?.type || 'ref';
  const prefix = detected?.prefix || detectOperator(expression)?.prefix || '~';
  const routeMarker = branchCount > 1 ? `${prefix} {${branchCount}}` : prefix;

  return {
    routeState,
    branchCount: String(branchCount),
    primaryOperator: operator,
    primaryPrefix: prefix,
    primaryExpression: expression,
    primaryLabel: label,
    routeMarker,
  };
}