import {
  applyInteractionSemanticsToLink,
  applyOperatorGeometryToElement,
  parseSpwExpression,
} from '/public/js/semantic/link-copy.js';
import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';
import { detectOperator } from '/public/js/kernel/shared.js';
import { normalizePathname } from '/public/js/kernel/route-utils.js';
import { navSlug as normalizeSlug } from '/public/js/kernel/text-normalization.js';

const TOKEN_SELECTOR = [
  '.header-sigil[href]',
  'body > header nav a[href]',
  '.site-header nav a[href]',
  '.site-footer__nav a[href]',
  '.site-footer__brand[href]',
  '.page-index a[href]',
  '.section-atlas a[href]',
  '.card-sub-links a[href]',
  '.frame-operators a[href]',
  '.spw-route-menu-link[href]',
  '.spw-chip[href]',
  '[data-spw-operator][href]',
  '.frame-sigil[href]',
  '.syntax-token[href]',
].join(', ');

const TOP_ROUTE_TOKENS = Object.freeze({
  '/': '#>home',
  '/about/': '.about',
  '/design/': '#>design',
  '/now/': '@now',
  '/topics/': '<topics>',
  '/topics/software/': '<software>',
  '/topics/craft/': '<craft>',
  '/services/': '@services',
  '/tools/': '^tools',
  '/play/': '~play',
  '/blog/': '*blog',
  '/contact/': '@contact',
  '/privacy/': '.privacy',
  '/settings/': '=settings',
});

const GROUP_BY_SCOPE = Object.freeze({
  shell: 'routes',
  footer: 'routes',
  section: 'sections',
  card: 'branches',
  operator: 'operators',
  atlas: 'atlas',
});

const WONDER_BY_SCOPE = Object.freeze({
  shell: 'orientation',
  footer: 'orientation',
  section: 'memory',
  card: 'resonance',
  operator: 'projection',
  atlas: 'comparison',
});

function getVisibleLabel(link) {
  if (!(link instanceof Element)) return '';
  return (
    link.dataset.spwNavLabel
    || link.getAttribute('aria-label')
    || link.querySelector('.spw-route-menu-link-label')?.textContent
    || link.textContent
    || ''
  ).replace(/\s+/g, ' ').trim();
}

function getScope(link) {
  if (link.matches('.header-sigil')) return 'shell';
  if (link.closest('body > header nav, .site-header nav')) return 'shell';
  if (link.closest('.site-footer__nav')) return 'footer';
  if (link.closest('.page-index')) return 'section';
  if (link.closest('.section-atlas')) return 'atlas';
  if (link.closest('.card-sub-links')) return 'card';
  if (link.closest('.frame-operators')) return 'operator';
  if (link.closest('.spw-route-menu-panel')) return 'shell';
  return 'section';
}

function resolveDestination(url) {
  const currentPath = normalizePathname(window.location.pathname);
  const nextPath = normalizePathname(url.pathname);

  if (url.hash && nextPath === currentPath) {
    return 'scope';
  }

  if (nextPath === currentPath && !url.hash) {
    return 'settle';
  }

  if (nextPath !== currentPath || !url.hash) {
    return 'projection';
  }

  return 'settle';
}

function resolvePostfix(destination, baseToken = '') {
  if (baseToken.startsWith('<') && baseToken.endsWith('>')) return '';
  switch (destination) {
    case 'scope':
      return '{';
    case 'projection':
      return '>';
    default:
      return '.';
  }
}

