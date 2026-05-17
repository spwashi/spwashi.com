import { bus } from '/public/js/kernel/bus.js';
import { deriveSemanticBraceExpression } from '/public/js/semantic/semantic-braces.js';
import { humanizeToken, normalizeText, normalizeToken, unique } from '/public/js/semantic/semantic-utils.js';

const DEFAULT_SELECTOR = [
  '[data-spw-semantic-cluster]',
  '[data-spw-vocab]',
  '[data-spw-semantic-expression]',
  '[data-spw-topic]',
  '.spw-topic',
].join(', ');

const SOURCE_ATTRIBUTE = 'spwCrossrefSource';
const STATE_ATTRIBUTE = 'spwCrossref';

function splitTokens(value = '') {
  return normalizeText(value)
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
}

function getTopicToken(el) {
  if (!el) return '';
  const authored = normalizeText(el.dataset.spwTopic || '');
  const label = authored || normalizeText(el.textContent || '');
  return normalizeToken(label);
}

function getElementTokens(el) {
  if (!(el instanceof Element)) return [];

  const semantic = deriveSemanticBraceExpression(el);
  const tokens = [
    normalizeToken(el.dataset.spwVocab || ''),
    ...splitTokens(el.dataset.spwSemanticCluster || ''),
    semantic?.root || '',
    semantic?.variant || '',
    semantic?.behavior || '',
    semantic?.lens || '',
    getTopicToken(el),
  ];

  return unique(tokens);
}

function describeElement(el, tokens) {
  const semantic = deriveSemanticBraceExpression(el);
  const section = el.closest('[id]')?.id || '';
  const heading = el.closest('section, article, main')?.querySelector('h1, h2, h3')?.textContent || '';

  return {
    label: normalizeText(el.getAttribute('aria-label') || el.textContent || el.dataset.spwSemanticExpression || ''),
    section,
    heading: normalizeText(heading),
    semanticExpression: semantic?.key || normalizeText(el.dataset.spwSemanticExpression || ''),
    semanticRoot: semantic?.root || '',
    semanticVariant: semantic?.variant || '',
    semanticBehavior: semantic?.behavior || '',
    semanticLens: semantic?.lens || '',
    tokens,
  };
}

function collectCrossrefTargets(root, selector) {
  const scope = root?.querySelectorAll ? root : document;
  const nodes = Array.from(scope.querySelectorAll(selector));

  if (root instanceof Element && root.matches(selector)) {
    nodes.unshift(root);
  }

  return unique(nodes).filter((el) => getElementTokens(el).length > 0);
}

function buildRegistry(targets) {
  const byToken = new Map();
  const metadata = new Map();

  targets.forEach((el) => {
    const tokens = getElementTokens(el);
    metadata.set(el, describeElement(el, tokens));

    tokens.forEach((token) => {
      if (!byToken.has(token)) byToken.set(token, new Set());
      byToken.get(token).add(el);
    });
  });

  return { byToken, metadata, targets };
}

function clearState(root = document) {
  const html = document.documentElement;
  delete html.dataset.spwSemanticCrossref;
  delete html.dataset.spwSemanticCrossrefLabel;

  root.querySelectorAll?.('[data-spw-crossref], [data-spw-crossref-source]').forEach((el) => {
    delete el.dataset[STATE_ATTRIBUTE];
    delete el.dataset[SOURCE_ATTRIBUTE];
  });

  bus.emit('semantic-crossref:cleared', {});
}

function focusToken(registry, token, source = null) {
  const normalized = normalizeToken(token);
  if (!normalized) return [];

  clearState();

  const matches = Array.from(registry.byToken.get(normalized) || []);
  if (!matches.length) return [];

  const html = document.documentElement;
  html.dataset.spwSemanticCrossref = normalized;
  html.dataset.spwSemanticCrossrefLabel = humanizeToken(normalized);

  matches.forEach((el) => {
    el.dataset[STATE_ATTRIBUTE] = el === source ? 'source' : 'peer';
  });

  if (source instanceof Element) {
    source.dataset[SOURCE_ATTRIBUTE] = 'true';
  }

  bus.emit('semantic-crossref:focused', {
    token: normalized,
    count: matches.length,
    source,
    matches,
  });

  return matches;
}

function findPreferredToken(el, registry) {
  const tokens = getElementTokens(el);
  return tokens.find((token) => (registry.byToken.get(token)?.size || 0) > 1) || tokens[0] || '';
}

function installEventHandlers(registry) {
  const cleanups = [];
  let clearTimer = 0;

  const handleEnter = (event) => {
    const target = event.target?.closest?.(DEFAULT_SELECTOR);
    if (!target || !registry.metadata.has(target)) return;
    window.clearTimeout(clearTimer);
    const token = findPreferredToken(target, registry);
    focusToken(registry, token, target);
  };

  const scheduleClear = () => {
    window.clearTimeout(clearTimer);
    clearTimer = window.setTimeout(() => clearState(), 80);
  };

  document.addEventListener('pointerover', handleEnter);
  document.addEventListener('focusin', handleEnter);
  document.addEventListener('pointerout', scheduleClear);
  document.addEventListener('focusout', scheduleClear);

  cleanups.push(() => {
    window.clearTimeout(clearTimer);
    document.removeEventListener('pointerover', handleEnter);
    document.removeEventListener('focusin', handleEnter);
    document.removeEventListener('pointerout', scheduleClear);
    document.removeEventListener('focusout', scheduleClear);
    clearState();
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function installConsoleApi(registry) {
  if (typeof window === 'undefined') return;

  const api = {
    clear: () => clearState(),
    focus: (token) => focusToken(registry, token),
    list: () => {
      const result = {};
      registry.byToken.forEach((set, token) => {
        result[token] = Array.from(set).map((el) => registry.metadata.get(el));
      });
      return result;
    },
    tokens: () => Array.from(registry.byToken.keys()).sort(),
  };

  window.spwSemanticCrossrefs = api;

  const siteApi = window.__SPW_SITE__ || {};
  const inspect = siteApi.inspect || {};
  window.__SPW_SITE__ = {
    ...siteApi,
    inspect: {
      ...inspect,
      semanticCrossrefs: api,
    },
  };

  // `window.spwCompose` is intentionally frozen by the runtime console. Keep this
  // API separate so extensions can opt in without mutating the console contract.
}

export function initSpwSemanticCrossrefs(options = {}) {
  const root = options.root || document;
  const selector = options.selector || DEFAULT_SELECTOR;
  const targets = collectCrossrefTargets(root, selector);

  if (!targets.length) return null;

  const registry = buildRegistry(targets);
  installConsoleApi(registry);
  return installEventHandlers(registry);
}
