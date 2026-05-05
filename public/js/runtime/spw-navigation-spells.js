import { detectOperator } from '/public/js/kernel/spw-shared.js';

const TOKEN_SELECTOR = [
  '.header-sigil[href]',
  'header nav a[href]',
  '.page-index a[href]',
  '.section-atlas a[href]',
  '.card-sub-links a[href]',
  '.frame-operators a[href]',
  '.spw-route-menu-panel a[href]',
].join(', ');

const TOP_ROUTE_TOKENS = Object.freeze({
  '/': '#>home',
  '/about/': '.about',
  '/topics/': '<topics>',
  '/services/': '@services',
  '/tools/': '^tools',
  '/play/': '~play',
  '/blog/': '*blog',
  '/settings/': '=settings',
});

const GROUP_BY_SCOPE = Object.freeze({
  shell: 'routes',
  section: 'sections',
  card: 'branches',
  operator: 'operators',
  atlas: 'atlas',
});

const WONDER_BY_SCOPE = Object.freeze({
  shell: 'orientation',
  section: 'memory',
  card: 'resonance',
  operator: 'projection',
  atlas: 'comparison',
});

function normalizePathname(pathname = '') {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '/') || '/';
}

function normalizeSlug(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['".,!?()[\]/]+/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[–—-]+/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '') || 'token';
}

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
  if (scope === 'shell' && TOP_ROUTE_TOKENS[normalizedPath]) {
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

function applyNavigationSpellRecord(link, record) {
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
  });

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
  applyNavigationSpellRecord(link, record);
}

function applyTokens(root = document) {
  if (root instanceof Element && root.matches(TOKEN_SELECTOR)) {
    annotateLink(root);
  }

  root.querySelectorAll?.(TOKEN_SELECTOR).forEach((link) => annotateLink(link));
}

export function initSpwNavigationSpells() {
  if (document.body?.dataset?.spwNavigationSpellsInit === '1') {
    return { cleanup() {}, refresh() {} };
  }

  document.body.dataset.spwNavigationSpellsInit = '1';
  applyTokens(document);

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
    },
    refresh() {
      applyTokens(document);
    },
  };
}