function resolveBaseToken(link, url, scope, label) {
  const explicit = link.dataset.spwToken || link.dataset.spwNavToken || '';
  if (explicit) return explicit.trim();

  const visible = getVisibleLabel(link);
  const detected = detectOperator(visible);
  if (detected) {
    return visible.trim();
  }

  const normalizedPath = normalizePathname(url.pathname);
  if ((scope === 'shell' || scope === 'footer') && TOP_ROUTE_TOKENS[normalizedPath]) {
    return TOP_ROUTE_TOKENS[normalizedPath];
  }

  const hashSlug = url.hash ? normalizeSlug(url.hash.slice(1)) : '';
  const labelSlug = normalizeSlug(label);
  const targetSlug = hashSlug || labelSlug || normalizeSlug(normalizedPath.split('/').filter(Boolean).pop());

  switch (scope) {
    case 'section':
      return `~${targetSlug}`;
    case 'card':
      return `~${targetSlug}`;
    case 'operator':
      return `?${targetSlug}`;
    case 'atlas':
      return `&${targetSlug}`;
    case 'shell':
      return `~${targetSlug}`;
    default:
      return `~${targetSlug}`;
  }
}

function resolvePrefix(baseToken = '') {
  const detected = detectOperator(baseToken);
  return detected?.prefix || baseToken.match(/^(#>|#:|\.|\^|~|\?|@|\*|&|=|\$|%|!|>|<)/)?.[0] || '~';
}

function resolveOperatorType(baseToken = '', scope = 'section') {
  const detected = detectOperator(baseToken);
  if (detected) return detected.type;

  switch (scope) {
    case 'shell':
    case 'footer':
      return 'ref';
    case 'section':
    case 'card':
      return 'ref';
    case 'operator':
      return 'probe';
    case 'atlas':
      return 'merge';
    default:
      return 'ref';
  }
}

function createExpression(baseToken, postfix) {
  if (!postfix) return baseToken;
  if (baseToken.startsWith('<') && baseToken.endsWith('>')) return baseToken;
  return `${baseToken}${postfix}`;
}

function buildGroundKey(url, scope) {
  const pathname = normalizePathname(url.pathname);
  const hash = url.hash || '';
  return `global:nav:${scope}:${pathname}${hash}`;
}

function describeExpression(expression, destination, scope) {
  const direction = destination === 'scope'
    ? 'enters a local scope'
    : destination === 'settle'
      ? 'returns to the current surface'
      : 'projects into another surface';
  return `${expression} · ${direction} as ${scope} · ground to replay`;
}

function buildNavigationSpellRecord(link, url) {
  const scope = getScope(link);
  const label = getVisibleLabel(link);
  const baseToken = resolveBaseToken(link, url, scope, label);
  const prefix = resolvePrefix(baseToken);
  const destination = resolveDestination(url);
  const postfix = resolvePostfix(destination, baseToken);
  const operator = resolveOperatorType(baseToken, scope);
  const expression = createExpression(baseToken, postfix);
  const isGroundable = !link.matches('.header-sigil');

  return {
    scope,
    label,
    baseToken,
    prefix,
    destination,
    postfix,
    operator,
    expression,
    groundKey: buildGroundKey(url, scope),
    isGroundable,
    groundable: isGroundable ? 'true' : 'false',
    title: describeExpression(expression, destination, scope),
  };
}

function setLinkDataset(link, entries = {}) {
  Object.entries(entries).forEach(([key, value]) => {
    if (value == null || value === '') {
      delete link.dataset[key];
      return;
    }
    link.dataset[key] = String(value);
  });
}

function applyNavigationSpellRecord(link, record, url) {
  setLinkDataset(link, {
    spwNavTokenized: 'true',
    spwGroundable: record.groundable,
    spwOperator: link.dataset.spwOperator || record.operator,
    spwWonder: link.dataset.spwWonder || WONDER_BY_SCOPE[record.scope] || 'orientation',
    spwAffordance: link.dataset.spwAffordance || 'navigate ground replay',
    spwNavScope: record.scope,
    spwNavDestination: record.destination,
    spwNavPrefix: record.prefix,
    spwNavPostfix: record.postfix,
    spwNavExpression: record.expression,
    spwNavToken: link.dataset.spwNavToken || record.baseToken,
  });

  applyInteractionSemanticsToLink(link, {
    destination: record.destination,
    operator: record.operator,
    expression: record.expression,
    scope: record.scope,
    label: record.label,
  });
  applyOperatorGeometryToElement(link, record.operator);

  if (record.isGroundable) {
    setLinkDataset(link, {
      spwGroundKey: record.groundKey,
      spwGroundLabel: record.label || record.expression,
      spwGroundExpression: record.expression,
      spwGroundPrefix: record.prefix,
      spwGroundPostfix: record.postfix,
      spwGroundSubstrate: record.operator,
      spwGroundGroup: GROUP_BY_SCOPE[record.scope] || record.scope,
    });
  } else {
    setLinkDataset(link, {
      spwGroundKey: '',
      spwGroundLabel: '',
      spwGroundExpression: '',
      spwGroundPrefix: '',
      spwGroundPostfix: '',
      spwGroundSubstrate: '',
      spwGroundGroup: '',
    });
  }

  if (!link.title) {
    link.title = record.title;
  }

  if (link.matches('.spw-route-menu-link') && !link.querySelector('.spw-link-expression')) {
    const copy = link.querySelector('.spw-route-menu-link-copy');
    if (copy instanceof HTMLElement) {
      const parsed = parseSpwExpression(record.expression);
      const expressionRow = document.createElement('span');
      expressionRow.className = 'spw-link-expression spw-route-menu-link-expression';
      if (parsed.prefix) {
        const prefix = document.createElement('span');
        prefix.className = 'spw-link-expression__prefix';
        prefix.setAttribute('aria-hidden', 'true');
        prefix.textContent = parsed.prefix;
        expressionRow.append(prefix);
      }
      const nucleus = document.createElement('span');
      nucleus.className = 'spw-link-expression__nucleus';
      nucleus.textContent = parsed.nucleus || parsed.expression;
      expressionRow.append(nucleus);
      copy.prepend(expressionRow);
    }
  }

  /* ARIA hygiene (gesture-aria-hygiene/FIX.md) — idempotent via data-spw-nav-tokenized guard in caller. */
  const currentPath = normalizePathname(window.location.pathname);
  const linkUrl = url instanceof URL ? url : new URL(link.href, window.location.href);
  const linkPath = normalizePathname(linkUrl.pathname);

  const isCurrentPage = linkPath === currentPath && !linkUrl.hash;
  if (isCurrentPage && !link.hasAttribute('aria-current')) {
    link.setAttribute('aria-current', 'page');
  } else if (!isCurrentPage && link.getAttribute('aria-current') === 'page') {
    link.removeAttribute('aria-current');
  }

  // Operator-prefixed visible text is often opaque to AT. Provide descriptive aria-label when helpful.
  const hasOperatorPrefix = /^[#>^~?@*<&=$.!%]./.test(link.textContent.trim());
  if (hasOperatorPrefix && record.label && record.label !== link.getAttribute('aria-label')) {
    // Avoid clobbering an author-provided descriptive label
    const existing = link.getAttribute('aria-label') || '';
    if (!existing || existing.length < 4) {
      link.setAttribute('aria-label', record.label);
      // Hide the raw operator prefix from AT while keeping it in the visual tree (safe single pass)
      const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
      let textNode = walker.nextNode();
      if (textNode) {
        const prefixMatch = textNode.textContent.match(/^([#>^~?@*<&=$.!%]+[\w-]*)/);
        if (prefixMatch) {
          const span = document.createElement('span');
          span.setAttribute('aria-hidden', 'true');
          span.textContent = prefixMatch[1];
          const restText = textNode.textContent.slice(prefixMatch[1].length);
          textNode.replaceWith(span);
          if (restText) {
            span.after(document.createTextNode(restText));
          }
        }
      }
    }
  }

  // Reversibility hint (only when author has not already declared one)
  if (!link.dataset.spwOperatorReversibility) {
    if (record.destination === 'projection') {
      link.dataset.spwOperatorReversibility = 'reversible';
    } else if (record.destination === 'scope') {
      link.dataset.spwOperatorReversibility = 'inspectable';
    } else if (record.destination === 'settle') {
      link.dataset.spwOperatorReversibility = 'replayable';
    }
  }
}

function isShellNavLink(link) {
  return Boolean(link.closest('body > header nav, .site-header nav'));
}

function isReaderDisplayLayer() {
  return (document.body?.dataset?.spwDisplayLayer || 'reader') === 'reader';
}

function annotateLink(link) {
  if (!(link instanceof HTMLAnchorElement)) return;
  if (link.closest('[data-spw-nav-tokenized="false"]')) return;

  let url;
  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return;
  }

  if (url.origin !== window.location.origin) return;

  const record = buildNavigationSpellRecord(link, url);
  const shellReader = isShellNavLink(link) && isReaderDisplayLayer();

  /*
   * Shell nav first-paint is the contracted look. In the reader layer we
   * still write inspect datasets, but we do not paint prefixes or operator
   * geometry — those attrs are what overflowed the authored list after idle.
   */
  if (shellReader) {
    applyNavigationSpellRecord(link, {
      ...record,
      isGroundable: false,
    }, url);
    link.dataset.spwNavTokenized = 'inspect';
    delete link.dataset.spwOperatorGeometry;
    return;
  }

  applyNavigationSpellRecord(link, record, url);
}

function markHeaderNavAnnotated() {
  const header = document.querySelector('body > header, .site-header');
  if (!(header instanceof HTMLElement)) return;
  if (!header.dataset.spwNavVisual) header.dataset.spwNavVisual = 'authored';
  const prior = new Set((header.dataset.spwNavAnnotatedBy || '').split(/\s+/).filter(Boolean));
  prior.add('navigation-spells');
  header.dataset.spwNavAnnotatedBy = [...prior].join(' ');
}

function applyTokens(root = document) {
  if (root instanceof Element && root.matches(TOKEN_SELECTOR)) {
    annotateLink(root);
  }

  root.querySelectorAll?.(TOKEN_SELECTOR).forEach((link) => annotateLink(link));
  markHeaderNavAnnotated();
}

function syncSectionLocomotionExpression(detail = {}) {
  const html = document.documentElement;
  const sectionId = detail.currentId || '';
  if (!sectionId) {
    writeDatasetValue(html, 'spwNavExpression', null);
    return;
  }

  const hashLinks = document.querySelectorAll(
    `a[href="#${CSS.escape(sectionId)}"], a[href$="#${CSS.escape(sectionId)}"]`
  );
  hashLinks.forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    link.dataset.spwNavSectionCurrent = 'true';
    link.dataset.spwNavExpression = detail.currentToken
      ? `${detail.currentToken} ${detail.currentLabel || sectionId}`
      : (detail.currentLabel || sectionId);
  });

  document.querySelectorAll('[data-spw-nav-section-current="true"]').forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    const href = link.getAttribute('href') || '';
    if (!href.endsWith(`#${sectionId}`)) {
      delete link.dataset.spwNavSectionCurrent;
    }
  });

  writeDatasetValue(html, 'spwNavExpression', detail.currentToken
    ? `${detail.currentToken} · ${detail.currentLabel || sectionId}`
    : (detail.currentLabel || sectionId));
}

export function initSpwNavigationSpells() {
  if (document.body?.dataset?.spwNavigationSpellsInit === '1') {
    return { cleanup() {}, refresh() {} };
  }

  document.body.dataset.spwNavigationSpellsInit = '1';
  applyTokens(document);

  const onSectionLocomotion = (event) => {
    syncSectionLocomotionExpression(event?.detail || {});
    if (event?.detail?.phase === 'settled') {
      applyTokens(document);
    }
  };
  const onNavigationRefresh = () => applyTokens(document);

  document.addEventListener('spw:section-locomotion-state', onSectionLocomotion);
  document.addEventListener('spw:navigation-refresh', onNavigationRefresh);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        applyTokens(node);
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return {
    cleanup() {
      observer.disconnect();
      document.removeEventListener('spw:section-locomotion-state', onSectionLocomotion);
      document.removeEventListener('spw:navigation-refresh', onNavigationRefresh);
    },
    refresh() {
      applyTokens(document);
    },
  };
}
